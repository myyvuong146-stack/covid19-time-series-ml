import { useEffect, useRef, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(
  /\/+$/,
  "",
);

const classLabels = {
  COVID: "COVID-19",
  Lung_Opacity: "Đục phổi",
  Normal: "Bình thường",
  "Viral Pneumonia": "Viêm phổi do virus",
};

function getErrorMessage(payload, status) {
  const detail = payload?.detail;
  if (typeof detail === "string") return detail;
  if (detail?.message) return detail.message;
  if (status === 404) return "Không tìm thấy API dự đoán. Hãy kiểm tra địa chỉ backend.";
  return `Không thể phân tích ảnh (mã lỗi ${status}). Vui lòng thử lại.`;
}

function App() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function chooseFile(nextFile) {
    setError("");
    setResult(null);
    if (!nextFile) return;

    if (!["image/png", "image/jpeg"].includes(nextFile.type)) {
      setFile(null);
      setError("Vui lòng chọn ảnh định dạng PNG hoặc JPEG.");
      return;
    }
    if (nextFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("Dung lượng ảnh vượt quá giới hạn 10 MB.");
      return;
    }

    setFile(nextFile);
  }

  async function analyzeImage() {
    if (!file || loading) return;

    setLoading(true);
    setError("");
    setResult(null);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, response.status));
      }
      setResult(payload);
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Không thể kết nối tới backend. Hãy khởi chạy API tại http://127.0.0.1:8000."
          : requestError.message,
      );
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="COVID-19 AI, trang chủ">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3v18M3 12h18M5.64 5.64l12.72 12.72m0-12.72L5.64 18.36"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
              <circle cx="12" cy="12" r="4.3" fill="currentColor" />
            </svg>
          </span>
          <span>
            <strong>COVID-19 AI</strong>
            <small>HỖ TRỢ NGHIÊN CỨU</small>
          </span>
        </a>
        <a className="api-link" href={`${API_URL}/docs`} target="_blank" rel="noreferrer">
          Tài liệu API <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <section className="intro">
          <span className="eyebrow">CÔNG CỤ PHÂN TÍCH HÌNH ẢNH</span>
          <h1>Phân tích ảnh X-quang ngực</h1>
          <p>
            Tải ảnh lên để mô hình AI phân loại hình ảnh thành một trong bốn nhóm.
          </p>
        </section>

        <section className="workspace" aria-label="Phân tích ảnh X-quang">
          <div className="panel upload-panel">
            <div className="panel-heading">
              <div>
                <span className="step-label">BƯỚC 1</span>
                <h2>Tải ảnh X-quang</h2>
              </div>
              <span className="format-badge">PNG · JPEG</span>
            </div>

            <input
              ref={inputRef}
              className="visually-hidden"
              type="file"
              accept="image/png,image/jpeg"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />

            {file ? (
              <div className="selected-image">
                {previewUrl && <img src={previewUrl} alt="Ảnh X-quang được chọn" />}
                <div className="image-caption">
                  <span className="file-icon" aria-hidden="true">▧</span>
                  <span className="file-details">
                    <strong title={file.name}>{file.name}</strong>
                    <small>{(file.size / (1024 * 1024)).toFixed(2)} MB · Sẵn sàng phân tích</small>
                  </span>
                  <button className="text-button" type="button" onClick={reset}>
                    Xóa
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={`dropzone${dragging ? " is-dragging" : ""}`}
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  chooseFile(event.dataTransfer.files?.[0]);
                }}
              >
                <span className="upload-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 006.5 20h11a1.5 1.5 0 001.5-1.5V14"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <strong>Kéo thả ảnh vào đây</strong>
                <span>hoặc <span className="browse-link">chọn ảnh từ thiết bị</span></span>
                <small>PNG hoặc JPEG · Tối đa 10 MB</small>
              </button>
            )}

            {error && (
              <div className="error-message" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            <button
              className="analyze-button"
              type="button"
              disabled={!file || loading}
              onClick={analyzeImage}
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  Đang phân tích ảnh...
                </>
              ) : (
                <>
                  Phân tích hình ảnh
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
            <p className="privacy-note">
              <span aria-hidden="true">▣</span> Ảnh được xử lý trực tiếp bởi backend của bạn.
            </p>
          </div>

          <div className="panel result-panel" aria-live="polite">
            <div className="panel-heading">
              <div>
                <span className="step-label">BƯỚC 2</span>
                <h2>Kết quả phân tích</h2>
              </div>
              {result && <span className="complete-badge">Hoàn tất</span>}
            </div>

            {result ? (
              <div className="result-content">
                <div className="prediction-summary">
                  <span className="result-check" aria-hidden="true">✓</span>
                  <div>
                    <span className="result-overline">NHÓM DỰ ĐOÁN</span>
                    <h3>{classLabels[result.predicted_class] || result.predicted_class}</h3>
                  </div>
                  <strong className="confidence">
                    {Number(result.confidence).toFixed(2)}<small>%</small>
                  </strong>
                </div>

                <div className="probability-heading">
                  <strong>Phân bố điểm số</strong>
                  <span>Softmax</span>
                </div>
                <div className="probability-list">
                  {Object.entries(result.probabilities || {}).map(([name, value]) => (
                    <div className="probability-row" key={name}>
                      <div className="probability-label">
                        <span>{classLabels[name] || name}</span>
                        <strong>{Number(value).toFixed(2)}%</strong>
                      </div>
                      <div className="progress-track">
                        <div
                          className={`progress-value${name === result.predicted_class ? " is-predicted" : ""}`}
                          style={{ width: `${Math.min(100, Math.max(0, Number(value)))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="secondary-button" type="button" onClick={reset}>
                  Phân tích ảnh khác
                </button>
              </div>
            ) : (
              <div className="empty-result">
                <span className="result-placeholder" aria-hidden="true">
                  <svg viewBox="0 0 48 48" fill="none">
                    <rect x="7" y="8" width="34" height="32" rx="5" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M17 17v14m14-14v14M17 24h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </span>
                <strong>Chưa có kết quả</strong>
                <p>Kết quả phân tích sẽ hiển thị tại đây sau khi bạn tải ảnh lên.</p>
                <div className="class-chips">
                  <span>COVID-19</span>
                  <span>Đục phổi</span>
                  <span>Bình thường</span>
                  <span>Viêm phổi do virus</span>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="disclaimer">
          <span aria-hidden="true">ⓘ</span>
          <p>
            <strong>Lưu ý:</strong> Đây là công cụ hỗ trợ nghiên cứu, không thay thế chẩn đoán hoặc tư vấn y khoa.
            Điểm số của mô hình không phải xác suất đã được hiệu chỉnh.
          </p>
        </aside>
      </main>

      <footer>
        <span>COVID-19 AI <span aria-hidden="true">·</span> Công cụ nghiên cứu</span>
        <span>ResNet50 · 4 nhóm phân loại</span>
      </footer>
    </div>
  );
}

export default App;
