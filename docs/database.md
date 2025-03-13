# MySQL 数据库驱动器使用文档

## 目录
1. [配置说明](#配置说明)
2. [基本使用](#基本使用)
3. [API 参考](#api-参考)
4. [使用示例](#使用示例)
5. [最佳实践](#最佳实践)
6. [数据视图](#数据视图)

## 配置说明

### 环境变量配置
在项目根目录的 `.env` 文件中配置以下参数：

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=event_registration
MYSQL_CHARSET=utf8mb4
```

### 导入使用
```python
from utils.database import db
```

## 基本使用

### 1. 插入数据
```python
# 单条插入
user_data = {
    "username": "zhangsan",
    "email": "zhangsan@example.com",
    "age": 25
}
user_id = db.insert("users", user_data)
```

### 2. 查询数据
```python
# 查询单条记录
user = db.select("users", where={"id": 1})

# 查询多条记录
users = db.select(
    table="users",
    fields=["id", "username", "email"],  # 不指定则查询所有字段
    where={"age": 25},
    order_by="created_at DESC",
    limit=10,
    offset=0
)
```

### 3. 更新数据
```python
# 更新数据
update_data = {
    "email": "new_email@example.com",
    "age": 26
}
affected_rows = db.update(
    table="users",
    data=update_data,
    where={"id": 1}
)
```

### 4. 删除数据
```python
# 删除数据
affected_rows = db.delete(
    table="users",
    where={"id": 1}
)
```

## API 参考

### `db.insert(table: str, data: Dict[str, Any]) -> int`
插入一条记录
- 参数：
  - `table`: 表名
  - `data`: 要插入的数据字典
- 返回值：插入记录的ID

### `db.select(table: str, fields: List[str] = None, where: Dict[str, Any] = None, order_by: str = None, limit: int = None, offset: int = None) -> List[Dict]`
查询数据
- 参数：
  - `table`: 表名
  - `fields`: 要查询的字段列表，默认为所有字段
  - `where`: 查询条件字典
  - `order_by`: 排序条件
  - `limit`: 返回记录数限制
  - `offset`: 偏移量
- 返回值：查询结果列表

### `db.update(table: str, data: Dict[str, Any], where: Dict[str, Any]) -> int`
更新数据
- 参数：
  - `table`: 表名
  - `data`: 要更新的数据字典
  - `where`: 更新条件
- 返回值：影响的行数

### `db.delete(table: str, where: Dict[str, Any]) -> int`
删除数据
- 参数：
  - `table`: 表名
  - `where`: 删除条件
- 返回值：影响的行数

### `db.execute(sql: str, params: tuple = None) -> int`
执行原生SQL语句
- 参数：
  - `sql`: SQL语句
  - `params`: SQL参数
- 返回值：影响的行数

### `db.fetch_one(sql: str, params: tuple = None) -> Optional[Dict]`
执行SQL查询并返回单条记录
- 参数：
  - `sql`: SQL语句
  - `params`: SQL参数
- 返回值：单条记录字典或None

### `db.fetch_all(sql: str, params: tuple = None) -> List[Dict]`
执行SQL查询并返回多条记录
- 参数：
  - `sql`: SQL语句
  - `params`: SQL参数
- 返回值：记录字典列表

## 使用示例

### 复杂查询示例
```python
# 分页查询活跃用户
active_users = db.select(
    table="users",
    fields=["id", "username", "email", "last_login"],
    where={"status": "active"},
    order_by="last_login DESC",
    limit=10,
    offset=0
)

# 使用原生SQL
sql = """
    SELECT u.*, COUNT(o.id) as order_count 
    FROM users u 
    LEFT JOIN orders o ON u.id = o.user_id 
    WHERE u.status = %s 
    GROUP BY u.id
"""
users_with_orders = db.fetch_all(sql, ("active",))
```

### 事务操作示例
```python
try:
    # 创建订单
    order_data = {
        "user_id": 1,
        "total_amount": 100.00,
        "status": "pending"
    }
    order_id = db.insert("orders", order_data)
    
    # 创建订单项
    order_item_data = {
        "order_id": order_id,
        "product_id": 1,
        "quantity": 2,
        "price": 50.00
    }
    db.insert("order_items", order_item_data)
    
    # 更新用户信息
    db.update(
        "users",
        {"total_orders": "total_orders + 1"},
        {"id": 1}
    )
    
except Exception as e:
    print(f"Error: {e}")
    # 发生错误时会自动回滚
```

## 最佳实践

1. **连接管理**
   - 驱动器会自动管理连接的创建和关闭
   - 使用 `with` 语句确保连接正确关闭

2. **参数化查询**
   - 始终使用参数化查询防止SQL注入
   - 不要手动拼接SQL字符串

3. **错误处理**
   - 使用 try-except 块处理数据库操作
   - 记录详细的错误信息

4. **性能优化**
   - 只查询需要的字段
   - 合理使用索引
   - 使用 LIMIT 限制返回记录数

5. **资源管理**
   - 及时关闭不需要的连接
   - 避免长时间占用连接

6. **安全性**
   - 不要在代码中硬编码数据库凭据
   - 使用环境变量管理敏感信息
   - 定期更新数据库密码

## 数据视图

### 增强型表单数据视图 (enhanced_form_data)

此视图整合了表单数据的关键信息，包括用户ID、表单项ID、类型和内容，便于一次性查询完整的表单数据。

```sql
CREATE VIEW enhanced_form_data AS
SELECT 
    rfd.id,
    rfd.registration_id,
    cr.user_id,
    rfd.field_id,
    cff.field_type AS type,
    CASE 
        WHEN cff.field_type IN ('text', 'radio') THEN rfd.field_value
        ELSE rfd.file_path
    END AS content,
    cff.options,
    rfd.created_at
FROM 
    registration_form_data rfd
JOIN 
    competition_form_fields cff ON rfd.field_id = cff.id
JOIN 
    competition_registrations cr ON rfd.registration_id = cr.id
```

#### 字段说明：

- **id**: 表单数据记录ID
- **registration_id**: 报名记录ID
- **user_id**: 用户ID
- **field_id**: 表单字段ID
- **type**: 字段类型 (text, image, file, radio)
- **content**: 统一的内容字段，根据类型不同包含文本内容或文件路径
- **options**: 对于单选字段，包含可选项列表
- **created_at**: 创建时间

#### 使用示例：

```sql
-- 获取特定报名的所有表单数据
SELECT * FROM enhanced_form_data WHERE registration_id = 1;

-- 获取特定用户的所有表单数据
SELECT * FROM enhanced_form_data WHERE user_id = 123;

-- 按类型筛选表单数据
SELECT * FROM enhanced_form_data WHERE type = 'image';

-- 获取所有单选字段数据
SELECT * FROM enhanced_form_data WHERE type = 'radio';
``` 