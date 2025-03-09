<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <div class="hello-vue">
    <h2>{{ title || '欢迎使用 Vue 3 + TypeScript + Vite' }}</h2>
    <p>开始构建您的应用程序吧！</p>
  </div>
</template>

<style scoped>
.hello-vue {
  padding: 2rem;
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}
</style> 