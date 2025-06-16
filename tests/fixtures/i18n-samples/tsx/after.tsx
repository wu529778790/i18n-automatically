import i18n from '@/i18n';
import React, { useState, useEffect, useCallback } from 'react';

// 用户角色枚举
enum UserRole {
  ADMIN = i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-1'),
  USER = i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-2'),
  GUEST = i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-3'),
}

// 用户接口
interface User {
  id: number;
  name: string;
  email: string;
  roleTest: '管理员' | '普通用户' | '访客';
  role: UserRole;
  description?: string; // 可选的用户描述
}

// 组件属性接口
interface Props {
  initialUsers: User[];
  companyName: string; // 新增：公司名称属性
}

// 错误信息对象
const ERROR_MESSAGES = {
  EMPTY_FIELDS: i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-7'),
  INVALID_EMAIL: i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-8'),
  USER_EXISTS: i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-9'),
};

// 用户管理组件
const UserManagement: React.FC<Props> = ({ initialUsers, companyName }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: UserRole.GUEST,
    description: i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-10'), // 默认描述
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 设置页面标题
  useEffect(() => {
    document.title = `${companyName}${i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-11')}`;
  }, [companyName]);

  // 添加用户
  const addUser = useCallback(() => {
    if (!newUser.name || !newUser.email) {
      setError(ERROR_MESSAGES.EMPTY_FIELDS);
      return;
    }

    if (!validateEmail(newUser.email)) {
      setError(ERROR_MESSAGES.INVALID_EMAIL);
      return;
    }

    if (users.some((user) => user.email === newUser.email)) {
      setError(ERROR_MESSAGES.USER_EXISTS);
      return;
    }

    setUsers((prevUsers) => [
      ...prevUsers,
      { ...newUser, id: prevUsers.length + 1 },
    ]);
    setNewUser({
      name: '',
      email: '',
      role: UserRole.GUEST,
      description: i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-12'),
    });
    setError(null);
    setSuccessMessage(
      `${i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-13')}${newUser.name}${i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-14')}`,
    );

    // 3秒后清除成功消息
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [newUser, users]);

  // 删除用户
  const deleteUser = useCallback((id: number) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter((user) => user.id !== id);
      if (updatedUsers.length < prevUsers.length) {
        setSuccessMessage(
          `${i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-15')}`,
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      return updatedUsers;
    });
  }, []);

  // 验证邮箱
  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  // 获取用户角色的中文描述
  const getRoleDescription = (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-16');
      case UserRole.USER:
        return i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-17');
      case UserRole.GUEST:
        return i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-18');
      default:
        return i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-19');
    }
  };

  // 渲染用户列表
  const renderUserList = () => {
    if (users.length === 0) {
      return (
        <p className="no-data">
          {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-20')}
        </p>
      );
    }

    return (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-21')}</th>
            <th>{i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-22')}</th>
            <th>{i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-23')}</th>
            <th>{i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-24')}</th>
            <th>{i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-25')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.description || getRoleDescription(user.role)}</td>
              <td>
                <button onClick={() => deleteUser(user.id)}>
                  {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-26')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="user-management">
      <h1>{`${companyName}${i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-27')}`}</h1>
      <div className="user-form">
        <input
          type="text"
          placeholder={i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-28')}
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />

        <input
          type="email"
          placeholder={i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-29')}
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />

        <select
          value={newUser.role}
          onChange={(e) =>
            setNewUser({ ...newUser, role: e.target.value as UserRole })
          }
        >
          <option value={UserRole.GUEST}>
            {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-30')}
          </option>
          <option value={UserRole.USER}>
            {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-31')}
          </option>
          <option value={UserRole.ADMIN}>
            {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-32')}
          </option>
        </select>
        <input
          type="text"
          placeholder={i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-33')}
          value={newUser.description}
          onChange={(e) =>
            setNewUser({ ...newUser, description: e.target.value })
          }
        />

        <button onClick={addUser}>
          {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-34')}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      {renderUserList()}
      <footer>
        <p>
          {i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-35')}
          {users.length}
        </p>
        <p>{`© ${new Date().getFullYear()} ${companyName}${i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-36')}`}</p>
      </footer>
    </div>
  );
};

// 默认属性
UserManagement.defaultProps = {
  companyName: i18n.t('demoTest-test-tsx-before-1929975eba0a6e4a0-37'),
};

export default UserManagement;

// 注释示例
/*
 * 这是一个用户管理组件，用于管理系统中的用户。
 * 它支持添加、删除和显示用户信息。
 *
 * 待办事项:
 * 1. 添加用户编辑功能
 * 2. 实现用户搜索
 * 3. 添加用户权限管理
 * 4. 优化性能，考虑使用虚拟滚动来处理大量用户数据
 */
