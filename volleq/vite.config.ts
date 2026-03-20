// vite.config.js
import { defineConfig } from 'vite';
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Your configuration options here
    plugins: [
    react(), tailwindcss(),
  ],
});
