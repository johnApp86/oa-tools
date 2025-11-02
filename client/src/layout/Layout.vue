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
          v-loading="loading"
          :default-active="activeMenu"
          class="sidebar-menu"
          router
          :collapse="false"
        >
          <template v-for="item in menuTree" :key="item.id">
            <el-sub-menu v-if="item.children && item.children.length > 0" :index="item.path">
              <template #title>
                <el-icon><component :is="getIconComponent(item.icon)" /></el-icon>
                <span>{{ item.name }}</span>
              </template>
              <el-menu-item 
                v-for="child in item.children" 
                :key="child.id" 
                :index="child.path"
              >
                <el-icon><component :is="getIconComponent(child.icon)" /></el-icon>
                <span>{{ child.name }}</span>
              </el-menu-item>
            </el-sub-menu>
            <el-menu-item v-else :index="item.path">
              <el-icon><component :is="getIconComponent(item.icon)" /></el-icon>
              <span>{{ item.name }}</span>
            </el-menu-item>
          </template>
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
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { getMenuTree } from "@/api/menu";
import * as Icons from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);
const menuTree = ref([]);
const loading = ref(true);

// 动态获取图标组件
const getIconComponent = (iconName) => {
  if (!iconName) return Icons.Document;
  const IconComponent = Icons[iconName] || Icons.Document;
  return IconComponent;
};


// 加载菜单
const loadMenus = async () => {
  loading.value = true;
  try {
    const result = await getMenuTree();
    menuTree.value = result.data || result || [];
  } catch (error) {
    console.error('加载菜单失败:', error);
    menuTree.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadMenus();
});
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

/* 确保菜单图标正确显示 */
:deep(.el-sub-menu__title) {
  display: flex;
  align-items: center;
}

:deep(.el-sub-menu__title .el-icon) {
  margin-right: 8px;
  font-size: 16px;
}

:deep(.el-menu-item) {
  display: flex;
  align-items: center;
}

:deep(.el-menu-item .el-icon) {
  margin-right: 8px;
  font-size: 16px;
}
</style>