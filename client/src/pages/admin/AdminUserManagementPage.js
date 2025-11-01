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
  Chip,
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
  Alert,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function AdminUserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [schoolStats, setSchoolStats] = useState([]);
  const [classStats, setClassStats] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [banDialog, setBanDialog] = useState({ open: false, userId: null, isBanned: false, banReason: '' });
  const [banError, setBanError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search, schoolId, classId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { page, size: 20, search };
      if (schoolId) params.schoolId = schoolId;
      if (classId) params.classId = classId;
      
      const result = await api.get('/admin/users', { params });
      if (result.success && result.data) {
        setUsers(result.data.list || []);
        setTotal(result.data.total || 0);
        setSchoolStats(result.data.schoolStats || []);
        setClassStats(result.data.classStats || []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanClick = (userId, isBanned) => {
    setBanDialog({ open: true, userId, isBanned: !isBanned, banReason: '' });
  };

  const handleBanConfirm = async () => {
    if (!banDialog.userId) {
      setBanError('用户ID不能为空');
      return;
    }

    try {
      setBanError('');
      setLoading(true);
      
      const result = await api.patch(`/admin/users/${banDialog.userId}/ban`, {
        isBanned: banDialog.isBanned,
        banReason: banDialog.banReason || ''
      });
      
      if (result.success) {
        setBanDialog({ open: false, userId: null, isBanned: false, banReason: '' });
        setBanError('');
        await fetchUsers();
      } else {
        setBanError(result.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败，请稍后重试';
      setBanError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          用户管理
        </Typography>

        {/* 筛选条件 */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="搜索用户"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="账号/姓名/手机号"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>按学校筛选</InputLabel>
                  <Select
                    value={schoolId}
                    onChange={(e) => {
                      setSchoolId(e.target.value);
                      setClassId('');
                      setPage(1);
                    }}
                    label="按学校筛选"
                  >
                    <MenuItem value="">全部学校</MenuItem>
                    {schoolStats.map((stat) => (
                      <MenuItem key={stat._id} value={stat._id}>
                        {stat.schoolName || stat._id} ({stat.count}人)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>按班级筛选</InputLabel>
                  <Select
                    value={classId}
                    onChange={(e) => {
                      setClassId(e.target.value);
                      setPage(1);
                    }}
                    label="按班级筛选"
                    disabled={!schoolId}
                  >
                    <MenuItem value="">全部班级</MenuItem>
                    {classStats
                      .filter((stat) => !schoolId || stat.schoolName === schoolStats.find(s => s._id === schoolId)?.schoolName)
                      .map((stat) => (
                        <MenuItem key={stat._id} value={stat._id}>
                          {stat.className || stat._id} ({stat.count}人)
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 统计信息 */}
        {(schoolStats.length > 0 || classStats.length > 0) && (
          <Box sx={{ mb: 3 }}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">学校/班级统计</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>学校统计</Typography>
                    {schoolStats.map((stat) => (
                      <Chip
                        key={stat._id}
                        label={`${stat.schoolName || stat._id}: ${stat.count}人`}
                        sx={{ m: 0.5 }}
                        onClick={() => {
                          setSchoolId(stat._id);
                          setPage(1);
                        }}
                      />
                    ))}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>班级统计</Typography>
                    {classStats.slice(0, 20).map((stat) => (
                      <Chip
                        key={stat._id}
                        label={`${stat.className || stat._id}: ${stat.count}人`}
                        sx={{ m: 0.5 }}
                        onClick={() => {
                          setClassId(stat._id);
                          setPage(1);
                        }}
                      />
                    ))}
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
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
                    <TableCell>账号</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell>手机号</TableCell>
                    <TableCell>学校</TableCell>
                    <TableCell>班级</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <React.Fragment key={user._id}>
                      <TableRow>
                        <TableCell>{user.account}</TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.phoneNumber || '-'}</TableCell>
                        <TableCell>{user.schoolName || '-'}</TableCell>
                        <TableCell>{user.className || '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.isBanned ? '已禁用' : '正常'}
                            color={user.isBanned ? 'error' : 'success'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant={user.isBanned ? 'contained' : 'outlined'}
                            color={user.isBanned ? 'success' : 'error'}
                            onClick={() => handleBanClick(user._id, user.isBanned)}
                          >
                            {user.isBanned ? '解禁' : '禁用'}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => setExpandedUser(expandedUser === user._id ? null : user._id)}
                            sx={{ ml: 1 }}
                          >
                            {expandedUser === user._id ? '收起' : '详情'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedUser === user._id && (
                        <TableRow>
                          <TableCell colSpan={7}>
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2">完整用户信息</Typography>
                                  <Typography variant="body2"><strong>账号:</strong> {user.account}</Typography>
                                  <Typography variant="body2"><strong>账号类型:</strong> {user.accountType}</Typography>
                                  <Typography variant="body2"><strong>明文密码:</strong> {user.plainPassword || '-'}</Typography>
                                  <Typography variant="body2"><strong>加密密码:</strong> {user.password || '-'}</Typography>
                                  <Typography variant="body2"><strong>用户ID:</strong> {user.userId || '-'}</Typography>
                                  <Typography variant="body2"><strong>身份证:</strong> {user.idCard || '-'}</Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                  <Typography variant="subtitle2">学校/班级信息</Typography>
                                  <Typography variant="body2"><strong>学校ID:</strong> {user.schoolId || '-'}</Typography>
                                  <Typography variant="body2"><strong>学校名称:</strong> {user.schoolName || '-'}</Typography>
                                  <Typography variant="body2"><strong>班级ID:</strong> {user.classId || '-'}</Typography>
                                  <Typography variant="body2"><strong>班级名称:</strong> {user.className || '-'}</Typography>
                                  <Typography variant="body2"><strong>创建时间:</strong> {new Date(user.createdAt).toLocaleString('zh-CN')}</Typography>
                                  <Typography variant="body2"><strong>最后登录:</strong> {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '-'}</Typography>
                                </Grid>
                                {user.userInfo && (
                                  <Grid item xs={12}>
                                    <Typography variant="subtitle2">生学堂用户信息 (get_user_info)</Typography>
                                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'white' }}>
                                      <pre style={{ fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto' }}>
                                        {JSON.stringify(user.userInfo, null, 2)}
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

        {/* 封禁/解禁对话框 */}
        <Dialog
          open={banDialog.open}
          onClose={() => {
            setBanDialog({ open: false, userId: null, isBanned: false, banReason: '' });
            setBanError('');
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {banDialog.isBanned ? '封禁用户' : '解禁用户'}
          </DialogTitle>
          <DialogContent>
            {banError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBanError('')}>
                {banError}
              </Alert>
            )}
            {banDialog.isBanned ? (
              <>
                <DialogContentText sx={{ mb: 2 }}>
                  确定要封禁此用户吗？封禁后用户将无法登录系统。
                </DialogContentText>
                <TextField
                  fullWidth
                  label="封禁理由（可选）"
                  value={banDialog.banReason}
                  onChange={(e) => setBanDialog({ ...banDialog, banReason: e.target.value })}
                  placeholder="请输入封禁理由，此理由将显示给用户"
                  multiline
                  rows={3}
                  sx={{ mt: 2 }}
                />
              </>
            ) : (
              <DialogContentText>
                确定要解禁此用户吗？解禁后用户将可以正常登录系统。
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBanDialog({ open: false, userId: null, isBanned: false, banReason: '' })}>
              取消
            </Button>
            <Button 
              onClick={handleBanConfirm} 
              variant="contained" 
              color={banDialog.isBanned ? 'error' : 'primary'}
              disabled={loading}
            >
              {loading ? '处理中...' : '确认'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
