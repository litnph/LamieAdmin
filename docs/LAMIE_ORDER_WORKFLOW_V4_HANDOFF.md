# Lamie Admin — Order Workflow V4 handoff

Ngày chốt triển khai: 13/10/2026. Phạm vi này đã được tích hợp với API thật, áp dụng migration vào database development `Lamie_Pro` và publish vào IIS development hiện hữu.

## Yêu cầu → giao diện → backend → kiểm tra

| Yêu cầu | Component / route | API / service | Kiểm tra |
| --- | --- | --- | --- |
| Danh sách theo ngày, bộ lọc mặc định 7 ngày, tìm kiếm, dữ liệu dòng đầy đủ | `OrderListPage`, `/admin/orders` | `GET /api/orders/delivery-board` | Playwright `orders.spec.ts`; browser desktop/mobile với API thật |
| Quy trình rút gọn: Đơn mới → Làm hoa → Thành phẩm → Đang giao hàng → Khách đã nhận hàng | `OrderListDialogs`, `OrderDetailPage`, dashboard actions | `POST /api/orders/{id}/actions/{workflowAction}` | domain, integration và Playwright |
| Tạm ẩn chuẩn bị/phân công/checklist | Danh sách và trang chi tiết | Dữ liệu/API cũ được giữ để tương thích, không xóa schema | typecheck, build, browser smoke |
| Tóm tắt là modal; thiệp/banner; action nhanh; sửa phí ship thực tế | `OrderListDialogs` | `PATCH /api/orders/{id}/shipping-actual` với row version | Playwright `orders.spec.ts` |
| Chi tiết là route deep link; sửa phí ship; lịch sử | `OrderDetailPage`, `/admin/orders/:id` | `GET /api/orders/{id}`, shipping/history endpoints | Playwright và browser smoke |
| Chuyển trạng thái tự do là nút riêng có phân quyền | `OrderDetailPage` | `PATCH /api/orders/{id}/status/override`; permission `orders.change-status` | API contract, domain, integration; runtime admin không bị 403 |
| Tạo/sửa: người đặt chính, người nhận nullable, sao chép chủ động | `OrderEditorPage`, `/admin/orders/new`, `/admin/orders/:id/edit` | multipart create/update order | `order-editor.spec.ts`, API order tests |
| Thanh toán chỉ hiển thị đã đủ/chưa đủ và số còn lại | danh sách, modal, chi tiết | persisted `OrderPayment`; không tự tạo khoản thu khi chỉ đổi trạng thái | domain, integration và Playwright |
| Hoàn tất chỉ khi đã giao/nhận và thanh toán đủ | workflow UI | `Order`, `OrderService` | domain và integration tests |
| Tổng quan, lịch giao và khách hàng tải từ API thật | dashboard, `OrdersCalendarPage`, customer routes | dashboard/delivery-board/customer queries | authenticated IIS API + browser smoke |

## Quy trình và tương thích

Action thường theo thứ tự:

1. `Created` / Đơn mới — **Chuẩn bị đơn** → `Producing` / Làm hoa.
2. `Producing` / Làm hoa — **Đã làm xong** → `Ready` / Thành phẩm.
3. `Ready` / Thành phẩm — **Giao hàng** → `Shipping` / Đang giao hàng. Đơn ghé lấy bỏ qua bàn giao shipper theo rule hiện hữu.
4. `Shipping` / Đang giao hàng — **Giao thành công** → `Delivered` / Công nợ nếu chưa thanh toán đủ; nếu đã đủ tiền thì backend tự chuyển `Completed` / Hoàn tất.
5. Backend chỉ tự chuyển sang `Completed` khi đồng thời có bằng chứng giao/nhận và đã thanh toán đủ.

`Confirmed` được giữ như trạng thái legacy và vẫn có đường chuyển tiếp an toàn. Nút **Chuyển trạng thái** chỉ xuất hiện khi người dùng có `orders.change-status`; endpoint vẫn chặn gán tay `Completed`, `Cancelled` và trạng thái legacy `Confirmed`. Chuyển sang trạng thái giao hàng vẫn kiểm tra loại nhận và thông tin người nhận cần thiết.

Phần chuẩn bị/phân công/checklist chỉ được ẩn khỏi quy trình hiện tại. Schema, lịch sử và endpoint cũ không bị xóa để tránh mất dữ liệu và giữ tương thích ngược.

UI không còn yêu cầu chọn tiền mặt/chuyển khoản khi ghi nhận tiền khách đã trả. Request dùng giá trị tương thích `Other` cho trường legacy bắt buộc, còn sự kiện thu tiền thật, số tiền và thời điểm vẫn được lưu trong ledger. Thao tác đổi trạng thái hoặc “đánh dấu đã thanh toán” không tự sinh dòng tiền ngân hàng giả.

## Migration và database

- `20261012082449_AddOrderWorkflowV4`: bổ sung workflow, recipient nullable, ship thực tế, payment/audit và các index truy vấn. Migration không sao chép người đặt sang người nhận.
- `20261013122221_AddOrderStatusChangePermission`: thêm permission `orders.change-status` và gán cho role `Quản trị viên`.
- Cả hai đã được áp dụng vào database development `Lamie_Pro` trên `./SQLEXPRESS` ngày 13/10/2026.
- Đã xác minh migration mới nhất trong `__EFMigrationsHistory`, permission thuộc role quản trị và hai tài khoản admin hiện hữu nhận quyền qua role.
- Không thêm secret vào repository và không tự chạy migration trên production.

Với dữ liệu hoàn tất cũ, migration workflow chỉ giữ hoàn tất mới nếu có đủ chứng cứ giao và thanh toán. Bản ghi đã giao nhưng chưa đủ chứng cứ thanh toán được giữ ở trạng thái đã nhận; không suy đoán timestamp, không xóa lịch sử tiền và không ép người nhận null thành người đặt.

## Publish development

- API Release: `D:\IIS Build\Lamie\Api`.
- Admin build: `D:\IIS Build\Lamie\Admin`.
- Backup gần nhất trước publish quy tắc Công nợ: `D:\IIS Build\Lamie\Api_backup_before_DebtStatus_20261013-224542` và `D:\IIS Build\Lamie\Admin_backup_before_DebtStatus_20261013-224542`.

## Chạy development

```powershell
cd D:\Git\Lamie\API_Lamie
dotnet ef database update --project Lamie.Infrastructure --startup-project Lamie.API
dotnet run --project Lamie.API

cd D:\Git\Lamie\Admin_Lamie
npm install
npm run dev
```

Frontend production dùng API thật; fixture chỉ nằm trong test/development và không nằm trên đường chạy production.

## Kết quả kiểm tra

- Backend: `dotnet test Lamie.sln --no-restore` — **291/291 passed**.
- EF model: `dotnet ef migrations has-pending-model-changes` — **không có model drift** tại lần kiểm tra sau khi tạo migration.
- Frontend: `npm run typecheck` — **passed**; `npm run test:unit` — **6/6 passed**; `npm run build` — **passed**.
- Playwright order scope: **13/13 passed**.
- Playwright toàn bộ: **136 passed, 2 skipped**; một theme screenshot timeout khi chạy song song đã chạy lại riêng và **1/1 passed**.
- IIS authenticated API: dashboard, delivery board, customers và `/api/auth/me` đều trả **200**. Endpoint override với admin đi qua permission và trả **404** cho ID ngẫu nhiên, không phát sinh mutation.
- Browser authenticated: Tổng quan, Đơn hàng, Khách hàng và màn hình đơn hàng mobile tải thành công; mobile không có overflow ngang.

Ảnh xác minh cuối:

- `artifacts/visual-qa/orders-workflow-final-desktop.png`
- `artifacts/visual-qa/orders-workflow-final-mobile.png`

Không còn blocker đã biết trong phạm vi Order Workflow V4.

## Cập nhật ưu tiên lưới và đối soát trạng thái — 13/10/2026

- Data migration `20261013132022_ReconcileDeliveredPaidOrders` chuyển đúng các đơn `Delivered + Paid` sang `Completed`, đồng thời ghi audit `DataReconciled`. Migration không tạo payment ledger và không tự điền `completed_at`/`paid_in_full_at` còn thiếu.
- Đã áp dụng migration vào `Lamie_Pro`: 65 đơn được đối soát, tổng số đơn hoàn tất sau cập nhật là 70. Hai đơn cũ đã nhận nhưng chưa thanh toán đủ vẫn non-terminal và được phân nhóm `delivered-unpaid`, hiển thị là **Công nợ**.
- Delivery board sắp xếp trước phân trang theo thứ tự: đang trễ → sắp tới → chưa thanh toán đủ → hoàn tất → nhóm khác; trong mỗi nhóm tiếp tục theo thời gian giao và mã đơn.
- Lưới desktop và mobile dùng màu nền semantic có kiểm soát: đỏ nhạt cho đang trễ, vàng nhạt cho chưa thanh toán đủ và xanh nhạt cho hoàn tất. Badge/nhãn chữ luôn đi kèm nên không truyền đạt trạng thái chỉ bằng màu.
- `Completed` hiển thị là **Hoàn tất**; `Delivered` chưa đủ tiền hiển thị là **Công nợ**. Đây là nhãn nghiệp vụ của trạng thái đã nhận hàng nhưng còn phải thu, không thêm enum trùng nghĩa vào database.
- Quy tắc cập nhật: **Đang trễ** chỉ áp dụng cho đơn chưa giao/nhận khi quá giờ hẹn. Đơn đã nhận nhưng chưa đủ tiền là **Công nợ**, dù lịch hẹn đã qua.
- Xác minh sau publish IIS với API thật trên `Lamie_Pro`: 73 đơn gồm 0 `late`, 1 `upcoming`, 2 `delivered-unpaid`/Công nợ và 70 `completed`. Trang đầu hiển thị đúng `upcoming` → Công nợ → Công nợ → Hoàn tất; browser desktop/mobile không có lỗi console/API hoặc overflow ngang.
- Trên lưới desktop/mobile và chế độ bảng công việc, đơn có `paymentStatus = Paid` chỉ hiển thị **Đã thanh toán**; không hiển thị số tiền còn lại, kể cả bản ghi legacy thiếu lịch sử thu tiền.
- Kiểm tra sau cập nhật: backend 292/292, FE unit 6/6, typecheck/build passed, order Playwright 14/14.

Ảnh runtime thật:

- `artifacts/visual-qa/debt-status-20261013/orders-debt-real-desktop.png`
- `artifacts/visual-qa/debt-status-20261013/orders-debt-real-mobile.png`
- `artifacts/visual-qa/hide-paid-remaining-20261013/paid-order-desktop.png`
- `artifacts/visual-qa/hide-paid-remaining-20261013/paid-order-mobile.png`
