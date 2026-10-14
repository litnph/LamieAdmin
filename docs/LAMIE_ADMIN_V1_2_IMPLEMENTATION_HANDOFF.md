# Lamie Admin V1.2 — bàn giao triển khai

## Bổ sung Lucide Animated toàn hệ thống

- Toàn bộ 61 file ứng dụng từng import `lucide-react` trực tiếp đã chuyển qua facade `src/shared/icons/lucideAnimated.tsx`; facade hiện bao phủ toàn bộ 111 tên icon đang dùng trong Admin.
- 24 icon có source Lucide Animated trong handoff dùng đúng animation riêng. Các icon Lucide còn lại giữ nguyên glyph, kích thước, màu và `strokeWidth`, đồng thời dùng motion feedback thống nhất khi hover, focus hoặc pointer down trên control chứa icon.
- Motion tự dừng sau tối đa 1,2 giây, dừng khi tab bị ẩn và tôn trọng `prefers-reduced-motion`. Root của source animation được chuẩn hóa thành `span` để hợp lệ trong nút, nhãn và nội dung inline.
- Test `tests/unit/lucide-animated-coverage.test.ts` ngăn import Lucide tĩnh quay lại và kiểm tra các safeguard motion chính.

Ngày kiểm tra: 08/10/2026. Phạm vi: `Admin_Lamie`; storefront `FE_Lamie` không thay đổi.

## Kết quả

- App shell dùng token V1.2, font Inter Variable cục bộ, sidebar 224 px/rail 76 px và canvas/surface/border đúng handoff.
- Cụm tài khoản lấy từ phiên đăng nhập nằm đầu sidebar trên desktop, rail và drawer mobile; toàn cụm mở popover, `Escape` đóng và focus trả về trigger.
- CTA tạo đơn nằm ngay dưới tài khoản và vẫn chỉ xuất hiện khi route/quyền động cho phép.
- Navigation tiếp tục lấy cây menu và route từ API. Route guard, permission của page/action, read-only và điều hướng tới route đầu tiên được phép không đổi.
- Lucide Animated dùng trực tiếp source bàn giao trên toàn Admin; các glyph chưa có animation riêng dùng motion feedback chung qua facade. Hover/focus/touch kích hoạt, tự dừng tối đa 1,2 giây, dừng khi tab ẩn và tôn trọng thay đổi `prefers-reduced-motion` trong lúc chạy.
- Bảng chính dùng table ở desktop và card/list có nhãn ở mobile, gồm bảng báo cáo tài chính và định mức nguyên liệu. Settings giữ sub-navigation desktop và select nhóm trên mobile.
- Dialog chuẩn dùng bottom sheet mobile/dialog desktop, khóa cuộn nền, trap focus, `Escape` và trả focus. Dialog Nhập nhanh nhiều đơn đã được bổ sung cùng hành vi mà không đổi payload/API batch.
- Dashboard dùng hook/API hiện hữu; KPI, việc ưu tiên, biểu đồ, cảnh báo lỗi một phần và tùy chọn tính phí giao hàng không dùng dữ liệu hardcode.

## Ma trận route

`Hoàn tất` nghĩa là route vẫn dùng service/hook thật hiện hữu, đã nhận token/app-shell V1.2 và được rà responsive/state theo template tương ứng.

| Nhóm | Route | File/component production | Mockup/template | Trạng thái |
|---|---|---|---|---|
| Xác thực | `/login` | `features/user/pages/LoginPage.tsx` | 01, 32 | Hoàn tất |
| Tổng quan | `/admin/dashboard` | `app/pages/DashboardPage.tsx` | 02, 33, 40 | Hoàn tất |
| Đơn hàng | `/admin/orders` | `features/orders/pages/OrderListPage.tsx` | 03, 30, 31, 34, 39 | Hoàn tất |
| Đơn hàng | `/admin/orders/new` | `features/orders/pages/OrderEditorPage.tsx` | 04, 27, 35 | Hoàn tất |
| Đơn hàng | `/admin/orders/calendar` | `features/orders/pages/OrdersCalendarPage.tsx` | 06 | Hoàn tất |
| Đơn hàng | `/admin/orders/:id` | `features/orders/pages/OrderDetailPage.tsx` | 05 | Hoàn tất |
| Đơn hàng | `/admin/orders/:id/edit` | `features/orders/pages/OrderEditorPage.tsx` | 04/05 editor template | Hoàn tất |
| Khách hàng | `/admin/customers` | `features/customers/pages/CustomerListPage.tsx` | 07 | Hoàn tất |
| Khách hàng | `/admin/customers/:id` | `features/customers/pages/CustomerDetailPage.tsx` | 08 | Hoàn tất |
| Công việc | `/admin/tasks` | `features/ingredients/pages/TasksPage.tsx` | 09 | Hoàn tất |
| Nguyên liệu | `/admin/ingredients` | `features/ingredients/pages/IngredientsPage.tsx` | Settings/list template | Hoàn tất |
| Nguyên liệu | `/admin/ingredients/units` | `features/ingredients/pages/MeasurementUnitsPage.tsx` | Settings/list template | Hoàn tất |
| Nguyên liệu | `/admin/ingredients/demand` | `features/ingredients/pages/IngredientDemandReportPage.tsx` | Report/list template | Hoàn tất |
| Kho | `/admin/ingredients/inventory` | `features/ingredients/pages/InventoryPage.tsx` | 13, 28, 37 | Hoàn tất |
| Kho | `/admin/inventory/receiving` | `features/ingredients/pages/InventoryPage.tsx` | 28, 38 | Hoàn tất |
| Kho | `/admin/inventory/transactions` | `features/ingredients/pages/InventoryPage.tsx` | Inventory history template | Hoàn tất |
| Kho/Settings | `/admin/settings/catalog/inventory` | `features/ingredients/pages/InventoryPage.tsx` | 19/13 shared workspace | Hoàn tất |
| Sản phẩm | `/admin/products` | `features/product/pages/ProductListPage.tsx` | 10 | Hoàn tất |
| Sản phẩm | `/admin/products/create` | `features/product/pages/ProductCreatePage.tsx` | 11 editor template | Hoàn tất |
| Sản phẩm | `/admin/products/:id/edit` | `features/product/pages/ProductEditPage.tsx` + create template | 11 | Hoàn tất |
| Sản phẩm | `/admin/products/recognition` | `features/product/pages/ProductRecognitionPage.tsx` | 12 | Hoàn tất |
| Sản phẩm | `/admin/products/catalog-settings` | `features/product/pages/ProductCatalogSettingsPage.tsx` | Redirect theo brief | Hoàn tất |
| Tài chính | `/admin/reports` | `features/reports/pages/FinancialReportPage.tsx` | 14 | Hoàn tất |
| Tài chính | `/admin/expenses` | `features/expenses/pages/ExpenseListPage.tsx` | 15, 29 | Hoàn tất |
| Content | `/admin/content` | `features/content/pages/ContentCreatePage.tsx` | 16 | Hoàn tất |
| Content | `/admin/content/footer` | `features/content/pages/ContentFooterSettingsPage.tsx` | 17 | Hoàn tất |
| Content | `/admin/content/history` | `features/content/pages/ContentHistoryPage.tsx` | 18 | Hoàn tất |
| Settings | `/admin/settings/catalog` | `features/settings/pages/CatalogSettingsLandingPage.tsx` | 19, 36 | Hoàn tất |
| Settings | `/admin/settings/catalog/product-pricing` | `features/product/pages/ProductPriceSettingsPage.tsx` | 19 settings detail | Hoàn tất |
| Settings | `/admin/settings/catalog/branding` | `features/product/pages/ShopBrandingSettingsPage.tsx` | 19 settings detail | Hoàn tất |
| Settings | `/admin/settings/expense-categories` | `features/expenses/pages/ExpenseCategoriesPage.tsx` | 19 settings detail | Hoàn tất |
| Settings | `/admin/settings/channels` | `features/settings/channels/pages/ChannelsPage.tsx` | 19 settings detail | Hoàn tất |
| Settings | `/admin/settings/attributes/:attributeKey` | `features/settings/attributes/pages/AttributesPage.tsx` | 19 settings detail | Hoàn tất |
| Quản trị | `/admin/users` | `features/users/pages/UsersListPage.tsx` | 20 | Hoàn tất |
| Quản trị | `/admin/users/new` | `features/users/pages/UserEditorPage.tsx` | 21 | Hoàn tất |
| Quản trị | `/admin/users/:id/edit` | `features/users/pages/UserEditorPage.tsx` | 21 editor template | Hoàn tất |
| Quản trị | `/admin/roles` | `features/roles/pages/RolesManagementPage.tsx` | 22 | Hoàn tất |
| Quản trị | `/admin/permissions` | `features/access-control/pages/PermissionsManagementPage.tsx` | 23 | Hoàn tất |
| Quản trị | `/admin/navigation` | `features/access-control/pages/NavigationManagementPage.tsx` | 24 | Hoàn tất |
| Hệ thống | `/admin/unauthorized` | `app/pages/SystemStatePages.tsx` | 26 | Hoàn tất |
| Hệ thống | `/admin/not-found`, fallback | `app/pages/SystemStatePages.tsx` | 26 | Hoàn tất |
| Hệ thống | `/admin`, `/` | `app/router/AppRouter.tsx` | Redirect quyền động | Hoàn tất |

Các alias legacy cho attributes/masterdata vẫn redirect sang route hiện hành. Các file `features/masterdata/pages` không phải route production, đúng ghi chú trong brief.

## File và primitive chính

- Token/font/theme: `tailwind.config.cjs`, `src/index.css`, `src/main.tsx`, `src/shared/theme/adminPrimary.ts`, `DESIGN.md`.
- App shell: `src/layouts/AdminLayout.tsx`, `src/shared/components/Sidebar.tsx`, `src/shared/components/PageHeader.tsx`, `src/shared/components/PrimaryColorPicker.tsx`.
- Motion: `src/shared/icons/lucideAnimated.tsx`, `src/shared/components/AnimatedLucideIcon.tsx`, `src/lib/utils.ts`; source gốc giữ tại `docs/LAMIE_UI_UX/motion-source/icons`.
- Responsive dữ liệu: `IngredientDemandReportPage.tsx`, `FinancialReportPage.tsx`, `ReportTables.tsx`.
- Dialog/import: `QuickOrderBatchImportDialog.tsx`.
- Ảnh đối chiếu thực tế: `artifacts/sidebar-after/` ở 360, 390, 768, 1024, 1366 và 1440 px.

## Kiểm tra thực tế

| Lệnh | Kết quả |
|---|---|
| `npm run test:unit` | 6/6 đạt |
| `npm run typecheck` | đạt |
| `npm run build` | đạt; Vite chỉ cảnh báo chunk entry lớn hơn 500 kB |
| `npm run test:e2e` | 125 đạt, 1 bỏ qua có chủ đích |
| `npx playwright test tests/e2e/sidebar-visual.spec.ts` | 5/5 đạt |
| `git diff --check` | đạt |

Test bị bỏ qua là `local-runtime-acceptance.spec.ts`; suite này là opt-in vì sẽ ghi bản ghi `TEST-LOCAL` vào API/DB thật. Các E2E dùng API mock đã kiểm tra refresh auth, route/permission động, CRUD quyền/vai trò, tạo/sửa/chuyển trạng thái đơn, cọc/phí giao/thanh toán, quick import batch/upload, nguyên liệu/kho, báo cáo/export, content/versioning, responsive và lỗi API. Không có backend/API thật được giả lập là đã kiểm tra ngoài phạm vi suite.

Repository không khai báo script lint riêng. `npm audit --omit=dev` còn báo advisory mức high ở `axios@1.18.1`; đây là dependency/version đã có trước thay đổi V1.2, không phát sinh từ Inter hoặc Motion và không được tự nâng ngoài phạm vi UI/API-compatibility của đợt này.

## Chạy lại

```powershell
npm install
npm run typecheck
npm run build
npm run test:unit
npm run test:e2e
```

Để chạy acceptance có ghi dữ liệu thật, chỉ bật biến môi trường mà test `local-runtime-acceptance.spec.ts` yêu cầu sau khi có API/DB local an toàn để nhận dữ liệu `TEST-LOCAL`.
