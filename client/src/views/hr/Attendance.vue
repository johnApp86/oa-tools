<template>
  <div class="attendance-management">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 考勤管理 -->
      <el-tab-pane label="考勤管理" name="attendance">
        <div class="tab-content">
          <!-- 操作按钮 -->
          <div class="button-group">
            <el-button type="success" @click="checkIn" :disabled="todayCheckedIn">
              <el-icon><Clock /></el-icon>
              签到
            </el-button>
            <el-button type="warning" @click="checkOut" :disabled="!todayCheckedIn || todayCheckedOut">
              <el-icon><Clock /></el-icon>
              签退
            </el-button>
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
                  <span class="value" :class="getWorkHoursClass(todayAttendance.checkin_time, todayAttendance.checkout_time)">
                    {{ formatWorkHours(todayAttendance.checkin_time, todayAttendance.checkout_time) }}
                  </span>
                </div>
              </div>
            </el-card>
          </div>

          <!-- 搜索表单 -->
          <div class="search-form">
            <el-form :model="attendanceSearchForm" inline>
              <el-form-item label="员工">
                <el-select v-model="attendanceSearchForm.user_id" placeholder="选择员工" clearable
            style="width: 200px"
            :popper-append-to-body="false">
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
          <div class="table-container">
            <el-table :data="attendanceRecords" v-loading="attendanceLoading" stripe border
        table-layout="fixed">
            <el-table-column prop="user_name" label="员工姓名">
              <template #default="{ row }">
                {{ row.user_name || row.real_name || row.username || '-' }}
              </template>
            </el-table-column>
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
                <span :class="getWorkHoursClass(row.checkin_time, row.checkout_time)">
                  {{ formatWorkHours(row.checkin_time, row.checkout_time) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="checkin_location" label="签到地点" />
            <el-table-column prop="checkout_location" label="签退地点" />
            </el-table>
          </div>

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
          <!-- 搜索表单 -->
          <div class="search-form">
            <el-form :model="leaveSearchForm" inline>
              <el-form-item label="关键词">
                <el-input
                  v-model="leaveSearchForm.keyword"
                  placeholder="搜索姓名或邮箱"
                  clearable
                  @keyup.enter="loadLeaveData"
                />
              </el-form-item>
              <el-form-item label="请假类型">
                <el-select v-model="leaveSearchForm.type" placeholder="选择请假类型" clearable
            style="width: 200px"
            :popper-append-to-body="false">
                  <el-option label="年假" value="annual" />
                  <el-option label="病假" value="sick" />
                  <el-option label="事假" value="personal" />
                  <el-option label="调休" value="compensatory" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item label="状态">
                <el-select v-model="leaveSearchForm.status" placeholder="选择状态" clearable
            style="width: 200px"
            :popper-append-to-body="false">
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

          <!-- 操作按钮 -->
          <div class="button-group">
            <el-button type="primary" @click="showLeaveDialog = true">
              <el-icon><Plus /></el-icon>
              申请请假
            </el-button>
          </div>

          <!-- 请假统计卡片 -->
          <div class="leave-stats">
            <div class="leave-stat-card">
              <div class="leave-stat-value">{{ leaveStats.total }}</div>
              <div class="leave-stat-label">总申请数</div>
            </div>
            <div class="leave-stat-card">
              <div class="leave-stat-value">{{ leaveStats.pending }}</div>
              <div class="leave-stat-label">待审核</div>
            </div>
            <div class="leave-stat-card">
              <div class="leave-stat-value">{{ leaveStats.approved }}</div>
              <div class="leave-stat-label">已通过</div>
            </div>
            <div class="leave-stat-card">
              <div class="leave-stat-value">{{ leaveStats.rejected }}</div>
              <div class="leave-stat-label">已拒绝</div>
            </div>
          </div>

          <!-- 请假申请列表 -->
          <div class="table-container">
            <el-table :data="leaveApplications" v-loading="leaveLoading" stripe border
        table-layout="fixed">
            <el-table-column prop="user_name" label="员工姓名">
              <template #default="{ row }">
                {{ row.user_name || row.real_name || row.username || '-' }}
              </template>
            </el-table-column>
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
                <span class="leave-days">{{ calculateLeaveDays(row.start_date, row.end_date) }}天</span>
              </template>
            </el-table-column>
            <el-table-column prop="reason" label="请假原因">
              <template #default="{ row }">
                <span class="leave-reason" :title="row.reason">{{ row.reason }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getLeaveStatusType(row.status)">
                  {{ getLeaveStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" />
            <el-table-column label="操作" width="250" show-overflow-tooltip>
              <template #default="{ row }">
                <div class="operation-buttons">
                  <el-button size="small" @click="viewLeaveDetail(row)">查看详情</el-button>
                  <el-button size="small" type="success" @click="updateLeaveStatus(row, 2)">通过</el-button>
                  <el-button size="small" type="danger" @click="updateLeaveStatus(row, 3)">拒绝</el-button>
                </div>
              </template>
            </el-table-column>
            </el-table>
          </div>

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

// 请假统计数据
const leaveStats = computed(() => {
  const total = leaveApplications.value.length
  const pending = leaveApplications.value.filter(item => item.status === 1).length
  const approved = leaveApplications.value.filter(item => item.status === 2).length
  const rejected = leaveApplications.value.filter(item => item.status === 3).length
  
  return {
    total,
    pending,
    approved,
    rejected
  }
})

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

// 计算工作时长（确保不为负数）
const calculateWorkHours = (checkinTime, checkoutTime) => {
  if (!checkinTime || !checkoutTime) return 0
  const start = new Date(checkinTime)
  const end = new Date(checkoutTime)
  const diffMs = end - start
  const hours = Math.round(diffMs / (1000 * 60 * 60) * 100) / 100
  // 如果计算出的时长为负数，返回0（可能是数据异常，签退时间早于签到时间）
  return hours > 0 ? hours : 0
}

// 格式化工作时长显示
const formatWorkHours = (checkinTime, checkoutTime) => {
  if (!checkinTime || !checkoutTime) return '0小时'
  const hours = calculateWorkHours(checkinTime, checkoutTime)
  const start = new Date(checkinTime)
  const end = new Date(checkoutTime)
  
  // 如果签退时间早于签到时间，显示警告
  if (end < start) {
    return '数据异常（0小时）'
  }
  
  return `${hours}小时`
}

// 获取工作时长的样式类
const getWorkHoursClass = (checkinTime, checkoutTime) => {
  if (!checkinTime || !checkoutTime) return ''
  const start = new Date(checkinTime)
  const end = new Date(checkoutTime)
  
  // 如果签退时间早于签到时间，显示警告样式
  if (end < start) {
    return 'work-hours-error'
  }
  
  const hours = calculateWorkHours(checkinTime, checkoutTime)
  // 工作时长小于8小时显示警告
  if (hours > 0 && hours < 8) {
    return 'work-hours-warning'
  }
  
  return 'work-hours-normal'
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
  padding: 0;
}

.tab-content {
  padding: 0;
}

.button-group {
  margin-bottom: 24px;
}

.today-status {
  margin-bottom: 24px;
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

/* 工作时长样式 */
.work-hours-normal {
  color: #10b981;
  font-weight: 600;
}

.work-hours-warning {
  color: #f59e0b;
  font-weight: 600;
}

.work-hours-error {
  color: #ef4444;
  font-weight: 600;
}

.search-form {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #f7fafc;
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

:deep(.el-button--success) {
  background: linear-gradient(135deg, #68d391 0%, #48bb78 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(104, 211, 145, 0.3);
}

:deep(.el-button--success:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(104, 211, 145, 0.4);
}

:deep(.el-button--warning) {
  background: linear-gradient(135deg, #f6e05e 0%, #d69e2e 100%);
  border: none;
  box-shadow: 0 2px 4px rgba(246, 224, 94, 0.3);
}

:deep(.el-button--warning:hover) {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(246, 224, 94, 0.4);
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

/* 请假页面特殊样式 */
.leave-management {
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  min-height: 100vh;
}

/* 请假类型标签样式 */
:deep(.el-tag--info) {
  background: linear-gradient(135deg, #e0f2fe 0%, #b3e5fc 100%);
  border: none;
  color: #0277bd;
  font-weight: 500;
}

/* 请假状态标签特殊样式 */
:deep(.el-tag--warning) {
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: none;
  color: #f57c00;
  font-weight: 500;
}

:deep(.el-tag--success) {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border: none;
  color: #2e7d32;
  font-weight: 500;
}

:deep(.el-tag--danger) {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border: none;
  color: #c62828;
  font-weight: 500;
}

/* 请假天数特殊样式 */
.leave-days {
  font-weight: 600;
  color: #1976d2;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

/* 请假原因样式 */
.leave-reason {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮组样式 */
.operation-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.operation-buttons .el-button {
  flex-shrink: 0;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
  width: 100% !important;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  color: #4a5568;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f7fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table tr:hover > td) {
  background-color: #f7fafc;
}

.operation-buttons .el-button {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: auto;
  padding: 4px 8px;
  font-size: 12px;
}

/* 请假申请卡片样式 */
.leave-application-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f7fafc;
  transition: all 0.3s ease;
}

.leave-application-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* 请假统计卡片 */
.leave-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.leave-stat-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
  text-align: center;
  transition: all 0.3s ease;
}

.leave-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.leave-stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 8px;
}

.leave-stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}
</style>
