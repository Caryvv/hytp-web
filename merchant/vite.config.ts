import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// 商家端开发服务器：/merchant 代理到后端 merchant 入口，规避跨域。
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5174,
    proxy: {
      // 前端 axios baseURL 用 /merchant 前缀便于识别，代理转发时剥离前缀
      // （后端 merchant 入口路由在根路径，如 /auth/login、/products）。
      '/merchant': {
        target: 'http://127.0.0.1:8801',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/merchant/, ''),
      },
    },
  },
})
