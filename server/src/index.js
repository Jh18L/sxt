const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const examRoutes = require('./routes/exam');
const analysisRoutes = require('./routes/analysis');
const adminRoutes = require('./routes/admin');

dotenv.config();

const app = express();

// 中间件
app.use(cors({
  origin: true, // 允许所有来源
  credentials: true,
}));
// 增加请求体大小限制到 50MB，以支持大型备份文件导入
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:22k7lfr2@dbconn.sealosbja.site:42762/?directConnection=true')
.then(() => console.log('✅ MongoDB连接成功'))
.catch((err) => console.error('❌ MongoDB连接失败:', err));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务器运行正常' });
});

// 提供静态文件服务
// 注意：express.static只会返回存在的文件，不会拦截API路由
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));

// 处理 React Router 的路由 - 必须在所有路由之后
// 只处理非API的GET请求，其他HTTP方法的API请求应该已经被上面的路由处理了
app.get('*', (req, res, next) => {
  // 跳过API路由
  if (req.path.startsWith('/api')) {
    return next(); // 让Express返回404
  }
  
  // 非API路由返回index.html（支持React Router）
  const indexPath = path.join(publicPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('发送index.html失败:', err);
      res.status(500).send('服务器错误：无法加载页面');
    }
  });
});

// 开发环境默认5000端口，生产环境默认8080端口
const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 8080 : 5000);
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📦 环境: ${NODE_ENV}`);
  console.log(`📁 静态文件目录: ${publicPath}`);
  
  // 检查静态文件目录是否存在
  if (fs.existsSync(publicPath)) {
    console.log(`✅ 静态文件目录存在`);
  } else {
    console.warn(`⚠️  警告: 静态文件目录不存在，前端可能无法正常访问`);
  }
});
