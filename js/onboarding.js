/**
 * ONBOARDING.JS - Xử lý logic hiển thị và tương tác của màn hình chào mừng
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

(function () {
    // Tên các key lưu trong storage
    const SESSION_KEY = 'giggo_onboarded';
    const LOCAL_KEY = 'giggo_onboarded_forever';

    // Chạy kiểm tra trạng thái trước khi DOM loaded hoàn toàn để tránh nhấp nháy giao diện chính
    const hasVisitedSession = sessionStorage.getItem(SESSION_KEY);
    const hasVisitedForever = localStorage.getItem(LOCAL_KEY);

    // Nếu đã xem rồi, ẩn màn hình chào mừng ngay lập tức bằng cách chèn thẻ style tạm thời
    if (hasVisitedSession || hasVisitedForever) {
        const style = document.createElement('style');
        style.innerHTML = '#onboardingOverlay { display: none !important; }';
        document.head.appendChild(style);
        return;
    }

    // Khi DOM đã sẵn sàng, thực hiện bind các sự kiện
    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('onboardingOverlay');
        const startBtn = document.getElementById('onboardingStartBtn');
        const checkbox = document.getElementById('onboardingSkipForever');
        
        if (!overlay || !startBtn) return;

        // Khóa cuộn trang của body
        document.body.classList.add('no-scroll');

        // Lắng nghe sự kiện click vào nút "Bắt đầu khám phá"
        startBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Nếu người dùng chọn "Không hiển thị lại lần sau"
            if (checkbox && checkbox.checked) {
                localStorage.setItem(LOCAL_KEY, 'true');
            } else {
                // Ngược lại chỉ lưu cho phiên làm việc hiện tại
                sessionStorage.setItem(SESSION_KEY, 'true');
            }

            // Kích hoạt transition ẩn bằng cách thêm class .hidden
            overlay.classList.add('hidden');
            
            // Mở khóa cuộn trang của body
            document.body.classList.remove('no-scroll');

            // Sau khi hiệu ứng transition CSS kết thúc (600ms), đặt display: none để giải phóng tài nguyên DOM
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 600);
        });

        // Hỗ trợ đóng nhanh bằng phím ESC (tăng trải nghiệm người dùng)
        document.addEventListener('keydown', function escPress(e) {
            if (e.key === 'Escape') {
                startBtn.click();
                document.removeEventListener('keydown', escPress);
            }
        });
    });
})();
