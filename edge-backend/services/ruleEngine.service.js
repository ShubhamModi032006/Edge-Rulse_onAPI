import { getCachedRules } from './ruleCache.service.js';
import { applyRateLimit } from './rateLimit.service.js';
import { validateAuth } from './auth.service.js';

export const evaluateRules = async ({ apiId, route, ip, headers }) => {
    try {
        const rules = await getCachedRules(apiId);
        if (!rules || rules.length === 0) {
            return { action: 'continue' };
        }

        const now = new Date();
        const validRules = rules.filter(rule => {
            if (!rule.is_enabled) return false;

            // Scope match logic
            if (rule.scope !== route && rule.scope !== '*' && !route.startsWith(rule.scope)) return false;

            // Time validity
            if (rule.start_time && new Date(rule.start_time) > now) return false;
            if (rule.end_time && new Date(rule.end_time) < now) return false;

            return true;
        });

        // Sort rules by priority DESC
        validRules.sort((a, b) => b.priority - a.priority);

        // PART D: Integrate Into Rule Engine
        // 1. Before other rules, check auth rules FIRST to ensure insecure requests are dropped early
        // 2 & 3. Filter rules where type === "auth" (sorting is already handled above)
        const authRules = validRules.filter(rule => rule.type === 'auth');
        for (const rule of authRules) {
            let config = rule.config;
            if (typeof config === 'string') {
                try { config = JSON.parse(config); } catch (e) { config = {}; }
                rule.config = config; // cache parsed config to avoid re-parsing
            } else if (!config) {
                rule.config = {};
            }

            // 4. For each auth rule, evaluate the headers against the configured ruleset
            const authResult = validateAuth({ headers, rule });
            
            // 5. If invalid, block the request and return unauthorized reason
            if (!authResult.valid) {
                return {
                    action: 'block',
                    reason: 'unauthorized',
                    auth_reason: authResult.reason // Passes forward specific failure context (e.g. missing_token)
                };
            }
        }

        let rateLimitApplied = false;

        // Evaluate rules sequentially
        for (const rule of validRules) {
            // Skip processing auth rules here since they run BEFORE rate limiting and block rules
            if (rule.type === 'auth') continue; 
            let config = rule.config;
            if (typeof config === 'string') {
                try { config = JSON.parse(config); } catch (e) { config = {}; }
            } else if (!config) {
                config = {};
            }

            if (rule.type === 'rate_limit') {
                if (!rateLimitApplied) {
                    rateLimitApplied = true;
                    // Apply rate limit using existing service functionality
                    const rlResult = await applyRateLimit({ apiId, route, ip });
                    if (!rlResult.allowed) {
                        return {
                            action: 'block',
                            reason: 'rate_limit',
                            details: rlResult
                        };
                    }
                }
            } else if (rule.type === 'block') {
                if (config.ip && config.ip === ip) {
                    return { action: 'block', reason: 'ip_block' };
                }
            } else if (rule.type === 'header') {
                if (config.add) {
                    for (const [key, value] of Object.entries(config.add)) {
                        headers[key.toLowerCase()] = value;
                    }
                }
            }
        }

        return { action: 'continue' };

    } catch (error) {
        console.error('Rule Engine Error:', error);
        return { action: 'continue' }; // fail-open on evaluation errors
    }
};
