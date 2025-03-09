# 活动数据导出 API 文档

## 概述

导出API提供了一种方式，让管理员能够下载活动数据的备份和汇总。目前支持的功能包括导出活动提交的所有附件。

## 认证机制

导出API使用了宽松的管理员认证机制，允许使用过期的JWT令牌进行认证。这样即使令牌过期，只要令牌中包含有效的管理员用户信息，仍然可以访问导出API。

### 过期令牌使用限制

为了系统安全，过期令牌的使用有以下限制：
1. 每个用户最多可以使用过期令牌50次
2. 过期令牌的最大宽限期为24小时
3. 登录或刷新令牌后，用户的过期令牌使用记录将被重置

**强烈建议**：尽管系统允许使用过期令牌，但仍建议定期刷新令牌以确保安全性。

如果您的令牌已过期，有两种解决方案：
1. 使用 `/auth/refresh-token` 接口刷新令牌
2. 直接使用过期的令牌调用导出API（受上述限制）

### 刷新令牌

```http
POST /auth/refresh-token
```

**描述**：  
使用过期或有效的令牌，获取新的JWT令牌。

**请求头**：
```
Authorization: Bearer <token>
```

**成功响应**：
- **状态码**：200 OK
- **响应内容**：
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

**错误响应**：
- **状态码**：401 Unauthorized
- **响应内容**：
```json
{
  "detail": "无效的令牌"
}
```

## 接口说明

### 导出活动附件

```http
GET /export/competition/{competition_id}/files
```

**描述**：  
导出指定活动的所有附件，并按照 `/{活动名}/{团队名}/{表单字段标题}.原格式` 的目录结构打包为ZIP文件下载。

**权限要求**：  
- 仅限管理员访问
- 需要有效的管理员令牌

**路径参数**：
- `competition_id`：活动ID（整数）

**请求头**：
```
Authorization: Bearer <admin_token>
```

**成功响应**：
- **状态码**：200 OK
- **内容类型**：application/zip
- **响应体**：ZIP文件，包含所有活动附件

**错误响应**：

1. 活动不存在
```json
{
  "detail": "活动不存在"
}
```
状态码：404 Not Found

2. 活动没有报名记录
```json
{
  "detail": "该活动没有报名记录"
}
```
状态码：404 Not Found

3. 服务器错误
```json
{
  "detail": "导出活动附件失败: [错误详情]"
}
```
状态码：500 Internal Server Error

4. 未授权
```json
{
  "detail": "Not authenticated"
}
```
状态码：401 Unauthorized

5. 无权访问
```json
{
  "detail": "您没有权限访问此资源"
}
```
状态码：403 Forbidden

### 导出活动文字信息

```http
GET /export/competition/{competition_id}/text-data
```

**描述**：  
导出指定活动的所有报名项目的文字信息，不包含文件和图片路径。生成一个Excel文件，其中包含所有参赛团队的基本信息和表单填写的文字内容。

**权限要求**：  
- 仅限管理员访问
- 需要有效的管理员令牌

**路径参数**：
- `competition_id`：活动ID（整数）

**请求头**：
```
Authorization: Bearer <admin_token>
```

**成功响应**：
- **状态码**：200 OK
- **内容类型**：application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- **响应体**：Excel文件，包含所有活动报名的文字信息

**错误响应**：

1. 活动不存在
```json
{
  "detail": "活动不存在"
}
```
状态码：404 Not Found

2. 活动没有报名记录
```json
{
  "detail": "该活动没有报名记录"
}
```
状态码：404 Not Found

3. 服务器错误
```json
{
  "detail": "导出活动文字信息失败: [错误详情]"
}
```
状态码：500 Internal Server Error

4. 未授权
```json
{
  "detail": "Not authenticated"
}
```
状态码：401 Unauthorized

5. 无权访问
```json
{
  "detail": "您没有权限访问此资源"
}
```
状态码：403 Forbidden

## 目录结构说明

导出的ZIP文件包含以下目录结构：

```
/{活动名称}/
  /{团队1名称}/
    /{表单字段1标题}.{原始扩展名}
    /{表单字段2标题}.{原始扩展名}
    ...
  /{团队2名称}/
    /{表单字段1标题}.{原始扩展名}
    ...
  ...
```

## 示例

### 请求示例

```bash
curl -X GET "http://47.245.102.255:8000/export/competition/5/files" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     -o "活动附件.zip"
```

### JavaScript示例

```javascript
async function exportCompetitionFiles(competitionId) {
  try {
    const response = await fetch(
      `/export/competition/${competitionId}/files`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '导出失败');
    }
    
    // 处理文件下载
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `活动${competitionId}附件.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
  } catch (error) {
    console.error('导出活动附件失败:', error);
    alert(`导出失败: ${error.message}`);
  }
}
```

## 注意事项

1. 导出过程可能需要较长时间，特别是当活动有大量附件时
2. 导出的ZIP文件中只包含存在于文件系统中的文件，如果原始文件已被删除，将不会包含在ZIP文件中
3. 文件名中的特殊字符将被替换为下划线，以确保文件名的有效性
4. 为避免文件名过长，将限制文件名长度为100个字符 