import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  envDir: path.resolve(__dirname, '../..'),
  plugins: [
    react(),
    federation({
      name: 'mfeAuth',
      filename: 'remoteEntry.js',
      exposes: {
        './AuthRoutes': './src/AuthRoutes.tsx',
        './AuthApp': './src/App.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        'react-redux': { singleton: true },
        axios: { singleton: true },
      },
    }),
  ],
  resolve: {
    alias: {
      '@doevents/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      '@config': path.resolve(__dirname, '../../config'),
    },
  },
  server: {
    port: 5001,
    strictPort: true,
    cors: true,
  },
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  define: {
    'import.meta.env.VITE_DOEVENTS_ENV': JSON.stringify(
      process.env.DOEVENTS_ENV || (
        mode === 'devaws' ? 'devaws' : mode === 'qa' || mode === 'production' ? 'qa' : 'dev'
      ),
    ),
  },
}));
