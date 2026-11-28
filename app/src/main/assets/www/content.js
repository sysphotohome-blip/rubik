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
    if (label === 'y') return 'Xoay cả khối một phần tư vòng: mặt bên phải ra phía trước, mặt trên vẫn ở trên';
    if (label === "y'") return 'Xoay cả khối một phần tư vòng: mặt bên trái ra phía trước, mặt trên vẫn ở trên';
    if (label === 'y2') return 'Xoay cả khối nửa vòng: mặt sau ra phía trước, mặt trên vẫn ở trên';
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
    },
    {
      id: 'meo-nho', title: 'Mẹo nhớ công thức', short: 'Nhớ bằng tay, bằng nhịp và bằng hình', extra: true,
      goal: { mask: 'all' },
      blocks: [
        { type: 'p', html: 'Cả cách giải này chỉ có <b>6 công thức</b>, và phần lớn được ghép từ cùng một bộ 4 nước. Bạn không cần học thuộc từng chữ cái như học một dãy số. Hãy nhớ bằng ba thứ: <b>tay</b> (xoay nhiều cho quen), <b>nhịp</b> (đọc thành từng cụm ngắn) và <b>hình</b> (thấy hình nào thì dùng công thức nào).' },

        { type: 'h', text: '1. Học một bộ 4 nước trước đã' },
        { type: 'formula', alg: SEXY, note: 'Đọc theo việc tay làm: “lên, đẩy, xuống, kéo”.' },
        { type: 'p', html: 'Tay phải ôm mặt phải. <b>R</b> là đưa mặt phải <b>lên</b>, <b>U</b> là ngón trỏ phải <b>đẩy</b> tầng trên sang trái, <b>R′</b> là đưa mặt phải <b>xuống</b>, <b>U′</b> là ngón trỏ trái <b>kéo</b> tầng trên về. Hai nước sau chính là hai nước đầu làm ngược lại theo đúng thứ tự: lên rồi xuống, đẩy rồi kéo.' },
        { type: 'demo', title: 'Tập cho quen tay: làm 6 lần', text: 'Bắt đầu từ khối đã giải xong. Làm đủ 6 lần thì khối trở lại như cũ. Nếu không trở lại, tức là có một nước bạn xoay sai.', mask: 'all', setup: '', alg: rep(SEXY, 6) },
        { type: 'tip', html: 'Mỗi ngày làm bài tập “6 lần” này vài lượt, không nhìn chữ. Sau hai ba ngày tay tự chạy, đầu không phải nghĩ nữa. Đó là lúc bạn đã thuộc hơn nửa số công thức của cả bài.' },

        { type: 'h', text: '2. Các công thức khác là bộ 4 nước ấy mặc thêm áo' },
        { type: 'formula', alg: OLL, note: 'Chữ thập vàng = F + (lên, đẩy, xuống, kéo) + F′' },
        { type: 'p', html: 'Mở cửa trước (<b>F</b>), làm bộ 4 nước, đóng cửa trước lại (<b>F′</b>). Nhớ thành câu: <b>“mở cửa, làm việc, đóng cửa”</b>. Quên đóng cửa là tầng dưới hỏng.' },
        { type: 'demo', title: 'Mở cửa, làm việc, đóng cửa', mask: 'yellowCross', alg: OLL },
        { type: 'formula', alg: TW, note: 'Xoay góc vàng = vẫn nhịp 4 nước, nhưng làm với tầng đáy' },
        { type: 'p', html: 'Vẫn là mặt phải và một tầng nằm ngang, chỉ khác là dùng tầng <b>đáy</b> thay cho tầng trên, và bắt đầu bằng <b>xuống</b>: “xuống, đáy, lên, đáy”. Mặt phải xuống rồi lên, tầng đáy đi rồi về. Bộ này cũng làm 6 lần thì khối trở lại như cũ, nên bạn tập giống hệt bài tập ở mục 1.' },
        { type: 'demo', title: 'Xuống, đáy, lên, đáy: làm 6 lần', mask: 'all', setup: '', alg: rep(TW, 6) },

        { type: 'h', text: '3. Công thức dài: cắt làm đôi' },
        { type: 'formula', alg: MID_R, note: 'Tầng hai, sang phải = (U R U′ R′) + (U′ F′ U F)' },
        { type: 'p', html: 'Đừng nhớ 8 chữ. Hãy nhớ <b>2 cụm 4 nước</b>. Cụm đầu làm với <b>mặt phải</b>, cụm sau làm với <b>mặt trước</b>, và trong mỗi cụm các nước đi theo cặp “đi rồi về”: U rồi U′, R rồi R′.' },
        { type: 'p', html: 'Nước đầu tiên là nước dễ quên nhất. Mẹo: <b>cạnh sắp sang bên nào thì trước hết đẩy nó ra xa bên đó</b>. Sang phải thì đẩy nó sang trái trước (U), sang trái thì đẩy nó sang phải trước (U′). Sau đó mặt bên phía đích đi lên đón nó.' },
        { type: 'demo', title: 'Sang phải: cụm mặt phải, rồi cụm mặt trước', mask: 'layer1FR', alg: MID_R },
        { type: 'formula', alg: MID_L, note: 'Sang trái: soi gương công thức trên' },
        { type: 'p', html: 'Công thức sang trái <b>không cần học riêng</b>. Tay trái làm đúng việc tay phải vừa làm, như soi gương: chỗ nào là R thì thành L, và mọi chiều xoay đều đảo lại. Thuộc một bên là có luôn bên kia.' },

        { type: 'h', text: '4. Hai công thức của tầng vàng: nhớ bằng nhịp' },
        { type: 'formula', alg: SUNE, note: 'Khớp cạnh vàng: mặt phải “lên, xuống, lên, xuống”, xen giữa là U' },
        { type: 'p', html: 'Mặt phải chỉ làm một việc: <b>lên, xuống, lên, xuống</b>. Sau mỗi lần mặt phải động thì tầng trên xoay một cái, <b>luôn cùng một chiều</b> (U, không bao giờ là U′). Riêng lần thứ ba xoay gấp đôi (U2). Đọc thành nhịp: <b>“lên U, xuống U, lên U-U, xuống U”</b>.' },
        { type: 'demo', title: 'Lên U, xuống U, lên U-U, xuống U', mask: 'yellowEdges', alg: SUNE },
        { type: 'formula', alg: NIK, note: 'Đặt góc vàng: phải lên, trái lên, phải xuống, trái xuống' },
        { type: 'p', html: 'Tầng trên lắc qua lắc lại: <b>U, U′, U, U′</b>. Xen giữa, hai tay thay phiên nhau: <b>tay phải đưa lên, tay trái đưa lên, tay phải đưa xuống, tay trái đưa xuống</b>. Viết ra là U R, U′ L′, U R′, U′ L. Hai mặt bên cùng lên rồi cùng xuống nên cuối cùng hai tầng dưới trở về nguyên vẹn.' },
        { type: 'demo', title: 'Phải lên, trái lên, phải xuống, trái xuống', mask: 'all', setup: inv(FINISH) + ' ' + inv(NIK), alg: NIK },

        { type: 'h', text: '5. Nhớ “khi nào dùng” bằng hình, không bằng số thứ tự' },
        { type: 'p', html: 'Người mới thường thuộc công thức nhưng quên <b>lúc nào dùng</b> và <b>cầm khối thế nào</b>. Hãy gắn mỗi công thức với một hình trên khối:' },
        { type: 'p', html: '<b>Góc trắng nằm trên chỗ của nó</b> → lên, đẩy, xuống, kéo.<br><b>Vạch dọc ở mặt trước</b> (cạnh khớp tâm) → công thức tầng hai, đẩy cạnh ra xa trước.<br><b>Chấm, chữ L, vạch ngang màu vàng</b> → mở cửa, làm việc, đóng cửa.<br><b>Dấu cộng vàng, cạnh chưa khớp</b> → lên U, xuống U, lên U-U, xuống U.<br><b>Một góc đã đúng chỗ ở trước–phải</b> → phải lên, trái lên, phải xuống, trái xuống.<br><b>Góc vàng chưa ngửa ở trước–phải</b> → xuống, đáy, lên, đáy.' },
        { type: 'tip', html: 'Gần như lúc nào cũng cầm viên đang cần xử lý ở vị trí <b>trước, phải, trên</b>. Chỉ cần nhớ một chỗ cầm ấy cho mọi bước có góc.' },

        { type: 'h', text: '6. Cách tập để nhớ lâu' },
        { type: 'p', html: '<b>Mỗi ngày một công thức.</b> Học dồn cả 6 cái trong một buổi thì hôm sau lẫn hết. Hôm nay bộ 4 nước, mai “mở cửa – đóng cửa”, cứ thế.<br><b>Đọc thành tiếng khi xoay.</b> Miệng đọc “lên, đẩy, xuống, kéo”, tay làm theo. Tai nghe thêm một lần nữa nên nhớ nhanh hơn chỉ nhìn.<br><b>Xoay chậm mà đều.</b> Sai một nước là phải làm lại từ đầu, nên chậm mà đúng luôn nhanh hơn.<br><b>Nhắm mắt làm lại.</b> Khi đã quen, thử nhắm mắt làm một công thức. Làm được tức là tay đã nhớ thay đầu.<br><b>Ôn cách quãng.</b> Tập 5 phút buổi sáng, 5 phút buổi tối, hôm sau ôn lại trước khi học cái mới. Nhiều lần ngắn tốt hơn một lần dài.' },
        { type: 'warn', html: 'Đang làm dở công thức thì <b>đừng dừng lại nghĩ</b> và đừng xoay cả khối. Lỡ quên giữa chừng thì cứ làm lại bước đó từ đầu: các bước trước vẫn dễ dựng lại hơn là đoán mò nước tiếp theo.' },
        { type: 'p', html: 'Muốn tập ngay? Vào <b>Khối 3D</b>, xáo trộn rồi bấm hướng dẫn giải: mỗi bước có bài giải thích đầy đủ, bạn vừa đọc nhịp vừa xoay theo trên khối thật.' }
      ]
    }
  ];

  root.MASKS = MASKS;
  root.STEPS = STEPS;
  root.describeMove = describe;
})(window);
