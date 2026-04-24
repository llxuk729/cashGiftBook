<template>
  <div class="family-tree-container" ref="containerRef">
    <svg 
      :width="width" 
      :height="height" 
      @mousedown="startDrag"
      @mousemove="onDrag"
      @mouseup="endDrag"
      @mouseleave="endDrag"
    >
      <g :transform="`translate(${offsetX}, ${offsetY}) scale(${scale})`">
        <!-- 连线 -->
        <path 
          v-for="link in links" 
          :key="link.id"
          :d="link.path"
          class="tree-link"
        />
        
        <!-- 节点 -->
        <g 
          v-for="node in nodes" 
          :key="node.id"
          :transform="`translate(${node.x}, ${node.y})`"
          @click="handleNodeClick(node)"
          class="tree-node-group"
        >
          <circle 
            :r="nodeRadius" 
            :class="['node-circle', { 'selected': selectedNodeId === node.id, 'expanded': node.expanded }]"
          />
          <text 
            dy="5" 
            text-anchor="middle" 
            class="node-text"
          >{{ node.label }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { personAPI } from '../database/personAPI';

const props = defineProps({
  initialRelationship: { type: String, default: 'self' }
});

const emit = defineEmits(['select']);

// 关系定义
const RELATIONSHIP_MAP = {
  'self': { label: '我', next: ['father', 'mother', 'husband', 'wife', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister', 'son', 'daughter'] },
  'father': { label: '父亲', next: ['father', 'mother', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister'] },
  'mother': { label: '母亲', next: ['father', 'mother', 'older_brother', 'younger_brother', 'older_sister', 'younger_sister'] },
  'older_brother': { label: '哥哥', next: ['wife', 'son', 'daughter'] },
  'younger_brother': { label: '弟弟', next: ['wife', 'son', 'daughter'] },
  'older_sister': { label: '姐姐', next: ['husband', 'son', 'daughter'] },
  'younger_sister': { label: '妹妹', next: ['husband', 'son', 'daughter'] },
  'husband': { label: '丈夫', next: ['father', 'mother'] },
  'wife': { label: '妻子', next: ['father', 'mother'] },
  'son': { label: '儿子', next: [] },
  'daughter': { label: '女儿', next: [] },
};

const containerRef = ref(null);
const width = ref(800);
const height = ref(600);
const nodeRadius = 24;
const levelHeight = 100;
const nodeSpacing = 80;

// 树数据
const treeData = ref({
  id: 'root',
  type: 'self',
  label: '我',
  x: 0,
  y: 0,
  expanded: false,
  children: [],
  personId: null
});

const nodes = ref([]);
const links = ref([]);
const selectedNodeId = ref(null);

// 拖拽状态
const offsetX = ref(400);
const offsetY = ref(50);
const scale = ref(1);
const isDragging = ref(false);
const lastMouseX = ref(0);
const lastMouseY = ref(0);

// 布局计算
function calculateLayout(node, depth = 0, xOffset = 0) {
  node.x = xOffset;
  node.y = depth * levelHeight;
  
  if (node.expanded && node.children.length > 0) {
    const totalWidth = (node.children.length - 1) * nodeSpacing;
    let startX = xOffset - totalWidth / 2;
    
    node.children.forEach((child, index) => {
      calculateLayout(child, depth + 1, startX + index * nodeSpacing);
    });
  }
}

// 更新渲染数据
function updateRenderData() {
  nodes.value = [];
  links.value = [];
  
  function traverse(node, parent = null) {
    nodes.value.push(node);
    if (parent) {
      links.value.push({
        id: `${parent.id}-${node.id}`,
        path: `M${parent.x},${parent.y + nodeRadius} Q${parent.x},${(parent.y + node.y) / 2} ${node.x},${node.y - nodeRadius}`
      });
    }
    if (node.expanded) {
      node.children.forEach(child => traverse(child, node));
    }
  }
  
  calculateLayout(treeData.value);
  traverse(treeData.value);
}

// 节点点击处理
async function handleNodeClick(node) {
  selectedNodeId.value = node.id;
  
  if (!node.expanded && RELATIONSHIP_MAP[node.type]?.next.length > 0) {
    // 展开节点
    node.expanded = true;
    
    // 生成子节点
    for (const relType of RELATIONSHIP_MAP[node.type].next) {
      // 检查数据库中是否已有此人
      const existingPersons = await personAPI.getByPath([relType]); // 简化查找
      const person = existingPersons.length > 0 ? existingPersons[0] : null;
      
      node.children.push({
        id: `${node.id}-${relType}-${Date.now()}`,
        type: relType,
        label: person ? person.name : RELATIONSHIP_MAP[relType].label,
        personId: person ? person.id : null,
        expanded: false,
        children: []
      });
    }
    updateRenderData();
  } else if (node.personId) {
    // 选中已有的人物
    emit('select', { id: node.personId, name: node.label, type: node.type });
  }
}

// 拖拽逻辑
function startDrag(e) {
  isDragging.value = true;
  lastMouseX.value = e.clientX;
  lastMouseY.value = e.clientY;
}

function onDrag(e) {
  if (!isDragging.value) return;
  offsetX.value += e.clientX - lastMouseX.value;
  offsetY.value += e.clientY - lastMouseY.value;
  lastMouseX.value = e.clientX;
  lastMouseY.value = e.clientY;
}

function endDrag() {
  isDragging.value = false;
}

// 初始化
onMounted(() => {
  if (containerRef.value) {
    width.value = containerRef.value.clientWidth;
    height.value = containerRef.value.clientHeight;
  }
  updateRenderData();
});

defineExpose({
  getSelectedPerson: () => {
    function findSelected(node) {
      if (node.id === selectedNodeId.value) return node;
      for (const child of node.children) {
        const found = findSelected(child);
        if (found) return found;
      }
      return null;
    }
    return findSelected(treeData.value);
  }
});
</script>

<style scoped>
.family-tree-container {
  width: 100%;
  height: 100%;
  background: #f7f8fa;
  overflow: hidden;
  cursor: grab;
}

.tree-link {
  fill: none;
  stroke: #dcdee0;
  stroke-width: 2px;
  stroke-linecap: round;
  animation: drawLine 0.5s ease-out forwards;
}

@keyframes drawLine {
  from { stroke-dashoffset: 100; opacity: 0; }
  to { stroke-dashoffset: 0; opacity: 1; }
}

.tree-node-group {
  cursor: pointer;
  transition: transform 0.2s;
}

.tree-node-group:hover {
  transform: scale(1.1);
}

.node-circle {
  fill: #fff;
  stroke: #1989fa;
  stroke-width: 2px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.node-circle.selected {
  fill: #1989fa;
  stroke: #1989fa;
  filter: drop-shadow(0 0 8px rgba(25, 137, 250, 0.6));
  transform: scale(1.1);
}

.node-circle.expanded {
  stroke-dasharray: 4 2;
  stroke: #07c160;
}

.node-text {
  font-size: 12px;
  fill: #323233;
  pointer-events: none;
}

.node-circle.selected + .node-text {
  fill: #fff;
}
</style>
