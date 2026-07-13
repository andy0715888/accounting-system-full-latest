const express = require('express');
const { query, queryOne, execute } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

router.get('/folders', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const folders = await query(
            'SELECT * FROM command_folders WHERE user_id = ? ORDER BY sort_order, id',
            [userId]
        );
        for (const folder of folders) {
            folder.commands = await query(
                'SELECT * FROM saved_commands WHERE user_id = ? AND folder_id = ? ORDER BY sort_order, id',
                [userId, folder.id]
            );
        }
        res.json(folders);
    } catch (err) {
        console.error('获取命令文件夹错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/folders', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let { name } = req.body;
        if (!name) return res.status(400).json({ error: '请输入文件夹名称' });

        const maxOrder = await queryOne(
            'SELECT MAX(sort_order) as max_order FROM command_folders WHERE user_id = ?',
            [userId]
        );
        const order = (maxOrder?.max_order ?? -1) + 1;

        const result = await execute(
            'INSERT INTO command_folders (user_id, name, sort_order) VALUES (?, ?, ?)',
            [userId, name, order]
        );

        res.json({ success: true, id: result.lastID, message: '文件夹创建成功' });
    } catch (err) {
        console.error('创建文件夹错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/folders/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const folderId = req.params.id;
        const { name, sort_order } = req.body;

        const existing = await queryOne('SELECT id FROM command_folders WHERE id = ? AND user_id = ?', [folderId, userId]);
        if (!existing) return res.status(404).json({ error: '文件夹不存在' });

        const updates = [];
        const params = [];
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

        if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });

        params.push(folderId);
        await execute(`UPDATE command_folders SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ success: true, message: '更新成功' });
    } catch (err) {
        console.error('更新文件夹错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/folders/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const folderId = req.params.id;
        const existing = await queryOne('SELECT id FROM command_folders WHERE id = ? AND user_id = ?', [folderId, userId]);
        if (!existing) return res.status(404).json({ error: '文件夹不存在' });

        await execute('DELETE FROM saved_commands WHERE folder_id = ? AND user_id = ?', [folderId, userId]);
        await execute('DELETE FROM command_folders WHERE id = ? AND user_id = ?', [folderId, userId]);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除文件夹错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/folders/:id/move', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const folderId = parseInt(req.params.id);
        const { direction } = req.body;
        if (!direction || !['up', 'down'].includes(direction)) {
            return res.status(400).json({ error: '无效的移动方向' });
        }

        const folders = await query(
            'SELECT id, sort_order FROM command_folders WHERE user_id = ? ORDER BY sort_order, id',
            [userId]
        );
        const idx = folders.findIndex(f => f.id === folderId);
        if (idx < 0) return res.status(404).json({ error: '文件夹不存在' });

        let targetIdx;
        if (direction === 'up') {
            if (idx === 0) return res.json({ success: true, message: '已经在最顶部' });
            targetIdx = idx - 1;
        } else {
            if (idx === folders.length - 1) return res.json({ success: true, message: '已经在最底部' });
            targetIdx = idx + 1;
        }

        const current = folders[idx];
        const target = folders[targetIdx];

        await execute('UPDATE command_folders SET sort_order = ? WHERE id = ?', [target.sort_order, current.id]);
        await execute('UPDATE command_folders SET sort_order = ? WHERE id = ?', [current.sort_order, target.id]);

        res.json({ success: true, message: '排序已更新' });
    } catch (err) {
        console.error('移动文件夹错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.get('/commands', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { folder_id } = req.query;
        let commands;
        if (folder_id) {
            commands = await query(
                'SELECT * FROM saved_commands WHERE user_id = ? AND folder_id = ? ORDER BY sort_order, id',
                [userId, folder_id]
            );
        } else {
            commands = await query(
                'SELECT * FROM saved_commands WHERE user_id = ? ORDER BY sort_order, id',
                [userId]
            );
        }
        res.json(commands);
    } catch (err) {
        console.error('获取保存命令错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.post('/commands', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        let { folder_id, name, command, remark } = req.body;
        if (!name) return res.status(400).json({ error: '请输入命令名称' });
        if (!command) return res.status(400).json({ error: '请输入命令内容' });

        const maxOrder = await queryOne(
            'SELECT MAX(sort_order) as max_order FROM saved_commands WHERE user_id = ? AND (folder_id = ? OR (folder_id IS NULL AND ? IS NULL))',
            [userId, folder_id || null, folder_id || null]
        );
        const order = (maxOrder?.max_order ?? -1) + 1;

        const result = await execute(
            'INSERT INTO saved_commands (user_id, folder_id, name, command, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, folder_id || null, name, command, remark || null, order]
        );

        res.json({ success: true, id: result.lastID, message: '命令保存成功' });
    } catch (err) {
        console.error('保存命令错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/commands/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const cmdId = req.params.id;
        const { folder_id, name, command, remark, sort_order } = req.body;

        const existing = await queryOne('SELECT id FROM saved_commands WHERE id = ? AND user_id = ?', [cmdId, userId]);
        if (!existing) return res.status(404).json({ error: '命令不存在' });

        const updates = [];
        const params = [];
        if (folder_id !== undefined) { updates.push('folder_id = ?'); params.push(folder_id || null); }
        if (name !== undefined) { updates.push('name = ?'); params.push(name); }
        if (command !== undefined) { updates.push('command = ?'); params.push(command); }
        if (remark !== undefined) { updates.push('remark = ?'); params.push(remark || null); }
        if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

        if (updates.length === 0) return res.status(400).json({ error: '没有要更新的字段' });

        params.push(cmdId);
        await execute(`UPDATE saved_commands SET ${updates.join(', ')} WHERE id = ?`, params);
        res.json({ success: true, message: '更新成功' });
    } catch (err) {
        console.error('更新命令错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.delete('/commands/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const cmdId = req.params.id;
        const existing = await queryOne('SELECT id FROM saved_commands WHERE id = ? AND user_id = ?', [cmdId, userId]);
        if (!existing) return res.status(404).json({ error: '命令不存在' });

        await execute('DELETE FROM saved_commands WHERE id = ? AND user_id = ?', [cmdId, userId]);
        res.json({ success: true, message: '删除成功' });
    } catch (err) {
        console.error('删除命令错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

module.exports = router;
