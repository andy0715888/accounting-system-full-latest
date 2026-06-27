const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

// Get all income records for a specific record
router.get('/by-record/:recordId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = parseInt(req.params.recordId);
        const records = await query(
            'SELECT * FROM income_records WHERE user_id = ? AND record_id = ? ORDER BY income_date DESC',
            [userId, recordId]
        );
        res.json(records);
    } catch (err) {
        console.error('获取收入记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Add income record
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { record_id, tab_id, amount, income_date, remark } = req.body;
        if (!record_id || !amount || !income_date) {
            return res.status(400).json({ error: '缺少必填字段' });
        }
        const result = await execute(
            'INSERT INTO income_records (user_id, record_id, tab_id, amount, income_date, remark) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, record_id, tab_id || 0, parseFloat(amount), income_date, remark || '']
        );
        res.json({ success: true, id: result.lastID });
    } catch (err) {
        console.error('添加收入记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Delete income record
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const id = parseInt(req.params.id);
        const existing = await queryOne('SELECT id FROM income_records WHERE id = ? AND user_id = ?', [id, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });
        await execute('DELETE FROM income_records WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('删除收入记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// Get all income records for a tab (for stats)
router.get('/by-tab/:tabId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tabId = parseInt(req.params.tabId);
        const records = await query(
            'SELECT * FROM income_records WHERE user_id = ? AND tab_id = ? ORDER BY income_date DESC',
            [userId, tabId]
        );
        res.json(records);
    } catch (err) {
        console.error('获取标签收入记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
