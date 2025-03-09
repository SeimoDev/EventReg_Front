<script setup lang="ts">
import { useTheme } from './utils/theme'
import { onMounted } from 'vue'

const { initTheme } = useTheme()

onMounted(() => {
  initTheme()
})
</script>

<template>
  <div class="tw-test">
    <router-view></router-view>
  </div>
</template>

<style>
/* 确保全局样式已导入 */
@import './style.css';

/* 测试样式 */
.tw-test {
  @apply text-black dark:text-white min-h-screen;
}
</style>
