import { checkForUpdates, clearAllCaches } from './pwaUpdate';

// 从 package.json 读取版本号（构建时会自动替换）
const CURRENT_VERSION = __APP_VERSION__ || '1.0.0';

// 从 package.json 的 repository 字段读取 GitHub 仓库信息（构建时会自动替换）
const GITHUB_REPO = __GITHUB_REPO__ || 'your-username/cashGiftBook';

/**
 * 比较两个版本号
 * @param {string} v1 - 版本1
 * @param {string} v2 - 版本2
 * @returns {number} - 1: v1>v2, 0: v1=v2, -1: v1<v2
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  const len = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < len; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  
  return 0;
}

// 版本管理
export const versionAPI = {
  // 获取当前版本
  getCurrentVersion() {
    return CURRENT_VERSION;
  },

  // 检查更新（基于 GitHub Tags）
  async checkUpdate() {
    try {
      // 首先触发 PWA 更新检查
      const pwaUpdated = await checkForUpdates();
      
      if (pwaUpdated) {
        console.log('PWA: 已触发 Service Worker 更新检查');
      }
      
      // 从 GitHub API 获取最新版本
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('无法获取版本信息');
      }
      
      const data = await response.json();
      const latestVersion = data.tag_name.replace(/^v/, ''); // 去除 'v' 前缀
      const changelog = data.body || '暂无更新说明';
      
      console.log(`当前版本: ${CURRENT_VERSION}, 最新版本: ${latestVersion}`);
      
      // 比较版本号
      const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;
      
      return {
        hasUpdate,
        currentVersion: CURRENT_VERSION,
        latestVersion,
        forceUpdate: false, // 可以设置为 true 强制更新
        changelog
      };
    } catch (error) {
      console.error('版本检查失败:', error);
      return {
        hasUpdate: false,
        currentVersion: CURRENT_VERSION,
        latestVersion: CURRENT_VERSION,
        forceUpdate: false,
        changelog: '',
        error: true,
        errorMessage: error.message
      };
    }
  },

  // 显示更新提示
  showUpdateDialog(updateInfo) {
    return new Promise((resolve) => {
      const { latestVersion, changelog, forceUpdate } = updateInfo;
      
      if (forceUpdate) {
        // 强制更新 - 直接刷新（Service Worker 会自动处理缓存）
        alert(`发现新版本 ${latestVersion}\n\n${changelog}\n\n请点击确定后刷新页面`);
        window.location.reload();
      } else {
        // 可选更新
        const shouldUpdate = confirm(`发现新版本 ${latestVersion}\n\n${changelog}\n\n是否立即更新？`);
        if (shouldUpdate) {
          // 直接刷新，不需要手动清除缓存
          // PWA Service Worker 会自动激活新版本
          window.location.reload();
        }
      }
      
      resolve();
    });
  },
  
  // 强制清除缓存并更新（用于紧急情况）
  async forceUpdate() {
    // 注意：这只清除 Service Worker 缓存，不会影响 IndexedDB 和 localStorage
    await clearAllCaches();
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
    }
    window.location.reload();
  }
};
