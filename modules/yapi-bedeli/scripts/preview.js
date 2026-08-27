const { ipcRenderer } = require('electron');

// Global değişkenler
let currentZoom = 100;
let raporId = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log('👁️ Ön izleme penceresi yükleniyor...');
    
    // URL'den parametreleri al
    const urlParams = new URLSearchParams(window.location.search);
    raporId = urlParams.get('id');
});

// IPC ile içerik al
ipcRenderer.on('preview-content', (event, data) => {
    console.log('📄 İçerik alındı');
    
    // content: Word çıktısının HTML karşılığı (rapor-onizleme.js)
    // htmlContent: eski editör DOM'u - geriye uyumluluk için hâlâ destekleniyor
    const icerik = data.content || data.htmlContent;

    if (icerik) {
        const a4Page = document.getElementById('a4Page');
        a4Page.innerHTML = icerik;

        // Contenteditable'ları kaldır (sadece görüntüleme)
        const editables = a4Page.querySelectorAll('[contenteditable]');
        editables.forEach(el => {
            el.removeAttribute('contenteditable');
        });

        // Section label'ları gizle
        const labels = a4Page.querySelectorAll('.section-label, .ed-section-label');
        labels.forEach(el => {
            el.style.display = 'none';
        });
    }
    
    if (data.raporId) {
        raporId = data.raporId;
    }
});

// Zoom fonksiyonları
function zoomIn() {
    if (currentZoom < 200) {
        currentZoom += 10;
        applyZoom();
    }
}

function zoomOut() {
    if (currentZoom > 50) {
        currentZoom -= 10;
        applyZoom();
    }
}

function zoomReset() {
    currentZoom = 100;
    applyZoom();
}

function applyZoom() {
    const a4Page = document.getElementById('a4Page');
    a4Page.style.transform = `scale(${currentZoom / 100})`;
    a4Page.style.transformOrigin = 'top center';
    document.getElementById('zoomLevel').textContent = `${currentZoom}%`;
}

// Yazdır
function yazdir() {
    window.print();
}

// Word indir
function wordIndir() {
    if (raporId) {
        ipcRenderer.send('export-word-from-preview', { raporId: raporId });
    } else {
        alert('⚠️ Rapor ID bulunamadı!');
    }
}

// Kapat
function kapat() {
    window.close();
}

// IPC mesajlarını dinle
ipcRenderer.on('word-export-success', (event, filePath) => {
    alert(`✅ Word dosyası kaydedildi:\n${filePath}`);
});

ipcRenderer.on('word-export-error', (event, error) => {
    alert(`❌ Word export hatası:\n${error}`);
});
