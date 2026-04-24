import db from './index';
import { getRelationshipLabel } from '../utils/relationship';

// 人物关系相关操作
export const personAPI = {
  // 添加人物
  async add(person) {
    // 计算路径
    let path = person.name;
    if (person.parentId) {
      const parent = await this.getById(person.parentId);
      if (parent) {
        path = `${parent.path} > ${person.name}`;
      }
    }

    return await db.persons.add({
      ...person,
      path,
      createTime: new Date()
    });
  },

  // 删除人物
  async delete(id) {
    // 检查是否有子节点
    const children = await db.persons.where('parentId').equals(id).toArray();
    if (children.length > 0) {
      throw new Error('该人物下有子节点，无法删除');
    }
    return await db.persons.delete(id);
  },

  // 更新人物
  async update(id, updates) {
    return await db.persons.update(id, updates);
  },

  // 获取单个人物
  async getById(id) {
    return await db.persons.get(id);
  },

  // 获取所有人物
  async getAll() {
    return await db.persons.toArray();
  },

  // 获取某人的子节点
  async getChildren(parentId) {
    return await db.persons.where('parentId').equals(parentId).toArray();
  },

  // 构建树形结构
  async getTree() {
    const allPersons = await this.getAll();
    return this.buildTree(allPersons, null);
  },

  // 递归构建树
  buildTree(persons, parentId) {
    return persons
      .filter(p => p.parentId === parentId)
      .map(p => ({
        ...p,
        children: this.buildTree(persons, p.id)
      }));
  },

  // 获取完整路径名称
  async getFullPath(personId) {
    const person = await this.getById(personId);
    if (!person) return '';
    return person.path;
  },

  // 搜索人物
  async search(keyword) {
    const allPersons = await this.getAll();
    return allPersons.filter(p => 
      p.name.includes(keyword) || p.path.includes(keyword)
    );
  },

  // 智能查找或创建人物（用于记账时自动关联）
  async findOrCreatePerson(name, relationshipType, parentId = null) {
    // 1. 如果有parentId，查找该父节点下是否有同名同关系的子节点
    if (parentId) {
      const existing = await db.persons
        .where('parentId')
        .equals(parentId)
        .filter(p => p.name === name && p.relationship === relationshipType)
        .first();
      
      if (existing) {
        return { id: existing.id, isNew: false };
      }
    }
    
    // 2. 如果没有parentId，查找根节点下是否有同名同关系的人物
    if (!parentId) {
      const existing = await db.persons
        .where('parentId')
        .equals(null)
        .filter(p => p.name === name && p.relationship === relationshipType)
        .first();
      
      if (existing) {
        return { id: existing.id, isNew: false };
      }
    }
    
    // 3. 未找到，创建新人物
    const newPerson = {
      name,
      relationship: relationshipType,
      parentId,
      gender: 'unknown' // 默认未知，后续可编辑
    };
    
    const newId = await this.add(newPerson);
    return { id: newId, isNew: true };
  },

  // 根据关系路径查找人物（用于逻辑推导选择器）
  async getByPath(pathSegments) {
    if (!pathSegments || pathSegments.length === 0) return [];

    const allPersons = await this.getAll();
    const targetRelationship = pathSegments[pathSegments.length - 1];

    return allPersons
      .filter((person) => person.relationship === targetRelationship)
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  },

  // 获取常用/最近选择的人物（用于快捷入口）
  async getFrequent(limit = 8) {
    const allPersons = await this.getAll();
    const records = await db.records.toArray();
    const usageMap = new Map();

    records.forEach((record) => {
      if (record.relationshipId) {
        usageMap.set(record.relationshipId, (usageMap.get(record.relationshipId) || 0) + 1);
      }
    });

    return allPersons
      .filter((person) => person.relationship !== 'self')
      .sort((a, b) => {
        const usageDiff = (usageMap.get(b.id) || 0) - (usageMap.get(a.id) || 0);
        if (usageDiff !== 0) return usageDiff;
        return new Date(b.createTime) - new Date(a.createTime);
      })
      .slice(0, limit);
  },

  // 根据关系类型查找人物（用于关系选择器）
  async getByRelationshipType(relationshipType) {
    const records = await db.records.toArray();
    const usageMap = new Map();
    records.forEach((record) => {
      if (record.relationshipId) {
        usageMap.set(record.relationshipId, (usageMap.get(record.relationshipId) || 0) + 1);
      }
    });

    const persons = await db.persons.where('relationship').equals(relationshipType).toArray();
    return persons.sort((a, b) => {
      const usageDiff = (usageMap.get(b.id) || 0) - (usageMap.get(a.id) || 0);
      if (usageDiff !== 0) return usageDiff;
      return new Date(b.createTime) - new Date(a.createTime);
    });
  },

  // 按家族分支分组（为大家族优化）
  async getGroupedByBranch() {
    const allPersons = await this.getAll();
    
    // 定义家族分支
    const branches = {
      paternal: { name: '父系家族', icon: '👨', relationships: ['father', 'mother', 'father_father', 'father_mother', 'father_older_brother', 'father_younger_brother', 'father_older_sister', 'father_younger_sister'] },
      maternal: { name: '母系家族', icon: '👩', relationships: ['mother_father', 'mother_mother', 'mother_older_brother', 'mother_younger_brother', 'mother_older_sister', 'mother_younger_sister'] },
      spouse: { name: '配偶家族', icon: '💑', relationships: ['husband', 'wife', 'husband_father', 'husband_mother', 'wife_father', 'wife_mother'] },
      siblings: { name: '兄弟姐妹', icon: '👫', relationships: ['older_brother', 'younger_brother', 'older_sister', 'younger_sister'] },
      children: { name: '子女晚辈', icon: '👶', relationships: ['son', 'daughter', 'older_brother_son', 'older_brother_daughter', 'younger_brother_son', 'younger_brother_daughter', 'older_sister_son', 'older_sister_daughter', 'younger_sister_son', 'younger_sister_daughter'] },
      other: { name: '其他亲友', icon: '🤝', relationships: ['friend', 'colleague', 'classmate'] }
    };

    const result = {};
    
    // 初始化所有分支
    Object.keys(branches).forEach(key => {
      result[key] = {
        ...branches[key],
        members: [],
        count: 0
      };
    });

    // 将人物分配到对应分支
    allPersons.forEach(person => {
      let assigned = false;
      
      for (const [branchKey, branch] of Object.entries(branches)) {
        if (branch.relationships.includes(person.relationship)) {
          result[branchKey].members.push(person);
          result[branchKey].count++;
          assigned = true;
          break;
        }
      }
      
      // 未匹配到任何分支，放入“其他”
      if (!assigned) {
        result.other.members.push(person);
        result.other.count++;
      }
    });

    // 按创建时间排序（最近的在前）
    Object.values(result).forEach(branch => {
      branch.members.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
    });

    return result;
  },

  // 智能搜索（支持姓名、称谓、关系类型）
  async smartSearch(keyword) {
    if (!keyword || keyword.trim() === '') return [];
    
    const allPersons = await this.getAll();
    const lowerKeyword = keyword.toLowerCase().trim();
    
    // 称谓映射表（用于搜索）
    return allPersons.filter(person => {
      // 1. 姓名匹配
      if (person.name.toLowerCase().includes(lowerKeyword)) return true;
      
      // 2. 路径匹配
      if (person.path && person.path.toLowerCase().includes(lowerKeyword)) return true;
      
      // 3. 关系标签匹配
      return getRelationshipLabel(person.relationship).toLowerCase().includes(lowerKeyword);
    }).slice(0, 20); // 限制返回数量
  },

  // 获取最近选择的人物（基于记录频率）
  async getRecentSelected(limit = 10) {
    const allPersons = await this.getAll();
    const records = await db.records.toArray();

    const ids = records
      .filter((record) => record.relationshipId)
      .sort((a, b) => new Date(b.createTime || b.date) - new Date(a.createTime || a.date))
      .map((record) => record.relationshipId);

    const uniqueIds = [...new Set(ids)];
    const selected = uniqueIds
      .map((id) => allPersons.find((person) => person.id === id))
      .filter(Boolean)
      .slice(0, limit);

    if (selected.length >= limit) {
      return selected;
    }

    const fallback = allPersons
      .filter((person) => person.relationship !== 'self' && !uniqueIds.includes(person.id))
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .slice(0, limit - selected.length);

    return [...selected, ...fallback];
  }
};
