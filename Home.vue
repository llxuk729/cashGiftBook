<template>
  <Layout>
    <div class="home-page">
    <!-- 顶部统计卡片 -->
    <van-cell-group inset class="stats-card">
      <div class="stats-header">
        <h3>礼金统计</h3>
        <van-button size="mini" type="primary" @click="showBackupDialog">
          <van-icon name="cloud-o" /> 备份
        </van-button>
      </div>
      <div class="stats-content">
        <div class="stat-item">
          <div class="stat-label">收入</div>
          <div class="stat-value income">¥{{ statistics.income.toFixed(2) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">支出</div>
          <div class="stat-value expense">¥{{ statistics.expense.toFixed(2) }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">结余</div>
          <div class="stat-value balance">¥{{ statistics.balance.toFixed(2) }}</div>
        </div>
      </div>
    </van-cell-group>

    <!-- 快捷操作 -->
    <van-grid :column-num="4" inset class="quick-actions">
      <van-grid-item icon="plus" text="记一笔" @click="goToAddRecord" />
      <van-grid-item icon="friends-o" text="人物关系" @click="goToPersons" />
      <van-grid-item icon="search" text="查询统计" @click="goToQuery" />
      <van-grid-item icon="setting-o" text="设置" @click="goToSettings" />
    </van-grid>

    <!-- 最近记录 -->
    <div class="recent-records-section">
      <div class="section-header">
        <h3 class="title">最近记录</h3>
        <van-button size="mini" plain @click="goToQuery">查看全部</van-button>
      </div>
      
      <RecordList
        :records="recentRecords"
        :persons="persons"
        :categories="categories"
        :show-icon="true"
        :show-actions="false"
        empty-text="暂无记录"
      />
    </div>

    <!-- 备份提醒对话框 -->
    <van-dialog
      v-model:show="backupReminderShow"
      title="数据备份提醒"
      show-cancel-button
      cancel-button-text="稍后提醒"
      confirm-button-text="立即备份"
      @confirm="handleExportBackup"
      @cancel="handleDismissReminder"
    >
      <div class="backup-reminder-content">
        <p>距离上次备份已超过30天</p>
        <p>建议定期备份数据，防止丢失</p>
      </div>
    </van-dialog>
    </div>
  </Layout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import dayjs from 'dayjs';
import Layout from '../components/Layout.vue';
import RecordList from '../components/RecordList.vue';
import { recordAPI } from '../database/recordAPI';
import { personAPI } from '../database/personAPI';
import { categoryAPI } from '../database/categoryAPI';
import { backupAPI } from '../database/backupAPI';

const router = useRouter();
const statistics = ref({ income: 0, expense: 0, balance: 0, count: 0 });
const recentRecords = ref([]);
const persons = ref([]);
const categories = ref([]);
const backupReminderShow = ref(false);

// 加载数据
onMounted(async () => {
  await loadData();
  
  // 检查是否需要备份提醒（使用 localStorage 持久化）
  const reminderDismissed = localStorage.getItem('backup_reminder_dismissed');
  const dismissedTime = reminderDismissed ? new Date(reminderDismissed) : null;
  const now = new Date();
  
  // 如果从未关闭过提醒，或者关闭后已超过7天，则显示提醒
  const shouldShow = !dismissedTime || (now - dismissedTime) > 7 * 24 * 60 * 60 * 1000;
  
  if (shouldShow && backupAPI.shouldShowBackupReminder()) {
    backupReminderShow.value = true;
  }
});

async function loadData() {
  try {
    // 加载统计数据
    statistics.value = await recordAPI.getStatistics();
    
    // 加载最近记录（按日期降序，取最新10条）
    const allRecords = await recordAPI.getAll();
    const sortedRecords = allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
    recentRecords.value = sortedRecords.slice(0, 10);
    
    // 加载人物和分类（用于显示名称）
    persons.value = await personAPI.getAll();
    categories.value = await categoryAPI.getAll();
  } catch (error) {
    console.error('加载数据失败:', error);
    showToast('加载数据失败');
  }
}

// 获取人物名称
function getPersonName(personId) {
  const person = persons.value.find(p => p.id === personId);
  return person ? person.path : '未知';
}

// 获取分类名称
function getCategoryName(categoryId) {
  const category = categories.value.find(c => c.id === categoryId);
  return category ? category.name : '未分类';
}



// 导航方法
function goToAddRecord() {
  router.push('/add-record');
}

function goToPersons() {
  router.push('/persons');
}

function goToQuery() {
  router.push('/query');
}

function goToSettings() {
  router.push('/settings');
}

// 备份相关
function showBackupDialog() {
  router.push('/backup');
}

async function handleExportBackup() {
  const result = await backupAPI.exportData();
  showToast(result.message);
  backupReminderShow.value = false;
}

// 关闭提醒（本次会话不再显示）
function handleDismissReminder() {
  // 记录关闭时间，7天内不再显示
  localStorage.setItem('backup_reminder_dismissed', new Date().toISOString());
  backupReminderShow.value = false;
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 50px;
}

.stats-card {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.stats-header h3 {
  margin: 0;
  font-size: 16px;
}

.stats-content {
  display: flex;
  justify-content: space-around;
  padding: 20px 16px;
  background: white;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 12px;
  color: #969799;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
}

.stat-value.income {
  color: #07c160;
}

.stat-value.expense {
  color: #ee0a24;
}

.stat-value.balance {
  color: #1989fa;
}

.quick-actions {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}

/* 最近记录区域 - 全新简洁设计 */
.recent-records-section {
  margin: 12px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.section-header .title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #969799;
  font-size: 13px;
}

.backup-reminder-content {
  padding: 16px;
  text-align: center;
}

.backup-reminder-content p {
  margin: 8px 0;
  color: #646566;
}
</style>
