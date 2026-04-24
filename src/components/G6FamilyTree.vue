<template>
  <div class="g6-family-tree" ref="containerRef"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Graph } from '@antv/g6';
import { personAPI } from '../database/personAPI';

const emit = defineEmits(['select']);

const containerRef = ref(null);
let graph = null;
let selectedNodeId = null;
let isInitialized = false;

// 关系定义（用于动态生成子节点）
const RELATIONSHIP_MAP = {
  'self': { 
    label: '我', 
    children: [
      { id: 'father', label: '父亲' },
      { id: 'mother', label: '母亲' },
      { id: 'husband', label: '丈夫' },
      { id: 'wife', label: '妻子' },
      { id: 'older_brother', label: '哥哥' },
      { id: 'younger_brother', label: '弟弟' },
      { id: 'older_sister', label: '姐姐' },
      { id: 'younger_sister', label: '妹妹' },
      { id: 'son', label: '儿子' },
      { id: 'daughter', label: '女儿' }
    ]
  },
  'father': { 
    label: '父亲',
    children: [
      { id: 'father_father', label: '爷爷' },
      { id: 'father_mother', label: '奶奶' },
      { id: 'father_older_brother', label: '伯父' },
      { id: 'father_younger_brother', label: '叔叔' },
      { id: 'father_older_sister', label: '姑妈' },
      { id: 'father_younger_sister', label: '姑姑' }
    ]
  },
  'mother': { 
    label: '母亲',
    children: [
      { id: 'mother_father', label: '外公' },
      { id: 'mother_mother', label: '外婆' },
      { id: 'mother_older_brother', label: '舅舅' },
      { id: 'mother_younger_brother', label: '舅舅' },
      { id: 'mother_older_sister', label: '姨妈' },
      { id: 'mother_younger_sister', label: '阿姨' }
    ]
  },
  'older_brother': {
    label: '哥哥',
    children: [
      { id: 'older_brother_wife', label: '嫂子' },
      { id: 'older_brother_son', label: '侄子' },
      { id: 'older_brother_daughter', label: '侄女' }
    ]
  },
  'younger_brother': {
    label: '弟弟',
    children: [
      { id: 'younger_brother_wife', label: '弟媳' },
      { id: 'younger_brother_son', label: '侄子' },
      { id: 'younger_brother_daughter', label: '侄女' }
    ]
  },
  'older_sister': {
    label: '姐姐',
    children: [
      { id: 'older_sister_husband', label: '姐夫' },
      { id: 'older_sister_son', label: '外甥' },
      { id: 'older_sister_daughter', label: '外甥女' }
    ]
  },
  'younger_sister': {
    label: '妹妹',
    children: [
      { id: 'younger_sister_husband', label: '妹夫' },
      { id: 'younger_sister_son', label: '外甥' },
      { id: 'younger_sister_daughter', label: '外甥女' }
    ]
  }
};

// 初始化 G6 图
async function initGraph() {
  if (isInitialized || !containerRef.value) return;
  
  // 等待 DOM 更新和容器尺寸确定
  await nextTick();
  
  const container = containerRef.value;
  const width = container.offsetWidth;
  const height = container.offsetHeight;
  
  console.log('初始化 G6 图表，尺寸:', width, 'x', height);
  
  if (width === 0 || height === 0) {
    console.warn('容器尺寸为 0，稍后重试');
    setTimeout(initGraph, 100);
    return;
  }

  graph = new Graph({
    container: containerRef.value,
    width,
    height,
    autoFit: 'center',
    layout: {
      type: 'indented',
      direction: 'LR',
      indent: 120,
      getHeight: () => 50,
      getWidth: () => 100
    },
    node: {
      type: 'circle',
      style: {
        size: 40,
        fill: '#fff',
        stroke: '#1989fa',
        lineWidth: 2
      },
      palette: {
        type: 'group',
        field: 'label'
      }
    },
    edge: {
      type: 'cubic-horizontal',
      style: {
        stroke: '#dcdee0',
        lineWidth: 1.5
      }
    },
    behaviors: ['drag-canvas', 'zoom-canvas']
  });

  // 节点点击事件
  graph.on('node:click', async (evt) => {
    const nodeId = evt.target.id;
    const nodeData = graph.getNodeData(nodeId);
    
    console.log('点击节点:', nodeId, nodeData);
    
    // 选中节点
    selectNode(nodeId);
    
    // 如果节点未展开，加载子节点
    if (!nodeData.children || nodeData.children.length === 0) {
      await expandNode(nodeData);
    }
  });

  // 初始数据 - G6 v5 使用 nodes 和 edges 数组
  const data = {
    nodes: [
      {
        id: 'self',
        data: {
          label: '我',
          relationType: 'self',
          path: ['self']
        },
        style: {
          labelText: '我',
          labelPlacement: 'bottom',
          labelFontSize: 13,
          labelFontWeight: 500,
          labelFill: '#323233'
        }
      }
    ],
    edges: []
  };

  console.log('设置初始数据:', data);
  graph.setData(data);
  graph.render();
  
  isInitialized = true;
  console.log('G6 图表初始化完成');
  console.log('当前数据:', data);
  console.log('节点数量:', graph.getNodeData().length);
}

// 选中节点
function selectNode(nodeId) {
  selectedNodeId = nodeId;
  
  // G6 v5 使用状态管理
  graph.setElementState(selectedNodeId, 'active');
}

// 展开节点（加载子节点）
async function expandNode(nodeData) {
  const relationConfig = RELATIONSHIP_MAP[nodeData.data?.relationType || nodeData.id];
  if (!relationConfig || !relationConfig.children) return;

  console.log('展开节点:', nodeData.id, '关系配置:', relationConfig);

  const newNodes = [];
  const newEdges = [];

  // 生成子节点
  for (const child of relationConfig.children) {
    // 尝试从数据库中查找已存在的人物
    const existingPersons = await personAPI.getByRelationshipType(child.id);
    
    const childId = `${nodeData.id}_${child.id}`;
    
    let nodeStyle = {};
    let label = child.label;
    let personId = null;

    // 如果找到已存在的人物，使用真实姓名
    if (existingPersons.length > 0) {
      label = existingPersons[0].name;
      personId = existingPersons[0].id;
      nodeStyle = {
        fill: '#07c160',
        stroke: '#07c160',
        lineWidth: 4
      };
    }

    newNodes.push({
      id: childId,
      data: {
        label: label,
        relationType: child.id,
        personId: personId,
        path: nodeData.data?.path ? [...nodeData.data.path, child.id] : [nodeData.id, child.id]
      },
      style: {
        labelText: label,
        labelPlacement: 'bottom',
        labelFontSize: 13,
        labelFontWeight: 500,
        labelFill: '#323233',
        ...nodeStyle
      }
    });

    // 添加边
    newEdges.push({
      source: nodeData.id,
      target: childId
    });
  }

  console.log('添加节点:', newNodes.length, '个，边:', newEdges.length, '条');

  // 使用增量更新，避免完全重绘
  graph.addData({
    nodes: newNodes,
    edges: newEdges
  });
  
  // 只重新布局和绘制，不重新渲染整个图表
  graph.layout();
  graph.draw();
  
  console.log('展开完成');
}

// 获取当前选中的节点信息
function getSelectedNode() {
  if (!selectedNodeId) return null;
  
  try {
    const nodeData = graph.getNodeData(selectedNodeId);
    console.log('获取选中节点:', selectedNodeId, nodeData);
    return {
      id: nodeData.data?.personId || null,
      name: nodeData.label,
      relationType: nodeData.data?.relationType,
      path: nodeData.data?.path
    };
  } catch (error) {
    console.error('获取节点数据失败:', error);
    return null;
  }
}

// 暴露方法给父组件
defineExpose({
  getSelectedNode
});

onMounted(() => {
  // 延迟初始化，确保容器已渲染
  setTimeout(() => {
    initGraph();
  }, 100);
});

onBeforeUnmount(() => {
  if (graph) {
    graph.destroy();
  }
});
</script>

<style scoped>
.g6-family-tree {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f7f8fa 0%, #ebedf0 100%);
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

:deep(.g6-node-selected) {
  filter: drop-shadow(0 0 8px rgba(25, 137, 250, 0.6));
}
</style>
