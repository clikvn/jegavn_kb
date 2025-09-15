---
title: Tại sao trình chỉnh sửa toàn cảnh không thể thêm cảnh?
slug: /tai-sao-trinh-chinh-sua-toan-canh-khong-the-them-canh
sidebar_label: Tại sao trình chỉnh sửa toàn cảnh không thể thêm cảnh?
---

## Tổng quan

Khi trình chỉnh sửa toàn cảnh không thể thêm cảnh, thường do số lượng tên không gian trong dự án không khớp với số lượng hình ảnh toàn cảnh. Đây là vấn đề phổ biến có thể dễ dàng khắc phục.

## Nguyên nhân chính

### Vấn đề về số lượng không gian

**Nguyên nhân:**
- Ảnh toàn cảnh phải tương ứng với số lượng tên không gian trong dự án
- Khi số lượng tên không gian ít hơn số lượng hình ảnh toàn cảnh
- Nút xác nhận sẽ bị vô hiệu hóa (disabled)

**Cách nhận biết:**
- Nút **Thêm cảnh (Add scene)** bị mờ hoặc không thể nhấp
- Thông báo lỗi khi cố gắng thêm cảnh
- Hệ thống yêu cầu tạo thêm tên không gian

## Cách khắc phục

### Bước 1: Thêm tên không gian mới

1. **Mở dự án trong chế độ 2D**
   - Chuyển sang chế độ xem 2D (mặt bằng)
   - Tìm các tên không gian hiện có

2. **Thêm tên không gian mới**
   - Nhấp vào tên không gian hiện có như **Phòng khách (Living room)** (①)
   - Hoặc **Bếp (Kitchen)** (③)
   - Nhấp vào nút **+ (Add)** (②) để thêm tên không gian mới

![Giao diện thiết kế mặt bằng 2D hiển thị cách thêm tên không gian mới bằng cách nhấp vào (①) Phòng khách, (③) Bếp và sau đó là nút (②) +.](https://storage.googleapis.com/jegavn_kb/image_jegavn/263.1.png)

3. **Đặt tên cho không gian mới**
   - Nhập tên phù hợp cho không gian mới
   - Chọn loại phòng từ danh sách
   - Đảm bảo số lượng tên không gian bằng số lượng ảnh toàn cảnh

### Bước 2: Lưu dự án

1. **Lưu thay đổi**
   - Nhấp vào **Lưu dự án (Save project)**
   - Đảm bảo tất cả thay đổi được lưu trữ

2. **Xác nhận lưu thành công**
   - Kiểm tra thông báo lưu thành công
   - Đảm bảo không có lỗi xảy ra

![Giao diện phần mềm hiển thị quy trình vào (①) Công cụ, chọn (②) Trình chỉnh sửa toàn cảnh và cuối cùng là hộp thoại (③) Lưu dự án.](https://storage.googleapis.com/jegavn_kb/image_jegavn/263.2.png)

### Bước 3: Truy cập trình chỉnh sửa toàn cảnh

1. **Mở trình chỉnh sửa**
   - Vào **Công cụ (Tool)** (①)
   - Chọn **Trình chỉnh sửa toàn cảnh (Panorama editor)** (②)

2. **Thêm cảnh toàn cảnh**
   - Bây giờ có thể nhấp vào nút **Thêm cảnh (Add scene)**
   - Chọn hình ảnh toàn cảnh từ thư viện
   - Gán cho tên không gian tương ứng

## Quy tắc quan trọng

### Tương ứng 1:1
- **Mỗi tên không gian** phải tương ứng với **một hình ảnh toàn cảnh**
- Số lượng tên không gian = Số lượng hình ảnh toàn cảnh
- Không thể có nhiều ảnh hơn tên không gian

### Đặt tên rõ ràng
- Tên không gian nên mô tả chức năng rõ ràng
- Ví dụ: "Phòng khách", "Phòng ngủ chính", "Bếp", "Phòng tắm"
- Tránh tên trùng lặp hoặc không rõ ràng

## Các bước kiểm tra

### Bước 1: Đếm số lượng
1. **Đếm tên không gian trong dự án**
   - Kiểm tra tất cả tên phòng trong chế độ 2D
   - Ghi chú số lượng

2. **Đếm hình ảnh toàn cảnh**
   - Kiểm tra số lượng ảnh đã kết xuất
   - Đảm bảo số lượng khớp nhau

### Bước 2: Điều chỉnh nếu cần
1. **Nếu thiếu tên không gian**
   - Thêm tên không gian mới theo hướng dẫn trên
   - Lưu dự án

2. **Nếu thừa tên không gian**
   - Xóa tên không gian không cần thiết
   - Hoặc tạo thêm ảnh toàn cảnh tương ứng

## Lưu ý quan trọng

:::warning
- Luôn đảm bảo số lượng tên không gian khớp với số lượng ảnh toàn cảnh
- Lưu dự án sau mỗi lần thay đổi tên không gian
- Kiểm tra lại trước khi truy cập trình chỉnh sửa toàn cảnh
:::

:::tip
- Lập kế hoạch trước về số lượng cảnh cần kết xuất
- Đặt tên không gian rõ ràng và có ý nghĩa
- Sử dụng chức năng xem trước để kiểm tra trước khi lưu
:::