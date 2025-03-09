<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import request from '../../api/request'
import type { FormInstance, FormRules } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== form.value.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const handleSubmit = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        loading.value = true
        await request.post('/auth/register', {
          username: form.value.username,
          email: form.value.email,
          password: form.value.password
        })
        router.push('/auth/login')
      } catch (error) {
        console.error('注册失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <div class="card">
    <h2 class="text-2xl font-bold text-center mb-8">注册</h2>
    
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      @submit.prevent="handleSubmit(formRef)"
    >
      <el-form-item prop="username">
        <el-input
          v-model="form.username"
          placeholder="用户名"
          :prefix-icon="User"
        />
      </el-form-item>
      
      <el-form-item prop="email">
        <el-input
          v-model="form.email"
          placeholder="邮箱"
          :prefix-icon="Message"
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
      
      <el-form-item prop="confirmPassword">
        <el-input
          v-model="form.confirmPassword"
          type="password"
          placeholder="确认密码"
          :prefix-icon="Lock"
          show-password
        />
      </el-form-item>

      <el-button
        type="primary"
        native-type="submit"
        class="w-full"
        :loading="loading"
      >
        注册
      </el-button>

      <div class="text-center mt-4">
        <router-link
          to="/auth/login"
          class="text-sm text-primary-600 hover:text-primary-500"
        >
          已有账号？立即登录
        </router-link>
      </div>
    </el-form>
  </div>
</template> 