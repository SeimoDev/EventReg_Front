<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold mb-2">报名管理</h1>
      <p class="text-gray-500 dark:text-gray-400">
        查看和管理活动报名信息
      </p>
    </div>

    <div class="card mb-6">
      <!-- 搜索和筛选 -->
      <div class="flex flex-wrap gap-4 mb-6">
        <el-input
          v-model="searchQuery"
          placeholder="搜索团队名称/用户名/邮箱"
          class="w-64"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="statusFilter"
          placeholder="报名状态"
          class="w-32"
          clearable
          @change="loadRegistrations"
        >
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
      </div>

      <!-- 报名列表 -->
      <el-table
        v-loading="loading"
        :data="registrations"
        border
        style="width: 100%"
      >
        <el-table-column prop="team_name" label="团队名称" min-width="120" />
        <el-table-column prop="username" label="报名用户" min-width="120" />
        <el-table-column prop="contact_phone" label="联系电话" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="created_at" label="报名时间" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              type="success"
              size="small"
              @click="handleApprove(row)"
            >
              通过
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleReject(row)"
            >
              拒绝
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="handleViewDetails(row)"
            >
              查看详情
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

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailsVisible"
      title="报名详情"
      width="70%"
      destroy-on-close
      class="registration-details-dialog"
    >
      <div v-loading="detailsLoading">
        <template v-if="currentRegistration">
          <!-- 基本信息 -->
          <div class="mb-6">
            <h3 class="text-lg font-medium mb-4">基本信息</h3>
            <el-tabs>
              <el-tab-pane label="报名信息">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="团队名称">
                    {{ currentRegistration.team_name }}
                  </el-descriptions-item>
                  <el-descriptions-item label="报名用户">
                    {{ currentRegistration.username }}
                  </el-descriptions-item>
                  <el-descriptions-item label="联系电话">
                    {{ currentRegistration.contact_phone }}
                  </el-descriptions-item>
                  <el-descriptions-item label="邮箱">
                    {{ currentRegistration.email }}
                  </el-descriptions-item>
                  <el-descriptions-item label="报名时间">
                    {{ formatDate(currentRegistration.created_at) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="状态">
                    <el-tag :type="getStatusType(currentRegistration.status)">
                      {{ getStatusText(currentRegistration.status) }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item v-if="currentRegistration.additional_info" label="附加说明" :span="2">
                    {{ currentRegistration.additional_info }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
              <el-tab-pane label="用户信息" v-if="enhancedData?.basic_info?.user">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="用户ID">
                    {{ enhancedData.basic_info.user.id }}
                  </el-descriptions-item>
                  <el-descriptions-item label="用户名">
                    {{ enhancedData.basic_info.user.username }}
                  </el-descriptions-item>
                  <el-descriptions-item label="邮箱">
                    {{ enhancedData.basic_info.user.email }}
                  </el-descriptions-item>
                  <el-descriptions-item label="电话">
                    {{ enhancedData.basic_info.user.phone }}
                  </el-descriptions-item>
                  <el-descriptions-item label="注册时间">
                    {{ formatDate(enhancedData.basic_info.user.created_at) }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
              <el-tab-pane label="活动信息" v-if="enhancedData?.basic_info?.competition">
                <el-descriptions :column="1" border>
                  <el-descriptions-item label="活动ID">
                    {{ enhancedData.basic_info.competition.id }}
                  </el-descriptions-item>
                  <el-descriptions-item label="活动标题">
                    {{ enhancedData.basic_info.competition.title }}
                  </el-descriptions-item>
                  <el-descriptions-item label="活动描述">
                    {{ enhancedData.basic_info.competition.description }}
                  </el-descriptions-item>
                  <el-descriptions-item label="开始时间">
                    {{ formatDate(enhancedData.basic_info.competition.start_time) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="结束时间">
                    {{ formatDate(enhancedData.basic_info.competition.end_time) }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-tab-pane>
            </el-tabs>
          </div>

          <!-- 表单数据 -->
          <div v-if="enhancedData?.form_data?.length > 0">
            <h3 class="text-lg font-medium mb-4">表单数据</h3>
            <div class="space-y-6">
              <div
                v-for="field in enhancedData.form_data"
                :key="field.field_id"
                class="border p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div class="flex justify-between items-center mb-3">
                  <div class="font-medium text-base">{{ field.field_label }}</div>
                  <el-tag size="small" effect="plain">{{ getFieldTypeLabel(field.field_type) }}</el-tag>
                </div>
                
                <!-- 文本字段 -->
                <div v-if="field.field_type === 'text'" class="text-gray-700 dark:text-gray-300">
                  {{ field.content }}
                </div>
                
                <!-- 日期字段 -->
                <div v-else-if="field.field_type === 'date'" class="text-gray-700 dark:text-gray-300">
                  {{ formatDate(field.content) }}
                </div>
                
                <!-- 图片字段 -->
                <div v-else-if="field.field_type === 'image'">
                  <div class="mb-2 text-sm text-gray-500">
                    <span v-if="field.original_filename">原始文件名: {{ field.original_filename }}</span>
                    <span v-else>图片文件</span>
                    <span v-if="field.file_size" class="ml-4">文件大小: {{ formatFileSize(field.file_size) }}</span>
                  </div>
                  <div v-if="field.content && field.content.startsWith('data:image/')">
                    <!-- 显示base64图片 -->
                    <img 
                      :src="field.content" 
                      class="max-w-full h-auto border rounded cursor-pointer max-h-48" 
                      @click="openImagePreview(field.content, field.original_filename || '图片')"
                    />
                  </div>
                  <div v-else-if="field.content && field.url" class="mt-2">
                    <!-- 显示远程图片预览按钮 -->
                    <el-button type="primary" size="small" @click="openImagePreview(getFullUrl(field.url), field.original_filename || '图片')">
                      预览图片
                    </el-button>
                  </div>
                  <div v-else-if="field.content" class="mt-2">
                    <!-- 显示图片内容作为文本 -->
                    <el-button type="primary" size="small" @click="openImagePreview(getFullUrl(field.content), field.original_filename || '图片')">
                      预览图片
                    </el-button>
                  </div>
                </div>
                
                <!-- 文件字段 -->
                <div v-else-if="field.field_type === 'file'">
                  <div class="flex items-center p-3 bg-white dark:bg-gray-700 rounded border">
                    <div class="mr-4">
                      <el-icon class="text-2xl"><Document /></el-icon>
                    </div>
                    <div class="flex-1">
                      <div class="font-medium">{{ field.original_filename || getFileNameFromPath(field.content) }}</div>
                      <div class="text-sm text-gray-500">
                        <span>{{ field.file_type || getFileTypeFromPath(field.content) }}</span>
                        <span v-if="field.file_size" class="ml-3">{{ formatFileSize(field.file_size) }}</span>
                      </div>
                    </div>
                    <div v-if="field.url || field.content">
                      <el-button type="primary" size="small" @click="downloadFile(getFullUrl(field.url || field.content), field.original_filename || getFileNameFromPath(field.content))">
                        下载
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <!-- 单选字段 -->
                <div v-else-if="field.field_type === 'radio' && !field.allow_multiple">
                  <div class="flex items-center">
                    <el-tag type="success">{{ field.selected_label || field.content }}</el-tag>
                    <div v-if="field.selected_label && field.selected_label !== field.content" 
                         class="ml-3 text-gray-500 text-sm">
                      (值: {{ field.content }})
                    </div>
                  </div>
                </div>
                  
                <!-- 多选字段 -->
                <div v-else-if="field.field_type === 'radio' && field.allow_multiple" class="flex flex-wrap gap-2">
                  <!-- 使用API返回的selected_labels -->
                  <template v-if="field.selected_labels && field.selected_labels.length">
                    <el-tag v-for="(label, index) in field.selected_labels" :key="index" type="success" class="mr-2 mb-2">
                      {{ label }}
                    </el-tag>
                  </template>
                  <!-- 使用已解析的内容 -->
                  <template v-else-if="field.parsed_content">
                    <template v-for="(value, index) in field.parsed_content" :key="index">
                      <!-- 尝试查找对应的标签 -->
                      <el-tag v-if="getOptionLabel(field.options, value)" type="success" class="mr-2 mb-2">
                        {{ getOptionLabel(field.options, value) }}
                      </el-tag>
                      <el-tag v-else type="info" class="mr-2 mb-2">
                        {{ value }}
                      </el-tag>
                    </template>
                  </template>
                  <!-- 尝试解析JSON字符串 -->
                  <template v-else-if="typeof field.content === 'string' && field.content.startsWith('[')">
                    <template v-for="(value, index) in parseJsonArray(field.content)" :key="index">
                      <!-- 尝试查找对应的标签 -->
                      <el-tag v-if="getOptionLabel(field.options, value)" type="success" class="mr-2 mb-2">
                        {{ getOptionLabel(field.options, value) }}
                      </el-tag>
                      <el-tag v-else type="info" class="mr-2 mb-2">
                        {{ value }}
                      </el-tag>
                    </template>
                  </template>
                  <!-- 处理已经是数组的情况 -->
                  <template v-else-if="Array.isArray(field.content)">
                    <el-tag v-for="(value, index) in field.content" :key="index" type="info" class="mr-2 mb-2">
                      {{ getOptionLabel(field.options, value) || value }}
                    </el-tag>
                  </template>
                  <!-- 处理其他情况 -->
                  <template v-else>
                    <el-tag type="info">
                      {{ field.content }}
                    </el-tag>
                  </template>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无表单数据" />

          <!-- 操作按钮 -->
          <div class="mt-8 text-right">
            <el-button @click="detailsVisible = false">关闭</el-button>
            <template v-if="currentRegistration.status === 'pending'">
              <el-button type="success" @click="handleApprove(currentRegistration)">通过申请</el-button>
              <el-button type="danger" @click="handleReject(currentRegistration)">拒绝申请</el-button>
            </template>
          </div>
        </template>
      </div>
    </el-dialog>

    <!-- 图片预览对话框 -->
    <el-dialog
      v-model="imagePreviewVisible"
      :title="currentPreviewTitle"
      width="80%"
      destroy-on-close
      center
    >
      <div class="flex justify-center">
        <img :src="currentPreviewImage" class="max-w-full max-h-[70vh]" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Picture, Document } from '@element-plus/icons-vue'
import request from '../../api/request'

const route = useRoute()
const competitionId = route.params.id

// 列表数据
const loading = ref(false)
const registrations = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchQuery = ref('')
const statusFilter = ref('')

// 详情数据
const detailsVisible = ref(false)
const detailsLoading = ref(false)
const currentRegistration = ref(null)
const formData = ref([])
const enhancedData = ref<any>(null)

// 图片预览
const imagePreviewVisible = ref(false)
const currentPreviewImage = ref('')
const currentPreviewTitle = ref('')

// 加载报名列表
const loadRegistrations = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      per_page: pageSize.value,
      status: statusFilter.value || undefined,
      search: searchQuery.value || undefined
    }
    
    const response = await request.get(
      `/competitions/${competitionId}/participants`,
      { params }
    )
    
    // 根据截图，参与者列表API直接返回数据，不嵌套在data属性中
    if (response) {
      registrations.value = response.participants || []
      total.value = response.total || 0
      
      console.log('获取到报名列表:', registrations.value.length, '条记录')
      
      // 如果API改变了结构，也能处理
      if (!response.participants && response.data) {
        registrations.value = response.data.participants || []
        total.value = response.data.total || 0
      }
    } else {
      registrations.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('加载报名列表失败:', error)
    ElMessage.error('加载报名列表失败')
  } finally {
    loading.value = false
  }
}

// 加载报名详情
const loadRegistrationDetails = async (registrationId: number) => {
  try {
    detailsLoading.value = true
    enhancedData.value = null
    
    // 获取报名详情 - 可能直接返回数据
    const registrationData = await request.get(
      `/competitions/registrations/${registrationId}`
    )
    
    // 检查响应数据结构
    currentRegistration.value = registrationData.data || registrationData
    
    console.log('获取到报名详情:', currentRegistration.value)
    
    // 获取表单数据 - 可能直接返回数据
    const formResponse = await request.get(
      `/forms/registrations/${registrationId}/data`
    )
    
    // 检查响应数据结构
    formData.value = formResponse.data || formResponse || []
    
    // 使用增强的API获取更详细的信息 - 这个API返回嵌套在data中的数据
    try {
      const userId = currentRegistration.value?.user_id
      if (userId) {
        const enhancedResponse = await request.get(
          `/forms/admin/competitions/${competitionId}/users/${userId}/data`
        )
        
        console.log('增强数据响应:', enhancedResponse)
        
        // 处理API响应 - 这个API的返回结构是 { data: { data: {...}, success: true, ... } }
        if (enhancedResponse?.data) {
          // API可能返回两种结构
          if (enhancedResponse.data.data) {
            // 如果是嵌套的data.data结构
            enhancedData.value = enhancedResponse.data.data
          } else {
            // 如果data下直接是数据
            enhancedData.value = enhancedResponse.data
          }
          
          console.log('获取到增强的报名数据:', enhancedData.value)
          
          // 检查是否获取到了正确的数据
          if (!enhancedData.value || !enhancedData.value.form_data) {
            console.warn('增强数据格式不符合预期:', enhancedData.value)
            return
          }
          
          // 处理多选字段的JSON字符串
          if (enhancedData.value?.form_data) {
            enhancedData.value.form_data.forEach((field: any) => {
              // 尝试解析多选字段的内容
              if (field.field_type === 'radio' && field.allow_multiple && typeof field.content === 'string' && field.content.startsWith('[')) {
                try {
                  const parsedContent = JSON.parse(field.content)
                  if (Array.isArray(parsedContent)) {
                    field.parsed_content = parsedContent
                  }
                } catch (e) {
                  console.error(`解析字段 ${field.field_id} 的内容失败:`, e)
                }
              }
            })
          }
        }
      }
    } catch (enhancedError) {
      console.warn('获取增强的报名数据失败，使用基本数据:', enhancedError)
    }
  } catch (error) {
    console.error('加载报名详情失败:', error)
    ElMessage.error('加载报名详情失败')
  } finally {
    detailsLoading.value = false
  }
}

// 处理审核
const handleApprove = async (registration: any) => {
  try {
    await ElMessageBox.confirm('确认通过该报名申请？')
    await request.put(`/competitions/registrations/${registration.id}/status`, {
      status: 'approved'
    })
    ElMessage.success('已通过报名申请')
    loadRegistrations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
      ElMessage.error('审核失败')
    }
  }
}

const handleReject = async (registration: any) => {
  try {
    await ElMessageBox.confirm('确认拒绝该报名申请？', '提示', {
      type: 'warning'
    })
    await request.put(`/competitions/registrations/${registration.id}/status`, {
      status: 'rejected'
    })
    ElMessage.success('已拒绝报名申请')
    loadRegistrations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审核失败:', error)
      ElMessage.error('审核失败')
    }
  }
}

// 查看详情
const handleViewDetails = (registration: any) => {
  detailsVisible.value = true
  loadRegistrationDetails(registration.id)
}

// 下载文件
const downloadFile = (url: string, filename: string) => {
  // 确保URL是完整的URL
  const fullUrl = getFullUrl(url)
  window.open(fullUrl, '_blank')
}

// 图片预览
const openImagePreview = (url: string, title?: string) => {
  currentPreviewImage.value = url
  currentPreviewTitle.value = title || '图片预览'
  imagePreviewVisible.value = true
}

// 工具函数
const formatDate = (date: string) => {
  if (!date) return '-'
  try {
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return date // 如果日期无效，直接返回原始字符串
    
    return dateObj.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(/\//g, '-')
  } catch (e) {
    return date // 发生错误时返回原始字符串
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝'
  }
  return texts[status] || status
}

const getFieldTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    'text': '文本',
    'image': '图片',
    'file': '文件',
    'radio': '单选',
    'date': '日期',
    'textarea': '多行文本'
  }
  return typeLabels[type] || type
}

const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  
  return `${bytes.toFixed(2)} ${units[i]}`
}

// 分页和搜索
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadRegistrations()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadRegistrations()
}

const handleSearch = () => {
  currentPage.value = 1
  loadRegistrations()
}

// 工具函数 - 解析JSON数组
const parseJsonArray = (jsonStr: string) => {
  try {
    return JSON.parse(jsonStr)
  } catch (e) {
    console.error('解析JSON数组失败:', e)
    return []
  }
}

// 获取选项标签
const getOptionLabel = (options: any[] | undefined, value: string) => {
  if (!options) return null
  const option = options.find(opt => opt.value === value)
  return option ? option.label : null
}

// 工具函数 - 获取文件名
const getFileNameFromPath = (path: string) => {
  if (!path) return '未知文件'
  return path.split('\\').pop()?.split('/').pop() || '文件'
}

// 工具函数 - 获取文件类型
const getFileTypeFromPath = (path: string) => {
  if (!path) return ''
  const ext = path.split('.').pop()?.toLowerCase()
  return ext ? `.${ext}` : ''
}

// 工具函数 - 获取完整URL
const getFullUrl = (path: string) => {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path
  }
  // 将相对路径转为完整URL - 使用API基础路径
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`
}

onMounted(() => {
  loadRegistrations()
})
</script> 