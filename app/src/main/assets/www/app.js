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

  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  /* ---------- Tiến độ ---------- */
  function loadDone() {
    try { return JSON.parse(localStorage.getItem('rubik.done') || '[]'); } catch (e) { return []; }
  }
  function saveDone(a) {
    try { localStorage.setItem('rubik.done', JSON.stringify(a)); } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Trình phát công thức ---------- */
  function player(demo, myGen) {
    var wrap = el('div', 'player card');
    if (demo.title) wrap.appendChild(el('h3', null, demo.title));
    if (demo.text) wrap.appendChild(el('p', 'muted', demo.text));

    var size = Math.max(200, Math.min(280, window.innerWidth - 72));
    var stage = el('div', 'stage');
    var cv = el('canvas', 'cube drag');
    cv.style.width = cv.style.height = size + 'px';
    stage.appendChild(cv);
    var flip = el('button', 'flip', ICON.flip);
    flip.type = 'button';
    flip.setAttribute('aria-label', 'Đổi góc nhìn trên/dưới');
    stage.appendChild(flip);
    wrap.appendChild(stage);

    var caption = el('div', 'caption');
    wrap.appendChild(caption);

    var moves = C.parse(demo.alg);
    var chips = el('div', 'chips');
    var chipEls = moves.map(function (m) {
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

    var base = demo.state ? C.clone(demo.state)
      : build({ mask: demo.mask, setup: demo.setup != null ? demo.setup : C.invert(demo.alg) });
    var state = C.clone(base), idx = 0, busy = false, playing = false;
    var yaw = demo.yaw == null ? -32 : demo.yaw, pitch = demo.pitch == null ? 26 : demo.pitch;
    var turn = null;

    function draw() { C.drawCube(cv, state, { size: size, yaw: yaw, pitch: pitch, turn: turn, colors: demo.colors }); }

    function refresh(active) {
      var now = active != null ? active : idx - 1;
      chipEls.forEach(function (c, i) {
        c.className = 'chip' + (i === now ? ' now' : (i < now ? ' done' : ''));
      });
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

    function forward(cb) {
      if (busy || idx >= moves.length) return;
      refresh(idx);
      animate(moves[idx], 1, function () { idx++; refresh(); if (cb) cb(); });
    }
    function backward() {
      if (busy || idx <= 0) return;
      animate(moves[idx - 1], -1, function () { idx--; refresh(); });
    }
    function reset() {
      if (busy) return;
      state = C.clone(base); idx = 0; draw(); refresh();
    }
    function loop() {
      if (!playing || myGen !== gen) return;
      if (idx >= moves.length) { playing = false; refresh(); return; }
      forward(function () { setTimeout(loop, 160); });
    }

    bPlay.onclick = function () {
      if (playing) { playing = false; refresh(); return; }
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
    app.appendChild(bar);

    var main = el('main', 'lesson');
    main.appendChild(el('h1', null, s.title));
    if (i > 0) {
      var goal = el('div', 'goal card');
      goal.appendChild(cubeCanvas(build(s.goal), 150, s.goal));
      goal.appendChild(el('div', 'goal-text', '<span class="note-tag">Mục tiêu</span>' + s.short));
      main.appendChild(goal);
    }
    s.blocks.forEach(function (b) { main.appendChild(renderBlock(b, myGen)); });

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
    app.innerHTML = '';
    var idx = -1;
    STEPS.forEach(function (s, i) { if (s.id === id) idx = i; });
    if (id === 'giai') cleanup = window.Scan.render(app, { el: el, icons: ICON, goHome: goHome, player: player, gen: myGen });
    else if (idx >= 0) renderStep(idx, myGen); else renderHome();
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  route();
})();
