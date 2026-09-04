const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'];

function formatTimestamp() {
  return new Date().toISOString();
}

function log(level, message, data = null) {
  if (LOG_LEVELS[level] > CURRENT_LEVEL) return;
  
  const timestamp = formatTimestamp();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  
  if (data) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export const logger = {
  error: (msg, data) => log('error', msg, data),
  warn: (msg, data) => log('warn', msg, data),
  info: (msg, data) => log('info', msg, data),
  debug: (msg, data) => log('debug', msg, data)
};