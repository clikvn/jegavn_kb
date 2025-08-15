---
title: Tại sao hình ảnh được kết xuất lại chuyển sang màu đen
slug: /tai-sao-hinh-anh-duoc-ket-xuat-lai-chuyen-sang-mau-den
sidebar_label: Tại sao hình ảnh được kết xuất lại chuyển sang màu đen
---

Xin chào, nếu hình ảnh được hiển thị toàn màu đen hoặc toàn màu trắng thì thường do ba tình huống sau gây ra:

1. Vấn đề góc kết xuất: Nếu góc nhìn nằm trong tường hoặc bị vật gì đó chặn, hình ảnh kết xuất sẽ toàn màu đen. Nên nhấp vào chế độ xem (①) **Dạo quanh (Roam)** ở góc trên bên phải để xem vị trí của chấm xanh góc nhìn trên (②) bản đồ nhỏ và thử kết xuất ở giữa vùng màu xám (giữa không gian phòng);

![Giao diện phần mềm thiết kế 3D hiển thị trình chỉnh sửa mặt bằng và bảng thuộc tính, làm nổi bật chế độ xem hiện tại là (①) Dạo quanh và (②) bản đồ nhỏ.](https://storage.googleapis.com/jegavn_kb/image_jegavn/233.1.png)

2. Góc nhìn bị kẹt trong tường, bật chức năng cắt camera, giảm giá trị của (①) **Ống kính (Lens)** hoặc đẩy ống kính về phía trước rồi render;

![Người dùng đang điều chỉnh cài đặt phối cảnh của (①) Ống kính trong phần mềm kết xuất 3D.](https://storage.googleapis.com/jegavn_kb/image_jegavn/233.2.png)

3. Không có nguồn sáng trong mặt bằng: Không gian phòng sẽ tối nếu không có cửa ra vào, cửa sổ và đèn. Cần bổ sung ánh sáng phù hợp cho không gian hiện tại bằng cách sử dụng (①) Bảng quản lý nguồn sáng để thêm đèn vào (②) Khu vực thiết kế mặt bằng. Nên đặt đèn chiếu sáng bổ sung trên giao diện kết xuất ở giữa phòng và thay đổi độ sáng để kết xuất.

![Người dùng đang cấu hình nguồn sáng trong phần mềm thiết kế mặt bằng, với (①) Bảng quản lý nguồn sáng và (②) Khu vực thiết kế mặt bằng tổng thể được hiển thị.](https://storage.googleapis.com/jegavn_kb/image_jegavn/233.3.png)