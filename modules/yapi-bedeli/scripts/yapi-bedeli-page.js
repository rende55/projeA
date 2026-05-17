/**
 * Yapı Bedeli Sayfa Modülü
 * Tek pencere navigasyon sistemi için
 */

const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getDbPath } = require('../../../shared/scripts/db-helper');

// Veritabanı bağlantısı
const dbPath = getDbPath();
let db = null;

// Cache
let birimFiyatCache = {};
let yapiGrupCache = {};
let hesapDonemleriCache = [];
let yipranmaPaylariCache = [];
let fotograflar = [];
let yapiSayaci = 0;
let parselSayaci = 0;
let parselFotograflari = {}; // Ayrı raporlar için her parselin fotoğrafları

// Navigation referansı
let nav = null;

// İlçeler artık veritabanından (varsayılan il -> aktif ilçeler) yüklenir.
// populateIlceler() çağrısı bu cache'i doldurur; çoklu parsel kodu da buradan okur.
let ilcelerCache = [];

/**
 * Sayfa yüklendiğinde çağrılır
 */
async function onLoad(container, data, navigation) {
    console.log('🏗️ Yapı Bedeli sayfası yükleniyor...');
    nav = navigation;
    
    // Veritabanı bağlantısı
    db = new sqlite3.Database(dbPath);
    
    // Rapor tarihini bugünün tarihi olarak ayarla
    const today = new Date().toISOString().split('T')[0];
    const raporTarihiEl = document.getElementById('yb-raporTarihi');
    if (raporTarihiEl) raporTarihiEl.value = today;
    
    // Hesap dönemlerini yükle
    await populateHesapDonemleri();
    
    // Yıpranma paylarını yükle
    await loadYipranmaPaylari();
    
    // Kurumları yükle
    setTimeout(() => kurumlariDoldur(), 500);
    
    // İlçeleri doldur
    populateIlceler();
    
    // Raportör alanlarını oluştur
    updateRaportorAlanlari();
    
    // İlk yapıyı ekle
    yapiSayaci = 0;
    yeniYapiEkle();
    
    // Event listener'ları ekle
    setupEventListeners();
    
    // IPC response listener'ları
    ipcRenderer.on('word-export-success', (event, filePath) => {
        if (window.showNotification) {
            window.showNotification(`✅ Word raporu oluşturuldu: ${filePath}`, 'success');
        }
    });
    
    ipcRenderer.on('word-export-error', (event, error) => {
        if (window.showNotification) {
            window.showNotification(`❌ Rapor oluşturma hatası: ${error}`, 'error');
        }
    });
    
    console.log('✅ Yapı Bedeli sayfası yüklendi');
}

/**
 * Sayfa kapatılırken çağrılır
 */
async function onUnload() {
    console.log('🔄 Yapı Bedeli sayfası kapatılıyor...');
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Kaydedilmemiş değişiklik var mı?
 */
function hasUnsavedChanges() {
    // Form değişiklik kontrolü yapılabilir
    return false;
}

/**
 * Event listener'ları kur
 */
function setupEventListeners() {
    // Tab navigasyonu
    document.querySelectorAll('.yb-tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            showTab(tabName);
        });
    });
    
    // İleri/Geri butonları
    document.querySelectorAll('.yb-btn-next').forEach(btn => {
        btn.addEventListener('click', nextTab);
    });
    document.querySelectorAll('.yb-btn-prev').forEach(btn => {
        btn.addEventListener('click', prevTab);
    });
    
    // Raportör sayısı değişikliği
    const raportorSayisiEl = document.getElementById('yb-raportorSayisi');
    if (raportorSayisiEl) {
        raportorSayisiEl.addEventListener('change', updateRaportorAlanlari);
    }
    
    // Yapı ekle butonu
    const yapiEkleBtn = document.getElementById('yb-yapiEkleBtn');
    if (yapiEkleBtn) {
        yapiEkleBtn.addEventListener('click', yeniYapiEkle);
    }
    
    // Hesapla butonu
    const hesaplaBtn = document.querySelector('.yb-hesapla-button');
    if (hesaplaBtn) {
        hesaplaBtn.addEventListener('click', hesapla);
    }
    
    // Kaydet butonu
    const kaydetBtn = document.querySelector('.yb-save-button');
    if (kaydetBtn) {
        kaydetBtn.addEventListener('click', kaydet);
    }
    
    // Temizle butonu
    const temizleBtn = document.querySelector('.yb-clear-button');
    if (temizleBtn) {
        temizleBtn.addEventListener('click', temizle);
    }
    
    // Raporlar butonu
    const raporlarBtn = document.querySelector('.yb-show-reports-button');
    if (raporlarBtn) {
        raporlarBtn.addEventListener('click', () => {
            nav.navigateTo('raporlar');
        });
    }
    
    // Admin butonu
    const adminBtn = document.querySelector('.yb-show-admin-button');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            nav.navigateTo('admin');
        });
    }
    
    
    // Header'daki raporlar butonu
    const reportsNavBtn = document.getElementById('yb-reportsNavButton');
    if (reportsNavBtn) {
        reportsNavBtn.addEventListener('click', () => {
            nav.navigateTo('raporlar');
        });
    }
    
    // Fotoğraf seçme
    const fotografInput = document.getElementById('yb-fotograflar');
    if (fotografInput) {
        fotografInput.addEventListener('change', fotograflarDegisti);
    }
    
    // Çoklu parsel fotoğraf seçme
    const cokluFotografInput = document.getElementById('yb-cokluFotograflar');
    if (cokluFotografInput) {
        cokluFotografInput.addEventListener('change', fotograflarDegisti);
    }
    
    // Çoklu parsel checkbox
    const cokluParselCheckbox = document.getElementById('yb-cokluParsel');
    if (cokluParselCheckbox) {
        cokluParselCheckbox.addEventListener('change', cokluParselModuDegistir);
    }
    
    // Çoklu parsel tip radyo düğmeleri
    document.querySelectorAll('input[name="yb-cokluParselTipi"]').forEach(radio => {
        radio.addEventListener('change', cokluParselTipiDegistir);
    });
    
    // Parsel ekle butonu
    const parselEkleBtn = document.getElementById('yb-parselEkleBtn');
    if (parselEkleBtn) {
        parselEkleBtn.addEventListener('click', yeniParselEkle);
    }
}

/**
 * Tab göster
 */
function showTab(tabName) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.yb-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Tüm tab butonlarını pasif yap
    document.querySelectorAll('.yb-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçili tab'ı göster
    const tabContent = document.getElementById(`yb-tab-${tabName}`);
    if (tabContent) tabContent.classList.add('active');
    
    // Seçili butonu aktif yap
    const tabButton = document.querySelector(`.yb-tab-button[data-tab="${tabName}"]`);
    if (tabButton) tabButton.classList.add('active');
}

/**
 * Sonraki tab'a geç
 */
function nextTab() {
    const tabs = ['genel', 'arsa', 'yapi'];
    const activeTab = document.querySelector('.yb-tab-content.active');
    if (!activeTab) return;
    
    const currentTabName = activeTab.id.replace('yb-tab-', '');
    const currentIndex = tabs.indexOf(currentTabName);
    
    if (currentIndex < tabs.length - 1) {
        showTab(tabs[currentIndex + 1]);
    }
}

/**
 * Önceki tab'a geç
 */
function prevTab() {
    const tabs = ['genel', 'arsa', 'yapi'];
    const activeTab = document.querySelector('.yb-tab-content.active');
    if (!activeTab) return;
    
    const currentTabName = activeTab.id.replace('yb-tab-', '');
    const currentIndex = tabs.indexOf(currentTabName);
    
    if (currentIndex > 0) {
        showTab(tabs[currentIndex - 1]);
    }
}

/**
 * İlçeleri doldur
 */
function populateIlceler() {
    const ilceSelect = document.getElementById('yb-ilce');
    if (!ilceSelect) return;

    // Mevcut seçenekleri (placeholder hariç) temizle
    Array.from(ilceSelect.querySelectorAll('option')).forEach(opt => {
        if (opt.value !== '') opt.remove();
    });

    // Varsayılan ilin aktif ilçelerini yükle; varsayılan yoksa aktif olan ilk ili kullan
    const sql = `
        SELECT ilceler.ilce_adi
        FROM ilceler
        INNER JOIN iller ON ilceler.il_id = iller.id
        WHERE ilceler.aktif = 1
          AND iller.aktif = 1
          AND iller.id = (
              SELECT id FROM iller
              WHERE aktif = 1
              ORDER BY varsayilan DESC, id ASC
              LIMIT 1
          )
        ORDER BY ilceler.ilce_adi
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('İlçeler yüklenemedi:', err);
            return;
        }
        ilcelerCache = rows.map(r => r.ilce_adi);
        rows.forEach(row => {
            const option = document.createElement('option');
            option.value = row.ilce_adi;
            option.textContent = row.ilce_adi;
            ilceSelect.appendChild(option);
        });
    });
}

/**
 * Hesap dönemlerini doldur
 */
function populateHesapDonemleri() {
    return new Promise((resolve, reject) => {
        const hesapYiliSelect = document.getElementById('yb-hesapYili');
        if (!hesapYiliSelect) {
            resolve();
            return;
        }
        
        db.all(`SELECT * FROM birimFiyatlar WHERE aktif = 1 ORDER BY yil DESC, donem DESC`, [], (err, rows) => {
            if (err) {
                console.error('Hesap dönemleri yüklenemedi:', err);
                reject(err);
                return;
            }
            
            hesapDonemleriCache = rows || [];
            
            rows.forEach(row => {
                const option = document.createElement('option');
                option.value = row.id;
                
                // Aynı yılda birden fazla dönem var mı kontrol et
                const ayniYilSayisi = rows.filter(r => r.yil === row.yil).length;
                if (ayniYilSayisi > 1) {
                    option.textContent = `${row.yil}/${row.donem}`;
                } else {
                    option.textContent = `${row.yil}`;
                }
                
                option.dataset.yil = row.yil;
                option.dataset.donem = row.donem;
                option.dataset.rgTarih = row.resmiGazeteTarih || '';
                option.dataset.rgSayili = row.resmiGazeteSayili || '';
                
                hesapYiliSelect.appendChild(option);
            });
            
            resolve();
        });
    });
}

/**
 * Yıpranma paylarını yükle
 */
function loadYipranmaPaylari() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM yipranmaPaylari`, [], (err, rows) => {
            if (err) {
                console.error('Yıpranma payları yüklenemedi:', err);
                reject(err);
                return;
            }
            
            yipranmaPaylariCache = rows || [];
            resolve();
        });
    });
}

/**
 * Kurumları doldur (alt birimlerle birlikte)
 */
function kurumlariDoldur() {
    const kurumSelect = document.getElementById('yb-ilgiliKurum');
    if (!kurumSelect) return;
    
    db.all(`SELECT * FROM kurumlar WHERE aktif = 1 ORDER BY kurumAdi, altKurum`, [], (err, rows) => {
        if (err) {
            console.error('Kurumlar yüklenemedi:', err);
            return;
        }
        
        // Mevcut seçenekleri temizle (ilk seçenek hariç)
        kurumSelect.innerHTML = '<option value="">Kurum Seçiniz...</option>';
        
        rows.forEach(row => {
            const option = document.createElement('option');
            // Tam görünüm: "Kurum (Alt Kurum)" formatında
            const tamGorunum = row.altKurum 
                ? `${row.kurumAdi} (${row.altKurum})`
                : row.kurumAdi;
            
            option.value = tamGorunum;
            option.textContent = tamGorunum;
            kurumSelect.appendChild(option);
        });
        
        console.log(`✅ ${rows.length} kurum yüklendi`);
    });
}

/**
 * Raportör alanlarını güncelle
 */
function updateRaportorAlanlari() {
    const container = document.getElementById('yb-raportorContainer');
    const sayiInput = document.getElementById('yb-raportorSayisi');
    if (!container || !sayiInput) return;
    
    const sayi = parseInt(sayiInput.value) || 1;
    container.innerHTML = '';
    
    for (let i = 1; i <= sayi; i++) {
        const row = document.createElement('div');
        row.className = 'yb-form-row';
        row.innerHTML = `
            <div class="yb-form-group">
                <label>Raportör ${i} Adı *</label>
                <select id="yb-raportorAdi${i}" required>
                    <option value="">Raportör Seçiniz...</option>
                </select>
            </div>
            <div class="yb-form-group">
                <label>Raportör ${i} Unvanı</label>
                <input type="text" id="yb-raportorUnvani${i}" readonly>
            </div>
        `;
        container.appendChild(row);
        
        // Raportörleri yükle
        loadRaportorler(i);
    }
}

/**
 * Raportörleri yükle
 */
function loadRaportorler(index) {
    const select = document.getElementById(`yb-raportorAdi${index}`);
    if (!select) return;
    
    db.all(`SELECT * FROM raportorleri WHERE aktif = 1 ORDER BY adi, soyadi`, [], (err, rows) => {
        if (err) {
            console.error('Raportörler yüklenemedi:', err);
            return;
        }
        
        rows.forEach(row => {
            const option = document.createElement('option');
            option.value = `${row.adi} ${row.soyadi}`;
            option.textContent = `${row.adi} ${row.soyadi}`;
            option.dataset.unvan = row.unvani || '';
            select.appendChild(option);
        });
        
        // Seçim değiştiğinde unvanı güncelle
        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            const unvanInput = document.getElementById(`yb-raportorUnvani${index}`);
            if (unvanInput && selectedOption) {
                unvanInput.value = selectedOption.dataset.unvan || '';
            }
        });
    });
}

/**
 * Yeni yapı ekle
 */
function yeniYapiEkle() {
    yapiSayaci++;
    const container = document.getElementById('yb-yapiListesiContainer');
    if (!container) return;
    
    const yapiCard = document.createElement('div');
    yapiCard.className = 'yb-yapi-card';
    yapiCard.id = `yb-yapi-${yapiSayaci}`;
    yapiCard.style.cssText = 'border: 2px solid #D3DAE3; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #f8f9fa;';
    
    yapiCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="color: #2A4C6E; margin: 0;">🏗️ Yapı ${yapiSayaci}</h3>
            ${yapiSayaci > 1 ? `<button type="button" onclick="window.ybPage.yapiSil(${yapiSayaci})" style="background: #E53935; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">🗑️ Sil</button>` : ''}
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapı No</label>
                <input type="text" id="yb-yapiNo-${yapiSayaci}" value="${yapiSayaci}">
            </div>
            <div class="yb-form-group">
                <label>Yapı Adı *</label>
                <input type="text" id="yb-yapiAdi-${yapiSayaci}" placeholder="Örn: Ev, Ahır, Depo" required>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapı Sınıfı *</label>
                <select id="yb-yapiSinifi-${yapiSayaci}" required onchange="window.ybPage.yapiSinifiDegisti(${yapiSayaci})">
                    <option value="">Seçiniz...</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="5">5. Sınıf</option>
                </select>
            </div>
            <div class="yb-form-group">
                <label>Yapı Grubu *</label>
                <select id="yb-yapiGrubu-${yapiSayaci}" required onchange="window.ybPage.birimFiyatGuncelle(${yapiSayaci})">
                    <option value="">Önce sınıf seçin...</option>
                </select>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapım Tekniği *</label>
                <select id="yb-yapimTeknigi-${yapiSayaci}" required onchange="window.ybPage.yipranmaPayiGuncelle(${yapiSayaci})">
                    <option value="">Seçiniz...</option>
                    <option value="Çelik">Çelik</option>
                    <option value="Betonarme Karkas">Betonarme Karkas</option>
                    <option value="Yığma Kagir">Yığma Kagir</option>
                    <option value="Yığma Yarı Kagir">Yığma Yarı Kagir</option>
                    <option value="Ahşap">Ahşap</option>
                    <option value="Taş Duvarlı (Çamur Harçlı)">Taş Duvarlı (Çamur Harçlı)</option>
                    <option value="Kerpiç">Kerpiç</option>
                    <option value="Diğer Basit Binalar">Diğer Basit Binalar</option>
                </select>
            </div>
            <div class="yb-form-group">
                <label>Yapı Yaşı *</label>
                <select id="yb-yapiYasi-${yapiSayaci}" required onchange="window.ybPage.yipranmaPayiGuncelle(${yapiSayaci})">
                    <option value="">Seçiniz...</option>
                    <option value="3">0-3 yaş</option>
                    <option value="5">4-5 yaş</option>
                    <option value="10">6-10 yaş</option>
                    <option value="15">11-15 yaş</option>
                    <option value="20">16-20 yaş</option>
                    <option value="30">21-30 yaş</option>
                    <option value="40">31-40 yaş</option>
                    <option value="50">41-50 yaş</option>
                    <option value="75">51-75 yaş</option>
                    <option value="76">75 üstü yaş</option>
                </select>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapı Alanı (m²) *</label>
                <input type="number" id="yb-yapiAlani-${yapiSayaci}" step="0.01" min="0" required>
            </div>
            <div class="yb-form-group">
                <label>Birim Fiyat (TL/m²)</label>
                <input type="text" id="yb-birimFiyat-${yapiSayaci}" readonly>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yıpranma Payı (%)</label>
                <input type="number" id="yb-yipranmaPay-${yapiSayaci}" min="0" max="100" value="0">
            </div>
            <div class="yb-form-group">
                <label>Eksik İmalat Oranı (%)</label>
                <input type="number" id="yb-eksikImalat-${yapiSayaci}" min="0" max="100" value="0">
            </div>
        </div>
    `;
    
    container.appendChild(yapiCard);
}

/**
 * Yapı sil
 */
function yapiSil(index) {
    const yapiCard = document.getElementById(`yb-yapi-${index}`);
    if (yapiCard) {
        yapiCard.remove();
    }
}

/**
 * Yapı sınıfı değiştiğinde
 */
function yapiSinifiDegisti(index) {
    const sinifSelect = document.getElementById(`yb-yapiSinifi-${index}`);
    const grupSelect = document.getElementById(`yb-yapiGrubu-${index}`);
    const hesapYiliSelect = document.getElementById('yb-hesapYili');
    
    if (!sinifSelect || !grupSelect || !hesapYiliSelect) return;
    
    const sinif = sinifSelect.value;
    const birimFiyatId = hesapYiliSelect.value;
    
    if (!sinif || !birimFiyatId) {
        grupSelect.innerHTML = '<option value="">Önce sınıf ve dönem seçin...</option>';
        return;
    }
    
    // Grupları veritabanından yükle
    db.all(`SELECT DISTINCT yapiGrubu FROM birimFiyatDetay WHERE birimFiyatId = ? AND yapiSinifi = ? AND aktif = 1 ORDER BY yapiGrubu`, 
        [birimFiyatId, sinif], (err, rows) => {
            if (err) {
                console.error('Gruplar yüklenemedi:', err);
                return;
            }
            
            grupSelect.innerHTML = '<option value="">Grup Seçiniz...</option>';
            rows.forEach(row => {
                const option = document.createElement('option');
                option.value = row.yapiGrubu;
                option.textContent = `Grup ${row.yapiGrubu}`;
                grupSelect.appendChild(option);
            });
        });
}

/**
 * Birim fiyat güncelle
 */
function birimFiyatGuncelle(index) {
    const sinifSelect = document.getElementById(`yb-yapiSinifi-${index}`);
    const grupSelect = document.getElementById(`yb-yapiGrubu-${index}`);
    const hesapYiliSelect = document.getElementById('yb-hesapYili');
    const birimFiyatInput = document.getElementById(`yb-birimFiyat-${index}`);
    
    if (!sinifSelect || !grupSelect || !hesapYiliSelect || !birimFiyatInput) return;
    
    const sinif = sinifSelect.value;
    const grup = grupSelect.value;
    const birimFiyatId = hesapYiliSelect.value;
    
    if (!sinif || !grup || !birimFiyatId) {
        birimFiyatInput.value = '';
        return;
    }
    
    db.get(`SELECT birimFiyat FROM birimFiyatDetay WHERE birimFiyatId = ? AND yapiSinifi = ? AND yapiGrubu = ? AND aktif = 1`,
        [birimFiyatId, sinif, grup], (err, row) => {
            if (err || !row) {
                birimFiyatInput.value = '';
                return;
            }
            
            birimFiyatInput.value = row.birimFiyat.toLocaleString('tr-TR');
        });
}

/**
 * Yıpranma payı güncelle
 */
function yipranmaPayiGuncelle(index) {
    const yapimTeknigi = document.getElementById(`yb-yapimTeknigi-${index}`)?.value;
    const yapiYasi = parseInt(document.getElementById(`yb-yapiYasi-${index}`)?.value) || 0;
    const yipranmaPayInput = document.getElementById(`yb-yipranmaPay-${index}`);
    
    if (!yapimTeknigi || !yipranmaPayInput) return;
    
    // Yıpranma payını bul
    const yipranma = yipranmaPaylariCache.find(y => 
        y.yapimTeknigi === yapimTeknigi && 
        yapiYasi >= y.minYas && 
        yapiYasi <= y.maxYas
    );
    
    if (yipranma) {
        yipranmaPayInput.value = yipranma.yipranmaOrani;
    }
}

/**
 * Hesapla
 */
function hesapla() {
    const cokluParselModu = document.getElementById('yb-cokluParsel')?.checked;
    let toplamBedel = 0;
    
    if (cokluParselModu) {
        // Çoklu parsel modunda tüm parsellerin yapılarını hesapla
        document.querySelectorAll('.yb-parsel-yapi-card').forEach(yapiCard => {
            const yId = yapiCard.id.replace('yb-pyapi-', '');
            
            const birimFiyatStr = document.getElementById(`yb-${yId}-birimFiyat`)?.value || '0';
            const birimFiyat = parseFloat(birimFiyatStr.replace(/\./g, '').replace(',', '.')) || 0;
            const yapiAlani = parseFloat(document.getElementById(`yb-${yId}-yapiAlani`)?.value) || 0;
            const yipranmaPay = parseFloat(document.getElementById(`yb-${yId}-yipranmaPay`)?.value) || 0;
            const eksikImalat = parseFloat(document.getElementById(`yb-${yId}-eksikImalat`)?.value) || 0;
            
            let yapiBedeli = birimFiyat * yapiAlani;
            yapiBedeli = yapiBedeli * (1 - yipranmaPay / 100);
            yapiBedeli = yapiBedeli * (1 - eksikImalat / 100);
            
            toplamBedel += yapiBedeli;
        });
    } else {
        // Tekli parsel modu (mevcut davranış)
        const yapilar = document.querySelectorAll('[id^="yb-yapi-"]');
        
        yapilar.forEach(yapiCard => {
            const index = yapiCard.id.replace('yb-yapi-', '');
            
            const birimFiyatStr = document.getElementById(`yb-birimFiyat-${index}`)?.value || '0';
            const birimFiyat = parseFloat(birimFiyatStr.replace(/\./g, '').replace(',', '.')) || 0;
            const yapiAlani = parseFloat(document.getElementById(`yb-yapiAlani-${index}`)?.value) || 0;
            const yipranmaPay = parseFloat(document.getElementById(`yb-yipranmaPay-${index}`)?.value) || 0;
            const eksikImalat = parseFloat(document.getElementById(`yb-eksikImalat-${index}`)?.value) || 0;
            
            let yapiBedeli = birimFiyat * yapiAlani;
            yapiBedeli = yapiBedeli * (1 - yipranmaPay / 100);
            yapiBedeli = yapiBedeli * (1 - eksikImalat / 100);
            
            toplamBedel += yapiBedeli;
        });
    }
    
    // Sonuçları göster - çoklu parsel modunda farklı elementlere yaz
    const yapiBedeliInputId = cokluParselModu ? 'yb-cokluYapiBedeliHesaplanan' : 'yb-yapiBedeliHesaplanan';
    const levazimBedeliInputId = cokluParselModu ? 'yb-cokluLevazimBedeliHesaplanan' : 'yb-levazimBedeliHesaplanan';
    const asgariLevazimCheckboxId = cokluParselModu ? 'yb-cokluAsgariLevazimHesapla' : 'yb-asgariLevazimHesapla';
    
    const yapiBedeliInput = document.getElementById(yapiBedeliInputId);
    const levazimBedeliInput = document.getElementById(levazimBedeliInputId);
    
    if (yapiBedeliInput) {
        yapiBedeliInput.value = toplamBedel.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    }
    
    // Asgari levazım bedeli
    const asgariLevazimChecked = document.getElementById(asgariLevazimCheckboxId)?.checked;
    if (levazimBedeliInput && asgariLevazimChecked) {
        const levazimBedeli = toplamBedel * 0.7 * 0.75;
        levazimBedeliInput.value = levazimBedeli.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    } else if (levazimBedeliInput) {
        levazimBedeliInput.value = '';
    }
    
    if (window.showNotification) {
        window.showNotification('Hesaplama tamamlandı!', 'success');
    }
}

/**
 * Raporu kaydet
 */
function kaydet() {
    // Önce hesaplama yap
    hesapla();
    
    const cokluParselModu = document.getElementById('yb-cokluParsel')?.checked;
    
    if (cokluParselModu) {
        // Çoklu parsel modunda kaydet
        const formData = collectCokluParselFormData();
        if (!formData) {
            if (window.showNotification) {
                window.showNotification('Lütfen zorunlu alanları doldurun!', 'error');
            }
            return;
        }
        
        const cokluParselTipi = document.querySelector('input[name="yb-cokluParselTipi"]:checked')?.value || 'tekRapor';
        
        if (cokluParselTipi === 'ayriRaporlar') {
            // Ayrı Raporlar Modu: Her bir parseli tekli bir rapor gibi kaydet
            let basariliKayitSayisi = 0;
            let hataOlustu = false;
            
            const sqlSekans = `INSERT INTO raporlar (
                raporTarihi, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili,
                ili, ilce, mahalle, ada, parsel, yuzolcumu, malik,
                raportorAdi, raportorUnvani, resmiGazeteTarih, resmiGazeteSayili,
                asgariLevazimHesapla, yapilarJSON, fotograflarJSON, toplamYapiBedeli, yapiBedeli, modul,
                cokluParsel
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            // Veritabanı işlemleri asenkron olduğu için Promise ile yönetelim
            const savePromises = formData.parseller.map(parsel => {
                return new Promise((resolve, reject) => {
                    let parselYapiBedeli = 0;
                    parsel.yapilar.forEach(yapi => {
                        parselYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
                    });
                    
                    const parselFotograflarJSON = JSON.stringify(parsel.fotograflar || []);
                    
                    db.run(sqlSekans, [
                        formData.raporTarihi,
                        formData.resmiYaziTarihi,
                        formData.resmiYaziSayisi,
                        formData.ilgiliKurum,
                        formData.hesapYili,
                        'Samsun',
                        parsel.ilce || '',
                        parsel.mahalle || '',
                        parsel.ada || '',
                        parsel.parsel || '',
                        parsel.yuzolcumu || '',
                        parsel.malik || '',
                        formData.raportorAdi,
                        formData.raportorUnvani,
                        formData.resmiGazeteTarih,
                        formData.resmiGazeteSayili,
                        formData.asgariLevazimHesapla ? 1 : 0,
                        JSON.stringify(parsel.yapilar),
                        parselFotograflarJSON,
                        parselYapiBedeli,
                        parselYapiBedeli.toString(),
                        'yapi-bedeli',
                        0 // Tekil rapor gibi davranması için 0 veriyoruz
                    ], function(err) {
                        if (err) {
                            console.error('Kayıt hatası:', err);
                            hataOlustu = true;
                            reject(err);
                        } else {
                            basariliKayitSayisi++;
                            resolve(this.lastID);
                        }
                    });
                });
            });
            
            Promise.allSettled(savePromises).then(() => {
                if (window.showNotification) {
                    if (hataOlustu && basariliKayitSayisi > 0) {
                        window.showNotification(`Sadece ${basariliKayitSayisi} rapor kaydedilebildi.`, 'error');
                    } else if (hataOlustu) {
                        window.showNotification('Raporlar kaydedilirken hata oluştu!', 'error');
                    } else {
                        window.showNotification(`${basariliKayitSayisi} adet rapor başarıyla oluşturuldu!`, 'success');
                    }
                }
            });
            
        } else {
            // Tek Rapor Modu (Mevcut Davranış)
            let toplamYapiBedeli = 0;
            formData.parseller.forEach(parsel => {
                parsel.yapilar.forEach(yapi => {
                    toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
                });
            });
            
            const fotograflarJSON = JSON.stringify(fotograflar);
            
            console.log('📊 Çoklu Parsel Kayıt - Toplam Yapı Bedeli:', toplamYapiBedeli);
            
            const sql = `INSERT INTO raporlar (
                raporTarihi, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili,
                ili, ilce, mahalle, ada, parsel, yuzolcumu, malik,
                raportorAdi, raportorUnvani, resmiGazeteTarih, resmiGazeteSayili,
                asgariLevazimHesapla, yapilarJSON, fotograflarJSON, toplamYapiBedeli, yapiBedeli, modul,
                cokluParsel, parsellerJSON
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            // İlk parselin bilgilerini ana alanlara yaz (geriye uyumluluk)
            const ilkParsel = formData.parseller[0] || {};
            
            db.run(sql, [
                formData.raporTarihi,
                formData.resmiYaziTarihi,
                formData.resmiYaziSayisi,
                formData.ilgiliKurum,
                formData.hesapYili,
                'Samsun',
                ilkParsel.ilce || '',
                ilkParsel.mahalle || '',
                ilkParsel.ada || '',
                ilkParsel.parsel || '',
                ilkParsel.yuzolcumu || '',
                ilkParsel.malik || '',
                formData.raportorAdi,
                formData.raportorUnvani,
                formData.resmiGazeteTarih,
                formData.resmiGazeteSayili,
                formData.asgariLevazimHesapla ? 1 : 0,
                JSON.stringify(formData.parseller),
                fotograflarJSON,
                toplamYapiBedeli,
                toplamYapiBedeli.toString(),
                'yapi-bedeli',
                1,
                JSON.stringify(formData.parseller)
            ], function(err) {
                if (err) {
                    console.error('Kayıt hatası:', err);
                    if (window.showNotification) {
                        window.showNotification('Kayıt sırasında hata oluştu!', 'error');
                    }
                    return;
                }
                
                if (window.showNotification) {
                    window.showNotification(`Çoklu parsel raporu başarıyla kaydedildi! (ID: ${this.lastID})`, 'success');
                }
            });
        }
    } else {
        // Tekli parsel modu (mevcut davranış)
        const formData = collectFormData();
        
        if (!formData) {
            if (window.showNotification) {
                window.showNotification('Lütfen zorunlu alanları doldurun!', 'error');
            }
            return;
        }
        
        let toplamYapiBedeli = 0;
        formData.yapilar.forEach(yapi => {
            toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
        });
        
        const fotograflarJSON = JSON.stringify(fotograflar);
        
        console.log('📊 Kayıt - Toplam Yapı Bedeli:', toplamYapiBedeli);
        console.log('📷 Kayıt - Fotoğraf sayısı:', fotograflar.length);
        
        const sql = `INSERT INTO raporlar (
            raporTarihi, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili,
            ili, ilce, mahalle, ada, parsel, yuzolcumu, malik,
            raportorAdi, raportorUnvani, resmiGazeteTarih, resmiGazeteSayili,
            asgariLevazimHesapla, yapilarJSON, fotograflarJSON, toplamYapiBedeli, yapiBedeli, modul
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.run(sql, [
            formData.raporTarihi,
            formData.resmiYaziTarihi,
            formData.resmiYaziSayisi,
            formData.ilgiliKurum,
            formData.hesapYili,
            'Samsun',
            formData.ilce,
            formData.mahalle,
            formData.ada,
            formData.parsel,
            formData.yuzolcumu,
            formData.malik,
            formData.raportorAdi,
            formData.raportorUnvani,
            formData.resmiGazeteTarih,
            formData.resmiGazeteSayili,
            formData.asgariLevazimHesapla ? 1 : 0,
            JSON.stringify(formData.yapilar),
            fotograflarJSON,
            toplamYapiBedeli,
            toplamYapiBedeli.toString(),
            'yapi-bedeli'
        ], function(err) {
            if (err) {
                console.error('Kayıt hatası:', err);
                if (window.showNotification) {
                    window.showNotification('Kayıt sırasında hata oluştu!', 'error');
                }
                return;
            }
            
            if (window.showNotification) {
                window.showNotification(`Rapor başarıyla kaydedildi! (ID: ${this.lastID})`, 'success');
            }
        });
    }
}

/**
 * Form verilerini topla
 */
function collectFormData() {
    const hesapYiliSelect = document.getElementById('yb-hesapYili');
    const selectedOption = hesapYiliSelect?.options[hesapYiliSelect.selectedIndex];
    
    // Raportör bilgilerini topla
    const raportorSayisi = parseInt(document.getElementById('yb-raportorSayisi')?.value) || 1;
    const raportorAdlari = [];
    const raportorUnvanlari = [];
    
    for (let i = 1; i <= raportorSayisi; i++) {
        const ad = document.getElementById(`yb-raportorAdi${i}`)?.value;
        const unvan = document.getElementById(`yb-raportorUnvani${i}`)?.value;
        if (ad) {
            raportorAdlari.push(ad);
            raportorUnvanlari.push(unvan || '');
        }
    }
    
    // Yapı bilgilerini topla
    const yapilar = [];
    document.querySelectorAll('[id^="yb-yapi-"]').forEach(yapiCard => {
        const index = yapiCard.id.replace('yb-yapi-', '');
        
        const birimFiyatStr = document.getElementById(`yb-birimFiyat-${index}`)?.value || '0';
        const birimFiyat = parseFloat(birimFiyatStr.replace(/\./g, '').replace(',', '.')) || 0;
        const yapiAlani = parseFloat(document.getElementById(`yb-yapiAlani-${index}`)?.value) || 0;
        const yipranmaPay = parseFloat(document.getElementById(`yb-yipranmaPay-${index}`)?.value) || 0;
        const eksikImalat = parseFloat(document.getElementById(`yb-eksikImalat-${index}`)?.value) || 0;
        
        let yapiBedeli = birimFiyat * yapiAlani;
        yapiBedeli = yapiBedeli * (1 - yipranmaPay / 100);
        yapiBedeli = yapiBedeli * (1 - eksikImalat / 100);
        
        yapilar.push({
            yapiNo: document.getElementById(`yb-yapiNo-${index}`)?.value || index,
            yapiAdi: document.getElementById(`yb-yapiAdi-${index}`)?.value || '',
            yapiSinifi: document.getElementById(`yb-yapiSinifi-${index}`)?.value || '',
            yapiGrubu: document.getElementById(`yb-yapiGrubu-${index}`)?.value || '',
            yapimTeknigi: document.getElementById(`yb-yapimTeknigi-${index}`)?.value || '',
            yapiYasi: document.getElementById(`yb-yapiYasi-${index}`)?.value || '',
            yapiAlani: yapiAlani,
            birimFiyat: birimFiyat,
            yipranmaPay: yipranmaPay,
            eksikImalatOrani: eksikImalat,
            yapiBedeli: yapiBedeli
        });
    });
    
    return {
        raporTarihi: document.getElementById('yb-raporTarihi')?.value,
        resmiYaziTarihi: document.getElementById('yb-resmiYaziTarihi')?.value,
        resmiYaziSayisi: [
            document.getElementById('yb-resmiYaziSayisi1')?.value || '',
            document.getElementById('yb-resmiYaziSayisi2')?.value || '',
            document.getElementById('yb-resmiYaziSayisi3')?.value || '',
            document.getElementById('yb-resmiYaziSayisi4')?.value || ''
        ].filter(v => v.trim() !== '').join('-'),
        ilgiliKurum: document.getElementById('yb-ilgiliKurum')?.value,
        hesapYili: selectedOption?.dataset.yil || '',
        ilce: document.getElementById('yb-ilce')?.value,
        mahalle: document.getElementById('yb-mahalle')?.value,
        ada: document.getElementById('yb-ada')?.value,
        parsel: document.getElementById('yb-parsel')?.value,
        yuzolcumu: document.getElementById('yb-yuzolcumu')?.value,
        malik: document.getElementById('yb-malik')?.value,
        raportorAdi: raportorAdlari.join(', '),
        raportorUnvani: raportorUnvanlari.join(', '),
        resmiGazeteTarih: selectedOption?.dataset.rgTarih || '',
        resmiGazeteSayili: selectedOption?.dataset.rgSayili || '',
        asgariLevazimHesapla: document.getElementById('yb-asgariLevazimHesapla')?.checked,
        yapilar: yapilar
    };
}

/**
 * Yeni eklenecek parsel bazlı fotoğraflar değiştiğinde.
 */
function parselFotograflarDegisti(event, parselId) {
    const files = event.target.files;
    const containerId = `yb-p${parselId}-fotografOnizleme`;
    const previewContainer = document.getElementById(containerId);
    
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (!parselFotograflari) parselFotograflari = {};
    parselFotograflari[parselId] = []; // sıfırla
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Benzersiz isim oluştur
        let ext = file.name.split('.').pop();
        if(!ext) ext = 'jpg';
        const newFileName = Date.now() + '_' + Math.random().toString(36).substr(2, 9) + '.' + ext;
        
        const previewEl = document.createElement('div');
        previewEl.style.cssText = 'position: relative; width: 100px; height: 100px; border-radius: 6px; overflow: hidden; border: 1px solid #ddd; display: inline-block;';
        
        // Küçük resim yükleniyora ayarla
        previewEl.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #f5f5f5; color: #888; font-size: 12px;">Yükleniyor...</div>';
        previewContainer.appendChild(previewEl);
        
        // Dosyayı oku ve base64 olarak al
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64Data = e.target.result;
            
            previewEl.innerHTML = `
                <img src="${base64Data}" style="width: 100%; height: 100%; object-fit: cover;">
            `;
            
            // Veri dizisine ekle
            parselFotograflari[parselId].push({
                data: base64Data,
                name: file.name,
                fileName: newFileName,
                type: file.type || 'image/jpeg'
            });
            console.log(`📷 [Parsel ${parselId}] Fotoğraf yüklendi: ${newFileName}`);
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Fotoğraflar değiştiğinde
 */
function fotograflarDegisti(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Mevcut fotoğraflara ekle
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                // Resim boyutlarını al
                const img = new Image();
                img.onload = () => {
                    fotograflar.push({
                        name: file.name,
                        data: event.target.result,
                        width: img.width,
                        height: img.height,
                        isLandscape: img.width >= img.height,
                        aciklama: '' // Kullanıcı sonra ekleyebilir
                    });
                    fotografOnizlemeGuncelle();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}

/**
 * Fotoğraf önizlemesini güncelle
 */
function fotografOnizlemeGuncelle() {
    const cokluParselModu = document.getElementById('yb-cokluParsel')?.checked;
    const containerId = cokluParselModu ? 'yb-cokluFotografOnizleme' : 'yb-fotografOnizleme';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (fotograflar.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic;">Henüz fotoğraf eklenmedi</p>';
        return;
    }
    
    fotograflar.forEach((foto, index) => {
        const card = document.createElement('div');
        card.className = 'yb-foto-card';
        card.style.cssText = `
            position: relative;
            display: inline-block;
            margin: 5px;
            border: 2px solid #ddd;
            border-radius: 8px;
            padding: 5px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        const orientationBadge = foto.isLandscape ? '🖼️ Yatay' : '📷 Dikey';
        const orientationColor = foto.isLandscape ? '#28a745' : '#007bff';
        
        card.innerHTML = `
            <div style="position: relative;">
                <img src="${foto.data}" alt="${foto.name}" style="
                    max-width: 120px;
                    max-height: 90px;
                    object-fit: cover;
                    border-radius: 4px;
                    display: block;
                ">
                <button type="button" onclick="window.ybPage.fotografSil(${index})" style="
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: none;
                    background: #dc3545;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
            <div style="margin-top: 5px; text-align: center;">
                <span style="
                    font-size: 10px;
                    padding: 2px 6px;
                    border-radius: 10px;
                    background: ${orientationColor};
                    color: white;
                ">${orientationBadge}</span>
            </div>
            <input type="text" 
                placeholder="Açıklama (opsiyonel)" 
                value="${foto.aciklama || ''}"
                onchange="window.ybPage.fotografAciklamaGuncelle(${index}, this.value)"
                style="
                    width: 100%;
                    margin-top: 5px;
                    padding: 4px;
                    font-size: 11px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    box-sizing: border-box;
                ">
        `;
        
        container.appendChild(card);
    });
    
    // Toplam bilgisi
    const info = document.createElement('div');
    info.style.cssText = 'width: 100%; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; font-size: 13px;';
    const sayfaSayisi = Math.ceil(fotograflar.length / 4);
    const yatay = fotograflar.filter(f => f.isLandscape).length;
    const dikey = fotograflar.filter(f => !f.isLandscape).length;
    info.innerHTML = `
        <strong>📊 Fotoğraf Özeti:</strong><br>
        Toplam: ${fotograflar.length} fotoğraf | 
        🖼️ Yatay: ${yatay} | 📷 Dikey: ${dikey}<br>
        📄 Raporda ${sayfaSayisi} sayfa oluşturulacak (sayfa başına 4 fotoğraf)
    `;
    container.appendChild(info);
}

/**
 * Fotoğraf sil
 */
function fotografSil(index) {
    fotograflar.splice(index, 1);
    fotografOnizlemeGuncelle();
}

/**
 * Fotoğraf açıklamasını güncelle
 */
function fotografAciklamaGuncelle(index, aciklama) {
    if (fotograflar[index]) {
        fotograflar[index].aciklama = aciklama;
    }
}

/**
 * Word rapor oluştur (fotoğraflarla birlikte)
 */
function wordRaporOlustur() {
    // Önce hesaplama yap
    hesapla();
    
    const cokluParselModu = document.getElementById('yb-cokluParsel')?.checked;
    
    if (cokluParselModu) {
        // Çoklu parsel modunda Word export
        const formData = collectCokluParselFormData();
        if (!formData) {
            if (window.showNotification) {
                window.showNotification('Lütfen zorunlu alanları doldurun!', 'error');
            }
            return;
        }
        
        let toplamYapiBedeli = 0;
        formData.parseller.forEach(parsel => {
            parsel.yapilar.forEach(yapi => {
                toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
            });
        });
        
        console.log('📊 Çoklu Parsel Word Export - Toplam Yapı Bedeli:', toplamYapiBedeli);
        
        const raporData = {
            cokluParsel: true,
            raporTarihi: formData.raporTarihi,
            resmiYaziTarihi: formData.resmiYaziTarihi,
            resmiYaziSayisi: formData.resmiYaziSayisi,
            ilgiliKurum: formData.ilgiliKurum,
            hesapYili: formData.hesapYili,
            ili: 'Samsun',
            raportorAdi: formData.raportorAdi,
            raportorUnvani: formData.raportorUnvani,
            resmiGazeteTarih: formData.resmiGazeteTarih,
            resmiGazeteSayili: formData.resmiGazeteSayili,
            asgariLevazimHesapla: formData.asgariLevazimHesapla ? 1 : 0,
            parsellerJSON: JSON.stringify(formData.parseller),
            yapiBedeli: toplamYapiBedeli
        };
        
        ipcRenderer.send('export-word-with-photos', {
            raporData: raporData,
            fotograflar: fotograflar
        });
        
        if (window.showNotification) {
            window.showNotification('Çoklu parsel Word raporu oluşturuluyor...', 'info');
        }
    } else {
        // Tekli parsel modu (mevcut davranış)
        const formData = collectFormData();
        
        if (!formData) {
            if (window.showNotification) {
                window.showNotification('Lütfen zorunlu alanları doldurun!', 'error');
            }
            return;
        }
        
        let toplamYapiBedeli = 0;
        formData.yapilar.forEach(yapi => {
            toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
        });
        
        console.log('📊 Word Export - Toplam Yapı Bedeli:', toplamYapiBedeli);
        console.log('📷 Fotoğraf sayısı:', fotograflar.length);
        
        const raporData = {
            raporTarihi: formData.raporTarihi,
            resmiYaziTarihi: formData.resmiYaziTarihi,
            resmiYaziSayisi: formData.resmiYaziSayisi,
            ilgiliKurum: formData.ilgiliKurum,
            hesapYili: formData.hesapYili,
            ili: 'Samsun',
            ilce: formData.ilce,
            mahalle: formData.mahalle,
            ada: formData.ada,
            parsel: formData.parsel,
            yuzolcumu: formData.yuzolcumu,
            malik: formData.malik,
            raportorAdi: formData.raportorAdi,
            raportorUnvani: formData.raportorUnvani,
            resmiGazeteTarih: formData.resmiGazeteTarih,
            resmiGazeteSayili: formData.resmiGazeteSayili,
            asgariLevazimHesapla: formData.asgariLevazimHesapla ? 1 : 0,
            yapilarJSON: JSON.stringify(formData.yapilar),
            yapiBedeli: toplamYapiBedeli
        };
        
        ipcRenderer.send('export-word-with-photos', {
            raporData: raporData,
            fotograflar: fotograflar
        });
        
        if (window.showNotification) {
            window.showNotification('Word raporu oluşturuluyor...', 'info');
        }
    }
}

/**
 * Formu temizle
 */
function temizle() {
    if (!confirm('Form temizlenecek. Emin misiniz?')) return;
    
    // Tüm inputları temizle
    document.querySelectorAll('#page-container input').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = true;
        } else if (input.type !== 'hidden' && input.type !== 'file') {
            input.value = '';
        }
    });
    
    // Selectleri sıfırla
    document.querySelectorAll('#page-container select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Yapıları sıfırla
    const container = document.getElementById('yb-yapiListesiContainer');
    if (container) {
        container.innerHTML = '';
        yapiSayaci = 0;
        yeniYapiEkle();
    }
    
    // Fotoğrafları temizle
    fotograflar = [];
    const fotografInput = document.getElementById('yb-fotograflar');
    if (fotografInput) fotografInput.value = '';
    fotografOnizlemeGuncelle();
    
    // Bugünün tarihini ayarla
    const today = new Date().toISOString().split('T')[0];
    const raporTarihiEl = document.getElementById('yb-raporTarihi');
    if (raporTarihiEl) raporTarihiEl.value = today;
    
    // İlk tab'a dön
    showTab('genel');
    
    if (window.showNotification) {
        window.showNotification('Form temizlendi', 'info');
    }
}

/**
 * Çoklu parsel modunu değiştir
 */
function cokluParselModuDegistir() {
    const checked = document.getElementById('yb-cokluParsel')?.checked;
    const tekliMod = document.getElementById('yb-tekliParselModu');
    const cokluMod = document.getElementById('yb-cokluParselModu');
    const yapiTab = document.getElementById('yb-tab-yapi');
    const yapiTabBtn = document.querySelector('.yb-tab-button[data-tab="yapi"]');
    const tiplerDiv = document.getElementById('yb-cokluParselTipleri');
    
    if (checked) {
        // Çoklu parsel moduna geç
        if (tekliMod) tekliMod.style.display = 'none';
        if (cokluMod) cokluMod.style.display = 'block';
        if (tiplerDiv) tiplerDiv.style.display = 'block'; // Radyo düğmelerini göster
        
        // Yapı tab'ını gizle (çoklu parselde yapılar parsel kartının içinde)
        if (yapiTab) yapiTab.style.display = 'none';
        if (yapiTabBtn) yapiTabBtn.style.display = 'none';
        
        // İlk parseli ekle
        if (parselSayaci === 0) {
            yeniParselEkle();
        }
        
        // Radyo seçimine göre fotoğraf alanlarını ayarla
        if (typeof cokluParselTipiDegistir === 'function') {
            cokluParselTipiDegistir();
        }
    } else {
        // Tekli parsel moduna geri dön
        if (tekliMod) tekliMod.style.display = 'block';
        if (cokluMod) cokluMod.style.display = 'none';
        if (tiplerDiv) tiplerDiv.style.display = 'none'; // Radyo düğmelerini gizle
        
        if (yapiTab) yapiTab.style.display = '';
        if (yapiTabBtn) yapiTabBtn.style.display = '';
    }
}

/**
 * Çoklu parsel tipi değiştiğinde fotoğraf alanlarını ayarla
 */
function cokluParselTipiDegistir() {
    const cokluParselTipi = document.querySelector('input[name="yb-cokluParselTipi"]:checked')?.value || 'tekRapor';
    const genelFotografAlani = document.getElementById('yb-genelFotografAlani');
    const parselFotografAlanlari = document.querySelectorAll('.yb-parsel-fotograf-alani');
    
    if (cokluParselTipi === 'ayriRaporlar') {
        if (genelFotografAlani) genelFotografAlani.style.display = 'none';
        parselFotografAlanlari.forEach(el => el.style.display = 'flex');
    } else {
        if (genelFotografAlani) genelFotografAlani.style.display = 'flex';
        parselFotografAlanlari.forEach(el => el.style.display = 'none');
    }
}

/**
 * Yeni parsel ekle (çoklu parsel modu)
 */
function yeniParselEkle() {
    parselSayaci++;
    const container = document.getElementById('yb-parselListesiContainer');
    if (!container) return;
    
    const parselCard = document.createElement('div');
    parselCard.className = 'yb-parsel-card';
    parselCard.id = `yb-parsel-${parselSayaci}`;
    parselCard.dataset.parselId = parselSayaci;
    parselCard.dataset.yapiSayaci = '0';
    parselCard.style.cssText = 'border: 2px solid #007bff; border-radius: 10px; padding: 20px; margin-bottom: 25px; background: #f0f7ff;';
    
    // İlçe select options (varsayılan ilin aktif ilçeleri - populateIlceler tarafından doldurulan cache)
    const ilceOptions = ilcelerCache.map(ilce => `<option value="${ilce}">${ilce}</option>`).join('');
    
    parselCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            <h3 style="color: #0056b3; margin: 0;">📍 Parsel ${parselSayaci}</h3>
            ${parselSayaci > 1 ? `<button type="button" onclick="window.ybPage.parselSil(${parselSayaci})" style="background: #E53935; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: 600;">🗑️ Parseli Sil</button>` : ''}
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>İlçe *</label>
                <select id="yb-p${parselSayaci}-ilce" required>
                    <option value="">İlçe Seçiniz</option>
                    ${ilceOptions}
                </select>
            </div>
            <div class="yb-form-group">
                <label>Mahalle *</label>
                <input type="text" id="yb-p${parselSayaci}-mahalle" placeholder="Mahalle adı" required>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Ada *</label>
                <input type="text" id="yb-p${parselSayaci}-ada" placeholder="Ada numarası" required>
            </div>
            <div class="yb-form-group">
                <label>Parsel *</label>
                <input type="text" id="yb-p${parselSayaci}-parsel" placeholder="Parsel numarası" required>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yüzölçümü (m²)</label>
                <input type="text" id="yb-p${parselSayaci}-yuzolcumu" placeholder="Örn: 150.50">
            </div>
            <div class="yb-form-group">
                <label>Malik İsmi</label>
                <input type="text" id="yb-p${parselSayaci}-malik" placeholder="Malik adı soyadı">
            </div>
        </div>
        
        <!-- Bu parselin yapıları -->
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px dashed #007bff;">
            <h4 style="color: #2A4C6E; margin: 0 0 10px 0;">🏗️ Bu Parseldeki Yapılar</h4>
            <div id="yb-p${parselSayaci}-yapiListesi"></div>
            <div style="text-align: center; margin-top: 10px;">
                <button type="button" onclick="window.ybPage.parselYapiEkle(${parselSayaci})" style="padding: 8px 18px; background: linear-gradient(135deg, #28a745 0%, #218838 100%); color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;">
                    ➕ Yapı Ekle
                </button>
            </div>
        </div>
        
        <!-- Arsa Fotoğrafı (Sadece Ayrı Raporlar modunda görünür) -->
        <div class="yb-form-row yb-parsel-fotograf-alani" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px dashed #007bff;">
            <div class="yb-form-group" style="grid-column: 1 / -1;">
                <label for="yb-p${parselSayaci}-fotograflar">📷 Parsel İçin Fotoğraflar</label>
                <input type="file" id="yb-p${parselSayaci}-fotograflar" accept="image/*" multiple onchange="window.ybPage.parselFotograflarDegisti(event, ${parselSayaci})">
                <div id="yb-p${parselSayaci}-fotografOnizleme" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;"></div>
            </div>
        </div>
    `;
    
    container.appendChild(parselCard);
    
    // Fotoğraf nesnesini ilk değerlerle (boş dizi) ilklendir
    parselFotograflari[parselSayaci] = [];
    
    // Mevcut radyo düğmesi durumuna göre alanın görünürlüğünü güncelle
    if (typeof cokluParselTipiDegistir === 'function') {
        const cokluParselTipi = document.querySelector('input[name="yb-cokluParselTipi"]:checked')?.value || 'tekRapor';
        if (cokluParselTipi === 'ayriRaporlar') {
            const fotoAlani = parselCard.querySelector('.yb-parsel-fotograf-alani');
            if (fotoAlani) fotoAlani.style.display = 'flex';
        }
    }
    
    // İlk yapıyı otomatik ekle
    parselYapiEkle(parselSayaci);
}

/**
 * Parsel sil (çoklu parsel modu)
 */
function parselSil(parselId) {
    const parselCard = document.getElementById(`yb-parsel-${parselId}`);
    if (parselCard) {
        parselCard.remove();
    }
}

/**
 * Parsele yapı ekle (çoklu parsel modu)
 */
function parselYapiEkle(parselId) {
    const parselCard = document.getElementById(`yb-parsel-${parselId}`);
    if (!parselCard) return;
    
    let yapiSayac = parseInt(parselCard.dataset.yapiSayaci) || 0;
    yapiSayac++;
    parselCard.dataset.yapiSayaci = yapiSayac;
    
    const yapiContainer = document.getElementById(`yb-p${parselId}-yapiListesi`);
    if (!yapiContainer) return;
    
    const yapiId = `p${parselId}-y${yapiSayac}`;
    const yapiCard = document.createElement('div');
    yapiCard.className = 'yb-parsel-yapi-card';
    yapiCard.id = `yb-pyapi-${yapiId}`;
    yapiCard.dataset.parselId = parselId;
    yapiCard.dataset.yapiNo = yapiSayac;
    yapiCard.style.cssText = 'border: 1px solid #D3DAE3; border-radius: 6px; padding: 15px; margin-bottom: 10px; background: #fff;';
    
    yapiCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #2A4C6E;">Yapı ${yapiSayac}</strong>
            ${yapiSayac > 1 ? `<button type="button" onclick="window.ybPage.parselYapiSil('${yapiId}')" style="background: #E53935; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Sil</button>` : ''}
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapı Adı *</label>
                <input type="text" id="yb-${yapiId}-yapiAdi" placeholder="Örn: Ev, Ahır, Depo" required>
            </div>
            <div class="yb-form-group">
                <label>Yapı Sınıfı *</label>
                <select id="yb-${yapiId}-yapiSinifi" required onchange="window.ybPage.parselYapiSinifiDegisti('${yapiId}')">
                    <option value="">Seçiniz...</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="5">5. Sınıf</option>
                </select>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapı Grubu *</label>
                <select id="yb-${yapiId}-yapiGrubu" required onchange="window.ybPage.parselYapiBirimFiyatGuncelle('${yapiId}')">
                    <option value="">Önce sınıf seçin...</option>
                </select>
            </div>
            <div class="yb-form-group">
                <label>Yapım Tekniği *</label>
                <select id="yb-${yapiId}-yapimTeknigi" required onchange="window.ybPage.parselYapiYipranmaGuncelle('${yapiId}')">
                    <option value="">Seçiniz...</option>
                    <option value="Çelik">Çelik</option>
                    <option value="Betonarme Karkas">Betonarme Karkas</option>
                    <option value="Yığma Kagir">Yığma Kagir</option>
                    <option value="Yığma Yarı Kagir">Yığma Yarı Kagir</option>
                    <option value="Ahşap">Ahşap</option>
                    <option value="Taş Duvarlı (Çamur Harçlı)">Taş Duvarlı (Çamur Harçlı)</option>
                    <option value="Kerpiç">Kerpiç</option>
                    <option value="Diğer Basit Binalar">Diğer Basit Binalar</option>
                </select>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Yapı Yaşı *</label>
                <select id="yb-${yapiId}-yapiYasi" required onchange="window.ybPage.parselYapiYipranmaGuncelle('${yapiId}')">
                    <option value="">Seçiniz...</option>
                    <option value="3">0-3 yaş</option>
                    <option value="5">4-5 yaş</option>
                    <option value="10">6-10 yaş</option>
                    <option value="15">11-15 yaş</option>
                    <option value="20">16-20 yaş</option>
                    <option value="30">21-30 yaş</option>
                    <option value="40">31-40 yaş</option>
                    <option value="50">41-50 yaş</option>
                    <option value="75">51-75 yaş</option>
                    <option value="76">75 üstü yaş</option>
                </select>
            </div>
            <div class="yb-form-group">
                <label>Yapı Alanı (m²) *</label>
                <input type="number" id="yb-${yapiId}-yapiAlani" step="0.01" min="0" required>
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Birim Fiyat (TL/m²)</label>
                <input type="text" id="yb-${yapiId}-birimFiyat" readonly>
            </div>
            <div class="yb-form-group">
                <label>Yıpranma Payı (%)</label>
                <input type="number" id="yb-${yapiId}-yipranmaPay" min="0" max="100" value="0">
            </div>
        </div>
        
        <div class="yb-form-row">
            <div class="yb-form-group">
                <label>Eksik İmalat Oranı (%)</label>
                <input type="number" id="yb-${yapiId}-eksikImalat" min="0" max="100" value="0">
            </div>
            <div class="yb-form-group"></div>
        </div>
    `;
    
    yapiContainer.appendChild(yapiCard);
}

/**
 * Parsel yapısını sil
 */
function parselYapiSil(yapiId) {
    const yapiCard = document.getElementById(`yb-pyapi-${yapiId}`);
    if (yapiCard) {
        yapiCard.remove();
    }
}

/**
 * Parsel yapı sınıfı değiştiğinde (çoklu parsel modu)
 */
function parselYapiSinifiDegisti(yapiId) {
    const sinifSelect = document.getElementById(`yb-${yapiId}-yapiSinifi`);
    const grupSelect = document.getElementById(`yb-${yapiId}-yapiGrubu`);
    const hesapYiliSelect = document.getElementById('yb-hesapYili');
    
    if (!sinifSelect || !grupSelect || !hesapYiliSelect) return;
    
    const sinif = sinifSelect.value;
    const birimFiyatId = hesapYiliSelect.value;
    
    if (!sinif || !birimFiyatId) {
        grupSelect.innerHTML = '<option value="">Önce sınıf ve dönem seçin...</option>';
        return;
    }
    
    db.all(`SELECT DISTINCT yapiGrubu FROM birimFiyatDetay WHERE birimFiyatId = ? AND yapiSinifi = ? AND aktif = 1 ORDER BY yapiGrubu`, 
        [birimFiyatId, sinif], (err, rows) => {
            if (err) {
                console.error('Gruplar yüklenemedi:', err);
                return;
            }
            
            grupSelect.innerHTML = '<option value="">Grup Seçiniz...</option>';
            rows.forEach(row => {
                const option = document.createElement('option');
                option.value = row.yapiGrubu;
                option.textContent = `Grup ${row.yapiGrubu}`;
                grupSelect.appendChild(option);
            });
        });
}

/**
 * Parsel yapı birim fiyat güncelle (çoklu parsel modu)
 */
function parselYapiBirimFiyatGuncelle(yapiId) {
    const sinifSelect = document.getElementById(`yb-${yapiId}-yapiSinifi`);
    const grupSelect = document.getElementById(`yb-${yapiId}-yapiGrubu`);
    const hesapYiliSelect = document.getElementById('yb-hesapYili');
    const birimFiyatInput = document.getElementById(`yb-${yapiId}-birimFiyat`);
    
    if (!sinifSelect || !grupSelect || !hesapYiliSelect || !birimFiyatInput) return;
    
    const sinif = sinifSelect.value;
    const grup = grupSelect.value;
    const birimFiyatId = hesapYiliSelect.value;
    
    if (!sinif || !grup || !birimFiyatId) {
        birimFiyatInput.value = '';
        return;
    }
    
    db.get(`SELECT birimFiyat FROM birimFiyatDetay WHERE birimFiyatId = ? AND yapiSinifi = ? AND yapiGrubu = ? AND aktif = 1`,
        [birimFiyatId, sinif, grup], (err, row) => {
            if (err || !row) {
                birimFiyatInput.value = '';
                return;
            }
            
            birimFiyatInput.value = row.birimFiyat.toLocaleString('tr-TR');
        });
}

/**
 * Parsel yapı yıpranma payı güncelle (çoklu parsel modu)
 */
function parselYapiYipranmaGuncelle(yapiId) {
    const yapimTeknigi = document.getElementById(`yb-${yapiId}-yapimTeknigi`)?.value;
    const yapiYasi = parseInt(document.getElementById(`yb-${yapiId}-yapiYasi`)?.value) || 0;
    const yipranmaPayInput = document.getElementById(`yb-${yapiId}-yipranmaPay`);
    
    if (!yapimTeknigi || !yipranmaPayInput) return;
    
    const yipranma = yipranmaPaylariCache.find(y => 
        y.yapimTeknigi === yapimTeknigi && 
        yapiYasi >= y.minYas && 
        yapiYasi <= y.maxYas
    );
    
    if (yipranma) {
        yipranmaPayInput.value = yipranma.yipranmaOrani;
    }
}

/**
 * Çoklu parsel modu için form verilerini topla
 */
function collectCokluParselFormData() {
    const hesapYiliSelect = document.getElementById('yb-hesapYili');
    const selectedOption = hesapYiliSelect?.options[hesapYiliSelect.selectedIndex];
    
    // Raportör bilgilerini topla
    const raportorSayisi = parseInt(document.getElementById('yb-raportorSayisi')?.value) || 1;
    const raportorAdlari = [];
    const raportorUnvanlari = [];
    
    for (let i = 1; i <= raportorSayisi; i++) {
        const ad = document.getElementById(`yb-raportorAdi${i}`)?.value;
        const unvan = document.getElementById(`yb-raportorUnvani${i}`)?.value;
        if (ad) {
            raportorAdlari.push(ad);
            raportorUnvanlari.push(unvan || '');
        }
    }
    
    // Parselleri topla
    const parseller = [];
    document.querySelectorAll('.yb-parsel-card').forEach(parselCard => {
        const pId = parselCard.dataset.parselId;
        
        const parselData = {
            ilce: document.getElementById(`yb-p${pId}-ilce`)?.value || '',
            mahalle: document.getElementById(`yb-p${pId}-mahalle`)?.value || '',
            ada: document.getElementById(`yb-p${pId}-ada`)?.value || '',
            parsel: document.getElementById(`yb-p${pId}-parsel`)?.value || '',
            yuzolcumu: document.getElementById(`yb-p${pId}-yuzolcumu`)?.value || '',
            malik: document.getElementById(`yb-p${pId}-malik`)?.value || '',
            yapilar: []
        };
        
        // Bu parsele ait fotoğraflar
        parselData.fotograflar = parselFotograflari[pId] || [];
        
        // Bu parselin yapılarını topla
        let yapiNo = 0;
        parselCard.querySelectorAll('.yb-parsel-yapi-card').forEach(yapiCard => {
            yapiNo++;
            const yId = yapiCard.id.replace('yb-pyapi-', '');
            
            const birimFiyatStr = document.getElementById(`yb-${yId}-birimFiyat`)?.value || '0';
            const birimFiyat = parseFloat(birimFiyatStr.replace(/\./g, '').replace(',', '.')) || 0;
            const yapiAlani = parseFloat(document.getElementById(`yb-${yId}-yapiAlani`)?.value) || 0;
            const yipranmaPay = parseFloat(document.getElementById(`yb-${yId}-yipranmaPay`)?.value) || 0;
            const eksikImalat = parseFloat(document.getElementById(`yb-${yId}-eksikImalat`)?.value) || 0;
            
            let yapiBedeli = birimFiyat * yapiAlani;
            yapiBedeli = yapiBedeli * (1 - yipranmaPay / 100);
            yapiBedeli = yapiBedeli * (1 - eksikImalat / 100);
            
            parselData.yapilar.push({
                yapiNo: yapiNo,
                yapiAdi: document.getElementById(`yb-${yId}-yapiAdi`)?.value || '',
                yapiSinifi: document.getElementById(`yb-${yId}-yapiSinifi`)?.value || '',
                yapiGrubu: document.getElementById(`yb-${yId}-yapiGrubu`)?.value || '',
                yapimTeknigi: document.getElementById(`yb-${yId}-yapimTeknigi`)?.value || '',
                yapiYasi: document.getElementById(`yb-${yId}-yapiYasi`)?.value || '',
                yapiAlani: yapiAlani,
                birimFiyat: birimFiyat,
                yipranmaPay: yipranmaPay,
                eksikImalatOrani: eksikImalat,
                yapiBedeli: yapiBedeli
            });
        });
        
        parseller.push(parselData);
    });
    
    return {
        cokluParsel: true,
        raporTarihi: document.getElementById('yb-raporTarihi')?.value,
        resmiYaziTarihi: document.getElementById('yb-resmiYaziTarihi')?.value,
        resmiYaziSayisi: [
            document.getElementById('yb-resmiYaziSayisi1')?.value || '',
            document.getElementById('yb-resmiYaziSayisi2')?.value || '',
            document.getElementById('yb-resmiYaziSayisi3')?.value || '',
            document.getElementById('yb-resmiYaziSayisi4')?.value || ''
        ].filter(v => v.trim() !== '').join('-'),
        ilgiliKurum: document.getElementById('yb-ilgiliKurum')?.value,
        hesapYili: selectedOption?.dataset.yil || '',
        raportorAdi: raportorAdlari.join(', '),
        raportorUnvani: raportorUnvanlari.join(', '),
        resmiGazeteTarih: selectedOption?.dataset.rgTarih || '',
        resmiGazeteSayili: selectedOption?.dataset.rgSayili || '',
        asgariLevazimHesapla: document.getElementById('yb-cokluAsgariLevazimHesapla')?.checked,
        parseller: parseller
    };
}

// Global erişim için fonksiyonları window'a ekle
window.ybPage = {
    yapiSil,
    yapiSinifiDegisti,
    birimFiyatGuncelle,
    yipranmaPayiGuncelle,
    fotografSil,
    parselFotograflarDegisti,
    fotografAciklamaGuncelle,
    getFotograflar: () => fotograflar,
    parselSil,
    parselYapiEkle,
    parselYapiSil,
    parselYapiSinifiDegisti,
    parselYapiBirimFiyatGuncelle,
    parselYapiYipranmaGuncelle
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
