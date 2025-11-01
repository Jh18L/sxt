import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import api from '../utils/api';

export default function Footer() {
  const [copyright, setCopyright] = useState('2025©狐三岁');

  useEffect(() => {
    const fetchCopyright = async () => {
      try {
        const result = await api.get('/user/announcement', { params: { type: 'copyright' } });
        if (result.success && result.data?.content) {
          setCopyright(result.data.content);
        }
      } catch (error) {
        console.error('获取版权信息失败:', error);
      }
    };

    fetchCopyright();
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 2,
        mt: 'auto',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', opacity: 0.7 }}>
        {copyright}
      </Typography>
    </Box>
  );
}

