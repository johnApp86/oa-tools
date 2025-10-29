<template>
  <div class="onboarding-management">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 入职管理 -->
      <el-tab-pane label="入职管理" name="onboarding">
        <div class="tab-content">
          <div class="page-header">
            <h3>入职申请管理</h3>
            <el-button type="primary" @click="showOnboardingDialog = true">
              <el-icon><Plus /></el-icon>
              新建入职申请
            </el-button>
          </div>

          <!-- 搜索筛选 -->
          <div class="search-section">
            <el-form :model="onboardingSearchForm" inline>
              <el-form-item label="关键词">
                <el-input v-model="onboardingSearchForm.keyword" placeholder="搜索姓名或邮箱" clearable />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="onboardingSearchForm.status" placeholder="选择状态" clearable>
                  <el-option label="待审核" value="1" />
                  <el-option label="已通过" value="2" />
                  <el-option label="已拒绝" value="3" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadOnboardingData">搜索</el-button>
                <el-button @click="resetOnboardingSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 入职申请列表 -->
          <el-table :data="onboardingApplications" v-loading="onboardingLoading" stripe>
            <el-table-column prop="user_name" label="姓名" />
            <el-table-column prop="position_name" label="岗位" />
            <el-table-column prop="org_name" label="所属组织" />
            <el-table-column prop="start_date" label="入职日期" />
            <el-table-column prop="salary" label="薪资" />
            <el-table-column prop="contract_type" label="合同类型" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getOnboardingStatusType(row.status)">
                  {{ getOnboardingStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewOnboardingDetail(row)">查看详情</el-button>
                <el-button size="small" type="success" @click="updateOnboardingStatus(row, 2)">通过</el-button>
                <el-button size="small" type="danger" @click="updateOnboardingStatus(row, 3)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="onboardingPagination.page"
              v-model:page-size="onboardingPagination.limit"
              :total="onboardingPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadOnboardingData"
              @current-change="loadOnboardingData"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 离职管理 -->
      <el-tab-pane label="离职管理" name="offboarding">
        <div class="tab-content">
          <div class="page-header">
            <h3>离职申请管理</h3>
            <el-button type="primary" @click="showOffboardingDialog = true">
              <el-icon><Plus /></el-icon>
              新建离职申请
            </el-button>
          </div>

          <!-- 搜索筛选 -->
          <div class="search-section">
            <el-form :model="offboardingSearchForm" inline>
              <el-form-item label="关键词">
                <el-input v-model="offboardingSearchForm.keyword" placeholder="搜索姓名或邮箱" clearable />
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="offboardingSearchForm.status" placeholder="选择状态" clearable>
                  <el-option label="待审核" value="1" />
                  <el-option label="已通过" value="2" />
                  <el-option label="已拒绝" value="3" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadOffboardingData">搜索</el-button>
                <el-button @click="resetOffboardingSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 离职申请列表 -->
          <el-table :data="offboardingApplications" v-loading="offboardingLoading" stripe>
            <el-table-column prop="user_name" label="姓名" />
            <el-table-column prop="position_name" label="岗位" />
            <el-table-column prop="org_name" label="所属组织" />
            <el-table-column prop="leave_date" label="离职日期" />
            <el-table-column prop="reason" label="离职原因" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getOffboardingStatusType(row.status)">
                  {{ getOffboardingStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewOffboardingDetail(row)">查看详情</el-button>
                <el-button size="small" type="success" @click="updateOffboardingStatus(row, 2)">通过</el-button>
                <el-button size="small" type="danger" @click="updateOffboardingStatus(row, 3)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="offboardingPagination.page"
              v-model:page-size="offboardingPagination.limit"
              :total="offboardingPagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadOffboardingData"
              @current-change="loadOffboardingData"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 入职申请对话框 -->
    <el-dialog
      v-model="showOnboardingDialog"
      title="新建入职申请"
      width="600px"
    >
      <el-form :model="onboardingForm" :rules="onboardingRules" ref="onboardingFormRef" label-width="100px">
        <el-form-item label="员工" prop="user_id">
          <el-select v-model="onboardingForm.user_id" placeholder="选择员工" style="width: 100%">
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.real_name || user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="岗位" prop="position_id">
          <el-select v-model="onboardingForm.position_id" placeholder="选择岗位" style="width: 100%">
            <el-option
              v-for="position in allPositions"
              :key="position.id"
              :label="position.name"
              :value="position.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="所属组织" prop="org_id">
          <el-select v-model="onboardingForm.org_id" placeholder="选择组织" style="width: 100%">
            <el-option
              v-for="org in allOrganizations"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="入职日期" prop="start_date">
          <el-date-picker
            v-model="onboardingForm.start_date"
            type="date"
            placeholder="选择入职日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="薪资">
          <el-input v-model="onboardingForm.salary" placeholder="请输入薪资" />
        </el-form-item>
        <el-form-item label="合同类型">
          <el-select v-model="onboardingForm.contract_type" placeholder="选择合同类型">
            <el-option label="正式合同" value="formal" />
            <el-option label="试用期合同" value="probation" />
            <el-option label="临时合同" value="temporary" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="onboardingForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOnboardingDialog = false">取消</el-button>
        <el-button type="primary" @click="saveOnboardingApplication">保存</el-button>
      </template>
    </el-dialog>

    <!-- 离职申请对话框 -->
    <el-dialog
      v-model="showOffboardingDialog"
      title="新建离职申请"
      width="600px"
    >
      <el-form :model="offboardingForm" :rules="offboardingRules" ref="offboardingFormRef" label-width="100px">
        <el-form-item label="员工" prop="user_id">
          <el-select v-model="offboardingForm.user_id" placeholder="选择员工" style="width: 100%">
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.real_name || user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="离职日期" prop="leave_date">
          <el-date-picker
            v-model="offboardingForm.leave_date"
            type="date"
            placeholder="选择离职日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="离职原因" prop="reason">
          <el-select v-model="offboardingForm.reason" placeholder="选择离职原因" style="width: 100%">
            <el-option label="个人原因" value="personal" />
            <el-option label="薪资问题" value="salary" />
            <el-option label="发展机会" value="career" />
            <el-option label="工作环境" value="environment" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="交接说明">
          <el-input
            v-model="offboardingForm.handover_notes"
            type="textarea"
            :rows="4"
            placeholder="请输入工作交接说明"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showOffboardingDialog = false">取消</el-button>
        <el-button type="primary" @click="saveOffboardingApplication">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { 
  getOnboardingApplications, 
  createOnboardingApplication,
  getOffboardingApplications,
  createOffboardingApplication
} from '@/api/hr'
import { getUserList } from '@/api/user'
import { getAllPositions } from '@/api/position'
import { getAllOrganizations } from '@/api/organization'

// 响应式数据
const activeTab = ref('onboarding')

// 入职管理相关
const onboardingLoading = ref(false)
const onboardingApplications = ref([])
const showOnboardingDialog = ref(false)

// 离职管理相关
const offboardingLoading = ref(false)
const offboardingApplications = ref([])
const showOffboardingDialog = ref(false)

// 基础数据
const allUsers = ref([])
const allPositions = ref([])
const allOrganizations = ref([])

// 入职搜索表单
const onboardingSearchForm = reactive({
  keyword: '',
  status: ''
})

// 离职搜索表单
const offboardingSearchForm = reactive({
  keyword: '',
  status: ''
})

// 入职分页
const onboardingPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 离职分页
const offboardingPagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 入职表单
const onboardingForm = reactive({
  user_id: '',
  position_id: '',
  org_id: '',
  start_date: '',
  salary: '',
  contract_type: '',
  notes: ''
})

// 离职表单
const offboardingForm = reactive({
  user_id: '',
  leave_date: '',
  reason: '',
  handover_notes: ''
})

// 表单验证规则
const onboardingRules = {
  user_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  position_id: [{ required: true, message: '请选择岗位', trigger: 'change' }],
  org_id: [{ required: true, message: '请选择组织', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择入职日期', trigger: 'change' }]
}

const offboardingRules = {
  user_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  leave_date: [{ required: true, message: '请选择离职日期', trigger: 'change' }],
  reason: [{ required: true, message: '请选择离职原因', trigger: 'change' }]
}

const onboardingFormRef = ref()
const offboardingFormRef = ref()

// 获取入职状态类型
const getOnboardingStatusType = (status) => {
  const types = { 1: 'info', 2: 'success', 3: 'danger' }
  return types[status] || 'info'
}

// 获取入职状态文本
const getOnboardingStatusText = (status) => {
  const texts = { 1: '待审核', 2: '已通过', 3: '已拒绝' }
  return texts[status] || '待审核'
}

// 获取离职状态类型
const getOffboardingStatusType = (status) => {
  const types = { 1: 'info', 2: 'success', 3: 'danger' }
  return types[status] || 'info'
}

// 获取离职状态文本
const getOffboardingStatusText = (status) => {
  const texts = { 1: '待审核', 2: '已通过', 3: '已拒绝' }
  return texts[status] || '待审核'
}

// 标签页切换
const handleTabChange = (tab) => {
  if (tab === 'onboarding') {
    loadOnboardingData()
  } else if (tab === 'offboarding') {
    loadOffboardingData()
  }
}

// 加载入职数据
const loadOnboardingData = async () => {
  onboardingLoading.value = true
  try {
    const params = {
      page: onboardingPagination.page,
      limit: onboardingPagination.limit,
      ...onboardingSearchForm
    }
    const response = await getOnboardingApplications(params)
    onboardingApplications.value = response.data
    onboardingPagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    onboardingLoading.value = false
  }
}

// 加载离职数据
const loadOffboardingData = async () => {
  offboardingLoading.value = true
  try {
    const params = {
      page: offboardingPagination.page,
      limit: offboardingPagination.limit,
      ...offboardingSearchForm
    }
    const response = await getOffboardingApplications(params)
    offboardingApplications.value = response.data
    offboardingPagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    offboardingLoading.value = false
  }
}

// 重置入职搜索
const resetOnboardingSearch = () => {
  onboardingSearchForm.keyword = ''
  onboardingSearchForm.status = ''
  onboardingPagination.page = 1
  loadOnboardingData()
}

// 重置离职搜索
const resetOffboardingSearch = () => {
  offboardingSearchForm.keyword = ''
  offboardingSearchForm.status = ''
  offboardingPagination.page = 1
  loadOffboardingData()
}

// 保存入职申请
const saveOnboardingApplication = async () => {
  try {
    await onboardingFormRef.value.validate()
    await createOnboardingApplication(onboardingForm)
    ElMessage.success('保存成功')
    showOnboardingDialog.value = false
    resetOnboardingForm()
    loadOnboardingData()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 保存离职申请
const saveOffboardingApplication = async () => {
  try {
    await offboardingFormRef.value.validate()
    await createOffboardingApplication(offboardingForm)
    ElMessage.success('保存成功')
    showOffboardingDialog.value = false
    resetOffboardingForm()
    loadOffboardingData()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 重置入职表单
const resetOnboardingForm = () => {
  Object.assign(onboardingForm, {
    user_id: '',
    position_id: '',
    org_id: '',
    start_date: '',
    salary: '',
    contract_type: '',
    notes: ''
  })
}

// 重置离职表单
const resetOffboardingForm = () => {
  Object.assign(offboardingForm, {
    user_id: '',
    leave_date: '',
    reason: '',
    handover_notes: ''
  })
}

// 查看入职详情
const viewOnboardingDetail = (row) => {
  ElMessage.info('查看入职详情功能待实现')
}

// 更新入职状态
const updateOnboardingStatus = async (row, status) => {
  try {
    // TODO: 实现更新入职状态API
    ElMessage.success('状态更新成功')
    loadOnboardingData()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 查看离职详情
const viewOffboardingDetail = (row) => {
  ElMessage.info('查看离职详情功能待实现')
}

// 更新离职状态
const updateOffboardingStatus = async (row, status) => {
  try {
    // TODO: 实现更新离职状态API
    ElMessage.success('状态更新成功')
    loadOffboardingData()
  } catch (error) {
    ElMessage.error('状态更新失败')
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
  loadOnboardingData()
  loadBaseData()
})
</script>

<style scoped>
.onboarding-management {
  padding: 20px;
}

.tab-content {
  padding: 20px 0;
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
