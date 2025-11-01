import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Button,
  Avatar,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';
import ClassIcon from '@mui/icons-material/Class';
import GradeIcon from '@mui/icons-material/Grade';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import Footer from '../../components/Footer';

const infoItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
    if (!window.confirm('确定要退出登录吗？')) {
      return;
    }
    try {
      await api.post('/auth/logout');
      logout();
      navigate('/login');
    } catch (error) {
      console.error('退出登录失败:', error);
      logout();
      navigate('/login');
    }
  };

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

    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const studentInfo = userInfo?.userSimpleDTO || {};
  const classInfo = userInfo?.classComplexDTO || {};
  const gradeInfo = classInfo?.gradeComplexDTO || {};

  const infoItems = [
    { icon: <PersonIcon />, label: '姓名', value: studentInfo.name || '-', emoji: '👤' },
    { icon: <PhoneIcon />, label: '手机号', value: studentInfo.phoneNumber || '-', emoji: '📱' },
    { icon: <BadgeIcon />, label: '身份证号', value: studentInfo.idnumber ? 
      `${studentInfo.idnumber.substring(0, 6)}****${studentInfo.idnumber.substring(12)}` : '-', emoji: '🆔' },
    { icon: <SchoolIcon />, label: '学号', value: studentInfo.sxwNumber || '-', emoji: '🎓' },
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
      <Container maxWidth="md" sx={{ flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Button
            onClick={() => navigate('/welcome')}
            variant="outlined"
            sx={{ 
              mb: 3,
              borderRadius: 2,
            }}
          >
            返回首页
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Avatar 
                  sx={{ 
                    width: { xs: 80, sm: 100 }, 
                    height: { xs: 80, sm: 100 }, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <PersonIcon sx={{ fontSize: { xs: 40, sm: 50 } }} />
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
                  👤 {studentInfo.name || '个人信息'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, color: 'white' }}>
                  {classInfo.classSimpleDTO?.name || ''} | {userInfo?.areaDTO?.name || ''}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        <Card
          elevation={0}
          sx={{
            borderRadius: 4,
            backdropFilter: 'blur(20px)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
          }}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              📋 基本信息
            </Typography>
            <Grid container spacing={3}>
              {infoItems.map((item, index) => (
                <Grid item xs={12} sm={6} key={item.label}>
                  <motion.div
                    custom={index}
                    variants={infoItemVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        background: 'rgba(103, 126, 234, 0.05)',
                        border: '1px solid rgba(103, 126, 234, 0.1)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'rgba(103, 126, 234, 0.1)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                          }}
                        >
                          {item.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {item.emoji} {item.label}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
              🏫 学校信息
            </Typography>
            <Grid container spacing={2}>
              {userInfo?.areaDTO?.name && (
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'rgba(25, 118, 210, 0.1)',
                        border: '1px solid rgba(25, 118, 210, 0.2)',
                        textAlign: 'center',
                      }}
                    >
                      <SchoolIcon sx={{ color: 'primary.main', fontSize: 32, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        学校
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {userInfo.areaDTO.name}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Grid>
              )}
              {gradeInfo?.gradeName && (
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'rgba(156, 39, 176, 0.1)',
                        border: '1px solid rgba(156, 39, 176, 0.2)',
                        textAlign: 'center',
                      }}
                    >
                      <GradeIcon sx={{ color: 'secondary.main', fontSize: 32, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        年级
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {gradeInfo.gradeName}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Grid>
              )}
              {classInfo?.classSimpleDTO?.name && (
                <Grid item xs={12} sm={6} md={4}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        background: 'rgba(46, 125, 50, 0.1)',
                        border: '1px solid rgba(46, 125, 50, 0.2)',
                        textAlign: 'center',
                      }}
                    >
                      <ClassIcon sx={{ color: 'success.main', fontSize: 32, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        班级
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {classInfo.classSimpleDTO.name}
                      </Typography>
                    </Paper>
                  </motion.div>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              🚪 退出登录
            </Button>
          </motion.div>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
