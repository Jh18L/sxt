const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['about', 'copyright', 'agreement'], // about: 关于我们, copyright: 版权信息, agreement: 用户协议
    unique: true
  },
  content: {
    type: String,
    required: true,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 确保每个类型只有一个文档
announcementSchema.index({ type: 1 }, { unique: true });

module.exports = mongoose.model('Announcement', announcementSchema);

