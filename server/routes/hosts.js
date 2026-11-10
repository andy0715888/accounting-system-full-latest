const express = require('express');
const axios = require('axios');
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
            'SELECT id, name, host, port, username, remark, sort_order, created_at, last_connected, is_favorite, cloud_base_url, cloud_product_id, cloud_cookie, cloud_last_fetch FROM hosts WHERE user_id = ? ORDER BY last_connected IS NULL, last_connected DESC, sort_order, id',
            [userId]
        );
        // cookie 需要解密返回
        for (const h of hosts) {
            h.cloud_cookie = h.cloud_cookie ? decrypt(h.cloud_cookie) : null;
        }
        res.json(hosts);
    } catch (err) {
        console.error('获取主机列表错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let { name, host, port, username, password, remark, cloud_base_url, cloud_product_id, cloud_cookie } = req.body;
        if (!name) return res.status(400).json({ error: '请输入主机名称' });
        if (!host) return res.status(400).json({ error: '请输入主机地址' });
        if (!username) return res.status(400).json({ error: '请输入用户名' });

        // 新添加的服务器排到最前面：将已有服务器的 sort_order 都 +1
        await execute(
            'UPDATE hosts SET sort_order = sort_order + 1 WHERE user_id = ?',
            [userId]
        );
        const order = 0; // 新添加的始终是 sort_order 最小值（排在最前）

        const result = await execute(`
            INSERT INTO hosts (user_id, name, host, port, username, password, remark, sort_order, cloud_base_url, cloud_product_id, cloud_cookie)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, name, host, port || 22, username,
            encrypt(password || null), remark || null, order,
            cloud_base_url || null, cloud_product_id || null,
            cloud_cookie ? encrypt(cloud_cookie) : null
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
        if (req.body.cloud_base_url !== undefined) { updates.push('cloud_base_url = ?'); params.push(req.body.cloud_base_url || null); }
        if (req.body.cloud_product_id !== undefined) { updates.push('cloud_product_id = ?'); params.push(req.body.cloud_product_id || null); }
        if (req.body.cloud_cookie !== undefined) {
            updates.push('cloud_cookie = ?');
            params.push(req.body.cloud_cookie ? encrypt(req.body.cloud_cookie) : null);
        }
        // 更新云平台字段时刷新 cloud_last_fetch
        if (['cloud_base_url', 'cloud_product_id', 'cloud_cookie'].some(k => req.body[k] !== undefined)) {
            updates.push('cloud_last_fetch = NULL');
        }

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
            'SELECT id, name, host, port, username, remark, cloud_base_url, cloud_product_id, cloud_cookie, cloud_last_fetch FROM hosts WHERE user_id = ? AND host = ? ORDER BY id DESC LIMIT 1',
            [userId, ip]
        );
        if (host && host.cloud_cookie) host.cloud_cookie = decrypt(host.cloud_cookie);
        res.json(host || null);
    } catch (err) {
        console.error('按IP查找主机错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 按IP地址 upsert 主机（用于服务器信息提取/粘贴时复制端口/用户名）
router.post('/upsert-by-ip', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let { name, host, port, username, password, remark } = req.body || {};
        if (!host) return res.status(400).json({ error: '缺少 host(IP)' });
        const existing = await queryOne(
            'SELECT id FROM hosts WHERE user_id = ? AND host = ? ORDER BY id DESC LIMIT 1',
            [userId, host]
        );
        if (existing) {
            // 有就更新（仅当提供了相应字段）
            const updates = [];
            const params = [];
            if (name !== undefined) { updates.push('name = ?'); params.push(name || host); }
            if (port !== undefined) { updates.push('port = ?'); params.push(port || 22); }
            if (username !== undefined && username !== '') { updates.push('username = ?'); params.push(username); }
            if (remark !== undefined) { updates.push('remark = ?'); params.push(remark || null); }
            if (password !== undefined && password !== '') {
                updates.push('password = ?'); params.push(encrypt(password));
            }
            if (updates.length > 0) {
                await execute(`UPDATE hosts SET ${updates.join(', ')} WHERE id = ?`, [...params, existing.id]);
            }
            logAudit(userId, 'host_upsert_ip', `更新主机记录 IP=${host}`);
            res.json({ success: true, id: existing.id, action: 'update' });
        } else {
            // 没有就插入（用户名必填，否则跳过）
            if (!username) {
                res.json({ success: true, id: null, action: 'skip', reason: 'no username' });
                return;
            }
            const order = 0;
            try {
                await execute('UPDATE hosts SET sort_order = sort_order + 1 WHERE user_id = ?', [userId]);
            } catch(e) {}
            const result = await execute(`
                INSERT INTO hosts (user_id, name, host, port, username, password, remark, sort_order)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                userId, name || host, host, port || 22, username,
                encrypt(password || null), remark || null, order
            ]);
            logAudit(userId, 'host_upsert_ip', `创建主机记录 IP=${host}`);
            res.json({ success: true, id: result.lastID, action: 'insert' });
        }
    } catch (err) {
        console.error('按IP upsert 主机错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/:id/favorite', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hostId = req.params.id;
        const { is_favorite } = req.body;
        const existing = await queryOne('SELECT id, name FROM hosts WHERE id = ? AND user_id = ?', [hostId, userId]);
        if (!existing) return res.status(404).json({ error: '主机不存在' });
        await execute('UPDATE hosts SET is_favorite = ? WHERE id = ?', [is_favorite ? 1 : 0, hostId]);
        logAudit(userId, 'host_favorite', `${existing.name || ''}#${hostId} (${is_favorite ? '收藏' : '取消收藏'})`);
        res.json({ success: true });
    } catch (err) {
        console.error('更新主机收藏状态错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/:id/touch', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hostId = req.params.id;
        const existing = await queryOne('SELECT id FROM hosts WHERE id = ? AND user_id = ?', [hostId, userId]);
        if (!existing) return res.status(404).json({ error: '主机不存在' });
        await execute('UPDATE hosts SET last_connected = CURRENT_TIMESTAMP WHERE id = ?', [hostId]);
        res.json({ success: true });
    } catch (err) {
        console.error('更新主机连接时间错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 代理：获取云平台流量信息（烟火云/智简魔方等）
router.get('/:id/cloud-flow', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const hostId = req.params.id;
        const host = await queryOne(
            'SELECT id, name, cloud_base_url, cloud_product_id, cloud_cookie FROM hosts WHERE id = ? AND user_id = ?',
            [hostId, userId]
        );
        if (!host) return res.status(404).json({ error: '主机不存在' });

        const baseUrl = (host.cloud_base_url || '').replace(/\/$/, '');
        const productId = (host.cloud_product_id || '').trim();
        const cookie = host.cloud_cookie ? decrypt(host.cloud_cookie) : '';

        if (!baseUrl || !productId || !cookie) {
            return res.status(400).json({ error: '请先在主机编辑里填写云平台地址、产品ID和Cookie' });
        }

        // 先用 dedicatedserver 接口拿 bwusage/bwlimit
        const url = `${baseUrl}/host/dedicatedserver?host_id=${encodeURIComponent(productId)}&lite=1`;
        let data;
        try {
            const resp = await axios.get(url, {
                headers: {
                    'Cookie': cookie,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Referer': `${baseUrl}/servicedetail?id=${encodeURIComponent(productId)}`
                },
                timeout: 10000,
                maxRedirects: 3,
                validateStatus: () => true
            });

            const body = resp.data;
            if (!body || body.status !== 200) {
                // 可能是极验拦截（返回 html）
                if (typeof body === 'string' && body.includes('_guard')) {
                    return res.status(403).json({ error: '请求被云平台极验安全拦截，请先用相同IP的浏览器登录云平台过一次验证' });
                }
                return res.status(400).json({ error: '云平台返回异常：' + (body?.msg || body?.status || 'unknown') });
            }

            const hd = body.data?.host_data;
            if (!hd) {
                return res.status(400).json({ error: '云平台未返回服务器数据' });
            }

            // 解析流量
            const bwUsage = Number(hd.bwusage) || 0;      // GB
            const bwLimit = Number(hd.bwlimit) || 0;      // GB
            const remain = Math.max(0, bwLimit - bwUsage);
            const pct = bwLimit > 0 ? Math.round((bwUsage / bwLimit) * 100) : 0;
            const expireDate = hd.nextduedate ? new Date(hd.nextduedate * 1000).toISOString().slice(0, 10) : null;

            // 格式化
            const fmt = (gb) => {
                gb = Number(gb) || 0;
                return gb > 1024 ? (gb / 1024).toFixed(2) + ' TB' : gb.toFixed(1) + ' GB';
            };

            data = {
                success: true,
                instanceId: hd.domain || host.name,
                productName: hd.productname || '',
                ip: hd.dedicatedip || '',
                os: hd.os || '',
                type: hd.type || '',
                // 流量
                totalGB: bwLimit,
                usedGB: bwUsage,
                remainGB: remain,
                totalText: fmt(bwLimit),
                usedText: fmt(bwUsage),
                remainText: fmt(remain),
                percent: pct,
                // 到期
                expireDate,
                // 状态
                status: hd.domainstatus || '',
                suspendReason: hd.suspendreason || '',
                // 云平台原始数据（调试用）
                raw: { bwusage: hd.bwusage, bwlimit: hd.bwlimit, nextduedate: hd.nextduedate }
            };
        } catch (axiosErr) {
            return res.status(502).json({ error: '云平台请求失败: ' + (axiosErr.message || '网络异常') });
        }

        // 更新最近拉取时间
        await execute('UPDATE hosts SET cloud_last_fetch = CURRENT_TIMESTAMP WHERE id = ?', [hostId]);

        res.json(data);
    } catch (err) {
        console.error('获取云平台流量错误:', err);
        res.status(500).json({ error: '服务器错误: ' + err.message });
    }
});

module.exports = router;
