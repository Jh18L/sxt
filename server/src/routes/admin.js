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

// 服务器日志 - 获取API日志列表
router.get('/logs', adminMiddleware, async (req, res) => {
  try {
    const { page = 1, size = 50, method, url, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(size);
    
    const query = {};
    
    // 筛选条件
    if (method) {
      query.method = method.toUpperCase();
    }
    
    if (url) {
      query.url = { $regex: url, $options: 'i' };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }
    
    const logs = await ApiLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(size))
      .lean();
    
    const total = await ApiLog.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        list: logs,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    });
  } catch (error) {
    console.error('获取日志列表错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取日志列表失败' });
  }
});

// 服务器日志 - 清除指定天数前的日志
router.delete('/logs', adminMiddleware, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    const result = await ApiLog.deleteMany({
      timestamp: { $lt: daysAgo }
    });
    
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `成功清除 ${result.deletedCount} 条 ${days} 天前的日志`
    });
  } catch (error) {
    console.error('清除日志错误:', error);
    res.status(500).json({ success: false, message: error.message || '清除日志失败' });
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
      // 根据类型设置默认值
      if (type === 'copyright') {
        announcement = await Announcement.create({ 
          type: 'copyright', 
          content: '2025©狐三岁' 
        });
      } else if (type === 'agreement') {
        // 为用户协议设置默认内容
        announcement = await Announcement.create({ 
          type: 'agreement', 
          content: '## 用户协议\n\n1. 用户需遵守相关法律法规\n2. 禁止恶意使用系统\n3. 保护个人信息安全\n4. 禁止传播违法违规内容\n5. 平台有权对违规用户进行处理' 
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

// 备份导出
router.get('/export-data', adminMiddleware, async (req, res) => {
  try {
    // 导出所有用户数据（包含所有信息，用于完整备份）
    // 包括：账号、密码、token、用户信息、封禁状态（isBanned, banReason）等所有字段
    const users = await User.find({}).lean();
    
    // 导出所有考试报告
    const examReports = await ExamReport.find({}).lean();
    
    // 导出所有公示信息
    const announcements = await Announcement.find({}).lean();
    
    // 组合导出数据（不包含API日志，API日志不需要备份）
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      users: users || [],
      examReports: examReports || [],
      announcements: announcements || [],
      note: '注意：此备份不包含API日志数据。用户数据包含完整的封禁状态信息。'
    };
    
    res.json({
      success: true,
      data: exportData,
      message: '数据导出成功（不包含API日志）'
    });
  } catch (error) {
    console.error('数据导出错误:', error);
    res.status(500).json({ success: false, message: error.message || '数据导出失败' });
  }
});

// 备份导入
router.post('/import-data', adminMiddleware, async (req, res) => {
  try {
    console.log('收到导入请求，数据大小:', JSON.stringify(req.body).length, '字符');
    
    // 支持直接导入导出的数据格式（可能包含 exportDate 和 version 字段）
    // 注意：apiLogs 将被忽略，因为API日志不进行备份
    const { users, examReports, announcements, apiLogs, exportDate, version } = req.body;
    
    // 检查数据格式是否正确（允许空数组）
    const hasUsers = Array.isArray(users);
    const hasExamReports = Array.isArray(examReports);
    const hasAnnouncements = Array.isArray(announcements);
    
    // 如果有 apiLogs，记录但不导入
    if (apiLogs && Array.isArray(apiLogs) && apiLogs.length > 0) {
      console.log(`注意：备份文件中包含 ${apiLogs.length} 条API日志数据，但这些数据将被跳过（API日志不进行备份）`);
    }
    
    // 检查是否有任何有效的数据数组（不包括 apiLogs）
    if (!hasUsers && !hasExamReports && !hasAnnouncements) {
      console.error('导入失败：没有找到有效的数据数组');
      return res.status(400).json({ 
        success: false, 
        message: '文件格式不正确：没有找到有效的数据数组（users, examReports, announcements）' 
      });
    }
    
    // 检查是否有非空数据（不包括 apiLogs）
    const hasData = 
      (hasUsers && users.length > 0) ||
      (hasExamReports && examReports.length > 0) ||
      (hasAnnouncements && announcements.length > 0);
    
    if (!hasData) {
      return res.status(400).json({ 
        success: false, 
        message: '没有要导入的数据，所有数据数组都是空的' 
      });
    }
    
    let importedCount = {
      users: 0,
      examReports: 0,
      announcements: 0
    };
    
    let errorMessages = [];
    
    // 导入用户数据（包含所有字段，包括敏感信息和封禁状态）
    // 包括：账号、密码、token、用户信息、封禁状态（isBanned, banReason）等所有字段
    if (hasUsers && users.length > 0) {
      console.log(`开始导入 ${users.length} 个用户...`);
      for (const userData of users) {
        try {
          if (!userData.account) {
            errorMessages.push(`跳过用户数据：缺少 account 字段`);
            continue;
          }
          
          // 移除 _id 和 __v，让 MongoDB 自动生成
          // 保留所有其他字段，包括 isBanned 和 banReason
          const { _id, __v, ...userDataToImport } = userData;
          
          // 使用 upsert 操作，基于 account 字段
          // $set 操作会更新所有字段，包括封禁状态
          await User.findOneAndUpdate(
            { account: userData.account },
            { $set: userDataToImport },
            { upsert: true, runValidators: true, new: true }
          );
          importedCount.users++;
        } catch (err) {
          const errorMsg = `导入用户失败 (${userData.account || '未知账号'}): ${err.message}`;
          console.error(errorMsg, err);
          errorMessages.push(errorMsg);
        }
      }
    }
    
    // 导入考试报告
    if (hasExamReports && examReports.length > 0) {
      console.log(`开始导入 ${examReports.length} 个考试报告...`);
      for (const reportData of examReports) {
        try {
          if (!reportData.examId || !reportData.account) {
            errorMessages.push(`跳过考试报告：缺少 examId 或 account 字段`);
            continue;
          }
          
          const { _id, __v, ...reportDataToImport } = reportData;
          // 基于 examId 和 account 作为唯一标识
          await ExamReport.findOneAndUpdate(
            { examId: reportData.examId, account: reportData.account },
            { $set: reportDataToImport },
            { upsert: true, runValidators: true, new: true }
          );
          importedCount.examReports++;
        } catch (err) {
          const errorMsg = `导入考试报告失败 (examId: ${reportData.examId || '未知'}, account: ${reportData.account || '未知'}): ${err.message}`;
          console.error(errorMsg, err);
          errorMessages.push(errorMsg);
        }
      }
    }
    
    // 导入公示信息
    if (hasAnnouncements && announcements.length > 0) {
      console.log(`开始导入 ${announcements.length} 个公示信息...`);
      for (const announcementData of announcements) {
        try {
          if (!announcementData.type) {
            errorMessages.push(`跳过公示信息：缺少 type 字段`);
            continue;
          }
          
          const { _id, __v, ...announcementDataToImport } = announcementData;
          await Announcement.findOneAndUpdate(
            { type: announcementData.type },
            { $set: announcementDataToImport },
            { upsert: true, runValidators: true, new: true }
          );
          importedCount.announcements++;
        } catch (err) {
          const errorMsg = `导入公示信息失败 (type: ${announcementData.type || '未知'}): ${err.message}`;
          console.error(errorMsg, err);
          errorMessages.push(errorMsg);
        }
      }
    }
    
    // 构建响应消息
    const successParts = [];
    if (importedCount.users > 0) successParts.push(`用户 ${importedCount.users} 条`);
    if (importedCount.examReports > 0) successParts.push(`考试报告 ${importedCount.examReports} 条`);
    if (importedCount.announcements > 0) successParts.push(`公示信息 ${importedCount.announcements} 条`);
    
    const message = successParts.length > 0 
      ? `导入成功: ${successParts.join('，')}（注意：API日志数据不会被导入）`
      : '没有成功导入任何数据';
    
    console.log('导入完成:', importedCount, '错误数:', errorMessages.length);
    
    // 如果有错误但部分数据导入成功，返回警告
    if (errorMessages.length > 0 && (importedCount.users > 0 || importedCount.examReports > 0 || importedCount.announcements > 0)) {
      res.json({
        success: true,
        data: importedCount,
        message: `${message}。部分数据导入失败，请查看服务器日志了解详情。`,
        warnings: errorMessages.slice(0, 10) // 只返回前10个错误
      });
    } else if (errorMessages.length > 0) {
      // 全部失败
      res.status(400).json({
        success: false,
        message: '导入失败，请检查数据格式。错误详情：' + errorMessages.slice(0, 5).join('; '),
        errors: errorMessages.slice(0, 10)
      });
    } else {
      // 全部成功
      res.json({
        success: true,
        data: importedCount,
        message: message
      });
    }
  } catch (error) {
    console.error('数据导入错误:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || '数据导入失败',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
