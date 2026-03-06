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

export const getCachedRules = async (apiId) => {
    try {
        const key = getCacheKey(apiId);
        const cachedData = await redis.get(key);

        if (cachedData) {
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.error('Redis error while getting cache:', error);
    }

    // If not found or Redis fails, load from DB
    return await loadRulesIntoCache(apiId);
};

export const invalidateRuleCache = async (apiId) => {
    try {
        const key = getCacheKey(apiId);
        await redis.del(key);
    } catch (error) {
        console.error('Redis error while invalidating cache:', error);
    }
};
