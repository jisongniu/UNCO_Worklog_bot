require('dotenv').config();
const { Client } = require('@notionhq/client');

console.log('NOTION_API_KEY:', process.env.NOTION_API_KEY);

// 初始化 Notion 客户端
const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function findPageWithComments() {
  try {
    // 搜索所有页面
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'page'
      }
    });

    // 遍历搜索结果
    for (const page of response.results) {
      // 获取页面评论
      const comments = await notion.comments.list({
        block_id: page.id,
      });

      // 如果页面有评论，返回页面信息和评论
      if (comments.results.length > 0) {
        // 获取页面详细信息
        const pageInfo = await notion.pages.retrieve({ page_id: page.id });

        // 获取页面内容
        const pageContent = await notion.blocks.children.list({
          block_id: page.id,
        });

        return {
          pageInfo,
          pageContent,
          comments: comments.results
        };
      }
    }

    console.log('没有找到带有评论的页面');
    return null;

  } catch (error) {
    console.error('错误:', error);
  }
}

// 运行函数并输出结果
findPageWithComments().then(result => {
  if (result) {
    console.log('找到的页面信息:', JSON.stringify(result, null, 2));
  }
});

async function testNotionAPI() {
  try {
    const response = await notion.users.me();
    console.log('API 连接成功:', response);
  } catch (error) {
    console.error('API 连接失败:', error);
  }
}

testNotionAPI();

