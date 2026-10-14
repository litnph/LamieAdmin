# Prompt giao việc cho Agent Coding — Lamie Admin

Bạn là Agent Coding chịu trách nhiệm triển khai tính năng quản lý đơn hàng của Lamie Admin trong repository hiện tại. Hãy thực hiện thay đổi trong code, không chỉ phân tích hoặc đưa hướng dẫn. Tiếp tục cho đến khi FE, BE và luồng tích hợp hoàn thiện trong môi trường phát triển.

## 1. Đọc đầu vào và xác định phạm vi

Đọc các tệp cùng thư mục:
- `mockup.html`: mockup HTML mới nhất, chuẩn tham chiếu bố cục và cách tương tác.
- `01_UI_UX_SPEC.md`: yêu cầu theo màn hình, phạm vi giữ nguyên.
- `02_BACKEND_RULES_AND_API.md`: quy tắc dữ liệu, trạng thái, API và migration.
- `03_ACCEPTANCE_CHECKLIST.md`: tiêu chí nghiệm thu FE + BE + tích hợp.
- `reference/orders.fixture.json`: dữ liệu giả lập, chỉ phục vụ phát triển và kiểm thử.
- `reference/mockup-interactions.js`: mã tương tác được tách từ HTML để đọc thuận tiện, không phải source production.

Mở mockup trong trình duyệt và thử các nút trước khi triển khai. Nếu không có trình duyệt, đọc HTML/CSS/JS và ghi rõ giới hạn kiểm tra. Mọi dữ liệu, tên khách, số điện thoại, địa chỉ và thời điểm cố định trong mockup đều là giả lập.

Nguồn ưu tiên: yêu cầu trong prompt và tài liệu nghiệp vụ → cấu trúc giao diện mockup → code minh họa. Không coi cách triển khai JavaScript trong prototype là kiến trúc hoặc quy tắc bảo mật production. Khi có xung đột, giữ trải nghiệm đã yêu cầu và sửa cách triển khai cho đúng nghiệp vụ; không âm thầm bỏ yêu cầu.

## 2. Trình tự bắt buộc: FE trước, BE sau, rồi tích hợp

### Bước A — Khảo sát ngắn, không dừng ở kế hoạch

Đọc AGENTS.md và hướng dẫn của repository. Xác định FE framework, UI library, router, state/data fetching, hệ thống chủ đề và icon; xác định BE framework, entity/schema, ORM/migration, API, auth/permissions, luồng thanh toán và báo cáo đang có. Không tự giả định công nghệ của dự án và không đổi stack.

Lập bản đồ ngắn: màn hình hiện tại → màn hình sẽ sửa; API/entity hiện tại → phần đáp ứng được/phần còn thiếu. Tận dụng module/component đang có nếu phù hợp. Ghi các khoảng trống BE vào danh sách công việc ngay từ đầu để không bỏ quên sau FE.

### Bước B — Hoàn thiện FE Admin theo mockup

Làm lại cấu trúc UI/UX của các màn hình trong phạm vi, không chỉ đổi màu hoặc gắn component mới vào bố cục cũ. Dùng component production của dự án, không nhúng cả `mockup.html` vào iframe hay dán JavaScript prototype làm ứng dụng thật.

1. **Danh sách đơn hàng**
   - Nhóm theo ngày, giờ riêng; mặc định 7 ngày gồm hôm nay. Bộ lọc Tất cả/Hôm nay/Ngày mai/3 ngày/7 ngày/Tùy chọn, tiến trình, thanh toán, cách nhận; tìm kiếm.
   - Mỗi dòng: mã và lịch hẹn, sản phẩm, người đặt và liên hệ, kênh đặt, cách nhận (ghé lấy/ship nội thành/ship tỉnh), tiến trình và nhóm theo dõi, trạng thái thanh toán, số tiền còn lại khi chưa đủ, thiệp/banner và hai nút riêng `Xem tóm tắt`, `Xem chi tiết`.
   - Thiệp/banner có icon tĩnh nhỏ để mở modal; hover/focus xem nhanh là bổ sung. Phải dùng được bằng bàn phím và trên điện thoại.
   - Phí ship thực tế sửa nhanh, không bắt buộc vào sửa toàn bộ đơn.
   - Giữ tab bảng xác nhận & chuẩn bị, cùng nguồn dữ liệu và bộ lọc.
2. **Xem tóm tắt**: modal gọn với thông tin chính và các action nhanh theo bước hiện tại. Không điều hướng sang trang chi tiết khi bấm nút này.
3. **Xem chi tiết**: trang đầy đủ thông tin, có route thật trong router hiện tại, tải lại/deep link được; không phải modal phóng lớn. Có người đặt, người nhận, sản phẩm, nội dung thêm, lịch hẹn, phụ trách/checklist, tiền và lịch sử. Quay lại danh sách giữ bộ lọc.
4. **Tạo đơn**: người đặt ở đầu và là thông tin chính; người nhận được để trống. Không tự động coi người đặt là người nhận. Có nút sao chép chủ động. Chọn kênh, sản phẩm/giá/số lượng, loại nhận, lịch hẹn, thiệp/banner/ghi chú, ship tính khách và khoản đã thanh toán/cọc. Không để form dài mất nút lưu trên mobile.
5. **Thanh toán đơn giản**: không xây menu/tab/module đối soát COD riêng trong thay đổi này. Hiển thị `Đã thanh toán` hoặc `Chưa thanh toán đủ`, kèm số còn lại. Cập nhật ngay từ đơn bằng action xác nhận. Ghi nhận trạng thái và số tiền đúng theo BE; không chỉ đổi badge FE.
6. **Tổng quan và lịch giao**: đồng bộ các trường/trạng thái mới, giữ vai trò điều phối hôm nay/ngày tới, phân biệt ngày chuẩn bị và ngày giao. Không thêm bộ lọc nhanh Hôm nay/3 ngày/7 ngày vào Tổng quan hoặc Báo cáo.

Giữ thương hiệu Lamie gọn ở đầu sidebar; giữ Lucide Animated ở sidebar, chỉ chạy khi tương tác và tôn trọng reduced motion. Ngoài sidebar dùng icon tĩnh, hạn chế animation. Chủ đề thay đổi đồng bộ toàn bộ UI; tái sử dụng hệ thống theme hiện tại và tham chiếu sáu theme trong mockup.

Hoàn thiện responsive, loading/empty/error/saving states và thao tác bàn phím. Nếu API chưa có, dùng adapter/mock service tạm có contract rõ ràng để hoàn thiện FE trước. Cô lập dữ liệu giả ở development/test; ghi rõ endpoint nào đang dùng mock. Không coi giai đoạn mock là hoàn thành nhiệm vụ.

### Bước C — Sau khi FE đạt bố cục và luồng, triển khai phần BE còn thiếu

Rà lại danh sách khoảng trống BE và thực hiện mọi thay đổi cần thiết: DTO/request/response, validation, entity hoặc schema/migration, service/domain logic, endpoint, query, permissions, audit và dữ liệu tương thích ngược. Reuse API hiện có khi đáp ứng được; mở rộng có chủ đích, không tạo API trùng chức năng chỉ vì khác tên.

Bắt buộc BE hỗ trợ:
- Lưu người đặt và người nhận tách biệt; người nhận nullable khi tạo đơn.
- Kênh đặt, cách nhận, thiệp/banner và nội dung nguyên văn có xuống dòng, ghi chú nội bộ.
- Query danh sách có đủ dữ liệu dòng, tìm kiếm/filter/group/date/pagination và tổng đếm nhất quán; tránh gọi chi tiết từng đơn chỉ để dựng lưới.
- Chi tiết đầy đủ, thao tác cập nhật người nhận, checklist/phân công, chuyển bước, tạm dừng/tiếp tục, giao lại/hủy theo phạm vi hiện tại.
- Sửa ship thực tế nhanh với null khác 0; không làm thay đổi ship tính khách.
- Cập nhật thanh toán ở server; tự tính `Hoàn tất = đã giao/đã nhận tại tiệm + đã thanh toán đủ`.
- Ghé lấy bỏ qua bàn giao shipper; ship phải có thông tin nhận cần thiết trước bàn giao, nhưng không chặn tạo/xác nhận/chuẩn bị vì người nhận trống.
- Kiểm tra quyền trên server, audit ai/lúc nào/thay đổi gì; kiểm soát cập nhật đồng thời và gửi lặp với action tài chính/trạng thái.

**Thanh toán và báo cáo:** giao diện đơn giản không đồng nghĩa xóa dữ liệu tiền hoặc tự ghi thu ngân hàng. `Đánh dấu đã thanh toán` là xác nhận thanh toán của đơn, không được tự sinh dòng tiền giả bằng phần chênh còn thiếu. Tích hợp đúng mô hình thu tiền/settlement hiện có theo đặc tả BE. Không khôi phục màn hình COD riêng. Doanh thu vẫn theo giao thực tế, dòng tiền vẫn theo sự kiện tiền thực tế; không dùng ngày hoàn tất thay thế hai mốc này.

**Migration:** trạng thái hoàn tất cũ có thể chỉ mang nghĩa đã giao. Kiểm tra chứng cứ giao và thanh toán trước khi chuyển sang hoàn tất mới. Không suy đoán timestamp còn thiếu, không xóa lịch sử tiền, không ép null người nhận thành thông tin người đặt. Chuẩn bị migration an toàn, có cách rà soát dữ liệu chưa xác định. Chạy trên dev/test; không tự chạy migration phá hủy dữ liệu production hoặc tự deploy production.

### Bước D — Tích hợp thật và kiểm tra toàn tuyến

Thay toàn bộ mock service ở đường chạy production bằng API thật. Kiểm tra lưu rồi reload, deep link chi tiết, cập nhật từ modal phản ánh lên dòng đơn, trang chi tiết, Tổng quan và Lịch giao. Refresh cache/invalidate đúng dữ liệu; rollback hoặc hiển thị lỗi khi API thất bại. Không báo thành công nếu dữ liệu chưa lưu được.

Chạy build/lint/typecheck và test phù hợp repository. Chạy các ca trong `03_ACCEPTANCE_CHECKLIST.md`, ưu tiên transition/payment/optional recipient/quick ship/concurrency. Kiểm tra trực quan ở desktop và mobile bằng browser nếu có. Test mẫu minh họa không thay thế test với BE thật.

## 3. Quy tắc làm việc

- Thực hiện đến khi hoàn tất phạm vi đã nêu. Không dừng sau FE với câu “BE có thể làm sau”.
- Không thay đổi module ngoài phạm vi nếu không có phụ thuộc trực tiếp. Không thiết kế lại kế toán, thuế, kho, catalog hay toàn bộ auth.
- Không hardcode 15 đơn mẫu, thời gian 12/10/2026, tiền hoặc số lượng thẻ đếm vào production; dùng timezone cửa hàng Asia/Ho_Chi_Minh và clock thực tế.
- Không thêm điều kiện thứ ba như “đã nhập phí ship” để cho phép hoàn tất.
- Không cho người dùng gán `Hoàn tất` thủ công bất chấp hai điều kiện giao và tiền.
- Không làm mất chức năng hiện hữu chưa có trong mockup: thêm dòng sản phẩm, giảm giá, phân quyền, lịch sử… nếu dự án đã hỗ trợ. Mapping vào bố cục mới phù hợp.
- Tự xử lý quyết định kỹ thuật thông thường; chỉ hỏi khi có xung đột nghiệp vụ chưa thể giải quyết hoặc thiếu quyền/source bắt buộc. Khi bị chặn, hoàn thành phần khả thi và liệt kê chính xác phần còn thiếu, không tuyên bố xong.

## 4. Kết quả phải bàn giao

1. Code FE đã triển khai đúng bố cục và hành vi.
2. Code BE, schema/migration/API cần thiết và tích hợp end-to-end.
3. Bảng ngắn “yêu cầu → component/route → API/service → kiểm tra”.
4. Tóm tắt migration, tương thích dữ liệu cũ, cấu hình cần thêm; không đưa secrets vào báo cáo.
5. Kết quả kiểm tra đã chạy, phần chưa chạy và lý do. Ảnh kiểm tra desktop/mobile nếu môi trường hỗ trợ.
6. Hướng dẫn chạy và kiểm thử tại dev; nêu rõ mọi blocker thực tế.

Bắt đầu bằng việc đọc repository và các tệp đính kèm, rồi thực hiện theo thứ tự FE → BE → tích hợp. Đây là yêu cầu triển khai thực tế, không phải yêu cầu viết kế hoạch mới.
