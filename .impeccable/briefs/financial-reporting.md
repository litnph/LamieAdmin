# Surface brief: Financial reporting

## Job and audience

- **Mode:** Operate.
- Chủ cửa hàng hoặc nhân viên quản lý mở màn hình nhiều lần trong ngày để đánh giá hiệu quả kinh doanh, kiểm tra tiền thực thu/thực chi, tiền khách trả trước và công nợ.
- Ba câu trả lời phải nhìn thấy ngay ở Tổng quan: doanh thu/lợi nhuận; tiền vào/ra; trả trước chưa giao/còn phải thu.

## Outcome and proof

- Tách rõ hai sổ nhìn: **Doanh thu ghi nhận** theo ngày khách thực nhận hoa và đơn hoàn tất; **Tiền thực thu** theo ngày thanh toán thành công.
- Mọi tổng số có thể truy vết xuống điểm dữ liệu, đơn hàng hoặc giao dịch nguồn.
- Dữ liệu mẫu phải chứng minh được cọc nhiều lần, thanh toán toàn bộ trước, hoàn tiền, đơn chưa giao và chi phí có `incurredAt` khác `paidAt`.

## Selected direction

- Kế thừa visual world “Bàn điều phối cửa hàng hoa” trong `DESIGN.md`: giấy ấm, mực neutral có sắc độ, botanical primary trầm, border và tonal layering thay cho shadow nặng.
- Thesis cấu trúc: thanh tab ngang cố định ngữ cảnh; toolbar báo cáo dùng preset nhanh + khoảng ngày + nhóm dữ liệu, bộ lọc nâng cao mở panel có chủ đích; mỗi tab nêu rõ cơ sở ngày ngay dưới tiêu đề.
- First viewport của Tổng quan không phải một lưới card đồng hạng: khối doanh thu và lợi nhuận là tiêu điểm, dòng tiền là dải so sánh ngang, cọc/công nợ là callout vận hành; tối đa hai biểu đồ chính xuất hiện phía trên fold.
- Signature interaction: chọn điểm/chuỗi biểu đồ tạo một filter chip có thể xóa và đồng bộ bảng drill-down; mở chi tiết đơn bằng drawer với timeline, không điều hướng mất ngữ cảnh.
- Motion chỉ 150–220ms cho đổi tab, mở drawer, phản hồi chọn dữ liệu; tôn trọng reduced motion.

## Scope and boundaries

- Một route `/admin/reports`, năm tab: Tổng quan; Doanh thu & lợi nhuận; Dòng tiền; Chi phí; Cọc & công nợ.
- Production-ready frontend flow với dữ liệu mock typed qua adapter; hợp đồng API v2 được tách riêng để backend có thể thay thế mà không đổi component.
- Giữ nguyên router động, permission `reports.view`, app shell, Tailwind token, component dùng chung và các feature ngoài `src/features/reports`.
- Không thêm thư viện biểu đồ hoặc state lớn; chart dùng SVG/HTML semantic nhẹ. Không thêm PDF mới ngoài khả năng in hiện hữu.

## States and ranges

- Typical: 8 đơn, nhiều giao dịch/chi phí từ 05–15/09/2026, gồm đủ ba acceptance cases.
- Loading: skeleton giữ nguyên cấu trúc; error: mô tả có retry; empty: giải thích bộ lọc và hành động xóa bộ lọc; partial/missing: hiển thị dấu gạch và cảnh báo nguồn.
- Xử lý số 0, doanh thu bằng 0 khi tính biên, thanh toán thất bại/hủy, thanh toán dư, hoàn một phần/toàn bộ, đơn hủy, thay đổi ngày nhận thực tế và giao dịch/ghi nhận lệch kỳ.

## Interaction and layout

- Bộ lọc chính lưu trong URL: tab, from, to, preset, groupBy, compare, order/payment/method/category/channel; reset trở về 30 ngày gần nhất.
- Desktop: toolbar hai tầng, biểu đồ hai cột, bảng đầy đủ và drawer bên phải. Tablet: toolbar cuộn/panel, biểu đồ xếp dọc. Mobile: ba chỉ số cốt lõi trước, tab cuộn ngang, bộ lọc nâng cao dạng bottom drawer, bảng quan trọng chuyển thành danh sách; bảng giao dịch có cuộn ngang có chủ đích.
- Các tab gắn cơ sở ngày riêng: “Ngày khách nhận hoa”, “Ngày thanh toán”, “Ngày phát sinh”. Không có toggle mơ hồ đổi nghĩa toàn cục.
- Chart có legend, tooltip/focus, bảng tóm tắt screen-reader; tăng/giảm dùng biểu tượng và nhãn cùng màu.

## Constraints and open decisions

- Locale `vi-VN`, currency VND, timezone `Asia/Ho_Chi_Minh`, tabular numerals.
- Backend hiện tại chỉ có báo cáo tài chính tổng hợp theo ngày giao dự kiến và trạng thái thanh toán; chưa đủ payment ledger, refund, actual completion timestamp, expense payment status/date, vendor/evidence hoặc sales channel aggregation.
- Giả định frontend demo: `completedAt` đại diện ngày khách thực nhận hoa; hoàn doanh thu chỉ trừ khi giao dịch refund có `affectsRecognizedRevenue=true`; cọc giữ lại của đơn hủy chỉ vào doanh thu khi backend cung cấp policy decision rõ ràng, mặc định mock là hoàn và không ghi nhận doanh thu.
- API v2 cần trả raw normalized orders/payments/expenses hoặc report aggregates kèm drill-down IDs và snapshot thời điểm báo cáo. Không suy diễn quy tắc từ `paymentStatus` đơn lẻ.
