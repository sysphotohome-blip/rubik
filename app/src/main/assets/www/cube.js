/* Mô hình khối Rubik 3x3 + bộ vẽ 3D (canvas) + sơ đồ nhìn từ trên (SVG).
   Hệ trục: x = phải (R), y = trên (U), z = phía người nhìn (F).
   Màu: U vàng, D trắng, F xanh lá, B xanh dương, R cam, L đỏ. */
(function (root) {
  'use strict';

  var FACE_N = {
    U: [0, 1, 0], D: [0, -1, 0],
    F: [0, 0, 1], B: [0, 0, -1],
    R: [1, 0, 0], L: [-1, 0, 0]
  };
  var FACES = ['U', 'D', 'F', 'B', 'R', 'L'];

  var COLORS = {
    U: '#ffd60a', D: '#f8f9fa', F: '#12a150', B: '#1668dc',
    R: '#ff7a1a', L: '#d7263d', X: '#565c66'
  };
  var BODY = '#14161a';

  var ALL = [-1, 0, 1];
  // [trục, các lớp, chiều quay 90° (+1 = ngược chiều kim đồng hồ khi nhìn từ đầu dương của trục)]
  var MOVES = {
    R: [0, [1], -1], L: [0, [-1], 1],
    U: [1, [1], -1], D: [1, [-1], 1],
    F: [2, [1], -1], B: [2, [-1], 1],
    M: [0, [0], 1], E: [1, [0], 1], S: [2, [0], -1],
    x: [0, ALL, -1], y: [1, ALL, -1], z: [2, ALL, -1]
  };

  function rot90(v, axis, dir) {
    var x = v[0], y = v[1], z = v[2];
    if (axis === 0) return dir > 0 ? [x, -z, y] : [x, z, -y];
    if (axis === 1) return dir > 0 ? [z, y, -x] : [-z, y, x];
    return dir > 0 ? [-y, x, z] : [y, -x, z];
  }

  function rotAngle(v, axis, a) {
    var c = Math.cos(a), s = Math.sin(a), x = v[0], y = v[1], z = v[2];
    if (axis === 0) return [x, y * c - z * s, y * s + z * c];
    if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
    return [x * c - y * s, x * s + y * c, z];
  }

  /* mask(home, face) -> true nếu ô đó được tô màu, false = xám ("chưa cần quan tâm") */
  function solved(mask) {
    var cubies = [];
    for (var x = -1; x <= 1; x++) for (var y = -1; y <= 1; y++) for (var z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      var home = [x, y, z], st = [];
      for (var i = 0; i < FACES.length; i++) {
        var f = FACES[i], n = FACE_N[f];
        if (n[0] * x + n[1] * y + n[2] * z === 1) {
          st.push({ n: n.slice(), c: (!mask || mask(home, f)) ? f : 'X' });
        }
      }
      cubies.push({ home: home, pos: home.slice(), st: st });
    }
    return cubies;
  }

  function clone(state) {
    return state.map(function (c) {
      return {
        home: c.home, pos: c.pos.slice(),
        st: c.st.map(function (s) { return { n: s.n.slice(), c: s.c }; })
      };
    });
  }

  function parse(alg) {
    var out = [];
    (alg || '').split(/\s+/).forEach(function (tok) {
      if (!tok) return;
      var base = tok[0], suf = tok.slice(1), m = MOVES[base];
      if (!m) throw new Error('Nước xoay không hợp lệ: ' + tok);
      var turns = suf === '2' ? 2 : 1;
      var dir = suf === "'" ? -m[2] : m[2];
      out.push({ label: tok, base: base, axis: m[0], layers: m[1], dir: dir, turns: turns });
    });
    return out;
  }

  function applyMove(state, mv) {
    for (var i = 0; i < state.length; i++) {
      var c = state[i];
      if (mv.layers.indexOf(c.pos[mv.axis]) < 0) continue;
      for (var t = 0; t < mv.turns; t++) {
        c.pos = rot90(c.pos, mv.axis, mv.dir);
        for (var k = 0; k < c.st.length; k++) c.st[k].n = rot90(c.st[k].n, mv.axis, mv.dir);
      }
    }
    return state;
  }

  function apply(state, alg) {
    parse(alg).forEach(function (mv) { applyMove(state, mv); });
    return state;
  }

  function invert(alg) {
    return (alg || '').split(/\s+/).filter(Boolean).reverse().map(function (t) {
      var b = t[0], s = t.slice(1);
      return s === '2' ? t : (s === "'" ? b : b + "'");
    }).join(' ');
  }

  function repeat(alg, n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(alg);
    return a.join(' ');
  }

  function eq(a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }

  /* Màu của ô tại vị trí pos, hướng mặt face */
  function colorAt(state, pos, face) {
    var n = FACE_N[face];
    for (var i = 0; i < state.length; i++) {
      if (!eq(state[i].pos, pos)) continue;
      for (var k = 0; k < state[i].st.length; k++) if (eq(state[i].st[k].n, n)) return state[i].st[k].c;
    }
    return null;
  }

  function isSolved(state) {
    for (var i = 0; i < state.length; i++) {
      var c = state[i];
      if (!eq(c.pos, c.home)) return false;
      for (var k = 0; k < c.st.length; k++) {
        var n = c.st[k].n, f = c.st[k].c;
        if (f !== 'X' && !eq(n, FACE_N[f])) return false;
      }
    }
    return true;
  }

  /* ---------- Vẽ 3D ---------- */

  var AXES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var DIRS = FACES.map(function (f) { return FACE_N[f]; });

  function shade(hex, k) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgb(' + Math.round((n >> 16) * k) + ',' + Math.round(((n >> 8) & 255) * k) + ',' + Math.round((n & 255) * k) + ')';
  }

  function drawCube(canvas, state, o) {
    o = o || {};
    var dpr = (root.devicePixelRatio || 1);
    var w = o.size || canvas.clientWidth || 200, h = o.size || canvas.clientHeight || 200;
    var bw = Math.round(w * dpr), bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) { canvas.width = bw; canvas.height = bh; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    var yaw = (o.yaw == null ? -32 : o.yaw) * Math.PI / 180;
    var pitch = (o.pitch == null ? 26 : o.pitch) * Math.PI / 180;
    var cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    var scale = Math.min(w, h) / 5.5, ox = w / 2, oy = h / 2;
    var turn = o.turn;

    function view(p) {
      var x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy, y = p[1];
      return [x, y * cp - z * sp, y * sp + z * cp];
    }
    function inTurn(c) { return turn && turn.layers.indexOf(c.pos[turn.axis]) >= 0; }
    function tr(p, moving) { return moving ? rotAngle(p, turn.axis, turn.angle) : p; }

    var items = state.map(function (c) {
      var moving = inTurn(c);
      return { c: c, moving: moving, depth: view(tr(c.pos, moving))[2] };
    });
    items.sort(function (a, b) { return a.depth - b.depth; });

    ctx.lineJoin = 'round';
    function poly(center, u, v, half, moving) {
      ctx.beginPath();
      var sg = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (var i = 0; i < 4; i++) {
        var p = [
          center[0] + (u[0] * sg[i][0] + v[0] * sg[i][1]) * half,
          center[1] + (u[1] * sg[i][0] + v[1] * sg[i][1]) * half,
          center[2] + (u[2] * sg[i][0] + v[2] * sg[i][1]) * half
        ];
        var q = view(tr(p, moving));
        var sx = ox + q[0] * scale, syy = oy - q[1] * scale;
        if (i) ctx.lineTo(sx, syy); else ctx.moveTo(sx, syy);
      }
      ctx.closePath();
    }

    items.forEach(function (it) {
      var c = it.c;
      for (var d = 0; d < 6; d++) {
        var n = DIRS[d];
        var nv = view(tr(n, it.moving));
        if (nv[2] <= 0.02) continue;
        var ax = n[0] ? 0 : (n[1] ? 1 : 2);
        var u = AXES[(ax + 1) % 3], v = AXES[(ax + 2) % 3];
        var center = [c.pos[0] + n[0] * 0.5, c.pos[1] + n[1] * 0.5, c.pos[2] + n[2] * 0.5];
        poly(center, u, v, 0.5, it.moving);
        ctx.fillStyle = BODY; ctx.strokeStyle = BODY; ctx.lineWidth = 1;
        ctx.fill(); ctx.stroke();
        var col = null;
        for (var k = 0; k < c.st.length; k++) if (eq(c.st[k].n, n)) col = c.st[k].c;
        if (!col) continue;
        // đổ bóng nhẹ theo hướng mặt
        var light = Math.max(0, nv[0] * -0.25 + nv[1] * 0.55 + nv[2] * 0.8);
        var shaded = shade(COLORS[col], 1 - 0.26 * (1 - light));
        poly(center, u, v, 0.36, it.moving);
        ctx.fillStyle = shaded; ctx.strokeStyle = shaded;
        ctx.lineWidth = scale * 0.12;
        ctx.fill(); ctx.stroke();
      }
    });
  }

  /* ---------- Sơ đồ mặt trên (SVG) ---------- */

  function svgArrows(arrows, cell, off, id) {
    if (!arrows || !arrows.length) return '';
    var s = '<defs><marker id="' + id + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" class="tv-arrow-head"/></marker></defs>';
    arrows.forEach(function (a) {
      var x1 = off + (a[0] + 0.5) * cell, y1 = off + (a[1] + 0.5) * cell;
      var x2 = off + (a[2] + 0.5) * cell, y2 = off + (a[3] + 0.5) * cell;
      var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, sh = cell * 0.24;
      x1 += dx / len * sh; y1 += dy / len * sh; x2 -= dx / len * sh; y2 -= dy / len * sh;
      s += '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="tv-arrow" marker-end="url(#' + id + ')"' +
        (a[4] ? ' marker-start="url(#' + id + ')"' : '') + '/>';
    });
    return s;
  }

  var svgSeq = 0;
  function topSvg(cells, strips, arrows) {
    var cell = 34, st = strips ? 9 : 0, gap = strips ? 4 : 0, off = st + gap + 2, size = off * 2 + cell * 3;
    var s = '<svg class="topview" viewBox="0 0 ' + size + ' ' + size + '" xmlns="http://www.w3.org/2000/svg">';
    s += '<rect x="' + (off - 2) + '" y="' + (off - 2) + '" width="' + (cell * 3 + 4) + '" height="' + (cell * 3 + 4) + '" rx="6" fill="' + BODY + '"/>';
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
      s += '<rect x="' + (off + c * cell + 2) + '" y="' + (off + r * cell + 2) + '" width="' + (cell - 4) + '" height="' + (cell - 4) +
        '" rx="5" fill="' + COLORS[cells[r * 3 + c]] + '"/>';
    }
    if (strips) {
      for (var i = 0; i < 3; i++) {
        var p = off + i * cell + 4, L = cell - 8;
        s += '<rect x="' + p + '" y="2" width="' + L + '" height="' + st + '" rx="3" fill="' + COLORS[strips.B[i]] + '" stroke="' + BODY + '"/>';
        s += '<rect x="' + p + '" y="' + (size - st - 2) + '" width="' + L + '" height="' + st + '" rx="3" fill="' + COLORS[strips.F[i]] + '" stroke="' + BODY + '"/>';
        s += '<rect x="2" y="' + p + '" width="' + st + '" height="' + L + '" rx="3" fill="' + COLORS[strips.L[i]] + '" stroke="' + BODY + '"/>';
        s += '<rect x="' + (size - st - 2) + '" y="' + p + '" width="' + st + '" height="' + L + '" rx="3" fill="' + COLORS[strips.R[i]] + '" stroke="' + BODY + '"/>';
      }
    }
    s += svgArrows(arrows, cell, off, 'tvh' + (++svgSeq));
    return s + '</svg>';
  }

  /* Nhìn thẳng từ trên xuống: hàng trên = phía sau, hàng dưới = phía trước */
  function topView(state, arrows) {
    var cells = [], strips = { B: [], F: [], L: [], R: [] };
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) cells.push(colorAt(state, [c - 1, 1, r - 1], 'U'));
    for (var i = 0; i < 3; i++) {
      strips.B.push(colorAt(state, [i - 1, 1, -1], 'B'));
      strips.F.push(colorAt(state, [i - 1, 1, 1], 'F'));
      strips.L.push(colorAt(state, [-1, 1, i - 1], 'L'));
      strips.R.push(colorAt(state, [1, 1, i - 1], 'R'));
    }
    return topSvg(cells, strips, arrows);
  }

  /* Mẫu 9 ký tự: 'y' = vàng, còn lại = xám */
  function topPattern(pattern, arrows) {
    var cells = pattern.split('').map(function (ch) { return ch === 'y' ? 'U' : 'X'; });
    return topSvg(cells, null, arrows);
  }

  var api = {
    FACE_N: FACE_N, COLORS: COLORS, solved: solved, clone: clone, parse: parse,
    applyMove: applyMove, apply: apply, invert: invert, repeat: repeat,
    colorAt: colorAt, isSolved: isSolved, drawCube: drawCube,
    topView: topView, topPattern: topPattern
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Cube = api;
})(typeof window !== 'undefined' ? window : this);
