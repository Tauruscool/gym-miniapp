// file: apps/admin/README.md
# 云开发 quickstart

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 云函数列表

### user_bind_phone（开发调试版）
**创建时间：** 2025-11-04 22:12:26

**功能说明：** 用户绑定手机号云函数

**路径：** `/apps/admin/cloudfunctions/user_bind_phone/index.js`

**功能描述：**
- 为当前登录用户绑定手机号
- 检查手机号是否已被其他账号绑定（唯一性保护）
- 更新用户信息中的手机号和更新时间

**参数：**
- `phone` (string, 必填): 要绑定的手机号

**返回值：**
- `ok` (boolean): 操作是否成功
- `phone` (string): 绑定的手机号

**错误处理：**
- 缺少手机号：抛出错误 "缺少手机号"
- 用户未登录：抛出错误 "请先登录再绑定手机号"
- 手机号已被绑定：抛出错误 "该手机号已被其他账号绑定"

---

### user_list_pending_sessions
**创建时间：** 2025-11-04 22:44:31  
**更新时间：** 2025-11-15 12:01:13

**功能说明：** 拉取当前登录用户的"待确认"或"已确认"课程列表

**路径：** `/apps/admin/cloudfunctions/user_list_pending_sessions/index.js`

**功能描述：**
- 从 openid 自动映射 userId（优先使用 users 表的 userId 字段，否则使用 _id）
- 查询当前登录用户的待确认课程（status: 'pending'）或包含已确认课程
- 支持关键字搜索：按课程标题（title）模糊匹配
- 支持日期范围筛选：支持 `startFrom` 和 `startTo` 参数（ISO 格式字符串）
- 支持 tenantId 自动识别（使用用户记录的 tenantId）
- 按开始时间升序排列
- 返回精简的课程信息列表（最多 100 条）

**参数：**
- `includeConfirmed` (boolean, 可选): 是否包含已确认的课程，默认 false（仅返回待确认）
- `q` (string, 可选): 关键字搜索，支持按课程标题模糊匹配，默认 ""
- `startFrom` (string, 可选): 开始时间范围起点（ISO 格式字符串）
- `startTo` (string, 可选): 开始时间范围终点（ISO 格式字符串）

**返回值：**
- `list` (array): 课程列表，每个课程包含：
  - `_id`: 课程ID
  - `title`: 课程标题
  - `startAt`: 开始时间
  - `endAt`: 结束时间
  - `status`: 课程状态（pending/confirmed）
- `reason` (string, 可选): 如果用户不存在，返回 'no_user'

**错误处理：**
- 用户不存在：返回 `{ list: [], reason: 'no_user' }`（不抛错）

**变更说明（v1.3）：**
- 优化日期处理：移除 `new Date().toISOString()` 转换，直接使用传入的 ISO 格式日期字符串
- 优化代码结构：使用更清晰的变量命名和注释
- 保持功能不变：支持关键字搜索、日期范围筛选、includeConfirmed 参数

**变更说明（v1.2）：**
- 新增关键字搜索：支持按课程标题（title）模糊匹配
- 新增日期范围筛选：支持 `startFrom` 和 `startTo` 参数
- 返回字段精简：仅返回 `_id`、`title`、`startAt`、`endAt`、`status`

**变更说明（v1.1）：**
- 从 openid 映射 userId：优先使用 users 表的 userId 字段，否则使用 _id
- 支持 tenantId 参数：优先使用参数值，否则使用用户记录的 tenantId
- 新增 includeConfirmed 参数：支持查询包含已确认状态的课程
- 移除 onlyFuture 和 pageSize 参数：简化接口
- 返回完整字段：不再精简返回字段，返回所有查询字段
- 优化错误处理：用户不存在时返回空列表和原因，不抛错

---

### admin_create_session
**创建时间：** 2025-11-04 22:53:22  
**更新时间：** 2025-11-15 11:38:24

**功能说明：** 管理员创建待确认课程会话

**路径：** `/apps/admin/cloudfunctions/admin_create_session/index.js`

**功能描述：**
- 直接使用 userId 创建待确认状态的课程会话（status: 'pending'）
- 自动推断 tenantId：参数 → 学员 → 管理员 → 默认值 'default'
- 创建课程时自动写入学员手机号（userPhone）到 sessions 文档
- 使用 `db.serverDate()` 作为创建时间，确保时区一致性
- 时间格式统一转换为 ISO 格式存储
- 使用 `cloud.DYNAMIC_CURRENT_ENV` 初始化云环境

**参数：**
- `userId` (string, 必填): 用户ID
- `coachId` (string, 可选): 教练ID，默认 null
- `startAt` (string, 必填): 开始时间，支持能被 `new Date()` 解析的任何格式
- `endAt` (string, 必填): 结束时间，支持能被 `new Date()` 解析的任何格式
- `title` (string, 可选): 课程标题，默认 '未命名课程'
- `tenantId` (string, 可选): 租户ID，如不提供则自动推断

**返回值：**
- `sessionId` (string): 创建的会话ID

**错误处理：**
- 缺少 userId：抛出错误 "admin_create_session: 缺少 userId"
- 缺少时间：抛出错误 "admin_create_session: 缺少时间"
- 非法时间：抛出错误 "admin_create_session: 非法时间"
- 未找到学员：抛出错误 "admin_create_session: 未找到该学员"

**变更说明（v1.3）：**
- 创建课程时自动写入 userPhone：从 users 表查询学员的 phone 字段，冗余存储到 sessions 文档
- 优化用户查询逻辑：同时查询 tenantId 和 phone 字段，确保数据完整性
- 增强错误处理：学员不存在时抛出明确的错误提示

**变更说明（v1.2）：**
- 移除 tenantId 必填校验，改为自动推断
- 实现租户ID推断链：参数 → 学员记录 → 管理员记录 → 默认值 'default'
- 使用 `cloud.DYNAMIC_CURRENT_ENV` 初始化云环境
- 优化时间处理函数，统一使用 `toISO` 函数
- 获取管理员 OPENID 用于租户推断

**变更说明（v1.1）：**
- 移除用户查找逻辑，直接要求传入 userId（不再支持 userPhone）
- 移除时间格式转换函数，直接使用 `new Date()` 解析时间
- 使用 `db.serverDate()` 替代 `new Date()` 作为创建时间
- 简化参数校验逻辑，错误信息统一前缀 "admin_create_session:"
- `coachId` 默认值从 'unknown' 改为 null
- `title` 默认值从 '私教课' 改为 '未命名课程'

---

### catalog_search
**创建时间：** 2025-11-04 23:13:10

**功能说明：** 按关键字/肌群分页查询训练目录

**路径：** `/apps/admin/cloudfunctions/catalog_search/index.js`

**功能描述：**
- 支持按关键字模糊搜索训练项目名称或代码（不区分大小写）
- 支持按肌群精确筛选训练项目
- 支持分页查询，每页最多返回 50 条记录
- 按名称升序排列返回结果
- 返回精简的训练项目信息列表

**参数：**
- `key` (string, 可选): 关键字，用于匹配训练项目的 name 或 code 字段，模糊搜索且不区分大小写，默认 ""
- `muscle` (string, 可选): 肌群，精确匹配 muscleGroup 字段，为空则不过滤，默认 ""
- `page` (number, 可选): 第几页，从 0 开始，默认 0
- `pageSize` (number, 可选): 每页条数，最大 50，默认 20
- `tenantId` (string, 可选): 租户ID，默认 't_default'

**返回值：**
- `list` (array): 训练项目列表，每个项目包含：
  - `code`: 训练项目代码
  - `name`: 训练项目名称
  - `muscleGroup`: 肌群
  - `unit`: 单位（如 'kg'、'sec' 等）
  - `defaultLoad`: 默认负荷，默认为 0
- `page` (number): 当前页码
- `pageSize` (number): 每页条数
- `hasMore` (boolean): 是否还有更多数据（当返回的列表长度等于 pageSize 时，表示可能还有更多数据）

**查询逻辑：**
- 关键字搜索：如果提供了 `key` 参数，会在训练项目的 `name` 或 `code` 字段中搜索（二选一命中即可）
- 肌群筛选：如果提供了 `muscle` 参数，会精确匹配 `muscleGroup` 字段
- 分页处理：系统会自动限制 `pageSize` 最大值为 50，确保单次查询不会返回过多数据
- 排序规则：结果按 `name` 字段升序排列

**使用示例：**
```javascript
// 搜索包含"深蹲"的训练项目
wx.cloud.callFunction({
  name: 'catalog_search',
  data: {
    key: '深蹲',
    page: 0,
    pageSize: 20
  }
});

// 查询"胸部"肌群的所有训练项目
wx.cloud.callFunction({
  name: 'catalog_search',
  data: {
    muscle: '胸部',
    page: 0,
    pageSize: 20
  }
});

// 组合查询：在"腿部"肌群中搜索包含"深"的训练项目
wx.cloud.callFunction({
  name: 'catalog_search',
  data: {
    key: '深',
    muscle: '腿部',
    page: 0,
    pageSize: 20
  }
});
```

---

### seed_training_catalog
**创建时间：** 2025-11-06 21:14:49

**功能说明：** 幂等灌入训练动作库（含肌群信息）

**路径：** `/apps/admin/cloudfunctions/seed_training_catalog/index.js`

**功能描述：**
- 幂等灌库：如果动作不存在则插入，如果已存在则更新字段（补齐 muscleGroup / defaultLoad 等）
- 不会覆盖已存在记录的自定义字段，仅更新标准字段
- 支持批量灌入 5 个基础训练动作

**参数：**
- 无需参数

**返回值：**
- `inserted` (number): 新插入的记录数
- `updated` (number): 更新的记录数

**灌入的动作列表：**
- SQ（深蹲）：下肢，单位 kg，默认负荷 20
- DL（硬拉）：后链，单位 kg，默认负荷 30
- BP（卧推）：胸，单位 kg，默认负荷 20
- ROW（俯身划船）：背，单位 kg，默认负荷 15
- PLANK（平板支撑）：核心，单位 sec，默认负荷 60

**幂等性保证：**
- 按 `tenantId` 和 `code` 判断记录是否存在
- 如果不存在：插入新记录，包含所有字段和 `createdAt` 时间戳
- 如果已存在：更新 `name`、`muscleGroup`、`unit`、`defaultLoad`、`updatedAt` 字段
- 不会删除或覆盖记录的其他自定义字段

**使用示例：**
```javascript
// 在微信开发者工具中右键云函数 -> 上传并部署：云端安装依赖
// 然后在小程序中调用
wx.cloud.callFunction({
  name: 'seed_training_catalog',
  success: res => {
    console.log('灌库结果：', res.result);
    // 输出：{ inserted: 5, updated: 0 } 或 { inserted: 0, updated: 5 } 等
  }
});
```

---

### admin_search_users
**创建时间：** 2025-11-06 22:07:56

**功能说明：** 模糊搜索学员（手机号/昵称）

**路径：** `/apps/admin/cloudfunctions/admin_search_users/index.js`

**功能描述：**
- 支持按手机号或昵称模糊搜索学员（不区分大小写）
- 支持分页查询，每页最多返回 50 条记录
- 按昵称升序排列返回结果
- 返回精简的学员信息列表（userId、nickname、phone）

**参数：**
- `q` (string, 可选): 搜索关键字，用于匹配学员的手机号或昵称，模糊搜索且不区分大小写，默认 ""
- `page` (number, 可选): 第几页，从 0 开始，默认 0
- `pageSize` (number, 可选): 每页条数，最大 50，默认 20
- `tenantId` (string, 可选): 租户ID，默认 't_default'

**返回值：**
- `list` (array): 学员列表，每个学员包含：
  - `userId`: 学员ID
  - `nickname`: 学员昵称（如果为空则返回 '未命名'）
  - `phone`: 手机号（如果为空则返回空字符串）
- `page` (number): 当前页码
- `pageSize` (number): 每页条数
- `hasMore` (boolean): 是否还有更多数据（当返回的列表长度等于 pageSize 时，表示可能还有更多数据）

**查询逻辑：**
- 关键字搜索：如果提供了 `q` 参数，会在学员的 `phone` 或 `nickname` 字段中搜索（二选一命中即可）
- 分页处理：系统会自动限制 `pageSize` 最大值为 50，确保单次查询不会返回过多数据
- 排序规则：结果按 `nickname` 字段升序排列
- 租户隔离：默认只查询 `tenantId` 为 't_default' 的学员，可通过参数指定其他租户

**使用示例：**
```javascript
// 搜索手机号包含"138"的学员
wx.cloud.callFunction({
  name: 'admin_search_users',
  data: {
    q: '138',
    page: 0,
    pageSize: 20
  }
});

// 搜索昵称包含"张"的学员
wx.cloud.callFunction({
  name: 'admin_search_users',
  data: {
    q: '张',
    page: 0,
    pageSize: 20
  }
});

// 查询所有学员（不提供 q 参数）
wx.cloud.callFunction({
  name: 'admin_search_users',
  data: {
    page: 0,
    pageSize: 20
  }
});
```

---

### admin_list_sessions
**创建时间：** 2025-11-06 22:11:03  
**更新时间：** 2025-11-15 11:38:24

**功能说明：** 管理员查询课程列表（支持关键字搜索、状态筛选和时间筛选）

**路径：** `/apps/admin/cloudfunctions/admin_list_sessions/index.js`

**功能描述：**
- 支持关键字搜索：按课程标题（title）模糊匹配，或通过用户手机号/昵称搜索关联的课程
- 支持状态筛选：可筛选指定状态的课程
- 支持日期范围筛选：可筛选指定时间范围内的课程
- 优先使用 sessions.userPhone：新课程直接返回冗余的手机号字段
- 兜底查询 users 表：为旧数据（无 userPhone）自动补一次手机号查询
- 自动获取管理员租户ID，支持租户隔离查询
- 查询上限：最多返回 100 条记录，按开始时间升序排列

**参数：**
- `q` (string, 可选): 关键字搜索，支持匹配课程标题（title）或用户手机号/昵称
- `status` (string, 可选): 课程状态筛选，可选值：'pending'（待确认）、'confirmed'（已确认）、'completed'（已完成）、'cancelled'（已取消）
- `startFrom` (string, 可选): 开始时间范围起点（ISO 格式字符串）
- `startTo` (string, 可选): 开始时间范围终点（ISO 格式字符串）

**返回值：**
- `list` (array): 课程列表，每个课程包含：
  - `_id`: 课程ID
  - `userId`: 学员ID
  - `userPhone`: 学员手机号（优先使用 sessions.userPhone，旧数据兜底查询 users 表）
  - `title`: 课程标题
  - `startAt`: 开始时间（ISO 格式字符串）
  - `endAt`: 结束时间（ISO 格式字符串）
  - `status`: 课程状态（pending/confirmed/completed/cancelled）
  - `coachId`: 教练ID

**查询逻辑：**
- 关键字搜索：如果提供了 `q` 参数，会在课程标题中搜索，或通过用户手机号/昵称搜索关联的课程
- 状态筛选：如果提供了 `status` 参数，只返回指定状态的课程
- 日期范围筛选：如果提供了 `startFrom` 或 `startTo` 参数，会筛选指定时间范围内的课程
- 手机号处理：优先使用 sessions.userPhone，如果为空则批量查询 users 表补全
- 排序规则：结果按 `startAt` 字段升序排列
- 租户隔离：自动获取管理员的 tenantId，只查询同租户的课程

**变更说明（v1.2）：**
- 优先使用 sessions.userPhone：新课程直接返回冗余的手机号字段，提升查询性能
- 兜底查询优化：只为缺少 userPhone 的旧数据批量查询 users 表，避免不必要的数据库查询
- 返回字段优化：在 field 查询中明确包含 userPhone 字段

**变更说明（v1.1）：**
- 新增关键字搜索：支持按课程标题（title）模糊匹配，或通过用户手机号/昵称搜索关联的课程
- 新增日期范围筛选：支持 `startFrom` 和 `startTo` 参数，筛选指定时间范围内的课程
- 优化查询逻辑：自动获取管理员租户ID，支持按状态筛选
- 返回字段：`_id`、`userId`、`title`、`startAt`、`endAt`、`status`、`coachId`
- 查询上限：最多返回 100 条记录，按开始时间升序排列

**使用示例：**
```javascript
// 查询学员的所有待确认和已确认课程
wx.cloud.callFunction({
  name: 'admin_list_sessions',
  data: {
    userId: 'user_123456',
    page: 0,
    pageSize: 20
  }
});

// 查询学员的所有未来课程（待确认和已确认）
wx.cloud.callFunction({
  name: 'admin_list_sessions',
  data: {
    userId: 'user_123456',
    onlyFuture: true,
    page: 0,
    pageSize: 20
  }
});

// 查询学员的所有已完成课程
wx.cloud.callFunction({
  name: 'admin_list_sessions',
  data: {
    userId: 'user_123456',
    statusIn: ['completed'],
    page: 0,
    pageSize: 20
  }
});

// 查询学员的所有课程（包括所有状态）
wx.cloud.callFunction({
  name: 'admin_list_sessions',
  data: {
    userId: 'user_123456',
    statusIn: ['pending', 'confirmed', 'completed', 'cancelled'],
    page: 0,
    pageSize: 20
  }
});
```

---

### admin_update_session
**创建时间：** 2025-11-15 11:40:53

**功能说明：** 管理员更新课程时间

**路径：** `/apps/admin/cloudfunctions/admin_update_session/index.js`

**功能描述：**
- 支持更新课程的开始时间和结束时间
- 时间格式统一转换为 ISO 格式存储
- 参数校验：必填 sessionId、startAt、endAt
- 错误处理：缺少参数或非法时间时抛出明确错误

**参数：**
- `sessionId` (string, 必填): 课程ID
- `startAt` (string, 必填): 开始时间，支持能被 `new Date()` 解析的任何格式
- `endAt` (string, 必填): 结束时间，支持能被 `new Date()` 解析的任何格式

**返回值：**
- `ok` (boolean): 操作是否成功

**错误处理：**
- 缺少 sessionId：抛出错误 "admin_update_session: 缺少 sessionId"
- 缺少时间：抛出错误 "admin_update_session: 缺少时间"
- 非法时间：抛出错误 "admin_update_session: 非法时间"

**使用示例：**
```javascript
wx.cloud.callFunction({
  name: 'admin_update_session',
  data: {
    sessionId: 'session_123456',
    startAt: '2025-11-15 14:00:00',
    endAt: '2025-11-15 15:00:00'
  }
});
```

---

### admin_delete_session
**创建时间：** 2025-11-15 11:40:53

**功能说明：** 管理员删除课程

**路径：** `/apps/admin/cloudfunctions/admin_delete_session/index.js`

**功能描述：**
- 支持删除课程（硬删除，直接移除文档）
- 参数校验：必填 sessionId
- 错误处理：缺少 sessionId 时抛出明确错误
- 注意：当前为简单版本，如需软删除可改为 `status: 'canceled'`

**参数：**
- `sessionId` (string, 必填): 课程ID

**返回值：**
- `ok` (boolean): 操作是否成功

**错误处理：**
- 缺少 sessionId：抛出错误 "admin_delete_session: 缺少 sessionId"

**使用示例：**
```javascript
wx.cloud.callFunction({
  name: 'admin_delete_session',
  data: {
    sessionId: 'session_123456'
  }
});
```

---

## 页面更新记录

### schedule 页面（课程创建页面）

**更新时间：** 2025-11-04 22:37:35

**版本：** v1.1

**路径：** `/apps/admin/pages/schedule/`

**更新内容：**
- 简化了表单界面，移除了日期/时间选择器（picker），改为直接输入框
- 优化了代码结构，简化了数据处理逻辑
- 添加了复制 sessionId 功能，使用 `wx.setClipboardData` API
- 简化了样式文件，使用更简洁的布局

**主要改动：**
1. **schedule.wxml (v1.1)**
   - 移除了复杂的日期时间选择器组件
   - 改为三个简单的输入框：用户手机号、开始时间、结束时间
   - 添加了复制按钮，可直接复制 sessionId

2. **schedule.js (v1.1)**
   - 简化了数据结构，移除了 startDate、startTime、endDate、endTime 等中间变量
   - 直接使用 startAt 和 endAt 存储时间字符串（格式：YYYY-MM-DD HH:mm）
   - 简化了事件处理函数：onPhone、onStart、onEnd
   - 添加了 copySid 函数，用于复制 sessionId 到剪贴板
   - 优化了错误提示信息显示

3. **schedule.wxss (v1.1)**
   - 大幅简化样式，移除了复杂的表单样式
   - 使用简洁的 .box 和 .result 样式类
   - 结果区域使用 flex 布局，便于显示 sessionId 和复制按钮

**功能说明：**
- 用户可以直接在输入框中输入手机号和时间信息
- 时间格式：YYYY-MM-DD HH:mm（例如：2025-11-04 14:30）
- 创建成功后显示 sessionId，并可通过复制按钮一键复制
- 使用微信原生 API `wx.setClipboardData` 实现复制功能，无需额外权限

**备份文件：**
- schedule.wxml.v1.0（已备份旧版本）
- schedule.js.v1.0（已备份旧版本）
- schedule.wxss.v1.0（已备份旧版本）

---

**更新时间：** 2025-11-04 22:53:22

**版本：** v1.2

**更新内容：**
- 重新引入日期和时间选择器（picker），提供更好的用户体验
- 实现智能时间校验，自动调整结束时间避免冲突
- 优化界面样式，使用更专业的表单布局
- 改进云函数，支持多种时间格式自动转换
- 增强错误处理和用户提示

**主要改动：**
1. **schedule.wxml (v1.2)**
   - 恢复使用日期选择器（picker mode="date"）选择开始和结束日期
   - 恢复使用时间选择器（picker mode="time"）选择开始和结束时间
   - 每个字段都有清晰的标签和统一的样式
   - 保持复制 sessionId 功能

2. **schedule.js (v1.2)**
   - 恢复使用分离的日期和时间数据结构（startDate、startTime、endDate、endTime）
   - 添加 `today()` 函数，自动设置默认日期为今天
   - 添加 `addMinutes()` 函数，用于自动调整结束时间
   - 添加 `toISO()` 函数，将日期时间转换为 ISO 格式
   - 实现智能时间校验：当开始时间变化时，如果结束时间早于或等于开始时间，自动将结束时间顺延 60 分钟
   - 优化手机号输入，自动去除前后空格
   - 改进错误提示信息

3. **schedule.wxss (v1.2)**
   - 恢复专业的表单样式设计
   - 添加 `.field` 样式类，统一字段间距
   - 添加 `.label` 样式类，统一的标签样式
   - 添加 `.ipt` 和 `.picker` 样式类，统一的输入框和选择器样式
   - 优化按钮样式，使用微信绿色主题色
   - 改进结果区域布局

4. **admin_create_session/index.js (v1.2)**
   - 添加 `toISO()` 函数，支持多种时间格式的自动转换
   - 支持 ISO 格式和 "YYYY-MM-DD HH:mm" 格式的时间输入
   - 支持通过 userId 或 userPhone 查找用户
   - 增强时间格式校验，确保时间格式合法
   - 改进错误提示信息，更加详细和友好
   - 使用 `userId` 字段而不是 `_id` 存储用户ID（与数据库字段保持一致）

**功能说明：**
- 用户通过日期选择器选择开始和结束日期
- 用户通过时间选择器选择开始和结束时间
- 系统默认设置为今天的日期，开始时间 09:00，结束时间 10:00
- 当修改开始日期或开始时间时，如果结束时间早于或等于开始时间，系统会自动将结束时间顺延 60 分钟
- 创建时会自动将日期时间转换为 ISO 格式发送给云函数
- 云函数支持多种时间格式的自动识别和转换
- 创建成功后显示 sessionId，并可通过复制按钮一键复制

**备份文件：**
- schedule.wxml.v1.1（已备份 v1.1 版本）
- schedule.js.v1.1（已备份 v1.1 版本）
- schedule.wxss.v1.1（已备份 v1.1 版本）

---

### report 页面（训练报告页面）

**更新时间：** 2025-11-04 23:16:33

**版本：** v2.0

**路径：** `/apps/admin/pages/report/`

**更新内容：**
- 完整重构训练报告页面，实现完整的训练动作选择和编辑功能
- 集成训练目录搜索功能，支持关键字和肌群筛选
- 添加 RPE（主观疲劳度）评分功能
- 实现动作的添加、移除和编辑功能
- 优化界面布局，使用卡片式设计
- 支持分页加载更多搜索结果

**主要改动：**
1. **report.wxml (v2.0)**
   - 添加基本信息输入区域：SessionId、扣费金额、备注、RPE滑块
   - 添加训练目录搜索区域：关键字搜索、肌群选择器、搜索按钮、加载更多按钮
   - 添加已选动作编辑区域：显示已选动作列表，支持编辑组数、次数、重量/时长、备注
   - 添加提交按钮，统一提交报告并扣费

2. **report.js (v2.0)**
   - 添加完整的数据结构：sessionId、deduct、comment、RPE、搜索条件、结果列表、已选动作列表
   - 实现基本输入处理：onSid、onDeduct、onComment、onRPE
   - 实现搜索功能：onKey、onMuscleChange、search、loadMore、_fetch
   - 实现动作管理：addOne（添加动作）、removeOne（移除动作）、editItem（编辑动作）
   - 实现提交功能：submit（提交报告并扣费）
   - 集成 catalog_search 云函数进行训练目录搜索
   - 集成 report_and_deduct 云函数提交报告并扣费

3. **report.wxss (v2.0)**
   - 使用卡片式布局设计，每个功能模块独立成卡片
   - 优化输入框和按钮样式，统一视觉风格
   - 使用网格布局（grid）展示动作编辑表单
   - 添加 RPE 滑块样式
   - 优化已选动作列表的展示效果

**功能说明：**
- 输入 SessionId 和扣费金额（默认 100 元）
- 可选输入备注信息
- 通过滑块设置 RPE（1-10 分，默认 7 分）
- 搜索训练动作：支持关键字搜索（如"深蹲"或"SQ"）和肌群筛选（全部、下肢、后链、胸、背、核心）
- 添加动作：从搜索结果中选择动作添加到已选列表，默认组数 3 组，次数 8 次（时间类动作为 1 次），重量使用默认值
- 编辑动作：可以修改每个动作的组数、次数、重量/时长、备注
- 移除动作：可以移除已选的动作
- 提交报告：验证表单后提交训练报告并扣费，成功后清空表单

**关联文件：**
- 依赖云函数：`catalog_search`（训练目录搜索）、`report_and_deduct`（提交报告并扣费）

---

**更新时间：** 2025-11-06 22:12:56

**版本：** v2.2

**更新内容：**
- 完整重构 UI/交互，新增学员选择和课程选择功能
- 将 RPE 从滑块改为芯片式选择（1-10 可选）
- 优化界面布局，使用更清晰的卡片式设计
- 集成学员搜索和课程列表功能，实现完整的报告填写流程

**主要改动：**
1. **report.wxml (v2.2)**
   - 新增学员选择区域：支持按手机号或姓名关键词搜索学员
   - 新增课程选择区域：支持状态筛选（全部/待确认/已确认/已完成/已取消）和时间筛选（仅看未开始）
   - 优化报告填写区域：RPE 改为芯片式选择（1-10），更直观易用
   - 优化动作搜索和已选动作区域：使用统一的 `.line` 样式
   - 添加已选状态显示：显示已选学员和已选课程ID

2. **report.js (v2.2)**
   - 新增学员搜索功能：`onUserQ`、`searchUsers`、`pickUser`，集成 `admin_search_users` 云函数
   - 新增课程列表功能：`loadSessions`、`pickSession`、`onStatusChange`、`toggleFuture`，集成 `admin_list_sessions` 云函数
   - 新增 RPE 芯片选择：`pickRPE`，支持点击选择 1-10 分
   - 新增时间格式化函数：`fmt`，将 ISO 时间格式化为 "YYYY-MM-DD HH:mm"
   - 新增状态文本函数：`statusText`，将状态码转换为中文显示
   - 优化数据结构：添加 `userQ`、`userResults`、`chosenUser`、`statusFilters`、`statusIdx`、`onlyFuture`、`sessions`、`rpeOptions` 等字段
   - 优化提交验证：检查是否选择了课程，提示更友好
   - 优化清空逻辑：提交成功后清空学员和课程选择

3. **report.wxss (v2.2)**
   - 新增 `.sub` 样式：卡片标题样式
   - 新增 `.line` 样式：列表项样式，用于学员列表、课程列表、动作列表
   - 新增 `.uinfo`、`.chosen` 样式：学员信息显示样式
   - 新增 `.sinfo`、`.badge` 样式：课程信息显示样式，支持不同状态的颜色标识
   - 新增 `.rpe`、`.chip` 样式：RPE 芯片选择样式
   - 新增 `.swlabel` 样式：开关标签样式
   - 新增 `.grid`、`.g-item`、`.g-item2` 样式：已选动作编辑表单网格布局
   - 优化 `.row` 样式：支持 flex-wrap，适配多元素布局
   - 优化 `.ipt`、`.picker`、`.btn` 样式：统一视觉风格

**功能说明：**
- 选择学员：输入手机号或姓名关键词搜索，选择后自动加载该学员的课程列表
- 选择课程：支持按状态筛选（全部/待确认/已确认/已完成/已取消）和时间筛选（仅看未开始），选择课程后显示课程ID
- 填写报告：输入扣费金额（默认 100 元）、备注（可选）、RPE（1-10 分，芯片式选择，默认 7 分）
- 搜索动作：支持关键字搜索和肌群筛选，从搜索结果中添加动作
- 编辑动作：可以修改每个动作的组数、次数、重量/时长、备注
- 提交报告：验证表单后提交训练报告并扣费，成功后清空所有选择

**关联文件：**
- 依赖云函数：`admin_search_users`（学员搜索）、`admin_list_sessions`（课程列表）、`catalog_search`（训练目录搜索）、`report_and_deduct`（提交报告并扣费）

**备份文件：**
- `report.wxml.v2.0`（已备份 v2.0 版本）
- `report.js.v2.0`（已备份 v2.0 版本）
- `report.wxss.v2.0`（已备份 v2.0 版本）

---

**更新时间：** 2025-11-06 22:14:06

**版本：** v2.3

**更新内容：**
- 简化状态筛选器选项，从 5 个选项简化为 3 个（待确认或已确认、仅待确认、仅已确认）
- 优化代码风格，使用更紧凑的写法
- 简化状态映射逻辑，使用数组映射替代对象映射
- 优化提交成功后的清空逻辑，保留学员和课程选择
- 简化时间格式化和状态文本函数

**主要改动：**
1. **report.js (v2.3)**
   - 简化状态筛选器：从 `["全部", "待确认", "已确认", "已完成", "已取消"]` 改为 `["待确认或已确认", "仅待确认", "仅已确认"]`
   - 简化状态映射：使用数组 `mapping` 替代对象 `statusFilterMap`，更直观
   - 优化代码风格：使用更紧凑的箭头函数和链式调用
   - 移除自动触发：`onStatusChange` 和 `toggleFuture` 不再自动调用 `loadSessions()`，需要手动点击"刷新"按钮
   - 移除自动搜索：`onMuscleChange` 不再自动触发搜索，需要手动点击"搜索"按钮
   - 简化提交成功提示：从显示余额改为简单的"已提交"
   - 优化清空逻辑：提交成功后只清空 `selected`、`comment`、`sessionId`，保留 `chosenUser` 和 `sessions`
   - 简化 `fmt` 函数：使用更紧凑的写法
   - 简化 `statusText` 函数：只处理 pending、confirmed，其他返回原值

**功能说明：**
- 状态筛选器现在只有 3 个选项，更符合实际使用场景
- 选择状态或切换时间筛选后，需要手动点击"刷新"按钮加载课程列表
- 选择肌群后，需要手动点击"搜索"按钮搜索动作
- 提交成功后保留学员和课程选择，方便连续提交多个报告

**备份文件：**
- `report.js.v2.2`（已备份 v2.2 版本）

---

**更新时间：** 2025-11-06 22:14:54

**版本：** v2.4

**更新内容：**
- 优化样式间距和尺寸，使界面更紧凑
- 优化 badge 颜色方案，使用更现代的配色
- 简化样式规则，提高代码可读性
- 统一输入框和选择器的样式

**主要改动：**
1. **report.wxss (v2.4)**
   - 优化间距：`.title` margin 从 `8rpx 0 18rpx` 改为 `10rpx 0 18rpx`，`.card` padding 从 `24rpx` 改为 `22rpx`，margin-bottom 从 `20rpx` 改为 `18rpx`
   - 优化 `.row`：gap 从 `16rpx` 改为 `12rpx`，移除 `flex-wrap`
   - 统一输入框样式：`.picker` 和 `.ipt` 合并样式规则，padding 从 `16rpx` 改为 `14rpx`
   - 优化 `.ta`：padding 从 `16rpx` 改为 `14rpx`，margin-top 从 `12rpx` 改为 `10rpx`
   - 优化按钮样式：`.btn` padding 从 `16rpx 24rpx` 改为 `14rpx 22rpx`
   - 优化 `.line`：padding 从 `16rpx 0` 改为 `14rpx 0`，border-bottom 颜色从 `#f0f0f0` 改为 `#f5f5f5`
   - 优化 badge 颜色：`.badge.pending` 从 `#fff3cd/#856404` 改为 `#fff6e5/#f59e0b`，`.badge.confirmed` 从 `#d1ecf1/#0c5460` 改为 `#e8f7ef/#10b981`，新增 `.badge.done` 样式 `#eef2ff/#6366f1`
   - 优化 `.sub`：移除 `font-size:28rpx`，只保留 `font-weight:600`
   - 优化 `.sinfo .name`：添加 `display:block`
   - 优化 `.rpe-row`：gap 从 `12rpx` 改为 `10rpx`
   - 优化 `.chip`：padding 从 `12rpx 20rpx` 改为 `10rpx 16rpx`，border-radius 从 `20rpx` 改为 `12rpx`
   - 优化 `.sel`：padding 从 `16rpx` 改为 `14rpx`，margin-top 从 `12rpx` 改为 `10rpx`
   - 优化 `.grid`：gap 从 `12rpx` 改为 `10rpx`，margin-top 从 `12rpx` 改为 `10rpx`
   - 优化 `.g-item` 和 `.g-item2`：gap 从 `12rpx` 改为 `10rpx`，`.g-item2` 移除 `grid-column` 和 `flex-direction:column`
   - 优化 `.chosen`：margin-top 从 `16rpx` 改为 `10rpx`，移除 `padding` 和 `background`，添加 `color:#333`
   - 优化 `.swlabel`：添加 `color:#666`

**功能说明：**
- 界面间距更紧凑，视觉更统一
- badge 颜色更现代，区分度更高
- 样式代码更简洁，易于维护

**备份文件：**
- `report.wxss.v2.2`（已备份 v2.2 版本）

---

## Changelog

### 2025-11-16 19:36:30 CST — 动作选择页 UI 优化 + 扩充预设动作 + 管理员新增动作功能
- **feat(ui)**: 优化动作选择页面布局，将底部按钮收进卡片，优化文本居中和间距
- **feat(cloud)**: 扩充 seed_training_catalog 预设动作，从 5 个增加到 22 个
- **feat(cloud)**: 新增云函数 admin_create_training_action，支持管理员创建自定义动作
- **feat(ui)**: 新增「新增动作」页面，支持管理员创建训练动作
- **变更内容**：
  - **pages/report/actions/index.wxml**：
    - 将底部确定按钮从页面级别移到卡片内部，使整个卡片看起来像一个完整的对话框
    - 在搜索行下方新增「新建动作」按钮入口
  - **pages/report/actions/index.wxss**：
    - 优化页面布局：调整 padding 从 32rpx 改为 24rpx，移除卡片底部预留空间
    - 优化卡片布局：移除固定高度，改为 min-height，底部按钮使用 margin-top
    - 优化文本居中：搜索按钮和底部按钮添加 flex 布局，实现文字水平垂直居中
    - 优化分类项样式：添加 align-items: center 实现垂直居中
    - 新增「新建动作」按钮样式：`.create-row` 和 `.create-btn` 样式
  - **pages/report/actions/index.js**：
    - 新增 `goCreateAction()` 方法：跳转到新增动作页面
    - 新增 `onNewActionCreated()` 方法：新增动作后的回调，刷新列表并保持已选状态
  - **cloudfunctions/seed_training_catalog/index.js**：
    - 扩充预设动作列表：从 5 个增加到 22 个，涵盖胸、背、下肢、后链、核心、肩、臂等肌群
    - 新增动作包括：杠铃卧推、哑铃卧推、上斜哑铃卧推、哑铃飞鸟、杠铃划船、单臂哑铃划船、高位下拉、引体向上、杠铃深蹲、保加利亚分腿蹲、弓步蹲、硬拉、罗马尼亚硬拉、臀桥、平板支撑、悬垂举腿、卷腹、肩上推举、侧平举、哑铃弯举、绳索下压
  - **cloudfunctions/admin_create_training_action/index.js**（新建）：
    - 实现管理员创建训练动作功能：支持创建自定义动作名称、肌群、单位、默认负重
    - 自动生成唯一 code：使用时间戳生成 `C${Date.now()}`
    - 记录创建者信息：保存 createdBy（OPENID）和 createdAt（服务器时间）
    - 支持 tenantId 参数：默认使用 't_default'
  - **cloudfunctions/admin_create_training_action/package.json**（新建）：
    - 云函数依赖配置
  - **pages/report/actions/create/index.wxml**（新建）：
    - 实现新增动作表单：动作名称输入、所属分类选择器、计量单位选择器、默认负重输入
    - 添加保存按钮和提示文字
  - **pages/report/actions/create/index.js**（新建）：
    - 实现表单数据管理：name、groupOptions、groupIndex、unitOptions、unitIndex、defaultLoad
    - 实现输入处理：onNameInput、onGroupChange、onUnitChange、onLoadInput
    - 实现保存功能：调用 admin_create_training_action 云函数，成功后通知上一页刷新
  - **pages/report/actions/create/index.wxss**（新建）：
    - 实现表单样式：卡片式布局，统一的输入框和选择器样式
  - **pages/report/actions/create/index.json**（新建）：
    - 设置导航栏标题为"新增动作"
  - **app.json**：
    - 新增页面路由：`pages/report/actions/create/index`
- **影响范围**：
  - 动作选择页面：UI 更美观，底部按钮收进卡片，文本居中显示
  - 训练动作库：预设动作从 5 个扩充到 22 个，覆盖更多肌群
  - 管理员功能：支持创建自定义训练动作，提升灵活性
- **回滚方案**：
  - 恢复动作选择页：恢复 `index.wxml`、`index.wxss`、`index.js` 到上一个版本
  - 恢复预设动作：恢复 `seed_training_catalog/index.js` 到上一个版本
  - 删除新增功能：删除 `admin_create_training_action` 云函数和 `pages/report/actions/create` 页面
  - 恢复路由：从 `app.json` 中移除 `pages/report/actions/create/index` 路由
- **测试点**：
  - 验证动作选择页布局：底部按钮在卡片内部，文本居中显示
  - 验证预设动作扩充：seed_training_catalog 云函数执行后，动作库包含 22 个动作
  - 验证新建动作入口：点击「新建动作」按钮能正确跳转到新增页面
  - 验证新增动作功能：填写表单后保存，动作能正确添加到动作库
  - 验证列表刷新：新增动作后返回，动作选择页能正确刷新并显示新动作
  - 验证已选状态保持：新增动作后刷新列表，已选动作的选中状态能正确保持

### 2025-11-15 19:40:49 CST — 训练报告页动作选择优化：移除删除全部按钮，新增动作选择页面
- **feat(ui)**: 移除训练报告页的"删除全部"按钮，将已选动作区域改为可点击跳转入口
- **feat(ui)**: 新增动作选择页面，支持左侧分类筛选、右侧动作列表、关键字搜索和多选功能
- **变更内容**：
  - **pages/report/report.wxml**：
    - 移除"删除全部"按钮（如果存在）
    - 将已选动作区域改为可点击跳转：使用 `actions-list` 容器包裹，添加 `bindtap="goSelectActions"`
    - 已选动作项使用 `catchtap="stopPropagation"` 阻止事件冒泡，保留编辑功能
    - 新增空态提示：当没有已选动作时显示"点击此处添加训练动作"
  - **pages/report/report.js**：
    - 新增 `goSelectActions()` 函数：跳转到动作选择页面，使用事件通道传递已选动作
    - 新增 `stopPropagation()` 函数：阻止事件冒泡，避免点击已选动作时触发跳转
    - 优化动作返回处理：保留已存在动作的编辑字段（组数、次数、重量、备注），新动作设置默认值
  - **pages/report/report.wxss**：
    - 新增 `.actions-list` 样式：背景色 #f9fafb，圆角 16rpx，内边距 16rpx，最小高度 120rpx
    - 新增 `.actions-empty` 样式：字体大小 24rpx，颜色 #9ca3af，居中显示，上下内边距 40rpx
  - **app.json**：
    - 新增页面路由：`pages/report/actions/index`
  - **pages/report/actions/index.wxml**（新建）：
    - 实现左侧分类列表：使用 `scroll-view` 展示肌群分类，支持点击切换
    - 实现右侧动作列表：显示动作名称和肌群，支持关键字搜索和多选
    - 实现底部确定按钮：显示已选动作数量，点击返回上一页
  - **pages/report/actions/index.js**（新建）：
    - 实现动作列表加载：调用 `catalog_search` 云函数获取所有动作
    - 实现分类筛选：根据选中的肌群分类过滤动作列表
    - 实现关键字搜索：支持按动作名称模糊搜索
    - 实现多选功能：点击动作切换选中状态，使用 `_selected` 字段标记
    - 实现事件通道通信：接收上一页已选动作，返回时传递新选动作
  - **pages/report/actions/index.wxss**（新建）：
    - 实现双栏布局：左侧分类面板 200rpx 宽，右侧动作列表自适应
    - 实现搜索栏样式：圆角输入框和搜索按钮
    - 实现动作行样式：显示动作名称、肌群和选中状态
    - 实现底部固定按钮：固定在页面底部，绿色主题
  - **pages/report/actions/index.json**（新建）：
    - 设置导航栏标题为"选择训练动作"
- **影响范围**：
  - 管理端训练报告页：已选动作区域现在可以点击跳转到选择页面，操作更便捷
  - 新增动作选择页面：提供更专业的动作选择界面，支持分类筛选和搜索
  - 用户体验：移除删除全部按钮，简化操作流程；新增专门的选择页面，提升选择效率
- **回滚方案**：
  - 恢复 `report.wxml`：移除 `actions-list` 容器和跳转事件，恢复原有结构
  - 恢复 `report.js`：删除 `goSelectActions()` 和 `stopPropagation()` 函数
  - 恢复 `report.wxss`：删除 `.actions-list` 和 `.actions-empty` 样式
  - 删除动作选择页面：删除 `pages/report/actions/` 目录
  - 恢复 `app.json`：移除 `pages/report/actions/index` 路由
- **测试点**：
  - 验证跳转功能：点击已选动作区域（空白处）能正确跳转到动作选择页面
  - 验证事件冒泡：点击已选动作项内的编辑元素不会触发跳转
  - 验证空态显示：没有已选动作时显示"点击此处添加训练动作"提示
  - 验证动作加载：动作选择页面能正确加载所有动作列表
  - 验证分类筛选：点击左侧分类能正确过滤右侧动作列表
  - 验证关键字搜索：输入关键字能正确搜索动作名称
  - 验证多选功能：点击动作能切换选中状态，选中状态正确显示
  - 验证已选状态：从上一页传入的已选动作能正确标记为选中
  - 验证返回功能：点击确定按钮能正确返回上一页并更新已选动作
  - 验证数据保留：返回时已存在动作的编辑字段（组数、次数、重量、备注）能正确保留

### 2025-11-15 19:36:26 CST — 训练报告页课程列表增加日期和时间显示
- **feat(ui)**: 在训练报告页的课程列表中展示日期和时间，提升信息可读性
- **变更内容**：
  - **pages/report/report.js**：
    - 在 `loadSessions()` 函数中添加日期和时间格式化逻辑
    - 新增 `fmtDate()` 函数：将 ISO 格式日期格式化为 "YYYY-MM-DD"
    - 新增 `fmtHM()` 函数：将 ISO 格式时间格式化为 "HH:mm"
    - 对返回的课程列表进行增强处理，为每条课程添加 `_dateStr` 和 `_timeRange` 字段
  - **pages/report/report.wxml**：
    - 在课程标题下方新增日期和时间显示区域
    - 使用 `session-meta` 容器包裹日期和时间信息
    - 日期显示为 `{{item._dateStr}}`，时间范围显示为 `{{item._timeRange}}`
  - **pages/report/report.wxss**：
    - 新增 `.session-meta` 样式：字体大小 22rpx，颜色 #6b7280，上边距 4rpx
    - 新增 `.session-date` 样式：右边距 12rpx
    - 新增 `.session-time` 样式：颜色 #4b5563
- **影响范围**：
  - 管理端训练报告页：课程列表现在显示日期和时间信息，信息更完整
  - 用户体验：管理员可以更直观地看到每个课程的具体日期和时间段
- **回滚方案**：
  - 恢复 `report.js`：移除 `loadSessions()` 中的格式化逻辑，恢复为直接使用 `list`
  - 恢复 `report.wxml`：移除 `session-meta` 区域，恢复为仅显示标题
  - 恢复 `report.wxss`：删除 `.session-meta`、`.session-date`、`.session-time` 样式
- **测试点**：
  - 验证日期格式化：课程列表中的日期显示为 "YYYY-MM-DD" 格式
  - 验证时间格式化：课程列表中的时间范围显示为 "HH:mm~HH:mm" 格式
  - 验证样式显示：日期和时间信息正确显示在课程标题下方
  - 验证空值处理：当 `startAt` 或 `endAt` 为空时，日期和时间显示为空字符串

### 2025-11-15 19:27:06 CST — 课程表页面样式优化：放大周范围和日期标签字号与点击区域
- **feat(ui)**: 优化课程表页面周视图样式，放大字号和点击区域，提升可读性和操作体验
- **变更内容**：
  - **pages/sessions/overview/index.wxss**：
    - 放大标题字号：`.card-title` 字体大小从 32rpx 改为 34rpx，margin-bottom 从 16rpx 改为 18rpx
    - 增大周范围区域：`.week-range` margin-bottom 从 12rpx 改为 20rpx，拉开和日期行的距离
    - 增大周范围点击区域：`.week-range-inner` padding 从 10rpx 20rpx 改为 14rpx 24rpx
    - 放大周范围文字：`.week-range-label` 字体大小从 24rpx 改为 26rpx，`.week-range-arrow` 从 22rpx 改为 24rpx
    - 增大日期行间距：`.week-days` margin-bottom 从 16rpx 改为 20rpx，和下面工具栏拉开一点
    - 增大日期标签尺寸：`.day` width 从 70rpx 改为 82rpx，padding 从 4rpx 0 改为 8rpx 0，点击区域更宽更高
    - 放大日期标签文字：`.day-label` 字体大小从 20rpx 改为 22rpx，`.day-num` 从 22rpx 改为 26rpx
- **影响范围**：
  - 管理端课程表页面：周视图区域字号更大，点击区域更大，操作更便捷
  - 用户体验：文字更清晰易读，点击操作更准确，减少误触
- **回滚方案**：
  - 恢复样式文件：恢复 `overview/index.wxss.v1.2` 文件为 `overview/index.wxss`
- **备份文件**：
  - `overview/index.wxss.v1.2`（已备份 v1.2 版本）
- **测试点**：
  - 验证标题字号：标题文字显示为 34rpx
  - 验证周范围区域：周范围行与日期行间距为 20rpx，点击区域 padding 为 14rpx 24rpx
  - 验证周范围文字：周范围标签和箭头字号分别为 26rpx 和 24rpx
  - 验证日期标签尺寸：每个日期标签宽度为 82rpx，padding 为 8rpx 0
  - 验证日期标签文字：日期标签和数字字号分别为 22rpx 和 26rpx
  - 验证日期行间距：日期行与工具栏间距为 20rpx

### 2025-11-15 18:32:22 CST — 课程表页面 UI 优化：精简标题区域 + 下拉筛选按钮
- **feat(ui)**: 精简课程表页面标题区域，移除状态筛选按钮组，改为下拉选择器
- **feat(ui)**: 优化工具栏布局，状态筛选和刷新按钮并排显示
- **feat(ui)**: 优化样式间距和配色，提升视觉呼吸感
- **变更内容**：
  - **pages/sessions/overview/index.wxml**：
    - 移除状态筛选按钮组：删除原有的"全部/待确认/已确认/已完成"四个按钮
    - 新增下拉筛选按钮：使用 `wx.showActionSheet` 实现状态筛选，按钮显示当前选中状态
    - 优化工具栏布局：状态筛选按钮和刷新按钮并排显示，使用 `toolbar` 容器
    - 保持原有功能：周视图导航、日期选择、时间轴展示等功能不变
  - **pages/sessions/overview/index.js**：
    - 新增 `statusLabel` 数据字段：存储当前选中状态的显示文本（如"全部"、"待确认"等）
    - 新增 `onOpenStatusSheet()` 方法：打开状态筛选 ActionSheet，支持选择全部/待确认/已确认/已完成
    - 优化状态筛选逻辑：选择状态后更新 `status` 和 `statusLabel`，并自动刷新课程列表
    - 保留原有功能：周视图导航、日期选择、课程列表加载等功能不变
  - **pages/sessions/overview/index.wxss**：
    - 新增工具栏样式：`.toolbar`、`.toolbar-btn`、`.toolbar-btn--secondary` 等样式
    - 优化周视图按钮样式：`.week-arrow` 使用圆角背景，提升视觉统一性
    - 优化间距：调整标题、工具栏、时间轴等区域的间距，提升呼吸感
    - 优化配色：统一使用灰色系（#f3f4f6、#e5e7eb、#6b7280 等），提升视觉层次
    - 优化状态标签样式：保持原有的颜色方案（待确认橙色、已确认绿色、已完成紫色）
- **影响范围**：
  - 管理端课程表页面：状态筛选交互更简洁，界面更清爽
  - 用户体验：下拉选择器减少界面占用空间，工具栏布局更紧凑
- **回滚方案**：
  - 恢复课程表页面：恢复 `overview/index.js.v1.0`、`overview/index.wxml.v1.0`、`overview/index.wxss.v1.0` 文件
- **备份文件**：
  - `overview/index.js.v1.0`（已备份 v1.0 版本）
  - `overview/index.wxml.v1.0`（已备份 v1.0 版本）
  - `overview/index.wxss.v1.0`（已备份 v1.0 版本）
- **测试点**：
  - 验证状态筛选下拉选择器：点击"状态：xxx"按钮能打开 ActionSheet
  - 验证状态选择：选择不同状态后，按钮文本和课程列表能正确更新
  - 验证刷新按钮：点击刷新按钮能重新加载课程列表
  - 验证工具栏布局：状态筛选和刷新按钮并排显示，样式统一
  - 验证样式间距：各区域间距合理，视觉呼吸感良好
  - 验证周视图导航：左右切换周、选择日期等功能正常

### 2025-11-15 18:14:43 CST — 课程表时间轴布局 + 首页按钮颜色优化
- **feat(ui)**: 课程表页面改为「一周导航 + 单日时间轴（三段）」布局
- **feat(ui)**: 首页"课程管理"按钮改为深色背景+白字，提升视觉对比度
- **变更内容**：
  - **pages/sessions/overview/index.js**：
    - 新增 `buildSegmentsForDay()` 函数：将课程列表按小时分组到"上午/下午/晚上"三段
    - 新增 `segments` 数据字段：存储处理后的时间段分组和时间槽数据
    - 新增 `timeConfig` 配置：定义时间范围（9-21点）和分段规则（上午9-12、下午12-18、晚上18-21）
    - 优化 `refresh()` 方法：调用 `buildSegmentsForDay()` 生成时间轴数据，替代原有的简单列表展示
    - 保留原有功能：周视图导航、日期选择、状态筛选等功能不变
  - **pages/sessions/overview/index.wxml**：
    - 移除简单列表展示：删除原有的 `.row` 列表布局
    - 新增时间轴布局：按"上午/下午/晚上"三段展示，每段内按小时显示时间槽（09:00、10:00...20:00）
    - 时间槽展示：每个时间槽显示该时间段内的所有课程，无课程时显示"无课程"
    - 课程卡片：显示时间范围、状态标签、课程标题、学员姓名和手机号
    - 保持原有功能：周视图导航、状态筛选、刷新按钮等功能不变
  - **pages/sessions/overview/index.wxss**：
    - 新增时间轴样式：`.segment`、`.segment-title`、`.slot-row`、`.slot-time`、`.slot-courses` 等
    - 新增课程卡片样式：`.course`、`.course--empty`、`.course-line`、`.course-time`、`.course-status` 等
    - 优化间距：调整各元素间距，避免拥挤，提升可读性
    - 优化状态标签样式：保持原有的颜色方案（待确认橙色、已确认绿色、已完成紫色）
    - 优化周视图按钮尺寸：`.week-btn` 从 60rpx 改为 56rpx，更紧凑
  - **pages/home/index.wxss**：
    - 修改"课程管理"按钮样式：从白底（#ffffff）+ 深色字（#111827）改为深色底（#111827）+ 白字（#ffffff）
    - 提升视觉对比度：在白色卡片背景下，深色按钮更醒目，填充感更强
- **影响范围**：
  - 管理端课程表页面：从简单列表改为时间轴布局，更直观地展示一天的课程安排
  - 管理端首页：课程管理按钮视觉更突出，与其他按钮风格统一
  - 用户体验：时间轴布局更符合日历类应用的视觉习惯，便于快速查看某个时间段的课程
- **回滚方案**：
  - 恢复课程表页面：恢复 `overview/index.js`、`overview/index.wxml`、`overview/index.wxss` 到使用简单列表的版本
  - 恢复首页按钮样式：恢复 `home/index.wxss` 中的 `.home-btn--sessions` 样式为白底深字
- **测试点**：
  - 验证时间轴布局：能正确显示"上午/下午/晚上"三段，每段内按小时显示时间槽
  - 验证课程分组：课程能正确按开始小时分组到对应的时间槽
  - 验证空状态：无课程的时间槽显示"无课程"
  - 验证课程卡片：点击课程卡片能正确跳转到详情页
  - 验证状态筛选：选择不同状态能正确筛选并更新时间轴显示
  - 验证周视图导航：左右切换周、选择日期等功能正常
  - 验证首页按钮：课程管理按钮显示为深色背景+白字

### 2025-11-15 17:41:59 CST — user 端个人信息页 + 课程表周视图
- **feat(ui)**: 新增 user 端"我的信息"页面，支持查看个人信息和余额
- **feat(cloud)**: 新增云函数 `user_get_profile`，从 users 和 wallets 表读取用户信息
- **feat(ui)**: 课程表页面改为周视图，支持左右切换周和日期选择
- **变更内容**：
  - **user/pages/profile/index.wxml**（新建）：
    - 实现个人信息展示：姓名、性别、身高、体重、体脂率、手机号、次数余额、金额余额
    - 使用只读展示，数据从云函数获取
  - **user/pages/profile/index.js**（新建）：
    - 实现数据加载：调用 `user_get_profile` 云函数获取用户和钱包信息
    - 实现性别文本转换：male→男、female→女、其他→未设置
    - 页面显示时自动刷新数据（`onShow` 钩子）
  - **user/pages/profile/index.wxss**（新建）：
    - 实现卡片式布局：白色背景、圆角、阴影
    - 信息行样式：左右对齐，标签灰色、值黑色
  - **user/pages/profile/index.json**（新建）：
    - 设置导航栏标题为"我的信息"
  - **user/app.json**：
    - 在 pages 数组中新增 `pages/profile/index` 页面注册
  - **user/cloudfunctions/user_get_profile/index.js**（新建）：
    - 从 openid 查找用户：查询 users 表，使用 OPENID 匹配
    - 查询钱包信息：从 wallets 表获取余额，不存在则返回默认值 0
    - 返回用户和钱包信息
  - **user/cloudfunctions/user_get_profile/package.json**（新建）：
    - 云函数依赖配置
  - **admin/pages/sessions/overview/index.wxml**：
    - 移除日期选择器（picker），改为周视图选择器
    - 新增周视图头部：左右切换按钮 + 一周七天日期卡片
    - 日期卡片显示：周几标签 + 日期数字，支持选中和今天高亮
    - 保持状态筛选和课程列表功能不变
  - **admin/pages/sessions/overview/index.js**：
    - 新增周视图逻辑：`getMonday()` 计算周一日期，`buildWeek()` 构建一周七天数据
    - 新增日期选择：`onPickDate()` 选择某天并刷新课程列表
    - 新增周切换：`prevWeek()` 和 `nextWeek()` 切换上一周/下一周
    - 优化初始化：页面加载时自动选中今天，构建本周视图
    - 保持状态筛选和课程列表功能不变
  - **admin/pages/sessions/overview/index.wxss**：
    - 新增周视图样式：`.week-header`、`.week-btn`、`.week-days`、`.day` 等
    - 日期卡片样式：选中状态（深色背景+白字）、今天标记（绿色边框）
    - 优化状态筛选和刷新按钮样式
- **影响范围**：
  - user 端：新增个人信息查看功能，用户可以看到自己的档案和余额信息
  - admin 端课程表：从单日选择改为周视图，提升用户体验
  - 数据同步：user 端和 admin 端共享 users 和 wallets 表，数据实时同步
- **回滚方案**：
  - 删除 user 端 profile 页面：删除 `pages/profile/` 目录，从 `app.json` 中移除页面注册
  - 删除云函数：删除 `user_get_profile` 云函数目录
  - 恢复课程表页面：恢复 `overview/index.*` 文件到使用日期选择器的版本
- **测试点**：
  - 验证 user 端个人信息页：能正确显示姓名、性别、身高、体重、体脂率、手机号、次数余额、金额余额
  - 验证数据同步：admin 端修改学员信息后，user 端能看到最新数据
  - 验证周视图：能正确显示本周七天，今天有绿色边框标记
  - 验证日期选择：点击某天能选中并刷新该天的课程列表
  - 验证周切换：点击左右箭头能切换到上一周/下一周
  - 验证状态筛选：选择不同状态能正确筛选课程
  - 验证课程列表：选中日期后能正确显示该天的课程

### 2025-11-15 17:17:48 CST — 首页按钮颜色优化 + 学员详情页功能
- **feat(ui)**: 优化首页按钮文字颜色，确保文字与背景对比度清晰
- **feat(ui)**: 新增学员详情页，支持查看和编辑学员档案信息
- **feat(cloud)**: 新增云函数 `admin_get_user_detail` 和 `admin_update_user_detail`
- **变更内容**：
  - **pages/home/index.wxml**：
    - 为三个按钮添加语义化 class：`home-btn--sessions`、`home-btn--overview`、`home-btn--users`
    - 移除 `type="default"` 属性，使用自定义样式
  - **pages/home/index.wxss**：
    - 重构按钮样式：使用语义化 class 替代 `:nth-child()` 选择器
    - 课程管理按钮：白底（#ffffff）+ 深色字（#111827）
    - 课程表按钮：深灰底（#374151）+ 白字（#ffffff）
    - 学员管理按钮：绿色底（#059669）+ 白字（#ffffff）
  - **pages/users/index.wxml**：
    - 为列表项添加点击事件：`bindtap="goDetail"` 和 `data-id="{{item.userId}}"`
  - **pages/users/index.js**：
    - 新增 `goDetail()` 方法：点击学员卡片跳转到详情页
  - **pages/users/detail/index.wxml**（新建）：
    - 实现学员信息表单：姓名、性别、身高、体重、体脂率、手机号、次数余额、金额余额
    - 性别使用 picker 选择器（未设置/男/女）
    - 数字字段使用 `type="digit"` 输入框
    - 底部保存按钮
  - **pages/users/detail/index.js**（新建）：
    - 实现数据加载：调用 `admin_get_user_detail` 云函数获取学员和钱包信息
    - 实现表单编辑：`onInput()` 处理输入，`onGenderChange()` 处理性别选择
    - 实现数据保存：调用 `admin_update_user_detail` 云函数更新数据
    - 支持 users 表和 wallets 表的数据同步更新
  - **pages/users/detail/index.wxss**（新建）：
    - 实现卡片式布局：白色背景、圆角、阴影
    - 表单样式：统一的输入框和选择器样式
    - 保存按钮：绿色主题色，占满宽度
  - **pages/users/detail/index.json**（新建）：
    - 设置导航栏标题为"学员详情"
  - **app.json**：
    - 在 pages 数组中新增 `pages/users/detail/index` 页面注册
  - **cloudfunctions/admin_get_user_detail/index.js**（新建）：
    - 查询 users 表：支持通过 userId 或 _id 查找学员
    - 查询 wallets 表：获取学员的钱包余额，不存在则返回默认值 0
    - 返回学员和钱包信息
  - **cloudfunctions/admin_get_user_detail/package.json**（新建）：
    - 云函数依赖配置
  - **cloudfunctions/admin_update_user_detail/index.js**（新建）：
    - 更新 users 表：支持更新 nickname、gender、heightCm、weightKg、bodyFat、phone、timesBalance
    - 更新 wallets 表：支持更新 balance，不存在则自动创建钱包记录
    - 数字字段自动转换：空字符串转为 null，非法数字转为 null
    - 保持 tenantId 一致性：钱包创建时使用学员的 tenantId
- **影响范围**：
  - 管理端首页：按钮颜色更清晰，提升可读性
  - 管理端学员列表页：支持点击跳转到详情页
  - 管理端学员详情页：支持查看和编辑学员档案，包括身体数据和余额信息
  - 数据结构统一：admin 和 user 端共享 users 和 wallets 表，数据同步更新
- **回滚方案**：
  - 恢复首页按钮样式：恢复 `index.wxml` 和 `index.wxss` 到使用 `:nth-child()` 的版本
  - 删除学员详情页：删除 `pages/users/detail/` 目录，从 `app.json` 中移除页面注册
  - 删除云函数：删除 `admin_get_user_detail` 和 `admin_update_user_detail` 云函数目录
  - 恢复学员列表页：移除 `goDetail()` 方法和点击事件
- **测试点**：
  - 验证首页按钮颜色：课程管理（白底深字）、课程表（深灰底白字）、学员管理（绿色底白字）
  - 验证学员列表页点击跳转：点击学员卡片能正确跳转到详情页
  - 验证学员详情页加载：能正确显示学员信息和钱包余额
  - 验证表单编辑：修改姓名、性别、身高、体重、体脂率、手机号、次数余额、金额余额后保存
  - 验证数据同步：admin 端修改后，user 端能看到最新数据
  - 验证数字字段处理：空值和非法值正确处理
  - 验证钱包创建：学员没有钱包记录时，保存金额余额会自动创建钱包

### 2025-11-15 12:01:13 — 用户端云函数优化：日期处理与权限校验
- **refactor(cloud)**: 优化用户端云函数的日期处理逻辑，移除不必要的 Date 转换；增强 user_get_report 权限校验
- **变更内容**：
  - **user_list_pending_sessions (v1.3)**：
    - 优化日期处理：移除 `new Date().toISOString()` 转换，直接使用传入的 ISO 格式日期字符串
    - 优化代码结构：使用更清晰的变量命名和注释
    - 保持功能不变：支持关键字搜索、日期范围筛选、includeConfirmed 参数
  - **user_list_confirmed_sessions (v1.2)**：
    - 优化日期处理：移除 `new Date().toISOString()` 转换，直接使用传入的 ISO 格式日期字符串
    - 优化代码结构：使用更清晰的变量命名和注释
    - 保持功能不变：支持关键字搜索、日期范围筛选
  - **user_list_reports (v1.2)**：
    - 优化日期处理：移除 `new Date().toISOString()` 转换，直接使用传入的 ISO 格式日期字符串
    - 优化代码结构：使用更清晰的变量命名和注释，优化分页查询逻辑
    - 保持功能不变：支持关键字搜索、创建日期范围筛选、分页查询
  - **user_get_report (v1.1)**：
    - 新增用户权限校验：只允许用户获取属于自己的报告，防止越权访问
    - 新增用户查找逻辑：从 openid 映射 userId，确保权限校验准确
    - 优化错误处理：用户不存在或报告不属于当前用户时抛出明确错误
- **影响范围**：
  - 用户端课程列表查询：日期参数处理更直接，减少不必要的转换
  - 用户端报告列表查询：日期参数处理更直接，减少不必要的转换
  - 用户端报告详情查询：新增权限校验，确保数据安全
- **回滚方案**：
  - user_list_pending_sessions：恢复 `index.js.v1.2` 文件，重新部署云函数
  - user_list_confirmed_sessions：恢复 `index.js.v1.1` 文件，重新部署云函数
  - user_list_reports：恢复 `index.js.v1.1` 文件，重新部署云函数
  - user_get_report：恢复 `index.js.v1.0` 文件，重新部署云函数
- **备份文件**：
  - `user_list_pending_sessions/index.js.v1.2`（已备份 v1.2 版本）
  - `user_list_confirmed_sessions/index.js.v1.1`（已备份 v1.1 版本）
  - `user_list_reports/index.js.v1.1`（已备份 v1.1 版本）
  - `user_get_report/index.js.v1.0`（已备份 v1.0 版本）
- **测试点**：
  - 验证日期范围筛选功能正常（传入 ISO 格式日期字符串）
  - 验证关键字搜索功能正常
  - 验证 user_get_report 权限校验：只能获取自己的报告，无法获取他人的报告
  - 验证用户不存在时的错误处理

### 2025-11-15 11:47:22 — 课程列表和详情页文案与布局优化
- **refactor(ui)**: 优化课程列表页按钮文案，合并课程详情页布局，精简操作按钮文案
- **变更内容**：
  - **pages/sessions/index.wxml**：
    - 修改创建按钮文案：从"创建待确认课程"改为"创建课程"，简化按钮文字
  - **pages/sessions/detail/index.wxml**：
    - 合并课程信息和时间编辑：将原本分离的"课程信息"和"上课时间"两个 section 合并为一个 section
    - 优化时间编辑布局：在合并后的 section 中，时间编辑字段使用 `row-gap` 类增加间距，提升可读性
    - 精简操作按钮文案：将"编辑该课程的训练报告"改为"编辑报告"，"查看训练报告"改为"查看报告"
    - 保持功能不变：所有 JS 方法（saveTime、goEditReport、goViewReport、deleteSession）保持不变
  - **pages/sessions/detail/index.wxss**：
    - 优化页面底部间距：添加 `padding-bottom: 40rpx`，避免底部太空
    - 优化 section 间距：将 `margin` 从 `20rpx` 改为 `16rpx 20rpx`，稍微减小垂直间距
    - 新增 `row-gap` 样式：为时间编辑字段增加间距，提升视觉层次
    - 优化按钮间距：将 `.btn-primary` 的 `margin-top` 从 `12rpx` 改为 `20rpx`，与操作区按钮保持一致
- **影响范围**：
  - 管理端课程列表页：创建按钮文案更简洁
  - 管理端课程详情页：布局更紧凑，信息更集中，操作更直观
- **回滚方案**：
  - 恢复 `pages/sessions/index.wxml` 中的按钮文案为"创建待确认课程"
  - 恢复 `pages/sessions/detail/index.wxml` 为两个独立的 section（课程信息和上课时间）
  - 恢复 `pages/sessions/detail/index.wxss` 的原始间距设置
- **测试点**：
  - 验证创建按钮文案显示为"创建课程"
  - 验证课程详情页布局：课程信息和时间编辑在同一卡片中
  - 验证操作按钮文案：显示"编辑报告"或"查看报告"
  - 验证时间编辑功能正常：保存时间修改功能不受影响
  - 验证操作功能正常：编辑报告、查看报告、删除课程功能不受影响

### 2025-11-15 11:40:53 — 课程详情页增加改时间和删课程功能
- **feat(cloud)**: 新增云函数 `admin_update_session`（更新课程时间）和 `admin_delete_session`（删除课程）
- **feat(ui)**: 课程详情页增加时间编辑区和删除按钮
- **变更内容**：
  - **云函数 admin_update_session**：
    - 支持更新课程的开始时间和结束时间
    - 时间格式统一转换为 ISO 格式存储
    - 参数校验：必填 sessionId、startAt、endAt
    - 错误处理：缺少参数或非法时间时抛出明确错误
  - **云函数 admin_delete_session**：
    - 支持删除课程（硬删除，直接移除文档）
    - 参数校验：必填 sessionId
    - 错误处理：缺少 sessionId 时抛出明确错误
    - 注意：当前为简单版本，如需软删除可改为 `status: 'canceled'`
  - **pages/sessions/detail/index.wxml**：
    - 新增时间编辑区域：包含开始日期、开始时间、结束日期、结束时间四个 picker 组件
    - 新增"保存时间修改"按钮：点击后调用云函数更新课程时间
    - 新增"删除课程"按钮：点击后弹出确认对话框，确认后删除课程
    - 优化课程信息展示：移除原有的"上课时间"行，改为独立的时间编辑区
  - **pages/sessions/detail/index.js**：
    - 新增时间解析函数：`parseISO()` 将 ISO 格式时间解析为日期和时间字符串
    - 新增时间编辑字段：`startDate`、`startTime`、`endDate`、`endTime`
    - 新增 picker 事件处理：`onStartDate()`、`onStartTime()`、`onEndDate()`、`onEndTime()`
    - 新增保存时间功能：`saveTime()` 调用 `admin_update_session` 云函数更新课程时间
    - 新增删除课程功能：`deleteSession()` 弹出确认对话框，确认后调用 `admin_delete_session` 云函数
    - 优化页面初始化：从 URL 参数解析时间并填充到 picker 组件
    - 删除后自动返回上一页并刷新列表（调用上一页的 `fetch()` 方法）
  - **pages/sessions/detail/index.wxss**：
    - 新增 `.value-clickable` 样式：可点击的时间选择器样式（蓝色文字）
    - 新增 `.btn-danger` 样式：删除按钮样式（红色背景，白色文字）
- **影响范围**：
  - 管理端课程详情页：管理员可以修改课程时间或删除课程
  - 课程列表页：删除课程后自动刷新列表
  - 数据库：sessions 集合的时间字段可能被更新，文档可能被删除
- **回滚方案**：
  - 删除云函数：在微信开发者工具中删除 `admin_update_session` 和 `admin_delete_session` 云函数
  - 恢复页面文件：恢复 `index.js.v1.0` 文件，删除时间编辑区和删除按钮
- **备份文件**：
  - `pages/sessions/detail/index.js.v1.0`（已备份 v1.0 版本）
- **测试点**：
  - 验证时间编辑功能：选择日期和时间后点击保存，验证课程时间是否更新
  - 验证删除功能：点击删除按钮，确认后验证课程是否被删除
  - 验证删除后返回：删除成功后验证是否返回上一页并刷新列表
  - 验证时间格式：验证 ISO 格式时间是否正确解析为日期和时间字符串
  - 验证错误处理：缺少参数或非法时间时是否显示错误提示

### 2025-11-15 11:38:24 — admin_create_session v1.3 & admin_list_sessions v1.2
- **feat(cloud)**: 创建课程时写入 userPhone，列表查询优先使用 sessions.userPhone
- **变更内容**：
  - **admin_create_session (v1.3)**：
    - 创建课程时自动写入 userPhone：从 users 表查询学员的 phone 字段，冗余存储到 sessions 文档
    - 优化用户查询逻辑：同时查询 tenantId 和 phone 字段，确保数据完整性
    - 增强错误处理：学员不存在时抛出明确的错误提示 "admin_create_session: 未找到该学员"
  - **admin_list_sessions (v1.2)**：
    - 优先使用 sessions.userPhone：新课程直接返回冗余的手机号字段，提升查询性能
    - 兜底查询优化：只为缺少 userPhone 的旧数据批量查询 users 表，避免不必要的数据库查询
    - 返回字段优化：在 field 查询中明确包含 userPhone 字段
- **影响范围**：
  - 新创建的课程：sessions 文档中直接包含 userPhone 字段，列表和详情都可以直接用
  - 旧课程数据：第一次查询时云函数自动补全手机号，前端仍然能看到手机号
  - 查询性能：减少数据库查询次数，提升列表加载速度
- **回滚方案**：
  - admin_create_session：恢复 `index.js.v1.2` 文件，重新部署云函数
  - admin_list_sessions：恢复 `index.js.v1.1` 文件，重新部署云函数
- **备份文件**：
  - `admin_create_session/index.js.v1.2`（已备份 v1.2 版本）
  - `admin_list_sessions/index.js.v1.1`（已备份 v1.1 版本）
- **测试点**：
  - 验证创建课程时 sessions 文档包含 userPhone 字段
  - 验证列表查询新课程直接返回 userPhone（无需查询 users 表）
  - 验证列表查询旧课程能自动补全 userPhone（兜底查询 users 表）
  - 验证关键字搜索仍支持手机号搜索
  - 验证日期范围筛选功能正常

### 2025-11-15 11:30:15 — 新增课程详情页
- **feat(ui)**: 新增课程详情页，支持查看课程信息和跳转到训练报告页
- **变更内容**：
  - **app.json**：
    - 在 pages 数组中新增 `pages/sessions/detail/index` 页面注册
  - **pages/sessions/detail/index.json**：
    - 设置导航栏标题为"课程详情"
  - **pages/sessions/detail/index.wxml**：
    - 实现课程信息展示区域：显示课程标题、上课时间、学员手机号、课程状态
    - 实现操作区域：根据课程状态显示"编辑该课程的训练报告"或"查看训练报告"按钮
  - **pages/sessions/detail/index.js**：
    - 实现页面数据初始化：从 URL 参数中读取 id、title、status、start、end、phone
    - 实现状态映射函数：`mapStatus()` 将状态码转换为中文显示
    - 实现跳转功能：`goEditReport()` 跳转到报告页编辑模式，`goViewReport()` 跳转到报告页查看模式
    - 参数传递：将 sessionId 和 phone 传递给报告页，便于后续自动选中
  - **pages/sessions/detail/index.wxss**：
    - 实现页面样式：卡片式布局，统一的间距和颜色方案
    - 实现按钮样式：绿色主题按钮，适配不同状态显示
- **影响范围**：
  - 管理端课程列表页：点击课程卡片可跳转到详情页
  - 训练报告页：从详情页跳转时自动传递 sessionId 和 phone 参数
- **回滚方案**：
  - 删除 `pages/sessions/detail/` 目录
  - 从 `app.json` 中移除 `pages/sessions/detail/index` 页面注册
  - 恢复 `pages/sessions/index.js` 中的 `goDetail()` 方法（如已修改）
- **测试点**：
  - 验证从课程列表页点击课程卡片能正确跳转到详情页
  - 验证详情页能正确显示课程信息（标题、时间、手机号、状态）
  - 验证状态映射正确（pending→待确认、confirmed→已确认、done→已完成）
  - 验证"编辑该课程的训练报告"按钮跳转到报告页并传递参数
  - 验证"查看训练报告"按钮跳转到报告页查看模式并传递参数
  - 验证 URL 参数编码/解码正确（title、start、end 使用 encodeURIComponent/decodeURIComponent）

### 2025-11-15 11:28:01 — admin_list_sessions v1.1 + sessions 页面优化
- **feat(cloud)**: 云函数补上学员手机号映射，优化查询性能
- **feat(ui)**: 课程列表页优化：放大状态按钮、展示手机号、点击进入详情
- **变更内容**：
  - **cloudfunctions/admin_list_sessions/index.js**：
    - 优化时间条件构建逻辑：直接使用 `_.gte()` 和 `_.lte()`，移除 Date 转换
    - 新增手机号映射逻辑：一次性查询所有涉及的用户手机号，避免循环查询
    - 返回结果附加 `userPhone` 字段：每个课程卡片包含学员手机号
    - 保持原有功能：关键字搜索（title/手机号/昵称）、状态筛选、日期范围筛选
  - **pages/sessions/index.wxml**：
    - 状态筛选按钮优化：从小芯片改为占满一行的四个大按钮（全部/待确认/已确认/已完成）
    - 课程卡片优化：添加 `bindtap="goDetail"` 点击事件，传递课程详情参数
    - 显示学员手机号：将"学员ID"改为"学员手机号：{{item.userPhone || '未绑定'}}"
  - **pages/sessions/index.js**：
    - 新增 `goDetail()` 方法：点击课程卡片跳转到详情页，传递 id、title、status、start、end、phone 参数
  - **pages/sessions/index.wxss**：
    - 新增 `.status-row` 和 `.status-btn` 样式：四宫格大按钮布局
    - 优化按钮样式：增大 padding、字体大小，添加激活状态样式
    - 课程卡片添加 `cursor: pointer` 样式提示可点击
- **影响范围**：
  - 管理端课程列表页：状态筛选按钮更易操作，可直接查看学员手机号
  - 云函数性能优化：减少数据库查询次数，提升列表加载速度
  - 课程详情页跳转：为后续详情页开发提供数据传递基础
- **回滚方案**：
  - 云函数：恢复 `index.js.v1.1` 文件，重新部署云函数
  - 页面文件：恢复之前的版本（但当前版本为首次完整实现）
- **备份文件**：
  - `cloudfunctions/admin_list_sessions/index.js.v1.1`（已备份 v1.1 版本）
- **测试点**：
  - 验证云函数返回结果包含 `userPhone` 字段
  - 验证状态按钮样式和交互（四宫格大按钮）
  - 验证课程卡片显示学员手机号
  - 验证点击课程卡片跳转到详情页（需先创建详情页）
  - 验证关键字搜索仍支持手机号搜索
  - 验证日期范围筛选功能正常

### 2025-11-15 11:18:06 — sessions 课程列表页完整实现
- **feat(ui)**: 完整实现课程列表页，包含筛选、搜索和创建课程功能
- **变更内容**：
  - **pages/sessions/index.json**：
    - 设置导航栏标题为"课程管理"
  - **pages/sessions/index.wxml**：
    - 完整实现课程列表页 UI，参照 report 页的卡片风格
    - 顶部筛选区域：关键字搜索输入框（手机号/姓名/课程标题）
    - 状态筛选芯片：全部/待确认/已确认/已完成
    - 日期范围选择器：开始日期和结束日期
    - 操作按钮：刷新列表和创建待确认课程
    - 课程卡片列表：显示课程标题、时间范围、学员ID和状态标签
    - 空状态提示：暂无符合条件的课程
  - **pages/sessions/index.js**：
    - 实现关键字搜索：`onKeyword()` 方法处理输入
    - 实现状态筛选：`setStatus()` 方法切换状态并自动刷新
    - 实现日期筛选：`onStartDate()` 和 `onEndDate()` 方法处理日期选择
    - 实现日期转换：`toIsoStart()` 和 `toIsoEnd()` 将日期字符串转换为 ISO 格式
    - 实现数据获取：`fetch()` 方法调用 `admin_list_sessions` 云函数
    - 实现创建课程跳转：`goCreate()` 方法跳转到排课页
    - 页面加载时自动获取数据
  - **pages/sessions/index.wxss**：
    - 完整实现页面样式，参照 report 页的卡片风格
    - 页面背景、卡片样式、按钮样式、标签样式等
    - 响应式布局和交互状态样式
- **影响范围**：
  - 管理端课程列表页的完整功能实现
  - 用户可以通过关键字、状态、日期范围筛选课程
  - 用户可以直接从列表页跳转到创建课程页面
- **回滚方案**：
  - 如需回滚，可恢复之前的简化版本（但当前版本为首次完整实现）
- **测试点**：
  - 验证关键字搜索功能（手机号/姓名/课程标题）
  - 验证状态筛选功能（全部/待确认/已确认/已完成）
  - 验证日期范围筛选功能
  - 验证创建课程跳转功能
  - 验证列表数据加载和空状态显示
  - 验证刷新按钮 loading 状态

### 2025-11-15 11:16:05 — 首页导航优化：课程管理跳转到课程列表页
- **refactor(ui)**: 调整首页导航逻辑，课程管理按钮跳转到课程列表页而非排课页
- **变更内容**：
  - **app.json**：
    - 调整页面注册顺序：将 `pages/sessions/index` 放在 `pages/schedule/schedule` 和 `pages/report/report` 之间
  - **pages/home/index.wxml**：
    - 将 `navigator` 组件改为 `button` 组件
    - 课程管理按钮使用 `bindtap="goSessions"` 跳转到课程列表页
    - 报告管理按钮使用 `bindtap="goReport"` 跳转到报告页
  - **pages/home/index.js**：
    - 新增 `goSessions()` 方法：使用 `wx.navigateTo` 跳转到 `/pages/sessions/index`
    - 新增 `goReport()` 方法：使用 `wx.navigateTo` 跳转到 `/pages/report/report`
  - **pages/home/index.wxss**：
    - 新增 `.menu-btn` 样式类：适配 button 组件，保持原有视觉效果
    - 移除 button 默认边框：使用 `border: none` 和 `::after { border: none }`
- **影响范围**：
  - 管理端首页导航流程：用户点击"课程管理"后先进入课程列表页，而非直接进入排课页
- **回滚方案**：
  - 恢复 `pages/home/index.wxml` 中的 `navigator` 组件
  - 删除 `pages/home/index.js` 中的 `goSessions` 和 `goReport` 方法
  - 恢复 `pages/home/index.wxss` 中的 `.menu-item` 样式（如已删除）
- **测试点**：
  - 验证首页"课程管理"按钮点击后跳转到课程列表页
  - 验证首页"报告管理"按钮点击后跳转到报告页
  - 验证按钮样式与交互效果正常

### 2025-11-12 23:15:10 — 前端页面筛选功能完善（关键字+日期）
- **feat(ui)**: 为多个页面添加关键字搜索和日期范围筛选UI
- **变更内容**：
  - **admin/pages/sessions/index**：
    - 新增日期选择器：开始日期（startDate）和结束日期（endDate）
    - 优化关键字输入：placeholder 改为"手机号/姓名/课程标题"
    - 修改 fetch 方法：直接传递 `q`、`status`、`startFrom`、`startTo` 参数给云函数
    - 新增日期转换方法：`iso()` 和 `isoEnd()` 将日期字符串转换为 ISO 格式
    - 页面加载时自动调用 `fetch()` 获取数据
  - **user/pages/home/index**：
    - 新增关键字搜索输入框：支持搜索课程标题
    - 新增日期选择器：开始日期和结束日期
    - 新增刷新按钮：带 loading 状态
    - 修改 refreshPending 方法：传递 `q`、`startFrom`、`startTo` 参数给云函数
    - 新增日期转换方法：`iso()` 和 `isoEnd()`
  - **user/pages/sessions/confirmed/index**：
    - 新增关键字搜索输入框：支持搜索课程标题
    - 新增日期选择器：开始日期和结束日期
    - 新增刷新按钮：带 loading 状态
    - 修改 fetch 方法：传递 `q`、`startFrom`、`startTo` 参数给云函数
    - 新增日期转换方法：`iso()` 和 `isoEnd()`
  - **user/pages/reports/list/index**：
    - 新增关键字搜索输入框：支持搜索备注
    - 新增日期选择器：创建开始日期（createdFrom）和创建结束日期（createdTo）
    - 新增刷新按钮：带 loading 状态
    - 修改 fetch 方法：传递 `q`、`createdFrom`、`createdTo` 参数给云函数
    - 新增日期转换方法：`iso()` 和 `isoEnd()`
- **影响范围**：
  - 管理端课程总览页：支持按关键字和日期范围筛选课程
  - 用户端待确认课程页：支持按关键字和日期范围筛选
  - 用户端已确认课程页：支持按关键字和日期范围筛选
  - 用户端训练报告列表页：支持按关键字和创建日期范围筛选
- **回滚方案**：
  - 恢复备份文件（如有）或使用 git 回退到上一个版本
  - 删除新增的筛选UI元素和相关方法
- **测试点**：
  - 验证关键字搜索功能是否正常工作
  - 验证日期范围筛选是否准确
  - 验证空值处理（未选择日期时传递 undefined）
  - 验证日期格式转换（ISO 格式）

### 2025-11-12 23:11:45 — 云函数筛选功能增强（关键字+日期）
- **feat(cloud)**: 为多个云函数增加关键字搜索和日期范围筛选功能
- **变更内容**：
  - **admin_list_sessions (v1.1)**：
    - 新增关键字搜索：支持按课程标题（title）模糊匹配，或通过用户手机号/昵称搜索关联的课程
    - 新增日期范围筛选：支持 `startFrom` 和 `startTo` 参数，筛选指定时间范围内的课程
    - 优化查询逻辑：自动获取管理员租户ID，支持按状态筛选
    - 返回字段：`_id`、`userId`、`title`、`startAt`、`endAt`、`status`、`coachId`
    - 查询上限：最多返回 100 条记录，按开始时间升序排列
  - **user_list_pending_sessions (v1.2)**：
    - 新增关键字搜索：支持按课程标题（title）模糊匹配
    - 新增日期范围筛选：支持 `startFrom` 和 `startTo` 参数
    - 保留原有功能：`includeConfirmed` 参数控制是否包含已确认课程
    - 查询上限：最多返回 100 条记录，按开始时间升序排列
  - **user_list_confirmed_sessions (v1.1)**：
    - 新增关键字搜索：支持按课程标题（title）模糊匹配
    - 新增日期范围筛选：支持 `startFrom` 和 `startTo` 参数
    - 固定状态：仅查询已确认（confirmed）状态的课程
    - 查询上限：最多返回 100 条记录，按开始时间升序排列
  - **user_list_reports (v1.1)**：
    - 新增关键字搜索：支持按训练报告评论（comment）字段模糊匹配
    - 新增日期范围筛选：支持 `createdFrom` 和 `createdTo` 参数，筛选创建时间范围内的报告
    - 保留分页功能：支持 `page` 和 `pageSize` 参数（默认第1页，每页20条）
    - 返回总数：返回 `total` 字段，便于前端实现分页导航
- **参数说明**：
  - `q` (string, 可选): 关键字搜索，支持模糊匹配
  - `startFrom` / `startTo` (string, 可选): 日期范围起点/终点（ISO 格式字符串）
  - `createdFrom` / `createdTo` (string, 可选): 创建时间范围起点/终点（仅用于 reports）
  - `status` (string, 可选): 课程状态筛选（仅用于 admin_list_sessions）
  - `includeConfirmed` (boolean, 可选): 是否包含已确认课程（仅用于 user_list_pending_sessions）
- **影响范围**：
  - 管理端课程列表查询：支持按学员信息搜索课程
  - 用户端待确认课程列表：支持关键字和日期筛选
  - 用户端已确认课程列表：支持关键字和日期筛选
  - 用户端训练报告列表：支持关键字和日期筛选
- **回滚方案**：
  - 恢复备份文件：
    - `admin_list_sessions/index.js.v1.0`
    - `user_list_pending_sessions/index.js.v1.1`
    - `user_list_confirmed_sessions/index.js.v1.0`
    - `user_list_reports/index.js.v1.0`
  - 在微信开发者工具中重新部署对应的云函数
- **备份文件**：
  - `admin_list_sessions/index.js.v1.0`（已备份 v1.0 版本）
  - `user_list_pending_sessions/index.js.v1.1`（已备份 v1.1 版本）
  - `user_list_confirmed_sessions/index.js.v1.0`（已备份 v1.0 版本）
  - `user_list_reports/index.js.v1.0`（已备份 v1.0 版本）

### 2025-11-12 23:09:45 — 样式路径修复与全局引入优化
- **refactor(styles)**: 重构样式引入方式，将主题样式从 common 目录迁移到各应用目录，并添加全局引入
- **变更内容**：
  - **新增文件**：
    - `apps/admin/styles/theme.wxss`：管理端主题样式文件（从 `apps/common/styles/theme.wxss` 复制）
    - `apps/user/styles/theme.wxss`：用户端主题样式文件（内容同上）
    - `apps/admin/app.wxss`：管理端全局样式文件，引入主题样式
    - `apps/user/app.wxss`：用户端全局样式文件，引入主题样式
  - **修改文件**：
    - 删除所有页面 `.wxss` 文件中的 `@import "../../../common/styles/theme.wxss";` 引入
    - 删除所有页面 `.wxml` 文件中的错误样式引入（样式引入应在 `.wxss` 文件中）
    - 修复的文件列表：
      - `apps/admin/pages/home/index.wxss`
      - `apps/admin/pages/schedule/index.wxss`
      - `apps/admin/pages/schedule/schedule.wxss`
      - `apps/admin/pages/report/index.wxss`
      - `apps/admin/pages/report/report.wxss`
      - `apps/admin/pages/sessions/index.wxml`
      - `apps/user/pages/home/index.wxss`
      - `apps/user/pages/home/index.wxml`
      - `apps/user/pages/reports/list/index.wxml`
      - `apps/user/pages/reports/detail/index.wxml`
      - `apps/user/pages/sessions/confirmed/index.wxml`
- **影响范围**：
  - 所有页面的样式引入方式：主题样式现在通过 `app.wxss` 全局引入，无需在每个页面单独引入
  - 样式路径：从跨应用的 `common/styles/theme.wxss` 改为各应用内的 `styles/theme.wxss`
- **优势**：
  - 减少重复引入：主题样式只需在 `app.wxss` 中引入一次，所有页面自动生效
  - 路径更清晰：各应用的样式文件独立管理，不再依赖跨应用目录
  - 符合小程序最佳实践：全局样式应在 `app.wxss` 中引入
- **回滚方案**：
  - 恢复各页面 `.wxss` 文件中的 `@import "../../../common/styles/theme.wxss";` 引入
  - 删除 `apps/admin/app.wxss` 和 `apps/user/app.wxss` 文件
  - 删除 `apps/admin/styles/` 和 `apps/user/styles/` 目录

### 2025-11-12 22:36:31 — admin_create_session v1.2 & schedule.js v1.3 & auth_login v1.0
- **refactor(cloud)**: 优化租户ID推断逻辑，移除前端 tenantId 传参，统一默认租户为 'default'
- **变更内容**：
  - **admin_create_session (v1.2)**：
    - 移除 tenantId 必填校验，改为自动推断
    - 实现租户ID推断链：参数 → 学员记录 → 管理员记录 → 默认值 'default'
    - 使用 `cloud.DYNAMIC_CURRENT_ENV` 初始化云环境
    - 优化时间处理函数，统一使用 `toISO` 函数
    - 获取管理员 OPENID 用于租户推断
  - **schedule.js (v1.3)**：
    - 删除 `createPendingSession` 中对 tenantId 的获取与传参
    - 简化云函数调用，不再传递 tenantId 参数
  - **auth_login (v1.0)**：
    - 统一默认租户为 'default'（从 't_default' 改为 'default'）
    - 创建新用户时自动写入默认 tenantId
    - 移除查询用户时的 tenantId 条件，支持跨租户查询
    - 钱包创建时使用用户记录的 tenantId 或默认值
- **影响范围**：
  - 管理端课程创建功能：不再需要前端传递 tenantId，后端自动推断
  - 用户登录功能：新用户自动分配默认租户 'default'
  - 租户隔离策略：MVP 阶段使用默认租户，后续可扩展为严格多租户
- **回滚方案**：
  - admin_create_session：恢复 `index.js.v1.1` 文件
  - schedule.js：恢复 `schedule.js.v1.2` 文件
  - auth_login：恢复 `index.js.v1.0` 文件（如果存在）或手动回退变更
- **备份文件**：
  - `admin_create_session/index.js.v1.1`（已备份 v1.1 版本）
  - `schedule/schedule.js.v1.3`（已备份 v1.3 版本）
  - `auth_login/index.js.v1.0`（已备份 v1.0 版本）

### 2025-11-12 22:26:50 — schedule 页面 v1.3 & user/home 页面 v1.1
- **refactor(schedule)**: 重构课程创建页面，改用学员搜索选择，移除 sessionId 显示
- **refactor(user/home)**: 优化用户端首页，先 auth_login 再拉取课程，移除 tenantId 参数
- **变更内容**：
  - **schedule.wxml (v1.3)**：
    - 新增学员搜索功能：添加搜索输入框和搜索按钮，集成 `admin_search_users` 云函数
    - 新增学员列表展示：显示搜索结果，每个学员显示昵称和手机号，支持选择操作
    - 新增课程标题输入：添加可选的课程标题输入框
    - 移除 sessionId 显示：删除创建后显示和复制 sessionId 的 UI 区域
  - **schedule.js (v1.3)**：
    - 新增学员搜索功能：`onSearchInput`、`searchUsers`，集成 `admin_search_users` 云函数
    - 优化选人逻辑：`pickUser` 只从 dataset 读取标量值（userId、nickname、phone），与 report 页保持一致
    - 优化创建逻辑：`createPendingSession` 必须校验 `chosenUserId`，传入 `userId` 而非 `userPhone`
    - 优化时间处理：`toISO` 函数正确处理日期时间组合，支持 ISO 格式输出
    - 优化 tenantId 获取：从 `getApp().globalData` 或 `wx.getStorageSync` 获取，可选传入
    - 优化创建成功处理：创建成功后清空表单，不再显示 sessionId
    - 移除 sessionId 相关逻辑：删除 `copySid` 函数和 `sessionId` 数据字段
  - **schedule.wxss (v1.3)**：
    - 新增学员列表样式：`.user-list`、`.row`、`.meta`、`.tag-selected` 等样式
    - 新增搜索按钮样式：`.btn-search` 样式
    - 优化按钮禁用状态：`.btn[disabled]` 样式
  - **apps/user/pages/home/index.js (v1.1)**：
    - 新增 `bootstrap` 方法：在 `onLoad` 时先调用 `auth_login` 确保 users 表落库，再调用 `refreshPending`
    - 优化 `refreshPending`：移除 `tenantId` 参数，不再从 `getApp().globalData` 获取 tenantId
    - 优化 `onShow`：注释掉自动刷新逻辑，避免不必要的请求
    - 彻底避免 `getApp().globalData` 的使用，消除相关报错
- **影响范围**：
  - 管理端课程创建页面：需要先搜索选择学员，不能再直接输入手机号创建
  - 用户端首页：初始化流程变更，先登录再拉取课程列表
- **回滚方案**：
  - schedule 页面：恢复 `schedule.js.v1.2` 和 `schedule.wxml.v1.2` 文件
  - user/home 页面：恢复 `index.js.v1.1` 文件（如果存在）或手动回退变更
- **备份文件**：
  - `schedule.js.v1.2`（已备份 v1.2 版本）
  - `schedule.wxml.v1.2`（已备份 v1.2 版本）
  - `apps/user/pages/home/index.js.v1.1`（已备份 v1.0 版本）

### 2025-11-12 22:13:19 — user_list_pending_sessions v1.1
- **refactor(cloud)**: 重构 user_list_pending_sessions 云函数，从 openid 映射 userId，支持 tenantId 参数
- **变更内容**：
  - 从 openid 映射 userId：优先使用 users 表的 userId 字段，否则使用 _id 作为兜底
  - 支持 tenantId 参数：优先使用参数值，否则使用用户记录的 tenantId
  - 新增 includeConfirmed 参数：支持查询包含已确认状态的课程（默认仅返回待确认）
  - 移除 onlyFuture 和 pageSize 参数：简化接口，固定返回最多 50 条记录
  - 返回完整字段：不再精简返回字段，返回所有查询字段（_id、userId、startAt、endAt、title、status、coachId、tenantId）
  - 优化错误处理：用户不存在时返回 `{ list: [], reason: 'no_user' }` 而不是抛错
  - 使用 field() 投影优化查询性能：仅查询 users 表的 userId 和 tenantId 字段
- **影响范围**：用户端课程列表查询功能，调用方需要适配新的返回格式和参数
- **回滚方案**：恢复 `index.js.v1.0` 文件为 `index.js`，重新部署云函数
- **备份文件**：`index.js.v1.0`（已备份 v1.0 版本）

### 2025-11-12 22:11:59 — admin_create_session v1.1
- **refactor(cloud)**: 简化 admin_create_session 云函数，移除用户查找逻辑，直接要求 userId
- **变更内容**：
  - 移除用户查找逻辑：不再支持通过 userPhone 查找用户，直接要求传入 userId
  - 移除时间格式转换函数：不再支持 "YYYY-MM-DD HH:mm" 格式转换，直接使用 `new Date()` 解析时间
  - 使用 `db.serverDate()` 替代 `new Date()` 作为创建时间，确保时区一致性
  - 简化参数校验：要求必填 userId、startAt、endAt、tenantId
  - 统一错误信息前缀：所有错误信息统一使用 "admin_create_session:" 前缀
  - 调整默认值：`coachId` 从 'unknown' 改为 null，`title` 从 '私教课' 改为 '未命名课程'
- **影响范围**：管理员创建课程会话功能，调用方需要直接传入 userId 和 tenantId
- **回滚方案**：恢复 `index.js.v1.0` 文件为 `index.js`，重新部署云函数
- **备份文件**：`index.js.v1.0`（已备份 v1.0 版本）

### 2025-11-06 23:50:00 — 修复 admin 报告页选择学员缺少 userId
- **fix(report)**: 修复 admin 报告页选择学员缺少 userId；后端补 userId 兜底、前端仅传标量 dataset
- **变更内容**：
  - 云函数 `admin_search_users`：添加 `field()` 投影仅返回轻量字段；确保返回结果必含 `userId`（老数据无 `userId` 时用 `_id` 兜底）；返回列表统一 shape：`{ idx, userId, nickname, phone }`
  - 前端 `report.js`：优化 `pickUser()` 函数，只从 `e.currentTarget.dataset.userId` 取值并校验，严防把 `undefined` 写进 `chosenUserId`；`setData` 完成后触发 `loadSessions(userId)`
  - 前端 `report.wxml`：移除 `data-idx` 属性，只传标量 dataset（`data-user-id`、`data-nickname`、`data-phone`）；列表 `wx:for` 的 `wx:key="userId"`；选中态用 `chosenUserId === item.userId` 判定
  - 前端 `report.wxss`：添加 `.tag-selected` 样式（已选标记）和 `.choose-btn` 样式（选择按钮右对齐）
- **影响范围**：管理端报告页学员选择功能
- **回滚方案**：恢复云函数和前端文件到上一个版本

### 2025-11-06 22:29:25 — report 页面 v2.5
- **feat(ui)**: 完整重构 UI 样式和交互逻辑，新增主题色块和扣费金额芯片选择
- **变更内容**：
  - 新增主题色块设计：学员（蓝色）、课程（青色）、报告（橙色）、动作（紫色）、已选（绿色）、提交（灰色）
  - 新增扣费金额芯片选择：支持快速选择 0/50/100/200 元，或自定义金额
  - 优化课程选择逻辑：增加"请先选择学员"的提示，优化课程列表显示条件
  - 优化样式系统：使用 BEM 命名规范（`card--student`、`card__head`、`btn--primary` 等）
  - 优化 RPE 说明：添加详细说明文字（1=非常轻松；10=极限）
  - 优化学员选择：增加"已选择学员"提示，优化选择后的回调逻辑
  - 优化动作显示：移除动作代码显示，只显示动作名称
  - 优化按钮样式：新增 `btn--primary`、`btn--ghost`、`btn--success`、`btn--full` 等样式类
  - 优化输入框样式：新增 `ipt--search`、`ipt--money` 等样式类
  - 优化布局间距：统一使用更大的 padding 和 margin，提升视觉层次
- **影响范围**：管理端训练报告页的完整 UI 和交互体验
- **回滚方案**：恢复 `report.wxml`、`report.js.v2.3`、`report.wxss.v2.3` 文件
- **备份文件**：`report.js.v2.3`、`report.wxss.v2.3`（已备份 v2.3 版本）

### 2025-11-06 22:14:54 — report 页面 v2.4
- **style(ui)**: 优化样式间距和颜色方案
- **变更内容**：
  - 优化间距和尺寸：统一减少 padding、margin、gap 等间距值，使界面更紧凑
  - 优化 badge 颜色方案：使用更现代的配色（pending 橙色、confirmed 绿色、done 紫色）
  - 简化样式规则：合并 `.picker` 和 `.ipt` 样式，简化 `.sub` 样式
  - 统一输入框和选择器样式：使用相同的 padding 和 border 样式
  - 优化列表项样式：统一 `.line` 的 padding 和 border 颜色
  - 优化芯片选择样式：调整 padding 和 border-radius，使其更紧凑
- **影响范围**：管理端训练报告页的视觉效果和间距
- **回滚方案**：恢复 `report.wxss.v2.2` 文件为 `report.wxss`
- **备份文件**：`report.wxss.v2.2`（已备份 v2.2 版本）

### 2025-11-06 22:14:06 — report 页面 v2.3
- **refactor(ui)**: 简化状态筛选器选项和代码风格
- **变更内容**：
  - 简化状态筛选器：从 5 个选项简化为 3 个（待确认或已确认、仅待确认、仅已确认）
  - 简化状态映射逻辑：使用数组映射替代对象映射
  - 优化代码风格：使用更紧凑的箭头函数和链式调用
  - 移除自动触发：状态筛选和时间筛选需要手动点击"刷新"按钮
  - 移除自动搜索：肌群选择需要手动点击"搜索"按钮
  - 简化提交成功提示：从显示余额改为简单的"已提交"
  - 优化清空逻辑：提交成功后保留学员和课程选择
  - 简化工具函数：`fmt` 和 `statusText` 函数使用更紧凑的写法
- **影响范围**：管理端训练报告页的状态筛选和交互逻辑
- **回滚方案**：恢复 `report.js.v2.2` 文件为 `report.js`
- **备份文件**：`report.js.v2.2`（已备份 v2.2 版本）

### 2025-11-06 22:12:56 — report 页面 v2.2
- **feat(ui)**: 完整重构训练报告页 UI/交互，新增学员选择和课程选择功能
- **变更内容**：
  - 新增学员选择功能：支持按手机号或姓名关键词搜索学员，集成 `admin_search_users` 云函数
  - 新增课程选择功能：支持状态筛选（全部/待确认/已确认/已完成/已取消）和时间筛选（仅看未开始），集成 `admin_list_sessions` 云函数
  - 优化 RPE 选择：从滑块改为芯片式选择（1-10），更直观易用
  - 新增时间格式化函数：将 ISO 时间格式化为 "YYYY-MM-DD HH:mm" 显示
  - 新增状态文本函数：将状态码转换为中文显示，支持不同状态的颜色标识
  - 优化界面布局：使用更清晰的卡片式设计，统一的列表项样式
  - 优化提交验证：检查是否选择了课程，提示更友好
  - 优化清空逻辑：提交成功后清空学员和课程选择
- **影响范围**：管理端训练报告页的完整交互流程
- **回滚方案**：恢复 `report.wxml.v2.0`、`report.js.v2.0`、`report.wxss.v2.0` 文件
- **备份文件**：`report.wxml.v2.0`、`report.js.v2.0`、`report.wxss.v2.0`（已备份 v2.0 版本）

### 2025-11-06 22:11:03 — admin_list_sessions v1.0
- **feat(cloud)**: 新增管理员按学员列出课程云函数
- **变更内容**：
  - 新增云函数 `admin_list_sessions`，支持按学员ID查询课程列表
  - 支持状态筛选（默认查询待确认和已确认状态）
  - 支持时间筛选（可选仅未来时间的课程）
  - 支持分页查询，每页最多返回 50 条记录
  - 按开始时间降序排列返回结果（最新的在前）
  - 返回精简的课程信息（_id、title、startAt、endAt、status）
  - 支持租户隔离查询
- **影响范围**：管理员端学员课程查询功能
- **回滚方案**：删除云函数目录 `/apps/admin/cloudfunctions/admin_list_sessions/`，并在微信开发者工具中删除云端云函数
- **部署步骤**：
  1. 在微信开发者工具中右键云函数 `admin_list_sessions` -> 上传并部署：云端安装依赖
  2. 在小程序中调用 `wx.cloud.callFunction({ name: 'admin_list_sessions', data: { userId: '学员ID', page: 0, pageSize: 20 } })`

### 2025-11-06 22:07:56 — admin_search_users v1.0
- **feat(cloud)**: 新增管理员搜索学员云函数
- **变更内容**：
  - 新增云函数 `admin_search_users`，支持按手机号或昵称模糊搜索学员
  - 支持分页查询，每页最多返回 50 条记录
  - 按昵称升序排列返回结果
  - 返回精简的学员信息（userId、nickname、phone）
  - 支持租户隔离查询
- **影响范围**：管理员端学员搜索功能
- **回滚方案**：删除云函数目录 `/apps/admin/cloudfunctions/admin_search_users/`，并在微信开发者工具中删除云端云函数
- **部署步骤**：
  1. 在微信开发者工具中右键云函数 `admin_search_users` -> 上传并部署：云端安装依赖
  2. 在小程序中调用 `wx.cloud.callFunction({ name: 'admin_search_users', data: { q: '关键字', page: 0, pageSize: 20 } })`

### 2025-11-06 21:17:43 — report 页面 v2.1
- **feat(ui)**: 中文化界面 + 修复肌群选择器与搜索功能
- **变更内容**：
  - 界面中文化：将"RPE"改为"主观用力程度（1-10）"，"SessionId"改为"会话ID"
  - 修复肌群选择器：使用数组下标取值 `{{muscles[muscleIdx]}}` 替代计算属性
  - 优化搜索体验：选择肌群后立即触发搜索，无需手动点击搜索按钮
  - 增强用户反馈：搜索无结果时显示"没有匹配的动作"提示
  - 更新搜索关键字 placeholder：提供更详细的示例说明
- **影响范围**：管理端报告页的用户体验与交互逻辑
- **回滚方案**：恢复 `report.wxml.v2.0` 和 `report.js.v2.0` 文件
- **备份文件**：`report.wxml.v2.0`、`report.js.v2.0`（已备份 v2.0 版本）

### 2025-11-06 21:16:13 — catalog_search v1.1
- **chore(cloud)**: 稳定版本，优化代码格式与结构
- **变更内容**：
  - 简化代码格式，使用更紧凑的写法
  - 保持原有功能逻辑不变（关键字搜索、肌群筛选、分页查询）
  - 确保 `defaultLoad` 字段使用空值合并运算符（`?? 0`）提供默认值
  - 优化查询条件构建逻辑，使用 `_.and()` 和 `_.or()` 组合查询
- **影响范围**：训练目录搜索功能（无功能变更，仅代码优化）
- **回滚方案**：恢复 `index.js.v1.0` 文件，重新部署云函数
- **备份文件**：`index.js.v1.0`（已备份 v1.0 版本）

### 2025-11-06 21:14:49 — seed_training_catalog v2.0
- **feat(cloud)**: 补全/灌入动作库（含肌群）云函数，实现幂等更新逻辑
- **变更内容**：
  - 新增 `muscleGroup` 字段（下肢、后链、胸、背、核心）
  - 字段名从 `defaultValue` 改为 `defaultLoad`（与 catalog_search 保持一致）
  - 实现幂等更新：已存在记录时更新字段而非跳过，补齐缺失的 `muscleGroup` 和 `defaultLoad`
  - 保留记录的其他自定义字段，仅更新标准字段
- **影响范围**：训练目录数据库初始化与数据补齐
- **回滚方案**：恢复 `index.js.v1.0` 文件，重新部署云函数
- **备份文件**：`index.js.v1.0`（已备份 v1.0 版本）



// file: apps/admin/app.js
wx.cloud.init({ env: 'cloudbase-5gjteq09c1029fb0', traceUser: true })


// file: apps/admin/app.json
{
  "pages": [
    "pages/home/index",
    "pages/users/index",
    "pages/users/detail/index",
    "pages/sessions/index",
    "pages/sessions/detail/index",
    "pages/sessions/overview/index",
    "pages/schedule/schedule",
    "pages/report/report",
    "pages/report/actions/index",
    "pages/report/actions/create/index"
  ],
  "window": {
    "backgroundColor": "#F6F6F6"
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}


// file: apps/admin/app.wxss
/* apps/admin/app.wxss */

@import "./styles/theme.wxss";

/* 其余全局样式… */



// file: apps/admin/cloudfunctions/_base.js
// _base.js - 云函数通用初始化
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

module.exports = {
  cloud,
  db
};


// file: apps/admin/cloudfunctions/admin_create_session/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event, context) => {

  const { OPENID } = cloud.getWXContext()

  const { userId, coachId, startAt, endAt, title } = event || {}

  if (!userId) throw new Error('admin_create_session: 缺少 userId')

  if (!startAt || !endAt) throw new Error('admin_create_session: 缺少时间')

  // 1) 时间统一为 ISO

  const toISO = (t) => {

    const d = new Date(t)          // 兼容字符串/ISO

    if (isNaN(+d)) throw new Error('admin_create_session: 非法时间')

    return d.toISOString()

  }

  const sISO = toISO(startAt)

  const eISO = toISO(endAt)

  // 2. 查学员信息，拿 tenantId + phone

  const uRes = await db.collection('users')

    .where(_.or([{ userId }, { _id: userId }]))

    .field({ tenantId: true, phone: true, userId: true })

    .limit(1)

    .get()

  if (!uRes.data.length) {

    throw new Error('admin_create_session: 未找到该学员')

  }

  const user = uRes.data[0]

  let tenantId = user.tenantId

  const userPhone = user.phone || ''

  // 3. 如 tenantId 仍为空，用当前管理员的 tenantId 兜底

  if (!tenantId) {

    const aRes = await db.collection('users')

      .where({ openid: OPENID })

      .field({ tenantId: true })

      .limit(1)

      .get()

    tenantId = aRes.data?.[0]?.tenantId || 'default'

  }

  // 4. 写入 sessions，附带 userPhone

  const doc = {

    userId,

    userPhone,                        // ★ 学员手机号直接冗余在课程里

    coachId: coachId || null,

    startAt: sISO,

    endAt: eISO,

    title: title || '未命名课程',

    status: 'pending',

    tenantId,

    createdAt: db.serverDate()

  }

  const { _id } = await db.collection('sessions').add({ data: doc })

  return { sessionId: _id }

}


// file: apps/admin/cloudfunctions/admin_create_session/package.json
{
  "name": "admin_create_session",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}


// file: apps/admin/cloudfunctions/admin_create_training_action/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async (event, context) => {
  const { name, muscleGroup, unit = 'kg', defaultLoad, tenantId } = event;

  if (!name || !muscleGroup) {
    return { ok: false, error: '缺少 name 或 muscleGroup' };
  }

  const { OPENID } = cloud.getWXContext();
  const finalTenantId = tenantId || 't_default';
  const code = `C${Date.now()}`;  // 简单生成一个唯一 code

  await db.collection('training_catalog').add({
    data: {
      code,
      name,
      muscleGroup,
      unit,
      defaultLoad: defaultLoad || null,
      tenantId: finalTenantId,
      createdBy: OPENID,
      createdAt: db.serverDate()
    }
  });

  return { ok: true, code };
};



// file: apps/admin/cloudfunctions/admin_create_training_action/package.json
{
  "name": "admin_create_training_action",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/admin_delete_session/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { sessionId } = event || {}

  if (!sessionId) throw new Error('admin_delete_session: 缺少 sessionId')

  // 简单版本：直接删除。你要"软删"可以改成 status: 'canceled'
  await db.collection('sessions').doc(sessionId).remove()

  return { ok: true }
}



// file: apps/admin/cloudfunctions/admin_delete_session/package.json
{
  "name": "admin_delete_session",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}



// file: apps/admin/cloudfunctions/admin_get_user_detail/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const { userId } = event || {}
  if (!userId) throw new Error('admin_get_user_detail: 缺少 userId')

  const usersColl = db.collection('users')
  const walletsColl = db.collection('wallets')

  const uRes = await usersColl
    .where(_.or([{ userId }, { _id: userId }]))
    .limit(1)
    .get()

  if (!uRes.data.length) {
    throw new Error('未找到该学员')
  }

  const user = uRes.data[0]
  const uid = user.userId || user._id

  const wRes = await walletsColl
    .where({ userId: uid })
    .limit(1)
    .get()

  const wallet = wRes.data[0] || { userId: uid, balance: 0 }

  return { user, wallet }
}



// file: apps/admin/cloudfunctions/admin_get_user_detail/package.json
{
  "name": "admin_get_user_detail",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}



// file: apps/admin/cloudfunctions/admin_list_all_sessions/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()

  const {
    date,         // 'YYYY-MM-DD'
    status = 'all',
    tenantId
  } = event || {}

  if (!date) {
    throw new Error('admin_list_all_sessions: 缺少 date')
  }

  // 1. 获取当前管理员的 tenantId（如果未传入）
  let finalTenantId = tenantId
  if (!finalTenantId) {
    const aRes = await db.collection('users')
      .where({ openid: OPENID })
      .field({ tenantId: true })
      .limit(1)
      .get()
    finalTenantId = aRes.data?.[0]?.tenantId || 'default'
  }

  const start = new Date(`${date}T00:00:00`)
  const end = new Date(`${date}T23:59:59`)
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  const where = {
    startAt: _.and(_.gte(startIso), _.lte(endIso)),
    ...(finalTenantId ? { tenantId: finalTenantId } : {})
  }

  if (status && status !== 'all') {
    where.status = status
  }

  // 2. 先查当天所有课程
  const sessRes = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .limit(500)
    .field({
      _id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true,
      userId: true,
      tenantId: true
    })
    .get()

  const sessions = sessRes.data || []

  if (!sessions.length) {
    return { list: [] }
  }

  // 3. 补学员昵称、手机号
  const userIds = Array.from(new Set(
    sessions.map(s => s.userId).filter(Boolean)
  ))

  let usersMap = {}

  if (userIds.length) {
    // 兼容 userId 和 _id 字段
    const uRes = await db.collection('users')
      .where(_.or([
        { userId: _.in(userIds) },
        { _id: _.in(userIds) }
      ]))
      .field({ userId: true, _id: true, nickname: true, phone: true })
      .get()

    usersMap = (uRes.data || []).reduce((acc, u) => {
      const key = u.userId || u._id
      acc[key] = u
      return acc
    }, {})
  }

  const list = sessions.map(s => {
    const u = usersMap[s.userId] || {}
    return {
      ...s,
      userName: u.nickname || '未命名',
      userPhone: u.phone || ''
    }
  })

  return { list }
}



// file: apps/admin/cloudfunctions/admin_list_all_sessions/package.json
{
  "name": "admin_list_all_sessions",
  "version": "1.0.0",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/admin_list_sessions/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  const { q = '', status, startFrom, startTo } = event || {}

  // 1. 找到当前管理员所在租户
  const aRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ tenantId: true })
    .limit(1)
    .get()

  const tenantId = aRes.data?.[0]?.tenantId || 'default'

  // 2. 时间范围条件
  let startCond = null
  if (startFrom) startCond = _.gte(startFrom)
  if (startTo) {
    const toCond = _.lte(startTo)
    startCond = startCond ? _.and(startCond, toCond) : toCond
  }

  // 3. 关键字：匹配 title；同时模糊搜学员（手机号/昵称）
  const reg = q ? db.RegExp({ regexp: q, options: 'i' }) : null
  let userIdsByKeyword = []
  if (q) {
    const u = await db.collection('users')
      .where(_.and([
        { tenantId },
        _.or([{ phone: reg }, { nickname: reg }])
      ]))
      .field({ userId: true, _id: true })
      .limit(50)
      .get()
    userIdsByKeyword = (u.data || []).map(x => x.userId || x._id)
  }

  const base = {
    tenantId,
    ...(status ? { status } : {}),
    ...(startCond ? { startAt: startCond } : {})
  }

  const where = q
    ? _.and([
        base,
        _.or([
          { title: reg },
          { userId: _.in(userIdsByKeyword) }
        ])
      ])
    : base

  // 4. 查 sessions
  const sessRes = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .field({
      _id: true,
      userId: true,
      userPhone: true,   // ★ 加上这个
      title: true,
      startAt: true,
      endAt: true,
      status: true,
      coachId: true
    })
    .limit(100)
    .get()

  let sessions = sessRes.data || []

  // 如果课程里本身已经有 userPhone，直接返回即可
  const missingPhone = sessions.filter(s => !s.userPhone && s.userId)
  if (missingPhone.length) {
    // 兜底：为旧数据补一次手机号
    const userIds = [...new Set(missingPhone.map(s => s.userId))]
    const usersRes = await db.collection('users')
      .where({ userId: _.in(userIds) })
      .field({ userId: true, phone: true })
      .get()
    const phoneMap = {}
    ;(usersRes.data || []).forEach(u => {
      phoneMap[u.userId] = u.phone || ''
    })
    sessions = sessions.map(s => ({
      ...s,
      userPhone: s.userPhone || phoneMap[s.userId] || ''
    }))
  }

  return { list: sessions }
}


// file: apps/admin/cloudfunctions/admin_list_sessions/package.json
{
  "name": "admin_list_sessions",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/admin_search_users/index.js
// 模糊搜索学员（手机号 / 昵称），返回 userId/nickname/phone

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const _ = db.command;

exports.main = async (event = {}) => {
  const { q = "", page = 0, pageSize = 20, tenantId = 't_default' } = event;

  const limit = Math.min(pageSize, 50);

  const conds = [{ tenantId }];

  if (q) {
    const re = db.RegExp({ regexp: q, options: 'i' });
    // 手机或昵称命中其一即可
    conds.push(_.or([{ phone: re }, { nickname: re }]));
  }

  const res = await db.collection('users')
    .where(_.and(conds))
    .field({
      userId: true,
      nickname: true,
      phone: true,
      _id: true
    })
    .orderBy('nickname', 'asc')
    .skip(page * limit)
    .limit(limit)
    .get();

  const list = res.data.map((u, idx) => ({
    idx,
    userId: u.userId || u._id, // 老数据无 userId 时用 _id 兜底
    nickname: u.nickname || '未命名',
    phone: u.phone || ''
  }));

  return { list, hasMore: list.length === limit, page, pageSize: limit };
};



// file: apps/admin/cloudfunctions/admin_search_users/package.json
{
  "name": "admin_search_users",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/admin_update_session/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { sessionId, startAt, endAt } = event || {}

  if (!sessionId) throw new Error('admin_update_session: 缺少 sessionId')

  if (!startAt || !endAt) throw new Error('admin_update_session: 缺少时间')

  const toISO = (t) => {
    const d = new Date(t)
    if (isNaN(+d)) throw new Error('admin_update_session: 非法时间')
    return d.toISOString()
  }

  const sISO = toISO(startAt)
  const eISO = toISO(endAt)

  await db.collection('sessions').doc(sessionId).update({
    data: { startAt: sISO, endAt: eISO }
  })

  return { ok: true }
}



// file: apps/admin/cloudfunctions/admin_update_session/package.json
{
  "name": "admin_update_session",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}



// file: apps/admin/cloudfunctions/admin_update_user_detail/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const {
    userId,
    nickname,
    gender,
    heightCm,
    weightKg,
    bodyFat,
    phone,
    timesBalance,
    balanceAmount
  } = event || {}

  if (!userId) throw new Error('admin_update_user_detail: 缺少 userId')

  const usersColl = db.collection('users')
  const walletsColl = db.collection('wallets')

  // 找到 user 文档
  const uRes = await usersColl
    .where(_.or([{ userId }, { _id: userId }]))
    .limit(1)
    .get()

  if (!uRes.data.length) throw new Error('未找到该学员')

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId || null

  const toNum = (v) => {
    if (v === '' || v == null) return null
    const n = Number(v)
    return isNaN(n) ? null : n
  }

  // 更新 users
  const userUpdate = {
    nickname: nickname != null ? nickname : userDoc.nickname || '',
    gender: gender != null ? gender : userDoc.gender || '',
    phone: phone != null ? phone : userDoc.phone || ''
  }

  const h = toNum(heightCm)
  const w = toNum(weightKg)
  const bf = toNum(bodyFat)
  const tb = toNum(timesBalance)

  if (h != null) userUpdate.heightCm = h
  if (w != null) userUpdate.weightKg = w
  if (bf != null) userUpdate.bodyFat = bf
  if (tb != null) userUpdate.timesBalance = tb

  await usersColl.doc(userDoc._id).update({ data: userUpdate })

  // 更新或创建钱包余额
  if (balanceAmount != null && balanceAmount !== '') {
    const bal = toNum(balanceAmount) || 0
    const wRes = await walletsColl.where({ userId: uid }).limit(1).get()
    if (wRes.data.length) {
      await walletsColl.doc(wRes.data[0]._id).update({
        data: { balance: bal }
      })
    } else {
      await walletsColl.add({
        data: {
          userId: uid,
          balance: bal,
          tenantId: tenantId || null
        }
      })
    }
  }

  return { ok: true }
}



// file: apps/admin/cloudfunctions/admin_update_user_detail/package.json
{
  "name": "admin_update_user_detail",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}



// file: apps/admin/cloudfunctions/auth_login/index.js
// auth_login - 用户登录与钱包初始化
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    throw new Error('无法获取用户 openid');
  }

  const DEFAULT_TENANT = 'default';
  const now = new Date();

  try {
    // 查询用户是否存在
    const userQuery = await db.collection('users')
      .where({
        openid: openid
      })
      .get();

    let userId;
    let role = 'user'; // 默认角色

    if (userQuery.data.length === 0) {
      // 用户不存在，创建用户
      const userResult = await db.collection('users').add({
        data: {
          openid: openid,
          tenantId: DEFAULT_TENANT,     // ★ 默认租户
          role: role,
          createdAt: now,
          updatedAt: now
        }
      });
      userId = userResult._id;

      // 创建钱包
      await db.collection('wallets').add({
        data: {
          userId: userId,
          tenantId: DEFAULT_TENANT,
          balance: 0,
          createdAt: now,
          updatedAt: now
        }
      });
    } else {
      // 用户已存在
      userId = userQuery.data[0]._id;
      role = userQuery.data[0].role || 'user';

      // 检查钱包是否存在
      const tenantId = userQuery.data[0].tenantId || DEFAULT_TENANT;
      const walletQuery = await db.collection('wallets')
        .where({
          userId: userId,
          tenantId: tenantId
        })
        .get();

      if (walletQuery.data.length === 0) {
        // 钱包不存在，创建钱包
        await db.collection('wallets').add({
          data: {
            userId: userId,
            tenantId: tenantId,
            balance: 0,
            createdAt: now,
            updatedAt: now
          }
        });
      }
    }

    return {
      userId: userId,
      role: role
    };
  } catch (error) {
    throw new Error(`登录失败: ${error.message}`);
  }
};


// file: apps/admin/cloudfunctions/auth_login/package.json
{
  "name": "auth_login",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}


// file: apps/admin/cloudfunctions/catalog_search/index.js
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const _ = db.command;

exports.main = async (event = {}) => {
  const { key = "", muscle = "", page = 0, pageSize = 20, tenantId = "t_default" } = event;

  const limit = Math.min(pageSize, 50);

  const clauses = [{ tenantId }];
  if (muscle) clauses.push({ muscleGroup: muscle });
  if (key) {
    const re = db.RegExp({ regexp: key, options: 'i' });
    clauses.push(_.or([{ name: re }, { code: re }]));
  }

  const where = _.and(clauses);

  const snap = await db.collection('training_catalog')
    .where(where).orderBy('name', 'asc')
    .skip(page * limit).limit(limit).get();

  const list = snap.data.map(x => ({
    code: x.code, name: x.name, muscleGroup: x.muscleGroup,
    unit: x.unit, defaultLoad: x.defaultLoad ?? 0
  }));

  return { list, page, pageSize: limit, hasMore: list.length === limit };
};


// file: apps/admin/cloudfunctions/catalog_search/package-lock.json
{
  "name": "catalog_search",
  "version": "0.0.1",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "catalog_search",
      "version": "0.0.1",
      "license": "MIT",
      "dependencies": {
        "wx-server-sdk": "^3.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@cloudbase/database": {
      "version": "1.4.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@cloudbase/database/-/database-1.4.1.tgz",
      "integrity": "sha512-BYLXHS6c+WhxAvvdak8Z3W+heScqBBPu/CQ76gC8v1Scuy5qf4qxuPWNzyoxde/eZsmc+BRRCFyIq4xUnIot8g==",
      "license": "ISC",
      "dependencies": {
        "bson": "^4.0.3",
        "lodash.clonedeep": "4.5.0",
        "lodash.set": "4.3.2",
        "lodash.unset": "4.5.2"
      }
    },
    "node_modules/@cloudbase/node-sdk": {
      "version": "2.10.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@cloudbase/node-sdk/-/node-sdk-2.10.0.tgz",
      "integrity": "sha512-P9loxdwN6qG3iIzjx2Z3uBk/4iyn9+KoiWYGi9ZwhWP1toijpQu0+eLSAaMupNJecJopS21IWUmmGSetlZh8UA==",
      "license": "MIT",
      "dependencies": {
        "@cloudbase/database": "1.4.1",
        "@cloudbase/signature-nodejs": "1.0.0-beta.0",
        "agentkeepalive": "^4.3.0",
        "axios": "^0.21.1",
        "jsonwebtoken": "^8.5.1",
        "request": "^2.87.0",
        "retry": "^0.13.1",
        "xml2js": "^0.5.0"
      },
      "engines": {
        "node": ">=8.6.0"
      }
    },
    "node_modules/@cloudbase/signature-nodejs": {
      "version": "1.0.0-beta.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@cloudbase/signature-nodejs/-/signature-nodejs-1.0.0-beta.0.tgz",
      "integrity": "sha512-gpKqwsVk/D2PzvFamYNReymXSdvRSY90eZ1ARf+1wZ8oT6OpK9kr6nmevGykMxN1n17Gn92hBbWqAxU9o3+kAQ==",
      "dependencies": {
        "@types/clone": "^0.1.30",
        "clone": "^2.1.2",
        "is-stream": "^2.0.0",
        "url": "^0.11.0"
      }
    },
    "node_modules/@protobufjs/aspromise": {
      "version": "1.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/aspromise/-/aspromise-1.1.2.tgz",
      "integrity": "sha512-j+gKExEuLmKwvz3OgROXtrJ2UG2x8Ch2YZUxahh+s1F2HZ+wAceUNLkvy6zKCPVRkU++ZWQrdxsUeQXmcg4uoQ==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/base64": {
      "version": "1.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/base64/-/base64-1.1.2.tgz",
      "integrity": "sha512-AZkcAA5vnN/v4PDqKyMR5lx7hZttPDgClv83E//FMNhR2TMcLUhfRUBHCmSl0oi9zMgDDqRUJkSxO3wm85+XLg==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/codegen": {
      "version": "2.0.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/codegen/-/codegen-2.0.4.tgz",
      "integrity": "sha512-YyFaikqM5sH0ziFZCN3xDC7zeGaB/d0IUb9CATugHWbd1FRFwWwt4ld4OYMPWu5a3Xe01mGAULCdqhMlPl29Jg==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/eventemitter": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/eventemitter/-/eventemitter-1.1.0.tgz",
      "integrity": "sha512-j9ednRT81vYJ9OfVuXG6ERSTdEL1xVsNgqpkxMsbIabzSo3goCjDIveeGv5d03om39ML71RdmrGNjG5SReBP/Q==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/fetch": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/fetch/-/fetch-1.1.0.tgz",
      "integrity": "sha512-lljVXpqXebpsijW71PZaCYeIcE5on1w5DlQy5WH6GLbFryLUrBD4932W/E2BSpfRJWseIL4v/KPgBFxDOIdKpQ==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@protobufjs/aspromise": "^1.1.1",
        "@protobufjs/inquire": "^1.1.0"
      }
    },
    "node_modules/@protobufjs/float": {
      "version": "1.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/float/-/float-1.0.2.tgz",
      "integrity": "sha512-Ddb+kVXlXst9d+R9PfTIxh1EdNkgoRe5tOX6t01f1lYWOvJnSPDBlG241QLzcyPdoNTsblLUdujGSE4RzrTZGQ==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/inquire": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/inquire/-/inquire-1.1.0.tgz",
      "integrity": "sha512-kdSefcPdruJiFMVSbn801t4vFK7KB/5gd2fYvrxhuJYg8ILrmn9SKSX2tZdV6V+ksulWqS7aXjBcRXl3wHoD9Q==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/path": {
      "version": "1.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/path/-/path-1.1.2.tgz",
      "integrity": "sha512-6JOcJ5Tm08dOHAbdR3GrvP+yUUfkjG5ePsHYczMFLq3ZmMkAD98cDgcT2iA1lJ9NVwFd4tH/iSSoe44YWkltEA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/pool": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/pool/-/pool-1.1.0.tgz",
      "integrity": "sha512-0kELaGSIDBKvcgS4zkjz1PeddatrjYcmMWOlAuAPwAeccUrPHdUqo/J6LiymHHEiJT5NrF1UVwxY14f+fy4WQw==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/utf8": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@protobufjs/utf8/-/utf8-1.1.0.tgz",
      "integrity": "sha512-Vvn3zZrhQZkkBE8LSuW3em98c0FwgO4nxzv6OdSxPKJIEKY2bGbHn+mhGIPerzI4twdxaP8/0+06HBpwf345Lw==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@types/clone": {
      "version": "0.1.30",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@types/clone/-/clone-0.1.30.tgz",
      "integrity": "sha512-vcxBr+ybljeSiasmdke1cQ9ICxoEwaBgM1OQ/P5h4MPj/kRyLcDl5L8PrftlbyV1kBbJIs3M3x1A1+rcWd4mEA==",
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "24.10.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/@types/node/-/node-24.10.0.tgz",
      "integrity": "sha512-qzQZRBqkFsYyaSWXuEHc2WR9c0a0CXwiE5FWUvn7ZM+vdy1uZLfCunD38UzhuB7YN/J11ndbDBcTmOdxJo9Q7A==",
      "license": "MIT",
      "dependencies": {
        "undici-types": "~7.16.0"
      }
    },
    "node_modules/agentkeepalive": {
      "version": "4.6.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/agentkeepalive/-/agentkeepalive-4.6.0.tgz",
      "integrity": "sha512-kja8j7PjmncONqaTsB8fQ+wE2mSU2DJ9D4XKoJ5PFWIdRMa6SLSN1ff4mOr4jCbfRSsxR4keIiySJU0N9T5hIQ==",
      "license": "MIT",
      "dependencies": {
        "humanize-ms": "^1.2.1"
      },
      "engines": {
        "node": ">= 8.0.0"
      }
    },
    "node_modules/ajv": {
      "version": "6.12.6",
      "resolved": "https://mirrors.cloud.tencent.com/npm/ajv/-/ajv-6.12.6.tgz",
      "integrity": "sha512-j3fVLgvTo527anyYyJOGTYJbG+vnnQYvE0m5mmkc1TK+nxAppkCLMIL0aZ4dblVCNoGShhm+kzE4ZUykBoMg4g==",
      "license": "MIT",
      "dependencies": {
        "fast-deep-equal": "^3.1.1",
        "fast-json-stable-stringify": "^2.0.0",
        "json-schema-traverse": "^0.4.1",
        "uri-js": "^4.2.2"
      },
      "funding": {
        "type": "github",
        "url": "https://github.com/sponsors/epoberezkin"
      }
    },
    "node_modules/asn1": {
      "version": "0.2.6",
      "resolved": "https://mirrors.cloud.tencent.com/npm/asn1/-/asn1-0.2.6.tgz",
      "integrity": "sha512-ix/FxPn0MDjeyJ7i/yoHGFt/EX6LyNbxSEhPPXODPL+KB0VPk86UYfL0lMdy+KCnv+fmvIzySwaK5COwqVbWTQ==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": "~2.1.0"
      }
    },
    "node_modules/assert-plus": {
      "version": "1.0.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/assert-plus/-/assert-plus-1.0.0.tgz",
      "integrity": "sha512-NfJ4UzBCcQGLDlQq7nHxH+tv3kyZ0hHQqF5BO6J7tNJeP5do1llPr8dZ8zHonfhAu0PHAdMkSo+8o0wxg9lZWw==",
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "license": "MIT"
    },
    "node_modules/aws-sign2": {
      "version": "0.7.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/aws-sign2/-/aws-sign2-0.7.0.tgz",
      "integrity": "sha512-08kcGqnYf/YmjoRhfxyu+CLxBjUtHLXLXX/vUfx9l2LYzG3c1m61nrpyFUZI6zeS+Li/wWMMidD9KgrqtGq3mA==",
      "license": "Apache-2.0",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/aws4": {
      "version": "1.13.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/aws4/-/aws4-1.13.2.tgz",
      "integrity": "sha512-lHe62zvbTB5eEABUVi/AwVh0ZKY9rMMDhmm+eeyuuUQbQ3+J+fONVQOZyj+DdrvD4BY33uYniyRJ4UJIaSKAfw==",
      "license": "MIT"
    },
    "node_modules/axios": {
      "version": "0.21.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/axios/-/axios-0.21.4.tgz",
      "integrity": "sha512-ut5vewkiu8jjGBdqpM44XxjuCjq9LAKeHVmoVfHVzy8eHgxxq8SbAVQNovDA8mVi05kP0Ea/n/UzcSHcTJQfNg==",
      "license": "MIT",
      "dependencies": {
        "follow-redirects": "^1.14.0"
      }
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/bcrypt-pbkdf": {
      "version": "1.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/bcrypt-pbkdf/-/bcrypt-pbkdf-1.0.2.tgz",
      "integrity": "sha512-qeFIXtP4MSoi6NLqO12WfqARWWuCKi2Rn/9hJLEmtB5yTNr9DqFWkJRCf2qShWzPeAMRnOgCrq0sg/KLv5ES9w==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "tweetnacl": "^0.14.3"
      }
    },
    "node_modules/bignumber.js": {
      "version": "9.3.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/bignumber.js/-/bignumber.js-9.3.1.tgz",
      "integrity": "sha512-Ko0uX15oIUS7wJ3Rb30Fs6SkVbLmPBAKdlm7q9+ak9bbIeFf0MwuBsQV6z7+X768/cHsfg+WlysDWJcmthjsjQ==",
      "license": "MIT",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/bson": {
      "version": "4.7.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/bson/-/bson-4.7.2.tgz",
      "integrity": "sha512-Ry9wCtIZ5kGqkJoi6aD8KjxFZEx78guTQDnpXWiNthsxzrxAK/i8E6pCHAIZTbaEFWcOCvbecMukfK7XUvyLpQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "buffer": "^5.6.0"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/buffer": {
      "version": "5.7.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/buffer/-/buffer-5.7.1.tgz",
      "integrity": "sha512-EHcyIPBQ4BSGlvjB16k5KgAJ27CIsHY/2JBmCRReo48y9rQ3MaUzWX3KVlBa4U7MyX02HdVj0K7C3WaB3ju7FQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "dependencies": {
        "base64-js": "^1.3.1",
        "ieee754": "^1.1.13"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/caseless": {
      "version": "0.12.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/caseless/-/caseless-0.12.0.tgz",
      "integrity": "sha512-4tYFyifaFfGacoiObjJegolkwSU4xQNGbVgUiNYVUxbQ2x2lUsFvY4hVgVzGiIe6WLOPqycWXA40l+PWsxthUw==",
      "license": "Apache-2.0"
    },
    "node_modules/clone": {
      "version": "2.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/clone/-/clone-2.1.2.tgz",
      "integrity": "sha512-3Pe/CF1Nn94hyhIYpjtiLhdCoEoz0DqQ+988E9gmeEdQZlojxnOb74wctFyuwWQHzqyf9X7C7MG8juUpqBJT8w==",
      "license": "MIT",
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://mirrors.cloud.tencent.com/npm/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "license": "MIT",
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/core-util-is": {
      "version": "1.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/core-util-is/-/core-util-is-1.0.2.tgz",
      "integrity": "sha512-3lqz5YjWTYnW6dlDa5TLaTCcShfar1e40rmcJVwCBJC6mWlFuj0eCHIElmG1g5kyuJ/GD+8Wn4FFCcz4gJPfaQ==",
      "license": "MIT"
    },
    "node_modules/dashdash": {
      "version": "1.14.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/dashdash/-/dashdash-1.14.1.tgz",
      "integrity": "sha512-jRFi8UDGo6j+odZiEpjazZaWqEal3w/basFjQHQEwVtZJGDpxbH1MeYluwCS8Xq5wmLJooDlMgvVarmWfGM44g==",
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0"
      },
      "engines": {
        "node": ">=0.10"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "license": "MIT",
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/ecc-jsbn": {
      "version": "0.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/ecc-jsbn/-/ecc-jsbn-0.1.2.tgz",
      "integrity": "sha512-eh9O+hwRHNbG4BLTjEl3nw044CkGm5X6LoaCf7LPp7UU8Qrt47JYNi6nPX8xjW97TKGKm1ouctg0QSpZe9qrnw==",
      "license": "MIT",
      "dependencies": {
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.1.0"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://mirrors.cloud.tencent.com/npm/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/extend": {
      "version": "3.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/extend/-/extend-3.0.2.tgz",
      "integrity": "sha512-fjquC59cD7CyW6urNXK0FBufkZcoiGG80wTuPujX590cB5Ttln20E2UB4S/WARVqhXffZl2LNgS+gQdPIIim/g==",
      "license": "MIT"
    },
    "node_modules/extsprintf": {
      "version": "1.3.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/extsprintf/-/extsprintf-1.3.0.tgz",
      "integrity": "sha512-11Ndz7Nv+mvAC1j0ktTa7fAb0vLyGGX+rMHNBYQviQDGU0Hw7lhctJANqbPhu9nV9/izT/IntTgZ7Im/9LJs9g==",
      "engines": [
        "node >=0.6.0"
      ],
      "license": "MIT"
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT"
    },
    "node_modules/fast-json-stable-stringify": {
      "version": "2.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/fast-json-stable-stringify/-/fast-json-stable-stringify-2.1.0.tgz",
      "integrity": "sha512-lhd/wF+Lk98HZoTCtlVraHtfh5XYijIjalXck7saUtuanSDyLMxnHhSXEDJqHxD7msR8D0uCmqlkwjCV8xvwHw==",
      "license": "MIT"
    },
    "node_modules/follow-redirects": {
      "version": "1.15.11",
      "resolved": "https://mirrors.cloud.tencent.com/npm/follow-redirects/-/follow-redirects-1.15.11.tgz",
      "integrity": "sha512-deG2P0JfjrTxl50XGCDyfI97ZGVCxIpfKYmfyrQ54n5FO/0gfIES8C/Psl6kWVDolizcaaxZJnTS0QSMxvnsBQ==",
      "funding": [
        {
          "type": "individual",
          "url": "https://github.com/sponsors/RubenVerborgh"
        }
      ],
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      },
      "peerDependenciesMeta": {
        "debug": {
          "optional": true
        }
      }
    },
    "node_modules/forever-agent": {
      "version": "0.6.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/forever-agent/-/forever-agent-0.6.1.tgz",
      "integrity": "sha512-j0KLYPhm6zeac4lz3oJ3o65qvgQCcPubiyotZrXqEaG4hNagNYO8qdlUrX5vwqv9ohqeT/Z3j6+yW067yWWdUw==",
      "license": "Apache-2.0",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/form-data": {
      "version": "2.3.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/form-data/-/form-data-2.3.3.tgz",
      "integrity": "sha512-1lLKB2Mu3aGP1Q/2eCOx0fNbRMe7XdwktwOruhfqqd0rIJWwN4Dh+E3hrPSlDCXnSR7UtZ1N38rVXm+6+MEhJQ==",
      "license": "MIT",
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.6",
        "mime-types": "^2.1.12"
      },
      "engines": {
        "node": ">= 0.12"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/getpass": {
      "version": "0.1.7",
      "resolved": "https://mirrors.cloud.tencent.com/npm/getpass/-/getpass-0.1.7.tgz",
      "integrity": "sha512-0fzj9JxOLfJ+XGLhR8ze3unN0KZCgZwiSSDz168VERjK8Wl8kVSdcu2kspd4s4wtAa1y/qrVRiAA0WclVsu0ng==",
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/har-schema": {
      "version": "2.0.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/har-schema/-/har-schema-2.0.0.tgz",
      "integrity": "sha512-Oqluz6zhGX8cyRaTQlFMPw80bSJVG2x/cFb8ZPhUILGgHka9SsokCCOQgpveePerqidZOrT14ipqfJb7ILcW5Q==",
      "license": "ISC",
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/har-validator": {
      "version": "5.1.5",
      "resolved": "https://mirrors.cloud.tencent.com/npm/har-validator/-/har-validator-5.1.5.tgz",
      "integrity": "sha512-nmT2T0lljbxdQZfspsno9hgrG3Uir6Ks5afism62poxqBM6sDnMEuPmzTq8XN0OEwqKLLdh1jQI3qyE66Nzb3w==",
      "deprecated": "this library is no longer supported",
      "license": "MIT",
      "dependencies": {
        "ajv": "^6.12.3",
        "har-schema": "^2.0.0"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/http-signature": {
      "version": "1.2.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/http-signature/-/http-signature-1.2.0.tgz",
      "integrity": "sha512-CAbnr6Rz4CYQkLYUtSNXxQPUH2gK8f3iWexVlsnMeD+GjlsQ0Xsy1cOX+mN3dtxYomRy21CiOzU8Uhw6OwncEQ==",
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0",
        "jsprim": "^1.2.2",
        "sshpk": "^1.7.0"
      },
      "engines": {
        "node": ">=0.8",
        "npm": ">=1.3.7"
      }
    },
    "node_modules/humanize-ms": {
      "version": "1.2.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/humanize-ms/-/humanize-ms-1.2.1.tgz",
      "integrity": "sha512-Fl70vYtsAFb/C06PTS9dZBo7ihau+Tu/DNCk/OyHhea07S+aeMWpFFkUaXRa8fI+ScZbEI8dfSxwY7gxZ9SAVQ==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.0.0"
      }
    },
    "node_modules/ieee754": {
      "version": "1.2.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/ieee754/-/ieee754-1.2.1.tgz",
      "integrity": "sha512-dcyqhDvX1C46lXZcVqCpK+FtMRQVdIMN6/Df5js2zouUsqG7I6sFxitIC+7KYK29KdXOLHdu9zL4sFnoVQnqaA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "BSD-3-Clause"
    },
    "node_modules/is-stream": {
      "version": "2.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/is-stream/-/is-stream-2.0.1.tgz",
      "integrity": "sha512-hFoiJiTl63nn+kstHGBtewWSKnQLpyb155KHheA1l39uvtO9nWIop1p3udqPcUd/xbF1VLMO4n7OI6p7RbngDg==",
      "license": "MIT",
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/is-typedarray": {
      "version": "1.0.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/is-typedarray/-/is-typedarray-1.0.0.tgz",
      "integrity": "sha512-cyA56iCMHAh5CdzjJIa4aohJyeO1YbwLi3Jc35MmRU6poroFjIGZzUzupGiRPOjgHg9TLu43xbpwXk523fMxKA==",
      "license": "MIT"
    },
    "node_modules/isstream": {
      "version": "0.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/isstream/-/isstream-0.1.2.tgz",
      "integrity": "sha512-Yljz7ffyPbrLpLngrMtZ7NduUgVvi6wG9RJ9IUcyCd59YQ911PBJphODUcbOVbqYfxe1wuYf/LJ8PauMRwsM/g==",
      "license": "MIT"
    },
    "node_modules/jsbn": {
      "version": "0.1.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/jsbn/-/jsbn-0.1.1.tgz",
      "integrity": "sha512-UVU9dibq2JcFWxQPA6KCqj5O42VOmAY3zQUfEKxU0KpTGXwNoCjkX1e13eHNvw/xPynt6pU0rZ1htjWTNTSXsg==",
      "license": "MIT"
    },
    "node_modules/json-bigint": {
      "version": "1.0.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/json-bigint/-/json-bigint-1.0.0.tgz",
      "integrity": "sha512-SiPv/8VpZuWbvLSMtTDU8hEfrZWg/mH/nV/b4o0CYbSxu1UIQPLdwKOCIyLQX+VIPO5vrLX3i8qtqFyhdPSUSQ==",
      "license": "MIT",
      "dependencies": {
        "bignumber.js": "^9.0.0"
      }
    },
    "node_modules/json-schema": {
      "version": "0.4.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/json-schema/-/json-schema-0.4.0.tgz",
      "integrity": "sha512-es94M3nTIfsEPisRafak+HDLfHXnKBhV3vU5eqPcS3flIWqcxJWgXHXiey3YrpaNsanY5ei1VoYEbOzijuq9BA==",
      "license": "(AFL-2.1 OR BSD-3-Clause)"
    },
    "node_modules/json-schema-traverse": {
      "version": "0.4.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/json-schema-traverse/-/json-schema-traverse-0.4.1.tgz",
      "integrity": "sha512-xbbCH5dCYU5T8LcEhhuh7HJ88HXuW3qsI3Y0zOZFKfZEHcpWiHU/Jxzk629Brsab/mMiHQti9wMP+845RPe3Vg==",
      "license": "MIT"
    },
    "node_modules/json-stringify-safe": {
      "version": "5.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/json-stringify-safe/-/json-stringify-safe-5.0.1.tgz",
      "integrity": "sha512-ZClg6AaYvamvYEE82d3Iyd3vSSIjQ+odgjaTzRuO3s7toCdFKczob2i0zCh7JE8kWn17yvAWhUVxvqGwUalsRA==",
      "license": "ISC"
    },
    "node_modules/jsonwebtoken": {
      "version": "8.5.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/jsonwebtoken/-/jsonwebtoken-8.5.1.tgz",
      "integrity": "sha512-XjwVfRS6jTMsqYs0EsuJ4LGxXV14zQybNd4L2r0UvbVnSF9Af8x7p5MzbJ90Ioz/9TI41/hTCvznF/loiSzn8w==",
      "license": "MIT",
      "dependencies": {
        "jws": "^3.2.2",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^5.6.0"
      },
      "engines": {
        "node": ">=4",
        "npm": ">=1.4.28"
      }
    },
    "node_modules/jsprim": {
      "version": "1.4.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/jsprim/-/jsprim-1.4.2.tgz",
      "integrity": "sha512-P2bSOMAc/ciLz6DzgjVlGJP9+BrJWu5UDGK70C2iweC5QBIeFf0ZXRvGjEj2uYgrY2MkAAhsSWHDWlFtEroZWw==",
      "license": "MIT",
      "dependencies": {
        "assert-plus": "1.0.0",
        "extsprintf": "1.3.0",
        "json-schema": "0.4.0",
        "verror": "1.10.0"
      },
      "engines": {
        "node": ">=0.6.0"
      }
    },
    "node_modules/jwa": {
      "version": "1.4.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/jwa/-/jwa-1.4.2.tgz",
      "integrity": "sha512-eeH5JO+21J78qMvTIDdBXidBd6nG2kZjg5Ohz/1fpa28Z4CcsWUzJ1ZZyFq/3z3N17aZy+ZuBoHljASbL1WfOw==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jws": {
      "version": "3.2.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/jws/-/jws-3.2.2.tgz",
      "integrity": "sha512-YHlZCB6lMTllWDtSPHz/ZXTsi8S00usEV6v1tjq8tOUZzw7DpSDWVXjXDre6ed1w/pd495ODpHZYSdkRTsa0HA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^1.4.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/lodash.clonedeep": {
      "version": "4.5.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.clonedeep/-/lodash.clonedeep-4.5.0.tgz",
      "integrity": "sha512-H5ZhCF25riFd9uB5UCkVKo61m3S/xZk1x4wA6yp/L3RFP6Z/eHH1ymQcGLo7J3GMPfm0V/7m1tryHuGVxpqEBQ==",
      "license": "MIT"
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/lodash.set": {
      "version": "4.3.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.set/-/lodash.set-4.3.2.tgz",
      "integrity": "sha512-4hNPN5jlm/N/HLMCO43v8BXKq9Z7QdAGc/VGrRD61w8gN9g/6jF9A4L1pbUgBLCffi0w9VsXfTOij5x8iTyFvg==",
      "license": "MIT"
    },
    "node_modules/lodash.unset": {
      "version": "4.5.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/lodash.unset/-/lodash.unset-4.5.2.tgz",
      "integrity": "sha512-bwKX88k2JhCV9D1vtE8+naDKlLiGrSmf8zi/Y9ivFHwbmRfA8RxS/aVJ+sIht2XOwqoNr4xUPUkGZpc1sHFEKg==",
      "license": "MIT"
    },
    "node_modules/long": {
      "version": "5.3.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/long/-/long-5.3.2.tgz",
      "integrity": "sha512-mNAgZ1GmyNhD7AuqnTG3/VQ26o760+ZYBPKjPvugO8+nLbYfX6TVpJPseBvopbdY+qpZ/lKUnmEc1LeZYS3QAA==",
      "license": "Apache-2.0"
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://mirrors.cloud.tencent.com/npm/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/oauth-sign": {
      "version": "0.9.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/oauth-sign/-/oauth-sign-0.9.0.tgz",
      "integrity": "sha512-fexhUFFPTGV8ybAtSIGbV6gOkSv8UtRbDBnAyLQw4QPKkgNlsH2ByPGtMUqdWkos6YCRmAqViwgZrJc/mRDzZQ==",
      "license": "Apache-2.0",
      "engines": {
        "node": "*"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/performance-now": {
      "version": "2.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/performance-now/-/performance-now-2.1.0.tgz",
      "integrity": "sha512-7EAHlyLHI56VEIdK57uwHdHKIaAGbnXPiw0yWbarQZOKaKpvUIgW0jWRVLiatnM+XXlSwsanIBH/hzGMJulMow==",
      "license": "MIT"
    },
    "node_modules/protobufjs": {
      "version": "7.5.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/protobufjs/-/protobufjs-7.5.4.tgz",
      "integrity": "sha512-CvexbZtbov6jW2eXAvLukXjXUW1TzFaivC46BpWc/3BpcCysb5Vffu+B3XHMm8lVEuy2Mm4XGex8hBSg1yapPg==",
      "hasInstallScript": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "@protobufjs/aspromise": "^1.1.2",
        "@protobufjs/base64": "^1.1.2",
        "@protobufjs/codegen": "^2.0.4",
        "@protobufjs/eventemitter": "^1.1.0",
        "@protobufjs/fetch": "^1.1.0",
        "@protobufjs/float": "^1.0.2",
        "@protobufjs/inquire": "^1.1.0",
        "@protobufjs/path": "^1.1.2",
        "@protobufjs/pool": "^1.1.0",
        "@protobufjs/utf8": "^1.1.0",
        "@types/node": ">=13.7.0",
        "long": "^5.0.0"
      },
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/psl": {
      "version": "1.15.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/psl/-/psl-1.15.0.tgz",
      "integrity": "sha512-JZd3gMVBAVQkSs6HdNZo9Sdo0LNcQeMNP3CozBJb3JYC/QUYZTnKxP+f8oWRX4rHP5EurWxqAHTSwUCjlNKa1w==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^2.3.1"
      },
      "funding": {
        "url": "https://github.com/sponsors/lupomontero"
      }
    },
    "node_modules/punycode": {
      "version": "2.3.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/punycode/-/punycode-2.3.1.tgz",
      "integrity": "sha512-vYt7UD1U9Wg6138shLtLOvdAu+8DsC/ilFtEVHcH+wydcSpNE20AfSOduf6MkRFahL5FY7X1oU7nKVZFtfq8Fg==",
      "license": "MIT",
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/qs": {
      "version": "6.5.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/qs/-/qs-6.5.3.tgz",
      "integrity": "sha512-qxXIEh4pCGfHICj1mAJQ2/2XVZkjCDTcEgfoSQxc/fYivUZxTkk7L3bDBJSoNrEzXI17oUO5Dp07ktqE5KzczA==",
      "license": "BSD-3-Clause",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/request": {
      "version": "2.88.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/request/-/request-2.88.2.tgz",
      "integrity": "sha512-MsvtOrfG9ZcrOwAW+Qi+F6HbD0CWXEh9ou77uOb7FM2WPhwT7smM833PzanhJLsgXjN89Ir6V2PczXNnMpwKhw==",
      "deprecated": "request has been deprecated, see https://github.com/request/request/issues/3142",
      "license": "Apache-2.0",
      "dependencies": {
        "aws-sign2": "~0.7.0",
        "aws4": "^1.8.0",
        "caseless": "~0.12.0",
        "combined-stream": "~1.0.6",
        "extend": "~3.0.2",
        "forever-agent": "~0.6.1",
        "form-data": "~2.3.2",
        "har-validator": "~5.1.3",
        "http-signature": "~1.2.0",
        "is-typedarray": "~1.0.0",
        "isstream": "~0.1.2",
        "json-stringify-safe": "~5.0.1",
        "mime-types": "~2.1.19",
        "oauth-sign": "~0.9.0",
        "performance-now": "^2.1.0",
        "qs": "~6.5.2",
        "safe-buffer": "^5.1.2",
        "tough-cookie": "~2.5.0",
        "tunnel-agent": "^0.6.0",
        "uuid": "^3.3.2"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/retry": {
      "version": "0.13.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/retry/-/retry-0.13.1.tgz",
      "integrity": "sha512-XQBQ3I8W1Cge0Seh+6gjj03LbmRFWuoszgK9ooCpwYIrhhoO80pfq4cUkU5DkknwfOfFteRwlZ56PYOGYyFWdg==",
      "license": "MIT",
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/sax": {
      "version": "1.4.3",
      "resolved": "https://mirrors.cloud.tencent.com/npm/sax/-/sax-1.4.3.tgz",
      "integrity": "sha512-yqYn1JhPczigF94DMS+shiDMjDowYO6y9+wB/4WgO0Y19jWYk0lQ4tuG5KI7kj4FTp1wxPj5IFfcrz/s1c3jjQ==",
      "license": "BlueOak-1.0.0"
    },
    "node_modules/semver": {
      "version": "5.7.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/semver/-/semver-5.7.2.tgz",
      "integrity": "sha512-cBznnQ9KjJqU67B52RMC65CMarK2600WFnbkcaiwWq3xy/5haFJlshgnpjovMVJ+Hff49d8GEn0b87C5pDQ10g==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver"
      }
    },
    "node_modules/side-channel": {
      "version": "1.1.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/side-channel/-/side-channel-1.1.0.tgz",
      "integrity": "sha512-ZX99e6tRweoUXqR+VBrslhda51Nh5MTQwou5tnUDgbtyM0dBgmhEDtWGP/xbKn6hqfPRHujUNwz5fy/wbbhnpw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3",
        "side-channel-list": "^1.0.0",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/side-channel-list/-/side-channel-list-1.0.0.tgz",
      "integrity": "sha512-FCLHtRD/gnpCiCHEiJLOwdmFP+wzCmDEkc9y7NsYxeF4u7Btsn1ZuwgwJGxImImHicJArLP4R0yX4c2KCrMrTA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://mirrors.cloud.tencent.com/npm/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/sshpk": {
      "version": "1.18.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/sshpk/-/sshpk-1.18.0.tgz",
      "integrity": "sha512-2p2KJZTSqQ/I3+HX42EpYOa2l3f8Erv8MWKsy2I9uf4wA7yFIkXRffYdsx86y6z4vHtV8u7g+pPlr8/4ouAxsQ==",
      "license": "MIT",
      "dependencies": {
        "asn1": "~0.2.3",
        "assert-plus": "^1.0.0",
        "bcrypt-pbkdf": "^1.0.0",
        "dashdash": "^1.12.0",
        "ecc-jsbn": "~0.1.1",
        "getpass": "^0.1.1",
        "jsbn": "~0.1.0",
        "safer-buffer": "^2.0.2",
        "tweetnacl": "~0.14.0"
      },
      "bin": {
        "sshpk-conv": "bin/sshpk-conv",
        "sshpk-sign": "bin/sshpk-sign",
        "sshpk-verify": "bin/sshpk-verify"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/tough-cookie": {
      "version": "2.5.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/tough-cookie/-/tough-cookie-2.5.0.tgz",
      "integrity": "sha512-nlLsUzgm1kfLXSXfRZMc1KLAugd4hqJHDTvc2hDIwS3mZAfMEuMbc03SujMF+GEcpaX/qboeycw6iO8JwVv2+g==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "psl": "^1.1.28",
        "punycode": "^2.1.1"
      },
      "engines": {
        "node": ">=0.8"
      }
    },
    "node_modules/tslib": {
      "version": "1.14.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/tslib/-/tslib-1.14.1.tgz",
      "integrity": "sha512-Xni35NKzjgMrwevysHTCArtLDpPvye8zV/0E4EyYn43P7/7qvQwPh9BGkHewbMulVntbigmcT7rdX3BNo9wRJg==",
      "license": "0BSD"
    },
    "node_modules/tunnel-agent": {
      "version": "0.6.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/tunnel-agent/-/tunnel-agent-0.6.0.tgz",
      "integrity": "sha512-McnNiV1l8RYeY8tBgEpuodCC1mLUdbSN+CYBL7kJsJNInOP8UjDDEwdk6Mw60vdLLrr5NHKZhMAOSrR2NZuQ+w==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      },
      "engines": {
        "node": "*"
      }
    },
    "node_modules/tweetnacl": {
      "version": "0.14.5",
      "resolved": "https://mirrors.cloud.tencent.com/npm/tweetnacl/-/tweetnacl-0.14.5.tgz",
      "integrity": "sha512-KXXFFdAbFXY4geFIwoyNK+f5Z1b7swfXABfL7HXCmoIWMKU3dmS26672A4EeQtDzLKy7SXmfBu51JolvEKwtGA==",
      "license": "Unlicense"
    },
    "node_modules/undici-types": {
      "version": "7.16.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/undici-types/-/undici-types-7.16.0.tgz",
      "integrity": "sha512-Zz+aZWSj8LE6zoxD+xrjh4VfkIG8Ya6LvYkZqtUQGJPZjYl53ypCaUwWqo7eI0x66KBGeRo+mlBEkMSeSZ38Nw==",
      "license": "MIT"
    },
    "node_modules/uri-js": {
      "version": "4.4.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/uri-js/-/uri-js-4.4.1.tgz",
      "integrity": "sha512-7rKUyy33Q1yc98pQ1DAmLtwX109F7TIfWlW1Ydo8Wl1ii1SeHieeh0HHfPeL2fMXK6z0s8ecKs9frCuLJvndBg==",
      "license": "BSD-2-Clause",
      "dependencies": {
        "punycode": "^2.1.0"
      }
    },
    "node_modules/url": {
      "version": "0.11.4",
      "resolved": "https://mirrors.cloud.tencent.com/npm/url/-/url-0.11.4.tgz",
      "integrity": "sha512-oCwdVC7mTuWiPyjLUz/COz5TLk6wgp0RCsN+wHZ2Ekneac9w8uuV0njcbbie2ME+Vs+d6duwmYuR3HgQXs1fOg==",
      "license": "MIT",
      "dependencies": {
        "punycode": "^1.4.1",
        "qs": "^6.12.3"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/url/node_modules/punycode": {
      "version": "1.4.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/punycode/-/punycode-1.4.1.tgz",
      "integrity": "sha512-jmYNElW7yvO7TV33CjSmvSiE2yco3bV2czu/OzDKdMNVZQWfxCblURLhf+47syQRBntjfLdd/H0egrzIG+oaFQ==",
      "license": "MIT"
    },
    "node_modules/url/node_modules/qs": {
      "version": "6.14.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/qs/-/qs-6.14.0.tgz",
      "integrity": "sha512-YWWTjgABSKcvs/nWBi9PycY/JiPJqOD4JA6o9Sej2AtvSGarXxKC3OQSk4pAarbdQlKAh5D4FCQkJNkW+GAn3w==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/uuid": {
      "version": "3.4.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/uuid/-/uuid-3.4.0.tgz",
      "integrity": "sha512-HjSDRw6gZE5JMggctHBcjVak08+KEVhSIiDzFnT9S9aegmp85S/bReBVTb4QTFaRNptJ9kuYaNhnbNEOkbKb/A==",
      "deprecated": "Please upgrade  to version 7 or higher.  Older versions may use Math.random() in certain circumstances, which is known to be problematic.  See https://v8.dev/blog/math-random for details.",
      "license": "MIT",
      "bin": {
        "uuid": "bin/uuid"
      }
    },
    "node_modules/verror": {
      "version": "1.10.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/verror/-/verror-1.10.0.tgz",
      "integrity": "sha512-ZZKSmDAEFOijERBLkmYfJ+vmk3w+7hOLYDNkRCuRuMJGEmqYNCNLyBBFwWKVMhfwaEF3WOd0Zlw86U/WC/+nYw==",
      "engines": [
        "node >=0.6.0"
      ],
      "license": "MIT",
      "dependencies": {
        "assert-plus": "^1.0.0",
        "core-util-is": "1.0.2",
        "extsprintf": "^1.2.0"
      }
    },
    "node_modules/wx-server-sdk": {
      "version": "3.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/wx-server-sdk/-/wx-server-sdk-3.0.1.tgz",
      "integrity": "sha512-b53tbqTV9knXJIfcmWTmksQvk+BC54vTU6WZNwEvAJ3iOxrRhPitcygyiwFfMBWpFm9YvkwITEhU821XoG8llQ==",
      "license": "MIT",
      "dependencies": {
        "@cloudbase/node-sdk": "2.10.0",
        "json-bigint": "^1.0.0",
        "protobufjs": "^7.2.4",
        "tslib": "^1.9.3"
      }
    },
    "node_modules/xml2js": {
      "version": "0.5.0",
      "resolved": "https://mirrors.cloud.tencent.com/npm/xml2js/-/xml2js-0.5.0.tgz",
      "integrity": "sha512-drPFnkQJik/O+uPKpqSgr22mpuFHqKdbS835iAQrUC73L2F5WkboIRd63ai/2Yg6I1jzifPFKH2NTK+cfglkIA==",
      "license": "MIT",
      "dependencies": {
        "sax": ">=0.6.0",
        "xmlbuilder": "~11.0.0"
      },
      "engines": {
        "node": ">=4.0.0"
      }
    },
    "node_modules/xmlbuilder": {
      "version": "11.0.1",
      "resolved": "https://mirrors.cloud.tencent.com/npm/xmlbuilder/-/xmlbuilder-11.0.1.tgz",
      "integrity": "sha512-fDlsI/kFEx7gLvbecc0/ohLG50fugQp8ryHzMTuW9vSa1GJ0XYWKnhsUx7oie3G98+r56aTQIUB4kht42R3JvA==",
      "license": "MIT",
      "engines": {
        "node": ">=4.0"
      }
    }
  }
}


// file: apps/admin/cloudfunctions/catalog_search/package.json
{
  "name": "catalog_search",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/confirm_session/index.js
// confirm_session - 确认训练会话
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { sessionId } = event;

  if (!sessionId) {
    throw new Error('参数不完整：需要 sessionId');
  }

  const tenantId = 't_default';
  const now = new Date();

  try {
    // 查询会话
    const sessionQuery = await db.collection('sessions')
      .doc(sessionId)
      .get();

    if (!sessionQuery.data) {
      throw new Error('会话不存在');
    }

    const session = sessionQuery.data;

    // 更新会话状态为 confirmed
    await db.collection('sessions')
      .doc(sessionId)
      .update({
        data: {
          status: 'confirmed',
          updatedAt: now
        }
      });

    // 返回会话详情（包含时间信息）
    return {
      sessionId: sessionId,
      startAt: session.startAt,
      endAt: session.endAt,
      title: session.title,
      coachId: session.coachId,
      userId: session.userId,
      status: 'confirmed'
    };
  } catch (error) {
    throw new Error(`确认会话失败: ${error.message}`);
  }
};


// file: apps/admin/cloudfunctions/confirm_session/package.json
{
  "name": "confirm_session",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}


// file: apps/admin/cloudfunctions/quickstartFunctions/config.json
{
  "permissions": {
    "openapi": [
      "wxacode.get"
    ]
  }
}

// file: apps/admin/cloudfunctions/quickstartFunctions/index.js
const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
// 获取openid
const getOpenId = async () => {
  // 获取基础信息
  const wxContext = cloud.getWXContext();
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  };
};

// 获取小程序二维码
const getMiniProgramCode = async () => {
  // 获取小程序二维码的buffer
  const resp = await cloud.openapi.wxacode.get({
    path: "pages/index/index",
  });
  const { buffer } = resp;
  // 将图片上传云存储空间
  const upload = await cloud.uploadFile({
    cloudPath: "code.png",
    fileContent: buffer,
  });
  return upload.fileID;
};

// 创建集合
const createCollection = async () => {
  try {
    // 创建集合
    await db.createCollection("sales");
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "上海",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华东",
        city: "南京",
        sales: 11,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "广州",
        sales: 22,
      },
    });
    await db.collection("sales").add({
      // data 字段表示需新增的 JSON 数据
      data: {
        region: "华南",
        city: "深圳",
        sales: 22,
      },
    });
    return {
      success: true,
    };
  } catch (e) {
    // 这里catch到的是该collection已经存在，从业务逻辑上来说是运行成功的，所以catch返回success给前端，避免工具在前端抛出异常
    return {
      success: true,
      data: "create collection success",
    };
  }
};

// 查询数据
const selectRecord = async () => {
  // 返回数据库查询结果
  return await db.collection("sales").get();
};

// 更新数据
const updateRecord = async (event) => {
  try {
    // 遍历修改数据库信息
    for (let i = 0; i < event.data.length; i++) {
      await db
        .collection("sales")
        .where({
          _id: event.data[i]._id,
        })
        .update({
          data: {
            sales: event.data[i].sales,
          },
        });
    }
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 新增数据
const insertRecord = async (event) => {
  try {
    const insertRecord = event.data;
    // 插入数据
    await db.collection("sales").add({
      data: {
        region: insertRecord.region,
        city: insertRecord.city,
        sales: Number(insertRecord.sales),
      },
    });
    return {
      success: true,
      data: event.data,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// 删除数据
const deleteRecord = async (event) => {
  try {
    await db
      .collection("sales")
      .where({
        _id: event.data._id,
      })
      .remove();
    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      errMsg: e,
    };
  }
};

// const getOpenId = require('./getOpenId/index');
// const getMiniProgramCode = require('./getMiniProgramCode/index');
// const createCollection = require('./createCollection/index');
// const selectRecord = require('./selectRecord/index');
// const updateRecord = require('./updateRecord/index');
// const sumRecord = require('./sumRecord/index');
// const fetchGoodsList = require('./fetchGoodsList/index');
// const genMpQrcode = require('./genMpQrcode/index');
// 云函数入口函数
exports.main = async (event, context) => {
  switch (event.type) {
    case "getOpenId":
      return await getOpenId();
    case "getMiniProgramCode":
      return await getMiniProgramCode();
    case "createCollection":
      return await createCollection();
    case "selectRecord":
      return await selectRecord();
    case "updateRecord":
      return await updateRecord(event);
    case "insertRecord":
      return await insertRecord(event);
    case "deleteRecord":
      return await deleteRecord(event);
  }
};


// file: apps/admin/cloudfunctions/quickstartFunctions/package.json
{
  "name": "quickstartFunctions",
  "version": "0.0.1",
  "main": "index.js",
  "engines": {
    "node": ">=14"
  },
  "dependencies": {}
}

// file: apps/admin/cloudfunctions/report_and_deduct/index.js
// report_and_deduct - 训练报告与扣款
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { sessionId, report, deductAmount } = event;

  // 参数验证
  if (!sessionId || !report || typeof deductAmount !== 'number') {
    throw new Error('参数不完整：需要 sessionId, report, deductAmount');
  }

  if (deductAmount < 0) {
    throw new Error('扣款金额不能为负数');
  }

  const tenantId = 't_default';
  const now = new Date();

  try {
    // 开启事务
    const result = await db.runTransaction(async transaction => {
      // 1. 查询会话
      const sessionDoc = await transaction.collection('sessions').doc(sessionId).get();
      
      if (!sessionDoc.data) {
        throw new Error('会话不存在');
      }

      const session = sessionDoc.data;

      if (session.status === 'done') {
        throw new Error('会话已完成，无法重复操作');
      }

      const userId = session.userId;

      // 2. 查询钱包
      const walletQuery = await transaction.collection('wallets')
        .where({
          userId: userId,
          tenantId: tenantId
        })
        .get();

      if (walletQuery.data.length === 0) {
        throw new Error('用户钱包不存在');
      }

      const wallet = walletQuery.data[0];
      const walletId = wallet._id;

      // 3. 检查余额
      if (wallet.balance < deductAmount) {
        throw new Error('余额不足');
      }

      // 4. 更新钱包余额
      const newBalance = wallet.balance - deductAmount;
      await transaction.collection('wallets')
        .doc(walletId)
        .update({
          data: {
            balance: newBalance,
            updatedAt: now
          }
        });

      // 5. 写入训练报告
      const reportResult = await transaction.collection('training_reports').add({
        data: {
          sessionId: sessionId,
          userId: userId,
          tenantId: tenantId,
          report: report,
          createdAt: now,
          updatedAt: now
        }
      });

      // 6. 记录钱包交易
      await transaction.collection('wallet_txns').add({
        data: {
          walletId: walletId,
          userId: userId,
          tenantId: tenantId,
          type: 'deduct',
          amount: deductAmount,
          balanceBefore: wallet.balance,
          balanceAfter: newBalance,
          relatedId: sessionId,
          relatedType: 'session',
          remark: `训练会话扣款: ${session.title || sessionId}`,
          createdAt: now
        }
      });

      // 7. 更新会话状态为 done
      await transaction.collection('sessions')
        .doc(sessionId)
        .update({
          data: {
            status: 'done',
            updatedAt: now
          }
        });

      return {
        ok: true,
        balance: newBalance
      };
    });

    return result;
  } catch (error) {
    throw new Error(`处理失败: ${error.message}`);
  }
};


// file: apps/admin/cloudfunctions/report_and_deduct/package.json
{
  "name": "report_and_deduct",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}


// file: apps/admin/cloudfunctions/seed_training_catalog/index.js
// 幂等灌库：没有就插入；已有就更新字段（补齐 muscleGroup / defaultLoad 等）

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

exports.main = async () => {
  const tenantId = 't_default';
  const rows = [
    // 胸
    { code: 'BENCH_BAR', name: '杠铃卧推', muscleGroup: '胸', unit: 'kg', defaultLoad: 20 },
    { code: 'BENCH_DB', name: '哑铃卧推', muscleGroup: '胸', unit: 'kg', defaultLoad: 12 },
    { code: 'INCLINE_DB', name: '上斜哑铃卧推', muscleGroup: '胸', unit: 'kg', defaultLoad: 10 },
    { code: 'FLY_DB', name: '哑铃飞鸟', muscleGroup: '胸', unit: 'kg', defaultLoad: 6 },
    // 背
    { code: 'ROW_BAR', name: '杠铃划船', muscleGroup: '背', unit: 'kg', defaultLoad: 30 },
    { code: 'ROW_DB', name: '单臂哑铃划船', muscleGroup: '背', unit: 'kg', defaultLoad: 16 },
    { code: 'PULLDOWN', name: '高位下拉', muscleGroup: '背', unit: 'kg', defaultLoad: 25 },
    { code: 'PULLUP', name: '引体向上', muscleGroup: '背', unit: '次', defaultLoad: 5 },
    // 下肢
    { code: 'SQUAT_BAR', name: '杠铃深蹲', muscleGroup: '下肢', unit: 'kg', defaultLoad: 40 },
    { code: 'SPLIT_SQ', name: '保加利亚分腿蹲', muscleGroup: '下肢', unit: 'kg', defaultLoad: 10 },
    { code: 'LUNGE', name: '弓步蹲', muscleGroup: '下肢', unit: 'kg', defaultLoad: 8 },
    // 后链
    { code: 'DEADLIFT', name: '硬拉', muscleGroup: '后链', unit: 'kg', defaultLoad: 50 },
    { code: 'RDL', name: '罗马尼亚硬拉', muscleGroup: '后链', unit: 'kg', defaultLoad: 40 },
    { code: 'HIP_THRUST', name: '臀桥', muscleGroup: '后链', unit: 'kg', defaultLoad: 40 },
    // 核心
    { code: 'PLANK', name: '平板支撑', muscleGroup: '核心', unit: '秒', defaultLoad: 30 },
    { code: 'HANG_LEG', name: '悬垂举腿', muscleGroup: '核心', unit: '次', defaultLoad: 10 },
    { code: 'CRUNCH', name: '卷腹', muscleGroup: '核心', unit: '次', defaultLoad: 15 },
    // 肩
    { code: 'OH_PRESS', name: '肩上推举', muscleGroup: '肩', unit: 'kg', defaultLoad: 15 },
    { code: 'LAT_RAISE', name: '侧平举', muscleGroup: '肩', unit: 'kg', defaultLoad: 6 },
    // 臂
    { code: 'CURL_DB', name: '哑铃弯举', muscleGroup: '臂', unit: 'kg', defaultLoad: 8 },
    { code: 'TRI_EXT', name: '绳索下压', muscleGroup: '臂', unit: 'kg', defaultLoad: 12 }
  ];

  let inserted = 0, updated = 0;

  for (const r of rows) {
    const q = await db.collection('training_catalog').where({ tenantId, code: r.code }).get();
    if (!q.data.length) {
      await db.collection('training_catalog').add({ data: { ...r, tenantId, createdAt:new Date() } });
      inserted++;
    } else {
      // 补齐/更新字段（不会动你自定义的其他字段）
      const id = q.data[0]._id;
      await db.collection('training_catalog').doc(id).update({
        data: {
          name: r.name, muscleGroup: r.muscleGroup, unit: r.unit, defaultLoad: r.defaultLoad,
          updatedAt: new Date()
        }
      });
      updated++;
    }
  }

  return { inserted, updated };
};


// file: apps/admin/cloudfunctions/seed_training_catalog/package.json
{
  "name": "seed_training_catalog",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}


// file: apps/admin/cloudfunctions/user_bind_phone/index.js
// /apps/admin/cloudfunctions/user_bind_phone/index.js

const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();



exports.main = async (event) => {

  const { phone } = event;

  if (!phone) throw new Error('缺少手机号');

  const { OPENID } = cloud.getWXContext();



  // 找到当前登录用户

  const uRes = await db.collection('users').where({ openid: OPENID }).get();

  if (!uRes.data.length) throw new Error('请先登录再绑定手机号');



  // 检查是否已被其他账号绑定（简单唯一性保护）

  const _ = db.command;

  const dup = await db.collection('users')

    .where({ phone, openid: _.neq(OPENID) })

    .get();

  if (dup.data.length) throw new Error('该手机号已被其他账号绑定');



  await db.collection('users')

    .where({ openid: OPENID })

    .update({ data: { phone, updatedAt: new Date() } });



  return { ok: true, phone };

};



// file: apps/admin/cloudfunctions/user_bind_phone/package.json
{
  "name": "user_bind_phone",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": { "wx-server-sdk": "^3.0.0" }
}



// file: apps/admin/cloudfunctions/user_get_profile/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async () => {
  const { OPENID } = cloud.getWXContext()

  const usersColl = db.collection('users')
  const walletsColl = db.collection('wallets')

  const uRes = await usersColl
    .where({ openid: OPENID })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { user: null, wallet: null, reason: 'no_user' }
  }

  const user = uRes.data[0]
  const uid = user.userId || user._id

  const wRes = await walletsColl
    .where({ userId: uid })
    .limit(1)
    .get()

  const wallet = wRes.data[0] || { userId: uid, balance: 0 }

  return { user, wallet }
}



// file: apps/admin/cloudfunctions/user_get_profile/package.json
{
  "name": "user_get_profile",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}



// file: apps/admin/cloudfunctions/user_get_report/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const { reportId } = event || {}

  if (!reportId) {
    throw new Error('user_get_report: 缺少 reportId')
  }

  // 1. 当前用户
  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    throw new Error('user_get_report: 未找到用户')
  }

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId

  // 2. 只允许拿到"属于自己的报告"
  const rRes = await db.collection('training_reports')
    .doc(reportId)
    .get()

  const report = rRes.data

  if (!report || report.userId !== uid) {
    throw new Error('user_get_report: 无权限或报告不存在')
  }

  // 可选：你想的话，可以这里再把 session 信息一并查出来拼上去
  // 例如：查 sessions 集合，把 title / 时间塞到 report.sessionInfo 里

  return { report }
}


// file: apps/admin/cloudfunctions/user_get_report/package.json
{
  "name": "user_get_report",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/user_list_confirmed_sessions/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { q = '', startFrom, startTo } = event || {}

  const { OPENID } = cloud.getWXContext()

  // 1. 当前用户
  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { list: [], reason: 'no_user' }
  }

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId

  // 2. 时间和关键字过滤
  let startCond = null
  if (startFrom) startCond = _.gte(startFrom)
  if (startTo) {
    const toCond = _.lte(startTo)
    startCond = startCond ? _.and(startCond, toCond) : toCond
  }

  const reg = q
    ? db.RegExp({ regexp: q, options: 'i' })
    : null

  const base = {
    userId: uid,
    status: 'confirmed',
    ...(tenantId ? { tenantId } : {}),
    ...(startCond ? { startAt: startCond } : {})
  }

  const where = reg
    ? _.and([base, { title: reg }])
    : base

  // 3. 查课
  const ret = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .field({
      _id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true
    })
    .limit(100)
    .get()

  return { list: ret.data || [] }
}


// file: apps/admin/cloudfunctions/user_list_confirmed_sessions/package.json
{
  "name": "user_list_confirmed_sessions",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/user_list_pending_sessions/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { includeConfirmed = false, q = '', startFrom, startTo } = event || {}

  const { OPENID } = cloud.getWXContext()

  // 1. 找到当前用户
  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { list: [], reason: 'no_user' }
  }

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId

  // 2. 状态 + 时间过滤
  const statusFilter = includeConfirmed
    ? _.in(['pending', 'confirmed'])
    : 'pending'

  let startCond = null
  if (startFrom) startCond = _.gte(startFrom)
  if (startTo) {
    const toCond = _.lte(startTo)
    startCond = startCond ? _.and(startCond, toCond) : toCond
  }

  const reg = q
    ? db.RegExp({ regexp: q, options: 'i' })
    : null

  const base = {
    userId: uid,
    status: statusFilter,
    ...(tenantId ? { tenantId } : {}),
    ...(startCond ? { startAt: startCond } : {})
  }

  const where = reg
    ? _.and([base, { title: reg }])
    : base

  // 3. 查课
  const ret = await db.collection('sessions')
    .where(where)
    .orderBy('startAt', 'asc')
    .field({
      _id: true,
      title: true,
      startAt: true,
      endAt: true,
      status: true
    })
    .limit(100)
    .get()

  return { list: ret.data || [] }
}


// file: apps/admin/cloudfunctions/user_list_pending_sessions/package.json
{
  "name": "user_list_pending_sessions",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/cloudfunctions/user_list_reports/index.js
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const _ = db.command

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const {
    q = '',
    createdFrom,
    createdTo,
    page = 1,
    pageSize = 20
  } = event || {}

  // 1. 确定 userId / tenantId
  const uRes = await db.collection('users')
    .where({ openid: OPENID })
    .field({ userId: true, tenantId: true })
    .limit(1)
    .get()

  if (!uRes.data.length) {
    return { list: [], total: 0, reason: 'no_user' }
  }

  const userDoc = uRes.data[0]
  const uid = userDoc.userId || userDoc._id
  const tenantId = userDoc.tenantId

  // 2. 时间 & 关键字过滤
  let createdCond = null
  if (createdFrom) createdCond = _.gte(createdFrom)
  if (createdTo) {
    const toCond = _.lte(createdTo)
    createdCond = createdCond ? _.and(createdCond, toCond) : toCond
  }

  const reg = q
    ? db.RegExp({ regexp: q, options: 'i' })
    : null

  const base = {
    userId: uid,
    ...(tenantId ? { tenantId } : {}),
    ...(createdCond ? { createdAt: createdCond } : {})
  }

  const where = reg
    ? _.and([base, { comment: reg }])
    : base

  // 3. total + 分页数据
  const coll = db.collection('training_reports')
  const totalRes = await coll.where(where).count()
  const total = totalRes.total || 0

  const listRes = await coll.where(where)
    .orderBy('createdAt', 'desc')
    .limit(pageSize)
    .skip((page - 1) * pageSize)
    .field({
      _id: true,
      userId: true,
      coachId: true,
      sessionId: true,
      RPE: true,
      comment: true,
      createdAt: true
    })
    .get()

  return {
    list: listRes.data || [],
    total
  }
}


// file: apps/admin/cloudfunctions/user_list_reports/package.json
{
  "name": "user_list_reports",
  "version": "0.0.1",
  "main": "index.js",
  "license": "MIT",
  "engines": { "node": ">=14" },
  "dependencies": {
    "wx-server-sdk": "^3.0.0"
  }
}



// file: apps/admin/pages/home/index.js
Page({
  data: {},

  // 课程管理（去你现在的课程列表页）
  goSessions() {
    wx.navigateTo({
      url: '/pages/sessions/index'
    })
  },

  // 课程表（新建的"浏览全部课程"页面）
  goOverview() {
    wx.navigateTo({
      url: '/pages/sessions/overview/index'
    })
  },

  // 学员管理页（下面 B 部分要新建的页面）
  goUsers() {
    wx.navigateTo({
      url: '/pages/users/index'
    })
  }
})



// file: apps/admin/pages/home/index.json
{
  "usingComponents": {}
}



// file: apps/admin/pages/home/index.wxml
<view class="page">
  <view class="home-card">
    <view class="home-title">管理端首页</view>
    <view class="home-sub">欢迎使用健身房管理系统</view>
    <view class="home-menu">
      <button class="home-btn home-btn--sessions" bindtap="goSessions">课程管理</button>
      <button class="home-btn home-btn--overview" bindtap="goOverview">课程表</button>
      <button class="home-btn home-btn--users" bindtap="goUsers">学员管理</button>
    </view>
  </view>
</view>



// file: apps/admin/pages/home/index.wxss
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx 32rpx;
  box-sizing: border-box;
}

.home-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
  text-align: center;
}

.home-title {
  font-size: 36rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
  color: #111827;
}

.home-sub {
  font-size: 26rpx;
  color: #6b7280;
  margin-bottom: 40rpx;
}

.home-menu {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* 通用按钮尺寸 */
.home-btn {
  border-radius: 999rpx;
  padding: 24rpx 32rpx;
  font-size: 30rpx;
  border: none;
}

/* 课程管理：深色底白字 */
.home-btn--sessions {
  background: #111827;
  color: #ffffff;
}

/* 课程表：深灰底白字 */
.home-btn--overview {
  background: #374151;
  color: #ffffff;
}

/* 学员管理：绿色底白字 */
.home-btn--users {
  background: #059669;
  color: #ffffff;
}



// file: apps/admin/pages/report/actions/create/index.js
Page({

  data: {

    name: '',

    groupOptions: ['背', '胸', '下肢', '后链', '核心', '肩', '臂'],

    groupIndex: 0,

    unitOptions: ['kg', '次', '秒', '米'],

    unitIndex: 0,

    defaultLoad: ''

  },

  onNameInput(e) {

    this.setData({ name: e.detail.value });

  },

  onGroupChange(e) {

    this.setData({ groupIndex: Number(e.detail.value) });

  },

  onUnitChange(e) {

    this.setData({ unitIndex: Number(e.detail.value) });

  },

  onLoadInput(e) {

    this.setData({ defaultLoad: e.detail.value });

  },

  async onSave() {

    const { name, groupOptions, groupIndex, unitOptions, unitIndex, defaultLoad } = this.data;

    if (!name) {

      wx.showToast({ title: '请输入动作名称', icon: 'none' });

      return;

    }

    const muscleGroup = groupOptions[groupIndex];

    const unit = unitOptions[unitIndex];

    try {

      wx.showLoading({ title: '保存中', mask: true });

      await wx.cloud.callFunction({

        name: 'admin_create_training_action',

        data: {

          name,

          muscleGroup,

          unit,

          defaultLoad: defaultLoad ? Number(defaultLoad) : null

        }

      });

      wx.hideLoading();

      wx.showToast({ title: '已保存', icon: 'success' });

      // 通知上一页刷新动作列表

      const pages = getCurrentPages();

      const prev = pages[pages.length - 2];

      if (prev && typeof prev.onNewActionCreated === 'function') {

        prev.onNewActionCreated();

      }

      setTimeout(() => {

        wx.navigateBack();

      }, 400);

    } catch (err) {

      wx.hideLoading();

      console.error('create action error', err);

      wx.showToast({ title: '保存失败', icon: 'none' });

    }

  }

});



// file: apps/admin/pages/report/actions/create/index.json
{
  "navigationBarTitleText": "新增动作"
}



// file: apps/admin/pages/report/actions/create/index.wxml
<view class="page">

  <view class="card">

    <view class="card-title">新增训练动作</view>

    <view class="form-item">

      <view class="label">动作名称</view>

      <input

        class="input"

        placeholder="例如：杠铃深蹲"

        value="{{name}}"

        bindinput="onNameInput"

      />

    </view>

    <view class="form-item">

      <view class="label">所属分类</view>

      <picker

        range="{{groupOptions}}"

        value="{{groupIndex}}"

        bindchange="onGroupChange"

      >

        <view class="picker-value">

          {{groupOptions[groupIndex]}}

        </view>

      </picker>

    </view>

    <view class="form-item">

      <view class="label">计量单位</view>

      <picker

        range="{{unitOptions}}"

        value="{{unitIndex}}"

        bindchange="onUnitChange"

      >

        <view class="picker-value">

          {{unitOptions[unitIndex]}}

        </view>

      </picker>

    </view>

    <view class="form-item">

      <view class="label">默认负重（可选）</view>

      <input

        type="number"

        class="input"

        placeholder="如 20"

        value="{{defaultLoad}}"

        bindinput="onLoadInput"

      />

    </view>

    <view class="hint">保存后，该动作会出现在动作库中，供所有报告使用。</view>

    <button class="btn-primary" bindtap="onSave">保存</button>

  </view>

</view>



// file: apps/admin/pages/report/actions/create/index.wxss
.page {

  min-height: 100vh;

  background: #f5f5f5;

  padding: 24rpx;

  box-sizing: border-box;

}

.card {

  background: #ffffff;

  border-radius: 24rpx;

  padding: 24rpx;

  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);

}

.card-title {

  font-size: 32rpx;

  font-weight: 600;

  margin-bottom: 16rpx;

}

.form-item {

  margin-bottom: 16rpx;

}

.label {

  font-size: 24rpx;

  color: #4b5563;

  margin-bottom: 6rpx;

}

.input {

  height: 64rpx;

  border-radius: 12rpx;

  background: #f3f4f6;

  padding: 0 20rpx;

  font-size: 24rpx;

}

.picker-value {

  height: 64rpx;

  border-radius: 12rpx;

  background: #f3f4f6;

  padding: 0 20rpx;

  font-size: 24rpx;

  display: flex;

  align-items: center;

}

.hint {

  font-size: 22rpx;

  color: #9ca3af;

  margin: 8rpx 0 16rpx;

}

.btn-primary {

  width: 100%;

  border-radius: 999rpx;

  background: #16a34a;

  color: #ffffff;

  font-size: 28rpx;

  padding: 18rpx 0;

  border: none;

  display: flex;

  align-items: center;

  justify-content: center;

}



// file: apps/admin/pages/report/actions/index.js
Page({

  data: {

    allActions: [],      // 所有动作

    visibleActions: [],  // 当前分类 + 关键字过滤后的动作

    groups: [],          // 分类列表，如 [{ name: '下肢', label: '下肢' }, ...]

    activeGroup: '',

    keyword: '',

    loading: false,

    selectedCount: 0

  },

  onLoad() {

    this.eventChannel = this.getOpenerEventChannel();

    let preSelected = [];

    // 接收上一个页面传来的已选动作

    this.eventChannel.on('initSelectedActions', data => {

      preSelected = (data && data.items) || [];

      this.loadActions(preSelected);

    });

  },

  // 从云函数加载动作列表

  async loadActions(preSelected) {

    this.setData({ loading: true });

    try {

      const { result } = await wx.cloud.callFunction({

        name: 'catalog_search',

        data: {

          key: '',     // 空关键字 = 全部

          muscle: ''  // 不按肌群筛选

        }

      });

      const list = (result && result.list) || [];

      // 已选动作 map，用 code 去重

      const selectedMap = {};

      preSelected.forEach(a => {

        if (a.code) selectedMap[a.code] = true;

      });

      // 给动作打上 _selected

      const allActions = list.map(a => ({

        ...a,

        _selected: !!selectedMap[a.code]

      }));

      // 构造分类列表

      const groupMap = {};

      allActions.forEach(a => {

        const g = a.muscleGroup || '未分组';

        groupMap[g] = true;

      });

      const groups = Object.keys(groupMap).map(name => ({

        name,

        label: name

      }));

      const activeGroup = groups.length ? groups[0].name : '';

      this.setData({

        allActions,

        groups,

        activeGroup

      });

      this.applyFilter();

    } catch (err) {

      console.error('load actions error', err);

      wx.showToast({ title: '加载动作失败', icon: 'none' });

      this.setData({ loading: false });

    }

  },

  applyFilter() {

    const { allActions, activeGroup, keyword } = this.data;

    let list = allActions;

    if (activeGroup) {

      list = list.filter(a => (a.muscleGroup || '未分组') === activeGroup);

    }

    if (keyword && keyword.trim()) {

      const kw = keyword.trim().toLowerCase();

      list = list.filter(a =>

        (a.name || '').toLowerCase().includes(kw)

      );

    }

    const selectedCount = allActions.filter(a => a._selected).length;

    this.setData({

      visibleActions: list,

      selectedCount,

      loading: false

    });

  },

  onPickGroup(e) {

    const name = e.currentTarget.dataset.name;

    this.setData({

      activeGroup: name

    });

    this.applyFilter();

  },

  onKeywordInput(e) {

    this.setData({

      keyword: e.detail.value

    });

  },

  onSearch() {

    this.applyFilter();

  },

  // 切换选中状态

  toggleAction(e) {

    const code = e.currentTarget.dataset.code;

    const { allActions } = this.data;

    const idx = allActions.findIndex(a => a.code === code);

    if (idx === -1) return;

    const key = `allActions[${idx}]._selected`;

    this.setData({

      [key]: !allActions[idx]._selected

    });

    this.applyFilter();

  },

  // 确认选择，返回上一个页面

  onConfirm() {

    const { allActions } = this.data;

    const selected = allActions.filter(a => a._selected);

    this.eventChannel.emit('actionsSelected', {

      items: selected

    });

    wx.navigateBack();

  },

  // 跳转到新增动作页面

  goCreateAction() {

    wx.navigateTo({

      url: '/pages/report/actions/create/index'

    });

  },

  // 新增动作后的回调，刷新列表

  onNewActionCreated() {

    // 记录当前已选动作，刷新列表后保持选中

    const selected = this.data.allActions.filter(a => a._selected);

    this.loadActions(selected);

  }

});



// file: apps/admin/pages/report/actions/index.json
{
  "navigationBarTitleText": "选择训练动作"
}



// file: apps/admin/pages/report/actions/index.wxml
<view class="page">

  <view class="card">

    <view class="card-title">选择训练动作</view>

    <view class="layout">

      <!-- 左侧分类 -->

      <scroll-view class="left-pane" scroll-y="true">

        <view

          wx:for="{{groups}}"

          wx:key="name"

          wx:for-item="g"

          class="group-item {{g.name === activeGroup ? 'group-item--active' : ''}}"

          bindtap="onPickGroup"

          data-name="{{g.name}}"

        >

          {{g.label}}

        </view>

      </scroll-view>

      <!-- 右侧动作列表 -->

      <scroll-view class="right-pane" scroll-y="true">

        <view class="search-row">

          <input

            class="search-input"

            placeholder="按名称搜索动作"

            value="{{keyword}}"

            bindinput="onKeywordInput"

          />

          <button class="search-btn" bindtap="onSearch">搜索</button>

        </view>

        <view class="create-row">

          <button class="create-btn" bindtap="goCreateAction">+ 新建动作</button>

        </view>

        <view wx:if="{{loading}}" class="hint">正在加载动作...</view>

        <block wx:else>

          <view

            wx:for="{{visibleActions}}"

            wx:key="code"

            wx:for-item="act"

            class="action-row"

            bindtap="toggleAction"

            data-code="{{act.code}}"

          >

            <view class="action-main">

              <view class="action-name">{{act.name}}</view>

              <view class="action-group">{{act.muscleGroup}}</view>

            </view>

            <view class="action-check {{act._selected ? 'action-check--on' : ''}}"></view>

          </view>

          <view wx:if="{{!visibleActions.length}}" class="hint">

            当前分类暂无动作

          </view>

        </block>

      </scroll-view>

    </view>

    <!-- 卡片内的底部按钮 -->

    <view class="footer">

      <button class="btn-primary" bindtap="onConfirm">

        确定（已选 {{selectedCount}} 个）

      </button>

    </view>

  </view>

</view>



// file: apps/admin/pages/report/actions/index.wxss
.page {

  min-height: 100vh;

  background: #f5f5f5;

  padding: 24rpx;

  box-sizing: border-box;

}

.card {

  background: #ffffff;

  border-radius: 24rpx;

  padding: 24rpx;

  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);

}

.card-title {

  font-size: 32rpx;

  font-weight: 600;

  margin-bottom: 16rpx;

}

/* 中间左右布局：高度根据内容自动，但给个最小高度避免太瘦 */

.layout {

  display: flex;

  margin-top: 8rpx;

  margin-bottom: 24rpx;

  min-height: 520rpx;

}

/* 左侧分类 */

.left-pane {

  width: 200rpx;

  background: #f9fafb;

  border-radius: 16rpx;

  padding: 8rpx 0;

  box-sizing: border-box;

}

.group-item {

  padding: 16rpx 12rpx;

  font-size: 24rpx;

  color: #6b7280;

  display: flex;

  align-items: center;           /* 垂直居中文字 */

}

.group-item--active {

  background: #111827;

  color: #ffffff;

}

/* 右侧动作列表 */

.right-pane {

  flex: 1;

  margin-left: 16rpx;

}

/* 搜索行 */

.search-row {

  display: flex;

  margin-bottom: 12rpx;

}

.search-input {

  flex: 1;

  height: 64rpx;

  background: #f3f4f6;

  border-radius: 999rpx;

  padding: 0 20rpx;

  font-size: 24rpx;

}

.search-btn {

  margin-left: 12rpx;

  padding: 0 24rpx;

  height: 64rpx;

  border-radius: 999rpx;

  background: #111827;

  color: #ffffff;

  font-size: 24rpx;

  border: none;

  display: flex;                 /* 文字水平垂直居中 */

  align-items: center;

  justify-content: center;

}

.create-row {

  display: flex;

  justify-content: flex-end;

  margin-bottom: 8rpx;

}

.create-btn {

  padding: 6rpx 20rpx;

  border-radius: 999rpx;

  border: 1px solid #d1d5db;

  background: #ffffff;

  font-size: 22rpx;

  color: #111827;

  display: flex;

  align-items: center;

  justify-content: center;

}

.action-row {

  display: flex;

  justify-content: space-between;

  align-items: center;

  padding: 16rpx 12rpx;

  border-bottom: 1px solid #e5e7eb;

}

.action-main {

  flex: 1;

}

.action-name {

  font-size: 26rpx;

  color: #111827;

}

.action-group {

  font-size: 22rpx;

  color: #6b7280;

}

.action-check {

  width: 32rpx;

  height: 32rpx;

  border-radius: 999rpx;

  border: 2rpx solid #d1d5db;

}

.action-check--on {

  background: #111827;

  border-color: #111827;

}

.hint {

  font-size: 24rpx;

  color: #6b7280;

  margin-top: 16rpx;

}

/* 底部按钮：在卡片内部，整体像一个对话框 */

.footer {

  margin-top: 12rpx;

}

.btn-primary {

  width: 100%;

  border-radius: 999rpx;

  background: #16a34a;

  color: #ffffff;

  font-size: 28rpx;

  padding: 18rpx 0;

  border: none;

  display: flex;

  align-items: center;           /* 居中文本 */

  justify-content: center;

}



// file: apps/admin/pages/report/index.js
// pages/report/index.js
Page({
  data: {

  },

  onLoad() {

  }
});



// file: apps/admin/pages/report/index.json
{
  "usingComponents": {}
}



// file: apps/admin/pages/report/index.wxml
<!--pages/report/index.wxml-->
<view class="container">
  <text>报表</text>
</view>



// file: apps/admin/pages/report/index.wxss

/* pages/report/index.wxss */
.container {
  padding: 20rpx;
}



// file: apps/admin/pages/report/report.js
const musclesDefault = ["全部", "下肢", "后链", "胸", "背", "核心"];



Page({

  data: {

    userQ:"", userResults:[],

    chosenUser:{}, chosenUserId:"",   // 单独保存 userId，更稳

    // 课程

    statusFilters: ["待确认或已确认", "仅待确认", "仅已确认"],

    statusIdx: 0, onlyFuture: false, sessions: [], sessionId: "",

    // 报告

    deductChips: [0, 50, 100, 200],

    deduct: 0, isCustomDeduct: false,

    comment: "",

    RPE: 7, rpeOptions: [1,2,3,4,5,6,7,8,9,10],

    // 动作库

    key: "", muscles: musclesDefault, muscleIdx: 0,

    results: [], selected: []

  },

  /* ===== A. 学员选择 ===== */

  onUserQ(e){ this.setData({ userQ: e.detail.value.trim() }); },

  searchUsers(){

    wx.showLoading({ title:'搜索中' });

    wx.cloud.callFunction({

      name:'admin_search_users',

      data:{ q:this.data.userQ, page:0, pageSize:20 }

    }).then(r=>{

      this.setData({ userResults: r.result?.list || [] });

      if (!(r.result?.list||[]).length) wx.showToast({ icon:'none', title:'未找到学员' });

    }).catch(err=>{

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'搜索失败').slice(0,17) });

    }).finally(()=> wx.hideLoading());

  },

  pickUser(e){

    const ds = e.currentTarget.dataset || {};

    // 只从 dataset 取值，严防 undefined

    const userId = ds.userId;

    if (!userId || userId === 'undefined'){

      console.error('pickUser 缺少 userId', ds);

      wx.showToast({ icon:'none', title:'学员数据异常' });

      return;

    }

    const nickname = ds.nickname || '未命名';

    const phone = ds.phone || '';

    const chosenUser = { userId, nickname, phone };

    this.setData(

      { chosenUser, chosenUserId: userId, sessions: [], sessionId: "" },

      () => {

        this.loadSessions(userId);      // setData 回调里调用，避免读到旧值

        wx.showToast({ title:'已选择学员' });

      }

    );

  },

  /* ===== B. 课程选择 ===== */

  onStatusChange(e){ this.setData({ statusIdx: Number(e.detail.value) }); },

  toggleFuture(e){ this.setData({ onlyFuture: e.detail.value }); },

  loadSessions(passedUserId){

    const userId = passedUserId || this.data.chosenUserId;

    if (!userId) return wx.showToast({ icon:'none', title:'请先选择学员' });

    const mapping = [

      ['pending','confirmed'],

      ['pending'],

      ['confirmed']

    ];

    wx.showLoading({ title:'加载课程' });

    wx.cloud.callFunction({

      name:'admin_list_sessions',

      data:{

        userId,

        statusIn: mapping[this.data.statusIdx],

        onlyFuture: this.data.onlyFuture,

        page: 0, pageSize: 50

      }

    }).then(r=>{

      const list = r.result?.list || [];

      // 格式化日期和时间
      const fmtDate = iso => {
        if (!iso) return '';
        const d = new Date(iso);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const fmtHM = iso => {
        if (!iso) return '';
        const d = new Date(iso);
        const h = String(d.getHours()).padStart(2, '0');
        const m = String(d.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
      };

      const enhanced = list.map(s => {
        const dateStr = fmtDate(s.startAt);
        const timeRange = `${fmtHM(s.startAt)}~${fmtHM(s.endAt)}`;
        return {
          ...s,
          _dateStr: dateStr,
          _timeRange: timeRange
        };
      });

      this.setData({ sessions: enhanced });

      if (!enhanced.length) wx.showToast({ icon:'none', title:'暂无课程' });

    }).catch(err=>{

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'加载失败').slice(0,17) });

    }).finally(()=> wx.hideLoading());

  },

  pickSession(e){ this.setData({ sessionId: e.currentTarget.dataset.id }); },

  /* ===== C. 报告输入 ===== */

  pickDeductChip(e){

    const v = Number(e.currentTarget.dataset.v);

    this.setData({ deduct: v, isCustomDeduct: false });

  },

  enableCustomDeduct(){ this.setData({ isCustomDeduct: true }); },

  onDeduct(e){

    const n = Number(e.detail.value || 0);

    this.setData({ deduct: isNaN(n)?0:n });

  },

  onComment(e){ this.setData({ comment: e.detail.value }); },

  pickRPE(e){ this.setData({ RPE: Number(e.currentTarget.dataset.v) }); },

  /* ===== D. 动作库 ===== */

  onKey(e){ this.setData({ key: e.detail.value.trim() }); },

  onMuscleChange(e){ this.setData({ muscleIdx: Number(e.detail.value) }); },

  search(){

    wx.showLoading({ title:'搜索中' });

    const muscle = this.data.muscleIdx === 0 ? "" : this.data.muscles[this.data.muscleIdx];

    wx.cloud.callFunction({

      name:'catalog_search',

      data:{ key:this.data.key, muscle, page:0, pageSize:20 }

    }).then(r=>{

      const list = r.result?.list || [];

      this.setData({ results: list });

      if (!list.length) wx.showToast({ icon:'none', title:'没有匹配的动作' });

    }).catch(err=>{

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'搜索失败').slice(0,17) });

    }).finally(()=> wx.hideLoading());

  },

  addOne(e){

    const code = e.currentTarget.dataset.code;

    const found = this.data.results.find(x => x.code === code);

    if (!found) return;

    if (this.data.selected.some(x => x.code === code))

      return wx.showToast({ icon:'none', title:'已在已选中' });

    const item = {

      code: found.code, name: found.name, unit: found.unit,

      sets: 3, reps: found.unit === 'sec' ? 1 : 8,

      load: Number(found.defaultLoad || 0), notes:''

    };

    this.setData({ selected: this.data.selected.concat(item) });

  },

  removeOne(e){ this.setData({ selected: this.data.selected.filter(x => x.code !== e.currentTarget.dataset.code) }); },

  stopPropagation(e){ /* 阻止事件冒泡，避免触发跳转 */ },

  goSelectActions(){

    console.log('goSelectActions tap');  // 方便在控制台确认点击有没有触发

    const selected = this.data.selected || [];

    wx.navigateTo({

      url: '/pages/report/actions/index',

      success: (res) => {

        const eventChannel = res.eventChannel;

        // 把当前已选动作传给新页面做初始化

        eventChannel.emit('initSelectedActions', {

          items: selected

        });

        // 监听新页面选完返回

        eventChannel.on('actionsSelected', data => {

          if (data && data.items) {

            // 将返回的动作转换为带编辑字段的格式

            const enhanced = data.items.map(item => {

              // 如果已存在，保留原有的编辑字段

              const existing = this.data.selected.find(x => x.code === item.code);

              if (existing) {

                return existing;

              }

              // 新动作，设置默认值

              return {

                code: item.code,

                name: item.name,

                unit: item.unit || 'kg',

                muscleGroup: item.muscleGroup || '',

                defaultLoad: item.defaultLoad || 0,

                sets: 3,

                reps: item.unit === 'sec' ? 1 : 8,

                load: Number(item.defaultLoad || 0),

                notes: ''

              };

            });

            this.setData({

              selected: enhanced

            });

          }

        });

      }

    });

  },

  editItem(e){

    const { code, field } = e.currentTarget.dataset;

    const val = field === 'notes' ? e.detail.value : Number(e.detail.value || 0);

    this.setData({ selected: this.data.selected.map(x => x.code===code ? { ...x, [field]: val } : x) });

  },

  /* ===== E. 提交 ===== */

  submit(){

    const { chosenUserId, sessionId, selected, deduct, comment, RPE } = this.data;

    if (!chosenUserId)   return wx.showToast({ icon:'none', title:'请先选择学员' });

    if (!sessionId)      return wx.showToast({ icon:'none', title:'请先选择课程' });

    if (!selected.length)return wx.showToast({ icon:'none', title:'请先添加动作' });

    const report = { coachId:'coach_001', items:selected, RPE, comment };

    wx.showLoading({ title:'提交中' });

    wx.cloud.callFunction({

      name:'report_and_deduct',

      data:{ sessionId, report, deductAmount: Number(deduct||0) }

    }).then(()=>{

      wx.hideLoading();

      wx.showToast({ title:'已提交' });

      this.setData({ selected: [], comment:'', sessionId:'' });

    }).catch(err=>{

      wx.hideLoading();

      console.error(err);

      wx.showToast({ icon:'none', title:(err.message||'提交失败').slice(0,17) });

    });

  },

  /* 工具 */

  fmt(iso){ const d=new Date(iso); const p=n=>n<10?'0'+n:n; return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; },

  statusText(s){ return s==='pending'?'待确认':(s==='confirmed'?'已确认':'已完成'); }

});

// file: apps/admin/pages/report/report.wxml
<view class="wrap">

  <view class="title">训练报告</view>



  <!-- A. 选择学员（蓝色主题） -->

  <view class="card card--student">

    <view class="card__head">选择学员</view>

    <view class="row">

      <input class="ipt ipt--search" placeholder="手机号/姓名" bindinput="onUserQ"/>

      <button class="btn btn--primary" bindtap="searchUsers">搜索</button>

    </view>

    <block wx:if="{{userResults.length}}">

      <block wx:for="{{userResults}}" wx:key="userId" wx:for-index="idx">

        <view class="line selectable {{chosenUserId===item.userId?'on':''}}">

          <view class="left">

            <text class="tag-selected" wx:if="{{chosenUserId===item.userId}}">已选</text>

            <view class="uinfo">{{item.nickname || '未命名'}}（{{item.phone || '无手机号'}}）</view>

          </view>

          <button size="mini" class="choose-btn"

                  data-user-id="{{item.userId}}"

                  data-nickname="{{item.nickname || '未命名'}}"

                  data-phone="{{item.phone || ''}}"

                  bindtap="pickUser">选择</button>

        </view>

      </block>

    </block>

    <view class="tips" wx:if="{{!userResults.length}}">输入关键词后点击"搜索"</view>

    <view class="chosen" wx:if="{{chosenUserId}}">

      已选学员：{{chosenUser.nickname}}（{{chosenUser.phone || '无手机号'}}）

    </view>

  </view>



  <!-- B. 选择课程（青色主题） -->

  <view class="card card--session">

    <view class="card__head">选择课程</view>

    <view class="row">

      <picker mode="selector" range="{{statusFilters}}" value="{{statusIdx}}" bindchange="onStatusChange">

        <view class="picker">{{statusFilters[statusIdx]}}</view>

      </picker>



      <view class="switchrow">

        <switch checked="{{onlyFuture}}" bindchange="toggleFuture"/>

        <text class="swlabel">仅看未开始</text>

      </view>



      <button class="btn btn--ghost" bindtap="loadSessions">刷新</button>

    </view>



    <block wx:if="{{!chosenUserId}}">

      <view class="tips">请先选择学员</view>

    </block>



    <block wx:if="{{chosenUserId}}">

      <block wx:if="{{sessions.length}}">

        <block wx:for="{{sessions}}" wx:key="_id">

          <view class="line">

            <view class="sinfo">

              <text class="name">{{item.title}}</text>

              <view class="session-meta">

                <text class="session-date">{{item._dateStr}}</text>

                <text class="session-time">{{item._timeRange}}</text>

              </view>

              <text class="badge {{item.status}}">{{statusText(item.status)}}</text>

            </view>

            <radio value="{{item._id}}" checked="{{item._id===sessionId}}" data-id="{{item._id}}" bindtap="pickSession"/>

          </view>

        </block>

      </block>

      <view class="tips" wx:if="{{!sessions.length}}">该学员暂无符合条件的课程，点"刷新"再试</view>



      <view class="chosen" wx:if="{{sessionId}}">已选课程 ID：{{sessionId}}</view>

    </block>

  </view>



  <!-- C. 填写报告（橙色主题） -->

  <view class="card card--report">

    <view class="card__head">填写报告</view>



    <!-- 扣费金额：芯片 + 自定义 -->

    <view class="subtle">本次从余额扣除的金额（可不扣）</view>

    <view class="chips">

      <block wx:for="{{deductChips}}" wx:key="*this">

        <view class="chip {{deduct===item?'on':''}}" data-v="{{item}}" bindtap="pickDeductChip">

          {{item===0?'不扣费':('¥'+item)}}

        </view>

      </block>

      <view class="chip {{isCustomDeduct?'on':''}}" bindtap="enableCustomDeduct">自定义</view>

    </view>

    <input wx:if="{{isCustomDeduct}}" class="ipt ipt--money"

           type="number" placeholder="输入自定义金额（元）"

           value="{{deduct>0?deduct:''}}"

           bindinput="onDeduct"/>



    <textarea class="ta" placeholder="备注（可选：状态、疼痛、调整建议等）" bindinput="onComment" value="{{comment}}"></textarea>



    <!-- 主观用力程度 -->

    <view class="rpe">

      <view class="label">主观用力程度（1-10）<text class="note">（1=非常轻松；10=极限）</text></view>

      <view class="rpe-row">

        <block wx:for="{{rpeOptions}}" wx:key="*this">

          <view class="chip {{RPE===item?'on':''}}" data-v="{{item}}" bindtap="pickRPE">{{item}}</view>

        </block>

      </view>

    </view>

  </view>



  <!-- E. 已选动作（绿色主题） -->

  <view class="card card--selected">

    <view class="card__head">已选动作（可编辑）</view>

    <!-- 整个卡片作为"入口"，点击空白处也会触发 goSelectActions -->

    <view class="actions-list" bindtap="goSelectActions">

      <block wx:if="{{selected && selected.length}}">

        <view

          wx:for="{{selected}}"

          wx:key="code"

          wx:for-item="act"

          class="action-chip"

          catchtap="stopPropagation"

        >

          <view class="action-chip-content">

            <view class="action-chip-name">{{act.name}}</view>

            <view class="action-chip-meta">

              {{act.muscleGroup}} · {{act.defaultLoad || act.load || ''}}{{act.unit === 'sec' ? '秒' : (act.unit || 'kg')}}

            </view>

            <view class="action-chip-edit" wx:if="{{act.sets || act.reps}}">

              {{act.sets}}组 × {{act.reps}}次

            </view>

          </view>

          <button size="mini" class="action-chip-remove" data-code="{{act.code}}" bindtap="removeOne">移除</button>

        </view>

      </block>

      <block wx:else>

        <view class="actions-empty">

          点击此处添加训练动作

        </view>

      </block>

    </view>

  </view>



  <!-- 已选动作详细编辑区域（展开显示） -->

  <view class="card card--edit" wx:if="{{selected && selected.length}}">

    <view class="card__head">编辑训练参数</view>

    <block wx:for="{{selected}}" wx:key="code">

      <view class="sel">

        <view class="s-top">

          <view class="name">{{item.name}}</view>

        </view>

        <view class="grid">

          <view class="g-item"><text>组数</text>

            <input class="num" type="number" value="{{item.sets}}" data-code="{{item.code}}" data-field="sets" bindinput="editItem"/></view>

          <view class="g-item"><text>每组次数</text>

            <input class="num" type="number" value="{{item.reps}}" data-code="{{item.code}}" data-field="reps" bindinput="editItem"/></view>

          <view class="g-item"><text>{{item.unit==='sec'?'时长(秒)':'重量'}}</text>

            <input class="num" type="number" value="{{item.load}}" data-code="{{item.code}}" data-field="load" bindinput="editItem"/></view>

          <view class="g-item2"><text>备注</text>

            <input class="ipt" placeholder="可选" value="{{item.notes}}" data-code="{{item.code}}" data-field="notes" bindinput="editItem"/></view>

        </view>

      </view>

    </block>

  </view>



  <!-- F. 提交 -->

  <view class="card card--submit">

    <button class="btn btn--success btn--full" bindtap="submit">提交报告并扣费</button>

  </view>

</view>


// file: apps/admin/pages/report/report.wxss

/* 布局密度与留白 */

.wrap{ padding:20rpx; background:#f7f8fa; }

.title{ font-size:36rpx; font-weight:700; margin:8rpx 0 20rpx; }

.card{ background:#fff; padding:18rpx; border-radius:16rpx; box-shadow:0 3rpx 12rpx rgba(0,0,0,.05); margin-bottom:16rpx; }

.card__head{ font-weight:700; margin-bottom:10rpx; font-size:28rpx; }

.row{ display:flex; gap:10rpx; align-items:center; margin-bottom:8rpx; flex-wrap:wrap; }

.switchrow{ display:flex; align-items:center; gap:8rpx; }

.swlabel{ font-size:24rpx; color:#606770; }



.ipt{ border:1rpx solid #e5e5e5; border-radius:12rpx; padding:12rpx 14rpx; background:#fff; flex:1; min-width:0; }

.ipt--search{ background:#f8fafc; }

.ipt--money{ border-color:#f59e0b; background:#fff7ed; }

.picker{ border:1rpx solid #e5e5e5; border-radius:12rpx; padding:12rpx 14rpx; }



.ta{ width:100%; min-height:118rpx; border:1rpx solid #e5e5e5; border-radius:12rpx; padding:12rpx 14rpx; }



.line{ display:flex; align-items:center; justify-content:space-between; padding:10rpx 0; border-bottom:1rpx solid #f0f0f0; }

.line:last-child{ border-bottom:0; }

.left{ display:flex; align-items:center; gap:8rpx; max-width:100%; }

.uinfo{ color:#606770; font-size:26rpx; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:520rpx; }



/* "已选"标记和选中高亮 */

.tag-selected{ margin-left:8rpx; padding:2rpx 8rpx; border-radius:8rpx; background:#E6FFFB; color:#08979C; font-size:22rpx; }

.selectable.on{ background:#f9fafb; border-radius:12rpx; padding:8rpx; }

.choose-btn{ margin-left:auto; }



/* 主题色左边框（细一点） */

.card--student { border-left: 4rpx solid #3b82f6; }

.card--session  { border-left: 4rpx solid #06b6d4; }

.card--report   { border-left: 4rpx solid #f59e0b; }

.card--catalog  { border-left: 4rpx solid #8b5cf6; }

.card--selected { border-left: 4rpx solid #10b981; }

.sinfo .name{ font-weight:600; display:block; }

.sinfo .time{ color:#606770; font-size:24rpx; }

.session-meta{ font-size:22rpx; color:#6b7280; margin-top:4rpx; }

.session-date{ margin-right:12rpx; }

.session-time{ color:#4b5563; }

.badge{ margin-left:6rpx; padding:2rpx 8rpx; border-radius:10rpx; font-size:22rpx; }

.badge.pending{ background:#fff7ed; color:#f59e0b; }

.badge.confirmed{ background:#ecfeff; color:#06b6d4; }

.badge.done{ background:#ecfdf5; color:#10b981; }

.tips{ color:#9ca3af; font-size:24rpx; margin-top:6rpx; }

.chosen{ margin-top:10rpx; color:#111827; }

.chips{ display:flex; gap:8rpx; flex-wrap:wrap; margin:6rpx 0; }

.chip{ padding:8rpx 14rpx; border:1rpx solid #e5e5e5; border-radius:12rpx; background:#fff; font-size:26rpx; }

.chip.on{ background:#07c160; color:#fff; border-color:#07c160; }

.rpe{ margin-top:12rpx; }

.rpe .label{ margin-bottom:6rpx; }

.rpe .note{ color:#9ca3af; font-size:22rpx; margin-left:8rpx; }

.rpe-row{ display:flex; gap:8rpx; flex-wrap:wrap; }

.btn{ background:#07c160; color:#fff; border-radius:12rpx; padding:14rpx 20rpx; }

.btn--primary{ background:#07c160; color:#fff; }

.btn--ghost{ background:#f1f5f9; color:#111827; }

.btn--success{ background:#10b981; color:#fff; }

.btn--full{ width:100%; }

.i-left .name{ font-weight:600; }

.i-left .subtle{ color:#6b7280; font-size:24rpx; }

.actions-list{ background:#f9fafb; border-radius:16rpx; padding:16rpx; min-height:120rpx; }

.actions-empty{ font-size:24rpx; color:#9ca3af; text-align:center; padding:40rpx 0; }

.action-chip{ display:flex; align-items:center; justify-content:space-between; padding:12rpx 16rpx; border-radius:12rpx; background:#ffffff; margin-bottom:8rpx; box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04); }

.action-chip-content{ flex:1; }

.action-chip-name{ font-size:26rpx; color:#111827; font-weight:500; }

.action-chip-meta{ font-size:22rpx; color:#6b7280; margin-top:4rpx; }

.action-chip-edit{ font-size:22rpx; color:#10b981; margin-top:4rpx; }

.action-chip-remove{ margin-left:12rpx; }

.sel{ border:1rpx solid #e5e5e5; border-radius:12rpx; padding:14rpx; margin-top:10rpx; }

.s-top{ display:flex; align-items:center; justify-content:space-between; }

.grid{ display:grid; grid-template-columns:1fr 1fr; gap:12rpx; margin-top:10rpx; }

.g-item,.g-item2{ display:flex; align-items:center; gap:10rpx; }

.num{ width:180rpx; border:1rpx solid #e5e5e5; border-radius:12rpx; padding:10rpx; text-align:center; }

// file: apps/admin/pages/schedule/index.js
// pages/schedule/index.js
Page({
  data: {

  },

  onLoad() {

  }
});



// file: apps/admin/pages/schedule/index.json
{
  "usingComponents": {}
}



// file: apps/admin/pages/schedule/index.wxml
<!--pages/schedule/index.wxml-->
<view class="container">
  <text>课程表</text>
</view>



// file: apps/admin/pages/schedule/index.wxss

/* pages/schedule/index.wxss */
.container {
  padding: 20rpx;
}



// file: apps/admin/pages/schedule/schedule.js
function today() {
  const d = new Date();
  const pad = n => (n < 10 ? "0" + n : "" + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

Page({
  data: {
    searchInput: '',
    searchResults: [],
    chosenUserId: null,
    chosenUser: null,
    title: '',
    startDate: today(),
    startTime: '09:00',
    endDate: today(),
    endTime: '10:00',
    creating: false
  },

  onSearchInput(e) {
    this.setData({ searchInput: e.detail.value.trim() });
  },

  searchUsers() {
    const q = this.data.searchInput;
    if (!q) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '搜索中' });
    wx.cloud.callFunction({
      name: 'admin_search_users',
      data: { q, page: 0, pageSize: 20 }
    }).then(r => {
      const list = r.result?.list || [];
      this.setData({ searchResults: list });
      if (!list.length) {
        wx.showToast({ icon: 'none', title: '未找到学员' });
      }
    }).catch(err => {
      console.error('searchUsers error', err);
      wx.showToast({ icon: 'none', title: (err.message || '搜索失败').slice(0, 17) });
    }).finally(() => {
      wx.hideLoading();
    });
  },

  pickUser(e) {
    const { userId, nickname, phone } = e.currentTarget.dataset || {};
    if (!userId) {
      wx.showToast({ title: '未拿到用户ID', icon: 'none' });
      console.warn('pickUser 缺少 userId', e.currentTarget.dataset);
      return;
    }
    this.setData({
      chosenUserId: userId,
      chosenUser: { userId, nickname, phone }
    });
    wx.showToast({ title: '已选择学员' });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value.trim() });
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value });
  },

  // 组合日期时间为 ISO 字符串
  toISO(dateStr, timeStr) {
    if (!dateStr || !timeStr) return null;
    const d = new Date(`${dateStr} ${timeStr}:00`.replace(/-/g, '/'));
    return isNaN(+d) ? null : d.toISOString();
  },

  async createPendingSession() {
    const { chosenUserId, title, startDate, startTime, endDate, endTime } = this.data;
    if (!chosenUserId) {
      return wx.showToast({ title: '请先选择学员', icon: 'none' });
    }
    const sISO = this.toISO(startDate, startTime);
    const eISO = this.toISO(endDate || startDate, endTime);
    if (!sISO || !eISO) {
      return wx.showToast({ title: '请完整选择开始/结束时间', icon: 'none' });
    }
    if (new Date(eISO).getTime() <= new Date(sISO).getTime()) {
      return wx.showToast({ icon: 'none', title: '结束时间必须晚于开始时间' });
    }
    this.setData({ creating: true });
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_create_session',
        data: {
          userId: chosenUserId,
          title: title || '未命名课程',
          startAt: sISO,
          endAt: eISO
          // 不再传 tenantId
        }
      });
      // 不再展示/复制 sessionId
      wx.showToast({ title: '已创建（待确认）' });
      // 清空表单
      this.setData({
        searchInput: '',
        searchResults: [],
        chosenUserId: null,
        chosenUser: null,
        title: '',
        startDate: today(),
        startTime: '09:00',
        endDate: today(),
        endTime: '10:00'
      });
    } catch (e) {
      console.error('createPendingSession error', e);
      wx.showToast({ title: '创建失败', icon: 'none' });
    } finally {
      this.setData({ creating: false });
    }
  }
});


// file: apps/admin/pages/schedule/schedule.wxml
<view class="box">

  <!-- 学员搜索 -->
  <view class="field">
    <text class="label">搜索学员</text>
    <view class="row">
      <input class="ipt" placeholder="手机号/姓名" bindinput="onSearchInput" value="{{searchInput}}"/>
      <button class="btn-search" bindtap="searchUsers">搜索</button>
    </view>
  </view>

  <!-- 学员列表 -->
  <view class="user-list" wx:if="{{searchResults.length}}">
    <view class="row" wx:for="{{searchResults}}" wx:key="userId">
      <view class="meta">
        <text>{{item.nickname || '未命名'}}</text>
        <text class="phone">{{item.phone}}</text>
      </view>
      <button size="mini"
              data-user-id="{{item.userId}}"
              data-nickname="{{item.nickname}}"
              data-phone="{{item.phone}}"
              bindtap="pickUser">选择</button>
      <view wx:if="{{chosenUserId === item.userId}}" class="tag-selected">已选</view>
    </view>
  </view>

  <!-- 课程标题 -->
  <view class="field">
    <text class="label">课程标题（可选）</text>
    <input class="ipt" placeholder="如：私教课" bindinput="onTitleInput" value="{{title}}"/>
  </view>

  <!-- 开始日期 -->
  <view class="field">
    <text class="label">开始日期</text>
    <picker mode="date" value="{{startDate}}" bindchange="onStartDateChange">
      <view class="picker">{{startDate}}</view>
    </picker>
  </view>

  <!-- 开始时间 -->
  <view class="field">
    <text class="label">开始时间</text>
    <picker mode="time" value="{{startTime}}" bindchange="onStartTimeChange">
      <view class="picker">{{startTime}}</view>
    </picker>
  </view>

  <!-- 结束日期 -->
  <view class="field">
    <text class="label">结束日期</text>
    <picker mode="date" value="{{endDate}}" bindchange="onEndDateChange">
      <view class="picker">{{endDate}}</view>
    </picker>
  </view>

  <!-- 结束时间 -->
  <view class="field">
    <text class="label">结束时间</text>
    <picker mode="time" value="{{endTime}}" bindchange="onEndTimeChange">
      <view class="picker">{{endTime}}</view>
    </picker>
  </view>

  <!-- 创建课程按钮 -->
  <button class="btn primary" bindtap="createPendingSession" disabled="{{creating}}">
    {{creating ? '创建中...' : '创建待确认课程'}}
  </button>

</view>


// file: apps/admin/pages/schedule/schedule.wxss

.box{ padding:24rpx; }

.field{ margin-bottom:18rpx; }
.label{ display:block; font-size:26rpx; color:#666; margin-bottom:8rpx; }
.ipt,.picker{ padding:18rpx; border:1rpx solid #e5e5e5; border-radius:12rpx; background:#fff; }
.btn{ margin-top:12rpx; background:#07c160; color:#fff; border-radius:12rpx; padding:20rpx 0; }
.btn.primary{ background:#07c160; }
.btn[disabled]{ opacity:0.6; }
.btn-search{ padding:18rpx 24rpx; background:#1890ff; color:#fff; border-radius:12rpx; margin-left:12rpx; }

.row{ display:flex; gap:10rpx; align-items:center; margin-bottom:8rpx; flex-wrap:wrap; }
.row .ipt{ flex:1; min-width:0; }

.user-list{ margin-top:12rpx; margin-bottom:18rpx; }
.user-list .row{ padding:12rpx 0; border-bottom:1rpx solid #f0f0f0; }
.user-list .row:last-child{ border-bottom:0; }
.meta{ flex:1; display:flex; flex-direction:column; gap:4rpx; }
.meta text{ font-size:26rpx; color:#333; }
.meta .phone{ font-size:24rpx; color:#999; }
.tag-selected{ margin-left:8rpx; padding:2rpx 8rpx; border-radius:8rpx; background:#E6FFFB; color:#08979C; font-size:22rpx; }


// file: apps/admin/pages/sessions/detail/index.js
// apps/admin/pages/sessions/detail/index.js

Page({
  data: {
    id: '',
    title: '',
    status: '',
    start: '',
    end: '',
    phone: '',
    statusText: '',
    // 用于编辑的时间字段
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: ''
  },
  onLoad(options) {
    const status = options.status || ''
    const start = decodeURIComponent(options.start || '')
    const end = decodeURIComponent(options.end || '')
    const { date: sd, time: st } = this.parseISO(start)
    const { date: ed, time: et } = this.parseISO(end)
    this.setData({
      id: options.id || '',
      title: decodeURIComponent(options.title || ''),
      status,
      start,
      end,
      phone: options.phone || '',
      statusText: this.mapStatus(status),
      startDate: sd,
      startTime: st,
      endDate: ed,
      endTime: et
    })
  },
  mapStatus(s) {
    if (s === 'pending') return '待确认'
    if (s === 'confirmed') return '已确认'
    if (s === 'done') return '已完成'
    return '未知'
  },
  parseISO(iso) {
    if (!iso) return { date: '', time: '' }
    const d = new Date(iso)
    if (isNaN(+d)) return { date: '', time: '' }
    const pad = (n) => (n < 10 ? '0' + n : '' + n)
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`
    return { date, time }
  },
  // picker 事件
  onStartDate(e) { this.setData({ startDate: e.detail.value }) },
  onStartTime(e) { this.setData({ startTime: e.detail.value }) },
  onEndDate(e) { this.setData({ endDate: e.detail.value }) },
  onEndTime(e) { this.setData({ endTime: e.detail.value }) },
  // 保存时间修改
  async saveTime() {
    const { id, startDate, startTime, endDate, endTime } = this.data
    if (!id) return wx.showToast({ title: '缺少课程ID', icon: 'none' })
    if (!startDate || !startTime || !endDate || !endTime) {
      return wx.showToast({ title: '请先选完整时间', icon: 'none' })
    }
    const toLocal = (d, t) => `${d} ${t}:00`
    wx.showLoading({ title: '保存中' })
    try {
      await wx.cloud.callFunction({
        name: 'admin_update_session',
        data: {
          sessionId: id,
          startAt: toLocal(startDate, startTime),
          endAt: toLocal(endDate, endTime)
        }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      console.error('saveTime error', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  // 删除课程
  deleteSession() {
    const { id } = this.data
    if (!id) return
    wx.showModal({
      title: '确认删除',
      content: '删除后该课程将无法恢复，确定要删除吗？',
      confirmText: '删除',
      confirmColor: '#ff4d4f',
      success: async (res) => {
        if (!res.confirm) return
        wx.showLoading({ title: '删除中' })
        try {
          await wx.cloud.callFunction({
            name: 'admin_delete_session',
            data: { sessionId: id }
          })
          wx.hideLoading()
          wx.showToast({ title: '已删除', icon: 'success' })
          // 返回上一页并让列表刷新
          setTimeout(() => {
            const pages = getCurrentPages()
            const prev = pages[pages.length - 2]
            if (prev && typeof prev.fetch === 'function') {
              prev.fetch()
            }
            wx.navigateBack()
          }, 500)
        } catch (e) {
          console.error('deleteSession error', e)
          wx.hideLoading()
          wx.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    })
  },
  // 保留原来的报告跳转
  goEditReport() {
    const { id, phone } = this.data
    wx.navigateTo({
      url: `/pages/report/report?sessionId=${id}&phone=${phone}`
    })
  },
  goViewReport() {
    const { id, phone } = this.data
    wx.navigateTo({
      url: `/pages/report/report?sessionId=${id}&phone=${phone}&mode=view`
    })
  }
})



// file: apps/admin/pages/sessions/detail/index.json
{
  "navigationBarTitleText": "课程详情",
  "usingComponents": {}
}



// file: apps/admin/pages/sessions/detail/index.wxml
<view class="page">
  <!-- 课程信息 + 时间编辑 合并 -->
  <view class="section">
    <view class="section-title">课程信息</view>
    <view class="row">
      <text class="label">课程标题</text>
      <text class="value">{{title || '未命名课程'}}</text>
    </view>
    <view class="row">
      <text class="label">学员手机号</text>
      <text class="value">{{phone || '未绑定'}}</text>
    </view>
    <view class="row">
      <text class="label">课程状态</text>
      <text class="value">{{statusText}}</text>
    </view>
    <view class="row row-gap">
      <text class="label">开始日期</text>
      <picker mode="date" value="{{startDate}}" bindchange="onStartDate">
        <view class="value value-clickable">{{startDate || '请选择'}}</view>
      </picker>
    </view>
    <view class="row">
      <text class="label">开始时间</text>
      <picker mode="time" value="{{startTime}}" bindchange="onStartTime">
        <view class="value value-clickable">{{startTime || '请选择'}}</view>
      </picker>
    </view>
    <view class="row row-gap">
      <text class="label">结束日期</text>
      <picker mode="date" value="{{endDate}}" bindchange="onEndDate">
        <view class="value value-clickable">{{endDate || '请选择'}}</view>
      </picker>
    </view>
    <view class="row">
      <text class="label">结束时间</text>
      <picker mode="time" value="{{endTime}}" bindchange="onEndTime">
        <view class="value value-clickable">{{endTime || '请选择'}}</view>
      </picker>
    </view>
    <button class="btn-primary" bindtap="saveTime">保存时间修改</button>
  </view>
  <!-- 操作区 -->
  <view class="section">
    <view class="section-title">操作</view>
    <!-- ★ 文案改为"编辑报告" -->
    <button wx:if="{{status !== 'done'}}"
            class="btn-primary"
            bindtap="goEditReport">
      编辑报告
    </button>
    <button wx:elif="{{status === 'done'}}"
            class="btn-primary"
            bindtap="goViewReport">
      查看报告
    </button>
    <button class="btn-danger" bindtap="deleteSession">删除课程</button>
  </view>
</view>



// file: apps/admin/pages/sessions/detail/index.wxss
.page {
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;   /* ★ 避免底部太空，同时不撑太高 */
}

.section {
  background: #ffffff;
  margin: 16rpx 20rpx;     /* 稍微减小间距 */
  padding: 24rpx;
  border-radius: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.row-gap {
  margin-top: 12rpx;
}

.label {
  font-size: 26rpx;
  color: #666;
}

.value {
  font-size: 26rpx;
  color: #111;
  text-align: right;
  max-width: 420rpx;
}

.btn-primary {
  margin-top: 20rpx;
  width: 100%;
  background: #10a050;
  color: #fff;
  padding: 18rpx 0;
  border-radius: 12rpx;
}

.value-clickable {
  color: #1677ff;
}

.btn-danger {
  margin-top: 16rpx;
  width: 100%;
  background: #ff4d4f;
  color: #fff;
  padding: 18rpx 0;
  border-radius: 12rpx;
}



// file: apps/admin/pages/sessions/index.js
// apps/admin/pages/sessions/index.js

Page({
  data: {
    q: '',
    status: '',
    startDate: '',
    endDate: '',
    list: [],
    loading: false
  },
  onLoad() {
    this.fetch()
  },
  onKeyword(e) {
    this.setData({ q: e.detail.value })
  },
  setStatus(e) {
    const status = e.currentTarget.dataset.status || ''
    this.setData({ status }, () => this.fetch())
  },
  onStartDate(e) {
    this.setData({ startDate: e.detail.value })
  },
  onEndDate(e) {
    this.setData({ endDate: e.detail.value })
  },
  // 日期 -> ISO 字符串
  toIsoStart(d) {
    if (!d) return undefined
    return new Date(`${d} 00:00:00`.replace(/-/g, '/')).toISOString()
  },
  toIsoEnd(d) {
    if (!d) return undefined
    return new Date(`${d} 23:59:59`.replace(/-/g, '/')).toISOString()
  },
  async fetch() {
    this.setData({ loading: true })
    try {
      const { q, status, startDate, endDate } = this.data
      const { result } = await wx.cloud.callFunction({
        name: 'admin_list_sessions',
        data: {
          q: q || undefined,
          status: status || undefined,
          startFrom: this.toIsoStart(startDate),
          startTo: this.toIsoEnd(endDate)
        }
      })
      this.setData({ list: (result && result.list) || [] })
      console.log('admin sessions list:', this.data.list)
    } catch (e) {
      console.error('fetch sessions error', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goCreate() {
    wx.navigateTo({ url: '/pages/schedule/schedule' })
  },
  goDetail(e) {
    const { id, title, status, start, end, phone } = e.currentTarget.dataset
    wx.navigateTo({
      url:
        '/pages/sessions/detail/index?' +
        `id=${id}&title=${encodeURIComponent(title || '')}` +
        `&status=${status}` +
        `&start=${encodeURIComponent(start || '')}` +
        `&end=${encodeURIComponent(end || '')}` +
        `&phone=${phone || ''}`
    })
  }
})


// file: apps/admin/pages/sessions/index.json
{
  "navigationBarTitleText": "课程管理",
  "usingComponents": {}
}



// file: apps/admin/pages/sessions/index.wxml
<!-- apps/admin/pages/sessions/index.wxml -->
<view class="page">
  <view class="section">
    <view class="section-title">课程管理</view>
    <view class="helper">按学员 / 标题 / 日期查看所有课程</view>
    <input class="input"
           placeholder="手机号 / 姓名 / 课程标题"
           bindinput="onKeyword"
           value="{{q}}" />
    <!-- 状态筛选：改为占满一行的四个大按钮 -->
    <view class="status-row">
      <button class="status-btn {{status===''?'status-btn--active':''}}"
              data-status=""
              bindtap="setStatus">全部</button>
      <button class="status-btn {{status==='pending'?'status-btn--active':''}}"
              data-status="pending"
              bindtap="setStatus">待确认</button>
      <button class="status-btn {{status==='confirmed'?'status-btn--active':''}}"
              data-status="confirmed"
              bindtap="setStatus">已确认</button>
      <button class="status-btn {{status==='done'?'status-btn--active':''}}"
              data-status="done"
              bindtap="setStatus">已完成</button>
    </view>
    <view class="date-row">
      <picker mode="date" value="{{startDate}}" bindchange="onStartDate">
        <view class="date-chip">开始：{{startDate || '不限'}}</view>
      </picker>
      <picker mode="date" value="{{endDate}}" bindchange="onEndDate">
        <view class="date-chip">结束：{{endDate || '不限'}}</view>
      </picker>
    </view>
    <view class="actions">
      <button class="btn-secondary" bindtap="fetch" loading="{{loading}}">刷新列表</button>
      <button class="btn-primary" bindtap="goCreate">创建课程</button>
    </view>
  </view>
  <!-- 课程列表：展示手机号，卡片整体可点击进入详情 -->
  <block wx:if="{{list.length}}">
    <view class="card"
          wx:for="{{list}}"
          wx:key="_id"
          bindtap="goDetail"
          data-id="{{item._id}}"
          data-title="{{item.title}}"
          data-status="{{item.status}}"
          data-start="{{item.startAt}}"
          data-end="{{item.endAt}}"
          data-phone="{{item.userPhone}}">
      <view class="card-header">
        <view class="card-title">{{item.title || '未命名课程'}}</view>
        <view class="tag" wx:if="{{item.status==='pending'}}">待确认</view>
        <view class="tag tag-confirmed" wx:elif="{{item.status==='confirmed'}}">已确认</view>
        <view class="tag tag-done" wx:elif="{{item.status==='done'}}">已完成</view>
      </view>
      <view class="card-sub">{{item.startAt}} ~ {{item.endAt}}</view>
      <view class="card-sub">学员手机号：{{item.userPhone || '未绑定'}}</view>
    </view>
  </block>
  <view wx:else class="empty">暂无符合条件的课程</view>
</view>


// file: apps/admin/pages/sessions/index.wxss
.page {
  background: #f5f5f5;
  min-height: 100vh;
}

.section {
  background: #ffffff;
  margin: 20rpx;
  padding: 24rpx;
  border-radius: 16rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.helper {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 16rpx;
}

.input {
  background: #f7f7f7;
  padding: 16rpx 20rpx;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

/* 状态按钮行：四宫格大按钮 */
.status-row {
  display: flex;
  justify-content: space-between;
  margin: 20rpx 0;
}

.status-btn {
  flex: 1;
  margin-right: 12rpx;
  padding: 18rpx 0;
  border-radius: 999rpx;
  font-size: 26rpx;
  background: #f5f5f5;
  color: #666;
  border: none;
}

.status-btn:last-child {
  margin-right: 0;
}

.status-btn--active {
  background: #e6fff2;
  color: #10a050;
  font-weight: 600;
}

.date-row {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.date-chip {
  background: #fafafa;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 8rpx;
}

.btn-primary {
  flex: 1;
  margin-left: 12rpx;
  background: #10a050;
  color: #fff;
  padding: 16rpx 0;
  border-radius: 12rpx;
}

.btn-secondary {
  flex: 1;
  margin-right: 12rpx;
  background: #ffffff;
  color: #333;
  padding: 16rpx 0;
  border-radius: 12rpx;
  border: 1rpx solid #eee;
}

.card {
  background: #ffffff;
  margin: 12rpx 20rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.03);
  cursor: pointer;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 28rpx;
  font-weight: 600;
}

.card-sub {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #777;
}

.tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  background: #fffbe6;
  color: #d48806;
}

.tag-confirmed {
  background: #f6ffed;
  color: #389e0d;
}

.tag-done {
  background: #e6f7ff;
  color: #096dd9;
}

.empty {
  padding: 60rpx 0;
  text-align: center;
  color: #aaa;
  font-size: 24rpx;
}


// file: apps/admin/pages/sessions/overview/index.js
const statusMap = {
  pending: '待确认',
  confirmed: '已确认',
  done: '已完成'
}

const fmtHM = iso => {
  if (!iso) return ''
  const d = new Date(iso)
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

// 返回某个日期所在周的周一
const getMonday = (d) => {
  const day = d.getDay() || 7 // 周日=0，转成7
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + 1)
  monday.setHours(0, 0, 0, 0)
  return monday
}

const formatDate = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 当天显示用的 MM-DD
const formatMonthDay = (d) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}-${day}`
}

// 按时间配置生成 上午/下午/晚上 + 每小时 slot
function buildSegmentsForDay(sessions, timeConfig) {
  const { startHour, endHour, segments } = timeConfig
  const bucket = {} // key: hour -> [sessions]
  sessions.forEach(s => {
    const d = new Date(s.startAt)
    const hour = d.getHours()
    if (hour < startHour || hour >= endHour) return
    const key = String(hour)
    if (!bucket[key]) bucket[key] = []
    bucket[key].push(s)
  })
  const result = segments.map(seg => {
    const slots = []
    for (let h = seg.from; h < seg.to; h++) {
      const timeLabel = `${String(h).padStart(2, '0')}:00`
      const key = String(h)
      const list = (bucket[key] || []).map(it => ({
        ...it,
        startHM: fmtHM(it.startAt),
        endHM: fmtHM(it.endAt),
        statusText: statusMap[it.status] || it.status
      }))
      slots.push({
        time: timeLabel,
        hour: h,
        sessions: list
      })
    }
    return {
      key: seg.key,
      label: seg.label,
      slots
    }
  })
  return result
}

Page({
  data: {
    weekDays: [],
    selectedDate: '',
    weekStart: '',
    weekRangeLabel: '',   // 当前周范围：11-10 ~ 11-16
    statusTabs: [
      { value: 'all',      label: '全部' },
      { value: 'pending',  label: '待确认' },
      { value: 'confirmed',label: '已确认' },
      { value: 'done',     label: '已完成' }
    ],
    status: 'all',
    statusLabel: '全部',
    list: [],
    segments: [],
    loading: false,
    timeConfig: {
      startHour: 9,
      endHour: 21,
      segments: [
        { key: 'morning',   label: '上午',   from: 9,  to: 12 },
        { key: 'afternoon', label: '下午',   from: 12, to: 18 },
        { key: 'evening',   label: '晚上',   from: 18, to: 21 }
      ]
    }
  },
  onLoad() {
    const today = new Date()
    const monday = getMonday(today)
    this.buildWeek(monday, formatDate(today))
    this.refresh()
  },
  // 根据周一和选中日期，构造 weekDays + weekRangeLabel
  buildWeek(mondayDate, selected) {
    const todayStr = formatDate(new Date())
    const weekDays = []
    const labels = ['周一','周二','周三','周四','周五','周六','周日']
    // 计算周一~周日
    for (let i = 0; i < 7; i++) {
      const d = new Date(mondayDate)
      d.setDate(mondayDate.getDate() + i)
      const dateStr = formatDate(d)
      weekDays.push({
        label: labels[i],
        day: String(d.getDate()).padStart(2, '0'),
        dateStr,
        isToday: dateStr === todayStr
      })
    }
    // 周范围：周一 ~ 周日
    const start = new Date(mondayDate)
    const end = new Date(mondayDate)
    end.setDate(end.getDate() + 6)
    const rangeLabel = `${formatMonthDay(start)} ~ ${formatMonthDay(end)}`
    this.setData({
      weekDays,
      weekStart: formatDate(mondayDate),
      selectedDate: selected || weekDays[0].dateStr,
      weekRangeLabel: rangeLabel
    })
  },
  // 点上方那一周里的某一天
  onPickDate(e) {
    const date = e.currentTarget.dataset.date
    this.setData({ selectedDate: date })
    this.refresh()
  },
  // 从日期选择器切换周：选任意日期 -> 找到该周周一
  onWeekDateChange(e) {
    const dateStr = e.detail.value
    if (!dateStr) return
    const d = new Date(dateStr)
    const monday = getMonday(d)
    this.buildWeek(monday, formatDate(d))
    this.refresh()
  },
  // 打开状态筛选菜单
  onOpenStatusSheet() {
    const tabs = this.data.statusTabs
    wx.showActionSheet({
      itemList: tabs.map(t => t.label),
      success: (res) => {
        const idx = res.tapIndex
        const picked = tabs[idx]
        if (!picked) return
        this.setData({
          status: picked.value,
          statusLabel: picked.label
        })
        this.refresh()
      }
    })
  },
  async refresh() {
    const { selectedDate, status, timeConfig } = this.data
    if (!selectedDate) return
    this.setData({ loading: true })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_list_all_sessions',
        data: {
          date: selectedDate,
          status
        }
      })
      const raw = (result && result.list) || []
      const segments = buildSegmentsForDay(raw, timeConfig)
      this.setData({
        list: raw,
        segments
      })
    } catch (err) {
      console.error('load all sessions error', err)
      wx.showToast({ title: '加载课程表失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({
      url: `/pages/sessions/detail/index?id=${id}`
    })
  }
})


// file: apps/admin/pages/sessions/overview/index.json
{
  "usingComponents": {}
}



// file: apps/admin/pages/sessions/overview/index.wxml
<view class="page">
  <view class="card">
    <!-- 标题 -->
    <view class="card-title">课程表</view>
    <!-- 当前周选择器：显示 11-10 ~ 11-16，点击切换周 -->
    <view class="week-range">
      <picker mode="date" value="{{selectedDate}}" bindchange="onWeekDateChange">
        <view class="week-range-inner">
          <text class="week-range-label">{{weekRangeLabel}}</text>
          <text class="week-range-arrow">切换周 ▾</text>
        </view>
      </picker>
    </view>
    <!-- 一周的周一~周日 -->
    <view class="week-days">
      <view
        wx:for="{{weekDays}}"
        wx:key="dateStr"
        wx:for-item="day"
        class="day {{day.dateStr === selectedDate ? 'day--active' : ''}} {{day.isToday ? 'day--today' : ''}}"
        bindtap="onPickDate"
        data-date="{{day.dateStr}}"
      >
        <text class="day-label">{{day.label}}</text>
        <text class="day-num">{{day.day}}</text>
      </view>
    </view>
    <!-- 工具栏：状态筛选 + 刷新 -->
    <view class="toolbar">
      <button class="toolbar-btn" bindtap="onOpenStatusSheet">
        状态：{{statusLabel}}
      </button>
      <button class="toolbar-btn toolbar-btn--secondary" bindtap="refresh">
        刷新
      </button>
    </view>
    <!-- 加载状态 / 空状态 / 正常列表 -->
    <view wx:if="{{loading}}" class="hint">正在加载...</view>
    <view wx:elif="{{!loading && segments.length === 0}}" class="hint">
      该日暂无课程
    </view>
    <block wx:else>
      <!-- 上午 / 下午 / 晚上 -->
      <view
        wx:for="{{segments}}"
        wx:key="key"
        wx:for-item="seg"
        class="segment"
      >
        <view class="segment-title">{{seg.label}}</view>
        <!-- 每个时间槽 -->
        <view
          wx:for="{{seg.slots}}"
          wx:key="time"
          wx:for-item="slot"
          class="slot-row"
        >
          <view class="slot-time">{{slot.time}}</view>
          <view class="slot-courses">
            <!-- 没课 -->
            <block wx:if="{{!slot.sessions || slot.sessions.length === 0}}">
              <view class="course course--empty">
                无课程
              </view>
            </block>
            <!-- 有课：遍历课程 -->
            <block wx:elif="{{slot.sessions.length > 0}}">
              <view
                wx:for="{{slot.sessions}}"
                wx:for-item="s"
                wx:key="_id"
                class="course"
                bindtap="goDetail"
                data-id="{{s._id}}"
              >
                <view class="course-line">
                  <text class="course-time">{{s.startHM}}~{{s.endHM}}</text>
                  <text class="course-status status status--{{s.status}}">{{s.statusText}}</text>
                </view>
                <view class="course-line">
                  <text class="course-title">{{s.title || '未命名课程'}}</text>
                </view>
                <view class="course-line">
                  <text class="course-user">{{s.userName || '未命名学员'}}</text>
                  <text wx:if="{{s.userPhone}}"> · {{s.userPhone}}</text>
                </view>
              </view>
            </block>
          </view>
        </view>
      </view>
    </block>
  </view>
</view>


// file: apps/admin/pages/sessions/overview/index.wxss
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 32rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
}

/* 标题与顶部留点空间 */
.card-title {
  font-size: 34rpx;   /* 稍微大一丢丢 */
  font-weight: 600;
  margin-bottom: 18rpx;
}

/* 当前周选择器 */
.week-range {
  margin-bottom: 20rpx;  /* 原来 12rpx，拉开和日期行的距离 */
}

.week-range-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 24rpx;   /* 原来 10rpx 20rpx，增大可点区域 */
  border-radius: 999rpx;
  background: #f3f4f6;
}

.week-range-label {
  font-size: 26rpx;       /* 原来 24rpx */
  color: #111827;
}

.week-range-arrow {
  font-size: 24rpx;       /* 原来 22rpx */
  color: #6b7280;
}

/* 一周周一~周日 */
.week-days {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;   /* 原来 16rpx，和下面工具栏拉开一点 */
}

.day {
  width: 82rpx;           /* 原来 70rpx，点击区域更宽 */
  text-align: center;
  padding: 8rpx 0;        /* 原来 4rpx 0，点击区域更高 */
  border-radius: 999rpx;
}

.day-label {
  font-size: 22rpx;       /* 原来 20rpx */
  color: #6b7280;
}

.day-num {
  font-size: 26rpx;       /* 原来 22rpx */
  font-weight: 600;
  color: #111827;
}

.day--active {
  background: #111827;
}

.day--active .day-label,
.day--active .day-num {
  color: #ffffff;
}

.day--today {
  border: 2rpx solid #059669;
}

/* 工具栏：状态筛选 + 刷新 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
  gap: 16rpx;
}

.toolbar-btn {
  flex: 1;
  border-radius: 999rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  background: #111827;
  color: #ffffff;
  border: none;
}

.toolbar-btn--secondary {
  background: #e5e7eb;
  color: #111827;
}

.hint {
  font-size: 24rpx;
  color: #6b7280;
  padding: 12rpx 0;
}

/* 时间轴结构：上午 / 下午 / 晚上 */
.segment {
  margin-top: 16rpx;
}

.segment-title {
  font-size: 26rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}

.slot-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.slot-time {
  width: 120rpx;
  font-size: 24rpx;
  color: #6b7280;
}

.slot-courses {
  flex: 1;
}

.course {
  padding: 12rpx 16rpx;
  border-radius: 16rpx;
  background: #f9fafb;
  margin-bottom: 8rpx;
}

.course--empty {
  color: #9ca3af;
  background: transparent;
  padding-left: 0;
}

.course-line {
  font-size: 24rpx;
  color: #111827;
}

.course-time {
  margin-right: 12rpx;
}

.course-user {
  font-size: 22rpx;
  color: #6b7280;
}

.course-status {
  font-size: 22rpx;
  padding: 2rpx 10rpx;
  border-radius: 999rpx;
}

.status--pending {
  background: #fff7ed;
  color: #c2410c;
}

.status--confirmed {
  background: #ecfdf3;
  color: #15803d;
}

.status--done {
  background: #eef2ff;
  color: #4f46e5;
}


// file: apps/admin/pages/users/detail/index.js
Page({
  data: {
    userId: '',
    form: {
      nickname: '',
      gender: '',
      heightCm: '',
      weightKg: '',
      bodyFat: '',
      phone: '',
      timesBalance: '',
      balanceAmount: ''
    },
    genderOptions: [
      { value: '', label: '未设置' },
      { value: 'male', label: '男' },
      { value: 'female', label: '女' }
    ],
    genderIndex: 0,
    genderLabel: '未设置'
  },
  onLoad(options) {
    const userId = options.userId || ''
    this.setData({ userId })
    if (userId) {
      this.loadDetail()
    }
  },
  async loadDetail() {
    wx.showLoading({ title: '加载中' })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_get_user_detail',
        data: { userId: this.data.userId }
      })
      const user = result.user || {}
      const wallet = result.wallet || {}
      const form = {
        nickname: user.nickname || '',
        gender: user.gender || '',
        heightCm: user.heightCm != null ? String(user.heightCm) : '',
        weightKg: user.weightKg != null ? String(user.weightKg) : '',
        bodyFat: user.bodyFat != null ? String(user.bodyFat) : '',
        phone: user.phone || '',
        timesBalance: user.timesBalance != null ? String(user.timesBalance) : '',
        balanceAmount: wallet.balance != null ? String(wallet.balance) : ''
      }
      const idx = this.data.genderOptions.findIndex(opt => opt.value === form.gender)
      const genderIndex = idx >= 0 ? idx : 0
      const genderLabel = this.data.genderOptions[genderIndex].label
      this.setData({ form, genderIndex, genderLabel })
    } catch (e) {
      console.error('loadDetail error', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`form.${field}`]: value })
  },
  onGenderChange(e) {
    const index = Number(e.detail.value || 0)
    const opt = this.data.genderOptions[index]
    this.setData({
      genderIndex: index,
      genderLabel: opt.label,
      'form.gender': opt.value
    })
  },
  async onSave() {
    const { userId, form } = this.data
    if (!userId) return
    wx.showLoading({ title: '保存中' })
    try {
      await wx.cloud.callFunction({
        name: 'admin_update_user_detail',
        data: {
          userId,
          ...form
        }
      })
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      console.error('save user error', e)
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})



// file: apps/admin/pages/users/detail/index.json
{
  "navigationBarTitleText": "学员详情",
  "usingComponents": {}
}



// file: apps/admin/pages/users/detail/index.wxml
<view class="page">
  <view class="card">
    <view class="card-title">学员信息</view>
    <view class="form-row">
      <text class="label">姓名</text>
      <input class="ipt" value="{{form.nickname}}" bindinput="onInput" data-field="nickname" placeholder="未命名" />
    </view>
    <view class="form-row">
      <text class="label">性别</text>
      <picker mode="selector" range="{{genderOptions}}" range-key="label" value="{{genderIndex}}" bindchange="onGenderChange">
        <view class="picker">{{genderLabel}}</view>
      </picker>
    </view>
    <view class="form-row">
      <text class="label">身高(cm)</text>
      <input class="ipt" type="digit" value="{{form.heightCm}}" bindinput="onInput" data-field="heightCm" placeholder="可选填" />
    </view>
    <view class="form-row">
      <text class="label">体重(kg)</text>
      <input class="ipt" type="digit" value="{{form.weightKg}}" bindinput="onInput" data-field="weightKg" placeholder="可选填" />
    </view>
    <view class="form-row">
      <text class="label">体脂率(%)</text>
      <input class="ipt" type="digit" value="{{form.bodyFat}}" bindinput="onInput" data-field="bodyFat" placeholder="可选填" />
    </view>
    <view class="form-row">
      <text class="label">手机号</text>
      <input class="ipt" type="number" value="{{form.phone}}" bindinput="onInput" data-field="phone" placeholder="手机号" />
    </view>
    <view class="form-row">
      <text class="label">次数余额</text>
      <input class="ipt" type="digit" value="{{form.timesBalance}}" bindinput="onInput" data-field="timesBalance" placeholder="剩余课时" />
    </view>
    <view class="form-row">
      <text class="label">金额余额(¥)</text>
      <input class="ipt" type="digit" value="{{form.balanceAmount}}" bindinput="onInput" data-field="balanceAmount" placeholder="钱包余额" />
    </view>
    <button class="btn-save" bindtap="onSave">保存</button>
  </view>
</view>



// file: apps/admin/pages/users/detail/index.wxss
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 32rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.form-row {
  margin-bottom: 20rpx;
}

.label {
  display: block;
  font-size: 24rpx;
  color: #6b7280;
  margin-bottom: 8rpx;
}

.ipt {
  width: 100%;
  padding: 16rpx 20rpx;
  border-radius: 999rpx;
  background: #f9fafb;
  font-size: 26rpx;
}

.picker {
  padding: 16rpx 20rpx;
  border-radius: 999rpx;
  background: #f9fafb;
  font-size: 26rpx;
}

.btn-save {
  margin-top: 24rpx;
  width: 100%;
  padding: 20rpx 0;
  border-radius: 999rpx;
  background: #059669;
  color: #ffffff;
  font-size: 28rpx;
}



// file: apps/admin/pages/users/index.js
Page({
  data: {
    q: '',
    list: [],
    loading: false
  },
  onLoad() {
    // 默认拉一次，看看当前租户名下所有学员
    this.search()
  },
  onQ(e) {
    this.setData({ q: e.detail.value })
  },
  onSearch() {
    this.search()
  },
  async search() {
    this.setData({ loading: true })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'admin_search_users',
        data: {
          q: this.data.q.trim(),
          page: 0,
          pageSize: 50
        }
      })
      const list = (result && result.list) || []
      this.setData({ list })
    } catch (err) {
      console.error('load users error', err)
      wx.showToast({ title: '加载学员失败', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
  goDetail(e) {
    const userId = e.currentTarget.dataset.id
    if (!userId) return
    wx.navigateTo({
      url: `/pages/users/detail/index?userId=${userId}`
    })
  }
})



// file: apps/admin/pages/users/index.json
{
  "usingComponents": {}
}



// file: apps/admin/pages/users/index.wxml
<view class="page">
  <view class="card">
    <view class="card-title">学员管理</view>
    <view class="filter-row">
      <input
        class="ipt"
        placeholder="按手机号 / 姓名搜索学员"
        confirm-type="search"
        bindinput="onQ"
        bindconfirm="onSearch"
        value="{{q}}"
      />
      <button class="btn" size="mini" bindtap="onSearch">搜索</button>
    </view>
    <view wx:if="{{loading}}" class="hint">正在加载...</view>
    <view wx:if="{{!loading && list.length === 0}}" class="hint">暂无学员</view>
    <view wx:for="{{list}}" wx:key="userId" class="row" bindtap="goDetail" data-id="{{item.userId}}">
      <view class="u-main">
        <view class="u-name">{{item.nickname || '未命名'}}</view>
        <view class="u-phone">{{item.phone || '未绑定手机号'}}</view>
      </view>
      <!-- 预留：将来可以加"看课程 / 看钱包"等按钮 -->
    </view>
  </view>
</view>



// file: apps/admin/pages/users/index.wxss
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 32rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.filter-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.ipt {
  flex: 1;
  background: #f9fafb;
  border-radius: 999rpx;
  padding: 16rpx 24rpx;
  font-size: 26rpx;
}

.btn {
  padding: 0 24rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
}

.hint {
  font-size: 24rpx;
  color: #6b7280;
  padding: 16rpx 0;
}

.row {
  padding: 16rpx 0;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.u-name {
  font-size: 28rpx;
  font-weight: 500;
}

.u-phone {
  font-size: 24rpx;
  color: #6b7280;
}



// file: apps/admin/project.config.json
{
  "miniprogramRoot": ".",
  "cloudfunctionRoot": "cloudfunctions",
  "appid": "wx90658577bf8d026b",
  "setting": {
    "useCloud": true
  },
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate/"
}

// file: apps/admin/project.private.config.json
{
  "setting": {
    "compileHotReLoad": true,
    "urlCheck": false,
    "coverView": true,
    "lazyloadPlaceholderEnable": false,
    "skylineRenderEnable": false,
    "preloadBackgroundData": false,
    "autoAudits": false,
    "useApiHook": true,
    "useApiHostProcess": true,
    "showShadowRootInWxmlPanel": true,
    "useStaticServer": false,
    "useLanDebug": false,
    "showES6CompileOption": false,
    "checkInvalidKey": true,
    "ignoreDevUnusedFiles": true,
    "bigPackageSizeSupport": false,
    "useIsolateContext": true
  },
  "condition": {},
  "description": "项目私有配置文件。此文件中的内容将覆盖 project.config.json 中的相同字段。项目的改动优先同步到此文件中。详见文档：https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html",
  "projectname": "admin",
  "libVersion": "3.11.1"
}

// file: apps/admin/sitemap.json
{
  "desc": "关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html",
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}


// file: apps/admin/styles/theme.wxss
/* 卡片容器 */

.section { background:#fff; border-radius:16rpx; padding:24rpx; margin:16rpx 20rpx; box-shadow:0 4rpx 16rpx rgba(0,0,0,0.04); }

.section-title { font-size:28rpx; font-weight:600; margin-bottom:16rpx; color:#111; }

.helper { color:#8c8c8c; font-size:24rpx; }

/* 主/次按钮（参照 report 页） */

.btn-primary { background:#29a745; color:#fff; border-radius:12rpx; padding:16rpx 24rpx; }

.btn-secondary { background:#f5f5f5; color:#111; border-radius:12rpx; padding:16rpx 24rpx; }

/* chip */

.chips { display:flex; gap:12rpx; flex-wrap:wrap; }

.chip { padding:8rpx 16rpx; border-radius:20rpx; background:#f6ffed; color:#52c41a; font-size:24rpx; }

.chip--ghost { background:#fafafa; color:#595959; }

/* 列表项 */

.card { background:#fff; border-radius:16rpx; padding:20rpx; margin:12rpx 20rpx; border:1rpx solid #f0f0f0; }

.card-title { font-size:28rpx; font-weight:600; }

.card-sub { font-size:24rpx; color:#666; margin-top:8rpx; }

.tag { padding:4rpx 12rpx; border-radius:12rpx; font-size:22rpx; }

.tag-pending { background:#fffbe6; color:#d48806; }

.tag-confirmed { background:#f6ffed; color:#389e0d; }

.tag-done { background:#e6f7ff; color:#096dd9; }

/* 空态 */

.empty { text-align:center; color:#8c8c8c; padding:40rpx 0; }



// file: apps/common/styles/theme.wxss
/* 卡片容器 */

.section { background:#fff; border-radius:16rpx; padding:24rpx; margin:16rpx 20rpx; box-shadow:0 4rpx 16rpx rgba(0,0,0,0.04); }

.section-title { font-size:28rpx; font-weight:600; margin-bottom:16rpx; color:#111; }

.helper { color:#8c8c8c; font-size:24rpx; }

/* 主/次按钮（参照 report 页） */

.btn-primary { background:#29a745; color:#fff; border-radius:12rpx; padding:16rpx 24rpx; }

.btn-secondary { background:#f5f5f5; color:#111; border-radius:12rpx; padding:16rpx 24rpx; }

/* chip */

.chips { display:flex; gap:12rpx; flex-wrap:wrap; }

.chip { padding:8rpx 16rpx; border-radius:20rpx; background:#f6ffed; color:#52c41a; font-size:24rpx; }

.chip--ghost { background:#fafafa; color:#595959; }

/* 列表项 */

.card { background:#fff; border-radius:16rpx; padding:20rpx; margin:12rpx 20rpx; border:1rpx solid #f0f0f0; }

.card-title { font-size:28rpx; font-weight:600; }

.card-sub { font-size:24rpx; color:#666; margin-top:8rpx; }

.tag { padding:4rpx 12rpx; border-radius:12rpx; font-size:22rpx; }

.tag-pending { background:#fffbe6; color:#d48806; }

.tag-confirmed { background:#f6ffed; color:#389e0d; }

.tag-done { background:#e6f7ff; color:#096dd9; }

/* 空态 */

.empty { text-align:center; color:#8c8c8c; padding:40rpx 0; }



// file: apps/user/README.md
# 云开发 quickstart

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

## 页面更新记录

### home 页面（用户端课程确认页面）

**创建时间：** 2025-11-04 22:44:31  
**更新时间：** 2025-11-12 22:14:38

**版本：** v1.1

**路径：** `/apps/user/pages/home/`

**更新内容（v1.1）：**
- 重构刷新逻辑，使用 `refreshPending()` 方法替代 `loadPending()`
- 支持从 `getApp().globalData?.tenantId` 获取租户ID
- 适配新的 `user_list_pending_sessions` 云函数接口（传入 `includeConfirmed: false, tenantId`）
- 添加 `loading` 和 `emptyHint` 状态管理
- 支持下拉刷新功能（`onPullDownRefresh`）
- 优化空态提示显示逻辑
- 添加调试日志输出，便于排查 tenantId/userId

**主要功能：**
1. **一键登录**
   - 调用 `auth_login` 云函数进行登录
   - 登录成功后自动加载待确认课程列表

2. **绑定手机号（开发调试）**
   - 输入手机号并绑定到当前账号
   - 调用 `user_bind_phone` 云函数

3. **刷新待确认课程**
   - 调用 `user_list_pending_sessions` 云函数
   - 自动从 `getApp().globalData?.tenantId` 获取租户ID
   - 支持下拉刷新和按钮刷新两种方式
   - 自动显示当前用户的所有待确认课程
   - 按开始时间升序排列
   - 空列表时显示"暂无待确认课程"提示

4. **课程确认并加到日历**
   - 列表模式：点击课程卡片上的"确认并加日历"按钮
   - 手动模式：输入 sessionId 后点击确认按钮
   - 确认后自动写入系统日历（真机测试）
   - 确认后自动从待确认列表中移除

**文件说明：**
- `index.wxml`: 页面结构，包含登录、绑定手机号、课程列表等功能
- `index.js`: 页面逻辑，包含登录、绑定、刷新列表、确认课程等方法
- `index.wxss`: 页面样式，包含卡片、列表、按钮等样式
- `index.json`: 页面配置，已启用下拉刷新功能

**注意事项：**
- 日历写入功能需要在真机上测试，开发者工具可能不支持
- 课程确认需要先登录并绑定手机号
- 页面加载时（onLoad）会自动刷新待确认课程
- 页面显示时（onShow）如果已登录也会自动刷新
- 需要确保 `getApp().globalData.tenantId` 已设置，否则 tenantId 为 undefined

---

## Changelog

### 2025-11-15 17:41:59 CST — 新增"我的信息"页面
- **feat(ui)**: 新增 user 端"我的信息"页面，支持查看个人信息和余额
- **feat(cloud)**: 新增云函数 `user_get_profile`，从 users 和 wallets 表读取用户信息
- **变更内容**：
  - **pages/profile/index.wxml**（新建）：
    - 实现个人信息展示：姓名、性别、身高、体重、体脂率、手机号、次数余额、金额余额
    - 使用只读展示，数据从云函数获取
  - **pages/profile/index.js**（新建）：
    - 实现数据加载：调用 `user_get_profile` 云函数获取用户和钱包信息
    - 实现性别文本转换：male→男、female→女、其他→未设置
    - 页面显示时自动刷新数据（`onShow` 钩子）
  - **pages/profile/index.wxss**（新建）：
    - 实现卡片式布局：白色背景、圆角、阴影
    - 信息行样式：左右对齐，标签灰色、值黑色
  - **pages/profile/index.json**（新建）：
    - 设置导航栏标题为"我的信息"
  - **app.json**：
    - 在 pages 数组中新增 `pages/profile/index` 页面注册
  - **cloudfunctions/user_get_profile/index.js**（新建）：
    - 从 openid 查找用户：查询 users 表，使用 OPENID 匹配
    - 查询钱包信息：从 wallets 表获取余额，不存在则返回默认值 0
    - 返回用户和钱包信息
  - **cloudfunctions/user_get_profile/package.json**（新建）：
    - 云函数依赖配置
- **影响范围**：
  - user 端：新增个人信息查看功能，用户可以看到自己的档案和余额信息
  - 数据同步：user 端和 admin 端共享 users 和 wallets 表，数据实时同步
- **回滚方案**：
  - 删除 profile 页面：删除 `pages/profile/` 目录，从 `app.json` 中移除页面注册
  - 删除云函数：删除 `user_get_profile` 云函数目录
- **测试点**：
  - 验证个人信息页：能正确显示姓名、性别、身高、体重、体脂率、手机号、次数余额、金额余额
  - 验证数据同步：admin 端修改学员信息后，user 端能看到最新数据
  - 验证钱包余额：能正确显示金额余额，不存在时显示默认值 0

### 2025-11-12 22:14:38 — home 页面 v1.1
- **refactor(user)**: 重构用户端课程确认页面，适配新的云函数接口，支持 tenantId 和下拉刷新
- **变更内容**：
  - 重构刷新逻辑：使用 `refreshPending()` 方法替代 `loadPending()`，支持下拉刷新
  - 支持 tenantId：从 `getApp().globalData?.tenantId` 获取租户ID，传入云函数
  - 适配新接口：调用 `user_list_pending_sessions` 时传入 `includeConfirmed: false, tenantId`
  - 添加状态管理：新增 `loading` 和 `emptyHint` 状态，优化用户体验
  - 优化空态提示：空列表时显示"暂无待确认课程"，而非固定提示文字
  - 添加下拉刷新：在 `index.json` 中启用 `enablePullDownRefresh`，支持下拉刷新
  - 添加调试日志：输出 `pending sessions` 列表，便于排查 tenantId/userId 问题
  - 保留原有功能：登录、绑定手机号、手动输入 sessionId 等功能保持不变
- **影响范围**：用户端课程确认页面，需要确保 `getApp().globalData.tenantId` 已设置
- **回滚方案**：恢复 `index.js.v1.0`、`index.wxml.v1.0` 和 `index.json`（移除 enablePullDownRefresh）
- **备份文件**：`index.js.v1.0`、`index.wxml.v1.0`（已备份 v1.0 版本）

### 2025-11-04 22:44:31 — home 页面 v1.0
- **feat(user)**: 初始版本，实现用户端课程确认功能
- **变更内容**：
  - 添加了待确认课程列表显示功能
  - 添加了刷新待确认课程功能
  - 优化了课程确认流程，支持列表批量确认
  - 添加了时间格式化显示功能
  - 保留了手动输入 sessionId 的备用方式



// file: apps/user/app.js
wx.cloud.init({ env: 'cloudbase-5gjteq09c1029fb0', traceUser: true })


// file: apps/user/app.json
{
  "pages": [
    "pages/home/index",
    "pages/sessions/confirmed/index",
    "pages/reports/list/index",
    "pages/reports/detail/index",
    "pages/profile/index"
  ],
  "window": {
    "navigationBarTitleText": "用户端",
    "navigationBarBackgroundColor": "#ffffff",
    "backgroundTextStyle": "light"
  },
  "lazyCodeLoading": "requiredComponents"
}




// file: apps/user/app.wxss
/* apps/user/app.wxss */

@import "./styles/theme.wxss";

/* 其余全局样式… */



// file: apps/user/pages/home/index.js
Page({

  data: {
    q: '',
    startDate: '',
    endDate: '',
    pending: [],
    loading: false,
    emptyHint: ''
  },

  onKeyword(e) {
    this.setData({ q: e.detail.value });
  },

  onStartDate(e) {
    this.setData({ startDate: e.detail.value });
  },

  onEndDate(e) {
    this.setData({ endDate: e.detail.value });
  },

  iso(d) {
    return d ? new Date(`${d} 00:00:00`.replace(/-/g, '/')).toISOString() : undefined;
  },

  isoEnd(d) {
    return d ? new Date(`${d} 23:59:59`.replace(/-/g, '/')).toISOString() : undefined;
  },

  onLoad() {
    this.bootstrap()
  },

  onShow() {
    // 可选：返回页面时刷新
    // this.refreshPending()
  },

  async bootstrap() {
    try {
      this.setData({ loading: true });
      await wx.cloud.callFunction({ name: 'auth_login' });  // 确保 users 落库
      await this.refreshPending();
    } catch (e) {
      console.error('bootstrap error', e);
      wx.showToast({ title: '初始化失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async refreshPending() {
    this.setData({ loading: true, emptyHint: '' });
    try {
      const { q, startDate, endDate } = this.data;
      const { result } = await wx.cloud.callFunction({
        name: 'user_list_pending_sessions',
        data: {
          q: q || undefined,
          startFrom: this.iso(startDate),
          startTo: this.isoEnd(endDate)
        }
      });
      const list = result?.list || [];
      this.setData({
        pending: list,
        emptyHint: list.length ? '' : '暂无待确认课程'
      });
      console.log('pending sessions:', list);
    } catch (e) {
      console.error('refreshPending error', e);
      wx.showToast({ title: '刷新失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
      wx.stopPullDownRefresh && wx.stopPullDownRefresh();
    }
  },

  onPullDownRefresh() {
    this.refreshPending()
  },

  onLogin() {
    wx.cloud.callFunction({ name: "auth_login" })
      .then(res => {
        const { userId } = res.result || {};
        if (userId) wx.setStorageSync("userId", userId);
        wx.showToast({ title: "登录成功" });
        this.refreshPending();
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ icon: "error", title: "登录失败" });
      });
  },

  onPhoneInput(e) { this.setData({ phone: e.detail.value.trim() }); },

  bindPhone() {
    const phone = this.data.phone;
    if (!phone) return wx.showToast({ icon:'none', title:'请先输入手机号' });
    wx.cloud.callFunction({ name:'user_bind_phone', data:{ phone } })
      .then(()=> wx.showToast({ title:'绑定成功' }))
      .catch(err=>{
        console.error(err);
        wx.showToast({ icon:'none', title: err.message || '绑定失败' });
      });
  },

  goConfirmed() {
    wx.navigateTo({ url: '/pages/sessions/confirmed/index' });
  },

  goReports() {
    wx.navigateTo({ url: '/pages/reports/list/index' });
  },

  confirmAndAddCalendar(e) {
    const sessionId = e.currentTarget.dataset.id;
    this.confirmById(sessionId);
  },

  confirmById(sessionId){
    wx.cloud.callFunction({ name:'confirm_session', data:{ sessionId } })
      .then(r => {
        // confirm_session 返回的是平铺结构，不是嵌套在 session 中
        const s = r.result;
        if (!s || !s.title) throw new Error('未找到课程');

        // 写系统日历（真机更可靠）
        if (wx.addPhoneCalendar) {
          wx.addPhoneCalendar({
            title: s.title || '私教课',
            startTime: Math.floor(new Date(s.startAt).getTime()/1000),
            endTime: Math.floor(new Date(s.endAt).getTime()/1000),
            success: ()=> wx.showToast({ title:'已加到日历' }),
            fail: ()=> wx.showToast({ icon:'none', title:'请在真机测试日历写入' })
          });
        } else {
          wx.showToast({ icon:'none', title:'基础库过低或工具不支持日历' });
        }

        // 列表里剔除
        const rest = this.data.pending.filter(x => x._id !== sessionId);
        this.setData({ pending: rest });
      })
      .catch(err => {
        console.error(err);
        wx.showToast({ icon: "none", title: err.message || "确认失败" });
      });
  },

  fmt(iso) {
    const d = new Date(iso);
    const pad = n => (n<10 ? '0'+n : ''+n);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

});


// file: apps/user/pages/home/index.json
{
  "usingComponents": {},
  "enablePullDownRefresh": true
}



// file: apps/user/pages/home/index.wxml
<view class="section">
  <view class="section-title">待确认课程</view>
  <input placeholder="搜索课程标题" bindinput="onKeyword" value="{{q}}" />
  <picker mode="date" value="{{startDate}}" bindchange="onStartDate"><view class="chip">开始：{{startDate||'—'}}</view></picker>
  <picker mode="date" value="{{endDate}}" bindchange="onEndDate"><view class="chip">结束：{{endDate||'—'}}</view></picker>
  <button class="btn-secondary" bindtap="refreshPending" loading="{{loading}}">刷新</button>
  <view class="chips">
    <button class="chip chip--ghost" bindtap="goConfirmed">查看已确认</button>
    <button class="chip chip--ghost" bindtap="goReports">查看训练报告</button>
  </view>
</view>

<block wx:if="{{pending.length}}">
  <view class="card" wx:for="{{pending}}" wx:key="_id">
    <view class="card-title">{{item.title}}</view>
    <view class="card-sub">{{item.startAt}} ~ {{item.endAt}}</view>
    <view class="tag tag-pending">待确认</view>
    <!-- 保留"确认并加日历"原有按钮，内部使用 item._id，不展示任何 sessionId 文本 -->
    <button class="btn-primary" data-id="{{item._id}}" bindtap="confirmAndAddCalendar">确认并加日历</button>
  </view>
</block>

<view wx:else class="empty">暂无待确认课程</view>


// file: apps/user/pages/home/index.wxss

.wrap { padding: 16rpx 24rpx; }

.title { font-size: 34rpx; font-weight: 600; margin: 16rpx 0 24rpx; }

.subtitle { font-size: 28rpx; color: #333; margin: 12rpx 0; }

.card { background: #fff; padding: 24rpx; border-radius: 16rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,.04); margin-bottom: 20rpx; }

.item { display:flex; align-items:center; justify-content:space-between; background:#fff; padding:20rpx; border-radius:12rpx; margin-bottom:16rpx; box-shadow:0 2rpx 12rpx rgba(0,0,0,.04); }

.info .name { font-weight: 600; margin-bottom: 6rpx; }

.info .time { color: #666; font-size: 24rpx; }

.ipt { border: 1rpx solid #e5e5e5; padding: 16rpx; border-radius: 12rpx; margin-bottom: 16rpx; }

.btn, .small { background:#07c160; color:#fff; border-radius:12rpx; }

.btn { padding:18rpx 0; }

.small { padding:12rpx 18rpx; font-size:26rpx; }

.tips { color:#888; font-size:24rpx; margin-top:12rpx; }


// file: apps/user/pages/profile/index.js
Page({
  data: {
    info: {},
    wallet: {},
    genderText: ''
  },
  onShow() {
    this.loadProfile()
  },
  async loadProfile() {
    wx.showLoading({ title: '加载中' })
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'user_get_profile'
      })
      const user = result.user || {}
      const wallet = result.wallet || {}
      const genderText =
        user.gender === 'male' ? '男' :
        user.gender === 'female' ? '女' : '未设置'
      this.setData({ info: user, wallet, genderText })
    } catch (e) {
      console.error('loadProfile error', e)
      wx.showToast({ title: '加载失败', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  }
})



// file: apps/user/pages/profile/index.json
{
  "navigationBarTitleText": "我的信息",
  "usingComponents": {}
}



// file: apps/user/pages/profile/index.wxml
<view class="page">
  <view class="card">
    <view class="card-title">我的信息</view>
    <view class="row"><text class="label">姓名</text><text class="value">{{info.nickname || '未命名'}}</text></view>
    <view class="row"><text class="label">性别</text><text class="value">{{genderText}}</text></view>
    <view class="row"><text class="label">身高</text><text class="value">{{info.heightCm ? info.heightCm + ' cm' : '-'}}</text></view>
    <view class="row"><text class="label">体重</text><text class="value">{{info.weightKg ? info.weightKg + ' kg' : '-'}}</text></view>
    <view class="row"><text class="label">体脂率</text><text class="value">{{info.bodyFat ? info.bodyFat + ' %' : '-'}}</text></view>
    <view class="row"><text class="label">手机号</text><text class="value">{{info.phone || '-'}}</text></view>
    <view class="row"><text class="label">次数余额</text><text class="value">{{info.timesBalance != null ? info.timesBalance : '-'}}</text></view>
    <view class="row"><text class="label">金额余额</text><text class="value">{{wallet.balance != null ? wallet.balance + ' 元' : '-'}}</text></view>
  </view>
</view>



// file: apps/user/pages/profile/index.wxss
.page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 32rpx;
  box-sizing: border-box;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.04);
}

.card-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.label {
  font-size: 26rpx;
  color: #6b7280;
}

.value {
  font-size: 26rpx;
  color: #111827;
}



// file: apps/user/pages/reports/detail/index.js
Page({
  data: { report: null, loading: false },
  onLoad(q) {
    this.id = q.id;
    this.fetch();
  },
  async fetch() {
    if (!this.id) return;
    this.setData({ loading: true });
    try {
      const { result } = await wx.cloud.callFunction({
        name: 'user_get_report',
        data: { reportId: this.id }
      });
      this.setData({ report: result?.report || null });
    } catch (e) {
      console.error('fetch report detail error', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  }
});



// file: apps/user/pages/reports/detail/index.json
{
  "usingComponents": {},
  "navigationBarTitleText": "报告详情"
}



// file: apps/user/pages/reports/detail/index.wxml
<block wx:if="{{report}}">
  <view class="section">
    <view class="section-title">报告详情</view>
    <view class="helper">课程：{{report.sessionId}}</view>
    <view class="helper">RPE：{{report.RPE}} ｜ 备注：{{report.comment || '无'}}</view>
  </view>
  <view class="section">
    <view class="section-title">动作明细</view>
    <block wx:for="{{report.items || []}}" wx:key="code">
      <view class="card">
        <view class="card-title">{{item.name}}（{{item.code}}）</view>
        <view class="card-sub">组×次×重量：{{item.sets}}×{{item.reps}}×{{item.load}}{{item.unit || 'kg'}}</view>
      </view>
    </block>
  </view>
</block>

<view wx:else class="empty">报告不存在或已删除</view>



// file: apps/user/pages/reports/detail/index.wxss
/* pages/reports/detail/index.wxss */



// file: apps/user/pages/reports/list/index.js
Page({
  data: { q: '', createdFrom: '', createdTo: '', list: [], loading: false },
  onKeyword(e) {
    this.setData({ q: e.detail.value });
  },
  onCreatedFrom(e) {
    this.setData({ createdFrom: e.detail.value });
  },
  onCreatedTo(e) {
    this.setData({ createdTo: e.detail.value });
  },
  iso(d) {
    return d ? new Date(`${d} 00:00:00`.replace(/-/g, '/')).toISOString() : undefined;
  },
  isoEnd(d) {
    return d ? new Date(`${d} 23:59:59`.replace(/-/g, '/')).toISOString() : undefined;
  },
  onLoad() {
    this.fetch();
  },
  async fetch() {
    this.setData({ loading: true });
    try {
      const { q, createdFrom, createdTo } = this.data;
      const { result } = await wx.cloud.callFunction({
        name: 'user_list_reports',
        data: {
          q: q || undefined,
          createdFrom: this.iso(createdFrom),
          createdTo: this.isoEnd(createdTo),
          page: 1,
          pageSize: 50
        }
      });
      this.setData({ list: result?.list || [] });
    } catch (e) {
      console.error('fetch reports error', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  toDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/reports/detail/index?id=${id}` });
  }
});



// file: apps/user/pages/reports/list/index.json
{
  "usingComponents": {},
  "navigationBarTitleText": "训练报告"
}



// file: apps/user/pages/reports/list/index.wxml
<view class="section">
  <view class="section-title">训练报告</view>
  <input placeholder="搜索备注" bindinput="onKeyword" value="{{q}}" />
  <picker mode="date" value="{{createdFrom}}" bindchange="onCreatedFrom"><view class="chip">创建开始：{{createdFrom||'—'}}</view></picker>
  <picker mode="date" value="{{createdTo}}" bindchange="onCreatedTo"><view class="chip">创建结束：{{createdTo||'—'}}</view></picker>
  <button class="btn-secondary" bindtap="fetch" loading="{{loading}}">刷新</button>
</view>

<block wx:if="{{list.length}}">
  <view class="card" wx:for="{{list}}" wx:key="_id" data-id="{{item._id}}" bindtap="toDetail">
    <view class="card-title">报告日期：{{item.createdAt}}</view>
    <view class="card-sub">RPE：{{item.RPE || '-' }}  备注：{{item.comment || '无'}}</view>
  </view>
</block>

<view wx:else class="empty">暂无训练报告</view>



// file: apps/user/pages/reports/list/index.wxss
/* pages/reports/list/index.wxss */



// file: apps/user/pages/sessions/confirmed/index.js
Page({
  data: { q: '', startDate: '', endDate: '', list: [], loading: false },
  onKeyword(e) {
    this.setData({ q: e.detail.value });
  },
  onStartDate(e) {
    this.setData({ startDate: e.detail.value });
  },
  onEndDate(e) {
    this.setData({ endDate: e.detail.value });
  },
  iso(d) {
    return d ? new Date(`${d} 00:00:00`.replace(/-/g, '/')).toISOString() : undefined;
  },
  isoEnd(d) {
    return d ? new Date(`${d} 23:59:59`.replace(/-/g, '/')).toISOString() : undefined;
  },
  onLoad() {
    this.fetch();
  },
  async fetch() {
    this.setData({ loading: true });
    try {
      const { q, startDate, endDate } = this.data;
      const { result } = await wx.cloud.callFunction({
        name: 'user_list_confirmed_sessions',
        data: {
          q: q || undefined,
          startFrom: this.iso(startDate),
          startTo: this.isoEnd(endDate)
        }
      });
      this.setData({ list: result?.list || [] });
    } catch (e) {
      console.error('fetch confirmed sessions error', e);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },
  goReports() {
    wx.navigateTo({ url: '/pages/reports/list/index' });
  }
});



// file: apps/user/pages/sessions/confirmed/index.json
{
  "usingComponents": {},
  "navigationBarTitleText": "已确认课程"
}



// file: apps/user/pages/sessions/confirmed/index.wxml
<view class="section">
  <view class="section-title">已确认课程</view>
  <input placeholder="搜索课程标题" bindinput="onKeyword" value="{{q}}" />
  <picker mode="date" value="{{startDate}}" bindchange="onStartDate"><view class="chip">开始：{{startDate||'—'}}</view></picker>
  <picker mode="date" value="{{endDate}}" bindchange="onEndDate"><view class="chip">结束：{{endDate||'—'}}</view></picker>
  <button class="btn-secondary" bindtap="fetch" loading="{{loading}}">刷新</button>
</view>

<block wx:if="{{list.length}}">
  <view class="card" wx:for="{{list}}" wx:key="_id">
    <view class="card-title">{{item.title}}</view>
    <view class="card-sub">{{item.startAt}} ~ {{item.endAt}}</view>
    <view class="tag tag-confirmed">已确认</view>
  </view>
</block>

<view wx:else class="empty">暂无已确认课程</view>



// file: apps/user/pages/sessions/confirmed/index.wxss
/* pages/sessions/confirmed/index.wxss */



// file: apps/user/project.config.json
{
  "miniprogramRoot": ".",
  "cloudfunctionRoot": "cloudfunctions",
  "setting": {
    "useCloud": true
  },
  "appid": "wx90658577bf8d026b"
}

// file: apps/user/project.private.config.json
{
  "setting": {
    "compileHotReLoad": true,
    "urlCheck": false,
    "coverView": true,
    "lazyloadPlaceholderEnable": false,
    "skylineRenderEnable": false,
    "preloadBackgroundData": false,
    "autoAudits": false,
    "useApiHook": true,
    "useApiHostProcess": true,
    "showShadowRootInWxmlPanel": true,
    "useStaticServer": false,
    "useLanDebug": false,
    "showES6CompileOption": false,
    "checkInvalidKey": true,
    "ignoreDevUnusedFiles": true,
    "bigPackageSizeSupport": false,
    "useIsolateContext": true
  },
  "condition": {},
  "description": "项目私有配置文件。此文件中的内容将覆盖 project.config.json 中的相同字段。项目的改动优先同步到此文件中。详见文档：https://developers.weixin.qq.com/miniprogram/dev/devtools/projectconfig.html",
  "projectname": "user",
  "libVersion": "3.11.1"
}

// file: apps/user/styles/theme.wxss
/* 卡片容器 */

.section { background:#fff; border-radius:16rpx; padding:24rpx; margin:16rpx 20rpx; box-shadow:0 4rpx 16rpx rgba(0,0,0,0.04); }

.section-title { font-size:28rpx; font-weight:600; margin-bottom:16rpx; color:#111; }

.helper { color:#8c8c8c; font-size:24rpx; }

/* 主/次按钮（参照 report 页） */

.btn-primary { background:#29a745; color:#fff; border-radius:12rpx; padding:16rpx 24rpx; }

.btn-secondary { background:#f5f5f5; color:#111; border-radius:12rpx; padding:16rpx 24rpx; }

/* chip */

.chips { display:flex; gap:12rpx; flex-wrap:wrap; }

.chip { padding:8rpx 16rpx; border-radius:20rpx; background:#f6ffed; color:#52c41a; font-size:24rpx; }

.chip--ghost { background:#fafafa; color:#595959; }

/* 列表项 */

.card { background:#fff; border-radius:16rpx; padding:20rpx; margin:12rpx 20rpx; border:1rpx solid #f0f0f0; }

.card-title { font-size:28rpx; font-weight:600; }

.card-sub { font-size:24rpx; color:#666; margin-top:8rpx; }

.tag { padding:4rpx 12rpx; border-radius:12rpx; font-size:22rpx; }

.tag-pending { background:#fffbe6; color:#d48806; }

.tag-confirmed { background:#f6ffed; color:#389e0d; }

.tag-done { background:#e6f7ff; color:#096dd9; }

/* 空态 */

.empty { text-align:center; color:#8c8c8c; padding:40rpx 0; }



