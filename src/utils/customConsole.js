const { readConfig } = require('../script/setting');

const customConsole = (type) => {
  const config = readConfig();
  if (!config) {
    return;
  }
  return (message, ...args) => {
    if (config.debug || type === 'error') {
      switch (type) {
        case 'debug':
          console.debug(message, ...args);
          break;
        case 'log':
          console.log(message, ...args);
          break;
        case 'warn':
          console.warn(message, ...args);
          break;
        case 'error':
          console.error(message, ...args);
          break;
      }
    }
  };
};

module.exports = {
  debug: customConsole('debug'),
  log: customConsole('log'),
  warn: customConsole('warn'),
  error: customConsole('error'),
};
