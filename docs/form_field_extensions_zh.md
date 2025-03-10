# 表单字段扩展功能文档

本文档详细说明了表单系统的扩展功能：**单选多选切换**、**允许选中'其他'并填写理由**、**允许用户添加自定义选项**和**日期类型字段**。

## 目录
- [表单字段扩展功能文档](#表单字段扩展功能文档)
  - [目录](#目录)
  - [单选/多选切换功能](#单选多选切换功能)
    - [创建支持多选的单选字段（管理接口）](#创建支持多选的单选字段管理接口)
    - [更新单选/多选设置（管理接口）](#更新单选多选设置管理接口)
    - [提交多选数据（enhanced-data接口）](#提交多选数据enhanced-data接口)
    - [获取多选数据（enhanced-data接口）](#获取多选数据enhanced-data接口)
  - [自定义选项功能](#自定义选项功能)
    - ['其他'选项填写理由功能](#其他选项填写理由功能)
    - [允许用户添加自定义选项功能](#允许用户添加自定义选项功能)
  - [日期类型字段](#日期类型字段)
    - [创建日期类型字段（管理接口）](#创建日期类型字段管理接口)
    - [更新日期类型字段（管理接口）](#更新日期类型字段管理接口)
    - [提交日期类型字段数据（enhanced-data接口）](#提交日期类型字段数据enhanced-data接口)
    - [获取日期类型字段数据（enhanced-data接口）](#获取日期类型字段数据enhanced-data接口)
    - [日期格式验证](#日期格式验证)
  - [与活动表单管理的集成](#与活动表单管理的集成)
    - [获取活动所有字段（管理接口）](#获取活动所有字段管理接口)
    - [获取活动所有表单数据（管理接口）](#获取活动所有表单数据管理接口)
  - [数据库结构变更](#数据库结构变更)
  - [前端实现建议](#前端实现建议)
    - [单选/多选字段实现](#单选多选字段实现)
    - [日期字段实现](#日期字段实现)
    - [表单管理界面的更新](#表单管理界面的更新)

## 单选/多选切换功能

单选字段现在支持多选模式，通过设置`allow_multiple`属性为`true`来启用。在多选模式下，用户可以选择多个选项，字段值将保存为数组。

### 创建支持多选的单选字段（管理接口）

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
    "field_name": "interests",
    "field_label": "兴趣爱好",
    "field_type": "radio",
    "is_required": true,
    "allow_multiple": true,
    "options": [
        {"value": "sports", "label": "体育运动"},
        {"value": "music", "label": "音乐"},
        {"value": "reading", "label": "阅读"},
        {"value": "travel", "label": "旅行"},
        {"value": "cooking", "label": "烹饪"}
    ]
}
```

**成功响应 (200 OK)**
```json
{
    "id": 10
}
```

### 更新单选/多选设置（管理接口）

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
    "allow_multiple": true
}
```

**成功响应 (200 OK)**
```json
{
    "success": true
}
```

### 提交多选数据（enhanced-data接口）

在多选模式下，表单字段的值应该是一个数组，包含所有选中的选项值。

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
    "form_items": [
        {
            "field_id": 10,
            "field_type": "radio",
            "field_value": ["sports", "music", "travel"]
        }
    ]
}
```

**成功响应 (200 OK)**
```json
{
    "success": true,
    "message": "表单数据保存成功",
    "saved_items": [
        {
            "field_id": 10,
            "type": "radio",
            "value": ["sports", "music", "travel"]
        }
    ]
}
```

### 获取多选数据（enhanced-data接口）

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
        "id": 5,
        "competition_id": 1,
        "competition_name": "创新设计大赛",
        "status": "pending",
        "created_at": "2023-10-15T10:00:00"
    },
    "form_data": [
        {
            "field_id": 10,
            "field_name": "interests",
            "field_label": "兴趣爱好",
            "type": "radio",
            "content": ["sports", "music", "travel"],
            "options": [
                {"value": "sports", "label": "体育运动"},
                {"value": "music", "label": "音乐"},
                {"value": "reading", "label": "阅读"},
                {"value": "travel", "label": "旅行"},
                {"value": "cooking", "label": "烹饪"}
            ],
            "allow_multiple": true
        }
    ]
}
```

## 自定义选项功能

### '其他'选项填写理由功能

单选字段可以通过设置`other_option`属性为`true`来启用'其他'选项，允许用户选择'其他'并填写自定义理由。

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
    "other_option": true,
    "options": [
        {"value": "high_school", "label": "高中"},
        {"value": "bachelor", "label": "本科"},
        {"value": "master", "label": "硕士"},
        {"value": "doctor", "label": "博士"}
    ]
}
```

**成功响应 (200 OK)**
```json
{
    "id": 11
}
```

当用户选择'其他'选项时，提交的数据格式如下：

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

**请求体：**
```json
{
    "form_items": [
        {
            "field_id": 11,
            "field_type": "radio",
            "field_value": {
                "value": "other",
                "custom_text": "专科"
            }
        }
    ]
}
```

### 允许用户添加自定义选项功能

单选字段可以通过设置`allow_custom_options`属性为`true`来启用自定义选项，允许用户添加系统中不存在的选项。

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
    "field_name": "profession",
    "field_label": "职业",
    "field_type": "radio",
    "is_required": true,
    "allow_custom_options": true,
    "options": [
        {"value": "engineer", "label": "工程师"},
        {"value": "doctor", "label": "医生"},
        {"value": "teacher", "label": "教师"},
        {"value": "designer", "label": "设计师"}
    ]
}
```

**成功响应 (200 OK)**
```json
{
    "id": 12
}
```

当用户添加自定义选项时，提交的数据格式如下：

```http
POST /forms/registrations/{registration_id}/enhanced-data
```

**请求体：**
```json
{
    "form_items": [
        {
            "field_id": 12,
            "field_type": "radio",
            "field_value": "programmer"
        }
    ]
}
```

当同时启用多选和自定义选项时，用户可以提交包含系统选项和自定义选项的数组：

```json
{
    "form_items": [
        {
            "field_id": 12,
            "field_type": "radio",
            "field_value": ["engineer", "programmer", "system_architect"]
        }
    ]
}
```

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
    "id": 13
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
    "is_required": false
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
    "form_items": [
        {
            "field_id": 13,
            "field_type": "date",
            "field_value": "2000-01-01"
        }
    ]
}
```

**成功响应 (200 OK)**
```json
{
    "success": true,
    "message": "表单数据保存成功",
    "saved_items": [
        {
            "field_id": 13,
            "type": "date",
            "value": "2000-01-01"
        }
    ]
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
        "id": 5,
        "competition_id": 1,
        "competition_name": "创新设计大赛",
        "status": "pending",
        "created_at": "2023-10-15T10:00:00"
    },
    "form_data": [
        {
            "field_id": 13,
            "field_name": "birth_date",
            "field_label": "出生日期",
            "type": "date",
            "content": "2000-01-01"
        }
    ]
}
```

### 日期格式验证

系统会验证日期格式是否符合YYYY-MM-DD格式，并验证日期是否有效。无效的日期会导致提交失败。

## 与活动表单管理的集成

### 获取活动所有字段（管理接口）

获取活动所有表单字段的接口将包含新的字段属性：`allow_multiple`、`allow_custom_options`和`other_option`。

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
        "id": 10,
        "competition_id": 1,
        "field_name": "interests",
        "field_label": "兴趣爱好",
        "field_type": "radio",
        "is_required": true,
        "options": [
            {"value": "sports", "label": "体育运动"},
            {"value": "music", "label": "音乐"},
            {"value": "reading", "label": "阅读"},
            {"value": "travel", "label": "旅行"},
            {"value": "cooking", "label": "烹饪"}
        ],
        "allow_multiple": true,
        "allow_custom_options": false,
        "other_option": false
    },
    {
        "id": 11,
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
        "allow_multiple": false,
        "allow_custom_options": false,
        "other_option": true
    },
    {
        "id": 13,
        "competition_id": 1,
        "field_name": "birth_date",
        "field_label": "出生日期",
        "field_type": "date",
        "is_required": true
    }
]
```

### 获取活动所有表单数据（管理接口）

获取活动表单数据的接口将正确处理多选字段和自定义选项的值。

```http
GET /forms/admin/competitions/{competition_id}/users/{user_id}/data
```

## 数据库结构变更

本次更新添加了以下数据库列：

**competition_form_fields表**
- `allow_multiple` - 布尔值，表示单选字段是否支持多选模式
- `allow_custom_options` - 布尔值，表示是否允许用户添加自定义选项

## 前端实现建议

### 单选/多选字段实现

当字段设置了`allow_multiple = true`时，前端应显示为多选框（checkbox）而非单选框（radio button）。

```jsx
// 单选/多选字段的渲染示例
const RadioField = ({ field, value, onChange }) => {
  if (field.allow_multiple) {
    // 多选模式
    return (
      <div className="form-group">
        <label>{field.field_label}{field.is_required && <span className="required">*</span>}</label>
        {field.options.map(option => (
          <div className="form-check" key={option.value}>
            <input
              type="checkbox"
              className="form-check-input"
              id={`${field.field_name}_${option.value}`}
              checked={value && value.includes(option.value)}
              onChange={(e) => {
                const newValue = [...(value || [])];
                if (e.target.checked) {
                  newValue.push(option.value);
                } else {
                  const index = newValue.indexOf(option.value);
                  if (index !== -1) newValue.splice(index, 1);
                }
                onChange(newValue);
              }}
            />
            <label className="form-check-label" htmlFor={`${field.field_name}_${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
        
        {/* 自定义选项输入 */}
        {field.allow_custom_options && (
          <div className="mt-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                const customOption = prompt("请输入自定义选项:");
                if (customOption && customOption.trim()) {
                  onChange([...(value || []), customOption.trim()]);
                }
              }}
            >
              + 添加自定义选项
            </button>
          </div>
        )}
      </div>
    );
  } else {
    // 单选模式
    return (
      <div className="form-group">
        <label>{field.field_label}{field.is_required && <span className="required">*</span>}</label>
        {field.options.map(option => (
          <div className="form-check" key={option.value}>
            <input
              type="radio"
              className="form-check-input"
              name={field.field_name}
              id={`${field.field_name}_${option.value}`}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
            />
            <label className="form-check-label" htmlFor={`${field.field_name}_${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
        
        {/* "其他"选项 */}
        {field.other_option && (
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              name={field.field_name}
              id={`${field.field_name}_other`}
              value="other"
              checked={typeof value === 'object' && value.value === 'other'}
              onChange={() => onChange({value: 'other', custom_text: ''})}
            />
            <label className="form-check-label" htmlFor={`${field.field_name}_other`}>
              其他
            </label>
            {typeof value === 'object' && value.value === 'other' && (
              <input
                type="text"
                className="form-control mt-1"
                placeholder="请说明"
                value={value.custom_text || ''}
                onChange={(e) => onChange({value: 'other', custom_text: e.target.value})}
              />
            )}
          </div>
        )}
        
        {/* 自定义选项 */}
        {field.allow_custom_options && (
          <div className="mt-2">
            <button 
              type="button" 
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                const customOption = prompt("请输入自定义选项:");
                if (customOption && customOption.trim()) {
                  onChange(customOption.trim());
                }
              }}
            >
              + 添加自定义选项
            </button>
          </div>
        )}
      </div>
    );
  }
};
```

### 日期字段实现

日期字段应使用日期选择器组件，确保用户输入的是有效日期。

```jsx
// 日期字段的渲染示例
const DateField = ({ field, value, onChange }) => {
  return (
    <div className="form-group">
      <label>{field.field_label}{field.is_required && <span className="required">*</span>}</label>
      <input
        type="date"
        className="form-control"
        id={field.field_name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};
```

### 表单管理界面的更新

表单管理界面需要添加以下选项：
1. 单选字段是否允许多选的开关
2. 是否允许选择"其他"并填写理由的开关
3. 是否允许添加自定义选项的开关

```jsx
// 表单字段编辑界面示例
const FormFieldEditor = ({ field, onSave }) => {
  const [fieldData, setFieldData] = useState({
    field_name: field?.field_name || '',
    field_label: field?.field_label || '',
    field_type: field?.field_type || 'text',
    is_required: field?.is_required !== false,
    options: field?.options || [],
    other_option: field?.other_option || false,
    allow_multiple: field?.allow_multiple || false,
    allow_custom_options: field?.allow_custom_options || false
  });
  
  // ...字段名称、标签等基础信息编辑代码...
  
  // 单选字段特有的设置
  const renderRadioOptions = () => {
    if (fieldData.field_type !== 'radio') return null;
    
    return (
      <div className="card mt-3">
        <div className="card-header">单选字段设置</div>
        <div className="card-body">
          {/* 选项列表编辑 */}
          {/* ... */}
          
          {/* 功能开关 */}
          <div className="form-check mt-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="allow_multiple"
              checked={fieldData.allow_multiple}
              onChange={(e) => setFieldData({...fieldData, allow_multiple: e.target.checked})}
            />
            <label className="form-check-label" htmlFor="allow_multiple">
              允许多选（将单选框转为多选框）
            </label>
          </div>
          
          <div className="form-check mt-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="other_option"
              checked={fieldData.other_option}
              onChange={(e) => setFieldData({...fieldData, other_option: e.target.checked})}
            />
            <label className="form-check-label" htmlFor="other_option">
              允许选择"其他"并填写理由
            </label>
          </div>
          
          <div className="form-check mt-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="allow_custom_options"
              checked={fieldData.allow_custom_options}
              onChange={(e) => setFieldData({...fieldData, allow_custom_options: e.target.checked})}
            />
            <label className="form-check-label" htmlFor="allow_custom_options">
              允许用户添加自定义选项
            </label>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* 基本字段信息 */}
      <div className="form-group">
        <label>字段名称</label>
        <input
          type="text"
          className="form-control"
          value={fieldData.field_name}
          onChange={(e) => setFieldData({...fieldData, field_name: e.target.value})}
          required
        />
      </div>
      
      {/* ... 其他基本字段 ... */}
      
      {/* 单选字段特有设置 */}
      {renderRadioOptions()}
      
      <button type="submit" className="btn btn-primary mt-3">保存字段</button>
    </form>
  );
}; 