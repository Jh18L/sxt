import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SchoolIcon from '@mui/icons-material/School';
import ClassIcon from '@mui/icons-material/Class';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../utils/api';
import { validateSchoolName, validateName, validateIdCard } from '../../utils/validation';

export default function BindPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 步骤1: 搜索学校
  const [schoolName, setSchoolName] = useState('');
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schoolError, setSchoolError] = useState('');
  
  // 步骤2: 选择班级
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  
  // 步骤3: 绑定信息
  const [studentName, setStudentName] = useState('');
  const [studentIdCard, setStudentIdCard] = useState('');
  const [nameError, setNameError] = useState('');
  const [idCardError, setIdCardError] = useState('');
  
  const navigate = useNavigate();

  const handleSchoolNameChange = (value) => {
    setSchoolName(value);
    const validation = validateSchoolName(value);
    setSchoolError(validation.valid ? '' : validation.message);
  };

  const handleNameChange = (value) => {
    setStudentName(value);
    const validation = validateName(value);
    setNameError(validation.valid ? '' : validation.message);
  };

  const handleIdCardChange = (value) => {
    setStudentIdCard(value);
    const validation = validateIdCard(value);
    setIdCardError(validation.valid ? '' : validation.message);
  };

  const handleSearchSchools = async () => {
    const validation = validateSchoolName(schoolName);
    if (!validation.valid) {
      setSchoolError(validation.message);
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/user/schools/search', {
        params: { schoolName }
      });
      if (result.success) {
        setSchools(result.data || []);
        if (result.data.length === 0) {
          setError('😔 未找到匹配的学校，请检查学校名称');
        }
      }
    } catch (err) {
      setError(err.message || '搜索学校失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSchool = async (schoolId) => {
    setSelectedSchool(schoolId);
    setLoading(true);
    setError('');
    try {
      const result = await api.get('/user/classes/search', {
        params: { schoolId }
      });
      if (result.success) {
        const classList = [];
        result.data?.forEach((grade) => {
          grade.simpleClassList?.forEach((cls) => {
            classList.push({
              ...cls,
              gradeName: grade.gradeLevelName
            });
          });
        });
        setClasses(classList);
        setActiveStep(1);
      }
    } catch (err) {
      setError(err.message || '获取班级列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBind = async () => {
    const nameValidation = validateName(studentName);
    const idCardValidation = validateIdCard(studentIdCard);
    
    if (!nameValidation.valid) {
      setNameError(nameValidation.message);
      return;
    }
    if (!idCardValidation.valid) {
      setIdCardError(idCardValidation.message);
      return;
    }
    if (!selectedClass) {
      setError('请选择班级');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      const result = await api.post('/user/bind', {
        studentName,
        studentIdCard,
        classId: selectedClass
      });
      if (result.success && result.data?.studentId) {
        navigate('/welcome');
      } else {
        setError(result.data?.msg || result.message || '绑定失败');
      }
    } catch (err) {
      setError(err.message || '绑定失败');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { label: '搜索学校', icon: '🏫' },
    { label: '选择班级', icon: '📚' },
    { label: '填写信息', icon: '✏️' },
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #757575 100%)',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 3, sm: 4 },
        px: { xs: 2, sm: 0 },
        display: 'flex',
        flexDirection: 'column',
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
          opacity: 0.1,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="md" sx={{ flex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 1,
                color: 'white',
              }}
            >
              🎓 学生账号绑定
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              请完成以下步骤来绑定您的学生账号
            </Typography>
          </Box>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
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
              <Stepper 
                activeStep={activeStep}
                orientation={{ xs: 'vertical', sm: 'horizontal' }}
                sx={{ 
                  mb: 4,
                  '& .MuiStepLabel-label': {
                    fontSize: { xs: '0.875rem', sm: '0.95rem' },
                    fontWeight: 500,
                  },
                }}
              >
                {steps.map((step, index) => (
                  <Step key={step.label}>
                    <StepLabel>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{step.icon}</span>
                        <span>{step.label}</span>
                      </Box>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert 
                      severity="error" 
                      sx={{ mb: 3, borderRadius: 2 }}
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {activeStep === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                        <TextField
                          fullWidth
                          label="学校名称"
                          value={schoolName}
                          onChange={(e) => handleSchoolNameChange(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSearchSchools()}
                          error={!!schoolError}
                          helperText={schoolError}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                🏫
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
                            variant="contained"
                            onClick={handleSearchSchools}
                            disabled={loading || !!schoolError}
                            fullWidth
                            sx={{ 
                              height: '56px',
                            }}
                            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                          >
                            {loading ? '搜索中' : '🔍 搜索学校'}
                          </Button>
                        </motion.div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          style={{ display: { xs: 'none', sm: 'block' } }}
                        >
                          <Button
                            variant="contained"
                            onClick={handleSearchSchools}
                            disabled={loading || !!schoolError}
                            sx={{ 
                              minWidth: { xs: '100%', sm: 120 },
                              height: '56px',
                            }}
                            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                          >
                            {loading ? '搜索中' : '🔍 搜索'}
                          </Button>
                        </motion.div>
                      </Box>
                      
                      {schools.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                        >
                          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                            ✨ 请选择您的学校：
                          </Typography>
                          <Grid container spacing={2}>
                            {schools.map((school, index) => (
                              <Grid item xs={12} sm={6} key={school.schoolId}>
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Card
                                    sx={{
                                      cursor: 'pointer',
                                      borderRadius: 3,
                      background: 'rgba(117, 117, 117, 0.05)',
                      border: '2px solid transparent',
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        bgcolor: 'rgba(117, 117, 117, 0.1)',
                        borderColor: 'primary.main',
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                      }
                                    }}
                                    onClick={() => handleSelectSchool(school.schoolId)}
                                  >
                                    <CardContent>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <SchoolIcon color="primary" />
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                          {school.schoolName}
                                        </Typography>
                                      </Box>
                                      <Typography variant="body2" color="text.secondary">
                                        📍 {school.schoolAddress}
                                      </Typography>
                                      {school.regionName && (
                                        <Chip 
                                          label={school.regionName} 
                                          size="small" 
                                          sx={{ mt: 1 }}
                                          color="primary"
                                          variant="outlined"
                                        />
                                      )}
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              </Grid>
                            ))}
                          </Grid>
                        </motion.div>
                      )}
                    </Box>
                  </motion.div>
                )}

                {activeStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>📚 选择班级</InputLabel>
                      <Select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        label="📚 选择班级"
                        sx={{
                          borderRadius: 2,
                        }}
                      >
                        {classes.map((cls) => (
                          <MenuItem key={cls.classId} value={cls.classId}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ClassIcon fontSize="small" />
                              <span>{cls.gradeName} - {cls.className}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                      <Button 
                        onClick={() => setActiveStep(0)}
                        variant="outlined"
                        fullWidth={isMobile}
                      >
                        返回
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ width: isMobile ? '100%' : 'auto' }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => setActiveStep(2)}
                          disabled={!selectedClass}
                          endIcon={<ArrowForwardIcon />}
                          fullWidth={isMobile}
                          sx={{ minWidth: { xs: '100%', sm: 120 } }}
                        >
                          下一步
                        </Button>
                      </motion.div>
                    </Box>
                  </motion.div>
                )}

                {activeStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                      ✏️ 请填写您的个人信息
                    </Typography>
                    <TextField
                      fullWidth
                      label="学生姓名"
                      value={studentName}
                      onChange={(e) => handleNameChange(e.target.value)}
                      margin="normal"
                      required
                      error={!!nameError}
                      helperText={nameError}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            👤
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      fullWidth
                      label="身份证号"
                      value={studentIdCard}
                      onChange={(e) => handleIdCardChange(e.target.value)}
                      margin="normal"
                      required
                      error={!!idCardError}
                      helperText={idCardError}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            🆔
                          </InputAdornment>
                        ),
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 4, flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
                      <Button 
                        onClick={() => setActiveStep(1)}
                        variant="outlined"
                        fullWidth={isMobile}
                      >
                        返回
                      </Button>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{ flex: 1, width: isMobile ? '100%' : 'auto' }}
                      >
                        <Button
                          variant="contained"
                          onClick={handleBind}
                          disabled={loading || !studentName || !studentIdCard || !!nameError || !!idCardError}
                          fullWidth
                          size="large"
                          endIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
                          sx={{
                            py: 1.5,
                            background: 'linear-gradient(135deg, #757575 0%, #616161 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #6e6e6e 0%, #424242 100%)',
                            },
                          }}
                        >
                          {loading ? '绑定中...' : '✅ 完成绑定'}
                        </Button>
                      </motion.div>
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
      <Footer />
    </Box>
  );
}
