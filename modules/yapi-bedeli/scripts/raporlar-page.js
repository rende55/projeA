/**
 * Raporlar Sayfa Modülü
 * Tek pencere navigasyon sistemi için
 */

const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getDbPath } = require('../../../shared/scripts/db-helper');
const donemKopyala = require('./donem-kopyala');
const donemServisi = require('./donem-servisi');

// Veritabanı bağlantısı
const dbPath = getDbPath();
let db = null;

// Navigation referansı
let nav = null;

// Dönem etiketleri için önbellek (yılda birden fazla dönem varsa "2022/2" biçimi)
let donemlerCache = [];

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

    // Dönem listesini yükle (tablodaki Dönem sütunu için)
    try {
        donemlerCache = await donemServisi.listeDonemler(db);
    } catch (e) {
        console.error('Dönemler yüklenemedi:', e);
        donemlerCache = [];
    }

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
    donemlerCache = [];

    ipcRenderer.removeListener('word-export-success', wordBasarili);
    ipcRenderer.removeListener('word-export-error', wordHatali);
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

    // Word export sonucu (onUnload'da kaldırılır ki sayfa her açılışta birikmesin)
    ipcRenderer.on('word-export-success', wordBasarili);
    ipcRenderer.on('word-export-error', wordHatali);
}

function wordBasarili(event, filePath) {
    if (window.showNotification) {
        window.showNotification(`Word dosyası kaydedildi: ${filePath}`, 'success');
    }
}

function wordHatali(event, hata) {
    if (window.showNotification) {
        window.showNotification(`Word export hatası: ${hata}`, 'error');
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
                    <td>${donemHucresi(row)}</td>
                    <td>${row.ilce || '-'}</td>
                    <td>${row.mahalle || '-'}</td>
                    <td>${row.ada || '-'}</td>
                    <td>${row.parsel || '-'}</td>
                    <td>
                        <div class="rp-islem-hucre">
                            <button class="rp-btn rp-duzenle-button" onclick="window.rpPage.duzenle(${row.id})" title="Editörde aç">📝 Düzenle</button>
                            <button class="rp-btn rp-word-button" onclick="window.rpPage.wordIndir(${row.id})" title="Word olarak indir">📥 Word İndir</button>
                            <button class="rp-btn rp-donem-button" onclick="window.rpPage.donemeKopyala(${row.id})" title="Başka bir birim fiyat dönemine kopyala">📅 Döneme Kopyala</button>
                            <button class="rp-btn rp-sil-button" onclick="window.rpPage.sil(${row.id})" title="Raporu sil">🗑️ Sil</button>
                        </div>
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
 * Dönem sütununun içeriği.
 *
 * birimFiyatId varsa dönem tablosundan kesin etiket üretilir (yılda birden fazla
 * dönem varsa "2022/2"). Yoksa raporda yazan hesapYili gösterilir; hiçbiri yoksa
 * "Belirsiz" olarak işaretlenir.
 */
function donemHucresi(row) {
    const donem = row.birimFiyatId
        ? donemlerCache.find(d => d.id === row.birimFiyatId)
        : null;

    if (donem) {
        const etiket = donemServisi.donemEtiketi(donem, donemlerCache);
        const rg = donem.resmiGazeteSayili
            ? `<span class="rp-donem-rg">${donem.resmiGazeteSayili} sayılı R.G.</span>`
            : '';
        return `<span class="rp-donem-etiket">${etiket}</span>${rg}`;
    }

    if (row.hesapYili) {
        // Dönem eşleşmedi ama raporda yıl yazıyor
        return `<span class="rp-donem-etiket">${row.hesapYili}</span>`;
    }

    return `<span class="rp-donem-etiket bilinmiyor">Belirsiz</span>`;
}

/**
 * Raporu listeden doğrudan Word olarak indir.
 * Editördeki wordOlarakIndir() ile aynı IPC kanalını kullanır; böylece
 * dosya adı biçimi, kaydetme diyaloğu ve fotoğraf davranışı birebir aynı olur.
 */
function wordIndir(id) {
    db.get(`SELECT * FROM raporlar WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            console.error('Rapor bulunamadı:', err);
            if (window.showNotification) {
                window.showNotification('Rapor bulunamadı!', 'error');
            }
            return;
        }

        let fotograflar = [];
        try {
            if (row.fotograflarJSON) fotograflar = JSON.parse(row.fotograflarJSON) || [];
        } catch (e) {
            console.error('Fotoğraf parse hatası:', e);
        }

        ipcRenderer.send('export-word-with-photos', {
            raporData: row,
            fotograflar: fotograflar
        });

        if (window.showNotification) {
            window.showNotification(`Rapor #${id} için Word oluşturuluyor...`, 'info');
        }
    });
}

/**
 * Raporu farklı bir birim fiyat dönemine kopyala (yeni rapor oluşturur).
 */
function donemeKopyala(id) {
    donemKopyala.ac(db, nav, id);
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
    wordIndir,
    donemeKopyala,
    sil
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
