<template>
  <Layout>
    <div class="persons-page">
    <div class="page-header">
      <h2 class="page-title">人物关系</h2>
      <div class="header-actions">
        <van-icon 
          :name="viewMode === 'tree' ? 'apps-o' : 'list-switch'" 
          size="24" 
          color="#1989fa" 
          @click="toggleViewMode" 
        />
        <van-icon name="plus" size="24" color="#1989fa" @click="showAddPerson = true" />
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-bar">
      <van-search
        v-model="searchKeyword"
        placeholder="搜索人物姓名或关系"
        shape="round"
        @search="handleSearch"
        @clear="handleSearchClear"
      />
    </div>

    <!-- 提示信息 -->
    <van-notice-bar
      left-icon="info-o"
      text="提示：记账时选择关系后，系统会自动创建人物关系，无需手动维护"
      mode="closeable"
      style="margin: 8px 16px; border-radius: 4px;"
    />

    <!-- 树形列表视图 -->
    <div v-if="viewMode === 'tree'" class="person-tree">
      <van-empty v-if="filteredPersonTree.length === 0" description="暂无人物，点击右上角添加" />
      
      <div v-for="person in filteredPersonTree" :key="person.id" class="tree-node">
        <PersonTreeNode 
          :person="person" 
          @add-child="handleAddChild"
          @edit="handleEditPerson"
          @delete="handleDeletePerson"
        />
      </div>
    </div>

    <!-- 关系图谱视图 -->
    <div v-else class="relation-graph" ref="graphContainer">
      <div v-if="allPersons.length === 0" class="empty-graph">
        <van-empty description="暂无人物，点击右上角添加" />
      </div>
    </div>

    <!-- 添加/编辑人物对话框 -->
    <van-dialog
      v-model:show="showAddPerson"
      :title="editingPerson ? '编辑人物' : '添加人物'"
      show-cancel-button
      @confirm="handleSavePerson"
    >
      <van-form class="person-form">
        <van-cell-group inset>
          <van-field
            v-model="personForm.name"
            label="姓名"
            placeholder="请输入姓名"
            :rules="[{ required: true, message: '请输入姓名' }]"
          />
          
          <van-field name="gender" label="性别">
            <template #input>
              <van-radio-group v-model="personForm.gender" direction="horizontal">
                <van-radio name="male">男</van-radio>
                <van-radio name="female">女</van-radio>
                <van-radio name="unknown">未知</van-radio>
              </van-radio-group>
            </template>
          </van-field>

          <van-field
            v-model="selectedRelationship"
            is-link
            readonly
            label="关系"
            placeholder="请选择关系"
            @click="showRelationshipPicker = true"
            :rules="[{ required: true, message: '请选择关系' }]"
          />
        </van-cell-group>
      </van-form>
    </van-dialog>

    <!-- 关系选择器 -->
    <van-popup v-model:show="showRelationshipPicker" position="bottom" round>
      <van-picker
        :columns="relationshipColumns"
        @confirm="onRelationshipConfirm"
        @cancel="showRelationshipPicker = false"
      />
    </van-popup>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { showToast, showConfirmDialog } from 'vant';
import Layout from '../components/Layout.vue';
import { personAPI } from '../database/personAPI';
import PersonTreeNode from '../components/PersonTreeNode.vue';
import { Network } from 'vis-network/standalone';

const personTree = ref([]);
const allPersons = ref([]);
const viewMode = ref('tree'); // 'tree' 或 'graph'
const searchKeyword = ref('');
const graphContainer = ref(null);
let networkInstance = null;
const showAddPerson = ref(false);
const showRelationshipPicker = ref(false);
const editingPerson = ref(null);
const addingParentId = ref(null);

// 表单数据
const personForm = ref({
  name: '',
  gender: 'unknown',
  relationship: ''
});

const selectedRelationship = ref('');

// 关系选项
const relationships = [
  { text: '父亲', value: 'father' },
  { text: '母亲', value: 'mother' },
  { text: '丈夫', value: 'husband' },
  { text: '妻子', value: 'wife' },
  { text: '哥哥', value: 'older_brother' },
  { text: '弟弟', value: 'younger_brother' },
  { text: '姐姐', value: 'older_sister' },
  { text: '妹妹', value: 'younger_sister' },
  { text: '儿子', value: 'son' },
  { text: '女儿', value: 'daughter' },
  { text: '爷爷', value: 'grandfather' },
  { text: '奶奶', value: 'grandmother' },
  { text: '外公', value: 'maternal_grandfather' },
  { text: '外婆', value: 'maternal_grandmother' },
  { text: '叔叔', value: 'uncle' },
  { text: '阿姨', value: 'aunt' },
  { text: '舅舅', value: 'maternal_uncle' },
  { text: '姨妈', value: 'maternal_aunt' },
  { text: '堂兄弟', value: 'paternal_cousin' },
  { text: '表兄弟', value: 'maternal_cousin' },
  { text: '朋友', value: 'friend' },
  { text: '同事', value: 'colleague' },
  { text: '同学', value: 'classmate' },
  { text: '自定义', value: 'custom' }
];

const relationshipColumns = computed(() => {
  return relationships.map(r => ({
    text: r.text,
    value: r.value
  }));
});

// 过滤后的人物树（支持搜索）
const filteredPersonTree = computed(() => {
  if (!searchKeyword.value) return personTree.value;
  return filterTreeByKeyword(personTree.value, searchKeyword.value);
});

// 递归过滤树节点
function filterTreeByKeyword(tree, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  return tree.reduce((result, node) => {
    const nameMatch = node.name.toLowerCase().includes(lowerKeyword);
    const relMatch = getRelationshipText(node.relationship).toLowerCase().includes(lowerKeyword);
    const pathMatch = node.path && node.path.toLowerCase().includes(lowerKeyword);
    
    if (nameMatch || relMatch || pathMatch) {
      result.push(node);
    } else if (node.children && node.children.length > 0) {
      const filteredChildren = filterTreeByKeyword(node.children, keyword);
      if (filteredChildren.length > 0) {
        result.push({ ...node, children: filteredChildren });
      }
    }
    return result;
  }, []);
}

// 加载人物树
onMounted(async () => {
  await loadPersonTree();
});

// 监听视图模式变化，切换到图谱时初始化网络图
watch(viewMode, async (newMode) => {
  if (newMode === 'graph') {
    await nextTick();
    initNetworkGraph();
  }
});

async function loadPersonTree() {
  try {
    personTree.value = await personAPI.getTree();
    allPersons.value = await personAPI.getAll();
  } catch (error) {
    console.error('加载人物树失败:', error);
    showToast('加载失败');
  }
}

// 处理添加子节点
function handleAddChild(parentId) {
  addingParentId.value = parentId;
  editingPerson.value = null;
  resetForm();
  showAddPerson.value = true;
}

// 处理编辑人物
function handleEditPerson(person) {
  editingPerson.value = person;
  addingParentId.value = person.parentId;
  personForm.value = {
    name: person.name,
    gender: person.gender,
    relationship: person.relationship
  };
  
  const rel = relationships.find(r => r.value === person.relationship);
  selectedRelationship.value = rel ? rel.text : '';
  
  showAddPerson.value = true;
}

// 处理删除人物
async function handleDeletePerson(person) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除"${person.name}"吗？`
    });
    
    await personAPI.delete(person.id);
    showToast('删除成功');
    await loadPersonTree();
  } catch (error) {
    if (error !== 'cancel') {
      showToast(error.message || '删除失败');
    }
  }
}

// 保存人物
async function handleSavePerson() {
  try {
    if (!personForm.value.name) {
      showToast('请输入姓名');
      return;
    }

    if (!personForm.value.relationship) {
      showToast('请选择关系');
      return;
    }

    // 如果是自定义关系，需要输入具体关系
    let relationship = personForm.value.relationship;
    if (relationship === 'custom') {
      const customRel = prompt('请输入具体关系：');
      if (!customRel) {
        showToast('请输入具体关系');
        return;
      }
      relationship = customRel;
    }

    if (editingPerson.value) {
      // 更新
      await personAPI.update(editingPerson.value.id, {
        name: personForm.value.name,
        gender: personForm.value.gender,
        relationship: relationship
      });
      showToast('更新成功');
    } else {
      // 添加
      await personAPI.add({
        name: personForm.value.name,
        gender: personForm.value.gender,
        relationship: relationship,
        parentId: addingParentId.value
      });
      showToast('添加成功');
    }

    showAddPerson.value = false;
    resetForm();
    await loadPersonTree();
  } catch (error) {
    console.error('保存失败:', error);
    showToast('保存失败: ' + error.message);
  }
}

// 关系选择确认
function onRelationshipConfirm({ selectedOptions }) {
  personForm.value.relationship = selectedOptions[0].value;
  selectedRelationship.value = selectedOptions[0].text;
  showRelationshipPicker.value = false;
}

// 重置表单
function resetForm() {
  personForm.value = {
    name: '',
    gender: 'unknown',
    relationship: ''
  };
  selectedRelationship.value = '';
  addingParentId.value = null;
}

// 切换视图模式
function toggleViewMode() {
  viewMode.value = viewMode.value === 'tree' ? 'graph' : 'tree';
}

// 搜索处理
function handleSearch() {
  // 搜索已在 computed 中处理，这里可以添加额外逻辑
}

function handleSearchClear() {
  searchKeyword.value = '';
}

// 获取关系文本（复用 PersonTreeNode 的逻辑）
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

// 初始化关系图谱
function initNetworkGraph() {
  if (!graphContainer.value || allPersons.value.length === 0) return;
  
  // 销毁旧实例
  if (networkInstance) {
    networkInstance.destroy();
  }
  
  // 构建节点和边数据
  const nodes = new Set();
  const edges = new Set();
  
  allPersons.value.forEach(person => {
    // 添加节点
    nodes.add({
      id: person.id,
      label: person.name,
      title: `${person.name}\n${getRelationshipText(person.relationship)}`,
      group: person.gender || 'unknown',
      value: 1
    });
    
    // 添加边（关系连线）
    if (person.parentId) {
      edges.add({
        from: person.parentId,
        to: person.id,
        label: getRelationshipText(person.relationship),
        arrows: 'to',
        color: { color: '#848484' }
      });
    }
  });
  
  const data = {
    nodes: Array.from(nodes),
    edges: Array.from(edges)
  };
  
  const options = {
    nodes: {
      shape: 'dot',
      size: 20,
      font: {
        size: 14,
        color: '#333'
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      width: 2,
      smooth: {
        type: 'continuous'
      },
      font: {
        size: 12,
        align: 'middle'
      }
    },
    physics: {
      enabled: true,
      stabilization: {
        iterations: 100
      }
    },
    interaction: {
      dragNodes: true,
      dragView: true,
      zoomView: true
    },
    groups: {
      male: {
        color: { background: '#64b5f6', border: '#1976d2' }
      },
      female: {
        color: { background: '#f48fb1', border: '#c2185b' }
      },
      unknown: {
        color: { background: '#e0e0e0', border: '#757575' }
      }
    }
  };
  
  networkInstance = new Network(graphContainer.value, data, options);
  
  // 双击节点编辑
  networkInstance.on('doubleClick', (params) => {
    if (params.nodes.length > 0) {
      const personId = params.nodes[0];
      const person = allPersons.value.find(p => p.id === personId);
      if (person) {
        handleEditPerson(person);
      }
    }
  });
}
</script>

<style scoped>
.persons-page {
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

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.search-bar {
  padding: 8px 16px;
  background: #fff;
}

.person-tree {
  padding: 16px;
}

.tree-node {
  margin-bottom: 8px;
}

.relation-graph {
  width: 100%;
  height: calc(100vh - 200px);
  background: #fff;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-graph {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.person-form {
  padding: 16px 0;
}
</style>
