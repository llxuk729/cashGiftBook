# ⚙️ PWA 版本更新配置清单

## 📋 发布前检查清单

在首次使用前，请完成以下配置：

### ✅ 1. 修改 GitHub 仓库信息

**文件：** `package.json`

找到 `repository` 字段，修改为您的实际仓库：

```json
{
  "name": "cashgiftbook",
  "version": "0.0.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/cashGiftBook.git"
  }
}
```

**将 `your-username` 替换为您的 GitHub 用户名。**

例如：
```json
{
  "repository": {
    "url": "https://github.com/zhangsan/cashGiftBook.git"
  }
}
```

**支持的 URL 格式：**
- ✅ `https://github.com/username/repo.git`（推荐）
- ✅ `https://github.com/username/repo`
- ✅ `git@github.com:username/repo.git`

**验证配置：**
```bash
npm run build
# 查看输出：GitHub Repo: username/cashGiftBook
```

---

### ✅ 2. 确认 package.json 版本号

**文件：** `package.json`

```json
{
  "name": "cashgiftbook",
  "version": "1.0.0",  // ← 确认这个版本号
  ...
}
```

**建议：**
- 首次发布使用 `1.0.0`
- 后续按语义化版本递增

---

### ✅ 3. 验证 Vite 配置

**文件：** `vite.config.js`

确认包含以下内容：

```javascript
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// 读取 package.json 获取版本号
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJson = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
const appVersion = packageJson.version

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion)  // ← 确认这行存在
  },
  // ... 其他配置
})
```

---

### ✅ 4. 测试构建

```bash
# 执行构建
npm run build

# 检查输出
# 应该看到类似：
# dist/index.html            1,353.73 kB
# dist/sw.js
# dist/workbox-xxxxx.js
```

**验证版本号已注入：**

```bash
# Windows (PowerShell)
Select-String -Path "dist/index.html" -Pattern "1.0.0"

# Mac/Linux
grep "1.0.0" dist/index.html
```

应该能找到版本号。

---

### ✅ 5. 测试本地运行

```bash
# 启动本地服务器
npx serve dist -p 8080

# 访问 http://localhost:8080
# 打开浏览器控制台，应该看到：
# "Service Worker 注册成功"
```

---

### ✅ 6. 准备首次发布

#### 步骤 1：设置初始版本

```bash
npm version 1.0.0 --no-git-tag-version
```

#### 步骤 2：提交代码

```bash
git add .
git commit -m "Initial release v1.0.0"
git push origin main
```

#### 步骤 3：创建 Tag

```bash
git tag -a "v1.0.0" -m "Initial release"
git push origin v1.0.0
```

#### 步骤 4：创建 GitHub Release

1. 访问：https://github.com/你的用户名/cashGiftBook/releases/new
2. 选择 Tag：`v1.0.0`
3. 标题：`v1.0.0`
4. 描述：
   ```markdown
   ## 🎉 初始版本
   
   - ✅ 礼金记账功能
   - ✅ 人物关系管理
   - ✅ 数据备份
   - ✅ PWA 支持
   ```
5. 点击 **"Publish release"**

---

## 🔍 验证清单

### 发布后验证

- [ ] GitHub Release 已创建
- [ ] GitHub Actions 构建成功
- [ ] GitHub Pages 已部署（访问网址确认）
- [ ] 可以正常打开应用
- [ ] 控制台无错误

### 版本检测验证

- [ ] 打开应用
- [ ] 进入设置页面
- [ ] 点击"检查更新"
- [ ] 应该显示"已是最新版本"（因为刚发布）

### 更新流程验证

1. 修改 `package.json` 版本号为 `1.0.1`
2. 重新构建并发布
3. 用户端应该能检测到新版本
4. 显示更新提示
5. 点击更新后能看到新版本

---

## 🐛 常见问题排查

### 问题 1：构建时找不到 __APP_VERSION__

**错误信息：**
```
__APP_VERSION__ is not defined
```

**解决方法：**
确认 `vite.config.js` 中有 `define` 配置：
```javascript
define: {
  __APP_VERSION__: JSON.stringify(appVersion)
}
```

---

### 问题 2：GitHub API 请求失败

**错误信息：**
```
无法获取版本信息
```

**可能原因：**
1. 仓库信息配置错误
2. 网络问题
3. GitHub API 速率限制

**解决方法：**
```javascript
// 检查仓库配置
console.log(GITHUB_REPO); // 应该是 "用户名/仓库名"

// 手动测试 API
fetch('https://api.github.com/repos/用户名/仓库名/releases/latest')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

### 问题 3：Service Worker 注册失败

**错误信息：**
```
Failed to register a ServiceWorker
```

**可能原因：**
1. 使用的是 `file://` 协议
2. 不是 HTTPS

**解决方法：**
- 使用本地服务器：`npx serve dist`
- 或使用 GitHub Pages（自动 HTTPS）

---

### 问题 4：版本号没有更新

**症状：**
发布新版本后，应用仍显示旧版本号

**检查步骤：**
```bash
# 1. 检查 package.json
cat package.json | grep version

# 2. 检查构建产物
grep -r "version" dist/index.html

# 3. 清除浏览器缓存
# Ctrl+Shift+Delete (Windows)
# Cmd+Shift+Delete (Mac)
```

---

## 📊 配置总结

| 配置项 | 文件 | 位置 | 说明 |
|--------|------|------|------|
| GitHub 仓库 | `src/utils/version.js` | 第 7 行 | 格式：用户名/仓库名 |
| 当前版本 | `package.json` | version 字段 | 语义化版本 |
| 版本注入 | `vite.config.js` | define 配置 | 自动从 package.json 读取 |
| PWA 模式 | `vite.config.js` | registerType | 设为 'prompt' |
| 缓存策略 | `vite.config.js` | handler | 设为 'NetworkFirst' |

---

## 🎯 快速开始模板

复制以下内容，替换为您的实际信息：

### 1. version.js

```javascript
// 修改这一行
const GITHUB_REPO = '你的用户名/cashGiftBook';
```

### 2. 发布命令

```bash
# Windows
scripts\release.bat 1.0.0 "初始版本发布"

# Mac/Linux
./scripts/release.sh 1.0.0 "初始版本发布"
```

### 3. GitHub Release 描述模板

```markdown
## 🎉 新功能
- ✨ 功能1
- ✨ 功能2

## 🐛 Bug 修复
- 🐞 修复了问题1
- 🐞 修复了问题2

## ⚡ 性能优化
- 🚀 优化1
- 🚀 优化2
```

---

## ✅ 最终检查

在首次发布前，确认：

- [ ] 已修改 `GITHUB_REPO` 配置
- [ ] `package.json` 版本号正确
- [ ] 本地构建成功
- [ ] 本地测试通过
- [ ] GitHub 仓库已创建
- [ ] GitHub Pages 已启用
- [ ] 准备好 Release 描述

全部完成后，就可以发布了！🚀

---

## 📚 相关文档

- [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) - 完整发布指南
- [PWA_UPDATE_SOLUTION.md](./PWA_UPDATE_SOLUTION.md) - 技术方案详解
- [RELEASE_QUICK_REF.md](./RELEASE_QUICK_REF.md) - 快速参考
