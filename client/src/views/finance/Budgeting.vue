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
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="budget_code" label="预算编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="budget_name" label="预算名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="department" label="部门" width="150" show-overflow-tooltip/>
        <el-table-column prop="budget_year" label="预算年度" width="100" show-overflow-tooltip/>
        <el-table-column prop="budget_amount" label="预算金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.budget_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="used_amount" label="已用金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.used_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="remaining_amount" label="剩余金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            <span :class="getRemainingClass(row.remaining_amount)">
              {{ formatCurrency(row.remaining_amount) }}
            </span>
          </template>
        </el-table-column>
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

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="form.id ? '编辑预算' : '新增预算'"
      width="500px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item label="预算名称" required>
          <el-input v-model="form.name" placeholder="请输入预算名称" />
        </el-form-item>
        <el-form-item label="预算年度" required>
          <el-input-number
            v-model="form.year"
            :min="2020"
            :max="2100"
            placeholder="请输入预算年度"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="预算金额" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入预算金额"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Check } from "@element-plus/icons-vue";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  year: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      year: searchForm.year
    };
    const response = await getBudgets(params);
    tableData.value = response.data || [];
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
const dialogVisible = ref(false);
const form = reactive({
  id: null,
  name: "",
  year: "",
  amount: 0
});

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    name: "",
    year: new Date().getFullYear().toString(),
    amount: 0
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name || row.budget_name,
    year: row.year || row.budget_year,
    amount: row.amount || row.budget_amount
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    const submitData = {
      name: form.name,
      year: parseInt(form.year),
      amount: parseFloat(form.amount)
    };
    
    if (form.id) {
      await updateBudget(form.id, submitData);
    } else {
      await createBudget(submitData);
    }
    
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error("提交失败:", error);
  }
};

const handleApprove = () => ElMessage.info("预算审批功能开发中...");
const handleDetail = () => ElMessage.info("详情功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除预算"${row.name || row.budget_name}"吗？`, "确认删除");
    await deleteBudget(row.id);
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
  }
};

const getStatusTagType = (status) => {
  // 处理数字状态（1=已批准，0=草稿，2=待审批，3=已拒绝）
  if (typeof status === 'number') {
    if (status === 1) return "success";
    if (status === 3) return "danger";
    if (status === 2) return "warning";
    return "info";
  }
  // 处理字符串状态
  const statusMap = {
    draft: "info",
    pending: "warning",
    approved: "success",
    rejected: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  // 处理数字状态（1=已批准，0=草稿，2=待审批，3=已拒绝）
  if (typeof status === 'number') {
    if (status === 1) return "已批准";
    if (status === 3) return "已拒绝";
    if (status === 2) return "待审批";
    return "草稿";
  }
  // 处理字符串状态
  const statusMap = {
    draft: "草稿",
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝"
  };
  return statusMap[status] || status || "未知";
};

const getRemainingClass = (amount) => {
  return amount > 0 ? "positive-remaining" : "negative-remaining";
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0.00";
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
.positive-remaining { color: #10b981; font-weight: 600; }
.negative-remaining { color: #ef4444; font-weight: 600; }
</style>
