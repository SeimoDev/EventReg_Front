# 表单字段扩展功能文档

本文档详细说明了表单系统的两个重要扩展功能：**日期类型字段**和**带"其他"选项的单选字段**。

## 目录
- [表单字段扩展功能文档](#表单字段扩展功能文档)
  - [目录](#目录)
  - [日期类型字段](#日期类型字段)
    - [创建日期类型字段（管理接口）](#创建日期类型字段管理接口)
    - [更新日期类型字段（管理接口）](#更新日期类型字段管理接口)
    - [提交日期类型字段数据（enhanced-data接口）](#提交日期类型字段数据enhanced-data接口)
    - [获取日期类型字段数据（enhanced-data接口）](#获取日期类型字段数据enhanced-data接口)
    - [日期格式验证](#日期格式验证)
  - [带"其他"选项的单选字段](#带其他选项的单选字段)
    - [创建带"其他"选项的单选字段（管理接口）](#创建带其他选项的单选字段管理接口)
    - [更新带"其他"选项的单选字段（管理接口）](#更新带其他选项的单选字段管理接口)
    - [提交带"其他"选项的单选字段数据（enhanced-data接口）](#提交带其他选项的单选字段数据enhanced-data接口)
    - [获取带"其他"选项的单选字段数据（enhanced-data接口）](#获取带其他选项的单选字段数据enhanced-data接口)
  - [与活动表单管理的集成](#与活动表单管理的集成)
    - [获取活动所有字段（管理接口）](#获取活动所有字段管理接口)
    - [获取活动所有表单数据（管理接口）](#获取活动所有表单数据管理接口)
  - [数据库结构变更](#数据库结构变更)
  - [前端实现建议](#前端实现建议)

## 日期类型字段

日期类型字段用于收集日期信息，如出生日期、活动日期等。系统使用ISO格式的日期字符串（YYYY-MM-DD）。

### 创建日期类型字段（管理接口）

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

**成功响应 (200 OK)**
```json
{
    "id": 5
}
```

### 更新日期类型字段（管理接口）

```http
PUT /forms/fields/{field_id}
```

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**请求体：**
```json
{
    "field_label": "活动日期",
    "is_required": true
}
```

**成功响应 (200 OK)**
```json
{
    "success": true
}
```

### 提交日期类型字段数据（enhanced-data接口）

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

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
            "field_id": 5,
            "field_type": "date",
            "content": "2000-01-01"
        }
    ]
}
```

**成功响应 (200 OK)**
```json
{
    "success": true,
    "message": "表单数据保存成功",
    "data": {
        "saved_data": {
            "text_fields": {
                "5": "2000-01-01"
            },
            "files": []
        }
    }
}
```

### 获取日期类型字段数据（enhanced-data接口）

```http
GET /forms/registrations/{registration_id}/enhanced-data
```

**请求头：**
```
Authorization: Bearer <token>
```

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
            "id": 105,
            "field_id": 5,
            "field_name": "birth_date",
            "field_label": "出生日期",
            "type": "date",
            "content": "2000-01-01"
        }
    ]
}
```

### 日期格式验证

系统会自动验证日期格式是否符合ISO标准（YYYY-MM-DD）。如果日期格式不正确，将返回错误信息：

```json
{
    "success": false,
    "message": "日期格式错误，请使用YYYY-MM-DD格式",
    "field_errors": {
        "5": "日期格式错误"
    }
}
```

## 带"其他"选项的单选字段

单选字段现在支持添加"其他"选项，允许用户在没有合适选项时输入自定义内容。

### 创建带"其他"选项的单选字段（管理接口）

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

**成功响应 (200 OK)**
```json
{
    "id": 6
}
```

### 更新带"其他"选项的单选字段（管理接口）

```http
PUT /forms/fields/{field_id}
```

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**请求体：**
```json
{
    "field_label": "教育程度",
    "options": [
        {"value": "high_school", "label": "高中"},
        {"value": "bachelor", "label": "学士"},
        {"value": "master", "label": "硕士"},
        {"value": "doctor", "label": "博士"}
    ],
    "other_option": true
}
```

**成功响应 (200 OK)**
```json
{
    "success": true
}
```

### 提交带"其他"选项的单选字段数据（enhanced-data接口）

当用户选择预设选项时：

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

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
            "field_id": 6,
            "field_type": "radio",
            "content": "bachelor"
        }
    ]
}
```

当用户选择"其他"选项并输入自定义内容时：

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

**请求体：**
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

**成功响应 (200 OK)**
```json
{
    "success": true,
    "message": "表单数据保存成功",
    "data": {
        "saved_data": {
            "text_fields": {
                "6": "{\"other\":true,\"value\":\"职业教育\"}"
            },
            "files": []
        }
    }
}
```

### 获取带"其他"选项的单选字段数据（enhanced-data接口）

```http
GET /forms/registrations/{registration_id}/enhanced-data
```

**请求头：**
```
Authorization: Bearer <token>
```

**成功响应 (200 OK) - 预设选项场景**
```json
{
    "success": true,
    "registration": {
        "id": 1,
        "user_id": 123,
        "user_name": "张三",
        "competition_id": 5,
        "competition_name": "创新设计大赛",
        "status": "submitted"
    },
    "form_data": [
        {
            "id": 106,
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
    ]
}
```

**成功响应 (200 OK) - 自定义选项场景**
```json
{
    "success": true,
    "registration": {
        "id": 1,
        "user_id": 123,
        "user_name": "张三",
        "competition_id": 5,
        "competition_name": "创新设计大赛",
        "status": "submitted"
    },
    "form_data": [
        {
            "id": 106,
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
    ]
}
```

## 与活动表单管理的集成

### 获取活动所有字段（管理接口）

```http
GET /forms/competitions/{competition_id}/fields
```

**请求头：**
```
Authorization: Bearer <admin_token>
```

**成功响应 (200 OK)**
```json
[
    {
        "id": 1,
        "competition_id": 1,
        "field_name": "project_name",
        "field_label": "项目名称",
        "field_type": "text",
        "is_required": true
    },
    {
        "id": 5,
        "competition_id": 1,
        "field_name": "birth_date",
        "field_label": "出生日期",
        "field_type": "date",
        "is_required": true
    },
    {
        "id": 6,
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
]
```

### 获取活动所有表单数据（管理接口）

```http
GET /forms/admin/competitions/{competition_id}/users/{user_id}/data
```

**请求头：**
```
Authorization: Bearer <admin_token>
```

**成功响应 (200 OK)**
```json
{
    "success": true,
    "registration": {
        "id": 1,
        "user_id": 123,
        "user_name": "张三",
        "competition_id": 5,
        "competition_name": "创新设计大赛",
        "status": "submitted"
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
            "id": 105,
            "field_id": 5,
            "field_name": "birth_date",
            "field_label": "出生日期",
            "type": "date",
            "content": "2000-01-01"
        },
        {
            "id": 106,
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
    ]
}
```

## 数据库结构变更

实现这些新功能，系统进行了以下数据库结构变更：

1. 添加了 `other_option` 字段到 `competition_form_fields` 表：
   ```sql
   ALTER TABLE competition_form_fields
   ADD COLUMN other_option BOOLEAN DEFAULT FALSE
   AFTER options
   ```

2. 更新了 `enhanced_form_data` 视图，以支持新的类型和字段：
   ```sql
   CREATE VIEW enhanced_form_data AS
   SELECT 
       rfd.id,
       rfd.registration_id,
       rfd.competition_id,
       rfd.user_id,
       rfd.field_id,
       cff.field_name,
       cff.field_label,
       cff.field_type AS type,
       CASE 
           WHEN cff.field_type IN ('text', 'radio', 'date') THEN rfd.field_value
           ELSE rfd.file_path
       END AS content,
       cff.options,
       cff.other_option,
       cr.team_name,
       rfd.created_at
   FROM 
       registration_form_data rfd
   JOIN 
       competition_form_fields cff ON rfd.field_id = cff.id
   JOIN 
       competition_registrations cr ON rfd.registration_id = cr.id
   ```

## 前端实现建议

1. **日期类型字段**：
   - 使用日期选择器组件
   - 将选择的日期格式化为ISO标准格式（YYYY-MM-DD）
   - 在提交前进行格式验证

2. **带"其他"选项的单选字段**：
   - 当 `other_option` 为 `true` 时，在单选选项的末尾添加一个"其他"选项
   - 当用户选择"其他"选项时，显示一个文本输入框
   - 提交时根据用户的选择，使用适当的格式：
     - 预设选项：直接提交选项值
     - 自定义选项：提交包含 `other: true` 和 `value: "自定义内容"` 的对象 