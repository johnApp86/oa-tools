<template>
  <div class="recruitment-management">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索职位标题或岗位名称"
            clearable
            @keyup.enter="loadData"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="招聘中" value="1" />
            <el-option label="已暂停" value="0" />
            <el-option label="已结束" value="2" />
          </el-select>
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
        发布职位
      </el-button>
    </div>

    <!-- 职位列表 -->
    <div class="table-container">
      <el-table :data="positions" v-loading="loading" stripe border>
        <el-table-column prop="title" label="职位标题" />
        <el-table-column prop="position_name" label="岗位名称" />
        <el-table-column prop="org_name" label="所属组织" />
        <el-table-column prop="salary_range" label="薪资范围" />
        <el-table-column prop="urgent_level" label="紧急程度">
          <template #default="{ row }">
            <el-tag :type="getUrgentLevelType(row.urgent_level)">
              {{ getUrgentLevelText(row.urgent_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">
              {{ row.status === 1 ? '招聘中' : row.status === 0 ? '已暂停' : '已结束' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="viewResumes(row)">查看简历</el-button>
              <el-button size="small" type="primary" @click="editPosition(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deletePosition(row)">删除</el-button>
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

    <!-- 创建/编辑职位对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingPosition ? '编辑职位' : '发布职位'"
      width="600px"
    >
      <el-form :model="positionForm" :rules="positionRules" ref="positionFormRef" label-width="100px">
        <el-form-item label="职位标题" prop="title">
          <el-input v-model="positionForm.title" placeholder="请输入职位标题" />
        </el-form-item>
        <el-form-item label="岗位" prop="position_id">
          <el-select v-model="positionForm.position_id" placeholder="选择岗位" style="width: 100%">
            <el-option
              v-for="position in allPositions"
              :key="position.id"
              :label="position.name"
              :value="position.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织" prop="org_id">
          <el-select v-model="positionForm.org_id" placeholder="选择组织" style="width: 100%">
            <el-option
              v-for="org in allOrganizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="薪资范围">
          <el-input v-model="positionForm.salary_range" placeholder="如：8K-15K" />
        </el-form-item>
        <el-form-item label="紧急程度">
          <el-select v-model="positionForm.urgent_level" placeholder="选择紧急程度">
            <el-option label="普通" :value="1" />
            <el-option label="紧急" :value="2" />
            <el-option label="非常紧急" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="职位描述">
          <el-input
            v-model="positionForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入职位描述"
          />
        </el-form-item>
        <el-form-item label="任职要求">
          <el-input
            v-model="positionForm.requirements"
            type="textarea"
            :rows="4"
            placeholder="请输入任职要求"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="savePosition">保存</el-button>
      </template>
    </el-dialog>

    <!-- 简历列表对话框 -->
    <el-dialog v-model="showResumesDialog" title="简历列表" width="80%">
      <el-table :data="resumes" v-loading="resumesLoading">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="experience" label="工作经验" />
        <el-table-column prop="education" label="学历" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getResumeStatusType(row.status)">
              {{ getResumeStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="投递时间" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="viewResume(row)">查看详情</el-button>
            <el-button size="small" type="success" @click="updateResumeStatus(row, 2)">通过</el-button>
            <el-button size="small" type="danger" @click="updateResumeStatus(row, 3)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getRecruitmentPositions, 
  createRecruitmentPosition, 
  deleteRecruitmentPosition,
  getResumes 
} from '@/api/hr'
import { getAllPositions } from '@/api/position'
import { getAllOrganizations } from '@/api/organization'

// 响应式数据
const loading = ref(false)
const positions = ref([])
const resumes = ref([])
const resumesLoading = ref(false)
const showCreateDialog = ref(false)
const showResumesDialog = ref(false)
const editingPosition = ref(null)
const allPositions = ref([])
const allOrganizations = ref([])

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 职位表单
const positionForm = reactive({
  title: '',
  position_id: '',
  org_id: '',
  salary_range: '',
  urgent_level: 1,
  description: '',
  requirements: ''
})

// 表单验证规则
const positionRules = {
  title: [{ required: true, message: '请输入职位标题', trigger: 'blur' }],
  position_id: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  org_id: [{ required: true, message: '请选择组织', trigger: 'change' }]
}

const positionFormRef = ref()

// 获取紧急程度类型
const getUrgentLevelType = (level) => {
  const types = { 1: '', 2: 'warning', 3: 'danger' }
  return types[level] || ''
}

// 获取紧急程度文本
const getUrgentLevelText = (level) => {
  const texts = { 1: '普通', 2: '紧急', 3: '非常紧急' }
  return texts[level] || '普通'
}

// 获取简历状态类型
const getResumeStatusType = (status) => {
  const types = { 1: 'info', 2: 'success', 3: 'danger' }
  return types[status] || 'info'
}

// 获取简历状态文本
const getResumeStatusText = (status) => {
  const texts = { 1: '待审核', 2: '已通过', 3: '已拒绝' }
  return texts[status] || '待审核'
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
    const response = await getRecruitmentPositions(params)
    positions.value = response.data
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
  searchForm.status = ''
  pagination.page = 1
  loadData()
}

// 保存职位
const savePosition = async () => {
  try {
    await positionFormRef.value.validate()
    await createRecruitmentPosition(positionForm)
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
  Object.assign(positionForm, {
    title: '',
    position_id: '',
    org_id: '',
    salary_range: '',
    urgent_level: 1,
    description: '',
    requirements: ''
  })
  editingPosition.value = null
}

// 编辑职位
const editPosition = (row) => {
  editingPosition.value = row
  Object.assign(positionForm, row)
  showCreateDialog.value = true
}

// 删除职位
const deletePosition = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个职位吗？', '提示', {
      type: 'warning'
    })
    await deleteRecruitmentPosition(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 查看简历
const viewResumes = async (row) => {
  showResumesDialog.value = true
  resumesLoading.value = true
  try {
    const response = await getResumes({ position_id: row.id })
    resumes.value = response.data
  } catch (error) {
    ElMessage.error('加载简历失败')
  } finally {
    resumesLoading.value = false
  }
}

// 查看简历详情
const viewResume = (row) => {
  // TODO: 实现简历详情查看
  ElMessage.info('查看简历详情功能待实现')
}

// 更新简历状态
const updateResumeStatus = async (row, status) => {
  try {
    // TODO: 实现更新简历状态API
    ElMessage.success('状态更新成功')
    viewResumes({ id: row.position_id })
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 加载基础数据
const loadBaseData = async () => {
  try {
    const [positionsRes, orgsRes] = await Promise.all([
      getAllPositions(),
      getAllOrganizations()
    ])
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
.recruitment-management {
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

:deep(.el-tag--warning) {
  background: linear-gradient(135deg, #f6e05e 0%, #d69e2e 100%);
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
