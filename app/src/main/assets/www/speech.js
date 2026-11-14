/* Lời đọc tiếng Việt.
   Trong app Android: dùng bộ đọc của máy qua cầu nối AndroidTTS (MainActivity).
   Trên trình duyệt: dùng speechSynthesis nếu có. */
(function () {
  'use strict';
  var A = window.AndroidTTS, syn = window.speechSynthesis;
  var job = null, seq = 0, timer = null;
  var KEY = 'rubik.voice';

  function status() {
    if (A) { try { return A.status(); } catch (e) { return 'error'; } }
    return syn && window.SpeechSynthesisUtterance ? 'ready' : 'none';
  }

  /* Câu báo cho người dùng khi máy không đọc được; rỗng nếu mọi thứ ổn */
  function problem() {
    var s = status();
    if (s === 'ready' || s === 'loading') return '';
    if (s === 'nolang') return 'Máy chưa có giọng đọc tiếng Việt. Mở Cài đặt › tìm “Chuyển văn bản thành giọng nói” › cài dữ liệu giọng nói Tiếng Việt, rồi mở lại app.';
    return 'Máy này không có bộ đọc văn bản nên chưa phát được lời nói.';
  }

  function viVoice() {
    try {
      var v = syn.getVoices();
      for (var i = 0; i < v.length; i++) if (/^vi\b/i.test(v[i].lang)) return v[i];
    } catch (e) { /* bỏ qua */ }
    return null;
  }

  function step() {
    var j = job;
    if (!j) return;
    if (j.i >= j.list.length) { job = null; if (j.done) j.done(true); return; }
    var id = ++seq, text = j.list[j.i];
    j.id = id;
    if (j.each) j.each(j.i);
    j.i++;
    // Phòng khi bộ đọc không báo lại là đã đọc xong
    clearTimeout(timer);
    timer = setTimeout(function () { end(id); }, 5000 + text.length * 140);
    try {
      if (A) A.speak(text, id);
      else {
        var u = new window.SpeechSynthesisUtterance(text), v = viVoice();
        u.lang = 'vi-VN';
        if (v) u.voice = v;
        u.onend = u.onerror = function () { end(id); };
        syn.speak(u);
      }
    } catch (e) { end(id); }
  }

  function end(id) {
    if (!job || job.id !== id) return;
    clearTimeout(timer);
    step();
  }

  /* Đọc một câu hoặc một danh sách câu (bỏ lời đang đọc dở).
     done(true) khi đọc hết, done(false) nếu bị dừng giữa chừng; each(i) trước mỗi câu. */
  function say(texts, done, each) {
    stop();
    var list = [].concat(texts).filter(function (t) { return t && /\S/.test(t); });
    if (!list.length || problem()) { if (done) done(false); return; }
    job = { list: list, i: 0, done: done, each: each };
    step();
  }

  function stop() {
    var j = job;
    job = null;
    clearTimeout(timer);
    try { if (A) A.stop(); else if (syn) syn.cancel(); } catch (e) { /* bỏ qua */ }
    if (j && j.done) j.done(false);
  }

  /* ----- Chuyển nội dung thành câu để đọc ----- */
  var LETTER = { R: 'rờ', L: 'lờ', U: 'u', D: 'đê', F: 'ép', B: 'bê' };
  function moveName(label) {
    var s = LETTER[label[0]] || label[0];
    if (label.indexOf('2') > 0) s += ' hai';
    else if (/['′]/.test(label)) s += ' phẩy';
    return s;
  }
  function alg(a) {
    return a.split(/\s+/).filter(Boolean).map(moveName).join(', ');
  }
  function plain(html) {
    var d = document.createElement('div');
    d.innerHTML = String(html).replace(/<br\s*\/?>/gi, '. ');
    return d.textContent
      .replace(/([RLUDFB])['′]/g, function (m, c) { return moveName(c + "'") + ' '; })
      .replace(/′/g, ' phẩy ')
      .replace(/(\d)\s*×\s*(\d)/g, '$1 nhân $2')
      .replace(/°/g, ' độ')
      .replace(/[‹›▶◀✓]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  /* "R'" + "Mặt phải: kéo xuống" → "rờ phẩy. Mặt phải, kéo xuống" */
  function move(label, desc) {
    return moveName(label) + '. ' + String(desc).replace(/\s*\(180°\)/, '').replace(':', ',');
  }

  function isOn() {
    try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; }
  }
  function setOn(v) {
    try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) { /* bỏ qua */ }
    if (!v) stop();
  }

  window.Speech = {
    say: say, stop: stop, status: status, problem: problem,
    plain: plain, alg: alg, move: move, isOn: isOn, setOn: setOn,
    _end: end // MainActivity gọi khi máy đọc xong một câu
  };
})();
