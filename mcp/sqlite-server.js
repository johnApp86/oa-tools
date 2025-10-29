#!/usr/bin/env node
/**
 * 简单的 MCP SQLite Server 示例
 * Cursor 会通过 stdin/stdout 与这个脚本通信
 */

const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');

// 从环境变量读取数据库路径（在 MCP 配置里传）
const dbPath = process.env.SQLITE_PATH || './server/database/oa.db';
const db = new sqlite3.Database(dbPath);

// MCP 简易协议：接收 JSON 请求，执行 SQL，返回 JSON 响应
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

console.error(`✅ SQLite MCP Server 已连接到: ${dbPath}`);

rl.on('line', (line) => {
  try {
    const request = JSON.parse(line);

    if (!request.sql) {
      process.stdout.write(JSON.stringify({ error: "缺少 sql 字段" }) + '\n');
      return;
    }

    db.all(request.sql, [], (err, rows) => {
      if (err) {
        process.stdout.write(JSON.stringify({ error: err.message }) + '\n');
      } else {
        process.stdout.write(JSON.stringify({ data: rows }) + '\n');
      }
    });
  } catch (e) {
    process.stdout.write(JSON.stringify({ error: e.message }) + '\n');
  }
});