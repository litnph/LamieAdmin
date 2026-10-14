# Lucide Animated — Lamie Admin V1.2

Bản HTML dùng **component gốc của Lucide Animated**, chạy bằng React và Motion. Không mô phỏng bằng animation CSS xoay toàn bộ icon. Component gốc được giữ nguyên; adapter trong `motion-source/bridge.tsx` nối chúng với prototype JavaScript hiện có.

Nguồn: https://lucide-animated.com · https://github.com/pqoqubbw/icons
Tác giả: pqoqubbw. Giấy phép MIT được giữ trong HTML, source và `licenses/`.

## Quy tắc chuyển động

- Menu chính, nút hành động, một số nút icon và danh mục màn hình: chạy khi rê chuột vào toàn bộ nút, focus bàn phím hoặc chạm.
- Khi điều hướng thay nội dung, icon của menu đang chọn chạy một lần để phản hồi thao tác.
- Mỗi lần kích hoạt tự dừng sau tối đa 1,2 giây, sau đó trả về trạng thái tĩnh. Không chạy liên tục khi để yên chuột.
- Tôn trọng `prefers-reduced-motion`, bao gồm cả khi người dùng thay đổi tùy chọn lúc đang mở mockup. Chế độ này ngăn phát hiệu ứng và phục hồi trạng thái ban đầu.
- Khi tab ẩn hoặc nút mất focus/con trỏ rời đi, hiệu ứng dừng.
- Icon trong bảng dữ liệu, badge trạng thái, hình minh họa sản phẩm và icon chưa có bản Animated giữ dạng Lucide tĩnh. Icon hoa vẫn được giữ.
- Icon trang trí có `aria-hidden`. Nhãn nút và focus visible vẫn được giữ; không thêm tab stop lên icon.

## Các icon thay tương đương

| Vị trí / tên cũ | Component nguồn Animated |
|---|---|
| Tổng quan / layout-dashboard | layout-grid |
| Đơn hàng / shopping-bag | cart |
| Lịch giao / calendar-days | calendar-days |
| Khách hàng / users | users |
| Việc cần làm / list-checks | clipboard-check |
| Kho hàng / package | boxes |
| Báo cáo / chart-no-axes-combined | chart-line |
| Chi phí / wallet | wallet |
| Nội dung / sparkles | sparkles |
| Cấu hình / settings-2 | settings |
| Người dùng / contact-round | user-round-cog |
| Vai trò / shield-check | shield-check |
| Quyền hạn / key-round | key |
| Menu / panel-left | panel-left-open |

Các component hành động có sẵn: plus, check, search, download, upload, circle-check, arrow-right, menu, palette và truck. Chỉ thay ở vùng tương tác được chọn; tên icon cũ vẫn dùng cho dữ liệu tĩnh và fallback.

## Xem và bàn giao

Mở `LAMIE_Admin_Mockup.html`; dùng menu như bình thường hoặc chọn màn hình **Hệ thống thiết kế → Icon & chuyển động** để thử các mẫu. File đã nhúng font, icon và runtime, không tải tài nguyên qua mạng.

`LAMIE_Admin_UI_UX.pdf`, overview và các ảnh `screens/` là snapshot V1.2 với tài khoản gọn ở đầu sidebar và icon mới ở trạng thái tĩnh. Dùng HTML làm bản tham chiếu cho chuyển động.

Source TSX gốc nằm trong `motion-source/icons/`. `sources.json` ghi URL và SHA-256 của từng file tải ngày 08/10/2026. Source SVG/path và keyframe không bị sửa. `utils.ts` là hàm ghép class name tối giản cho prototype; `bridge.tsx` bổ sung vòng đời, cổng React, các trigger và giảm chuyển động. Không cần chuyển toàn bộ app sang React chỉ để mở file HTML này.

Để build lại riêng adapter: trong `motion-source`, chạy `npm ci`, sau đó `npm run build`. Dùng `motion-bundle.js` trước script app, gọi `window.LamieMotion.enhance(root)` trước bước render Lucide tĩnh. CSS cho `.lm-motion-icon` và `.lm-motion-glyph` nằm trong HTML. Khi triển khai app React thật, có thể dùng trực tiếp các component nguồn thay vì adapter prototype. Chỉ import những icon sử dụng và giữ thông báo giấy phép tương ứng.

## Kiểm tra bản cập nhật

Đã kiểm tra chuyển động SVG thực tế khi hover/focus/touch, hiệu ứng tự dừng, giảm chuyển động, điều hướng qua 26 view, tính tổng form đơn, mở/đóng modal, bố cục 390 px, icon dữ liệu giữ tĩnh và mở HTML không phát sinh request mạng. Desktop và mobile được kiểm tra bằng ảnh render. Không thay đổi API hoặc dữ liệu thật.
