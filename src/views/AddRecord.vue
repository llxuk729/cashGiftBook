<template>
  <Layout>
    <div class="add-record-page">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="eyebrow">礼金记账</span>
          <h2 class="page-title">让每一笔都记得快、看得清、以后找得到</h2>
          <p class="page-subtitle">
            先填金额，再选关系和分类，整条流程围绕快速记账设计。
          </p>
        </div>

        <div class="hero-actions">
          <button
            type="button"
            class="type-pill"
            :class="{ active: formData.type === 'expense' }"
            @click="formData.type = 'expense'"
          >
            支出
          </button>
          <button
            type="button"
            class="type-pill"
            :class="{ active: formData.type === 'income' }"
            @click="formData.type = 'income'"
          >
            收入
          </button>
        </div>

        <div class="amount-panel">
          <span class="currency">RMB</span>
          <input
            v-model="formData.amount"
            type="number"
            class="amount-input"
            placeholder="0.00"
            inputmode="decimal"
          />
        </div>

        <div class="summary-grid">
          <button
            type="button"
            class="summary-card"
            @click="showRelationshipPicker = true"
          >
            <span class="summary-label">关系</span>
            <strong>{{ selectedRelationshipName || "选关系" }}</strong>
            <small>{{ relationshipHint }}</small>
          </button>
          <button
            type="button"
            class="summary-card"
            @click="showCategoryPicker = true"
          >
            <span class="summary-label">分类</span>
            <strong>{{ selectedCategoryName || "选分类" }}</strong>
            <small>{{ categoryHint }}</small>
          </button>
          <button
            type="button"
            class="summary-card"
            @click="showDatePicker = true"
          >
            <span class="summary-label">日期</span>
            <strong>{{ formData.date }}</strong>
            <small>点按即可修改</small>
          </button>
        </div>
      </section>

      <van-form @submit="onSubmit" class="record-form">
        <section class="form-card">
          <div class="card-title-row">
            <h3>往来对象</h3>
            <button
              type="button"
              class="text-link"
              @click="showRelationshipPicker = true"
            >
              重新选择关系
            </button>
          </div>

          <van-field
            v-model="formData.name"
            name="name"
            label="姓名"
            placeholder="输入真实姓名或常用称呼"
            clearable
            :rules="[{ required: true, message: '请输入姓名' }]"
          />

          <van-field
            :model-value="selectedRelationshipName"
            is-link
            readonly
            name="relationship"
            label="关系"
            placeholder="点击选择关系"
            @click="showRelationshipPicker = true"
            clearable
            @clear="clearRelationship"
          />
        </section>

        <section class="form-card">
          <div class="card-title-row">
            <h3>记账内容</h3>
            <span class="micro-tip">分类是统计的关键，建议每笔都选</span>
          </div>

          <van-field
            :model-value="selectedCategoryName"
            is-link
            readonly
            name="category"
            label="分类"
            placeholder="请选择分类"
            @click="showCategoryPicker = true"
            :rules="[{ required: true, message: '请选择分类' }]"
          />

          <van-field
            v-model="formData.date"
            is-link
            readonly
            name="date"
            label="日期"
            placeholder="请选择日期"
            @click="showDatePicker = true"
            :rules="[{ required: true, message: '请选择日期' }]"
          />

          <van-field
            v-model="formData.note"
            name="note"
            label="备注"
            type="textarea"
            placeholder="例如：代全家随礼、补送礼金"
            rows="3"
            autosize
          />
        </section>

        <div class="submit-bar">
          <div class="submit-meta">{{ submitSummary }}</div>
          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="submitting"
            class="submit-button"
          >
            保存这笔记录
          </van-button>
        </div>
      </van-form>

      <van-popup
        v-model:show="showRelationshipPicker"
        position="bottom"
        round
        :style="{ height: '85%' }"
      >
        <div class="selector-header fancy">
          <div>
            <span class="title">选择往来关系</span>
            <p>支持搜索历史对象，也支持先选关系模板再填姓名</p>
          </div>
          <van-icon name="cross" @click="showRelationshipPicker = false" />
        </div>
        <FamilyMemberSelector @select="onRelationshipConfirm" />
      </van-popup>

      <van-popup
        v-model:show="showCategoryPicker"
        position="bottom"
        round
        :style="{ height: '72%' }"
      >
        <CategoryPicker
          ref="categoryPickerRef"
          v-model="formData.categoryId"
          :categories="filteredCategories"
          @add="handleQuickAddCategory"
          @close="showCategoryPicker = false"
          @delete="handleDeleteCategory"
        />
      </van-popup>

      <van-dialog
        v-model:show="showQuickAddCategory"
        title="添加新分类"
        show-cancel-button
        cancel-button-text="取消"
        confirm-button-text="添加"
        @confirm="confirmQuickAddCategory"
      >
        <van-field
          v-model="quickAddCategoryName"
          placeholder="请输入分类名称"
          clearable
          maxlength="10"
          show-word-limit
          autofocus
        />
      </van-dialog>

      <van-popup v-model:show="showDatePicker" position="bottom" round>
        <van-date-picker
          v-model="currentDate"
          title="选择日期"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
    </div>
  </Layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { showToast } from "vant";
import dayjs from "dayjs";
import Layout from "../components/Layout.vue";
import CategoryPicker from "../components/CategoryPicker.vue";
import FamilyMemberSelector from "../components/FamilyMemberSelector.vue";
import { recordAPI } from "../database/recordAPI";
import { personAPI } from "../database/personAPI";
import { categoryAPI } from "../database/categoryAPI";
import { backupAPI } from "../database/backupAPI";
import { getRelationshipLabel } from "../utils/relationship";

const categoryPickerRef = ref(null);

const formData = ref({
  type: "expense",
  amount: "",
  name: "",
  relationshipId: null,
  relationshipType: "",
  categoryId: null,
  date: dayjs().format("YYYY-MM-DD"),
  note: "",
});

const persons = ref([]);
const categories = ref([]);
const submitting = ref(false);
const showRelationshipPicker = ref(false);
const showCategoryPicker = ref(false);
const showDatePicker = ref(false);
const showQuickAddCategory = ref(false);
const currentDate = ref([dayjs().year(), dayjs().month() + 1, dayjs().date()]);
const quickAddCategoryName = ref("");

const selectedRelationshipName = computed(() => {
  if (formData.value.relationshipId) {
    const person = persons.value.find(
      (item) => item.id === formData.value.relationshipId,
    );
    return person
      ? `${person.name} / ${getRelationshipLabel(person.relationship)}`
      : "";
  }

  if (formData.value.relationshipType) {
    return getRelationshipLabel(formData.value.relationshipType);
  }

  return "";
});

const selectedCategoryName = computed(() => {
  if (!formData.value.categoryId) return "";
  const category = categories.value.find(
    (item) => item.id === formData.value.categoryId,
  );
  return category ? category.name : "";
});

const relationshipHint = computed(() => {
  if (formData.value.relationshipId) {
    return "已绑定常用联系人";
  }

  if (formData.value.relationshipType) {
    return "已选关系模板，可继续填姓名";
  }

  return "先选关系，记账更顺手";
});

const filteredCategories = computed(() => {
  return categories.value.filter(
    (category) => category.type === formData.value.type,
  );
});

const categoryHint = computed(() => {
  if (selectedCategoryName.value) {
    return formData.value.type === "income"
      ? "收入分类已就绪"
      : "支出分类已就绪";
  }

  return formData.value.type === "income" ? "请选择收入分类" : "请选择支出分类";
});

const submitSummary = computed(() => {
  const name = formData.value.name.trim() || "未填写姓名";
  const amount = formData.value.amount
    ? `RMB ${formData.value.amount}`
    : "未填写金额";
  const category = selectedCategoryName.value || "未选分类";
  return `${name} / ${amount} / ${category}`;
});

watch(showCategoryPicker, (visible) => {
  if (!visible && categoryPickerRef.value) {
    categoryPickerRef.value.resetEditMode();
  }
});

watch(
  () => formData.value.type,
  async () => {
    await loadCategories();
    if (
      !filteredCategories.value.some(
        (category) => category.id === formData.value.categoryId,
      )
    ) {
      formData.value.categoryId = null;
    }
  },
);

onMounted(async () => {
  try {
    await loadCategories();
    persons.value = await personAPI.getAll();
  } catch (error) {
    console.error("加载数据失败:", error);
    showToast("加载数据失败");
  }
});

async function loadCategories() {
  categories.value = await categoryAPI.getAll();
}

function handleQuickAddCategory() {
  showCategoryPicker.value = false;
  showQuickAddCategory.value = true;
  quickAddCategoryName.value = "";
}

async function handleDeleteCategory(categoryId) {
  try {
    await categoryAPI.delete(categoryId);
    await loadCategories();

    if (formData.value.categoryId === categoryId) {
      formData.value.categoryId = null;
    }
  } catch (error) {
    console.error("删除分类失败:", error);
    showToast("删除失败");
  }
}

function onRelationshipConfirm(payload) {
  if (!payload) return;

  if (payload.kind === "person" && payload.person) {
    formData.value.relationshipId = payload.person.id;
    formData.value.relationshipType = payload.person.relationship;
    formData.value.name = payload.person.name;
  }

  if (payload.kind === "template") {
    formData.value.relationshipId = null;
    formData.value.relationshipType = payload.relationType;
  }

  showRelationshipPicker.value = false;
}

function clearRelationship() {
  formData.value.relationshipId = null;
  formData.value.relationshipType = "";
}

async function confirmQuickAddCategory() {
  const name = quickAddCategoryName.value.trim();
  if (!name) {
    showToast("请输入分类名称");
    return;
  }

  const exists = categories.value.some(
    (category) =>
      category.name === name && category.type === formData.value.type,
  );
  if (exists) {
    showToast("该分类已存在");
    return;
  }

  try {
    await categoryAPI.add({
      name,
      type: formData.value.type,
      deletable: true,
    });

    await loadCategories();
    const newCategory = categories.value.find(
      (category) =>
        category.name === name && category.type === formData.value.type,
    );
    if (newCategory) {
      formData.value.categoryId = newCategory.id;
    }

    quickAddCategoryName.value = "";
    showToast("添加成功");
  } catch (error) {
    console.error("添加分类失败:", error);
    showToast("添加失败");
  }
}

function onDateConfirm({ selectedValues }) {
  const [year, month, date] = selectedValues;
  formData.value.date = `${year}-${String(month).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
  showDatePicker.value = false;
}

async function onSubmit() {
  try {
    submitting.value = true;

    if (!formData.value.amount || parseFloat(formData.value.amount) <= 0) {
      showToast("请输入有效金额");
      return;
    }

    if (!formData.value.name.trim()) {
      showToast("请输入姓名");
      return;
    }

    if (!formData.value.categoryId) {
      showToast("请选择分类");
      return;
    }

    let relationshipId = formData.value.relationshipId;

    if (relationshipId) {
      const selectedPerson = persons.value.find(
        (item) => item.id === relationshipId,
      );
      if (selectedPerson) {
        const result = await personAPI.findOrCreatePerson(
          formData.value.name.trim(),
          selectedPerson.relationship,
          selectedPerson.parentId,
        );
        relationshipId = result.id;
      }
    } else if (formData.value.relationshipType) {
      const result = await personAPI.findOrCreatePerson(
        formData.value.name.trim(),
        formData.value.relationshipType,
        null,
      );
      relationshipId = result.id;
    }

    await recordAPI.add({
      ...formData.value,
      amount: parseFloat(formData.value.amount),
      name: formData.value.name.trim(),
      relationshipId,
    });

    backupAPI.createLightweightBackup();
    showToast("保存成功");

    setTimeout(() => {
      window.history.back();
    }, 500);
  } catch (error) {
    console.error("保存失败:", error);
    showToast(`保存失败: ${error.message}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.add-record-page {
  min-height: 100vh;
  padding: 18px 16px 110px;
  background:
    radial-gradient(circle at top, rgba(111, 140, 255, 0.18), transparent 32%),
    linear-gradient(180deg, #f5f7ff 0%, #eef2ff 100%);
}

.hero-card,
.form-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(14px);
  box-shadow: 0 22px 50px rgba(76, 92, 140, 0.14);
}

.hero-card {
  padding: 22px 18px 18px;
  border-radius: 28px;
}

.eyebrow {
  display: inline-flex;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(111, 140, 255, 0.12);
  color: #556bdb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.page-title {
  margin: 6px 0 0;
  font-size: 28px;
  line-height: 1.25;
  font-weight: 700;
  color: #18213d;
}

.page-subtitle {
  margin-top: 10px;
  font-size: 14px;
  line-height: 1.6;
  color: #687393;
}

.hero-actions {
  display: inline-flex;
  gap: 10px;
  margin-top: 18px;
  padding: 6px;
  border-radius: 999px;
  background: #eef2ff;
}

.type-pill {
  min-width: 92px;
  padding: 12px 18px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #67728f;
  font-weight: 700;
  transition: all 0.22s ease;
}

.type-pill.active {
  background: linear-gradient(135deg, #6f8cff, #5877ff);
  color: #fff;
  box-shadow: 0 12px 22px rgba(92, 119, 255, 0.28);
}

.amount-panel {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-top: 20px;
  padding: 18px 18px 10px;
  border-radius: 24px;
  background: linear-gradient(135deg, #18213d, #25345f);
  color: #fff;
}

.currency {
  font-size: 26px;
  font-weight: 700;
  opacity: 0.88;
}

.amount-input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #fff;
  font-size: 38px;
  font-weight: 700;
}

.amount-input::placeholder {
  color: rgba(255, 255, 255, 0.42);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px;
  border: none;
  border-radius: 22px;
  background: linear-gradient(180deg, #ffffff, #f7f9ff);
  text-align: left;
  box-shadow: inset 0 0 0 1px rgba(111, 140, 255, 0.08);
}

.summary-card strong {
  font-size: 16px;
  color: #1f2a48;
}

.summary-card small,
.summary-label {
  color: #7d87a5;
}

.summary-label {
  font-size: 12px;
}

.record-form {
  padding-top: 16px;
}

.form-card {
  margin-top: 14px;
  padding: 10px 0;
  border-radius: 24px;
  overflow: hidden;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px 10px;
}

.card-title-row h3 {
  margin: 0;
  font-size: 16px;
  color: #18213d;
}

.text-link,
.micro-tip {
  font-size: 12px;
  color: #7d87a5;
}

.text-link {
  border: none;
  background: transparent;
  color: #5d75f8;
}

.submit-bar {
  position: sticky;
  bottom: 82px;
  z-index: 5;
  margin-top: 18px;
  padding: 12px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 40px rgba(76, 92, 140, 0.16);
  backdrop-filter: blur(16px);
}

.submit-meta {
  margin-bottom: 10px;
  font-size: 13px;
  color: #6c7693;
}

.submit-button {
  height: 46px;
  font-weight: 700;
  box-shadow: 0 12px 28px rgba(92, 119, 255, 0.24);
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 18px 14px;
  border-bottom: 1px solid #edf1ff;
}

.selector-header.fancy {
  background: linear-gradient(
    135deg,
    rgba(111, 140, 255, 0.1),
    rgba(82, 196, 255, 0.1)
  );
}

.selector-header .title {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2a48;
}

.selector-header p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #7d87a5;
}

button {
  cursor: pointer;
}

@media (max-width: 420px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 24px;
  }

  .amount-input {
    font-size: 32px;
  }
}
</style>
