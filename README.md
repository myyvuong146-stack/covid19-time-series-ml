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

Phần 2: Time Series EDA

Thực hiện phân tích chuỗi thời gian trong notebooks/02_TIME_SERIES_EDA_VY.ipynb.

Trực quan hóa số ca mắc mới hằng ngày và đường trung bình trượt 7 ngày, 14 ngày.

Phân tích tổng số ca mắc tích lũy và so sánh số liệu cuối kỳ giữa ba châu lục.

Xác định ngày có số ca mắc mới cao nhất của từng châu lục.

Phân tích số ca mắc mới trung bình theo thứ trong tuần.

Kiểm tra tính liên tục của dữ liệu và ghi nhận các giá trị âm bất thường trong New_Recovered.

Các phần tiếp theo

Feature Engineering, huấn luyện mô hình Machine Learning và đánh giá kết quả sẽ tiếp tục được thực hiện theo quy trình nghiên cứu của nhóm.
