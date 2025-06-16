// JavaScript文件示例 - 转换前
function showMessage() {
  console.log('这是一条测试消息');
  alert('操作成功完成！');

  const obj = {
    title: '标题内容',
    description: '这是描述信息',
    status: '正在处理中...',
  };

  return obj;
}

const messages = {
  error: '发生了错误',
  success: '操作成功',
  warning: '请注意',
};

export { showMessage, messages };
