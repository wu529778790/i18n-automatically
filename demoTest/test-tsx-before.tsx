import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface User {
  id: number;
  name: string;
  email: string;
  role: '管理员' | '普通用户' | '访客';
}

interface Props {
  initialUsers: User[];
}

const UserManagement: React.FC<Props> = ({ initialUsers }) => {
  const { t } = useTranslation();

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = t('用户管理系统');
  }, [t]);

  const addUser = useCallback(() => {
    if (!newUser.name || !newUser.email) {
      setError(t('请填写所有必填字段'));
      return;
    }
    setUsers((prevUsers) => [
      ...prevUsers,
      { ...newUser, id: prevUsers.length + 1 },
    ]);
    setNewUser({ name: '', email: '', role: '访客' });
    setError(null);
  }, [newUser, t]);

  const deleteUser = useCallback((id: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== id));
  }, []);

  return (
    <div className="user-management">
      <h1>{t('用户管理')}</h1>
      <div className="user-form">
        <input
          type="text"
          placeholder={t('姓名')}
          value={newUser.name}
          onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
        />
        <input
          type="email"
          placeholder={t('电子邮箱')}
          value={newUser.email}
          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
        />
        <select value={newUser.role}>
          <option value="访客">{t('访客')}</option>
          <option value="普通用户">{t('普通用户')}</option>
          <option value="管理员">{t('管理员')}</option>
        </select>
        <button onClick={addUser}>{t('添加用户')}</button>
      </div>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>{t('ID')}</th>
            <th>{t('姓名')}</th>
            <th>{t('电子邮箱')}</th>
            <th>{t('角色')}</th>
            <th>{t('操作')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{t(user.role)}</td>
              <td>
                <button onClick={() => deleteUser(user.id)}>{t('删除')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p>{t('暂无用户数据')}</p>}
      <footer>
        <p>
          {t('总用户数')}: {users.length}
        </p>
        <p>{t('© 2024 用户管理系统. 保留所有权利.')}</p>
      </footer>
    </div>
  );
};

export default UserManagement;
