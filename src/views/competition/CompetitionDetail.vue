<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../api/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Calendar, Trophy, Document } from '@element-plus/icons-vue'

interface Competition {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  max_participants: number
  current_participants: number
  status: string
}

interface RegistrationStatus {
  registered: boolean
  status: string
  registration_id?: number
  id?: number
  message?: string
}

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const competition = ref<Competition | null>(null)
const loading = ref(true)
const registrationStatus = ref<RegistrationStatus | null>(null)
const registrationLoading = ref(false)

// 获取URL中的活动ID
const competitionId = computed(() => Number(route.params.id))

// 加载活动详情
const loadCompetitionDetail = async () => {
  try {
    loading.value = true
    const response = await request.get(`/competitions/${competitionId.value}`)
    competition.value = response.data || response
    
    // 如果用户已登录，检查报名状态
    if (userStore.token) {
      checkRegistrationStatus()
    }
  } catch (error) {
    console.error('加载活动详情失败:', error)
    ElMessage.error('加载活动详情失败')
  } finally {
    loading.value = false
  }
}

// 检查报名状态
const checkRegistrationStatus = async () => {
  try {
    const response = await request.get(`/competitions/${competitionId.value}/registration/status`)
    
    registrationStatus.value = response.data || response
    console.log('报名状态API返回:', registrationStatus.value)
  } catch (error) {
    console.error('检查报名状态失败:', error)
    registrationStatus.value = null
  }
}

// 开始报名流程
const startRegistration = async () => {
  if (registrationLoading.value) return; // 防止重复点击
  
  registrationLoading.value = true;
  
  try {
    // 如果未登录，提示登录
    if (!userStore.token) {
      ElMessageBox.confirm('请先登录后再报名', '提示', {
        confirmButtonText: '去登录',
        cancelButtonText: '取消',
        type: 'info'
      }).then(() => {
        router.push({
          path: '/auth/login',
          query: { redirect: route.fullPath }
        })
      }).catch(() => {})
      return
    }
    
    // 安全检查：只有未报名或已拒绝状态才能继续报名过程
    if (registrationStatus.value && 
        registrationStatus.value.status !== 'not_registered' && 
        registrationStatus.value.status !== 'rejected') {
      // 显示状态提示
      let statusText = '';
      switch (registrationStatus.value.status) {
        case 'pending': statusText = '您的报名正在审核中'; break;
        case 'approved': statusText = '您的报名已通过'; break;
        default: statusText = '您已完成报名'; break;
      }
      ElMessage.info(statusText);
      return;
    }
    
    // 继续报名 - 对于未报名和已拒绝的状态
    router.push(`/competition/${competitionId.value}/register`);
  } catch (error) {
    console.error('报名过程出错:', error);
    ElMessage.error('报名过程出错，请稍后重试');
  } finally {
    registrationLoading.value = false;
  }
}

// 判断活动是否可以报名
const canRegister = computed(() => {
  if (!competition.value) return false
  
  const now = new Date()
  const endTime = new Date(competition.value.end_time)
  
  // 如果未登录，也允许点击按钮（之后会提示登录）
  if (!userStore.token) {
    return (
      competition.value.status === 'published' &&
      now <= endTime &&
      competition.value.current_participants < competition.value.max_participants
    );
  }
  
  // 检查报名状态 - 允许未报名和已拒绝的状态报名
  const registrationAllowed = 
    registrationStatus.value?.status === 'not_registered' || 
    registrationStatus.value?.status === 'rejected'; // 允许未报名和已拒绝状态
  
  const result = (
    competition.value.status === 'published' &&
    now <= endTime &&
    competition.value.current_participants < competition.value.max_participants &&
    registrationAllowed
  );
  
  console.log('报名按钮状态:', { 
    canRegister: result,
    competitionStatus: competition.value.status,
    beforeEndTime: now <= endTime,
    hasAvailableSlots: competition.value.current_participants < competition.value.max_participants,
    registrationAllowed: registrationAllowed,
    registrationStatus: registrationStatus.value?.status
  });
  
  return result;
})

// 获取报名状态文本
const registrationStatusText = computed(() => {
  if (!registrationStatus.value) return ''
  
  switch (registrationStatus.value.status) {
    case 'pending': return '审核中'
    case 'approved': return '已通过'
    case 'rejected': return '已拒绝'
    case 'not_registered': return '未报名'
    default: return ''
  }
})

// 获取操作按钮文本
const getActionButtonText = () => {
  // 未登录状态
  if (!userStore.token) {
    return '立即提交';
  }
  
  // 已登录，根据报名状态显示不同文本
  if (!registrationStatus.value) {
    return '加载中...';
  }
  
  // 已拒绝状态特殊处理，允许重新报名
  if (registrationStatus.value.status === 'rejected') {
    return '重新报名';
  }
  
  // 已经报名过的情况，即使按钮是禁用的，也要显示状态
  if (registrationStatus.value.registered || 
      registrationStatus.value.status !== 'not_registered') {
    switch (registrationStatus.value.status) {
      case 'pending': return '审核中';
      case 'approved': return '已通过';
      default: return '已报名';
    }
  }
  
  // 未报名状态
  return '立即提交';
}

onMounted(() => {
  loadCompetitionDetail()
})
</script>

<template>
  <div class="space-y-8">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <el-spinner size="large" />
    </div>
    
    <template v-else-if="competition">
      <!-- 活动标题和状态 -->
      <div class="mb-6">
        <div class="flex justify-between items-start mb-2">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">{{ competition.title }}</h1>
          <el-tag :type="competition.status === 'published' ? 'success' : competition.status === 'draft' ? 'info' : 'danger'">
            {{ competition.status === 'published' ? '进行中' : competition.status === 'draft' ? '未开始' : '已结束' }}
          </el-tag>
        </div>
      </div>
      
      <!-- 活动信息卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="card flex items-center">
          <el-icon class="text-primary-500 mr-4" :size="30"><Calendar /></el-icon>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">开始时间</p>
            <p class="font-semibold">{{ new Date(competition.start_time).toLocaleString() }}</p>
          </div>
        </div>
        
        <div class="card flex items-center">
          <el-icon class="text-primary-500 mr-4" :size="30"><Calendar /></el-icon>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">结束时间</p>
            <p class="font-semibold">{{ new Date(competition.end_time).toLocaleString() }}</p>
          </div>
        </div>
      </div>
      
      <!-- 活动详情 -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4 flex items-center">
          <el-icon class="text-primary-500 mr-2"><Document /></el-icon>
          活动详情
        </h2>
        <div class="prose dark:prose-invert max-w-none">
          <p>{{ competition.description }}</p>
        </div>
      </div>
      
      <!-- 报名状态和按钮 -->
      <div class="card">
        <h2 class="text-xl font-semibold mb-4 flex items-center">
          <el-icon class="text-primary-500 mr-2"><Trophy /></el-icon>
          提交信息
        </h2>
        
        <div v-if="registrationStatus && registrationStatus.registered" class="mb-4">
          <p class="text-lg">
            报名状态：
            <el-tag 
              :type="registrationStatus.status === 'approved' ? 'success' : 
                    registrationStatus.status === 'pending' ? 'warning' : 'danger'"
            >
              {{ registrationStatusText }}
            </el-tag>
          </p>
        </div>
        
        <div class="flex justify-between items-center">
          <p v-if="!canRegister && competition.current_participants >= competition.max_participants" 
             class="text-red-500">
            报名人数已满
          </p>
          
          <p v-else-if="!canRegister && new Date() > new Date(competition.end_time)" 
             class="text-red-500">
            活动已结束
          </p>
          
          <el-button 
            type="primary" 
            @click="startRegistration"
            :loading="registrationLoading"
            :disabled="!canRegister"
            class="registration-btn z-10 relative cursor-pointer"
          >
            {{ getActionButtonText() }}
          </el-button>
        </div>
      </div>
    </template>
    
    <!-- 未找到活动 -->
    <el-empty v-else description="未找到活动信息" />
  </div>
</template> 