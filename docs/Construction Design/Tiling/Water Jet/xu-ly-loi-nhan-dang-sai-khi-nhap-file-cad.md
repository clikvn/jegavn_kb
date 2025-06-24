---
title: Xử lý lỗi nhận dạng sai khi nhập file CAD
slug: xu-ly-loi-nhan-dang-sai-khi-nhap-file-cad
sidebar_label: Xử lý lỗi nhận dạng sai khi nhập file CAD
---

Xin chào, nếu việc nhận dạng khi nhập file CAD không chính xác, vui lòng lưu ý các điểm sau:

1. Thuộc tính của đoạn đường đồ họa là một (①) **Đa tuyến (Polyline)**.

2. Nếu đó là một rãnh tròn, hai đầu phải được ngắt kết nối và không liên tục để đảm bảo chúng ở cùng một mức. Sau đó, giá trị độ sâu của rãnh DMS có thể được sửa đổi bình thường.

3. Kích thước chiều dài và chiều rộng của đồ họa CAD phải tương ứng một-một với kích thước chiều dài và chiều rộng của tấm DMS.

![Ảnh chụp màn hình AutoCAD hiển thị thuộc tính của một đối tượng được chọn, làm nổi bật rằng đó là một Đa tuyến (Polyline).](https://storage.googleapis.com/jegavn_kb/images/image_1667806448914.png)

![Một thiết kế hình tròn trong AutoCAD, minh họa rằng hai đầu của rãnh phải được ngắt kết nối.](https://storage.googleapis.com/jegavn_kb/images/image_1667806355440.png)

![Giao diện AutoCAD hiển thị sự tương ứng về kích thước giữa đồ họa và trình quản lý sửa chữa.](https://storage.googleapis.com/jegavn_kb/images/image_1667807315512.png)