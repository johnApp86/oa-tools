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
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
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
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="invoice_no" label="发票号" width="150" />
        <el-table-column prop="supplier_name" label="供应商名称" width="200" />
        <el-table-column prop="amount" label="应付金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="paid_amount" label="已付金额" width="120" align="right">
          <template #default="{ row }">
            {{ formatCurrency(row.paid_amount) }}
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
        <el-table-column label="操作" width="200" fixed="right">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, CreditCard } from "@element-plus/icons-vue";

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
        invoice_no: "INV-SUP-001",
        supplier_name: "供应商A",
        amount: 25000,
        paid_amount: 10000,
        balance: 15000,
        due_date: "2025-11-30",
        status: "partial",
      },
      {
        id: 2,
        invoice_no: "INV-SUP-002",
        supplier_name: "供应商B",
        amount: 15000,
        paid_amount: 15000,
        balance: 0,
        due_date: "2025-11-15",
        status: "paid",
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

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.status = "";
  loadData();
};

const handleAdd = () => {
  ElMessage.info("新增应付功能开发中...");
};

const handleEdit = () => {
  ElMessage.info("编辑功能开发中...");
};

const handlePay = () => {
  ElMessage.info("付款功能开发中...");
};

const handleBatchPay = () => {
  ElMessage.info("批量付款功能开发中...");
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除应付账"${row.invoice_no}"吗？`,
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
    unpaid: "未付款",
    partial: "部分付款",
    paid: "已付款",
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
