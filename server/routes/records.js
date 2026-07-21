const express = require('express');
const { query, queryOne, execute, getDB } = require('../db');

const router = express.Router();

function requireAuth(req, res, next) {
    if (!req.session.userId) return res.status(401).json({ error: '请先登录' });
    next();
}

/**
 * 构建筛选 SQL WHERE 条件
 * filters 格式: { "colKey": ["value1", "value2"], ... }
 * 特殊列:
 *   - is_expired: 需要根据 host_expire / client_expire 计算
 *   - days_remaining: 需要计算
 *   - 其他列: 直接 json_extract(data, '$.colKey')
 */
function buildFilterConditions(filters, params) {
    if (!filters || typeof filters !== 'object') return { where: '', params: [] };
    const conditions = [];
    const allParams = [];

    for (const [colKey, values] of Object.entries(filters)) {
        if (!Array.isArray(values) || values.length === 0) continue;

        if (colKey === 'is_expired') {
            // is_expired 判断逻辑（和前端 getDisplayValue 完全一致）：
            // server 行: host_expire 为空 => 未知; host_expire 有值且 >= 今天 => 有效; 否则 过期
            // client 行: client_expire 为空或 < 今天 => 过期; client_expire >= 今天 => 有效
            const expiredClauses = [];
            if (values.includes('有效')) {
                expiredClauses.push(`(
                    (record_type = 'server' AND json_extract(data, '$.host_expire') != '' AND date(json_extract(data, '$.host_expire')) >= date('now', 'localtime')) OR
                    (record_type = 'client' AND json_extract(data, '$.client_expire') != '' AND date(json_extract(data, '$.client_expire')) >= date('now', 'localtime'))
                )`);
            }
            if (values.includes('过期')) {
                expiredClauses.push(`(
                    (record_type = 'server' AND json_extract(data, '$.host_expire') != '' AND date(json_extract(data, '$.host_expire')) < date('now', 'localtime')) OR
                    (record_type = 'client' AND (json_extract(data, '$.client_expire') = '' OR date(json_extract(data, '$.client_expire')) < date('now', 'localtime')))
                )`);
            }
            if (values.includes('未知')) {
                expiredClauses.push(`(
                    record_type = 'server' AND json_extract(data, '$.host_expire') = ''
                )`);
            }
            if (expiredClauses.length > 0) {
                conditions.push(`(${expiredClauses.join(' OR ')})`);
            }
        } else if (colKey === 'ip_info') {
            // ip_info 等于 ip_address
            const placeholders = values.map(() => '?').join(',');
            allParams.push(...values);
            conditions.push(`json_extract(data, '$.ip_address') IN (${placeholders})`);
        } else {
            // 通用列: json_extract
            const placeholders = values.map(() => '?').join(',');
            allParams.push(...values);
            conditions.push(`json_extract(data, '$.${colKey}') IN (${placeholders})`);
        }
    }

    const where = conditions.length > 0 ? ' AND (' + conditions.join(' AND ') + ')' : '';
    return { where, params: allParams };
}

router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tabId } = req.query;
        if (!tabId) return res.status(400).json({ error: '缺少 tabId' });

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const pageSizeParam = parseInt(req.query.pageSize);
        const rawPageSize = isNaN(pageSizeParam) ? 50 : pageSizeParam;
        const allMode = rawPageSize === 0;

        // 解析筛选条件
        let filters = {};
        try {
            filters = req.query.filters ? JSON.parse(req.query.filters) : {};
        } catch (e) {
            filters = {};
        }

        const filterResult = buildFilterConditions(filters, []);
        const filterWhere = filterResult.where;
        const filterParams = filterResult.params;

        // COUNT 查询（带筛选）
        const countResult = await queryOne(
            `SELECT COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?${filterWhere}`,
            [userId, tabId, ...filterParams]
        );
        const total = countResult ? countResult.cnt : 0;
        const pageSize = allMode ? total : Math.min(999999, Math.max(1, rawPageSize));
        const totalPages = allMode ? 1 : Math.ceil(total / pageSize);
        const offset = allMode ? 0 : (page - 1) * pageSize;
        const limit = allMode ? total : pageSize;

        const records = await query(
            `SELECT * FROM records WHERE user_id = ? AND tab_id = ?${filterWhere} ORDER BY sort_order, id LIMIT ? OFFSET ?`,
            [userId, tabId, ...filterParams, limit, offset]
        );
        const parsed = records.map(r => {
            try { return { ...r, data: JSON.parse(r.data || '{}') }; }
            catch { return { ...r, data: {} }; }
        });

        // income/expense totals
        const recordIds = parsed.map(r => r.id);
        let incomeMap = {};
        let expenseMap = {};
        if (recordIds.length > 0) {
            const placeholders = recordIds.map(() => '?').join(',');
            const incomeRows = await query(
                `SELECT record_id, SUM(amount) as total FROM income_records WHERE record_id IN (${placeholders}) GROUP BY record_id`,
                recordIds
            );
            incomeRows.forEach(row => { incomeMap[row.record_id] = row.total; });

            const expenseRows = await query(
                `SELECT record_id, SUM(amount) as total FROM expense_records WHERE record_id IN (${placeholders}) GROUP BY record_id`,
                recordIds
            );
            expenseRows.forEach(row => { expenseMap[row.record_id] = row.total; });
        }

        // 主机支出明细（独享/共享标签用）：一次性查全部明细，按 record_id 分组
        let hostExpenseMap = {}; // record_id -> { total, details: [...] }
        if (recordIds.length > 0) {
            const placeholders = recordIds.map(() => '?').join(',');
            const hostExpenseRows = await query(
                `SELECT id, record_id, unit_price, expense_date FROM host_expense_details WHERE record_id IN (${placeholders}) ORDER BY record_id, expense_date ASC, id ASC`,
                recordIds
            );
            hostExpenseRows.forEach(row => {
                if (!hostExpenseMap[row.record_id]) hostExpenseMap[row.record_id] = { total: 0, details: [] };
                hostExpenseMap[row.record_id].total += (row.unit_price || 0);
                hostExpenseMap[row.record_id].details.push({
                    id: row.id,
                    unit_price: row.unit_price,
                    expense_date: row.expense_date
                });
            });
        }

        parsed.forEach(r => {
            r._incomeTotal = incomeMap[r.id] || 0;
            r._expenseTotal = expenseMap[r.id] || 0;
            const he = hostExpenseMap[r.id];
            r._hostExpenseDetails = he ? he.details : [];
            r._hostExpenseTotal = he ? he.total : 0;
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
        const { tab_id, data, record_type, parent_id, sort_order } = req.body;
        if (!tab_id) return res.status(400).json({ error: '缺少 tab_id' });
        if (!data || typeof data !== 'object') return res.status(400).json({ error: '数据格式错误' });

        const rType = record_type || 'server';
        const pParent = parent_id || null;

        let sortOrder = sort_order;
        if (sortOrder === undefined || sortOrder === null) {
            if (pParent) {
                const maxSort = await queryOne(
                    'SELECT MAX(sort_order) as max_sort FROM records WHERE parent_id = ? AND user_id = ?',
                    [pParent, userId]
                );
                sortOrder = (maxSort && maxSort.max_sort !== null) ? maxSort.max_sort + 1 : 0;
            } else {
                const maxSort = await queryOne(
                    'SELECT MAX(sort_order) as max_sort FROM records WHERE user_id = ? AND tab_id = ? AND parent_id IS NULL',
                    [userId, tab_id]
                );
                sortOrder = (maxSort && maxSort.max_sort !== null) ? maxSort.max_sort + 1 : 0;
            }
        } else {
            // 指定了 sort_order，把 >=sort_order 的记录往后移一位
            await execute(
                'UPDATE records SET sort_order = sort_order + 1 WHERE user_id = ? AND tab_id = ? AND parent_id IS ? AND sort_order >= ?',
                [userId, tab_id, pParent, sortOrder]
            );
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
        const recordIds = parsed.map(r => r.id);
        let incomeMap = {};
        let hostExpenseMap = {};
        if (recordIds.length > 0) {
            const placeholders = recordIds.map(() => '?').join(',');
            const incomeRows = await query(
                `SELECT record_id, SUM(amount) as total FROM income_records WHERE record_id IN (${placeholders}) GROUP BY record_id`,
                recordIds
            );
            incomeRows.forEach(row => { incomeMap[row.record_id] = row.total; });

            const hostExpenseRows = await query(
                `SELECT id, record_id, unit_price, expense_date FROM host_expense_details WHERE record_id IN (${placeholders}) ORDER BY record_id, expense_date ASC, id ASC`,
                recordIds
            );
            hostExpenseRows.forEach(row => {
                if (!hostExpenseMap[row.record_id]) hostExpenseMap[row.record_id] = { total: 0, details: [] };
                hostExpenseMap[row.record_id].total += (row.unit_price || 0);
                hostExpenseMap[row.record_id].details.push({
                    id: row.id, unit_price: row.unit_price, expense_date: row.expense_date
                });
            });
        }
        parsed.forEach(r => {
            r._incomeTotal = incomeMap[r.id] || 0;
            const he = hostExpenseMap[r.id];
            r._hostExpenseDetails = he ? he.details : [];
            r._hostExpenseTotal = he ? he.total : 0;
        });
        res.json(parsed);
    } catch (err) {
        console.error('获取子记录错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

/**
 * 获取某列的去重值和计数（用于筛选面板）
 * GET /records/filter-options?tabId=X&colKey=Y&search=keyword
 * 注意：必须在 /:id 路由之前注册，否则 "filter-options" 会被当作 id
 */
router.get('/filter-options', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tabId, colKey, search } = req.query;
        if (!tabId || !colKey) return res.status(400).json({ error: '缺少参数' });

        // 解析其他列的筛选条件（排除当前列，避免循环）
        let otherFilters = {};
        try {
            const allFilters = req.query.filters ? JSON.parse(req.query.filters) : {};
            for (const [k, v] of Object.entries(allFilters)) {
                if (k !== colKey) otherFilters[k] = v;
            }
        } catch (e) {}

        const filterResult = buildFilterConditions(otherFilters, []);
        const filterWhere = filterResult.where;
        const filterParams = filterResult.params;

        let options = [];

        if (colKey === 'is_expired') {
            const baseParams = [userId, tabId, ...filterParams];
            const validCount = await queryOne(
                `SELECT COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?${filterWhere} AND (
                    (record_type = 'server' AND json_extract(data, '$.host_expire') != '' AND date(json_extract(data, '$.host_expire')) >= date('now', 'localtime')) OR
                    (record_type = 'client' AND json_extract(data, '$.client_expire') != '' AND date(json_extract(data, '$.client_expire')) >= date('now', 'localtime'))
                )`, baseParams
            );
            const expiredCount = await queryOne(
                `SELECT COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?${filterWhere} AND (
                    (record_type = 'server' AND json_extract(data, '$.host_expire') != '' AND date(json_extract(data, '$.host_expire')) < date('now', 'localtime')) OR
                    (record_type = 'client' AND (json_extract(data, '$.client_expire') = '' OR date(json_extract(data, '$.client_expire')) < date('now', 'localtime')))
                )`, baseParams
            );
            const unknownCount = await queryOne(
                `SELECT COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?${filterWhere} AND record_type = 'server' AND json_extract(data, '$.host_expire') = ''`, baseParams
            );
            options = [
                { value: '有效', count: validCount?.cnt || 0 },
                { value: '过期', count: expiredCount?.cnt || 0 },
            ];
            if ((unknownCount?.cnt || 0) > 0) {
                options.push({ value: '未知', count: unknownCount?.cnt || 0 });
            }
        } else if (colKey === 'ip_info') {
            const searchLike = search ? `%${search}%` : '%';
            const rows = await query(
                `SELECT json_extract(data, '$.ip_address') as val, COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?${filterWhere} AND json_extract(data, '$.ip_address') != '' AND json_extract(data, '$.ip_address') LIKE ? GROUP BY val ORDER BY val LIMIT 200`,
                [userId, tabId, ...filterParams, searchLike]
            );
            options = rows.filter(r => r.val).map(r => ({ value: r.val, count: r.cnt }));
        } else {
            const searchLike = search ? `%${search}%` : '%';
            const rows = await query(
                `SELECT json_extract(data, '$.${colKey}') as val, COUNT(*) as cnt FROM records WHERE user_id = ? AND tab_id = ?${filterWhere} AND json_extract(data, '$.${colKey}') LIKE ? GROUP BY val ORDER BY val LIMIT 200`,
                [userId, tabId, ...filterParams, searchLike]
            );
            options = rows.filter(r => r.val !== null && r.val !== undefined && String(r.val).trim() !== '')
                .map(r => ({ value: String(r.val).trim(), count: r.cnt }));
        }

        res.json(options);
    } catch (err) {
        console.error('获取筛选选项错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

router.put('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const recordId = req.params.id;
        const { data, parent_id } = req.body;
        if (!data || typeof data !== 'object') return res.status(400).json({ error: '数据格式错误' });

        const existing = await queryOne('SELECT id FROM records WHERE id = ? AND user_id = ?', [recordId, userId]);
        if (!existing) return res.status(404).json({ error: '记录不存在' });

        if (parent_id !== undefined) {
            await execute(
                'UPDATE records SET data = ?, parent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [JSON.stringify(data), parent_id, recordId]
            );
        } else {
            await execute(
                'UPDATE records SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [JSON.stringify(data), recordId]
            );
        }
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

router.post('/move', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { record_id, new_parent_id } = req.body;
        if (!record_id) return res.status(400).json({ error: '缺少 record_id' });
        if (!new_parent_id) return res.status(400).json({ error: '缺少 new_parent_id' });

        const clientRec = await queryOne(
            'SELECT id, parent_id, record_type, tab_id FROM records WHERE id = ? AND user_id = ?',
            [record_id, userId]
        );
        if (!clientRec) return res.status(404).json({ error: '客户记录不存在' });
        if (clientRec.record_type !== 'client') return res.status(400).json({ error: '只能移动客户记录' });

        const parentRec = await queryOne(
            'SELECT id, record_type, tab_id FROM records WHERE id = ? AND user_id = ?',
            [new_parent_id, userId]
        );
        if (!parentRec) return res.status(404).json({ error: '目标服务器不存在' });
        if (parentRec.record_type !== 'server') return res.status(400).json({ error: '目标必须是服务器记录' });
        if (clientRec.tab_id !== parentRec.tab_id) return res.status(400).json({ error: '不能跨标签移动' });

        if (clientRec.parent_id === new_parent_id) {
            return res.status(400).json({ error: '客户已在该服务器下' });
        }

        await execute('UPDATE records SET parent_id = ? WHERE id = ?', [new_parent_id, record_id]);
        res.json({ success: true, message: '移动成功' });
    } catch (err) {
        console.error('移动记录错误:', err);
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
            stmt.run([userId, tabId, JSON.stringify(record)]);
            count++;
        }
        stmt.finalize();

        res.json({ success: true, message: `成功导入 ${count} 条记录`, count });
    } catch (err) {
        console.error('导入错误:', err);
        res.status(500).json({ error: '导入失败' });
    }
});

// 收支统计：汇总整个标签的所有记录（计算逻辑和前端显示完全一致）
router.get('/stats', requireAuth, async (req, res) => {
    try {
        const userId = req.session.userId;
        const { tabId } = req.query;
        if (!tabId) return res.status(400).json({ error: '缺少 tabId' });

        // 1. 取所有记录的 id + data
        const rows = await query(
            `SELECT id, data FROM records WHERE user_id = ? AND tab_id = ?`,
            [userId, tabId]
        );

        const recordIds = rows.map(r => r.id);

        // 2. 批量查三张子表（按 record_id 分组求和）
        const placeholders = recordIds.length > 0 ? recordIds.map(() => '?').join(',') : null;
        let incomeSums = {};      // record_id -> SUM(amount) from income_records
        let expenseSums = {};     // record_id -> SUM(amount) from expense_records
        let hostExpenseSums = {}; // record_id -> SUM(unit_price) from host_expense_details

        if (placeholders) {
            const [incomeRows, expenseRows, hostDetailRows] = await Promise.all([
                query(`SELECT record_id, SUM(amount) as total FROM income_records WHERE record_id IN (${placeholders}) GROUP BY record_id`, recordIds),
                query(`SELECT record_id, SUM(amount) as total FROM expense_records WHERE record_id IN (${placeholders}) GROUP BY record_id`, recordIds),
                query(`SELECT record_id, SUM(unit_price) as total FROM host_expense_details WHERE record_id IN (${placeholders}) GROUP BY record_id`, recordIds),
            ]);
            incomeRows.forEach(r => { incomeSums[r.record_id] = r.total || 0; });
            expenseRows.forEach(r => { expenseSums[r.record_id] = r.total || 0; });
            hostDetailRows.forEach(r => { hostExpenseSums[r.record_id] = r.total || 0; });
        }

        let totalIncome = 0;
        let totalExpense = 0;
        let countedRecords = 0;

        rows.forEach(row => {
            let data;
            try { data = JSON.parse(row.data || '{}'); }
            catch { data = {}; }

            // 跳过结余调整记录（不参与统计）
            if (data.remark && String(data.remark).includes('结余调整')) {
                return;
            }
            countedRecords++;

            // ========== 收入（二分支） ==========
            // 有 income_records → 用 income_records 总和；否则 → 用 data.fee（支持 =80+10 表达式）
            const incomeTotal = incomeSums[row.id] || 0;
            if (incomeTotal > 0) {
                totalIncome += incomeTotal;
            } else {
                const feeVal = evalAmountExpr(data.fee);
                if (typeof feeVal === 'number' && !isNaN(feeVal)) {
                    totalIncome += feeVal;
                }
            }

            // ========== 支出（三分支） ==========
            // 有 expense_records → 用 expense_records 总和；
            // 否则有 host_expense_details → 用 明细总和 + 附加；
            // 否则 → 用 月数 × 单价 + 附加
            const expenseTotal = expenseSums[row.id] || 0;
            if (expenseTotal > 0) {
                totalExpense += expenseTotal;
            } else {
                const detailSum = hostExpenseSums[row.id] || 0;
                if (detailSum > 0) {
                    // 有主机支出明细：支出 = 明细总和 + 附加
                    const extra = parseExpenseExtraStr(data.expense);
                    totalExpense += detailSum + extra;
                } else if (data.expense) {
                    // 无明细：月数 × 单价 + 附加
                    const months = parseInt(data.months) || 0;
                    const expVal = evalExpenseExpr(data.expense, months);
                    if (typeof expVal === 'number' && !isNaN(expVal)) {
                        totalExpense += expVal;
                    }
                }
            }
        });

        res.json({
            totalIncome: Math.round(totalIncome * 100) / 100,
            totalExpense: Math.round(totalExpense * 100) / 100,
            netProfit: Math.round((totalIncome - totalExpense) * 100) / 100,
            recordCount: countedRecords
        });
    } catch (err) {
        console.error('统计收支错误:', err);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 工具：解析金额表达式（支持 "80"、"=80+10"、"=80" 等）
function evalAmountExpr(raw) {
    if (!raw) return 0;
    const str = String(raw).trim();
    if (!str) return 0;
    let expr = str.startsWith('=') ? str.slice(1) : str;
    const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
    if (!sanitized) {
        const num = parseFloat(expr);
        return isNaN(num) ? 0 : num;
    }
    try {
        const v = Function('"use strict"; return (' + sanitized + ')')();
        return typeof v === 'number' ? v : 0;
    } catch (e) {
        const num = parseFloat(expr);
        return isNaN(num) ? 0 : num;
    }
}

// 工具：解析支出表达式附加部分（"=40+(10)" → 10）
function parseExpenseExtraStr(raw) {
    if (!raw) return 0;
    const str = String(raw).trim();
    const match = str.match(/^=(?:\d+(?:\.\d+)?)\+\((.+)\)$/);
    if (!match) return 0;
    const sanitized = match[1].replace(/[^0-9+\-*/().]/g, '');
    if (!sanitized) return 0;
    try {
        const v = Function('"use strict"; return (' + sanitized + ')')();
        return typeof v === 'number' ? v : 0;
    } catch (e) { return 0; }
}

// 工具：解析支出表达式（无明细场景）"=40+(10)" 或 "=40" 或 "40"
function evalExpenseExpr(raw, months) {
    if (!raw) return 0;
    const str = String(raw).trim();
    const match = str.match(/^=(\d+(?:\.\d+)?)(?:\+\((.+)\))?$/);
    if (match) {
        const unitPrice = parseFloat(match[1]) || 0;
        const extra = match[2] ? parseExpenseExtraStr(str) : 0;
        return months * unitPrice + extra;
    }
    const numStr = str.startsWith('=') ? str.slice(1) : str;
    const num = parseFloat(numStr);
    if (isNaN(num)) return 0;
    return months * num;
}

module.exports = router;
