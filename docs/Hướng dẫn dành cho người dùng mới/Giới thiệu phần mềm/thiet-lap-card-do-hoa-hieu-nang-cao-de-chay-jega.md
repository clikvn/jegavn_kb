---
title: Thiết lập Card đồ họa Hiệu năng cao để chạy JEGA
slug: /thiet-lap-card-do-hoa-hieu-nang-cao-de-chay-jega
sidebar_label: Thiết lập Card đồ họa Hiệu năng cao
---

Khi máy tính có nhiều hơn một card đồ họa, bạn có thể định cấu hình cho JEGA chạy trên card đồ họa có hiệu năng cao hơn để có trải nghiệm mượt mà hơn. Hướng dẫn này sẽ chỉ cho bạn cách thực hiện, sử dụng máy tính xách tay Dell chạy Windows 10 với trình duyệt Chrome làm ví dụ.

1. Đảm bảo trình điều khiển card đồ họa của bạn được cập nhật lên phiên bản mới nhất.

2. Nếu bạn đang sử dụng máy tính để bàn, chỉ cần cắm cáp màn hình vào cổng của card đồ họa chuyên dụng.

3. Nếu bạn đang sử dụng máy tính xách tay, hãy làm theo các bước sau:

:::info

:::

4. Cài đặt phiên bản Google Chrome mới nhất.

5. Tạo một bản sao của ứng dụng Chrome và đổi tên thành "Chrome_1".

![Trình khám phá tệp hiển thị tệp thực thi của Chrome được sao chép và đổi tên thành Chrome_1.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.1.png)

6. Quay lại màn hình chính, nhấp chuột phải và mở **Bảng điều khiển Nvidia (NVIDIA Control Panel)**.

![Menu ngữ cảnh trên màn hình desktop với Bảng điều khiển Nvidia được chọn.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.2.png)

7. Điều hướng đến **Quản lý cài đặt 3D (Manage 3D Settings)**.

![Cửa sổ Bảng điều khiển Nvidia hiển thị phần Quản lý cài đặt 3D.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.3.png)

8. Chọn tab (①) **Cài đặt chương trình (Program Settings)**, sau đó nhấp vào (②) **Thêm (Add)**.

![Các bước để thêm một chương trình trong cài đặt 3D của Nvidia, làm nổi bật tab Cài đặt chương trình và nút Thêm.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.4.png)

9. Nhấp vào **Duyệt qua (Browse)**.

![Hộp thoại Thêm với nút Duyệt qua được làm nổi bật.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.5.png)

10. Chọn trình duyệt "Chrome_1" bạn vừa sao chép.

![Chọn tệp thực thi Chrome_1 trong trình khám phá tệp.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.6.png)

11. Chọn (②) **Bộ xử lý Nvidia hiệu suất cao (High-performance NVIDIA processor)** từ menu thả xuống và nhấp vào **Áp dụng (Apply)**.

![Chọn bộ xử lý Nvidia hiệu suất cao làm bộ xử lý đồ họa ưa thích.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.7.png)

12. Chạy trình duyệt Chrome_1, nhập `chrome://flags` vào thanh địa chỉ, và bật tùy chọn **Ghi đè danh sách kết xuất phần mềm (Override software rendering list)**.

![Trang cờ của Chrome với tùy chọn Ghi đè danh sách kết xuất phần mềm được bật.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.8.png)

:::danger

:::

13. Thay đổi chế độ nguồn của bạn. Đặt chế độ sử dụng đồ họa thành **Hiệu suất tối đa (Maximum performance)**.

![Cửa sổ Tùy chọn Nguồn trong Bảng điều khiển.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.9.png)

![Thay đổi cài đặt kế hoạch nguồn nâng cao.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.10.png)

![Đặt cài đặt đồ họa Intel thành Hiệu suất tối đa.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.11.png)

14. Khởi động lại trình duyệt Chrome_1. Card đồ họa chuyên dụng của bạn bây giờ sẽ hoạt động.

![Trình quản lý tác vụ hiển thị GPU chuyên dụng đang hoạt động.](https://storage.googleapis.com/jegavn_kb/image_jegavn/4.12.png)