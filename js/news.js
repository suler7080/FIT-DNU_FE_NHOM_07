/**
 * NEWS.JS - Trình đọc tin tức chi tiết & Công cụ tính phí
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

const ARTICLES = [
    {
        id: "escrow",
        category: "Hướng Dẫn",
        badgeClass: "bg-primary text-white",
        date: "24/05/2026",
        title: "Hướng Dẫn Giao Dịch An Toàn Với Hệ Thống Ký Quỹ Escrow",
        image: "img/news_escrow.png",
        summary: "Hệ thống ký quỹ giúp bảo vệ quyền lợi của cả Client và Freelancer. Tiền được giữ an toàn trên hệ thống và chỉ giải ngân khi khách hàng hài lòng...",
        content: `
            <p>Trong nền kinh tế tự do (gig economy), bảo mật thanh toán luôn là mối quan tâm hàng đầu của cả khách hàng (Client) và chuyên gia (Freelancer). Để giải quyết vấn đề này, GigGo tích hợp hệ thống <strong>Ký quỹ Escrow (Ký quỹ bảo vệ)</strong> - một tiêu chuẩn giao dịch an toàn quốc tế.</p>
            
            <h5 class="fw-bold my-3 text-primary">Hệ thống Escrow hoạt động như thế nào?</h5>
            <ol>
                <li class="mb-2"><strong>Đặt cọc ký quỹ:</strong> Sau khi thống nhất thỏa thuận dự án, Khách hàng sẽ nạp tiền và ký quỹ số tiền bằng 100% giá trị dự án. Tiền sẽ được lưu giữ an toàn trong hệ thống của GigGo thay vì chuyển trực tiếp cho Freelancer.</li>
                <li class="mb-2"><strong>Triển khai công việc:</strong> Freelancer nhận được thông báo ký quỹ thành công và bắt đầu thực hiện công việc với sự tự tin rằng ngân sách đã được đảm bảo thanh toán.</li>
                <li class="mb-2"><strong>Nghiệm thu & Giải ngân:</strong> Freelancer bàn giao sản phẩm. Khách hàng kiểm tra chất lượng. Khi khách hàng nhấn nút "Hoàn thành và Giải ngân", tiền sẽ được chuyển vào ví của Freelancer.</li>
            </ol>

            <div class="alert alert-info border-0 rounded-3 my-4">
                <h6 class="fw-bold mb-1"><i class="bi bi-shield-fill-check me-2"></i>Chính sách giải quyết tranh chấp</h6>
                <p class="mb-0 small">Nếu có bất kỳ bất đồng nào phát sinh (Freelancer trễ hạn, sản phẩm không đạt yêu cầu đã cam kết), cả hai bên đều có quyền yêu cầu đội ngũ hỗ trợ của GigGo can thiệp phân xử và hoàn trả tiền ký quỹ dựa trên chứng cứ thực tế.</p>
            </div>

            <h5 class="fw-bold my-3 text-primary">Lợi ích vượt trội</h5>
            <ul>
                <li class="mb-2"><strong>Đối với Khách hàng:</strong> Loại bỏ hoàn toàn rủi ro Freelancer "bùng" việc sau khi nhận tiền đặt cọc trước.</li>
                <li class="mb-2"><strong>Đối với Freelancer:</strong> Đảm bảo khách hàng có đủ ngân sách thanh toán sau khi hoàn thành dự án, không lo bị quỵt tiền.</li>
            </ul>
        `
    },
    {
        id: "version",
        category: "Tính Năng",
        badgeClass: "bg-success text-white",
        date: "22/05/2026",
        title: "GigGo Ra Mắt Phiên Bản 2.0 Với Nhiều Nâng Cấp Về Trải Nghiệm",
        image: "img/news_version.png",
        summary: "Phiên bản mới nâng cấp hệ thống tin nhắn thời gian thực, quản lý ví tiện dụng và cải thiện tốc độ tải trang lên đến 40%...",
        content: `
            <p>Sau nhiều tháng nghiên cứu và lắng nghe ý kiến phản hồi từ cộng đồng người dùng, đội ngũ kỹ thuật của GigGo chính thức phát hành phiên bản <strong>GigGo 2.0</strong> với giao diện cao cấp và hiệu năng vượt trội.</p>
            
            <h5 class="fw-bold my-3 text-primary">Các điểm nâng cấp đáng chú ý</h5>
            <ul>
                <li class="mb-3">
                    <strong>Giao diện Glassmorphism & Chế độ tối (Dark Mode):</strong>
                    <br>Hệ thống màu sắc được tinh chỉnh giúp giảm mỏi mắt, giao diện kính mờ sang trọng nâng tầm trải nghiệm thị giác.
                </li>
                <li class="mb-3">
                    <strong>Hộp thư tin nhắn thời gian thực:</strong>
                    <br>Tích hợp bộ trao đổi thông tin mượt mà, giúp trao đổi tệp tin và yêu cầu công việc tức thì giữa Client và Freelancer.
                </li>
                <li class="mb-3">
                    <strong>Ví điện tử & Thống kê tài chính thông minh:</strong>
                    <br>Freelancer và Client dễ dàng quản lý dòng tiền ký quỹ, lịch sử nạp rút và thu nhập ròng hàng tháng trực quan thông qua đồ thị.
                </li>
                <li class="mb-3">
                    <strong>Tối ưu hóa hiệu năng:</strong>
                    <br>Tốc độ tải trang và phản hồi API tăng 40%, giảm thiểu dung lượng tải ban đầu giúp lướt nhanh ngay cả trên kết nối mạng yếu.
                </li>
            </ul>

            <p class="mt-4">Hãy đăng nhập hệ thống ngay hôm nay để trải nghiệm các tính năng tuyệt vời này và chia sẻ cảm nghĩ của bạn với chúng tôi!</p>
        `
    },
    {
        id: "freelancers",
        category: "Vinh Danh",
        badgeClass: "bg-warning text-dark",
        date: "20/05/2026",
        title: "Vinh Danh Top 10 Freelancers Có Thành Tích Xuất Sắc Tháng 5/2026",
        image: "img/news_freelancers.png",
        summary: "Cùng vinh danh các chuyên gia đã nỗ lực hoàn thành dự án xuất sắc nhất và nhận được phản hồi 5 sao từ khách hàng trong tháng...",
        content: `
            <p>GigGo xin gửi lời chúc mừng và vinh danh đến <strong>Top 10 Freelancers xuất sắc nhất tháng 5/2026</strong>. Đây là những chuyên gia đã làm việc không mệt mỏi để hoàn thành các dự án với chất lượng vượt trội và nhận được sự đánh giá tuyệt đối 5 sao từ khách hàng.</p>
            
            <h5 class="fw-bold my-3 text-primary">Danh sách vinh danh nổi bật</h5>
            <div class="table-responsive my-3">
                <table class="table table-hover border">
                    <thead class="table-light">
                        <tr>
                            <th>Freelancer</th>
                            <th>Chuyên Ngành</th>
                            <th>Dự Án Đã Làm</th>
                            <th>Đánh Giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="fw-semibold">Nguyễn Văn A</td>
                            <td>Thiết kế Web (Frontend)</td>
                            <td>8 dự án</td>
                            <td><span class="text-warning">★★★★★ 5.0</span></td>
                        </tr>
                        <tr>
                            <td class="fw-semibold">Trần Thị B</td>
                            <td>Thiết kế Đồ Họa & UI/UX</td>
                            <td>12 dự án</td>
                            <td><span class="text-warning">★★★★★ 5.0</span></td>
                        </tr>
                        <tr>
                            <td class="fw-semibold">Phạm Minh C</td>
                            <td>Digital Marketing & SEO</td>
                            <td>6 dự án</td>
                            <td><span class="text-warning">★★★★★ 4.9</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p>Họ sẽ nhận được huy chương biểu tượng nổi bật <strong>"Top Freelancer"</strong> trên trang cá nhân cùng gói đẩy bài chào thầu miễn phí trong tháng tiếp theo như một phần quà tri ân từ GigGo.</p>
            <p class="fw-medium text-success">Bạn muốn có tên trong bảng vinh danh tháng tới? Hãy tối ưu profile và chào thầu dự án ngay hôm nay!</p>
        `
    }
];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Render News Sidebar
    renderNewsSidebar();

    // 2. Load Active Article (Based on URL query '?art=...' or default to first)
    const urlParams = new URLSearchParams(window.location.search);
    const artId = urlParams.get('art');
    loadArticle(artId || ARTICLES[0].id);

    // 3. Initialize Fee Calculator
    initFeeCalculator();
});

// Render News List in Sidebar
function renderNewsSidebar() {
    const listContainer = document.getElementById('newsSidebarList');
    if (!listContainer) return;

    listContainer.innerHTML = ARTICLES.map(art => `
        <a href="#" class="list-group-item list-group-item-action border-0 rounded-3 p-3 news-sidebar-item d-flex gap-2 align-items-start" data-art-id="${art.id}" style="transition: all 0.2s ease;">
            <div style="width: 60px; height: 60px; flex-shrink: 0; border-radius: 8px; overflow:hidden;">
                <img src="${art.image}" alt="${art.title}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div class="overflow-hidden">
                <span class="badge ${art.badgeClass} mb-1" style="font-size: 9px !important; padding: 3px 6px !important;">${art.category}</span>
                <h6 class="mb-0 text-dark fw-bold text-truncate" style="font-size: 13px;">${art.title}</h6>
                <small class="text-muted" style="font-size: 11px;">${art.date}</small>
            </div>
        </a>
    `).join('');

    // Add click listeners to items
    const items = listContainer.querySelectorAll('.news-sidebar-item');
    items.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const id = item.dataset.artId;
            loadArticle(id);
            // Smooth scroll to top of details card on mobile
            if (window.innerWidth < 992) {
                const container = document.getElementById('newsArticleContainer');
                if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Load detailed content of an article
function loadArticle(id) {
    const article = ARTICLES.find(art => art.id === id) || ARTICLES[0];
    const container = document.getElementById('newsArticleContainer');
    if (!container) return;

    // Highlight active sidebar item
    const sidebarItems = document.querySelectorAll('.news-sidebar-item');
    sidebarItems.forEach(item => {
        if (item.dataset.artId === article.id) {
            item.classList.add('active', 'bg-light');
            item.style.borderLeft = '4px solid var(--brand-primary)';
        } else {
            item.classList.remove('active', 'bg-light');
            item.style.borderLeft = '';
        }
    });

    // Render detailed markup
    container.innerHTML = `
        <div class="position-relative" style="height: 300px; overflow: hidden;">
            <img src="${article.image}" alt="${article.title}" style="width: 100%; height: 100%; object-fit: cover;">
            <div class="position-absolute top-0 start-0 m-4">
                <span class="badge ${article.badgeClass} px-3 py-2 fs-6 shadow">${article.category}</span>
            </div>
        </div>
        <div class="card-body p-4 p-md-5">
            <div class="d-flex align-items-center gap-2 text-muted mb-3 small">
                <i class="bi bi-calendar3"></i> <span>Ngày đăng: ${article.date}</span>
                <span class="mx-2">•</span>
                <i class="bi bi-person-fill"></i> <span>Ban Biên Tập GigGo</span>
            </div>
            <h2 class="fw-bold mb-4 text-dark" style="font-size: 26px; line-height: 1.3;">${article.title}</h2>
            <hr class="my-4 text-muted opacity-25">
            <div class="article-content text-muted" style="line-height: 1.8; font-size: 15px;">
                ${article.content}
            </div>
        </div>
    `;
}

// Interactive Fee Calculator Logic
function initFeeCalculator() {
    const clientInput = document.getElementById('clientInputAmount');
    const freelancerInput = document.getElementById('freelancerInputAmount');

    if (!clientInput || !freelancerInput) return;

    function formatNumber(num) {
        return num.toLocaleString('vi-VN') + ' VNĐ';
    }

    function updateClientCalc() {
        const val = parseFloat(clientInput.value) || 0;
        const fee = Math.round(val * 0.07);
        const receive = Math.max(0, val - fee);
        
        const totalEscrowEl = document.getElementById('clientTotalEscrow');
        const freelancerReceiveEl = document.getElementById('clientFreelancerReceive');

        if (totalEscrowEl) totalEscrowEl.textContent = formatNumber(val);
        if (freelancerReceiveEl) freelancerReceiveEl.textContent = formatNumber(receive);
    }

    function updateFreelancerCalc() {
        const val = parseFloat(freelancerInput.value) || 0;
        const fee = Math.round(val * 0.07);
        const receive = Math.max(0, val - fee);

        const totalBidEl = document.getElementById('freelancerTotalBid');
        const platformFeeEl = document.getElementById('freelancerPlatformFee');
        const realReceiveEl = document.getElementById('freelancerRealReceive');

        if (totalBidEl) totalBidEl.textContent = formatNumber(val);
        if (platformFeeEl) platformFeeEl.textContent = '-' + formatNumber(fee);
        if (realReceiveEl) realReceiveEl.textContent = formatNumber(receive);
    }

    clientInput.addEventListener('input', updateClientCalc);
    freelancerInput.addEventListener('input', updateFreelancerCalc);

    // Initial updates
    updateClientCalc();
    updateFreelancerCalc();
}
