# 活动表单管理 API 文档

## 数据库初始化

```python
from utils.db_init import DatabaseInitializer

# 初始化数据库
DatabaseInitializer.init_database()
```

## 表单字段管理（管理员）

### 1. 创建表单字段
```python
from utils.form_service import FormService

# 创建文本字段
text_field = {
    "field_name": "description",
    "field_label": "项目描述",
    "field_type": "text",
    "is_required": True
}
field_id = FormService.create_form_field(competition_id=1, field_data=text_field)

# 创建图片字段
image_field = {
    "field_name": "team_photo",
    "field_label": "团队照片",
    "field_type": "image",
    "is_required": True
}
field_id = FormService.create_form_field(competition_id=1, field_data=image_field)

# 创建文件字段
file_field = {
    "field_name": "proposal",
    "field_label": "项目企划书",
    "field_type": "file",
    "is_required": True
}
field_id = FormService.create_form_field(competition_id=1, field_data=file_field)

# 创建单选字段
radio_field = {
    "field_name": "project_type",
    "field_label": "项目类型",
    "field_type": "radio",
    "is_required": True,
    "options": [
        {"value": "tech", "label": "科技创新"},
        {"value": "art", "label": "艺术设计"},
        {"value": "social", "label": "社会公益"}
    ]
}
field_id = FormService.create_form_field(competition_id=1, field_data=radio_field)
```

### 2. 更新表单字段
```python
update_data = {
    "field_label": "新的字段标签",
    "is_required": False
}
success = FormService.update_form_field(field_id=1, field_data=update_data)
```

### 3. 删除表单字段
```python
success = FormService.delete_form_field(field_id=1)
```

### 4. 获取活动的表单字段
```python
fields = FormService.get_competition_fields(competition_id=1)
```

## 表单数据管理

### 1. 保存表单数据
```python
# 文本数据
form_data = {
    "1": "这是一段描述文本",
    "2": "base64,/9j/4AAQSkZJRg...",  # base64编码的图片
    "3": b"文件二进制数据",  # 文件数据
    "4": "tech"  # 单选字段选中的值
}
success = FormService.save_form_data(registration_id=1, form_data=form_data)
```

### 2. 获取报名表单数据
```python
data = FormService.get_registration_data(registration_id=1)
```

### 3. 获取文件路径
```python
file_path = FormService.get_file_path(registration_id=1, field_id=3)
```

## 数据结构

### 活动表单字段表 (competition_form_fields)
```sql
CREATE TABLE competition_form_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    competition_id INT NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    field_label VARCHAR(100) NOT NULL,
    field_type VARCHAR(20) NOT NULL,  -- text, image, file
    is_required BOOLEAN DEFAULT true,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
);
```

### 报名表单数据表 (registration_form_data)
```sql
CREATE TABLE registration_form_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    registration_id INT NOT NULL,
    competition_id INT NOT NULL,
    user_id INT NOT NULL,
    field_id INT NOT NULL,
    field_value TEXT,
    file_path VARCHAR(255),
    created_at DATETIME NOT NULL,
    FOREIGN KEY (registration_id) REFERENCES competition_registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES competition_form_fields(id)
);
```

## 字段类型说明

### field_type
- `text`: 文本字段
- `image`: 图片字段（接受base64编码）
- `file`: 文件字段（接受二进制数据）
- `radio`: 单选字段（接受预设选项）

## 文件存储
- 所有上传的文件都存储在 `uploads/competition_files` 目录下
- 文件名使用 UUID 生成，保证唯一性
- 支持的文件类型：pdf, doc, docx, jpg, jpeg, png

## 安全说明
1. 文件上传安全：
   - 限制文件类型
   - 使用安全的文件名
   - 限制文件大小

2. 访问控制：
   - 表单字段管理需要管理员权限
   - 文件访问需要登录验证

3. 数据验证：
   - 验证必填字段
   - 验证文件类型
   - 验证base64格式 

## 表单数据提交接口

### 保存表单数据和文件
```http
POST /forms/registrations/{registration_id}/data
```

**请求格式**: `multipart/form-data` 或 `application/json`

**请求参数**:
- `registration_id`: 报名记录ID

#### 方式1: 使用 multipart/form-data（适合含文件上传）

**请求头**:
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**请求体**:
```form-data
# 表单数据（必需）- JSON字符串
form_data: {
    "1": "文本值",  # 文本字段
    "2": "其他文本值"
}

# 文件字段 - 字段名格式为 field_<字段ID>
field_3: (文件1)  # 例如：field_3 对应字段ID为3的文件
field_4: (文件2)  # 例如：field_4 对应字段ID为4的文件
```

#### 方式2: 使用 application/json（适合文本和base64图片）

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**:
```json
{
    "1": "文本值",  # 文本字段
    "2": "其他文本值",
    "3": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",  # Base64编码的图片
    "4": {  # 文件对象格式
        "filename": "document.pdf",
        "content": "base64编码的文件内容"
    }
}
```

**响应**:
```json
{
    "success": true,
    "message": "表单数据保存成功",
    "saved_data": {
        "text_fields": {
            "1": "文本值",
            "2": "其他文本值"
        },
        "files": [
            {
                "field_id": "3",
                "original_filename": "image.jpg",
                "saved_filename": "a1b2c3d4.jpg",
                "file_type": "jpg",
                "file_size": 123456
            },
            {
                "field_id": "4",
                "original_filename": "document.pdf",
                "saved_filename": "e5f6g7h8_document.pdf",
                "file_type": "pdf",
                "file_size": 654321
            }
        ]
    }
}
```

**错误响应**:
```json
{
    "detail": {
        "success": false,
        "message": "表单数据部分保存失败",
        "field_errors": {
            "1": "字段错误信息",
            "3": "图片格式错误"
        },
        "file_errors": [
            {
                "field_id": "4",
                "error": "文件大小超过限制"
            }
        ]
    }
}
```

**状态码**:
- 200: 请求成功
- 400: 请求数据格式错误
- 401: 未登录
- 403: 无权限
- 404: 报名记录不存在
- 413: 文件大小超出限制
- 415: 不支持的文件类型
- 500: 服务器错误

### 获取表单数据和文件
```http
GET /forms/registrations/{registration_id}/data
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
```json
{
    "text_fields": {
        "1": {
            "field_name": "description",
            "field_label": "描述",
            "field_type": "text",
            "field_value": "这是一段描述文本"
        }
    },
    "file_fields": {
        "2": {
            "field_name": "proposal",
            "field_label": "项目企划书",
            "field_type": "file",
            "original_filename": "a1b2c3d4_proposal.pdf",
            "saved_filename": "a1b2c3d4_proposal.pdf",
            "file_url": "/forms/files/1/2",
            "file_type": "pdf",
            "file_size": 654321
        },
        "3": {
            "field_name": "team_photo",
            "field_label": "团队照片",
            "field_type": "image",
            "original_filename": "image.jpg",
            "saved_filename": "e5f6g7h8.jpg",
            "file_url": "/forms/files/1/3",
            "file_type": "jpg",
            "file_size": 123456
        }
    }
}
```

### 获取上传的文件
```http
GET /forms/files/{registration_id}/{field_id}
```

**请求头**:
```
Authorization: Bearer <token>
```

**响应**:
- 对于图片文件：直接返回图片内容（支持浏览器预览）
- 对于文档文件：触发文件下载

**响应头**:
```
# 图片文件
Content-Type: image/jpeg
Content-Disposition: inline; filename="team_photo.jpg"

# 文档文件
Content-Type: application/pdf
Content-Disposition: attachment; filename="proposal.pdf"
```

## 字段类型说明

### field_type
- `text`: 文本字段
- `image`: 图片字段（Base64编码）
- `file`: 文件字段

## 文件上传规则

### 文件存储路径
- 图片文件：`uploads/competition_files/images/`
- 文档文件：`uploads/competition_files/documents/`

### 文件命名规则
- 格式：`{uuid}_{original_filename}`
- 示例：`a1b2c3d4e5f6g7h8_proposal.pdf`

### 文件类型限制
- 图片：jpg, jpeg, png
- 文档：pdf, doc, docx

### 文件大小限制（更新）

- 图片文件：最大 5MB
- 文档文件：最大 10MB
- 视频文件：最大 1GB
- 压缩包文件：最大 500MB
- 演示文稿：最大 50MB
- 表格文件：最大 20MB

## 安全措施

### 文件上传安全
1. 文件类型验证：
   - 使用文件内容验证文件类型
   - 不仅验证扩展名，还验证文件内容
   - 拒绝可执行文件和脚本文件

2. 文件命名安全：
   - 使用 UUID 生成唯一文件名
   - 使用 `secure_filename` 处理文件名
   - 移除特殊字符和空格

3. 存储安全：
   - 文件存储在非 Web 根目录
   - 使用随机生成的文件名
   - 访问时进行用户权限验证

### 表单数据安全
1. 数据验证：
   - 验证必填字段
   - 验证文件类型和大小
   - 验证 Base64 格式

2. 访问控制：
   - 基于用户角色的访问控制
   - 文件访问需要认证
   - 记录数据访问日志

## 使用示例

### 使用multipart/form-data提交表单数据
```javascript
// 创建FormData对象
const formData = new FormData();

// 添加表单数据（JSON字符串）
const textData = {
  "1": "这是一段描述文本",
  "2": "团队成员介绍"
};
formData.append('form_data', JSON.stringify(textData));

// 添加文件
const fileInput = document.querySelector('#file-input');
formData.append('field_3', fileInput.files[0]);

// 添加图片
const imageInput = document.querySelector('#image-input');
formData.append('field_4', imageInput.files[0]);

// 发送请求
fetch('http://localhost:8000/forms/registrations/1/data', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### 使用application/json提交表单数据
```javascript
// 准备表单数据
const formData = {
  "1": "这是一段描述文本",
  "2": "团队成员介绍"
};

// 添加Base64图片
const getBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

const imageInput = document.querySelector('#image-input');
const imageFile = imageInput.files[0];

getBase64(imageFile).then(base64Image => {
  formData["3"] = base64Image;
  
  // 发送请求
  fetch('http://localhost:8000/forms/registrations/1/data', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  })
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
});
```

### 获取表单数据
```javascript
fetch('http://localhost:8000/forms/registrations/1/data', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => response.json())
.then(data => {
  // 显示文本字段
  for (const [fieldId, field] of Object.entries(data.text_fields)) {
    console.log(`${field.field_label}: ${field.field_value}`);
  }
  
  // 显示文件字段
  for (const [fieldId, field] of Object.entries(data.file_fields)) {
    if (field.field_type === 'image') {
      // 显示图片
      const imgElement = document.createElement('img');
      imgElement.src = field.file_url;
      document.body.appendChild(imgElement);
    } else {
      // 创建文件下载链接
      const linkElement = document.createElement('a');
      linkElement.href = field.file_url;
      linkElement.textContent = `下载 ${field.original_filename}`;
      document.body.appendChild(linkElement);
    }
  }
})
.catch(error => console.error('Error:', error));
```

## 增强型表单数据提交 API (更新)

### 基本信息

- **URL路径**: `/forms/registrations/{registration_id}/enhanced-data`
- **方法**: POST
- **描述**: 提交表单数据，包括文本内容、图片数据和文件路径

### 参数说明

#### 路径参数

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| registration_id | 整数 | 是 | 报名记录ID |

#### 请求体参数

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| form_request | JSON对象 | 是 | 包含items数组的表单数据 |

### form_request 参数格式说明 (更新)

`form_request`参数格式：

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
      "field_type": "image",
      "content": "uploads/competition_files/images/1a2b3c4d.jpg"
    },
    {
      "field_id": 4,
      "field_type": "file",
      "content": "uploads/competition_files/documents/5e6f7g8h.pdf"
    }
  ]
}
```

### 字段说明 (更新)

表单项具有以下字段：

| 字段名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| field_id | 整数 | 是 | 表单字段ID |
| field_type | 字符串 | 是 | 字段类型，可选值: "text", "image", "file" |
| content | 字符串 | 是 | 字段内容，根据类型不同而不同 |

根据`field_type`的不同，`content`的格式如下：

- `text`: 文本字符串
- `image`: 
  - Base64编码的图片数据，格式为`data:image/jpeg;base64,...`
  - 或者先前上传的图片文件路径，格式为`uploads/...`
- `file`: 
  - 先前上传的文件路径，格式为`uploads/...`

### 请求示例 (更新)

```javascript
async function submitFormWithFiles() {
  // 第一步：上传文件获取路径
  const imagePath = await uploadFile('image');
  const documentPath = await uploadFile('file');
  
  // 第二步：准备表单数据
  const formItems = [
    { field_id: 1, field_type: "text", content: "文本内容" },
    { field_id: 2, field_type: "image", content: imagePath },
    { field_id: 3, field_type: "file", content: documentPath }
  ];
  
  // 第三步：提交表单数据
  const response = await fetch('/forms/registrations/123/enhanced-data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items: formItems })
  });
  
  const result = await response.json();
  console.log(result);
}

// 辅助函数：上传文件
async function uploadFile(fieldType) {
  const fileInput = document.getElementById(`${fieldType}-input`);
  const file = fileInput.files[0];
  if (!file) return null;
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('field_type', fieldType);
  
  const response = await fetch('/forms/upload-file', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    // 保存文件路径，用于后续表单提交
    const filePath = result.data.file_path;
    console.log('文件上传成功，路径:', filePath);
    return filePath;
  } else {
    console.error('文件上传失败:', result.message);
    return null;
  }
}
```

## 表单字段获取 API

### 基本信息

- **URL路径**: `/forms/competitions/{competition_id}/fields`
- **方法**: GET
- **描述**: 获取活动的表单字段列表

### 参数说明

#### 路径参数

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| competition_id | 整数 | 是 | 活动ID |

### 响应格式

```json
[
  {
    "id": 1,
    "competition_id": 5,
    "field_name": "name",
    "field_label": "姓名",
    "field_type": "text",
    "is_required": true,
    "options": null,
    "sort_order": 1
  },
  {
    "id": 2,
    "competition_id": 5,
    "field_name": "photo",
    "field_label": "选手图片",
    "field_type": "image",
    "is_required": true,
    "options": null,
    "sort_order": 2
  },
  {
    "id": 3,
    "competition_id": 5,
    "field_name": "document",
    "field_label": "选手文件",
    "field_type": "file",
    "is_required": true,
    "options": null,
    "sort_order": 3
  },
  {
    "id": 4,
    "competition_id": 5,
    "field_name": "project_type",
    "field_label": "项目类型",
    "field_type": "radio",
    "is_required": true,
    "options": [
      {"value": "tech", "label": "科技创新"},
      {"value": "art", "label": "艺术设计"},
      {"value": "social", "label": "社会公益"}
    ],
    "sort_order": 4
  }
]
```

## 常见问题与疑难解答

### Q: 为什么我的表单提交收到"Input should be a valid dictionary"错误？

A: 这个错误通常是因为`form_request`参数的格式不正确。确保您的`form_request`是一个有效的JSON对象，包含`items`数组，或者是一个JSON字符串。

### Q: 如何上传文件？

A: 上传文件需要使用`multipart/form-data`格式，并设置文件字段名为`file_{field_id}`，其中`field_id`对应表单项的ID。另外，在表单项中将对应字段的`content`设置为`null`。

### Q: 我的请求中找不到form_request字段？

A: 确保您按照正确的方式提交表单：
- 对于JSON请求，确保`form_request`或`items`是请求体的顶级字段
- 对于multipart/form-data请求，确保`form_request`或`items`作为表单字段提交 

## 文件上传 API（仅限非图片文件）

### 基本信息

- **URL路径**: `/forms/upload-file`
- **方法**: POST
- **描述**: 单独上传非图片类型文件并返回文件路径，用于后续表单提交时引用

### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
| ----- | ---- | ---- | ---- |
| file | 文件 | 是 | 要上传的文件（不接受图片类型） |
| field_type | 字符串 | 是 | 字段类型，只能是"file" |

### 支持的文件类型（更新）

- **文档类型**: pdf, doc, docx, txt
- **视频类型**: mp4, avi, mov, wmv, flv, mkv
- **压缩包类型**: zip, rar, 7z, tar, gz
- **演示文稿类型**: ppt, pptx
- **表格类型**: xls, xlsx, csv

### 文件存储路径

- **文档文件**: `uploads/competition_files/documents/`
- **视频文件**: `uploads/competition_files/videos/`
- **压缩包文件**: `uploads/competition_files/archives/`
- **演示文稿文件**: `uploads/competition_files/presentations/`
- **表格文件**: `uploads/competition_files/spreadsheets/`

### 响应格式

成功响应：

```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "original_filename": "document.pdf",
    "file_path": "uploads/competition_files/documents/1a2b3c4d5e6f7g8h.pdf",
    "file_size": 125000,
    "file_type": "file"
  }
}
```

错误响应：

```json
{
  "success": false,
  "message": "不接受图片类型文件，图片请使用base64格式直接提交",
  "status_code": 400
}
```

### 使用示例

```javascript
async function uploadFile() {
  const fileInput = document.getElementById('file-input');
  const file = fileInput.files[0];
  if (!file) return;
  
  // 确保文件不是图片类型
  if (file.type.startsWith('image/')) {
    console.error('不能上传图片类型，请使用base64方式提交图片');
    return null;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  formData.append('field_type', 'file');
  
  const response = await fetch('/forms/upload-file', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  if (result.success) {
    // 保存文件路径，用于后续表单提交
    const filePath = result.data.file_path;
    console.log('文件上传成功，路径:', filePath);
    return filePath;
  } else {
    console.error('文件上传失败:', result.message);
    return null;
  }
}
```

## 图片处理方式（更新）

图片类型字段只能使用base64编码方式提交，不支持文件上传方式。以下是处理图片的示例代码：

```javascript
// 将图片转换为base64
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// 处理图片上传
async function handleImageUpload() {
  const imageInput = document.getElementById('image-input');
  const file = imageInput.files[0];
  if (!file) return null;
  
  // 检查是否为图片
  if (!file.type.startsWith('image/')) {
    console.error('只能选择图片文件');
    return null;
  }
  
  try {
    // 转换为base64
    const base64Image = await getBase64(file);
    console.log('图片已转换为base64格式');
    return base64Image;
  } catch (error) {
    console.error('图片转换失败:', error);
    return null;
  }
}
```

## 表单数据流程图 (更新)

```
┌─────────────┐     ┌───────────────────┐
│ 选择图片文件 │────▶│ 转换为base64格式   │
└─────────────┘     └─────────┬─────────┘
                              │
┌─────────────┐     ┌─────────▼─────────┐    ┌──────────────────┐
│ 选择普通文件 │────▶│ 调用文件上传API    │───▶│ 获取文件路径      │
└─────────────┘     └─────────┬─────────┘    └────────┬─────────┘
                              │                       │
                              ▼                       ▼
┌─────────────┐     ┌─────────────────────────────────────────┐
│填写文本字段  │────▶│          组装表单数据                   │
└─────────────┘     └───────────────────┬─────────────────────┘
                                        │
                                        ▼
                                ┌────────────────┐     ┌──────────────────┐
                                │ 提交表单数据API │────▶│ 处理响应结果      │
                                └────────────────┘     └──────────────────┘
```

## 常见问题与疑难解答

### Q: 为什么不能上传图片文件？

A: 为了简化处理流程，所有图片必须以base64格式直接提交，不支持文件上传方式。这样可以：
1. 减少服务器存储压力
2. 简化图片的处理和显示
3. 避免不必要的文件IO操作

### Q: 如何处理大图片？

A: 对于较大的图片，请考虑以下做法：
1. 在前端对图片进行压缩后再转为base64
2. 限制图片的尺寸和质量
3. 如果图片确实太大，可以考虑联系管理员提供特殊处理方式

### Q: 有哪些非图片文件类型可以上传？

A: 系统支持以下文件类型：
- PDF文档（.pdf）
- Word文档（.doc, .docx）
- 其他在系统配置中允许的文件类型 

### 获取活动表单信息
```http
POST /forms/competitions/{competition_id}/form-data
```

**请求参数**:
- **Path参数**:
  - `competition_id` (整数): 活动ID

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**:
```json
{}
```
注意: 此接口虽然使用POST方法，但不需要在请求体中提供任何数据，可以发送空JSON对象。

**成功响应** (200 OK):
```json
{
    "success": true,
    "competition": {
        "id": 1,
        "name": "创新大赛",
        "registration_id": 123,
        "status": "pending",
        "created_at": "2024-03-09T01:00:38"
    },
    "form_fields": [
        {
            "id": 1,
            "name": "project_name",
            "label": "项目名称",
            "type": "text",
            "is_required": true
        },
        {
            "id": 2,
            "name": "team_photo",
            "label": "团队照片",
            "type": "image",
            "is_required": true
        },
        {
            "id": 4,
            "name": "project_type",
            "label": "项目类型",
            "type": "radio",
            "is_required": true,
            "options": [
                {"value": "tech", "label": "科技创新"},
                {"value": "art", "label": "艺术设计"},
                {"value": "social", "label": "社会公益"}
            ],
            "sort_order": 4
        }
    ],
    "submitted_data": {
        "text_fields": {
            "1": {
                "field_name": "project_name",
                "field_label": "项目名称",
                "field_type": "text",
                "field_value": "创新项目"
            }
        },
        "file_fields": {
            "2": {
                "field_name": "team_photo",
                "field_label": "团队照片",
                "field_type": "image",
                "original_filename": "team.jpg",
                "saved_filename": "a1b2c3d4.jpg",
                "file_url": "/forms/files/123/2",
                "file_type": "jpg",
                "file_size": 1024567
            }
        }
    }
}
```

**错误响应** (404 Not Found):
```json
{
    "detail": "未找到该活动的报名记录或无权访问"
}
```

**状态码**:
- 200: 请求成功
- 401: 未登录
- 404: 未找到报名记录或无权访问
- 500: 服务器错误

**说明**:
1. 该接口需要用户登录
2. 只有已报名该活动的用户才能获取表单信息
3. 返回数据包括：
   - 活动基本信息
   - 所有表单字段定义
   - 用户已提交的表单数据（如果有）
4. 文件类型字段会包含文件访问URL

## 通过文件路径获取文件

```http
POST /forms/files/by-path
```

**请求头**:
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体**:
```json
{
  "file_path": "uploads/competition_files/documents/1a2b3c4d5e6f7g8h.pdf"
}
```

**成功响应**:
- 对于图片文件：直接返回图片内容（支持浏览器预览）
- 对于文档文件：触发文件下载

**响应头**:
```
# 图片文件
Content-Type: image/jpeg
Content-Disposition: inline; filename="team_photo.jpg"

# 文档文件
Content-Type: application/pdf
Content-Disposition: attachment; filename="document.pdf"
```

**错误响应**:
```json
{
  "success": false,
  "message": "文件不存在或您无权访问",
  "status_code": 404
}
```

**状态码**:
- 200: 请求成功
- 400: 请求参数错误
- 401: 未登录
- 403: 无权访问该文件
- 404: 文件不存在
- 500: 服务器错误

**安全校验**:
1. 验证用户登录状态
2. 验证用户是否有权限访问该文件（检查文件所属用户ID）
3. 验证文件是否存在于数据库记录中
4. 验证文件是否存在于文件系统中