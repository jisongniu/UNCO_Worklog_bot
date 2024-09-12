require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function testConnection() {
  try {
    const response = await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID });
    console.log('成功连接到数据库:', response.title[0].plain_text);
  } catch (error) {
    console.error('连接失败:', error.message);
  }
}

testConnection();
这样培训