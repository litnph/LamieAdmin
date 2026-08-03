# FE Admin - API synchronization implementation plan

This plan is based on `FE_API_SYNC_AUDIT.md` and was created before implementation changes.

## Phase 1 - Critical contract fixes

| ID | Severity | Module | FE change | API change | Contract after change | DB impact | Compatibility | Tests | Risk/dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | Critical | Products | keep item-route update client | add `PUT /api/settings/products/{id}` while retaining collection PUT; reject route/form id conflict | multipart update accepts identity from route; 204 stays unchanged | No | old collection route remains | controller/handler or contract tests | Low; requires careful binding |
| TASK-002 | Critical | Products | submit full existing form shape | synchronize scalar, translations, relation ids, thumbnail and images | submitted aggregate becomes the persisted aggregate | No | existing request fields gain intended behavior | domain/handler tests | Medium; EF collection tracking |

Security/Auth is Critical but cannot be implemented responsibly in this phase because no identity model, token configuration, credential policy, claim contract or user schema exists. It remains explicitly blocked rather than receiving a fake implementation.

## Phase 2 - High-priority business flow

| ID | Severity | Module | FE change | API change | Contract after change | DB impact | Compatibility | Tests | Risk/dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-003 | High | Products | omit blank sale price; require positive price; validate sale price below price | align create/update validation | `SalePrice` is absent/null when unused | No | accepts existing valid payloads | FE type/build plus validator tests | Low |
| TASK-004 | High | Products | no visual redesign | add update thumbnail-file support and make empty image list deactivate existing images | multipart fields match create/edit form | No | additive | handler tests with fake storage | Medium; file cleanup order |
| TASK-005 | High | Validation | consume standard field errors already supported | register existing FluentValidation validators through MediatR behavior | invalid product commands return 400 standard envelope | No | error responses become more deterministic | behavior/validator tests | Low |

Orders, Channels, Dashboard and Customers require new domain/schema/business decisions. They are not implementable from current evidence and remain follow-up work.

## Phase 3 - Data consistency

| ID | Severity | Module | FE change | API change | Contract after change | DB impact | Compatibility | Tests | Risk/dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-006 | High | Categories | add/read/edit `sortOrder` only for category | none required | category requests preserve explicit order | No | additive FE field | type/build and request-shape test if FE test tooling exists | Low |
| TASK-007 | Medium | Products | align DTO optionality | remove nullable initialization warning in unused DTO without changing JSON contract | clean nullable build | No | no runtime change | build | Low |

## Phase 4 - UX integration

| ID | Severity | Module | FE change | API change | Contract after change | DB impact | Compatibility | Tests | Risk/dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-008 | Medium | Product form | map API field errors into existing error state where feasible; keep current loading/success flow | preserve standard error envelope | validation is actionable and does not rely on console output | No | additive | type/build | Low |

No new query, form or UI dependency will be added.

## Phase 5 - Tests and cleanup

| ID | Severity | Module | FE change | API change | Contract after change | DB impact | Compatibility | Tests | Risk/dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TASK-009 | High | Tests | use existing typecheck/build because no FE test runner exists | add a focused .NET unit test project for product domain/validator/update behavior if restore permits | regressions are executable | No | no product runtime impact | `dotnet test` | New test-only packages may be needed |
| TASK-010 | Medium | Verification | npm restore, typecheck, build; report unavailable lint/test scripts honestly | restore, build, test, format verification, migration model validation | all runnable gates reported exactly | No | none | all commands | LocalDB may block runtime integration |
| TASK-011 | Medium | Documentation | finalize matrix and before/after states | document blocked APIs and security decisions | audit is reviewable | No | none | diff review | None |

## Explicitly blocked follow-up work

| Follow-up | Required input before implementation |
| --- | --- |
| Auth/JWT/refresh/logout | identity provider or user schema, issuer/audience/key management, expiry and revocation rules, cookie vs localStorage decision |
| User administration | user entity/schema, uniqueness rules, role/claim matrix, password policy and audit requirements |
| Orders | entity/schema, code generation, state transition matrix, cancellation policy, price snapshot rules and concurrency behavior |
| Channels | identifier type, uniqueness, deletion/reference policy and authorization |
| Dashboard | server aggregation vs client aggregation decision and KPI definitions |
| Customers | customer identity definition, order linkage, notes ownership and spend definition |
| File policy | accepted image formats, byte limit, image validation/scanning and public-serving policy |
| Promotions | FE UX, route, permission, DTO, date/time and applicability rules |

Blocked work will not be represented by placeholders or speculative endpoint implementations.
