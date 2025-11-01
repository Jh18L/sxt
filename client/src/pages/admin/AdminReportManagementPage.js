import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [examId, setExamId] = useState('');
  const [exams, setExams] = useState([]);
  const [expandedReport, setExpandedReport] = useState(null);
  const [detailTab, setDetailTab] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [page, search, examId]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = { page, size: 20, search };
      if (examId) params.examId = examId;
      
      const result = await api.get('/admin/reports', { params });
      if (result.success && result.data) {
        setReports(result.data.list || []);
        setTotal(result.data.total || 0);
        setExams(result.data.exams || []);
      }
    } catch (error) {
      console.error('获取报告列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          考试报告管理
        </Typography>

        {/* 筛选条件 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="搜索报告"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="考试名称/账号"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>按考试筛选</InputLabel>
                  <Select
                    value={examId}
                    onChange={(e) => {
                      setExamId(e.target.value);
                      setPage(1);
                    }}
                    label="按考试筛选"
                  >
                    <MenuItem value="">全部考试</MenuItem>
                    {exams.map((exam) => (
                      <MenuItem key={exam.examId} value={exam.examId}>
                        {exam.examName} ({exam.userCount}人)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>考试名称</TableCell>
                    <TableCell>账号</TableCell>
                    <TableCell>用户信息</TableCell>
                    <TableCell>获取时间</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <React.Fragment key={report._id}>
                      <TableRow>
                        <TableCell>{report.examName || report.examId || '-'}</TableCell>
                        <TableCell>{report.account || '-'}</TableCell>
                        <TableCell>
                          {report.userInfo ? (
                            <Box>
                              <Typography variant="body2"><strong>{report.userInfo.name || '-'}</strong></Typography>
                              <Typography variant="caption">{report.userInfo.schoolName || '-'}</Typography>
                              <Typography variant="caption" display="block">{report.userInfo.className || '-'}</Typography>
                            </Box>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(report.fetchedAt || report.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => setExpandedReport(expandedReport === report._id ? null : report._id)}
                          >
                            {expandedReport === report._id ? '收起' : '查看详情'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedReport === report._id && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Tabs value={detailTab} onChange={(e, v) => setDetailTab(v)} sx={{ mb: 2 }}>
                                <Tab label="考试基本信息" />
                                <Tab label="成绩数据" />
                                <Tab label="小题得分" />
                                <Tab label="知识点分析" />
                                <Tab label="能力分析" />
                                <Tab label="用户信息" />
                              </Tabs>

                              <TabPanel value={detailTab} index={0}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">考试信息</Typography>
                                    <Typography variant="body2"><strong>考试ID:</strong> {report.examId}</Typography>
                                    <Typography variant="body2"><strong>考试名称:</strong> {report.examName || '-'}</Typography>
                                    <Typography variant="body2"><strong>账号:</strong> {report.account}</Typography>
                                    <Typography variant="body2"><strong>用户ID:</strong> {report.userId || '-'}</Typography>
                                  </Grid>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2">时间信息</Typography>
                                    <Typography variant="body2"><strong>获取时间:</strong> {new Date(report.fetchedAt || report.createdAt).toLocaleString('zh-CN')}</Typography>
                                    <Typography variant="body2"><strong>创建时间:</strong> {new Date(report.createdAt).toLocaleString('zh-CN')}</Typography>
                                    <Typography variant="body2"><strong>更新时间:</strong> {new Date(report.updatedAt || report.createdAt).toLocaleString('zh-CN')}</Typography>
                                  </Grid>
                                  {report.examData && (
                                    <Grid item xs={12}>
                                      <Typography variant="subtitle2">完整考试数据</Typography>
                                      <Paper sx={{ p: 2, mt: 1, bgcolor: 'white', maxHeight: '400px', overflow: 'auto' }}>
                                        <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                          {JSON.stringify(report.examData, null, 2)}
                                        </pre>
                                      </Paper>
                                    </Grid>
                                  )}
                                </Grid>
                              </TabPanel>

                              <TabPanel value={detailTab} index={1}>
                                {report.scoreData ? (
                                  <Paper sx={{ p: 2, bgcolor: 'white', maxHeight: '500px', overflow: 'auto' }}>
                                    <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                      {JSON.stringify(report.scoreData, null, 2)}
                                    </pre>
                                  </Paper>
                                ) : (
                                  <Typography color="text.secondary">暂无成绩数据</Typography>
                                )}
                              </TabPanel>

                              <TabPanel value={detailTab} index={2}>
                                {report.questionData ? (
                                  <Paper sx={{ p: 2, bgcolor: 'white', maxHeight: '500px', overflow: 'auto' }}>
                                    <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                      {JSON.stringify(report.questionData, null, 2)}
                                    </pre>
                                  </Paper>
                                ) : (
                                  <Typography color="text.secondary">暂无小题得分数据</Typography>
                                )}
                              </TabPanel>

                              <TabPanel value={detailTab} index={3}>
                                {report.pointData ? (
                                  <Paper sx={{ p: 2, bgcolor: 'white', maxHeight: '500px', overflow: 'auto' }}>
                                    <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                      {JSON.stringify(report.pointData, null, 2)}
                                    </pre>
                                  </Paper>
                                ) : (
                                  <Typography color="text.secondary">暂无知识点分析数据</Typography>
                                )}
                              </TabPanel>

                              <TabPanel value={detailTab} index={4}>
                                {report.abilityData ? (
                                  <Paper sx={{ p: 2, bgcolor: 'white', maxHeight: '500px', overflow: 'auto' }}>
                                    <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                      {JSON.stringify(report.abilityData, null, 2)}
                                    </pre>
                                  </Paper>
                                ) : (
                                  <Typography color="text.secondary">暂无能力分析数据</Typography>
                                )}
                              </TabPanel>

                              <TabPanel value={detailTab} index={5}>
                                {report.userInfo ? (
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2">基本信息</Typography>
                                      <Typography variant="body2"><strong>姓名:</strong> {report.userInfo.name || '-'}</Typography>
                                      <Typography variant="body2"><strong>手机号:</strong> {report.userInfo.phoneNumber || '-'}</Typography>
                                      <Typography variant="body2"><strong>用户ID:</strong> {report.userInfo.userId || '-'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2">学校/班级</Typography>
                                      <Typography variant="body2"><strong>学校:</strong> {report.userInfo.schoolName || '-'}</Typography>
                                      <Typography variant="body2"><strong>班级:</strong> {report.userInfo.className || '-'}</Typography>
                                    </Grid>
                                    {report.userInfo.userInfo && (
                                      <Grid item xs={12}>
                                        <Typography variant="subtitle2">完整用户信息 (get_user_info)</Typography>
                                        <Paper sx={{ p: 2, mt: 1, bgcolor: 'white', maxHeight: '400px', overflow: 'auto' }}>
                                          <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                            {JSON.stringify(report.userInfo.userInfo, null, 2)}
                                          </pre>
                                        </Paper>
                                      </Grid>
                                    )}
                                  </Grid>
                                ) : (
                                  <Typography color="text.secondary">暂无用户信息</Typography>
                                )}
                              </TabPanel>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(total / 20)}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>
    </AdminLayout>
  );
}
