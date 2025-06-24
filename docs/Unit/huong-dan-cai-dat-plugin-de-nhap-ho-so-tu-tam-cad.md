---
title: Hướng dẫn cài đặt Plug-IN để nhập hồ sơ tủ/tấm CAD
slug: huong-dan-cai-dat-plugin-de-nhap-ho-so-tu-tam-cad
sidebar_label: Hướng dẫn cài đặt Plug-in nhập CAD
---

I. Yêu cầu phiên bản

1. Phiên bản JEGA AiHouse: Phải là phiên bản 5plus.

2. Nhập tủ CAD yêu cầu phiên bản V5.28.2.20230705_0 trở lên.

3. Nhập hồ sơ tấm CAD yêu cầu phiên bản V5.38.0.20231031_0 trở lên.

4. Phần mềm CAD: Phải hỗ trợ cài đặt plugin. Các trình xem CAD chỉ cho phép xem trước không được hỗ trợ.

II. Tải xuống & Áp dụng Plugin CAD

2.1 Cài đặt Plugin CAD

1. Tải xuống tệp plugin CAD CopyToDMS.VLX 

2. Di chuyển tệp plugin vào thư mục **Hỗ trợ (Support)** trong thư mục cài đặt CAD.

![Một tệp có tên 'CopyToDMS.VLX' được chọn trong trình khám phá tệp.](https://storage.googleapis.com/jegavn_kb/images/469489616571957318_1689746013401_image.png)

2.2 Tải Plugin CAD

1. Mở CAD, nhập lệnh **APPLOAD** để mở hộp thoại **Tải/Gỡ ứng dụng (Load/Unload Applications)**.

2. Trong **Bộ khởi động (Startup Suite)**, nhấp vào **Nội dung (Contents)** > **Thêm (Add)** > Điều hướng đến thư mục (①) **Hỗ trợ (Support)** > Chọn (②) CopyToDMS.VLX > Nhấp vào (③) **Mở (Open)** > Đóng hộp thoại.

3. Khởi động lại CAD.

1. Mở hộp thoại "Tải ứng dụng"

![Hộp thoại để quản lý các tệp ứng dụng, hiển thị danh sách tệp và các tùy chọn để tải.](https://storage.googleapis.com/jegavn_kb/images/78a7d598-604a-4ef5-8424-827adc690cef.png)

2. Thêm plugin CAD

![Hộp thoại để quản lý các ứng dụng khởi động, hướng dẫn người dùng nhấp vào nút 'Thêm'.](https://storage.googleapis.com/jegavn_kb/images/66e7044d-96f5-46e6-80ae-c7e074c15332.png)

![Một người dùng điều hướng trình khám phá tệp để chọn và mở tệp VLX từ thư mục Hỗ trợ của AutoCAD, làm nổi bật các bước: (1) thư mục Hỗ trợ, (2) tệp CopyToDMS.VLX và (3) nút Mở.](https://storage.googleapis.com/jegavn_kb/images/a321e2e9-304a-4efc-b035-2e002b9ebac4.png)

2.3 JEGA AiHouse: Nhập tủ CAD

Trong CAD, sử dụng lệnh **CTD** để chọn tủ (chỉ hỗ trợ polylines; các bản vẽ không phải polyline phải được phá khối trước).

Vào **Mô-đun Tủ/Tủ quần áo JEGA AiHouse (JEGA AiHouse Cabinet/Wardrobe Module)**, nhấn Ctrl+V để dán nội dung tủ (Phiên bản Doanh nghiệp yêu cầu cấu hình trước các tấm tủ tùy chỉnh).

2.4 JEGA AiHouse: Nhập hồ sơ tấm CAD

Trong CAD, chọn các hồ sơ tấm bằng một hộp giới hạn, sau đó sử dụng lệnh **CTD** để sao chép các hồ sơ.

1. Nhập cảnh 3D:

2. Nhập ở Chế độ Chỉnh sửa 2D: