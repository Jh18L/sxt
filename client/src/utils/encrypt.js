import CryptoJS from 'crypto-js';

/**
 * AES加密函数（与后端保持一致）
 * @param {string} plainText - 明文
 * @returns {string} 加密后的Base64字符串
 */
export function encryptAES(plainText) {
  const key = CryptoJS.enc.Utf8.parse('JMybKEd6L1cVpw==');
  const srcs = CryptoJS.enc.Utf8.parse(plainText);
  return CryptoJS.AES.encrypt(srcs, key, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  }).toString();
}
