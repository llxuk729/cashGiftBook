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

  // 根据关系类型查找人物（用于关系选择器）
  async getByRelationshipType(relationshipType) {
    return await db.persons.where('relationship').equals(relationshipType).toArray();
  }
};
