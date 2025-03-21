<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick, onUnmounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../api/request'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile, UploadRawFile } from 'element-plus'
import { Upload, Plus, Loading } from '@element-plus/icons-vue'
import { ElUpload } from 'element-plus'
import { Trophy } from '@element-plus/icons-vue'
import { ElDatePicker } from 'element-plus'
import { InfoFilled } from '@element-plus/icons-vue'

// 基本字段ID常量
const TEAM_NAME_FIELD_ID = 1
const CONTACT_PHONE_FIELD_ID = 2

// 添加本地存储相关常量
const LOCAL_STORAGE_KEY_PREFIX = 'form_draft_'
const AUTO_SAVE_INTERVAL = 30000 // 30秒自动保存一次

interface FormField {
  id: number
  field_name: string
  field_label: string
  field_type: string
  is_required: boolean | number | string
  options?: string | {
    accepted_formats?: string
    [key: string]: any
  } | Array<{
    value: string
    label: string
    [key: string]: any
  }>
  sort_order?: number
  allow_multiple?: boolean
  other_option?: boolean
  allow_custom_options?: boolean
}

// 辅助函数，检查options是否有accepted_formats属性
function hasAcceptedFormats(options: any): boolean {
  if (!options) return false;
  if (typeof options === 'string') return false;
  if (Array.isArray(options)) return false;
  return typeof options.accepted_formats === 'string';
}

// 辅助函数，安全地获取accepted_formats属性
function getAcceptedFormats(options: any): string {
  if (hasAcceptedFormats(options)) {
    return options.accepted_formats;
  }
  return '';
}

// 自定义文件项接口，不再继承UploadUserFile
interface FileItem {
  raw: File | null
  name: string
  url?: string
  size?: number
  uid: string | number
  status?: string
}

// 上传相关类型定义
interface UploadHeaders {
  Authorization: string
}

// 自定义上传文件接口，避免与element-plus的冲突
interface CustomUploadFile {
  name: string
  percentage?: number
  status: 'ready' | 'uploading' | 'success' | 'fail'
}

interface Competition {
  id: number
  title: string
}

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const formData = ref<Record<string, any>>({
  team_name: '',
  contact_phone: '',
  additional_info: ''
})
const formFields = ref<FormField[]>([])
const fileList = ref<Record<number, FileItem[]>>({})

// 添加自动保存相关的状态
const autoSaveTimer = ref<number | null>(null)
const lastSavedTime = ref<Date | null>(null)
const hasUnsavedChanges = ref(false)

// 获取当前表单的本地存储键
const getLocalStorageKey = computed(() => {
  const competitionId = route.params.id
  const userId = userStore.userInfo?.id
  return `${LOCAL_STORAGE_KEY_PREFIX}${competitionId}_${userId}`
})

// 保存表单数据到本地存储
const saveFormToLocal = () => {
  try {
    const dataToSave = {
      formData: formData.value,
      fileList: fileList.value,
      multiSelectValues, // 添加多选值
      customOptions, // 添加自定义选项
      otherOptions, // 添加"其他"选项
      lastSaved: new Date().toISOString(),
      competitionId: route.params.id,
      userId: userStore.userInfo?.id
    }
    localStorage.setItem(getLocalStorageKey.value, JSON.stringify(dataToSave))
    lastSavedTime.value = new Date()
    hasUnsavedChanges.value = false
    console.log('表单数据已自动保存到本地')
  } catch (error) {
    console.error('保存表单数据到本地失败:', error)
  }
}

// 从本地存储加载表单数据
const loadFormFromLocal = () => {
  try {
    const savedData = localStorage.getItem(getLocalStorageKey.value)
    if (savedData) {
      const parsed = JSON.parse(savedData)
      
      // 验证数据是否属于当前比赛和用户
      if (parsed.competitionId === route.params.id && 
          parsed.userId === userStore.userInfo?.id) {
        
        // 恢复表单数据
        formData.value = parsed.formData
        fileList.value = parsed.fileList
        lastSavedTime.value = new Date(parsed.lastSaved)
        
        // 恢复多选相关数据
        if (parsed.multiSelectValues) {
          // 恢复多选值
          Object.keys(parsed.multiSelectValues).forEach(key => {
            multiSelectValues[Number(key)] = parsed.multiSelectValues[key]
          })
        }
        
        // 恢复自定义选项
        if (parsed.customOptions) {
          Object.keys(parsed.customOptions).forEach(key => {
            customOptions[Number(key)] = parsed.customOptions[key]
          })
        }
        
        // 恢复"其他"选项
        if (parsed.otherOptions) {
          Object.keys(parsed.otherOptions).forEach(key => {
            otherOptions[Number(key)] = parsed.otherOptions[key]
          })
        }
        
        // 确保多选数据在表单和UI状态之间同步
        formFields.value.forEach(field => {
          if (field.allow_multiple) {
            // 确保表单数据中的多选值正确反映在UI中
            const fieldId = field.id
            const formKey = `field_${fieldId}`
            
            // 如果多选值存在但对应的表单数据不存在，同步回表单数据
            if (multiSelectValues[fieldId] && !formData.value[formKey]) {
              formData.value[formKey] = [...multiSelectValues[fieldId]]
            }
            // 如果表单数据存在但对应的多选值不存在，同步到多选值
            else if (formData.value[formKey] && !multiSelectValues[fieldId]) {
              multiSelectValues[fieldId] = [...formData.value[formKey]]
            }
            
            console.log(`恢复多选题: fieldId=${fieldId}, 值=`, multiSelectValues[fieldId])
            
            // 恢复后检查是否包含"其他"选项，确保otherOptions正确初始化
            if (multiSelectValues[fieldId]?.includes('other')) {
              if (!otherOptions[fieldId]) {
                // 初始化"其他"选项
                otherOptions[fieldId] = { selected: true, text: '' }
              }
            }
          }
        })
        
        ElMessage.info({
          message: '已恢复上次保存的表单数据',
          duration: 5000
        })
        return true
      }
    }
    return false
  } catch (error) {
    console.error('加载本地表单数据失败:', error)
    return false
  }
}

// 清除本地存储的表单数据
const clearLocalFormData = () => {
  localStorage.removeItem(getLocalStorageKey.value)
  lastSavedTime.value = null
  hasUnsavedChanges.value = false
}

// 启动自动保存
const startAutoSave = () => {
  if (autoSaveTimer.value) return
  
  autoSaveTimer.value = window.setInterval(() => {
    if (hasUnsavedChanges.value) {
      saveFormToLocal()
    }
  }, AUTO_SAVE_INTERVAL)
}

// 停止自动保存
const stopAutoSave = () => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
    autoSaveTimer.value = null
  }
}

// 监听表单数据变化
watch([formData, fileList], () => {
  hasUnsavedChanges.value = true
}, { deep: true })

const uploadHeaders = computed<UploadHeaders>(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

// 文件大小限制常量
const IMAGE_MAX_SIZE = 5 * 1024 * 1024;  // 5MB 图片大小限制
const FILE_MAX_SIZE = 10 * 1024 * 1024;  // 10MB 文件大小限制
const TOTAL_SIZE_LIMIT = 200 * 1024 * 1024; // 200MB 总大小限制

// 文件上传处理函数
const handleUploadSuccess = (response: any, fieldId: number) => {
  if (response && response.success && response.data && response.data.file_path) {
    formData.value[`field_${fieldId}`] = response.data.file_path;
    
    // 更新文件列表
    const newFile: FileItem = {
      name: response.data.original_filename || '文件',
      url: response.data.file_path,
      raw: null,
      size: response.data.file_size || 0,
      uid: Date.now().toString(),
      status: 'success'
    };
    
    fileList.value[fieldId] = [newFile];
    
    ElMessage.success('文件上传成功');
  } else {
    ElMessage.error('文件上传失败');
  }
};

// 文件上传前的验证
const beforeUpload = (file: UploadRawFile, field: FormField) => {
  // 检查文件大小
  const maxSize = field.field_type === 'image' ? IMAGE_MAX_SIZE : FILE_MAX_SIZE;
  
  if (file.size > maxSize) {
    const sizeInMB = maxSize / (1024 * 1024);
    ElMessage.error(`文件 "${file.name}" 太大，请上传小于${sizeInMB}MB的文件`);
    return false;
  }

  // 检查文件类型
  if (field.field_type === 'image') {
    // 图片类型验证
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedImageTypes.includes(file.type)) {
      ElMessage.error(`文件 "${file.name}" 不是有效的图片格式，请上传JPG、PNG、GIF、BMP或WEBP格式的图片`);
      return false;
    }
  } else {
    // 其他文件类型验证
    const acceptedFormats = getAcceptedFormats(field.options);
    if (acceptedFormats && acceptedFormats.trim() !== '') {
      const formatList = acceptedFormats.split(',').map(format => format.trim().toLowerCase());
      // 如果是通配符格式（如.* 或 *），则允许所有类型
      if (formatList.includes('.*') || formatList.includes('*')) {
        return true;
      }
      
      // 获取文件扩展名
      const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
      // 检查文件扩展名是否在接受格式列表中
      const isAccepted = formatList.some(format => {
        // 处理带点和不带点的格式
        const formatExt = format.startsWith('.') ? format.substring(1) : format;
        return formatExt === fileExt;
      });
      
      if (!isAccepted) {
        ElMessage.error(`文件 "${file.name}" 格式不支持，请上传 ${acceptedFormats} 格式的文件`);
        return false;
      }
    }
  }
  return true
}

const beforeImageUpload = (file: UploadRawFile, field: FormField) => {
  // 统一参数类型
  return beforeUpload(file, field)
}

const beforeFileUpload = (file: UploadRawFile, field: FormField) => {
  return beforeUpload(file, field)
}

// 构建表单项
const buildFormItems = () => {
  const formItems = []
  
  // 添加基本字段
  if (formData.value.team_name) {
    formItems.push({
      field_id: TEAM_NAME_FIELD_ID,
      field_type: 'text',
      content: formData.value.team_name
    })
  }
  
  if (formData.value.contact_phone) {
    formItems.push({
      field_id: CONTACT_PHONE_FIELD_ID,
      field_type: 'text',
      content: formData.value.contact_phone
    })
  }
  
  // 添加自定义字段
  for (const field of formFields.value) {
    if (formData.value[`field_${field.id}`]) {
        formItems.push({
        field_id: field.id,
          field_type: field.field_type,
        content: formData.value[`field_${field.id}`]
        })
      }
    }
  
  return formItems
}

// 验证规则
const rules = computed<FormRules>(() => {
  const rulesObj: FormRules = {
    team_name: [
      { required: true, message: '请输入项目名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
    ],
    contact_phone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
  }
  
  // 添加自定义字段的验证规则
  for (const field of formFields.value) {
    if (field.is_required) {
          rulesObj[`field_${field.id}`] = [
        { required: true, message: `请填写${field.field_label}`, trigger: 'blur' }
      ]
    }
  }
  
  return rulesObj
})

// 重新定义状态变量
const formDataStatus = ref<'none' | 'exists' | 'error'>('none')
const formDataError = ref('')

// 获取比赛信息
const competition = ref<Competition | null>(null)
const loading = ref(false)
const error = ref('')

// 添加调试功能
const debugInfo = ref('')

// 添加原始API响应存储
const rawApiResponses = ref({
  competition: null,
  fields: null,
  formData: null
})

// 检查单选字段选项
const debugRadioOptions = () => {
  const radioFields = formFields.value.filter(field => field.field_type === 'radio');
  console.log(`找到 ${radioFields.length} 个单选字段`);
  
  if (radioFields.length === 0) {
    debugInfo.value = "没有找到单选题字段";
    ElMessage.warning('没有单选题字段');
      return;
    }
    
  const radioDebugInfo = [];
  
  radioFields.forEach(field => {
    console.log(`单选字段 ID=${field.id}, 名称="${field.field_label}":`);
    console.log('  原始选项:', field.options);
    const parsedOptions = parseOptions(field.options);
    console.log('  解析后选项:', parsedOptions);
    console.log('  当前值:', formData.value[`field_${field.id}`]);
    
    radioDebugInfo.push({
      id: field.id,
      label: field.field_label,
      originalOptions: field.options,
      parsedOptions,
      currentValue: formData.value[`field_${field.id}`]
    });
  });
  
  debugInfo.value = JSON.stringify(radioDebugInfo, null, 2);
};

// 修改调试函数，显示原始响应
const debugFormState = () => {
  // 检查单选字段选项
  debugRadioOptions();
  
  // 构建字段类型到值的映射
  const fieldValues = {};
  if (formFields.value) {
    formFields.value.forEach(field => {
      const fieldId = field.id;
      const value = formData.value[`field_${fieldId}`];
      let options = field.options;
      
      // 如果是单选字段，解析选项
      if (field.field_type === 'radio') {
        options = parseOptions(field.options);
      }
      
      fieldValues[fieldId] = {
        id: fieldId,
        name: field.field_name,
        label: field.field_label,
        type: field.field_type,
        required: !!field.is_required,
        value: value,
        options: options
      };
    });
  }

  debugInfo.value = JSON.stringify({
    hasCompetition: competition.value !== null,
    competitionData: competition.value,
    formFieldsLength: formFields.value.length,
    formFields: formFields.value,
    formValues: fieldValues, // 添加字段值映射
    loading: loading.value,
    error: error.value,
    formDataStatus: formDataStatus.value,
    showForm: !loading.value && !error.value && formFields.value.length > 0,
    showInfoCard: !formFields.value.length && !loading.value && !error.value,
    rawApiResponses: rawApiResponses.value // 添加原始响应
  }, null, 2)
  
  console.log('表单渲染调试信息:', {
    hasCompetition: competition.value !== null,
    formFieldsLength: formFields.value.length,
    isLoading: loading.value,
    hasError: error.value !== '',
    showForm: !loading.value && !error.value && formFields.value.length > 0,
    showInfoCard: !formFields.value.length && !loading.value && !error.value
  })
}

// 强制刷新表单修复
const forceRefreshForm = () => {
  // 清空当前字段列表
  formFields.value = []
  // 等待下一个渲染周期
  nextTick(() => {
    // 检查本地存储的字段数据
    const storedFieldsStr = localStorage.getItem('cached_form_fields')
    if (storedFieldsStr) {
      try {
        const storedFields = JSON.parse(storedFieldsStr)
        if (Array.isArray(storedFields) && storedFields.length > 0) {
          console.log('从缓存加载字段数据:', storedFields.length)
          formFields.value = processFieldData(storedFields)
          formDataStatus.value = 'none'
          
          // 不需要在这里初始化文件列表，processFieldData已经处理了
          // formFields.value.forEach(field => {
          //   if (field.field_type === 'file' || field.field_type === 'image') {
          //     fileList.value[field.id] = []
          //   }
          // })
          
          ElMessage.success('从缓存加载表单字段成功')
        } else {
          ElMessage.warning('缓存中没有有效的字段数据')
        }
      } catch (e) {
        console.error('解析缓存字段数据失败:', e)
        ElMessage.error('缓存字段数据格式错误')
      }
        } else {
      ElMessage.warning('没有找到缓存的表单字段')
    }
  })
}

// 处理字段数据的函数
const processFieldData = (fieldsData) => {
  if (!Array.isArray(fieldsData) || fieldsData.length === 0) {
    console.warn('没有有效的字段数据');
    return [];
  }
  
  console.log(`处理${fieldsData.length}个字段数据`);
  
  // 处理每个字段
  return fieldsData.map(field => {
    console.log(`处理字段: ID=${field.id}, 类型=${field.field_type}, 名称="${field.field_label || '未命名'}"`);
    
    // 初始化表单数据
    if (field.field_type === 'text') {
      // 文本字段初始化为空字符串
      formData.value[`field_${field.id}`] = formData.value[`field_${field.id}`] || '';
      console.log(`初始化文本字段: ID=${field.id}`);
    } else if (field.field_type === 'radio') {
      // 单选字段可能需要初始化为默认值
      if (!formData.value[`field_${field.id}`]) {
        // 解析选项
        console.log(`单选字段 ID=${field.id}, 原始选项:`, field.options);
        const options = parseOptions(field.options);
        console.log(`单选字段 ID=${field.id}, 解析后选项:`, options);
        
        // 始终将空值设为默认值，表示"请选择xxx"
        formData.value[`field_${field.id}`] = '';
        console.log(`初始化单选字段为空值(请选择提示): ID=${field.id}`);
      } else {
        console.log(`单选字段 ID=${field.id} 已有值: "${formData.value[`field_${field.id}`]}"`);
      }
    } else if (field.field_type === 'file' || field.field_type === 'image') {
      // 初始化文件列表
      if (!fileList.value[field.id]) {
        fileList.value[field.id] = [];
        console.log(`初始化文件列表: ID=${field.id}, 类型=${field.field_type}`);
      }
    }
    
    return field;
  });
};

// 添加一个帮助函数来检查是否有数据加载和显示问题
const debugFormData = () => {
  console.log('==== 表单数据调试信息 ====');
  console.log('当前表单数据:', formData.value);
  console.log('文件列表:', fileList.value);
  
  let missingFields = [];
  let invalidFileFields = [];
  
  formFields.value.forEach(field => {
    const fieldValue = formData.value[`field_${field.id}`];
    
    // 检查字段值是否存在
    if (!fieldValue && field.is_required) {
      missingFields.push(`${field.id} (${field.field_label})`);
    }
    
    // 检查文件字段
    if ((field.field_type === 'file' || field.field_type === 'image') && 
        (!fileList.value[field.id] || fileList.value[field.id].length === 0)) {
      invalidFileFields.push(`${field.id} (${field.field_label})`);
    }
  });
  
  console.log('缺失必填字段:', missingFields.length ? missingFields : '无');
  console.log('文件列表缺失:', invalidFileFields.length ? invalidFileFields : '无');
  console.log('===========================');
  
  // 更新调试信息
  debugInfo.value = `
表单数据检查:
- 已加载字段数: ${formFields.value.length}
- 缺失必填字段: ${missingFields.length ? missingFields.join(', ') : '无'}
- 文件列表缺失: ${invalidFileFields.length ? invalidFileFields.join(', ') : '无'}
- 当前表单状态: ${formDataStatus.value}
- 编辑模式: ${isEditMode.value ? '是' : '否'}
- 报名ID: ${registrationId.value || '无'}
`;
};

// 修改fetchRegistrationFormInfo函数，处理不同响应格式
const fetchRegistrationFormInfo = async (competitionId: string | string[] | number) => {
  // 确保competitionId是简单的字符串或数字
  const id = Array.isArray(competitionId) ? competitionId[0] : competitionId;
  
  try {
    loading.value = true;
    error.value = '';
    
    // 重置状态，确保页面不会因旧数据而显示
    formFields.value = [];
    competition.value = null;
    formDataStatus.value = 'none';
    
    console.log('开始获取报名表信息，竞赛ID:', id);
    
    // 使用Promise.allSettled确保所有请求都能执行，不管其中某一个是否失败
    const [competitionResult, fieldsResult, formDataResult] = await Promise.allSettled([
      // 1. 获取比赛基本信息
      (async () => {
        console.log('1. 获取比赛基本信息');
        try {
          // 尝试多种可能的路径格式
          const possiblePaths = [
            `/competitions/${id}`,
            `/api/competitions/${id}`
          ];
          
          let competitionResponse = null;
          let errorMessages = [];
          
          // 依次尝试每个路径
          for (const path of possiblePaths) {
            try {
              console.log(`尝试路径: ${path}`);
              competitionResponse = await request.get(path);
              console.log(`获取比赛信息成功(${path}):`, competitionResponse);
              break; // 如果成功，跳出循环
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              errorMessages.push(`路径 ${path} 失败: ${message}`);
              console.warn(`路径 ${path} 失败:`, e);
              // 继续尝试下一个路径
            }
          }
          
          if (!competitionResponse) {
            throw new Error(`所有API路径尝试失败: ${errorMessages.join('; ')}`);
          }
          
          // 保存原始响应
          rawApiResponses.value.competition = competitionResponse;
          
          // 更改判断逻辑，更宽松地处理返回数据
          if (!competitionResponse?.data) {
            console.warn('比赛信息响应没有data字段:', competitionResponse);
            // 尝试直接使用响应本身
            competition.value = competitionResponse || { id, title: '未知比赛' };
        } else {
            competition.value = competitionResponse.data;
          }
          
          console.log('最终使用的比赛信息:', competition.value);
          return competitionResponse;
        } catch (err) {
          console.error('获取比赛信息失败:', err);
          throw new Error(`获取比赛信息失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      })(),
      
      // 2. 获取比赛表单字段
      (async () => {
        console.log('2. 获取比赛表单字段');
        try {
          // 尝试多种可能的路径格式
          const possiblePaths = [
            `/forms/competitions/${id}/fields`,
            `/forms/competitions/${id}/fields`
          ];
          
          let fieldsResponse = null;
          let errorMessages = [];
          
          // 依次尝试每个路径
          for (const path of possiblePaths) {
            try {
              console.log(`尝试路径: ${path}`);
              fieldsResponse = await request.get(path);
              console.log(`获取表单字段成功(${path}):`, fieldsResponse);
              
              // 如果得到了响应，不管内容如何，先跳出循环
        if (fieldsResponse) {
                break;
              }
            } catch (e) {
              const message = e instanceof Error ? e.message : String(e);
              errorMessages.push(`路径 ${path} 失败: ${message}`);
              console.warn(`路径 ${path} 失败:`, e);
              // 继续尝试下一个路径
            }
          }
          
          if (!fieldsResponse) {
            throw new Error(`所有API路径尝试失败: ${errorMessages.join('; ')}`);
          }
          
          // 保存原始响应
          rawApiResponses.value.fields = fieldsResponse;
          
          // 更宽松地处理返回数据
          let fieldData = null;
          
          if (!fieldsResponse.data) {
            console.warn('字段响应没有data字段，尝试使用整个响应:', fieldsResponse);
            // 如果响应不是数组，尝试其他属性
            if (fieldsResponse.body && Array.isArray(fieldsResponse.body)) {
              fieldData = fieldsResponse.body;
            } else if (fieldsResponse.result && Array.isArray(fieldsResponse.result)) {
              fieldData = fieldsResponse.result;
            } else if (Array.isArray(fieldsResponse)) {
              fieldData = fieldsResponse;
            } else {
              // 创建一些默认字段用于测试
              console.warn('无法从响应中提取字段数据，使用默认测试字段');
              fieldData = [
                {
                  id: 101,
                  field_name: "test_field",
                  field_label: "测试字段",
                  field_type: "text",
                  is_required: 1
                }
              ];
            }
        } else {
            fieldData = fieldsResponse.data;
          }
          
          // 确保数据是数组
          if (!Array.isArray(fieldData)) {
            console.warn('字段数据不是数组:', fieldData);
            fieldData = [fieldData]; // 将单个对象包装为数组
          }
          
          // 设置字段数据
          formFields.value = processFieldData(fieldData);
          console.log('最终使用的表单字段:', formFields.value);
          
          // 这部分代码可以移除，因为已经在 processFieldData 中处理了
          // formFields.value.forEach(field => {
          //   if (field.field_type === 'file' || field.field_type === 'image') {
          //     fileList.value[field.id] = [];
          //   }
          // });
          
          return fieldsResponse;
        } catch (err) {
          console.error('获取表单字段失败:', err);
          throw new Error(`获取表单字段失败: ${err instanceof Error ? err.message : String(err)}`);
        }
      })(),
      
      // 3. 获取已提交的表单数据
      (async () => {
        console.log('3. 获取已提交的表单数据');
        try {
          // 尝试多种可能的路径格式
          const possiblePaths = [
            `/forms/competitions/${id}/form-data`,
            `/api/forms/competitions/${id}/form-data`
          ];
          
          let formDataResponse = null;
          let errorMessages = [];
          
          // 依次尝试每个路径
          for (const path of possiblePaths) {
            try {
              console.log(`尝试路径: ${path}`);
              formDataResponse = await request.post(path, {});
              console.log(`表单数据API响应成功(${path}):`, formDataResponse);
              break; // 如果成功，跳出循环
            } catch (e) {
              // 特殊处理404错误 - 这表示没有提交过数据，属于正常情况
              if (e.response && e.response.status === 404) {
                console.log(`${path}: 首次访问表单，没有历史提交数据，这是正常现象`);
                return { status: 'no_data', error: null, path };
              }
              
              const message = e instanceof Error ? e.message : String(e);
              errorMessages.push(`路径 ${path} 失败: ${message}`);
              console.warn(`路径 ${path} 失败:`, e);
              // 继续尝试下一个路径
            }
          }
          
          if (!formDataResponse) {
            return { status: 'error', error: new Error(`所有API路径尝试失败: ${errorMessages.join('; ')}`), paths: possiblePaths };
          }
          
          // 保存原始响应
          rawApiResponses.value.formData = formDataResponse;
          
          // 多种API响应格式兼容处理
          if (formDataResponse?.data) {
            if (formDataResponse.data.success) {
              // 处理已提交的表单数据
              if (formDataResponse.data.submitted_data) {
                console.log('处理submitted_data格式的响应');
                // 处理文本字段
                if (formDataResponse.data.submitted_data.text_fields) {
                  Object.entries(formDataResponse.data.submitted_data.text_fields).forEach(([fieldId, fieldData]: [string, any]) => {
                    formData.value[`field_${fieldId}`] = fieldData.field_value;
                    console.log(`设置文本字段 ${fieldId}:`, fieldData.field_value);
                  });
                }
                
                // 处理文件字段 - 兼容数组和对象两种格式
                if (formDataResponse.data.submitted_data.file_fields) {
                  if (Array.isArray(formDataResponse.data.submitted_data.file_fields)) {
                    // 如果是数组格式
                    formDataResponse.data.submitted_data.file_fields.forEach((fieldData: any) => {
                      // 从field_name或id获取字段ID
                      const fieldId = fieldData.field_name || fieldData.id;
                      const fieldUrl = fieldData.file_url || fieldData.content || fieldData.file_path;
                      
                      if (fieldId && fieldUrl) {
                        fileList.value[Number(fieldId)] = [{
                          name: fieldData.original_filename || fieldData.field_label || '文件',
                          url: fieldUrl,
                          raw: null,
                          uid: Date.now().toString(),
                          size: fieldData.file_size || 0,
                          status: 'success'
                        }];
                        
                        formData.value[`field_${fieldId}`] = fieldUrl;
                        console.log(`设置文件字段 ${fieldId}:`, fieldUrl);
                      }
                    });
                  } else {
                    // 如果是对象格式
                    Object.entries(formDataResponse.data.submitted_data.file_fields).forEach(([fieldId, fieldData]: [string, any]) => {
                      const fieldUrl = fieldData.file_url || fieldData.content || fieldData.file_path;
                      
                      if (fieldUrl) {
                        fileList.value[Number(fieldId)] = [{
                          name: fieldData.original_filename || fieldData.field_label || '文件',
                          url: fieldUrl,
                          raw: null,
                          uid: Date.now().toString(),
                          size: fieldData.file_size || 0,
                          status: 'success'
                        }];
                        
                        formData.value[`field_${fieldId}`] = fieldUrl;
                        console.log(`设置文件字段 ${fieldId}:`, fieldUrl);
                      }
                    });
                  }
                }
                
                console.log('加载已提交的表单数据成功:', formData.value);
              } else if (formDataResponse.data.form_data) {
                // 处理form_data格式的响应
                console.log('处理form_data格式的响应');
                
                if (Array.isArray(formDataResponse.data.form_data)) {
                  formDataResponse.data.form_data.forEach(item => {
                    if (item.field_type === 'text' || item.field_type === 'radio') {
                      formData.value[`field_${item.field_id}`] = item.content;
                    } else if (item.field_type === 'image' || item.field_type === 'file') {
                      formData.value[`field_${item.field_id}`] = item.content;
                      fileList.value[item.field_id] = [{
                        name: item.original_filename || item.field_label || '文件',
                        url: item.content,
                        raw: null,
                        uid: Date.now().toString(),
                        size: item.file_size || 0,
                        status: 'success'
                      }];
                    }
                  });
                }
              }
            }
            
            // 检查处理后的数据
            debugFormData();
            return { status: 'success', response: formDataResponse };
          }
          
          return { status: 'error', error: new Error('表单数据响应格式不正确') };
        } catch (err) {
          console.warn('获取已提交表单数据失败:', err);
          return { status: 'error', error: err };
        }
      })()
    ]);
    
    // 检查结果
    console.log('所有API请求完成，结果:', {
      competitions: competitionResult.status,
      fields: fieldsResult.status,
      formData: formDataResult.status === 'fulfilled' ? 
                (formDataResult.value?.status || 'unknown') : 
                formDataResult.status
    });
    
    // 添加更详细的调试信息
    if (fieldsResult.status === 'fulfilled') {
      console.log('表单字段数量:', formFields.value.length);
      console.log('表单字段详情:', formFields.value);
    }
    
    // 至少比赛信息和表单字段是必须的
    if (competitionResult.status === 'rejected') {
      throw new Error('获取比赛信息失败');
    }
    
    if (fieldsResult.status === 'rejected') {
      throw new Error('获取表单字段失败');
    }
    
    // 在处理formData结果时更新UI状态
    if (formDataResult.status === 'rejected') {
      console.log('注意: 未找到已提交的表单数据，将显示空表单');
      formDataStatus.value = 'none';
    } else if (formDataResult.value?.status === 'no_data') {
      console.log('注意: 这是首次填写表单，没有历史数据');
      formDataStatus.value = 'none';
    } else if (formDataResult.value?.status === 'error') {
      console.warn('警告: 获取表单数据时发生错误，但不影响继续填写表单');
      formDataStatus.value = 'error';
      formDataError.value = formDataResult.value.error instanceof Error 
        ? formDataResult.value.error.message 
        : '获取表单数据时发生未知错误';
    } else if (formDataResult.value?.status === 'success') {
      formDataStatus.value = 'exists';
    }
    
    // 缓存字段数据
    if (fieldsResult.status === 'fulfilled' && formFields.value.length > 0) {
      try {
        localStorage.setItem('cached_form_fields', JSON.stringify(formFields.value));
        console.log('已缓存表单字段数据');
      } catch (e) {
        console.error('缓存表单字段数据失败:', e);
      }
    }
    
    return true;
        } catch (err) {
    console.error('获取报名表信息出错:', err);
    error.value = err instanceof Error ? err.message : '获取报名表信息失败';
    ElMessage.error(error.value);
    return false;
  } finally {
    loading.value = false;
  }
};

// 添加获取单个字段数据的方法
const fetchFieldData = async (competitionId: string | number | string[], fieldId: number) => {
  try {
    // 确保competitionId是简单的字符串或数字
    const id = Array.isArray(competitionId) ? competitionId[0] : competitionId;
    console.log(`获取字段 ${fieldId} 的历史数据`);
    const response = await request.get(`/forms/competitions/${id}/fields/${fieldId}/data`);
    
    // 输出原始响应
    console.log(`字段 ${fieldId} 原始响应:`, JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.warn(`获取字段 ${fieldId} 数据失败:`, error);
    return null;
  }
}

// 添加获取所有字段历史数据的方法
const fetchAllFieldsData = async () => {
  if (!formFields.value || formFields.value.length === 0) {
    console.warn('没有表单字段可加载数据');
    return;
  }

  const competitionId = route.params.id;
  if (!competitionId) {
    console.error('无法获取竞赛ID');
    return;
  }

  console.log('开始获取所有字段的历史数据，竞赛ID:', competitionId);
  
  // 显示加载中
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在加载历史填写数据...',
    background: 'rgba(0, 0, 0, 0.7)',
  });

  try {
    // 为每个字段获取数据
    for (const field of formFields.value) {
      const fieldId = field.id;
      console.log(`======= 处理字段 ${fieldId} (${field.field_label}) =======`);
      
      const fieldData = await fetchFieldData(competitionId, fieldId);
      if (!fieldData) {
        console.log(`字段 ${fieldId} 未获取到数据`);
        continue;
      }
      
      console.log(`字段 ${fieldId} (${field.field_label}) 类型: ${field.field_type}`);
      console.log(`字段 ${fieldId} 返回数据:`, fieldData);
      
      // 根据字段类型处理不同的响应格式
      if (field.field_type === 'text') {
        // 文本字段 - 直接设置content值
        if (fieldData.content !== undefined) {
          formData.value[`field_${fieldId}`] = fieldData.content;
          console.log(`设置文本字段 ${fieldId}: "${fieldData.content}"`);
        }
      } else if (field.field_type === 'radio') {
        if (field.allow_multiple) {
          // 多选字段 - 优先使用selected_values数组
          try {
            console.log(`多选字段 ${fieldId} 原始数据:`, {
              content: fieldData.content,
              selectedValues: fieldData.selected_values
            });
            
            let selectedValues = fieldData.selected_values;
            // 如果没有直接提供selected_values，尝试解析content
            if (!selectedValues && fieldData.content) {
              console.log(`多选字段 ${fieldId} 解析content:`, fieldData.content);
              
              try {
                if (typeof fieldData.content === 'string') {
                  console.log(`尝试解析JSON字符串: ${fieldData.content}`);
                  selectedValues = JSON.parse(fieldData.content);
                  console.log(`解析结果:`, selectedValues);
                } else {
                  console.log(`使用非字符串content:`, fieldData.content);
                  selectedValues = fieldData.content;
                }
              } catch (e) {
                console.error(`解析多选内容失败: ${fieldData.content}`, e);
                // 如果解析失败且content是字符串，作为单个值处理
                if (typeof fieldData.content === 'string') {
                  console.log(`将字符串作为单个值处理: ${fieldData.content}`);
                  selectedValues = [fieldData.content];
                }
              }
            }
            
            if (Array.isArray(selectedValues)) {
              // 设置多选值
              multiSelectValues[fieldId] = selectedValues;
              formData.value[`field_${fieldId}`] = selectedValues;
              
              // 检查是否有"other"选项
              if (selectedValues.includes('other') && fieldData.other_text) {
                otherOptions[fieldId] = { selected: true, text: fieldData.other_text };
                console.log(`设置"其他"选项: ${fieldData.other_text}`);
              }
              
              console.log(`最终多选字段 ${fieldId} 设置值:`, selectedValues);
              
              // 输出当前字段的选项信息，方便调试
              const options = getRadioOptions(field);
              console.log(`多选字段 ${fieldId} 有效选项:`, options);
            } else {
              console.warn(`多选字段 ${fieldId} 返回的数据不是数组:`, selectedValues);
            }
          } catch (e) {
            console.error(`处理多选字段 ${fieldId} 内容失败:`, e);
          }
        } else {
          // 单选字段 - 优先使用selected_value
          console.log(`单选字段 ${fieldId} 原始数据:`, {
            content: fieldData.content,
            selectedValue: fieldData.selected_value
          });
          
          const selectedValue = fieldData.selected_value || fieldData.content;
          
          if (selectedValue === 'other' && fieldData.other_text) {
            // 选中"其他"并设置文本
            formData.value[`field_${fieldId}`] = 'other';
            otherOptions[fieldId] = { selected: true, text: fieldData.other_text };
            console.log(`设置单选字段 ${fieldId} 为"其他": ${fieldData.other_text}`);
          } else if (selectedValue !== undefined) {
            formData.value[`field_${fieldId}`] = selectedValue;
            console.log(`设置单选字段 ${fieldId} 值: "${selectedValue}"`);
          }
          
          // 输出当前字段的选项信息，方便调试
          const options = getRadioOptions(field);
          console.log(`单选字段 ${fieldId} 有效选项:`, options);
        }
      } else if (field.field_type === 'date') {
        // 日期字段
        if (fieldData.content !== undefined) {
          formData.value[`field_${fieldId}`] = fieldData.content;
          console.log(`设置日期字段 ${fieldId}: "${fieldData.content}"`);
        }
      } else if (field.field_type === 'file' || field.field_type === 'image') {
        // 文件字段
        console.log(`文件字段 ${fieldId} 原始数据:`, {
          content: fieldData.content,
          url: fieldData.url
        });
        
        const fileUrl = fieldData.url || fieldData.content;
        if (fileUrl) {
          formData.value[`field_${fieldId}`] = fileUrl;
          
          // 添加到文件列表
          if (!fileList.value[fieldId]) {
            fileList.value[fieldId] = [];
          }
          
          fileList.value[fieldId] = [{
            name: fieldData.field_label || fieldData.field_name || '文件',
            url: fileUrl,
            raw: null,
            uid: Date.now().toString(),
            size: 0,
            status: 'success'
          }];
          
          console.log(`设置文件字段 ${fieldId} URL: "${fileUrl}"`);
        }
      }
      
      console.log(`======= 字段 ${fieldId} 处理完成 =======\n`);
    }
    
    // 多选字段处理完毕后，确保UI正确显示
    nextTick(() => {
      formFields.value.forEach(field => {
        if (field.field_type === 'radio' && field.allow_multiple) {
          const fieldId = field.id;
          if (multiSelectValues[fieldId] && multiSelectValues[fieldId].length > 0) {
            console.log(`确保多选字段 ${fieldId} UI更新:`, multiSelectValues[fieldId]);
          }
        }
      });
    });
    
    ElMessage.success('已加载历史填写数据');
  } catch (error) {
    console.error('获取历史数据失败:', error);
    ElMessage.error('获取历史数据失败: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    loadingInstance.close();
  }
}

// 修改fetchFormFields函数，在获取到表单字段后自动获取历史数据
const fetchFormFields = async () => {
  const competitionId = route.params.id;
  if (!competitionId) {
    error.value = '比赛ID不能为空';
    ElMessage.error(error.value);
    return;
  }
    
  const success = await fetchRegistrationFormInfo(competitionId);
  
  // 如果获取表单字段成功，尝试获取历史数据（无论是否为编辑模式）
  if (success && formFields.value.length > 0) {
    // 等待下一个渲染周期，确保表单字段已渲染
    await nextTick();
    
    // 获取历史填写数据
    await fetchAllFieldsData();
  }
};

// 在组件挂载时获取表单字段
onMounted(async () => {
  console.log('组件挂载，开始初始化');
  console.log('路由参数:', route.params);
  console.log('编辑模式:', isEditMode.value, '报名ID:', registrationId.value);
  
  try {
    // 添加全局错误处理，防止白屏
    window.addEventListener('error', (event) => {
      console.error('全局错误捕获:', event.error);
      debugInfo.value = `页面发生错误: ${event.message}\n\n堆栈: ${event.error?.stack}`;
    });
    
    // 初始化调试信息 - 这确保即使页面出错也能看到一些信息
    debugInfo.value = '页面正在加载中...';
    
    // 先获取表单字段定义
    await fetchFormFields();
    
    // 如果是编辑模式且有报名ID，加载已有数据
    if (isEditMode.value && registrationId.value) {
      console.log('编辑模式，开始加载已提交的报名数据');
      // 使用增强的数据加载函数
      await checkEditModeRequests();
    }
    
    console.log('初始化后状态:', {
      competition: competition.value, 
      fieldsCount: formFields.value.length, 
      loading: loading.value, 
      error: error.value,
      formDataStatus: formDataStatus.value,
      isEditMode: isEditMode.value,
      registrationId: registrationId.value
    });
    
    // 输出调试信息
    debugFormState();
    console.log('表单是否应该显示:', !loading.value && !error.value && formFields.value.length > 0);
    console.log('信息卡片是否应该显示:', !formFields.value.length && !loading.value && !error.value);
    
    // 尝试加载本地保存的表单数据
    await loadFormFromLocal()
    
    // 启动自动保存
    startAutoSave()
    
  } catch (e) {
    console.error('组件初始化过程中出错:', e);
    error.value = '加载过程中出错: ' + (e instanceof Error ? e.message : String(e));
    debugInfo.value = `初始化错误: ${error.value}\n\n详细信息: ${e instanceof Error ? e.stack : '未知错误'}`;
  }
});

// 在组件卸载时清理
onUnmounted(() => {
  stopAutoSave()
})

// 在页面关闭或刷新前提示保存
onBeforeUnmount(() => {
  if (hasUnsavedChanges.value) {
    saveFormToLocal()
  }
})

// 添加页面刷新或关闭提示
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
})

// 修改loadRegistrationData函数来处理新的数据格式
const loadRegistrationData = async () => {
  loading.value = true
  try {
    console.log('开始加载报名数据...')
    const competitionId = route.params.id
    const regId = registrationId.value
    
    if (!competitionId || !regId) {
      throw new Error('竞赛ID或报名ID不能为空')
    }
    
    console.log('加载报名数据，竞赛ID:', competitionId, '报名ID:', regId)
    
    const response = await request.get(`/forms/registrations/${regId}/enhanced-data`)
    console.log('获取到的报名数据:', response)

    // 检查响应是否存在
    if (!response?.data) {
      throw new Error('获取报名数据失败：响应为空')
    }

    // 解构顶层数据
    const { success, registration, form_data } = response.data
    
    console.log('响应数据结构:', {
      success,
      hasRegistration: !!registration,
      formDataCount: form_data?.length
    })

    // 处理表单数据
    if (Array.isArray(form_data)) {
      form_data.forEach(field => {
        const fieldId = field.field_id
        
        if (field.type === 'text' || field.type === 'radio') {
          formData.value[`field_${fieldId}`] = field.content
          console.log(`设置${field.type}字段 ${fieldId}:`, field.content)
        } else if (field.type === 'image' || field.type === 'file') {
          formData.value[`field_${fieldId}`] = field.content

          const fileListItem = {
            name: field.field_name || '文件',
            url: field.url,
            raw: null,
            uid: Date.now().toString(),
            size: 0,
            status: 'success'
          }

          if (!fileList.value[fieldId]) {
            fileList.value[fieldId] = []
          }

          fileList.value[fieldId] = [fileListItem]
          console.log(`设置${field.type}字段 ${fieldId}:`, fileListItem)
        }
      })

      formDataStatus.value = 'exists'
      console.log('数据加载完成')
    } else {
      console.warn('form_data 不是数组:', form_data)
      formDataStatus.value = 'none'
    }
    
  } catch (error) {
    console.error('加载报名数据失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`加载报名数据失败：${errorMessage}`)
    formDataStatus.value = 'error'
    formDataError.value = errorMessage
  } finally {
    loading.value = false
  }
}

// 处理文件上传 - 实现API文档要求的处理方式
const handleFileChange = async (file: any, field: FormField) => {
  if (file && file.raw) {
    console.log(`文件上传变更: ID=${field.id}, 类型=${field.field_type}, 文件名=${file.name}`);
    
    // 检查总文件大小限制
    let totalSize = 0;
    for (const fieldId in fileList.value) {
      fileList.value[fieldId].forEach(f => {
        totalSize += f.size || 0;
      });
    }
    totalSize += file.size;
    
    if (totalSize > TOTAL_SIZE_LIMIT) {
      ElMessage.error('所有文件总大小不能超过200MB');
      return false;
    }

    // 如果是图片类型，直接转换为base64
    if (field.field_type === 'image') {
      if (file.size > IMAGE_MAX_SIZE) {
        ElMessage.error(`图片大小不能超过${IMAGE_MAX_SIZE / 1024 / 1024}MB`);
        return false;
      }
      
      // 验证图片格式
      const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
      if (!allowedImageTypes.includes(file.raw.type)) {
        ElMessage.error('请上传JPG、PNG、GIF、BMP或WEBP格式的图片');
        return false;
      }
      
      console.log(`处理图片文件：${file.name}`);
      try {
        const base64Image = await convertFileToBase64(file.raw);
        const newFile: FileItem = {
          name: file.name,
          raw: file.raw,
          size: file.size,
          uid: typeof file.uid === 'number' ? file.uid : Date.now().toString(),
          status: 'success',
          url: base64Image
        };
        
        // 更新文件列表
        fileList.value[field.id] = [newFile];
        
        // 更新formData - 图片存储为对象格式
        formData.value[`field_${field.id}`] = {
          filename: file.name,
          content: base64Image
        };
        console.log(`图片转为base64成功: ID=${field.id}, 预览已启用`);
      } catch (err) {
        console.error('图片转换失败:', err);
        ElMessage.error(`图片"${file.name}"转换失败`);
        return false;
      }
    } else if (field.field_type === 'file') {
      // 普通文件处理
      if (file.size > FILE_MAX_SIZE) {
        ElMessage.error(`文件大小不能超过${FILE_MAX_SIZE / 1024 / 1024}MB`);
        return false;
      }
      
      console.log(`处理普通文件：${file.name}`);
      const newFile: FileItem = {
        name: file.name,
        raw: file.raw,
        size: file.size,
        uid: typeof file.uid === 'number' ? file.uid : Date.now().toString(),
        status: 'ready', // 标记为准备状态，表示需要上传
        url: URL.createObjectURL(file.raw) // 为文件创建一个临时URL以便预览
      };
    
      // 更新文件列表
      fileList.value[field.id] = [newFile];
      
      // 普通文件在提交时上传，这里只记录文件元数据
      formData.value[`field_${field.id}`] = {
        filename: file.name
      };
      console.log(`文件已准备，将在提交时上传: ID=${field.id}`);
    }
    
    return true;
  }
  return false;
};

// 将文件转换为base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// 重置表单
const resetForm = () => {
  if (!formRef.value) return;
  
  // 确认是否重置
  ElMessageBox.confirm('确定要重置表单吗？所有已填写的内容将被清空。', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 重置表单
    formRef.value?.resetFields();
    
    // 清空文件列表
    for (const fieldId in fileList.value) {
      fileList.value[fieldId] = [];
    }
    
    ElMessage.success('表单已重置');
  }).catch(() => {
    // 取消重置
  });
};

// 添加用户认证状态检查
const checkUserLoginStatus = () => {
  const token = userStore.token;
  if (!token) {
    console.error('用户未登录，请先登录');
    ElMessage.error('请先登录后再操作');
    // 可以添加重定向到登录页面的逻辑
    return false;
  }
  return true;
}

// 修改立即提交按钮的处理函数
const handleStartSubmit = async () => {
  const competitionId = route.params.id;
  if (!competitionId) {
    ElMessage.error('比赛ID不能为空');
    return;
  }
  
  // 检查登录状态
  if (!checkUserLoginStatus()) {
    return;
  }
  
  // 显示加载中
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '加载报名表信息...',
    background: 'rgba(0, 0, 0, 0.7)',
  });
  
  try {
    // 获取报名表信息
    const success = await fetchRegistrationFormInfo(competitionId);
    if (success) {
      ElMessage.success('报名表信息加载成功，请填写并提交');
      // 这里可以添加滚动到表单位置的逻辑
      nextTick(() => {
        // 找到表单元素，滚动到可见位置
        const formElement = document.querySelector('.registration-form');
        if (formElement) {
          formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  } catch (err) {
    console.error('加载报名表信息失败:', err);
    ElMessage.error(`加载报名表信息失败: ${err instanceof Error ? err.message : '请稍后重试'}`);
  } finally {
    // 关闭加载中
      loadingInstance.close();
    }
};

// 添加回缺失的变量定义
const isEditMode = computed(() => route.query.mode === 'edit')
const registrationId = computed(() => {
  const id = route.query.registrationId;
  return id ? Number(id) : 0;
})

// 添加查看原始数据的函数
const showRawData = () => {
  const rawData = {
    competition: rawApiResponses.value.competition,
    fields: rawApiResponses.value.fields,
    formData: rawApiResponses.value.formData
  };
  
  // 检查是否有任何API响应
  if (!rawData.competition && !rawData.fields && !rawData.formData) {
    debugInfo.value = "没有找到任何API响应数据，请先点击「重新加载」按钮获取数据。";
    ElMessage.warning('没有API响应数据可显示');
      return;
    }
  
  // 美化显示
  debugInfo.value = JSON.stringify(rawData, (key, value) => {
    // 过滤掉一些太大的属性
    if (key === 'headers' || key === 'config' || key === 'request') {
      return '[过大内容已省略]';
    }
    return value;
  }, 2);
  
  console.log('原始API响应:', rawData);
}

// 辅助函数，安全地解析选项字符串为数组
interface RadioOption {
  value: string;
  label: string;
  default?: boolean;
  [key: string]: any;
}

function parseOptions(options: any): Array<RadioOption> {
  if (!options) return [];
  
  // 如果已经是数组，直接返回
  if (Array.isArray(options)) return options;
  
  // 如果是字符串，尝试解析为JSON
  if (typeof options === 'string') {
    try {
      // 尝试解析为JSON
      const parsed = JSON.parse(options);
      if (Array.isArray(parsed)) {
        console.log('成功解析选项字符串为数组:', parsed);
        return parsed;
      } else if (typeof parsed === 'object') {
        // 如果是对象而不是数组，尝试提取对象的属性转为选项
        console.log('解析选项为对象:', parsed);
        const result = [];
        for (const key in parsed) {
          if (Object.prototype.hasOwnProperty.call(parsed, key)) {
            result.push({
              value: key,
              label: parsed[key],
            });
          }
        }
        if (result.length > 0) {
          console.log('从对象转换为选项数组:', result);
          return result;
        }
      }
    } catch (e) {
      console.error('解析选项字符串失败:', e);
      console.log('无法解析的选项字符串:', options);
      
      // 尝试其他格式解析，比如逗号分隔的格式
      if (options.includes(',')) {
        const items = options.split(',').map(item => item.trim());
        const result = items.map(item => ({
          value: item,
          label: item
        }));
        console.log('尝试按逗号分隔解析选项:', result);
        return result;
      }
    }
  } else if (typeof options === 'object' && options !== null) {
    // 可能是选项对象
    console.log('处理选项对象:', options);
    const result = [];
    // 尝试处理 {value1: 'label1', value2: 'label2'} 格式
    for (const key in options) {
      if (key !== 'accepted_formats' && Object.prototype.hasOwnProperty.call(options, key)) {
        result.push({
          value: key,
          label: options[key],
        });
      }
    }
    if (result.length > 0) {
      console.log('从对象提取选项:', result);
      return result;
    }
  }
  
  console.warn('无法解析的选项格式:', options);
  return [];
}

// 修改在模板中使用前先记录单选字段选项
const getRadioOptions = (field) => {
  const options = parseOptions(field.options);
  console.log(`字段 ${field.id} (${field.field_label}) 选项:`, options);
  return options;
}

// 上传单个文件到服务器并获取文件路径
const uploadFileToServer = async (file: File, fieldType: string): Promise<string | null> => {
  console.log(`开始上传文件: ${file.name}, 类型: ${fieldType}`);
  
  try {
    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);
    formData.append('field_type', 'file'); // 添加必需的field_type参数
    
    // 使用API文档中的文件上传接口
    const response = await request.post('/forms/upload-file', formData, {
            headers: {
        'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${userStore.token}`
            }
    });
    
    // 检查响应
    if (response?.data?.file_path) {
      console.log('文件上传成功，路径:', response.data.file_path);
      return response.data.file_path;
      } else {
      console.error('文件上传失败：未返回file_path');
      throw new Error('文件上传失败：未返回file_path');
      }
  } catch (error) {
    console.error('文件上传失败:', error);
    throw error;
  }
};

// 添加提交状态变量
const submitting = ref(false)
const competitionId = computed(() => route.params.id)

// 添加全屏加载相关变量
const fullscreenLoading = ref(false)
const loadingInstance = ref<ReturnType<typeof ElLoading.service> | null>(null)
const loadingText = ref('正在准备提交报名信息...')

// 更新加载文本的函数
const updateLoadingText = (text: string) => {
  loadingText.value = text
  if (loadingInstance.value) {
    loadingInstance.value.setText(text)
  }
}

// 提交表单数据
const submitForm = async () => {
  if (!formRef.value) return
 
  try {
    // 表单验证
    await formRef.value.validate()
  
    submitting.value = true
    updateLoadingText('正在提交报名信息...')
    
    // 显示全屏加载
    fullscreenLoading.value = true
    loadingInstance.value = ElLoading.service({
      lock: true,
      text: loadingText.value,
      background: 'rgba(0, 0, 0, 0.7)'
    })
    
    // 步骤1: 创建报名记录
    console.log('======== 步骤1: 创建报名记录 ========');
    updateLoadingText('正在创建报名记录...')
    const registrationResponse = await request.post(`/competitions/${competitionId.value}/register`, {
      team_name: formData.value.team_name,
      contact_phone: formData.value.contact_phone,
      additional_info: formData.value.additional_info || ''
    });

    console.log('创建报名记录响应:');
    logResponseDetails(registrationResponse?.status, registrationResponse?.data);
    
    // 兼容不同的API响应结构
    let registrationId = null;
    if (registrationResponse?.data?.registration_id) {
      // 优先使用registration_id字段
      registrationId = registrationResponse.data.registration_id;
    } else if (registrationResponse?.data?.id) {
      // 如果没有registration_id则使用id字段
      registrationId = registrationResponse.data.id;
    } else if (registrationResponse?.data?.data?.id) {
      // 检查嵌套的data结构
      registrationId = registrationResponse.data.data.id;
    }
    
    if (!registrationId) {
      throw new Error('创建报名记录失败：无法获取报名ID');
    }

    console.log('创建报名记录成功，ID:', registrationId);

    // 步骤2: 准备表单数据
    console.log('======== 步骤2: 准备表单数据 ========');
    updateLoadingText('正在处理表单数据...')
    const formItems = [];
    // 记录文件上传失败的字段
    const failedFileUploads = [];

    // 处理所有字段
    for (const field of formFields.value) {
      const fieldId = field.id;
      const fieldValue = formData.value[`field_${fieldId}`];
      
      if (field.field_type === 'image') {
        // 图片字段 - 直接使用base64
        if (fieldValue?.content) {
          formItems.push({
            field_id: fieldId,
            field_type: 'image',
            content: fieldValue.content
          });
          console.log(`添加图片字段: ID=${fieldId}`);
        } else if (field.is_required) {
          throw new Error(`图片字段"${field.field_label}"为必填项`);
        }
      } else if (field.field_type === 'file') {
        // 文件字段 - 需要先上传获取路径
        const fileItem = fileList.value[fieldId]?.[0];
        console.log(`处理文件字段: ID=${fieldId}, 状态:`, fileItem ? fileItem.status : '无文件');
        
        if (fileItem?.raw && fileItem.status === 'ready') {
          console.log(`上传文件: ${fileItem.name}`);
          try {
            updateLoadingText(`正在上传文件: ${fileItem.name}...`)
            const filePath = await uploadFileToServer(fileItem.raw, 'file');
            if (filePath) {
          formItems.push({
            field_id: fieldId,
            field_type: 'file',
                content: filePath  // 直接使用返回的file_path
              });
              console.log(`成功添加文件字段: ID=${fieldId}, 路径=${filePath}`);
            } else {
              if (field.is_required) {
                throw new Error(`必填文件"${field.field_label}"上传失败，请重试`);
              }
            }
          } catch (error) {
            if (field.is_required) {
              throw new Error(`必填文件"${field.field_label}"上传失败: ${error instanceof Error ? error.message : '未知错误'}`);
            }
          }
        } else if (field.is_required && !fileItem) {
          throw new Error(`文件字段"${field.field_label}"为必填项`);
      }
      } else {
        // 文本、单选或日期字段
        if (fieldValue) {
          // 处理单选字段的"other"选项
          let contentValue = fieldValue;
          
          if (field.field_type === 'radio') {
            // 处理多选模式下的"other"选项
            if (field.allow_multiple && Array.isArray(contentValue)) {
              contentValue = [...contentValue]; // 创建副本避免修改原始数据
              
              // 将数组中的"other"替换为用户输入的文本
              const otherIndex = contentValue.indexOf('other');
              if (otherIndex >= 0 && otherOptions[fieldId] && otherOptions[fieldId].text) {
                contentValue[otherIndex] = otherOptions[fieldId].text;
              }
            }
            // 处理单选模式下的"other"选项 
            else if (contentValue === 'other' && otherOptions[fieldId] && otherOptions[fieldId].text) {
              contentValue = otherOptions[fieldId].text;
            }
          }
          
          formItems.push({
            field_id: fieldId,
            field_type: field.field_type,
            content: contentValue
          });
          console.log(`添加${field.field_type}字段: ID=${fieldId}`);
        } else if (field.is_required) {
          throw new Error(`字段"${field.field_label}"为必填项`);
        }
      }
    }

    // 检查是否有文件上传失败但非必填
    if (failedFileUploads.length > 0) {
      const failedFiles = failedFileUploads.map(f => f.fieldLabel || `字段ID=${f.fieldId}`).join(', ');
      console.warn(`有${failedFileUploads.length}个非必填文件上传失败: ${failedFiles}`);
      ElMessage.warning(`以下非必填文件上传失败，表单将继续提交：${failedFiles}`);
    }

    // 步骤3: 提交表单数据
    console.log('======== 步骤3: 提交表单数据 ========');
    updateLoadingText('正在提交表单数据，可能需要较长时间，请勿关闭页面...')
    console.log('提交数据:', { items: formItems });

    // 使用axios直接调用，设置较长的超时时间
    const submitResponse = await request.post(`/forms/registrations/${registrationId}/enhanced-data`, 
      { items: formItems },
      { timeout: 120000 } // 设置2分钟超时
    );

    console.log('表单提交响应:');
    logResponseDetails(submitResponse?.status, submitResponse?.data);

    // 检查响应状态 - 兼容不同的API响应结构
    const isSuccess = 
      submitResponse?.data?.success || 
      (submitResponse?.status === 200 && !submitResponse?.data?.error);

    if (!isSuccess) {
      const errorMsg = submitResponse?.data?.message || 
                       submitResponse?.data?.error || 
                       '提交表单失败，请检查网络连接';
      throw new Error(errorMsg);
    }

    console.log('提交成功:', submitResponse.data);
    updateLoadingText('提交成功！正在跳转...')

    // 显示成功消息
    ElMessage.success('表单提交成功！');
    debugInfo.value = '表单提交成功！';
    
    // 清空表单数据
    resetFormData();
    
    // 清除本地保存的表单数据
    clearLocalFormData()
    
    // 关闭全屏加载
    fullscreenLoading.value = false
    loadingInstance.value?.close()
    
    // 跳转到成功页面
    router.push({
      path: '/registration-success',
      query: { registrationId: String(registrationId) }
    });
    
    return true;
  } catch (error) {
    console.error('提交表单时出错:', error);
    
    // 更新加载提示为错误信息
    if (fullscreenLoading.value) {
      updateLoadingText('提交失败，请查看错误信息')
      // 显示错误信息后延迟关闭加载动画
      setTimeout(() => {
        loadingInstance.value?.close()
        fullscreenLoading.value = false
      }, 1500)
    }
    
    ElMessage.error(error instanceof Error ? error.message : '提交表单失败，请重试');
    debugInfo.value = `提交失败: ${error instanceof Error ? error.message : '未知错误'}\n\n堆栈: ${error instanceof Error ? error.stack : '无堆栈信息'}`;
    return false;
  } finally {
    submitting.value = false;
    // 注意：成功时在跳转前已关闭；
    // 错误时通过setTimeout延迟关闭，因此这里不需要再关闭
  }
};

// 重置表单数据（重命名以避免冲突）
const resetFormData = () => {
  // 清空文本、单选和日期字段
  for (const field of formFields.value) {
    if (field.field_type === 'text' || field.field_type === 'radio' || field.field_type === 'date') {
      formData.value[`field_${field.id}`] = '';
    }
  }
  
  // 清空文件列表
  fileList.value = {};
  
  // 清空其他状态
  submitting.value = false;
};

// 添加处理图片预览的函数
const handlePreview = async (file: any) => {
  console.log('预览文件:', file);
  
  if (file.url) {
    if (file.url.startsWith('data:')) {
      // base64图片直接预览
      window.open(file.url);
  } else {
      // 使用API获取文件
      try {
        const response = await request.get(`/files/by-path?path=${file.url}`);
        const url = URL.createObjectURL(new Blob([response.data]));
        window.open(url);
      } catch (err) {
        console.error('文件预览失败:', err);
        ElMessage.error('文件预览失败');
      }
    }
  } else if (file.raw) {
    // 如果没有URL但有原始文件，创建一个临时的blob URL
    const url = URL.createObjectURL(file.raw);
    window.open(url);
    } else {
    ElMessage.warning('无法预览此文件');
  }
};

// 处理图片删除
const handleRemove = (file: any, field: FormField) => {
  console.log(`删除图片: ID=${field.id}, 文件名=${file.name}`);
  // 清空文件列表
  fileList.value[field.id] = [];
  // 清空表单数据
  formData.value[`field_${field.id}`] = '';
  return true;
};

// 调试图片预览状态
const debugImageFiles = () => {
  const imageFields = formFields.value.filter(field => field.field_type === 'image');
  console.log(`找到 ${imageFields.length} 个图片字段`);
  
  if (imageFields.length === 0) {
    debugInfo.value = "没有找到图片字段";
    ElMessage.warning('没有图片字段');
      return;
    }
    
  const imageDebugInfo = [];
  
  imageFields.forEach(field => {
    console.log(`图片字段 ID=${field.id}, 名称="${field.field_label}":`);
    
    const files = fileList.value[field.id] || [];
    console.log(`  文件数量: ${files.length}`);
    
    files.forEach((file, index) => {
      console.log(`  文件 ${index+1}:`);
      console.log(`    名称: ${file.name}`);
      console.log(`    状态: ${file.status}`);
      console.log(`    URL: ${file.url ? '已设置' : '未设置'}`);
      console.log(`    原始文件: ${file.raw ? '可用' : '不可用'}`);
    });
    
    imageDebugInfo.push({
      id: field.id,
      label: field.field_label,
      files: files.map(f => ({
        name: f.name,
        status: f.status,
        hasUrl: !!f.url,
        hasRaw: !!f.raw,
        size: f.size
      })),
      formDataValue: formData.value[`field_${field.id}`] ? 
        (formData.value[`field_${field.id}`].substring(0, 50) + '...') : 
        '空值'
    });
  });
  
  debugInfo.value = JSON.stringify(imageDebugInfo, null, 2);
  ElMessage.success('图片字段调试信息已显示');
};

// 将文件扩展名格式转换为MIME类型格式
const getAcceptMimeTypes = (options: any): string => {
  const acceptedFormats = getAcceptedFormats(options);
  if (!acceptedFormats || acceptedFormats.trim() === '') {
    return '*/*'; // 如果没有指定格式，接受所有类型
  }
  
  // 如果包含通配符，接受所有类型
  if (acceptedFormats.includes('.*') || acceptedFormats.includes('*')) {
    return '*/*';
  }
  
  // 映射常见的文件扩展名到MIME类型
  const mimeTypeMap = {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.txt': 'text/plain',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed'
  };
  
  // 分割接受的格式并转换为MIME类型
  const formatList = acceptedFormats.split(',').map(format => format.trim().toLowerCase());
  const mimeTypes = formatList.map(format => {
    // 确保格式以.开头
    const ext = format.startsWith('.') ? format : `.${format}`;
    return mimeTypeMap[ext] || `application/${format.replace('.', '')}`;
  });
  
  console.log(`文件接受格式 ${acceptedFormats} 转换为MIME类型: ${mimeTypes.join(',')}`);
  return mimeTypes.join(',');
};

// 在onMounted之前添加一个辅助函数
// 记录API响应详情的辅助函数
const logResponseDetails = (status, data) => {
  console.log('=== API响应详情 ===');
  console.log('状态码:', status);
  
  if (data) {
    console.log('响应数据结构:', Object.keys(data));
    
    if (data.data) {
      console.log('data字段结构:', Object.keys(data.data));
    }
    
    if (data.success !== undefined) {
      console.log('success字段:', data.success);
    }
    
    if (data.message) {
      console.log('message字段:', data.message);
    }
    
    if (data.error) {
      console.log('error字段:', data.error);
    }
      } else {
    console.log('响应没有数据');
  }
  console.log('===================');
};

// 辅助函数：检查编辑模式请求是否正确发送
const checkEditModeRequests = async () => {
  // 记录当前状态
  const currentState = {
    isInEditMode: isEditMode.value,
    hasRegistrationId: !!registrationId.value,
    registrationId: registrationId.value,
    urlParams: route.params,
    formDataStatus: formDataStatus.value,
    formFieldsCount: formFields.value.length
  }
  
  console.log('检查编辑模式状态:', currentState)
  
  // 如果不是编辑模式或没有报名ID，直接返回
  if (!isEditMode.value || !registrationId.value) {
    console.log('不需要加载报名数据:', {
      isEditMode: isEditMode.value,
      registrationId: registrationId.value
    })
    return
  }
  
  try {
    // 显示加载状态
    loading.value = true
    
    // 确保表单字段已加载
    if (formFields.value.length === 0) {
      console.log('表单字段未加载，先加载字段定义')
      await fetchFormFields()
      
      // 再次检查字段是否加载成功
      if (formFields.value.length === 0) {
        throw new Error('无法加载表单字段定义')
      }
    }
    
    // 加载已提交的数据
    console.log('开始加载已提交数据')
    await loadRegistrationData()
    
    // 检查数据加载结果
    const hasData = Object.keys(formData.value).some(key => 
      key.startsWith('field_') && formData.value[key] !== ''
    )
    
    if (!hasData) {
      console.warn('未检测到已提交的表单数据')
      ElMessage.warning('未找到已提交的表单数据，可能是首次填写')
      formDataStatus.value = 'none'
    } else {
      console.log('成功加载已提交数据')
      formDataStatus.value = 'exists'
    }
    
  } catch (error) {
    console.error('编辑模式数据加载失败:', error)
    const errorMessage = error instanceof Error ? error.message : '未知错误'
    ElMessage.error(`加载数据失败：${errorMessage}`)
    formDataStatus.value = 'error'
    formDataError.value = errorMessage
    
    // 记录错误详情到调试信息
    debugInfo.value = `编辑模式加载失败\n错误: ${errorMessage}\n状态: ${JSON.stringify(currentState, null, 2)}`
  } finally {
    loading.value = false
  }
}

// 添加监听器：当路由参数变化时检查编辑模式
watch(() => route.query, async (newQuery) => {
  console.log('路由参数变化:', newQuery);
  
  // 如果检测到编辑模式
  if (newQuery.mode === 'edit' && newQuery.registrationId) {
    console.log('检测到编辑模式，参数:', newQuery);
    await nextTick();
    checkEditModeRequests();
  }
}, { immediate: true, deep: true });

// 添加以下数据属性
const customOptions = reactive<Record<number, Array<{text: string, selected: boolean}>>>({})
const otherOptions = reactive<Record<number, {selected: boolean, text: string}>>({})
const newCustomOption = reactive<Record<number, string>>({})
const errors = reactive<Record<number, string>>({})
const _multipleSelectionResult = reactive<Record<number, any[]>>({})

// 获取字段选项
const getFieldOptions = (field: any) => {
  if (!field.options) return []
  
  if (typeof field.options === 'string') {
    try {
      return JSON.parse(field.options)
    } catch (e) {
      console.error('解析选项失败:', e)
      return []
    }
  }
  
  if (Array.isArray(field.options)) {
    return field.options
  }
  
  return []
}

// 添加自定义选项 - 修改
const addCustomOption = (fieldId: number) => {
  const text = newCustomOption[fieldId]?.trim()
  if (!text) return
  
  const field = formFields.value.find((f: any) => f.id === fieldId)
  
  // 检查是否已存在相同选项
  const existingOptions = getFieldOptions(field)
  const exists = existingOptions.some((opt: any) => opt.label === text || opt.value === text)
  const customExists = (customOptions[fieldId] || []).some(opt => opt.text === text)
  
  if (exists || customExists) {
    ElMessage.warning('该选项已存在')
    return
  }
  
  // 初始化自定义选项数组（如果不存在）
  if (!customOptions[fieldId]) {
    customOptions[fieldId] = []
  }
  
  // 添加自定义选项
  customOptions[fieldId].push({ text, selected: false })
  
  // 清空输入
  newCustomOption[fieldId] = ''
  
  // 更新表单数据
  if (field?.allow_multiple) {
    // 添加到多选数组
    if (!multiSelectValues[fieldId]) {
      multiSelectValues[fieldId] = []
    }
    multiSelectValues[fieldId].push(text)
    // 同步到表单数据
    formData[fieldId] = [...multiSelectValues[fieldId]]
  } else {
    // 单选模式自动选中新添加的选项
    formData[fieldId] = text
  }
}

// 更新多选数据数组
const updateMultipleSelectionArray = (fieldId: number) => {
  const field = formFields.value.find((f: any) => f.id === fieldId)
  if (!field || !field.allow_multiple) return
  
  // 初始化结果数组
  const resultArray: any[] = []
  
  // 添加选中的预设选项
  const fieldData = formData[fieldId] || {}
  if (typeof fieldData === 'object' && !Array.isArray(fieldData)) {
    Object.keys(fieldData).forEach(key => {
      if (fieldData[key]) {
        resultArray.push(key)
      }
    })
  } else if (Array.isArray(fieldData)) {
    fieldData.forEach(item => {
      resultArray.push(item)
    })
  }
  
  // 添加选中的自定义选项
  (customOptions[fieldId] || []).forEach(option => {
    if (option.selected) {
      resultArray.push(option.text)
    }
  })
  
  // 添加"其他"选项
  if (field.other_option && otherOptions[fieldId]?.selected) {
    // 直接添加用户输入的文本，而不是other值
    if (otherOptions[fieldId].text) {
      resultArray.push(otherOptions[fieldId].text)
    }
  }
  
  // 存储结果
  _multipleSelectionResult[fieldId] = resultArray
}

// 添加多选值存储
const multiSelectValues = reactive<Record<number, string[]>>({})

// 初始化多选框已选值
const initializeMultiSelectValues = () => {
  formFields.value.forEach(field => {
    if (field.allow_multiple && formData.value[`field_${field.id}`]) {
      // 将表单数据中的值同步到multiSelectValues
      multiSelectValues[field.id] = formData.value[`field_${field.id}`] || []
      
      // 确保customOptions中包含所有已选项
      if (multiSelectValues[field.id].length > 0) {
        if (!customOptions[field.id]) {
          customOptions[field.id] = []
        }
        
        // 获取预设选项值
        const existingOptions = getRadioOptions(field).map(opt => opt.value)
        
        // 找出自定义的选项
        const customVals = multiSelectValues[field.id].filter(val => 
          val !== 'other' && !existingOptions.includes(val)
        )
        
        // 添加到自定义选项
        customVals.forEach(val => {
          if (!customOptions[field.id].some(opt => opt.text === val)) {
            customOptions[field.id].push({ text: val, selected: true })
          }
        })
      }
    }
  })
}

// 处理多选变化
const handleMultiSelectChange = (fieldId: number, values: string[]) => {
  // 更新多选值
  multiSelectValues[fieldId] = values || []
  
  // 将多选值同步到表单数据
  formData.value[`field_${fieldId}`] = values
  
  // 处理新创建的选项
  if (values) {
    // 获取当前已存在的选项值(包括预设选项和自定义选项)
    const field = formFields.value.find(f => f.id === fieldId)
    const existingOptions = [
      ...getRadioOptions(field).map(opt => opt.value),
      ...(customOptions[fieldId] || []).map(opt => opt.text)
    ]
    
    // 查找新添加的选项
    const newOptions = values.filter(val => 
      val !== 'other' && !existingOptions.includes(val)
    )
    
    // 将新选项添加到自定义选项列表
    if (newOptions.length > 0) {
      if (!customOptions[fieldId]) {
        customOptions[fieldId] = []
      }
      
      newOptions.forEach(newOpt => {
        if (!customOptions[fieldId].some(opt => opt.text === newOpt)) {
          customOptions[fieldId].push({ text: newOpt, selected: true })
        }
      })
    }
  }
  
  // 如果values中不包含other，清空其他选项
  if (!values.includes('other')) {
    otherOptions[fieldId] = { selected: false, text: '' }
  }
}

// 初始化表单控件数据 - 修改
const initFormControls = () => {
  formFields.value.forEach((field: any) => {
    const fieldId = field.id
    
    // 初始化多选/单选字段
    if (field.field_type === 'radio') {
      if (field.allow_multiple) {
        // 初始化多选值为空数组
        multiSelectValues[fieldId] = []
        // 确保表单数据也初始化为数组
        formData.value[`field_${fieldId}`] = formData.value[`field_${fieldId}`] || []
      }
      
      // 初始化其他选项
      otherOptions[fieldId] = { selected: false, text: '' }
      
      // 初始化自定义选项数组
      customOptions[fieldId] = []
      // 初始化新的自定义选项输入
      newCustomOption[fieldId] = ''
    }
  })
}

// 在组件挂载后初始化表单控件
onMounted(() => {
  // ... 现有代码 ...
  initFormControls()
  // 初始化多选框已选值
  initializeMultiSelectValues()
})

// 添加自定义输入选项的方法
const addCustomInputOption = (fieldId: number, query: string) => {
  if (!query.trim()) return
  
  const text = query.trim()
  const field = formFields.value.find((f: any) => f.id === fieldId)
  
  // 检查是否已存在相同选项
  const existingOptions = getFieldOptions(field)
  const exists = existingOptions.some((opt: any) => opt.label === text || opt.value === text)
  const customExists = (customOptions[fieldId] || []).some(opt => opt.text === text)
  
  if (exists || customExists) {
    ElMessage.warning('该选项已存在')
    return
  }
  
  // 初始化自定义选项数组（如果不存在）
  if (!customOptions[fieldId]) {
    customOptions[fieldId] = []
  }
  
  // 添加自定义选项
  customOptions[fieldId].push({ text, selected: field?.allow_multiple || false })
  
  // 设置选中值
  if (field?.allow_multiple) {
    // 多选模式，添加到选中项
    if (!formData[fieldId]) formData[fieldId] = {}
    formData[fieldId][text] = true
    updateMultipleSelectionArray(fieldId)
  } else {
    // 单选模式，直接设置为选中值
    formData[fieldId] = text
  }
}

// 准备表单数据提交
const prepareFormData = () => {
  const formItems = []
  
  formFields.value.forEach((field: any) => {
    let fieldValue = formData[field.id]
    
    // 处理多选字段的"其他"选项
    if (field.field_type === 'radio' && field.allow_multiple && fieldValue?.includes('other')) {
      // 复制数组，避免修改原始数据
      const valuesCopy = [...fieldValue]
      // 找到"other"的索引并替换为用户输入的文本
      const otherIndex = valuesCopy.indexOf('other')
      if (otherIndex >= 0 && otherOptions[field.id]?.text) {
        // 直接用输入的文本替换"other"
        valuesCopy[otherIndex] = otherOptions[field.id].text
      }
      fieldValue = valuesCopy
    }
    
    // 处理单选模式下的"其他"选项
    if (field.field_type === 'radio' && !field.allow_multiple && fieldValue === 'other') {
      // 直接设置为用户输入的文本
      fieldValue = otherOptions[field.id]?.text || ''
    }
    
    formItems.push({
      field_id: field.id,
      field_type: field.field_type,
      field_value: fieldValue
    })
  })
  
  return { form_items: formItems }
}

// 监听多选值变化，确保在选择"其他"选项时初始化otherOptions对象
watch(multiSelectValues, (newVal) => {
  Object.keys(newVal).forEach(fieldId => {
    const id = Number(fieldId)
    if (newVal[id]?.includes('other')) {
      // 如果选择了"其他"选项，确保otherOptions[id]已初始化
      if (!otherOptions[id]) {
        otherOptions[id] = { selected: true, text: '' }
      } else {
        otherOptions[id].selected = true
      }
    }
  })
}, { deep: true })

// 监听表单单选值变化，确保在选择"其他"选项时初始化otherOptions对象
watch(formData, (newVal) => {
  formFields.value.forEach(field => {
    if (!field.allow_multiple && newVal[`field_${field.id}`] === 'other') {
      // 如果选择了"其他"选项，确保otherOptions[field.id]已初始化
      if (!otherOptions[field.id]) {
        otherOptions[field.id] = { selected: true, text: '' }
      } else {
        otherOptions[field.id].selected = true
      }
    }
  })
}, { deep: true })

// 处理多选变化
</script>

<template>
  <div class="registration-form-container">
    <!-- 加载中 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-content">
        <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
        <p>加载表单数据中，请稍候...</p>
      </div>
      <el-skeleton :rows="10" animated />
    </div>
    
    <!-- 备用内容显示 -->
    <div v-if="!loading && !error && !formFields.length && !competition" class="fallback-content">
      <el-alert type="warning" :closable="false" show-icon>
        <template #title>页面未正确加载</template>
        <template #default>
          <p>页面内容加载失败，请重新刷新页面或联系管理员。</p>
        </template>
      </el-alert>
    </div>
    
    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      :closable="false"
      show-icon
    >
      <template #default>
        <p>可能的原因：</p>
        <ul>
          <li>网络连接问题，请检查您的网络</li>
          <li>服务器暂时不可用，请稍后再试</li>
          <li>您可能需要重新登录</li>
        </ul>
        <div class="error-actions">
          <el-button size="small" @click="handleStartSubmit">重试</el-button>
          <el-button size="small" type="primary" @click="$router.push('/login')">去登录</el-button>
        </div>
      </template>
    </el-alert>
    
    <!-- 比赛信息 -->
    <div v-if="competition" class="competition-info">
      <h2>{{ competition.title }}</h2>
      <p v-if="isEditMode">编辑报名信息</p>
      <p v-else>填写报名信息</p>
    </div>
    
    <!-- 提交信息卡片 -->
    <el-card v-if="!formFields.length && !loading && !error" class="submit-info-card">
      <div class="submit-info-content">
        <div class="submit-icon">
          <el-icon :size="30" color="#1890ff"><Trophy /></el-icon>
      </div>
        <h3>提交信息</h3>
        <el-button type="primary" @click="handleStartSubmit" :loading="loading">立即提交</el-button>
      </div>
    </el-card>
      
    <!-- 表单内容 -->
        <el-form
      v-if="!loading && !error && formFields.length > 0"
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
      class="registration-form"
    >
      <!-- 表单数据状态提示 -->
      <div v-if="formDataStatus === 'none'" class="form-data-tip">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <div class="alert-content">
            <span>首次填写表单，请完整填写所有必填项</span>
          </div>
        </el-alert>
      </div>
      
      <!-- 自动保存状态提示 -->
      <div class="auto-save-tip mb-4">
        <el-alert
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <div class="flex items-center justify-between">
              <span>
                {{ lastSavedTime ? `上次保存时间：${new Date(lastSavedTime).toLocaleString()}` : '表单会自动保存到本地' }}
              </span>
              <div class="flex items-center" v-if="hasUnsavedChanges">
                <span class="text-yellow-500 mr-2">有未保存的更改</span>
                <el-button type="primary" size="small" @click="saveFormToLocal">
                  立即保存
                </el-button>
              </div>
            </div>
          </template>
        </el-alert>
      </div>
      

      <!-- 基本字段 -->
          <el-form-item label="项目名称" prop="team_name">
        <el-input v-model="formData.team_name" placeholder="请输入项目名称"></el-input>
          </el-form-item>
          
          <el-form-item label="联系电话" prop="contact_phone">
        <el-input v-model="formData.contact_phone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
          
      <!-- 动态表单字段 -->
          <template v-for="field in formFields" :key="field.id">
                <!-- 文本字段 -->
            <el-form-item
              v-if="field.field_type === 'text'"
              :label="field.field_label"
          :prop="'field_' + field.id"
            >
                  <el-input
            v-model="formData['field_' + field.id]" 
                    :placeholder="`请输入${field.field_label}`"
          ></el-input>
            </el-form-item>

        <!-- 单选/多选字段 -->
            <template v-if="field.field_type === 'radio'">
              <el-form-item :prop="`field_${field.id}`"
                :rules="field.is_required ? {required: true, message: `请选择${field.field_label}`, trigger: 'change'} : {}"
              >
                <template #label>
                  {{ field.field_label }}
                  <el-tag v-if="field.allow_multiple" size="small" type="success" class="ml-1">多选</el-tag>
                </template>
                <!-- 多选模式 -->
                <template v-if="field.allow_multiple">
                  <div class="text-xs text-gray-500 mb-1">
                    <el-icon><InfoFilled /></el-icon> 
                    您可以选择多个选项
                  </div>
                  <el-select
                    v-model="multiSelectValues[field.id]"
                    multiple
                    filterable
                    :allow-create="field.allow_custom_options"
                    default-first-option
                    :multiple-limit="0"
                    style="width: 100%"
                    :placeholder="`请选择${field.field_label}（可多选）`"
                    @change="(val) => handleMultiSelectChange(field.id, val)"
                  >
                    <el-option
                      v-for="option in getRadioOptions(field)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                    
                    <!-- 自定义选项 -->
                    <el-option
                      v-for="(customOption, index) in customOptions[field.id]"
                      :key="`custom-${index}`"
                      :label="customOption.text"
                      :value="customOption.text"
                    />
                    
                    <!-- "其他"选项 -->
                    <el-option v-if="field.other_option" label="其他" value="other" />
                  </el-select>
                  
                  <!-- "其他"选项的输入框 -->
                  <el-input
                    v-if="field.other_option && multiSelectValues[field.id]?.includes('other')"
                    v-model="otherOptions[field.id].text"
                    type="text"
                    placeholder="请说明其他选项内容"
                    class="mt-2"
                  />
                </template>
                
                <!-- 单选模式 - 下拉列表 -->
                <template v-else>
                  <el-select
                    v-model="formData[`field_${field.id}`]"
                    filterable
                    :allow-create="field.allow_custom_options"
                    default-first-option
                    style="width: 100%"
                    :placeholder="`请选择${field.field_label}`"
                  >
                    <el-option
                      v-for="option in getRadioOptions(field)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                    
                    <!-- 自定义选项 -->
                    <el-option
                      v-for="(customOption, index) in customOptions[field.id]"
                      :key="`custom-${index}`"
                      :label="customOption.text"
                      :value="customOption.text"
                    />
                    
                    <!-- "其他"选项 -->
                    <el-option v-if="field.other_option" label="其他" value="other" />
                  </el-select>
                  
                  <!-- "其他"选项的输入框 -->
                  <el-input
                    v-if="field.other_option && formData[`field_${field.id}`] === 'other'"
                    v-model="otherOptions[field.id].text"
                    type="text"
                    placeholder="请说明其他选项内容"
                    class="mt-2"
                  />
                </template>
              </el-form-item>
            </template>

        <!-- 图片上传 -->
            <el-form-item
              v-else-if="field.field_type === 'image'"
              :label="field.field_label"
              :prop="'field_' + field.id"
            >
              <el-upload
                :action="null"
                :auto-upload="false"
                :headers="uploadHeaders"
                :on-change="(file) => handleFileChange(file, field)"
                :file-list="(fileList[field.id] || []) as any"
                list-type="picture-card"
                :class="{ 'hide-upload': (fileList[field.id] || []).length >= 1 }"
                :before-upload="(file) => beforeImageUpload(file, field)"
                :on-preview="handlePreview"
                :on-remove="(file) => handleRemove(file, field)"
                accept="image/jpeg,image/png,image/gif,image/bmp,image/webp"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">
                    支持JPG/PNG/GIF/BMP/WEBP格式，大小不超过5MB
                  </div>
                </template>
              </el-upload>
            </el-form-item>

        <!-- 文件上传 -->
            <el-form-item
              v-else-if="field.field_type === 'file'"
              :label="field.field_label"
              :prop="'field_' + field.id"
            >
              <el-upload
                :action="null"
                :auto-upload="false"
                :headers="uploadHeaders"
                :on-change="(file) => handleFileChange(file, field)"
                :file-list="(fileList[field.id] || []) as any"
                :before-upload="(file) => beforeFileUpload(file, field)"
                :data="{ field_type: 'file' }"
                :on-preview="handlePreview"
                :on-remove="(file) => handleRemove(file, field)"
                :accept="getAcceptMimeTypes(field.options)"
              >
                        <el-button type="primary">选择文件</el-button>
                <template #tip>
                  <div class="el-upload__tip">
                    {{ hasAcceptedFormats(field.options) ? `支持${getAcceptedFormats(field.options)}格式` : '支持所有格式' }}，大小不超过10MB，所有文件总大小不超过200MB
                  </div>
                </template>
              </el-upload>
              </el-form-item>

          <!-- 日期字段 -->
              <el-form-item
                v-else-if="field.field_type === 'date'"
                :label="field.field_label"
                :prop="`field_${field.id}`"
                :rules="field.is_required ? {required: true, message: `请选择${field.field_label}`, trigger: 'change'} : {}"
              >
                <el-date-picker
                  v-model="formData[`field_${field.id}`]"
                  type="date"
                  :placeholder="`请选择${field.field_label}`"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
          </template>
          
          <!-- 提交按钮 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="submitting">提交报名</el-button>
        <el-button @click="resetForm" :disabled="submitting">重置</el-button>
      </el-form-item>
        </el-form>
  </div>
</template>

<style scoped>
:root {
  /* 亮色模式颜色变量 */
  --primary-bg: #fff;
  --secondary-bg: #f5f7fa;
  --hover-bg: #f0f9eb;
  --card-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  --border-color: #dcdfe6;
  --text-color: #303133;
  --text-secondary: #606266;
  --info-bg: #e6f7ff;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* 暗色模式颜色变量 */
    --primary-bg: #1c1c1e;
    --secondary-bg: #2c2c2e;
    --hover-bg: #2a3035;
    --card-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.3);
    --border-color: #4c4c4e;
    --text-color: #e0e0e0;
    --text-secondary: #a0a0a0;
    --info-bg: #203442;
  }
}

.registration-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: var(--text-color);
}

.registration-form {
  background-color: var(--primary-bg);
  padding: 20px;
  border-radius: 4px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
}

.loading-container {
  padding: 20px;
  background-color: var(--primary-bg);
  border-radius: 4px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border-color);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.loading-icon {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-actions {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.competition-info {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--secondary-bg);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.hide-upload :deep(.el-upload--picture-card) {
  display: none;
}

.submit-info-card {
  margin-bottom: 20px;
}

.submit-info-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.submit-icon {
  background-color: var(--info-bg);
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 15px;
}

.submit-info-content h3 {
  margin-bottom: 20px;
  font-size: 18px;
  color: var(--text-color);
}

.form-data-tip {
  margin-bottom: 20px;
}

.alert-content {
  display: flex;
  align-items: center;
}

/* 调整 Element Plus 组件在暗色模式下的样式 */
:deep(.el-input__wrapper),
:deep(.el-select .el-input__wrapper),
:deep(.el-textarea__wrapper) {
  @media (prefers-color-scheme: dark) {
    background-color: var(--secondary-bg);
    border-color: var(--border-color);
  }
}

:deep(.el-form-item__label) {
  @media (prefers-color-scheme: dark) {
    color: var(--text-color);
  }
}

:deep(.el-card) {
  @media (prefers-color-scheme: dark) {
    background-color: var(--primary-bg);
    border-color: var(--border-color);
    color: var(--text-color);
  }
}

:deep(.el-upload),
:deep(.el-upload-dragger) {
  @media (prefers-color-scheme: dark) {
    background-color: var(--secondary-bg);
    border-color: var(--border-color);
  }
}

:deep(.el-upload-list__item) {
  @media (prefers-color-scheme: dark) {
    background-color: var(--secondary-bg);
    border-color: var(--border-color);
    color: var(--text-color);
  }
}

:deep(.el-upload-list__item-name) {
  @media (prefers-color-scheme: dark) {
    color: var(--text-color);
  }
}

:deep(.el-upload__tip) {
  @media (prefers-color-scheme: dark) {
    color: var(--text-secondary);
  }
}
</style>