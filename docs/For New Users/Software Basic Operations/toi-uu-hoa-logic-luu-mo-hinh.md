---
title: "Tối ưu hóa logic lưu mô hình: không thể lưu các mô hình chưa được người tạo ủy quyền"
slug: /toi-uu-hoa-logic-luu-mo-hinh
sidebar_label: "Tối ưu hóa logic lưu mô hình"
---

:::info

:::

1. Mô hình hợp lệ: là những mô hình mà cá nhân có quyền sử dụng, bao gồm mô hình của nền tảng, tải lên cá nhân, mô hình được doanh nghiệp ủy quyền, mô hình do cửa hàng tải lên và mô hình do doanh nghiệp đăng ký từ các tổ chức khác;

2. Mô hình không hợp lệ: là những mô hình không được kích hoạt 3D (is3D=0), hoặc đã bị xóa (isdelete=1), mô hình mà tổ chức liên kết không ủy quyền cho cá nhân sử dụng và mô hình mà người thuê liên kết chưa được các tổ chức khác ủy quyền sử dụng (chẳng hạn như mô hình từ các vòng kết nối, v.v.).

II. Các bước vận hành bằng đồ họa và văn bản:

1. Bộ sưu tập một mục: Các mô hình hợp lệ hiển thị **nút bộ sưu tập (collection button)** → Có thể lưu; Mô hình không hợp lệ → Không thể lưu;

2. Bộ sưu tập kết hợp: **Nút bộ sưu tập (collection button)** được hiển thị. Nếu tất cả các mô hình trong tổ hợp đều hợp lệ → Có thể lưu; Nếu tổ hợp chứa một hoặc nhiều mô hình không hợp lệ → Các mô hình hợp lệ trong tổ hợp có thể được lưu.