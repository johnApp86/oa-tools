<template>
  <div class="dictionary-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入字典名称、编码或标签"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="字典编码">
          <el-select
            v-model="searchForm.dictCode"
            placeholder="请选择字典编码"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="type in dictTypes"
              :key="type.dict_code"
              :label="`${type.dict_name}(${type.dict_code})`"
              :value="type.dict_code"
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
        新增字典
      </el-button>
      <el-button type="success" @click="handleBatchAdd">
        <el-icon><Upload /></el-icon>
        批量导入
      </el-button>
    </div>

    <!-- 字典表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        :default-expand-all="false"
        style="width: 100%"
        table-layout="fixed"
      >
        <el-table-column prop="dict_label" label="字典标签/名称" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="row.is_group" style="font-weight: 600; color: #409eff;">
              {{ row.dict_label }}
            </span>
            <span v-else>{{ row.dict_label }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dict_code" label="字典编码" width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.is_group">{{ row.dict_code }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="dict_type" label="字典类型" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="getDictTypeTag(row.dict_type)" size="small">
              {{ getDictTypeLabel(row.dict_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dict_value" label="字典值" width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.is_group">{{ row.dict_value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="80" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.is_group">{{ row.sort_order }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.is_group">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? "启用" : "禁用" }}
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            <span v-if="!row.is_group">{{ row.remark || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="operation-buttons" v-if="!row.is_group">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
            <div class="operation-buttons" v-else>
              <el-button size="small" type="primary" @click="handleAddToGroup(row)">
                添加字典项
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 字典表单对话框 -->
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
        v-loading="submitLoading"
      >
        <el-form-item label="字典编码" prop="dictCode">
          <el-input v-model="form.dictCode" placeholder="请输入字典编码（如：hr_status）" />
        </el-form-item>
        <el-form-item label="字典名称" prop="dictName">
          <el-input v-model="form.dictName" placeholder="请输入字典名称（如：HR状态）" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dictType">
          <el-select v-model="form.dictType" placeholder="请选择字典类型" style="width: 100%">
            <el-option label="HR模块" value="hr" />
            <el-option label="财务模块" value="finance" />
            <el-option label="系统模块" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="字典值" prop="dictValue">
          <el-input v-model="form.dictValue" placeholder="请输入字典值（如：1）" />
        </el-form-item>
        <el-form-item label="字典标签" prop="dictLabel">
          <el-input v-model="form.dictLabel" placeholder="请输入字典标签（如：已启用）" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
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
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog
      v-model="batchDialogVisible"
      title="批量导入字典"
      width="700px"
    >
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 20px"
      >
        <template #title>
          <div>
            <p>批量导入格式说明：</p>
            <p>每行一条数据，格式：字典编码,字典名称,字典类型,字典值,字典标签,排序,状态,备注</p>
            <p>示例：hr_status,HR状态,hr,1,已启用,1,1,状态说明</p>
          </div>
        </template>
      </el-alert>
      <el-input
        v-model="batchData"
        type="textarea"
        :rows="10"
        placeholder="请按照上述格式输入字典数据，每行一条"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Upload } from "@element-plus/icons-vue";
import {
  getDictionaryList,
  getDictTypes,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  batchCreateDictionaries,
} from "@/api/dictionary";

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const dialogVisible = ref(false);
const batchDialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();
const dictTypes = ref([]);

// 搜索表单
const searchForm = reactive({
  keyword: "",
  dictCode: "",
});


// 表单数据
const form = reactive({
  id: null,
  dictCode: "",
  dictName: "",
  dictType: "",
  dictValue: "",
  dictLabel: "",
  sortOrder: 0,
  status: 1,
  remark: "",
});

// 批量导入数据
const batchData = ref("");

// 表单验证规则
const formRules = {
  dictCode: [{ required: true, message: "请输入字典编码", trigger: "blur" }],
  dictName: [{ required: true, message: "请输入字典名称", trigger: "blur" }],
  dictType: [{ required: true, message: "请选择字典类型", trigger: "change" }],
  dictValue: [{ required: true, message: "请输入字典值", trigger: "blur" }],
  dictLabel: [{ required: true, message: "请输入字典标签", trigger: "blur" }],
};

// 计算属性
const dialogTitle = computed(() => (form.id ? "编辑字典" : "新增字典"));

// 加载字典类型
const loadDictTypes = async () => {
  try {
    const result = await getDictTypes();
    dictTypes.value = result.data || [];
  } catch (error) {
    console.error("加载字典类型失败:", error);
  }
};

// 加载数据（树形结构）
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
      dictCode: searchForm.dictCode,
      tree: true, // 请求树形结构数据
    };

    const result = await getDictionaryList(params);

    // 确保每个节点都有children数组
    const processTree = (nodes) => {
      return nodes.map(node => ({
        ...node,
        children: node.children && node.children.length > 0 ? processTree(node.children) : []
      }));
    };
    
    tableData.value = processTree(result.data || []);
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
    tableData.value = [];
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.keyword = "";
  searchForm.dictCode = "";
  handleSearch();
};

// 新增
const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
};

// 添加字典项到组
const handleAddToGroup = (groupRow) => {
  resetForm();
  form.dictCode = groupRow.dict_code;
  form.dictName = groupRow.dict_name;
  form.dictType = groupRow.dict_type;
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row) => {
  resetForm();
  Object.assign(form, {
    id: row.id,
    dictCode: row.dict_code,
    dictName: row.dict_name,
    dictType: row.dict_type,
    dictValue: row.dict_value,
    dictLabel: row.dict_label,
    sortOrder: row.sort_order,
    status: row.status,
    remark: row.remark || "",
  });
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除字典 "${row.dict_label}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    await deleteDictionary(row.id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error(error.message || "删除失败");
    }
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const dictData = {
      dictCode: form.dictCode,
      dictName: form.dictName,
      dictType: form.dictType,
      dictValue: form.dictValue,
      dictLabel: form.dictLabel,
      sortOrder: form.sortOrder,
      status: form.status,
      remark: form.remark,
    };

    if (form.id) {
      // 更新字典
      await updateDictionary(form.id, dictData);
      ElMessage.success("更新成功");
    } else {
      // 创建字典
      await createDictionary(dictData);
      ElMessage.success("创建成功");
    }

    dialogVisible.value = false;
    loadData();
    loadDictTypes();
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error(error.message || "操作失败");
  } finally {
    submitLoading.value = false;
  }
};

// 批量导入
const handleBatchAdd = () => {
  batchData.value = "";
  batchDialogVisible.value = true;
};

// 批量提交
const handleBatchSubmit = async () => {
  if (!batchData.value.trim()) {
    ElMessage.warning("请输入要导入的字典数据");
    return;
  }

  try {
    const lines = batchData.value.split("\n").filter((line) => line.trim());
    const dictionaries = [];

    for (const line of lines) {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 5) {
        ElMessage.warning(`数据格式错误：${line}`);
        return;
      }

      dictionaries.push({
        dictCode: parts[0],
        dictName: parts[1],
        dictType: parts[2],
        dictValue: parts[3],
        dictLabel: parts[4],
        sortOrder: parseInt(parts[5]) || 0,
        status: parseInt(parts[6]) || 1,
        remark: parts[7] || "",
      });
    }

    submitLoading.value = true;
    await batchCreateDictionaries({ dictionaries });
    ElMessage.success(`成功导入${dictionaries.length}条字典`);
    batchDialogVisible.value = false;
    loadData();
    loadDictTypes();
  } catch (error) {
    console.error("批量导入失败:", error);
    ElMessage.error(error.message || "批量导入失败");
  } finally {
    submitLoading.value = false;
  }
};

// 关闭对话框
const handleDialogClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    id: null,
    dictCode: "",
    dictName: "",
    dictType: "",
    dictValue: "",
    dictLabel: "",
    sortOrder: 0,
    status: 1,
    remark: "",
  });
};

// 获取字典类型标签
const getDictTypeLabel = (type) => {
  const typeMap = {
    hr: 'HR模块',
    finance: '财务模块',
    system: '系统模块'
  };
  return typeMap[type] || type || '-';
};

// 获取字典类型标签颜色
const getDictTypeTag = (type) => {
  const tagMap = {
    hr: 'primary',
    finance: 'success',
    system: 'warning'
  };
  return tagMap[type] || 'info';
};

// 初始化
onMounted(() => {
  loadData();
  loadDictTypes();
});
</script>

<style scoped>
.dictionary-management {
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

.pagination {
  margin-top: 20px;
  text-align: right;
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
