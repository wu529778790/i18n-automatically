const { readConfig } = require('../script/setting');

const cutomConsole = (type) => {
  const config = readConfig();

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
  debug: cutomConsole('debug'),
  log: cutomConsole('log'),
  warn: cutomConsole('warn'),
  error: cutomConsole('error'),
};
