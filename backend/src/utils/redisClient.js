const Redis = require('ioredis');
const redisConfig = require('../configs/redis.config');

class RedisClient {
    constructor() {
        if (!RedisClient.instance) {
            this.client = new Redis({
                ...redisConfig,
                lazyConnect: true,
                maxRetriesPerRequest: 0,
                connectTimeout: 2000
            });

            this.isReady = false;

            this.client.on('error', (err) => {
                // Silently handle connection errors to fallback to DB
                this.isReady = false;
            });

            this.client.on('ready', () => {
                this.isReady = true;
            });

            // Connect initially without waiting
            this.client.connect().catch(() => {});

            RedisClient.instance = this;
        }
        return RedisClient.instance;
    }

    async get(key) {
        if (!this.isReady) return null;
        try {
            return await this.client.get(key);
        } catch (err) {
            return null;
        }
    }

    async setex(key, seconds, value) {
        if (!this.isReady) return;
        try {
            await this.client.setex(key, seconds, value);
        } catch (err) {
            // Ignore cache save errors
        }
    }

    async clearDashboardCache() {
        if (!this.isReady) return;
        try {
            const keys = await this.client.keys('stats:dashboard:*');
            if (keys.length > 0) {
                await this.client.del(...keys);
                console.log('[Redis] Cleared dashboard cache keys:', keys.length);
            }
        } catch (err) {
            console.error('[Redis] Failed to clear dashboard cache', err);
        }
    }
}

module.exports = new RedisClient();
