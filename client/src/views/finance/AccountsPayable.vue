<template>
  <div class="accounts-payable-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入供应商名称或发票号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="未付款" value="unpaid" />
            <el-option label="部分付款" value="partial" />
            <el-option label="已付款" value="paid" />
            <el-option label="逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="button-group">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增应付
      </el-button>
      <el-button type="success" @click="handleBatchPay">
        <el-icon><CreditCard /></el-icon>
        批量付款
      </el-button>
    </div>

    <!-- 应付账表格 -->
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="invoice_number" label="发票号" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.invoice_number || row.invoice_no || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="supplier_name" label="供应商名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="amount" label="应付金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paid_amount" label="已付金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.paid_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            <span :class="getBalanceClass(row.balance)">
              {{ formatCurrency(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="到期日期" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDate(row.due_date) }}
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
              <el-button size="small" type="success" @click="handlePay(row)">
                付款
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
      :title="form.id ? '编辑应付账' : '新增应付账'"
      width="500px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item label="发票号" required>
          <el-input v-model="form.invoice_no" placeholder="请输入发票号" />
        </el-form-item>
        <el-form-item label="供应商名称" required>
          <el-input v-model="form.supplier_name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="应付金额" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入应付金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="到期日期" required>
          <el-date-picker
            v-model="form.due_date"
            type="date"
            placeholder="请选择到期日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
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
import { Plus, CreditCard } from "@element-plus/icons-vue";
import {
  getAccountsPayable,
  createAccountPayable,
  updateAccountPayable,
  deleteAccountPayable,
  addPayablePayment
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  status: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      status: searchForm.status
    };
    const response = await getAccountsPayable(params);
    // 统一字段名，将 invoice_number 映射为 invoice_no 以兼容前端代码
    const data = (response.data || []).map(item => ({
      ...item,
      invoice_no: item.invoice_number || item.invoice_no
    }));
    tableData.value = data;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.status = "";
  loadData();
};

const dialogVisible = ref(false);
const form = reactive({
  id: null,
  invoice_no: "",
  supplier_name: "",
  amount: 0,
  due_date: ""
});

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    invoice_no: "",
    supplier_name: "",
    amount: 0,
    due_date: ""
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    invoice_no: row.invoice_number || row.invoice_no || "",
    supplier_name: row.supplier_name,
    amount: row.amount,
    due_date: row.due_date
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    const submitData = {
      invoice_number: form.invoice_no, // 后端使用 invoice_number
      supplier_name: form.supplier_name,
      amount: form.amount,
      due_date: form.due_date,
      description: '' // 后端需要 description 字段
    };
    
    if (form.id) {
      await updateAccountPayable(form.id, submitData);
    } else {
      await createAccountPayable(submitData);
    }
    
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error("提交失败:", error);
  }
};

const currentPayableId = ref(null);

const handlePay = (row) => {
  currentPayableId.value = row.id;
  ElMessage.info("付款功能开发中...");
  // TODO: 实现付款功能
};

const handleBatchPay = () => {
  ElMessage.info("批量付款功能开发中...");
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应付账"${row.invoice_number || row.invoice_no || '无发票号'}"吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await deleteAccountPayable(row.id);
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
  }
};

const getStatusTagType = (status) => {
  // 处理数字状态（1=已付款，0=未付款）
  if (typeof status === 'number') {
    return status === 1 ? "success" : "info";
  }
  // 处理字符串状态
  const statusMap = {
    unpaid: "info",
    partial: "warning",
    paid: "success",
    overdue: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  // 处理数字状态（1=已付款，0=未付款）
  if (typeof status === 'number') {
    return status === 1 ? "已付款" : "未付款";
  }
  // 处理字符串状态
  const statusMap = {
    unpaid: "未付款",
    partial: "部分付款",
    paid: "已付款",
    overdue: "逾期"
  };
  return statusMap[status] || status || "未知";
};

const getBalanceClass = (balance) => {
  return balance > 0 ? "positive-balance" : "zero-balance";
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  return Number(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatDate = (date) => {
  if (!date) return "-";
  // 如果是 YYYY-MM-DD 格式，直接返回
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
    return date.split('T')[0];
  }
  // 如果是日期对象，格式化
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.accounts-payable-management {
  padding: 0;
}

.search-form {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #f7fafc;
}

.button-group {
  margin-bottom: 24px;
}

.table-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  border: 1px solid #f7fafc;
  overflow: hidden;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f7fafc;
}

:deep(.el-table tr:hover > td) {
  background-color: #f7fafc;
}

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

.positive-balance {
  color: #ef4444;
  font-weight: 600;
}

.zero-balance {
  color: #10b981;
  font-weight: 600;
}
</style>
