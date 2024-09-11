require('dotenv').config();
const { Client } = require('@notionhq/client');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const databaseId = process.env.NOTION_DATABASE_ID;
const channelId = process.env.TELEGRAM_CHANNEL_ID;

// 添加调试函数
async function debugConnections() {
  console.log('开始调试连接...');

  // 测试Notion连接
  try {
    const response = await notion.databases.retrieve({ database_id: databaseId });
    console.log('Notion连接成功。数据库名称:', response.title[0].plain_text);
  } catch (error) {
    console.error('Notion连接失败:', error.message);
  }

  // 测试Telegram消息发送
  try {
    const testMessage = await bot.sendMessage(channelId, '这是一条测试消息。如果你看到这条消息,说明Telegram bot配置正确。');
    console.log('Telegram消息发送成功。消息ID:', testMessage.message_id);
  } catch (error) {
    console.error('Telegram消息发送失败:', error.message);
  }
}

// 检查更新函数
let lastCheckedTime = new Date(0).toISOString(); // 将初始时间设置为很久以前

async function checkForUpdates() {
  console.log(`开始检查更新，当前时间: ${new Date().toISOString()}`);
  console.log(`上次检查时间: ${lastCheckedTime}`);

  try {
    let hasMore = true;
    let startCursor = undefined;
    const allResults = [];

    while (hasMore) {
      const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
          or: [
            {
              timestamp: 'created_time',
              created_time: {
                after: lastCheckedTime
              }
            },
            {
              timestamp: 'last_edited_time',
              last_edited_time: {
                after: lastCheckedTime
              }
            }
          ]
        },
        sorts: [
          {
            timestamp: 'created_time',
            direction: 'descending'
          }
        ],
        start_cursor: startCursor,
        page_size: 100
      });

      allResults.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    console.log(`查询结果数量: ${allResults.length}`);

    if (allResults.length > 0) {
      const updates = await Promise.all(allResults.map(async page => {
        console.log(`处理页面: ${page.id}`);
        console.log(`页面创建时间: ${page.created_time}`);
        console.log(`页面最后编辑时间: ${page.last_edited_time}`);
        
        const pageTitle = page.properties.Name?.title[0]?.plain_text || '无标题';
        const lastEditedBy = page.last_edited_by?.name || '未知用户';

        let updateMessage = `【${lastEditedBy}】`;
        if (new Date(page.created_time) > new Date(lastCheckedTime)) {
          updateMessage += `新增了【${pageTitle}】`;
        } else {
          updateMessage += `更新了【${pageTitle}】`;
        }

        return updateMessage;
      }));

      const filteredUpdates = updates.filter(update => update !== '');
      if (filteredUpdates.length > 0) {
        const message = filteredUpdates.join('\n\n');
        await bot.sendMessage(channelId, message);
        
        console.log(`发送到Telegram的消息 (${new Date().toISOString()}):`);
        console.log(message);
      } else {
        console.log('没有需要发送的更新');
      }
    } else {
      console.log('没有检测到新的更新');
    }
  } catch (error) {
    console.error('检查更新时发生错误:', error);
    console.error('错误堆栈:', error.stack);
    if (error.body) {
      console.error('API错误详情:', error.body);
    }
  }

  lastCheckedTime = new Date().toISOString();
  console.log('------------------------');
}

// 在程序启动时运行调试函数
debugConnections().then(() => {
  console.log('调试完成,开始正常运行...');
  
  // 在程序启动时立即执行一次检查
  checkForUpdates();

  // 然后每30秒执行一次
  cron.schedule('*/60 * * * * *', async () => {
    await checkForUpdates();
  });

  console.log('Bot is running...');
}).catch(error => {
  console.error('调试过程中发生错误:', error);
});