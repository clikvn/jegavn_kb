---
title: Làm thế nào để thiết lập card đồ họa hiệu suất cao để chạy Aihouse?
slug: /lam-the-nao-de-thiet-lap-card-do-hoa-hieu-suat-cao-de-chay-aihouse
sidebar_label: Thiết lập card đồ họa hiệu suất cao
---

Khi máy tính có nhiều hơn một card đồ họa, làm thế nào để tôi có thể thiết lập card đồ họa hiệu suất cao hơn để chạy Aihouse?

1. Đầu tiên, vui lòng nâng cấp trình điều khiển card đồ họa lên phiên bản mới nhất.

2. Nếu bạn đang sử dụng máy tính để bàn, chỉ cần cắm bộ điều hợp hiển thị vào card đồ họa chuyên dụng.

3. Vui lòng làm theo các bước dưới đây nếu bạn đang sử dụng máy tính xách tay:

:::note

:::

4. Cài đặt phiên bản mới nhất của Trình duyệt Google Chrome.

5. Sao chép ứng dụng Chrome, đổi tên thành chrome_1.

![Trình khám phá tệp hiển thị một danh sách các tệp và thư mục, với 'chrome_1.exe' được tô sáng.](https://storage.googleapis.com/jegavn_kb/images/1611220313143-01852-MQ.png)

6. Quay lại màn hình nền của bạn, nhấp chuột phải và mở **Bảng điều khiển NVIDIA (NVIDIA control panel)**.

![Menu ngữ cảnh của máy tính để bàn Windows được hiển thị, với tùy chọn 'Bảng điều khiển NVIDIA' được con trỏ chuột tô sáng.](https://storage.googleapis.com/jegavn_kb/images/1611220327012-80155-Mg.png)

7. Vào **Quản lý cài đặt 3D (Manage 3D settings)**.

![Ảnh chụp màn hình Bảng điều khiển NVIDIA hiển thị phần 'Quản lý cài đặt 3D' với tab 'Cài đặt chung' đang mở.](https://storage.googleapis.com/jegavn_kb/images/1611220345961-49511-Mw.png)

8. Chọn tab (①) **Cài đặt chương trình (Program settings)**, sau đó nhấp vào (②) **Thêm (Add)**.

![Tùy chỉnh cài đặt 3D cho một chương trình cụ thể trong Bảng điều khiển NVIDIA, với các nút 'Cài đặt chương trình' và 'Thêm' được tô sáng.](https://storage.googleapis.com/jegavn_kb/images/1611220390886-17251-NA.png)

9. Sau đó nhấp vào **Duyệt (Browse)** trong cửa sổ bật lên.

![Hộp thoại 'Chọn một chương trình' đang mở trong Bảng điều khiển NVIDIA, hiển thị danh sách các ứng dụng được sử dụng gần đây và nút 'Duyệt'.](https://storage.googleapis.com/jegavn_kb/images/1611220454124-61966-NQ.png)

10. Chọn trình duyệt chrome_1 mà bạn vừa sao chép.

![Hộp thoại tệp Windows đang mở, hiển thị nội dung của thư mục ứng dụng Chrome nơi người dùng đã chọn 'chrome_1.exe' để mở.](https://storage.googleapis.com/jegavn_kb/images/1611220471491-94959-Ng.png)

11. Chọn (①) **Bộ xử lý NVIDIA hiệu suất cao (High-performance NVIDIA processor)** và nhấp vào (②) **Áp dụng (Apply)**.

![Đang định cấu hình cài đặt 3D dành riêng cho chương trình trong Bảng điều khiển NVIDIA, chọn bộ xử lý đồ họa hiệu suất cao và chuẩn bị áp dụng các thay đổi.](https://storage.googleapis.com/jegavn_kb/images/1611220496520-51386-Nw.png)

12. Chạy trình duyệt Chrome_1, nhập địa chỉ: chrome://flags. Bật tùy chọn **Ghi đè danh sách kết xuất phần mềm (Override software rendering list)**.

![Trang Chrome Experiments (chrome://flags) với cờ 'Ghi đè danh sách kết xuất phần mềm' được tô sáng và trạng thái 'Đã bật' của nó được đóng khung.](https://storage.googleapis.com/jegavn_kb/images/1611220513965-05145-OA.png)

13. Thay đổi kế hoạch nguồn của bạn! Đặt kế hoạch nguồn đồ họa thành **Hiệu suất tối đa (Maximum performance)** (rất quan trọng).

![Cửa sổ 'Tùy chọn Nguồn' trong Windows, với kế hoạch 'Cân bằng (được khuyến nghị)' được chọn.](https://storage.googleapis.com/jegavn_kb/images/1611280021270-51468-aW1hZ2U.png)

![Cửa sổ 'Chỉnh sửa Cài đặt Gói' trong Bảng điều khiển Windows, với liên kết 'Thay đổi cài đặt nguồn nâng cao' được tô sáng.](https://storage.googleapis.com/jegavn_kb/images/1611280165112-97755-aW1hZ2U.png)

![Cài đặt nguồn nâng cao trong cửa sổ Tùy chọn Nguồn, cụ thể là Cài đặt Đồ họa Intel(R) được đặt thành Hiệu suất Tối đa.](https://storage.googleapis.com/jegavn_kb/images/1611280172179-73040-aW1hZ2U.png)

14. Khởi động lại trình duyệt Chrome_1, card đồ họa chuyên dụng của bạn sẽ hoạt động ngay bây giờ.

![Tab 'Hiệu suất' trong Trình quản lý tác vụ, hiển thị việc sử dụng CPU, Bộ nhớ, Đĩa, Wi-Fi và GPU theo thời gian thực.](https://storage.googleapis.com/jegavn_kb/images/1611220546961-86647-OQ.png)

Thiết kế vui vẻ, tận hưởng công việc của bạn!