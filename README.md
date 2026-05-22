# CodeBeat — 编程关键词记忆节拍

帮助程序员记忆 Python 和 JavaScript 核心语法关键字的 Web 应用，基于 SM-2 间隔重复算法（艾宾浩斯遗忘曲线），搭配中英双语音频发音。

## 功能

- **间隔复习** — SM-2 算法调度卡片复习，自动调整间隔和难度
- **选择题练习** — 随机生成多选题，答对自动加入复习队列
- **关键字浏览** — 可搜索、可过滤的词库浏览器
- **语言对比** — Python vs JavaScript 等价概念对照表
- **音频发音** — 预录音频 + Web Speech API TTS 兜底
- **本地优先** — SQLite WebAssembly + IndexedDB，数据完全存在浏览器端，无需服务器
- **多用户** — 支持注册/登录，每个用户独立数据
- **暗色/亮色主题** — 跟随系统或手动切换

## 技术栈

- React 18 + React Router
- Vite 6
- Tailwind CSS v4
- sql.js (SQLite WebAssembly)
- Prism.js (代码高亮)
- Lucide React (图标)

## 快速开始

```bash
npm install
npm run dev
```

构建生产版本：

```bash
npm run build
npm run preview
```

## 项目结构

```
src/
  db.js           — 数据库层（SQLite WASM + IndexedDB 持久化 + 用户认证）
  srs.js          — SM-2 间隔重复算法
  audio.js        — 音频播放（MP3 + TTS 兜底）
  data/           — Python 和 JavaScript 关键字定义
  components/ui/  — 通用 UI 组件
  pages/          — 页面组件（Dashboard, Quiz, Review, Browse, Compare, Settings）
```
