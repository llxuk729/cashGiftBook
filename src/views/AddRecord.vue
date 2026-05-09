<template>
  <Layout>
    <div class="add-record-page">
      <div class="page-header">
        <h2 class="page-title">记一笔</h2>
      </div>

      <van-form @submit="onSubmit" class="record-form">
        <!-- 类型选择 -->
        <van-cell-group inset>
          <van-field name="type" label="类型">
            <template #input>
              <van-radio-group v-model="formData.type" direction="horizontal">
                <van-radio name="expense">支出</van-radio>
                <van-radio name="income">收入</van-radio>
              </van-radio-group>
            </template>
          </van-field>
        </van-cell-group>

        <!-- 金额 -->
        <van-cell-group inset>
          <van-field v-model="formData.amount" name="amount" label="金额" placeholder="请输入金额" type="number"
            :rules="[{ required: true, message: '请输入金额' }]">
            <template #label>
              <span style="color: #ee0a24">¥</span>
            </template>
          </van-field>
        </van-cell-group>

        <!-- 姓名（必填） -->
        <van-cell-group inset>
          <van-field v-model="formData.name" name="name" label="姓名" placeholder="输入真实姓名或称呼（如：舅舅、张三）" clearable
            :rules="[{ required: true, message: '请输入姓名' }]">
            <template #label>
              姓名
            </template>
          </van-field>
        </van-cell-group>

        <!-- 关系选择（便捷标注） -->
        <van-cell-group inset>
          <van-field v-model="selectedRelationshipName" is-link readonly name="relationship" label="关系"
            placeholder="选择关系（用于统计和分析）" @click="showRelationshipPicker = true" clearable @clear="clearRelationship">
            <template #right-icon>
              <van-icon name="friends-o" size="18" color="#1989fa" @click.stop="goToPersonPage"
                style="padding: 0 8px; cursor: pointer;" title="管理人物关系" />
            </template>
          </van-field>
        </van-cell-group>

        <!-- 分类选择 -->
        <van-cell-group inset>
          <van-field v-model="selectedCategoryName" is-link readonly name="category" label="分类" placeholder="请选择分类"
            @click="showCategoryPicker = true" :rules="[{ required: true, message: '请选择分类' }]" />
        </van-cell-group>

        <!-- 日期选择 -->
        <van-cell-group inset>
          <van-field v-model="formData.date" is-link readonly name="date" label="日期" placeholder="请选择日期"
            @click="showDatePicker = true" :rules="[{ required: true, message: '请选择日期' }]" />
        </van-cell-group>

        <!-- 备注 -->
        <van-cell-group inset>
          <van-field v-model="formData.note" name="note" label="备注" type="textarea" placeholder="选填" rows="3"
            autosize />
        </van-cell-group>

        <!-- 提交按钮 -->
        <div class="submit-btn">
          <van-button round block type="primary" native-type="submit" :loading="submitting">
            保存
          </van-button>
        </div>
      </van-form>

      <!-- 关系选择器 -->
      <van-popup v-model:show="showRelationshipPicker" position="bottom" round :style="{ height: '80%' }">
        <div class="selector-header">
          <span class="title">选择家人关系</span>
          <van-icon name="cross" @click="showRelationshipPicker = false" />
        </div>
        <FamilyMemberSelector 
          ref="familyMemberRef"
          @select="onRelationshipConfirm"
          @add-person="handleAddPerson"
        />
      </van-popup>

      <!-- 分类选择器 -->
      <van-popup v-model:show="showCategoryPicker" position="bottom" round :style="{ height: '70%' }">
        <CategoryPicker 
          ref="categoryPickerRef"
          v-model="formData.categoryId" 
          :categories="categories" 
          @add="handleQuickAddCategory"
          @close="showCategoryPicker = false"
          @delete="handleDeleteCategory"
        />
      </van-popup>

      <!-- 快速添加分类对话框 -->
      <van-dialog v-model:show="showQuickAddCategory" title="添加新分类" show-cancel-button cancel-button-text="取消"
        confirm-button-text="添加" @confirm="confirmQuickAddCategory">
        <van-field v-model="quickAddCategoryName" placeholder="请输入分类名称" clearable maxlength="10" show-word-limit
          autofocus />
      </van-dialog>

      <!-- 日期选择器 -->
      <van-popup v-model:show="showDatePicker" position="bottom" round>
        <van-date-picker v-model="currentDate" title="选择日期" @confirm="onDateConfirm" @cancel="showDatePicker = false" />
      </van-popup>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import dayjs from 'dayjs';
import Layout from '../components/Layout.vue';
import CategoryPicker from '../components/CategoryPicker.vue';
import FamilyMemberSelector from '../components/FamilyMemberSelector.vue';
import { recordAPI } from '../database/recordAPI';
import { personAPI } from '../database/personAPI';
import { categoryAPI } from '../database/categoryAPI';
import { backupAPI } from '../database/backupAPI';

const router = useRouter();

// CategoryPicker 组件引用
const categoryPickerRef = ref(null);
// FamilyMemberSelector 组件引用
const familyMemberRef = ref(null);

// 表单数据
const formData = ref({
  type: 'expense',
  amount: '',
  name: '', // 姓名（必填）
  relationshipId: null, // 关系ID（可选，用于统计）
  categoryId: null,
  date: dayjs().format('YYYY-MM-DD'),
  note: ''
});

const submitting = ref(false);

// 选择器状态
const showRelationshipPicker = ref(false);
const showCategoryPicker = ref(false);
const showDatePicker = ref(false);
const showQuickAddCategory = ref(false);
const currentSelectedPath = ref([]); // 记录当前选择的路径

const hasSelectedPath = computed(() => currentSelectedPath.value.length > 0);

// 监听分类选择器弹窗关闭，重置编辑模式
watch(showCategoryPicker, (newValue) => {
  if (!newValue && categoryPickerRef.value) {
    // 弹窗关闭时，重置编辑模式
    categoryPickerRef.value.resetEditMode();
  }
});

// 数据列表
const persons = ref([]);
const categories = ref([]);
const currentDate = ref([dayjs().year(), dayjs().month() + 1, dayjs().date()]);
const quickAddCategoryName = ref('');

// 计算属性
const selectedRelationshipName = computed(() => {
  if (!formData.value.relationshipId) return '';
  const person = persons.value.find(p => p.id === formData.value.relationshipId);
  return person ? `${person.name}（${getRelationshipText(person.relationship)}）` : '已选择';
});

const selectedCategoryName = computed(() => {
  if (!formData.value.categoryId) return '';
  const category = categories.value.find(c => c.id === formData.value.categoryId);
  return category ? category.name : '';
});

const relationshipColumns = computed(() => {
  return [
    { text: '不选择', value: null },
    ...persons.value.map(p => ({
      text: `${p.name}（${getRelationshipText(p.relationship)}）`,
      value: p.id
    }))
  ];
});

const categoryColumns = computed(() => {
  return categories.value.map(c => ({
    text: c.name,
    value: c.id
  }));
});

// 获取关系文本
function getRelationshipText(relationship) {
  const relationshipMap = {
    self: '自己',
    father: '父亲',
    mother: '母亲',
    husband: '丈夫',
    wife: '妻子',
    older_brother: '哥哥',
    younger_brother: '弟弟',
    older_sister: '姐姐',
    younger_sister: '妹妹',
    son: '儿子',
    daughter: '女儿',
    grandfather: '爷爷',
    grandmother: '奶奶',
    maternal_grandfather: '外公',
    maternal_grandmother: '外婆',
    uncle: '叔叔',
    aunt: '阿姨',
    maternal_uncle: '舅舅',
    maternal_aunt: '姨妈',
    paternal_cousin: '堂兄弟',
    maternal_cousin: '表兄弟',
    friend: '朋友',
    colleague: '同事',
    classmate: '同学'
  };
  return relationshipMap[relationship] || relationship;
}

// 获取分类图标（根据名称返回 emoji）
function getCategoryIcon(name) {
  const iconMap = {
    '结婚': '💒',
    '周岁': '👶',
    '考大学': '🎓',
    '祝寿': '🎂',
    '生日': '🎉',
    '乔迁': '🏠',
    '满月': '🌕',
    '其他': '📦'
  };
  return iconMap[name] || '🏷️';
}

// 加载数据
onMounted(async () => {
  try {
    await loadCategories();
    persons.value = await personAPI.getAll();
  } catch (error) {
    console.error('加载数据失败:', error);
    showToast('加载数据失败');
  }
});

// 加载分类
async function loadCategories() {
  categories.value = await categoryAPI.getAll();
}

// 快速添加分类（从选择器）
function handleQuickAddCategory() {
  showCategoryPicker.value = false;
  showQuickAddCategory.value = true;
  quickAddCategoryName.value = '';
}

// 处理删除分类
async function handleDeleteCategory(categoryId) {
  try {
    await categoryAPI.delete(categoryId);
    await loadCategories();
    
    // 如果当前选中的是被删除的分类，清空选择
    if (formData.value.categoryId === categoryId) {
      formData.value.categoryId = null;
    }
  } catch (error) {
    console.error('删除分类失败:', error);
    showToast('删除失败');
  }
}

// 处理编辑分类（从子组件触发）
function handleEditCategory(category) {
  // 子组件内部已经处理了编辑状态
}

// 关系选择确认
function onRelationshipConfirm(person) {
  if (person) {
    formData.value.relationshipId = person.id;
    // 自动回填姓名，方便中老年人
    formData.value.name = person.name;
  }
  showRelationshipPicker.value = false;
}

// 清除关系选择
function clearRelationship() {
  formData.value.relationshipId = null;
  // 可选：清除关系时是否同时清空姓名？根据需求决定，这里暂时保留姓名
}

// 处理添加新人物
function handleAddPerson() {
  showRelationshipPicker.value = false;
  router.push('/persons');
}

// 跳转到人物关系页面
function goToPersonPage() {
  router.push('/persons');
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
      type: formData.value.type
    });

    showToast('添加成功');
    await loadCategories();

    // 自动选中新添加的分类
    const newCategory = categories.value.find(c => c.name === quickAddCategoryName.value.trim());
    if (newCategory) {
      formData.value.categoryId = newCategory.id;
    }

    quickAddCategoryName.value = '';
  } catch (error) {
    console.error('添加分类失败:', error);
    showToast('添加失败');
  }
}

// 日期选择确认
function onDateConfirm({ selectedValues }) {
  const [year, month, date] = selectedValues;
  formData.value.date = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  showDatePicker.value = false;
}

// 提交表单
async function onSubmit() {
  try {
    submitting.value = true;

    // 验证
    if (!formData.value.amount || parseFloat(formData.value.amount) <= 0) {
      showToast('请输入有效金额');
      return;
    }

    if (!formData.value.name || !formData.value.name.trim()) {
      showToast('请输入姓名');
      return;
    }

    if (!formData.value.categoryId) {
      showToast('请选择分类');
      return;
    }

    // 如果选择了关系，自动创建或查找人物
    let relationshipId = formData.value.relationshipId;
    if (relationshipId) {
      const selectedPerson = persons.value.find(p => p.id === relationshipId);
      if (selectedPerson) {
        // 智能查找或创建人物（同名同关系则复用，否则新建）
        const result = await personAPI.findOrCreatePerson(
          formData.value.name.trim(),
          selectedPerson.relationship,
          selectedPerson.parentId
        );

        relationshipId = result.id;

        // 如果是新创建的，给出提示
        if (result.isNew) {
          showToast(`已自动添加人物：${formData.value.name}`);
        }
      }
    }

    // 保存记录
    await recordAPI.add({
      ...formData.value,
      amount: parseFloat(formData.value.amount),
      name: formData.value.name.trim(), // 确保保存的是去除空格的姓名
      relationshipId: relationshipId // 使用可能更新后的 relationshipId
    });

    showToast('保存成功');

    // 更新轻量备份
    backupAPI.createLightweightBackup();

    // 返回上一页
    setTimeout(() => {
      router.back();
    }, 500);
  } catch (error) {
    console.error('保存失败:', error);
    showToast('保存失败: ' + error.message);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.add-record-page {
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

.record-form {
  padding: 16px 0;
}

.submit-btn {
  margin: 32px 16px;
}

.category-option {
  padding: 4px 0;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.selector-header .title {
  font-size: 18px;
  font-weight: bold;
  color: #323233;
}

.header-actions {
  display: flex;
  align-items: center;
}
</style>
