const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

let db = new sqlite3.Database(path.join(__dirname, 'raporlar.db'));

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
    
    // Hesap dönemlerini yükle
    populateHesapDonemleri();
    
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
    const yapimTeknigiElement = document.getElementById('yapimTeknigi');
    const yapiYasiElement = document.getElementById('yapiYasi');
    const hesapYiliElement = document.getElementById('hesapYili');
    const yapiSinifiElement = document.getElementById('yapiSinifi');
    const yapiGrubuElement = document.getElementById('yapiGrubu');
    const raportorSayisiElement = document.getElementById('raportorSayisi');
    const fotograflarElement = document.getElementById('fotograflar');
    
    if (yapimTeknigiElement) yapimTeknigiElement.addEventListener('change', updateYipranmaPay);
    if (yapiYasiElement) yapiYasiElement.addEventListener('input', updateYipranmaPay);
    if (hesapYiliElement) hesapYiliElement.addEventListener('change', () => { populateYapiGruplari(); });
    if (yapiSinifiElement) yapiSinifiElement.addEventListener('change', () => { populateYapiGruplari(); });
    if (yapiGrubuElement) yapiGrubuElement.addEventListener('change', () => { updateBirimFiyat(); });
    if (raportorSayisiElement) raportorSayisiElement.addEventListener('change', updateRaportorAlanlari);
    if (fotograflarElement) fotograflarElement.addEventListener('change', handleFotografSecimi);
    
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

// Yıpranma payı hesaplama tablosu (Resmi Gazete'ye göre)
const yipranmaPayiTablosu = {
    'Betonarme Karkas': [
        { maxYas: 5, oran: 5 },
        { maxYas: 10, oran: 10 },
        { maxYas: 20, oran: 20 },
        { maxYas: 30, oran: 30 },
        { maxYas: 40, oran: 40 },
        { maxYas: 50, oran: 50 },
        { maxYas: Infinity, oran: 60 }
    ],
    'Yığma Kagir': [
        { maxYas: 5, oran: 10 },
        { maxYas: 10, oran: 20 },
        { maxYas: 20, oran: 30 },
        { maxYas: 30, oran: 40 },
        { maxYas: 40, oran: 50 },
        { maxYas: 50, oran: 60 },
        { maxYas: Infinity, oran: 70 }
    ],
    'Çelik Konstrüksiyon': [
        { maxYas: 5, oran: 5 },
        { maxYas: 10, oran: 10 },
        { maxYas: 20, oran: 20 },
        { maxYas: 30, oran: 30 },
        { maxYas: 40, oran: 40 },
        { maxYas: 50, oran: 50 },
        { maxYas: Infinity, oran: 60 }
    ],
    'Ahşap': [
        { maxYas: 5, oran: 10 },
        { maxYas: 10, oran: 20 },
        { maxYas: 20, oran: 40 },
        { maxYas: 30, oran: 60 },
        { maxYas: 40, oran: 70 },
        { maxYas: Infinity, oran: 80 }
    ]
};

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

// Yıpranma payını hesapla
function hesaplaYipranmaPay(yapimTeknigi, yapiYasi) {
    const tablo = yipranmaPayiTablosu[yapimTeknigi];
    if (!tablo) return 0;
    
    const yas = parseInt(yapiYasi);
    for (let i = 0; i < tablo.length; i++) {
        if (yas <= tablo[i].maxYas) {
            return tablo[i].oran;
        }
    }
    return 0;
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
    const raporNo = document.getElementById('raporNo').value;

    // Rapor tarihi ve rapor no kontrolü
    if (!raporTarihi || !raporNo) {
        alert("Rapor Tarihi ve Rapor No alanları zorunludur.");
        return; // Eğer bu alanlar boşsa işlemi durdur
    }
    
    console.log('Rapor kaydediliyor...');

    // Diğer verileri al
    const resmiYaziTarihi = document.getElementById('resmiYaziTarihi').value;
    const resmiYaziSayisi = document.getElementById('resmiYaziSayisi').value;
    const ilgiliKurum = document.getElementById('ilgiliKurum').value;
    const birimFiyatId = document.getElementById('hesapYili').value; // artık bu birimFiyatId
    
    // Raportör bilgilerini topla
    const raportorSayisi = parseInt(document.getElementById('raportorSayisi').value) || 1;
    let raportorListesi = [];
    for (let i = 1; i <= raportorSayisi; i++) {
        // Yeni sistem: raportorSecimi dropdown'ından seçilen raportörün adını al
        const raportorSecimiElement = document.getElementById(`raportorSecimi${i}`);
        const unvanElement = document.getElementById(`raportorUnvani${i}`);
        
        let adi = '';
        let unvani = '';
        
        if (raportorSecimiElement && raportorSecimiElement.value) {
            // Dropdown'dan seçilen raportörün adını al
            const selectedOption = raportorSecimiElement.options[raportorSecimiElement.selectedIndex];
            adi = selectedOption.textContent || '';
            unvani = unvanElement ? unvanElement.value : '';
        } else {
            // Eski sistem için fallback (eğer dropdown yerine input varsa)
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
    const ili = 'Samsun'; // Sabit değer
    const ilce = document.getElementById('ilce').value;
    const mahalle = document.getElementById('mahalle').value;
    const ada = document.getElementById('ada').value;
    const parsel = document.getElementById('parsel').value;
    const yuzolcumu = document.getElementById('yuzolcumu').value;
    const malik = document.getElementById('malik').value;
    const yapiNo = document.getElementById('yapiNo').value;
    const yapiAdi = document.getElementById('yapiAdi').value;
    const yapiMaliki = document.getElementById('yapiMaliki').value;
    const yapiYasi = document.getElementById('yapiYasi').value;
    const yapiSinifi = document.getElementById('yapiSinifi').value;
    const yapiGrubu = document.getElementById('yapiGrubu').value;
    const yapimTeknigi = document.getElementById('yapimTeknigi').value;
    const yapiAlani = document.getElementById('yapiAlani').value;
    const birimFiyat = document.getElementById('birimFiyat').value;
    const eksikImalatOrani = document.getElementById('eksikImalatOrani').value;
    const yipranmaPay = document.getElementById('yipranmaPay').value;
    const asgariLevazimHesapla = document.getElementById('asgariLevazimHesapla').checked;
    
    // Yapı bedelini hesapla
    const yapiBedeli = parseFloat(yapiAlani) * parseFloat(birimFiyat) * 
                       (1 - parseFloat(yipranmaPay) / 100) * 
                       (1 - parseFloat(eksikImalatOrani) / 100);

    // Fotoğrafları kaydet - ŞİMDİLİK ATLA (daha sonra eklenecek)
    // TODO: Fotoğraf kaydetme özelliği implement edilecek
    let fotografYollari = [];
    /* Fotoğraf kaydetme kısmı şimdilik devre dışı
    if (fotograflar && fotograflar.length > 0) {
        const raporKlasor = path.join(__dirname, 'raporlar_cikti', `Rapor_${raporNo}_${Date.now()}`);
        if (!fs.existsSync(raporKlasor)) {
            fs.mkdirSync(raporKlasor, { recursive: true });
        }
        
        fotograflar.forEach((file, index) => {
            try {
                if (file.path) {
                    const hedefYol = path.join(raporKlasor, `fotograf_${index + 1}${path.extname(file.name)}`);
                    fs.copyFileSync(file.path, hedefYol);
                    fotografYollari.push(hedefYol);
                }
            } catch (err) {
                console.error('Fotoğraf kopyalama hatası:', err);
            }
        });
    }
    */
    const fotograflarJSON = JSON.stringify(fotografYollari);

    // Resmi Gazete bilgilerini birimFiyatId'den çek
    db.get(`SELECT resmiGazeteTarih, resmiGazeteSayili, yil FROM birimFiyatlar WHERE id = ?`, [birimFiyatId], (err, rgRow) => {
        const resmiGazeteTarih = rgRow ? rgRow.resmiGazeteTarih : '';
        const resmiGazeteSayili = rgRow ? rgRow.resmiGazeteSayili : '';
        const hesapYili = rgRow ? rgRow.yil : '';

        // Verileri veritabanına kaydet
        console.log('Veritabanına kayıt yapılıyor...');
        db.run(`INSERT INTO raporlar (raporTarihi, raporNo, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili, ili, ilce, mahalle, ada, parsel, yuzolcumu, malik, yapiNo, yapiAdi, yapiMaliki, yapiYasi, yapiSinifi, yapiGrubu, yapimTeknigi, yapiAlani, birimFiyat, eksikImalatOrani, yipranmaPay, yapiBedeli, resmiGazeteTarih, resmiGazeteSayili, raportorAdi, raportorUnvani, asgariLevazimHesapla) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [raporTarihi, raporNo, resmiYaziTarihi, resmiYaziSayisi, ilgiliKurum, hesapYili, ili, ilce, mahalle, ada, parsel, yuzolcumu, malik, yapiNo, yapiAdi, yapiMaliki, yapiYasi, yapiSinifi, yapiGrubu, yapimTeknigi, yapiAlani, birimFiyat, eksikImalatOrani, yipranmaPay, yapiBedeli.toFixed(2), resmiGazeteTarih, resmiGazeteSayili, raportorAdi, raportorUnvani, asgariLevazimHesapla ? 1 : 0], 
        function(err) {
            if (err) {
                console.error('Veritabanı hatası:', err.message);
                alert('Rapor kaydedilirken hata oluştu: ' + err.message);
                return;
            }
            console.log(`Rapor kaydedildi, ID: ${this.lastID}`);
            alert(`✅ Rapor başarıyla kaydedildi!\n\nRapor No: ${raporNo}\nRapor ID: ${this.lastID}`);
            
            // Sayfayı yenile - bu sayede form temizlenir ve beyaz sayfa sorunu olmaz
            console.log('Sayfa yenileniyor...');
            window.location.reload();
        });
    });
}

// Hesapla butonu - Yapı bedelini hesapla
const hesaplaButton = document.querySelector('.hesapla-button');
hesaplaButton.addEventListener('click', (e) => {
    e.preventDefault(); // Form submit'i engelle
    e.stopPropagation();
    
    const yapiAlani = parseFloat(document.getElementById('yapiAlani').value);
    const birimFiyat = parseFloat(document.getElementById('birimFiyat').value);
    const yipranmaPay = parseFloat(document.getElementById('yipranmaPay').value) || 0;
    const eksikImalatOrani = parseFloat(document.getElementById('eksikImalatOrani').value) || 0;
    
    // Kontrol: Gerekli alanlar dolu mu?
    if (!yapiAlani || !birimFiyat) {
        alert('Lütfen önce Yapı Alanı ve Birim Fiyat alanlarını doldurun!');
        return;
    }
    
    // Yapı bedelini hesapla
    const yapiBedeli = yapiAlani * birimFiyat * 
                       (1 - yipranmaPay / 100) * 
                       (1 - eksikImalatOrani / 100);
    
    // Levazım bedelini hesapla
    const levazimBedeli = yapiBedeli * 0.7 * 0.75;
    
    // Sonuçları göster
    document.getElementById('yapiBedeliHesaplanan').value = yapiBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL';
    document.getElementById('levazimBedeliHesaplanan').value = levazimBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL';
    
    alert(`Hesaplama Tamamlandı!\n\nYapı Bedeli: ${yapiBedeli.toFixed(2)} TL\nAsgari Levazım Bedeli: ${levazimBedeli.toFixed(2)} TL`);
});

// Formu temizle
const clearButton = document.querySelector('.clear-button');
clearButton.addEventListener('click', (e) => {
    e.preventDefault(); // Form submit'i engelle
    e.stopPropagation();
    
    if (confirm('Formdaki tüm veriler silinecek. Emin misiniz?')) {
        // Manuel temizleme
        document.querySelectorAll('input[type="text"], input[type="date"], input[type="number"], select').forEach(input => {
            if (!input.readOnly && input.id !== 'raportorSayisi') {
                input.value = '';
            }
        });
        
        // Varsayılan değerler
        document.getElementById('raportorSayisi').value = '1';
        
        // Fotoğraflar
        fotograflar = [];
        document.getElementById('fotograflar').value = '';
        document.getElementById('fotografOnizleme').innerHTML = '';
        
        // Hesaplanan alanlar
        document.getElementById('yapiBedeliHesaplanan').value = '';
        document.getElementById('levazimBedeliHesaplanan').value = '';
        
        // Yapı grubu reset
        document.getElementById('yapiGrubu').disabled = true;
        document.getElementById('yapiGrubu').innerHTML = '<option value="">Önce yapı sınıfı seçin...</option>';
        
        // Raportör alanları
        updateRaportorAlanlari();
        
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
