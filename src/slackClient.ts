import axios from 'axios';
import { ChannelInfo, CacheManager } from './cache';

export class SlackClient {
    private token: string | undefined;
    private cache: CacheManager;
    private inFlightRequests: Map<string, Promise<ChannelInfo | null>> = new Map();

    constructor(cache: CacheManager) {
        this.cache = cache;
    }

    public setToken(token: string) {
        this.token = token;
    }

    public hasToken(): boolean {
        return !!this.token;
    }

    public async resolveChannel(channelId: string): Promise<ChannelInfo | null> {
        // Check cache
        const cached = this.cache.get(channelId);
        if (cached) {
            return cached;
        }

        // Return null if no token is configured
        if (!this.token) {
            return null;
        }

        // Prevent duplicate simultaneous requests
        if (this.inFlightRequests.has(channelId)) {
            return this.inFlightRequests.get(channelId) || null;
        }

        // Fetch from API
        const promise = this.fetchFromApi(channelId);
        this.inFlightRequests.set(channelId, promise);

        try {
            const result = await promise;
            if (result) {
                this.cache.set(channelId, result);
            }
            return result;
        } finally {
            this.inFlightRequests.delete(channelId);
        }
    }

    private async fetchFromApi(channelId: string): Promise<ChannelInfo | null> {
        try {
            const response = await axios.get('https://slack.com/api/conversations.info', {
                params: {
                    channel: channelId,
                    include_num_members: true
                },
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            if (response.data && response.data.ok && response.data.channel) {
                const channel = response.data.channel;
                return {
                    id: channel.id,
                    name: '#' + channel.name,
                    isPrivate: channel.is_private,
                    purpose: channel.purpose?.value || ''
                };
            }
            return null;
        } catch (error) {
            console.error(`Error fetching Slack channel ${channelId}:`, error);
            return null;
        }
    }
}
