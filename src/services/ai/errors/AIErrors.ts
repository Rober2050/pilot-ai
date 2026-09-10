export enum AIErrorCategory {
    AUTHENTICATION = 'AUTHENTICATION',
    RATE_LIMIT = 'RATE_LIMIT',
    QUOTA = 'QUOTA',
    TIMEOUT = 'TIMEOUT',
    INVALID_RESPONSE = 'INVALID_RESPONSE',
    TRUNCATED_RESPONSE = 'TRUNCATED_RESPONSE',
    NETWORK = 'NETWORK',
    UNKNOWN = 'UNKNOWN'
}

export class AIProviderError extends Error {
    constructor(
        message: string,
        public category: AIErrorCategory,
        public provider: string,
        public originalError?: any
    ) {
        super(message);
        this.name = 'AIProviderError';
    }
}

export class AIRateLimitError extends AIProviderError {
    constructor(provider: string, originalError?: any) {
        super('Rate limit exceeded', AIErrorCategory.RATE_LIMIT, provider, originalError);
        this.name = 'AIRateLimitError';
    }
}

export class AIAuthenticationError extends AIProviderError {
    constructor(provider: string, originalError?: any) {
        super('Authentication failed', AIErrorCategory.AUTHENTICATION, provider, originalError);
        this.name = 'AIAuthenticationError';
    }
}

export class AITimeoutError extends AIProviderError {
    constructor(provider: string, originalError?: any) {
        super('Request timed out', AIErrorCategory.TIMEOUT, provider, originalError);
        this.name = 'AITimeoutError';
    }
}

export class AIInvalidResponseError extends AIProviderError {
    constructor(provider: string, message: string, originalError?: any) {
        super(message, AIErrorCategory.INVALID_RESPONSE, provider, originalError);
        this.name = 'AIInvalidResponseError';
    }
}

export class AITruncatedResponseError extends AIProviderError {
    constructor(provider: string, originalError?: any) {
        super('Response was truncated mid-generation — retrying', AIErrorCategory.TRUNCATED_RESPONSE, provider, originalError);
        this.name = 'AITruncatedResponseError';
    }
}
