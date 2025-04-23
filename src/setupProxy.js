const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/v2',
    createProxyMiddleware({
      target: 'https://api.adsb.lol',
      changeOrigin: true,
      pathRewrite: {
        '^/v2': '', // Reescribe la ruta para que '/v2' no quede duplicado
      },
    })
  );
};
