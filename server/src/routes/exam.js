const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { getExamList, getExamScore } = require('../utils/sxtApi');
const ExamReport = require('../models/ExamReport');
const User = require('../models/User');

// 获取考试列表
router.get('/list', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const { page = 1, size = 20 } = req.query;
    
    if (!user.token || !user.refreshToken || !user.userId) {
      return res.status(401).json({ success: false, message: '用户未登录或信息不完整' });
    }

    // 从生学堂获取考试列表
    const result = await getExamList(user.token, user.refreshToken, user.userId, parseInt(page), parseInt(size));
    
    if (result.success && result.data) {
      // 保存考试列表到数据库
      for (const exam of result.data.dataList || []) {
        await ExamReport.findOneAndUpdate(
          { userId: user.userId, examId: exam.id },
          {
            userId: user.userId,
            account: user.account,
            examId: exam.id,
            examName: exam.name,
            examData: exam
          },
          { upsert: true, new: true }
        );
      }
    }

    res.json(result);
  } catch (error) {
    console.error('获取考试列表错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取考试列表失败' });
  }
});

// 获取考试详细成绩
router.get('/score/:examId', authMiddleware, async (req, res) => {
  try {
    const { examId } = req.params;
    const user = req.user;
    
    if (!user.token || !user.refreshToken || !user.userId) {
      return res.status(401).json({ success: false, message: '用户未登录或信息不完整' });
    }

    // 先检查数据库是否有缓存
    const cachedReport = await ExamReport.findOne({ userId: user.userId, examId });
    if (cachedReport && cachedReport.scoreData) {
      // 如果缓存较新（1小时内），直接返回
      const cacheAge = Date.now() - new Date(cachedReport.updatedAt).getTime();
      if (cacheAge < 3600000) {
        return res.json({
          success: true,
          data: cachedReport.scoreData,
          cached: true
        });
      }
    }

    // 从生学堂获取最新成绩
    const result = await getExamScore(user.token, user.refreshToken, user.userId, examId);
    
    if (result.success && result.data) {
      // 保存到数据库
      await ExamReport.findOneAndUpdate(
        { userId: user.userId, examId },
        {
          userId: user.userId,
          account: user.account,
          examId: examId,
          scoreData: result.data,
          fetchedAt: new Date()
        },
        { upsert: true, new: true }
      );
    }

    res.json(result);
  } catch (error) {
    console.error('获取考试成绩错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取考试成绩失败' });
  }
});

module.exports = router;
