// 简单日志工具
class Logger {
  static info(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error ? error.stack : '');
  }

  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  static debug(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG] ${timestamp} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  // API请求日志
  static apiRequest(method, url, statusCode, responseTime) {
    const timestamp = new Date().toISOString();
    console.log(`[API] ${timestamp} - ${method} ${url} ${statusCode} ${responseTime}ms`);
  }

  // 数据库操作日志
  static dbOperation(operation, table, duration) {
    const timestamp = new Date().toISOString();
    console.log(`[DB] ${timestamp} - ${operation} ${table} ${duration}ms`);
  }
}

module.exports = Logger;
