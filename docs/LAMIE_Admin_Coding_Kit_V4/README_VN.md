# Lamie Admin — Bộ giao việc FE + BE

Bản bàn giao: 12/10/2026, dựa trên mockup mới nhất đã đơn giản hóa thanh toán và bổ sung xem nhanh / trang chi tiết / tạo đơn ưu tiên người đặt.

## Cách sử dụng

1. Giải nén thư mục này vào workspace mà Agent Coding truy cập được, ví dụ `docs/lamie-admin-handoff/`.
2. Cho Agent quyền đọc và chỉnh sửa repository FE lẫn BE. Nếu hai repo tách nhau, mở cả hai trong workspace hoặc chỉ rõ đường dẫn từng repo.
3. Copy toàn bộ nội dung `00_PROMPT_AGENT_CODING.md` vào cuộc trò chuyện của Agent.
4. Agent đọc các tệp trong thư mục; không cần bạn đính kèm lại mockup cũ hoặc site cũ.

Nếu hệ thống nhận ZIP, có thể đính kèm ZIP và yêu cầu Agent giải nén trước. Nếu không nhận ZIP, đính kèm các tệp bên trong. Tối thiểu phải có prompt, mockup, UI spec, BE spec và checklist.

## Tệp có trong gói

| Tệp | Vai trò |
|---|---|
| `00_PROMPT_AGENT_CODING.md` | Prompt đầy đủ để giao việc; bắt buộc FE trước, BE sau, rồi tích hợp |
| `mockup.html` | Giao diện tương tác độc lập mới nhất, mở bằng trình duyệt |
| `01_UI_UX_SPEC.md` | Bố cục, hành vi và phạm vi theo màn hình |
| `02_BACKEND_RULES_AND_API.md` | Dữ liệu, chuyển trạng thái, thanh toán, API/migration cần rà soát |
| `03_ACCEPTANCE_CHECKLIST.md` | Các ca nghiệm thu FE, BE và end-to-end |
| `reference/orders.fixture.json` | 15 đơn giả lập để hiểu các trường và tình huống |
| `reference/mockup-interactions.js` | JS tương tác được tách đúng từ HTML, để đọc thuận tiện |
| `MANIFEST.json` | Hash và danh sách tệp giúp đối chiếu đúng bản |

## Các điểm đã chốt

- Thanh toán hiện trên từng đơn: đã thanh toán hoặc chưa đủ + số tiền còn lại; không có menu đối soát COD riêng.
- Xem tóm tắt mở modal; xem chi tiết mở một trang riêng có route.
- Tạo đơn bắt đầu từ người đặt; người nhận để trống được.
- Đơn ship cần bổ sung người nhận trước bàn giao. Ghé lấy không phải qua bước shipper.
- Hoàn tất chỉ khi đã giao/nhận và đủ tiền.
- Dòng tiền thực tế và xác nhận thanh toán đơn không được đánh đồng.
- Sidebar giữ Lucide Animated; file HTML đã nhúng bundle và thông tin license. Tích hợp production cần dùng component/source phù hợp stack và giữ attribution.

## Phạm vi bàn giao

Đây là prompt + đặc tả + prototype, chưa phải code production FE/BE. Không có quyền truy cập repo của bạn trong gói này, không có credentials hay môi trường production. Không áp đặt React/.NET/SQL Server hoặc framework cụ thể: Agent phải đọc dự án thực tế.

Prototype dùng localStorage và đồng hồ cố định 12/10/2026 10:30 để minh họa các nhóm. Các thao tác tiền chỉ là giả lập. Agent phải thay bằng API và clock thật, mở rộng validation/concurrency theo spec.

Đã kiểm tra logic prototype cho tạo đơn người nhận trống, modal/page, hiển thị tiền còn lại, xác nhận thanh toán, ghé lấy, chặn bàn giao khi thiếu người nhận, lọc và lưu dữ liệu. Chưa có kiểm tra trực quan bằng browser trong môi trường tạo gói; Agent cần làm kiểm tra này trên ứng dụng thực tế.
