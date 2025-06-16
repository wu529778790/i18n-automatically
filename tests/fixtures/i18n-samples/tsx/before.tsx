import React from 'react';

const App: React.FC = () => {
  const handleClick = () => {
    alert('确认删除吗？');
  };

  return (
    <div>
      <h1>用户管理系统</h1>
      <p>欢迎使用我们的应用程序</p>
      <button onClick={handleClick}>删除用户</button>
      <span title="这是一个提示">鼠标悬停查看提示</span>
      <input placeholder="请输入用户名" />
      <div aria-label="内容区域">
        <p>当前状态：{status === 'active' ? '活跃' : '非活跃'}</p>
      </div>
    </div>
  );
};

export default App;
