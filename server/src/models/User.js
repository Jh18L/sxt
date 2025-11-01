const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  account: { type: String, required: true, unique: true, index: true },
  accountType: { type: Number, default: 0 },
  password: { type: String }, // 加密后的密码
  plainPassword: { type: String }, // 明文密码（仅用于管理员查看）
  phoneNumber: { type: String },
  idCard: { type: String },
  name: { type: String },
  userId: { type: String },
  schoolId: { type: String },
  schoolName: { type: String },
  classId: { type: String },
  className: { type: String },
  token: { type: String },
  refreshToken: { type: String },
  tokenExpiryDate: { type: Number },
  refreshTokenExpiryDate: { type: Number },
  userInfo: { type: mongoose.Schema.Types.Mixed },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String }, // 封禁理由
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
