import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Fade,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Snackbar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../../contexts/AuthContext';
import { validateAccount, validatePassword, validatePhone, validateAuthCode } from '../../utils/validation';
import Footer from '../../components/Footer';
import ReactMarkdown from 'react-markdown';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ paddingTop: '24px' }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

export default function LoginPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [agreementContent, setAgreementContent] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [hasReadAgreement, setHasReadAgreement] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // 密码登录
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // 验证码登录
  const [phoneNumber, setPhoneNumber] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [phoneError, setPhoneError] = useState('');
  const [codeError, setCodeError] = useState('');
  
  const { user, login, loginWithAuthCode, sendAuthCode, validateAuthCode: validateCode } = useAuth();
  const navigate = useNavigate();

  // 如果已经登录，重定向到欢迎页
  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (user || token) {
      navigate('/welcome', { replace: true });
    }
  }, [user, navigate]);

  // 获取用户协议内容
  React.useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const result = await api.get('/user/announcement', { params: { type: 'agreement' } });
        if (result.success && result.data?.content) {
          setAgreementContent(result.data.content);
        }
      } catch (error) {
        console.error('获取用户协议失败:', error);
      }
    };
    fetchAgreement();
  }, []);

  const handleAccountChange = (value) => {
    setAccount(value);
    const validation = validateAccount(value);
    setAccountError(validation.valid ? '' : validation.message);
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordError(validation.valid ? '' : validation.message);
  };

  const handlePhoneChange = (value) => {
    setPhoneNumber(value);
    const validation = validatePhone(value);
    setPhoneError(validation.valid ? '' : validation.message);
  };

  const handleCodeChange = (value) => {
    setAuthCode(value);
    const validation = validateAuthCode(value);
    setCodeError(validation.valid ? '' : validation.message);
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    // 检查是否已同意协议
    if (!agreed) {
      setAgreementDialogOpen(true);
      return;
    }
    
    const accountValidation = validateAccount(account);
    const passwordValidation = validatePassword(password);
    
    if (!accountValidation.valid) {
      setAccountError(accountValidation.message);
      return;
    }
    if (!passwordValidation.valid) {
      setPasswordError(passwordValidation.message);
      return;
    }

    setLoading(true);

    try {
      const result = await login({ account, password });
      
      if (result.success) {
        setTimeout(() => {
          navigate('/welcome', { replace: true });
        }, 100);
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError('');
    const validation = validatePhone(phoneNumber);
    if (!validation.valid) {
      setPhoneError(validation.message);
      return;
    }

    try {
      const result = await sendAuthCode(phoneNumber);
      if (result.success) {
        setCodeSent(true);
        setCountdown(60);
        setSnackbarMessage('验证码发送成功！请查收短信');
        setSnackbarOpen(true);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || '发送验证码失败');
      }
    } catch (err) {
      setError(err.message || '发送验证码失败');
    }
  };

  const handleAuthCodeLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 检查是否已同意协议
    if (!agreed) {
      setAgreementDialogOpen(true);
      return;
    }

    const phoneValidation = validatePhone(phoneNumber);
    const codeValidation = validateAuthCode(authCode);
    
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.message);
      return;
    }
    if (!codeValidation.valid) {
      setCodeError(codeValidation.message);
      return;
    }

    setLoading(true);

    try {
      const validateResult = await validateCode(phoneNumber, authCode);
      if (!validateResult.success) {
        setError(validateResult.message || '验证码错误');
        setLoading(false);
        return;
      }

      const result = await loginWithAuthCode(phoneNumber, authCode);
      
      if (result.success) {
        if (result.needBind) {
          localStorage.setItem('tempToken', result.data.token);
          navigate('/bind');
        } else {
          setTimeout(() => {
            navigate('/welcome', { replace: true });
          }, 100);
        }
      } else {
        setError(result.message || '登录失败');
      }
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        py: { xs: 4, sm: 0 },
        px: { xs: 2, sm: 0 },
      }}
    >
      {/* 背景装饰 */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(117, 117, 117, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(117, 117, 117, 0.08) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 700,
                      mb: 1,
                      color: '#1976d2',
                    }}
                  >
                    你好呀🥳
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#1976d2' }}>
                    欢迎回来！请登录您的生学堂账号
                  </Typography>
                </Box>
              </motion.div>

              <Tabs 
                value={tab} 
                onChange={(e, v) => {
                  setTab(v);
                  setError('');
                  setAccountError('');
                  setPasswordError('');
                  setPhoneError('');
                  setCodeError('');
                }}
                centered
                variant="fullWidth"
                sx={{
                  mb: 3,
                  '& .MuiTab-root': {
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    fontWeight: 500,
                    textTransform: 'none',
                    minHeight: { xs: 48, sm: 72 },
                  },
                }}
              >
                <Tab label="🔐 密码登录" />
                <Tab label="📱 验证码登录" />
              </Tabs>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 3,
                        borderRadius: 2,
                      }}
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <TabPanel value={tab} index={0}>
                <Box component="form" onSubmit={handlePasswordLogin}>
                  <TextField
                    fullWidth
                    label="账号"
                    value={account}
                    onChange={(e) => handleAccountChange(e.target.value)}
                    margin="normal"
                    required
                    autoFocus
                    error={!!accountError}
                    helperText={accountError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          👤
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    label="密码"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    margin="normal"
                    required
                    error={!!passwordError}
                    helperText={passwordError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          🔒
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ mt: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreed}
                          onChange={(e) => {
                            setAgreed(e.target.checked);
                            if (!e.target.checked) {
                              setHasReadAgreement(false);
                            }
                          }}
                          onClick={(e) => {
                            if (!hasReadAgreement) {
                              e.preventDefault();
                              setAgreementDialogOpen(true);
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          我已阅读并同意
                          <Button
                            variant="text"
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              setAgreementDialogOpen(true);
                            }}
                            sx={{ p: 0, minWidth: 'auto', textTransform: 'none', textDecoration: 'underline' }}
                          >
                            用户协议
                          </Button>
                        </Typography>
                      }
                    />
                  </Box>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{ 
                        mt: 2, 
                        mb: 2,
                        py: { xs: 1.25, sm: 1.5 },
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6e6e6e 0%, #424242 100%)',
                        },
                      }}
                      disabled={loading || !agreed}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        '🚀 立即登录'
                      )}
                    </Button>
                  </motion.div>
                </Box>
              </TabPanel>

              <TabPanel value={tab} index={1}>
                <Box component="form" onSubmit={handleAuthCodeLogin}>
                  <TextField
                    fullWidth
                    label="手机号"
                    value={phoneNumber}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    margin="normal"
                    required
                    autoFocus
                    error={!!phoneError}
                    helperText={phoneError}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          📱
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, mb: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                    <TextField
                      fullWidth
                      label="验证码"
                      value={authCode}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      required
                      error={!!codeError}
                      helperText={codeError}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            🔑
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        flex: 1,
                      }}
                    />
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ width: '100%', display: { xs: 'block', sm: 'none' } }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleSendCode}
                        disabled={codeSent && countdown > 0 || !!phoneError}
                        fullWidth
                        sx={{ 
                          height: '56px',
                          borderColor: 'primary.main',
                          display: { xs: 'block', sm: 'none' },
                          '&:hover': {
                            borderColor: 'primary.dark',
                          },
                        }}
                      >
                        {countdown > 0 ? `⏱️ ${countdown}s` : '📤 发送验证码'}
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ display: { xs: 'none', sm: 'block' } }}
                    >
                      <Button
                        variant="outlined"
                        onClick={handleSendCode}
                        disabled={codeSent && countdown > 0 || !!phoneError}
                        sx={{ 
                          minWidth: { xs: '100%', sm: 120 },
                          height: '56px',
                          borderColor: 'primary.main',
                          display: { xs: 'none', sm: 'block' },
                          '&:hover': {
                            borderColor: 'primary.dark',
                          },
                        }}
                      >
                        {countdown > 0 ? `⏱️ ${countdown}s` : '📤 发送'}
                      </Button>
                    </motion.div>
                  </Box>
                  <Box sx={{ mt: 3 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreed}
                          onChange={(e) => {
                            setAgreed(e.target.checked);
                            if (!e.target.checked) {
                              setHasReadAgreement(false);
                            }
                          }}
                          onClick={(e) => {
                            if (!hasReadAgreement) {
                              e.preventDefault();
                              setAgreementDialogOpen(true);
                            }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2">
                          我已阅读并同意
                          <Button
                            variant="text"
                            size="small"
                            onClick={(e) => {
                              e.preventDefault();
                              setAgreementDialogOpen(true);
                            }}
                            sx={{ p: 0, minWidth: 'auto', textTransform: 'none', textDecoration: 'underline' }}
                          >
                            用户协议
                          </Button>
                        </Typography>
                      }
                    />
                  </Box>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      sx={{ 
                        mt: 2, 
                        mb: 2,
                        py: { xs: 1.25, sm: 1.5 },
                        fontSize: { xs: '1rem', sm: '1.1rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #6e6e6e 0%, #424242 100%)',
                        },
                      }}
                      disabled={loading || !codeSent || !agreed}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        '🚀 立即登录'
                      )}
                    </Button>
                  </motion.div>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }} />
      <Footer />

      {/* 用户协议弹窗 */}
      <Dialog
        open={agreementDialogOpen}
        onClose={() => setAgreementDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            maxHeight: { xs: '100vh', sm: '80vh' },
            m: { xs: 0, sm: 2 },
            borderRadius: { xs: 0, sm: 2 },
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            📋 用户协议
          </Typography>
        </DialogTitle>
        <DialogContent dividers
          sx={{
            p: { xs: 2, sm: 3 },
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              bgcolor: 'background.default',
              borderRadius: 1,
              maxHeight: { xs: 'calc(100vh - 200px)', sm: '50vh' },
              overflow: 'auto',
              '& p': { 
                mb: 2,
                fontSize: { xs: '0.875rem', sm: '1rem' },
                lineHeight: { xs: 1.6, sm: 1.75 },
              },
              '& h1, & h2, & h3': { 
                mt: 2, 
                mb: 1,
                fontSize: { xs: '1.25rem', sm: '1.5rem' },
              },
              '& ul, & ol': { pl: { xs: 2, sm: 3 }, mb: 2 },
            }}
          >
            {agreementContent ? (
              <ReactMarkdown>{agreementContent}</ReactMarkdown>
            ) : (
              <Typography variant="body2" color="text.secondary">
                暂无协议内容
              </Typography>
            )}
          </Paper>
          <Box sx={{ mt: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) {
                      setHasReadAgreement(true);
                    }
                  }}
                />
              }
              label="我已阅读并同意用户协议"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAgreementDialogOpen(false)}>
            取消
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (agreed) {
                setAgreementDialogOpen(false);
              } else {
                setError('请先同意用户协议');
              }
            }}
            disabled={!agreed}
          >
            确认并继续
          </Button>
        </DialogActions>
      </Dialog>

      {/* 验证码发送成功提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          '&.MuiSnackbar-root': {
            top: { xs: '16px', sm: '24px' },
          },
        }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
