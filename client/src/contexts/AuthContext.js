import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内使用');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('解析用户信息失败:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (loginData) => {
    try {
      const response = await api.post('/auth/login/password', loginData);
      if (response.success) {
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || '登录失败' };
    }
  };

  const loginWithAuthCode = async (account, authCode) => {
    try {
      const response = await api.post('/auth/login/authcode', { account, authCode });
      if (response.success) {
        if (response.needBind) {
          return { success: true, needBind: true, data: response.data };
        }
        const userData = response.data.user;
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true, needBind: false, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message || '登录失败' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const sendAuthCode = async (phoneNumber) => {
    try {
      // POST请求，参数在body中（后端会处理）
      const response = await api.post('/auth/sms/send', { phoneNumber });
      return response;
    } catch (error) {
      return { success: false, message: error.message || '发送验证码失败' };
    }
  };

  const validateAuthCode = async (phoneNumber, authCode) => {
    try {
      // POST请求，参数在body中（后端会处理）
      const response = await api.post('/auth/sms/validate', { phoneNumber, authCode });
      return response;
    } catch (error) {
      return { success: false, message: error.message || '验证码验证失败' };
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithAuthCode,
    logout,
    sendAuthCode,
    validateAuthCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
