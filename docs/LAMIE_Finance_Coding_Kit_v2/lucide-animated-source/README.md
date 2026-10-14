# Lucide Animated — nguồn tham chiếu

`icons/*.tsx`: component nguồn đã dùng để build bundle sidebar trong mockup, nguồn https://lucide-animated.com (pqoqubbw).
`sidebar-bridge.tsx`: adapter React portal cho HTML prototype; chỉ enhance icon trong aside button.navitem/create, dừng animation sau tương tác và tôn trọng reduced motion.
`utils.ts`, `source-utils.ts`: tiện ích tham chiếu.

Khi triển khai vào ứng dụng: dùng component tương ứng trong sidebar theo kiến trúc/phiên bản React/Motion của dự án; sửa alias import phù hợp. Không sao chép nguyên adapter DOM portal hoặc bundle minified làm kiến trúc ứng dụng. Các dependencies cần được đối chiếu với package hiện tại; thư mục này không phải một project npm độc lập.

Mapping trong phạm vi Finance: Tổng quan→layout-grid; Báo cáo→chart-line; Mua nguyên liệu→cart; Chi phí→wallet; Kiểm kê→boxes; Chủ đề→palette. Các icon còn lại được giữ để adapter có đủ import và bảo toàn nguồn tham chiếu.

Giữ các thông báo giấy phép đi kèm. Nội dung ngoài sidebar dùng icon tĩnh khi cần.
