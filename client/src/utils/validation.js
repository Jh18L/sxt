// 输入验证工具函数

// 手机号验证
export const validatePhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phone) {
    return { valid: false, message: '请输入手机号' };
  }
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '请输入正确的手机号格式' };
  }
  return { valid: true, message: '' };
};

// 身份证号验证
export const validateIdCard = (idCard) => {
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  if (!idCard) {
    return { valid: false, message: '请输入身份证号' };
  }
  if (!idCardRegex.test(idCard)) {
    return { valid: false, message: '请输入正确的身份证号格式' };
  }
  return { valid: true, message: '' };
};

// 账号验证（手机号或身份证）
export const validateAccount = (account) => {
  if (!account) {
    return { valid: false, message: '请输入账号' };
  }
  const phoneRegex = /^1[3-9]\d{9}$/;
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
  
  if (phoneRegex.test(account) || idCardRegex.test(account)) {
    return { valid: true, message: '' };
  }
  return { valid: false, message: '请输入手机号或身份证号' };
};

// 密码验证
export const validatePassword = (password) => {
  if (!password) {
    return { valid: false, message: '请输入密码' };
  }
  if (password.length < 6) {
    return { valid: false, message: '密码长度至少6位' };
  }
  return { valid: true, message: '' };
};

// 验证码验证（6位数字）
export const validateAuthCode = (code) => {
  const codeRegex = /^\d{6}$/;
  if (!code) {
    return { valid: false, message: '请输入验证码' };
  }
  if (!codeRegex.test(code)) {
    return { valid: false, message: '验证码为6位数字' };
  }
  return { valid: true, message: '' };
};

// 姓名验证（中文或英文）
export const validateName = (name) => {
  const nameRegex = /^[\u4e00-\u9fa5a-zA-Z\s]{2,20}$/;
  if (!name) {
    return { valid: false, message: '请输入姓名' };
  }
  if (!nameRegex.test(name)) {
    return { valid: false, message: '姓名长度为2-20个字符，支持中文和英文' };
  }
  return { valid: true, message: '' };
};

// 学校名称验证
export const validateSchoolName = (schoolName) => {
  if (!schoolName || schoolName.trim().length === 0) {
    return { valid: false, message: '请输入学校名称' };
  }
  if (schoolName.trim().length < 2) {
    return { valid: false, message: '学校名称至少2个字符' };
  }
  return { valid: true, message: '' };
};

