# 📋 版本发布快速参考

## 🚀 发布新版本（3 步完成）

### Windows 用户

```bash
scripts\release.bat 1.1.0 "修复了PWA更新问题"
```

### Mac/Linux 用户

```bash
./scripts/release.sh 1.1.0 "修复了PWA更新问题"
```

---

## 📝 手动发布步骤

```bash
# 1. 更新版本号
npm version 1.1.0 --no-git-tag-version

# 2. 提交代码
git add .
git commit -m "chore: release v1.1.0"
git push origin main

# 3. 创建 Tag
git tag -a "v1.1.0" -m "Release v1.1.0"
git push origin v1.1.0

# 4. 创建 GitHub Release（网页操作）
# https://github.com/你的用户名/cashGiftBook/releases/new
```

---

## ⏱️ 时间线

- **T+0s**：推送代码
- **T+30s**：开始构建
- **T+90s**：部署完成
- **T+120s**：用户收到更新提示

---

## 🔧 重要配置

### 修改仓库信息

编辑 `package.json`，找到 `repository` 字段：

```json
{
  "repository": {
    "url": "https://github.com/your-username/cashGiftBook.git"
  }
}
```

将 `your-username` 替换为您的 GitHub 用户名。

**验证：**
```bash
npm run build
# 查看输出：GitHub Repo: username/cashGiftBook
```

### 版本号规范

- `1.0.0` → `1.0.1`：Bug 修复
- `1.0.0` → `1.1.0`：新功能
- `1.0.0` → `2.0.0`：重大更新

---

## 🐛 故障排查

### 用户收不到更新？

- ✅ 确保通过 HTTPS 访问
- ✅ 检查浏览器控制台错误
- ✅ 清除浏览器缓存

### 版本号没更新？

```bash
npm run build
grep -r "版本号" dist/
```

### 需要回滚？

```bash
git tag -d v1.1.0
git push origin :refs/tags/v1.1.0
git revert HEAD
```

---

## 📚 详细文档

查看 [RELEASE_GUIDE.md](./RELEASE_GUIDE.md) 获取完整指南。
