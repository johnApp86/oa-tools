<template>
  <div class="employee-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索姓名、邮箱或员工编号"
            clearable
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-input
            v-model="searchForm.department"
            placeholder="搜索部门"
            clearable
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作按钮 -->
    <div class="button-group">
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建档案
      </el-button>
    </div>

    <!-- 档案统计卡片 -->
    <div class="employee-stats">
      <div class="stat-card">
        <div class="stat-icon employee">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ employeeStats.total }}</div>
          <div class="stat-label">总档案数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon department">
          <el-icon><OfficeBuilding /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ employeeStats.departments }}</div>
          <div class="stat-label">部门数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon position">
          <el-icon><Briefcase /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ employeeStats.positions }}</div>
          <div class="stat-label">岗位数量</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon organization">
          <el-icon><House /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ employeeStats.organizations }}</div>
          <div class="stat-label">组织数量</div>
        </div>
      </div>
    </div>

    <!-- 档案列表 -->
    <div class="table-container">
      <el-table :data="employeeFiles" v-loading="loading" stripe border>
        <el-table-column prop="employee_id" label="员工编号">
          <template #default="{ row }">
            <span class="employee-id">{{ row.employee_id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="姓名" />
        <el-table-column prop="position_name" label="岗位" />
        <el-table-column prop="org_name" label="所属组织" />
        <el-table-column prop="department" label="部门">
          <template #default="{ row }">
            <span class="department-tag">{{ row.department }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="建档时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="viewFile(row)">查看详情</el-button>
              <el-button size="small" type="primary" @click="editFile(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteFile(row)">删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <!-- 创建/编辑档案对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingFile ? '编辑档案' : '新建档案'"
      width="800px"
    >
      <el-form :model="fileForm" :rules="fileRules" ref="fileFormRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工" prop="user_id">
              <el-select v-model="fileForm.user_id" placeholder="选择员工" style="width: 100%">
                <el-option
                  v-for="user in allUsers"
                  :key="user.id"
                  :label="user.real_name || user.username"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="员工编号" prop="employee_id">
              <el-input v-model="fileForm.employee_id" placeholder="请输入员工编号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="岗位" prop="position_id">
              <el-select v-model="fileForm.position_id" placeholder="选择岗位" style="width: 100%">
                <el-option
                  v-for="position in allPositions"
                  :key="position.id"
                  :label="position.name"
                  :value="position.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属组织" prop="org_id">
              <el-select v-model="fileForm.org_id" placeholder="选择组织" style="width: 100%">
                <el-option
                  v-for="org in allOrganizations"
                  :key="org.id"
                  :label="org.name"
                  :value="org.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="部门">
          <el-input v-model="fileForm.department" placeholder="请输入部门" />
        </el-form-item>

        <!-- 个人信息 -->
        <el-divider content-position="left">个人信息</el-divider>
        <el-form-item label="个人信息">
          <el-input
            v-model="fileForm.personal_info"
            type="textarea"
            :rows="3"
            placeholder="请输入个人信息"
          />
        </el-form-item>

        <!-- 工作信息 -->
        <el-divider content-position="left">工作信息</el-divider>
        <el-form-item label="工作信息">
          <el-input
            v-model="fileForm.work_info"
            type="textarea"
            :rows="3"
            placeholder="请输入工作信息"
          />
        </el-form-item>

        <!-- 教育信息 -->
        <el-divider content-position="left">教育信息</el-divider>
        <el-form-item label="教育信息">
          <el-input
            v-model="fileForm.education_info"
            type="textarea"
            :rows="3"
            placeholder="请输入教育信息"
          />
        </el-form-item>

        <!-- 家庭信息 -->
        <el-divider content-position="left">家庭信息</el-divider>
        <el-form-item label="家庭信息">
          <el-input
            v-model="fileForm.family_info"
            type="textarea"
            :rows="3"
            placeholder="请输入家庭信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFile">保存</el-button>
      </template>
    </el-dialog>

    <!-- 档案详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="档案详情" width="80%">
      <div v-if="currentFile" class="file-detail">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>基本信息</span>
              </template>
              <div class="detail-item">
                <span class="label">员工编号：</span>
                <span class="value">{{ currentFile.employee_id }}</span>
              </div>
              <div class="detail-item">
                <span class="label">姓名：</span>
                <span class="value">{{ currentFile.user_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">岗位：</span>
                <span class="value">{{ currentFile.position_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">所属组织：</span>
                <span class="value">{{ currentFile.org_name }}</span>
              </div>
              <div class="detail-item">
                <span class="label">部门：</span>
                <span class="value">{{ currentFile.department }}</span>
              </div>
            </el-card>
          </el-col>
          <el-col :span="16">
            <el-tabs>
              <el-tab-pane label="个人信息">
                <div class="json-content">
                  <pre>{{ currentFile.personal_info || '暂无数据' }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="工作信息">
                <div class="json-content">
                  <pre>{{ currentFile.work_info || '暂无数据' }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="教育信息">
                <div class="json-content">
                  <pre>{{ currentFile.education_info || '暂无数据' }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="家庭信息">
                <div class="json-content">
                  <pre>{{ currentFile.family_info || '暂无数据' }}</pre>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-col>
        </el-row>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, User, OfficeBuilding, Briefcase, House } from '@element-plus/icons-vue'
import { getEmployeeFiles, createEmployeeFile, deleteEmployeeFile } from '@/api/hr'
import { getUserList } from '@/api/user'
import { getAllPositions } from '@/api/position'
import { getAllOrganizations } from '@/api/organization'

// 响应式数据
const loading = ref(false)
const employeeFiles = ref([])
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const editingFile = ref(null)
const currentFile = ref(null)
const allUsers = ref([])
const allPositions = ref([])
const allOrganizations = ref([])
const fileFormRef = ref(null)

// 档案统计数据
const employeeStats = computed(() => {
  const total = employeeFiles.value.length
  const departments = new Set(employeeFiles.value.map(file => file.department).filter(Boolean)).size
  const positions = new Set(employeeFiles.value.map(file => file.position_name).filter(Boolean)).size
  const organizations = new Set(employeeFiles.value.map(file => file.org_name).filter(Boolean)).size
  
  return {
    total,
    departments,
    positions,
    organizations
  }
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  department: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 档案表单
const fileForm = reactive({
  user_id: '',
  employee_id: '',
  position_id: '',
  org_id: '',
  department: '',
  personal_info: '',
  work_info: '',
  education_info: '',
  family_info: ''
})

// 表单验证规则
const fileRules = {
  user_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  employee_id: [{ required: true, message: '请输入员工编号', trigger: 'blur' }],
  position_id: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  org_id: [{ required: true, message: '请选择组织', trigger: 'change' }]
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    const response = await getEmployeeFiles(params)
    employeeFiles.value = response.data
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.department = ''
  pagination.page = 1
  loadData()
}

// 保存档案
const saveFile = async () => {
  try {
    await fileFormRef.value.validate()
    await createEmployeeFile(fileForm)
    ElMessage.success('保存成功')
    showCreateDialog.value = false
    resetForm()
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('保存失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(fileForm, {
    user_id: '',
    employee_id: '',
    position_id: '',
    org_id: '',
    department: '',
    personal_info: '',
    work_info: '',
    education_info: '',
    family_info: ''
  })
  editingFile.value = null
}

// 查看档案详情
const viewFile = (row) => {
  currentFile.value = row
  showDetailDialog.value = true
}

// 编辑档案
const editFile = (row) => {
  editingFile.value = row
  Object.assign(fileForm, {
    user_id: row.user_id,
    employee_id: row.employee_id,
    position_id: row.position_id,
    org_id: row.org_id,
    department: row.department,
    personal_info: row.personal_info,
    work_info: row.work_info,
    education_info: row.education_info,
    family_info: row.family_info
  })
  showCreateDialog.value = true
}

// 删除档案
const deleteFile = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个档案吗？', '提示', {
      type: 'warning'
    })
    await deleteEmployeeFile(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 加载基础数据
const loadBaseData = async () => {
  try {
    const [usersRes, positionsRes, orgsRes] = await Promise.all([
      getUserList(),
      getAllPositions(),
      getAllOrganizations()
    ])
    allUsers.value = usersRes.data || usersRes
    allPositions.value = positionsRes.data || positionsRes
    allOrganizations.value = orgsRes.data || orgsRes
  } catch (error) {
    ElMessage.error('加载基础数据失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadData()
  loadBaseData()
})
</script>

<style scoped>
.employee-management {
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
  margin-top: 24px;
  text-align: right;
}

/* 档案统计卡片样式 */
.employee-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f7fafc;
  padding: 24px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon.employee {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.department {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.position {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.organization {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

/* 员工编号特殊样式 */
.employee-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

/* 部门标签样式 */
.department-tag {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 操作按钮组样式 */
.operation-buttons {
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.operation-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: auto;
  padding: 4px 8px;
  font-size: 12px;
}

/* 档案详情样式 */
.file-detail {
  padding: 20px;
}

.detail-item {
  margin-bottom: 15px;
  padding: 10px;
  background: #f8fafc;
  border-radius: 6px;
}

.detail-item .label {
  font-weight: 600;
  color: #4a5568;
  margin-right: 10px;
}

.detail-item .value {
  color: #2d3748;
}

.json-content {
  background: #f8fafc;
  padding: 15px;
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
}

.json-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
