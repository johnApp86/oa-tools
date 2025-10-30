<template>
  <div class="cost-accounting-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入成本中心或项目名称" clearable />
        </el-form-item>
        <el-form-item label="成本类型">
          <el-select v-model="searchForm.costType" placeholder="请选择类型" clearable>
            <el-option label="直接材料" value="direct_material" />
            <el-option label="直接人工" value="direct_labor" />
            <el-option label="制造费用" value="manufacturing" />
            <el-option label="间接费用" value="indirect" />
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
        新增成本中心
      </el-button>
      <el-button type="success" @click="handleAllocate">
        <el-icon><Plus /></el-icon>
        成本分配
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="cost_center_code" label="成本中心编号" width="150" />
        <el-table-column prop="cost_center_name" label="成本中心名称" width="200" />
        <el-table-column prop="cost_type" label="成本类型" width="120" />
        <el-table-column prop="budget_amount" label="预算金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.budget_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_amount" label="实际金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.actual_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="variance" label="差异" width="120" align="right">
          <template #default="{ row }">
            <span :class="getVarianceClass(row.variance)">
              {{ formatCurrency(row.variance) }}
            </span>
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
import { Plus } from "@element-plus/icons-vue";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  costType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const mockData = [
      {
        id: 1,
        cost_center_code: "CC-001",
        cost_center_name: "生产部门",
        cost_type: "direct_material",
        budget_amount: 100000,
        actual_amount: 95000,
        variance: -5000,
      },
      {
        id: 2,
        cost_center_code: "CC-002",
        cost_center_name: "管理部门",
        cost_type: "indirect",
        budget_amount: 50000,
        actual_amount: 52000,
        variance: 2000,
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
  searchForm.costType = "";
  loadData();
};
const handleAdd = () => ElMessage.info("新增成本中心功能开发中...");
const handleEdit = () => ElMessage.info("编辑功能开发中...");
const handleAllocate = () => ElMessage.info("成本分配功能开发中...");
const handleDetail = () => ElMessage.info("详情功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除成本中心"${row.cost_center_name}"吗？`, "确认删除");
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {}
};

const getVarianceClass = (variance) => {
  return variance < 0 ? "positive-variance" : variance > 0 ? "negative-variance" : "zero-variance";
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
.cost-accounting-management { padding: 0; }
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
.positive-variance { color: #10b981; font-weight: 600; }
.negative-variance { color: #ef4444; font-weight: 600; }
.zero-variance { color: #6b7280; font-weight: 600; }
</style>
