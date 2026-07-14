const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { Client } = require('ssh2');
const WebSocket = require('ws');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpProxyAgent } = require('http-proxy-agent');

const { initDatabase, queryOne } = require('./db');
const authRoutes = require('./routes/auth');
const recordRoutes = require('./routes/records');
const columnRoutes = require('./routes/columns');
const settingRoutes = require('./routes/settings');
const tabRoutes = require('./routes/tabs');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expense');
const conditionalFormatRoutes = require('./routes/conditionalFormats');
const hostRoutes = require('./routes/hosts');
const commandRoutes = require('./routes/commands');

const app = express();
const PORT = process.env.PORT || 3000;

const dirs = ['data', 'uploads', 'public/images'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public', {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));
// 托管上传目录，使背景图片等可被浏览器访问
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(session({
    secret: 'accounting-system-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
        if (types.includes(file.mimetype)) cb(null, true);
        else cb(new Error('只支持图片格式'));
    }
});

function requireUploadAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

app.post('/api/upload', requireUploadAuth, (req, res) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE' ? '图片不能超过 10MB' : err.message;
            return res.status(400).json({ error: message });
        }
        if (!req.file) return res.status(400).json({ error: '请上传图片' });
        res.json({ success: true, url: `/uploads/${req.file.filename}` });
    });
});

app.use('/api/upload', (req, res) => {
    res.status(405).json({ error: '上传接口只支持 POST 请求' });
});

initDatabase();

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/tabs', tabRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expense', expenseRoutes);
app.use('/api/conditional-formats', conditionalFormatRoutes);
app.use('/api/hosts', hostRoutes);
app.use('/api/commands', commandRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/main', (req, res) => res.sendFile(path.join(__dirname, '../public/main.html')));

async function startServer() {
    let certPath = null, keyPath = null;
    try {
        const certSetting = await queryOne("SELECT value FROM settings WHERE key = 'cert_path'");
        const keySetting = await queryOne("SELECT value FROM settings WHERE key = 'key_path'");
        if (certSetting) certPath = certSetting.value;
        if (keySetting) keyPath = keySetting.value;
    } catch (err) {}

    if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        try {
            const cert = fs.readFileSync(certPath);
            const key = fs.readFileSync(keyPath);
            const httpsServer = https.createServer({ cert, key }, app);
            httpsServer.listen(PORT, () => {
                console.log(`📊 网络管理系统已启动 (HTTPS) 端口 ${PORT}`);
            });
        } catch (err) {
            console.warn('HTTPS 启动失败，降级为 HTTP');
            startHttp();
        }
    } else {
        startHttp();
    }
}

function startHttp() {
    const server = http.createServer(app);
    const wss = new WebSocket.Server({ server, path: '/ssh' });

    wss.on('connection', (ws) => {
        let sshConn = null;
        let sshStream = null;
        let sftp = null;
        let idleTimer = null;
        let pingTimer = null;
        const IDLE_TIMEOUT = 10 * 60 * 1000;

        function resetIdleTimer() {
            if (idleTimer) clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'disconnected', data: '连接已超时（10分钟无操作自动断开）' }));
                }
                if (sshConn) { sshConn.end(); sshConn = null; sshStream = null; sftp = null; }
                if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
                try { ws.close(); } catch(e) {}
            }, IDLE_TIMEOUT);
        }

        pingTimer = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping();
            }
        }, 30000);

        resetIdleTimer();

        function sendSftpError(msg) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'sftp_error', data: msg }));
            }
        }

        function ensureSftp(callback) {
            if (sftp) {
                callback(null, sftp);
                return;
            }
            if (!sshConn) {
                callback(new Error('SSH未连接'));
                return;
            }
            sshConn.sftp((err, sftpConn) => {
                if (err) {
                    callback(err);
                    return;
                }
                sftp = sftpConn;
                callback(null, sftp);
            });
        }

        ws.on('message', async (data) => {
            resetIdleTimer();
            try {
                const msg = JSON.parse(data.toString());

                if (msg.type === 'connect') {
                    const { host, port, username, password, proxy } = msg;
                    if (!host || !username) {
                        ws.send(JSON.stringify({ type: 'error', data: '缺少连接参数' }));
                        return;
                    }

                    let agent = null;
                    if (proxy && proxy.type !== 'none' && proxy.host && proxy.port) {
                        try {
                            const proxyHost = proxy.host;
                            const proxyPort = parseInt(proxy.port);
                            if (proxy.type === 'socks') {
                                const proxyUrl = proxy.user && proxy.password
                                    ? `socks://${proxy.user}:${encodeURIComponent(proxy.password)}@${proxyHost}:${proxyPort}`
                                    : `socks://${proxyHost}:${proxyPort}`;
                                agent = new SocksProxyAgent(proxyUrl);
                            } else if (proxy.type === 'http') {
                                const proxyUrl = proxy.user && proxy.password
                                    ? `http://${proxy.user}:${encodeURIComponent(proxy.password)}@${proxyHost}:${proxyPort}`
                                    : `http://${proxyHost}:${proxyPort}`;
                                agent = new HttpProxyAgent(proxyUrl);
                            } else if (proxy.type === 'vless') {
                                ws.send(JSON.stringify({ type: 'error', data: 'VLESS代理暂不支持，请使用SOCKS5或HTTP代理' }));
                                return;
                            }
                        } catch (e) {
                            ws.send(JSON.stringify({ type: 'error', data: '代理配置错误: ' + e.message }));
                            return;
                        }
                    }

                    sshConn = new Client();

                    sshConn.on('ready', () => {
                        ws.send(JSON.stringify({ type: 'connected', data: 'SSH 连接成功' }));

                        sshConn.shell({ cols: 120, rows: 40 }, (err, stream) => {
                            if (err) {
                                ws.send(JSON.stringify({ type: 'error', data: '创建 Shell 失败: ' + err.message }));
                                sshConn.end();
                                return;
                            }
                            sshStream = stream;

                            stream.on('data', (chunk) => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf-8') }));
                                }
                            });

                            stream.on('close', () => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'disconnected', data: 'SSH 连接已关闭' }));
                                }
                            });

                            stream.stderr.on('data', (chunk) => {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'output', data: chunk.toString('utf-8') }));
                                }
                            });
                        });
                    });

                    sshConn.on('error', (err) => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'error', data: 'SSH 连接错误: ' + err.message }));
                        }
                    });

                    sshConn.on('end', () => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'disconnected', data: 'SSH 连接已断开' }));
                        }
                    });

                    const connectOpts = {
                        host,
                        port: port || 22,
                        username,
                        password: password || '',
                        readyTimeout: 15000,
                        strictVendor: false,
                        keepaliveInterval: 15000,
                        keepaliveCountMax: 3
                    };
                    if (agent) {
                        connectOpts.agent = agent;
                    }
                    sshConn.connect(connectOpts);
                } else if (msg.type === 'input') {
                    if (sshStream && sshConn) {
                        sshStream.write(msg.data);
                    }
                } else if (msg.type === 'resize') {
                    if (sshStream && sshConn) {
                        sshStream.setWindow(msg.rows || 40, msg.cols || 120, 0, 0);
                    }
                } else if (msg.type === 'disconnect') {
                    if (sshConn) {
                        sshConn.end();
                        sshConn = null;
                        sshStream = null;
                        sftp = null;
                    }
                } else if (msg.type === 'sftp_list') {
                    const path = msg.path || '.';
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        sftpConn.readdir(path, (err2, list) => {
                            if (err2) { sendSftpError('读取目录失败: ' + err2.message); return; }
                            const files = list.map(f => ({
                                name: f.filename,
                                isDir: f.longname.startsWith('d'),
                                size: f.attrs?.size || 0,
                                mtime: f.attrs?.mtime || 0
                            }));
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_list', data: { path, files } }));
                            }
                        });
                    });
                } else if (msg.type === 'sftp_read') {
                    const path = msg.path;
                    if (!path) { sendSftpError('文件路径不能为空'); return; }
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        sftpConn.readFile(path, 'utf-8', (err2, data) => {
                            if (err2) { sendSftpError('读取文件失败: ' + err2.message); return; }
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_read', data: { path, content: data.toString('utf-8') } }));
                            }
                        });
                    });
                } else if (msg.type === 'sftp_write') {
                    const { path, content } = msg;
                    if (!path) { sendSftpError('文件路径不能为空'); return; }
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        sftpConn.writeFile(path, content || '', 'utf-8', (err2) => {
                            if (err2) { sendSftpError('写入文件失败: ' + err2.message); return; }
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_write', data: { path, success: true } }));
                            }
                        });
                    });
                } else if (msg.type === 'sftp_upload') {
                    const { path, content } = msg;
                    if (!path) { sendSftpError('文件路径不能为空'); return; }
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        const buf = Buffer.from(content, 'base64');
                        sftpConn.writeFile(path, buf, (err2) => {
                            if (err2) { sendSftpError('上传文件失败: ' + err2.message); return; }
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_upload', data: { path, success: true } }));
                            }
                        });
                    });
                }
            } catch (err) {
                console.error('WebSocket 消息处理错误:', err);
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'error', data: '处理错误: ' + err.message }));
                }
            }
        });

        ws.on('close', () => {
            if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
            if (pingTimer) { clearInterval(pingTimer); pingTimer = null; }
            if (sshConn) {
                sshConn.end();
                sshConn = null;
                sshStream = null;
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket 错误:', err.message);
        });
    });

    server.listen(PORT, () => {
        console.log(`📊 网络管理系统已启动 (HTTP) 端口 ${PORT}`);
    });
}

startServer();
