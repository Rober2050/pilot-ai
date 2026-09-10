/**
 * Enterprise-Grade Request Queue Service
 * 
 * Features:
 * - Exponential backoff retry strategy
 * - Circuit breaker pattern (prevents cascading failures)
 * - Request prioritization (critical requests first)
 * - Comprehensive logging and monitoring
 * - Graceful degradation
 * 
 * This service ensures the application remains responsive even under:
 * - API rate limits (429 errors)
 * - Network failures
 * - High concurrent load
 * 
 * @author PILOTAI Architecture Team
 * @version 2.0.0
 */

export interface QueuedRequest<T> {
    id: string;
    fn: () => Promise<T>;
    priority: RequestPriority;
    retries: number;
    maxRetries: number;
    createdAt: number;
    resolve: (value: T) => void;
    reject: (error: any) => void;
}

export enum RequestPriority {
    CRITICAL = 0,  // User-facing, interactive requests
    HIGH = 1,      // Important background tasks
    NORMAL = 2,    // Standard requests
    LOW = 3        // Analytics, logging, etc.
}

export interface QueueMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    retriedRequests: number;
    averageWaitTime: number;
    currentQueueSize: number;
    circuitBreakerOpen: boolean;
}

export class RequestQueue {
    private queue: Array<QueuedRequest<any>> = [];
    private processing = 0;
    private requestCounter = 0;

    // Configuration
    private readonly maxConcurrent: number;
    private readonly retryDelays: number[];
    private readonly circuitBreakerThreshold: number;
    private readonly circuitBreakerResetTime: number;

    // Circuit Breaker State
    private consecutiveFailures = 0;
    private circuitBreakerOpen = false;
    private circuitBreakerOpenedAt = 0;

    // Metrics
    private metrics: QueueMetrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        retriedRequests: 0,
        averageWaitTime: 0,
        currentQueueSize: 0,
        circuitBreakerOpen: false
    };

    constructor(config?: {
        maxConcurrent?: number;
        retryDelays?: number[];
        circuitBreakerThreshold?: number;
        circuitBreakerResetTime?: number;
    }) {
        this.maxConcurrent = config?.maxConcurrent ?? 5;
        this.retryDelays = config?.retryDelays ?? [1000, 2000, 4000, 8000]; // Exponential backoff
        this.circuitBreakerThreshold = config?.circuitBreakerThreshold ?? 5;
        this.circuitBreakerResetTime = config?.circuitBreakerResetTime ?? 30000; // 30s
    }

    /**
     * Enqueue a request with priority and automatic retry
     */
    async enqueue<T>(
        fn: () => Promise<T>,
        priority: RequestPriority = RequestPriority.NORMAL,
        maxRetries?: number
    ): Promise<T> {
        const requestId = `req_${++this.requestCounter}_${Date.now()}`;
        const createdAt = Date.now();

        this.metrics.totalRequests++;

        return new Promise<T>((resolve, reject) => {
            const request: QueuedRequest<T> = {
                id: requestId,
                fn,
                priority,
                retries: 0,
                maxRetries: maxRetries ?? this.retryDelays.length,
                createdAt,
                resolve,
                reject
            };

            // Insert based on priority (lower number = higher priority)
            const insertIndex = this.queue.findIndex(r => r.priority > priority);
            if (insertIndex === -1) {
                this.queue.push(request);
            } else {
                this.queue.splice(insertIndex, 0, request);
            }

            this.metrics.currentQueueSize = this.queue.length;

            console.log(`[RequestQueue] Enqueued ${requestId} (priority: ${RequestPriority[priority]}, queue size: ${this.queue.length})`);

            this.processQueue();
        });
    }

    /**
     * Process queued requests with concurrency control
     */
    private async processQueue() {
        // Check circuit breaker
        if (this.circuitBreakerOpen) {
            const now = Date.now();
            if (now - this.circuitBreakerOpenedAt > this.circuitBreakerResetTime) {
                console.log('[RequestQueue] Circuit breaker reset, attempting to close...');
                this.circuitBreakerOpen = false;
                this.consecutiveFailures = 0;
                this.metrics.circuitBreakerOpen = false;
            } else {
                console.warn('[RequestQueue] Circuit breaker OPEN, requests paused');
                return;
            }
        }

        while (this.queue.length > 0 && this.processing < this.maxConcurrent) {
            const request = this.queue.shift();
            if (!request) continue;

            this.metrics.currentQueueSize = this.queue.length;
            this.processing++;

            this.executeRequest(request)
                .finally(() => {
                    this.processing--;
                    this.processQueue();
                });
        }
    }

    /**
     * Execute a single request with retry logic
     */
    private async executeRequest<T>(request: QueuedRequest<T>) {
        const { id, fn, retries, maxRetries, createdAt } = request;

        try {
            console.log(`[RequestQueue] Executing ${id} (attempt ${retries + 1}/${maxRetries + 1})`);

            const result = await fn();

            // Success
            const waitTime = Date.now() - createdAt;
            this.updateMetrics('success', waitTime);
            this.consecutiveFailures = 0; // Reset circuit breaker

            console.log(`[RequestQueue] ✓ ${id} completed in ${waitTime}ms`);
            request.resolve(result);

        } catch (error: any) {
            const is429 = this.isRateLimitError(error);
            const isNetworkError = this.isNetworkError(error);
            const shouldRetry = (is429 || isNetworkError) && retries < maxRetries;

            if (shouldRetry) {
                // Retry with exponential backoff
                const delay = this.retryDelays[retries] || this.retryDelays[this.retryDelays.length - 1];

                console.warn(`[RequestQueue] ${id} failed (${error.message}), retrying in ${delay}ms...`);
                this.metrics.retriedRequests++;

                await new Promise(resolve => setTimeout(resolve, delay));

                // Re-enqueue with incremented retry count
                request.retries++;
                this.queue.unshift(request); // High priority for retries
                this.processQueue();

            } else {
                // Final failure
                this.updateMetrics('failure', Date.now() - createdAt);
                this.consecutiveFailures++;

                // Check circuit breaker threshold
                if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
                    this.openCircuitBreaker();
                }

                console.error(`[RequestQueue] ✗ ${id} failed permanently:`, error.message);
                request.reject(error);
            }
        }
    }

    /**
     * Open circuit breaker to prevent cascading failures
     */
    private openCircuitBreaker() {
        this.circuitBreakerOpen = true;
        this.circuitBreakerOpenedAt = Date.now();
        this.metrics.circuitBreakerOpen = true;

        console.error(`[RequestQueue] 🔴 CIRCUIT BREAKER OPENED (${this.consecutiveFailures} consecutive failures)`);
        console.error(`[RequestQueue] Requests paused for ${this.circuitBreakerResetTime / 1000}s`);

        // Schedule automatic retry
        setTimeout(() => {
            console.log('[RequestQueue] Circuit breaker attempting to close...');
            this.processQueue();
        }, this.circuitBreakerResetTime);
    }

    /**
     * Check if error is a rate limit (429)
     */
    private isRateLimitError(error: any): boolean {
        return (
            error?.status === 429 ||
            error?.message?.includes('429') ||
            error?.message?.toLowerCase().includes('rate limit') ||
            error?.message?.toLowerCase().includes('resource exhausted')
        );
    }

    /**
     * Check if error is a network error
     */
    private isNetworkError(error: any): boolean {
        return (
            error?.message?.toLowerCase().includes('network') ||
            error?.message?.toLowerCase().includes('fetch') ||
            error?.message?.toLowerCase().includes('timeout') ||
            error?.code === 'ECONNREFUSED' ||
            error?.code === 'ETIMEDOUT'
        );
    }

    /**
     * Update metrics
     */
    private updateMetrics(result: 'success' | 'failure', waitTime: number) {
        if (result === 'success') {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }

        // Update average wait time (rolling average)
        const totalCompleted = this.metrics.successfulRequests + this.metrics.failedRequests;
        this.metrics.averageWaitTime =
            (this.metrics.averageWaitTime * (totalCompleted - 1) + waitTime) / totalCompleted;
    }

    /**
     * Get current metrics
     */
    getMetrics(): QueueMetrics {
        return { ...this.metrics };
    }

    /**
     * Clear queue (emergency use only)
     */
    clearQueue() {
        console.warn('[RequestQueue] ⚠️ Queue cleared manually');
        this.queue.forEach(req => {
            req.reject(new Error('Queue cleared'));
        });
        this.queue = [];
        this.metrics.currentQueueSize = 0;
    }

    /**
     * Reset circuit breaker manually
     */
    resetCircuitBreaker() {
        console.log('[RequestQueue] Circuit breaker reset manually');
        this.circuitBreakerOpen = false;
        this.consecutiveFailures = 0;
        this.metrics.circuitBreakerOpen = false;
        this.processQueue();
    }
}

// Singleton instance for global use
export const globalRequestQueue = new RequestQueue({
    maxConcurrent: 5,
    retryDelays: [1000, 2000, 4000, 8000],
    circuitBreakerThreshold: 5,
    circuitBreakerResetTime: 30000
});
