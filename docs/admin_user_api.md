# 用户管理 API 文档

本文档介绍与用户管理相关的 API 接口。这些接口大部分需要管理员权限才能访问。

## 认证方式

所有接口都需要在请求头中包含认证信息：

```
Authorization: Bearer <your_token>
```

管理员接口特别需要确保使用管理员账号的令牌。

## 用户注册变更

用户注册时邮箱已变为非必填字段。

### 用户注册

**请求方法**: POST

**URL**: `/auth/register`

**请求体**: 
```json
{
  "username": "user123",
  "password": "password123",
  "email": "user@example.com"  // 可选字段
}
```

**响应**:
```json
{
  "id": 10,
  "username": "user123", 
  "role": "user"
}
```

## 管理员接口

### 获取用户列表

获取系统中的所有用户（分页）。

**请求方法**: GET

**URL**: `/user/admin/users`

**查询参数**:
- `page`: 页码，从1开始，默认为1
- `per_page`: 每页记录数，默认为20
- `role`: 筛选角色，可选值：user, admin

**响应**:
```json
{
  "total": 45,
  "page": 1,
  "per_page": 20,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com", 
      "role": "admin",
      "status": "active",
      "created_at": "2023-01-01T10:00:00"
    },
    {
      "id": 2,
      "username": "user123",
      "email": "user123@example.com",
      "role": "user",
      "status": "active",
      "created_at": "2023-01-02T14:30:00"
    }
    // ... 更多用户
  ]
}
```

### 重置用户密码

重置指定用户的密码为随机生成的密码。

**请求方法**: POST

**URL**: `/user/admin/users/{user_id}/reset-password`

**路径参数**:
- `user_id`: 用户ID

**响应**:
```json
{
  "user_id": 5,
  "new_password": "aB3$xYz7@9Kl"
}
```

**注意**: 生成的随机密码仅会在响应中返回一次，请务必记录保存。

### 批量生成随机账号

批量生成指定数量的随机用户账号。

**请求方法**: POST

**URL**: `/user/admin/users/batch-generate`

**查询参数**:
- `count`: 生成账号的数量，范围1-1000
- `prefix`: 用户名前缀（可选）

**响应**:
```json
{
  "count": 10,
  "users": [
    {
      "id": 11,
      "username": "12345678",
      "password": "a1B2c3D4",
      "created_at": "2023-03-10 15:30:22"
    },
    // ... 更多账号
  ],
  "excel_file": "uploads/generated_accounts/generated_accounts_20230310153022.xlsx"
}
```

### 下载生成的账号 Excel 文件

下载之前批量生成的账号 Excel 文件。

**请求方法**: GET

**URL**: `/user/admin/users/download-accounts/{filename}`

**路径参数**:
- `filename`: 文件名，从批量生成接口返回的 `excel_file` 路径中获取

**响应**: Excel 文件 (MIME 类型: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

## 使用示例

### 使用 curl 获取用户列表

```bash
curl -X GET "http://47.245.102.255:9988/user/admin/users?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 使用 curl 重置用户密码

```bash
curl -X POST "http://47.245.102.255:9988/user/admin/users/5/reset-password" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 使用 JavaScript 批量生成账号并下载

```javascript
// 批量生成账号
async function generateAccounts() {
  const response = await fetch('/user/admin/users/batch-generate?count=10&prefix=test_', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_ADMIN_TOKEN',
      'Content-Type': 'application/json'
    }
  });
  
  const result = await response.json();
  console.log('生成的账号:', result.users);
  
  // 提取文件名并下载
  const filePath = result.excel_file;
  const fileName = filePath.split('/').pop();
  
  window.location.href = `/user/admin/users/download-accounts/${fileName}`;
}
``` 