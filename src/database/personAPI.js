import db from './index';

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
    
    // 简单实现：匹配路径结尾或关系类型
    return allPersons.filter(p => {
      const pathStr = p.path || '';
      // 检查路径是否以该关系段落结尾，或者关系类型匹配且处于同一层级（简化处理）
      return pathStr.endsWith(targetRelationship) || p.relationship === targetRelationship;
    });
  },

  // 获取常用/最近选择的人物（用于快捷入口）
  async getFrequent(limit = 8) {
    // 暂时简单返回最近创建的8个人物，后续可结合 recordAPI 统计频率
    const allPersons = await this.getAll();
    return allPersons.slice(-limit).reverse();
  },

  // 根据关系类型查找人物（用于关系选择器）
  async getByRelationshipType(relationshipType) {
    return await db.persons.where('relationship').equals(relationshipType).toArray();
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
    const titleMap = {
      '爸爸': 'father', '父亲': 'father', '爸': 'father',
      '妈妈': 'mother', '母亲': 'mother', '妈': 'mother',
      '爷爷': 'father_father', '祖父': 'father_father',
      '奶奶': 'father_mother', '祖母': 'father_mother',
      '外公': 'mother_father', '姥爷': 'mother_father',
      '外婆': 'mother_mother', '姥姥': 'mother_mother',
      '伯父': 'father_older_brother', '伯伯': 'father_older_brother', '大叔': 'father_older_brother',
      '叔叔': 'father_younger_brother', '叔': 'father_younger_brother',
      '姑妈': 'father_older_sister', '姑姑': 'father_older_sister', '姑': 'father_older_sister',
      '舅舅': 'mother_older_brother', '舅': 'mother_older_brother',
      '姨妈': 'mother_older_sister', '阿姨': 'mother_younger_sister', '姨': 'mother_older_sister',
      '哥哥': 'older_brother', '哥': 'older_brother',
      '弟弟': 'younger_brother', '弟': 'younger_brother',
      '姐姐': 'older_sister', '姐': 'older_sister',
      '妹妹': 'younger_sister', '妹': 'younger_sister',
      '儿子': 'son', '子': 'son',
      '女儿': 'daughter', '女': 'daughter',
      '侄子': 'older_brother_son', '侄女': 'older_brother_daughter',
      '外甥': 'older_sister_son', '外甥女': 'older_sister_daughter'
    };
    
    return allPersons.filter(person => {
      // 1. 姓名匹配
      if (person.name.toLowerCase().includes(lowerKeyword)) return true;
      
      // 2. 路径匹配
      if (person.path && person.path.toLowerCase().includes(lowerKeyword)) return true;
      
      // 3. 关系类型匹配（通过称谓映射）
      const relationshipKeys = Object.keys(titleMap).filter(key => key.includes(lowerKeyword));
      if (relationshipKeys.length > 0) {
        const matchedTypes = relationshipKeys.map(key => titleMap[key]);
        if (matchedTypes.includes(person.relationship)) return true;
      }
      
      return false;
    }).slice(0, 20); // 限制返回数量
  },

  // 获取最近选择的人物（基于记录频率）
  async getRecentSelected(limit = 10) {
    // 简单实现：返回最近创建的10个人物
    const allPersons = await this.getAll();
    return allPersons
      .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      .slice(0, limit);
  }
};
