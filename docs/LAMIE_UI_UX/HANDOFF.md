# LAMIE ADMIN — UI/UX Mockup V1.2

Bộ thiết kế ngày 08/10/2026, dựa trên `ADMIN_UI_UX_MOCKUP_BRIEF.md` cập nhật 07/10/2026.

Bản V1.2 ngày 08/10/2026 đưa tài khoản Lamie Admin lên đầu sidebar, gộp thành một cụm 48 px với avatar 30 px, tên và vai trò. Bấm vào cả cụm để mở tài khoản. Header này áp dụng cả desktop, drawer mobile và khung xem trước điều hướng. HTML dùng Lucide Animated; PDF, overview và `screens/` được cập nhật theo bố cục mới ở trạng thái tĩnh. Chi tiết motion nằm trong `MOTION_NOTES.md`.

## Bắt đầu xem

- Mở `LAMIE_Admin_Mockup.html` bằng Chrome, Edge, Safari hoặc trình duyệt hiện đại. File chứa sẵn font, icon và tài nguyên minh họa, không cần cài thư viện.
- Menu chọn màn hình ở thanh trên cùng là công cụ duyệt mockup, không thuộc UI sản phẩm khi triển khai.
- Chọn trạng thái để xem loading, empty, không có kết quả lọc, lỗi toàn trang, lỗi một phần, chỉ xem và đang lưu.
- Thay đổi kích thước cửa sổ để kiểm tra responsive. Dưới 1024 px dùng drawer; dưới 761 px các bảng chính chuyển thành danh sách có nhãn.
- PDF có 43 trang: ba trang giới thiệu và 40 khung mockup có chú thích. Ảnh từng khung nằm trong `screens/`.

## Phạm vi

24 màn hình chức năng, hai trang thiết kế dùng chung, năm dialog desktop, bảy khung mobile và hai khung trạng thái bổ sung. Tổng cộng 40 khung ảnh.

| Nhóm | Màn hình / template |
|---|---|
| Xác thực | Đăng nhập desktop và mobile |
| Tổng quan | Dashboard, trạng thái lỗi một phần, phiên bản mobile |
| Đơn hàng | Danh sách, lọc nâng cao, tạo/sửa, nhập nhanh, chi tiết, xác nhận xóa |
| Vận hành | Lịch giao với bản đồ, nhu cầu nguyên liệu, việc nhập hàng |
| Khách hàng | Danh sách và hồ sơ tổng hợp từ người đặt |
| Sản phẩm | Catalog, form sản phẩm, nhận diện ảnh |
| Kho | Tồn kho, phiếu nhập, xuất/điều chỉnh, lịch sử theo mặt hàng |
| Tài chính | Báo cáo, chi phí, dialog thêm khoản chi |
| Nội dung | Brief, ba bản nền tảng, footer và lịch sử phiên bản |
| Cấu hình | Logo/watermark, gợi ý giá, danh mục dùng chung qua điều hướng phụ |
| Quản trị | Người dùng, form tài khoản, vai trò, quyền, menu & điều hướng |
| Dùng chung | Hệ thống màu/chữ, trạng thái dữ liệu và xác nhận phá hủy |

Các route nhiều biến thể tái sử dụng template theo brief: tạo/sửa đơn, tạo/sửa sản phẩm, danh mục thuộc tính, nhập kho và lịch sử kho. Prototype không thay đổi route/API thực tế. Trường hợp sâu như mọi biến thể form dịch đa ngôn ngữ không được vẽ thành một artboard độc lập; cần dùng cùng quy chuẩn khi triển khai.

## Hướng hình ảnh

**Quiet botanical:** ivory ấm và xanh olive, tập trung vào tính dễ đọc. Không dùng hoa trang trí dày, gradient hay hiệu ứng kính. Ảnh hoa được thay bằng placeholder để không giả định asset sản phẩm chưa được cung cấp.

| Token | Giá trị light | Vai trò |
|---|---|---|
| Canvas | `#F7F7F2` | Nền ứng dụng |
| Surface | `#FFFEFA` | Panel, form, dialog |
| Sidebar | `#EEEEE5` | Điều hướng |
| Primary | `#435C46` | Hành động chính |
| Selected | `#DFE8D7` | Mục active, trạng thái thành công |
| Ink | `#26362D` | Nội dung chính |
| Muted | `#677268` | Nội dung phụ |
| Border | `#DEDFD4` | Ranh giới |
| Warning | `#876127` / `#F8EFD9` | Cảnh báo |
| Error | `#A1463A` / `#FBEDE7` | Lỗi, quá hạn |
| Info | `#3F687F` / `#E9F1F4` | Thông tin, đang xử lý |

Inter hỗ trợ tiếng Việt. Serif dành cho wordmark và lời giới thiệu đăng nhập. Tiêu đề trang khoảng 28 px; tiêu đề panel 16 px; nội dung 14 px; nhãn 12 px. Số liệu dùng tabular numerals. Nhịp khoảng cách 4–8–12–16–20–24–32. Control cao 40–44 px, bo 6 px; panel bo 8–9 px, viền 1 px.

## Những thay đổi UX chính

1. Dashboard ưu tiên đơn, giờ giao và cảnh báo kho; các chỉ số tài chính có giải thích ngắn.
2. Tài khoản gọn ở đầu sidebar, ngay trên nút tạo đơn. Điều hướng nhóm theo công việc hằng ngày; phần quản trị hệ thống được thu gọn.
3. Form đơn chia nhóm đánh số; tổng tiền, cọc và giao nhận nằm cạnh nội dung đang nhập.
4. Phân biệt nguyên liệu chuẩn bị và vật tư tồn kho ngay trong bảng định mức.
5. Tách trạng thái đơn và trạng thái thanh toán; chỉ hiển thị bước xử lý hợp lệ tiếp theo.
6. Mobile dùng card/list có nhãn, không thu nhỏ nguyên bảng desktop.
7. Settings dùng điều hướng phụ; trên mobile chuyển thành select nhóm cài đặt.
8. Modal có nhãn, nút hủy, Escape và focus trap. Mobile thể hiện bottom sheet, nội dung cuộn trong thân.

## Quy tắc nghiệp vụ giữ nguyên

- Doanh thu chỉ ghi nhận khi đơn hoàn tất, theo ngày khách thực tế nhận hoa.
- Tiền nhận trước ngày giao chưa phải doanh thu.
- Checkbox báo cáo quyết định có tính phí giao thu khách vào doanh thu.
- Chi phí giao thực tế do cửa hàng trả theo dõi riêng.
- Chỉ sửa đơn ở bước Chờ xác nhận.
- Thanh toán đi theo ba trạng thái Chưa cọc / Đã cọc / Đã thanh toán.
- Nguyên liệu chuẩn bị không trừ kho; vật tư kho có tồn thực.
- Khoản chi từ phiếu nhập có liên kết đối soát, không xóa riêng.
- Trạng thái kinh doanh trong form sản phẩm chỉ đọc.
- Lịch sử content giữ footer snapshot; chỉnh từ lịch sử tạo bản mới.
- Admin giữ toàn bộ quyền; menu động không thay thế permission.

## Mức tương tác của prototype

Các luồng mẫu có thao tác cục bộ: tìm đơn, lọc trạng thái/thanh toán/kênh; tính tổng khi đổi số lượng, giá, cọc và hình thức giao; tạo một đơn mẫu; chuyển tiến độ tới hoàn tất; ghi nhận thanh toán; cập nhật phí giao thực tế; review nhập nhanh; nhập/xuất/điều chỉnh lượng tồn; thêm chi phí; lưu bản content trong phiên; thay đổi mức gợi ý giá; bật/tắt mục menu và xem trước.

Đây là **mockup**, không phải ứng dụng thay thế admin hiện có. Dữ liệu mẫu tách theo từng vùng để trình diễn UI; báo cáo không phải sổ kế toán đồng bộ với mọi thao tác trong phiên. Một số tác vụ phụ chỉ mở form hoặc thông báo minh họa. Các nút AI, nhận diện ảnh, tìm địa chỉ, đăng nhập, xuất Excel/PDF, các biến thể trường danh mục và upload cần nối lại chức năng thật khi triển khai. Tải lại file sẽ khôi phục dữ liệu mẫu.

Ngày snapshot trong giao diện: 07/10/2026. Tên, SĐT, tài khoản, tiền và số lượng đều là dữ liệu minh họa. Cọc mẫu 400.000 đ chỉ phục vụ màn hình thử, không đặt quy tắc cọc mới cho cửa hàng.

## Kiểm tra đã thực hiện

- Bản V1.2: kiểm tra header tài khoản và mở/đóng thông tin tài khoản ở 1440, 1024, 390 và 360 px; không tràn ngang hoặc lỗi JavaScript.

- Render 26 view ở chiều rộng 1440, 1024, 390 và 360 px: không lỗi JavaScript, không tràn ngang toàn tài liệu.
- Thử đổi số lượng từ 1 thành 2: 1.740.000 đ gồm phí giao; chọn lấy tại shop còn 1.700.000 đ.
- Tạo đơn mẫu và chuyển tới Hoàn tất; bước hoàn tất có ngày khách nhận thực tế.
- Nhập 40 tờ vào mặt hàng đang có 12: tồn mới 52.
- Từ khóa không tồn tại hiển thị empty state do lọc.
- Báo cáo có phí giao: lợi nhuận 11,81 triệu; bỏ phí giao: 10,75 triệu.
- Nhập nhanh yêu cầu xác nhận review trước khi áp dụng.
- Escape đóng modal và drawer; đã kiểm tra focus trap bằng bàn phím.
- Render PDF và kiểm tra bố cục các trang qua ảnh.

## Tài nguyên & giấy phép

- Inter: Rasmus Andersson và các tác giả Inter; SIL Open Font License 1.1. Font nhúng trong HTML. Nguồn: https://github.com/rsms/inter
- Lucide: gói icon Lucide tĩnh, ISC License; bản sao giấy phép trong `licenses/`.
- Lucide Animated: pqoqubbw, MIT License; 24 component React + Motion được tích hợp cho thao tác. Nguồn: https://lucide-animated.com và https://github.com/pqoqubbw/icons. Giấy phép và runtime notices nằm trong `licenses/`, source gốc và adapter trong `motion-source/`.
- Bản đồ nền: OpenStreetMap contributors, bản export năm 2020 do Prenn tải lên Wikimedia Commons. Đã cắt vùng trung tâm để dùng trong mockup; các ghim là tọa độ minh họa. Dữ liệu nền lịch sử **không dùng để dẫn đường hoặc xác nhận địa chỉ hiện tại**.
- Nguồn bản đồ: https://commons.wikimedia.org/wiki/File:Ho_Chi_Minh_City_OSM_2020_scale_68000.svg
- Ghi công OSM: https://www.openstreetmap.org/copyright ; dữ liệu ODbL; bản đồ gốc trước 01/08/2020 theo CC BY-SA 2.0. Bản cắt giữ cùng điều kiện tương ứng.

## Hướng tích hợp

Dùng các màn hình này làm đặc tả thị giác và mẫu component. Kết nối lại API hiện có, menu theo quyền, validation thật, truy vết giao dịch và dữ liệu ngày giao theo `Asia/Ho_Chi_Minh`. Không sao chép dữ liệu mẫu, mock handler hoặc giả định quyền từ prototype vào production. Không thay hợp đồng API để phù hợp bản vẽ.
