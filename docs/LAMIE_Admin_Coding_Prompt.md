# Triển khai lại giao diện Lamie Admin theo mockup V1.2

Bạn là kỹ sư frontend phụ trách cải tạo giao diện trên mã nguồn Lamie Admin hiện có. Hãy trực tiếp sửa code, chạy ứng dụng và hoàn thiện giao diện theo bộ mockup được cung cấp, đồng thời bảo toàn nghiệp vụ, dữ liệu, quyền và kết nối API hiện tại.

Đây là yêu cầu triển khai trong project thật. Hãy đọc tài liệu, lập kế hoạch ngắn rồi thực hiện đến khi hoàn thành phạm vi; không chỉ trả về phân tích, component mẫu hoặc một dashboard độc lập.

## 1. Đọc tài liệu và xác định nguồn chuẩn

Trong thư mục tài liệu được đính kèm hoặc giải nén, hãy đọc:

- `ADMIN_UI_UX_MOCKUP_BRIEF.md`: danh sách route, chức năng, trạng thái và nghiệp vụ của hệ thống hiện có.
- `LAMIE_UI_UX/HANDOFF.md`: quy chuẩn giao diện mới và phạm vi mockup V1.2.
- `LAMIE_UI_UX/LAMIE_Admin_Mockup.html`: tham chiếu chính cho bố cục, CSS, responsive và tương tác minh họa. Mở bằng trình duyệt nếu môi trường hỗ trợ, chuyển các màn hình và trạng thái để quan sát.
- `LAMIE_UI_UX/LAMIE_Admin_UI_UX.pdf`, `LAMIE_UI_UX/screens/`, `LAMIE_UI_UX/screens/manifest.json`: đối chiếu hình ảnh, route và trạng thái từng artboard.
- `LAMIE_UI_UX/MOTION_NOTES.md`, `LAMIE_UI_UX/motion-source/icons/`, `LAMIE_UI_UX/licenses/`: quy tắc, component nguồn và giấy phép icon chuyển động.

**Thứ tự ưu tiên theo loại thông tin:**

- Giao diện: mockup V1.2 và HANDOFF là chuẩn mới. Các mô tả màu, font, kích thước và vị trí tài khoản trong brief gốc chỉ mô tả giao diện cũ.
- Nghiệp vụ và khả năng API: đối chiếu brief với code và API contract đang dùng. Nếu có mâu thuẫn ảnh hưởng nghiệp vụ, chỉ rõ khác biệt và giữ hành vi hiện tại ở phần chưa được quyết định; không tự sửa công thức hoặc contract.
- Hướng dẫn phát triển: đọc và tuân thủ README, AGENTS.md hoặc hướng dẫn tương đương trong repository.

**Chỉnh sửa mới nhất phải được thực hiện:** tài khoản Lamie Admin nằm ở ĐẦU sidebar, ngay trên nút Tạo đơn hàng. Không đưa tài khoản trở lại đáy theo brief cũ.

## 2. Khảo sát project trước khi sửa

Xác định framework, phiên bản, package manager và lockfile, routing, cấu trúc module, styling, state management, API client, authentication, permission, thư viện form và component đang dùng. Không giả định project sử dụng Next.js hay một stack khác khi chưa đọc source.

Lập bảng đối chiếu route hiện hành → file/component hiện tại → mockup/template tương ứng → trạng thái triển khai. Kiểm kê đủ field, filter, action, validation và liên kết giữa các trang để tránh mất chức năng khi thay bố cục.

Phạm vi là ứng dụng admin. `FE_Lamie` storefront nằm ngoài phạm vi. Ưu tiên tái sử dụng kiến trúc, service và hook đang hoạt động; chỉ bổ sung dependency cần thiết cho thiết kế. Không thay framework, viết lại backend, đổi database schema hoặc đổi tên route/API chỉ để khớp bản vẽ. Giữ các thay đổi đang có của người dùng trong repository.

## 3. Yêu cầu giao diện

Bám sát mockup về bố cục, tỷ lệ cột, khoảng cách, mật độ dữ liệu, màu, typography, đường viền, icon và vị trí action. Không tự sáng tạo một theme khác. Các màn hình hoặc biến thể chưa có artboard riêng phải dùng cùng hệ thống component, đồng thời giữ đủ nội dung từ source và brief.

**Nhận diện và token:**

- Phong cách tinh tế, ấm, gọn; giao diện quản trị để làm việc hằng ngày.
- Canvas `#F7F7F2`, surface `#FFFEFA`, sidebar `#EEEEE5`, primary olive mặc định `#435C46`, selected `#DFE8D7`, text `#26362D`, text phụ `#677268`, border `#DEDFD4`.
- Dùng semantic token và giữ chức năng đổi màu primary nếu project đã hỗ trợ. Trạng thái không chỉ dựa vào màu.
- Font Inter có tiếng Việt; số liệu dùng tabular numerals. Hệ chữ, radius, spacing và kích thước chi tiết lấy từ HTML/HANDOFF. Không thêm họa tiết hoa dày, gradient hoặc hiệu ứng kính vào các màn hình vận hành.

**Sidebar và app shell:**

- Cụm tài khoản gọn ở trên cùng: cao khoảng 48 px, avatar khoảng 30 px, tên và vai trò, chevron nhỏ. Cả cụm bấm được để mở thông tin tài khoản và thao tác tài khoản hiện có.
- Tên, email, avatar và vai trò lấy từ session/user thật; “Lamie Admin” trong mẫu không phải dữ liệu người dùng cần hardcode.
- Gộp nhận diện và tài khoản thành header gọn như V1.2; không thêm lại khối logo lớn làm đẩy menu xuống.
- CTA Tạo đơn hàng ngay bên dưới, chỉ hiện khi đủ quyền. Nhóm menu và active state theo mockup, dữ liệu menu vẫn lấy từ hệ thống hiện có.
- Giữ các chức năng điều hướng đang có, kể cả thu gọn sidebar nếu project hỗ trợ; thiết kế trạng thái đó theo cùng token.
- Dưới 1024 px dùng drawer; nút đóng nằm cạnh cụm tài khoản và không chồng lên nội dung.

**Responsive và khả năng sử dụng:**

- Kiểm tra ở 360, 390, 768, 1024 và 1440 px. Bảng chính đổi thành card/list có nhãn trên mobile; không thu nhỏ nguyên bảng desktop.
- Form dài chia section; cột tóm tắt và action theo mockup. Settings dùng điều hướng phụ trên desktop, select nhóm cài đặt trên mobile.
- Modal desktop và bottom sheet mobile có body cuộn độc lập, action dễ tiếp cận, focus trap, Escape và trả focus về trigger. Drawer khóa cuộn nền khi mở.
- Có label, focus visible, tên truy cập cho nút chỉ có icon; vùng chạm chính khoảng 44 px. Dữ liệu dài, nội dung tiếng Việt và zoom 200% không làm mất thao tác thiết yếu.
- Thể hiện loading, empty, lọc không có kết quả, lỗi/retry, lỗi một phần, read-only, đang lưu và phản hồi thành công theo trạng thái thật.

## 4. Lucide Animated

Dùng component Lucide Animated đã cung cấp trong `motion-source/icons/`, theo ánh xạ và quy tắc trong `MOTION_NOTES.md`.

- Icon ở menu và nút thao tác chính chạy khi hover toàn bộ nút, focus bàn phím hoặc chạm; không tự chạy liên tục khi đứng yên.
- Giới hạn mỗi lần kích hoạt như mockup: tự dừng sau tối đa khoảng 1,2 giây rồi trở về trạng thái tĩnh.
- Tôn trọng `prefers-reduced-motion`, kể cả khi tùy chọn đổi trong lúc đang mở ứng dụng. Dọn animation/listener khi component unmount.
- Icon trong bảng, badge dữ liệu và icon hoa giữ tĩnh theo thiết kế. Icon chưa có bản Animated dùng Lucide tĩnh tương ứng.
- Nếu project là React, tích hợp các TSX component vào cây React hiện có. `bridge.tsx` là adapter dành cho prototype vanilla, không phải kiến trúc bắt buộc cho app thật. Tránh nhúng lại cả React/Motion runtime từ HTML.
- Chỉ import những icon cần dùng, giữ giấy phép. Không thay chuyển động gốc bằng hiệu ứng CSS xoay toàn bộ icon rồi coi là đã khớp mockup.

## 5. Phạm vi chức năng và nghiệp vụ

Hoàn thiện giao diện cho tất cả route admin hiện hành thuộc brief: đăng nhập, dashboard; danh sách/tạo/sửa/chi tiết đơn và nhập nhanh; lịch giao; khách hàng và hồ sơ; việc cần làm và nguyên liệu; sản phẩm/tạo/sửa/nhận diện ảnh; tồn kho/nhập/xuất/điều chỉnh/lịch sử; báo cáo và chi phí; content/footer/lịch sử; toàn bộ nhóm Settings; người dùng/vai trò/quyền/menu; các trang lỗi hệ thống.

Bộ mockup có 24 màn hình chức năng đại diện và hai trang tài liệu thiết kế/trạng thái. Con số này không phải lý do bỏ các route sâu, biến thể tạo/sửa hoặc trường dữ liệu đang có trong project. Tái sử dụng template khi phù hợp. Không tự thêm module chưa có trong hệ thống.

Các quy tắc cần bảo toàn:

- Doanh thu chỉ ghi nhận khi đơn hoàn tất, theo ngày khách thực tế nhận hoa; tiền nhận trước ngày giao chưa phải doanh thu.
- Tùy chọn tính phí giao thu khách vào doanh thu hoạt động đúng; chi phí giao thực tế theo dõi riêng.
- Sửa đơn chỉ khi Chờ xác nhận; bước chuyển trạng thái và quyền thao tác theo hệ thống hiện có. Thanh toán độc lập với trạng thái xử lý.
- Phân biệt nguyên liệu chuẩn bị không trừ kho và vật tư có tồn thực. Giữ đối soát phiếu nhập/khoản chi và đường truy về giao dịch nguồn.
- Trạng thái kinh doanh trong form sản phẩm tiếp tục chỉ đọc khi API chưa hỗ trợ cập nhật.
- Footer content được chụp snapshot; chỉnh từ lịch sử tạo phiên bản mới. Tạo content/nhận diện ảnh dùng service thật đang có.
- Menu động không thay thế permission. Giữ kiểm tra quyền ở route và action, các bảo vệ vai trò Admin/mục hệ thống và điều hướng về route đầu tiên được phép.
- Giữ định dạng tiền Việt Nam, ngày `dd/mm/yyyy` và xử lý múi giờ `Asia/Ho_Chi_Minh` theo hợp đồng dữ liệu hiện có; không tự chuyển ngày thuần thành UTC làm lệch ngày giao.

Giữ mọi chức năng hiện hành, gồm tìm kiếm, lọc, sort, pagination, upload/preview/sắp xếp ảnh, validation, export, xác nhận xóa, cảnh báo thay đổi chưa lưu, liên kết chi tiết và xử lý lỗi API. Mockup có thể chỉ vẽ một phần trường hoặc minh họa action; phải triển khai đầy đủ phần đã có trong sản phẩm.

## 6. Tách thiết kế mẫu khỏi ứng dụng thật

HTML là tài liệu tham chiếu, không phải mã nguồn production cần nhúng nguyên khối. Xây dựng component phù hợp với framework hiện có: app shell, account header, navigation, page header, field/form section, table/mobile list, badge, filter, dialog, state và feedback.

Không đưa thanh “UI STUDY”, bộ chọn màn hình/trạng thái, footer thông tin prototype hoặc các trang handoff vào luồng sử dụng thực tế. Không hardcode đơn, khách, số tiền, ngày mẫu, tài khoản mẫu hoặc mock permission từ HTML. Không dùng iframe để bọc mockup thay cho việc triển khai.

Dùng dữ liệu và API client hiện có. Ảnh hoa placeholder và ảnh bản đồ trong HTML chỉ để minh họa; giữ asset sản phẩm và tích hợp bản đồ thật của project. Nút AI, upload, export, đăng nhập và lưu dữ liệu phải gọi đúng chức năng đã có, không chỉ đổi chữ hoặc hiện toast giả.

Nếu một khả năng chưa tồn tại hoặc không thể kiểm tra do thiếu môi trường/API, nêu rõ giới hạn đó và tiếp tục phần độc lập có thể hoàn thành; không dựng phản hồi thành công giả hoặc tuyên bố đã kiểm tra end-to-end.

## 7. Quy trình thực hiện và tiêu chí hoàn tất

1. Đọc source và tài liệu; lập kế hoạch ngắn cùng bảng đối chiếu route. Nêu xung đột thực sự nếu có, rồi bắt đầu sửa code.
2. Hoàn thiện token và component dùng chung, app shell, sidebar/account header và responsive.
3. Áp dụng lần lượt cho các module, ưu tiên đơn hàng, sản phẩm và kho; tiếp tục đến hết phạm vi, không dừng sau dashboard.
4. Chạy ứng dụng bằng lệnh của repository. Nếu có browser automation, chụp các màn hình đại diện cùng viewport với mockup và sửa sai lệch nhìn thấy được. So sánh cả trường hợp dữ liệu thực dài hơn mẫu.
5. Chạy lint/typecheck/build và test sẵn có phù hợp. Tập trung kiểm tra hồi quy các luồng nhạy cảm: tạo/sửa/chuyển trạng thái đơn, tính tổng/cọc/phí giao, cập nhật thanh toán, nhập/xuất kho, báo cáo, upload, phân quyền và lưu phiên bản content. Chỉ bổ sung test cho rủi ro thực tế, không viết test chỉ lặp lại cấu trúc CSS.
6. Kiểm tra thao tác tài khoản ở đầu sidebar trên desktop/mobile, drawer/modal bằng bàn phím, reduced motion, deep link/refresh, trạng thái lỗi và tài khoản chỉ xem.
7. Hoàn thiện tài liệu bàn giao ngắn: module/file đã thay đổi, bảng route đã hoàn thành, lệnh chạy, kết quả kiểm tra thực tế, ảnh đối chiếu nếu có và phần còn bị chặn kèm lý do.

Kết quả đạt yêu cầu khi giao diện bám sát V1.2, các route và chức năng hiện tại vẫn dùng được với dữ liệu thật, không có lỗi console do thay đổi mới, không tràn ngang toàn trang ở viewport mục tiêu và không mất action quan trọng. Không báo hoàn tất nếu vẫn còn module chưa xử lý hoặc chức năng mới chỉ chạy bằng mock.

Hãy chủ động xử lý các quyết định triển khai thông thường trong phạm vi này. Chỉ hỏi khi thiếu thông tin thực sự cần để quyết định nghiệp vụ hoặc bị chặn về quyền truy cập; trong lúc đó tiếp tục các phần không phụ thuộc. Nếu cần tiếp nối qua nhiều lượt, ghi rõ tiến độ và việc tiếp theo để không làm lại từ đầu.
