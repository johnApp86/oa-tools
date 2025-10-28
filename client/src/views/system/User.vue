<template>
  <div class="user-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入用户名、姓名或邮箱"
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
        新增用户
      </el-button>
    </div>

    <!-- 用户表格 -->
    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="org_name" label="组织" width="120" />
        <el-table-column prop="position_name" label="岗位" width="120" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleEdit(row)">编辑</el-button>
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
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 用户表单对话框 -->
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
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="真实姓名" prop="realName">
          <el-input v-model="form.realName" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="所属组织" prop="organizationId">
          <el-select
            v-model="form.organizationId"
            placeholder="请选择组织"
            style="width: 100%"
            @change="handleOrganizationChange"
          >
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属岗位" prop="positionId">
          <el-select
            v-model="form.positionId"
            placeholder="请选择岗位"
            style="width: 100%"
            :disabled="!form.organizationId"
          >
            <el-option
              v-for="pos in positions"
              :key="pos.id"
              :label="pos.name"
              :value="pos.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 选项数据
const organizations = ref([]);
const positions = ref([]);

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
  username: "",
  realName: "",
  email: "",
  phone: "",
  organizationId: null,
  positionId: null,
  status: 1,
});

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { min: 3, message: "用户名至少3位", trigger: "blur" },
  ],
  realName: [{ required: true, message: "请输入真实姓名", trigger: "blur" }],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { type: "email", message: "请输入正确的邮箱格式", trigger: ["blur", "change"] },
  ],
  organizationId: [{ required: true, message: "请选择所属组织", trigger: "change" }],
  positionId: [{ required: true, message: "请选择所属岗位", trigger: "change" }],
};

// 计算属性
const dialogTitle = computed(() => (form.id ? "编辑用户" : "新增用户"));

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
    };
    
    const response = await fetch(`/api/users?${new URLSearchParams(params)}`);
    const result = await response.json();
    
    tableData.value = result.data;
    pagination.total = result.total;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

// 重置
const handleReset = () => {
  searchForm.keyword = "";
  handleSearch();
};

// 加载选项数据
const loadOptions = async () => {
  try {
    const [orgRes, posRes] = await Promise.all([
      fetch('/api/organizations/all'),
      fetch('/api/positions')
    ]);
    const [orgs, positions] = await Promise.all([
      orgRes.json(),
      posRes.json()
    ]);
    organizations.value = orgs;
    positions.value = positions.data || positions;
  } catch (error) {
    console.error("加载选项数据失败:", error);
  }
};

// 加载岗位数据
const loadPositions = async (organizationId) => {
  try {
    const response = await fetch(`/api/positions?organizationId=${organizationId}`);
    const result = await response.json();
    positions.value = result.data || result;
  } catch (error) {
    console.error("加载岗位数据失败:", error);
  }
};

// 新增
const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
  loadOptions();
};

// 编辑
const handleEdit = (row) => {
  resetForm();
  Object.assign(form, {
    id: row.id,
    username: row.username,
    realName: row.real_name,
    email: row.email,
    phone: row.phone,
    organizationId: row.organization_id,
    positionId: row.position_id,
    status: row.status,
  });
  dialogVisible.value = true;
  loadOptions();
  if (row.organization_id) {
    loadPositions(row.organization_id);
  }
};

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${row.username}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await fetch(`/api/users/${row.id}`, {
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    const userData = {
      username: form.username,
      real_name: form.realName,
      email: form.email,
      phone: form.phone,
      organization_id: form.organizationId,
      position_id: form.positionId,
      status: form.status,
    };

    let response;
    if (form.id) {
      // 更新用户
      response = await fetch(`/api/users/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
    } else {
      // 创建用户
      response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
    }

    if (response.ok) {
      ElMessage.success(form.id ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      loadData();
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
    username: "",
    realName: "",
    email: "",
    phone: "",
    organizationId: null,
    positionId: null,
    status: 1,
  });
  positions.value = [];
};

// 组织改变时加载岗位
const handleOrganizationChange = (orgId) => {
  form.positionId = null;
  if (orgId) {
    loadPositions(orgId);
  } else {
    positions.value = [];
  }
};

// 分页
const handleSizeChange = (val) => {
  pagination.limit = val;
  loadData();
};

const handleCurrentChange = (val) => {
  pagination.page = val;
  loadData();
};

// 初始化
onMounted(() => {
  loadData();
});
</script>

<style scoped>
.user-management {
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