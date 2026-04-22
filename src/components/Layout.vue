<template>
  <div class="layout-container">
    <slot></slot>
    
    <!-- 底部导航 -->
    <van-tabbar v-model="activeTab" active-color="#ee0a24" inactive-color="#969799" route>
      <van-tabbar-item icon="home-o" to="/">首页</van-tabbar-item>
      <van-tabbar-item icon="records" to="/query">查询</van-tabbar-item>
      <van-tabbar-item icon="add-o" to="/add-record">记账</van-tabbar-item>
      <van-tabbar-item icon="friends-o" to="/persons">关系</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/settings">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const activeTab = ref(0);

// 根据当前路由设置激活的tab
watch(() => route.path, (path) => {
  const tabMap = {
    '/': 0,
    '/query': 1,
    '/add-record': 2,
    '/persons': 3,
    '/settings': 4
  };
  activeTab.value = tabMap[path] ?? 0;
}, { immediate: true });
</script>

<style scoped>
.layout-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
