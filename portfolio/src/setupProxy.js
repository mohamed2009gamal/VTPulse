const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy ONLY /api/* requests to backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      secure: false,
      logLevel: 'warn'
    })
  );
};
