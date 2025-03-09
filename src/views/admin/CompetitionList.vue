<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold mb-2">活动管理</h1>
        <p class="text-gray-500 dark:text-gray-400">
          管理所有活动信息
        </p>
      </div>
      <el-button
        type="primary"
        @click="router.push('/admin/competitions/create')"
      >
        创建活动
      </el-button>
    </div>

    <div class="card">
      <el-table
        v-loading="loading"
        :data="competitions"
        border
        style="width: 100%"
      >
        <el-table-column prop="title" label="活动名称" min-width="200" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="start_time" label="开始时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.start_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="end_time" label="结束时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.end_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <div class="actions flex space-x-2">
              <el-button
                type="primary"
                size="small"
                @click="router.push(`/admin/competitions/${scope.row.id}/edit`)"
              >
                编辑
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="router.push(`/admin/competitions/${scope.row.id}/registrations`)"
              >
                报名管理
              </el-button>
              <el-button
                type="warning"
                size="small"
                @click="exportCompetitionData(scope.row)"
              >
                导出数据
              </el-button>
            </div>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 导出对话框 -->
    <ExportDialog
      v-if="currentExportCompetition"
      :competition-id="currentExportCompetition.id"
      :competition-name="currentExportCompetition.title"
      v-model:visible="exportDialogVisible"
      @export-complete="handleExportComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../../api/request'
import ExportDialog from '../../components/admin/ExportDialog.vue'

const router = useRouter()
const loading = ref(false)
const competitions = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 处理导出数据
const exportDialogVisible = ref(false)
const currentExportCompetition = ref<any>(null)

const exportCompetitionData = (competition: any) => {
  currentExportCompetition.value = competition
  exportDialogVisible.value = true
}

const handleExportComplete = (result: any) => {
  console.log('导出完成:', result)
  // 可以在这里添加额外的逻辑，比如记录导出历史等
}

// 加载活动列表
const loadCompetitions = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    const response = await request.get('/competitions', { params })
    competitions.value = response.competitions
    total.value = response.total
  } catch (error) {
    console.error('加载活动列表失败:', error)
    ElMessage.error('加载活动列表失败')
  } finally {
    loading.value = false
  }
}

// 删除活动
const handleDelete = async (competition: any) => {
  try {
    await ElMessageBox.confirm(
      '确认删除该活动？删除后将无法恢复。',
      '警告',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await request.delete(`/competitions/${competition.id}`)
    ElMessage.success('删除成功')
    loadCompetitions()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    draft: 'info',
    published: 'success',
    closed: 'warning',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    closed: '已结束',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadCompetitions()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadCompetitions()
}

onMounted(() => {
  loadCompetitions()
})
</script> 