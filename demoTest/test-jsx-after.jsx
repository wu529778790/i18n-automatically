import i18n from '@/i18n'; // test.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';

// 模拟的 API 调用函数
const fetchUserData = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: i18n.t('demoTest-test-jsx-befor-192986d8015688a74-1'),
        age: 30,
        occupation: i18n.t('demoTest-test-jsx-befor-192986d8015688a74-2'),
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
      return (
        <h2>
          {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-3')}
          {this.state.error.message}
        </h2>
      );
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
          <a href="#home">
            {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-4')}
          </a>
        </li>
        <li>
          <a href="#about">
            {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-5')}
          </a>
        </li>
        <li>
          <a href="#contact">
            {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-6')}
          </a>
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
    <h3>
      {user.name}
      {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-7')}
    </h3>
    <p>
      {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-8')}
      {user.age}
    </p>
    <p>
      {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-9')}
      {user.occupation}
    </p>
  </div>
);

// 计数器组件
const Counter = () => {
  const [count, setCount] = useState(0);

  const increment = () => setCount((prevCount) => prevCount + 1);
  const decrement = () => setCount((prevCount) => prevCount - 1);

  return (
    <div>
      <h3>{i18n.t('demoTest-test-jsx-befor-192986d8015688a74-10')}</h3>
      <p>
        {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-11')}
        {count}
      </p>
      <button onClick={increment}>
        {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-12')}
      </button>
      <button onClick={decrement}>
        {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-13')}
      </button>
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
      <h3>{i18n.t('demoTest-test-jsx-befor-192986d8015688a74-14')}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={i18n.t('demoTest-test-jsx-befor-192986d8015688a74-15')}
        />

        <button type="submit">
          {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-16')}
        </button>
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
        setError(i18n.t('demoTest-test-jsx-befor-192986d8015688a74-17'));
        setIsLoading(false);
        console.error('获取用户数据失败:', err);
      });
  }, []);

  const welcomeMessage = useMemo(() => {
    return user
      ? `${i18n.t('demoTest-test-jsx-befor-192986d8015688a74-18')}${user.name}！`
      : i18n.t('demoTest-test-jsx-befor-192986d8015688a74-19');
  }, [user]);

  const handleError = useCallback(() => {
    throw new Error('这是一个故意抛出的错误');
  }, []);

  if (isLoading)
    return <div>{i18n.t('demoTest-test-jsx-befor-192986d8015688a74-20')}</div>;
  if (error)
    return (
      <div>
        {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-21')}
        {error}
      </div>
    );

  return (
    <ErrorBoundary>
      <div className="app">
        <Header
          title={i18n.t('demoTest-test-jsx-befor-192986d8015688a74-22')}
        />
        <main>
          <h2>{welcomeMessage}</h2>
          {user && <UserInfo user={user} />}
          <Counter />
          <TodoList />
          <button onClick={handleError}>
            {i18n.t('demoTest-test-jsx-befor-192986d8015688a74-23')}
          </button>
        </main>
        <footer>
          <p>{i18n.t('demoTest-test-jsx-befor-192986d8015688a74-24')}</p>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;
