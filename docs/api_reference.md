# API 参考文档

## 基本信息

- 基础URL: `http://47.245.102.255:8000`
- 所有POST请求的Content-Type应为: `application/json`
- 认证方式: Bearer Token (在请求头中添加 `Authorization: Bearer <token>`)

## 认证接口

### 用户注册
```http
POST /auth/register
```

请求体：
```json
{
    "username": "string",
    "password": "string",
    "email": "string"
}
```

响应：
```json
{
    "id": "integer",
    "username": "string",
    "role": "string"
}
```

### 用户登录

**请求方法**: POST

**URL**: `/auth/login`

**Content-Type**: `application/json`

**请求体**:
```json
{
    "username": "string",
    "password": "string"
}
```

**响应**:
```json
{
    "access_token": "string",
    "token_type": "bearer",
    "user": {
        "id": "integer",
        "username": "string",
        "role": "string"
    }
}
```

**错误响应**:
```json
{
    "detail": "用户名或密码错误"
}
```

**状态码**:
- 200: 登录成功
- 401: 用户名或密码错误
- 422: 请求数据格式错误

## 活动接口

### 创建活动（管理员）
```http
POST /competitions
```

请求体：
```json
{
    "title": "string",
    "description": "string",
    "start_time": "datetime",
    "end_time": "datetime",
    "max_participants": "integer",
    "status": "string"
}
```

响应：
```json
{
    "id": "integer"
}
```

### 获取活动列表
```http
GET /competitions?page=1&per_page=10&status=published&search=keyword
```

响应：
```json
{
    "total": "integer",
    "page": "integer",
    "per_page": "integer",
    "competitions": [
        {
            "id": "integer",
            "title": "string",
            "description": "string",
            "start_time": "datetime",
            "end_time": "datetime",
            "status": "string"
        }
    ]
}
```

### 获取活动详情
```http
GET /competitions/{competition_id}
```

响应：
```json
{
    "id": "integer",
    "title": "string",
    "description": "string",
    "start_time": "datetime",
    "end_time": "datetime",
    "max_participants": "integer",
    "current_participants": "integer",
    "status": "string"
}
```

### 更新活动（管理员）
```http
PUT /competitions/{competition_id}
```

请求体：
```json
{
    "title": "string",
    "description": "string",
    "status": "string"
}
```

### 删除活动（管理员）
```http
DELETE /competitions/{competition_id}
```

### 报名活动
```http
POST /competitions/{competition_id}/register
```

请求体：
```json
{
    "team_name": "string",
    "contact_phone": "string"
}
```

响应：
```json
{
    "id": "integer"
}
```

### 获取报名列表（管理员）
```http
GET /competitions/{competition_id}/registrations?status=pending&page=1&per_page=10
```

响应：
```json
{
    "total": "integer",
    "page": "integer",
    "per_page": "integer",
    "registrations": [
        {
            "id": "integer",
            "user_id": "integer",
            "username": "string",
            "team_name": "string",
            "status": "string",
            "created_at": "datetime"
        }
    ]
}
```

### 获取活动参与者列表
```http
GET /competitions/{competition_id}/participants
```

**参数**:
- `status`: 报名状态（可选，非管理员只能查看已通过的）
- `search`: 搜索关键词（可选，支持团队名、用户名和邮箱搜索）
- `page`: 页码（默认1）
- `per_page`: 每页数量（默认10，最大100）

**响应**:
```json
{
    "total": "integer",
    "page": "integer",
    "per_page": "integer",
    "participants": [
        {
            "id": "integer",
            "team_name": "string",
            "contact_phone": "string",
            "status": "string",
            "created_at": "datetime",
            "username": "string",
            "email": "string"
        }
    ]
}
```

### 获取报名选手详细信息
```http
GET /competitions/registrations/{registration_id}
```

**响应**:
```json
{
    "id": "integer",
    "user_id": "integer",
    "competition_id": "integer",
    "team_name": "string",
    "contact_phone": "string",
    "status": "string",
    "created_at": "datetime",
    "updated_at": "datetime",
    "username": "string",
    "email": "string",
    "competition_title": "string",
    "competition_status": "string"
}
```

**权限说明**:
- 管理员可以查看所有信息
- 普通用户只能查看已通过审核的报名信息
- 报名者本人可以查看自己的报名信息

**状态码**:
- 200: 请求成功
- 403: 无权限访问
- 404: 信息不存在

### 获取报名状态
```http
GET /competitions/{competition_id}/registration/status
```

**响应**:
```json
{
    "status": "string",  // not_registered, pending, approved, rejected
    "message": "string",
    "registration": {
        "id": "integer",
        "user_id": "integer",
        "competition_id": "integer",
        "team_name": "string",
        "contact_phone": "string",
        "status": "string",
        "created_at": "datetime",
        "updated_at": "datetime"
    }
}
```

**状态说明**:
- `not_registered`: 未报名
- `pending`: 审核中
- `approved`: 已通过
- `rejected`: 已拒绝

**状态码**:
- 200: 请求成功
- 404: 活动不存在
- 401: 未登录

### 更新报名状态（管理员）
```http
PUT /competitions/registrations/{registration_id}/status
```

**请求体**:
```json
{
    "status": "string"  // pending, approved, rejected
}
```

**响应**:
```json
{
    "message": "状态更新成功",
    "status": "string"
}
```

**状态说明**:
- `pending`: 审核中
- `approved`: 已通过
- `rejected`: 已拒绝

**状态码**:
- 200: 更新成功
- 400: 无效的状态值
- 401: 未登录
- 403: 无权限（非管理员）
- 404: 报名信息不存在
- 500: 更新失败

## 表单接口

### 创建表单字段（管理员）
```http
POST /forms/fields
```

请求体：
```json
{
    "competition_id": "integer",
    "field_name": "string",
    "field_label": "string",
    "field_type": "string",
    "is_required": "boolean"
}
```

响应：
```json
{
    "id": "integer"
}
```

### 更新表单字段（管理员）
```http
PUT /forms/fields/{field_id}
```

请求体：
```json
{
    "field_label": "string",
    "is_required": "boolean"
}
```

### 删除表单字段（管理员）
```http
DELETE /forms/fields/{field_id}
```

### 获取活动表单字段
```http
GET /forms/competitions/{competition_id}/fields
```

响应：
```json
[
    {
        "id": "integer",
        "field_name": "string",
        "field_label": "string",
        "field_type": "string",
        "is_required": "boolean"
    }
]
```

### 保存表单数据
- **POST** `/forms/registrations/{registration_id}/data`
- [详细文档](form_api.md#保存表单数据)

### 获取表单数据
- **GET** `/forms/registrations/{registration_id}/data`
- [详细文档](form_api.md#获取表单数据)

### 获取增强型表单数据
- **GET** `/forms/registrations/{registration_id}/enhanced-data`
- [详细文档](enhanced_form_api.md#获取增强型表单数据)
- 返回包含用户ID、表单项ID、类型和内容的完整表单数据

### 增强型表单数据提交
- **POST** `/forms/registrations/{registration_id}/enhanced-data`
- [详细文档](enhanced_form_api.md#接口规范)
- 使用明确的字段类型定义提交表单数据

### 获取文件
- **GET** `/forms/files/{registration_id}/{field_id}`
- [详细文档](form_api.md#获取文件)

## 文件上传安全说明

1. 文件类型验证：
   - 使用文件魔数（Magic Numbers）验证文件类型
   - 不仅验证扩展名，还验证文件内容
   - 拒绝可执行文件和脚本文件

2. 文件大小限制：
   - 图片文件：最大 5MB
   - 文档文件：最大 10MB
   - 总上传大小：单次请求最大 20MB

3. 文件名安全：
   - 使用 `secure_filename` 处理文件名
   - 移除特殊字符和空格
   - 使用时间戳确保唯一性

4. 存储安全：
   - 文件存储在非 Web 根目录
   - 使用随机生成的文件名
   - 定期清理未使用的文件

5. 访问控制：
   - 基于用户角色的访问控制
   - 文件访问需要认证
   - 记录文件访问日志

## 示例代码

### 上传表单数据和文件
```python
import requests

# 准备表单数据
form_data = {
    "field_1": "文本值",
    "field_2": "文本值"
}

# 准备文件
files = [
    ('files', ('document.pdf', open('document.pdf', 'rb'), 'application/pdf')),
    ('files', ('image.jpg', open('image.jpg', 'rb'), 'image/jpeg'))
]

# 发送请求
response = requests.post(
    'http://47.245.102.255:8000/forms/registrations/1/data',
    data={'form_data': json.dumps(form_data)},
    files=files,
    headers={'Authorization': f'Bearer {token}'}
)

print(response.json())
```

### 获取文件
```python
import requests

# 获取文件
response = requests.get(
    'http://47.245.102.255:8000/forms/files/1/field_1',
    headers={'Authorization': f'Bearer {token}'}
)

# 保存文件
if response.status_code == 200:
    with open('downloaded_file.pdf', 'wb') as f:
        f.write(response.content)
```

## 状态码说明

- 200: 请求成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未认证
- 403: 无权限
- 404: 资源不存在
- 500: 服务器错误

## 错误响应格式

```json
{
    "detail": "错误信息描述"
}
```

## 注意事项

1. 文件上传：
   - 支持的文件类型：pdf, doc, docx, jpg, jpeg, png
   - 图片文件会自动转换为base64格式存储
   - 文件名格式：`field_id_filename`

2. 权限要求：
   - 需要管理员权限的接口已标注"（管理员）"
   - 其他接口需要普通用户登录权限

3. 分页参数：
   - page: 页码，从1开始
   - per_page: 每页数量，默认10，最大100 

## 用户个人中心接口

### 获取用户个人信息
```http
GET /user/profile
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": "integer",
  "username": "string",
  "email": "string",
  "role": "string"
}
```

**字段说明**:
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| id | 整数 | 用户ID |
| username | 字符串 | 用户名 |
| email | 字符串 | 用户邮箱地址 |
| role | 字符串 | 用户角色(admin或user) |

**状态码**:
- 200: 请求成功
- 401: 用户未登录或token无效
- 500: 服务器内部错误

### 更新用户个人信息
```http
PUT /user/profile
```

**请求头**:
```http
Authorization: Bearer <token>
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "string",
  "old_password": "string", // 可选，如需修改密码则必填
  "new_password": "string"  // 可选，如需修改密码则必填
}
```

**字段说明**:
| 字段名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| email | 字符串 | 是 | 用户邮箱 |
| old_password | 字符串 | 否 | 用户原密码，修改密码时必填 |
| new_password | 字符串 | 否 | 用户新密码，修改密码时必填 |

**响应**:
```json
{
  "message": "个人信息更新成功"
}
```

**状态码**:
- 200: 更新成功
- 400: 请求参数错误
- 401: 用户未登录或token无效
- 403: 原密码错误
- 500: 服务器内部错误

### 获取用户报名记录
```http
GET /user/registrations
```

**请求头**:
```http
Authorization: Bearer <token>
```

**响应**:
```json
[
  {
    "id": "integer",
    "competition_id": "integer",
    "competition_title": "string",
    "team_name": "string",
    "status": "string",
    "created_at": "datetime"
  }
]
```

**字段说明**:
| 字段名称 | 类型 | 描述 |
|---------|------|------|
| id | 整数 | 报名记录ID |
| competition_id | 整数 | 活动ID |
| competition_title | 字符串 | 活动标题 |
| team_name | 字符串 | 团队名称 |
| status | 字符串 | 报名状态（pending:待审核, approved:已通过, rejected:已拒绝） |
| created_at | 日期时间 | 报名时间 |

**状态码**:
- 200: 请求成功
- 401: 用户未登录或token无效
- 500: 服务器内部错误

### 删除报名记录
```http
DELETE /competitions/registrations/{registration_id}
```

**路径参数**:
| 参数名称 | 类型 | 是否必填 | 描述 |
|---------|------|---------|------|
| registration_id | 整数 | 是 | 报名记录ID |

**请求头**:
```http
Authorization: Bearer <token>
```

**响应**:
```json
{
  "message": "取消报名成功"
}
```

**状态码**:
- 200: 取消成功
- 401: 用户未登录或token无效
- 403: 无权限操作（非本人报名记录或已审核的报名）
- 404: 报名记录不存在
- 500: 服务器内部错误

**说明**:
1. 只有状态为 `pending`（待审核）的报名记录可以被取消
2. 用户只能取消自己的报名记录 