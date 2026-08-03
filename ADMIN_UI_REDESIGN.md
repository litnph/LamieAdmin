# Admin UI Redesign Brief

## Product

Trang quản trị cửa hàng hoa.

## Primary users

- Chủ cửa hàng
- Nhân viên bán hàng
- Nhân viên xử lý đơn
- Nhân viên quản lý sản phẩm và tồn kho

## Core workflows

- Xem tổng quan doanh thu và đơn hàng
- Tạo và cập nhật sản phẩm hoa
- Quản lý danh mục
- Theo dõi tồn kho
- Xử lý đơn hàng
- Cập nhật trạng thái giao hàng
- Quản lý khách hàng
- Quản lý chương trình khuyến mãi

## Design direction

- Thân thiện, hiện đại và dễ hiểu
- Mang cảm giác nhẹ nhàng của thương hiệu hoa nhưng không quá trang trí
- Tối ưu cho công việc hằng ngày
- Ưu tiên khả năng đọc, tốc độ thao tác và trạng thái rõ ràng
- Không dùng gradient tùy tiện
- Không lạm dụng glassmorphism
- Không tạo card cho mọi khối nội dung
- Không làm dashboard giống landing page

## Responsive targets

- Mobile: 360px trở lên
- Tablet: 768px trở lên
- Laptop: 1024px trở lên
- Desktop: 1280px trở lên
- Wide desktop: 1440px trở lên

## Constraints

- Không thay đổi business logic nếu không cần thiết
- Không thay đổi API contract
- Không xóa permission checks
- Không thay đổi route hiện có nếu không được yêu cầu
- Không thay đổi thư viện UI trước khi đánh giá ảnh hưởng
- Tận dụng component và design token hiện có