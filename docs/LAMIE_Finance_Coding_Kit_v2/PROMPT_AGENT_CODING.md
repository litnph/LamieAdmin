# PROMPT — Triển khai Lamie Admin theo mockup Finance v2

Bạn là Agent Coding chịu trách nhiệm triển khai trực tiếp vào repository Lamie Admin hiện tại. Hãy đọc code, thực hiện thay đổi, chạy kiểm tra và hoàn thiện kết quả. Không dừng ở kế hoạch hoặc đề xuất.

## 1. Tài liệu phải đọc trước khi code

1. `README_START_HERE.md`: cách mở và phạm vi bộ bàn giao.
2. `mockup.html`: bản tự chứa để mở trực tiếp, tham chiếu giao diện và tương tác.
3. Toàn bộ `mockup-source/index.html`, `style.css`, `visuals.css`, `app.js`, `visuals.js`. **Đặc biệt: visuals.js và visuals.css là thiết kế biểu đồ mới nhất; chỉ đọc app.js/style.css sẽ bỏ sót bản đã duyệt.**
4. `BUSINESS_RULES.md`: định nghĩa số liệu, ngày ghi nhận và luồng kiểm kê.
5. `ACCEPTANCE_CHECKLIST.md`: điều kiện nghiệm thu.
6. `fixtures/finance-demo.json`: dữ liệu kiểm thử minh họa, không phải dữ liệu thật.

Mở bản mockup trên trình duyệt nếu công cụ cho phép. Đối chiếu desktop và mobile, chọn ngày, đổi Đường/Cột, xem lịch doanh thu, mở chi tiết đơn, đổi chủ đề, chuyển các tab. Link tham khảo: https://lamie-finance-preview.easycrumb5.chatgpt.site . Link có thể yêu cầu quyền truy cập; dùng file đi kèm làm nguồn tham chiếu chính.

## 2. Mục tiêu

Thay bố cục tài chính cũ bằng trải nghiệm trực quan của mockup v2. Không chỉ thay màu, thêm một biểu đồ vào bố cục cũ hoặc thay nhãn.

Ưu tiên bảo toàn: bố cục tổng thể, thứ bậc thông tin, vị trí thao tác, màu/chủ đề, khoảng cách, độ bo góc, typography, hình thức biểu đồ, hành vi chọn ngày và phản hồi trạng thái. Điều chỉnh kỹ thuật cho stack hiện tại nhưng không tự thiết kế lại theo ý riêng.

Phạm vi:
- Tổng quan.
- Báo cáo: Doanh thu theo ngày; Lợi nhuận & chi phí; Dòng tiền; Nguyên liệu; Chứng từ & thuế.
- Mua nguyên liệu.
- Chi phí vận hành.
- Kiểm kê & chốt kỳ.
- Tích hợp sáu chủ đề và chuyển động sidebar nhất quán.

Giữ các menu và chức năng khác của ứng dụng hiện tại. Việc một menu không xuất hiện trong prototype không có nghĩa được xóa menu đó khỏi sản phẩm thật. Không thay đổi bộ lọc của Đơn hàng ngoài yêu cầu này.

## 3. Doanh thu theo ngày — màn hình trọng tâm

- Mặc định mở tab Doanh thu theo ngày khi vào Báo cáo.
- Bộ lọc khoảng ngày bắt đầu/kết thúc và công tắc “Tính cả phí giao hàng”. Không thêm bộ lọc nhanh Hôm nay / 3 ngày / 7 ngày vào Tổng quan hoặc Báo cáo.
- 4 thẻ tổng hợp có sparkline: doanh thu, số đơn đã giao, trung bình mỗi ngày, ngày cao nhất.
- Biểu đồ đường có phần tô nền; chuyển được sang cột. Đơn vị trục rõ ràng, tooltip chính xác, ngày đang chọn được làm nổi bật.
- Hover để xem nhanh; bấm/chạm/chọn bằng bàn phím để xem ngày. Có nút ngày trước/sau và ô chọn ngày; giữ lựa chọn trong khoảng lọc.
- Khung bên cạnh hiển thị ngày, doanh thu, so với ngày trước, số đơn, giá trị trung bình/đơn, tiền sản phẩm, phí ship và nút xem đơn.
- Mở danh sách đơn thực tế của đúng ngày được chọn; số đơn và tổng tiền phải khớp biểu đồ.
- Lịch doanh thu dạng heatmap: màu đậm cho ngày có doanh thu cao; chọn ô lịch cập nhật cùng khung chi tiết. Có nhãn số/tooltip, không chỉ dựa vào màu.
- Donut cơ cấu nhóm sản phẩm dùng doanh thu sản phẩm, luôn loại phí ship. Các nhóm phải khớp danh mục thật và không cộng một dòng bán hàng nhiều lần.
- Bảng số liệu chính xác nằm trong phần mở rộng; xuất CSV theo đúng khoảng lọc, có nhãn rõ sản phẩm/ship/tổng.
- Đổi khoảng ngày cập nhật toàn bộ chỉ số, biểu đồ và bảng liên quan. Không hard-code tháng 09/2026; tháng đó chỉ là fixture.
- Ngày không có đơn vẫn xuất hiện với giá trị 0. Phân biệt 0 với dữ liệu thiếu/lỗi tải.
- Nếu không có doanh thu: không gọi một ngày 0 đồng là “ngày bán tốt nhất”; hiển thị trạng thái chưa có doanh thu. So sánh với ngày trước bằng 0 phải có câu giải thích, không chia cho 0.

## 4. Lợi nhuận và các tab còn lại

**Lợi nhuận & chi phí:** biểu đồ waterfall từ tổng doanh thu đến lợi nhuận trước thuế, donut cơ cấu chi phí, so sánh phí ship thu khách với phí thực tế. Bảng tính chi tiết thu gọn. Hiển thị lỗ đúng chiều/màu khi âm, không cắt về 0. Không tính lợi nhuận từng ngày bằng cách chia lợi nhuận tháng cho số ngày.

**Dòng tiền:** thẻ và biểu đồ đầu kỳ/thực thu/thực chi/cuối kỳ, kèm công nợ. Tổng thu theo từng giao dịch nhận tiền, không theo ngày giao đơn. Tiền cọc chỉ tính một lần.

**Nguyên liệu:** thanh phân bổ nguyên liệu sẵn có thành phần vào sản phẩm, hao hụt, tồn cuối; công thức đầu + mua − cuối; bảng theo nhóm.

**Chứng từ & thuế:** đối soát doanh thu, hồ sơ mua ở chợ, thông tin người bán, tham chiếu/đính kèm chứng từ và trạng thái cần bổ sung. Không tự xác nhận chi phí được trừ, áp thuế suất hoặc nộp tờ khai khi chưa có cấu hình/định nghĩa được xác nhận. Nhãn chứng từ tách khỏi nhãn đủ điều kiện thuế.

Với báo cáo ngày và báo cáo lợi nhuận kỳ, hiển thị phạm vi riêng rõ ràng. Không dùng bộ lọc doanh thu 3 ngày để gắn nhãn lên giá vốn cả tháng.

## 5. Nhập liệu và chốt kỳ

Lamie nhập tổng tiền nguyên liệu theo nhóm và kiểm kê cuối tuần/tháng; chưa theo dõi từng cành cho từng đơn.

- Mua nguyên liệu: ngày mua/nhận hàng, nhà cung cấp, nhóm, giá trị mua, giao dịch thanh toán riêng, số còn nợ, hồ sơ chứng từ.
- Chi phí vận hành: nội dung, phân loại, kỳ phát sinh/phân bổ, số tiền, các lần thanh toán và công nợ.
- Kiểm kê: tồn đầu tự kế thừa kỳ trước, mua vào trong kỳ, tồn cuối theo giá vốn, hoa hỏng/hao hụt, ghi chú, trạng thái ước tính/xác nhận.
- Chốt kỳ chỉ được thực hiện khi đáp ứng các điều kiện kiểm kê và đối soát. Khóa ở API/database theo kiến trúc hiện tại, không chỉ disable nút UI.
- Mở lại kỳ cần quyền phù hợp, lý do và lịch sử. Không âm thầm sửa báo cáo đã chốt.
- Dữ liệu thay đổi phải làm mất hiệu lực xác nhận liên quan và cập nhật báo cáo. Xem các quy tắc chi tiết trong BUSINESS_RULES.md.

## 6. Hệ giao diện và icon

- Lamie Admin đặt gọn ở đầu sidebar.
- Sidebar giữ icon từ **lucide-animated.com**. Có mã nguồn TSX và adapter tham chiếu trong `lucide-animated-source/`.
- Chỉ chạy animation sidebar khi hover/focus/chạm, có giới hạn thời gian; không lặp tự động trên menu đang chọn. Tôn trọng prefers-reduced-motion và lựa chọn tắt chuyển động.
- Ngoài sidebar dùng icon tĩnh khi cần; không nhồi animated icon vào KPI, bảng hoặc tiêu đề. Chuyển cảnh biểu đồ nhẹ, không chạy liên tục.
- Sáu theme gồm Mint Calm (mặc định), Violet Mist, Lime Grove, Violet Glass, Cobalt Sand, Lime Noir. Đây là bộ chủ đề toàn giao diện, không phải một màu chủ đạo.
- Theme bao phủ nền, sidebar, chữ, bề mặt, viền, nút, trạng thái, biểu đồ và tooltip. Không dùng hard-coded màu sáng khiến dark mode hỏng.
- Giữ cơ chế lưu/xem trước chủ đề hiện có nếu ứng dụng đã có; không làm mất tính năng đã hoạt động.
- Desktop giữ biểu đồ làm trung tâm và panel ngày cạnh bên. Tablet/mobile sắp lại thứ tự hợp lý; chỉ vùng bảng/biểu đồ được cuộn ngang khi cần, không tràn toàn trang.

## 7. Yêu cầu triển khai vào sản phẩm thật

- Đọc AGENTS.md và quy ước dự án. Tái sử dụng stack, auth, routing, design system, services và thư viện biểu đồ đang có nếu đáp ứng được thiết kế.
- Tách UI thành component có trách nhiệm rõ: report filters, KPI/sparkline, daily chart, selected day panel, heatmap, donut, waterfall, data disclosure, stocktake form và period close dialog.
- Prototype dùng global functions, inline handlers, localStorage và các hàm override để xem trước. **Không bê nguyên mô hình này vào production**, không nhúng toàn bộ mockup bằng iframe hoặc dùng bundle minified làm kiến trúc tính toán.
- Dùng dữ liệu/API thực. Nếu API thiếu, kiểm tra backend/schema rồi bổ sung tối thiểu phù hợp. Không tự đổi toàn bộ kiến trúc hoặc thay database.
- Bảo toàn dữ liệu, schema hiện hữu, quy trình đơn hàng, auth và phân quyền. Migration có lộ trình tương thích, không xóa lịch sử hoặc tạo dữ liệu giả vào production.
- Dữ liệu tiền dùng kiểu số chính xác/decimal hoặc integer theo quy ước dự án. Backend chịu trách nhiệm số liệu tổng hợp và đối soát, tránh hai công thức khác nhau ở frontend/backend.
- Nếu chỉ có quyền truy cập frontend: triển khai UI, typed service contract và adapter fixture tách riêng cho dev; chỉ rõ endpoint còn thiếu. Không giả vờ đã lưu dữ liệu thật thành công.
- Các hạn chế prototype phải được xử lý trong bản thật: nhiều kỳ báo cáo, nhiều lần trả tiền, chứng từ thực, trường hợp hủy/hoàn, quyền truy cập, loading/empty/error và lưu dữ liệu bền vững.
- Không copy khóa tháng 09/2026, số tiền mẫu, tên người bán mẫu hoặc công thức phân phối đơn demo thành logic kinh doanh.
- Với khoảng ngày, timezone Asia/Ho_Chi_Minh, chọn cả hai ngày đầu/cuối. Xử lý chuyển UTC ở biên ngày đúng, không nhóm bằng timezone máy chủ tùy ý.
- Hành vi tài chính chưa được xác nhận phải thể hiện rõ là thiếu cấu hình/dữ liệu. Không tự bịa quy tắc thuế hoặc dùng 0 để lấp khoản chi chưa biết.

## 8. Cách làm và bàn giao

1. Khảo sát repository và đối chiếu nhanh từng màn hình/API với mockup.
2. Ghi kế hoạch ngắn, sau đó trực tiếp triển khai; tự quyết các chi tiết kỹ thuật thường lệ theo quy ước dự án.
3. Hoàn thiện màn hình và các luồng liên kết; không dừng ở trang tĩnh đẹp nhưng nút/filter không hoạt động.
4. Kiểm tra các trường hợp trong ACCEPTANCE_CHECKLIST.md và fixtures, chạy kiểm tra hiện có liên quan.
5. Mở ứng dụng bằng browser tool nếu có, chụp/so sánh các màn hình desktop 1440px, tablet 768px, mobile 390px; sửa lỗi hiển thị và console. Kiểm tra đặc biệt Mint Calm và Lime Noir. Nếu không có browser, ghi rõ giới hạn, không tuyên bố đã kiểm tra trực quan.
6. Bàn giao các file thay đổi, API/migration nếu có, kiểm tra đã chạy, phần còn thiếu và cách chạy thử. Không tự xuất bản production nếu chưa có ủy quyền riêng.

Hoàn thành khi cấu trúc và tương tác bám sát mockup v2, dữ liệu thật đi đúng luồng, các số tổng/chi tiết khớp nhau và không còn bố cục tài chính cũ trong các màn hình thuộc phạm vi. Nếu bị chặn bởi quyền truy cập hoặc thiếu nguồn bắt buộc, hoàn thành phần có thể làm và chỉ rõ blocker cụ thể.
