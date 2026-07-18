const fs = require('fs');
const path = require('path');

const AUDIT_FILE = path.join(__dirname, '../data/audit.log');
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const KEEP_OLD_FILES = 3;

function ensureDir() {
    const dir = path.dirname(AUDIT_FILE);
    if (!fs.existsSync(dir)) {
        try { fs.mkdirSync(dir, { recursive: true }); } catch {}
    }
}

function rotateIfNeeded() {
    try {
        if (!fs.existsSync(AUDIT_FILE)) return;
        const stat = fs.statSync(AUDIT_FILE);
        if (stat.size < MAX_FILE_SIZE) return;
        // 轮转：audit.log -> audit.log.1 -> audit.log.2 -> ...（最多保留 KEEP_OLD_FILES 个旧文件）
        for (let i = KEEP_OLD_FILES; i >= 1; i--) {
            const src = i === 1 ? AUDIT_FILE : `${AUDIT_FILE}.${i - 1}`;
            const dst = `${AUDIT_FILE}.${i}`;
            if (fs.existsSync(src)) {
                if (i === KEEP_OLD_FILES && fs.existsSync(dst)) fs.unlinkSync(dst);
                fs.renameSync(src, dst);
            }
        }
    } catch (err) {
        console.error('审计日志轮转失败:', err.message);
    }
}

/**
 * 记录审计日志
 * @param {number|null} userId - 用户ID（未登录场景可为 null）
 * @param {string} action - 操作类型，例如 login、logout、upload、host_create、host_delete
 * @param {string} detail - 操作详情
 */
function logAudit(userId, action, detail = '') {
    try {
        ensureDir();
        rotateIfNeeded();
        const entry = JSON.stringify({
            ts: new Date().toISOString(),
            user_id: userId || null,
            action: String(action || '').slice(0, 64),
            detail: String(detail || '').slice(0, 512)
        }) + '\n';
        fs.appendFileSync(AUDIT_FILE, entry, { mode: 0o600 });
    } catch (err) {
        // 审计日志失败不应影响主流程
        console.error('审计日志写入失败:', err.message);
    }
}

/**
 * 读取最近的审计日志（用于管理界面展示）
 * @param {object} options - { limit: 默认200, action: 过滤动作 }
 */
function readAudit(options = {}) {
    const limit = Math.min(Math.max(parseInt(options.limit) || 200, 1), 1000);
    const actionFilter = options.action ? String(options.action) : null;
    const result = [];
    try {
        if (!fs.existsSync(AUDIT_FILE)) return result;
        const content = fs.readFileSync(AUDIT_FILE, 'utf8');
        const lines = content.split('\n').filter(Boolean);
        // 从最新往前读
        for (let i = lines.length - 1; i >= 0 && result.length < limit; i--) {
            try {
                const entry = JSON.parse(lines[i]);
                if (actionFilter && entry.action !== actionFilter) continue;
                result.push(entry);
            } catch {}
        }
    } catch (err) {
        console.error('读取审计日志失败:', err.message);
    }
    return result;
}

module.exports = { logAudit, readAudit };
