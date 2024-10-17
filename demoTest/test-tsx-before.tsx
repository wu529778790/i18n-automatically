import React, { useState, useEffect, useCallback } from 'react';

// 用户角色枚举
enum UserRole {
  ADMIN = '管理员',
  USER = '普通用户',
  GUEST = '访客',
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
  EMPTY_FIELDS: '请填写所有必填字段',
  INVALID_EMAIL: '请输入有效的电子邮箱地址',
  USER_EXISTS: '该用户已存在',
};

// 用户管理组件
const UserManagement: React.FC<Props> = ({ initialUsers, companyName }) => {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [newUser, setNewUser] = useState<Omit<User, 'id'>>({
    name: '',
    email: '',
    role: UserRole.GUEST,
    description: '这是一个新用户', // 默认描述
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // 设置页面标题
  useEffect(() => {
    document.title = `${companyName} - 用户管理系统`;
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
      description: '这是一个新用户',
    });
    setError(null);
    setSuccessMessage(`用户 "${newUser.name}" 已成功添加`);

    // 3秒后清除成功消息
    setTimeout(() => setSuccessMessage(null), 3000);
  }, [newUser, users]);

  // 删除用户
  const deleteUser = useCallback((id: number) => {
    setUsers((prevUsers) => {
      const updatedUsers = prevUsers.filter((user) => user.id !== id);
      if (updatedUsers.length < prevUsers.length) {
        setSuccessMessage(`用户已成功删除`);
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
        return '具有所有权限';
      case UserRole.USER:
        return '具有基本操作权限';
      case UserRole.GUEST:
        return '仅具有查看权限';
      default:
        return '未知角色';
    }
  };

  // 渲染用户列表
  const renderUserList = () => {
    if (users.length === 0) {
      return <p className="no-data">暂无用户数据</p>;
    }

    return (
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>姓名</th>
            <th>电子邮箱</th>
            <th>角色</th>
            <th>描述</th>
            <th>操作</th>
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
                <button onClick={() => deleteUser(user.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="user-management">
      <h1>{`${companyName} 用户管理`}</h1>
      <div className="user-form">
        <input
          type="text"
          placeholder="姓名"
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="电子邮箱"
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <select
          value={newUser.role}
          onChange={(e) =>
            setNewUser({ ...newUser, role: e.target.value as UserRole })
          }
        >
          <option value={UserRole.GUEST}>访客</option>
          <option value={UserRole.USER}>普通用户</option>
          <option value={UserRole.ADMIN}>管理员</option>
        </select>
        <input
          type="text"
          placeholder="用户描述（选填）"
          value={newUser.description}
          onChange={(e) =>
            setNewUser({ ...newUser, description: e.target.value })
          }
        />
        <button onClick={addUser}>添加用户</button>
      </div>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      {renderUserList()}
      <footer>
        <p>总用户数: {users.length}</p>
        <p>{`© ${new Date().getFullYear()} ${companyName}用户管理系统. 保留所有权利.`}</p>
      </footer>
    </div>
  );
};

// 默认属性
UserManagement.defaultProps = {
  companyName: '未知公司',
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
