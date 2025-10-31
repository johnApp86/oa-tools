<template>
  <div class="tax-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入税种或纳税人" clearable />
        </el-form-item>
        <el-form-item label="税种">
          <el-select v-model="searchForm.taxType" placeholder="请选择税种" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="增值税" value="vat" />
            <el-option label="企业所得税" value="corporate_income" />
            <el-option label="个人所得税" value="personal_income" />
            <el-option label="印花税" value="stamp" />
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
        新增税务
      </el-button>
      <el-button type="success" @click="handleCalculate">
        <el-icon><Plus /></el-icon>
        计算税款
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip/>
        <el-table-column prop="tax_type" label="税种" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getTaxTypeLabel(row.tax_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="period" label="申报期间" width="120" show-overflow-tooltip/>
        <el-table-column prop="amount" label="税额" width="120" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatCurrency(row.amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="declaration_date" label="申报日期" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDate(row.declaration_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日期" width="120" show-overflow-tooltip>
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
              <el-button size="small" type="primary" @click="handleDeclare(row)">
                申报
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
      :title="form.id ? '编辑税务申报' : '新增税务申报'"
      width="500px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item label="税种" prop="tax_type" required>
          <el-select v-model="form.tax_type" placeholder="请选择税种" style="width: 100%">
            <el-option label="增值税" value="vat" />
            <el-option label="企业所得税" value="corporate_income" />
            <el-option label="个人所得税" value="personal_income" />
            <el-option label="印花税" value="stamp" />
            <el-option label="城市维护建设税" value="urban_maintenance" />
            <el-option label="教育费附加" value="education_surcharge" />
          </el-select>
        </el-form-item>
        <el-form-item label="申报期间" prop="period" required>
          <el-date-picker
            v-model="form.period"
            type="month"
            placeholder="请选择申报期间"
            format="YYYY-MM"
            value-format="YYYY-MM"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="税额" prop="amount" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入税额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="申报日期" prop="declaration_date">
          <el-date-picker
            v-model="form.declaration_date"
            type="date"
            placeholder="请选择申报日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="截止日期" prop="due_date">
          <el-date-picker
            v-model="form.due_date"
            type="date"
            placeholder="请选择截止日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
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
import { Plus } from "@element-plus/icons-vue";
import {
  getTaxDeclarations,
  createTaxDeclaration,
  updateTaxDeclaration,
  deleteTaxDeclaration
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  taxType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      tax_type: searchForm.taxType
    };
    const response = await getTaxDeclarations(params);
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
  searchForm.taxType = "";
  loadData();
};
const dialogVisible = ref(false);
const form = reactive({
  id: null,
  tax_type: "",
  period: "",
  amount: 0,
  declaration_date: "",
  due_date: "",
  description: ""
});

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    tax_type: "",
    period: "",
    amount: 0,
    declaration_date: "",
    due_date: "",
    description: ""
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    tax_type: row.tax_type || "",
    period: row.period || "",
    amount: row.amount || row.tax_amount || 0,
    declaration_date: row.declaration_date || "",
    due_date: row.due_date || "",
    description: row.description || ""
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    if (!form.tax_type) {
      ElMessage.warning("请选择税种");
      return;
    }
    if (!form.period) {
      ElMessage.warning("请选择申报期间");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      ElMessage.warning("请输入有效的税额");
      return;
    }

    const submitData = {
      tax_type: form.tax_type,
      period: form.period,
      amount: parseFloat(form.amount),
      declaration_date: form.declaration_date || null,
      due_date: form.due_date || null,
      description: form.description || ""
    };
    
    if (form.id) {
      await updateTaxDeclaration(form.id, submitData);
      ElMessage.success("更新成功");
    } else {
      await createTaxDeclaration(submitData);
      ElMessage.success("创建成功");
    }
    
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error(error.message || "操作失败");
  }
};

const handleCalculate = () => ElMessage.info("计算税款功能开发中...");
const handleDeclare = () => ElMessage.info("申报功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除税务"${row.tax_name || row.tax_type}"吗？`, "确认删除");
    await deleteTaxDeclaration(row.id);
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
  }
};

const getStatusTagType = (status) => {
  // 处理数字状态（1=已申报，0=待申报）
  if (typeof status === 'number') {
    return status === 1 ? "success" : "warning";
  }
  // 处理字符串状态
  const statusMap = {
    pending: "warning",
    declared: "success",
    approved: "success",
    overdue: "danger",
    rejected: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  // 处理数字状态（1=已申报，0=待申报）
  if (typeof status === 'number') {
    return status === 1 ? "已申报" : "待申报";
  }
  // 处理字符串状态
  const statusMap = {
    pending: "待申报",
    declared: "已申报",
    approved: "已审批",
    overdue: "逾期",
    rejected: "已拒绝"
  };
  return statusMap[status] || status || "未知";
};

const getTaxTypeLabel = (taxType) => {
  const taxTypeMap = {
    vat: "增值税",
    corporate_income: "企业所得税",
    personal_income: "个人所得税",
    stamp: "印花税",
    urban_maintenance: "城市维护建设税",
    education_surcharge: "教育费附加"
  };
  return taxTypeMap[taxType] || taxType || "未知";
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

onMounted(() => loadData());
</script>

<style scoped>
.tax-management { padding: 0; }
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
