---
title: "Tối ưu hóa logic của bộ sưu tập: Không thể thu thập các tài liệu không được người tạo cho phép"
slug: /toi-uu-hoa-logic-bo-suu-tap
sidebar_label: "Tối ưu hóa logic bộ sưu tập"
---

:::info

:::

I. Giới thiệu chức năng

1. Vật liệu hợp lệ: Vật liệu mà cá nhân có quyền sử dụng, bao gồm vật liệu nền tảng, vật liệu cá nhân tải lên, vật liệu được doanh nghiệp cho phép, vật liệu do cửa hàng tải lên và vật liệu do doanh nghiệp áp dụng từ các tổ chức khác.

2. Vật liệu không hợp lệ: Vật liệu không bật 3D (is3D=0) hoặc đã xóa (isdelete=1), vật liệu mà tổ chức liên kết chưa cho phép sử dụng cá nhân và vật liệu mà bên thuê liên kết chưa được các tổ chức khác cho phép sử dụng (chẳng hạn như vật liệu từ các tổ chức, v.v.).

II. Các bước vận hành

1. Thu thập từng mục: Vật liệu hợp lệ có hiển thị **nút thu thập (Collect button)** → Có thể thu thập; Vật liệu không hợp lệ → Không thể thu thập.

2. Bộ sưu tập kết hợp: **Nút bộ sưu tập (Collection button)** được hiển thị. Nếu tất cả các vật liệu trong bộ sưu tập đều hợp lệ → Có thể thu thập; Nếu bộ sưu tập chứa một hoặc nhiều vật liệu không hợp lệ → Có thể thu thập các vật liệu hợp lệ trong bộ sưu tập.