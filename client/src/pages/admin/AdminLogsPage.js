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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Card,
  CardContent,
  Grid,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [method, setMethod] = useState('');
  const [url, setUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, method, url, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = { page, size: 50 };
      if (method) params.method = method;
      if (url) params.url = url;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const result = await api.get('/admin/logs', { params });
      if (result.success && result.data) {
        setLogs(result.data.list || []);
        setTotal(result.data.total || 0);
      } else {
        setErrorMessage(result.message || '获取日志失败');
      }
    } catch (error) {
      console.error('获取日志失败:', error);
      setErrorMessage(error.message || error.response?.data?.message || '获取日志失败，请检查网络连接');
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('确定要清除30天前的日志吗？')) {
      return;
    }

    try {
      const result = await api.delete('/admin/logs', {
        params: { days: 30 }
      });
      if (result.success) {
        setDeleteMessage({ type: 'success', text: result.message || '日志清除成功' });
        fetchLogs();
      } else {
        setDeleteMessage({ type: 'error', text: result.message || '日志清除失败' });
      }
    } catch (error) {
      setDeleteMessage({ type: 'error', text: error.message || '日志清除失败' });
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return 'success';
    if (status >= 400 && status < 500) return 'warning';
    if (status >= 500) return 'error';
    return 'default';
  };

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          服务器日志
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          查看所有后端与生学堂API的通信记录
        </Typography>

        {/* 筛选条件 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>请求方法</InputLabel>
                  <Select
                    value={method}
                    onChange={(e) => {
                      setMethod(e.target.value);
                      setPage(1);
                    }}
                    label="请求方法"
                  >
                    <MenuItem value="">全部</MenuItem>
                    <MenuItem value="GET">GET</MenuItem>
                    <MenuItem value="POST">POST</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="URL关键词"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setPage(1);
                  }}
                  placeholder="搜索URL"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="开始时间"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="结束时间"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button
                variant="outlined"
                color="error"
                onClick={handleClearLogs}
                disabled={loading}
              >
                清除30天前日志
              </Button>
              {deleteMessage.text && (
                <Alert severity={deleteMessage.type} sx={{ flexGrow: 1, ml: 2 }}>
                  {deleteMessage.text}
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

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
                    <TableCell>时间</TableCell>
                    <TableCell>方法</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>状态码</TableCell>
                    <TableCell>耗时</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          暂无日志数据
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                    <React.Fragment key={log._id}>
                      <TableRow>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.method}
                            size="small"
                            color={log.method === 'POST' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.url || '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.responseStatus || '-'}
                            size="small"
                            color={getStatusColor(log.responseStatus)}
                          />
                        </TableCell>
                        <TableCell>
                          {log.duration ? `${log.duration}ms` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                          >
                            {expandedLog === log._id ? '收起' : '查看详情'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedLog === log._id && (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>请求信息</Typography>
                                  <Typography variant="body2"><strong>URL:</strong> {log.url}</Typography>
                                  <Typography variant="body2"><strong>Base URL:</strong> {log.baseURL || '-'}</Typography>
                                  <Typography variant="body2"><strong>方法:</strong> {log.method}</Typography>
                                  <Typography variant="body2"><strong>耗时:</strong> {log.duration || 0}ms</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2" gutterBottom>响应信息</Typography>
                                  <Typography variant="body2"><strong>状态码:</strong> {log.responseStatus || '-'}</Typography>
                                  {log.error && (
                                    <Typography variant="body2" color="error"><strong>错误:</strong> {log.error}</Typography>
                                  )}
                                </Grid>
                                {log.requestHeaders && Object.keys(log.requestHeaders).length > 0 && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>请求头</Typography>
                                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'white', maxHeight: '200px', overflow: 'auto' }}>
                                      <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                        {JSON.stringify(log.requestHeaders, null, 2)}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                )}
                                {log.requestData && Object.keys(log.requestData).length > 0 && (
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>请求数据</Typography>
                                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'white', maxHeight: '200px', overflow: 'auto' }}>
                                      <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                        {JSON.stringify(log.requestData, null, 2)}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                )}
                                {log.responseData && (
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2" gutterBottom>响应数据</Typography>
                                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'white', maxHeight: '400px', overflow: 'auto' }}>
                                      <pre style={{ fontSize: '0.8rem', margin: 0 }}>
                                        {JSON.stringify(log.responseData, null, 2)}
                                      </pre>
                                    </Paper>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {total > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(total / 50)}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Box>
    </AdminLayout>
  );
}

