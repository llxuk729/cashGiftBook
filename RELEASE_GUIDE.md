# 🚀 GitHub Pages 版本发布指南

## 📋 方案说明

本方案利用 **GitHub Releases** 实现无后端的版本管理：

### 工作原理

1. **版本号来源**：从 `package.json` 的 `version` 字段读取
2. **最新版本检测**：通过 GitHub API 获取最新的 Release
3. **版本对比**：自动比较本地版本和远程版本
4. **更新提示**：发现新版本时，通过 PWA 提示用户更新

### 优势

- ✅ **无需后端服务器**：完全基于 GitHub 基础设施
- ✅ **自动化部署**：推送到 main 分支自动部署到 GitHub Pages
- ✅ **版本控制清晰**：使用 Git Tag 管理版本
- ✅ **更新提示友好**：PWA 自动检测并提示用户
- ✅ **免费且稳定**：GitHub 提供的基础服务

---

## 📦 发布新版本流程

### 方式一：使用发布脚本（推荐）

#### Windows 用户

```bash
# 在项目根目录执行
scripts\release.bat 1.1.0 "修复了PWA更新问题，优化版本检测"
```

#### Mac/Linux 用户

```bash
# 添加执行权限
chmod +x scripts/release.sh

# 执行发布
./scripts/release.sh 1.1.0 "修复了PWA更新问题，优化版本检测"
```

### 方式二：手动发布

#### 步骤 1：更新版本号

编辑 `package.json`，修改 `version` 字段：

```json
{
  "name": "cashgiftbook",
  "version": "1.1.0",  // 修改这里
  ...
}
```

或使用命令：

```bash
npm version 1.1.0 --no-git-tag-version
```

#### 步骤 2：提交代码

```bash
git add .
git commit -m "chore: release v1.1.0"
git push origin main
```

#### 步骤 3：创建 Git Tag

```bash
git tag -a "v1.1.0" -m "Release v1.1.0"
git push origin v1.1.0
```

#### 步骤 4：创建 GitHub Release

1. 访问：https://github.com/你的用户名/cashGiftBook/releases/new
2. 选择 Tag：`v1.1.0`
3. 填写发布标题：`v1.1.0`
4. 填写更新说明（支持 Markdown）：
   ```markdown
   ## 🎉 新功能
   - 添加了 xxx 功能
   
   ## 🐛 Bug 修复
   - 修复了 PWA 更新问题
   - 优化了版本检测逻辑
   
   ## ⚡ 性能优化
   - 提升了加载速度
   ```
5. 点击 **"Publish release"**

---

## ⏱️ 发布时间线

```
T+0s     推送代码和 Tag
T+30s    GitHub Actions 开始构建
T+90s    构建完成，部署到 GitHub Pages
T+120s   新版本上线
```

用户将在下次打开应用时收到更新提示。

---

## 🔍 版本检测机制

### 自动检测时机

1. **应用启动时**：检查是否有新版本
2. **用户手动检查**：在设置页面点击"检查更新"
3. **PWA Service Worker**：后台检测资源更新

### 检测流程

```
用户打开应用
    ↓
触发 PWA 更新检查
    ↓
调用 GitHub API 获取最新版本
    ↓
比较本地版本 vs 远程版本
    ↓
如果有更新 → 显示更新提示
如果没有更新 → 显示"已是最新版本"
```

---

## 📱 用户体验

### 发现新版本时

用户会看到漂亮的更新提示：

```
┌─────────────────────────────┐
│  🎉  发现新版本              │
│      点击更新以获得最新功能    │
│              [立即更新] [稍后] │
└─────────────────────────────┘
```

### 点击"立即更新"后

1. 清除旧缓存
2. 重新加载页面
3. 显示新版本

### 离线模式

如果网络不可用：
- 应用仍可正常使用（PWA 缓存）
- 提示"当前为离线版本"
- 提供"清除缓存"选项

---

## 🔧 配置说明

### 1. 修改仓库信息

编辑 `src/utils/version.js`：

```javascript
// 修改为您的实际仓库
const GITHUB_REPO = 'your-username/cashGiftBook';
```

### 2. 版本号规范

遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号**：不兼容的 API 修改（1.0.0 → 2.0.0）
- **次版本号**：向下兼容的功能性新增（1.0.0 → 1.1.0）
- **修订号**：向下兼容的问题修正（1.0.0 → 1.0.1）

示例：
- `1.0.0` - 初始版本
- `1.0.1` - Bug 修复
- `1.1.0` - 新功能
- `2.0.0` - 重大更新

### 3. 强制更新

如果需要强制所有用户更新，修改 `src/utils/version.js`：

```javascript
return {
  hasUpdate,
  currentVersion: CURRENT_VERSION,
  latestVersion,
  forceUpdate: true,  // 改为 true
  changelog
};
```

---

## 🐛 常见问题

### Q1: 用户收不到更新提示？

**原因：**
- PWA Service Worker 未正确注册
- 浏览器不支持 Service Worker
- 使用的是 `file://` 协议

**解决：**
- 确保通过 HTTPS 或 localhost 访问
- 检查浏览器控制台是否有错误
- 清除浏览器缓存后重试

### Q2: 版本号没有更新？

**原因：**
- `package.json` 的 version 没有修改
- 构建时没有注入版本号

**解决：**
```bash
# 重新构建
npm run build

# 检查生成的文件是否包含正确版本号
grep -r "1.1.0" dist/
```

### Q3: GitHub API 请求失败？

**原因：**
- 网络问题
- API 速率限制（每小时 60 次匿名请求）

**解决：**
- 检查网络连接
- 考虑使用 GitHub Token（可选）
- 添加错误处理和降级策略

### Q4: 如何回滚版本？

**步骤：**
```bash
# 1. 删除错误的 Tag
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0

# 2. 回滚代码
git revert HEAD

# 3. 创建新的 Release
git tag -a "v1.1.1" -m "Rollback to stable version"
git push origin main
git push origin v1.1.1

# 4. 创建新的 Release
```

---

## 📊 监控和统计

### 查看 Release 列表

访问：https://github.com/你的用户名/cashGiftBook/releases

### 查看下载统计

GitHub 不提供直接的下载统计，可以：
1. 使用第三方工具（如 `gh-download-count`）
2. 集成 Google Analytics
3. 添加自定义统计代码

---

## 🎯 最佳实践

### 1. 定期发布

- 小更新：每周或每两周
- 大版本：每月或每季度

### 2. 详细的更新日志

```markdown
## 🎉 新功能
- ✨ 添加了 xxx 功能
- ✨ 支持 yyy 操作

## 🐛 Bug 修复
- 🐞 修复了 zzz 问题
- 🐞 解决了 aaa 错误

## ⚡ 性能优化
- 🚀 提升了加载速度 30%
- 🚀 优化了内存使用

## 📝 其他
- 📚 更新了文档
- 🔧 改进了开发体验
```

### 3. 测试后再发布

```bash
# 1. 本地测试
npm run dev

# 2. 构建测试
npm run build
npx serve dist

# 3. 确认无误后发布
scripts/release.bat 1.1.0 "更新说明"
```

### 4. 备份重要数据

发布前提醒用户备份数据（虽然数据在本地 IndexedDB 中）。

---

## 🚀 快速开始

### 首次发布

```bash
# 1. 设置仓库信息
# 编辑 src/utils/version.js，修改 GITHUB_REPO

# 2. 设置初始版本
npm version 1.0.0 --no-git-tag-version

# 3. 提交代码
git add .
git commit -m "Initial release v1.0.0"
git push origin main

# 4. 创建 Tag
git tag -a "v1.0.0" -m "Initial release"
git push origin v1.0.0

# 5. 创建 GitHub Release（网页操作）
# 访问 https://github.com/你的用户名/cashGiftBook/releases/new
```

### 后续发布

```bash
# 一行命令搞定
scripts/release.bat 1.1.0 "修复了PWA更新问题"
```

---

## 📚 相关文档

- [PWA 更新机制](./LOCAL_RUN_GUIDE.md)
- [部署指南](./DEPLOYMENT.md)
- [移动端使用指南](./MOBILE_USAGE.md)

---

## ✨ 总结

通过 GitHub Releases + GitHub Pages + PWA，我们实现了：

- ✅ **无后端版本管理**：完全基于 GitHub
- ✅ **自动化部署**：推送即部署
- ✅ **智能更新提示**：PWA 自动检测
- ✅ **用户友好**：一键更新，无需手动刷新

现在您可以专注于开发，版本管理和发布变得如此简单！🎉
