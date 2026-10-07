# Lamie Admin

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Người dùng chính là chủ cửa hàng hoặc nhân viên quản lý cửa hàng hoa, sử dụng hệ thống nhiều lần mỗi ngày để theo dõi vận hành và tài chính.
- Nhân viên bán hàng xử lý đơn, thanh toán và hồ sơ khách hàng.
- Nhân viên vận hành theo dõi lịch giao, công việc chuẩn bị, tồn kho và chi phí.
- Quản trị viên quản lý người dùng, vai trò, quyền và điều hướng động.

## Product Purpose

Lamie Admin là không gian vận hành back-office cho cửa hàng hoa. Sản phẩm giúp đội ngũ xử lý đơn hàng chính xác, theo dõi hiệu quả kinh doanh, dòng tiền, tiền cọc và công nợ, đồng thời trả lời nhanh ba câu hỏi: cửa hàng tạo ra bao nhiêu doanh thu và lợi nhuận; thực tế đã thu và chi bao nhiêu tiền; còn bao nhiêu tiền khách trả trước chưa giao và công nợ phải thu.

## Positioning

Lamie nối dòng tiền nhiều lần thanh toán với vòng đời giao hoa của từng đơn nhưng vẫn tách bạch hai góc nhìn: doanh thu chỉ được ghi nhận khi khách thực tế nhận hoa và đơn hoàn tất, còn dòng tiền dùng ngày thu hoặc chi thực tế.

## Operating Context

- Đây là công cụ back-office được sử dụng thường xuyên; độ rõ ràng, tốc độ thao tác và khả năng đọc lướt được ưu tiên hơn trang trí.
- Ngôn ngữ giao diện là tiếng Việt; tiền tệ mặc định là VND; múi giờ nghiệp vụ là `Asia/Ho_Chi_Minh`.
- Quy trình đơn có thể gồm đặt cọc, nhiều lần thanh toán, thanh toán toàn bộ trước hoặc khi nhận, hoàn một phần/toàn bộ, thay đổi ngày giao và hủy đơn.
- Điều hướng lấy dữ liệu từ cơ sở dữ liệu và phải tuân theo vai trò, quyền hiện có.

## Capabilities and Constraints

- Doanh thu ghi nhận = tiền sản phẩm sau giảm giá + phí giao hàng thu khách − điều chỉnh/hoàn doanh thu hợp lệ.
- Doanh thu chỉ ghi nhận vào ngày nhận hoa thực tế khi đơn được xác nhận hoàn tất. Đơn chưa hoàn tất không tạo doanh thu; nếu ngày thực tế khác ngày dự kiến thì dùng ngày thực tế.
- Phí giao hàng thu khách là doanh thu. Chi phí giao hàng cửa hàng trả là chi phí riêng và không được bù trừ trực tiếp.
- Tiền nhận trước ngày giao là dòng tiền vào nhưng chưa phải doanh thu.
- Tiền thực thu dùng các giao dịch thành công theo `paidAt`; dòng tiền ra dùng ngày thanh toán thực tế.
- Chi phí trực tiếp liên kết đơn mặc định ghi nhận theo ngày hoàn tất đơn; chi phí vận hành dùng `incurredAt`. Mô hình dữ liệu chi phí phải hỗ trợ cả `incurredAt` và `paidAt`.
- Báo cáo phải hỗ trợ nhiều lần thanh toán, giao dịch thất bại/hủy, thanh toán dư, hoàn tiền, đơn hủy, cọc hoàn/giữ lại theo chính sách cấu hình, dữ liệu thiếu, tải, rỗng và lỗi API.
- Công thức tài chính nằm trong lớp domain tập trung, không tính trực tiếp trong component giao diện.
- Bộ lọc báo cáo nên có thể chia sẻ qua URL khi phù hợp với router hiện tại; xuất CSV/XLSX, không giả định PDF.
- Không thay framework, design system hoặc chức năng ngoài phạm vi Báo cáo. `FE_Lamie` nằm ngoài phạm vi.
- Không tự đặt quy tắc tài chính mới; các điểm backend chưa xác nhận phải được ghi thành giả định hoặc hợp đồng dữ liệu cần bổ sung.

## Brand Commitments

- Tên sản phẩm là Lamie Admin.
- Tiến hóa ngôn ngữ giao diện hiện hữu thay vì thay thế design system.
- Cảm giác đáng tin cậy, rõ ràng như công cụ tài chính nhưng vẫn ấm áp và tinh tế, phù hợp cửa hàng hoa; không biến giao diện thành sản phẩm trang trí hoa.

## Evidence on Hand

- Mã nguồn React/Vite, component dùng lại, Tailwind token, manifest điều hướng và các màn hình đơn hàng/chi phí hiện có trong `Admin_Lamie/src`.
- Design system hiện hữu được ghi tại `Admin_Lamie/DESIGN.md`.
- Ba kịch bản chấp nhận bắt buộc trong brief: đơn đặt cọc, đơn thanh toán toàn bộ trước và chi phí có ngày phát sinh khác ngày thanh toán.
- Chưa có bằng chứng rằng backend hiện tại cung cấp đầy đủ giao dịch nhiều lần thanh toán, hoàn tiền, `incurredAt`/`paidAt`, chứng từ hoặc kênh bán hàng; giao diện không được giả lập các khả năng backend như thể đã sẵn sàng sản xuất.

## Product Principles

1. Tách bạch hiệu quả kinh doanh và chuyển động tiền bằng nhãn ngày, công thức và ngữ cảnh rõ ràng.
2. Mọi con số tổng hợp phải truy vết được xuống đơn hàng hoặc giao dịch nguồn.
3. Ưu tiên đọc nhanh, so sánh chính xác và thao tác lặp lại hiệu quả.
4. Giữ quy tắc tài chính trong domain layer có type và test, để API có thể thay thế mock mà không đổi UI.
5. Trạng thái và xu hướng không bao giờ chỉ dựa vào màu sắc.

## Accessibility & Inclusion

- Hỗ trợ bàn phím, focus rõ, vùng bấm khoảng 44px, reduced motion, zoom 200% và tương phản phù hợp WCAG.
- Biểu đồ phải có legend, tooltip và tóm tắt dữ liệu có thể tiếp cận.
- Tiếng Việt dài, số tiền VND và bảng dữ liệu phải đọc được trên desktop, tablet và mobile.
