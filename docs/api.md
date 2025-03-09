# API 文档

## 用户管理

### 1. 用户注册
```python
from utils.user_service import UserService

# 注册新用户
result = UserService.register(
    username="zhangsan",
    password="your_password",
    email="zhangsan@example.com"
)
```
返回值：
```python
{
    "id": 1,
    "username": "zhangsan",
    "role": "user"
}
```

### 2. 用户登录
```python
# 用户登录
result = UserService.login(
    username="zhangsan",
    password="your_password"
)
```
返回值：
```python
{
    "token": "jwt_token_string",
    "user": {
        "id": 1,
        "username": "zhangsan",
        "role": "user"
    }
}
```

### 3. 用户管理（管理员）
```python
# 获取用户列表
users = UserService.list_users(page=1, per_page=10, role="user")

# 更新用户角色
success = UserService.update_user_role(user_id=1, new_role="admin")

# 更新用户状态
success = UserService.update_user_status(user_id=1, status="inactive")
```

## 活动管理

### 1. 活动操作（管理员）
```python
from utils.competition_service import CompetitionService

# 创建活动
competition_data = {
    "title": "2024年程序设计大赛",
    "description": "活动描述",
    "start_time": "2024-03-01 10:00:00",
    "end_time": "2024-03-01 18:00:00",
    "max_participants": 100,
    "status": "draft"  # draft, published, closed
}
competition_id = CompetitionService.create_competition(competition_data)

# 更新活动
update_data = {
    "status": "published",
    "description": "更新后的描述"
}
success = CompetitionService.update_competition(competition_id, update_data)

# 删除活动
success = CompetitionService.delete_competition(competition_id)
```

### 2. 活动查询
```python
# 获取活动列表
competitions = CompetitionService.list_competitions(
    page=1,
    per_page=10,
    status="published",
    search="程序设计"
)

# 获取活动详情
competition = CompetitionService.get_competition(competition_id)
```

### 3. 活动报名
```python
# 报名活动
registration_data = {
    "team_name": "创新队",
    "contact_phone": "13800138000",
    "additional_info": "其他信息"
}
registration_id = CompetitionService.register_competition(
    user_id=1,
    competition_id=1,
    data=registration_data
)

# 查看报名状态
status = CompetitionService.get_registration_status(user_id=1, competition_id=1)
```

### 4. 报名管理（管理员）
```python
# 获取报名列表
registrations = CompetitionService.list_registrations(
    competition_id=1,
    status="pending",
    page=1,
    per_page=10
)

# 更新报名状态
success = CompetitionService.update_registration_status(
    registration_id=1,
    status="approved"  # approved, rejected
)

# 导出报名数据
excel_data = CompetitionService.export_registrations(competition_id=1)
with open("registrations.xlsx", "wb") as f:
    f.write(excel_data)
```

## 数据结构

### 用户表 (users)
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL
);
```

### 活动表 (competitions)
```sql
CREATE TABLE competitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_participants INT,
    current_participants INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);
```

### 活动报名表 (competition_registrations)
```sql
CREATE TABLE competition_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    competition_id INT NOT NULL,
    team_name VARCHAR(50),
    contact_phone VARCHAR(20),
    additional_info TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (competition_id) REFERENCES competitions(id)
);
```

## 状态说明

### 用户状态
- `active`: 正常
- `inactive`: 禁用

### 用户角色
- `user`: 普通用户
- `admin`: 管理员

### 活动状态
- `draft`: 草稿
- `published`: 已发布
- `closed`: 已关闭

### 报名状态
- `pending`: 待审核
- `approved`: 已通过
- `rejected`: 已拒绝 