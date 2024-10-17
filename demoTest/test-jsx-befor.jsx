// test.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// 模拟的 API 调用函数
const fetchUserData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: '张三',
        age: 30,
        occupation: '软件工程师',
      });
    }, 1000);
  });
};

// 错误边界组件
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('错误边界捕获到错误:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h2>很抱歉，出现了错误：{this.state.error.message}</h2>;
    }
    return this.props.children;
  }
}

// 头部组件
const Header = ({ title }) => (
  <header>
    <h1>{title}</h1>
    <nav>
      <ul>
        <li>
          <a href="#home">首页</a>
        </li>
        <li>
          <a href="#about">关于我们</a>
        </li>
        <li>
          <a href="#contact">联系方式</a>
        </li>
      </ul>
    </nav>
  </header>
);

Header.propTypes = {
  title: PropTypes.string.isRequired,
};

// 用户信息组件
const UserInfo = ({ user }) => (
  <div className="user-info">
    <h3>{user.name}的个人信息</h3>
    <p>年龄：{user.age}</p>
    <p>职业：{user.occupation}</p>
  </div>
);

// 计数器组件
const Counter = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prevCount) => prevCount + 1);
  const decrement = () => setCount((prevCount) => prevCount - 1);

  return (
    <div>
      <h3>计数器</h3>
      <p>当前计数：{count}</p>
      <button onClick={increment}>增加</button>
      <button onClick={decrement}>减少</button>
    </div>
  );
};

// 待办事项组件
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTodos([
        ...todos,
        { id: Date.now(), text: inputValue, completed: false },
      ]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  return (
    <div>
      <h3>待办事项</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder="输入新的待办事项"
        />
        <button type="submit">添加</button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li
            key={todo.id}
            onClick={() => toggleTodo(todo.id)}
            style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
};

// 主应用组件
const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserData()
      .then((data) => {
        setUser(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError('获取用户数据时出错');
        setIsLoading(false);
        console.error('获取用户数据失败:', err);
      });
  }, []);

  const welcomeMessage = useMemo(() => {
    return user ? `欢迎回来，${user.name}！` : '欢迎来到我们的应用！';
  }, [user]);

  const handleError = useCallback(() => {
    throw new Error('这是一个故意抛出的错误');
  }, []);

  if (isLoading) return <div>加载中，请稍候...</div>;
  if (error) return <div>错误：{error}</div>;

  return (
    <ErrorBoundary>
      <div className="app">
        <Header title="我的 React 应用" />
        <main>
          <h2>{welcomeMessage}</h2>
          {user && <UserInfo user={user} />}
          <Counter />
          <TodoList />
          <button onClick={handleError}>点击触发错误</button>
        </main>
        <footer>
          <p>© 2024 我的 React 应用。保留所有权利。</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
