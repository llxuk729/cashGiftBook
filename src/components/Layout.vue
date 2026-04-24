<template>
  <div class="layout-container">
    <div class="page-shell">
      <slot></slot>
    </div>

    <div class="tabbar-shell">
      <van-tabbar v-model="activeTab" class="app-tabbar" active-color="#5d75f8" inactive-color="#97a0bb" route>
        <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
        <van-tabbar-item icon="records" to="/query">查询</van-tabbar-item>
        <van-tabbar-item icon="add-o" to="/add-record">记账</van-tabbar-item>
        <van-tabbar-item icon="setting-o" to="/settings">设置</van-tabbar-item>
      </van-tabbar>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeTab = ref(0);

watch(
  () => route.path,
  (path) => {
    const tabMap = {
      '/': 0,
      '/query': 1,
      '/add-record': 2,
      '/settings': 3
    };
    activeTab.value = tabMap[path] ?? 0;
  },
  { immediate: true }
);
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
}

.page-shell {
  min-height: calc(100vh - 84px);
}

.tabbar-shell {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  padding: 0 14px calc(env(safe-area-inset-bottom) + 12px);
  pointer-events: none;
}

.app-tabbar {
  pointer-events: auto;
  left: 14px;
  right: 14px;
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  height: 62px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 20px 45px rgba(67, 83, 130, 0.18);
  backdrop-filter: blur(18px);
}

:deep(.van-tabbar-item) {
  transition: transform 0.18s ease;
}

:deep(.van-tabbar-item--active) {
  transform: translateY(-2px);
}

:deep(.van-tabbar-item__icon) {
  font-size: 21px;
}

:deep(.van-tabbar-item__text) {
  font-size: 12px;
  font-weight: 600;
}
</style>
