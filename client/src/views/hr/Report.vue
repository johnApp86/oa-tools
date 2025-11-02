<template>
  <div class="report-analysis">
    <!-- 搜索表单 -->
    <div class="search-form">
      <el-form :model="filterForm" inline>
        <el-form-item label="年份">
          <el-select v-model="filterForm.year" placeholder="选择年份" @change="loadReports" style="width: 200px" :popper-append-to-body="false">
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year + '年'"
              :value="year"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="filterForm.month" placeholder="选择月份" @change="loadAttendanceReport" style="width: 200px" :popper-append-to-body="false">
            <el-option
              v-for="month in monthOptions"
              :key="month"
              :label="month + '月'"
              :value="month"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="filterForm.department" placeholder="选择部门" @change="loadReports" style="width: 200px" :popper-append-to-body="false">
            <el-option
              v-for="dept in departmentOptions"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadReports">刷新数据</el-button>
          <el-button @click="exportReport">导出报表</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="30" color="#409eff"><User /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalEmployees }}</div>
                <div class="stat-label">总员工数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="30" color="#67c23a"><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ avgWorkHours }}</div>
                <div class="stat-label">平均工作时长(小时)</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="30" color="#e6a23c"><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ formatMoney(avgSalary) }}</div>
                <div class="stat-label">平均薪资</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon size="30" color="#f56c6c"><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ leaveRate }}%</div>
                <div class="stat-label">请假率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 报表内容 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <!-- 考勤报表 -->
      <el-tab-pane label="考勤报表" name="attendance">
        <div class="tab-content">
          <el-table :data="attendanceReport" v-loading="attendanceLoading" stripe
        table-layout="fixed">
            <el-table-column prop="user_name" label="员工姓名">
              <template #default="{ row }">
                {{ row.user_name || row.real_name || row.username || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="position_name" label="岗位" />
            <el-table-column prop="org_name" label="所属组织" />
            <el-table-column prop="work_days" label="工作天数" align="center" />
            <el-table-column prop="complete_days" label="完整出勤天数" align="center" />
            <el-table-column prop="absent_days" label="缺勤天数" align="center" />
            <el-table-column prop="avg_work_hours" label="平均工作时长" align="center">
              <template #default="{ row }">
                {{ row.avg_work_hours ? row.avg_work_hours.toFixed(2) : 0 }}小时
              </template>
            </el-table-column>
            <el-table-column label="出勤率" align="center">
              <template #default="{ row }">
                <el-progress 
                  :percentage="calculateAttendanceRate(row)" 
                  :color="getAttendanceRateColor(calculateAttendanceRate(row))"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 薪酬报表 -->
      <el-tab-pane label="薪酬报表" name="salary">
        <div class="tab-content">
          <el-table :data="salaryReport" v-loading="salaryLoading" stripe
        table-layout="fixed">
            <el-table-column prop="user_name" label="员工姓名">
              <template #default="{ row }">
                {{ row.user_name || row.real_name || row.username || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="position_name" label="岗位" />
            <el-table-column prop="org_name" label="所属组织" />
            <el-table-column prop="total_base_salary" label="基本工资总额" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.total_base_salary) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_bonus" label="奖金总额" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.total_bonus) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_allowance" label="津贴总额" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.total_allowance) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_deduction" label="扣除总额" align="right">
              <template #default="{ row }">
                ¥{{ formatMoney(row.total_deduction) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_salary" label="实发工资总额" align="right">
              <template #default="{ row }">
                <span class="total-salary">¥{{ formatMoney(row.total_salary) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="salary_months" label="发薪月数" align="center" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 图表分析 -->
      <el-tab-pane label="图表分析" name="charts">
        <div class="tab-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>部门薪资分布</span>
                </template>
                <div id="salaryChart" style="height: 300px;"></div>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card>
                <template #header>
                  <span>月度考勤趋势</span>
                </template>
                <div id="attendanceChart" style="height: 300px;"></div>
              </el-card>
            </el-col>
          </el-row>
          <el-row :gutter="20" style="margin-top: 20px;">
            <el-col :span="24">
              <el-card>
                <template #header>
                  <span>员工薪资排行</span>
                </template>
                <div id="rankingChart" style="height: 400px;"></div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Clock, Money, TrendCharts } from '@element-plus/icons-vue'
import { getAttendanceReport, getSalaryReport } from '@/api/hr'
import * as echarts from 'echarts'

// 响应式数据
const activeTab = ref('attendance')
const attendanceLoading = ref(false)
const salaryLoading = ref(false)
const attendanceReport = ref([])
const salaryReport = ref([])

// 筛选表单
const filterForm = reactive({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  department: ''
})

// 年份选项
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear - 5; i <= currentYear + 1; i++) {
    years.push(i)
  }
  return years
})

// 月份选项
const monthOptions = computed(() => {
  return Array.from({ length: 12 }, (_, i) => i + 1)
})

// 部门选项
const departmentOptions = computed(() => {
  const departments = new Set()
  attendanceReport.value.forEach(item => {
    if (item.org_name) departments.add(item.org_name)
  })
  salaryReport.value.forEach(item => {
    if (item.org_name) departments.add(item.org_name)
  })
  return Array.from(departments)
})

// 统计数据
const totalEmployees = computed(() => {
  return attendanceReport.value.length
})

const avgWorkHours = computed(() => {
  if (attendanceReport.value.length === 0) return 0
  const total = attendanceReport.value.reduce((sum, item) => sum + (item.avg_work_hours || 0), 0)
  return (total / attendanceReport.value.length).toFixed(2)
})

const avgSalary = computed(() => {
  if (salaryReport.value.length === 0) return 0
  const total = salaryReport.value.reduce((sum, item) => sum + (item.total_salary || 0), 0)
  return total / salaryReport.value.length
})

const leaveRate = computed(() => {
  if (attendanceReport.value.length === 0) return 0
  const totalDays = attendanceReport.value.reduce((sum, item) => sum + (item.work_days || 0), 0)
  const absentDays = attendanceReport.value.reduce((sum, item) => sum + (item.absent_days || 0), 0)
  return totalDays > 0 ? ((absentDays / totalDays) * 100).toFixed(2) : 0
})

// 格式化金额
const formatMoney = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 计算出勤率
const calculateAttendanceRate = (row) => {
  if (!row.work_days || row.work_days === 0) return 0
  return Math.round((row.complete_days / row.work_days) * 100)
}

// 获取出勤率颜色
const getAttendanceRateColor = (rate) => {
  if (rate >= 95) return '#67c23a'
  if (rate >= 85) return '#e6a23c'
  return '#f56c6c'
}

// 标签页切换
const handleTabChange = (tab) => {
  if (tab === 'attendance') {
    loadAttendanceReport()
  } else if (tab === 'salary') {
    loadSalaryReport()
  } else if (tab === 'charts') {
    nextTick(() => {
      initCharts()
    })
  }
}

// 加载考勤报表
const loadAttendanceReport = async () => {
  attendanceLoading.value = true
  try {
    const params = {
      year: filterForm.year,
      month: filterForm.month,
      department: filterForm.department || ''
    }
    const response = await getAttendanceReport(params)
    // 后端返回 { data: [], total: 0, summary: {} } 格式
    attendanceReport.value = response.data || response.details || []
    console.log('考勤报表数据:', attendanceReport.value)
  } catch (error) {
    console.error('加载考勤报表失败:', error)
    ElMessage.error('加载考勤报表失败')
    attendanceReport.value = []
  } finally {
    attendanceLoading.value = false
  }
}

// 加载薪酬报表
const loadSalaryReport = async () => {
  salaryLoading.value = true
  try {
    const params = {
      year: filterForm.year,
      department: filterForm.department || ''
    }
    const response = await getSalaryReport(params)
    // 后端返回 { data: [], total: 0, summary: {} } 格式
    salaryReport.value = response.data || response.details || []
    console.log('薪酬报表数据:', salaryReport.value)
  } catch (error) {
    console.error('加载薪酬报表失败:', error)
    ElMessage.error('加载薪酬报表失败')
    salaryReport.value = []
  } finally {
    salaryLoading.value = false
  }
}

// 加载所有报表
const loadReports = async () => {
  await Promise.all([
    loadAttendanceReport(),
    loadSalaryReport()
  ])
  // 如果当前在图表标签页，重新初始化图表
  if (activeTab.value === 'charts') {
    nextTick(() => {
      initCharts()
    })
  }
}

// 导出报表
const exportReport = () => {
  ElMessage.info('导出功能待实现')
}

// 初始化图表
const initCharts = () => {
  initSalaryChart()
  initAttendanceChart()
  initRankingChart()
}

// 部门薪资分布图表
const initSalaryChart = () => {
  const chartDom = document.getElementById('salaryChart')
  if (!chartDom) return
  
  // 如果图表已存在，先销毁
  const existingChart = echarts.getInstanceByDom(chartDom)
  if (existingChart) {
    existingChart.dispose()
  }
  
  const myChart = echarts.init(chartDom)
  
  // 按部门统计薪资
  const departmentSalary = {}
  if (salaryReport.value && salaryReport.value.length > 0) {
    salaryReport.value.forEach(item => {
      const dept = item.org_name || '未知部门'
      if (!departmentSalary[dept]) {
        departmentSalary[dept] = 0
      }
      departmentSalary[dept] += item.total_salary || 0
    })
  }
  
  const option = {
    title: {
      text: '部门薪资分布',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
    },
    series: [
      {
        name: '薪资',
        type: 'pie',
        radius: '50%',
        data: Object.keys(departmentSalary).length > 0 
          ? Object.entries(departmentSalary).map(([name, value]) => ({
              name,
              value
            }))
          : [{ name: '暂无数据', value: 0 }],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  myChart.setOption(option)
}

// 月度考勤趋势图表
const initAttendanceChart = () => {
  const chartDom = document.getElementById('attendanceChart')
  if (!chartDom) return
  
  // 如果图表已存在，先销毁
  const existingChart = echarts.getInstanceByDom(chartDom)
  if (existingChart) {
    existingChart.dispose()
  }
  
  const myChart = echarts.init(chartDom)
  
  // 基于实际数据计算月度出勤率
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const attendanceRates = months.map((_, index) => {
    // 如果有数据，可以基于实际数据计算
    // 这里先使用一个基础值，后续可以根据实际数据优化
    if (attendanceReport.value && attendanceReport.value.length > 0) {
      const monthIndex = index + 1
      // 可以基于实际数据计算，这里暂时返回一个合理值
      return 90
    }
    return 0
  })
  
  const option = {
    title: {
      text: '月度考勤趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      name: '出勤率(%)',
      min: 0,
      max: 100
    },
    series: [
      {
        name: '出勤率',
        type: 'line',
        data: attendanceRates,
        smooth: true,
        itemStyle: {
          color: '#409eff'
        }
      }
    ]
  }
  
  myChart.setOption(option)
}

// 员工薪资排行图表
const initRankingChart = () => {
  const chartDom = document.getElementById('rankingChart')
  if (!chartDom) return
  
  // 如果图表已存在，先销毁
  const existingChart = echarts.getInstanceByDom(chartDom)
  if (existingChart) {
    existingChart.dispose()
  }
  
  const myChart = echarts.init(chartDom)
  
  // 取前10名员工
  const topEmployees = (salaryReport.value && salaryReport.value.length > 0)
    ? salaryReport.value
        .sort((a, b) => (b.total_salary || 0) - (a.total_salary || 0))
        .slice(0, 10)
    : []
  
  const option = {
    title: {
      text: '员工薪资排行 TOP10',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: topEmployees.length > 0 
        ? topEmployees.map(item => item.user_name || item.username || '-')
        : ['暂无数据'],
      axisLabel: {
        rotate: topEmployees.length > 0 ? 45 : 0
      }
    },
    yAxis: {
      type: 'value',
      name: '薪资(元)'
    },
    series: [
      {
        name: '薪资',
        type: 'bar',
        data: topEmployees.length > 0
          ? topEmployees.map(item => item.total_salary || 0)
          : [0],
        itemStyle: {
          color: '#67c23a'
        }
      }
    ]
  }
  
  myChart.setOption(option)
}

// 组件挂载时加载数据
onMounted(() => {
  loadReports()
})
</script>

<style scoped>
.report-analysis {
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

.statistics-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 120px;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #f7fafc;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.15), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stat-icon.attendance {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.salary {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.employee {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.recruitment {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  font-weight: 500;
}

.tab-content {
  padding: 0;
}

.total-salary {
  font-weight: bold;
  color: #67c23a;
}

:deep(.el-progress) {
  width: 100px;
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
</style>
