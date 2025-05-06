import { defineConfig } from 'astro/config';
 import react from '@astrojs/react';
 import setupProxy from './proxy.js';
 import path from 'path';
 
 export default defineConfig({
   integrations: [react()],
   server: {
     middleware: [setupProxy],
   },
   alias: {
     '@components': path.resolve('./src/components'),
   },
 });