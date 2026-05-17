/**
 * Admin Sayfa Modülü
 * Tek pencere navigasyon sistemi için
 * Birim Fiyat, Raportör ve Kurum yönetimi
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const remote = require('@electron/remote');
const { getDbPath } = require('../../../shared/scripts/db-helper');

// Veritabanı bağlantısı
const dbPath = getDbPath();
let db = null;

// Navigation referansı
let nav = null;

// Global değişkenler
let seciliDonemId = null;
let seciliIlId = null;
let sehirlerJsonCache = null;
let ilcelerJsonCache = null;
const GRUP_HARFLERI = ['A', 'B', 'C', 'D', 'E'];

/**
 * JSON dosyalarını yükle (sehirler.json + ilceler.json)
 */
function loadCityJsonFiles() {
    if (sehirlerJsonCache && ilcelerJsonCache) return true;
    try {
        const appPath = remote.app.getAppPath();
        const sehirlerPath = path.join(appPath, 'sehirler.json');
        const ilcelerPath = path.join(appPath, 'ilceler.json');
        if (fs.existsSync(sehirlerPath) && fs.existsSync(ilcelerPath)) {
            sehirlerJsonCache = JSON.parse(fs.readFileSync(sehirlerPath, 'utf8'));
            ilcelerJsonCache = JSON.parse(fs.readFileSync(ilcelerPath, 'utf8'));
            return true;
        }
        console.warn('sehirler.json veya ilceler.json bulunamadı');
        return false;
    } catch (err) {
        console.error('JSON yükleme hatası:', err);
        return false;
    }
}

/**
 * Sayfa yüklendiğinde çağrılır
 */
async function onLoad(container, data, navigation) {
    console.log('⚙️ Admin sayfası yükleniyor...');
    nav = navigation;
    
    // Veritabanı bağlantısı
    db = new sqlite3.Database(dbPath);
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Verileri yükle
    await loadData();
    
    console.log('✅ Admin sayfası yüklendi');
}

/**
 * Sayfa kapatılırken çağrılır
 */
async function onUnload() {
    console.log('🔄 Admin sayfası kapatılıyor...');
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
    // Tab navigasyonu
    document.querySelectorAll('.ad-tab-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            showTab(tabName);
        });
    });
}

/**
 * Tab göster
 */
function showTab(tabName) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.ad-tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Tüm tab butonlarını pasif yap
    document.querySelectorAll('.ad-tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçili tab'ı göster
    const tabContent = document.getElementById(`ad-tab-${tabName}`);
    if (tabContent) tabContent.classList.add('active');
    
    // Seçili butonu aktif yap
    const tabButton = document.querySelector(`.ad-tab-button[data-tab="${tabName}"]`);
    if (tabButton) tabButton.classList.add('active');
    
    // PID Oranları tabına geçildiğinde verileri otomatik yükle
    if (tabName === 'pid-oranlari') {
        pidOranlariYukle();
    }
}

/**
 * Verileri yükle
 */
async function loadData() {
    // Dönemleri yükle
    await loadDonemler();

    // Raportörleri yükle
    await loadRaportorler();

    // Kurumları yükle
    await loadKurumlar();

    // İlleri yükle + JSON dropdown'ını doldur
    loadCityJsonFiles();
    jsonIlSelectDoldur();
    await loadIller();
}

/**
 * Dönemleri yükle
 */
function loadDonemler() {
    return new Promise((resolve) => {
        const tbody = document.getElementById('ad-donemlerBody');
        if (!tbody) {
            resolve();
            return;
        }
        
        db.all(`SELECT * FROM birimFiyatlar ORDER BY yil DESC, donem DESC`, [], (err, rows) => {
            if (err) {
                console.error('Dönemler yüklenemedi:', err);
                resolve();
                return;
            }
            
            tbody.innerHTML = '';
            rows.forEach(row => {
                const tr = document.createElement('tr');
                const durumBtn = row.aktif 
                    ? `<button class="ad-btn" style="background:#ff9800;color:white;" onclick="window.adPage.donemDurumDegistir(${row.id}, false)">Pasif Yap</button>`
                    : `<button class="ad-btn ad-btn-success" onclick="window.adPage.donemDurumDegistir(${row.id}, true)">Aktif Yap</button>`;
                
                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td>${row.yil}/${row.donem}</td>
                    <td>${row.resmiGazeteTarih || '-'}</td>
                    <td>${row.resmiGazeteSayili || '-'}</td>
                    <td>${row.tebligAdi || '-'}</td>
                    <td><span class="ad-status-badge ${row.aktif ? 'active' : 'inactive'}">${row.aktif ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        <button class="ad-btn" style="background:#2A4C6E;color:white;" onclick="window.adPage.gruplariDuzenle(${row.id}, '${row.yil}/${row.donem}')">Grupları Düzenle</button>
                        ${durumBtn}
                        <button class="ad-btn ad-btn-danger" onclick="window.adPage.donemSil(${row.id})">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            resolve();
        });
    });
}

/**
 * Raportörleri yükle
 */
function loadRaportorler() {
    return new Promise((resolve) => {
        const tbody = document.getElementById('ad-raportorlerBody');
        if (!tbody) {
            resolve();
            return;
        }
        
        db.all(`SELECT * FROM raportorleri ORDER BY adi, soyadi`, [], (err, rows) => {
            if (err) {
                console.error('Raportörler yüklenemedi:', err);
                resolve();
                return;
            }
            
            tbody.innerHTML = '';
            rows.forEach(row => {
                const tr = document.createElement('tr');
                const durumBtn = row.aktif 
                    ? `<button class="ad-btn" style="background:#ff9800;color:white;" onclick="window.adPage.raportorPasifYap(${row.id})">Pasif Yap</button>`
                    : `<button class="ad-btn ad-btn-success" onclick="window.adPage.raportorAktifYap(${row.id})">Aktif Yap</button>`;
                
                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td>${row.adi} ${row.soyadi}</td>
                    <td>${row.unvani || '-'}</td>
                    <td><span class="ad-status-badge ${row.aktif ? 'active' : 'inactive'}">${row.aktif ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        ${durumBtn}
                        <button class="ad-btn ad-btn-danger" onclick="window.adPage.raportorSil(${row.id})">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            resolve();
        });
    });
}

/**
 * Kurumları yükle
 */
function loadKurumlar() {
    return new Promise((resolve) => {
        const tbody = document.getElementById('ad-kurumlarBody');
        if (!tbody) {
            resolve();
            return;
        }
        
        db.all(`SELECT * FROM kurumlar ORDER BY kurumAdi`, [], (err, rows) => {
            if (err) {
                console.error('Kurumlar yüklenemedi:', err);
                resolve();
                return;
            }
            
            tbody.innerHTML = '';
            rows.forEach(row => {
                const tr = document.createElement('tr');
                const durumBtn = row.aktif 
                    ? `<button class="ad-btn" style="background:#ff9800;color:white;" onclick="window.adPage.kurumPasifYap(${row.id})">Pasif Yap</button>`
                    : `<button class="ad-btn ad-btn-success" onclick="window.adPage.kurumAktifYap(${row.id})">Aktif Yap</button>`;
                
                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td>${row.kurumAdi}</td>
                    <td>${row.altKurum || '-'}</td>
                    <td><span class="ad-status-badge ${row.aktif ? 'active' : 'inactive'}">${row.aktif ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        ${durumBtn}
                        <button class="ad-btn ad-btn-danger" onclick="window.adPage.kurumSil(${row.id})">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            
            resolve();
        });
    });
}

// ======================
// BİRİM FİYAT YÖNETİMİ
// ======================

/**
 * Yeni dönem ekle
 */
function yeniDonemEkle() {
    const yil = document.getElementById('ad-yil').value;
    const donem = document.getElementById('ad-donem').value;
    const resmiGazeteTarih = document.getElementById('ad-resmiGazeteTarih').value;
    const resmiGazeteSayili = document.getElementById('ad-resmiGazeteSayili').value;
    const tebligAdi = document.getElementById('ad-tebligAdi').value;

    if (!yil || !donem) {
        if (window.showNotification) {
            window.showNotification('Yıl ve Dönem alanları zorunludur!', 'error');
        }
        return;
    }

    // Aynı yıl/dönem var mı kontrol et
    db.get(`SELECT id FROM birimFiyatlar WHERE yil = ? AND donem = ?`, [yil, donem], (err, row) => {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Veritabanı hatası: ' + err.message, 'error');
            }
            return;
        }

        if (row) {
            if (window.showNotification) {
                window.showNotification('Bu yıl ve dönem zaten mevcut!', 'error');
            }
            return;
        }

        // Ekle
        db.run(`INSERT INTO birimFiyatlar (yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi) 
                VALUES (?, ?, ?, ?, ?)`,
            [yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi],
            function(err) {
                if (err) {
                    if (window.showNotification) {
                        window.showNotification('Ekleme hatası: ' + err.message, 'error');
                    }
                    return;
                }
                
                if (window.showNotification) {
                    window.showNotification(`${yil}/${donem} dönemi başarıyla eklendi!`, 'success');
                }
                
                // Formu temizle
                document.getElementById('ad-yil').value = '';
                document.getElementById('ad-donem').value = '1';
                document.getElementById('ad-resmiGazeteTarih').value = '';
                document.getElementById('ad-resmiGazeteSayili').value = '';
                document.getElementById('ad-tebligAdi').value = '';
                
                loadDonemler();
            }
        );
    });
}

/**
 * Dönem aktif/pasif yap
 */
function donemDurumDegistir(id, aktif) {
    db.run(`UPDATE birimFiyatlar SET aktif = ? WHERE id = ?`, [aktif ? 1 : 0, id], (err) => {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Hata: ' + err.message, 'error');
            }
            return;
        }
        if (window.showNotification) {
            window.showNotification(aktif ? 'Dönem aktif yapıldı' : 'Dönem pasif yapıldı', 'success');
        }
        loadDonemler();
    });
}

/**
 * Grupları düzenle
 */
function gruplariDuzenle(donemId, donemAdi) {
    seciliDonemId = donemId;
    document.getElementById('ad-seciliDonemBaslik').textContent = donemAdi;
    document.getElementById('ad-grupDuzenlemeBolumu').style.display = 'block';
    
    // 5 sınıf için kart oluştur
    const container = document.getElementById('ad-sinifGrupContainer');
    container.innerHTML = '';

    for (let sinif = 1; sinif <= 5; sinif++) {
        const card = document.createElement('div');
        card.style.cssText = 'background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd;';
        card.innerHTML = `
            <h3 style="margin-top: 0; color: #2A4C6E; border-bottom: 2px solid #2A4C6E; padding-bottom: 8px;">${sinif}. Sınıf Yapılar</h3>
            <div id="ad-sinif${sinif}Gruplar">
                <!-- Grup inputları buraya eklenecek -->
            </div>
            <button type="button" class="ad-btn" style="margin-top: 10px; background: #17a2b8; color: white;" 
                    onclick="window.adPage.grupEkle(${sinif})">
                ➕ Grup Ekle
            </button>
        `;
        container.appendChild(card);

        // Mevcut grupları yükle
        mevcutGruplariYukle(sinif);
    }

    // Sayfayı aşağı kaydır
    document.getElementById('ad-grupDuzenlemeBolumu').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Mevcut grupları yükle
 */
function mevcutGruplariYukle(sinif) {
    db.all(`SELECT yapiGrubu, birimFiyat, id FROM birimFiyatDetay 
            WHERE birimFiyatId = ? AND yapiSinifi = ? AND aktif = 1 
            ORDER BY yapiGrubu`,
        [seciliDonemId, sinif],
        (err, rows) => {
            if (err) {
                console.error('Grup yükleme hatası:', err);
                return;
            }

            const container = document.getElementById(`ad-sinif${sinif}Gruplar`);
            
            if (!rows || rows.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Henüz grup eklenmemiş.</p>';
                return;
            }

            container.innerHTML = '';
            rows.forEach(row => {
                grupInputEkle(sinif, row.yapiGrubu, row.birimFiyat, row.id);
            });
        }
    );
}

/**
 * Grup ekle (UI)
 */
function grupEkle(sinif) {
    // Daha önce hangi gruplar eklenmiş kontrol et
    const mevcutGruplar = [];
    document.querySelectorAll(`#ad-sinif${sinif}Gruplar .ad-grup-select`).forEach(select => {
        if (select.value) mevcutGruplar.push(select.value);
    });

    // İlk boş grubu bul
    const bosGrup = GRUP_HARFLERI.find(g => !mevcutGruplar.includes(g));
    
    if (!bosGrup) {
        if (window.showNotification) {
            window.showNotification('Tüm gruplar (A-E) zaten eklenmiş!', 'warning');
        }
        return;
    }

    grupInputEkle(sinif, bosGrup, '');
}

/**
 * Grup input ekle (yardımcı fonksiyon)
 */
function grupInputEkle(sinif, grup, fiyat = '', detayId = null) {
    const container = document.getElementById(`ad-sinif${sinif}Gruplar`);
    
    // "Henüz grup eklenmemiş" yazısı varsa kaldır
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();

    const row = document.createElement('div');
    row.style.cssText = 'display: flex; gap: 10px; align-items: center; margin-bottom: 8px;';
    row.dataset.detayId = detayId || '';
    
    row.innerHTML = `
        <select class="ad-grup-select" data-sinif="${sinif}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; min-width: 100px;">
            ${GRUP_HARFLERI.map(g => `<option value="${g}" ${g === grup ? 'selected' : ''}>${g} Grubu</option>`).join('')}
        </select>
        <input type="number" step="0.01" class="ad-grup-fiyat" placeholder="Birim Fiyat (TL/m²)" 
               value="${fiyat}" data-sinif="${sinif}" data-grup="${grup}"
               style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; flex: 1;">
        <button type="button" class="ad-btn ad-btn-danger" style="padding: 6px 10px;" onclick="window.adPage.grupSil(this, ${sinif}, ${detayId})">🗑️</button>
    `;
    
    container.appendChild(row);
}

/**
 * Grup sil
 */
function grupSil(element, sinif, detayId) {
    if (!confirm('Bu grubu silmek istediğinizden emin misiniz?')) return;

    // Eğer veritabanında varsa soft delete yap
    if (detayId) {
        db.run(`UPDATE birimFiyatDetay SET aktif = 0 WHERE id = ?`, [detayId], (err) => {
            if (err) {
                if (window.showNotification) {
                    window.showNotification('Silme hatası: ' + err.message, 'error');
                }
                return;
            }
            element.parentElement.remove();
            
            // Grup yoksa "Henüz grup eklenmemiş" yazısı göster
            const container = document.getElementById(`ad-sinif${sinif}Gruplar`);
            if (container.children.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Henüz grup eklenmemiş.</p>';
            }
        });
    } else {
        // Sadece UI'dan kaldır
        element.parentElement.remove();
        
        const container = document.getElementById(`ad-sinif${sinif}Gruplar`);
        if (container.children.length === 0) {
            container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Henüz grup eklenmemiş.</p>';
        }
    }
}

/**
 * Grupları kaydet
 */
function gruplariKaydet() {
    if (!seciliDonemId) {
        if (window.showNotification) {
            window.showNotification('Lütfen önce bir dönem seçin!', 'error');
        }
        return;
    }

    let basariliSayac = 0;
    let toplamIslem = 0;

    // Her sınıf için grupları topla
    for (let sinif = 1; sinif <= 5; sinif++) {
        const container = document.getElementById(`ad-sinif${sinif}Gruplar`);
        const rows = container.querySelectorAll('div[data-detay-id]');

        rows.forEach(row => {
            const grupSelect = row.querySelector('.ad-grup-select');
            const fiyatInput = row.querySelector('.ad-grup-fiyat');
            const detayId = row.dataset.detayId;

            const grup = grupSelect.value;
            const fiyat = parseFloat(fiyatInput.value);

            if (!grup || !fiyat || fiyat <= 0) {
                console.warn(`Geçersiz veri: Sınıf ${sinif}, Grup ${grup}, Fiyat ${fiyat}`);
                return;
            }

            toplamIslem++;

            if (detayId) {
                // Güncelle
                db.run(`UPDATE birimFiyatDetay SET birimFiyat = ? WHERE id = ?`,
                    [fiyat, detayId],
                    (err) => {
                        if (err) {
                            console.error('Güncelleme hatası:', err);
                        } else {
                            basariliSayac++;
                            console.log(`✅ Güncellendi: ${sinif}. Sınıf ${grup} Grubu`);
                        }
                    }
                );
            } else {
                // Ekle (veya güncelle - UPSERT)
                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat, aktif) 
                        VALUES (?, ?, ?, ?, 1)
                        ON CONFLICT(birimFiyatId, yapiSinifi, yapiGrubu) 
                        DO UPDATE SET birimFiyat = ?, aktif = 1`,
                    [seciliDonemId, sinif, grup, fiyat, fiyat],
                    (err) => {
                        if (err) {
                            console.error('Ekleme hatası:', err);
                        } else {
                            basariliSayac++;
                            console.log(`✅ Eklendi: ${sinif}. Sınıf ${grup} Grubu`);
                        }
                    }
                );
            }
        });
    }

    // İşlem tamamlandı mesajı
    setTimeout(() => {
        if (toplamIslem === 0) {
            if (window.showNotification) {
                window.showNotification('Kaydedilecek veri bulunamadı!', 'warning');
            }
        } else {
            if (window.showNotification) {
                window.showNotification(`${basariliSayac} / ${toplamIslem} grup başarıyla kaydedildi!`, 'success');
            }
            gruplariDuzenle(seciliDonemId, document.getElementById('ad-seciliDonemBaslik').textContent);
        }
    }, 500);
}

/**
 * Grup düzenlemeyi kapat
 */
function grupDuzenlemeyiKapat() {
    document.getElementById('ad-grupDuzenlemeBolumu').style.display = 'none';
    seciliDonemId = null;
}

/**
 * Dönem sil
 */
function donemSil(id) {
    if (!confirm('Bu dönemi ve ona ait tüm grup/fiyat bilgilerini silmek istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ!')) return;

    // Önce detayları sil
    db.run(`DELETE FROM birimFiyatDetay WHERE birimFiyatId = ?`, [id], (err) => {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Detay silme hatası: ' + err.message, 'error');
            }
            return;
        }

        // Sonra ana kaydı sil
        db.run(`DELETE FROM birimFiyatlar WHERE id = ?`, [id], (err) => {
            if (err) {
                if (window.showNotification) {
                    window.showNotification('Silme hatası: ' + err.message, 'error');
                }
                return;
            }
            if (window.showNotification) {
                window.showNotification('Dönem ve tüm grup bilgileri silindi', 'success');
            }
            loadDonemler();
        });
    });
}

// ======================
// RAPORTÖR YÖNETİMİ
// ======================

/**
 * Yeni raportör ekle
 */
function yeniRaportorEkle() {
    const adi = document.getElementById('ad-raportorAdi').value.trim();
    const soyadi = document.getElementById('ad-raportorSoyadi').value.trim();
    let unvani = document.getElementById('ad-raportorUnvani').value;
    
    // Elle giriş seçildiyse, text input'tan al
    if (unvani === '__diger__') {
        const digerInput = document.getElementById('ad-raportorUnvaniDiger');
        unvani = digerInput ? digerInput.value.trim() : '';
    }

    if (!adi || !soyadi || !unvani) {
        if (window.showNotification) {
            window.showNotification('Lütfen tüm alanları doldurun!', 'error');
        }
        return;
    }

    // Aynı isimde raportör var mı kontrol et
    db.get(`SELECT COUNT(*) as count FROM raportorleri WHERE adi = ? AND soyadi = ? AND aktif = 1`, 
        [adi, soyadi], (err, row) => {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Kontrol hatası: ' + err.message, 'error');
            }
            return;
        }

        if (row.count > 0) {
            if (window.showNotification) {
                window.showNotification('Bu isimde bir raportör zaten mevcut!', 'error');
            }
            return;
        }

        // Yeni raportör ekle
        db.run(`INSERT INTO raportorleri (adi, soyadi, unvani) VALUES (?, ?, ?)`,
            [adi, soyadi, unvani], function(err) {
            if (err) {
                if (window.showNotification) {
                    window.showNotification('Ekleme hatası: ' + err.message, 'error');
                }
                return;
            }
            
            if (window.showNotification) {
                window.showNotification('Raportör başarıyla eklendi!', 'success');
            }
            
            // Formu temizle
            document.getElementById('ad-raportorAdi').value = '';
            document.getElementById('ad-raportorSoyadi').value = '';
            document.getElementById('ad-raportorUnvani').value = '';
            const digerInput = document.getElementById('ad-raportorUnvaniDiger');
            if (digerInput) { digerInput.value = ''; digerInput.style.display = 'none'; }
            
            loadRaportorler();
        });
    });
}

/**
 * Raportör pasif yap
 */
function raportorPasifYap(id) {
    db.run(`UPDATE raportorleri SET aktif = 0, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`, 
        [id], function(err) {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Hata: ' + err.message, 'error');
            }
            return;
        }
        
        if (window.showNotification) {
            window.showNotification('Raportör pasif yapıldı!', 'success');
        }
        loadRaportorler();
    });
}

/**
 * Raportör sil (kalıcı silme)
 */
function raportorSil(id) {
    db.get(`SELECT adi, soyadi FROM raportorleri WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            if (window.showNotification) {
                window.showNotification('Raportör bulunamadı!', 'error');
            }
            return;
        }

        if (!confirm(`"${row.adi} ${row.soyadi}" isimli raportörü kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ!`)) return;

        db.run(`DELETE FROM raportorleri WHERE id = ?`, [id], function(err) {
            if (err) {
                if (window.showNotification) {
                    window.showNotification('Silme hatası: ' + err.message, 'error');
                }
                return;
            }
            
            if (window.showNotification) {
                window.showNotification('Raportör kalıcı olarak silindi!', 'success');
            }
            loadRaportorler();
        });
    });
}

/**
 * Raportör aktif yap
 */
function raportorAktifYap(id) {
    db.run(`UPDATE raportorleri SET aktif = 1, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`, 
        [id], function(err) {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Hata: ' + err.message, 'error');
            }
            return;
        }
        
        if (window.showNotification) {
            window.showNotification('Raportör aktif yapıldı!', 'success');
        }
        loadRaportorler();
    });
}

// ======================
// KURUM YÖNETİMİ
// ======================

/**
 * Yeni kurum ekle
 */
function yeniKurumEkle() {
    const kurumAdi = document.getElementById('ad-kurumAdi').value.trim();
    const altKurum = document.getElementById('ad-altKurum').value.trim() || null;

    if (!kurumAdi) {
        if (window.showNotification) {
            window.showNotification('Lütfen kurum adını girin!', 'error');
        }
        return;
    }

    // Aynı kurum var mı kontrol et
    const kontrolSorgusu = altKurum 
        ? `SELECT COUNT(*) as count FROM kurumlar WHERE kurumAdi = ? AND altKurum = ? AND aktif = 1`
        : `SELECT COUNT(*) as count FROM kurumlar WHERE kurumAdi = ? AND altKurum IS NULL AND aktif = 1`;
    
    const parametreler = altKurum ? [kurumAdi, altKurum] : [kurumAdi];

    db.get(kontrolSorgusu, parametreler, (err, row) => {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Kontrol hatası: ' + err.message, 'error');
            }
            return;
        }

        if (row.count > 0) {
            if (window.showNotification) {
                window.showNotification('Bu kurum zaten mevcut!', 'error');
            }
            return;
        }

        // Yeni kurum ekle
        db.run(`INSERT INTO kurumlar (kurumAdi, altKurum) VALUES (?, ?)`,
            [kurumAdi, altKurum], function(err) {
            if (err) {
                if (window.showNotification) {
                    window.showNotification('Ekleme hatası: ' + err.message, 'error');
                }
                return;
            }
            
            if (window.showNotification) {
                window.showNotification('Kurum başarıyla eklendi!', 'success');
            }
            
            // Formu temizle
            document.getElementById('ad-kurumAdi').value = '';
            document.getElementById('ad-altKurum').value = '';
            
            loadKurumlar();
        });
    });
}

/**
 * Kurum pasif yap
 */
function kurumPasifYap(id) {
    db.run(`UPDATE kurumlar SET aktif = 0, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`, 
        [id], function(err) {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Hata: ' + err.message, 'error');
            }
            return;
        }
        
        if (window.showNotification) {
            window.showNotification('Kurum pasif yapıldı!', 'success');
        }
        loadKurumlar();
    });
}

/**
 * Kurum sil (kalıcı silme)
 */
function kurumSil(id) {
    db.get(`SELECT kurumAdi, altKurum FROM kurumlar WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            if (window.showNotification) {
                window.showNotification('Kurum bulunamadı!', 'error');
            }
            return;
        }

        const tamGorunum = row.altKurum 
            ? `${row.kurumAdi} (${row.altKurum})`
            : row.kurumAdi;

        if (!confirm(`"${tamGorunum}" kurumunu kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ!`)) return;

        db.run(`DELETE FROM kurumlar WHERE id = ?`, [id], function(err) {
            if (err) {
                if (window.showNotification) {
                    window.showNotification('Silme hatası: ' + err.message, 'error');
                }
                return;
            }
            
            if (window.showNotification) {
                window.showNotification('Kurum kalıcı olarak silindi!', 'success');
            }
            loadKurumlar();
        });
    });
}

/**
 * Kurum aktif yap
 */
function kurumAktifYap(id) {
    db.run(`UPDATE kurumlar SET aktif = 1, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`, 
        [id], function(err) {
        if (err) {
            if (window.showNotification) {
                window.showNotification('Hata: ' + err.message, 'error');
            }
            return;
        }
        
        if (window.showNotification) {
            window.showNotification('Kurum aktif yapıldı!', 'success');
        }
        loadKurumlar();
    });
}

// ======================
// PID ORANLARI YÖNETİMİ
// ======================

/**
 * PID oranları tablosunu oluştur (yoksa)
 */
function pidOranlariTablosuOlustur() {
    return new Promise((resolve, reject) => {
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
                console.error('PID oranları tablosu oluşturulamadı:', err);
                reject(err);
            } else {
                console.log('✅ PID oranları tablosu hazır');
                resolve();
            }
        });
    });
}

/**
 * PID oranlarını veritabanından yükle
 */
function pidOranlariYukle() {
    // Önce tabloyu oluştur (yoksa)
    pidOranlariTablosuOlustur().then(() => {
        db.all(`SELECT * FROM pidOranlari WHERE aktif = 1 ORDER BY minAlan`, [], (err, rows) => {
            if (err) {
                console.error('PID oranları yüklenemedi:', err);
                if (window.showNotification) {
                    window.showNotification('PID oranları yüklenemedi: ' + err.message, 'error');
                }
                return;
            }
            
            // Tüm inputları temizle
            document.querySelectorAll('.pid-input').forEach(input => {
                input.value = '';
            });
            
            // Veritabanındaki değerleri inputlara yerleştir
            rows.forEach(row => {
                const alan = parseInt(row.minAlan); // Float'tan integer'a çevir
                const sinif = row.hizmetSinifi;
                const tr = document.querySelector(`tr[data-alan="${alan}"]`);
                if (tr) {
                    const input = tr.querySelector(`input[data-sinif="${sinif}"]`);
                    if (input) {
                        input.value = row.pidOrani;
                    }
                } else {
                    console.log(`TR bulunamadı: alan=${alan}, sinif=${sinif}`);
                }
            });
            
            console.log(`✅ ${rows.length} PID oranı yüklendi`);
            if (window.showNotification) {
                window.showNotification(`${rows.length} PID oranı yüklendi`, 'success');
            }
        });
    }).catch(err => {
        console.error('PID tablosu oluşturma hatası:', err);
        if (window.showNotification) {
            window.showNotification('PID tablosu oluşturulamadı: ' + err.message, 'error');
        }
    });
}

/**
 * PID oranlarını veritabanına kaydet
 */
function pidOranlariKaydet() {
    // Önce tabloyu oluştur (yoksa)
    pidOranlariTablosuOlustur().then(() => {
        const rows = document.querySelectorAll('#ad-pidOranlariBody tr');
        let kayitSayisi = 0;
        let hataSayisi = 0;
        
        // Her satır için
        rows.forEach(tr => {
            const alan = parseInt(tr.dataset.alan);
            if (!alan) return;
            
            // Her sınıf için (1-5)
            for (let sinif = 1; sinif <= 5; sinif++) {
                const input = tr.querySelector(`input[data-sinif="${sinif}"]`);
                if (!input) continue;
                
                const pidOrani = parseFloat(input.value);
                if (isNaN(pidOrani)) continue;
                
                // Veritabanına kaydet veya güncelle
                db.run(`INSERT OR REPLACE INTO pidOranlari (minAlan, maxAlan, hizmetSinifi, pidOrani, aktif) 
                        VALUES (?, ?, ?, ?, 1)`,
                    [alan, alan, sinif, pidOrani],
                    function(err) {
                        if (err) {
                            console.error(`PID kayıt hatası (Alan: ${alan}, Sınıf: ${sinif}):`, err);
                            hataSayisi++;
                        } else {
                            kayitSayisi++;
                        }
                    }
                );
            }
        });
        
        // Kayıt tamamlandıktan sonra bildirim göster
        setTimeout(() => {
            if (hataSayisi > 0) {
                if (window.showNotification) {
                    window.showNotification(`${kayitSayisi} kayıt başarılı, ${hataSayisi} hata oluştu`, 'warning');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('PID oranları başarıyla kaydedildi!', 'success');
                }
            }
            console.log(`✅ PID oranları kaydedildi: ${kayitSayisi} başarılı, ${hataSayisi} hata`);
        }, 500);
    }).catch(err => {
        console.error('PID tablosu oluşturma hatası:', err);
        if (window.showNotification) {
            window.showNotification('PID tablosu oluşturulamadı: ' + err.message, 'error');
        }
    });
}

// ======================
// İL / İLÇE YÖNETİMİ
// ======================

const MANUEL_IL_SENTINEL = '__manuel__';

/**
 * JSON'daki illeri dropdown'a doldur, en sonda "Aradığım il burada yok" seçeneği
 */
function jsonIlSelectDoldur() {
    const select = document.getElementById('ad-jsonIlSelect');
    if (!select) return;

    select.innerHTML = '<option value="">İl Seçiniz...</option>';

    if (sehirlerJsonCache && Array.isArray(sehirlerJsonCache)) {
        const sirali = [...sehirlerJsonCache].sort((a, b) =>
            (a.sehir_adi || '').localeCompare(b.sehir_adi || '', 'tr')
        );
        sirali.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.sehir_id;
            opt.textContent = s.sehir_adi;
            select.appendChild(opt);
        });
    }

    // Manuel ekleme seçeneği (en alt)
    const manuelOpt = document.createElement('option');
    manuelOpt.value = MANUEL_IL_SENTINEL;
    manuelOpt.textContent = '🔍 Aradığım il burada yok (manuel ekle)';
    select.appendChild(manuelOpt);

    // Seçim değişince manuel kutuyu aç/kapat
    select.onchange = () => {
        const manuelBox = document.getElementById('ad-manuelIlBolumu');
        if (!manuelBox) return;
        if (select.value === MANUEL_IL_SENTINEL) {
            manuelBox.style.display = 'block';
            const inp = document.getElementById('ad-manuelIlAdi');
            if (inp) inp.focus();
        } else {
            manuelBox.style.display = 'none';
        }
    };
}

/**
 * Yüklü illeri tabloya yükle
 */
function loadIller() {
    return new Promise((resolve) => {
        const tbody = document.getElementById('ad-illerBody');
        if (!tbody) { resolve(); return; }

        const sql = `
            SELECT i.id, i.sehir_adi, i.aktif, i.varsayilan,
                   (SELECT COUNT(*) FROM ilceler WHERE il_id = i.id AND aktif = 1) AS ilceSayisi
            FROM iller i
            ORDER BY i.varsayilan DESC, i.sehir_adi
        `;
        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('İller yüklenemedi:', err);
                resolve();
                return;
            }

            tbody.innerHTML = '';
            if (rows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" class="ad-empty-message">Henüz il yüklenmedi. Yukarıdan bir il seçip yükleyin.</td></tr>`;
                resolve();
                return;
            }

            rows.forEach(row => {
                const tr = document.createElement('tr');
                const varsayilanBtn = row.varsayilan
                    ? `<span class="ad-status-badge active">⭐ Varsayılan</span>`
                    : `<button class="ad-btn" style="background:#17a2b8;color:white;" onclick="window.adPage.ilVarsayilanYap(${row.id})">Varsayılan Yap</button>`;

                const durumBtn = row.aktif
                    ? `<button class="ad-btn" style="background:#ff9800;color:white;" onclick="window.adPage.ilDurumDegistir(${row.id}, false)">Pasif Yap</button>`
                    : `<button class="ad-btn ad-btn-success" onclick="window.adPage.ilDurumDegistir(${row.id}, true)">Aktif Yap</button>`;

                tr.innerHTML = `
                    <td>${row.id}</td>
                    <td><strong>${escapeHtml(row.sehir_adi)}</strong></td>
                    <td>${row.ilceSayisi}</td>
                    <td>${varsayilanBtn}</td>
                    <td><span class="ad-status-badge ${row.aktif ? 'active' : 'inactive'}">${row.aktif ? 'Aktif' : 'Pasif'}</span></td>
                    <td>
                        <button class="ad-btn" style="background:#2A4C6E;color:white;" onclick="window.adPage.ilceleriniGoster(${row.id}, '${escapeJs(row.sehir_adi)}')">📍 İlçeler</button>
                        ${durumBtn}
                        <button class="ad-btn ad-btn-danger" onclick="window.adPage.ilSil(${row.id})">Sil</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            resolve();
        });
    });
}

/**
 * Dropdown'dan seçilen ili (ve tüm ilçelerini) DB'ye yükle
 */
function ilYukle() {
    const select = document.getElementById('ad-jsonIlSelect');
    if (!select) return;
    const secilenSehirId = select.value;

    if (!secilenSehirId) {
        if (window.showNotification) window.showNotification('Lütfen bir il seçin!', 'error');
        return;
    }

    if (secilenSehirId === MANUEL_IL_SENTINEL) {
        if (window.showNotification) window.showNotification('Manuel ekleme için aşağıdaki kutuyu kullanın.', 'info');
        return;
    }

    if (!sehirlerJsonCache || !ilcelerJsonCache) {
        if (window.showNotification) window.showNotification('İl/ilçe veri dosyaları bulunamadı!', 'error');
        return;
    }

    const sehir = sehirlerJsonCache.find(s => s.sehir_id === secilenSehirId);
    if (!sehir) {
        if (window.showNotification) window.showNotification('Seçilen il bulunamadı!', 'error');
        return;
    }

    // Aynı il zaten yüklü mü?
    db.get(`SELECT id FROM iller WHERE sehir_adi = ?`, [sehir.sehir_adi], (err, mevcut) => {
        if (err) {
            if (window.showNotification) window.showNotification('Veritabanı hatası: ' + err.message, 'error');
            return;
        }
        if (mevcut) {
            if (window.showNotification) window.showNotification(`"${sehir.sehir_adi}" zaten yüklü!`, 'error');
            return;
        }

        db.run(`INSERT INTO iller (sehir_id, sehir_adi) VALUES (?, ?)`,
            [sehir.sehir_id, sehir.sehir_adi], function(err) {
                if (err) {
                    if (window.showNotification) window.showNotification('İl ekleme hatası: ' + err.message, 'error');
                    return;
                }
                const yeniIlId = this.lastID;
                const ilceler = ilcelerJsonCache.filter(i => i.sehir_id === secilenSehirId);

                const stmt = db.prepare(`INSERT INTO ilceler (ilce_id, ilce_adi, il_id) VALUES (?, ?, ?)`);
                let eklenen = 0;
                ilceler.forEach(i => {
                    stmt.run([i.ilce_id, i.ilce_adi, yeniIlId], (err) => {
                        if (!err) eklenen++;
                    });
                });
                stmt.finalize(() => {
                    if (window.showNotification) {
                        window.showNotification(`✅ ${sehir.sehir_adi} ve ${eklenen} ilçesi başarıyla yüklendi!`, 'success');
                    }
                    select.value = '';
                    const manuelBox = document.getElementById('ad-manuelIlBolumu');
                    if (manuelBox) manuelBox.style.display = 'none';
                    loadIller();
                });
            });
    });
}

/**
 * Manuel il ekle (listede olmayan iller için)
 */
function manuelIlEkle() {
    const input = document.getElementById('ad-manuelIlAdi');
    if (!input) return;
    const ilAdi = input.value.trim().toLocaleUpperCase('tr');

    if (!ilAdi) {
        if (window.showNotification) window.showNotification('İl adı boş olamaz!', 'error');
        return;
    }

    db.get(`SELECT id FROM iller WHERE sehir_adi = ?`, [ilAdi], (err, mevcut) => {
        if (err) {
            if (window.showNotification) window.showNotification('Veritabanı hatası: ' + err.message, 'error');
            return;
        }
        if (mevcut) {
            if (window.showNotification) window.showNotification(`"${ilAdi}" zaten yüklü!`, 'error');
            return;
        }
        db.run(`INSERT INTO iller (sehir_id, sehir_adi) VALUES (NULL, ?)`,
            [ilAdi], function(err) {
                if (err) {
                    if (window.showNotification) window.showNotification('Ekleme hatası: ' + err.message, 'error');
                    return;
                }
                if (window.showNotification) window.showNotification(`✅ "${ilAdi}" manuel olarak eklendi! Şimdi ilçelerini ekleyebilirsiniz.`, 'success');
                input.value = '';
                const select = document.getElementById('ad-jsonIlSelect');
                if (select) select.value = '';
                const manuelBox = document.getElementById('ad-manuelIlBolumu');
                if (manuelBox) manuelBox.style.display = 'none';
                loadIller();
            });
    });
}

/**
 * İl varsayılan yap (sadece bir il varsayılan olabilir)
 */
function ilVarsayilanYap(id) {
    db.serialize(() => {
        db.run(`UPDATE iller SET varsayilan = 0`, [], (err) => {
            if (err) {
                if (window.showNotification) window.showNotification('Hata: ' + err.message, 'error');
                return;
            }
            db.run(`UPDATE iller SET varsayilan = 1, aktif = 1, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`,
                [id], (err) => {
                    if (err) {
                        if (window.showNotification) window.showNotification('Hata: ' + err.message, 'error');
                        return;
                    }
                    if (window.showNotification) window.showNotification('Varsayılan il güncellendi!', 'success');
                    loadIller();
                });
        });
    });
}

/**
 * İl aktif/pasif yap
 */
function ilDurumDegistir(id, aktif) {
    db.run(`UPDATE iller SET aktif = ?, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`,
        [aktif ? 1 : 0, id], (err) => {
            if (err) {
                if (window.showNotification) window.showNotification('Hata: ' + err.message, 'error');
                return;
            }
            if (window.showNotification) window.showNotification(aktif ? 'İl aktif yapıldı' : 'İl pasif yapıldı', 'success');
            loadIller();
        });
}

/**
 * İl sil (kalıcı - ilçeleri ile birlikte)
 */
function ilSil(id) {
    db.get(`SELECT sehir_adi, varsayilan FROM iller WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            if (window.showNotification) window.showNotification('İl bulunamadı!', 'error');
            return;
        }
        if (row.varsayilan) {
            if (window.showNotification) window.showNotification('Varsayılan il silinemez! Önce başka bir ili varsayılan yapın.', 'error');
            return;
        }
        if (!confirm(`"${row.sehir_adi}" ilini ve TÜM ilçelerini kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ!`)) return;

        db.serialize(() => {
            db.run(`DELETE FROM ilceler WHERE il_id = ?`, [id]);
            db.run(`DELETE FROM iller WHERE id = ?`, [id], (err) => {
                if (err) {
                    if (window.showNotification) window.showNotification('Silme hatası: ' + err.message, 'error');
                    return;
                }
                if (window.showNotification) window.showNotification(`"${row.sehir_adi}" silindi!`, 'success');
                if (seciliIlId === id) ilceYonetiminiKapat();
                loadIller();
            });
        });
    });
}

/**
 * Seçilen ilin ilçelerini alt panelde göster
 */
function ilceleriniGoster(ilId, ilAdi) {
    seciliIlId = ilId;
    const bolum = document.getElementById('ad-ilceYonetimBolumu');
    const baslik = document.getElementById('ad-seciliIlAdi');
    if (baslik) baslik.textContent = ilAdi;
    if (bolum) {
        bolum.style.display = 'block';
        bolum.scrollIntoView({ behavior: 'smooth' });
    }
    loadIlceler();
}

/**
 * Seçili ilin ilçelerini tabloya yükle
 */
function loadIlceler() {
    if (!seciliIlId) return;
    const tbody = document.getElementById('ad-ilcelerBody');
    if (!tbody) return;

    db.all(`SELECT * FROM ilceler WHERE il_id = ? ORDER BY ilce_adi`, [seciliIlId], (err, rows) => {
        if (err) {
            console.error('İlçeler yüklenemedi:', err);
            return;
        }
        tbody.innerHTML = '';
        if (rows.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="ad-empty-message">Bu ile henüz ilçe eklenmedi.</td></tr>`;
            return;
        }
        rows.forEach(row => {
            const tr = document.createElement('tr');
            const durumBtn = row.aktif
                ? `<button class="ad-btn" style="background:#ff9800;color:white;" onclick="window.adPage.ilceDurumDegistir(${row.id}, false)">Pasif Yap</button>`
                : `<button class="ad-btn ad-btn-success" onclick="window.adPage.ilceDurumDegistir(${row.id}, true)">Aktif Yap</button>`;
            tr.innerHTML = `
                <td>${row.id}</td>
                <td><input type="text" value="${escapeHtml(row.ilce_adi)}" data-id="${row.id}" class="ad-ilce-edit" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;"></td>
                <td><span class="ad-status-badge ${row.aktif ? 'active' : 'inactive'}">${row.aktif ? 'Aktif' : 'Pasif'}</span></td>
                <td>
                    <button class="ad-btn ad-btn-success" onclick="window.adPage.ilceGuncelle(${row.id})">💾 Kaydet</button>
                    ${durumBtn}
                    <button class="ad-btn ad-btn-danger" onclick="window.adPage.ilceSil(${row.id})">Sil</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

/**
 * Seçili ile yeni ilçe ekle
 */
function ilceEkle() {
    if (!seciliIlId) return;
    const input = document.getElementById('ad-yeniIlceAdi');
    if (!input) return;
    const ilceAdi = input.value.trim().toLocaleUpperCase('tr');

    if (!ilceAdi) {
        if (window.showNotification) window.showNotification('İlçe adı boş olamaz!', 'error');
        return;
    }

    db.get(`SELECT id FROM ilceler WHERE il_id = ? AND ilce_adi = ?`,
        [seciliIlId, ilceAdi], (err, mevcut) => {
            if (err) {
                if (window.showNotification) window.showNotification('Veritabanı hatası: ' + err.message, 'error');
                return;
            }
            if (mevcut) {
                if (window.showNotification) window.showNotification(`"${ilceAdi}" bu ilde zaten var!`, 'error');
                return;
            }
            db.run(`INSERT INTO ilceler (ilce_id, ilce_adi, il_id) VALUES (NULL, ?, ?)`,
                [ilceAdi, seciliIlId], function(err) {
                    if (err) {
                        if (window.showNotification) window.showNotification('Ekleme hatası: ' + err.message, 'error');
                        return;
                    }
                    if (window.showNotification) window.showNotification(`✅ "${ilceAdi}" eklendi!`, 'success');
                    input.value = '';
                    loadIlceler();
                    loadIller(); // İlçe sayısı güncellensin
                });
        });
}

/**
 * İlçe adını güncelle
 */
function ilceGuncelle(id) {
    const input = document.querySelector(`.ad-ilce-edit[data-id="${id}"]`);
    if (!input) return;
    const yeniAd = input.value.trim().toLocaleUpperCase('tr');

    if (!yeniAd) {
        if (window.showNotification) window.showNotification('İlçe adı boş olamaz!', 'error');
        return;
    }

    db.run(`UPDATE ilceler SET ilce_adi = ?, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`,
        [yeniAd, id], (err) => {
            if (err) {
                if (window.showNotification) window.showNotification('Güncelleme hatası: ' + err.message, 'error');
                return;
            }
            if (window.showNotification) window.showNotification(`✅ İlçe güncellendi: ${yeniAd}`, 'success');
            loadIlceler();
        });
}

/**
 * İlçe aktif/pasif yap
 */
function ilceDurumDegistir(id, aktif) {
    db.run(`UPDATE ilceler SET aktif = ?, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`,
        [aktif ? 1 : 0, id], (err) => {
            if (err) {
                if (window.showNotification) window.showNotification('Hata: ' + err.message, 'error');
                return;
            }
            if (window.showNotification) window.showNotification(aktif ? 'İlçe aktif yapıldı' : 'İlçe pasif yapıldı', 'success');
            loadIlceler();
            loadIller();
        });
}

/**
 * İlçe sil (kalıcı)
 */
function ilceSil(id) {
    db.get(`SELECT ilce_adi FROM ilceler WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            if (window.showNotification) window.showNotification('İlçe bulunamadı!', 'error');
            return;
        }
        if (!confirm(`"${row.ilce_adi}" ilçesini kalıcı olarak silmek istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ!`)) return;
        db.run(`DELETE FROM ilceler WHERE id = ?`, [id], (err) => {
            if (err) {
                if (window.showNotification) window.showNotification('Silme hatası: ' + err.message, 'error');
                return;
            }
            if (window.showNotification) window.showNotification(`"${row.ilce_adi}" silindi!`, 'success');
            loadIlceler();
            loadIller();
        });
    });
}

/**
 * İlçe yönetim panelini kapat
 */
function ilceYonetiminiKapat() {
    seciliIlId = null;
    const bolum = document.getElementById('ad-ilceYonetimBolumu');
    if (bolum) bolum.style.display = 'none';
}

/**
 * HTML escape (XSS koruması)
 */
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * JS string escape (inline onclick için)
 */
function escapeJs(str) {
    if (str == null) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Global erişim için
window.adPage = {
    yeniDonemEkle,
    donemDurumDegistir,
    donemSil,
    gruplariDuzenle,
    grupEkle,
    grupSil,
    gruplariKaydet,
    grupDuzenlemeyiKapat,
    yeniRaportorEkle,
    raportorPasifYap,
    raportorAktifYap,
    raportorSil,
    yeniKurumEkle,
    kurumPasifYap,
    kurumAktifYap,
    kurumSil,
    pidOranlariYukle,
    pidOranlariKaydet,
    // İl / İlçe
    ilYukle,
    manuelIlEkle,
    ilVarsayilanYap,
    ilDurumDegistir,
    ilSil,
    ilceleriniGoster,
    ilceEkle,
    ilceGuncelle,
    ilceDurumDegistir,
    ilceSil,
    ilceYonetiminiKapat
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
