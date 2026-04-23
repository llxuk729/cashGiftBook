/**
 * PWA 更新管理器
 * 处理 Service Worker 的更新提示和安装
 */

let refreshPrompt = null;

/**
 * 注册 PWA 更新监听器
 */
export function registerPWAUpdateHandler() {
  // 只在支持 Service Worker 且非 file:// 协议时注册
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
    console.log('PWA: 当前环境不支持 Service Worker');
    return;
  }

  // 监听更新提示
  window.addEventListener('swUpdated', (event) => {
    console.log('PWA: 检测到新版本');
    refreshPrompt = event.detail;
    
    // 显示更新提示
    showUpdateNotification();
  });

  // 监听缓存刷新完成
  window.addEventListener('swCached', () => {
    console.log('PWA: 缓存已刷新');
  });
}

/**
 * 显示更新通知
 */
function showUpdateNotification() {
  // 检查是否已经显示过通知
  if (document.querySelector('.pwa-update-toast')) {
    return;
  }

  // 创建更新提示 UI
  const toast = document.createElement('div');
  toast.className = 'pwa-update-toast';
  toast.innerHTML = `
    <div class="pwa-update-content">
      <div class="pwa-update-icon">🎉</div>
      <div class="pwa-update-text">
        <div class="pwa-update-title">发现新版本</div>
        <div class="pwa-update-desc">点击更新以获得最新功能</div>
      </div>
      <button class="pwa-update-btn" id="pwa-update-now">立即更新</button>
      <button class="pwa-update-close" id="pwa-update-later">稍后</button>
    </div>
  `;

  // 添加样式
  const style = document.createElement('style');
  style.textContent = `
    .pwa-update-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      z-index: 9999;
      animation: slideUp 0.3s ease-out;
      max-width: 90%;
      width: 340px;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }

    .pwa-update-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .pwa-update-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .pwa-update-text {
      flex: 1;
      min-width: 0;
    }

    .pwa-update-title {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 2px;
    }

    .pwa-update-desc {
      font-size: 12px;
      opacity: 0.9;
    }

    .pwa-update-btn {
      background: white;
      color: #667eea;
      border: none;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .pwa-update-btn:hover {
      background: #f0f0f0;
      transform: scale(1.05);
    }

    .pwa-update-close {
      background: transparent;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.5);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }

    .pwa-update-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 480px) {
      .pwa-update-toast {
        bottom: 70px;
        width: calc(100% - 32px);
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(toast);

  // 绑定事件
  document.getElementById('pwa-update-now').addEventListener('click', () => {
    updateApp();
  });

  document.getElementById('pwa-update-later').addEventListener('click', () => {
    closeNotification();
  });

  // 5 秒后自动关闭（如果用户没有操作）
  setTimeout(() => {
    if (document.querySelector('.pwa-update-toast')) {
      closeNotification();
    }
  }, 5000);
}

/**
 * 关闭通知
 */
function closeNotification() {
  const toast = document.querySelector('.pwa-update-toast');
  if (toast) {
    toast.style.animation = 'slideUp 0.3s ease-out reverse';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }
}

/**
 * 执行更新
 */
async function updateApp() {
  if (refreshPrompt) {
    try {
      // 发送消息给 Service Worker，跳过等待并立即激活
      refreshPrompt(true);
      
      // 显示加载提示
      showLoadingToast();
      
      // 等待页面重新加载
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('PWA: 更新失败', error);
      showErrorToast('更新失败，请手动刷新页面');
    }
  } else {
    // 如果没有 prompt，直接刷新
    window.location.reload();
  }
}

/**
 * 显示加载提示
 */
function showLoadingToast() {
  const toast = document.createElement('div');
  toast.className = 'pwa-loading-toast';
  toast.innerHTML = `
    <div class="pwa-loading-content">
      <div class="pwa-loading-spinner"></div>
      <div>正在更新...</div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    .pwa-loading-toast {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 30px;
      border-radius: 12px;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .pwa-loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .pwa-loading-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(toast);
}

/**
 * 显示错误提示
 */
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.className = 'pwa-error-toast';
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = `
    .pwa-error-toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff4757;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      animation: slideUp 0.3s ease-out;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

/**
 * 手动检查更新
 */
export async function checkForUpdates() {
  if (!('serviceWorker' in navigator) || window.location.protocol === 'file:') {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
    console.log('PWA: 已检查更新');
    return true;
  } catch (error) {
    console.error('PWA: 检查更新失败', error);
    return false;
  }
}

/**
 * 清除所有缓存（用于强制更新）
 */
export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('PWA: 已清除所有缓存');
  }
}
