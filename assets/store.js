/* ============================================================
 * 轻账本 · 数据层 store.js
 * 职责：Supabase 连接 / 认证 / 月度初始化 / CRUD / 离线写队列
 * 依赖：vendor/supabase.min.js（window.supabase）、assets/config.js（window.QBZ_CONFIG）
 * 对上层暴露 window.QBZ.store
 * ============================================================ */
window.QBZ = window.QBZ || {};

QBZ.store = (function () {
  'use strict';

  var cfg = window.QBZ_CONFIG;
  var sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'qbz-auth-token',
      flowType: 'pkce'
    }
  });

  /* ---------- 默认大类（首次使用播种；新月份复制上月配置） ---------- */
  var DEFAULT_CATEGORIES = [
    { name: '食物',     icon: 'food',   quota: 1500, is_daily: true,  is_float: false },
    { name: '话费',     icon: 'phone',  quota: 100,  is_daily: false, is_float: false },
    { name: '交通',     icon: 'transit',quota: 300,  is_daily: true,  is_float: false },
    { name: '日用品',   icon: 'basket', quota: 400,  is_daily: false, is_float: false },
    { name: '娱乐',     icon: 'game',   quota: 300,  is_daily: false, is_float: false },
    { name: '浮动资金', icon: 'float',  quota: 500,  is_daily: false, is_float: true  }
  ];

  /* ---------- 内存状态 ---------- */
  var state = {
    user: null,
    month: null,        // 'YYYY-MM'
    monthRow: null,     // months 表行
    categories: [],     // 含已软删除（带 deleted_at）
    transactions: [],   // 当前月全部明细
    ready: false
  };

  var QUEUE_KEY = 'qbz-write-queue';
  var syncListeners = [];

  function emitSync() {
    for (var i = 0; i < syncListeners.length; i++) syncListeners[i](pendingCount());
  }
  function onSync(cb) { syncListeners.push(cb); }

  /* ---------- 工具 ---------- */
  function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
  function currentMonth() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }
  function daysInMonth(monthStr) {
    var p = monthStr.split('-');
    return new Date(Number(p[0]), Number(p[1]), 0).getDate();
  }
  function dailyQuota(cat, monthStr) {
    return round2(Number(cat.quota) / daysInMonth(monthStr));
  }
  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
    catch (e) { return []; }
  }
  function writeQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
  function pendingCount() { return readQueue().length; }

  /* ---------- 离线写队列 ---------- */
  function enqueue(op) {
    var q = readQueue();
    q.push(op);
    writeQueue(q);
    emitSync();
  }

  function applyOp(op) {
    var t = sb.from(op.table);
    if (op.kind === 'insert') return t.insert(op.payload);
    if (op.kind === 'update') return t.update(op.payload).eq('id', op.id);
    if (op.kind === 'delete') return t.delete().eq('id', op.id);
    return Promise.reject(new Error('unknown op'));
  }

  var flushing = false;
  async function flushQueue() {
    if (flushing || !state.user || !navigator.onLine) return;
    flushing = true;
    try {
      var q = readQueue();
      while (q.length) {
        var op = q[0];
        var r = await applyOp(op);
        if (r.error) throw r.error;      // 整体停住，下次再试
        q.shift();
        writeQueue(q);
        emitSync();
      }
    } catch (e) { /* 保持队列，等待下次重试 */ }
    flushing = false;
  }
  window.addEventListener('online', flushQueue);
  setInterval(flushQueue, 30000);

  /* 写操作统一入口：在线直接写，失败或离线进队列（fire-and-forget） */
  async function write(table, kind, payload, id) {
    if (!state.user) return { error: new Error('未登录') };
    var op = { table: table, kind: kind, payload: payload, id: id, ts: Date.now() };
    if (!navigator.onLine) { enqueue(op); return { queued: true }; }
    try {
      var r = await applyOp(op);
      if (r.error) { enqueue(op); return { queued: true, error: r.error }; }
      return { data: r.data };
    } catch (e) { enqueue(op); return { queued: true, error: e }; }
  }

  /* ---------- 认证 ---------- */
  async function init() {
    var r = await sb.auth.getSession();
    state.user = r.data && r.data.session ? r.data.session.user : null;
    sb.auth.onAuthStateChange(function (_evt, session) {
      state.user = session ? session.user : null;
      state.ready = false;   // 重新加载
      for (var i = 0; i < authListeners.length; i++) authListeners[i](state.user);
    });
    return state.user;
  }
  var authListeners = [];
  /* 注册后立即以当前状态回调一次（可能是 null=未登录），之后随认证事件触发 */
  function onAuth(cb) { authListeners.push(cb); cb(state.user); }

  async function signUp(email, password) {
    var r = await sb.auth.signUp({ email: email, password: password });
    if (r.error) return { error: r.error.message };
    return { user: r.data.user, session: r.data.session };
  }
  async function signIn(email, password) {
    var r = await sb.auth.signInWithPassword({ email: email, password: password });
    if (r.error) return { error: r.error.message };
    state.user = r.data.user;
    return { user: r.data.user };
  }
  async function signOut() {
    await sb.auth.signOut();
    state.user = null; state.ready = false;
    state.monthRow = null; state.categories = []; state.transactions = [];
  }

  /* ---------- 月份装载（带并发归并：认证事件可能连续触发多次） ---------- */
  var monthInflight = null;
  async function loadMonth(monthStr) {
    if (!state.user) throw new Error('未登录');
    monthStr = monthStr || currentMonth();
    if (monthInflight && monthInflight.month === monthStr) return monthInflight.promise;
    var p = doLoadMonth(monthStr);
    monthInflight = { month: monthStr, promise: p };
    try { await p; } finally { if (monthInflight && monthInflight.promise === p) monthInflight = null; }
    return state;
  }

  async function doLoadMonth(monthStr) {
    state.month = monthStr;

    var m = await sb.from('months').select('*')
      .eq('user_id', state.user.id).eq('month', monthStr).maybeSingle();
    if (m.error) throw m.error;

    if (!m.data) {
      // 新月份：复制上月大类配置；没有上月则用默认 6 类
      var prev = await sb.from('months').select('*')
        .eq('user_id', state.user.id).lt('month', monthStr)
        .order('month', { ascending: false }).limit(1).maybeSingle();
      var seed = [];
      if (prev.data) {
        var pc = await sb.from('categories').select('*')
          .eq('user_id', state.user.id).eq('month_id', prev.data.id)
          .is('deleted_at', null).order('sort');
        seed = (pc.data || []).map(function (c) {
          return {
            name: c.name, icon: c.icon, quota: c.quota,
            is_daily: c.is_daily, is_float: c.is_float,
            is_rollover: c.is_rollover, sort: c.sort
          };
        });
      }
      if (!seed.length) {
        seed = DEFAULT_CATEGORIES.map(function (c, i) {
          return { name: c.name, icon: c.icon, quota: c.quota, is_daily: c.is_daily, is_float: c.is_float, is_rollover: false, sort: i };
        });
      }
      var ins = await sb.from('months').insert({
        user_id: state.user.id, month: monthStr, income: 0
      }).select().single();
      if (ins.error) {
        // 并发创建冲突（另一调用已建月）：直接取回已存在的行，不再播种
        var again = await sb.from('months').select('*')
          .eq('user_id', state.user.id).eq('month', monthStr).maybeSingle();
        if (again.error) throw again.error;
        state.monthRow = again.data;
      } else {
        state.monthRow = ins.data;
        var rows = seed.map(function (c) {
          return {
            user_id: state.user.id, month_id: ins.data.id,
            name: c.name, icon: c.icon, quota: c.quota,
            is_daily: c.is_daily, is_float: c.is_float,
            is_rollover: c.is_rollover, sort: c.sort
          };
        });
        var ci = await sb.from('categories').insert(rows).select();
        if (ci.error) throw ci.error;
      }
    } else {
      state.monthRow = m.data;
    }

    await reload();
    state.ready = true;
    await flushQueue();
  }

  async function reload() {
    var uid = state.user.id, mid = state.monthRow.id;
    var c = await sb.from('categories').select('*')
      .eq('user_id', uid).eq('month_id', mid).order('sort');
    if (c.error) throw c.error;
    state.categories = c.data || [];
    var t = await sb.from('transactions').select('*')
      .eq('user_id', uid).eq('month_id', mid).order('spent_at', { ascending: false });
    if (t.error) throw t.error;
    state.transactions = t.data || [];
  }

  function liveCategories() { return state.categories.filter(function (c) { return !c.deleted_at; }); }

  /* ---------- 业务写操作 ---------- */
  async function setIncome(amount) {
    state.monthRow.income = round2(amount);
    var r = await write('months', 'update', { income: state.monthRow.income }, state.monthRow.id);
    return r;
  }

  async function addCategory(data) {
    var row = {
      user_id: state.user.id, month_id: state.monthRow.id,
      name: data.name, icon: data.icon || 'tag',
      quota: round2(data.quota || 0),
      is_daily: !!data.is_daily, is_float: !!data.is_float,
      is_rollover: !!data.is_rollover,
      sort: liveCategories().length
    };
    var r = await write('categories', 'insert', row);
    await reload();
    return r;
  }

  async function updateCategory(id, patch) {
    var clean = {};
    ['name', 'icon', 'quota', 'is_daily', 'is_float', 'is_rollover', 'sort'].forEach(function (k) {
      if (patch[k] !== undefined) clean[k] = patch[k];
    });
    if (clean.quota !== undefined) clean.quota = round2(clean.quota);
    var r = await write('categories', 'update', clean, id);
    await reload();
    return r;
  }

  async function removeCategory(id) {
    // 软删除：历史明细保留，导出时归入「已删除大类」
    var r = await write('categories', 'update', { deleted_at: new Date().toISOString() }, id);
    await reload();
    return r;
  }

  async function addTx(data) {
    var row = {
      user_id: state.user.id,
      category_id: data.category_id,
      month_id: state.monthRow.id,
      amount: round2(data.amount),
      note: data.note || '',
      type: data.type || 'normal',
      spent_at: data.spent_at || new Date().toISOString()
    };
    var r = await write('transactions', 'insert', row);
    await reload();
    return r;
  }

  async function removeTx(id) {
    var r = await write('transactions', 'delete', null, id);
    await reload();
    return r;
  }

  /* ---------- 统计计算（纯函数，供 UI 调用） ---------- */
  function monthStats() {
    var cats = liveCategories();
    var tx = state.transactions;
    var spentByCat = {};
    tx.forEach(function (t) {
      spentByCat[t.category_id] = round2((spentByCat[t.category_id] || 0) + Number(t.amount));
    });
    var totalSpent = round2(tx.reduce(function (s, t) { return s + Number(t.amount); }, 0));
    var income = Number(state.monthRow ? state.monthRow.income : 0);

    var today = new Date().toISOString().slice(0, 10);
    var todaySpentByCat = {};
    tx.forEach(function (t) {
      if (t.spent_at.slice(0, 10) === today) {
        todaySpentByCat[t.category_id] = round2((todaySpentByCat[t.category_id] || 0) + Number(t.amount));
      }
    });

    var todayBalance = 0;
    cats.forEach(function (c) {
      if (c.is_daily && !c.is_float) {
        todayBalance = round2(todayBalance + dailyQuota(c, state.month) - (todaySpentByCat[c.id] || 0));
      }
    });

    // 近 7 日支出
    var last7 = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(); d.setDate(d.getDate() - i);
      var key = d.toISOString().slice(0, 10);
      var sum = 0;
      tx.forEach(function (t) { if (t.spent_at.slice(0, 10) === key) sum += Number(t.amount); });
      last7.push({ date: key, total: round2(sum) });
    }

    return {
      income: income,
      totalSpent: totalSpent,
      remaining: round2(income - totalSpent),
      todayBalance: todayBalance,
      spentByCat: spentByCat,
      todaySpentByCat: todaySpentByCat,
      last7: last7
    };
  }

  /* ---------- 导出 / 清空 ---------- */
  /* 供明细页切换非当前月份 */
  async function listMonths() {
    var r = await sb.from('months').select('month').eq('user_id', state.user.id).order('month', { ascending: false });
    return (r.data || []).map(function (x) { return x.month; });
  }

  async function exportMonthTx(monthStr) {
    var m = await sb.from('months').select('*')
      .eq('user_id', state.user.id).eq('month', monthStr).maybeSingle();
    if (m.error || !m.data) return [];
    var t = await sb.from('transactions').select('*')
      .eq('user_id', state.user.id).eq('month_id', m.data.id)
      .order('spent_at', { ascending: false });
    return t.data || [];
  }

  async function exportMonthCats(monthStr) {
    var m = await sb.from('months').select('*')
      .eq('user_id', state.user.id).eq('month', monthStr).maybeSingle();
    if (m.error || !m.data) return [];
    var c = await sb.from('categories').select('*')
      .eq('user_id', state.user.id).eq('month_id', m.data.id).order('sort');
    return c.data || [];
  }

  async function exportAll() {
    var uid = state.user.id;
    var months = await sb.from('months').select('*').eq('user_id', uid).order('month');
    var categories = await sb.from('categories').select('*').eq('user_id', uid);
    var transactions = await sb.from('transactions').select('*').eq('user_id', uid).order('spent_at');
    return {
      months: months.data || [],
      categories: categories.data || [],
      transactions: transactions.data || []
    };
  }

  async function clearAll() {
    var uid = state.user.id;
    await sb.from('transactions').delete().eq('user_id', uid);
    await sb.from('daily_rollup').delete().eq('user_id', uid);
    await sb.from('categories').delete().eq('user_id', uid);
    await sb.from('months').delete().eq('user_id', uid);
    state.monthRow = null; state.categories = []; state.transactions = [];
    localStorage.removeItem(QUEUE_KEY);
    emitSync();
  }

  return {
    init: init, onAuth: onAuth, signUp: signUp, signIn: signIn, signOut: signOut,
    loadMonth: loadMonth, reload: reload,
    state: state, liveCategories: liveCategories,
    setIncome: setIncome, addCategory: addCategory, updateCategory: updateCategory, removeCategory: removeCategory,
    addTx: addTx, removeTx: removeTx,
    monthStats: monthStats, exportAll: exportAll, clearAll: clearAll,
    listMonths: listMonths, exportMonthTx: exportMonthTx, exportMonthCats: exportMonthCats,
    dailyQuota: dailyQuota, daysInMonth: daysInMonth, currentMonth: currentMonth,
    onSync: onSync, pendingCount: pendingCount, flushQueue: flushQueue,
    round2: round2
  };
})();
