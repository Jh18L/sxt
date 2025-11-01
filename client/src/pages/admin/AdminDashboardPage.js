import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Paper,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BlockIcon from '@mui/icons-material/Block';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const result = await api.get('/admin/dashboard');
        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('获取仪表盘数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // 每30秒刷新一次
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats?.totalUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'primary',
    },
    {
      title: '今日新增',
      value: stats?.todayNewUsers || 0,
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      color: 'success',
    },
    {
      title: '在线人数',
      value: stats?.onlineUsers || 0,
      icon: <OnlinePredictionIcon sx={{ fontSize: 40 }} />,
      color: 'info',
    },
    {
      title: '活跃用户',
      value: stats?.activeUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: 'warning',
    },
    {
      title: '总报告数',
      value: stats?.totalReports || 0,
      icon: <AssessmentIcon sx={{ fontSize: 40 }} />,
      color: 'secondary',
    },
    {
      title: '黑名单用户',
      value: stats?.bannedUsers || 0,
      icon: <BlockIcon sx={{ fontSize: 40 }} />,
      color: 'error',
    },
  ];

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600 }}>
          数据看板
        </Typography>

        {/* 运行状态 */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6">程序运行状态</Typography>
              <Typography variant="body2" color="text.secondary">
                系统正常运行
              </Typography>
            </Box>
            <Chip
              label={stats?.serverStatus?.status === 'running' ? '运行中' : '已停止'}
              color={stats?.serverStatus?.status === 'running' ? 'success' : 'error'}
              sx={{ ml: 'auto' }}
            />
          </Box>
          {stats?.serverStatus && (
            <Box>
              <Typography variant="body2" color="text.secondary">
                运行时长: {formatUptime(stats.serverStatus.uptime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                最后更新: {new Date(stats.serverStatus.timestamp).toLocaleString('zh-CN')}
              </Typography>
            </Box>
          )}
        </Paper>

        <Grid container spacing={3}>
          {statCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={card.title}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Box sx={{ color: `${card.color}.main`, mb: 2 }}>
                      {card.icon}
                    </Box>
                    <Typography variant="h4" gutterBottom>
                      {card.value}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {card.title}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Box>
    </AdminLayout>
  );
}
