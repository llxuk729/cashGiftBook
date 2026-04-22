import db from './index';

// 礼金记录相关操作
export const recordAPI = {
  // 添加记录
  async add(record) {
    return await db.records.add({
      ...record,
      createTime: new Date()
    });
  },

  // 删除记录
  async delete(id) {
    return await db.records.delete(id);
  },

  // 更新记录
  async update(id, updates) {
    return await db.records.update(id, updates);
  },

  // 获取所有记录
  async getAll() {
    return await db.records.toArray();
  },

  // 根据条件查询
  async query(filters = {}) {
    let collection = db.records.toCollection();

    // 支持按 personId 或 relationshipId 查询（兼容旧数据）
    if (filters.personId) {
      collection = collection.filter(record => 
        record.personId === filters.personId || record.relationshipId === filters.personId
      );
    }

    if (filters.relationshipId) {
      collection = collection.filter(record => record.relationshipId === filters.relationshipId);
    }

    if (filters.categoryId) {
      collection = collection.filter(record => record.categoryId === filters.categoryId);
    }

    if (filters.startDate && filters.endDate) {
      collection = collection.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(filters.startDate) && 
               recordDate <= new Date(filters.endDate);
      });
    }

    if (filters.type) {
      collection = collection.filter(record => record.type === filters.type);
    }

    const records = await collection.toArray();
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // 获取统计数据
  async getStatistics(filters = {}) {
    const records = await this.query(filters);
    
    const income = records
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    const expense = records
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return {
      income,
      expense,
      balance: income - expense,
      count: records.length
    };
  },

  // 按人物统计（兼容旧字段）
  async getByPerson(personId) {
    const records = await db.records.where('personId').equals(personId).toArray();
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // 按关系统计（新字段）
  async getByRelationship(relationshipId) {
    const records = await db.records.where('relationshipId').equals(relationshipId).toArray();
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  // 按分类统计
  async getByCategory(categoryId) {
    const records = await db.records.where('categoryId').equals(categoryId).toArray();
    return records.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};
