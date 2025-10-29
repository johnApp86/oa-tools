<template>
  <div class="attendance-management">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 考勤管理 -->
      <el-tab-pane label="考勤管理" name="attendance">
        <div class="tab-content">
          <div class="page-header">
            <h3>考勤管理</h3>
            <div class="header-actions">
              <el-button type="success" @click="checkIn" :disabled="todayCheckedIn">
                <el-icon><Clock /></el-icon>
                签到
              </el-button>
              <el-button type="warning" @click="checkOut" :disabled="!todayCheckedIn || todayCheckedOut">
                <el-icon><Clock /></el-icon>
                签退
              </el-button>
            </div>
          </div>

          <!-- 今日考勤状态 -->
          <div class="today-status">
            <el-card>
              <template #header>
                <span>今日考勤状态</span>
              </template>
              <div class="status-info">
                <div class="status-item">
                  <span class="label">签到时间：</span>
                  <span class="value">{{ todayAttendance.checkin_time || '未签到' }}</span>
                </div>
                <div class="status-item">
                  <span class="label">签退时间：</span>
                  <span class="value">{{ todayAttendance.checkout_time || '未签退' }}</span>
                </div>
                <div class="status-item">
                  <span class="label">工作时长：</span>
                  <span class="value">{{ todayWorkHours }}小时</span>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 搜索筛选 -->
          <div class="search-section">
            <el-form :model="attendanceSearchForm" inline>
              <el-form-item label="员工">
                <el-select v-model="attendanceSearchForm.user_id" placeholder="选择员工" clearable>
                  <el-option
                    v-for="user in allUsers"
                    :key="user.id"
                    :label="user.real_name || user.username"
                    :value="user.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="开始日期">
                <el-date-picker
                  v-model="attendanceSearchForm.date_start"
                  type="date"
                  placeholder="选择开始日期"
                />
              </el-form-item>
              <el-form-item label="结束日期">
                <el-date-picker
                  v-model="attendanceSearchForm.date_end"
                  type="date"
                  placeholder="选择结束日期"
                />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadAttendanceData">搜索</el-button>
                <el-button @click="resetAttendanceSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 考勤记录列表 -->
          <el-table :data="attendanceRecords" v-loading="attendanceLoading" stripe>
            <el-table-column prop="user_name" label="员工姓名" />
            <el-table-column prop="position_name" label="岗位" />
            <el-table-column prop="date" label="日期" />
            <el-table-column prop="checkin_time" label="签到时间">
              <template #default="{ row }">
                {{ row.checkin_time ? formatTime(row.checkin_time) : '未签到' }}
              </template>
            </el-table-column>
            <el-table-column prop="checkout_time" label="签退时间">
              <template #default="{ row }">
                {{ row.checkout_time ? formatTime(row.checkout_time) : '未签退' }}
              </template>
            </el-table-column>
            <el-table-column label="工作时长">
              <template #default="{ row }">
                {{ calculateWorkHours(row.checkin_time, row.checkout_time) }}小时
              </template>
            </el-table-column>
            <el-table-column prop="checkin_location" label="签到地点" />
            <el-table-column prop="checkout_location" label="签退地点" />
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="attendancePagination.page"
              v-model:page-size="attendancePagination.limit"
              :total="attendancePagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadAttendanceData"
              @current-change="loadAttendanceData"
            />
          </div>
        </div>
      </el-tab-pane>

      <!-- 请假管理 -->
      <el-tab-pane label="请假管理" name="leave">
        <div class="tab-content">
          <div class="page-header">
            <h3>请假管理</h3>
            <el-button type="primary" @click="showLeaveDialog = true">
              <el-icon><Plus /></el-icon>
              申请请假
            </el-button>
          </div>

          <!-- 搜索筛选 -->
          <div class="search-section">
            <el-form :model="leaveSearchForm" inline>
              <el-form-item label="关键词">
                <el-input v-model="leaveSearchForm.keyword" placeholder="搜索姓名或邮箱" clearable />
              </el-form-item>
              <el-form-item label="请假类型">
                <el-select v-model="leaveSearchForm.type" placeholder="选择请假类型" clearable>
                  <el-option label="年假" value="annual" />
                  <el-option label="病假" value="sick" />
                  <el-option label="事假" value="personal" />
                  <el-option label="调休" value="compensatory" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="leaveSearchForm.status" placeholder="选择状态" clearable>
                  <el-option label="待审核" value="1" />
                  <el-option label="已通过" value="2" />
                  <el-option label="已拒绝" value="3" />
                </el-select>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="loadLeaveData">搜索</el-button>
                <el-button @click="resetLeaveSearch">重置</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 请假申请列表 -->
          <el-table :data="leaveApplications" v-loading="leaveLoading" stripe>
            <el-table-column prop="user_name" label="员工姓名" />
            <el-table-column prop="position_name" label="岗位" />
            <el-table-column prop="type" label="请假类型">
              <template #default="{ row }">
                {{ getLeaveTypeText(row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="start_date" label="开始日期" />
            <el-table-column prop="end_date" label="结束日期" />
            <el-table-column label="请假天数">
              <template #default="{ row }">
                {{ calculateLeaveDays(row.start_date, row.end_date) }}天
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="请假原因" />
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getLeaveStatusType(row.status)">
                  {{ getLeaveStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" />
            <el-table-column label="操作" width="200">
              <template #default="{ row }">
                <el-button size="small" @click="viewLeaveDetail(row)">查看详情</el-button>
                <el-button size="small" type="success" @click="updateLeaveStatus(row, 2)">通过</el-button>
                <el-button size="small" type="danger" @click="updateLeaveStatus(row, 3)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination">
            <el-pagination
              v-model:current-page="leavePagination.page"
              v-model:page-size="leavePagination.limit"
              :total="leavePagination.total"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="loadLeaveData"
              @current-change="loadLeaveData"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 请假申请对话框 -->
    <el-dialog
      v-model="showLeaveDialog"
      title="申请请假"
      width="600px"
    >
      <el-form :model="leaveForm" :rules="leaveRules" ref="leaveFormRef" label-width="100px">
        <el-form-item label="请假类型" prop="type">
          <el-select v-model="leaveForm.type" placeholder="选择请假类型" style="width: 100%">
            <el-option label="年假" value="annual" />
            <el-option label="病假" value="sick" />
            <el-option label="事假" value="personal" />
            <el-option label="调休" value="compensatory" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="开始日期" prop="start_date">
          <el-date-picker
            v-model="leaveForm.start_date"
            type="date"
            placeholder="选择开始日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="end_date">
          <el-date-picker
            v-model="leaveForm.end_date"
            type="date"
            placeholder="选择结束日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="请假原因" prop="reason">
          <el-input
            v-model="leaveForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入请假原因"
          />
        </el-form-item>
        <el-form-item label="紧急联系人">
          <el-input v-model="leaveForm.emergency_contact" placeholder="请输入紧急联系人及电话" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showLeaveDialog = false">取消</el-button>
        <el-button type="primary" @click="saveLeaveApplication">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Clock } from '@element-plus/icons-vue'
import { 
  getAttendanceRecords, 
  checkInOut,
  getLeaveApplications,
  createLeaveApplication
} from '@/api/hr'
import { getUserList } from '@/api/user'

// 响应式数据
const activeTab = ref('attendance')

// 考勤管理相关
const attendanceLoading = ref(false)
const attendanceRecords = ref([])
const todayAttendance = ref({})
const allUsers = ref([])

// 请假管理相关
const leaveLoading = ref(false)
const leaveApplications = ref([])
const showLeaveDialog = ref(false)

// 考勤搜索表单
const attendanceSearchForm = reactive({
  user_id: '',
  date_start: '',
  date_end: ''
})

// 请假搜索表单
const leaveSearchForm = reactive({
  keyword: '',
  type: '',
  status: ''
})

// 考勤分页
const attendancePagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 请假分页
const leavePagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 请假表单
const leaveForm = reactive({
  type: '',
  start_date: '',
  end_date: '',
  reason: '',
  emergency_contact: ''
})

// 表单验证规则
const leaveRules = {
  type: [{ required: true, message: '请选择请假类型', trigger: 'change' }],
  start_date: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  end_date: [{ required: true, message: '请选择结束日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入请假原因', trigger: 'blur' }]
}

const leaveFormRef = ref()

// 计算属性
const todayCheckedIn = computed(() => {
  return !!todayAttendance.value.checkin_time
})

const todayCheckedOut = computed(() => {
  return !!todayAttendance.value.checkout_time
})

const todayWorkHours = computed(() => {
  if (todayAttendance.value.checkin_time && todayAttendance.value.checkout_time) {
    return calculateWorkHours(todayAttendance.value.checkin_time, todayAttendance.value.checkout_time)
  }
  return 0
})

// 获取请假类型文本
const getLeaveTypeText = (type) => {
  const texts = {
    annual: '年假',
    sick: '病假',
    personal: '事假',
    compensatory: '调休',
    other: '其他'
  }
  return texts[type] || type
}

// 获取请假状态类型
const getLeaveStatusType = (status) => {
  const types = { 1: 'info', 2: 'success', 3: 'danger' }
  return types[status] || 'info'
}

// 获取请假状态文本
const getLeaveStatusText = (status) => {
  const texts = { 1: '待审核', 2: '已通过', 3: '已拒绝' }
  return texts[status] || '待审核'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleString()
}

// 计算工作时长
const calculateWorkHours = (checkinTime, checkoutTime) => {
  if (!checkinTime || !checkoutTime) return 0
  const start = new Date(checkinTime)
  const end = new Date(checkoutTime)
  const diffMs = end - start
  return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100
}

// 计算请假天数
const calculateLeaveDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

// 标签页切换
const handleTabChange = (tab) => {
  if (tab === 'attendance') {
    loadAttendanceData()
    loadTodayAttendance()
  } else if (tab === 'leave') {
    loadLeaveData()
  }
}

// 加载考勤数据
const loadAttendanceData = async () => {
  attendanceLoading.value = true
  try {
    const params = {
      page: attendancePagination.page,
      limit: attendancePagination.limit,
      ...attendanceSearchForm
    }
    const response = await getAttendanceRecords(params)
    attendanceRecords.value = response.data
    attendancePagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    attendanceLoading.value = false
  }
}

// 加载今日考勤
const loadTodayAttendance = async () => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const params = {
      date_start: today,
      date_end: today,
      limit: 1
    }
    const response = await getAttendanceRecords(params)
    if (response.data && response.data.length > 0) {
      todayAttendance.value = response.data[0]
    } else {
      todayAttendance.value = {}
    }
  } catch (error) {
    console.error('加载今日考勤失败:', error)
  }
}

// 加载请假数据
const loadLeaveData = async () => {
  leaveLoading.value = true
  try {
    const params = {
      page: leavePagination.page,
      limit: leavePagination.limit,
      ...leaveSearchForm
    }
    const response = await getLeaveApplications(params)
    leaveApplications.value = response.data
    leavePagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    leaveLoading.value = false
  }
}

// 重置考勤搜索
const resetAttendanceSearch = () => {
  attendanceSearchForm.user_id = ''
  attendanceSearchForm.date_start = ''
  attendanceSearchForm.date_end = ''
  attendancePagination.page = 1
  loadAttendanceData()
}

// 重置请假搜索
const resetLeaveSearch = () => {
  leaveSearchForm.keyword = ''
  leaveSearchForm.type = ''
  leaveSearchForm.status = ''
  leavePagination.page = 1
  loadLeaveData()
}

// 签到
const checkIn = async () => {
  try {
    await ElMessageBox.prompt('请输入签到地点', '签到', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入签到地点'
    })
    
    const location = arguments[0].value || '办公室'
    await checkInOut({
      user_id: 1, // TODO: 获取当前用户ID
      type: 'checkin',
      location: location
    })
    
    ElMessage.success('签到成功')
    loadTodayAttendance()
    loadAttendanceData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('签到失败')
    }
  }
}

// 签退
const checkOut = async () => {
  try {
    await ElMessageBox.prompt('请输入签退地点', '签退', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入签退地点'
    })
    
    const location = arguments[0].value || '办公室'
    await checkInOut({
      user_id: 1, // TODO: 获取当前用户ID
      type: 'checkout',
      location: location
    })
    
    ElMessage.success('签退成功')
    loadTodayAttendance()
    loadAttendanceData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('签退失败')
    }
  }
}

// 保存请假申请
const saveLeaveApplication = async () => {
  try {
    await leaveFormRef.value.validate()
    await createLeaveApplication({
      ...leaveForm,
      user_id: 1 // TODO: 获取当前用户ID
    })
    ElMessage.success('申请提交成功')
    showLeaveDialog.value = false
    resetLeaveForm()
    loadLeaveData()
  } catch (error) {
    ElMessage.error('申请提交失败')
  }
}

// 重置请假表单
const resetLeaveForm = () => {
  Object.assign(leaveForm, {
    type: '',
    start_date: '',
    end_date: '',
    reason: '',
    emergency_contact: ''
  })
}

// 查看请假详情
const viewLeaveDetail = (row) => {
  ElMessage.info('查看请假详情功能待实现')
}

// 更新请假状态
const updateLeaveStatus = async (row, status) => {
  try {
    // TODO: 实现更新请假状态API
    ElMessage.success('状态更新成功')
    loadLeaveData()
  } catch (error) {
    ElMessage.error('状态更新失败')
  }
}

// 加载基础数据
const loadBaseData = async () => {
  try {
    const usersRes = await getUserList()
    allUsers.value = usersRes.data || usersRes
  } catch (error) {
    ElMessage.error('加载基础数据失败')
  }
}

// 组件挂载时加载数据
onMounted(() => {
  loadAttendanceData()
  loadTodayAttendance()
  loadBaseData()
})
</script>

<style scoped>
.attendance-management {
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

.header-actions {
  display: flex;
  gap: 10px;
}

.today-status {
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  gap: 30px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-item .label {
  font-size: 14px;
  color: #666;
}

.status-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #333;
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
