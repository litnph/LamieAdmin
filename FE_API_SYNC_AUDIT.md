# FE Admin - API .NET Core synchronization audit (pre-fix)

Audit date: 2026-07-27  
Frontend: `D:\Git\Lamie\Admin\Admin_Lamie`  
Backend: `D:\Git\Lamie\Admin\LamieApi`

This document records the source state before the synchronization fixes in `FE_API_SYNC_PLAN.md` are applied. Runtime behavior that requires a database, credentials, or an unavailable endpoint is explicitly identified as unverified.

## A. Overview

### System map

```text
Admin_Lamie/
  package.json                         React/Vite commands and dependencies
  .env                                 VITE_API_BASE_URL, VITE_SKIP_AUTH
  src/app/router/                      route guards and admin routes
  src/services/                        Axios client, token storage, refresh interceptor
  src/features/auth/                   login/session contract
  src/features/dashboard/              client-side order/product aggregation
  src/features/product/                product CRUD and multipart forms
  src/features/orders/                 order CRUD, transitions, calendar and map
  src/features/customers/              client-side customer projection from orders
  src/features/settings/attributes/    seven master-data resources
  src/features/settings/channels/      sales-channel CRUD
  src/features/users/                  admin-only user CRUD

LamieApi/
  Lamie.sln                            .NET 8 solution
  Lamie.API/Program.cs                 HTTP pipeline, DI, CORS, Swagger, storage
  Lamie.API/Controllers/Settings/      product and attribute controllers
  Lamie.API/Middlewares/               JSON error envelope
  Lamie.Application/Settings/          MediatR commands, queries, DTOs, validators
  Lamie.Domain/Entities/               product and master-data aggregates
  Lamie.Infrastructure/Persistence/    EF Core SQL Server repositories/migrations
  Lamie.Infrastructure/Storage/        local public-file storage
```

### Frontend architecture

- React 19, TypeScript 5.8, Vite 6, React Router 7.
- Axios singleton in `src/services/apiClient.ts`; no query/cache library and no form library.
- API base URL comes from `VITE_API_BASE_URL`, with `https://lamieapi.onrender.com` as fallback.
- Bearer access and refresh tokens are stored in `localStorage`. A response interceptor performs one refresh and retries a failed 401 request once.
- Route guards use the current-user contract and numeric roles: Admin `1`, Manager `2`, Staff `3`.
- API DTOs are handwritten. Dashboard and Customer data are projections assembled in the browser from Orders and Products.
- Error rendering understands `{ message }` and `{ errors: Record<string,string[]> }`, which is compatible with the backend error envelope where that backend exists.

### Backend architecture

- .NET 8, controllers, MediatR/CQRS-style handlers, domain aggregates, repositories and EF Core SQL Server.
- Swagger is enabled only in Development.
- JSON uses ASP.NET Core web defaults, including camelCase output.
- Error middleware returns `{ success, code, message, errors? }` for known errors and a sanitized 500 response.
- No authentication scheme is registered, `UseAuthentication()` is absent, and no controller/action has `[Authorize]`.
- CORS currently allows every origin, method and header.
- Product and master-data persistence exists. There are no User, Auth, Order, Channel, Customer, Dashboard or Promotion domain models/endpoints in this backend source.
- FluentValidation classes exist for product create/update, but no validation pipeline or validator registration exists in the pre-fix source.
- There is no test project in the solution.

### Counts

Counts below use unique active FE method/route requirements. Dashboard and Customers reuse Orders/Products and therefore do not inflate the endpoint count.

| Metric | Count | Notes |
| --- | ---: | --- |
| Active FE endpoint requirements | 65 | 5 Auth, 6 Users, 9 Orders, 5 Channels, 35 Attributes, 5 Products |
| Dormant/legacy FE call definitions | 12 | 10 legacy master-data calls, 1 unused standalone upload, 1 unused JSON product-create variant |
| Backend endpoints | 40 | 35 Attributes and 5 Products |
| MATCHED | 33 | 30 non-category attribute endpoints and 3 product read/delete endpoints |
| PARTIALLY_MATCHED | 7 | 5 category endpoints plus product create/update |
| MISSING_API | 25 | Auth, Users, Orders and Channels |
| UNUSED_API | 1 | Collection-route Product PUT has no exact active FE caller; it is retained as the existing compatibility route |
| BROKEN_FLOW | 7 | Authentication, Products, Orders, Dashboard, Customers, Channels and Users |

## B. Frontend API requirements

Common behavior for all active calls: Axios, JSON unless noted, Bearer token except login/refresh, and the shared JSON error reader. The backend currently provides no permission contract, while FE hides User management from non-Admin users and some settings/product actions from Staff.

### Authentication and users

| Module | FE file | Method and route | Request | Response used by UI | Auth/permission |
| --- | --- | --- | --- | --- | --- |
| Auth | `src/features/auth/api/authApi.ts` | POST `/api/auth/login` | `{ login, password }` | `user`, access/refresh tokens and both expiry timestamps | Anonymous |
| Auth | same | POST `/api/auth/refresh` | `{ refreshToken }` | same `AuthResult` | Refresh token |
| Auth | same | GET `/api/auth/me` | none | user identity, role and active state | Bearer |
| Auth | same | POST `/api/auth/logout` | `{ refreshToken }` | no body | Bearer |
| Auth | same | POST `/api/auth/change-password` | current/new password | no body | Bearer |
| Users | `src/features/users/api/usersApi.ts` | GET `/api/users` | none | full user list | Admin route |
| Users | same | GET `/api/users/{id}` | string id | `AuthUser` | Admin route |
| Users | same | POST `/api/users` | email, username, password, name, phone, role, active | created `AuthUser` | Admin route |
| Users | same | PUT `/api/users/{id}` | id, name, phone, role, active | no body | Admin route |
| Users | same | DELETE `/api/users/{id}` | string id | no body | Admin route |
| Users | same | PATCH `/api/users/{id}/reset-password` | `{ newPassword }` | no body | Admin route |

### Orders, dashboard and customers

| Module | FE file | Method and route | Request/query | Response fields actually used | Auth/permission |
| --- | --- | --- | --- | --- | --- |
| Orders | `src/features/orders/api/ordersApi.ts` | GET `/api/orders` | status, payment, channel, delivery/created ranges, phone, search, page, pageSize | paged items plus totalCount/page/pageSize/totalPages/hasNext/hasPrevious | Bearer |
| Orders | same | GET `/api/orders/{id}` | string id | list fields plus coordinates, notes, items, images, changeLogs | Bearer |
| Orders | same | POST `/api/orders` | multipart order fields, indexed items and image files | full order detail | Bearer |
| Orders | same | PUT `/api/orders/{id}` | JSON order fields and items | full order detail | Bearer |
| Orders | same | PATCH `/api/orders/{id}/status` | numeric `OrderStatus` | no body | Bearer; UI transition rules |
| Orders | same | PATCH `/api/orders/{id}/payment-status` | numeric `PaymentStatus` | no body | Bearer |
| Orders | same | DELETE `/api/orders/{id}` | string id | no body | Bearer |
| Orders | same | GET `/api/orders/calendar?date=` | date string | calendar order summaries | Bearer |
| Orders | same | GET `/api/orders/calendar/locations?date=` | date string | coordinates and delivery/status fields | Bearer |
| Dashboard | `src/features/dashboard/api/dashboardApi.ts` | reuses GET `/api/orders` and GET `/api/settings/products` | repeated 100-row pages and date/status filters | revenue, counts, delivery risk and low stock are calculated in browser | Bearer |
| Customers | `src/features/customers/api/customersApi.ts` | reuses GET `/api/orders` and GET `/api/orders/{id}` | fetches all order pages; filters/paginates locally | customer identity, spend, addresses and notes derived from orders | Bearer |

Pagination is one-based in FE (`page=1`). Customer and Dashboard fan out over all result pages. If the server ignores filters or uses zero-based paging, totals and charts become incorrect.

### Settings attributes

All seven resources use the collection route `GET`, `POST`, `PUT` and item `GET`, `DELETE`. Languages use string `{code}`; the other resources use integer `{id}`.

| Resource | GET collection | GET item | POST | PUT | DELETE | FE request/response shape |
| --- | --- | --- | --- | --- | --- | --- |
| languages | `/api/settings/attributes/languages` | `.../languages/{code}` | collection | collection | item | `{ code, name, isActive }` |
| categories | `/api/settings/attributes/categories` | `.../categories/{id}` | collection | collection | item | `{ id?, isActive, translations[] }`; no `sortOrder` |
| collections | `/api/settings/attributes/collections` | `.../collections/{id}` | collection | collection | item | `{ id?, isActive, translations[] }` |
| colors | `/api/settings/attributes/colors` | `.../colors/{id}` | collection | collection | item | base fields plus `hexCode`, `rgbCode` |
| occasions | `/api/settings/attributes/occasions` | `.../occasions/{id}` | collection | collection | item | `{ id?, isActive, translations[] }` |
| styles | `/api/settings/attributes/styles` | `.../styles/{id}` | collection | collection | item | `{ id?, isActive, translations[] }` |
| tags | `/api/settings/attributes/tags` | `.../tags/{id}` | collection | collection | item | `{ id?, isActive, translations[] }` |

Every translation uses `{ languageCode, name, description? }`. List parsing accepts a raw array, `{ items }`, or `{ data }`; item parsing expects the DTO directly. The Attributes screen reads `id`, `isActive`, translations and Color values. Product screens additionally read attribute ids and translated names.

### Products and channels

| Module | FE file | Method and route | Request | Response used by UI | Auth/permission |
| --- | --- | --- | --- | --- | --- |
| Products | `src/features/product/api/productApi.ts` | GET `/api/settings/products` | none | complete product DTO list | Bearer |
| Products | same | GET `/api/settings/products/{id}` | int id | scalar, translations, images and all relation ids | Bearer |
| Products | same | POST `/api/settings/products` | multipart scalar, thumbnail, translations, images, relation ids | FE ignores `{ id }` and navigates to list | Manager/Admin UI action |
| Products | same | PUT `/api/settings/products/{id}` | same multipart shape, existing image ids | no body | Manager/Admin UI action |
| Products | same | DELETE `/api/settings/products/{id}` | int id | no body | Manager/Admin UI action |
| Channels | `src/features/settings/channels/api/channelsApi.ts` | GET `/api/settings/attributes/channels` | none | array of id/code/name/iconUrl/isActive/sortOrder | Bearer |
| Channels | same | GET `/api/settings/attributes/channels/{id}` | string id | channel DTO | Bearer |
| Channels | same | POST `/api/settings/attributes/channels` | code/name/icon/sort/active | `{ id }` | Manager/Admin UI action |
| Channels | same | PUT `/api/settings/attributes/channels` | id/name/icon/sort/active | no body | Manager/Admin UI action |
| Channels | same | DELETE `/api/settings/attributes/channels/{id}` | string id | no body | Manager/Admin UI action |

### Dormant and legacy definitions

These calls are in source but not reachable from the active router/current UI call graph:

- `src/features/masterdata/api/masterdataApi.ts`: four `/api/system/languages` operations, four `/api/masterdata/tags` operations, GET `/api/masterdata/colors`, GET `/api/masterdata/categories`.
- `ProductApi.create()` JSON variant for an endpoint that only consumes multipart.
- `UploadApi.uploadImage()` at POST `/api/settings/uploads/images`; no active caller exists.

They are reported, not deleted.

## C. Backend endpoint inventory

All backend endpoints are anonymous in the pre-fix source. Attribute POST returns 201 with `{ id }` or `{ code }`; Product POST returns 201 with `{ id }`; PUT/DELETE return 204; GET returns 200. Known errors use 400/404/409 envelopes. No 401/403 can be produced by framework authorization because authentication/authorization is not configured.

| Module | Backend file | Method and route | Request | Response | Validation/test coverage |
| --- | --- | --- | --- | --- | --- |
| Languages | `LanguagesController.cs` | GET `/api/settings/attributes/languages` | none | `LanguageDto[]` | handler validation; no tests |
| Languages | same | GET `/api/settings/attributes/languages/{code}` | code | `LanguageDto` | 404 handler; no tests |
| Languages | same | POST `/api/settings/attributes/languages` | create command | 201 `{ code }` | handler validation; no tests |
| Languages | same | PUT `/api/settings/attributes/languages` | update command | 204 | handler validation; no tests |
| Languages | same | DELETE `/api/settings/attributes/languages/{code}` | code | 204 | domain/reference behavior; no tests |
| Categories | `CategoriesController.cs` | GET `/api/settings/attributes/categories` | none | DTO array including `sortOrder` | no tests |
| Categories | same | GET `/api/settings/attributes/categories/{id}` | int id | DTO | 404 handler; no tests |
| Categories | same | POST `/api/settings/attributes/categories` | `sortOrder`, active, translations | 201 `{ id }` | translation validation; no tests |
| Categories | same | PUT `/api/settings/attributes/categories` | id, `sortOrder`, active, translations | 204 | translation validation; no tests |
| Categories | same | DELETE `/api/settings/attributes/categories/{id}` | int id | 204 | no tests |
| Collections | `CollectionsController.cs` | GET collection | none | DTO array | no tests |
| Collections | same | GET item `{id}` | int id | DTO | 404 handler; no tests |
| Collections | same | POST collection | active, translations | 201 `{ id }` | translation validation; no tests |
| Collections | same | PUT collection | id, active, translations | 204 | translation validation; no tests |
| Collections | same | DELETE item `{id}` | int id | 204 | no tests |
| Colors | `ColorsController.cs` | GET collection | none | DTO array | no tests |
| Colors | same | GET item `{id}` | int id | DTO | 404 handler; no tests |
| Colors | same | POST collection | active, hex/rgb, translations | 201 `{ id }` | handler validation; no tests |
| Colors | same | PUT collection | id, active, hex/rgb, translations | 204 | handler validation; no tests |
| Colors | same | DELETE item `{id}` | int id | 204 | no tests |
| Occasions | `OccasionsController.cs` | GET collection | none | DTO array | no tests |
| Occasions | same | GET item `{id}` | int id | DTO | 404 handler; no tests |
| Occasions | same | POST collection | active, translations | 201 `{ id }` | translation validation; no tests |
| Occasions | same | PUT collection | id, active, translations | 204 | translation validation; no tests |
| Occasions | same | DELETE item `{id}` | int id | 204 | no tests |
| Styles | `StylesController.cs` | GET collection | none | DTO array | no tests |
| Styles | same | GET item `{id}` | int id | DTO | 404 handler; no tests |
| Styles | same | POST collection | active, translations | 201 `{ id }` | translation validation; no tests |
| Styles | same | PUT collection | id, active, translations | 204 | translation validation; no tests |
| Styles | same | DELETE item `{id}` | int id | 204 | no tests |
| Tags | `TagsController.cs` | GET collection | none | DTO array | no tests |
| Tags | same | GET item `{id}` | int id | DTO | 404 handler; no tests |
| Tags | same | POST collection | active, translations | 201 `{ id }` | translation validation; no tests |
| Tags | same | PUT collection | id, active, translations | 204 | translation validation; no tests |
| Tags | same | DELETE item `{id}` | int id | 204 | no tests |
| Products | `ProductController.cs` | GET `/api/settings/products` | none | `ProductDetailsDto[]` | no paging/filter; no tests |
| Products | same | GET `/api/settings/products/{id}` | int id | `ProductDetailsDto` | 404 handler; no tests |
| Products | same | POST `/api/settings/products` | multipart create command | 201 `{ id }` | validator exists but is not executed; no tests |
| Products | same | PUT `/api/settings/products` | multipart update command with form `Id` | 204 | validator exists but is not executed; no tests |
| Products | same | DELETE `/api/settings/products/{id}` | int id | 204 | hard delete plus local file cleanup behavior; no tests |

## D. Contract matrix

| Module | FE requirement | Backend endpoint | Status | Issue | Severity |
| --- | --- | --- | --- | --- | --- |
| Auth | 5 session endpoints | none | MISSING_API | Login, refresh, current user, logout and password change cannot run | Critical |
| Users | 6 admin endpoints | none | MISSING_API | Admin user management cannot run; no backend role enforcement exists | Critical |
| Orders | 9 order endpoints | none | MISSING_API | CRUD, state transitions, calendar and delivery map cannot run | Critical |
| Dashboard | order/product aggregation | Products only | BROKEN_FLOW | Order-derived KPIs fail; inventory alone may load | High |
| Customers | order-derived projection | none for Orders | BROKEN_FLOW | Customer list/detail and note fan-out fail | High |
| Channels | 5 channel endpoints | none | MISSING_API | Channel settings and order editor channel lookup fail | High |
| Attributes: languages | 5 operations | 5 matching operations | MATCHED | Route/body/response are compatible | Low |
| Attributes: categories | 5 operations | 5 route matches | PARTIALLY_MATCHED | FE omits `sortOrder`; update binds default zero and can lose existing order | High |
| Attributes: collections | 5 operations | 5 matching operations | MATCHED | Compatible | Low |
| Attributes: colors | 5 operations | 5 matching operations | MATCHED | Compatible | Low |
| Attributes: occasions | 5 operations | 5 matching operations | MATCHED | Compatible | Low |
| Attributes: styles | 5 operations | 5 matching operations | MATCHED | Compatible | Low |
| Attributes: tags | 5 operations | 5 matching operations | MATCHED | Compatible | Low |
| Products: list/detail/delete | 3 operations | matching operations | MATCHED | DTO fields used by UI are present | Low |
| Products: create | multipart POST | multipart POST | PARTIALLY_MATCHED | FE sends blank sale price as `0`; FE permits price zero; validators are inactive | High |
| Products: update | PUT `/{id}` multipart | PUT collection multipart | PARTIALLY_MATCHED / BROKEN_FLOW | route and id differ; thumbnail file ignored; translations and all many-to-many sets ignored; removing all images is ignored | Critical |
| Upload client | standalone image upload | none | MISSING_API, dormant | No active caller; do not implement without a defined workflow | Low |
| Legacy master-data | old `/api/system` and `/api/masterdata` routes | none | MISSING_API, dormant | Active router redirects to the new settings screens | Low |

## E. Detailed findings

### SYNC-001 - Backend administration endpoints are public

- Module: Security.
- FE files: route guards, auth context and API interceptor.
- Backend files: `Program.cs` and all controllers.
- Reproduction: inspect service registration/middleware and controller attributes; authentication registration, `UseAuthentication()` and `[Authorize]` are absent.
- Expected: backend is the final authorization boundary for product/settings mutations.
- Actual: anyone who can reach the API can read, create, update or delete backend data.
- Root cause: the backend source does not contain an identity/auth domain or authentication configuration.
- Impact/severity: unauthorized data mutation, Critical.
- Recommended owner: API, but requires an agreed identity/JWT contract and user persistence design.
- Compatibility/risk: adding authorization immediately would break every current client because the corresponding token issuer does not exist in this source.
- Current task decision: blocked; do not invent credentials, claims or roles.

### SYNC-002 - FE Auth and Users have no backend implementation

- Module: Authentication/Users.
- FE files: `authApi.ts`, `usersApi.ts`, `AuthContext.tsx`.
- Backend endpoint: none.
- Reproduction: run without `VITE_SKIP_AUTH=true`; login calls a route not mapped by the API.
- Expected: login -> token storage -> current user -> refresh/retry -> logout, with Admin user CRUD.
- Actual: first login request returns 404.
- Root cause: missing domain, persistence and endpoints.
- Impact/severity: application entry is blocked unless the development bypass is enabled, Critical.
- Recommended owner: API plus contract tests; FE contract is internally coherent but cannot be confirmed as business truth.
- Current task decision: blocked by undefined security/business contract.

### SYNC-003 - Order-dependent modules have no backend implementation

- Module: Orders, Dashboard, Customers, Channels.
- FE files: `ordersApi.ts`, `dashboardApi.ts`, `customersApi.ts`, `channelsApi.ts` and their pages.
- Backend endpoint: none.
- Expected: paged/searchable orders, state/payment transitions, calendar/map, channels and order details.
- Actual: all `/api/orders*` and channel calls return 404.
- Root cause: backend contains no order/channel/customer entities or schema.
- Impact/severity: most daily administration workflows are unavailable, Critical.
- Recommended owner: API after state transition, pagination, timezone and channel-id contracts are approved.
- Current task decision: blocked; creating these domains would invent business rules and require a large schema expansion.

### SYNC-004 - Product update route and identity do not match

- Module: Products.
- FE file: `productApi.ts`, `ProductCreatePage.tsx` edit mode.
- Backend file: `ProductController.cs`.
- Endpoint: FE `PUT /api/settings/products/{id}`; API `PUT /api/settings/products` with form `Id`.
- Reproduction: submit the edit screen; FE does not append `Id` to FormData and no backend route matches the URL.
- Expected: 204 and refreshed list/detail data.
- Actual: route rejection (typically 405) before the handler.
- Root cause: incompatible route conventions.
- Impact/severity: all product edits fail, Critical.
- Proposed fix: add a backward-compatible item-route action that applies route id to the command while retaining the collection PUT.
- Risk: low if route/form id mismatch is rejected explicitly.

### SYNC-005 - Product update drops edited data

- Module: Products.
- FE file: `ProductCreatePage.tsx`.
- Backend files: `UpdateProductCommand.cs`, `UpdateProductHandler.cs`, `Product.cs`.
- Expected: scalar, thumbnail, translations, relation ids and image list all reflect submitted form state.
- Actual: thumbnail file has no command property; translations and relation ids are ignored; an empty image list leaves all existing images active.
- Root cause: incomplete update handler and missing aggregate synchronization methods.
- Impact/severity: silent stale data and misleading success, Critical.
- Proposed fix: synchronize the complete aggregate using domain methods; support thumbnail file and empty-list removal; delete replaced local files only after a successful persistence operation.
- Database impact: none.
- Compatibility: existing fields gain their intended behavior; response/status remain unchanged.

### SYNC-006 - Optional sale price is serialized as invalid zero

- Module: Products.
- FE file: `ProductCreatePage.tsx`.
- Backend files: product validators/domain.
- Reproduction: leave sale price blank and submit; FormData contains `SalePrice=0`.
- Expected: missing optional field binds to `null`.
- Actual: domain receives zero and rejects it.
- Root cause: unconditional FE serialization.
- Impact/severity: create/update can fail for a normal no-sale product, High.
- Proposed fix: append `SalePrice` only when greater than zero and add cross-field validation.

### SYNC-007 - Product validators are not executed

- Module: Products/validation.
- Backend files: validators and `Program.cs`.
- Reproduction: source inspection shows no validator registration or MediatR validation behavior.
- Expected: invalid requests return the standard field-error envelope before handlers/domain/storage work.
- Actual: validator rules are dead code; failures vary between domain exceptions and persistence failures.
- Impact/severity: inconsistent errors and avoidable runtime work, High.
- Proposed fix: register existing validators and a generic MediatR validation behavior without adding a dependency.

### SYNC-008 - Category sort order can be overwritten with zero

- Module: Attributes/Categories.
- FE files: attribute DTO/types and Attributes page.
- Backend files: category commands/DTO.
- Reproduction: edit a category whose backend `sortOrder` is nonzero; FE neither reads nor sends that field.
- Expected: editing name/active state preserves sort order, or UI exposes it.
- Actual: record model binding supplies zero and handler updates it.
- Impact/severity: unintended ordering loss, High.
- Proposed fix: add `sortOrder` to the category FE DTO/draft and preserve/edit it explicitly.

### SYNC-009 - Product file upload lacks size/type validation

- Module: File upload.
- Backend files: product validators/handlers and local storage.
- Expected: only configured image types and bounded sizes are accepted.
- Actual: any readable upload content and size is persisted using a sanitized file name.
- Impact/severity: disk exhaustion and unsafe content served from the API origin, High.
- Proposed fix: validate extension, MIME type and maximum size in existing validators; retain path traversal protection already present in storage.
- Assumption: no product-specific upload policy is documented. A conservative image-only policy must be confirmed before enforcement to avoid rejecting legitimate formats.

### SYNC-010 - Date/time and paging contracts cannot be verified

- Module: Orders/Dashboard/Customers.
- FE files: order types, dashboard/customer aggregators.
- Expected: one-based paging, ISO 8601 timestamps with unambiguous offset/UTC semantics, server-side filters.
- Actual: there is no backend implementation to inspect.
- Impact/severity: potential wrong dates, page fan-out and business totals once an API is added, High.
- Current task decision: document as an assumption, not a fact.

## F. End-to-end flow status

| Flow | First broken step | Status |
| --- | --- | --- |
| Login/session | POST login has no backend route | Blocked |
| Create product | optional sale price becomes invalid zero; validators inactive | Fixable in current source |
| Edit product | PUT route mismatch before handler; handler then ignores much of form | Fixable in current source |
| Process order | list/detail endpoints do not exist | Blocked by missing domain/schema |
| Dashboard | first order queries do not exist; inventory can still load independently | Partially available |
| Customers | fetch-all-orders call does not exist | Blocked |
| Attributes | category ordering can be lost; other resources are compatible | Mostly available |
| Channels | first list call does not exist | Blocked |
| Users | first list/detail/create call does not exist | Blocked |
| Promotions | no FE module and no backend module | Outside current implemented scope |

## G. Assumptions and unverified items

- The checked-out backend is the intended API for this FE. No other service/repository containing Auth, Orders, Users or Channels was found under `D:\Git\Lamie\Admin`.
- The actual value of `VITE_SKIP_AUTH` is intentionally not recorded. If it is true, it only bypasses FE guards; it does not secure backend endpoints.
- No database-backed integration run was performed before fixes. LocalDB availability and seed data are not established by repository documentation.
- No OpenAPI document was generated before fixes; Swagger configuration exists, but code remains the primary evidence.
- Order enum values, status transitions, paging base and timezone semantics cannot be validated without backend domain code or documentation.
- Customer identity by normalized phone and paid-spend calculation are FE-derived behavior, not confirmed business rules.
- The backend currently returns debug exception detail in Debug builds. Production behavior is sanitized.
- The two npm High advisories are pre-existing and relate to the dependency graph; they are not silently force-upgraded in this synchronization task.

## H. Pre-fix verification baseline

```text
Command: npm ci
Result: PASS; 212 packages installed, npm reported 2 High advisories.

Command: npm run typecheck
Result: PASS.

Command: npm run build
Result: PASS; 1,950 modules transformed.

Command: dotnet restore Lamie.sln
Result: PASS.

Command: dotnet build Lamie.sln --no-restore
Result: PASS with one CS8618 warning in ProductDto.Sku.

Command: dotnet test Lamie.sln --no-restore
Result: exit 0, but no test project exists and no tests ran.
```
