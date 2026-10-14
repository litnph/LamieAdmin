# Gói triển khai giao diện Lamie Admin V1.2

Gói này chứa prompt, đặc tả nghiệp vụ và toàn bộ mockup mới nhất. Đây là tài liệu thiết kế để sửa project hiện có; gói không chứa mã nguồn admin thật.

## Cách dùng

1. Mở repository admin hiện tại trong công cụ AI Coding, hoặc cung cấp ZIP source nếu công cụ chưa truy cập được repository.
2. Giải nén gói này vào một thư mục tài liệu, ví dụ `docs/design/lamie/`. Giữ nguyên cấu trúc thư mục bên trong.
3. Gửi nội dung `LAMIE_Admin_Coding_Prompt.md` cho AI, hoặc yêu cầu AI đọc và thực hiện file đó. Chỉ rõ vị trí repository và thư mục đã giải nén.
4. AI cần đọc source, mở mockup và sửa ứng dụng thật theo prompt. Mockup V1.2 là chuẩn hình ảnh; brief gốc là tài liệu nghiệp vụ, có mô tả một số bố cục cũ.

Tin nhắn mở đầu có thể dùng:

> Hãy đọc `LAMIE_Admin_Coding_Prompt.md` trong thư mục tài liệu tôi cung cấp và thực hiện đầy đủ trên repository admin đang mở. Dùng mockup V1.2 làm chuẩn giao diện, đặc biệt tài khoản gọn ở đầu sidebar và Lucide Animated. Bắt đầu khảo sát source, lập kế hoạch ngắn rồi triển khai, kiểm tra và tiếp tục đến khi hoàn thành phạm vi.

## Những gì đã có trong gói

| Tệp/thư mục | Vai trò |
|---|---|
| `LAMIE_Admin_Coding_Prompt.md` | Prompt đầy đủ để giao việc |
| `ADMIN_UI_UX_MOCKUP_BRIEF.md` | Chức năng, route và nghiệp vụ hệ thống hiện có |
| `LAMIE_UI_UX/HANDOFF.md` | Quy chuẩn giao diện V1.2 |
| `LAMIE_UI_UX/LAMIE_Admin_Mockup.html` | Mockup tương tác, có CSS và chuyển động |
| `LAMIE_UI_UX/LAMIE_Admin_UI_UX.pdf` | 43 trang để đối chiếu hình ảnh |
| `LAMIE_UI_UX/screens/` | 40 ảnh artboard và manifest ánh xạ |
| `LAMIE_UI_UX/LAMIE_Admin_Overview.png` | Tổng quan các màn hình |
| `LAMIE_UI_UX/MOTION_NOTES.md` | Quy tắc Lucide Animated và ánh xạ icon |
| `LAMIE_UI_UX/motion-source/` | Component icon gốc, adapter prototype và thông tin nguồn |
| `LAMIE_UI_UX/licenses/` | Giấy phép tài nguyên |

## Bạn cần cung cấp thêm

- **Bắt buộc:** repository/mã nguồn admin hiện tại. Nếu AI đã mở đúng project trong IDE, không cần gửi lại source ZIP.
- Nếu gửi source ZIP: gồm source, assets/public, package manifest và lockfile, cấu hình framework/build/TypeScript/lint, test và README tương ứng. Bỏ `node_modules`, thư mục build/cache và file `.env` chứa khóa thật; có thể gửi `.env.example` với giá trị mẫu.
- **Khi chưa có trong repository:** tài liệu API/OpenAPI, DTO/type và hướng dẫn chạy để AI giữ đúng tích hợp; logo, font hoặc ảnh thương hiệu thật nếu muốn dùng thay placeholder.

Không cần gửi lại từng HTML/PDF/PNG nếu công cụ đọc được gói ZIP. Nếu công cụ không đọc ZIP, giải nén trước và cấp quyền đọc thư mục; nếu chỉ nhận tệp lẻ, gửi prompt + brief + HANDOFF + HTML + PDF + MOTION_NOTES, rồi cung cấp ảnh/component nguồn khi AI thực hiện module tương ứng.

## Lưu ý khi nghiệm thu

- Tài khoản phải ở đầu sidebar như V1.2, không quay về đáy theo mô tả giao diện cũ trong brief.
- Giao diện admin thật không chứa thanh chọn màn hình/trạng thái của prototype.
- Không đưa dữ liệu minh họa hoặc mock handler vào production.
- Hai trang quy chuẩn/trạng thái trong bộ mockup là tài liệu, không phải module nghiệp vụ mới.
- Các route sâu chưa có artboard riêng vẫn cần được giữ và áp dụng cùng quy chuẩn giao diện.
