#!/bin/bash

# GitHub Release 发布脚本
# 用法: ./release.sh [版本号] [更新说明]
# 示例: ./release.sh 1.1.0 "修复了PWA更新问题"

set -e

# 检查参数
if [ -z "$1" ]; then
    echo "❌ 请提供版本号"
    echo "用法: ./release.sh [版本号] [更新说明]"
    echo "示例: ./release.sh 1.1.0 \"修复了PWA更新问题\""
    exit 1
fi

VERSION=$1
CHANGELOG=${2:-"版本更新"}

echo "🚀 开始发布新版本 v$VERSION"
echo "📝 更新说明: $CHANGELOG"

# 1. 更新 package.json 版本号
echo "📦 更新 package.json 版本号..."
npm version $VERSION --no-git-tag-version

# 2. 提交更改
echo "💾 提交更改..."
git add package.json
git commit -m "chore: release v$VERSION"

# 3. 创建 Git Tag
echo "🏷️  创建 Git Tag v$VERSION..."
git tag -a "v$VERSION" -m "Release v$VERSION"

# 4. 推送到 GitHub
echo "📤 推送到 GitHub..."
git push origin main
git push origin "v$VERSION"

# 5. 创建 GitHub Release
echo "🎉 创建 GitHub Release..."
gh release create "v$VERSION" \
    --title "v$VERSION" \
    --notes "$CHANGELOG" \
    --generate-notes

echo "✅ 发布完成！"
echo "🌐 访问 https://github.com/$(git remote get-url origin | sed -n 's/.*github.com[:\/]\(.*\)\.git/\1/p')/releases/tag/v$VERSION 查看发布"
echo ""
echo "⏳ GitHub Pages 将在 1-2 分钟内自动部署新版本"
echo "📱 用户将在下次打开应用时收到更新提示"
