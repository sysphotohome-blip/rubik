/* Suy ra các ô chưa nhập từ những ô đã biết.
   Liệt kê mọi cách xếp 8 viên góc + 12 viên cạnh khớp với các ô đã nhập và giải được;
   ô nào có cùng một màu trong mọi cách xếp thì coi là chắc chắn. */
(function (root) {
  'use strict';
  // Chỉ số ô theo thứ tự mặt U R F D L B (mỗi mặt 9 ô)
  var CF = [[8, 9, 20], [6, 18, 38], [0, 36, 47], [2, 45, 11], [29, 26, 15], [27, 44, 24], [33, 53, 42], [35, 17, 51]];
  var CC = ['URF', 'UFL', 'ULB', 'UBR', 'DFR', 'DLF', 'DBL', 'DRB'];
  var EF = [[5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14]];
  var EC = ['UR', 'UF', 'UL', 'UB', 'DR', 'DF', 'DL', 'DB', 'FR', 'FL', 'BL', 'BR'];
  var NET = 'URFDLB', LIMIT = 6000;

  function parity(perm) {
    var seen = [], p = 0;
    for (var i = 0; i < perm.length; i++) {
      if (seen[i]) continue;
      var j = i, len = 0;
      while (!seen[j]) { seen[j] = true; j = perm[j]; len++; }
      p ^= (len + 1) & 1;
    }
    return p;
  }

  /* Mọi cách đặt các viên (theo chữ cái mặt) khớp với L; trả về null nếu quá nhiều */
  function enumerate(L, F, P, mod) {
    var n = F.length, size = F[0].length, out = [], perm = [], ori = [], used = [], over = false;
    function rec(pos, sum) {
      if (over) return;
      if (pos === n) {
        if (sum % mod === 0) {
          if (out.length >= LIMIT) { over = true; return; }
          out.push({ perm: perm.slice(), ori: ori.slice(), par: parity(perm) });
        }
        return;
      }
      for (var q = 0; q < n; q++) {
        if (used[q]) continue;
        for (var r = 0; r < size; r++) {
          var fit = true;
          for (var i = 0; i < size && fit; i++) {
            var known = L[F[pos][i]];
            if (known && known !== P[q][(i - r + size) % size]) fit = false;
          }
          if (!fit) continue;
          used[q] = true; perm[pos] = q; ori[pos] = r;
          rec(pos + 1, sum + r);
          used[q] = false;
        }
      }
    }
    rec(0, 0);
    return over ? null : out;
  }

  /* cells: 54 khoá màu hoặc null; colours: 6 khoá màu.
     Trả về null nếu chưa đủ dữ kiện, hoặc { count: số khối khả dĩ, cells: màu chắc chắn của từng ô (null nếu chưa rõ) } */
  function infer(cells, colours) {
    var centre = [], free = [], seen = {}, f, i;
    for (f = 0; f < 6; f++) {
      var c = cells[f * 9 + 4];
      if (c) { if (seen[c]) return null; seen[c] = true; centre[f] = c; } else free.push(f);
    }
    if (free.length > 2) return null;
    var rest = colours.filter(function (k) { return !seen[k]; });
    var tries = free.length === 2 ? [[rest[0], rest[1]], [rest[1], rest[0]]] : (free.length === 1 ? [[rest[0]]] : [[]]);

    var agree = [], count = 0;
    function vote(idx, colour) {
      if (agree[idx] === undefined) agree[idx] = colour;
      else if (agree[idx] !== colour) agree[idx] = false;
    }
    for (var t = 0; t < tries.length; t++) {
      var cen = centre.slice(), toFace = {}, toCol = {};
      free.forEach(function (ff, n) { cen[ff] = tries[t][n]; });
      for (f = 0; f < 6; f++) { toFace[cen[f]] = NET[f]; toCol[NET[f]] = cen[f]; }
      var L = cells.map(function (k) { return k ? toFace[k] : null; });
      var cs = enumerate(L, CF, CC, 3), es = enumerate(L, EF, EC, 2);
      if (!cs || !es) return null;
      for (var par = 0; par < 2; par++) {
        var cp = cs.filter(function (x) { return x.par === par; });
        var ep = es.filter(function (x) { return x.par === par; });
        if (!cp.length || !ep.length) continue;
        count += cp.length * ep.length;
        for (f = 0; f < 6; f++) vote(f * 9 + 4, cen[f]);
        tally(cp, CF, CC, toCol);
        tally(ep, EF, EC, toCol);
      }
    }
    function tally(sols, F, P, toCol) {
      var size = F[0].length;
      sols.forEach(function (s) {
        for (var pos = 0; pos < F.length; pos++) {
          for (var k = 0; k < size; k++) vote(F[pos][k], toCol[P[s.perm[pos]][(k - s.ori[pos] + size) % size]]);
        }
      });
    }
    var out = [];
    for (i = 0; i < 54; i++) out.push(agree[i] || null);
    return { count: count, cells: out };
  }

  var api = { infer: infer };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Infer = api;
})(typeof window !== 'undefined' ? window : this);
