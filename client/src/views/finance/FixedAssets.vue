<template>
  <div class="fixed-assets-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入资产名称或编号"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="资产状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="在用" value="active" />
            <el-option label="闲置" value="idle" />
            <el-option label="报废" value="scrapped" />
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
        新增资产
      </el-button>
      <el-button type="success" @click="handleDepreciation">
        <el-icon><Plus /></el-icon>
        计提折旧
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip/>
        <el-table-column prop="code" label="资产编号" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.code || (row.id ? `FA-${String(row.id).padStart(3, '0')}` : '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="name" label="资产名称" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="资产类别" width="120" show-overflow-tooltip/>
        <el-table-column prop="purchase_price" label="购买价格" width="120" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatCurrency(row.purchase_price) }}
          </template>
        </el-table-column>
        <el-table-column prop="purchase_date" label="购买日期" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatDate(row.purchase_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="depreciation_method" label="折旧方法" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getDepreciationMethodLabel(row.depreciation_method) }}
          </template>
        </el-table-column>
        <el-table-column prop="useful_life" label="使用年限" width="100" align="right" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.useful_life ? row.useful_life + '年' : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" show-overflow-tooltipfixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="warning" @click="handleMaintenance(row)">
                维护
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
      :title="form.id ? '编辑资产' : '新增资产'"
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
        <el-form-item label="资产编号" prop="code">
          <el-input v-model="form.code" placeholder="请输入资产编号（如：FA-001）" />
        </el-form-item>
        <el-form-item label="资产名称" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="资产类别" prop="category" required>
          <el-select v-model="form.category" placeholder="请选择资产类别" style="width: 100%">
            <el-option label="电子设备" value="电子设备" />
            <el-option label="办公家具" value="办公家具" />
            <el-option label="机械设备" value="机械设备" />
            <el-option label="车辆" value="车辆" />
            <el-option label="房屋建筑物" value="房屋建筑物" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="购买价格" prop="purchase_price" required>
          <el-input-number
            v-model="form.purchase_price"
            :precision="2"
            :min="0"
            placeholder="请输入购买价格"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="购买日期" prop="purchase_date" required>
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            placeholder="请选择购买日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="折旧方法" prop="depreciation_method">
          <el-select v-model="form.depreciation_method" placeholder="请选择折旧方法" style="width: 100%">
            <el-option label="直线法" value="straight_line" />
            <el-option label="年数总和法" value="sum_of_years" />
            <el-option label="双倍余额递减法" value="double_declining" />
          </el-select>
        </el-form-item>
        <el-form-item label="使用年限" prop="useful_life">
          <el-input-number
            v-model="form.useful_life"
            :min="1"
            :max="100"
            placeholder="请输入使用年限（年）"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资产描述"
          />
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
  getFixedAssets,
  createFixedAsset,
  updateFixedAsset,
  deleteFixedAsset
} from "@/api/finance";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  keyword: "",
  status: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      status: searchForm.status
    };
    const response = await getFixedAssets(params);
    console.log('固定资产API响应:', response);
    // 后端返回格式：{ data: [...], total: ..., page: ..., limit: ... }
    // 但request拦截器已经返回了response.data，所以response本身就是后端返回的对象
    const dataList = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
    console.log('处理后的数据:', dataList);
    tableData.value = dataList;
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
  searchForm.status = "";
  loadData();
};
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const form = reactive({
  id: null,
  code: "",
  name: "",
  category: "",
  purchase_price: 0,
  purchase_date: "",
  depreciation_method: "straight_line",
  useful_life: null,
  description: ""
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入资产名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择资产类别", trigger: "change" }],
  purchase_price: [
    { required: true, message: "请输入购买价格", trigger: "blur" },
    { type: "number", min: 0, message: "购买价格必须大于0", trigger: "blur" }
  ],
  purchase_date: [{ required: true, message: "请选择购买日期", trigger: "change" }]
};

const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  resetForm();
  Object.assign(form, {
    id: row.id,
    code: row.code || "",
    name: row.name || "",
    category: row.category || "",
    purchase_price: row.purchase_price || 0,
    purchase_date: row.purchase_date || "",
    depreciation_method: row.depreciation_method || "straight_line",
    useful_life: row.useful_life || null,
    description: row.description || ""
  });
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: null,
    code: "",
    name: "",
    category: "",
    purchase_price: 0,
    purchase_date: "",
    depreciation_method: "straight_line",
    useful_life: null,
    description: ""
  });
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const submitData = {
      code: form.code || null,
      name: form.name,
      category: form.category,
      purchase_price: parseFloat(form.purchase_price) || 0,
      purchase_date: form.purchase_date,
      depreciation_method: form.depreciation_method || null,
      useful_life: form.useful_life || null,
      description: form.description || null
    };

    if (form.id) {
      await updateFixedAsset(form.id, submitData);
      ElMessage.success("更新成功");
    } else {
      await createFixedAsset(submitData);
      ElMessage.success("创建成功");
    }
    
    dialogVisible.value = false;
    resetForm();
    await loadData();
  } catch (error) {
    if (error !== false) { // 验证失败时返回false
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

const handleDepreciation = () => ElMessage.info("计提折旧功能开发中...");
const handleMaintenance = () => ElMessage.info("维护功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除资产"${row.name || row.asset_name}"吗？`, "确认删除");
    await deleteFixedAsset(row.id);
    await loadData();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("删除失败:", error);
    }
  }
};

const getStatusTagType = (status) => {
  // 处理数字状态（1=在用，0=闲置，2=报废）
  if (typeof status === 'number') {
    if (status === 1) return "success";
    if (status === 2) return "danger";
    return "warning";
  }
  // 处理字符串状态
  const statusMap = { active: "success", idle: "warning", scrapped: "danger" };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  // 处理数字状态（1=在用，0=闲置，2=报废）
  if (typeof status === 'number') {
    if (status === 1) return "在用";
    if (status === 2) return "报废";
    return "闲置";
  }
  // 处理字符串状态
  const statusMap = { active: "在用", idle: "闲置", scrapped: "报废" };
  return statusMap[status] || status || "未知";
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
  if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}/)) {
    return date.split("T")[0];
  }
  // 如果是日期对象，格式化
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }
  return date;
};

const getDepreciationMethodLabel = (method) => {
  const methodMap = {
    straight_line: "直线法",
    sum_of_years: "年数总和法",
    double_declining: "双倍余额递减法"
  };
  return methodMap[method] || method || "-";
};

onMounted(() => loadData());
</script>

<style scoped>
.fixed-assets-management { padding: 0; }
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
