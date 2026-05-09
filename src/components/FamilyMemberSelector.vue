<template>
  <div class="family-member-selector">
    <!-- 智能搜索框 -->
    <div class="search-section">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索姓名或称谓（如：大舅、张三）"
        shape="round"
        show-action
        @search="onSearch"
        @cancel="onCancelSearch"
      >
        <template #action>
          <div v-if="searchKeyword" @click="onCancelSearch" class="cancel-btn">取消</div>
        </template>
      </van-search>
    </div>

    <!-- 搜索结果 -->
    <div v-if="isSearching && searchResults.length > 0" class="search-results">
      <div class="section-title">🔍 搜索结果</div>
      <div class="person-list">
        <div
          v-for="person in searchResults"
          :key="person.id"
          class="person-card"
          @click="selectPerson(person)"
        >
          <div class="avatar" :style="{ background: getAvatarColor(person.name) }">
            {{ person.name.charAt(0) }}
          </div>
          <div class="info">
            <div class="name">{{ person.name }}</div>
            <div class="relationship">{{ getRelationshipLabel(person.relationship) }}</div>
          </div>
          <van-icon name="arrow" color="#dcdee0" />
        </div>
      </div>
    </div>

    <!-- 搜索无结果 -->
    <div v-else-if="isSearching && searchResults.length === 0" class="empty-state">
      <van-empty description="未找到匹配的人物" />
    </div>

    <!-- 正常浏览模式 -->
    <div v-else class="browse-mode">
      <!-- 最近选择 -->
      <div v-if="recentSelected.length > 0" class="recent-section">
        <div class="section-title">⭐ 最近选择</div>
        <div class="recent-list">
          <div
            v-for="person in recentSelected"
            :key="person.id"
            class="recent-item"
            @click="selectPerson(person)"
          >
            <div class="avatar-small" :style="{ background: getAvatarColor(person.name) }">
              {{ person.name.charAt(0) }}
            </div>
            <div class="name">{{ person.name }}</div>
          </div>
        </div>
      </div>

      <!-- 家族分支折叠面板 -->
      <div class="branches-section">
        <div class="section-title">📋 按家族分支浏览</div>
        
        <!-- 空状态提示 + 快速选择 -->
        <div v-if="totalPersons === 1" class="empty-branch-hint">
            <div style="font-size: 14px; color: #646566; margin-bottom: 12px;">还没有家人信息</div>
            <div style="font-size: 13px; color: #969799; margin-bottom: 16px;">您可以先选择一个常用关系</div>
            
            <!-- 常用关系快捷入口 -->
            <div class="quick-relations">
              <div 
                v-for="relation in commonRelations" 
                :key="relation.type"
                class="quick-relation-item"
                @click="selectCommonRelation(relation)"
              >
                <div class="relation-icon">{{ relation.icon }}</div>
                <div class="relation-label">{{ relation.label }}</div>
              </div>
            </div>
            
            <van-button 
              round 
              type="primary" 
              size="small" 
              @click="$emit('add-person')"
              style="margin-top: 16px;"
            >
              手动添加家人
            </van-button>
        </div>
        
        <!-- 有数据时显示分支 -->
        <template v-else>
        
        <van-collapse v-model="activeBranches" accordion>
          <van-collapse-item
            v-for="(branch, key) in branches"
            :key="key"
            :name="key"
            v-if="branch && branch.count > 0"
          >
            <template #title>
              <div class="branch-header">
                <span class="branch-icon">{{ branch.icon }}</span>
                <span class="branch-name">{{ branch.name }}</span>
                <van-tag type="primary" size="medium" round>{{ branch.count }}人</van-tag>
              </div>
            </template>
            
            <div class="branch-members">
              <div
                v-for="person in branch.members"
                :key="person.id"
                class="person-card"
                @click="selectPerson(person)"
              >
                <div class="avatar" :style="{ background: getAvatarColor(person.name) }">
                  {{ person.name.charAt(0) }}
                </div>
                <div class="info">
                  <div class="name">{{ person.name }}</div>
                  <div class="relationship">{{ getRelationshipLabel(person.relationship) }}</div>
                </div>
                <van-icon name="arrow" color="#dcdee0" />
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { personAPI } from '../database/personAPI';
import { showToast } from 'vant';

const emit = defineEmits(['select', 'add-person']);

const searchKeyword = ref('');
const isSearching = ref(false);
const searchResults = ref([]);
const recentSelected = ref([]);
const branches = ref({});
const activeBranches = ref([]);

// 常用关系快捷入口（适合首次使用）
const commonRelations = [
  { type: 'father', label: '父亲', icon: '👨' },
  { type: 'mother', label: '母亲', icon: '👩' },
  { type: 'husband', label: '丈夫', icon: '🤵' },
  { type: 'wife', label: '妻子', icon: '👰' },
  { type: 'son', label: '儿子', icon: '👦' },
  { type: 'daughter', label: '女儿', icon: '👧' },
  { type: 'older_brother', label: '哥哥', icon: '👨‍🦱' },
  { type: 'younger_brother', label: '弟弟', icon: '👱‍♂️' },
  { type: 'older_sister', label: '姐姐', icon: '👩‍🦰' },
  { type: 'younger_sister', label: '妹妹', icon: '👧‍🦱' },
  { type: 'friend', label: '朋友', icon: '🤝' },
  { type: 'colleague', label: '同事', icon: '💼' }
];

// 总人数
const totalPersons = computed(() => {
  return Object.values(branches.value).reduce((sum, branch) => sum + branch.count, 0);
});

// 称谓映射
const RELATIONSHIP_LABELS = {
  'father': '父亲', 'mother': '母亲',
  'father_father': '爷爷', 'father_mother': '奶奶',
  'mother_father': '外公', 'mother_mother': '外婆',
  'father_older_brother': '伯父', 'father_younger_brother': '叔叔',
  'father_older_sister': '姑妈', 'father_younger_sister': '姑姑',
  'mother_older_brother': '舅舅', 'mother_younger_brother': '舅舅',
  'mother_older_sister': '姨妈', 'mother_younger_sister': '阿姨',
  'husband': '丈夫', 'wife': '妻子',
  'older_brother': '哥哥', 'younger_brother': '弟弟',
  'older_sister': '姐姐', 'younger_sister': '妹妹',
  'son': '儿子', 'daughter': '女儿',
  'older_brother_wife': '嫂子', 'younger_brother_wife': '弟媳',
  'older_sister_husband': '姐夫', 'younger_sister_husband': '妹夫',
  'older_brother_son': '侄子', 'older_brother_daughter': '侄女',
  'younger_brother_son': '侄子', 'younger_brother_daughter': '侄女',
  'older_sister_son': '外甥', 'older_sister_daughter': '外甥女',
  'younger_sister_son': '外甥', 'younger_sister_daughter': '外甥女',
  'friend': '朋友', 'colleague': '同事', 'classmate': '同学'
};

// 获取关系标签
function getRelationshipLabel(type) {
  return RELATIONSHIP_LABELS[type] || type;
}

// 生成头像颜色（根据姓名哈希）
function getAvatarColor(name) {
  const colors = [
    '#1989fa', '#07c160', '#ff976a', '#ee0a24',
    '#7232dd', '#f2826a', '#38f', '#005bea'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// 搜索
async function onSearch() {
  if (!searchKeyword.value.trim()) return;
  
  isSearching.value = true;
  searchResults.value = await personAPI.smartSearch(searchKeyword.value);
  
  if (searchResults.value.length === 0) {
    showToast('未找到匹配的人物');
  }
}

// 取消搜索
function onCancelSearch() {
  searchKeyword.value = '';
  isSearching.value = false;
  searchResults.value = [];
}

// 选择人物
function selectPerson(person) {
  emit('select', person);
}

// 选择常用关系（快速创建）
async function selectCommonRelation(relation) {
  try {
    // 检查是否已存在该关系类型的人物
    const existing = await personAPI.getByRelationshipType(relation.type);
    
    if (existing.length > 0) {
      // 如果已存在，直接选择第一个人
      emit('select', existing[0]);
    } else {
      // 如果不存在，提示用户输入姓名
      const name = prompt(`请输入${relation.label}的姓名：`);
      if (name && name.trim()) {
        // 创建新人物
        const newId = await personAPI.add({
          name: name.trim(),
          relationship: relation.type,
          parentId: null,
          gender: 'unknown'
        });
        
        const newPerson = await personAPI.getById(newId);
        emit('select', newPerson);
      }
    }
  } catch (error) {
    console.error('选择关系失败:', error);
    showToast('操作失败');
  }
}

// 加载数据
async function loadData() {
  try {
    console.log('开始加载家族成员数据...');
    
    // 加载最近选择
    recentSelected.value = await personAPI.getRecentSelected(8);
    console.log('最近选择:', recentSelected.value);
    
    // 加载家族分支
    branches.value = await personAPI.getGroupedByBranch();
    console.log('家族分支数据:', branches.value);
    console.log('总人数:', totalPersons.value);
    
    // 默认展开第一个有数据的分支
    const firstBranch = Object.keys(branches.value).find(key => branches.value[key].count > 0);
    if (firstBranch) {
      activeBranches.value = [firstBranch];
      console.log('默认展开分支:', firstBranch);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    showToast('加载数据失败');
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.family-member-selector {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.search-section {
  padding: 12px;
  background: #fff;
  border-bottom: 1px solid #ebedf0;
}

.cancel-btn {
  color: #1989fa;
  font-size: 15px;
  cursor: pointer;
  padding: 0 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  padding: 16px 16px 12px;
  background: #f7f8fa;
}

/* 搜索结果 */
.search-results {
  flex: 1;
  overflow-y: auto;
}

.person-list {
  background: #fff;
}

/* 最近选择 */
.recent-section {
  margin-bottom: 8px;
}

.recent-list {
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  background: #fff;
  gap: 12px;
}

.recent-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 64px;
  cursor: pointer;
  transition: transform 0.2s;
}

.recent-item:active {
  transform: scale(0.95);
}

.avatar-small {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recent-item .name {
  font-size: 12px;
  color: #646566;
  text-align: center;
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 家族分支 */
.branches-section {
  flex: 1;
  overflow-y: auto;
}

.branch-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.branch-icon {
  font-size: 18px;
}

.branch-name {
  flex: 1;
  font-weight: 500;
}

.branch-members {
  background: #fff;
}

/* 人物卡片 */
.person-card {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  background: #fff;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
  transition: background 0.2s;
}

.person-card:last-child {
  border-bottom: none;
}

.person-card:active {
  background: #f7f8fa;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 16px;
  font-weight: 500;
  color: #323233;
  margin-bottom: 4px;
}

.relationship {
  font-size: 13px;
  color: #969799;
}

/* 空状态 */
.empty-state {
  padding: 60px 20px;
  text-align: center;
}

/* 常用关系快捷入口 */
.quick-relations {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.quick-relation-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: #f7f8fa;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-relation-item:active {
  background: #ebedf0;
  transform: scale(0.95);
}

.relation-icon {
  font-size: 28px;
  margin-bottom: 6px;
}

.relation-label {
  font-size: 13px;
  color: #323233;
  font-weight: 500;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

::-webkit-scrollbar-thumb {
  background: #dcdee0;
  border-radius: 2px;
}
</style>
