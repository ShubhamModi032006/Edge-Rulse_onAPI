import { getApiById, getApiByRoutePrefix } from '../services/api.service.js';
import { forwardRequest } from '../services/proxy.service.js';

export const proxyMiddleware = async (req, res, next) => {
    try {
        const originalUrl = req.originalUrl;

        // 1. Find matching API by longest prefix
        let api = await getApiByRoutePrefix(originalUrl);

        // FIX: Issue 3 - Secure/Remove x-api-id Header Injection block
        // (Removed insecure fallback block that trusted req.headers['x-api-id'])

        // 3. If API not found: return 404
        if (!api) {
            return res.status(404).json({ success: false, message: "API not found" });
        }

        // 4. Define target parameters
        const targetUrl = api.base_url;

        // 5. Forward request using proxy service (incorporating rewrite bounds)
        return forwardRequest(req, res, targetUrl, api.route_prefix);
    } catch (error) {
        console.error('Proxy Middleware Error:', error);
        next(error);
    }
};
