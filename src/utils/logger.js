const { readConfig } = require('../script/setting');

const logger = (type) => {
  const config = readConfig();

  return (message, ...args) => {
    if (config.debug || type === 'error') {
      switch (type) {
        case 'debug':
          console.debug(message, ...args);
          break;
        case 'info':
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
  debug: logger('debug'),
  info: logger('info'),
  warn: logger('warn'),
  error: logger('error'),
};
