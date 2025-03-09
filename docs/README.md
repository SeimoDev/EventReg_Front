# 表单上传功能设计改进

## 概述

本次更新重新设计了文件和图片上传的表单功能逻辑。新设计通过要求前端在请求时显式指定每个表单项的类型（文本、图片或文件），进行了以下改进：

1. **明确的类型区分** - 通过显式指定表单项类型，减少了服务器端解析错误
2. **统一的请求结构** - 使用统一的请求结构，简化前端实现
3. **增强的验证功能** - 可以在提交前验证表单项的类型和内容
4. **更灵活的混合内容提交** - 同一请求中可以混合包含文本、图片和文件

## 主要改动

1. 新增接口 `/forms/registrations/{registration_id}/enhanced-data`，使用改进的表单提交逻辑
2. 创建了新的请求模型 `EnhancedFormDataRequest`，包含表单项列表
3. 每个表单项都明确指定了 `field_id`、`field_type` 和 `content`
4. 添加了新的服务方法 `FormService.process_enhanced_form_data()` 处理增强表单数据

## 如何使用

详细的API使用说明请参考 [改进的表单API文档](enhanced_form_api.md)。

### 基本使用示例

```python
import requests
import json
import base64

# 准备表单数据
form_request = {
    "items": [
        {
            "field_id": 1,
            "field_type": "text",
            "content": "这是文本内容"
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

# 准备文件
files = {
    'field_3': ('proposal.pdf', open('proposal.pdf', 'rb'), 'application/pdf'),
    'form_request': (None, json.dumps(form_request), 'application/json')
}

# 发送请求
response = requests.post(
    "http://47.245.102.255:8000/forms/registrations/1/enhanced-data",
    headers={"Authorization": f"Bearer {token}"},
    files=files
)
```

## 向后兼容性

原有的表单提交接口 `/forms/registrations/{registration_id}/data` 仍然可用，但我们建议使用新的增强接口以获得更好的体验和更可靠的处理。

## 数据库实现

为满足"表单提交的数据库实现应该包含用户id，表单项id，类型，内容(文字/图片路径/文件路径)"的需求，我们进行了以下设计：

### 基础表结构

系统使用以下基础表存储表单数据：

1. **活动表单字段表 (competition_form_fields)**
   - 存储字段定义，包括ID、名称、标签和类型

2. **报名表单数据表 (registration_form_data)**
   - 存储提交的表单数据，文本内容存储在field_value，文件存储在file_path
   - 通过registration_id间接关联到用户
   - 通过field_id关联到字段类型

### 数据整合

通过创建数据视图`enhanced_form_data`，我们将这些信息整合起来，包含：
- 用户ID（通过报名记录关联）
- 表单项ID（直接存储）
- 类型（通过字段表关联）
- 内容（根据类型从field_value或file_path获取）

### 新增API

新增了获取增强型表单数据的API：
- **GET** `/forms/registrations/{registration_id}/enhanced-data`

该API返回包含完整信息的表单数据，包括用户信息、表单项信息、类型和内容。

详细的API说明请参考 [增强型表单API文档](enhanced_form_api.md)。 