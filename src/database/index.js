import Dexie from 'dexie';

// 创建数据库实例
const db = new Dexie('GiftMoneyDB');

// 定义数据库版本和表结构
db.version(1).stores({
  // 礼金记录表
  records: '++id, date, amount, type, personId, eventId, categoryId, note, createTime',
  // 人物关系表
  persons: '++id, name, gender, relationship, parentId, path, createTime',
  // 事件表（如婚礼、生日等）
  events: '++id, name, date, type, createTime',
  // 礼金分类表
  categories: '++id, name, type, createTime',
  // 设置表
  settings: 'key, value'
});

// 版本2：为分类添加deletable字段
db.version(2).stores({
  categories: '++id, name, type, deletable, createTime'
}).upgrade(async (tx) => {
  // 为已有分类添加deletable字段，默认为true（可删除）
  await tx.table('categories').toCollection().modify(category => {
    category.deletable = true;
  });
});

// 初始化默认数据
export async function initDefaultData() {
  const categoriesCount = await db.categories.count();
  
  if (categoriesCount === 0) {
    // 初始化默认分类（deletable: false 表示不可删除）
    await db.categories.bulkAdd([
      { name: '结婚', type: 'expense', deletable: false, createTime: new Date() },
      { name: '周岁', type: 'expense', deletable: false, createTime: new Date() },
      { name: '考大学', type: 'expense', deletable: false, createTime: new Date() },
      { name: '祝寿', type: 'expense', deletable: false, createTime: new Date() },
      { name: '满月', type: 'expense', deletable: false, createTime: new Date() },
      { name: '乔迁', type: 'expense', deletable: false, createTime: new Date() },
      { name: '开业', type: 'expense', deletable: false, createTime: new Date() },
      { name: '其他', type: 'expense', deletable: false, createTime: new Date() }
    ]);
  }

  // 初始化根节点（自己）
  const personsCount = await db.persons.count();
  if (personsCount === 0) {
    await db.persons.add({
      name: '我',
      gender: 'unknown',
      relationship: 'self',
      parentId: null,
      path: '我',
      createTime: new Date()
    });
  }
}

export default db;
