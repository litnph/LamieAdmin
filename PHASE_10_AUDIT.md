# Phase 10 - Responsive và Accessibility Regression Audit

Ngày audit: 2026-07-27  
Phạm vi: admin shell, dashboard, sản phẩm, đơn hàng, khách hàng, cài đặt và các shared component đang được router sử dụng.

## Tổng quan trước khi sửa

| Mức độ | Số lượng |
| --- | ---: |
| Critical | 1 |
| High | 7 |
| Medium | 7 |
| Low | 3 |
| Tổng | 18 |

Các viewport đã render bằng Chrome DevTools device metrics: 360x800, 390x844, 430x932, 768x1024, 1024x768, 1280x800, 1440x900 và 1920x1080. Ở các route đã kiểm tra, `documentElement.scrollWidth`, `body.scrollWidth` và vùng `main` đều không lớn hơn viewport. Ảnh chụp bằng `--window-size` dưới 500px ban đầu cho kết quả cắt sai do giới hạn cửa sổ tối thiểu của Chrome; kết quả cuối dùng `Emulation.setDeviceMetricsOverride` chính xác.

Baseline trước khi sửa:

- Production build: pass, có cảnh báo chunk JavaScript 838.97 kB.
- Type-check `npx tsc --noEmit`: fail với 10 lỗi.
- Lint: không có script hoặc dependency lint.
- Test: không có script, test runner hoặc test suite.
- API môi trường audit không phản hồi, vì vậy đã kiểm tra được loading/error/empty shell; success state được audit tĩnh từ source.

## Critical

### C-01 - Production UI phụ thuộc Tailwind CDN ở runtime

- Màn hình: Toàn bộ admin frontend.
- Component: Design system và utility CSS toàn cục.
- File: `index.html`, `package.json`, chưa có Tailwind/PostCSS config và stylesheet entry cục bộ.
- Mô tả vấn đề: Production build vẫn nạp `https://cdn.tailwindcss.com`; hầu hết utility class chỉ được tạo trên trình duyệt sau khi tải CDN. `unpkg.com/lucide` cũng được nạp dù icon đã bundle qua `lucide-react`.
- Cách tái hiện: Chạy `npm run build`, mở `dist/index.html` khi chặn `cdn.tailwindcss.com`; giao diện mất utility styles. Bundle CSS hiện chủ yếu chứa Leaflet, không chứa đầy đủ utility của admin.
- Tác động: Toàn bộ layout, responsive, focus style và visual state có thể hỏng trên mạng chậm, CSP nghiêm ngặt hoặc CDN lỗi. Đây là regression toàn hệ thống.
- Cách sửa: Cài Tailwind cục bộ theo version tương thích với config hiện tại, tạo Tailwind/PostCSS config, chuyển global CSS vào stylesheet được Vite bundle, bỏ CDN/import map/Lucide runtime thừa.
- Rủi ro khi sửa: Trung bình. Có thể phát sinh khác biệt nhỏ do content scanning hoặc thứ tự CSS; phải render lại đủ breakpoint và build production.

## High

### H-01 - Type-check fail

- Màn hình: Toàn bộ codebase.
- Component: TypeScript build contract.
- File: `src/app/App.tsx`, `tsconfig.json`, `src/shared/components/AttributeMultiSelect.tsx`, `src/shared/config/authConfig.ts`, Leaflet asset imports.
- Mô tả vấn đề: Có import tới module đã xóa trong `App.tsx`, thiếu type `vite/client`, và ép kiểu event không an toàn trong multi-select.
- Cách tái hiện: Chạy `npx tsc --noEmit`.
- Tác động: Không thể xác nhận an toàn kiểu dữ liệu; CI type-check sẽ fail và lỗi UI có thể bị che.
- Cách sửa: Biến `App.tsx` thành wrapper của router hiện hành, thêm Vite client types, loại bỏ event cast sai và các `any` dùng để né type.
- Rủi ro khi sửa: Thấp đến trung bình; custom `react-select` cần kiểm tra lại bàn phím và remove action.

### H-02 - Form tạo/sửa đơn chưa đạt accessibility và state consistency

- Màn hình: Tạo đơn, sửa đơn.
- Component: `OrderEditor`.
- File: `src/features/orders/pages/OrderEditorPage.tsx`.
- Mô tả vấn đề: Phần lớn label không liên kết bằng `htmlFor`/`id`; file input không có accessible label; loading/error không có live role; lỗi tải kênh và lỗi geocoding chưa được quản lý nhất quán; nhiều control thấp hơn touch target; styling còn thuộc hệ cũ.
- Cách tái hiện: Mở `/admin/orders/new`, dùng screen reader hoặc click trực tiếp vào label; tắt API kênh hoặc geocoding; tab qua form trên mobile.
- Tác động: Người dùng bàn phím/screen reader khó xác định field và trạng thái; lỗi mạng có thể không được thông báo; interaction khác biệt rõ với các form đã refactor.
- Cách sửa: Gắn id/label/description/error, bổ sung loading/error/status, chuẩn hóa token và touch target, giữ nguyên payload/API/business logic.
- Rủi ro khi sửa: Trung bình do form dài và có create/edit, upload, map, line item.

### H-03 - Deep link, refresh và browser back không bảo toàn bộ lọc danh sách

- Màn hình: Danh sách sản phẩm, đơn hàng, khách hàng.
- Component: Search, filter, pagination.
- File: `ProductListPage.tsx`, `OrderListPage.tsx`, `CustomerListPage.tsx`.
- Mô tả vấn đề: Product chỉ lưu `sessionStorage`; order/customer chỉ lưu local React state. URL không phản ánh search/filter/page.
- Cách tái hiện: Lọc danh sách, copy URL sang tab khác hoặc refresh/back/forward.
- Tác động: Deep link và query parameter regression; người dùng mất ngữ cảnh vận hành.
- Cách sửa: Đồng bộ state hợp lệ với `useSearchParams`, giữ fallback session hiện tại cho product và không thay đổi API query contract.
- Rủi ro khi sửa: Trung bình; cần tránh history spam và vòng lặp effect.

### H-04 - Error state và empty state cài đặt xuất hiện đồng thời

- Màn hình: Kênh bán, thuộc tính.
- Component: Settings table/mobile list.
- File: `ChannelsPage.tsx`, `AttributesPage.tsx`.
- Mô tả vấn đề: Khi API lỗi, trang vừa hiển thị banner “Không thể tải” vừa hiển thị “Chưa có dữ liệu”.
- Cách tái hiện: Mở route cài đặt khi API không phản hồi.
- Tác động: Tín hiệu trạng thái mâu thuẫn, có thể khiến người dùng nghĩ dữ liệu thật sự rỗng.
- Cách sửa: Error state loại trừ empty state và giữ nút tải lại rõ ràng.
- Rủi ro khi sửa: Thấp.

### H-05 - Màn hình khuyến mãi không tồn tại trong phạm vi source hiện tại

- Màn hình: Khuyến mãi.
- Component: Route, navigation, page và API.
- File: `src/app/router/AppRouter.tsx`, `src/shared/components/Sidebar.tsx`; không có feature promotion.
- Mô tả vấn đề: Không có route, page, component hoặc API khuyến mãi để audit regression.
- Cách tái hiện: Tìm `promotion`/`khuyến mãi` trong source hoặc mở route dự kiến; wildcard chuyển về `/admin`.
- Tác động: Không thể hoàn thành kiểm tra màn hình được nêu trong phase.
- Cách sửa: Cần phase/đặc tả riêng về route, permission và API contract; không tự tạo trong Phase 10 vì sẽ mở rộng business scope.
- Rủi ro khi sửa: Cao nếu tự suy đoán nghiệp vụ. Để lại chưa sửa có chủ đích.

### H-06 - Global search ở header là control không có hành vi

- Màn hình: Admin shell/header.
- Component: `admin-global-search`.
- File: `src/layouts/AdminLayout.tsx`.
- Mô tả vấn đề: Input tìm kiếm không có state, submit hoặc navigation; người dùng có thể nhập nhưng không có kết quả.
- Cách tái hiện: Nhập từ khóa và nhấn Enter ở header desktop.
- Tác động: Dead interaction, làm giảm độ tin cậy và gây nhầm với search danh sách.
- Cách sửa: Loại control chưa có contract khỏi header trong Phase 10; search nghiệp vụ tiếp tục ở từng màn hình.
- Rủi ro khi sửa: Thấp; thay đổi khoảng trống header nhưng không ảnh hưởng workflow đang hoạt động.

### H-07 - Lịch giao còn state và visual pattern cũ

- Màn hình: Lịch giao.
- Component: Date filter, map toggle, loading/error/empty list.
- File: `OrdersCalendarPage.tsx`, `OrdersDeliveryMap.tsx`.
- Mô tả vấn đề: Error không có alert/live role hoặc retry, loading chỉ là text, touch target và token không nhất quán; empty map và empty list có thể cùng tạo tín hiệu dư thừa.
- Cách tái hiện: Mở `/admin/orders/calendar` ở mobile, bàn phím và khi API lỗi/chậm/rỗng.
- Tác động: Regression interaction/a11y so với order list và dashboard đã refactor.
- Cách sửa: Chuẩn hóa state, landmark, control size và token; giữ nguyên API/date behavior.
- Rủi ro khi sửa: Trung bình do Leaflet và hai nguồn dữ liệu được tải đồng thời.

## Medium

### M-01 - Multi-select còn hard-coded style, English accessible text và target nhỏ

- Màn hình: Form sản phẩm và các form dùng chọn thuộc tính.
- Component: `AdminSelect`, `AttributeMultiSelect`.
- File: `src/shared/components/AdminSelect.tsx`, `src/shared/components/AttributeMultiSelect.tsx`.
- Mô tả vấn đề: Radius/shadow/backdrop/z-index không theo token; remove action 20-28px và ẩn theo hover; accessible name/placeholder còn tiếng Anh; có nhiều `any`.
- Cách tái hiện: Chọn nhiều thuộc tính, dùng touch/keyboard để xóa chip; kiểm tra source/type-check.
- Tác động: Mobile phụ thuộc hover một phần, visual khác form còn lại, typing khó bảo trì.
- Cách sửa: Dùng token, tăng target hiển thị, Việt hóa text và dùng typed remove action.
- Rủi ro khi sửa: Trung bình vì `react-select` có keyboard behavior riêng.

### M-02 - Heading sidebar đứng trước H1 trang

- Màn hình: Tất cả trang admin.
- Component: Navigation section labels.
- File: `src/shared/components/Sidebar.tsx`.
- Mô tả vấn đề: Nhãn nhóm sidebar dùng `h2`; accessibility tree đọc H2 “Quản lý/Hệ thống” trước H1 của nội dung.
- Cách tái hiện: Lấy heading list bằng accessibility tree trên bất kỳ route admin.
- Tác động: Heading hierarchy không phản ánh tài liệu chính.
- Cách sửa: Dùng text label trong nav group thay vì heading semantic; `section` đã có accessible label.
- Rủi ro khi sửa: Thấp.

### M-03 - Helper của bản đồ chọn vị trí bị cắt và vùng bản đồ thiếu tên

- Màn hình: Tạo/sửa đơn.
- Component: `DeliveryLocationPicker`.
- File: `src/features/orders/components/DeliveryLocationPicker.tsx`.
- Mô tả vấn đề: Map dùng `h-full` bên trong parent height cố định rồi thêm helper text phía dưới, nhưng parent `overflow-hidden`; helper có thể bị cắt. Vùng tương tác không có accessible region name.
- Cách tái hiện: Cuộn tới bản đồ trong form và kiểm tra box geometry/accessibility tree.
- Tác động: Hướng dẫn chọn tọa độ có thể không thấy; screen reader thiếu ngữ cảnh.
- Cách sửa: Dùng flex column, dành chiều cao cho caption và thêm region/caption association.
- Rủi ro khi sửa: Thấp.

### M-04 - Một số action phụ chưa đạt touch target

- Màn hình: Danh sách đơn và các table/settings card.
- Component: Retry tải kênh, row edit, compact chip actions.
- File: `OrderListPage.tsx`, settings pages và shared multi-select.
- Mô tả vấn đề: Ví dụ nút “Không tải được kênh. Thử lại” chỉ cao 16px; một số icon action 40px.
- Cách tái hiện: Audit geometry ở viewport 390px.
- Tác động: Khó thao tác bằng ngón tay, đặc biệt trong vận hành nhanh.
- Cách sửa: Tăng vùng bấm tối thiểu lên 44px hoặc dùng padding/negative visual inset phù hợp.
- Rủi ro khi sửa: Thấp.

### M-05 - Initial JavaScript bundle quá lớn

- Màn hình: Lần tải đầu toàn admin.
- Component: Router và Leaflet-heavy routes.
- File: `AppRouter.tsx`.
- Mô tả vấn đề: Tất cả page được import eager; build cảnh báo chunk 838.97 kB.
- Cách tái hiện: `npm run build`.
- Tác động: Loading chậm hơn trên mạng yếu; tăng thời gian trước khi UI tương tác.
- Cách sửa: Route-level `React.lazy`/`Suspense` với loading state accessible; không đổi route.
- Rủi ro khi sửa: Trung bình; phải kiểm tra deep link và fallback chunk error.

### M-06 - Không có hạ tầng lint/test tự động

- Màn hình: Verification toàn phase.
- Component: Tooling.
- File: `package.json`.
- Mô tả vấn đề: Chỉ có `dev`, `build`, `preview`; không có lint/test.
- Cách tái hiện: Kiểm tra `npm run`.
- Tác động: Không thể tuyên bố lint/test pass; regression interaction chỉ có thể kiểm tra bằng type/build/manual/CDP.
- Cách sửa: Không cài thêm framework trong regression phase nếu chưa có chuẩn dự án; báo cáo rõ “không khả dụng”. Có thể thêm script `typecheck` vì TypeScript đã tồn tại.
- Rủi ro khi sửa: Thấp nếu chỉ thêm typecheck; cao hơn nếu tự chọn lint/test stack.

### M-07 - Nút thông báo ở header là interaction không có hành vi

- Màn hình: Admin shell/header.
- Component: Nút chuông thông báo.
- File: `src/layouts/AdminLayout.tsx`.
- Mô tả vấn đề: Header hiển thị một nút icon-only có accessible name “Thông báo, có thông báo chưa đọc” và chấm trạng thái, nhưng không có handler, state, route hay feature thông báo tương ứng.
- Cách tái hiện: Tab đến nút chuông hoặc nhấn nút trên bất kỳ route admin nào; giao diện không phản hồi và không mở nội dung.
- Tác động: Tạo affordance giả, gây nhầm lẫn cho mọi người dùng và đặc biệt không nhất quán với thông tin được screen reader công bố.
- Cách sửa: Loại bỏ control chưa có contract; chỉ đưa trở lại khi có workflow, trạng thái đọc/chưa đọc và accessible notification surface hoàn chỉnh.
- Rủi ro khi sửa: Thấp; không xóa workflow đang hoạt động vì source không có implementation thông báo.

## Low

### L-01 - Skip link cao 36px và một số icon desktop cao 40px

- Màn hình: Admin shell và table desktop.
- Component: Skip link, compact row actions.
- File: `AdminLayout.tsx`, product/order/settings table components.
- Mô tả vấn đề: Dưới target 44px, dù skip link chủ yếu dùng bàn phím và icon table chủ yếu desktop.
- Cách tái hiện: Đo bounding box.
- Tác động: Nhỏ nhưng không đồng nhất với chuẩn control 44px của hệ thống.
- Cách sửa: Dùng `min-h-11`/`h-11` khi không làm giảm mật độ table quá mức.
- Rủi ro khi sửa: Thấp; có thể tăng chiều cao row.

### L-02 - External font và inline animation delay còn trong login

- Màn hình: Đăng nhập khi auth bypass tắt.
- Component: Login visual shell.
- File: `index.html`, `LoginPage.tsx`.
- Mô tả vấn đề: Google Font là dependency mạng ngoài; một số animation delay dùng inline style và màn login còn gradient/pattern khác admin.
- Cách tái hiện: Chặn fonts.googleapis.com hoặc bật reduced motion.
- Tác động: Fallback font/FOIT nhẹ; visual consistency thấp hơn nhưng reduced-motion global đã chặn animation.
- Cách sửa: Ưu tiên system font hoặc self-host trong phase riêng; bỏ delay inline nếu chạm file.
- Rủi ro khi sửa: Thấp đến trung bình vì ảnh hưởng nhận diện login.

### L-03 - Toast/tooltip độc lập không tồn tại để audit

- Màn hình: Toàn admin.
- Component: Toast, tooltip.
- File: Không có component tương ứng; success/error hiện dùng inline status/dialog/native title.
- Mô tả vấn đề: Checklist phase nêu toast/tooltip nhưng source không có implementation độc lập.
- Cách tái hiện: Tìm component hoặc dependency toast/tooltip.
- Tác động: Không có regression hiện hữu để sửa, nhưng coverage checklist bị giới hạn.
- Cách sửa: Không tự thêm khi không có workflow yêu cầu; giữ inline status accessible. Nếu sản phẩm cần toast/tooltip, cần acceptance criteria riêng.
- Rủi ro khi sửa: Cao nếu thêm một notification system mới ngoài scope.

## Thứ tự xử lý

1. C-01.
2. H-01, H-02, H-03, H-04, H-06, H-07. H-05 được giữ ở trạng thái chưa sửa vì thiếu route/API/permission contract.
3. M-01 đến M-05 và M-07. M-06 chỉ bổ sung typecheck script, không tự cài lint/test stack.
4. Low chỉ sửa khi không tăng rủi ro hoặc khi cùng chạm file.
