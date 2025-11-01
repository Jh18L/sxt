import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminAnnouncementPage() {
  const [tab, setTab] = useState(0);
  const [aboutContent, setAboutContent] = useState('');
  const [copyrightContent, setCopyrightContent] = useState('');
  const [agreementContent, setAgreementContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setFetchLoading(true);
    try {
      const [aboutResult, copyrightResult, agreementResult] = await Promise.all([
        api.get('/admin/announcement', { params: { type: 'about' } }),
        api.get('/admin/announcement', { params: { type: 'copyright' } }),
        api.get('/admin/announcement', { params: { type: 'agreement' } }),
      ]);

      if (aboutResult.success) {
        setAboutContent(aboutResult.data?.content || '');
      }
      if (copyrightResult.success) {
        setCopyrightContent(copyrightResult.data?.content || '2025©狐三岁');
      }
      if (agreementResult.success) {
        setAgreementContent(agreementResult.data?.content || '');
      }
    } catch (error) {
      console.error('获取公示信息失败:', error);
      setMessage({ type: 'error', text: '获取公示信息失败' });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSaveAbout = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.post('/admin/announcement', {
        type: 'about',
        content: aboutContent,
      });

      if (result.success) {
        setMessage({ type: 'success', text: '关于我们内容保存成功' });
      } else {
        setMessage({ type: 'error', text: result.message || '保存失败' });
      }
    } catch (error) {
      console.error('保存失败:', error);
      setMessage({ type: 'error', text: error.message || '保存失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCopyright = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.post('/admin/announcement', {
        type: 'copyright',
        content: copyrightContent,
      });

      if (result.success) {
        setMessage({ type: 'success', text: '版权信息保存成功' });
      } else {
        setMessage({ type: 'error', text: result.message || '保存失败' });
      }
    } catch (error) {
      console.error('保存失败:', error);
      setMessage({ type: 'error', text: error.message || '保存失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgreement = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const result = await api.post('/admin/announcement', {
        type: 'agreement',
        content: agreementContent,
      });

      if (result.success) {
        setMessage({ type: 'success', text: '用户协议保存成功' });
      } else {
        setMessage({ type: 'error', text: result.message || '保存失败' });
      }
    } catch (error) {
      console.error('保存失败:', error);
      setMessage({ type: 'error', text: error.message || '保存失败' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          📢 公示信息管理
        </Typography>

        {message.text && (
          <Alert
            severity={message.type}
            sx={{ mb: 3 }}
            onClose={() => setMessage({ type: '', text: '' })}
          >
            {message.text}
          </Alert>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(e, v) => setTab(v)}>
            <Tab label="关于我们" />
            <Tab label="版权信息" />
            <Tab label="用户协议" />
          </Tabs>

          <TabPanel value={tab} index={0}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  关于我们内容
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  此处编辑的内容将在前端"关于我们"页面展示，支持Markdown格式
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={aboutContent}
                  onChange={(e) => setAboutContent(e.target.value)}
                  placeholder="请输入关于我们的内容..."
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAbout}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : '保存'}
                </Button>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tab} index={1}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  版权信息
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  此处编辑的内容将显示在所有用户界面底部
                </Typography>
                <TextField
                  fullWidth
                  value={copyrightContent}
                  onChange={(e) => setCopyrightContent(e.target.value)}
                  placeholder="例如：2025©狐三岁"
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveCopyright}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : '保存'}
                </Button>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tab} index={2}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  用户协议内容
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  此处编辑的内容将在用户登录时展示，用户需同意协议后才能登录。支持Markdown格式
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={15}
                  value={agreementContent}
                  onChange={(e) => setAgreementContent(e.target.value)}
                  placeholder="请输入用户协议内容..."
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSaveAgreement}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={20} /> : '保存'}
                </Button>
              </CardContent>
            </Card>
          </TabPanel>
        </Paper>
      </Box>
    </AdminLayout>
  );
}

