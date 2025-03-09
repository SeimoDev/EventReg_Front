<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '../../stores/user'
import request from '../../api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location, Edit, Delete } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'

interface UserInfo {
  id: number
  username: string
  email: string
  role: string
}

interface Registration {
  id: number
  competition_id: number
  competition_title: string
  team_name: string
  status: string
  created_at: string
}

const userStore = useUserStore()
const activeTab = ref('info')
const userInfo = ref<UserInfo | null>(null)
const registrations = ref<Registration[]>([])
const loading = ref(true)
const loadingRegistrations = ref(false)
const formRef = ref<FormInstance>()
const isEditing = ref(false)
const formData = ref({
  email: '',
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const router = useRouter()

// 表单验证规则
const rules = ref<FormRules>({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  oldPassword: [
    { 
      validator: (rule: any, value: string, callback: Function) => {
        // 如果新密码已填写，则旧密码必填
        if (formData.value.newPassword && !value) {
          callback(new Error('请输入原密码'))
        } else {
          callback()
        }
      },
      trigger: 'blur' 
    }
  ],
  newPassword: [
    { 
      validator: (rule: any, value: string, callback: Function) => {
        // 如果旧密码已填写，则新密码必填
        if (formData.value.oldPassword && !value) {
          callback(new Error('请输入新密码'))
        } else if (value && (value.length < 6 || value.length > 20)) {
          callback(new Error('密码长度在 6 到 20 个字符'))
        } else {
          callback()
        }
      },
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    {
      validator: (rule: any, value: string, callback: Function) => {
        // 如果新密码已填写，则确认密码必须匹配
        if (formData.value.newPassword && !value) {
          callback(new Error('请确认新密码'))
        } else if (formData.value.newPassword && value !== formData.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 加载用户信息
const loadUserInfo = async () => {
  try {
    loading.value = true
    const response = await request.get('/user/profile')
    console.log('用户信息响应:', response) // 添加日志
    userInfo.value = response.data || response // 兼容不同的响应格式
    
    // 初始化表单数据
    if (userInfo.value) {
      formData.value.email = userInfo.value.email
    }
  } catch (error) {
    console.error('加载用户信息失败:', error)
    ElMessage.error('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

// 加载用户报名记录
const loadRegistrations = async () => {
  try {
    loadingRegistrations.value = true
    const response = await request.get('/user/registrations')
    console.log('报名记录响应:', response) // 添加日志
    registrations.value = response.data || response // 兼容不同的响应格式
  } catch (error) {
    console.error('加载报名记录失败:', error)
    ElMessage.error('加载报名记录失败')
  } finally {
    loadingRegistrations.value = false
  }
}

// 切换编辑模式
const toggleEdit = () => {
  isEditing.value = !isEditing.value
  
  if (!isEditing.value) {
    // 重置表单
    formData.value.email = userInfo.value?.email || ''
    formData.value.oldPassword = ''
    formData.value.newPassword = ''
    formData.value.confirmPassword = ''
  }
}

// 提交表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        // 准备要更新的数据
        const updateData: Record<string, string> = {
          email: formData.value.email
        }
        
        // 如果输入了旧密码和新密码，则更新密码
        if (formData.value.oldPassword && formData.value.newPassword) {
          updateData.old_password = formData.value.oldPassword
          updateData.new_password = formData.value.newPassword
          console.log('更新密码信息')
        } else {
          console.log('不更新密码，只更新邮箱')
        }
        
        await request.put('/user/profile', updateData)
        ElMessage.success('个人信息更新成功')
        isEditing.value = false
        loadUserInfo()
      } catch (error: any) {
        // 捕获并显示特定的错误信息
        if (error.detail) {
          if (typeof error.detail === 'string') {
            ElMessage.error(error.detail)
          } else if (error.detail.old_password) {
            ElMessage.error('原密码错误')
          } else {
            ElMessage.error('更新个人信息失败')
          }
        } else {
          console.error('更新个人信息失败:', error)
          ElMessage.error('更新个人信息失败')
        }
      }
    }
  })
}

// 取消报名
const cancelRegistration = async (registrationId: number) => {
  try {
    await ElMessageBox.confirm('确定要取消该报名吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/competitions/registrations/${registrationId}`)
    ElMessage.success('取消报名成功')
    loadRegistrations()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消报名失败:', error)
      ElMessage.error('取消报名失败')
    }
  }
}

// 获取报名状态文本
const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': return '审核中'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    default: return status
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending': return 'warning'
    case 'approved': return 'success'
    case 'rejected': return 'danger'
    default: return 'info'
  }
}

// 是否可以取消报名
const canCancel = (registration: Registration) => {
  return registration.status === 'pending'
}

// 编辑报名信息
const handleEdit = (registration: any) => {
  router.push({
    path: `/competition/${registration.competition_id}/register`,
    query: {
      mode: 'edit',
      registrationId: registration.id
    }
  })
}

// 查看报名详情
const handleView = (registration: any) => {
  console.log('查看报名详情:', registration) // 添加日志
  try {
    router.push({
      path: `/competition/${registration.competition_id}`,
      query: {
        // 当作为查看模式时，只进入活动详情页
      }
    })
  } catch (error) {
    console.error('导航错误:', error)
    ElMessage.error('无法打开报名详情')
  }
}

// 调试辅助函数
const logRegistration = (registration: any) => {
  console.log('Registration Object:', registration)
  console.log('competition_id:', registration.competition_id)
  console.log('id:', registration.id)
  return registration
}

onMounted(() => {
  if (!userStore.token) {
    ElMessage.warning('请先登录')
    return
  }
  
  loadUserInfo()
  loadRegistrations()
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">个人中心</h1>
    
    <div v-if="loading" class="flex justify-center py-12">
      <el-spinner size="large" />
    </div>
    
    <template v-else>
      <el-tabs v-model="activeTab" class="mb-6">
        <el-tab-pane label="个人信息" name="info" />
        <el-tab-pane label="我的报名" name="registrations" />
      </el-tabs>
      
      <!-- 个人信息 -->
      <div v-if="activeTab === 'info'" class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">个人信息</h2>
          <el-button type="primary" @click="toggleEdit">
            {{ isEditing ? '取消' : '编辑' }}
          </el-button>
        </div>
        
        <div v-if="!isEditing">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">用户名</label>
              <p class="text-lg">{{ userInfo?.username }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">邮箱</label>
              <p class="text-lg">{{ userInfo?.email }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">角色</label>
              <p class="text-lg">{{ userInfo?.role === 'admin' ? '管理员' : '普通用户' }}</p>
            </div>
          </div>
        </div>
        
        <el-form
          v-else
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
        >
          <el-form-item label="用户名">
            <el-input :value="userInfo?.username || ''" disabled />
            <div class="text-xs text-gray-500 mt-1">用户名不可修改</div>
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" placeholder="请输入邮箱" />
          </el-form-item>
          
          <div class="border-t border-gray-200 dark:border-gray-700 my-6 pt-6">
            <h3 class="text-lg font-medium mb-4">修改密码（选填）</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              如果不需要修改密码，请保持以下字段为空。
            </p>
            
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="formData.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="formData.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="请确认新密码"
                show-password
              />
            </el-form-item>
          </div>
          
          <div class="flex justify-end">
            <el-button @click="toggleEdit">取消</el-button>
            <el-button type="primary" @click="submitForm(formRef)">保存</el-button>
          </div>
        </el-form>
      </div>
      
      <!-- 我的报名 -->
      <div v-else-if="activeTab === 'registrations'" class="card">
        <h2 class="text-xl font-semibold mb-6">我的报名</h2>
        
        <div v-loading="loadingRegistrations">
          <template v-if="registrations.length > 0">
            <el-table :data="registrations" border>
              <el-table-column label="活动名称" prop="competition_title" min-width="200" />
              <el-table-column label="团队名称" prop="team_name" min-width="150" />
              <el-table-column label="报名时间" min-width="180">
                <template #default="{ row }">
                  {{ new Date(row.created_at).toLocaleString() }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">
                    {{ getStatusText(row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <div class="flex space-x-2">
                    <el-button
                      type="info"
                      size="small"
                      @click="handleView(logRegistration(row))"
                    >
                      查看
                    </el-button>
                    <el-button
                      v-if="canCancel(row)"
                      type="danger"
                      size="small"
                      @click="cancelRegistration(row.id)"
                    >
                      取消
                    </el-button>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </template>
          
          <el-empty v-else description="暂无报名记录" />
        </div>
      </div>
    </template>
  </div>
</template> 