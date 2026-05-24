/**
 * RANKINGS.JS - Xử lý logic hiển thị Bảng Xếp Hạng Freelancer (Top 5)
 * CHỈ SỬ DỤNG VANILLA JAVASCRIPT
 */

// Dữ liệu Top 5 mặc định (dùng làm fallback nếu MockAPI trống hoặc chưa đủ 5 người)
const MOCK_TOP_FREELANCERS = [
    {
        name: "Nguyễn Văn A",
        category: "Thiết kế Web (Frontend)",
        rating: 5.0,
        completedJobs: 28,
        email: "nguyenvana@gmail.com"
    },
    {
        name: "Trần Thị B",
        category: "Thiết kế Đồ Họa & UI/UX",
        rating: 4.9,
        completedJobs: 42,
        email: "tranthib@gmail.com"
    },
    {
        name: "Phạm Minh C",
        category: "Digital Marketing & SEO",
        rating: 4.8,
        completedJobs: 19,
        email: "phamminhc@gmail.com"
    },
    {
        name: "Lê Hoàng D",
        category: "Dịch Thuật & Nội dung",
        rating: 4.7,
        completedJobs: 15,
        email: "lehoangd@gmail.com"
    },
    {
        name: "Vũ Thị E",
        category: "Lập trình Di Động",
        rating: 4.6,
        completedJobs: 11,
        email: "vuthie@gmail.com"
    }
];

// Bản đồ ánh xạ Phân Cấp / Danh Hiệu
const RANK_LEVELS = [
    {
        title: "Kim Cương",
        badgeClass: "bg-primary text-white border border-primary-subtle",
        icon: "bi-gem"
    },
    {
        title: "Bạch Kim",
        badgeClass: "bg-success text-white border border-success-subtle",
        icon: "bi-shield-shaded"
    },
    {
        title: "Vàng",
        badgeClass: "bg-warning text-dark border border-warning-subtle",
        icon: "bi-award-fill"
    },
    {
        title: "Bạc",
        badgeClass: "bg-info text-dark border border-info-subtle",
        icon: "bi-award"
    },
    {
        title: "Đồng",
        badgeClass: "bg-secondary text-white border border-secondary-subtle",
        icon: "bi-award"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    loadRankings();
});

function loadRankings() {
    // Tải danh sách users từ MockAPI
    api.get('/users')
        .then(users => {
            // Lọc ra các Freelancers
            const freelancers = users.filter(u => u.role === 'freelancer');
            
            // Sắp xếp theo rating giảm dần
            freelancers.sort((a, b) => {
                const rA = parseFloat(a.rating) || 0;
                const rB = parseFloat(b.rating) || 0;
                return rB - rA;
            });

            // Lấy Top 5
            let finalRankings = [];
            
            // Nếu số lượng freelancer trong DB >= 5, ta lấy từ DB
            if (freelancers.length >= 5) {
                finalRankings = freelancers.slice(0, 5).map((f, index) => {
                    return {
                        name: f.name,
                        category: f.category || getFallbackCategory(index),
                        rating: parseFloat(f.rating) || 4.0,
                        completedJobs: f.completedJobs || getFallbackJobs(index),
                        email: f.email
                    };
                });
            } else {
                // Nếu DB chưa có đủ 5 freelancer có rating, ta trộn dữ liệu DB vào Mock để đảm bảo giao diện đầy đủ 5 vị trí
                finalRankings = [...MOCK_TOP_FREELANCERS];
                freelancers.forEach((f, idx) => {
                    if (idx < 5) {
                        finalRankings[idx] = {
                            name: f.name,
                            category: f.category || MOCK_TOP_FREELANCERS[idx].category,
                            rating: parseFloat(f.rating) || MOCK_TOP_FREELANCERS[idx].rating,
                            completedJobs: f.completedJobs || MOCK_TOP_FREELANCERS[idx].completedJobs,
                            email: f.email
                        };
                    }
                });
            }

            // Render giao diện
            renderPodium(finalRankings.slice(0, 3));
            renderRankingsTable(finalRankings);
        })
        .catch(err => {
            console.error("Lỗi khi tải bảng xếp hạng:", err);
            // Fallback sang dữ liệu mock hoàn toàn nếu lỗi API
            renderPodium(MOCK_TOP_FREELANCERS.slice(0, 3));
            renderRankingsTable(MOCK_TOP_FREELANCERS);
        });
}

// Hàm render Bục Vinh Quang Top 3 (Thứ tự hiển thị: Hạng 2 -> Hạng 1 -> Hạng 3)
function renderPodium(top3) {
    const podiumContainer = document.getElementById('leaderboardPodium');
    if (!podiumContainer || top3.length < 3) return;

    const f1 = top3[0];
    const f2 = top3[1];
    const f3 = top3[2];

    podiumContainer.innerHTML = `
        <!-- Hạng 2 -->
        <div class="podium-col order-1">
            <div class="podium-avatar">
                ${f2.name.charAt(0).toUpperCase()}
            </div>
            <h5 class="fw-bold mb-1">${Utils.escapeHtml(f2.name)}</h5>
            <p class="text-muted small mb-1">${f2.category}</p>
            <div class="mb-3 small">
                <span class="badge ${RANK_LEVELS[1].badgeClass}"><i class="bi ${RANK_LEVELS[1].icon} me-1"></i>${RANK_LEVELS[1].title}</span>
            </div>
            <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i> <span class="fw-bold text-dark">${f2.rating.toFixed(1)}</span>
            </div>
            <div class="podium-block podium-2">
                2
                <i class="bi bi-trophy-fill cup-icon"></i>
            </div>
        </div>

        <!-- Hạng 1 -->
        <div class="podium-col order-2">
            <div class="podium-avatar podium-avatar-1 position-relative">
                <span class="podium-crown">👑</span>
                ${f1.name.charAt(0).toUpperCase()}
            </div>
            <h4 class="fw-bold mb-1 text-primary">${Utils.escapeHtml(f1.name)}</h4>
            <p class="text-muted small mb-1">${f1.category}</p>
            <div class="mb-3">
                <span class="badge ${RANK_LEVELS[0].badgeClass}"><i class="bi ${RANK_LEVELS[0].icon} me-1"></i>${RANK_LEVELS[0].title}</span>
            </div>
            <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i> <span class="fw-bold text-dark">${f1.rating.toFixed(1)}</span>
            </div>
            <div class="podium-block podium-1">
                1
                <i class="bi bi-trophy-fill cup-icon"></i>
            </div>
        </div>

        <!-- Hạng 3 -->
        <div class="podium-col order-3">
            <div class="podium-avatar">
                ${f3.name.charAt(0).toUpperCase()}
            </div>
            <h5 class="fw-bold mb-1">${Utils.escapeHtml(f3.name)}</h5>
            <p class="text-muted small mb-1">${f3.category}</p>
            <div class="mb-3 small">
                <span class="badge ${RANK_LEVELS[2].badgeClass}"><i class="bi ${RANK_LEVELS[2].icon} me-1"></i>${RANK_LEVELS[2].title}</span>
            </div>
            <div class="text-warning mb-3">
                <i class="bi bi-star-fill"></i> <span class="fw-bold text-dark">${f3.rating.toFixed(1)}</span>
            </div>
            <div class="podium-block podium-3">
                3
                <i class="bi bi-trophy-fill cup-icon"></i>
            </div>
        </div>
    `;
}

// Hàm render Bảng Xếp Hạng Top 5 đầy đủ
function renderRankingsTable(rankings) {
    const tbody = document.getElementById('rankingsTableBody');
    if (!tbody) return;

    tbody.innerHTML = rankings.map((f, idx) => {
        const rank = idx + 1;
        const level = RANK_LEVELS[idx];
        
        let rankBadgeClass = 'rank-other-badge';
        if (rank === 1) rankBadgeClass = 'rank-1-badge';
        else if (rank === 2) rankBadgeClass = 'rank-2-badge';
        else if (rank === 3) rankBadgeClass = 'rank-3-badge';

        return `
            <tr>
                <td>
                    <span class="rank-badge ${rankBadgeClass}">${rank}</span>
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center me-3 fw-bold" style="width: 38px; height: 38px; font-size: 14px;">
                            ${f.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span class="fw-bold text-dark d-block">${Utils.escapeHtml(f.name)}</span>
                            <span class="text-muted d-block" style="font-size: 11px;">${Utils.escapeHtml(f.email || '')}</span>
                        </div>
                    </div>
                </td>
                <td><span class="fw-semibold text-secondary small">${f.category}</span></td>
                <td>
                    <div class="d-flex align-items-center gap-1 text-warning">
                        <i class="bi bi-star-fill"></i>
                        <span class="fw-bold text-dark" style="font-size: 13px;">${f.rating.toFixed(1)}</span>
                    </div>
                </td>
                <td>
                    <span class="badge ${level.badgeClass} rounded-pill d-inline-flex align-items-center gap-1">
                        <i class="bi ${level.icon}"></i>
                        ${level.title}
                    </span>
                </td>
                <td class="text-end fw-bold text-dark" style="font-size: 13px;">${f.completedJobs} dự án</td>
            </tr>
        `;
    }).join('');
}

// Helpers for fallbacks
function getFallbackCategory(idx) {
    const cats = ["Thiết kế Web", "UI/UX Design", "Digital Marketing", "Biên dịch viên", "Đồ họa 3D"];
    return cats[idx % cats.length];
}
function getFallbackJobs(idx) {
    const jobs = [25, 20, 18, 14, 10];
    return jobs[idx % jobs.length];
}
