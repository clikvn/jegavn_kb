---
title: Tại sao ảnh render bị đen?
slug: /tai-sao-anh-render-bi-den
sidebar_label: Tại sao ảnh render bị đen?
---

Xin chào. Nếu hình ảnh render hoàn toàn bị đen hoặc trắng, thường là do các tình huống sau:

1. Vấn đề góc render: Nếu góc nhìn nằm chính xác bên trong một bức tường hoặc bị vật gì đó che khuất, hình ảnh render sẽ hoàn toàn bị đen. Hãy điều chỉnh vị trí camera, như được hiển thị trong hình, bao gồm các cài đặt như (①) **Cắt xén (Shear)** và các thông số camera khác (②).

![Giao diện người dùng của một phần mềm render 3D, hiển thị các cài đặt phòng và điều chỉnh camera, với các chú thích về (①) Cắt xén và (②) các thông số khác.](https://storage.googleapis.com/jegavn_kb/images/6155d8c0-e592-4e5b-b8d9-08e40f80dd2e.png)

2. Mặt bằng không có cửa sổ và không sử dụng mẫu chiếu sáng. Hãy sử dụng một **mẫu chiếu sáng (lighting template)** để đặt đèn lấp đầy một cách thông minh.

![Giao diện phần mềm render 3D hiển thị một căn phòng trống, với các cài đặt về chất lượng render, bố cục, độ phân giải, mẫu chiếu sáng và cài đặt camera.](https://storage.googleapis.com/jegavn_kb/images/864a4cb1-c90e-4325-9bb1-25ff23c7370f.png)