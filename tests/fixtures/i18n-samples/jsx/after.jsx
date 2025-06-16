import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!username) {
      newErrors.username = t('please_enter_username');
    }

    if (!password) {
      newErrors.password = t('please_enter_password');
    } else if (password.length < 6) {
      newErrors.password = t('password_min_length');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      window.alert(t('login_success'));
    } else {
      window.alert(t('check_input_info'));
    }
  };

  return (
    <div className="login-form">
      <h2>{t('user_login')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>{t('username')}：</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('please_enter_username')}
          />
          {errors.username && <span className="error">{errors.username}</span>}
        </div>

        <div className="form-group">
          <label>{t('password')}：</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('please_enter_password')}
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>

        <button type="submit">{t('login')}</button>
        <button
          type="button"
          onClick={() => {
            setUsername('');
            setPassword('');
          }}
        >
          {t('reset')}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
