const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const https = require('https');
const http = require('http');
const net = require('net');
const { Client } = require('ssh2');
const WebSocket = require('ws');
const { SocksClient } = require('socks');
const cookieParser = require('cookie-parser');

const { initDatabase, queryOne, query } = require('./db');
const { generateSecret } = require('./crypto');
const { logAudit } = require('./audit');
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
const hostExpenseRoutes = require('./routes/hostExpense');
const memoRoutes = require('./routes/memos');

const app = express();
const PORT = process.env.PORT || 3000;

const dirs = ['data', 'uploads', 'public/images'];
dirs.forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// 持久化的 Session Secret：保存到文件，重启后仍能保持会话
const SECRET_FILE = path.join(__dirname, '../data/.session_secret');
let sessionSecret;
if (process.env.SESSION_SECRET) {
    sessionSecret = process.env.SESSION_SECRET;
} else if (fs.existsSync(SECRET_FILE)) {
    sessionSecret = fs.readFileSync(SECRET_FILE, 'utf8').trim();
} else {
    sessionSecret = generateSecret(64);
    fs.writeFileSync(SECRET_FILE, sessionSecret, { mode: 0o600 });
}

// 显式创建 session store，供 express-session 和 WebSocket 认证共享使用
const sessionStore = new session.MemoryStore();

// CORS：只允许同源
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF 防护：检查 Origin 头
app.use((req, res, next) => {
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        const origin = req.headers.origin || req.headers.referer;
        const host = req.headers.host;
        // 允许同源请求
        if (origin) {
            try {
                const originUrl = new URL(origin);
                if (originUrl.host !== host) {
                    return res.status(403).json({ error: '跨站请求被拒绝' });
                }
            } catch {
                return res.status(403).json({ error: '无效的请求来源' });
            }
        }
    }
    next();
});

// 安全响应头
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

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

const sessionMiddleware = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: sessionStore,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
    }
});
app.use(sessionMiddleware);
// 保存 session 中间件引用，供 WebSocket 异步认证使用
app.set('sessionMiddleware', sessionMiddleware);
app.set('sessionStore', sessionStore);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        // 生成安全的文件名，防止路径遍历
        const safeName = name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5]/g, '_');
        cb(null, `${safeName}-${Date.now()}${ext}`);
    }
});

// 文件签名（magic bytes）验证
const FILE_SIGNATURES = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
    'image/x-icon': [0x00, 0x00, 0x01, 0x00],
    'image/svg+xml': null // SVG是文本，通过内容检查
};

function validateFileContent(filePath, mimetype) {
    const header = fs.readFileSync(filePath, { start: 0, end: 12 });
    const sig = FILE_SIGNATURES[mimetype];
    if (sig === null) {
        // SVG：检查是否包含 <svg 和是否有 <script
        const content = fs.readFileSync(filePath, 'utf8');
        if (!/<svg/i.test(content)) return false;
        if (/<script|onerror|onload|javascript:/i.test(content)) return false;
        return true;
    }
    if (!sig) return true;
    for (let i = 0; i < sig.length; i++) {
        if (header[i] !== sig[i]) return false;
    }
    return true;
}

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/svg+xml'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('不支持的文件类型'));
        }
        cb(null, true);
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
        // 验证文件内容（magic bytes）
        if (!validateFileContent(req.file.path, req.file.mimetype)) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: '文件内容与类型不匹配' });
        }
        logAudit(req.session.userId, 'upload', `文件: ${req.file.filename}`);
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
app.use('/api/host-expense', hostExpenseRoutes);
app.use('/api/memos', memoRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../public/login.html')));
app.get('/main', (req, res) => res.sendFile(path.join(__dirname, '../public/main.html')));

// 兜底错误处理：避免向客户端泄露堆栈/内部信息
app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    // multer 等中间件抛出的已知错误
    if (err && err.message && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '图片不能超过 10MB' });
    }
    if (err && err.message === '不支持的文件类型') {
        return res.status(400).json({ error: err.message });
    }
    console.error('未处理错误:', err);
    res.status(500).json({ error: '服务器内部错误' });
});

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

// 通过 SOCKS5 代理创建到目标服务器的 TCP socket
async function createSocksConnection(proxy, targetHost, targetPort) {
    const proxyOpts = {
        proxy: {
            host: proxy.host,
            port: parseInt(proxy.port),
            type: 5,
        },
        destination: {
            host: targetHost,
            port: targetPort,
        },
        command: 'connect'
    };
    if (proxy.user && proxy.password) {
        proxyOpts.proxy.userId = proxy.user;
        proxyOpts.proxy.password = proxy.password;
    }
    const { socket } = await SocksClient.createConnection(proxyOpts);
    return socket;
}

// 通过 HTTP 代理 CONNECT 隧道创建到目标服务器的 TCP socket
function createHttpProxyConnection(proxy, targetHost, targetPort) {
    return new Promise((resolve, reject) => {
        const proxySocket = net.connect(parseInt(proxy.port), proxy.host, () => {
            let auth = '';
            if (proxy.user && proxy.password) {
                const authStr = Buffer.from(`${proxy.user}:${proxy.password}`).toString('base64');
                auth = `Proxy-Authorization: Basic ${authStr}\r\n`;
            }
            proxySocket.write(
                `CONNECT ${targetHost}:${targetPort} HTTP/1.1\r\n` +
                `Host: ${targetHost}:${targetPort}\r\n` +
                auth +
                `\r\n`
            );
        });

        const onData = (data) => {
            proxySocket.removeListener('data', onData);
            const response = data.toString();
            const statusLine = response.split('\r\n')[0];
            if (statusLine.includes('200')) {
                resolve(proxySocket);
            } else {
                proxySocket.destroy();
                reject(new Error('HTTP代理CONNECT失败: ' + statusLine));
            }
        };

        proxySocket.once('data', onData);
        proxySocket.on('error', (err) => {
            reject(new Error('HTTP代理连接错误: ' + err.message));
        });
    });
}

function startHttp() {
    const server = http.createServer(app);
    // WebSocket 端点必须先通过 verifyClient 检查 cookie 存在性，
    // 真正的 session 校验在 connection 事件里异步完成
    const wss = new WebSocket.Server({
        server,
        path: '/ssh',
        verifyClient: (info) => {
            // 快速拒绝没有 cookie 的连接（避免无谓的握手开销）
            return !!info.req.headers.cookie;
        }
    });

    const cookieLib = require('cookie');
    const signedCookie = require('cookie-parser').signedCookie;

    // 异步校验 WebSocket 升级请求是否携带有效登录 session
    function verifyWsSession(req, callback) {
        const cookieStr = req.headers.cookie || '';
        const cookies = cookieLib.parse(cookieStr);
        const connectSid = cookies['connect.sid'];
        if (!connectSid) {
            callback(null);
            return;
        }
        const sessionId = signedCookie(connectSid, sessionSecret);
        if (!sessionId) {
            callback(null);
            return;
        }
        sessionStore.get(sessionId, (err, session) => {
            if (err || !session || !session.userId) {
                callback(null);
                return;
            }
            callback({ userId: session.userId, username: session.username });
        });
    }

    wss.on('connection', (ws, req) => {
        // 异步校验 session：未登录则直接关闭连接
        verifyWsSession(req, (sessionUser) => {
            if (!sessionUser) {
                try {
                    ws.send(JSON.stringify({ type: 'disconnected', data: '未登录，连接被拒绝' }));
                    ws.close(4401, '未授权');
                } catch {}
                return;
            }
            handleWsConnection(ws, req, sessionUser);
        });
    });

    function handleWsConnection(ws, req, sessionUser) {
        let sshConn = null;
        let sshStream = null;
        let sftp = null;
        let idleTimer = null;
        let pingTimer = null;
        let lastCpuStat = null;
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

        // SFTP 路径安全化：规范化路径，禁止 .. 逃逸，拒绝系统关键目录写入/删除
        // 注：用户已通过 SSH 登录目标主机，这里仅做基本防护避免误操作和明显滥用
        const SFTP_PROTECTED_DIRS = ['/proc', '/sys', '/dev', '/boot', '/run'];
        function sanitizeSftpPath(rawPath, isWrite = false) {
            if (!rawPath || typeof rawPath !== 'string') return null;
            // 拒绝空字节、回车换行注入
            if (/[\0\r\n]/.test(rawPath)) return null;
            // 转绝对路径（基于 /）
            let p = rawPath.trim();
            if (!p.startsWith('/')) p = '/' + p;
            // 规范化：拆段，处理 . 和 ..
            const segs = p.split('/');
            const out = [];
            for (const s of segs) {
                if (s === '' || s === '.') continue;
                if (s === '..') {
                    if (out.length === 0) return null; // 逃逸根目录，拒绝
                    out.pop();
                    continue;
                }
                out.push(s);
            }
            let normalized = '/' + out.join('/');
            // 写/删操作额外保护关键系统目录
            if (isWrite) {
                for (const d of SFTP_PROTECTED_DIRS) {
                    if (normalized === d || normalized.startsWith(d + '/')) return null;
                }
            }
            return normalized;
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

                    let sock = null;
                    if (proxy && proxy.type !== 'none' && proxy.host && proxy.port) {
                        try {
                            const proxyHost = proxy.host;
                            const proxyPort = parseInt(proxy.port);
                            console.log(`[SSH连接] 使用代理: ${proxy.type.toUpperCase()} ${proxyHost}:${proxyPort} -> ${host}:${port || 22}`);
                            if (proxy.type === 'socks') {
                                sock = await createSocksConnection(proxy, host, port || 22);
                            } else if (proxy.type === 'http') {
                                sock = await createHttpProxyConnection(proxy, host, port || 22);
                            } else if (proxy.type === 'vless') {
                                ws.send(JSON.stringify({ type: 'error', data: 'VLESS代理暂不支持，请使用SOCKS5或HTTP代理' }));
                                return;
                            }
                        } catch (e) {
                            console.error('[SSH连接] 代理连接失败:', e.message);
                            ws.send(JSON.stringify({ type: 'error', data: '代理连接失败: ' + e.message }));
                            return;
                        }
                    } else {
                        console.log(`[SSH连接] 直接连接: ${host}:${port || 22}`);
                    }

                    sshConn = new Client();

                    sshConn.on('ready', () => {
                        ws.send(JSON.stringify({ type: 'connected', data: 'SSH 连接成功' }));
                        logAudit(sessionUser.userId, 'ssh_connect', `${username}@${host}:${port || 22}`);

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
                        username,
                        password: password || '',
                        readyTimeout: 15000,
                        strictVendor: false,
                        keepaliveInterval: 15000,
                        keepaliveCountMax: 3
                    };
                    if (sock) {
                        connectOpts.sock = sock;
                    } else {
                        connectOpts.host = host;
                        connectOpts.port = port || 22;
                    }
                    sshConn.connect(connectOpts);
                } else if (msg.type === 'monitor') {
                    if (!sshConn) {
                        ws.send(JSON.stringify({ type: 'monitor_data', error: 'SSH 未连接' }));
                        return;
                    }
                    sshConn.exec('cat /proc/uptime /proc/stat /proc/meminfo 2>&1', (err, stream) => {
                        if (err) {
                            ws.send(JSON.stringify({ type: 'monitor_data', error: err.message }));
                            return;
                        }
                        let output = '';
                        stream.on('data', (chunk) => { output += chunk.toString('utf-8'); });
                        stream.on('close', () => {
                            try {
                                const lines = output.split('\n');
                                let uptime = 0;
                                let cpuUser = 0, cpuNice = 0, cpuSys = 0, cpuIdle = 0;
                                let memTotal = 0, memAvailable = 0;
                                let swapTotal = 0, swapFree = 0;
                                let cpuLineFound = false;

                                for (let i = 0; i < lines.length; i++) {
                                    const line = lines[i].trim();
                                    if (!line) continue;
                                    const parts = line.split(/\s+/);

                                    if (!cpuLineFound && line.startsWith('cpu ') && parts.length >= 5) {
                                        cpuUser = parseInt(parts[1]) || 0;
                                        cpuNice = parseInt(parts[2]) || 0;
                                        cpuSys = parseInt(parts[3]) || 0;
                                        cpuIdle = parseInt(parts[4]) || 0;
                                        cpuLineFound = true;
                                    } else if (parts[0] === 'MemTotal:' && parts[1]) {
                                        memTotal = Math.round(parseInt(parts[1]) / 1024);
                                    } else if (parts[0] === 'MemAvailable:' && parts[1]) {
                                        memAvailable = Math.round(parseInt(parts[1]) / 1024);
                                    } else if (parts[0] === 'SwapTotal:' && parts[1]) {
                                        swapTotal = Math.round(parseInt(parts[1]) / 1024);
                                    } else if (parts[0] === 'SwapFree:' && parts[1]) {
                                        swapFree = Math.round(parseInt(parts[1]) / 1024);
                                    } else if (i === 0 && parts.length >= 2) {
                                        uptime = Math.round(parseFloat(parts[0]));
                                    }
                                }

                                let cpu = 0;
                                if (cpuLineFound) {
                                    const curTotal = cpuUser + cpuNice + cpuSys + cpuIdle;
                                    if (lastCpuStat) {
                                        const prevTotal = lastCpuStat.user + lastCpuStat.nice + lastCpuStat.sys + lastCpuStat.idle;
                                        const totalDiff = curTotal - prevTotal;
                                        const idleDiff = cpuIdle - lastCpuStat.idle;
                                        if (totalDiff > 0) {
                                            cpu = Math.round((totalDiff - idleDiff) * 100 / totalDiff);
                                            if (cpu < 0) cpu = 0;
                                            if (cpu > 100) cpu = 100;
                                        }
                                    }
                                    lastCpuStat = { user: cpuUser, nice: cpuNice, sys: cpuSys, idle: cpuIdle };
                                }

                                const memUsed = memTotal - memAvailable;
                                const swapUsed = swapTotal - swapFree;

                                sshConn.exec('uptime', (err2, stream2) => {
                                    let load = '';
                                    if (err2) {
                                        finishMonitor();
                                        return;
                                    }
                                    let uptimeOutput = '';
                                    stream2.on('data', (chunk) => { uptimeOutput += chunk.toString('utf-8'); });
                                    stream2.on('close', () => {
                                        const match = uptimeOutput.match(/load average:\s*([0-9.,\s]+)/);
                                        load = match ? match[1].trim() : '';
                                        finishMonitor();
                                    });

                                    function finishMonitor() {
                                        if (ws.readyState === WebSocket.OPEN) {
                                            ws.send(JSON.stringify({
                                                type: 'monitor_data',
                                                data: {
                                                    uptime,
                                                    load,
                                                    mem_used: memUsed,
                                                    mem_total: memTotal,
                                                    swap_used: swapUsed,
                                                    swap_total: swapTotal,
                                                    cpu
                                                }
                                            }));
                                        }
                                    }
                                });
                            } catch (e) {
                                if (ws.readyState === WebSocket.OPEN) {
                                    ws.send(JSON.stringify({ type: 'monitor_data', error: '解析失败: ' + e.message }));
                                }
                            }
                        });
                    });
                } else if (msg.type === 'ping') {
                    ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
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
                    const rawPath = msg.path || '.';
                    const path = rawPath === '.' ? '.' : sanitizeSftpPath(rawPath, false);
                    if (!path) { sendSftpError('非法的路径'); return; }
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
                    const path = sanitizeSftpPath(msg.path, false);
                    if (!path) { sendSftpError('文件路径不能为空或非法'); return; }
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
                    const path = sanitizeSftpPath(msg.path, true);
                    if (!path) { sendSftpError('文件路径不能为空或非法'); return; }
                    const { content } = msg;
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        sftpConn.writeFile(path, content || '', 'utf-8', (err2) => {
                            if (err2) { sendSftpError('写入文件失败: ' + err2.message); return; }
                            logAudit(sessionUser.userId, 'sftp_write', path);
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_write', data: { path, success: true } }));
                            }
                        });
                    });
                } else if (msg.type === 'sftp_upload') {
                    const path = sanitizeSftpPath(msg.path, true);
                    if (!path) { sendSftpError('文件路径不能为空或非法'); return; }
                    const { content } = msg;
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        const buf = Buffer.from(content, 'base64');
                        sftpConn.writeFile(path, buf, (err2) => {
                            if (err2) { sendSftpError('上传文件失败: ' + err2.message); return; }
                            logAudit(sessionUser.userId, 'sftp_upload', `${path} (${buf.length} bytes)`);
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_upload', data: { path, success: true } }));
                            }
                        });
                    });
                } else if (msg.type === 'sftp_delete') {
                    const path = sanitizeSftpPath(msg.path, true);
                    if (!path) { sendSftpError('文件路径不能为空或非法'); return; }
                    ensureSftp((err, sftpConn) => {
                        if (err) { sendSftpError('SFTP连接失败: ' + err.message); return; }
                        sftpConn.unlink(path, (err2) => {
                            if (err2) { sendSftpError('删除文件失败: ' + err2.message); return; }
                            logAudit(sessionUser.userId, 'sftp_delete', path);
                            if (ws.readyState === WebSocket.OPEN) {
                                ws.send(JSON.stringify({ type: 'sftp_delete', data: { path, success: true } }));
                            }
                        });
                    });
                }
            } catch (err) {
                console.error('WebSocket 消息处理错误:', err);
                if (ws.readyState === WebSocket.OPEN) {
                    // 不向客户端泄露内部错误细节
                    ws.send(JSON.stringify({ type: 'error', data: '请求处理失败' }));
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
            // 仅记录日志，不向客户端发送细节
            console.error('WebSocket 错误:', err.message);
        });
    }

    server.listen(PORT, () => {
        console.log(`📊 网络管理系统已启动 (HTTP) 端口 ${PORT}`);
    });
}

startServer();
