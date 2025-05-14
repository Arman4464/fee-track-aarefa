
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { compression } from 'vite-plugin-compression2';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression(),
    chunkSplitPlugin({
      strategy: 'default',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          // Specify individual components instead of whole directory
          ui: [
            '@/components/ui/button',
            '@/components/ui/form',
            '@/components/ui/input',
            '@/components/ui/card',
            '@/components/ui/alert',
            '@/components/ui/label'
          ],
          router: ['react-router-dom']
        }
      }
    }
  },
  server: {
    port: 3000,
  }
});
