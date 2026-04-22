import db from './index';

const BACKUP_KEY = 'gift_money_backup';
const LAST_BACKUP_TIME_KEY = 'last_backup_time';
const BACKUP_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30天

// 备份和恢复相关操作
export const backupAPI = {
  // 导出所有数据为 JSON
  async exportData() {
    try {
      const data = {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        records: await db.records.toArray(),
        persons: await db.persons.toArray(),
        events: await db.events.toArray(),
        categories: await db.categories.toArray()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `礼金备份_${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      // 更新最后备份时间
      localStorage.setItem(LAST_BACKUP_TIME_KEY, new Date().toISOString());

      return { success: true, message: '备份文件已下载' };
    } catch (error) {
      console.error('导出失败:', error);
      return { success: false, message: '导出失败: ' + error.message };
    }
  },

  // 从 JSON 文件导入数据
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证数据格式
      if (!data.version || !data.records) {
        throw new Error('无效的备份文件格式');
      }

      // 确认覆盖
      const confirmMsg = `这将覆盖现有数据（${await db.records.count()}条记录），是否继续？`;
      if (!confirm(confirmMsg)) {
        return { success: false, message: '已取消' };
      }

      // 清空现有数据
      await db.records.clear();
      await db.persons.clear();
      await db.events.clear();
      await db.categories.clear();

      // 恢复数据
      if (data.records && data.records.length > 0) {
        await db.records.bulkAdd(data.records);
      }
      if (data.persons && data.persons.length > 0) {
        await db.persons.bulkAdd(data.persons);
      }
      if (data.events && data.events.length > 0) {
        await db.events.bulkAdd(data.events);
      }
      if (data.categories && data.categories.length > 0) {
        await db.categories.bulkAdd(data.categories);
      }

      return { success: true, message: '数据恢复成功' };
    } catch (error) {
      console.error('导入失败:', error);
      return { success: false, message: '导入失败: ' + error.message };
    }
  },

  // 创建轻量级备份到 LocalStorage
  async createLightweightBackup() {
    try {
      const records = await db.records.toArray();
      const summary = {
        version: '1.0.0',
        backupTime: new Date().toISOString(),
        recordCount: records.length,
        totalIncome: records.filter(r => r.type === 'income').reduce((sum, r) => sum + parseFloat(r.amount), 0),
        totalExpense: records.filter(r => r.type === 'expense').reduce((sum, r) => sum + parseFloat(r.amount), 0),
        recentRecords: records.slice(-10) // 最近10条记录
      };

      localStorage.setItem(BACKUP_KEY, JSON.stringify(summary));
      return { success: true };
    } catch (error) {
      console.error('创建轻量备份失败:', error);
      return { success: false, error };
    }
  },

  // 检查是否需要备份提醒
  shouldShowBackupReminder() {
    const lastBackupTime = localStorage.getItem(LAST_BACKUP_TIME_KEY);
    
    if (!lastBackupTime) {
      return true; // 从未备份过
    }

    const lastBackup = new Date(lastBackupTime);
    const now = new Date();
    const diff = now - lastBackup;

    return diff >= BACKUP_INTERVAL; // 超过7天
  },

  // 获取最后备份时间
  getLastBackupTime() {
    const timeStr = localStorage.getItem(LAST_BACKUP_TIME_KEY);
    return timeStr ? new Date(timeStr) : null;
  },

  // 云同步（预留功能）
  async cloudSync() {
    return {
      success: false,
      message: '云同步功能敬请期待',
      comingSoon: true
    };
  }
};
