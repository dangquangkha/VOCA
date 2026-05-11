import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        exclude: ['**/e2e/**', '**/node_modules/**', '**/dist/**', '**/.next/**'],
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
