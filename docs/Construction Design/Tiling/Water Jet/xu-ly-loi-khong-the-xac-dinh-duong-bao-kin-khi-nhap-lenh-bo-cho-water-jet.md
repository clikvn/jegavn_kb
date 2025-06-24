---
title: Xử lý lỗi không thể xác định đường bao kín khi nhập lệnh BO cho water jet
slug: xu-ly-loi-khong-the-xac-dinh-duong-bao-kin-khi-nhap-lenh-bo-cho-water-jet
sidebar_label: Lỗi không xác định được đường bao kín (lệnh BO)
---

Khi xử lý water jet (tia nước), nếu bạn nhập lệnh tắt **BO** để đóng vùng đa tuyến mà hệ thống báo lỗi 'không thể xác định đường bao kín' và xuất hiện các vòng tròn nhỏ, hãy thực hiện theo các bước sau:

1. Dùng hộp chọn để chọn các đường nét của hình, sau đó nhập lệnh tắt **CO** để sao chép và di chuyển chúng sang bên phải.

![Bản vẽ CAD hiển thị lựa chọn các đường nét của một mẫu phức tạp.](https://storage.googleapis.com/jegavn_kb/images/6364651697611628487947565.png)

![Bản vẽ CAD hiển thị bản gốc và bản sao của mẫu, đặt cạnh nhau.](https://storage.googleapis.com/jegavn_kb/images/6364651719821337083697131.png)

2. Xóa các đoạn thẳng đã được xử lý trên mẫu bên trái và giữ lại các đoạn thẳng chưa được đóng kín.

3. Sao chép và di chuyển các vùng có nhiều đường không thể đóng kín ra một khu vực riêng, sau đó tách chúng thành các vùng riêng lẻ. Nhập lệnh tắt **BO** để đóng đa tuyến của từng vùng riêng lẻ này.

![Bản vẽ CAD cho thấy một phần nhỏ của mẫu đã được cô lập để sửa lỗi đường bao.](https://storage.googleapis.com/jegavn_kb/images/6364652059975039422809723.png)

4. Sau khi tất cả các vùng chưa đóng kín đã được di chuyển ra ngoài và đóng lại riêng lẻ, hãy di chuyển các mẫu đã được xử lý bằng lệnh **BO** trở lại khu vực đồ họa đã sao chép ở bước đầu tiên. Cuối cùng, nhập lệnh **MY** để tạo miền mặt phẳng.