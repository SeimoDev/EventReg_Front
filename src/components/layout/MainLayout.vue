<script setup lang="ts">
import { useTheme } from '../../utils/theme'
import { useUserStore } from '../../stores/user'
import { useRouter } from 'vue-router'
import { Sunny, Moon } from '@element-plus/icons-vue'

const { isDark, toggleTheme } = useTheme()
const userStore = useUserStore()
const router = useRouter()

const handleLogout = () => {
  userStore.logout()
  router.push('/auth/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 导航栏 -->
    <nav class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="text-xl font-bold text-primary-600 dark:text-primary-400">
              河南省创响中原项目管理平台
            </router-link>
          </div>

          <div class="flex items-center space-x-4">
            <!-- 主题切换 -->
            <button @click="toggleTheme" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <el-icon :size="20" class="text-gray-600 dark:text-gray-300">
                <Sunny v-if="isDark" />
                <Moon v-else />
              </el-icon>
            </button>

            <!-- 用户菜单 -->
            <template v-if="userStore.userInfo">
              <el-dropdown>
                <span class="text-gray-600 dark:text-gray-300 cursor-pointer">
                  {{ userStore.userInfo.username }}
                </span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item v-if="userStore.userInfo.role === 'admin'">
                      <router-link to="/admin/competitions">管理后台</router-link>
                    </el-dropdown-item>
                    <el-dropdown-item>
                      <router-link to="/user/profile">个人中心</router-link>
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
            <template v-else>
              <router-link to="/auth/login" class="btn-primary">
                登录
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- 主要内容 -->
    <main class="flex-1 bg-gray-50 dark:bg-gray-900">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <router-view></router-view>
      </div>
    </main>

    <!-- 页脚 -->
    <footer class="bg-white dark:bg-gray-800 border-t dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p class="text-center text-gray-500 dark:text-gray-400">
          © {{ new Date().getFullYear() }} 河南省创响中原项目管理平台. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template> 