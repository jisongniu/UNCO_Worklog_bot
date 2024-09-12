require('dotenv').config();
const { Client } = require('@notionhq/client');
const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const { getUserName } = require('./userUtils');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

const databaseId = process.env.NOTION_DATABASE_ID;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const topicId = process.env.TELEGRAM_TOPIC_ID; 

// 添加一个变量来跟踪是否是第一次运行
let isFirstRun = true;

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
    const testMessage = await bot.sendMessage(channelId, '我是Un小Log，刚眯了会儿觉，我又回来了～', {
      message_thread_id: topicId
    });
    console.log('Telegram消息发送成功。消息ID:', testMessage.message_id);
  } catch (error) {
    console.error('Telegram消息发送失败:', error.message);
  }
}

// 检查更新函数
let lastCheckedTime = new Date().toISOString(); // 初始化为当前时间
let lastUpdateCheckTime = new Date().toISOString(); // 初始化为当前时间

async function checkForTaskStatusUpdates() {
  const currentTime = new Date().toISOString();
  console.log(`🚀 开始检查任务更新，当前时间: ${currentTime}`);

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            and: [
              {
                property: 'Action',
                status: {
                  equals: '进行中'
                }
              },
              {
                property: '触发开始工作',
                date: {
                  on_or_after: lastCheckedTime
                }
              }
            ]
          },
          {
            and: [
              {
                property: 'Action',
                status: {
                  equals: '已完成'
                }
              },
              {
                property: '触发完成工作',
                date: {
                  on_or_after: lastCheckedTime
                }
              }
            ]
          }
        ]
      },
      page_size: 100
    });

    const allResults = response.results;
    //console.log(`检测到${allResults.length}个更新。`);

    if (allResults.length > 0) {
      for (const page of allResults) {
        const status = page.properties.Action?.status?.name;
        console.log(`页面 ${page.properties.Activity?.title[0]?.plain_text || '无标题'} 的 Action 状态: ${status}`);
        if (status === '进行中' || status === '已完成') {
          const message = formatTaskStatusMessage(page, status);
          try {
            await bot.sendMessage(channelId, message, { 
              parse_mode: 'HTML', 
              disable_web_page_preview: true,
              message_thread_id: topicId
            });
            console.log(`已发送更新到Telegram: ${page.properties.Activity?.title[0]?.plain_text || '无标题'}`);
          } catch (error) {
            console.error(`发送消息失败: ${error.message}`);
          }
        }
      }
    } else {
      console.log('没有检测到新的进行中或已完成的任务。');
    }
  } catch (error) {
    console.error('检查更新时发生错误:', error.message);
  }

  lastCheckedTime = currentTime;
  //console.log(`更新后的lastCheckedTime: ${lastCheckedTime}`);
  //console.log('------------------------');
}

// 添加这个辅助函数来格式化日期时间
function formatDateTime(dateTimeString) {
  if (!dateTimeString) {
    return '未知时间';
  }
  const date = new Date(dateTimeString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Shanghai'
  }).replace(/\//g, '-');
}

function formatTaskStatusMessage(page, status) {
  const activity = page.properties.Activity?.title
    .map(titlePart => titlePart.plain_text)
    .join('') || '无标题';
  const executor = page.properties.执行人?.people[0]?.name || '未分配';
  const startTime = formatDateTime(page.properties.触发开始工作?.date?.start || '未开始');
  const endTime = formatDateTime(page.properties.触发完成工作?.date?.start || '未完成');

  let message = '';
  if (status === '进行中') {
    message += '🚀 <b>【任务开始】</b>\n';
  } else if (status === '已完成') {
    message += '🎉 <b>【任务完成】</b>\n';
  }
  message += `📋 <b>活动</b>：${activity}\n`;
  message += `👤 <b>执行人</b>：${executor}\n`;
  message += `🕒 <b>开始时间</b>：${startTime}\n`;
  if (status === '已完成') {
    message += `✅ <b>完成时间</b>：${endTime}\n`;
  }
  if (status === '进行中') {
    message += `\n🔍 <a href="${page.url}">点开看能帮啥</a>`;
  } else {
    message += `\n🔍 <a href="${page.url}">Bravo！来瞅瞅</a>`;
  }

  return message;
}


// 在程序启动时运行调试函数
debugConnections().then(() => {
  console.log('调试完成,开始正常运行...');
  
  checkForTaskStatusUpdates();

  // 然后每60秒执行一次
  cron.schedule('*/60 * * * * *', async () => {
    await checkForTaskStatusUpdates();
  });

  console.log('Bot is running...');
}).catch(error => {
  console.error('调试过程中发生错误:', error);
});

async function checkForTaskContentUpdates() {
  const currentTime = new Date().toISOString();
  console.log(`📒 开始检查内容评论更新，当前时间: ${currentTime}`);

  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        timestamp: 'last_edited_time',
        last_edited_time: {
          after: lastUpdateCheckTime
        }
      },
      page_size: 100
    });

    const updatedPages = response.results;
    let propertyUpdates = 0;
    let contentUpdates = 0;
    let commentUpdates = 0;

    for (const page of updatedPages) {
      const pageId = page.id;
      const pageTitle = page.properties.Activity?.title
        .map(titlePart => titlePart.plain_text)
        .join('') || '无标题';
      const lastEditedTime = formatDateTime(page.last_edited_time);
      
      let hasContentUpdate = false;
      let hasNewComments = false;

      // 检查属性更新
      if (page.last_edited_time > lastUpdateCheckTime) {
        propertyUpdates++;
      }

      // 检查内容更新
      const pageContent = await getPageContent(pageId);
      if (pageContent.trim() !== '') {
        contentUpdates++;
        hasContentUpdate = true;
      }

      // 检查评论更新
      const comments = await notion.comments.list({ block_id: pageId });
      const newComments = comments.results.filter(comment => new Date(comment.created_time) > new Date(lastUpdateCheckTime));
      if (newComments.length > 0) {
        commentUpdates++;
        hasNewComments = true;
      }

      // 只在有内容更新或新评论时发送 Telegram 消息
      if (hasContentUpdate || hasNewComments) {
        let updateMessage = `📝 <b>任务更新</b>\n\n`;
        updateMessage += `🔖 <b>任务</b>：${pageTitle}\n`;
        updateMessage += `🕒 <b>更新时间</b>：${lastEditedTime}\n`;

        if (hasContentUpdate) {
          updateMessage += `\n📄 <b>内容变更</b>：\n${pageContent.substring(0, 200)}${pageContent.length > 200 ? '...' : ''}\n`;
        }

        if (hasNewComments) {
          updateMessage += `\n💬 <b>新评论</b>：${newComments.length}条\n`;
          for (const comment of newComments) {
            const commentAuthor = await getUserName(comment.created_by.id);
            const commentContent = comment.rich_text[0]?.plain_text || '空评论';
            const commentTime = formatDateTime(comment.created_time);
            updateMessage += `\n- <i>${commentAuthor}</i> (${commentTime}): ${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}`;
          }
        }

        updateMessage += `\n\n🔍 <a href="${page.url}">前排围观！</a>`;

        try {
          await bot.sendMessage(channelId, updateMessage, { 
            parse_mode: 'HTML', 
            disable_web_page_preview: true,
            message_thread_id: topicId
          });
          console.log(`已发送更新到Telegram: ${pageTitle}`);
        } catch (error) {
          console.error(`发送消息失败: ${error.message}`);
        }
      }
    }

    console.log(`检测到更新情况： - ${contentUpdates} 个页面有内容更新，${commentUpdates} 个页面有新评论`);

    if (updatedPages.length === 0) {
      console.log('没有检测到任何更新。');
    }
  } catch (error) {
    console.error('检查更新时发生错误:', error.message);
  }

  lastUpdateCheckTime = currentTime;
  console.log(`更新后的lastUpdateCheckTime: ${lastUpdateCheckTime}`);
  console.log('------------------------');
}

async function getPageContent(pageId) {
    try {
      const response = await notion.blocks.children.list({
        block_id: pageId,
        page_size: 50,
      });
  
      let content = '';
      for (const block of response.results) {
        if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
          content += block.paragraph.rich_text.map(text => text.plain_text).join('') + '\n';
        }
      }
      return content.trim();
    } catch (error) {
      console.error('获取页面内容时发生错误:', error.message);
      return '';
    }
  }

// 每15分钟执行一次内容更新检查
cron.schedule('*/15 * * * *', async () => {
  await checkForTaskContentUpdates();
});

console.log('Bot is running...');

setInterval(() => {
  console.clear();
  console.log('新的日志开始...');
}, 24 * 60 * 60 * 1000); // 每24小时清理一次
