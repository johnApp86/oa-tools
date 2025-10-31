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
        <el-table-column prop="tax_code" label="税务编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="tax_name" label="税种名称" width="150" show-overflow-tooltip/>
        <el-table-column prop="tax_type" label="税种类型" width="120" show-overflow-tooltip/>
        <el-table-column prop="taxable_amount" label="应税金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.taxable_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="tax_rate" label="税率" width="100" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ row.tax_rate }}%
          </template>
        </el-table-column>
        <el-table-column prop="tax_amount" label="税额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.tax_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="申报期限" width="120" show-overflow-tooltip/>
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
        <el-form-item label="税种" required>
          <el-input v-model="form.tax_type" placeholder="请输入税种" />
        </el-form-item>
        <el-form-item label="申报期间" required>
          <el-input v-model="form.period" placeholder="请输入申报期间，如：2025-10" />
        </el-form-item>
        <el-form-item label="税额" required>
          <el-input-number
            v-model="form.amount"
            :precision="2"
            :min="0"
            placeholder="请输入税额"
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
  amount: 0
});

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    tax_type: "",
    period: "",
    amount: 0
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    tax_type: row.tax_type,
    period: row.period,
    amount: row.amount || row.tax_amount
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    const submitData = {
      tax_type: form.tax_type,
      period: form.period,
      amount: parseFloat(form.amount)
    };
    
    if (form.id) {
      await updateTaxDeclaration(form.id, submitData);
    } else {
      await createTaxDeclaration(submitData);
    }
    
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error("提交失败:", error);
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
  const statusMap = {
    pending: "warning",
    declared: "success",
    overdue: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = {
    pending: "待申报",
    declared: "已申报",
    overdue: "逾期"
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
