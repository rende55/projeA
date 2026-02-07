const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getDbPath } = require('../../../shared/scripts/db-helper');

// Veritabanı bağlantısı
const dbPath = getDbPath();
let db = new sqlite3.Database(dbPath);

// Global değişkenler
let currentRaporId = null;
let currentRaporData = null;
let isModified = false;
let undoStack = [];
let redoStack = [];
let previewWindow = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    console.log('📝 Editör yükleniyor...');
    
    // URL'den rapor ID'sini al
    const urlParams = new URLSearchParams(window.location.search);
    currentRaporId = urlParams.get('id');
    
    if (currentRaporId) {
        document.getElementById('raporId').textContent = currentRaporId;
        raporuYukle(currentRaporId);
    } else {
        document.getElementById('loadingOverlay').classList.add('hidden');
        document.getElementById('editorContent').innerHTML = '<p style="text-align:center; color:#dc3545;">⚠️ Rapor ID bulunamadı!</p>';
    }
    
    // Klavye kısayolları
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Değişiklik takibi
    document.getElementById('editorContent').addEventListener('input', () => {
        setModified(true);
        saveToUndoStack();
    });
});

// Klavye kısayolları
function handleKeyboardShortcuts(e) {
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

// Raporu veritabanından yükle
function raporuYukle(raporId) {
    db.get(`SELECT * FROM raporlar WHERE id = ?`, [raporId], (err, row) => {
        if (err) {
            console.error('Rapor yükleme hatası:', err);
            document.getElementById('loadingOverlay').classList.add('hidden');
            document.getElementById('editorContent').innerHTML = '<p style="text-align:center; color:#dc3545;">❌ Rapor yüklenirken hata oluştu!</p>';
            return;
        }
        
        if (!row) {
            document.getElementById('loadingOverlay').classList.add('hidden');
            document.getElementById('editorContent').innerHTML = '<p style="text-align:center; color:#dc3545;">⚠️ Rapor bulunamadı!</p>';
            return;
        }
        
        currentRaporData = row;
        raporIceriginiOlustur(row);
        document.getElementById('loadingOverlay').classList.add('hidden');
        
        // İlk durumu undo stack'e kaydet
        saveToUndoStack();
    });
}

// Rapor içeriğini editör formatında oluştur
function raporIceriginiOlustur(rapor) {
    // Yapı verilerini parse et
    let yapilar = [];
    if (rapor.yapilarJSON) {
        try {
            yapilar = JSON.parse(rapor.yapilarJSON);
        } catch (e) {
            yapilar = [{
                yapiNo: rapor.yapiNo || '1',
                yapiAdi: rapor.yapiAdi || '',
                yapiYasi: rapor.yapiYasi || '',
                yapiSinifi: rapor.yapiSinifi || '',
                yapiGrubu: rapor.yapiGrubu || '',
                yapimTeknigi: rapor.yapimTeknigi || '',
                yapiAlani: rapor.yapiAlani || '',
                birimFiyat: rapor.birimFiyat || '',
                eksikImalatOrani: rapor.eksikImalatOrani || '',
                yipranmaPay: rapor.yipranmaPay || '',
                yapiBedeli: rapor.yapiBedeli || '0'
            }];
        }
    }
    
    // Hesaplamalar
    const toplamYapiBedeli = parseFloat(rapor.yapiBedeli) || 0;
    const levazimBedeli = toplamYapiBedeli * 0.7 * 0.75;
    const asgariLevazimHesapla = rapor.asgariLevazimHesapla === 1 || rapor.asgariLevazimHesapla === '1';
    
    // Raportör bilgileri
    const raportorAdlari = (rapor.raportorAdi || '').split(',').map(s => s.trim()).filter(s => s);
    const raportorUnvanlari = (rapor.raportorUnvani || '').split(',').map(s => s.trim()).filter(s => s);
    
    // Tarihi formatla
    const raporTarihi = formatTarih(rapor.raporTarihi);
    const resmiYaziTarihi = formatTarih(rapor.resmiYaziTarihi);
    
    // Yapılar tablosu HTML'i - Word Generator ile senkron (sınıf + grup birleşik)
    let yapilarTablosuHTML = '';
    yapilar.forEach((yapi, index) => {
        // Yapı sınıfı + grup birleştir (örn: "5 A")
        const yapiSinifiGrup = [yapi.yapiSinifi, yapi.yapiGrubu].filter(s => s).join(' ');
        yapilarTablosuHTML += `
            <tr>
                <td contenteditable="true" data-field="yapiNo_${index}">${yapi.yapiNo || (index + 1)}</td>
                <td contenteditable="true" data-field="yapiAdi_${index}">${yapi.yapiAdi || ''}</td>
                <td contenteditable="true" data-field="yapiSinifi_${index}">${yapiSinifiGrup}</td>
                <td contenteditable="true" data-field="birimFiyat_${index}">${formatPara(yapi.birimFiyat)} TL</td>
                <td contenteditable="true" data-field="yapiAlani_${index}">${parseFloat(yapi.yapiAlani || 0).toFixed(2)}</td>
                <td contenteditable="true" data-field="yapiYasi_${index}">${yapi.yapiYasi || ''}</td>
                <td contenteditable="true" data-field="yapimTeknigi_${index}">${yapi.yapimTeknigi || ''}</td>
                <td contenteditable="true" data-field="yipranmaPay_${index}">${yapi.yipranmaPay || '0'}%</td>
                <td contenteditable="true" data-field="eksikImalat_${index}">${yapi.eksikImalatOrani || '0'}%</td>
                <td contenteditable="true" data-field="yapiBedeli_${index}">${formatPara(yapi.yapiBedeli)} TL</td>
            </tr>
        `;
    });
    
    // İmza alanları
    let imzaAlanlariHTML = '';
    for (let i = 0; i < Math.max(raportorAdlari.length, 1); i++) {
        imzaAlanlariHTML += `
            <div class="signature-block">
                <div class="name" contenteditable="true" data-field="raportorAdi_${i}">${raportorAdlari[i] || 'Raportör Adı'}</div>
                <div class="title" contenteditable="true" data-field="raportorUnvani_${i}">${raportorUnvanlari[i] || 'Unvan'}</div>
            </div>
        `;
    }
    
    // Editör içeriği - Word Generator ile senkron
    const editorHTML = `
        <!-- Başlık -->
        <div class="editable-section">
            <span class="section-label">Rapor Başlığı</span>
            <div class="editable-field title" contenteditable="true" data-field="baslik">KIYMET TAKDİR RAPORU</div>
        </div>
        
        <!-- Gerekçe -->
        <div class="editable-section">
            <span class="section-label">Gerekçe Başlığı</span>
            <div class="editable-field heading" contenteditable="true" data-field="gerekceBaslik">Gerekçe:</div>
        </div>
        
        <div class="editable-section">
            <span class="section-label">Gerekçe Metni</span>
            <div class="editable-field paragraph" contenteditable="true" data-field="gerekceMetni">
                Bu rapor, ${rapor.ilgiliKurum || ''} ${resmiYaziTarihi} tarih ${rapor.resmiYaziSayisi || ''} sayılı yazısına istinaden hazırlanmıştır.
            </div>
        </div>
        
        <div class="editable-section">
            <span class="section-label">Açıklama Metni</span>
            <div class="editable-field paragraph" contenteditable="true" data-field="aciklamaMetni">
                ${asgariLevazimHesapla 
                    ? `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile ${rapor.hesapYili || ''} yılı fiyatlarına göre yapı bedeli ve Asgari Levazım Bedeli aşağıdaki şekilde hesaplanmıştır:`
                    : `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile ${rapor.hesapYili || ''} yılı fiyatlarına göre yapı bedeli aşağıdaki şekilde hesaplanmıştır:`}
            </div>
        </div>
        
        <!-- Taşınmaz Bilgileri -->
        <div class="editable-section">
            <span class="section-label">Taşınmaz Bilgileri Başlığı</span>
            <div class="editable-field heading" contenteditable="true" data-field="tasinmazBaslik">Taşınmaz Bilgileri:</div>
        </div>
        
        <table class="editor-table">
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
        
        <!-- Yapı Bilgileri -->
        <div class="editable-section">
            <span class="section-label">Yapı Bilgileri Başlığı</span>
            <div class="editable-field heading" contenteditable="true" data-field="yapiBaslik">Yapı Bilgileri ve Hesaplamalar:</div>
        </div>
        
        <table class="editor-table">
            <thead>
                <tr>
                    <th>Y. NO</th>
                    <th>YAPI ADI</th>
                    <th>YAPI SINIFI</th>
                    <th>${rapor.hesapYili || ''} YILI BİRİM FİYATI</th>
                    <th>YAPI ALANI</th>
                    <th>YAPI YAŞI</th>
                    <th>YAPIM TEKNİĞİ</th>
                    <th>YIPR PAYI</th>
                    <th>EKS. İM.</th>
                    <th>YAPI BEDELİ</th>
                </tr>
            </thead>
            <tbody id="yapilarTbody">
                ${yapilarTablosuHTML}
            </tbody>
        </table>
        
        <!-- Toplam -->
        <div class="editable-section" style="margin-top: 20px;">
            <span class="section-label">Toplam Yapı Bedeli</span>
            <div class="editable-field heading" contenteditable="true" data-field="toplamBedel">
                TOPLAM YAPI BEDELİ: ${formatPara(toplamYapiBedeli)} TL
            </div>
        </div>
        
        <div class="editable-section">
            <span class="section-label">Yapı Bedeli Yazıyla</span>
            <div class="editable-field paragraph" contenteditable="true" data-field="toplamYaziyla">
                Yalnız ${sayiyiYaziyaCevir(toplamYapiBedeli)} Türk Lirasıdır.
            </div>
        </div>
        
        ${asgariLevazimHesapla ? `
        <div class="editable-section">
            <span class="section-label">Asgari Levazım Bedeli</span>
            <div class="editable-field heading" contenteditable="true" data-field="levazimBedeli">
                TOPLAM ASGARİ LEVAZIM BEDELİ (Toplam Bedel x 0,7 x 0,75) : ${formatPara(levazimBedeli)} TL
            </div>
        </div>
        
        <div class="editable-section">
            <span class="section-label">Levazım Bedeli Yazıyla</span>
            <div class="editable-field paragraph" contenteditable="true" data-field="levazimYaziyla">
                Yalnız ${sayiyiYaziyaCevir(levazimBedeli)} Türk Lirasıdır.
            </div>
        </div>
        ` : ''}
        
        <!-- Son Paragraf -->
        <div class="editable-section">
            <span class="section-label">Son Paragraf</span>
            <div class="editable-field paragraph" contenteditable="true" data-field="sonParagraf" style="text-align: justify;">
                ${asgariLevazimHesapla
                    ? `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(rapor.resmiGazeteTarih)} tarih ve ${rapor.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${rapor.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ ve 2015/1 sayılı Milli Emlak Genelgesi esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir.`
                    : `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(rapor.resmiGazeteTarih)} tarih ve ${rapor.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${rapor.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir.`}
            </div>
        </div>
        
        <!-- Tarih -->
        <div class="editable-section" style="margin-top: 20px;">
            <span class="section-label">Rapor Tarihi</span>
            <div class="editable-field" contenteditable="true" data-field="raporTarihi">
                ${raporTarihi}
            </div>
        </div>
        
        <!-- İmza Alanları -->
        <div class="signature-area">
            ${imzaAlanlariHTML}
        </div>
    `;
    
    document.getElementById('editorContent').innerHTML = editorHTML;
}

// Para formatla - Türkçe format (nokta basamak ayracı, virgül kuruş ayracı)
function formatPara(deger) {
    const sayi = parseFloat(deger) || 0;
    // Önce sayıyı 2 ondalık basamakla formatla
    const parts = sayi.toFixed(2).split('.');
    // Tam kısmı nokta ile ayır
    const tamKisim = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Kuruş kısmını virgül ile ekle
    return tamKisim + ',' + parts[1];
}

// Tarih formatla
function formatTarih(tarih) {
    if (!tarih) return '';
    const d = new Date(tarih);
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const yil = d.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

// Sayıyı yazıya çevir
function sayiyiYaziyaCevir(sayi) {
    if (!sayi || isNaN(sayi)) return '';
    
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

// Değişiklik durumunu ayarla
function setModified(modified) {
    isModified = modified;
    const status = document.getElementById('editorStatus');
    if (modified) {
        status.textContent = '● Değişiklikler kaydedilmedi';
        status.className = 'editor-status modified';
    } else {
        status.textContent = '✓ Kaydedildi';
        status.className = 'editor-status saved';
    }
}

// Undo stack'e kaydet
function saveToUndoStack() {
    const content = document.getElementById('editorContent').innerHTML;
    undoStack.push(content);
    if (undoStack.length > 50) undoStack.shift(); // Max 50 adım
    redoStack = []; // Yeni değişiklik yapıldığında redo temizlenir
}

// Geri al
function geriAl() {
    if (undoStack.length > 1) {
        const current = undoStack.pop();
        redoStack.push(current);
        document.getElementById('editorContent').innerHTML = undoStack[undoStack.length - 1];
        setModified(true);
    }
}

// Yinele
function yinele() {
    if (redoStack.length > 0) {
        const content = redoStack.pop();
        undoStack.push(content);
        document.getElementById('editorContent').innerHTML = content;
        setModified(true);
    }
}

// Kes
function kes() {
    document.execCommand('cut');
}

// Kopyala
function kopyala() {
    document.execCommand('copy');
}

// Yapıştır
function yapistir() {
    document.execCommand('paste');
}

// Tümünü seç
function tumunuSec() {
    document.execCommand('selectAll');
}

// Kaydet
function kaydet() {
    if (!currentRaporId) {
        alert('⚠️ Rapor ID bulunamadı!');
        return;
    }
    
    // Editörden verileri topla
    const editorContent = document.getElementById('editorContent');
    
    // Basit alanları güncelle
    const guncelVeri = {
        ili: getFieldValue('ili'),
        ilce: getFieldValue('ilce'),
        mahalle: getFieldValue('mahalle'),
        malik: getFieldValue('malik')
    };
    
    // Veritabanını güncelle
    db.run(`UPDATE raporlar SET ili = ?, ilce = ?, mahalle = ?, malik = ? WHERE id = ?`,
        [guncelVeri.ili, guncelVeri.ilce, guncelVeri.mahalle, guncelVeri.malik, currentRaporId],
        (err) => {
            if (err) {
                console.error('Kaydetme hatası:', err);
                alert('❌ Kaydetme hatası: ' + err.message);
                return;
            }
            
            setModified(false);
            alert('✅ Değişiklikler kaydedildi!');
        }
    );
}

// Alan değerini al
function getFieldValue(fieldName) {
    const element = document.querySelector(`[data-field="${fieldName}"]`);
    return element ? element.textContent.trim() : '';
}

// Ön izleme aç
function onIzlemeAc() {
    const editorContent = document.getElementById('editorContent').innerHTML;
    
    // IPC ile ön izleme penceresini aç
    ipcRenderer.send('open-preview', {
        raporId: currentRaporId,
        content: editorContent
    });
}

// Word olarak indir
function wordOlarakIndir() {
    if (!currentRaporId || !currentRaporData) {
        alert('⚠️ Rapor verisi bulunamadı!');
        return;
    }
    
    // IPC ile Word export isteği gönder
    ipcRenderer.send('export-word', {
        raporId: currentRaporId,
        raporData: currentRaporData
    });
}

// Yazdır
function yazdir() {
    window.print();
}

// Kapat
function kapat() {
    if (isModified) {
        const cevap = confirm('⚠️ Kaydedilmemiş değişiklikler var!\n\nKaydetmeden çıkmak istiyor musunuz?');
        if (!cevap) return;
    }
    window.close();
}

// IPC mesajlarını dinle
ipcRenderer.on('word-export-success', (event, filePath) => {
    alert(`✅ Word dosyası kaydedildi:\n${filePath}`);
});

ipcRenderer.on('word-export-error', (event, error) => {
    alert(`❌ Word export hatası:\n${error}`);
});

// Pencere kapatılmadan önce uyarı
window.addEventListener('beforeunload', (e) => {
    if (isModified) {
        e.preventDefault();
        e.returnValue = '';
    }
});
