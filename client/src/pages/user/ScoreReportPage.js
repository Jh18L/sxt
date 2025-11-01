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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Footer from '../../components/Footer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ScoreReportPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  
  // 考试列表相关
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState([]);
  
  // 科目相关
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  
  // 折线图相关
  const [lineChartData, setLineChartData] = useState([]);
  const [lineChartOptions, setLineChartOptions] = useState({
    showCity: true,
    showCounty: true,
    showSchool: true,
    showClass: true,
  });
  
  // 雷达图相关
  const [radarExam, setRadarExam] = useState('');
  const [radarData, setRadarData] = useState([]);
  
  // 低分提醒相关
  const [lowScoreTypeTab, setLowScoreTypeTab] = useState(0); // 0: 知识点, 1: 能力
  const [lowScoreDisplayTab, setLowScoreDisplayTab] = useState(0); // 0: 词云, 1: 表格
  const [lowScorePoints, setLowScorePoints] = useState([]);
  const [lowScoreAbilities, setLowScoreAbilities] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]); // 选择的科目名称列表
  const [allAvailableCourses, setAllAvailableCourses] = useState([]); // 所有可选的科目

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedExams.length > 0 && selectedCourse) {
      fetchLineChartData();
    } else {
      setLineChartData([]);
    }
  }, [selectedExams.length, selectedExams.map(e => e.id).join(','), selectedCourse, lineChartOptions.showCity, lineChartOptions.showCounty, lineChartOptions.showSchool, lineChartOptions.showClass]);

  useEffect(() => {
    if (radarExam) {
      fetchRadarData();
    }
  }, [radarExam]);

  useEffect(() => {
    if (selectedExams.length > 0) {
      // 获取所有科目列表用于筛选
      const getAllCourses = async () => {
        const courseMap = new Map();
        for (const exam of selectedExams) {
          try {
            const result = await api.get(`/exam/score/${exam.id}`);
            if (result.success && result.data) {
              const scores = Array.isArray(result.data) ? result.data : [];
              scores.filter(s => s.courseType !== 2).forEach(s => {
                const key = s.courseName;
                if (!courseMap.has(key)) {
                  courseMap.set(key, { id: s.examCourseId, name: s.courseName });
                }
              });
            }
          } catch (e) {
            console.error('获取科目失败:', e);
          }
        }
        const coursesList = Array.from(courseMap.values());
        setAllAvailableCourses(coursesList);
        // 默认全选所有科目（使用科目名称）
        if (coursesList.length > 0) {
          setSelectedCourses(coursesList.map(c => c.name));
        }
      };
      getAllCourses();
      fetchLowScoreData();
    } else {
      setLowScorePoints([]);
      setLowScoreAbilities([]);
      setAllAvailableCourses([]);
    }
  }, [selectedExams.length, selectedExams.map(e => e.id).join(','), selectedCourses.length, selectedCourses.join(',')]);

  const fetchExams = async () => {
    try {
      const result = await api.get('/exam/list', {
        params: { page: 1, size: 50 }
      });
      if (result.success && result.data) {
        const examList = result.data.dataList || [];
        setExams(examList);
        
        // 获取第一个考试的科目列表
        if (examList.length > 0) {
          setRadarExam(examList[0].id);
          fetchCoursesForExam(examList[0].id);
        }
      }
    } catch (error) {
      console.error('获取考试列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoursesForExam = async (examId) => {
    try {
      const result = await api.get(`/exam/score/${examId}`);
      if (result.success && result.data) {
        const scores = Array.isArray(result.data) ? result.data : [];
        const courseList = scores.filter(s => s.courseType !== 2).map(s => ({
          id: s.examCourseId,
          name: s.courseName,
        }));
        setCourses(courseList);
        if (courseList.length > 0 && !selectedCourse) {
          setSelectedCourse(courseList[0].id);
        }
      }
    } catch (error) {
      console.error('获取科目列表失败:', error);
    }
  };

  const fetchLineChartData = async () => {
    if (!selectedExams.length || !selectedCourse) {
      setLineChartData([]);
      return;
    }
    
    try {
      const allData = [];
      
      // 先获取选中科目的名称，因为不同考试中同一科目的examCourseId可能不同
      const firstExamResult = await api.get(`/exam/score/${selectedExams[0].id}`);
      let targetCourseName = '';
      if (firstExamResult.success && firstExamResult.data) {
        const firstScores = Array.isArray(firstExamResult.data) ? firstExamResult.data : [];
        const firstCourse = firstScores.find(s => s.examCourseId === selectedCourse);
        if (firstCourse) {
          targetCourseName = firstCourse.courseName;
        }
      }
      
      if (!targetCourseName) {
        setLineChartData([]);
        return;
      }
      
      // 遍历所有选中的考试，查找同名科目
      for (const exam of selectedExams) {
        const result = await api.get(`/exam/score/${exam.id}`);
        if (result.success && result.data) {
          const scores = Array.isArray(result.data) ? result.data : [];
          // 通过科目名称匹配，因为不同考试的examCourseId可能不同
          const courseScore = scores.find(s => s.courseName === targetCourseName && s.courseType !== 2);
          
          if (courseScore) {
            // 格式化日期显示
            const dateStr = exam.startTime || '';
            allData.push({
              exam: exam.name,
              date: dateStr,
              dateLabel: dateStr.split(' ')[0] || dateStr, // 只显示日期部分
              city: courseScore.rank || 0,
              county: courseScore.countyRank || 0,
              school: courseScore.schoolRank || 0,
              class: courseScore.classRank || 0,
            });
          }
        }
      }
      
      // 按日期排序
      allData.sort((a, b) => new Date(a.date) - new Date(b.date));
      setLineChartData(allData);
    } catch (error) {
      console.error('获取折线图数据失败:', error);
      setLineChartData([]);
    }
  };

  const fetchRadarData = async () => {
    if (!radarExam) {
      setRadarData([]);
      return;
    }
    
    try {
      const result = await api.get(`/exam/score/${radarExam}`);
      if (result.success && result.data) {
        const scores = Array.isArray(result.data) ? result.data : [];
        // 排除总分，使用赋分成绩（如果有），计算得分率（得分/满分）
        // 从ratio字段可以反推总分：ratio = score / totalScore，所以 totalScore = score / ratio
        const subjectScores = scores.filter(s => s.courseType !== 2).map(s => {
          const score = s.needAssignScore && s.nceGainScore ? s.nceGainScore : s.gainScore;
          let totalScore = 100; // 默认100分
          
          // 根据科目名称判断常见满分（优先）
          const courseName = s.courseName || '';
          if (courseName.includes('语文') || courseName.includes('数学') || courseName.includes('英语')) {
            totalScore = 150; // 语文、数学、英语通常是150分
          } else {
            totalScore = 100; // 其他科目通常是100分
          }
          
          // 如果有ratio字段，可以通过 ratio = score / totalScore 验证
          // 如果反推的值与预期差距较大，使用反推值（但仅限于合理范围内）
          if (s.ratio && s.ratio > 0 && score > 0) {
            const calculatedTotal = score / s.ratio;
            // 如果反推值在预期值的±20%范围内，且大于0小于200，使用反推值
            if (calculatedTotal > 0 && calculatedTotal < 200 && 
                Math.abs(calculatedTotal - totalScore) / totalScore < 0.2) {
              totalScore = calculatedTotal;
            }
          }
          
          const ratio = totalScore > 0 ? (score / totalScore) * 100 : 0;
          return {
            subject: s.courseName,
            score: ratio, // 使用百分比
            rawScore: score,
            totalScore: Math.round(totalScore),
          };
        });
        setRadarData(subjectScores);
      }
    } catch (error) {
      console.error('获取雷达图数据失败:', error);
      setRadarData([]);
    }
  };

  const fetchLowScoreData = async () => {
    try {
      const allPoints = [];
      const allAbilities = [];
      
      for (const exam of selectedExams) {
        const scoreResult = await api.get(`/exam/score/${exam.id}`);
        if (scoreResult.success && scoreResult.data) {
          const scores = Array.isArray(scoreResult.data) ? scoreResult.data : [];
          const courses = scores.filter(s => s.courseType !== 2);
          
          for (const course of courses) {
            // 如果选择了科目筛选，只处理选中的科目（通过科目名称匹配）
            if (selectedCourses.length > 0 && !selectedCourses.includes(course.courseName)) {
              continue;
            }
            
            // 获取知识点分析
            try {
              const pointResult = await api.get(`/analysis/point/${course.examCourseId}`);
              if (pointResult.success && pointResult.data) {
                const lowPoints = (pointResult.data || []).filter(p => p.ratio < 0.6);
                allPoints.push(...lowPoints.map(p => ({
                  ...p,
                  exam: exam.name,
                  examId: exam.id,
                  course: course.courseName,
                  courseId: course.examCourseId,
                })));
              }
            } catch (e) {
              console.error('获取知识点失败:', e);
            }
            
            // 获取能力分析
            try {
              const abilityResult = await api.get(`/analysis/ability/${course.examCourseId}`);
              if (abilityResult.success && abilityResult.data) {
                const lowAbilities = (abilityResult.data || []).filter(a => a.ratio < 0.6);
                allAbilities.push(...lowAbilities.map(a => ({
                  ...a,
                  exam: exam.name,
                  examId: exam.id,
                  course: course.courseName,
                  courseId: course.examCourseId,
                })));
              }
            } catch (e) {
              console.error('获取能力分析失败:', e);
            }
          }
        }
      }
      
      setLowScorePoints(allPoints);
      setLowScoreAbilities(allAbilities);
    } catch (error) {
      console.error('获取低分数据失败:', error);
    }
  };

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
          onClick={() => navigate('/welcome')}
          variant="outlined"
          sx={{ mb: 3 }}
        >
          返回首页
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                成绩分析报告
              </Typography>
              <Typography variant="body2" color="text.secondary">
                综合分析您的考试成绩趋势和薄弱环节
              </Typography>
            </CardContent>
          </Card>

          <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="排名趋势" />
            <Tab label="科目雷达图" />
            <Tab label="薄弱环节" />
          </Tabs>

          {/* 第一部分：折线图 */}
          <TabPanel value={tab} index={0}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  排名趋势分析
                </Typography>
                
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>选择考试</InputLabel>
                    <Select
                      multiple
                      value={selectedExams.map(e => e.id)}
                      onChange={(e) => {
                        const examIds = e.target.value;
                        const selected = exams.filter(ex => examIds.includes(ex.id));
                        setSelectedExams(selected);
                        if (selected.length > 0) {
                          fetchCoursesForExam(selected[0].id);
                        } else {
                          setCourses([]);
                          setSelectedCourse('');
                        }
                      }}
                      renderValue={(selected) => `${selected.length}个考试`}
                    >
                      {exams.map((exam) => (
                        <MenuItem key={exam.id} value={exam.id}>
                          <Checkbox checked={selectedExams.some(e => e.id === exam.id)} />
                          {exam.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>选择科目</InputLabel>
                    <Select
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      {courses.map((course) => (
                        <MenuItem key={course.id} value={course.id}>
                          {course.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <FormGroup row sx={{ mb: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={lineChartOptions.showCity}
                        onChange={(e) => setLineChartOptions({ ...lineChartOptions, showCity: e.target.checked })}
                      />
                    }
                    label="市排名"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={lineChartOptions.showCounty}
                        onChange={(e) => setLineChartOptions({ ...lineChartOptions, showCounty: e.target.checked })}
                      />
                    }
                    label="区排名"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={lineChartOptions.showSchool}
                        onChange={(e) => setLineChartOptions({ ...lineChartOptions, showSchool: e.target.checked })}
                      />
                    }
                    label="校排名"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={lineChartOptions.showClass}
                        onChange={(e) => setLineChartOptions({ ...lineChartOptions, showClass: e.target.checked })}
                      />
                    }
                    label="班排名"
                  />
                </FormGroup>

                {lineChartData.length > 0 ? (
                  <Box sx={{ height: 400, mt: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="dateLabel" angle={-45} textAnchor="end" height={100} />
                        <YAxis reversed />
                        <Tooltip />
                        <Legend />
                        {lineChartOptions.showCity && <Line type="monotone" dataKey="city" stroke="#8884d8" name="市排名" />}
                        {lineChartOptions.showCounty && <Line type="monotone" dataKey="county" stroke="#82ca9d" name="区排名" />}
                        {lineChartOptions.showSchool && <Line type="monotone" dataKey="school" stroke="#ffc658" name="校排名" />}
                        {lineChartOptions.showClass && <Line type="monotone" dataKey="class" stroke="#ff7300" name="班排名" />}
                      </LineChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      请选择考试和科目以查看排名趋势
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* 第二部分：雷达图 */}
          <TabPanel value={tab} index={1}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  科目成绩雷达图
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>选择考试</InputLabel>
                    <Select
                      value={radarExam}
                      onChange={(e) => setRadarExam(e.target.value)}
                    >
                      {exams.map((exam) => (
                        <MenuItem key={exam.id} value={exam.id}>
                          <Box>
                            <Typography variant="body2">{exam.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              考试时间: {exam.startTime || '-'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {radarData.length > 0 ? (
                  <Box sx={{ height: 400, mt: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis domain={[0, 100]} />
                        <Radar
                          name="得分率(%)"
                          dataKey="score"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Tooltip 
                          formatter={(value, name) => {
                            const item = radarData.find(d => d.score === value);
                            return [`${value.toFixed(1)}% (${item?.rawScore || 0}/${item?.totalScore || 0})`, name];
                          }}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      暂无数据
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </TabPanel>

          {/* 第三部分：低分提醒 */}
          <TabPanel value={tab} index={2}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  薄弱环节分析（得分率低于60%）
                </Typography>
                
                <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>选择考试范围</InputLabel>
                    <Select
                      multiple
                      value={selectedExams.map(e => e.id)}
                      onChange={(e) => {
                        const examIds = e.target.value;
                        const selected = exams.filter(ex => examIds.includes(ex.id));
                        setSelectedExams(selected);
                      }}
                      renderValue={(selected) => `${selected.length}个考试`}
                    >
                      {exams.map((exam) => (
                        <MenuItem key={exam.id} value={exam.id}>
                          <Checkbox checked={selectedExams.some(e => e.id === exam.id)} />
                          <Box>
                            <Typography variant="body2">{exam.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              考试时间: {exam.startTime || '-'}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedExams.length > 0 && allAvailableCourses.length > 0 && (
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>选择科目（可选）</InputLabel>
                      <Select
                        multiple
                        value={selectedCourses}
                        onChange={(e) => setSelectedCourses(e.target.value)}
                        renderValue={(selected) => selected.length > 0 && selected.length < allAvailableCourses.length ? `${selected.length}个科目` : '全部科目'}
                      >
                        {allAvailableCourses.map((course) => (
                          <MenuItem key={course.name} value={course.name}>
                            <Checkbox checked={selectedCourses.includes(course.name)} />
                            {course.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Tabs value={lowScoreTypeTab} onChange={(e, v) => setLowScoreTypeTab(v)} sx={{ mb: 2 }}>
                    <Tab label="知识点" />
                    <Tab label="能力" />
                  </Tabs>
                  <Tabs value={lowScoreDisplayTab} onChange={(e, v) => setLowScoreDisplayTab(v)}>
                    <Tab label="词云模式" />
                    <Tab label="表格模式" />
                  </Tabs>
                </Box>

                {lowScoreTypeTab === 0 ? (
                  // 知识点
                  lowScoreDisplayTab === 0 ? (
                    // 知识点词云模式 - 现代化设计
                    <Box 
                      sx={{ 
                        minHeight: 400, 
                        p: 4, 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {lowScorePoints.length > 0 ? (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                          }}
                        >
                          {lowScorePoints
                            .sort((a, b) => a.ratio - b.ratio) // 按得分率排序，低的在前
                            .map((point, index) => {
                              // 缩小字体大小
                              const fontSize = Math.max(10, Math.min(18, 35 - point.ratio * 35));
                              const opacity = 0.6 + (1 - point.ratio) * 0.4;
                              const severity = point.ratio < 0.4 ? 'error' : point.ratio < 0.5 ? 'warning' : 'info';
                              
                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 2,
                                    background: severity === 'error' 
                                      ? `linear-gradient(135deg, rgba(211, 47, 47, ${opacity}), rgba(198, 40, 40, ${opacity}))`
                                      : severity === 'warning'
                                      ? `linear-gradient(135deg, rgba(237, 108, 2, ${opacity}), rgba(230, 81, 0, ${opacity}))`
                                      : `linear-gradient(135deg, rgba(25, 118, 210, ${opacity}), rgba(21, 101, 192, ${opacity}))`,
                                    color: 'white',
                                    fontWeight: point.ratio < 0.4 ? 700 : 600,
                                    fontSize: `${fontSize}px`,
                                    boxShadow: `0 4px 8px rgba(0,0,0,${0.2 * opacity})`,
                                    transform: `scale(${0.9 + (1 - point.ratio) * 0.1})`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: `scale(${1 + (1 - point.ratio) * 0.1})`,
                                      boxShadow: `0 6px 12px rgba(0,0,0,${0.3 * opacity})`,
                                    },
                                  }}
                                >
                                  {point.pointName}
                                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, fontSize: `${fontSize * 0.6}px` }}>
                                    {((point.ratio || 0) * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              );
                            })}
                        </Box>
                      ) : (
                        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                          暂无薄弱知识点
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    // 知识点表格模式
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>考试</TableCell>
                            <TableCell>科目</TableCell>
                            <TableCell>知识点</TableCell>
                            <TableCell align="right">得分</TableCell>
                            <TableCell align="right">满分</TableCell>
                            <TableCell align="right">得分率</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowScorePoints.length > 0 ? (
                            lowScorePoints.map((point, index) => (
                              <TableRow key={index}>
                                <TableCell>{point.exam}</TableCell>
                                <TableCell>{point.course}</TableCell>
                                <TableCell>{point.pointName}</TableCell>
                                <TableCell align="right">{point.score}</TableCell>
                                <TableCell align="right">{point.totalScore}</TableCell>
                                <TableCell align="right">
                                  {((point.ratio || 0) * 100).toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography color="text.secondary">
                                  暂无薄弱知识点
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                ) : (
                  // 能力
                  lowScoreDisplayTab === 0 ? (
                    // 能力词云模式 - 现代化设计
                    <Box 
                      sx={{ 
                        minHeight: 400, 
                        p: 4, 
                        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                        borderRadius: 3,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {lowScoreAbilities.length > 0 ? (
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 2,
                            justifyContent: 'center',
                            alignItems: 'center',
                            minHeight: 300,
                          }}
                        >
                          {lowScoreAbilities
                            .sort((a, b) => a.ratio - b.ratio) // 按得分率排序，低的在前
                            .map((ability, index) => {
                              // 缩小字体大小
                              const fontSize = Math.max(10, Math.min(18, 35 - ability.ratio * 35));
                              const opacity = 0.6 + (1 - ability.ratio) * 0.4;
                              const severity = ability.ratio < 0.4 ? 'error' : ability.ratio < 0.5 ? 'warning' : 'info';
                              
                              return (
                                <Box
                                  key={index}
                                  sx={{
                                    px: 1.5,
                                    py: 1,
                                    borderRadius: 2,
                                    background: severity === 'error' 
                                      ? `linear-gradient(135deg, rgba(211, 47, 47, ${opacity}), rgba(198, 40, 40, ${opacity}))`
                                      : severity === 'warning'
                                      ? `linear-gradient(135deg, rgba(237, 108, 2, ${opacity}), rgba(230, 81, 0, ${opacity}))`
                                      : `linear-gradient(135deg, rgba(25, 118, 210, ${opacity}), rgba(21, 101, 192, ${opacity}))`,
                                    color: 'white',
                                    fontWeight: ability.ratio < 0.4 ? 700 : 600,
                                    fontSize: `${fontSize}px`,
                                    boxShadow: `0 4px 8px rgba(0,0,0,${0.2 * opacity})`,
                                    transform: `scale(${0.9 + (1 - ability.ratio) * 0.1})`,
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      transform: `scale(${1 + (1 - ability.ratio) * 0.1})`,
                                      boxShadow: `0 6px 12px rgba(0,0,0,${0.3 * opacity})`,
                                    },
                                  }}
                                >
                                  {ability.abilityName}
                                  <Typography variant="caption" sx={{ display: 'block', opacity: 0.9, fontSize: `${fontSize * 0.6}px` }}>
                                    {((ability.ratio || 0) * 100).toFixed(1)}%
                                  </Typography>
                                </Box>
                              );
                            })}
                        </Box>
                      ) : (
                        <Typography color="text.secondary" align="center" sx={{ py: 8 }}>
                          暂无薄弱能力
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    // 能力表格模式
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>考试</TableCell>
                            <TableCell>科目</TableCell>
                            <TableCell>能力</TableCell>
                            <TableCell align="right">得分</TableCell>
                            <TableCell align="right">满分</TableCell>
                            <TableCell align="right">得分率</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {lowScoreAbilities.length > 0 ? (
                            lowScoreAbilities.map((ability, index) => (
                              <TableRow key={index}>
                                <TableCell>{ability.exam}</TableCell>
                                <TableCell>{ability.course}</TableCell>
                                <TableCell>{ability.abilityName}</TableCell>
                                <TableCell align="right">{ability.score}</TableCell>
                                <TableCell align="right">{ability.totalScore}</TableCell>
                                <TableCell align="right">
                                  {((ability.ratio || 0) * 100).toFixed(2)}%
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} align="center">
                                <Typography color="text.secondary">
                                  暂无薄弱能力
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )
                )}
              </CardContent>
            </Card>
          </TabPanel>
        </motion.div>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
