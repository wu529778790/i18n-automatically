// TypeScript文件示例 - 转换后
import { t } from '../i18n';

interface User {
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

class UserService {
  private users: User[] = [];

  addUser(user: User): void {
    if (!user.name) {
      throw new Error(t('username_required'));
    }
    if (!user.email) {
      throw new Error(t('email_required'));
    }
    this.users.push(user);
    console.log(t('user_added_success'));
  }

  deleteUser(email: string): boolean {
    const index = this.users.findIndex((u) => u.email === email);
    if (index === -1) {
      console.log(t('user_not_found'));
      return false;
    }
    this.users.splice(index, 1);
    console.log(t('user_deleted_success'));
    return true;
  }

  getUserStatus(email: string): string {
    const user = this.users.find((u) => u.email === email);
    if (!user) {
      return t('user_not_found');
    }
    return user.status === 'active' ? t('active_status') : t('inactive_status');
  }
}

export { UserService, User };
