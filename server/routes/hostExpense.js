const express = require('express');
const { query, queryOne, execute } = require('../db');
const { logAudit } = require('../audit');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

// 日期校验：YYYY-MM-DD
function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(s);
    return !isNaN(d);
}

// 列出某条 record 的全部明细，按日期升序
router.get('/by-record/:recordId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = parseInt(req.params.recordId);
        if (!recordId) return res.status(400).json({ error: '缺少 recordId' });
        const rec = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!rec) return res.status(404).json({ error: '记录不存在' });
        const rows = await query(
            'SELECT id, unit_price, expense_date, remark, created_at FROM host_expense_details WHERE record_id = ? ORDER BY expense_date ASC, id ASC',
            [recordId]
        );
        const total = rows.reduce((s, r) => s + (r.unit_price || 0), 0);
        res.json({ details: rows, total });
    } catch (err) {
        console.error('获取主机支出明细错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 新增一笔明细（点 +月数 或 手动添加时调用）
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { record_id, unit_price, expense_date, remark } = req.body;
        if (!record_id) return res.status(400).json({ error: '缺少 record_id' });
        const rec = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [record_id, userId]);
        if (!rec) return res.status(404).json({ error: '记录不存在' });
        const price = parseFloat(unit_price);
        if (isNaN(price) || price < 0) return res.status(400).json({ error: '单价无效' });
        let date = expense_date;
        if (!isValidDate(date)) {
            const d = new Date();
            date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
        const result = await execute(
            'INSERT INTO host_expense_details (user_id, record_id, unit_price, expense_date, remark) VALUES (?, ?, ?, ?, ?)',
            [userId, record_id, price, date, remark || '']
        );
        logAudit(userId, 'host_expense_add', `record=${record_id} price=${price} date=${date}`);
        res.json({ success: true, id: result.lastID, expense_date: date, unit_price: price, remark: remark || '' });
    } catch (err) {
        console.error('新增主机支出明细错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 修改明细（编辑日期、单价或备注）
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = parseInt(req.params.id);
        const { unit_price, expense_date, remark } = req.body;
        const existing = await queryOne('SELECT id, record_id FROM host_expense_details WHERE id = ? AND user_id = ?', [id, userId]);
        if (!existing) return res.status(404).json({ error: '明细不存在' });

        const updates = [];
        const params = [];
        if (unit_price !== undefined) {
            const price = parseFloat(unit_price);
            if (isNaN(price) || price < 0) return res.status(400).json({ error: '单价无效' });
            updates.push('unit_price = ?'); params.push(price);
        }
        if (expense_date !== undefined) {
            if (!isValidDate(expense_date)) return res.status(400).json({ error: '日期格式无效' });
            updates.push('expense_date = ?'); params.push(expense_date);
        }
        if (remark !== undefined) {
            updates.push('remark = ?'); params.push(remark);
        }
        if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
        params.push(id);
        await execute(`UPDATE host_expense_details SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ success: true });
    } catch (err) {
        console.error('修改主机支出明细错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 更新 record 配置（单价/附加/备注，用于弹窗顶部失焦自动保存）
router.put('/record-config/:recordId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = parseInt(req.params.recordId);
        const { unit_price, extra, remark } = req.body;
        const rec = await queryOne('SELECT id, data FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!rec) return res.status(404).json({ error: '记录不存在' });

        const data = JSON.parse(rec.data || '{}');
        if (unit_price !== undefined) data.unit_price = unit_price;
        if (extra !== undefined) data.extra = extra;
        if (remark !== undefined) data.remark = remark;
        await execute('UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [JSON.stringify(data), recordId, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('更新主机支出配置错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除指定明细
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = parseInt(req.params.id);
        const existing = await queryOne('SELECT id, record_id FROM host_expense_details WHERE id = ? AND user_id = ?', [id, userId]);
        if (!existing) return res.status(404).json({ error: '明细不存在' });
        await execute('DELETE FROM host_expense_details WHERE id = ?', [id]);
        logAudit(userId, 'host_expense_delete', `id=${id} record=${existing.record_id}`);
        res.json({ success: true });
    } catch (err) {
        console.error('删除主机支出明细错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除某 record 下日期最晚的一笔明细（点 -月数 时调用）
router.delete('/latest/:recordId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = parseInt(req.params.recordId);
        const rec = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!rec) return res.status(404).json({ error: '记录不存在' });
        const latest = await queryOne(
            'SELECT id FROM host_expense_details WHERE record_id = ? ORDER BY expense_date DESC, id DESC LIMIT 1',
            [recordId]
        );
        if (!latest) return res.status(404).json({ error: '没有可删除的明细' });
        await execute('DELETE FROM host_expense_details WHERE id = ?', [latest.id]);
        logAudit(userId, 'host_expense_delete_latest', `record=${recordId} id=${latest.id}`);
        res.json({ success: true, deletedId: latest.id });
    } catch (err) {
        console.error('删除最新主机支出明细错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 同步首笔明细日期到 host_purchase（改 host_purchase 时调用）
router.post('/sync-first-date/:recordId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = parseInt(req.params.recordId);
        const { expense_date } = req.body;
        if (!isValidDate(expense_date)) return res.status(400).json({ error: '日期格式无效' });
        const rec = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!rec) return res.status(404).json({ error: '记录不存在' });
        const first = await queryOne(
            'SELECT id FROM host_expense_details WHERE record_id = ? ORDER BY expense_date ASC, id ASC LIMIT 1',
            [recordId]
        );
        if (!first) return res.json({ success: true, message: '无明细可更新' });
        await execute('UPDATE host_expense_details SET expense_date = ? WHERE id = ?', [expense_date, first.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('同步首笔明细日期错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
