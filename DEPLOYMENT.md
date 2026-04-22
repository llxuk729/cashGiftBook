# 部署指南

## 🚀 快速部署选项

### 选项 1：Vercel（推荐，最简单）

**优点**：
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 全球 CDN
- ✅ 一键部署
- ✅ 自动构建

**步骤**：
1. 将代码推送到 GitHub
2. 访问 https://vercel.com
3. 使用 GitHub 账号登录
4. 点击 "New Project"
5. 导入你的仓库
6. 点击 "Deploy"
7. 完成！获得类似 `https://cashgiftbook.vercel.app` 的域名

---

### 选项 2：Netlify

**优点**：
- ✅ 完全免费
- ✅ 拖拽部署支持
- ✅ 自定义域名

**步骤**：
1. 访问 https://netlify.com
2. 注册/登录
3. 拖拽 `dist` 文件夹到部署区域
   或连接 GitHub 仓库自动部署

---

### 选项 3：GitHub Pages

**优点**：
- ✅ 完全免费
- ✅ 与代码同仓库

**步骤**：
1. 安装 gh-pages：
```bash
npm install --save-dev gh-pages
```

2. 在 `package.json` 添加脚本：
```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. 修改 `vite.config.js`：
```javascript
export default defineConfig({
  base: '/cashGiftBook/', // 你的仓库名
  plugins: [vue()]
})
```

4. 部署：
```bash
npm run deploy
```

5. 访问：`https://你的用户名.github.io/cashGiftBook/`

---

### 选项 4：腾讯云 COS + CDN

**优点**：
- ✅ 国内访问速度快
- ✅ 成本低（每月几元）

**步骤**：
1. 构建项目：
```bash
npm run build
```

2. 登录腾讯云控制台
3. 创建 COS 存储桶
4. 上传 `dist` 目录所有文件
5. 开启静态网站托管
6. （可选）配置 CDN 加速

**成本**：约 ¥5-10/月

---

### 选项 5：阿里云 OSS + CDN

**优点**：
- ✅ 国内访问速度快
- ✅ 稳定性好

**步骤**：
1. 构建项目：
```bash
npm run build
```

2. 登录阿里云控制台
3. 创建 OSS Bucket
4. 开启静态页面托管
5. 上传 `dist` 目录
6. 配置 CDN（可选）

**成本**：约 ¥5-10/月

---

## 📱 微信环境优化

### 在微信中打开

由于是 H5 应用，可以直接在微信中打开链接使用：

1. 将部署后的链接发送到微信群
2. 用户点击即可使用
3. 可以"添加到桌面"（Android）
4. 可以"收藏"方便下次访问

### 进阶：升级为微信小程序

如果后续需要更好的微信体验，可以：

1. 使用 uni-app 重构（一套代码多端运行）
2. 或使用 Taro 框架
3. 或直接使用微信云开发

**优势**：
- 更好的微信集成
- 可以使用微信登录
- 可以分享到朋友圈
- 用户体验更佳

---

## 🔧 构建优化

### 减小打包体积

在 `vite.config.js` 中添加：

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router'],
          vant: ['vant'],
          dexie: ['dexie']
        }
      }
    }
  }
})
```

### 启用 Gzip 压缩

大多数托管平台自动启用 Gzip。如果需要手动配置：

```bash
npm install vite-plugin-compression
```

在 `vite.config.js` 中：

```javascript
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    vue(),
    compression()
  ]
})
```

---

## 🌐 自定义域名

### Vercel / Netlify
1. 在项目设置中找到 "Domains"
2. 添加你的域名
3. 按提示配置 DNS

### 腾讯云/阿里云
1. 购买域名
2. 在 CDN 配置中绑定域名
3. 配置 CNAME 记录

---

## 📊 性能监控（可选）

### 添加百度统计

在 `index.html` 的 `<head>` 中添加：

```html
<script>
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?YOUR_TOKEN";
  var s = document.getElementsByTagName("script")[0]; 
  s.parentNode.insertBefore(hm, s);
})();
</script>
```

---

## 🔒 HTTPS 配置

Vercel、Netlify、GitHub Pages 自动提供 HTTPS。

如果使用自己的服务器，需要使用 Let's Encrypt 等工具配置 SSL 证书。

---

## 📝 部署检查清单

部署前确认：

- [ ] 所有功能测试通过
- [ ] 构建了生产版本（`npm run build`）
- [ ] 测试了生产版本（`npm run preview`）
- [ ] 更新了版本号
- [ ] 准备好了 favicon
- [ ] 配置了正确的 meta 标签
- [ ] 测试了移动端显示效果
- [ ] 准备了备份说明文档

---

## 🎯 推荐方案

**对于你的场景（微信家族群推广）**：

### 最佳选择：Vercel
- 理由：
  - ✅ 完全免费
  - ✅ 配置简单
  - ✅ 全球 CDN（国内访问也很快）
  - ✅ 自动 HTTPS
  - ✅ 支持自定义域名

### 备选方案：腾讯云 COS
- 理由：
  - ✅ 国内访问速度最快
  - ✅ 成本极低（¥5-10/月）
  - ✅ 稳定可靠

---

## 💡 小贴士

1. **首次部署**：先用 Vercel 快速上线，验证需求
2. **用户增长后**：如果国内访问慢，再考虑迁移到腾讯云
3. **域名**：可以购买一个简短易记的域名
4. **二维码**：生成链接二维码，方便微信群分享
5. **说明文档**：准备一个简单的使用说明图片

---

## 🆘 遇到问题？

### 常见部署问题

**Q: 部署后页面空白？**
A: 检查浏览器控制台的错误信息，通常是路径配置问题

**Q: 路由刷新后 404？**
A: 需要在服务器配置将所有路由指向 index.html
   - Vercel/Netlify 自动处理
   - 其他平台需要配置重写规则

**Q: 资源加载失败？**
A: 检查 `vite.config.js` 中的 `base` 配置

**Q: 微信中无法打开？**
A: 确保使用 HTTPS，某些微信版本会拦截 HTTP 链接

---

祝你部署顺利！🎉
