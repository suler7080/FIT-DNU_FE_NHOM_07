/**
 * SUPPORT.JS - FAQ Search & Live Chat Simulator
 * Hỗ trợ tìm kiếm câu hỏi thường gặp & Trò chuyện ảo
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. FAQ Data & Live Search Integration
    // ----------------------------------------------------
    const FAQS = [
        {
            id: 1,
            q: "Làm sao để đảm bảo an toàn thanh toán?",
            a: "GigGo sử dụng hệ thống ký quỹ (Escrow). Tiền của bạn sẽ được giữ an toàn trên hệ thống và chỉ được giải ngân cho Freelancer khi bạn xác nhận sản phẩm bàn giao đạt yêu cầu.",
            keywords: ["thanh toan", "an toan", "tien", "nap tien", "rut tien", "escrow", "ky quy", "kyquy", "chuyen khoan", "ngan hang"]
        },
        {
            id: 2,
            q: "Tôi có thể hủy dự án đang chạy không?",
            a: "Bạn có thể gửi yêu cầu hủy dự án nếu Freelancer vi phạm deadline hoặc không đáp ứng cam kết. Tiền ký quỹ sẽ được hoàn trả cho Client hoặc đội ngũ hỗ trợ sẽ can thiệp để phân xử nếu phát sinh tranh chấp.",
            keywords: ["huy", "dung", "dinh chi", "tranh chap", "hoan tien", "tra lai", "giai quyet", "bi tre", "cham tre"]
        },
        {
            id: 3,
            q: "Mức phí nền tảng là bao nhiêu?",
            a: "Đăng ký và tìm kiếm trên GigGo là hoàn toàn miễn phí. Khi dự án được thanh toán thành công, nền tảng sẽ khấu trừ phí dịch vụ là 7% trực tiếp từ số tiền giải ngân của Freelancer.",
            keywords: ["phi", "hoa hong", "chiet khau", "phan tram", "mien phi", "dang ky", "ton kem", "gia"]
        },
        {
            id: 4,
            q: "Làm sao để đăng ký làm Freelancer?",
            a: "Để làm Freelancer trên GigGo, bạn chỉ cần bấm vào 'Đăng ký', chọn vai trò là Freelancer, điền đầy đủ thông tin cá nhân, lĩnh vực chuyên môn và cập nhật các kỹ năng cần thiết để bắt đầu chào thầu.",
            keywords: ["dang ky", "freelancer", "nhan viec", "tim viec", "ho so", "profile", "tai khoan"]
        },
        {
            id: 5,
            q: "Làm thế nào để nạp tiền hoặc rút tiền từ ví?",
            a: "Truy cập vào Ví cá nhân trên Dashboard của bạn. Chọn 'Nạp tiền' qua cổng thanh toán mô phỏng hoặc chọn 'Rút tiền', cung cấp thông tin tài khoản ngân hàng để hệ thống duyệt chi trả trong 24h.",
            keywords: ["nap tien", "rut tien", "vi", "ngan hang", "tai khoan", "chuyen tien", "nguon tien"]
        }
    ];

    // Helper function to remove accents/diacritics for search matching
    function removeDiacritics(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }

    const searchInput = document.getElementById('faqSearchInput');
    const clearBtn = document.getElementById('faqSearchClearBtn');
    const suggestionsBox = document.getElementById('faqSuggestions');

    if (searchInput && suggestionsBox) {
        searchInput.addEventListener('input', () => {
            const query = removeDiacritics(searchInput.value.trim());
            if (!query) {
                suggestionsBox.style.display = 'none';
                if (clearBtn) clearBtn.style.display = 'none';
                return;
            }

            if (clearBtn) clearBtn.style.display = 'block';

            // Filter FAQs
            const matches = FAQS.filter(faq => {
                const cleanQ = removeDiacritics(faq.q);
                const cleanA = removeDiacritics(faq.a);
                const matchesKeyword = faq.keywords.some(kw => query.includes(kw) || kw.includes(query));
                return cleanQ.includes(query) || cleanA.includes(query) || matchesKeyword;
            });

            if (matches.length > 0) {
                suggestionsBox.innerHTML = matches.map(faq => `
                    <button type="button" class="list-group-item list-group-item-action border-0 px-3 py-2.5 small d-flex align-items-center gap-2" data-faq-id="${faq.id}">
                        <i class="bi bi-question-circle text-primary fs-6"></i>
                        <span class="text-truncate fw-medium text-dark">${faq.q}</span>
                    </button>
                `).join('');
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.innerHTML = `
                    <div class="list-group-item border-0 text-muted px-3 py-3 text-center small">
                        <i class="bi bi-exclamation-circle me-1"></i> Không tìm thấy câu hỏi phù hợp.
                    </div>
                `;
                suggestionsBox.style.display = 'block';
            }
        });

        // Click suggestions
        suggestionsBox.addEventListener('click', (e) => {
            const item = e.target.closest('[data-faq-id]');
            if (!item) return;

            const faqId = parseInt(item.dataset.faqId);
            const accordionBtn = document.querySelector(`[data-bs-target="#faq${faqId}"]`);
            const targetCollapse = document.getElementById(`faq${faqId}`);

            if (accordionBtn && targetCollapse) {
                // Clear search
                searchInput.value = '';
                suggestionsBox.style.display = 'none';
                if (clearBtn) clearBtn.style.display = 'none';

                // Scroll to target Accordion
                accordionBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Use Bootstrap Collapse to expand
                const bsCollapse = bootstrap.Collapse.getOrCreateInstance(targetCollapse);
                bsCollapse.show();

                // Highlight accordion item
                const cardParent = accordionBtn.closest('.accordion-item');
                if (cardParent) {
                    cardParent.style.transition = 'background-color 0.4s ease';
                    cardParent.style.backgroundColor = 'rgba(13, 148, 136, 0.1)';
                    setTimeout(() => {
                        cardParent.style.backgroundColor = '';
                    }, 2000);
                }
            }
        });

        // Clear button
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                suggestionsBox.style.display = 'none';
                clearBtn.style.display = 'none';
                searchInput.focus();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#faqSearchInput') && !e.target.closest('#faqSuggestions')) {
                suggestionsBox.style.display = 'none';
            }
        });
    }

    // ----------------------------------------------------
    // 2. Simulated Smart Support Live Chat Widget
    // ----------------------------------------------------
    const chatWidget = document.getElementById('chatWidget');
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatWindow = document.getElementById('chatWindow');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatUnreadBadge = document.getElementById('chatUnreadBadge');

    if (chatToggleBtn && chatWindow) {
        // Toggle chat panel
        chatToggleBtn.addEventListener('click', () => {
            const isVisible = chatWindow.style.display !== 'none';
            if (isVisible) {
                closeChat();
            } else {
                openChat();
            }
        });

        if (chatCloseBtn) {
            chatCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeChat();
            });
        }

        function openChat() {
            chatWindow.style.display = 'flex';
            chatWindow.style.flexDirection = 'column';
            // Trigger animation frame
            requestAnimationFrame(() => {
                chatWindow.style.opacity = '1';
                chatWindow.style.transform = 'scale(1)';
            });
            chatToggleBtn.style.transform = 'rotate(135deg)';
            chatUnreadBadge.style.display = 'none';
            
            // Focus input after anim
            setTimeout(() => chatInput.focus(), 300);
        }

        function closeChat() {
            chatWindow.style.opacity = '0';
            chatWindow.style.transform = 'scale(0.9)';
            chatToggleBtn.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                chatWindow.style.display = 'none';
            }, 300);
        }

        // Send a message
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user');
            chatInput.value = '';

            // Simulate Bot Typing response
            simulateBotResponse(text);
        });

        // Suggestion chips inside chat
        chatMessages.addEventListener('click', (e) => {
            const btn = e.target.closest('.chat-suggest-btn');
            if (!btn) return;
            const text = btn.textContent;
            appendMessage(text, 'user');
            simulateBotResponse(text);
        });

        function appendMessage(text, sender = 'bot') {
            const msgEl = document.createElement('div');
            msgEl.className = sender === 'user' 
                ? 'd-flex align-items-start gap-2 justify-content-end mb-3'
                : 'd-flex align-items-start gap-2 mb-3';

            const botAvatar = `
                <div class="bg-white rounded-circle d-flex align-items-center justify-content-center border" style="width: 32px; height: 32px; flex-shrink: 0;">
                    <i class="bi bi-robot text-primary" style="font-size: 14px;"></i>
                </div>
            `;

            const bubbleStyle = sender === 'user'
                ? `background-color: #006b5d; color: #ffffff; max-width: 75%; border-top-right-radius: 0 !important;`
                : `background-color: #ffffff; color: #000000; max-width: 75%; border-top-left-radius: 0 !important;`;

            msgEl.innerHTML = `
                ${sender !== 'user' ? botAvatar : ''}
                <div class="p-3 rounded-3 shadow-sm border-0" style="${bubbleStyle}">
                    <p class="mb-0 small" style="line-height: 1.5; color: inherit;">${Utils.escapeHtml(text)}</p>
                </div>
            `;
            chatMessages.appendChild(msgEl);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function showTypingIndicator() {
            const indicator = document.createElement('div');
            indicator.id = 'chatTypingIndicator';
            indicator.className = 'd-flex align-items-start gap-2 mb-3';
            indicator.innerHTML = `
                <div class="bg-white rounded-circle d-flex align-items-center justify-content-center border" style="width: 32px; height: 32px; flex-shrink: 0;">
                    <i class="bi bi-robot text-primary" style="font-size: 14px;"></i>
                </div>
                <div class="bg-white px-3 py-2.5 rounded-3 shadow-sm d-flex align-items-center gap-1 border-0" style="border-top-left-radius: 0 !important;">
                    <span class="spinner-grow spinner-grow-sm text-primary" role="status" style="width: 6px; height: 6px; animation-duration: 0.75s;"></span>
                    <span class="spinner-grow spinner-grow-sm text-primary" role="status" style="width: 6px; height: 6px; animation-duration: 0.75s; animation-delay: 0.15s;"></span>
                    <span class="spinner-grow spinner-grow-sm text-primary" role="status" style="width: 6px; height: 6px; animation-duration: 0.75s; animation-delay: 0.3s;"></span>
                </div>
            `;
            chatMessages.appendChild(indicator);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function removeTypingIndicator() {
            const indicator = document.getElementById('chatTypingIndicator');
            if (indicator) indicator.remove();
        }

        function simulateBotResponse(userText) {
            showTypingIndicator();
            const cleanText = removeDiacritics(userText);

            setTimeout(() => {
                removeTypingIndicator();
                
                // Find matching FAQ answer
                const match = FAQS.find(faq => {
                    const cleanQ = removeDiacritics(faq.q);
                    const matchesKeyword = faq.keywords.some(kw => cleanText.includes(kw));
                    return cleanQ.includes(cleanText) || matchesKeyword;
                });

                if (match) {
                    appendMessage(match.a, 'bot');
                } else {
                    appendMessage("Cảm ơn bạn đã hỏi. Tôi chưa tìm thấy câu trả lời chính xác cho câu hỏi này trong cơ sở dữ liệu FAQ. Bạn có thể gửi một Ticket chi tiết qua form hỗ trợ bên cạnh để bộ phận chăm sóc khách hàng liên hệ trực tiếp xử lý nhé!", 'bot');
                }
            }, 1000);
        }

        // Show unread notification badge once at start
        setTimeout(() => {
            if (chatWindow.style.display === 'none') {
                chatUnreadBadge.style.display = 'inline-block';
            }
        }, 3000);
    }
});
