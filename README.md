# phanmemsoictc

Ứng dụng quản lý công việc đơn giản viết bằng Python. Ứng dụng cung cấp:

- Thư viện `TodoManager` để đọc/ghi danh sách công việc ra tệp JSON.
- Giao diện dòng lệnh hỗ trợ thêm, liệt kê, đánh dấu hoàn thành và xoá công việc.
- Bộ kiểm thử `pytest` minh họa cách sử dụng logic cốt lõi.

## Cài đặt

Yêu cầu Python 3.9 trở lên. Cài đặt phụ thuộc:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt  # nếu đã có
pip install pytest
```

## Sử dụng

Chạy trực tiếp CLI:

```bash
python -m app.cli add "Đọc tài liệu" --description "Tìm hiểu dự án"
python -m app.cli list
python -m app.cli done "Đọc tài liệu"
python -m app.cli remove "Đọc tài liệu"
```

Mặc định dữ liệu được lưu tại `~/.phanmemsoictc/todos.json`. Có thể thay đổi bằng tham số `--storage`.

## Kiểm thử

```bash
pytest
```
