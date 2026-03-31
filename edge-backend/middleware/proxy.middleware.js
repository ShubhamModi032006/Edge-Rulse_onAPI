import { getApiById } from '../services/api.service.js';
import { forwardRequest } from '../services/proxy.service.js';

export const proxyMiddleware = async (req, res, next) => {
    try {
        // 1. Extract apiId from header
        const apiId = req.headers['x-api-id'];

        if (!apiId) {
            return res.status(400).json({ success: false, message: "Missing x-api-id header" });
        }

        // 2. Fetch API from DB
        const api = await getApiById(apiId);
        
        // 3. If API not found: return 404
        if (!api) {
            return res.status(404).json({ success: false, message: "API not found" });
        }

        // 4. Build target URL (http-proxy-middleware uses base_url as the target host inherently and appends req.originalUrl automatically in the proxy request under the hood)
        const targetUrl = api.base_url;

        // 5. Forward request using proxy service
        return forwardRequest(req, res, targetUrl);
    } catch (error) {
        console.error('Proxy Middleware Error:', error);
        next(error);
    }
};
