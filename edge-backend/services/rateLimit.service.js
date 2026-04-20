import redis from '../config/redis.js';
import { getCachedRules } from './ruleCache.service.js';

export const applyRateLimit = async ({ apiId, route, ip, rule, headers }) => {
    try {
        if (!rule) {
            return { allowed: true };
        }

        // Ensure we handle config structure
        let config = rule.config;
        if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) { config = {}; }
        }

        const limit = config?.limit || rule.limit || 10;
        const window = config?.window || rule.window || 60;

        // FIX: Issue 1 - Rate Limit Key Bypass Issue
        // clientIdentifier priority: 1. x-forwarded-for (first IP), 2. req.ip
        const clientIdentifier = headers?.['x-forwarded-for']?.split(',')[0].trim() || ip;
        
        // Use rule.id for key instead of route to ensure all matching routes share the bucket
        const key = `edgerules:rate:${rule.id}:${clientIdentifier}`;

        // FIX: Issue 2 - Fix Redis Race Condition (INCR + EXPIRE)
        // Use atomic Lua script to prevent keys from persisting forever
        const luaScript = `
            local current = redis.call('incr', KEYS[1])
            if current == 1 then
                redis.call('expire', KEYS[1], ARGV[1])
            end
            local ttl = redis.call('ttl', KEYS[1])
            return {current, ttl}
        `;
        
        const result = await redis.eval(luaScript, 1, key, window);
        const currentCount = result[0];
        const ttl = result[1];

        const remaining = Math.max(0, limit - currentCount);
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
