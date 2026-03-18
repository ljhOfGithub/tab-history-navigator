# Tab History Navigator 🧭

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()

> 像 VS Code 一样在 Chrome 标签页历史中前进后退！记录标签页切换轨迹，支持快捷键、右键菜单和现代化界面。

## ✨ 功能特性

### 🎯 核心导航
- **历史记录**：自动记录每个标签页的访问历史（类似 VS Code 的光标历史）
- **后退/前进**：通过快捷键或按钮在历史中导航
- **智能去重**：自动过滤同一页面的重复记录（如锚点跳转）

### ⌨️ 快捷键操作
| 操作 | Windows/Linux | macOS |
|------|---------------|-------|
| 后退 | `Ctrl+Shift+←` | `Command+Shift+←` |
| 前进 | `Ctrl+Shift+→` | `Command+Shift+→` |

### 🖱️ 交互体验
- **Command/Ctrl + 点击**：在新标签页打开历史记录（不激活）
- **右键菜单**：复制 URL/标题、在新标签页打开、从历史中移除
- **分组显示**：清晰区分后退历史、当前页面、前进历史
- **时间标记**：显示“刚刚”、“X分钟前”等相对时间

### 🎨 现代化界面
- 毛玻璃效果工具栏
- 悬浮动画和阴影过渡
- 彩色状态标识（当前/后退/前进）
- 优雅的右键菜单和提示反馈
- 深色模式适配（跟随系统）

## 📦 安装方法

### 方法一：从源码安装（开发模式）
1. 克隆仓库到本地
   ```bash
   git clone https://github.com/ljhOfGithub/tab-history-navigator.git