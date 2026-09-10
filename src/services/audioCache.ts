import { AudioCacheEntry } from '../types/voice';
import { CACHE_CONFIG } from '../config/voiceConfig';

/**
 * Audio Cache Service using IndexedDB
 * Stores audio blobs to avoid redundant TTS API calls
 */
class AudioCacheService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    constructor() {
        this.initPromise = this.init();
    }

    /**
     * Initialize IndexedDB
     */
    private async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(CACHE_CONFIG.dbName, 1);

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ [AUDIO CACHE] IndexedDB initialized');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                if (!db.objectStoreNames.contains(CACHE_CONFIG.storeName)) {
                    const objectStore = db.createObjectStore(CACHE_CONFIG.storeName, { keyPath: 'key' });
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('roleId', 'roleId', { unique: false });
                    console.log('✅ [AUDIO CACHE] Object store created');
                }
            };
        });
    }

    /**
     * Generate cache key from text, roleId, and language
     */
    private generateKey(text: string, roleId: string, language: string): string {
        const normalized = text.trim().toLowerCase();
        const hash = this.simpleHash(normalized + roleId + language);
        return `${roleId}_${language}_${hash}`;
    }

    /**
     * Simple hash function for cache keys
     */
    private simpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Get audio from cache
     */
    async get(text: string, roleId: string, language: string): Promise<Blob | null> {
        await this.initPromise;

        if (!this.db) {
            console.warn('⚠️ [AUDIO CACHE] Database not initialized');
            return null;
        }

        const key = this.generateKey(text, roleId, language);

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([CACHE_CONFIG.storeName], 'readonly');
            const objectStore = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = objectStore.get(key);

            request.onsuccess = () => {
                const entry: AudioCacheEntry | undefined = request.result;

                if (!entry) {
                    console.log(`🔍 [AUDIO CACHE] Cache MISS for key: ${key}`);
                    resolve(null);
                    return;
                }

                // Check if entry is expired
                const now = Date.now();
                const expirationMs = CACHE_CONFIG.expirationDays * 24 * 60 * 60 * 1000;

                if (now - entry.timestamp > expirationMs) {
                    console.log(`⏰ [AUDIO CACHE] Entry expired for key: ${key}`);
                    this.delete(key);
                    resolve(null);
                    return;
                }

                console.log(`✅ [AUDIO CACHE] Cache HIT for key: ${key}`);
                resolve(entry.audioBlob);
            };

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Error reading from cache:', request.error);
                resolve(null);
            };
        });
    }

    /**
     * Store audio in cache
     */
    async set(text: string, roleId: string, language: string, audioBlob: Blob): Promise<void> {
        await this.initPromise;

        if (!this.db) {
            console.warn('⚠️ [AUDIO CACHE] Database not initialized');
            return;
        }

        const key = this.generateKey(text, roleId, language);
        const textHash = this.simpleHash(text);

        const entry: AudioCacheEntry = {
            key,
            audioBlob,
            timestamp: Date.now(),
            language: language as 'es' | 'en',
            roleId,
            textHash
        };

        // Check cache size before adding
        await this.enforceMaxSize();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([CACHE_CONFIG.storeName], 'readwrite');
            const objectStore = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = objectStore.put(entry);

            request.onsuccess = () => {
                console.log(`💾 [AUDIO CACHE] Stored audio for key: ${key}`);
                resolve();
            };

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Error storing audio:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Delete entry from cache
     */
    private async delete(key: string): Promise<void> {
        if (!this.db) return;

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([CACHE_CONFIG.storeName], 'readwrite');
            const objectStore = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = objectStore.delete(key);

            request.onsuccess = () => {
                console.log(`🗑️ [AUDIO CACHE] Deleted entry: ${key}`);
                resolve();
            };

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Error deleting entry:', request.error);
                resolve();
            };
        });
    }

    /**
     * Enforce maximum cache size by deleting oldest entries
     */
    private async enforceMaxSize(): Promise<void> {
        if (!this.db) return;

        const size = await this.getCacheSize();

        if (size <= CACHE_CONFIG.maxSizeBytes) {
            return;
        }

        console.log(`⚠️ [AUDIO CACHE] Cache size (${(size / 1024 / 1024).toFixed(2)} MB) exceeds limit, cleaning...`);

        // Get all entries sorted by timestamp (oldest first)
        const entries = await this.getAllEntries();
        entries.sort((a, b) => a.timestamp - b.timestamp);

        // Delete oldest entries until under limit
        let currentSize = size;
        for (const entry of entries) {
            if (currentSize <= CACHE_CONFIG.maxSizeBytes * 0.8) { // Keep 80% of max
                break;
            }

            await this.delete(entry.key);
            currentSize -= entry.audioBlob.size;
        }

        console.log(`✅ [AUDIO CACHE] Cache cleaned, new size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);
    }

    /**
     * Get total cache size in bytes
     */
    private async getCacheSize(): Promise<number> {
        if (!this.db) return 0;

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([CACHE_CONFIG.storeName], 'readonly');
            const objectStore = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                const entries: AudioCacheEntry[] = request.result;
                const totalSize = entries.reduce((sum, entry) => sum + entry.audioBlob.size, 0);
                resolve(totalSize);
            };

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Error calculating cache size:', request.error);
                resolve(0);
            };
        });
    }

    /**
     * Get all cache entries
     */
    private async getAllEntries(): Promise<AudioCacheEntry[]> {
        if (!this.db) return [];

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([CACHE_CONFIG.storeName], 'readonly');
            const objectStore = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Error getting all entries:', request.error);
                resolve([]);
            };
        });
    }

    /**
     * Clear all cache
     */
    async clear(): Promise<void> {
        await this.initPromise;

        if (!this.db) return;

        return new Promise((resolve) => {
            const transaction = this.db!.transaction([CACHE_CONFIG.storeName], 'readwrite');
            const objectStore = transaction.objectStore(CACHE_CONFIG.storeName);
            const request = objectStore.clear();

            request.onsuccess = () => {
                console.log('🗑️ [AUDIO CACHE] Cache cleared');
                resolve();
            };

            request.onerror = () => {
                console.error('❌ [AUDIO CACHE] Error clearing cache:', request.error);
                resolve();
            };
        });
    }

    /**
     * Get cache statistics
     */
    async getStats(): Promise<{ count: number; sizeBytes: number; sizeMB: number }> {
        const entries = await this.getAllEntries();
        const sizeBytes = entries.reduce((sum, entry) => sum + entry.audioBlob.size, 0);

        return {
            count: entries.length,
            sizeBytes,
            sizeMB: sizeBytes / 1024 / 1024
        };
    }
}

// Export singleton instance
export const audioCache = new AudioCacheService();
