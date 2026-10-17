const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const https = require('https');

const config = getDefaultConfig(__dirname);

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// Proxy /api/v1 in web dev mode to prevent browser CORS errors when testing on localhost
config.server = {
  ...config.server,
  enhanceMiddleware: (metroMiddleware) => {
    return (req, res, next) => {
      // Handle CORS preflight OPTIONS from browser
      if (req.method === 'OPTIONS' && req.url && req.url.startsWith('/api/v1')) {
        res.writeHead(204, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization',
          'Access-Control-Allow-Credentials': 'true',
        });
        res.end();
        return;
      }

      if (req.url && req.url.startsWith('/api/v1')) {
        const options = {
          hostname: 'app.bthawk.com',
          port: 443,
          path: req.url,
          method: req.method,
          headers: {
            ...req.headers,
            host: 'app.bthawk.com',
            origin: 'https://app.bthawk.com',
            referer: 'https://app.bthawk.com/',
          },
        };

        const proxyReq = https.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'access-control-allow-origin': '*',
            'access-control-allow-credentials': 'true',
          });
          proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
          res.writeHead(502, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
        });

        req.pipe(proxyReq);
        return;
      }

      return metroMiddleware(req, res, next);
    };
  },
};

module.exports = config;
