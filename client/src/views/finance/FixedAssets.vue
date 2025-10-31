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
        <el-table-column prop="asset_code" label="资产编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="asset_name" label="资产名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="category" label="资产类别" width="120" show-overflow-tooltip/>
        <el-table-column prop="original_value" label="原值" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.original_value) }}
          </template>
        </el-table-column>
        <el-table-column prop="depreciation" label="累计折旧" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.depreciation) }}
          </template>
        </el-table-column>
        <el-table-column prop="net_value" label="净值" width="120" show-overflow-tooltipalign="right">
          <template #default="{ row }">
            {{ formatCurrency(row.net_value) }}
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
      width="500px"
    >
      <el-form
        :model="form"
        label-width="100px"
      >
        <el-form-item label="资产名称" required>
          <el-input v-model="form.name" placeholder="请输入资产名称" />
        </el-form-item>
        <el-form-item label="资产类别" required>
          <el-input v-model="form.category" placeholder="请输入资产类别" />
        </el-form-item>
        <el-form-item label="购买价格" required>
          <el-input-number
            v-model="form.purchase_price"
            :precision="2"
            :min="0"
            placeholder="请输入购买价格"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="购买日期" required>
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            placeholder="请选择购买日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
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
  searchForm.status = "";
  loadData();
};
const dialogVisible = ref(false);
const form = reactive({
  id: null,
  name: "",
  category: "",
  purchase_price: 0,
  purchase_date: ""
});

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    name: "",
    category: "",
    purchase_price: 0,
    purchase_date: new Date().toISOString().split('T')[0]
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name || row.asset_name,
    category: row.category,
    purchase_price: row.purchase_price || row.original_value,
    purchase_date: row.purchase_date || row.purchase_date
  });
  dialogVisible.value = true;
};

const handleSubmit = async () => {
  try {
    const submitData = {
      name: form.name,
      category: form.category,
      purchase_price: parseFloat(form.purchase_price),
      purchase_date: form.purchase_date
    };
    
    if (form.id) {
      await updateFixedAsset(form.id, submitData);
    } else {
      await createFixedAsset(submitData);
    }
    
    dialogVisible.value = false;
    await loadData();
  } catch (error) {
    console.error("提交失败:", error);
  }
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
  const statusMap = { active: "success", idle: "warning", scrapped: "danger" };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = { active: "在用", idle: "闲置", scrapped: "报废" };
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
