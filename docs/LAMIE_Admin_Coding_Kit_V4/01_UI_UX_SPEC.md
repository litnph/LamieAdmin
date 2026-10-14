# Đặc tả UI/UX — Lamie Admin

## 1. Phạm vi

| Bề mặt | Yêu cầu |
|---|---|
| Sidebar | Lamie gọn phía trên; Tạo đơn dễ thấy; Tổng quan, Đơn hàng, Lịch giao; loại bỏ lối vào thanh toán/COD riêng của prototype trước |
| Đơn hàng | Là màn hình chính; lưới giàu thông tin, tóm tắt, chi tiết và bảng chuẩn bị |
| Modal tóm tắt | Xem nhanh và action theo tình trạng hiện tại |
| Trang chi tiết | Route riêng; đầy đủ các phần nghiệp vụ hiện hữu |
| Tạo đơn | Người đặt trước, người nhận tùy chọn |
| Tổng quan / Lịch giao | Đồng bộ dữ liệu và hành vi mới |
| Chủ đề | Giữ chủ đề hiện có, phối đồng bộ; prototype có 6 lựa chọn |
| Báo cáo | Không thiết kế lại giao diện trong đợt này; sửa mapping dữ liệu nếu bị ảnh hưởng |

Các menu hiện hữu khác ngoài phạm vi vẫn giữ nguyên. Sidebar rút gọn trong mockup chỉ thể hiện những màn hình cần thay đổi, không phải yêu cầu xóa module thật như sản phẩm, kho hoặc báo cáo.

## 2. Lưới đơn hàng

Thứ tự nhóm cột tham chiếu:

| Nhóm cột | Nội dung |
|---|---|
| Đơn / lịch hẹn | Mã có liên kết chi tiết, giờ riêng, sản phẩm; các dòng group theo ngày |
| Người đặt / kênh | Tên, số điện thoại, kênh đặt |
| Nhận hàng | Ghé lấy / Ship nội thành / Ship tỉnh; người nhận hoặc “Chưa có người nhận”; sửa ship thực tế nhanh cho đơn ship |
| Tiến trình | Bước xử lý; nhóm theo dõi; lý do tạm dừng nếu có |
| Thanh toán | Tổng đơn; Đã thanh toán hoặc Chưa thanh toán đủ; còn Xđ khi thiếu |
| Nội dung thêm | Không kèm hoặc icon tĩnh + Thiệp/Banner/Thiệp & Banner |
| Thao tác | Xem tóm tắt và Xem chi tiết là hai nút riêng, có nhãn rõ |

Không tải chi tiết từng đơn để lấy các trường cơ bản này. Danh sách cần đủ thông tin từ list DTO. Nếu nội dung thiệp dài, có thể lazy-load đúng nội dung khi hover/click một lần, có cache và loading, không tạo N+1 khi tải lưới.

### Lọc và phạm vi

- Mặc định 7 ngày tiếp theo **bao gồm hôm nay**, tính theo timezone cửa hàng. “3 ngày” cũng gồm hôm nay.
- Tất cả, Hôm nay, Ngày mai, 3 ngày, 7 ngày, Tùy chọn; khoảng ngày bao gồm hai đầu.
- Checkbox kèm đơn trễ/chờ tiền từ trước ngày đầu kỳ.
- Bộ lọc tiến trình, thanh toán và cách nhận; tìm mã, người đặt/điện thoại, sản phẩm; tìm thêm theo kênh/người nhận nếu hợp hệ thống.
- 5 thẻ nhóm: đang trễ, chưa giao hôm nay, sắp tới, đã giao chờ tiền, hoàn tất. Hủy nằm riêng.
- Hoàn tất dùng ngày hoàn tất khi xác định phạm vi để đơn giao hôm trước nhưng đủ tiền hôm nay vẫn thấy. Nhóm hiển thị vẫn theo ngày hẹn, có chú thích khi cần.
- Tổng đếm không được tính chỉ trên trang phân trang hiện tại. Định nghĩa query đếm trong BE spec.
- Chuyển từ chi tiết về lưới giữ filter, search, page và vị trí cuộn phù hợp.

### Thiệp / banner

Click/tap icon luôn mở được modal nội dung. Hover/focus có thể xem nhanh, không phụ thuộc hover. Nội dung giữ xuống dòng, escape như text; không render HTML khách nhập. Modal có mã đơn, loại nội dung, người đặt, nội dung nguyên văn. Tooltip không che mất hành động chính, không bị cắt bởi khung bảng cuộn. Khi chọn cả thiệp và banner, giữ cấu trúc hiện hữu nếu đã có hai trường riêng; không trộn mất nội dung.

### Mobile và accessibility

Desktop dùng table/columns dễ so sánh. Mobile có thể chuyển thành card như mockup, giữ đủ thông tin và cả hai nút. Không ép lưới rộng ra toàn viewport. Form/modal/tooltip dùng được bằng bàn phím, nhãn input gắn đúng, focus trap và trả focus khi đóng, Escape đóng, trạng thái loading/disabled rõ.

## 3. Xem tóm tắt

Modal gồm mã đơn, người đặt, sản phẩm, số lượng/tổng, giờ/ngày hẹn, cách nhận, liên hệ người nhận nếu có, người phụ trách, thiệp/banner, ghi chú, tiến trình và thanh toán.

Action chính thay đổi theo bước: xác nhận / bắt đầu chuẩn bị / checklist / bàn giao / nhận tại tiệm / đã giao / đánh dấu đã thanh toán. Action phụ: ship nhanh, bổ sung người nhận, xử lý tạm dừng và mở trang chi tiết. Action không đủ điều kiện cần nêu lý do; không làm mất trạng thái đã nhập.

Sau lưu thành công, modal và các màn hình liên quan dùng dữ liệu server mới. Không reset filter lưới. Không mở tiếp modal chồng nhiều tầng gây mất focus; thay nội dung hoặc quản lý một dialog stack rõ ràng.

## 4. Trang chi tiết

Tạo route theo router dự án, ví dụ `/admin/orders/:id` (chỉ là ví dụ). Hỗ trợ deep link, reload và not-found/forbidden.

Các phần: header mã đơn + action; trạng thái; stepper; người đặt/kênh; người nhận/địa chỉ/cách nhận/lịch hẹn; sản phẩm; thiệp/banner và ghi chú; phân công/ngày chuẩn bị/checklist; lịch sử; thanh toán; phí ship thực tế; mốc giao/hoàn tất và xử lý ngoại lệ.

Thông tin chưa cung cấp hiện rõ, không tự điền bằng người đặt. Có action cập nhật người nhận ngay tại phần tương ứng. Giữ những thông tin nghiệp vụ thật vốn có nhưng prototype đơn giản chưa thể hiện.

## 5. Tạo đơn

Thứ tự:
1. Người đặt: tên, điện thoại/liên hệ hợp lệ theo hệ thống, kênh đặt.
2. Sản phẩm, số lượng, đơn giá; ngày/giờ nhận hoặc giao; cách nhận.
3. Người nhận: tên, điện thoại, địa chỉ **không bắt buộc khi tạo**. Nút “Người nhận là người đặt” sao chép chủ động tên/điện thoại; không suy ra địa chỉ.
4. Nội dung thêm: Không / Thiệp / Banner / Cả hai, lời nhắn nguyên văn, ghi chú nội bộ.
5. Khối tổng tiền: tiền sản phẩm, ship tính khách, tổng đơn, tiền cọc/đã thanh toán, số còn lại; có chọn đã thanh toán đủ.

Prototype minh họa một dòng sản phẩm. Nếu sản phẩm thật hỗ trợ nhiều dòng/giảm giá, tiếp tục hỗ trợ và tính tiền bằng logic hiện hữu. Không hạ cấp về một dòng vì mockup.

Lưu đơn với người nhận trống phải thành công cho cả ship và ghé lấy. Trước bàn giao đơn ship mới bắt buộc thông tin giao cần thiết. Ghé lấy không yêu cầu địa chỉ. Ship khách/ship thực tế bằng 0 cho ghé lấy thông thường, không mất các phụ phí khác đã tồn tại trong hệ thống.

Sau tạo, mở trang chi tiết đơn thật và hiển thị kết quả đã lưu. Xử lý double submit, lỗi server, draft hoặc dữ liệu chưa lưu để không mất form ngoài ý muốn. Không tự động hoàn tất đơn mới dù đã thanh toán đủ.

## 6. Giản lược thanh toán

Không tạo menu Thanh toán & COD, màn hình đối soát hoặc các chỉ số gốc/net/phí trong phần UI này. Trên đơn chỉ có:
- Đã thanh toán.
- Chưa thanh toán đủ → Còn Xđ.

Nút “Đánh dấu đã thanh toán” mở xác nhận số còn lại và cập nhật qua server. Khoản cọc được phản ánh vào số còn lại. Đơn hủy là ngoại lệ: theo dõi khoản cần hoàn ngay trong đơn, không thể hoàn tất. Nếu backend đã có chứng từ tiền, dùng nguồn thật; không tạo dữ liệu ngân hàng giả chỉ để đổi badge.

## 7. Visual và phần không sao chép nguyên

- Bám bố cục, phân cấp thông tin, độ thoáng, cỡ nút và sắc độ trong HTML; không giữ cấu trúc cũ rồi chỉ đổi theme.
- Lucide Animated chỉ sidebar, hover/focus/touch, tôn trọng reduced-motion. Nội dung/thiệp dùng icon tĩnh.
- Màu chủ đề tác động nền, sidebar, text, card và trạng thái; độ tương phản đủ dùng.
- Không đưa localStorage mock data, ngày cố định, số điện thoại giả, route nội bộ bằng biến `page` hoặc mã vendor bundle nguyên khối vào production.
