/* Trợ lý Claude: nhờ Claude viết lời giải thích dễ hiểu cho từng bước, từng việc.
   Các nước xoay vẫn do app tự tính (lbl.js) nên luôn đúng; Claude chỉ soạn lời nói.
   Khoá API do người dùng tự nhập, chỉ lưu trong máy (localStorage), không nằm trong mã nguồn hay APK.
   Gọi API qua SDK chính thức của Anthropic, đóng gói sẵn ở vendor/anthropic.js (xem tools/claude-sdk). */
(function () {
  'use strict';
  var KEY = 'rubik.claudeKey';
  var MODEL = 'claude-opus-5-5';

  function getKey() {
    try { return localStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }
  function setKey(k) {
    try { localStorage.setItem(KEY, k); return true; } catch (e) { return false; }
  }
  function clearKey() {
    try { localStorage.removeItem(KEY); } catch (e) { /* bỏ qua */ }
  }
  function hasKey() { return !!getKey(); }

  /* SDK nặng khoảng 400 KB nên chỉ nạp khi thật sự cần gọi Claude */
  var sdk = null;
  function loadSdk() {
    if (window.Anthropic) return Promise.resolve(window.Anthropic);
    if (!sdk) {
      sdk = new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = 'vendor/anthropic.js';
        s.onload = function () { if (window.Anthropic) res(window.Anthropic); else { sdk = null; rej(new Error('sdk')); } };
        s.onerror = function () { sdk = null; rej(new Error('sdk')); };
        document.head.appendChild(s);
      });
    }
    return sdk;
  }
  function client() {
    return loadSdk().then(function (Anthropic) {
      // dangerouslyAllowBrowser: khoá là của chính người dùng, nằm trên máy của họ
      return new Anthropic({ apiKey: getKey(), dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 90000 });
    });
  }

  /* Đổi lỗi của SDK thành câu tiếng Việt cho người dùng */
  function explainError(e) {
    var A = window.Anthropic;
    if (e && e.friendly) return e.message;
    if (!A || (e && e.message === 'sdk')) return 'Không nạp được phần kết nối Claude trong app.';
    if (e instanceof A.AuthenticationError) return 'Khoá API không đúng hoặc đã bị thu hồi. Hãy kiểm tra lại khoá.';
    if (e instanceof A.PermissionDeniedError) return 'Khoá API này không được phép dùng mô hình của app.';
    if (e instanceof A.RateLimitError) return 'Bạn đang gọi Claude quá nhanh hoặc đã chạm hạn mức. Hãy chờ một lát rồi thử lại.';
    if (e instanceof A.BadRequestError) {
      return /credit|billing/i.test(e.message || '') ? 'Tài khoản Anthropic của bạn đã hết tiền nạp. Hãy nạp thêm rồi thử lại.'
        : 'Claude không nhận yêu cầu này.';
    }
    if (e instanceof A.APIConnectionError) return 'Không kết nối được tới Claude. Hãy kiểm tra mạng.';
    if (e instanceof A.APIError) return 'Máy chủ Claude đang gặp trục trặc (mã ' + (e.status || '?') + '). Hãy thử lại sau.';
    return 'Có lỗi khi gọi Claude.';
  }
  function friendly(msg) { var e = new Error(msg); e.friendly = true; return e; }

  var SYSTEM = [
    'Bạn là một thầy dạy Rubik kiên nhẫn, đang kèm một người mới học giải khối 3×3 theo phương pháp từng tầng.',
    'App đã tính sẵn các nước xoay đúng cho khối của người học. Việc của bạn chỉ là giải thích bằng lời, để người học hiểu mình đang làm gì và vì sao.',
    'Lời của bạn được hiện trên màn hình và được giọng máy đọc thành tiếng, ngay trước khi app đọc tên và xoay từng nước.',
    '',
    'Cách viết:',
    '- Tiếng Việt, câu ngắn, từ ngữ đời thường, như đang nói chuyện với một bạn nhỏ lần đầu cầm khối Rubik.',
    '- Chỉ dùng chữ thường: không ký hiệu xoay (R, U′, y…), không markdown, không gạch đầu dòng, không emoji, vì giọng máy không đọc được.',
    '- Gọi các mặt bằng tên: mặt trên, mặt dưới, mặt trước, mặt sau, mặt phải, mặt trái. Gọi viên bằng màu của nó.',
    '- Không đọc lại lần lượt từng nước xoay, vì app sẽ đọc. Hãy nói ý nghĩa của cả việc đó.',
    '- Chỉ dựa trên thông tin được cho. Không tự nghĩ ra nước xoay, màu hay vị trí của viên nào.',
    '',
    'Để bạn hiểu dữ liệu: R, L, U, D, F, B là mặt phải, trái, trên, dưới, trước, sau, xoay một phần tư vòng theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó; dấu \' là xoay ngược lại; số 2 là xoay nửa vòng; y là xoay cả khối sang mặt khác, mặt trên vẫn ở trên.',
    'Người học cầm khối với tâm vàng ở trên, tâm trắng ở dưới. Lúc bắt đầu, tâm xanh lá ở trước, cam bên phải, đỏ bên trái, xanh dương ở sau.',
    '',
    'Trả về:',
    '- intro: hai hoặc ba câu mở đầu cho bước này, nói bước này để làm gì và nên nhìn vào đâu trên khối.',
    '- tasks: mỗi việc đúng một phần tử, theo đúng thứ tự được cho, mỗi phần tử một hoặc hai câu: việc này đưa viên nào tới đâu hoặc đạt được gì, và nếu có thể thì thêm một dấu hiệu để tự kiểm tra sau khi xoay xong.'
  ].join('\n');

  var SCHEMA = {
    type: 'object',
    properties: {
      intro: { type: 'string' },
      tasks: { type: 'array', items: { type: 'string' } }
    },
    required: ['intro', 'tasks'],
    additionalProperties: false
  };

  /* step = {no, title, goal, why, tasks: [{note, alg}]}  ->  Promise<{intro, tasks: [chuỗi]}> */
  function explain(step) {
    if (!hasKey()) return Promise.reject(friendly('Chưa có khoá API.'));
    var lines = [
      'Bước ' + step.no + '/8: ' + step.title,
      'Mục tiêu của bước: ' + step.goal,
      'Vì sao làm vậy: ' + step.why,
      '',
      'Bước này gồm ' + step.tasks.length + ' việc, làm theo thứ tự:'
    ];
    step.tasks.forEach(function (t, i) {
      lines.push((i + 1) + '. Ghi chú của app: ' + t.note + ' | Các nước xoay: ' + t.alg);
    });
    lines.push('', 'Hãy viết intro và đúng ' + step.tasks.length + ' phần tử trong tasks.');
    if (getStyle()) lines.push('', 'Người học dặn riêng về cách giải thích, hãy làm theo: ' + getStyle());

    return client().then(function (c) {
      return c.beta.messages.create({
        model: MODEL,
        max_tokens: 16000,
        // Nếu mô hình chính từ chối, máy chủ tự chuyển sang mô hình dự phòng
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: lines.join('\n') }]
      });
    }).then(function (msg) {
      if (msg.stop_reason === 'refusal') throw friendly('Claude từ chối trả lời yêu cầu này.');
      if (msg.stop_reason === 'max_tokens') throw friendly('Câu trả lời của Claude bị cắt giữa chừng.');
      var text = '';
      (msg.content || []).forEach(function (b) { if (b.type === 'text') text += b.text; });
      var data;
      try { data = JSON.parse(text); } catch (e) { throw friendly('Claude trả lời không đúng định dạng.'); }
      if (!data || typeof data.intro !== 'string' || !Array.isArray(data.tasks)) throw friendly('Claude trả lời không đúng định dạng.');
      return {
        intro: data.intro.trim(),
        tasks: data.tasks.map(function (t) { return typeof t === 'string' ? t.trim() : ''; })
      };
    });
  }

  /* Cách giải thích do người học dặn (qua ô trò chuyện), nhớ lại cho các lần sau */
  var STYLE = 'rubik.aiStyle';
  function getStyle() {
    try { return localStorage.getItem(STYLE) || ''; } catch (e) { return ''; }
  }
  function setStyle(s) {
    try { if (s) localStorage.setItem(STYLE, s); else localStorage.removeItem(STYLE); } catch (e) { /* bỏ qua */ }
  }

  /* ---------- Trò chuyện, có công cụ để điều khiển khối ---------- */
  var CHAT_SYSTEM = [
    'Bạn là trợ lý trong một app Android dạy giải Rubik 3×3 theo phương pháp từng tầng (8 bước). Người dùng đang ở màn hình "Khối 3D để tập giải" và nói chuyện với bạn để điều khiển khối trên màn hình và cách hướng dẫn giải.',
    '',
    'Màn hình có hai chế độ. Chế độ khối: người dùng tự xoay hoặc xáo trộn khối. Chế độ hướng dẫn: app đã tính sẵn lời giải cho khối đó và chạy từng nước, chia theo 8 bước bài học, mỗi bước gồm vài việc.',
    'Đầu mỗi tin nhắn của người dùng có phần [Trạng thái app] do app tự chèn, cho biết đang ở chế độ nào và đang tới đâu. Người dùng không nhìn thấy phần đó.',
    '',
    'Cách làm việc:',
    '- Khi người dùng muốn làm gì đó với khối hay với phần hướng dẫn, hãy gọi công cụ để làm ngay, đừng chỉ mô tả. Có thể gọi nhiều công cụ nối tiếp nhau.',
    '- Lời giải do app tính. Bạn không tự nghĩ ra dãy nước để giải khối; muốn giải thì mở hướng dẫn (start_guide).',
    '- Nếu công cụ báo lỗi vì đang ở sai chế độ, hãy chuyển chế độ bằng công cụ phù hợp rồi làm lại.',
    '- Khi người dùng muốn đổi cách giải thích (ngắn hơn, kỹ hơn, cho trẻ nhỏ, giọng vui hơn…), gọi set_explain_style.',
    '- Khi người dùng hỏi về Rubik hoặc về bước đang làm, hãy trả lời dựa trên trạng thái app và kiến thức về phương pháp từng tầng.',
    '',
    'Ký hiệu xoay dùng trong công cụ: R, L, U, D, F, B là mặt phải, trái, trên, dưới, trước, sau, xoay một phần tư vòng theo chiều kim đồng hồ khi nhìn thẳng vào mặt đó; thêm dấu \' là xoay ngược chiều kim đồng hồ; thêm số 2 là nửa vòng. Tâm vàng ở trên, trắng ở dưới, xanh lá phía trước, cam bên phải, đỏ bên trái, xanh dương phía sau.',
    '',
    'Cách trả lời: tiếng Việt, một đến ba câu ngắn, lời lẽ đời thường. Câu trả lời được giọng máy đọc thành tiếng nên chỉ dùng chữ thường: không markdown, không gạch đầu dòng, không emoji, và gọi mặt bằng tên thay vì ký hiệu.'
  ].join('\n');

  function tool(name, description, props, required) {
    return { name: name, description: description, input_schema: { type: 'object', properties: props || {}, required: required || [] } };
  }
  var TOOLS = [
    tool('turn_faces', 'Chế độ khối: xoay các mặt của khối trên màn hình theo thứ tự. Dùng khi người dùng bảo xoay mặt nào đó.',
      { moves: { type: 'string', description: 'Các nước xoay cách nhau bằng dấu cách, ví dụ: R U\' F2. Tối đa 40 nước.' } }, ['moves']),
    tool('scramble', 'Chế độ khối: xáo trộn khối ngẫu nhiên 20 nước.'),
    tool('reset_cube', 'Chế độ khối: đặt khối về trạng thái đã giải xong.'),
    tool('start_guide', 'Chế độ khối: tính lời giải cho khối đang có và mở chế độ hướng dẫn từng nước. Khối phải đang rối.'),
    tool('back_to_cube', 'Chế độ hướng dẫn: thoát hướng dẫn, quay về chế độ khối, giữ nguyên khối đang giải dở lúc bắt đầu hướng dẫn.'),
    tool('guide_step', 'Chế độ hướng dẫn: tiến hoặc lùi một số nước xoay. Tiến thì app xoay và đọc từng nước.',
      { count: { type: 'integer', description: 'Số nước: dương là tiến, âm là lùi. Ví dụ 1, 3, -1.' } }, ['count']),
    tool('guide_goto', 'Chế độ hướng dẫn: nhảy thẳng tới đầu một bước bài học (và một việc trong bước đó nếu cần), khối được đặt đúng trạng thái tại đó.',
      { step: { type: 'integer', description: 'Số thứ tự bước bài học, từ 1 đến 8.' },
        task: { type: 'integer', description: 'Số thứ tự việc trong bước, bắt đầu từ 1. Bỏ trống là việc đầu tiên.' } }, ['step']),
    tool('guide_autoplay', 'Chế độ hướng dẫn: bật hoặc dừng tự chạy lần lượt các nước.',
      { on: { type: 'boolean', description: 'true là tự chạy, false là dừng.' } }, ['on']),
    tool('set_explain_style', 'Đổi cách Claude soạn lời giải thích cho từng bước và từng việc trong chế độ hướng dẫn. App nhớ cho các lần sau và soạn lại lời giải thích hiện tại.',
      { style: { type: 'string', description: 'Lời dặn về cách giải thích, viết thành câu đầy đủ, ví dụ: "Giải thích thật ngắn, mỗi việc một câu." Chuỗi rỗng để quay về cách mặc định.' } }, ['style']),
    tool('set_voice', 'Bật hoặc tắt giọng đọc của app.',
      { on: { type: 'boolean', description: 'true là bật, false là tắt.' } }, ['on'])
  ];

  /* o = {messages (mảng lịch sử, được nối thêm), onTool(name, input) -> Promise<chuỗi>}  ->  Promise<câu trả lời> */
  function chat(o) {
    var keep = o.messages.length - 1; // nếu hỏng giữa chừng thì bỏ lượt này khỏi lịch sử
    return client().then(function (c) {
      var rounds = 0;
      function turn() {
        return c.beta.messages.create({
          model: MODEL,
          max_tokens: 16000,
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          output_config: { effort: 'low' },
          system: CHAT_SYSTEM,
          tools: TOOLS,
          messages: o.messages
        }).then(function (msg) {
          if (msg.stop_reason === 'refusal') throw friendly('Claude từ chối trả lời yêu cầu này.');
          // giữ nguyên toàn bộ nội dung (kể cả phần suy nghĩ) để gửi lại ở lượt sau
          o.messages.push({ role: 'assistant', content: msg.content });
          var uses = msg.content.filter(function (b) { return b.type === 'tool_use'; });
          if (msg.stop_reason === 'tool_use' && uses.length) {
            if (++rounds > 8) throw friendly('Claude gọi quá nhiều lệnh liên tiếp nên app đã dừng lại.');
            var results = [];
            return uses.reduce(function (p, u) {
              return p.then(function () {
                return Promise.resolve().then(function () { return o.onTool(u.name, u.input || {}); }).then(function (text) {
                  results.push({ type: 'tool_result', tool_use_id: u.id, content: String(text) });
                }, function (e) {
                  results.push({ type: 'tool_result', tool_use_id: u.id, content: String(e && e.message || e), is_error: true });
                });
              });
            }, Promise.resolve()).then(function () {
              o.messages.push({ role: 'user', content: results });
              return turn();
            });
          }
          var text = '';
          msg.content.forEach(function (b) { if (b.type === 'text') text += b.text; });
          return text.trim() || 'Xong rồi.';
        });
      }
      return turn();
    }).catch(function (e) {
      o.messages.length = Math.max(0, keep);
      throw e;
    });
  }

  /* Thử khoá bằng một lệnh không tốn tiền: xin danh sách mô hình */
  function test() {
    return client().then(function (c) { return c.models.list({ limit: 1 }); });
  }

  /* ---------- Màn hình cài đặt trợ lý ---------- */
  function renderSettings(app, h) {
    var el = h.el;
    var bar = el('div', 'topbar');
    var back = el('a', 'icon-btn', h.icons.back);
    back.href = '#/';
    back.onclick = h.goHome;
    back.setAttribute('aria-label', 'Về danh sách');
    bar.appendChild(back);
    bar.appendChild(el('div', 'topbar-title', 'Trợ lý Claude'));
    app.appendChild(bar);

    var main = el('main', 'lesson');
    main.appendChild(el('h1', null, 'Trợ lý Claude'));
    main.appendChild(el('p', null, 'Khi bật, ở màn hình <b>Khối 3D để tập giải</b>, Claude sẽ soạn lời giải thích riêng cho khối của bạn: ' +
      'mỗi bước và mỗi việc có vài câu ngắn, dễ hiểu, và app đọc thành tiếng trước khi xoay. ' +
      'Các nước xoay vẫn do app tự tính nên luôn đúng.'));

    var card = el('div', 'card ai-form');
    var state = el('div', 'ai-state');
    card.appendChild(state);
    var lab = el('label', null, 'Khoá API của bạn');
    lab.setAttribute('for', 'ai-key');
    card.appendChild(lab);
    var inp = el('input');
    inp.id = 'ai-key';
    inp.type = 'password';
    inp.autocomplete = 'off';
    inp.spellcheck = false;
    inp.placeholder = 'sk-ant-…';
    card.appendChild(inp);
    var row = el('div', 'ai-row');
    var bSave = el('button', 'big-btn primary', 'Lưu khoá');
    var bTest = el('button', 'big-btn', 'Kiểm tra kết nối');
    bSave.type = bTest.type = 'button';
    row.appendChild(bSave); row.appendChild(bTest);
    card.appendChild(row);
    var bDel = el('button', 'link-btn', 'Xoá khoá khỏi máy này');
    bDel.type = 'button';
    card.appendChild(bDel);
    var out = el('div');
    card.appendChild(out);
    main.appendChild(card);

    function say(kind, html) {
      out.className = 'note ' + kind;
      out.innerHTML = '<span class="note-tag">' + (kind === 'warn' ? 'Chưa được' : 'Kết quả') + '</span>' + html;
    }
    function paint() {
      var on = hasKey();
      state.className = 'ai-state' + (on ? ' on' : '');
      state.textContent = on ? 'Đang bật · đã lưu khoá trên máy này' : 'Đang tắt · chưa có khoá';
      bTest.disabled = bDel.hidden = !on;
    }
    bSave.onclick = function () {
      var k = inp.value.trim();
      if (!k) { say('warn', 'Bạn chưa dán khoá vào ô.'); return; }
      if (!setKey(k)) { say('warn', 'Máy không cho lưu. Hãy thử lại.'); return; }
      inp.value = '';
      paint();
      say('tip', 'Đã lưu. Bấm <b>Kiểm tra kết nối</b> để chắc là khoá dùng được.' +
        (/^sk-ant-/.test(k) ? '' : ' Lưu ý: khoá của Anthropic thường bắt đầu bằng <b>sk-ant-</b>.'));
    };
    bDel.onclick = function () {
      clearKey(); paint();
      say('tip', 'Đã xoá khoá. App quay lại dùng lời giải thích có sẵn.');
    };
    bTest.onclick = function () {
      bTest.disabled = true;
      say('tip', 'Đang thử kết nối…');
      test().then(function () {
        say('tip', 'Kết nối tốt. Mở <b>Khối 3D để tập giải</b>, xáo trộn rồi bấm hướng dẫn để nghe Claude giải thích.');
      }, function (e) {
        say('warn', explainError(e));
      }).then(function () { if (h.alive()) paint(); });
    };
    paint();

    main.appendChild(el('div', 'note tip', '<span class="note-tag">Lấy khoá ở đâu</span>Mở trình duyệt, vào <b>platform.claude.com</b>, ' +
      'đăng nhập, vào mục <b>API keys</b> rồi tạo một khoá mới. Sao chép khoá và dán vào ô ở trên.'));
    main.appendChild(el('div', 'note warn', '<span class="note-tag">Nên biết</span>' +
      'Mỗi lần xem hướng dẫn, app gửi các nước xoay và ghi chú của khối đang giải tới máy chủ của Anthropic. Ảnh chụp không được gửi đi. ' +
      'Phần này cần có mạng và <b>tính tiền vào tài khoản Anthropic của bạn</b> (mô hình Claude Opus 5.5, mỗi khối khoảng 8 lượt gọi nhỏ). ' +
      'Khoá chỉ lưu trong máy này; đừng đưa khoá cho người khác.'));
    app.appendChild(main);
  }

  window.AI = {
    hasKey: hasKey, explain: explain, chat: chat, getStyle: getStyle, setStyle: setStyle, explainError: explainError, renderSettings: renderSettings, model: MODEL
  };
})();
