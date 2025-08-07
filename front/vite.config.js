import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
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
          target: env.VITE_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});