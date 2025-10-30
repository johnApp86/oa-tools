<template>
  <div class="fixed-assets-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入资产名称或编号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="资产状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="在用" value="active" />
            <el-option label="闲置" value="idle" />
            <el-option label="报废" value="scrapped" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="button-group">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增资产
      </el-button>
      <el-button type="success" @click="handleDepreciation">
        <el-icon><Plus /></el-icon>
        计提折旧
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="asset_code" label="资产编号" width="150" />
        <el-table-column prop="asset_name" label="资产名称" width="200" />
        <el-table-column prop="category" label="资产类别" width="120" />
        <el-table-column prop="original_value" label="原值" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.original_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="depreciation" label="累计折旧" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.depreciation) }}
          </template>
        </el-table-column>
        <el-table-column prop="net_value" label="净值" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.net_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="warning" @click="handleMaintenance(row)">
                维护
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  status: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const mockData = [
      {
        id: 1,
        asset_code: "FA-001",
        asset_name: "办公电脑",
        category: "电子设备",
        original_value: 5000,
        depreciation: 1000,
        net_value: 4000,
        status: "active",
      },
      {
        id: 2,
        asset_code: "FA-002",
        asset_name: "办公桌",
        category: "办公家具",
        original_value: 2000,
        depreciation: 400,
        net_value: 1600,
        status: "active",
      }
    ];
    tableData.value = mockData;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => loadData();
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.status = "";
  loadData();
};
const handleAdd = () => ElMessage.info("新增资产功能开发中...");
const handleEdit = () => ElMessage.info("编辑功能开发中...");
const handleDepreciation = () => ElMessage.info("计提折旧功能开发中...");
const handleMaintenance = () => ElMessage.info("维护功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除资产"${row.asset_name}"吗？`, "确认删除");
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {}
};

const getStatusTagType = (status) => {
  const statusMap = { active: "success", idle: "warning", scrapped: "danger" };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = { active: "在用", idle: "闲置", scrapped: "报废" };
  return statusMap[status] || status;
};

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

onMounted(() => loadData());
</script>

<style scoped>
.fixed-assets-management { padding: 0; }
.search-form {
  background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 24px; margin-bottom: 24px; border: 1px solid #f7fafc;
}
.button-group { margin-bottom: 24px; }
.table-container {
  background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 24px; border: 1px solid #f7fafc; overflow: hidden;
}
:deep(.el-table) { border-radius: 8px; overflow: hidden; }
:deep(.el-table th) { background-color: #f8fafc; color: #4a5568; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
:deep(.el-table td) { border-bottom: 1px solid #f7fafc; }
:deep(.el-table tr:hover > td) { background-color: #f7fafc; }
.operation-buttons { display: flex; gap: 8px; }
</style>
