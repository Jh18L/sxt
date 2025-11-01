const mongoose = require('mongoose');

const examReportSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  account: { type: String, required: true, index: true },
  examId: { type: String, required: true, index: true },
  examName: { type: String },
  examData: { type: mongoose.Schema.Types.Mixed },
  scoreData: { type: mongoose.Schema.Types.Mixed },
  questionData: { type: mongoose.Schema.Types.Mixed },
  pointData: { type: mongoose.Schema.Types.Mixed },
  abilityData: { type: mongoose.Schema.Types.Mixed },
  fetchedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

examReportSchema.index({ userId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('ExamReport', examReportSchema);
