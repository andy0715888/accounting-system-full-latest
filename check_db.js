const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.argv[2];
if (!dbPath || !fs.existsSync(dbPath)) {
    console.log('用法: node check_db.js <数据库文件路径>');
    console.log('示例: node check_db.js backup_20260713_172017/accounting.db');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath);

console.log('=== 数据库文件:', dbPath, '===');
console.log('文件大小:', (fs.statSync(dbPath).size / 1024 / 1024).toFixed(2), 'MB');
console.log('');

db.serialize(() => {
    db.get("SELECT COUNT(*) as cnt FROM users", (err, row) => {
        console.log('用户数:', row?.cnt || 0);
    });
    db.all("SELECT id, username FROM users", (err, rows) => {
        if (rows) rows.forEach(r => console.log('  用户ID:', r.id, '用户名:', r.username));
    });
    db.get("SELECT COUNT(*) as cnt FROM tabs", (err, row) => {
        console.log('标签页数:', row?.cnt || 0);
    });
    db.all("SELECT id, name, tab_type, user_id FROM tabs", (err, rows) => {
        if (rows) rows.forEach(r => console.log('  标签ID:', r.id, '名称:', r.name, '类型:', r.tab_type, '用户ID:', r.user_id));
    });
    db.get("SELECT COUNT(*) as cnt FROM records", (err, row) => {
        console.log('记录数:', row?.cnt || 0);
    });
    db.get("SELECT record_type, COUNT(*) as cnt FROM records GROUP BY record_type", (err, rows) => {
        console.log('记录类型分布:');
        if (rows) rows.forEach(r => console.log('  ', r.record_type || '(空)', ':', r.cnt, '条'));
    });
    db.get("SELECT COUNT(*) as cnt FROM column_defs", (err, row) => {
        console.log('列定义数:', row?.cnt || 0);
    });
    db.close();
});
