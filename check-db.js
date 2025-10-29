const db = require('./server/database/db');

console.log('检查数据库表...');

db.all('SELECT name FROM sqlite_master WHERE type="table"', (err, tables) => {
  if (err) {
    console.error('查询失败:', err);
  } else {
    console.log('数据库表:', tables);
  }
  
  // 检查HR表是否存在
  db.all('SELECT name FROM sqlite_master WHERE type="table" AND name LIKE "%hr%" OR name LIKE "%onboarding%" OR name LIKE "%recruitment%"', (err, hrTables) => {
    if (err) {
      console.error('查询HR表失败:', err);
    } else {
      console.log('HR相关表:', hrTables);
    }
    
    // 检查入职申请表数据
    db.all('SELECT COUNT(*) as count FROM onboarding_applications', (err, result) => {
      if (err) {
        console.error('查询入职申请表失败:', err);
      } else {
        console.log('入职申请表记录数:', result);
      }
      
      process.exit(0);
    });
  });
});
