require('dotenv').config();
const { Client } = require('@notionhq/client');

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function retrieveUserById() {
  try {
    const response = await notion.users.retrieve({
      user_id: "461a25f2-fec3-4ca0-9433-354339c27cc4"
    });
    const username = response.name;
    console.log('检索到的用户名:', username);
    return username; // 返回用户名
  } catch (error) {
    console.error('检索用户时出错:', error);
    throw error; // 抛出错误以便调用者处理
  }
}

// 调用函数并处理结果
retrieveUserById()
  .then(username => {
    console.log('用户名:', username);
  })
  .catch(error => {
    console.error('检索用户失败:', error);
  });

// 添加测试 API 连接的函数
async function testNotionAPI() {
  try {
    const response = await notion.users.me();
    console.log('API 连接成功:', response);
  } catch (error) {
    console.error('API 连接失败:', error);
  }
}

// 运行测试函数
testNotionAPI();