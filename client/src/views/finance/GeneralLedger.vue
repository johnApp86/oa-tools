<template>
  <div class="general-ledger-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入科目代码或名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="科目类型">
          <el-select 
            v-model="searchForm.accountType" 
            placeholder="请选择科目类型" 
            clearable
            style="width: 200px"
            :popper-append-to-body="false"
          >
            <el-option 
              v-for="option in accountTypeOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
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
        新增科目
      </el-button>
      <el-button type="success" @click="handleImport">
        <el-icon><Upload /></el-icon>
        导入科目
      </el-button>
      <el-button type="warning" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出科目
      </el-button>
    </div>

    <!-- 科目表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        style="width: 100%"
        table-layout="fixed"
      >
        <el-table-column prop="code" label="科目代码" width="120" show-overflow-tooltip />
        <el-table-column prop="name" label="科目名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="科目类型" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="140" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            <span :class="getBalanceClass(row.balance)">
              {{ formatCurrency(row.balance) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="debit_balance" label="借方余额" width="140" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatCurrency(row.debit_balance) }}
          </template>
        </el-table-column>
        <el-table-column prop="credit_balance" label="贷方余额" width="140" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatCurrency(row.credit_balance) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="handleAddChild(row)">
                添加子科目
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 科目表单对话框 -->
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
        <el-form-item label="科目代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入科目代码" />
        </el-form-item>
        <el-form-item label="科目名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入科目名称" />
        </el-form-item>
        <el-form-item label="科目类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择科目类型" style="width: 100%">
            <el-option 
              v-for="option in accountTypeOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="父级科目" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="accountTree"
            :props="{ value: 'id', label: 'name', children: 'children' }"
            placeholder="请选择父级科目"
            clearable
            check-strictly
          />
        </el-form-item>
        <el-form-item label="余额方向" prop="balanceDirection">
          <el-radio-group v-model="form.balanceDirection">
            <el-radio label="debit">借方</el-radio>
            <el-radio label="credit">贷方</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Upload, Download } from "@element-plus/icons-vue";
import { 
  getGeneralLedgerAccounts, 
  createGeneralLedgerAccount,
  updateGeneralLedgerAccount,
  deleteGeneralLedgerAccount
} from "@/api/finance";
import { getDictionary, getDictOptions, getDictLabelSync } from '@/utils/dictionary';

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const accountTree = ref([]);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
  accountType: "",
});

// 表单数据
const form = reactive({
  id: null,
  code: "",
  name: "",
  type: "",
  parentId: 0,
  balanceDirection: "debit",
  status: 1,
  remark: "",
});

// 表单验证规则
const formRules = {
  code: [{ required: true, message: "请输入科目代码", trigger: "blur" }],
  name: [{ required: true, message: "请输入科目名称", trigger: "blur" }],
  type: [{ required: true, message: "请选择科目类型", trigger: "change" }],
};

// 计算属性
const dialogTitle = computed(() => {
  if (form.id) {
    return "编辑科目";
  } else if (form.parentId && form.parentId !== 0) {
    return "添加子科目";
  } else {
    return "新增科目";
  }
});

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: 1,
      limit: 1000, // 获取所有数据
      keyword: searchForm.keyword || '',
      type: searchForm.accountType || ''
    };
    
    const response = await getGeneralLedgerAccounts(params);
    
    // 转换数据格式
    const accounts = response.data || [];
    
    // 将后端数据格式转换为前端需要的格式
    tableData.value = accounts.map(account => ({
      ...account,
      parentId: account.parent_id || 0,
      // 余额字段，如果后端没有返回，使用默认值0
      balance: 0,
      debit_balance: 0,
      credit_balance: 0,
      children: []
    }));
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const loadAccountTree = async () => {
  try {
    // 从账户列表构建树形结构
    const response = await getGeneralLedgerAccounts({ page: 1, limit: 1000 });
    const accounts = response.data || [];
    
    // 构建树形结构
    const buildTree = (items, parentId = 0) => {
      return items
        .filter(item => (item.parent_id || 0) === parentId)
        .map(item => ({
          id: item.id,
          name: `${item.code} - ${item.name}`,
          children: buildTree(items, item.id)
        }));
    };
    
    accountTree.value = buildTree(accounts);
    
    // 如果没有数据，显示空数组
    if (accountTree.value.length === 0) {
      accountTree.value = [];
    }
  } catch (error) {
    console.error("加载科目树失败:", error);
    accountTree.value = [];
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.accountType = "";
  loadData();
};

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    code: "",
    name: "",
    type: "",
    parentId: 0,
    balanceDirection: "debit",
    status: 1,
    remark: "",
  });
  dialogVisible.value = true;
  loadAccountTree();
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    parentId: row.parentId,
    balanceDirection: row.balanceDirection || "debit",
    status: row.status,
    remark: row.remark || "",
  });
  dialogVisible.value = true;
  loadAccountTree();
};

const handleAddChild = (row) => {
  Object.assign(form, {
    id: null,
    code: "",
    name: "",
    type: "",
    parentId: row.id,
    balanceDirection: "debit",
    status: 1,
    remark: "",
  });
  dialogVisible.value = true;
  loadAccountTree();
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除科目"${row.name}"吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await deleteGeneralLedgerAccount(row.id);
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
    // 用户取消删除
  }
};

const handleImport = () => {
  ElMessage.info("导入功能开发中...");
};

const handleExport = () => {
  ElMessage.info("导出功能开发中...");
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    
    // 准备提交数据
    const submitData = {
      code: form.code,
      name: form.name,
      type: form.type,
      parent_id: form.parentId || 0,
      level: form.parentId ? 2 : 1,
      status: form.status || 1
    };
    
    if (form.id) {
      // 更新逻辑
      await updateGeneralLedgerAccount(form.id, submitData);
      dialogVisible.value = false;
      await loadData();
    } else {
      // 创建新科目
      await createGeneralLedgerAccount(submitData);
      dialogVisible.value = false;
      await loadData();
    }
  } catch (error) {
    console.error("提交失败:", error);
    // ElMessage 会在 API 拦截器中自动显示，这里不需要再次显示
  } finally {
    submitLoading.value = false;
  }
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
};

const getTypeTagType = (type) => {
  const typeMap = {
    asset: "success",
    liability: "warning",
    equity: "info",
    revenue: "primary",
    expense: "danger"
  };
  return typeMap[type] || "info";
};

// 科目类型字典缓存
const accountTypeDict = ref({});
const accountTypeOptions = ref([]);

// 加载科目类型字典
const loadAccountTypeDict = async () => {
  try {
    accountTypeDict.value = await getDictionary('finance_account_type');
    accountTypeOptions.value = await getDictOptions('finance_account_type');
  } catch (error) {
    console.error('加载科目类型字典失败:', error);
    // 使用默认值
    accountTypeDict.value = {
      asset: "资产",
      liability: "负债",
      equity: "所有者权益",
      revenue: "收入",
      expense: "费用"
    };
    accountTypeOptions.value = [
      { label: "资产", value: "asset" },
      { label: "负债", value: "liability" },
      { label: "所有者权益", value: "equity" },
      { label: "收入", value: "revenue" },
      { label: "费用", value: "expense" }
    ];
  }
};

const getTypeLabel = (type) => {
  if (!type) return type || '-';
  // 优先使用字典
  if (accountTypeDict.value[type]) {
    return accountTypeDict.value[type];
  }
  // 回退到默认值
  const defaultMap = {
    asset: "资产",
    liability: "负债",
    equity: "所有者权益",
    revenue: "收入",
    expense: "费用"
  };
  return defaultMap[type] || type;
};

const getBalanceClass = (balance) => {
  return balance >= 0 ? "positive-balance" : "negative-balance";
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
  loadAccountTypeDict();
  loadData();
  loadAccountTree();
});
</script>

<style scoped>
.general-ledger-management {
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

.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.operation-buttons .el-button {
  flex-shrink: 0;
}

.positive-balance {
  color: #10b981;
  font-weight: 600;
}

.negative-balance {
  color: #ef4444;
  font-weight: 600;
}

.dialog-footer {
  text-align: right;
}
</style>
