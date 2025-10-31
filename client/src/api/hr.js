import request from './request'

// ==================== 招聘管理 ====================

// 获取招聘职位列表
export const getRecruitmentPositions = (params) => {
  return request({
    url: '/hr/recruitment/positions',
    method: 'get',
    params
  })
}

// 创建招聘职位
export const createRecruitmentPosition = (data) => {
  return request({
    url: '/hr/recruitment/positions',
    method: 'post',
    data
  })
}

// 删除招聘职位
export const deleteRecruitmentPosition = (id) => {
  return request({
    url: `/hr/recruitment/positions/${id}`,
    method: 'delete'
  })
}

// 获取简历列表
export const getResumes = (params) => {
  return request({
    url: '/hr/recruitment/resumes',
    method: 'get',
    params
  })
}

// 提交简历
export const submitResume = (data) => {
  return request({
    url: '/hr/recruitment/resumes',
    method: 'post',
    data
  })
}

// ==================== 入职离职管理 ====================

// 获取入职申请列表
export const getOnboardingApplications = (params) => {
  return request({
    url: '/hr/onboarding/applications',
    method: 'get',
    params
  })
}

// 创建入职申请
export const createOnboardingApplication = (data) => {
  return request({
    url: '/hr/onboarding/applications',
    method: 'post',
    data
  })
}

// 获取离职申请列表
export const getOffboardingApplications = (params) => {
  return request({
    url: '/hr/onboarding/offboarding/applications',
    method: 'get',
    params
  })
}

// 创建离职申请
export const createOffboardingApplication = (data) => {
  return request({
    url: '/hr/onboarding/offboarding/applications',
    method: 'post',
    data
  })
}

// ==================== 考勤管理 ====================

// 获取考勤记录
export const getAttendanceRecords = (params) => {
  return request({
    url: '/hr/attendance/records',
    method: 'get',
    params
  })
}

// 打卡记录
export const checkInOut = (data) => {
  return request({
    url: '/hr/attendance/checkin',
    method: 'post',
    data
  })
}

// ==================== 请假管理 ====================

// 获取请假申请列表
export const getLeaveApplications = (params) => {
  return request({
    url: '/hr/leave/applications',
    method: 'get',
    params
  })
}

// 创建请假申请
export const createLeaveApplication = (data) => {
  return request({
    url: '/hr/leave/applications',
    method: 'post',
    data
  })
}

// ==================== 薪酬福利管理 ====================

// 获取薪酬记录
export const getSalaryRecords = (params) => {
  return request({
    url: '/hr/salary/records',
    method: 'get',
    params
  })
}

// 创建薪酬记录
export const createSalaryRecord = (data) => {
  return request({
    url: '/hr/salary/records',
    method: 'post',
    data
  })
}

// 更新薪酬记录
export const updateSalaryRecord = (id, data) => {
  return request({
    url: `/hr/salary/records/${id}`,
    method: 'put',
    data
  })
}

// 删除薪酬记录
export const deleteSalaryRecord = (id) => {
  return request({
    url: `/hr/salary/records/${id}`,
    method: 'delete'
  })
}

// ==================== 档案管理 ====================

// 获取员工档案列表
export const getEmployeeFiles = (params) => {
  return request({
    url: '/hr/employee/files',
    method: 'get',
    params
  })
}

// 创建员工档案
export const createEmployeeFile = (data) => {
  return request({
    url: '/hr/employee/files',
    method: 'post',
    data
  })
}

// 删除员工档案
export const deleteEmployeeFile = (id) => {
  return request({
    url: `/hr/employee/files/${id}`,
    method: 'delete'
  })
}

// ==================== 报表分析 ====================

// 获取考勤统计
export const getAttendanceReport = (params) => {
  return request({
    url: '/hr/reports/attendance',
    method: 'get',
    params
  })
}

// 获取薪酬统计
export const getSalaryReport = (params) => {
  return request({
    url: '/hr/reports/salary',
    method: 'get',
    params
  })
}
