import redis from '../config/redis.js';
import { getCachedRules } from './ruleCache.service.js';

export const applyRateLimit = async ({ apiId, route, ip }) => {
    try {
        const rules = await getCachedRules(apiId);
        if (!rules || rules.length === 0) {
            return { allowed: true };
        }

        // Filter valid rules
        const now = new Date();
        const rateLimitRules = rules.filter(rule => {
            if (rule.type !== 'rate_limit' || !rule.is_enabled) return false;

            // Scope match (route exact match or '*' or startsWith prefix logic; simple assumed exact match or wildcard)
            if (rule.scope !== route && rule.scope !== '*' && !route.startsWith(rule.scope)) return false;

            // Time validity
            if (rule.start_time && new Date(rule.start_time) > now) return false;
            if (rule.end_time && new Date(rule.end_time) < now) return false;

            return true;
        });

        if (rateLimitRules.length === 0) {
            return { allowed: true };
        }

        // Sort by priority DESC to get highest priority
        rateLimitRules.sort((a, b) => b.priority - a.priority);
        const rule = rateLimitRules[0];

        // Ensure we handle config structure
        // If config is stringified JSON, parse it.
        let config = rule.config;
        if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) { config = {}; }
        }

        const limit = config?.limit || rule.limit || 10;
        const window = config?.window || rule.window || 60;

        const key = `edgerules:rate:${apiId}:${route}:${ip}`;

        const currentCount = await redis.incr(key);

        if (currentCount === 1) {
            // Set expiration on first request
            await redis.expire(key, window);
        }

        const remaining = Math.max(0, limit - currentCount);
        const ttl = await redis.ttl(key);
        const resetSeconds = ttl > 0 ? ttl : window;

        if (currentCount > limit) {
            return {
                allowed: false,
                remaining: 0,
                reset: resetSeconds
            };
        }

        return {
            allowed: true,
            remaining,
            reset: resetSeconds
        };

    } catch (error) {
        console.error('Rate Limit Engine Error:', error);
        // Fail-open: don't crash the server or block requests if Redis fails
        return { allowed: true };
    }
};
