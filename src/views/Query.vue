<template>
  <Layout>
    <div class="query-page">
      <!-- 筛选条件 -->
      <van-cell-group inset class="filter-section">
        <div class="filter-header">
          <span class="filter-title">筛选条件</span>
          <div class="filter-actions">
            <van-tag v-if="hasActiveFilters" type="primary" size="medium" round>
              {{ activeFilterCount }}个筛选
            </van-tag>
            <van-button v-if="hasActiveFilters" size="mini" plain color="#ffffff" text-color="#667eea"
              @click="resetAllFilters">
              重置
            </van-button>
          </div>
        </div>

        <van-field v-model="selectedPersonName" is-link readonly label="人物" placeholder="全部"
          @click="showPersonPicker = true" clearable @clear="clearPersonFilter" />

        <van-field v-model="selectedCategoryName" is-link readonly label="分类" placeholder="全部"
          @click="showCategoryPicker = true" clearable @clear="clearCategoryFilter">
          <template #right-icon>
            <!-- 查询页不需要管理分类功能 -->
          </template>
        </van-field>

        <van-field v-model="dateRangeText" is-link readonly label="时间" placeholder="全部" @click="showDatePicker = true"
          clearable @clear="clearDateFilter" />
      </van-cell-group>

      <!-- 统计卡片 -->
      <van-cell-group inset class="stats-card">
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
            <div class="stat-label">笔数</div>
            <div class="stat-value count">{{ statistics.count }}</div>
          </div>
        </div>
      </van-cell-group>

      <!-- 记录列表 -->
      <div class="records-list-section">
        <div class="section-header">
          <h3 class="title">记录列表</h3>
          <span class="count">共 {{ filteredRecords.length }} 条</span>
        </div>

        <RecordList :records="filteredRecords" :persons="persons" :categories="categories" :show-icon="false"
          :show-actions="true" empty-text="暂无符合条件的记录" @edit="editRecord" @delete="deleteRecord" />
      </div>

      <!-- 人物选择器 -->
      <van-popup v-model:show="showPersonPicker" position="bottom" round>
        <van-picker :columns="personColumns" @confirm="onPersonConfirm" @cancel="showPersonPicker = false" />
      </van-popup>

      <!-- 分类选择器 -->
      <van-popup v-model:show="showCategoryPicker" position="bottom" round :style="{ height: '70%' }">
        <CategoryPicker v-model="filters.categoryId" :categories="categories" @add="handleQuickAddCategory"
          @close="onCategoryClose" />
      </van-popup>

      <!-- 日期范围选择器 -->
      <van-popup v-model:show="showDatePicker" position="bottom" round>
        <div class="date-picker-container">
          <van-date-picker v-model="startDate" title="开始日期" @confirm="onStartDateConfirm"
            @cancel="showDatePicker = false" />
          <div class="date-separator">至</div>
          <van-date-picker v-model="endDate" title="结束日期" @confirm="onEndDateConfirm"
            @cancel="showDatePicker = false" />
          <van-button block type="primary" @click="applyDateFilter">确定</van-button>
        </div>
      </van-popup>

      <!-- 快速添加分类对话框 -->
      <van-dialog v-model:show="showQuickAddCategory" title="添加新分类" show-cancel-button cancel-button-text="取消"
        confirm-button-text="添加" @confirm="confirmQuickAddCategory">
        <van-field v-model="quickAddCategoryName" placeholder="请输入分类名称" clearable maxlength="10" show-word-limit
          autofocus />
      </van-dialog>

      <!-- 编辑记录对话框 -->
      <van-dialog 
        v-model:show="showEditDialog" 
        :title="'编辑记录'" 
        show-cancel-button 
        cancel-button-text="取消"
        confirm-button-text="保存" 
        @confirm="confirmEditRecord"
        class="edit-record-dialog"
      >
        <div class="edit-form">
          <!-- 类型选择 -->
          <van-radio-group v-model="editFormData.type" direction="horizontal" class="edit-type-group">
            <van-radio name="expense">支出</van-radio>
            <van-radio name="income">收入</van-radio>
          </van-radio-group>

          <!-- 金额 -->
          <van-field
            v-model="editFormData.amount"
            label="金额"
            placeholder="请输入金额"
            type="number"
          >
            <template #label>
              <span style="color: #ee0a24">￥</span>
            </template>
          </van-field>

          <!-- 人物选择 -->
          <van-field
            v-model="editSelectedPersonName"
            is-link
            readonly
            label="人物"
            placeholder="请选择人物"
            @click="showEditPersonPicker = true"
          />

          <!-- 分类选择 -->
          <van-field
            v-model="editSelectedCategoryName"
            is-link
            readonly
            label="分类"
            placeholder="请选择分类"
            @click="showEditCategoryPicker = true"
          />

          <!-- 日期选择 -->
          <van-field
            v-model="editFormData.date"
            is-link
            readonly
            label="日期"
            placeholder="请选择日期"
            @click="showEditDatePicker = true"
          />

          <!-- 备注 -->
          <van-field
            v-model="editFormData.note"
            label="备注"
            type="textarea"
            placeholder="选填"
            rows="2"
          />
        </div>
      </van-dialog>

      <!-- 编辑时的人物选择器 -->
      <van-popup v-model:show="showEditPersonPicker" position="bottom" round>
        <van-picker :columns="personColumns" @confirm="onEditPersonConfirm" @cancel="showEditPersonPicker = false" />
      </van-popup>

      <!-- 编辑时的分类选择器 -->
      <van-popup v-model:show="showEditCategoryPicker" position="bottom" round :style="{ height: '70%' }">
        <CategoryPicker 
          v-model="editFormData.categoryId" 
          :categories="categories" 
          @close="showEditCategoryPicker = false" 
        />
      </van-popup>

      <!-- 编辑时的日期选择器 -->
      <van-popup v-model:show="showEditDatePicker" position="bottom" round>
        <van-date-picker 
          v-model="editDateValue" 
          title="选择日期" 
          @confirm="onEditDateConfirm" 
          @cancel="showEditDatePicker = false" 
        />
      </van-popup>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog, closeToast } from 'vant';
import dayjs from 'dayjs';
import Layout from '../components/Layout.vue';
import CategoryPicker from '../components/CategoryPicker.vue';
import RecordList from '../components/RecordList.vue';
import { recordAPI } from '../database/recordAPI';
import { personAPI } from '../database/personAPI';
import { categoryAPI } from '../database/categoryAPI';
import { backupAPI } from '../database/backupAPI';

const router = useRouter();

// 筛选条件
const filters = ref({
  personId: null,
  categoryId: null,
  startDate: null,
  endDate: null
});

// 选择器状态
const showPersonPicker = ref(false);
const showCategoryPicker = ref(false);
const showDatePicker = ref(false);
const showQuickAddCategory = ref(false);

// 编辑相关状态
const showEditDialog = ref(false);
const showEditPersonPicker = ref(false);
const showEditCategoryPicker = ref(false);
const showEditDatePicker = ref(false);
const editFormData = ref({
  id: null,
  type: 'expense',
  amount: '',
  personId: null,
  categoryId: null,
  date: '',
  note: ''
});
const editDateValue = ref([dayjs().year(), dayjs().month() + 1, dayjs().date()]);

// 数据列表
const allRecords = ref([]);
const filteredRecords = ref([]);
const persons = ref([]);
const categories = ref([]);
const statistics = ref({ income: 0, expense: 0, balance: 0, count: 0 });
const quickAddCategoryName = ref('');

// 日期选择
const startDate = ref([dayjs().year() - 1, dayjs().month() + 1, dayjs().date()]);
const endDate = ref([dayjs().year(), dayjs().month() + 1, dayjs().date()]);

// 计算属性
const selectedPersonName = computed(() => {
  if (!filters.value.personId) return '';
  const person = persons.value.find(p => p.id === filters.value.personId);
  return person ? person.path : '';
});

const selectedCategoryName = computed(() => {
  if (!filters.value.categoryId) return '';
  const category = categories.value.find(c => c.id === filters.value.categoryId);
  return category ? category.name : '';
});

const dateRangeText = computed(() => {
  if (!filters.value.startDate || !filters.value.endDate) return '';
  return `${filters.value.startDate} 至 ${filters.value.endDate}`;
});

// 编辑时的人物名称
const editSelectedPersonName = computed(() => {
  if (!editFormData.value.personId) return '';
  const person = persons.value.find(p => p.id === editFormData.value.personId);
  return person ? person.path : '';
});

// 编辑时的分类名称
const editSelectedCategoryName = computed(() => {
  if (!editFormData.value.categoryId) return '';
  const category = categories.value.find(c => c.id === editFormData.value.categoryId);
  return category ? category.name : '';
});

// 是否有激活的筛选条件
const hasActiveFilters = computed(() => {
  return filters.value.personId !== null ||
    filters.value.categoryId !== null ||
    filters.value.startDate !== null ||
    filters.value.endDate !== null;
});

// 激活的筛选条件数量
const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.personId !== null) count++;
  if (filters.value.categoryId !== null) count++;
  if (filters.value.startDate !== null || filters.value.endDate !== null) count++;
  return count;
});

const personColumns = computed(() => {
  return [
    { text: '全部', value: null },
    ...persons.value.map(p => ({
      text: p.path,
      value: p.id
    }))
  ];
});

// 快速添加分类（从选择器）
function handleQuickAddCategory() {
  showCategoryPicker.value = false;
  showQuickAddCategory.value = true;
  quickAddCategoryName.value = '';
}

// 确认快速添加
async function confirmQuickAddCategory() {
  if (!quickAddCategoryName.value.trim()) {
    showToast('请输入分类名称');
    return;
  }

  const exists = categories.value.some(c => c.name === quickAddCategoryName.value.trim());
  if (exists) {
    showToast('该分类已存在');
    return;
  }

  try {
    await categoryAPI.add({
      name: quickAddCategoryName.value.trim(),
      type: 'expense' // 默认类型为支出
    });

    showToast('添加成功');
    await loadCategories();

    // 自动选中新添加的分类
    const newCategory = categories.value.find(c => c.name === quickAddCategoryName.value.trim());
    if (newCategory) {
      filters.value.categoryId = newCategory.id;
      // 触发查询
      applyFilters();
    }

    quickAddCategoryName.value = '';
  } catch (error) {
    console.error('添加分类失败:', error);
    showToast('添加失败');
  }
}

// 加载数据
onMounted(async () => {
  await loadData();
});

async function loadData() {
  try {
    // 加载所有数据
    allRecords.value = await recordAPI.getAll();
    persons.value = await personAPI.getAll();
    await loadCategories();

    // 应用筛选
    applyFilters();
  } catch (error) {
    console.error('加载数据失败:', error);
    showToast('加载数据失败');
  }
}

// 加载分类
async function loadCategories() {
  categories.value = await categoryAPI.getAll();
}

// 应用筛选
async function applyFilters() {
  try {
    // 显示加载提示
    showToast({ type: 'loading', message: '查询中...', duration: 0 });

    filteredRecords.value = await recordAPI.query(filters.value);
    statistics.value = await recordAPI.getStatistics(filters.value);

    // 关闭加载提示
    closeToast();
  } catch (error) {
    console.error('筛选失败:', error);
    closeToast();
    showToast('查询失败');
  }
}

// 获取人物名称
function getPersonName(personId) {
  const person = persons.value.find(p => p.id === personId);
  return person ? person.path : '未知';
}

// 格式化日期
function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

// 人物选择确认
function onPersonConfirm({ selectedOptions }) {
  filters.value.personId = selectedOptions[0].value;
  showPersonPicker.value = false;
  applyFilters();
}

// 分类选择关闭（触发查询）
function onCategoryClose() {
  showCategoryPicker.value = false;
  applyFilters();
}

// 开始日期确认
function onStartDateConfirm({ selectedValues }) {
  const [year, month, date] = selectedValues;
  startDate.value = selectedValues;
}

// 结束日期确认
function onEndDateConfirm({ selectedValues }) {
  const [year, month, date] = selectedValues;
  endDate.value = selectedValues;
}

// 应用日期筛选
function applyDateFilter() {
  const [startYear, startMonth, startDay] = startDate.value;
  const [endYear, endMonth, endDay] = endDate.value;

  filters.value.startDate = `${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
  filters.value.endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

  showDatePicker.value = false;
  applyFilters();
}

// 清除筛选
function clearPersonFilter() {
  filters.value.personId = null;
  applyFilters();
}

function clearCategoryFilter() {
  filters.value.categoryId = null;
  applyFilters();
}

function clearDateFilter() {
  filters.value.startDate = null;
  filters.value.endDate = null;
  applyFilters();
}

// 重置所有筛选
function resetAllFilters() {
  filters.value = {
    personId: null,
    categoryId: null,
    startDate: null,
    endDate: null
  };
  applyFilters();
  showToast('已重置所有筛选');
}

// 编辑记录
function editRecord(record) {
  // 填充编辑表单
  editFormData.value = {
    id: record.id,
    type: record.type,
    amount: record.amount.toString(),
    personId: record.personId,
    categoryId: record.categoryId,
    date: dayjs(record.date).format('YYYY-MM-DD'),
    note: record.note || ''
  };
  
  // 设置日期选择器的值
  const dateParts = editFormData.value.date.split('-');
  editDateValue.value = [
    parseInt(dateParts[0]),
    parseInt(dateParts[1]),
    parseInt(dateParts[2])
  ];
  
  // 显示编辑对话框
  showEditDialog.value = true;
}

// 确认编辑记录
async function confirmEditRecord() {
  try {
    // 验证数据
    if (!editFormData.value.amount || parseFloat(editFormData.value.amount) <= 0) {
      showToast('请输入有效金额');
      return false; // 阻止对话框关闭
    }
    
    if (!editFormData.value.personId) {
      showToast('请选择人物');
      return false;
    }
    
    if (!editFormData.value.categoryId) {
      showToast('请选择分类');
      return false;
    }
    
    // 更新记录
    await recordAPI.update(editFormData.value.id, {
      type: editFormData.value.type,
      amount: parseFloat(editFormData.value.amount),
      personId: editFormData.value.personId,
      categoryId: editFormData.value.categoryId,
      date: editFormData.value.date,
      note: editFormData.value.note
    });
    
    showToast('修改成功');
    await loadData();
    
    // 更新轻量备份
    backupAPI.createLightweightBackup();
    
    return true; // 关闭对话框
  } catch (error) {
    console.error('修改失败:', error);
    showToast('修改失败');
    return false; // 阻止对话框关闭
  }
}

// 编辑时的人物选择确认
function onEditPersonConfirm({ selectedOptions }) {
  editFormData.value.personId = selectedOptions[0].value;
  showEditPersonPicker.value = false;
}

// 编辑时的日期选择确认
function onEditDateConfirm({ selectedValues }) {
  const [year, month, day] = selectedValues;
  editFormData.value.date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  showEditDatePicker.value = false;
}

// 删除记录
async function deleteRecord(record) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: '确定要删除这条记录吗？'
    });

    await recordAPI.delete(record.id);
    showToast('删除成功');
    await loadData();

    // 更新轻量备份
    backupAPI.createLightweightBackup();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      showToast('删除失败');
    }
  }
}
</script>

<style scoped>
.query-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 50px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fff;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.filter-section {
  margin: 16px;
  border-radius: 12px;
  overflow: hidden;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-actions .van-button {
  color: #667eea !important;
  border-color: #ffffff !important;
  background-color: #ffffff !important;
}

/* 编辑对话框样式 */
.edit-record-dialog {
  max-height: 80vh;
  overflow-y: auto;
}

.edit-form {
  padding: 16px;
}

.edit-type-group {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.stats-card {
  margin: 0 16px 16px;
  border-radius: 12px;
  overflow: hidden;
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
  font-size: 18px;
  font-weight: bold;
}

.stat-value.income {
  color: #07c160;
}

.stat-value.expense {
  color: #ee0a24;
}

.stat-value.count {
  color: #1989fa;
}

.records-list-section {
  margin: 0 16px;
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px 6px;
  font-weight: bold;
}

.title {
  font-size: 16px;
}

.count {
  font-size: 12px;
  color: #969799;
  font-weight: normal;
}

.date-picker-container {
  padding: 16px;
}

.date-separator {
  text-align: center;
  padding: 8px 0;
  color: #969799;
}
</style>
