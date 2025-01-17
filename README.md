# Flomo Quick Save Chrome Extension

一个用于快速保存网页内容到 Flomo 的 Chrome 浏览器扩展。

## 功能特点

### 1. 内容采集
- 自动获取当前页面标题和URL
- 支持手动输入文章摘要
- 支持添加个人感想
- 字数限制和实时统计（参考 popup.js，startLine: 81, endLine: 93）

### 2. 快捷键支持
- 打开插件：`Ctrl/Command + Shift + F`
- 提交内容：`Ctrl/Command + Enter`
- 清空内容：`Ctrl/Command + Shift + X`

### 3. 数据同步
- 一键同步到 Flomo
- 支持自定义 API 接口
- 同步后自动清空输入框
- 操作结果实时反馈

## 安装说明

1. 下载源代码
2. 打开 Chrome 浏览器，进入扩展程序页面（chrome://extensions/）
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

## 使用说明

1. 点击浏览器工具栏中的插件图标或使用快捷键 `Ctrl/Command + Shift + F` 打开插件
2. 页面标题和链接会自动填充
3. 在"原文摘要"框中粘贴需要保存的内容
4. 在"个人感想"框中添加你的想法
5. 点击"提交到Flomo"按钮或使用快捷键 `Ctrl/Command + Enter` 保存

## 项目结构

project-root/
├── manifest.json # 插件配置文件
├── popup/ # 弹出窗口相关文件
│ ├── popup.html # 弹出窗口HTML
│ ├── popup.css # 弹出窗口样式
│ └── popup.js # 弹出窗口逻辑
├── content/ # 内容脚本
│ ├── content.js # 页面交互脚本
│ └── content.css # 页面样式
└── icons/ # 插件图标
├── icon16.png
├── icon48.png
└── icon128.png

## 技术实现

### 核心功能
- 使用 Chrome Extension API 获取当前页面信息（参考 popup.js，startLine: 4, endLine: 8）
- 实现快捷键支持（参考 popup.js，startLine: 59, endLine: 77）
- 通过 Fetch API 与 Flomo 服务器通信（参考 popup.js，startLine: 35, endLine: 56）

### UI 组件
- 响应式布局设计
- 实时字数统计
- 操作状态提示
- 快捷键提示

## 配置说明

在使用前需要配置 Flomo API 地址：
1. 打开 `popup.js`
2. 修改 `FLOMO_API` 常量为你的 API 地址

## 注意事项

1. 确保浏览器已启用必要的权限
2. API 地址请妥善保管，避免泄露
3. 建议定期备份重要数据

## 更新日志

### v1.0
- 初始版本发布
- 支持基本的内容保存功能
- 实现快捷键操作
- 添加字数统计功能

## 开发计划

- [ ] 支持自定义快捷键
- [ ] 添加内容模板功能
- [ ] 支持离线保存
- [ ] 添加历史记录功能

## 许可证

MIT License