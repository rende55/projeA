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

// Navigation referansı
let nav = null;

// İlçeler artık veritabanından (varsayılan il -> aktif ilçeler) yüklenir.

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
                <input type="number" id="yb-yapiYasi-${yapiSayaci}" min="0" required onchange="window.ybPage.yipranmaPayiGuncelle(${yapiSayaci})">
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
    let toplamBedel = 0;
    const yapilar = document.querySelectorAll('[id^="yb-yapi-"]');
    
    yapilar.forEach(yapiCard => {
        const index = yapiCard.id.replace('yb-yapi-', '');
        
        const birimFiyatStr = document.getElementById(`yb-birimFiyat-${index}`)?.value || '0';
        const birimFiyat = parseFloat(birimFiyatStr.replace(/\./g, '').replace(',', '.')) || 0;
        const yapiAlani = parseFloat(document.getElementById(`yb-yapiAlani-${index}`)?.value) || 0;
        const yipranmaPay = parseFloat(document.getElementById(`yb-yipranmaPay-${index}`)?.value) || 0;
        const eksikImalat = parseFloat(document.getElementById(`yb-eksikImalat-${index}`)?.value) || 0;
        
        // Yapı bedeli hesapla
        let yapiBedeli = birimFiyat * yapiAlani;
        yapiBedeli = yapiBedeli * (1 - yipranmaPay / 100);
        yapiBedeli = yapiBedeli * (1 - eksikImalat / 100);
        
        toplamBedel += yapiBedeli;
    });
    
    // Sonuçları göster
    const yapiBedeliInput = document.getElementById('yb-yapiBedeliHesaplanan');
    const levazimBedeliInput = document.getElementById('yb-levazimBedeliHesaplanan');
    
    if (yapiBedeliInput) {
        yapiBedeliInput.value = toplamBedel.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    }
    
    // Asgari levazım bedeli
    const asgariLevazimChecked = document.getElementById('yb-asgariLevazimHesapla')?.checked;
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
    
    // Form verilerini topla
    const formData = collectFormData();
    
    if (!formData) {
        if (window.showNotification) {
            window.showNotification('Lütfen zorunlu alanları doldurun!', 'error');
        }
        return;
    }
    
    // Toplam yapı bedelini hesapla
    let toplamYapiBedeli = 0;
    formData.yapilar.forEach(yapi => {
        toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
    });
    
    // Fotoğrafları JSON'a çevir (base64 data dahil)
    const fotograflarJSON = JSON.stringify(fotograflar);
    
    console.log(' Kayıt - Toplam Yapı Bedeli:', toplamYapiBedeli);
    console.log(' Kayıt - Fotoğraf sayısı:', fotograflar.length);
    
    // Veritabanına kaydet
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
    const container = document.getElementById('yb-fotografOnizleme');
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
    
    // Hesaplamadan sonra form verilerini topla
    const formData = collectFormData();
    
    if (!formData) {
        if (window.showNotification) {
            window.showNotification('Lütfen zorunlu alanları doldurun!', 'error');
        }
        return;
    }
    
    // Yapı bedelini hesapla
    let toplamYapiBedeli = 0;
    formData.yapilar.forEach(yapi => {
        toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
    });
    
    console.log('📊 Word Export - Toplam Yapı Bedeli:', toplamYapiBedeli);
    console.log('📷 Fotoğraf sayısı:', fotograflar.length);
    
    // Rapor verisi oluştur
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
    
    // IPC ile Word export isteği gönder (fotoğraflarla birlikte)
    ipcRenderer.send('export-word-with-photos', {
        raporData: raporData,
        fotograflar: fotograflar
    });
    
    if (window.showNotification) {
        window.showNotification('Word raporu oluşturuluyor...', 'info');
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

// Global erişim için fonksiyonları window'a ekle
window.ybPage = {
    yapiSil,
    yapiSinifiDegisti,
    birimFiyatGuncelle,
    yipranmaPayiGuncelle,
    fotografSil,
    fotografAciklamaGuncelle,
    getFotograflar: () => fotograflar
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
