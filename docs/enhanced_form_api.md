# 改进的表单数据提交 API

本文档描述了使用改进的表单数据提交API，该API允许前端和移动端以更加结构化和明确的方式提交表单数据。

## 改进的特点

1. **明确的字段类型定义** - 每个表单项都明确指定了字段类型（文本、图片或文件）
2. **统一的请求结构** - 所有表单项都以结构化的方式组织
3. **简化的前端实现** - 不再需要区分不同的内容类型处理方式
4. **增强的验证能力** - 可以在提交时验证字段类型是否正确
5. **灵活的混合提交** - 可以在一个请求中混合包含文本、图片和文件

## 接口规范

### 基本信息

- **URL**: `/forms/registrations/{registration_id}/enhanced-data`
- **方法**: `POST`
- **认证**: Bearer Token
- **内容类型**: `multipart/form-data`

### 请求参数

- **Path参数**:
  - `registration_id` (整数): 报名记录ID

- **请求体**:
  - `form_request` (JSON): 包含表单项的JSON结构，具有以下格式：
    ```json
    {
      "items": [
        {
          "field_id": 1,
          "field_type": "text",
          "content": "文本内容"
        },
        {
          "field_id": 2,
          "field_type": "image",
          "content": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        },
        {
          "field_id": 3,
          "field_type": "file",
          "content": null
        }
      ]
    }
    ```

  - `files` (表单文件): 文件上传字段，命名格式为`field_{field_id}`

### 字段类型说明

- `field_type` 可以是以下之一:
  - `text`: 文本字段，`content`应包含文本内容
  - `image`: 图片字段，`content`应包含base64编码的图片
  - `file`: 文件字段，`content`可以为null，实际文件通过multipart表单上传
  - `radio`: 单选字段，`content`应包含选中的选项值

### 响应

- **成功响应** (200 OK):
  ```json
  {
    "success": true,
    "message": "表单数据保存成功",
    "saved_data": {
      "text_fields": {
        "1": "文本内容"
      },
      "files": [
        {
          "field_id": "2",
          "original_filename": "image.jpg",
          "saved_filename": "a1b2c3d4.jpg",
          "file_type": "jpg",
          "file_size": 123456
        },
        {
          "field_id": "3",
          "original_filename": "document.pdf",
          "saved_filename": "e5f6g7h8_document.pdf",
          "file_type": "pdf",
          "file_size": 654321
        }
      ]
    }
  }
  ```

- **错误响应** (400 Bad Request / 404 Not Found / 500 Internal Server Error):
  ```json
  {
    "detail": {
      "success": false,
      "message": "表单数据保存失败",
      "field_errors": {
        "1": "字段错误信息"
      },
      "file_errors": [
        {
          "field_id": "3",
          "error": "不支持的文件类型"
        }
      ]
    }
  }
  ```

## 代码示例

### cURL 示例

```bash
curl -X POST "http://47.245.102.255:8000/forms/registrations/1/enhanced-data" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F 'form_request={"items":[{"field_id":1,"field_type":"text","content":"项目名称：创新项目"},{"field_id":2,"field_type":"image","content":"data:image/jpeg;base64,/9j/4AAQSkZJRg..."},{"field_id":3,"field_type":"file","content":null}]}' \
  -F "field_3=@/path/to/proposal.pdf"
```

### Python 示例

```python
import requests
import json
import base64

# 准备认证信息
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    "Authorization": f"Bearer {token}"
}

# 准备表单数据
form_request = {
    "items": [
        {
            "field_id": 1,
            "field_type": "text",
            "content": "项目名称：创新项目"
        },
        {
            "field_id": 2,
            "field_type": "image",
            "content": None
        },
        {
            "field_id": 3,
            "field_type": "file",
            "content": None
        },
        {
            "field_id": 4,
            "field_type": "radio",
            "content": "tech"
        }
    ]
}

# 添加base64编码的图片
with open("team_photo.jpg", "rb") as image_file:
    encoded_image = base64.b64encode(image_file.read()).decode('utf-8')
    form_request["items"][1]["content"] = f"data:image/jpeg;base64,{encoded_image}"

# 准备文件
files = {
    'field_3': ('proposal.pdf', open('proposal.pdf', 'rb'), 'application/pdf'),
    'field_4': ('radio_value', 'tech', 'text/plain')
}

# 添加表单请求数据
files['form_request'] = (None, json.dumps(form_request), 'application/json')

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/enhanced-data",
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

### JavaScript 示例

```javascript
// 准备认证信息
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const headers = {
  "Authorization": `Bearer ${token}`
};

// 准备表单数据
const formRequest = {
  items: [
    {
      field_id: 1,
      field_type: "text",
      content: "项目名称：创新项目"
    },
    {
      field_id: 2,
      field_type: "image",
      content: null  // 将在后面设置
    },
    {
      field_id: 3,
      field_type: "file",
      content: null  // 文件将通过FormData上传
    },
    {
      field_id: 4,
      field_type: "radio",
      content: "tech"  // 单选字段选中的值
    }
  ]
};

// 添加图片
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

async function submitForm() {
  try {
    // 获取和设置图片
    const imageInput = document.getElementById('image-input');
    const imageFile = imageInput.files[0];
    
    if (imageFile) {
      formRequest.items[1].content = await getBase64(imageFile);
    }
    
    // 创建FormData
    const formData = new FormData();
    
    // 添加请求数据
    formData.append('form_request', JSON.stringify(formRequest));
    
    // 添加文件
    const fileInput = document.getElementById('file-input');
    const fileToUpload = fileInput.files[0];
    if (fileToUpload) {
      formData.append('field_3', fileToUpload);
    }
    
    // 发送请求
    const response = await fetch("http://47.245.102.255:8000/forms/registrations/1/enhanced-data", {
      method: "POST",
      headers: headers,
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log("保存成功:", result);
    } else {
      console.error(`错误 ${response.status}:`, result);
    }
  } catch (error) {
    console.error("提交失败:", error);
  }
}
```

## Flutter (Dart) 示例

```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

Future<void> submitEnhancedForm() async {
  // 准备认证信息
  String token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  
  // 准备表单数据
  Map<String, dynamic> formRequest = {
    "items": [
      {
        "field_id": 1,
        "field_type": "text",
        "content": "项目名称：创新项目"
      },
      {
        "field_id": 2,
        "field_type": "image",
        "content": "data:image/jpeg;base64,${base64Encode(await File('team_photo.jpg').readAsBytes())}"
      },
      {
        "field_id": 3,
        "field_type": "file",
        "content": null
      },
      {
        "field_id": 4,
        "field_type": "radio",
        "content": "tech"
      }
    ]
  };
  
  // 创建multipart请求
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('http://47.245.102.255:8000/forms/registrations/1/enhanced-data')
  );
  
  // 添加认证头
  request.headers['Authorization'] = 'Bearer $token';
  
  // 添加表单数据
  request.fields['form_request'] = jsonEncode(formRequest);
  
  // 添加文件
  final file = File('proposal.pdf');
  request.files.add(
    http.MultipartFile(
      'field_3',
      file.readAsBytes().asStream(),
      file.lengthSync(),
      filename: 'proposal.pdf',
      contentType: MediaType('application', 'pdf')
    )
  );
  
  // 发送请求
  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  
  // 处理响应
  if (response.statusCode == 200) {
    print('保存成功: $responseData');
  } else {
    print('错误 ${response.statusCode}: $responseData');
  }
}
```

## 最佳实践

1. 总是为每个表单项指定正确的`field_type`
2. 对于文件上传，确保文件字段的命名遵循`field_{field_id}`格式
3. 对于图片上传，可以选择base64编码或文件上传方式
4. 当处理大文件时，推荐使用文件上传而非base64编码
5. 验证响应中的`success`字段，以确认表单是否成功保存
6. 处理可能的错误，特别是`field_errors`和`file_errors`字段

## 数据库实现说明

为了实现更清晰的表单数据结构，系统使用以下数据库设计：

### 基础表结构

1. **活动表单字段表 (competition_form_fields)**
   - 存储表单字段定义，包括字段名称、标签、类型等

2. **报名表单数据表 (registration_form_data)**
   - 存储用户提交的表单数据，包括文本值和文件路径

### 增强型数据视图

系统创建了一个名为`enhanced_form_data`的视图，整合了表单数据的关键信息：

```sql
CREATE VIEW enhanced_form_data AS
SELECT 
    rfd.id,
    rfd.registration_id,
    cr.user_id,
    rfd.field_id,
    cff.field_type AS type,
    CASE 
        WHEN cff.field_type = 'text' THEN rfd.field_value
        ELSE rfd.file_path
    END AS content,
    rfd.created_at
FROM 
    registration_form_data rfd
JOIN 
    competition_form_fields cff ON rfd.field_id = cff.id
JOIN 
    competition_registrations cr ON rfd.registration_id = cr.id
```

这个视图将用户ID、表单项ID、类型和内容整合在一起，使数据查询和处理更加便捷。

## 获取增强型表单数据

### 请求信息

- **URL**: `/forms/registrations/{registration_id}/enhanced-data`
- **方法**: `GET`
- **认证**: Bearer Token

### 路径参数

- **registration_id** (整数): 报名记录ID

### 响应

- **成功响应** (200 OK):
  ```json
  {
    "success": true,
    "registration": {
      "id": 1,
      "user_id": 123,
      "user_name": "张三",
      "email": "zhangsan@example.com",
      "competition_id": 5,
      "competition_name": "创新设计大赛",
      "status": "submitted",
      "created_at": "2023-04-15 14:30:22"
    },
    "form_data": [
      {
        "id": 101,
        "field_id": 1,
        "field_name": "project_name",
        "field_label": "项目名称",
        "type": "text",
        "content": "智能家居控制系统"
      },
      {
        "id": 102,
        "field_id": 2,
        "field_name": "project_description",
        "field_label": "项目描述",
        "type": "text",
        "content": "这是一个基于物联网技术的智能家居系统..."
      },
      {
        "id": 103,
        "field_id": 3,
        "field_name": "team_photo",
        "field_label": "团队照片",
        "type": "image",
        "content": "uploads/competition_files/images/a1b2c3d4e5f6.jpg",
        "url": "/forms/files/1/3"
      },
      {
        "id": 104,
        "field_id": 4,
        "field_name": "proposal",
        "field_label": "项目计划书",
        "type": "file",
        "content": "uploads/competition_files/documents/f6e5d4c3b2a1_proposal.pdf",
        "url": "/forms/files/1/4"
      },
      {
        "id": 105,
        "field_id": 5,
        "field_name": "project_type",
        "field_label": "项目类型",
        "type": "radio",
        "content": "tech",
        "options": [
          {"value": "tech", "label": "科技创新"},
          {"value": "art", "label": "艺术设计"},
          {"value": "social", "label": "社会公益"}
        ]
      }
    ]
  }
  ```

- **错误响应** (404 Not Found):
  ```json
  {
    "detail": "报名记录不存在"
  }
  ```

### 代码示例

```python
import requests

# 准备认证信息
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
headers = {
    "Authorization": f"Bearer {token}"
}

# 发送请求
response = requests.get(
    "http://47.245.102.255:8000/forms/registrations/1/enhanced-data",
    headers=headers
)

# 处理响应
if response.status_code == 200:
    data = response.json()
    print("报名信息:", data["registration"])
    print("表单数据项数:", len(data["form_data"]))
    
    # 处理表单数据
    for item in data["form_data"]:
        print(f"字段 {item['field_label']} ({item['type']}):")
        if item["type"] == "text":
            print(f"  内容: {item['content']}")
        else:
            print(f"  文件URL: {item['url']}")
else:
    print(f"错误 {response.status_code}:", response.json()) 