# Checklist nghiệm thu — FE + BE + tích hợp

Agent đánh dấu từng mục: PASS / FAIL / BLOCKED / NOT RUN, kèm test hoặc bằng chứng. Không đánh dấu PASS chỉ vì prototype đã làm được. Test integration phải dùng API thật trong dev/test và dữ liệu được lưu bền vững.

## A. Giao diện và điều hướng

- [ ] Lưới theo bố cục mới, không chỉ đổi màu từ UI cũ.
- [ ] Mỗi dòng có người đặt, số liên hệ, kênh, cách nhận, trạng thái tiền và số còn lại, nội dung thêm, tiến trình.
- [ ] “Xem tóm tắt” mở modal; “Xem chi tiết” mở trang riêng.
- [ ] Route chi tiết tải trực tiếp/reload được, back về đúng bộ lọc và trang danh sách.
- [ ] Không còn menu đối soát COD trong phần thiết kế này; các menu ngoài phạm vi không bị xóa.
- [ ] Bấm thiệp/banner xem đúng nội dung của đúng đơn, giữ xuống dòng; dữ liệu `<script>` hoặc `<3` là text an toàn.
- [ ] Tap mobile và keyboard đều xem được thiệp; tooltip không là đường duy nhất.
- [ ] Sidebar Lucide Animated hoạt động khi tương tác, reduced-motion được tôn trọng; icon nội dung tĩnh.
- [ ] Theme áp dụng cả modal, form, tooltip, trạng thái lỗi; không chỉ đổi màu nút.
- [ ] Kiểm tra desktop khoảng 1440px, tablet 768px, mobile 390px: không mất thông tin/nút, không tràn toàn trang.
- [ ] Loading, empty, validation, error, saving, disabled, not-found/forbidden rõ ràng.

## B. Tạo đơn và thông tin người nhận

| Ca | Thao tác | Kết quả bắt buộc |
|---|---|---|
| B01 | Tạo ship nội thành, điền người đặt + sản phẩm + lịch, để trống toàn bộ người nhận | Tạo thành công, server lưu nullable, chi tiết hiện chưa cung cấp |
| B02 | Như B01 với ship tỉnh | Vẫn tạo thành công |
| B03 | Tạo ghé lấy, không có người nhận/địa chỉ | Tạo thành công, không bắt buộc bước shipper |
| B04 | Chỉ nhập người đặt rồi xem người nhận | Không tự sao chép |
| B05 | Bấm Người nhận là người đặt | Chỉ sao chép chủ động các trường tương ứng, không bịa địa chỉ |
| B06 | Tạo 2 sản phẩm × 500.000đ + ship 50.000đ, đã trả 300.000đ | Tổng 1.050.000đ, còn 750.000đ; server tính lại |
| B07 | Tạo đơn đã trả đủ nhưng chưa giao | Paid, chưa completed |
| B08 | Chọn Thiệp/Banner nhưng thiếu nội dung | Lỗi đúng trường hoặc quy tắc rõ ràng; không lưu mâu thuẫn có nội dung nhưng rỗng |
| B09 | Giá âm, số lượng không hợp lệ, paid vượt tổng hoặc thiếu người đặt | BE và FE cùng từ chối theo quy tắc hiện hữu |
| B10 | Submit lặp / mạng retry | Một đơn hợp lệ, không tạo trùng do gửi lặp |
| B11 | Lưu rồi reload trình duyệt / mở máy khác | Dữ liệu từ API, không phụ thuộc localStorage mock |

## C. Quy trình xử lý

- [ ] Chờ xác nhận → Đã xác nhận: cần đủ thông tin đã chốt với người đặt, không ép recipient có ngay.
- [ ] Recipient trống vẫn xác nhận, phân công và chuẩn bị được.
- [ ] Lưu checklist một phần không chuyển sẵn sàng; hoàn thành đủ mới chuyển.
- [ ] Tạm dừng giữ bước hiện tại và chặn action đi tiếp; gỡ tạm dừng có audit.
- [ ] Ship sẵn sàng nhưng thiếu tên/điện thoại/địa chỉ nhận: không bàn giao, kể cả gọi API trực tiếp.
- [ ] Bổ sung người nhận rồi bàn giao thành công; ghi thông tin giao nhận.
- [ ] Ghé lấy: sẵn sàng → đã nhận tại tiệm, không cần dispatch/đang giao.
- [ ] Giao chưa thành công không được coi là delivered; hẹn lại → sẵn sàng.
- [ ] Hủy trước giao có lý do, giữ lịch sử và tiền cần hoàn; không complete.
- [ ] Client gửi completed=true hoặc nhảy bước trái phép không vượt được kiểm tra server.

## D. Tiền và hoàn tất

| Ca | Kết quả |
|---|---|
| D01: Đã trả đủ, chưa giao | Không hoàn tất |
| D02: Đã giao, còn nợ | Nhóm đã giao chờ tiền, hiện số còn lại |
| D03: Đã giao rồi xác nhận thanh toán đủ | Tự hoàn tất, thời điểm/audit đúng |
| D04: Trả đủ trước, sau đó giao | Hoàn tất ở thời điểm giao |
| D05: Xác nhận tiền gửi lặp | Không tạo khoản tiền/sự kiện trùng |
| D06: Giao và nhận tiền đồng thời ở hai phiên | Kết quả cuối nhất quán, không lost update |
| D07: Đã giao + paid, actual ship còn null | Vẫn hoàn tất |
| D08: Ship actual 0 | Lưu 0, không biến thành null |
| D09: Cập nhật actual ship 35.000đ | Không đổi ship tính khách và không bắt sửa toàn bộ đơn |
| D10: Tiền thực nhận bị phí khấu trừ | Paid theo nghĩa vụ hợp lệ; dòng tiền đúng số thực nhận, không fake phần chênh và không tính phí hai lần |
| D11: Correction khiến không đủ tiền nữa qua luồng hợp lệ | Recompute hoàn tất, giữ audit; không còn badge completed sai |
| D12: Đơn hủy có cọc | Khoản cần hoàn được giữ, hoàn tiền không làm đơn completed |

Dữ liệu ví dụ D10: tổng 1.040.000đ, cọc 300.000đ, phần nghĩa vụ còn lại 740.000đ, phí ship khấu trừ 40.000đ, tiền về 700.000đ. UI không cần bảng đối soát, BE/báo cáo vẫn phải đúng.

## E. Lọc, đếm, ngày và dữ liệu

- [ ] 7 ngày gồm hôm nay đến ngày +6; 3 ngày đến ngày +2; ngày mai chỉ ngày +1.
- [ ] Timezone cửa hàng đúng ở ranh giới ngày; đơn sát nửa đêm không lệch ngày.
- [ ] Đơn quá khung hẹn → trễ; cùng ngày chưa quá hẹn → chưa giao; ngày tương lai → sắp tới.
- [ ] Khoảng tùy chọn không cho ngày kết thúc trước ngày bắt đầu.
- [ ] Bật backlog kéo đơn trễ/chờ tiền trước kỳ; tắt loại bỏ đúng.
- [ ] Đơn giao hôm trước nhưng đủ tiền hôm nay vẫn có trong phạm vi hoàn tất hôm nay.
- [ ] Search / payment / fulfillment / stage kết hợp đúng; text trống không gây lỗi.
- [ ] Phân trang không đổi aggregate counts; counts/lưới theo phạm vi được chú thích thống nhất.
- [ ] Không N+1 query hoặc gọi API detail cho từng dòng để lấy thông tin cơ bản.
- [ ] Tổng quan, lưới, chi tiết, modal và lịch cập nhật sau mutation và reload.

## F. BE và migration

- [ ] Có auth/permission phía server cho từng action; kiểm tra phạm vi cửa hàng nếu có.
- [ ] Có audit actor/time/reason cho đổi bước, tiền, ship và recipient.
- [ ] Concurrency conflict có phản hồi FE, không silent overwrite.
- [ ] Tiền không dùng số thực nhị phân gây sai làm tròn.
- [ ] Legacy hoàn tất=đã giao được mapping đúng; không mass-mark paid.
- [ ] Legacy thiếu timestamp không bị bịa ngày giao/thu; report rà soát có record chưa xác định.
- [ ] Migration kiểm tra trên dev/test, bảo toàn dữ liệu và client phụ thuộc API cũ.
- [ ] Doanh thu dùng ngày giao thực tế, dòng tiền dùng sự kiện tiền thật; không lấy completedAt thay thế.
- [ ] Không đưa fixture vào dữ liệu production, không tự chạy migration phá hủy hoặc deploy production.

## G. Điều kiện bàn giao

- [ ] FE đã hoàn thiện cấu trúc mới.
- [ ] BE cần thiết đã sửa và tích hợp, không để action chính chỉ dùng mock.
- [ ] Build/lint/typecheck và test phù hợp đã chạy, ghi chính xác kết quả.
- [ ] Có hướng dẫn chạy FE + BE, migration dev/test, dữ liệu test và cấu hình không chứa secrets.
- [ ] Có bảng mapping yêu cầu → code/API → test; mọi NOT RUN/BLOCKED được nêu rõ.

## Các đơn tham chiếu trong fixture

- LM-301: chờ xác nhận, có tạm dừng, thiếu người nhận, có thiệp.
- LM-303: đang chuẩn bị, thiếu hoa, đã trả một phần.
- LM-304: ghé lấy, sẵn sàng, trả đủ → nhận tại tiệm thì hoàn tất.
- LM-307: đã giao, còn 740.000đ → xác nhận paid thì hoàn tất.
- LM-308: đã giao và trả đủ, ship actual chưa biết → vẫn hoàn tất.
- LM-309: giao ngày mai, cần chuẩn bị hôm nay.
- LM-312: giao lỗi, có thể hẹn lại.
- LM-313: hủy, đã nhận cọc → cần theo dõi hoàn tiền.

Fixture cố định ngày 12/10/2026 10:30; test tự động nên inject clock tương ứng. Production dùng clock thực tế.
