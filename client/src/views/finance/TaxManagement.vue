<template>
  <div class="tax-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入税种或纳税人" clearable />
        </el-form-item>
        <el-form-item label="税种">
          <el-select v-model="searchForm.taxType" placeholder="请选择税种" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="增值税" value="vat" />
            <el-option label="企业所得税" value="corporate_income" />
            <el-option label="个人所得税" value="personal_income" />
            <el-option label="印花税" value="stamp" />
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
        新增税务
      </el-button>
      <el-button type="success" @click="handleCalculate">
        <el-icon><Plus /></el-icon>
        计算税款
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="tax_code" label="税务编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="tax_name" label="税种名称" width="150" show-overflow-tooltip/>
        <el-table-column prop="tax_type" label="税种类型" width="120" show-overflow-tooltip/>
        <el-table-column prop="taxable_amount" label="应税金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.taxable_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="tax_rate" label="税率" width="100" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ row.tax_rate }}%
          </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="税额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.tax_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="申报期限" width="120" show-overflow-tooltip/>
        <el-table-column prop="status" label="状态" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" show-overflow-tooltipfixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="handleDeclare(row)">
                申报
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
  taxType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const mockData = [
      {
        id: 1,
        tax_code: "TAX-001",
        tax_name: "增值税",
        tax_type: "vat",
        taxable_amount: 100000,
        tax_rate: 13,
        tax_amount: 13000,
        due_date: "2025-11-15",
        status: "pending",
      },
      {
        id: 2,
        tax_code: "TAX-002",
        tax_name: "企业所得税",
        tax_type: "corporate_income",
        taxable_amount: 500000,
        tax_rate: 25,
        tax_amount: 125000,
        due_date: "2025-12-31",
        status: "declared",
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
  searchForm.taxType = "";
  loadData();
};
const handleAdd = () => ElMessage.info("新增税务功能开发中...");
const handleEdit = () => ElMessage.info("编辑功能开发中...");
const handleCalculate = () => ElMessage.info("计算税款功能开发中...");
const handleDeclare = () => ElMessage.info("申报功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除税务"${row.tax_name}"吗？`, "确认删除");
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {}
};

const getStatusTagType = (status) => {
  const statusMap = {
    pending: "warning",
    declared: "success",
    overdue: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = {
    pending: "待申报",
    declared: "已申报",
    overdue: "逾期"
  };
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
.tax-management { padding: 0; }
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
.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.operation-buttons .el-button {
  flex-shrink: 0;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  width: 100% !important;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f7fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table tr:hover > td) {
  background-color: #f7fafc;
}
</style>
