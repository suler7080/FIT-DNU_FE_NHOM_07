/**
 * ONBOARDING.JS - Premium Interactive Onboarding Screen for GigGo
 * Phong cách: Immersive Dark Theme, Auto-play Slider & Active Role Selection
 */

(function () {
  const ONBOARDING_KEY = 'giggo_onboarding_seen';

  // Check if onboarding should be displayed
  function shouldShowOnboarding() {
    // Clear old deprecated key to force reload the new overlay for past users
    if (localStorage.getItem('giggo_onboarding_viewed')) {
      localStorage.removeItem('giggo_onboarding_viewed');
    }
    if (sessionStorage.getItem('giggo_onboarding_viewed')) {
      sessionStorage.removeItem('giggo_onboarding_viewed');
    }
    return localStorage.getItem(ONBOARDING_KEY) !== 'true';
  }

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('onboardingOverlay');
    const btnExplore = document.getElementById('btnExplore') || document.getElementById('btnOnboardingStart');
    const chkDontShowAgain = document.getElementById('chkDontShowAgain') || document.getElementById('dontShowAgain');
    
    const roleCards = document.querySelectorAll('#onboardingOverlay .role-card');
    const slides = document.querySelectorAll('#onboardingOverlay .slide');
    const dots = document.querySelectorAll('#onboardingOverlay .dot');

    if (!overlay) return;

    // If already seen, remove from DOM immediately to save resources
    if (!shouldShowOnboarding()) {
      overlay.remove();
      return;
    }

    // Show onboarding and lock page scrolling
    overlay.style.display = 'flex';
    setTimeout(() => {
      overlay.classList.add('active');
    }, 50);
    document.body.classList.add('no-scroll');

    // ==========================================
    // 1. SLIDESHOW CAROUSEL LOGIC
    // ==========================================
    let currentSlide = 0;
    let slideshowInterval;

    function showSlide(index) {
      if (slides.length === 0 || dots.length === 0) return;

      // Remove active class from current slide and dot
      slides[currentSlide].classList.remove('active');
      dots[currentSlide].classList.remove('active');

      // Update current index
      currentSlide = index;

      // Add active class to target slide and dot
      slides[currentSlide].classList.add('active');
      dots[currentSlide].classList.add('active');
    }

    function nextSlide() {
      let targetIndex = (currentSlide + 1) % slides.length;
      showSlide(targetIndex);
    }

    function startSlideshow() {
      stopSlideshow();
      if (slides.length > 0) {
        slideshowInterval = setInterval(nextSlide, 4000);
      }
    }

    function stopSlideshow() {
      if (slideshowInterval) {
        clearInterval(slideshowInterval);
      }
    }

    // Initialize slideshow
    if (slides.length > 0) {
      startSlideshow();
    }

    // Manual control: Click on dots
    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        showSlide(index);
        startSlideshow(); // Reset timer
      });
    });

    // Pause on hover
    const leftPane = document.querySelector('#onboardingOverlay .onboarding-left');
    if (leftPane) {
      leftPane.addEventListener('mouseenter', stopSlideshow);
      leftPane.addEventListener('mouseleave', startSlideshow);
    }

    // ==========================================
    // 2. ROLE CARDS MUTUAL EXCLUSION
    // ==========================================
    roleCards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active class from all cards
        roleCards.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked card
        card.classList.add('active');
      });
    });

    // ==========================================
    // 3. CTA DISMISS & RETENTION SETTINGS
    // ==========================================
    if (btnExplore) {
      btnExplore.addEventListener('click', () => {
        const isChecked = chkDontShowAgain ? chkDontShowAgain.checked : false;

        if (isChecked) {
          localStorage.setItem(ONBOARDING_KEY, 'true');
        }

        stopSlideshow();

        // Fade out overlay
        overlay.classList.remove('active');
        overlay.classList.add('fade-out');

        // Unlock page scrolling
        document.body.classList.remove('no-scroll');

        // Clean up from DOM after transition completes (0.6s)
        setTimeout(() => {
          overlay.remove();
        }, 600);
      });
    }
  });
})();
