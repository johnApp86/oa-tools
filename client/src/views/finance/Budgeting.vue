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
        <el-form-item label="预算名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入预算名称" />
        </el-form-item>
        <el-form-item label="预算年度" prop="year" required>
          <el-date-picker
            v-model="form.year"
            type="year"
            placeholder="请选择预算年度"
            format="YYYY"
            value-format="YYYY"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="部门" prop="department">
          <el-input v-model="form.department" placeholder="请输入部门名称（可选）" />
        </el-form-item>
        <el-form-item label="预算类别" prop="category">
          <el-select v-model="form.category" placeholder="请选择预算类别" style="width: 100%">
            <el-option 
              v-for="option in budgetCategoryOptions" 
              :key="option.value"
              :label="option.label" 
              :value="option.value" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="预算金额" prop="amount" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入预算金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入预算描述（可选）"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="草稿" :value="0" />
            <el-option label="已批准" :value="1" />
            <el-option label="待审批" :value="2" />
            <el-option label="已拒绝" :value="3" />
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
import { Plus, Check } from "@element-plus/icons-vue";
import {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget
} from "@/api/finance";
import { getDictionary, getDictOptions } from '@/utils/dictionary';

const loading = ref(false);
const tableData = ref([]);

// 预算类别字典
const budgetCategoryDict = ref({});
const budgetCategoryOptions = ref([]);

// 加载预算类别字典
const loadBudgetCategoryDict = async () => {
  try {
    budgetCategoryDict.value = await getDictionary('finance_budget_category');
    budgetCategoryOptions.value = await getDictOptions('finance_budget_category');
  } catch (error) {
    console.error('加载预算类别字典失败:', error);
    // 使用默认值（需要映射旧的中文值到新的值）
    budgetCategoryDict.value = {
      income: "收入预算",
      expense: "支出预算",
      capital: "资本预算",
      other: "其他"
    };
    budgetCategoryOptions.value = [
      { label: "收入预算", value: "income" },
      { label: "支出预算", value: "expense" },
      { label: "资本预算", value: "capital" },
      { label: "其他", value: "other" }
    ];
  }
};

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
const submitLoading = ref(false);
const formRef = ref();
const form = reactive({
  id: null,
  name: "",
  year: "",
  department: "",
  category: "",
  amount: 0,
  description: "",
  status: 0
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入预算名称", trigger: "blur" }],
  year: [{ required: true, message: "请选择预算年度", trigger: "change" }],
  amount: [
    { required: true, message: "请输入预算金额", trigger: "blur" },
    { type: "number", min: 0, message: "预算金额必须大于等于0", trigger: "blur" }
  ]
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
    year: row.year ? String(row.year) : (row.budget_year ? String(row.budget_year) : String(new Date().getFullYear())),
    department: row.department || "",
    category: row.category || "",
    amount: row.amount || row.budget_amount || 0,
    description: row.description || "",
    status: row.status !== undefined ? row.status : 0
  });
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: null,
    name: "",
    year: String(new Date().getFullYear()),
    department: "",
    category: "",
    amount: 0,
    description: "",
    status: 0
  });
};

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false;
  resetForm();
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const submitData = {
      name: form.name,
      year: parseInt(form.year) || new Date().getFullYear(),
      department: form.department || null,
      category: form.category || null,
      amount: parseFloat(form.amount) || 0,
      description: form.description || null,
      status: form.status !== undefined ? form.status : 0
    };

    if (form.id) {
      await updateBudget(form.id, submitData);
      ElMessage.success("更新成功");
    } else {
      await createBudget(submitData);
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

onMounted(() => {
  loadBudgetCategoryDict();
  loadData();
});
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
