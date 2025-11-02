<template>
  <div class="cost-accounting-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="请输入成本中心或项目名称" clearable />
        </el-form-item>
        <el-form-item label="成本类型">
          <el-select v-model="searchForm.costType" placeholder="请选择类型" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="直接材料" value="direct_material" />
            <el-option label="直接人工" value="direct_labor" />
            <el-option label="制造费用" value="manufacturing" />
            <el-option label="间接费用" value="indirect" />
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
        新增成本中心
      </el-button>
      <el-button type="success" @click="handleAllocate">
        <el-icon><Plus /></el-icon>
        成本分配
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="cost_center_code" label="成本中心编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="cost_center_name" label="成本中心名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="cost_type" label="成本类型" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getCostTypeLabel(row.cost_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="budget_amount" label="预算金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.budget_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="actual_amount" label="实际金额" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.actual_amount) }}
          </template>
        </el-table-column>
        <el-table-column prop="variance" label="差异" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            <span :class="getVarianceClass(row.variance)">
              {{ formatCurrency(row.variance) }}
            </span>
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
      :title="form.id ? '编辑成本中心' : '新增成本中心'"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
        v-loading="submitLoading"
      >
        <el-form-item label="成本中心名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入成本中心名称" />
        </el-form-item>
        <el-form-item label="成本中心代码" prop="code" required>
          <el-input v-model="form.code" placeholder="请输入成本中心代码" />
        </el-form-item>
        <el-form-item label="成本类型" prop="cost_type">
          <el-select v-model="form.cost_type" placeholder="请选择成本类型" style="width: 100%">
            <el-option label="直接材料" value="direct_material" />
            <el-option label="直接人工" value="direct_labor" />
            <el-option label="制造费用" value="manufacturing" />
            <el-option label="间接费用" value="indirect" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入成本中心描述"
          />
        </el-form-item>
        <el-form-item label="上级中心" prop="parent_id">
          <el-input-number
            v-model="form.parent_id"
            :min="0"
            placeholder="请输入上级成本中心ID（0表示无上级）"
            style="width: 100%"
          />
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
  getCostCenters,
  createCostCenter,
  updateCostCenter,
  deleteCostCenter
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  costType: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      costType: searchForm.costType || ''
    };
    const response = await getCostCenters(params);
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
  searchForm.costType = "";
  loadData();
};
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const form = reactive({
  id: null,
  name: "",
  code: "",
  cost_type: "",
  description: "",
  parent_id: 0,
  status: 1
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入成本中心名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入成本中心代码", trigger: "blur" }]
};

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  Object.assign(form, {
    id: row.id,
    name: row.cost_center_name || row.name || "",
    code: row.cost_center_code || row.code || "",
    cost_type: row.cost_type || "",
    description: row.description || "",
    parent_id: row.parent_id !== undefined ? row.parent_id : 0,
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
    code: "",
    cost_type: "",
    description: "",
    parent_id: 0,
    status: 1
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
      code: form.code,
      cost_type: form.cost_type || null,
      description: form.description || null,
      parent_id: form.parent_id || 0,
      status: form.status !== undefined ? form.status : 1
    };

    if (form.id) {
      await updateCostCenter(form.id, submitData);
      ElMessage.success("更新成功");
    } else {
      await createCostCenter(submitData);
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

const handleAllocate = () => ElMessage.info("成本分配功能开发中...");
const handleDetail = () => ElMessage.info("详情功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除成本中心"${row.name || row.cost_center_name}"吗？`, "确认删除");
    await deleteCostCenter(row.id);
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
  }
};

const getVarianceClass = (variance) => {
  return variance < 0 ? "positive-variance" : variance > 0 ? "negative-variance" : "zero-variance";
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "0.00";
  return Number(amount).toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// 获取成本类型标签
const getCostTypeLabel = (type) => {
  const typeMap = {
    direct_material: "直接材料",
    direct_labor: "直接人工",
    manufacturing: "制造费用",
    indirect: "间接费用"
  };
  return typeMap[type] || type || "-";
};

onMounted(() => loadData());
</script>

<style scoped>
.cost-accounting-management { padding: 0; }
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
.positive-variance { color: #10b981; font-weight: 600; }
.negative-variance { color: #ef4444; font-weight: 600; }
.zero-variance { color: #6b7280; font-weight: 600; }
</style>
