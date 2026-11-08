# Thiệp mời tốt nghiệp · Hoài Minh

Trang web tĩnh (HTML/CSS/JS thuần, không cần build) chạy tốt trên máy tính và điện thoại.

## Cách hoạt động
1. Mở trang: tờ lịch tháng 11/2026, ngày 26 có chiếc mũ tốt nghiệp đang nhấp nhô.
2. Chạm vào ngày 26: mũ tung lên, pháo giấy nổ, tờ lịch bị xé, thiệp mời mở ra.
3. Trong thiệp: đếm ngược theo giây, thông tin buổi lễ, lưu vào lịch (.ics), hồi âm "Mình sẽ đến", sao chép/chia sẻ link, tung mũ.
4. Chạm vào các ngày khác trên lịch sẽ có lời nhắn dí dỏm. Nút "Dừng chuyển động" và chế độ giảm chuyển động của hệ điều hành đều được hỗ trợ.

## Điền thông tin thật
Mở `event.js` và điền: `startsAt` (giờ, ví dụ `2026-11-26T08:00:00+07:00`), `venue`, `address`, `mapUrl`, và tùy chọn `rsvpUrl` (Zalo/Messenger) hoặc `rsvpEmail` để nhận hồi âm.

## Gửi thiệp riêng cho từng người
Thêm `?guest=Tên` vào link, ví dụ `https://<user>.github.io/<repo>/?guest=Lan`. Tên sẽ hiện ở dòng "Thân mời ...". Link có `#thiep` hoặc `?open=1` sẽ mở thẳng thiệp, bỏ qua hiệu ứng.

## Deploy lên GitHub Pages
1. Tạo repository mới trên GitHub và đẩy toàn bộ thư mục này lên nhánh `main`.
2. Vào Settings > Pages > Build and deployment > Source: "Deploy from a branch", chọn `main` và thư mục `/ (root)`.
3. Sau ít phút, trang chạy tại `https://<user>.github.io/<repo>/`.

Phông Chivo tải từ Google Fonts (cần mạng, có phông dự phòng). Các file ảnh cũ trong `assets/` (ảnh NASA) không còn được dùng, có thể xóa để repo nhẹ hơn.
