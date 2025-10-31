import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layout/Layout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'system/organization',
        name: 'Organization',
        component: () => import('../views/system/Organization.vue'),
        meta: { title: '组织管理' }
      },
      {
        path: 'system/position',
        name: 'Position',
        component: () => import('../views/system/Position.vue'),
        meta: { title: '岗位管理' }
      },
      {
        path: 'system/user',
        name: 'User',
        component: () => import('../views/system/User.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'system/menu',
        name: 'Menu',
        component: () => import('../views/system/Menu.vue'),
        meta: { title: '菜单管理' }
      },
      {
        path: 'system/role',
        name: 'Role',
        component: () => import('../views/system/Role.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'hr/recruitment',
        name: 'Recruitment',
        component: () => import('../views/hr/Recruitment.vue'),
        meta: { title: '招聘管理' }
      },
      {
        path: 'hr/onboarding',
        name: 'Onboarding',
        component: () => import('../views/hr/Onboarding.vue'),
        meta: { title: '入职离职管理' }
      },
      {
        path: 'hr/attendance',
        name: 'Attendance',
        component: () => import('../views/hr/Attendance.vue'),
        meta: { title: '考勤、请假' }
      },
      {
        path: 'hr/salary',
        name: 'Salary',
        component: () => import('../views/hr/Salary.vue'),
        meta: { title: '薪酬福利管理' }
      },
      {
        path: 'hr/employee',
        name: 'Employee',
        component: () => import('../views/hr/Employee.vue'),
        meta: { title: '档案管理' }
      },
      {
        path: 'hr/reports',
        name: 'Reports',
        component: () => import('../views/hr/Report.vue'),
        meta: { title: '报表分析' }
      },
      // 财务模块路由
      {
        path: 'finance/general-ledger',
        name: 'GeneralLedger',
        component: () => import('../views/finance/GeneralLedger.vue'),
        meta: { title: '总账' }
      },
      {
        path: 'finance/accounts-receivable',
        name: 'AccountsReceivable',
        component: () => import('../views/finance/AccountsReceivable.vue'),
        meta: { title: '应收账款' }
      },
      {
        path: 'finance/accounts-payable',
        name: 'AccountsPayable',
        component: () => import('../views/finance/AccountsPayable.vue'),
        meta: { title: '应付账款' }
      },
      {
        path: 'finance/fixed-assets',
        name: 'FixedAssets',
        component: () => import('../views/finance/FixedAssets.vue'),
        meta: { title: '固定资产' }
      },
      {
        path: 'finance/cash-management',
        name: 'CashManagement',
        component: () => import('../views/finance/CashManagement.vue'),
        meta: { title: '资金管理' }
      },
      {
        path: 'finance/cost-accounting',
        name: 'CostAccounting',
        component: () => import('../views/finance/CostAccounting.vue'),
        meta: { title: '成本管理' }
      },
      {
        path: 'finance/budgeting',
        name: 'Budgeting',
        component: () => import('../views/finance/Budgeting.vue'),
        meta: { title: '预算管理' }
      },
      {
        path: 'finance/tax-management',
        name: 'TaxManagement',
        component: () => import('../views/finance/TaxManagement.vue'),
        meta: { title: '税务管理' }
      },
      {
        path: 'finance/expense-management',
        name: 'ExpenseManagement',
        component: () => import('../views/finance/ExpenseManagement.vue'),
        meta: { title: '费用管理' }
      },
      {
        path: 'finance/financial-reporting',
        name: 'FinancialReporting',
        component: () => import('../views/finance/FinancialReporting.vue'),
        meta: { title: '报表与分析' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router