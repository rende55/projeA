const { ipcRenderer } = require('electron');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard yüklendi - Tek Pencere Navigasyon Sistemi');
    
    // Navigasyon sistemini başlat
    const pageContainer = document.getElementById('page-container');
    const navBar = document.getElementById('navigation-bar');
    const breadcrumb = document.getElementById('breadcrumb');
    
    window.navigation.init(pageContainer, navBar, breadcrumb);
    
    // Modül kartlarını ayarla
    setupModuleCards();

    // Versiyon bilgisi modalını kur
    setupVersionModal();

    // CSS animasyonlarını ekle
    addAnimationStyles();
    
    console.log(`
╔═══════════════════════════════════════╗
║    PROJE A - TEK PENCERE SİSTEMİ     ║
╚═══════════════════════════════════════╝

📦 Aktif Modüller:
  ✓ Yapı Bedeli

⏳ Planlanan Modüller:
  • Proje Bedeli
  • Mevzuat
  • Hesaplama

🧭 Navigasyon:
  • ESC - Geri git
  • Alt+← - Geri git
  • Alt+Home - Ana sayfaya git

Versiyon: 2.1.0
`);
});

// Modül kartlarını ayarla
function setupModuleCards() {
    const moduleCards = document.querySelectorAll('.module-card');
    
    moduleCards.forEach(card => {
        card.addEventListener('click', () => {
            const moduleId = card.getAttribute('data-module');
            const isDisabled = card.classList.contains('disabled');
            
            if (isDisabled) {
                showComingSoonMessage(card);
            } else {
                openModule(moduleId);
            }
        });
        
        // Hover efektleri
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('disabled')) {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// Modül açma fonksiyonu - TEK PENCERE SİSTEMİ
function openModule(moduleId) {
    console.log(`📂 Modül açılıyor: ${moduleId}`);
    
    // Kart animasyonu
    const card = document.querySelector(`[data-module="${moduleId}"]`);
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        card.style.transform = '';
        
        // Navigasyon ile sayfaya git
        switch(moduleId) {
            case 'yapi-bedeli':
                window.navigation.navigateTo('yapi-bedeli');
                break;
            case 'proje-bedeli':
                window.navigation.navigateTo('proje-bedeli');
                break;
            case 'mevzuat':
                showNotification('Mevzuat modülü henüz geliştirilme aşamasında.');
                break;
            case 'hesaplama':
                showNotification('Hesaplama modülü henüz geliştirilme aşamasında.');
                break;
            case 'admin':
                window.navigation.navigateTo('admin');
                break;
            default:
                console.error('Bilinmeyen modül:', moduleId);
        }
    }, 150);
}

// "Çok Yakında" mesajı göster
function showComingSoonMessage(card) {
    card.style.animation = 'shake 0.5s';
    
    setTimeout(() => {
        card.style.animation = '';
    }, 500);
    
    showNotification('Bu modül henüz geliştirilme aşamasında. Çok yakında!');
}

// Bildirim gösterme fonksiyonu
function showNotification(message, type = 'warning') {
    const colors = {
        warning: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
        success: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
        error: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
        info: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: ${colors[type] || colors.warning};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        font-size: 15px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.4s ease, fadeOut 0.4s ease 2.6s;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// CSS animasyonları ekle
function addAnimationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Global erişim için
window.showNotification = showNotification;

// ===== VERSIYON BİLGİ MODALI =====
function setupVersionModal() {
    const overlay = document.getElementById('versionModalOverlay');
    const openBtn = document.getElementById('versionInfoBtn');
    const closeBtn = document.getElementById('versionModalClose');
    const okBtn = document.getElementById('versionModalOkBtn');

    if (!overlay || !openBtn) return;

    const open = () => {
        overlay.classList.add('active');
        document.addEventListener('keydown', handleEsc);
    };

    const close = () => {
        overlay.classList.remove('active');
        document.removeEventListener('keydown', handleEsc);
    };

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            close();
        }
    };

    openBtn.addEventListener('click', open);
    closeBtn?.addEventListener('click', close);
    okBtn?.addEventListener('click', close);

    // Overlay'in kendisine (modal dışı tıklama) tıklayınca kapat
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
    });
}
