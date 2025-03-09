<template>
  <div class="user-management-container">
    <h1 class="page-title">用户管理</h1>
    
    <!-- 搜索和筛选区域 -->
    <div class="search-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索用户名"
        class="search-input"
        clearable
        @clear="handleSearch"
      >
        <template #append>
          <el-button @click="handleSearch">
            <el-icon><Search /></el-icon>
          </el-button>
        </template>
      </el-input>
      
      <el-select v-model="roleFilter" placeholder="角色筛选" @change="handleSearch">
        <el-option label="全部" value="" />
        <el-option label="管理员" value="admin" />
        <el-option label="普通用户" value="user" />
      </el-select>
      
      <el-button type="primary" @click="openBatchGenerateDialog">
        批量生成账号
      </el-button>
    </div>
    
    <!-- 用户列表 -->
    <el-card shadow="hover" class="user-list-card">
      <el-table
        v-loading="loading"
        :data="userList"
        stripe
        border
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="email" label="邮箱">
          <template #default="scope">
            {{ scope.row.email || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag :type="scope.row.role === 'admin' ? 'danger' : 'success'">
              {{ scope.row.role === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'warning'">
              {{ scope.row.status === 'active' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button
              size="small"
              type="warning"
              @click="resetPassword(scope.row)"
            >
              重置密码
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="totalUsers"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 批量生成账号对话框 -->
    <el-dialog
      v-model="batchGenerateDialogVisible"
      title="批量生成账号"
      width="500px"
    >
      <el-form :model="batchGenerateForm" label-width="100px">
        <el-form-item label="生成数量">
          <el-input-number 
            v-model="batchGenerateForm.count" 
            :min="1" 
            :max="1000" 
            controls-position="right" 
          />
        </el-form-item>
        <el-form-item label="用户名前缀">
          <el-input v-model="batchGenerateForm.prefix" placeholder="可选，例如：user_" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchGenerateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchGenerate" :loading="batchGenerating">
            生成
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 重置密码确认对话框 -->
    <el-dialog
      v-model="resetPasswordDialogVisible"
      title="重置密码确认"
      width="400px"
    >
      <p>确定要重置用户 "{{ selectedUser?.username }}" 的密码吗？</p>
      <p class="warning-text">新密码将只显示一次，请妥善保存！</p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="resetPasswordDialogVisible = false">取消</el-button>
          <el-button type="warning" @click="confirmResetPassword" :loading="resetting">
            确认重置
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 新密码显示对话框 -->
    <el-dialog
      v-model="newPasswordDialogVisible"
      title="新密码"
      width="400px"
    >
      <div class="new-password-info">
        <p>用户 "{{ selectedUser?.username }}" 的新密码：</p>
        <div class="password-display">
          <span>{{ newPassword }}</span>
          <el-button type="primary" size="small" @click="copyPassword">
            复制
          </el-button>
        </div>
        <p class="warning-text">请立即保存此密码，关闭后将无法再次查看！</p>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="newPasswordDialogVisible = false">
            关闭
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 批量生成结果对话框 -->
    <el-dialog
      v-model="batchResultDialogVisible"
      title="账号生成成功"
      width="700px"
    >
      <div class="batch-result-info">
        <p>成功生成 {{ batchGenerateResult.count }} 个账号！</p>
        
        <div class="account-table-container">
          <el-table :data="batchGenerateResult.users" height="300" border>
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="password" label="密码" />
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
        </div>
        
        <div class="download-actions">
          <el-button type="success" @click="downloadExcel" :loading="downloading">
            下载Excel文件
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '../../api/request'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// 定义接口类型
interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled'
  created_at?: string
}

interface UserListResponse {
  page: number
  per_page: number
  total: number
  users: User[]
}

interface BatchGenerateParams {
  count: number
  prefix?: string
}

interface BatchGenerateResult {
  count: number
  users: Array<{
    id: number
    username: string
    password: string
    created_at: string
  }>
}

// 用户列表数据
const userList = ref<User[]>([])
const loading = ref(false)
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const searchKeyword = ref('')
const roleFilter = ref('')

// 批量生成账号相关
const batchGenerateDialogVisible = ref(false)
const batchGenerateForm = reactive<BatchGenerateParams>({
  count: 10,
  prefix: ''
})
const batchGenerating = ref(false)
const batchResultDialogVisible = ref(false)
const batchGenerateResult = ref<BatchGenerateResult>({
  count: 0,
  users: [],
})
const downloading = ref(false)

// 重置密码相关
const resetPasswordDialogVisible = ref(false)
const newPasswordDialogVisible = ref(false)
const selectedUser = ref<User | null>(null)
const newPassword = ref('')
const resetting = ref(false)

// 初始化加载
onMounted(() => {
  fetchUserList()
})

// 获取用户列表
const fetchUserList = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: currentPage.value,
      per_page: pageSize.value
    }
    
    if (roleFilter.value) {
      params.role = roleFilter.value
    }
    
    if (searchKeyword.value) {
      params.search = searchKeyword.value
    }

    console.log('开始获取用户列表，请求参数:', params)
    
    const response = await request.get<UserListResponse>('/user/admin/users', { params }) 
    
    console.log('获取用户列表响应:', response)
    
    if (response && Array.isArray(response.users)) {
      console.log('解析到的用户数据:', {
        total: response.total,
        page: response.page,
        per_page: response.per_page,
        users_count: response.users.length
      })
      
      userList.value = response.users
      totalUsers.value = response.total
      console.log('用户列表更新成功')
    } else {
      console.error('响应格式错误:', response)
      ElMessage.error('获取用户列表失败：响应格式错误')
    }
  } catch (error) {
    console.error('获取用户列表失败，详细错误:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    ElMessage.error(`获取用户列表失败：${error instanceof Error ? error.message : '请检查网络连接'}`)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1
  fetchUserList()
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchUserList()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchUserList()
}

// 打开批量生成对话框
const openBatchGenerateDialog = () => {
  batchGenerateForm.count = 10
  batchGenerateForm.prefix = ''
  batchGenerateDialogVisible.value = true
}

// 批量生成账号
const handleBatchGenerate = async () => {
  if (batchGenerateForm.count < 1 || batchGenerateForm.count > 1000) {
    ElMessage.warning('生成数量必须在1-1000之间')
    return
  }
  
  batchGenerating.value = true
  try {
    const params: BatchGenerateParams = {
      count: batchGenerateForm.count
    }
    
    if (batchGenerateForm.prefix) {
      params.prefix = batchGenerateForm.prefix
    }
    
    console.log('开始批量生成账号，请求参数:', params)
    
    const response = await request.post<BatchGenerateResult>('/user/admin/users/batch-generate', null, {
      params
    })
    
    console.log('批量生成账号响应:', response)
    
    if (response) {
      batchGenerateResult.value = response
      batchGenerateDialogVisible.value = false
      batchResultDialogVisible.value = true
      console.log('成功生成账号:', {
        count: response.count,
        users_count: response.users?.length,
      })
      fetchUserList() // 刷新用户列表
    } else {
      console.error('响应格式错误:', response)
      ElMessage.error('批量生成账号失败：响应格式错误')
    }
  } catch (error) {
    console.error('批量生成账号失败，详细错误:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    ElMessage.error(`批量生成账号失败：${error instanceof Error ? error.message : '请检查网络连接'}`)
  } finally {
    batchGenerating.value = false
  }
}

// 下载Excel文件
const downloadExcel = () => {
  try {
    const users = batchGenerateResult.value.users
    if (!users || users.length === 0) {
      ElMessage.error('没有可导出的数据')
      return
    }

    // 准备Excel数据
    const excelData = users.map(user => ({
      'ID': user.id,
      '用户名': user.username,
      '密码': user.password,
      '创建时间': user.created_at
    }))

    // 创建工作簿和工作表
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)

    // 设置列宽
    const columnWidths = [
      { wch: 8 },  // ID
      { wch: 20 }, // 用户名
      { wch: 20 }, // 密码
      { wch: 20 }  // 创建时间
    ]
    ws['!cols'] = columnWidths

    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '账号信息')

    // 生成Excel文件
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    // 生成文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `generated_accounts_${timestamp}.xlsx`

    // 下载文件
    saveAs(blob, fileName)
    ElMessage.success('文件下载成功')
  } catch (error) {
    console.error('生成Excel文件失败:', error)
    ElMessage.error('生成Excel文件失败，请重试')
  }
}

// 打开重置密码对话框
const resetPassword = (user: User) => {
  selectedUser.value = user
  resetPasswordDialogVisible.value = true
}

// 确认重置密码
const confirmResetPassword = async () => {
  if (!selectedUser.value) {
    console.warn('没有选中的用户')
    return
  }
  
  resetting.value = true
  try {
    console.log('开始重置密码，用户ID:', selectedUser.value.id)
    
    const response = await request.post<{ user_id: number; new_password: string }>(
      `/user/admin/users/${selectedUser.value.id}/reset-password`
    )
    
    console.log('重置密码响应:', response)
    
    if (response?.new_password) {
      newPassword.value = response.new_password
      resetPasswordDialogVisible.value = false
      newPasswordDialogVisible.value = true
      console.log('密码重置成功，用户ID:', response.user_id)
    } else {
      console.error('响应中没有new_password字段:', response)
      ElMessage.error('重置密码失败：响应格式错误')
    }
  } catch (error) {
    console.error('重置密码失败，详细错误:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    ElMessage.error(`重置密码失败：${error instanceof Error ? error.message : '请检查网络连接'}`)
  } finally {
    resetting.value = false
  }
}

// 复制密码到剪贴板
const copyPassword = () => {
  navigator.clipboard.writeText(newPassword.value)
    .then(() => {
      ElMessage.success('密码已复制到剪贴板')
    })
    .catch(() => {
      ElMessage.error('复制失败，请手动复制')
    })
}
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.page-title {
  margin-bottom: 20px;
  color: var(--text-color);
}

.search-bar {
  display: flex;
  margin-bottom: 20px;
  gap: 15px;
}

.search-input {
  width: 300px;
}

.user-list-card {
  margin-bottom: 20px;
  background-color: var(--primary-bg);
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.warning-text {
  color: #E6A23C;
  font-weight: bold;
}

.new-password-info {
  text-align: center;
}

.password-display {
  margin: 15px 0;
  padding: 10px;
  background-color: var(--secondary-bg);
  border-radius: 4px;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.account-table-container {
  margin: 15px 0;
}

.download-actions {
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

/* 暗黑模式适配 */
@media (prefers-color-scheme: dark) {
  .password-display {
    background-color: #2c2c2e;
    color: #e0e0e0;
  }
  
  .warning-text {
    color: #e6c07b;
  }
}
</style> 