// filepath: c:\Users\Alex\Documents\TFG\vueltaDeVacaciones\proxy.js
import { createProxyMiddleware } from 'http-proxy-middleware';

export default function setupProxy(app) {
  app.use(
    '/v2/pia',
    createProxyMiddleware({
      target: 'https://api.adsb.lol',
      changeOrigin: true,
    })
  );
}