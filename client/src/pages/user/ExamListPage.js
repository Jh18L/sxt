import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Paper,
  Button,
  Avatar,
} from '@mui/material';
import { motion } from 'framer-motion';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../../utils/api';
import Footer from '../../components/Footer';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.34, 1.56, 0.64, 1],
    },
  }),
  hover: {
    scale: 1.02,
    y: -8,
    transition: {
      duration: 0.3,
      ease: [0.34, 1.56, 0.64, 1],
    },
  },
};

export default function ExamListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const result = await api.get('/exam/list', {
          params: { page: 1, size: 50 }
        });
        if (result.success && result.data) {
          setExams(result.data.dataList || []);
        }
      } catch (error) {
        console.error('获取考试列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 1,
                background: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              📝 考试列表
            </Typography>
            <Typography variant="body1" color="text.secondary">
              查看您的所有考试记录
            </Typography>
          </Box>
        </motion.div>

        {exams.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: 6, 
                textAlign: 'center',
                borderRadius: 4,
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.9)',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
                😔 暂无考试记录
              </Typography>
              <Typography variant="body2" color="text.secondary">
                您还没有任何考试记录
              </Typography>
            </Paper>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {exams.map((exam, index) => (
              <Grid item xs={12} sm={6} md={6} key={exam.id}>
                <motion.div
                  custom={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <Card
                    elevation={0}
                    sx={{
                      height: '100%',
                      cursor: 'pointer',
                      borderRadius: 3,
                      backdropFilter: 'blur(20px)',
                      background: 'rgba(255, 255, 255, 0.95)',
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
                        background: 'linear-gradient(90deg, #757575 0%, #616161 100%)',
                      },
                      '&:hover': {
                        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                    onClick={() => navigate(`/exam/${exam.id}`)}
                  >
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1.5, sm: 2 }, mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: { xs: 48, sm: 56 },
                            height: { xs: 48, sm: 56 },
                          }}
                        >
                          <AssignmentIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              mb: 1,
                              lineHeight: 1.3,
                              fontSize: { xs: '1.125rem', sm: '1.25rem' },
                            }}
                          >
                            {exam.name}
                          </Typography>
                          <Chip 
                            label={exam.gradeName} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'rgba(103, 126, 234, 0.1)',
                              color: 'primary.main',
                              fontWeight: 500,
                            }}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            mb: 1,
                            py: 0.5,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            考试日期：{exam.startTime || '-'}
                          </Typography>
                        </Box>
                        {exam.releaseTime && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              py: 0.5,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              发布日期：{exam.releaseTime}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        <Chip 
                          icon={<SchoolIcon sx={{ fontSize: 16 }} />}
                          label={`${exam.schoolCount || 0}所学校`} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(156, 39, 176, 0.1)',
                            color: 'secondary.main',
                          }}
                        />
                        <Chip 
                          icon={<PeopleIcon sx={{ fontSize: 16 }} />}
                          label={`${exam.examCount || 0}人参与`} 
                          size="small" 
                          sx={{ 
                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                            color: 'info.main',
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          color: 'primary.main',
                          fontWeight: 500,
                          mt: 2,
                          pt: 2,
                          borderTop: '1px solid rgba(0,0,0,0.08)',
                        }}
                      >
                        <span>查看详情</span>
                        <ArrowForwardIcon sx={{ ml: 0.5, fontSize: 18 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
      <Footer />
    </Box>
  );
}
