// TypeScript文件示例 - 转换前
interface User {
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    if (!user.name) {
      throw new Error('用户名不能为空');
    }
    if (!user.email) {
      throw new Error('邮箱地址不能为空');
    }
    this.users.push(user);
    console.log('用户添加成功');
  }

  deleteUser(email: string): boolean {
    const index = this.users.findIndex((u) => u.email === email);
    if (index === -1) {
      console.log('用户不存在');
      return false;
    }
    this.users.splice(index, 1);
    console.log('用户删除成功');
    return true;
  }

  getUserStatus(email: string): string {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      return '用户不存在';
    }
    return user.status === 'active' ? '活跃状态' : '非活跃状态';
  }
}

export { UserService, User };
