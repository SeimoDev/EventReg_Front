# 表单数据提交接口 - 请求样例

本文档提供了使用表单数据提交接口的详细请求样例，帮助前端和移动端开发人员正确调用接口。

## 目录

1. [接口概述](#接口概述)
2. [文本字段提交](#文本字段提交)
3. [图片上传](#图片上传)
4. [文件上传](#文件上传)
5. [混合内容提交](#混合内容提交)
6. [错误处理](#错误处理)
7. [完整应用场景](#完整应用场景)

## 接口概述

**基础URL**: `http://47.245.102.255:8000/forms/registrations/{registration_id}/data`

**HTTP方法**: POST

**认证**: Bearer Token

**支持的内容类型**:
- `application/json`: 适用于文本数据和base64编码的图片
- `multipart/form-data`: 适用于文件上传和混合内容

## 文本字段提交

### 使用 application/json

#### cURL 示例
```bash
curl -X POST "http://47.245.102.255:8000/forms/registrations/1/data" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "1": "这是项目简介文本",
    "2": "这是项目详细描述"
  }'
```

#### Python 示例 (requests)
```python
import requests
import json

# 准备认证信息
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 准备表单数据
form_data = {
    "1": "这是项目简介文本",
    "2": "这是项目详细描述"
}

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/data",
    headers=headers,
    json=form_data
)

# 处理响应
if response.status_code == 200:
    result = response.json()
    print("保存成功:", result)
else:
    print(f"错误 {response.status_code}:", response.json())
```

#### JavaScript 示例 (fetch)
```javascript
// 准备认证信息
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
};

// 准备表单数据
const formData = {
  "1": "这是项目简介文本",
  "2": "这是项目详细描述"
};

// 发送请求
fetch("http://47.245.102.255:8000/forms/registrations/1/data", {
  method: "POST",
  headers: headers,
  body: JSON.stringify(formData)
})
.then(response => response.json())
.then(data => {
  console.log("保存成功:", data);
})
.catch(error => {
  console.error("错误:", error);
});
```

## 图片上传

### 使用 application/json (Base64编码)

#### cURL 示例
```bash
curl -X POST "http://47.245.102.255:8000/forms/registrations/1/data" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "1": "项目名称：创新项目",
    "3": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRw..."
  }'
```

#### Python 示例 (requests)
```python
import requests
import json
import base64

# 准备认证信息
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# 准备表单数据
form_data = {
    "1": "项目名称：创新项目"
}

# 添加base64编码的图片
with open("team_photo.jpg", "rb") as image_file:
    encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
    form_data["3"] = f"data:image/jpeg;base64,{encoded_image}"

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/data",
    headers=headers,
    json=form_data
)

# 处理响应
if response.status_code == 200:
    result = response.json()
    print("保存成功:", result)
else:
    print(f"错误 {response.status_code}:", response.json())
```

#### JavaScript 示例 (fetch)
```javascript
// 准备认证信息
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const headers = {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
};

// 准备表单数据
const formData = {
  "1": "项目名称：创新项目"
};

// 添加base64编码的图片
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const imageInput = document.getElementById('image-input');
const imageFile = imageInput.files[0];

getBase64(imageFile)
  .then(base64Image => {
    formData["3"] = base64Image;
    
    // 发送请求
    return fetch("http://47.245.102.255:8000/forms/registrations/1/data", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(formData)
    });
  })
  .then(response => response.json())
  .then(data => {
    console.log("保存成功:", data);
  })
  .catch(error => {
    console.error("错误:", error);
  });
```

## 文件上传

### 使用 multipart/form-data

#### cURL 示例
```bash
curl -X POST "http://47.245.102.255:8000/forms/registrations/1/data" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F 'form_data={"1":"项目名称：创新项目"}' \
  -F "field_4=@/path/to/proposal.pdf"
```

#### Python 示例 (requests)
```python
import requests
import json

# 准备认证信息
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    "Authorization": f"Bearer {token}"
}

# 准备表单数据
text_data = {
    "1": "项目名称：创新项目"
}

# 准备文件
files = {
    'form_data': (None, json.dumps(text_data), 'application/json'),
    'field_4': ('proposal.pdf', open('proposal.pdf', 'rb'), 'application/pdf')
}

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/data",
    headers=headers,
    files=files
)

# 处理响应
if response.status_code == 200:
    result = response.json()
    print("保存成功:", result)
else:
    print(f"错误 {response.status_code}:", response.json())
```

#### JavaScript 示例 (fetch)
```javascript
// 准备认证信息
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const headers = {
  "Authorization": `Bearer ${token}`
};

// 创建FormData对象
const formData = new FormData();

// 添加文本数据
const textData = {
  "1": "项目名称：创新项目"
};
formData.append('form_data', JSON.stringify(textData));

// 添加文件
const fileInput = document.getElementById('file-input');
formData.append('field_4', fileInput.files[0]);

// 发送请求
fetch("http://47.245.102.255:8000/forms/registrations/1/data", {
  method: "POST",
  headers: headers,
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log("保存成功:", data);
})
.catch(error => {
  console.error("错误:", error);
});
```

## 混合内容提交

### 使用 multipart/form-data (文本 + 图片 + 文件)

#### cURL 示例
```bash
curl -X POST "http://47.245.102.255:8000/forms/registrations/1/data" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F 'form_data={"1":"项目名称","2":"项目描述"}' \
  -F "field_3=@/path/to/team_photo.jpg" \
  -F "field_4=@/path/to/proposal.pdf"
```

#### Python 示例 (requests)
```python
import requests
import json

# 准备认证信息
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    "Authorization": f"Bearer {token}"
}

# 准备表单数据
text_data = {
    "1": "项目名称",
    "2": "项目描述"
}

# 准备文件
files = {
    'form_data': (None, json.dumps(text_data), 'application/json'),
    'field_3': ('team_photo.jpg', open('team_photo.jpg', 'rb'), 'image/jpeg'),
    'field_4': ('proposal.pdf', open('proposal.pdf', 'rb'), 'application/pdf')
}

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/data",
    headers=headers,
    files=files
)

# 处理响应
if response.status_code == 200:
    result = response.json()
    print("保存成功:", result)
else:
    print(f"错误 {response.status_code}:", response.json())
```

#### JavaScript 示例 (fetch)
```javascript
// 准备认证信息
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const headers = {
  "Authorization": `Bearer ${token}`
};

// 创建FormData对象
const formData = new FormData();

// 添加文本数据
const textData = {
  "1": "项目名称",
  "2": "项目描述"
};
formData.append('form_data', JSON.stringify(textData));

// 添加图片文件
const imageInput = document.getElementById('image-input');
formData.append('field_3', imageInput.files[0]);

// 添加PDF文件
const fileInput = document.getElementById('file-input');
formData.append('field_4', fileInput.files[0]);

// 发送请求
fetch("http://47.245.102.255:8000/forms/registrations/1/data", {
  method: "POST",
  headers: headers,
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log("保存成功:", data);
})
.catch(error => {
  console.error("错误:", error);
});
```

## 错误处理

### 处理表单验证错误

#### Python 示例
```python
import requests
import json

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/data",
    headers=headers,
    json=form_data
)

# 处理响应
if response.status_code == 200:
    result = response.json()
    print("保存成功:", result)
else:
    error_data = response.json()
    
    # 检查是否是表单字段错误
    if "detail" in error_data and "field_errors" in error_data["detail"]:
        field_errors = error_data["detail"]["field_errors"]
        for field_id, error_msg in field_errors.items():
            print(f"字段 {field_id} 错误: {error_msg}")
    
    # 检查是否是文件错误
    if "detail" in error_data and "file_errors" in error_data["detail"]:
        file_errors = error_data["detail"]["file_errors"]
        for error in file_errors:
            print(f"文件 {error['field_id']} 错误: {error['error']}")
    
    # 其他错误
    print(f"错误 {response.status_code}:", error_data)
```

#### JavaScript 示例
```javascript
fetch("http://47.245.102.255:8000/forms/registrations/1/data", {
  method: "POST",
  headers: headers,
  body: formData
})
.then(response => {
  return response.json().then(data => {
    if (!response.ok) {
      // 将错误信息和HTTP状态码一起抛出
      throw { status: response.status, data: data };
    }
    return data;
  });
})
.then(data => {
  console.log("保存成功:", data);
})
.catch(error => {
  // 处理HTTP错误
  if (error.status && error.data) {
    // 检查是否是表单字段错误
    if (error.data.detail && error.data.detail.field_errors) {
      const fieldErrors = error.data.detail.field_errors;
      for (const [fieldId, errorMsg] of Object.entries(fieldErrors)) {
        console.error(`字段 ${fieldId} 错误: ${errorMsg}`);
      }
    }
    
    // 检查是否是文件错误
    if (error.data.detail && error.data.detail.file_errors) {
      const fileErrors = error.data.detail.file_errors;
      fileErrors.forEach(error => {
        console.error(`文件 ${error.field_id} 错误: ${error.error}`);
      });
    }
    
    console.error(`错误 ${error.status}:`, error.data);
  } else {
    // 处理网络错误或其他错误
    console.error("错误:", error);
  }
});
```

## 完整应用场景

### 报名表单提交流程

#### 前端代码示例 (Vue.js)
```html
<template>
  <div class="registration-form">
    <h2>活动报名表单</h2>
    
    <!-- 文本字段 -->
    <div class="form-group">
      <label for="project-name">{{ fields['1'].field_label }}</label>
      <input 
        type="text" 
        id="project-name" 
        v-model="formData['1']" 
        :required="fields['1'].is_required"
      />
      <div v-if="errors['1']" class="error-message">{{ errors['1'] }}</div>
    </div>
    
    <div class="form-group">
      <label for="project-desc">{{ fields['2'].field_label }}</label>
      <textarea 
        id="project-desc" 
        v-model="formData['2']" 
        :required="fields['2'].is_required"
      ></textarea>
      <div v-if="errors['2']" class="error-message">{{ errors['2'] }}</div>
    </div>
    
    <!-- 图片上传 -->
    <div class="form-group">
      <label for="team-photo">{{ fields['3'].field_label }}</label>
      <input 
        type="file" 
        id="team-photo" 
        @change="handleImageChange"
        accept="image/jpeg,image/png"
        :required="fields['3'].is_required"
      />
      <div v-if="imagePreview" class="image-preview">
        <img :src="imagePreview" alt="预览" />
      </div>
      <div v-if="errors['3']" class="error-message">{{ errors['3'] }}</div>
    </div>
    
    <!-- 文件上传 -->
    <div class="form-group">
      <label for="proposal">{{ fields['4'].field_label }}</label>
      <input 
        type="file" 
        id="proposal" 
        @change="handleFileChange"
        accept=".pdf,.doc,.docx"
        :required="fields['4'].is_required"
      />
      <div v-if="selectedFile" class="file-info">
        已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
      </div>
      <div v-if="errors['4']" class="error-message">{{ errors['4'] }}</div>
    </div>
    
    <button @click="submitForm" :disabled="submitting">
      {{ submitting ? '提交中...' : '提交报名' }}
    </button>
    
    <div v-if="submitSuccess" class="success-message">
      表单提交成功！
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      registrationId: 1, // 假设报名ID
      fields: {}, // 表单字段信息
      formData: {}, // 表单数据
      imageFile: null,
      imagePreview: null,
      selectedFile: null,
      errors: {},
      submitting: false,
      submitSuccess: false
    };
  },
  
  async created() {
    // 获取表单字段信息
    await this.getFormFields();
  },
  
  methods: {
    // 获取表单字段信息
    async getFormFields() {
      try {
        const response = await fetch(`http://47.245.102.255:8000/forms/competitions/1/fields`, {
          headers: {
            "Authorization": `Bearer ${this.getToken()}`
          }
        });
        const fields = await response.json();
        
        // 将字段转换为对象形式，方便按ID访问
        this.fields = fields.reduce((obj, field) => {
          obj[field.id] = field;
          return obj;
        }, {});
        
        // 初始化表单数据
        for (const fieldId in this.fields) {
          if (this.fields[fieldId].field_type === 'text') {
            this.formData[fieldId] = '';
          }
        }
      } catch (error) {
        console.error('获取表单字段出错:', error);
      }
    },
    
    // 处理图片变更
    handleImageChange(event) {
      this.imageFile = event.target.files[0];
      
      // 图片预览
      if (this.imageFile) {
        const reader = new FileReader();
        reader.onload = e => {
          this.imagePreview = e.target.result;
        };
        reader.readAsDataURL(this.imageFile);
        this.errors['3'] = null; // 清除错误
      } else {
        this.imagePreview = null;
      }
    },
    
    // 处理文件变更
    handleFileChange(event) {
      this.selectedFile = event.target.files[0];
      if (this.selectedFile) {
        this.errors['4'] = null; // 清除错误
      }
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    },
    
    // 获取Token
    getToken() {
      return localStorage.getItem('token') || '';
    },
    
    // 提交表单
    async submitForm() {
      // 重置错误和状态
      this.errors = {};
      this.submitting = true;
      this.submitSuccess = false;
      
      try {
        // 创建FormData对象
        const formData = new FormData();
        
        // 添加文本数据
        formData.append('form_data', JSON.stringify(this.formData));
        
        // 添加图片文件
        if (this.imageFile) {
          formData.append('field_3', this.imageFile);
        }
        
        // 添加PDF文件
        if (this.selectedFile) {
          formData.append('field_4', this.selectedFile);
        }
        
        // 发送请求
        const response = await fetch(`http://47.245.102.255:8000/forms/registrations/${this.registrationId}/data`, {
          method: 'POST',
          headers: {
            "Authorization": `Bearer ${this.getToken()}`
          },
          body: formData
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          // 处理错误
          if (result.detail && result.detail.field_errors) {
            this.errors = {...result.detail.field_errors};
          }
          
          if (result.detail && result.detail.file_errors) {
            result.detail.file_errors.forEach(error => {
              this.errors[error.field_id] = error.error;
            });
          }
          
          throw new Error(result.detail.message || '提交表单失败');
        }
        
        // 提交成功
        console.log('表单提交成功:', result);
        this.submitSuccess = true;
        
        // 可以添加表单提交后的其他操作
        // 例如跳转到成功页面
        // this.$router.push('/submission-success');
        
      } catch (error) {
        console.error('提交表单出错:', error);
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.registration-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="text"],
textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

textarea {
  min-height: 100px;
}

.error-message {
  color: #d32f2f;
  font-size: 0.8rem;
  margin-top: 5px;
}

.success-message {
  color: #388e3c;
  font-size: 1rem;
  margin-top: 20px;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  text-align: center;
}

.image-preview {
  margin-top: 10px;
  max-width: 300px;
}

.image-preview img {
  max-width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

button:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}
</style>
```

### 移动端示例 (Flutter)

```dart
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:path/path.dart' as path;

class RegistrationForm extends StatefulWidget {
  @override
  _RegistrationFormState createState() => _RegistrationFormState();
}

class _RegistrationFormState extends State<RegistrationForm> {
  final _formKey = GlobalKey<FormState>();
  final int registrationId = 1; // 假设报名ID
  
  // 表单数据
  Map<String, dynamic> formFields = {};
  Map<String, dynamic> formData = {};
  Map<String, String> errors = {};
  
  // 文件
  File? teamPhotoFile;
  File? proposalFile;
  
  bool isLoading = true;
  bool isSubmitting = false;
  bool submitSuccess = false;
  
  @override
  void initState() {
    super.initState();
    fetchFormFields();
  }
  
  // 获取表单字段
  Future<void> fetchFormFields() async {
    setState(() {
      isLoading = true;
    });
    
    try {
      final response = await http.get(
        Uri.parse('http://47.245.102.255:8000/forms/competitions/1/fields'),
        headers: {
          'Authorization': 'Bearer ${getToken()}',
        },
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> fields = json.decode(response.body);
        
        // 将字段转换为对象形式
        for (var field in fields) {
          formFields[field['id'].toString()] = field;
          if (field['field_type'] == 'text') {
            formData[field['id'].toString()] = '';
          }
        }
      } else {
        showError('获取表单字段失败');
      }
    } catch (e) {
      showError('网络错误: $e');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }
  
  // 选择图片
  Future<void> pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image != null) {
      setState(() {
        teamPhotoFile = File(image.path);
        errors.remove('3'); // 清除错误
      });
    }
  }
  
  // 选择文件
  Future<void> pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx'],
    );
    
    if (result != null) {
      setState(() {
        proposalFile = File(result.files.single.path!);
        errors.remove('4'); // 清除错误
      });
    }
  }
  
  // 提交表单
  Future<void> submitForm() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    
    setState(() {
      isSubmitting = true;
      errors = {};
    });
    
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('http://47.245.102.255:8000/forms/registrations/$registrationId/data'),
      );
      
      // 添加认证头
      request.headers['Authorization'] = 'Bearer ${getToken()}';
      
      // 添加文本数据
      request.fields['form_data'] = json.encode(formData);
      
      // 添加图片
      if (teamPhotoFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'field_3',
            teamPhotoFile!.path,
            filename: path.basename(teamPhotoFile!.path),
          ),
        );
      }
      
      // 添加文件
      if (proposalFile != null) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'field_4',
            proposalFile!.path,
            filename: path.basename(proposalFile!.path),
          ),
        );
      }
      
      // 发送请求
      var streamedResponse = await request.send();
      var response = await http.Response.fromStream(streamedResponse);
      
      if (response.statusCode == 200) {
        setState(() {
          submitSuccess = true;
        });
      } else {
        // 处理错误
        final errorData = json.decode(response.body);
        
        if (errorData['detail'] != null && errorData['detail']['field_errors'] != null) {
          setState(() {
            Map<String, dynamic> fieldErrors = errorData['detail']['field_errors'];
            fieldErrors.forEach((key, value) {
              errors[key] = value.toString();
            });
          });
        }
        
        if (errorData['detail'] != null && errorData['detail']['file_errors'] != null) {
          for (var error in errorData['detail']['file_errors']) {
            setState(() {
              errors[error['field_id']] = error['error'];
            });
          }
        }
        
        showError(errorData['detail']['message'] ?? '提交表单失败');
      }
    } catch (e) {
      showError('提交失败: $e');
    } finally {
      setState(() {
        isSubmitting = false;
      });
    }
  }
  
  // 获取Token
  String getToken() {
    // 实际应用中，从安全存储获取token
    return 'your_auth_token_here';
  }
  
  // 显示错误消息
  void showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        appBar: AppBar(title: Text('活动报名')),
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    return Scaffold(
      appBar: AppBar(title: Text('活动报名')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 显示文本字段
              ...formFields.entries.where((e) => e.value['field_type'] == 'text').map((entry) {
                String fieldId = entry.key;
                Map<String, dynamic> field = entry.value;
                
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(field['field_label'], style: TextStyle(fontWeight: FontWeight.bold)),
                    TextFormField(
                      decoration: InputDecoration(
                        hintText: '请输入${field['field_label']}',
                        errorText: errors[fieldId],
                      ),
                      validator: field['is_required'] ? (value) {
                        if (value == null || value.isEmpty) {
                          return '${field['field_label']}不能为空';
                        }
                        return null;
                      } : null,
                      onChanged: (value) {
                        formData[fieldId] = value;
                      },
                    ),
                    SizedBox(height: 16),
                  ],
                );
              }).toList(),
              
              // 图片上传
              if (formFields.containsKey('3'))
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(formFields['3']['field_label'], style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        ElevatedButton(
                          onPressed: pickImage,
                          child: Text('选择图片'),
                        ),
                        SizedBox(width: 16),
                        if (teamPhotoFile != null)
                          Expanded(
                            child: Text(path.basename(teamPhotoFile!.path), overflow: TextOverflow.ellipsis),
                          ),
                      ],
                    ),
                    if (teamPhotoFile != null)
                      Container(
                        margin: EdgeInsets.only(top: 8),
                        height: 150,
                        child: Image.file(teamPhotoFile!, fit: BoxFit.cover),
                      ),
                    if (errors.containsKey('3'))
                      Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text(errors['3']!, style: TextStyle(color: Colors.red, fontSize: 12)),
                      ),
                    SizedBox(height: 16),
                  ],
                ),
              
              // 文件上传
              if (formFields.containsKey('4'))
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(formFields['4']['field_label'], style: TextStyle(fontWeight: FontWeight.bold)),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        ElevatedButton(
                          onPressed: pickFile,
                          child: Text('选择文件'),
                        ),
                        SizedBox(width: 16),
                        if (proposalFile != null)
                          Expanded(
                            child: Text(path.basename(proposalFile!.path), overflow: TextOverflow.ellipsis),
                          ),
                      ],
                    ),
                    if (errors.containsKey('4'))
                      Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: Text(errors['4']!, style: TextStyle(color: Colors.red, fontSize: 12)),
                      ),
                    SizedBox(height: 24),
                  ],
                ),
              
              // 提交按钮
              Container(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: isSubmitting ? null : submitForm,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: Text(isSubmitting ? '提交中...' : '提交报名'),
                ),
              ),
              
              // 成功消息
              if (submitSuccess)
                Container(
                  margin: EdgeInsets.only(top: 24),
                  padding: EdgeInsets.all(16),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.green.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '表单提交成功！',
                    style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}