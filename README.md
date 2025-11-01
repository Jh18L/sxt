# 生学堂教育数据查询平台

这是一个帮助用户获取、查看、分析和存储生学堂教育数据的Web应用系统。该平台提供用户端、管理端两套完整的功能体系。

## 技术栈

- **前端**: React + Material-UI + Framer Motion + Recharts
- **后端**: Node.js + Express
- **数据库**: MongoDB
- **Excel导出**: xlsx (SheetJS)

## 功能特性

### 用户端

- ✅ 密码登录 / 验证码登录
- ✅ 学生账号绑定
- ✅ 个人信息查看
- ✅ 考试列表查看（显示考试日期和发布日期）
- ✅ 考试成绩详情（支持等级显示、排名筛选、赋分显示）
- ✅ 小题得分分析（支持班级/学校/区县/全市得分率显示）
- ✅ 成绩分析报告
  - 排名趋势分析（折线图）
  - 学科雷达图
  - 薄弱知识点/能力分析（词云/表格模式）
- ✅ 知识点和能力分析
- ✅ 成绩报告Excel导出
- ✅ 关于我们页面（内容由管理端配置）
- ✅ 使用人数显示
- ✅ 用户协议（登录前需同意，内容由管理端配置）
- ✅ 完整的移动端适配（响应式设计，支持手机和平板）

### 管理端

- ✅ 管理员登录
- ✅ 仪表盘（统计数据、在线用户、服务器状态）
- ✅ 用户管理（查看、搜索、筛选、封禁/解封）
- ✅ 报告管理（查看所有用户的考试报告）
- ✅ 黑名单功能（查看封禁用户、封禁理由）
- ✅ 服务器日志（查看API调用日志）
- ✅ 管理员管理
  - 修改密码
  - 数据备份/恢复
  - 数据库连接配置
- ✅ 公示信息管理
  - 关于我们内容编辑
  - 版权信息编辑
  - 用户协议内容编辑

## 快速开始

### 安装依赖

```bash
# 安装根目录依赖（包含开发工具）
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 安装前端依赖
cd client && npm install && cd ..
```

或者使用项目提供的脚本（如果已配置）：

```bash
npm run install-all
```

### 配置环境变量

后端环境变量文件：`server/.env`

```env
PORT=5000
MONGODB_URI=mongodb://root:22k7lfr2@dbconn.sealosbja.site:42762/?directConnection=true
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

前端环境变量（可选）：`client/.env`

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 启动项目

同时启动前端和后端：

```bash
npm run dev
```

或分别启动：

```bash
# 后端（在项目根目录）
npm run server

# 前端（在项目根目录）
npm run client
```

### 访问应用

- 用户端: http://localhost:3000
- 管理端: http://localhost:3000/admin/login
  - 默认管理员账号: admin / admin123

## 项目结构

```
project/
├── server/           # 后端服务
│   ├── src/
│   │   ├── routes/   # API路由
│   │   │   ├── auth.js    # 认证路由
│   │   │   ├── user.js    # 用户路由
│   │   │   ├── exam.js    # 考试路由
│   │   │   ├── analysis.js # 分析路由
│   │   │   └── admin.js   # 管理路由
│   │   ├── models/   # 数据模型
│   │   │   ├── User.js
│   │   │   ├── ExamReport.js
│   │   │   ├── ApiLog.js
│   │   │   └── Announcement.js
│   │   ├── utils/    # 工具函数
│   │   │   ├── sxtApi.js  # 生学堂API封装
│   │   │   └── encrypt.js # 加密工具
│   │   └── middleware/ # 中间件
│   │       └── auth.js    # 认证中间件
│   └── package.json
├── client/           # 前端应用
│   ├── src/
│   │   ├── pages/    # 页面组件
│   │   │   ├── user/      # 用户端页面
│   │   │   └── admin/     # 管理端页面
│   │   ├── components/ # 公共组件
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── AdminProtectedRoute.js
│   │   │   ├── AdminLayout.js
│   │   │   └── Footer.js
│   │   ├── contexts/ # 上下文
│   │   │   └── AuthContext.js
│   │   └── utils/    # 工具函数
│   │       ├── api.js
│   │       └── validation.js
│   └── package.json
├── 生学堂api接口与数据说明.md  # API文档
└── package.json
```

## API文档

### 认证接口

- `POST /api/auth/login/password` - 密码登录
- `POST /api/auth/login/authcode` - 验证码登录
- `POST /api/auth/sms/send` - 发送验证码
- `POST /api/auth/sms/validate` - 验证验证码
- `POST /api/auth/logout` - 退出登录

### 用户接口

- `GET /api/user/info` - 获取用户信息
- `GET /api/user/schools/search` - 搜索学校
- `GET /api/user/classes/search` - 搜索班级
- `POST /api/user/bind` - 学生绑定
- `GET /api/user/announcement` - 获取公示信息（公开）
- `GET /api/user/count` - 获取用户总数（公开）

### 考试接口

- `GET /api/exam/list` - 获取考试列表
- `GET /api/exam/score/:examId` - 获取考试成绩

### 分析接口

- `GET /api/analysis/question/:examCourseId` - 获取小题得分
- `GET /api/analysis/point/:examCourseId` - 获取知识点分析
- `GET /api/analysis/ability/:examCourseId` - 获取能力分析

### 管理接口

- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/dashboard` - 获取仪表盘数据
- `GET /api/admin/users` - 获取用户列表
- `PATCH /api/admin/users/:userId/ban` - 禁用/启用用户
- `GET /api/admin/reports` - 获取报告列表
- `GET /api/admin/blacklist` - 获取黑名单
- `GET /api/admin/logs` - 获取服务器日志
- `GET /api/admin/announcement` - 获取公示信息
- `POST /api/admin/announcement` - 更新公示信息
- `POST /api/admin/backup/export` - 导出备份数据
- `POST /api/admin/backup/import` - 导入备份数据

## 主要依赖

### 后端依赖
- express - Web框架
- mongoose - MongoDB ODM
- axios - HTTP客户端
- jsonwebtoken - JWT认证
- crypto-js - 加密工具

### 前端依赖
- react - UI框架
- react-router-dom - 路由
- @mui/material - Material-UI组件库（响应式设计）
- @mui/icons-material - Material-UI图标
- framer-motion - 动画库
- recharts - 图表库
- xlsx - Excel文件处理
- react-markdown - Markdown渲染
- axios - HTTP客户端
- crypto-js - 加密工具

## 注意事项

1. 生学堂接口为第三方抓取，请求参数需严格按照文档示例
2. 密码和验证码需要经过AES加密处理（密钥：JMybKEd6L1cVpw==）
3. 验证码登录需要先检查账号绑定状态
4. 数据库会自动缓存有价值的用户信息和考试报告数据
5. 所有用户界面底部显示版权信息，可在管理端公示信息中修改
6. 关于我们页面内容可在管理端公示信息中编辑，支持Markdown格式
7. 项目已完全适配移动端，支持响应式设计，可在手机、平板和桌面设备上流畅使用

## 开发说明

### 开发模式
- 后端：`npm run server` 启动在 5000 端口
- 前端：`npm run client` 启动在 3000 端口

### 构建部署
```bash
# 构建前端
cd client && npm run build

# 生产模式启动后端（需要设置环境变量）
cd server && NODE_ENV=production node src/index.js
```

## 许可证

MIT

## 版权信息

2025©狐三岁
