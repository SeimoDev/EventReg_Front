<!-- 404 页面 - 未找到页面 -->
<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="text-4xl font-bold mb-4">404</h1>
      <p class="text-xl mb-6">页面未找到</p>
      <p class="mb-4">正在自动跳转到首页...</p>
      <el-progress :percentage="progressValue" />
      <p class="mt-6">
        <el-button type="primary" @click="goToHome">立即返回首页</el-button>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'NotFound',
  setup() {
    const router = useRouter();
    const progressValue = ref(0);
    
    // 页面加载时自动跳转到首页
    onMounted(() => {
      // 启动进度条
      const interval = setInterval(() => {
        progressValue.value += 4;
        if (progressValue.value >= 100) {
          clearInterval(interval);
          // 跳转到首页
          router.push({ name: 'home' });
        }
      }, 100);
    });
    
    // 立即跳转到首页的方法
    const goToHome = () => {
      router.push({ name: 'home' });
    };
    
    return {
      progressValue,
      goToHome
    };
  }
});
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  text-align: center;
}

.not-found-content {
  max-width: 500px;
  padding: 2rem;
  border-radius: 8px;
  background-color: #f9f9f9;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 