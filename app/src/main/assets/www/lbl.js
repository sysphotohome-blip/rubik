/* Giải khối theo đúng 8 bước của bài học (phương pháp từng tầng), có ghi chú cho từng đoạn.
   Dùng mô hình trong cube.js; màu là khoá bất kỳ, "trắng"/"vàng" được hiểu theo tâm dưới/tâm trên. */
(function (root) {
  'use strict';
  var C = root.Cube || require('./cube.js');
  var N = C.FACE_N, SIDES = ['F', 'R', 'B', 'L'];

  var SEXY = "R U R' U'";
  var MID_R = "U R U' R' U' F' U F";
  var MID_L = "U' L' U L U F U' F'";
  var OLL = "F R U R' U' F'";
  var SUNE = "R U R' U R U2 R' U";
  var NIK = "U R U' L' U R' U' L";
  var TW = "R' D' R D";
  var NIK_INV = "L' U R U' L U R' U'";
  var TW_INV = "D' R' D R";
  var STEP_IDS = ['bong-cuc', 'chu-thap-trang', 'goc-trang', 'tang-hai', 'chu-thap-vang', 'canh-vang', 'dat-goc-vang', 'xoay-goc-vang'];

  function add(a, b, c) {
    return [a[0] + b[0] + (c ? c[0] : 0), a[1] + b[1] + (c ? c[1] : 0), a[2] + b[2] + (c ? c[2] : 0)];
  }
  function turns(base, k) {
    k = ((k % 4) + 4) % 4;
    return k === 0 ? '' : (k === 1 ? base : (k === 2 ? base + '2' : base + "'"));
  }
  /* Gộp các nước liền nhau trên cùng một mặt: U U -> U2, U U' -> bỏ */
  function simplify(alg) {
    var out = [];
    alg.split(/\s+/).filter(Boolean).forEach(function (t) {
      var q = t.slice(1) === '2' ? 2 : (t.slice(1) === "'" ? 3 : 1);
      var last = out[out.length - 1];
      if (last && last.b === t[0]) {
        last.q = (last.q + q) % 4;
        if (!last.q) out.pop();
      } else out.push({ b: t[0], q: q });
    });
    return out.map(function (m) { return turns(m.b, m.q); }).join(' ');
  }

  /* Xoay cả khối để tâm "vàng" (khoá yellow) lên trên; trả về khối đã xoay */
  function orient(state, yellow) {
    var s = C.clone(state);
    var rot = { U: '', D: 'x2', F: 'x', B: "x'", R: "z'", L: 'z' };
    for (var f in rot) {
      if (C.colorAt(s, N[f], f) === yellow) { C.apply(s, rot[f]); break; }
    }
    return s;
  }

  /* state: khối với tâm vàng đã ở trên. name(k): tên màu để ghi chú.
     Trả về { steps: [{ id, start, segs: [{ note, alg }], count }], total } */
  function solve(state, name) {
    var s = C.clone(state);
    name = name || function (k) { return k; };
    var steps = [], cur = null, seg = null;

    function col(pos, face) { return C.colorAt(s, pos, face); }
    function cen(face) { return col(N[face], face); }
    var W = cen('D'), Y = cen('U');
    var nW = name(W), nY = name(Y);

    function begin(i) {
      closeSeg();
      cur = { id: STEP_IDS[i], start: C.clone(s), segs: [], count: 0 };
      steps.push(cur);
    }
    function closeSeg() {
      if (seg && cur) {
        var a = simplify(seg.raw);
        // xoay cả khối (y) không làm khối thay đổi nên không tính vào số nước
        if (a) { cur.segs.push({ note: seg.note, alg: a }); cur.count += a.split(' ').filter(function (t) { return t[0] !== 'y'; }).length; }
      }
      seg = null;
    }
    function note(text) { closeSeg(); seg = { note: text, raw: '' }; }
    function mv(alg) {
      if (!alg) return;
      C.apply(s, alg);
      seg.raw += ' ' + alg;
    }
    function after(alg, test) { // thử trên bản sao
      var keep = s;
      s = C.apply(C.clone(s), alg);
      var r = test();
      s = keep;
      return r;
    }
    function uEdge(A) { return add(N[A], N.U); }
    function dEdge(A) { return add(N[A], N.D); }
    function pair(i) { return [SIDES[i % 4], SIDES[(i + 1) % 4]]; }
    function corner(i, layer) { var p = pair(i); return add(N[p[0]], N[p[1]], N[layer]); }
    function faceOf(colour) {
      for (var i = 0; i < 4; i++) if (cen(SIDES[i]) === colour) return i;
      return -1;
    }

    /* ----- 1. Bông cúc ----- */
    begin(0);
    function petal(A) { return col(uEdge(A), 'U') === W; }
    function petals() { return SIDES.filter(petal).length; }
    function freeSlot(A) { var g = 0; while (petal(A) && g++ < 4) mv('U'); }
    var guard = 0, i, k, A, p, done;
    while (petals() < 4) {
      if (guard++ > 40) throw new Error('lbl: bông cúc');
      done = false;
      for (i = 0; i < 4 && !done; i++) { // cạnh ở tầng giữa
        p = pair(i);
        var pos = add(N[p[0]], N[p[1]]), T = null;
        if (col(pos, p[0]) === W) T = p[1]; else if (col(pos, p[1]) === W) T = p[0];
        if (!T) continue;
        note('Cánh ' + nW + ' ở tầng giữa: xoay mặt bên cạnh nó để đưa nó lên quanh tâm ' + nY +
          ' (nếu chỗ đó đã có cánh ' + nW + ' thì xoay U trước để lấy chỗ trống).');
        freeSlot(T);
        mv(after(T, function () { return petal(T); }) ? T : T + "'");
        done = true;
      }
      for (i = 0; i < 4 && !done; i++) { // ở đáy, trắng úp xuống
        A = SIDES[i];
        if (col(dEdge(A), 'D') !== W) continue;
        note('Cánh ' + nW + ' ở đáy, mặt ' + nW + ' úp xuống: xoay U lấy chỗ trống phía trên nó, rồi xoay mặt đó nửa vòng.');
        freeSlot(A);
        mv(A + '2');
        done = true;
      }
      for (i = 0; i < 4 && !done; i++) { // ở tầng trên, trắng quay ra ngoài
        A = SIDES[i];
        if (col(uEdge(A), A) !== W) continue;
        note('Cánh ' + nW + ' ở tầng trên nhưng mặt ' + nW + ' quay ra ngoài: xoay mặt đó để đưa cạnh về tầng giữa.');
        mv(A);
        done = true;
      }
      for (i = 0; i < 4 && !done; i++) { // ở đáy, trắng quay ra ngoài
        A = SIDES[i];
        if (col(dEdge(A), A) !== W) continue;
        note('Cánh ' + nW + ' ở đáy, mặt ' + nW + ' quay ra ngoài: xoay U lấy chỗ trống, rồi xoay mặt đó để đưa cạnh về tầng giữa.');
        freeSlot(A);
        mv(A);
        done = true;
      }
      if (!done) throw new Error('lbl: không tìm thấy cạnh');
    }

    /* ----- 2. Chữ thập trắng ----- */
    begin(1);
    function crossMatch() {
      for (var j = 0; j < 4; j++) if (petal(SIDES[j]) && col(uEdge(SIDES[j]), SIDES[j]) === cen(SIDES[j])) return SIDES[j];
      return null;
    }
    guard = 0;
    while (petals() > 0) {
      if (guard++ > 8) throw new Error('lbl: chữ thập');
      for (k = 0; k < 4; k++) if (after(turns('U', k) || "U U'", crossMatch)) break;
      note('Xoay U cho tới khi màu bên hông của một cánh ' + nW + ' nằm ngay trên tâm cùng màu, rồi xoay mặt đó nửa vòng để đưa cánh xuống đáy.');
      mv(turns('U', k));
      A = crossMatch();
      seg.note = 'Cánh ' + nW + '–' + name(cen(A)) + ': xoay U cho màu ' + name(cen(A)) + ' nằm ngay trên tâm ' + name(cen(A)) +
        ', rồi xoay mặt đó nửa vòng để đưa cánh xuống đáy.';
      mv(A + '2');
    }

    /* ----- 3. Góc trắng ----- */
    begin(2);
    function slotDone(i) {
      var q = pair(i), c = corner(i, 'D');
      return col(c, 'D') === W && col(c, q[0]) === cen(q[0]) && col(c, q[1]) === cen(q[1]);
    }
    function cornerCols(i, layer) {
      var q = pair(i), c = corner(i, layer);
      return [col(c, layer), col(c, q[0]), col(c, q[1])];
    }
    function slotFor(cols, skip) { // khe giữa hai tâm trùng với hai màu còn lại của viên góc
      var rest = cols.filter(function (x) { return x !== skip; });
      for (var j = 0; j < 4; j++) {
        var q = pair(j), a = cen(q[0]), b = cen(q[1]);
        if ((a === rest[0] && b === rest[1]) || (a === rest[1] && b === rest[0])) return j;
      }
      return -1;
    }
    // Ba cách thả góc (đang ở trước–phải–trên) xuống chỗ ngay bên dưới, tuỳ mặt trắng quay hướng nào.
    // Kết quả giống hệt lặp R U R′ U′ 1, 5, 3 lần nhưng ngắn hơn nhiều.
    var INS = [
      ["R U R'", 'Mặt ' + nW + ' của góc quay sang phải: làm R U R′ (chính là R U R′ U′ bỏ nước cuối).'],
      ["F' U' F", 'Mặt ' + nW + ' của góc quay về phía bạn: làm F′ U′ F (bản đối xứng của R U R′, thay cho 5 lần R U R′ U′).'],
      ["R U2 R' U' R U R'", 'Mặt ' + nW + ' của góc ngửa lên trên: làm R U2 R′ U′ để mặt ' + nW + ' quay sang phải, rồi R U R′ (thay cho 3 lần R U R′ U′).']
    ];
    function crossOK() {
      return SIDES.every(function (X) { return col(dEdge(X), 'D') === W && col(dEdge(X), X) === cen(X); });
    }
    function insertion() { // góc đang ở trước–phải–trên, chỗ của nó ở ngay dưới
      var keep = [1, 2, 3].filter(slotDone);
      for (var n = 0; n < INS.length; n++) {
        if (after(INS[n][0], function () { return slotDone(0) && crossOK() && keep.every(slotDone); })) return INS[n];
      }
      return null;
    }
    guard = 0;
    while (![0, 1, 2, 3].every(slotDone)) {
      if (guard++ > 30) throw new Error('lbl: góc trắng');
      var best = null;
      for (i = 0; i < 4; i++) {
        var cc = cornerCols(i, 'U');
        if (cc.indexOf(W) < 0) continue;
        var j = slotFor(cc, W);
        if (j < 0) throw new Error('lbl: góc lạ');
        var pre = (turns('y', j) + ' ' + turns('U', i - j)).trim();
        var ins = after(pre || "U U'", insertion);
        var cost = (i === j ? 0 : 1) + (ins ? ins[0].split(' ').length : 99);
        if (!best || cost < best.cost) best = { i: i, j: j, ins: ins, cost: cost, cols: cc.filter(function (x) { return x !== W; }) };
      }
      if (best) {
        note('Góc ' + nW + '–' + name(best.cols[0]) + '–' + name(best.cols[1]) + ': cầm khối để chỗ của nó (giữa tâm ' +
          name(best.cols[0]) + ' và tâm ' + name(best.cols[1]) + ') nằm ở trước–phải, xoay U đưa góc tới ngay phía trên chỗ đó. ' +
          (best.ins ? best.ins[1] : 'Lặp R U R′ U′ tới khi góc vào đúng chỗ, mặt ' + nW + ' úp xuống.'));
        mv(turns('y', best.j));
        mv(turns('U', best.i - best.j));
        if (best.ins) mv(best.ins[0]);
        else { k = 0; while (!slotDone(0)) { if (k++ > 6) throw new Error('lbl: lặp góc'); mv(SEXY); } }
      } else {
        for (i = 0; i < 4; i++) if (!slotDone(i)) break;
        note('Còn góc ' + nW + ' nằm ở tầng dưới nhưng sai chỗ hoặc sai hướng: cầm nó ở trước–phải–dưới, làm R U R′ để đưa nó lên tầng trên.');
        mv(turns('y', i));
        mv("R U R'");
      }
    }

    /* ----- 4. Tầng hai ----- */
    begin(3);
    function midDone(i) {
      var q = pair(i), c = add(N[q[0]], N[q[1]]);
      return col(c, q[0]) === cen(q[0]) && col(c, q[1]) === cen(q[1]);
    }
    guard = 0;
    while (![0, 1, 2, 3].every(midDone)) {
      if (guard++ > 30) throw new Error('lbl: tầng hai');
      best = null;
      for (i = 0; i < 4; i++) {
        var top = col(uEdge(SIDES[i]), 'U'), side = col(uEdge(SIDES[i]), SIDES[i]);
        if (top === Y || side === Y) continue;
        var f = faceOf(side);
        if (!best || f === 0) best = { i: i, j: f, top: top, side: side };
      }
      if (best) {
        mv0('Cạnh ' + name(best.side) + '–' + name(best.top) + ' ở tầng trên (không có màu ' + nY + '). Xoay U cho màu ' + name(best.side) +
          ' nằm trên tâm ' + name(best.side) + ', cầm mặt đó về phía mình. ');
        mv(turns('y', best.j));
        mv(turns('U', best.i - best.j));
        if (col(uEdge('F'), 'U') === cen('R')) {
          seg.note += 'Màu phía trên (' + name(best.top) + ') trùng tâm bên phải: dùng công thức “sang phải”.';
          mv(MID_R);
        } else {
          seg.note += 'Màu phía trên (' + name(best.top) + ') trùng tâm bên trái: dùng công thức “sang trái”.';
          mv(MID_L);
        }
      } else {
        for (i = 0; i < 4; i++) if (!midDone(i)) break;
        note('Có cạnh kẹt ở tầng giữa (sai chỗ hoặc lật ngược màu): cầm nó ở vị trí trước–phải, làm công thức “sang phải” một lần để đẩy nó lên tầng trên.');
        mv(turns('y', i));
        mv(MID_R);
      }
    }
    function mv0(text) { note(text); }

    /* ----- 5. Chữ thập vàng ----- */
    begin(4);
    function up(A) { return col(uEdge(A), 'U') === Y; }
    guard = 0;
    for (;;) {
      if (guard++ > 5) throw new Error('lbl: chữ thập vàng');
      var n = SIDES.filter(up).length;
      if (n === 4) break;
      if (n === 0) {
        note('Mặt ' + nY + ' mới có dấu chấm: làm công thức F R U R′ U′ F′ một lần để ra chữ L.');
      } else if ((up('F') && up('B')) || (up('L') && up('R'))) {
        note('Đang có vạch: xoay U cho vạch nằm ngang, rồi làm công thức F R U R′ U′ F′ một lần.');
        if (up('F')) mv('U');
      } else {
        note('Đang có chữ L: xoay U để chữ L nằm ở góc sau–trái, rồi làm công thức F R U R′ U′ F′.');
        for (k = 0; k < 4; k++) if (after(turns('U', k) || "U U'", function () { return up('B') && up('L'); })) break;
        mv(turns('U', k));
      }
      mv(OLL);
    }

    /* ----- 6. Khớp cạnh vàng ----- */
    begin(5);
    function matched() { return SIDES.map(function (X) { return col(uEdge(X), X) === cen(X); }); }
    guard = 0;
    for (;;) {
      if (guard++ > 6) throw new Error('lbl: cạnh vàng');
      var opts = [];
      for (k = 0; k < 4; k++) opts.push(after(turns('U', k) || "U U'", matched));
      var cnt = opts.map(function (m) { return m.filter(Boolean).length; });
      k = cnt.indexOf(4);
      if (k >= 0) {
        if (k) { note('Xoay U để cả 4 cạnh ' + nY + ' liền màu với tâm bên hông.'); mv(turns('U', k)); }
        break;
      }
      var adj = -1, m0 = -1;
      for (k = 0; k < 4 && adj < 0; k++) {
        if (cnt[k] !== 2) continue;
        for (i = 0; i < 4; i++) if (opts[k][i] && opts[k][(i + 1) % 4]) { adj = k; m0 = i; }
      }
      if (adj >= 0) {
        note('Xoay U để có 2 cạnh kề nhau khớp màu với tâm, cầm khối sao cho hai cạnh đó nằm ở phía sau và bên phải, rồi làm công thức R U R′ U R U2 R′ U.');
        mv(turns('U', adj));
        mv(turns('y', m0 - 1));
      } else {
        k = Math.max(0, cnt.indexOf(2));
        note('Chỉ có 2 cạnh đối diện khớp màu: làm công thức R U R′ U R U2 R′ U một lần ở hướng bất kỳ, rồi xoay U tìm lại.');
        mv(turns('U', k));
      }
      mv(SUNE);
    }

    /* ----- 7. Đặt góc vàng đúng chỗ ----- */
    begin(6);
    function inPlace(i) {
      var q = pair(i), cc = cornerCols(i, 'U');
      return cc.indexOf(Y) >= 0 && cc.indexOf(cen(q[0])) >= 0 && cc.indexOf(cen(q[1])) >= 0;
    }
    guard = 0;
    for (;;) {
      if (guard++ > 6) throw new Error('lbl: đặt góc vàng');
      var ok = [0, 1, 2, 3].filter(inPlace);
      if (ok.length === 4) break;
      if (ok.length) {
        var q = pair(ok[0]);
        note('Góc ' + nY + '–' + name(cen(q[0])) + '–' + name(cen(q[1])) + ' đã đúng chỗ: cầm nó ở trước–phải–trên rồi làm công thức U R U′ L′ U R′ U′ L (3 góc còn lại đổi chỗ vòng tròn).');
        mv(turns('y', ok[0]));
        // Nếu một lần chưa xong thì đáng lẽ phải làm 2 lần: thay bằng công thức đọc ngược, chỉ 1 lần
        if (!after(NIK, function () { return [0, 1, 2, 3].every(inPlace); }) &&
            after(NIK_INV, function () { return [0, 1, 2, 3].every(inPlace); })) {
          seg.note = 'Góc ' + nY + '–' + name(cen(q[0])) + '–' + name(cen(q[1])) + ' đã đúng chỗ: cầm nó ở trước–phải–trên. ' +
            '3 góc còn lại cần đổi chỗ theo chiều ngược, nên làm công thức đọc ngược L′ U R U′ L U R′ U′ một lần (thay cho 2 lần công thức xuôi).';
          mv(NIK_INV);
          continue;
        }
      } else {
        note('Chưa có góc nào đúng chỗ: làm công thức U R U′ L′ U R′ U′ L một lần ở hướng bất kỳ, sau đó sẽ có một góc đúng chỗ.');
      }
      mv(NIK);
    }

    /* ----- 8. Xoay góc vàng ----- */
    begin(7);
    function yUp(i) { return col(corner(i, 'U'), 'U') === Y; }
    guard = 0;
    var first = true;
    while (![0, 1, 2, 3].every(yUp)) {
      if (guard++ > 5) throw new Error('lbl: xoay góc vàng');
      for (k = 0; k < 4; k++) if (after(turns('U', k) || "U U'", function () { return !yUp(0); })) break;
      note(first
        ? 'Đưa một góc chưa ngửa mặt ' + nY + ' tới vị trí trước–phải–trên bằng U, rồi lặp R′ D′ R D (trọn bộ 4 nước) tới khi mặt ' + nY + ' của nó ngửa lên. Hai tầng dưới tạm rối là bình thường.'
        : 'Chỉ xoay U (không xoay cả khối) để đưa góc sai tiếp theo tới trước–phải–trên, rồi lại lặp R′ D′ R D tới khi mặt ' + nY + ' ngửa lên.');
      first = false;
      mv(turns('U', k));
      i = 0;
      if (after(TW + ' ' + TW, function () { return yUp(0); })) {
        seg.note += ' Góc này cần 2 lần.';
        mv(TW + ' ' + TW);
      } else {
        // đáng lẽ 4 lần R′ D′ R D: làm công thức đọc ngược 2 lần cho kết quả y hệt
        seg.note += ' Góc này đáng lẽ cần 4 lần: làm công thức đọc ngược D′ R′ D R 2 lần sẽ ra y hệt mà ngắn bằng nửa.';
        mv(TW_INV + ' ' + TW_INV);
        if (!yUp(0)) throw new Error('lbl: lặp xoay góc');
      }
    }
    for (k = 0; k < 4; k++) if (after(turns('U', k) || "U U'", function () { return col(uEdge('F'), 'F') === cen('F'); })) break;
    if (k) { note('Xoay U để tầng trên khớp với các tầng dưới. Xong!'); mv(turns('U', k)); }
    closeSeg();

    if (!C.facesUniform(s)) throw new Error('lbl: chưa giải xong');
    var total = 0;
    steps.forEach(function (st) { total += st.count; });
    return { steps: steps, total: total };
  }

  var api = { solve: solve, orient: orient, simplify: simplify, STEP_IDS: STEP_IDS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Lbl = api;
})(typeof window !== 'undefined' ? window : this);
