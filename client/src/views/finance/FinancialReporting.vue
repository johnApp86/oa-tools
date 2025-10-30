<template>
  <div class="financial-reporting-management">
    <div class="search-form">
      <el-form :model="searchForm" inline>
        <el-form-item label="报表类型">
          <el-select v-model="searchForm.reportType" placeholder="请选择报表类型" clearable
            style="width: 200px"
            :popper-append-to-body="false">
            <el-option label="资产负债表" value="balance_sheet" />
            <el-option label="利润表" value="income_statement" />
            <el-option label="现金流量表" value="cash_flow" />
            <el-option label="所有者权益变动表" value="equity_change" />
          </el-select>
        </el-form-item>
        <el-form-item label="报表期间">
          <el-date-picker
            v-model="searchForm.period"
            type="month"
            placeholder="请选择期间"
            format="YYYY-MM"
            value-format="YYYY-MM"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="button-group">
      <el-button type="primary" @click="handleGenerate">
        <el-icon><DocumentAdd /></el-icon>
        生成报表
      </el-button>
      <el-button type="success" @click="handleExport">
        <el-icon><Download /></el-icon>
        导出报表
      </el-button>
    </div>

    <div class="table-container">
      <el-table :data="tableData" v-loading="loading" stripe border
        style="width: 100%"
        table-layout="fixed">
        <el-table-column prop="report_code" label="报表编号" width="150" show-overflow-tooltip/>
        <el-table-column prop="report_name" label="报表名称" width="200" show-overflow-tooltip/>
        <el-table-column prop="report_type" label="报表类型" width="150" show-overflow-tooltip/>
        <el-table-column prop="period" label="报表期间" width="120" show-overflow-tooltip/>
        <el-table-column prop="status" label="状态" width="100" show-overflow-tooltip>
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="生成时间" width="180" show-overflow-tooltip/>
        <el-table-column label="操作" width="280" show-overflow-tooltipfixed="right">
          <template #default="{ row }">
            <div class="operation-buttons">
              <el-button size="small" @click="handleView(row)">查看</el-button>
              <el-button size="small" type="primary" @click="handleDownload(row)">
                下载
              </el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { DocumentAdd, Download } from "@element-plus/icons-vue";

const loading = ref(false);
const tableData = ref([]);

const searchForm = reactive({
  reportType: "",
  period: "",
});

const loadData = async () => {
  loading.value = true;
  try {
    const mockData = [
      {
        id: 1,
        report_code: "RPT-2025-001",
        report_name: "2025年10月资产负债表",
        report_type: "balance_sheet",
        period: "2025-10",
        status: "completed",
        created_at: "2025-10-30 17:00:00",
      },
      {
        id: 2,
        report_code: "RPT-2025-002",
        report_name: "2025年10月利润表",
        report_type: "income_statement",
        period: "2025-10",
        status: "completed",
        created_at: "2025-10-30 17:00:00",
      }
    ];
    tableData.value = mockData;
  } catch (error) {
    console.error("加载数据失败:", error);
    ElMessage.error("加载数据失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => loadData();
const handleReset = () => {
  searchForm.reportType = "";
  searchForm.period = "";
  loadData();
};
const handleGenerate = () => ElMessage.info("生成报表功能开发中...");
const handleExport = () => ElMessage.info("导出报表功能开发中...");
const handleView = () => ElMessage.info("查看报表功能开发中...");
const handleDownload = () => ElMessage.info("下载报表功能开发中...");

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除报表"${row.report_name}"吗？`, "确认删除");
    ElMessage.success("删除成功");
    loadData();
  } catch (error) {}
};

const getStatusTagType = (status) => {
  const statusMap = {
    generating: "warning",
    completed: "success",
    failed: "danger"
  };
  return statusMap[status] || "info";
};

const getStatusLabel = (status) => {
  const statusMap = {
    generating: "生成中",
    completed: "已完成",
    failed: "生成失败"
  };
  return statusMap[status] || status;
};

onMounted(() => loadData());
</script>

<style scoped>
.financial-reporting-management { padding: 0; }
.search-form {
  background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 24px; margin-bottom: 24px; border: 1px solid #f7fafc;
}
.button-group { margin-bottom: 24px; }
.table-container {
  background: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  padding: 24px; border: 1px solid #f7fafc; overflow: hidden;
}
:deep(.el-table) { border-radius: 8px; overflow: hidden; }
:deep(.el-table th) { background-color: #f8fafc; color: #4a5568; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
:deep(.el-table td) { border-bottom: 1px solid #f7fafc; }
:deep(.el-table tr:hover > td) { background-color: #f7fafc; }
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
</style>
