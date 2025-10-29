<template>
  <div class="employee-management">
    <div class="page-header">
      <h2>档案管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建档案
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索姓名、邮箱或员工编号" clearable />
        </el-form-item>
        <el-form-item label="部门">
          <el-input v-model="searchForm.department" placeholder="搜索部门" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 档案列表 -->
    <el-table :data="employeeFiles" v-loading="loading" stripe>
      <el-table-column prop="employee_id" label="员工编号" />
      <el-table-column prop="user_name" label="姓名" />
      <el-table-column prop="position_name" label="岗位" />
      <el-table-column prop="org_name" label="所属组织" />
      <el-table-column prop="department" label="部门" />
      <el-table-column prop="created_at" label="建档时间" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="viewFile(row)">查看详情</el-button>
          <el-button size="small" type="primary" @click="editFile(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteFile(row)">删除</el-button>
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
            :rows="4"
            placeholder="请输入个人信息（JSON格式）"
          />
        </el-form-item>

        <!-- 工作信息 -->
        <el-divider content-position="left">工作信息</el-divider>
        <el-form-item label="工作信息">
          <el-input
            v-model="fileForm.work_info"
            type="textarea"
            :rows="4"
            placeholder="请输入工作信息（JSON格式）"
          />
        </el-form-item>

        <!-- 教育信息 -->
        <el-divider content-position="left">教育信息</el-divider>
        <el-form-item label="教育信息">
          <el-input
            v-model="fileForm.education_info"
            type="textarea"
            :rows="4"
            placeholder="请输入教育信息（JSON格式）"
          />
        </el-form-item>

        <!-- 家庭信息 -->
        <el-divider content-position="left">家庭信息</el-divider>
        <el-form-item label="家庭信息">
          <el-input
            v-model="fileForm.family_info"
            type="textarea"
            :rows="4"
            placeholder="请输入家庭信息（JSON格式）"
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
                <span class="label">组织：</span>
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
                  <pre>{{ formatJson(currentFile.personal_info) }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="工作信息">
                <div class="json-content">
                  <pre>{{ formatJson(currentFile.work_info) }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="教育信息">
                <div class="json-content">
                  <pre>{{ formatJson(currentFile.education_info) }}</pre>
                </div>
              </el-tab-pane>
              <el-tab-pane label="家庭信息">
                <div class="json-content">
                  <pre>{{ formatJson(currentFile.family_info) }}</pre>
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getEmployeeFiles, createEmployeeFile } from '@/api/hr'
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

const fileFormRef = ref()

// 格式化JSON
const formatJson = (jsonStr) => {
  if (!jsonStr) return '暂无数据'
  try {
    const obj = JSON.parse(jsonStr)
    return JSON.stringify(obj, null, 2)
  } catch (error) {
    return jsonStr
  }
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
    ElMessage.error('保存失败')
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
  Object.assign(fileForm, row)
  showCreateDialog.value = true
}

// 删除档案
const deleteFile = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个档案吗？', '提示', {
      type: 'warning'
    })
    // TODO: 实现删除API
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消删除
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
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.file-detail {
  padding: 20px 0;
}

.detail-item {
  display: flex;
  margin-bottom: 15px;
}

.detail-item .label {
  font-weight: bold;
  color: #666;
  width: 80px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #333;
}

.json-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
}

.json-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
}
</style>
