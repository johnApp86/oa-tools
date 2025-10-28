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
        path: '/system',
        name: 'System',
        meta: { title: '系统管理' },
        children: [
          {
            path: 'organization',
            name: 'Organization',
            component: () => import('../views/system/Organization.vue'),
            meta: { title: '组织管理' }
          },
          {
            path: 'position',
            name: 'Position',
            component: () => import('../views/system/Position.vue'),
            meta: { title: '岗位管理' }
          },
          {
            path: 'user',
            name: 'User',
            component: () => import('../views/system/User.vue'),
            meta: { title: '用户管理' }
          },
          {
            path: 'menu',
            name: 'Menu',
            component: () => import('../views/system/Menu.vue'),
            meta: { title: '菜单管理' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router