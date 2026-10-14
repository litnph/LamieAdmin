# Backend — quy tắc, dữ liệu và contract cần đáp ứng

Đây là contract nghiệp vụ, không áp đặt tên bảng, enum số, framework hoặc URI. Agent phải mapping vào hệ thống hiện tại, giữ các quy tắc đã tồn tại không xung đột và chỉ bổ sung phần thiếu. Khảo sát trước FE để định contract; triển khai phần BE còn thiếu sau khi hoàn thiện FE.

## 1. Ba khái niệm độc lập

### Tiến trình xử lý

| Bước nguồn | Action | Kết quả / điều kiện |
|---|---|---|
| Chờ xác nhận | Xác nhận đơn | Đã xác nhận; mẫu/giá/lịch hẹn/phương thức liên hệ đã chốt; người nhận vẫn có thể trống |
| Đã xác nhận | Bắt đầu chuẩn bị | Đang chuẩn bị; người phụ trách và ngày chuẩn bị; không tạm dừng |
| Đang chuẩn bị | Lưu checklist | Giữ bước; lưu từng phần |
| Đang chuẩn bị | Sẵn sàng | Đủ checklist bắt buộc, không tạm dừng |
| Sẵn sàng, đơn ship | Bàn giao | Đang giao; người nhận, liên hệ và địa chỉ đủ; thông tin vận chuyển theo hệ thống |
| Sẵn sàng, ghé lấy | Khách đã nhận | Đã giao/đã nhận; bỏ qua đang giao; không bắt buộc người nhận |
| Đang giao | Giao thành công | Đã giao, ghi thời điểm thực tế |
| Đang giao | Giao chưa thành công | Ngoại lệ giao lỗi, ghi lý do |
| Giao lỗi | Hẹn giao lại | Sẵn sàng, lịch hẹn mới, không ghi nhận đã giao |
| Trước bàn giao | Hủy | Đã hủy, lý do; giữ khoản tiền đã có và nhu cầu hoàn tiền |

Tạm dừng là thuộc tính orthogonal (reason, actor, time) giữ nguyên bước. Chờ cọc/thiếu hoa/chờ khách là lý do, không thêm một loạt enum tiến trình. Chuyển tiếp bị chặn khi còn tạm dừng. Xử lý giao trả/hủy sau giao dùng quy trình hiện hữu, không giả thành hủy trước giao.

### Thanh toán hiển thị

- `Đã thanh toán`: nghĩa vụ thanh toán của đơn đã được xác nhận đáp ứng đủ.
- `Chưa thanh toán đủ`: chưa đủ; trả về số còn phải thanh toán.
- Đã có cọc thì số còn lại phải trừ đúng khoản được ghi nhận.
- Nếu có đơn miễn phí hợp lệ trong hệ thống, nghĩa vụ bằng 0 không cần khoản thu giả; vẫn cần giao để hoàn tất.
- Đơn hủy và hoàn tiền dùng trạng thái ngoại lệ hiện hữu, không hiện “còn phải trả” như đơn đang kinh doanh.

### Nhóm theo dõi

Ưu tiên xác định:
1. Hủy/ngoại lệ ngoài phạm vi không gộp vào hoàn tất.
2. Đã giao + đã thanh toán đủ → Hoàn tất.
3. Đã giao + chưa đủ → Đã giao · Chờ tiền.
4. Chưa giao + quá hạn giao dự kiến → Đang trễ.
5. Chưa giao + lịch hôm nay và chưa quá hạn → Chưa giao.
6. Chưa giao + ngày tương lai → Sắp tới.

Nếu lịch có khung giờ, quá hạn tính từ cuối khung; nếu chỉ giờ hẹn, dùng giờ hẹn. Dữ liệu legacy chưa có lịch phải được đánh dấu cần bổ sung, không tự đưa vào nhóm sắp tới. Năm nhóm không phải năm bước xử lý: một đơn đang chuẩn bị có thể đang trễ.

## 2. Hoàn tất và các mốc thời gian

`isCompleted = đã giao/nhận thành công && nghĩa vụ thanh toán đã đủ && không bị hủy`.

Server là nơi quyết định và trả kết quả. Ghi `deliveredAt`, thời điểm xác nhận thanh toán đủ, `completedAt` cùng audit phù hợp. Khi có dữ liệu sự kiện đầy đủ, completedAt là thời điểm hai điều kiện cùng đúng. Nếu trả đủ trước giao thì hoàn tất ở thời điểm giao. Nếu giao trước trả đủ thì hoàn tất ở thời điểm thanh toán được xác nhận đủ.

Phí ship thực tế chưa biết không ngăn ghi sự kiện giao hoặc hoàn tất. Không có action “Hoàn tất bất kể điều kiện”.

Lưu thời gian theo chuẩn hiện tại (ưu tiên UTC cho instant), quy đổi ngày theo `Asia/Ho_Chi_Minh`. Ngày lịch hẹn là ngày địa phương, không được lệch ngày do parse UTC. Query ngày cuối kỳ dùng đầu ngày kế tiếp loại trừ để không mất giao dịch cuối ngày.

Nếu chỉnh tiền hoặc đảo giao dịch làm đơn không còn đủ điều kiện, server phải tính lại trạng thái; audit thay đổi và cập nhật mốc hoàn tất hiện hành theo chính sách hệ thống. Không để badge hoàn tất cũ tồn tại sai sau điều chỉnh. Nếu chưa có luồng correction, không thêm toggle tùy tiện cho mọi người dùng; dùng quyền và action sửa sai hiện hữu.

## 3. Dữ liệu cần có (mapping, không mặc định tạo bảng mới)

| Nhóm | Dữ liệu tối thiểu |
|---|---|
| Định danh | Id thật, mã đơn, version/concurrency token theo stack |
| Người đặt | Tên/liên hệ, customer id nếu có; snapshot thông tin đơn không phụ thuộc tên khách thay đổi về sau |
| Kênh | Mã ổn định và tên hiển thị: Facebook, Instagram, Zalo, Website, Tại tiệm, Điện thoại, Khác; dùng master data hiện hữu nếu có |
| Nhận hàng | Loại ghé lấy/ship nội thành/ship tỉnh; người nhận, điện thoại, địa chỉ nullable ở thời điểm tạo |
| Lịch | Ngày/giờ hẹn hoặc khung hẹn, ngày chuẩn bị, timezone |
| Sản phẩm | Các order lines, số lượng, giá, tổng/giảm giá theo pricing hiện hữu |
| Nội dung | Loại thiệp/banner/cả hai/không, nội dung nguyên văn; tách hai nội dung nếu mô hình hiện tại đã hỗ trợ; ghi chú nội bộ |
| Chuẩn bị | Người phụ trách, checklist, bước xử lý, hold/reason |
| Tiền | Tổng nghĩa vụ, khoản đã được ghi nhận thanh toán, số còn lại, trạng thái; liên kết chứng từ nếu có |
| Ship | Ship tính khách và ship thực tế độc lập; thực tế nullable, 0 hợp lệ |
| Audit | Created/modified actor/time; event history; mốc giao/đủ tiền/hoàn tất; lý do hủy/điều chỉnh |

Backend tính lại tổng và số còn lại; không tin client gửi total/isCompleted. Tiền dùng kiểu chính xác theo chuẩn dự án, không binary floating point gây sai VND. Validation không âm, quantity hợp lệ; không thu vượt nghĩa vụ trừ khi hệ thống có nghiệp vụ ghi nhận thừa riêng.

## 4. Xác nhận thanh toán không được làm sai dòng tiền

**Yêu cầu UI mới:** đơn giản trạng thái; không cần màn hình đối soát COD. **Yêu cầu dữ liệu vẫn giữ:** doanh thu theo ngày giao thực tế, dòng tiền theo ngày tiền thực nhận/chi.

Agent phải kiểm tra mô hình hiện hữu và chọn cách tương thích:

- Nếu hệ thống đã có receipts/settlements/allocations: tái sử dụng nguồn tiền và phân bổ thật. Không tạo thêm receipt bằng số còn thiếu nếu đó chỉ là thao tác xác nhận trạng thái. Nếu đã tồn tại chứng từ đủ, action có thể xác nhận/recompute và liên kết chứng từ.
- Nếu hệ thống hiện chỉ lưu thanh toán ở mức đơn: lưu xác nhận nghĩa vụ thanh toán có actor/time và giá trị được công nhận ở mức đơn. Phải phân biệt metadata này với chứng từ tiền thực tế. Không dùng nó làm dòng tiền ngân hàng khi không có ngày/số tiền thực nhận.
- Cọc nhập khi tạo đơn phải dùng cơ chế ghi nhận tiền hiện tại, có ngày thu đúng; không mặc định cọc cũ vừa được nhận hôm nay khi nhập dữ liệu lịch sử.
- Không xóa COD, phí khấu trừ hoặc ledger đang có ở BE chỉ vì giản lược FE. Không xây mới một hệ thống đối soát kế toán lớn trong phạm vi này.

Ví dụ kiểm tra tính đúng: đơn tổng 1.040.000đ, cọc 300.000đ; khoản còn lại 740.000đ được thanh toán thông qua bên giao, khấu trừ ship 40.000đ, tiền ngân hàng về 700.000đ. Khi có căn cứ xác nhận đủ, trạng thái đơn là Đã thanh toán. Không tạo nợ giả 40.000đ; không khai báo nhận ngân hàng 740.000đ; không cộng ship 40.000đ hai lần. UI chỉ cần trạng thái, không cần bảng gross/net.

Nếu nguồn tiền cần thiết chưa đủ để xác nhận tự động, không giả số liệu cho demo. Dùng action xác nhận có audit phù hợp mô hình hoặc giữ yêu cầu bổ sung dữ liệu thật qua luồng đã có; nêu rõ quyết định mapping trong báo cáo triển khai.

## 5. API/capability cần có

Tên bên dưới là khả năng, không bắt buộc URI mới:

| Capability | Input quan trọng | Response / xử lý |
|---|---|---|
| List orders | date range, backlog, group, stage, paid filter, fulfillment, search, pagination/sort | Dữ liệu dòng đầy đủ, total, counts, version |
| Summary | id | Thông tin tóm tắt + action availability; có thể dùng detail query đã tối ưu |
| Detail | id | Người đặt/nhận, lines, nội dung, tiền, lịch/checklist/history/mốc thời gian |
| Create | buyer, channel, fulfillment, schedule, nullable recipient, lines, extras, khoản tiền theo model | Đơn persisted; id/code; tổng và trạng thái server |
| Update recipient | id, thông tin nullable, version | Không tự sao chép buyer; validate trước dispatch ở action tương ứng |
| Quick actual shipping | id, actual cost nullable/non-negative, version | Không sửa ship tính khách, audit |
| Confirm / prepare / ready / dispatch / delivered | id, command-specific fields, version | Validate transition/required fields/hold trên server |
| Checklist / assignment / hold / resume | id, patch cụ thể, version | Lưu từng phần, audit |
| Payment confirmation | id, confirmation intent/evidence/reference theo mô hình, version/idempotency key | Tính lại paid/remaining/completion, không duplicate tiền |
| Retry / cancel / refund | Theo capability hiện hữu + reason/version | Không xóa lịch sử, không nhầm hủy với hoàn tất |

Trả lỗi field-level hoặc mã nghiệp vụ rõ để FE hiển thị. Forbidden/not-found/conflict/validation lỗi phải được phân biệt. Kiểm tra quyền và phạm vi cửa hàng/tenant nếu ứng dụng có nhiều cửa hàng; không tin id người dùng/actor từ client.

### Phạm vi đếm

Đề xuất bám mockup: 5 thẻ đếm từ tập đơn trong khoảng ngày + backlog, **trước** selected group, search, stage, payment, fulfillment; nhãn thẻ nêu rõ phạm vi. Total danh sách sau tất cả bộ lọc, độc lập pagination. Nếu UX hệ thống đã dùng counts theo bộ lọc khác, thống nhất FE và BE, ghi rõ nhãn; không trộn ngầm hai cách tính.

List endpoint trả count aggregate hoặc endpoint aggregate dùng chung predicate; không tính đếm từ rows của trang đầu. Filter complete dùng completedAt; các nhóm khác dùng lịch hẹn và backlog đã mô tả. Grouping và sắp xếp server ổn định để paging không đảo dòng.

### Transaction và gửi lặp

Action đổi trạng thái/đủ tiền/hoàn tất/audit phải nguyên tử. Dùng optimistic concurrency hoặc cơ chế tương đương của stack. Lặp request do retry/double click không được nhận tiền hai lần hoặc tạo hai sự kiện giao. BE từ chối chuyển trái phép dù FE đã ẩn nút. FE tải lại state khi conflict, không báo thành công giả.

## 6. Migration và bảo toàn dữ liệu

- Thêm fields nullable/default tương thích khi thích hợp; migrate có thể kiểm tra trước, không ép các đơn cũ đủ dữ liệu nhận ngay.
- Mã trạng thái cũ “Hoàn tất” mang nghĩa đã giao cần mapping sang delivered trước, rồi chỉ completed nếu có đủ bằng chứng tiền. Không mass-update tất cả thành paid.
- Không suy đoán lịch sử cọc/ngày nhận đủ, không gán ngày migration thành ngày thu; đánh dấu cần rà soát những record chưa biết.
- Snapshot buyer/recipient từ nguồn có chứng cứ. Thiếu recipient giữ null, không sao chép buyer tùy tiện.
- Có dry-run/report số record mapping được/chưa xác định, strategy rollback theo hệ thống. Test trên database development/test trước.
- Chỉ thêm index theo query thật và kiểm tra kế hoạch phù hợp; tránh schema redesign không cần thiết.
- API cũ vẫn hoạt động khi còn client phụ thuộc; enum mới/DTO mới có chiến lược tương thích.

## 7. Báo cáo triển khai BE

Bàn giao mapping hiện tại → thay đổi thực hiện; migrations; API hợp nhất/mở rộng; action nào dùng dữ liệu tiền thật, action nào là xác nhận nghĩa vụ có audit; cách giữ doanh thu/dòng tiền; kết quả test và phần bị chặn. Nếu backend source không có trong workspace, nêu rõ và yêu cầu nguồn đó; không tự dựng backend mới để giả vờ hoàn thành.
