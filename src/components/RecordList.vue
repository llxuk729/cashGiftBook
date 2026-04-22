<template>
  <div class="record-list-container">
    <!-- 记录列表 -->
    <div v-if="records.length === 0" class="empty-state">
      {{ emptyText }}
    </div>

    <div v-for="record in records" :key="record.id" class="record-item" @click="handleItemClick(record)">
      <!-- 分类图标 -->
      <div v-if="showIcon" class="category-icon">{{ getCategoryIcon(record.categoryId) }}</div>
      
      <!-- 记录内容 -->
      <div class="record-content">
        <div class="record-info-line">
          <span class="person-name">{{ getPersonName(record) }}</span>
          <span v-if="getRelationshipName(record)" class="relationship-tag">{{ getRelationshipName(record) }}</span>
          <span class="category">{{ getCategoryName(record.categoryId) }}</span>
          <span v-if="record.note" class="note">{{ record.note }}</span>
        </div>
        <div class="record-date-line">{{ formatDate(record.date) }}</div>
      </div>
      
      <!-- 金额和操作按钮 -->
      <div class="record-actions">
        <div class="record-amount" :class="record.type">
          {{ record.type === 'income' ? '+' : '-' }}¥{{ parseFloat(record.amount).toFixed(2) }}
        </div>
        
        <!-- 删除按钮 - 常驻显示 -->
        <van-button 
          v-if="showActions" 
          size="mini"
          type="danger"
          plain
          icon="delete-o"
          @click.stop="handleDelete(record)"
          class="delete-btn"
        >
          删除
        </van-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import dayjs from 'dayjs';

const props = defineProps({
  // 记录列表数据
  records: {
    type: Array,
    default: () => []
  },
  // 人物列表
  persons: {
    type: Array,
    default: () => []
  },
  // 分类列表
  categories: {
    type: Array,
    default: () => []
  },
  // 是否显示分类图标
  showIcon: {
    type: Boolean,
    default: true
  },
  // 是否显示编辑和删除按钮
  showActions: {
    type: Boolean,
    default: false
  },
  // 空状态文本
  emptyText: {
    type: String,
    default: '暂无记录'
  }
});

const emit = defineEmits(['edit', 'delete']);

// 获取人物名称（优先显示姓名字段）
function getPersonName(record) {
  // 新字段：name
  if (record.name) {
    return record.name;
  }
  // 旧字段兼容：personId
  const person = props.persons.find(p => p.id === record.personId);
  return person ? person.path : '未知';
}

// 获取关系名称
function getRelationshipName(record) {
  if (!record.relationshipId) return '';
  const person = props.persons.find(p => p.id === record.relationshipId);
  if (!person) return '';
  
  // 关系文本映射
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
  
  const relText = relationshipMap[person.relationship] || person.relationship;
  return `${person.name}（${relText}）`;
}

// 获取分类名称
function getCategoryName(categoryId) {
  const category = props.categories.find(c => c.id === categoryId);
  return category ? category.name : '未分类';
}

// 获取分类图标
function getCategoryIcon(categoryId) {
  const category = props.categories.find(c => c.id === categoryId);
  if (!category) return '📝';
  
  const iconMap = {
    '结婚': '💒',
    '周岁': '👶',
    '考大学': '🎓',
    '祝寿': '🎂',
    '生日': '🎉',
    '乔迁': '🏠',
    '满月': '🌕',
    '百日': '💯',
    '开业': '🎊',
    '生病': '🏥',
    '其他': '📦'
  };
  return iconMap[category.name] || '📝';
}

// 格式化日期
function formatDate(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
}

// 处理记录项点击
function handleItemClick(record) {
  if (props.showActions) {
    emit('edit', record);
  }
}

// 处理删除
function handleDelete(record) {
  emit('delete', record);
}
</script>

<style scoped>
.record-list-container {
  width: 100%;
}

.empty-state {
  padding: 20px 16px;
  text-align: center;
  color: #969799;
  font-size: 13px;
}

/* 记录项 */
.record-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #f7f8fa;
  position: relative;
  transition: background-color 0.2s;
  cursor: pointer;
}

.record-item:active {
  background-color: #f7f8fa;
}

.record-item:last-child {
  border-bottom: none;
}

/* 分类图标 */
.category-icon {
  font-size: 24px;
  margin-right: 12px;
  flex-shrink: 0;
}

/* 记录内容 */
.record-content {
  flex: 1;
  min-width: 0;
}

.record-info-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}

.person-name {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.relationship-tag {
  font-size: 11px;
  color: #1989fa;
  padding: 1px 6px;
  background: #e8f4ff;
  border-radius: 3px;
  flex-shrink: 0;
}

.category {
  font-size: 11px;
  color: #969799;
  padding: 1px 6px;
  background: #f7f8fa;
  border-radius: 3px;
}

.note {
  font-size: 11px;
  color: #c8c9cc;
}

.record-date-line {
  font-size: 11px;
  color: #c8c9cc;
}

/* 金额 */
.record-amount {
  font-size: 15px;
  font-weight: 600;
  margin-left: 8px;
  white-space: nowrap;
}

.record-amount.income {
  color: #07c160;
}

.record-amount.expense {
  color: #ee0a24;
}

/* 操作区域 */
.record-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 8px;
  flex-shrink: 0;
}

.delete-btn {
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  border-radius: 4px;
}
</style>
