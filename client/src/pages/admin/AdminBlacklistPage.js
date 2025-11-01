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
  CircularProgress,
  Button,
  Chip,
  Pagination,
} from '@mui/material';
import AdminLayout from '../../components/AdminLayout';
import api from '../../utils/api';

export default function AdminBlacklistPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBlacklist();
  }, [page]);

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const result = await api.get('/admin/blacklist', {
        params: { page, size: 20 }
      });
      if (result.success && result.data) {
        setUsers(result.data.list || []);
        setTotal(result.data.total || 0);
      }
    } catch (error) {
      console.error('获取黑名单失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async (userId) => {
    try {
      const result = await api.patch(`/admin/users/${userId}/ban`, { isBanned: false });
      if (result.success) {
        fetchBlacklist();
      }
    } catch (error) {
      console.error('解禁失败:', error);
    }
  };

  return (
    <AdminLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          黑名单管理
        </Typography>

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
                    <TableCell>封禁理由</TableCell>
                    <TableCell>封禁时间</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.account}</TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>{user.phoneNumber || '-'}</TableCell>
                        <TableCell>{user.schoolName || '-'}</TableCell>
                        <TableCell>{user.className || '-'}</TableCell>
                        <TableCell>
                          {user.banReason ? (
                            <Chip label={user.banReason} color="error" size="small" />
                          ) : (
                            <Typography variant="body2" color="text.secondary">未填写理由</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.updatedAt || user.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleUnban(user._id)}
                          >
                            解禁
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="text.secondary">暂无黑名单用户</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {total > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(total / 20)}
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
