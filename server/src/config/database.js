const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://root:22k7lfr2@dbconn.sealosbja.site:42762/?directConnection=true', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB已连接: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB连接错误:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
