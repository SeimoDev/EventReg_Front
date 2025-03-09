<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '../../api/request'
import { Search } from '@element-plus/icons-vue'

interface Competition {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  status: string
}

const competitions = ref<Competition[]>([])
const loading = ref(true)
const currentPage = ref(1)
const total = ref(0)
const pageSize = ref(10)
const searchQuery = ref('')

const loadCompetitions = async () => {
  try {
    loading.value = true
    const response = await request.get('/competitions', {
      params: {
        page: currentPage.value,
        per_page: pageSize.value,
        status: 'published'
      }
    })
    competitions.value = response.competitions
    total.value = response.total
  } catch (error) {
    console.error('加载活动列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadCompetitions()
}

onMounted(() => {
  loadCompetitions()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">活动列表</h1>
      <el-input
        v-model="searchQuery"
        placeholder="搜索活动..."
        class="w-64"
      >
        <template #prefix>
          <el-icon class="el-input__icon"><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <el-row :gutter="16">
      <el-col v-for="competition in competitions" 
              :key="competition.id" 
              :xs="24" 
              :sm="12" 
              :md="8" 
              :lg="6" 
              class="mb-4">
        <div class="card h-full">
          <h3 class="text-lg font-semibold mb-2">{{ competition.title }}</h3>
          <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {{ competition.description }}
          </p>
          <div class="text-sm text-gray-500 dark:text-gray-400 space-y-1">
            <p>开始时间：{{ new Date(competition.start_time).toLocaleString() }}</p>
            <p>结束时间：{{ new Date(competition.end_time).toLocaleString() }}</p>
          </div>
          <div class="mt-4">
            <router-link 
              :to="'/competition/' + competition.id" 
              class="btn-primary block text-center"
            >
              查看详情
            </router-link>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 分页 -->
    <div class="flex justify-center mt-6">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadCompetitions"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 加载状态 -->
    <el-empty v-if="!loading && competitions.length === 0" description="暂无活动" />
    <div v-if="loading" class="flex justify-center py-8">
      <el-spinner />
    </div>
  </div>
</template> 