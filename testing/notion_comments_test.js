require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// 使用您的数据库 ID
const databaseId = process.env.NOTION_DATABASE_ID;

async function queryDatabase(databaseId) {
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 5 // 只获取前5个页面
    });
    console.log('数据库查询结果:');
    console.log(JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('查询数据库时发生错误:', error.message);
  }
}

queryDatabase(databaseId);