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
  Grid,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../utils/api';

export default function KnowledgeAnalysisPage() {
  const { examId, examCourseId } = useParams();
  const navigate = useNavigate();
  const [pointData, setPointData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const result = await api.get(`/analysis/point/${examCourseId}`);
        if (result.success && result.data) {
          setPointData(Array.isArray(result.data) ? result.data : []);
        }
      } catch (error) {
        console.error('获取知识点分析失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoints();
  }, [examCourseId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const chartData = pointData.map(item => ({
    name: item.pointName,
    得分: item.score,
    满分: item.totalScore,
    得分率: (item.ratio * 100).toFixed(1),
    班级平均: item.classAverage,
  }));

  return (
    <Container maxWidth="lg">
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
                知识点分析
              </Typography>
            </CardContent>
          </Card>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    知识点得分对比
                  </Typography>
                  <Box sx={{ height: 400, mt: 3 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="得分" fill="#8884d8" />
                        <Bar dataKey="满分" fill="#82ca9d" />
                        <Bar dataKey="班级平均" fill="#ffc658" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      </Box>
    </Container>
  );
}
