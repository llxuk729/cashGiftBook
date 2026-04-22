import db from './index';

// 分类相关操作
export const categoryAPI = {
  // 添加分类
  async add(category) {
    return await db.categories.add({
      ...category,
      createTime: new Date()
    });
  },

  // 删除分类
  async delete(id) {
    return await db.categories.delete(id);
  },

  // 更新分类
  async update(id, updates) {
    return await db.categories.update(id, updates);
  },

  // 获取所有分类
  async getAll() {
    return await db.categories.toArray();
  },

  // 获取单个分类
  async getById(id) {
    return await db.categories.get(id);
  }
};

// 事件相关操作
export const eventAPI = {
  // 添加事件
  async add(event) {
    return await db.events.add({
      ...event,
      createTime: new Date()
    });
  },

  // 删除事件
  async delete(id) {
    return await db.events.delete(id);
  },

  // 更新事件
  async update(id, updates) {
    return await db.events.update(id, updates);
  },

  // 获取所有事件
  async getAll() {
    return await db.events.toArray();
  },

  // 获取单个事件
  async getById(id) {
    return await db.events.get(id);
  }
};
