import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import Vant from 'vant';
import '@vant/touch-emulator';
import 'vant/lib/index.css';
import { initDefaultData } from './database';
import './style.css';

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
