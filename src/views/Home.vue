<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '../api/request'
import { ArrowRight } from '@element-plus/icons-vue'

interface Competition {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  status: string
}

const featuredCompetitions = ref<Competition[]>([])
const loading = ref(true)

const loadFeaturedCompetitions = async () => {
  try {
    loading.value = true
    const response = await request.get('/competitions', {
      params: {
        page: 1,
        per_page: 3,
        status: 'published'
      }
    })
    featuredCompetitions.value = response.competitions
  } catch (error) {
    console.error('加载推荐活动失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFeaturedCompetitions()
})
</script>

<template>
  <div class="min-h-screen">
    <!-- 英雄区域 -->
    <div class="relative bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div class="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
          <div class="mb-12 lg:mb-0">
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              发现精彩活动
              <br />
              展现你的才华
            </h1>
            <div class="space-x-4">
              <router-link to="/competitions" class="btn-primary bg-white text-primary-600 hover:bg-gray-100">
                浏览活动
              </router-link>
              <router-link to="/auth/register" class="btn-primary bg-transparent border-2 border-white hover:bg-white hover:text-primary-600">
                立即注册
              </router-link>
            </div>
          </div>
          <div class="hidden lg:block">
            <img src="/hero-image.svg" alt="活动插图" class="w-full" />
          </div>
        </div>
      </div>
      
      <!-- 装饰波浪 -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg class="w-full h-12 sm:h-16 fill-current text-gray-50 dark:text-gray-900" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
    </div>

    <!-- 推荐活动 -->
    <div class="bg-gray-50 dark:bg-gray-900 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            活动列表
          </h2>
        </div>

        <div v-loading="loading">
          <el-row :gutter="16">
            <el-col v-for="competition in featuredCompetitions" 
                    :key="competition.id" 
                    :xs="24" 
                    :sm="12" 
                    :md="8" 
                    class="mb-6">
              <div class="card transform hover:scale-105 transition-transform duration-300">
                <h3 class="text-xl font-semibold mb-3">{{ competition.title }}</h3>
                <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {{ competition.description }}
                </p>
                <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4">
                  <p>开始时间：{{ new Date(competition.start_time).toLocaleString() }}</p>
                  <p>结束时间：{{ new Date(competition.end_time).toLocaleString() }}</p>
                </div>
                <router-link 
                  :to="'/competition/' + competition.id" 
                  class="inline-flex items-center text-primary-600 hover:text-primary-500"
                >
                  立即报名参加活动
                  <el-icon class="ml-1"><ArrowRight /></el-icon>
                </router-link>
              </div>
            </el-col>
          </el-row>

          <div class="text-center mt-8">
            <router-link to="/competitions" class="btn-primary">
              查看更多活动
            </router-link>
          </div>
        </div>
      </div>
    </div>

  </div>
</template> 