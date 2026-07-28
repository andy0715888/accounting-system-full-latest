const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SYSTEM_FILES_DIR = path.join(__dirname, '../../acct/accounting-system/system-uploads');

function ensureDir() {
    if (!fs.existsSync(SYSTEM_FILES_DIR)) {
        fs.mkdirSync(SYSTEM_FILES_DIR, { recursive: true });
    }
}

router.get('/list', (req, res) => {
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
        cb(null, file.originalname);
    }
});
const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: '未选择文件' });
    res.json({ message: '上传成功', name: req.file.originalname });
});

router.get('/download/:filename', (req, res) => {
    ensureDir();
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(SYSTEM_FILES_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return res.status(400).json({ error: '不能下载目录' });
    res.sendFile(filePath);
});

router.delete('/:filename', (req, res) => {
    ensureDir();
    const filename = decodeURIComponent(req.params.filename);
    const filePath = path.join(SYSTEM_FILES_DIR, filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: '文件不存在' });
    try {
        fs.unlinkSync(filePath);
        res.json({ message: '删除成功' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
