# Admin sidebar brief

- **Job and audience:** Operate surface cho chủ cửa hàng, nhân viên bán hàng, vận hành và quản trị viên truy cập nhiều lần mỗi ngày. Người dùng phải tới Đơn hàng, Lịch giao và Việc cần làm trong một lần chọn.
- **Outcome and structure:** Giữ Tổng quan độc lập; nhóm Bán hàng, Vận hành, Sản phẩm & kho, Tài chính, Website & nội dung; đặt Quản trị sau một divider. Quick action “Tạo đơn hàng” xuất hiện khi route và permission hiện có cho phép.
- **Direction:** “Bàn điều phối cửa hàng hoa” — canvas trắng ngà, botanical primary trầm, typography và Lucide hiện hữu, active tint rõ, mật độ vừa cao. Nhóm dùng typography thay folder icon; tối đa hai tầng hiển thị.
- **Scope and boundaries:** Chỉ sidebar và app shell, cộng metadata navigation mặc định/database migration. Không đổi URL, page binding, API nghiệp vụ, framework hay permission; không tạo badge khi chưa có API đáng tin.
- **States and interaction:** Loading, error, empty, permission-filtered; desktop 256px/76px có persistence và tooltip; mobile drawer có overlay, Escape, focus trap, focus restoration và tự đóng khi điều hướng; active route tự mở đúng group sau refresh.
- **Responsive and accessibility:** Kiểm tra 1440×900, 1366×768, 768×1024, 390×844, zoom 125%/200%; nav label, aria-current, aria-expanded/controls, focus-visible, touch target ≥44px, long Vietnamese labels, reduced motion.
- **Assumptions:** Content hiện là công cụ tạo nội dung Facebook/Instagram/TikTok nên gọi “Nội dung đa kênh”. Navigation Management cấu hình admin sidebar nên thuộc Quản trị. Workspace `/admin/settings/catalog` chứa nhiều loại cấu hình nên gọi “Cấu hình cửa hàng”.
