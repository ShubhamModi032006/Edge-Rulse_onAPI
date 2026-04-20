import redis from '../config/redis.js';
import pool from '../config/db.js';

const getCacheKey = (apiId) => `edgerules:api:${apiId}:rules`;

export const setCachedRules = async (apiId, rules) => {
    try {
        const key = getCacheKey(apiId);
        await redis.set(key, JSON.stringify(rules));
    } catch (error) {
        console.error('Redis error while setting cache:', error);
    }
};

export const loadRulesIntoCache = async (apiId) => {
    try {
        const query = `
            SELECT r.*, rv.config 
            FROM rules r
            LEFT JOIN rule_versions rv ON r.id = rv.rule_id
            WHERE r.api_id = $1 
              AND r.is_enabled = true
              AND rv.version_number = (
                  SELECT MAX(version_number) 
                  FROM rule_versions 
                  WHERE rule_id = r.id
              )
        `;
        const result = await pool.query(query, [apiId]);
        const rules = result.rows;

        await setCachedRules(apiId, rules);
        return rules;
    } catch (error) {
        console.error('Database error while loading rules into cache:', error);
        throw error;
    }
};

// FIX: Issue 4 - Fix Redis Failure -> DB Meltdown
const memoryFallback = new Map();
const MEMORY_TTL_MS = 60000; // 1 min in-memory fallback limit

export const getCachedRules = async (apiId) => {
    try {
        const key = getCacheKey(apiId);
        const cachedData = await redis.get(key);

        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.error('Redis error while getting cache:', error);
        
        // Use in-memory cache to prevent DB overload when Redis fails
        const memEntry = memoryFallback.get(apiId);
        if (memEntry && memEntry.expiry > Date.now()) {
            return memEntry.data;
        } else if (memEntry) {
            memoryFallback.delete(apiId);
        }
        
        console.warn('Redis unavailable and memory cache missed. Failing open.');
        return []; // Fail-open (skip rules temporarily)
    }

    try {
        // Cache miss (not failure) - load from DB
        const rules = await loadRulesIntoCache(apiId);
        
        // Save to memory cache for protection in case Redis fails later
        memoryFallback.set(apiId, { data: rules, expiry: Date.now() + MEMORY_TTL_MS });
        
        return rules;
    } catch (dbError) {
        console.error('Database error during cache miss:', dbError);
        return []; // Fail-open on DB failure
    }
};

export const invalidateRuleCache = async (apiId) => {
    try {
        const key = getCacheKey(apiId);
        await redis.del(key);
    } catch (error) {
        console.error('Redis error while invalidating cache:', error);
    }
};
