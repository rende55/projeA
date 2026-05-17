/**
 * Proje Bedeli Modülü - Sayfa Script
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateReport } = require('./pb-reportGenerator');
const { shell } = require('electron');
const { getDbPath, getAppRootDir } = require('../../../shared/scripts/db-helper');

// Veritabanı bağlantısı
const dbPath = getDbPath();
let db = null;

let pbContainer = null;
let pbNavigation = null;

// Cache
let hesapDonemleriCache = [];
let birimMaliyetCache = 0;

/**
 * Sayfa yüklendiğinde çalışır
 */
async function onLoad(container, data, navigation) {
    console.log('📐 Proje Bedeli sayfası yükleniyor...');
    
    pbContainer = container;
    pbNavigation = navigation;
    
    // Veritabanı bağlantısı
    db = new sqlite3.Database(dbPath);
    
    // Hesap dönemlerini yükle
    await populateHesapDonemleri();
    
    // Tab sistemini başlat
    setupTabs();
    
    // Alt tab sistemini başlat (Branş)
    setupSubTabs();
    
    // Navigasyon butonlarını ayarla
    setupNavigationButtons();
    
    // Action butonlarını ayarla
    setupActionButtons();
    
    // Genel Bilgiler form event'lerini ayarla
    setupGenelBilgilerEvents();
    
    // Hizmet bölümlerini başlat
    initHizmetBolumleri();
    
    // Raportörleri yükle
    loadRaportorleri();
    
    console.log('✅ Proje Bedeli sayfası yüklendi');
}

/**
 * Sayfa kapatılırken çalışır
 */
async function onUnload() {
    console.log('📐 Proje Bedeli sayfası kapatılıyor...');
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Ana tab sistemini ayarla
 */
function setupTabs() {
    const tabButtons = pbContainer.querySelectorAll('.pb-tab-button');
    const tabContents = pbContainer.querySelectorAll('.pb-tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Tüm tabları deaktif et
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Seçili tabı aktif et
            button.classList.add('active');
            const targetContent = pbContainer.querySelector(`#pb-tab-${tabId}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Branş tabına geçildiğinde toplam maliyeti güncelle
            if (tabId === 'brans') {
                bransMaliyetGuncelle();
            }
            
            console.log(`📑 Tab değişti: ${tabId}`);
        });
    });
}

/**
 * Alt tab sistemini ayarla (Branş tabı için)
 */
function setupSubTabs() {
    const subTabButtons = pbContainer.querySelectorAll('.pb-sub-tab-button');
    const subTabContents = pbContainer.querySelectorAll('.pb-sub-tab-content');
    
    subTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const subTabId = button.getAttribute('data-subtab');
            
            // Tüm alt tabları deaktif et
            subTabButtons.forEach(btn => btn.classList.remove('active'));
            subTabContents.forEach(content => content.classList.remove('active'));
            
            // Seçili alt tabı aktif et
            button.classList.add('active');
            const targetContent = pbContainer.querySelector(`#pb-subtab-${subTabId}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            console.log(`📑 Alt tab değişti: ${subTabId}`);
        });
    });
}

/**
 * Navigasyon butonlarını ayarla (İleri/Geri)
 */
function setupNavigationButtons() {
    // İleri butonları
    const nextButtons = pbContainer.querySelectorAll('.pb-btn-next');
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nextTab = button.getAttribute('data-next');
            if (nextTab) {
                switchToTab(nextTab);
            }
        });
    });
    
    // Geri butonları
    const prevButtons = pbContainer.querySelectorAll('.pb-btn-prev');
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prevTab = button.getAttribute('data-prev');
            if (prevTab) {
                switchToTab(prevTab);
            }
        });
    });
}

/**
 * Belirli bir taba geç
 */
function switchToTab(tabId) {
    const tabButton = pbContainer.querySelector(`.pb-tab-button[data-tab="${tabId}"]`);
    if (tabButton) {
        tabButton.click();
    }
}

/**
 * Action butonlarını ayarla
 */
function setupActionButtons() {
    // Hesapla butonu
    const hesaplaBtn = pbContainer.querySelector('.pb-hesapla-button');
    if (hesaplaBtn) {
        hesaplaBtn.addEventListener('click', () => {
            console.log('🧮 Hesapla tıklandı');
            showNotification('Hesaplama özelliği henüz geliştirilme aşamasında.', 'info');
        });
    }
    
    // Kaydet butonu
    const saveBtn = pbContainer.querySelector('.pb-save-button');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            console.log('💾 Kaydet tıklandı');
            raporKaydet();
        });
    }
    
    // Temizle butonu
    const clearBtn = pbContainer.querySelector('.pb-clear-button');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            console.log('🗑️ Temizle tıklandı');
            showNotification('Form temizleme özelliği henüz geliştirilme aşamasında.', 'info');
        });
    }
    
    // Raporlar butonu
    const reportsBtn = pbContainer.querySelector('.pb-show-reports-button');
    if (reportsBtn) {
        reportsBtn.addEventListener('click', () => {
            console.log('📁 Raporlar tıklandı');
            if (pbNavigation) {
                pbNavigation.navigateTo('pb-raporlar');
            }
        });
    }
    
    // Header'daki Raporlar butonu
    const reportsNavBtn = pbContainer.querySelector('#pb-reportsNavButton');
    if (reportsNavBtn) {
        reportsNavBtn.addEventListener('click', () => {
            console.log('📊 Raporlar nav tıklandı');
            if (pbNavigation) {
                pbNavigation.navigateTo('pb-raporlar');
            }
        });
    }
    
    // Word Raporu Oluştur butonu
    const raporOlusturBtn = pbContainer.querySelector('.pb-rapor-olustur-button');
    if (raporOlusturBtn) {
        raporOlusturBtn.addEventListener('click', () => {
            console.log('📄 Word Raporu Oluştur tıklandı');
            raporOlustur();
        });
    }
}

/**
 * Bildirim göster
 */
function showNotification(message, type = 'info') {
    if (window.showNotification) {
        window.showNotification(message, type);
    } else {
        alert(message);
    }
}

/**
 * Hesap dönemlerini doldur (Yapı Bedeli modülüyle aynı veritabanını kullanır)
 */
function populateHesapDonemleri() {
    return new Promise((resolve, reject) => {
        const hesapYiliSelect = pbContainer.querySelector('#pb-hesapYili');
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
                
                hesapYiliSelect.appendChild(option);
            });
            
            console.log(`✅ ${rows.length} hesap dönemi yüklendi`);
            resolve();
        });
    });
}

/**
 * Genel Bilgiler form event'lerini ayarla
 */
function setupGenelBilgilerEvents() {
    // Yapı Sınıfı değiştiğinde grupları yükle
    const yapiSinifiSelect = pbContainer.querySelector('#pb-yapiSinifi');
    if (yapiSinifiSelect) {
        yapiSinifiSelect.addEventListener('change', yapiSinifiDegisti);
    }
    
    // Yapı Grubu değiştiğinde birim fiyatı güncelle
    const yapiGrubuSelect = pbContainer.querySelector('#pb-yapiGrubu');
    if (yapiGrubuSelect) {
        yapiGrubuSelect.addEventListener('change', birimMaliyetGuncelle);
    }
    
    // Hesap Yılı değiştiğinde sınıf/grup seçimlerini sıfırla
    const hesapYiliSelect = pbContainer.querySelector('#pb-hesapYili');
    if (hesapYiliSelect) {
        hesapYiliSelect.addEventListener('change', () => {
            // Sınıf seçiliyse grupları yeniden yükle
            if (yapiSinifiSelect && yapiSinifiSelect.value) {
                yapiSinifiDegisti();
            }
        });
    }
    
    // Genel Bilgiler'deki Hesapla butonu
    const genelHesaplaBtn = pbContainer.querySelector('.pb-genel-hesapla-button');
    if (genelHesaplaBtn) {
        genelHesaplaBtn.addEventListener('click', hesaplaYapiMaliyeti);
    }
}

/**
 * Yapı sınıfı değiştiğinde grupları yükle
 */
function yapiSinifiDegisti() {
    const sinifSelect = pbContainer.querySelector('#pb-yapiSinifi');
    const grupSelect = pbContainer.querySelector('#pb-yapiGrubu');
    const hesapYiliSelect = pbContainer.querySelector('#pb-hesapYili');
    
    if (!sinifSelect || !grupSelect || !hesapYiliSelect) return;
    
    const sinif = sinifSelect.value;
    const birimFiyatId = hesapYiliSelect.value;
    
    // Birim maliyet alanını temizle
    const birimMaliyetInput = pbContainer.querySelector('#pb-birimMaliyet');
    if (birimMaliyetInput) birimMaliyetInput.value = '';
    
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
            
            console.log(`✅ ${rows.length} grup yüklendi (Sınıf: ${sinif})`);
        });
}

/**
 * Birim maliyet güncelle
 */
function birimMaliyetGuncelle() {
    const sinifSelect = pbContainer.querySelector('#pb-yapiSinifi');
    const grupSelect = pbContainer.querySelector('#pb-yapiGrubu');
    const hesapYiliSelect = pbContainer.querySelector('#pb-hesapYili');
    const birimMaliyetInput = pbContainer.querySelector('#pb-birimMaliyet');
    
    if (!sinifSelect || !grupSelect || !hesapYiliSelect || !birimMaliyetInput) return;
    
    const sinif = sinifSelect.value;
    const grup = grupSelect.value;
    const birimFiyatId = hesapYiliSelect.value;
    
    if (!sinif || !grup || !birimFiyatId) {
        birimMaliyetInput.value = '';
        birimMaliyetCache = 0;
        return;
    }
    
    db.get(`SELECT birimFiyat FROM birimFiyatDetay WHERE birimFiyatId = ? AND yapiSinifi = ? AND yapiGrubu = ? AND aktif = 1`,
        [birimFiyatId, sinif, grup], (err, row) => {
            if (err || !row) {
                birimMaliyetInput.value = '';
                birimMaliyetCache = 0;
                return;
            }
            
            birimMaliyetCache = row.birimFiyat;
            birimMaliyetInput.value = row.birimFiyat.toLocaleString('tr-TR') + ' TL/m²';
            console.log(`✅ Birim maliyet: ${row.birimFiyat} TL/m²`);
        });
}

/**
 * Yapı maliyetini hesapla (Sıfır yapı - eskime ve eksik imalat yok)
 */
function hesaplaYapiMaliyeti() {
    const toplamInsaatAlaniInput = pbContainer.querySelector('#pb-toplamInsaatAlani');
    const birimMaliyetInput = pbContainer.querySelector('#pb-birimMaliyet');
    const toplamMaliyetInput = pbContainer.querySelector('#pb-toplamMaliyet');
    
    if (!toplamInsaatAlaniInput || !toplamMaliyetInput) {
        showNotification('Form alanları bulunamadı!', 'error');
        return;
    }
    
    const toplamInsaatAlani = parseFloat(toplamInsaatAlaniInput.value) || 0;
    
    if (toplamInsaatAlani <= 0) {
        showNotification('Lütfen geçerli bir inşaat alanı girin!', 'warning');
        return;
    }
    
    if (birimMaliyetCache <= 0) {
        showNotification('Lütfen önce Hesap Yılı, Yapı Sınıfı ve Grubu seçin!', 'warning');
        return;
    }
    
    // Toplam Maliyet = Birim Maliyet × Toplam İnşaat Alanı
    const toplamMaliyet = birimMaliyetCache * toplamInsaatAlani;
    
    toplamMaliyetInput.value = toplamMaliyet.toLocaleString('tr-TR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
    }) + ' TL';
    
    // Başarılı hesaplama animasyonu
    toplamMaliyetInput.style.backgroundColor = '#E8F5E9';
    toplamMaliyetInput.style.borderColor = '#4CAF50';
    setTimeout(() => {
        toplamMaliyetInput.style.backgroundColor = '#E8ECF2';
        toplamMaliyetInput.style.borderColor = '#C9D1DB';
    }, 2000);
    
    showNotification(`Yapı maliyeti hesaplandı: ${toplamMaliyet.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 'success');
    console.log(`🧮 Hesaplama: ${birimMaliyetCache} TL/m² × ${toplamInsaatAlani} m² = ${toplamMaliyet} TL`);
}

/**
 * Kaydedilmemiş değişiklik var mı?
 */
function hasUnsavedChanges() {
    return false;
}

/**
 * Sayfa state'ini kaydet
 */
async function saveState() {
    return {};
}

// ======================
// BRANŞ HESAPLAMA FONKSİYONLARI
// ======================

/**
 * Hizmet bölümü toggle (checkbox tıklama)
 */
function hizmetBolumToggle(element, brans) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
    
    // Selected class toggle
    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }
    
    // Toplam oranı güncelle
    hizmetBolumToplamGuncelle(brans);
}

/**
 * Hizmet bölümleri toplam oranını güncelle
 */
function hizmetBolumToplamGuncelle(brans) {
    let toplam = 0;
    const checkboxes = pbContainer.querySelectorAll(`#pb-subtab-${getBransSubtabId(brans)} input[type="checkbox"]:checked`);
    
    checkboxes.forEach(cb => {
        const oran = parseFloat(cb.dataset.oran) || 0;
        toplam += oran;
    });
    
    const toplamOranSpan = pbContainer.querySelector(`#pb-${brans}-toplamOran`);
    if (toplamOranSpan) {
        toplamOranSpan.textContent = `Seçili: %${toplam}`;
    }
    
    return toplam;
}

/**
 * Branş kodu -> subtab ID dönüşümü
 */
function getBransSubtabId(brans) {
    const mapping = {
        'mim': 'mimarlik',
        'ins': 'insaat',
        'mek': 'mekanik',
        'elk': 'elektrik'
    };
    return mapping[brans] || brans;
}

/**
 * PID oranını veritabanından getir ve güncelle
 */
function pidOraniGuncelle(brans) {
    const sinifSelect = pbContainer.querySelector(`#pb-${brans}-sinif`);
    const pidOraniDiv = pbContainer.querySelector(`#pb-${brans}-pidOrani`);
    const toplamInsaatAlaniInput = pbContainer.querySelector('#pb-toplamInsaatAlani');
    
    if (!sinifSelect || !pidOraniDiv) return;
    
    const sinif = parseInt(sinifSelect.value);
    const alan = parseFloat(toplamInsaatAlaniInput?.value) || 0;
    
    if (!sinif || alan <= 0) {
        pidOraniDiv.textContent = '%0,00';
        return;
    }
    
    // PID oranını veritabanından al (en yakın m² değerine göre)
    getPidOrani(alan, sinif).then(pidOrani => {
        if (pidOrani !== null) {
            pidOraniDiv.textContent = `%${pidOrani.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            pidOraniDiv.dataset.value = pidOrani;
        } else {
            pidOraniDiv.textContent = '%0,00';
            pidOraniDiv.dataset.value = '0';
        }
    });
}

/**
 * Veritabanından PID oranını getir
 */
function getPidOrani(alan, sinif) {
    return new Promise((resolve) => {
        // Önce pidOranlari tablosunu oluştur (yoksa)
        db.run(`CREATE TABLE IF NOT EXISTS pidOranlari (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            minAlan REAL NOT NULL,
            maxAlan REAL NOT NULL,
            hizmetSinifi INTEGER NOT NULL,
            pidOrani REAL NOT NULL,
            aktif INTEGER DEFAULT 1,
            olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
            guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE(minAlan, maxAlan, hizmetSinifi)
        )`, (err) => {
            if (err) {
                console.error('PID tablosu oluşturulamadı:', err);
                resolve(null);
                return;
            }
            
            // En yakın m² değerini bul (enterpolasyon için alt ve üst sınır)
            db.all(`SELECT * FROM pidOranlari WHERE hizmetSinifi = ? AND aktif = 1 ORDER BY minAlan`, 
                [sinif], (err, rows) => {
                    if (err || !rows || rows.length === 0) {
                        console.log('PID oranı bulunamadı');
                        resolve(null);
                        return;
                    }
                    
                    // Tam eşleşme ara
                    const exactMatch = rows.find(r => parseInt(r.minAlan) === parseInt(alan));
                    if (exactMatch) {
                        resolve(exactMatch.pidOrani);
                        return;
                    }
                    
                    // Enterpolasyon için alt ve üst sınırı bul
                    let altSinir = null;
                    let ustSinir = null;
                    
                    for (let i = 0; i < rows.length; i++) {
                        if (parseInt(rows[i].minAlan) <= alan) {
                            altSinir = rows[i];
                        }
                        if (parseInt(rows[i].minAlan) > alan && !ustSinir) {
                            ustSinir = rows[i];
                            break;
                        }
                    }
                    
                    // Enterpolasyon yap
                    if (altSinir && ustSinir) {
                        const x1 = parseInt(altSinir.minAlan);
                        const x2 = parseInt(ustSinir.minAlan);
                        const y1 = altSinir.pidOrani;
                        const y2 = ustSinir.pidOrani;
                        
                        // Lineer enterpolasyon: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
                        const pidOrani = y1 + (alan - x1) * (y2 - y1) / (x2 - x1);
                        resolve(pidOrani);
                    } else if (altSinir) {
                        // Sadece alt sınır var (alan en büyük değerden büyük)
                        resolve(altSinir.pidOrani);
                    } else if (ustSinir) {
                        // Sadece üst sınır var (alan en küçük değerden küçük)
                        resolve(ustSinir.pidOrani);
                    } else {
                        resolve(null);
                    }
                });
        });
    });
}

/**
 * Branş bedelini hesapla
 */
function bransHesapla(brans) {
    const toplamMaliyetInput = pbContainer.querySelector('#pb-toplamMaliyet');
    const katsayiInput = pbContainer.querySelector(`#pb-${brans}-katsayi`);
    const pidOraniDiv = pbContainer.querySelector(`#pb-${brans}-pidOrani`);
    const sinifSelect = pbContainer.querySelector(`#pb-${brans}-sinif`);
    
    // Toplam maliyet kontrolü
    if (!toplamMaliyetInput || !toplamMaliyetInput.value) {
        showNotification('Lütfen önce Genel Bilgiler sekmesinde Yapı Maliyetini hesaplayın!', 'warning');
        return;
    }
    
    // Sınıf seçimi kontrolü
    if (!sinifSelect || !sinifSelect.value) {
        showNotification('Lütfen Hizmet Sınıfı seçin!', 'warning');
        return;
    }
    
    // Değerleri al - Türkçe format: 6.000.000,00 TL
    // Önce TL ve boşlukları kaldır, sonra binlik ayracı noktaları kaldır, sonra virgülü noktaya çevir
    const toplamMaliyetStr = toplamMaliyetInput.value
        .replace(/[^\d.,]/g, '')  // Sadece rakam, nokta ve virgül kalsın
        .replace(/\./g, '')        // Binlik ayracı noktaları kaldır
        .replace(',', '.');        // Ondalık virgülü noktaya çevir
    const toplamMaliyet = parseFloat(toplamMaliyetStr) || 0;
    const katsayi = parseFloat(katsayiInput?.value) || 1;
    const pidOrani = parseFloat(pidOraniDiv?.dataset?.value) || 0;
    
    if (pidOrani <= 0) {
        showNotification('PID oranı bulunamadı! Lütfen Yönetici Panelinden PID oranlarını girin.', 'warning');
        return;
    }
    
    // Seçili hizmet bölümleri oranını al
    const hizmetOrani = hizmetBolumToplamGuncelle(brans);
    
    if (hizmetOrani <= 0) {
        showNotification('Lütfen en az bir Hizmet Bölümü seçin!', 'warning');
        return;
    }
    
    // Proje tipi çarpanını hesapla (Asıl: %100, Rölöve: %10)
    const asilProjeChecked = pbContainer.querySelector(`#pb-${brans}-asilProje`)?.checked || false;
    const roloveProjeChecked = pbContainer.querySelector(`#pb-${brans}-roloveProje`)?.checked || false;
    
    let projeTipiCarpani = 0;
    if (asilProjeChecked) projeTipiCarpani += 100;
    if (roloveProjeChecked) projeTipiCarpani += 10;
    
    if (projeTipiCarpani <= 0) {
        showNotification('Lütfen en az bir Proje Tipi seçin (Asıl Proje veya Rölöve)!', 'warning');
        return;
    }
    
    // Proje Bedeli = Toplam Maliyet × Hizmet Dalı Katsayısı × PID Oranı / 100
    const projeBedeli = toplamMaliyet * katsayi * (pidOrani / 100);
    
    // Seçili Hizmet Bedeli = Proje Bedeli × Seçili Hizmet Oranı / 100 × Proje Tipi Çarpanı / 100
    const hizmetBedeli = projeBedeli * (hizmetOrani / 100) * (projeTipiCarpani / 100);
    
    // Sonuçları göster
    const projeBedeliDiv = pbContainer.querySelector(`#pb-${brans}-projeBedeli`);
    const hizmetBedeliDiv = pbContainer.querySelector(`#pb-${brans}-hizmetBedeli`);
    const sonucCard = pbContainer.querySelector(`#pb-${brans}-sonuc`);
    
    if (projeBedeliDiv) {
        projeBedeliDiv.textContent = projeBedeli.toLocaleString('tr-TR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }) + ' TL';
    }
    
    if (hizmetBedeliDiv) {
        hizmetBedeliDiv.textContent = hizmetBedeli.toLocaleString('tr-TR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }) + ' TL';
    }
    
    // Sonuç kartını göster
    if (sonucCard) {
        sonucCard.classList.add('visible');
    }
    
    // Branş adını al
    const bransAdlari = {
        'mim': 'Mimarlık',
        'ins': 'İnşaat',
        'mek': 'Mekanik',
        'elk': 'Elektrik'
    };
    
    showNotification(`${bransAdlari[brans]} bedeli hesaplandı: ${hizmetBedeli.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 'success');
    
    console.log(`🧮 ${bransAdlari[brans]} Hesaplama:`);
    console.log(`   Toplam Maliyet: ${toplamMaliyet.toLocaleString('tr-TR')} TL`);
    console.log(`   Hizmet Dalı Katsayısı: ${katsayi}`);
    console.log(`   PID Oranı: %${pidOrani}`);
    console.log(`   Proje Bedeli: ${projeBedeli.toLocaleString('tr-TR')} TL`);
    console.log(`   Seçili Hizmet Oranı: %${hizmetOrani}`);
    console.log(`   Proje Tipi Çarpanı: %${projeTipiCarpani} (Asıl: ${asilProjeChecked}, Rölöve: ${roloveProjeChecked})`);
    console.log(`   Seçili Hizmet Bedeli: ${hizmetBedeli.toLocaleString('tr-TR')} TL`);
}

/**
 * Proje tipi checkbox toggle
 */
function projeTipiToggle(element, brans) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
    
    // CSS class toggle
    if (checkbox.checked) {
        element.classList.add('selected');
    } else {
        element.classList.remove('selected');
    }
}

/**
 * Branş tabına geçildiğinde toplam maliyeti güncelle
 */
function bransMaliyetGuncelle() {
    const toplamMaliyetInput = pbContainer.querySelector('#pb-toplamMaliyet');
    if (!toplamMaliyetInput || !toplamMaliyetInput.value) return;
    
    const branslar = ['mim', 'ins', 'mek', 'elk'];
    branslar.forEach(brans => {
        const maliyetDiv = pbContainer.querySelector(`#pb-${brans}-toplamMaliyet`);
        if (maliyetDiv) {
            maliyetDiv.textContent = toplamMaliyetInput.value;
        }
    });
}

/**
 * Sayfa yüklendiğinde hizmet bölümlerini başlat
 */
function initHizmetBolumleri() {
    const branslar = ['mim', 'ins', 'mek', 'elk'];
    branslar.forEach(brans => {
        hizmetBolumToplamGuncelle(brans);
    });
}

/**
 * Raporu kaydet
 */
function raporKaydet() {
    // Genel bilgileri al
    const isAdi = pbContainer.querySelector('#pb-isAdi')?.value?.trim();
    const toplamInsaatAlani = parseFloat(pbContainer.querySelector('#pb-toplamInsaatAlani')?.value) || 0;
    const hesapYiliSelect = pbContainer.querySelector('#pb-hesapYili');
    const hesapYili = hesapYiliSelect?.options[hesapYiliSelect.selectedIndex]?.text || '';
    const yapiSinifi = pbContainer.querySelector('#pb-yapiSinifi')?.value || '';
    const yapiGrubu = pbContainer.querySelector('#pb-yapiGrubu')?.value || '';
    const birimMaliyetStr = (pbContainer.querySelector('#pb-birimMaliyet')?.value || '0')
        .replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const birimMaliyet = parseFloat(birimMaliyetStr) || 0;
    const toplamMaliyetStr = (pbContainer.querySelector('#pb-toplamMaliyet')?.value || '0')
        .replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
    const toplamMaliyet = parseFloat(toplamMaliyetStr) || 0;
    
    // Validasyon
    if (!isAdi) {
        showNotification('Lütfen İşin Adını girin!', 'warning');
        return;
    }
    
    if (toplamMaliyet <= 0) {
        showNotification('Lütfen önce Genel Bilgiler sekmesinde Yapı Maliyetini hesaplayın!', 'warning');
        return;
    }
    
    // Branş verilerini al
    const branslar = ['mim', 'ins', 'mek', 'elk'];
    const bransVerileri = {};
    let genelToplamBedel = 0;
    
    branslar.forEach(brans => {
        const sinif = parseInt(pbContainer.querySelector(`#pb-${brans}-sinif`)?.value) || null;
        const pidOraniDiv = pbContainer.querySelector(`#pb-${brans}-pidOrani`);
        const pidOrani = parseFloat(pidOraniDiv?.dataset?.value) || 0;
        const projeBedeliStr = (pbContainer.querySelector(`#pb-${brans}-projeBedeli`)?.textContent || '0')
            .replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
        const projeBedeli = parseFloat(projeBedeliStr) || 0;
        const hizmetOrani = hizmetBolumToplamGuncelle(brans);
        const hizmetBedeliStr = (pbContainer.querySelector(`#pb-${brans}-hizmetBedeli`)?.textContent || '0')
            .replace(/[^\d.,]/g, '').replace(/\./g, '').replace(',', '.');
        const hizmetBedeli = parseFloat(hizmetBedeliStr) || 0;
        
        // Seçili hizmet bölümlerini al
        const hizmetBolumleri = [];
        const checkboxes = pbContainer.querySelectorAll(`#pb-subtab-${getBransSubtabId(brans)} input[type="checkbox"]:checked`);
        checkboxes.forEach(cb => {
            const label = cb.parentElement.querySelector('label')?.textContent || '';
            const oran = cb.dataset.oran || '0';
            hizmetBolumleri.push(`${label}:%${oran}`);
        });
        
        bransVerileri[brans] = {
            sinif,
            pidOrani,
            projeBedeli,
            hizmetOrani,
            hizmetBedeli,
            hizmetBolumleri: hizmetBolumleri.join(', ')
        };
        
        genelToplamBedel += hizmetBedeli;
    });
    
    // İmzacı bilgilerini topla
    const raportorSayisi = parseInt(pbContainer.querySelector('#pb-raportorSayisi')?.value) || 1;
    const raportorAdlari = [];
    const raportorUnvanlari = [];
    for (let i = 1; i <= raportorSayisi; i++) {
        const ad = pbContainer.querySelector(`#pb-raportorAdi${i}`)?.value?.trim() || '';
        const unvan = pbContainer.querySelector(`#pb-raportorUnvani${i}`)?.value?.trim() || '';
        if (ad) {
            raportorAdlari.push(ad);
            raportorUnvanlari.push(unvan);
        }
    }
    const raportorAdiStr = raportorAdlari.join(', ');
    const raportorUnvaniStr = raportorUnvanlari.join(', ');

    // Rapor numarası oluştur
    const now = new Date();
    const raporNo = `PB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

    // Veritabanına kaydet
    const sql = `INSERT INTO projeBedeliRaporlari (
        raporNo, isAdi, toplamInsaatAlani, hesapYili, yapiSinifi, yapiGrubu, birimMaliyet, toplamMaliyet,
        mimSinif, mimPidOrani, mimProjeBedeli, mimHizmetOrani, mimHizmetBedeli, mimHizmetBolumleri,
        insSinif, insPidOrani, insProjeBedeli, insHizmetOrani, insHizmetBedeli, insHizmetBolumleri,
        mekSinif, mekPidOrani, mekProjeBedeli, mekHizmetOrani, mekHizmetBedeli, mekHizmetBolumleri,
        elkSinif, elkPidOrani, elkProjeBedeli, elkHizmetOrani, elkHizmetBedeli, elkHizmetBolumleri,
        genelToplamBedel, raportorSayisi, raportorAdi, raportorUnvani
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        raporNo, isAdi, toplamInsaatAlani, hesapYili, yapiSinifi, yapiGrubu, birimMaliyet, toplamMaliyet,
        bransVerileri.mim.sinif, bransVerileri.mim.pidOrani, bransVerileri.mim.projeBedeli, bransVerileri.mim.hizmetOrani, bransVerileri.mim.hizmetBedeli, bransVerileri.mim.hizmetBolumleri,
        bransVerileri.ins.sinif, bransVerileri.ins.pidOrani, bransVerileri.ins.projeBedeli, bransVerileri.ins.hizmetOrani, bransVerileri.ins.hizmetBedeli, bransVerileri.ins.hizmetBolumleri,
        bransVerileri.mek.sinif, bransVerileri.mek.pidOrani, bransVerileri.mek.projeBedeli, bransVerileri.mek.hizmetOrani, bransVerileri.mek.hizmetBedeli, bransVerileri.mek.hizmetBolumleri,
        bransVerileri.elk.sinif, bransVerileri.elk.pidOrani, bransVerileri.elk.projeBedeli, bransVerileri.elk.hizmetOrani, bransVerileri.elk.hizmetBedeli, bransVerileri.elk.hizmetBolumleri,
        genelToplamBedel, raportorSayisi, raportorAdiStr, raportorUnvaniStr
    ];
    
    // Önce tabloyu oluştur (yoksa)
    db.run(`CREATE TABLE IF NOT EXISTS projeBedeliRaporlari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raporNo TEXT,
        isAdi TEXT NOT NULL,
        toplamInsaatAlani REAL,
        hesapYili TEXT,
        yapiSinifi TEXT,
        yapiGrubu TEXT,
        birimMaliyet REAL,
        toplamMaliyet REAL,
        mimSinif INTEGER,
        mimPidOrani REAL,
        mimProjeBedeli REAL,
        mimHizmetOrani REAL,
        mimHizmetBedeli REAL,
        mimHizmetBolumleri TEXT,
        insSinif INTEGER,
        insPidOrani REAL,
        insProjeBedeli REAL,
        insHizmetOrani REAL,
        insHizmetBedeli REAL,
        insHizmetBolumleri TEXT,
        mekSinif INTEGER,
        mekPidOrani REAL,
        mekProjeBedeli REAL,
        mekHizmetOrani REAL,
        mekHizmetBedeli REAL,
        mekHizmetBolumleri TEXT,
        elkSinif INTEGER,
        elkPidOrani REAL,
        elkProjeBedeli REAL,
        elkHizmetOrani REAL,
        elkHizmetBedeli REAL,
        elkHizmetBolumleri TEXT,
        genelToplamBedel REAL,
        raportorSayisi INTEGER DEFAULT 1,
        raportorAdi TEXT,
        raportorUnvani TEXT,
        aciklama TEXT,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
    )`, (err) => {
        if (err) {
            console.error('Tablo oluşturma hatası:', err);
            showNotification('Veritabanı hatası: ' + err.message, 'error');
            return;
        }
        
        db.run(sql, params, function(err) {
            if (err) {
                console.error('Rapor kaydetme hatası:', err);
                showNotification('Rapor kaydedilemedi: ' + err.message, 'error');
                return;
            }
            
            showNotification(`Rapor başarıyla kaydedildi! (${raporNo})`, 'success');
            console.log(`✅ Rapor kaydedildi: ${raporNo}, ID: ${this.lastID}`);
        });
    });
}

/**
 * Tüm branşları hesapla ve hesaplama tablosunu güncelle
 */
function tumBranslariHesapla() {
    const toplamMaliyetInput = pbContainer.querySelector('#pb-toplamMaliyet');
    
    // Toplam maliyet kontrolü
    if (!toplamMaliyetInput || !toplamMaliyetInput.value) {
        showNotification('Lütfen önce Genel Bilgiler sekmesinde Yapı Maliyetini hesaplayın!', 'warning');
        return;
    }
    
    // Toplam maliyeti hesaplama sekmesine aktar
    const hesaplamaMaliyetDiv = pbContainer.querySelector('#pb-hesaplama-toplamMaliyet');
    if (hesaplamaMaliyetDiv) {
        hesaplamaMaliyetDiv.textContent = toplamMaliyetInput.value;
    }
    
    // Toplam maliyeti parse et
    const toplamMaliyetStr = toplamMaliyetInput.value
        .replace(/[^\d.,]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
    const toplamMaliyet = parseFloat(toplamMaliyetStr) || 0;
    
    // Branş bilgileri
    const branslar = [
        { kod: 'mim', katsayi: 1.00 },
        { kod: 'ins', katsayi: 0.75 },
        { kod: 'mek', katsayi: 0.50 },
        { kod: 'elk', katsayi: 0.385 }
    ];
    
    let genelToplamBedel = 0;
    
    branslar.forEach(brans => {
        const kod = brans.kod;
        
        // Branş kartından değerleri al
        const sinifSelect = pbContainer.querySelector(`#pb-${kod}-sinif`);
        const pidOraniDiv = pbContainer.querySelector(`#pb-${kod}-pidOrani`);
        
        const sinif = sinifSelect?.value || '-';
        const pidOrani = parseFloat(pidOraniDiv?.dataset?.value) || 0;
        const hizmetOrani = hizmetBolumToplamGuncelle(kod);
        
        // Hesaplama
        let hizmetBedeli = 0;
        if (sinif !== '-' && sinif !== '' && pidOrani > 0 && hizmetOrani > 0) {
            const projeBedeli = toplamMaliyet * brans.katsayi * (pidOrani / 100);
            hizmetBedeli = projeBedeli * (hizmetOrani / 100);
        }
        
        genelToplamBedel += hizmetBedeli;
        
        // Hesaplama tablosunu güncelle
        const sinifTd = pbContainer.querySelector(`#pb-hesap-${kod}-sinif`);
        const pidTd = pbContainer.querySelector(`#pb-hesap-${kod}-pid`);
        const hizmetOranTd = pbContainer.querySelector(`#pb-hesap-${kod}-hizmetOran`);
        const bedelTd = pbContainer.querySelector(`#pb-hesap-${kod}-bedel`);
        
        if (sinifTd) sinifTd.textContent = sinif !== '' && sinif !== '-' ? `${sinif}. Sınıf` : '-';
        if (pidTd) pidTd.textContent = `%${pidOrani.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (hizmetOranTd) hizmetOranTd.textContent = `%${hizmetOrani}`;
        if (bedelTd) bedelTd.textContent = hizmetBedeli.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    });
    
    // Toplam bedeli güncelle
    const toplamBedelTd = pbContainer.querySelector('#pb-hesap-toplamBedel');
    if (toplamBedelTd) {
        toplamBedelTd.textContent = genelToplamBedel.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
    }
    
    showNotification(`Hesaplama tamamlandı! Toplam Hizmet Bedeli: ${genelToplamBedel.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 'success');
    
    console.log('🧮 Tüm Branşlar Hesaplandı:');
    console.log(`   Toplam Maliyet: ${toplamMaliyet.toLocaleString('tr-TR')} TL`);
    console.log(`   Toplam Hizmet Bedeli: ${genelToplamBedel.toLocaleString('tr-TR')} TL`);
}

/**
 * Word Raporu Oluştur
 */
function raporOlustur() {
    console.log('📄 Rapor oluşturuluyor...');
    
    // Form verilerini topla
    const isAdi = pbContainer.querySelector('#pb-isAdi')?.value || '';
    const yapiSinifi = pbContainer.querySelector('#pb-yapiSinifi')?.value || '';
    const yapiGrubu = pbContainer.querySelector('#pb-yapiGrubu')?.value || '';
    
    // Birim maliyet - input alanından value ile al
    const birimMaliyetInput = pbContainer.querySelector('#pb-birimMaliyet');
    const birimMaliyetStr = birimMaliyetInput?.value || '0';
    const birimMaliyet = parseFloat(birimMaliyetStr.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    
    const toplamInsaatAlani = pbContainer.querySelector('#pb-toplamInsaatAlani')?.value || '0';
    
    // Toplam maliyet - input alanından value ile al
    const toplamMaliyetInput = pbContainer.querySelector('#pb-toplamMaliyet');
    const toplamMaliyetStr = toplamMaliyetInput?.value || '0';
    const toplamMaliyet = parseFloat(toplamMaliyetStr.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
    
    console.log('💰 Birim Maliyet:', birimMaliyet, '| Toplam Maliyet:', toplamMaliyet);
    
    // Validasyon
    console.log('🔍 Validasyon - İş Adı:', isAdi, '| Toplam Maliyet:', toplamMaliyet);
    
    if (!isAdi) {
        showNotification('Lütfen işin adını girin!', 'error');
        return;
    }
    
    // Geçici olarak maliyet kontrolünü devre dışı bırak (test için)
    // if (toplamMaliyet <= 0) {
    //     showNotification('Lütfen önce yapı maliyetini hesaplayın!', 'error');
    //     return;
    // }
    
    // Branş verilerini topla
    const branslar = [];
    const bransBilgileri = [
        { kod: 'mim', adi: 'Mimarlık', katsayi: 100 },
        { kod: 'ins', adi: 'İnşaat', katsayi: 75 },
        { kod: 'mek', adi: 'Mekanik', katsayi: 50 },
        { kod: 'elk', adi: 'Elektrik', katsayi: 38.50 }
    ];
    
    bransBilgileri.forEach(brans => {
        const kod = brans.kod;
        
        // Hizmet sınıfını al
        const sinifTd = pbContainer.querySelector(`#pb-hesap-${kod}-sinif`);
        const sinif = sinifTd?.textContent || '-';
        
        // PID oranını al
        const pidTd = pbContainer.querySelector(`#pb-hesap-${kod}-pid`);
        const pidStr = pidTd?.textContent || '%0';
        const pidOrani = parseFloat(pidStr.replace('%', '').replace(',', '.')) || 0;
        
        // Hizmet bölümü oranını al
        const hizmetOranTd = pbContainer.querySelector(`#pb-hesap-${kod}-hizmetOran`);
        const hizmetOranStr = hizmetOranTd?.textContent || '%0';
        const hizmetBolumuOrani = parseFloat(hizmetOranStr.replace('%', '').replace(',', '.')) || 0;
        
        // Seçili hizmet bedelini al
        const bedelTd = pbContainer.querySelector(`#pb-hesap-${kod}-bedel`);
        const bedelStr = bedelTd?.textContent || '0';
        const seciliHizmetBedeli = parseFloat(bedelStr.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
        
        console.log(`📊 Branş ${brans.adi}: Sınıf=${sinif}, PID=${pidOrani}, HizmetOran=${hizmetBolumuOrani}, Bedel=${seciliHizmetBedeli}`);
        
        branslar.push({
            bransAdi: brans.adi,
            hizmetDaliKatsayisi: brans.katsayi,
            hizmetSinifi: sinif,
            pidOrani: pidOrani,
            hizmetBolumuOrani: hizmetBolumuOrani,
            seciliHizmetBedeli: seciliHizmetBedeli
        });
    });
    
    // Raportör bilgilerini topla
    const raportorSayisi = parseInt(pbContainer.querySelector('#pb-raportorSayisi')?.value) || 1;
    const raportorAdlari = [];
    const raportorUnvanlari = [];
    
    for (let i = 1; i <= raportorSayisi; i++) {
        const ad = pbContainer.querySelector(`#pb-raportorAdi${i}`)?.value || '';
        const unvan = pbContainer.querySelector(`#pb-raportorUnvani${i}`)?.value || '';
        if (ad) {
            raportorAdlari.push(ad);
            raportorUnvanlari.push(unvan);
        }
    }
    
    // Rapor verilerini hazırla
    const raporData = {
        isAdi,
        yapiSinifi,
        yapiGrubu,
        birimMaliyet: parseFloat(birimMaliyet) || 0,
        toplamInsaatAlani,
        toplamMaliyet,
        branslar,
        raportorAdlari,
        raportorUnvanlari
    };
    
    // Dosya yolunu oluştur
    const tarih = new Date().toISOString().slice(0, 10);
    const saat = new Date().toTimeString().slice(0, 5).replace(':', '-');
    const safeIsAdi = (isAdi || 'Rapor').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '_').substring(0, 50);
    const dosyaAdi = `ProjeBedeli_${safeIsAdi}_${tarih}_${saat}.docx`;
    
    // Raporlar klasörünü oluştur (proje kök dizininde)
    const fs = require('fs');
    const raporlarDir = path.join(getAppRootDir(), 'raporlar');
    console.log('📁 Raporlar dizini:', raporlarDir);
    
    try {
        if (!fs.existsSync(raporlarDir)) {
            fs.mkdirSync(raporlarDir, { recursive: true });
            console.log('✅ Raporlar dizini oluşturuldu');
        }
    } catch (mkdirErr) {
        console.error('❌ Dizin oluşturma hatası:', mkdirErr);
        showNotification(`Dizin oluşturma hatası: ${mkdirErr.message}`, 'error');
        return;
    }
    
    const outputPath = path.join(raporlarDir, dosyaAdi);
    console.log('📄 Çıktı dosyası:', outputPath);
    
    // Raporu oluştur
    console.log('🔄 Rapor oluşturuluyor...');
    console.log('📊 Rapor verileri:', JSON.stringify(raporData, null, 2));
    
    generateReport(raporData, outputPath).then(result => {
        console.log('📋 Rapor sonucu:', result);
        if (result.success) {
            showNotification('Rapor başarıyla oluşturuldu!', 'success');
            console.log('✅ Dosya açılıyor:', result.path);
            // Dosyayı aç
            shell.openPath(result.path).then(error => {
                if (error) {
                    console.error('❌ Dosya açma hatası:', error);
                }
            });
        } else {
            console.error('❌ Rapor hatası:', result.error);
            showNotification(`Rapor oluşturma hatası: ${result.error}`, 'error');
        }
    }).catch(err => {
        console.error('❌ Rapor exception:', err);
        showNotification(`Rapor oluşturma hatası: ${err.message}`, 'error');
    });
}

/**
 * Raportörleri veritabanından yükle
 */
function loadRaportorleri() {
    // 4 imzacı için dropdown'ları doldur
    for (let i = 1; i <= 4; i++) {
        loadRaportorSelect(i);
    }
}

/**
 * Tek bir raportör select'ini doldur
 */
function loadRaportorSelect(index) {
    const select = pbContainer.querySelector(`#pb-raportorAdi${index}`);
    if (!select) return;
    
    db.all(`SELECT * FROM raportorleri WHERE aktif = 1 ORDER BY adi, soyadi`, [], (err, rows) => {
        if (err) {
            console.error('Raportörler yüklenemedi:', err);
            return;
        }
        
        // Mevcut seçenekleri temizle (ilk "Seçiniz" hariç)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        rows.forEach(row => {
            const option = document.createElement('option');
            option.value = `${row.adi} ${row.soyadi}`;
            option.textContent = `${row.adi} ${row.soyadi}`;
            option.dataset.unvan = row.unvani || '';
            select.appendChild(option);
        });
        
        // Seçim değiştiğinde unvanı güncelle ve branşlardaki label'ları güncelle
        select.addEventListener('change', () => {
            const selectedOption = select.options[select.selectedIndex];
            const unvanInput = pbContainer.querySelector(`#pb-raportorUnvani${index}`);
            if (unvanInput && selectedOption) {
                unvanInput.value = selectedOption.dataset.unvan || '';
            }
            // Branşlardaki label'ları güncelle
            imzaciSecimGuncelle(index);
        });
    });
}

/**
 * İmzacı sayısı değiştiğinde çağrılır
 */
function imzaciSayisiDegisti() {
    const sayiSelect = pbContainer.querySelector('#pb-raportorSayisi');
    const sayi = parseInt(sayiSelect?.value) || 1;
    
    // Genel bilgilerdeki imzacı satırlarını göster/gizle
    for (let i = 1; i <= 4; i++) {
        const row = pbContainer.querySelector(`#pb-imzaci-${i}`);
        if (row) {
            row.style.display = i <= sayi ? 'block' : 'none';
        }
    }
    
    // Branşlardaki imzacı checkbox'larını güncelle
    const bransKodlari = ['mim', 'ins', 'mek', 'elk'];
    bransKodlari.forEach(kod => {
        for (let i = 1; i <= 4; i++) {
            const checkboxLabel = pbContainer.querySelector(`#pb-${kod}-imzacilar label:nth-child(${i})`);
            
            if (checkboxLabel) {
                checkboxLabel.style.display = i <= sayi ? 'flex' : 'none';
            }
            
            // Label'ı güncelle
            imzaciSecimGuncelle(i);
        }
    });
}

/**
 * İmzacı seçimi değiştiğinde branşlardaki label'ları güncelle
 */
function imzaciSecimGuncelle(index) {
    const adSelect = pbContainer.querySelector(`#pb-raportorAdi${index}`);
    const ad = adSelect?.value || `İmzacı ${index}`;
    
    const bransKodlari = ['mim', 'ins', 'mek', 'elk'];
    bransKodlari.forEach(kod => {
        const labelSpan = pbContainer.querySelector(`#pb-${kod}-imzaci${index}-label`);
        if (labelSpan) {
            labelSpan.textContent = ad || `İmzacı ${index}`;
        }
    });
}

// Global erişim için window.pbPage'e fonksiyonları ekle
window.pbPage = {
    hizmetBolumToggle,
    pidOraniGuncelle,
    bransHesapla,
    bransMaliyetGuncelle,
    raporKaydet,
    tumBranslariHesapla,
    raporOlustur,
    imzaciSayisiDegisti,
    imzaciSecimGuncelle,
    projeTipiToggle
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges,
    saveState
};
