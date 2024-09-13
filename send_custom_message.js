require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHANNEL_ID;
const TOPIC_ID = process.env.TELEGRAM_TOPIC_ID;

console.log('环境变量:', { BOT_TOKEN: BOT_TOKEN ? '已设置' : '未设置', CHAT_ID, TOPIC_ID });

if (!BOT_TOKEN || !CHAT_ID) {
    console.error('错误: 请确保在 .env 文件中设置了 TELEGRAM_BOT_TOKEN 和 TELEGRAM_CHANNEL_ID');
    process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN);

function sendTelegramMessage(message) {
    console.log('准备发送消息:', message);
    const options = TOPIC_ID ? { message_thread_id: TOPIC_ID } : {};
    bot.sendMessage(CHAT_ID, message, options)
        .then(() => {
            console.log("消息发送成功！");
            process.exit(0);
        })
        .catch((error) => {
            console.error("发送消息时出错:", error);
            process.exit(1);
        });
}

if (process.argv.length > 2) {
    const message = process.argv.slice(2).join(' ');
    sendTelegramMessage(message);
} else {
    console.log("请输入要发送的消息:");
    process.stdin.once('data', (data) => {
        const message = data.toString().trim();
        if (message) {
            sendTelegramMessage(message);
        } else {
            console.log("没有输入消息，退出程序。");
            process.exit(0);
        }
    });
}
