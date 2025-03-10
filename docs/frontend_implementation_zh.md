# 前端功能同步更新指南

本文档提供了在前端实现表单扩展功能所需的步骤和指导，包括**单选多选切换**、**允许选中"其他"并填写理由**、**允许用户添加自定义选项**和**日期类型字段**等新功能。

## 目录

- [前端功能同步更新指南](#前端功能同步更新指南)
  - [目录](#目录)
  - [更新概述](#更新概述)
  - [后端API变更说明](#后端api变更说明)
  - [前端组件实现](#前端组件实现)
    - [1. 表单字段管理组件](#1-表单字段管理组件)
    - [2. 单选/多选字段组件](#2-单选多选字段组件)
    - [3. 日期字段组件](#3-日期字段组件)
  - [数据提交处理](#数据提交处理)
  - [表单数据展示](#表单数据展示)
  - [测试要点](#测试要点)
  - [附录：API测试用例](#附录api测试用例)
    - [创建多选字段测试](#创建多选字段测试)
    - [创建带"其他"选项的单选字段测试](#创建带其他选项的单选字段测试)
    - [创建日期字段测试](#创建日期字段测试)
    - [提交表单数据测试](#提交表单数据测试)

## 更新概述

本次更新添加了以下新功能：

1. **单选多选切换**：允许将单选字段配置为多选模式
2. **允许选中"其他"并填写理由**：提供选项外的自定义输入
3. **允许用户添加自定义选项**：用户可以动态添加预设选项以外的选项
4. **日期类型字段**：新增日期类型表单字段

## 后端API变更说明

后端API已完成更新，主要变更包括：

1. 表单字段创建和更新接口增加了新的属性：
   - `allow_multiple`：是否允许多选
   - `allow_custom_options`：是否允许用户添加自定义选项
   - 日期类型字段支持：`field_type: "date"`

2. 表单数据提交接口支持新的数据格式：
   - 多选模式下，值为字符串数组
   - 自定义"其他"选项，值为对象格式 `{value: "other", custom_text: "自定义内容"}`
   - 日期字段值为ISO格式的日期字符串 (YYYY-MM-DD)

## 前端组件实现

### 1. 表单字段管理组件

更新管理界面中的表单字段编辑组件，添加新的设置项：

```jsx
// FormFieldEditor.jsx
import React, { useState } from 'react';

export function FormFieldEditor({ field, onSave }) {
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(fieldData);
  };
  
  const renderFieldTypeOptions = () => (
    <div className="form-group">
      <label>字段类型</label>
      <select 
        className="form-control" 
        value={fieldData.field_type}
        onChange={(e) => setFieldData({...fieldData, field_type: e.target.value})}
      >
        <option value="text">文本</option>
        <option value="radio">单选</option>
        <option value="date">日期</option>
        <option value="image">图片</option>
        <option value="file">文件</option>
      </select>
    </div>
  );
  
  const renderRadioOptions = () => {
    if (fieldData.field_type !== 'radio') return null;
    
    return (
      <div className="card mt-3">
        <div className="card-header">单选字段设置</div>
        <div className="card-body">
          <div className="mb-3">
            <label>选项列表</label>
            {fieldData.options.map((option, index) => (
              <div className="input-group mb-2" key={index}>
                <span className="input-group-text">值</span>
                <input
                  type="text"
                  className="form-control"
                  value={option.value}
                  onChange={(e) => {
                    const newOptions = [...fieldData.options];
                    newOptions[index].value = e.target.value;
                    setFieldData({...fieldData, options: newOptions});
                  }}
                />
                <span className="input-group-text">标签</span>
                <input
                  type="text"
                  className="form-control"
                  value={option.label}
                  onChange={(e) => {
                    const newOptions = [...fieldData.options];
                    newOptions[index].label = e.target.value;
                    setFieldData({...fieldData, options: newOptions});
                  }}
                />
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    const newOptions = [...fieldData.options];
                    newOptions.splice(index, 1);
                    setFieldData({...fieldData, options: newOptions});
                  }}
                >
                  删除
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={() => {
                setFieldData({
                  ...fieldData,
                  options: [...fieldData.options, {value: '', label: ''}]
                });
              }}
            >
              添加选项
            </button>
          </div>
          
          {/* 多选开关 */}
          <div className="form-check">
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
          
          {/* "其他"选项开关 */}
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
          
          {/* 自定义选项开关 */}
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
      <div className="form-group">
        <label>字段名称</label>
        <input
          type="text"
          className="form-control"
          value={fieldData.field_name}
          onChange={(e) => setFieldData({...fieldData, field_name: e.target.value})}
          required
        />
        <small className="form-text text-muted">字段名称作为标识符，不宜修改</small>
      </div>
      
      <div className="form-group mt-3">
        <label>字段标签</label>
        <input
          type="text"
          className="form-control"
          value={fieldData.field_label}
          onChange={(e) => setFieldData({...fieldData, field_label: e.target.value})}
          required
        />
        <small className="form-text text-muted">用户界面显示的字段名称</small>
      </div>
      
      {renderFieldTypeOptions()}
      
      <div className="form-check mt-3">
        <input
          type="checkbox"
          className="form-check-input"
          id="is_required"
          checked={fieldData.is_required}
          onChange={(e) => setFieldData({...fieldData, is_required: e.target.checked})}
        />
        <label className="form-check-label" htmlFor="is_required">
          必填字段
        </label>
      </div>
      
      {renderRadioOptions()}
      
      <div className="mt-4">
        <button type="submit" className="btn btn-primary">保存字段</button>
      </div>
    </form>
  );
}
```

### 2. 单选/多选字段组件

创建一个灵活的单选/多选字段组件，根据 `allow_multiple` 属性动态切换显示方式：

```jsx
// RadioField.jsx
import React, { useState } from 'react';

export function RadioField({ field, value, onChange, disabled = false }) {
  // 添加自定义选项的处理
  const [customOption, setCustomOption] = useState('');
  
  // 多选模式
  if (field.allow_multiple) {
    const selectedValues = Array.isArray(value) ? value : [];
    
    const handleChange = (optionValue, checked) => {
      let newValues = [...selectedValues];
      if (checked) {
        if (!newValues.includes(optionValue)) {
          newValues.push(optionValue);
        }
      } else {
        newValues = newValues.filter(v => v !== optionValue);
      }
      onChange(newValues);
    };
    
    const handleAddCustomOption = () => {
      if (customOption.trim() && !selectedValues.includes(customOption.trim())) {
        const newValues = [...selectedValues, customOption.trim()];
        onChange(newValues);
        setCustomOption('');
      }
    };
    
    return (
      <div className="form-group">
        <label>{field.field_label}{field.is_required && <span className="text-danger">*</span>}</label>
        
        {/* 预设选项 */}
        {field.options.map(option => (
          <div className="form-check" key={option.value}>
            <input
              type="checkbox"
              className="form-check-input"
              id={`${field.field_name}_${option.value}`}
              checked={selectedValues.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              disabled={disabled}
            />
            <label className="form-check-label" htmlFor={`${field.field_name}_${option.value}`}>
              {option.label}
            </label>
          </div>
        ))}
        
        {/* 允许用户添加自定义选项 */}
        {field.allow_custom_options && !disabled && (
          <div className="input-group mt-2">
            <input
              type="text"
              className="form-control"
              placeholder="添加自定义选项"
              value={customOption}
              onChange={(e) => setCustomOption(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleAddCustomOption}
            >
              添加
            </button>
          </div>
        )}
        
        {/* 显示已添加的自定义选项 */}
        {selectedValues.filter(v => !field.options.some(opt => opt.value === v)).length > 0 && (
          <div className="mt-2">
            <small className="text-muted">自定义选项:</small>
            {selectedValues
              .filter(v => !field.options.some(opt => opt.value === v))
              .map(customVal => (
                <div className="form-check" key={customVal}>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id={`${field.field_name}_${customVal}`}
                    checked={true}
                    onChange={() => handleChange(customVal, false)}
                    disabled={disabled}
                  />
                  <label className="form-check-label" htmlFor={`${field.field_name}_${customVal}`}>
                    {customVal}
                  </label>
                </div>
              ))}
          </div>
        )}
      </div>
    );
  } 
  
  // 单选模式
  else {
    // 处理自定义"其他"选项
    const isOtherSelected = typeof value === 'object' && value?.value === 'other';
    const customText = isOtherSelected ? value.custom_text || '' : '';
    
    const handleOtherTextChange = (text) => {
      onChange({ value: 'other', custom_text: text });
    };
    
    const handleAddCustomOption = () => {
      if (customOption.trim()) {
        onChange(customOption.trim());
        setCustomOption('');
      }
    };
    
    return (
      <div className="form-group">
        <label>{field.field_label}{field.is_required && <span className="text-danger">*</span>}</label>
        
        {/* 预设选项列表 */}
        {field.options.map(option => (
          <div className="form-check" key={option.value}>
            <input
              type="radio"
              className="form-check-input"
              name={field.field_name}
              id={`${field.field_name}_${option.value}`}
              value={option.value}
              checked={!isOtherSelected && value === option.value}
              onChange={() => onChange(option.value)}
              disabled={disabled}
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
              checked={isOtherSelected}
              onChange={() => onChange({ value: 'other', custom_text: '' })}
              disabled={disabled}
            />
            <label className="form-check-label" htmlFor={`${field.field_name}_other`}>
              其他
            </label>
            {isOtherSelected && (
              <input
                type="text"
                className="form-control mt-1"
                placeholder="请说明"
                value={customText}
                onChange={(e) => handleOtherTextChange(e.target.value)}
                disabled={disabled}
              />
            )}
          </div>
        )}
        
        {/* 允许用户添加自定义选项 */}
        {field.allow_custom_options && !disabled && (
          <div className="input-group mt-2">
            <input
              type="text"
              className="form-control"
              placeholder="添加自定义选项"
              value={customOption}
              onChange={(e) => setCustomOption(e.target.value)}
            />
            <button
              className="btn btn-outline-secondary"
              type="button"
              onClick={handleAddCustomOption}
            >
              添加
            </button>
          </div>
        )}
        
        {/* 显示被选中的自定义选项 */}
        {!isOtherSelected && value && !field.options.some(opt => opt.value === value) && (
          <div className="form-check">
            <input
              type="radio"
              className="form-check-input"
              name={field.field_name}
              id={`${field.field_name}_${value}`}
              checked={true}
              onChange={() => {}}
              disabled={disabled}
            />
            <label className="form-check-label" htmlFor={`${field.field_name}_${value}`}>
              {value} <span className="text-muted">(自定义选项)</span>
            </label>
          </div>
        )}
      </div>
    );
  }
}
```

### 3. 日期字段组件

实现日期字段组件：

```jsx
// DateField.jsx
import React from 'react';

export function DateField({ field, value, onChange, disabled = false }) {
  return (
    <div className="form-group">
      <label>
        {field.field_label}
        {field.is_required && <span className="text-danger">*</span>}
      </label>
      <input
        type="date"
        className="form-control"
        id={field.field_name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
      <small className="form-text text-muted">格式: YYYY-MM-DD</small>
    </div>
  );
}
```

## 数据提交处理

更新表单提交逻辑，以处理多选和日期字段的数据格式：

```jsx
// FormSubmitter.jsx
import React, { useState } from 'react';
import { RadioField } from './RadioField';
import { DateField } from './DateField';
// ... 导入其他字段组件

export function FormSubmitter({ fields, onSubmit }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const handleFieldChange = (fieldId, value) => {
    setFormData({
      ...formData,
      [fieldId]: value
    });
    
    // 清除对应字段的错误
    if (errors[fieldId]) {
      const newErrors = {...errors};
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    fields.forEach(field => {
      const value = formData[field.id];
      
      // 检查必填字段
      if (field.is_required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = `${field.field_label}是必填项`;
          isValid = false;
        } else if (field.allow_multiple && Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = `请至少选择一个${field.field_label}选项`;
          isValid = false;
        } else if (field.field_type === 'date') {
          // 验证日期格式
          const datePattern = /^\d{4}-\d{2}-\d{2}$/;
          if (!datePattern.test(value)) {
            newErrors[field.id] = `${field.field_label}格式不正确，应为YYYY-MM-DD`;
            isValid = false;
          }
        }
      }
      
      // 验证"其他"选项
      if (field.field_type === 'radio' && field.other_option && 
          typeof value === 'object' && value?.value === 'other') {
        if (!value.custom_text || value.custom_text.trim() === '') {
          newErrors[field.id] = `请填写"其他"选项的具体内容`;
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      // 准备提交的表单项
      const formItems = Object.entries(formData).map(([fieldId, value]) => {
        const field = fields.find(f => f.id.toString() === fieldId.toString());
        return {
          field_id: parseInt(fieldId),
          field_type: field.field_type,
          field_value: value
        };
      });
      
      onSubmit({ form_items: formItems });
    }
  };
  
  const renderField = (field) => {
    const fieldValue = formData[field.id];
    const fieldError = errors[field.id];
    
    switch (field.field_type) {
      case 'text':
        return (
          <div className="form-group mb-3" key={field.id}>
            <label>
              {field.field_label}
              {field.is_required && <span className="text-danger">*</span>}
            </label>
            <input
              type="text"
              className={`form-control ${fieldError ? 'is-invalid' : ''}`}
              value={fieldValue || ''}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
            />
            {fieldError && <div className="invalid-feedback">{fieldError}</div>}
          </div>
        );
        
      case 'radio':
        return (
          <div className="mb-3" key={field.id}>
            <RadioField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.id, value)}
            />
            {fieldError && <div className="text-danger">{fieldError}</div>}
          </div>
        );
        
      case 'date':
        return (
          <div className="mb-3" key={field.id}>
            <DateField
              field={field}
              value={fieldValue}
              onChange={(value) => handleFieldChange(field.id, value)}
            />
            {fieldError && <div className="text-danger">{fieldError}</div>}
          </div>
        );
        
      // ... 其他字段类型的渲染
      
      default:
        return null;
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {fields.map(field => renderField(field))}
      
      <div className="mt-4">
        <button type="submit" className="btn btn-primary">提交表单</button>
      </div>
    </form>
  );
}
```

## 表单数据展示

用于查看已提交表单数据的组件：

```jsx
// FormDataViewer.jsx
import React from 'react';

export function FormDataViewer({ formData }) {
  const renderFieldValue = (field) => {
    const { type, content, options } = field;
    
    switch (type) {
      case 'text':
        return <span>{content}</span>;
        
      case 'radio':
        if (field.allow_multiple && Array.isArray(content)) {
          // 显示多选内容
          return (
            <ul className="list-unstyled">
              {content.map((value, index) => {
                // 查找匹配的选项标签
                const option = options?.find(opt => opt.value === value);
                return (
                  <li key={index}>
                    {option ? option.label : value} 
                    {!option && <span className="text-muted">(自定义选项)</span>}
                  </li>
                );
              })}
            </ul>
          );
        } else if (typeof content === 'object' && content.value === 'other') {
          // 显示"其他"选项内容
          return (
            <span>
              其他: {content.custom_text}
            </span>
          );
        } else {
          // 显示单选内容
          const option = options?.find(opt => opt.value === content);
          return (
            <span>
              {option ? option.label : content}
              {!option && content !== undefined && <span className="text-muted"> (自定义选项)</span>}
            </span>
          );
        }
        
      case 'date':
        // 格式化日期为本地格式
        try {
          if (content) {
            const date = new Date(content);
            return <span>{date.toLocaleDateString()}</span>;
          }
          return <span>-</span>;
        } catch (e) {
          return <span>{content || '-'}</span>;
        }
        
      case 'image':
        return content ? (
          <div>
            <a href={field.url} target="_blank" rel="noreferrer">
              <img 
                src={field.url} 
                alt={field.field_label} 
                style={{ maxWidth: '200px', maxHeight: '150px' }} 
                className="img-thumbnail"
              />
            </a>
          </div>
        ) : <span>-</span>;
        
      case 'file':
        return content ? (
          <a href={field.url} target="_blank" rel="noreferrer">
            查看文件
          </a>
        ) : <span>-</span>;
        
      default:
        return <span>{content || '-'}</span>;
    }
  };
  
  return (
    <div className="table-responsive">
      <table className="table table-striped table-bordered">
        <thead>
          <tr>
            <th>字段</th>
            <th>内容</th>
          </tr>
        </thead>
        <tbody>
          {formData.map(field => (
            <tr key={field.field_id}>
              <td>{field.field_label}</td>
              <td>{renderFieldValue(field)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## 测试要点

前端实现后需要测试以下功能点：

1. **表单字段管理**
   - 创建各类型字段，特别是带有新功能的单选字段和日期字段
   - 验证各种开关的状态是否正确保存

2. **单选/多选功能**
   - 验证单选模式下只能选择一个选项
   - 验证多选模式下可以选择多个选项
   - 验证"其他"选项及自定义内容的提交
   - 验证自定义选项的添加和提交

3. **日期字段**
   - 验证日期选择器是否正常工作
   - 验证日期格式验证是否有效

4. **表单数据展示**
   - 验证多选值、自定义选项和日期值的展示是否正确

## 附录：API测试用例

### 创建多选字段测试

```bash
curl -X POST http://47.245.102.255:8000/forms/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
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
      {"value": "travel", "label": "旅行"}
    ]
  }'
```

### 创建带"其他"选项的单选字段测试

```bash
curl -X POST http://47.245.102.255:8000/forms/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
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
  }'
```

### 创建日期字段测试

```bash
curl -X POST http://47.245.102.255:8000/forms/fields \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{
    "competition_id": 1,
    "field_name": "birth_date",
    "field_label": "出生日期",
    "field_type": "date",
    "is_required": true
  }'
```

### 提交表单数据测试

```bash
curl -X POST http://47.245.102.255:8000/forms/registrations/1/enhanced-data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "form_items": [
      {
        "field_id": 1,
        "field_type": "radio",
        "field_value": ["sports", "reading"]
      },
      {
        "field_id": 2,
        "field_type": "radio",
        "field_value": {
          "value": "other",
          "custom_text": "专科"
        }
      },
      {
        "field_id": 3,
        "field_type": "date",
        "field_value": "2000-01-01"
      }
    ]
  }'
``` 