const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

const VALID_CONDITION_TYPES = ['contains', 'equals', 'not_equals', 'greater_than', 'less_than', 'starts_with', 'ends_with'];

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tabId } = req.query;
        if (!tabId) return res.status(400).json({ error: '缺少 tabId' });

        const formats = await query(
            'SELECT * FROM conditional_formats WHERE user_id = ? AND tab_id = ? ORDER BY sort_order, id',
            [userId, tabId]
        );
        res.json(formats);
    } catch (err) {
        console.error('获取条件格式错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let { tab_id, col_key, condition_type, condition_value, text_color, is_bold } = req.body;
        if (!tab_id) return res.status(400).json({ error: '缺少 tab_id' });
        if (!col_key) return res.status(400).json({ error: '缺少列' });
        if (!condition_type) return res.status(400).json({ error: '缺少条件类型' });
        if (!VALID_CONDITION_TYPES.includes(condition_type)) return res.status(400).json({ error: '条件类型无效' });
        if (condition_value === undefined || condition_value === null || condition_value === '') {
            return res.status(400).json({ error: '缺少条件值' });
        }

        const maxOrder = await queryOne(
            'SELECT MAX(sort_order) as max_order FROM conditional_formats WHERE user_id = ? AND tab_id = ?',
            [userId, tab_id]
        );
        const order = (maxOrder?.max_order ?? -1) + 1;

        const result = await execute(`
            INSERT INTO conditional_formats
            (user_id, tab_id, col_key, condition_type, condition_value, text_color, is_bold, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userId, tab_id, col_key, condition_type, condition_value,
            text_color || null,
            is_bold ? 1 : 0,
            order
        ]);

        res.json({ success: true, id: result.lastID, message: '条件格式添加成功' });
    } catch (err) {
        console.error('创建条件格式错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const formatId = req.params.id;
        const { col_key, condition_type, condition_value, text_color, is_bold, sort_order } = req.body;

        const existing = await queryOne('SELECT id FROM conditional_formats WHERE id = ? AND user_id = ?', [formatId, userId]);
        if (!existing) return res.status(404).json({ error: '条件格式不存在' });

        const updates = [];
        const params = [];
        if (col_key !== undefined) { updates.push('col_key = ?'); params.push(col_key); }
        if (condition_type !== undefined) {
            if (!VALID_CONDITION_TYPES.includes(condition_type)) return res.status(400).json({ error: '条件类型无效' });
            updates.push('condition_type = ?'); params.push(condition_type);
        }
        if (condition_value !== undefined) { updates.push('condition_value = ?'); params.push(condition_value); }
        if (text_color !== undefined) { updates.push('text_color = ?'); params.push(text_color || null); }
        if (is_bold !== undefined) { updates.push('is_bold = ?'); params.push(is_bold ? 1 : 0); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

        if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });

        params.push(formatId);
        await execute(`UPDATE conditional_formats SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ success: true, message: '更新成功' });
    } catch (err) {
        console.error('更新条件格式错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const formatId = req.params.id;
        const existing = await queryOne('SELECT id FROM conditional_formats WHERE id = ? AND user_id = ?', [formatId, userId]);
        if (!existing) return res.status(404).json({ error: '条件格式不存在' });

        await execute('DELETE FROM conditional_formats WHERE id = ?', [formatId]);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除条件格式错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
