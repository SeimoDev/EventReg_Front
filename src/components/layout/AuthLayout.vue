<script setup lang="ts">
import { useTheme } from '../../utils/theme'

const { isDark } = useTheme()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <router-link to="/" class="text-2xl font-bold text-primary-600 dark:text-primary-400">
          河南省创响中原项目管理平台
        </router-link>
      </div>
      <router-view></router-view>
    </div>
  </div>
</template> 