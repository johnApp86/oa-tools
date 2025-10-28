<template>
  <div class="menu-management">
    <div class="page-header">
      <h2>菜单管理</h2>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="请输入菜单名称或路径"
            clearable
            style="width: 300px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作区域 -->
    <div class="action-section">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增菜单
      </el-button>
    </div>

    <!-- 表格区域 -->
    <div class="table-section">
      <el-table
        :data="tableData"
        v-loading="loading"
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="菜单名称" width="120" />
        <el-table-column prop="path" label="路径" width="200" />
        <el-table-column prop="icon" label="图标" width="100" />
        <el-table-column prop="level" label="级别" width="80" />
        <el-table-column prop="sort_order" label="排序" width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-section">
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

    <!-- 菜单表单对话框 -->
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
        <el-form-item label="菜单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入菜单名称" />
        </el-form-item>
        <el-form-item label="菜单路径" prop="path">
          <el-input v-model="form.path" placeholder="请输入菜单路径" />
        </el-form-item>
        <el-form-item label="组件名称" prop="component">
          <el-input v-model="form.component" placeholder="请输入组件名称" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标名称" />
        </el-form-item>
        <el-form-item label="父级菜单" prop="parentId">
          <el-select
            v-model="form.parentId"
            placeholder="请选择父级菜单"
            style="width: 100%"
          >
            <el-option label="无（顶级菜单）" :value="0" />
            <el-option
              v-for="menu in menuOptions"
              :key="menu.id"
              :label="menu.name"
              :value="menu.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="层级" prop="level">
          <el-input-number v-model="form.level" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="菜单类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :label="1">菜单</el-radio>
            <el-radio :label="2">按钮</el-radio>
          </el-radio-group>
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
const menuOptions = ref([]);

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
  path: "",
  component: "",
  icon: "",
  parentId: 0,
  level: 1,
  sortOrder: 0,
  type: 1,
  status: 1,
});

// 表单验证规则
const formRules = {
  name: [{ required: true, message: "请输入菜单名称", trigger: "blur" }],
  path: [{ required: true, message: "请输入菜单路径", trigger: "blur" }],
  component: [{ required: true, message: "请输入组件名称", trigger: "blur" }],
};

// 计算属性
const dialogTitle = computed(() => (form.id ? "编辑菜单" : "新增菜单"));

// 加载数据
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      keyword: searchForm.keyword,
    };
    
    const response = await fetch(`/api/menus?${new URLSearchParams(params)}`);
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

// 加载菜单选项
const loadMenuOptions = async () => {
  try {
    const response = await fetch('/api/menus');
    const result = await response.json();
    menuOptions.value = result.data || result;
  } catch (error) {
    console.error("加载菜单选项失败:", error);
  }
};

// 新增
const handleAdd = () => {
  resetForm();
  dialogVisible.value = true;
  loadMenuOptions();
};

// 编辑
const handleEdit = (row) => {
  resetForm();
  Object.assign(form, {
    id: row.id,
    name: row.name,
    path: row.path,
    component: row.component,
    icon: row.icon,
    parentId: row.parent_id,
    level: row.level,
    sortOrder: row.sort_order,
    type: row.type,
    status: row.status,
  });
  dialogVisible.value = true;
  loadMenuOptions();
};

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜单 "${row.name}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const response = await fetch(`/api/menus/${row.id}`, {
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

    const menuData = {
      name: form.name,
      path: form.path,
      component: form.component,
      icon: form.icon,
      parentId: form.parentId,
      level: form.level,
      sortOrder: form.sortOrder,
      type: form.type,
      status: form.status,
    };

    let response;
    if (form.id) {
      // 更新菜单
      response = await fetch(`/api/menus/${form.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData),
      });
    } else {
      // 创建菜单
      response = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(menuData),
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
    name: "",
    path: "",
    component: "",
    icon: "",
    parentId: 0,
    level: 1,
    sortOrder: 0,
    type: 1,
    status: 1,
  });
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
.menu-management {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.action-section {
  margin-bottom: 20px;
}

.table-section {
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.pagination-section {
  padding: 20px;
  text-align: right;
}
</style>