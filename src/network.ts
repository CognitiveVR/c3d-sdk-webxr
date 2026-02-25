import { fetch, isBrowser } from './utils/environment';
import Core from './core';

export interface QuestionSet {
    id: string;
    [key: string]: unknown;
}

interface CachedRequest {
    id?: number; // Auto-incremented by IndexedDB
    suburl: string;
    content: object;
    timestamp: number;
    sceneId: string;
    versionNumber: string;
}

class Network {
    private core: typeof Core;
    private readonly DB_NAME = 'C3D_OfflineDB';
    private readonly STORE_NAME = 'network_queue';
    private readonly DB_VERSION = 1;

    constructor(core: typeof Core) {
        this.core = core;

        if (isBrowser && window) {
            window.addEventListener('online', () => {
                console.log('[C3D] Connection restored. Flushing IndexedDB queue...');
                this.flushQueue();
            });
        }
    }

    isOnline(): boolean {
        if (isBrowser && navigator && typeof navigator.onLine === 'boolean') {
            return navigator.onLine;
        }
        return true;
    }

    /**
     * Helper to open IndexedDB
     */
    private getDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            if (!isBrowser || !window.indexedDB) {
                reject('IndexedDB not supported');
                return;
            }
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            
            request.onupgradeneeded = () => {
                if (!request.result.objectStoreNames.contains(this.STORE_NAME)) {
                    request.result.createObjectStore(this.STORE_NAME, { keyPath: 'id', autoIncrement: true });
                }
            };
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Save failed request to IndexedDB
     */
    private async cacheRequest(suburl: string, content: object): Promise<void> {
        try {
            const db = await this.getDB();
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const payload: CachedRequest = {
                suburl,
                content,
                timestamp: Date.now(),
                sceneId: this.core.sceneData.sceneId,
                versionNumber: this.core.sceneData.versionNumber
            };
            
            store.add(payload);
            console.log('[C3D] Payload saved securely to IndexedDB.');
        } catch (e) {
            console.warn('[C3D] Failed to write to IndexedDB:', e);
        }
    }

    /**
     * Read and send all cached requests from IndexedDB
     */
    public async flushQueue(): Promise<void> {
        if (!this.isOnline()) return;

        try {
            const db = await this.getDB();
            const transaction = db.transaction(this.STORE_NAME, 'readwrite');
            const store = transaction.objectStore(this.STORE_NAME);
            
            const request = store.getAll();
            
            request.onsuccess = async () => {
                const queue: CachedRequest[] = request.result;
                if (queue.length === 0) return;

                // Clear the store immediately to prevent duplicate sends. 
                // If it fails again, `networkCall` will re-cache it.
                store.clear();

                for (const req of queue) {
                    const originalSceneId = this.core.sceneData.sceneId;
                    const originalVersion = this.core.sceneData.versionNumber;
                    
                    this.core.sceneData.sceneId = req.sceneId;
                    this.core.sceneData.versionNumber = req.versionNumber;

                    try {
                        // Send normally (no keepalive needed for background flushing)
                        await this.networkCall(req.suburl, req.content, false);
                    } catch (e) {
                        console.error('[C3D] Failed to flush cached item, it will be re-queued.', e);
                    } finally {
                        this.core.sceneData.sceneId = originalSceneId;
                        this.core.sceneData.versionNumber = originalVersion;
                    }
                }
            };
        } catch (e) {
            console.warn('[C3D] Failed to read from IndexedDB:', e);
        }
    }

    /**
     * Make network call. Includes keepAlive param for tab-close reliability.
     */
    networkCall(suburl: string, content: object, isFinalRequest: boolean = false): Promise<number | string> {
        return new Promise((resolve, reject) => {
            if (!this.core.sceneData.sceneId || !this.core.sceneData.versionNumber) {
                reject('no scene selected');
                return;
            }

            if (!this.isOnline()) {
                console.log('[C3D] Device offline. Caching request to IndexedDB.');
                this.cacheRequest(suburl, content);
                resolve('Cached offline');
                return;
            }

            const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/${suburl}/${this.core.sceneData.sceneId}?version=${this.core.sceneData.versionNumber}`;

            const options: RequestInit = {
                method: 'post',
                headers: {
                    'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content),
                // This is the magic flag! It replaces sendBeacon and guarantees delivery on tab close.
                keepalive: isFinalRequest 
            };

            fetch(path, options)
                .then(res => {
                    if (!res.ok && res.status >= 500) {
                        this.cacheRequest(suburl, content); // Cache server errors
                    }
                    resolve(res.status);
                })
                .catch(err => {
                    console.error('[C3D] Network fetch failed. Caching to IndexedDB.', err);
                    this.cacheRequest(suburl, content);
                    resolve('Cached offline due to network error');
                });
        });
    }

    /**
     * Get a question set from the Cognitive3D API
     * @param hook - Question set hook
     */
    networkExitpollGet(hook: string): Promise<QuestionSet> {
        return new Promise((resolve, reject) => {
            const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/questionSetHooks/${hook}/questionSet`;

            console.log(`Network.networkExitpollGet: ${path}`);

            const options = {
                method: 'get',
                headers: {
                    'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                    'Content-Type': 'application/json'
                }
            };

            fetch(path, options)
                .then(response => response.json() as Promise<QuestionSet>)
                .then(payload => resolve(payload))
                .catch(err => reject(err));
        });
    }

    /**
     * Send question set responses to the Cognitive3D API
     * @param questionsetname - Name of the question set
     * @param questionsetversion - Version of the question set
     * @param content - Response payload
     */
    networkExitpollPost(questionsetname: string, questionsetversion: string, content: object): Promise<number> {
        return new Promise((resolve, reject) => {
            const options = {
                method: 'post',
                headers: {
                    'Authorization': `APIKEY:DATA ${this.core.config.APIKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(content)
            };

            const path = `https://${this.core.config.networkHost}/v${this.core.config.networkVersion}/questionSets/${questionsetname}/${questionsetversion}/responses`;

            fetch(path, options)
                .then(res => res.status)
                .then(res => resolve(res))
                .catch(err => {
                    console.error('Error posting exit poll:', err);
                    reject(err);
                });
        });
    }
}

export default Network;