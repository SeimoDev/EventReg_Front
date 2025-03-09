# 文件上传 API 文档

## 概述

本文档详细说明了事件注册系统中的文件上传相关功能，包括支持的文件类型、大小限制、上传接口和文件访问方式。系统现已支持多种文件类型和多文件上传功能。

## 支持的文件类型

系统支持以下文件类型：

| 类别 | 支持的格式 | 大小限制 |
|------|-----------|---------|
| 图片 | jpg, jpeg, png, gif, webp | 5MB/个 |
| 文档 | pdf, doc, docx, txt, rtf | 10MB/个 |
| 视频 | mp4, avi, mov, wmv, flv, mkv | 100MB/个 |
| 表格 | xls, xlsx, csv | 20MB/个 |
| 幻灯片 | ppt, pptx | 50MB/个 |
| 压缩包 | zip, rar, 7z, tar, gz | 50MB/个 |

**注意**：所有文件总大小限制为 200MB。

## 表单字段类型

系统支持以下与文件相关的表单字段类型：

- `image` - 单图片上传字段
- `multi_image` - 多图片上传字段，允许在一个字段中上传多张图片
- `file` - 单文件上传字段
- `multi_file` - 多文件上传字段，允许在一个字段中上传多个各种类型文件

## 文件上传接口

### 1. 单文件上传

**请求**：
```
POST /forms/upload-file
```

**参数**：
- `file`: 文件对象 (必填)
- `field_type`: 字段类型，可以是 "image" 或 "file" (必填)

**请求头**：
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**响应**：
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "file_path": "uploads/competition_files/images/a1b2c3d4_example.jpg",
    "file_name": "example.jpg",
    "file_size": 102400,
    "file_type": "jpg",
    "file_category": "image",
    "file_url": "/files/by-path?path=uploads/competition_files/images/a1b2c3d4_example.jpg"
  }
}
```

### 2. 多文件上传

**请求**：
```
POST /forms/upload-files
```

**参数**：
- `files`: 文件对象列表 (必填)
- `field_type`: 字段类型，可以是 "image" 或 "file" (必填)

**请求头**：
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**响应**：
```json
{
  "success": true,
  "message": "文件上传完成",
  "data": {
    "files": [
      {
        "file_path": "uploads/competition_files/images/a1b2c3d4_example1.jpg",
        "file_name": "example1.jpg",
        "file_size": 102400,
        "file_type": "jpg",
        "file_category": "image",
        "file_url": "/files/by-path?path=uploads/competition_files/images/a1b2c3d4_example1.jpg"
      },
      {
        "file_path": "uploads/competition_files/documents/e5f6g7h8_document.pdf",
        "file_name": "document.pdf",
        "file_size": 204800,
        "file_type": "pdf",
        "file_category": "document",
        "file_url": "/files/by-path?path=uploads/competition_files/documents/e5f6g7h8_document.pdf"
      }
    ],
    "error_files": [],
    "total_count": 2,
    "success_count": 2,
    "error_count": 0
  }
}
```

## 文件访问

上传的文件可以通过以下方式访问：

### 1. GET 请求访问文件

**请求**：
```
GET /files/by-path?path={file_path}
```

**参数**：
- `path`: 文件路径，从上传响应中获取

**请求头**：
```
Authorization: Bearer {token}
```

**响应**：
文件内容，带有适当的 Content-Type 和 Content-Disposition 头。

### 2. POST 请求访问文件 (兼容旧版)

**请求**：
```
POST /files/by-path
```

**请求体**：
```json
{
  "file_path": "uploads/competition_files/images/a1b2c3d4_example.jpg"
}
```

**请求头**：
```
Content-Type: application/json
Authorization: Bearer {token}
```

**响应**：
文件内容，带有适当的 Content-Type 和 Content-Disposition 头。

## 在表单中使用文件

### 1. 单文件字段

单文件字段可以通过两种方式提交：

1. **预先上传方式**：先调用 `/upload-file` 接口上传文件，然后在表单提交时包含文件路径：

```json
{
  "123": { 
    "file_path": "uploads/competition_files/images/a1b2c3d4_example.jpg"
  }
}
```

2. **直接提交方式**：对于图片，可以直接在表单中提交 Base64 编码的内容：

```json
{
  "123": {
    "filename": "example.jpg",
    "content": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
  }
}
```

### 2. 多文件字段

多文件字段必须提供文件列表：

```json
{
  "456": [
    { 
      "file_path": "uploads/competition_files/images/a1b2c3d4_example1.jpg"
    },
    {
      "file_path": "uploads/competition_files/images/e5f6g7h8_example2.jpg"
    }
  ]
}
```

对于图片，也可以直接提交 Base64 编码：

```json
{
  "456": [
    {
      "filename": "example1.jpg",
      "content": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
    },
    {
      "filename": "example2.jpg", 
      "content": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD..."
    }
  ]
}
```

## 错误处理

文件上传接口可能返回以下错误：

- `400 Bad Request` - 参数错误、文件类型不支持或文件格式错误
- `413 Payload Too Large` - 文件大小超过限制
- `500 Internal Server Error` - 服务器内部错误

## 文件类型与内联显示

- **内联显示**：图片和视频文件会被设置为内联显示 (`Content-Disposition: inline`)
- **下载附件**：其他类型的文件会被设置为附件下载 (`Content-Disposition: attachment`) 