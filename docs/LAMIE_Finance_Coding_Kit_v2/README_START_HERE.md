# Lamie Finance v2 — Bộ bàn giao cho Agent Coding

## Dùng ngay
1. Giải nén toàn bộ ZIP vào một thư mục.
2. Mở `mockup.html` bằng trình duyệt để xem thiết kế; file chứa sẵn CSS, JS, font và icon.
3. Cho Agent Coding quyền đọc repository admin hiện tại và toàn bộ thư mục đã giải nén.
4. Copy toàn bộ nội dung `PROMPT_AGENT_CODING.md` vào Agent Coding và yêu cầu thực hiện.

Nếu Agent hỗ trợ đọc ZIP, có thể đính kèm ZIP trực tiếp. Nếu không, giải nén và thêm thư mục vào workspace của Agent. Link riêng tư không thay thế file đính kèm.

## Các file
| File/thư mục | Vai trò |
|---|---|
| `PROMPT_AGENT_CODING.md` | Prompt triển khai đầy đủ, copy vào Agent |
| `mockup.html` | Bản xem trước tự chứa, mở offline |
| `mockup-source/` | HTML/CSS/JS/font/icon của bản đã duyệt; có thể mở index.html trực tiếp |
| `BUSINESS_RULES.md` | Quy tắc doanh thu, dòng tiền, kiểm kê, lợi nhuận, chứng từ |
| `ACCEPTANCE_CHECKLIST.md` | Các điều kiện và ca kiểm tra khi triển khai |
| `fixtures/finance-demo.json` | 64 đơn và tổng kỳ mẫu để đối soát; chỉ dùng dev/test |
| `lucide-animated-source/` | Component icon nguồn, adapter tham chiếu và giấy phép |
| `PROVENANCE.json` | Phiên bản nguồn và phạm vi kiểm tra |
| `SHA256SUMS.txt` | Hash các file trong bộ bàn giao |

**Agent phải đọc cả `visuals.js` và `visuals.css`:** đây là phần thiết kế doanh thu theo ngày và biểu đồ mới nhất, ghi đè một số phần của prototype nền. Khi đưa vào sản phẩm hãy tách component/module đúng stack, không giữ cấu trúc hàm override của bản demo.

## Cần cung cấp thêm từ dự án của bạn
- Repository hiện tại hoặc source frontend của admin; backend liên quan nếu Agent cần bổ sung báo cáo/API.
- Schema/migration, DTO và API đơn hàng, các lần thanh toán, chi phí, nguyên liệu, tồn kho hiện có.
- Quy ước dự án và lệnh chạy/build/test. Nếu Agent đã làm trong repository đó thì không cần gửi lại.
- Dữ liệu mẫu đã ẩn thông tin nhạy cảm nếu cần đối chiếu mapping thực tế.

Không gửi file `.env`, mật khẩu, token, khóa dịch vụ hoặc dữ liệu khách hàng thật.

## Giới hạn có chủ đích
- Demo tháng 09/2026, chưa kết nối dữ liệu thật; trạng thái lưu trên trình duyệt.
- Không tự kê khai thuế, không có upload chứng từ thật, chưa phân bổ lợi nhuận theo từng đơn/ngày.
- App thật phải hỗ trợ các kỳ dữ liệu thực và các giao dịch thanh toán độc lập, không copy cách mô phỏng.
- Bộ này xuất từ đúng mã nguồn bản mockup đã duyệt; không thay đổi website đang xem.
- Nguồn xem online: https://lamie-finance-preview.easycrumb5.chatgpt.site
