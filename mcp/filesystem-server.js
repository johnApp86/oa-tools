#!/usr/bin/env node

/**
 * 简易 MCP filesystem server
 * 用 Node.js 作为 stdin/stdout server，让 Cursor AI 能访问指定目录
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 从环境变量获取根目录路径
const ROOT_PATH = process.env.FS_PATH || process.cwd();

// 可选排除规则（相对路径）
const excludePatterns = (process.env.EXCLUDE_PATTERNS || '')
  .split(',')
  .map(p => p.trim())
  .filter(Boolean);

function isExcluded(filePath) {
  return excludePatterns.some(pattern =>
    filePath.includes(pattern.replace(/\\/g, '/'))
  );
}

function listFiles(dir) {
  const results = [];
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const relPath = path.relative(ROOT_PATH, fullPath);
      if (isExcluded(relPath)) continue;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        results.push(relPath);
      }
    }
  }
  walk(dir);
  return results;
}

function readFile(relPath) {
  const absPath = path.join(ROOT_PATH, relPath);
  if (isExcluded(relPath)) {
    throw new Error(`File ${relPath} is excluded`);
  }
  return fs.readFileSync(absPath, 'utf8');
}

function writeFile(relPath, content) {
  const absPath = path.join(ROOT_PATH, relPath);
  if (isExcluded(relPath)) {
    throw new Error(`File ${relPath} is excluded`);
  }
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, content, 'utf8');
}

// 处理来自 Cursor 的 JSON 命令
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

console.error(`✅ MCP filesystem server 已启动，根目录: ${ROOT_PATH}`);
console.error(`🚫 排除规则: ${excludePatterns.join(', ') || '无'}`);

rl.on('line', (line) => {
  try {
    const req = JSON.parse(line);
    let result;

    switch (req.action) {
      case 'list':
        result = listFiles(ROOT_PATH);
        break;
      case 'read':
        result = readFile(req.path);
        break;
      case 'write':
        writeFile(req.path, req.content);
        result = 'OK';
        break;
      default:
        throw new Error('未知 action: ' + req.action);
    }

    process.stdout.write(JSON.stringify({ ok: true, result }) + '\n');
  } catch (err) {
    process.stdout.write(JSON.stringify({ ok: false, error: err.message }) + '\n');
  }
});