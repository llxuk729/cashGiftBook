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
            class="quick-card quick"
            @click="showQuickRecord = true"
          >
            <span class="quick-icon">⚡</span>
            <strong>快速记账</strong>
            <small>3秒完成记录</small>
          </button>
          <button
            type="button"
            class="quick-card primary"
            @click="goToAddRecord"
          >
            <span class="quick-icon">记</span>
            <strong>记一笔</strong>
            <small>完整记账流程</small>
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

      <!-- 快速记账弹窗 -->
      <van-popup 
        v-model:show="showQuickRecord" 
        position="bottom" 
        round
        :style="{ padding: '20px' }"
      >
        <div class="quick-record-modal">
          <div class="modal-header">
            <h3>快速记账</h3>
            <van-icon name="cross" @click="showQuickRecord = false" />
          </div>

          <div class="quick-form">
            <!-- 金额输入 -->
            <div class="amount-section">
              <div class="amount-display">¥{{ quickForm.amount || '0' }}</div>
              <div class="amount-buttons">
                <van-button size="small" plain @click="addAmount(100)">+100</van-button>
                <van-button size="small" plain @click="addAmount(200)">+200</van-button>
                <van-button size="small" plain @click="addAmount(500)">+500</van-button>
                <van-button size="small" plain @click="addAmount(1000)">+1000</van-button>
              </div>
              <van-field
                v-model="quickForm.amount"
                type="number"
                placeholder="输入金额"
                autofocus
              >
                <template #button>
                  <van-icon 
                    v-if="speechSupported"
                    name="guide-o" 
                    @click="startVoiceInput"
                    :class="{ 'voice-active': isListening }"
                    title="语音输入金额"
                  />
                </template>
              </van-field>
            </div>

            <!-- 类型选择 -->
            <van-radio-group v-model="quickForm.type" direction="horizontal" class="type-selector">
              <van-radio name="expense">支出</van-radio>
              <van-radio name="income">收入</van-radio>
            </van-radio-group>

            <!-- 姓名输入 -->
            <van-field
              v-model="quickForm.name"
              placeholder="对方姓名（可选）"
              clearable
            />

            <!-- 备注输入 -->
            <van-field
              v-model="quickForm.note"
              type="textarea"
              placeholder="备注（可选，如：婚礼、生日等）"
              rows="2"
              autosize
            />

            <!-- 提交按钮 -->
            <van-button
              round
              block
              type="primary"
              @click="submitQuickRecord"
              :loading="quickSubmitting"
              class="submit-btn"
            >
              保存
            </van-button>
          </div>
        </div>
      </van-popup>
    </div>
  </Layout>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { showToast } from "vant";
import dayjs from "dayjs";
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
const showQuickRecord = ref(false);
const quickSubmitting = ref(false);
const speechSupported = ref(false);
const isListening = ref(false);
let recognition = null;

// 快速记账表单
const quickForm = ref({
  type: 'expense',
  amount: '',
  name: '',
  note: ''
});

onMounted(async () => {
  await loadData();
  initSpeechRecognition();

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

// 快速记账相关函数
function addAmount(value) {
  const current = parseFloat(quickForm.value.amount) || 0;
  quickForm.value.amount = (current + value).toString();
}

// 初始化语音识别
function initSpeechRecognition() {
  if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // 提取数字
      const numbers = transcript.match(/\d+/);
      if (numbers) {
        quickForm.value.amount = numbers[0];
        showToast(`识别到: ${numbers[0]}元`);
      } else {
        showToast('未识别到数字');
      }
      isListening.value = false;
    };

    recognition.onerror = () => {
      showToast('语音识别失败');
      isListening.value = false;
    };

    recognition.onend = () => {
      isListening.value = false;
    };

    speechSupported.value = true;
  }
}

// 开始语音输入
function startVoiceInput() {
  if (!recognition) {
    initSpeechRecognition();
  }

  if (isListening.value) {
    recognition.stop();
    isListening.value = false;
  } else {
    try {
      recognition.start();
      isListening.value = true;
      showToast('请说出金额');
    } catch (error) {
      showToast('语音识别启动失败');
    }
  }
}

async function submitQuickRecord() {
  try {
    if (!quickForm.value.amount || parseFloat(quickForm.value.amount) <= 0) {
      showToast('请输入有效金额');
      return;
    }

    quickSubmitting.value = true;

    // 获取默认分类（如果没有则创建）
    let categoryId = null;
    const defaultCategoryName = quickForm.value.type === 'expense' ? '其他支出' : '其他收入';
    let category = categories.value.find(c => c.name === defaultCategoryName && c.type === quickForm.value.type);
    
    if (!category) {
      // 创建默认分类
      const newCategory = await categoryAPI.add({
        name: defaultCategoryName,
        type: quickForm.value.type
      });
      categoryId = newCategory.id;
      await loadCategories();
    } else {
      categoryId = category.id;
    }

    // 保存记录
    await recordAPI.add({
      type: quickForm.value.type,
      amount: parseFloat(quickForm.value.amount),
      name: quickForm.value.name.trim() || '未命名',
      relationshipId: null,
      categoryId: categoryId,
      date: dayjs().format('YYYY-MM-DD'),
      note: quickForm.value.note.trim()
    });

    showToast('保存成功');

    // 更新轻量备份
    backupAPI.createLightweightBackup();

    // 重置表单并关闭弹窗
    quickForm.value = {
      type: 'expense',
      amount: '',
      name: '',
      note: ''
    };
    showQuickRecord.value = false;

    // 刷新首页数据
    await loadData();
  } catch (error) {
    console.error('快速记账失败:', error);
    showToast('保存失败');
  } finally {
    quickSubmitting.value = false;
  }
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

.quick-card.quick {
  background: linear-gradient(
    135deg,
    rgba(255, 193, 7, 0.16),
    rgba(255, 152, 0, 0.18)
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

/* 快速记账弹窗样式 */
.quick-record-modal {
  padding-bottom: 20px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #323233;
}

.modal-header .van-icon {
  font-size: 20px;
  color: #969799;
  cursor: pointer;
}

.amount-section {
  margin-bottom: 20px;
}

.amount-display {
  font-size: 48px;
  font-weight: bold;
  color: #ee0a24;
  text-align: center;
  margin-bottom: 16px;
  min-height: 60px;
}

.amount-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.amount-buttons .van-button {
  height: 36px;
  font-size: 14px;
}

.voice-active {
  color: #ee0a24;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.type-selector {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.submit-btn {
  margin-top: 20px;
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
