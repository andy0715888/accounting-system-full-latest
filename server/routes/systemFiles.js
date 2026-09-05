const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SYSTEM_FILES_DIR = path.join(__dirname, '../../system-uploads');

// ── 安全加固 1：登录校验 ──────────────────────────────────────────
// 原实现无任何认证，任意来访者都能 list/upload/download/delete 服务器文件，
// 存在任意文件读写与远程执行风险。统一要求已登录的合法用户。
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: '请先登录' });
    }
    next();
}

function ensureDir() {
    if (!fs.existsSync(SYSTEM_FILES_DIR)) {
        fs.mkdirSync(SYSTEM_FILES_DIR, { recursive: true });
    }
}

// ── 安全加固 2：路径白名单 ────────────────────────────────────────
// 原实现直接 path.join(SYSTEM_FILES_DIR, filename)，filename 含 ../ 可越出目录，
// 实现任意文件读取/删除/覆盖。这里强制规范化并校验目标必须在白名单目录内，
// 同时拒绝路径分隔符，确保文件名只能是目录里的一个普通文件。
function resolveSafePath(filename) {
    if (!filename || typeof filename !== 'string') return null;
    // 只允许取最末段文件名，杜绝 ../ 与子目录穿越
    const base = path.basename(filename);
    if (!base || base === '.' || base === '..') return null;
    const full = path.resolve(SYSTEM_FILES_DIR, base);
    if (!full.startsWith(path.resolve(SYSTEM_FILES_DIR) + path.sep)) return null;
    return full;
}

router.get('/list', requireAuth, (req, res) => {
    ensureDir();
    try {
        const files = fs.readdirSync(SYSTEM_FILES_DIR).map(name => {
            const fullPath = path.join(SYSTEM_FILES_DIR, name);
            const stat = fs.statSync(fullPath);
            return {
                name: name,
                size: stat.isFile() ? stat.size : 0,
                isDir: stat.isDirectory()
            };
        }).filter(f => !f.isDir);
        res.json({ files });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureDir();
        cb(null, SYSTEM_FILES_DIR);
    },
    filename: (req, file, cb) => {
        // 只用最末段文件名，安全化非法字符，杜绝 ../ 路径穿越
        const base = path.basename(file.originalname || 'file');
        const safe = base.replace(/[^a-zA-Z0-9._\u4e00-\u9fa5-]/g, '_');
        cb(null, safe || 'file');
    }
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/upload', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    res.json({ message: '上传成功', name: req.file.filename });
});

router.get('/download/:filename', requireAuth, (req, res) => {
    ensureDir();
    const filename = decodeURIComponent(req.params.filename);
    const filePath = resolveSafePath(filename);
    if (!filePath) return res.status(400).json({ error: '非法的文件名' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return res.status(400).json({ error: '不能下载目录' });
    res.sendFile(filePath);
});

router.delete('/:filename', requireAuth, (req, res) => {
    ensureDir();
    const filename = decodeURIComponent(req.params.filename);
    const filePath = resolveSafePath(filename);
    if (!filePath) return res.status(400).json({ error: '非法的文件名' });
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    try {
        fs.unlinkSync(filePath);
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
