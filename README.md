# phanmemsoictc

Ứng dụng quản lý công việc đơn giản viết bằng Node.js. Ứng dụng cung cấp:

- Thư viện `TodoManager` để đọc/ghi danh sách công việc ra tệp JSON.
- Giao diện dòng lệnh hỗ trợ thêm, liệt kê, đánh dấu hoàn thành và xoá công việc.
- Bộ kiểm thử dựa trên `node:test` minh họa cách sử dụng logic cốt lõi.

## Cài đặt

Yêu cầu Node.js 18 trở lên. Dự án không sử dụng thư viện bên thứ ba, vì vậy có thể bỏ qua bước cài đặt phụ thuộc.

## Sử dụng

Chạy trực tiếp CLI từ mã nguồn:

```bash
node src/cli.js add "Đọc tài liệu" --description "Tìm hiểu dự án"
node src/cli.js list
node src/cli.js done "Đọc tài liệu"
node src/cli.js remove "Đọc tài liệu"
```

Hoặc cài đặt toàn cục để sử dụng lệnh `phanmemsoictc`:

```bash
npm install --global .
phanmemsoictc add "Đọc tài liệu"
phanmemsoictc list
```

Mặc định dữ liệu được lưu tại `~/.phanmemsoictc/todos.json`. Có thể thay đổi bằng tham số `--storage`.

## Kiểm thử

```bash
npm test
```
