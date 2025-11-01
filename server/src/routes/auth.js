const express = require('express');
const router = express.Router();
const { passwordLogin, sendAuthCode, validAuthCode, authCodeLogin, checkStudentNeedJoinClass } = require('../utils/sxtApi');
const { encryptAES } = require('../utils/encrypt');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 密码登录
router.post('/login/password', async (req, res) => {
  try {
    const { account, password } = req.body;
    
    if (!account || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }

    // 加密密码
    const encryptedPassword = encryptAES(password);
    
    // 调用生学堂API
    const result = await passwordLogin(account, encryptedPassword);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    // 保存或更新用户信息
    const userData = {
      account,
      accountType: 0,
      password: encryptedPassword,
      plainPassword: password, // 保存明文密码（仅用于管理员查看）
      token: result.data.token,
      refreshToken: result.data.refreshToken,
      tokenExpiryDate: result.data.tokenExpiryDate,
      refreshTokenExpiryDate: result.data.refreshTokenExpiryDate,
      lastLoginAt: new Date()
    };

    let user = await User.findOne({ account });
    if (user) {
      Object.assign(user, userData);
      await user.save();
    } else {
      user = await User.create(userData);
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id, account: user.account },
      process.env.JWT_SECRET || 'sxt-platform-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          account: user.account,
          token: user.token,
          refreshToken: user.refreshToken
        }
      }
    });
  } catch (error) {
    console.error('密码登录错误:', error);
    res.status(500).json({ success: false, message: error.message || '登录失败' });
  }
});

// 发送验证码 - POST请求，但参数在URL query string中（按文档格式）
router.post('/sms/send', async (req, res) => {
  try {
    // 支持从body或query获取参数
    const phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, message: '手机号不能为空' });
    }
    
    const result = await sendAuthCode(phoneNumber);
    res.json(result);
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ success: false, message: error.message || '发送验证码失败' });
  }
});

// 验证验证码 - POST请求，但参数在URL query string中（按文档格式）
router.post('/sms/validate', async (req, res) => {
  try {
    // 支持从body或query获取参数
    const phoneNumber = req.body.phoneNumber || req.query.phoneNumber;
    const authCode = req.body.authCode || req.query.authCode;
    
    if (!phoneNumber || !authCode) {
      return res.status(400).json({ success: false, message: '手机号和验证码不能为空' });
    }

    const result = await validAuthCode(phoneNumber, authCode);
    res.json(result);
  } catch (error) {
    console.error('验证验证码错误:', error);
    res.status(500).json({ success: false, message: error.message || '验证码验证失败' });
  }
});

// 验证码登录
router.post('/login/authcode', async (req, res) => {
  try {
    const { account, authCode } = req.body;
    
    if (!account || !authCode) {
      return res.status(400).json({ success: false, message: '账号和验证码不能为空' });
    }

    // 加密验证码作为密码（前端传的是明文验证码）
    const encryptedPassword = encryptAES(authCode);
    
    // 调用生学堂API
    const result = await authCodeLogin(account, encryptedPassword);
    
    if (!result.success) {
      return res.status(401).json(result);
    }

    // 检查账号绑定
    const bindCheck = await checkStudentNeedJoinClass(result.data.token);
    if (bindCheck.data === true) {
      // 未绑定，需要先绑定
      return res.json({
        success: true,
        needBind: true,
        data: {
          token: result.data.token,
          refreshToken: result.data.refreshToken,
          message: '账号未绑定学生，请先完成绑定'
        }
      });
    }

    // 保存或更新用户信息
    const userData = {
      account,
      accountType: 8,
      phoneNumber: account,
      plainPassword: authCode, // 保存验证码作为明文密码（仅用于管理员查看）
      token: result.data.token,
      refreshToken: result.data.refreshToken,
      tokenExpiryDate: result.data.tokenExpiryDate,
      refreshTokenExpiryDate: result.data.refreshTokenExpiryDate,
      lastLoginAt: new Date()
    };

    let user = await User.findOne({ account });
    if (user) {
      Object.assign(user, userData);
      await user.save();
    } else {
      user = await User.create(userData);
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user._id, account: user.account },
      process.env.JWT_SECRET || 'sxt-platform-secret-key-2024',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      needBind: false,
      data: {
        token,
        user: {
          id: user._id,
          account: user.account,
          token: user.token,
          refreshToken: user.refreshToken
        }
      }
    });
  } catch (error) {
    console.error('验证码登录错误:', error);
    res.status(500).json({ success: false, message: error.message || '登录失败' });
  }
});

// 检查账号绑定
router.get('/check-bind', async (req, res) => {
  try {
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ success: false, message: '需要提供token' });
    }

    const result = await checkStudentNeedJoinClass(token);
    res.json(result);
  } catch (error) {
    console.error('检查绑定错误:', error);
    res.status(500).json({ success: false, message: error.message || '检查绑定失败' });
  }
});

// 退出登录
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.token || req.headers.authorization?.replace('Bearer ', '');
    
    // 如果有token，调用生学堂退出接口
    if (token) {
      try {
        const { logout } = require('../utils/sxtApi');
        await logout(token);
      } catch (error) {
        console.error('调用生学堂退出接口失败:', error);
        // 即使生学堂退出失败，也继续执行本地退出
      }
    }
    
    res.json({ success: true, message: '退出成功' });
  } catch (error) {
    console.error('退出登录错误:', error);
    res.status(500).json({ success: false, message: error.message || '退出失败' });
  }
});

module.exports = router;
