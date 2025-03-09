<!-- 活动数据导出对话框 -->
<template>
  <el-dialog
    title="导出活动数据"
    v-model="dialogVisible"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="!exporting"
    :show-close="!exporting"
  >
    <div class="export-dialog-content">
      <!-- 导出类型选择 -->
      <div class="mb-4">
        <p class="font-bold mb-2">选择导出类型：</p>
        <el-radio-group v-model="exportType" :disabled="exporting">
          <el-radio label="text">文字信息</el-radio>
          <el-radio label="files">附件文件</el-radio>
          <el-radio label="all">全部数据</el-radio>
        </el-radio-group>
      </div>

      <!-- 导出说明 -->
      <div class="mb-4 text-sm text-gray-600">
        <p v-if="exportType === 'text'">
          <i class="el-icon-info-circle mr-1"></i>
          将导出所有参加者填写的文本字段信息为Excel文件。
        </p>
        <p v-else-if="exportType === 'files'">
          <i class="el-icon-info-circle mr-1"></i>
          将导出所有上传的附件为ZIP压缩包。
          <span class="text-orange-500">大型活动的附件导出可能需要较长时间。</span>
        </p>
        <p v-else>
          <i class="el-icon-info-circle mr-1"></i>
          将导出所有文本信息和附件。
          <span class="text-orange-500">大型活动的完整导出可能需要较长时间。</span>
        </p>
      </div>

      <!-- 进度条 -->
      <div v-if="exporting" class="mt-4">
        <p class="mb-2">{{ statusText }}</p>
        <el-progress 
          :percentage="exportProgress" 
          :format="(format: number) => `${format}%`"
          :stroke-width="10"
        ></el-progress>
      </div>

      <!-- 错误信息 -->
      <div v-if="error" class="mt-4 text-red-500">
        <p><i class="el-icon-error mr-1"></i> {{ error }}</p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeDialog" :disabled="exporting">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleExport" 
          :loading="exporting"
          :disabled="exporting"
        >
          开始导出
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { ElMessage } from 'element-plus';
import Cookies from 'js-cookie';
import { COOKIE_TOKEN_KEY } from '../../stores/constants';

// 从环境变量获取API基础URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default defineComponent({
  name: 'ExportDialog',
  props: {
    competitionId: {
      type: [Number, String],
      required: true
    },
    competitionName: {
      type: String,
      default: '活动'
    },
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'export-complete'],
  setup(props, { emit }) {
    // 获取token可以使用cookie或localStorage
    const getToken = () => {
      // 优先从cookie中获取token
      const tokenFromCookie = Cookies.get(COOKIE_TOKEN_KEY);
      if (tokenFromCookie) {
        return tokenFromCookie;
      }
      
      // 如果cookie中没有，尝试从localStorage获取
      return localStorage.getItem('token') || '';
    };
    
    // 状态变量
    const dialogVisible = computed({
      get: () => props.visible,
      set: (value) => emit('update:visible', value)
    });
    const exportType = ref('text');
    const exporting = ref(false);
    const exportProgress = ref(0);
    const statusText = ref('');
    const error = ref('');
    
    // 进度模拟器
    let progressTimer: number | null = null;
    
    // 方法
    const closeDialog = () => {
      if (exporting.value) return;
      resetState();
      dialogVisible.value = false;
    };
    
    const resetState = () => {
      exportType.value = 'text';
      exportProgress.value = 0;
      statusText.value = '';
      error.value = '';
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    };
    
    const simulateProgress = () => {
      let progress = 0;
      
      // 不同导出类型使用不同的进度模拟策略
      const isFileExport = exportType.value === 'files' || exportType.value === 'all';
      const progressStep = isFileExport ? 8 : 8; // 增加文件导出的进度步长，加快模拟速度
      const maxProgress = isFileExport ? 85 : 90; // 文件导出预留更多余量
      
      progressTimer = window.setInterval(() => {
        // 模拟进度增长，文件导出增长更快
        progress += Math.random() * progressStep;
        if (progress > maxProgress) {
          progress = maxProgress; // 最多到85%或90%，剩下的在实际完成时更新
          clearInterval(progressTimer as number);
          progressTimer = null;
        }
        
        exportProgress.value = Math.round(progress);
        
        // 根据不同阶段和类型显示不同消息
        if (isFileExport) {
          if (progress < 20) {
            statusText.value = '正在搜集文件信息...';
          } else if (progress < 40) {
            statusText.value = '正在压缩文件...';
          } else if (progress < 60) {
            statusText.value = '正在准备下载...';
          } else {
            statusText.value = '正在等待服务器响应，大文件可能需要较长时间...';
          }
        } else {
          if (progress < 30) {
            statusText.value = '正在收集数据...';
          } else if (progress < 60) {
            statusText.value = '正在处理数据...';
          } else {
            statusText.value = '正在生成文件...';
          }
        }
      }, 100); // 降低间隔时间，加快更新频率
    };
    
    const handleExport = async () => {
      if (exporting.value) return;
      exporting.value = true;
      exportProgress.value = 0;
      statusText.value = '准备导出...';
      
      // 开始模拟进度
      simulateProgress();
      
      try {
        let endpoint = '';
        let filename = 'export.json';
        
        // 设置适当的端点和文件名
        if (exportType.value === 'text') {
          endpoint = `${API_BASE_URL}/export/competition/${props.competitionId}/text-data`;
          filename = `${props.competitionName}_文字信息.xlsx`;
          statusText.value = '正在导出文本数据...';
        } else if (exportType.value === 'files') {
          endpoint = `${API_BASE_URL}/export/competition/${props.competitionId}/files`;
          filename = `${props.competitionName}_附件.zip`;
          statusText.value = '正在导出文件附件...';
          ElMessage.info('文件导出可能需要较长时间，请耐心等待。对于大型ZIP文件，下载完成后浏览器可能需要额外时间处理。');
        } else { // all
          endpoint = `${API_BASE_URL}/export/competition/${props.competitionId}/all`;
          filename = `${props.competitionName}_完整数据.zip`;
          statusText.value = '正在导出全部数据...';
          ElMessage.info('完整导出可能需要较长时间，请耐心等待。完成后系统将自动触发下载。');
        }
        
        // 设置超时，防止长时间卡住
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('导出请求超时')), 120000); // 2分钟超时
        });
        
        // 发起请求并处理超时
        const response = await Promise.race([
          fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${getToken()}`,
            },
          }),
          timeoutPromise
        ]) as Response;

        // 立即清除进度模拟器
        if (progressTimer) {
          clearInterval(progressTimer as number);
          progressTimer = null;
        }

        // 检查响应是否成功
        if (!response.ok) {
          throw new Error(`导出失败: ${response.status} ${response.statusText}`);
        }

        // 检查响应内容类型
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        // 记录响应信息，帮助调试
        console.log(`导出响应: 类型=${contentType}, 大小=${contentLength}`);
        
        // 检查是否是预期的文件类型
        const isJSON = contentType?.includes('application/json');
        const isZip = contentType?.includes('application/zip') || contentType?.includes('application/octet-stream');
        
        if (!isJSON && !isZip) {
          console.warn(`导出响应类型不符合预期: ${contentType}`);
        }
        
        // 设置状态为处理中
        statusText.value = '正在处理文件，准备下载...';
        exportProgress.value = 95;
        
        // 获取blob数据
        const blob = await response.blob();
        
        if (!blob || blob.size === 0) {
          throw new Error('导出数据为空');
        }
        
        // 设置为100%
        exportProgress.value = 100;
        statusText.value = '导出完成，正在下载...';
        
        // 创建并触发下载
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // 立即触发下载
        link.click();
        
        // 清理
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
        
        // 完成后关闭对话框
        setTimeout(() => {
          closeDialog();
        }, 1500);
        
      } catch (downloadError: any) {
        console.error('导出或下载失败:', downloadError);
        statusText.value = '导出失败';
        exportProgress.value = 0;
        ElMessage.error(`导出失败: ${downloadError.message || '未知错误'}`);
      } finally {
        exporting.value = false;
      }
    };
    
    return {
      dialogVisible,
      exportType,
      exporting,
      exportProgress,
      statusText,
      error,
      closeDialog,
      handleExport
    };
  }
});
</script>

<style scoped>
.export-dialog-content {
  min-height: 150px;
}
</style> 