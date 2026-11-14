/* Nội dung hướng dẫn: phương pháp từng tầng cho người mới.
   Mọi công thức ở đây đã được kiểm chứng bằng mô hình trong cube.js. */
(function (root) {
  'use strict';
  var C = root.Cube;

  function nz(h) { return (h[0] ? 1 : 0) + (h[1] ? 1 : 0) + (h[2] ? 1 : 0); }
  function is(h, x, y, z) { return h[0] === x && h[1] === y && h[2] === z; }
  function cross(h) { return nz(h) === 1 || (nz(h) === 2 && h[1] === -1); }
  function layer1(h) { return nz(h) === 1 || h[1] === -1; }

  /* Mặt nạ: ô nào được tô màu, phần còn lại vẽ xám */
  var MASKS = {
    all: function () { return true; },
    centres: function (h) { return nz(h) === 1; },
    edges: function (h) { return nz(h) === 2; },
    corners: function (h) { return nz(h) === 3; },
    edgeDR: function (h) { return nz(h) === 1 || is(h, 1, -1, 0); },
    edgeDF: function (h) { return nz(h) === 1 || is(h, 0, -1, 1); },
    cross: cross,
    crossCorner: function (h) { return cross(h) || is(h, 1, -1, 1); },
    layer1: layer1,
    layer1FR: function (h) { return layer1(h) || is(h, 1, 0, 1); },
    layer1FL: function (h) { return layer1(h) || is(h, -1, 0, 1); },
    layer2: function (h) { return h[1] <= 0 || nz(h) === 1; },
    yellowCross: function (h, f) { return h[1] <= 0 || nz(h) === 1 || (nz(h) === 2 && f === 'U'); },
    yellowEdges: function (h) { return h[1] <= 0 || nz(h) <= 2; }
  };

  var MOVE_DESC = {
    R: 'Mặt phải: đẩy lên', L: 'Mặt trái: kéo xuống',
    U: 'Mặt trên: xoay sang trái', D: 'Mặt dưới: xoay sang phải',
    F: 'Mặt trước: theo chiều kim đồng hồ', B: 'Mặt sau: theo chiều kim đồng hồ (nhìn từ phía sau)',
    "R'": 'Mặt phải: kéo xuống', "L'": 'Mặt trái: đẩy lên',
    "U'": 'Mặt trên: xoay sang phải', "D'": 'Mặt dưới: xoay sang trái',
    "F'": 'Mặt trước: ngược chiều kim đồng hồ', "B'": 'Mặt sau: ngược chiều kim đồng hồ (nhìn từ phía sau)'
  };
  var FACE_NAME = { R: 'Mặt phải', L: 'Mặt trái', U: 'Mặt trên', D: 'Mặt dưới', F: 'Mặt trước', B: 'Mặt sau' };
  function describe(label) {
    if (label.slice(1) === '2') return FACE_NAME[label[0]] + ': xoay nửa vòng (180°)';
    return MOVE_DESC[label] || label;
  }

  var inv = C.invert, rep = C.repeat;

  var SEXY = "R U R' U'";
  var CROSS_DEMO = "U F2 U' B2 U' R2 U L2";
  var MID_R = "U R U' R' U' F' U F";
  var MID_L = "U' L' U L U F U' F'";
  var OLL = "F R U R' U' F'";
  var SUNE = "R U R' U R U2 R' U";
  var NIK = "U R U' L' U R' U' L";
  var TW = "R' D' R D";
  var FINISH = rep(TW, 2) + ' U ' + rep(TW, 4) + " U'";
  var DOT = [inv(OLL), inv(OLL), 'U2', inv(OLL)].join(' ');

  var STEPS = [
    {
      id: 'lam-quen', title: 'Làm quen với khối Rubik', short: 'Cấu tạo và ký hiệu xoay',
      goal: { mask: 'all' },
      blocks: [
        { type: 'h', text: 'Ba loại viên' },
        { type: 'cubes', items: [
          { mask: 'centres', caption: '6 viên tâm<br><small>1 màu, không bao giờ đổi chỗ</small>' },
          { mask: 'edges', caption: '12 viên cạnh<br><small>2 màu</small>' },
          { mask: 'corners', caption: '8 viên góc<br><small>3 màu</small>' }
        ] },
        { type: 'p', html: 'Viên tâm quyết định màu của cả mặt: mặt có tâm trắng sẽ là mặt trắng. Vì vậy ta không giải từng <i>mặt</i> mà giải từng <b>tầng</b>, từ dưới lên trên.' },
        { type: 'tip', html: 'Trong các hình minh họa, ô <b>màu xám</b> nghĩa là “chưa cần quan tâm” ở bước đó.' },
        { type: 'h', text: 'Ký hiệu xoay' },
        { type: 'p', html: 'Mỗi chữ cái là một mặt, xoay 90° <b>theo chiều kim đồng hồ</b> khi nhìn thẳng vào mặt đó. Thêm dấu <b>′</b> là xoay ngược lại. Thêm số <b>2</b> là xoay nửa vòng. Chạm vào từng hình để xem chuyển động.' },
        { type: 'moves', list: ['R', "R'", 'L', "L'", 'U', "U'", 'D', "D'", 'F', "F'", 'B', "B'"] },
        { type: 'tip', html: 'Mẹo nhớ: <b>R</b>ight = phải, <b>L</b>eft = trái, <b>U</b>p = trên, <b>D</b>own = dưới, <b>F</b>ront = trước, <b>B</b>ack = sau.' },
        { type: 'h', text: 'Cách cầm khối' },
        { type: 'p', html: 'Trong suốt hướng dẫn này, hãy cầm khối với <b>tâm vàng ở trên, tâm trắng ở dưới</b>. Ở hình mẫu, mặt trước màu xanh lá và mặt phải màu cam; khối của bạn đang xoay hướng nào cũng được, miễn vàng ở trên.' }
      ]
    },
    {
      id: 'bong-cuc', title: 'Bông cúc', short: '4 cạnh trắng quanh tâm vàng',
      goal: { mask: 'cross', setup: 'F2 R2 B2 L2 U' },
      blocks: [
        { type: 'p', html: 'Cầm tâm vàng ở trên. Đưa 4 viên <b>cạnh có màu trắng</b> lên quanh tâm vàng, mặt trắng ngửa lên, trông như một bông cúc. Chưa cần quan tâm màu bên hông của chúng.' },
        { type: 'p', html: 'Bước này không cần công thức, chỉ cần vài tình huống mẫu:' },
        { type: 'demo', title: 'Cạnh trắng ở tầng giữa', text: 'Xoay mặt bên cạnh nó một lần để đưa nó lên trên.', mask: 'edgeDR', setup: 'R', alg: 'R' },
        { type: 'demo', title: 'Ở đáy, mặt trắng úp xuống', text: 'Xoay mặt chứa nó nửa vòng. (Hình đang nhìn từ dưới lên.)', mask: 'edgeDF', setup: '', alg: 'F2', pitch: -24 },
        { type: 'demo', title: 'Ở tầng trên, mặt trắng quay ra ngoài', text: 'Xoay mặt đó để đưa cạnh về tầng giữa, rồi làm như tình huống đầu.', mask: 'edgeDR', setup: "R F'", alg: 'F R' },
        { type: 'demo', title: 'Ở đáy, mặt trắng quay ra ngoài', text: 'Tương tự: đưa về tầng giữa trước, rồi đẩy lên.', mask: 'edgeDR', setup: 'R F', alg: "F' R" },
        { type: 'tip', html: 'Trước khi xoay một mặt bên, nhìn ô cạnh ở tầng trên của mặt đó. Nếu ở đó đã có cánh trắng, hãy xoay <b>U</b> để đưa một chỗ trống tới, kẻo đánh bật cánh đã làm xong.' }
      ]
    },
    {
      id: 'chu-thap-trang', title: 'Chữ thập trắng', short: 'Đưa bông cúc xuống đáy',
      goal: { mask: 'cross', pitch: -26 },
      blocks: [
        { type: 'cubes', items: [
          { mask: 'cross', setup: inv(CROSS_DEMO), caption: 'Trước: bông cúc' },
          { mask: 'cross', caption: 'Sau: nhìn từ trên' },
          { mask: 'cross', pitch: -26, caption: 'Sau: nhìn từ dưới' }
        ] },
        { type: 'p', html: 'Với <b>từng cánh trắng</b>:' },
        { type: 'p', html: '1. Nhìn màu bên hông của cánh đó.<br>2. Xoay <b>U</b> cho tới khi màu đó nằm ngay trên tâm cùng màu.<br>3. Xoay mặt đó nửa vòng (ví dụ <b>F2</b>) để đưa cánh xuống đáy.' },
        { type: 'demo', title: 'Ví dụ đủ 4 cánh', mask: 'cross', alg: CROSS_DEMO },
        { type: 'tip', html: 'Xong bước này, lật khối lên xem: đáy có chữ thập trắng và mỗi cạnh trắng liền màu với tâm bên hông. Từ giờ luôn cầm <b>vàng ở trên, trắng ở dưới</b>.' }
      ]
    },
    {
      id: 'goc-trang', title: 'Góc trắng', short: 'Hoàn thành tầng 1',
      goal: { mask: 'layer1', pitch: -26 },
      blocks: [
        { type: 'cubes', items: [
          { mask: 'layer1', caption: 'Nhìn từ trên' },
          { mask: 'layer1', pitch: -26, caption: 'Nhìn từ dưới' }
        ] },
        { type: 'p', html: 'Tìm ở <b>tầng trên</b> một viên góc có màu trắng. Hai màu còn lại của nó cho biết chỗ của nó: góc nằm giữa hai mặt có tâm cùng hai màu đó.' },
        { type: 'p', html: 'Xoay <b>U</b> để đưa viên góc tới ngay phía trên chỗ của nó, rồi cầm khối sao cho nó nằm ở vị trí <b>trước, phải, trên</b>.' },
        { type: 'formula', alg: SEXY, note: 'Lặp lại cho tới khi góc nằm đúng chỗ ở tầng dưới, mặt trắng úp xuống.' },
        { type: 'demo', title: 'Trắng quay sang phải: 1 lần', mask: 'crossCorner', alg: SEXY },
        { type: 'demo', title: 'Trắng ngửa lên trên: 3 lần', mask: 'crossCorner', alg: rep(SEXY, 3) },
        { type: 'demo', title: 'Trắng quay về phía trước: 5 lần', mask: 'crossCorner', alg: rep(SEXY, 5) },
        { type: 'tip', html: 'Không cần đếm số lần. Cứ làm trọn bộ 4 nước rồi nhìn lại viên góc; chưa đúng thì làm tiếp.' },
        { type: 'tip', html: 'Góc trắng đang nằm ở tầng dưới nhưng sai chỗ? Cầm nó ở vị trí trước, phải, dưới và làm công thức <b>1 lần</b> để đưa nó lên tầng trên, rồi giải như thường.' }
      ]
    },
    {
      id: 'tang-hai', title: 'Tầng hai', short: 'Đặt 4 cạnh tầng giữa',
      goal: { mask: 'layer2' },
      blocks: [
        { type: 'p', html: 'Tìm ở tầng trên một viên cạnh <b>không có màu vàng</b>. Xoay <b>U</b> cho tới khi màu bên hông của nó trùng với tâm bên dưới, tạo thành một vạch dọc. Cầm mặt đó hướng về phía mình.' },
        { type: 'p', html: 'Bây giờ nhìn màu <b>ngửa lên trên</b> của viên cạnh: nó trùng với tâm bên phải hay bên trái?' },
        { type: 'demo', title: 'Cần sang phải', text: 'Màu phía trên trùng với tâm bên phải.', mask: 'layer1FR', alg: MID_R },
        { type: 'demo', title: 'Cần sang trái', text: 'Màu phía trên trùng với tâm bên trái. Công thức đối xứng gương.', mask: 'layer1FL', alg: MID_L, yaw: 32 },
        { type: 'tip', html: 'Cạnh nằm ở tầng giữa nhưng sai chỗ hoặc lật ngược màu? Cầm nó ở vị trí trước–phải và làm công thức “sang phải” 1 lần để đẩy nó lên tầng trên, rồi giải như thường.' },
        { type: 'tip', html: 'Nếu cả 4 cạnh ở tầng trên đều có màu vàng mà tầng hai chưa xong, nghĩa là có cạnh đang kẹt ở tầng giữa: xử lý như mẹo trên.' }
      ]
    },
    {
      id: 'chu-thap-vang', title: 'Chữ thập vàng', short: 'Tạo dấu cộng trên mặt vàng',
      goal: { mask: 'yellowCross' },
      blocks: [
        { type: 'p', html: 'Chỉ nhìn <b>4 ô cạnh</b> trên mặt vàng (bỏ qua các góc). Bạn sẽ gặp một trong 4 hình sau:' },
        { type: 'tops', items: [
          { pattern: '....y....', caption: 'Chấm' },
          { pattern: '.y.yy....', caption: 'Chữ L' },
          { pattern: '...yyy...', caption: 'Vạch ngang' },
          { pattern: '.y.yyy.y.', caption: 'Chữ thập' }
        ] },
        { type: 'formula', alg: OLL, note: 'Một công thức duy nhất cho cả bước này.' },
        { type: 'p', html: '<b>Vạch:</b> cầm sao cho vạch nằm ngang, làm 1 lần.<br><b>Chữ L:</b> xoay U để chữ L nằm ở góc sau–trái như hình trên, làm 2 lần.<br><b>Chấm:</b> làm 1 lần sẽ ra chữ L, rồi tiếp tục như trên.' },
        { type: 'demo', title: 'Từ vạch ngang', mask: 'yellowCross', alg: OLL },
        { type: 'demo', title: 'Từ chữ L', mask: 'yellowCross', alg: OLL + ' ' + OLL },
        { type: 'demo', title: 'Từ dấu chấm', text: 'Sau lần đầu chữ L nằm lệch, nên có thêm một nước U2 để đưa nó về góc sau–trái.', mask: 'yellowCross', setup: DOT, alg: OLL + ' U2 ' + OLL + ' ' + OLL }
      ]
    },
    {
      id: 'canh-vang', title: 'Khớp cạnh vàng', short: 'Cạnh vàng liền màu với tâm',
      goal: { mask: 'yellowEdges' },
      blocks: [
        { type: 'p', html: 'Xoay <b>U</b> và so màu bên hông của 4 cạnh vàng với các tâm. Luôn xoay được để có ít nhất 2 cạnh khớp:' },
        { type: 'p', html: '<b>Cả 4 khớp:</b> xong, sang bước sau.<br><b>2 cạnh kề nhau khớp:</b> cầm khối để hai cạnh đó nằm ở <b>phía sau</b> và <b>bên phải</b>, rồi làm công thức.<br><b>2 cạnh đối diện khớp:</b> làm công thức 1 lần ở hướng bất kỳ, xoay U tìm lại, bạn sẽ gặp trường hợp kề nhau.' },
        { type: 'formula', alg: SUNE, note: 'Đổi chỗ cạnh phía trước với cạnh bên trái.' },
        { type: 'tops', items: [
          { mask: 'yellowEdges', setup: inv(SUNE), arrows: [[1, 2, 0, 1, true]], caption: 'Trước' },
          { mask: 'yellowEdges', caption: 'Sau' }
        ] },
        { type: 'demo', title: 'Xem công thức', text: 'Cạnh sau (xanh dương) và cạnh phải (cam) đã khớp sẵn.', mask: 'yellowEdges', alg: SUNE }
      ]
    },
    {
      id: 'dat-goc-vang', title: 'Đặt góc vàng đúng chỗ', short: 'Đúng vị trí, chưa cần đúng hướng',
      goal: { mask: 'all', setup: inv(FINISH) },
      blocks: [
        { type: 'p', html: 'Một góc <b>đúng chỗ</b> khi 3 màu của nó trùng với 3 tâm bao quanh nó, dù nó có thể đang bị xoay sai hướng (như hai góc phía trước và phía sau bên phải trong hình trên).' },
        { type: 'p', html: 'Tìm một góc đúng chỗ và cầm khối sao cho nó nằm ở vị trí <b>trước, phải, trên</b>.' },
        { type: 'formula', alg: NIK, note: 'Góc trước–phải đứng yên, 3 góc còn lại đổi chỗ vòng tròn. Làm 1 hoặc 2 lần.' },
        { type: 'tops', items: [
          { mask: 'all', setup: inv(FINISH) + ' ' + inv(NIK), arrows: [[0, 2, 2, 0], [2, 0, 0, 0], [0, 0, 0, 2]], caption: 'Trước' },
          { mask: 'all', setup: inv(FINISH), caption: 'Sau' }
        ] },
        { type: 'demo', title: 'Xem công thức', mask: 'all', setup: inv(FINISH) + ' ' + inv(NIK), alg: NIK },
        { type: 'tip', html: 'Không có góc nào đúng chỗ? Làm công thức 1 lần ở hướng bất kỳ, sau đó sẽ có đúng một góc về đúng chỗ.' }
      ]
    },
    {
      id: 'xoay-goc-vang', title: 'Xoay góc vàng', short: 'Bước cuối cùng',
      goal: { mask: 'all' },
      blocks: [
        { type: 'p', html: 'Cầm vàng ở trên. Chọn một góc mà mặt vàng <b>chưa ngửa lên</b>, đặt nó ở vị trí <b>trước, phải, trên</b>.' },
        { type: 'formula', alg: TW, note: 'Lặp lại (2 hoặc 4 lần) cho tới khi mặt vàng của góc đó ngửa lên.' },
        { type: 'warn', html: 'Trong lúc làm, hai tầng dưới trông như bị xáo trộn. <b>Điều đó bình thường!</b> Đừng xoay cả khối. Chỉ xoay <b>U</b> để đưa góc sai tiếp theo tới vị trí trước–phải–trên rồi lặp lại công thức. Khi góc cuối cùng xong, mọi thứ tự trở về chỗ cũ.' },
        { type: 'demo', title: 'Ví dụ với 2 góc sai hướng', text: 'Góc đầu cần 2 lần, xoay U, góc sau cần 4 lần, rồi xoay U′ để hoàn tất.', mask: 'all', alg: FINISH },
        { type: 'tip', html: 'Luôn làm <b>trọn bộ 4 nước</b> (kết thúc bằng D) trước khi xoay U. Dừng giữa chừng là hỏng.' },
        { type: 'p', html: 'Cuối cùng xoay <b>U</b> để tầng trên khớp với các tầng dưới. Chúc mừng, bạn đã giải xong khối Rubik! 🎉' }
      ]
    }
  ];

  root.MASKS = MASKS;
  root.STEPS = STEPS;
  root.describeMove = describe;
})(window);
