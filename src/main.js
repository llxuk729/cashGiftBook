import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import Vant from 'vant';
import '@vant/touch-emulator';
import 'vant/lib/index.css';
import { initDefaultData } from './database';
import { registerPWAUpdateHandler } from './utils/pwaUpdate';
import './style.css';

// 注册 PWA Service Worker
// 注意：Service Worker 只能在 HTTPS 或 localhost 环境下工作
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker 注册成功:', registration.scope);
      
      // 注册 PWA 更新处理器
      registerPWAUpdateHandler();
    } catch (error) {
      console.error('Service Worker 注册失败:', error);
    }
  });
} else if (window.location.protocol === 'file:') {
  console.log('检测到 file:// 协议，跳过 Service Worker 注册（本地文件模式）');
}

// 初始化应用
async function bootstrap() {
  // 初始化默认数据
  await initDefaultData();
  
  const app = createApp(App);
  app.use(router);
  app.use(Vant);
  app.mount('#app');
}

bootstrap();
