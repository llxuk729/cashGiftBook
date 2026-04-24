<template>
  <div class="relationship-selector">
    <!-- 路径构建区 -->
    <div class="path-bar">
      <van-icon name="arrow-left" @click="goBack" v-if="currentPath.length > 0" />
      <div class="path-content">
        <span class="current-node">{{ currentPathLabel }}</span>
      </div>
      <van-icon name="replay" @click="resetPath" v-if="currentPath.length > 0" />
    </div>

    <!-- 逻辑按钮区 -->
    <div class="logic-buttons" v-if="!selectedPerson">
      <div class="button-grid">
        <van-button 
          v-for="opt in availableOptions" 
          :key="opt.value"
          size="large"
          round
          plain
          @click="selectOption(opt.value)"
        >
          {{ opt.label }}
        </van-button>
      </div>
    </div>

    <!-- 人物匹配区 -->
    <div class="person-matches" v-if="matchedPersons.length > 0">
      <div class="section-title">找到以下家人：</div>
      <div class="person-list">
        <div 
          v-for="person in matchedPersons" 
          :key="person.id"
          class="person-item"
          @click="confirmSelection(person)"
        >
          <div class="avatar">{{ person.name.charAt(0) }}</div>
          <div class="info">
            <div class="name">{{ person.name }}</div>
            <div class="path-detail">{{ person.path }}</div>
          </div>
          <van-icon name="success" color="#07c160" />
        </div>
      </div>
    </div>

    <!-- 快捷入口 -->
    <div class="quick-access" v-if="!selectedPerson && currentPath.length === 0">
      <div class="section-title">常用联系人：</div>
      <div class="quick-grid">
        <div 
          v-for="person in frequentPersons" 
          :key="person.id"
          class="quick-item"
          @click="confirmSelection(person)"
        >
          <div class="avatar">{{ person.name.charAt(0) }}</div>
          <div class="name">{{ person.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { personAPI } from '../database/personAPI';

const emit = defineEmits(['confirm', 'close']);

// 关系定义（支持多层级递归）
const RELATIONSHIP_MAP = {
  'self': { label: '自己', next: ['father', 'mother', 'husband', 'wife', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister', 'son', 'daughter'] },
  'father': { label: '父亲', next: ['father', 'mother', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister'] }, // 父亲的父亲=爷爷，父亲的哥哥=伯父等
  'mother': { label: '母亲', next: ['father', 'mother', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister'] },
  'husband': { label: '丈夫', next: ['father', 'mother', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister'] },
  'wife': { label: '妻子', next: ['father', 'mother', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister'] },
  'older_brother': { label: '哥哥', next: ['wife', 'son', 'daughter'] },
  'younger_brother': { label: '弟弟', next: ['wife', 'son', 'daughter'] },
  'older_sister': { label: '姐姐', next: ['husband', 'son', 'daughter'] },
  'younger_sister': { label: '妹妹', next: ['husband', 'son', 'daughter'] },
  'son': { label: '儿子', next: [] },
  'daughter': { label: '女儿', next: [] },
};

// 称谓映射表（用于将路径转换为通俗称谓）
const TITLE_MAP = {
  'father_father': '爷爷', 'father_mother': '奶奶',
  'mother_father': '外公', 'mother_mother': '外婆',
  'father_older_brother': '伯父', 'father_younger_brother': '叔叔',
  'father_older_sister': '姑妈', 'father_younger_sister': '姑姑',
  'mother_older_brother': '舅舅', 'mother_younger_brother': '舅舅',
  'mother_older_sister': '姨妈', 'mother_younger_sister': '阿姨',
  'older_brother_wife': '嫂子', 'younger_brother_wife': '弟媳',
  'older_sister_husband': '姐夫', 'younger_sister_husband': '妹夫',
  'older_brother_son': '侄子', 'older_brother_daughter': '侄女',
  'younger_brother_son': '侄子', 'younger_brother_daughter': '侄女',
  'older_sister_son': '外甥', 'older_sister_daughter': '外甥女',
  'younger_sister_son': '外甥', 'younger_sister_daughter': '外甥女',
  // 三层关系
  'mother_mother_older_brother': '舅公', 'mother_mother_younger_brother': '舅公',
  'mother_mother_older_sister': '姨婆', 'mother_mother_younger_sister': '姨婆',
  'father_father_older_brother': '伯祖父', 'father_father_younger_brother': '叔祖父',
};

// 递归获取当前路径的显示标签
function getPathLabel(path) {
  if (path.length === 0) return '我';
  
  // 1. 尝试直接匹配完整路径
  const fullKey = path.join('_');
  if (TITLE_MAP[fullKey]) return TITLE_MAP[fullKey];

  // 2. 如果没匹配到，尝试匹配最后两段（作为回退）
  if (path.length >= 2) {
    const lastTwoKey = path.slice(-2).join('_');
    if (TITLE_MAP[lastTwoKey]) return TITLE_MAP[lastTwoKey];
  }

  // 3. 否则返回最后一段关系的原始标签
  return RELATIONSHIP_MAP[path[path.length - 1]]?.label || '家人';
}

const currentPath = ref([]);
const matchedPersons = ref([]);
const frequentPersons = ref([]);
const selectedPerson = ref(null);

// 计算当前可选的按钮
const availableOptions = computed(() => {
  if (currentPath.value.length === 0) {
    return RELATIONSHIP_MAP['self'].next.map(key => ({ value: key, label: RELATIONSHIP_MAP[key].label }));
  }
  
  const lastSeg = currentPath.value[currentPath.value.length - 1];
  const nextOptions = RELATIONSHIP_MAP[lastSeg]?.next || [];
  return nextOptions.map(key => ({ value: key, label: RELATIONSHIP_MAP[key].label }));
});

// 获取当前路径的显示标签
const currentPathLabel = computed(() => getPathLabel(currentPath.value));

// 是否可以确认（已选择路径）
const canConfirm = computed(() => currentPath.value.length > 0);

// 监听路径变化，向父组件同步
watch(currentPath, (newPath) => {
  emit('update:path', newPath);
  updateMatches();
}, { deep: true });

async function loadFrequent() {
  frequentPersons.value = await personAPI.getFrequent();
}

// 暴露给父组件的方法：根据当前路径确认选择
defineExpose({
  async confirmSelectionByPath() {
    if (!canConfirm.value) return null;

    // 1. 尝试查找已有的人物
    const persons = await personAPI.getByPath(currentPath.value);
    
    if (persons.length > 0) {
      return persons[0];
    } else {
      // 2. 如果没找到，根据路径智能创建一个人物
      const relationshipType = currentPath.value[currentPath.value.length - 1];
      const label = currentPathLabel.value;
      return await createPersonByPath(currentPath.value, label);
    }
  }
});

// 根据路径创建人物（优化版）
async function createPersonByPath(path, name) {
  if (path.length === 0) return null;

  const relationshipType = path[path.length - 1];
  
  // 1. 尝试查找父节点来确定 parentId
  let parentId = null;
  if (path.length > 1) {
    const parentPath = path.slice(0, -1);
    const parents = await personAPI.getByPath(parentPath);
    if (parents.length > 0) {
      parentId = parents[0].id;
    } else {
      // 如果父节点不存在，先递归创建父节点
      const parentLabel = getPathLabel(parentPath);
      const parentPerson = await createPersonByPath(parentPath, parentLabel);
      if (parentPerson) parentId = parentPerson.id;
    }
  }

  // 2. 检查在当前父节点下是否已存在该关系的人物
  if (parentId) {
    const siblings = await personAPI.getChildren(parentId);
    const existing = siblings.find(p => p.relationship === relationshipType);
    if (existing) return existing;
  } else {
    // 根节点下的检查
    const roots = await personAPI.getAll();
    const existing = roots.find(p => p.parentId === null && p.relationship === relationshipType);
    if (existing) return existing;
  }

  // 3. 新建人物
  const id = await personAPI.add({
    name: name,
    relationship: relationshipType,
    parentId: parentId,
    gender: 'unknown'
  });
  return await personAPI.getById(id);
}

function selectOption(value) {
  currentPath.value.push(value);
  updateMatches();
}

function goBack() {
  currentPath.value.pop();
  updateMatches();
}

function resetPath() {
  currentPath.value = [];
  matchedPersons.value = [];
  selectedPerson.value = null;
}

async function updateMatches() {
  if (currentPath.value.length > 0) {
    matchedPersons.value = await personAPI.getByPath(currentPath.value);
  } else {
    matchedPersons.value = [];
  }
}

function getLabel(value) {
  return RELATIONSHIP_MAP[value]?.label || value;
}

function confirmSelection(person) {
  selectedPerson.value = person;
  emit('confirm', person);
}

onMounted(() => {
  loadFrequent();
});
</script>

<style scoped>
.relationship-selector {
  padding: 16px;
  min-height: 400px;
}

.path-bar {
  display: flex;
  align-items: center;
  background: #f7f8fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 16px;
}

.path-content {
  flex: 1;
  text-align: center;
  color: #323233;
  font-weight: bold;
  font-size: 18px;
}

.current-node {
  display: inline-block;
  padding: 4px 12px;
  background: #e8f3ff;
  color: #1989fa;
  border-radius: 16px;
}

.placeholder {
  color: #969799;
  font-weight: normal;
}

.logic-buttons {
  margin-bottom: 24px;
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.van-button {
  height: 56px !important;
  font-size: 18px !important;
  font-weight: 600;
  border-width: 2px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.van-button:active {
  transform: scale(0.96);
  background-color: #f2f3f5;
}

.section-title {
  font-size: 14px;
  color: #969799;
  margin-bottom: 12px;
}

.person-list, .quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.person-item, .quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.person-item {
  flex-direction: row;
  text-align: left;
  background: #fff;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.avatar {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #1989fa, #07c160);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.3);
  transition: transform 0.2s;
}

.person-item .avatar {
  margin-right: 12px;
  margin-bottom: 0;
}

.person-item:active .avatar, .quick-item:active .avatar {
  transform: scale(0.95);
}

.info {
  flex: 1;
}

.name {
  font-size: 16px;
  font-weight: bold;
  color: #323233;
}

.path-detail {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
}
</style>
