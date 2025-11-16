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

