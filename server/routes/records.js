const express = require('express');
const { query, queryOne, execute, getDB } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tabId } = req.query;
        if (!tabId) return res.status(400).json({ error: '缺少 tabId' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSize = Math.min(1000, Math.max(1, parseInt(req.query.pageSize) || 50));

        const countResult = await queryOne(
            'SELECT COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?',
            [userId, tabId]
        );
        const total = countResult ? countResult.cnt : 0;
        const totalPages = Math.ceil(total / pageSize);
        const offset = (page - 1) * pageSize;

        const records = await query(
            'SELECT * FROM records WHERE user_id = ? AND tab_id = ? ORDER BY COALESCE(parent_id, id), CASE WHEN parent_id IS NULL THEN 0 ELSE 1 END, sort_order, created_at LIMIT ? OFFSET ?',
            [userId, tabId, pageSize, offset]
        );
        const parsed = records.map(r => {
            try { return { ...r, data: JSON.parse(r.data || '{}') }; }
            catch { return { ...r, data: {} }; }
        });

        // Also get income totals for each record on this page
        const recordIds = parsed.map(r => r.id);
        let incomeMap = {};
        if (recordIds.length > 0) {
            const placeholders = recordIds.map(() => '?').join(',');
            const incomeRows = await query(
                `SELECT record_id, SUM(amount) as total FROM income_records WHERE record_id IN (${placeholders}) GROUP BY record_id`,
                recordIds
            );
            incomeRows.forEach(row => { incomeMap[row.record_id] = row.total; });
        }

        // Also get expense totals for each record on this page
        let expenseMap = {};
        if (recordIds.length > 0) {
            const placeholders = recordIds.map(() => '?').join(',');
            const expenseRows = await query(
                `SELECT record_id, SUM(amount) as total FROM expense_records WHERE record_id IN (${placeholders}) GROUP BY record_id`,
                recordIds
            );
            expenseRows.forEach(row => { expenseMap[row.record_id] = row.total; });
        }

        parsed.forEach(r => {
            r._incomeTotal = incomeMap[r.id] || 0;
            r._expenseTotal = expenseMap[r.id] || 0;
        });

        res.json({ records: parsed, total, page, pageSize, totalPages });
    } catch (err) {
        console.error('获取记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tab_id, data, record_type, parent_id } = req.body;
        if (!tab_id) return res.status(400).json({ error: '缺少 tab_id' });
        if (!data || typeof data !== 'object') return res.status(400).json({ error: '数据格式错误' });

        const rType = record_type || 'server';
        const pParent = parent_id || null;

        // For client records, get next sort_order
        let sortOrder = 0;
        if (pParent) {
            const maxSort = await queryOne(
                'SELECT MAX(sort_order) as max_sort FROM records WHERE parent_id = ? AND user_id = ?',
                [pParent, userId]
            );
            sortOrder = (maxSort && maxSort.max_sort !== null) ? maxSort.max_sort + 1 : 0;
        }

        const result = await execute(
            'INSERT INTO records (user_id, tab_id, data, record_type, parent_id, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, tab_id, JSON.stringify(data), rType, pParent, sortOrder]
        );
        res.json({ success: true, id: result.lastID, record_type: rType, message: '添加成功' });
    } catch (err) {
        console.error('创建记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.get('/children/:parentId', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const parentId = parseInt(req.params.parentId);
        const records = await query(
            'SELECT * FROM records WHERE user_id = ? AND parent_id = ? ORDER BY sort_order, created_at',
            [userId, parentId]
        );
        const parsed = records.map(r => {
            try { return { ...r, data: JSON.parse(r.data || '{}') }; }
            catch { return { ...r, data: {} }; }
        });
        // income totals
        const recordIds = parsed.map(r => r.id);
        let incomeMap = {};
        if (recordIds.length > 0) {
            const placeholders = recordIds.map(() => '?').join(',');
            const incomeRows = await query(
                `SELECT record_id, SUM(amount) as total FROM income_records WHERE record_id IN (${placeholders}) GROUP BY record_id`,
                recordIds
            );
            incomeRows.forEach(row => { incomeMap[row.record_id] = row.total; });
        }
        parsed.forEach(r => { r._incomeTotal = incomeMap[r.id] || 0; });
        res.json(parsed);
    } catch (err) {
        console.error('获取子记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = req.params.id;
        const { data } = req.body;
        if (!data || typeof data !== 'object') return res.status(400).json({ error: '数据格式错误' });

        const existing = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });

        await execute(
            'UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(data), recordId]
        );
        res.json({ success: true, message: '更新成功' });
    } catch (err) {
        console.error('更新记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = req.params.id;
        const existing = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });

        await execute('DELETE FROM records WHERE id = ?', [recordId]);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/batch-delete', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: '请选择要删除的记录' });
        }

        const placeholders = ids.map(() => '?').join(',');
        await execute(
            `DELETE FROM records WHERE id IN (${placeholders}) AND user_id = ?`,
            [...ids, userId]
        );
        res.json({ success: true, message: `已删除 ${ids.length} 条记录` });
    } catch (err) {
        console.error('批量删除错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/import', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tab_id, records } = req.body;
        if (!tab_id) return res.status(400).json({ error: '缺少 tab_id' });
        if (!records || !Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: '请提供要导入的数据' });
        }

        const db = getDB();
        const stmt = db.prepare('INSERT INTO records (user_id, tab_id, data) VALUES (?, ?, ?)');
        let count = 0;
        for (const record of records) {
            stmt.run([userId, tab_id, JSON.stringify(record)]);
            count++;
        }
        stmt.finalize();

        res.json({ success: true, message: `成功导入 ${count} 条记录`, count });
    } catch (err) {
        console.error('导入错误:', err);
        res.status(500).json({ error: '导入失败' });
    }
});

module.exports = router;
