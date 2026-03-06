import { errorResponse } from '../utils/response.js';
import { applyRateLimit } from '../services/rateLimit.service.js';

export const rateLimitMiddleware = async (req, res, next) => {
    try {
        // Temporary testing method: extract apiId from x-api-id header
        const apiId = req.headers['x-api-id'];

        // If no apiId, we skip rate limiting (unless gateway enforces it later. for now fail-open or fail-close?
        // Instructions: 'Since gateway not implemented yet, assume apiId is passed via header'
        // If no header, just skip for now, since regular health checks and other paths might not have it.
        if (!apiId) {
            return next();
        }

        const route = req.path;
        const ip = req.ip || req.connection.remoteAddress;

        const result = await applyRateLimit({ apiId, route, ip });

        if (!result.allowed) {
            res.set('X-RateLimit-Remaining', 0);
            res.set('X-RateLimit-Reset', result.reset);
            return res.status(429).json({
                success: false,
                message: "Rate limit exceeded"
            });
        }

        if (result.remaining !== undefined) {
            res.set('X-RateLimit-Remaining', result.remaining);
            res.set('X-RateLimit-Reset', result.reset);
        }

        next();
    } catch (error) {
        console.error('Rate Limit Middleware Error:', error);
        next(); // fail-open so we don't block traffic if Redis fails
    }
};
