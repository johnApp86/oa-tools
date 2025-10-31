<template>
  <div class="expense-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入费用名称或申请人" clearable />
        </el-form-item>
        <el-form-item label="费用类型">
          <el-select v-model="searchForm.expenseType" placeholder="请选择类型" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="差旅费" value="travel" />
            <el-option label="办公费" value="office" />
            <el-option label="通讯费" value="communication" />
            <el-option label="培训费" value="training" />
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
        新增费用
      </el-button>
      <el-button type="success" @click="handleApprove">
        <el-icon><Check /></el-icon>
        费用审批
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="expense_code" label="费用编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="expense_name" label="费用名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="expense_type" label="费用类型" width="120" show-overflow-tooltip/>
        <el-table-column prop="applicant" label="申请人" width="120" show-overflow-tooltip/>
        <el-table-column prop="amount" label="申请金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="approved_amount" label="审批金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.approved_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="apply_date" label="申请日期" width="120" show-overflow-tooltip/>
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
      :title="form.id ? '编辑费用申请' : '新增费用申请'"
      width="500px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item label="费用类别" required>
          <el-input v-model="form.category" placeholder="请输入费用类别" />
        </el-form-item>
        <el-form-item label="费用金额" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入费用金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="费用描述" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入费用描述"
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
  getExpenseApplications,
  createExpenseApplication,
  approveExpenseApplication,
  rejectExpenseApplication
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  expenseType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      expense_type: searchForm.expenseType
    };
    const response = await getExpenseApplications(params);
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
  searchForm.expenseType = "";
  loadData();
};
const dialogVisible = ref(false);
const form = reactive({
  id: null,
  category: "",
  amount: 0,
  description: ""
});

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    category: "",
    amount: 0,
    description: ""
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    category: row.category || row.expense_type,
    amount: row.amount,
    description: row.description || row.expense_name
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    const submitData = {
      category: form.category,
      amount: parseFloat(form.amount),
      description: form.description
    };
    
    if (form.id) {
      ElMessage.info("更新费用申请功能开发中...");
      // TODO: 添加更新接口
    } else {
      await createExpenseApplication(submitData);
      dialogVisible.value = false;
      await loadData();
    }
  } catch (error) {
    console.error("提交失败:", error);
  }
};

const handleApprove = async (row) => {
  try {
    await approveExpenseApplication(row.id);
    await loadData();
  } catch (error) {
    console.error("审批失败:", error);
  }
};

const handleReject = async (row) => {
  try {
    await rejectExpenseApplication(row.id);
    await loadData();
  } catch (error) {
    console.error("拒绝失败:", error);
  }
};

const handleDetail = () => ElMessage.info("详情功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除费用"${row.description || row.expense_name}"吗？`, "确认删除");
    ElMessage.info("删除费用申请功能开发中...");
    // TODO: 添加删除接口
    // await deleteExpenseApplication(row.id);
    // await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
  }
};

const getStatusTagType = (status) => {
  const statusMap = {
    pending: "warning",
    approved: "success",
    rejected: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = {
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝"
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
.expense-management { padding: 0; }
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
