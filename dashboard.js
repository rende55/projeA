const { ipcRenderer } = require('electron');

// Navigasyon state'i
let currentView = 'dashboard'; // 'dashboard', 'yapi-bedeli', 'yapi-bedeli-raporlar', 'yapi-bedeli-admin'

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard yüklendi - Tek Pencere Sistemi');
    
    // Tüm modül kartlarını seç
    const moduleCards = document.querySelectorAll('.module-card');
    
    moduleCards.forEach(card => {
        card.addEventListener('click', () => {
            const moduleId = card.getAttribute('data-module');
            const isDisabled = card.classList.contains('disabled');
            
            if (isDisabled) {
                // Disabled modüller için animasyon
                showComingSoonMessage(card);
            } else {
                // Aktif modülleri aç
                openModule(moduleId);
            }
        });
        
        // Hover efekti için ses eklenebilir (opsiyonel)
        card.addEventListener('mouseenter', () => {
            if (!card.classList.contains('disabled')) {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
    
    // Klavye navigasyonu
    document.addEventListener('keydown', (e) => {
        // ESC tuşu ile uygulamayı kapat
        if (e.key === 'Escape') {
            const { remote } = require('@electron/remote');
            const currentWindow = remote.getCurrentWindow();
            currentWindow.close();
        }
    });
});

// Modül açma fonksiyonu - YENİ PENCERE SİSTEMİ
function openModule(moduleId) {
    console.log(`Modül açılıyor: ${moduleId}`);
    
    // Kart animasyonu
    const card = document.querySelector(`[data-module="${moduleId}"]`);
    card.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        card.style.transform = '';
        
        // IPC ile modülü aç (yeni pencere)
        switch(moduleId) {
            case 'yapi-bedeli':
                ipcRenderer.send('open-yapi-bedeli');
                break;
            case 'proje-bedeli':
                showNotification('Proje Bedeli modülü henüz geliştirilme aşamasında.');
                break;
            case 'mevzuat':
                showNotification('Mevzuat modülü henüz geliştirilme aşamasında.');
                break;
            case 'hesaplama':
                showNotification('Hesaplama modülü henüz geliştirilme aşamasında.');
                break;
            default:
                console.error('Bilinmeyen modül:', moduleId);
        }
    }, 150);
}

// "Çok Yakında" mesajı göster
function showComingSoonMessage(card) {
    // Kart sallama animasyonu
    card.style.animation = 'shake 0.5s';
    
    setTimeout(() => {
        card.style.animation = '';
    }, 500);
    
    // Bildirim göster (opsiyonel)
    showNotification('Bu modül henüz geliştirilme aşamasında. Çok yakında!');
}

// Bildirim gösterme fonksiyonu
function showNotification(message) {
    // Basit bir toast notification oluştur
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 30px;
        right: 30px;
        background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
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
    
    // 3 saniye sonra kaldır
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// CSS animasyonları ekle
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
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Modül bilgilerini konsola yazdır
console.log(`
╔═══════════════════════════════════════╗
║         PROJE A - ANA SAYFA          ║
╚═══════════════════════════════════════╝

📦 Aktif Modüller:
  ✓ Yapı Bedeli

⏳ Planlanan Modüller:
  • Proje Bedeli
  • Mevzuat
  • Hesaplama

Versiyon: 2.0.0
`);
