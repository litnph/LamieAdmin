# Lamie Admin — Hồ sơ nội dung và đặc tả UI/UX để dựng mockup mới

> Cập nhật theo mã nguồn `Admin_Lamie` ngày 07/10/2026.  
> Mục đích: cung cấp một tài liệu độc lập để AI/Designer khác hiểu đúng sản phẩm, nội dung, luồng nghiệp vụ và phạm vi màn hình trước khi vẽ lại UI/UX.

## 0. Cách sử dụng tài liệu

Tài liệu này mô tả **sản phẩm hiện có**, không phải yêu cầu sao chép pixel giao diện cũ.

- Phần nghiệp vụ, dữ liệu, trạng thái, quyền truy cập, route và hành động là sự thật sản phẩm cần được giữ.
- Bố cục hiện tại là bằng chứng về cách sản phẩm đang vận hành; có thể sắp xếp lại để tạo UI/UX mới nếu không làm mất chức năng.
- Thiết kế mới phải là một ứng dụng back-office để làm việc hằng ngày, không phải landing page hay website giới thiệu.
- Không tự thêm module chưa có, không tự đặt quy tắc tài chính mới và không giả định API có khả năng mà mã nguồn chưa thể hiện.
- Menu thật được tải động từ API và lọc theo quyền. Không phải mọi tài khoản đều thấy toàn bộ màn hình trong tài liệu.

## 1. Tóm tắt sản phẩm

### 1.1 Sản phẩm là gì

**Lamie Admin** là hệ thống quản trị vận hành cho một cửa hàng hoa. Hệ thống tập trung vào sáu vùng công việc:

1. Bán hàng: đơn hàng và khách hàng.
2. Vận hành: lịch giao, việc cần làm và chuẩn bị nguyên liệu.
3. Sản phẩm và kho: catalog sản phẩm, tồn kho, nhập/xuất và cấu hình nguyên liệu.
4. Tài chính: doanh thu, chi phí, lợi nhuận và trạng thái thanh toán.
5. Nội dung: tạo content cho Facebook, Instagram và TikTok.
6. Quản trị: người dùng, vai trò, quyền hạn, menu động và cấu hình cửa hàng.

### 1.2 Người dùng chính

- Chủ cửa hàng: theo dõi vận hành, doanh thu, lợi nhuận và các điểm cần chú ý.
- Nhân viên bán hàng: tạo đơn, tìm khách, cập nhật thanh toán và thông tin giao nhận.
- Nhân viên vận hành: xử lý đơn, lịch giao, nguyên liệu cần chuẩn bị và tồn kho.
- Nhân viên nội dung: tạo, chỉnh sửa và lưu content đa nền tảng.
- Quản trị viên: quản lý tài khoản, vai trò, quyền và cấu trúc menu.

### 1.3 Bối cảnh sử dụng

- Được mở nhiều lần mỗi ngày trên laptop/desktop; mobile dùng khi cần kiểm tra hoặc thao tác nhanh.
- Ngôn ngữ UI: tiếng Việt.
- Tiền tệ: VND, hiển thị theo định dạng Việt Nam.
- Múi giờ nghiệp vụ: `Asia/Ho_Chi_Minh`.
- Ưu tiên: đọc lướt nhanh, số liệu rõ, thao tác ít bước, trạng thái không mơ hồ.

### 1.4 Nguyên tắc nghiệp vụ quan trọng

- Doanh thu chỉ được ghi nhận khi đơn hoàn tất, theo ngày khách thực tế nhận hoa.
- Tiền nhận trước ngày giao là dòng tiền vào nhưng chưa phải doanh thu.
- Phí giao hàng thu khách có thể được tính vào doanh thu bằng một tùy chọn báo cáo.
- Chi phí giao hàng cửa hàng trả là chi phí riêng, không tự bù trừ với phí giao hàng thu khách.
- Dữ liệu tổng hợp phải có đường dẫn truy ngược về đơn hàng hoặc giao dịch nguồn.
- Điều hướng và route phải tuân theo quyền của tài khoản hiện tại.

## 2. Kiến trúc thông tin tổng thể

### 2.1 Sidebar chính khi tài khoản có đầy đủ quyền

| Cấp điều hướng | Mục | Route chính | Ý nghĩa |
|---|---|---|---|
| Độc lập | Tổng quan | `/admin/dashboard` | Dashboard vận hành |
| Nhóm Bán hàng | Đơn hàng | `/admin/orders` | Danh sách và xử lý đơn |
| Nhóm Bán hàng | Khách hàng | `/admin/customers` | Hồ sơ khách được tổng hợp từ đơn |
| Nhóm Vận hành | Lịch giao | `/admin/orders/calendar` | Bản đồ và danh sách giao theo ngày |
| Nhóm Vận hành | Việc cần làm | `/admin/tasks` | Chuẩn bị nguyên liệu và cảnh báo nhập hàng |
| Nhóm Sản phẩm & kho | Sản phẩm | `/admin/products` | Catalog, giá, tồn và trạng thái kinh doanh |
| Nhóm Sản phẩm & kho | Kho hàng | `/admin/ingredients/inventory` | Tồn kho, nhập/xuất, điều chỉnh và lịch sử |
| Nhóm Tài chính | Báo cáo tài chính | `/admin/reports` | Doanh thu, chi phí, lợi nhuận |
| Nhóm Tài chính | Chi phí | `/admin/expenses` | Ghi nhận và phân loại khoản chi |
| Độc lập | Nội dung đa kênh | `/admin/content` | Tạo và quản lý content |
| Nhóm Quản trị | Cấu hình cửa hàng | `/admin/settings/catalog` | Workspace cấu hình catalog và cửa hàng |
| Nhóm Quản trị | Người dùng | `/admin/users` | Tài khoản Admin |
| Nhóm Quản trị | Vai trò | `/admin/roles` | Vai trò và quyền được cấp |
| Nhóm Quản trị | Quyền hạn | `/admin/permissions` | Danh mục permission |
| Nhóm Quản trị | Menu & điều hướng | `/admin/navigation` | Cấu trúc Sidebar động |

Lưu ý:

- Sidebar chỉ hiển thị mục mà API trả về sau khi xét quyền.
- Trang `/admin` chuyển đến route đầu tiên mà người dùng được phép mở, không mặc định cứng là Dashboard.
- Khi có quyền tạo đơn, Sidebar có nút primary **“Tạo đơn hàng”** nằm ngay dưới logo.
- Các route tạo, sửa, chi tiết và cấu hình sâu thường không hiện trực tiếp trong Sidebar.

### 2.2 Toàn bộ route màn hình đang đăng ký

| Nhóm | Route | Màn hình |
|---|---|---|
| Xác thực | `/login` | Đăng nhập |
| Tổng quan | `/admin/dashboard` | Tổng quan vận hành |
| Đơn hàng | `/admin/orders` | Danh sách đơn hàng |
| Đơn hàng | `/admin/orders/new` | Tạo đơn hàng |
| Đơn hàng | `/admin/orders/calendar` | Lịch giao trong ngày |
| Đơn hàng | `/admin/orders/:id` | Chi tiết đơn hàng |
| Đơn hàng | `/admin/orders/:id/edit` | Sửa đơn hàng |
| Khách hàng | `/admin/customers` | Danh sách khách hàng |
| Khách hàng | `/admin/customers/:id` | Chi tiết khách hàng |
| Công việc | `/admin/tasks` | Việc cần làm |
| Nguyên liệu | `/admin/ingredients` | Danh mục nguyên liệu chuẩn bị |
| Nguyên liệu | `/admin/ingredients/units` | Đơn vị tính |
| Nguyên liệu | `/admin/ingredients/demand` | Báo cáo nguyên liệu cần chuẩn bị |
| Kho | `/admin/ingredients/inventory` | Kho hàng |
| Kho | `/admin/inventory/receiving` | Nhập kho |
| Kho | `/admin/inventory/transactions` | Lịch sử giao dịch kho |
| Kho | `/admin/settings/catalog/inventory` | Danh mục hàng tồn kho trong Settings |
| Sản phẩm | `/admin/products` | Danh sách sản phẩm |
| Sản phẩm | `/admin/products/create` | Tạo sản phẩm |
| Sản phẩm | `/admin/products/:id/edit` | Chỉnh sửa sản phẩm |
| Sản phẩm | `/admin/products/recognition` | Nhận diện sản phẩm bằng ảnh |
| Sản phẩm | `/admin/products/catalog-settings` | Route chuyển tiếp sang cấu hình gợi ý theo giá |
| Tài chính | `/admin/reports` | Báo cáo tài chính |
| Tài chính | `/admin/expenses` | Danh sách chi phí |
| Content | `/admin/content` | Tạo content đa nền tảng |
| Content | `/admin/content/footer` | Cấu hình footer content |
| Content | `/admin/content/history` | Lịch sử content đã lưu |
| Settings | `/admin/settings/catalog` | Trang vào Cấu hình cửa hàng |
| Settings | `/admin/settings/catalog/product-pricing` | Gợi ý theo giá |
| Settings | `/admin/settings/catalog/branding` | Logo & watermark |
| Settings | `/admin/settings/expense-categories` | Danh mục chi phí |
| Settings | `/admin/settings/channels` | Kênh bán |
| Settings | `/admin/settings/attributes/:attributeKey` | Các nhóm thuộc tính sản phẩm |
| Quản trị | `/admin/users` | Danh sách người dùng |
| Quản trị | `/admin/users/new` | Tạo người dùng |
| Quản trị | `/admin/users/:id/edit` | Sửa người dùng |
| Quản trị | `/admin/roles` | Vai trò & quyền hạn |
| Quản trị | `/admin/permissions` | Quyền hạn |
| Quản trị | `/admin/navigation` | Menu & điều hướng |
| Hệ thống | `/admin/unauthorized` | Không có quyền truy cập |
| Hệ thống | `/admin/not-found` | Không tìm thấy màn hình |

## 3. App shell và hành vi điều hướng

### 3.1 Desktop

- Sidebar trái rộng khoảng `256px`; có thể thu gọn thành icon rail khoảng `76px`.
- Header cao `64px`, đặt trên vùng nội dung, hiển thị tên màn hình hiện tại ở trái.
- Góc phải header có nút chọn màu chủ đạo; người dùng chọn từ palette và lựa chọn được lưu cục bộ.
- Vùng nội dung có chiều rộng tối đa khoảng `1440px`, căn giữa, padding tăng theo viewport.
- Sidebar gồm logo “Lamie / Quản trị cửa hàng”, CTA tạo đơn, cây menu, và tài khoản ở đáy.
- Menu nhóm có thể mở/thu gọn. Nhóm đang chứa route active tự mở.
- Tài khoản ở đáy Sidebar hiển thị avatar chữ cái, họ tên, vai trò; menu popover có email và Đăng xuất.

### 3.2 Mobile và tablet

- Dưới `1024px`, Sidebar biến thành drawer phủ từ trái với backdrop.
- Header hiển thị nút hamburger, tên màn hình và nút chọn màu.
- Drawer khóa cuộn nền, đóng bằng nút X, click backdrop hoặc phím Escape; focus được giữ trong drawer.
- Các cụm action trên header trang được phép xuống dòng hoặc xếp dọc.
- Bảng nhiều cột chuyển thành card/list có nhãn dữ liệu; không ép người dùng đọc bảng bị co nhỏ.
- Điều hướng phụ ngang của Content/Nguyên liệu cho phép cuộn ngang.
- Workspace Settings đổi sidebar phụ thành select **“Nhóm cài đặt”** trên màn hình nhỏ.
- Modal trở thành bottom sheet toàn chiều rộng trên mobile và dialog căn giữa trên màn hình lớn.

### 3.3 Điều hướng và quyền

- Menu, route và action đều có thể bị ẩn hoặc khóa theo permission.
- Nếu chưa đăng nhập, route Admin chuyển về `/login` và ghi nhớ đường dẫn cần quay lại.
- Nếu thiếu quyền, người dùng được chuyển đến trang “Không có quyền truy cập”.
- Nếu cấu hình điều hướng lỗi, hiển thị màn hình có nút **“Thử lại”** thay vì app trắng.
- Nếu tài khoản không có route phù hợp, hiển thị “Không có mục điều hướng phù hợp”.

## 4. Ngôn ngữ hình ảnh hiện tại

Đây là baseline tham khảo; thiết kế mới có thể thay đổi thẩm mỹ nhưng nên giữ cảm giác đáng tin, rõ và ấm.

### 4.1 Màu

| Vai trò | Giá trị hiện tại | Cách dùng |
|---|---|---|
| Primary mặc định | `#6B7B8B` | CTA, focus, trạng thái active |
| Canvas ấm | `#F7F6F3` | Nền ứng dụng |
| Sidebar ấm | `#F1EFEB` | Nền điều hướng |
| Surface | `#FFFFFF` | Panel, bảng, popover |
| Border | `#DED8D1` | Ranh giới nhẹ |
| Text chính | `#292623` | Heading, số liệu, nội dung chính |
| Text phụ | `#625D57` | Mô tả, label phụ |
| Text muted | `#756F69` | Metadata |
| Success | `#356342` | Thành công, tồn ổn định |
| Warning | `#7A5D22` | Cảnh báo |
| Error | `#A23E3E` | Lỗi, hành động nguy hiểm |
| Info | `#41677A` | Thông tin |

Primary là màu có thể cấu hình. Thiết kế không nên phụ thuộc vào một mã primary cố định để truyền đạt ý nghĩa.

### 4.2 Typography và mật độ

- Font hệ thống: `Segoe UI Variable`, `Segoe UI`, `Helvetica Neue`, `Arial`, sans-serif.
- Tiêu đề trang: khoảng `24–28px`, semibold.
- Tiêu đề panel: khoảng `16–20px`, semibold.
- Body và dữ liệu bảng: khoảng `14px`.
- Label/metadata: khoảng `12px`.
- Số tiền và số lượng dùng tabular numerals khi phù hợp.
- Mật độ trung bình đến cao; nội dung phải quét nhanh nhưng không chật chội.

### 4.3 Hình khối và chiều sâu

- Control cao tối thiểu `40–44px`, bo góc `8px`.
- Panel bo góc `12px`.
- Giao diện gần như phẳng; dùng nền và border để phân tầng.
- Shadow rất nhẹ cho panel, shadow rõ hơn chỉ dùng cho popover/modal.
- Badge trạng thái có thể dạng pill hoặc rounded label nhỏ.
- Icon dùng Lucide, cỡ phổ biến `16–20px`, stroke khoảng `1.8`.

### 4.4 Điều cần tránh khi vẽ lại

- Không biến dashboard thành landing page với hero marketing.
- Không dùng card cho mọi dòng hoặc lồng card nhiều tầng.
- Không lạm dụng gradient, glassmorphism, glow hoặc animation trang trí.
- Không chỉ dùng màu để diễn đạt trạng thái; luôn có nhãn chữ hoặc icon.
- Không đẩy các trang quản trị hệ thống lên ngang hàng với công việc hằng ngày.
- Không thêm họa tiết hoa dày đặc; thương hiệu hoa nên xuất hiện tinh tế.

## 5. Các mẫu giao diện dùng chung

### 5.1 Page header

- Tiêu đề lớn.
- Một câu mô tả ngắn, chiều dài tối đa khoảng 65 ký tự hiển thị.
- Khu action bên phải: một primary action và các secondary action khi cần.
- Trên mobile, action chiếm toàn chiều rộng hoặc wrap thành nhiều hàng.

### 5.2 List và data table

- Phía trên thường có search/filter panel.
- Desktop dùng table hoặc list dạng hàng có header cột.
- Mobile dùng card/list có nhãn rõ cho từng giá trị.
- Có pagination với thông tin “Hiển thị X–Y trong Z”, trang hiện tại, Trước/Sau.
- Dòng được phép có action icon: Xem, Sửa, Xóa, lịch sử hoặc thao tác nghiệp vụ.

### 5.3 Form

- Label đặt trên field; field cao khoảng 44px.
- Trường bắt buộc có dấu `*`; trường tùy chọn ghi rõ “không bắt buộc”.
- Helper text giải thích hậu quả nghiệp vụ, không chỉ lặp lại label.
- Form dài chia thành section có heading; action lưu/hủy rõ ràng.
- Form sản phẩm có action bar cố định dưới màn hình trên mobile.

### 5.4 Dialog

- Có title, description, nút X, vùng body cuộn độc lập và footer action.
- Mobile: bottom sheet; desktop: modal giữa màn hình.
- Dialog nguy hiểm phải mô tả đối tượng và hậu quả trước khi xác nhận.
- Focus trap, Escape để đóng, trả focus về trigger sau khi đóng.

### 5.5 Trạng thái bắt buộc cho mockup

Mỗi màn hình dữ liệu phải tính đến:

- Loading/skeleton.
- Dữ liệu thành công.
- Empty state lần đầu.
- Empty state do bộ lọc.
- Lỗi toàn màn hình có Retry.
- Lỗi một phần nhưng phần còn lại vẫn dùng được.
- Read-only do thiếu quyền quản lý.
- Disabled/busy khi đang lưu.
- Success feedback sau thao tác.
- Confirm trước hành động xóa, hủy hoặc vô hiệu hóa.

## 6. Đặc tả từng màn hình

### 6.1 Đăng nhập — `/login`

**Mục tiêu:** xác thực bằng email hoặc tên đăng nhập và mật khẩu.

**Nội dung:**

- Khối giới thiệu thương hiệu “Lamie Flower Shop”, mô tả công cụ vận hành cửa hàng hoa.
- Form “Lamie Admin / Đăng nhập”.
- Field “Email hoặc tên đăng nhập”.
- Field “Mật khẩu”.
- Nút “Đăng nhập”, chuyển thành “Đang đăng nhập…” khi submit.
- Thông báo lỗi đặt ngay trên form.
- Dòng hỗ trợ “Cần quyền truy cập? Liên hệ quản trị hệ thống.”

**Bố cục hiện tại:** desktop chia hai cột thương hiệu/form; mobile chỉ giữ form. Đây là màn hình duy nhất hiện dùng bề mặt kính và nền gradient nhẹ.

### 6.2 Tổng quan vận hành — `/admin/dashboard`

**Mục tiêu:** trả lời nhanh hôm nay cần xử lý gì và tình trạng doanh thu/tồn kho ra sao.

**Header và bộ lọc:**

- Checkbox “Tính phí giao hàng vào doanh thu”.
- Khoảng thời gian: 7 ngày, 30 ngày, 90 ngày.
- Nút “Làm mới”.
- Dòng “Dữ liệu cập nhật lúc …”.

**Khối KPI gồm 4 ô:**

1. Đơn cần xử lý: tổng đơn, chờ xác nhận, đang chuẩn bị.
2. Sắp giao hoặc giao trễ: quá hạn và 24 giờ tới.
3. Tồn kho cần chú ý: sắp hết và hết hàng.
4. Doanh thu: tổng kỳ, so với kỳ trước, tách tiền sản phẩm và phí giao hàng.

**Khối “Việc cần ưu tiên”:** sáu action tile trên một hàng desktop, tự wrap trên màn hình nhỏ:

- Đơn mới.
- Chờ xác nhận.
- Đang chuẩn bị.
- Giao trễ.
- Sắp hết hàng.
- Hết hàng.

**Phần chi tiết:**

- Danh sách “Đơn cần xử lý”, có link xem tất cả đơn.
- Danh sách “Sắp giao và giao trễ”, có link mở lịch giao.
- Biểu đồ “Xu hướng doanh thu”, tách doanh thu sản phẩm và phí giao hàng, kèm bảng dữ liệu accessible.
- Danh sách “Tồn kho cần chú ý”, có link xem/chỉnh sản phẩm.

**Trạng thái:** skeleton, lỗi toàn bộ, cảnh báo lỗi một phần, empty riêng cho từng panel.

### 6.3 Danh sách đơn hàng — `/admin/orders`

**Mục tiêu:** tìm, lọc, xem và xử lý đơn nhanh.

**Header:** title “Đơn hàng”, mô tả các đơn chờ xác nhận/đang chuẩn bị/sắp giao/giao trễ, CTA “Tạo đơn”.

**Bộ lọc chính:**

- Từ khóa: mã đơn, tên người đặt hoặc người nhận.
- Số điện thoại người đặt/người nhận.
- Trạng thái đơn.
- Trạng thái thanh toán.
- Kênh bán.
- Ngày giao từ/đến.
- Sắp xếp: thời gian giao sớm/muộn, ngày tạo mới/cũ, giá trị cao/thấp.
- Nút “Lọc nâng cao”, “Xóa bộ lọc”, “Tìm và lọc”.

**Lọc nâng cao trong modal:** trạng thái đơn, thanh toán, kênh bán và ngày tạo từ/đến.

**Danh sách desktop:**

- Mã đơn.
- Ảnh đại diện hoặc placeholder.
- Thời gian giao.
- Người nhận và số điện thoại.
- Ghi chú.
- Số tiền.
- Thanh toán.
- Trạng thái.
- Hành động Xem/Xóa tùy quyền.

**Mobile:** mỗi đơn là một khối có ảnh, người nhận, tổng tiền, thanh toán, thời gian giao, ghi chú và action.

**Xóa đơn:** dialog cảnh báo toàn bộ sản phẩm, ảnh và lịch sử thay đổi sẽ bị xóa; không thể hoàn tác.

### 6.4 Tạo/Sửa đơn hàng — `/admin/orders/new`, `/admin/orders/:id/edit`

Đây là một trong những màn hình quan trọng và phức tạp nhất.

**Header actions:**

- “Nhập nhanh” chỉ khi tạo mới.
- “Quay lại”.
- “Hủy”.
- Primary “Tạo đơn” hoặc “Cập nhật đơn”.

**Bố cục desktop:** hai cột; cột trái rộng chứa dữ liệu chính, cột phải chứa tóm tắt chi phí và giao nhận. Mobile xếp một cột.

**Section Khách hàng:**

- Người nhận, SĐT người nhận.
- Checkbox “Người nhận là người đặt”.
- Người đặt, SĐT người đặt.
- Kênh bán.
- Tìm và liên kết Member cũ theo tên/SĐT.
- Switch “Tạo Member” nếu chưa có Member.

**Section Sản phẩm trong đơn:**

- Thêm sản phẩm từ catalog hoặc tạo sản phẩm ngoài danh mục.
- Tìm theo mã/tên; ảnh, tên, số lượng, đơn giá, thành tiền.
- Với sản phẩm ngoài catalog: bắt buộc danh mục và dòng sản phẩm.
- Ghi chú yêu cầu riêng, ảnh minh họa.
- Tùy chọn thiệp và banner, kèm nội dung tương ứng.
- Có thể mở rộng từng dòng để chỉnh đầy đủ và xóa dòng.

**Section Nguyên liệu & vật tư:**

- Quản lý theo từng sản phẩm trong đơn.
- “Nguyên liệu” dùng cho báo cáo chuẩn bị, không trừ kho.
- “Vật tư kho” có size/quy cách và sẽ ảnh hưởng tồn kho.
- Cho phép áp dụng định mức mặc định của sản phẩm hoặc tùy chỉnh riêng cho đơn.
- Hiển thị định mức mỗi sản phẩm, tổng cho đơn và tồn còn lại dự kiến.

**Section Ghi chú đơn:** textarea nội dung cần lưu ý.

**Tóm tắt & chi phí:**

- Checkbox “Đã thanh toán”.
- Trạng thái preview: Chưa cọc / Đã cọc / Đã thanh toán.
- Tiền cọc và nút “Áp dụng cọc mặc định”.
- Phí giao dự kiến.
- Phí giao thực tế.

**Giao nhận:**

- Ba lựa chọn: Giao nội thành, Ship tỉnh, Lấy tại shop.
- Thời gian chính xác hoặc khoảng thời gian Từ/Đến.
- Với ship tỉnh, thời gian là lúc bàn giao cho đơn vị vận chuyển.
- Lấy tại shop không cần địa chỉ và phí giao.
- Địa chỉ có thể được nhập/tự phân tích theo đơn vị hành chính.
- Hỗ trợ tìm địa chỉ, dùng vị trí hiện tại, ghim bản đồ và mô tả địa chỉ thực tế.

**Nhập nhanh nhiều đơn:**

- Modal hai vùng: nhập/phân tích ở trái, danh sách đơn chờ ở phải.
- Dán đoạn chat hoặc tải ảnh chụp chat.
- Hệ thống đưa gợi ý người đặt, kênh bán, địa chỉ, sản phẩm, giá, cọc và ship.
- Người dùng phải review/chỉnh sửa trước khi áp dụng.
- Có thể xếp tối đa 50 đơn vào batch và lưu một lần.

**Ràng buộc:** chỉ sửa được khi đơn còn ở trạng thái Chờ xác nhận. Đơn đang xử lý, hoàn tất hoặc đã hủy hiển thị màn hình chặn sửa.

### 6.5 Chi tiết đơn hàng — `/admin/orders/:id`

**Header:** mã đơn, thời điểm tạo, kênh bán, action “Sửa đơn” nếu còn hợp lệ.

**Khối Trạng thái và hành động:**

- Badge trạng thái đơn.
- Chỉ hiển thị bước hợp lệ tiếp theo.
- Có action Hủy đơn, Trả về bước trước hoặc cập nhật phí giao thực tế theo quyền/trạng thái.
- Khu thanh toán cho phép tiến từ Chưa cọc → Đã cọc → Đã thanh toán; trạng thái hoàn tất không còn action tiếp.

**Thông tin chính:**

- Giao hàng và khách hàng: thời gian, địa chỉ, người nhận, người đặt, người gửi, số điện thoại, kênh.
- Danh sách sản phẩm: ảnh, tên, SKU, ghi chú, thiệp, banner, đơn giá, số lượng, thành tiền.
- Nguyên liệu cần chuẩn bị và vật tư kho sử dụng.
- Ghi chú/mô tả/nội dung cần thực hiện.
- Tổng kết thanh toán: tạm tính, phí giao dự kiến, phí giao thực tế, điều chỉnh, tổng cộng, đã thanh toán, còn lại, tiền cọc.
- Ảnh đính kèm; double-click để xem lớn.
- Timeline trạng thái và thay đổi, mới nhất trước, ghi người thực hiện.

**Trạng thái:** loading, lỗi có Retry, không tìm thấy, dialog trả về bước trước, dialog chỉnh phí giao thực tế.

### 6.6 Lịch giao trong ngày — `/admin/orders/calendar`

**Mục tiêu:** xem tất cả đơn phải giao trong một ngày.

- Header có ngày đang xem và nút Tải lại.
- Bộ lọc “Ngày giao”.
- Bản đồ các điểm giao; đơn lấy tại shop hoặc thiếu tọa độ không xuất hiện trên bản đồ.
- Danh sách giao hàng bên dưới hoặc cạnh bản đồ tùy viewport.
- Empty state “Không có đơn trong ngày”.
- Loading và lỗi riêng cho bản đồ/danh sách.

### 6.7 Danh sách khách hàng — `/admin/customers`

Khách hàng được tổng hợp từ các đơn có cùng số điện thoại người đặt, không phải một CRM độc lập hoàn toàn.

**Bộ lọc:** tên hoặc số điện thoại, trạng thái đơn đã từng có, nút Tìm kiếm và Xóa lọc.

**Danh sách:**

- Khách hàng.
- Thông tin liên hệ.
- Số đơn.
- Tổng chi tiêu.
- Lần mua gần nhất.
- Đơn gần nhất.
- Action “Xem”.

**Trạng thái:** không có quyền, lỗi, không có dữ liệu, không có kết quả do lọc, loading và pagination.

### 6.8 Chi tiết khách hàng — `/admin/customers/:id`

**Header:** tên khách, mô tả cách tổng hợp hồ sơ, action “Gọi khách hàng”.

**KPI:** tổng số đơn, đơn đã thanh toán, tổng chi tiêu, lần mua gần nhất.

**Nội dung:**

- Thông tin liên hệ: họ tên, SĐT, email.
- Ghi chú nội bộ khách hàng, nút “Lưu ghi chú”.
- Địa chỉ giao gần đây, có link về đơn nguồn.
- Ghi chú từ đơn hàng, tải theo từng đơn và có thể lỗi một phần.
- Lịch sử mua hàng: mã đơn, ngày tạo, người nhận, tổng đơn, thanh toán, trạng thái, action Xem.
- Trên mobile, lịch sử dùng card; desktop dùng table.

### 6.9 Việc cần làm — `/admin/tasks`

**Mục tiêu:** một workspace vận hành cho hai nhóm việc.

**Tab 1 — Nguyên liệu cần chuẩn bị:** mở báo cáo nhu cầu nguyên liệu nếu có quyền.

**Tab 2 — Việc nhập hàng:**

- Search theo mã, tên hoặc size.
- Danh sách mặt hàng, size, tồn hiện tại/ngưỡng và trạng thái.
- Chỉ hiển thị mặt hàng đang ở hoặc dưới ngưỡng cần bổ sung.
- Empty state khi tất cả mặt hàng đều cao hơn ngưỡng.
- Pagination.

Nếu người dùng không có quyền xem cả hai nguồn, hiển thị thông báo thiếu quyền thay vì tab rỗng.

### 6.10 Danh mục nguyên liệu — `/admin/ingredients`

Nằm trong shell phụ gồm ba tab: **Danh mục chuẩn bị / Đơn vị tính / Nguyên liệu cần chuẩn bị**.

**Danh sách:** search theo mã/tên, tùy chọn hiện mục đã tắt, mã, tên, đơn vị gốc, số quy cách, action xem/sửa.

**Form thêm/sửa:**

- Mã nguyên liệu.
- Tên nguyên liệu.
- Đơn vị gốc.
- Trạng thái hoạt động.
- Ghi chú.
- Danh sách quy cách đóng gói: mã, tên, đơn vị, hệ số về đơn vị gốc, trạng thái.

Nguyên liệu đã được tham chiếu có thể tắt nhưng không được xóa lịch sử.

### 6.11 Đơn vị tính — `/admin/ingredients/units`

**Danh sách:** mã, tên đơn vị, ký hiệu, có/không cho số thập phân, số liên kết tham chiếu, action.

**Form:** mã, ký hiệu, tên, checkbox cho phép số lượng thập phân, trạng thái hoạt động.

Đơn vị có tham chiếu nên tắt thay vì đổi ý nghĩa hoặc xóa.

### 6.12 Nguyên liệu cần chuẩn bị — `/admin/ingredients/demand`

**Bộ lọc:** ngày giao từ/đến và trạng thái đơn: Chờ xác nhận, Đang chuẩn bị, Đang giao, Hoàn tất.

**Tổng hợp:**

- Tổng nhu cầu theo từng nguyên liệu.
- Chuyển đổi sang quy cách phù hợp và phần lẻ theo đơn vị gốc.
- Cảnh báo khi đơn lịch sử không có snapshot công thức và phải dùng công thức hiện tại.

**Chi tiết theo đơn:**

- Mã đơn, ngày giao, số sản phẩm.
- Expand để xem nguyên liệu, định mức mỗi sản phẩm, tổng và nguồn dữ liệu.
- Link mở chi tiết đơn.
- Pagination và empty state.

### 6.13 Kho hàng — bốn route dùng chung một workspace

#### A. Kho hàng — `/admin/ingredients/inventory`

- Tìm theo mã, tên hoặc size.
- Lọc trạng thái: Bình thường, Tồn thấp, Hết hàng.
- Checkbox hiện mục đã tắt.
- Danh sách: mặt hàng, size, tồn/ngưỡng, trạng thái, action.
- Action theo dòng: Xuất kho, Điều chỉnh tồn, Lịch sử, Sửa.
- CTA “Tạo phiếu nhập kho”.

#### B. Nhập kho — `/admin/inventory/receiving`

- Vẫn dùng danh sách tồn làm ngữ cảnh.
- CTA mở dialog phiếu nhập kho.
- Phiếu gồm ngày nhập, hóa đơn tùy chọn, nhiều dòng hàng/size/số lượng, ghi chú.
- Có thể đồng thời ghi nhận vào Chi phí: danh mục chi phí và số tiền.

#### C. Lịch sử giao dịch — `/admin/inventory/transactions`

- Dùng cùng danh sách mặt hàng; người dùng chọn action Lịch sử ở một dòng.
- Dialog lịch sử hiển thị thời điểm, loại giao dịch, phiếu/đơn/ghi chú, lượng tăng giảm và số dư sau giao dịch.
- Loại giao dịch gồm nhập kho, dùng cho đơn, hoàn từ đơn, xuất thủ công và điều chỉnh.

#### D. Danh mục hàng tồn kho — `/admin/settings/catalog/inventory`

- Hiển thị bên trong Settings shell.
- Form thêm/sửa mặt hàng: mã, tên, đơn vị tính, trạng thái, ghi chú, có/không dùng size.
- Mỗi size có tên, ngưỡng tồn thấp và trạng thái.
- Không đổi cấu hình size hoặc đơn vị nếu đã có tồn/lịch sử; tắt size cũ và thêm size mới.

**Dialog xuất/điều chỉnh:** luôn hiển thị tồn hiện tại và tồn sau thao tác; yêu cầu lý do/ghi chú; xuất kho có cảnh báo thao tác vĩnh viễn.

### 6.14 Danh sách sản phẩm — `/admin/products`

**Header actions:** Tải lại, Nhận diện ảnh, Thêm sản phẩm tùy quyền.

**Bộ lọc:**

- Tên hoặc SKU.
- Dòng sản phẩm.
- Danh mục.
- Tồn kho: tất cả, làm theo đơn, còn hàng, sắp hết, hết hàng.
- Kinh doanh: tất cả, đang bán, đang ẩn.
- Nút Tìm và Xóa lọc; hiển thị số bộ lọc đang dùng.

**Danh sách:** ảnh/tên/SKU, phân loại, giá, tồn kho, trạng thái kinh doanh và action Sửa/Chỉ xem/Xóa.

**Responsive:** desktop table, mobile card; pagination ở cuối.

**Cảnh báo:** tài khoản chỉ xem không có action chỉnh sửa; có thể hiển thị cảnh báo khi xuất dữ liệu frontend tĩnh không hoàn chỉnh.

### 6.15 Tạo/Chỉnh sửa sản phẩm — `/admin/products/create`, `/admin/products/:id/edit`

Đây là form dài có nhiều vùng nội dung.

**Header:** nút quay lại, tiêu đề Tạo/Chỉnh sửa sản phẩm, mô tả, indicator “Có thay đổi chưa lưu”.

**Cột chính:**

1. **Thông tin sản phẩm:** dòng sản phẩm, danh mục, ngôn ngữ, SKU, tên, slug, mô tả; hỗ trợ nhiều ngôn ngữ.
2. **Thuộc tính bổ sung dạng disclosure:** thẻ, màu sắc, bộ sưu tập, phong cách, dịp tặng.
3. **Giá bán và tồn kho:** có/không quản lý tồn, giá bán, giá khuyến mãi, số lượng tồn.
4. **Sản phẩm tương tự:** multi-select sản phẩm liên quan.
5. **Nguyên liệu:** một bảng chung cho nguyên liệu không trừ kho và vật tư có trừ kho; số lượng, size, ghi chú.
6. **Hình ảnh chi tiết:** upload nhiều ảnh, kéo thả, preview, sắp xếp, xóa, badge “Chờ tải/Đã lưu”.

**Cột phụ:**

- Ảnh đại diện: upload, preview, thay/xóa ảnh.
- Trạng thái hiển thị: chỉ đọc vì API hiện chưa nhận cập nhật trường này.
- Vùng nguy hiểm xóa sản phẩm khi chỉnh sửa.

**Action bar:** Hủy và Lưu sản phẩm/Lưu thay đổi; cố định dưới màn hình trên mobile. Rời trang khi có thay đổi phải xác nhận.

### 6.16 Nhận diện sản phẩm bằng ảnh — `/admin/products/recognition`

- Upload hoặc kéo thả một ảnh JPG/PNG/WebP tối đa 10 MB, ảnh phải chưa có watermark.
- Panel trái: ảnh nguồn và trạng thái catalog đã lập chỉ mục.
- Panel phải: tối đa 5 sản phẩm gần giống, có thumbnail và điểm tương đồng.
- Giải thích điểm tương đồng không phải độ chính xác tuyệt đối.
- Empty state trước khi chọn ảnh và empty state khi không có kết quả đủ ngưỡng tin cậy.

### 6.17 Báo cáo tài chính — `/admin/reports`

**Header actions:** Xuất Excel và In/Lưu PDF.

**Bộ lọc:**

- Từ ngày giao, đến ngày giao.
- Nhóm dữ liệu: Tự động, Theo ngày, Theo tháng.
- Checkbox tính phí giao hàng vào doanh thu.
- Xem báo cáo và Đặt lại.

**KPI gồm 6 ô:**

- Doanh thu.
- Tiền sản phẩm.
- Phí giao hàng.
- Chi phí.
- Lợi nhuận.
- Biên lợi nhuận.

**Nội dung phân tích:**

- Biểu đồ doanh thu và chi phí theo kỳ, tách doanh thu, tiền sản phẩm, phí giao hàng và chi phí.
- Breakdown doanh thu theo dòng sản phẩm.
- Breakdown doanh thu theo danh mục.
- Bảng chi tiết theo kỳ: kỳ, doanh thu, tiền sản phẩm, phí giao, chi phí, lợi nhuận, số giao dịch.
- Breakdown chi phí theo danh mục và tỷ trọng.
- Khối “Quy tắc tính báo cáo” giải thích công thức doanh thu/lợi nhuận.

**Trạng thái:** loading, error/retry, không có chi phí, không có dữ liệu phân loại, lỗi export.

### 6.18 Chi phí — `/admin/expenses`

**Header actions:** link Danh mục và CTA Thêm khoản chi.

**Tổng hợp theo kỳ:** tổng chi, số khoản chi, trung bình và phân bổ theo danh mục.

**Bộ lọc:** từ khóa, danh mục, ngày từ/đến, Lọc và Xóa lọc.

**Danh sách:** ngày chi, nội dung, danh mục, số tiền, ghi chú, action Sửa/Xóa. Khoản chi sinh từ phiếu nhập kho có badge riêng và không được xóa tự do để bảo toàn đối soát.

**Form thêm/sửa:** danh mục, ngày chi, số tiền, nội dung và ghi chú.

**Danh mục chi phí:** được quản lý trong Settings; cần có ít nhất một danh mục hoạt động trước khi tạo khoản chi.

### 6.19 Content đa nền tảng — ba màn hình trong một shell tab

Shell có ba tab: **Tạo content / Cấu hình footer / Lịch sử đã lưu**.

#### A. Tạo content — `/admin/content`

**Bước 1 — Chọn nguồn:** sản phẩm có sẵn hoặc tối đa một nhóm ảnh tải lên. Nếu chọn sản phẩm, dữ kiện tên/giá/ảnh lấy từ server.

**Bước 2 — Nền tảng đầu ra:** luôn tạo ba bản riêng cho Facebook, Instagram và TikTok.

**Bước 3 — Brief:** chủ đề/dịp tặng, giọng văn, ngôn ngữ, ghi chú dữ kiện và hướng dẫn riêng.

**Kết quả:** ba card theo nền tảng, body có thể chỉnh sửa, footer snapshot chỉ đọc, hashtag, action Sao chép và Lưu vào lịch sử.

**Trạng thái:** kiểm tra cấu hình provider, provider chưa cấu hình, chỉ có quyền xem, đang tạo/có thể hủy, warning từ AI, bản nháp chưa lưu, đã lưu.

Khóa AI không bao giờ xuất hiện ở trình duyệt; provider chạy ở API server.

#### B. Cấu hình footer — `/admin/content/footer`

- Ba cấu hình riêng cho Facebook, Instagram, TikTok.
- Mỗi nền tảng có trạng thái bật/tắt.
- Nội dung thông tin cửa hàng/CTA.
- Hashtag mặc định.
- Preview footer đã ghép.
- Khi lưu content, footer được chụp snapshot; đổi cấu hình sau này không thay lịch sử cũ.

#### C. Lịch sử content — `/admin/content/history`

- Bộ lọc ngày lưu từ/đến, sản phẩm và nền tảng.
- Bảng: nguồn, nền tảng, phong cách, thời điểm lưu, action Xem.
- Pagination.
- Dialog chi tiết: nguồn, phong cách, provider/model, quan hệ phiên bản, body và footer snapshot.
- Chỉnh từ lịch sử phải tạo phiên bản mới; không ghi đè bản cũ.

### 6.20 Cấu hình cửa hàng — `/admin/settings/catalog`

Đây là workspace có điều hướng phụ riêng.

**Desktop:** sidebar phụ rộng khoảng `240px`, chia nhóm, nội dung ở phải.  
**Mobile:** select “Nhóm cài đặt” thay sidebar phụ.

**Các nhóm:**

1. **Cửa hàng & sản phẩm**
   - Logo & watermark.
   - Gợi ý theo giá.
2. **Danh mục vận hành**
   - Danh mục nguyên liệu.
   - Danh mục hàng tồn kho.
   - Đơn vị tính.
3. **Bán hàng**
   - Kênh bán.
4. **Tài chính**
   - Danh mục chi phí.
5. **Thuộc tính sản phẩm**
   - Danh mục.
   - Dòng sản phẩm.
   - Bộ sưu tập.
   - Màu sắc.
   - Ngôn ngữ.
   - Dịp.
   - Phong cách.
   - Thẻ.

Tài khoản có quyền mở Settings nhưng không có quyền xem nhóm dữ liệu nào sẽ thấy thông báo thiếu quyền, không thấy workspace rỗng.

### 6.21 Logo & watermark — `/admin/settings/catalog/branding`

- Upload và preview logo shop.
- Bật/tắt watermark ảnh sản phẩm.
- Chọn nguồn watermark: SKU, logo shop hoặc ảnh tải lên.
- Preview watermark trên ảnh mẫu.
- Cảnh báo khi nguồn đã chọn chưa có dữ liệu.
- Tắt watermark không xóa logo hoặc ảnh nguồn.

### 6.22 Gợi ý theo giá — `/admin/settings/catalog/product-pricing`

- Một thiết lập phần trăm độ lệch giá chuẩn.
- Giải thích khoảng giá được tính đối xứng quanh giá hiệu lực của sản phẩm.
- Preview khoảng gợi ý cho một mức giá mẫu.
- Action lưu và success feedback.

### 6.23 Kênh bán — `/admin/settings/channels`

**Danh sách:** mã, tên hiển thị, thứ tự, trạng thái, action.

**Form:** mã kênh bất biến sau khi tạo, thứ tự, tên hiển thị, URL icon tùy chọn, trạng thái hoạt động.

- Tắt kênh khiến kênh không còn xuất hiện trong luồng đơn mới nhưng đơn cũ vẫn giữ tham chiếu.
- Xóa kênh là vùng nguy hiểm và API có thể từ chối nếu đang được dùng.
- Tài khoản chỉ xem phải thấy nhãn “Chỉ xem” và không thấy action quản lý.

### 6.24 Thuộc tính sản phẩm — `/admin/settings/attributes/:attributeKey`

Một màn hình dùng chung cho tám loại dữ liệu:

- `/admin/settings/attributes/categories`: Danh mục.
- `/admin/settings/attributes/product-types`: Dòng sản phẩm.
- `/admin/settings/attributes/collections`: Bộ sưu tập.
- `/admin/settings/attributes/colors`: Màu sắc.
- `/admin/settings/attributes/languages`: Ngôn ngữ.
- `/admin/settings/attributes/occasions`: Dịp.
- `/admin/settings/attributes/styles`: Phong cách.
- `/admin/settings/attributes/tags`: Thẻ.

**Danh sách chung:** mã hoặc giá trị chính, tên hiển thị, trạng thái, thao tác.

**Form thay đổi theo loại:**

- Ngôn ngữ: mã và tên ngôn ngữ.
- Màu: mã Hex, color picker và RGB tự tính.
- Dòng sản phẩm: mã ổn định và thứ tự hiển thị.
- Các thuộc tính dịch được: nhiều bản dịch theo ngôn ngữ, tên và mô tả.
- Trạng thái hoạt động.
- Vùng nguy hiểm xóa mục.

Mỗi mục được lưu riêng. API có thể từ chối xóa nếu sản phẩm vẫn tham chiếu.

### 6.25 Danh mục chi phí — `/admin/settings/expense-categories`

**Danh sách:** tên, mô tả, thứ tự, số khoản chi tham chiếu, trạng thái và action.

**Form:** tên duy nhất, mô tả, thứ tự và trạng thái hoạt động.

Danh mục đã được sử dụng không được xóa; tắt để giữ dữ liệu cũ.

### 6.26 Người dùng — `/admin/users`

**Danh sách:** email, họ tên, tên đăng nhập, vai trò, trạng thái và action.

**Action:** Tạo người dùng, Sửa người dùng, Đặt lại mật khẩu.

**Form tạo/sửa:**

- Khi tạo: email, tên đăng nhập, mật khẩu tối thiểu 8 ký tự.
- Cả tạo và sửa: họ tên, số điện thoại, vai trò, trạng thái hoạt động.
- Quyền truy cập được kế thừa từ vai trò.
- Form hẹp, tối đa khoảng `672px`, không cần trải toàn màn hình.

**Đặt lại mật khẩu:** dialog nhập mật khẩu mới, tối thiểu 8 ký tự.

### 6.27 Vai trò & quyền hạn — `/admin/roles`

**Danh sách vai trò:** tên, mã, mô tả, badge hệ thống, số người dùng, số quyền và action.

**Form vai trò:**

- Mã vai trò.
- Tên vai trò.
- Mô tả.
- Trạng thái hoạt động.
- Search quyền theo mã/tên/nhóm.
- Permission được nhóm theo nghiệp vụ; có action chọn/bỏ cả nhóm.
- Permission đã tắt vẫn được hiển thị để xử lý liên kết cũ.
- Preview menu mà vai trò sẽ nhìn thấy.

Vai trò Admin luôn giữ toàn bộ quyền. Vai trò hệ thống hoặc vai trò đang có người dùng được bảo vệ khỏi xóa.

### 6.28 Quyền hạn — `/admin/permissions`

**Bộ lọc:** từ khóa, nhóm quyền, loại Hệ thống/Tùy chỉnh, trạng thái Hoạt động/Đã tắt.

**Danh sách:** tên, mã permission, mô tả, nhóm, hệ thống/tùy chỉnh, trạng thái, số vai trò đang dùng và action.

**Form:** mã dạng `module.action`, tên, nhóm, thứ tự, trạng thái và mô tả. Mã bất biến sau khi tạo.

Vô hiệu hóa không xóa grant cũ nhưng grant không còn tạo quyền truy cập cho đến khi kích hoạt lại.

### 6.29 Menu & điều hướng — `/admin/navigation`

**Bố cục desktop:** hai cột.

- Trái: cây điều hướng có thứ tự, badge Bật/Tắt, Route ẩn, Hệ thống và action lên/xuống, bật/tắt, sửa, xóa.
- Phải: preview Sidebar từ các mục đang bật và hiển thị.

**Form mục menu:**

- Key.
- Nhãn.
- Menu cha.
- Page Registry hoặc nhóm không có route.
- Đường dẫn nội bộ `/admin/...`.
- Icon.
- Permission.
- Thứ tự.
- Mô tả.
- Hiển thị trong Sidebar.
- Trạng thái bật.

Mục hệ thống được bảo vệ. Mục có menu con không được xóa trước khi di chuyển/xóa các menu con.

### 6.30 Trang hệ thống

- **Không có quyền:** title “Không có quyền truy cập”, giải thích tài khoản thiếu quyền, CTA về trang chính.
- **Không tìm thấy:** route không tồn tại hoặc chưa được cấp, CTA về trang chính.
- **Không tải được điều hướng:** mô tả ngắn và nút “Thử lại”.
- **Route đang tải:** vùng status “Đang tải màn hình…”.

## 7. Từ vựng trạng thái và dữ liệu

### 7.1 Trạng thái đơn hàng

| Giá trị hiển thị | Ý nghĩa | Bước tiếp theo thường gặp |
|---|---|---|
| Chờ xác nhận | Đơn mới được tạo | Đang chuẩn bị hoặc Hủy |
| Đang chuẩn bị | Đang hoàn thiện sản phẩm | Đang giao hoặc Hủy |
| Đang giao | Đang giao/đã bàn giao vận chuyển | Hoàn tất hoặc Hủy |
| Hoàn tất | Khách đã nhận, đủ điều kiện ghi nhận doanh thu | Không có bước tiếp |
| Đã hủy | Đơn ngừng xử lý | Không có bước tiếp |

### 7.2 Trạng thái thanh toán

- Chưa cọc.
- Đã cọc.
- Đã thanh toán.

UI báo cáo tương lai có thể cần nhiều trạng thái tài chính hơn, nhưng các màn hình đơn hiện dùng ba trạng thái trên. Không tự thêm refund/overpaid vào màn hình xử lý đơn nếu API chưa hỗ trợ.

### 7.3 Trạng thái tồn kho

- Bình thường.
- Tồn thấp.
- Hết hàng.
- Làm theo đơn đối với sản phẩm không quản lý tồn.

### 7.4 Content platform

- Facebook.
- Instagram.
- TikTok.

### 7.5 Quy ước hiển thị

- Số tiền luôn có đơn vị rõ, ưu tiên `đ` hoặc `VND` nhất quán.
- Ngày/giờ dùng định dạng quen thuộc Việt Nam.
- SKU/mã kỹ thuật có thể dùng monospace.
- Không viết tắt khó hiểu nếu không có tooltip hoặc label đầy đủ.

## 8. Các luồng cốt lõi cần thể hiện trong prototype

### 8.1 Luồng xử lý đơn

`Danh sách đơn → Tạo/Sửa đơn → Chi tiết đơn → Chờ xác nhận → Đang chuẩn bị → Đang giao → Hoàn tất`

Nhánh phụ:

- Hủy đơn ở các bước cho phép.
- Trả về bước trước nếu có quyền.
- Cập nhật thanh toán độc lập với trạng thái xử lý.
- Điều chỉnh phí giao thực tế trước khi hoàn tất.
- Từ chi tiết khách hàng hoặc lịch giao có thể mở lại chi tiết đơn.

### 8.2 Luồng chuẩn bị và kho

`Định mức sản phẩm → Tạo đơn → Nhu cầu nguyên liệu theo ngày giao`

Song song:

`Danh mục hàng tồn → Nhập kho → Gắn vật tư vào sản phẩm/đơn → Trừ tồn → Lịch sử giao dịch`

Phải phân biệt rõ:

- Nguyên liệu chuẩn bị: phục vụ kế hoạch, không trực tiếp giảm stock.
- Vật tư kho: có stock thực và giảm khi dùng cho đơn.

### 8.3 Luồng tài chính

`Tạo/cập nhật đơn + thanh toán → Đơn hoàn tất → Ghi nhận doanh thu`

`Khoản chi/phiếu nhập → Danh mục chi phí → Báo cáo chi phí và lợi nhuận`

### 8.4 Luồng content

`Chọn nguồn → Viết brief → Tạo 3 bản nền tảng → Chỉnh body → Lưu lịch sử → Xem/tạo phiên bản mới`

### 8.5 Luồng phân quyền

`Permission → Role → User → API lọc route/menu/action`

Menu & điều hướng là lớp cấu hình riêng, không thay thế permission.

## 9. Yêu cầu responsive và accessibility cho thiết kế mới

### 9.1 Breakpoint mục tiêu

- Mobile: từ `360px`.
- Tablet: từ `768px`.
- Laptop: từ `1024px`.
- Desktop: từ `1280px`.
- Wide desktop: từ `1440px`.

### 9.2 Accessibility

- Điều hướng và form dùng được hoàn toàn bằng bàn phím.
- Focus visible rõ; không bỏ focus ring.
- Vùng bấm chính khoảng 44px.
- Modal/drawer có focus trap và đóng bằng Escape.
- Badge có chữ, không chỉ có màu.
- Biểu đồ phải có legend, tooltip và bảng/tóm tắt dữ liệu thay thế.
- Zoom 200% không làm mất action hoặc nội dung thiết yếu.
- Text tiếng Việt dài không bị cắt vô nghĩa; tooltip không được là cách duy nhất để đọc thông tin.
- Tôn trọng `prefers-reduced-motion`.

## 10. Bộ mockup khuyến nghị

Nếu không vẽ tất cả màn hình, nên ưu tiên một bộ đủ đại diện cho toàn hệ thống:

1. Login desktop và mobile.
2. Dashboard desktop và mobile.
3. Danh sách đơn desktop và mobile.
4. Tạo đơn desktop, gồm trạng thái mở editor của một sản phẩm.
5. Nhập nhanh nhiều đơn trong modal.
6. Chi tiết đơn.
7. Lịch giao với bản đồ.
8. Danh sách sản phẩm.
9. Tạo/chỉnh sửa sản phẩm.
10. Kho hàng và dialog nhập kho.
11. Báo cáo tài chính.
12. Chi phí và dialog thêm khoản chi.
13. Tạo content và trạng thái đã có kết quả ba nền tảng.
14. Cấu hình cửa hàng desktop và mobile.
15. Vai trò & quyền hạn.
16. Menu & điều hướng.
17. Bộ trạng thái chung: loading, empty, error, read-only, confirm delete.

Mỗi mockup nên ghi rõ viewport, route, loại tài khoản/quyền, trạng thái dữ liệu và action đang được nhấn.

## 11. Tiêu chí nghiệm thu mockup

- Có thể nhận ra ngay đây là công cụ vận hành cửa hàng, không phải trang marketing.
- Sidebar và nhóm menu phản ánh đúng cấu trúc thông tin.
- CTA quan trọng nhất của từng trang nổi bật nhưng không lấn át dữ liệu.
- Các bảng lớn vẫn đọc và thao tác được trên laptop 1024px.
- Mobile không chỉ là desktop co nhỏ; table đã đổi sang card/list phù hợp.
- Form đơn và form sản phẩm có phân cấp rõ, không tạo cảm giác một danh sách field vô tận.
- Trạng thái đơn, thanh toán, tồn kho và permission dễ phân biệt bằng cả chữ và hình.
- Số tiền, ngày giao và cảnh báo vận hành được ưu tiên thị giác đúng mức.
- Mọi hành động phá hủy có confirm và mô tả hậu quả.
- Loading, empty, error và read-only được thiết kế như trạng thái sản phẩm thật.
- Không làm mất các đường truy ngược từ báo cáo/khách hàng/kho về đơn hoặc giao dịch nguồn.

## 12. Ranh giới và lưu ý kỹ thuật

- Không đổi route, permission check hay API contract chỉ để phù hợp mockup.
- Không có module khuyến mãi trong frontend hiện tại dù tài liệu định hướng cũ từng nhắc tới.
- Các file cũ trong `features/masterdata/pages` không phải màn hình route hiện hành; dữ liệu master hiện đi qua `settings/attributes`.
- `/admin/products/catalog-settings` chỉ là route chuyển tiếp, không phải một màn hình riêng cần mockup.
- Một số component báo cáo thử nghiệm tồn tại trong source nhưng trang route hiện hành là `FinancialReportPage`; không trộn các UI chưa được nối route vào thiết kế như thể đã hoạt động.
- Trạng thái kinh doanh trong form sản phẩm hiện chỉ đọc do API chưa nhận cập nhật trường đó.
- Route Nhập kho và Lịch sử giao dịch hiện tái sử dụng cùng danh sách tồn kho, rồi mở dialog theo mặt hàng.
- Khách hàng là dữ liệu tổng hợp từ đơn cùng số điện thoại người đặt.
- AI content chạy phía server; không tạo UI nhập API key ở Admin.
- FE storefront (`FE_Lamie`) nằm ngoài phạm vi tài liệu này.

## 13. Tóm tắt định hướng cho AI vẽ lại

Hãy thiết kế Lamie Admin như một **bàn điều phối cửa hàng hoa**: đáng tin như công cụ tài chính, nhanh như phần mềm vận hành và đủ ấm để phù hợp thương hiệu Lamie. Ưu tiên sự rõ ràng của đơn hàng, thời gian giao, tiền, tồn kho và việc cần làm. Giữ một hệ thống bề mặt gọn, màu neutral ấm, primary có thể thay đổi, typography tiếng Việt dễ đọc, action nhất quán và responsive thật sự. Không trang trí hoa quá mức; chất thương hiệu nên đến từ nhịp điệu, màu sắc và chi tiết tinh tế.
