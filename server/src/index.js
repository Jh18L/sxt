const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:22k7lfr2@dbconn.sealosbja.site:42762/?directConnection=true', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
});
