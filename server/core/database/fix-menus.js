#!/usr/bin/env node

/**
 * 修复菜单数据脚本
 * 用于快速添加缺失的菜单（HR子菜单和字典管理）
 */

const db = require('./db-connection');
const path = require('path');

console.log('========================================');
console.log('        修复菜单数据');
console.log('========================================');
console.log('');

// 要插入或更新的菜单数据
const menus = [
  // HR管理子菜单
  { id: 8, name: '招聘管理', path: '/hr/recruitment', component: 'hr/Recruitment', icon: 'UserPlus', parent_id: 7, level: 2, sort_order: 1, type: 1, status: 1 },
  { id: 9, name: '入职离职管理', path: '/hr/onboarding', component: 'hr/Onboarding', icon: 'UserCheck', parent_id: 7, level: 2, sort_order: 2, type: 1, status: 1 },
  { id: 10, name: '考勤、请假', path: '/hr/attendance', component: 'hr/Attendance', icon: 'Clock', parent_id: 7, level: 2, sort_order: 3, type: 1, status: 1 },
  { id: 11, name: '薪酬福利管理', path: '/hr/salary', component: 'hr/Salary', icon: 'CurrencyDollar', parent_id: 7, level: 2, sort_order: 4, type: 1, status: 1 },
  { id: 12, name: '档案管理', path: '/hr/employee', component: 'hr/Employee', icon: 'DocumentText', parent_id: 7, level: 2, sort_order: 5, type: 1, status: 1 },
  { id: 13, name: '报表分析', path: '/hr/reports', component: 'hr/Report', icon: 'ChartBar', parent_id: 7, level: 2, sort_order: 6, type: 1, status: 1 },
  // 系统管理子菜单 - 字典管理
  { id: 26, name: '字典管理', path: '/system/dictionary', component: 'system/Dictionary', icon: 'Notebook', parent_id: 2, level: 2, sort_order: 5, type: 1, status: 1 },
];

let completed = 0;
let successCount = 0;
let errorCount = 0;
const errors = [];

menus.forEach(menu => {
  db.run(`
    INSERT OR REPLACE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    menu.id,
    menu.name,
    menu.path,
    menu.component,
    menu.icon,
    menu.parent_id,
    menu.level,
    menu.sort_order,
    menu.type,
    menu.status
  ], function(err) {
    completed++;
    if (err) {
      console.error(`❌ 插入菜单 "${menu.name}" 失败:`, err.message);
      errorCount++;
      errors.push({ menu: menu.name, error: err.message });
    } else {
      console.log(`✓ 插入菜单 "${menu.name}" 成功`);
      successCount++;
    }

    if (completed === menus.length) {
      console.log('');
      console.log('========================================');
      console.log('        修复完成');
      console.log('========================================');
      console.log('');
      console.log(`✓ 成功: ${successCount} 条`);
      if (errorCount > 0) {
        console.log(`❌ 失败: ${errorCount} 条`);
        errors.forEach(e => {
          console.log(`   - ${e.menu}: ${e.error}`);
        });
      }
      console.log('');
      
      // 延迟退出以确保数据库操作完成
      setTimeout(() => {
        process.exit(errorCount > 0 ? 1 : 0);
      }, 500);
    }
  });
});
