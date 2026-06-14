import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // Для работы с React
import tailwindcss from '@tailwindcss/vite'; // TailwindCSS плагин
import path from 'path'; // Для работы с путями

export default defineConfig({
  plugins: [
    react(), // Подключаем React плагин
    tailwindcss(), // Подключаем TailwindCSS
  ],
  server: {
    proxy: {
      '/uploads': {
        target: 'http://localhost:3000', // Адрес вашего бэкенда
        changeOrigin: true, // Меняет origin запроса на target
        rewrite: (path) => path.replace(/^\/uploads/, '/uploads'), // Переписывает путь, если требуется
      },
    },
    fs: {
      strict: false, // Разрешить доступ к файлам вне корневой папки
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Алиас для быстрого доступа к папке src
    },
  },
  build: {
    outDir: 'dist', // Указывает папку для сборки
    assetsDir: 'assets', // Указывает папку для статических файлов
  },
  publicDir: 'public', // Указывает, что папка public используется для статических файлов
});
