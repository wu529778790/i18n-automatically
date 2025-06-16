import React from 'react';
import { useTranslation } from 'react-i18next';

const App: React.FC = () => {
  const { t } = useTranslation();
  const status = 'active'; // Mock status

  const handleClick = () => {
    window.alert(t('confirm_delete'));
  };

  return (
    <div>
      <h1>{t('user_management_system')}</h1>
      <p>{t('welcome_message')}</p>
      <button onClick={handleClick}>{t('delete_user')}</button>
      <span title={t('tooltip_message')}>{t('hover_for_tip')}</span>
      <input placeholder={t('enter_username')} />
      <div aria-label={t('content_area')}>
        <p>
          {t('current_status')}:{' '}
          {status === 'active' ? t('active') : t('inactive')}
        </p>
      </div>
    </div>
  );
};

export default App;
