@echo off
REM GitHub Release 发布脚本 (Windows)
REM 用法: release.bat [版本号] [更新说明]
REM 示例: release.bat 1.1.0 "修复了PWA更新问题"

setlocal enabledelayedexpansion

REM 检查参数
if "%1"=="" (
    echo ❌ 请提供版本号
    echo 用法: release.bat [版本号] [更新说明]
    echo 示例: release.bat 1.1.0 "修复了PWA更新问题"
    exit /b 1
)

set VERSION=%1
set CHANGELOG=%2
if "!CHANGELOG!"=="" set CHANGELOG=版本更新

echo 🚀 开始发布新版本 v%VERSION%
echo 📝 更新说明: %CHANGELOG%

REM 1. 更新 package.json 版本号
echo 📦 更新 package.json 版本号...
call npm version %VERSION% --no-git-tag-version
if errorlevel 1 (
    echo ❌ 更新版本号失败
    exit /b 1
)

REM 2. 提交更改
echo 💾 提交更改...
git add package.json
git commit -m "chore: release v%VERSION%"
if errorlevel 1 (
    echo ❌ 提交失败
    exit /b 1
)

REM 3. 创建 Git Tag
echo 🏷️  创建 Git Tag v%VERSION%...
git tag -a "v%VERSION%" -m "Release v%VERSION%"
if errorlevel 1 (
    echo ❌ 创建 Tag 失败
    exit /b 1
)

REM 4. 推送到 GitHub
echo 📤 推送到 GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ 推送 main 分支失败
    exit /b 1
)

git push origin "v%VERSION%"
if errorlevel 1 (
    echo ❌ 推送 Tag 失败
    exit /b 1
)

REM 5. 提示创建 GitHub Release
echo.
echo 🎉 代码已推送！
echo.
echo 请手动创建 GitHub Release:
echo 1. 访问 https://github.com/你的用户名/cashGiftBook/releases/new
echo 2. 选择 Tag: v%VERSION%
echo 3. 填写发布说明: %CHANGELOG%
echo 4. 点击 "Publish release"
echo.
echo ⏳ GitHub Pages 将在 1-2 分钟内自动部署新版本
echo 📱 用户将在下次打开应用时收到更新提示
echo.

endlocal
