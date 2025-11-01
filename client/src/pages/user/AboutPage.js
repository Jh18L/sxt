import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReactMarkdown from 'react-markdown';
import api from '../../utils/api';
import Footer from '../../components/Footer';

export default function AboutPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const result = await api.get('/user/announcement', { params: { type: 'about' } });
        if (result.success && result.data) {
          setContent(result.data.content || '暂无内容');
        }
      } catch (error) {
        console.error('获取关于我们内容失败:', error);
        setContent('获取内容失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

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
          <Button
            onClick={() => navigate('/welcome')}
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 3 }}
          >
            返回
          </Button>

          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  mb: 3,
                  fontWeight: 700,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                📖 关于我们
              </Typography>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                    '& p': { mb: 2 },
                    '& h1, & h2, & h3': { mt: 3, mb: 2 },
                    '& ul, & ol': { pl: 3, mb: 2 },
                  }}
                >
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                      暂无内容
                    </Typography>
                  )}
                </Paper>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
      <Footer />
    </Box>
  );
}

