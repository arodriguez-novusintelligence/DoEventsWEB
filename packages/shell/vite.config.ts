import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const isQaBuild = mode === 'qa' || env.VITE_DOEVENTS_ENV === 'qa';
  const doeventsEnv = isQaBuild
    ? 'qa'
    : (env.VITE_DOEVENTS_ENV || (mode === 'devaws' ? 'devaws' : 'dev'));

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
        'mfeAuth': path.resolve(__dirname, '../mfe-auth/src'),
        'mfeAuth/*': path.resolve(__dirname, '../mfe-auth/src/*'),
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
      minify: mode === 'development' ? false : 'esbuild',
      cssMinify: mode !== 'development',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui') || id.includes('lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('date-fns') || id.includes('embla-carousel')) {
              return 'vendor-misc';
            }
            return 'vendor';
          },
        },
      },
    },
    define: {
      'import.meta.env.VITE_DOEVENTS_ENV': JSON.stringify(doeventsEnv),
    },
  };
});
