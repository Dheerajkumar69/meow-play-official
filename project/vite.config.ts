import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { songStoragePlugin } from './src/plugins/songStoragePlugin';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh in development
      fastRefresh: true,
      // Optimize bundle size
      babel: {
        plugins: process.env.NODE_ENV === 'production' ? [
          // Remove dev-only code in production
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],
        ] : [],
      },
    }),
    songStoragePlugin({
      songsDir: 'public/songs',
      metadataFile: 'public/songs/songs.json'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Meow-Play - Music Streaming',
        short_name: 'Meow-Play',
        description: 'Your purr-fect music streaming experience',
        theme_color: '#a855f7',
        background_color: '#121212',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,wav,ogg,m4a,flac}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.pexels\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pexels-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(mp3|wav|ogg|m4a|flac)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-files',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              plugins: [
                {
                  cacheDidUpdate: async ({ cacheName, request, oldResponse, newResponse }) => {
                    // Clean up old audio files if storage is getting full
                    if (oldResponse) {
                      const storage = await navigator.storage.estimate();
                      if (storage.usage && storage.quota && (storage.usage / storage.quota > 0.9)) {
                        const cache = await caches.open(cacheName);
                        const keys = await cache.keys();
                        if (keys.length > 40) { // Keep last 40 files
                          await Promise.all(keys.slice(0, keys.length - 40).map(key => cache.delete(key)));
                        }
                      }
                    }
                  }
                }
              ]
            }
          },
          {
            urlPattern: /^https:\/\/api\./i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  build: {
    // Optimize bundle size
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        // Code splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'crypto-vendor': ['crypto-js'],
          'validation-vendor': ['zod', 'dompurify'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/\.css$/.test(name ?? '')) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    // Enable source maps in development only
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Development server optimization
    host: true,
    port: 3000,
    strictPort: true,
    // CORS configuration
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    },
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'crypto-js',
      'zod',
      'dompurify',
    ],
    exclude: ['lucide-react'],
  },
  define: {
    // Define environment variables
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  esbuild: {
    // Tree shaking configuration
    treeShaking: true,
    // Remove unused imports
    ignoreAnnotations: false,
    // Optimize for production
    minifyIdentifiers: process.env.NODE_ENV === 'production',
    minifySyntax: process.env.NODE_ENV === 'production',
    minifyWhitespace: process.env.NODE_ENV === 'production',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
