(function () {
  'use strict';
  var C = window.Cube, STEPS = window.STEPS, MASKS = window.MASKS, describe = window.describeMove;
  var app = document.getElementById('app');
  var gen = 0; // tăng mỗi lần đổi trang để dừng các animation cũ

  var ICON = {
    reset: '<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M17 5v14L6 12z"/></svg>',
    play: '<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M7 5v14l11-7z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    camera: '<svg viewBox="0 0 24 24"><path d="M9 4l-1.6 2H4.5A2.5 2.5 0 0 0 2 8.500v9A2.500 2.500 0 0 0 4.500 20h15a2.500 2.500 0 0 0 2.500-2.500v-9A2.500 2.500 0 0 0 19.500 6h-2.900L15 4zm3 4.500a4.250 4.250 0 1 1 0 8.500 4.250 4.250 0 0 1 0-8.500zm0 2a2.250 2.250 0 1 0 0 4.500 2.250 2.250 0 0 0 0-4.500z"/></svg>',
    sound: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 8.500a5 5 0 0 1 0 7M18.500 6a8.500 8.500 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.500 9.500l5 5M21.500 9.500l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    stop: '<svg viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>',
    cube: '<svg viewBox="0 0 24 24"><path d="M12 2.500l8.500 4.750v9.500L12 21.500l-8.500-4.750v-9.500z" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linejoin="round"/><path d="M3.500 7.250L12 12l8.500-4.750M12 12v9.500" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linejoin="round"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 2.500l2.200 6.300 6.300 2.200-6.300 2.200L12 19.500l-2.200-6.300L3.500 11l6.300-2.200zM19 16l.900 2.100L22 19l-2.100.900L19 22l-.900-2.100L16 19l2.100-.900z"/></svg>',
    flip: '<svg viewBox="0 0 24 24"><path d="M12 3l4 5h-3v8h3l-4 5-4-5h3V8H8z"/></svg>'
  };

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function build(spec) {
    return C.apply(C.solved(MASKS[spec.mask || 'all']), spec.setup || '');
  }

  function cubeCanvas(state, size, view) {
    var cv = el('canvas', 'cube');
    cv.style.width = cv.style.height = size + 'px';
    C.drawCube(cv, state, { size: size, yaw: view && view.yaw, pitch: view && view.pitch });
    return cv;
  }

  /* Cỡ hình lớn: kín bề ngang, nhưng chừa chỗ cho ghi chú và nút bấm bên dưới */
  function bigSize() {
    return Math.round(Math.max(220, Math.min(window.innerWidth, 560, window.innerHeight * 0.62)));
  }

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- Tiến độ ---------- */
  function loadDone() {
    try { return JSON.parse(localStorage.getItem('rubik.done') || '[]'); } catch (e) { return []; }
  }
  function saveDone(a) {
    try { localStorage.setItem('rubik.done', JSON.stringify(a)); } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Lời đọc ---------- */
  var Sp = window.Speech, toastTimer = null;
  function toast(msg) {
    var t = document.querySelector('.toast') || document.body.appendChild(el('div', 'toast'));
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 6000);
  }
  /* Nút bật/tắt lời đọc từng nước xoay; mọi nút trên trang đổi theo cùng lúc */
  function paintVoice() {
    var on = Sp.isOn();
    [].forEach.call(document.querySelectorAll('.voice'), function (b) {
      b.innerHTML = on ? ICON.sound : ICON.mute;
      b.classList.toggle('on', on);
      b.setAttribute('aria-label', on ? 'Tắt lời đọc' : 'Bật lời đọc');
    });
  }
  function voiceButton() {
    var b = el('button', 'voice', Sp.isOn() ? ICON.sound : ICON.mute);
    b.type = 'button';
    b.classList.toggle('on', Sp.isOn());
    b.setAttribute('aria-label', Sp.isOn() ? 'Tắt lời đọc' : 'Bật lời đọc');
    b.onclick = function () {
      var on = !Sp.isOn();
      if (on && Sp.problem()) { toast(Sp.problem()); return; }
      Sp.setOn(on);
      paintVoice();
      toast(on ? 'Đã bật lời đọc từng nước xoay' : 'Đã tắt lời đọc');
    };
    return b;
  }
  /* Nút "Nghe" đọc lần lượt danh sách câu; parts = [{text, node}] để tô sáng đoạn đang đọc */
  function listenButton(getParts) {
    var b = el('button', 'listen'), reading = false, lit = null;
    b.type = 'button';
    function paint() { b.innerHTML = (reading ? ICON.stop : ICON.sound) + '<span>' + (reading ? 'Dừng' : 'Nghe') + '</span>'; }
    function unlight() { if (lit) lit.classList.remove('reading'); lit = null; }
    b.onclick = function () {
      if (reading) { Sp.stop(); return; }
      if (Sp.problem()) { toast(Sp.problem()); return; }
      var parts = getParts();
      reading = true; paint();
      Sp.say(parts.map(function (p) { return p.text; }), function () {
        reading = false; unlight(); paint();
      }, function (i) {
        unlight();
        lit = parts[i].node || null;
        if (lit) {
          lit.classList.add('reading');
          var r = lit.getBoundingClientRect();
          if (r.top < 70 || r.bottom > window.innerHeight - 20) window.scrollTo({ top: window.scrollY + r.top - 90, behavior: 'smooth' });
        }
      });
    };
    paint();
    return b;
  }

  /* ---------- Trình phát công thức ---------- */
  function player(demo, myGen) {
    var wrap = el('div', 'player card');
    if (demo.title) wrap.appendChild(el('h3', null, demo.title));
    if (demo.text) wrap.appendChild(el('p', 'muted', demo.text));

    // demo.groups = [{line, html, speak}]: các bước lớn; mỗi segment thuộc một nhóm (segment.group)
    var groups = demo.groups, groupLine = null, groupBox = null, barFill = null, shownGroup = -1;
    if (groups) {
      groupLine = el('div', 'walk-step');
      wrap.appendChild(groupLine);
      var pbar = el('div', 'bar', '<i></i>');
      barFill = pbar.firstChild;
      wrap.appendChild(pbar);
    }

    // Chế độ hướng dẫn từng nước: hình to gần kín bề ngang màn hình
    var size = demo.walk ? bigSize() : Math.max(200, Math.min(280, window.innerWidth - 72));
    var stage = el('div', demo.walk ? 'stage big' : 'stage');
    var cv = el('canvas', 'cube drag');
    cv.style.width = cv.style.height = size + 'px';
    stage.appendChild(cv);
    var flip = el('button', 'flip', ICON.flip);
    flip.type = 'button';
    flip.setAttribute('aria-label', 'Đổi góc nhìn trên/dưới');
    stage.appendChild(flip);
    stage.appendChild(voiceButton());
    wrap.appendChild(stage);

    // demo.segments = [{note, alg}]: công thức chia thành từng việc, mỗi việc có lời ghi chú riêng
    var segs = demo.segments, segOf = [], segStart = {}, noteBox = null;
    if (segs) {
      segs.forEach(function (s, n) {
        segStart[segOf.length] = true;
        C.parse(s.alg).forEach(function () { segOf.push(n); });
      });
      noteBox = el('div', 'seg-note');
      wrap.appendChild(noteBox);
    }

    var caption = el('div', 'caption');
    wrap.appendChild(caption);

    var moves = C.parse(segs ? segs.map(function (s) { return s.alg; }).join(' ') : demo.alg);
    var chips = el('div', 'chips');
    var chipEls = moves.map(function (m, i) {
      if (segs && segStart[i] && i && !demo.walk) chips.appendChild(el('span', 'chip-gap'));
      var c = el('span', 'chip', m.label.replace("'", '′'));
      chips.appendChild(c);
      return c;
    });
    wrap.appendChild(chips);

    var ctr = el('div', 'controls');
    function btn(icon, label, cls) {
      var b = el('button', cls || '', icon);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      ctr.appendChild(b);
      return b;
    }
    var bReset = btn(ICON.reset, 'Về đầu');
    var bPrev = btn(ICON.prev, 'Lùi một nước');
    var bPlay = btn(ICON.play, 'Chạy', 'primary');
    var bNext = btn(ICON.next, 'Tiến một nước');
    wrap.appendChild(ctr);
    if (groups) {
      groupBox = el('div', 'walk-info');
      wrap.appendChild(groupBox);
    }

    var base = demo.state ? C.clone(demo.state)
      : build({ mask: demo.mask, setup: demo.setup != null ? demo.setup : C.invert(demo.alg) });
    var state = C.clone(base), idx = 0, busy = false, playing = false;
    if (demo.startAt) { // mở lại đúng chỗ đang xem dở
      idx = Math.min(demo.startAt, moves.length);
      for (var k0 = 0; k0 < idx; k0++) C.applyMove(state, moves[k0]);
    }
    var yaw = demo.yaw == null ? -32 : demo.yaw, pitch = demo.pitch == null ? 26 : demo.pitch;
    var turn = null;

    function draw() { C.drawCube(cv, state, { size: size, yaw: yaw, pitch: pitch, turn: turn, colors: demo.colors }); }

    function refresh(active) {
      var now = active != null ? active : idx - 1;
      chipEls.forEach(function (c, i) {
        c.className = 'chip' + (i === now ? ' now' : (i < now ? ' done' : ''));
      });
      if (segs && moves.length) {
        var sn = segOf[active != null ? active : Math.min(idx, moves.length - 1)];
        var fin = idx >= moves.length && active == null;
        noteBox.innerHTML = fin && demo.doneNote ? demo.doneNote
          : '<span class="note-tag">' + (segs[sn].tag || 'Việc ' + (sn + 1) + '/' + segs.length) + '</span>' + segs[sn].note;
        if (demo.walk) chipEls.forEach(function (c, i) { c.hidden = segOf[i] !== sn; });
        if (groups) {
          var g = segs[sn].group;
          if (g !== shownGroup) { shownGroup = g; groupLine.innerHTML = groups[g].line; groupBox.innerHTML = groups[g].html; }
          barFill.style.width = ((active != null ? active : idx) / moves.length * 100) + '%';
        }
      }
      if (demo.onIndex && active == null) demo.onIndex(idx);
      if (now < 0) caption.textContent = 'Bấm ▶ để xem từng nước xoay';
      else caption.innerHTML = '<b>' + moves[now].label.replace("'", '′') + '</b> · ' + describe(moves[now].label) +
        (idx >= moves.length && active == null ? ' <span class="ok">✓ Xong</span>' : '');
      bPlay.innerHTML = playing ? ICON.pause : ICON.play;
      bPrev.disabled = bReset.disabled = idx <= 0 && active == null;
      bNext.disabled = idx >= moves.length;
    }

    function animate(mv, sign, done) {
      var total = mv.dir * mv.turns * Math.PI / 2 * sign;
      var dur = mv.turns === 2 ? 560 : 400, t0 = null;
      busy = true;
      function frame(ts) {
        if (myGen !== gen) return;
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur);
        turn = { axis: mv.axis, layers: mv.layers, angle: total * ease(t) };
        draw();
        if (t < 1) { requestAnimationFrame(frame); return; }
        C.applyMove(state, { axis: mv.axis, layers: mv.layers, dir: mv.dir * sign, turns: mv.turns });
        turn = null; busy = false; draw(); done();
      }
      requestAnimationFrame(frame);
    }

    // Lời đọc của nước đang xoay: khi tự chạy, chờ đọc xong mới sang nước kế
    var talk = null;
    function speakMove(label, intro) {
      if (!Sp.isOn() || Sp.problem()) { talk = null; return; }
      var t = talk = { over: false, then: null };
      var text = Sp.move(label, describe(label));
      Sp.say(intro ? intro.map(Sp.plain).concat(text) : text, function () {
        t.over = true;
        if (t.then) { var f = t.then; t.then = null; f(); }
      });
    }
    function afterTalk(fn) {
      if (talk && !talk.over) talk.then = fn; else fn();
    }

    function forward(cb) {
      if (busy || idx >= moves.length) return;
      refresh(idx);
      var intro = null, sn = segOf[idx];
      if (segs && segStart[idx]) {
        intro = [segs[sn].say || segs[sn].note]; // say: lời do Claude soạn (nếu có)
        // sang bước lớn mới thì đọc lời giải thích của bước đó trước
        if (groups && (sn === 0 || segs[sn - 1].group !== segs[sn].group)) intro.unshift(groups[segs[sn].group].speak);
      }
      speakMove(moves[idx].label, intro);
      animate(moves[idx], 1, function () { idx++; refresh(); if (cb) cb(); });
    }
    function backward() {
      if (busy || idx <= 0) return;
      Sp.stop();
      animate(moves[idx - 1], -1, function () { idx--; refresh(); });
    }
    function reset() {
      if (busy) return;
      Sp.stop();
      state = C.clone(base); idx = 0; draw(); refresh();
    }
    function loop() {
      if (!playing || myGen !== gen) return;
      if (idx >= moves.length) { playing = false; refresh(); return; }
      // sang việc mới thì dừng lâu hơn một chút để kịp đọc ghi chú
      forward(function () { afterTalk(function () { setTimeout(loop, segs && segStart[idx] ? 1400 : 160); }); });
    }

    bPlay.onclick = function () {
      if (playing) { playing = false; Sp.stop(); refresh(); return; }
      if (busy) return;
      if (idx >= moves.length) reset();
      playing = true; refresh(); loop();
    };
    bNext.onclick = function () { playing = false; forward(); };
    bPrev.onclick = function () { playing = false; backward(); };
    bReset.onclick = function () { playing = false; reset(); };
    flip.onclick = function () { pitch = -pitch; if (!busy) draw(); };

    // Vuốt ngang để xoay góc nhìn
    var drag = null;
    cv.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, yaw: yaw }; });
    window.addEventListener('pointermove', function (e) {
      if (!drag || myGen !== gen) return;
      yaw = drag.yaw + (e.clientX - drag.x) * 0.6;
      if (!busy) draw();
    });
    function end() { drag = null; }
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    draw(); refresh();
    // Gọi sau khi đổi nội dung của segments/groups (ví dụ lời Claude vừa về) để vẽ lại chữ
    wrap.refreshText = function () { shownGroup = -1; if (!busy) refresh(); };
    return wrap;
  }

  /* ---------- Ô ký hiệu xoay ---------- */
  function moveTile(label, myGen) {
    var mv = C.parse(label)[0], state = C.solved(), size = 92;
    var view = { yaw: label[0] === 'L' ? 32 : -32, pitch: 26 };
    var rest = mv.dir * 28 * Math.PI / 180, full = mv.dir * Math.PI / 2, busy = false;
    var tile = el('button', 'tile');
    tile.type = 'button';
    var cv = el('canvas', 'cube');
    cv.style.width = cv.style.height = size + 'px';
    tile.appendChild(cv);
    tile.appendChild(el('div', 'tile-label', label.replace("'", '′')));
    tile.appendChild(el('div', 'tile-desc', describe(label).replace(/^.*?: /, '')));

    function draw(angle) {
      C.drawCube(cv, state, { size: size, yaw: view.yaw, pitch: view.pitch, turn: { axis: mv.axis, layers: mv.layers, angle: angle } });
    }
    tile.onclick = function () {
      if (busy) return;
      busy = true;
      var t0 = null, dur = 650;
      function frame(ts) {
        if (myGen !== gen) return;
        if (t0 === null) t0 = ts;
        var t = Math.min(1, (ts - t0) / dur);
        draw(full * ease(t));
        if (t < 1) requestAnimationFrame(frame);
        else setTimeout(function () { busy = false; if (myGen === gen) draw(rest); }, 450);
      }
      requestAnimationFrame(frame);
    };
    draw(rest);
    return tile;
  }

  /* ---------- Các khối nội dung ---------- */
  function figure(node, caption) {
    var f = el('figure', 'fig');
    if (typeof node === 'string') f.innerHTML = node; else f.appendChild(node);
    if (caption) f.appendChild(el('figcaption', null, caption));
    return f;
  }

  function renderBlock(b, myGen) {
    switch (b.type) {
      case 'h': return el('h2', null, b.text);
      case 'p': return el('p', null, b.html);
      case 'tip': return el('div', 'note tip', '<span class="note-tag">Mẹo</span>' + b.html);
      case 'warn': return el('div', 'note warn', '<span class="note-tag">Lưu ý</span>' + b.html);
      case 'formula': {
        var f = el('div', 'formula card');
        f.appendChild(el('div', 'formula-alg', b.alg.replace(/'/g, '′')));
        if (b.note) f.appendChild(el('div', 'muted', b.note));
        return f;
      }
      case 'cubes': {
        var row = el('div', 'row');
        b.items.forEach(function (it) { row.appendChild(figure(cubeCanvas(build(it), 104, it), it.caption)); });
        return row;
      }
      case 'tops': {
        var r = el('div', 'row tops');
        b.items.forEach(function (it) {
          r.appendChild(figure(it.pattern ? C.topPattern(it.pattern, it.arrows) : C.topView(build(it), it.arrows), it.caption));
        });
        return r;
      }
      case 'moves': {
        var g = el('div', 'tiles');
        b.list.forEach(function (m) { g.appendChild(moveTile(m, myGen)); });
        return g;
      }
      case 'demo': return player(b, myGen);
    }
    return el('div');
  }

  /* ---------- Trang chủ ---------- */
  function renderHome() {
    var done = loadDone();
    var count = STEPS.filter(function (s) { return done.indexOf(s.id) >= 0; }).length;
    var head = el('header', 'hero');
    head.appendChild(cubeCanvas(C.apply(C.solved(), "R U R' U' F2 L D' B U2 R' F D2 L' B2"), 132));
    head.appendChild(el('h1', null, 'Giải Rubik 3×3'));
    head.appendChild(el('p', 'muted', 'Phương pháp từng tầng cho người mới bắt đầu, có hình minh họa từng nước xoay.'));
    app.appendChild(head);

    var scan = el('a', 'card step scan-entry');
    scan.href = '#/giai';
    scan.onclick = function () { fromHome = true; };
    scan.appendChild(el('span', 'scan-icon', ICON.camera));
    var st = el('div', 'step-text');
    st.appendChild(el('div', 'step-title', 'Giải khối của tôi'));
    st.appendChild(el('div', 'muted', 'Chụp 6 mặt khối Rubik của bạn, app chỉ từng nước xoay để giải.'));
    scan.appendChild(st);
    app.appendChild(scan);

    var prac = el('a', 'card step scan-entry prac-entry');
    prac.href = '#/khoi-3d';
    prac.onclick = function () { fromHome = true; };
    prac.appendChild(el('span', 'scan-icon', ICON.cube));
    var pt = el('div', 'step-text');
    pt.appendChild(el('div', 'step-title', 'Khối 3D để tập giải'));
    pt.appendChild(el('div', 'muted', 'Tự xáo trộn khối trên màn hình, app hướng dẫn từng nước theo 8 bài học và giải thích vì sao.'));
    prac.appendChild(pt);
    app.appendChild(prac);

    var ai = el('a', 'card step scan-entry ai-entry');
    ai.href = '#/tro-ly';
    ai.onclick = function () { fromHome = true; };
    ai.appendChild(el('span', 'scan-icon', ICON.spark));
    var at = el('div', 'step-text');
    at.appendChild(el('div', 'step-title', 'Trợ lý Claude'));
    at.appendChild(el('div', 'muted', window.AI.hasKey() ? 'Đang bật: Claude giải thích từng bước bằng lời dễ hiểu ở Khối 3D.'
      : 'Nhập khoá API để Claude giải thích từng bước bằng lời dễ hiểu và đọc thành tiếng.'));
    ai.appendChild(at);
    app.appendChild(ai);

    var prog = el('div', 'progress');
    prog.innerHTML = '<div class="progress-text"><span>Tiến độ</span><span>' + count + '/' + STEPS.length + ' bài</span></div>' +
      '<div class="bar"><i style="width:' + (count / STEPS.length * 100) + '%"></i></div>';
    app.appendChild(prog);

    var list = el('div', 'list');
    STEPS.forEach(function (s, i) {
      var a = el('a', 'card step' + (done.indexOf(s.id) >= 0 ? ' is-done' : ''));
      a.href = '#/' + s.id;
      a.onclick = function () { fromHome = true; };
      a.appendChild(cubeCanvas(build(s.goal), 68, s.goal));
      var t = el('div', 'step-text');
      t.appendChild(el('div', 'step-num', i === 0 ? 'Mở đầu' : 'Bước ' + i));
      t.appendChild(el('div', 'step-title', s.title));
      t.appendChild(el('div', 'muted', s.short));
      a.appendChild(t);
      a.appendChild(el('span', 'tick', ICON.check));
      list.appendChild(a);
    });
    app.appendChild(list);
  }

  /* Điều hướng giữa các bài dùng replace để nút Back của máy luôn về danh sách rồi thoát */
  var fromHome = false;
  function goHome(e) {
    e.preventDefault();
    if (fromHome) { fromHome = false; history.back(); } else location.replace('#/');
  }
  function goStep(id) {
    return function (e) { e.preventDefault(); location.replace('#/' + id); };
  }

  /* ---------- Trang bài học ---------- */
  function renderStep(i, myGen) {
    var s = STEPS[i], done = loadDone();
    var bar = el('div', 'topbar');
    var back = el('a', 'icon-btn', ICON.back);
    back.href = '#/';
    back.onclick = goHome;
    back.setAttribute('aria-label', 'Về danh sách');
    bar.appendChild(back);
    bar.appendChild(el('div', 'topbar-title', (i === 0 ? 'Mở đầu' : 'Bước ' + i + '/' + (STEPS.length - 1))));
    var parts = []; // các đoạn sẽ đọc khi bấm "Nghe"
    bar.appendChild(listenButton(function () { return parts; }));
    app.appendChild(bar);

    var main = el('main', 'lesson');
    var h1 = el('h1', null, s.title);
    main.appendChild(h1);
    parts.push({ text: (i === 0 ? '' : 'Bước ' + i + '. ') + s.title, node: h1 });
    if (i > 0) {
      var goal = el('div', 'goal card');
      goal.appendChild(cubeCanvas(build(s.goal), 150, s.goal));
      goal.appendChild(el('div', 'goal-text', '<span class="note-tag">Mục tiêu</span>' + s.short));
      main.appendChild(goal);
      parts.push({ text: 'Mục tiêu: ' + Sp.plain(s.short), node: goal });
    }
    s.blocks.forEach(function (b) {
      var node = main.appendChild(renderBlock(b, myGen)), text = '';
      switch (b.type) {
        case 'h': text = b.text; break;
        case 'p': text = Sp.plain(b.html); break;
        case 'tip': text = 'Mẹo: ' + Sp.plain(b.html); break;
        case 'warn': text = 'Lưu ý: ' + Sp.plain(b.html); break;
        case 'formula': text = 'Công thức: ' + Sp.alg(b.alg) + '. ' + (b.note ? Sp.plain(b.note) : ''); break;
        case 'demo': text = Sp.plain((b.title || '') + '. ' + (b.text || '')); break;
        case 'cubes': case 'tops':
          text = b.items.map(function (it) { return it.caption ? Sp.plain(it.caption) : ''; }).filter(Boolean).join('. ');
          break;
      }
      if (text) parts.push({ text: text, node: node });
    });

    var mark = el('button', 'mark' + (done.indexOf(s.id) >= 0 ? ' on' : ''));
    mark.type = 'button';
    function label() { mark.innerHTML = ICON.check + '<span>' + (mark.classList.contains('on') ? 'Đã học xong bài này' : 'Đánh dấu đã học xong') + '</span>'; }
    mark.onclick = function () {
      var d = loadDone(), k = d.indexOf(s.id);
      if (k >= 0) d.splice(k, 1); else d.push(s.id);
      saveDone(d);
      mark.classList.toggle('on');
      label();
    };
    label();
    main.appendChild(mark);

    var nav = el('div', 'nav');
    var p = el('a', 'nav-btn' + (i === 0 ? ' hidden' : ''), '‹ Bước trước');
    if (i > 0) { p.href = '#/' + STEPS[i - 1].id; p.onclick = goStep(STEPS[i - 1].id); }
    var last = i === STEPS.length - 1;
    var n = el('a', 'nav-btn primary', last ? 'Về danh sách' : 'Bước tiếp ›');
    n.href = last ? '#/' : '#/' + STEPS[i + 1].id;
    n.onclick = last ? goHome : goStep(STEPS[i + 1].id);
    nav.appendChild(p); nav.appendChild(n);
    main.appendChild(nav);
    app.appendChild(main);
  }

  var cleanup = null; // dọn dẹp của trang hiện tại (ví dụ tắt camera)
  function route() {
    var myGen = ++gen;
    var id = location.hash.replace(/^#\/?/, '');
    if (cleanup) { cleanup(); cleanup = null; }
    Sp.stop();
    app.innerHTML = '';
    var idx = -1;
    STEPS.forEach(function (s, i) { if (s.id === id) idx = i; });
    if (id === 'khoi-3d') cleanup = window.Practice.render(app, { el: el, icons: ICON, goHome: goHome, player: player, gen: myGen, listenButton: listenButton, bigSize: bigSize, alive: function () { return myGen === gen; } });
    else if (id === 'giai') cleanup =window.Scan.render(app, { el: el, icons: ICON, goHome: goHome, player: player, gen: myGen, listenButton: listenButton });
    else if (id === 'tro-ly') window.AI.renderSettings(app, { el: el, icons: ICON, goHome: goHome, alive: function () { return myGen === gen; } });
    else if (idx >= 0) renderStep(idx, myGen); else renderHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})();
