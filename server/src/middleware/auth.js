const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.headers.token;
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未提供认证令牌' });
    }

    // 验证JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sxt-platform-secret-key-2024');
    
    // 查找用户
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: '用户不存在' });
    }
    
    if (user.isBanned) {
      return res.status(403).json({ 
        success: false, 
        message: user.banReason || '账户已被封禁',
        isBanned: true,
        banReason: user.banReason
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的认证令牌' });
  }
};

const adminMiddleware = async (req, res, next) => {
  try {
    // 简单的管理员验证，可以后续扩展
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: '需要管理员权限' });
    }
    
    // 这里可以添加更复杂的管理员验证逻辑
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sxt-platform-secret-key-2024');
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ success: false, message: '需要管理员权限' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '无效的管理员令牌' });
  }
};

module.exports = { authMiddleware, adminMiddleware };
