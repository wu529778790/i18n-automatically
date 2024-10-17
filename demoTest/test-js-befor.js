// 之前的测试文件内容保持不变

// test.js
// 这是一个用于测试中文国际化处理的 JavaScript 文件

// 导入模块（假设存在）
import { translate } from './i18n-helper';

// 常量和变量声明
const APP_NAME = '我的应用';
let userCount = 0;

/**
 * 用户类
 * @class
 */
class User {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  // 实例方法
  introduce() {
    console.log(`大家好，我叫${this.name}，今年${this.age}岁。`);
  }

  // 静态方法
  static getGreeting() {
    return '欢迎使用我们的系统！';
  }
}

// 箭头函数
const greet = (name) => `你好，${name}！`;

// 异步函数
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('网络请求失败');
    }
    return await response.json();
  } catch (error) {
    console.error('发生错误：', error.message);
  }
}

// 对象字面量
const config = {
  language: '中文',
  region: '中国',
  settings: {
    theme: '暗色',
    fontSize: '中',
  },
};

// 数组和数组方法
const fruits = ['苹果', '香蕉', '橙子', '葡萄'];
console.log('水果列表：', fruits.join('、'));

// 模板字符串和函数调用
function processUser(user) {
  const message = `处理用户：${user.name}，年龄：${user.age}`;
  console.log(message);

  if (user.age < 18) {
    return `抱歉，${user.name}还未成年，不能使用此服务。`;
  }

  return `欢迎，${user.name}！您已经成功注册。`;
}

// 条件语句和错误处理
function divide(a, b) {
  if (b === 0) {
    throw new Error('除数不能为零！');
  }
  return a / b;
}

try {
  console.log(divide(10, 2));
  console.log(divide(10, 0));
} catch (error) {
  console.error('计算错误：', error.message);
}

// 使用 Promise
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

delay(1000).then(() => {
  console.log('一秒钟过去了...');
});

// 立即调用的函数表达式 (IIFE)
(function () {
  console.log('这是一个自执行的匿名函数');
})();

// 导出
export { APP_NAME, User, greet, fetchData, config, processUser };

// userManagement.js

import { translate } from './i18n-helper';
import { ApiClient } from './api-client';

// 用户角色枚举
const UserRole = {
  ADMIN: '管理员',
  EDITOR: '编辑',
  VIEWER: '查看者',
};

// 模拟 API 客户端
const apiClient = new ApiClient('https://api.example.com');

/**
 * 用户管理类
 */
class UserManager {
  constructor() {
    this.users = [];
    console.log('用户管理系统初始化'); // StringLiteral in console.log
  }

  /**
   * 添加新用户
   * @param {Object} user - 用户信息
   */
  addUser(user) {
    this.users.push(user);
    console.log(`新用户 ${user.name} 已添加`); // Template literal in console.log
  }

  /**
   * 获取用户信息
   * @param {number} id - 用户ID
   * @returns {Object|undefined}
   */
  getUser(id) {
    return this.users.find((user) => user.id === id);
  }

  /**
   * 更新用户信息
   * @param {number} id - 用户ID
   * @param {Object} updateInfo - 更新的信息
   */
  updateUser(id, updateInfo) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updateInfo };
      console.log(`用户 ${id} 信息已更新`); // Template literal in console.log
    } else {
      console.error('用户未找到'); // StringLiteral in console.error
    }
  }

  /**
   * 删除用户
   * @param {number} id - 用户ID
   */
  deleteUser(id) {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      console.log(`用户 ${id} 已删除`); // Template literal in console.log
    } else {
      console.error('用户未找到'); // StringLiteral in console.error
    }
  }

  /**
   * 列出所有用户
   */
  listAllUsers() {
    console.log('所有用户:'); // StringLiteral in console.log
    this.users.forEach((user) => {
      console.log(`ID: ${user.id}, 姓名: ${user.name}, 角色: ${user.role}`); // Template literal in console.log
    });
  }
}

// 创建用户管理实例
const userManager = new UserManager();

// 添加测试用户
userManager.addUser({ id: 1, name: '张三', role: UserRole.ADMIN });
userManager.addUser({ id: 2, name: '李四', role: UserRole.EDITOR });

// 列出所有用户
userManager.listAllUsers();

// 模拟异步操作
async function fetchUserData(userId) {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    console.log(`获取到用户数据: ${JSON.stringify(response)}`); // Template literal in console.log
    return response;
  } catch (error) {
    console.error(`获取用户数据失败: ${error.message}`); // Template literal in console.error
    throw error;
  }
}

// 使用异步函数
fetchUserData(1)
  .then((userData) => {
    console.log(`用户名: ${userData.name}`); // Template literal in console.log
  })
  .catch((error) => {
    console.error('发生错误:', error); // StringLiteral in console.error
  });

// 条件语句中的字符串
function checkUserRole(user) {
  if (user.role === UserRole.ADMIN) {
    return '这是管理员账户';
  } else if (user.role === UserRole.EDITOR) {
    return '这是编辑账户';
  } else {
    return '这是普通账户';
  }
}

// 对象字面量中的字符串
const messages = {
  welcome: '欢迎使用用户管理系统',
  goodbye: '感谢使用，再见',
};

// 数组中的字符串
const chineseZodiac = [
  '鼠',
  '牛',
  '虎',
  '兔',
  '龙',
  '蛇',
  '马',
  '羊',
  '猴',
  '鸡',
  '狗',
  '猪',
];

// 正则表达式中的中文
const chineseNameRegex = /^[\u4e00-\u9fa5]{2,4}$/;

// 调试代码（在生产环境中应该被移除）
function debugUser(user) {
  console.log('--- 调试信息 ---');
  console.log(`用户ID: ${user.id}`);
  console.log(`用户名: ${user.name}`);
  console.log(`用户角色: ${user.role}`);
  console.log('--- 调试结束 ---');
}

// 注释中的中文
/*
 * 这是一个多行注释
 * 用来说明这段代码的作用
 * 注意：请勿在生产环境中调用 debugUser 函数
 */

// 使用模板字符串的复杂字符串
const userSummary = `
  用户总结:
  - 总用户数: ${userManager.users.length}
  - 管理员数: ${userManager.users.filter((u) => u.role === UserRole.ADMIN).length}
  - 编辑数: ${userManager.users.filter((u) => u.role === UserRole.EDITOR).length}
  - 查看者数: ${userManager.users.filter((u) => u.role === UserRole.VIEWER).length}
`;

console.log(userSummary);

// 导出模块
export { UserManager, UserRole, fetchUserData };
