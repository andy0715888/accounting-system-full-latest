/**
 * 生成参考数据库 sample_reference.db
 * 包含所有表的完整结构 + 各种场景的示例数据，供其他 AI 参考，
 * 用于把 Excel 数据转换成符合本系统结构的 SQLite 数据库。
 *
 * 运行: node scripts/generate-sample-db.js
 * 输出: data/sample_reference.db
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const OUT_PATH = path.join(__dirname, '../data/sample_reference.db');

// 如已存在先删除，保证干净生成
if (fs.existsSync(OUT_PATH)) fs.unlinkSync(OUT_PATH);

const db = new sqlite3.Database(OUT_PATH);

// 工具：把 SQL 串行执行
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}
function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
    });
}

// ============================================================
// 1. 建表（与 server/db.js 完全一致）
// ============================================================
const SCHEMA = `
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tabs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    tab_type TEXT DEFAULT 'dedicated',
    tab_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE column_defs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tab_id INTEGER NOT NULL,
    col_key TEXT NOT NULL,
    col_name TEXT NOT NULL,
    col_type TEXT DEFAULT 'text',
    col_options TEXT,
    col_width INTEGER DEFAULT 150,
    col_visible INTEGER DEFAULT 1,
    col_order INTEGER DEFAULT 0,
    is_system INTEGER DEFAULT 0,
    is_income INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tab_id) REFERENCES tabs(id),
    UNIQUE(user_id, tab_id, col_key)
);

CREATE TABLE records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tab_id INTEGER NOT NULL,
    data TEXT NOT NULL,
    record_type TEXT DEFAULT 'server',
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tab_id) REFERENCES tabs(id),
    FOREIGN KEY (parent_id) REFERENCES records(id) ON DELETE CASCADE
);

CREATE TABLE settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, key)
);

CREATE TABLE income_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    record_id INTEGER NOT NULL,
    tab_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    income_date DATE NOT NULL,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (tab_id) REFERENCES tabs(id)
);

CREATE TABLE expense_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    record_id INTEGER NOT NULL,
    tab_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    expense_date DATE NOT NULL,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE,
    FOREIGN KEY (tab_id) REFERENCES tabs(id)
);

CREATE TABLE conditional_formats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    tab_id INTEGER NOT NULL,
    col_key TEXT NOT NULL,
    condition_type TEXT NOT NULL,
    condition_value TEXT NOT NULL,
    text_color TEXT,
    is_bold INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tab_id) REFERENCES tabs(id)
);

CREATE TABLE hosts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 22,
    username TEXT NOT NULL,
    password TEXT,
    remark TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE command_folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE saved_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    folder_id INTEGER,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    remark TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (folder_id) REFERENCES command_folders(id) ON DELETE CASCADE
);

CREATE TABLE host_expense_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    record_id INTEGER NOT NULL,
    unit_price REAL NOT NULL DEFAULT 0,
    expense_date DATE NOT NULL,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
);
CREATE INDEX idx_host_expense_record ON host_expense_details(record_id);
`;

// ============================================================
// 2. 默认列定义（与 db.js 的 createDefaultColumnsForTab 一致）
// ============================================================
function getDefaultColumns(tabType) {
    if (tabType === 'simple') {
        return [
            { col_key: 'remark', col_name: '备注', col_type: 'text', col_order: 0 },
            { col_key: 'expense', col_name: '支出', col_type: 'text', col_order: 1, is_income: 2 },
            { col_key: 'fee', col_name: '收入', col_type: 'text', col_order: 2, is_income: 1 }
        ];
    }
    // dedicated 和 shared 默认列相同
    return [
        { col_key: 'provider', col_name: '服务商', col_type: 'text', col_order: 0 },
        { col_key: 'months', col_name: '月数', col_type: 'number', col_order: 1 },
        { col_key: 'host_purchase', col_name: '主机购买时间', col_type: 'date', col_order: 2 },
        { col_key: 'host_expire', col_name: '主机到期时间', col_type: 'date', col_order: 3 },
        { col_key: 'host_remaining', col_name: '主机剩余天数', col_type: 'days_remaining', col_order: 4 },
        { col_key: 'ip_address', col_name: 'IP地址', col_type: 'text', col_order: 5 },
        { col_key: 'password', col_name: '密码', col_type: 'text', col_order: 6 },
        { col_key: 'domain', col_name: '域名', col_type: 'text', col_order: 7 },
        { col_key: 'remark', col_name: '备注', col_type: 'text', col_order: 8 },
        { col_key: 'address', col_name: '地址', col_type: 'address_select', col_options: JSON.stringify(['IP地址', '域名地址']), col_order: 9 },
        { col_key: 'expense', col_name: '支出', col_type: 'number', col_order: 10, is_income: 2 },
        { col_key: 'ip_info', col_name: 'IP信息', col_type: 'text', col_order: 11 },
        { col_key: 'client_purchase', col_name: '客户购买时间', col_type: 'date', col_order: 12 },
        { col_key: 'client_expire', col_name: '客户到期时间', col_type: 'date', col_order: 13 },
        { col_key: 'client_remaining', col_name: '客户剩余天数', col_type: 'days_remaining', col_order: 14 },
        { col_key: 'client_name', col_name: '客户名', col_type: 'text', col_order: 15 },
        { col_key: 'unit_price', col_name: '单价/备注', col_type: 'text', col_order: 16 },
        { col_key: 'fee', col_name: '收入', col_type: 'text', col_order: 17, is_income: 1 },
        { col_key: 'is_expired', col_name: '是否过期', col_type: 'text', col_order: 18 }
    ];
}

// ============================================================
// 3. 插入示例数据
// ============================================================
async function insertDefaultColumns(userId, tabId, tabType) {
    const cols = getDefaultColumns(tabType);
    for (const col of cols) {
        await run(
            `INSERT INTO column_defs
             (user_id, tab_id, col_key, col_name, col_type, col_options, col_order, is_system, col_width, col_visible, is_income)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, tabId, col.col_key, col.col_name, col.col_type,
             col.col_options || null, col.col_order || 0,
             1, 150, 1, col.is_income || 0]
        );
    }
}

// 插入一条 record，返回其 id
async function insertRecord(userId, tabId, data, recordType = 'server', sortOrder = 0) {
    const r = await run(
        `INSERT INTO records (user_id, tab_id, data, record_type, sort_order) VALUES (?, ?, ?, ?, ?)`,
        [userId, tabId, JSON.stringify(data), recordType, sortOrder]
    );
    return r.lastID;
}

// 插入收入记录
async function insertIncome(userId, recordId, tabId, amount, date, remark) {
    return run(
        `INSERT INTO income_records (user_id, record_id, tab_id, amount, income_date, remark) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, recordId, tabId, amount, date, remark || '']
    );
}

// 插入普通支出记录
async function insertExpense(userId, recordId, tabId, amount, date, remark) {
    return run(
        `INSERT INTO expense_records (user_id, record_id, tab_id, amount, expense_date, remark) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, recordId, tabId, amount, date, remark || '']
    );
}

// 插入主机支出明细
async function insertHostExpenseDetail(userId, recordId, unitPrice, date, remark) {
    return run(
        `INSERT INTO host_expense_details (user_id, record_id, unit_price, expense_date, remark) VALUES (?, ?, ?, ?, ?)`,
        [userId, recordId, unitPrice, date, remark || '']
    );
}

async function main() {
    console.log('开始生成参考数据库:', OUT_PATH);

    // 建表
    await new Promise((resolve, reject) => {
        db.exec(SCHEMA, err => err ? reject(err) : resolve());
    });
    console.log('✅ 所有表已创建');

    // ---- 用户 ----
    const hashedPwd = bcrypt.hashSync('admin123', 10);
    const userRes = await run(
        `INSERT INTO users (username, password) VALUES (?, ?)`,
        ['admin', hashedPwd]
    );
    const userId = userRes.lastID;
    console.log('✅ 用户已创建: admin / admin123 (id=' + userId + ')');

    // ---- 设置 ----
    await run(`INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)`,
        [userId, 'allow_register', 'false']);
    await run(`INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)`,
        [userId, 'theme', 'light']);

    // ---- 三个标签页：独享 / 共享 / 简单 ----
    const tabDedicated = await run(
        `INSERT INTO tabs (user_id, name, tab_type, tab_order) VALUES (?, ?, ?, ?)`,
        [userId, '独享服务器', 'dedicated', 0]
    );
    const tabShared = await run(
        `INSERT INTO tabs (user_id, name, tab_type, tab_order) VALUES (?, ?, ?, ?)`,
        [userId, '共享服务器', 'shared', 1]
    );
    const tabSimple = await run(
        `INSERT INTO tabs (user_id, name, tab_type, tab_order) VALUES (?, ?, ?, ?)`,
        [userId, '简单记账', 'simple', 2]
    );
    const dedicatedId = tabDedicated.lastID;
    const sharedId = tabShared.lastID;
    const simpleId = tabSimple.lastID;
    await insertDefaultColumns(userId, dedicatedId, 'dedicated');
    await insertDefaultColumns(userId, sharedId, 'shared');
    await insertDefaultColumns(userId, simpleId, 'simple');
    console.log('✅ 3 个标签页及默认列已创建');

    // ============================================================
    // 独享服务器示例记录（dedicated）
    // expense 字段格式说明:
    //   =80          → 单价 80，附加 0
    //   =80+(10)     → 单价 80，附加 +10
    //   =80+(-10)    → 单价 80，附加 -10
    // fee 字段同理，也是 =表达式 形式
    // ============================================================

    // 记录1：阿里云主机，3个月，含主机支出明细 + 收入
    const r1Data = {
        provider: '阿里云',
        months: 3,
        host_purchase: '2025-01-15',
        host_expire: '2025-04-15',
        host_remaining: '',
        ip_address: '47.96.123.45',
        password: 'Aliyun@2025',
        domain: 'ali.example.com',
        remark: '客户A的独享主机',
        address: 'IP地址',
        expense: '=80+(10)',          // 单价80 + 附加10
        ip_info: '阿里云杭州',
        client_purchase: '2025-01-15',
        client_expire: '2025-04-15',
        client_remaining: '',
        client_name: '客户A',
        unit_price: '80元/月 首月优惠',
        fee: '=300',                  // 收入 300
        is_expired: '有效'
    };
    const r1Id = await insertRecord(userId, dedicatedId, r1Data, 'server', 0);
    // 主机支出明细：每月一笔
    await insertHostExpenseDetail(userId, r1Id, 80, '2025-01-15', '首月');
    await insertHostExpenseDetail(userId, r1Id, 80, '2025-02-15', '第二月');
    await insertHostExpenseDetail(userId, r1Id, 80, '2025-03-15', '第三月');
    // 收入记录
    await insertIncome(userId, r1Id, dedicatedId, 300, '2025-01-15', '客户A 首付');
    await insertIncome(userId, r1Id, dedicatedId, 300, '2025-02-15', '客户A 二月');

    // 记录2：腾讯云主机，已过期
    const r2Data = {
        provider: '腾讯云',
        months: 12,
        host_purchase: '2024-01-01',
        host_expire: '2025-01-01',
        host_remaining: '',
        ip_address: '119.29.45.67',
        password: 'Tencent@2024',
        domain: 'tx.example.com',
        remark: '已到期未续费',
        address: '域名地址',
        expense: '=60',               // 单价60，无附加
        ip_info: '腾讯云广州',
        client_purchase: '2024-01-01',
        client_expire: '2025-01-01',
        client_remaining: '',
        client_name: '客户B',
        unit_price: '60元/月 年付',
        fee: '=720',
        is_expired: '过期'
    };
    const r2Id = await insertRecord(userId, dedicatedId, r2Data, 'server', 1);
    await insertHostExpenseDetail(userId, r2Id, 60, '2024-01-01', '年付');

    // ============================================================
    // 共享服务器示例记录（shared）
    // 共享标签下可以有多条 parent_id 指向同一主机的子记录
    // ============================================================
    const s1Data = {
        provider: '华为云',
        months: 6,
        host_purchase: '2025-02-01',
        host_expire: '2025-08-01',
        host_remaining: '',
        ip_address: '121.37.88.99',
        password: 'Huawei@2025',
        domain: 'hw.example.com',
        remark: '共享主机，多个客户共用',
        address: 'IP地址',
        expense: '=100+(-20)',        // 单价100，附加-20
        ip_info: '华为云北京',
        client_purchase: '',
        client_expire: '',
        client_remaining: '',
        client_name: '',
        unit_price: '100元/月 共享',
        fee: '',
        is_expired: '有效'
    };
    const s1Id = await insertRecord(userId, sharedId, s1Data, 'server', 0);
    await insertHostExpenseDetail(userId, s1Id, 100, '2025-02-01', '共享主机首月');
    await insertHostExpenseDetail(userId, s1Id, 100, '2025-03-01', '共享主机次月');

    // 共享主机下的子记录（parent_id 指向 s1Id）
    const s1Child1Data = {
        provider: '华为云',
        months: 3,
        host_purchase: '2025-02-01',
        host_expire: '2025-05-01',
        host_remaining: '',
        ip_address: '121.37.88.99',
        password: '',
        domain: 'hw.example.com',
        remark: '共享主机 - 客户C',
        address: 'IP地址',
        expense: '',                  // 子记录支出由父记录承担
        ip_info: '',
        client_purchase: '2025-02-01',
        client_expire: '2025-05-01',
        client_remaining: '',
        client_name: '客户C',
        unit_price: '50元/月 分摊',
        fee: '=150',
        is_expired: '有效'
    };
    const s1Child1Id = await insertRecord(userId, sharedId, s1Child1Data, 'server', 1);
    // parent_id 设置为父记录
    await run(`UPDATE records SET parent_id = ? WHERE id = ?`, [s1Id, s1Child1Id]);
    await insertIncome(userId, s1Child1Id, sharedId, 150, '2025-02-01', '客户C 分摊');

    // ============================================================
    // 简单记账示例记录（simple）
    // 只有 备注 / 支出 / 收入 三个字段
    // ============================================================
    const simple1Data = {
        remark: '域名续费',
        expense: '=80',
        fee: ''
    };
    const simple1Id = await insertRecord(userId, simpleId, simple1Data, 'server', 0);
    await insertExpense(userId, simple1Id, simpleId, 80, '2025-03-01', '域名续费');

    const simple2Data = {
        remark: '客户D 付款',
        expense: '',
        fee: '=500'
    };
    const simple2Id = await insertRecord(userId, simpleId, simple2Data, 'server', 1);
    await insertIncome(userId, simple2Id, simpleId, 500, '2025-03-05', '客户D 付款');

    const simple3Data = {
        remark: '服务器维修',
        expense: '=200',
        fee: ''
    };
    const simple3Id = await insertRecord(userId, simpleId, simple3Data, 'server', 2);
    await insertExpense(userId, simple3Id, simpleId, 200, '2025-03-10', '服务器维修');

    console.log('✅ 各类示例记录已插入');

    // ---- 条件格式 ----
    await run(`INSERT INTO conditional_formats (user_id, tab_id, col_key, condition_type, condition_value, text_color, is_bold, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, dedicatedId, 'is_expired', 'equals', '过期', '#f56c6c', 1, 0]);
    await run(`INSERT INTO conditional_formats (user_id, tab_id, col_key, condition_type, condition_value, text_color, is_bold, sort_order)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, dedicatedId, 'is_expired', 'equals', '有效', '#67c23a', 0, 1]);
    console.log('✅ 条件格式已添加');

    // ---- SSH 主机 ----
    await run(`INSERT INTO hosts (user_id, name, host, port, username, password, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, '阿里云生产机', '47.96.123.45', 22, 'root', 'ssh-password-1', '生产环境', 0]);
    await run(`INSERT INTO hosts (user_id, name, host, port, username, password, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, '腾讯云测试机', '119.29.45.67', 22, 'ubuntu', 'ssh-password-2', '测试环境', 1]);
    console.log('✅ SSH 主机已添加');

    // ---- 命令文件夹 + 命令 ----
    const folderRes = await run(`INSERT INTO command_folders (user_id, name, sort_order) VALUES (?, ?, ?)`,
        [userId, '常用命令', 0]);
    const folderId = folderRes.lastID;
    await run(`INSERT INTO saved_commands (user_id, folder_id, name, command, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, folderId, '查看磁盘', 'df -h', '查看磁盘使用情况', 0]);
    await run(`INSERT INTO saved_commands (user_id, folder_id, name, command, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, folderId, '查看内存', 'free -m', '查看内存使用情况', 1]);
    await run(`INSERT INTO saved_commands (user_id, folder_id, name, command, remark, sort_order) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, folderId, '重启nginx', 'systemctl restart nginx', '重启 nginx 服务', 2]);
    console.log('✅ 命令文件夹及命令已添加');

    console.log('\n🎉 参考数据库生成完成！');
    console.log('   路径: ' + OUT_PATH);
    console.log('   登录账号: admin / admin123');
    console.log('\n包含的表:');
    console.log('   users, tabs, column_defs, records, settings,');
    console.log('   income_records, expense_records, conditional_formats,');
    console.log('   hosts, command_folders, saved_commands, host_expense_details');
    console.log('\n包含的示例数据:');
    console.log('   - 1 个 admin 用户');
    console.log('   - 3 个标签页（独享/共享/简单）');
    console.log('   - 每个标签的完整默认列定义');
    console.log('   - 独享：2 条记录（含主机支出明细+收入）');
    console.log('   - 共享：1 父 1 子记录（含收入）');
    console.log('   - 简单：3 条记录（含支出+收入）');
    console.log('   - 条件格式、SSH主机、命令文件夹及命令');

    db.close();
}

main().catch(err => {
    console.error('❌ 生成失败:', err);
    process.exit(1);
});
