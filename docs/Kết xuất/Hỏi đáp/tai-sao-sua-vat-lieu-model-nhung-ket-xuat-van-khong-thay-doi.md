---
title: Tại sao sửa vật liệu model nhưng kết xuất vẫn không thay đổi?
slug: /tai-sao-sua-vat-lieu-model-nhung-ket-xuat-van-khong-thay-doi
sidebar_label: Tại sao sửa vật liệu model nhưng kết xuất vẫn không thay đổi?
---

## Tổng quan

Khi sửa vật liệu model nhưng kết xuất vẫn không thay đổi, thường do model không thể chỉnh sửa vật liệu hoặc chưa thực hiện đúng quy trình chỉnh sửa. Vấn đề này có thể được khắc phục bằng cách kiểm tra loại model và sử dụng đúng phương pháp chỉnh sửa.

## Nguyên nhân chính

### 1. Model không thể chỉnh sửa vật liệu

**Vấn đề:**
- Một số model được thiết kế với vật liệu cố định
- Model có thể thuộc loại "read-only" hoặc "locked"
- Vật liệu đã được tối ưu hóa và không cho phép thay đổi

**Cách nhận biết:**
- Không có tùy chọn **Chỉnh sửa vật liệu (Edit material)** khi chọn model
- Hoặc tùy chọn bị mờ (disabled)
- Thông báo lỗi khi cố gắng chỉnh sửa

### 2. Chưa sử dụng đúng phương pháp chỉnh sửa

**Vấn đề:**
- Chỉnh sửa vật liệu không đúng cách
- Không lưu thay đổi trước khi kết xuất
- Sử dụng sai công cụ chỉnh sửa

## Cách khắc phục

### Bước 1: Kiểm tra loại model

1. **Chọn model cần chỉnh sửa**
   - Nhấp vào model trong giao diện 3D (①)
   - Model được chọn sẽ có viền highlight

2. **Kiểm tra tùy chọn chỉnh sửa**
   - Xem bảng menu bên phải
   - Tìm tùy chọn **Chỉnh sửa vật liệu (Edit material)** (②)

![Giao diện phần mềm thiết kế 3D, tập trung vào một chiếc ghế sofa được chọn trong không gian làm việc và bảng thuộc tính của nó.](https://storage.googleapis.com/jegavn_kb/image_jegavn/266.1.png)

### Bước 2: Chỉnh sửa vật liệu đúng cách

1. **Truy cập chỉnh sửa vật liệu**
   - Nhấp vào **Chỉnh sửa vật liệu (Edit material)** (②)
   - Mở giao diện chỉnh sửa vật liệu

2. **Thay đổi vật liệu**
   - Chọn vật liệu mới từ thư viện
   - Hoặc tùy chỉnh các thuộc tính vật liệu hiện tại
   - Điều chỉnh màu sắc, độ bóng, kết cấu

3. **Áp dụng thay đổi**
   - Nhấp **Áp dụng (Apply)** hoặc **OK**
   - Đảm bảo thay đổi được lưu

### Bước 3: Kết xuất lại

1. **Lưu dự án**
   - Nhấp **Lưu dự án (Save project)**
   - Đảm bảo tất cả thay đổi được lưu

2. **Kết xuất lại hình ảnh**
   - Tiến hành kết xuất với cài đặt phù hợp
   - Vật liệu mới sẽ hiển thị trong kết quả

## Các trường hợp đặc biệt

### 1. Model không thể chỉnh sửa

**Giải pháp:**
- Thay thế model bằng model khác có thể chỉnh sửa
- Sử dụng model từ thư viện khác
- Liên hệ hỗ trợ nếu cần thiết

### 2. Vật liệu phức tạp

**Giải pháp:**
- Sử dụng công cụ chỉnh sửa vật liệu nâng cao
- Tham khảo hướng dẫn chi tiết về vật liệu
- Thử nghiệm với các tùy chọn khác nhau

## Lưu ý quan trọng

:::warning
- Không phải tất cả model đều có thể chỉnh sửa vật liệu
- Luôn kiểm tra tùy chọn chỉnh sửa trước khi thay đổi
- Lưu dự án sau mỗi lần chỉnh sửa quan trọng
:::

:::tip
- Sử dụng model từ thư viện chính thức để đảm bảo có thể chỉnh sửa
- Thử nghiệm với các loại vật liệu khác nhau
- Kiểm tra kết quả kết xuất sau mỗi lần thay đổi
:::