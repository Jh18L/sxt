const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getStudentQuestion, getStudentPoint, getStudentAbility } = require('../utils/sxtApi');
const ExamReport = require('../models/ExamReport');
const User = require('../models/User');

// 获取小题得分
router.get('/question/:examCourseId', authMiddleware, async (req, res) => {
  try {
    const { examCourseId } = req.params;
    const { courseChooseTrend = 1 } = req.query;
    const user = req.user;
    
    if (!user.token || !user.refreshToken || !user.userId || !user.classId) {
      return res.status(401).json({ success: false, message: '用户信息不完整' });
    }

    // 先检查数据库缓存
    const cachedReport = await ExamReport.findOne({ 
      userId: user.userId,
      'questionData.examCourseId': examCourseId
    });
    
    if (cachedReport && cachedReport.questionData) {
      const cacheAge = Date.now() - new Date(cachedReport.updatedAt).getTime();
      if (cacheAge < 3600000) {
        return res.json({
          success: true,
          data: Array.isArray(cachedReport.questionData) ? cachedReport.questionData : [cachedReport.questionData],
          cached: true
        });
      }
    }

    // 从生学堂获取
    const result = await getStudentQuestion(
      user.token,
      user.refreshToken,
      user.userId,
      user.classId,
      examCourseId,
      parseInt(courseChooseTrend)
    );

    if (result.success && result.data) {
      // 保存到数据库
      const examReport = await ExamReport.findOne({ userId: user.userId });
      if (examReport) {
        examReport.questionData = result.data;
        await examReport.save();
      }
    }

    res.json(result);
  } catch (error) {
    console.error('获取小题得分错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取小题得分失败' });
  }
});

// 获取知识点分析
router.get('/point/:examCourseId', authMiddleware, async (req, res) => {
  try {
    const { examCourseId } = req.params;
    const { courseChooseTrend = 1 } = req.query;
    const user = req.user;
    
    if (!user.token || !user.refreshToken || !user.userId || !user.classId) {
      return res.status(401).json({ success: false, message: '用户信息不完整' });
    }

    // 先检查数据库缓存
    const cachedReport = await ExamReport.findOne({ 
      userId: user.userId,
      'pointData.examCourseId': examCourseId
    });
    
    if (cachedReport && cachedReport.pointData) {
      const cacheAge = Date.now() - new Date(cachedReport.updatedAt).getTime();
      if (cacheAge < 3600000) {
        return res.json({
          success: true,
          data: Array.isArray(cachedReport.pointData) ? cachedReport.pointData : [cachedReport.pointData],
          cached: true
        });
      }
    }

    // 从生学堂获取
    const result = await getStudentPoint(
      user.token,
      user.refreshToken,
      user.userId,
      user.classId,
      examCourseId,
      parseInt(courseChooseTrend)
    );

    if (result.success && result.data) {
      // 保存到数据库
      const examReport = await ExamReport.findOne({ userId: user.userId });
      if (examReport) {
        examReport.pointData = result.data;
        await examReport.save();
      }
    }

    res.json(result);
  } catch (error) {
    console.error('获取知识点分析错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取知识点分析失败' });
  }
});

// 获取能力分析
router.get('/ability/:examCourseId', authMiddleware, async (req, res) => {
  try {
    const { examCourseId } = req.params;
    const { courseChooseTrend = 1 } = req.query;
    const user = req.user;
    
    if (!user.token || !user.refreshToken || !user.userId || !user.classId) {
      return res.status(401).json({ success: false, message: '用户信息不完整' });
    }

    // 先检查数据库缓存
    const cachedReport = await ExamReport.findOne({ 
      userId: user.userId,
      'abilityData.examCourseId': examCourseId
    });
    
    if (cachedReport && cachedReport.abilityData) {
      const cacheAge = Date.now() - new Date(cachedReport.updatedAt).getTime();
      if (cacheAge < 3600000) {
        return res.json({
          success: true,
          data: Array.isArray(cachedReport.abilityData) ? cachedReport.abilityData : [cachedReport.abilityData],
          cached: true
        });
      }
    }

    // 从生学堂获取
    const result = await getStudentAbility(
      user.token,
      user.refreshToken,
      user.userId,
      user.classId,
      examCourseId,
      parseInt(courseChooseTrend)
    );

    if (result.success && result.data) {
      // 保存到数据库
      const examReport = await ExamReport.findOne({ userId: user.userId });
      if (examReport) {
        examReport.abilityData = result.data;
        await examReport.save();
      }
    }

    res.json(result);
  } catch (error) {
    console.error('获取能力分析错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取能力分析失败' });
  }
});

module.exports = router;
