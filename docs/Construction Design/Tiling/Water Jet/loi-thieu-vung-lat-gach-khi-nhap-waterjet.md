---
title: Lỗi thiếu vùng lát gạch khi nhập Waterjet
slug: /loi-thieu-vung-lat-gach-khi-nhap-waterjet
sidebar_label: Lỗi thiếu vùng lát gạch khi nhập Waterjet
---

Khi xử lý waterjet, có trường hợp các khu vực hiển thị trên trang lát gạch cho lần nhập đầu tiên và lần thứ hai của waterjet là khác nhau, và có trường hợp bỏ sót khu vực. Chúng ta có thể xử lý theo các bước sau:

1. Sau khi nhập tệp waterjet vào trang lát gạch nhiều lần, hãy xác nhận các khu vực bị bỏ sót sau khi nhập.

2. Quay lại giao diện CAD, sau đó di chuyển các đường đã được xử lý và nhập không có vấn đề sang bên phải, để lại các đường của khu vực có vấn đề xử lý.

![Giao diện AutoCAD hiển thị các đường nét thiết kế đã được tách ra, với phần không có vấn đề được di chuyển sang một bên.](https://storage.googleapis.com/jegavn_kb/images/6364653812634618919433006.png)

3. Nhập phím  để phá vỡ khu vực còn lại có vấn đề nhập, và nhập lại phím tắt  để chuyển đổi các đường trong khu vực này thành các đường đa tuyến (polylines).

![Giao diện AutoCAD hiển thị khu vực có vấn đề đã được cô lập và xử lý bằng cách chuyển đổi thành đường đa tuyến.](https://storage.googleapis.com/jegavn_kb/images/6364653821026804349227963.png)

4. Di chuyển các đường của khu vực đã xử lý trở lại khu vực đã xử lý trước đó ở bên phải, và sau đó nhập phím tắt  để chuyển đổi nó thành một vùng để xử lý.

![Giao diện AutoCAD hiển thị các đường nét thiết kế đã được kết hợp lại thành một vùng hoàn chỉnh sau khi xử lý.](https://storage.googleapis.com/jegavn_kb/images/6364653833436532643148586.png)