# COVID-19 Time Series Analysis & Machine Learning

## 1. Giới thiệu đề tài

Phân tích chuỗi thời gian COVID-19 và xây dựng mô hình học máy nhằm dự báo số ca mắc mới hằng ngày tại ba châu lục: Bắc Mỹ, Châu Á và Châu Phi.

## 2. Mục tiêu nghiên cứu

- Phân tích xu hướng dịch COVID-19 theo thời gian.
- Tiền xử lý và tổng hợp dữ liệu của ba châu lục.
- Xây dựng các đặc trưng phục vụ dự báo.
- Huấn luyện và so sánh năm mô hình Machine Learning.
- Đánh giá mô hình phù hợp với từng châu lục.

## 3. Dữ liệu sử dụng

- `covid19_north_america.csv`: Dữ liệu Bắc Mỹ.
- `covid19_asia.csv`: Dữ liệu Châu Á.
- `covid19_africa.csv`: Dữ liệu Châu Phi.
- `covid19_continent_daily_totals.csv`: Dữ liệu tổng hợp theo ngày.

Thời gian nghiên cứu: 22/01/2020 đến 27/07/2020.

Biến mục tiêu: `New_Confirmed` — số ca mắc mới hằng ngày.

## 4. Năm mô hình học máy

1. Linear Regression
2. Ridge Regression
3. Random Forest Regressor
4. Gradient Boosting Regressor
5. Decision Tree Regressor

## 5. Quy trình nghiên cứu

Data Preparation → Time Series EDA → Feature Engineering → Train/Test → Machine Learning → Evaluation.

Các mô hình được đánh giá bằng MAE, RMSE, R² và MAPE.

## 6. Cấu trúc dự án

- `data/`: Dữ liệu COVID-19.
- `notebooks/`: Notebook phân tích và thực nghiệm.
- `reports/`: Báo cáo và kết quả nghiên cứu.

## 7. Tiến độ thực hiện

Phần kiểm tra dữ liệu ban đầu được thực hiện trong `notebooks/01_data_preparation_phat.ipynb`.

Các bước EDA, Feature Engineering, huấn luyện và đánh giá mô hình sẽ được các thành viên tiếp tục hoàn thiện.

## 8. Web: Backend API nhận ảnh X-quang

Khởi chạy API từ thư mục gốc:

```bash
python -m pip install -r requirements.txt
python -m uvicorn web.backend.main:app --reload
```

Checkpoint ResNet50 mặc định vẫn là `covid.pth` ở thư mục gốc dự án. Nếu đặt checkpoint ở nơi khác, `COVID_MODEL_PATH` có thể là đường dẫn tương đối tính từ thư mục terminal hiện tại hoặc đường dẫn tuyệt đối.

```powershell
$env:COVID_MODEL_PATH = '.\models\covid.pth'
python -m uvicorn web.backend.main:app --reload
```

Mở `http://127.0.0.1:8000/` để xem thông tin API hoặc `http://127.0.0.1:8000/docs` để gửi ảnh thử. Gửi ảnh PNG hoặc JPEG tới `POST /predict` dưới dạng multipart với tên trường `image`. API giới hạn ảnh ở 10 MB, chuyển sang RGB, resize về 224×224 và chuẩn hóa theo ImageNet. Các phép lật, xoay và color jitter chỉ dành cho augmentation lúc huấn luyện, không áp dụng ngẫu nhiên khi dự đoán.

Phản hồi gồm `predicted_class`, `confidence` và phần trăm của cả bốn lớp (`COVID`, `Lung_Opacity`, `Normal`, `Viral Pneumonia`). Thứ tự các lớp phải khớp thứ tự đầu ra mà checkpoint được huấn luyện với. API xác thực checkpoint bằng cách nạp state dict nghiêm ngặt vào ResNet50; file không tương thích sẽ báo lỗi thay vì đưa ra dự đoán. Các phần trăm là điểm softmax của mô hình, không phải chẩn đoán y khoa hoặc bảo đảm xác suất đã được hiệu chỉnh.

## 9. Web: Giao diện React

Giao diện cho phép chọn hoặc kéo-thả ảnh X-quang PNG/JPEG, xem trước ảnh và gửi tới API `/predict`. Cần chạy backend và frontend ở hai cửa sổ terminal riêng:

```powershell
# instal libary
python -m pip install --upgrade pip
python -m pip install "fastapi[standard]" "uvicorn[standard]" torch torchvision torchaudio
# Terminal 1: API backend
python -m uvicorn web.backend.main:app --reload

# Terminal 2: React frontend
cd web/frontend
npm install
npm run dev
```

Frontend nằm trong `web/frontend/`. Chạy các lệnh trên từ thư mục gốc dự án.

Mở URL được Vite hiển thị (mặc định `http://localhost:5173`). Giao diện mặc định gọi API tại `http://127.0.0.1:8000`. Để dùng địa chỉ backend khác, tạo file `web/frontend/.env` với `VITE_API_URL=http://dia-chi-backend:8000`. Nếu frontend chạy ở origin khác, đặt biến `COVID_CORS_ORIGINS` khi khởi chạy backend thành danh sách origin được phép, phân cách bằng dấu phẩy. Mặc định API cho phép frontend Vite tại localhost/127.0.0.1 ở cổng 5173 và 4173.

Mã nguồn web được gom trong `web/`: `web/backend/` chứa FastAPI và `web/frontend/` chứa ứng dụng React. Lệnh khởi chạy backend được thực hiện từ thư mục gốc dự án.

Giao diện chỉ phục vụ nghiên cứu; kết quả không thay thế chẩn đoán hoặc tư vấn y khoa.
