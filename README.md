# Notion to Telegram 通知机器人

## 项目描述

这是一个基于 Node.js 的项目，集成了 Notion API 和 Telegram Bot API。该项目主要功能是监控指定的 Notion 数据库中的任务状态变更和内容更新，并将这些更新实时发送到指定的 Telegram 频道。
该项目主要为 Uncommons 编辑部的 Worklog 服务， 具备一定的定制性， 仅供参考。

Uncommons is a public sphere where a collective of public goods builders explores crypto thoughts together.
Uncommons 是区块链世界内一隅公共空间，一群公共物品建设者，在此碰撞加密人文思想。其前身为 GreenPill 中文社区。

Uncommons Telegram 频道：https://t.me/theuncommons

## 主要功能

1. 监控 Notion 数据库中的任务状态变更（进行中、已完成）
2. 检测 Notion 数据库中的任务内容更新
3. 实时将任务状态和内容更新发送到 Telegram 频道
4. 定期检查更新（任务状态每60秒，内容更新每15分钟）

## 技术栈

- Node.js
- @notionhq/client：Notion API 客户端
- node-telegram-bot-api：Telegram Bot API 客户端
- node-cron：定时任务调度
- dotenv：环境变量管理

## 文件结构

- `index.js`：主程序文件，包含所有核心功能
- `.env`：环境变量配置文件
- `.gitignore`：Git 忽略文件配置
- `README.md`：项目说明文档

## 安装

1. 克隆仓库：
   ```
   git clone [仓库URL]
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 配置环境变量：
   创建 `.env` 文件，并填写以下必要的环境变量：
   ```
   NOTION_API_KEY=你的Notion API密钥
   NOTION_DATABASE_ID=你的Notion数据库ID
   TELEGRAM_BOT_TOKEN=你的Telegram机器人令牌
   TELEGRAM_CHANNEL_ID=目标Telegram频道ID
   ```


## 许可

本项目采用 MIT 许可证。详细信息请参阅 [LICENSE](LICENSE) 文件。

## 免责声明

本项目仅供学习和参考使用。使用者应自行承担使用本项目可能带来的风险。作者不对因使用本项目而可能产生的任何损失或损害承担责任。

## 贡献

欢迎对本项目进行贡献！如果您有任何改进建议或发现了bug，请提交issue或pull request。

## 联系方式

如有任何问题或建议，请通过以下方式联系我：

- 电子邮件：[jisongniu@gmail.com]
- Telegram：[https://t.me/BigSongEth]

感谢您对本项目的关注和支持！

