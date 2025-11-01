import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../utils/api';
import Footer from '../../components/Footer';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ScoreAnalysisPage() {
  const { examId, examCourseId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [abilityData, setAbilityData] = useState([]);
  const [pointData, setPointData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [displayOptions, setDisplayOptions] = useState({
    showClassRatio: true,
    showSchoolRatio: true,
    showCountyRatio: true,
    showCityRatio: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取科目名称
        const scoreResult = await api.get(`/exam/score/${examId}`);
        if (scoreResult.success && scoreResult.data) {
          const scores = Array.isArray(scoreResult.data) ? scoreResult.data : [];
          const course = scores.find(s => s.examCourseId === examCourseId);
          if (course) {
            setCourseName(course.courseName || '');
          }
        }

        // 同时获取能力分析和知识点分析
        const [abilityResult, pointResult] = await Promise.all([
          api.get(`/analysis/ability/${examCourseId}`),
          api.get(`/analysis/point/${examCourseId}`)
        ]);

        if (abilityResult.success && abilityResult.data) {
          setAbilityData(Array.isArray(abilityResult.data) ? abilityResult.data : []);
        }

        if (pointResult.success && pointResult.data) {
          setPointData(Array.isArray(pointResult.data) ? pointResult.data : []);
        }
      } catch (error) {
        console.error('获取分析数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId, examCourseId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ flex: 1 }}>
        <Box sx={{ py: 4 }}>
        <Button
          onClick={() => navigate(`/exam/${examId}`)}
          variant="outlined"
          sx={{ mb: 3 }}
        >
          返回成绩详情
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                成绩分析
              </Typography>
              {courseName && (
                <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
                  科目：{courseName}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* 显示选项复选框 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <FormGroup>
                <Typography variant="subtitle2" gutterBottom>
                  显示选项：
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showClassRatio}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showClassRatio: e.target.checked })}
                      />
                    }
                    label="班级得分率"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showSchoolRatio}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showSchoolRatio: e.target.checked })}
                      />
                    }
                    label="学校得分率"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showCountyRatio}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showCountyRatio: e.target.checked })}
                      />
                    }
                    label="区县得分率"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showCityRatio}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showCityRatio: e.target.checked })}
                      />
                    }
                    label="全市得分率"
                  />
                </Box>
              </FormGroup>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                <Tab label="能力分析" />
                <Tab label="知识点分析" />
              </Tabs>

              {/* 能力分析表格 */}
              <TabPanel value={tab} index={0}>
                <TableContainer 
                  component={Paper}
                  sx={{ 
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                      },
                    },
                  }}
                >
                  <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 120 }}>能力</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>得分</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>满分</TableCell>
                        <TableCell align="right" sx={{ minWidth: 90 }}>得分率</TableCell>
                        <TableCell align="right" sx={{ minWidth: 90 }}>班级平均</TableCell>
                        {displayOptions.showClassRatio && <TableCell align="right" sx={{ minWidth: 110 }}>班级得分率</TableCell>}
                        {displayOptions.showSchoolRatio && <TableCell align="right" sx={{ minWidth: 110 }}>学校得分率</TableCell>}
                        {displayOptions.showCountyRatio && <TableCell align="right" sx={{ minWidth: 110 }}>区县得分率</TableCell>}
                        {displayOptions.showCityRatio && <TableCell align="right" sx={{ minWidth: 110 }}>全市得分率</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {abilityData.map((item) => (
                        <TableRow key={item.abilityId}>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.abilityName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.score}</TableCell>
                          <TableCell align="right">{item.totalScore}</TableCell>
                          <TableCell align="right">
                            {((item.ratio || 0) * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell align="right">{item.classAverage?.toFixed(2) || '-'}</TableCell>
                          {displayOptions.showClassRatio && (
                            <TableCell align="right">
                              {item.classRatio ? `${((item.classRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                          {displayOptions.showSchoolRatio && (
                            <TableCell align="right">
                              {item.schoolRatio ? `${((item.schoolRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                          {displayOptions.showCountyRatio && (
                            <TableCell align="right">
                              {item.countyRatio ? `${((item.countyRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                          {displayOptions.showCityRatio && (
                            <TableCell align="right">
                              {item.cityRatio ? `${((item.cityRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              {/* 知识点分析表格 */}
              <TabPanel value={tab} index={1}>
                <TableContainer 
                  component={Paper}
                  sx={{ 
                    overflowX: 'auto',
                    '&::-webkit-scrollbar': {
                      height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                      },
                    },
                  }}
                >
                  <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 150 }}>知识点</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>得分</TableCell>
                        <TableCell align="right" sx={{ minWidth: 80 }}>满分</TableCell>
                        <TableCell align="right" sx={{ minWidth: 90 }}>得分率</TableCell>
                        <TableCell align="right" sx={{ minWidth: 90 }}>班级平均</TableCell>
                        {displayOptions.showClassRatio && <TableCell align="right" sx={{ minWidth: 110 }}>班级得分率</TableCell>}
                        {displayOptions.showSchoolRatio && <TableCell align="right" sx={{ minWidth: 110 }}>学校得分率</TableCell>}
                        {displayOptions.showCountyRatio && <TableCell align="right" sx={{ minWidth: 110 }}>区县得分率</TableCell>}
                        {displayOptions.showCityRatio && <TableCell align="right" sx={{ minWidth: 110 }}>全市得分率</TableCell>}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pointData.map((item) => (
                        <TableRow key={item.pointId}>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                              {item.pointName}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{item.score}</TableCell>
                          <TableCell align="right">{item.totalScore}</TableCell>
                          <TableCell align="right">
                            {((item.ratio || 0) * 100).toFixed(2)}%
                          </TableCell>
                          <TableCell align="right">{item.classAverage?.toFixed(2) || '-'}</TableCell>
                          {displayOptions.showClassRatio && (
                            <TableCell align="right">
                              {item.classRatio ? `${((item.classRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                          {displayOptions.showSchoolRatio && (
                            <TableCell align="right">
                              {item.schoolRatio ? `${((item.schoolRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                          {displayOptions.showCountyRatio && (
                            <TableCell align="right">
                              {item.countyRatio ? `${((item.countyRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                          {displayOptions.showCityRatio && (
                            <TableCell align="right">
                              {item.cityRatio ? `${((item.cityRatio || 0) * 100).toFixed(2)}%` : '-'}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>
            </CardContent>
          </Card>
        </motion.div>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
