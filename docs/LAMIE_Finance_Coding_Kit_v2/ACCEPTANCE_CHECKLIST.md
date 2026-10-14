# Checklist nghiệm thu — Lamie Finance v2

## A. Giao diện và tương tác
- [ ] Không giữ bố cục báo cáo cũ rồi chỉ thêm màu/biểu đồ. So sánh trực tiếp với mockup v2.
- [ ] Sidebar Lamie Admin gọn phía trên; không xóa chức năng ứng dụng đang có ngoài phạm vi.
- [ ] Báo cáo mặc định vào Doanh thu theo ngày, đủ 5 tab.
- [ ] Khoảng ngày có tác dụng thật; không hard-code tháng 09/2026 hoặc thêm quick filter Hôm nay/3 ngày/7 ngày vào báo cáo/tổng quan.
- [ ] Đổi Đường/Cột; tooltip và trục hiển thị đúng đơn vị; ngày chọn nổi bật.
- [ ] Chọn điểm/cột, ô lịch, dropdown hoặc ngày trước/sau cập nhật cùng một trạng thái.
- [ ] Ngày bị lọc ngoài khoảng không chọn được; đổi khoảng đưa ngày đang chọn về phạm vi hợp lệ.
- [ ] Bảng đơn của ngày và CSV khớp dữ liệu được lọc.
- [ ] Donut danh mục khớp sản phẩm thuần, không gồm ship và không cộng trùng vì nhiều tag.
- [ ] Waterfall thể hiện đủ doanh thu, nguyên liệu, hao hụt, ship, vận hành, lợi nhuận; trường hợp lỗ không bị cắt.
- [ ] Biểu đồ dòng tiền, phân bổ nguyên liệu, donut chi phí và bảng chi tiết đọc được.
- [ ] Nội dung bảng thu gọn vẫn truy cập được; có trạng thái empty/loading/error và xử lý dữ liệu thiếu.
- [ ] Sáu theme dùng token đầy đủ; tooltip/legend/donut/heatmap tương phản tốt trong dark mode.
- [ ] Lucide Animated chỉ trên sidebar, chạy khi tương tác; reduced motion/tắt chuyển động hoạt động.
- [ ] Tab/Enter/Space, nút đóng, Escape và focus modal đúng. Chọn ngày không chỉ phụ thuộc hover/màu.
- [ ] Kiểm tra 1440px, 768px, 390px; không tràn toàn trang, panel/ngày/bộ lọc vẫn dùng được.

## B. Số liệu và ngày
- [ ] Fixture: tổng 64 đơn, sản phẩm 40m, phí giao hàng thu khách 2m, dự kiến carrier 2.1m, thực tế carrier 2.3m.
- [ ] Tổng từng ngày = tổng đơn đúng ngày = tổng kỳ. Đổi include ship cho tổng 40m → 42m, vẫn 64 đơn.
- [ ] Trung bình ngày gồm ngày 0; chọn riêng 17/09/2026 trong fixture cho 0 đơn/0 doanh thu.
- [ ] Ngày 0, khoảng một ngày, tháng khác độ dài, khoảng qua tháng/năm, dữ liệu thưa đều đúng.
- [ ] Không NaN/Infinity khi không có doanh thu hoặc ngày trước bằng 0. Phân biệt chưa có dữ liệu với 0.
- [ ] Timezone cửa hàng đúng: đơn sát nửa đêm UTC được xếp vào ngày giao tại Asia/Ho_Chi_Minh.
- [ ] Tổng sản phẩm/dòng hàng/giảm giá/hoàn trả khớp, không lệch do làm tròn hoặc nhân số tiền theo tag.
- [ ] Ship actual null hiển thị chưa đối soát; actual 0 vẫn hợp lệ nếu đã xác nhận.
- [ ] Lợi nhuận: 42m − 18m nguyên liệu sản phẩm − 1m hao hụt − 2.3m ship − 10m vận hành = 10.7m.
- [ ] Tiền cuối: 4m + 38m − 18m − 9m − 2.1m = 12.9m.
- [ ] Không hiển thị lợi nhuận theo ngày như số thực khi chỉ có kiểm kê kỳ.

## C. Các tình huống tích hợp cần kiểm tra
1. Mua thêm 1m nguyên liệu, trả 400k, toàn bộ còn tồn: mua tăng 1m, tồn cuối tăng 1m, tiền giảm 400k, công nợ tăng 600k; lợi nhuận không đổi sau kiểm kê.
2. Phát sinh thêm 500k chi phí kỳ, mới trả 100k: lợi nhuận giảm 500k, tiền giảm 100k, nợ tăng 400k.
3. Cọc 300k ngày 10, giao ngày 12, trả thêm 740k ngày 14: doanh thu đơn 1.04m ngày 12; dòng tiền 300k ngày 10 và 740k ngày 14, không cộng lại 1.04m ngày 14.
4. Tồn đầu 3m + mua 20m − tồn cuối 4m = 19m tiêu hao, hao hụt 1m: giá vốn nguyên liệu sản phẩm 18m, không trừ 20m tiền mua thêm một lần.
5. Sau khi xác nhận kiểm kê, thêm phiếu mua thuộc kỳ: trạng thái xác nhận liên quan bị mất hiệu lực.
6. Chưa đủ xác nhận hoặc còn chi phí unknown thì chưa chốt. Gửi API trực tiếp cũng phải tuân theo điều kiện/quyền.
7. Đã chốt: sửa giao dịch ảnh hưởng bị chặn theo policy. Mở lại cần quyền/lý do/audit; kiểm tra kỳ sau bị ảnh hưởng.
8. Hủy/hoàn tiền/sửa ngày giao sau chốt: không âm thầm sửa số kỳ đã khóa; quy trình điều chỉnh theo chính sách được ghi rõ.
9. Chọn ngày trên biểu đồ và lịch bằng touch/keyboard; kiểm tra vị trí cuộn và focus không làm mất ngữ cảnh.
10. Tải lại trang giữ dữ liệu đã lưu thật. Khi API lỗi, không thông báo thành công hoặc bỏ dữ liệu người dùng đang nhập.

## D. Bàn giao của Agent Coding
- [ ] Liệt kê màn hình, component, API, migration và quy tắc đã thay đổi.
- [ ] Ghi các kiểm tra đã chạy và kết quả thực tế.
- [ ] Có ảnh đối chiếu desktop/mobile nếu có browser; nếu không, nói rõ chưa visual QA.
- [ ] Ghi endpoint/cấu hình/định nghĩa còn thiếu; không ngầm thay bằng dữ liệu giả.
- [ ] Không tạo dữ liệu fixture vào production, không đưa secrets vào commit, không tự deploy production ngoài ủy quyền.

## Tình trạng bộ mockup gốc
Đã kiểm tra cú pháp và các luồng bằng Node VM: đối soát số, 5 tab/6 theme, lọc ngày, ngày 0, chọn ngày, kiểu cột, profit âm, mua/chi/kiểm kê, chốt/mở kỳ. Chưa visual QA bằng browser trong phiên tạo mockup. Checklist trên là yêu cầu nghiệm thu ứng dụng thật, không phải tuyên bố tất cả đã hoàn thành trong prototype.
