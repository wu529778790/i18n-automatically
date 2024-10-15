const { readConfig } = require('../script/setting');

const customConsole = (type) => {
  const config = readConfig();
  return (message, ...args) => {
    switch (type) {
      case 'debug':
        if (!(config && config.debug)) return;
        console.debug(message, ...args);
        break;
      case 'log':
        if (!(config && config.debug)) return;
        console.log(message, ...args);
        break;
      case 'warn':
        if (!(config && config.debug)) return;
        console.warn(message, ...args);
        break;
      case 'error':
        if (!(config && config.debug)) return;
        console.error(message, ...args);
        break;
    }
  };
};

module.exports = {
  debug: customConsole('debug'),
  log: customConsole('log'),
  warn: customConsole('warn'),
  error: customConsole('error'),
};
