# SnapFlomo Chrome 扩展

一个优雅的 Chrome 浏览器扩展，用于快速保存网页内容到 Flomo，支持 AI 智能总结和多主题切换。

## 主要功能

### 1. 内容采集
- 自动获取当前页面标题和 URL
- 支持手动输入文章摘要
- 支持添加个人感想
- 智能字数统计和限制
- AI 智能总结（支持智谱 AI 和 Deepseek）

### 2. 界面交互
- 弹窗模式和侧边栏模式双重支持
- 响应式布局设计
- 多主题切换（默认、圣诞、新年、蛇年）
- 实时字数统计
- 操作状态提示

### 3. 快捷键支持
- 打开插件：`Ctrl/Command + Shift + F`

### 4. 数据同步
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

## 使用配置

### Flomo 配置
1. 登录 Flomo 账号（需要会员）
2. 进入个人账号 -> 扩展中心 & API
3. 获取专属 Webhook URL
4. 在扩展设置中填入 URL

### AI 配置（可选）
支持两种 AI 服务：
- 智谱 AI（默认）
- Deepseek

需要在设置页面配置对应服务的 API Key。

## 技术特点

1. 模块化设计
- 采用服务工厂模式管理 AI 服务
- 主题管理器实现主题切换
- 统一的错误处理机制

2. 用户体验优化
- 实时字数统计和限制
- 多主题支持
- 快捷键支持
- 状态反馈提示

3. 安全性考虑
- API Key 安全存储
- 内容安全策略（CSP）配置
- 错误处理和用户提示

## 开发计划

- [ ] 支持自定义快捷键
- [ ] 添加内容模板功能
- [ ] 支持离线保存
- [ ] 添加历史记录功能
- [ ] 支持更多 AI 服务商
- [ ] 支持 Markdown 格式

## 许可证

MIT License