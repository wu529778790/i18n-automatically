// JavaScript文件示例 - 转换后
import { t } from '../i18n';

function showMessage() {
  console.log(t('test_message'));
  window.alert(t('operation_success'));

  const obj = {
    title: t('title_content'),
    description: t('description_info'),
    status: t('processing_status'),
  };

  return obj;
}

const messages = {
  error: t('error_occurred'),
  success: t('operation_success'),
  warning: t('please_note'),
};

export { showMessage, messages };
