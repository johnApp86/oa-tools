<template>
  <div class="cash-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入账户名称或编号" clearable />
        </el-form-item>
        <el-form-item label="账户类型">
          <el-select v-model="searchForm.accountType" placeholder="请选择类型" clearable>
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
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="account_code" label="账户编号" width="150" />
        <el-table-column prop="account_name" label="账户名称" width="200" />
        <el-table-column prop="account_type" label="账户类型" width="120" />
        <el-table-column prop="bank_name" label="开户银行" width="200" />
        <el-table-column prop="balance" label="余额" width="120" align="right">
          <template #default="{ row }">
            <span :class="getBalanceClass(row.balance)">
              {{ formatCurrency(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
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
  accountType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const mockData = [
      {
        id: 1,
        account_code: "CASH-001",
        account_name: "现金账户",
        account_type: "cash",
        bank_name: "-",
        balance: 10000,
        status: 1,
      },
      {
        id: 2,
        account_code: "BANK-001",
        account_name: "工商银行",
        account_type: "bank",
        bank_name: "中国工商银行",
        balance: 500000,
        status: 1,
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
  searchForm.accountType = "";
  loadData();
};
const handleAdd = () => ElMessage.info("新增账户功能开发中...");
const handleEdit = () => ElMessage.info("编辑功能开发中...");
const handleTransfer = () => ElMessage.info("资金调拨功能开发中...");
const handleTransaction = () => ElMessage.info("交易记录功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除账户"${row.account_name}"吗？`, "确认删除");
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {}
};

const getBalanceClass = (balance) => {
  return balance >= 0 ? "positive-balance" : "negative-balance";
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
.operation-buttons { display: flex; gap: 8px; }
.positive-balance { color: #10b981; font-weight: 600; }
.negative-balance { color: #ef4444; font-weight: 600; }
</style>
