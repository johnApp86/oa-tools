<template>
  <div class="role-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入角色名称或代码"
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
        新增角色
      </el-button>
    </div>

    <!-- 角色表格 -->
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="code" label="角色代码" width="120" />
        <el-table-column prop="description" label="描述" min-width="200" />
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
              <el-button
                size="small"
                type="primary"
                @click="handlePermission(row)"
              >
                权限设置
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 角色表单对话框 -->
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
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入角色代码" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
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

    <!-- 权限设置对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限设置"
      width="800px"
      @close="handlePermissionDialogClose"
    >
      <el-tree
        ref="permissionTreeRef"
        :data="menuTree"
        :props="{ label: 'name', children: 'children' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedMenus"
        check-strictly
      />

      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handlePermissionSubmit"
          :loading="permissionLoading"
        >
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getRoleList,
  createRole,
  updateRole,
  deleteRole,
  getRoleDetail,
} from "../../api/role";
import { getMenuTree } from "../../api/menu";

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const menuTree = ref([]);
const dialogVisible = ref(false);
const permissionDialogVisible = ref(false);
const submitLoading = ref(false);
const permissionLoading = ref(false);
const formRef = ref();
const permissionTreeRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
});

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
});

// 表单数据
const form = reactive({
  id: null,
  name: "",
  code: "",
  description: "",
  status: 1,
});

// 权限相关
const currentRoleId = ref(null);
const checkedMenus = ref([]);

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入角色名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入角色代码", trigger: "blur" }],
};

// 计算属性
const dialogTitle = computed(() => (form.id ? "编辑角色" : "新增角色"));

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
    };
    const response = await getRoleList(params);
    tableData.value = response.data;
    pagination.total = response.total;
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const loadMenuTree = async () => {
  try {
    const response = await getMenuTree();
    menuTree.value = response;
  } catch (error) {
    console.error("加载菜单树失败:", error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  handleSearch();
};

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    name: "",
    code: "",
    description: "",
    status: 1,
  });
  dialogVisible.value = true;
};

const handleEdit = (row) => {
  Object.assign(form, {
    id: row.id,
    name: row.name,
    code: row.code,
    description: row.description,
    status: row.status,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该角色吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await deleteRole(row.id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
    }
  }
};

const handlePermission = async (row) => {
  currentRoleId.value = row.id;
  try {
    const response = await getRoleDetail(row.id);
    checkedMenus.value = response.permissions
      ? response.permissions.map((p) => p.menu_id)
      : [];
    permissionDialogVisible.value = true;
  } catch (error) {
    console.error("获取角色权限失败:", error);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    if (form.id) {
      await updateRole(form.id, form);
    } else {
      await createRole(form);
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error("提交失败:", error);
  } finally {
    submitLoading.value = false;
  }
};

const handlePermissionSubmit = async () => {
  try {
    permissionLoading.value = true;

    const checkedKeys = permissionTreeRef.value.getCheckedKeys();
    const halfCheckedKeys = permissionTreeRef.value.getHalfCheckedKeys();
    const allCheckedKeys = [...checkedKeys, ...halfCheckedKeys];

    // 这里应该调用更新角色权限的API
    // await updateRolePermissions(currentRoleId.value, allCheckedKeys)

    ElMessage.success("权限设置成功");
    permissionDialogVisible.value = false;
  } catch (error) {
    console.error("设置权限失败:", error);
  } finally {
    permissionLoading.value = false;
  }
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
};

const handlePermissionDialogClose = () => {
  currentRoleId.value = null;
  checkedMenus.value = [];
};

const handleSizeChange = (size) => {
  pagination.limit = size;
  loadData();
};

const handleCurrentChange = (page) => {
  pagination.page = page;
  loadData();
};

onMounted(() => {
  loadData();
  loadMenuTree();
});
</script>

<style scoped>
.role-management {
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
