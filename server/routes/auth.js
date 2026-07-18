const express = require('express');
const bcrypt = require('bcrypt');
const { query, queryOne, execute } = require('../db');
const { getDB } = require('../db');
const { logAudit } = require('../audit');

const router = express.Router();

// 登录失败速率限制：按 IP+用户名 维度，5 次失败后冷却 15 分钟
const loginAttempts = new Map(); // key: ip|username -> { count, firstTs, lockUntil }
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 分钟

function getClientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.trim()) {
        return fwd.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || 'unknown';
}

function checkLoginRate(ip, username) {
    const key = `${ip}|${username || ''}`;
    const now = Date.now();
    const entry = loginAttempts.get(key);
    if (entry && entry.lockUntil && now < entry.lockUntil) {
        const waitSec = Math.ceil((entry.lockUntil - now) / 1000);
        return { allowed: false, waitSec };
    }
    return { allowed: true };
}

function recordLoginFailure(ip, username) {
    const key = `${ip}|${username || ''}`;
    const now = Date.now();
    let entry = loginAttempts.get(key);
    if (!entry || (entry.firstTs && now - entry.firstTs > LOGIN_WINDOW_MS)) {
        entry = { count: 0, firstTs: now, lockUntil: 0 };
    }
    entry.count += 1;
    if (entry.count >= MAX_LOGIN_ATTEMPTS) {
        entry.lockUntil = now + LOGIN_WINDOW_MS;
    }
    loginAttempts.set(key, entry);
}

function clearLoginFailures(ip, username) {
    const key = `${ip}|${username || ''}`;
    loginAttempts.delete(key);
}

// 定期清理过期记录，避免内存泄漏
setInterval(() => {
    const now = Date.now();
    for (const [k, v] of loginAttempts.entries()) {
        if (v.lockUntil && now > v.lockUntil + LOGIN_WINDOW_MS) loginAttempts.delete(k);
        else if (!v.lockUntil && v.firstTs && now - v.firstTs > LOGIN_WINDOW_MS) loginAttempts.delete(k);
    }
}, 60 * 1000).unref();

// 密码强度校验：至少 8 位，且包含字母和数字
function isStrongPassword(pw) {
    if (!pw || typeof pw !== 'string') return false;
    if (pw.length < 8) return false;
    if (!/[A-Za-z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    return true;
}

async function isRegisterAllowed() {
    const setting = await queryOne("SELECT value FROM settings WHERE key = 'allow_register' AND user_id = 1");
    if (!setting) return true;
    try {
        return JSON.parse(setting.value) === true;
    } catch {
        return true;
    }
}

router.post('/register', async (req, res) => {
    try {
        const allowed = await isRegisterAllowed();
        if (!allowed) {
            return res.status(403).json({ error: '管理员已关闭注册功能' });
        }

        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
        if (username.length > 32) return res.status(400).json({ error: '用户名过长' });
        if (!isStrongPassword(password)) {
            return res.status(400).json({ error: '密码至少8位，且必须包含字母和数字' });
        }

        const existing = await queryOne('SELECT id FROM users WHERE username = ?', [username]);
        if (existing) return res.status(400).json({ error: '用户名已存在' });

        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = await execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
        const userId = result.lastID;

        await execute('INSERT INTO tabs (user_id, name) VALUES (?, ?)', [userId, '默认']);
        const tab = await queryOne('SELECT id FROM tabs WHERE user_id = ?', [userId]);
        if (tab) {
            const db = getDB();
            const defaultColumns = [
                { col_key: 'provider', col_name: '服务商', col_type: 'text', col_order: 0 },
                { col_key: 'months', col_name: '月数', col_type: 'number', col_order: 1 },
                { col_key: 'host_purchase', col_name: '主机购买时间', col_type: 'date', col_order: 2 },
                { col_key: 'host_expire', col_name: '主机到期时间', col_type: 'date', col_order: 3 },
                { col_key: 'host_remaining', col_name: '主机剩余天数', col_type: 'days_remaining', col_order: 4 },
                { col_key: 'ip_address', col_name: 'IP地址', col_type: 'text', col_order: 5 },
                { col_key: 'password', col_name: '密码', col_type: 'text', col_order: 6 },
                { col_key: 'domain', col_name: '域名', col_type: 'text', col_order: 7 },
                { col_key: 'remark', col_name: '备注', col_type: 'text', col_order: 8 },
                { col_key: 'address', col_name: '地址', col_type: 'address_select', col_options: JSON.stringify(['IP地址', '域名地址']), col_order: 9 },
                { col_key: 'expense', col_name: '支出', col_type: 'number', col_order: 10, is_income: 2 },
                { col_key: 'ip_info', col_name: 'IP信息', col_type: 'text', col_order: 11 },
                { col_key: 'client_purchase', col_name: '客户购买时间', col_type: 'date', col_order: 12 },
                { col_key: 'client_expire', col_name: '客户到期时间', col_type: 'date', col_order: 13 },
                { col_key: 'client_remaining', col_name: '客户剩余天数', col_type: 'days_remaining', col_order: 14 },
                { col_key: 'client_name', col_name: '客户名', col_type: 'text', col_order: 15 },
                { col_key: 'unit_price', col_name: '单价/备注', col_type: 'text', col_order: 16 },
                { col_key: 'fee', col_name: '收入', col_type: 'text', col_order: 17 },
                { col_key: 'is_expired', col_name: '是否过期', col_type: 'text', col_order: 18 }
            ];
            const stmt = db.prepare(`
                INSERT INTO column_defs
                (user_id, tab_id, col_key, col_name, col_type, col_options, col_order, is_system, col_width, col_visible, is_income)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            defaultColumns.forEach(col => {
                stmt.run([
                    userId, tab.id, col.col_key, col.col_name, col.col_type,
                    col.col_options || null, col.col_order || 0,
                    1, 150, 1, col.is_income || 0
                ]);
            });
            stmt.finalize();
        }
        logAudit(userId, 'register', username);
        res.json({ success: true, message: '注册成功' });
    } catch (err) {
        console.error('注册错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.get('/check-register', async (req, res) => {
    try {
        const allowed = await isRegisterAllowed();
        res.json({ allowed });
    } catch (err) {
        res.json({ allowed: false });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });

        const ip = getClientIp(req);
        const rate = checkLoginRate(ip, username);
        if (!rate.allowed) {
            logAudit(null, 'login_locked', `${username} from ${ip} (${rate.waitSec}s)`);
            return res.status(429).json({ error: `登录尝试过多，请 ${rate.waitSec} 秒后再试` });
        }

        const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
        // 用户名不存在和密码错误返回同样信息，避免枚举
        const invalidMsg = '用户名或密码错误';
        if (!user) {
            recordLoginFailure(ip, username);
            return res.status(401).json({ error: invalidMsg });
        }

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            recordLoginFailure(ip, username);
            logAudit(null, 'login_failed', `${username} from ${ip}`);
            return res.status(401).json({ error: invalidMsg });
        }

        // 登录成功：regenerate session 防 session fixation
        const origUser = { userId: user.id, username: user.username };
        req.session.regenerate((err) => {
            if (err) {
                console.error('session regenerate 失败:', err);
                return res.status(500).json({ error: '登录失败' });
            }
            req.session.userId = origUser.userId;
            req.session.username = origUser.username;
            clearLoginFailures(ip, username);
            logAudit(origUser.userId, 'login', `from ${ip}`);
            res.json({ success: true, user: { id: origUser.userId, username: origUser.username } });
        });
    } catch (err) {
        console.error('登录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.get('/check', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, user: { id: req.session.userId, username: req.session.username } });
    } else {
        res.json({ loggedIn: false });
    }
});

router.post('/logout', (req, res) => {
    const userId = req.session.userId;
    const username = req.session.username;
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: '退出失败' });
        // 清除客户端 cookie
        res.clearCookie('connect.sid');
        if (userId) logAudit(userId, 'logout', username || '');
        res.json({ success: true });
    });
});

router.post('/change-password', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: '未登录' });
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写完整' });
        if (!isStrongPassword(newPassword)) {
            return res.status(400).json({ error: '新密码至少8位，且必须包含字母和数字' });
        }

        const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.session.userId]);
        if (!user) return res.status(404).json({ error: '用户不存在' });

        const isValid = bcrypt.compareSync(oldPassword, user.password);
        if (!isValid) return res.status(401).json({ error: '原密码错误' });

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.session.userId]);
        logAudit(req.session.userId, 'change_password', '');
        res.json({ success: true, message: '密码修改成功' });
    } catch (err) {
        console.error('修改密码错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/change-username', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: '未登录' });
        const { password, newUsername } = req.body;
        if (!password || !newUsername) return res.status(400).json({ error: '请填写完整' });
        if (newUsername.length > 32) return res.status(400).json({ error: '用户名过长' });

        const user = await queryOne('SELECT * FROM users WHERE id = ?', [req.session.userId]);
        if (!user) return res.status(404).json({ error: '用户不存在' });

        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) return res.status(401).json({ error: '密码错误' });

        const existing = await queryOne('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, req.session.userId]);
        if (existing) return res.status(400).json({ error: '用户名已存在' });

        await execute('UPDATE users SET username = ? WHERE id = ?', [newUsername, req.session.userId]);
        req.session.username = newUsername;
        logAudit(req.session.userId, 'change_username', `${user.username} -> ${newUsername}`);
        res.json({ success: true, message: '用户名修改成功', username: newUsername });
    } catch (err) {
        console.error('修改用户名错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
