# PHÂN TÍCH CHUỖI THỜI GIAN COVID-19 VÀ DỰ BÁO SỐ CA MẮC MỚI TẠI BẮC MỸ, CHÂU Á VÀ CHÂU PHI

## Tóm tắt

Báo cáo trình bày quy trình phân tích chuỗi thời gian COVID-19 tại Bắc Mỹ, châu Á và châu Phi, đồng thời xây dựng các mô hình học máy để dự báo số ca mắc mới theo ngày. Dữ liệu được tổng hợp từ ba tệp CSV khu vực, bao phủ giai đoạn 22/01/2020–27/07/2020. Sau khi kiểm tra và xử lý dữ liệu, nghiên cứu phân tích xu hướng dịch, tạo đặc trưng từ các giá trị quá khứ, chia dữ liệu theo thứ tự thời gian và so sánh năm mô hình bằng MAE, RMSE, R² và MAPE.

Kết quả trên tập kiểm tra cho thấy Linear Regression có thứ hạng tốt nhất tại Bắc Mỹ và châu Phi, trong khi Ridge Regression dự báo sai phân đứng đầu tại châu Á. Các chỉ số này mô tả hiệu quả trên giai đoạn kiểm tra đã chọn; chúng không chứng minh mô hình có thể dự báo chính xác trong các giai đoạn khác và không thay thế dự báo y tế chính thức.

**Từ khóa:** COVID-19, chuỗi thời gian, dự báo, học máy, Bắc Mỹ, châu Á, châu Phi.

## 1. Giới thiệu

Số ca mắc COVID-19 được ghi nhận theo ngày tạo thành dữ liệu chuỗi thời gian, trong đó các quan sát liền kề có quan hệ với nhau. Vì vậy, khi xây dựng mô hình dự báo, thứ tự thời gian cần được bảo toàn để tránh sử dụng thông tin tương lai trong quá trình huấn luyện hoặc kiểm tra. Nghiên cứu này sử dụng dữ liệu tổng hợp theo châu lục nhằm mô tả diễn biến số ca bệnh và so sánh khả năng dự báo của một số thuật toán hồi quy.

Mục tiêu chính là phân tích dữ liệu COVID-19 tại Bắc Mỹ, châu Á và châu Phi; xây dựng các đặc trưng phản ánh diễn biến trước đó; huấn luyện năm mô hình dự báo số ca mắc mới; và đánh giá kết quả bằng cùng một quy tắc chia dữ liệu và các chỉ số thống kê.

## 2. Dữ liệu và phương pháp

### 2.1. Dữ liệu nghiên cứu

Nghiên cứu sử dụng ba tệp `covid19_north_america.csv`, `covid19_asia.csv` và `covid19_africa.csv` trong thư mục `data/`. Mỗi tệp gồm 10 cột, trong đó có ngày, quốc gia/vùng lãnh thổ và các số liệu tích lũy `Confirmed`, `Deaths`, `Recovered`, `Active`. Khoảng thời gian của dữ liệu là từ ngày 22/01/2020 đến ngày 27/07/2020, gồm 188 ngày cho mỗi châu lục.

Tệp Bắc Mỹ có 6.580 dòng, bao gồm 24 quốc gia/vùng; tệp châu Á có 15.040 dòng, bao gồm 48 quốc gia/vùng; tệp châu Phi có 10.340 dòng, bao gồm 55 quốc gia/vùng. Quá trình kiểm tra trong notebook không phát hiện dòng trùng hoàn toàn, ngày không hợp lệ hoặc giá trị thiếu tại các cột bắt buộc. Mỗi khu vực có dữ liệu liên tục đủ 188 ngày.

### 2.2. Tiền xử lý và tổng hợp

Cột `Date` được chuyển sang kiểu ngày tháng, dữ liệu được sắp xếp theo thời gian và các trường số được chuyển sang dạng số trước khi tổng hợp. Với mỗi ngày, các số liệu tích lũy được cộng theo quốc gia/vùng để tạo tổng của châu lục. Số ca phát sinh hằng ngày được tính bằng sai phân của chuỗi tích lũy:

```text
New_Confirmed = Confirmed.diff()
New_Deaths = Deaths.diff()
New_Recovered = Recovered.diff()
```

Giá trị sai phân âm không bị thay bằng 0, vì có thể là kết quả của việc điều chỉnh dữ liệu tích lũy. Kiểm tra ghi nhận ba ngày `New_Recovered` âm tại châu Phi và một ngày tại Bắc Mỹ; không có `New_Confirmed` âm. Dữ liệu tổng hợp được đối chiếu với tệp `covid19_continent_daily_totals.csv` có sẵn và không ghi nhận chênh lệch.

### 2.3. Phân tích khám phá và tạo đặc trưng

Phân tích khám phá gồm biểu đồ số ca mắc mới theo ngày, trung bình trượt 7 ngày và 14 ngày, đường tổng ca xác nhận tích lũy, so sánh số liệu cuối kỳ, xác định ngày có số ca mắc mới cao nhất và thống kê số ca trung bình theo thứ trong tuần.

Biến mục tiêu của các mô hình là `New_Confirmed`. Bộ đặc trưng gồm sai phân bậc một `Diff_1`, các độ trễ `Lag_1`, `Lag_2`, `Lag_3`, `Lag_7`, trung bình và độ lệch chuẩn trượt 7 ngày, cùng các biến lịch `DayOfWeek`, `IsWeekend`, `Month`. Các cửa sổ trượt được tính từ dữ liệu quá khứ bằng cách dịch chuỗi một ngày (`shift(1)`) trước khi tính thống kê. Notebook kiểm tra độ trễ, các đặc trưng trượt và quan hệ `Lag_1 + Diff_1 = New_Confirmed`; các kiểm tra này đều đạt. Sau khi loại các hàng chưa đủ dữ liệu cho sai phân và độ trễ, còn 180 quan sát cho mỗi khu vực, tổng cộng 540 quan sát.

### 2.4. Chia dữ liệu và mô hình

Dữ liệu được chia tuần tự, không xáo trộn ngẫu nhiên. Với mỗi châu lục, 144 quan sát đầu tiên (30/01/2020–21/06/2020) được dùng để huấn luyện; 36 quan sát cuối (22/06/2020–27/07/2020) được dùng để kiểm tra. Cùng cách chia này được áp dụng cho cả năm mô hình để bảo đảm khả năng so sánh.

Năm mô hình được huấn luyện riêng cho từng châu lục. Linear Regression dự báo trực tiếp mức `New_Confirmed`. Ridge Regression, Random Forest Regressor, Gradient Boosting Regressor và Decision Tree Regressor dự báo `Diff_1`; các dự báo sai phân được chuyển về mức ca mắc mới bằng cách cộng `Lag_1`.

Các tham số chính được dùng gồm Ridge với `alpha=1.0`; Random Forest với 200 cây, độ sâu tối đa 6 và `min_samples_leaf=2`; Gradient Boosting với 100 cây, `learning_rate=0.05` và độ sâu 2; Decision Tree với độ sâu tối đa 5 và `min_samples_leaf=3`. Random state được đặt là 42.

Hiệu quả dự báo được đánh giá bằng MAE, RMSE, R² và MAPE. MAPE loại các mẫu có giá trị thực tế bằng hoặc rất gần 0, theo ngưỡng `1e-8`, để tránh phép chia không ổn định. Việc lựa chọn mô hình được dựa trên thứ hạng kết hợp của MAE, RMSE và R²; MAPE được sử dụng như chỉ số bổ sung.

## 3. Kết quả

### 3.1. Diễn biến số ca theo khu vực

Tại ngày cuối cùng của chuỗi dữ liệu (27/07/2020), Bắc Mỹ có 5.058.816 ca xác nhận, 207.226 ca tử vong và 1.754.456 ca hồi phục. Châu Á có 4.788.295 ca xác nhận, 104.469 ca tử vong và 3.473.508 ca hồi phục. Châu Phi có 860.537 ca xác nhận, 18.176 ca tử vong và 506.229 ca hồi phục.

| Châu lục | Ca xác nhận tích lũy | Tử vong tích lũy | Hồi phục tích lũy |
|---|---:|---:|---:|
| Bắc Mỹ | 5.058.816 | 207.226 | 1.754.456 |
| Châu Á | 4.788.295 | 104.469 | 3.473.508 |
| Châu Phi | 860.537 | 18.176 | 506.229 |

Đỉnh `New_Confirmed` trong giai đoạn quan sát tại Bắc Mỹ là 89.010 ca vào ngày 16/07/2020; tại châu Á là 85.583 ca vào ngày 23/07/2020; và tại châu Phi là 22.111 ca vào ngày 24/07/2020. Đây là các giá trị lớn nhất trong phạm vi dữ liệu hiện có, không nhất thiết đại diện cho đỉnh dịch thực tế.

Thống kê theo thứ trong tuần cho thấy số ca mắc mới trung bình cao nhất rơi vào thứ Sáu tại Bắc Mỹ và châu Phi, trong khi tại châu Á là Chủ nhật. Đây là kết quả mô tả, không đủ để kết luận ngày trong tuần có quan hệ nhân quả với số ca mắc.

### 3.2. Kết quả dự báo

Bảng dưới đây trình bày mô hình được chọn cho từng khu vực cùng các chỉ số trên tập kiểm tra:

| Châu lục | Mô hình được chọn | MAE | RMSE | R² | MAPE |
|---|---|---:|---:|---:|---:|
| Châu Phi | Linear Regression (Level/Baseline) | 1.483,790 | 1.954,025 | 0,6636 | 9,83% |
| Châu Á | Ridge Regression (Diff) | 2.810,435 | 4.646,946 | 0,7945 | 4,11% |
| Bắc Mỹ | Linear Regression (Level/Baseline) | 4.303,504 | 5.626,058 | 0,8249 | 6,71% |

Theo thứ hạng kết hợp các chỉ số MAE, RMSE và R², Linear Regression được chọn tại châu Phi và Bắc Mỹ; Ridge Regression dự báo sai phân được chọn tại châu Á. Các giá trị MAE và RMSE thể hiện sai số theo số ca, do vậy không nên so sánh trực tiếp độ lớn giữa các châu lục mà không xét quy mô dịch khác nhau. MAPE cung cấp góc nhìn tương đối nhưng cần được diễn giải cùng số mẫu hợp lệ, đặc biệt khi số ca thực tế bằng hoặc gần 0.

Phân tích phần dư của các mô hình được chọn cho thấy dự báo cao hơn thực tế trung bình khoảng 494 ca tại châu Phi; ngược lại, dự báo thấp hơn thực tế trung bình khoảng 851 ca tại châu Á và 2.981 ca tại Bắc Mỹ. Như vậy, ngoài sai số ngẫu nhiên, các mô hình còn thể hiện thiên lệch dự báo khác nhau giữa các khu vực.

## 4. Thảo luận

Kết quả cho thấy mô hình phù hợp nhất theo bộ tiêu chí đang sử dụng không giống nhau giữa các châu lục. Điều này có thể phản ánh sự khác biệt trong quy mô và diễn biến chuỗi số ca, nhưng kết quả hiện tại chưa đủ để xác định nguyên nhân. Dữ liệu đầu vào chủ yếu gồm các độ trễ, thống kê trượt và biến lịch; nghiên cứu chưa đưa vào các yếu tố dịch tễ, chính sách, mức độ xét nghiệm hoặc đặc điểm dân số.

Việc chia dữ liệu theo thời gian giúp mô phỏng tình huống dự báo tương lai tốt hơn cách chia ngẫu nhiên. Tuy nhiên, tập kiểm tra chỉ gồm 36 ngày ở giai đoạn cuối của chuỗi và kết quả có thể thay đổi nếu chọn giai đoạn đánh giá khác. Các điều chỉnh trong số liệu tích lũy cũng có thể tạo ra giá trị phát sinh âm hoặc biến động bất thường; việc giữ lại các giá trị này giúp phản ánh dữ liệu nguồn nhưng có thể ảnh hưởng đến quá trình học và diễn giải.

## 5. Hạn chế

Thứ nhất, số ca được tổng hợp theo châu lục là số tuyệt đối và chưa được chuẩn hóa theo dân số. Vì vậy, không thể diễn giải số ca cao hơn thành nguy cơ tương đối cao hơn. Thứ hai, thời gian nghiên cứu chỉ kéo dài 188 ngày, còn tập kiểm tra có 36 ngày cho mỗi châu lục. Thứ ba, dữ liệu ghi nhận và các lần điều chỉnh có thể ảnh hưởng đến chất lượng của chuỗi. Cuối cùng, notebook chưa xác định rõ đường dẫn trích dẫn nguồn phát hành ban đầu của dữ liệu, đồng thời chưa ghi đầy đủ phiên bản Python và phiên bản của tất cả thư viện; các thông tin này cần được bổ sung để tăng khả năng truy xuất và tái lập nghiên cứu.

## 6. Kết luận

Nghiên cứu đã xây dựng quy trình phân tích chuỗi thời gian COVID-19 tại Bắc Mỹ, châu Á và châu Phi bằng Python, từ kiểm tra và tổng hợp dữ liệu đến tạo đặc trưng, huấn luyện mô hình và đánh giá dự báo. Trên tập kiểm tra, Linear Regression đạt thứ hạng tốt nhất tại Bắc Mỹ và châu Phi, còn Ridge Regression dự báo sai phân đạt thứ hạng tốt nhất tại châu Á. Kết quả nhấn mạnh rằng việc lựa chọn mô hình cần được thực hiện riêng theo từng khu vực và dựa trên nhiều chỉ số.

Các kết luận chỉ áp dụng cho dữ liệu, giai đoạn và cấu hình mô hình được khảo sát. Nghiên cứu chưa chuẩn hóa theo dân số, chưa đưa vào các biến dịch tễ bổ sung và không cung cấp khoảng bất định cho dự báo. Do đó, kết quả có giá trị tham khảo về phương pháp phân tích và so sánh mô hình, không nên được sử dụng như dự báo y tế chính thức.

## Tài liệu và mã nguồn

Phân tích và các kết quả được trình bày trong notebook [`COVID19_3_CHAU_LUC.ipynb`](../notebooks/COVID19_3_CHAU_LUC.ipynb). Các tệp dữ liệu được sử dụng gồm `covid19_north_america.csv`, `covid19_asia.csv` và `covid19_africa.csv` trong thư mục `data/`. Nguồn phát hành ban đầu của dữ liệu chưa được xác định trong tài liệu dự án hiện có.
