const express = require('express');
const { query, queryOne, execute } = require('../db');
const { encrypt, decrypt } = require('../crypto');
const { logAudit } = require('../audit');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hosts = await query(
            'SELECT id, name, host, port, username, remark, sort_order, created_at FROM hosts WHERE user_id = ? ORDER BY sort_order, id',
            [userId]
        );
        res.json(hosts);
    } catch (err) {
        console.error('获取主机列表错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let { name, host, port, username, password, remark } = req.body;
        if (!name) return res.status(400).json({ error: '请输入主机名称' });
        if (!host) return res.status(400).json({ error: '请输入主机地址' });
        if (!username) return res.status(400).json({ error: '请输入用户名' });

        const maxOrder = await queryOne(
            'SELECT MAX(sort_order) as max_order FROM hosts WHERE user_id = ?',
            [userId]
        );
        const order = (maxOrder?.max_order ?? -1) + 1;

        const result = await execute(`
            INSERT INTO hosts (user_id, name, host, port, username, password, remark, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, name, host, port || 22, username,
            encrypt(password || null), remark || null, order
        ]);

        logAudit(userId, 'host_create', `${name} (${host}:${port || 22})`);
        res.json({ success: true, id: result.lastID, message: '主机添加成功' });
    } catch (err) {
        console.error('添加主机错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hostId = req.params.id;
        const { name, host, port, username, password, remark, sort_order } = req.body;

        const existing = await queryOne('SELECT id, name FROM hosts WHERE id = ? AND user_id = ?', [hostId, userId]);
        if (!existing) return res.status(404).json({ error: '主机不存在' });

        const updates = [];
        const params = [];
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (host !== undefined) { updates.push('host = ?'); params.push(host); }
        if (port !== undefined) { updates.push('port = ?'); params.push(port || 22); }
        if (username !== undefined) { updates.push('username = ?'); params.push(username); }
        if (password !== undefined) { updates.push('password = ?'); params.push(encrypt(password || null)); }
        if (remark !== undefined) { updates.push('remark = ?'); params.push(remark || null); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

        if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });

        params.push(hostId);
        await execute(`UPDATE hosts SET ${updates.join(', ')} WHERE id = ?`, params);
        logAudit(userId, 'host_update', `${existing.name || ''}#${hostId}`);
        res.json({ success: true, message: '更新成功' });
    } catch (err) {
        console.error('更新主机错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hostId = req.params.id;
        const existing = await queryOne('SELECT id, name, host FROM hosts WHERE id = ? AND user_id = ?', [hostId, userId]);
        if (!existing) return res.status(404).json({ error: '主机不存在' });

        await execute('DELETE FROM hosts WHERE id = ?', [hostId]);
        logAudit(userId, 'host_delete', `${existing.name || ''} (${existing.host || ''})`);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除主机错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.get('/:id/password', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hostId = req.params.id;
        const host = await queryOne('SELECT name, password FROM hosts WHERE id = ? AND user_id = ?', [hostId, userId]);
        if (!host) return res.status(404).json({ error: '主机不存在' });
        logAudit(userId, 'host_password_view', `${host.name || ''}#${hostId}`);
        // decrypt 兼容旧的明文密码（无冒号分隔符则原样返回）
        res.json({ password: decrypt(host.password) || '' });
    } catch (err) {
        console.error('获取主机密码错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 通过IP地址查找主机（用于网络信息模块的IP信息弹窗）
router.get('/by-ip/:ip', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const ip = req.params.ip;
        const host = await queryOne(
            'SELECT id, name, host, port, username, remark FROM hosts WHERE user_id = ? AND host = ? ORDER BY id DESC LIMIT 1',
            [userId, ip]
        );
        res.json(host || null);
    } catch (err) {
        console.error('按IP查找主机错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
