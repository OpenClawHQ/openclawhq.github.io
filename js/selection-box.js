/**
 * Selection style: no fill, #eae6e1 dashed border with clockwise dash animation.
 * Row-merge + clockwise outline; supports rect, L-shape, hexagon, etc.
 */
(function () {
  'use strict';
  if (typeof document === 'undefined' || !document.getSelection) return;

  var overlay = null;
  var styleEl = null;
  var raf = null;

  function ensureOverlay() {
    if (overlay) return overlay;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.textContent = [
        '.selection-box-overlay{position:fixed;pointer-events:none;z-index:199;left:0;top:0;overflow:visible;}',
        '.selection-box-overlay svg{position:absolute;left:0;top:0;display:block;}',
        '.selection-box-overlay path{fill:none;stroke:#f97316;stroke-width:2;stroke-dasharray:10 8;stroke-linecap:butt;stroke-linejoin:miter;animation:selection-dash 0.6s linear infinite;}',
        '@keyframes selection-dash{to{stroke-dashoffset:-18}}'
      ].join('');
      document.head.appendChild(styleEl);
    }
    overlay = document.createElement('div');
    overlay.setAttribute('class', 'selection-box-overlay');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<svg><path/></svg>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = 'none';
      var p = overlay.querySelector('path');
      if (p) p.setAttribute('d', '');
    }
    if (raf) cancelAnimationFrame(raf);
  }

  function buildRows(clientRects) {
    var list = [];
    for (var i = 0; i < clientRects.length; i++) {
      var r = clientRects[i];
      if (r.width < 1 || r.height < 1) continue;
      list.push({ l: r.left, r: r.right, t: r.top, b: r.bottom });
    }
    if (!list.length) return [];

    list.sort(function (a, b) { return a.t - b.t || a.l - b.l; });

    var rows = [];
    var c = { l: list[0].l, r: list[0].r, t: list[0].t, b: list[0].b };

    for (var i = 1; i < list.length; i++) {
      var rect = list[i];
      var overlap = Math.min(c.b, rect.b) - Math.max(c.t, rect.t);
      var minH = Math.min(c.b - c.t, rect.b - rect.t);
      if (minH > 0 && overlap > minH * 0.3) {
        c.l = Math.min(c.l, rect.l);
        c.r = Math.max(c.r, rect.r);
        c.t = Math.min(c.t, rect.t);
        c.b = Math.max(c.b, rect.b);
      } else {
        rows.push(c);
        c = { l: rect.l, r: rect.r, t: rect.t, b: rect.b };
      }
    }
    rows.push(c);

    for (var i = 0; i < rows.length - 1; i++) {
      var gap = rows[i + 1].t - rows[i].b;
      if (gap > 0 && gap < 4) {
        var mid = (rows[i].b + rows[i + 1].t) / 2;
        rows[i].b = mid;
        rows[i + 1].t = mid;
      }
    }

    return rows;
  }

  function rowsToPath(rows, offX, offY) {
    if (!rows.length) return '';
    var pts = [];

    pts.push([rows[0].l, rows[0].t]);
    pts.push([rows[0].r, rows[0].t]);

    for (var i = 0; i < rows.length; i++) {
      pts.push([rows[i].r, rows[i].b]);
      if (i < rows.length - 1) {
        pts.push([rows[i + 1].r, rows[i + 1].t]);
      }
    }

    pts.push([rows[rows.length - 1].l, rows[rows.length - 1].b]);

    for (var i = rows.length - 1; i >= 0; i--) {
      pts.push([rows[i].l, rows[i].t]);
      if (i > 0) {
        pts.push([rows[i - 1].l, rows[i - 1].b]);
      }
    }

    var clean = [pts[0]];
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], prev = clean[clean.length - 1];
      if (Math.abs(p[0] - prev[0]) > 0.5 || Math.abs(p[1] - prev[1]) > 0.5) {
        clean.push(p);
      }
    }
    if (clean.length > 1) {
      var f = clean[0], la = clean[clean.length - 1];
      if (Math.abs(f[0] - la[0]) < 0.5 && Math.abs(f[1] - la[1]) < 0.5) clean.pop();
    }

    var final = [];
    var n = clean.length;
    for (var i = 0; i < n; i++) {
      var prev = clean[(i - 1 + n) % n];
      var curr = clean[i];
      var next = clean[(i + 1) % n];
      var sameX = Math.abs(prev[0] - curr[0]) < 0.5 && Math.abs(curr[0] - next[0]) < 0.5;
      var sameY = Math.abs(prev[1] - curr[1]) < 0.5 && Math.abs(curr[1] - next[1]) < 0.5;
      if (!sameX && !sameY) final.push(curr);
    }
    if (final.length < 3) final = clean;

    /* Right-angle path only: vertices connected by lines, no rounding */
    var d = [];
    for (var i = 0; i < final.length; i++) {
      var x = (final[i][0] - offX).toFixed(1);
      var y = (final[i][1] - offY).toFixed(1);
      d.push(i === 0 ? 'M' + x + ',' + y : 'L' + x + ',' + y);
    }
    d.push('Z');
    return d.join(' ');
  }

  function updateBox() {
    var sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      hideOverlay();
      return;
    }
    var range = sel.getRangeAt(0);
    if (!document.body.contains(range.commonAncestorContainer)) {
      hideOverlay();
      return;
    }
    if (!sel.toString().trim()) {
      hideOverlay();
      return;
    }
    var rects = range.getClientRects();
    if (!rects || rects.length === 0) {
      hideOverlay();
      return;
    }
    var rows = buildRows(rects);
    if (!rows.length) {
      hideOverlay();
      return;
    }

    var minX = rows[0].l, minY = rows[0].t, maxX = rows[0].r, maxY = rows[0].b;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i].l < minX) minX = rows[i].l;
      if (rows[i].t < minY) minY = rows[i].t;
      if (rows[i].r > maxX) maxX = rows[i].r;
      if (rows[i].b > maxY) maxY = rows[i].b;
    }

    var pad = 10;
    var oL = minX - pad, oT = minY - pad;
    var oW = maxX - minX + pad * 2;
    var oH = maxY - minY + pad * 2;

    var pathStr = rowsToPath(rows, oL, oT);
    if (!pathStr) { hideOverlay(); return; }

    var el = ensureOverlay();
    el.style.display = '';
    el.style.left = oL + 'px';
    el.style.top = oT + 'px';
    el.style.width = oW + 'px';
    el.style.height = oH + 'px';

    var svg = el.querySelector('svg');
    var path = el.querySelector('path');
    if (svg && path) {
      svg.setAttribute('width', oW);
      svg.setAttribute('height', oH);
      path.setAttribute('d', pathStr);
    }
  }

  function onSelectionChange() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () { raf = null; updateBox(); });
  }

  function onScrollResize() {
    var sel = document.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) updateBox();
  }

  document.addEventListener('selectionchange', onSelectionChange);
  window.addEventListener('scroll', onScrollResize, true);
  window.addEventListener('resize', onScrollResize);
})();
