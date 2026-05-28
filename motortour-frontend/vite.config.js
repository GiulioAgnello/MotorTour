import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite config per bundle embedded in WordPress.
 *
 * Output: ../motortour-plugin/assets/frontend/
 *   - index.js   → wp_enqueue_script
 *   - index.css  → wp_enqueue_style
 *
 * In WordPress lo script si monta su <div id="motortour-app">.
 * mtConfig è esposto globalmente via wp_localize_script.
 */
export default defineConfig({
  plugins: [ react() ],

  build: {
    outDir: resolve( __dirname, '../motortour-plugin/assets/frontend' ),
    emptyOutDir: true,

    rollupOptions: {
      input: resolve( __dirname, 'src/index.jsx' ),
      output: {
        entryFileNames: 'index.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: ( assetInfo ) => {
          if ( assetInfo.name?.endsWith('.css') ) return 'index.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // Non esternalizzare React – bundle completo
    // (In futuro si può caricare React da CDN se si vuole risparmiare KB)
    sourcemap: false,
    minify: 'esbuild',
  },

  // Dev server: proxy le chiamate API a LocalWP
  server: {
    port: 5173,
    proxy: {
      '/wp-json': {
        target: 'http://motortour.local', // URL del sito LocalWP
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
