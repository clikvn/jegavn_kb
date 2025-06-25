---
title: Hướng dẫn Tải lên Khung CAD
slug: /huong-dan-tai-len-khung-cad
sidebar_label: Hướng dẫn Tải lên Khung CAD
---

Hướng dẫn này trình bày cách tải lên, thiết kế và quản lý các khung tùy chỉnh cho bản vẽ CAD trong AiHouse.

:::info

:::

1. Danh sách Khung

Các khung được phân loại theo mô-đun tùy chỉnh. Đi đến bàn làm việc của quản trị viên - (3) **Quản lý CAD (CAD management)**. Trong (2) **danh sách khung (frame list)** cho các danh mục như (1) tủ, nhấp vào **Khung mới (New Frame)** để tải lên tệp DWG của khung.

![Giao diện quản lý CAD hiển thị (1) các danh mục tủ, (2) danh sách khung, và (3) tùy chọn Quản lý CAD.](https://storage.googleapis.com/jegavn_kb/images/32755021-0843-46c7-8209-711b184caab6.png)

1.1. Tải lên Khung CAD

![Hộp thoại Khung mới để tải lên tệp DWG.](https://storage.googleapis.com/jegavn_kb/images/5dbf3645-a088-4974-9313-879749b58a8f.png)

Tương ứng với các danh mục này trên JEGA AiHouse (mô-đun Bố cục và Chú thích).

![Menu thả xuống hiển thị các loại bản vẽ khác nhau trong mô-đun Bố cục và Chú thích.](https://storage.googleapis.com/jegavn_kb/images/5b661bbc-fe52-42d2-a755-32531b543bd0.png)

1.2. Thiết kế Khung

Giao diện Thiết kế Khung sẽ tự động bật lên sau khi một khung được tải lên và lưu thành công. Nhấp vào nút **Thiết kế Khung (Frame Design)** trong danh sách khung cũng sẽ vào giao diện này.

![Danh sách khung với nút Thiết kế Khung được đánh dấu.](https://storage.googleapis.com/jegavn_kb/images/f3387611-3c41-480a-8527-e9f77218914f.png)

Sau khi điều chỉnh vùng vẽ và lưu, tọa độ và vị trí hiện tại của bản vẽ sẽ được ghi lại. Khi xuất bản vẽ từ **Bố cục và Chú thích (Layout and Annotation)**, bản vẽ sẽ được hiển thị trong khu vực được chỉ định này.

![Giao diện Thiết kế Khung hiển thị khu vực vẽ có thể điều chỉnh.](https://storage.googleapis.com/jegavn_kb/images/68cd5db1-8364-443b-b0c4-1970bad7ab01.png)

2. Quản lý Yếu tố Hệ thống

Quản lý yếu tố hệ thống về cơ bản cho phép người dùng tải lên các trang bìa và ghi chú thiết kế của riêng họ. Các tệp DWG được tải lên cũng yêu cầu tạo khối trong CAD cho các trang bìa và ghi chú thiết kế, theo logic và quy trình hoàn toàn giống như đối với các khối khung.

![Giao diện Quản lý yếu tố hệ thống.](https://storage.googleapis.com/jegavn_kb/images/07f551dd-9ef2-4b7f-a16e-504a706d4721.png)

3. Quản lý Quyền

Trong cột thao tác cho Khung và Khối, dưới **Thêm (More)** - **Chọn Phòng ban (Select Department)**, chọn các phòng ban. Nếu một phòng ban cụ thể được chọn cho một khung hoặc trang bìa, mục đó sẽ chỉ có hiệu lực đối với các tài khoản thuộc phòng ban đó.

![Menu Thêm với tùy chọn Chọn Phòng ban.](https://storage.googleapis.com/jegavn_kb/images/494f7355-8933-4059-8b09-fa058899daba.png)

![Hộp thoại để chọn các phòng ban áp dụng.](https://storage.googleapis.com/jegavn_kb/images/4addad42-2d5f-40c7-bfb8-590548479774.png)

4. Phụ lục

4.1. Ghi chú chính cho tệp DWG của Khung

1. Kích thước chiều dài của khung không được vượt quá 1000 đơn vị. Vượt quá giới hạn này có thể gây ra sự cố khi xuất sang định dạng PDF và PNG (do độ phân giải/số pixel quá cao làm cho việc chụp trang trở nên khó khăn).

2. Khung phải chứa chính xác một khối. Việc nhập sẽ thất bại nếu không đáp ứng điều kiện này.

3. Điểm cơ sở cho khối của khung phải được đặt bên trong khối khung. Nếu không, sẽ không có vị trí hợp lệ để đặt vùng vẽ.

Phương pháp tạo Khối Khung:

1. Chọn tất cả các yếu tố của khối khung. Nhập lệnh **EXPLODE** để phá vỡ bất kỳ khối hiện có nào:

![Lệnh EXPLODE trong phần mềm CAD.](https://storage.googleapis.com/jegavn_kb/images/56348119-2f7a-4b90-8466-725c538b0d80.png)

2. Chọn lại tất cả các yếu tố của khối tiêu đề. Nhập lệnh **WBLOCK (Write Block)** để tạo một khối mới. Chọn một điểm cơ sở bên trong khối khung. Lưu tệp.

![Hộp thoại Write Block trong phần mềm CAD.](https://storage.googleapis.com/jegavn_kb/images/6c3d4c6f-7e1d-4397-a71b-51fea8b492d5.png)