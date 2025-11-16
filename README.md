# 健身房管理系统

## 项目说明

本项目是一个健身房管理系统，包含用户端和管理端小程序，以及云函数服务。

---

## 项目验证

验证 Monorepo 结构是否符合要求：

```bash
node scripts/verify-monorepo.js
```

---

## 云函数操作说明

### 运行 seed_training_catalog 云函数

**更新时间：2025-11-04 20:05:41**

#### 功能说明
`seed_training_catalog` 云函数用于初始化训练动作目录数据，会向 `training_catalog` 集合（tenantId='t_default'）插入以下训练动作：

- SQ 深蹲 - kg - 20
- DL 硬拉 - kg - 30
- BP 卧推 - kg - 20
- ROW 俯身划船 - kg - 15
- PLANK 平板支撑 - sec - 60

该函数具有幂等性：如果某个 code 已存在，则跳过该记录，不会重复插入。

#### 在微信开发者工具中运行该函数

**步骤一：打开小程序工程**
1. 打开微信开发者工具
2. 打开任一小程序工程（`/app/user` 或 `/app/admin`）
3. 确保小程序代码中的 `wx.cloud.init` 的 `env` 参数与目标云开发环境一致

**步骤二：上传并部署云函数**
1. 在微信开发者工具左侧面板，点击【云开发】图标
2. 在云开发面板中，切换到【云函数】标签页
3. 找到 `seed_training_catalog` 云函数文件夹
4. 右键点击该文件夹，选择【上传并部署：云端安装依赖】
5. 等待部署完成（控制台会显示部署进度）

**步骤三：运行云函数**
1. 在【云函数】列表中，找到 `seed_training_catalog`
2. 点击右侧的【云端运行】按钮
3. 在弹出的运行窗口中，点击【运行】按钮
4. 查看返回结果：
   - `inserted`: 成功插入的记录数
   - `skipped`: 跳过的记录数（已存在的记录）

**示例返回结果：**
```json
{
  "inserted": 5,
  "skipped": 0
}
```

如果是第二次运行，可能返回：
```json
{
  "inserted": 0,
  "skipped": 5
}
```

#### 注意事项
- 确保云开发环境已正确配置
- 确保数据库权限允许云函数写入数据
- 如果出现错误，请检查云函数日志查看详细信息

---

## 文件结构

```
gym-monorepo/
├── apps/                    # 小程序应用
│   ├── admin/             # 管理端小程序
│   │   └── cloudfunctions/  # 云函数（管理端专用）
│   │       ├── _base.js           # 通用初始化文件
│   │       ├── auth_login/        # 登录认证
│   │       ├── seed_training_catalog/  # 训练目录种子数据
│   │       └── ...
│   └── user/              # 用户端小程序
└── scripts/               # 脚本文件
```

---

## 如何在微信开发者工具中打开与上传

- 分别作为两个项目打开：

  - /apps/admin  （appid: wx90658577bf8d026b）

  - /apps/user   （appid: TODO_USER_APPID）

- 两个项目的 app.js 都已使用同一环境：cloudbase-5gjteq09c1029fb0

- 左侧【云开发】选择该环境 → 【云函数】：

  - 若看到列表，直接"上传并部署"

  - 若列表为空，检查 project.config.json 的 cloudfunctionRoot 是否正确：
    - `/apps/admin` 项目的 cloudfunctionRoot 为 `cloudfunctions`（相对路径）
    - `/apps/user` 项目的 cloudfunctionRoot 需要根据实际情况配置

- 建议先运行 seed_training_catalog（云端运行一次），看到 { inserted, skipped } 即成功

---

## 上传云函数

- 打开 `/apps/admin` 项目 → 云开发 → 选择环境 `cloudbase-5gjteq09c1029fb0`

- 在"云函数"页看到 5 个函数，逐个"上传并部署"

- 运行 `seed_training_catalog`，返回 `{ inserted, skipped }` 即成功

---

## 更新记录

**更新时间：2025-11-15 16:58:33**

### 新增课程表页面和云函数
- 新增云函数 `/apps/admin/cloudfunctions/admin_list_all_sessions/index.js`：按日期查询当天所有课程，自动获取当前管理员的 tenantId，并补充学员昵称和手机号
- 新增云函数 `/apps/admin/cloudfunctions/admin_list_all_sessions/package.json`：云函数依赖配置
- 新增 `/apps/admin/pages/sessions/overview/index.wxml`：课程表页面结构，包含日期选择器、状态筛选和课程列表
- 新增 `/apps/admin/pages/sessions/overview/index.js`：页面逻辑，支持按日期和状态筛选课程，点击课程跳转到详情页
- 新增 `/apps/admin/pages/sessions/overview/index.wxss`：页面样式，现代化卡片式设计，状态标签使用不同颜色区分
- 新增 `/apps/admin/pages/sessions/overview/index.json`：页面配置文件
- 影响范围：管理端新增课程表功能，首页"课程表"按钮可正常跳转
- 功能说明：支持按日期查看当天所有课程，可按状态筛选（全部/待确认/已确认/已完成），显示课程时间、标题、学员信息，点击课程可跳转到详情页
- 部署说明：需要在微信开发者工具中上传并部署 `admin_list_all_sessions` 云函数
- 回滚方案：删除 `pages/sessions/overview/` 目录和 `cloudfunctions/admin_list_all_sessions/` 目录，并从 `app.json` 的 pages 数组中移除对应路径

---

**更新时间：2025-11-15 16:56:18**

### 新增学员管理页面
- 新增 `/apps/admin/pages/users/index.wxml`：学员管理页面结构，包含搜索框和学员列表
- 新增 `/apps/admin/pages/users/index.js`：页面逻辑，调用 `admin_search_users` 云函数获取学员列表
- 新增 `/apps/admin/pages/users/index.wxss`：页面样式，现代化卡片式设计
- 新增 `/apps/admin/pages/users/index.json`：页面配置文件
- 修改 `/apps/admin/app.json`：在 pages 数组中添加 `pages/users/index` 和 `pages/sessions/overview/index`（预留）
- 影响范围：管理端新增学员管理功能，首页"学员管理"按钮可正常跳转
- 功能说明：支持按手机号/姓名搜索学员，显示学员昵称和手机号，默认显示当前租户下所有学员
- 回滚方案：删除 `pages/users/` 目录，并从 `app.json` 的 pages 数组中移除对应路径

---

**更新时间：2025-11-15 16:54:08**

### 管理端首页优化
- 修改 `/apps/admin/pages/home/index.wxml`：移除"报告管理"入口，新增 3 个按钮（课程管理 / 课程表 / 学员管理）
- 修改 `/apps/admin/pages/home/index.js`：更新导航逻辑，新增 `goOverview()` 和 `goUsers()` 方法，移除 `goReport()` 方法；课程管理路径使用 `/pages/sessions/index`（已修正）
- 修改 `/apps/admin/pages/home/index.wxss`：更新样式为现代化卡片式设计，使用圆角按钮和不同颜色区分功能
- 影响范围：管理端首页导航功能
- 注意事项：课程表页面（`/pages/sessions/overview/index`）和学员管理页面（`/pages/users/index`）需要后续创建
- 回滚方案：如需回滚，恢复 `index.wxml`、`index.js`、`index.wxss` 三个文件到修改前的版本

---

**更新时间：2025-11-04 21:00:40**

### 添加上传云函数说明
- 在 README.md 中新增"上传云函数"小节
- 说明如何在微信开发者工具中上传和部署云函数
- 包含环境选择和运行验证步骤

---

**更新时间：2025-11-04 20:59:58**

### 云函数 package.json 规范化
- 为 `/apps/admin/cloudfunctions` 下的所有函数目录生成/更新 `package.json`
- 所有 `package.json` 统一配置：
  - `name`: 与目录同名
  - `version`: "0.0.1"
  - `main`: "index.js"
  - `engines.node`: ">=14"
  - `dependencies`: {}
- 已更新的函数目录：
  1. `admin_create_session`
  2. `auth_login`
  3. `confirm_session`
  4. `quickstartFunctions`
  5. `report_and_deduct`
  6. `seed_training_catalog`

---

**更新时间：2025-11-04 20:58:24**

### 项目结构调整
- 将根目录的 `cloudfunctions` 目录移动到 `/apps/admin/cloudfunctions`
- 更新 `/apps/admin/project.config.json`：
  - `miniprogramRoot`: "."
  - `cloudfunctionRoot`: "cloudfunctions"
  - `appid`: "wx90658577bf8d026b"
  - `setting.useCloud`: true
- 保持 `/apps/admin/app.json` 和 `/apps/admin/app.js` 不变

