# Lamie — Quy tắc nghiệp vụ để triển khai

Tài liệu mô tả yêu cầu sản phẩm, không xác định nghĩa vụ thuế hay phương pháp kế toán pháp định thay cho người phụ trách kế toán.

## Bối cảnh đã xác nhận
- Hiện chưa đăng ký; dự định đăng ký hộ kinh doanh.
- Hoa/nguyên liệu mua ở chợ, hiện chưa có hóa đơn điện tử đầu vào.
- Nhập tổng giá trị mua theo nhóm; kiểm kê cuối tuần/tháng, chưa có tiêu hao chính xác theo từng đơn.
- Chưa biết doanh thu năm, phương pháp thuế hoặc điều kiện chứng từ cụ thể. Không tự áp một thuế suất/ngưỡng vào sản phẩm.

## 1. Ba trục ngày độc lập
- Báo cáo doanh thu quản trị: theo ngày giao thành công thực tế/ghi nhận hoàn tất giao, không phải ngày dự kiến hoặc ngày tạo đơn.
- Dòng tiền: theo từng lần tiền thực nhận/thực trả. Nhận cọc ngày nào ghi ngày đó; không mặc định là ngày tạo đơn.
- Mua/chi phí: ngày nhận hàng, phát sinh chi phí và kỳ được phân bổ lưu riêng với ngày thanh toán.
- Ngày hóa đơn phục vụ thuế lưu riêng và áp dụng quy tắc được cấu hình, không suy ra máy móc từ một trạng thái đơn.
- Múi giờ cửa hàng Asia/Ho_Chi_Minh. Khoảng lọc UI có hai đầu bao gồm; truy vấn thời gian nên dùng [đầu ngày bắt đầu, đầu ngày sau ngày kết thúc).

## 2. Doanh thu và phí ship
- Doanh thu sản phẩm thuần = tiền sản phẩm − giảm giá − hoàn trả, theo quy ước thuế giá đã cấu hình. Không đồng nhất với tổng tiền khách đã trả.
- Ba giá trị ship riêng: `customer_shipping_fee`, `estimated_carrier_cost`, `actual_carrier_cost` (tên mang tính gợi ý, ánh xạ sang schema hiện hữu).
- Chênh lệch giao hàng = phí tính khách − chi phí carrier thực tế.
- Chênh lệch dự toán = carrier dự kiến − carrier thực tế. Âm là vượt dự toán.
- Ship thực tế chưa nhập là unknown/null, khác 0. Nếu tạm tính bằng dự kiến, hiển thị trạng thái tạm tính và không cho chốt như đã đối soát.
- Ngày không có đơn giao là doanh thu 0. Ngày chưa tải được dữ liệu là lỗi/thiếu dữ liệu.
- Trung bình/ngày chia cho số ngày lịch trong khoảng, gồm ngày 0; trung bình/đơn chia theo đúng số đơn thuộc doanh thu đang xem.
- Phí thu khách được cộng một lần khi bật công tắc. Số đơn không đổi khi bật/tắt công tắc.
- Donut sản phẩm chỉ dùng tiền sản phẩm. Một đơn nhiều dòng được phân nhóm theo dòng; không nhân tiền đơn theo nhiều tag/danh mục. Nếu dữ liệu giảm giá cấp đơn cần phân bổ, chọn phương pháp nhất quán và đối soát tổng. Nhóm chưa xác định hiển thị “Khác/Chưa phân loại”.
- So sánh ngày trước dựa trên ngày lịch trước đó, có thể ngoài khoảng lọc nhưng phải có dữ liệu đáng tin. Thiếu dữ liệu trước thì báo thiếu; mẫu số 0 không tính phần trăm.
- Trả hàng/hoàn tiền/hủy sau giao: giữ giao dịch điều chỉnh, ngày điều chỉnh và liên kết đơn theo chính sách hệ thống. Không xóa lịch sử hoặc tự viết lại kỳ khóa. Quy tắc bổ sung cần được ghi rõ nếu schema hiện tại chưa có.

## 3. Mua nguyên liệu và kiểm kê định kỳ
- Nhóm khởi đầu: Hoa tươi; Phụ liệu; Giỏ, bình & phụ kiện. Dùng master data hiện hữu nếu tương đương.
- Một phiếu mua thật có thể có nhiều dòng nhóm. Prototype chỉ nhập một nhóm mỗi lần là đơn giản hóa.
- Giá trị mua chưa thanh toán vẫn tăng nguyên liệu mua vào/công nợ. Tiền trả nhà cung cấp ảnh hưởng dòng tiền ở ngày trả.
- Giá trị tồn theo giá vốn, không dùng giá bán. Có dữ liệu số lượng/đơn giá tham chiếu nếu có; giá trị ước lượng phải được gắn nhãn.
- Tồn cuối gồm nguyên liệu còn sử dụng được và giá vốn nguyên liệu trong sản phẩm đang làm/bó đã làm nhưng chưa giao. Ghi nhận tồn ban đầu để bắt đầu sử dụng; không mặc định 0 khi chưa có.
- Trong trường hợp mẫu không có xuất riêng/biếu tặng/điều chỉnh: Tiêu hao = tồn đầu + mua vào thuần − tồn cuối.
- Tiêu hao = nguyên liệu trong sản phẩm đã bán + hao hụt. Giá vốn nguyên liệu sản phẩm = tiêu hao − hao hụt.
- Hao hụt được tách ra trình bày, không trừ thêm lần hai. Không trừ toàn bộ tiền mua nguyên liệu thêm vào chi phí vận hành.
- Khi có sử dụng ngoài bán hàng, điều chuyển, kiểm kê điều chỉnh, trả hàng nhà cung cấp, phải có dòng điều chỉnh riêng; không đẩy chênh lệch không giải thích được vào giá vốn đã bán. Công thức trên chỉ là trường hợp đơn giản có giả định rõ.
- Kiểm kê tuần là điểm kiểm tra trung gian. Báo cáo tháng dựa trên tồn đầu/cuối tháng và giao dịch kỳ; không cộng tất cả số tiền kiểm kê tuần.
- Tồn cuối đã xác nhận của kỳ trước chuyển sang đầu kỳ sau. Sửa kỳ trước cần đánh giá các kỳ sau bị ảnh hưởng, không im lặng để lệch số.
- Không cho hao hụt vượt tiêu hao hoặc tồn/tiêu hao âm trong luồng thông thường; trường hợp điều chỉnh đặc biệt cần nghiệp vụ giải thích.

## 4. Lợi nhuận quản trị
Công thức cho phạm vi mẫu:

Lợi nhuận quản trị trước thuế
= doanh thu sản phẩm thuần
+ phí giao hàng tính khách
− giá vốn nguyên liệu sản phẩm đã bán
− hao hụt chưa tính trong giá vốn
− chi phí carrier thực tế
− chi phí vận hành của kỳ.

- Lương trong ví dụ nằm trong chi phí vận hành; không đồng thời trừ vào giá vốn từng sản phẩm.
- Nếu có phí thanh toán/phí sàn thì phân loại và trừ một lần.
- Thuê nhà trả trước hoặc thiết bị dài hạn cần kỳ phân bổ phù hợp; tiền trả không đồng nghĩa chi phí toàn bộ ngày trả. Giữ quy tắc kế toán đã cấu hình.
- Vốn góp, rút vốn, khoản vay và trả gốc vay tách khỏi doanh thu/chi phí vận hành.
- Chưa chốt tồn hoặc thiếu chi phí: “Lợi nhuận tạm tính”, có nguyên nhân và mốc dữ liệu rõ.
- Không suy ra lợi nhuận thực tế từng ngày/đơn từ giá vốn tháng. Nếu sau này có ước tính theo định mức, cần nhãn riêng và cơ chế đối chiếu kỳ.
- Profit margin trong mockup = lợi nhuận trước thuế / (doanh thu sản phẩm thuần + phí giao hàng tính khách). Mẫu số bằng 0 hiển thị không xác định, không Infinity/NaN.
- Không tự suy ra VAT hoặc coi mọi khoản thuế là cùng một loại chi phí. Khi bổ sung thuế, thống nhất giá đã/chưa gồm thuế và cách hạch toán theo cấu hình được xác nhận.

## 5. Dòng tiền
- Lưu transaction: loại thu/chi, số tiền, ngày thực tế, tài khoản/quỹ, liên kết đơn/phiếu chi/nhà cung cấp, nội dung, trạng thái và audit.
- Tiền cọc + các lần trả phần còn lại + hoàn tiền đối chiếu công nợ; trạng thái “đã thanh toán” không tạo lại toàn bộ số tiền đơn.
- Số dư cuối = đầu + thu − chi. Chuyển giữa quỹ/tài khoản của tiệm không tăng tổng dòng tiền vào của toàn tiệm; có hai vế đối ứng.
- Công nợ không phải số tiền mặt còn lại. Chi phí ship đã phát sinh nhưng chưa trả vẫn ảnh hưởng lợi nhuận, chưa ảnh hưởng tiền chi.

## 6. Chứng từ và thuế
- Lưu thông tin người bán, địa chỉ/sạp, thông tin định danh khi cần và có căn cứ, ngày mua, hàng/số lượng/đơn giá/giá trị, phiếu mua, hóa đơn, chứng từ thanh toán.
- Trạng thái hồ sơ: thiếu, cần kiểm tra, có tài liệu/hóa đơn chờ kiểm tra, đã được người có quyền đối soát.
- Trạng thái “đủ điều kiện thuế” cần đánh giá riêng theo phương pháp và quy định áp dụng. Mua ở chợ/phiếu viết tay/bảng kê không tự động hợp lệ để khấu trừ.
- Chưa cấu hình loại hình/mã số thuế/phương pháp: chỉ đối soát và xuất dữ liệu; không tính/nộp thuế tự động.
- Doanh thu quản trị và dữ liệu thuế dùng cùng giao dịch gốc với đối soát chênh lệch rõ, không tạo hai bộ giao dịch mâu thuẫn.

## 7. Chốt kỳ và quyền
- Tối thiểu kiểm kê cuối kỳ, phí ship, chi phí vận hành được xác nhận; dữ liệu unknown liên quan phải được xử lý.
- Lưu ai xác nhận, thời điểm và phiên bản dữ liệu. Thay đổi ảnh hưởng làm mất hiệu lực xác nhận, không giữ checkbox cũ.
- Chốt kỳ qua thao tác có quyền; kiểm soát ở backend, giao dịch nguyên tử/chống chốt trùng phù hợp stack.
- Kỳ chốt khóa dữ liệu có ảnh hưởng; mở lại cần lý do, người thực hiện, audit và kiểm tra kỳ tiếp theo. Có thể dùng snapshot/version để giữ lịch sử.
- Chốt quản trị không đồng nghĩa đã nộp hoặc đã đối soát thuế.

## 8. Bộ số liệu mẫu đối soát
| Chỉ tiêu | VND |
|---|---:|
| Số đơn đã giao | 64 đơn |
| Doanh thu sản phẩm | 40.000.000 |
| Phí ship tính khách | 2.000.000 |
| Carrier dự kiến | 2.100.000 |
| Carrier thực tế | 2.300.000 |
| Tồn đầu | 3.000.000 |
| Mua trong kỳ | 20.000.000 |
| Tồn cuối | 4.000.000 |
| Tiêu hao gồm hao hụt | 19.000.000 |
| Hao hụt | 1.000.000 |
| Nguyên liệu trong sản phẩm đã bán | 18.000.000 |
| Chi phí vận hành | 10.000.000 |
| Lợi nhuận quản trị trước thuế | 10.700.000 |
| Tiền đầu kỳ | 4.000.000 |
| Tiền thực thu (cọc 20m + còn lại 18m) | 38.000.000 |
| Trả tiền mua nguyên liệu | 18.000.000 |
| Trả chi phí vận hành | 9.000.000 |
| Trả phí carrier | 2.100.000 |
| Tiền cuối kỳ | 12.900.000 |

Tháng mẫu chưa có thuế, nguồn vốn, khoản vay, trả hàng, sử dụng riêng hay chuyển quỹ. Fixture chỉ kiểm chứng số học và UI, không thay thế dữ liệu thật.
