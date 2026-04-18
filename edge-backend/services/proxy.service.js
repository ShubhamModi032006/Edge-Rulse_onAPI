import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

export const forwardRequest = (req, res, targetUrl, routePrefix) => {
    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        pathRewrite: (path, req) => {
            if (routePrefix && path.startsWith(routePrefix)) {
                let rewritten = path.slice(routePrefix.length);
                if (!rewritten.startsWith('/')) {
                    rewritten = '/' + rewritten;
                }
                return rewritten;
            }
            return path;
        },
        // Since original stream is consumed by express.json(), we must fix it
        on: {
            proxyReq: fixRequestBody,
            error: (err, req, res) => {
                console.error('Proxy Forward Error:', err);
                if (!res.headersSent) {
                    res.status(502).json({ 
                        success: false, 
                        message: 'Bad Gateway', 
                        detail: err.message 
                    });
                }
            }
        }
    });

    // Execute the configured middleware instantly for this request
    return proxy(req, res, (err) => {
        if (err && !res.headersSent) {
            res.status(500).json({ success: false, message: 'Proxy forwarding failed' });
        }
    });
};
