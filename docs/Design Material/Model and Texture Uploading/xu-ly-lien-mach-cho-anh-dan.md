---
title: Xử lý liền mạch cho ảnh dán
slug: /xu-ly-lien-mach-cho-anh-dan
sidebar_label: Xử lý liền mạch cho ảnh dán
---

Xin chào, quy trình xử lý texture liền mạch như sau:

1. Những lưu ý khi dán texture:

1. [Kích thước texture] Giới hạn trong vòng 5M. Texture tải lên càng nét thì texture render ra càng nét.

2. [Tên texture] Không được có các ký tự đặc biệt, ví dụ như ;,

3. [Màu texture] Kênh màu là **RGB (RGB)**

4. [Định dạng texture] **JPG (JPG)**, **JPEG (JPEG)**, **PNG (PNG)**

5. Mở "texture vân gỗ chưa qua xử lý" trong phần mềm "Photoshop" để xử lý;

![Ảnh chụp màn hình Adobe Photoshop hiển thị hình ảnh texture gỗ, với các bảng điều khiển lớp và màu sắc có thể nhìn thấy ở phía bên phải.](https://storage.googleapis.com/jegavn_kb/images/image_1678711386873.png)

6. Chọn **Bộ lọc (Filter)** → **Khác (Other)** → **Dịch chuyển (Displace)**;

![Một người dùng điều hướng menu 'Bộ lọc' trong phần mềm chỉnh sửa ảnh để chọn tùy chọn 'Dịch chuyển'.](https://storage.googleapis.com/jegavn_kb/images/image_1678711361751.png)

7. Trượt "Ngang" và "Dọc" để quan sát xem có đường nối trong texture không và cố gắng làm cho các đường nối gần giữa hơn;

![Một người dùng đang điều chỉnh độ lệch của một texture hình ảnh trong phần mềm chỉnh sửa ảnh, với một hộp thoại hiển thị các giá trị độ lệch ngang và dọc và một hộp màu đỏ làm nổi bật một phần của canvas hình ảnh và trường nhập độ lệch dọc.](https://storage.googleapis.com/jegavn_kb/images/image_1678711408952.png)

8. Chọn **công cụ Marquee (marquee tool)**, phím tắt "M", điều chỉnh giá trị điều chỉnh **Lông vũ (Feather)** (giá trị có thể được điều chỉnh tùy ý), khuyến nghị là từ 1 - 10;

![Giao diện Adobe Photoshop được hiển thị với một hình ảnh texture gỗ đang mở, hiển thị các thanh công cụ và bảng điều khiển khác nhau.](https://storage.googleapis.com/jegavn_kb/images/image_1678711623276.png)

9. Chọn **Công cụ Marquee hình chữ nhật (Rectangular Marquee Tool)** để chọn phần liền mạch, và nhấn Ctrl + J để sao chép nó sau khi đóng khung;

![Ảnh chụp màn hình của Adobe Photoshop hiển thị một texture gỗ với vùng chọn hình chữ nhật bo tròn, với các mũi tên chỉ vào công cụ chọn, chính vùng chọn và bảng điều khiển lớp.](https://storage.googleapis.com/jegavn_kb/images/image_1678711655742.png)

10. Chọn phím tắt Ctrl + T và sau đó nhấp chuột trái và phải trên bàn phím hoặc sử dụng chuột để điều chỉnh texture đã sao chép để che đi đường nối;

![Hình ảnh hiển thị giao diện phần mềm chỉnh sửa đồ họa, có khả năng là Adobe Photoshop, hiển thị một tài liệu có texture gỗ và các bảng công cụ khác nhau.](https://storage.googleapis.com/jegavn_kb/images/f83233bb-a5b7-49b5-b37b-58748a0b86a9.jpg)

11. Nếu cạnh bị mờ rõ ràng, bạn có thể sử dụng **cục tẩy (eraser)** để xóa cạnh bị mờ;

![Một giao diện người dùng, có khả năng là phần mềm chỉnh sửa ảnh, hiển thị một texture gỗ trên canvas và làm nổi bật các công cụ và cài đặt khác nhau bằng các tín hiệu hình ảnh màu đỏ.](https://storage.googleapis.com/jegavn_kb/images/7254335f-6a36-4b72-9713-fc71f44aeb32.jpg)

12. Chọn phím tắt Ctrl + E, hợp nhất các lớp xuống dưới, hoặc hợp nhất bằng Ctrl + Alt + shift + E;

![Một giao diện người dùng hiển thị Adobe Photoshop với một hình ảnh texture gỗ đang mở, hiển thị bảng điều khiển lớp và phím tắt 'Ctrl+E' được làm nổi bật.](https://storage.googleapis.com/jegavn_kb/images/image_1678711711515.png)

13. Chọn lại **Bộ lọc (Filter)** → **Khác (Other)** → **Dịch chuyển (Displace)**, kiểm tra xem có đường nối không. Sau khi xác nhận không có đường nối, nhấp vào OK. Sau khi kiểm tra không có lỗi, chọn (①) **Tệp (File)** → **Lưu dưới dạng (Save As)**, nhập tên, định dạng là (②) **JPG (JPG)**, và nhấp vào **Lưu (Save)** (tên texture không được có ký tự đặc biệt).

![Một người dùng đang lưu một tệp hình ảnh trong Adobe Photoshop, làm nổi bật menu 'Tệp' và tùy chọn định dạng tệp JPEG trong hộp thoại 'Lưu dưới dạng'.](https://storage.googleapis.com/jegavn_kb/images/image_1678711732295.png)

14. Hiển thị hiệu ứng trước và sau khi xử lý:

![Hai chế độ xem cạnh nhau của nội thất một căn phòng, so sánh một hình ảnh với các khu vực được tô sáng (hiển thị 'không xử lý hình ảnh liền mạch') với một phiên bản dường như 'đã xử lý' hoặc 'đúng' không có tô sáng.](https://storage.googleapis.com/jegavn_kb/images/a6f01353-3e06-453e-a167-7134c41208c5.jpg)

Hướng dẫn chi tiết, vui lòng nhấp vào: