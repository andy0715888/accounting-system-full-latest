const crypto = require('crypto');

// 加密密钥：优先从环境变量读取，否则使用基于机器特征的稳定密钥
// AES-256 需要 32 字节（256 位）密钥，这里用 sha256 派生恰好 32 字节
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (function() {
    const os = require('os');
    const seed = os.hostname() + os.platform() + os.arch() + (os.userInfo().username || 'default');
    // sha256 摘要为 32 字节，直接作为 AES-256 密钥（不要截断）
    return crypto.createHash('sha256').update(seed).digest('hex');
})();

const ALGORITHM = 'aes-256-cbc';

// 加密
function encrypt(text) {
    if (text === null || text === undefined) return null;
    if (text === '') return '';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(String(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

// 解密
function decrypt(encryptedText) {
    if (encryptedText === null || encryptedText === undefined) return null;
    if (encryptedText === '') return '';
    // 兼容旧的明文密码：没有冒号分隔符的视为明文
    if (typeof encryptedText === 'string' && !encryptedText.includes(':')) {
        return encryptedText;
    }
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 2) return encryptedText;
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        // 解密失败，返回原文（可能是旧明文数据）
        return encryptedText;
    }
}

// 生成随机密码
function generateRandomPassword(length = 16) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
    const bytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars[bytes[i] % chars.length];
    }
    return password;
}

// 生成随机session secret
function generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
}

module.exports = { encrypt, decrypt, generateRandomPassword, generateSecret };
