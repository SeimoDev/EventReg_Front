<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../api/request'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const rememberMe = ref(false)

const form = ref({
  username: localStorage.getItem('username') || '',
  password: ''
})

// 如果之前保存了用户名，启用记住我
if (form.value.username) {
  rememberMe.value = true
}

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ]
}

const handleLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        const response = await request.post('/auth/login', {
          username: form.value.username,
          password: form.value.password
        })
        
        console.log('登录响应:', response)
        
        // 保存用户信息和 token 到 Cookie
        userStore.login(response.user, response.access_token)
        
        ElMessage.success('登录成功')
        
        // 记住用户名
        if (rememberMe.value) {
          localStorage.setItem('username', form.value.username)
        } else {
          localStorage.removeItem('username')
        }
        
        // 根据角色跳转
        if (response.user.role === 'admin') {
          router.push('/admin/competitions')
        } else {
          router.push('/')
        }
      } catch (error: any) {
        console.error('登录失败:', error)
        ElMessage.error(error?.detail || '登录失败，请检查用户名和密码')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="card">
    <h2 class="text-2xl font-bold text-center mb-8">登录</h2>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      @submit.prevent="handleLogin(formRef)"
    >
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          placeholder="用户名"
          :prefix-icon="User"
        />
      </el-form-item>
      
      <el-form-item prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="密码"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <div class="flex items-center justify-between mb-6">
        <el-checkbox v-model="rememberMe">记住我</el-checkbox>
        <router-link
          to="/auth/forgot-password"
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          忘记密码？
        </router-link>
      </div>

      <el-button
        type="primary"
        native-type="submit"
        class="w-full"
        :loading="loading"
      >
        登录
      </el-button>

      <div class="text-center mt-4">
        <router-link
          to="/auth/register"
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          没有账号？立即注册
        </router-link>
      </div>
    </el-form>
  </div>
</template> 