import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Paper,
  CircularProgress,
} from '@mui/material';
import { motion } from 'framer-motion';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import StorageIcon from '@mui/icons-material/Storage';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function AdminSettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [exportMessage, setExportMessage] = useState({ type: '', text: '' });
  const [importMessage, setImportMessage] = useState({ type: '', text: '' });
  const [importFile, setImportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dbConnectionString, setDbConnectionString] = useState('');
  const [dbTestResult, setDbTestResult] = useState({ type: '', text: '', loading: false });

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: '请填写所有字段' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: '两次输入的密码不一致' });
      return;
    }

    setLoading(true);
    try {
      const result = await api.post('/admin/change-password', {
        oldPassword,
        newPassword
      });
      if (result.success) {
        setPasswordMessage({ type: 'success', text: result.message || '密码修改成功' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage({ type: 'error', text: result.message || '密码修改失败' });
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || '密码修改失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    setLoading(true);
    try {
      const result = await api.get('/admin/export-data');
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setExportMessage({ type: 'success', text: '数据导出成功' });
      } else {
        setExportMessage({ type: 'error', text: result.message || '数据导出失败' });
      }
    } catch (error) {
      setExportMessage({ type: 'error', text: error.message || '数据导出失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportMessage({ type: '', text: '' });
    }
  };

  const handleImportData = async () => {
    if (!importFile) {
      setImportMessage({ type: 'error', text: '请选择要导入的文件' });
      return;
    }

    setLoading(true);
    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);
      
      if (!data.users || !data.examReports) {
        setImportMessage({ type: 'error', text: '文件格式不正确，缺少必要数据' });
        return;
      }

      const result = await api.post('/admin/import-data', data);
      if (result.success) {
        setImportMessage({ type: 'success', text: result.message || '数据导入成功' });
        setImportFile(null);
        // 重置文件输入
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } else {
        setImportMessage({ type: 'error', text: result.message || '数据导入失败' });
      }
    } catch (error) {
      setImportMessage({ type: 'error', text: error.message || '数据导入失败，请检查文件格式' });
    } finally {
      setLoading(false);
    }
  };

  // 获取当前数据库连接配置
  const fetchDbConfig = async () => {
    try {
      const result = await api.get('/admin/db-config');
      if (result.success && result.data) {
        setDbConnectionString(result.data.connectionString || '');
      }
    } catch (error) {
      console.error('获取数据库配置失败:', error);
    }
  };

  // 测试数据库连接
  const handleTestDbConnection = async () => {
    if (!dbConnectionString) {
      setDbTestResult({ type: 'error', text: '请输入数据库连接字符串', loading: false });
      return;
    }

    setDbTestResult({ type: '', text: '', loading: true });
    try {
      const result = await api.post('/admin/db-test', {
        connectionString: dbConnectionString
      });
      if (result.success) {
        setDbTestResult({ type: 'success', text: result.message || '数据库连接成功', loading: false });
      } else {
        setDbTestResult({ type: 'error', text: result.message || '数据库连接失败', loading: false });
      }
    } catch (error) {
      setDbTestResult({ 
        type: 'error', 
        text: error.message || error.response?.data?.message || '数据库连接测试失败', 
        loading: false 
      });
    }
  };

  // 保存数据库配置
  const handleSaveDbConfig = async () => {
    if (!dbConnectionString) {
      setDbTestResult({ type: 'error', text: '请输入数据库连接字符串', loading: false });
      return;
    }

    setLoading(true);
    try {
      const result = await api.post('/admin/db-config', {
        connectionString: dbConnectionString
      });
      if (result.success) {
        setDbTestResult({ type: 'success', text: result.message || '数据库配置保存成功', loading: false });
      } else {
        setDbTestResult({ type: 'error', text: result.message || '数据库配置保存失败', loading: false });
      }
    } catch (error) {
      setDbTestResult({ 
        type: 'error', 
        text: error.message || error.response?.data?.message || '数据库配置保存失败', 
        loading: false 
      });
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时获取数据库配置
  useEffect(() => {
    fetchDbConfig();
  }, []);

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          管理员管理
        </Typography>

        {/* 修改密码 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <LockIcon sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6">修改密码</Typography>
            </Box>
            
            {passwordMessage.text && (
              <Alert severity={passwordMessage.type} sx={{ mb: 2 }}>
                {passwordMessage.text}
              </Alert>
            )}

            <Box sx={{ maxWidth: 500 }}>
              <TextField
                fullWidth
                label="原密码"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="新密码"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="确认新密码"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                margin="normal"
                required
              />
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                修改密码
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 4 }} />

        {/* 数据导出 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <DownloadIcon sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6">数据导出</Typography>
            </Box>
            
            {exportMessage.text && (
              <Alert severity={exportMessage.type} sx={{ mb: 2 }}>
                {exportMessage.text}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              导出所有用户数据和考试报告数据为JSON格式备份文件
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExportData}
              disabled={loading}
            >
              一键导出备份数据
            </Button>
          </CardContent>
        </Card>

        <Divider sx={{ my: 4 }} />

        {/* 数据库连接配置 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <StorageIcon sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6">数据库连接配置</Typography>
            </Box>
            
            {dbTestResult.text && (
              <Alert 
                severity={dbTestResult.type} 
                sx={{ mb: 2 }}
                icon={dbTestResult.type === 'success' ? <CheckCircleIcon /> : <ErrorIcon />}
                onClose={() => setDbTestResult({ type: '', text: '', loading: false })}
              >
                {dbTestResult.text}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              配置MongoDB数据库连接字符串。格式：mongodb://用户名:密码@主机:端口/?directConnection=true
            </Typography>
            
            <TextField
              fullWidth
              label="MongoDB连接字符串"
              value={dbConnectionString}
              onChange={(e) => setDbConnectionString(e.target.value)}
              placeholder="mongodb://root:password@host:port/?directConnection=true"
              multiline
              rows={2}
              sx={{ mb: 2 }}
              helperText="修改后需要重新启动服务器才能生效"
            />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={handleTestDbConnection}
                disabled={dbTestResult.loading || loading || !dbConnectionString}
                startIcon={dbTestResult.loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
              >
                {dbTestResult.loading ? '测试中...' : '测试连接'}
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveDbConfig}
                disabled={loading || !dbConnectionString}
              >
                保存配置
              </Button>
            </Box>
          </CardContent>
        </Card>

        <Divider sx={{ my: 4 }} />

        {/* 数据导入 */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <UploadIcon sx={{ mr: 1, fontSize: 28, color: 'primary.main' }} />
              <Typography variant="h6">数据导入</Typography>
            </Box>
            
            {importMessage.text && (
              <Alert severity={importMessage.type} sx={{ mb: 2 }}>
                {importMessage.text}
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              从备份文件导入数据，将覆盖现有数据（相同账号/考试ID的数据会更新）
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
              >
                选择备份文件
                <input
                  type="file"
                  accept=".json"
                  hidden
                  onChange={handleImportFileChange}
                />
              </Button>
              {importFile && (
                <Typography variant="body2" color="text.secondary">
                  已选择: {importFile.name}
                </Typography>
              )}
            </Box>
            
            <Button
              variant="contained"
              onClick={handleImportData}
              disabled={loading || !importFile}
              sx={{ mt: 2 }}
            >
              一键导入备份数据
            </Button>
          </CardContent>
        </Card>
      </Box>
    </AdminLayout>
  );
}

