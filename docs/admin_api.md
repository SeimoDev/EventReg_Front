# 管理员API接口文档

这份文档包含了系统中提供给管理员使用的API接口。所有这些接口都需要管理员权限。

## 认证方式

所有管理员API都需要在请求头中包含认证信息：

```
Authorization: Bearer <your_admin_token>
```

如果认证失败，将返回401错误。如果用户不是管理员，将返回403错误。

## 表单管理接口

### 获取用户活动报名数据

此接口允许管理员查询特定用户在特定活动中的所有报名信息，包括固定字段（如用户基本信息、报名状态等）和非固定字段（如自定义表单数据）。

**请求方法**：GET

**URL**：`/forms/admin/competitions/{competition_id}/users/{user_id}/data`

**路径参数**：
- `competition_id`: 活动ID（整数）
- `user_id`: 用户ID（整数）

**认证要求**：需要管理员权限

**响应**：
- 200 OK：请求成功，返回用户的报名数据
- 404 Not Found：活动不存在、用户不存在或用户未报名该活动
- 500 Internal Server Error：服务器内部错误

**响应格式**：

```json
{
  "success": true,
  "message": "获取用户活动报名数据成功",
  "data": {
    "success": true,
    "basic_info": {
      "user": {
        "id": 5,
        "username": "张三",
        "email": "zhangsan@example.com",
        "phone": "13888888888",
        "created_at": "2023-04-15T14:30:22"
      },
      "competition": {
        "id": 10,
        "title": "创新设计大赛",
        "description": "第五届全国大学生创新设计大赛",
        "start_time": "2023-04-01T00:00:00",
        "end_time": "2023-04-30T23:59:59"
      },
      "registration": {
        "id": 25,
        "team_name": "创新先锋队",
        "contact_phone": "13999999999",
        "status": "approved",
        "created_at": "2023-04-15T14:30:22"
      }
    },
    "form_data": [
      {
        "field_id": 1,
        "field_name": "project_name",
        "field_label": "项目名称",
        "field_type": "text",
        "content": "智能家居控制系统"
      },
      {
        "field_id": 2,
        "field_name": "project_desc",
        "field_label": "项目描述",
        "field_type": "text",
        "content": "这是一个智能家居控制系统，可以通过手机APP控制家中的电器设备。"
      },
      {
        "field_id": 3,
        "field_name": "team_photo",
        "field_label": "团队照片",
        "field_type": "image",
        "content": "uploads/competition_files/images/a1b2c3d4e5f6.jpg",
        "original_filename": "team.jpg",
        "file_type": "jpg",
        "file_size": 1024000,
        "url": "/forms/files/25/3"
      },
      {
        "field_id": 4,
        "field_name": "project_proposal",
        "field_label": "项目计划书",
        "field_type": "file",
        "content": "uploads/competition_files/documents/f6e5d4c3b2a1.pdf",
        "original_filename": "proposal.pdf",
        "file_type": "pdf",
        "file_size": 2048000,
        "url": "/forms/files/25/4"
      },
      {
        "field_id": 5,
        "field_name": "project_type",
        "field_label": "项目类型",
        "field_type": "radio",
        "content": "tech",
        "options": [
          {"value": "tech", "label": "科技创新"},
          {"value": "art", "label": "艺术设计"},
          {"value": "social", "label": "社会公益"}
        ],
        "selected_label": "科技创新"
      }
    ]
  }
}
```

**字段说明**：

* `success`: 表示请求是否成功
* `message`: 请求结果的描述信息
* `data`: 包含实际数据的对象
  * `basic_info`: 包含用户、活动和报名的基本信息
    * `user`: 用户基本信息
      * `id`: 用户ID
      * `username`: 用户名
      * `email`: 邮箱
      * `phone`: 电话
      * `created_at`: 用户创建时间
    * `competition`: 活动基本信息
      * `id`: 活动ID
      * `title`: 活动标题
      * `description`: 活动描述
      * `start_time`: 活动开始时间
      * `end_time`: 活动结束时间
    * `registration`: 报名基本信息
      * `id`: 报名ID
      * `team_name`: 项目名称
      * `contact_phone`: 联系电话
      * `status`: 报名状态
      * `created_at`: 报名创建时间
  * `form_data`: 表单数据列表，每项包含：
    * `field_id`: 字段ID
    * `field_name`: 字段名称
    * `field_label`: 字段标签
    * `field_type`: 字段类型，可能的值：`text`、`image`、`file`、`radio`
    * `content`: 字段内容
    * 对于图片和文件类型，还有额外的字段：
      * `original_filename`: 原始文件名
      * `file_type`: 文件类型
      * `file_size`: 文件大小（字节）
      * `url`: 文件URL
    * 对于单选类型，还有额外的字段：
      * `options`: 选项列表，每项包含值和标签
      * `selected_label`: 选中选项的标签

**示例请求**：

```bash
curl -X GET "http://47.245.102.255:9988/forms/admin/competitions/10/users/5/data" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNjE2MjM5MDIyfQ.example_token"
```

**错误响应示例**：

```json
{
  "success": false,
  "message": "用户未报名该活动",
  "status_code": 404
}
```

## 使用场景

此接口主要用于以下场景：

1. 管理员查看特定用户在特定活动中的报名信息
2. 管理员审核用户的报名信息
3. 管理员导出用户的报名信息
4. 管理员分析用户的报名数据 