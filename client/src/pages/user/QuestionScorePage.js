import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Button,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import api from '../../utils/api';
import Footer from '../../components/Footer';

export default function QuestionScorePage() {
  const { examId, examCourseId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
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
        // 先获取科目名称
        const scoreResult = await api.get(`/exam/score/${examId}`);
        if (scoreResult.success && scoreResult.data) {
          const scores = Array.isArray(scoreResult.data) ? scoreResult.data : [];
          const course = scores.find(s => s.examCourseId === examCourseId);
          if (course) {
            setCourseName(course.courseName || '');
          }
        }

        // 获取小题得分
        const result = await api.get(`/analysis/question/${examCourseId}`);
        if (result.success && result.data) {
          setQuestions(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
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
                小题得分详情
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
            <Table sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: 80 }}>题号</TableCell>
                  <TableCell sx={{ minWidth: 150 }}>知识点</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>能力</TableCell>
                  <TableCell align="right" sx={{ minWidth: 70 }}>得分</TableCell>
                  <TableCell align="right" sx={{ minWidth: 70 }}>满分</TableCell>
                  <TableCell align="right" sx={{ minWidth: 90 }}>得分率</TableCell>
                  {displayOptions.showClassRatio && <TableCell align="right" sx={{ minWidth: 110 }}>班级得分率</TableCell>}
                  {displayOptions.showSchoolRatio && <TableCell align="right" sx={{ minWidth: 110 }}>学校得分率</TableCell>}
                  {displayOptions.showCountyRatio && <TableCell align="right" sx={{ minWidth: 110 }}>区县得分率</TableCell>}
                  {displayOptions.showCityRatio && <TableCell align="right" sx={{ minWidth: 110 }}>全市得分率</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.questionId}>
                    <TableCell>{q.questionNo}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {q.pointName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {q.abilityName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body1"
                        color={q.ratio === 1 ? 'success.main' : q.ratio === 0 ? 'error.main' : 'text.primary'}
                      >
                        {q.score}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{q.totalScore}</TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${(q.ratio * 100).toFixed(1)}%`}
                        size="small"
                        color={q.ratio === 1 ? 'success' : q.ratio === 0 ? 'error' : 'default'}
                      />
                    </TableCell>
                    {displayOptions.showClassRatio && (
                      <TableCell align="right">
                        {q.classRatio ? `${(q.classRatio * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    )}
                    {displayOptions.showSchoolRatio && (
                      <TableCell align="right">
                        {q.schoolRatio ? `${(q.schoolRatio * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    )}
                    {displayOptions.showCountyRatio && (
                      <TableCell align="right">
                        {q.countyRatio ? `${(q.countyRatio * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    )}
                    {displayOptions.showCityRatio && (
                      <TableCell align="right">
                        {q.cityRatio ? `${(q.cityRatio * 100).toFixed(1)}%` : '-'}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
