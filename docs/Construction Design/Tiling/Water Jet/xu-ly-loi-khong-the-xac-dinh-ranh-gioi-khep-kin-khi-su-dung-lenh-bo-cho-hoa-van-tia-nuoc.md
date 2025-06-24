---
title: Xử lý lỗi "Không thể xác định ranh giới khép kín" khi sử dụng lệnh BO cho hoa văn tia nước
slug: xu-ly-loi-khong-the-xac-dinh-ranh-gioi-khep-kin-khi-su-dung-lenh-bo-cho-hoa-van-tia-nuoc
sidebar_label: Lỗi không xác định ranh giới khép kín (lệnh BO)
---

Khi xử lý hoa văn tia nước, nếu bạn nhập phím tắt BO để đóng một khu vực đa tuyến mà hệ thống báo lỗi "không thể xác định ranh giới khép kín" và xuất hiện một vòng tròn nhỏ, hãy thực hiện theo các bước sau:

1. Chọn các đường đã được xử lý của hình đồ họa, nhập phím tắt CO để sao chép và di chuyển sang bên phải.

![Một bản vẽ trong môi trường CAD hiển thị hai thiết kế trang trí, một trong số đó có các phần được tô màu đỏ.](https://storage.googleapis.com/jegavn_kb/images/6364651719821337083697131.png)

2. Xóa các đoạn đường đã xử lý trên mẫu bên trái và giữ lại các đoạn đường chưa được đóng kín.

3. Sao chép và di chuyển riêng lẻ nhiều khu vực đường không thể đóng ra ngoài, sau đó tách chúng thành các khu vực riêng biệt. Nhập phím tắt BO để đóng đa tuyến của từng khu vực riêng lẻ.

![Một người dùng tương tác với môi trường CAD, hiển thị khu vực vẽ với các đường màu đỏ và dòng lệnh đang chờ nhập liệu.](https://storage.googleapis.com/jegavn_kb/images/6364652059975039422809723.png)

4. Sau khi tất cả các khu vực chưa đóng đã được di chuyển ra ngoài và đóng lại riêng lẻ, các mẫu đã được xử lý riêng bằng lệnh BO có thể được di chuyển trở lại khu vực đồ họa đã xử lý ở bước đầu tiên, sau đó nhập MY để tạo miền bề mặt.