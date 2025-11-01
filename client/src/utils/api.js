import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30秒超时
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  (config) => {
    // 检查是否是管理员路由
    const isAdminRoute = config.url?.includes('/admin');
    if (isAdminRoute) {
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers.token = token;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // 处理网络错误
    if (error.code === 'ERR_NETWORK' || error.message?.includes('fetch failed') || error.message?.includes('Network Error')) {
      console.error('网络请求失败，请检查：');
      console.error('1. 后端服务是否运行在端口 5000');
      console.error('2. 网络连接是否正常');
      console.error('3. CORS 配置是否正确');
      const networkError = {
        success: false,
        message: '网络连接失败，请检查后端服务是否正常运行',
        error: 'NETWORK_ERROR',
      };
      return Promise.reject(networkError);
    }
    
    // 只对非管理员路由的401错误进行处理
    // 如果是管理员相关请求，不重定向到用户登录页
    if (error.response?.status === 401) {
      const isAdminRoute = error.config?.url?.includes('/admin');
      if (!isAdminRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    // 403错误（封禁）保留完整错误信息，不在这里处理
    // 让调用方处理封禁逻辑
    const errorData = error.response?.data || { message: error.message };
    // 确保封禁信息被保留
    if (error.response?.status === 403 && error.response?.data?.isBanned) {
      errorData.isBanned = true;
      errorData.banReason = error.response.data.banReason;
    }
    // 为了保持错误对象结构，我们需要创建一个包含 response 的模拟对象
    const errorObj = {
      ...errorData,
      response: error.response ? {
        ...error.response,
        status: error.response.status,
        data: errorData
      } : undefined
    };
    return Promise.reject(errorObj);
  }
);

export default api;
