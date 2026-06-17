import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const isQaBuild = mode === 'qa' || env.VITE_DOEVENTS_ENV === 'qa';
  const doeventsEnv = isQaBuild ? 'qa' : (env.VITE_DOEVENTS_ENV || 'dev');

  return {
    envDir: path.resolve(__dirname, '../..'),
    plugins: [
      react(),
      federation({
        name: 'shell',
        remotes: {},
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
        '@mfe-auth/AuthRoutes': path.resolve(__dirname, '../mfe-auth/src/AuthRoutes.tsx'),
        '@lovable': path.resolve(__dirname, './src/lovable'),
      },
    },
    css: {
      postcss: path.resolve(__dirname, './postcss.config.js'),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      target: 'esnext',
      minify: mode === 'production',
    },
    define: {
      'import.meta.env.VITE_DOEVENTS_ENV': JSON.stringify(doeventsEnv),
    },
  };
});
