<template>
  <div class="backup-page">
    <van-nav-bar title="数据备份" left-arrow @click-left="$router.back()" />

    <div class="backup-content">
      <!-- 备份说明 -->
      <van-cell-group inset class="info-card">
        <van-cell title="数据安全说明">
          <template #label>
            <div class="info-text">
              <p>• 所有数据存储在本地浏览器中</p>
              <p>• 建议定期备份，防止数据丢失</p>
              <p>• 备份文件为 JSON 格式，可妥善保管</p>
            </div>
          </template>
        </van-cell>
      </van-cell-group>

      <!-- 最后备份时间 -->
      <van-cell-group inset>
        <van-cell title="上次备份时间">
          <template #value>
            {{ lastBackupTime ? formatDate(lastBackupTime) : '从未备份' }}
          </template>
        </van-cell>
        <van-cell title="记录总数">
          <template #value>{{ recordCount }} 条</template>
        </van-cell>
      </van-cell-group>

      <!-- 备份操作 -->
      <div class="action-buttons">
        <van-button 
          round 
          block 
          type="primary" 
          icon="down"
          @click="handleExport"
          :loading="exporting"
        >
          导出备份文件
        </van-button>

        <van-button 
          round 
          block 
          type="success" 
          icon="upgrade"
          @click="triggerImport"
          :loading="importing"
        >
          导入备份文件
        </van-button>

        <van-button 
          round 
          block 
          plain
          icon="cloud-o"
          @click="handleCloudSync"
        >
          云同步（敬请期待）
        </van-button>
      </div>

      <!-- 隐藏的文件输入 -->
      <input
        ref="fileInput"
        type="file"
        accept=".json"
        style="display: none"
        @change="handleFileSelect"
      />

      <!-- 备份提示 -->
      <van-notice-bar
        left-icon="info-o"
        text="温馨提示：导出后请妥善保存备份文件，建议存储到云端网盘或发送到微信文件传输助手"
        wrapable
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { showToast } from 'vant';
import { recordAPI } from '../database/recordAPI';
import { backupAPI } from '../database/backupAPI';

const fileInput = ref(null);
const exporting = ref(false);
const importing = ref(false);
const lastBackupTime = ref(null);
const recordCount = ref(0);

// 加载数据
onMounted(async () => {
  await loadBackupInfo();
});

async function loadBackupInfo() {
  try {
    // 获取最后备份时间
    lastBackupTime.value = backupAPI.getLastBackupTime();
    
    // 获取记录数量
    const records = await recordAPI.getAll();
    recordCount.value = records.length;
  } catch (error) {
    console.error('加载备份信息失败:', error);
  }
}

// 导出备份
async function handleExport() {
  try {
    exporting.value = true;
    const result = await backupAPI.exportData();
    
    if (result.success) {
      showToast(result.message);
      await loadBackupInfo();
    } else {
      showToast(result.message);
    }
  } catch (error) {
    console.error('导出失败:', error);
    showToast('导出失败');
  } finally {
    exporting.value = false;
  }
}

// 触发文件选择
function triggerImport() {
  fileInput.value?.click();
}

// 处理文件选择
async function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    importing.value = true;
    const result = await backupAPI.importData(file);
    
    showToast(result.message);
    
    if (result.success) {
      await loadBackupInfo();
      
      // 延迟返回
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    console.error('导入失败:', error);
    showToast('导入失败');
  } finally {
    importing.value = false;
    // 清空文件输入
    event.target.value = '';
  }
}

// 云同步（预留功能）
async function handleCloudSync() {
  const result = await backupAPI.cloudSync();
  showToast(result.message);
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const minute = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}
</script>

<style scoped>
.backup-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.backup-content {
  padding: 16px 0;
}

.info-card {
  margin-bottom: 16px;
}

.info-text {
  padding: 8px 0;
}

.info-text p {
  margin: 4px 0;
  font-size: 13px;
  color: #646566;
  line-height: 1.6;
}

.action-buttons {
  margin: 24px 16px;
}

.action-buttons .van-button {
  margin-bottom: 16px;
}
</style>
