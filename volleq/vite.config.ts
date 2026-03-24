import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    plugins: [react(), tailwindcss()],
    server: {
      deps: {
        inline: [/@testing-library/],
      },
    },
  },
});