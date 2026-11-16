import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { publicPagesPlugin } from './scripts/public-pages';
export default defineConfig({ plugins: [react(),publicPagesPlugin()], build: { chunkSizeWarningLimit: 700 } });
