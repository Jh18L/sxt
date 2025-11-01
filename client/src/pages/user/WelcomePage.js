import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Paper,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Footer from '../../components/Footer';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
  hover: {
    scale: 1.05,
    y: -8,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export default function WelcomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const result = await api.get('/user/info');
        if (result.success) {
          setUserInfo(result.data);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchUserCount = async () => {
      try {
        const result = await api.get('/user/count');
        if (result.success) {
          setUserCount(result.data.count || 0);
        }
      } catch (error) {
        console.error('获取用户总数失败:', error);
      }
    };

    fetchUserInfo();
    fetchUserCount();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  const studentInfo = userInfo?.userSimpleDTO || {};
  const classInfo = userInfo?.classComplexDTO || {};

  const menuCards = [
    {
      icon: <PersonIcon sx={{ fontSize: 48 }} />,
      title: '个人信息',
      description: '查看和管理个人资料',
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      path: '/profile',
      emoji: '👤',
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 48 }} />,
      title: '考试列表',
      description: '查看所有考试成绩',
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
      path: '/exams',
      emoji: '📝',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 48 }} />,
      title: '成绩分析',
      description: '查看详细的成绩分析报告',
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      path: '/score-report',
      emoji: '📊',
    },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 0 },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* 使用人数 - 显示在Paper外面上方 */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mb: 2,
            }}
          >
            <Box
              sx={{
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                px: 2,
                py: 1,
                borderRadius: 2,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                👥 使用人数: {userCount}
              </Typography>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              mb: 4,
              background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
              color: 'white',
              borderRadius: 4,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 背景装饰 */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                filter: 'blur(40px)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: -30,
                left: -30,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                filter: 'blur(30px)',
              }}
            />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Avatar 
                  sx={{ 
                    width: { xs: 70, sm: 90 }, 
                    height: { xs: 70, sm: 90 }, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: 35, sm: 45 } }} />
                </Avatar>
              </motion.div>
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 1,
                    fontSize: { xs: '1.75rem', sm: '2.125rem' },
                    color: 'white',
                  }}
                >
                  👋 欢迎，{studentInfo.name || '同学'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
                  {classInfo.classSimpleDTO?.name && (
                    <Chip
                      label={`📚 ${classInfo.classSimpleDTO.name}`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
                    />
                  )}
                  {userInfo?.areaDTO?.name && (
                    <Chip
                      label={`🏫 ${userInfo.areaDTO.name}`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(10px)' }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Grid container spacing={3}>
          {menuCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={card.path}>
              <motion.div
                custom={index}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: card.gradient || `linear-gradient(90deg, ${card.color} 0%, ${card.color}dd 100%)`,
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 8px 24px ${card.color}40`,
                    },
                  }}
                  onClick={() => navigate(card.path)}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: card.gradient || `linear-gradient(135deg, ${card.color}15 0%, ${card.color}30 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px',
                          border: `2px solid ${card.color}40`,
                          boxShadow: `0 4px 12px ${card.color}30`,
                        }}
                      >
                        <Box sx={{ color: 'white' }}>
                          {card.icon}
                        </Box>
                      </Box>
                    </motion.div>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      {card.emoji} {card.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {card.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: card.color,
                        fontWeight: 500,
                        mt: 1,
                      }}
                    >
                      <span>立即查看</span>
                      <ArrowForwardIcon sx={{ ml: 0.5, fontSize: 18 }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
            <Grid item xs={12} sm={6} md={4}>
              <motion.div
                custom={3}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    borderRadius: 3,
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: 'linear-gradient(90deg, #9C27B0 0%, #7B1FA2 100%)',
                    },
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px #9C27B040',
                    },
                  }}
                  onClick={() => navigate('/about')}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <motion.div
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 20px',
                          border: '2px solid #9C27B040',
                          boxShadow: '0 4px 12px #9C27B030',
                        }}
                      >
                        <Typography sx={{ color: 'white', fontSize: 48 }}>📖</Typography>
                      </Box>
                    </motion.div>
                    <Typography
                      variant="h6"
                      gutterBottom
                      sx={{
                        fontWeight: 600,
                        mb: 1,
                      }}
                    >
                      📖 关于我们
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      了解平台信息
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        color: '#9C27B0',
                        fontWeight: 500,
                        mt: 1,
                      }}
                    >
                      <span>立即查看</span>
                      <ArrowForwardIcon sx={{ ml: 0.5, fontSize: 18 }} />
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
        </Grid>
      </Container>
      <Footer />
    </Box>
  );
}
