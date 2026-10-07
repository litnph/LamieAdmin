---
name: Lamie Admin
description: Hệ thống quản trị vận hành ấm áp, gọn và chính xác cho cửa hàng hoa Lamie.
colors:
  botanical-primary: "#6B7B8B"
  warm-canvas: "#F7F6F3"
  warm-sidebar: "#F1EFEB"
  paper-surface: "#FFFFFF"
  warm-muted: "#F1EFEB"
  warm-border: "#DED8D1"
  ink-primary: "#292623"
  ink-secondary: "#625D57"
  ink-muted: "#756F69"
  success: "#356342"
  warning: "#7A5D22"
  error: "#A23E3E"
  info: "#41677A"
typography:
  title:
    fontFamily: "Segoe UI Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Segoe UI Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Segoe UI Variable, Segoe UI, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  control: "0.5rem"
  panel: "0.75rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  nav-item:
    backgroundColor: "{colors.warm-sidebar}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.control}"
    height: "2.75rem"
  nav-item-active:
    backgroundColor: "{colors.warm-muted}"
    textColor: "{colors.botanical-primary}"
    rounded: "{rounded.control}"
    height: "2.75rem"
---

# Design System: Lamie Admin

## Overview

**Creative North Star: “Bàn điều phối cửa hàng hoa”**

Lamie Admin là một giao diện Operate: gần gũi và ấm nhưng ưu tiên tốc độ đọc, tính chính xác và khả năng dự đoán. Ngôn ngữ hình ảnh dùng nền giấy ấm, đường viền mềm và màu nhấn trầm; thương hiệu xuất hiện ở các chi tiết có chủ đích thay vì trang trí cạnh tranh với công việc.

Mật độ thông tin ở mức cao vừa phải. Điều khiển quen thuộc, khoảng cách theo nhịp 4/8px, và trạng thái tương tác rõ ràng giúp nhân viên quay lại nhiều lần trong ngày không phải học lại giao diện.

**Key Characteristics:**

- Nền neutral ấm, bề mặt trắng và đường viền nâu xám nhẹ.
- Một màu primary có thể cấu hình, dành cho hành động chính, focus và trạng thái đang chọn.
- UI dùng một sans-serif hỗ trợ tiếng Việt tốt và Lucide cùng stroke weight.
- Chuyển động ngắn 150–220ms, truyền đạt thay đổi trạng thái và tôn trọng reduced motion.

## Colors

Palette hiện hữu kết hợp canvas trắng ngà với ink nâu đen và màu primary trầm có thể cấu hình.

### Primary

- **Botanical Primary** (`rgb(var(--admin-primary-rgb) / <alpha-value>)`): hành động chính, focus ring, icon và chữ đang active.

### Neutral

- **Warm Canvas** (`#F7F6F3`): nền ứng dụng.
- **Warm Sidebar** (`#F1EFEB`): lớp điều hướng tách nhẹ khỏi nội dung.
- **Paper Surface** (`#FFFFFF`): bề mặt nội dung và popover.
- **Warm Border** (`#DED8D1`): divider và ranh giới điều khiển.
- **Warm Ink** (`#292623`): nội dung chính; `#625D57` cho nội dung phụ; `#756F69` cho metadata đủ tương phản.

### Named Rules

**The One Accent Rule.** Primary chỉ dùng cho hành động chính, focus và current selection; không dùng như trang trí phủ rộng.

## Typography

**Display Font:** Segoe UI Variable (với Segoe UI, Helvetica Neue, Arial fallback)  
**Body Font:** Segoe UI Variable (với cùng fallback)

**Character:** Trung tính, rõ tiếng Việt, quen thuộc với ứng dụng nghiệp vụ. Sidebar, nút, label và dữ liệu dùng cùng một family để giữ nhịp đọc ổn định.

### Hierarchy

- **Title** (600, 1.25–1.5rem): tiêu đề màn hình và vùng nội dung lớn.
- **Body** (400, 0.875rem, 1.5): văn bản giao diện; đoạn dài giữ khoảng 65–75ch.
- **Label** (600, 0.75rem): tên nhóm và metadata; không giảm tương phản đến mức khó đọc.

## Layout

App shell dùng sidebar và content canvas theo chiều ngang ở desktop, chuyển sidebar thành drawer ở dưới 1024px. Header cao 4rem; content có max-width 90rem. Nhịp spacing dựa trên bội số 4px và vùng bấm tương tác tối thiểu 40–44px. Các vùng cuộn phải độc lập để navigation và tài khoản luôn truy cập được trên màn hình thấp.

## Elevation & Depth

Hệ thống gần như phẳng. Tonal layering và border là cách phân lớp chính; shadow chỉ dành cho panel (`0 1px 2px rgb(58 48 40 / 0.04)`) và popover nổi (`0 12px 36px rgb(58 48 40 / 0.10)`).

**The Flat-by-Default Rule.** Không kết hợp border nặng với shadow lớn và không dùng glow trang trí.

## Shapes

Controls dùng bán kính 8px; panel dùng 12px. Pill chỉ dành cho badge/chip nhỏ. Icon không nằm trong ô vuông trang trí nếu không phải avatar, status hoặc một điều khiển thật.

## Components

### Buttons

- **Shape:** control radius 8px, min-height 44px cho hành động chính.
- **Primary:** màu primary và chữ trắng; hover dùng primary-hover.
- **Focus:** focus-visible 2px với outline offset 2px.

### Cards / Containers

- **Corner Style:** 12px ở panel; không lồng card trong card.
- **Background:** trắng trên canvas ấm.
- **Shadow Strategy:** panel rất nhẹ, popover mới dùng elevation rõ.

### Inputs / Fields

- **Style:** nền trắng, border `#D8D2CB`, radius 8px, chiều cao 44px.
- **Focus:** đổi border sang primary và ring tint nhẹ.
- **Disabled:** nền warm-muted với chữ đủ tương phản.

### Navigation

- Item cao 40–44px; icon Lucide 18–20px, stroke 1.8.
- Active dùng nền tint, icon và chữ primary, `aria-current="page"`; không dựa vào một vạch màu duy nhất.
- Tên nhóm khác rõ item điều hướng và disclosure dùng button thật với `aria-expanded`.
- Desktop hỗ trợ sidebar đầy đủ và icon rail; mobile dùng modal drawer với focus trap.

## Do's and Don'ts

### Do:

- **Do** giữ route và permission làm nguồn sự thật cho navigation.
- **Do** nhóm theo luồng bán hàng, vận hành, hàng hóa, tài chính, nội dung và quản trị.
- **Do** hỗ trợ tiếng Việt dài, keyboard, 200% zoom và reduced motion.

### Don't:

- **Don't** dùng gradient tím–xanh, glow, bounce hoặc animation trang trí.
- **Don't** dùng folder icon cho heading nhóm khi typography đã truyền đạt cấu trúc.
- **Don't** lặp thông tin cửa hàng và tài khoản ở cả sidebar lẫn header.
- **Don't** đưa route quản trị lên ngang hàng với công việc hằng ngày.
