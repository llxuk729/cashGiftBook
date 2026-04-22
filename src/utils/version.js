const CURRENT_VERSION = '1.0.0';
const VERSION_CHECK_URL = '/api/version'; // 预留的版本检查接口

// 版本管理
export const versionAPI = {
  // 获取当前版本
  getCurrentVersion() {
    return CURRENT_VERSION;
  },

  // 检查更新（预留功能）
  async checkUpdate() {
    try {
      // TODO: 实际部署时启用
      // const response = await fetch(VERSION_CHECK_URL);
      // const data = await response.json();
      
      // 模拟返回
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        forceUpdate: false,
        changelog: ''
      };
    } catch (error) {
      console.error('版本检查失败:', error);
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        forceUpdate: false,
        changelog: '',
        error: true
      };
    }
  },

  // 显示更新提示
  showUpdateDialog(updateInfo) {
    return new Promise((resolve) => {
      const { latestVersion, changelog, forceUpdate } = updateInfo;
      
      if (forceUpdate) {
        // 强制更新
        alert(`发现新版本 ${latestVersion}\n\n${changelog}\n\n请点击确定后刷新页面`);
        window.location.reload();
      } else {
        // 可选更新
        const shouldUpdate = confirm(`发现新版本 ${latestVersion}\n\n${changelog}\n\n是否立即更新？`);
        if (shouldUpdate) {
          window.location.reload();
        }
      }
      
      resolve();
    });
  }
};
