const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { getDbPath } = require('../../../shared/scripts/db-helper');

// Veritabanı ana dizinde (ASAR uyumlu)
const dbPath = getDbPath();
let db = new sqlite3.Database(dbPath);

// Birim fiyat verileri cache (veritabanından yüklenecek)
let birimFiyatCache = {};
let yapiGrupCache = {}; // Yapı sınıfı için mevcut grupları sakla
let hesapDonemleriCache = []; // Hesap dönemleri
let fotograflar = []; // Seçilen fotoğraflar

// SAMSUN'un ilçeleri
const samsunIlceleri = [
    "Atakum",
    "Canik",
    "İlkadım",
    "Bafra",
    "Ladik",
    "Tekkeköy",
    "Vezirköprü",
    "Havza",
    "Salıpazarı",
    "Çarşamba",
    "Kavak",
    "Ayvacık",
    "Alacam",
    "Terme",
    "19 Mayıs",
    "Asarcık",
    "Yakakent"
];

// Sayfa yüklendiğinde
window.onload = () => {
    console.log('🚀 Sayfa yükleniyor...');
    
    // Rapor tarihini bugünün tarihi olarak ayarla
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('raporTarihi').value = today;
    
    // Hesap dönemlerini yükle
    populateHesapDonemleri();
    
    // Yıpranma paylarını yükle
    loadYipranmaPaylari((err, data) => {
        if (err) {
            console.error('Yıpranma payları yüklenemedi:', err);
        }
    });
    
    // Kurumları biraz gecikmeyle yükle
    setTimeout(() => {
        kurumlariDoldur();
    }, 1500);
    
    // Raportör alanlarını oluştur
    updateRaportorAlanlari();
    
    // İlçeleri doldur
    const ilceler = [
        'Atakum', 'Canik', 'İlkadım', 'Tekkeköy', 'Asarcık', 'Ayvacık', 'Bafra', 
        'Çarşamba', 'Havza', 'Kavak', 'Ladik', 'Ondokuzmayıs', 'Salıpazarı', 
        'Terme', 'Vezirköprü', 'Yakakent'
    ];
    
    const ilceSelect = document.getElementById('ilce');
    ilceler.forEach(ilce => {
        const option = document.createElement('option');
        option.value = ilce;
        option.textContent = ilce;
        ilceSelect.appendChild(option);
    });
    
    // Event listener'ları ekle
    const raportorSayisiElement = document.getElementById('raportorSayisi');
    const fotograflarElement = document.getElementById('fotograflar');
    
    if (raportorSayisiElement) raportorSayisiElement.addEventListener('change', updateRaportorAlanlari);
    if (fotograflarElement) fotograflarElement.addEventListener('change', handleFotografSecimi);
    
    // Navigasyon butonları
    const homeButton = document.getElementById('homeButton');
    const reportsNavButton = document.getElementById('reportsNavButton');
    
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            console.log('Pencere kapatılıyor...');
            // Pencereyi kapat
            ipcRenderer.send('navigate-home');
        });
    }
    
    if (reportsNavButton) {
        reportsNavButton.addEventListener('click', () => {
            console.log('Raporlar sayfasına gidiliyor...');
            // Raporlar sayfasını aç
            ipcRenderer.send('show-reports');
        });
    }
    
    console.log('✅ Sayfa yüklendi ve event listener\'lar eklendi');
};

// Hesap dönemlerini yükle (veritabanından)
function loadHesapDonemleri(callback) {
    db.all(`SELECT id, yil, donem, tebligAdi FROM birimFiyatlar WHERE aktif = 1 ORDER BY yil DESC, donem DESC`, [], (err, rows) => {
        if (err) {
            console.error('Hesap dönemleri yüklenemedi:', err);
            callback(err, null);
            return;
        }
        hesapDonemleriCache = rows || [];
        callback(null, rows);
    });
}

// Hesap dönemi dropdown'unu doldur
function populateHesapDonemleri() {
    console.log('📅 Hesap dönemleri yükleniyor...');
    const hesapYiliSelect = document.getElementById('hesapYili');
    
    if (!hesapYiliSelect) {
        console.error('❌ hesapYili elementi bulunamadı!');
        return;
    }
    
    hesapYiliSelect.innerHTML = '<option value="">Seçiniz...</option>';

    loadHesapDonemleri((err, donemler) => {
        if (err) {
            console.error('❌ Hesap dönemleri yükleme hatası:', err);
            return;
        }
        
        if (!donemler || donemler.length === 0) {
            console.warn('⚠️ Hiç hesap dönemi bulunamadı');
            return;
        }

        console.log(`✅ ${donemler.length} hesap dönemi bulundu`);

        donemler.forEach(donem => {
            const option = document.createElement('option');
            option.value = donem.id; // birimFiyatId
            
            // Yıl eşsizse sadece yıl göster, değilse yıl/dönem göster
            const ayniYilDonemler = donemler.filter(d => d.yil === donem.yil);
            if (ayniYilDonemler.length === 1) {
                option.textContent = `${donem.yil}`;
            } else {
                option.textContent = `${donem.yil}/${donem.donem}`;
            }
            
            option.dataset.yil = donem.yil;
            option.dataset.donem = donem.donem;
            option.dataset.tebligAdi = donem.tebligAdi || '';
            
            hesapYiliSelect.appendChild(option);
            console.log(`  ➕ Eklendi: ${option.textContent}`);
        });
        
        console.log('✅ Hesap dönemleri başarıyla yüklendi');
    });
}

// Kurumları veritabanından çek ve dropdown'ı doldur
function kurumlariDoldur() {
    const kurumSelect = document.getElementById('ilgiliKurum');
    if (!kurumSelect) {
        console.log('İlgili kurum select elementi bulunamadı');
        return;
    }

    console.log('Kurumlar yükleniyor...');

    // Önce tablo var mı kontrol et
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='kurumlar'`, [], (err, row) => {
        if (err) {
            console.error('Tablo kontrol hatası:', err);
            return;
        }

        if (!row) {
            // Tablo henüz yok, 3 saniye sonra tekrar dene
            console.log('Kurumlar tablosu henüz yok, 3 saniye sonra tekrar denenecek...');
            setTimeout(() => {
                kurumlariDoldur();
            }, 3000);
            return;
        }

        console.log('Kurumlar tablosu bulundu, veriler çekiliyor...');

        // Tablo var, verileri çek
        db.all(`SELECT * FROM kurumlar WHERE aktif = 1 ORDER BY kurumAdi, altKurum`, [], (err, rows) => {
            if (err) {
                console.error('Kurum yükleme hatası:', err);
                return;
            }

            console.log('Bulunan kurum sayısı:', rows ? rows.length : 0);

            // Mevcut seçenekleri temizle (ilk seçenek hariç)
            kurumSelect.innerHTML = '<option value="">Kurum Seçiniz...</option>';

            if (rows && rows.length > 0) {
                rows.forEach(kurum => {
                    const option = document.createElement('option');
                    // Tam görünüm: "Kurum (Alt Kurum)" formatında
                    const tamGorunum = kurum.altKurum 
                        ? `${kurum.kurumAdi} (${kurum.altKurum})`
                        : kurum.kurumAdi;
                    
                    option.value = tamGorunum;
                    option.textContent = tamGorunum;
                    kurumSelect.appendChild(option);
                    console.log('Kurum eklendi:', tamGorunum);
                });
                console.log('✅ Kurumlar başarıyla yüklendi');
            } else {
                console.log('⚠️ Hiç kurum bulunamadı');
            }
        });
    });
}

// Raportörleri veritabanından çek
function raportorleriGetir() {
    return new Promise((resolve, reject) => {
        // Önce tablo var mı kontrol et
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='raportorleri'`, [], (err, row) => {
            if (err) {
                console.error('Tablo kontrol hatası:', err);
                reject(err);
                return;
            }

            if (!row) {
                // Tablo henüz yok, boş array döndür
                console.log('Raportörler tablosu henüz oluşturulmamış');
                resolve([]);
                return;
            }

            // Tablo var, verileri çek
            db.all(`SELECT * FROM raportorleri WHERE aktif = 1 ORDER BY adi, soyadi`, [], (err, rows) => {
                if (err) {
                    console.error('Raportör çekme hatası:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    });
}

// Raportör alanlarını dinamik oluştur
async function updateRaportorAlanlari() {
    console.log('👨‍💼 Raportör alanları oluşturuluyor...');
    
    const raportorSayisiElement = document.getElementById('raportorSayisi');
    const container = document.getElementById('raportorContainer');
    
    if (!raportorSayisiElement || !container) {
        console.error('❌ Raportör elementleri bulunamadı!');
        return;
    }
    
    const raportorSayisi = parseInt(raportorSayisiElement.value) || 1;
    console.log(`  📝 ${raportorSayisi} raportör alanı oluşturulacak`);
    
    container.innerHTML = '';

    try {
        const raportorleri = await raportorleriGetir();
        console.log(`  ✅ ${raportorleri.length} raportör veritabanından çekildi`);
        
        for (let i = 1; i <= raportorSayisi; i++) {
            const div = document.createElement('div');
            div.className = 'form-row';
            
            // Raportör seçenekleri oluştur
            let raportorOptions = '<option value="">Raportör Seçiniz...</option>';
            raportorleri.forEach(raportor => {
                raportorOptions += `<option value="${raportor.id}" data-unvan="${raportor.unvani}">${raportor.adi} ${raportor.soyadi}</option>`;
            });
            
            div.innerHTML = `
                <div class="form-group">
                    <label for="raportorSecimi${i}">Raportör ${i} - Seçim *</label>
                    <select id="raportorSecimi${i}" class="raportorSecimi" onchange="raportorSecildi(${i})" required>
                        ${raportorOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label for="raportorUnvani${i}">Raportör ${i} - Ünvanı *</label>
                    <input type="text" id="raportorUnvani${i}" class="raportorUnvani" placeholder="Ünvan otomatik gelecek" readonly>
                </div>
            `;
            container.appendChild(div);
        }
        console.log('✅ Raportör alanları başarıyla oluşturuldu');
    } catch (error) {
        console.error('❌ Raportör alanları oluşturulurken hata:', error);
        // Hata durumunda eski sistemi kullan
        for (let i = 1; i <= raportorSayisi; i++) {
            const div = document.createElement('div');
            div.className = 'form-row';
            div.innerHTML = `
                <div class="form-group">
                    <label for="raportorAdi${i}">Raportör ${i} - Adı Soyadı *</label>
                    <input type="text" id="raportorAdi${i}" class="raportorAdi" placeholder="Ad Soyad" required>
                </div>
                <div class="form-group">
                    <label for="raportorUnvani${i}">Raportör ${i} - Ünvanı *</label>
                    <input type="text" id="raportorUnvani${i}" class="raportorUnvani" placeholder="Örn: İnşaat Mühendisi" required>
                </div>
            `;
            container.appendChild(div);
        }
    }
}

// Raportör seçildiğinde ünvanı otomatik doldur
function raportorSecildi(raportorIndex) {
    const selectElement = document.getElementById(`raportorSecimi${raportorIndex}`);
    const unvanInput = document.getElementById(`raportorUnvani${raportorIndex}`);
    
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    
    if (selectedOption.value && selectedOption.dataset.unvan) {
        unvanInput.value = selectedOption.dataset.unvan;
    } else {
        unvanInput.value = '';
    }
}

// Fotoğraf önizleme
function handleFotografSecimi() {
    const input = document.getElementById('fotograflar');
    const onizlemeDiv = document.getElementById('fotografOnizleme');
    
    fotograflar = Array.from(input.files);
    onizlemeDiv.innerHTML = '';

    fotograflar.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position: relative; width: 100px; height: 100px;';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border: 2px solid #ddd; border-radius: 5px;';
            
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '✕';
            removeBtn.style.cssText = 'position: absolute; top: -5px; right: -5px; width: 20px; height: 20px; border-radius: 50%; background: red; color: white; border: none; cursor: pointer; font-size: 12px;';
            removeBtn.onclick = () => {
                fotograflar.splice(index, 1);
                handleFotografSecimi();
            };
            
            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            onizlemeDiv.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
    });
}

// Yapım teknikleri listesi (güncellenmiş - 8 adet)
const YAPIM_TEKNIKLERI = [
    'Çelik',
    'Betonarme Karkas',
    'Yığma Kagir',
    'Yığma Yarı Kagir',
    'Ahşap',
    'Taş Duvarlı (Çamur Harçlı)',
    'Kerpiç',
    'Diğer Basit Binalar'
];

// Yıpranma payları cache (veritabanından yüklenecek)
let yipranmaPayiCache = {};

// Yapı sınıfı için mevcut grupları yükle
function loadYapiGruplari(birimFiyatId, yapiSinifi, callback) {
    const fiyatId = parseInt(birimFiyatId);
    const sinif = parseInt(yapiSinifi);
    
    const cacheKey = `${fiyatId}_${sinif}`;
    
    // Cache'de var mı kontrol et
    if (yapiGrupCache[cacheKey]) {
        callback(null, yapiGrupCache[cacheKey]);
        return;
    }
    
    // Veritabanından çek
    db.all(`SELECT DISTINCT d.yapiGrubu, d.birimFiyat 
            FROM birimFiyatDetay d
            WHERE d.birimFiyatId = ? AND d.yapiSinifi = ? AND d.aktif = 1
            ORDER BY d.yapiGrubu`, 
        [fiyatId, sinif], (err, rows) => {
            if (err) {
                console.error('⚠️ Veritabanı hatası:', err.message);
                callback(err, null);
                return;
            }
            
            if (!rows || rows.length === 0) {
                console.warn(`⚠️ Birim fiyat ID ${fiyatId}, ${sinif}. Sınıf için grup bulunamadı`);
                callback(null, []);
                return;
            }
            
            // Cache'e ekle
            yapiGrupCache[cacheKey] = rows;
            callback(null, rows);
        }
    );
}

// Yapı grubu dropdown'unu doldur
function populateYapiGruplari() {
    const birimFiyatId = document.getElementById('hesapYili').value; // artık bu birimFiyatId
    const yapiSinifi = document.getElementById('yapiSinifi').value;
    const yapiGrubuSelect = document.getElementById('yapiGrubu');
    
    // Reset
    yapiGrubuSelect.innerHTML = '<option value="">Seçiniz...</option>';
    yapiGrubuSelect.disabled = true;
    document.getElementById('birimFiyat').value = '';
    
    if (!birimFiyatId || !yapiSinifi) {
        yapiGrubuSelect.innerHTML = '<option value="">Önce dönem ve sınıf seçin...</option>';
        return;
    }
    
    loadYapiGruplari(birimFiyatId, yapiSinifi, (err, gruplar) => {
        if (err || !gruplar || gruplar.length === 0) {
            yapiGrubuSelect.innerHTML = '<option value="">Bu sınıf için grup bulunamadı</option>';
            console.warn(`⚠️ Birim fiyat ID ${birimFiyatId}, ${yapiSinifi}. Sınıf için yapı grubu yok`);
            return;
        }
        
        // Dropdown'u doldur
        yapiGrubuSelect.disabled = false;
        gruplar.forEach(grup => {
            const option = document.createElement('option');
            option.value = grup.yapiGrubu;
            option.textContent = `${grup.yapiGrubu} Grubu (${formatFiyat(grup.birimFiyat)} TL/m²)`;
            option.dataset.fiyat = grup.birimFiyat;
            yapiGrubuSelect.appendChild(option);
        });
        
        console.log(`✅ ${gruplar.length} yapı grubu yüklendi`);
    });
}

// Fiyat formatla (helper)
function formatFiyat(fiyat) {
    return parseFloat(fiyat).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Birim fiyatı getir ve otomatik doldur
function updateBirimFiyat() {
    const yapiGrubuSelect = document.getElementById('yapiGrubu');
    const birimFiyatInput = document.getElementById('birimFiyat');
    
    const selectedOption = yapiGrubuSelect.options[yapiGrubuSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.fiyat) {
        const fiyat = parseFloat(selectedOption.dataset.fiyat);
        birimFiyatInput.value = fiyat;
        console.log(`✅ Birim fiyat otomatik dolduruldu: ${fiyat} TL/m²`);
    } else {
        birimFiyatInput.value = '';
    }
}

// Resmi Gazete bilgilerini doldur
function updateResmiGazeteBilgileri() {
    const hesapYili = document.getElementById('hesapYili').value;
    
    if (!hesapYili) return;
    
    const yil = parseInt(hesapYili);
    
    db.get(`SELECT resmiGazeteTarih, resmiGazeteSayili FROM birimFiyatlar WHERE yil = ? AND aktif = 1`, 
        [yil], (err, row) => {
            if (!err && row) {
                if (row.resmiGazeteTarih) {
                    document.getElementById('resmiGazeteTarih').value = row.resmiGazeteTarih;
                }
                if (row.resmiGazeteSayili) {
                    document.getElementById('resmiGazeteSayili').value = row.resmiGazeteSayili;
                }
                console.log(`✅ Resmi Gazete bilgileri dolduruldu`);
            }
        }
    );
}

// Yıpranma paylarını veritabanından yükle
function loadYipranmaPaylari(callback) {
    db.all(`SELECT * FROM yipranmaPaylari WHERE aktif = 1`, [], (err, rows) => {
        if (err) {
            console.error('Yıpranma payları yüklenemedi:', err);
            callback(err, null);
            return;
        }
        
        // Cache'e al
        yipranmaPayiCache = {};
        rows.forEach(row => {
            if (!yipranmaPayiCache[row.yapimTeknigi]) {
                yipranmaPayiCache[row.yapimTeknigi] = [];
            }
            yipranmaPayiCache[row.yapimTeknigi].push({
                minYas: row.minYas,
                maxYas: row.maxYas,
                oran: row.yipranmaOrani
            });
        });
        
        // Her teknik için yaş aralıklarını sırala
        Object.keys(yipranmaPayiCache).forEach(teknik => {
            yipranmaPayiCache[teknik].sort((a, b) => a.minYas - b.minYas);
        });
        
        console.log('✅ Yıpranma payları yüklendi:', Object.keys(yipranmaPayiCache).length, 'yapım tekniği');
        callback(null, yipranmaPayiCache);
    });
}

// Yıpranma payını hesapla (veritabanından)
function hesaplaYipranmaPay(yapimTeknigi, yapiYasi) {
    const tablo = yipranmaPayiCache[yapimTeknigi];
    if (!tablo || tablo.length === 0) {
        console.warn(`⚠️ ${yapimTeknigi} için yıpranma payı tablosu bulunamadı`);
        return 0;
    }
    
    const yas = parseInt(yapiYasi);
    for (let i = 0; i < tablo.length; i++) {
        if (yas >= tablo[i].minYas && yas <= tablo[i].maxYas) {
            return tablo[i].oran;
        }
    }
    
    // Eğer yaş aralığı bulunamazsa, en son aralığın oranını döndür
    return tablo[tablo.length - 1].oran;
}

// Yapı yaşı veya yapım tekniği değiştiğinde yıpranma payını otomatik hesapla
function updateYipranmaPay() {
    const yapimTeknigi = document.getElementById('yapimTeknigi').value;
    const yapiYasi = document.getElementById('yapiYasi').value;
    
    if (yapimTeknigi && yapiYasi) {
        const yipranmaPay = hesaplaYipranmaPay(yapimTeknigi, yapiYasi);
        document.getElementById('yipranmaPay').value = yipranmaPay;
    }
}

// Tab Navigation
let currentTab = 0;
const tabs = ['genel', 'arsa', 'yapi'];

function showTab(tabName) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Tüm tab butonlarının active sınıfını kaldır
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçili tab'ı göster
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Current tab index'i güncelle
    currentTab = tabs.indexOf(tabName);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextTab() {
    if (currentTab < tabs.length - 1) {
        // Mevcut tab'ı tamamlandı olarak işaretle
        document.querySelector(`[data-tab="${tabs[currentTab]}"]`).classList.add('completed');
        
        // Bir sonraki tab'a geç
        currentTab++;
        showTab(tabs[currentTab]);
    }
}

function prevTab() {
    if (currentTab > 0) {
        currentTab--;
        showTab(tabs[currentTab]);
    }
}

// Tab butonlarına click event'i ekle
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', (e) => {
        e.preventDefault(); // Form submit'i engelle
        e.stopPropagation();
        const tabName = button.getAttribute('data-tab');
        showTab(tabName);
    });
});

// Navigation butonlarına event listener ekle
document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        nextTab();
    });
});

document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        prevTab();
    });
});

// İkinci window.onload kaldırıldı - birinci ile birleştirildi

// Form gönderildiğinde raporu kaydet
const form = document.getElementById('form');
const saveButton = document.querySelector('.save-button');

// Form submit event'i
form.addEventListener('submit', (event) => {
    event.preventDefault(); // Formun varsayılan davranışını engelle
    handleFormSubmit();
});

// Save button click event'i
saveButton.addEventListener('click', (event) => {
    event.preventDefault();
    handleFormSubmit();
});

// Form submit fonksiyonu
function handleFormSubmit() {
    
    console.log('Form submit edildi');

    const raporTarihi = document.getElementById('raporTarihi').value;

    // Rapor tarihi kontrolü
    if (!raporTarihi) {
        alert("Rapor Tarihi alanı zorunludur.");
        return;
    }
    
    // Yapı kontrolü
    if (yapilar.length === 0) {
        alert("En az bir yapı eklemelisiniz!");
        return;
    }
    
    console.log('Rapor kaydediliyor...');

    // Diğer verileri al
    const resmiYaziTarihi = document.getElementById('resmiYaziTarihi').value;
    const resmiYaziSayisi = [
        document.getElementById('resmiYaziSayisi1')?.value || '',
        document.getElementById('resmiYaziSayisi2')?.value || '',
        document.getElementById('resmiYaziSayisi3')?.value || '',
        document.getElementById('resmiYaziSayisi4')?.value || ''
    ].filter(v => v.trim() !== '').join('-');
    const ilgiliKurum = document.getElementById('ilgiliKurum').value;
    const birimFiyatId = document.getElementById('hesapYili').value;
    
    // Raportör bilgilerini topla
    const raportorSayisi = parseInt(document.getElementById('raportorSayisi').value) || 1;
    let raportorListesi = [];
    for (let i = 1; i <= raportorSayisi; i++) {
        const raportorSecimiElement = document.getElementById(`raportorSecimi${i}`);
        const unvanElement = document.getElementById(`raportorUnvani${i}`);
        
        let adi = '';
        let unvani = '';
        
        if (raportorSecimiElement && raportorSecimiElement.value) {
            const selectedOption = raportorSecimiElement.options[raportorSecimiElement.selectedIndex];
            adi = selectedOption.textContent || '';
            unvani = unvanElement ? unvanElement.value : '';
        } else {
            const adiElement = document.getElementById(`raportorAdi${i}`);
            if (adiElement) {
                adi = adiElement.value;
                unvani = unvanElement ? unvanElement.value : '';
            }
        }
        
        if (adi && unvani) {
            raportorListesi.push({adi, unvani});
        }
    }
    const raportorAdi = raportorListesi.map(r => r.adi).join(', ');
    const raportorUnvani = raportorListesi.map(r => r.unvani).join(', ');
    
    // Arsa bilgileri
    const ili = 'Samsun';
    const ilce = document.getElementById('ilce').value;
    const mahalle = document.getElementById('mahalle').value;
    const ada = document.getElementById('ada').value;
    const parsel = document.getElementById('parsel').value;
    const yuzolcumu = document.getElementById('yuzolcumu').value || '';
    const malik = document.getElementById('malik').value || '';
    
    const asgariLevazimHesapla = document.getElementById('asgariLevazimHesapla').checked;
    
    // Yapı bilgilerini topla
    let yapilarData = [];
    let toplamYapiBedeli = 0;
    
    yapilar.forEach(yapi => {
        const yapiNo = document.getElementById(`yapiNo_${yapi.id}`).value;
        const yapiAdi = document.getElementById(`yapiAdi_${yapi.id}`).value;
        const yapiYasi = document.getElementById(`yapiYasi_${yapi.id}`).value;
        const yapiSinifi = document.getElementById(`yapiSinifi_${yapi.id}`).value;
        const yapiGrubu = document.getElementById(`yapiGrubu_${yapi.id}`).value;
        const yapimTeknigi = document.getElementById(`yapimTeknigi_${yapi.id}`).value;
        const yapiAlani = document.getElementById(`yapiAlani_${yapi.id}`).value;
        const birimFiyat = document.getElementById(`birimFiyat_${yapi.id}`).value;
        const eksikImalatOrani = document.getElementById(`eksikImalatOrani_${yapi.id}`).value;
        const yipranmaPay = document.getElementById(`yipranmaPay_${yapi.id}`).value;
        
        // Yapı bedelini hesapla
        const yapiBedeli = parseFloat(yapiAlani) * parseFloat(birimFiyat) * 
                           (1 - parseFloat(yipranmaPay) / 100) * 
                           (1 - parseFloat(eksikImalatOrani) / 100);
        
        toplamYapiBedeli += yapiBedeli;
        
        yapilarData.push({
            yapiNo,
            yapiAdi,
            yapiYasi,
            yapiSinifi,
            yapiGrubu,
            yapimTeknigi,
            yapiAlani,
            birimFiyat,
            eksikImalatOrani,
            yipranmaPay,
            yapiBedeli: yapiBedeli.toFixed(2)
        });
    });
    
    // Yapıları JSON olarak sakla
    const yapilarJSON = JSON.stringify(yapilarData);

    // Resmi Gazete bilgilerini birimFiyatId'den çek
    db.get(`SELECT resmiGazeteTarih, resmiGazeteSayili, yil FROM birimFiyatlar WHERE id = ?`, [birimFiyatId], (err, rgRow) => {
        const resmiGazeteTarih = rgRow ? rgRow.resmiGazeteTarih : '';
        const resmiGazeteSayili = rgRow ? rgRow.resmiGazeteSayili : '';
        const hesapYili = rgRow ? rgRow.yil : '';

        // Veritabanına kaydet - eski tek yapı alanları yerine yapilarJSON kullan
        console.log('Veritabanına kayıt yapılıyor...');
        db.run(`INSERT INTO raporlar (raporTarihi, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili, ili, ilce, mahalle, ada, parsel, yuzolcumu, malik, yapiBedeli, resmiGazeteTarih, resmiGazeteSayili, raportorAdi, raportorUnvani, asgariLevazimHesapla, yapilarJSON) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [raporTarihi, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili, ili, ilce, mahalle, ada, parsel, yuzolcumu, malik, toplamYapiBedeli.toFixed(2), resmiGazeteTarih, resmiGazeteSayili, raportorAdi, raportorUnvani, asgariLevazimHesapla ? 1 : 0, yapilarJSON], 
        function(err) {
            if (err) {
                console.error('Veritabanı hatası:', err.message);
                alert('Rapor kaydedilirken hata oluştu: ' + err.message);
                return;
            }
            console.log(`Rapor kaydedildi, ID: ${this.lastID}`);
            alert(`✅ Rapor başarıyla kaydedildi!\n\nRapor ID: ${this.lastID}`);
            
            // Sayfayı yenile
            console.log('Sayfa yenileniyor...');
            window.location.reload();
        });
    });
}

// Hesapla butonu - Tüm yapıların bedelini hesapla
const hesaplaButton = document.querySelector('.hesapla-button');
hesaplaButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (yapilar.length === 0) {
        alert('Lütfen en az bir yapı ekleyin!');
        return;
    }
    
    let toplamYapiBedeli = 0;
    let hesaplamaDetaylari = '';
    
    // Her yapı için hesaplama yap
    yapilar.forEach(yapi => {
        const yapiAlani = parseFloat(document.getElementById(`yapiAlani_${yapi.id}`).value);
        const birimFiyat = parseFloat(document.getElementById(`birimFiyat_${yapi.id}`).value);
        const yipranmaPay = parseFloat(document.getElementById(`yipranmaPay_${yapi.id}`).value) || 0;
        const eksikImalatOrani = parseFloat(document.getElementById(`eksikImalatOrani_${yapi.id}`).value) || 0;
        const yapiAdi = document.getElementById(`yapiAdi_${yapi.id}`).value || `Yapı ${yapi.yapiNo}`;
        
        if (!yapiAlani || !birimFiyat) {
            alert(`Yapı ${yapi.yapiNo} için Yapı Alanı ve Birim Fiyat alanlarını doldurun!`);
            return;
        }
        
        // Yapı bedelini hesapla
        const yapiBedeli = yapiAlani * birimFiyat * 
                           (1 - yipranmaPay / 100) * 
                           (1 - eksikImalatOrani / 100);
        
        toplamYapiBedeli += yapiBedeli;
        
        // Sonucu ilgili yapının alanına yaz
        document.getElementById(`yapiBedeliHesaplanan_${yapi.id}`).value = 
            yapiBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL';
        
        hesaplamaDetaylari += `${yapiAdi}: ${yapiBedeli.toFixed(2)} TL\n`;
    });
    
    // Levazım bedelini hesapla
    const levazimBedeli = toplamYapiBedeli * 0.7 * 0.75;
    
    alert(`Hesaplama Tamamlandı!\n\n${hesaplamaDetaylari}\nToplam Yapı Bedeli: ${toplamYapiBedeli.toFixed(2)} TL\nAsgari Levazım Bedeli: ${levazimBedeli.toFixed(2)} TL`);
});

// Formu temizle
const clearButton = document.querySelector('.clear-button');
clearButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Formdaki tüm veriler silinecek. Emin misiniz?')) {
        // Genel bilgiler ve arsa bilgileri temizle
        document.querySelectorAll('#tab-genel input[type="text"], #tab-genel input[type="date"], #tab-genel select').forEach(input => {
            if (!input.readOnly && input.id !== 'raportorSayisi') {
                input.value = '';
            }
        });
        
        document.querySelectorAll('#tab-arsa input[type="text"], #tab-arsa select').forEach(input => {
            input.value = '';
        });
        
        // Varsayılan değerler
        document.getElementById('raportorSayisi').value = '1';
        
        // Fotoğraflar
        fotograflar = [];
        document.getElementById('fotograflar').value = '';
        document.getElementById('fotografOnizleme').innerHTML = '';
        
        // Raportör alanları
        updateRaportorAlanlari();
        
        // Yapıları temizle ve ilk yapıyı ekle
        yapilar = [];
        yapiSayaci = 0;
        document.getElementById('yapiListesiContainer').innerHTML = '';
        yeniYapiEkle();
        
        // İlk tab'a dön
        showTab('genel');
    }
});

// Kayıtlı raporları gösterme
const showReportsButton = document.querySelector('.show-reports-button');
showReportsButton.addEventListener('click', () => {
    ipcRenderer.send('show-reports'); // Ana sürece mesaj gönder
});

// Admin panelini gösterme
const showAdminButton = document.querySelector('.show-admin-button');
showAdminButton.addEventListener('click', () => {
    ipcRenderer.send('show-admin'); // Ana sürece mesaj gönder
});

// ============ ÇOKLU YAPI YÖNETİMİ ============
let yapilar = []; // Tüm yapıları saklar
let yapiSayaci = 0; // Yapı ID'si için sayaç

// Yeni yapı ekle
function yeniYapiEkle() {
    yapiSayaci++;
    const yapiId = yapiSayaci;
    
    const yapi = {
        id: yapiId,
        yapiNo: yapiSayaci, // Default olarak 1'den başlayarak artan
        yapiAdi: '',
        yapiYasi: '',
        yapiSinifi: '',
        yapiGrubu: '',
        yapimTeknigi: '',
        birimFiyat: '',
        yapiAlani: '',
        yipranmaPay: '',
        eksikImalatOrani: ''
    };
    
    yapilar.push(yapi);
    yapiFormOlustur(yapi);
}

// Yapı formu oluştur
function yapiFormOlustur(yapi) {
    const container = document.getElementById('yapiListesiContainer');
    
    const yapiDiv = document.createElement('div');
    yapiDiv.id = `yapi-${yapi.id}`;
    yapiDiv.className = 'yapi-form-container';
    yapiDiv.style.cssText = 'border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #f8f9fa;';
    
    yapiDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="color: #667eea; margin: 0;">🏗️ Yapı ${yapi.yapiNo}</h3>
            ${yapilar.length > 1 ? `<button type="button" onclick="yapiSil(${yapi.id})" style="padding: 8px 16px; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">🗑️ Sil</button>` : ''}
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Yapı No *</label>
                <input type="number" id="yapiNo_${yapi.id}" value="${yapi.yapiNo}" required>
            </div>
            <div class="form-group">
                <label>Yapı Adı *</label>
                <input type="text" id="yapiAdi_${yapi.id}" placeholder="Yapı adı" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Yapı Yaşı *</label>
                <input type="number" id="yapiYasi_${yapi.id}" placeholder="Yıl olarak" required onchange="updateYipranmaPayYapi(${yapi.id})">
            </div>
            <div class="form-group">
                <label>Yapı Sınıfı *</label>
                <select id="yapiSinifi_${yapi.id}" required onchange="populateYapiGruplariYapi(${yapi.id})">
                    <option value="">Seçiniz...</option>
                    <option value="1">1. Sınıf</option>
                    <option value="2">2. Sınıf</option>
                    <option value="3">3. Sınıf</option>
                    <option value="4">4. Sınıf</option>
                    <option value="5">5. Sınıf</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Yapı Grubu *</label>
                <select id="yapiGrubu_${yapi.id}" required disabled onchange="updateBirimFiyatYapi(${yapi.id})">
                    <option value="">Önce yapı sınıfı seçin...</option>
                </select>
            </div>
            <div class="form-group">
                <label>Yapım Tekniği *</label>
                <select id="yapimTeknigi_${yapi.id}" required onchange="updateYipranmaPayYapi(${yapi.id})">
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
        
        <div class="form-row">
            <div class="form-group">
                <label>Birim Fiyat (TL/m²) *</label>
                <input type="number" step="0.01" id="birimFiyat_${yapi.id}" placeholder="Otomatik doldurulacak" required>
            </div>
            <div class="form-group">
                <label>Yapı Alanı (m²) *</label>
                <input type="number" step="0.01" id="yapiAlani_${yapi.id}" placeholder="Örn: 120.50" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Yıpranma Payı (%)</label>
                <input type="number" step="0.01" id="yipranmaPay_${yapi.id}" placeholder="Otomatik hesaplanacak" readonly>
            </div>
            <div class="form-group">
                <label>Eksik İmalat Oranı (%) *</label>
                <input type="number" step="0.01" id="eksikImalatOrani_${yapi.id}" placeholder="Örn: 10" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Hesaplanan Yapı Bedeli (TL)</label>
                <input type="text" id="yapiBedeliHesaplanan_${yapi.id}" placeholder="Hesapla butonuna tıklayın" readonly>
            </div>
            <div class="form-group">
                <!-- Boş alan -->
            </div>
        </div>
    `;
    
    container.appendChild(yapiDiv);
}

// Yapı sil
function yapiSil(yapiId) {
    if (yapilar.length <= 1) {
        alert('En az bir yapı olmalıdır!');
        return;
    }
    
    if (confirm('Bu yapıyı silmek istediğinizden emin misiniz?')) {
        yapilar = yapilar.filter(y => y.id !== yapiId);
        const yapiDiv = document.getElementById(`yapi-${yapiId}`);
        if (yapiDiv) {
            yapiDiv.remove();
        }
        
        // Yapı numaralarını yeniden düzenle
        yapilar.forEach((yapi, index) => {
            yapi.yapiNo = index + 1;
            const yapiNoInput = document.getElementById(`yapiNo_${yapi.id}`);
            if (yapiNoInput) {
                yapiNoInput.value = yapi.yapiNo;
            }
            // Başlığı güncelle
            const yapiDiv = document.getElementById(`yapi-${yapi.id}`);
            if (yapiDiv) {
                const baslik = yapiDiv.querySelector('h3');
                if (baslik) {
                    baslik.textContent = `🏗️ Yapı ${yapi.yapiNo}`;
                }
            }
        });
    }
}

// Yapıya özel yapı grubu doldur
function populateYapiGruplariYapi(yapiId) {
    const birimFiyatId = document.getElementById('hesapYili').value;
    const yapiSinifi = document.getElementById(`yapiSinifi_${yapiId}`).value;
    const yapiGrubuSelect = document.getElementById(`yapiGrubu_${yapiId}`);
    
    yapiGrubuSelect.innerHTML = '<option value="">Seçiniz...</option>';
    yapiGrubuSelect.disabled = true;
    document.getElementById(`birimFiyat_${yapiId}`).value = '';
    
    if (!birimFiyatId || !yapiSinifi) {
        yapiGrubuSelect.innerHTML = '<option value="">Önce dönem ve sınıf seçin...</option>';
        return;
    }
    
    loadYapiGruplari(birimFiyatId, yapiSinifi, (err, gruplar) => {
        if (err || !gruplar || gruplar.length === 0) {
            yapiGrubuSelect.innerHTML = '<option value="">Bu sınıf için grup bulunamadı</option>';
            return;
        }
        
        yapiGrubuSelect.disabled = false;
        gruplar.forEach(grup => {
            const option = document.createElement('option');
            option.value = grup.yapiGrubu;
            option.textContent = `${grup.yapiGrubu} Grubu (${formatFiyat(grup.birimFiyat)} TL/m²)`;
            option.dataset.fiyat = grup.birimFiyat;
            yapiGrubuSelect.appendChild(option);
        });
    });
}

// Yapıya özel birim fiyat güncelle
function updateBirimFiyatYapi(yapiId) {
    const yapiGrubuSelect = document.getElementById(`yapiGrubu_${yapiId}`);
    const birimFiyatInput = document.getElementById(`birimFiyat_${yapiId}`);
    
    const selectedOption = yapiGrubuSelect.options[yapiGrubuSelect.selectedIndex];
    
    if (selectedOption && selectedOption.dataset.fiyat) {
        const fiyat = parseFloat(selectedOption.dataset.fiyat);
        birimFiyatInput.value = fiyat;
    } else {
        birimFiyatInput.value = '';
    }
}

// FORM VERİSİ KAYDETME VE YÜKLEME SİSTEMİ
// Form verilerini sessionStorage'a kaydet
function saveFormData() {
    console.log('Form verileri kaydediliyor...');
    
    try {
        const formData = {
            // Genel Bilgiler
            raporTarihi: document.getElementById('raporTarihi')?.value || '',
            resmiYaziTarihi: document.getElementById('resmiYaziTarihi')?.value || '',
            resmiYaziSayisi1: document.getElementById('resmiYaziSayisi1')?.value || 'E',
            resmiYaziSayisi2: document.getElementById('resmiYaziSayisi2')?.value || '',
            resmiYaziSayisi3: document.getElementById('resmiYaziSayisi3')?.value || '',
            resmiYaziSayisi4: document.getElementById('resmiYaziSayisi4')?.value || '',
            ilgiliKurum: document.getElementById('ilgiliKurum')?.value || '',
            hesapYili: document.getElementById('hesapYili')?.value || '',
            
            // Raportör bilgileri
            raportorSayisi: document.getElementById('raportorSayisi')?.value || '1',
            
            // Arsa Bilgileri
            ilce: document.getElementById('ilce')?.value || '',
            mahalle: document.getElementById('mahalle')?.value || '',
            ada: document.getElementById('ada')?.value || '',
            parsel: document.getElementById('parsel')?.value || '',
            yuzolcumu: document.getElementById('yuzolcumu')?.value || '',
            malik: document.getElementById('malik')?.value || '',
            
            // Asgari levazım
            asgariLevazimHesapla: document.getElementById('asgariLevazimHesapla')?.checked || false,
            
            // Yapı bilgileri - çoklu yapı desteği
            yapilar: []
        };
        
        // Raportör bilgilerini kaydet
        const raportorSayisi = parseInt(formData.raportorSayisi);
        formData.raportor = [];
        for (let i = 1; i <= raportorSayisi; i++) {
            const raportorSecimi = document.getElementById(`raportorSecimi${i}`)?.value || '';
            const raportorUnvani = document.getElementById(`raportorUnvani${i}`)?.value || '';
            if (raportorSecimi || raportorUnvani) {
                formData.raportor.push({ secim: raportorSecimi, unvan: raportorUnvani });
            }
        }
        
        // Yapı bilgilerini kaydet
        const yapiListesi = document.querySelectorAll('.yapi-form-card');
        yapiListesi.forEach((yapiCard) => {
            const yapiId = yapiCard.dataset.yapiId;
            const yapiData = {
                yapiNo: document.getElementById(`yapiNo_${yapiId}`)?.value || '',
                yapiAdi: document.getElementById(`yapiAdi_${yapiId}`)?.value || '',
                yapiYasi: document.getElementById(`yapiYasi_${yapiId}`)?.value || '',
                yapiSinifi: document.getElementById(`yapiSinifi_${yapiId}`)?.value || '',
                yapiGrubu: document.getElementById(`yapiGrubu_${yapiId}`)?.value || '',
                yapimTeknigi: document.getElementById(`yapimTeknigi_${yapiId}`)?.value || '',
                yapiAlani: document.getElementById(`yapiAlani_${yapiId}`)?.value || '',
                birimFiyat: document.getElementById(`birimFiyat_${yapiId}`)?.value || '',
                yipranmaPay: document.getElementById(`yipranmaPay_${yapiId}`)?.value || '',
                eksikImalatOrani: document.getElementById(`eksikImalatOrani_${yapiId}`)?.value || ''
            };
            formData.yapilar.push(yapiData);
        });
        
        sessionStorage.setItem('yapiBedeliFormData', JSON.stringify(formData));
        console.log('✅ Form verileri kaydedildi');
    } catch (error) {
        console.error('Form verileri kaydedilemedi:', error);
    }
}

// Form verilerini sessionStorage'dan yükle
function loadFormData() {
    console.log('Form verileri yükleniyor...');
    
    try {
        const savedData = sessionStorage.getItem('yapiBedeliFormData');
        if (!savedData) {
            console.log('Kaydedilmiş form verisi bulunamadı');
            return;
        }
        
        const formData = JSON.parse(savedData);
        
        // Genel Bilgiler
        if (formData.raporTarihi) document.getElementById('raporTarihi').value = formData.raporTarihi;
        if (formData.resmiYaziTarihi) document.getElementById('resmiYaziTarihi').value = formData.resmiYaziTarihi;
        if (formData.resmiYaziSayisi1) document.getElementById('resmiYaziSayisi1').value = formData.resmiYaziSayisi1;
        if (formData.resmiYaziSayisi2) document.getElementById('resmiYaziSayisi2').value = formData.resmiYaziSayisi2;
        if (formData.resmiYaziSayisi3) document.getElementById('resmiYaziSayisi3').value = formData.resmiYaziSayisi3;
        if (formData.resmiYaziSayisi4) document.getElementById('resmiYaziSayisi4').value = formData.resmiYaziSayisi4;
        if (formData.ilgiliKurum) document.getElementById('ilgiliKurum').value = formData.ilgiliKurum;
        if (formData.hesapYili) document.getElementById('hesapYili').value = formData.hesapYili;
        
        // Raportör sayısı
        if (formData.raportorSayisi) {
            document.getElementById('raportorSayisi').value = formData.raportorSayisi;
            updateRaportorAlanlari();
            
            // Raportör bilgilerini yükle
            setTimeout(() => {
                if (formData.raportor) {
                    formData.raportor.forEach((raportor, index) => {
                        const i = index + 1;
                        if (raportor.secim) document.getElementById(`raportorSecimi${i}`).value = raportor.secim;
                        if (raportor.unvan) document.getElementById(`raportorUnvani${i}`).value = raportor.unvan;
                    });
                }
            }, 500);
        }
        
        // Arsa Bilgileri
        if (formData.ilce) document.getElementById('ilce').value = formData.ilce;
        if (formData.mahalle) document.getElementById('mahalle').value = formData.mahalle;
        if (formData.ada) document.getElementById('ada').value = formData.ada;
        if (formData.parsel) document.getElementById('parsel').value = formData.parsel;
        if (formData.yuzolcumu) document.getElementById('yuzolcumu').value = formData.yuzolcumu;
        if (formData.malik) document.getElementById('malik').value = formData.malik;
        
        // Asgari levazım
        if (formData.asgariLevazimHesapla !== undefined) {
            document.getElementById('asgariLevazimHesapla').checked = formData.asgariLevazimHesapla;
        }
        
        // Yapı bilgilerini yükle - çoklu yapı desteği
        if (formData.yapilar && formData.yapilar.length > 0) {
            // Önce mevcut yapıları temizle
            const yapiListContainer = document.getElementById('yapiListesi');
            yapiListContainer.innerHTML = '';
            yapilar = [];
            
            // Kaydedilmiş yapıları ekle
            formData.yapilar.forEach((yapiData, index) => {
                const yapiId = Date.now() + index;
                yapilar.push(yapiId);
                
                const yapiCard = yapiFormOlustur(yapiId, index + 1);
                yapiListContainer.appendChild(yapiCard);
                
                // Yapı verilerini doldur
                setTimeout(() => {
                    if (yapiData.yapiNo) document.getElementById(`yapiNo_${yapiId}`).value = yapiData.yapiNo;
                    if (yapiData.yapiAdi) document.getElementById(`yapiAdi_${yapiId}`).value = yapiData.yapiAdi;
                    if (yapiData.yapiYasi) document.getElementById(`yapiYasi_${yapiId}`).value = yapiData.yapiYasi;
                    if (yapiData.yapiSinifi) document.getElementById(`yapiSinifi_${yapiId}`).value = yapiData.yapiSinifi;
                    if (yapiData.yapiGrubu) document.getElementById(`yapiGrubu_${yapiId}`).value = yapiData.yapiGrubu;
                    if (yapiData.yapimTeknigi) document.getElementById(`yapimTeknigi_${yapiId}`).value = yapiData.yapimTeknigi;
                    if (yapiData.yapiAlani) document.getElementById(`yapiAlani_${yapiId}`).value = yapiData.yapiAlani;
                    if (yapiData.birimFiyat) document.getElementById(`birimFiyat_${yapiId}`).value = yapiData.birimFiyat;
                    if (yapiData.yipranmaPay) document.getElementById(`yipranmaPay_${yapiId}`).value = yapiData.yipranmaPay;
                    if (yapiData.eksikImalatOrani) document.getElementById(`eksikImalatOrani_${yapiId}`).value = yapiData.eksikImalatOrani;
                }, 300);
            });
        }
        
        console.log('✅ Form verileri yüklendi');
    } catch (error) {
        console.error('Form verileri yüklenemedi:', error);
    }
}

// Yapıya özel yıpranma payı güncelle
function updateYipranmaPayYapi(yapiId) {
    const yapimTeknigi = document.getElementById(`yapimTeknigi_${yapiId}`).value;
    const yapiYasi = document.getElementById(`yapiYasi_${yapiId}`).value;
    
    if (yapimTeknigi && yapiYasi) {
        const yipranmaPay = hesaplaYipranmaPay(yapimTeknigi, yapiYasi);
        document.getElementById(`yipranmaPay_${yapiId}`).value = yipranmaPay;
    }
}

// Yapı ekle butonuna event listener
document.addEventListener('DOMContentLoaded', () => {
    const yapiEkleBtn = document.getElementById('yapiEkleBtn');
    if (yapiEkleBtn) {
        yapiEkleBtn.addEventListener('click', yeniYapiEkle);
    }
    
    // İlk yapıyı otomatik ekle
    yeniYapiEkle();
});
