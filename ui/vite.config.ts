import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
    base: command === 'build' ? '/ui/dist' : undefined,
    define: {
        global: 'window'
    },
    build: {
        sourcemap: false
    },
    server: {
        port: 3000,
        open: true
    },
    plugins: [react()],
}));
