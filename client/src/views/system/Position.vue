<template>
  <div class="position-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入岗位名称或代码"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="组织">
          <el-select
            v-model="searchForm.organizationId"
            placeholder="请选择组织"
            clearable
          >
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
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
        新增岗位
      </el-button>
    </div>

    <!-- 岗位表格 -->
    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="岗位名称" width="150" />
        <el-table-column prop="code" label="岗位代码" width="120" />
        <el-table-column prop="org_name" label="所属组织" width="150" />
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
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 岗位表单对话框 -->
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
        <el-form-item label="岗位名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入岗位名称" />
        </el-form-item>
        <el-form-item label="岗位代码" prop="code">
          <el-input v-model="form.code" placeholder="请输入岗位代码" />
        </el-form-item>
        <el-form-item label="所属组织" prop="organizationId">
          <el-select
            v-model="form.organizationId"
            placeholder="请选择组织"
            style="width: 100%"
          >
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
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
import { ref, reactive, onMounted, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getPositionList,
  createPosition,
  updatePosition,
  deletePosition,
} from "../../api/position";
import { getAllOrganizations } from "../../api/organization";

// 响应式数据
const loading = ref(false);
const tableData = ref([]);
const organizations = ref([]);
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref();

// 搜索表单
const searchForm = reactive({
  keyword: "",
  organizationId: null,
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
  organizationId: null,
  level: 1,
  sortOrder: 0,
  status: 1,
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入岗位名称", trigger: "blur" }],
  code: [{ required: true, message: "请输入岗位代码", trigger: "blur" }],
  organizationId: [
    { required: true, message: "请选择组织", trigger: "change" },
  ],
};

// 计算属性
const dialogTitle = computed(() => (form.id ? "编辑岗位" : "新增岗位"));

// 方法
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
      organizationId: searchForm.organizationId,
    };
    const response = await getPositionList(params);
    tableData.value = response.data;
    pagination.total = response.total;
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    loading.value = false;
  }
};

const loadOrganizations = async () => {
  try {
    const response = await getAllOrganizations();
    organizations.value = response;
  } catch (error) {
    console.error("加载组织数据失败:", error);
  }
};

const handleSearch = () => {
  pagination.page = 1;
  loadData();
};

const handleReset = () => {
  searchForm.keyword = "";
  searchForm.organizationId = null;
  handleSearch();
};

const handleAdd = () => {
  Object.assign(form, {
    id: null,
    name: "",
    code: "",
    organizationId: null,
    level: 1,
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
    organizationId: row.organization_id,
    level: row.level,
    sortOrder: row.sort_order,
    status: row.status,
  });
  dialogVisible.value = true;
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm("确定要删除该岗位吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await deletePosition(row.id);
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
    }
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    await formRef.value.validate();
    submitLoading.value = true;

    if (form.id) {
      await updatePosition(form.id, form);
    } else {
      await createPosition(form);
    }

    dialogVisible.value = false;
    loadData();
  } catch (error) {
    console.error("提交失败:", error);
  } finally {
    submitLoading.value = false;
  }
};

const handleDialogClose = () => {
  formRef.value?.resetFields();
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
  loadOrganizations();
});
</script>

<style scoped>
.position-management {
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
