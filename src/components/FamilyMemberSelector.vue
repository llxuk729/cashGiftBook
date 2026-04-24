<template>
  <div class="family-member-selector">
    <div class="search-panel">
      <van-search
        v-model="searchKeyword"
        placeholder="搜姓名、称呼，比如 舅舅 / 张三"
        shape="round"
        clearable
      />
      <div class="search-tip">
        先搜已有联系人；搜不到时，直接点关系模板也能继续记账。
      </div>
    </div>

    <div class="selector-body">
      <template v-if="isSearching">
        <section class="section-card" v-if="personResults.length > 0">
          <div class="section-header">
            <div>
              <h4>匹配到的人物</h4>
              <p>直接带入姓名和关系，记账更快</p>
            </div>
          </div>

          <div class="person-list">
            <button
              v-for="person in personResults"
              :key="person.id"
              type="button"
              class="person-card"
              @click="selectPerson(person)"
            >
              <div
                class="avatar"
                :style="{ background: getAvatarColor(person.name) }"
              >
                {{ person.name.charAt(0) }}
              </div>
              <div class="info">
                <div class="name">{{ person.name }}</div>
                <div class="relationship">
                  {{ getRelationshipLabel(person.relationship) }}
                </div>
              </div>
              <van-icon name="arrow" color="#9aa2bd" />
            </button>
          </div>
        </section>

        <section class="section-card" v-if="relationResults.length > 0">
          <div class="section-header">
            <div>
              <h4>关系模板</h4>
              <p>适合先选关系，再回表单输入姓名</p>
            </div>
          </div>

          <div class="relation-grid compact">
            <button
              v-for="option in relationResults"
              :key="option.type"
              type="button"
              class="relation-card"
              @click="pickTemplate(option)"
            >
              <span class="relation-icon">{{ option.icon }}</span>
              <span class="relation-label">{{ option.label }}</span>
            </button>
          </div>
        </section>

        <div
          v-if="personResults.length === 0 && relationResults.length === 0"
          class="empty-state"
        >
          <van-empty description="没有找到匹配的人物或关系" />
        </div>
      </template>

      <template v-else>
        <section
          v-if="selectedTemplate"
          class="section-card template-highlight"
        >
          <div class="template-summary">
            <div>
              <div class="summary-label">已选关系模板</div>
              <div class="summary-title">
                <span>{{ selectedTemplate.icon }}</span>
                <strong>{{ selectedTemplate.label }}</strong>
              </div>
              <div class="summary-tip">
                回到表单填写姓名，保存时会自动关联或创建人物。
              </div>
            </div>
            <van-button round type="primary" @click="confirmTemplate">
              用这个关系
            </van-button>
          </div>

          <div v-if="templateMatches.length > 0" class="template-matches">
            <div class="mini-title">你也可以直接选已有联系人</div>
            <div class="chips">
              <button
                v-for="person in templateMatches"
                :key="person.id"
                type="button"
                class="person-chip"
                @click="selectPerson(person)"
              >
                {{ person.name }}
              </button>
            </div>
          </div>
        </section>

        <section v-if="recentSelected.length > 0" class="section-card">
          <div class="section-header">
            <div>
              <h4>最近常记</h4>
              <p>常用联系人一键带入</p>
            </div>
          </div>

          <div class="recent-list">
            <button
              v-for="person in recentSelected"
              :key="person.id"
              type="button"
              class="recent-item"
              @click="selectPerson(person)"
            >
              <div
                class="avatar small"
                :style="{ background: getAvatarColor(person.name) }"
              >
                {{ person.name.charAt(0) }}
              </div>
              <span class="recent-name">{{ person.name }}</span>
              <span class="recent-role">
                {{ getRelationshipLabel(person.relationship) }}
              </span>
            </button>
          </div>
        </section>

        <section class="section-card">
          <div class="section-header">
            <div>
              <h4>关系模板</h4>
              <p>不必先建人物，先把关系选准最重要</p>
            </div>
          </div>

          <div
            v-for="group in relationshipGroups"
            :key="group.key"
            class="relation-group"
          >
            <div class="mini-title">{{ group.icon }} {{ group.label }}</div>
            <div class="relation-grid">
              <button
                v-for="option in group.items"
                :key="option.type"
                type="button"
                class="relation-card"
                :class="{ active: selectedTemplate?.type === option.type }"
                @click="pickTemplate(option)"
              >
                <span class="relation-icon">{{ option.icon }}</span>
                <span class="relation-label">{{ option.label }}</span>
              </button>
            </div>
          </div>
        </section>

        <section class="section-card" v-if="contactGroups.length > 0">
          <div class="section-header">
            <div>
              <h4>已有联系人</h4>
              <p>按关系分组浏览，适合家里人多的时候快速定位</p>
            </div>
            <van-button plain round size="small" @click="showCreateDialog = true">
              新建对象
            </van-button>
          </div>

          <div class="contact-groups">
            <div
              v-for="group in contactGroups"
              :key="group.key"
              class="contact-group"
            >
              <div class="mini-title">{{ group.icon }} {{ group.label }}</div>
              <div class="chips">
                <button
                  v-for="person in group.members"
                  :key="person.id"
                  type="button"
                  class="person-chip"
                  @click="selectPerson(person)"
                >
                  {{ person.name }}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section v-else class="section-card empty-card">
          <div class="empty-copy">
            <h4>先从关系模板开始也完全够用</h4>
            <p>你可以直接记账，系统会在保存时自动补齐人物档案。</p>
          </div>
          <van-button round plain type="primary" @click="showCreateDialog = true">
            新建一个对象
          </van-button>
        </section>
      </template>
    </div>

    <van-dialog
      v-model:show="showCreateDialog"
      title="新建往来对象"
      show-cancel-button
      confirm-button-text="保存并选中"
      cancel-button-text="取消"
      @confirm="createPersonDirectly"
    >
      <div class="create-form">
        <van-field v-model="createName" label="姓名" placeholder="例如：李叔 / 王阿姨" clearable />
        <van-field label="关系">
          <template #input>
            <van-radio-group v-model="createRelationType" direction="horizontal">
              <van-radio v-for="item in quickCreateOptions" :key="item.type" :name="item.type">
                {{ item.label }}
              </van-radio>
            </van-radio-group>
          </template>
        </van-field>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { personAPI } from "../database/personAPI";
import { showToast } from "vant";
import {
  RELATIONSHIP_GROUPS,
  RELATIONSHIP_META,
  getRelationshipLabel,
  getRelationshipOptionsByGroup,
  searchRelationshipOptions,
} from "../utils/relationship";

const emit = defineEmits(["select"]);

const searchKeyword = ref("");
const selectedTemplate = ref(null);
const recentSelected = ref([]);
const allPersons = ref([]);
const showCreateDialog = ref(false);
const createName = ref("");
const createRelationType = ref("friend");

const displayPersons = computed(() =>
  allPersons.value.filter((person) => person.relationship !== "self"),
);

const isSearching = computed(() => Boolean(searchKeyword.value.trim()));

const personResults = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return [];

  return displayPersons.value
    .filter((person) => {
      return [
        person.name,
        person.path,
        getRelationshipLabel(person.relationship),
      ]
        .filter(Boolean)
        .some((item) => item.toLowerCase().includes(keyword));
    })
    .slice(0, 20);
});

const relationResults = computed(() =>
  searchRelationshipOptions(searchKeyword.value).slice(0, 12),
);

const relationshipGroups = computed(() => getRelationshipOptionsByGroup());
const quickCreateOptions = computed(() =>
  searchRelationshipOptions("").filter((item) =>
    ["friend", "colleague", "classmate", "father", "mother", "uncle", "aunt"].includes(item.type),
  ),
);

const templateMatches = computed(() => {
  if (!selectedTemplate.value) return [];

  return displayPersons.value
    .filter((person) => person.relationship === selectedTemplate.value.type)
    .slice(0, 8);
});

const contactGroups = computed(() => {
  return RELATIONSHIP_GROUPS.map((group) => ({
    ...group,
    members: displayPersons.value
      .filter(
        (person) =>
          (RELATIONSHIP_META[person.relationship]?.branch || "social") ===
          group.key,
      )
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .slice(0, 12),
  })).filter((group) => group.members.length > 0);
});

function getAvatarColor(name) {
  const colors = [
    "linear-gradient(135deg, #6f8cff, #8a5cff)",
    "linear-gradient(135deg, #ff8a65, #ff5f8f)",
    "linear-gradient(135deg, #36cfc9, #1677ff)",
    "linear-gradient(135deg, #5ad8a6, #3fca73)",
    "linear-gradient(135deg, #ffb020, #ff7a45)",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

function pickTemplate(option) {
  selectedTemplate.value = option;
}

function confirmTemplate() {
  if (!selectedTemplate.value) return;

  emit("select", {
    kind: "template",
    relationType: selectedTemplate.value.type,
    relationLabel: selectedTemplate.value.label,
  });
}

function selectPerson(person) {
  emit("select", { kind: "person", person });
}

async function createPersonDirectly() {
  const name = createName.value.trim();
  if (!name) {
    showToast("请输入姓名");
    return false;
  }

  try {
    const id = await personAPI.add({
      name,
      relationship: createRelationType.value,
      parentId: null,
      gender: "unknown",
    });

    const person = await personAPI.getById(id);
    if (!person) return false;

    allPersons.value = [person, ...allPersons.value];
    recentSelected.value = [person, ...recentSelected.value.filter((item) => item.id !== person.id)].slice(0, 8);
    emit("select", { kind: "person", person });
    createName.value = "";
    createRelationType.value = "friend";
    showToast("已添加并选中");
    return true;
  } catch (error) {
    console.error("创建对象失败:", error);
    showToast("创建失败");
    return false;
  }
}

async function loadData() {
  recentSelected.value = await personAPI.getRecentSelected(8);
  allPersons.value = await personAPI.getAll();
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
  background:
    radial-gradient(circle at top, rgba(111, 140, 255, 0.16), transparent 38%),
    linear-gradient(180deg, #f8faff 0%, #f4f7ff 100%);
}

.search-panel {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 14px 16px 10px;
  background: rgba(248, 250, 255, 0.9);
  backdrop-filter: blur(18px);
}

.search-tip {
  padding: 4px 6px 0;
  font-size: 12px;
  color: #7b86a4;
}

.selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 16px 24px;
}

.section-card {
  margin-top: 12px;
  padding: 16px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 40px rgba(88, 106, 154, 0.12);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.section-header h4,
.empty-copy h4 {
  margin: 0;
  font-size: 16px;
  color: #1b2559;
}

.section-header p,
.empty-copy p,
.summary-tip,
.summary-label {
  margin: 4px 0 0;
  font-size: 12px;
  color: #7b86a4;
}

.template-highlight {
  background: linear-gradient(
    135deg,
    rgba(111, 140, 255, 0.12),
    rgba(82, 196, 255, 0.14)
  );
}

.template-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 20px;
  color: #1b2559;
}

.template-matches {
  margin-top: 14px;
}

.mini-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #43506f;
}

.recent-list,
.chips {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 2px;
}

.recent-item {
  min-width: 88px;
  padding: 12px 10px;
  border: none;
  border-radius: 18px;
  background: #f7f9ff;
  text-align: center;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.recent-item:active,
.relation-card:active,
.person-card:active,
.person-chip:active {
  transform: scale(0.97);
}

.recent-name {
  display: block;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #25304d;
}

.recent-role {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #7b86a4;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 16px;
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  box-shadow: 0 10px 20px rgba(72, 95, 157, 0.2);
}

.avatar.small {
  width: 48px;
  height: 48px;
  margin: 0 auto;
  border-radius: 18px;
}

.relation-group + .relation-group,
.contact-group + .contact-group {
  margin-top: 14px;
}

.relation-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.relation-grid.compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.relation-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 86px;
  padding: 12px 8px;
  border: 1px solid rgba(113, 132, 187, 0.14);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #f7f9ff);
  color: #25304d;
  transition: all 0.18s ease;
}

.relation-card.active {
  border-color: #6f8cff;
  background: linear-gradient(180deg, #eef2ff, #e8f0ff);
  box-shadow: 0 10px 22px rgba(111, 140, 255, 0.2);
}

.relation-icon {
  font-size: 24px;
}

.relation-label {
  font-size: 12px;
  font-weight: 600;
}

.person-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.person-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(113, 132, 187, 0.12);
  border-radius: 18px;
  background: #f9fbff;
  color: inherit;
}

.info {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.name {
  font-size: 15px;
  font-weight: 700;
  color: #1b2559;
}

.relationship {
  margin-top: 4px;
  font-size: 12px;
  color: #7b86a4;
}

.person-chip {
  padding: 9px 14px;
  border: 1px solid rgba(113, 132, 187, 0.14);
  border-radius: 999px;
  background: #f7f9ff;
  color: #32415f;
  white-space: nowrap;
}

.empty-state {
  padding-top: 48px;
}

.empty-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.create-form {
  padding: 8px 12px 0;
}

button {
  cursor: pointer;
}

@media (max-width: 420px) {
  .relation-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .template-summary,
  .empty-card {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
