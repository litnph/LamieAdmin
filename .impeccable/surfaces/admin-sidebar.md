# Admin sidebar

## Surface

- Mode: Operate.
- Primary targets: `src/shared/components/Sidebar.tsx`, `src/layouts/AdminLayout.tsx`.
- Audience: chủ cửa hàng, nhân viên bán hàng, nhân viên vận hành và quản trị viên dùng Lamie nhiều lần mỗi ngày.
- Priority jobs: xử lý đơn hàng, kiểm tra lịch giao và theo dõi việc cần làm.

## Direction contract

THESIS: “Bàn điều phối cửa hàng hoa” ưu tiên quét nhanh theo luồng nghiệp vụ, không dùng bố cục dashboard SaaS chung chung.

OWN-WORLD: nền giấy trung tính ấm, một màu botanical trầm, Lucide nét đều, active tint rõ và bề mặt gần như phẳng.

STORY: người dùng nhận ra công việc hằng ngày trước, đi tới tác vụ trong một lần chọn, rồi mới gặp cấu hình và quản trị.

FIRST VIEWPORT: thương hiệu và tạo đơn cố định phía trên; navigation cuộn ở giữa; tài khoản cố định phía dưới; desktop 256/76px, mobile drawer.

FORM: app shell vận hành kế thừa Lamie hiện hữu, code-led, không tạo route hoặc dữ liệu giả.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Decisions and assumptions

- Nội dung hiện tạo nội dung Facebook, Instagram và TikTok nên dùng “Nội dung đa kênh”, không tạo nhóm website giả.
- Menu & điều hướng quản lý navigation của trang admin nên nằm trong Quản trị.
- `/admin/settings/catalog` chứa nhiều loại cấu hình cửa hàng, không chỉ danh mục sản phẩm, nên dùng “Cấu hình cửa hàng”.
- Quick action “Tạo đơn hàng” chỉ xuất hiện khi route `orders.create` đã được API permission-filtered trả về.
- Không hiển thị badge cho đến khi API có số liệu hành động đáng tin cậy.

## Verification contract

- Giữ nguyên URL, page binding và permission hiện hữu.
- Kiểm tra 1440×900, 1366×768, 768×1024, 390×844, zoom 125% và 200%.
- Bắt buộc có active route sau refresh, auto-open group, tooltip keyboard, focus trap/Escape/focus restore và touch target tối thiểu 44px.
