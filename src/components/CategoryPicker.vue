<template>
  <div class="category-picker-container">
    <!-- 顶部操作栏 -->
    <div class="picker-header">
      <span class="picker-title">选择分类</span>
      <div class="header-actions">
        <van-button 
          v-if="!isEditMode" 
          size="small" 
          type="primary" 
          @click="$emit('add')"
        >
          <van-icon name="plus" /> 新增
        </van-button>
        <van-button 
          v-else 
          size="small" 
          type="default"
          @click="exitEditMode"
        >
          完成
        </van-button>
        <van-button 
          size="small" 
          :type="isEditMode ? 'danger' : 'default'"
          @click="toggleEditMode"
        >
          <van-icon :name="isEditMode ? 'close' : 'edit'" /> {{ isEditMode ? '取消' : '管理' }}
        </van-button>
      </div>
    </div>

    <!-- 分类网格 -->
    <div class="category-grid">
      <!-- 全部选项 -->
      <div class="category-item" :class="{ active: modelValue === null }" @click="handleSelect(null)">
        <div class="category-icon">📋</div>
        <div class="category-name">全部</div>
      </div>

      <div 
        v-for="category in categories" 
        :key="category.id" 
        class="category-item-wrapper"
      >
        <div 
          class="category-item" 
          :class="{ active: modelValue === category.id, 'deletable': isEditMode && category.deletable }"
          @click="handleItemClick(category)"
        >
          <div class="category-icon">{{ getCategoryIcon(category.name) }}</div>
          <div class="category-name">{{ category.name }}</div>
          
          <!-- 删除图标（仅可删除的分类在编辑模式下显示） -->
          <van-icon 
            v-if="isEditMode && category.deletable" 
            name="clear" 
            class="delete-icon"
            @click.stop="handleDelete(category)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { showConfirmDialog, showToast } from 'vant';

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: null
  },
  categories: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'add', 'close', 'delete']);

// 编辑模式状态
const isEditMode = ref(false);

// 当弹窗关闭时（通过点击遮罩），重置编辑模式
// 使用 nextTick 确保在 DOM 更新后执行
const resetEditMode = () => {
  isEditMode.value = false;
};

// 暴露方法给父组件调用
defineExpose({
  resetEditMode
});

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

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value;
};

// 退出编辑模式
const exitEditMode = () => {
  isEditMode.value = false;
};

// 处理项目点击
const handleItemClick = (category) => {
  if (isEditMode.value) {
    // 编辑模式下，如果可删除，不做任何操作（需要点击删除图标）
    if (category.deletable) {
      return;
    }
    // 不可删除的分类，提示用户
    showToast('默认分类不可删除');
  } else {
    // 非编辑模式，正常选择
    handleSelect(category.id);
  }
};

// 选择分类
const handleSelect = (id) => {
  emit('update:modelValue', id);
  emit('close'); // 触发关闭事件
};

// 删除分类
const handleDelete = async (category) => {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除分类“${category.name}”吗？\n删除后，已使用该分类的历史记录将保留，但无法再选择此分类`
    });
    
    // 触发删除事件，由父组件处理
    emit('delete', category.id);
    showToast('删除成功');
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      showToast('删除失败');
    }
  }
};
</script>

<style scoped>
.category-picker-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
}

.picker-title {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.category-grid {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  align-content: start;
}

.category-item-wrapper {
  position: relative;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border-radius: 8px;
  background: #f7f8fa;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  position: relative;
}

.category-item:active {
  transform: scale(0.95);
}

.category-item.active {
  background: #e8f4ff;
  border-color: #1989fa;
}

/* 编辑模式下可删除的分类样式 */
.category-item.deletable {
  opacity: 0.7;
}

.category-item.deletable:active {
  opacity: 1;
}

.delete-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  background: #ee0a24;
  color: white;
  border-radius: 50%;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(238, 10, 36, 0.3);
  z-index: 10;
}

.category-icon {
  font-size: 32px;
  margin-bottom: 6px;
}

.category-name {
  font-size: 13px;
  color: #323233;
  text-align: center;
  word-break: break-all;
}
</style>
