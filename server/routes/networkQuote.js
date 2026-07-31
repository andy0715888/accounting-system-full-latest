const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

// ========== 网络报价标签 ==========

router.get('/tags', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tags = await query('SELECT * FROM network_quote_tags WHERE user_id = ? ORDER BY tag_order, created_at', [userId]);
        res.json(tags);
    } catch (err) {
        console.error('获取网络报价标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/tags', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: '标签名称不能为空' });

        const maxResult = await queryOne('SELECT MAX(tag_order) as max_order FROM network_quote_tags WHERE user_id = ?', [userId]);
        const nextOrder = (maxResult && maxResult.max_order !== null) ? maxResult.max_order + 1 : 0;

        const result = await execute(
            'INSERT INTO network_quote_tags (user_id, name, tag_order) VALUES (?, ?, ?)',
            [userId, name.trim(), nextOrder]
        );
        res.json({ success: true, id: result.lastID, name: name.trim() });
    } catch (err) {
        console.error('创建网络报价标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/tags/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.id;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: '标签名称不能为空' });

        const existing = await queryOne('SELECT id FROM network_quote_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!existing) return res.status(404).json({ error: '标签不存在' });

        await execute('UPDATE network_quote_tags SET name = ? WHERE id = ?', [name.trim(), tagId]);
        res.json({ success: true });
    } catch (err) {
        console.error('更新网络报价标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/tags/reorder', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tagIds } = req.body;
        if (!Array.isArray(tagIds)) return res.status(400).json({ error: '参数错误' });

        for (let i = 0; i < tagIds.length; i++) {
            await execute('UPDATE network_quote_tags SET tag_order = ? WHERE id = ? AND user_id = ?', [i, tagIds[i], userId]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('更新网络报价标签顺序错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/tags/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.id;

        const existing = await queryOne('SELECT id FROM network_quote_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!existing) return res.status(404).json({ error: '标签不存在' });

        await execute('DELETE FROM network_quote_data WHERE tag_id = ? AND user_id = ?', [tagId, userId]);
        await execute('DELETE FROM network_quote_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('删除网络报价标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 网络报价表格数据 ==========

router.get('/tags/:tagId/grid', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.tagId;

        const tag = await queryOne('SELECT id FROM network_quote_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!tag) return res.status(404).json({ error: '标签不存在' });

        const data = await queryOne('SELECT * FROM network_quote_data WHERE user_id = ? AND tag_id = ?', [userId, tagId]);
        if (data && data.grid_data) {
            try {
                res.json(JSON.parse(data.grid_data));
            } catch (e) {
                res.json({});
            }
        } else {
            res.json({});
        }
    } catch (err) {
        console.error('获取网络报价数据错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/tags/:tagId/grid', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.tagId;
        const gridData = req.body;

        const tag = await queryOne('SELECT id FROM network_quote_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!tag) return res.status(404).json({ error: '标签不存在' });

        const existing = await queryOne('SELECT id FROM network_quote_data WHERE user_id = ? AND tag_id = ?', [userId, tagId]);
        if (existing) {
            await execute(
                'UPDATE network_quote_data SET grid_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [JSON.stringify(gridData), existing.id]
            );
        } else {
            await execute(
                'INSERT INTO network_quote_data (user_id, tag_id, grid_data) VALUES (?, ?, ?)',
                [userId, tagId, JSON.stringify(gridData)]
            );
        }
        res.json({ success: true });
    } catch (err) {
        console.error('保存网络报价数据错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
