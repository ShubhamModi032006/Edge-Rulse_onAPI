import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';

export const forwardRequest = (req, res, targetUrl) => {
    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
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
