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

