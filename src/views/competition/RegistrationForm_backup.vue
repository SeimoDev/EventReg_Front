<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user'
import request from '../../api/request'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import type { FormInstance, FormRules, UploadUserFile, UploadFile, UploadRawFile } from 'element-plus'
import { Upload, Plus } from '@element-plus/icons-vue'
import { ElUpload } from 'element-plus'

// 基本字段ID常量
const TEAM_NAME_FIELD_ID = 1
const CONTACT_PHONE_FIELD_ID = 2

interface FormField {
  id: number
  field_name: string
  field_label: string
  field_type: string
  is_required: boolean | number | string
  options?: {
    value: string
    label: string
  }[]
}

interface FileItem extends Omit<UploadFile, 'status' | 'uid'> {
  raw: UploadRawFile | null
  name: string
  url?: string
}

// 上传相关类型定义
interface UploadHeaders {
  Authorization: string
}

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const formRef = ref<FormInstance>()
const formData = ref<Record<string, any>>({})
const formFields = ref<FormField[]>([])
const fileList = ref<Record<number, FileItem[]>>({})

const uploadHeaders = computed<UploadHeaders>(() => ({
  Authorization: `Bearer ${userStore.token}`
}))

// 文件上传处理函数
const handleUploadSuccess = (response: any, fieldId: number) => {
  if (response && response.url) {
    formData.value[`field_${fieldId}`] = response.url
    if (!fileList.value[fieldId]) {
      fileList.value[fieldId] = []
    }
    const newFile: FileItem = {
      name: response.original_filename || '未命名文件',
      url: response.url,
      raw: null,
      size: 0
    }
    fileList.value[fieldId] = [newFile]
  }
}

const handleUploadError = (error: any, fieldId: number) => {
  console.error('文件上传失败:', error)
  ElMessage.error('文件上传失败')
  formData.value[`field_${fieldId}`] = ''
  if (fileList.value[fieldId]) {
    fileList.value[fieldId] = []
  }
}

// 文件上传前的验证
const beforeImageUpload = (file: File) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isJPG && !isPNG) {
    ElMessage.error('图片只能是 JPG 或 PNG 格式!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const beforeFileUpload = (file: File) => {
  const isValidType = /\.(pdf|doc|docx)$/i.test(file.name)
  const isLt50M = file.size / 1024 / 1024 < 50

  if (!isValidType) {
    ElMessage.error('只能上传PDF/DOC/DOCX格式的文件!')
    return false
  }
  if (!isLt50M) {
    ElMessage.error('文件大小不能超过 50MB!')
    return false
  }
  return true
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
  
  // 处理自定义字段
  formFields.value.forEach(field => {
    const fieldId = field.id
    const fieldValue = formData.value[`field_${fieldId}`]
    
    if (fieldValue !== undefined && fieldValue !== '') {
      if (field.field_type === 'text' || field.field_type === 'radio') {
        formItems.push({
          field_id: fieldId,
          field_type: field.field_type,
          content: fieldValue
        })
      }
    }
  })
  
  return formItems
}

// 验证规则
const rules = computed<FormRules>(() => {
  const rulesObj: FormRules = {
    team_name: [
      { required: true, message: '请输入团队名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
    ],
    contact_phone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
  }
  
  // 添加自定义字段验证规则
  if (Array.isArray(formFields.value)) {
    formFields.value.forEach(field => {
      if (!field) return
      
      const isRequired = field.is_required === true || field.is_required === 1 || field.is_required === '1'
      
      if (isRequired) {
        if (field.field_type === 'text' || field.field_type === 'radio') {
          rulesObj[`field_${field.id}`] = [
            { required: true, message: `请${field.field_type === 'radio' ? '选择' : '填写'}${field.field_label}`, trigger: field.field_type === 'radio' ? 'change' : 'blur' }
          ]
        } else if (field.field_type === 'image' || field.field_type === 'file') {
          rulesObj[`field_${field.id}`] = [
            { 
              validator: (_rule: any, _value: any, callback: Function) => {
                if (!fileList.value[field.id] || fileList.value[field.id].length === 0) {
                  callback(new Error(`请上传${field.field_label}`))
                } else {
                  callback()
                }
              }, 
              trigger: 'change' 
            }
          ]
        }
      }
    })
  }
  
  return rulesObj
})

// @ts-ignore 忽略模板中潜在的类型错误

interface FormField {
  id: number
  field_name: string
  field_label: string
  field_type: string
  is_required: boolean | number | string
  options?: {
    accepted_formats?: string
    value?: string
    label?: string
  }[]
}

interface FileItem {
  raw: File | null
  name: string
  url?: string
  uid?: string  // 添加可选的uid字段，用于ElementUI组件
}

interface Competition {
  id: number
  title: string
}

interface UploadFile {
  name: string
  percentage?: number
  status: 'ready' | 'uploading' | 'success' | 'fail'
  size: number
  raw: File
  url?: string
}

// 错误响应类型
interface ApiError {
  response?: {
    data?: {
      detail?: {
        message?: string;
        field_errors?: Record<string, string>;
        file_errors?: Array<{field_id: string; error: string}>;
      }
    }
  }
}

interface Registration {
  id: number
  team_name: string
  contact_phone: string
  status: string
  created_at: string
  updated_at: string
}

// 定义增强型表单数据的接口
interface EnhancedFormResponse {
  success: boolean
  registration: {
    id: number
    user_id: number
    user_name: string
    email: string
    competition_id: number
    competition_name: string
    status: string
    created_at: string
  }
  form_data: Array<{
    id: number
    field_id: number
    field_name?: string
    field_label?: string
    type: 'text' | 'image' | 'file'
    content: string
    url?: string
  }>
}

// 增强型表单请求项
interface FormRequestItem {
  field_id: number
  field_type: string
  content: string | null
}

// 上传状态类型
type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// 添加新的接口定义
interface CompetitionFormData {
  success: boolean
  competition: {
    id: number
    name: string
    registration_id: number
    status: string
    created_at: string
  }
  form_fields: Array<{
    id: number
    name: string
    label: string
    type: string
    is_required: boolean
  }>
  submitted_data: {
    text_fields: Record<string, {
      field_name: string
      field_label: string
      field_type: string
      field_value: string
    }>
    file_fields: Record<string, {
      field_name: string
      field_label: string
      field_type: string
      original_filename: string
      saved_filename: string
      file_url: string
      file_type: string
      file_size: number
    }>
  }
}

const competitionId = computed(() => {
  const id = route.params.id;
  if (!id || isNaN(Number(id))) {
    console.error('无效的活动ID:', id);
    return 0; // 返回一个默认值，避免NaN
  }
  return Number(id);
})

const competition = ref<Competition | null>(null)
const loading = ref(true)
const submitting = ref(false)

// 初始化表单数据
formData.value = {
  team_name: '',
  contact_phone: '',
  additional_info: ''
}

// 文件上传数据
fileList.value = {} // 重置文件列表

const isEditMode = computed(() => route.query.mode === 'edit')
const registrationId = computed(() => {
  const id = route.query.registrationId;
  return id ? Number(id) : 0;
})

// 上传状态跟踪
const uploadStatus = ref<Record<string, { 
  status: 'idle' | 'uploading' | 'success' | 'error', 
  message?: string 
}>>({})

// 将文件转换为base64
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// 预览图片 - 同步版，用于模板
const getBase64Preview = (file: File | null): string => {
  if (!file) return '';
  
  // 返回一个临时数据，实际会被异步更新的url替换
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
}

// 实时保存的防抖设置
let saveTimeout: ReturnType<typeof setTimeout> | null = null
const SAVE_DELAY = 1000 // 1秒防抖

// 加载表单字段
const loadFormFields = async () => {
  try {
    // 检查活动ID是否有效
    if (!competitionId.value) {
      ElMessage.error('无效的活动ID，请返回重试');
      loading.value = false;
      return;
    }
    
    loading.value = true
    console.log('开始加载活动表单字段，活动ID:', competitionId.value);
    
    let formFieldsLoaded = false;
    let fieldsData: any[] = []; // 存储最终的表单字段
    
    // 策略1: 先尝试使用增强型API获取表单数据
    try {
      console.log('尝试使用增强型API获取表单字段...');
      const response = await request.post(
        `/forms/competitions/${competitionId.value}/form-data`,
        {}, // 空对象作为请求体
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      ) as any; // 使用any类型以避免类型错误
      
      console.log('增强型API响应:', response);
      
      // 检查response是否有效 - 考虑可能的响应结构
      if (response) {
        let formFields = null;
        let competitionData = null;
        let submittedData = null;
        
        // 提取表单字段，处理不同的可能响应结构
        if (response.form_fields && Array.isArray(response.form_fields)) {
          formFields = response.form_fields;
        } else if (response.data && response.data.form_fields && Array.isArray(response.data.form_fields)) {
          formFields = response.data.form_fields;
        }
        
        // 提取活动信息
        if (response.competition) {
          competitionData = response.competition;
        } else if (response.data && response.data.competition) {
          competitionData = response.data.competition;
        }
        
        // 提取已提交数据
        if (response.submitted_data) {
          submittedData = response.submitted_data;
        } else if (response.data && response.data.submitted_data) {
          submittedData = response.data.submitted_data;
        }
        
        if (formFields) {
          console.log('成功从增强型API获取表单字段:', formFields);
          fieldsData = formFields;
          formFieldsLoaded = true;
          
          // 设置活动信息
          if (competitionData) {
            competition.value = {
              id: competitionData.id,
              title: competitionData.name || competitionData.title || '活动'
            };
            
            // 如果有registration_id，设置为编辑模式
            if (competitionData.registration_id) {
              router.replace({
                query: {
                  ...route.query,
                  mode: 'edit',
                  registrationId: String(competitionData.registration_id)
                }
              });
            }
          }
          
          // 加载已提交的数据
          if (submittedData) {
            // 处理文本字段
            if (submittedData.text_fields) {
              Object.entries(submittedData.text_fields || {}).forEach(([fieldId, data]: [string, any]) => {
                formData.value[`field_${fieldId}`] = data.field_value;
              });
            }
            
            // 处理文件字段
            if (submittedData.file_fields) {
              // 创建一个处理文件的promise数组
              const filePromises: Promise<void>[] = [];
              
              Object.entries(submittedData.file_fields || {}).forEach(([fieldId, data]: [string, any]) => {
                const fileItem: FileItem = {
                  name: data.original_filename || data.field_label || '文件',
                  url: data.file_url,
                  raw: null // 已上传的文件没有raw属性
                };
                
                fileList.value[Number(fieldId)] = [fileItem];
                formData.value[`field_${fieldId}`] = data.original_filename || data.field_label || '文件';
                
                // 不再自动处理文件URL
                // if (fileItem.url) {
                //   filePromises.push(processFileUrl(fileItem));
                // }
              });
              
              // 不再等待文件处理完成
              // if (filePromises.length > 0) {
              //   try {
              //     await Promise.all(filePromises);
              //     console.log('所有文件URL处理完成');
              //   } catch (fileError) {
              //     console.error('处理文件URL时发生错误:', fileError);
              //   }
              // }
            }
          }
        } else {
          console.warn('增强型API没有返回预期的表单字段结构');
        }
      } else {
        console.warn('增强型API返回无效响应');
      }
    } catch (enhancedError) {
      console.warn('获取增强型表单数据失败，尝试使用传统API:', enhancedError);
    }
    
    // 策略2: 如果增强型API失败，获取活动基本信息
    if (!formFieldsLoaded) {
      try {
        console.log('尝试获取活动基本信息...');
        const competitionResponse = await request.get(`/competitions/${competitionId.value}`) as any;
        console.log('活动信息响应:', competitionResponse);
        
        if (competitionResponse) {
          // 设置活动信息
          competition.value = {
            id: competitionResponse.id || competitionId.value,
            title: competitionResponse.title || '活动'
          };
        } else {
          console.warn('无法获取活动基本信息');
        }
      } catch (competitionError) {
        console.error('获取活动基本信息失败:', competitionError);
        // 创建一个基本的活动信息，避免UI显示问题
        competition.value = {
          id: competitionId.value,
          title: '活动表单'
        };
      }
    }
    
    // 策略3: 尝试使用传统API获取表单字段
    if (!formFieldsLoaded) {
      try {
        console.log('尝试使用传统API获取表单字段...');
        const fieldsResponse = await request.get(`/forms/competitions/${competitionId.value}/fields`) as any;
        console.log('传统API表单字段响应:', fieldsResponse);
        
        // 尝试从各种可能的响应结构提取字段数据
        if (fieldsResponse) {
          if (Array.isArray(fieldsResponse)) {
            fieldsData = fieldsResponse;
            formFieldsLoaded = true;
          } else if (fieldsResponse.data && Array.isArray(fieldsResponse.data)) {
            fieldsData = fieldsResponse.data;
            formFieldsLoaded = true;
          } else if (typeof fieldsResponse === 'object') {
            // 查找第一个看起来像是字段数组的属性
            for (const key in fieldsResponse) {
              if (Array.isArray(fieldsResponse[key])) {
                fieldsData = fieldsResponse[key];
                formFieldsLoaded = true;
                break;
              }
            }
          }
        }
      } catch (fieldsError) {
        console.error('获取传统API表单字段失败:', fieldsError);
      }
    }
    
    // 策略4: 如果编辑模式，尝试从报名数据中提取字段
    if (!formFieldsLoaded && isEditMode.value && registrationId.value) {
      try {
        console.log('尝试从报名数据中提取表单字段...');
        const formDataResponse = await request.get(
          `/forms/registrations/${registrationId.value}/data`
        ) as any;
        console.log('报名数据响应:', formDataResponse);
        
        // 尝试从提交的数据中推断字段
        const fields: any[] = [];
        
        // 创建文件处理的Promise数组
        const processFilePromises: Promise<void>[] = [];
        
        // 从文本字段提取
        if (formDataResponse && formDataResponse.text_fields) {
          Object.entries(formDataResponse.text_fields).forEach(([key, value]: [string, any]) => {
            // 从key中提取字段ID: field_123 -> 123
            const fieldId = parseInt(key.replace('field_', ''), 10);
            if (!isNaN(fieldId)) {
              fields.push({
                id: fieldId,
                field_name: value.field_name || key,
                field_label: value.field_label || '文本字段',
                field_type: 'text',
                is_required: false
              });
              
              // 同时填充表单数据
              if (value && value.field_value !== undefined) {
                formData.value[key] = value.field_value;
              }
            }
          });
        }
        
        // 从文件字段提取
        if (formDataResponse && formDataResponse.file_fields) {
          Object.entries(formDataResponse.file_fields).forEach(([key, value]: [string, any]) => {
            const fieldId = parseInt(key.replace('field_', ''), 10);
            if (!isNaN(fieldId)) {
              fields.push({
                id: fieldId,
                field_name: value.field_name || key,
                field_label: value.field_label || '文件字段',
                field_type: value.field_type || 'file',
                is_required: false
              });
              
              // 同时填充文件数据
              if (value && value.file_url) {
                const fileItem: FileItem = {
                  name: value.original_filename || '未命名文件',
                  url: value.file_url,
                  raw: null as any
                };
                
                fileList.value[fieldId] = [fileItem];
                formData.value[key] = value.original_filename || '未命名文件';
                
                // 注释掉处理文件URL的代码
                // if (fileItem.url) {
                //   processFilePromises.push(processFileUrl(fileItem));
                // }
              }
            }
          });
        }
        
        // 注释掉等待所有文件处理完成的代码
        // 等待所有文件处理完成
        // if (processFilePromises.length > 0) {
        //   try {
        //     await Promise.all(processFilePromises);
        //     console.log('策略4：所有文件URL处理完成');
        //   } catch (fileError) {
        //     console.error('策略4：处理文件URL时发生错误:', fileError);
        //   }
        // }
        
        if (fields.length > 0) {
          fieldsData = fields;
          formFieldsLoaded = true;
        }
      } catch (registrationDataError) {
        console.error('从报名数据提取字段失败:', registrationDataError);
      }
    }
    
    // 策略5: 如果仍然没有加载字段，使用一个基本的默认表单
    if (!formFieldsLoaded || fieldsData.length === 0) {
      console.warn('无法从任何API获取表单字段，使用默认表单字段');
      fieldsData = [
        {
          id: 1,
          field_name: 'additional_info',
          field_label: '补充信息',
          field_type: 'text',
          is_required: false
        }
      ];
    }
    
    // 处理字段数据
    if (Array.isArray(fieldsData)) {
      console.log('处理表单字段数据:', fieldsData);
      
      // 尝试标准化字段格式
      formFields.value = fieldsData.map(field => {
        // 确保所有必要的属性都存在
        return {
          id: field.id || Math.random() * 1000, // 如果没有ID，生成一个随机ID
          field_name: field.field_name || field.name || `field_${field.id}`,
          field_label: field.field_label || field.label || '字段',
          field_type: field.field_type || field.type || 'text',
          is_required: field.is_required === true || field.is_required === 1 || field.is_required === '1'
        };
      });
      
      // 初始化文件字段列表
      formFields.value.forEach(field => {
        if (field && (field.field_type === 'file' || field.field_type === 'image')) {
          if (!fileList.value[field.id]) {
            fileList.value[field.id] = [];
          }
        }
      });
      
      console.log('表单字段加载和处理完成:', formFields.value);
    } else {
      console.error('最终处理的表单字段不是数组:', fieldsData);
      formFields.value = [];
    }
  } catch (error) {
    console.error('加载表单字段过程中发生未捕获错误:', error);
    ElMessage.error('加载表单字段失败');
    // 确保即使出错也有一个基本的活动信息
    if (!competition.value) {
      competition.value = {
        id: competitionId.value,
        title: '活动表单'
      };
    }
  } finally {
    loading.value = false;
  }
}

// 加载报名信息
const loadRegistrationData = async () => {
  try {
    loading.value = true
    
    // 检查ID有效性
    if (!registrationId.value) {
      console.error('无效的报名ID:', registrationId.value);
      ElMessage.error('无效的报名ID，请返回重试');
      router.push('/user/profile');
      return;
    }
    
    console.log('开始加载报名ID:', registrationId.value);
    
    // 获取报名详情
    try {
      const registration = await request.get<Registration>(
        `/competitions/registrations/${registrationId.value}`
      );
      
      console.log('报名详情API响应:', registration);
      
      // 因为axios拦截器已经提取了response.data，所以这里的registration就是响应数据
      // 检查registration是否为空数据
      if (!registration) {
        throw new Error('服务器返回空数据');
      }
      
      if (Array.isArray(registration) && registration.length === 0) {
        throw new Error('服务器返回了空数组');
      }
      
      if (typeof registration === 'object' && Object.keys(registration).length === 0) {
        throw new Error('服务器返回了空对象');
      }

      console.log('成功获取到报名信息:', registration);

      // 使用类型守卫确保registration有必要的属性
      if (!('status' in registration) || 
          !('team_name' in registration) || 
          !('contact_phone' in registration)) {
        throw new Error('报名数据格式不符合预期');
      }

      // 如果状态不是 pending，则不允许编辑
      const status = String(registration.status); // 确保status是字符串
      if (status !== 'pending') {
        ElMessage.warning('只能编辑待审核的报名信息');
        router.push('/user/profile');
        return;
      }
      
      // 设置基本信息
      formData.value.team_name = registration.team_name || '';
      formData.value.contact_phone = registration.contact_phone || '';

      // 尝试首先使用增强型API获取表单数据
      try {
        const enhancedFormResponse = await request.get<EnhancedFormResponse>(
          `/forms/registrations/${registrationId.value}/enhanced-data`
        );
        
        console.log('增强型API响应:', enhancedFormResponse);
        
        if (!enhancedFormResponse) {
          console.warn('增强型API返回空数据');
          throw new Error('增强型API返回空数据');
        }
        
        console.log('获取到增强型表单数据:', enhancedFormResponse);
        
        // 使用类型守卫确保数据格式正确
        if ('success' in enhancedFormResponse && 
            'form_data' in enhancedFormResponse && 
            enhancedFormResponse.success && 
            Array.isArray(enhancedFormResponse.form_data)) {
          
          // 处理增强型表单数据
          for (const item of enhancedFormResponse.form_data) {
            const itemType = item.type; // 创建临时变量，避免直接比较字符串字面量类型
            
            if (itemType === 'text') {
              // 文本字段
              formData.value[`field_${item.field_id}`] = item.content || ''
            } else if (itemType === 'image' || itemType === 'file') {
              // 图片或文件字段 - 使用content作为文件路径
              if (item.content) {
                // 对于有内容的文件/图片
                const fileItem: FileItem = {
                  name: item.field_label || '文件',
                  url: item.content, // 使用content作为URL
                  raw: null as any // 已上传的文件没有raw属性
                };
                
                fileList.value[item.field_id] = [fileItem];
                formData.value[`field_${item.field_id}`] = item.field_label || '文件';
                
                // 不再自动处理文件URL
                // await processFileUrl(fileItem);
              } else if (item.url) {
                // 兼容：如果没有content但有url，则使用url
                console.log(`使用item.url作为备选：field_id=${item.field_id}, url=${item.url}`);
                const fileItem: FileItem = {
                  name: item.field_label || '文件',
                  url: item.url,
                  raw: null as any
                };
                
                fileList.value[item.field_id] = [fileItem];
                formData.value[`field_${item.field_id}`] = item.field_label || '文件';
                
                // 不再自动处理文件URL
                // await processFileUrl(fileItem);
              }
            }
          }
          return // 如果成功获取了增强型数据，就不需要继续获取旧格式的数据
        } else {
          console.warn('增强型API返回数据格式不符合预期:', enhancedFormResponse);
        }
      } catch (enhancedError) {
        console.warn('获取增强型表单数据失败，尝试使用传统API:', enhancedError)
        // 如果增强型API获取失败，继续尝试使用传统API
      }

      // 如果增强型API获取失败或不可用，回退到传统API
      try {
        console.log('尝试使用传统API获取表单数据');
        // 断言为any类型以解决类型检查问题
        const formDataResponse: any = await request.get(
          `/forms/registrations/${registrationId.value}/data`
        );
        
        console.log('传统API响应:', formDataResponse);
        
        if (!formDataResponse) {
          console.warn('传统API返回空数据');
          // 不抛出错误，使用空对象继续
          return;
        }
        
        console.log('传统API数据:', formDataResponse);

        // 使用安全的类型检查和访问方式
        const textFields = formDataResponse.text_fields || {};
        const fileFields = formDataResponse.file_fields || {};

        // 设置表单字段值 - 处理传统API响应格式
        Object.entries(textFields).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && 'field_value' in value) {
            formData.value[key] = value.field_value;
          }
        });

        // 设置文件字段
        const processFilePromises: Promise<void>[] = [];
        Object.entries(fileFields).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object' && 'file_url' in value) {
            const fieldId = parseInt(key.replace('field_', ''), 10);
            // 确保fieldId是有效数字
            if (!isNaN(fieldId)) {
              const fileItem: FileItem = {
                name: value.original_filename || '未命名文件',
                url: value.file_url,
                raw: null as any // 已上传的文件没有 raw 属性
              };
              
              fileList.value[fieldId] = [fileItem];
              formData.value[key] = value.original_filename || '未命名文件';
              
              // 处理文件URL
              if (fileItem.url) {
                processFilePromises.push(processFileUrl(fileItem));
              }
            }
          }
        });

        // 注释掉等待文件处理的代码
        // 等待所有文件处理完成
        // if (processFilePromises.length > 0) {
        //   try {
        //     await Promise.all(processFilePromises);
        //     console.log('传统API所有文件URL处理完成');
        //   } catch (fileError) {
        //     console.error('处理传统API文件URL时发生错误:', fileError);
        //   }
        // }
      } catch (traditionalError) {
        console.error('获取传统API表单数据失败:', traditionalError);
        ElMessage.warning('无法获取完整的表单数据，部分信息可能缺失');
      }
    } catch (registrationError) {
      console.error('获取报名详情失败:', registrationError);
      // 重新抛出错误，让外层catch处理
      throw registrationError;
    }
  } catch (error: any) {
    // 增强错误日志
    console.error('加载报名信息失败:', error);
    console.error('错误详情:', {
      message: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : '无响应对象'
    });
    
    // 提供更友好的错误消息
    let errorMessage = '加载报名信息失败';
    if (error.response) {
      if (error.response.status === 404) {
        errorMessage = '找不到该报名记录，可能已被删除';
      } else if (error.response.status === 403) {
        errorMessage = '您没有权限查看此报名信息';
      } else if (error.response.status >= 500) {
        errorMessage = '服务器内部错误，请稍后再试';
      }
    }
    
    ElMessage.error(errorMessage);
    router.push('/user/profile');
  } finally {
    loading.value = false;
  }
}

// 文本字段变化处理
const handleTextChange = (field: FormField, value: string) => {
  // 只保存到本地，不再实时提交
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  const fieldKey = `field_${field.id}`;
  formData.value[fieldKey] = value; // 只更新本地值
  console.log(`文本字段值更新: ${fieldKey} = ${value}`);
}

// 修改handleBasicInfoChange函数，取消实时提交行为
const handleBasicInfoChange = (field: string, value: string) => {
  console.log(`基本信息字段变更: ${field} = ${value}`);
  
  // 仅更新本地状态，不再实时提交到服务器
  // 在新的流程中，所有数据会在最后一步一起提交
  if (field === 'team_name' || field === 'contact_phone') {
    formData.value[field] = value;
  }
  
  // 添加UI反馈，但不实际发送请求
  if (formData.value[field]?.trim()) {
    // 显示一个"已保存本地"的状态
    uploadStatus.value[field] = {
      status: 'success',
      message: '已保存到本地，将在提交表单时上传'
    };
    
    // 2秒后清除状态
    setTimeout(() => {
      if (uploadStatus.value[field]?.status === 'success') {
        delete uploadStatus.value[field];
      }
    }, 2000);
  }
}

// 文件上传change事件
const handleFileChange = async (field: FormField, info: any) => {
  try {
    console.log(`文件变化事件触发: field_id=${field.id}, info=`, info);
    
    // 直接从事件中获取最新的文件
    const rawFile = info?.file || null;
    const existingFiles = fileList.value[field.id] || [];
    
    // 如果事件表示上传，添加文件到列表
    if (rawFile && info.event === 'change' && rawFile instanceof File) {
      console.log(`添加文件: field_id=${field.id}, 文件名=${rawFile.name}`);
      
      // 创建新的文件对象
      const newFile = {
        name: rawFile.name,
        raw: rawFile,
        size: rawFile.size,
        type: rawFile.type,
        uid: Date.now().toString()
      };
      
      // 替换文件列表，使用新创建的数组避免引用问题
      fileList.value[field.id] = [{
        name: newFile.name,
        raw: rawFile,
        uid: newFile.uid
      }];
      
      // 更新formData
      formData.value[`field_${field.id}`] = newFile.name;
      
      // 保存到localStorage做备份
      try {
        localStorage.setItem(`file_field_${field.id}_name`, newFile.name);
        localStorage.setItem(`file_field_${field.id}_size`, String(newFile.size || 0));
        localStorage.setItem(`file_field_${field.id}_type`, newFile.type || '');
      } catch (e) {
        console.warn('无法保存文件信息到localStorage:', e);
      }
      
      // 如果是图片，转为base64用于预览
      if (field.field_type === 'image' && rawFile) {
        try {
          console.log(`处理图片预览: field_id=${field.id}`);
          const base64Data = await getBase64(rawFile);
          // 安全添加URL而不影响其他属性
          fileList.value[field.id][0].url = base64Data;
        } catch (err) {
          console.error('转换图片为base64失败:', err);
        }
      }
      
    } else if (info.event === 'remove') {
      // 如果是移除文件的事件，不做任何操作，保留文件
      console.log(`收到文件移除事件，但会被忽略: field_id=${field.id}`);
      return;
    }
    
    // 输出当前状态
    console.log(`文件处理后的状态: field_id=${field.id}, 文件数量=${fileList.value[field.id]?.length || 0}`);
    console.log(`所有文件字段最新状态:`, JSON.stringify(Object.keys(fileList.value).map(key => {
      return {
        field_id: key,
        files_count: fileList.value[Number(key)]?.length || 0,
        has_files: (fileList.value[Number(key)]?.length || 0) > 0,
        file_name: fileList.value[Number(key)]?.[0]?.name || '无'
      };
    })));
    
  } catch (error) {
    console.error('处理文件变更时出错:', error);
    ElMessage.error('处理文件变更时出错');
  }
}

// 文件上传前的检查
const beforeUpload = (field: FormField, file: File) => {
  // 检查文件大小
  const maxSize = 1000 * 1024 * 1024; // 默认10MB
  if (file.size > maxSize) {
    ElMessage.error(`文件 "${file.name}" 太大，请上传小于1000MB的文件`);
    return false;
  }

  // 检查文件类型
  if (field.options?.accepted_formats && field.options.accepted_formats.trim() !== '') {
    const acceptedFormats = field.options.accepted_formats.split(',').map(format => format.trim().toLowerCase());
    // 如果是通配符格式（如.* 或 *），则允许所有类型
    if (acceptedFormats.includes('.*') || acceptedFormats.includes('*')) {
      return true;
    }
    
    // 获取文件扩展名
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    // 检查文件扩展名是否在接受格式列表中
    const isAccepted = acceptedFormats.some(format => {
      const cleanFormat = format.startsWith('.') ? format.substring(1) : format;
      return fileExt === cleanFormat;
    });

    if (!isAccepted) {
      const formatList = acceptedFormats.join(', ');
      ElMessage.error(`文件 "${file.name}" 格式不正确，请上传 ${formatList} 格式的文件`);
      return false;
    }
  }

  return true;
};

// 处理自定义文件上传
const handleCustomFileChange = async (field: FormField, event: Event) => {
  try {
    const inputElement = event.target as HTMLInputElement;
    const files = inputElement.files;
    
    if (!files || files.length === 0) {
      console.log(`没有选择文件: field_id=${field.id}`);
      return;
    }
    
    const file = files[0];
    console.log(`自定义文件上传: field_id=${field.id}, 文件名=${file.name}, 大小=${file.size}, 类型=${file.type}`);
    
    // 检查文件类型和大小
    if (!beforeUpload(field, file)) {
      // 清空文件输入框，以便用户可以重新选择
      inputElement.value = '';
      return;
    }
    
    // 创建新的文件对象
    const newFile = {
      name: file.name,
      raw: file,
      size: file.size,
      type: file.type,
      uid: Date.now().toString()
    };
    
    // 更新文件列表
    if (!fileList.value[field.id]) {
      fileList.value[field.id] = [];
    }
    
    // 替换文件列表，确保为新数组以触发响应式更新
    fileList.value[field.id] = [newFile];
    
    // 更新formData
    formData.value[`field_${field.id}`] = newFile.name;
    
    // 保存到localStorage做备份
    try {
      localStorage.setItem(`file_field_${field.id}_name`, newFile.name);
      localStorage.setItem(`file_field_${field.id}_size`, String(newFile.size || 0));
      localStorage.setItem(`file_field_${field.id}_type`, newFile.type || '');
    } catch (e) {
      console.warn('无法保存文件信息到localStorage:', e);
    }
    
    // 如果是图片，创建预览URL
    if (field.field_type === 'image') {
      try {
        console.log(`处理图片预览: field_id=${field.id}`);
        const base64Data = await getBase64(file);
        // 设置URL
        fileList.value[field.id][0].url = base64Data;
      } catch (err) {
        console.error('转换图片为base64失败:', err);
      }
    } 
    // 如果是普通文件，可以在这里预先上传，但按照流程图，我们将在表单提交时统一处理
    
    // 输出当前状态
    console.log(`文件处理完成: field_id=${field.id}, 文件=${fileList.value[field.id][0].name}`);
    
  } catch (error) {
    console.error('处理文件上传时出错:', error);
    ElMessage.error('文件上传处理失败');
  }
}

// 上传普通文件并获取文件路径 - 修改为与报名记录关联
const uploadFile = async (file: File, registrationId?: number): Promise<string | null> => {
  if (!file) return null;
  
  // 检查是否为图片类型，图片应该使用base64
  if (file.type.startsWith('image/')) {
    console.warn('图片类型文件应该使用base64格式，不应调用此函数');
    return null;
  }
  
  // 判断是否是大文件
  const isLargeFile = (file.type.includes('video') && file.size > 500 * 1024 * 1024) || 
                     ((file.type.includes('zip') || 
                     file.type.includes('rar') || 
                     file.type.includes('7z') || 
                     file.type.includes('tar') || 
                     file.type.includes('gzip')) && 
                     file.size > 200 * 1024 * 1024); // 视频>50MB或压缩包>20MB视为大文件
  
  console.log(`开始上传文件: ${file.name}, ${isLargeFile ? '这是大文件，可能需要较长时间' : ''}`);
  
  // 创建FormData - 保持简单，只使用必要字段
  const formData = new FormData();
  formData.append('file', file); // 文件对象
  formData.append('field_type', 'file'); // 字段类型
  
  // 如果有报名ID，添加到请求中以建立关联
  if (registrationId) {
    formData.append('registration_id', String(registrationId));
  }
  
  // 设置上传状态
  if (!uploadStatus.value) {
    uploadStatus.value = {};
  }
  const fieldKey = `upload_${file.name}`;
  uploadStatus.value[fieldKey] = {
    status: 'uploading',
    message: '准备上传...'
  };
  
  try {
    // 准备API URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://47.245.102.255:9988';
    const url = `${baseUrl}/forms/upload-file`;
    
    // 使用XMLHttpRequest实现上传进度监控
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 监听上传进度
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`上传进度: ${percentComplete}%`);
          
          // 更新上传状态与进度
          uploadStatus.value[fieldKey] = {
            status: 'uploading',
            message: `上传中: ${percentComplete}%`
          };
          
          // 显示额外信息
          if (isLargeFile && percentComplete < 100) {
            uploadStatus.value[fieldKey] = {
              status: 'uploading',
              message: `大文件上传中: ${percentComplete}%, 请耐心等待...`
            };
            
            if (percentComplete === 99) {
              uploadStatus.value[fieldKey] = {
                status: 'uploading',
                message: `大文件处理中，请等待服务器处理...`
              };
            }
          }
        }
      };
      
      // 上传完成
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          // 解析响应
          try {
            const result = JSON.parse(xhr.responseText);
            
            // 处理成功响应
            if (result.success) {
              console.log(`文件上传成功，路径:`, result.data.file_path);
              
              // 更新上传状态
              uploadStatus.value[fieldKey] = {
                status: 'success',
                message: '上传成功'
              };
              
              resolve(result.data.file_path);
            } else {
              console.error(`文件上传失败:`, result.message || '未知错误');
              
              // 更新上传状态
              uploadStatus.value[fieldKey] = {
                status: 'error',
                message: result.message || '上传失败'
              };
              
              ElMessage.error(`文件上传失败: ${result.message || '未知错误'}`);
              resolve(null);
            }
          } catch (parseError) {
            console.error('解析响应失败:', parseError);
            
            // 更新上传状态
            uploadStatus.value[fieldKey] = {
              status: 'error',
              message: '解析响应失败'
            };
            
            ElMessage.error('解析服务器响应失败');
            resolve(null);
          }
        } else {
          console.error(`文件上传HTTP错误:`, xhr.status, xhr.statusText);
          
          // 更新上传状态
          uploadStatus.value[fieldKey] = {
            status: 'error',
            message: `服务器错误 (${xhr.status})`
          };
          
          ElMessage.error(`文件上传失败: HTTP错误 ${xhr.status}`);
          resolve(null);
        }
      };
      
      // 上传错误
      xhr.onerror = function() {
        console.error(`文件上传网络错误`);
        
        // 更新上传状态
        uploadStatus.value[fieldKey] = {
          status: 'error',
          message: '网络错误'
        };
        
        ElMessage.error(`文件上传失败: 网络错误`);
        resolve(null);
      };
      
      // 打开连接
      xhr.open('POST', url, true);
      
      // 设置认证头
      xhr.setRequestHeader('Authorization', `Bearer ${userStore.token}`);
      
      // 发送请求
      xhr.send(formData);
    });
  } catch (error: any) {
    console.error(`文件上传异常:`, error);
    
    // 更新上传状态
    uploadStatus.value[fieldKey] = {
      status: 'error',
      message: error.message || '未知错误'
    };
    
    ElMessage.error(`文件上传异常: ${error.message || '未知错误'}`);
    return null;
  }
}

// 处理所有文件，返回处理结果
const processAllFiles = async (): Promise<Record<number, { type: string, content: string | null }>> => {
  try {
    const result: Record<number, { type: string, content: string | null }> = {};
    
    // 获取所有包含文件的字段
    const fieldsWithFiles = formFields.value.filter(field => 
      (field.field_type === 'file' || field.field_type === 'image') &&
      fileList.value[field.id] && 
      fileList.value[field.id].length > 0
    );
    
    console.log(`需要处理的文件字段数量: ${fieldsWithFiles.length}`);
    
    // 处理每个字段
    for (const field of fieldsWithFiles) {
      const fileItem = fileList.value[field.id][0];
      
      if (!fileItem) continue;
      
      if (field.field_type === 'image') {
        // 图片转换为base64
        if (fileItem.raw) {
          try {
            // 如果已经有url(base64)，直接使用
            if (fileItem.url) {
              result[field.id] = {
                type: 'image',
                content: fileItem.url
              };
            } else {
              // 否则转换
              const base64Data = await getBase64(fileItem.raw);
              result[field.id] = {
                type: 'image',
                content: base64Data
              };
            }
            console.log(`图片转换成功: field_id=${field.id}`);
          } catch (error) {
            console.error(`图片转换失败: field_id=${field.id}`, error);
            result[field.id] = {
              type: 'image',
              content: null
            };
          }
        } else if (fileItem.url) {
          // 已经有URL，直接使用
          result[field.id] = {
            type: 'image',
            content: fileItem.url
          };
        }
      } else if (field.field_type === 'file') {
        // 普通文件上传
        if (fileItem.raw) {
          const filePath = await uploadFile(fileItem.raw);
          result[field.id] = {
            type: 'file',
            content: filePath
          };
          console.log(`文件上传成功: field_id=${field.id}, 路径=${filePath}`);
        } else {
          // 已经有路径/URL，直接使用
          result[field.id] = {
            type: 'file',
            content: fileItem.url || null
          };
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error('处理文件时出错:', error);
    ElMessage.error('处理文件时发生错误，请重试');
    return {};
  }
}

// 移除已选择的文件
const removeFile = (field: FormField) => {
  console.log(`移除文件: field_id=${field.id}`);
  
  // 清空文件列表
  fileList.value[field.id] = [];
  
  // 清空formData中的值
  formData.value[`field_${field.id}`] = '';
  
  // 清除localStorage缓存
  try {
    localStorage.removeItem(`file_field_${field.id}_name`);
    localStorage.removeItem(`file_field_${field.id}_size`);
    localStorage.removeItem(`file_field_${field.id}_type`);
  } catch (e) {
    console.warn('无法从localStorage删除文件信息:', e);
  }
  
  console.log(`文件已移除: field_id=${field.id}`);
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;
  
  // 声明loading实例变量
  let loadingInstance: any = null;
  
  try {
    // 表单验证
    await formRef.value.validate();
    
    // 显示全屏加载动画
    loadingInstance = ElLoading.service({
      lock: true,
      text: '正在提交报名信息，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    });
    
    submitting.value = true;
    loading.value = true;

    // 检查活动ID
    if (!competitionId.value) {
      ElMessage.error('活动ID无效，请返回重试');
      submitting.value = false;
      loading.value = false;
      loadingInstance.close(); // 关闭加载动画
      return;
    }
    
    // 编辑模式 - 编辑模式下的流程不变，仍然直接提交表单信息
    if (isEditMode.value) {
      try {
        // 直接提交表单信息（包括基本信息和附加字段）
        await submitAdditionalInfo();
        
        ElMessage.success('更新成功');
        router.push('/user/profile');
      } catch (error) {
        console.error('编辑模式提交失败:', error);
        ElMessage.error('更新失败，请重试');
      }
      
      submitting.value = false;
      loading.value = false;
      loadingInstance.close(); // 关闭加载动画
      return;
    }
    
    // 创建模式 - 按照网络请求截图正确的顺序执行
    try {
      console.log('======== 开始执行报名流程 ========');
      console.log('流程：1.创建报名记录 -> 2.上传文件 -> 3.提交enhanced-data');
      
      let registrationId = null;
      
      // 步骤1: 创建报名记录获取ID
      console.log('======== 步骤1: 创建报名记录 ========');
      try {
        const response = await request.post(
          `/competitions/${competitionId.value}/register`,
          {
            team_name: formData.value.team_name,
            contact_phone: String(formData.value.contact_phone)
          }
        );
        
        console.log('创建报名记录响应:', response?.data);
        
        // 获取报名ID
        if (response?.data && response.data.id) {
          registrationId = response.data.id;
        } else if (response?.data && response.data.registration_id) {
          registrationId = response.data.registration_id;
        } else {
          console.error('无法获取报名ID，服务器返回:', response?.data);
          throw new Error('创建报名失败，无法获取报名ID');
        }
        
        console.log(`成功创建报名记录，ID: ${registrationId}`);
      } catch (error) {
        console.error('步骤1失败 - 创建报名记录出错:', error);
        throw error;
      }
      
      // 步骤2: 上传所有文件
      console.log('======== 步骤2: 上传文件 ========');
      // 创建一个文件上传结果映射表，用于步骤3中的表单提交
      const fileUploadResults: Record<number, { type: string, content: string }> = {};
      
      try {
        const fileUploadPromises = [];
        const fileFieldsToProcess = [];
        
        // 查找需要上传的文件
        for (const field of formFields.value) {
          if ((field.field_type === 'file' || field.field_type === 'image') && 
              fileList.value[field.id]?.length > 0 && 
              fileList.value[field.id][0].raw) {
            fileFieldsToProcess.push(field);
          }
        }
        
        console.log(`找到${fileFieldsToProcess.length}个需要上传的文件字段`);
        
        if (fileFieldsToProcess.length > 0) {
          for (const field of fileFieldsToProcess) {
            const fileItem = fileList.value[field.id][0];
            
            if (field.field_type === 'file' && fileItem.raw) {
              console.log(`准备上传文件: field_id=${field.id}, 文件名=${fileItem.name || '未知'}`);
              
              // 对于普通文件，使用uploadFile函数
              const promise = uploadFile(fileItem.raw, registrationId).then(filePath => {
                if (filePath) {
                  // 更新fileList中的URL
                  fileItem.url = filePath;
                  // 清除raw，表示文件已上传
                  fileItem.raw = null;
                  console.log(`文件上传成功: field_id=${field.id}, path=${filePath}`);
                  
                  // 保存上传结果，供步骤3使用
                  fileUploadResults[field.id] = {
                    type: 'file',
                    content: filePath
                  };
                } else {
                  throw new Error(`文件${fileItem.name || '未知'}上传失败`);
                }
              });
              fileUploadPromises.push(promise);
            } else if (field.field_type === 'image' && fileItem.raw) {
              console.log(`准备处理图片: field_id=${field.id}, 文件名=${fileItem.name || '未知'}`);
              
              // 对于图片文件，转换为base64
              if (!fileItem.url || fileItem.url.startsWith('blob:')) {
                const promise = convertImageToBase64(fileItem.raw).then(base64Data => {
                  fileItem.url = base64Data;
                  fileItem.raw = null;
                  console.log(`图片转换成功: field_id=${field.id}`);
                  
                  // 保存转换结果，供步骤3使用
                  fileUploadResults[field.id] = {
                    type: 'image',
                    content: base64Data
                  };
                });
                fileUploadPromises.push(promise);
              }
            }
          }
          
          // 等待所有文件上传完成
          console.log('等待所有文件上传完成...');
          await Promise.all(fileUploadPromises);
          console.log('所有文件上传完成');
        } else {
          console.log('没有需要上传的文件，跳过文件上传步骤');
        }
      } catch (error) {
        console.error('步骤2失败 - 文件上传过程中出错:', error);
        throw error;
      }
      
      // 步骤3: 提交表单数据（enhanced-data）
      console.log('======== 步骤3: 提交增强表单数据 ========');
      try {
        console.log(`使用报名ID: ${registrationId} 提交增强表单数据`);
        
        // 构建表单项，包括文本字段和上传的文件
        const formItems = [];
        
        // 添加基本字段的ID常量
        const TEAM_NAME_FIELD_ID = 1; // 团队名称字段ID - 部署前请替换为实际ID
        const CONTACT_PHONE_FIELD_ID = 2; // 联系电话字段ID - 部署前请替换为实际ID
        
        // 添加基本团队信息作为文本字段，使用正确的数字ID
        if (formData.value.team_name) {
          formItems.push({
            field_id: TEAM_NAME_FIELD_ID,  // 使用数字ID
            field_type: 'text',
            content: formData.value.team_name
          });
        }
        
        if (formData.value.contact_phone) {
          formItems.push({
            field_id: CONTACT_PHONE_FIELD_ID,  // 使用数字ID
            field_type: 'text',
            content: formData.value.contact_phone
          });
        }
        
        // 处理所有表单字段
        for (const field of formFields.value) {
          const fieldId = field.id;
          const fieldType = field.field_type;
          
          // 跳过没有ID的字段
          if (!fieldId) continue;
          
          // 根据字段类型处理
          if (fieldType === 'text') {
            // 文本字段 - 直接获取值
            const textValue = formData.value[`field_${fieldId}`] || '';
            formItems.push({
              field_id: fieldId,
              field_type: 'text',
              content: textValue
            });
          } else if (fieldType === 'image' || fieldType === 'file') {
            // 文件字段 - 使用步骤2中上传的结果
            if (fileUploadResults[fieldId]) {
              // 如果有上传结果，使用实际内容
              formItems.push({
                field_id: fieldId,
                field_type: fieldType,
                content: fileUploadResults[fieldId].content
              });
            } else if (fileList.value[fieldId]?.length > 0 && fileList.value[fieldId][0].url) {
              // 如果没有上传结果但有URL (可能是已有的文件)
              formItems.push({
                field_id: fieldId,
                field_type: fieldType,
                content: fileList.value[fieldId][0].url
              });
            }
          }
        }
        
        // 构建payload
        const payload = {
          items: formItems
        };
        
        // 记录提交数据
        console.log('准备提交增强表单数据:');
        logRequestDetails('POST', `/forms/registrations/${registrationId}/enhanced-data`, payload);
        
        // 提交增强表单数据
        const result = await request.post(
          `/forms/registrations/${registrationId}/enhanced-data`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userStore.token}`
            }
          }
        );
        
        console.log('增强表单数据提交成功:', result.data);
      } catch (error) {
        console.error('步骤3失败 - 提交增强表单数据出错:', error);
        throw error;
      }
      
      console.log('======== 报名流程完成 ========');
      ElMessage.success('报名成功');
      router.push('/user/profile');
    } catch (err: any) {
      console.error('报名流程失败:', err);
      
      // 错误处理
      if (err.response) {
        const statusCode = err.response.status;
        let errorMessage = '未知错误';
        
        if (statusCode === 422) {
          errorMessage = '表单数据验证失败';
          if (err.response.data && err.response.data.detail) {
            errorMessage = `数据验证失败: ${err.response.data.detail}`;
          }
        } else if (statusCode === 409) {
          errorMessage = '已经报名过此活动';
        } else if (err.response.data && err.response.data.detail) {
          errorMessage = err.response.data.detail;
        }
        
        ElMessage.error(`报名失败: ${errorMessage}`);
      } else {
        ElMessage.error(`报名失败: ${err.message || '网络错误'}`);
      }
    }
    
    submitting.value = false;
    loading.value = false;
    loadingInstance.close(); // 关闭加载动画
  } catch (error) {
    console.error('表单验证失败:', error);
    ElMessage.error('请完成必填字段');
    submitting.value = false;
    loading.value = false;
    
    // 如果加载动画存在，关闭它
    if (loadingInstance) {
      loadingInstance.close();
    }
  } finally {
    // 确保无论如何都关闭加载
    if (loadingInstance) {
      loadingInstance.close();
    }
  }
}

// 新增：提交附加信息的函数
const submitAdditionalInfo = async (explicitRegistrationId?: number) => {
  if (!formRef.value) return;
 
  try {
    // 表单验证
    await formRef.value.validate();
  
    submitting.value = true;
    loading.value = true;
  
    // 检查活动ID
    if (!competitionId.value) {
      ElMessage.error('活动ID无效，请返回重试');
      submitting.value = false;
      loading.value = false;
      return;
    }
  
    if (!Array.isArray(formFields.value) || formFields.value.length === 0) {
      ElMessage.warning('未找到表单字段，可能不需要额外信息')
    }
    
    // 确定使用哪个registrationId
    // 优先级：显式传入的ID > 当前编辑的ID > 默认值0
    const submitId = explicitRegistrationId || (isEditMode.value ? registrationId.value : 0);
    
    // 如果创建模式下没有ID，则需要创建一个新报名
    if (!isEditMode.value && !submitId) {
      // 报错，因为根据API文档我们需要有一个registrationId
      ElMessage.error('新建模式下需要先创建报名记录获取ID');
      submitting.value = false;
      loading.value = false;
      return;
    }
    
    // 按照流程图组装表单数据
    const formItems: any[] = [];
    
    // 添加基本字段的ID常量
    const TEAM_NAME_FIELD_ID = 1; // 团队名称字段ID - 部署前请替换为实际ID
    const CONTACT_PHONE_FIELD_ID = 2; // 联系电话字段ID - 部署前请替换为实际ID
    
    // 添加基本团队信息作为文本字段，使用正确的数字ID
    if (formData.value.team_name) {
      formItems.push({
        field_id: TEAM_NAME_FIELD_ID,  // 使用数字ID
        field_type: 'text',
        content: formData.value.team_name
      });
    }
    
    if (formData.value.contact_phone) {
      formItems.push({
        field_id: CONTACT_PHONE_FIELD_ID,  // 使用数字ID
        field_type: 'text',
        content: formData.value.contact_phone
      });
    }

    // 处理所有表单字段
    for (const field of formFields.value) {
      const fieldId = field.id;
      const fieldType = field.field_type;

      // 跳过没有ID的字段
      if (!fieldId) continue;

      // 根据字段类型不同处理
      if (fieldType === 'text') {
        // 文本字段 - 直接获取值
        const textValue = formData.value[`field_${fieldId}`] || '';
        formItems.push({
          field_id: fieldId,
          field_type: 'text',
          content: textValue
        });
      } else if (fieldType === 'image') {
        // 图片字段 - 在提交enhanced-data阶段只添加占位符，实际文件稍后上传
        // 检查是否有文件
        if (fileList.value[fieldId] && fileList.value[fieldId].length > 0) {
          formItems.push({
            field_id: fieldId,
            field_type: 'image',
            content: '将在下一步上传' // 占位符内容，实际文件会在步骤3上传
          });
        }
      } else if (fieldType === 'file') {
        // 文件字段 - 在提交enhanced-data阶段只添加占位符，实际文件稍后上传
        // 检查是否有文件
        if (fileList.value[fieldId] && fileList.value[fieldId].length > 0) {
          formItems.push({
            field_id: fieldId,
            field_type: 'file',
            content: '将在下一步上传' // 占位符内容，实际文件会在步骤3上传
          });
        }
      }
    }
    
    // 构建正确的payload格式
    const payload = {
      items: formItems
    };
    
    // 记录提交数据
    console.log('准备提交表单数据(enhanced-data):');
    logRequestDetails('POST', `/forms/registrations/${submitId}/enhanced-data`, payload);
    
    // 发送请求
    try {
      const result = await request.post(
        `/forms/registrations/${submitId}/enhanced-data`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userStore.token}`
          }
        }
      );
      
      // 记录响应结果
      console.log('表单提交成功:');
      if (result.data) {
        logResponseDetails(result.status, result.data);
      }
      
      console.log('enhanced-data提交成功，返回结果:', result.data);
      return result;
    } catch (err: any) {
      console.error('提交表单数据失败:', err.response || err);
      
      // 提取服务器错误信息
      if (err.response?.data) {
        const serverMsg = err.response.data.message || 
                         err.response.data.detail || 
                         '服务器处理表单数据时出错';
        ElMessage.error(`提交失败: ${serverMsg}`);
      } else {
        ElMessage.error(`提交失败: ${err.message || '未知错误'}`);
      }
      
      submitting.value = false;
      loading.value = false;
      throw err;
    }
  } catch (error: any) {
    console.error('提交附加信息失败:', error);

    // 显示错误消息
    ElMessage.error(`提交失败: ${
      error.response?.data?.message || 
      error.response?.data?.detail?.message || 
      error.message || 
      '请检查表单数据'
    }`);

    throw error;
  } finally {
    submitting.value = false;
  }
}

// 删除单个字段提交函数，改用一次性提交所有字段
// 保留函数定义，但内部实现改为警告信息，防止代码其他地方调用
const submitSingleFieldData = async (fieldId: number, fieldType: string, content: any) => {
  console.warn('单字段提交已弃用，请使用一次性提交所有字段');
  ElMessage.warning('系统不支持单个字段提交，请使用一次性提交');
  throw new Error('方法已弃用');
}

// 生成表单验证规则
const rules = computed<FormRules>(() => {
  const rulesObj: FormRules = {
    team_name: [
      { required: true, message: '请输入团队名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
    ],
    contact_phone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
  };
  
  // 添加自定义字段验证规则
  if (Array.isArray(formFields.value)) {
    formFields.value.forEach(field => {
      if (!field) return;
      
      const isRequired = field.is_required === true || field.is_required === 1 || field.is_required === '1';
      
      if (isRequired) {
        if (field.field_type === 'text' || field.field_type === 'radio') {
          rulesObj[`field_${field.id}`] = [
            { required: true, message: `请${field.field_type === 'radio' ? '选择' : '填写'}${field.field_label}`, trigger: field.field_type === 'radio' ? 'change' : 'blur' }
          ]
        } else if (field.field_type === 'image' || field.field_type === 'file') {
          rulesObj[`field_${field.id}`] = [
            { 
              validator: (_rule: any, _value: any, callback: Function) => {
                if (!fileList.value[field.id] || fileList.value[field.id].length === 0) {
                  callback(new Error(`请上传${field.field_label}`))
                } else {
                  callback()
                }
              }, 
              trigger: 'change' 
            }
          ]
        }
      }
    });
  }
  
  return rulesObj
})

// 检查表单中的文件字段是否已填写
const validateFileFields = () => {
  let isValid = true
  
  // 确保formFields存在且是数组
  if (!Array.isArray(formFields.value)) {
    console.warn('表单字段不是数组，跳过文件验证')
    return true
  }
  
  console.log('开始验证文件字段...');
  
  // 检查必填的文件和图片字段
  formFields.value.forEach(field => {
    if (field && field.is_required && (field.field_type === 'file' || field.field_type === 'image')) {
      console.log(`验证文件字段: field_id=${field.id}, field_type=${field.field_type}, field_label=${field.field_label}`);
      console.log(`文件列表状态: `, fileList.value[field.id]);
      
      // 确保fileList和fileList[field.id]存在
      if (!fileList.value || !fileList.value[field.id] || !Array.isArray(fileList.value[field.id]) || fileList.value[field.id].length === 0) {
        console.error(`文件验证失败: field_id=${field.id}, field_label=${field.field_label}`);
        
        // 尝试从localStorage恢复文件信息
        const fileName = localStorage.getItem(`file_field_${field.id}_name`);
        if (fileName) {
          console.log(`从localStorage找到文件信息: field_id=${field.id}, fileName=${fileName}`);
          
          // 提醒用户，但不要自动恢复，以免混淆
          ElMessage.warning(`发现缓存的文件 "${fileName}"，但您需要重新选择文件`);
        }
        
        ElMessage.error(`请上传${field.field_label}`)
        isValid = false
      } else {
        console.log(`文件验证通过: field_id=${field.id}, fileName=${fileList.value[field.id][0]?.name || '未知'}`);
      }
    }
  })
  
  console.log('文件字段验证结果:', isValid ? '通过' : '未通过');
  return isValid
}

// 通过文件路径获取文件
const getFileByPath = async (filePath: string): Promise<string | null> => {
  try {
    console.log(`尝试通过路径获取文件: ${filePath}`);
    
    // 判断是否为完整URL
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      console.log('文件路径是完整URL，直接返回');
      return filePath;
    }
    
    // 发送请求获取文件
    const response = await request.post('/files/by-path', 
      { file_path: filePath },
      { 
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userStore.token}`
        }
      }
    );
    
    console.log('文件获取响应:', response);
    
    // 如果响应是Blob类型，说明是文件，转为URL
    if (response instanceof Blob) {
      const fileUrl = URL.createObjectURL(response);
      console.log(`已创建文件blob URL: ${fileUrl}`);
      return fileUrl;
    } else if (typeof response === 'object' && response !== null) {
      // 如果响应是对象，可能是错误信息
      console.error('获取文件失败，返回对象而非文件:', response);
      ElMessage.warning('无法加载文件预览');
      return null;
    }
    
    // 如果响应未知类型，尝试返回
    return String(response) || null;
  } catch (error) {
    console.error('通过路径获取文件失败:', error);
    ElMessage.warning('无法加载文件预览');
    return null;
  }
}

// 处理文件URL加载
const processFileUrl = async (fileItem: FileItem, forceLoad: boolean = false): Promise<void> => {
  // 如果关闭了自动加载预览且不是强制加载，直接返回
  if (!AUTO_LOAD_FILE_PREVIEW && !forceLoad) {
    console.log('自动文件预览已关闭，跳过预览加载');
    return;
  }
  
  if (!fileItem.url) return;
  
  // 如果URL已经是blob:或data:开头，表示已经处理过，不需要重复处理
  if (fileItem.url.startsWith('blob:') || fileItem.url.startsWith('data:')) {
    return;
  }
  
  // 调用API获取文件内容并更新URL
  const fileUrl = await getFileByPath(fileItem.url);
  if (fileUrl) {
    fileItem.url = fileUrl;
  }
}

onMounted(async () => {
  try {
    console.log('组件加载开始...');
    
    // 检查登录状态
    if (!userStore.token) {
      console.warn('用户未登录，跳转到登录页面');
      ElMessage.warning('请先登录后再报名')
      router.push('/auth/login')
      return
    }
    
    // 检查活动ID是否有效
    if (!competitionId.value) {
      console.error('无效的活动ID:', route.params.id);
      ElMessage.error('无效的活动ID，请返回列表页');
      router.push('/competitions');
      return;
    }
    
    console.log('开始加载活动ID:', competitionId.value);
    
    try {
      await loadFormFields();
      console.log('表单字段加载完成');
    } catch (fieldsError) {
      console.error('加载表单字段失败:', fieldsError);
      ElMessage.error('无法加载表单字段，请刷新页面重试');
      return;
    }
    
    // 编辑模式加载
    if (isEditMode.value) {
      console.log('当前是编辑模式, registrationId =', registrationId.value);
      
      if (!registrationId.value) {
        console.error('编辑模式下缺少有效的报名ID');
        ElMessage.error('缺少有效的报名ID，无法编辑报名信息');
        router.push('/user/profile');
        return;
      }
      
      try {
        await loadRegistrationData();
        console.log('报名数据加载完成');
      } catch (registrationError) {
        console.error('加载报名数据失败:', registrationError);
        // loadRegistrationData内部已经处理了错误，这里不需要额外处理
      }
    } else {
      console.log('当前是新建报名模式');
    }
    
    console.log('组件加载完成');
  } catch (error) {
    console.error('组件加载过程中发生未捕获的错误:', error);
    ElMessage.error('页面加载失败，请刷新重试');
  }
})

// 控制是否自动加载文件预览的开关
const AUTO_LOAD_FILE_PREVIEW = false;

// 手动加载文件预览
const loadFilePreview = async (field: FormField) => {
  try {
    if (!field || !field.id || !fileList.value[field.id] || fileList.value[field.id].length === 0) {
      console.warn(`字段${field.id}没有可加载的文件`);
      return;
    }
    
    const fileItem = fileList.value[field.id][0];
    if (!fileItem.url) {
      console.warn(`字段${field.id}的文件没有URL`);
      return;
    }
    
    // 设置上传状态为正在加载
    uploadStatus.value[`field_${field.id}`] = {
      status: 'uploading',
      message: '正在加载预览...'
    };
    
    // 处理文件URL，强制加载
    await processFileUrl(fileItem, true);
    
    // 更新上传状态为成功
    uploadStatus.value[`field_${field.id}`] = {
      status: 'success',
      message: '预览已加载'
    };
    
    console.log(`字段${field.id}的文件预览已加载`);
  } catch (error) {
    console.error(`加载字段${field.id}的文件预览失败:`, error);
    
    // 更新上传状态为失败
    uploadStatus.value[`field_${field.id}`] = {
      status: 'error',
      message: '预览加载失败'
    };
  }
}

// 检查文件是否需要加载预览
const needsPreviewLoading = (field: FormField): boolean => {
  if (!field || !field.id || !fileList.value[field.id] || fileList.value[field.id].length === 0) {
    return false;
  }
  
  const fileItem = fileList.value[field.id][0];
  if (!fileItem || !fileItem.url) {
    return false;
  }
  
  // 如果URL已经是blob:或data:开头，表示已经处理过，不需要加载
  return !(fileItem.url.startsWith('blob:') || fileItem.url.startsWith('data:'));
}

// 检查文件是否已加载预览
const hasLoadedPreview = (field: FormField): boolean => {
  if (!field || !field.id || !fileList.value[field.id] || fileList.value[field.id].length === 0) {
    return false;
  }
  
  const fileItem = fileList.value[field.id][0];
  if (!fileItem || !fileItem.url) {
    return false;
  }
  
  // 如果URL是blob:或data:开头，表示已经加载了预览
  return fileItem.url.startsWith('blob:') || fileItem.url.startsWith('data:');
}

// 打开文件预览
const openFilePreview = (field: FormField) => {
  if (!field || !field.id || !fileList.value[field.id] || fileList.value[field.id].length === 0) {
    console.warn(`字段${field.id}没有可预览的文件`);
    return;
  }
  
  const fileItem = fileList.value[field.id][0];
  if (!fileItem.url) {
    console.warn(`字段${field.id}的文件没有URL`);
    ElMessage.warning('文件未加载，无法预览');
    return;
  }
  
  // 如果URL已经是blob:或data:开头，可以直接打开
  if (fileItem.url.startsWith('blob:') || fileItem.url.startsWith('data:')) {
    // 在新窗口中打开
    window.open(fileItem.url, '_blank');
  } else {
    // 如果没有加载过预览，提示用户先加载
    ElMessage.warning('请先加载文件预览');
  }
}

// 将图片文件转换为base64格式
const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 检查文件大小 (5MB限制)
    const maxSize = 50 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      console.error(`图片${file.name}过大，超过5MB限制`);
      reject(new Error(`图片大小超过5MB限制，请压缩后重试`));
      return;
    }
    
    // 检查是否为支持的图片类型
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!supportedTypes.includes(file.type)) {
      console.error(`不支持的图片类型: ${file.type}`);
      reject(new Error(`不支持的图片类型: ${file.type}，仅支持JPG和PNG`));
      return;
    }
    
    console.log(`开始转换图片 ${file.name} 为base64格式`);
    
    // 使用FileReader直接返回data:URL格式的base64
    const reader = new FileReader();
    reader.readAsDataURL(file); // 这会返回包含MIME类型前缀的base64
    reader.onload = () => {
      const base64Data = reader.result as string;
      console.log(`图片${file.name}转换成功，大小: ${base64Data.length} bytes`);
      // 直接返回完整的data:URL形式的base64，包含前缀
      resolve(base64Data);
    };
    reader.onerror = (error) => {
      console.error(`图片转换失败: ${error}`);
      reject(error);
    };
  });
};

// 用于记录请求细节的辅助函数，方便调试
const logRequestDetails = (method: string, url: string, data: any) => {
  console.log(`${method} 请求: ${url}`);
  console.log('请求数据:', data);
  
  // 检查并警告可能存在的字段ID类型问题
  if (data && Array.isArray(data.items)) {
    data.items.forEach((item: any, index: number) => {
      if (item.field_id !== undefined && typeof item.field_id !== 'number') {
        console.error(`警告: items[${index}].field_id "${item.field_id}" 不是数字类型，API要求field_id必须是整数`);
      }
    });
  }
};

// 用于记录响应细节的辅助函数，方便调试
const logResponseDetails = (status: number, data: any) => {
  console.log(`响应状态: ${status}`);
  console.log('响应数据:', data);
};

// 打印文件详情的辅助函数
const logFileDetails = (file: File) => {
  console.log('文件信息:', {
    name: file.name,
    size: `${(file.size / 1024).toFixed(2)} KB`,
    type: file.type,
    lastModified: new Date(file.lastModified).toISOString()
  });
};

// 验证表单项中的field_id都是数字类型
const validateFormItems = (items: any[]): any[] => {
  return items.map(item => {
    // 复制一份避免修改原对象
    const newItem = { ...item };
    
    // 如果field_id是字符串，尝试转换为数字
    if (typeof newItem.field_id === 'string') {
      const numId = parseInt(newItem.field_id, 10);
      if (!isNaN(numId)) {
        console.warn(`字段ID "${newItem.field_id}" 是字符串类型，已自动转换为数字: ${numId}`);
        newItem.field_id = numId;
      } else {
        console.error(`无法将字段ID "${newItem.field_id}" 转换为数字，这可能导致API验证错误`);
      }
    }
    
    return newItem;
  });
};

// 获取文件类型图标
const getFileTypeIcon = (fileName: string | undefined): string => {
  if (!fileName) return 'el-icon-document';
  
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  // 根据文件扩展名返回适当的图标
  if (['pdf'].includes(extension)) {
    return 'el-icon-document-checked';
  } else if (['doc', 'docx', 'txt'].includes(extension)) {
    return 'el-icon-document-text';
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(extension)) {
    return 'el-icon-video-play';
  } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
    return 'el-icon-folder-zip';
  } else if (['ppt', 'pptx'].includes(extension)) {
    return 'el-icon-presentation';
  } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
    return 'el-icon-table';
  }
  
  return 'el-icon-document';
}

/**
 * 将Blob URL转换为base64编码
 * @param blobUrl 浏览器生成的blob URL
 * @returns Promise<string> 返回base64编码的数据
 */
const convertBlobUrlToBase64 = async (blobUrl: string): Promise<string> => {
  try {
    if (!blobUrl || !blobUrl.startsWith('blob:')) {
      console.warn('不是有效的Blob URL:', blobUrl);
      return blobUrl;
    }
    
    // 获取blob对象
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result是base64字符串
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Blob URL转换为base64失败:', error);
    throw error;
  }
};

// 查找现有的提交表单函数
const submitForm = async () => {
  let loadingInstance: any = null;
  
  try {
    // 使用formRef.validate进行表单验证，与handleSubmit保持一致
    if (!formRef.value) return;
    await formRef.value.validate();
    
    // 显示全屏加载动画
    loadingInstance = ElLoading.service({
      lock: true,
      text: '正在提交报名信息，请稍候...',
      background: 'rgba(0, 0, 0, 0.7)'
    });

    submitting.value = true;
    
    // 继续其他代码...
  } catch (error) {
    console.error('提交表单失败:', error);
    ElMessage.error(`提交失败: ${error.response?.data?.detail || error.message || '未知错误'}`);
  } finally {
    submitting.value = false;
    
    // 关闭加载动画
    if (loadingInstance) {
      loadingInstance.close();
    }
  }
}

// 修改：构建表单项
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
  
  // 处理自定义字段
  formFields.value.forEach(field => {
    const fieldId = field.id
    const fieldValue = formData.value[`field_${fieldId}`]
    
    if (fieldValue !== undefined && fieldValue !== '') {
      if (field.field_type === 'text' || field.field_type === 'radio') {
        formItems.push({
          field_id: fieldId,
          field_type: field.field_type,
          content: fieldValue
        })
      }
    }
  })
  
  return formItems
}

// 修改：验证规则生成
const rules = computed<FormRules>(() => {
  const rulesObj: FormRules = {
    team_name: [
      { required: true, message: '请输入团队名称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在2到50个字符', trigger: 'blur' }
    ],
    contact_phone: [
      { required: true, message: '请输入联系电话', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
    ]
  }
  
  // 添加自定义字段验证规则
  if (Array.isArray(formFields.value)) {
    formFields.value.forEach(field => {
      if (!field) return
      
      const isRequired = field.is_required === true || field.is_required === 1 || field.is_required === '1'
      
      if (isRequired) {
        if (field.field_type === 'text' || field.field_type === 'radio') {
          rulesObj[`field_${field.id}`] = [
            { required: true, message: `请${field.field_type === 'radio' ? '选择' : '填写'}${field.field_label}`, trigger: field.field_type === 'radio' ? 'change' : 'blur' }
          ]
        } else if (field.field_type === 'image' || field.field_type === 'file') {
          rulesObj[`field_${field.id}`] = [
            { 
              validator: (_rule: any, _value: any, callback: Function) => {
                if (!fileList.value[field.id] || fileList.value[field.id].length === 0) {
                  callback(new Error(`请上传${field.field_label}`))
                } else {
                  callback()
                }
              }, 
              trigger: 'change' 
            }
          ]
        }
      }
    })
  }
  
  return rulesObj
})
</script>

<template>
  <div>
    <!-- 加载状态 -->
    <div v-if="loading" class="flex justify-center py-12">
      <el-spinner size="large" />
    </div>
    
    <template v-else-if="competition">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">{{ competition.title }} - 报名表</h1>
        <p class="text-gray-500 dark:text-gray-400">
          请填写以下信息完成报名
        </p>
      </div>
      
      <div class="card">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
          @submit.prevent="handleSubmit"
        >
          <!-- 基本信息 -->
          <h2 class="text-xl font-semibold mb-4">基本信息</h2>
          
          <el-form-item label="团队名称" prop="team_name">
            <el-input 
              v-model="formData.team_name" 
              placeholder="请输入团队名称" 
              @input="(value: string) => handleBasicInfoChange('team_name', value)"
            />
            <!-- 添加上传状态指示器 -->
            <div v-if="uploadStatus['team_name']" class="mt-1 text-xs">
              <span v-if="uploadStatus['team_name'].status === 'uploading'" class="text-blue-500">
                <i class="fas fa-sync fa-spin mr-1"></i> 保存中...
              </span>
              <span v-else-if="uploadStatus['team_name'].status === 'success'" class="text-green-500">
                <i class="fas fa-check mr-1"></i> 已保存
              </span>
              <span v-else-if="uploadStatus['team_name'].status === 'error'" class="text-red-500">
                <i class="fas fa-times mr-1"></i> 保存失败
              </span>
            </div>
          </el-form-item>
          
          <el-form-item label="联系电话" prop="contact_phone">
            <el-input
              v-model="formData.contact_phone"
              type="text"
              placeholder="请输入联系电话"
            />
            <div v-if="uploadStatus['contact_phone']" class="mt-1 text-xs">
              <span v-if="uploadStatus['contact_phone'].status === 'uploading'" class="text-blue-500">
                <i class="el-icon-loading mr-1"></i> {{ uploadStatus['contact_phone'].message || '保存中...' }}
              </span>
              <span v-else-if="uploadStatus['contact_phone'].status === 'success'" class="text-green-500">
                <i class="el-icon-check-circle mr-1"></i> {{ uploadStatus['contact_phone'].message || '已保存' }}
              </span>
              <span v-else-if="uploadStatus['contact_phone'].status === 'error'" class="text-red-500">
                <i class="el-icon-error mr-1"></i> {{ uploadStatus['contact_phone'].message || '保存失败' }}
              </span>
            </div>
          </el-form-item>
          
          <!-- 补充信息表单项已移除 -->
          
          <!-- 自定义字段 -->
          <template v-for="field in formFields" :key="field.id">
                <!-- 文本字段 -->
            <el-form-item
              v-if="field.field_type === 'text'"
              :label="field.field_label"
              :prop="`field_${field.id}`"
            >
                  <el-input
                    v-model="formData[`field_${field.id}`]"
                    :placeholder="`请输入${field.field_label}`"
              />
            </el-form-item>

            <!-- 单选题字段 -->
            <el-form-item
              v-else-if="field.field_type === 'radio'"
              :label="field.field_label"
              :prop="`field_${field.id}`"
            >
              <el-radio-group v-model="formData[`field_${field.id}`]">
                <el-radio
                  v-for="option in field.options"
                  :key="option.value"
                  :label="option.value"
                >
                  {{ option.label }}
                </el-radio>
              </el-radio-group>
            </el-form-item>

            <!-- 图片字段 -->
            <el-form-item
              v-else-if="field.field_type === 'image'"
              :label="field.field_label"
              :prop="`field_${field.id}`"
            >
              <el-upload
                :action="`/api/forms/upload/${field.id}`"
                :headers="uploadHeaders"
                :on-success="(res) => handleUploadSuccess(res, field.id)"
                :on-error="(err) => handleUploadError(err, field.id)"
                :before-upload="(file) => beforeImageUpload(file, field)"
                :file-list="fileList[field.id] || []"
                list-type="picture-card"
                :class="{ 'hide-upload': fileList[field.id]?.length >= 1 }"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="text-xs text-gray-500">支持 jpg/png 格式</div>
                </template>
              </el-upload>
            </el-form-item>

            <!-- 文件字段 -->
            <el-form-item
              v-else-if="field.field_type === 'file'"
              :label="field.field_label"
              :prop="`field_${field.id}`"
            >
              <el-upload
                :action="`/api/forms/upload/${field.id}`"
                :headers="uploadHeaders"
                :on-success="(res) => handleUploadSuccess(res, field.id)"
                :on-error="(err) => handleUploadError(err, field.id)"
                :before-upload="(file) => beforeFileUpload(file, field)"
                :file-list="fileList[field.id] || []"
              >
                        <el-button type="primary">选择文件</el-button>
                <template #tip>
                  <div class="text-xs text-gray-500">支持 pdf/doc/docx 格式</div>
                </template>
              </el-upload>
              </el-form-item>
          </template>
          
          <!-- 提交按钮 -->
          <div class="flex justify-end mt-8">
            <el-button @click="router.push(`/competition/${competitionId}`)">取消</el-button>
            <el-button type="primary" native-type="submit" :loading="submitting">提交报名</el-button>
          </div>
        </el-form>
      </div>
    </template>
    
    <!-- 未找到活动 -->
    <el-empty v-else description="未找到活动信息" />
  </div>
</template>

<style scoped>
.custom-file-upload {
  width: 100%;
  margin-bottom: 10px;
}

.image-upload .upload-area {
  width: 148px;
  height: 148px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: border-color 0.3s;
}

.image-upload .upload-area:hover {
  border-color: #409eff;
}

.image-upload .upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.image-upload .upload-text {
  color: #8c939d;
  margin-top: 8px;
  font-size: 12px;
}

.image-preview {
  width: 148px;
  height: 148px;
  position: relative;
  border-radius: 6px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-actions {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .preview-actions {
  opacity: 1;
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  top: 0;
  left: 0;
  z-index: 10;
}

.file-info {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 5px;
}

.file-info i {
  font-size: 24px;
  color: #909399;
  margin-right: 10px;
}

.file-name {
  margin: 0 8px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
  cursor: pointer;
  transition: all 0.3s;
}

.preview-placeholder:hover {
  background-color: #e6e8eb;
}

.preview-placeholder i {
  font-size: 32px;
  color: #909399;
  margin-bottom: 8px;
}

.preview-placeholder-text {
  color: #909399;
  font-size: 14px;
}

.file-actions {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.file-actions .el-button--mini {
  padding: 5px 10px;
  font-size: 12px;
}

/* 增加文件操作区域的样式 */
.file-actions .file-name-container {
  max-width: 70%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-actions .button-container {
  display: flex;
  gap: 8px;
}

/* 进度条样式优化 */
.el-progress {
  margin-top: 8px;
}

.el-progress--line {
  margin-bottom: 8px;
}

/* 大文件上传提示样式 */
.large-file-notice {
  margin-top: 4px;
  padding: 4px 8px;
  background-color: #f0f9ff;
  border-left: 3px solid #409eff;
  font-size: 12px;
  color: #606266;
}

.large-file-notice i {
  margin-right: 4px;
  color: #409eff;
}
</style>