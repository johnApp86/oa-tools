<template>
  <div class="report-analysis">
    <div class="page-header">
      <h2>报表分析</h2>
    </div>

    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="年份">
          <el-select v-model="filterForm.year" placeholder="选择年份" @change="loadReports">
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year + '年'"
              :value="year"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="filterForm.month" placeholder="选择月份" @change="loadAttendanceReport">
            <el-option
              v-for="month in monthOptions"
              :key="month"
              :label="month + '月'"
              :value="month"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="filterForm.department" placeholder="选择部门" @change="loadReports">
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
          <el-table :data="attendanceReport" v-loading="attendanceLoading" stripe>
            <el-table-column prop="user_name" label="员工姓名" />
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
          <el-table :data="salaryReport" v-loading="salaryLoading" stripe>
            <el-table-column prop="user_name" label="员工姓名" />
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
      department: filterForm.department
    }
    const response = await getAttendanceReport(params)
    attendanceReport.value = response.data
  } catch (error) {
    ElMessage.error('加载考勤报表失败')
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
      department: filterForm.department
    }
    const response = await getSalaryReport(params)
    salaryReport.value = response.data
  } catch (error) {
    ElMessage.error('加载薪酬报表失败')
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
  
  const myChart = echarts.init(chartDom)
  
  // 按部门统计薪资
  const departmentSalary = {}
  salaryReport.value.forEach(item => {
    const dept = item.org_name || '未知部门'
    if (!departmentSalary[dept]) {
      departmentSalary[dept] = 0
    }
    departmentSalary[dept] += item.total_salary || 0
  })
  
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
        data: Object.entries(departmentSalary).map(([name, value]) => ({
          name,
          value
        })),
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
  
  const myChart = echarts.init(chartDom)
  
  // 模拟月度数据
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const attendanceRates = months.map(() => Math.floor(Math.random() * 20) + 80) // 80-100%的随机出勤率
  
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
  
  const myChart = echarts.init(chartDom)
  
  // 取前10名员工
  const topEmployees = salaryReport.value
    .sort((a, b) => (b.total_salary || 0) - (a.total_salary || 0))
    .slice(0, 10)
  
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
      data: topEmployees.map(item => item.user_name),
      axisLabel: {
        rotate: 45
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
        data: topEmployees.map(item => item.total_salary || 0),
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
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.filter-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.statistics-cards {
  margin-bottom: 30px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.tab-content {
  padding: 20px 0;
}

.total-salary {
  font-weight: bold;
  color: #67c23a;
}

:deep(.el-progress) {
  width: 100px;
}
</style>
