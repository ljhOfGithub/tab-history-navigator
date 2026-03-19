# Tab History Navigator

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Extension-brightgreen)](https://chrome.google.com/webstore)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/yourusername/tab-history-navigator)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**像 VS Code 一样在标签页历史中前进后退** 🚀

Tab History Navigator 是一个强大的 Chrome 扩展，让你能够像在 VS Code 中浏览代码一样，在浏览器的标签页历史中自由导航。它记录每个标签页的完整访问历史（包括所有 URL 参数和片段），并提供直观的界面和快捷键操作。

## ✨ 特性

### 🎯 核心功能
- **完整 URL 记录** - 一字不差地记录地址栏的完整 URL，包括所有参数（`?a=1&b=2`）和片段（`#section1`）
- **每个标签页独立历史** - 为每个标签页维护独立的后退/前进栈
- **智能去重** - 避免记录重复的相同 URL
- **会话持久化** - 关闭浏览器后重新打开，历史记录依然存在

### ⌨️ 快捷键操作
| 操作 | Windows/Linux | Mac |
|------|---------------|-----|
| 后退 | `Ctrl+Shift+←` | `Command+Shift+←` |
| 前进 | `Ctrl+Shift+→` | `Command+Shift+→` |

### 🖱️ 多种操作方式
- **点击条目** - 在当前标签页打开
- **Ctrl/Command + 点击** - 在新后台标签页打开
- **右键点击** - 显示操作菜单
- **悬浮按钮** - 快速新标签页打开或复制 URL

### 📋 右键菜单功能
- 在新标签页打开
- 复制完整 URL
- 复制页面标题
- 从历史中移除

### 🎨 优雅的界面
- 现代化毛玻璃设计
- 彩色状态标识（当前/后退/前进）
- 时间显示（刚刚、分钟前、小时前等）
- 域名标签快速识别
- 动画效果和加载状态

## 📸 截图

![截图 1](screenshot_1280x800.png)
*主界面展示*

![截图 2](screenshot2_1280x800.png)
*右键菜单功能*

## 🔧 安装方法

### 从 Chrome 网上应用店安装（推荐）
1. 访问 [Chrome Web Store](#)（链接即将上线）
2. 点击"添加到 Chrome"
3. 确认安装

### 开发者模式安装
1. 下载或克隆本仓库
   ```bash
   git clone https://github.com/yourusername/tab-history-navigator.git
   ```
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

## 📖 使用指南

### 基本使用
1. **安装后立即生效** - 插件会自动开始记录你的浏览历史
2. **点击工具栏图标** - 打开历史导航面板
3. **使用快捷键** - 快速在历史中前进后退
4. **右键点击条目** - 访问更多操作

### 历史记录规则
- 每个标签页维护独立的历史栈
- 最多保存 50 条后退记录
- 新导航时会清空前栈
- 相同 URL 不会重复记录（只更新时间戳）

### 适用场景
- **研究型浏览** - 在多个相关页面间来回切换
- **表单填写** - 需要回退到之前填写的页面
- **调试开发** - 追踪 URL 参数变化
- **内容阅读** - 在多篇文章间导航

## 🏗️ 项目结构

```
tab-history-navigator/
├── manifest.json          # 插件配置文件
├── background.js          # 核心后台逻辑
├── popup/                 # 弹出窗口
│   ├── popup.html        # 界面结构
│   ├── popup.js          # 界面交互
│   └── popup.css         # 样式美化
└── icons/                 # 图标文件
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🛠️ 技术细节

### 完整 URL 记录机制
```javascript
// 使用浏览器原生 URL，保证一字不差
const fullUrl = tab.url;  // 包含所有参数和片段
```

### 历史数据结构
```javascript
{
  tabId: 123,
  backStack: [entry1, entry2],     // 后退历史
  forwardStack: [entry3, entry4],   // 前进历史
  currentEntry: {...}               // 当前页面
}
```

### 权限说明
- `tabs` - 访问标签页信息
- `storage` - 保存历史记录
- `sessions` - 会话管理
- `webNavigation` - 捕获 SPA 路由变化

## 🤝 贡献指南

欢迎贡献代码、报告问题或提出新功能建议！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

### 开发环境设置
```bash
# 克隆仓库
git clone https://github.com/yourusername/tab-history-navigator.git
cd tab-history-navigator

# 在 Chrome 中加载扩展
# 打开 chrome://extensions/
# 点击"加载已解压的扩展程序"
# 选择项目文件夹
```

## ❓ 常见问题

### Q: 历史记录会保存多久？
A: 历史记录会持久化保存，直到你主动清除。每个标签页最多保存 50 条后退记录。

### Q: 会影响浏览器性能吗？
A: 不会。插件经过优化，占用资源极少，只在标签页切换或导航时记录。

### Q: 支持隐私模式吗？
A: 支持，但在隐私模式下关闭窗口后历史记录会被清除。

### Q: 如何清除某个标签页的历史？
A: 打开插件弹出窗口，点击顶部的"清除"按钮，或右键点击条目选择"从历史中移除"。

## 📝 更新日志

### v1.0.0 (2024-03-19)
- 🎉 首次发布
- ✨ 完整 URL 记录功能
- ⌨️ 快捷键支持前进后退
- 🖱️ 右键菜单操作
- 🎨 现代化界面设计
- 💾 会话持久化存储

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👏 致谢

- 灵感来自 VS Code 的编辑历史导航
- 感谢所有贡献者和用户的支持

**Made with ♥️ for better browsing experience**