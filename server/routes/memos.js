const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

// ========== 备忘标签 ==========

router.get('/tags', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tags = await query('SELECT * FROM memo_tags WHERE user_id = ? ORDER BY tag_order, created_at', [userId]);
        res.json(tags);
    } catch (err) {
        console.error('获取备忘标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/tags', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: '标签名称不能为空' });

        const maxResult = await queryOne('SELECT MAX(tag_order) as max_order FROM memo_tags WHERE user_id = ?', [userId]);
        const nextOrder = (maxResult && maxResult.max_order !== null) ? maxResult.max_order + 1 : 0;

        const result = await execute(
            'INSERT INTO memo_tags (user_id, name, tag_order) VALUES (?, ?, ?)',
            [userId, name.trim(), nextOrder]
        );
        res.json({ success: true, id: result.lastID, name: name.trim() });
    } catch (err) {
        console.error('创建备忘标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/tags/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.id;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: '标签名称不能为空' });

        const existing = await queryOne('SELECT id FROM memo_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!existing) return res.status(404).json({ error: '标签不存在' });

        await execute('UPDATE memo_tags SET name = ? WHERE id = ?', [name.trim(), tagId]);
        res.json({ success: true });
    } catch (err) {
        console.error('更新备忘标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/tags/reorder', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tagIds } = req.body;
        if (!Array.isArray(tagIds)) return res.status(400).json({ error: '参数错误' });

        for (let i = 0; i < tagIds.length; i++) {
            await execute('UPDATE memo_tags SET tag_order = ? WHERE id = ? AND user_id = ?', [i, tagIds[i], userId]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('更新备忘标签顺序错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/tags/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.id;

        const existing = await queryOne('SELECT id FROM memo_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!existing) return res.status(404).json({ error: '标签不存在' });

        await execute('DELETE FROM memos WHERE tag_id = ? AND user_id = ?', [tagId, userId]);
        await execute('DELETE FROM memo_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('删除备忘标签错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// ========== 备忘记录 ==========

router.get('/tags/:tagId/items', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.tagId;

        const tag = await queryOne('SELECT id FROM memo_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!tag) return res.status(404).json({ error: '标签不存在' });

        const items = await query(
            'SELECT * FROM memos WHERE user_id = ? AND tag_id = ? ORDER BY memo_order, created_at DESC',
            [userId, tagId]
        );
        res.json(items);
    } catch (err) {
        console.error('获取备忘记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/tags/:tagId/items', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const tagId = req.params.tagId;
        const { title, content, is_visible } = req.body;

        const tag = await queryOne('SELECT id FROM memo_tags WHERE id = ? AND user_id = ?', [tagId, userId]);
        if (!tag) return res.status(404).json({ error: '标签不存在' });

        const maxResult = await queryOne('SELECT MAX(memo_order) as max_order FROM memos WHERE user_id = ? AND tag_id = ?', [userId, tagId]);
        const nextOrder = (maxResult && maxResult.max_order !== null) ? maxResult.max_order + 1 : 0;

        const result = await execute(
            'INSERT INTO memos (user_id, tag_id, title, content, is_visible, memo_order) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, tagId, title || '', content || '', is_visible !== undefined ? (is_visible ? 1 : 0) : 1, nextOrder]
        );
        const item = await queryOne('SELECT * FROM memos WHERE id = ?', [result.lastID]);
        res.json({ success: true, item });
    } catch (err) {
        console.error('创建备忘记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/items/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const itemId = req.params.id;
        const { title, content, is_visible } = req.body;

        const existing = await queryOne('SELECT id FROM memos WHERE id = ? AND user_id = ?', [itemId, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });

        const fields = [];
        const params = [];
        if (title !== undefined) { fields.push('title = ?'); params.push(title); }
        if (content !== undefined) { fields.push('content = ?'); params.push(content); }
        if (is_visible !== undefined) { fields.push('is_visible = ?'); params.push(is_visible ? 1 : 0); }
        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(itemId);

        await execute(`UPDATE memos SET ${fields.join(', ')} WHERE id = ?`, params);
        const item = await queryOne('SELECT * FROM memos WHERE id = ?', [itemId]);
        res.json({ success: true, item });
    } catch (err) {
        console.error('更新备忘记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/items/reorder', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { itemIds } = req.body;
        if (!Array.isArray(itemIds)) return res.status(400).json({ error: '参数错误' });

        for (let i = 0; i < itemIds.length; i++) {
            await execute('UPDATE memos SET memo_order = ? WHERE id = ? AND user_id = ?', [i, itemIds[i], userId]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error('更新备忘记录顺序错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/items/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const itemId = req.params.id;

        const existing = await queryOne('SELECT id FROM memos WHERE id = ? AND user_id = ?', [itemId, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });

        await execute('DELETE FROM memos WHERE id = ? AND user_id = ?', [itemId, userId]);
        res.json({ success: true });
    } catch (err) {
        console.error('删除备忘记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
