<template>
  <Layout>
    <div class="home-page">
      <section class="hero-panel">
        <div class="hero-top">
          <div>
            <span class="hero-badge">礼金记账系统</span>
            <h2 class="hero-title">把人情往来记得明白，也让下次回礼更从容</h2>
            <p class="hero-subtitle">
              首页直接看收支、最近记录和常用操作，打开就能快速记账。
            </p>
          </div>
          <van-button
            round
            plain
            type="primary"
            size="small"
            @click="showBackupDialog"
          >
            备份数据
          </van-button>
        </div>

        <div class="hero-stats">
          <div class="stat-card income">
            <span>收入</span>
            <strong>{{ formatMoney(statistics.income) }}</strong>
          </div>
          <div class="stat-card expense">
            <span>支出</span>
            <strong>{{ formatMoney(statistics.expense) }}</strong>
          </div>
          <div class="stat-card balance">
            <span>结余</span>
            <strong>{{ formatMoney(statistics.balance) }}</strong>
          </div>
        </div>
      </section>

      <section class="quick-panel">
        <div class="panel-title-row">
          <h3>常用操作</h3>
          <span>{{ statistics.count }} 笔记录</span>
        </div>

        <div class="quick-grid">
          <button
            type="button"
            class="quick-card primary"
            @click="goToAddRecord"
          >
            <span class="quick-icon">记</span>
            <strong>记一笔</strong>
            <small>最快进入主流程</small>
          </button>
          <button type="button" class="quick-card" @click="goToQuery">
            <span class="quick-icon">查</span>
            <strong>查询统计</strong>
            <small>筛选与编辑</small>
          </button>
          <button type="button" class="quick-card" @click="goToSettings">
            <span class="quick-icon">设</span>
            <strong>设置</strong>
            <small>版本与备份</small>
          </button>
        </div>
      </section>

      <section class="records-panel">
        <div class="panel-title-row">
          <div>
            <h3>最近记录</h3>
            <p>保留最近 10 条，适合快速回看</p>
          </div>
          <van-button round plain size="small" @click="goToQuery">
            查看全部
          </van-button>
        </div>

        <RecordList
          :records="recentRecords"
          :persons="persons"
          :categories="categories"
          :show-icon="true"
          :show-actions="false"
          empty-text="暂无记录，先去记一笔吧"
        />
      </section>

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
          <p>距离上次备份已超过 30 天</p>
          <p>建议尽快导出一份备份，避免数据丢失。</p>
        </div>
      </van-dialog>
    </div>
  </Layout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import Layout from "../components/Layout.vue";
import RecordList from "../components/RecordList.vue";
import { recordAPI } from "../database/recordAPI";
import { personAPI } from "../database/personAPI";
import { categoryAPI } from "../database/categoryAPI";
import { backupAPI } from "../database/backupAPI";

const router = useRouter();
const statistics = ref({ income: 0, expense: 0, balance: 0, count: 0 });
const recentRecords = ref([]);
const persons = ref([]);
const categories = ref([]);
const backupReminderShow = ref(false);

onMounted(async () => {
  await loadData();

  const reminderDismissed = localStorage.getItem("backup_reminder_dismissed");
  const dismissedTime = reminderDismissed ? new Date(reminderDismissed) : null;
  const now = new Date();
  const shouldShow =
    !dismissedTime || now - dismissedTime > 7 * 24 * 60 * 60 * 1000;

  if (shouldShow && backupAPI.shouldShowBackupReminder()) {
    backupReminderShow.value = true;
  }
});

async function loadData() {
  try {
    statistics.value = await recordAPI.getStatistics();

    const allRecords = await recordAPI.getAll();
    recentRecords.value = allRecords
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    persons.value = await personAPI.getAll();
    categories.value = await categoryAPI.getAll();
  } catch (error) {
    console.error("加载数据失败:", error);
    showToast("加载数据失败");
  }
}

function formatMoney(value) {
  return `RMB ${Number(value || 0).toFixed(2)}`;
}

function goToAddRecord() {
  router.push("/add-record");
}

function goToQuery() {
  router.push("/query");
}

function goToSettings() {
  router.push("/settings");
}

function showBackupDialog() {
  router.push("/backup");
}

async function handleExportBackup() {
  const result = await backupAPI.exportData();
  showToast(result.message);
  backupReminderShow.value = false;
}

function handleDismissReminder() {
  localStorage.setItem("backup_reminder_dismissed", new Date().toISOString());
  backupReminderShow.value = false;
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  padding: 18px 16px 110px;
}

.hero-panel,
.quick-panel,
.records-panel {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 50px rgba(76, 92, 140, 0.14);
  backdrop-filter: blur(14px);
}

.hero-panel {
  padding: 22px 18px;
  background:
    radial-gradient(
      circle at top right,
      rgba(255, 255, 255, 0.28),
      transparent 28%
    ),
    linear-gradient(135deg, #5d75f8, #7d5dff);
  color: #fff;
}

.hero-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hero-badge {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  font-weight: 700;
}

.hero-title {
  margin: 10px 0 0;
  font-size: 28px;
  line-height: 1.25;
  color: #fff;
}

.hero-subtitle {
  margin: 10px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.82);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.stat-card {
  padding: 14px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.stat-card span {
  display: block;
  font-size: 12px;
  opacity: 0.78;
}

.stat-card strong {
  display: block;
  margin-top: 8px;
  font-size: 20px;
}

.quick-panel,
.records-panel {
  margin-top: 16px;
  padding: 18px 16px;
}

.panel-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-title-row h3 {
  margin: 0;
  font-size: 17px;
  color: #18213d;
}

.panel-title-row p,
.panel-title-row span {
  margin: 4px 0 0;
  font-size: 12px;
  color: #7983a2;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.quick-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 118px;
  padding: 16px;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff, #f6f8ff);
  color: #23304c;
  box-shadow: inset 0 0 0 1px rgba(111, 140, 255, 0.08);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.quick-card.primary {
  background: linear-gradient(
    135deg,
    rgba(93, 117, 248, 0.16),
    rgba(118, 93, 255, 0.18)
  );
}

.quick-card:active {
  transform: scale(0.98);
}

.quick-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #eef2ff;
  font-size: 21px;
}

.quick-card strong {
  margin-top: 14px;
  font-size: 16px;
}

.quick-card small {
  margin-top: 6px;
  font-size: 12px;
  color: #7983a2;
}

.backup-reminder-content {
  padding: 16px;
  text-align: center;
}

.backup-reminder-content p {
  margin: 8px 0;
  color: #687393;
}

@media (max-width: 420px) {
  .hero-top,
  .panel-title-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-title {
    font-size: 24px;
  }

  .hero-stats,
  .quick-grid {
    grid-template-columns: 1fr;
  }
}
</style>
