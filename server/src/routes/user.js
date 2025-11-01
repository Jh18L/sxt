const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { searchSchools, searchClasses, studentJoinClass, getUserInfo, logout } = require('../utils/sxtApi');
const User = require('../models/User');
const Announcement = require('../models/Announcement');

// 获取用户信息
router.get('/info', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    
    // 从生学堂获取最新用户信息
    if (user.token) {
      try {
        const sxtUserInfo = await getUserInfo(user.token);
        if (sxtUserInfo.success && sxtUserInfo.data) {
          // 更新本地用户信息
          user.userInfo = sxtUserInfo.data;
          user.name = sxtUserInfo.data.userSimpleDTO?.name;
          user.phoneNumber = sxtUserInfo.data.userSimpleDTO?.phoneNumber;
          user.idCard = sxtUserInfo.data.userSimpleDTO?.idnumber;
          user.userId = sxtUserInfo.data.userSimpleDTO?.id;
          user.classId = sxtUserInfo.data.classComplexDTO?.classSimpleDTO?.id;
          user.className = sxtUserInfo.data.classComplexDTO?.classSimpleDTO?.name;
          user.schoolId = sxtUserInfo.data.areaDTO?.id;
          user.schoolName = sxtUserInfo.data.areaDTO?.name;
          await user.save();
          
          return res.json({
            success: true,
            data: sxtUserInfo.data
          });
        }
      } catch (error) {
        console.error('获取生学堂用户信息失败:', error);
      }
    }

    // 返回本地存储的用户信息
    res.json({
      success: true,
      data: user.userInfo || {
        userSimpleDTO: {
          name: user.name,
          phoneNumber: user.phoneNumber,
          idnumber: user.idCard
        }
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取用户信息失败' });
  }
});

// 搜索学校
router.get('/schools/search', authMiddleware, async (req, res) => {
  try {
    const { schoolName } = req.query;
    const user = req.user;
    
    if (!schoolName) {
      return res.status(400).json({ success: false, message: '学校名称不能为空' });
    }

    if (!user.token) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const result = await searchSchools(schoolName, user.token);
    res.json(result);
  } catch (error) {
    console.error('搜索学校错误:', error);
    res.status(500).json({ success: false, message: error.message || '搜索学校失败' });
  }
});

// 搜索班级
router.get('/classes/search', authMiddleware, async (req, res) => {
  try {
    const { schoolId } = req.query;
    const user = req.user;
    
    if (!schoolId) {
      return res.status(400).json({ success: false, message: '学校ID不能为空' });
    }

    if (!user.token) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const result = await searchClasses(schoolId, user.token);
    res.json(result);
  } catch (error) {
    console.error('搜索班级错误:', error);
    res.status(500).json({ success: false, message: error.message || '搜索班级失败' });
  }
});

// 学生绑定
router.post('/bind', authMiddleware, async (req, res) => {
  try {
    const { studentName, studentIdCard, classId } = req.body;
    const user = req.user;
    
    if (!studentName || !studentIdCard || !classId) {
      return res.status(400).json({ success: false, message: '学生姓名、身份证号和班级ID不能为空' });
    }

    if (!user.token) {
      return res.status(401).json({ success: false, message: '用户未登录' });
    }

    const result = await studentJoinClass(studentName, studentIdCard, classId, user.token);
    
    if (result.success && result.data && result.data.studentId) {
      // 绑定成功，更新用户信息
      user.name = result.data.studentName || studentName;
      user.idCard = studentIdCard;
      user.classId = result.data.classId;
      user.className = result.data.className;
      user.schoolId = result.data.schoolId;
      user.schoolName = result.data.schoolName;
      user.userId = result.data.studentId;
      await user.save();
    }

    res.json(result);
  } catch (error) {
    console.error('学生绑定错误:', error);
    res.status(500).json({ success: false, message: error.message || '学生绑定失败' });
  }
});

// 获取公示信息（公开接口，无需认证）
router.get('/announcement', async (req, res) => {
  try {
    const { type } = req.query;
    if (!type || !['about', 'copyright', 'agreement'].includes(type)) {
      return res.status(400).json({ success: false, message: '无效的类型参数' });
    }
    
    let announcement = await Announcement.findOne({ type });
    if (!announcement) {
      // 如果是copyright类型，设置默认值
      if (type === 'copyright') {
        announcement = { type: 'copyright', content: '2025©狐三岁' };
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

// 获取用户总数（公开接口，无需认证）
router.get('/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ success: true, data: { count } });
  } catch (error) {
    console.error('获取用户总数错误:', error);
    res.status(500).json({ success: false, message: error.message || '获取失败' });
  }
});

module.exports = router;
