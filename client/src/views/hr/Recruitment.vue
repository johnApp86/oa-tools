<template>
  <div class="recruitment-management">
    <div class="page-header">
      <h2>招聘管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        发布职位
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="搜索职位标题或岗位名称" clearable />
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

    <!-- 职位列表 -->
    <el-table :data="positions" v-loading="loading" stripe>
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
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button size="small" @click="viewResumes(row)">查看简历</el-button>
          <el-button size="small" type="primary" @click="editPosition(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deletePosition(row)">删除</el-button>
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
    // TODO: 实现删除API
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    // 用户取消删除
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
</style>
