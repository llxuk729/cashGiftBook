import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 读取 package.json 获取版本号和仓库信息
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
const appVersion = packageJson.version

// 从 package.json 的 repository 字段提取 GitHub 仓库信息
// 格式: https://github.com/username/repo.git -> username/repo
let githubRepo = ''
if (packageJson.repository && packageJson.repository.url) {
  const repoUrl = packageJson.repository.url
  // 匹配 GitHub URL 格式
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/)
  if (match) {
    githubRepo = `${match[1]}/${match[2]}`
  }
}

console.log(`App Version: ${appVersion}`)
console.log(`GitHub Repo: ${githubRepo || '未配置'}`)

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages 部署时使用 '/仓库名/'，本地开发使用 './'
  base: process.env.NODE_ENV === 'production' ? '/cashGiftBook/' : './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __GITHUB_REPO__: JSON.stringify(githubRepo)
  },
  plugins: [
    vue(), 
    viteSingleFile(),
    VitePWA({
      registerType: 'prompt', // 改为 prompt 模式，让用户控制更新时机
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: '礼金记账',
        short_name: '礼金记账',
        description: '简单易用的礼金记录工具',
        theme_color: '#667eea',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // 缓存所有资源
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg}'],
        // 清理旧缓存的策略
        cleanupOutdatedCaches: true,
        // 跳过等待，立即激活新版本
        skipWaiting: false, // 设为 false，等待用户确认
        clientsClaim: false, // 设为 false，不立即接管所有客户端
        // 使用 NetworkFirst 策略，优先从网络获取最新版本
        runtimeCaching: [
          {
            urlPattern: /^https?.*/,
            handler: 'NetworkFirst', // 改为 NetworkFirst，优先检查网络
            options: {
              cacheName: 'offline-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 缩短为 7 天
              },
              networkTimeoutSeconds: 3 // 网络超时时间
            }
          }
        ]
      },
      // 开发模式配置
      devOptions: {
        enabled: false, // 开发环境禁用 PWA
        type: 'module'
      }
    })
  ],
  server: {
      host: "0.0.0.0",
      hmr: true, // 启用热更新  
      port: 8080,
    },
  build: {
    rollupOptions: {
      output: {
        // 将 chunk 和 asset 放在同一目录，避免路径问题
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
