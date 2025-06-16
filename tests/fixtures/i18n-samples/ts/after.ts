import i18n from '@/i18n'; // test.ts

import { translate } from './i18n-helper';
import { ApiClient } from './api-client';

// Type definitions
type UserRole = 'admin' | 'editor' | 'guest';

interface User {
  id: number;
  name: string;
  age: number;
  role: UserRole;
  lastLogin?: Date;
}

// Enum with Chinese keys (as requested to keep)
enum StatusCode {
  '成功' = 200,
  '未授权' = 401,
  '禁止访问' = 403,
  '未找到' = 404,
  '服务器错误' = 500,
}

// Constants with Chinese keys
const ErrorMessages = {
  用户未找到: 'User not found',
  无效凭证: 'Invalid credentials',
  操作未授权: 'Unauthorized operation',
  服务暂时不可用: 'Service temporarily unavailable',
};

// Class
class UserManager {
  private users: User[] = [];

  constructor(initialUsers: User[] = []) {
    this.users = initialUsers;
    console.log('用户管理系统已初始化'); // StringLiteral in console.log
  }

  addUser(user: User): void {
    this.users.push(user);
    console.log(`新用户 ${user.name} 已添加`); // Template literal in console.log
  }

  getUser(id: number): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  updateUser(id: number, updateInfo: Partial<User>): void {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updateInfo };
      console.log(`用户 ${id} 信息已更新`); // Template literal in console.log
    } else {
      console.error(translate(ErrorMessages.用户未找到));
    }
  }

  deleteUser(id: number): void {
    const index = this.users.findIndex((user) => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      console.log(`用户 ${id} 已删除`); // Template literal in console.log
    } else {
      console.error(translate(ErrorMessages.用户未找到));
    }
  }

  listAllUsers(): void {
    console.log('所有用户:'); // StringLiteral in console.log
    this.users.forEach((user) => {
      console.log(
        `ID: ${user.id}, 姓名: ${user.name}, 年龄: ${user.age}, 角色: ${user.role}`,
      ); // Template literal in console.log
    });
  }
}

// Generic function
function createAndLog<T>(item: T, logMessage: string): T {
  console.log(logMessage, item);
  return item;
}

// Async function
async function fetchRemoteUserData(userId: number): Promise<User> {
  const apiClient = new ApiClient('https://api.example.com');
  try {
    const response = await apiClient.get(`/users/${userId}`);
    if (response.status === StatusCode.成功) {
      return response.data as User;
    } else {
      throw new Error(`获取用户数据失败: ${response.statusText}`); // Template literal in Error message
    }
  } catch (error) {
    console.error('API调用错误:', error); // StringLiteral in console.error
    throw error;
  }
}

// Decorator
function logMethod(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`调用方法 ${propertyKey}，参数:`, args); // Template literal in console.log
    const result = originalMethod.apply(this, args);
    console.log(`方法 ${propertyKey} 执行完成，结果:`, result); // Template literal in console.log
    return result;
  };
  return descriptor;
}

// Class using decorator
class AdvancedUserManager extends UserManager {
  @logMethod
  performAdvancedOperation(operation: string): string {
    return `${i18n.t('demoTest-test-ts-before-19299188809a0b65e-6')}${operation}`; // Template literal
  }
}

// Usage example
const userSystem = new AdvancedUserManager([
  {
    id: 1,
    name: i18n.t('demoTest-test-ts-before-19299188809a0b65e-7'),
    age: 30,
    role: 'admin',
  },
  {
    id: 2,
    name: i18n.t('demoTest-test-ts-before-19299188809a0b65e-8'),
    age: 25,
    role: 'editor',
  },
]);

userSystem.listAllUsers();

const newUser = createAndLog<User>(
  {
    id: 3,
    name: i18n.t('demoTest-test-ts-before-19299188809a0b65e-9'),
    age: 28,
    role: 'guest',
  },
  i18n.t('demoTest-test-ts-before-19299188809a0b65e-10'),
  // StringLiteral
);

userSystem.addUser(newUser);

userSystem.performAdvancedOperation(
  i18n.t('demoTest-test-ts-before-19299188809a0b65e-11'),
); // StringLiteral as argument

// Async operation example
(async () => {
  try {
    const remoteUser = await fetchRemoteUserData(4);
    console.log('获取到远程用户数据:', remoteUser); // StringLiteral in console.log
    userSystem.addUser(remoteUser);
  } catch (error) {
    console.error('获取远程用户数据失败:', error); // StringLiteral in console.error
  }
})();

// Internationalization example
console.log(translate('欢迎使用用户管理系统')); // StringLiteral in translate function
console.log(
  translate('当前在线用户数: {count}', { count: userSystem['users'].length }),
); // Template literal in translate function

// Error handling with translated messages
try {
  throw new Error(ErrorMessages.操作未授权);
} catch (error) {
  console.error(translate('发生错误: {message}', { message: error.message })); // Template literal in translate function
}

// Date and time handling
const currentDate = new Date();
console.log(`当前日期和时间: ${currentDate.toLocaleString('zh-CN')}`); // Template literal with method call

// Array operations
const fruitList = [
  i18n.t('demoTest-test-ts-before-19299188809a0b65e-12'),
  i18n.t('demoTest-test-ts-before-19299188809a0b65e-13'),
  i18n.t('demoTest-test-ts-before-19299188809a0b65e-14'),
  i18n.t('demoTest-test-ts-before-19299188809a0b65e-15'),
]; // Array of StringLiterals
console.log('水果列表:', fruitList.join('、')); // StringLiteral and Chinese separator in join

// Object destructuring
const { name, age } = userSystem.getUser(1) || {};
console.log(`用户信息: 姓名 - ${name}, 年龄 - ${age}`); // Template literal

// String template
const welcomeMessage = `${i18n.t('demoTest-test-ts-before-19299188809a0b65e-16')}${name}${i18n.t('demoTest-test-ts-before-19299188809a0b65e-17')}${age}${i18n.t('demoTest-test-ts-before-19299188809a0b65e-18')}`; // Template literal
console.log(welcomeMessage);

export { UserManager, AdvancedUserManager, fetchRemoteUserData };
