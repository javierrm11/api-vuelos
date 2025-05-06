import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import setupProxy from './proxy.js';

import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [react()],

  server: {
    middleware: [setupProxy],
  },

  output: 'server',
  adapter: vercel({
    edgeMiddleware: true,
  }),
});
