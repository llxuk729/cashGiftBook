<template>
  <div class="category-manager">
    <!-- 分类列表 -->
    <div class="category-list">
      <van-swipe-cell v-for="category in categories" :key="category.id">
        <van-cell :title="category.name">
          <template #icon>
            <span class="category-list-icon">{{ getCategoryIcon(category.name) }}</span>
          </template>
          <template #label>
            <span v-if="isDefaultCategory(category.name)" class="default-tag">默认</span>
          </template>
        </van-cell>
        <template #right>
          <van-button 
            v-if="!isDefaultCategory(category.name)"
            square 
            type="warning" 
            text="编辑"
            @click="$emit('edit', category)"
          />
          <van-button 
            v-if="!isDefaultCategory(category.name)"
            square 
            type="danger" 
            text="删除"
            @click="$emit('delete', category.id)"
          />
        </template>
      </van-swipe-cell>
    </div>

    <!-- 添加/编辑分类 -->
    <div class="add-category-section">
      <van-field
        v-model="newCategoryName"
        :placeholder="editingCategoryId ? '修改分类名称' : '输入新分类名称'"
        clearable
        maxlength="10"
        show-word-limit
      >
        <template #button>
          <van-button 
            size="small" 
            :type="editingCategoryId ? 'warning' : 'primary'"
            @click="handleSubmit"
          >
            {{ editingCategoryId ? '更新' : '添加' }}
          </van-button>
        </template>
      </van-field>
      
      <div v-if="editingCategoryId" class="cancel-edit">
        <van-button size="mini" plain @click="handleCancelEdit">取消编辑</van-button>
      </div>
    </div>

    <!-- 提示信息 -->
    <van-notice-bar
      left-icon="info-o"
      text="左右滑动可编辑或删除自定义分类，默认分类不可删除"
      mode="closeable"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  categories: {
    type: Array,
    required: true
  },
  defaultCategories: {
    type: Array,
    default: () => ['结婚', '周岁', '考大学', '祝寿', '满月', '百日', '开业', '乔迁', '生病', '其他']
  }
});

const emit = defineEmits(['add', 'update', 'delete']);

const newCategoryName = ref('');
const editingCategoryId = ref(null);

// 获取分类图标
const getCategoryIcon = (name) => {
  const iconMap = {
    '结婚': '💒',
    '周岁': '👶',
    '考大学': '🎓',
    '祝寿': '🎂',
    '满月': '🌕',
    '百日': '💯',
    '开业': '🎊',
    '乔迁': '🏠',
    '生病': '🏥',
    '其他': '📦'
  };
  return iconMap[name] || '📝';
};

// 判断是否为默认分类
const isDefaultCategory = (name) => {
  return props.defaultCategories.includes(name);
};

// 提交（添加或更新）
const handleSubmit = () => {
  if (!newCategoryName.value.trim()) {
    return;
  }

  if (editingCategoryId.value) {
    // 更新分类
    emit('update', {
      id: editingCategoryId.value,
      name: newCategoryName.value.trim()
    });
  } else {
    // 添加分类
    emit('add', newCategoryName.value.trim());
  }

  // 清空输入
  newCategoryName.value = '';
  editingCategoryId.value = null;
};

// 编辑分类
const editCategory = (category) => {
  editingCategoryId.value = category.id;
  newCategoryName.value = category.name;
};

// 取消编辑
const handleCancelEdit = () => {
  editingCategoryId.value = null;
  newCategoryName.value = '';
};

// 监听外部传入的编辑状态
watch(() => props.categories, () => {
  // 如果正在编辑的分类被删除，重置编辑状态
  if (editingCategoryId.value) {
    const exists = props.categories.find(c => c.id === editingCategoryId.value);
    if (!exists) {
      handleCancelEdit();
    }
  }
}, { deep: true });

// 暴露方法给父组件
defineExpose({
  editCategory,
  reset: handleCancelEdit
});
</script>

<style scoped>
.category-manager {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}

.category-list {
  margin-bottom: 16px;
}

.category-list-icon {
  font-size: 20px;
  margin-right: 8px;
}

.default-tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  color: #1989fa;
  background: #e8f4ff;
  border-radius: 4px;
  margin-left: 8px;
}

.add-category-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebedf0;
}

.cancel-edit {
  margin-top: 8px;
  text-align: right;
}
</style>
