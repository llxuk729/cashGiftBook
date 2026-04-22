<template>
  <Layout>
    <div class="settings-page">
    <div class="page-header">
      <h2 class="page-title">设置</h2>
    </div>

    <div class="settings-content">
      <!-- 版本信息 -->
      <van-cell-group inset>
        <van-cell title="当前版本" :value="currentVersion" />
        <van-cell 
          title="检查更新" 
          is-link 
          @click="checkUpdate"
          :label="updateInfo.hasUpdate ? '发现新版本' : '已是最新版本'"
        />
      </van-cell-group>

      <!-- 数据管理 -->
      <van-cell-group inset>
        <van-cell title="数据备份" is-link @click="$router.push('/backup')" />
        <van-cell 
          title="云同步" 
          is-link 
          @click="handleCloudSync"
          label="敬请期待"
        />
      </van-cell-group>

      <!-- 关于 -->
      <van-cell-group inset>
        <van-cell title="关于礼金记账">
          <template #label>
            <div class="about-text">
              一款简单易用的礼金记录工具
            </div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button 
          round 
          block 
          type="danger" 
          plain
          @click="handleClearAllData"
        >
          清空所有数据
        </van-button>
      </div>
    </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import Layout from '../components/Layout.vue';
import { versionAPI } from '../utils/version';
import { backupAPI } from '../database/backupAPI';
import db from '../database/index';

const currentVersion = ref('');
const updateInfo = ref({
  hasUpdate: false,
  latestVersion: '',
  changelog: ''
});

// 加载版本信息
onMounted(() => {
  currentVersion.value = versionAPI.getCurrentVersion();
});

// 检查更新
async function checkUpdate() {
  try {
    showToast({ type: 'loading', message: '检查中...', duration: 0 });
    
    const info = await versionAPI.checkUpdate();
    updateInfo.value = info;
    
    showToast.clear();
    
    if (info.error) {
      showToast('当前为离线版本');
      return;
    }
    
    if (info.hasUpdate) {
      await versionAPI.showUpdateDialog(info);
    } else {
      showToast('已是最新版本');
    }
  } catch (error) {
    console.error('检查更新失败:', error);
    showToast('检查失败');
  }
}

// 云同步（预留功能）
async function handleCloudSync() {
  const result = await backupAPI.cloudSync();
  showToast(result.message);
}

// 清空所有数据
async function handleClearAllData() {
  try {
    await showConfirmDialog({
      title: '警告',
      message: '此操作将清空所有数据且无法恢复，确定要继续吗？建议先备份数据！',
      confirmButtonText: '确认清空',
      confirmButtonColor: '#ee0a24'
    });
    
    // 再次确认
    await showConfirmDialog({
      title: '二次确认',
      message: '真的要清空吗？请再次确认！',
      confirmButtonText: '是的，清空',
      confirmButtonColor: '#ee0a24'
    });
    
    // 清空所有表
    await db.records.clear();
    await db.persons.clear();
    await db.events.clear();
    await db.categories.clear();
    await db.settings.clear();
    
    showToast('数据已清空');
    
    // 刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空数据失败:', error);
    }
  }
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 50px;
}

.page-header {
  padding: 16px;
  background: #fff;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.settings-content {
  padding: 16px 0;
}

.about-text {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}

.action-buttons {
  margin: 32px 16px;
}
</style>
