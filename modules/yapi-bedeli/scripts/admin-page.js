/**
 * Admin Sayfa Modülü
 * Tek pencere navigasyon sistemi için
 * Birim Fiyat, Raportör ve Kurum yönetimi
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, '..', '..', '..', 'raporlar.db');
let db = null;

// Navigation referansı
let nav = null;

// Global değişkenler
let seciliDonemId = null;
const GRUP_HARFLERI = ['A', 'B', 'C', 'D', 'E'];

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
    const unvani = document.getElementById('ad-raportorUnvani').value;

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
    pidOranlariKaydet
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
