const axios = require('axios');
const ApiLog = require('../models/ApiLog');

// 生学堂API基础配置
const SXT_API_BASE = 'https://api.sxw.cn';
const SXT_PORTAL_BASE = 'https://portal.sxw.cn';

// 日志记录辅助函数
async function logApiCall(axiosInstance, method, url, config, response, error, duration) {
  try {
    const logData = {
      method: method.toUpperCase(),
      url: url,
      baseURL: axiosInstance.defaults.baseURL,
      requestHeaders: config?.headers || {},
      requestData: config?.data || config?.params || {},
      duration: duration,
      timestamp: new Date()
    };

    if (response) {
      logData.responseStatus = response.status;
      logData.responseData = response.data;
    }

    if (error) {
      logData.responseStatus = error.response?.status || 500;
      logData.responseData = error.response?.data || { message: error.message };
      logData.error = error.message;
    }

    // 异步保存日志，不阻塞请求
    ApiLog.create(logData).catch(err => console.error('保存API日志失败:', err));
  } catch (err) {
    console.error('记录API日志错误:', err);
  }
}

// 生成Trace-Id（UUID格式）
function generateTraceId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 创建axios实例
// 使用真实的应用请求头来避免被拦截
const apiClient = axios.create({
  baseURL: SXT_API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 12; TAS-AN00 Build/HUAWEITAS-AN00)',
    'Accept-Encoding': 'gzip',
    'Connection': 'Keep-Alive',
    'versionName': '3.3.5',
    'versionCode': '335',
    'appType': 'student',
    'operatingSystem': 'android',
    'pid': 'SXT',
  }
});

const portalClient = axios.create({
  baseURL: SXT_PORTAL_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 12; TAS-AN00 Build/HUAWEITAS-AN00)',
    'Accept-Encoding': 'gzip',
    'Connection': 'Keep-Alive',
    'versionName': '3.3.5',
    'versionCode': '335',
    'appType': 'student',
    'operatingSystem': 'android',
    'pid': 'SXT',
  }
});

// 请求延迟队列（避免请求频率过高）
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 最小请求间隔500ms

// 添加请求拦截器记录日志和频率控制
const setupLogging = (client) => {
  client.interceptors.request.use(config => {
    config.metadata = { startTime: Date.now() };
    
    // 为每个请求添加Trace-Id（模拟真实应用行为）
    if (!config.headers['Trace-Id']) {
      config.headers['Trace-Id'] = generateTraceId();
    }
    
    // 频率控制：确保请求间隔至少500ms
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const delay = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      // 注意：这里不能真正延迟，因为axios拦截器不支持异步延迟
      // 实际的延迟应该在调用函数时处理
    }
    lastRequestTime = now;
    
    return config;
  });

  client.interceptors.response.use(
    response => {
      const duration = Date.now() - response.config.metadata.startTime;
      logApiCall(client, response.config.method, response.config.url, response.config, response, null, duration);
      return response;
    },
    error => {
      const duration = error.config?.metadata ? Date.now() - error.config.metadata.startTime : 0;
      logApiCall(client, error.config?.method || 'unknown', error.config?.url || '', error.config, null, error, duration);
      return Promise.reject(error);
    }
  );
};

setupLogging(apiClient);
setupLogging(portalClient);

// 检测HTML响应（错误页面）
function isHtmlResponse(data) {
  if (typeof data === 'string') {
    return data.trim().toLowerCase().startsWith('<!doctype') || 
           data.includes('<html') || 
           data.includes('405') ||
           data.includes('很抱歉，由于您访问的URL有可能对网站造成安全威胁');
  }
  return false;
}

// 从HTML响应中提取错误信息
function extractErrorFromHtml(html) {
  if (html.includes('405')) {
    return '请求被服务器安全防护拦截，请稍后重试';
  }
  if (html.includes('很抱歉，由于您访问的URL有可能对网站造成安全威胁')) {
    return '请求被安全防护拦截，可能是请求频率过高，请稍后重试';
  }
  return '服务器返回了错误页面，请稍后重试';
}

// 请求延迟辅助函数
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 密码登录
async function passwordLogin(account, password) {
  try {
    // 频率控制：确保请求间隔
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
    
    const response = await apiClient.post('/passport/api/auth/login', {
      app: 'SXT',
      password: password,
      accountType: 0,
      client: 'STUDENT',
      account: account,
      platform: 'ANDROID'
    });
    
    // 检查响应是否为HTML（错误页面）
    if (isHtmlResponse(response.data)) {
      const errorMsg = extractErrorFromHtml(response.data);
      const apiError = new Error(errorMsg);
      apiError.isHtmlResponse = true;
      apiError.statusCode = response.status || 405;
      throw apiError;
    }
    
    return response.data;
  } catch (error) {
    // 处理HTML响应错误
    if (error.response && isHtmlResponse(error.response.data)) {
      const errorMsg = extractErrorFromHtml(error.response.data);
      const apiError = new Error(errorMsg);
      apiError.isHtmlResponse = true;
      apiError.statusCode = error.response.status || 405;
      throw apiError;
    }
    
    // 统一错误格式
    const errorData = error.response?.data || { message: error.message || '网络请求失败' };
    const apiError = new Error(errorData.message || errorData.error || '登录失败');
    apiError.response = error.response;
    apiError.data = errorData;
    throw apiError;
  }
}

// 发送验证码 - POST请求，参数在URL query string中
async function sendAuthCode(phoneNumber) {
  try {
    // 频率控制：确保请求间隔（验证码发送需要更长的间隔）
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minInterval = 1000; // 验证码发送至少间隔1秒
    if (timeSinceLastRequest < minInterval) {
      await delay(minInterval - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
    
    // 文档显示方法为POST，但参数在URL中，所以使用POST + query参数
    const response = await apiClient.post(`/passport/api/sms/send_auth_code?phoneNumber=${encodeURIComponent(phoneNumber)}`, {});
    
    // 检查响应是否为HTML（错误页面）
    if (isHtmlResponse(response.data)) {
      const errorMsg = extractErrorFromHtml(response.data);
      const apiError = new Error(errorMsg);
      apiError.isHtmlResponse = true;
      apiError.statusCode = response.status || 405;
      throw apiError;
    }
    
    return response.data;
  } catch (error) {
    // 处理HTML响应错误
    if (error.response && isHtmlResponse(error.response.data)) {
      const errorMsg = extractErrorFromHtml(error.response.data);
      const apiError = new Error(errorMsg);
      apiError.isHtmlResponse = true;
      apiError.statusCode = error.response.status || 405;
      throw apiError;
    }
    
    // 统一错误格式
    const errorData = error.response?.data || { message: error.message || '网络请求失败' };
    const apiError = new Error(errorData.message || errorData.error || '发送验证码失败');
    apiError.response = error.response;
    apiError.data = errorData;
    throw apiError;
  }
}

// 验证验证码 - POST请求，参数在URL query string中
async function validAuthCode(phoneNumber, authCode) {
  try {
    // 文档显示方法为POST，但参数在URL中，所以使用POST + query参数
    const response = await apiClient.post(`/passport/api/sms/valid_auth_code?phoneNumber=${encodeURIComponent(phoneNumber)}&authCode=${encodeURIComponent(authCode)}`, {});
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 验证码登录
async function authCodeLogin(account, password) {
  try {
    const response = await apiClient.post('/passport/api/auth/login', {
      app: 'SXT',
      password: password,
      accountType: 8,
      client: 'STUDENT',
      account: account,
      platform: 'ANDROID'
    });
    return response.data;
  } catch (error) {
    // 统一错误格式
    const errorData = error.response?.data || { message: error.message || '网络请求失败' };
    const apiError = new Error(errorData.message || errorData.error || '登录失败');
    apiError.response = error.response;
    apiError.data = errorData;
    throw apiError;
  }
}

// 检查账号绑定
async function checkStudentNeedJoinClass(token) {
  try {
    const response = await apiClient.get('/sxt/api/class_join/checkStudentNeedJoinClass', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 搜索学校
async function searchSchools(schoolName, token) {
  try {
    const response = await apiClient.get('/sxt/api/user_class/search_schools_by_name', {
      params: { schoolName },
      headers: {
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 搜索班级
async function searchClasses(schoolId, token) {
  try {
    const response = await apiClient.get('/sxt/api/user_class/search_grade_level_class_by_id', {
      params: { schoolId },
      headers: {
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 学生绑定
async function studentJoinClass(studentName, studentIdCard, classId, token) {
  try {
    const response = await apiClient.post('/sxt/api/class_join/studentJoinClass', {
      currentUserType: 1,
      studentIdCard: studentIdCard,
      classId: classId,
      studentName: studentName
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 获取用户信息
async function getUserInfo(token) {
  try {
    const response = await apiClient.get('/platform/api/user/get_user_info/1', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 获取考试列表
async function getExamList(token, refreshToken, userId, page = 1, size = 20) {
  try {
    const response = await portalClient.post('/sxt-h5/api/gateway/exam/ExamQueryApi_pageForStudent', {
      isLoading: true,
      body: {
        pageableDto: { page, size },
        isObjective: false,
        semesterId: '',
        studentAccountId: userId,
        notNeedNceExam: false
      }
    }, {
      headers: {
        'role-user-id': userId,
        'Cookie': `sxt_h5_token_prod=${token}; sxt_h5_token_prod_refresh=${refreshToken}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 获取考试详细成绩
async function getExamScore(token, refreshToken, userId, examId) {
  try {
    const response = await portalClient.post('/sxt-h5/api/gateway/analysis/AnalysisMobileStudentApi_findScoreList', {
      isLoading: true,
      examId: examId,
      accountId: userId
    }, {
      headers: {
        'role-user-id': userId,
        'Cookie': `sxt_h5_token_prod=${token}; sxt_h5_token_prod_refresh=${refreshToken}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 获取小题得分
async function getStudentQuestion(token, refreshToken, userId, classId, examCourseId, courseChooseTrend = 1) {
  try {
    const response = await portalClient.post('/sxt-h5/api/gateway/analysis/AnalysisMobileStudentApi_findStudentQuestion', {
      isLoading: true,
      classId: classId,
      studentId: userId,
      examCourseId: examCourseId,
      courseChooseTrend: courseChooseTrend
    }, {
      headers: {
        'role-user-id': userId,
        'Cookie': `sxt_h5_token_prod=${token}; sxt_h5_token_prod_refresh=${refreshToken}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 获取知识点分析
async function getStudentPoint(token, refreshToken, userId, classId, examCourseId, courseChooseTrend = 1) {
  try {
    const response = await portalClient.post('/sxt-h5/api/gateway/analysis/AnalysisMobileStudentApi_findStudentPoint', {
      isLoading: true,
      classId: classId,
      studentId: userId,
      examCourseId: examCourseId,
      courseChooseTrend: courseChooseTrend
    }, {
      headers: {
        'role-user-id': userId,
        'Cookie': `sxt_h5_token_prod=${token}; sxt_h5_token_prod_refresh=${refreshToken}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 获取能力分析
async function getStudentAbility(token, refreshToken, userId, classId, examCourseId, courseChooseTrend = 1) {
  try {
    const response = await portalClient.post('/sxt-h5/api/gateway/analysis/AnalysisMobileStudentApi_findStudentAbility', {
      isLoading: true,
      classId: classId,
      studentId: userId,
      examCourseId: examCourseId,
      courseChooseTrend: courseChooseTrend
    }, {
      headers: {
        'role-user-id': userId,
        'Cookie': `sxt_h5_token_prod=${token}; sxt_h5_token_prod_refresh=${refreshToken}`
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

// 退出登录
async function logout(token) {
  try {
    const response = await apiClient.get('/passport/api/auth/unbind', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'token': token
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}

module.exports = {
  passwordLogin,
  sendAuthCode,
  validAuthCode,
  authCodeLogin,
  checkStudentNeedJoinClass,
  searchSchools,
  searchClasses,
  studentJoinClass,
  getUserInfo,
  getExamList,
  getExamScore,
  getStudentQuestion,
  getStudentPoint,
  getStudentAbility,
  logout
};
