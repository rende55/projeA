/**
 * Editor Sayfa Modülü - Yeniden Tasarlanmış
 * Tek elden rapor yönetimi: düzenleme, fotoğraf, Word export
 */

const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı bağlantısı
const dbPath = path.join(__dirname, '..', '..', '..', 'raporlar.db');
let db = null;

// Navigation referansı
let nav = null;

// Global değişkenler
let currentRaporId = null;
let currentRaporData = null;
let isModified = false;
let fotograflar = []; // Fotoğraf listesi

/**
 * Sayfa yüklendiğinde çağrılır
 */
async function onLoad(container, data, navigation) {
    console.log('📝 Editor sayfası yükleniyor...', data);
    nav = navigation;
    
    // Veritabanı bağlantısı
    db = new sqlite3.Database(dbPath);
    
    // Rapor ID'sini al
    if (data && data.raporId) {
        currentRaporId = data.raporId;
        document.getElementById('ed-raporId').textContent = currentRaporId;
        
        // Raporu yükle
        await loadRapor(currentRaporId);
    }
    
    // Event listener'ları kur
    setupEventListeners();
    
    // Loading'i gizle
    const loadingOverlay = document.getElementById('ed-loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
    
    console.log('✅ Editor sayfası yüklendi');
}

/**
 * Sayfa kapatılırken çağrılır
 */
async function onUnload() {
    console.log('🔄 Editor sayfası kapatılıyor...');
    if (db) {
        db.close();
        db = null;
    }
}

/**
 * Kaydedilmemiş değişiklik var mı?
 */
function hasUnsavedChanges() {
    return isModified;
}

/**
 * Event listener'ları kur
 */
function setupEventListeners() {
    // Toolbar butonları
    document.getElementById('ed-geriAlBtn')?.addEventListener('click', geriAl);
    document.getElementById('ed-yineleBtn')?.addEventListener('click', yinele);
    document.getElementById('ed-kesBtn')?.addEventListener('click', kes);
    document.getElementById('ed-kopyalaBtn')?.addEventListener('click', kopyala);
    document.getElementById('ed-yapistirBtn')?.addEventListener('click', yapistir);
    document.getElementById('ed-tumunuSecBtn')?.addEventListener('click', tumunuSec);
    document.getElementById('ed-onIzlemeBtn')?.addEventListener('click', onIzlemeAc);
    
    // Footer butonları
    document.getElementById('ed-kaydetBtn')?.addEventListener('click', kaydet);
    document.getElementById('ed-onIzlemeBtn2')?.addEventListener('click', onIzlemeAc);
    document.getElementById('ed-wordBtn')?.addEventListener('click', wordOlarakIndir);
    document.getElementById('ed-yazdirBtn')?.addEventListener('click', yazdir);
    document.getElementById('ed-kapatBtn')?.addEventListener('click', kapat);
    
    // Klavye kısayolları
    document.addEventListener('keydown', handleKeyboard);
    
    // IPC mesajlarını dinle
    ipcRenderer.on('word-export-success', (event, filePath) => {
        if (window.showNotification) {
            window.showNotification(`Word dosyası kaydedildi: ${filePath}`, 'success');
        }
    });
    
    ipcRenderer.on('word-export-error', (event, error) => {
        if (window.showNotification) {
            window.showNotification(`Word export hatası: ${error}`, 'error');
        }
    });
}

/**
 * Klavye kısayolları
 */
function handleKeyboard(e) {
    if (e.ctrlKey) {
        switch(e.key.toLowerCase()) {
            case 's':
                e.preventDefault();
                kaydet();
                break;
            case 'z':
                e.preventDefault();
                geriAl();
                break;
            case 'y':
                e.preventDefault();
                yinele();
                break;
            case 'p':
                e.preventDefault();
                onIzlemeAc();
                break;
        }
    }
}

/**
 * Raporu yükle
 */
function loadRapor(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM raporlar WHERE id = ?`, [id], (err, row) => {
            if (err) {
                console.error('Rapor yüklenemedi:', err);
                reject(err);
                return;
            }
            
            if (!row) {
                console.error('Rapor bulunamadı');
                reject(new Error('Rapor bulunamadı'));
                return;
            }
            
            currentRaporData = row;
            
            // Fotoğrafları yükle
            fotograflar = [];
            if (row.fotograflarJSON) {
                try {
                    fotograflar = JSON.parse(row.fotograflarJSON);
                    console.log(`📷 ${fotograflar.length} fotoğraf yüklendi`);
                } catch (e) {
                    console.error('Fotoğraf parse hatası:', e);
                }
            }
            
            renderRaporIcerigi(row);
            resolve();
        });
    });
}

/**
 * Rapor içeriğini render et - Düzenlenebilir alanlarla
 */
function renderRaporIcerigi(rapor) {
    const container = document.getElementById('ed-editorContent');
    if (!container) return;
    
    // Yapıları parse et
    let yapilar = [];
    try {
        if (rapor.yapilarJSON) {
            yapilar = JSON.parse(rapor.yapilarJSON);
        }
    } catch (e) {
        console.error('Yapılar parse edilemedi:', e);
    }
    
    // Toplam yapı bedeli hesapla
    let toplamYapiBedeli = 0;
    yapilar.forEach(yapi => {
        toplamYapiBedeli += parseFloat(yapi.yapiBedeli) || 0;
    });
    
    // Levazım bedeli
    const asgariLevazimHesapla = rapor.asgariLevazimHesapla === 1;
    const levazimBedeli = asgariLevazimHesapla ? toplamYapiBedeli * 0.7 * 0.75 : 0;
    
    // HTML oluştur
    container.innerHTML = `
        <!-- Başlık -->
        <div class="ed-editable-section">
            <div class="ed-editable-field title" contenteditable="true">KIYMET TAKDİR RAPORU</div>
        </div>
        
        <!-- Gerekçe -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Gerekçe</span>
            <div class="ed-editable-field heading" contenteditable="true">Gerekçe:</div>
            <div class="ed-editable-field paragraph" contenteditable="true" data-field="gerekceMetni">
                Bu rapor, <span class="ed-inline-edit" data-field="ilgiliKurum" contenteditable="true">${rapor.ilgiliKurum || ''}</span> 
                <span class="ed-inline-edit" data-field="resmiYaziTarihi" contenteditable="true">${formatTarih(rapor.resmiYaziTarihi)}</span> tarih 
                <span class="ed-inline-edit" data-field="resmiYaziSayisi" contenteditable="true">${rapor.resmiYaziSayisi || ''}</span> sayılı yazısına istinaden hazırlanmıştır.
            </div>
        </div>
        
        <!-- Açıklama -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Açıklama</span>
            <div class="ed-editable-field paragraph" contenteditable="true">
                ${asgariLevazimHesapla 
                    ? `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile <span class="ed-inline-edit" data-field="hesapYili" contenteditable="true">${rapor.hesapYili || ''}</span> yılı fiyatlarına göre yapı bedeli ve Asgari Levazım Bedeli aşağıdaki şekilde hesaplanmıştır:`
                    : `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile <span class="ed-inline-edit" data-field="hesapYili" contenteditable="true">${rapor.hesapYili || ''}</span> yılı fiyatlarına göre yapı bedeli aşağıdaki şekilde hesaplanmıştır:`}
            </div>
        </div>
        
        <!-- Taşınmaz Bilgileri -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Taşınmaz Bilgileri (Düzenlenebilir)</span>
            <table class="ed-editor-table">
                <thead>
                    <tr>
                        <th>İL</th>
                        <th>İLÇE</th>
                        <th>MAHALLE</th>
                        <th>ADA</th>
                        <th>PARSEL</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td contenteditable="true" data-field="ili">${rapor.ili || 'Samsun'}</td>
                        <td contenteditable="true" data-field="ilce">${rapor.ilce || ''}</td>
                        <td contenteditable="true" data-field="mahalle">${rapor.mahalle || ''}</td>
                        <td contenteditable="true" data-field="ada">${rapor.ada || ''}</td>
                        <td contenteditable="true" data-field="parsel">${rapor.parsel || ''}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <!-- Yapı Bilgileri -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Yapı Bilgileri (Düzenlenebilir - Değişiklikler otomatik hesaplanır)</span>
            <table class="ed-editor-table" id="ed-yapilarTable">
                <thead>
                    <tr>
                        <th>NO</th>
                        <th>YAPI ADI</th>
                        <th>SINIF</th>
                        <th>BİRİM FİYAT (TL)</th>
                        <th>ALAN (m²)</th>
                        <th>YAŞ</th>
                        <th>TEKNİK</th>
                        <th>YIPR %</th>
                        <th>EKS %</th>
                        <th>BEDELİ (TL)</th>
                    </tr>
                </thead>
                <tbody id="ed-yapilarTbody">
                    ${yapilar.map((yapi, index) => {
                        const yapiSinifiGrup = [yapi.yapiSinifi, yapi.yapiGrubu].filter(s => s).join(' ');
                        return `
                            <tr data-yapi-index="${index}">
                                <td contenteditable="true" data-field="yapiNo">${yapi.yapiNo || ''}</td>
                                <td contenteditable="true" data-field="yapiAdi">${yapi.yapiAdi || ''}</td>
                                <td contenteditable="true" data-field="yapiSinifi">${yapiSinifiGrup}</td>
                                <td contenteditable="true" data-field="birimFiyat" class="ed-numeric">${formatPara(yapi.birimFiyat)}</td>
                                <td contenteditable="true" data-field="yapiAlani" class="ed-numeric">${parseFloat(yapi.yapiAlani || 0).toFixed(2)}</td>
                                <td contenteditable="true" data-field="yapiYasi">${yapi.yapiYasi || ''}</td>
                                <td contenteditable="true" data-field="yapimTeknigi">${yapi.yapimTeknigi || ''}</td>
                                <td contenteditable="true" data-field="yipranmaPay" class="ed-numeric">${yapi.yipranmaPay || '0'}</td>
                                <td contenteditable="true" data-field="eksikImalatOrani" class="ed-numeric">${yapi.eksikImalatOrani || '0'}</td>
                                <td data-field="yapiBedeli" class="ed-calculated">${formatPara(yapi.yapiBedeli)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            <div style="margin-top: 10px;">
                <button type="button" id="ed-yeniYapiBtn" class="ed-add-btn">➕ Yeni Yapı Ekle</button>
                <button type="button" id="ed-hesaplaBtn" class="ed-calc-btn">🧮 Yeniden Hesapla</button>
            </div>
        </div>
        
        <!-- Toplam Bedel -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Toplam Bedel</span>
            <div class="ed-editable-field heading">
                TOPLAM YAPI BEDELİ: <span id="ed-toplamBedel" class="ed-calculated-value">${formatPara(toplamYapiBedeli)}</span> TL
            </div>
            <div class="ed-editable-field paragraph">
                Yalnız <span id="ed-toplamYaziyla">${sayiyiYaziyaCevir(toplamYapiBedeli)}</span> Türk Lirasıdır.
            </div>
        </div>
        
        ${asgariLevazimHesapla ? `
        <!-- Asgari Levazım Bedeli -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Asgari Levazım Bedeli</span>
            <div class="ed-editable-field heading">
                TOPLAM ASGARİ LEVAZIM BEDELİ (Toplam Bedel x 0,7 x 0,75) : <span id="ed-levazimBedel" class="ed-calculated-value">${formatPara(levazimBedeli)}</span> TL
            </div>
            <div class="ed-editable-field paragraph">
                Yalnız <span id="ed-levazimYaziyla">${sayiyiYaziyaCevir(levazimBedeli)}</span> Türk Lirasıdır.
            </div>
        </div>
        ` : ''}
        
        <!-- Son Paragraf -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Son Paragraf</span>
            <div class="ed-editable-field paragraph" contenteditable="true">
                ${asgariLevazimHesapla
                    ? `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(rapor.resmiGazeteTarih)} tarih ve ${rapor.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${rapor.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ ve 2015/1 sayılı Milli Emlak Genelgesi esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir.`
                    : `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(rapor.resmiGazeteTarih)} tarih ve ${rapor.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${rapor.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir.`}
            </div>
        </div>
        
        <!-- Rapor Tarihi -->
        <div class="ed-editable-section">
            <span class="ed-section-label">Rapor Tarihi</span>
            <div class="ed-editable-field" contenteditable="true" data-field="raporTarihi" style="text-align: center;">
                ${formatTarih(rapor.raporTarihi)}
            </div>
        </div>
        
        <!-- İmza Alanları -->
        <div class="ed-signature-area">
            ${renderImzacilar(rapor)}
        </div>
        
        <!-- Fotoğraflar Bölümü -->
        <div class="ed-editable-section ed-photos-section">
            <span class="ed-section-label">📷 Fotoğraflar</span>
            <div class="ed-photos-toolbar">
                <input type="file" id="ed-fotografEkle" accept="image/*" multiple style="display: none;">
                <button type="button" id="ed-fotografEkleBtn" class="ed-add-btn">📷 Fotoğraf Ekle</button>
                <span class="ed-photo-count">${fotograflar.length} fotoğraf</span>
            </div>
            <div id="ed-fotograflarContainer" class="ed-photos-grid">
                ${renderFotograflar()}
            </div>
        </div>
    `;
    
    // Event listener'ları ekle
    setupContentEventListeners();
}

/**
 * İçerik event listener'ları
 */
function setupContentEventListeners() {
    // Değişiklik takibi
    const editorContent = document.getElementById('ed-editorContent');
    if (editorContent) {
        editorContent.addEventListener('input', () => {
            isModified = true;
            updateStatus();
        });
    }
    
    // Yeni yapı ekle butonu
    document.getElementById('ed-yeniYapiBtn')?.addEventListener('click', yeniYapiEkle);
    
    // Hesapla butonu
    document.getElementById('ed-hesaplaBtn')?.addEventListener('click', yenidenHesapla);
    
    // Fotoğraf ekle butonu
    document.getElementById('ed-fotografEkleBtn')?.addEventListener('click', () => {
        document.getElementById('ed-fotografEkle')?.click();
    });
    
    // Fotoğraf input değişikliği
    document.getElementById('ed-fotografEkle')?.addEventListener('change', fotografEkle);
    
    // Yapı tablosu değişiklik takibi
    const yapilarTbody = document.getElementById('ed-yapilarTbody');
    if (yapilarTbody) {
        yapilarTbody.addEventListener('input', (e) => {
            const cell = e.target.closest('td');
            if (cell && cell.classList.contains('ed-numeric')) {
                // Sayısal alan değişti, hesapla
                const row = cell.closest('tr');
                if (row) {
                    hesaplaSatir(row);
                }
            }
        });
    }
}

/**
 * İmzacıları render et
 */
function renderImzacilar(rapor) {
    const adlar = (rapor.raportorAdi || '').split(',').map(s => s.trim()).filter(s => s);
    const unvanlar = (rapor.raportorUnvani || '').split(',').map(s => s.trim()).filter(s => s);
    
    let html = '';
    for (let i = 0; i < Math.max(adlar.length, 1); i++) {
        html += `
            <div class="ed-signature-block">
                <div class="name" contenteditable="true" data-field="raportorAdi_${i}">${adlar[i] || ''}</div>
                <div class="title" contenteditable="true" data-field="raportorUnvani_${i}">${unvanlar[i] || ''}</div>
            </div>
        `;
    }
    
    return html;
}

/**
 * Fotoğrafları render et
 */
function renderFotograflar() {
    if (fotograflar.length === 0) {
        return '<p class="ed-no-photos">Henüz fotoğraf eklenmedi. Word raporunda fotoğraf sayfası oluşturulmayacak.</p>';
    }
    
    return fotograflar.map((foto, index) => `
        <div class="ed-photo-card" data-index="${index}">
            <img src="${foto.data}" alt="${foto.name || 'Fotoğraf'}">
            <div class="ed-photo-info">
                <span class="ed-photo-orientation">${foto.isLandscape ? '🖼️ Yatay' : '📷 Dikey'}</span>
                <input type="text" class="ed-photo-desc" placeholder="Açıklama" value="${foto.aciklama || ''}" 
                    onchange="window.editorPage.fotografAciklamaGuncelle(${index}, this.value)">
            </div>
            <button type="button" class="ed-photo-delete" onclick="window.editorPage.fotografSil(${index})">×</button>
        </div>
    `).join('');
}

/**
 * Fotoğraf ekle
 */
function fotografEkle(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    fotograflar.push({
                        name: file.name,
                        data: event.target.result,
                        width: img.width,
                        height: img.height,
                        isLandscape: img.width >= img.height,
                        aciklama: ''
                    });
                    fotograflariGuncelle();
                    isModified = true;
                    updateStatus();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Input'u temizle
    e.target.value = '';
}

/**
 * Fotoğraf sil
 */
function fotografSil(index) {
    if (confirm('Bu fotoğrafı silmek istediğinize emin misiniz?')) {
        fotograflar.splice(index, 1);
        fotograflariGuncelle();
        isModified = true;
        updateStatus();
    }
}

/**
 * Fotoğraf açıklaması güncelle
 */
function fotografAciklamaGuncelle(index, aciklama) {
    if (fotograflar[index]) {
        fotograflar[index].aciklama = aciklama;
        isModified = true;
        updateStatus();
    }
}

/**
 * Fotoğrafları güncelle
 */
function fotograflariGuncelle() {
    const container = document.getElementById('ed-fotograflarContainer');
    if (container) {
        container.innerHTML = renderFotograflar();
    }
    
    const countEl = document.querySelector('.ed-photo-count');
    if (countEl) {
        countEl.textContent = `${fotograflar.length} fotoğraf`;
    }
}

/**
 * Yeni yapı ekle
 */
function yeniYapiEkle() {
    const tbody = document.getElementById('ed-yapilarTbody');
    if (!tbody) return;
    
    const rowCount = tbody.querySelectorAll('tr').length;
    const newIndex = rowCount;
    
    const newRow = document.createElement('tr');
    newRow.dataset.yapiIndex = newIndex;
    newRow.innerHTML = `
        <td contenteditable="true" data-field="yapiNo">${newIndex + 1}</td>
        <td contenteditable="true" data-field="yapiAdi"></td>
        <td contenteditable="true" data-field="yapiSinifi"></td>
        <td contenteditable="true" data-field="birimFiyat" class="ed-numeric">0,00</td>
        <td contenteditable="true" data-field="yapiAlani" class="ed-numeric">0,00</td>
        <td contenteditable="true" data-field="yapiYasi"></td>
        <td contenteditable="true" data-field="yapimTeknigi"></td>
        <td contenteditable="true" data-field="yipranmaPay" class="ed-numeric">0</td>
        <td contenteditable="true" data-field="eksikImalatOrani" class="ed-numeric">0</td>
        <td data-field="yapiBedeli" class="ed-calculated">0,00</td>
    `;
    
    tbody.appendChild(newRow);
    isModified = true;
    updateStatus();
}

/**
 * Satır hesapla
 */
function hesaplaSatir(row) {
    const birimFiyatCell = row.querySelector('[data-field="birimFiyat"]');
    const alanCell = row.querySelector('[data-field="yapiAlani"]');
    const yipranmaCell = row.querySelector('[data-field="yipranmaPay"]');
    const eksikCell = row.querySelector('[data-field="eksikImalatOrani"]');
    const bedelCell = row.querySelector('[data-field="yapiBedeli"]');
    
    if (!birimFiyatCell || !alanCell || !bedelCell) return;
    
    const birimFiyat = parseParaTR(birimFiyatCell.textContent);
    const alan = parseFloat(alanCell.textContent.replace(',', '.')) || 0;
    const yipranma = parseFloat(yipranmaCell?.textContent) || 0;
    const eksik = parseFloat(eksikCell?.textContent) || 0;
    
    let bedel = birimFiyat * alan;
    bedel = bedel * (1 - yipranma / 100);
    bedel = bedel * (1 - eksik / 100);
    
    bedelCell.textContent = formatPara(bedel);
    
    // Toplamları güncelle
    guncelleToplamlar();
}

/**
 * Yeniden hesapla
 */
function yenidenHesapla() {
    const rows = document.querySelectorAll('#ed-yapilarTbody tr');
    rows.forEach(row => hesaplaSatir(row));
    
    if (window.showNotification) {
        window.showNotification('Hesaplama tamamlandı', 'success');
    }
}

/**
 * Toplamları güncelle
 */
function guncelleToplamlar() {
    const rows = document.querySelectorAll('#ed-yapilarTbody tr');
    let toplam = 0;
    
    rows.forEach(row => {
        const bedelCell = row.querySelector('[data-field="yapiBedeli"]');
        if (bedelCell) {
            toplam += parseParaTR(bedelCell.textContent);
        }
    });
    
    // Toplam bedeli güncelle
    const toplamEl = document.getElementById('ed-toplamBedel');
    if (toplamEl) {
        toplamEl.textContent = formatPara(toplam);
    }
    
    // Yazıyla güncelle
    const yaziEl = document.getElementById('ed-toplamYaziyla');
    if (yaziEl) {
        yaziEl.textContent = sayiyiYaziyaCevir(toplam);
    }
    
    // Levazım bedeli güncelle
    const levazimEl = document.getElementById('ed-levazimBedel');
    if (levazimEl) {
        const levazim = toplam * 0.7 * 0.75;
        levazimEl.textContent = formatPara(levazim);
        
        const levazimYaziEl = document.getElementById('ed-levazimYaziyla');
        if (levazimYaziEl) {
            levazimYaziEl.textContent = sayiyiYaziyaCevir(levazim);
        }
    }
}

/**
 * Tarih formatla
 */
function formatTarih(tarih) {
    if (!tarih) return '';
    const date = new Date(tarih);
    const gun = String(date.getDate()).padStart(2, '0');
    const ay = String(date.getMonth() + 1).padStart(2, '0');
    const yil = date.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

/**
 * Para formatla - Türkçe format
 */
function formatPara(deger) {
    const sayi = parseFloat(deger) || 0;
    const parts = sayi.toFixed(2).split('.');
    const tamKisim = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return tamKisim + ',' + parts[1];
}

/**
 * Türkçe para formatını sayıya çevir
 */
function parseParaTR(str) {
    if (!str) return 0;
    // Nokta binlik ayracı, virgül ondalık ayracı
    const temiz = str.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
    return parseFloat(temiz) || 0;
}

/**
 * Sayıyı yazıya çevir
 */
function sayiyiYaziyaCevir(sayi) {
    if (!sayi || isNaN(sayi)) return 'sıfır';
    
    const birler = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    
    function ucBasamak(n) {
        let sonuc = '';
        const yuz = Math.floor(n / 100);
        const on = Math.floor((n % 100) / 10);
        const bir = n % 10;
        
        if (yuz === 1) sonuc += 'yüz ';
        else if (yuz > 1) sonuc += birler[yuz] + 'yüz ';
        
        if (on > 0) sonuc += onlar[on] + ' ';
        if (bir > 0) sonuc += birler[bir] + ' ';
        
        return sonuc.trim();
    }
    
    let kalan = Math.floor(sayi);
    if (kalan === 0) return 'sıfır';
    
    let sonuc = '';
    
    if (kalan >= 1000000000) {
        const milyar = Math.floor(kalan / 1000000000);
        sonuc += ucBasamak(milyar) + ' milyar ';
        kalan = kalan % 1000000000;
    }
    
    if (kalan >= 1000000) {
        const milyon = Math.floor(kalan / 1000000);
        sonuc += ucBasamak(milyon) + ' milyon ';
        kalan = kalan % 1000000;
    }
    
    if (kalan >= 1000) {
        const bin = Math.floor(kalan / 1000);
        if (bin === 1) sonuc += 'bin ';
        else sonuc += ucBasamak(bin) + ' bin ';
        kalan = kalan % 1000;
    }
    
    if (kalan > 0) {
        sonuc += ucBasamak(kalan);
    }
    
    return sonuc.trim();
}

/**
 * Durum güncelle
 */
function updateStatus() {
    const status = document.getElementById('ed-editorStatus');
    if (status) {
        if (isModified) {
            status.textContent = '● Değişiklikler kaydedilmedi';
            status.className = 'ed-editor-status modified';
        } else {
            status.textContent = '✓ Kaydedildi';
            status.className = 'ed-editor-status saved';
        }
    }
}

// Toolbar fonksiyonları
function geriAl() { document.execCommand('undo'); }
function yinele() { document.execCommand('redo'); }
function kes() { document.execCommand('cut'); }
function kopyala() { document.execCommand('copy'); }
function yapistir() { document.execCommand('paste'); }
function tumunuSec() { document.execCommand('selectAll'); }

function onIzlemeAc() {
    if (!currentRaporData) return;
    
    const editorContent = document.getElementById('ed-editorContent');
    ipcRenderer.send('open-preview', {
        raporId: currentRaporId,
        htmlContent: editorContent?.innerHTML || '',
        raporData: currentRaporData
    });
}

/**
 * Kaydet - Veritabanına gerçek kaydetme
 */
function kaydet() {
    if (!currentRaporId || !db) {
        if (window.showNotification) {
            window.showNotification('Kaydetme hatası: Rapor ID bulunamadı', 'error');
        }
        return;
    }
    
    // Editörden verileri topla
    const guncelVeri = collectEditorData();
    
    // Veritabanını güncelle
    const sql = `UPDATE raporlar SET 
        ili = ?, ilce = ?, mahalle = ?, ada = ?, parsel = ?,
        ilgiliKurum = ?, resmiYaziSayisi = ?,
        raportorAdi = ?, raportorUnvani = ?,
        yapilarJSON = ?, fotograflarJSON = ?,
        toplamYapiBedeli = ?, yapiBedeli = ?
        WHERE id = ?`;
    
    db.run(sql, [
        guncelVeri.ili,
        guncelVeri.ilce,
        guncelVeri.mahalle,
        guncelVeri.ada,
        guncelVeri.parsel,
        guncelVeri.ilgiliKurum,
        guncelVeri.resmiYaziSayisi,
        guncelVeri.raportorAdi,
        guncelVeri.raportorUnvani,
        JSON.stringify(guncelVeri.yapilar),
        JSON.stringify(fotograflar),
        guncelVeri.toplamYapiBedeli,
        guncelVeri.toplamYapiBedeli.toString()
    , currentRaporId], (err) => {
        if (err) {
            console.error('Kaydetme hatası:', err);
            if (window.showNotification) {
                window.showNotification('Kaydetme hatası: ' + err.message, 'error');
            }
            return;
        }
        
        // currentRaporData'yı güncelle
        currentRaporData = { ...currentRaporData, ...guncelVeri, fotograflarJSON: JSON.stringify(fotograflar) };
        
        isModified = false;
        updateStatus();
        
        if (window.showNotification) {
            window.showNotification('Değişiklikler kaydedildi', 'success');
        }
    });
}

/**
 * Editörden verileri topla
 */
function collectEditorData() {
    // Taşınmaz bilgileri
    const ili = document.querySelector('[data-field="ili"]')?.textContent?.trim() || 'Samsun';
    const ilce = document.querySelector('[data-field="ilce"]')?.textContent?.trim() || '';
    const mahalle = document.querySelector('[data-field="mahalle"]')?.textContent?.trim() || '';
    const ada = document.querySelector('[data-field="ada"]')?.textContent?.trim() || '';
    const parsel = document.querySelector('[data-field="parsel"]')?.textContent?.trim() || '';
    
    // Gerekçe bilgileri
    const ilgiliKurum = document.querySelector('[data-field="ilgiliKurum"]')?.textContent?.trim() || '';
    const resmiYaziSayisi = document.querySelector('[data-field="resmiYaziSayisi"]')?.textContent?.trim() || '';
    
    // Raportör bilgileri
    const raportorAdlari = [];
    const raportorUnvanlari = [];
    document.querySelectorAll('[data-field^="raportorAdi_"]').forEach(el => {
        const ad = el.textContent?.trim();
        if (ad) raportorAdlari.push(ad);
    });
    document.querySelectorAll('[data-field^="raportorUnvani_"]').forEach(el => {
        const unvan = el.textContent?.trim();
        raportorUnvanlari.push(unvan || '');
    });
    
    // Yapı bilgileri
    const yapilar = [];
    let toplamYapiBedeli = 0;
    
    document.querySelectorAll('#ed-yapilarTbody tr').forEach(row => {
        const yapi = {
            yapiNo: row.querySelector('[data-field="yapiNo"]')?.textContent?.trim() || '',
            yapiAdi: row.querySelector('[data-field="yapiAdi"]')?.textContent?.trim() || '',
            yapiSinifi: row.querySelector('[data-field="yapiSinifi"]')?.textContent?.trim() || '',
            yapiGrubu: '',
            birimFiyat: parseParaTR(row.querySelector('[data-field="birimFiyat"]')?.textContent),
            yapiAlani: parseFloat(row.querySelector('[data-field="yapiAlani"]')?.textContent?.replace(',', '.')) || 0,
            yapiYasi: row.querySelector('[data-field="yapiYasi"]')?.textContent?.trim() || '',
            yapimTeknigi: row.querySelector('[data-field="yapimTeknigi"]')?.textContent?.trim() || '',
            yipranmaPay: parseFloat(row.querySelector('[data-field="yipranmaPay"]')?.textContent) || 0,
            eksikImalatOrani: parseFloat(row.querySelector('[data-field="eksikImalatOrani"]')?.textContent) || 0,
            yapiBedeli: parseParaTR(row.querySelector('[data-field="yapiBedeli"]')?.textContent)
        };
        
        yapilar.push(yapi);
        toplamYapiBedeli += yapi.yapiBedeli;
    });
    
    return {
        ili,
        ilce,
        mahalle,
        ada,
        parsel,
        ilgiliKurum,
        resmiYaziSayisi,
        raportorAdi: raportorAdlari.join(', '),
        raportorUnvani: raportorUnvanlari.join(', '),
        yapilar,
        toplamYapiBedeli
    };
}

/**
 * Word olarak indir
 */
function wordOlarakIndir() {
    if (!currentRaporData) {
        if (window.showNotification) {
            window.showNotification('Rapor verisi bulunamadı', 'error');
        }
        return;
    }
    
    // Önce kaydet
    if (isModified) {
        kaydet();
    }
    
    // Güncel verileri topla
    const guncelVeri = collectEditorData();
    
    console.log('📷 Word export - fotograflar dizisi:', fotograflar?.length || 0);
    if (fotograflar && fotograflar.length > 0) {
        console.log('📷 İlk fotoğraf:', {
            name: fotograflar[0].name,
            hasData: !!fotograflar[0].data,
            dataLength: fotograflar[0].data?.substring(0, 50) + '...'
        });
    }
    
    // Rapor verisini güncelle
    const raporData = {
        ...currentRaporData,
        ...guncelVeri,
        yapilarJSON: JSON.stringify(guncelVeri.yapilar),
        yapiBedeli: guncelVeri.toplamYapiBedeli,
        fotograflarJSON: JSON.stringify(fotograflar)
    };
    
    console.log('📷 Gönderilen fotograflarJSON uzunluğu:', raporData.fotograflarJSON?.length || 0);
    
    // IPC ile Word export isteği gönder
    ipcRenderer.send('export-word', {
        raporId: currentRaporId,
        raporData: raporData
    });
    
    if (window.showNotification) {
        window.showNotification('Word raporu oluşturuluyor...', 'info');
    }
}

function yazdir() {
    window.print();
}

function kapat() {
    if (isModified) {
        if (!confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) {
            return;
        }
    }
    nav.goBack();
}

// Global erişim için
window.editorPage = {
    fotografSil,
    fotografAciklamaGuncelle
};

// Export
module.exports = {
    onLoad,
    onUnload,
    hasUnsavedChanges
};
