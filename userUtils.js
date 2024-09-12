require('dotenv').config();
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// 缓存用户信息以减少 API 调用
const userCache = new Map();

async function getUserName(userId) {
  // 如果用户信息已经在缓存中，直接返回
  if (userCache.has(userId)) {
    return userCache.get(userId);
  }

  try {
    const response = await notion.users.retrieve({ user_id: userId });
    const userName = response.name || '未知用户';
    
    // 将用户信息存入缓存
    userCache.set(userId, userName);
    
    return userName;
  } catch (error) {
    console.error(`获取用户 ${userId} 信息时出错:`, error);
    return '未知用户';
  }
}

module.exports = { getUserName };