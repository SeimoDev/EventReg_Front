# 表单 API 文档

## 目录
- [表单 API 文档](#表单-api-文档)
  - [目录](#目录)
  - [获取用户活动报名信息](#获取用户活动报名信息)
    - [请求](#请求)
    - [响应](#响应)
  - [获取单个报名表单数据](#获取单个报名表单数据)
    - [请求](#请求-1)
    - [响应](#响应-1)
  - [提交表单数据](#提交表单数据)
    - [请求](#请求-2)
    - [响应](#响应-2)
  - [文件上传和访问](#文件上传和访问)
    - [上传文件](#上传文件)
    - [访问文件](#访问文件)
  - [日期类型字段](#日期类型字段)
    - [创建日期类型字段](#创建日期类型字段)
    - [提交日期类型字段数据](#提交日期类型字段数据)
    - [响应示例](#响应示例)
  - [带"其他"选项的单选字段](#带其他选项的单选字段)
    - [创建带"其他"选项的单选字段](#创建带其他选项的单选字段)
    - [提交带自定义内容的单选字段数据](#提交带自定义内容的单选字段数据)
    - [响应示例](#响应示例-1)

## 获取用户活动报名信息

获取当前用户在指定活动中的所有报名信息。

### 请求

```http
GET /forms/competitions/{competition_id}/user-registrations
```

**路径参数：**
- `competition_id`: 活动ID

**请求头：**
```
Authorization: Bearer <token>
```

### 响应

**成功响应 (200 OK)**
```json
{
    "success": true,
    "registrations": [
        {
            "id": 1,
            "team_name": "创新队",
            "status": "pending",
            "created_at": "2024-03-20 10:00:00",
            "competition_name": "创新设计大赛",
            "form_data": [
                {
                    "field_id": 1,
                    "field_name": "project_name",
                    "field_label": "项目名称",
                    "type": "text",
                    "content": "智能家居系统"
                },
                {
                    "field_id": 2,
                    "field_name": "team_photo",
                    "field_label": "团队照片",
                    "type": "image",
                    "content": "uploads/xxx.jpg",
                    "url": "/forms/files/1/2"
                },
                {
                    "field_id": 3,
                    "field_name": "project_type",
                    "field_label": "项目类型",
                    "type": "radio",
                    "content": "tech",
                    "options": [
                        {"value": "tech", "label": "科技创新"},
                        {"value": "art", "label": "艺术设计"}
                    ]
                }
            ]
        }
    ]
}
```

**字段说明：**
- `success`: 是否成功
- `registrations`: 报名记录列表
  - `id`: 报名记录ID
  - `team_name`: 项目名称
  - `status`: 报名状态（pending: 待审核, approved: 已通过, rejected: 已拒绝）
  - `created_at`: 创建时间
  - `competition_name`: 活动名称
  - `form_data`: 表单数据列表
    - `field_id`: 字段ID
    - `field_name`: 字段名称
    - `field_label`: 字段标签
    - `type`: 字段类型（text: 文本, image: 图片, file: 文件, radio: 单选）
    - `content`: 字段内容
    - `url`: 文件访问URL（仅图片和文件类型）
    - `options`: 选项列表（仅单选类型）

## 获取单个报名表单数据

获取指定报名记录的详细表单数据。

### 请求

```http
GET /forms/registrations/{registration_id}/enhanced-data
```

**路径参数：**
- `registration_id`: 报名记录ID

**请求头：**
```
Authorization: Bearer <token>
```

### 响应

**成功响应 (200 OK)**
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
        "created_at": "2024-03-20T10:00:00"
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
            "field_name": "team_photo",
            "field_label": "团队照片",
            "type": "image",
            "content": "uploads/xxx.jpg",
            "url": "/forms/files/1/2"
        }
    ]
}
```

## 提交表单数据

提交或更新报名表单数据。

### 请求

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

**路径参数：**
- `registration_id`: 报名记录ID

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体：**
```json
{
    "items": [
        {
            "field_id": 1,
            "field_type": "text",
            "content": "智能家居系统"
        },
        {
            "field_id": 2,
            "field_type": "image",
            "content": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
        },
        {
            "field_id": 3,
            "field_type": "file",
            "content": "uploads/competition_files/documents/xxx.pdf"
        },
        {
            "field_id": 4,
            "field_type": "radio",
            "content": "tech"
        }
    ]
}
```

### 响应

**成功响应 (200 OK)**
```json
{
    "success": true,
    "message": "表单数据保存成功",
    "data": {
        "saved_data": {
            "text_fields": {
                "1": "智能家居系统",
                "4": "tech"
            },
            "files": [
                {
                    "field_id": "2",
                    "original_filename": "team.jpg",
                    "saved_filename": "xxx.jpg",
                    "file_type": "jpg"
                },
                {
                    "field_id": "3",
                    "original_filename": "proposal.pdf",
                    "saved_filename": "xxx.pdf",
                    "file_type": "pdf"
                }
            ]
        }
    }
}
```

## 文件上传和访问

### 上传文件

上传文件（不包括图片，图片应使用base64直接提交）。

```http
POST /forms/upload-file
```

**请求头：**
```
Content-Type: multipart/form-data
Authorization: Bearer <token>
```

**表单参数：**
- `file`: 文件
- `field_type`: 字段类型（必须为 "file"）

**成功响应 (200 OK)**
```json
{
    "success": true,
    "message": "文件上传成功",
    "data": {
        "file_path": "uploads/competition_files/documents/xxx.pdf"
    }
}
```

### 访问文件

通过文件路径访问文件。

```http
POST /forms/files/by-path
```

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <token>
```

**请求体：**
```json
{
    "file_path": "uploads/competition_files/documents/xxx.pdf"
}
```

**响应：**
- 成功时直接返回文件内容
- 失败时返回错误信息 

## 日期类型字段

日期类型字段用于收集日期信息，如出生日期、活动日期等。

### 创建日期类型字段

```http
POST /forms/fields
```

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**请求体：**
```json
{
    "competition_id": 1,
    "field_name": "birth_date",
    "field_label": "出生日期",
    "field_type": "date",
    "is_required": true
}
```

### 提交日期类型字段数据

提交日期数据时，使用ISO格式的日期字符串（YYYY-MM-DD）。

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

**请求体示例：**
```json
{
    "items": [
        {
            "field_id": 5,
            "field_type": "date",
            "content": "2000-01-01"
        }
    ]
}
```

### 响应示例

日期类型字段的值会以字符串形式返回：

```json
{
    "id": 105,
    "field_id": 5,
    "field_name": "birth_date",
    "field_label": "出生日期",
    "type": "date",
    "content": "2000-01-01"
}
```

## 带"其他"选项的单选字段

单选字段现在支持添加"其他"选项，允许用户在没有合适选项时输入自定义内容。

### 创建带"其他"选项的单选字段

```http
POST /forms/fields
```

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**请求体：**
```json
{
    "competition_id": 1,
    "field_name": "education",
    "field_label": "最高学历",
    "field_type": "radio",
    "is_required": true,
    "options": [
        {"value": "high_school", "label": "高中"},
        {"value": "bachelor", "label": "本科"},
        {"value": "master", "label": "硕士"},
        {"value": "doctor", "label": "博士"}
    ],
    "other_option": true
}
```

### 提交带自定义内容的单选字段数据

当用户选择"其他"选项时，可以提交一个包含自定义内容的对象。

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

**提交预设选项时：**
```json
{
    "items": [
        {
            "field_id": 6,
            "field_type": "radio",
            "content": "bachelor"
        }
    ]
}
```

**提交自定义选项时：**
```json
{
    "items": [
        {
            "field_id": 6,
            "field_type": "radio",
            "content": {
                "other": true,
                "value": "职业教育"
            }
        }
    ]
}
```

### 响应示例

```json
{
    "field_id": 6,
    "field_name": "education",
    "field_label": "最高学历",
    "type": "radio",
    "content": {
        "other": true,
        "value": "职业教育"
    },
    "options": [
        {"value": "high_school", "label": "高中"},
        {"value": "bachelor", "label": "本科"},
        {"value": "master", "label": "硕士"},
        {"value": "doctor", "label": "博士"}
    ],
    "other_option": true
}
```

或者对于选择了预设选项的情况：

```json
{
    "field_id": 6,
    "field_name": "education",
    "field_label": "最高学历",
    "type": "radio",
    "content": "bachelor",
    "options": [
        {"value": "high_school", "label": "高中"},
        {"value": "bachelor", "label": "本科"},
        {"value": "master", "label": "硕士"},
        {"value": "doctor", "label": "博士"}
    ],
    "other_option": true
}
``` 