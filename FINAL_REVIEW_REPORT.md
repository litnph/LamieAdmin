# Final review refactor admin frontend

Ngày review: 2026-07-27  
Nhánh: `dev-codex`  
Phạm vi: toàn bộ admin frontend trong `src`, cấu hình build, dependency trực tiếp và các thay đổi chưa commit hiện có.  
Trạng thái báo cáo này: kết quả audit trước remediation. Source code chưa được sửa trong giai đoạn audit.

## Executive summary

Đợt refactor đã tạo ra cải thiện rõ rệt ở admin shell, dashboard, sản phẩm, đơn hàng, khách hàng và cài đặt. Design token đã tập trung hơn, Tailwind được bundle cục bộ, route được code-split, các danh sách chính đã có mobile layout, query string được đồng bộ và phần lớn loading, empty, error state đã được chuẩn hóa.

Baseline kỹ thuật hiện tại tốt hơn đáng kể:

- `npm run typecheck`: pass.
- `npm run build`: pass, 1.948 module, initial JS 304,67 kB, gzip 99,14 kB, không có chunk warning.
- `git diff --check`: pass, chỉ có cảnh báo Git sẽ đổi LF sang CRLF khi chạm lại các file hiện hữu.
- Không còn stylesheet hoặc icon runtime CDN trong production shell.
- Không ghi nhận React warning hoặc console warning khi render route `/admin/users`; lỗi mạng tới backend được hiển thị trên UI.

Tuy nhiên, bản refactor chưa thể coi là production-ready hoàn toàn. Final review xác định 5 nhóm High:

1. Dependency production có 4 package bị `npm audit` đánh dấu High.
2. Màn hình Người dùng còn responsive, accessibility và state regression nghiêm trọng.
3. Màn hình Đăng nhập còn thiếu semantic/accessibility nền tảng và không nhất quán ngôn ngữ.
4. Redirect qua đăng nhập làm mất query string và hash của deep link.
5. Feature Khuyến mãi chưa có route, API và permission contract, nên không thể tự triển khai trong phạm vi review.

Không phát hiện Critical mới. Các High 1-4 có thể sửa có mục tiêu mà không redesign hoặc đổi API contract. High 5 phải giữ mở cho tới khi có đặc tả nghiệp vụ.

## Kết quả theo mức độ

| Mức độ | Số nhóm | Trạng thái trước remediation |
| --- | ---: | --- |
| Critical | 0 | Không phát hiện |
| High | 5 | 4 có thể sửa trong phạm vi, 1 bị chặn bởi thiếu contract |
| Medium | 8 | Báo cáo, không sửa trong final pass này |
| Low | 3 | Báo cáo, không sửa trong final pass này |

## Các phase đã hoàn thành

Repository chỉ có bằng chứng tài liệu đầy đủ cho Phase 10. Không có báo cáo Phase 1-9 hoặc commit message đủ mô tả để xác nhận chính xác trạng thái từng phase trước đó.

### Phase có bằng chứng đầy đủ

- Phase 10 - Responsive và accessibility regression: có `PHASE_10_AUDIT.md` và `PHASE_10_REPORT.md`.
- Phase 10 ghi nhận 18 vấn đề ban đầu: 1 Critical, 7 High, 7 Medium, 3 Low.
- Báo cáo Phase 10 cho biết 15 vấn đề đã sửa hoàn toàn, 1 sửa một phần và 2 chưa sửa.
- Final review đã chạy lại typecheck, build, audit dependency, static review và spot-check Chrome thay vì chỉ dựa vào báo cáo cũ.

### Các nhóm công việc trước Phase 10 có thể xác nhận từ worktree

- Chuẩn hóa admin shell, sidebar, header, drawer mobile và primary color picker.
- Refactor dashboard thành các component dữ liệu và state riêng.
- Refactor danh sách, form tạo/sửa và chi tiết sản phẩm.
- Refactor danh sách, form tạo/sửa, chi tiết và lịch giao của đơn hàng.
- Tạo màn hình khách hàng bằng dữ liệu tổng hợp từ đơn hàng.
- Chuẩn hóa kênh bán, thuộc tính và dialog dùng chung của cài đặt.
- Thêm Tailwind/PostCSS local build, TypeScript typecheck và route-level lazy loading.

Các nhóm trên được xem là phạm vi đã triển khai, không được khẳng định là các phase đánh số cụ thể vì repository không có tài liệu tương ứng.

## Component dùng chung đã được chuẩn hóa

- `AdminLayout`: shell, header, main landmark, skip link, mobile drawer, focus restore và background inert.
- `Sidebar`: navigation group, active route, permission-based item và touch target.
- `PageHeader`: H1 và subtitle thống nhất.
- `AdminSelect`: typed wrapper cho `react-select`, menu portal, state và token chung.
- `AttributeMultiSelect`: typed remove action, chip, accessible label và touch target.
- `SettingsShell`: navigation cài đặt, responsive shell và status component.
- `SettingsDialog`: portal, `role="dialog"`, `aria-modal`, focus trap, Escape, scroll lock và focus restore.
- `OrderListContent`, `OrderPagination`, `OrderStatusBadges`: tách khỏi page đơn hàng.
- `CustomerPagination`, `CustomerStatusBadge`: dùng lại trong list/detail khách hàng.
- Các component dashboard: filter thời gian, KPI, chart, attention orders, delivery risk, low stock và state.

Khoảng trống còn lại:

- Pagination đang có ba implementation gần giống nhau cho product, order và customer.
- Error/status panel vẫn lặp class và cấu trúc ở nhiều feature.
- User management chưa dùng pattern list/form/state đã chuẩn hóa ở phần còn lại.

## Tính nhất quán design system

Điểm đạt:

- Token canvas, surface, border, text, status, radius, shadow và layer được định nghĩa trong `src/index.css` và `tailwind.config.cjs`.
- Các màn hình dashboard, product, order, customer và settings chủ yếu dùng semantic admin token.
- Typography, density và corner system phù hợp hướng admin vận hành, không chuyển thành landing page.
- Dynamic color inline style ở color picker, color swatch và revenue chart là hợp lý vì giá trị đến từ dữ liệu.

Điểm chưa đạt:

- `LoginPage`, `UsersListPage` và `UserEditorPage` còn dùng nhiều `slate-*`, `red-*`, `rounded-xl/2xl/3xl`, `glass-strong`, gradient và shadow hệ cũ.
- Login còn trộn tiếng Anh và tiếng Việt: `Welcome back`, `Sign In`, câu footer tiếng Anh.
- Các page masterdata cũ không còn được route sử dụng nhưng vẫn giữ style cũ và `console.error`.
- `ProductCreatePage.tsx` dài 1.315 dòng, `AttributesPage.tsx` 934 dòng và `OrderDetailPage.tsx` 889 dòng, làm tăng rủi ro lệch pattern khi bảo trì.

## Tính nhất quán giữa các màn hình

- Dashboard, product, order, customer và settings có hierarchy, panel, status và action khá đồng nhất.
- Người dùng là ngoại lệ rõ nhất. Error state vẫn hiển thị cùng table rỗng, không có retry hoặc empty state riêng.
- User editor và login chưa theo field pattern `label -> control -> helper/error` đang dùng ở product/order/settings.
- Màn hình login có visual language khác admin shell, nhưng final pass không được phép redesign ngoài phạm vi.

## Responsive 360px đến 1920px

Evidence sẵn có của Phase 10 bao phủ các viewport 360, 390, 430, 768, 1024, 1280, 1440 và 1920 px cho các route chính.

Final review đã spot-check lại production build ở 360 x 800 và 1920 x 1080:

- Admin shell chuyển đúng sang drawer trigger ở 360 px.
- Route lazy fallback không gây overflow ngang.
- Ở 1920 px, content giữ max-width và sidebar/header ổn định.
- `/admin/users` fail ở 360 px: action tạo user không xuất hiện trong viewport, table desktop bị cắt bởi container `overflow-hidden`, chỉ thấy 4 trên 5 cột và không có mobile card fallback.
- `/admin/users` ở 1920 px hiển thị đúng chiều rộng nhưng error và table trống cùng xuất hiện.

## Cải tiến responsive đã đạt

- Sidebar desktop và mobile drawer tách rõ breakpoint.
- List product, order và customer có layout card mobile và table desktop.
- Filter/action bar wrap hoặc stack trên màn hình hẹp.
- Table và map overflow được giới hạn trong container có chủ đích.
- Dialog settings dùng bottom sheet trên mobile và centered modal trên desktop.
- Order form, order detail, product form và pagination đã có responsive action layout.

## Accessibility

Điểm đạt:

- `lang="vi"`, skip link, main/header/nav landmark và H1 trên phần lớn route.
- Visible focus style toàn cục và reduced-motion override.
- Table chính có caption, header scope và mobile alternative.
- State chính dùng `role="status"` hoặc `role="alert"`.
- Settings dialog có focus trap, Escape, scroll lock và focus restore.
- Drawer mobile quản lý inert, khóa scroll và restore focus.

Điểm chưa đạt mức High:

- `UserEditorPage` có sáu label đứng riêng nhưng không có `htmlFor`/`id`.
- `LoginPage` có hai label đứng riêng nhưng không có `htmlFor`/`id`.
- Login không có H1, error không có live alert và loading text không được công bố nhất quán.
- Icon edit trong user table không có accessible name.
- Reset password dùng placeholder làm label, không có focus management và không công bố lỗi cục bộ.
- User list loading/error/empty không dùng semantic state chuẩn.

Test screen reader thật trên NVDA/VoiceOver và thiết bị vật lý chưa được thực hiện.

## Cải tiến accessibility đã đạt

- Label association và error description ở product/order/settings đã được chuẩn hóa.
- Icon-only control chính có accessible label.
- Touch target mục tiêu 44 px được áp dụng rộng rãi.
- Màu text muted đã tăng contrast so với baseline Phase 10.
- Biểu đồ doanh thu có bảng dữ liệu thay thế cho screen reader.
- Status không chỉ phụ thuộc vào màu.

## Cải tiến UX đã đạt

- Query string bảo toàn filter/page cho product, order và customer khi đang ở trong phiên đăng nhập.
- Loading, empty, error và retry rõ ràng hơn trên các workflow chính.
- Dashboard hỗ trợ partial failure theo từng nguồn dữ liệu.
- Order detail hiển thị state chuyển trạng thái, payment, delivery urgency và history rõ hơn.
- Product form có validation theo field, focus tới field lỗi và upload status.
- Dialog destructive action yêu cầu xác nhận và khóa interaction nền.
- Route lazy loading giảm initial bundle từ 838,97 kB xuống 304,67 kB.

## Business logic regression

Không thấy diff hiện tại thay đổi endpoint hoặc payload chính của order/product/settings. Các thay đổi API trong Phase 10 chủ yếu loại `any`, encode identifier và giữ nguyên shape đã hỗ trợ.

Rủi ro chưa thể đóng:

- Backend `VITE_API_BASE_URL` không phản hồi trong môi trường review. Create, update, delete, upload, status transition và success state dữ liệu thật chưa được chạy end-to-end.
- Customer feature không gọi customer API. Nó tải toàn bộ order, gom nhóm client-side theo số điện thoại và tạo ID hash. Đây là approximation nghiệp vụ, có thể gộp sai khách dùng chung số hoặc tách khách không có số điện thoại.
- `fetchAllOrders` của customer và dashboard tải các page còn lại song song với page size 100. Dữ liệu lớn có thể tạo burst request và chi phí CPU/memory ở client.
- Server vẫn phải thực thi permission. UI guard chỉ giảm khả năng thao tác nhầm, không phải security boundary.

## API contract

Điểm đạt:

- Base URL vẫn lấy từ `VITE_API_BASE_URL` với fallback hiện hữu.
- Order list giữ nguyên tên query và loại giá trị `undefined`/chuỗi rỗng.
- Order create vẫn gửi multipart với các key line item và image cũ.
- Order update/status/payment/delete giữ nguyên method và endpoint.
- Masterdata, attributes và upload chỉ được type-narrow, không đổi route.

Điểm cần theo dõi:

- Success payload của upload chấp nhận string, `{ url }` hoặc `{ imageUrl }`; shape khác trả chuỗi rỗng.
- Masterdata list chấp nhận array, `{ items }` hoặc `{ data }`; cần contract test với backend thật.
- Customer là API facade tổng hợp, không phải contract customer backend.

## Permission checks

- Toàn bộ `/admin` nằm trong `ProtectedRoute`.
- `/admin/users*` nằm trong `AdminOnlyRoute`; sidebar chỉ hiển thị mục Người dùng cho Admin.
- Product edit dùng Manager trở lên, delete dùng Admin.
- Channel save dùng Manager trở lên, delete dùng Admin.
- Final review không thấy permission guard bị xóa khỏi route hiện hữu.
- Auth bypass và tài khoản Dev Admin đã được loại bỏ hoàn toàn trong follow-up ngày 2026-07-28. Mọi môi trường đều dùng login, token refresh và route guard thật.

## Routing và query parameters

Điểm đạt:

- Route cũ được giữ nguyên, thêm customer list/detail.
- Legacy masterdata route redirect sang settings attributes.
- Product, order và customer sync filter/page với URL.
- Route-level lazy loading giữ nguyên path.

High cần sửa:

- `ProtectedRoute` chỉ lưu `location.pathname` vào state `from`. Deep link như `/admin/orders?status=1&page=3#result` bị trả về `/admin/orders` sau login, mất query/hash.

Medium còn lại:

- Wildcard route redirect thẳng về `/admin`, không có 404 hoặc thông báo route không tồn tại.
- Admin-only redirect người không đủ quyền về dashboard nhưng không giải thích lý do.

## Loading, empty và error state

Điểm đạt:

- Các route lazy có accessible loading fallback.
- Dashboard, product, order, customer và settings có state component hoặc nhánh rõ ràng.
- Settings error loại trừ empty state.

Điểm chưa đạt:

- User list hiển thị error banner cùng table rỗng, không có retry và không có empty state.
- User editor loading chỉ là text, load error vẫn để form có thể xuất hiện sau khi load thất bại.
- Login error không có `role="alert"`.

## Form validation

- Product form có validation chi tiết, `aria-invalid`, `aria-describedby` và focus tới lỗi đầu tiên.
- Order form có required field, min/max cho số và state API/geocoding.
- Settings form trim text, validate color/sort order và disable save khi không hợp lệ.
- User create chỉ dựa trên native required/email/minLength; label association và error description còn thiếu.
- Reset password chỉ kiểm tra độ dài bằng early return, không hiển thị lý do khi dưới 8 ký tự.
- Login có native required nhưng chưa trim/normalize; không thay đổi trong audit để bảo toàn auth contract.

## Table behavior

- Product/order/customer table có caption, header scope, pagination và mobile alternative.
- Không có sorting UI tổng quát; thứ tự hiện phụ thuộc API hoặc sort nghiệp vụ cục bộ.
- User table không responsive, không có empty row, retry hoặc mobile card.
- Không có evidence runtime với hàng trăm dòng, một dòng, text dài cực đoan hoặc tiền rất lớn do backend vắng mặt.

## Dialog behavior

- `SettingsDialog` đạt yêu cầu cơ bản: portal, modal semantics, focus trap, Escape, overlay close, scroll lock và restore focus.
- Primary color picker dùng popover có dialog semantics và Escape/focus restore, nhưng không trap focus. Với non-modal popover nhỏ, đây là chấp nhận được.
- Reset password trong user list là inline panel, không phải dialog; thiếu label và focus management.

## Performance

Điểm đạt:

- Route-level code splitting hoạt động.
- Build không còn chunk trên ngưỡng 500 kB.
- Animation chủ yếu nhẹ và reduced-motion được hỗ trợ.

Rủi ro:

- Customer/dashboard fan-out toàn bộ page order ở client.
- ProductCreate, Attributes và OrderDetail là component rất lớn, tăng parse/maintenance cost dù đã lazy-load.
- `react-select` tạo chunk 90,41 kB và Leaflet tạo chunk 159,95 kB, hợp lý theo feature nhưng cần tiếp tục giữ lazy boundary.

## Dependency phát sinh

Dependency mới có chủ đích từ Phase 10:

- `tailwindcss@3.4.17`
- `postcss@8.5.23`
- `autoprefixer@10.5.4`

Các dependency này là dev dependency và cần thiết để bỏ runtime CDN. Không phát hiện library UI mới.

`npm audit --omit=dev` trước remediation:

| Package | Severity | Trực tiếp | Ghi chú |
| --- | --- | --- | --- |
| `axios@1.13.6` | High | Có | Có bản patch mới hơn |
| `form-data@4.0.5` | High | Không | Transitive qua Axios |
| `react-router-dom@7.13.1` | High | Có | Có bản 7.x mới hơn |
| `react-router@7.13.1` | High | Không | Một số advisory liên quan SSR/RSC/Data Router không được app BrowserRouter này dùng, nhưng audit vẫn fail |
| `follow-redirects` | Moderate | Không | Không sửa trong pass chỉ dành cho Critical/High |
| `yaml` | Moderate | Không | Không sửa trong pass chỉ dành cho Critical/High |

## Duplicate code

- `OrderPagination`, `CustomerPagination` và `ProductPagination` lặp tính first/last item, previous/next và page label.
- Error/status banner class lặp ở nhiều page.
- Fetch-all-pages logic lặp giữa dashboard và customer.
- Status badge mapping đã được tách tốt cho order/customer, nhưng product vẫn có mapping riêng hợp lý theo domain.

## Hard-coded styling

- Login và user management còn nhiều hard-coded `slate`, `red`, radius, glass, gradient và shadow.
- Các page masterdata cũ giữ style hệ cũ nhưng không còn route sử dụng.
- Inline `backgroundColor` cho swatch và `height` cho chart là data-driven, không được xem là hard-coded styling sai.
- Primary palette chứa literal hex theo chức năng cấu hình theme, nên hợp lệ.

## Dead code

Các page sau không còn được router import, vì legacy route đã redirect sang settings attributes:

- `src/features/masterdata/pages/LanguagePage.tsx`
- `src/features/masterdata/pages/TagPage.tsx`
- `src/features/masterdata/pages/ColorPage.tsx`
- `src/features/masterdata/pages/CategoryPage.tsx`

`src/app/App.tsx` cũng không được `main.tsx` sử dụng vì `main.tsx` render `AppRouter` trực tiếp. Cần xác nhận không có consumer ngoài repository trước khi xóa.

Không xóa dead code trong final pass vì đây là Medium và yêu cầu chỉ cho phép sửa Critical/High sau báo cáo.

## Console, TypeScript và build warning

- TypeScript warning/error: không có trong `npm run typecheck`.
- Build warning: không có trong `npm run build`.
- Console warning khi spot-check route: không ghi nhận.
- Network Error là runtime state do backend vắng mặt, không phải console warning.
- Bốn page masterdata dead code còn `console.error`; không chạy trong route hiện tại.
- Git phát cảnh báo LF sẽ đổi thành CRLF khi Git chạm file. Đây không phải build warning nhưng cần tránh diff line-ending ngoài ý muốn.
- Lint warning: không thể xác định vì không có ESLint/script.
- Test warning: không thể xác định vì không có test runner/script.

## Danh sách finding chi tiết

### H-01 - Production dependency có advisory High

- File: `package.json`, `package-lock.json`.
- Tác động: CI security gate fail; Axios có advisory tác động request construction và multipart, Router có nhiều advisory framework/data/SSR.
- Xử lý trong phạm vi: nâng Axios và React Router DOM lên patch/minor mới nhất tương thích, chạy lại audit/typecheck/build.
- Giới hạn: không ép React Router major mới nếu cần migration hoặc không có test suite.

### H-02 - User management fail responsive và accessibility

- File: `src/features/users/pages/UsersListPage.tsx`, `src/features/users/pages/UserEditorPage.tsx`.
- Tác động: route Admin-only không dùng được đầy đủ ở 360 px; icon action thiếu tên; state và form không công bố đúng cho assistive technology.
- Xử lý trong phạm vi: thêm mobile card/table breakpoint, loading/empty/error/retry, accessible action, field association, reset-password semantics và token hiện hữu.

### H-03 - Login thiếu semantic và accessibility nền tảng

- File: `src/features/user/pages/LoginPage.tsx`.
- Tác động: màn hình cổng vào thiếu H1, label association và live error; copy trộn ngôn ngữ.
- Xử lý trong phạm vi: sửa semantic, label/id, status, text và mobile viewport unit. Không redesign layout.

### H-04 - Deep link mất query/hash sau login

- File: `src/app/router/ProtectedRoute.tsx`.
- Tác động: filter/page đã được URL hóa nhưng bị mất khi session hết hạn hoặc người dùng mở deep link chưa đăng nhập.
- Xử lý trong phạm vi: lưu pathname + search + hash vào state `from`.

### H-05 - Khuyến mãi chưa có contract

- File liên quan: `src/app/router/AppRouter.tsx`, `src/shared/components/Sidebar.tsx`.
- Tác động: workflow nêu trong brief không tồn tại để review.
- Trạng thái: bị chặn có chủ đích. Cần route, permission matrix, API schema và acceptance criteria từ product/backend.
- Không tự tạo feature trong final review vì sẽ mở rộng nghiệp vụ và vi phạm yêu cầu không redesign ngoài phạm vi.

### Medium không sửa trong final pass

- M-01: Không có lint/test automation.
- M-02: Customer là aggregation client-side, có rủi ro logic và fan-out request.
- M-03: Pagination/error state duplicate.
- M-04: Component quá lớn và mixed legacy style.
- M-05: Wildcard redirect không có 404.
- M-06: Dead masterdata pages và `App.tsx`.
- M-07: Chưa có E2E success-path với backend thật.
- M-08: Một số compact action vẫn dùng chiều cao 40 px trong product image workflow, cần device test lại.

### Low không sửa trong final pass

- L-01: Git line-ending warning LF/CRLF.
- L-02: Login còn decorative motion/style khác shell, chỉ nên xử lý trong phase visual riêng nếu được duyệt.
- L-03: Chưa có toast/tooltip component độc lập để audit.

## Rủi ro còn lại

- Không có backend để xác nhận create/update/delete/upload và dữ liệu edge-case.
- Không có lint, unit test, integration test hoặc E2E test.
- Không có screen-reader và thiết bị vật lý.
- Promotion chưa có contract.
- Customer aggregation có thể khác mô hình customer thực của backend tương lai.
- Router advisory có thể không hết hoàn toàn nếu bản vá yêu cầu major migration.
- Worktree rất lớn, gồm 6.502 dòng thêm và 2.785 dòng xóa trên 36 file tracked cùng nhiều file untracked. Review một PR duy nhất sẽ khó và dễ bỏ sót regression.

## Task nên thực hiện tiếp

1. Cung cấp backend test environment và fixture cho order/product/customer/settings/user.
2. Thêm test contract cho API serializer/payload và state transition.
3. Thiết lập ESLint phù hợp React 19/TypeScript, sau đó thêm CI lint/typecheck/build.
4. Thêm Vitest + Testing Library cho formatter, query sync, permission guard và form validation.
5. Thêm Playwright cho deep link, mobile drawer, list filters, dialog focus và mutation flow.
6. Chốt customer API contract thay cho việc tổng hợp toàn bộ order ở client.
7. Chốt promotion route/API/permission trước khi triển khai.
8. Hợp nhất pagination và status panel sau khi regression test tồn tại.
9. Xóa dead code sau khi xác nhận không có consumer ngoài repository.
10. Chạy NVDA/Chrome, VoiceOver/Safari và ít nhất một thiết bị 360-390 px thật.

## File cần theo dõi kỹ khi review

Ưu tiên cao nhất:

- `src/features/product/pages/ProductCreatePage.tsx`
- `src/features/orders/pages/OrderDetailPage.tsx`
- `src/features/orders/pages/OrderEditorPage.tsx`
- `src/features/orders/pages/OrderListPage.tsx`
- `src/features/settings/attributes/pages/AttributesPage.tsx`
- `src/features/settings/channels/pages/ChannelsPage.tsx`
- `src/features/customers/api/customersApi.ts`
- `src/features/dashboard/api/dashboardApi.ts`
- `src/app/router/AppRouter.tsx`
- `src/features/auth/context/AuthContext.tsx`
- `src/services/axiosInterceptor.ts`
- `src/layouts/AdminLayout.tsx`
- `src/shared/components/SettingsDialog.tsx`
- `src/shared/components/AttributeMultiSelect.tsx`

File thuộc remediation High:

- `package.json`
- `package-lock.json`
- `src/app/router/ProtectedRoute.tsx`
- `src/features/user/pages/LoginPage.tsx`
- `src/features/users/pages/UsersListPage.tsx`
- `src/features/users/pages/UserEditorPage.tsx`

## Đề xuất chia commit hoặc pull request

Không nên đưa toàn bộ worktree vào một commit.

### PR 1 - Build foundation và design token

- Tailwind/PostCSS local build.
- `index.html`, `src/index.css`, Tailwind config, main entry và theme token.
- Kiểm chứng: build không cần CDN, typecheck, screenshot shell.

### PR 2 - Admin shell và shared components

- AdminLayout, Sidebar, PageHeader, select, color picker và shared settings components.
- Kiểm chứng: keyboard drawer/dialog, focus restore, reduced motion.

### PR 3 - Dashboard và customer read models

- Dashboard feature và customer feature.
- Tách rõ trong PR description rằng customer hiện là order-derived read model.
- Kiểm chứng: partial failure, pagination, dữ liệu lớn.

### PR 4 - Product workflows

- Product list/table/create/edit/upload.
- Kiểm chứng: validation, image ordering, permissions, create/update/delete payload.

### PR 5 - Order workflows

- Order list/detail/editor/calendar/map và utility/component tách mới.
- Kiểm chứng: transition matrix, payment, query sync, multipart create và update.

### PR 6 - Settings workflows

- Channels, attributes, SettingsShell và SettingsDialog.
- Kiểm chứng: Admin/Manager/Staff matrix và destructive confirmation.

### PR 7 - Final High remediation

- Security-compatible dependency update.
- Auth deep-link preservation.
- Login và user management accessibility/responsive fixes.
- Không trộn cleanup Medium hoặc redesign vào PR này.

Mỗi PR nên có typecheck, build, diff check, breakpoint screenshot và checklist API/permission riêng. PR có mutation phải chạy với backend test trước khi merge.

## Kết quả remediation High

Remediation được thực hiện sau khi hoàn tất báo cáo audit ban đầu. Không sửa các finding Medium/Low và không thực hiện redesign ngoài phạm vi.

| Finding | Kết quả | Ghi chú |
| --- | --- | --- |
| H-01 Dependency High | Sửa một phần, giảm rủi ro | Axios, form-data và follow-redirects đã lên bản an toàn. Còn một advisory RSC-mode được npm tính cho cả `react-router` và `react-router-dom`. |
| H-02 User management | Đã sửa | Có mobile card/table breakpoint, state loại trừ nhau, retry, empty state, action name, dialog reset password và form association. |
| H-03 Login accessibility | Đã sửa | Có H1, main landmark, label association, alert, busy state, copy tiếng Việt và `min-h-dvh`. |
| H-04 Deep link query/hash | Đã sửa | State `from` lưu pathname + search + hash. |
| H-05 Promotion contract | Chưa sửa có chủ đích | Vẫn bị chặn bởi thiếu route/API/permission contract. |

### Dependency sau remediation

- `axios`: 1.13.6 -> 1.18.1.
- `form-data`: 4.0.5 -> 4.0.6, transitive.
- `follow-redirects`: 1.15.x -> 1.16.0, transitive.
- `react-router-dom`: 7.13.1 -> 7.18.1.
- `vite`: 6.4.1 -> 6.4.3.
- `picomatch`: 4.0.3 -> 4.0.5, transitive.
- `yaml`: 2.8.2 -> 2.9.0, transitive.
- `@babel/core`: 7.29.0 -> 7.29.7, transitive.
- `npm audit --omit=dev`: từ 6 advisory (4 High, 2 Moderate) còn 2 High, cả hai là cách npm biểu diễn cùng chuỗi phụ thuộc cho advisory `GHSA-qwww-vcr4-c8h2` về RSC Mode CSRF.
- `npm audit` trên toàn bộ production + development graph cũng còn đúng 2 High từ cùng advisory React Router; High của Vite/picomatch và các Low/Moderate transitive đã được loại bỏ khi xử lý chuỗi dependency High.

Ứng dụng hiện dùng declarative `BrowserRouter`, không dùng React Server Components, Framework Mode action endpoint hoặc server request handler của React Router. Vì vậy advisory còn lại không có đường thực thi trong bundle SPA hiện tại. Bản vá upstream yêu cầu React Router 8.3.0, React/ReactDOM ít nhất 19.2.7 và Node ít nhất 22.22.0; môi trường review đang là Node 22.21.1. Không chạy `npm audit fix --force` vì đây là major migration và dự án chưa có automated test.

### Responsive và accessibility sau remediation

Chrome DevTools Protocol với device metrics 360 x 800 xác nhận:

- `/admin/users`: `document`, `body` và `main` đều rộng đúng 360 px.
- `/admin/users/new`: `document` và `body` rộng 360 px, `main` rộng 355 px.
- Mỗi route có đúng một H1.
- Không có action đang hiển thị nhỏ hơn 44 x 44 px.
- Không có control trong content vượt viewport.
- Các control có tọa độ âm thuộc sidebar đang đóng ngoài canvas và được AdminLayout quản lý inert.
- User error state loại trừ table/empty state và có nút retry.
- User create form giữ label/input association trên toàn bộ field.
- Runtime spot-check không ghi nhận console warning, console error hoặc uncaught exception.

### Kết quả lệnh cuối

- `npm run typecheck`: PASS.
- `npm run build`: PASS, 1.950 module.
- Initial JS: 314,94 kB, gzip 102,65 kB, không có chunk warning.
- CSS chính: 50,67 kB, gzip 9,75 kB.
- `git diff --check`: PASS; cảnh báo LF/CRLF vẫn tồn tại nhưng không có whitespace error.
- `npm audit`: còn 2 High từ cùng advisory React Router RSC-mode, đã phân tích applicability ở trên.
- `npm audit --omit=dev`: còn 2 High từ cùng advisory React Router RSC-mode, đã phân tích applicability ở trên.
- `npm run lint`: không khả dụng, thiếu script.
- `npm test`: không khả dụng, thiếu script.

### File được sửa trong remediation High

- `package.json`
- `package-lock.json`
- `src/app/router/ProtectedRoute.tsx`
- `src/features/user/pages/LoginPage.tsx`
- `src/features/users/pages/UsersListPage.tsx`
- `src/features/users/pages/UserEditorPage.tsx`
