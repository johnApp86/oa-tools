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
            <el-option 
              v-for="option in expenseTypeOptions" 
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
        <el-table-column prop="expense_type" label="费用类型" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getExpenseTypeLabel(row.expense_type) }}
          </template>
        </el-table-column>
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
        <el-table-column prop="apply_date" label="申请日期" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDate(row.apply_date) }}
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
      :title="form.id ? '编辑费用申请' : '新增费用申请'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="费用类型" prop="expense_type" required>
          <el-select v-model="form.expense_type" placeholder="请选择费用类型" style="width: 100%">
            <el-option 
              v-for="option in expenseTypeOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="申请金额" prop="amount" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入申请金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="申请日期" prop="application_date" required>
          <el-date-picker
            v-model="form.application_date"
            type="date"
            placeholder="请选择申请日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="费用描述" prop="description" required>
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入费用描述"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
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
import { getDictionary, getDictOptions } from '@/utils/dictionary';

const loading = ref(false);
const tableData = ref([]);

// 费用类型字典
const expenseTypeDict = ref({});
const expenseTypeOptions = ref([]);

// 加载费用类型字典
const loadExpenseTypeDict = async () => {
  try {
    expenseTypeDict.value = await getDictionary('finance_expense_type');
    expenseTypeOptions.value = await getDictOptions('finance_expense_type');
  } catch (error) {
    console.error('加载费用类型字典失败:', error);
    // 使用默认值
    expenseTypeDict.value = {
      travel: "差旅费",
      office: "办公费",
      communication: "通讯费",
      training: "培训费"
    };
    expenseTypeOptions.value = [
      { label: "差旅费", value: "travel" },
      { label: "办公费", value: "office" },
      { label: "通讯费", value: "communication" },
      { label: "培训费", value: "training" }
    ];
  }
};

// 获取费用类型标签
const getExpenseTypeLabel = (type) => {
  if (!type) return '-';
  // 优先使用字典
  if (expenseTypeDict.value[type]) {
    return expenseTypeDict.value[type];
  }
  // 回退到默认值
  const typeMap = {
    travel: "差旅费",
    office: "办公费",
    communication: "通讯费",
    training: "培训费"
  };
  return typeMap[type] || type || '-';
};

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
const submitLoading = ref(false);
const formRef = ref();
const form = reactive({
  id: null,
  expense_type: "",
  amount: 0,
  application_date: "",
  description: "",
  notes: ""
});

// 表单验证规则
const formRules = {
  expense_type: [{ required: true, message: "请选择费用类型", trigger: "change" }],
  amount: [
    { required: true, message: "请输入申请金额", trigger: "blur" },
    { type: "number", min: 0.01, message: "申请金额必须大于0", trigger: "blur" }
  ],
  application_date: [{ required: true, message: "请选择申请日期", trigger: "change" }],
  description: [{ required: true, message: "请输入费用描述", trigger: "blur" }]
};

const handleAdd = () => {
  resetForm();
  form.application_date = new Date().toISOString().split('T')[0];
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  // 尝试从category反向查找费用类型代码
  let expenseType = '';
  if (row.expense_type && expenseTypeDict.value) {
    // 如果expense_type是代码，直接使用
    if (expenseTypeDict.value[row.expense_type]) {
      expenseType = row.expense_type;
    } else {
      // 否则尝试从字典值中查找匹配的代码
      const foundType = expenseTypeOptions.value.find(opt => opt.label === row.expense_type || opt.label === row.category);
      expenseType = foundType ? foundType.value : '';
    }
  }
  
  Object.assign(form, {
    id: row.id,
    expense_type: expenseType || row.expense_type || '',
    amount: row.amount || 0,
    application_date: row.apply_date || row.application_date || new Date().toISOString().split('T')[0],
    description: row.description || row.expense_name || '',
    notes: row.notes || ''
  });
  dialogVisible.value = true;
};

const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: null,
    expense_type: "",
    amount: 0,
    application_date: "",
    description: "",
    notes: ""
  });
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  
  try {
    await formRef.value.validate();
    submitLoading.value = true;
    
    // category字段存储费用类型的中文标签（用于列表显示）
    // 后端查询会将category同时映射为expense_name和expense_type
    const expenseTypeLabel = getExpenseTypeLabel(form.expense_type);
    const submitData = {
      category: expenseTypeLabel, // 存储费用类型标签
      amount: parseFloat(form.amount),
      application_date: form.application_date,
      description: form.description || expenseTypeLabel, // 费用描述
      notes: form.notes || null
    };
    
    if (form.id) {
      ElMessage.info("更新费用申请功能开发中...");
      // TODO: 添加更新接口
      // await updateExpenseApplication(form.id, submitData);
      // dialogVisible.value = false;
      // await loadData();
    } else {
      await createExpenseApplication(submitData);
      ElMessage.success("创建成功");
      dialogVisible.value = false;
      await loadData();
    }
  } catch (error) {
    if (error !== false) { // 验证失败时返回false
      console.error("提交失败:", error);
    }
  } finally {
    submitLoading.value = false;
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
  // 处理数字状态（0=待审批, 1=已批准, 2=已拒绝）
  if (typeof status === 'number') {
    if (status === 1) return "success";
    if (status === 2) return "danger";
    return "warning";
  }
  // 处理字符串状态
  const statusMap = {
    pending: "warning",
    approved: "success",
    rejected: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  // 处理数字状态（0=待审批, 1=已批准, 2=已拒绝）
  if (typeof status === 'number') {
    if (status === 1) return "已批准";
    if (status === 2) return "已拒绝";
    return "待审批";
  }
  // 处理字符串状态
  const statusMap = {
    pending: "待审批",
    approved: "已批准",
    rejected: "已拒绝"
  };
  return statusMap[status] || status || "待审批";
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
  if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}/)) {
    return date.split('T')[0];
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
};

onMounted(() => {
  loadExpenseTypeDict();
  loadData();
});
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
