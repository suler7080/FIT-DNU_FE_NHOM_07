/**
 * ONBOARDING.JS - Xử lý logic tương tác màn hình chào mừng gigGo
 * Thiết kế Split-screen cao cấp, Carousel tự động và Parallax trôi nổi
 */

(function () {
    const ONBOARDING_KEY = 'giggo_onboarding_viewed';

    // Kiểm tra xem có hiển thị onboarding không
    function shouldShowOnboarding() {
        if (localStorage.getItem(ONBOARDING_KEY) === 'true') {
            return false;
        }
        if (sessionStorage.getItem(ONBOARDING_KEY) === 'true') {
            return false;
        }
        return true;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const overlay = document.getElementById('onboardingOverlay');
        const startBtn = document.getElementById('btnOnboardingStart');
        const dontShowCheckbox = document.getElementById('dontShowAgain');
        const roleCards = document.querySelectorAll('.role-card');
        const slides = document.querySelectorAll('.showcase-slide');
        const indicators = document.querySelectorAll('.indicator-dot');
        const floatingShapes = document.querySelectorAll('.floating-shape');

        if (!overlay) return;

        // Nếu đã xem rồi, giải phóng tài nguyên lập tức
        if (!shouldShowOnboarding()) {
            overlay.remove();
            return;
        }

        // Kích hoạt hiển thị Onboarding và khóa cuộn trang
        overlay.style.setProperty('display', 'flex', 'important');
        document.body.classList.add('no-scroll');

        // ---------------------------------------------------------
        // 1. HIỆU ỨNG PARALLAX THEO CON TRỎ CHUỘT (Interactive Parallax)
        // ---------------------------------------------------------
        overlay.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Biên độ lệch so với tâm màn hình
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;

            floatingShapes.forEach((shape) => {
                const speed = parseFloat(shape.getAttribute('data-speed')) || 1;
                // Tính toán tọa độ dịch chuyển nhẹ
                const moveX = (deltaX * speed) / 45;
                const moveY = (deltaY * speed) / 45;
                
                // Cập nhật CSS transform kèm xoay nhẹ
                shape.style.transform = `translate(${moveX}px, ${moveY}px) rotate(${moveX * 0.1}deg)`;
            });
        });

        // ---------------------------------------------------------
        // 2. LOGIC TỰ ĐỘNG CHẠY CAROUSEL DỊCH VỤ (Left Showcase Slider)
        // ---------------------------------------------------------
        let activeSlideIndex = 0;
        let slideInterval = null;

        function showSlide(index) {
            slides.forEach((slide) => slide.classList.remove('active'));
            indicators.forEach((ind) => ind.classList.remove('active'));

            slides[index].classList.add('active');
            indicators[index].classList.add('active');
            activeSlideIndex = index;
        }

        function nextSlide() {
            let nextIndex = (activeSlideIndex + 1) % slides.length;
            showSlide(nextIndex);
        }

        function startAutoSlider() {
            stopAutoSlider();
            slideInterval = setInterval(nextSlide, 4500); // Đổi slide mỗi 4.5 giây
        }

        function stopAutoSlider() {
            if (slideInterval) {
                clearInterval(slideInterval);
            }
        }

        // Đăng ký sự kiện khi người dùng tự click chọn chỉ số slide
        indicators.forEach((ind) => {
            ind.addEventListener('click', () => {
                const slideIndex = parseInt(ind.getAttribute('data-slide'));
                showSlide(slideIndex);
                startAutoSlider(); // Reset lại bộ đếm thời gian
            });
        });

        // Khởi động slider tự động
        if (slides.length > 0) {
            startAutoSlider();
        }

        // Dừng slider khi rê chuột vào panel trái để dễ đọc, rời đi thì chạy lại
        const showcasePanel = document.querySelector('.onboarding-showcase');
        if (showcasePanel) {
            showcasePanel.addEventListener('mouseenter', stopAutoSlider);
            showcasePanel.addEventListener('mouseleave', startAutoSlider);
        }

        // ---------------------------------------------------------
        // 3. LOGIC CHỌN VAI TRÒ (Right Role Cards Selection)
        // ---------------------------------------------------------
        let selectedRole = 'client'; // Mặc định là Khách hàng

        roleCards.forEach((card) => {
            card.addEventListener('click', () => {
                roleCards.forEach((c) => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedRole = card.getAttribute('data-role');
            });
        });

        // ---------------------------------------------------------
        // 4. HOÀN THÀNH ONBOARDING & ĐÓNG GIAO DIỆN
        // ---------------------------------------------------------
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                const dontShowAgain = dontShowCheckbox ? dontShowCheckbox.checked : false;

                // Lưu cờ vào bộ nhớ tùy thuộc lựa chọn của người dùng
                if (dontShowAgain) {
                    localStorage.setItem(ONBOARDING_KEY, 'true');
                } else {
                    sessionStorage.setItem(ONBOARDING_KEY, 'true');
                }

                // Dừng bộ chạy slide tự động để tối ưu tài nguyên CPU
                stopAutoSlider();

                // Thêm class tạo hiệu ứng trượt và mờ dần biến mất
                overlay.classList.add('onboarding-fade-out');

                // Mở khóa cuộn trang chủ ngay lập tức
                document.body.classList.remove('no-scroll');

                // Đợi transition CSS hoàn tất rồi xóa hoàn toàn khỏi DOM
                setTimeout(() => {
                    overlay.remove();
                }, 700);
            });
        }
    });
})();
