---
title: Xử lý lỗi parquet thất bại
slug: xu-ly-loi-parquet-that-bai
sidebar_label: Xử lý lỗi parquet thất bại
---

Nếu gặp phải tình huống như vậy, cần thực hiện các thao tác sau:

1. Đầu tiên, hãy kiểm tra kích thước của water jet. Đối với một file CAD water jet thông thường, kích thước tệp thường không quá 5M. Nếu file CAD của bạn trên 10M, thường có vấn đề với water jet này. Sao chép riêng parquet này, sau đó tạo một tệp mới, dán vào và lưu lại;

2. Mở file CAD. Đừng kiểm tra các đường nét trước; hãy nhấp đúp vào nút giữa của chuột để xem có gì khác bên trong water jet ngoài parquet này không, chẳng hạn như:

![Một màn hình CAD hiển thị một thiết kế parquet chính và các yếu tố đi lạc ở xa, minh họa sự cần thiết phải dọn dẹp tệp.](https://storage.googleapis.com/jegavn_kb/images/9bf05c4876994544bf3eb603028939c4.png)

Tạo một file CAD mới, sao chép riêng nó ra, lưu lại và tải lên.

1. Nếu chỉ có một mẫu trong toàn bộ file CAD, nhưng nó vẫn không hiển thị hoặc bị thiếu dòng khi nhập. Cần phải kiểm tra loại cấu trúc của water jet này,

:::note

Water jet 3.0 không hỗ trợ 

**vùng (regions)**

! Ngoài ra, water jet 3.0 không hỗ trợ 

**khối (blocks)**

!

:::

Nó cần được phá vỡ bằng cách nhấn X và tải lên lại.