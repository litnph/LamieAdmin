# Phase 10 - Báo cáo responsive và accessibility regression

Ngày hoàn tất: 2026-07-27  
Audit gốc: `PHASE_10_AUDIT.md`

## Kết quả theo mức độ

| Mức độ | Tổng | Đã sửa | Một phần | Chưa sửa |
| --- | ---: | ---: | ---: | ---: |
| Critical | 1 | 1 | 0 | 0 |
| High | 7 | 6 | 0 | 1 |
| Medium | 7 | 6 | 1 | 0 |
| Low | 3 | 2 | 0 | 1 |
| Tổng | 18 | 15 | 1 | 2 |

## Những vấn đề đã sửa

- Bỏ Tailwind CDN, Google Fonts và Lucide runtime; toàn bộ utility/global CSS được build cục bộ qua Tailwind/PostCSS.
- Sửa toàn bộ lỗi TypeScript baseline, thêm script `typecheck`, loại bỏ các `any`/event cast không an toàn trong phạm vi đã audit.
- Chuẩn hóa `AdminSelect` và `AttributeMultiSelect`: typed API, token, tiếng Việt, menu portal, remove action không phụ thuộc hover và target 44 px.
- Sửa form đơn: label/input association, accessible upload, heading/section hierarchy, loading/error/live status, retry không làm mất form, geocoding states, line-item fieldset, touch target và form actions responsive.
- Đồng bộ search/filter/page của sản phẩm, đơn hàng và khách hàng với query string; deep link, refresh và Browser Back khôi phục đúng state.
- Sửa error/empty state mâu thuẫn ở Kênh bán và Thuộc tính; bổ sung caption/scope cho table.
- Sửa admin shell: bỏ global search không hoạt động, skip link 44 px, heading sidebar, drawer khóa nền bằng `inert`, khóa scroll và restore focus.
- Loại bỏ nút thông báo không có hành vi nhưng công bố trạng thái chưa đọc, tránh interaction giả trong header.
- Chuẩn hóa Lịch giao, map/delivery picker, retry/error/loading/empty states và giới hạn chiều cao theo viewport.
- Route-level code splitting có accessible loading fallback; initial JS giảm từ 838.97 kB xuống 304.67 kB, không còn cảnh báo chunk >500 kB.
- Sửa các touch target còn lại ở Dashboard và Cài đặt; màu text muted tăng từ contrast 4.07:1 lên khoảng 4.96:1 trên nền trắng.
- Tôn trọng `prefers-reduced-motion`; production check trả animation/transition duration 0.01 ms khi bật Reduce motion.

## Chưa sửa hoặc chỉ sửa một phần

- **H-05 - Khuyến mãi:** chưa có route, page, API hoặc permission contract trong source. Không tự tạo feature nghiệp vụ trong phase regression.
- **M-06 - Lint/test:** đã thêm và chạy type-check, nhưng dự án không có ESLint script/dependency, test runner hay test suite. Không tự chọn một stack mới trong phase này.
- **L-03 - Toast/tooltip:** không có component/workflow toast hoặc tooltip độc lập để audit. Các thông báo hiện hữu tiếp tục dùng inline `status`/`alert`, dialog và native title.

## File thay đổi bởi Phase 10

- Build/config: `index.html`, `package.json`, `package-lock.json`, `postcss.config.cjs`, `tailwind.config.cjs`, `tsconfig.json`, `src/index.css`, `src/main.tsx`.
- App/routing/type contract: `src/app/App.tsx`, `src/app/router/AppRouter.tsx`, `src/services/apiClient.ts`, `src/features/masterdata/api/masterdataApi.ts`, `src/features/product/api/uploadApi.ts`.
- Shell/shared UI: `src/layouts/AdminLayout.tsx`, `src/shared/components/Sidebar.tsx`, `src/shared/components/AdminSelect.tsx`, `src/shared/components/AttributeMultiSelect.tsx`.
- Dashboard/list: `src/features/dashboard/components/DashboardTimeFilter.tsx`, `src/features/dashboard/components/RevenueChart.tsx`, `src/features/product/pages/ProductListPage.tsx`, `src/features/customers/pages/CustomerListPage.tsx`, `src/features/users/pages/UsersListPage.tsx`.
- Orders: `src/features/orders/pages/OrderEditorPage.tsx`, `src/features/orders/pages/OrderListPage.tsx`, `src/features/orders/pages/OrdersCalendarPage.tsx`, `src/features/orders/components/DeliveryLocationPicker.tsx`, `src/features/orders/components/OrdersDeliveryMap.tsx`.
- Settings: `src/features/settings/channels/pages/ChannelsPage.tsx`, `src/features/settings/attributes/pages/AttributesPage.tsx`.
- Báo cáo: `PHASE_10_AUDIT.md`, `PHASE_10_REPORT.md`.

Worktree đã có nhiều thay đổi và file untracked từ các phase trước khi Phase 10 bắt đầu; các thay đổi đó được giữ nguyên, không reset hoặc ghi đè ngoài phạm vi trên.

## Breakpoint và responsive

Đã render bằng Chrome DevTools Protocol với device metrics chính xác:

- 360 x 800
- 390 x 844
- 430 x 932
- 768 x 1024
- 1024 x 768
- 1280 x 800
- 1440 x 900
- 1920 x 1080

Ma trận cuối gồm Dashboard ở đủ 8 kích thước và các route sản phẩm, form sản phẩm, đơn hàng, form/chi tiết đơn, lịch giao, khách hàng, chi tiết khách hàng, kênh bán và thuộc tính. Kết quả: không có document scroll ngang, không có control đang hiển thị thiếu accessible name, không có active touch target dưới 44 px và không có stylesheet ngoài origin. Table/map overflow có chủ đích được giữ trong container.

## Accessibility đã kiểm tra

- `lang=vi`, main/header/nav landmarks, một H1 cho state ổn định và H1 vẫn tồn tại trong loading dài của form đơn.
- Label/input association, accessible name, icon-only label, table caption/header scope và live `status`/`alert`.
- Keyboard navigation, tab order, focus-visible CSS, drawer background `inert`, Escape/focus restore.
- Dialog `role=dialog`, `aria-modal`, autofocus, focus trap qua 10 lần Tab, Escape và restore focus về trigger.
- Touch target 44 px, text contrast chính, reduced motion và trạng thái không chỉ truyền đạt bằng màu.
- Modal mobile nằm trong 844 px viewport và phần nội dung dài cuộn bên trong.

## Functional regression đã kiểm tra

- Search/apply filter của sản phẩm, đơn hàng và khách hàng cập nhật query URL; Browser Back khôi phục cả URL và input state.
- Deep link/query, refresh-like direct navigation, route navigation, sidebar open/close, dialog open/close, retry/error controls và responsive pagination shell.
- Loading chậm và API error được chạy thực tế với API không phản hồi; error state của detail/form có H1, alert và retry, không gây overflow.
- Permission visibility được review tĩnh; runtime dùng auth bypass với tài khoản Dev Admin.

Không thể chạy end-to-end success path cho Create, Update, Delete, Upload, status transition, sort/pagination với dữ liệu thật, hàng trăm dòng, một dòng, ảnh thiếu và số tiền cực lớn vì API `https://localhost:7064` không hoạt động trong môi trường audit. Các nhánh này được review tĩnh nhưng vẫn là rủi ro kiểm thử còn lại.

## Kết quả lệnh cuối

- Type-check: **PASS** - `npm run typecheck`.
- Production build: **PASS** - `npm run build`, 1,948 modules, initial JS 304.67 kB (gzip 99.14 kB).
- Diff whitespace: **PASS** - `git diff --check`.
- Lint: **KHÔNG KHẢ DỤNG** - `npm run lint` báo thiếu script.
- Test: **KHÔNG KHẢ DỤNG** - `npm test` báo thiếu script.
- Dependency audit: **FAIL/RỦI RO CÒN LẠI** - `npm audit --omit=dev` báo 6 vulnerabilities (4 high, 2 moderate) trong Axios/follow-redirects/form-data/React Router/YAML. Không chạy tự động `npm audit fix` vì nâng dependency có thể mở rộng regression scope.

## Rủi ro còn lại

- Chưa có backend để xác nhận success/data-edge/mutation flows end-to-end.
- Chưa có promotion feature, toast/tooltip implementation, lint hay automated test suite.
- Dependency production còn 6 cảnh báo bảo mật từ npm audit; cần một dependency-upgrade phase có regression test riêng.
- CDP/manual coverage xác nhận layout và interaction chính, nhưng không thay thế screen-reader test thực tế trên NVDA/VoiceOver và browser/device vật lý.
