/* Màn hình "Khối 3D để tập giải": tự xáo trộn khối trên màn hình,
   rồi xem hướng dẫn từng nước theo 8 bước bài học, có giải thích cho từng bước. */
(function () {
  'use strict';
  var C = window.Cube;
  var NAME = { U: 'vàng', D: 'trắng', F: 'xanh lá', B: 'xanh dương', R: 'cam', L: 'đỏ' };
  var PAD = ['R', 'L', 'U', 'D', 'F', 'B'];

  // Giữ lại khi rời trang (ví dụ sang xem bài học rồi quay về)
  var P = { state: C.solved(), hist: [], guide: null };

  /* Lời giải thích cho từng bước lớn: mục tiêu, vì sao làm vậy, dấu hiệu đã xong */
  var GUIDE = {
    'bong-cuc': {
      goal: 'Đưa 4 viên cạnh có màu trắng lên quanh tâm vàng, mặt trắng ngửa lên, trông như một bông cúc.',
      why: 'Đưa thẳng cạnh trắng xuống đáy cho đúng chỗ thì khó với người mới. Gom chúng lên mặt vàng trước thì chưa cần để ý màu bên hông, và tầng trên xoay tự do nên không làm hỏng gì. Ở bước này chỉ nhìn viên cạnh (viên có 2 màu), bỏ qua viên góc. Trước khi xoay một mặt bên, nhìn ô cạnh phía trên của mặt đó: nếu đã có cánh trắng thì xoay U để đưa chỗ trống tới, kẻo đánh bật cánh đã làm xong.',
      check: '4 ô cạnh quanh tâm vàng đều màu trắng.'
    },
    'chu-thap-trang': {
      goal: 'Hạ từng cánh trắng xuống đáy, vào đúng mặt có tâm cùng màu với màu bên hông của nó.',
      why: 'Mỗi viên cạnh trắng còn một màu thứ hai, và chỗ đúng của nó là ngay dưới tâm màu đó. Xoay U không đụng tới đáy, nên cứ xoay U để dóng màu bên hông với tâm cùng màu, rồi mới xoay mặt đó nửa vòng: cánh rơi thẳng xuống đúng chỗ. Các cánh đã hạ nằm ở mặt khác nên không bị ảnh hưởng.',
      check: 'Lật khối lên xem: đáy có dấu cộng trắng và mỗi cạnh trắng liền màu với tâm bên hông.'
    },
    'goc-trang': {
      goal: 'Đặt 4 viên góc có màu trắng vào 4 góc của tầng dưới để hoàn thành tầng 1.',
      why: 'Viên góc có 3 màu: trắng và hai màu bên. Chỗ của nó là góc đáy nằm giữa hai tâm mang hai màu đó. Luôn làm ở vị trí trước–phải: đưa góc lên ngay phía trên chỗ của nó rồi thả xuống. Mặt phải nhấc khe trống lên đón góc, tầng trên đưa góc vào khe, rồi mặt phải hạ khe xuống. Nhờ nhấc lên rồi hạ xuống đúng mặt đó nên dấu cộng trắng không bị phá.',
      check: 'Đáy kín màu trắng, và hàng dưới cùng của 4 mặt bên liền màu với tâm.'
    },
    'tang-hai': {
      goal: 'Đưa 4 viên cạnh không có màu vàng vào đúng chỗ ở tầng giữa.',
      why: 'Cạnh nào không có màu vàng thì thuộc về tầng giữa. Dóng màu mặt bên của nó với tâm cùng màu để tạo thành một vạch dọc, rồi nhìn màu phía trên: trùng tâm bên phải thì đưa sang phải, trùng tâm bên trái thì đưa sang trái. Công thức 8 nước có hai nửa: nửa đầu đẩy cạnh ra xa và nhấc một góc trắng lên ghép với nó, nửa sau đưa cả cặp trở về, nên tầng 1 vẫn nguyên vẹn.',
      check: 'Hai tầng dưới của cả 4 mặt bên đều liền màu.'
    },
    'chu-thap-vang': {
      goal: 'Tạo dấu cộng vàng ở mặt trên: chỉ cần 4 ô cạnh ngửa màu vàng.',
      why: 'Từ đây mọi nước đều phải giữ nguyên hai tầng dưới, nên phải dùng công thức thay vì xoay tự do. Công thức F R U R′ U′ F′ lật hai viên cạnh ở tầng trên mỗi lần làm. Mặt vàng chỉ có 4 dạng, đi theo thứ tự: dấu chấm, chữ L, vạch ngang, dấu cộng. Chỉ nhìn 4 ô cạnh trên mặt vàng, bỏ qua các ô góc. Phải cầm đúng hướng (chữ L ở góc sau–trái, vạch nằm ngang) thì công thức mới đưa sang dạng kế tiếp.',
      check: 'Mặt trên có dấu cộng vàng.'
    },
    'canh-vang': {
      goal: 'Làm cho 4 cạnh của dấu cộng vàng liền màu với tâm bên hông.',
      why: 'Đã có dấu cộng nhưng màu bên hông của các cạnh thường chưa khớp tâm. Xoay U thử thì luôn tìm được vị trí có ít nhất 2 cạnh khớp. Công thức R U R′ U R U2 R′ U đổi chỗ các cạnh tầng trên mà không lật chúng, nên dấu cộng vàng vẫn còn. Đặt hai cạnh đã khớp ở phía sau và bên phải thì chỉ cần làm một lần là cả 4 cạnh đều khớp.',
      check: 'Cả 4 mặt bên đều có vạch dọc giữa liền màu từ trên xuống dưới.'
    },
    'dat-goc-vang': {
      goal: 'Đưa 4 góc vàng về đúng vị trí, chưa cần đúng hướng.',
      why: 'Một góc được coi là đúng chỗ khi 3 màu của nó trùng với 3 tâm quanh nó, dù nó đang bị xoay lệch. Công thức U R U′ L′ U R′ U′ L giữ yên góc trước–phải–trên và cho 3 góc còn lại đổi chỗ vòng tròn, các cạnh không bị động tới. Vì thế phải cầm một góc đã đúng chỗ ở trước–phải–trên trước khi làm.',
      check: 'Cả 4 góc tầng trên đều nằm giữa đúng 3 tâm cùng màu với nó.'
    },
    'xoay-goc-vang': {
      goal: 'Xoay từng góc tại chỗ cho mặt vàng ngửa lên. Xong bước này là xong cả khối.',
      why: 'Bộ 4 nước R′ D′ R D làm 2 lần thì xoay góc trước–phải–trên tại chỗ một phần ba vòng. Trong lúc làm, hai tầng dưới trông rối tung, nhưng khi mọi góc đã ngửa vàng thì chúng tự trở lại như cũ. Có hai điều bắt buộc: luôn làm trọn bộ 4 nước, và khi chuyển sang góc khác chỉ xoay U, không xoay cả khối.',
      check: 'Cả 6 mặt đồng màu.'
    }
  };

  function render(app, h) {
    var el = h.el, stopped = false;

    var bar = el('div', 'topbar');
    var back = el('a', 'icon-btn', h.icons.back);
    back.href = '#/';
    back.onclick = h.goHome;
    back.setAttribute('aria-label', 'Về danh sách');
    bar.appendChild(back);
    bar.appendChild(el('div', 'topbar-title', 'Khối 3D để tập giải'));
    var main = el('main', 'lesson');
    bar.appendChild(h.listenButton(function () {
      var nodes = main.querySelectorAll('h1, h1 + p, .hold-text, .walk-info p'), parts = [];
      [].forEach.call(nodes, function (n) { parts.push({ text: window.Speech.plain(n.innerHTML), node: n }); });
      return parts;
    }));
    app.appendChild(bar);
    app.appendChild(main);

    /* ----- Trò chuyện với trợ lý Claude: Claude gọi các lệnh trong ctl để điều khiển màn hình ----- */
    var ctl = null; // các lệnh của chế độ đang hiện (khối / hướng dẫn)
    function waitFor(cond, ms) {
      return new Promise(function (res) {
        var t0 = Date.now();
        (function tick() {
          if (stopped || !h.alive() || cond() || Date.now() - t0 > ms) res(); else setTimeout(tick, 60);
        })();
      });
    }
    function onTool(name, inp) {
      inp = inp || {};
      if (stopped || !h.alive()) throw new Error('Người dùng đã rời màn hình này.');
      if (name === 'set_explain_style') {
        window.AI.setStyle(String(inp.style || '').trim());
        if (ctl.restyle) ctl.restyle();
        return 'Đã lưu cách giải thích mới.' + (ctl.restyle ? ' App đang soạn lại lời giải thích cho khối này.' : ' Sẽ áp dụng khi mở hướng dẫn.');
      }
      if (name === 'set_voice') {
        if (inp.on && window.Speech.problem()) throw new Error(window.Speech.problem());
        window.Speech.setOn(!!inp.on);
        if (h.paintVoice) h.paintVoice();
        return inp.on ? 'Đã bật giọng đọc.' : 'Đã tắt giọng đọc.';
      }
      if (!ctl[name]) {
        throw new Error(ctl.mode === 'cube' ? 'Lệnh này chỉ dùng trong chế độ hướng dẫn. Hiện đang ở chế độ khối: gọi start_guide trước.'
          : 'Lệnh này chỉ dùng trong chế độ khối. Hiện đang ở chế độ hướng dẫn: gọi back_to_cube trước.');
      }
      return ctl[name](inp);
    }
    if (window.AI.hasKey()) {
      main.classList.add('has-dock');
      var dock = el('form', 'chat-dock');
      var bubble = el('div', 'chat-bubble');
      bubble.hidden = true;
      var asked = el('div', 'chat-asked'), answer = el('div', 'chat-answer');
      var shut = el('button', 'chat-close', '×');
      shut.type = 'button';
      shut.setAttribute('aria-label', 'Đóng câu trả lời');
      shut.onclick = function () { bubble.hidden = true; };
      bubble.appendChild(shut); bubble.appendChild(asked); bubble.appendChild(answer);
      var row = el('div', 'chat-row');
      var box = el('input');
      box.type = 'text';
      box.autocomplete = 'off';
      box.placeholder = 'Nói với Claude: “xáo trộn đi”, “tới bước 3”…';
      box.setAttribute('aria-label', 'Nói với trợ lý Claude');
      var send = el('button', 'chat-send', 'Gửi');
      send.type = 'submit';
      row.appendChild(box); row.appendChild(send);
      dock.appendChild(bubble); dock.appendChild(row);
      app.appendChild(dock);
      var sending = false;
      dock.onsubmit = function (e) {
        e.preventDefault();
        var text = box.value.trim();
        if (sending || !text) return;
        sending = true; send.disabled = true;
        box.value = '';
        box.blur(); // hạ bàn phím để nhìn thấy khối
        if (!P.chat || P.chat.length > 30) P.chat = []; // lịch sử dài quá thì bắt đầu lại
        P.chat.push({ role: 'user', content: '[Trạng thái app] ' + ctl.status() + '\n\n[Người dùng nói] ' + text });
        bubble.hidden = false;
        asked.textContent = text;
        answer.className = 'chat-answer busy';
        answer.textContent = 'Claude đang làm…';
        window.AI.chat({ messages: P.chat, onTool: onTool }).then(function (reply) {
          answer.className = 'chat-answer';
          answer.textContent = reply;
          if (!stopped && h.alive() && window.Speech.isOn() && !window.Speech.problem()) window.Speech.say([reply]);
        }, function (e) {
          answer.className = 'chat-answer err';
          answer.textContent = window.AI.explainError(e);
        }).then(function () { sending = false; send.disabled = false; });
      };
    }

    if (P.guide) renderGuide(); else renderCube();
    return function () { stopped = true; };

    /* ----- Khối 3D: tự xoay, tự xáo trộn ----- */
    function renderCube(autoScramble) {
      window.appBack(); // đổi chế độ thì thoát toàn màn hình
      main.innerHTML = '';
      main.appendChild(el('h1', null, 'Xáo trộn khối'));
      main.appendChild(el('p', null, 'Bấm các nút bên dưới để tự xoay từng mặt, hoặc để app xáo trộn ngẫu nhiên. ' +
        'Khi khối đã rối, bấm <b>Hướng dẫn giải khối này</b>. Vuốt ngang trên hình để xoay góc nhìn.'));

      var card = el('div', 'player card');
      var size = h.bigSize();
      var stage = el('div', 'stage big');
      var cv = el('canvas', 'cube drag');
      cv.style.width = cv.style.height = size + 'px';
      stage.appendChild(cv);
      var flip = el('button', 'flip', h.icons.flip);
      flip.type = 'button';
      flip.setAttribute('aria-label', 'Đổi góc nhìn trên/dưới');
      stage.appendChild(flip);
      card.appendChild(stage);

      var yaw = -32, pitch = 26, turn = null, busy = false, queue = [];
      function draw() { C.drawCube(cv, P.state, { size: size, yaw: yaw, pitch: pitch, turn: turn }); }
      h.fullButton(card, stage, size, function (n) {
        size = n;
        cv.style.width = cv.style.height = n + 'px';
        draw();
      });

      var pad = el('div', 'pad');
      ['', "'"].forEach(function (suf) {
        PAD.forEach(function (f) {
          var b = el('button', null, f + (suf ? '′' : ''));
          b.type = 'button';
          b.setAttribute('aria-label', window.describeMove(f + suf));
          b.onclick = function () { push(f + suf, false); };
          pad.appendChild(b);
        });
      });
      card.appendChild(pad);
      card.appendChild(el('p', 'muted', 'Hàng trên xoay theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó, hàng dưới (có dấu ′) xoay ngược lại.'));
      main.appendChild(card);

      var hist = el('div', 'hist');
      main.appendChild(hist);

      var actions = el('div', 'prac-actions');
      var bMix = el('button', 'big-btn', 'Xáo trộn ngẫu nhiên');
      bMix.type = 'button';
      var bGo = el('button', 'big-btn primary', 'Hướng dẫn giải khối này');
      bGo.type = 'button';
      actions.appendChild(bMix);
      actions.appendChild(bGo);
      main.appendChild(actions);
      var bReset = el('button', 'link-btn', 'Đặt lại khối đã giải xong');
      bReset.type = 'button';
      main.appendChild(bReset);
      var err = el('div');
      main.appendChild(err);

      function update() {
        var solved = C.isSolved(P.state);
        bGo.disabled = solved;
        if (solved) { P.hist = []; hist.innerHTML = 'Khối đang ở trạng thái đã giải xong. Hãy xáo trộn nó trước.'; }
        else hist.innerHTML = 'Đã xoay ' + P.hist.length + ' nước: <b>' + P.hist.join(' ').replace(/'/g, '′') + '</b>';
      }

      function push(label, fast) {
        queue.push({ mv: C.parse(label)[0], fast: fast });
        if (!busy) run();
      }
      function run() {
        var q = queue.shift();
        if (!q) { busy = false; return; }
        busy = true;
        var mv = q.mv, total = mv.dir * mv.turns * Math.PI / 2;
        var dur = (q.fast ? 110 : 240) * (mv.turns === 2 ? 1.4 : 1), t0 = null;
        function frame(ts) {
          if (stopped || !h.alive()) return;
          if (t0 === null) t0 = ts;
          var t = Math.min(1, (ts - t0) / dur);
          turn = { axis: mv.axis, layers: mv.layers, angle: total * (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) };
          draw();
          if (t < 1) { requestAnimationFrame(frame); return; }
          C.applyMove(P.state, mv);
          turn = null;
          P.hist = window.Lbl.simplify(P.hist.concat(mv.label).join(' ')).split(' ').filter(Boolean);
          draw(); update();
          run();
        }
        requestAnimationFrame(frame);
      }

      function scramble() {
        var last = -1, n = 20;
        while (n--) {
          var i, f;
          // PAD xếp theo cặp mặt đối nhau (R L, U D, F B): không lấy hai nước liền nhau cùng trục
          do { i = Math.floor(Math.random() * 6); } while ((i >> 1) === last);
          last = i >> 1;
          f = PAD[i];
          push(f + ['', "'", '2'][Math.floor(Math.random() * 3)], true);
        }
      }

      bMix.onclick = function () { if (!queue.length) scramble(); };
      bReset.onclick = function () {
        if (busy) return;
        P.state = C.solved(); P.hist = [];
        draw(); update();
      };
      bGo.onclick = function () {
        if (busy || C.isSolved(P.state)) return;
        try {
          var start = C.clone(P.state);
          P.guide = { start: start, lbl: window.Lbl.solve(start, function (k) { return NAME[k] || k; }), at: 0 };
        } catch (e) {
          P.guide = null;
          err.className = 'note warn';
          err.innerHTML = '<span class="note-tag">Lỗi</span>Chưa tìm được lời giải cho trạng thái này. Hãy xáo trộn lại rồi thử lần nữa.';
          return;
        }
        renderGuide();
        window.scrollTo(0, 0);
      };
      flip.onclick = function () { pitch = -pitch; if (!busy) draw(); };

      // Vuốt ngang để xoay góc nhìn
      var drag = null;
      cv.addEventListener('pointerdown', function (e) {
        drag = { x: e.clientX, yaw: yaw };
        try { cv.setPointerCapture(e.pointerId); } catch (x) { /* bỏ qua */ }
      });
      cv.addEventListener('pointermove', function (e) {
        if (!drag) return;
        yaw = drag.yaw + (e.clientX - drag.x) * 0.6;
        if (!busy) draw();
      });
      cv.addEventListener('pointerup', function () { drag = null; });
      cv.addEventListener('pointercancel', function () { drag = null; });

      function idle() { return !busy && !queue.length; }
      function cubeStatus() {
        return 'Chế độ khối. ' + (C.isSolved(P.state) ? 'Khối đang ở trạng thái đã giải xong.'
          : 'Khối đang rối. Các nước đã xoay tính từ khối đã giải: ' + P.hist.join(' ') + '.');
      }
      ctl = {
        mode: 'cube',
        status: cubeStatus,
        turn_faces: function (inp) {
          var toks = String(inp.moves || '').replace(/[′’]/g, "'").trim().split(/\s+/).filter(Boolean);
          if (!toks.length || toks.length > 40) throw new Error('Cần từ 1 đến 40 nước xoay.');
          toks.forEach(function (t) { if (!/^[RLUDFB](2|')?$/.test(t)) throw new Error('Nước xoay không hợp lệ: ' + t + '. Chỉ dùng R L U D F B, có thể kèm dấu nháy hoặc số 2.'); });
          return waitFor(idle, 20000).then(function () {
            toks.forEach(function (t) { push(t, false); });
            return waitFor(idle, 30000);
          }).then(function () { return 'Đã xoay ' + toks.join(' ') + '. ' + ctl.status(); });
        },
        scramble: function () {
          return waitFor(idle, 20000).then(function () { scramble(); return waitFor(idle, 30000); })
            .then(function () { return 'Đã xáo trộn. ' + ctl.status(); });
        },
        reset_cube: function () {
          return waitFor(idle, 20000).then(function () { bReset.onclick(); return 'Đã đặt lại. ' + ctl.status(); });
        },
        start_guide: function () {
          return waitFor(idle, 20000).then(function () {
            if (C.isSolved(P.state)) throw new Error('Khối đang ở trạng thái đã giải xong, chưa có gì để hướng dẫn. Hãy xáo trộn trước.');
            bGo.onclick();
            if (!P.guide) throw new Error('App chưa tìm được lời giải cho trạng thái này.');
            return 'Đã mở hướng dẫn. ' + ctl.status();
          });
        }
      };

      draw(); update();
      if (autoScramble) scramble();
    }

    /* ----- Hướng dẫn giải từng nước ----- */
    function renderGuide() {
      window.appBack(); // đổi chế độ thì thoát toàn màn hình
      main.innerHTML = '';
      var G = P.guide, lbl = G.lbl;
      main.appendChild(el('h1', null, 'Hướng dẫn giải từng nước'));
      main.appendChild(el('p', null, 'Lời giải cho đúng khối bạn vừa xáo trộn: <b>' + lbl.total + ' nước</b>, đi lần lượt qua 8 bước của bài học. ' +
        'Bấm <b>▶</b> để app tự chạy, hoặc bấm nút tiến để xem từng nước một. Mỗi <b>việc</b> có ghi chú riêng, ' +
        'và bên dưới hình là lời giải thích của bước đang làm.'));

      var hold = el('div', 'goal card');
      var cv = el('canvas', 'cube');
      cv.style.width = cv.style.height = '120px';
      C.drawCube(cv, G.start, { size: 120 });
      hold.appendChild(cv);
      hold.appendChild(el('div', 'hold-text', '<span class="note-tag">Cách cầm khối</span>Tâm vàng ở trên, tâm trắng ở dưới, tâm xanh lá hướng về phía bạn. ' +
        'Khi gặp ký hiệu <b>y</b>, bạn xoay cả khối sang mặt khác, tâm vàng vẫn ở trên (không tính vào số nước).'));
      main.appendChild(hold);

      var aiStatus = el('div', 'ai-status');
      main.appendChild(aiStatus);

      var groups = [], segs = [], skipped = [], metas = [];
      lbl.steps.forEach(function (st, n) {
        var info = null;
        (window.STEPS || []).forEach(function (x) { if (x.id === st.id) info = x; });
        var title = info ? info.title : st.id;
        if (!st.segs.length) { skipped.push('bước ' + (n + 1) + ' (' + title + ')'); return; }
        var g = GUIDE[st.id], gi = groups.length;
        groups.push({
          line: '<span class="step-num">Bước ' + (n + 1) + '/8</span> <b>' + title + '</b> · ' + st.count + ' nước · ' +
            '<a class="inline-link" href="#/' + st.id + '">Xem bài học</a>',
          html: (skipped.length ? '<div class="note tip"><span class="note-tag">May mắn</span>Trên khối này ' + skipped.join(', ') +
              ' đã đúng sẵn nên được bỏ qua.</div>' : '') +
            '<h3>Giải thích bước ' + (n + 1) + ': ' + title + '</h3>' +
            '<p><b>Mục tiêu.</b> ' + g.goal + '</p>' +
            '<p><b>Vì sao làm vậy.</b> ' + g.why + '</p>' +
            '<p><b>Xong bước này khi.</b> ' + g.check + '</p>',
          speak: 'Bước ' + (n + 1) + '. ' + title + '. Mục tiêu: ' + g.goal + ' ' + g.why
        });
        skipped = [];
        var meta = { id: st.id, no: n + 1, title: title, guide: g, group: groups[gi], html: groups[gi].html, speak: groups[gi].speak, segs: [] };
        st.segs.forEach(function (s, k) {
          var seg = { note: s.note, alg: s.alg, group: gi, tag: 'Việc ' + (k + 1) + '/' + st.segs.length, orig: s.note };
          segs.push(seg);
          meta.segs.push(seg);
        });
        metas.push(meta);
      });

      var playerEl = h.player({
        segments: segs, groups: groups, walk: true, state: G.start,
        startAt: G.at, onIndex: function (i) { G.at = i; },
        doneNote: '<span class="note-tag">Xong</span>Khối đã giải xong, cả 6 mặt đồng màu. Bạn có thể bấm lùi để xem lại, hoặc xáo trộn một khối mới để tập tiếp.'
      }, h.gen);
      main.appendChild(playerEl);

      /* --- Lời giải thích do Claude soạn (nếu người dùng đã nhập khoá API) --- */
      function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
      // Ghép lời của Claude vào bước lớn và từng việc; phần nào thiếu thì giữ lời có sẵn
      function applyAi(m, d) {
        if (d.intro) {
          m.group.html = '<div class="ai-box"><span class="note-tag">Claude giải thích</span><p>' + esc(d.intro) + '</p></div>' + m.html;
          m.group.speak = 'Bước ' + m.no + '. ' + m.title + '. ' + d.intro;
        }
        m.segs.forEach(function (seg, k) {
          var t = d.tasks[k];
          if (!t) return;
          seg.say = t;
          seg.note = esc(t) + '<small class="seg-orig">' + seg.orig + '</small>';
        });
      }
      function setStatus(html, cls) {
        aiStatus.className = 'ai-status' + (cls ? ' ' + cls : '');
        aiStatus.innerHTML = html;
      }
      function here() { return !stopped && h.alive() && P.guide === G; }
      var aiRun = 0; // mỗi lần soạn lại thì bỏ lượt soạn cũ
      function runAi() {
        var my = ++aiRun;
        var todo = metas.filter(function (m) { return !G.ai[m.id]; });
        function next() {
          if (!here() || my !== aiRun) return;
          var m = todo.shift();
          if (!m) { setStatus('<b>Claude</b> đã soạn xong lời giải thích riêng cho khối này.', 'ok'); return; }
          setStatus('<b>Claude</b> đang soạn lời giải thích cho bước ' + m.no + '… Bạn cứ bắt đầu, lời mới sẽ tự hiện ra.', 'busy');
          window.AI.explain({
            no: m.no, title: m.title, goal: m.guide.goal, why: m.guide.why,
            tasks: m.segs.map(function (s) { return { note: window.Speech.plain(s.orig), alg: s.alg }; })
          }).then(function (d) {
            if (!here() || my !== aiRun) return;
            G.ai[m.id] = d;
            applyAi(m, d);
            playerEl.refreshText();
            next();
          }, function (e) {
            if (!here() || my !== aiRun) return;
            setStatus(window.AI.explainError(e) + ' App đang dùng lời giải thích có sẵn. ', 'err');
            var retry = el('button', 'link-btn', 'Thử lại');
            retry.type = 'button';
            retry.onclick = runAi;
            aiStatus.appendChild(retry);
          });
        }
        next();
      }
      G.ai = G.ai || {};
      metas.forEach(function (m) { if (G.ai[m.id]) applyAi(m, G.ai[m.id]); });
      playerEl.refreshText();
      if (window.AI.hasKey()) runAi();
      else setStatus('Muốn nghe giải thích dễ hiểu hơn, soạn riêng cho khối này? <a class="inline-link" href="#/tro-ly">Bật trợ lý Claude</a>');

      main.appendChild(el('div', 'note tip', '<span class="note-tag">Mẹo</span>Muốn làm theo trên khối thật, hãy xáo trộn khối thật đúng theo các nước đã ghi ở màn hình trước ' +
        '(bắt đầu từ khối đã giải, vàng ở trên, xanh lá phía trước). Nếu xoay nhầm, bấm ◀ để lùi lại.'));

      var nav = el('div', 'nav');
      var b1 = el('button', 'nav-btn', '‹ Về khối 3D');
      b1.type = 'button';
      b1.onclick = function () {
        window.Speech.stop();
        P.guide = null;
        renderCube(false);
        window.scrollTo(0, 0);
      };
      var b2 = el('button', 'nav-btn primary', 'Xáo trộn khối mới');
      b2.type = 'button';
      b2.onclick = function () {
        window.Speech.stop();
        P.guide = null; P.state = C.solved(); P.hist = [];
        renderCube(true);
        window.scrollTo(0, 0);
      };
      nav.appendChild(b1); nav.appendChild(b2);
      main.appendChild(nav);

      var pc = playerEl.ctl;
      function calm() { pc.pause(); return waitFor(function () { return !pc.info().busy; }, 5000); }
      function guideStatus() {
        var i = pc.info();
        var all = metas.map(function (m) { return 'bước ' + m.no + ' ' + m.title + ' (' + m.segs.length + ' việc)'; }).join('; ');
        var s = 'Chế độ hướng dẫn. Lời giải có ' + i.total + ' nước, gồm: ' + all + '. Bước nào không có trong danh sách là đã đúng sẵn nên được bỏ qua. ';
        if (i.idx >= i.total) s += 'Đã chạy hết, khối đã giải xong.';
        else {
          var seg = segs[i.seg], m = metas[seg.group];
          s += 'Đã xoay ' + i.idx + ' nước. Đang ở bước ' + m.no + '/8 (' + m.title + '), việc ' + (m.segs.indexOf(seg) + 1) + '/' + m.segs.length +
            ': ' + window.Speech.plain(seg.orig) + ' Các nước của việc này: ' + seg.alg + '.' + (i.playing ? ' App đang tự chạy.' : '');
        }
        if (window.AI.getStyle()) s += ' Cách giải thích người dùng đã dặn: ' + window.AI.getStyle();
        return s;
      }
      ctl = {
        mode: 'guide',
        status: guideStatus,
        back_to_cube: function () {
          return calm().then(function () { b1.onclick(); return 'Đã về chế độ khối. ' + ctl.status(); });
        },
        guide_step: function (inp) {
          var n = parseInt(inp.count, 10);
          if (!n) throw new Error('count phải là số nguyên khác 0.');
          return calm().then(function () {
            var i = pc.info();
            if (n < 0 || n > 12) { pc.seek(i.idx + n); return null; } // lùi hoặc đi xa thì nhảy thẳng
            return Promise.race([new Promise(function (res) { pc.step(n, res); }), waitFor(function () { return false; }, 120000)]);
          }).then(function () { return ctl.status(); });
        },
        guide_goto: function (inp) {
          var m = null, k = Math.max(1, parseInt(inp.task, 10) || 1);
          metas.forEach(function (x) { if (x.no === parseInt(inp.step, 10)) m = x; });
          if (!m) throw new Error('Bước ' + inp.step + ' không có trong lời giải này (đã đúng sẵn hoặc số bước không hợp lệ).');
          if (k > m.segs.length) throw new Error('Bước ' + m.no + ' chỉ có ' + m.segs.length + ' việc.');
          return calm().then(function () {
            pc.seek(pc.segIndex(segs.indexOf(m.segs[k - 1])));
            return ctl.status();
          });
        },
        guide_autoplay: function (inp) {
          if (inp.on) pc.play(); else pc.pause();
          return inp.on ? 'App đang tự chạy các nước.' : 'Đã dừng tự chạy. ' + ctl.status();
        },
        restyle: function () { // soạn lại lời giải thích theo cách mới
          G.ai = {};
          metas.forEach(function (m) {
            m.group.html = m.html; m.group.speak = m.speak;
            m.segs.forEach(function (seg) { seg.note = seg.orig; delete seg.say; });
          });
          playerEl.refreshText();
          runAi();
        }
      };
    }
  }

  window.Practice = { render: render };
})();
