# 礼金记账 💰

一款简单易用的移动端礼金记录工具，支持人物关系管理、分类统计、数据备份等功能。

## ✨ 特性

- 📱 **移动端优先**：专为手机优化的界面和交互
- 👨‍👩‍👧‍👦 **人物关系树**：从自己开始，层层构建家族关系网络
- 📊 **多维度查询**：按人物、分类、时间区间灵活查询
- 💾 **数据安全**：IndexedDB 本地存储 + JSON 备份导出
- 🔔 **备份提醒**：每周自动提醒备份数据
- 🔄 **版本更新**：支持在线检查和更新
- ☁️ **云同步预留**：为未来云同步功能预留接口
- 💰 **礼金分类**：结婚、周岁、考大学、祝寿等多种分类

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建完成后，`dist` 文件夹包含可直接运行的文件。

### 📦 发布新版本

本项目使用 **GitHub Releases** 进行版本管理，无需后端服务器：

```bash
# Windows
scripts\release.bat 1.1.0 "修复了PWA更新问题"

# Mac/Linux
./scripts/release.sh 1.1.0 "修复了PWA更新问题"
```

**⚠️ 首次使用前请配置：**

编辑 `package.json`，修改 `repository.url` 为您的 GitHub 仓库：

```json
{
  "repository": {
    "url": "https://github.com/您的用户名/cashGiftBook.git"
  }
}
```

详细指南：[RELEASE_GUIDE.md](./RELEASE_GUIDE.md) | [快速参考](./RELEASE_QUICK_REF.md) | [配置说明](./GITHUB_REPO_CONFIG.md)

### 🌐 部署到网络（推荐）

**⚠️ Vercel 国内访问问题：**
- Vercel 在中国大陆经常无法访问（DNS 污染）
- 不推荐用于面向国内用户的项目

**✅ 推荐方案：**

1. **GitHub Pages**（最推荐）
   - 国内访问相对稳定
   - 已配置自动部署工作流
   - 只需推送到 GitHub 并启用 Pages 功能
   - 详细指南：[DEPLOYMENT.md](./DEPLOYMENT.md)

2. **Cloudflare Pages**
   - 国内访问速度较快
   - 免费且稳定
   - 支持自动部署

3. **阿里云 OSS + CDN**
   - 国内访问速度最快
   - 需要备案域名
   - 适合企业级应用

查看完整部署指南：[DEPLOYMENT.md](./DEPLOYMENT.md)

### 📱 手机端使用

**方式一：直接打开（简单但有限制）**
- 将 `dist/index.html` 发送到手机
- 用手机浏览器打开
- ⚠️ 限制：无法添加到主屏幕，刷新可能出错

**方式二：本地服务器（推荐家庭使用）**
```bash
cd dist
python -m http.server 8080
```
手机访问：`http://电脑IP:8080`

**方式三：部署到网络（最佳体验）**
- 部署到 Netlify、GitHub Pages 等免费服务
- 获得 HTTPS 网址
- ✅ 可以添加到主屏幕，像 App 一样使用
- ✅ 刷新不会出错
- ✅ 完整的 PWA 功能

详细指南请查看：[MOBILE_USAGE.md](./MOBILE_USAGE.md)

### 预览生产版本

```bash
npm run preview
```

## 📁 项目结构

```
cashGiftBook/
├── src/
│   ├── components/          # 组件
│   │   └── PersonTreeNode.vue    # 人物树节点组件
│   ├── database/            # 数据库相关
│   │   ├── index.js              # 数据库初始化
│   │   ├── recordAPI.js          # 礼金记录 API
│   │   ├── personAPI.js          # 人物关系 API
│   │   ├── categoryAPI.js        # 分类和事件 API
│   │   └── backupAPI.js          # 备份恢复 API
│   ├── router/              # 路由配置
│   │   └── index.js
│   ├── utils/               # 工具函数
│   │   └── version.js            # 版本管理
│   ├── views/               # 页面视图
│   │   ├── Home.vue              # 首页
│   │   ├── AddRecord.vue         # 添加记录
│   │   ├── Persons.vue           # 人物关系
│   │   ├── Query.vue             # 查询统计
│   │   ├── Backup.vue            # 数据备份
│   │   └── Settings.vue          # 设置
│   ├── App.vue              # 主应用组件
│   ├── main.js              # 入口文件
│   └── style.css            # 全局样式
├── public/                  # 静态资源
│   └── favicon.svg
├── index.html               # HTML 模板
├── package.json
└── README.md
```

## 🛠️ 技术栈

- **框架**: Vue 3 (Composition API)
- **构建工具**: Vite
- **UI 组件**: Vant 4
- **路由**: Vue Router 4
- **数据库**: Dexie.js (IndexedDB 封装)
- **日期处理**: Day.js
- **触摸优化**: @vant/touch-emulator

## 📖 功能说明

### 1. 首页
- 显示收支统计概览
- 最近记录列表
- 快捷操作入口
- 备份提醒

### 2. 记一笔
- 选择类型（收入/支出）
- 输入金额
- 选择人物（从关系树中选择）
- 选择分类（结婚、周岁等）
- 选择日期
- 添加备注

### 3. 人物关系
- 树形结构展示家族关系
- 从"我"开始，逐层添加关系
- 支持编辑和删除
- 自定义关系名称

### 4. 查询统计
- 按人物筛选
- 按分类筛选
- 按时间区间筛选
- 实时统计结果
- 记录列表展示

### 5. 数据备份
- 导出 JSON 备份文件
- 导入 JSON 恢复数据
- 查看最后备份时间
- 云同步入口（敬请期待）

### 6. 设置
- 版本信息
- 检查更新
- 清空所有数据

## 💡 使用建议

### 数据安全
1. **定期备份**：系统会每周提醒备份，请及时导出
2. **多份存储**：建议将备份文件保存到多个位置（网盘、微信收藏等）
3. **重要操作前备份**：在大量修改数据前先备份

### 人物关系管理
1. 从"我"开始，逐步添加家人
2. 可以使用"自定义"关系来添加特殊关系
3. 关系路径会自动生成，方便识别

### 查询技巧
1. 可以组合多个筛选条件
2. 点击清除按钮可快速重置筛选
3. 统计数据会随筛选条件实时更新

## 🔮 未来规划

- [ ] 云同步功能
- [ ] 数据图表统计
- [ ] 导出 Excel 功能
- [ ] 微信小程序版本
- [ ] 多人协作账本
- [ ] 智能提醒功能

## 📝 注意事项

- 所有数据存储在浏览器本地，清除浏览器缓存会导致数据丢失
- 建议定期导出备份文件
- 不同浏览器的数据不互通
- 建议在常用设备上使用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

**Made with ❤️ for families**
