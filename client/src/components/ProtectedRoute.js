import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Alert, Button } from '@mui/material';
import api from '../utils/api';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
    const checkBanStatus = async () => {
      if (token && !user) {
        try {
          // 尝试获取用户信息来检查封禁状态
          await api.get('/user/info');
        } catch (error) {
          if (error.response?.status === 403 && error.response?.data?.isBanned) {
            setBanInfo(error.response.data);
          }
        }
      }
    };
    checkBanStatus();
  }, [token, user]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>加载中...</Box>;
  }

  // 检查user或token，确保登录状态正确识别
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  // 如果被封禁，显示封禁信息
  if (banInfo?.isBanned) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Box>
            <strong>账户已被封禁</strong>
            {banInfo.banReason && (
              <Box sx={{ mt: 1 }}>
                <strong>封禁理由：</strong>{banInfo.banReason}
              </Box>
            )}
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
              }}>
                返回登录
              </Button>
            </Box>
          </Box>
        </Alert>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
