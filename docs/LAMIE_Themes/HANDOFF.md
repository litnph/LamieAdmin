# Lamie Theme Studio — 6 chủ đề giao diện

## Mở bản mockup

Mở `LAMIE_Theme_Studio.html` trực tiếp bằng trình duyệt. File tự chứa font, icon, CSS và JavaScript; không cần kết nối mạng hay cài đặt thư viện.

Màn hình đầu tiên là Chủ đề giao diện. Chọn thẻ để xem trước trên toàn ứng dụng; có thể chuyển sang Tổng quan, Đơn hàng, Báo cáo doanh thu hoặc Dòng tiền trước khi quyết định. Áp dụng sẽ ghi nhớ lựa chọn trên trình duyệt này; Hủy xem trước trở về chủ đề đã áp dụng. Mặc định là Mint Calm khi chưa có lựa chọn trước đó.

Có thể mở thẳng một hướng thiết kế bằng query, ví dụ `LAMIE_Theme_Studio.html?theme=noir#dashboard`. Lựa chọn qua query chỉ là xem trước, chưa ghi đè lựa chọn đã lưu.

## Đối chiếu ảnh tham chiếu

Thứ tự dưới đây theo số khoanh trên ảnh gốc; hai ảnh 5 và 6 được gửi theo thứ tự ngược nhau.

| Số trên ảnh | Chủ đề | Cặp màu gốc | Hướng thiết kế |
|---|---|---|---|
| 1 | Violet Mist / Sương tím | #3D007A + #E8ECF1 | Sidebar tím đậm, nền xám sương, thẻ trắng, bo tròn mềm, bóng nhẹ |
| 2 | Lime Grove / Vườn nắng | #CFFF74 + #2F3A1D | Sidebar olive, điểm nhấn lime ấm, nền giấy sáng, nút tròn |
| 3 | Violet Glass / Tím trong veo | #5F2CFF + #DFF6FF | Sidebar sáng, nền xanh băng, tím điện, bề mặt trong nhẹ, bo tròn lớn |
| 4 | Mint Calm / Bạc hà tĩnh | #042F32 + #D6FFCB | Sidebar teal sâu, nền bạc hà nhạt, bề mặt phẳng, ít bóng |
| 5 | Cobalt Sand / Xanh & cát | #0038FF + #FFD8B8 | Sidebar cobalt, nền cát ấm, đường viền rõ, bo góc gọn |
| 6 | Lime Noir / Lime đêm | #C8FF00 + #06110D | Giao diện tối toàn diện, bề mặt tối nhiều lớp, lime ở điểm nhấn |

Màu trong bảng lấy từ mã HEX được ghi trong ảnh, không lấy mẫu từ màu JPEG đã bị biến đổi. Các màu nền phụ, màu chữ và đường viền được bổ sung để tạo hệ chủ đề đủ dùng. Không đổ màu bão hòa lên mọi bề mặt.

## Từ chọn màu sang chọn chủ đề

Mỗi lựa chọn gồm cả nền ứng dụng, sidebar, bề mặt thẻ, tiêu đề bảng, chữ chính/phụ, viền, nút, trạng thái chọn, biểu đồ, độ bo góc và bóng đổ. `themes.json` chứa dữ liệu sáu chủ đề; CSS trong HTML dùng các biến ngữ nghĩa dưới `html[data-theme]`.

Giữ nguyên cấu trúc công việc giữa các chủ đề để người dùng không cần học lại vị trí thao tác. Các chủ đề khác nhau về cách phối toàn bộ giao diện, không chỉ đổi màu nút chính.

Chọn một thẻ chưa lưu ngay. Trạng thái xem trước và chủ đề đã áp dụng được phân biệt rõ. Thanh Áp dụng/Hủy luôn dễ truy cập khi đang xem trước, kể cả khi chuyển màn hình. Sau khi áp dụng, thanh này chỉ còn ở trang chọn chủ đề.

Màu cảnh báo, lỗi, tiến độ và thành công vẫn có ý nghĩa nhất quán, có nhãn chữ. Chủ đề tối có bộ màu trạng thái riêng để không xuất hiện các mảng trắng chói hoặc chữ thiếu tương phản.

## Giảm lạm dụng icon chuyển động

- Icon menu và nút Tạo đơn hàng trên sidebar dùng component Lucide Animated từ lucide-animated.com. Chuyển động khi hover/focus hoặc chạm; tự dừng, không lặp liên tục.
- Tiêu đề, bảng, badge, liên kết và nút trong nội dung dùng Lucide tĩnh.
- Bỏ icon trang trí trong bốn thẻ số liệu vì nhãn đã đủ rõ.
- Chỉ icon sidebar đang được tương tác mới chuyển động; không nhấp nháy hoặc tự chạy ở mục đang chọn.
- Chỉ quay icon Làm mới trong lúc thao tác tải minh họa đang chạy; dừng khi xong. Chuyển động công tắc rất ngắn.
- Nút Chuyển động nhẹ tắt các chuyển động này. Luôn tôn trọng `prefers-reduced-motion` của hệ điều hành.
- HTML nhúng runtime React/Motion và các component Lucide Animated đã có trong bộ thiết kế. Adapter chỉ áp dụng trong sidebar, không áp dụng toàn trang. Công tắc Chuyển động nhẹ và reduced motion chặn animation sidebar ở mức điều khiển, không chỉ tắt CSS.
- Ánh xạ icon: Tổng quan → layout-grid; Đơn hàng → cart; Khách hàng → users; Lịch giao → calendar-days; Việc cần làm → clipboard-check; Sản phẩm → sparkles; Kho → boxes; Báo cáo → chart-line; Chi phí → wallet; Cấu hình → settings; Chủ đề → palette; Tạo đơn → plus.

## Những quyết định UX đã giữ

Tổng quan không có bộ lọc Hôm nay / 3 ngày / 7 ngày. Báo cáo chỉ có khoảng ngày tùy chỉnh. Bộ lọc nhanh vẫn nằm ở Đơn hàng. Lamie Admin ở đầu sidebar, gọn và cùng hệ chủ đề.

Màn hình dữ liệu sử dụng nội dung V2: doanh thu theo ngày giao thực tế, dòng tiền theo từng lần thu/chi. Các số liệu và ngày trong HTML là mẫu, không phải dữ liệu cửa hàng hiện tại.

## Tương tác và giới hạn

Đã hoạt động: chọn/xem trước/áp dụng/hủy chủ đề; lưu lựa chọn và thiết lập chuyển động bằng localStorage; điều hướng bốn màn hình dữ liệu và màn hình chủ đề; phím mũi tên chọn thẻ; Tab/Enter; menu drawer trên mobile; đóng drawer bằng Escape; phản hồi nút Làm mới minh họa.

Các thao tác nghiệp vụ như tạo đơn, xuất báo cáo, bộ lọc ngày và tìm kiếm vẫn là thành phần minh họa từ V2. Không kết nối API hoặc lưu dữ liệu nghiệp vụ. Nút minh họa thông báo rõ khi bấm. Các menu ngoài phạm vi chưa có màn hình tương ứng.

Nếu trình duyệt chặn localStorage, chủ đề vẫn áp dụng trong phiên hiện tại và hiển thị thông báo thay vì khẳng định đã lưu.

## Kiểm tra

Đã xuất và xem ảnh sáu chủ đề trên Tổng quan, màn hình chọn chủ đề; kiểm tra thêm bảng/báo cáo ở chủ đề tối, drawer và giao diện mobile. Không có lỗi JavaScript trong luồng kiểm tra. Các trang Tổng quan ở cả sáu chủ đề không tràn ngang tại viewport 1440px; trang chọn chủ đề không tràn ngang tại 390px.

Đã kiểm tra áp dụng rồi tải lại, xem trước rồi hủy, chọn bằng bàn phím và tắt chuyển động. Đã xác nhận icon sidebar chạy khi hover/focus, dừng khi tắt chuyển động hoặc bật reduced motion, và không có icon Lucide Animated ngoài sidebar. Cặp chữ chính/nền, chữ phụ/bề mặt, chữ nút/nút, chữ sidebar/sidebar và chữ mục chọn/nền mục chọn đạt tỷ lệ tương phản ít nhất 5,12:1 trên các token được kiểm tra. Đây là kiểm tra các cặp màu cốt lõi, không phải chứng nhận toàn diện cho mọi trạng thái giao diện.

Ảnh trong `screens/`: màn hình chọn chủ đề và sáu ảnh Tổng quan. Ảnh dài đặt thanh thao tác ở cuối trang để không che nội dung; trong HTML, thanh thao tác được cố định ở cạnh dưới viewport khi cần áp dụng/xem trước.

## Triển khai vào ứng dụng thật

Chuyển các token vào hệ theme của dự án; lưu theme ID, không lưu một mã màu đơn lẻ. Giữ riêng giá trị đang xem trước và giá trị đã lưu. Áp dụng thuộc tính theme trước lần vẽ đầu tiên để tránh chớp màu. Nếu lưu theo tài khoản, đồng bộ theme ID và thiết lập chuyển động qua hồ sơ người dùng.

Tách trạng thái nghiệp vụ khỏi màu thương hiệu. Dùng một bộ component chung cho tất cả theme. Không nhân bản sáu phiên bản logic đơn hàng hoặc báo cáo.
