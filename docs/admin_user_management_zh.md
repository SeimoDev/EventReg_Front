# 管理员用户管理 API 文档

本文档详细说明了管理员用户管理相关的API接口，包括获取用户列表、查看用户详情、更新用户信息、删除用户和重置用户密码等功能。

## 目录
- [管理员用户管理 API 文档](#管理员用户管理-api-文档)
  - [目录](#目录)
  - [通用说明](#通用说明)
  - [获取用户列表](#获取用户列表)
  - [获取用户详情](#获取用户详情)
  - [更新用户信息](#更新用户信息)
  - [删除用户](#删除用户)
  - [重置用户密码](#重置用户密码)
  - [批量生成用户](#批量生成用户)
  - [下载生成的用户账号](#下载生成的用户账号)
  - [错误处理](#错误处理)

## 通用说明

所有管理员API都需要管理员权限才能访问。请在请求头中包含有效的管理员身份验证令牌：

```
Authorization: Bearer <admin_token>
```

## 获取用户列表

获取系统中所有用户的列表，支持分页和角色筛选。

```http
GET /user/admin/users?page=1&per_page=20&role=user
```

**查询参数：**
- `page`：页码，从1开始，默认为1
- `per_page`：每页记录数，默认为20
- `role`：筛选角色，可选值：user, admin，不传则获取所有用户

**成功响应 (200 OK)**
```json
{
    "total": 100,
    "page": 1,
    "per_page": 20,
    "users": [
        {
            "id": 1,
            "username": "admin",
            "email": "admin@example.com",
            "role": "admin",
            "status": "active",
            "created_at": "2023-01-01T00:00:00"
        },
        {
            "id": 2,
            "username": "user1",
            "email": "user1@example.com",
            "role": "user",
            "status": "active",
            "created_at": "2023-01-02T00:00:00"
        }
        // ...更多用户
    ]
}
```

## 获取用户详情

获取特定用户的详细信息。

```http
GET /user/admin/users/{user_id}
```

**路径参数：**
- `user_id`：用户ID

**成功响应 (200 OK)**
```json
{
    "id": 2,
    "username": "user1",
    "email": "user1@example.com",
    "role": "user",
    "status": "active",
    "created_at": "2023-01-02T00:00:00"
}
```

## 更新用户信息

管理员可以更新用户的基本信息、状态和角色。

```http
PUT /user/admin/users/{user_id}
```

**路径参数：**
- `user_id`：要更新的用户ID

**请求头：**
```
Content-Type: application/json
Authorization: Bearer <admin_token>
```

**请求体：**
```json
{
    "username": "new_username",
    "email": "new_email@example.com",
    "password": "new_password",
    "status": "active",
    "role": "user"
}
```

**请求字段说明：**
- `username`：新用户名（可选）
- `email`：新邮箱（可选）
- `password`：新密码（可选，至少6个字符）
- `status`：用户状态（可选），可选值：
  - `active`：活跃（可登录）
  - `inactive`：停用（不可登录）
  - `deleted`：已删除（不可登录）
- `role`：用户角色（可选），可选值：
  - `user`：普通用户
  - `admin`：管理员

**成功响应 (200 OK)**
```json
{
    "message": "用户信息更新成功"
}
```

**注意事项：**
1. 所有字段都是可选的，只会更新提供的字段
2. 管理员不能修改自己的角色
3. 用户名和邮箱必须是唯一的

## 删除用户

删除指定的用户账号。对于已有报名记录的用户，将标记为"已删除"状态；否则会从数据库中完全删除记录。

```http
DELETE /user/admin/users/{user_id}
```

**路径参数：**
- `user_id`：要删除的用户ID

**成功响应 (200 OK)**
```json
{
    "message": "用户删除成功"
}
```

**注意事项：**
1. 管理员不能删除自己的账号
2. 不能删除其他管理员账号
3. 对于已有报名记录的用户，只会将状态设置为"deleted"，不会真正删除数据库记录
4. 对于没有关联数据的用户，会从数据库中完全删除记录

## 重置用户密码

将用户密码重置为随机生成的密码。

```http
POST /user/admin/users/{user_id}/reset-password
```

**路径参数：**
- `user_id`：要重置密码的用户ID

**成功响应 (200 OK)**
```json
{
    "user_id": 2,
    "new_password": "a1B2c3D4e5F6!"
}
```

**注意事项：**
1. 随机生成的密码仅在API响应中返回一次，应立即记录
2. 新密码包含大小写字母、数字和特殊字符，长度为12个字符

## 批量生成用户

批量生成指定数量的随机用户账号。

```http
POST /user/admin/users/batch-generate?count=10&prefix=test_
```

**查询参数：**
- `count`：要生成的用户数量，范围1-1000
- `prefix`：用户名前缀（可选）

**成功响应 (200 OK)**
```json
{
    "count": 10,
    "users": [
        {
            "id": 10,
            "username": "test_12345678",
            "password": "a1b2c3d4",
            "created_at": "2023-05-01 10:00:00"
        },
        // ...更多用户
    ],
    "excel_file": "generated_accounts_20230501100000.xlsx"
}
```

## 下载生成的用户账号

下载批量生成的用户账号Excel文件。

```http
GET /user/admin/users/download-accounts/{filename}
```

**路径参数：**
- `filename`：文件名（从批量生成用户的响应中获取）

**响应：**
- 成功时直接返回Excel文件
- 文件不存在时返回404错误

## 错误处理

所有API可能返回以下错误：

- `400 Bad Request`：请求参数错误
- `401 Unauthorized`：未提供有效的身份验证令牌
- `403 Forbidden`：权限不足（非管理员用户）
- `404 Not Found`：请求的资源不存在
- `409 Conflict`：资源冲突（如用户名或邮箱已存在）
- `500 Internal Server Error`：服务器内部错误

错误响应格式：
```json
{
    "detail": "错误信息描述"
}
``` 