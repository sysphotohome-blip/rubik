/* Màn hình "Giải khối của tôi": chụp/tô màu 6 mặt rồi tìm lời giải. */
(function () {
  'use strict';
  var C = window.Cube;

  var PALETTE = [
    { k: 'W', name: 'trắng', hex: '#f8f9fa' },
    { k: 'Y', name: 'vàng', hex: '#ffd60a' },
    { k: 'R', name: 'đỏ', hex: '#d7263d' },
    { k: 'O', name: 'cam', hex: '#ff7a1a' },
    { k: 'G', name: 'xanh lá', hex: '#12a150' },
    { k: 'B', name: 'xanh dương', hex: '#1668dc' }
  ];
  var HEX = { X: '#565c66' }, NAME = {};
  PALETTE.forEach(function (p) { HEX[p.k] = p.hex; NAME[p.k] = p.name; });

  var NET = 'URFDLB';
  // Thứ tự chụp: 4 mặt bên (giữ mặt trên ở trên), rồi mặt trên, mặt dưới
  var ORDER = ['F', 'R', 'B', 'L', 'U', 'D'];
  var LABEL = { F: 'Mặt trước', R: 'Mặt phải', B: 'Mặt sau', L: 'Mặt trái', U: 'Mặt trên', D: 'Mặt dưới' };

  function emptyFaces() {
    var f = {};
    ORDER.forEach(function (k) { f[k] = [null, null, null, null, null, null, null, null, null]; });
    return f;
  }
  // Giữ lại khi người dùng rời trang rồi quay lại
  // auto: các ô do máy tự suy ra (khoá "F3"…); mode: 'lbl' = theo 8 bước bài học, 'short' = cách ngắn nhất
  var S = { faces: emptyFaces(), step: 0, brush: 'W', result: null, auto: {}, clash: false, mode: 'lbl' };

  /* Từ 4 mặt trở lên: tự điền những ô chỉ có đúng một khả năng. Tính lại từ đầu sau mỗi lần sửa. */
  function autoFill() {
    ORDER.forEach(function (f) {
      S.faces[f].forEach(function (k, i) { if (S.auto[f + i]) S.faces[f][i] = null; });
    });
    S.auto = {};
    S.clash = false;
    var full = ORDER.filter(function (f) { return S.faces[f].every(function (k) { return k; }); }).length;
    if (full < 4 || full === 6 || !window.Infer) return;
    var cells = [], i;
    for (i = 0; i < 6; i++) S.faces[NET[i]].forEach(function (k) { cells.push(k); });
    var r = window.Infer.infer(cells, PALETTE.map(function (p) { return p.k; }));
    if (!r) return;
    if (!r.count) { S.clash = true; return; }
    r.cells.forEach(function (k, n) {
      var f = NET[n / 9 | 0], idx = n % 9;
      if (k && !S.faces[f][idx]) { S.faces[f][idx] = k; S.auto[f + idx] = true; }
    });
  }

  function swatch(k) {
    return '<span class="sw" style="background:' + HEX[k] + '"></span><b>' + NAME[k] + '</b>';
  }
  function firstCentre() {
    var k = S.faces.F[4];
    return k ? 'mặt đầu tiên (tâm ' + swatch(k) + ')' : 'mặt đầu tiên';
  }
  function howTo(face) {
    switch (face) {
      case 'F': return 'Hướng một mặt bất kỳ thẳng vào camera, đặt 9 ô vào đúng lưới. Hãy nhớ mặt nào đang ở <b>phía trên</b>: giữ nó ở trên trong 4 lần chụp đầu.';
      case 'R': return 'Giữ mặt trên ở trên, xoay cả khối để <b>mặt bên phải</b> quay ra phía camera.';
      case 'B':
      case 'L': return 'Xoay tiếp cả khối theo đúng chiều vừa rồi thêm một lần nữa (mặt trên vẫn ở trên).';
      case 'U': return 'Xoay thêm một lần nữa để về lại ' + firstCentre() + '. Sau đó lật khối để <b>mặt trên</b> hướng vào camera, mặt đầu tiên chúc xuống dưới.';
      default: return 'Trở về ' + firstCentre() + '. Sau đó lật khối theo chiều ngược lại để <b>mặt dưới</b> hướng vào camera, mặt đầu tiên hướng lên trên.';
    }
  }

  /* ---------- Nhận màu ---------- */
  function classify(r, g, b) {
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var v = max / 255, s = max ? d / max : 0, h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
      if (h < 0) h += 360;
    }
    if (s < 0.18 || (s < 0.3 && v > 0.45)) return 'W';
    if (h < 10 || h >= 335) return 'R';
    if (h < 38) return 'O';
    if (h < 75) return 'Y';
    if (h < 170) return 'G';
    if (h < 275) return 'B';
    return 'R';
  }

  var GRID_INSET = 0.14; // lưới chiếm phần giữa khung hình vuông (khớp với .scan-grid trong CSS)

  /* ---------- Kiểm tra + giải ---------- */
  function solveNow() {
    var centre = {}, i;
    for (i = 0; i < 6; i++) {
      var k = S.faces[NET[i]][4];
      if (centre[k]) throw new Error('Sáu ô tâm phải có sáu màu khác nhau. Hãy kiểm tra lại ô giữa của từng mặt.');
      centre[k] = NET[i];
    }
    var cells = [], letters = '';
    for (i = 0; i < 6; i++) S.faces[NET[i]].forEach(function (k) { cells.push(k); letters += centre[k]; });
    var moves = window.Solver.solve(letters);
    var res = { cells: cells, moves: moves, lbl: null, start: null };
    if (moves.length && window.Lbl) {
      try {
        res.start = window.Lbl.orient(C.fromFacelets(cells), 'Y');
        res.lbl = window.Lbl.solve(res.start, function (k) { return NAME[k]; });
      } catch (e) { res.lbl = null; } // vẫn còn cách ngắn nhất
    }
    return res;
  }

  /* ---------- Giao diện ---------- */
  function render(app, h) {
    var el = h.el, stopped = false, stream = null, timer = null;
    var video = null, sampler = null, live = null;

    function cleanup() {
      stopped = true;
      if (timer) clearInterval(timer);
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      timer = stream = null;
    }

    var bar = el('div', 'topbar');
    var back = el('a', 'icon-btn', h.icons.back);
    back.href = '#/';
    back.onclick = h.goHome;
    back.setAttribute('aria-label', 'Về danh sách');
    bar.appendChild(back);
    bar.appendChild(el('div', 'topbar-title', 'Giải khối của tôi'));
    var main = el('main', 'lesson');
    // "Nghe": đọc tiêu đề và lời hướng dẫn đang hiện (cách chụp mặt này, hoặc cách cầm khối)
    bar.appendChild(h.listenButton(function () {
      var nodes = main.querySelectorAll('h1, h1 + p, .hold-text'), parts = [];
      [].forEach.call(nodes, function (n) {
        parts.push({ text: window.Speech.plain(n.innerHTML).replace(/(\d)\/(\d)/, '$1 trên $2'), node: n });
      });
      return parts;
    }));
    app.appendChild(bar);
    app.appendChild(main);

    if (S.result) renderResult(); else renderScan();
    return cleanup;

    /* ----- Bước chụp ----- */
    function renderScan() {
      main.innerHTML = '';
      var title = el('h1');
      var how = el('p');
      main.appendChild(title);
      main.appendChild(how);

      // Camera
      var cam = el('div', 'scan-cam');
      video = el('video');
      video.setAttribute('playsinline', '');
      video.setAttribute('autoplay', '');
      video.muted = true;
      cam.appendChild(video);
      var grid = el('div', 'scan-grid');
      var dots = [];
      for (var i = 0; i < 9; i++) {
        var cell = el('div', 'scan-cell');
        var dot = el('i');
        cell.appendChild(dot);
        grid.appendChild(cell);
        dots.push(dot);
      }
      cam.appendChild(grid);
      var camMsg = el('div', 'scan-msg', 'Đang mở camera…');
      cam.appendChild(camMsg);
      main.appendChild(cam);

      var shoot = el('button', 'big-btn primary', 'Chụp mặt này');
      shoot.type = 'button';
      shoot.disabled = true;
      main.appendChild(shoot);

      // Lưới sửa màu
      var editWrap = el('div', 'card scan-edit');
      editWrap.appendChild(el('div', 'muted', 'Chọn màu rồi chạm vào ô để tô. Dùng khi máy nhận sai màu hoặc khi không có camera.'));
      var edit = el('div', 'edit-grid');
      var editCells = [];
      for (var j = 0; j < 9; j++) {
        (function (idx) {
          var b = el('button', 'edit-cell');
          b.type = 'button';
          b.onclick = function () {
            S.faces[ORDER[S.step]][idx] = S.brush;
            delete S.auto[ORDER[S.step] + idx];
            update();
          };
          edit.appendChild(b);
          editCells.push(b);
        })(j);
      }
      editWrap.appendChild(edit);
      var pal = el('div', 'palette');
      var palBtns = PALETTE.map(function (p) {
        var b = el('button', 'pal');
        b.type = 'button';
        b.style.background = p.hex;
        b.setAttribute('aria-label', 'Màu ' + p.name);
        b.onclick = function () { S.brush = p.k; update(); };
        pal.appendChild(b);
        return b;
      });
      editWrap.appendChild(pal);
      main.appendChild(editWrap);

      // Sơ đồ 6 mặt
      main.appendChild(el('h2', null, 'Sáu mặt đã nhập'));
      main.appendChild(el('p', 'muted', 'Chạm vào một mặt để xem hoặc sửa lại mặt đó.'));
      var net = el('div', 'net');
      var netFaces = {};
      ORDER.forEach(function (f) {
        var b = el('button', 'net-face net-' + f);
        b.type = 'button';
        b.setAttribute('aria-label', LABEL[f]);
        var cells = [];
        for (var k = 0; k < 9; k++) { var c = el('i'); b.appendChild(c); cells.push(c); }
        b.onclick = function () { S.step = ORDER.indexOf(f); update(); window.scrollTo(0, 0); };
        net.appendChild(b);
        netFaces[f] = { btn: b, cells: cells };
      });
      main.appendChild(net);
      var autoMsg = el('div', 'note tip');
      main.appendChild(autoMsg);

      var err = el('div', 'note warn');
      err.style.display = 'none';
      main.appendChild(err);

      var nav = el('div', 'nav');
      var prev = el('button', 'nav-btn', '‹ Mặt trước đó');
      var next = el('button', 'nav-btn primary');
      prev.type = next.type = 'button';
      nav.appendChild(prev);
      nav.appendChild(next);
      main.appendChild(nav);

      var clear = el('button', 'link-btn', 'Xoá hết, nhập lại từ đầu');
      clear.type = 'button';
      main.appendChild(clear);

      function filled(f) { return S.faces[f].every(function (k) { return k; }); }
      function allFilled() { return ORDER.every(filled); }

      function update() {
        autoFill();
        var f = ORDER[S.step], last = S.step === ORDER.length - 1, ready = allFilled();
        title.textContent = 'Mặt ' + (S.step + 1) + '/6';
        how.innerHTML = howTo(f);
        S.faces[f].forEach(function (k, idx) {
          editCells[idx].style.background = k ? HEX[k] : '';
          editCells[idx].className = 'edit-cell' + (k ? '' : ' empty') + (S.auto[f + idx] ? ' auto' : '');
        });
        var nAuto = Object.keys(S.auto).length, missing = 0;
        ORDER.forEach(function (ff) { S.faces[ff].forEach(function (k) { if (!k) missing++; }); });
        autoMsg.style.display = S.clash || nAuto ? '' : 'none';
        autoMsg.className = 'note ' + (S.clash ? 'warn' : 'tip');
        if (S.clash) {
          autoMsg.innerHTML = '<span class="note-tag">Có ô sai màu</span>Các mặt đã nhập đang mâu thuẫn nhau: không có khối Rubik nào ' +
            'khớp với chúng. Hãy so lại từng mặt trong sơ đồ với khối thật (hay nhầm nhất là đỏ với cam, và mặt bị chụp lệch hướng).';
        } else if (nAuto) {
          autoMsg.innerHTML = '<span class="note-tag">Tự điền</span>Máy đã suy ra <b>' + nAuto + ' ô</b> (có chấm tròn) từ các mặt bạn nhập. ' +
            (ready ? 'Đã đủ cả 54 ô nên <b>không cần chụp thêm</b>. Bạn nên liếc qua khối thật cho chắc rồi bấm “Tìm cách giải”.'
              : 'Còn <b>' + missing + ' ô</b> chưa thể biết chắc, bạn hãy chụp hoặc tô nốt mặt còn thiếu.');
        }
        PALETTE.forEach(function (p, idx) { palBtns[idx].className = 'pal' + (p.k === S.brush ? ' on' : ''); });
        ORDER.forEach(function (ff) {
          netFaces[ff].btn.className = 'net-face net-' + ff + (ff === f ? ' on' : '');
          S.faces[ff].forEach(function (k, idx) {
            netFaces[ff].cells[idx].style.background = k ? HEX[k] : '';
            netFaces[ff].cells[idx].className = S.auto[ff + idx] ? 'auto' : '';
          });
        });
        prev.style.visibility = S.step === 0 ? 'hidden' : '';
        next.textContent = last || ready ? 'Tìm cách giải' : 'Mặt tiếp ›';
        next.disabled = last || ready ? !ready : !filled(f);
      }

      shoot.onclick = function () {
        if (!live) return;
        var sf = ORDER[S.step];
        for (var n = 0; n < 9; n++) delete S.auto[sf + n];
        S.faces[sf] = live.slice();
        err.style.display = 'none';
        update();
      };
      prev.onclick = function () { if (S.step > 0) { S.step--; update(); window.scrollTo(0, 0); } };
      next.onclick = function () {
        if (S.step < ORDER.length - 1 && !allFilled()) { S.step++; update(); window.scrollTo(0, 0); return; }
        err.style.display = 'none';
        next.disabled = true;
        next.textContent = 'Đang tính…';
        // nhường một nhịp để nút kịp đổi chữ trước khi tính (lần đầu mất khoảng 1 giây để dựng bảng)
        setTimeout(function () {
          if (stopped) return;
          try {
            S.result = solveNow();
          } catch (e) {
            err.innerHTML = '<span class="note-tag">Chưa giải được</span>' + e.message +
              '<br>Một khối thật luôn giải được, nên nhiều khả năng có ô bị nhập sai màu, hoặc một mặt bị chụp lệch hướng. ' +
              'Hãy so lại từng mặt trong sơ đồ phía trên với khối thật.';
            err.style.display = '';
            update();
            return;
          }
          cleanup();
          stopped = false;
          renderResult();
          window.scrollTo(0, 0);
        }, 30);
      };
      clear.onclick = function () {
        S.faces = emptyFaces(); S.step = 0; S.auto = {};
        err.style.display = 'none';
        update(); window.scrollTo(0, 0);
      };

      update();
      startCamera(camMsg, shoot, dots);
    }

    function startCamera(camMsg, shoot, dots) {
      function noCam(text) {
        camMsg.textContent = text;
        camMsg.style.display = '';
        camMsg.parentNode.className = 'scan-cam off';
        shoot.style.display = 'none';
      }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        noCam('Không dùng được camera ở đây. Bạn hãy tô màu bằng tay ở lưới bên dưới.');
        return;
      }
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 720 }, height: { ideal: 720 } }
      }).then(function (st) {
        if (stopped) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
        stream = st;
        video.srcObject = st;
        var p = video.play();
        if (p && p.catch) p.catch(function () { /* sẽ tự phát khi sẵn sàng */ });
        camMsg.style.display = 'none';
        sampler = document.createElement('canvas');
        sampler.width = sampler.height = 120;
        var ctx = sampler.getContext('2d', { willReadFrequently: true });
        timer = setInterval(function () {
          var vw = video.videoWidth, vh = video.videoHeight;
          if (!vw || !vh) return;
          var m = Math.min(vw, vh), N = 120;
          ctx.drawImage(video, (vw - m) / 2, (vh - m) / 2, m, m, 0, 0, N, N);
          var out = [], cs = (1 - 2 * GRID_INSET) / 3, half = Math.round(N * cs * 0.2);
          for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) {
            var cx = Math.round((GRID_INSET + (c + 0.5) * cs) * N), cy = Math.round((GRID_INSET + (r + 0.5) * cs) * N);
            var d = ctx.getImageData(cx - half, cy - half, half * 2, half * 2).data, R = 0, G = 0, B = 0, n = d.length / 4;
            for (var i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; }
            out.push(classify(R / n, G / n, B / n));
          }
          live = out;
          out.forEach(function (k, idx) { dots[idx].style.background = HEX[k]; });
          shoot.disabled = false;
        }, 250);
      }).catch(function () {
        noCam('Không mở được camera (có thể do chưa cấp quyền). Bạn vẫn có thể tô màu bằng tay ở lưới bên dưới.');
      });
    }

    /* ----- Lời giải ----- */
    function renderResult() {
      main.innerHTML = '';
      var res = S.result, state = C.fromFacelets(res.cells);
      var fC = S.faces.F[4], uC = S.faces.U[4];

      function again(label, keep) {
        var b = el('button', keep ? 'nav-btn' : 'nav-btn primary', label);
        b.type = 'button';
        b.onclick = function () {
          S.result = null;
          if (!keep) { S.faces = emptyFaces(); S.step = 0; S.auto = {}; }
          renderScan();
          window.scrollTo(0, 0);
        };
        return b;
      }

      if (!res.moves.length) {
        main.appendChild(el('h1', null, 'Khối đã giải xong rồi'));
        main.appendChild(el('p', null, 'Cả sáu mặt bạn nhập đều đã đồng màu, không cần xoay thêm nước nào.'));
      } else if (res.lbl) {
        main.appendChild(el('h1', null, 'Lời giải cho khối của bạn'));
        var tabs = el('div', 'mode-tabs');
        [['lbl', 'Theo 8 bước bài học', res.lbl.total], ['short', 'Cách ngắn nhất', res.moves.length]].forEach(function (t) {
          var b = el('button', S.mode === t[0] ? 'on' : '', t[1] + '<small>' + t[2] + ' nước</small>');
          b.type = 'button';
          b.onclick = function () {
            if (S.mode === t[0]) return;
            window.Speech.stop();
            S.mode = t[0];
            renderResult();
          };
          tabs.appendChild(b);
        });
        main.appendChild(tabs);
        if (S.mode === 'lbl') lessonView(); else shortView();
      } else {
        main.appendChild(el('h1', null, 'Lời giải: ' + res.moves.length + ' nước xoay'));
        shortView();
      }
      var nav = el('div', 'nav');
      nav.appendChild(again('‹ Sửa lại màu', true));
      nav.appendChild(again('Quét khối khác', false));
      main.appendChild(nav);

      /* Lời giải đi đúng 8 bước của bài học, mỗi bước một trình phát có ghi chú */
      function lessonView() {
        var st0 = res.start, top = C.colorAt(st0, C.FACE_N.U, 'U'), bot = C.colorAt(st0, C.FACE_N.D, 'D');
        var front = C.colorAt(st0, C.FACE_N.F, 'F');
        var hold = el('div', 'goal card');
        var cv = el('canvas', 'cube');
        cv.style.width = cv.style.height = '120px';
        C.drawCube(cv, st0, { size: 120, colors: HEX });
        hold.appendChild(cv);
        hold.appendChild(el('div', 'hold-text', '<span class="note-tag">Cách cầm khối</span>Tâm ' + swatch(top) +
          ' ở trên, tâm ' + swatch(bot) + ' ở dưới, tâm ' + swatch(front) + ' hướng về phía bạn. ' +
          'Tâm ' + NAME[top] + ' luôn ở trên cho tới khi xong.'));
        main.appendChild(hold);
        main.appendChild(el('p', 'muted', 'Lời giải đi đúng 8 bước trong bài học, nên dài hơn cách ngắn nhất nhưng bước nào bạn cũng hiểu vì sao. ' +
          'Mỗi bước chia thành từng <b>việc</b> có ghi chú; làm xong bước nào thì kéo xuống bước kế. ' +
          'Khi gặp ký hiệu <b>y</b>, bạn xoay cả khối sang mặt khác (không xoay tầng nào).'));
        res.lbl.steps.forEach(function (st, n) {
          var info = null;
          (window.STEPS || []).forEach(function (x) { if (x.id === st.id) info = x; });
          var sec = el('section', 'lbl-step');
          var head = el('div', 'lbl-head');
          head.appendChild(el('div', 'step-num', 'Bước ' + (n + 1) + ' · ' + (st.count ? st.count + ' nước' : 'đã xong sẵn')));
          head.appendChild(el('h2', null, info ? info.title : st.id));
          var link = el('a', 'inline-link', 'Xem lại bài học');
          link.href = '#/' + st.id;
          head.appendChild(link);
          sec.appendChild(head);
          if (st.count) {
            sec.appendChild(h.player({ segments: st.segs, state: st.start, colors: HEX }, h.gen));
          } else {
            sec.appendChild(el('div', 'note tip', '<span class="note-tag">May mắn</span>Trên khối của bạn bước này đã đúng sẵn, bỏ qua và làm bước kế tiếp.'));
          }
          main.appendChild(sec);
        });
        main.appendChild(el('div', 'note tip', '<span class="note-tag">Mẹo</span>Nếu xoay nhầm, bấm ◀ để lùi lại. ' +
          'Hình ở mỗi bước bắt đầu đúng từ trạng thái sau khi xong bước trước, nên bạn có thể so với khối thật để biết mình có lệch không.'));
      }

      function shortView() {
        var hold = el('div', 'goal card');
        var cv = el('canvas', 'cube');
        cv.style.width = cv.style.height = '120px';
        C.drawCube(cv, state, { size: 120, colors: HEX });
        hold.appendChild(cv);
        hold.appendChild(el('div', 'hold-text', '<span class="note-tag">Cách cầm khối</span>Tâm ' + swatch(fC) +
          ' hướng về phía bạn, tâm ' + swatch(uC) + ' ở trên. Giữ nguyên cách cầm này cho tới nước cuối cùng.'));
        main.appendChild(hold);
        main.appendChild(h.player({
          title: 'Xoay theo từng nước',
          text: 'Bấm ▶ để xem một nước, làm theo trên khối thật rồi bấm tiếp. Vuốt ngang trên hình để xoay góc nhìn.',
          alg: res.moves.join(' '),
          state: state,
          colors: HEX
        }, h.gen));
        main.appendChild(el('div', 'note tip', '<span class="note-tag">Mẹo</span>Nếu xoay nhầm, bấm ◀ để xem lại nước trước. ' +
          'Chưa quen ký hiệu R, U, F…? Xem bài <a class="inline-link" href="#/lam-quen">Làm quen</a>.'));
      }
    }
  }

  window.Scan = { render: render, classify: classify };
})();
