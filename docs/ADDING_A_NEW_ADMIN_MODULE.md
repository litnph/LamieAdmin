# Thêm một Admin module mới

Tài liệu này mô tả convention hiện tại của Dynamic RBAC/Navigation. Ví dụ dùng module giả định **Supplier** để minh họa; repository không triển khai Supplier thật.

## Nguyên tắc bắt buộc

- API là authorization boundary. Mọi endpoint nghiệp vụ phải có policy phù hợp.
- Database là nguồn permission catalog cho UI quản trị và là nguồn menu/route runtime.
- Admin source chỉ sở hữu Page Registry, icon registry và metadata trong manifest. Chuỗi lấy từ database không được dùng để import hoặc khởi tạo component.
- Sidebar không nhận business item hard-code. AppRouter không nhận business component route hard-code.
- `defaultNavigation` trong manifest là metadata nguồn để kiểm tra, preview và chuẩn bị seed; nó không phải runtime fallback. Navigation phải tồn tại trong database thông qua Navigation manager hoặc migration insert-only đã review.
- Không thêm foreign key nếu database vẫn theo kiến trúc logical reference hiện tại.
- Không đổi code/ID permission đã phát hành. Không reset grants hoặc user-role assignment hiện có.

## 1. Tạo feature folder và page

Tạo feature trong Admin:

```text
src/features/suppliers/
  api/suppliersApi.ts
  pages/SupplierListPage.tsx
  manifest.ts
```

Page phải export component từ source. Component loader sẽ trỏ đến export này bằng code, không lấy component name từ database.

```tsx
export const SupplierListPage = () => {
  return <main>Nhà cung cấp</main>;
};
```

Giữ API types trong feature, dùng HTTP client và auth/refresh flow hiện có. Không tạo một auth client riêng.

## 2. Tạo API endpoint và business logic

Đặt contract ở project Application, domain rule ở Domain khi phù hợp, persistence ở Infrastructure và controller/service ở API theo layering hiện có.

Ví dụ controller:

```csharp
[ApiController]
[Route("api/suppliers")]
[Authorize(Policy = PermissionNames.SuppliersView)]
public sealed class SuppliersController : ControllerBase
{
    [HttpGet]
    public Task<IReadOnlyList<SupplierDto>> List(CancellationToken cancellationToken) =>
        _supplierService.GetAsync(cancellationToken);

    [HttpPost]
    [Authorize(Policy = PermissionNames.SuppliersManage)]
    public Task<ActionResult<SupplierDto>> Create(
        CreateSupplierRequest request,
        CancellationToken cancellationToken) =>
        CreateCoreAsync(request, cancellationToken);
}
```

Read policy ở class level và manage policy ở từng write action là convention đang dùng. Service phải validate logical references trước khi ghi nếu schema không có FK.

## 3. Khai báo API permission descriptor

Thêm well-known constants và descriptor vào `Lamie.Application/Identity/Permissions.cs`:

```csharp
public const string SuppliersView = "suppliers.view";
public const string SuppliersManage = "suppliers.manage";

new(SuppliersView, "Xem nhà cung cấp", "Nhà cung cấp", "Xem danh sách nhà cung cấp."),
new(SuppliersManage, "Quản lý nhà cung cấp", "Nhà cung cấp", "Tạo và cập nhật nhà cung cấp."),
```

Quy tắc:

- Code viết thường theo mẫu `module.action`, ổn định vĩnh viễn và tối đa 120 ký tự.
- Descriptor API là nguồn đồng bộ permission hệ thống. Synchronizer chỉ insert descriptor còn thiếu và chỉ bổ sung grant còn thiếu cho Administrator; không reset role khác.
- Nếu cần migration, dùng deterministic ID mới ở cuối catalog. Không tái sử dụng ID.
- Thêm constants tương ứng vào `src/features/auth/permissions.ts` để guard/manifest có compile-time safety. Permission management UI vẫn đọc catalog từ API/database.

## 4. Bảo vệ endpoint và kiểm thử authorization

Mỗi endpoint phải được kiểm tra tối thiểu:

- Không bearer token trả `401`.
- User đã xác thực nhưng thiếu permission trả `403`.
- Permission view không cho phép write.
- Permission manage cho phép đúng write action.
- Role bị disable, user bị disable hoặc permission bị deactivate bị từ chối theo resolver server-side.
- Thay đổi role/grant làm cache bị invalidate và refresh token liên quan bị revoke theo policy hiện tại.

Không dựa vào menu ẩn hoặc route guard ở Admin để bảo vệ dữ liệu.

## 5. Tạo manifest và đăng ký page metadata

Tạo `src/features/suppliers/manifest.ts`:

```tsx
import { defineAdminModuleManifest, lazyNamedComponent } from '@/app/modules/manifest';
import { Permission } from '@/features/auth/permissions';

export const manifest = defineAdminModuleManifest({
  moduleKey: 'suppliers',
  displayName: 'Nhà cung cấp',
  version: '1.0.0',
  permissions: [
    { code: Permission.SuppliersView, name: 'Xem nhà cung cấp', group: 'Nhà cung cấp' },
    { code: Permission.SuppliersManage, name: 'Quản lý nhà cung cấp', group: 'Nhà cung cấp' },
  ],
  pages: [
    {
      pageKey: 'suppliers.list',
      defaultPath: '/admin/suppliers',
      requiredPermission: Permission.SuppliersView,
      lazyComponent: lazyNamedComponent(
        () => import('@/features/suppliers/pages/SupplierListPage'),
        'SupplierListPage',
      ),
    },
  ],
  defaultNavigation: [
    {
      key: 'suppliers.list',
      moduleKey: 'suppliers',
      pageKey: 'suppliers.list',
      label: 'Nhà cung cấp',
      defaultPath: '/admin/suppliers',
      iconKey: 'contact-round',
      permissionCode: Permission.SuppliersView,
      sortOrder: 40,
      isVisible: true,
      isEnabled: true,
      isSystem: true,
    },
  ],
});
```

Registry tự discover đúng literal glob `/src/features/**/manifest.ts`; không cần sửa danh sách import trung tâm. Development build fail fast nếu module/page/navigation key trùng, metadata permission xung đột, path không an toàn hoặc reference thiếu. Production registry bỏ entry lỗi và log cảnh báo đã sanitize.

## 6. Chọn icon an toàn

Chỉ dùng `iconKey` đã có trong `src/app/modules/iconRegistry.ts`. Nếu cần icon mới, thêm source mapping tĩnh tại đó và thêm test. Database chỉ lưu key; unknown key luôn dùng fallback icon, không được lưu hoặc render component name.

## 7. Tạo navigation record trong database

Có hai cách an toàn:

1. Sau khi Admin build chứa Page Registry mới và API catalog đã có permission, dùng trang **Menu & Điều hướng** để tạo record từ danh sách module/page/icon đóng.
2. Với system navigation cần phát hành đồng nhất, tạo migration insert-only có deterministic ID, `IF NOT EXISTS`, parent-first ordering và rollback chỉ xóa đúng ID do migration sở hữu khi việc đó an toàn.

Record route phải có bộ `moduleKey`, `pageKey`, `path` đầy đủ và khớp Page Registry. Visible route không được chứa parameter. Detail/edit route có parameter phải là hidden route. `openInNewTab` luôn false cho internal Admin navigation.

Trước khi áp dụng migration development:

- Chụp count và assignment baseline.
- Tạo/verify copy-only backup.
- Generate idempotent SQL và review không có FK hoặc destructive DDL/DML.
- Áp dụng chỉ vào database development đã xác định.
- Chạy lần hai để xác nhận no-op.
- Kiểm tra duplicate key, duplicate sibling sort, orphan parent và dangling permission.

## 8. Build và kiểm tra management UI

Admin:

```powershell
npm run typecheck
npm run build
npm run test:e2e
```

Repository hiện chưa có lint script. Nếu script được thêm sau này, lint trở thành gate bắt buộc.

API:

```powershell
dotnet restore Lamie.sln --nologo
dotnet build Lamie.sln -c Release --no-restore --nologo
dotnet test Lamie.Tests/Lamie.Tests.csproj -c Release --no-build --nologo
```

Trong Admin, kiểm tra:

- Permission mới xuất hiện từ database và metadata đúng.
- Navigation manager chỉ cho chọn page/icon đã đăng ký.
- Menu preview của role đúng với grants.
- Sidebar và dynamic route xuất hiện/biến mất theo permission và trạng thái navigation.
- Missing page/icon và API failure fail closed, có trạng thái retry rõ ràng.

## 9. Gán permission cho role và làm mới session

Dùng Role manager để gán permission; không chỉnh source default để ghi đè grants hiện tại. Sau khi lưu:

- API invalidate authorization/navigation cache của user bị ảnh hưởng.
- Refresh token liên quan bị revoke.
- User hiện tại cần tải lại auth state; đăng nhập lại khi refresh strategy yêu cầu.
- Kiểm tra cả role có quyền và role không có quyền.

## 10. Checklist hoàn tất Supplier giả định

- Feature folder/page/API client đã có.
- API contract, service và endpoint đã có test.
- `suppliers.view`/`suppliers.manage` đã có descriptor ổn định.
- Mọi endpoint có policy đúng và có regression `401`/`403`.
- Manifest được auto-discover, registry diagnostics rỗng.
- Page loader là source-owned lazy function.
- Navigation database khớp module/page/path/permission source metadata.
- Role manager và menu preview hiển thị đúng.
- Cache invalidation và login/refresh flow được kiểm tra.
- Migration development, nếu có, insert-only, idempotent, không FK, không mất dữ liệu.
- Admin type-check/build/test và API restore/build/test đều pass.
- FE không có thay đổi.

