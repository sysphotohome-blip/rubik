/* Bộ giải Rubik 3x3 theo thuật toán hai pha (Kociemba), chạy hoàn toàn trên máy.
   Đầu vào: chuỗi 54 ký tự theo thứ tự mặt U R F D L B, mỗi mặt 9 ô đọc từ trái sang phải, trên xuống dưới;
   mỗi ký tự là tên mặt (U/R/F/D/L/B) mà ô đó thuộc về (xác định theo màu ô tâm). */
(function (root) {
  'use strict';

  var FACES = 'URFDLB';
  var N_TWIST = 2187, N_FLIP = 2048, N_SLICE = 495, N_PERM = 40320, N_SP = 24;

  // Vị trí các ô của từng viên góc / viên cạnh trong chuỗi 54 ô
  var CORNER_F = [[8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11], [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51]];
  var EDGE_F = [[5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14]];
  function faceOf(i) { return FACES[(i / 9) | 0]; }
  var CORNER_C = CORNER_F.map(function (f) { return f.map(faceOf); });
  var EDGE_C = EDGE_F.map(function (f) { return f.map(faceOf); });

  // 6 nước cơ bản ở mức viên: góc URF UFL ULB UBR DFR DLF DBL DRB; cạnh UR UF UL UB DR DF DL DB FR FL BL BR
  var BASE = [
    { cp: [3, 0, 1, 2, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0], ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, // U
    { cp: [4, 1, 2, 0, 7, 5, 6, 3], co: [2, 0, 0, 1, 1, 0, 0, 2], ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, // R
    { cp: [1, 5, 2, 3, 0, 4, 6, 7], co: [1, 2, 0, 0, 2, 1, 0, 0], ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11], eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0] }, // F
    { cp: [0, 1, 2, 3, 5, 6, 7, 4], co: [0, 0, 0, 0, 0, 0, 0, 0], ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, // D
    { cp: [0, 2, 6, 3, 4, 1, 5, 7], co: [0, 1, 2, 0, 0, 2, 1, 0], ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }, // L
    { cp: [0, 1, 3, 7, 4, 5, 2, 6], co: [0, 0, 1, 2, 0, 0, 2, 1], ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7], eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1] }  // B
  ];

  function identity() {
    return { cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0], ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  }
  // Trạng thái a rồi thực hiện tiếp b
  function mul(a, b) {
    var r = { cp: [], co: [], ep: [], eo: [] }, i;
    for (i = 0; i < 8; i++) { r.cp[i] = a.cp[b.cp[i]]; r.co[i] = (a.co[b.cp[i]] + b.co[i]) % 3; }
    for (i = 0; i < 12; i++) { r.ep[i] = a.ep[b.ep[i]]; r.eo[i] = (a.eo[b.ep[i]] + b.eo[i]) % 2; }
    return r;
  }
  // 18 nước: mặt*3 + (0: 90°, 1: 180°, 2: 90° ngược)
  var MOVE = [];
  BASE.forEach(function (b) {
    var c = identity();
    for (var p = 0; p < 3; p++) { c = mul(c, b); MOVE.push(c); }
  });
  var MOVE_NAME = [];
  for (var mi = 0; mi < 18; mi++) MOVE_NAME.push(FACES[(mi / 3) | 0] + ['', '2', "'"][mi % 3]);
  var P2 = [0, 1, 2, 9, 10, 11, 4, 13, 7, 16]; // U* D* R2 L2 F2 B2
  var IS_P2 = [];
  P2.forEach(function (m) { IS_P2[m] = true; });

  /* ---------- Đọc và kiểm tra trạng thái ---------- */

  function fail(code, msg) { var e = new Error(msg); e.code = code; return e; }

  function fromFacelets(f) {
    if (!f || f.length !== 54) throw fail('len', 'Chưa nhập đủ 54 ô.');
    var i, j, count = {};
    for (i = 0; i < 54; i++) count[f[i]] = (count[f[i]] || 0) + 1;
    for (i = 0; i < 6; i++) if (count[FACES[i]] !== 9) throw fail('count', 'Mỗi màu phải xuất hiện đúng 9 ô.');

    var c = identity(), seen, ori, found;
    seen = [];
    for (i = 0; i < 8; i++) {
      for (ori = 0; ori < 3; ori++) { var ch = f[CORNER_F[i][ori]]; if (ch === 'U' || ch === 'D') break; }
      if (ori === 3) throw fail('corner', 'Có viên góc không hợp lệ (thiếu màu của mặt trên/dưới).');
      var c0 = f[CORNER_F[i][ori]], c1 = f[CORNER_F[i][(ori + 1) % 3]], c2 = f[CORNER_F[i][(ori + 2) % 3]];
      found = -1;
      for (j = 0; j < 8; j++) if (CORNER_C[j][0] === c0 && CORNER_C[j][1] === c1 && CORNER_C[j][2] === c2) found = j;
      if (found < 0 || seen[found]) throw fail('corner', 'Có viên góc mang bộ ba màu không thể tồn tại hoặc bị trùng.');
      seen[found] = true; c.cp[i] = found; c.co[i] = ori;
    }
    seen = [];
    for (i = 0; i < 12; i++) {
      var a = f[EDGE_F[i][0]], b = f[EDGE_F[i][1]];
      found = -1;
      for (j = 0; j < 12; j++) {
        if (EDGE_C[j][0] === a && EDGE_C[j][1] === b) { found = j; c.eo[i] = 0; }
        else if (EDGE_C[j][0] === b && EDGE_C[j][1] === a) { found = j; c.eo[i] = 1; }
      }
      if (found < 0 || seen[found]) throw fail('edge', 'Có viên cạnh mang cặp màu không thể tồn tại hoặc bị trùng.');
      seen[found] = true; c.ep[i] = found;
    }
    var s = 0;
    for (i = 0; i < 8; i++) s += c.co[i];
    if (s % 3) throw fail('twist', 'Có một viên góc bị xoay sai (hoặc một ô ở góc bị nhập nhầm màu).');
    s = 0;
    for (i = 0; i < 12; i++) s += c.eo[i];
    if (s % 2) throw fail('flip', 'Có một viên cạnh bị lật ngược (hoặc hai ô của một viên cạnh bị nhập nhầm).');
    if (parity(c.cp) !== parity(c.ep)) throw fail('parity', 'Có hai viên bị đổi chỗ cho nhau (hoặc bị nhập nhầm).');
    return c;
  }

  function parity(p) {
    var s = 0;
    for (var i = 0; i < p.length; i++) for (var j = i + 1; j < p.length; j++) if (p[i] > p[j]) s++;
    return s % 2;
  }

  /* ---------- Toạ độ ---------- */

  function rankPerm(p, n) {
    var r = 0;
    for (var i = 0; i < n; i++) {
      var k = 0;
      for (var j = i + 1; j < n; j++) if (p[j] < p[i]) k++;
      r = r * (n - i) + k;
    }
    return r;
  }
  function unrankPerm(r, n) {
    var code = [], i;
    for (i = n - 1; i >= 0; i--) { code[i] = r % (n - i); r = (r / (n - i)) | 0; }
    var pool = [], p = [];
    for (i = 0; i < n; i++) pool.push(i);
    for (i = 0; i < n; i++) p.push(pool.splice(code[i], 1)[0]);
    return p;
  }

  var SLICE_MASK = [], SLICE_IDX = {}, SLICE_GOAL;
  (function () {
    for (var m = 0; m < 4096; m++) {
      var b = 0;
      for (var k = 0; k < 12; k++) if (m & (1 << k)) b++;
      if (b === 4) { SLICE_IDX[m] = SLICE_MASK.length; SLICE_MASK.push(m); }
    }
    SLICE_GOAL = SLICE_IDX[0xF00];
  })();

  function getTwist(c) { var t = 0; for (var i = 0; i < 7; i++) t = t * 3 + c.co[i]; return t; }
  function getFlip(c) { var t = 0; for (var i = 0; i < 11; i++) t = t * 2 + c.eo[i]; return t; }
  function getSlice(c) { var m = 0; for (var i = 0; i < 12; i++) if (c.ep[i] >= 8) m |= 1 << i; return SLICE_IDX[m]; }
  function getCP(c) { return rankPerm(c.cp, 8); }
  function getEP(c) { return rankPerm(c.ep, 8); }
  function getSP(c) { return rankPerm([c.ep[8] - 8, c.ep[9] - 8, c.ep[10] - 8, c.ep[11] - 8], 4); }

  function setTwist(t) {
    var c = identity(), s = 0;
    for (var i = 6; i >= 0; i--) { c.co[i] = t % 3; s += c.co[i]; t = (t / 3) | 0; }
    c.co[7] = (3 - s % 3) % 3;
    return c;
  }
  function setFlip(t) {
    var c = identity(), s = 0;
    for (var i = 10; i >= 0; i--) { c.eo[i] = t % 2; s += c.eo[i]; t = (t / 2) | 0; }
    c.eo[11] = s % 2;
    return c;
  }
  function setSlice(idx) {
    var c = identity(), m = SLICE_MASK[idx], a = 8, b = 0;
    for (var i = 0; i < 12; i++) c.ep[i] = (m & (1 << i)) ? a++ : b++;
    return c;
  }
  function setCP(r) { var c = identity(); c.cp = unrankPerm(r, 8); return c; }
  function setEP(r) { var c = identity(), p = unrankPerm(r, 8); for (var i = 0; i < 8; i++) c.ep[i] = p[i]; return c; }
  function setSP(r) { var c = identity(), p = unrankPerm(r, 4); for (var i = 0; i < 4; i++) c.ep[8 + i] = p[i] + 8; return c; }

  /* ---------- Bảng ---------- */

  var T = null;

  function moveTable(n, set, get, moves, Arr) {
    var nm = moves.length, t = new Arr(n * nm);
    for (var i = 0; i < n; i++) {
      var c = set(i);
      for (var k = 0; k < nm; k++) t[i * nm + k] = get(mul(c, MOVE[moves[k]]));
    }
    return t;
  }

  // Khoảng cách tối thiểu tới đích của cặp toạ độ (a, b)
  function pruneTable(nA, nB, mA, mB, nm, goalA, goalB) {
    var size = nA * nB, t = new Int8Array(size), q = new Int32Array(size), head = 0, tail = 0;
    for (var i = 0; i < size; i++) t[i] = -1;
    var s = goalA * nB + goalB;
    t[s] = 0; q[tail++] = s;
    while (head < tail) {
      var cur = q[head++], a = (cur / nB) | 0, b = cur - a * nB, d = t[cur] + 1;
      for (var k = 0; k < nm; k++) {
        var nx = mA[a * nm + k] * nB + mB[b * nm + k];
        if (t[nx] < 0) { t[nx] = d; q[tail++] = nx; }
      }
    }
    return t;
  }

  function init() {
    if (T) return;
    var all = [];
    for (var i = 0; i < 18; i++) all.push(i);
    var t = {};
    t.twist = moveTable(N_TWIST, setTwist, getTwist, all, Uint16Array);
    t.flip = moveTable(N_FLIP, setFlip, getFlip, all, Uint16Array);
    t.slice = moveTable(N_SLICE, setSlice, getSlice, all, Uint16Array);
    t.cp = moveTable(N_PERM, setCP, getCP, P2, Uint16Array);
    t.ep = moveTable(N_PERM, setEP, getEP, P2, Uint16Array);
    t.sp = moveTable(N_SP, setSP, getSP, P2, Uint16Array);
    t.pTwist = pruneTable(N_SLICE, N_TWIST, t.slice, t.twist, 18, SLICE_GOAL, 0);
    t.pFlip = pruneTable(N_SLICE, N_FLIP, t.slice, t.flip, 18, SLICE_GOAL, 0);
    t.pCP = pruneTable(N_PERM, N_SP, t.cp, t.sp, 10, 0, 0);
    t.pEP = pruneTable(N_PERM, N_SP, t.ep, t.sp, 10, 0, 0);
    T = t;
  }

  /* ---------- Tìm kiếm ---------- */

  function search(start, maxLen, deadline) {
    var sol = [], nodes = 0, total = -1;

    function tick() {
      if ((++nodes & 8191) === 0 && Date.now() > deadline) throw fail('timeout', 'Hết thời gian tìm kiếm.');
    }

    function phase2(cp, ep, sp, depth, togo, last) {
      if (togo === 0) {
        if (cp === 0 && ep === 0 && sp === 0) { total = depth; return true; }
        return false;
      }
      if (T.pCP[cp * N_SP + sp] > togo || T.pEP[ep * N_SP + sp] > togo) return false;
      tick();
      for (var k = 0; k < 10; k++) {
        var m = P2[k], f = (m / 3) | 0;
        if (f === last || f + 3 === last) continue;
        sol[depth] = m;
        if (phase2(T.cp[cp * 10 + k], T.ep[ep * 10 + k], T.sp[sp * 10 + k], depth + 1, togo - 1, f)) return true;
      }
      return false;
    }

    function startPhase2(d1, last) {
      var c = start;
      for (var i = 0; i < d1; i++) c = mul(c, MOVE[sol[i]]);
      var cp = getCP(c), ep = getEP(c), sp = getSP(c);
      var lim = maxLen - d1;
      for (var d2 = 0; d2 <= lim; d2++) if (phase2(cp, ep, sp, d1, d2, last)) return true;
      return false;
    }

    function phase1(tw, fl, sl, depth, togo, last) {
      if (togo === 0) {
        if (tw !== 0 || fl !== 0 || sl !== SLICE_GOAL) return false;
        // nước cuối của pha 1 không nên là nước của pha 2 (tránh xét trùng)
        if (depth > 0 && IS_P2[sol[depth - 1]]) return false;
        return startPhase2(depth, last);
      }
      if (T.pTwist[sl * N_TWIST + tw] > togo || T.pFlip[sl * N_FLIP + fl] > togo) return false;
      tick();
      for (var m = 0; m < 18; m++) {
        var f = (m / 3) | 0;
        if (f === last || f + 3 === last) continue;
        sol[depth] = m;
        if (phase1(T.twist[tw * 18 + m], T.flip[fl * 18 + m], T.slice[sl * 18 + m], depth + 1, togo - 1, f)) return true;
      }
      return false;
    }

    var tw = getTwist(start), fl = getFlip(start), sl = getSlice(start);
    for (var d1 = 0; d1 <= maxLen; d1++) {
      if (phase1(tw, fl, sl, 0, d1, -1)) return sol.slice(0, total).map(function (m) { return MOVE_NAME[m]; });
    }
    return null;
  }

  /* Trả về mảng các nước xoay (rỗng nếu khối đã giải xong). Ném lỗi có .code nếu trạng thái không hợp lệ. */
  function solve(facelets, budgetMs) {
    var c = fromFacelets(facelets);
    init();
    var limits = [22, 24, 30], per = (budgetMs || 6000) / 2;
    for (var i = 0; i < limits.length; i++) {
      try {
        // lần thử cuối không giới hạn thời gian: độ dài 30 luôn tìm ra nhanh
        var r = search(c, limits[i], i === limits.length - 1 ? Infinity : Date.now() + per);
        if (r) return r;
      } catch (e) {
        if (e.code !== 'timeout') throw e;
      }
    }
    throw fail('nosol', 'Không tìm được lời giải.');
  }

  var api = { solve: solve, init: init, check: fromFacelets };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Solver = api;
})(typeof window !== 'undefined' ? window : this);
