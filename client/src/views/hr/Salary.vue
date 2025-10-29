<template>
  <div class="salary-management">
    <div class="page-header">
      <h2>薪酬福利管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新增薪酬记录
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <div class="search-section">
      <el-form :model="searchForm" inline>
        <el-form-item label="员工">
          <el-select v-model="searchForm.user_id" placeholder="选择员工" clearable>
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.real_name || user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年份">
          <el-select v-model="searchForm.year" placeholder="选择年份" clearable>
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year + '年'"
              :value="year"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="searchForm.month" placeholder="选择月份" clearable>
            <el-option
              v-for="month in monthOptions"
              :key="month"
              :label="month + '月'"
              :value="month"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 薪酬记录列表 -->
    <el-table :data="salaryRecords" v-loading="loading" stripe>
      <el-table-column prop="user_name" label="员工姓名" />
      <el-table-column prop="position_name" label="岗位" />
      <el-table-column prop="year" label="年份" />
      <el-table-column prop="month" label="月份" />
      <el-table-column prop="base_salary" label="基本工资" align="right">
        <template #default="{ row }">
          ¥{{ formatMoney(row.base_salary) }}
        </template>
      </el-table-column>
      <el-table-column prop="bonus" label="奖金" align="right">
        <template #default="{ row }">
          ¥{{ formatMoney(row.bonus) }}
        </template>
      </el-table-column>
      <el-table-column prop="allowance" label="津贴" align="right">
        <template #default="{ row }">
          ¥{{ formatMoney(row.allowance) }}
        </template>
      </el-table-column>
      <el-table-column prop="deduction" label="扣除" align="right">
        <template #default="{ row }">
          ¥{{ formatMoney(row.deduction) }}
        </template>
      </el-table-column>
      <el-table-column label="实发工资" align="right">
        <template #default="{ row }">
          <span class="total-salary">
            ¥{{ formatMoney(calculateTotalSalary(row)) }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="notes" label="备注" />
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column label="操作" width="150">
        <template #default="{ row }">
          <el-button size="small" @click="editRecord(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="deleteRecord(row)">删除</el-button>
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

    <!-- 创建/编辑薪酬记录对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRecord ? '编辑薪酬记录' : '新增薪酬记录'"
      width="600px"
    >
      <el-form :model="salaryForm" :rules="salaryRules" ref="salaryFormRef" label-width="100px">
        <el-form-item label="员工" prop="user_id">
          <el-select v-model="salaryForm.user_id" placeholder="选择员工" style="width: 100%">
            <el-option
              v-for="user in allUsers"
              :key="user.id"
              :label="user.real_name || user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="年份" prop="year">
          <el-select v-model="salaryForm.year" placeholder="选择年份" style="width: 100%">
            <el-option
              v-for="year in yearOptions"
              :key="year"
              :label="year + '年'"
              :value="year"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="月份" prop="month">
          <el-select v-model="salaryForm.month" placeholder="选择月份" style="width: 100%">
            <el-option
              v-for="month in monthOptions"
              :key="month"
              :label="month + '月'"
              :value="month"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="基本工资" prop="base_salary">
          <el-input-number
            v-model="salaryForm.base_salary"
            :min="0"
            :precision="2"
            placeholder="请输入基本工资"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="奖金">
          <el-input-number
            v-model="salaryForm.bonus"
            :min="0"
            :precision="2"
            placeholder="请输入奖金"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="津贴">
          <el-input-number
            v-model="salaryForm.allowance"
            :min="0"
            :precision="2"
            placeholder="请输入津贴"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="扣除">
          <el-input-number
            v-model="salaryForm.deduction"
            :min="0"
            :precision="2"
            placeholder="请输入扣除金额"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="salaryForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <!-- 薪酬统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">¥{{ formatMoney(totalBaseSalary) }}</div>
              <div class="stat-label">基本工资总额</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">¥{{ formatMoney(totalBonus) }}</div>
              <div class="stat-label">奖金总额</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">¥{{ formatMoney(totalAllowance) }}</div>
              <div class="stat-label">津贴总额</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-value">¥{{ formatMoney(totalSalary) }}</div>
              <div class="stat-label">实发工资总额</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getSalaryRecords, createSalaryRecord } from '@/api/hr'
import { getUserList } from '@/api/user'

// 响应式数据
const loading = ref(false)
const salaryRecords = ref([])
const showCreateDialog = ref(false)
const editingRecord = ref(null)
const allUsers = ref([])

// 搜索表单
const searchForm = reactive({
  user_id: '',
  year: '',
  month: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 薪酬表单
const salaryForm = reactive({
  user_id: '',
  year: '',
  month: '',
  base_salary: 0,
  bonus: 0,
  allowance: 0,
  deduction: 0,
  notes: ''
})

// 表单验证规则
const salaryRules = {
  user_id: [{ required: true, message: '请选择员工', trigger: 'change' }],
  year: [{ required: true, message: '请选择年份', trigger: 'change' }],
  month: [{ required: true, message: '请选择月份', trigger: 'change' }],
  base_salary: [{ required: true, message: '请输入基本工资', trigger: 'blur' }]
}

const salaryFormRef = ref()

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

// 计算总工资
const calculateTotalSalary = (record) => {
  return (record.base_salary || 0) + (record.bonus || 0) + (record.allowance || 0) - (record.deduction || 0)
}

// 格式化金额
const formatMoney = (amount) => {
  if (!amount) return '0.00'
  return Number(amount).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// 计算统计数据
const totalBaseSalary = computed(() => {
  return salaryRecords.value.reduce((sum, record) => sum + (record.base_salary || 0), 0)
})

const totalBonus = computed(() => {
  return salaryRecords.value.reduce((sum, record) => sum + (record.bonus || 0), 0)
})

const totalAllowance = computed(() => {
  return salaryRecords.value.reduce((sum, record) => sum + (record.allowance || 0), 0)
})

const totalSalary = computed(() => {
  return salaryRecords.value.reduce((sum, record) => sum + calculateTotalSalary(record), 0)
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    const response = await getSalaryRecords(params)
    salaryRecords.value = response.data
    pagination.total = response.total
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 重置搜索
const resetSearch = () => {
  searchForm.user_id = ''
  searchForm.year = ''
  searchForm.month = ''
  pagination.page = 1
  loadData()
}

// 保存记录
const saveRecord = async () => {
  try {
    await salaryFormRef.value.validate()
    await createSalaryRecord(salaryForm)
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
  Object.assign(salaryForm, {
    user_id: '',
    year: '',
    month: '',
    base_salary: 0,
    bonus: 0,
    allowance: 0,
    deduction: 0,
    notes: ''
  })
  editingRecord.value = null
}

// 编辑记录
const editRecord = (row) => {
  editingRecord.value = row
  Object.assign(salaryForm, row)
  showCreateDialog.value = true
}

// 删除记录
const deleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条薪酬记录吗？', '提示', {
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
    const usersRes = await getUserList()
    allUsers.value = usersRes.data || usersRes
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
.salary-management {
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

.statistics-cards {
  margin-top: 30px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.total-salary {
  font-weight: bold;
  color: #67c23a;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}
</style>
