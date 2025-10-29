<template>
  <div class="layout-container">
    <!-- 头部 -->
    <header class="layout-header">
      <div class="header-left">
        <h1 class="logo">OA管理系统</h1>
      </div>
      <div class="header-right">
        <el-dropdown>
          <span class="user-info">
            <el-icon><Avatar /></el-icon>
            <span>管理员</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>个人中心</el-dropdown-item>
              <el-dropdown-item>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </header>

    <!-- 主体 -->
    <div class="layout-main">
      <!-- 侧边栏 -->
      <aside class="layout-sidebar">
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          :collapse="false"
        >
          <el-menu-item index="/">
            <el-icon><House /></el-icon>
            <span>首页</span>
          </el-menu-item>
          
          <el-sub-menu index="/system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item index="/system/organization">
              <el-icon><OfficeBuilding /></el-icon>
              <span>组织管理</span>
            </el-menu-item>
            <el-menu-item index="/system/position">
              <el-icon><User /></el-icon>
              <span>岗位管理</span>
            </el-menu-item>
            <el-menu-item index="/system/user">
              <el-icon><Avatar /></el-icon>
              <span>用户管理</span>
            </el-menu-item>
            <el-menu-item index="/system/menu">
              <el-icon><Menu /></el-icon>
              <span>菜单管理</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="/hr">
            <template #title>
              <el-icon><UserFilled /></el-icon>
              <span>HR管理</span>
            </template>
            <el-menu-item index="/hr/recruitment">
              <el-icon><Plus /></el-icon>
              <span>招聘管理</span>
            </el-menu-item>
            <el-menu-item index="/hr/onboarding">
              <el-icon><Check /></el-icon>
              <span>入职离职管理</span>
            </el-menu-item>
            <el-menu-item index="/hr/attendance">
              <el-icon><Clock /></el-icon>
              <span>考勤、请假</span>
            </el-menu-item>
            <el-menu-item index="/hr/salary">
              <el-icon><Wallet /></el-icon>
              <span>薪酬福利管理</span>
            </el-menu-item>
            <el-menu-item index="/hr/employee">
              <el-icon><Document /></el-icon>
              <span>档案管理</span>
            </el-menu-item>
            <el-menu-item index="/hr/reports">
              <el-icon><DataAnalysis /></el-icon>
              <span>报表分析</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </aside>

      <!-- 内容区域 -->
      <main class="layout-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { 
  House, 
  Setting, 
  OfficeBuilding, 
  User, 
  Avatar, 
  Menu,
  UserFilled, 
  Plus, 
  Check, 
  Clock, 
  Wallet, 
  Document, 
  DataAnalysis 
} from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
</script>

<style scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1000;
}

.header-left .logo {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-right .user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.header-right .user-info:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.layout-content {
  flex: 1;
  background: #f8fafc;
  overflow-y: auto;
  padding: 24px;
}
</style>