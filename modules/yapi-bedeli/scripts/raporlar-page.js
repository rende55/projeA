/**
 * Raporlar Sayfa Modülü
 * Tek pencere navigasyon sistemi için
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, '..', '..', '..', 'raporlar.db');
let db = null;

// Navigation referansı
let nav = null;

/**
 * Sayfa yüklendiğinde çağrılır
 */
async function onLoad(container, data, navigation) {
    console.log('📋 Raporlar sayfası yükleniyor...');
    nav = navigation;
    
    // Veritabanı bağlantısı
    db = new sqlite3.Database(dbPath);
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Raporları yükle
    await loadRaporlar();
    
    console.log('✅ Raporlar sayfası yüklendi');
}

/**
 * Sayfa kapatılırken çağrılır
 */
async function onUnload() {
    console.log('🔄 Raporlar sayfası kapatılıyor...');
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Kaydedilmemiş değişiklik var mı?
 */
function hasUnsavedChanges() {
    return false;
}

/**
 * Event listener'ları kur
 */
function setupEventListeners() {
    // Forma dön butonu
    const formButton = document.getElementById('rp-formButton');
    if (formButton) {
        formButton.addEventListener('click', () => {
            nav.goBack();
        });
    }
}

/**
 * Raporları yükle
 */
function loadRaporlar() {
    return new Promise((resolve, reject) => {
        const tbody = document.getElementById('rp-raporlarBody');
        const emptyMessage = document.getElementById('rp-emptyMessage');
        const table = document.querySelector('.rp-table');
        
        if (!tbody) {
            resolve();
            return;
        }
        
        // Önce modul kolonu var mı kontrol et
        db.all(`PRAGMA table_info(raporlar)`, [], (pragmaErr, columns) => {
            if (pragmaErr) {
                console.error('Tablo bilgisi alınamadı:', pragmaErr);
                reject(pragmaErr);
                return;
            }
            
            const modulKolonuVar = columns && columns.some(col => col.name === 'modul');
            const sql = modulKolonuVar 
                ? `SELECT * FROM raporlar WHERE modul = 'yapi-bedeli' OR modul IS NULL ORDER BY id DESC`
                : `SELECT * FROM raporlar ORDER BY id DESC`;
            
            db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('Raporlar yüklenemedi:', err);
                reject(err);
                return;
            }
            
            tbody.innerHTML = '';
            
            if (!rows || rows.length === 0) {
                if (table) table.style.display = 'none';
                if (emptyMessage) emptyMessage.style.display = 'block';
                resolve();
                return;
            }
            
            if (table) table.style.display = 'table';
            if (emptyMessage) emptyMessage.style.display = 'none';
            
            rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td>${formatTarih(row.raporTarihi)}</td>
                    <td>${row.ilce || '-'}</td>
                    <td>${row.mahalle || '-'}</td>
                    <td>${row.ada || '-'}</td>
                    <td>${row.parsel || '-'}</td>
                    <td>
                        <button class="rp-btn rp-duzenle-button" onclick="window.rpPage.duzenle(${row.id})">📝 Düzenle</button>
                        <button class="rp-btn rp-sil-button" onclick="window.rpPage.sil(${row.id})">🗑️ Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            resolve();
        });
        });
    });
}

/**
 * Tarih formatla
 */
function formatTarih(tarih) {
    if (!tarih) return '-';
    const date = new Date(tarih);
    return date.toLocaleDateString('tr-TR');
}

/**
 * Rapor düzenle
 */
function duzenle(id) {
    console.log('📝 Rapor düzenleniyor:', id);
    nav.navigateTo('editor', { raporId: id });
}

/**
 * Rapor sil
 */
function sil(id) {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    
    db.run(`DELETE FROM raporlar WHERE id = ?`, [id], (err) => {
        if (err) {
            console.error('Silme hatası:', err);
            if (window.showNotification) {
                window.showNotification('Silme sırasında hata oluştu!', 'error');
            }
            return;
        }
        
        if (window.showNotification) {
            window.showNotification('Rapor silindi', 'success');
        }
        
        // Listeyi yenile
        loadRaporlar();
    });
}

// Global erişim için
window.rpPage = {
    duzenle,
    sil
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
