import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [
        react(),
        nodePolyfills({
            // Polyfill all Node.js modules needed by @btc-vision/* / opnet
            include: ['buffer', 'crypto', 'stream', 'events', 'path', 'util', 'assert', 'url'],
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
        }),
    ],
    resolve: {
        alias: {
            // Ensure single Buffer instance across the bundle
            buffer: 'buffer',
        },
    },
    build: {
        target: 'esnext',
        rollupOptions: {
            output: {
                manualChunks: {
                    'bitcoin-core': ['@btc-vision/bitcoin', '@btc-vision/ecpair'],
                    'opnet-core': ['opnet'],
                },
            },
        },
    },
    optimizeDeps: {
        include: ['buffer'],
        esbuildOptions: {
            target: 'esnext',
            define: {
                global: 'globalThis',
            },
        },
    },
});
