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
  // Bài viết đầy đủ của từng bước: mỗi mục là [tiêu đề, nội dung]
  var LONG = {
    'bong-cuc': [
      ['Nhìn gì trên khối', 'Khối Rubik có ba loại viên. Viên <b>tâm</b> có 1 màu và không bao giờ đổi chỗ, nên tâm vàng luôn là mặt vàng, tâm trắng luôn là mặt trắng. Viên <b>cạnh</b> có 2 màu, viên <b>góc</b> có 3 màu. Ở bước này bạn chỉ đi tìm 4 viên cạnh có một mặt màu trắng. Viên góc có màu trắng thì mặc kệ, dù nó nằm ở đâu.'],
      ['Cách làm', 'Cầm tâm vàng ở trên. Lần lượt đưa từng cạnh trắng lên tầng trên sao cho mặt trắng của nó ngửa lên, nằm cạnh tâm vàng. Chưa cần biết màu thứ hai của viên cạnh là gì, cũng chưa cần nó nằm ở phía nào của tâm vàng. Vì thế bước này không có công thức: bạn chỉ cần xoay mặt đang chứa viên cạnh cho tới khi nó lên được tầng trên.'],
      ['Bốn tình huống thường gặp', '<b>Cạnh trắng ở tầng giữa:</b> xoay mặt bên nằm cạnh nó một lần là nó lên tầng trên.<br><b>Ở đáy, mặt trắng úp xuống:</b> xoay mặt chứa nó nửa vòng.<br><b>Ở tầng trên nhưng mặt trắng quay ra ngoài:</b> xoay mặt đó một lần để đưa cạnh về tầng giữa, rồi làm như tình huống đầu.<br><b>Ở đáy, mặt trắng quay ra ngoài:</b> cũng đưa về tầng giữa trước, rồi đẩy lên.<br>Tóm lại: cứ đưa cạnh về tầng giữa, từ tầng giữa lên tầng trên chỉ mất một nước.'],
      ['Lỗi hay gặp', 'Khi xoay một mặt bên để đưa cánh mới lên, ô cạnh phía trên của mặt đó sẽ bị đẩy đi chỗ khác. Nếu ở ô đó đang có một cánh trắng đã làm xong thì cánh ấy bị đánh bật ra. Cách tránh: trước khi xoay mặt bên, nhìn ô cạnh phía trên của nó. Đã có cánh trắng thì xoay U để đưa một chỗ còn trống tới, rồi mới xoay mặt bên. Tầng trên xoay tự do nên việc này không làm hỏng gì.'],
      ['Vì sao phải đi vòng qua bông cúc', 'Mục tiêu thật là dấu cộng trắng ở đáy. Nhưng đặt thẳng cạnh trắng xuống đáy thì phải lo cùng lúc hai việc: mặt trắng úp xuống và màu bên hông khớp tâm. Bông cúc tách hai việc đó ra: bây giờ chỉ lo mặt trắng, bước sau mới lo màu bên hông. Mỗi lần một việc thì người mới không bị rối.']
    ],
    'chu-thap-trang': [
      ['Nhìn gì trên khối', 'Mỗi cánh trắng của bông cúc còn một màu thứ hai nằm ở mặt bên, ngay dưới mép tầng trên. Màu đó cho biết cánh này thuộc về mặt nào: màu đỏ thì thuộc mặt có tâm đỏ, màu xanh lá thì thuộc mặt có tâm xanh lá. Bước này chỉ nhìn hai thứ: màu bên hông của cánh và màu của tâm ngay bên dưới nó.'],
      ['Cách làm từng cánh', 'Chọn một cánh trắng. Xoay U cho tới khi màu bên hông của nó nằm ngay trên tâm cùng màu, hai ô đó liền nhau thành một vạch dọc ngắn. Lúc đó xoay mặt ấy nửa vòng (ví dụ F2): cánh trắng rơi thẳng xuống đáy, mặt trắng úp xuống, màu bên hông vẫn liền với tâm. Làm lần lượt đủ 4 cánh.'],
      ['Vì sao không hỏng những cánh đã hạ', 'Xoay U chỉ động tới tầng trên, không đụng tới đáy, nên bạn xoay U bao nhiêu lần để dóng màu cũng được. Còn nước nửa vòng chỉ động tới một mặt bên, mà các cánh đã hạ nằm ở những mặt bên khác. Vì vậy cánh nào xong là yên chỗ, không phải canh chừng.'],
      ['Lỗi hay gặp', 'Lỗi phổ biến nhất là hạ cánh xuống khi màu bên hông chưa trùng tâm. Đáy vẫn có dấu cộng trắng nên trông như đã đúng, nhưng các bước sau sẽ không giải được. Lỗi thứ hai là xoay một phần tư vòng thay vì nửa vòng: cánh sẽ dừng ở tầng giữa. Nếu lỡ như vậy, xoay thêm một lần cùng chiều là xong.'],
      ['Kiểm tra và ghi nhớ', 'Lật khối lên nhìn đáy: phải có dấu cộng trắng, và nhìn vòng quanh thì mỗi cạnh trắng liền màu với tâm của mặt bên. Câu để nhớ bước này: <b>“dóng màu rồi mới hạ”</b>. Từ đây trở đi luôn cầm vàng ở trên, trắng ở dưới.']
    ],
    'goc-trang': [
      ['Nhìn gì trên khối', 'Tìm ở tầng trên một viên góc có màu trắng. Viên góc có 3 màu: trắng và hai màu nữa. Hai màu đó cho biết nhà của nó: góc ở tầng dưới nằm giữa hai mặt có tâm mang đúng hai màu ấy. Ví dụ góc trắng–đỏ–xanh lá thuộc về góc dưới nằm giữa mặt đỏ và mặt xanh lá.'],
      ['Cách cầm', 'Xoay U để đưa viên góc tới ngay phía trên nhà của nó. Rồi xoay cả khối sao cho viên góc nằm ở vị trí <b>trước, phải, trên</b>, tức là nhà của nó ở trước, phải, dưới. Cả bước này, và hầu hết các bước sau, đều làm ở đúng vị trí đó, nên bạn chỉ phải quen một chỗ cầm.'],
      ['Công thức và cách đọc', 'Công thức là R U R′ U′, đọc theo tay: <b>lên, đẩy, xuống, kéo</b>. Mặt phải đi lên mang theo cái khe trống ở tầng dưới, tầng trên đẩy viên góc đi, mặt phải đi xuống, tầng trên kéo về. Làm xong 4 nước thì nhìn lại viên góc. Nếu nó đã nằm ở tầng dưới với mặt trắng úp xuống thì xong. Chưa được thì làm tiếp trọn 4 nước nữa.'],
      ['Mấy lần thì xong', 'Tùy mặt trắng của viên góc đang quay về đâu: quay sang phải thì 1 lần, ngửa lên trên thì 3 lần, quay về phía trước thì 5 lần. Bạn không cần nhớ mấy con số này. Chỉ cần nhớ: làm trọn bộ, nhìn lại, chưa đúng thì làm tiếp. Không bao giờ quá 5 lần.'],
      ['Khi góc trắng kẹt ở tầng dưới', 'Có khi viên góc trắng đã nằm ở tầng dưới nhưng sai nhà hoặc mặt trắng quay ra ngoài. Cầm nó ở vị trí trước, phải, dưới rồi làm công thức 1 lần: nó bị đẩy lên tầng trên. Sau đó giải nó như mọi viên góc khác.'],
      ['Vì sao dấu cộng trắng không hỏng', 'Trong 4 nước, mặt phải đi lên rồi lại đi xuống, tầng trên đẩy đi rồi lại kéo về. Cánh trắng bên phải bị nhấc lên theo mặt phải, nhưng luôn được hạ xuống đúng chỗ cũ. Thứ duy nhất thay đổi sau mỗi lần làm là viên góc ở trước–phải. Lỗi hay gặp là dừng giữa chừng để nhìn: khi đó cánh trắng đang ở trên, dấu cộng có vẻ hỏng. Cứ làm cho hết 4 nước rồi hãy nhìn.']
    ],
    'tang-hai': [
      ['Nhìn gì trên khối', 'Tầng giữa có 4 viên cạnh, và không viên nào có màu vàng. Vậy hãy tìm ở tầng trên một viên cạnh <b>không có màu vàng</b>. Nó có hai màu: một màu ở mặt bên, một màu ngửa lên trên. Cả hai màu đều quan trọng.'],
      ['Dóng thành vạch dọc', 'Xoay U cho tới khi màu ở mặt bên của viên cạnh nằm ngay trên tâm cùng màu. Mặt đó lúc này có một vạch dọc liền màu từ tầng trên xuống tâm. Xoay cả khối để mặt có vạch dọc hướng về phía bạn.'],
      ['Sang phải hay sang trái', 'Giờ nhìn màu <b>ngửa lên trên</b> của viên cạnh. Nó trùng với tâm của mặt bên phải thì viên cạnh phải đi sang phải, trùng với tâm của mặt bên trái thì đi sang trái. Sang phải dùng U R U′ R′ U′ F′ U F. Sang trái dùng U′ L′ U L U F U′ F′, chính là công thức kia soi gương.'],
      ['Cách nhớ công thức 8 nước', 'Cắt làm hai cụm 4 nước. Với công thức sang phải: cụm đầu U R U′ R′ làm với mặt phải, cụm sau U′ F′ U F làm với mặt trước. Trong mỗi cụm, các nước đi theo cặp “đi rồi về”. Nước đầu tiên dễ quên nhất, hãy nhớ: <b>cạnh sắp sang bên nào thì trước hết đẩy nó ra xa bên đó</b>. Sang phải thì nước đầu đẩy nó sang trái, sang trái thì đẩy nó sang phải.'],
      ['Công thức thật ra làm gì', 'Nửa đầu đẩy viên cạnh ra xa rồi nhấc một góc trắng của tầng 1 lên, đặt cạnh viên cạnh thành một cặp. Nửa sau đưa cả cặp ấy trở xuống: góc trắng về lại chỗ cũ, còn viên cạnh đi theo vào đúng chỗ ở tầng giữa. Vì góc trắng được trả về nên tầng 1 vẫn nguyên vẹn. Giữa chừng công thức tầng 1 trông như bị hỏng, đó là bình thường.'],
      ['Khi cạnh kẹt ở tầng giữa', 'Nếu cả 4 cạnh ở tầng trên đều có màu vàng mà tầng hai chưa xong, tức là có viên cạnh đang nằm ở tầng giữa nhưng sai chỗ hoặc lật ngược màu. Cầm nó ở vị trí trước–phải, làm công thức sang phải 1 lần. Một viên cạnh có màu vàng sẽ thế chỗ nó, còn nó bị đẩy lên tầng trên. Rồi giải nó như thường.'],
      ['Lỗi hay gặp', 'Một là dóng vạch dọc sai: nhìn nhầm màu ngửa lên thành màu mặt bên. Hai là chọn nhầm hướng phải, trái. Ba là xoay cả khối khi đang làm dở công thức. Nếu lỡ đặt sai, đừng cố sửa bằng tay: coi nó là một cạnh bị kẹt và đẩy nó ra bằng chính công thức này.']
    ],
    'chu-thap-vang': [
      ['Từ bước này mọi thứ khác đi', 'Hai tầng dưới đã xong, nên từ giờ bạn không được xoay tự do nữa: xoay bừa một mặt bên là phá ngay phần đã làm. Mọi thay đổi ở tầng trên đều phải làm bằng công thức, tức là một chuỗi nước làm xáo trộn tạm thời rồi tự trả hai tầng dưới về nguyên vẹn. Riêng nước U thì vẫn xoay thoải mái.'],
      ['Nhìn gì trên khối', 'Chỉ nhìn mặt vàng ở trên, và chỉ nhìn <b>4 ô cạnh</b> quanh tâm vàng. Các ô góc màu gì cũng mặc kệ. Bạn sẽ thấy một trong bốn hình: dấu chấm (không ô cạnh nào vàng), chữ L (hai ô cạnh kề nhau vàng), vạch ngang (hai ô cạnh đối nhau vàng), hoặc dấu cộng (đủ bốn ô).'],
      ['Công thức và cách nhớ', 'Chỉ có một công thức cho cả bước: F R U R′ U′ F′. Ở giữa chính là bộ 4 nước quen thuộc “lên, đẩy, xuống, kéo”, hai đầu là F và F′. Nhớ thành câu: <b>mở cửa, làm việc, đóng cửa</b>. Quên nước F′ cuối cùng là hai tầng dưới hỏng.'],
      ['Cầm thế nào cho từng hình', '<b>Vạch:</b> xoay U cho vạch nằm ngang (từ trái sang phải), làm 1 lần là ra dấu cộng.<br><b>Chữ L:</b> xoay U cho hai cánh của chữ L chỉ về phía sau và phía trái, làm 2 lần liền nhau.<br><b>Dấu chấm:</b> cầm thế nào cũng được, làm 1 lần sẽ ra chữ L, rồi làm tiếp như chữ L.<br>Các hình đi theo đúng một thứ tự: chấm, chữ L, vạch, dấu cộng. Mỗi lần làm công thức là tiến một bậc.'],
      ['Vì sao hướng cầm quan trọng', 'Mỗi lần làm, công thức lật hai viên cạnh nhất định của tầng trên. Cầm đúng hướng thì nó lật đúng hai viên đang sai. Cầm sai hướng thì nó lật một viên sai và một viên đã đúng, kết quả là bạn đứng yên một chỗ hoặc lùi lại một bậc. Nếu làm mãi không ra dấu cộng, gần như chắc chắn là do hướng cầm, không phải do công thức.'],
      ['Kiểm tra', 'Mặt trên có dấu cộng vàng. Các ô góc có thể vàng hoặc chưa, và màu bên hông của các cạnh vàng có thể chưa khớp tâm: đó là việc của các bước sau. Hai tầng dưới phải còn nguyên; nếu không còn nguyên thì bạn đã bỏ sót một nước, thường là F′.']
    ],
    'canh-vang': [
      ['Nhìn gì trên khối', 'Đã có dấu cộng vàng, bây giờ nhìn sang 4 mặt bên. Mỗi viên cạnh vàng còn một màu ở mặt bên. Mục tiêu là màu đó trùng với tâm ngay bên dưới, để mỗi mặt bên có một vạch dọc giữa liền màu từ trên xuống dưới.'],
      ['Xoay U để đếm', 'Xoay U từng nấc và đếm xem ở mỗi vị trí có mấy cạnh khớp tâm. Luôn tìm được vị trí có ít nhất 2 cạnh khớp. Nếu có vị trí cả 4 cạnh cùng khớp thì bước này xong luôn, không phải làm gì. Nếu chỉ 2 cạnh khớp, hãy xem hai cạnh đó <b>kề nhau</b> hay <b>đối nhau</b>.'],
      ['Cách cầm', '<b>Hai cạnh khớp kề nhau:</b> xoay cả khối để một cạnh ở phía sau và một cạnh ở bên phải. Làm công thức 1 lần là cả 4 cạnh đều khớp.<br><b>Hai cạnh khớp đối nhau:</b> làm công thức 1 lần ở hướng nào cũng được. Sau đó xoay U đếm lại, bạn sẽ có hai cạnh khớp kề nhau, và làm như trường hợp trên.'],
      ['Công thức và cách nhớ', 'Công thức là R U R′ U R U2 R′ U. Mặt phải chỉ làm một việc: lên, xuống, lên, xuống. Sau mỗi lần mặt phải động thì tầng trên xoay một cái, luôn cùng một chiều, riêng lần thứ ba xoay gấp đôi. Đọc thành nhịp: <b>lên U, xuống U, lên U-U, xuống U</b>. Trong công thức này không có nước U′ nào; nếu tay bạn định xoay ngược tầng trên thì đó là sai.'],
      ['Vì sao dấu cộng vàng vẫn còn', 'Công thức này chỉ đổi chỗ các viên cạnh của tầng trên chứ không lật chúng, nên mặt vàng của chúng vẫn ngửa lên. Các viên góc thì bị xáo trộn, nhưng ở bước này ta chưa quan tâm tới góc. Hai tầng dưới trở về nguyên vẹn sau nước cuối.'],
      ['Lỗi hay gặp', 'Quên nước U cuối cùng: các cạnh thật ra đã đúng với nhau nhưng cả tầng trên lệch một nấc, chỉ cần xoay U thử là thấy. Nhầm U2 thành U ở lần thứ ba. Và đếm cạnh khớp mà không xoay thử đủ 4 vị trí của tầng trên, nên tưởng không có cạnh nào khớp.']
    ],
    'dat-goc-vang': [
      ['Thế nào là góc đúng chỗ', 'Mỗi góc của tầng trên nằm giữa ba tâm: tâm vàng và hai tâm mặt bên. Một viên góc <b>đúng chỗ</b> khi ba màu của nó chính là ba màu của ba tâm đó, kể cả khi nó đang bị xoay lệch, mặt vàng quay ra ngoài. Bước này chỉ cần đúng chỗ. Việc xoay cho mặt vàng ngửa lên để dành cho bước cuối.'],
      ['Nhìn gì trên khối', 'Xem lần lượt 4 góc của tầng trên. Với mỗi góc, đọc ba màu của nó rồi so với ba tâm xung quanh, không cần màu nào nằm ở mặt nào. Sẽ gặp một trong ba trường hợp: cả 4 góc đã đúng chỗ (bỏ qua bước này), đúng một góc đúng chỗ, hoặc không góc nào đúng chỗ.'],
      ['Cách cầm', '<b>Có một góc đúng chỗ:</b> xoay cả khối để góc đó nằm ở vị trí trước, phải, trên. Làm công thức 1 lần rồi kiểm tra lại, chưa xong thì làm thêm 1 lần nữa vẫn ở hướng đó.<br><b>Không có góc nào đúng chỗ:</b> làm công thức 1 lần ở hướng bất kỳ. Sau đó sẽ có đúng một góc về đúng chỗ, cầm nó ở trước, phải, trên và làm tiếp.'],
      ['Công thức và cách nhớ', 'Công thức là U R U′ L′ U R′ U′ L. Tầng trên lắc qua lắc lại: U, U′, U, U′. Xen giữa, hai tay thay phiên nhau: <b>phải lên, trái lên, phải xuống, trái xuống</b>. Hai mặt bên cùng đi lên rồi cùng đi xuống, nên hai tầng dưới được trả về nguyên vẹn.'],
      ['Công thức thật ra làm gì', 'Góc ở trước–phải–trên đứng yên. Ba góc còn lại đổi chỗ cho nhau theo vòng tròn. Các viên cạnh không bị động tới, nên kết quả của bước trước vẫn còn. Vì ba góc chạy vòng tròn nên làm tối đa 2 lần là chúng về đúng chỗ. Đó cũng là lý do phải cầm góc đã đúng ở trước–phải–trên: nó là góc duy nhất được giữ yên.'],
      ['Lỗi hay gặp', 'Xoay tầng trên bằng U để đưa góc đúng về trước–phải. Làm vậy là sai: U kéo cả các cạnh đã khớp đi theo. Ở bước này phải <b>xoay cả khối</b>, tầng trên đứng yên so với các tầng dưới. Lỗi thứ hai là thấy mặt vàng của góc chưa ngửa lên nên tưởng nó chưa đúng chỗ: hãy so màu với tâm, đừng nhìn hướng.']
    ],
    'xoay-goc-vang': [
      ['Nhìn gì trên khối', 'Cầm vàng ở trên. Cả 4 góc đã đúng chỗ, chỉ còn một số góc có mặt vàng quay ra mặt bên thay vì ngửa lên. Chọn một góc như vậy và cầm khối sao cho nó ở vị trí <b>trước, phải, trên</b>.'],
      ['Công thức và cách nhớ', 'Công thức là R′ D′ R D, đọc: <b>xuống, đáy, lên, đáy</b>. Vẫn là nhịp 4 nước quen thuộc, chỉ khác là làm với tầng đáy thay cho tầng trên và bắt đầu bằng nước đi xuống. Làm 2 lần thì viên góc xoay tại chỗ một phần ba vòng. Nhìn lại: mặt vàng đã ngửa lên thì xong góc này, chưa thì làm thêm 2 lần nữa. Mỗi góc cần 2 hoặc 4 lần.'],
      ['Chuyển sang góc tiếp theo', 'Xong một góc thì <b>chỉ xoay U</b> để đưa góc sai tiếp theo tới vị trí trước–phải–trên, rồi lặp lại công thức. Tuyệt đối không xoay cả khối. Mặt trước và mặt phải phải giữ nguyên từ đầu tới cuối bước này, vì công thức đang dùng chúng để cất tạm phần còn lại của khối.'],
      ['Vì sao hai tầng dưới trông như hỏng', 'Sau khi xoay xong góc đầu tiên, hai tầng dưới trông rối tung. Đó là bình thường và không được sửa. Mỗi lần xoay một góc theo một chiều thì phần dưới bị vặn đi một chút. Khi bạn xoay nốt các góc còn lại, tổng các lần vặn ấy triệt tiêu nhau, và hai tầng dưới tự trở lại như cũ đúng vào lúc góc cuối cùng ngửa vàng. Hãy tin công thức, cứ làm tiếp.'],
      ['Hai điều bắt buộc', 'Một: luôn làm <b>trọn bộ 4 nước</b>, kết thúc bằng D, rồi mới nhìn hoặc xoay U. Dừng giữa bộ rồi xoay U là hỏng khối. Hai: giữa các góc chỉ xoay U. Nếu bạn hay đếm nhầm, hãy đọc thành tiếng “xuống, đáy, lên, đáy” và đếm “một, hai” sau mỗi bộ.'],
      ['Kết thúc', 'Khi góc cuối cùng ngửa vàng, hai tầng dưới đã liền màu trở lại. Tầng trên có thể còn lệch một hai nấc: xoay U cho khớp là cả 6 mặt đồng màu. Nếu tới đây khối vẫn rối, lỗi gần như chắc chắn là đã dừng giữa bộ 4 nước hoặc đã xoay cả khối. Khi đó dựng lại từ các bước trước, phần lớn khối vẫn còn đúng nên sẽ nhanh hơn lần đầu.']
    ]
  };
  function longHtml(id) {
    return (LONG[id] || []).map(function (s) { return '<h4>' + s[0] + '</h4><p>' + s[1] + '</p>'; }).join('');
  }

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
      var nodes = main.querySelectorAll('h1, h1 + p, .hold-text, .walk-info h4, .walk-info p'), parts = [];
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
            '<p><b>Xong bước này khi.</b> ' + g.check + '</p>' +
            '<div class="walk-long">' + longHtml(st.id) + '</div>',
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
