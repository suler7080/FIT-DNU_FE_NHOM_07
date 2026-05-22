/**
 * ONBOARDING.JS - Xử lý logic hiển thị màn hình chào mừng Onboarding
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

(function () {
    const ONBOARDING_KEY = 'giggo_onboarding_viewed';

    // Hàm kiểm tra xem có cần hiển thị màn hình chào mừng hay không
    function shouldShowOnboarding() {
        // 1. Kiểm tra trong localStorage (Trạng thái ẩn vĩnh viễn)
        if (localStorage.getItem(ONBOARDING_KEY) === 'true') {
            return false;
        }
        // 2. Kiểm tra trong sessionStorage (Trạng thái ẩn trong phiên làm việc)
        if (sessionStorage.getItem(ONBOARDING_KEY) === 'true') {
            return false;
        }
        return true;
    }

    // Thực thi ngay lập tức khi DOM sẵn sàng để tránh bị giật hình (flash of content)
    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('onboardingOverlay');
        const startBtn = document.getElementById('btnOnboardingStart');
        const dontShowCheckbox = document.getElementById('dontShowAgain');

        if (!overlay) return;

        // Nếu không cần hiển thị, xóa ngay lập tức khỏi DOM để tối ưu bộ nhớ
        if (!shouldShowOnboarding()) {
            overlay.remove();
            return;
        }

        // Nếu cần hiển thị: kích hoạt display flex và khóa cuộn trang
        overlay.style.setProperty('display', 'flex', 'important');
        document.body.classList.add('no-scroll');

        // Bắt sự kiện khi click nút "Bắt đầu khám phá"
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                // Kiểm tra xem người dùng có chọn "Không hiển thị lại lần sau"
                const dontShowAgain = dontShowCheckbox ? dontShowCheckbox.checked : false;

                if (dontShowAgain) {
                    // Lưu vĩnh viễn vào localStorage
                    localStorage.setItem(ONBOARDING_KEY, 'true');
                } else {
                    // Chỉ lưu vào sessionStorage cho phiên làm việc hiện tại
                    sessionStorage.setItem(ONBOARDING_KEY, 'true');
                }

                // Thêm class tạo hiệu ứng fade-out + slide-up
                overlay.classList.add('onboarding-fade-out');

                // Mở khóa cuộn trang chủ ngay lập tức để người dùng có thể tương tác
                document.body.classList.remove('no-scroll');

                // Đợi hiệu ứng CSS hoàn thành (600ms) rồi tiến hành giải phóng tài nguyên DOM
                setTimeout(() => {
                    overlay.remove();
                }, 600);
            });
        }
    });
})();
