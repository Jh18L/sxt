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
  Chip,
  CircularProgress,
  Button,
  Grid,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import api from '../../utils/api';
import Footer from '../../components/Footer';

export default function ExamDetailPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { examId } = useParams();
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [examName, setExamName] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadOptions, setDownloadOptions] = useState({
    showRatio: true,
    showCityRank: true,
    showCountyRank: true,
    showSchoolRank: true,
    showClassRank: true,
    showLevel: true,
    showBasicInfo: true,
  });
  const [displayOptions, setDisplayOptions] = useState({
    showRatio: true,
    showCityRank: true,
    showCountyRank: true,
    showSchoolRank: true,
    showClassRank: true,
  });

  // 计算得分等级和附近的分数线
  const getScoreLevel = (score, details) => {
    if (!details || !Array.isArray(details) || details.length === 0) {
      return null;
    }

    // 复制并按分数线从高到低排序
    const sortedDetails = [...details].sort((a, b) => b.lineScore - a.lineScore);

    // 找出已获得的最高等级（得分 >= 分数线）
    // 找出未获得的最低等级（得分 < 分数线）
    let achievedLevel = null;
    let unachievedLevel = null;

    // 遍历所有分数线，分别找出已获得和未获得的等级
    for (const detail of sortedDetails) {
      if (score >= detail.lineScore) {
        // 得分 >= 分数线，表示已达到该等级
        // 由于是从高到低排序，第一个满足条件的即是最高的已获得等级
        if (!achievedLevel) {
          achievedLevel = detail;
        }
      } else {
        // 得分 < 分数线，表示未达到该等级
        // 由于是从高到低排序，第一个不满足条件的即是最低的未获得等级（最高的未达到等级）
        if (!unachievedLevel) {
          unachievedLevel = detail;
        }
      }
    }

    return {
      level: achievedLevel?.lineName || unachievedLevel?.lineName,
      detail: achievedLevel || unachievedLevel,
      achieved: achievedLevel, // 已获得的最高等级（得分 >= 分数线）
      unachieved: unachievedLevel, // 未获得的最低等级（得分 < 分数线）
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取成绩
        const scoreResult = await api.get(`/exam/score/${examId}`);
        if (scoreResult.success && scoreResult.data) {
          setScores(Array.isArray(scoreResult.data) ? scoreResult.data : []);
        }

        // 获取考试名称
        const examListResult = await api.get('/exam/list', { params: { page: 1, size: 100 } });
        if (examListResult.success && examListResult.data?.dataList) {
          const exam = examListResult.data.dataList.find(e => e.id === examId);
          if (exam) {
            setExamName(exam.name || '');
          }
        }

        // 获取用户信息
        const userResult = await api.get('/user/info');
        if (userResult.success) {
          setUserInfo(userResult.data);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [examId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalScore = scores.find(s => s.courseType === 2) || scores[0] || {};
  // 总分也使用赋分成绩进行等级判断（如果有赋分）
  const totalScoreForLevel = totalScore.needAssignScore && totalScore.nceGainScore 
    ? totalScore.nceGainScore 
    : totalScore.gainScore;
  const totalScoreLevelInfo = getScoreLevel(totalScoreForLevel, totalScore.details);

  // 下载成绩报告
  const handleDownloadReport = () => {
    const studentInfo = userInfo?.userSimpleDTO || {};
    const classInfo = userInfo?.classComplexDTO || {};
    const gradeInfo = classInfo?.gradeComplexDTO || {};
    const areaInfo = userInfo?.areaDTO || {};

    // 创建工作簿
    const wb = XLSX.utils.book_new();

    // 准备数据数组
    const scoreData = [];

    // 添加基本信息
    if (downloadOptions.showBasicInfo) {
      scoreData.push(['生学堂成绩报告', ''], ['']);
      scoreData.push(['考试名称', examName || '']);
      scoreData.push(['']);
      scoreData.push(['学生基本信息', '']);
      scoreData.push(['姓名', studentInfo.name || '-']);
      scoreData.push(['学号', studentInfo.sxwNumber || '-']);
      scoreData.push(['手机号', studentInfo.phoneNumber || '-']);
      scoreData.push(['学校', areaInfo.name || '-']);
      scoreData.push(['年级', gradeInfo?.gradeName || '-']);
      scoreData.push(['班级', classInfo?.classSimpleDTO?.name || '-']);
      scoreData.push(['']);
    }

    // 创建成绩表头
    const headers = ['科目'];
    
    // 添加得分列
    const subjectScores = scores.filter(s => s.courseType !== 2);
    const hasAssignedScore = subjectScores.some(s => s.needAssignScore && s.nceGainScore);
    if (hasAssignedScore) {
      headers.push('得分（赋分）', '原始分');
    } else {
      headers.push('得分');
    }

    if (downloadOptions.showLevel) {
      headers.push('等级', '分数线');
    }
    if (downloadOptions.showCityRank) {
      headers.push('市排名');
      if (downloadOptions.showRatio) {
        headers.push('超越全市%');
      }
    }
    if (downloadOptions.showCountyRank) {
      headers.push('区排名');
      if (downloadOptions.showRatio) {
        headers.push('超越区县%');
      }
    }
    if (downloadOptions.showSchoolRank) {
      headers.push('校排名');
      if (downloadOptions.showRatio) {
        headers.push('超越学校%');
      }
    }
    if (downloadOptions.showClassRank) {
      headers.push('班排名');
      if (downloadOptions.showRatio) {
        headers.push('超越班级%');
      }
    }

    // 添加成绩详情标题
    scoreData.push(['']);
    scoreData.push(['成绩详情', '']);
    scoreData.push(['']);
    scoreData.push(headers);

    // 添加总分行
    const totalScoreData = scores.find(s => s.courseType === 2) || scores[0] || {};
    const totalScoreForLevelData = totalScoreData.needAssignScore && totalScoreData.nceGainScore 
      ? totalScoreData.nceGainScore 
      : totalScoreData.gainScore;
    const totalScoreLevelInfoData = getScoreLevel(totalScoreForLevelData, totalScoreData.details);

    const totalRow = ['总分'];
    if (hasAssignedScore) {
      totalRow.push(
        totalScoreData.needAssignScore && totalScoreData.nceGainScore ? totalScoreData.nceGainScore : '-',
        totalScoreData.gainScore || '-'
      );
    } else {
      totalRow.push(totalScoreData.gainScore || '-');
    }
    if (downloadOptions.showLevel) {
      totalRow.push(
        totalScoreLevelInfoData?.achieved?.lineName || '-',
        totalScoreLevelInfoData?.achieved?.lineScore || '-'
      );
    }
    if (downloadOptions.showCityRank) {
      totalRow.push(totalScoreData.rank || '-');
      if (downloadOptions.showRatio) {
        totalRow.push(totalScoreData.ratio ? ((totalScoreData.ratio * 100).toFixed(2) + '%') : '-');
      }
    }
    if (downloadOptions.showCountyRank) {
      totalRow.push(totalScoreData.countyRank || '-');
      if (downloadOptions.showRatio) {
        totalRow.push(totalScoreData.countyRatio ? ((totalScoreData.countyRatio * 100).toFixed(2) + '%') : '-');
      }
    }
    if (downloadOptions.showSchoolRank) {
      totalRow.push(totalScoreData.schoolRank || '-');
      if (downloadOptions.showRatio) {
        totalRow.push(totalScoreData.schoolRatio ? ((totalScoreData.schoolRatio * 100).toFixed(2) + '%') : '-');
      }
    }
    if (downloadOptions.showClassRank) {
      totalRow.push(totalScoreData.classRank || '-');
      if (downloadOptions.showRatio) {
        totalRow.push(totalScoreData.classRatio ? ((totalScoreData.classRatio * 100).toFixed(2) + '%') : '-');
      }
    }
    scoreData.push(totalRow);

    // 添加各科目成绩
    subjectScores.forEach((score) => {
      const scoreForLevel = score.needAssignScore && score.nceGainScore 
        ? score.nceGainScore 
        : score.gainScore;
      const levelInfo = getScoreLevel(scoreForLevel, score.details);

      const row = [score.courseName || '-'];
      
      // 得分
      if (hasAssignedScore) {
        row.push(
          score.needAssignScore && score.nceGainScore ? score.nceGainScore : '-',
          score.gainScore || '-'
        );
      } else {
        row.push(score.gainScore || '-');
      }

      // 等级
      if (downloadOptions.showLevel) {
        if (levelInfo?.achieved) {
          row.push(
            levelInfo.achieved.lineName || '-',
            levelInfo.achieved.lineScore || '-'
          );
        } else {
          row.push('-', '-');
        }
      }

      // 排名和超越率
      if (downloadOptions.showCityRank) {
        row.push(score.rank || '-');
        if (downloadOptions.showRatio) {
          row.push(score.ratio ? ((score.ratio * 100).toFixed(2) + '%') : '-');
        }
      }
      if (downloadOptions.showCountyRank) {
        row.push(score.countyRank || '-');
        if (downloadOptions.showRatio) {
          row.push(score.countyRatio ? ((score.countyRatio * 100).toFixed(2) + '%') : '-');
        }
      }
      if (downloadOptions.showSchoolRank) {
        row.push(score.schoolRank || '-');
        if (downloadOptions.showRatio) {
          row.push(score.schoolRatio ? ((score.schoolRatio * 100).toFixed(2) + '%') : '-');
        }
      }
      if (downloadOptions.showClassRank) {
        row.push(score.classRank || '-');
        if (downloadOptions.showRatio) {
          row.push(score.classRatio ? ((score.classRatio * 100).toFixed(2) + '%') : '-');
        }
      }

      scoreData.push(row);
    });

    // 创建工作表
    const ws = XLSX.utils.aoa_to_sheet(scoreData);

    // 设置列宽
    const colWidths = headers.map(() => ({ wch: 15 }));
    ws['!cols'] = colWidths;

    // 设置合并单元格
    if (downloadOptions.showBasicInfo && scoreData.length > 0) {
      const merges = [];
      
      // 合并标题行
      const titleRow = 0;
      merges.push({ s: { r: titleRow, c: 0 }, e: { r: titleRow, c: headers.length - 1 } });
      
      // 合并"学生基本信息"标题
      const basicInfoTitleRow = scoreData.findIndex(row => row[0] === '学生基本信息');
      if (basicInfoTitleRow >= 0) {
        merges.push({ 
          s: { r: basicInfoTitleRow, c: 0 }, 
          e: { r: basicInfoTitleRow, c: headers.length - 1 } 
        });
      }

      // 合并"成绩详情"标题
      const scoreTitleRow = scoreData.findIndex(row => row[0] === '成绩详情');
      if (scoreTitleRow >= 0) {
        merges.push({ 
          s: { r: scoreTitleRow, c: 0 }, 
          e: { r: scoreTitleRow, c: headers.length - 1 } 
        });
      }

      ws['!merges'] = merges;
    }

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '成绩报告');

    // 生成文件名
    const fileName = `${examName || '成绩报告'}_${studentInfo.name || '学生'}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // 下载文件
    XLSX.writeFile(wb, fileName);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Container maxWidth="lg" sx={{ flex: 1 }}>
        <Box sx={{ py: 4 }}>
        <Button
          onClick={() => navigate('/exams')}
          variant="outlined"
          sx={{ mb: 3 }}
        >
          返回考试列表
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                总分：{totalScore.gainScore || '-'} 分
                {totalScore.needAssignScore && totalScore.nceGainScore && (
                  <Typography 
                    component="span" 
                    variant="body1" 
                    sx={{ ml: 0.5, color: 'text.secondary' }}
                  >
                    （赋分：{totalScore.nceGainScore}分）
                  </Typography>
                )}
              </Typography>
              
              {/* 得分等级和分数线 */}
              {totalScoreLevelInfo && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  {/* 已获得的等级 - 蓝色显示 */}
                  {totalScoreLevelInfo.achieved ? (
                    <Chip 
                      label={`等级: ${totalScoreLevelInfo.achieved.lineName} (分数线: ${totalScoreLevelInfo.achieved.lineScore}分)`} 
                      color="primary" 
                      size="medium"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ) : null}
                  {/* 未获得的等级 - 灰色显示 */}
                  {totalScoreLevelInfo.unachieved ? (
                    <Chip 
                      label={`${totalScoreLevelInfo.unachieved.lineName}: ${totalScoreLevelInfo.unachieved.lineScore}分`}
                      variant="outlined"
                      size="medium"
                      sx={{ 
                        mr: 1, 
                        mb: 1,
                        color: 'text.secondary',
                        borderColor: 'text.secondary',
                        opacity: 0.6,
                      }}
                    />
                  ) : null}
                  {/* 如果既没有已获得也没有未获得（理论上不应该发生），显示主等级 */}
                  {!totalScoreLevelInfo.achieved && !totalScoreLevelInfo.unachieved && totalScoreLevelInfo.level && (
                    <Chip 
                      label={`等级: ${totalScoreLevelInfo.level} (分数线: ${totalScoreLevelInfo.detail?.lineScore}分)`} 
                      color="primary" 
                      size="medium"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                </Box>
              )}

              {/* 排名信息（根据选项显示，组合排名和超越率） */}
              {(totalScore.rank || totalScore.countyRank || totalScore.schoolRank || totalScore.classRank || totalScore.ratio) && (
                <Box sx={{ mt: 2 }}>
                  {displayOptions.showCityRank && totalScore.rank && (
                    <Chip 
                      label={`全市排名: ${totalScore.rank}${displayOptions.showRatio && totalScore.ratio ? ` (超越${(totalScore.ratio * 100).toFixed(2)}%的人)` : ''}`} 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                  )}
                  {displayOptions.showCountyRank && totalScore.countyRank && (
                    <Chip 
                      label={`区县排名: ${totalScore.countyRank}${displayOptions.showRatio && totalScore.countyRatio ? ` (超越${(totalScore.countyRatio * 100).toFixed(2)}%的人)` : ''}`} 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                  )}
                  {displayOptions.showSchoolRank && totalScore.schoolRank && (
                    <Chip 
                      label={`学校排名: ${totalScore.schoolRank}${displayOptions.showRatio && totalScore.schoolRatio ? ` (超越${(totalScore.schoolRatio * 100).toFixed(2)}%的人)` : ''}`} 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                  )}
                  {displayOptions.showClassRank && totalScore.classRank && (
                    <Chip 
                      label={`班级排名: ${totalScore.classRank}${displayOptions.showRatio && totalScore.classRatio ? ` (超越${(totalScore.classRatio * 100).toFixed(2)}%的人)` : ''}`} 
                      sx={{ mr: 1, mb: 1 }}
                    />
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          {/* 显示选项复选框 - 移到卡片下方 */}
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
                        checked={displayOptions.showRatio}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showRatio: e.target.checked })}
                      />
                    }
                    label="超越率"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showCityRank}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showCityRank: e.target.checked })}
                      />
                    }
                    label="市排名"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showCountyRank}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showCountyRank: e.target.checked })}
                      />
                    }
                    label="区排名"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showSchoolRank}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showSchoolRank: e.target.checked })}
                      />
                    }
                    label="校排名"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={displayOptions.showClassRank}
                        onChange={(e) => setDisplayOptions({ ...displayOptions, showClassRank: e.target.checked })}
                      />
                    }
                    label="班排名"
                  />
                </Box>
              </FormGroup>
            </CardContent>
          </Card>

          <TableContainer 
            component={Paper} 
            sx={{ 
              overflowX: 'auto',
              maxWidth: '100%',
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
            <Table sx={{ 
              minWidth: 650,
              '& .MuiTableCell-root': {
                fontSize: { xs: '0.8125rem', sm: '0.875rem' },
                padding: { xs: '8px 12px', sm: '16px' },
              },
            }}>
              <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 120 }}>科目</TableCell>
                    <TableCell align="right" sx={{ minWidth: 80 }}>得分</TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}>等级</TableCell>
                    {displayOptions.showCityRank && <TableCell align="right" sx={{ minWidth: 120 }}>全市排名{displayOptions.showRatio ? '/超越率' : ''}</TableCell>}
                    {displayOptions.showCountyRank && <TableCell align="right" sx={{ minWidth: 120 }}>区排名{displayOptions.showRatio ? '/超越率' : ''}</TableCell>}
                    {displayOptions.showSchoolRank && <TableCell align="right" sx={{ minWidth: 120 }}>校排名{displayOptions.showRatio ? '/超越率' : ''}</TableCell>}
                    {displayOptions.showClassRank && <TableCell align="right" sx={{ minWidth: 120 }}>班排名{displayOptions.showRatio ? '/超越率' : ''}</TableCell>}
                    <TableCell align="center" sx={{ minWidth: 150 }}>操作</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                {scores
                  .filter(s => s.courseType !== 2)
                  .map((score) => {
                    // 有赋分的学科使用赋分成绩判断等级，否则使用原始分
                    const scoreForLevel = score.needAssignScore && score.nceGainScore 
                      ? score.nceGainScore 
                      : score.gainScore;
                    const levelInfo = getScoreLevel(scoreForLevel, score.details);
                    return (
                      <TableRow key={score.examCourseId}>
                        <TableCell>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {score.courseName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {score.needAssignScore && score.nceGainScore ? (
                            <Box>
                              <Typography variant="h6" color="primary">
                                {score.nceGainScore}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                (原始分: {score.gainScore})
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="h6" color="primary">
                              {score.gainScore}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          {levelInfo ? (
                            <Box>
                              {/* 已获得的等级 - 蓝色显示 */}
                              {levelInfo.achieved ? (
                                <Chip 
                                  label={`${levelInfo.achieved.lineName} (${levelInfo.achieved.lineScore}分)`} 
                                  color="primary" 
                                  size="small"
                                  sx={{ mb: 0.5 }}
                                />
                              ) : null}
                              {/* 未获得的等级 - 灰色显示 */}
                              {levelInfo.unachieved ? (
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ opacity: 0.6 }}>
                                  {levelInfo.unachieved.lineName}: {levelInfo.unachieved.lineScore}分
                                </Typography>
                              ) : null}
                              {/* 如果既没有已获得也没有未获得，显示主等级 */}
                              {!levelInfo.achieved && !levelInfo.unachieved && levelInfo.level && (
                                <Chip 
                                  label={`${levelInfo.level} (${levelInfo.detail?.lineScore}分)`} 
                                  color="primary" 
                                  size="small"
                                  sx={{ mb: 0.5 }}
                                />
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        {displayOptions.showCityRank && (
                          <TableCell align="right">
                            {score.rank || '-'}
                            {displayOptions.showRatio && score.ratio && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                超越{((score.ratio || 0) * 100).toFixed(2)}%的人
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        {displayOptions.showCountyRank && (
                          <TableCell align="right">
                            {score.countyRank || '-'}
                            {displayOptions.showRatio && score.countyRatio && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                超越{((score.countyRatio || 0) * 100).toFixed(2)}%的人
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        {displayOptions.showSchoolRank && (
                          <TableCell align="right">
                            {score.schoolRank || '-'}
                            {displayOptions.showRatio && score.schoolRatio && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                超越{((score.schoolRatio || 0) * 100).toFixed(2)}%的人
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        {displayOptions.showClassRank && (
                          <TableCell align="right">
                            {score.classRank || '-'}
                            {displayOptions.showRatio && score.classRatio && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                超越{((score.classRatio || 0) * 100).toFixed(2)}%的人
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => navigate(`/exam/${examId}/question/${score.examCourseId}`)}
                              sx={{ 
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                padding: { xs: '4px 8px', sm: '6px 16px' },
                              }}
                            >
                              小题
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => navigate(`/exam/${examId}/analysis/${score.examCourseId}`)}
                              sx={{ 
                                whiteSpace: 'nowrap',
                                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                padding: { xs: '4px 8px', sm: '6px 16px' },
                              }}
                            >
                              分析
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 下载成绩报告按钮 */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={() => setDownloadDialogOpen(true)}
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1.25, sm: 1.5 },
                  borderRadius: 2,
                  fontSize: { xs: '0.9375rem', sm: '1rem' },
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
                  },
                }}
              >
                📥 下载成绩报告
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {/* 下载选项弹窗 */}
        <Dialog
          open={downloadDialogOpen}
          onClose={() => setDownloadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              m: { xs: 0, sm: 2 },
              borderRadius: { xs: 0, sm: 2 },
            },
          }}
        >
          <DialogTitle>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              📋 选择要导出的信息
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <FormGroup sx={{ mt: { xs: 1, sm: 2 } }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                基本信息
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showBasicInfo}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showBasicInfo: e.target.checked })}
                  />
                }
                label="学生基本信息（姓名、学校、班级等）"
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                成绩信息
              </Typography>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showLevel}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showLevel: e.target.checked })}
                  />
                }
                label="等级"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showRatio}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showRatio: e.target.checked })}
                  />
                }
                label="超越率"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showCityRank}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showCityRank: e.target.checked })}
                  />
                }
                label="市排名"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showCountyRank}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showCountyRank: e.target.checked })}
                  />
                }
                label="区排名"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showSchoolRank}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showSchoolRank: e.target.checked })}
                  />
                }
                label="校排名"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={downloadOptions.showClassRank}
                    onChange={(e) => setDownloadOptions({ ...downloadOptions, showClassRank: e.target.checked })}
                  />
                }
                label="班排名"
              />
            </FormGroup>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setDownloadDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                handleDownloadReport();
                setDownloadDialogOpen(false);
              }}
              startIcon={<DownloadIcon />}
            >
              下载Excel
            </Button>
          </DialogActions>
        </Dialog>
        </Box>
      </Container>
      <Footer />
    </Box>
  );
}
