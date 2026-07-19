const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

router.get('/by-record/:recordId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = parseInt(req.params.recordId);
        const records = await query(
            'SELECT * FROM expense_records WHERE user_id = ? AND record_id = ? ORDER BY expense_date DESC',
            [userId, recordId]
        );
        res.json(records);
    } catch (err) {
        console.error('获取支出记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { record_id, tab_id, amount, expense_date, remark } = req.body;
        if (!record_id || !amount || !expense_date) {
            return res.status(400).json({ error: '缺少必填字段' });
        }
        const result = await execute(
            'INSERT INTO expense_records (user_id, record_id, tab_id, amount, expense_date, remark) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, record_id, tab_id || 0, parseFloat(amount), expense_date, remark || '']
        );
        res.json({ success: true, id: result.lastID });
    } catch (err) {
        console.error('添加支出记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = parseInt(req.params.id);
        const existing = await queryOne('SELECT id FROM expense_records WHERE id = ? AND user_id = ?', [id, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });
        await execute('DELETE FROM expense_records WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('删除支出记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = parseInt(req.params.id);
        const { amount, expense_date, remark } = req.body;
        const existing = await queryOne('SELECT id FROM expense_records WHERE id = ? AND user_id = ?', [id, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });

        const updates = [];
        const params = [];
        if (amount !== undefined) {
            const num = parseFloat(amount);
            if (isNaN(num) || num <= 0) return res.status(400).json({ error: '金额无效' });
            updates.push('amount = ?');
            params.push(num);
        }
        if (expense_date !== undefined) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(expense_date)) return res.status(400).json({ error: '日期格式无效' });
            updates.push('expense_date = ?');
            params.push(expense_date);
        }
        if (remark !== undefined) {
            updates.push('remark = ?');
            params.push(remark);
        }
        if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });
        params.push(id);
        await execute(`UPDATE expense_records SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ success: true });
    } catch (err) {
        console.error('更新支出记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.get('/by-tab/:tabId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tabId = parseInt(req.params.tabId);
        const records = await query(
            'SELECT * FROM expense_records WHERE user_id = ? AND tab_id = ? ORDER BY expense_date DESC',
            [userId, tabId]
        );
        res.json(records);
    } catch (err) {
        console.error('获取标签支出记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
