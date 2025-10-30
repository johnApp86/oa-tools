<template>
  <div class="accounts-receivable-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入客户名称或发票号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="未收款" value="unpaid" />
            <el-option label="部分收款" value="partial" />
            <el-option label="已收款" value="paid" />
            <el-option label="逾期" value="overdue" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
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
        新增应收
      </el-button>
      <el-button type="success" @click="handleBatchReceive">
        <el-icon><CreditCard /></el-icon>
        批量收款
      </el-button>
      <el-button type="warning" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出数据
      </el-button>
    </div>

    <!-- 应收账表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="invoice_no" label="发票号" width="150" />
        <el-table-column prop="customer_name" label="客户名称" width="200" />
        <el-table-column prop="amount" label="应收金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="received_amount" label="已收金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.received_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" align="right">
          <template #default="{ row }">
            <span :class="getBalanceClass(row.balance)">
              {{ formatCurrency(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="到期日期" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="success" @click="handleReceive(row)">
                收款
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 应收账表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="发票号" prop="invoice_no">
          <el-input v-model="form.invoice_no" placeholder="请输入发票号" />
        </el-form-item>
        <el-form-item label="客户名称" prop="customer_name">
          <el-input v-model="form.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="应收金额" prop="amount">
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入应收金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="到期日期" prop="due_date">
          <el-date-picker
            v-model="form.due_date"
            type="date"
            placeholder="请选择到期日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 收款对话框 -->
    <el-dialog
      v-model="receiveDialogVisible"
      title="收款"
      width="400px"
    >
      <el-form
        ref="receiveFormRef"
        :model="receiveForm"
        :rules="receiveFormRules"
        label-width="100px"
      >
        <el-form-item label="收款金额" prop="amount">
          <el-input-number
            v-model="receiveForm.amount"
            :precision="2"
            :min="0"
            :max="receiveForm.maxAmount"
            placeholder="请输入收款金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="收款方式" prop="payment_method">
          <el-select v-model="receiveForm.payment_method" placeholder="请选择收款方式">
            <el-option label="现金" value="cash" />
            <el-option label="银行转账" value="bank_transfer" />
            <el-option label="支票" value="check" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="收款日期" prop="receive_date">
          <el-date-picker
            v-model="receiveForm.receive_date"
            type="date"
            placeholder="请选择收款日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input
            v-model="receiveForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="receiveDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="receiveLoading" @click="handleReceiveSubmit">
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, CreditCard, Download } from "@element-plus/icons-vue";

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const selectedRows = ref([]);
const dialogVisible = ref(false);
const receiveDialogVisible = ref(false);
const submitLoading = ref(false);
const receiveLoading = ref(false);
const formRef = ref();
const receiveFormRef = ref();

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

// 搜索表单
const searchForm = reactive({
  keyword: "",
  status: "",
  dateRange: [],
});

// 表单数据
const form = reactive({
  id: null,
  invoice_no: "",
  customer_name: "",
  amount: 0,
  due_date: "",
  remark: "",
});

// 收款表单
const receiveForm = reactive({
  amount: 0,
  maxAmount: 0,
  payment_method: "",
  receive_date: "",
  remark: "",
});

// 表单验证规则
const formRules = {
  invoice_no: [{ required: true, message: "请输入发票号", trigger: "blur" }],
  customer_name: [{ required: true, message: "请输入客户名称", trigger: "blur" }],
  amount: [{ required: true, message: "请输入应收金额", trigger: "blur" }],
  due_date: [{ required: true, message: "请选择到期日期", trigger: "change" }],
};

const receiveFormRules = {
  amount: [{ required: true, message: "请输入收款金额", trigger: "blur" }],
  payment_method: [{ required: true, message: "请选择收款方式", trigger: "change" }],
  receive_date: [{ required: true, message: "请选择收款日期", trigger: "change" }],
};

// 计算属性
const dialogTitle = computed(() => (form.id ? "编辑应收账" : "新增应收账"));

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    // 模拟数据
    const mockData = [
      {
        id: 1,
        invoice_no: "INV-2025-001",
        customer_name: "ABC公司",
        amount: 50000,
        received_amount: 20000,
        balance: 30000,
        due_date: "2025-11-30",
        status: "partial",
        created_at: "2025-10-30 17:00:00",
      },
      {
        id: 2,
        invoice_no: "INV-2025-002",
        customer_name: "XYZ公司",
        amount: 30000,
        received_amount: 30000,
        balance: 0,
        due_date: "2025-11-15",
        status: "paid",
        created_at: "2025-10-30 17:00:00",
      },
      {
        id: 3,
        invoice_no: "INV-2025-003",
        customer_name: "DEF公司",
        amount: 80000,
        received_amount: 0,
        balance: 80000,
        due_date: "2025-10-15",
        status: "overdue",
        created_at: "2025-10-30 17:00:00",
      }
    ];
    tableData.value = mockData;
    pagination.total = mockData.length;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.status = "";
  searchForm.dateRange = [];
  handleSearch();
};

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    invoice_no: "",
    customer_name: "",
    amount: 0,
    due_date: "",
    remark: "",
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    invoice_no: row.invoice_no,
    customer_name: row.customer_name,
    amount: row.amount,
    due_date: row.due_date,
    remark: row.remark || "",
  });
  dialogVisible.value = true;
};

const handleReceive = (row) => {
  Object.assign(receiveForm, {
    amount: row.balance,
    maxAmount: row.balance,
    payment_method: "",
    receive_date: new Date().toISOString().split('T')[0],
    remark: "",
  });
  receiveDialogVisible.value = true;
};

const handleBatchReceive = () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning("请选择要收款的记录");
    return;
  }
  ElMessage.info("批量收款功能开发中...");
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应收账"${row.invoice_no}"吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    // 用户取消删除
  }
};

const handleExport = () => {
  ElMessage.info("导出功能开发中...");
};

const handleSelectionChange = (selection) => {
  selectedRows.value = selection;
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success(form.id ? "更新成功" : "创建成功");
    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

const handleReceiveSubmit = async () => {
  if (!receiveFormRef.value) return;
  
  try {
    await receiveFormRef.value.validate();
    receiveLoading.value = true;
    
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    ElMessage.success("收款成功");
    receiveDialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error("收款失败:", error);
    ElMessage.error("收款失败");
  } finally {
    receiveLoading.value = false;
  }
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
};

const handleSizeChange = (val) => {
  pagination.limit = val;
  loadData();
};

const handleCurrentChange = (val) => {
  pagination.page = val;
  loadData();
};

const getStatusTagType = (status) => {
  const statusMap = {
    unpaid: "info",
    partial: "warning",
    paid: "success",
    overdue: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = {
    unpaid: "未收款",
    partial: "部分收款",
    paid: "已收款",
    overdue: "逾期"
  };
  return statusMap[status] || status;
};

const getBalanceClass = (balance) => {
  return balance > 0 ? "positive-balance" : "zero-balance";
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return "0.00";
  return Number(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.accounts-receivable-management {
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

.pagination-container {
  margin-top: 24px;
  text-align: right;
}

/* 表格样式优化 */
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
}

.positive-balance {
  color: #ef4444;
  font-weight: 600;
}

.zero-balance {
  color: #10b981;
  font-weight: 600;
}

.dialog-footer {
  text-align: right;
}
</style>
