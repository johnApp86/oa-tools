<template>
  <div class="dashboard">
    <div class="page-card">
      <h2>欢迎使用OA管理系统</h2>
      <p>这是一个基于Vue3 + Element Plus + Express + SQLite3的现代化管理系统</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><User /></el-icon>
        </div>
        <div class="stat-content">
          <h3>用户总数</h3>
          <p class="stat-number">{{ stats.users }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#e6a23c"><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-content">
          <h3>组织总数</h3>
          <p class="stat-number">{{ stats.organizations }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#67c23a"><User /></el-icon>
        </div>
        <div class="stat-content">
          <h3>岗位总数</h3>
          <p class="stat-number">{{ stats.positions }}</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#f56c6c"><Menu /></el-icon>
        </div>
        <div class="stat-content">
          <h3>菜单总数</h3>
          <p class="stat-number">{{ stats.menus }}</p>
        </div>
      </div>
    </div>

    <div class="features-grid">
      <div class="feature-card">
        <h3>用户管理</h3>
        <p>完整的用户信息管理，支持组织架构关联</p>
        <el-button type="primary" @click="$router.push('/system/user')">
          用户管理
        </el-button>
      </div>

      <div class="feature-card">
        <h3>组织管理</h3>
        <p>支持多级组织架构，灵活的层级管理</p>
        <el-button type="success" @click="$router.push('/system/organization')">
          组织管理
        </el-button>
      </div>

      <div class="feature-card">
        <h3>岗位管理</h3>
        <p>灵活的岗位设置，支持组织关联</p>
        <el-button type="warning" @click="$router.push('/system/position')">
          岗位管理
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const stats = ref({
  users: 0,
  organizations: 0,
  positions: 0,
  menus: 6, // 固定菜单数量
});

// 加载统计数据
const loadStats = async () => {
  try {
    // 获取用户总数
    const usersResponse = await fetch('/api/users');
    const usersData = await usersResponse.json();
    stats.value.users = usersData.total || 0;

    // 获取组织总数
    const orgsResponse = await fetch('/api/organizations');
    const orgsData = await orgsResponse.json();
    stats.value.organizations = Array.isArray(orgsData) ? orgsData.length : 0;

    // 获取岗位总数
    const positionsResponse = await fetch('/api/positions');
    const positionsData = await positionsResponse.json();
    stats.value.positions = Array.isArray(positionsData) ? positionsData.length : 0;

  } catch (error) {
    console.error('加载统计数据失败:', error);
    // 如果API调用失败，使用默认值
    stats.value = {
      users: 1, // 默认有1个admin用户
      organizations: 1, // 默认有1个总公司
      positions: 1, // 默认有1个系统管理员岗位
      menus: 6, // 固定菜单数量
    };
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.page-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 30px;
  text-align: center;
}

.page-card h2 {
  font-size: 28px;
  color: #303133;
  margin: 0 0 15px 0;
}

.page-card p {
  font-size: 16px;
  color: #606266;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  flex-shrink: 0;
}

.stat-content h3 {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.feature-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
  text-align: center;
}

.feature-card h3 {
  font-size: 18px;
  color: #303133;
  margin: 0 0 15px 0;
}

.feature-card p {
  font-size: 14px;
  color: #606266;
  margin: 0 0 20px 0;
  line-height: 1.5;
}
</style>
