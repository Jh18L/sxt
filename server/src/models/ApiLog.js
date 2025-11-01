const mongoose = require('mongoose');

const apiLogSchema = new mongoose.Schema({
  method: { type: String, required: true },
  url: { type: String, required: true },
  baseURL: { type: String },
  requestHeaders: { type: mongoose.Schema.Types.Mixed },
  requestData: { type: mongoose.Schema.Types.Mixed },
  responseStatus: { type: Number },
  responseData: { type: mongoose.Schema.Types.Mixed },
  error: { type: String },
  duration: { type: Number }, // 请求耗时（毫秒）
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

apiLogSchema.index({ timestamp: -1 });
apiLogSchema.index({ url: 1, timestamp: -1 });

module.exports = mongoose.model('ApiLog', apiLogSchema);

