<template>
  <div class="organization-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入组织名称或代码"
            clearable
            @keyup.enter="handleSearch"
          />
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
        新增组织
      </el-button>
    </div>

    <!-- 组织表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        stripe
        border
        row-key="id"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column prop="name" label="组织名称" width="200" />
        <el-table-column prop="code" label="组织代码" width="150" />
        <el-table-column prop="level" label="层级" width="80" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? "启用" : "禁用" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
              <el-button size="small" type="primary" @click="handleAddChild(row)">
                添加子组织
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 组织表单对话框 -->
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
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入组织名称" />
        </el-form-item>
        <el-form-item label="组织代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入组织代码" />
        </el-form-item>
        <el-form-item label="父级组织" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="organizationTree"
            :props="{ label: 'name', value: 'id' }"
            placeholder="请选择父级组织"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-input-number v-model="form.level" :min="1" :max="10" />
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
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="submitLoading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getOrganizationList,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationTree,
} from "../../api/organization";

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const organizationTree = ref([]);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
});

// 表单数据
const form = reactive({
  id: null,
  name: "",
  code: "",
  parentId: 0,
  level: 1,
  sortOrder: 0,
  status: 1,
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入组织名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入组织代码", trigger: "blur" }],
};

// 计算属性
const dialogTitle = computed(() => {
  if (form.id) {
    return "编辑组织";
  } else if (form.parentId && form.parentId !== 0) {
    return "添加子组织";
  } else {
    return "新增组织";
  }
});

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchForm.keyword,
    };
    const response = await getOrganizationTree();
    tableData.value = response;
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const loadTree = async () => {
  try {
    const response = await getOrganizationTree();
    organizationTree.value = response;
  } catch (error) {
    console.error("加载组织树失败:", error);
  }
};

const handleSearch = () => {
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  loadData();
};

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    name: "",
    code: "",
    parentId: 0,
    level: 1,
    sortOrder: 0,
    status: 1,
  });
  dialogVisible.value = true;
};

const handleAddChild = (row) => {
  Object.assign(form, {
    id: null,
    name: "",
    code: "",
    parentId: row.id,
    level: row.level + 1,
    sortOrder: 0,
    status: 1,
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    parentId: row.parent_id,
    level: row.level,
    sortOrder: row.sort_order,
    status: row.status,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该组织吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const response = await fetch(`/api/organizations/${row.id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      ElMessage.success("删除成功");
      loadData();
    } else {
      const error = await response.json();
      ElMessage.error(error.message || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const orgData = {
      name: form.name,
      code: form.code,
      parentId: form.parentId,
      level: form.level,
      sortOrder: form.sortOrder,
      status: form.status,
    };

    let response;
    if (form.id) {
      // 更新组织
      response = await fetch(`/api/organizations/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
    } else {
      // 创建组织
      response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });
    }

    if (response.ok) {
      ElMessage.success(form.id ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      loadData();
      loadTree();
    } else {
      const error = await response.json();
      ElMessage.error(error.message || "操作失败");
    }
  } catch (error) {
    console.error("提交失败:", error);
    ElMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
};

onMounted(() => {
  loadData();
  loadTree();
});
</script>

<style scoped>
.organization-management {
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
}

:deep(.el-table th) {
  background-color: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f7fafc;
}

:deep(.el-table tr:hover > td) {
  background-color: #f7fafc;
}

/* 按钮样式优化 */
:deep(.el-button) {
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

:deep(.el-button--primary:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

:deep(.el-button--danger) {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(245, 101, 101, 0.3);
}

:deep(.el-button--danger:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(245, 101, 101, 0.4);
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
}

:deep(.el-tag--success) {
  background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
  border: none;
  color: white;
}

:deep(.el-tag--danger) {
  background: linear-gradient(135deg, #fc8181 0%, #f56565 100%);
  border: none;
  color: white;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  border-color: #cbd5e0;
}

:deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 对话框样式优化 */
:deep(.el-dialog) {
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

:deep(.el-dialog__header) {
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  border-radius: 12px 12px 0 0;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

:deep(.el-dialog__title) {
  font-weight: 600;
  color: #2d3748;
}

/* 操作按钮组样式 */
.operation-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  align-items: center;
}

.operation-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
