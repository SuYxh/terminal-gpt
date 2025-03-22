
# TerminalGPT

<div align="center">

在终端中使用 GPT，支持多个 LLM 引擎，提供丰富的插件功能。

[![NPM Version](https://img.shields.io/npm/v/terminalgpt.svg)](https://www.npmjs.com/package/terminalgpt)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

</div>

## ✨ 特性

- 🤖 支持多个 LLM 引擎
  - OpenAI (GPT-3.5/GPT-4)
  - Anthropic (Claude)
  - Google Gemini
  - Ollama (本地部署)
- 🔌 插件系统
  - 网页搜索
  - 文件操作
  - 更多插件持续开发中
- 🔒 API 密钥本地加密存储
- 📝 支持 Markdown 格式输出
- 💻 跨平台支持

## 🚀 快速开始

### 前置条件

使用 TerminalGPT 需要准备以下任一 LLM API 密钥：

- [OpenAI API Key](https://platform.openai.com/docs/api-reference/introduction)
- [Anthropic API Key](https://www.anthropic.com/)
- [Google Gemini API Key](https://gemini.google.com/)
- Ollama（本地部署无需 API 密钥）

### 安装

```bash
npm install -g terminalgpt
```

## 🎯 使用方法

### 基本命令

1. 启动聊天：
```bash
tgpt chat
```

2. 删除保存的 API 密钥：
```bash
tgpt delete
```

3. 使用 Markdown 格式显示回复：
```bash
tgpt chat --markdown
```

### 插件使用

在聊天时，可以使用以下插件：

- `@list` - 列出所有可用插件
- `@web` - 网页搜索
- `@file` - 文件操作
- `@exit` - 退出程序

使用插件示例：
```bash
@web 如何使用 Node.js 创建 HTTP 服务器
```

### 快捷键

- `Shift + Enter` - 完成消息输入
- `Ctrl + C` - 退出程序

## ⚙️ 配置

首次运行时，程序会提示选择：

1. LLM 引擎（OpenAI/Anthropic/Gemini/Ollama）
2. API 密钥（除 Ollama 外都需要）
3. 模型选择（根据选择的引擎提供不同选项）

配置信息将被加密存储在本地。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[ISC License](LICENSE)

## 🙏 致谢

- 原作者：[@jucasoliveira](https://github.com/jucasoliveira)
- 现维护者：[Warpy](https://github.com/warpy-ai)

---

> 获取更多开源项目，请访问 [warpy-ai](https://github.com/warpy-ai)
