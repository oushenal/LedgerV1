/* ============================================================
 * 轻账本 · 界面层 app.js
 * 依赖：store.js（window.QBZ.store）、vendor（window.supabase / window.XLSX）
 * 路由：#/overview #/today #/budget #/records #/me
 * ============================================================ */
window.QBZ = window.QBZ || {};

QBZ.app = (function () {
  'use strict';
  var store = QBZ.store;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 大类配色（图标描边 + 底衬，对应设计稿） ---------- */
  var CAT_COLORS = {
    food:    { stroke: '#54805E', bg: '#E4EDE4' },
    phone:   { stroke: '#5C7DA6', bg: '#E5EBF3' },
    transit: { stroke: '#BF6659', bg: '#F6E5E2' },
    basket:  { stroke: '#96918A', bg: '#ECEAE6' },
    game:    { stroke: '#4F948F', bg: '#E2EFEE' },
    float:   { stroke: '#C78C4A', bg: '#F6EBDC' },
    tag:     { stroke: '#8A857C', bg: '#ECEAE6' }
  };

  /* ---------- 内置线性图标库 ---------- */
  function ic(path, size) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:' + (size || 19) + 'px;height:' + (size || 19) + 'px">' + path + '</svg>';
  }
  var ICONS = {
    food:    '<path d="M12 8c-2.5-2.2-6-1.6-7.6 1-1.7 2.8-.8 7 1.8 9.2 1.7 1.4 3.4 1.6 5.8 1.6s4.1-.2 5.8-1.6c2.6-2.2 3.5-6.4 1.8-9.2-1.6-2.6-5.1-3.2-7.6-1z"/><path d="M12 8c0-2 .8-3.4 2.3-4.3"/>',
    phone:   '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    transit: '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 10h16M8 21l1-4M16 21l-1-4"/><circle cx="8.5" cy="13.5" r=".6"/><circle cx="15.5" cy="13.5" r=".6"/>',
    basket:  '<path d="M5 9h14l-1.3 9.2a2.4 2.4 0 0 1-2.4 2H8.7a2.4 2.4 0 0 1-2.4-2L5 9z"/><path d="M8.5 9L12 3.5 15.5 9M9.5 13v4M14.5 13v4"/>',
    game:    '<rect x="2.5" y="8" width="19" height="9.5" rx="4.75"/><path d="M7.5 11.5v4M5.5 13.5h4"/><circle cx="16.2" cy="12.2" r=".7"/><circle cx="18.6" cy="14.2" r=".7"/>',
    float:   '<rect x="2.5" y="6" width="19" height="13" rx="3"/><path d="M2.5 10h19"/><path d="M15.5 14.2h2.6"/>',
    tag:     '<path d="M3.5 12.5v-8a1.5 1.5 0 0 1 1.5-1.5h8L21 11a1.6 1.6 0 0 1 0 2.3l-7.2 7.2a1.6 1.6 0 0 1-2.3 0L3.5 12.5z"/><circle cx="8.5" cy="8.5" r="1.3"/>',
    overview:'<rect x="3" y="3" width="8.2" height="8.2" rx="2"/><rect x="12.8" y="3" width="8.2" height="8.2" rx="2"/><rect x="3" y="12.8" width="8.2" height="8.2" rx="2"/><rect x="12.8" y="12.8" width="8.2" height="8.2" rx="2"/>',
    today:   '<rect x="3.5" y="4.5" width="17" height="16" rx="3"/><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4M9 14.5l2.2 2.2 4-4.2"/>',
    budget:  '<path d="M4 7h16M4 12h16M4 17h16"/><circle cx="9" cy="7" r="2.1" fill="#fff"/><circle cx="15" cy="12" r="2.1" fill="#fff"/><circle cx="7" cy="17" r="2.1" fill="#fff"/>',
    records: '<path d="M8.5 6h12M8.5 12h12M8.5 18h12"/><path d="M3.5 6h1.4M3.5 12h1.4M3.5 18h1.4"/>',
    me:      '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.6-3.4 4.4-5 7.5-5s5.9 1.6 7.5 5"/>',
    plus:    '<path d="M12 5v14M5 12h14"/>',
    check:   '<path d="M4.5 12.5l5 5L19.5 7"/>',
    x:       '<path d="M6 6l12 12M18 6L6 18"/>',
    trash:   '<path d="M4.5 6.5h15M9.5 6V4.2A1.2 1.2 0 0 1 10.7 3h2.6a1.2 1.2 0 0 1 1.2 1.2V6M6.5 6.5l1 13a1.6 1.6 0 0 0 1.6 1.5h5.8a1.6 1.6 0 0 0 1.6-1.5l1-13"/>',
    download:'<path d="M12 3.5V15M7.5 10.5L12 15l4.5-4.5M4.5 19.5h15"/>',
    logout:  '<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14M10 12h10.5M17.5 8.5L21 12l-3.5 3.5"/>',
    sun:     '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3L19 19M19 5l-1.7 1.7M6.7 17.3L5 19"/>'
  };
  function catIcon(name, size) { return ic(ICONS[name] || ICONS.tag, size); }

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n, withSymbol) {
    var v = Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (withSymbol === false ? '' : '¥') + v;
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function todayStr() { return new Date().toISOString().slice(0, 10); }

  /* 通用确认弹窗：opts = {title, text, danger, requireText} → Promise<bool> */
  function confirmBox(opts) {
    return new Promise(function (resolve) {
      var mask = document.createElement('div');
      mask.className = 'modal-mask';
      mask.innerHTML =
        '<div class="modal"><h3>' + esc(opts.title) + '</h3><p>' + esc(opts.text || '') + '</p>' +
        (opts.requireText ? '<input class="input" id="cfm-input" placeholder="输入「' + opts.requireText + '」以确认" style="margin-bottom:14px">' : '') +
        '<div class="actions"><button class="btn secondary" id="cfm-no">取消</button>' +
        '<button class="btn ' + (opts.danger ? 'danger' : '') + '" id="cfm-yes" disabled>确认</button></div></div>';
      document.body.appendChild(mask);
      var yes = $('#cfm-yes', mask), no = $('#cfm-no', mask), inp = $('#cfm-input', mask);
      function done(v) { mask.remove(); resolve(v); }
      no.onclick = function () { done(false); };
      mask.onclick = function (e) { if (e.target === mask) done(false); };
      if (inp) {
        yes.disabled = true;
        inp.oninput = function () { yes.disabled = inp.value.trim() !== opts.requireText; };
      } else { yes.disabled = false; }
      yes.onclick = function () { done(true); };
    });
  }

  /* ---------- 主题 / 字号（本地偏好，立即生效） ---------- */
  function applyPrefs() {
    document.body.dataset.theme = localStorage.getItem('qbz-theme') || 'green';
    document.body.dataset.font = localStorage.getItem('qbz-font') || 'normal';
  }

  /* ============================================================
   * 视图：登录
   * ============================================================ */
  function renderLogin() {
    var mode = 'in';
    function draw() {
      $('#app').innerHTML =
        '<div class="login-wrap"><div class="card login-card">' +
        '<div class="brand" style="padding:0 0 16px"><div class="brand-logo">轻</div>' +
        '<div><div class="brand-name">轻账本</div><div class="brand-sub">先预算 · 后记账</div></div></div>' +
        '<div class="login-tabs">' +
        '<button data-m="in" class="' + (mode === 'in' ? 'on' : '') + '">登录</button>' +
        '<button data-m="up" class="' + (mode === 'up' ? 'on' : '') + '">注册</button></div>' +
        '<label class="field"><span>邮箱</span><input class="input" id="lg-email" type="email" autocomplete="email" placeholder="you@example.com"></label>' +
        '<label class="field"><span>密码（至少 6 位）</span><input class="input" id="lg-pass" type="password" autocomplete="current-password"></label>' +
        '<button class="btn" id="lg-go" style="width:100%">' + (mode === 'in' ? '登录' : '注册并登录') + '</button>' +
        '<div class="form-msg" id="lg-msg"></div>' +
        '<div style="font-size:12px;color:var(--sub);margin-top:10px">数据保存在你自己的 Supabase 账号中，多设备登录自动同步。</div>' +
        '</div></div>';
      $$('.login-tabs button').forEach(function (b) {
        b.onclick = function () { mode = b.dataset.m; draw(); };
      });
      $('#lg-go').onclick = submit;
      $('#lg-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    }
    async function submit() {
      var email = $('#lg-email').value.trim(), pass = $('#lg-pass').value;
      var msg = $('#lg-msg');
      if (!email || !pass) { msg.className = 'form-msg err'; msg.textContent = '请输入邮箱和密码'; return; }
      msg.className = 'form-msg'; msg.textContent = '请稍候…';
      var r = mode === 'in' ? await store.signIn(email, pass) : await store.signUp(email, pass);
      if (r.error) { msg.className = 'form-msg err'; msg.textContent = r.error; return; }
      if (mode === 'up' && !r.session) {
        msg.className = 'form-msg ok';
        msg.textContent = '注册成功！若无法直接登录，请先到邮箱点击确认链接（或在 Supabase 控制台关闭邮箱确认）。';
        return;
      }
      msg.className = 'form-msg ok'; msg.textContent = '登录成功，正在载入…';
    }
    draw();
  }

  /* ============================================================
   * 视图骨架
   * ============================================================ */
  var ROUTES = [
    { id: 'overview', name: '总览', icon: 'overview' },
    { id: 'today',    name: '每日记账', icon: 'today' },
    { id: 'budget',   name: '预算设置', icon: 'budget', desktopOnly: true },
    { id: 'records',  name: '明细与导出', icon: 'records' },
    { id: 'me',       name: '我的', icon: 'me' }
  ];
  function currentRoute() {
    var h = location.hash.replace(/^#\//, '') || 'overview';
    return ROUTES.some(function (r) { return r.id === h; }) ? h : 'overview';
  }

  function renderShell() {
    var route = currentRoute();
    var nav = ROUTES.filter(function (r) { return !r.desktopOnly; });
    $('#app').innerHTML =
      '<aside class="sidebar">' +
      '<div class="brand"><div class="brand-logo">轻</div>' +
      '<div><div class="brand-name">轻账本</div><div class="brand-sub">先预算 · 后记账</div></div></div>' +
      ROUTES.map(function (r) {
        return '<a class="nav-item ' + (r.id === route ? 'active' : '') + '" href="#/' + r.id + '">' +
          ic(ICONS[r.icon]) + '<span>' + r.name + '</span></a>';
      }).join('') +
      '<div class="sidebar-foot">轻账本 v1.0<br>数据存于个人 Supabase</div>' +
      '</aside>' +
      '<main class="main">' +
      '<div class="topbar">' +
      '<div class="page-title" id="page-title"></div>' +
      '<input type="month" class="month-picker" id="month-picker" value="' + store.state.month + '">' +
      '<div class="sync-badge" id="sync-badge"><span class="sync-dot"></span><span id="sync-text">已同步</span></div>' +
      '</div>' +
      '<div id="view"></div>' +
      '</main>' +
      '<nav class="tabbar">' +
      nav.map(function (r) {
        return '<a href="#/' + r.id + '" class="' + (r.id === route ? 'active' : '') + '">' +
          ic(ICONS[r.icon], 21) + '<span>' + r.name + '</span></a>';
      }).join('') +
      '</nav>';

    $('#month-picker').onchange = async function () {
      if (!this.value) return;
      try {
        await store.loadMonth(this.value);
        render();
      } catch (e) { toast('载入月份失败：' + e.message); }
    };
    updateSyncBadge();
  }

  function updateSyncBadge() {
    var n = store.pendingCount();
    var b = $('#sync-badge'); if (!b) return;
    b.classList.toggle('pending', n > 0);
    $('#sync-text').textContent = n > 0 ? ('待同步 ' + n) : '已同步';
  }

  function setTitle(t) { var el = $('#page-title'); if (el) el.textContent = t; }

  function catBadge(c, size) {
    var col = CAT_COLORS[c.icon] || CAT_COLORS.tag;
    return '<span class="cat-icon" style="width:' + size + 'px;height:' + size + 'px;flex-basis:' + size + 'px;background:' + col.bg + ';color:' + col.stroke + '">' + catIcon(c.icon, size * 0.52) + '</span>';
  }

  /* ============================================================
   * 总览
   * ============================================================ */
  function viewOverview() {
    setTitle('总览');
    var st = store.monthStats();
    var cats = store.liveCategories();
    var today = todayStr();
    var todaySpent = store.state.transactions
      .filter(function (t) { return t.spent_at.slice(0, 10) === today; })
      .reduce(function (s, t) { return s + Number(t.amount); }, 0);
    var max7 = Math.max.apply(null, st.last7.map(function (d) { return d.total; }).concat([1]));

    var html = '<div class="grid grid-4">' +
      metric('本月收入', money(st.income), '预算设置中可修改', '#/budget') +
      metric('本月已支出', money(st.totalSpent), cats.length + ' 个大类') +
      metric('剩余预算', money(st.remaining), st.remaining < 0 ? '已超支，注意控制' : '占收入 ' + (st.income ? Math.round(st.remaining / st.income * 100) : 0) + '%') +
      metric('今日可用（均摊结余）', money(st.todayBalance), '今日已花 ' + money(todaySpent)) +
      '</div>';

    html += '<div class="card"><div class="card-title">大类用量<a class="more" href="#/budget">管理预算 →</a></div><div class="grid grid-2">';
    cats.forEach(function (c) {
      var spent = st.spentByCat[c.id] || 0;
      var pct = c.quota > 0 ? Math.min(100, Math.round(spent / c.quota * 100)) : (spent > 0 ? 100 : 0);
      var over = c.quota > 0 && spent > c.quota;
      var dailyTxt = (c.is_daily && !c.is_float) ? ' · 日额度 ' + money(store.dailyQuota(c, store.state.month)) : '';
      html += '<div class="cat-card card" style="margin:0;box-shadow:none;border:1px solid var(--line)">' +
        catBadge(c, 42) +
        '<div class="cat-main"><div class="cat-name">' + esc(c.name) +
        '<span class="cat-daily">' + (c.is_float ? '浮动' : (c.is_daily ? '均摊' : '月度')) + dailyTxt + '</span></div>' +
        '<div class="cat-nums"><b>' + money(spent) + '</b> / ' + money(c.quota) + '</div>' +
        '<div class="progress ' + (over ? 'over' : '') + '"><i style="width:' + pct + '%"></i></div>' +
        '</div></div>';
    });
    html += '</div></div>';

    html += '<div class="grid grid-2">' +
      '<div class="card"><div class="card-title">今日小结</div>' +
      '<div style="display:flex;gap:26px">' +
      '<div><div style="font-size:12.5px;color:var(--sub)">今日支出</div><div class="num" style="font-size:22px;font-weight:700">' + money(todaySpent) + '</div></div>' +
      '<div><div style="font-size:12.5px;color:var(--sub)">今日笔数</div><div class="num" style="font-size:22px;font-weight:700">' +
      store.state.transactions.filter(function (t) { return t.spent_at.slice(0, 10) === today; }).length + ' 笔</div></div>' +
      '<div><div style="font-size:12.5px;color:var(--sub)">均摊结余</div><div class="num" style="font-size:22px;font-weight:700;color:' + (st.todayBalance < 0 ? 'var(--danger)' : 'inherit') + '">' + money(st.todayBalance) + '</div></div>' +
      '</div></div>' +
      '<div class="card"><div class="card-title">近 7 日支出</div><div class="bars">' +
      st.last7.map(function (d) {
        var h = Math.max(3, Math.round(d.total / max7 * 100));
        return '<div class="bar-col"><div class="bar" style="height:' + h + '%"><span class="v">' + (d.total > 0 ? money(d.total) : '') + '</span></div><span class="bar-x">' + d.date.slice(5) + '</span></div>';
      }).join('') +
      '</div></div></div>';
    $('#view').innerHTML = html;
  }
  function metric(label, value, foot, link) {
    return '<div class="card metric">' +
      '<div class="label">' + label + '</div>' +
      '<div class="value num">' + value + '</div>' +
      '<div class="foot">' + (link ? '<a href="' + link + '" style="color:inherit">' + esc(foot) + '</a>' : esc(foot || '')) + '</div></div>';
  }

  /* ============================================================
   * 每日记账
   * ============================================================ */
  function viewToday() {
    setTitle('每日记账');
    var st = store.monthStats();
    var cats = store.liveCategories();
    var dailyCats = cats.filter(function (c) { return c.is_daily && !c.is_float; });
    var floatCats = cats.filter(function (c) { return c.is_float; });
    var today = todayStr();

    var quotaSum = dailyCats.reduce(function (s, c) { return s + store.dailyQuota(c, store.state.month); }, 0);
    var spentSum = dailyCats.reduce(function (s, c) { return s + (st.todaySpentByCat[c.id] || 0); }, 0);

    var html = '<div class="grid grid-4">' +
      metric('今日额度合计', money(store.round2(quotaSum)), dailyCats.length + ' 个均摊大类') +
      metric('今日已登记', money(store.round2(spentSum)), ' ') +
      metric('今日结余', money(store.round2(quotaSum - spentSum)), '可为负，负值=透支', null) +
      metric('本月剩余预算', money(st.remaining), ' ') +
      '</div>';

    // 均摊大类逐行登记
    html += '<div class="card"><div class="card-title">今日登记<span class="more">' + today + '</span></div>';
    if (!dailyCats.length) html += '<div class="empty">本月没有开启「每日均摊」的大类，请到预算设置开启。</div>';
    dailyCats.forEach(function (c) {
      var q = store.dailyQuota(c, store.state.month);
      var spent = st.todaySpentByCat[c.id] || 0;
      var bal = store.round2(q - spent);
      html += '<div class="row-line" data-cat="' + c.id + '">' +
        catBadge(c, 38) +
        '<div class="grow"><div style="font-weight:600">' + esc(c.name) + '</div>' +
        '<div class="desc">额度 ' + money(q) + ' · 已登记 ' + money(spent) + '</div></div>' +
        '<div class="num" style="font-weight:700;color:' + (bal < 0 ? 'var(--danger)' : 'inherit') + '">' + money(bal) + '</div>' +
        '<button class="icon-btn" data-add="' + c.id + '" title="登记支出">' + ic(ICONS.plus, 17) + '</button>' +
        '<div class="add-inline" id="form-' + c.id + '" style="display:none;width:100%">' +
        '<input class="input num" type="number" min="0" step="0.01" placeholder="金额" id="amt-' + c.id + '">' +
        '<input class="input note" type="text" placeholder="备注（可选）" id="note-' + c.id + '">' +
        '<button class="btn small" data-save="' + c.id + '">登记</button>' +
        '</div></div>';
    });
    html += '</div>';

    // 浮动资金
    html += '<div class="card"><div class="card-title">浮动资金<span class="more">自定义支出从这扣</span></div>';
    if (!floatCats.length) html += '<div class="empty">本月没有「浮动资金」大类，可到预算设置添加。</div>';
    floatCats.forEach(function (c) {
      var spent = st.spentByCat[c.id] || 0;
      var bal = store.round2(c.quota - spent);
      html += '<div class="row-line" data-cat="' + c.id + '">' +
        catBadge(c, 38) +
        '<div class="grow"><div style="font-weight:600">' + esc(c.name) + '</div>' +
        '<div class="desc">余额 ' + money(bal) + ' / ' + money(c.quota) + '</div></div>' +
        '<button class="icon-btn" data-add="' + c.id + '" title="自定义支出">' + ic(ICONS.plus, 17) + '</button>' +
        '<div class="add-inline" id="form-' + c.id + '" style="display:none;width:100%">' +
        '<input class="input num" type="number" min="0" step="0.01" placeholder="金额" id="amt-' + c.id + '">' +
        '<input class="input note" type="text" placeholder="自定义备注（如：奶茶）" id="note-' + c.id + '">' +
        '<button class="btn small" data-save="' + c.id + '">登记</button>' +
        '</div></div>';
    });
    html += '</div>';

    // 今日流水
    var todayTx = store.state.transactions.filter(function (t) { return t.spent_at.slice(0, 10) === today; });
    html += '<div class="card"><div class="card-title">今日记录<span class="more">' + todayTx.length + ' 笔</span></div>';
    if (!todayTx.length) html += '<div class="empty">今天还没登记支出。</div>';
    todayTx.forEach(function (t) { html += txLine(t); });
    html += '</div>';

    $('#view').innerHTML = html;
    bindToday();
  }

  function txLine(t) {
    var c = store.state.categories.find(function (x) { return x.id === t.category_id; });
    var name = c ? c.name : '已删除大类';
    var icon = c ? c.icon : 'tag';
    return '<div class="row-line">' +
      '<span class="cat-icon" style="width:32px;height:32px;flex-basis:32px;background:' + (CAT_COLORS[icon] || CAT_COLORS.tag).bg + ';color:' + (CAT_COLORS[icon] || CAT_COLORS.tag).stroke + '">' + catIcon(icon, 16) + '</span>' +
      '<div class="grow"><div style="font-size:14px">' + esc(name) + (t.note ? ' <span class="desc">· ' + esc(t.note) + '</span>' : '') + '</div>' +
      '<div class="desc">' + t.spent_at.slice(11, 16) + (t.type === 'custom' ? ' · 自定义支出' : '') + '</div></div>' +
      '<span class="amt neg num">-' + money(t.amount, false) + '</span>' +
      '<button class="icon-btn plain" data-del-tx="' + t.id + '" title="删除">' + ic(ICONS.trash, 15) + '</button></div>';
  }

  function bindToday() {
    $$('#view [data-add]').forEach(function (b) {
      b.onclick = function () {
        var f = $('#form-' + b.dataset.add);
        f.style.display = f.style.display === 'none' ? 'flex' : 'none';
        if (f.style.display === 'flex') $('#amt-' + b.dataset.add).focus();
      };
    });
    $$('#view [data-save]').forEach(function (b) {
      b.onclick = async function () {
        var cid = b.dataset.save;
        var amt = parseFloat($('#amt-' + cid).value);
        var note = $('#note-' + cid).value.trim();
        if (!amt || amt <= 0) { toast('请输入有效金额'); return; }
        var cat = store.liveCategories().find(function (c) { return c.id === cid; });
        await store.addTx({
          category_id: cid, amount: amt, note: note,
          type: (cat && cat.is_float) ? 'custom' : 'normal'
        });
        updateSyncBadge();
        toast('已登记');
        render();
      };
    });
    bindTxDeletes();
  }

  function bindTxDeletes() {
    $$('#view [data-del-tx]').forEach(function (b) {
      b.onclick = async function () {
        var ok = await confirmBox({ title: '删除这笔记录？', text: '删除后不可恢复，确定要删除吗？', danger: true });
        if (!ok) return;
        await store.removeTx(b.dataset.delTx);
        updateSyncBadge();
        toast('已删除');
        render();
      };
    });
  }

  /* ============================================================
   * 预算设置
   * ============================================================ */
  function viewBudget() {
    setTitle('预算设置');
    var cats = store.liveCategories();
    var month = store.state.month;

    var html = '<div class="card"><div class="card-title">本月收入</div>' +
      '<div style="display:flex;gap:10px;max-width:360px">' +
      '<input class="input num" type="number" min="0" step="0.01" id="income" value="' + (store.state.monthRow ? store.state.monthRow.income : 0) + '">' +
      '<button class="btn" id="save-income">保存</button></div>' +
      '<div class="desc" style="font-size:12.5px;color:var(--sub);margin-top:8px">收入随时可改；各大类额度合计建议不超过收入。</div></div>';

    html += '<div class="card"><div class="card-title">支出大类<span class="more">' + month + ' · ' + cats.length + ' 类</span></div>';
    cats.forEach(function (c) {
      html += '<div class="row-line" data-cat-row="' + c.id + '">' +
        catBadge(c, 38) +
        '<div class="grow"><div style="font-weight:600">' + esc(c.name) +
        (c.is_float ? ' <span class="tag custom">浮动</span>' : (c.is_daily ? ' <span class="tag">均摊</span>' : '')) + '</div>' +
        (c.is_daily && !c.is_float ? '<div class="desc">日额度 ≈ ' + money(store.dailyQuota(c, month)) + '（' + store.daysInMonth(month) + ' 天）</div>' : '') +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:12.5px;color:var(--sub)">月额度</span>' +
        '<input class="input num" type="number" min="0" step="1" style="width:96px" data-quota="' + c.id + '" value="' + c.quota + '"></div>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--sub)">均摊' +
        '<span class="switch"><input type="checkbox" data-daily="' + c.id + '" ' + (c.is_daily ? 'checked' : '') + (c.is_float ? ' disabled' : '') + '><i></i></span></label>' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:var(--sub)">结转' +
        '<span class="switch"><input type="checkbox" data-roll="' + c.id + '" ' + (c.is_rollover ? 'checked' : '') + '><i></i></span></label>' +
        '<button class="icon-btn plain" data-del-cat="' + c.id + '" title="删除大类">' + ic(ICONS.trash, 15) + '</button>' +
        '</div>';
    });
    html += '</div>';

    // 新增大类
    html += '<div class="card"><div class="card-title">新增大类</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
      '<input class="input" id="nc-name" placeholder="名称（如：宠物）" style="width:150px">' +
      '<select class="input" id="nc-icon" style="width:130px">' +
      '<option value="food">食物</option><option value="phone">话费</option><option value="transit">交通</option>' +
      '<option value="basket">日用品</option><option value="game">娱乐</option><option value="float">浮动资金</option><option value="tag">其他</option>' +
      '</select>' +
      '<input class="input num" id="nc-quota" type="number" min="0" step="1" placeholder="月额度" style="width:110px">' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--sub)"><input type="checkbox" id="nc-daily"> 每日均摊</label>' +
      '<label style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--sub)"><input type="checkbox" id="nc-float"> 浮动资金</label>' +
      '<button class="btn" id="nc-add">添加</button></div></div>';

    $('#view').innerHTML = html;

    $('#save-income').onclick = async function () {
      var v = parseFloat($('#income').value);
      if (isNaN(v) || v < 0) { toast('请输入有效金额'); return; }
      await store.setIncome(v);
      updateSyncBadge();
      toast('收入已保存');
    };
    $$('#view [data-quota]').forEach(function (inp) {
      inp.onchange = async function () {
        var v = parseFloat(inp.value);
        if (isNaN(v) || v < 0) { render(); return; }
        await store.updateCategory(inp.dataset.quota, { quota: v });
        updateSyncBadge(); toast('额度已更新'); render();
      };
    });
    $$('#view [data-daily]').forEach(function (sw) {
      sw.onchange = async function () {
        await store.updateCategory(sw.dataset.daily, { is_daily: sw.checked });
        updateSyncBadge(); render();
      };
    });
    $$('#view [data-roll]').forEach(function (sw) {
      sw.onchange = async function () {
        await store.updateCategory(sw.dataset.roll, { is_rollover: sw.checked });
        updateSyncBadge(); toast(sw.checked ? '已开启额度结转（将于次日生效）' : '已关闭额度结转');
      };
    });
    $$('#view [data-del-cat]').forEach(function (b) {
      b.onclick = async function () {
        var ok = await confirmBox({
          title: '删除该大类？',
          text: '历史明细会保留，导出时归入「已删除大类」。本月不再显示它。',
          danger: true
        });
        if (!ok) return;
        await store.removeCategory(b.dataset.delCat);
        updateSyncBadge(); toast('已删除'); render();
      };
    });
    $('#nc-add').onclick = async function () {
      var name = $('#nc-name').value.trim();
      var quota = parseFloat($('#nc-quota').value);
      if (!name) { toast('请输入大类名称'); return; }
      if (isNaN(quota) || quota < 0) { toast('请输入有效额度'); return; }
      var isFloat = $('#nc-float').checked;
      await store.addCategory({
        name: name, icon: $('#nc-icon').value, quota: quota,
        is_daily: $('#nc-daily').checked && !isFloat, is_float: isFloat
      });
      updateSyncBadge(); toast('已添加'); render();
    };
  }

  /* ============================================================
   * 明细与导出
   * ============================================================ */
  var recFilter = { month: null, cat: '', type: '' };
  function viewRecords(months) {
    setTitle('明细与导出');
    if (!recFilter.month) recFilter.month = store.state.month;
    var cats = []; // 当前显示月份的大类（含已删除，用于历史明细命名）

    function draw(txList) {
      var isCur = recFilter.month === store.state.month;
      var rows = txList.filter(function (t) {
        if (recFilter.cat && t.category_id !== recFilter.cat) return false;
        if (recFilter.type && t.type !== recFilter.type) return false;
        return true;
      });

      var total = rows.reduce(function (s, t) { return s + Number(t.amount); }, 0);

      // 按大类汇总 TOP3
      var byCat = {};
      rows.forEach(function (t) { byCat[t.category_id] = (byCat[t.category_id] || 0) + Number(t.amount); });
      var top = Object.keys(byCat).map(function (cid) {
        var c = cats.find(function (x) { return x.id === cid; });
        return { name: c ? c.name : '已删除大类', total: byCat[cid] };
      }).sort(function (a, b) { return b.total - a.total; }).slice(0, 3);

      var html = '<div class="card"><div class="card-title">筛选与导出</div>' +
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' +
        '<select class="input" id="rf-month" style="width:130px">' +
        months.map(function (m) { return '<option value="' + m + '"' + (m === recFilter.month ? ' selected' : '') + '>' + m + '</option>'; }).join('') +
        '</select>' +
        '<select class="input" id="rf-cat" style="width:130px"><option value="">全部大类</option>' +
        cats.map(function (c) {
          var nm = c.name + (c.deleted_at ? '（已删）' : '');
          return '<option value="' + c.id + '"' + (recFilter.cat === c.id ? ' selected' : '') + '>' + esc(nm) + '</option>';
        }).join('') + '</select>' +
        '<select class="input" id="rf-type" style="width:120px">' +
        '<option value=""' + (recFilter.type === '' ? ' selected' : '') + '>全部类型</option>' +
        '<option value="normal"' + (recFilter.type === 'normal' ? ' selected' : '') + '>普通支出</option>' +
        '<option value="custom"' + (recFilter.type === 'custom' ? ' selected' : '') + '>自定义支出</option>' +
        '</select>' +
        '<span style="font-size:13px;color:var(--sub);margin-left:auto">筛选结果 ' + rows.length + ' 笔 · 合计 <b class="num">' + money(total) + '</b></span></div>' +
        '<div style="display:flex;gap:10px;margin-top:12px">' +
        '<button class="btn small" id="rf-xlsx">导出 Excel（跟随筛选）</button>' +
        '<button class="btn small secondary" id="rf-xlsx-month">整月导出</button>' +
        '</div></div>';

      html += '<div class="grid grid-2"><div class="card"><div class="card-title">' + recFilter.month + ' 明细</div>';
      if (!rows.length) html += '<div class="empty">该条件下没有记录。</div>';
      else {
        html += '<div class="table-wrap"><table class="tbl"><thead><tr>' +
          '<th>日期</th><th>大类</th><th>备注</th><th class="r">金额</th><th>类型</th><th class="r">当日结余</th><th></th>' +
          '</tr></thead><tbody>';
        // 当日结余（均摊类）：日额度 − 当日该类合计
        var daySum = {};
        txList.forEach(function (t) {
          var k = t.spent_at.slice(0, 10) + '|' + t.category_id;
          daySum[k] = (daySum[k] || 0) + Number(t.amount);
        });
        rows.forEach(function (t) {
          var c = cats.find(function (x) { return x.id === t.category_id; });
          var bal = '';
          if (c && c.is_daily && !c.is_float) {
            var k = t.spent_at.slice(0, 10) + '|' + t.category_id;
            bal = money(store.round2(store.dailyQuota(c, recFilter.month) - daySum[k]));
          }
          html += '<tr><td>' + t.spent_at.slice(0, 10) + '</td>' +
            '<td>' + esc(c ? c.name : '已删除大类') + '</td>' +
            '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis">' + esc(t.note || '—') + '</td>' +
            '<td class="r num neg" style="color:var(--danger)">-' + money(t.amount, false) + '</td>' +
            '<td>' + (t.type === 'custom' ? '<span class="tag custom">自定义</span>' : '<span class="tag">普通</span>') + '</td>' +
            '<td class="r num">' + bal + '</td>' +
            '<td><button class="icon-btn plain" data-del-tx="' + t.id + '" style="width:28px;height:28px">' + ic(ICONS.trash, 13) + '</button></td></tr>';
        });
        html += '</tbody></table></div>';
      }
      html += '</div>';

      // 月度归总
      var monthTx = txList;
      var mSpent = monthTx.reduce(function (s, t) { return s + Number(t.amount); }, 0);
      html += '<div class="card" style="align-self:start"><div class="card-title">月度归总</div>' +
        '<div class="me-row"><span>记录笔数</span><span class="grow"></span><b class="num">' + monthTx.length + ' 笔</b></div>' +
        '<div class="me-row"><span>支出合计</span><span class="grow"></span><b class="num" style="color:var(--danger)">' + money(mSpent) + '</b></div>' +
        (isCur ? '<div class="me-row"><span>本月收入</span><span class="grow"></span><b class="num">' + money(store.monthStats().income) + '</b></div>' +
          '<div class="me-row"><span>本月结余</span><span class="grow"></span><b class="num">' + money(store.monthStats().remaining) + '</b></div>' : '') +
        '<div class="card-title" style="margin-top:14px">大类 TOP ' + top.length + '</div>';
      if (!top.length) html += '<div class="empty">暂无数据</div>';
      top.forEach(function (t, i) {
        html += '<div class="me-row"><span>' + (i + 1) + '. ' + esc(t.name) + '</span><span class="grow"></span><b class="num">' + money(t.total) + '</b></div>';
      });
      html += '</div></div>';

      $('#view').innerHTML = html;
      bindTxDeletes();

      $('#rf-month').onchange = function () { recFilter.month = this.value; refresh(); };
      $('#rf-cat').onchange = function () { recFilter.cat = this.value; refresh(); };
      $('#rf-type').onchange = function () { recFilter.type = this.value; refresh(); };
      $('#rf-xlsx').onclick = function () { exportExcel(rows, '轻账本-' + recFilter.month + '-明细.xlsx'); };
      $('#rf-xlsx-month').onclick = function () { exportExcel(txList, '轻账本-' + recFilter.month + '-整月.xlsx'); };
    }

    async function refresh() {
      if (recFilter.month === store.state.month) {
        cats = store.state.categories;
        if (recFilter.cat && !cats.some(function (c) { return c.id === recFilter.cat; })) recFilter.cat = '';
        draw(store.state.transactions);
      } else {
        cats = await store.exportMonthCats(recFilter.month);
        if (recFilter.cat && !cats.some(function (c) { return c.id === recFilter.cat; })) recFilter.cat = '';
        var mm = await store.exportMonthTx(recFilter.month);
        draw(mm);
      }
    }

    refresh();
  }

  /* Excel 导出（SheetJS） */
  function exportExcel(txList, filename) {
    var cats = store.state.categories;
    var aoa = [['日期', '大类', '备注', '金额(¥)', '收支类型', '当日结余']];
    var daySum = {};
    txList.forEach(function (t) {
      var k = t.spent_at.slice(0, 10) + '|' + t.category_id;
      daySum[k] = (daySum[k] || 0) + Number(t.amount);
    });
    txList.forEach(function (t) {
      var c = cats.find(function (x) { return x.id === t.category_id; });
      var bal = '';
      if (c && c.is_daily && !c.is_float) {
        var k = t.spent_at.slice(0, 10) + '|' + t.category_id;
        bal = store.round2(store.dailyQuota(c, t.spent_at.slice(0, 7)) - daySum[k]);
      }
      aoa.push([
        t.spent_at.slice(0, 10),
        c ? c.name : '已删除大类',
        t.note || '',
        Number(t.amount),
        t.type === 'custom' ? '自定义支出' : '普通支出',
        bal
      ]);
    });
    var ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '明细');
    XLSX.writeFile(wb, filename);
    toast('已导出 ' + txList.length + ' 条');
  }

  /* ============================================================
   * 我的
   * ============================================================ */
  function viewMe() {
    setTitle('我的');
    var user = store.state.user;
    var themes = [
      { id: 'green', c: '#94A89A' }, { id: 'honey', c: '#B89968' },
      { id: 'ocean', c: '#7C9AAF' }, { id: 'rose', c: '#BC8F8F' }
    ];
    var cur = localStorage.getItem('qbz-theme') || 'green';
    var curF = localStorage.getItem('qbz-font') || 'normal';

    var html =
      '<div class="card"><div class="card-title">账号信息</div>' +
      '<div class="me-row"><span class="cat-icon" style="background:#EFEAE0;color:var(--sub)">' + ic(ICONS.me, 20) + '</span>' +
      '<div class="grow"><div style="font-weight:600">' + esc(user.email) + '</div>' +
      '<div class="desc">注册于 ' + (user.created_at || '').slice(0, 10) + ' · 数据多设备同步</div></div>' +
      '<button class="btn ghost small" id="btn-logout">' + ic(ICONS.logout, 14) + ' 退出登录</button></div></div>' +

      '<div class="card"><div class="card-title">外观设置</div>' +
      '<div class="me-row"><span>主题颜色</span><span class="grow"></span>' +
      '<span class="swatches">' + themes.map(function (t) {
        return '<span class="swatch ' + (t.id === cur ? 'on' : '') + '" data-theme="' + t.id + '" style="background:' + t.c + '"></span>';
      }).join('') + '</span></div>' +
      '<div class="me-row"><span>字体大小</span><span class="grow"></span>' +
      '<span class="font-opts">' +
      '<button data-font="normal" class="' + (curF === 'normal' ? 'on' : '') + '">标准</button>' +
      '<button data-font="large" class="' + (curF === 'large' ? 'on' : '') + '">大</button>' +
      '<button data-font="xlarge" class="' + (curF === 'xlarge' ? 'on' : '') + '">特大</button>' +
      '</span></div></div>' +

      '<div class="card"><div class="card-title">数据管理</div>' +
      '<div class="me-row"><div class="grow"><div style="font-weight:600">导出全部数据（JSON）</div>' +
      '<div class="desc">完整备份：月份、大类、全部明细</div></div>' +
      '<button class="btn secondary small" id="btn-json">' + ic(ICONS.download, 14) + ' JSON</button></div>' +
      '<div class="me-row"><div class="grow"><div style="font-weight:600">导出全部明细（Excel）</div>' +
      '<div class="desc">所有月份合并为一个 .xlsx</div></div>' +
      '<button class="btn secondary small" id="btn-xlsx-all">' + ic(ICONS.download, 14) + ' Excel</button></div>' +
      '<div class="me-row"><div class="grow"><div style="font-weight:600;color:var(--danger)">清空全部数据</div>' +
      '<div class="danger-note">删除所有月份、大类与明细，不可恢复！</div></div>' +
      '<button class="btn danger small" id="btn-clear">' + ic(ICONS.trash, 14) + ' 清空</button></div>' +
      '<div class="me-row"><a href="#/budget" style="color:var(--primary-deep);text-decoration:none;font-weight:600">预算设置 →</a></div>' +
      '</div>' +

      '<div class="banner-soon"><span style="color:var(--accent)">' + ic(ICONS.sun, 26) + '</span>' +
      '<div><div class="t">统计报表（即将上线）</div>' +
      '<div class="d">本月控制在预算内的天数、连续记录天数等统计成就，数据已在准备中。</div></div></div>';

    $('#view').innerHTML = html;

    $('#btn-logout').onclick = async function () {
      var ok = await confirmBox({ title: '退出登录？', text: '本机将清除登录状态，数据仍保留在云端。' });
      if (!ok) return;
      await store.signOut();
      toast('已退出');
    };
    $$('#view .swatch').forEach(function (s) {
      s.onclick = function () {
        localStorage.setItem('qbz-theme', s.dataset.theme);
        applyPrefs(); viewMe();
      };
    });
    $$('#view .font-opts button').forEach(function (b) {
      b.onclick = function () {
        localStorage.setItem('qbz-font', b.dataset.font);
        applyPrefs(); viewMe();
      };
    });
    $('#btn-json').onclick = async function () {
      var all = await store.exportAll();
      var blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '轻账本-全部数据-' + todayStr() + '.json';
      a.click();
      URL.revokeObjectURL(a.href);
      toast('已导出 JSON');
    };
    $('#btn-xlsx-all').onclick = async function () {
      var all = await store.exportAll();
      var list = all.transactions.slice().sort(function (a, b) { return a.spent_at < b.spent_at ? -1 : 1; });
      // 用全量类目名映射
      var catMap = {};
      all.categories.forEach(function (c) { catMap[c.id] = c; });
      var aoa = [['月份', '日期', '大类', '备注', '金额(¥)', '收支类型']];
      list.forEach(function (t) {
        var c = catMap[t.category_id];
        aoa.push([t.spent_at.slice(0, 7), t.spent_at.slice(0, 10), c ? c.name : '已删除大类',
          t.note || '', Number(t.amount), t.type === 'custom' ? '自定义支出' : '普通支出']);
      });
      var ws = XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [{ wch: 9 }, { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 10 }, { wch: 10 }];
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '全部明细');
      XLSX.writeFile(wb, '轻账本-全部明细-' + todayStr() + '.xlsx');
      toast('已导出 ' + list.length + ' 条');
    };
    $('#btn-clear').onclick = async function () {
      var ok = await confirmBox({
        title: '清空全部数据？',
        text: '将删除所有月份、大类与明细记录，操作不可恢复！如果只是想想整理数据，建议先导出 JSON 备份。',
        danger: true, requireText: '清空'
      });
      if (!ok) return;
      await store.clearAll();
      toast('已清空，正在重建本月…');
      await store.loadMonth();
      render();
    };
  }

  /* ============================================================
   * 渲染调度
   * ============================================================ */
  function render() {
    if (!store.state.user) { renderLogin(); return; }
    if (!store.state.ready) { $('#app').innerHTML = '<div class="login-wrap"><div class="card">载入中…</div></div>'; return; }
    renderShell();
    var r = currentRoute();
    if (r === 'overview') viewOverview();
    else if (r === 'today') viewToday();
    else if (r === 'budget') viewBudget();
    else if (r === 'records') viewRecords(store.listMonthsCache || [store.state.month]);
    else if (r === 'me') viewMe();
  }

  async function boot() {
    applyPrefs();
    await store.init();
    store.onSync(updateSyncBadge);
    var bootedFor = null, booting = null;
    store.onAuth(function (user) {
      if (!user) { render(); return; }
      if (bootedFor === user.id) { render(); return; }
      if (booting) return;                       // 正在启动，跳过重复触发
      booting = (async function () {
        try {
          await store.loadMonth();
          var ms = await store.listMonths();
          store.listMonthsCache = ms.length ? ms : [store.state.month];
          bootedFor = user.id;
          render();
        } catch (e) {
          console.error(e);
          alert('数据载入失败：' + e.message + '\n\n如果是新账号，请先在 Supabase SQL Editor 执行 supabase-schema.sql 建表。');
        } finally { booting = null; }
      })();
    });
    window.addEventListener('hashchange', render);
  }

  return { boot: boot, render: render };
})();

document.addEventListener('DOMContentLoaded', QBZ.app.boot);
