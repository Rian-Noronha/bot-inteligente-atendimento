import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        upload: path.resolve(__dirname, 'pages/upload.html'),
        knowledge_library: path.resolve(__dirname, 'pages/knowledge_library.html'),
        dashboard: path.resolve(__dirname, 'pages/dashboard.html'),
        forgot_password: path.resolve(__dirname, 'pages/forgot_password.html'),
        register: path.resolve(__dirname, 'pages/register.html'),
        report: path.resolve(__dirname, 'pages/report.html'),
        reset_password: path.resolve(__dirname, 'pages/reset_password.html'),
        users: path.resolve(__dirname, 'pages/users.html'),
        categories: path.resolve(__dirname, 'pages/categories.html'),
        profiles: path.resolve(__dirname, 'pages/profiles.html'),
        chat_bot: path.resolve(__dirname, 'pages/chatbot.html'),
      },
    },
  },

  server: {
    host: true,
    open: '/index.html', 
    proxy: {
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true, // para virtual hosts baseados em nome
      },
    },
  },
});