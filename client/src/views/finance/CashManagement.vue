<template>
  <div class="cash-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入账户名称或编号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="账户类型">
          <el-select v-model="searchForm.accountType" placeholder="请选择类型" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="现金" value="cash" />
            <el-option label="银行存款" value="bank" />
            <el-option label="其他" value="other" />
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
        新增账户
      </el-button>
      <el-button type="success" @click="handleTransfer">
        <el-icon><Plus /></el-icon>
        资金调拨
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip/>
        <el-table-column prop="name" label="账户名称" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="account_type" label="账户类型" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getAccountTypeLabel(row.account_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="bank_name" label="开户银行" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.bank_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="account_number" label="账号" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.account_number || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="getBalanceClass(row.balance)">
              {{ formatCurrency(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="handleTransaction(row)">
                交易记录
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
      :title="form.id ? '编辑账户' : '新增账户'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
        v-loading="submitLoading"
      >
        <el-form-item label="账户名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="账户类型" prop="account_type" required>
          <el-select v-model="form.account_type" placeholder="请选择账户类型" style="width: 100%">
            <el-option label="现金" value="cash" />
            <el-option label="银行存款" value="bank" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="开户银行" prop="bank_name">
          <el-input v-model="form.bank_name" placeholder="请输入开户银行（可选）" />
        </el-form-item>
        <el-form-item label="账号" prop="account_number">
          <el-input v-model="form.account_number" placeholder="请输入账号（可选）" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import {
  getCashAccounts,
  createCashAccount,
  updateCashAccount,
  deleteCashAccount
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  accountType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      account_type: searchForm.accountType
    };
    const response = await getCashAccounts(params);
    tableData.value = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
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
  searchForm.accountType = "";
  loadData();
};

const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const form = reactive({
  id: null,
  name: "",
  account_type: "",
  bank_name: "",
  account_number: "",
  status: 1
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入账户名称", trigger: "blur" }],
  account_type: [{ required: true, message: "请选择账户类型", trigger: "change" }]
};

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  Object.assign(form, {
    id: row.id,
    name: row.name || "",
    account_type: row.account_type || "",
    bank_name: row.bank_name || "",
    account_number: row.account_number || "",
    status: row.status !== undefined ? row.status : 1
  });
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: null,
    name: "",
    account_type: "",
    bank_name: "",
    account_number: "",
    status: 1
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const submitData = {
      name: form.name,
      account_type: form.account_type,
      bank_name: form.bank_name || null,
      account_number: form.account_number || null,
      status: form.status !== undefined ? form.status : 1
    };

    if (form.id) {
      await updateCashAccount(form.id, submitData);
      ElMessage.success("更新成功");
    } else {
      await createCashAccount(submitData);
      ElMessage.success("创建成功");
    }
    
    dialogVisible.value = false;
    resetForm();
    await loadData();
  } catch (error) {
    if (error !== false) {
      console.error("提交失败:", error);
      ElMessage.error(error.message || "操作失败");
    }
  } finally {
    submitLoading.value = false;
  }
};

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleTransfer = () => ElMessage.info("资金调拨功能开发中...");
const handleTransaction = () => ElMessage.info("交易记录功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除账户"${row.name}"吗？`, "确认删除");
    await deleteCashAccount(row.id);
    ElMessage.success("删除成功");
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
      ElMessage.error(error.message || "删除失败");
    }
  }
};

const getBalanceClass = (balance) => {
  return balance >= 0 ? "positive-balance" : "negative-balance";
};

const getAccountTypeLabel = (type) => {
  const typeMap = {
    cash: "现金",
    bank: "银行存款",
    other: "其他"
  };
  return typeMap[type] || type || "-";
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
.cash-management { padding: 0; }
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
.positive-balance { color: #10b981; font-weight: 600; }
.negative-balance { color: #ef4444; font-weight: 600; }
</style>
