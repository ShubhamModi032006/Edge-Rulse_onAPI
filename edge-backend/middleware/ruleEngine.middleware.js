import { evaluateRules } from '../services/ruleEngine.service.js';
import { getApiByRoutePrefix } from '../services/api.service.js';

export const ruleEngineMiddleware = async (req, res, next) => {
    try {
        // FIX: Issue 3 - Strip client injected header to prevent routing bypass
        if (req.headers['x-api-id']) {
            delete req.headers['x-api-id'];
        }

        // Discover API by route prefix instead of trusting client header
        const originalUrl = req.originalUrl || req.path;
        const api = await getApiByRoutePrefix(originalUrl);

        // Skip rules if no matching API is found
        if (!api) {
            return next();
        }

        const apiId = api.id;
        const route = req.path;
        // Read IP with priority from x-forwarded-for
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.connection.remoteAddress;
        const headers = req.headers;

        const result = await evaluateRules({ apiId, route, ip, headers });

        if (result.action === 'block') {
            if (result.reason === 'rate_limit') {
                // Rate Limiting blocked request
                return res.status(429).json({
                    success: false,
                    message: "Rate limit exceeded"
                });
            } else if (result.reason === 'unauthorized') {
                // PART E: Middleware Behavior - Return HTTP 403 on authorization failure
                // Structures response using specific auth_reason resulting from validateAuth logic
                return res.status(403).json({
                    success: false,
                    message: "Unauthorized",
                    reason: result.auth_reason || result.reason // e.g. "missing_token" or "invalid_token"
                });
            } else {
                // Return generic 403 for block rules (e.g., ip_block)
                return res.status(403).json({
                    success: false,
                    reason: result.reason
                });
            }
        }

        // If action is continue, pass to routes
        next();
    } catch (error) {
        console.error('Rule Engine Middleware Error:', error);
        next(); // fail-open in middleware to prevent breaking API completely
    }
};
