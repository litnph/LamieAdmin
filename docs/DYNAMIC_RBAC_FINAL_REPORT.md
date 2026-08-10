# Dynamic RBAC & Navigation Final Report

Ngày review cuối: 2026-08-04
Phạm vi: `Admin_Lamie` và `API_Lamie`
Read-only: `FE_Lamie`

## Kết luận

Kế hoạch PHASE 0 đến PHASE 12 đã được thực hiện tuần tự. Admin hiện lấy business menu và accessible business routes từ API/database, sau đó resolve component duy nhất qua Page Registry source-owned. API enforce permission động bằng policy provider và resolver server-side. Permission/Navigation/Role management dùng database làm nguồn vận hành và giữ compatibility với identity flow hiện có.

Không deploy production, không chạy production migration, không merge hoặc force-push. `FE_Lamie` sạch và không có file nào bị sửa.

## Project và baseline

| Vai trò | Project | Quyền sửa | Branch |
| --- | --- | --- | --- |
| Storefront FE | `FE_Lamie` | Read-only | `codex` |
| Admin | `Admin_Lamie` | Được sửa | `dev-codex` |
| Backend API | `API_Lamie` | Được sửa | `codex` |

Admin và API đã có tracked/untracked user changes từ baseline. Toàn bộ implementation được làm tăng dần trên baseline đó; không dùng reset/checkout để ghi đè. Các file cấu hình development đã dirty từ baseline được giữ nguyên và không được đưa vào tài liệu như secret.

Baseline database development là `(localdb)\MSSQLLocalDB / Lamie_Dev`: 19 permissions, 3 roles, 42 role-permission grants, 3 users, 3 authoritative user-role rows và 0 foreign keys.

## Kết quả theo phase

| Phase | Kết quả chính |
| --- | --- |
| 0 | Hoàn tất instruction inventory, Git/data/code baseline và `DYNAMIC_RBAC_INVENTORY.md`. |
| 1 | Chốt architecture, contracts, security, migration và rollback design trong `DYNAMIC_RBAC_DESIGN.md`. |
| 2 | Thêm permission metadata, dynamic policy provider/handler, resolver, cache, invalidation, audit và permission APIs. |
| 3 | Thêm `auth_navigation` không FK, current-user tree/routes, management APIs, validation, audit và cache. |
| 4 | Thêm auto-discovered Module/Page/Permission/Navigation registries và fixed Icon Registry. |
| 5 | Chuyển toàn bộ business pages hiện có sang feature-owned manifests. |
| 6 | Sidebar chuyển sang database navigation tree, permission-filtered, recursive và có loading/error/empty states. |
| 7 | AppRouter dựng business routes từ API Navigation + source Page Registry với conflict/missing-page protection. |
| 8 | Hoàn tất Permission manager, Navigation manager, Role permission metadata và menu preview. |
| 9 | Backup/verify development, review idempotent SQL, migrate/seed `Lamie_Dev`, kiểm tra repeat no-op và preservation. |
| 10 | Hoàn tất auth/authorization/cache/management integration regression và final-active-Administrator guard. |
| 11 | Xóa runtime manifest fallback và các business menu/component route sources cũ; API failure hiện fail closed. |
| 12 | Hoàn tất security/data/migration/cache/N+1/conflict/dead-code review, final gates và documentation. |

## Kiến trúc cuối

```text
API permission descriptors
        │ insert-only synchronization
        ▼
auth_permissions ── role grants/user roles ── server authorization handler
        │                                      │
        └──────── management APIs              └─ 401/403 enforcement

auth_navigation ── permission-filtered me/menu + me/routes
        │
        ▼
Admin NavigationContext
        ├─ Sidebar: labels/tree/icon keys from database
        └─ Dynamic Router: moduleKey/pageKey/path from database
                              │
                              ▼
                    source-owned Page Registry
                    source-owned lazy component
```

Database không thể chỉ định component hoặc import URL. `moduleKey`/`pageKey` chỉ lookup trong registry build từ source. `iconKey` chỉ lookup trong fixed source map và có stable fallback.

## Security review

- Chỉ login và refresh endpoints anonymous; các identity/business/management endpoints còn lại có authenticated hoặc permission policy phù hợp.
- Dynamic policy dùng bearer scheme, authenticated principal và server-side active user/role/permission resolution. Tests phân biệt rõ `401` và `403`.
- JWT login/refresh rotation, refresh failure, role assignment, token revocation và permission cache invalidation đều có integration coverage.
- Serializable guard ngăn disable/reassign active Administrator cuối cùng, đồng thời giữ legacy role fallback để recovery.
- Permission system không đổi code, không update/deactivate; custom permission deactivate thay vì hard-delete.
- System role/navigation được bảo vệ khỏi delete không an toàn. Logical references, cycle, sibling order, path, page binding và permission code được validate ở service/domain.
- Không có `eval`, dynamic `Function`, remote script, database-driven component loader, token/password logging hoặc type-error suppression.
- Admin route builder re-check path và mọi source binding; DB không thể làm yếu `requiredPermission` của Page Registry.
- Sidebar/Router fail closed khi navigation API lỗi. Missing page/icon và malformed/conflicting record không dẫn đến thực thi tùy ý.

## Data integrity và migration review

Post-migration development evidence:

| Kiểm tra | Kết quả |
| --- | ---: |
| Permissions | 21 |
| Exact original permission ID/code matches | 19/19 |
| Roles | 3 |
| Role-permission grants | 44 |
| User-role rows | 3 |
| Users | 3 |
| Navigation rows | 25 |
| Foreign keys toàn database | 0 |

Role totals là Administrator 21, Manager 15, Staff 8. Đây là baseline 42 grants đã custom cộng đúng hai navigation grants cho Administrator; Manager và Staff không bị reset. Ba user-role rows và ba users được giữ nguyên.

Navigation có 15 visible, 10 hidden, 23 route và 2 group records. Audit cuối không tìm thấy duplicate permission/role/navigation key, duplicate user assignment, duplicate sibling sort order, orphan parent, dangling role/permission/user reference hoặc dangling navigation permission.

Ba migration RBAC:

- `20260804031348_AddDynamicPermissionFoundation`
- `20260804032612_AddNavigationBackend`
- `20260804041956_SeedDefaultAdminNavigation`

Idempotent forward script riêng cho ba migration không chứa FK, destructive table/column operation, truncate hoặc delete. Seed dùng guarded insert, deterministic IDs và parent-first insertion. Lần apply thứ hai trên `Lamie_Dev` là no-op. Copy-only backup trước migration vẫn tồn tại và `RESTORE VERIFYONLY` báo valid:

```text
C:\Users\Ngoph\AppData\Local\Temp\Lamie_Dev_PreDynamicRBAC_20260804_0420.bak
```

Production không được kết nối hoặc thay đổi trong công việc này.

## Cache, query và conflict review

- Authorization/menu/routes cache theo user có absolute TTL 5 phút và sliding TTL 1 phút.
- User update/disable, role grant update, permission mutation/catalog sync và navigation mutation gọi đúng invalidation scope.
- Authorization resolver query user, role và permissions theo tập; navigation endpoints load navigation một lần rồi filter/build tree trong memory.
- Permission list lấy role counts bằng grouped query; role list lấy assignment/grant maps theo tập. Không có query theo từng row trong loop.
- Navigation indexes hỗ trợ key, enabled/visible, module/page, parent/sort và permission lookup. Access-control tables giữ logical-reference indexes hiện có.
- Registry và dynamic route builder reject duplicate module/page/navigation key, conflicting permission metadata, exact/parameter route shape conflicts và reserved platform conflicts deterministically.
- Database unique indexes cộng service validation bảo vệ code/key; no-FK architecture được bù bằng validation, audit queries và indexes.

Current cache là process-local, phù hợp deployment đơn instance hiện tại. Nếu scale ngang, cần distributed cache hoặc cross-instance invalidation trước khi xem việc revoke là tức thời trên mọi instance.

## Legacy/dead-code review

- Sidebar không còn business item arrays; AppRouter không còn business page imports hoặc component routes.
- Bốn master-data compatibility redirects vẫn static theo design để giữ URL cũ; chúng không render business component và không phải navigation source.
- `AdminOnlyRoute.tsx` không còn consumer. File này có user change từ baseline nên được giữ, đánh dấu deprecated và chỉ redirect tới platform Unauthorized route.
- Static role-permission map trong Admin chỉ là fallback cho Auth response cũ thiếu `permissions`; Permission/Role management không dùng map này làm catalog.
- Well-known API permission constants được giữ để compile-time safety và descriptor synchronization.
- Không còn temporary runtime source fallback, duplicate runtime seed builder, conflict marker hoặc work marker trong source/tests/docs.

## Final verification gates

| Gate | Kết quả |
| --- | --- |
| Admin type-check | PASS |
| Admin production build | PASS, 1,980 modules |
| Admin Playwright | PASS, 40/40 |
| Admin lint | Không khả dụng: repository chưa định nghĩa script `lint` |
| API restore | PASS |
| API Release build | PASS, 0 warnings / 0 errors |
| API tests | PASS, 108/108 |
| Admin/API `git diff --check` | PASS |
| FE Git status | Clean |

Regression coverage gồm registry discovery/conflicts, all-page lazy loading, Sidebar tree/states, dynamic Router/path conflicts, permissions, roles/menu preview, navigation CRUD/reorder/enable/disable, auth refresh flow, cache invalidation, last Administrator, expenses/reports và legacy business flows.

## Local `Lamie` database rollout — 2026-08-05

Sau khi PHASE 0-12 hoàn tất, schema đã được áp dụng riêng cho database local `(localdb)\MSSQLLocalDB / Lamie` theo yêu cầu vận hành tiếp theo. Đây không phải deployment hoặc migration production.

- Baseline có 13 migration-history rows, 3 users, 43 refresh tokens, dữ liệu sản phẩm/khách hàng/đơn hàng hiện hữu và 0 FKs; Role/Permission/Expense/Navigation tables chưa tồn tại.
- Tạo và `RESTORE VERIFYONLY` thành công copy-only backup `C:\Users\Ngoph\AppData\Local\Temp\Lamie_PreDynamicRBAC_20260805_000844.bak`.
- Build Release pass với 0 warnings/errors; generated idempotent script chứa đúng 5 migration còn thiếu và không có FK, destructive `DROP`, `TRUNCATE` hoặc `DELETE`.
- Áp dụng script `C:\Users\Ngoph\AppData\Local\Temp\Lamie_DynamicRBAC_20260805_0010.sql` thành công; lần chạy thứ hai là no-op.
- Post-migration có 18 migration-history rows, gồm legacy history entry và toàn bộ source migrations hiện tại; EF không báo migration pending.
- Database có 21 exact permission ID/code pairs, 3 roles, 46 grants, 3 user-role rows, 25 navigation rows và 0 FKs. Role totals là Administrator 21, Manager 15, Staff 10; đây là source defaults vì `Lamie` chưa có grants tùy chỉnh trước migration.
- Cả 3 users cũ được map từ legacy role `1` sang persisted role `admin`, vẫn active và còn password hash. Refresh-token count vẫn là 43.
- Dữ liệu nghiệp vụ giữ nguyên: 11 products, 9 customers, 11 orders, 11 order items và 3 channels.
- Không tìm thấy duplicate permission/role/navigation/path/sibling sort, user thiếu assignment, orphan hoặc dangling logical reference.
- API regression sau rollout pass 108/108.

## Exit criteria

Tất cả exit criteria trong master plan đã đạt, ngoại trừ lint không thể chạy vì project không có command tương ứng; đây là thiếu capability đã có từ baseline, không phải lint failure. Type-check, build và toàn bộ test suites đều pass.

Tài liệu liên quan:

- `docs/DYNAMIC_RBAC_INVENTORY.md`
- `docs/DYNAMIC_RBAC_DESIGN.md`
- `docs/DYNAMIC_RBAC_PROGRESS.md`
- `docs/ADDING_A_NEW_ADMIN_MODULE.md`
