<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../api/request'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Calendar, List, Plus, Delete } from '@element-plus/icons-vue'

interface Competition {
  id: number
  title: string
  description: string
  start_time: string
  end_time: string
  max_participants: number
  status: string
}

interface FormField {
  id?: number
  field_name: string
  field_label: string
  field_type: string
  is_required: boolean
  options?: { value: string; label: string }[]
}

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.params.id !== undefined)
const competitionId = computed(() => Number(route.params.id))

const formRef = ref<FormInstance>()
const fieldFormRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const fieldDialogVisible = ref(false)
const competitionFormFields = ref<FormField[]>([])
const newField = ref<FormField>({
  field_name: '',
  field_label: '',
  field_type: 'text',
  is_required: true,
  options: []
})

// 新增：选项管理
const newOption = ref({ value: '', label: '' })

// 打开添加字段对话框
const openFieldDialog = () => {
  // 重置表单
  newField.value = {
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: true,
    options: []
  }
  newOption.value = { value: '', label: '' }
  fieldDialogVisible.value = true
}

// 添加选项
const addOption = () => {
  if (!newOption.value.value || !newOption.value.label) {
    ElMessage.warning('请填写选项的值和标签')
    return
  }
  
  // 检查是否存在重复的选项
  const duplicateValue = newField.value.options?.find(
    option => option.value === newOption.value.value
  )
  
  if (duplicateValue) {
    ElMessage.warning(`选项值"${newOption.value.value}" 已存在，请使用不同的值`)
    return
  }
  
  if (!newField.value.options) {
    newField.value.options = []
  }
  
  // 添加新选项
  newField.value.options.push({ ...newOption.value })
  
  // 重置输入
  newOption.value = { value: '', label: '' }
}

// 删除选项
const removeOption = (index: number) => {
  if (newField.value.options) {
    newField.value.options.splice(index, 1)
  }
}

const formData = ref<Competition>({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  max_participants: 100,
  status: 'draft',
  id: 0
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入活动标题', trigger: 'blur' },
    { min: 3, max: 100, message: '长度在3到100个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入活动描述', trigger: 'blur' }
  ],
  start_time: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' }
  ],
  max_participants: [
    { required: true, message: '请输入最大参与人数', trigger: 'blur' },
    { type: 'number', min: 1, message: '参与人数必须大于0', trigger: 'blur' }
  ]
}

// 表单字段验证规则
const fieldRules: FormRules = {
  field_name: [
    { required: true, message: '请输入字段名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  field_label: [
    { required: true, message: '请输入字段标签', trigger: 'blur' }
  ],
  field_type: [
    { required: true, message: '请选择字段类型', trigger: 'change' }
  ]
}

// 加载活动信息
const loadCompetition = async () => {
  if (!isEdit.value) return
  
  try {
    loading.value = true
    console.log('开始加载活动信息，ID:', competitionId.value)
    
    const response = await request.get(`/competitions/${competitionId.value}`)
    console.log('获取到的活动数据:', response)
    
    // 尝试从不同位置提取数据
    let data: any = response
    
    // 如果response是axios标准响应，尝试从data字段获取
    if (response && typeof response === 'object' && 'data' in response) {
      data = response.data
    }
    
    console.log('解析后的活动数据:', data)
    
    // 检查是否有可用数据
    if (!data) {
      throw new Error('未找到活动数据')
    }
    
    // 确保数据格式正确，使用可选链和默认值
    formData.value = {
      id: parseInt(String(data.id || '0')),
      title: String(data.title || ''),
      description: String(data.description || ''),
      start_time: String(data.start_time || ''),
      end_time: String(data.end_time || ''),
      max_participants: parseInt(String(data.max_participants || '100')),
      status: String(data.status || 'draft')
    }
    
    console.log('设置表单数据:', formData.value)
    
    // 加载表单字段
    await loadFormFields()
  } catch (error: any) {
    console.error('加载活动信息失败:', error)
    ElMessage.error(error.message || '加载活动信息失败')
  } finally {
    loading.value = false
  }
}

// 加载表单字段
const loadFormFields = async () => {
  try {
    console.log('开始加载表单字段，活动ID:', competitionId.value)
    
    const response = await request.get(`/forms/competitions/${competitionId.value}/fields`)
    console.log('获取到的表单字段数据:', response)
    
    // 尝试从不同位置提取数据
    let fieldsData
    
    // 如果response是axios标准响应，尝试从data字段获取
    if (response && typeof response === 'object') {
      if ('data' in response) {
        // 可能是嵌套的data结构或直接的数据数组
        fieldsData = Array.isArray(response.data.data) ? response.data.data : 
                     Array.isArray(response.data) ? response.data : 
                     [response.data]
      } else {
        // 可能是直接的数据或数组
        fieldsData = Array.isArray(response) ? response : [response]
      }
    } else {
      fieldsData = Array.isArray(response) ? response : [response]
    }
    
    // 确保fieldsData是数组且有数据
    if (!Array.isArray(fieldsData) || fieldsData.length === 0) {
      console.warn('表单字段数据为空或格式不正确:', fieldsData)
      competitionFormFields.value = []
      return
    }
    
    console.log('处理前的表单字段数据:', fieldsData)
    
    // 处理表单字段，确保options格式正确
    competitionFormFields.value = fieldsData.map(field => {
      // 确保所有表单字段都有正确的结构
      const processedField: FormField = {
        id: field.id,
        field_name: field.field_name || '',
        field_label: field.field_label || '',
        field_type: field.field_type || 'text',
        is_required: field.is_required === true || field.is_required === 1,
        options: []
      }
      
      // 处理单选题选项
      if (field.field_type === 'radio' && field.options) {
        try {
          // 处理不同可能的options格式
          if (typeof field.options === 'string') {
            // 如果options是字符串，尝试解析成JSON
            processedField.options = JSON.parse(field.options)
          } else if (Array.isArray(field.options)) {
            // 如果已经是数组，直接使用
            processedField.options = field.options.map(opt => ({
              value: opt.value || '',
              label: opt.label || ''
            }))
          }
        } catch (e) {
          console.error('解析options错误:', e)
          processedField.options = []
        }
      }
      
      return processedField
    })
    
    console.log('处理后的表单字段数据:', competitionFormFields.value)
  } catch (error: any) {
    console.error('加载表单字段失败:', error)
    ElMessage.error(error.message || '加载表单字段失败')
  }
}

// 提交活动表单
const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  await formEl.validate(async (valid) => {
    if (valid) {
      try {
        submitting.value = true
        
        if (isEdit.value) {
          // 更新活动
          const updateResponse = await request.put(`/competitions/${competitionId.value}`, formData.value)
          console.log('更新活动响应:', updateResponse)
          ElMessage.success('更新活动成功')
        } else {
          // 创建活动
          const response = await request.post('/competitions', formData.value)
          console.log('创建活动响应:', response)
          
          // 提取返回的ID
          let newCompetitionId = null
          
          // 从axios响应中提取数据
          if (response && typeof response === 'object') {
            if ('data' in response) {
              // 可能是标准响应或者直接返回ID
              if (response.data && typeof response.data === 'object' && 'id' in response.data) {
                newCompetitionId = response.data.id
              } else if (typeof response.data === 'number') {
                newCompetitionId = response.data
              }
            } else if ('id' in response) {
              // 直接返回了包含id的对象
              newCompetitionId = (response as any).id
            }
          }
          
          if (!newCompetitionId) {
            throw new Error('创建活动失败：未获取到新活动ID')
          }
          
          ElMessage.success('创建活动成功')
          
          // 跳转到编辑页面，以添加表单字段
          router.push(`/admin/competitions/${newCompetitionId}/edit`)
        }
      } catch (error: any) {
        console.error('提交活动信息失败:', error)
        ElMessage.error(error?.message || '提交活动信息失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

// 检查表单字段格式是否正确
const validateField = (field: FormField): boolean => {
  // 验证基本字段
  if (!field.field_name || !field.field_label || !field.field_type) {
    ElMessage.error('字段名称、标签和类型不能为空')
    return false
  }
  
  // 验证字段名称格式
  if (!/^[a-zA-Z0-9_]+$/.test(field.field_name)) {
    ElMessage.error('字段名称只能包含字母、数字和下划线')
    return false
  }
  
  // 验证单选题选项
  if (field.field_type === 'radio') {
    if (!Array.isArray(field.options) || field.options.length < 2) {
      ElMessage.error('单选题至少需要两个选项')
      return false
    }
    
    // 验证每个选项的完整性
    for (const option of field.options) {
      if (!option.value || !option.label) {
        ElMessage.error('选项的值和标签不能为空')
        return false
      }
    }
    
    // 验证选项值的唯一性
    const valueSet = new Set()
    for (const option of field.options) {
      if (valueSet.has(option.value)) {
        ElMessage.error(`选项值"${option.value}" 重复，请确保所有选项值唯一`)
        return false
      }
      valueSet.add(option.value)
    }
  }
  
  return true
}

// 添加表单字段
const addFormField = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  
  try {
    await formEl.validate()
    
    if (!validateField(newField.value)) {
      return
    }
    
    console.log('准备提交表单字段...')
    console.log('字段类型:', newField.value.field_type)
    console.log('选项数据:', newField.value.options)
    
    // 构建请求数据，符合API文档规范
    let requestData: any = {
      competition_id: competitionId.value,
      field_name: newField.value.field_name,
      field_label: newField.value.field_label,
      field_type: newField.value.field_type,
      is_required: newField.value.is_required
    }
    
    // 单选题需要添加options字段
    if (newField.value.field_type === 'radio') {
      // 确保options格式符合API文档规范
      if (Array.isArray(newField.value.options) && newField.value.options.length >= 2) {
        requestData.options = newField.value.options.map(option => ({
          value: option.value,
          label: option.label
        }))
      } else {
        throw new Error('单选题选项格式不正确')
      }
    }
    
    console.log('发送创建字段请求:', JSON.stringify(requestData, null, 2))
    
    const response = await request.post('/forms/fields', requestData)
    console.log('创建字段响应:', response)
    
    // 从API响应中提取数据
    let responseData
    if (response && typeof response === 'object') {
      if ('data' in response) {
        // 标准axios响应
        responseData = response.data
      } else {
        // 直接返回的数据
        responseData = response
      }
    }
    
    // 检查响应中是否包含id字段，如果有则表示成功
    if (responseData && (responseData.id || responseData.success)) {
      ElMessage.success('添加字段成功')
      fieldDialogVisible.value = false
      loadFormFields()
    } else {
      throw new Error(responseData?.message || responseData?.error || '添加字段失败')
    }
    
    // 重置表单
    newField.value = {
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: true,
      options: []
    }
    newOption.value = { value: '', label: '' }
  } catch (error: any) {
    console.error('添加字段失败:', error)
    console.error('错误详情:', error.response?.data || error.message)
    ElMessage.error(error?.response?.data?.message || error?.response?.data?.error || error?.message || '添加字段失败')
  }
}

// 删除表单字段
const deleteFormField = async (fieldId: number) => {
  try {
    const response = await request.delete(`/forms/fields/${fieldId}`)
    console.log('删除字段响应:', response)
    
    ElMessage.success('删除字段成功')
    
    // 重新加载字段列表
    loadFormFields()
  } catch (error) {
    console.error('删除字段失败:', error)
    ElMessage.error('删除字段失败')
  }
}

// 获取字段类型文本
const getFieldTypeText = (type: string) => {
  switch (type) {
    case 'text': return '文本'
    case 'image': return '图片'
    case 'file': return '文件'
    case 'radio': return '单选题'
    default: return type
  }
}

// 添加高校预设数据
const universityPresets = {
  "universities": [
    "安阳工学院",
    "安阳学院",
    "安阳师范学院",
    "华北水利水电大学",
    "南阳理工学院",
    "南阳师范学院",
    "商丘工学院",
    "商丘学院",
    "商丘师范学院",
    "平顶山学院",
    "新乡医学院",
    "新乡医学院三全学院",
    "新乡学院",
    "新乡工程学院",
    "信阳农林学院",
    "信阳学院",
    "信阳师范学院",
    "洛阳理工学院",
    "洛阳师范学院",
    "河南中医药大学",
    "河南大学",
    "河南工业大学",
    "河南工程学院",
    "河南工学院",
    "河南城建学院",
    "河南师范大学",
    "河南开封科技传媒学院",
    "河南大学",
    "河南理工大学",
    "河南科技大学",
    "河南科技学院",
    "河南科技职业大学",
    "河南财经政法大学",
    "河南财政金融学院",
    "河南警察学院",
    "河南农业大学",
    "河南牧业经济学院",
    "河南体育学院",
    "黄河科技学院",
    "黄河交通学院",
    "黄淮学院",
    "中原工学院",
    "中原科技学院",
    "周口师范学院",
    "许昌学院",
    "郑州大学",
    "郑州工业应用技术学院",
    "郑州工程技术学院",
    "郑州工商学院",
    "郑州师范学院",
    "郑州商学院",
    "郑州科技学院",
    "郑州财经学院",
    "郑州警察学院",
    "郑州轻工业大学",
    "郑州升达经贸管理学院",
    "郑州航空工业管理学院",
    "郑州经贸学院"
  ]
}



// 添加预设选项函数
const applyUniversityPreset = () => {
  // 确认是否替换现有选项
  if (newField.value.options && newField.value.options.length > 0) {
    if (!confirm('这将替换当前已有的选项，是否继续？')) {
      return
    }
  }
  
  // 重置选项
  newField.value.options = []
  
  // 添加高校选项
  universityPresets.universities.forEach((university, index) => {
    newField.value.options?.push({
      value: `uni_${index + 1}`,
      label: university
    })
  })
  
  ElMessage.success(`已添加 ${universityPresets.universities.length} 所高校`)
}

// 组件挂载时的初始化
onMounted(async () => {
  console.log('组件挂载，编辑模式:', isEdit.value)
  console.log('活动ID:', competitionId.value)
  
  if (isEdit.value && competitionId.value) {
    await loadCompetition()
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">{{ isEdit ? '编辑活动' : '创建活动' }}</h1>
    
    <div v-if="loading" class="flex justify-center py-12">
      <el-spinner size="large" />
    </div>
    
    <template v-else>
      <div class="card mb-8">
        <h2 class="text-xl font-semibold mb-6 flex items-center">
          <el-icon class="mr-2"><Calendar /></el-icon>
          基本信息
        </h2>
        
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-position="top"
        >
          <el-form-item label="活动标题" prop="title">
            <el-input v-model="formData.title" placeholder="请输入活动标题" />
          </el-form-item>
          
          <el-form-item label="活动描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="5"
              placeholder="请输入活动描述"
            />
          </el-form-item>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="开始时间" prop="start_time">
              <el-date-picker
                v-model="formData.start_time"
                type="datetime"
                placeholder="选择开始时间"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="结束时间" prop="end_time">
              <el-date-picker
                v-model="formData.end_time"
                type="datetime"
                placeholder="选择结束时间"
                style="width: 100%"
              />
            </el-form-item>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <el-form-item label="最大参与人数" prop="max_participants">
              <el-input-number
                v-model="formData.max_participants"
                :min="1"
                style="width: 100%"
              />
            </el-form-item>
            
            <el-form-item label="状态" prop="status">
              <el-select v-model="formData.status" style="width: 100%">
                <el-option label="草稿" value="draft" />
                <el-option label="已发布" value="published" />
                <el-option label="已关闭" value="closed" />
              </el-select>
            </el-form-item>
          </div>
          
          <div class="flex justify-end mt-6">
            <el-button @click="router.push('/admin/competitions')">取消</el-button>
            <el-button type="primary" @click="submitForm(formRef)" :loading="submitting">
              {{ isEdit ? '更新' : '创建' }}
            </el-button>
          </div>
        </el-form>
      </div>
      
      <!-- 表单字段管理（仅编辑模式显示）-->
      <div v-if="isEdit" class="card">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold flex items-center">
            <el-icon class="mr-2"><List /></el-icon>
            自定义表单字段
          </h2>
          
          <el-button type="primary" @click="openFieldDialog">
            <el-icon class="mr-1"><Plus /></el-icon>
            添加字段
          </el-button>
        </div>
        
        <template v-if="competitionFormFields.length > 0">
          <el-table :data="competitionFormFields" border stripe>
            <el-table-column label="字段名称" prop="field_name" min-width="150" />
            <el-table-column label="字段标签" prop="field_label" min-width="150" />
            <el-table-column label="字段类型" min-width="120">
              <template #default="{ row }">
                {{ getFieldTypeText(row.field_type) }}
              </template>
            </el-table-column>
            <el-table-column label="是否必填" min-width="120">
              <template #default="{ row }">
                <el-tag :type="row.is_required ? 'danger' : 'info'">
                  {{ row.is_required ? '必填' : '选填' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="选项" min-width="200">
              <template #default="{ row }">
                <div v-if="row.field_type === 'radio' && row.options">
                  <el-tag
                    v-for="(option, index) in row.options"
                    :key="index"
                    size="small"
                    class="mr-1 mb-1"
                  >
                    {{ option.label }}
                  </el-tag>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="deleteFormField(row.id as number)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
        
        <el-empty v-else description="暂无自定义字段，点击添加按钮创建" />
      </div>
      
      <!-- 添加字段对话框-->
      <el-dialog
        v-model="fieldDialogVisible"
        title="添加表单字段"
        width="550px"
        @closed="newField.options = []"
      >
        <el-form
          ref="fieldFormRef"
          :model="newField"
          :rules="fieldRules"
          label-position="top"
        >
          <el-form-item label="字段名称" prop="field_name">
            <el-input v-model="newField.field_name" placeholder="用于系统识别，如 project_type" />
            <div class="text-xs text-gray-500 mt-1">
              只能使用英文字母、数字和下划线，如 project_type
            </div>
          </el-form-item>
          
          <el-form-item label="字段标签" prop="field_label">
            <el-input v-model="newField.field_label" placeholder="用于前端显示，如 项目类型" />
            <div class="text-xs text-gray-500 mt-1">
              显示给用户的名称，如 项目类型
            </div>
          </el-form-item>
          
          <el-form-item label="字段类型" prop="field_type">
            <el-select v-model="newField.field_type" style="width: 100%">
              <el-option label="文本" value="text" />
              <el-option label="单选题" value="radio" />
              <el-option label="图片" value="image" />
              <el-option label="文件" value="file" />
            </el-select>
          </el-form-item>
          
          <!-- 单选题选项 -->
          <template v-if="newField.field_type === 'radio'">
            <el-divider content-position="left">
              <span class="text-sm font-medium">选项设置</span>
            </el-divider>
            
            <!-- 已添加的选项 -->
            <div v-if="newField.options && newField.options.length > 0" class="mb-4">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-sm font-medium">已添加选项</h3>
                <div class="text-xs text-gray-500">单选题至少需要两个选项</div>
              </div>
              
              <div 
                v-for="(option, index) in newField.options" 
                :key="index" 
                class="flex items-center space-x-2 mb-2 bg-gray-50 dark:bg-gray-800 p-2 rounded"
              >
                <div class="flex-1">
                  <div class="font-medium">{{ option.label }}</div>
                  <div class="text-xs text-gray-500">值：{{ option.value }}</div>
                </div>
                <el-button 
                  type="danger" 
                  plain 
                  size="small" 
                  @click="removeOption(index)"
                  :disabled="newField.options?.length <= 2"
                  :title="newField.options?.length <= 2 ? '单选题至少需要两个选项' : '删除此选项'"
                >
                  删除
                </el-button>
              </div>
            </div>
            
            <!-- 添加新选项 -->
            <div class="mb-2">
              <div class="flex justify-between items-center mb-2">
                <h3 class="text-sm font-medium">添加新选项</h3>
                <el-button 
                  type="success" 
                  size="small" 
                  @click="applyUniversityPreset" 
                  title="一键添加河南省高校列表"
                >
                  应用高校预设
                </el-button>
              </div>
              
              <div class="flex items-end space-x-2">
                <el-form-item label="选项值" class="mb-0 flex-1">
                  <el-input v-model="newOption.value" placeholder="如：tech" />
                  <div class="text-xs text-gray-500 mt-1">用于数据存储，如 tech</div>
                </el-form-item>
                <el-form-item label="选项标签" class="mb-0 flex-1">
                  <el-input v-model="newOption.label" placeholder="如：科技创新" />
                  <div class="text-xs text-gray-500 mt-1">用于前端显示，如 科技创新</div>
                </el-form-item>
                <el-button type="primary" @click="addOption" class="h-10">
                  添加
                </el-button>
              </div>
            </div>
          </template>
          
          <el-form-item label="是否必填">
            <el-switch v-model="newField.is_required" />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="flex justify-end">
            <el-button @click="fieldDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addFormField(fieldFormRef)">确定</el-button>
          </div>
        </template>
      </el-dialog>
    </template>
  </div>
</template>

<style scoped>
/* 添加样式 */
.el-divider {
  margin: 16px 0;
}
</style>
