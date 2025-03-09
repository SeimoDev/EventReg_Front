<script setup lang="ts">
import { useTheme } from '../../utils/theme'
import { useUserStore } from '../../stores/user'
import { useRouter, useRoute } from 'vue-router'
import { Menu as IconMenu, Document, Back, User } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'

const isCollapse = ref(false)
const userStore = useUserStore()
const router = useRouter()
const route = useRoute()

// 获取当前页面标题
const pageTitle = computed(() => {
  return route.meta.title || '管理后台';
})

const handleLogout = () => {
  userStore.logout()
  router.push('/auth/login')
}
</script>

<template>
  <div class="min-h-screen flex">
    <!-- 侧边栏 -->
    <el-menu
      :collapse="isCollapse"
      class="h-screen border-r border-gray-200 dark:border-gray-700"
      :class="isCollapse ? 'w-16' : 'w-64'"
      :default-active="route.path"
      router
    >
      <div class="flex items-center justify-between p-4">
        <span v-if="!isCollapse" class="text-lg font-semibold">管理后台</span>
        <el-button type="text" @click="isCollapse = !isCollapse">
          <el-icon><IconMenu /></el-icon>
        </el-button>
      </div>
      <el-menu-item 
        index="/admin/competitions"
      >
        <el-icon><Document /></el-icon>
        <span>活动管理</span>
      </el-menu-item>
      
      <el-menu-item 
        index="/admin/users"
      >
        <el-icon><User /></el-icon>
        <span>用户管理</span>
      </el-menu-item>
    </el-menu>

    <!-- 主要内容区域 -->
    <div class="flex-1 flex flex-col">
      <!-- 顶部导航栏 -->
      <div class="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <h1 class="text-xl font-semibold">{{ pageTitle }}</h1>
        <div class="flex items-center space-x-4">
          <el-button type="primary" size="small" @click="router.push('/')">
            <el-icon class="mr-1"><Back /></el-icon>
            返回主页
          </el-button>
          <el-dropdown>
            <span class="text-gray-600 dark:text-gray-300 cursor-pointer">
              {{ userStore.userInfo?.username }}
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>
.el-menu {
  transition: width 0.3s;
}
</style> 