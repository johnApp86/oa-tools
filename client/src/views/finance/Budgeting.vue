<template>
  <div class="budgeting-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入预算名称或部门" clearable />
        </el-form-item>
        <el-form-item label="预算年度">
          <el-date-picker
            v-model="searchForm.year"
            type="year"
            placeholder="请选择年度"
            format="YYYY"
            value-format="YYYY"
          />
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
        新增预算
      </el-button>
      <el-button type="success" @click="handleApprove">
        <el-icon><Check /></el-icon>
        预算审批
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="budget_code" label="预算编号" width="150" />
        <el-table-column prop="budget_name" label="预算名称" width="200" />
        <el-table-column prop="department" label="部门" width="150" />
        <el-table-column prop="budget_year" label="预算年度" width="100" />
        <el-table-column prop="budget_amount" label="预算金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.budget_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="used_amount" label="已用金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.used_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remaining_amount" label="剩余金额" width="120" align="right">
          <template #default="{ row }">
            <span :class="getRemainingClass(row.remaining_amount)">
              {{ formatCurrency(row.remaining_amount) }}
            </span>
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
              <el-button size="small" type="primary" @click="handleDetail(row)">
                详情
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
import { Plus, Check } from "@element-plus/icons-vue";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  year: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const mockData = [
      {
        id: 1,
        budget_code: "BUD-2025-001",
        budget_name: "办公用品预算",
        department: "行政部",
        budget_year: "2025",
        budget_amount: 50000,
        used_amount: 15000,
        remaining_amount: 35000,
        status: "approved",
      },
      {
        id: 2,
        budget_code: "BUD-2025-002",
        budget_name: "设备采购预算",
        department: "技术部",
        budget_year: "2025",
        budget_amount: 200000,
        used_amount: 80000,
        remaining_amount: 120000,
        status: "approved",
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
  searchForm.year = "";
  loadData();
};
const handleAdd = () => ElMessage.info("新增预算功能开发中...");
const handleEdit = () => ElMessage.info("编辑功能开发中...");
const handleApprove = () => ElMessage.info("预算审批功能开发中...");
const handleDetail = () => ElMessage.info("详情功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除预算"${row.budget_name}"吗？`, "确认删除");
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {}
};

const getStatusTagType = (status) => {
  const statusMap = {
    draft: "info",
    pending: "warning",
    approved: "success",
    rejected: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = {
    draft: "草稿",
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝"
  };
  return statusMap[status] || status;
};

const getRemainingClass = (amount) => {
  return amount > 0 ? "positive-remaining" : "negative-remaining";
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
.budgeting-management { padding: 0; }
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
.positive-remaining { color: #10b981; font-weight: 600; }
.negative-remaining { color: #ef4444; font-weight: 600; }
</style>
