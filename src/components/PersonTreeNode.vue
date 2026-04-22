<template>
  <div class="person-tree-node">
    <van-cell @click="handleNodeClick">
      <template #title>
        <div class="node-content">
          <span class="node-name">{{ person.name }}</span>
          <span class="node-relationship">{{ getRelationshipText(person.relationship) }}</span>
        </div>
        <div v-if="showPath" class="node-path">{{ person.path }}</div>
      </template>
      <template #right-icon>
        <div class="node-actions">
          <van-icon name="plus" @click.stop="$emit('add-child', person.id)" title="添加子节点" />
          <van-icon name="edit" @click.stop="$emit('edit', person)" title="编辑" />
          <van-icon 
            v-if="person.relationship !== 'self'" 
            name="delete-o" 
            @click.stop="$emit('delete', person)" 
            title="删除"
          />
        </div>
      </template>
    </van-cell>

    <!-- 递归渲染子节点 -->
    <div v-if="person.children && person.children.length > 0" class="children-list">
      <PersonTreeNode
        v-for="child in person.children"
        :key="child.id"
        :person="child"
        :show-path="showPath"
        @add-child="$emit('add-child', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { showToast } from 'vant';

const props = defineProps({
  person: {
    type: Object,
    required: true
  },
  showPath: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['add-child', 'edit', 'delete']);

// 处理节点点击
function handleNodeClick() {
  // 可以在这里添加更多交互，比如显示详情
  if (props.person.path) {
    showToast(props.person.path);
  }
}

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

function getRelationshipText(relationship) {
  return relationshipMap[relationship] || relationship;
}
</script>

<style scoped>
.person-tree-node {
  margin-left: 24px;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.node-name {
  font-weight: 500;
  font-size: 15px;
}

.node-relationship {
  font-size: 12px;
  color: #969799;
  padding: 2px 6px;
  background: #f7f8fa;
  border-radius: 4px;
}

.node-path {
  font-size: 11px;
  color: #c8c9cc;
  margin-top: 4px;
  word-break: break-all;
}

.node-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.node-actions .van-icon {
  font-size: 18px;
  color: #1989fa;
}

.children-list {
  border-left: 2px solid #ebedf0;
  margin-left: 12px;
}
</style>
