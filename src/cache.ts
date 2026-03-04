import * as fs from 'fs';
import * as path from 'path';

export interface ChannelInfo {
    id: string;
    name: string;
    isPrivate: boolean;
    purpose: string;
}

export class CacheManager {
    private cachePath: string;
    private memoryCache: Map<string, ChannelInfo>;

    constructor(storagePath: string | undefined) {
        this.memoryCache = new Map();

        if (storagePath) {
            // Ensure directory exists
            if (!fs.existsSync(storagePath)) {
                fs.mkdirSync(storagePath, { recursive: true });
            }
            this.cachePath = path.join(storagePath, 'slack-channels-cache.json');
            this.loadFromDisk();
        } else {
            this.cachePath = ''; // In-memory only fallback
        }
    }

    private loadFromDisk() {
        if (!this.cachePath) return;
        try {
            if (fs.existsSync(this.cachePath)) {
                const data = fs.readFileSync(this.cachePath, 'utf8');
                const parsed = JSON.parse(data);
                for (const key of Object.keys(parsed)) {
                    this.memoryCache.set(key, parsed[key]);
                }
            }
        } catch (err) {
            console.error('Failed to load slack channels cache', err);
        }
    }

    private saveToDisk() {
        if (!this.cachePath) return;
        try {
            const obj = Object.fromEntries(this.memoryCache.entries());
            fs.writeFileSync(this.cachePath, JSON.stringify(obj, null, 2), 'utf8');
        } catch (err) {
            console.error('Failed to save slack channels cache', err);
        }
    }

    public get(channelId: string): ChannelInfo | undefined {
        return this.memoryCache.get(channelId);
    }

    public set(channelId: string, info: ChannelInfo) {
        this.memoryCache.set(channelId, info);
        this.saveToDisk();
    }

    public clear() {
        this.memoryCache.clear();
        this.saveToDisk();
    }
}
