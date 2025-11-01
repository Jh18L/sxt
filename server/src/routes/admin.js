const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { adminMiddleware } = require('../middleware/auth');
const User = require('../models/User');
const ExamReport = require('../models/ExamReport');
const ApiLog = require('../models/ApiLog');
const Announcement = require('../models/Announcement');

// 管理员登录（简单实现，可后续扩展）
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 简单的管理员验证，可以后续扩展为独立的管理员表
    if (username === 'admin' && password === 'admin123') {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { isAdmin: true, username },
        process.env.JWT_SECRET || 'sxt-platform-secret-key-2024',
        { expiresIn: '24h' }
      );
      
      return res.json({
        success: true,
        data: { token, username }
      });
    }
    
    res.status(401).json({ success: false, message: '用户名或密码错误' });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({ success: false, message: error.message || '登录失败' });
  }
});

// 获取仪表盘数据
router.get('/dashboard', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLoginAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: todayStart }
    });
    const totalReports = await ExamReport.countDocuments();
    const userCount = totalUsers; // 用户总数
    const bannedUsers = await User.countDocuments({ isBanned: true });
    
    // 在线人数（最近5分钟内有活动的用户）
    const onlineUsers = await User.countDocuments({
      lastLoginAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    });
    
    // 程序运行状态（简单检查）
    const serverStatus = {
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date()
    };
    
    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        todayNewUsers,
        onlineUsers,
        totalReports,
        bannedUsers,
        serverStatus
      }
    });
  } catch (error) {
    console.error('获取仪表盘数据错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取数据失败' });
  }
});

// 用户管理 - 获取用户列表
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, size = 20, search = '', schoolId = '', classId = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(size);
    
    const query = {};
    if (search) {
      query.$or = [
        { account: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    if (schoolId) {
      query.schoolId = schoolId;
    }
    if (classId) {
      query.classId = classId;
    }
    
    const users = await User.find(query)
      .select('-token -refreshToken') // 保留password和plainPassword给管理员查看
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(size));
    
    const total = await User.countDocuments(query);
    
    // 获取学校统计
    const schoolStats = await User.aggregate([
      { $match: query },
      { $group: { _id: '$schoolId', schoolName: { $first: '$schoolName' }, count: { $sum: 1 } } },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort: { count: -1 } }
    ]);
    
    // 获取班级统计
    const classStats = await User.aggregate([
      { $match: query },
      { $group: { _id: '$classId', className: { $first: '$className' }, schoolName: { $first: '$schoolName' }, count: { $sum: 1 } } },
      { $match: { _id: { $ne: null, $ne: '' } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: parseInt(page),
        size: parseInt(size),
        schoolStats,
        classStats
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户列表失败' });
  }
});

// 用户管理 - 禁用/启用用户
router.patch('/users/:userId/ban', adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned, banReason = '' } = req.body;
    
    console.log('封禁用户请求:', { userId, isBanned, banReason });
    
    if (!userId) {
      return res.status(400).json({ success: false, message: '用户ID不能为空' });
    }
    
    const updateData = { 
      updatedAt: new Date()
    };
    
    // 明确设置isBanned状态
    if (isBanned === true || isBanned === false) {
      updateData.isBanned = isBanned;
    } else {
      updateData.isBanned = true; // 默认封禁
    }
    
    // 只有封禁时才设置理由，解禁时清空理由
    if (updateData.isBanned === true) {
      updateData.banReason = banReason || null;
    } else {
      updateData.banReason = null;
    }
    
    console.log('更新数据:', updateData);
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    
    console.log('用户更新成功:', { _id: user._id, isBanned: user.isBanned, banReason: user.banReason });
    
    res.json({
      success: true,
      data: user,
      message: updateData.isBanned ? '用户已加入黑名单' : '用户已移除黑名单'
    });
  } catch (error) {
    console.error('禁用用户错误:', error);
    res.status(500).json({ success: false, message: error.message || '操作失败' });
  }
});

// 报告管理 - 获取报告列表
router.get('/reports', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, size = 20, search = '', examId = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(size);
    
    const query = {};
    if (search) {
      query.$or = [
        { examName: { $regex: search, $options: 'i' } },
        { account: { $regex: search, $options: 'i' } }
      ];
    }
    if (examId) {
      query.examId = examId;
    }
    
    const reports = await ExamReport.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(size));
    
    // 关联用户信息
    const reportsWithUsers = await Promise.all(reports.map(async (report) => {
      const user = await User.findOne({ account: report.account });
      return {
        ...report.toObject(),
        userInfo: user ? {
          name: user.name,
          phoneNumber: user.phoneNumber,
          schoolName: user.schoolName,
          className: user.className,
          userId: user.userId,
          userInfo: user.userInfo
        } : null
      };
    }));
    
    const total = await ExamReport.countDocuments(query);
    
    // 获取考试列表（用于筛选）
    const examList = await ExamReport.distinct('examId', query);
    const exams = await Promise.all(examList.slice(0, 50).map(async (examId) => {
      const examReport = await ExamReport.findOne({ examId });
      const examUsersCount = await ExamReport.countDocuments({ examId });
      return {
        examId,
        examName: examReport?.examName || examId,
        userCount: examUsersCount
      };
    }));
    
    res.json({
      success: true,
      data: {
        list: reportsWithUsers,
        total,
        page: parseInt(page),
        size: parseInt(size),
        exams
      }
    });
  } catch (error) {
    console.error('获取报告列表错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取报告列表失败' });
  }
});

// 黑名单管理
router.get('/blacklist', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, size = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(size);
    
    const users = await User.find({ isBanned: true })
      .select('-password -token -refreshToken')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(size));
    
    const total = await User.countDocuments({ isBanned: true });
    
    res.json({
      success: true,
      data: {
        list: users,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    });
  } catch (error) {
    console.error('获取黑名单错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取黑名单失败' });
  }
});

// 数据库配置 - 获取配置
router.get('/db-config', adminMiddleware, async (req, res) => {
  try {
    const connectionString = process.env.MONGODB_URI || 'mongodb://root:22k7lfr2@dbconn.sealosbja.site:42762/?directConnection=true';
    // 返回完整连接字符串（实际使用中可能需要隐藏密码）
    res.json({
      success: true,
      data: {
        connectionString: connectionString
      }
    });
  } catch (error) {
    console.error('获取数据库配置错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取配置失败' });
  }
});

// 数据库配置 - 测试连接
router.post('/db-test', adminMiddleware, async (req, res) => {
  try {
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ success: false, message: '连接字符串不能为空' });
    }

    // 创建临时连接测试
    const mongoose = require('mongoose');
    const testConnection = mongoose.createConnection(connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    await testConnection.asPromise();
    
    // 测试成功，关闭连接
    await testConnection.close();
    
    res.json({
      success: true,
      message: '数据库连接测试成功'
    });
  } catch (error) {
    console.error('数据库连接测试错误:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '数据库连接测试失败，请检查连接字符串是否正确' 
    });
  }
});

// 数据库配置 - 保存配置（仅返回提示，实际需要在环境变量或配置文件中修改）
router.post('/db-config', adminMiddleware, async (req, res) => {
  try {
    const { connectionString } = req.body;
    
    if (!connectionString) {
      return res.status(400).json({ success: false, message: '连接字符串不能为空' });
    }

    // 注意：这里只是示例，实际应该保存到配置文件或环境变量
    // 建议通过环境变量 MONGODB_URI 来配置
    res.json({
      success: true,
      message: '配置已保存（注意：需要在环境变量或配置文件中设置MONGODB_URI，并重启服务器才能生效）',
      note: '请设置环境变量 MONGODB_URI 或修改配置文件'
    });
  } catch (error) {
    console.error('保存数据库配置错误:', error);
    res.status(500).json({ success: false, message: error.message || '保存配置失败' });
  }
});

// 获取公示信息
router.get('/announcement', adminMiddleware, async (req, res) => {
  try {
    const { type } = req.query;
    if (!type || !['about', 'copyright', 'agreement'].includes(type)) {
      return res.status(400).json({ success: false, message: '无效的类型参数' });
    }
    
    let announcement = await Announcement.findOne({ type });
    if (!announcement) {
      // 如果是copyright类型，设置默认值
      if (type === 'copyright') {
        announcement = await Announcement.create({ 
          type: 'copyright', 
          content: '2025©狐三岁' 
        });
      } else {
        announcement = { type, content: '' };
      }
    }
    
    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error('获取公示信息错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取失败' });
  }
});

// 更新公示信息
router.post('/announcement', adminMiddleware, async (req, res) => {
  try {
    const { type, content } = req.body;
    if (!type || !['about', 'copyright', 'agreement'].includes(type)) {
      return res.status(400).json({ success: false, message: '无效的类型参数' });
    }
    
    const announcement = await Announcement.findOneAndUpdate(
      { type },
      { type, content: content || '', updatedAt: new Date() },
      { upsert: true, new: true }
    );
    
    res.json({ success: true, data: announcement, message: '保存成功' });
  } catch (error) {
    console.error('更新公示信息错误:', error);
    res.status(500).json({ success: false, message: error.message || '保存失败' });
  }
});

module.exports = router;
