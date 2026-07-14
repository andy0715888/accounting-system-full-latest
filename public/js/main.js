console.log('main.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready');
    let state = {
        tabs: [],
        currentTabId: null,
        columns: [],
        records: [],
        selectedRows: new Set(),
        filters: {},
        filterOptions: {},
        tabFilters: {},
        isOnline: true,
        tabCache: {},
        tabManageMode: false,
        selectedTabs: new Set(),
        renameTabId: null,
        providerOptions: [],
        isLoaded: false,
        userName: '',
        isAdmin: false,
        ipPortSuffix: '',
        domainPortSuffix: '',
        // 统计时间范围（0=所有）
        statsMonthRange: 6,
        statsYearRange: 6,
        // 分页
        page: 1,
        pageSize: 100,
        total: 0,
        totalPages: 1,
        // 收入弹窗
        incomeRecordId: null,
        incomeRecords: [],
        // 支出弹窗
        expenseRecordId: null,
        expenseRecords: [],
        // 客户信息复制
        copiedClientRecordId: null,
        // 服务器信息复制
        copiedServerData: null,
        // 列定义缓存
        columnsCache: {},
        // 行管理模式
        rowManageMode: false,
        // 待保存记录追踪
        pendingSaves: new Set(),
        // 撤销栈
        undoStack: []
    };

    // DOM 引用
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const tabBar = $('#tabBar');
    const tableHead = $('#tableHead');
    const tableBody = $('#tableBody');
    const recordCount = $('#recordCount');
    const statusText = $('#statusText');
    const usernameDisplay = $('#usernameDisplay');
    const currentTimeDisplay = $('#currentTimeDisplay');
    const addTabBtn = $('#addTabBtn');
    const manageTabsBtn = $('#manageTabsBtn');
    const deleteTabsBtn = $('#deleteTabsBtn');
    const addRowBtn = $('#addRowBtn');
    const deleteRowsBtn = $('#deleteRowsBtn');
    const manageRowsBtn = $('#manageRowsBtn');
    const importBtn = $('#importBtn');
    const exportBtn = $('#exportBtn');
    const exportClientInfoBtn = $('#exportClientInfoBtn');
    const exportClientInfoModal = $('#exportClientInfoModal');
    const closeExportClientInfoModal = $('#closeExportClientInfoModal');
    const exportClientConfirm = $('#exportClientConfirm');
    const exportClientCancel = $('#exportClientCancel');
    const exportClientStatus = $('#exportClientStatus');
    const refreshBtn = $('#refreshBtn');
    const manageColumnsBtn = $('#manageColumnsBtn');
    const conditionalFormatBtn = $('#conditionalFormatBtn');
    const conditionalFormatModal = $('#conditionalFormatModal');
    const closeConditionalFormatModal = $('#closeConditionalFormatModal');
    const cfModalTabName = $('#cfModalTabName');
    const cfColSelect = $('#cfColSelect');
    const cfConditionSelect = $('#cfConditionSelect');
    const cfValueInput = $('#cfValueInput');
    const cfColorInput = $('#cfColorInput');
    const cfBoldCheck = $('#cfBoldCheck');
    const cfAddBtn = $('#cfAddBtn');
    const cfList = $('#cfList');
    const addressSuffixBtn = $('#addressSuffixBtn');
    const providerManageBtn = $('#providerManageBtn');
    const logoutBtn = $('#logoutBtn');
    const columnModal = $('#columnModal');

    const confirmModal = $('#confirmModal');
    const confirmModalTitle = $('#confirmModalTitle');
    const confirmModalMessage = $('#confirmModalMessage');
    const confirmModalYes = $('#confirmModalYes');
    const confirmModalNo = $('#confirmModalNo');
    const closeConfirmModal = $('#closeConfirmModal');
    const closeColumnModal = $('#closeColumnModal');
    const addColBtn = $('#addColBtn');
    const columnList = $('#columnList');
    const newColName = $('#newColName');
    const newColType = $('#newColType');
    const importModal = $('#importModal');
    const closeImport = $('#closeImport');
    const importFileInput = $('#importFileInput');
    const confirmImport = $('#confirmImport');
    const cancelImport = $('#cancelImport');
    const importStatus = $('#importStatus');
    const statsContainer = $('#statsContainer');
    const changePwdBtn = $('#changePasswordBtn');
    const oldPwdInput = $('#oldPassword');
    const newPwdInput = $('#newPassword');
    const confirmPwdInput = $('#confirmPassword');
    const changePwdStatus = $('#changePwdStatus');
    const changeUsernameBtn = $('#changeUsernameBtn');
    const usernamePasswordInput = $('#usernamePassword');
    const newUsernameInput = $('#newUsername');
    const changeUsernameStatus = $('#changeUsernameStatus');
    const allowRegisterCheckbox = $('#allowRegisterCheckbox');
    const saveRegisterSwitchBtn = $('#saveRegisterSwitchBtn');
    const registerSwitchStatus = $('#registerSwitchStatus');
    const registerSwitchGroup = $('#registerSwitchGroup');

    const addressSuffixModal = $('#addressSuffixModal');
    const closeAddressSuffixModal = $('#closeAddressSuffixModal');
    const ipPortSuffixInput = $('#ipPortSuffixInput');
    const domainPortSuffixInput = $('#domainPortSuffixInput');
    const saveSuffixBtn = $('#saveSuffixBtn');
    const suffixStatus = $('#suffixStatus');
    const renameTabModal = $('#renameTabModal');
    const closeRenameTabModal = $('#closeRenameTabModal');
    const renameTabInput = $('#renameTabInput');
    const saveRenameTabBtn = $('#saveRenameTabBtn');
    const cancelRenameTabBtn = $('#cancelRenameTabBtn');
    const renameTabStatus = $('#renameTabStatus');
    const renameTabModalTitle = $('#renameTabModalTitle');
    const renameTabForm = $('#renameTabForm');
    const addTabForm = $('#addTabForm');
    const newTabNameInput = $('#newTabNameInput');
    const saveNewTabBtn = $('#saveNewTabBtn');
    const cancelNewTabBtn = $('#cancelNewTabBtn');
    const newTabStatus = $('#newTabStatus');
    const providerModal = $('#providerModal');
    const closeProviderModal = $('#closeProviderModal');
    const providerNameInput = $('#providerNameInput');
    const addProviderBtn = $('#addProviderBtn');
    const providerList = $('#providerList');
    const providerStatus = $('#providerStatus');

    const paginationBar = $('#paginationBar');
    const paginationInfo = $('#paginationInfo');
    const prevPageBtn = $('#prevPageBtn');
    const nextPageBtn = $('#nextPageBtn');
    const firstPageBtn = $('#firstPageBtn');
    const lastPageBtn = $('#lastPageBtn');
    const pageIndicator = $('#pageIndicator');
    const pageSizeSelect = $('#pageSizeSelect');
    // 同步 state.pageSize 与下拉框初始值
    state.pageSize = parseInt(pageSizeSelect ? pageSizeSelect.value : 1000) || 1000;
    const pageJumpInput = $('#pageJumpInput');
    const pageJumpBtn = $('#pageJumpBtn');

    const incomeModal = $('#incomeModal');
    const closeIncomeModal = $('#closeIncomeModal');
    const incomeAmountInput = $('#incomeAmountInput');
    const incomeDateInput = $('#incomeDateInput');
    const incomeRemarkInput = $('#incomeRemarkInput');
    const addIncomeBtn = $('#addIncomeBtn');
    const incomeList = $('#incomeList');
    const incomeTotalDisplay = $('#incomeTotalDisplay');
    const incomeStatus = $('#incomeStatus');

    const expenseModal = $('#expenseModal');
    const closeExpenseModal = $('#closeExpenseModal');
    const expenseAmountInput = $('#expenseAmountInput');
    const expenseDateInput = $('#expenseDateInput');
    const expenseRemarkInput = $('#expenseRemarkInput');
    const addExpenseBtn = $('#addExpenseBtn');
    const expenseList = $('#expenseList');
    const expenseTotalDisplay = $('#expenseTotalDisplay');
    const expenseStatus = $('#expenseStatus');

    let filterDocumentClickBound = false;

    // --- 菜单切换 ---
    function initMenu() {
        $$('.menu-item').forEach(item => {
            item.addEventListener('click', function() {
                $$('.menu-item').forEach(i => i.classList.remove('active'));
                this.classList.add('active');
                const view = this.dataset.view;
                $$('.view-panel').forEach(p => p.classList.remove('active'));
                const target = document.getElementById('view-' + view);
                if (target) target.classList.add('active');
                if (view === 'stats') renderStats();
                if (view === 'hosts') {
                    loadHosts();
                    loadCommandFolders();
                }
            });
        });
    }
    initMenu();

    function updateClock() {
        const now = new Date();
        const weekdays = ['日','一','二','三','四','五','六'];
        currentTimeDisplay.textContent = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} 星期${weekdays[now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    }
    setInterval(updateClock, 10000);
    updateClock();

    function setStatus(msg) { statusText.textContent = msg; }
    function parseDate(str) {
        if (!str) return '';
        const s = String(str).trim();
        if (!s) return '';
        let y, m, d;
        let match;
        match = s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})$/);
        if (match) {
            y = parseInt(match[1]);
            m = parseInt(match[2]) - 1;
            d = parseInt(match[3]);
        }
        if (!match) {
            match = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
            if (match) {
                y = parseInt(match[1]);
                m = parseInt(match[2]) - 1;
                d = parseInt(match[3]);
            }
        }
        if (!match) {
            match = s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
            if (match) {
                y = parseInt(match[3]);
                m = parseInt(match[1]) - 1;
                d = parseInt(match[2]);
            }
        }
        if (y !== undefined && m !== undefined && d !== undefined) {
            const dt = new Date(y, m, d);
            if (!isNaN(dt)) {
                return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
            }
        }
        const dt = new Date(s);
        if (!isNaN(dt)) {
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        }
        return '';
    }
    function formatDate(d) {
        if (!d) return '';
        try { 
            const dt = new Date(d); 
            if (isNaN(dt)) return d; 
            return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
        } catch { return d; }
    }
    function formatDisplayDate(d) {
        if (!d) return '';
        try {
            const dt = new Date(d);
            if (isNaN(dt)) return d;
            const y = dt.getFullYear();
            const m = String(dt.getMonth() + 1).padStart(2, '0');
            const day = String(dt.getDate()).padStart(2, '0');
            return `${y}年${m}月${day}日`;
        } catch { return d; }
    }
    function getCellValue(record, colKey) { return record.data[colKey] ?? ''; }

    function escapeHtml(value) {
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    function escapeAttr(value) { return escapeHtml(value); }
    function cssUrl(url) { return String(url ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"'); }

    function showConfirm(message, title) {
        return new Promise((resolve) => {
            confirmModalTitle.textContent = title || '确认';
            confirmModalMessage.textContent = message;
            confirmModal.classList.add('show');

            const yesHandler = () => { close(); resolve(true); };
            const noHandler = () => { close(); resolve(false); };
            const keyHandler = (e) => {
                if (e.key === 'Escape') { close(); resolve(false); }
                else if (e.key === 'Enter') { e.preventDefault(); close(); resolve(true); }
            };

            function close() {
                confirmModal.classList.remove('show');
                confirmModalYes.removeEventListener('click', yesHandler);
                confirmModalNo.removeEventListener('click', noHandler);
                closeConfirmModal.removeEventListener('click', noHandler);
                document.removeEventListener('keydown', keyHandler);
            }

            confirmModalYes.addEventListener('click', yesHandler);
            confirmModalNo.addEventListener('click', noHandler);
            closeConfirmModal.addEventListener('click', noHandler);
            document.addEventListener('keydown', keyHandler);
        });
    }

    function getChineseInitials(text) {
        const extraMap = {
            '烟': 'y', '火': 'h', '云': 'y'
        };
        const initials = 'ABCDEFGHJKLMNOPQRSTWXYZ';
        const boundary = '阿八嚓哒妸发旮哈讥咔垃妈拿噢啪期然撒塌穵昔压匝';
        return String(text || '').split('').map(ch => {
            if (extraMap[ch]) return extraMap[ch];
            if (/^[a-zA-Z0-9]$/.test(ch)) return ch.toLowerCase();
            for (let i = boundary.length - 1; i >= 0; i--) {
                if (ch.localeCompare(boundary[i], 'zh-Hans-CN') >= 0) {
                    return initials[i] ? initials[i].toLowerCase() : '';
                }
            }
            return '';
        }).join('');
    }

    function providerMatchesKeyword(name, keyword) {
        const source = String(name || '').trim().toLowerCase();
        const kw = String(keyword || '').trim().toLowerCase();
        if (!kw) return true;
        const initials = getChineseInitials(source);
        return source.includes(kw) || initials.includes(kw);
    }

    function measureTextWidth(text, fontWeight = 600, fontSize = 14) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;
        return Math.ceil(ctx.measureText(text).width);
    }

    function getDisplayValue(record, col) {
        if (!record || !col) return '';
        const colKey = col.col_key;
        const val = getCellValue(record, colKey);
        if (col.col_type === 'date') {
            return formatDisplayDate(val);
        } else if (col.col_type === 'days_remaining') {
            let dateKey = colKey === 'host_remaining' ? 'host_expire' : (colKey === 'client_remaining' ? 'client_expire' : '');
            const days = computeDaysRemaining(record.data[dateKey]);
            return days !== '' ? days + ' 天' : '';
        } else if (colKey === 'ip_info') {
            return record.data.ip_address || '';
        } else if (colKey === 'is_expired') {
            if (record.record_type === 'client') {
                const clientExpire = record.data.client_expire;
                return checkExpired(clientExpire);
            } else {
                // 独享/共享服务器行：根据 host_remaining 判断
                const hostRemaining = computeDaysRemaining(record.data.host_expire);
                if (hostRemaining === '') return '未知';
                return hostRemaining >= 0 ? '有效' : '过期';
            }
        } else if (colKey === 'fee') {
            const result = computeFeeValue(val);
            return result !== null ? String(result) : (val || '');
        } else if (colKey === 'expense') {
            if (record._expenseTotal !== undefined) {
                return String(Math.round(record._expenseTotal || 0));
            }
            const months = parseInt(record.data.months) || 0;
            const result = computeExpenseValue(val, months);
            return result !== null ? String(Math.round(result)) : (val || '');
        } else {
            return val === null || val === undefined ? '' : String(val);
        }
    }

    function computeFeeValue(raw) {
        if (!raw && raw !== 0) return '';
        const str = String(raw).trim();
        if (str.startsWith('=')) {
            const res = evalExpression(str);
            if (typeof res === 'number' && !isNaN(res)) return res;
            return raw;
        }
        const num = parseFloat(str);
        return isNaN(num) ? raw : num;
    }

    // 修正后的支出计算：支持 =50 或 =50+(20) 或 纯数字
    function computeExpenseValue(raw, months) {
        if (raw === null || raw === undefined) return 0;
        const str = String(raw).trim();
        const m = months || 0;
        const match = str.match(/^=(\d+(?:\.\d+)?)(?:\+\((.+)\))?$/);
        if (match) {
            const unitPrice = parseFloat(match[1]) || 0;
            const extraExpr = match[2];
            const extra = extraExpr ? safeEval(extraExpr) : 0;
            return m * unitPrice + extra;
        }
        const num = parseFloat(str);
        if (!isNaN(num)) return m * num;
        return safeEval(str);
    }

    function safeEval(expr) {
        try {
            const sanitized = expr.replace(/[^0-9+\-*/().]/g, '');
            if (!sanitized) return 0;
            const result = Function('"use strict"; return (' + sanitized + ')')();
            if (typeof result === 'number' && !isNaN(result)) return result;
            return 0;
        } catch (e) { return 0; }
    }

    function calcColumnWidth(col) {
        let headerText = getColumnDisplayName(col);
        let lines = headerText.split('<br>');
        let maxHeaderWidth = 0;
        lines.forEach(line => {
            const w = measureTextWidth(line) + 22;
            if (w > maxHeaderWidth) maxHeaderWidth = w;
        });
        if (col.is_income === 1 || col.is_income === 2) maxHeaderWidth += 20;
        maxHeaderWidth += 8;
        let maxCellWidth = 0;
        const sampleRecords = state.records.slice(0, 50);
        sampleRecords.forEach(record => {
            const displayVal = getDisplayValue(record, col);
            let w = measureTextWidth(displayVal, 400, 14) + 16;
            if (col.col_key === 'expense') w = Math.max(w, 60);
            if (w > maxCellWidth) maxCellWidth = w;
        });
        // IP addresses and dates have known widths, cap them
        if (col.col_key === 'ip_address') maxCellWidth = Math.min(maxCellWidth, 150);
        if (col.col_type === 'date' || col.col_type === 'days_remaining') maxCellWidth = Math.min(maxCellWidth, 120);
        if (col.col_key === 'password') maxCellWidth = Math.min(maxCellWidth, 120);
        if (col.col_key === 'fee') maxCellWidth = Math.min(maxCellWidth, 80);
        return Math.max(60, Math.min(250, Math.max(maxHeaderWidth, maxCellWidth)));
    }

    function getColumnDisplayName(col) {
        const key = col.col_key;
        if (key === 'host_purchase') return '主机<br>购买时间';
        if (key === 'host_expire') return '主机<br>到期时间';
        if (key === 'host_remaining') return '主机<br>剩余天数';
        if (key === 'client_purchase') return '客户<br>购买时间';
        if (key === 'client_expire') return '客户<br>到期时间';
        if (key === 'client_remaining') return '客户<br>剩余天数';
        if (key === 'unit_price') return '单价<br>备注';
        return col.col_name;
    }

    function computeDaysRemaining(dateStr) {
        if (!dateStr) return '';
        const target = new Date(dateStr);
        if (isNaN(target)) return '';
        const now = new Date(); now.setHours(0,0,0,0);
        target.setHours(0,0,0,0);
        return Math.ceil((target - now) / (1000*60*60*24));
    }

    function checkConditionMatch(cellValue, conditionType, conditionValue) {
        if (cellValue === null || cellValue === undefined) cellValue = '';
        const cellStr = String(cellValue).trim();
        const condStr = String(conditionValue ?? '').trim();
        switch (conditionType) {
            case 'contains': return cellStr.indexOf(condStr) !== -1;
            case 'equals': return cellStr === condStr;
            case 'not_equals': return cellStr !== condStr;
            case 'starts_with': return cellStr.startsWith(condStr);
            case 'ends_with': return cellStr.endsWith(condStr);
            case 'greater_than': {
                const cellNum = parseFloat(cellStr);
                const condNum = parseFloat(condStr);
                if (isNaN(cellNum) || isNaN(condNum)) return false;
                return cellNum > condNum;
            }
            case 'less_than': {
                const cellNum = parseFloat(cellStr);
                const condNum = parseFloat(condStr);
                if (isNaN(cellNum) || isNaN(condNum)) return false;
                return cellNum < condNum;
            }
            default: return false;
        }
    }

    function getConditionalFormat(colKey, cellValue) {
        if (!state.conditionalFormats || state.conditionalFormats.length === 0) return null;
        const formats = state.conditionalFormats.filter(f => f.col_key === colKey);
        for (const fmt of formats) {
            if (checkConditionMatch(cellValue, fmt.condition_type, fmt.condition_value)) {
                return fmt;
            }
        }
        return null;
    }

    function applyFormatStyle(fmt) {
        if (!fmt) return '';
        let style = '';
        if (fmt.text_color) style += `color:${fmt.text_color};`;
        if (fmt.is_bold) style += 'font-weight:bold;';
        return style;
    }

    function checkExpired(expireDateStr) {
        if (!expireDateStr) return '未知';
        const days = computeDaysRemaining(expireDateStr);
        if (days === '') return '未知';
        return days >= 0 ? '有效' : '过期';
    }

    function calcHostExpire(purchaseDate, months) {
        if (!purchaseDate) return '';
        const d = new Date(purchaseDate);
        if (isNaN(d)) return '';
        d.setMonth(d.getMonth() + (parseInt(months) || 0));
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function getNextMonth(date) {
        const d = new Date(date);
        d.setMonth(d.getMonth() + 1);
        return d;
    }

    function evalExpression(expr) {
        if (!expr || typeof expr !== 'string') return expr;
        if (!expr.startsWith('=')) return expr;
        try {
            const sanitized = expr.slice(1).replace(/[^0-9+\-*/().]/g, '');
            if (!sanitized) return '';
            const result = Function('"use strict"; return (' + sanitized + ')')();
            if (typeof result === 'number' && !isNaN(result)) return result;
            return expr;
        } catch (e) { return expr; }
    }

    // 网络状态检测
    function updateNetworkStatus(isOnline) {
        state.isOnline = isOnline;
        const statusEl = document.getElementById('networkStatus');
        if (!statusEl) return;
        if (isOnline) {
            statusEl.textContent = '🟢 在线';
            statusEl.className = 'network-status online';
        } else {
            statusEl.textContent = '🔴 离线';
            statusEl.className = 'network-status offline';
            setStatus('⚠️ 网络连接已断开，数据无法保存！');
        }
    }

    // 定期心跳检测（每10秒检测一次）
    let heartbeatInterval;
    function startHeartbeat() {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(async () => {
            try {
                await fetch('/api/auth/check', { credentials: 'include', signal: AbortSignal.timeout(3000) });
                if (!state.isOnline) updateNetworkStatus(true);
            } catch {
                if (state.isOnline) updateNetworkStatus(false);
            }
        }, 10000);
    }

    // 监听浏览器在线状态
    window.addEventListener('online', () => updateNetworkStatus(true));
    window.addEventListener('offline', () => updateNetworkStatus(false));

    // 流量统计
    const trafficStats = {
        uploadBytes: 0,
        downloadBytes: 0,
        uploadWindow: [],
        downloadWindow: [],
        lastUpdateTime: Date.now()
    };

    function formatTrafficSpeed(bytes) {
        if (bytes < 1024) return bytes.toFixed(0) + ' B/s';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB/s';
        return (bytes / 1024 / 1024).toFixed(2) + ' MB/s';
    }

    function addUploadTraffic(bytes) {
        trafficStats.uploadBytes += bytes;
        trafficStats.uploadWindow.push({ bytes, time: Date.now() });
    }

    function addDownloadTraffic(bytes) {
        trafficStats.downloadBytes += bytes;
        trafficStats.downloadWindow.push({ bytes, time: Date.now() });
    }

    function updateTrafficDisplay() {
        const now = Date.now();
        const windowMs = 2000;
        // 清理2秒前的数据
        while (trafficStats.uploadWindow.length > 0 && now - trafficStats.uploadWindow[0].time > windowMs) {
            trafficStats.uploadWindow.shift();
        }
        while (trafficStats.downloadWindow.length > 0 && now - trafficStats.downloadWindow[0].time > windowMs) {
            trafficStats.downloadWindow.shift();
        }
        // 计算2秒平均速度，转换为每秒
        const uploadBytes = trafficStats.uploadWindow.reduce((sum, x) => sum + x.bytes, 0);
        const downloadBytes = trafficStats.downloadWindow.reduce((sum, x) => sum + x.bytes, 0);
        const uploadSpeed = uploadBytes / (windowMs / 1000);
        const downloadSpeed = downloadBytes / (windowMs / 1000);
        const uploadEl = document.getElementById('uploadSpeed');
        const downloadEl = document.getElementById('downloadSpeed');
        if (uploadEl) uploadEl.textContent = formatTrafficSpeed(uploadSpeed);
        if (downloadEl) downloadEl.textContent = formatTrafficSpeed(downloadSpeed);
    }
    setInterval(updateTrafficDisplay, 1000);

    // 拦截 fetch 统计流量
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const [input, init] = args;
        // 统计上传（请求体）
        if (init && init.body) {
            const bodyStr = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
            addUploadTraffic(new Blob([bodyStr]).size);
        }
        const response = await originalFetch.apply(this, args);
        // 统计下载（响应体）—— 克隆 response 以便读取
        try {
            const cloned = response.clone();
            const buf = await cloned.arrayBuffer();
            addDownloadTraffic(buf.byteLength);
        } catch(e) {}
        return response;
    };

    async function parseResponse(response) {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data.error) {
            throw new Error(data.error || `请求失败 (${response.status})`);
        }
        return data;
    }

    const API = {
        get: (url) => fetch('/api' + url, { credentials: 'include' }).then(parseResponse),
        post: (url, data) => fetch('/api' + url, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data)
        }).then(parseResponse),
        put: (url, data) => fetch('/api' + url, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(data)
        }).then(parseResponse),
        delete: (url) => fetch('/api' + url, { method: 'DELETE', credentials: 'include' }).then(parseResponse)
    };

    async function loadTabs() { state.tabs = await API.get('/tabs'); return state.tabs; }
    async function loadColumns(tabId) { state.columns = await API.get('/columns?tabId=' + tabId); return state.columns; }
    async function loadConditionalFormats(tabId) {
        state.conditionalFormats = await API.get('/conditional-formats?tabId=' + tabId);
        return state.conditionalFormats;
    }

    function isSharedTab() {
        const tab = state.tabs.find(t => t.id === state.currentTabId);
        return tab && tab.tab_type === 'shared';
    }
    function isSimpleTab() {
        const tab = state.tabs.find(t => t.id === state.currentTabId);
        return tab && tab.tab_type === 'simple';
    }

    // Server-only columns (inherited by client rows, not editable)
    const SERVER_ONLY_COLS = new Set(['provider', 'months', 'host_purchase', 'host_expire', 'host_remaining', 'expense', 'ip_info', 'address']);
    const CLIENT_INHERITED_COLS = new Set(['ip_address', 'password', 'domain', 'remark']);
    // 点击编辑后输入框按内容最大长度显示的列（非编辑时居中，编辑时展开）
    const EXPAND_COLS = new Set(['ip_address', 'password', 'domain', 'remark', 'client_name', 'unit_price']);
    // Client-only columns (only meaningful for client rows, empty/readonly on server rows)
    // client_purchase, client_expire, client_remaining, client_name, unit_price, fee, is_expired are used by both

    const contextMenu = $('#contextMenu');
    const ctxInsertAbove = $('#ctxInsertAbove');
    const ctxAddClient = $('#ctxAddClient');
    const ctxCopyClient = $('#ctxCopyClient');
    const ctxPasteClient = $('#ctxPasteClient');
    const ctxCopyServer = $('#ctxCopyServer');
    const ctxPasteServer = $('#ctxPasteServer');
    const ctxDeleteRecord = $('#ctxDeleteRecord');
    const ctxBatchPaste = $('#ctxBatchPaste');

    async function loadRecords(tabId) {
        await flushPendingSaves();
        // 构建 URL：把 filters 作为 JSON 传给后端
        const filtersParam = Object.keys(state.filters).length > 0
            ? '&filters=' + encodeURIComponent(JSON.stringify(state.filters)) : '';
        const result = await API.get('/records?tabId=' + tabId + '&page=' + state.page + '&pageSize=' + state.pageSize + filtersParam);
        state.records = result.records || [];
        state.total = result.total || 0;
        state.totalPages = result.totalPages || 1;
        updatePaginationUI();
        return state.records;
    }

    function updateTabCache(tabId) {
        if (!tabId) return;
        state.tabCache[tabId] = {
            columns: state.columns,
            total: state.total
        };
    }

    function invalidateTabCache(tabId) {
        if (!tabId) return;
        delete state.tabCache[tabId];
        delete state.tabFilters[tabId];
    }

    function invalidateCurrentTabCache() {
        invalidateTabCache(state.currentTabId);
    }

    function updatePaginationUI() {
        if (!paginationInfo) return;
        const start = (state.page - 1) * state.pageSize + 1;
        const end = Math.min(state.page * state.pageSize, state.total);
        paginationInfo.textContent = state.total > 0 ? `第 ${start}-${end} 条，共 ${state.total} 条` : '共 0 条';
        if (pageIndicator) pageIndicator.textContent = `${state.page} / ${state.totalPages}`;
        if (firstPageBtn) firstPageBtn.disabled = state.page <= 1;
        if (prevPageBtn) prevPageBtn.disabled = state.page <= 1;
        if (nextPageBtn) nextPageBtn.disabled = state.page >= state.totalPages;
        if (lastPageBtn) lastPageBtn.disabled = state.page >= state.totalPages;
        if (pageJumpInput) { pageJumpInput.max = state.totalPages; pageJumpInput.value = state.page; }
    }

    function updateAllFilterOptions(records) {
        const data = records || state.records;
        state.columns.forEach(col => {
            const valueCountMap = new Map();
            data.forEach(r => {
                const dv = normalizeFilterValue(getDisplayValue(r, col));
                valueCountMap.set(dv, (valueCountMap.get(dv) || 0) + 1);
            });
            state.filterOptions[col.col_key] = Array.from(valueCountMap.entries())
                .map(([val, cnt]) => ({ value: val, count: cnt }))
                .sort((a, b) => String(a.value).localeCompare(String(b.value)));
        });
    }

    function updateFilterOptionsForCol(colKey, records) {
        const col = state.columns.find(c => c.col_key === colKey);
        if (!col) return;
        const data = records || state.records;
        const valueCountMap = new Map();
        data.forEach(r => {
            const dv = normalizeFilterValue(getDisplayValue(r, col));
            valueCountMap.set(dv, (valueCountMap.get(dv) || 0) + 1);
        });
        state.filterOptions[colKey] = Array.from(valueCountMap.entries())
            .map(([val, cnt]) => ({ value: val, count: cnt }))
            .sort((a, b) => String(a.value).localeCompare(String(b.value)));
    }

    async function loadDataForTab(tabId, force = false) {
        try {
            state.page = 1;
            // 并行加载列定义和记录
            const [columns] = await Promise.all([
                force || !state.columnsCache[tabId]
                    ? API.get('/columns?tabId=' + tabId)
                    : Promise.resolve(state.columnsCache[tabId]),
                loadRecords(tabId),
                loadConditionalFormats(tabId)
            ]);
            state.columns = columns;
            state.columnsCache[tabId] = columns;
            updateTabCache(tabId);
            setStatus('已加载 ' + state.records.length + ' 条记录（共 ' + state.total + ' 条）');
        }
        catch (err) { setStatus('加载失败: ' + err.message); }
    }

    function renderTabs() {
        let html = '';
        state.tabs.forEach(tab => {
            const active = tab.id === state.currentTabId ? 'active' : '';
            const checked = state.selectedTabs.has(tab.id) ? 'checked' : '';
            const checkbox = state.tabManageMode
                ? `<input type="checkbox" class="tab-select" data-tab-id="${tab.id}" ${checked} />`
                : '';
            const draggable = state.tabManageMode ? 'draggable="true"' : '';
            html += `<button class="tab-item ${active}" data-tab-id="${tab.id}" ${draggable}>
                ${checkbox}
                <span class="tab-name" data-id="${tab.id}">${escapeHtml(tab.name)}</span>
            </button>`;
        });
        tabBar.innerHTML = html;
        if (manageTabsBtn) {
            manageTabsBtn.classList.toggle('active', state.tabManageMode);
            manageTabsBtn.textContent = state.tabManageMode ? '完成' : '管理';
        }
        const tabBarEl = document.querySelector('.tab-bar');
        if (tabBarEl) tabBarEl.classList.toggle('drag-active', state.tabManageMode);
        if (state.tabManageMode) initTabDragDrop();
        tabBar.querySelectorAll('.tab-select').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const tabId = parseInt(this.dataset.tabId);
                if (this.checked) state.selectedTabs.add(tabId);
                else state.selectedTabs.delete(tabId);
            });
        });
        tabBar.querySelectorAll('.tab-name').forEach(el => {
            el.addEventListener('dblclick', async function(e) {
                e.stopPropagation();
                const tabId = parseInt(this.dataset.id);
                openRenameTabModal(tabId);
            });
        });
        tabBar.querySelectorAll('.tab-item').forEach(btn => {
            btn.addEventListener('click', function(e) {
                if (e.target.classList.contains('tab-select')) return;
                switchTab(parseInt(this.dataset.tabId));
            });
        });
        if (state.tabs.length === 0) createDefaultTab();
    }

    async function switchTab(tabId, force = false) {
        if (tabId === state.currentTabId && !force) return;
        showTableLoading();
        // 保存当前标签的筛选状态到内存和 localStorage
        if (state.currentTabId) {
            state.tabFilters[state.currentTabId] = { ...state.filters };
            saveTabFiltersToStorage();
        }
        state.currentTabId = tabId;
        state.selectedRows.clear();
        state.page = 1;
        // 切换标签时重置剪切/复制状态
        state.copiedClientRecordId = null;
        state.copiedServerData = null;
        // 恢复目标标签的筛选状态
        state.filters = state.tabFilters[tabId] ? { ...state.tabFilters[tabId] } : {};
        renderTabs();
        await loadDataForTab(tabId, force);
        // 确保服务商选项已加载（避免切换标签后选项为空）
        if (!state.providerOptions.length) await loadProviderOptions();
        renderTable(false);
        hideTableLoading();
        const currentTab = state.tabs.find(t => t.id === tabId);
        if (currentTab) document.getElementById('columnModalTabName').textContent = currentTab.name;
    }

    function saveTabFiltersToStorage() {
        try {
            if (state.userId) {
                localStorage.setItem('tabFilters_' + state.userId, JSON.stringify(state.tabFilters));
            }
        } catch(e) {}
    }

    async function createTab(name, tabType) {
        const result = await API.post('/tabs', { name, tab_type: tabType || 'dedicated' });
        if (result.success) {
            state.tabs.push({ id: result.id, name, tab_type: result.tab_type || tabType || 'dedicated' });
            renderTabs();
            switchTab(result.id, true);
        }
    }
    async function createDefaultTab() { await createTab('默认'); }
    async function deleteTabs(tabIds) {
        if (!tabIds || tabIds.length === 0) { setStatus('⚠️ 请先在管理模式中勾选标签'); return; }
        if (!await showConfirm(`确定删除 ${tabIds.length} 个标签及其所有数据吗？`)) return;
        try {
            setStatus('🔄 删除标签中...');
            const oldCurrentTabId = state.currentTabId;
            await Promise.all(tabIds.map(tabId => API.delete('/tabs/' + tabId)));
            tabIds.forEach(tabId => {
                invalidateTabCache(tabId);
                state.selectedTabs.delete(tabId);
            });
            state.tabs = state.tabs.filter(t => !tabIds.includes(t.id));
            const wasCurrentTabDeleted = tabIds.includes(oldCurrentTabId);
            if (!state.tabs.some(t => t.id === state.currentTabId)) {
                state.currentTabId = state.tabs.length > 0 ? state.tabs[0].id : null;
            }
            renderTabs();
            if (state.currentTabId) {
                if (!wasCurrentTabDeleted && oldCurrentTabId === state.currentTabId) {
                    await loadDataForTab(state.currentTabId, true);
                    renderTable(false);
                } else {
                    await switchTab(state.currentTabId, true);
                }
            }
            else await createDefaultTab();
            setStatus(`✅ 已删除 ${tabIds.length} 个标签`);
        } catch (err) { setStatus('❌ 删除标签失败: ' + err.message); }
    }
    addTabBtn.addEventListener('click', () => {
        state.renameTabId = null;
        renameTabModalTitle.textContent = '添加标签';
        renameTabForm.style.display = 'none';
        addTabForm.style.display = 'block';
        newTabNameInput.value = '新标签';
        newTabStatus.textContent = '';
        renameTabModal.classList.add('show');
        setTimeout(() => { newTabNameInput.select(); newTabNameInput.focus(); }, 0);
    });
    manageTabsBtn.addEventListener('click', () => {
        state.tabManageMode = !state.tabManageMode;
        if (!state.tabManageMode) state.selectedTabs.clear();
        renderTabs();
    });
    deleteTabsBtn.addEventListener('click', () => deleteTabs(Array.from(state.selectedTabs)));

    function openRenameTabModal(tabId) {
        const tab = state.tabs.find(t => t.id === tabId);
        if (!tab) return;
        state.renameTabId = tabId;
        renameTabModalTitle.textContent = '编辑标签名称';
        renameTabForm.style.display = 'block';
        addTabForm.style.display = 'none';
        renameTabInput.value = tab.name;
        renameTabStatus.textContent = '';
        renameTabModal.classList.add('show');
        setTimeout(() => { renameTabInput.select(); renameTabInput.focus(); }, 0);
    }

    function closeRenameModal() {
        renameTabModal.classList.remove('show');
        renameTabStatus.textContent = '';
    }

    async function saveRenameTab() {
        const name = renameTabInput.value.trim();
        if (!name) { renameTabStatus.textContent = '⚠️ 标签名称不能为空'; return; }
        try {
            if (state.renameTabId) {
                await API.put('/tabs/' + state.renameTabId, { name });
                const tab = state.tabs.find(t => t.id === state.renameTabId);
                if (tab) tab.name = name;
                renderTabs();
                closeRenameModal();
                setStatus('✅ 标签名称已更新');
            } else {
                await createTab(name);
                closeRenameModal();
                setStatus('✅ 标签已添加');
            }
        } catch (err) { renameTabStatus.textContent = '❌ 保存失败: ' + err.message; }
    }

    closeRenameTabModal.addEventListener('click', closeRenameModal);
    cancelRenameTabBtn.addEventListener('click', closeRenameModal);
    cancelNewTabBtn.addEventListener('click', closeRenameModal);
    saveRenameTabBtn.addEventListener('click', saveRenameTab);
    renameTabInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveRenameTab();
        if (e.key === 'Escape') closeRenameModal();
    });

    async function saveNewTab() {
        const name = newTabNameInput.value.trim();
        if (!name) { newTabStatus.textContent = '标签名称不能为空'; return; }
        const typeRadio = document.querySelector('input[name="tabType"]:checked');
        const tabType = typeRadio ? typeRadio.value : 'dedicated';
        try {
            await createTab(name, tabType);
            closeRenameModal();
            setStatus('标签已添加');
        } catch (err) { newTabStatus.textContent = '保存失败: ' + err.message; }
    }
    saveNewTabBtn.addEventListener('click', saveNewTab);
    newTabNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveNewTab();
        if (e.key === 'Escape') closeRenameModal();
    });

    // --- 标签拖拽排序 ---
    let dragTabId = null;

    function initTabDragDrop() {
        const tabBar = document.querySelector('.tab-bar');
        if (!tabBar) return;

        // 使用事件委托，避免 cloneNode 丢失事件监听器
        if (tabBar._dragBound) return;
        tabBar._dragBound = true;

        tabBar.addEventListener('dragstart', function(e) {
            const tabItem = e.target.closest('.tab-item');
            if (!tabItem || !state.tabManageMode) {
                e.preventDefault();
                return;
            }
            dragTabId = parseInt(tabItem.dataset.tabId);
            tabItem.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(dragTabId));
        });

        tabBar.addEventListener('dragend', function(e) {
            document.querySelectorAll('.tab-item.dragging').forEach(el => el.classList.remove('dragging'));
            document.querySelectorAll('.tab-item.drag-over').forEach(el => el.classList.remove('drag-over'));
            dragTabId = null;
        });

        tabBar.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            const tabItem = e.target.closest('.tab-item');
            if (!tabItem || !state.tabManageMode) return;
            document.querySelectorAll('.tab-item.drag-over').forEach(el => el.classList.remove('drag-over'));
            tabItem.classList.add('drag-over');
        });

        tabBar.addEventListener('dragleave', function(e) {
            const tabItem = e.target.closest('.tab-item');
            if (tabItem) tabItem.classList.remove('drag-over');
        });

        tabBar.addEventListener('drop', async function(e) {
            e.preventDefault();
            document.querySelectorAll('.tab-item.drag-over').forEach(el => el.classList.remove('drag-over'));
            
            if (!state.tabManageMode) return;
            
            const tabItem = e.target.closest('.tab-item');
            if (!tabItem) return;
            
            const targetTabId = parseInt(tabItem.dataset.tabId);
            if (!dragTabId || dragTabId === targetTabId) {
                dragTabId = null;
                return;
            }

            const fromIdx = state.tabs.findIndex(t => t.id === dragTabId);
            const toIdx = state.tabs.findIndex(t => t.id === targetTabId);
            if (fromIdx < 0 || toIdx < 0) {
                dragTabId = null;
                return;
            }

            const [moved] = state.tabs.splice(fromIdx, 1);
            state.tabs.splice(toIdx, 0, moved);
            renderTabs();

            try {
                const tabIds = state.tabs.map(t => t.id);
                await API.post('/tabs/reorder', { tabIds });
            } catch (err) { 
                setStatus('排序保存失败: ' + err.message); 
            } finally {
                dragTabId = null;
            }
        });
    }

    function normalizeFilterValue(value) {
        if (value === null || value === undefined || String(value).trim() === '') return '(空白)';
        return String(value).trim();
    }
    function isFilterActive(colKey) { return state.filters.hasOwnProperty(colKey); }
    function recordMatchesFilter(record, colKey, selectedValues) {
        const col = state.columns.find(c => c.col_key === colKey);
        if (!col) return true;
        return selectedValues.includes(normalizeFilterValue(getDisplayValue(record, col)));
    }
    function getFilteredRecords() {
        const records = state.records;
        if (!isSharedTab()) return records;
        const servers = records.filter(r => r.record_type === 'server').sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
        const clients = records.filter(r => r.record_type === 'client');
        const result = [];
        servers.forEach(server => {
            result.push(server);
            const serverClients = clients.filter(c => c.parent_id === server.id).sort((a, b) => (a.sort_order - b.sort_order) || (a.id - b.id));
            result.push(...serverClients);
        });
        return result;
    }

    // 渲染表格（刷新时不自动适配列宽）
    function renderTable(shouldAutoFit = false) {
        if (!state.currentTabId) return;
        const visibleColumns = state.columns.filter(c => c.col_visible !== 0);
        const filteredRecords = getFilteredRecords();

        let theadHtml = `<tr>${state.rowManageMode ? '<th style="width:36px;min-width:36px;max-width:36px;text-align:center;"><input type="checkbox" id="selectAll" /></th>' : ''}`;
        visibleColumns.forEach(col => {
            const isIncome = col.is_income || 0;
            let incomeLabel = isIncome === 1 ? '💰' : (isIncome === 2 ? '💸' : '');
            const hasFilter = isFilterActive(col.col_key) ? 'filter-active' : '';
            const savedWidth = col.col_width;
            const width = shouldAutoFit || !savedWidth || savedWidth === 150
                ? calcColumnWidth(col)
                : savedWidth;
            const displayName = getColumnDisplayName(col);
            theadHtml += `
                <th data-col="${escapeAttr(col.col_key)}" style="width:${width}px;min-width:${width}px;max-width:${width}px;">
                    <div class="th-inner">
                        <span class="col-name">${displayName} ${incomeLabel}</span>
                        <button class="col-dropdown-btn ${hasFilter}" data-col="${escapeAttr(col.col_key)}">▼</button>
                    </div>
                    <div class="col-resize" data-col="${escapeAttr(col.col_key)}"></div>
                </th>
            `;
        });
        theadHtml += '</tr>';
        tableHead.innerHTML = theadHtml;

        if (filteredRecords.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="${visibleColumns.length + (state.rowManageMode ? 1 : 0)}" style="text-align:center;padding:40px 0;color:#999;">暂无数据</td></tr>`;
            recordCount.textContent = Object.keys(state.filters).length > 0 ? `共 0 / 全部 ${state.records.length} 条记录` : `共 0 条记录`;
            bindFilterEvents();
            return;
        }

        let tbodyHtml = '';
        filteredRecords.forEach((record) => {
            const isSelected = state.selectedRows.has(record.id);
            const isClient = record.record_type === 'client';
            const isServer = !isClient && isSharedTab();
            const hasChildren = isServer && state.records.some(r => r.parent_id === record.id);
            const isCut = state.copiedClientRecordId === record.id;
            const cutClass = isCut ? ' cut-pending' : '';
            tbodyHtml += `<tr class="${isSelected ? 'selected' : ''} ${isClient ? 'client-row' : ''} ${isServer ? 'server-row' : ''} ${hasChildren ? 'has-children' : ''}${cutClass}" data-id="${record.id}" data-type="${record.record_type || 'server'}" data-parent="${record.parent_id || ''}">`;
            if (state.rowManageMode) {
                tbodyHtml += `<td><input type="checkbox" class="row-checkbox" data-id="${record.id}" ${isSelected ? 'checked' : ''} /></td>`;
            }
            visibleColumns.forEach(col => {
                const colKey = col.col_key;
                const val = record.data[colKey] || '';
                let inputHtml = '';
                const isServerOnlyCol = SERVER_ONLY_COLS.has(colKey);
                const CLIENT_DATE_COLS = new Set(['client_purchase', 'client_expire', 'client_remaining']);

                // Client row: server columns show empty (inherited from parent, not editable)
                if (isClient && isServerOnlyCol) {
                    tbodyHtml += `<td class="inherited-cell"></td>`;
                    return;
                }
                // Client row in shared tab: ip_address/password/domain/remark inherited from server, gray and not editable
                if (isClient && isSharedTab() && CLIENT_INHERITED_COLS.has(colKey)) {
                    const displayVal = colKey === 'password' && val ? '***' : val;
                    tbodyHtml += `<td class="inherited-cell">${escapeHtml(String(displayVal))}</td>`;
                    return;
                }
                // Server row in shared tab: client date columns sync from host, not editable
                if (isServer && CLIENT_DATE_COLS.has(colKey)) {
                    let syncVal = '';
                    if (colKey === 'client_purchase') syncVal = getDisplayValue(record, { ...col, col_key: 'host_purchase' });
                    else if (colKey === 'client_expire') syncVal = getDisplayValue(record, { ...col, col_key: 'host_expire' });
                    else if (colKey === 'client_remaining') syncVal = getDisplayValue(record, { ...col, col_key: 'host_remaining' });
                    tbodyHtml += `<td class="inherited-cell">${escapeHtml(String(syncVal))}</td>`;
                    return;
                }

                if (col.col_type === 'days_remaining') {
                    let dateKey = colKey === 'host_remaining' ? 'host_expire' : (colKey === 'client_remaining' ? 'client_expire' : '');
                    const days = computeDaysRemaining(record.data[dateKey]);
                    const displayVal = days !== '' ? days + ' 天' : '';
                    const fmt = getConditionalFormat(colKey, days);
                    let color, style;
                    if (fmt) {
                        color = fmt.text_color || '';
                        style = applyFormatStyle(fmt);
                    } else {
                        if (days <= 3) {
                            color = '#dc143c';
                            style = 'color:#dc143c;font-weight:bold;';
                        } else if (days <= 5) {
                            color = '#ffa500';
                            style = 'color:#ffa500;font-weight:bold;';
                        } else {
                            color = '#333';
                            style = '';
                        }
                    }
                    const styleAttr = style ? ` style="${style}"` : '';
                    inputHtml = `<span${styleAttr}>${escapeHtml(displayVal)}</span>`;
                } else if (colKey === 'ip_info') {
                    const ipVal = record.data.ip_address || '';
                    const fmt = getConditionalFormat(colKey, ipVal);
                    const fmtStyle = applyFormatStyle(fmt);
                    const cellStyle = `cursor:pointer;${fmtStyle || ''}`;
                    inputHtml = `<span class="ip-info-cell" data-id="${record.id}" style="${cellStyle}">${escapeHtml(ipVal)}${ipVal ? ' 🔗' : ''}</span>`;
                } else if (col.col_type === 'address_select') {
                    const optionsArr = col.col_options || [];
                    const options = optionsArr.map(opt => {
                        let display = opt;
                        if (opt === 'IP地址') display = 'IP';
                        else if (opt === '域名地址') display = '域名';
                        return `<option value="${escapeAttr(opt)}" ${val === opt ? 'selected' : ''}>${escapeHtml(display)}</option>`;
                    }).join('');
                    const addressValue = val || '';
                    const fmt = getConditionalFormat(colKey, val);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `
                        <div class="address-control">
                            <select class="cell-input address-select" data-col="${escapeAttr(colKey)}" data-id="${record.id}"${styleAttr}>${options}</select>
                            <button class="open-link" data-address="${escapeAttr(addressValue)}" data-ip="${escapeAttr(record.data.ip_address || '')}" data-domain="${escapeAttr(record.data.domain || '')}">打开</button>
                        </div>
                    `;
                } else if (col.col_type === 'number' && colKey === 'months') {
                    const num = parseInt(val) || 0;
                    const fmt = getConditionalFormat(colKey, num);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `
                        <div class="months-control">
                            <button class="months-dec" data-col="${escapeAttr(colKey)}" data-id="${record.id}">-</button>
                            <input type="number" class="cell-input months-input" data-col="${escapeAttr(colKey)}" data-id="${record.id}" value="${num}" min="0" step="1"${styleAttr} />
                            <button class="months-inc" data-col="${escapeAttr(colKey)}" data-id="${record.id}">+</button>
                        </div>
                    `;
                } else if (col.col_type === 'date') {
                    const dateVal = val || '';
                    const emptyClass = !dateVal ? ' date-empty' : '';
                    const fmt = getConditionalFormat(colKey, dateVal);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    if (colKey === 'host_expire') {
                        const display = formatDisplayDate(dateVal);
                        inputHtml = `<div class="date-cell date-readonly${emptyClass}" data-id="${record.id}" data-col="${escapeAttr(colKey)}"><span style="cursor:default;${fmtStyle}">${escapeHtml(display || '-')}</span></div>`;
                    } else {
                        const displayVal = formatDisplayDate(dateVal);
                        inputHtml = `<div class="date-cell${emptyClass}" data-id="${record.id}" data-col="${escapeAttr(colKey)}"><input type="text" class="cell-input date-text-input" data-col="${escapeAttr(colKey)}" data-id="${record.id}" value="${escapeAttr(displayVal)}" placeholder="点击设置" autocomplete="off"${styleAttr} /><input type="date" class="date-picker-hidden" data-col="${escapeAttr(colKey)}" data-id="${record.id}" value="${escapeAttr(dateVal)}" tabindex="-1" /><button class="date-picker-btn" data-col="${escapeAttr(colKey)}" data-id="${record.id}" title="选择日期" tabindex="-1">📅</button></div>`;
                    }
                } else if (colKey === 'provider') {
                    const currentProvider = val || '';
                    const providerOptions = [...state.providerOptions];
                    if (currentProvider && !providerOptions.includes(currentProvider)) providerOptions.push(currentProvider);
                    const options = providerOptions.map(opt => `
                        <div class="provider-search-option" data-value="${escapeAttr(opt)}">
                            <span>${escapeHtml(opt)}</span>
                            <small>${escapeHtml(getChineseInitials(opt))}</small>
                        </div>
                    `).join('');
                    const fmt = getConditionalFormat(colKey, currentProvider);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `
                        <div class="provider-search-box" data-id="${record.id}" data-col="${escapeAttr(colKey)}">
                            <input type="text" class="cell-input provider-search-input" data-col="${escapeAttr(colKey)}" data-id="${record.id}" value="${escapeAttr(currentProvider)}" placeholder="搜索服务商" autocomplete="off"${styleAttr} />
                            <div class="provider-search-dropdown">${options}<div class="provider-search-empty">暂无匹配服务商</div></div>
                        </div>
                    `;
                } else if (col.col_type === 'select') {
                    const options = (col.col_options || []).map(opt => `<option value="${escapeAttr(opt)}" ${val === opt ? 'selected' : ''}>${escapeHtml(opt)}</option>`).join('');
                    const fmt = getConditionalFormat(colKey, val);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `<select class="cell-input select-cell" data-col="${escapeAttr(colKey)}" data-id="${record.id}"${styleAttr}><option value="">-</option>${options}</select>`;
                } else if (colKey === 'is_expired') {
                    let status;
                    if (record.record_type === 'client') {
                        status = checkExpired(record.data.client_expire);
                    } else {
                        const hostRemaining = computeDaysRemaining(record.data.host_expire);
                        if (hostRemaining === '') { status = '未知'; }
                        else { status = hostRemaining >= 0 ? '有效' : '过期'; }
                    }
                    const fmt = getConditionalFormat(colKey, status);
                    let color = status === '有效' ? '#67c23a' : (status === '过期' ? '#f56c6c' : '#999');
                    let style = `color:${color};`;
                    if (fmt) {
                        style = applyFormatStyle(fmt) || style;
                    }
                    inputHtml = `<span style="${style}">${escapeHtml(status)}</span>`;
                } else if (colKey === 'expense') {
                    if (isSimpleTab()) {
                        const expenseTotal = record._expenseTotal || 0;
                        const displayText = expenseTotal > 0 ? Math.round(expenseTotal) : '0';
                        const fmt = getConditionalFormat(colKey, expenseTotal);
                        const fmtStyle = applyFormatStyle(fmt);
                        const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                        inputHtml = `
                            <div class="fee-summary-cell expense-summary-cell" data-id="${record.id}">
                                <span${styleAttr}>${escapeHtml(displayText)}</span>
                                <span class="fee-add-icon">+</span>
                            </div>
                        `;
                    } else {
                        const rawValue = val || '';
                        const months = parseInt(record.data.months) || 0;
                        const displayValue = Math.round(computeExpenseValue(rawValue, months));
                        const fmt = getConditionalFormat(colKey, displayValue);
                        const fmtStyle = applyFormatStyle(fmt);
                        const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                        inputHtml = `
                            <div class="expense-inline">
                                <span class="expense-display"${styleAttr}>${displayValue}</span>
                                <input type="text" class="cell-input expense-input" value="${escapeAttr(rawValue)}" style="display:none;" />
                            </div>
                        `;
                    }
                } else if (colKey === 'fee') {
                    const incomeTotal = record._incomeTotal || 0;
                    const displayText = incomeTotal > 0 ? Math.round(incomeTotal) : '0';
                    const fmt = getConditionalFormat(colKey, incomeTotal);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `
                        <div class="fee-summary-cell" data-id="${record.id}">
                            <span${styleAttr}>${escapeHtml(displayText)}</span>
                            <span class="fee-add-icon">+</span>
                        </div>
                    `;
                } else if (colKey === 'password') {
                    const isEmpty = !val;
                    const displayMask = val ? '***' : '✎ 点击设置';
                    const emptyClass = isEmpty ? ' password-empty' : '';
                    const fmt = getConditionalFormat(colKey, val);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `<div class="password-cell" data-id="${record.id}" data-col="password"><span class="password-mask${emptyClass}"${styleAttr}>${escapeHtml(displayMask)}</span><input type="text" class="cell-input password-input" data-col="password" data-id="${record.id}" value="${escapeAttr(val || '')}" /></div>`;
                } else {
                    const inputType = col.col_type === 'number' ? 'number' : 'text';
                    const step = col.col_type === 'number' ? 'step="0.01"' : '';
                    const expandClass = EXPAND_COLS.has(colKey) ? ' expand-on-focus' : '';
                    const fmt = getConditionalFormat(colKey, val);
                    const fmtStyle = applyFormatStyle(fmt);
                    const styleAttr = fmtStyle ? ` style="${fmtStyle}"` : '';
                    inputHtml = `<input type="${inputType}" class="cell-input${expandClass}" data-col="${escapeAttr(colKey)}" data-id="${record.id}" value="${escapeAttr(val || '')}" ${step}${styleAttr} />`;
                }
                const tdClass = (colKey === 'expense' || colKey === 'password' || EXPAND_COLS.has(colKey)) ? 'editable-td' : '';
                tbodyHtml += `<td class="${tdClass}">${inputHtml}</td>`;
            });
            tbodyHtml += '</tr>';
        });
        tableBody.innerHTML = tbodyHtml;
        recordCount.textContent = Object.keys(state.filters).length > 0 ? `筛选 ${filteredRecords.length} 条 / 共 ${state.total} 条` : `共 ${state.total} 条记录`;

        bindTableEvents();
        bindFilterEvents();
        bindSpecialEvents();

        if (shouldAutoFit) autoFitColumns();
    }

    function autoFitColumns() {
        const table = document.getElementById('dataTable');
        if (!table) return;
        table.querySelectorAll('th').forEach((th, index) => {
            if (index === 0) return;
            const colKey = th.dataset.col;
            const col = state.columns.find(c => c.col_key === colKey);
            if (!col) return;
            const width = calcColumnWidth(col);
            th.style.width = width + 'px';
            th.style.minWidth = width + 'px';
            col.col_width = width;
            API.put('/columns/' + col.id, { col_width: width }).catch(() => {});
        });
    }

    // --- 筛选面板动态生成 ---
    function getOrCreateFilterPanel(colKey) {
        let panel = document.querySelector(`.col-dropdown-panel[data-col="${colKey}"]`);
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'col-dropdown-panel';
            panel.dataset.col = colKey;
            panel.innerHTML = `
                <div class="filter-input-wrap">
                    <input type="text" placeholder="搜索..." class="filter-search" data-col="${escapeAttr(colKey)}" />
                </div>
                <div class="filter-options"></div>
                <div class="filter-summary">已选 0 / 0</div>
                <div class="filter-actions">
                    <div class="btn-row">
                        <button class="filter-ok" data-col="${escapeAttr(colKey)}">确定</button>
                        <button class="filter-cancel" data-col="${escapeAttr(colKey)}">取消</button>
                    </div>
                    <div class="btn-row full-width">
                        <button class="filter-clear" data-col="${escapeAttr(colKey)}">清除筛选</button>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
        }
        return panel;
    }

    async function refreshFilterPanelContent(panel, colKey) {
        // 从后端获取该列的全部去重值和计数
        let options = [];
        try {
            const filtersParam = Object.keys(state.filters).length > 0
                ? '&filters=' + encodeURIComponent(JSON.stringify(state.filters)) : '';
            options = await API.get('/records/filter-options?tabId=' + state.currentTabId + '&colKey=' + encodeURIComponent(colKey) + filtersParam);
        } catch (e) {
            setStatus('加载筛选选项失败');
            return;
        }
        const optionsHtml = options.map(opt => `
            <label class="filter-option-label" data-filter-label="${escapeHtml(String(opt.value).toLowerCase())}">
                <input type="checkbox" class="filter-option" data-col="${escapeAttr(colKey)}" value="${escapeAttr(opt.value)}" />
                <span class="filter-option-text">${escapeHtml(opt.value)}</span>
                <span class="filter-count">(${opt.count})</span>
            </label>
        `).join('');

        const allHtml = `
            <label class="filter-option-label filter-select-all">
                <input type="checkbox" class="filter-select-all-checkbox" data-col="${escapeAttr(colKey)}" /> <span class="filter-option-text">全选</span>
            </label>
            ${optionsHtml}
        `;
        panel.querySelector('.filter-options').innerHTML = allHtml;
        panel.querySelector('.filter-summary').textContent = `已选 0 / ${options.length}`;

        const allCheckboxes = Array.from(panel.querySelectorAll('.filter-option:not(.filter-select-all-checkbox)'));
        const selected = isFilterActive(colKey) ? state.filters[colKey] : allCheckboxes.map(cb => cb.value);
        allCheckboxes.forEach(cb => { cb.checked = selected.includes(cb.value); });
        updateSelectAllCheckbox(panel);
    }

    function positionFilterPanel(panel, colKey) {
        const th = document.querySelector(`th[data-col="${colKey}"]`);
        if (!th) return;
        const rect = th.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 800;
        const panelWidth = Math.min(Math.max(rect.width, 180), Math.max(180, viewportWidth - 16));
        const maxLeft = Math.max(8, viewportWidth - panelWidth - 8);
        const left = Math.min(Math.max(8, rect.left), maxLeft);
        const top = Math.min(rect.bottom + 2, Math.max(8, viewportHeight - 300));
        panel.style.position = 'fixed';
        panel.style.left = left + 'px';
        panel.style.top = top + 'px';
        panel.style.width = panelWidth + 'px';
        panel.style.maxHeight = '280px';
        panel.style.overflowY = 'auto';
        panel.style.zIndex = '10000';
    }

    function closeFilterPanels() {
        $$('.col-dropdown-panel.show').forEach(p => p.classList.remove('show'));
    }

    function getVisibleFilterOptions(panel) {
        return Array.from(panel.querySelectorAll('.filter-option-label'))
            .filter(label => label.style.display !== 'none' && !label.classList.contains('filter-select-all'))
            .map(label => label.querySelector('.filter-option'))
            .filter(Boolean);
    }

    function updateSelectAllCheckbox(panel) {
        const allCb = panel.querySelector('.filter-select-all-checkbox');
        if (!allCb) return;
        const visibleOptions = getVisibleFilterOptions(panel);
        if (visibleOptions.length === 0) {
            allCb.checked = false;
            allCb.indeterminate = false;
            updateFilterSummary(panel);
            return;
        }
        const checkedCount = visibleOptions.filter(opt => opt.checked).length;
        allCb.checked = checkedCount === visibleOptions.length;
        allCb.indeterminate = checkedCount > 0 && checkedCount < visibleOptions.length;
        updateFilterSummary(panel);
    }

    // 修正后的计数：基于可见选项
    function updateFilterSummary(panel) {
        const summary = panel.querySelector('.filter-summary');
        if (!summary) return;
        const visibleOptions = getVisibleFilterOptions(panel);
        const total = visibleOptions.length;
        const checked = visibleOptions.filter(opt => opt.checked).length;
        summary.textContent = `已选 ${checked} / ${total}`;
    }

    function bindFilterEvents() {
        if (filterDocumentClickBound) return;
        filterDocumentClickBound = true;

        document.body.addEventListener('click', function(e) {
            if (e.target.classList.contains('col-dropdown-btn')) {
                e.stopPropagation();
                const colKey = e.target.dataset.col;
                const panel = getOrCreateFilterPanel(colKey);
                const isOpen = panel.classList.contains('show');
                closeFilterPanels();
                if (!isOpen) {
                    refreshFilterPanelContent(panel, colKey).then(() => {
                        positionFilterPanel(panel, colKey);
                        panel.classList.add('show');
                        const search = panel.querySelector('.filter-search');
                        if (search) setTimeout(() => search.focus(), 0);
                    });
                }
                return;
            }

            if (!e.target.closest('.col-dropdown-btn') && !e.target.closest('.col-dropdown-panel')) {
                closeFilterPanels();
            }

            if (e.target.classList.contains('filter-ok')) {
                const colKey = e.target.dataset.col;
                const panel = document.querySelector(`.col-dropdown-panel[data-col="${colKey}"]`);
                if (!panel) return;
                const searchInput = panel.querySelector('.filter-search');
                const searchText = searchInput ? searchInput.value.trim() : '';
                const allCbs = Array.from(panel.querySelectorAll('.filter-option:not(.filter-select-all-checkbox)'));
                const allValues = allCbs.map(cb => cb.value);

                let checkedValues;
                if (searchText === '') {
                    checkedValues = allCbs.filter(cb => cb.checked).map(cb => cb.value);
                } else {
                    const visibleCbs = allCbs.filter(cb => {
                        const label = cb.closest('.filter-option-label');
                        return label && label.style.display !== 'none';
                    });
                    checkedValues = visibleCbs.filter(cb => cb.checked).map(cb => cb.value);
                }

                if (checkedValues.length === 0) {
                    delete state.filters[colKey];
                } else if (searchText === '' && checkedValues.length === allValues.length) {
                    // 未搜索时全选等于不筛选
                    delete state.filters[colKey];
                } else {
                    state.filters[colKey] = checkedValues;
                }
                state.tabFilters[state.currentTabId] = { ...state.filters };
                saveTabFiltersToStorage();
                panel.classList.remove('show');
                // 筛选条件变更，重新从后端加载
                state.page = 1;
                loadRecords(state.currentTabId).then(() => renderTable(false));
                return;
            }

            if (e.target.classList.contains('filter-cancel')) {
                const panel = e.target.closest('.col-dropdown-panel');
                if (panel) panel.classList.remove('show');
                return;
            }

            if (e.target.classList.contains('filter-clear')) {
                const colKey = e.target.dataset.col;
                delete state.filters[colKey];
                state.tabFilters[state.currentTabId] = { ...state.filters };
                saveTabFiltersToStorage();
                const panel = document.querySelector(`.col-dropdown-panel[data-col="${colKey}"]`);
                if (panel) panel.classList.remove('show');
                state.page = 1;
                loadRecords(state.currentTabId).then(() => renderTable(false));
                return;
            }
        });

        document.body.addEventListener('change', function(e) {
            if (e.target.classList.contains('filter-select-all-checkbox')) {
                const panel = e.target.closest('.col-dropdown-panel');
                const visibleOptions = getVisibleFilterOptions(panel);
                visibleOptions.forEach(opt => { opt.checked = e.target.checked; });
                updateSelectAllCheckbox(panel);
            } else if (e.target.classList.contains('filter-option') && !e.target.classList.contains('filter-select-all-checkbox')) {
                updateSelectAllCheckbox(e.target.closest('.col-dropdown-panel'));
            }
        });

        // 搜索过滤：从后端搜索该列全部数据
        let searchTimer = null;
        document.body.addEventListener('input', function(e) {
            if (e.target.classList.contains('filter-search')) {
                const panel = e.target.closest('.col-dropdown-panel');
                if (!panel) return;
                const colKey = panel.dataset.col;
                const searchText = e.target.value.trim();

                // 保存当前勾选状态
                const checkedValues = new Set();
                panel.querySelectorAll('.filter-option:not(.filter-select-all-checkbox)').forEach(cb => {
                    if (cb.checked) checkedValues.add(cb.value);
                });

                // 防抖：300ms 后请求后端
                clearTimeout(searchTimer);
                searchTimer = setTimeout(async () => {
                    let options = [];
                    try {
                        const searchParam = searchText ? '&search=' + encodeURIComponent(searchText) : '';
                        // 传递当前已有的筛选条件给 filter-options API
                        const filtersParam = Object.keys(state.filters).length > 0
                            ? '&filters=' + encodeURIComponent(JSON.stringify(state.filters)) : '';
                        options = await API.get('/records/filter-options?tabId=' + state.currentTabId + '&colKey=' + encodeURIComponent(colKey) + searchParam + filtersParam);
                    } catch (e) { /* ignore */ }

                    const selectAllHtml = `
                        <label class="filter-option-label filter-select-all">
                            <input type="checkbox" class="filter-select-all-checkbox" data-col="${escapeAttr(colKey)}" /> <span class="filter-option-text">全选</span>
                        </label>
                    `;
                    const optionsHtml = options.map(opt => `
                        <label class="filter-option-label" data-filter-label="${escapeHtml(String(opt.value).toLowerCase())}">
                            <input type="checkbox" class="filter-option" data-col="${escapeAttr(colKey)}" value="${escapeAttr(opt.value)}" />
                            <span class="filter-option-text">${escapeHtml(opt.value)}</span>
                            <span class="filter-count">(${opt.count})</span>
                        </label>
                    `).join('');

                    panel.querySelector('.filter-options').innerHTML = selectAllHtml + optionsHtml;

                    // 恢复勾选状态
                    panel.querySelectorAll('.filter-option:not(.filter-select-all-checkbox)').forEach(cb => {
                        cb.checked = checkedValues.has(cb.value);
                    });

                    updateSelectAllCheckbox(panel);
                }, 300);
            }
        });
    }

    // 表格事件
    function bindTableEvents() {
        const selectAll = $('#selectAll');
        if (selectAll) {
            selectAll.onchange = function() {
                const checked = this.checked;
                $$('.row-checkbox').forEach(cb => cb.checked = checked);
                state.selectedRows.clear();
                if (checked) $$('.row-checkbox').forEach(cb => state.selectedRows.add(parseInt(cb.dataset.id)));
                updateRowSelection();
            };
        }
        $$('.row-checkbox').forEach(cb => {
            cb.onchange = function() {
                const id = parseInt(this.dataset.id);
                if (this.checked) state.selectedRows.add(id);
                else state.selectedRows.delete(id);
                updateRowSelection();
                if (selectAll) selectAll.checked = $$('.row-checkbox').length > 0 && Array.from($$('.row-checkbox')).every(c => c.checked);
            };
        });

        $$('.cell-input:not(.address-select):not(.provider-search-input):not(.months-input):not(.date-input):not(.date-text-input):not(.expense-input):not(.fee-input)').forEach(input => {
            input.onblur = () => handleCellChange(input);
            input.onkeydown = (e) => {
                if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            };
            if (input.tagName === 'SELECT') input.onchange = () => handleCellChange(input);
        });

        // --- 拖选粘贴功能（只初始化一次，避免重复绑定） ---
        if (!window._dragSelectBound) {
            window._dragSelectBound = true;
            window._dragSelect = { active: false, colKey: null, startRowId: null, endRowId: null, lastClickRowId: null, lastClickCol: null };

            // 拖选支持的输入框类型（已排除：地址选择、月数步进、支出/收入等计算列）
            // 包含：普通文本、数字、日期、密码、客户名、域名、备注等所有可编辑列
            function getTextInputCells() {
                return $$('input.cell-input:not(.address-select):not(.months-input):not(.expense-input):not(.fee-input):not(.provider-search-input):not(.date-text-input)');
            }
            function clearDragHighlight() {
                $$('.cell-input.drag-selected, .password-cell.drag-selected, .date-cell.drag-selected').forEach(el => el.classList.remove('drag-selected'));
            }

            function updateDragHighlight() {
                clearDragHighlight();
                var ds = window._dragSelect;
                if (!ds.colKey) return;
                const startId = ds.startRowId;
                const endId = ds.endRowId;
                if (!startId || !endId) return;
                const minId = Math.min(startId, endId);
                const maxId = Math.max(startId, endId);
                // 普通 input 单元格
                getTextInputCells().forEach(input => {
                    if (input.dataset.col !== ds.colKey) return;
                    const rowId = parseInt(input.dataset.id);
                    if (rowId >= minId && rowId <= maxId) {
                        input.classList.add('drag-selected');
                    }
                });
                // 密码单元格特殊处理（需要选整个 cell 而不是 input）
                if (ds.colKey === 'password') {
                    $$('.password-cell').forEach(cell => {
                        if (cell.dataset.col !== 'password') return;
                        const rowId = parseInt(cell.dataset.id);
                        if (rowId >= minId && rowId <= maxId) {
                            cell.classList.add('drag-selected');
                        }
                    });
                }
                // 日期单元格特殊处理（需要选整个 cell 而不是 input）
                if (ds.colKey === 'host_purchase' || ds.colKey === 'client_purchase' || ds.colKey === 'client_expire') {
                    $$('.date-cell').forEach(cell => {
                        if (cell.dataset.col !== ds.colKey) return;
                        const rowId = parseInt(cell.dataset.id);
                        if (rowId >= minId && rowId <= maxId) {
                            cell.classList.add('drag-selected');
                        }
                    });
                }
            }

            // 添加拖选粘贴的 CSS 样式
            const style = document.createElement('style');
            style.id = 'drag-select-style';
            style.textContent = `
                .cell-input.drag-selected {
                    outline: 2px solid #1890ff !important;
                    outline-offset: -2px;
                    background-color: #e6f7ff !important;
                }
                .password-cell.drag-selected {
                    outline: 2px solid #1890ff !important;
                    outline-offset: -2px;
                    background-color: #e6f7ff !important;
                }
                .date-cell.drag-selected {
                    outline: 2px solid #1890ff !important;
                    outline-offset: -2px;
                    background-color: #e6f7ff !important;
                }
                .date-cell.drag-selected .date-text-input {
                    background-color: #e6f7ff !important;
                }
            `;
            document.head.appendChild(style);

            // 使用事件委托监听 mousedown（避免 renderTable 后事件丢失）
            document.addEventListener('mousedown', function(e) {
                var ds = window._dragSelect;
                // 日历按钮点击不启动拖选
                if (e.target.closest('.date-picker-btn')) return;
                // 优先判断密码单元格
                let input = e.target.closest('.password-cell');
                if (input) {
                    const colKey = input.dataset.col;
                    const rowId = parseInt(input.dataset.id);
                    if (e.shiftKey && ds.lastClickRowId && ds.lastClickCol === colKey) {
                        window._dragSelect = { active: false, colKey, startRowId: ds.lastClickRowId, endRowId: rowId, lastClickRowId: ds.lastClickRowId, lastClickCol: colKey };
                        updateDragHighlight();
                        e.preventDefault();
                        return;
                    }
                    window._dragSelect = { active: true, colKey, startRowId: rowId, endRowId: rowId, lastClickRowId: rowId, lastClickCol: colKey };
                    updateDragHighlight();
                    return;
                }
                // 只读日期单元格不启动拖选
                let dateCell = e.target.closest('.date-cell.date-readonly');
                if (dateCell) return;
                input = e.target.closest('.cell-input');
                if (!input) {
                    // 点击非输入区域时清除选区
                    if (ds.startRowId && !ds.active) {
                        clearDragHighlight();
                        window._dragSelect = { active: false, colKey: null, startRowId: null, endRowId: null, lastClickRowId: null, lastClickCol: null };
                    }
                    return;
                }
                // 排除非文本输入类型
                if (input.classList.contains('address-select') ||
                    input.classList.contains('months-input') || input.classList.contains('expense-input') ||
                    input.classList.contains('fee-input') || input.classList.contains('provider-search-input')) return;
                const colKey = input.dataset.col;
                const rowId = parseInt(input.dataset.id);
                // Shift+Click：从上次点击到当前行范围选择
                if (e.shiftKey && ds.lastClickRowId && ds.lastClickCol === colKey) {
                    window._dragSelect = { active: false, colKey, startRowId: ds.lastClickRowId, endRowId: rowId, lastClickRowId: ds.lastClickRowId, lastClickCol: colKey };
                    updateDragHighlight();
                    e.preventDefault();
                    return;
                }
                window._dragSelect = { active: true, colKey, startRowId: rowId, endRowId: rowId, lastClickRowId: rowId, lastClickCol: colKey };
                updateDragHighlight();
            });

            // mousemove 检测拖动经过的单元格
            document.addEventListener('mousemove', function(e) {
                var ds = window._dragSelect;
                if (!ds.active) return;
                const el = document.elementFromPoint(e.clientX, e.clientY);
                if (!el) return;
                // 优先检查密码单元格
                let input = el.closest('.password-cell');
                if (input) {
                    if (input.dataset.col !== ds.colKey) return;
                    const rowId = parseInt(input.dataset.id);
                    if (rowId !== ds.endRowId) {
                        ds.endRowId = rowId;
                        updateDragHighlight();
                    }
                    return;
                }
                // 检查日期单元格（用于拖选经过时高亮整行）
                let dateCell = el.closest('.date-cell');
                if (dateCell && !dateCell.classList.contains('date-readonly')) {
                    if (dateCell.dataset.col !== ds.colKey) return;
                    const rowId = parseInt(dateCell.dataset.id);
                    if (rowId !== ds.endRowId) {
                        ds.endRowId = rowId;
                        updateDragHighlight();
                    }
                    return;
                }
                input = el.closest('.cell-input');
                if (!input) return;
                if (input.dataset.col !== ds.colKey) return;
                const rowId = parseInt(input.dataset.id);
                if (rowId !== ds.endRowId) {
                    ds.endRowId = rowId;
                    updateDragHighlight();
                }
            });

            document.addEventListener('mouseup', function() {
                if (window._dragSelect.active) {
                    window._dragSelect.active = false;
                }
            });

            // Ctrl+V 粘贴到选中的单元格（仅多行选择时生效，单行由浏览器默认粘贴）
            document.addEventListener('copy', function(e) {
                var ds = window._dragSelect;
                if (!ds.startRowId || !ds.endRowId || !ds.colKey) return;

                e.preventDefault();
                e.stopPropagation();

                const minId = Math.min(ds.startRowId, ds.endRowId);
                const maxId = Math.max(ds.startRowId, ds.endRowId);
                const colKey = ds.colKey;
                const isDateCol = (colKey === 'host_purchase' || colKey === 'client_purchase' || colKey === 'client_expire');

                // 收集目标行 ID
                const targetRowIds = [];
                if (colKey === 'password') {
                    $$('.password-cell').forEach(cell => {
                        if (cell.dataset.col !== colKey) return;
                        const rowId = parseInt(cell.dataset.id);
                        if (rowId >= minId && rowId <= maxId) targetRowIds.push(rowId);
                    });
                } else if (isDateCol) {
                    $$('.date-cell').forEach(cell => {
                        if (cell.dataset.col !== colKey) return;
                        const rowId = parseInt(cell.dataset.id);
                        if (rowId >= minId && rowId <= maxId) targetRowIds.push(rowId);
                    });
                } else {
                    getTextInputCells().forEach(input => {
                        if (input.dataset.col !== colKey) return;
                        const rowId = parseInt(input.dataset.id);
                        if (rowId >= minId && rowId <= maxId) targetRowIds.push(rowId);
                    });
                }
                targetRowIds.sort((a, b) => a - b);
                if (targetRowIds.length === 0) return;

                // 收集值（优先从 DOM 中的 input 读取当前值，处理正在编辑但未保存的情况）
                const values = targetRowIds.map(rowId => {
                    if (colKey === 'password') {
                        const cell = document.querySelector(`.password-cell[data-id="${rowId}"][data-col="${colKey}"]`);
                        if (cell) {
                            const input = cell.querySelector('.password-input');
                            if (input && input.style.display !== 'none') return input.value || '';
                        }
                    } else if (isDateCol) {
                        // 日期列：仅在正在编辑时读取输入框值（YYYY-MM-DD），否则读取记录中的标准格式
                        const cell = document.querySelector(`.date-cell[data-id="${rowId}"][data-col="${colKey}"]`);
                        if (cell) {
                            const input = cell.querySelector('.date-text-input');
                            if (input && document.activeElement === input) return input.value || '';
                        }
                    } else {
                        const input = document.querySelector(`input.cell-input[data-col="${colKey}"][data-id="${rowId}"]`);
                        if (input && document.activeElement === input) return input.value || '';
                    }
                    const record = state.records.find(r => r.id === rowId);
                    return record ? (record.data[colKey] || '') : '';
                });
                const text = values.join('\n');

                try {
                    if (e.clipboardData) {
                        e.clipboardData.setData('text/plain', text);
                    } else if (window.clipboardData) {
                        window.clipboardData.setData('text', text);
                    }
                } catch(ex) {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(text).catch(() => {});
                    }
                }
                setStatus('已复制 ' + values.length + ' 条数据');
            });

            document.addEventListener('paste', function(e) {
                var ds = window._dragSelect;
                // 单行选择时由浏览器默认粘贴处理，不拦截
                if (!ds.startRowId || !ds.endRowId || !ds.colKey) return;
                if (ds.startRowId === ds.endRowId) return;

                e.preventDefault();
                e.stopPropagation();

                var clipboardText = '';
                try { clipboardText = (e.clipboardData || window.clipboardData).getData('text'); } catch(ex) {}

                // 如果 clipboardData 无法获取，尝试异步读取
                if (!clipboardText && navigator.clipboard && navigator.clipboard.readText) {
                    navigator.clipboard.readText().then(function(text) {
                        if (text) doMultiPaste(ds, text);
                    }).catch(function() {});
                    return;
                }
                if (!clipboardText) return;

                doMultiPaste(ds, clipboardText);
            });

            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    clearDragHighlight();
                    window._dragSelect = { active: false, colKey: null, startRowId: null, endRowId: null, lastClickRowId: null, lastClickCol: null };
                }
            });
        }

        $$('.col-resize').forEach(handle => {
            let startX, startWidth, colKey;
            handle.onmousedown = (e) => {
                e.preventDefault();
                startX = e.clientX;
                colKey = handle.dataset.col;
                const th = handle.closest('th');
                startWidth = th.offsetWidth;
                document.onmousemove = (ev) => {
                    const diff = ev.clientX - startX;
                    const newWidth = Math.max(60, startWidth + diff);
                    th.style.width = newWidth + 'px';
                    th.style.minWidth = newWidth + 'px';
                };
                document.onmouseup = () => {
                    document.onmousemove = null;
                    document.onmouseup = null;
                    const col = state.columns.find(c => c.col_key === colKey);
                    if (col) {
                        const width = parseInt(th.style.width);
                        if (width > 0) {
                            col.col_width = width;
                            API.put('/columns/' + col.id, { col_width: width }).catch(() => {});
                        }
                    }
                };
            };
        });

        // 密码列：点击***显示明文input，失焦恢复***
        $$('.password-cell').forEach(cell => {
            const mask = cell.querySelector('.password-mask');
            const input = cell.querySelector('.password-input');
            if (!mask || !input) return;
            // 显示密码遮罩（带"点击编辑"占位符，避免删除后无法再次点击）
            const updateMaskDisplay = function() {
                const val = input.value;
                if (val) {
                    mask.textContent = '***';
                    mask.classList.remove('password-empty');
                } else {
                    mask.textContent = '✎ 点击设置';
                    mask.classList.add('password-empty');
                }
            };
            updateMaskDisplay();
            // 使用 class 切换显示，避免 CSS 默认 display:none 干扰
            const showInput = function() {
                cell.classList.add('editing');
                input.focus();
                input.select();
            };
            const hideInput = function() {
                cell.classList.remove('editing');
                updateMaskDisplay();
                handleCellChange(input);
            };
            mask.onclick = function(e) {
                e.stopPropagation();
                // 如果是拖选操作（多行选择），不进入编辑模式
                var ds = window._dragSelect;
                if (ds && ds.startRowId && ds.endRowId && ds.startRowId !== ds.endRowId) return;
                showInput();
            };
            input.onblur = function() {
                hideInput();
            };
            input.onkeydown = function(e) {
                if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
            };
        });
    }

    function bindSpecialEvents() {
        // 日期文本输入框：单击编辑不全选，双击全选；编辑时显示 YYYY-MM-DD，非编辑显示 XXXX年XX月XX日
        $$('.date-text-input').forEach(input => {
            // 获焦：切换为 YYYY-MM-DD 标准格式以便编辑（不全选，光标按正常点击位置）
            input.addEventListener('focus', function() {
                const id = parseInt(this.dataset.id);
                const colKey = this.dataset.col;
                const record = state.records.find(r => r.id === id);
                if (record) {
                    this.value = record.data[colKey] || '';
                }
            });
            // 双击全选
            input.addEventListener('dblclick', function() {
                this.select();
            });
            // 失焦时验证并保存（handleDateTextChange 会切回 XXXX年XX月XX日 显示格式）
            input.addEventListener('blur', function() {
                handleDateTextChange(this);
            });
            // Enter 保存
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') { e.preventDefault(); this.blur(); }
            });
        });

        // 日历按钮：点击打开日期选择器
        $$('.date-picker-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const cell = this.closest('.date-cell');
                if (!cell) return;
                const hiddenInput = cell.querySelector('.date-picker-hidden');
                const textInput = cell.querySelector('.date-text-input');
                if (!hiddenInput || !textInput) return;
                // 同步当前值
                const parsed = parseDate(textInput.value);
                hiddenInput.value = parsed || '';
                // 打开日期选择器
                if (hiddenInput.showPicker) {
                    try { hiddenInput.showPicker(); } catch(e) {}
                } else {
                    hiddenInput.style.position = 'static';
                    hiddenInput.style.opacity = '1';
                    hiddenInput.style.width = 'auto';
                    hiddenInput.style.height = 'auto';
                    hiddenInput.focus();
                    hiddenInput.click();
                }
            });
        });

        // 隐藏日期选择器：选择日期后更新文本输入框
        $$('.date-picker-hidden').forEach(hiddenInput => {
            hiddenInput.addEventListener('change', function() {
                const cell = this.closest('.date-cell');
                if (!cell) return;
                const textInput = cell.querySelector('.date-text-input');
                if (textInput && this.value) {
                    textInput.value = this.value;
                    handleDateTextChange(textInput);
                }
            });
        });

        // 月数
        $$('.months-dec').forEach(btn => {
            btn.onclick = function() {
                const col = this.dataset.col;
                const id = parseInt(this.dataset.id);
                const input = document.querySelector(`.months-input[data-col="${col}"][data-id="${id}"]`);
                if (!input) return;
                let val = parseInt(input.value) || 0;
                if (val > 0) val--;
                input.value = val;
                handleCellChange(input);
            };
        });
        $$('.months-inc').forEach(btn => {
            btn.onclick = function() {
                const col = this.dataset.col;
                const id = parseInt(this.dataset.id);
                const input = document.querySelector(`.months-input[data-col="${col}"][data-id="${id}"]`);
                if (!input) return;
                let val = parseInt(input.value) || 0;
                val++;
                input.value = val;
                handleCellChange(input);
            };
        });
        $$('.months-input').forEach(input => { input.onchange = function() { handleCellChange(this); }; });

        // 地址下拉
        $$('.address-select').forEach(sel => {
            sel.onchange = function() {
                const tr = this.closest('tr');
                const openBtn = tr.querySelector('.open-link');
                if (openBtn) openBtn.dataset.address = this.value;
                const col = this.dataset.col;
                const id = parseInt(this.dataset.id);
                const record = state.records.find(r => r.id === id);
                if (!record) return;
                if (col === 'address') {
                    record.data.ip_info = record.data.ip_address || '';
                    renderTable(false);
                    saveRecord(record);
                }
                handleCellChange(this);
            };
        });

        // 服务商快速检索下拉
        $$('.provider-search-box').forEach(box => {
            const input = box.querySelector('.provider-search-input');
            const dropdown = box.querySelector('.provider-search-dropdown');
            if (!input || !dropdown) return;

            const refreshOptions = () => {
                const keyword = input.value.trim();
                const rect = input.getBoundingClientRect();
                dropdown.style.left = rect.left + 'px';
                dropdown.style.top = (rect.bottom + 2) + 'px';
                dropdown.style.width = Math.max(rect.width, 160) + 'px';
                const options = Array.from(dropdown.querySelectorAll('.provider-search-option'));
                let visibleCount = 0;
                options.forEach(option => {
                    const name = option.dataset.value || '';
                    const visible = providerMatchesKeyword(name, keyword);
                    option.style.display = visible ? 'flex' : 'none';
                    if (visible) visibleCount++;
                });
                const empty = dropdown.querySelector('.provider-search-empty');
                if (empty) empty.style.display = visibleCount === 0 ? 'block' : 'none';
                dropdown.classList.add('show');
            };

            const saveProviderValue = (value) => {
                const colKey = input.dataset.col;
                const id = parseInt(input.dataset.id);
                const record = state.records.find(r => r.id === id);
                if (!record) return;
                record.data[colKey] = value;
                record._updated = true;
                input.value = value;
                updateFilterOptionsForCol(colKey);
                saveRecord(record);
            };

            input.addEventListener('focus', refreshOptions);
            input.addEventListener('input', refreshOptions);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const firstVisible = Array.from(dropdown.querySelectorAll('.provider-search-option'))
                        .find(option => option.style.display !== 'none');
                    if (firstVisible) {
                        saveProviderValue(firstVisible.dataset.value || '');
                        dropdown.classList.remove('show');
                    }
                }
                if (e.key === 'Escape') dropdown.classList.remove('show');
            });
            input.addEventListener('blur', () => {
                setTimeout(() => dropdown.classList.remove('show'), 180);
            });
            dropdown.querySelectorAll('.provider-search-option').forEach(option => {
                option.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    saveProviderValue(option.dataset.value || '');
                    dropdown.classList.remove('show');
                });
            });
        });

        $$('.cell-input[data-col="ip_address"]').forEach(input => {
            input.onchange = function() {
                const id = parseInt(this.dataset.id);
                const record = state.records.find(r => r.id === id);
                if (!record) return;
                record.data.ip_info = this.value.trim();
                // 不调用 renderTable，避免销毁 open-link 按钮。handleCellChange 会更新 data-ip。
                saveRecord(record);
            };
        });

        // open-link 用事件委托绑定（不依赖 bindTableEvents 重新绑定）
        // (已在 document 级别的 click 委托中处理，见下方)

        // IP信息交互（点击打开主机信息弹窗）
        $$('.ip-info-cell').forEach(cell => {
            cell.addEventListener('click', function() {
                const recordId = parseInt(this.dataset.id);
                openIpInfoModal(recordId);
            });
        });

        // 支出交互（点击显示文字切换为编辑）
        $$('.expense-display').forEach(display => {
            display.addEventListener('click', function(e) {
                const parent = this.parentElement; // .expense-inline
                const input = parent.querySelector('.expense-input');
                const td = parent.closest('td');
                this.style.display = 'none';
                input.style.display = 'inline-block';
                td.classList.add('editing-cell');
                input.focus();
                input.select();
            });
        });

        $$('.expense-input').forEach(input => {
            const finishEditing = () => {
                const parent = input.closest('.expense-inline');
                const display = parent.querySelector('.expense-display');
                const td = parent.closest('td');
                const id = parseInt(parent.closest('tr').dataset.id);
                const record = state.records.find(r => r.id === id);
                if (!record) return;

                const rawValue = input.value.trim();
                record.data['expense'] = rawValue || '0';
                record._updated = true;

                const months = parseInt(record.data.months) || 0;
                const computed = Math.round(computeExpenseValue(rawValue, months));
                display.textContent = computed;

                input.style.display = 'none';
                display.style.display = 'inline';
                td.classList.remove('editing-cell');

                saveRecord(record);
                updateFilterOptionsForCol('expense');
                renderTable(false);
            };

            input.addEventListener('blur', finishEditing);
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    finishEditing();
                }
                if (e.key === 'Escape') {
                    const parent = input.closest('.expense-inline');
                    const display = parent.querySelector('.expense-display');
                    const td = parent.closest('td');
                    const id = parseInt(parent.closest('tr').dataset.id);
                    const record = state.records.find(r => r.id === id);
                    const raw = record ? (record.data['expense'] || '') : '';
                    input.value = raw;
                    input.blur();
                }
            });
            input.addEventListener('focus', function() {
                const td = this.closest('td');
                if (td) td.classList.add('editing-cell');
            });
            input.addEventListener('blur', function() {
                const td = this.closest('td');
                if (td) td.classList.remove('editing-cell');
            });
        });

        // 收入交互（点击打开收入管理弹窗）
        $$('.fee-summary-cell:not(.expense-summary-cell)').forEach(cell => {
            cell.addEventListener('click', function() {
                const recordId = parseInt(this.dataset.id);
                openIncomeModal(recordId);
            });
        });
        // 支出交互（点击打开支出管理弹窗）
        $$('.expense-summary-cell').forEach(cell => {
            cell.addEventListener('click', function() {
                const recordId = parseInt(this.dataset.id);
                openExpenseModal(recordId);
            });
        });
    }

    function getTextInputCellsAll() {
        return $$('input.cell-input:not(.address-select):not(.months-input):not(.expense-input):not(.fee-input):not(.provider-search-input):not(.date-text-input)');
    }

    function doMultiPaste(ds, clipboardText) {
        const startId = ds.startRowId;
        const endId = ds.endRowId;
        const colKey = ds.colKey;
        const lines = clipboardText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim() !== '');
        if (lines.length === 0) return;
        const minId = Math.min(startId, endId);
        const maxId = Math.max(startId, endId);

        const isDateCol = (colKey === 'host_purchase' || colKey === 'client_purchase' || colKey === 'client_expire');

        // 收集目标行 ID（按行号排序）
        const targetRowIds = [];
        if (colKey === 'password') {
            $$('.password-cell').forEach(cell => {
                if (cell.dataset.col !== colKey) return;
                const rowId = parseInt(cell.dataset.id);
                if (rowId >= minId && rowId <= maxId) targetRowIds.push(rowId);
            });
        } else if (isDateCol) {
            $$('.date-cell').forEach(cell => {
                if (cell.dataset.col !== colKey) return;
                const rowId = parseInt(cell.dataset.id);
                if (rowId >= minId && rowId <= maxId) targetRowIds.push(rowId);
            });
        } else {
            getTextInputCellsAll().forEach(input => {
                if (input.dataset.col !== colKey) return;
                const rowId = parseInt(input.dataset.id);
                if (rowId >= minId && rowId <= maxId) targetRowIds.push(rowId);
            });
        }
        targetRowIds.sort((a, b) => a - b);
        if (targetRowIds.length === 0) return;

        // 保存原始数据到撤销栈
        const undoData = [];
        targetRowIds.forEach(rowId => {
            const record = state.records.find(r => r.id === rowId);
            if (record) {
                const item = {
                    recordId: rowId,
                    colKey: colKey,
                    oldValue: record.data[colKey]
                };
                if (colKey === 'host_purchase') item.oldHostExpire = record.data.host_expire;
                if (colKey === 'client_purchase') item.oldClientExpire = record.data.client_expire;
                undoData.push(item);
            }
        });
        state.undoStack.push({ type: 'multi_paste', data: undoData });

        let changed = 0;
        targetRowIds.forEach((rowId, index) => {
            // 单行复制：用同一内容填所有；多行：按行对应
            let value = lines.length === 1 ? lines[0].trim() : (index < lines.length ? lines[index].trim() : null);
            if (value === null) return;
            const record = state.records.find(r => r.id === rowId);
            if (!record) return;
            const col = state.columns.find(c => c.col_key === colKey);
            if (!col) return;
            // 跳过 readonly 列
            if (colKey === 'expense' || colKey === 'fee' || colKey === 'host_expire' || col.col_type === 'days_remaining' || colKey === 'is_expired') return;

            // 日期列：尝试解析多种格式
            if (isDateCol && value) {
                const parsed = parseDate(value);
                if (parsed) value = parsed;
            }

            if (record.data[colKey] === value) return; // 没有变化
            record.data[colKey] = value;
            record._updated = true;

            // 同步更新 input 的值（密码/日期）
            if (colKey === 'password') {
                const cell = document.querySelector(`.password-cell[data-id="${rowId}"][data-col="password"]`);
                if (cell) {
                    const input = cell.querySelector('.password-input');
                    const mask = cell.querySelector('.password-mask');
                    if (input) input.value = value;
                    if (mask) {
                        if (value) {
                            mask.textContent = '***';
                            mask.classList.remove('password-empty');
                        } else {
                            mask.textContent = '✎ 点击设置';
                            mask.classList.add('password-empty');
                        }
                    }
                }
            } else if (isDateCol) {
                const cell = document.querySelector(`.date-cell[data-id="${rowId}"][data-col="${colKey}"]`);
                if (cell) {
                    const input = cell.querySelector('.date-text-input');
                    const hiddenInput = cell.querySelector('.date-picker-hidden');
                    // 文本输入框显示 XXXX年XX月XX日，隐藏 date 输入框保持 YYYY-MM-DD
                    if (input) input.value = formatDisplayDate(value);
                    if (hiddenInput) hiddenInput.value = value;
                    cell.classList.toggle('date-empty', !value);
                }
            } else {
                const input = document.querySelector(`input.cell-input[data-col="${colKey}"][data-id="${rowId}"]`);
                if (input) input.value = value;
            }

            // 联动计算
            if (colKey === 'ip_address') record.data.ip_info = value;
            if (colKey === 'host_purchase') {
                const months = parseInt(record.data.months) || 0;
                record.data.host_expire = calcHostExpire(value, months);
            }
            saveRecord(record);
            changed++;
        });

        if (changed > 0) {
            setStatus('已粘贴 ' + changed + ' 条数据');
            $$('.cell-input.drag-selected, .password-cell.drag-selected, .date-cell.drag-selected').forEach(el => el.classList.remove('drag-selected'));
            window._dragSelect = { active: false, colKey: null, startRowId: null, endRowId: null, lastClickRowId: null, lastClickCol: null };
            // 重新渲染表格以更新联动列（如 open-link 按钮、host_expire 计算等）
            if (colKey === 'ip_address' || colKey === 'months' || colKey === 'host_purchase' || colKey === 'client_purchase' || colKey === 'address' || isDateCol) {
                renderTable(false);
            }
        }
    }

    function handleDateTextChange(input) {
        const colKey = input.dataset.col;
        const id = parseInt(input.dataset.id);
        let val = input.value.trim();
        const record = state.records.find(r => r.id === id);
        if (!record) return;

        const oldValue = record.data[colKey] !== undefined ? record.data[colKey] : '';

        // 尝试解析日期（支持多种格式）
        if (val) {
            const parsed = parseDate(val);
            if (parsed) {
                val = parsed;
            } else {
                // 解析失败，恢复旧值（显示格式）
                input.value = formatDisplayDate(oldValue);
                setStatus('⚠️ 日期格式无法识别，支持格式：YYYY-MM-DD、YYYY/MM/DD、YYYY年MM月DD日');
                return;
            }
        }

        // 更新输入框显示为 XXXX年XX月XX日 格式（非编辑状态）
        input.value = formatDisplayDate(val);

        if (record.data[colKey] === val) return;

        let oldHostExpire = null;
        let oldClientExpire = null;
        if (colKey === 'host_purchase') oldHostExpire = record.data.host_expire || null;
        if (colKey === 'client_purchase') oldClientExpire = record.data.client_expire || null;

        state.undoStack.push({
            type: 'cell_edit',
            recordId: id,
            colKey: colKey,
            oldValue: oldValue,
            newValue: val,
            oldHostExpire: oldHostExpire,
            oldClientExpire: oldClientExpire
        });

        record.data[colKey] = val;
        record._updated = true;
        if (colKey === 'host_purchase') {
            const months = parseInt(record.data.months) || 0;
            record.data.host_expire = calcHostExpire(val, months);
        }
        saveRecord(record);
        // 联动列需要重新渲染（剩余天数、是否过期等）
        if (colKey === 'host_purchase' || colKey === 'host_expire' || colKey === 'client_purchase' || colKey === 'client_expire') {
            renderTable(false);
        }
    }

    function handleCellChange(input) {
        const colKey = input.dataset.col;
        const id = parseInt(input.dataset.id);
        let val = input.value;
        const col = state.columns.find(c => c.col_key === colKey);
        if (!col) return;
        if (colKey === 'expense' || colKey === 'fee' || colKey === 'host_expire' || col.col_type === 'days_remaining' || colKey === 'is_expired') return;

        const record = state.records.find(r => r.id === id);
        if (!record) return;

        const oldValue = record.data[colKey] !== undefined ? record.data[colKey] : '';

        if (col.col_type === 'number') {
            if (val !== '' && !isNaN(val)) val = parseFloat(val);
            else val = 0;
        } else if (col.col_type === 'boolean') {
            if (val === 'true') val = true;
            else if (val === 'false') val = false;
            else val = null;
        }

        if (record.data[colKey] === val || (record.data[colKey] === undefined && val === '')) return;

        let oldHostExpire = null;
        let oldIpInfo = null;
        if (colKey === 'months') {
            oldHostExpire = record.data.host_expire || null;
        }
        if (colKey === 'ip_address') {
            oldIpInfo = record.data.ip_info || null;
        }

        state.undoStack.push({
            type: 'cell_edit',
            recordId: id,
            colKey: colKey,
            oldValue: oldValue,
            newValue: val,
            oldHostExpire: oldHostExpire,
            oldIpInfo: oldIpInfo
        });

        record.data[colKey] = val;
        record._updated = true;

        if (colKey === 'months') {
            const purchase = record.data.host_purchase;
            if (purchase) record.data.host_expire = calcHostExpire(purchase, val);
            else record.data.host_expire = '';
        }
        if (colKey === 'ip_address') record.data.ip_info = val;

        saveRecord(record);
        // 只有联动更新其他字段时才重新渲染，普通文本修改不渲染（避免输入框丢失焦点）
        // ip_address / domain 修改后只需更新 open-link 按钮的 data 属性，不需要重新渲染整个表格
        if (colKey === 'ip_address' || colKey === 'domain') {
            const tr = input.closest('tr');
            if (tr) {
                const openBtn = tr.querySelector('.open-link');
                if (openBtn) {
                    if (colKey === 'ip_address') openBtn.dataset.ip = val;
                    if (colKey === 'domain') openBtn.dataset.domain = val;
                }
            }
        } else if (colKey === 'months' || colKey === 'host_purchase' || colKey === 'client_purchase' || colKey === 'address') {
            renderTable(false);
        }
    }

    async function saveRecord(record) {
        if (!record || !record._updated) return;
        record._updated = false;
        state.pendingSaves.add(record.id);
        try {
            await API.put('/records/' + record.id, { data: record.data });
            updateTabCache(state.currentTabId);
            setStatus('保存成功');
        } catch (err) {
            setStatus('保存失败: ' + err.message);
            record._updated = true;
        } finally {
            state.pendingSaves.delete(record.id);
        }
    }

    async function flushPendingSaves() {
        if (state.pendingSaves.size === 0) return;
        setStatus('保存中...');
        // 找出所有标记为_updated但不在pendingSaves中的记录也一起保存
        const recordsToSave = state.records.filter(r => r._updated && !state.pendingSaves.has(r.id));
        const pendingIds = Array.from(state.pendingSaves);
        // 等待已经在进行中的保存
        let waited = 0;
        while (state.pendingSaves.size > 0 && waited < 50) {
            await new Promise(r => setTimeout(r, 100));
            waited++;
        }
        // 保存剩余未保存的
        for (const rec of recordsToSave) {
            await saveRecord(rec);
        }
    }

    function updateRowSelection() {
        $$('#tableBody tr').forEach(tr => {
            const id = parseInt(tr.dataset.id);
            if (state.selectedRows.has(id)) tr.classList.add('selected');
            else tr.classList.remove('selected');
        });
    }

    // --- 增删 ---}

    function showAddRowModal() {
        const modal = document.getElementById('addRowModal');
        const confirmBtn = document.getElementById('addRowConfirm');
        const cancelBtn = document.getElementById('addRowCancel');
        const closeBtn = document.getElementById('closeAddRowModal');

        modal.classList.add('show');

        const closeModal = () => {
            modal.classList.remove('show');
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', closeModal);
            closeBtn.removeEventListener('click', closeModal);
            document.removeEventListener('keydown', onKeyDown);
        };

        const onConfirm = async () => {
            const radios = document.querySelectorAll('input[name="addRowCount"]');
            let count = 1;
            for (const radio of radios) {
                if (radio.checked) {
                    count = parseInt(radio.value);
                    break;
                }
            }
            closeModal();
            await addRow(count);
        };

        const onKeyDown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onConfirm();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeModal();
            }
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        document.addEventListener('keydown', onKeyDown);

        confirmBtn.focus();
    }

    async function addRow(count = 1) {
        if (!state.currentTabId) return;
        try {
            setStatus(`添加 ${count} 行中...`);
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const nextMonth = getNextMonth(now);

            for (let i = 0; i < count; i++) {
                const data = {};
                state.columns.forEach(col => { data[col.col_key] = ''; });
                data.host_purchase = today;
                data.months = 1;
                data.host_expire = calcHostExpire(today, 1);
                data.client_purchase = today;
                data.client_expire = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
                data.expense = '0';
                data.fee = '';
                data.address = 'IP地址';

                const result = await API.post('/records', { tab_id: state.currentTabId, data });
                state.total++;

                state.undoStack.push({
                    type: 'add_row',
                    recordId: result.id
                });
            }

            // 跳转到最后一页
            state.page = Math.ceil(state.total / state.pageSize);
            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus('添加成功');
            const firstInput = document.querySelector('.cell-input');
            if (firstInput) firstInput.focus();
        } catch (err) { setStatus('添加失败: ' + err.message); }
    }

    async function deleteSelected() {
        const ids = Array.from(state.selectedRows);
        if (ids.length === 0) { setStatus('请选择行'); return; }
        if (!await showConfirm(`确定删除 ${ids.length} 条记录吗？`)) return;
        try {
            setStatus('删除中...');

            const deletedRecords = state.records
                .filter(r => ids.includes(r.id))
                .map(r => ({ ...r, data: { ...r.data } }));

            state.undoStack.push({
                type: 'delete_rows',
                records: deletedRecords
            });

            await API.post('/records/batch-delete', { ids });
            state.selectedRows.clear();
            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus(`已删除 ${ids.length} 条记录`);
        } catch (err) { setStatus('删除失败: ' + err.message); }
    }

    // 导出/导入
    async function exportData() {
        if (state.records.length === 0) { setStatus('⚠️ 无数据'); return; }
        try {
            setStatus('🔄 导出中...');
            const visibleColumns = state.columns.filter(c => c.col_visible !== 0);
            if (typeof XLSX === 'undefined') await loadXLSX();
            const headers = visibleColumns.map(c => c.col_name);
            const rows = state.records.map(r => visibleColumns.map(c => r.data[c.col_key] ?? ''));
            const wsData = [headers, ...rows];
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, '记账数据');
            const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            downloadFile(buf, `记账数据_${new Date().toISOString().slice(0,10)}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            setStatus('✅ 导出成功');
        } catch (err) { setStatus('❌ 导出失败: ' + err.message); }
    }

    function showExportClientInfoModal() {
        exportClientStatus.textContent = '';
        exportClientInfoModal.classList.add('show');
    }

    async function exportClientInfo() {
        const format = document.querySelector('input[name="exportClientFormat"]:checked')?.value || 'excel';
        const clientRecords = state.records;
        if (clientRecords.length === 0) {
            exportClientStatus.textContent = '⚠️ 没有客户数据';
            return;
        }

        const exportFields = [
            { key: 'ip_info', name: 'IP信息' },
            { key: 'client_purchase', name: '客户购买时间' },
            { key: 'client_expire', name: '客户到期时间' },
            { key: 'client_remaining', name: '客户剩余天数' },
            { key: 'client_name', name: '客户名' },
            { key: 'unit_price', name: '单价备注' }
        ];

        try {
            if (format === 'excel') {
                exportClientStatus.textContent = '🔄 导出中...';
                if (typeof XLSX === 'undefined') await loadXLSX();
                const headers = exportFields.map(f => f.name);
                const rows = clientRecords.map(r => {
                    return exportFields.map(f => {
                        if (f.key === 'client_remaining') {
                            const days = computeDaysRemaining(r.data.client_expire);
                            return days !== '' ? days + ' 天' : '';
                        }
                        if (f.key === 'client_purchase' || f.key === 'client_expire') {
                            return formatDisplayDate(r.data[f.key]);
                        }
                        return r.data[f.key] ?? '';
                    });
                });
                const wsData = [headers, ...rows];
                const ws = XLSX.utils.aoa_to_sheet(wsData);
                const range = XLSX.utils.decode_range(ws['!ref']);
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                        if (!ws[cellAddress]) continue;
                        const cell = ws[cellAddress];
                        if (!cell.s) cell.s = {};
                        cell.s.alignment = { horizontal: 'center', vertical: 'center' };
                        if (R > 0 && exportFields[C].key === 'client_remaining') {
                            const days = computeDaysRemaining(clientRecords[R - 1].data.client_expire);
                            if (days <= 3) {
                                cell.s.font = { color: { rgb: 'DC143C' }, bold: true };
                            } else if (days <= 5) {
                                cell.s.font = { color: { rgb: 'FFA500' }, bold: true };
                            }
                        }
                    }
                }
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, '客户信息');
                const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
                downloadFile(buf, `客户信息_${new Date().toISOString().slice(0,10)}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                exportClientStatus.textContent = '✅ 导出成功';
                setTimeout(() => exportClientInfoModal.classList.remove('show'), 1500);
            } else {
                exportClientStatus.textContent = '🔄 生成图片中...';
                await exportClientInfoAsImage(clientRecords, exportFields);
                exportClientStatus.textContent = '✅ 图片已复制到剪贴板';
                setTimeout(() => exportClientInfoModal.classList.remove('show'), 2000);
            }
        } catch (err) {
            exportClientStatus.textContent = '❌ 导出失败: ' + err.message;
        }
    }

    async function exportClientInfoAsImage(clientRecords, exportFields) {
        const headers = exportFields.map(f => f.name);
        const rows = clientRecords.map(r => {
            return exportFields.map(f => {
                if (f.key === 'client_remaining') {
                    const days = computeDaysRemaining(r.data.client_expire);
                    return days !== '' ? days + ' 天' : '';
                }
                if (f.key === 'client_purchase' || f.key === 'client_expire') {
                    return formatDisplayDate(r.data[f.key]);
                }
                return r.data[f.key] ?? '';
            });
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const padding = 20;
        const headerHeight = 40;
        const rowHeight = 30;
        const colPadding = 15;

        const colWidths = exportFields.map((f, idx) => {
            let maxWidth = ctx.measureText(f.name).width + colPadding * 2;
            rows.forEach(row => {
                const w = ctx.measureText(String(row[idx])).width + colPadding * 2;
                maxWidth = Math.max(maxWidth, w);
            });
            return maxWidth + 20;
        });

        const totalWidth = colWidths.reduce((a, b) => a + b, 0) + padding * 2;
        const totalHeight = headerHeight + rows.length * rowHeight + padding * 2;

        canvas.width = totalWidth;
        canvas.height = totalHeight;

        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, totalWidth, totalHeight);
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;

        let x = padding;
        ctx.fillStyle = '#f5f7fa';
        ctx.fillRect(x, padding, totalWidth - padding * 2, headerHeight);
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#333';
        colWidths.forEach((w, idx) => {
            const headerText = headers[idx];
            const textWidth = ctx.measureText(headerText).width;
            const textX = x + w / 2 - textWidth / 2;
            ctx.fillText(headerText, textX, padding + headerHeight / 2 + 5);
            ctx.strokeRect(x, padding, w, headerHeight);
            x += w;
        });

        rows.forEach((row, rowIdx) => {
            let x = padding;
            const y = padding + headerHeight + rowIdx * rowHeight;
            row.forEach((cell, colIdx) => {
                const colKey = exportFields[colIdx].key;
                const cellText = String(cell);
                const textWidth = ctx.measureText(cellText).width;
                const cellX = x + colWidths[colIdx] / 2 - textWidth / 2;
                const cellY = y + rowHeight / 2 + 4;
                if (colKey === 'client_remaining') {
                    const days = computeDaysRemaining(clientRecords[rowIdx].data.client_expire);
                    if (days <= 3) {
                        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
                        ctx.fillStyle = '#dc143c';
                    } else if (days <= 5) {
                        ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, sans-serif';
                        ctx.fillStyle = '#ffa500';
                    } else {
                        ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
                        ctx.fillStyle = '#333';
                    }
                } else {
                    ctx.font = '13px -apple-system, BlinkMacSystemFont, sans-serif';
                    ctx.fillStyle = '#333';
                }
                ctx.fillText(cellText, cellX, cellY);
                ctx.strokeRect(x, y, colWidths[colIdx], rowHeight);
                x += colWidths[colIdx];
            });
        });

        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);
    }

    function showImportModal() { importModal.classList.add('show'); importFileInput.value = ''; importStatus.textContent = ''; }
    async function handleImport() {
        const file = importFileInput.files[0];
        if (!file) { importStatus.textContent = '⚠️ 请选择文件'; return; }
        importStatus.textContent = '🔄 读取中...';
        try {
            let records = [];
            if (file.name.endsWith('.csv')) {
                const text = await file.text();
                const lines = text.split('\n').filter(l => l.trim());
                if (lines.length < 2) throw new Error('CSV格式错误');
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const visibleColumns = state.columns.filter(c => c.col_visible !== 0);
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const data = {};
                    visibleColumns.forEach((col, idx) => { data[col.col_key] = values[idx] || ''; });
                    records.push(data);
                }
            } else {
                await loadXLSX();
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
                if (jsonData.length === 0) throw new Error('Excel为空');
                const headers = Object.keys(jsonData[0]);
                const visibleColumns = state.columns.filter(c => c.col_visible !== 0);
                const colMap = {};
                visibleColumns.forEach(col => {
                    const matched = headers.find(h => h === col.col_name || h === col.col_key);
                    if (matched) colMap[col.col_key] = matched;
                });
                records = jsonData.map(row => {
                    const data = {};
                    visibleColumns.forEach(col => {
                        const key = colMap[col.col_key];
                        data[col.col_key] = key ? row[key] : '';
                    });
                    return data;
                });
            }
            if (records.length === 0) throw new Error('无有效数据');
            importStatus.textContent = `🔄 导入 ${records.length} 条...`;
            await API.post('/records/import', { tab_id: state.currentTabId, records });
            invalidateCurrentTabCache();
            state.page = 1;
            await loadRecords(state.currentTabId);
            renderTable(false);
            importStatus.textContent = `✅ 成功导入 ${records.length} 条`;
            setTimeout(() => importModal.classList.remove('show'), 1500);
        } catch (err) { importStatus.textContent = '❌ 导入失败: ' + err.message; }
    }

    function loadXLSX() { return new Promise((resolve, reject) => {
        if (typeof XLSX !== 'undefined') { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
        script.onload = resolve; script.onerror = reject;
        document.head.appendChild(script);
    }); }

    function downloadFile(content, filename, mimeType) {
        const blob = content instanceof ArrayBuffer ? new Blob([content], { type: mimeType }) : new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = filename;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
    }

    // --- 列管理 ---
    async function showColumnManager() {
        if (!state.currentTabId) { setStatus('⚠️ 请先选择一个标签'); return; }
        columnModal.classList.add('show');
        await renderColumnList();
        const tab = state.tabs.find(t => t.id === state.currentTabId);
        if (tab) document.getElementById('columnModalTabName').textContent = tab.name;
    }

    async function renderColumnList() {
        const cols = state.columns;
        let html = '';
        cols.forEach(col => {
            const isIncome = col.is_income || 0;
            let incomeLabel = '';
            if (isIncome === 1) incomeLabel = '💰';
            else if (isIncome === 2) incomeLabel = '💸';
            html += `
                <div class="column-item" draggable="true" data-id="${col.id}">
                    <div class="col-info">
                        <span><strong>${escapeHtml(col.col_name)}</strong></span>
                        <span class="col-key">(${escapeHtml(col.col_key)})</span>
                        <button class="income-toggle ${isIncome === 1 ? 'active-income' : (isIncome === 2 ? 'active-expense' : '')}" data-id="${col.id}">${incomeLabel || '普通'}</button>
                        <span style="color:#999;font-size:12px;">${col.col_visible === 1 ? '👁️' : '🙈'}</span>
                    </div>
                    <div class="col-actions">
                        <button onclick="toggleColumnVisibility(${col.id}, ${col.col_visible})">${col.col_visible === 1 ? '隐藏' : '显示'}</button>
                        <button class="danger" onclick="deleteColumn(${col.id})">删除</button>
                    </div>
                </div>
            `;
        });
        columnList.innerHTML = html;

        const items = columnList.querySelectorAll('.column-item');
        items.forEach(item => {
            item.addEventListener('dragstart', function(e) {
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.dataset.id);
            });
            item.addEventListener('dragend', function() {
                this.classList.remove('dragging');
                columnList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
            });
            item.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                columnList.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                this.classList.add('drag-over');
            });
            item.addEventListener('dragleave', function(e) {
                const rect = this.getBoundingClientRect();
                const y = e.clientY - rect.top;
                if (y < 0 || y > rect.height) {
                    this.classList.remove('drag-over');
                }
            });
            item.addEventListener('drop', async function(e) {
                e.preventDefault();
                this.classList.remove('drag-over');
                const draggedId = parseInt(e.dataTransfer.getData('text/plain'));
                const targetId = parseInt(this.dataset.id);
                if (draggedId === targetId) return;

                const cols = state.columns;
                const draggedIndex = cols.findIndex(c => c.id === draggedId);
                const targetIndex = cols.findIndex(c => c.id === targetId);
                if (draggedIndex === -1 || targetIndex === -1) return;

                const rect = this.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const insertBefore = y < rect.height / 2;

                const draggedCol = cols[draggedIndex];
                cols.splice(draggedIndex, 1);

                let newIndex = targetIndex;
                if (draggedIndex < targetIndex) {
                    newIndex = insertBefore ? targetIndex - 1 : targetIndex;
                } else {
                    newIndex = insertBefore ? targetIndex : targetIndex + 1;
                }
                if (newIndex < 0) newIndex = 0;
                if (newIndex > cols.length) newIndex = cols.length;
                cols.splice(newIndex, 0, draggedCol);

                const orderMap = {};
                cols.forEach((c, i) => { orderMap[c.id] = i; });
                try {
                    await API.post('/columns/reorder', { orderMap });
                    state.columns = cols;
                    updateTabCache(state.currentTabId);
                    renderColumnList();
                    renderTable(false);
                    setStatus('✅ 顺序已更新');
                } catch (err) {
                    setStatus('❌ 更新失败: ' + err.message);
                    await loadColumns(state.currentTabId);
                    renderColumnList();
                }
            });
        });

        columnList.querySelectorAll('.income-toggle').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                const col = state.columns.find(c => c.id === id);
                if (!col) return;
                let newVal = (col.is_income || 0) + 1;
                if (newVal > 2) newVal = 0;
                try {
                    await API.put('/columns/' + id, { is_income: newVal });
                    col.is_income = newVal;
                    updateTabCache(state.currentTabId);
                    renderColumnList();
                    renderTable(false);
                    setStatus('✅ 标记已更新');
                } catch (err) { setStatus('❌ 更新失败: ' + err.message); }
            });
        });
    }

    window.toggleColumnVisibility = async function(id, currentVisible) {
        try {
            await API.put('/columns/' + id, { col_visible: currentVisible === 1 ? 0 : 1 });
            await loadColumns(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderColumnList();
            renderTable(false);
            setStatus('✅ 列状态已更新');
        } catch (err) { setStatus('❌ 更新失败: ' + err.message); }
    };
    window.deleteColumn = async function(id) {
        if (!await showConfirm('确定删除此列吗？')) return;
        try {
            await API.delete('/columns/' + id);
            await loadColumns(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderColumnList();
            renderTable(false);
            setStatus('✅ 列已删除');
        } catch (err) { setStatus('❌ 删除失败: ' + err.message); }
    };

    async function addColumn() {
        const name = newColName.value.trim();
        const type = newColType.value;
        if (!name) { setStatus('⚠️ 请输入列名称'); return; }
        if (!state.currentTabId) { setStatus('⚠️ 请先选择一个标签'); return; }

        const ts = Date.now();
        const rand = Math.random().toString(36).substring(2, 6);
        const key = `col_${ts}_${rand}`;

        try {
            const result = await API.post('/columns', {
                tab_id: state.currentTabId,
                col_key: key,
                col_name: name,
                col_type: type,
                is_income: 0
            });
            if (result.success) {
                newColName.value = '';
                await loadColumns(state.currentTabId);
                updateTabCache(state.currentTabId);
                renderColumnList();
                renderTable(false);
                setStatus('✅ 列添加成功');
            } else {
                setStatus('❌ 添加失败: ' + (result.error || '未知错误'));
            }
        } catch (err) { setStatus('❌ 添加失败: ' + err.message); }
    }

    // --- 条件格式管理 ---
    function openConditionalFormatModal() {
        if (!state.currentTabId) { setStatus('⚠️ 请先选择标签'); return; }
        const tab = state.tabs.find(t => t.id === state.currentTabId);
        cfModalTabName.textContent = tab ? tab.name : '';
        renderCfColSelect();
        renderCfList();
        conditionalFormatModal.classList.add('show');
    }

    function renderCfColSelect() {
        const visibleCols = state.columns.filter(c => c.col_visible !== 0);
        cfColSelect.innerHTML = visibleCols.map(c =>
            `<option value="${escapeAttr(c.col_key)}">${escapeHtml(c.col_name)}</option>`
        ).join('');
    }

    function renderCfList() {
        const formats = state.conditionalFormats || [];
        if (formats.length === 0) {
            cfList.innerHTML = '<div style="text-align:center;color:#999;padding:20px 0;">暂无条件格式</div>';
            return;
        }
        const colMap = {};
        state.columns.forEach(c => { colMap[c.col_key] = c.col_name; });
        const conditionLabels = {
            contains: '包含', equals: '等于', not_equals: '不等于',
            greater_than: '大于', less_than: '小于',
            starts_with: '开头是', ends_with: '结尾是'
        };
        let html = '';
        formats.forEach(fmt => {
            const colName = colMap[fmt.col_key] || fmt.col_key;
            const condLabel = conditionLabels[fmt.condition_type] || fmt.condition_type;
            const style = [];
            if (fmt.text_color) style.push(`color:${fmt.text_color};`);
            if (fmt.is_bold) style.push('font-weight:bold;');
            html += `
                <div class="cf-item" data-id="${fmt.id}">
                    <div class="cf-item-info">
                        <span class="cf-item-col">${escapeHtml(colName)}</span>
                        <span class="cf-item-cond">${escapeHtml(condLabel)}</span>
                        <span class="cf-item-val">"${escapeHtml(fmt.condition_value)}"</span>
                        <span class="cf-item-preview" style="${style.join('')}">预览文字</span>
                    </div>
                    <div class="cf-item-actions">
                        <button class="cf-btn cf-up" data-id="${fmt.id}" title="上移">↑</button>
                        <button class="cf-btn cf-down" data-id="${fmt.id}" title="下移">↓</button>
                        <button class="cf-btn cf-delete" data-id="${fmt.id}" title="删除">🗑️</button>
                    </div>
                </div>
            `;
        });
        cfList.innerHTML = html;
        $$('.cf-btn.cf-up').forEach(btn => btn.addEventListener('click', () => moveCfItem(parseInt(btn.dataset.id), -1)));
        $$('.cf-btn.cf-down').forEach(btn => btn.addEventListener('click', () => moveCfItem(parseInt(btn.dataset.id), 1)));
        $$('.cf-btn.cf-delete').forEach(btn => btn.addEventListener('click', () => deleteCfItem(parseInt(btn.dataset.id))));
    }

    async function addConditionalFormat() {
        const col_key = cfColSelect.value;
        const condition_type = cfConditionSelect.value;
        const condition_value = cfValueInput.value.trim();
        const text_color = cfColorInput.value;
        const is_bold = cfBoldCheck.checked;
        if (!condition_value) { setStatus('⚠️ 请输入条件值'); return; }

        try {
            await API.post('/conditional-formats', {
                tab_id: state.currentTabId,
                col_key, condition_type, condition_value, text_color, is_bold
            });
            cfValueInput.value = '';
            await loadConditionalFormats(state.currentTabId);
            renderCfList();
            renderTable(false);
            setStatus('✅ 条件格式添加成功');
        } catch (err) { setStatus('❌ 添加失败: ' + err.message); }
    }

    async function moveCfItem(id, direction) {
        const formats = state.conditionalFormats || [];
        const idx = formats.findIndex(f => f.id === id);
        if (idx === -1) return;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= formats.length) return;
        const newFormats = [...formats];
        [newFormats[idx], newFormats[newIdx]] = [newFormats[newIdx], newFormats[idx]];
        try {
            for (let i = 0; i < newFormats.length; i++) {
                if (newFormats[i].sort_order !== i) {
                    await API.put('/conditional-formats/' + newFormats[i].id, { sort_order: i });
                }
            }
            await loadConditionalFormats(state.currentTabId);
            renderCfList();
            renderTable(false);
        } catch (err) { setStatus('❌ 移动失败: ' + err.message); }
    }

    async function deleteCfItem(id) {
        try {
            await API.delete('/conditional-formats/' + id);
            await loadConditionalFormats(state.currentTabId);
            renderCfList();
            renderTable(false);
            setStatus('✅ 已删除');
        } catch (err) { setStatus('❌ 删除失败: ' + err.message); }
    }

    // --- 统计 ---
    // --- 收入管理弹窗 ---
    async function openIncomeModal(recordId) {
        state.incomeRecordId = recordId;
        incomeAmountInput.value = '';
        incomeRemarkInput.value = '';
        incomeDateInput.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        incomeStatus.textContent = '';
        incomeModal.classList.add('show');
        await loadIncomeRecords(recordId);
    }

    async function loadIncomeRecords(recordId) {
        try {
            const records = await API.get('/income/by-record/' + recordId);
            state.incomeRecords = records || [];
            const total = state.incomeRecords.reduce((s, r) => s + (r.amount || 0), 0);
            incomeTotalDisplay.textContent = Math.round(total);
            renderIncomeList();
        } catch (err) { incomeStatus.textContent = '加载失败: ' + err.message; }
    }

    function renderIncomeList() {
        if (!incomeList) return;
        if (state.incomeRecords.length === 0) {
            incomeList.innerHTML = '<div style="text-align:center;color:#999;padding:16px;">暂无收入记录</div>';
            return;
        }
        incomeList.innerHTML = state.incomeRecords.map(r => `
            <div class="income-item">
                <div class="income-item-info">
                    <span class="income-item-amount">${Number(r.amount).toFixed(2)}</span>
                    <span class="income-item-date">${escapeHtml(formatDisplayDate(r.income_date || ''))}</span>
                    <span class="income-item-remark">${escapeHtml(r.remark || '')}</span>
                </div>
                <button class="income-item-delete" data-id="${r.id}">删除</button>
            </div>
        `).join('');
        incomeList.querySelectorAll('.income-item-delete').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                if (!await showConfirm('确定删除此收入记录？')) return;
                try {
                    await API.delete('/income/' + id);
                    await loadIncomeRecords(state.incomeRecordId);
                    await loadRecords(state.currentTabId);
                    renderTable(false);
                    incomeStatus.textContent = '已删除';
                    setTimeout(() => incomeStatus.textContent = '', 1500);
                } catch (err) { incomeStatus.textContent = '删除失败: ' + err.message; }
            });
        });
    }

    async function addIncomeRecord() {
        const amount = parseFloat(incomeAmountInput.value);
        const date = incomeDateInput.value;
        if (!amount || amount <= 0) { incomeStatus.textContent = '请输入有效金额'; return; }
        if (!date) { incomeStatus.textContent = '请选择日期'; return; }
        try {
            await API.post('/income', {
                record_id: state.incomeRecordId,
                tab_id: state.currentTabId,
                amount: amount,
                income_date: date,
                remark: incomeRemarkInput.value.trim()
            });
            incomeAmountInput.value = '';
            incomeRemarkInput.value = '';
            await loadIncomeRecords(state.incomeRecordId);
            await loadRecords(state.currentTabId);
            renderTable(false);
            incomeStatus.textContent = '添加成功';
            setTimeout(() => incomeStatus.textContent = '', 1500);
        } catch (err) { incomeStatus.textContent = '添加失败: ' + err.message; }
    }

    // --- 支出管理弹窗 ---
    async function openExpenseModal(recordId) {
        state.expenseRecordId = recordId;
        expenseAmountInput.value = '';
        expenseRemarkInput.value = '';
        expenseDateInput.value = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
        expenseStatus.textContent = '';
        expenseModal.classList.add('show');
        await loadExpenseRecords(recordId);
    }

    async function loadExpenseRecords(recordId) {
        try {
            const records = await API.get('/expense/by-record/' + recordId);
            state.expenseRecords = records || [];
            const total = state.expenseRecords.reduce((s, r) => s + (r.amount || 0), 0);
            expenseTotalDisplay.textContent = Math.round(total);
            renderExpenseList();
        } catch (err) { expenseStatus.textContent = '加载失败: ' + err.message; }
    }

    function renderExpenseList() {
        if (!expenseList) return;
        if (state.expenseRecords.length === 0) {
            expenseList.innerHTML = '<div style="text-align:center;color:#999;padding:16px;">暂无支出记录</div>';
            return;
        }
        expenseList.innerHTML = state.expenseRecords.map(r => `
            <div class="income-item">
                <div class="income-item-info">
                    <span class="income-item-amount" style="color:#c62828;">${Number(r.amount).toFixed(2)}</span>
                    <span class="income-item-date">${escapeHtml(formatDisplayDate(r.expense_date || ''))}</span>
                    <span class="income-item-remark">${escapeHtml(r.remark || '')}</span>
                </div>
                <button class="income-item-delete" data-id="${r.id}">删除</button>
            </div>
        `).join('');
        expenseList.querySelectorAll('.income-item-delete').forEach(btn => {
            btn.addEventListener('click', async function() {
                const id = parseInt(this.dataset.id);
                if (!await showConfirm('确定删除此支出记录？')) return;
                try {
                    await API.delete('/expense/' + id);
                    await loadExpenseRecords(state.expenseRecordId);
                    await loadRecords(state.currentTabId);
                    renderTable(false);
                    expenseStatus.textContent = '已删除';
                    setTimeout(() => expenseStatus.textContent = '', 1500);
                } catch (err) { expenseStatus.textContent = '删除失败: ' + err.message; }
            });
        });
    }

    async function addExpenseRecord() {
        const amount = parseFloat(expenseAmountInput.value);
        const date = expenseDateInput.value;
        if (!amount || amount <= 0) { expenseStatus.textContent = '请输入有效金额'; return; }
        if (!date) { expenseStatus.textContent = '请选择日期'; return; }
        try {
            await API.post('/expense', {
                record_id: state.expenseRecordId,
                tab_id: state.currentTabId,
                amount: amount,
                expense_date: date,
                remark: expenseRemarkInput.value.trim()
            });
            expenseAmountInput.value = '';
            expenseRemarkInput.value = '';
            await loadExpenseRecords(state.expenseRecordId);
            await loadRecords(state.currentTabId);
            renderTable(false);
            expenseStatus.textContent = '添加成功';
            setTimeout(() => expenseStatus.textContent = '', 1500);
        } catch (err) { expenseStatus.textContent = '添加失败: ' + err.message; }
    }

    // --- IP信息弹窗（联动主机管理） ---
    async function openIpInfoModal(recordId) {
        const record = state.records.find(r => r.id === recordId);
        if (!record) return;

        const ipAddr = record.data.ip_address || '';
        const clientName = record.data.client_name || '';
        const password = record.data.password || '';

        // 尝试查找已保存的主机信息
        let savedHost = null;
        if (ipAddr) {
            try {
                savedHost = await API.get(`/hosts/by-ip/${encodeURIComponent(ipAddr)}`);
            } catch (e) { /* 忽略 */ }
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal" style="width:480px;">
                <div class="modal-header">
                    <h2>🔗 IP信息管理</h2>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="input-group"><label>主机名称（取自客户名）</label><input type="text" id="ipInfoName" value="${escapeAttr(clientName)}" placeholder="主机名称" /></div>
                    <div class="input-group"><label>主机地址（取自IP地址）</label><input type="text" id="ipInfoHost" value="${escapeAttr(ipAddr)}" placeholder="IP地址" /></div>
                    <div class="input-group"><label>密码（取自表格密码列）</label><input type="password" id="ipInfoPwd" value="${escapeAttr(password)}" placeholder="密码" /></div>
                    <div class="input-group"><label>端口</label><input type="number" id="ipInfoPort" value="${savedHost ? savedHost.port : 22}" placeholder="22" /></div>
                    <div class="input-group"><label>用户名</label><input type="text" id="ipInfoUser" value="${savedHost ? escapeAttr(savedHost.username) : ''}" placeholder="root" /></div>
                    <div class="input-group"><label>备注</label><input type="text" id="ipInfoRemark" value="${savedHost ? escapeAttr(savedHost.remark || '') : ''}" placeholder="可选" /></div>
                    <div class="modal-actions">
                        <button class="tool-btn primary" id="ipInfoSaveBtn">💾 保存</button>
                        <button class="tool-btn" id="ipInfoSaveConnBtn" style="background:#67c23a;color:#fff;">🔌 保存并连接</button>
                        <button class="tool-btn cancel-ip-info-btn">取消</button>
                    </div>
                    <span id="ipInfoStatus" style="color:#67c23a;display:block;margin-top:8px;"></span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('.modal-close');
        const cancelBtn = overlay.querySelector('.cancel-ip-info-btn');
        const saveBtn = overlay.querySelector('#ipInfoSaveBtn');
        const saveConnBtn = overlay.querySelector('#ipInfoSaveConnBtn');
        const status = overlay.querySelector('#ipInfoStatus');

        function closeModal() { overlay.remove(); }

        closeBtn.onclick = closeModal;
        cancelBtn.onclick = closeModal;
        overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

        async function saveHost() {
            const name = overlay.querySelector('#ipInfoName').value.trim();
            const host = overlay.querySelector('#ipInfoHost').value.trim();
            const pwd = overlay.querySelector('#ipInfoPwd').value.trim();
            const port = parseInt(overlay.querySelector('#ipInfoPort').value) || 22;
            const username = overlay.querySelector('#ipInfoUser').value.trim();
            const remark = overlay.querySelector('#ipInfoRemark').value.trim();

            if (!host) { status.style.color = '#f56c6c'; status.textContent = '主机地址不能为空'; return null; }
            if (!username) { status.style.color = '#f56c6c'; status.textContent = '用户名不能为空'; return null; }

            try {
                if (savedHost && savedHost.id) {
                    await API.put(`/hosts/${savedHost.id}`, { name: name || host, host, port, username, password: pwd, remark });
                    status.style.color = '#67c23a';
                    status.textContent = '✅ 已更新主机信息';
                    return { id: savedHost.id, name: name || host, host, port, username };
                } else {
                    const data = await API.post('/hosts', { name: name || host, host, port, username, password: pwd, remark });
                    if (data.success) {
                        status.style.color = '#67c23a';
                        status.textContent = '✅ 主机已保存';
                        return { id: data.id, name: name || host, host, port, username };
                    } else {
                        status.style.color = '#f56c6c';
                        status.textContent = data.error || '保存失败';
                        return null;
                    }
                }
            } catch (err) {
                status.style.color = '#f56c6c';
                status.textContent = '保存失败: ' + err.message;
                return null;
            }
        }

        saveBtn.onclick = async () => {
            const result = await saveHost();
            if (result) {
                setTimeout(closeModal, 800);
                await loadHosts();
            }
        };

        saveConnBtn.onclick = async () => {
            const result = await saveHost();
            if (result) {
                closeModal();
                $$('.menu-item').forEach(i => i.classList.remove('active'));
                const hostMenu = document.querySelector('.menu-item[data-view="hosts"]');
                if (hostMenu) hostMenu.classList.add('active');
                $$('.view-panel').forEach(p => p.classList.remove('active'));
                const target = document.getElementById('view-hosts');
                if (target) target.classList.add('active');
                await loadHosts();
                await loadCommandFolders();
                setTimeout(() => connectSSH(result), 300);
            }
        };
    }

    // --- 全标签财务统计 ---
    async function getAllTabRecordsForStats() {
        await flushPendingSaves();
        const all = [];
        // 并行加载所有标签的全部记录（pageSize=0 获取全部）
        const recordPromises = state.tabs.map(tab =>
            API.get('/records?tabId=' + tab.id + '&pageSize=0')
                .then(result => {
                    const records = result.records || result || [];
                    records.forEach(record => all.push({ ...record, tabId: tab.id, tabName: tab.name }));
                })
                .catch(() => {})
        );
        // 加载收入和支出明细（用于按月统计，不重复累加 _incomeTotal/_expenseTotal）
        const incomePromises = state.tabs.map(tab =>
            API.get('/income/by-tab/' + tab.id).catch(() => [])
        );
        const expensePromises = state.tabs.map(tab =>
            API.get('/expense/by-tab/' + tab.id).catch(() => [])
        );

        const [_, incomeResults, expenseResults] = await Promise.all([
            Promise.all(recordPromises),
            Promise.all(incomePromises),
            Promise.all(expensePromises)
        ]);

        // 匹配收入明细到记录（仅用于按月统计，不修改 _incomeTotal）
        incomeResults.forEach((incomes, idx) => {
            (incomes || []).forEach(inc => {
                const rec = all.find(r => r.id === inc.record_id);
                if (rec) {
                    if (!rec._incomes) rec._incomes = [];
                    rec._incomes.push(inc);
                }
            });
        });
        // 匹配支出明细到记录（仅用于按月统计，不修改 _expenseTotal）
        expenseResults.forEach((expenses, idx) => {
            (expenses || []).forEach(exp => {
                const rec = all.find(r => r.id === exp.record_id);
                if (rec) {
                    if (!rec._expenses) rec._expenses = [];
                    rec._expenses.push(exp);
                }
            });
        });
        return all;
    }

    function getStatsDate(record) {
        const dateVal = record.data.host_purchase || record.data.client_purchase || record.created_at || '';
        const d = new Date(dateVal);
        return isNaN(d) ? null : d;
    }

    function getRecordFinancials(record) {
        const months = parseInt(record.data.months) || 0;
        let expense = 0;
        // 普通记账标签：支出在 expense_records 表，用 _expenseTotal
        // 独享/共享标签：支出在 record.data.expense，用 computeExpenseValue
        if (record._expenseTotal !== undefined && record._expenseTotal > 0) {
            expense = record._expenseTotal;
        } else {
            expense = computeExpenseValue(record.data.expense, months) || 0;
        }
        // Income: 优先用 _incomeTotal（income_records 表汇总）
        // 独享/共享标签收入在 record.data.fee 中，_incomeTotal 为 0 时 fallback
        let income = record._incomeTotal || 0;
        if (income <= 0) {
            const fee = parseFloat(record.data.fee);
            if (!isNaN(fee)) income = fee;
        }
        return { income, expense, net: income - expense };
    }

    function getRecordFinancialsByMonth(record) {
        // Returns array of { month: 'YYYY-MM', income, expense } broken down by month
        const results = [];
        const months = parseInt(record.data.months) || 0;
        // 普通记账用 _expenseTotal，独享/共享用 computeExpenseValue
        let totalExpense;
        if (record._expenseTotal !== undefined && record._expenseTotal > 0) {
            totalExpense = record._expenseTotal;
        } else {
            totalExpense = computeExpenseValue(record.data.expense, months) || 0;
        }
        const purchaseDate = record.data.host_purchase;
        const startDate = purchaseDate ? new Date(purchaseDate) : null;

        // Distribute expense across months based on host_purchase date
        if (months > 0 && startDate && !isNaN(startDate)) {
            const unitExpense = totalExpense / months;
            for (let i = 0; i < months; i++) {
                const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                results.push({ month: monthKey, income: 0, expense: unitExpense });
            }
        } else if (totalExpense > 0) {
            // No date info, put in a single bucket
            const d = record.data.host_purchase ? new Date(record.data.host_purchase) : new Date(record.created_at);
            if (!isNaN(d)) {
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                results.push({ month: monthKey, income: 0, expense: totalExpense });
            }
        }

        // Add income by date
        const incomes = record._incomes || [];
        incomes.forEach(inc => {
            if (inc.income_date) {
                const d = new Date(inc.income_date);
                if (!isNaN(d)) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    let bucket = results.find(r => r.month === monthKey);
                    if (!bucket) {
                        bucket = { month: monthKey, income: 0, expense: 0 };
                        results.push(bucket);
                    }
                    bucket.income += (inc.amount || 0);
                }
            }
        });

        // 独享/共享标签：收入在 record.data.fee，没有 _incomes 明细时按 host_purchase 分配
        if (incomes.length === 0) {
            const fee = parseFloat(record.data.fee);
            if (!isNaN(fee) && fee > 0 && startDate && !isNaN(startDate)) {
                // 分配到 host_purchase 当月
                const monthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
                let bucket = results.find(r => r.month === monthKey);
                if (!bucket) {
                    bucket = { month: monthKey, income: 0, expense: 0 };
                    results.push(bucket);
                }
                bucket.income += fee;
            }
        }

        // Add expense by date (for simple tabs)
        const expenses = record._expenses || [];
        expenses.forEach(exp => {
            if (exp.expense_date) {
                const d = new Date(exp.expense_date);
                if (!isNaN(d)) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    let bucket = results.find(r => r.month === monthKey);
                    if (!bucket) {
                        bucket = { month: monthKey, income: 0, expense: 0 };
                        results.push(bucket);
                    }
                    bucket.expense += (exp.amount || 0);
                }
            }
        });

        return results;
    }

    function sumStats(records) {
        return records.reduce((acc, record) => {
            const f = getRecordFinancials(record);
            acc.income += f.income;
            acc.expense += f.expense;
            acc.net += f.net;
            acc.count += 1;
            return acc;
        }, { income: 0, expense: 0, net: 0, count: 0 });
    }

    function formatMoney(value) {
        return Number(value || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function renderMiniBars(items, maxValue, valueKey, colorClass) {
        if (items.length === 0) return '<div class="stats-empty">暂无数据</div>';
        return items.map(item => {
            const value = Math.abs(item[valueKey] || 0);
            const width = maxValue > 0 ? Math.max(4, Math.round(value / maxValue * 100)) : 4;
            return `
                <div class="stats-bar-row">
                    <div class="stats-bar-label">${escapeHtml(item.label)}</div>
                    <div class="stats-bar-track"><div class="stats-bar ${colorClass}" style="width:${width}%;"></div></div>
                    <div class="stats-bar-value">${formatMoney(item[valueKey])}</div>
                </div>
            `;
        }).join('');
    }

    async function renderStats() {
        try {
            statsContainer.innerHTML = '<div class="stats-loading">正在汇总所有标签数据...</div>';
            const records = await getAllTabRecordsForStats();
            if (records.length === 0) {
                statsContainer.innerHTML = '<div class="stats-empty large">暂无可统计数据</div>';
                return;
            }

            const total = sumStats(records);
            const profitRate = total.income > 0 ? (total.net / total.income * 100) : 0;
            const avgIncome = total.count ? total.income / total.count : 0;
            const avgExpense = total.count ? total.expense / total.count : 0;
            const expiredCount = records.filter(r => checkExpired(r.data.host_expire) === '过期').length;
            const activeCount = records.filter(r => checkExpired(r.data.host_expire) === '有效').length;

            const monthMap = {};
            const yearMap = {};
            const tabMap = {};
            const providerMap = {};

            records.forEach(record => {
                const f = getRecordFinancials(record);
                const d = getStatsDate(record);

                // Use monthly breakdown for accurate per-month allocation
                const monthlyBreakdown = getRecordFinancialsByMonth(record);
                monthlyBreakdown.forEach(mb => {
                    monthMap[mb.month] = monthMap[mb.month] || { label: mb.month, income: 0, expense: 0, net: 0, count: 0 };
                    monthMap[mb.month].income += mb.income;
                    monthMap[mb.month].expense += mb.expense;
                    monthMap[mb.month].net += (mb.income - mb.expense);
                    monthMap[mb.month].count += 1;

                    const year = mb.month.split('-')[0];
                    yearMap[year] = yearMap[year] || { label: year, income: 0, expense: 0, net: 0, count: 0 };
                    yearMap[year].income += mb.income;
                    yearMap[year].expense += mb.expense;
                    yearMap[year].net += (mb.income - mb.expense);
                });

                const tabName = record.tabName || '未命名标签';
                tabMap[tabName] = tabMap[tabName] || { label: tabName, income: 0, expense: 0, net: 0, count: 0 };
                tabMap[tabName].income += f.income;
                tabMap[tabName].expense += f.expense;
                tabMap[tabName].net += f.net;
                tabMap[tabName].count += 1;

                const provider = record.data.provider || '未填写服务商';
                providerMap[provider] = providerMap[provider] || { label: provider, income: 0, expense: 0, net: 0, count: 0 };
                providerMap[provider].income += f.income;
                providerMap[provider].expense += f.expense;
                providerMap[provider].net += f.net;
                providerMap[provider].count += 1;
            });

            const months = Object.values(monthMap).sort((a, b) => a.label.localeCompare(b.label));
            const years = Object.values(yearMap).sort((a, b) => a.label.localeCompare(b.label));
            const tabs = Object.values(tabMap).sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
            const providers = Object.values(providerMap).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 8);

            // 过滤掉未来的年份和月份（只显示当前年月及之前）
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const filteredMonths = months.filter(m => m.label <= currentMonth);
            const filteredYears = years.filter(y => parseInt(y.label) <= currentYear);

            // 从 state 获取或默认时间范围
            const monthRange = isNaN(state.statsMonthRange) ? 6 : state.statsMonthRange;
            const yearRange = isNaN(state.statsYearRange) ? 6 : state.statsYearRange;
            const recentMonths = monthRange === 0 ? filteredMonths : filteredMonths.slice(-monthRange);
            const recentYears = yearRange === 0 ? filteredYears : filteredYears.slice(-yearRange);
            const maxMonthAmount = Math.max(1, ...recentMonths.map(m => Math.max(Math.abs(m.income), Math.abs(m.expense), Math.abs(m.net))));
            const maxTabNet = Math.max(1, ...tabs.map(t => Math.abs(t.net)));
            const maxProviderNet = Math.max(1, ...providers.map(p => Math.abs(p.net)));

            const bestMonth = filteredMonths.length ? filteredMonths.reduce((best, item) => item.net > best.net ? item : best, filteredMonths[0]) : null;
            const worstMonth = filteredMonths.length ? filteredMonths.reduce((worst, item) => item.net < worst.net ? item : worst, filteredMonths[0]) : null;

            const monthRows = recentMonths.map(item => `
                <tr>
                    <td>${escapeHtml(item.label)}</td>
                    <td class="positive">${formatMoney(item.income)}</td>
                    <td class="negative">${formatMoney(item.expense)}</td>
                    <td class="${item.net >= 0 ? 'positive' : 'negative'}">${formatMoney(item.net)}</td>
                    <td>${item.count}</td>
                </tr>
            `).join('');

            const yearRows = recentYears.map(item => `
                <tr>
                    <td>${escapeHtml(item.label)}</td>
                    <td class="positive">${formatMoney(item.income)}</td>
                    <td class="negative">${formatMoney(item.expense)}</td>
                    <td class="${item.net >= 0 ? 'positive' : 'negative'}">${formatMoney(item.net)}</td>
                    <td>${item.count}</td>
                </tr>
            `).join('');

            statsContainer.innerHTML = `
                <div class="stats-hero">
                    <div>
                        <div class="stats-eyebrow">All Tabs Financial Intelligence</div>
                        <h2>全标签财务统计</h2>
                        <p>已合并 ${state.tabs.length} 个标签，共 ${records.length} 条记录。</p>
                    </div>
                    <div class="stats-hero-net ${total.net >= 0 ? 'positive' : 'negative'}">
                        <span>净收入</span>
                        <strong>${formatMoney(total.net)}</strong>
                    </div>
                </div>

                <div class="stats-grid premium">
                    <div class="stat-card dark"><div class="stat-label">总收入</div><div class="stat-value positive">${formatMoney(total.income)}</div><div class="stat-sub">平均每条 ${formatMoney(avgIncome)}</div></div>
                    <div class="stat-card dark"><div class="stat-label">总支出</div><div class="stat-value negative">${formatMoney(total.expense)}</div><div class="stat-sub">平均每条 ${formatMoney(avgExpense)}</div></div>
                    <div class="stat-card dark"><div class="stat-label">利润率</div><div class="stat-value neutral">${profitRate.toFixed(1)}%</div><div class="stat-sub">收入转化净额占比</div></div>
                    <div class="stat-card dark"><div class="stat-label">到期状态</div><div class="stat-value neutral">${activeCount}/${expiredCount}</div><div class="stat-sub">有效 / 过期</div></div>
                </div>

                <div class="stats-insight-grid">
                    <div class="stats-panel">
                        <h3>近 ${monthRange === 0 ? '所有' : monthRange} 个月趋势</h3>
                        <div class="stats-month-bars">
                            ${recentMonths.map(item => `
                                <div class="month-bar-card">
                                    <div class="month-bar-title">${escapeHtml(item.label)}</div>
                                    <div class="month-bar-stack">
                                        <div class="month-bar income" style="height:${Math.max(6, Math.abs(item.income) / maxMonthAmount * 100)}%;"></div>
                                        <div class="month-bar expense" style="height:${Math.max(6, Math.abs(item.expense) / maxMonthAmount * 100)}%;"></div>
                                        <div class="month-bar net ${item.net >= 0 ? 'positive' : 'negative'}" style="height:${Math.max(6, Math.abs(item.net) / maxMonthAmount * 100)}%;"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="stats-legend"><span class="income"></span>收入 <span class="expense"></span>支出 <span class="net"></span>净额</div>
                    </div>

                    <div class="stats-panel">
                        <h3>关键洞察</h3>
                        <div class="insight-list">
                            <div><span>最佳月份</span><strong>${bestMonth ? `${escapeHtml(bestMonth.label)} / ${formatMoney(bestMonth.net)}` : '暂无'}</strong></div>
                            <div><span>压力月份</span><strong>${worstMonth ? `${escapeHtml(worstMonth.label)} / ${formatMoney(worstMonth.net)}` : '暂无'}</strong></div>
                            <div><span>标签数量</span><strong>${state.tabs.length}</strong></div>
                            <div><span>服务商数量</span><strong>${Object.keys(providerMap).length}</strong></div>
                        </div>
                    </div>
                </div>

                <div class="stats-insight-grid">
                    <div class="stats-panel">
                        <h3>标签净额排行</h3>
                        ${renderMiniBars(tabs, maxTabNet, 'net', 'net')}
                    </div>
                    <div class="stats-panel">
                        <h3>服务商贡献排行</h3>
                        ${renderMiniBars(providers, maxProviderNet, 'net', 'net')}
                    </div>
                </div>

                <div class="stats-detail premium-table">
                    <div class="stats-detail-header"><h3>年度对比</h3><select class="stats-range-select" data-range-type="year" style="margin-left:8px;padding:2px 6px;font-size:13px;border-radius:4px;border:1px solid #dcdfe6;"><option value="6" ${yearRange===6?'selected':''}>近6年</option><option value="12" ${yearRange===12?'selected':''}>近12年</option><option value="0" ${yearRange===0?'selected':''}>所有年份</option></select></div>
                    <table><thead><tr><th>年份</th><th>收入</th><th>支出</th><th>净额</th><th>记录数</th></tr></thead><tbody>${yearRows}</tbody></table>
                </div>

                <div class="stats-detail premium-table">
                    <div class="stats-detail-header"><h3>月份明细</h3><select class="stats-range-select" data-range-type="month" style="margin-left:8px;padding:2px 6px;font-size:13px;border-radius:4px;border:1px solid #dcdfe6;"><option value="6" ${monthRange===6?'selected':''}>近6月</option><option value="12" ${monthRange===12?'selected':''}>近12月</option><option value="24" ${monthRange===24?'selected':''}>近24月</option><option value="0" ${monthRange===0?'selected':''}>所有月份</option></select></div>
                    <table><thead><tr><th>月份</th><th>收入</th><th>支出</th><th>净额</th><th>记录数</th></tr></thead><tbody>${monthRows}</tbody></table>
                </div>
            `;
        } catch (err) {
            statsContainer.innerHTML = `<div class="stats-empty large">统计加载失败：${escapeHtml(err.message)}</div>`;
        }
    }

    // 统计时间范围下拉框事件委托
    document.addEventListener('change', function(e) {
        if (!e.target.classList.contains('stats-range-select')) return;
        const rangeType = e.target.dataset.rangeType;
        const rangeVal = parseInt(e.target.value);
        if (rangeType === 'month') {
            state.statsMonthRange = rangeVal;
        } else if (rangeType === 'year') {
            state.statsYearRange = rangeVal;
        }
        renderStats();
    });

    // --- 密码修改 ---
    async function changePassword() {
        const oldPwd = oldPwdInput.value.trim();
        const newPwd = newPwdInput.value.trim();
        const confirmPwd = confirmPwdInput.value.trim();
        if (!oldPwd) { changePwdStatus.textContent = '⚠️ 请输入当前密码'; return; }
        if (newPwd.length < 6) { changePwdStatus.textContent = '⚠️ 新密码至少6位'; return; }
        if (newPwd !== confirmPwd) { changePwdStatus.textContent = '⚠️ 两次密码不一致'; return; }
        try {
            await API.post('/auth/change-password', { oldPassword: oldPwd, newPassword: newPwd });
            changePwdStatus.textContent = '✅ 密码修改成功';
            oldPwdInput.value = ''; newPwdInput.value = ''; confirmPwdInput.value = '';
        } catch (err) { changePwdStatus.textContent = '❌ 修改失败: ' + err.message; }
    }

    async function changeUsername() {
        const password = usernamePasswordInput.value.trim();
        const newUsername = newUsernameInput.value.trim();
        if (!password) { changeUsernameStatus.textContent = '⚠️ 请输入当前密码'; return; }
        if (!newUsername) { changeUsernameStatus.textContent = '⚠️ 请输入新用户名'; return; }
        try {
            const res = await API.post('/auth/change-username', { password, newUsername });
            changeUsernameStatus.textContent = '✅ 用户名修改成功';
            usernamePasswordInput.value = ''; newUsernameInput.value = '';
            usernameDisplay.textContent = res.username;
        } catch (err) { changeUsernameStatus.textContent = '❌ 修改失败: ' + err.message; }
    }

    // --- 注册开关 ---
    async function loadRegisterSwitch() {
        try {
            const data = await API.get('/settings/allow_register');
            if (data.value !== undefined) allowRegisterCheckbox.checked = data.value !== false;
        } catch (err) {}
    }
    async function saveRegisterSwitch() {
        const value = allowRegisterCheckbox.checked;
        try {
            await API.post('/settings', { key: 'allow_register', value });
            registerSwitchStatus.textContent = '✅ 已保存';
            setTimeout(() => registerSwitchStatus.textContent = '', 3000);
        } catch (err) { registerSwitchStatus.textContent = '❌ 保存失败: ' + err.message; }
    }

    // --- 地址后缀 ---
    async function loadSuffixSettings() {
        try {
            const ipSuffix = await API.get('/settings/ip_port_suffix');
            const domainSuffix = await API.get('/settings/domain_port_suffix');
            if (ipSuffix.value !== null) { state.ipPortSuffix = ipSuffix.value; ipPortSuffixInput.value = ipSuffix.value; }
            if (domainSuffix.value !== null) { state.domainPortSuffix = domainSuffix.value; domainPortSuffixInput.value = domainSuffix.value; }
        } catch (err) { console.warn('加载后缀设置失败:', err); }
    }
    async function saveSuffixSettings() {
        const ipSuffix = ipPortSuffixInput.value.trim();
        const domainSuffix = domainPortSuffixInput.value.trim();
        try {
            await API.post('/settings/batch', {
                settings: {
                    ip_port_suffix: ipSuffix,
                    domain_port_suffix: domainSuffix
                }
            });
            state.ipPortSuffix = ipSuffix; state.domainPortSuffix = domainSuffix;
            suffixStatus.textContent = '✅ 已保存';
            setTimeout(() => suffixStatus.textContent = '', 3000);
        } catch (err) { suffixStatus.textContent = '❌ 保存失败: ' + err.message; }
    }

    // --- 服务商管理 ---
    function normalizeProviderOptions(options) {
        const result = [];
        (options || []).forEach(item => {
            const name = String(item || '').trim();
            if (name && !result.includes(name)) result.push(name);
        });
        return result;
    }

    function collectProviderOptionsFromRecords() {
        // 不再从记录中自动收集服务商（避免删除后重新出现）
        state.providerOptions = normalizeProviderOptions(state.providerOptions);
    }

    async function loadProviderOptions() {
        try {
            const data = await API.get('/settings/provider_options');
            state.providerOptions = normalizeProviderOptions(Array.isArray(data.value) ? data.value : []);
        } catch (err) {
            state.providerOptions = [];
        }
    }

    async function saveProviderOptions() {
        await API.post('/settings', { key: 'provider_options', value: state.providerOptions });
    }

    function renderProviderList() {
        if (!providerList) return;
        if (state.providerOptions.length === 0) {
            providerList.innerHTML = '<div class="provider-empty">暂无服务商</div>';
            return;
        }
        providerList.innerHTML = state.providerOptions.map(name => `
            <div class="provider-item">
                <span class="provider-item-name">${escapeHtml(name)}</span>
                <button type="button" class="delete-provider-btn" data-name="${escapeAttr(name)}">删除</button>
            </div>
        `).join('');
        providerList.querySelectorAll('.delete-provider-btn').forEach(btn => {
            btn.addEventListener('click', async function() {
                const name = this.dataset.name;
                if (!await showConfirm(`确定删除服务商"${name}"吗？已使用的记录不会被清空。`)) return;
                try {
                    state.providerOptions = state.providerOptions.filter(item => item !== name);
                    await saveProviderOptions();
                    renderProviderList();
                    renderTable(false);
                    providerStatus.textContent = '✅ 已删除';
                    setTimeout(() => providerStatus.textContent = '', 2000);
                } catch (err) { providerStatus.textContent = '❌ 删除失败: ' + err.message; }
            });
        });
    }

    function openProviderModal() {
        collectProviderOptionsFromRecords();
        providerNameInput.value = '';
        providerStatus.textContent = '';
        renderProviderList();
        providerModal.classList.add('show');
        setTimeout(() => providerNameInput.focus(), 0);
    }

    async function addProvider() {
        const name = providerNameInput.value.trim();
        if (!name) { providerStatus.textContent = '⚠️ 请输入服务商名称'; return; }
        if (state.providerOptions.includes(name)) { providerStatus.textContent = '⚠️ 服务商已存在'; return; }
        try {
            state.providerOptions.unshift(name);
            state.providerOptions = normalizeProviderOptions(state.providerOptions);
            await saveProviderOptions();
            providerNameInput.value = '';
            providerStatus.textContent = '✅ 已添加';
            renderProviderList();
            renderTable(false);
            setTimeout(() => providerStatus.textContent = '', 2000);
        } catch (err) { providerStatus.textContent = '❌ 添加失败: ' + err.message; }
    }

    // --- Favicon ---
    async function uploadFavicon() {
        const fileInput = document.getElementById('faviconFileInput');
        const file = fileInput.files[0];
        if (!file) { document.getElementById('faviconStatus').textContent = '⚠️ 请选择文件'; return; }
        const formData = new FormData();
        formData.append('image', file);
        try {
            const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
            const data = await res.json().catch(() => ({ error: '服务器返回格式错误，请确认上传接口正常' }));
            if (!res.ok || data.error) throw new Error(data.error || '上传失败');
            if (data.success) {
                const response = await fetch('/api/settings/favicon', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ path: data.url })
                });
                const result = await response.json().catch(() => ({ error: '服务器返回格式错误，请确认图标保存接口正常' }));
                if (!response.ok || result.error) throw new Error(result.error || '保存图标失败');
                if (result.success) {
                    document.getElementById('faviconStatus').textContent = '✅ 图标已更新，请刷新浏览器查看';
                    const link = document.querySelector("link[rel*='icon']");
                    if (link) link.href = data.url + '?v=' + Date.now();
                } else { document.getElementById('faviconStatus').textContent = '❌ 保存图标失败: ' + (result.error || ''); }
            } else { document.getElementById('faviconStatus').textContent = '❌ 上传失败: ' + (data.error || ''); }
        } catch (err) { document.getElementById('faviconStatus').textContent = '❌ 上传失败: ' + err.message; }
    }

    // --- 加载设置 ---
    async function loadSettings() {
        try {
            const cert = await API.get('/settings/cert_path');
            const key = await API.get('/settings/key_path');
            if (cert.value) document.getElementById('certPathInput').value = cert.value;
            if (key.value) document.getElementById('keyPathInput').value = key.value;
            const bg = await API.get('/settings/background');
            if (bg.value) {
                const bgData = bg.value;
                const preview = document.getElementById('bgPreview');
                if (bgData.type === 'url' || bgData.type === 'local') {
                    const url = bgData.type === 'url' ? bgData.url : bgData.path;
                    preview.style.backgroundImage = `url("${cssUrl(url)}")`;
                    preview.classList.add('has-bg'); preview.textContent = '';
                }
            }
            await loadRegisterSwitch();
            await loadSuffixSettings();
            await loadProviderOptions();
            collectProviderOptionsFromRecords();
            const auth = await API.get('/auth/check');
            if (auth.loggedIn && auth.user.id === 1) registerSwitchGroup.style.display = 'block';
        } catch (err) { console.warn('加载设置失败:', err); }
    }

    // --- 事件绑定 ---
    addRowBtn.addEventListener('click', showAddRowModal);
    manageRowsBtn.addEventListener('click', function() {
        state.rowManageMode = !state.rowManageMode;
        if (!state.rowManageMode) {
            state.selectedRows.clear();
        }
        if (manageRowsBtn) {
            manageRowsBtn.classList.toggle('active', state.rowManageMode);
            manageRowsBtn.textContent = state.rowManageMode ? '完成' : '管理行';
        }
        renderTable(false);
    });
    deleteRowsBtn.addEventListener('click', deleteSelected);
    exportBtn.addEventListener('click', exportData);
    exportClientInfoBtn.addEventListener('click', showExportClientInfoModal);
    closeExportClientInfoModal.addEventListener('click', () => exportClientInfoModal.classList.remove('show'));
    exportClientConfirm.addEventListener('click', exportClientInfo);
    exportClientCancel.addEventListener('click', () => exportClientInfoModal.classList.remove('show'));
    importBtn.addEventListener('click', showImportModal);
    refreshBtn.addEventListener('click', function() {
        if (state.currentTabId) {
            showTableLoading();
            state.page = 1;
            invalidateCurrentTabCache();
            loadRecords(state.currentTabId).then(() => { renderTable(false); hideTableLoading(); });
        }
    });
    manageColumnsBtn.addEventListener('click', showColumnManager);
    conditionalFormatBtn.addEventListener('click', openConditionalFormatModal);
    closeConditionalFormatModal.addEventListener('click', () => conditionalFormatModal.classList.remove('show'));
    cfAddBtn.addEventListener('click', addConditionalFormat);
    cfValueInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addConditionalFormat(); });
    logoutBtn.addEventListener('click', async function() {
        if (!await showConfirm('确定退出吗？')) return;
        // 退出前保存当前筛选状态
        if (state.currentTabId) {
            state.tabFilters[state.currentTabId] = { ...state.filters };
            saveTabFiltersToStorage();
        }
        try { await API.post('/auth/logout'); window.location.href = '/login'; } catch (err) { setStatus('❌ 退出失败: ' + err.message); }
    });

    addressSuffixBtn.addEventListener('click', () => addressSuffixModal.classList.add('show'));
    providerManageBtn.addEventListener('click', openProviderModal);
    closeAddressSuffixModal.addEventListener('click', () => addressSuffixModal.classList.remove('show'));
    closeProviderModal.addEventListener('click', () => providerModal.classList.remove('show'));
    closeIncomeModal.addEventListener('click', () => incomeModal.classList.remove('show'));
    closeColumnModal.addEventListener('click', () => columnModal.classList.remove('show'));
    if (addColBtn) addColBtn.addEventListener('click', addColumn);
    closeImport.addEventListener('click', () => importModal.classList.remove('show'));
    confirmImport.addEventListener('click', handleImport);
    cancelImport.addEventListener('click', () => importModal.classList.remove('show'));
    changePwdBtn.addEventListener('click', changePassword);
    confirmPwdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') changePassword(); });
    changeUsernameBtn.addEventListener('click', changeUsername);
    newUsernameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') changeUsername(); });
    addProviderBtn.addEventListener('click', addProvider);
    providerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addProvider();
        if (e.key === 'Escape') providerModal.classList.remove('show');
    });
    addIncomeBtn.addEventListener('click', addIncomeRecord);
    incomeAmountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addIncomeRecord();
    });

    closeExpenseModal.addEventListener('click', () => expenseModal.classList.remove('show'));
    addExpenseBtn.addEventListener('click', addExpenseRecord);
    expenseAmountInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') addExpenseRecord();
    });

    // --- 分页事件 ---
    firstPageBtn.addEventListener('click', async () => {
        if (state.page <= 1) return;
        state.page = 1;
        await loadRecords(state.currentTabId);
        renderTable(false);
        const tw = $('#tableWrapper');
        if (tw) tw.scrollTop = 0;
    });
    prevPageBtn.addEventListener('click', async () => {
        if (state.page <= 1) return;
        state.page--;
        await loadRecords(state.currentTabId);
        renderTable(false);
        const tw = $('#tableWrapper');
        if (tw) tw.scrollTop = 0;
    });
    nextPageBtn.addEventListener('click', async () => {
        if (state.page >= state.totalPages) return;
        state.page++;
        await loadRecords(state.currentTabId);
        renderTable(false);
        const tw = $('#tableWrapper');
        if (tw) tw.scrollTop = 0;
    });
    lastPageBtn.addEventListener('click', async () => {
        if (state.page >= state.totalPages) return;
        state.page = state.totalPages;
        await loadRecords(state.currentTabId);
        renderTable(false);
        const tw = $('#tableWrapper');
        if (tw) tw.scrollTop = 0;
    });
    pageSizeSelect.addEventListener('change', async () => {
        state.pageSize = parseInt(pageSizeSelect.value) || 50;
        state.page = 1;
        await loadRecords(state.currentTabId);
        renderTable(false);
        const tw = $('#tableWrapper');
        if (tw) tw.scrollTop = 0;
    });

    if (pageJumpBtn) {
        pageJumpBtn.addEventListener('click', async () => {
            const target = parseInt(pageJumpInput.value);
            if (target >= 1 && target <= state.totalPages && target !== state.page) {
                state.page = target;
                await loadRecords(state.currentTabId);
                renderTable(false);
            }
        });
    }
    if (pageJumpInput) {
        pageJumpInput.addEventListener('keydown', async (e) => {
            if (e.key === 'Enter' && pageJumpBtn) pageJumpBtn.click();
        });
    }

    // --- 右键菜单（共享标签：添加客户/删除行） ---
    let contextTargetId = null;

    document.addEventListener('contextmenu', function(e) {
        const tr = e.target.closest('tr[data-id]');
        if (!tr) { contextMenu.style.display = 'none'; return; }
        const tab = state.tabs.find(t => t.id === state.currentTabId);
        const tabType = tab ? tab.tab_type : 'dedicated';
        const isShared = tabType === 'shared';
        const isDedicated = tabType === 'dedicated';
        if (!isShared && !isDedicated) { contextMenu.style.display = 'none'; return; }

        e.preventDefault();
        contextTargetId = parseInt(tr.dataset.id);
        const recordType = tr.dataset.type || 'server';
        const targetRec = state.records.find(r => r.id === contextTargetId);
        // 独享标签：在上方插入一行
        ctxInsertAbove.style.display = isDedicated ? 'block' : 'none';
        // 共享标签菜单项
        ctxAddClient.style.display = (isShared && recordType === 'server') ? 'block' : 'none';
        ctxCopyClient.style.display = (isShared && recordType === 'client') ? 'block' : 'none';
        ctxPasteClient.style.display = (isShared && recordType === 'server' && state.copiedClientRecordId) ? 'block' : 'none';
        // 独享标签菜单项
        const isEmptyRow = targetRec && !targetRec.data.ip_address && !targetRec.data.provider;
        ctxCopyServer.style.display = (isDedicated && recordType === 'server') ? 'block' : 'none';
        ctxPasteServer.style.display = (isDedicated && state.copiedServerData && isEmptyRow) ? 'block' : 'none';
        // 共享标签：服务器行不显示删除（有客户关联），客户行可以删除；独享标签不显示删除
        const canDelete = isShared ? (recordType === 'client') : false;
        ctxDeleteRecord.style.display = canDelete ? 'block' : 'none';
        // 批量粘贴：当选中了多个单元格时显示
        const ds = window._dragSelect;
        const hasMultiSelection = ds && ds.startRowId && ds.endRowId && ds.startRowId !== ds.endRowId && ds.colKey;
        ctxBatchPaste.style.display = hasMultiSelection ? 'block' : 'none';

        contextMenu.style.display = 'block';
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
    });

    document.addEventListener('click', function() { contextMenu.style.display = 'none'; });

    ctxInsertAbove.addEventListener('click', async () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId || !state.currentTabId) return;
        // 在目标行上方插入一行
        const targetRec = state.records.find(r => r.id === contextTargetId);
        if (!targetRec) return;
        try {
            setStatus('插入中...');
            const data = {};
            state.columns.forEach(col => { data[col.col_key] = ''; });
            const now = new Date();
            const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const nextMonth = getNextMonth(now);
            data.host_purchase = today;
            data.months = 1;
            data.host_expire = calcHostExpire(today, 1);
            data.client_purchase = today;
            data.client_expire = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
            data.expense = '0';
            data.fee = '';
            data.address = 'IP地址';
            // sort_order 使用目标行的 sort_order
            const sortOrder = targetRec.sort_order || 0;
            await API.post('/records', {
                tab_id: state.currentTabId,
                data,
                record_type: 'server',
                sort_order: sortOrder
            });
            state.total++;
            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus('插入成功');
        } catch (err) { setStatus('插入失败: ' + err.message); }
    });

    ctxAddClient.addEventListener('click', async () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId || !state.currentTabId) return;
        await addRowClient(contextTargetId);
    });

    ctxCopyClient.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId) return;
        const record = state.records.find(r => r.id === contextTargetId);
        if (!record || record.record_type !== 'client') return;
        state.copiedClientRecordId = record.id;
        $$('tr.client-row.cut-pending').forEach(tr => tr.classList.remove('cut-pending'));
        const tr = document.querySelector(`tr[data-id="${contextTargetId}"]`);
        if (tr) tr.classList.add('cut-pending');
        setStatus('客户信息已剪切 ✂️，请在目标服务器行右键粘贴');
    });

    ctxPasteClient.addEventListener('click', async () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId || !state.copiedClientRecordId || !state.currentTabId) {
            setStatus('无法粘贴：缺少目标或数据');
            return;
        }
        const parentRecord = state.records.find(r => r.id === contextTargetId);
        if (!parentRecord || parentRecord.record_type !== 'server') {
            setStatus('无法粘贴：请在服务器行上右键粘贴');
            return;
        }
        try {
            setStatus('移动中...');
            await API.post('/records/move', {
                record_id: state.copiedClientRecordId,
                new_parent_id: contextTargetId
            });
            state.copiedClientRecordId = null;
            $$('tr.client-row.cut-pending').forEach(tr => tr.classList.remove('cut-pending'));

            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus('客户已移动到新服务器 ✓');
        } catch (err) { setStatus('移动失败: ' + err.message); }
    });

    // --- 独享标签：提取/粘贴服务器信息 ---
    ctxCopyServer.addEventListener('click', () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId) return;
        const record = state.records.find(r => r.id === contextTargetId);
        if (!record) return;
        // Copy server-related fields
        state.copiedServerData = { ...record.data };
        state.copiedServerRecordId = record.id;
        setStatus('服务器信息已提取，可在空白行右键粘贴（原行支出将清零）');
    });

    ctxPasteServer.addEventListener('click', async () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId || !state.copiedServerData || !state.currentTabId) return;
        const targetRecord = state.records.find(r => r.id === contextTargetId);
        if (!targetRecord) return;
        try {
            setStatus('粘贴中...');
            // Write copied server info into target (empty) row
            const SERVER_FIELDS = ['provider', 'months', 'host_purchase', 'host_expire', 'host_remaining', 'ip_address', 'password', 'domain', 'remark', 'address', 'expense', 'ip_info'];
            const updateData = { ...targetRecord.data };
            SERVER_FIELDS.forEach(key => {
                updateData[key] = state.copiedServerData[key] || '';
            });

            // Clear expense on source row
            const sourceId = state.copiedServerRecordId;
            if (sourceId) {
                const sourceRecord = state.records.find(r => r.id === sourceId);
                if (sourceRecord) {
                    const sourceData = { ...sourceRecord.data, expense: '0' };
                    await API.put('/records/' + sourceId, { data: sourceData });
                }
            }

            await API.put('/records/' + contextTargetId, { data: updateData });
            state.copiedServerData = null;
            state.copiedServerRecordId = null;
            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus('服务器信息已粘贴，原行支出已清零');
        } catch (err) { setStatus('粘贴失败: ' + err.message); }
    });

    ctxDeleteRecord.addEventListener('click', async () => {
        contextMenu.style.display = 'none';
        if (!contextTargetId) return;
        if (!await showConfirm('确定删除此行？')) return;
        try {
            await API.delete('/records/' + contextTargetId);
            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus('已删除');
        } catch (err) { setStatus('删除失败: ' + err.message); }
    });

    ctxBatchPaste.addEventListener('click', async () => {
        contextMenu.style.display = 'none';
        const ds = window._dragSelect;
        if (!ds || !ds.startRowId || !ds.endRowId || ds.startRowId === ds.endRowId || !ds.colKey) return;
        // 多种方式读取剪贴板
        let text = '';
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                text = await navigator.clipboard.readText();
            }
        } catch (e) {}
        if (!text) {
            // 提示用户使用 Ctrl+V
            setStatus('请使用 Ctrl+V 进行批量粘贴（菜单无法直接读取剪贴板）');
            // 触发一次 paste 事件
            const pasteEvent = new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: new DataTransfer() });
            // 无法通过 ClipboardEvent 设置剪贴板内容，提示用户手动粘贴
            return;
        }
        if (text) doMultiPaste(ds, text);
    });

    async function addRowClient(parentId) {
        if (!state.currentTabId) return;
        try {
            setStatus('添加中...');
            const data = {};
            state.columns.forEach(col => { data[col.col_key] = ''; });
            // New client defaults: today + 1 month (same day or last day of next month)
            const now = new Date();
            data.client_purchase = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            // +1 month: same day next month, or last day if overflow (e.g. 8-31 → 9-30)
            const expDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            // If day overflowed (e.g. 31 → next month has 30), JS auto-corrects to next-next month
            // Detect overflow and clamp to last day of next month + 1 day
            if (expDate.getMonth() !== now.getMonth() + 1 || (now.getMonth() === 11 && expDate.getMonth() !== 0)) {
                // Overflow occurred, use last day of next month + 1 day
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                expDate.setTime(lastDay.getTime() + 86400000); // +1 day
            }
            data.client_expire = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}-${String(expDate.getDate()).padStart(2, '0')}`;
            data.fee = '';

            const result = await API.post('/records', {
                tab_id: state.currentTabId,
                data,
                record_type: 'client',
                parent_id: parentId
            });
            await loadRecords(state.currentTabId);
            updateTabCache(state.currentTabId);
            renderTable(false);
            setStatus('客户已添加');
        } catch (err) { setStatus('添加客户失败: ' + err.message); }
    }

    document.getElementById('saveCertBtn').addEventListener('click', async function() {
        const certPath = document.getElementById('certPathInput').value.trim();
        const keyPath = document.getElementById('keyPathInput').value.trim();
        if (!certPath || !keyPath) { setStatus('⚠️ 请填写完整路径'); return; }
        try {
            await API.post('/settings/cert', { certPath, keyPath });
            setStatus('✅ 证书路径已保存，重启服务生效');
            document.getElementById('certStatus').textContent = '✅ 已保存，请重启服务';
        } catch (err) { setStatus('❌ 保存失败: ' + err.message); }
    });

    document.getElementById('setBgUrl').addEventListener('click', async function() {
        const url = document.getElementById('bgUrlInput').value.trim();
        if (!url) { setStatus('⚠️ 请输入URL'); return; }
        if (!/^https?:\/\//i.test(url)) { setStatus('⚠️ 图片地址必须以 http:// 或 https:// 开头'); return; }
        try {
            await API.post('/settings', { key: 'background', value: { type: 'url', url } });
            const preview = document.getElementById('bgPreview');
            preview.style.backgroundImage = `url("${cssUrl(url)}")`; preview.classList.add('has-bg'); preview.textContent = '';
            setStatus('✅ 背景已更新');
        } catch (err) { setStatus('❌ 设置失败: ' + err.message); }
    });
    document.getElementById('uploadBgBtn').addEventListener('click', () => document.getElementById('bgFileInput').click());
    document.getElementById('bgFileInput').addEventListener('change', async function() {
        const file = this.files[0];
        if (!file) return;
        try {
            setStatus('🔄 上传中...');
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', body: formData });
            const data = await res.json().catch(() => ({ error: '服务器返回格式错误，请确认上传接口正常' }));
            if (!res.ok || data.error) throw new Error(data.error || '上传失败');
            if (data.success) {
                await API.post('/settings', { key: 'background', value: { type: 'local', path: data.url } });
                const preview = document.getElementById('bgPreview');
                preview.style.backgroundImage = `url("${cssUrl(data.url)}")`; preview.classList.add('has-bg'); preview.textContent = '';
                setStatus('✅ 背景已应用');
            } else { setStatus('❌ 上传失败: ' + (data.error || '')); }
        } catch (err) { setStatus('❌ 上传失败: ' + err.message); }
    });
    document.getElementById('removeBgBtn').addEventListener('click', async function() {
        if (!await showConfirm('确定移除背景吗？')) return;
        try {
            await API.delete('/settings/background');
            const preview = document.getElementById('bgPreview');
            preview.style.backgroundImage = ''; preview.classList.remove('has-bg'); preview.textContent = '暂无背景';
            setStatus('✅ 背景已移除');
        } catch (err) { setStatus('❌ 移除失败: ' + err.message); }
    });

    document.getElementById('uploadFaviconBtn').addEventListener('click', uploadFavicon);
    document.getElementById('faviconFileInput').addEventListener('change', () => document.getElementById('faviconStatus').textContent = '');
    saveRegisterSwitchBtn.addEventListener('click', saveRegisterSwitch);
    saveSuffixBtn.addEventListener('click', saveSuffixSettings);

    async function undoLastAction() {
        if (state.undoStack.length === 0) {
            setStatus('⚠️ 没有可撤销的操作');
            return;
        }
        const lastAction = state.undoStack.pop();
        try {
            if (lastAction.type === 'multi_paste') {
                lastAction.data.forEach(item => {
                    const record = state.records.find(r => r.id === item.recordId);
                    if (record) {
                        record.data[item.colKey] = item.oldValue;
                        if (item.oldHostExpire !== undefined) record.data.host_expire = item.oldHostExpire;
                        if (item.oldClientExpire !== undefined) record.data.client_expire = item.oldClientExpire;
                        record._updated = true;
                    }
                });
                await flushPendingSaves();
                renderTable(false);
                setStatus('✅ 已撤销批量粘贴操作');
            } else if (lastAction.type === 'cell_edit') {
                const record = state.records.find(r => r.id === lastAction.recordId);
                if (record) {
                    record.data[lastAction.colKey] = lastAction.oldValue;
                    if (lastAction.colKey === 'months' && lastAction.oldHostExpire !== null) {
                        record.data.host_expire = lastAction.oldHostExpire;
                    }
                    if (lastAction.colKey === 'ip_address' && lastAction.oldIpInfo !== null) {
                        record.data.ip_info = lastAction.oldIpInfo;
                    }
                    if (lastAction.colKey === 'host_purchase' && lastAction.oldHostExpire !== null) {
                        record.data.host_expire = lastAction.oldHostExpire;
                    }
                    if (lastAction.colKey === 'client_purchase' && lastAction.oldClientExpire !== null) {
                        record.data.client_expire = lastAction.oldClientExpire;
                    }
                    record._updated = true;
                    await saveRecord(record);
                    renderTable(false);
                    setStatus('✅ 已撤销单元格编辑');
                }
            } else if (lastAction.type === 'add_row') {
                await API.delete('/records/' + lastAction.recordId);
                state.selectedRows.delete(lastAction.recordId);
                await loadRecords(state.currentTabId);
                updateTabCache(state.currentTabId);
                renderTable(false);
                setStatus('✅ 已撤销添加行');
            } else if (lastAction.type === 'delete_rows') {
                const records = lastAction.records || [];
                for (const rec of records) {
                    await API.post('/records', {
                        tab_id: state.currentTabId,
                        data: rec.data,
                        record_type: rec.record_type,
                        parent_id: rec.parent_id,
                        sort_order: rec.sort_order
                    });
                }
                await loadRecords(state.currentTabId);
                updateTabCache(state.currentTabId);
                renderTable(false);
                setStatus(`✅ 已撤销删除 ${records.length} 条记录`);
            }
        } catch (err) {
            setStatus('❌ 撤销失败: ' + err.message);
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'n') { e.preventDefault(); showAddRowModal(); }
        if (e.key === 'Delete' && !e.target.closest('input') && !e.target.closest('select')) deleteSelected();
        if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoLastAction(); }
    });

    let tableLoadingStartTime = 0;
    const TABLE_LOADING_MIN_TIME = 300;
    function showTableLoading() {
        const el = document.getElementById('tableLoading');
        if (el) { el.classList.remove('hidden'); tableLoadingStartTime = Date.now(); }
    }
    function hideTableLoading() {
        const el = document.getElementById('tableLoading');
        if (!el) return;
        const elapsed = Date.now() - tableLoadingStartTime;
        const remaining = TABLE_LOADING_MIN_TIME - elapsed;
        if (remaining > 0) setTimeout(() => el.classList.add('hidden'), remaining);
        else el.classList.add('hidden');
    }

    // --- 初始化 ---
    async function init() {
        try {
            const auth = await API.get('/auth/check');
            if (!auth.loggedIn) { window.location.href = '/login'; return; }
            usernameDisplay.textContent = auth.user.username;
            state.userName = auth.user.username;
            state.isAdmin = (auth.user.id === 1);
            state.userId = auth.user.id;
            await loadProviderOptions();
            await loadTabs();
            // 从 localStorage 恢复筛选状态
            try {
                const savedFilters = localStorage.getItem('tabFilters_' + auth.user.id);
                if (savedFilters) state.tabFilters = JSON.parse(savedFilters);
            } catch(e) {}
            if (state.tabs.length === 0) await createDefaultTab();
            else {
                state.currentTabId = state.tabs[0].id;
                state.filters = state.tabFilters[state.tabs[0].id] ? { ...state.tabFilters[state.tabs[0].id] } : {};
                await loadDataForTab(state.currentTabId);
            }
            collectProviderOptionsFromRecords();
            renderTabs();
            renderTable(false);
            setStatus('✅ 加载完成');
            const tab = state.tabs.find(t => t.id === state.currentTabId);
            if (tab) document.getElementById('columnModalTabName').textContent = tab.name;
            loadSettings();
            startHeartbeat();

            // open-link 事件委托：绑定一次，不依赖 renderTable 重新绑定
            document.addEventListener('click', function(e) {
                const btn = e.target.closest('.open-link');
                if (!btn) return;
                e.preventDefault();
                e.stopPropagation();
                const tr = btn.closest('tr');
                // 从同一行的 address-select 下拉框读取当前选中值（最可靠）
                const sel = tr ? tr.querySelector('.address-select') : null;
                const address = sel ? sel.value : (btn.dataset.address || '');
                if (!address) { setStatus('⚠️ 请先选择地址类型'); return; }
                let ip = btn.dataset.ip || '';
                let domain = btn.dataset.domain || '';
                // 判断是否为 IP 类型：选中值包含 "IP" 或为 "地址"
                const isIP = address.includes('IP') || address === '地址';
                if (isIP) {
                    if (!ip) {
                        const ipInput = tr ? tr.querySelector('input[data-col="ip_address"]') : null;
                        if (ipInput && ipInput.value.trim()) ip = ipInput.value.trim();
                    }
                    if (!ip) { setStatus('⚠️ IP地址为空'); return; }
                    let base = ip;
                    let suffix = state.ipPortSuffix || '';
                    const url = base + suffix;
                    let fullUrl = url;
                    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'http://' + fullUrl;
                    window.open(fullUrl, '_blank');
                } else {
                    // 域名类型
                    if (!domain) {
                        const domainInput = tr ? tr.querySelector('input[data-col="domain"]') : null;
                        if (domainInput && domainInput.value.trim()) domain = domainInput.value.trim();
                    }
                    if (!domain) { setStatus('⚠️ 域名为空'); return; }
                    let base = domain;
                    let suffix = state.domainPortSuffix || '';
                    const url = base + suffix;
                    let fullUrl = url;
                    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'http://' + fullUrl;
                    window.open(fullUrl, '_blank');
                }
            });

            initHostsModule();
            hideTableLoading();
        } catch (err) { console.error('初始化失败:', err); setStatus('❌ 初始化失败: ' + err.message); hideTableLoading(); }
    }

    // --- 主机管理模块 ---
    let sshConnections = [];
    let activeConnId = null;
    let connIdCounter = 0;
    let hosts = [];
    let commandFolders = [];

    async function loadHosts() {
        try {
            const res = await fetch('/api/hosts');
            if (res.ok) hosts = await res.json();
            renderHosts();
        } catch (err) { console.error('加载主机列表失败:', err); }
    }

    function renderHosts() {
        const list = document.getElementById('hostsList');
        const searchInput = document.getElementById('hostSearchInput');
        const keyword = (searchInput?.value || '').trim().toLowerCase();

        let filtered = hosts;
        if (keyword) {
            filtered = hosts.filter(h =>
                (h.host || '').toLowerCase().includes(keyword) ||
                (h.name || '').toLowerCase().includes(keyword)
            );
        }

        if (!filtered.length) {
            list.innerHTML = '<div style="text-align:center;color:#999;padding:20px 0;">' + (keyword ? '未找到匹配的主机' : '暂无主机') + '</div>';
            return;
        }
        list.innerHTML = filtered.map(h => `
            <div class="host-item" data-id="${h.id}">
                <div class="host-item-main">
                    <div class="host-name">${escapeHtml(h.name)}</div>
                    <div class="host-info">${escapeHtml(h.username)}@${escapeHtml(h.host)}:${h.port || 22}</div>
                </div>
                <div class="host-item-actions">
                    <button class="host-connect-btn" data-id="${h.id}" title="连接">🔌</button>
                    <button class="host-edit-btn" data-id="${h.id}" title="编辑">✏️</button>
                    <button class="host-delete-btn" data-id="${h.id}" title="删除">🗑️</button>
                </div>
            </div>
        `).join('');
    }

    async function loadCommandFolders() {
        try {
            const res = await fetch('/api/commands/folders');
            if (res.ok) commandFolders = await res.json();
            renderFolders();
        } catch (err) { console.error('加载命令文件夹失败:', err); }
    }

    function renderFolders() {
        const list = document.getElementById('foldersList');
        if (!commandFolders.length) {
            list.innerHTML = '<div style="text-align:center;color:#999;padding:15px 0;font-size:12px;">暂无文件夹</div>';
            return;
        }
        list.innerHTML = commandFolders.map((f, idx) => `
            <div class="folder-item" data-id="${f.id}">
                <div class="folder-header">
                    <span class="folder-icon">📁</span>
                    <span class="folder-name">${escapeHtml(f.name)}</span>
                    <span class="folder-count">${f.commands?.length || 0}</span>
                    <div class="folder-actions">
                        <button class="folder-move-up-btn" data-id="${f.id}" title="上移" style="opacity:${idx === 0 ? 0.3 : 1};cursor:${idx === 0 ? 'not-allowed' : 'pointer'};">⬆️</button>
                        <button class="folder-move-down-btn" data-id="${f.id}" title="下移" style="opacity:${idx === commandFolders.length - 1 ? 0.3 : 1};cursor:${idx === commandFolders.length - 1 ? 'not-allowed' : 'pointer'};">⬇️</button>
                        <button class="folder-add-cmd-btn" data-id="${f.id}" title="添加命令">➕</button>
                        <button class="folder-edit-btn" data-id="${f.id}" title="重命名">✏️</button>
                        <button class="folder-delete-btn" data-id="${f.id}" title="删除">🗑️</button>
                    </div>
                </div>
                <div class="folder-commands" id="folder-cmds-${f.id}">
                    ${(f.commands || []).map(c => `
                        <div class="cmd-item" data-id="${c.id}">
                            <span class="cmd-name">${escapeHtml(c.name)}</span>
                            <div class="cmd-actions">
                                <button class="cmd-run-btn" data-id="${c.id}" title="执行">▶️</button>
                                <button class="cmd-edit-btn" data-id="${c.id}" title="编辑">✏️</button>
                                <button class="cmd-delete-btn" data-id="${c.id}" title="删除">🗑️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    function showAddHostModal(host = null) {
        const isEdit = !!host;
        const title = isEdit ? '编辑主机' : '添加主机';
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal" style="width:480px;">
                <div class="modal-header">
                    <h2>${isEdit ? '✏️' : '➕'} ${title}</h2>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="input-group"><label>主机名称</label><input type="text" id="hostNameInput" value="${isEdit ? escapeAttr(host.name) : ''}" placeholder="例如：生产服务器" /></div>
                    <div class="input-group"><label>主机地址</label><input type="text" id="hostAddrInput" value="${isEdit ? escapeAttr(host.host) : ''}" placeholder="例如：192.168.1.1" /></div>
                    <div class="input-group"><label>端口</label><input type="number" id="hostPortInput" value="${isEdit ? (host.port || 22) : 22}" /></div>
                    <div class="input-group"><label>用户名</label><input type="text" id="hostUserInput" value="${isEdit ? escapeAttr(host.username) : ''}" placeholder="例如：root" /></div>
                    <div class="input-group"><label>密码</label><input type="password" id="hostPwdInput" value="" placeholder="请输入密码" /></div>
                    <div class="input-group"><label>备注</label><input type="text" id="hostRemarkInput" value="${isEdit ? escapeAttr(host.remark || '') : ''}" placeholder="可选" /></div>
                    <div class="modal-actions">
                        <button class="tool-btn primary" id="saveHostBtn">${isEdit ? '保存' : '添加'}</button>
                        <button class="tool-btn cancel-host-btn">取消</button>
                    </div>
                    <span id="hostStatus" style="color:#67c23a;display:block;margin-top:8px;"></span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.modal-close').onclick = () => overlay.remove();
        overlay.querySelector('.cancel-host-btn').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.querySelector('#saveHostBtn').onclick = async () => {
            const name = overlay.querySelector('#hostNameInput').value.trim();
            const hostAddr = overlay.querySelector('#hostAddrInput').value.trim();
            const port = parseInt(overlay.querySelector('#hostPortInput').value) || 22;
            const username = overlay.querySelector('#hostUserInput').value.trim();
            const password = overlay.querySelector('#hostPwdInput').value;
            const remark = overlay.querySelector('#hostRemarkInput').value.trim();
            const statusEl = overlay.querySelector('#hostStatus');

            if (!name) { statusEl.style.color = '#f56c6c'; statusEl.textContent = '请输入主机名称'; return; }
            if (!hostAddr) { statusEl.style.color = '#f56c6c'; statusEl.textContent = '请输入主机地址'; return; }
            if (!username) { statusEl.style.color = '#f56c6c'; statusEl.textContent = '请输入用户名'; return; }

            try {
                let res;
                if (isEdit) {
                    const body = { name, host: hostAddr, port, username, remark };
                    if (password) body.password = password;
                    res = await fetch(`/api/hosts/${host.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
                } else {
                    res = await fetch('/api/hosts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, host: hostAddr, port, username, password, remark }) });
                }
                const data = await res.json();
                if (res.ok) {
                    statusEl.style.color = '#67c23a';
                    statusEl.textContent = data.message;
                    await loadHosts();
                    setTimeout(() => overlay.remove(), 600);
                } else {
                    statusEl.style.color = '#f56c6c';
                    statusEl.textContent = data.error || '操作失败';
                }
            } catch (err) {
                statusEl.style.color = '#f56c6c';
                statusEl.textContent = '请求失败: ' + err.message;
            }
        };
    }

    function showAddFolderModal(folder = null) {
        const isEdit = !!folder;
        const title = isEdit ? '重命名文件夹' : '新建文件夹';
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal" style="width:360px;">
                <div class="modal-header">
                    <h2>${isEdit ? '✏️' : '📁'} ${title}</h2>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="input-group"><label>文件夹名称</label><input type="text" id="folderNameInput" value="${isEdit ? escapeAttr(folder.name) : ''}" placeholder="例如：常用命令" /></div>
                    <div class="modal-actions">
                        <button class="tool-btn primary" id="saveFolderBtn">${isEdit ? '保存' : '创建'}</button>
                        <button class="tool-btn cancel-folder-btn">取消</button>
                    </div>
                    <span id="folderStatus" style="color:#67c23a;display:block;margin-top:8px;"></span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.modal-close').onclick = () => overlay.remove();
        overlay.querySelector('.cancel-folder-btn').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.querySelector('#saveFolderBtn').onclick = async () => {
            const name = overlay.querySelector('#folderNameInput').value.trim();
            const statusEl = overlay.querySelector('#folderStatus');
            if (!name) { statusEl.style.color = '#f56c6c'; statusEl.textContent = '请输入文件夹名称'; return; }

            try {
                let res;
                if (isEdit) {
                    res = await fetch(`/api/commands/folders/${folder.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                } else {
                    res = await fetch('/api/commands/folders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                }
                const data = await res.json();
                if (res.ok) {
                    statusEl.style.color = '#67c23a';
                    statusEl.textContent = data.message;
                    await loadCommandFolders();
                    setTimeout(() => overlay.remove(), 600);
                } else {
                    statusEl.style.color = '#f56c6c';
                    statusEl.textContent = data.error || '操作失败';
                }
            } catch (err) {
                statusEl.style.color = '#f56c6c';
                statusEl.textContent = '请求失败: ' + err.message;
            }
        };
    }

    function showAddCmdModal(folderId, cmd = null) {
        const isEdit = !!cmd;
        const title = isEdit ? '编辑命令' : '保存命令';
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal" style="width:480px;">
                <div class="modal-header">
                    <h2>${isEdit ? '✏️' : '💾'} ${title}</h2>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body">
                    <div class="input-group"><label>命令名称</label><input type="text" id="cmdNameInput" value="${isEdit ? escapeAttr(cmd.name) : ''}" placeholder="例如：查看磁盘空间" /></div>
                    <div class="input-group"><label>命令内容</label><textarea id="cmdContentInput" rows="4" placeholder="例如：df -h">${isEdit ? escapeHtml(cmd.command) : ''}</textarea></div>
                    <div class="input-group"><label>备注</label><input type="text" id="cmdRemarkInput" value="${isEdit ? escapeAttr(cmd.remark || '') : ''}" placeholder="可选" /></div>
                    <div class="modal-actions">
                        <button class="tool-btn primary" id="saveCmdBtn">${isEdit ? '保存' : '添加'}</button>
                        <button class="tool-btn cancel-cmd-btn">取消</button>
                    </div>
                    <span id="cmdStatus" style="color:#67c23a;display:block;margin-top:8px;"></span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('.modal-close').onclick = () => overlay.remove();
        overlay.querySelector('.cancel-cmd-btn').onclick = () => overlay.remove();
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.querySelector('#saveCmdBtn').onclick = async () => {
            const name = overlay.querySelector('#cmdNameInput').value.trim();
            const command = overlay.querySelector('#cmdContentInput').value.trim();
            const remark = overlay.querySelector('#cmdRemarkInput').value.trim();
            const statusEl = overlay.querySelector('#cmdStatus');

            if (!name) { statusEl.style.color = '#f56c6c'; statusEl.textContent = '请输入命令名称'; return; }
            if (!command) { statusEl.style.color = '#f56c6c'; statusEl.textContent = '请输入命令内容'; return; }

            try {
                let res;
                if (isEdit) {
                    res = await fetch(`/api/commands/commands/${cmd.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, command, remark }) });
                } else {
                    res = await fetch('/api/commands/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder_id: folderId, name, command, remark }) });
                }
                const data = await res.json();
                if (res.ok) {
                    statusEl.style.color = '#67c23a';
                    statusEl.textContent = data.message;
                    await loadCommandFolders();
                    setTimeout(() => overlay.remove(), 600);
                } else {
                    statusEl.style.color = '#f56c6c';
                    statusEl.textContent = data.error || '操作失败';
                }
            } catch (err) {
                statusEl.style.color = '#f56c6c';
                statusEl.textContent = '请求失败: ' + err.message;
            }
        };
    }

    function connectSSH(host) {
        const connId = ++connIdCounter;
        const terminal = document.getElementById('terminalContainer');
        const title = document.querySelector('.terminal-title');
        const input = document.getElementById('terminalInput');
        const sendBtn = document.getElementById('sendCmdBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const fileManagerBtn = document.getElementById('fileManagerBtn');

        const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProto}//${location.host}/ssh`;
        const ws = new WebSocket(wsUrl);

        const conn = {
            id: connId,
            host: host,
            ws: ws,
            clientPing: null,
            terminalContent: ''
        };
        sshConnections.push(conn);

        switchToConnection(connId);
        renderSshTabs();

        title.textContent = `正在连接 ${host.name} (${host.host}:${host.port})...`;
        terminal.innerHTML = '<div style="padding:16px;color:#909399;">正在建立 SSH 连接...</div>';

        const clientPing = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 25000);
        conn.clientPing = clientPing;

        ws.onopen = async () => {
            try {
                const pwdRes = await fetch(`/api/hosts/${host.id}/password`);
                const pwdData = await pwdRes.json();
                const password = pwdData.password || '';

                const savedProxies = localStorage.getItem('sshProxyConfigs');
                const savedActiveProxy = localStorage.getItem('sshActiveProxy');
                let proxy = { type: 'none' };

                if (savedProxies && savedActiveProxy) {
                    const proxies = JSON.parse(savedProxies);
                    const active = proxies.find(p => p.id === savedActiveProxy);
                    if (active) {
                        proxy = active;
                    }
                }

                ws.send(JSON.stringify({ type: 'connect', host: host.host, port: host.port, username: host.username, password, proxy }));
            } catch (err) {
                terminal.innerHTML = `<div style="padding:16px;color:#f56c6c;">获取密码失败: ${err.message}</div>`;
            }
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'connected') {
                    if (activeConnId === connId) {
                        title.textContent = `${host.name} (${host.host}:${host.port}) - 已连接`;
                        terminal.innerHTML = '<div class="terminal-output" id="terminalOutput"></div>';
                        input.disabled = false;
                        sendBtn.disabled = false;
                        disconnectBtn.style.display = 'inline-block';
                        fileManagerBtn.style.display = 'inline-block';
                        appendTerminalOutput(msg.data + '\n');
                    } else {
                        conn.terminalContent = msg.data + '\n';
                    }
                    updateTabStatus(connId, 'connected');
                } else if (msg.type === 'output') {
                    if (activeConnId === connId) {
                        appendTerminalOutput(msg.data);
                    } else {
                        conn.terminalContent += msg.data;
                    }
                } else if (msg.type === 'error') {
                    if (activeConnId === connId) {
                        appendTerminalOutput('\n[错误] ' + msg.data + '\n', 'error');
                    } else {
                        conn.terminalContent += '\n[错误] ' + msg.data + '\n';
                    }
                } else if (msg.type === 'disconnected') {
                    if (activeConnId === connId) {
                        title.textContent = `${host.name} - 已断开`;
                        input.disabled = true;
                        sendBtn.disabled = true;
                        disconnectBtn.style.display = 'none';
                        fileManagerBtn.style.display = 'none';
                        appendTerminalOutput('\n' + msg.data + '\n', 'warning');
                    } else {
                        conn.terminalContent += '\n' + msg.data + '\n';
                    }
                    updateTabStatus(connId, 'disconnected');
                    clearInterval(clientPing);
                } else if (msg.type === 'sftp_list') {
                    handleSftpList(msg.data);
                } else if (msg.type === 'sftp_read') {
                    handleSftpRead(msg.data);
                } else if (msg.type === 'sftp_write') {
                    handleSftpWrite(msg.data);
                } else if (msg.type === 'sftp_upload') {
                    handleSftpUpload(msg.data);
                } else if (msg.type === 'sftp_delete') {
                    handleSftpDelete(msg.data);
                } else if (msg.type === 'sftp_error') {
                    handleSftpError(msg.data);
                }
            } catch (e) { console.error('消息解析失败:', e); }
        };

        ws.onerror = () => {
            if (activeConnId === connId) {
                terminal.innerHTML = '<div style="padding:16px;color:#f56c6c;">WebSocket 连接失败</div>';
                title.textContent = '连接失败';
                input.disabled = true;
                sendBtn.disabled = true;
                disconnectBtn.style.display = 'none';
                fileManagerBtn.style.display = 'none';
            }
            updateTabStatus(connId, 'error');
            clearInterval(clientPing);
        };

        ws.onclose = () => {
            clearInterval(clientPing);
            if (activeConnId === connId && title.textContent.indexOf('已断开') === -1 && title.textContent.indexOf('连接失败') === -1) {
                title.textContent = `${host.name} - 连接已关闭`;
                input.disabled = true;
                sendBtn.disabled = true;
                disconnectBtn.style.display = 'none';
                fileManagerBtn.style.display = 'none';
                appendTerminalOutput('\n[连接已关闭]\n', 'warning');
            }
            updateTabStatus(connId, 'closed');
        };
    }

    function getActiveConn() {
        return sshConnections.find(c => c.id === activeConnId);
    }

    function getActiveWs() {
        const conn = getActiveConn();
        return conn ? conn.ws : null;
    }

    function renderSshTabs() {
        const tabsEl = document.getElementById('sshTabs');
        if (!tabsEl) return;
        if (sshConnections.length === 0) {
            tabsEl.style.display = 'none';
            return;
        }
        tabsEl.style.display = 'flex';
        tabsEl.innerHTML = sshConnections.map(c => `
            <div class="ssh-tab ${c.id === activeConnId ? 'active' : ''}" data-id="${c.id}" data-status="${c.status || 'connecting'}">
                <span class="ssh-tab-name">${escapeHtml(c.host.name)}</span>
                <span class="ssh-tab-close" data-id="${c.id}">✕</span>
            </div>
        `).join('');

        tabsEl.querySelectorAll('.ssh-tab').forEach(tab => {
            tab.onclick = (e) => {
                if (e.target.closest('.ssh-tab-close')) return;
                const id = parseInt(tab.dataset.id);
                switchToConnection(id);
            };
        });

        tabsEl.querySelectorAll('.ssh-tab-close').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                closeConnection(id);
            };
        });
    }

    function switchToConnection(connId) {
        const conn = sshConnections.find(c => c.id === connId);
        if (!conn) return;

        activeConnId = connId;
        renderSshTabs();

        const terminal = document.getElementById('terminalContainer');
        const title = document.querySelector('.terminal-title');
        const input = document.getElementById('terminalInput');
        const sendBtn = document.getElementById('sendCmdBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const fileManagerBtn = document.getElementById('fileManagerBtn');

        const ws = conn.ws;
        const host = conn.host;
        const isOpen = ws && ws.readyState === WebSocket.OPEN;

        if (isOpen) {
            title.textContent = `${host.name} (${host.host}:${host.port}) - 已连接`;
            terminal.innerHTML = '<div class="terminal-output" id="terminalOutput"></div>';
            input.disabled = false;
            sendBtn.disabled = false;
            disconnectBtn.style.display = 'inline-block';
            fileManagerBtn.style.display = 'inline-block';
            if (conn.terminalContent) {
                const output = document.getElementById('terminalOutput');
                const span = document.createElement('span');
                span.innerHTML = ansiToHtml(conn.terminalContent);
                output.appendChild(span);
                output.scrollTop = output.scrollHeight;
            }
        } else if (ws && ws.readyState === WebSocket.CONNECTING) {
            title.textContent = `正在连接 ${host.name} (${host.host}:${host.port})...`;
            terminal.innerHTML = '<div style="padding:16px;color:#909399;">正在建立 SSH 连接...</div>';
            input.disabled = true;
            sendBtn.disabled = true;
            disconnectBtn.style.display = 'none';
            fileManagerBtn.style.display = 'none';
        } else {
            title.textContent = `${host.name} - 已断开`;
            terminal.innerHTML = '<div class="terminal-output" id="terminalOutput"></div>';
            input.disabled = true;
            sendBtn.disabled = true;
            disconnectBtn.style.display = 'none';
            fileManagerBtn.style.display = 'none';
            if (conn.terminalContent) {
                const output = document.getElementById('terminalOutput');
                const span = document.createElement('span');
                span.innerHTML = ansiToHtml(conn.terminalContent);
                output.appendChild(span);
                output.scrollTop = output.scrollHeight;
            }
        }
    }

    function updateTabStatus(connId, status) {
        const conn = sshConnections.find(c => c.id === connId);
        if (conn) {
            conn.status = status;
        }
        renderSshTabs();
    }

    function closeConnection(connId) {
        const idx = sshConnections.findIndex(c => c.id === connId);
        if (idx < 0) return;
        const conn = sshConnections[idx];
        if (conn.ws) {
            try { conn.ws.close(); } catch(e) {}
        }
        if (conn.clientPing) clearInterval(conn.clientPing);
        sshConnections.splice(idx, 1);

        if (activeConnId === connId) {
            if (sshConnections.length > 0) {
                const newIdx = Math.min(idx, sshConnections.length - 1);
                switchToConnection(sshConnections[newIdx].id);
            } else {
                activeConnId = null;
                renderSshTabs();
                const terminal = document.getElementById('terminalContainer');
                const title = document.querySelector('.terminal-title');
                const input = document.getElementById('terminalInput');
                const sendBtn = document.getElementById('sendCmdBtn');
                const disconnectBtn = document.getElementById('disconnectBtn');
                const fileManagerBtn = document.getElementById('fileManagerBtn');
                title.textContent = '请选择主机连接';
                terminal.innerHTML = `
                    <div class="terminal-placeholder">
                        <div style="font-size:48px;margin-bottom:16px;">🖥️</div>
                        <div style="color:#999;font-size:14px;">从左侧选择主机发起 SSH 连接</div>
                    </div>
                `;
                input.disabled = true;
                sendBtn.disabled = true;
                disconnectBtn.style.display = 'none';
                fileManagerBtn.style.display = 'none';
            }
        } else {
            renderSshTabs();
        }
    }

    let fileManagerState = {
        currentPath: '/root',
        files: [],
        editingFile: null,
        editingContent: '',
        overlay: null,
        contextMenu: null
    };

    function openFileManager() {
        if (!getActiveWs() || getActiveWs().readyState !== WebSocket.OPEN) {
            setStatus('⚠️ 请先连接主机');
            return;
        }

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal" style="width:720px;max-height:85vh;">
                <div class="modal-header">
                    <h2>📁 文件管理器</h2>
                    <button class="modal-close">✕</button>
                </div>
                <div class="modal-body" style="display:flex;flex-direction:column;gap:12px;padding:16px;">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <button class="tool-btn sm" id="fmBackBtn">⬅️ 上级</button>
                        <span id="fmPath" style="flex:1;font-family:monospace;font-size:13px;background:#f5f7fa;padding:6px 10px;border-radius:4px;">/root</span>
                        <button class="tool-btn sm" id="fmRefreshBtn">🔄 刷新</button>
                        <button class="tool-btn sm" id="fmUploadBtn" style="background:#67c23a;color:#fff;">📤 上传文件</button>
                        <input type="file" id="fmFileInput" style="display:none;" />
                    </div>
                    <div id="fmFileList" style="flex:1;overflow-y:auto;border:1px solid #e4e7ed;border-radius:8px;min-height:300px;max-height:400px;">
                        <div style="text-align:center;color:#999;padding:40px 0;">加载中...</div>
                    </div>
                    <div id="fmEditor" style="display:none;flex-direction:column;gap:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span id="fmEditorTitle" style="font-weight:500;font-size:13px;">编辑文件</span>
                            <div style="display:flex;gap:8px;">
                                <button class="tool-btn sm" id="fmSaveBtn" style="background:#67c23a;color:#fff;">💾 保存</button>
                                <button class="tool-btn sm" id="fmCloseEditorBtn">关闭</button>
                            </div>
                        </div>
                        <textarea id="fmEditorContent" style="width:100%;height:200px;padding:10px;border:1px solid #dcdfe6;border-radius:6px;font-family:monospace;font-size:13px;resize:vertical;outline:none;"></textarea>
                        <span id="fmEditorStatus" style="font-size:12px;color:#67c23a;"></span>
                    </div>
                    <span id="fmStatus" style="font-size:12px;color:#909399;"></span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        fileManagerState.overlay = overlay;
        fileManagerState.currentPath = '/root';
        fileManagerState.files = [];
        fileManagerState.editingFile = null;

        overlay.querySelector('.modal-close').onclick = () => closeFileManager();
        overlay.onclick = (e) => { if (e.target === overlay) closeFileManager(); };

        overlay.querySelector('#fmBackBtn').onclick = () => {
            const p = fileManagerState.currentPath;
            if (p === '/' || p === '') return;
            const parts = p.split('/').filter(Boolean);
            parts.pop();
            const parentPath = '/' + parts.join('/');
            loadFileList(parentPath || '/');
        };

        overlay.querySelector('#fmRefreshBtn').onclick = () => {
            loadFileList(fileManagerState.currentPath);
        };

        overlay.querySelector('#fmUploadBtn').onclick = () => {
            overlay.querySelector('#fmFileInput').click();
        };

        overlay.querySelector('#fmFileInput').onchange = (e) => {
            const file = e.target.files[0];
            if (file) uploadFile(file);
            e.target.value = '';
        };

        overlay.querySelector('#fmSaveBtn').onclick = () => saveFile();
        overlay.querySelector('#fmCloseEditorBtn').onclick = () => closeEditor();

        loadFileList('/root');
    }

    function closeFileManager() {
        hideFmContextMenu();
        if (fileManagerState.overlay) {
            fileManagerState.overlay.remove();
            fileManagerState.overlay = null;
        }
    }

    function loadFileList(path) {
        if (!getActiveWs() || getActiveWs().readyState !== WebSocket.OPEN) return;
        fileManagerState.currentPath = path;
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmPath').textContent = path;
        overlay.querySelector('#fmFileList').innerHTML = '<div style="text-align:center;color:#999;padding:40px 0;">加载中...</div>';
        overlay.querySelector('#fmStatus').textContent = '';
        getActiveWs().send(JSON.stringify({ type: 'sftp_list', path }));
    }

    function handleSftpList(data) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        fileManagerState.files = data.files || [];
        fileManagerState.currentPath = data.path;
        overlay.querySelector('#fmPath').textContent = data.path;

        const listEl = overlay.querySelector('#fmFileList');
        const files = data.files || [];
        if (files.length === 0) {
            listEl.innerHTML = '<div style="text-align:center;color:#999;padding:40px 0;">空目录</div>';
            return;
        }

        files.sort((a, b) => {
            if (a.isDir && !b.isDir) return -1;
            if (!a.isDir && b.isDir) return 1;
            return a.name.localeCompare(b.name);
        });

        listEl.innerHTML = files.map(f => {
            const icon = f.isDir ? '📁' : '📄';
            const sizeStr = f.isDir ? '' : formatFileSize(f.size);
            return `
                <div class="fm-file-item" data-name="${escapeHtml(f.name)}" data-dir="${f.isDir ? '1' : '0'}">
                    <span class="fm-file-icon">${icon}</span>
                    <span class="fm-file-name">${escapeHtml(f.name)}</span>
                    <span class="fm-file-size">${sizeStr}</span>
                    <span class="fm-file-actions">
                        ${!f.isDir ? '<button class="fm-edit-btn" title="编辑">✏️</button>' : ''}
                    </span>
                </div>
            `;
        }).join('');

        listEl.querySelectorAll('.fm-file-item').forEach(item => {
            item.onclick = (e) => {
                hideFmContextMenu();
                const name = item.dataset.name;
                const isDir = item.dataset.dir === '1';
                if (e.target.closest('.fm-edit-btn')) {
                    readFile(name);
                } else if (isDir) {
                    const newPath = fileManagerState.currentPath.endsWith('/')
                        ? fileManagerState.currentPath + name
                        : fileManagerState.currentPath + '/' + name;
                    loadFileList(newPath);
                }
            };
            item.oncontextmenu = (e) => {
                e.preventDefault();
                const name = item.dataset.name;
                const fullPath = fileManagerState.currentPath.endsWith('/')
                    ? fileManagerState.currentPath + name
                    : fileManagerState.currentPath + '/' + name;
                showFmContextMenu(e.clientX, e.clientY, fullPath);
            };
        });
    }

    function showFmContextMenu(x, y, filePath) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        hideFmContextMenu();
        const menu = document.createElement('div');
        menu.className = 'fm-context-menu';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.innerHTML = `
            <div class="fm-context-item" data-action="copy-path">📋 复制路径</div>
            <div class="fm-context-item" data-action="delete-file" style="color:#f56c6c;">🗑️ 删除文件</div>
        `;
        document.body.appendChild(menu);
        fileManagerState.contextMenu = menu;

        menu.querySelector('[data-action="copy-path"]').onclick = () => {
            copyToClipboard(filePath);
            hideFmContextMenu();
            const overlay = fileManagerState.overlay;
            if (overlay) {
                const statusEl = overlay.querySelector('#fmStatus');
                statusEl.style.color = '#67c23a';
                statusEl.textContent = '✅ 路径已复制到剪贴板';
                setTimeout(() => { statusEl.textContent = ''; }, 2000);
            }
        };

        menu.querySelector('[data-action="delete-file"]').onclick = () => {
            hideFmContextMenu();
            deleteFile(filePath);
        };

        setTimeout(() => {
            document.addEventListener('click', hideFmContextMenu, { once: true });
        }, 0);
    }

    function hideFmContextMenu() {
        if (fileManagerState.contextMenu) {
            fileManagerState.contextMenu.remove();
            fileManagerState.contextMenu = null;
        }
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).catch(() => {
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand('copy'); } catch(e) {}
                document.body.removeChild(ta);
            });
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); } catch(e) {}
            document.body.removeChild(ta);
        }
    }

    function readFile(name) {
        if (!getActiveWs() || getActiveWs().readyState !== WebSocket.OPEN) return;
        const filePath = fileManagerState.currentPath.endsWith('/')
            ? fileManagerState.currentPath + name
            : fileManagerState.currentPath + '/' + name;
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmStatus').textContent = '读取中...';
        overlay.querySelector('#fmStatus').style.color = '#909399';
        getActiveWs().send(JSON.stringify({ type: 'sftp_read', path: filePath }));
    }

    function handleSftpRead(data) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        fileManagerState.editingFile = data.path;
        fileManagerState.editingContent = data.content || '';

        overlay.querySelector('#fmEditorTitle').textContent = '编辑: ' + data.path;
        overlay.querySelector('#fmEditorContent').value = data.content || '';
        overlay.querySelector('#fmEditorStatus').textContent = '';
        overlay.querySelector('#fmEditor').style.display = 'flex';
        overlay.querySelector('#fmStatus').textContent = '';
    }

    function saveFile() {
        if (!getActiveWs() || getActiveWs().readyState !== WebSocket.OPEN) return;
        const overlay = fileManagerState.overlay;
        if (!overlay || !fileManagerState.editingFile) return;
        const content = overlay.querySelector('#fmEditorContent').value;
        const statusEl = overlay.querySelector('#fmEditorStatus');
        statusEl.style.color = '#909399';
        statusEl.textContent = '保存中...';
        getActiveWs().send(JSON.stringify({
            type: 'sftp_write',
            path: fileManagerState.editingFile,
            content
        }));
    }

    function handleSftpWrite(data) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        const statusEl = overlay.querySelector('#fmEditorStatus');
        statusEl.style.color = '#67c23a';
        statusEl.textContent = '✅ 保存成功';
        setTimeout(() => { statusEl.textContent = ''; }, 2000);
    }

    function closeEditor() {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmEditor').style.display = 'none';
        fileManagerState.editingFile = null;
    }

    function uploadFile(file) {
        if (!getActiveWs() || getActiveWs().readyState !== WebSocket.OPEN) return;
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmStatus').style.color = '#909399';
        overlay.querySelector('#fmStatus').textContent = `上传中: ${file.name}...`;

        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            const filePath = fileManagerState.currentPath.endsWith('/')
                ? fileManagerState.currentPath + file.name
                : fileManagerState.currentPath + '/' + file.name;
            getActiveWs().send(JSON.stringify({
                type: 'sftp_upload',
                path: filePath,
                content: base64
            }));
        };
        reader.readAsDataURL(file);
    }

    function handleSftpUpload(data) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmStatus').style.color = '#67c23a';
        overlay.querySelector('#fmStatus').textContent = '✅ 上传成功';
        loadFileList(fileManagerState.currentPath);
    }

    function handleSftpError(msg) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmStatus').style.color = '#f56c6c';
        overlay.querySelector('#fmStatus').textContent = '❌ ' + msg;
    }

    function deleteFile(filePath) {
        if (!getActiveWs() || getActiveWs().readyState !== WebSocket.OPEN) return;
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        showConfirm(`确定要删除文件 "${filePath}" 吗？此操作不可撤销。`, '删除文件').then(async (confirmed) => {
            if (!confirmed) return;
            overlay.querySelector('#fmStatus').style.color = '#909399';
            overlay.querySelector('#fmStatus').textContent = '删除中...';
            getActiveWs().send(JSON.stringify({ type: 'sftp_delete', path: filePath }));
        });
    }

    function handleSftpDelete(data) {
        const overlay = fileManagerState.overlay;
        if (!overlay) return;
        overlay.querySelector('#fmStatus').style.color = '#67c23a';
        overlay.querySelector('#fmStatus').textContent = '✅ 删除成功';
        loadFileList(fileManagerState.currentPath);
    }

    function formatFileSize(bytes) {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    // ANSI 颜色代码解析器，将 SSH 终端颜色转义序列转为 HTML
    function ansiToHtml(text) {
        // ANSI SGR 颜色映射
        const colorMap = {
            30: '#000000', 31: '#cd3131', 32: '#0dbc79', 33: '#e5e510',
            34: '#2472c8', 35: '#bc3fbc', 36: '#11a8cd', 37: '#e5e5e5',
            90: '#666666', 91: '#f14c4c', 92: '#23d18b', 93: '#f5f543',
            94: '#3b8eea', 95: '#d670d6', 96: '#29b8db', 97: '#e5e5e5'
        };
        const bgColorMap = {
            40: '#000000', 41: '#cd3131', 42: '#0dbc79', 43: '#e5e510',
            44: '#2472c8', 45: '#bc3fbc', 46: '#11a8cd', 47: '#e5e5e5',
            100:'#666666', 101:'#f14c4c', 102:'#23d18b', 103:'#f5f543',
            104:'#3b8eea', 105:'#d670d6', 106:'#29b8db', 107:'#e5e5e5'
        };

        let result = '';
        let i = 0;
        let currentFg = '';
        let currentBg = '';
        let currentBold = false;
        let spanOpen = false;

        function closeSpan() {
            if (spanOpen) { result += '</span>'; spanOpen = false; }
        }
        function openSpan() {
            closeSpan();
            let style = '';
            if (currentFg) style += 'color:' + currentFg + ';';
            if (currentBg) style += 'background-color:' + currentBg + ';';
            if (currentBold) style += 'font-weight:bold;';
            if (style) { result += '<span style="' + style + '">'; spanOpen = true; }
        }

        while (i < text.length) {
            if (text.charCodeAt(i) === 27 && text.charAt(i + 1) === '[') {
                // 找到 CSI 序列
                let j = i + 2;
                let params = '';
                while (j < text.length) {
                    const c = text.charCodeAt(j);
                    if ((c >= 0x30 && c <= 0x3F) || c === 59) {
                        params += text.charAt(j);
                        j++;
                    } else if (c >= 0x40 && c <= 0x7E) {
                        // 终止符
                        const cmd = text.charAt(j);
                        if (cmd === 'm') {
                            const codes = params.split(';').map(Number);
                            if (codes.length === 0 || (codes.length === 1 && isNaN(codes[0]))) {
                                // 重置
                                currentFg = ''; currentBg = ''; currentBold = false;
                                closeSpan();
                            } else {
                                for (let k = 0; k < codes.length; k++) {
                                    const code = codes[k];
                                    if (code === 0) { currentFg = ''; currentBg = ''; currentBold = false; closeSpan(); }
                                    else if (code === 1) { currentBold = true; }
                                    else if (code === 22) { currentBold = false; }
                                    else if (code >= 30 && code <= 37) { currentFg = colorMap[code]; }
                                    else if (code >= 40 && code <= 47) { currentBg = bgColorMap[code]; }
                                    else if (code >= 90 && code <= 97) { currentFg = colorMap[code]; }
                                    else if (code >= 100 && code <= 107) { currentBg = bgColorMap[code]; }
                                    else if (code === 38 && codes[k + 1] === 5 && k + 2 < codes.length) {
                                        // 256色前景色
                                        const idx = codes[k + 2];
                                        if (idx >= 0 && idx <= 15) {
                                            const map256 = {0:'#000000',1:'#800000',2:'#008000',3:'#808000',4:'#000080',5:'#800080',6:'#008080',7:'#c0c0c0',8:'#808080',9:'#ff0000',10:'#00ff00',11:'#ffff00',12:'#0000ff',13:'#ff00ff',14:'#00ffff',15:'#ffffff'};
                                            currentFg = map256[idx] || '#e5e5e5';
                                        } else if (idx >= 16 && idx <= 231) {
                                            const r = Math.floor((idx - 16) / 36); const g = Math.floor(((idx - 16) % 36) / 6); const b = (idx - 16) % 6;
                                            const rv = r === 0 ? 0 : 55 + r * 40; const gv = g === 0 ? 0 : 55 + g * 40; const bv = b === 0 ? 0 : 55 + b * 40;
                                            currentFg = 'rgb(' + rv + ',' + gv + ',' + bv + ')';
                                        } else if (idx >= 232 && idx <= 255) {
                                            const gray = 8 + (idx - 232) * 10;
                                            currentFg = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
                                        }
                                        k += 2;
                                    } else if (code === 38 && codes[k + 1] === 2 && k + 4 < codes.length) {
                                        // RGB前景色
                                        currentFg = 'rgb(' + codes[k + 2] + ',' + codes[k + 3] + ',' + codes[k + 4] + ')';
                                        k += 4;
                                    } else if (code === 48 && codes[k + 1] === 5 && k + 2 < codes.length) {
                                        const idx = codes[k + 2];
                                        if (idx >= 0 && idx <= 15) {
                                            const map256 = {0:'#000000',1:'#800000',2:'#008000',3:'#808000',4:'#000080',5:'#800080',6:'#008080',7:'#c0c0c0',8:'#808080',9:'#ff0000',10:'#00ff00',11:'#ffff00',12:'#0000ff',13:'#ff00ff',14:'#00ffff',15:'#ffffff'};
                                            currentBg = map256[idx] || '#000000';
                                        } else if (idx >= 16 && idx <= 231) {
                                            const r = Math.floor((idx - 16) / 36); const g = Math.floor(((idx - 16) % 36) / 6); const b = (idx - 16) % 6;
                                            const rv = r === 0 ? 0 : 55 + r * 40; const gv = g === 0 ? 0 : 55 + g * 40; const bv = b === 0 ? 0 : 55 + b * 40;
                                            currentBg = 'rgb(' + rv + ',' + gv + ',' + bv + ')';
                                        } else if (idx >= 232 && idx <= 255) {
                                            const gray = 8 + (idx - 232) * 10;
                                            currentBg = 'rgb(' + gray + ',' + gray + ',' + gray + ')';
                                        }
                                        k += 2;
                                    } else if (code === 48 && codes[k + 1] === 2 && k + 4 < codes.length) {
                                        currentBg = 'rgb(' + codes[k + 2] + ',' + codes[k + 3] + ',' + codes[k + 4] + ')';
                                        k += 4;
                                    }
                                }
                                openSpan();
                            }
                        } else if (cmd === 'J' || cmd === 'K' || cmd === 'H') {
                            // 清屏/清除行/光标定位 - 忽略
                        }
                        j++;
                        break;
                    } else {
                        j++;
                    }
                }
                i = j;
            } else {
                const ch = text.charAt(i);
                if (ch === '<') result += '&lt;';
                else if (ch === '>') result += '&gt;';
                else if (ch === '&') result += '&amp;';
                else result += ch;
                i++;
            }
        }
        closeSpan();
        return result;
    }

    function appendTerminalOutput(text, type = '') {
        let output = document.getElementById('terminalOutput');
        if (!output) {
            const terminal = document.getElementById('terminalContainer');
            terminal.innerHTML = '<div class="terminal-output" id="terminalOutput"></div>';
            output = document.getElementById('terminalOutput');
        }
        if (type) {
            const span = document.createElement('span');
            if (type === 'error') span.style.color = '#f56c6c';
            else if (type === 'warning') span.style.color = '#e6a23c';
            span.textContent = text;
            output.appendChild(span);
        } else {
            const span = document.createElement('span');
            span.innerHTML = ansiToHtml(text);
            output.appendChild(span);
        }
        output.scrollTop = output.scrollHeight;

        const conn = getActiveConn();
        if (conn) {
            conn.terminalContent += text;
        }
    }

    function sendCommand(cmd) {
        if (!getActiveWs() || !cmd) return;
        getActiveWs().send(JSON.stringify({ type: 'input', data: cmd + '\n' }));
    }

    function initHostsModule() {
        document.getElementById('addHostBtn').onclick = () => showAddHostModal();
        document.getElementById('addCmdFolderBtn').onclick = () => showAddFolderModal();

        const searchInput = document.getElementById('hostSearchInput');
        if (searchInput) {
            searchInput.addEventListener('input', () => renderHosts());
        }

        const hostsList = document.getElementById('hostsList');
        hostsList.addEventListener('click', async (e) => {
            const connectBtn = e.target.closest('.host-connect-btn');
            const editBtn = e.target.closest('.host-edit-btn');
            const deleteBtn = e.target.closest('.host-delete-btn');

            if (connectBtn) {
                const id = parseInt(connectBtn.dataset.id);
                const host = hosts.find(h => h.id === id);
                if (host) connectSSH(host);
            } else if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                const host = hosts.find(h => h.id === id);
                if (host) showAddHostModal(host);
            } else if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                if (!confirm('确定要删除这个主机吗？')) return;
                try {
                    const res = await fetch(`/api/hosts/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) { setStatus(data.message); await loadHosts(); }
                    else setStatus('❌ ' + (data.error || '删除失败'));
                } catch (err) { setStatus('❌ 删除失败: ' + err.message); }
            }
        });

        const foldersList = document.getElementById('foldersList');
        foldersList.addEventListener('click', async (e) => {
            const folderItem = e.target.closest('.folder-item');
            const addCmdBtn = e.target.closest('.folder-add-cmd-btn');
            const editFolderBtn = e.target.closest('.folder-edit-btn');
            const delFolderBtn = e.target.closest('.folder-delete-btn');
            const moveUpBtn = e.target.closest('.folder-move-up-btn');
            const moveDownBtn = e.target.closest('.folder-move-down-btn');
            const runCmdBtn = e.target.closest('.cmd-run-btn');
            const editCmdBtn = e.target.closest('.cmd-edit-btn');
            const delCmdBtn = e.target.closest('.cmd-delete-btn');

            if (e.target.closest('.folder-header') && !addCmdBtn && !editFolderBtn && !delFolderBtn && !moveUpBtn && !moveDownBtn && folderItem) {
                const cmds = folderItem.querySelector('.folder-commands');
                if (cmds) cmds.classList.toggle('open');
            }

            if (moveUpBtn) {
                const id = parseInt(moveUpBtn.dataset.id);
                try {
                    const res = await fetch(`/api/commands/folders/${id}/move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ direction: 'up' })
                    });
                    const data = await res.json();
                    if (res.ok) { await loadCommandFolders(); }
                    else setStatus('❌ ' + (data.error || '移动失败'));
                } catch (err) { setStatus('❌ 移动失败: ' + err.message); }
            } else if (moveDownBtn) {
                const id = parseInt(moveDownBtn.dataset.id);
                try {
                    const res = await fetch(`/api/commands/folders/${id}/move`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ direction: 'down' })
                    });
                    const data = await res.json();
                    if (res.ok) { await loadCommandFolders(); }
                    else setStatus('❌ ' + (data.error || '移动失败'));
                } catch (err) { setStatus('❌ 移动失败: ' + err.message); }
            } else if (addCmdBtn) {
                const id = parseInt(addCmdBtn.dataset.id);
                showAddCmdModal(id);
            } else if (editFolderBtn) {
                const id = parseInt(editFolderBtn.dataset.id);
                const folder = commandFolders.find(f => f.id === id);
                if (folder) showAddFolderModal(folder);
            } else if (delFolderBtn) {
                const id = parseInt(delFolderBtn.dataset.id);
                if (!confirm('确定要删除这个文件夹吗？里面的命令也会被删除。')) return;
                try {
                    const res = await fetch(`/api/commands/folders/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) { setStatus(data.message); await loadCommandFolders(); }
                    else setStatus('❌ ' + (data.error || '删除失败'));
                } catch (err) { setStatus('❌ 删除失败: ' + err.message); }
            } else if (runCmdBtn) {
                const id = parseInt(runCmdBtn.dataset.id);
                let cmd = null;
                for (const f of commandFolders) {
                    cmd = (f.commands || []).find(c => c.id === id);
                    if (cmd) break;
                }
                if (cmd && getActiveWs()) {
                    sendCommand(cmd.command);
                } else if (!getActiveWs()) {
                    setStatus('⚠️ 请先连接主机');
                }
            } else if (editCmdBtn) {
                const id = parseInt(editCmdBtn.dataset.id);
                let cmd = null, folderId = null;
                for (const f of commandFolders) {
                    cmd = (f.commands || []).find(c => c.id === id);
                    if (cmd) { folderId = f.id; break; }
                }
                if (cmd) showAddCmdModal(folderId, cmd);
            } else if (delCmdBtn) {
                const id = parseInt(delCmdBtn.dataset.id);
                if (!confirm('确定要删除这条命令吗？')) return;
                try {
                    const res = await fetch(`/api/commands/commands/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) { setStatus(data.message); await loadCommandFolders(); }
                    else setStatus('❌ ' + (data.error || '删除失败'));
                } catch (err) { setStatus('❌ 删除失败: ' + err.message); }
            }
        });

        const terminalInput = document.getElementById('terminalInput');
        const sendCmdBtn = document.getElementById('sendCmdBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const fileManagerBtn = document.getElementById('fileManagerBtn');

        terminalInput.addEventListener('keydown', (e) => {
            // Ctrl+C 发送中断信号到SSH
            if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                if (getActiveWs() && getActiveWs().readyState === WebSocket.OPEN) {
                    getActiveWs().send(JSON.stringify({ type: 'input', data: '\x03' }));
                    appendTerminalOutput('^C\n', 'warning');
                }
                return;
            }
            // Ctrl+D 发送EOF
            if (e.ctrlKey && e.key === 'd') {
                e.preventDefault();
                if (getActiveWs() && getActiveWs().readyState === WebSocket.OPEN) {
                    getActiveWs().send(JSON.stringify({ type: 'input', data: '\x04' }));
                }
                return;
            }
            // Ctrl+Z 发送暂停信号
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                if (getActiveWs() && getActiveWs().readyState === WebSocket.OPEN) {
                    getActiveWs().send(JSON.stringify({ type: 'input', data: '\x1a' }));
                    appendTerminalOutput('^Z\n', 'warning');
                }
                return;
            }
            // Ctrl+L 清屏
            if (e.ctrlKey && e.key === 'l') {
                e.preventDefault();
                if (getActiveWs() && getActiveWs().readyState === WebSocket.OPEN) {
                    getActiveWs().send(JSON.stringify({ type: 'input', data: '\x0c' }));
                }
                return;
            }
            if (e.key === 'Enter') {
                const cmd = terminalInput.value.trim();
                if (cmd) {
                    sendCommand(cmd);
                    terminalInput.value = '';
                }
            }
        });
        sendCmdBtn.onclick = () => {
            const cmd = terminalInput.value.trim();
            if (cmd) {
                sendCommand(cmd);
                terminalInput.value = '';
            }
        };
        disconnectBtn.onclick = () => {
            if (activeConnId) {
                closeConnection(activeConnId);
            }
        };
        fileManagerBtn.onclick = () => {
            openFileManager();
        };

        const terminalBgColor = document.getElementById('terminalBgColor');
        const terminalBgColorText = document.getElementById('terminalBgColorText');
        const proxyType = document.getElementById('proxyType');
        const proxyHost = document.getElementById('proxyHost');
        const proxyPort = document.getElementById('proxyPort');
        const proxyUser = document.getElementById('proxyUser');
        const proxyPass = document.getElementById('proxyPass');
        const proxyVlessUuid = document.getElementById('proxyVlessUuid');
        const proxyVlessSni = document.getElementById('proxyVlessSni');
        const vlessSettings = document.getElementById('vlessSettings');

        // 加载保存的设置
        function loadSshSettings() {
            const savedBg = localStorage.getItem('sshTerminalBg');
            if (savedBg) {
                terminalBgColor.value = savedBg;
                terminalBgColorText.value = savedBg;
                document.getElementById('terminalContainer').style.background = savedBg;
                document.getElementById('terminalInput').style.background = savedBg;
            }

            const savedProxy = localStorage.getItem('sshProxySettings');
            if (savedProxy) {
                try {
                    const proxy = JSON.parse(savedProxy);
                    proxyType.value = proxy.type || 'none';
                    proxyHost.value = proxy.host || '';
                    proxyPort.value = proxy.port || '';
                    proxyUser.value = proxy.user || '';
                    proxyPass.value = proxy.password || '';
                    proxyVlessUuid.value = proxy.vlessUuid || '';
                    proxyVlessSni.value = proxy.vlessSni || '';
                    toggleVlessSettings();
                } catch(e) {}
            }
        }

        function toggleVlessSettings() {
            vlessSettings.style.display = proxyType.value === 'vless' ? 'flex' : 'none';
        }

        // SSH设置弹窗
        const sshSettingsModal = document.getElementById('sshSettingsModal');
        const sshSettingsBtn = document.getElementById('sshSettingsBtn');
        const closeSshSettings = document.getElementById('closeSshSettings');
        const saveSshSettingsBtn = document.getElementById('saveSshSettingsBtn');
        const sshSettingsStatus = document.getElementById('sshSettingsStatus');

        // 代理列表相关
        const proxyList = document.getElementById('proxyList');
        const addProxyBtn = document.getElementById('addProxyBtn');
        const proxyEditor = document.getElementById('proxyEditor');
        const proxyEditId = document.getElementById('proxyEditId');
        const proxyNameInput = document.getElementById('proxyName');
        const saveProxyBtn = document.getElementById('saveProxyBtn');
        const cancelProxyBtn = document.getElementById('cancelProxyBtn');

        let proxyConfigs = [];
        let activeProxyId = null;

        function loadSshSettings() {
            const savedBg = localStorage.getItem('sshTerminalBg');
            if (savedBg) {
                terminalBgColor.value = savedBg;
                terminalBgColorText.value = savedBg;
                document.getElementById('terminalContainer').style.background = savedBg;
                document.getElementById('terminalInput').style.background = savedBg;
            }

            const savedProxies = localStorage.getItem('sshProxyConfigs');
            if (savedProxies) {
                proxyConfigs = JSON.parse(savedProxies);
            } else {
                proxyConfigs = [];
            }

            const savedActiveProxy = localStorage.getItem('sshActiveProxy');
            activeProxyId = savedActiveProxy || null;

            renderProxyList();
            proxyEditor.style.display = 'none';
        }

        function renderProxyList() {
            if (proxyConfigs.length === 0) {
                proxyList.innerHTML = '<div style="text-align:center;color:#999;padding:10px;font-size:12px;">暂无代理配置，点击下方"添加代理"按钮添加</div>';
                return;
            }

            proxyList.innerHTML = proxyConfigs.map(p => `
                <div class="proxy-item ${p.id === activeProxyId ? 'checked' : ''}" data-id="${p.id}">
                    <input type="checkbox" class="proxy-checkbox" data-id="${p.id}" ${p.id === activeProxyId ? 'checked' : ''} />
                    <span class="proxy-name">${escapeHtml(p.name)}</span>
                    <span class="proxy-type">${p.type === 'socks' ? 'SOCKS5' : p.type === 'http' ? 'HTTP' : p.type === 'vless' ? 'VLESS' : '无代理'}</span>
                    <span class="proxy-edit" data-id="${p.id}" title="编辑">✏️</span>
                    <span class="proxy-delete" data-id="${p.id}" title="删除">✕</span>
                </div>
            `).join('');

            proxyList.querySelectorAll('.proxy-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (e.target.classList.contains('proxy-delete')) {
                        e.stopPropagation();
                        const id = e.target.dataset.id;
                        const proxy = proxyConfigs.find(p => p.id === id);
                        showConfirm(`确定要删除代理 "${proxy ? proxy.name : ''}" 吗？`, '删除代理').then((confirmed) => {
                            if (confirmed) deleteProxy(id);
                        });
                    } else if (e.target.classList.contains('proxy-edit')) {
                        e.stopPropagation();
                        editProxy(e.target.dataset.id);
                    } else if (e.target.classList.contains('proxy-checkbox')) {
                        e.stopPropagation();
                        const id = e.target.dataset.id;
                        if (e.target.checked) {
                            activeProxyId = id;
                        } else {
                            activeProxyId = null;
                        }
                        localStorage.setItem('sshActiveProxy', activeProxyId || '');
                        renderProxyList();
                    }
                });
            });
        }

        function editProxy(id) {
            const proxy = proxyConfigs.find(p => p.id === id);
            if (!proxy) return;
            proxyEditId.value = proxy.id;
            proxyNameInput.value = proxy.name;
            proxyType.value = proxy.type || 'none';
            proxyHost.value = proxy.host || '';
            proxyPort.value = proxy.port || '';
            proxyUser.value = proxy.user || '';
            proxyPass.value = proxy.password || '';
            proxyVlessUuid.value = proxy.vlessUuid || '';
            proxyVlessSni.value = proxy.vlessSni || '';
            toggleVlessSettings();
            proxyEditor.style.display = 'block';
            proxyNameInput.focus();
        }

        function deleteProxy(id) {
            proxyConfigs = proxyConfigs.filter(p => p.id !== id);
            if (activeProxyId === id) {
                activeProxyId = null;
            }
            localStorage.setItem('sshProxyConfigs', JSON.stringify(proxyConfigs));
            localStorage.setItem('sshActiveProxy', activeProxyId || '');
            renderProxyList();
        }

        addProxyBtn.onclick = () => {
            proxyEditId.value = '';
            proxyNameInput.value = '';
            proxyType.value = 'none';
            proxyHost.value = '';
            proxyPort.value = '';
            proxyUser.value = '';
            proxyPass.value = '';
            proxyVlessUuid.value = '';
            proxyVlessSni.value = '';
            toggleVlessSettings();
            proxyEditor.style.display = 'block';
            proxyNameInput.focus();
        };

        cancelProxyBtn.onclick = () => {
            proxyEditor.style.display = 'none';
        };

        saveProxyBtn.onclick = () => {
            const name = proxyNameInput.value.trim();
            if (!name) {
                sshSettingsStatus.textContent = '❌ 请输入代理名称';
                return;
            }

            const proxy = {
                id: proxyEditId.value || Date.now().toString(),
                name,
                type: proxyType.value,
                host: proxyHost.value.trim(),
                port: proxyPort.value.trim(),
                user: proxyUser.value.trim(),
                password: proxyPass.value.trim(),
                vlessUuid: proxyVlessUuid.value.trim(),
                vlessSni: proxyVlessSni.value.trim()
            };

            const idx = proxyConfigs.findIndex(p => p.id === proxy.id);
            if (idx >= 0) {
                proxyConfigs[idx] = proxy;
            } else {
                proxyConfigs.push(proxy);
            }

            localStorage.setItem('sshProxyConfigs', JSON.stringify(proxyConfigs));

            proxyEditor.style.display = 'none';
            renderProxyList();
            sshSettingsStatus.textContent = '✅ 代理已保存';
            setTimeout(() => { sshSettingsStatus.textContent = ''; }, 1500);
        };

        sshSettingsBtn.onclick = () => {
            loadSshSettings();
            sshSettingsModal.classList.add('show');
        };

        closeSshSettings.onclick = () => {
            sshSettingsModal.classList.remove('show');
        };

        

        terminalBgColor.addEventListener('input', (e) => {
            terminalBgColorText.value = e.target.value;
        });

        terminalBgColorText.addEventListener('input', (e) => {
            const val = e.target.value;
            if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                terminalBgColor.value = val;
            }
        });

        proxyType.addEventListener('change', toggleVlessSettings);

        saveSshSettingsBtn.onclick = () => {
            const color = terminalBgColor.value;
            document.getElementById('terminalContainer').style.background = color;
            document.getElementById('terminalInput').style.background = color;
            localStorage.setItem('sshTerminalBg', color);

            localStorage.setItem('sshActiveProxy', activeProxyId || '');

            sshSettingsStatus.textContent = '✅ 设置已保存';
            setTimeout(() => {
                sshSettingsStatus.textContent = '';
                sshSettingsModal.classList.remove('show');
            }, 1500);
        };

        loadSshSettings();
    }

    init();
});
