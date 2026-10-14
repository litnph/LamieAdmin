# Đối chiếu route admin với LAMIE Admin Mockup

Nguồn chuẩn: `docs/LAMIE_UI_UX/LAMIE_Admin_Mockup.html`.

| Route / màn hình | Component hiện tại | Khác biệt so với mockup | Thay đổi cần thực hiện | Trạng thái trước triển khai |
|---|---|---|---|---|
| `/admin/dashboard` | `DashboardPage` | Khung đúng hướng; filter thời gian, nhịp KPI và panel dưới chưa đồng nhất hoàn toàn | Chuẩn hóa header actions, KPI, priority strip và grid 7/5 | Đang sửa |
| `/admin/orders` | `OrderListPage`, `OrderListContent` | Filter và bảng còn dày, desktop table rộng hơn mockup | Gom tab + filter + dữ liệu trong một panel; mobile card theo mockup | Đang sửa |
| `/admin/orders/new` | `OrderEditorPage` | Đã có hai cột nhưng nhóm trường và sticky summary chưa đều | Giữ nghiệp vụ, chuẩn hóa section 01-04, cột giao nhận/thanh toán và action bar | Đang sửa |
| `/admin/orders/:id/edit` | `OrderEditorPage` | Biến thể edit dùng cùng cấu trúc nhưng còn nhịp cũ ở một số editor con | Dùng cùng template form mới, giữ dữ liệu và validation | Đang sửa |
| `/admin/orders/:id` | `OrderDetailPage` | Nhiều block nghiệp vụ hơn mockup, thứ tự panel chưa hoàn toàn trùng | Sắp lại tiến độ, khách/giao, sản phẩm, lịch sử và rail tài chính | Đang sửa |
| `/admin/orders/calendar` | `OrdersCalendarPage` | Cấu trúc gần đúng; cần khóa tỷ lệ bản đồ/danh sách và mobile stack | Chuẩn hóa grid, toolbar ngày, list delivery và trạng thái bản đồ | Đang sửa |
| `/admin/customers` | `CustomerListPage` | Search/filter tách khỏi panel, mobile metadata chưa cùng thứ tự | Dùng list template tab/filter/table và card mobile | Đang sửa |
| `/admin/customers/:id` | `CustomerDetailPage` | Một số summary card còn phong cách cũ | Sắp lịch sử mua hàng ở cột chính, liên hệ/ghi chú ở rail | Đang sửa |
| `/admin/tasks` | `TasksPage` | Tab đã có nhưng table/list và action grouping chưa đồng nhất | Chuẩn hóa tabs, row layout và empty/error/loading | Đang sửa |
| `/admin/products` | `ProductListPage`, `ProductTable` | Filter/action/table còn khác mockup ở desktop và mobile | Gom panel, đúng thứ tự cột, card sản phẩm mobile | Đang sửa |
| `/admin/products/create` | `ProductCreatePage` | Form dài chưa dùng hoàn toàn template product edit | Dùng layout thông tin chính + rail ảnh/trạng thái + save bar | Đang sửa |
| `/admin/products/:id/edit` | `ProductEditPage` | Rail và section gần đúng nhưng spacing/action chưa nhất quán | Chuẩn hóa panel, ảnh, định mức, vùng nguy hiểm | Đang sửa |
| `/admin/products/recognition` | `ProductRecognitionPage` | Trạng thái upload/result chưa cùng nhịp mockup | Dùng split upload/results và state component dùng chung | Đang sửa |
| `/admin/products/catalog-settings` | `ProductCatalogSettingsPage` | Route sâu không có mockup riêng | Áp dụng template Settings và design token mới | Đang sửa |
| `/admin/settings/catalog/product-pricing` | `ProductPriceSettingsPage` | Route sâu không có mockup riêng | Áp dụng template Settings/form mới | Đang sửa |
| `/admin/settings/catalog/branding` | `ShopBrandingSettingsPage` | Gần mockup Settings nhưng preview/action bar còn lệch | Chuẩn hóa settings selector, panel và save well | Đang sửa |
| `/admin/ingredients/inventory` | `InventoryPage` | Bảng và dialog đã hiện đại nhưng thiếu KPI strip/tabs như mockup | Thêm KPI, tabs, mobile list và dialog shell đồng nhất | Đang sửa |
| `/admin/inventory/receiving` | `InventoryPage` | Biến thể nhập kho chưa theo cùng template | Giữ flow nhập, dùng panel form/dialog mới | Đang sửa |
| `/admin/inventory/transactions` | `InventoryPage` | Biến thể lịch sử chưa theo cùng list template | Chuẩn hóa filter, table/card và pagination | Đang sửa |
| `/admin/settings/catalog/inventory` | `InventoryPage` | Biến thể danh mục chưa theo Settings template | Chuẩn hóa list/editor dialog | Đang sửa |
| `/admin/ingredients` | `IngredientsPage` | Không có mockup riêng, còn khác list template | Áp dụng template dữ liệu hàng hóa | Đang sửa |
| `/admin/ingredients/units` | `MeasurementUnitsPage` | Không có mockup riêng | Áp dụng template Settings/list + dialog | Đang sửa |
| `/admin/ingredients/demand` | `IngredientDemandReportPage` | Không có mockup riêng | Áp dụng template report/operations | Đang sửa |
| `/admin/reports` | `FinancialReportPage` | Đúng hệ màu nhưng filter, KPI và chart/table grouping còn lệch | Chuẩn hóa header actions, report toolbar và section order | Đang sửa |
| `/admin/expenses` | `ExpenseListPage` | Filter/table/dialog chưa hoàn toàn theo mockup | Gom panel, đúng order cột/action, dialog shell mới | Đang sửa |
| `/admin/settings/expense-categories` | `ExpenseCategoriesPage` | Route sâu không có mockup riêng | Áp dụng Settings/list template | Đang sửa |
| `/admin/content` | `ContentCreatePage`, `ContentShell` | Flow đúng nhưng section header/action và output cards chưa đều | Chuẩn hóa 01-03, output grid và tabs content | Đang sửa |
| `/admin/content/footer` | `ContentFooterSettingsPage` | Gần mockup, cần thống nhất shell và save bar | Chuẩn hóa content tabs, platform panels và states | Đang sửa |
| `/admin/content/history` | `ContentHistoryPage` | List/filter gần đúng, mobile cần cùng template | Chuẩn hóa list panel, detail drawer/dialog và pagination | Đang sửa |
| `/admin/settings/catalog` | `CatalogSettingsLandingPage` | Cấu trúc settings chưa bám selector + panel của mockup ở mọi viewport | Chuẩn hóa settings landing/switcher | Đang sửa |
| `/admin/settings/attributes/:attributeKey` | `AttributesPage` + master-data pages | Một số trang con vẫn giữ `rounded-2xl`, shadow lớn và form cũ | Thay wrapper/form/table cũ bằng Settings/list/dialog template | Đang sửa |
| `/admin/settings/channels` | `ChannelsPage` | Route sâu không có mockup riêng | Áp dụng Settings/list template | Đang sửa |
| `/admin/users` | `UsersListPage` | Desktop/mobile đã tách nhưng panel và action chưa khớp | Chuẩn hóa account list/card, role/status/action order | Đang sửa |
| `/admin/users/new` | `UserEditorPage` | Form một cột rộng, chưa giống panel hẹp của mockup | Giới hạn form, group trường và save/cancel bar | Đang sửa |
| `/admin/users/:id/edit` | `UserEditorPage` | Biến thể edit cần giữ reset/status action | Dùng cùng form template, giữ hành động bắt buộc | Đang sửa |
| `/admin/roles` | `RolesManagementPage` | Cấu trúc gần mockup nhưng density và rail roles chưa khớp | Chuẩn hóa editor + permission groups + roles rail | Đang sửa |
| `/admin/permissions` | `PermissionsManagementPage` | Filter và table còn là các panel rời | Gom list panel, dùng dialog add/edit chuẩn | Đang sửa |
| `/admin/navigation` | `NavigationManagementPage` | Preview sidebar tối không giống mockup; dialog spacing lệch | Dùng cây điều hướng + preview sáng và modal form chuẩn | Đang sửa |
| `/login` | `LoginPage` | Đã đổi một phần, cần kiểm tra mobile/keyboard | Khớp split layout desktop và form compact mobile | Đang sửa |
| Route lỗi/quyền/loading | `AppRouter`, state cục bộ | State còn phân tán | Đồng nhất loading/empty/error/readonly/saving theo mockup | Đang sửa |

## Kết quả triển khai

- Đã hoàn tất hệ thống dùng chung: app shell, sidebar tài khoản gọn ở đầu, header, PageHeader, token màu/khoảng cách, dialog, settings shell, bảng/card responsive và Lucide Animated có `prefers-reduced-motion`.
- Đã hoàn tất đối chiếu trực quan có ảnh ở 1440, 1024, 768, 390 và 360 px cho dashboard, danh sách đơn, form đơn, sản phẩm, kho và Settings.
- Đã áp dụng cùng template cho các route sâu và biến thể còn lại trong bảng: chi tiết đơn/khách, lịch giao, tác vụ, sản phẩm create/edit/recognition, nguyên liệu, báo cáo, chi phí, nội dung, user/role/permission/navigation và login.
- Đã kiểm tra toàn bộ registry route và quyền bằng E2E; 125 test chạy thành công, 1 test local Admin/API/DB được skip do phụ thuộc runtime cục bộ.
- Các trang `src/features/masterdata/pages/{Category,Color,Language,Tag}Page.tsx` không còn được manifest/router tham chiếu; route thực tế dùng `AttributesPage`, vì vậy không được tính là màn hình admin hiện hành.
