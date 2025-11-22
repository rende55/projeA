# Modüller ve Fonksiyon Referansı

## 📋 İçindekiler

- [Modül Listesi](#modül-listesi)
- [main.js](#mainjs)
- [renderer.js](#rendererjs)
- [raporlar.js](#raporlarjs)
- [reportGenerator.js](#reportgeneratorjs)
- [Yardımcı Fonksiyonlar](#yardımcı-fonksiyonlar)

---

## 📦 Modül Listesi

```
kitar/
├── main.js              # Electron ana süreç
├── renderer.js          # Ana form mantığı
├── raporlar.js          # Rapor listesi mantığı
└── reportGenerator.js   # Rapor oluşturma
```

---

## 🚀 main.js

### Açıklama
Electron ana süreç dosyası. Uygulama yaşam döngüsünü yönetir, pencereler oluşturur ve veritabanını başlatır.

### Dependencies

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const remoteMain = require('@electron/remote/main');
```

### Global Değişkenler

```javascript
let mainWindow;  // Ana pencere referansı
let db;          // Veritabanı bağlantısı
```

---

### Fonksiyonlar

#### `createDatabase()`

Veritabanını oluşturur ve tabloları başlatır.

**Parametreler**: Yok

**Dönüş**: `void`

**Kod**:
```javascript
function createDatabase() {
    db = new sqlite3.Database(path.join(__dirname, 'raporlar.db'), (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Veritabanı oluşturuldu.');
    });

    db.run(`CREATE TABLE IF NOT EXISTS raporlar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raporTarihi TEXT,
        raporNo TEXT,
        ...
    )`, (err) => {
        if (err) {
            console.error(err.message);
        }
    });
}
```

**Kullanım**:
```javascript
app.whenReady().then(() => {
    createDatabase();
});
```

---

#### `createWindow()`

Ana uygulama penceresini oluşturur.

**Parametreler**: Yok

**Dönüş**: `void`

**Kod**:
```javascript
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    remoteMain.enable(mainWindow.webContents);
    mainWindow.loadFile('index.html');
}
```

**Özellikler**:
- **Pencere Boyutu**: 1200x800
- **Node Integration**: Aktif
- **Context Isolation**: Devre dışı (⚠️ Güvenlik riski)

---

### Event Handlers

#### `app.whenReady()`

Uygulama hazır olduğunda çalışır.

```javascript
app.whenReady().then(() => {
    createDatabase();
    createWindow();
});
```

#### `app.on('window-all-closed')`

Tüm pencereler kapatıldığında uygulamayı kapatır.

```javascript
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
```

#### `app.on('activate')`

macOS'ta dock'tan tıklandığında pencereyi yeniden açar.

```javascript
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
```

#### `ipcMain.on('show-reports')`

Kayıtlı raporlar penceresini açar.

```javascript
ipcMain.on('show-reports', (event) => {
    const reportsWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    remoteMain.enable(reportsWindow.webContents);
    reportsWindow.loadFile('raporlar.html');
});
```

---

## 🖥️ renderer.js

### Açıklama
Ana form sayfasının (index.html) iş mantığını içerir. Form validasyonu, hesaplamalar, tab navigasyonu ve veritabanı kayıt işlemlerini yönetir.

### Dependencies

```javascript
const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
```

### Global Değişkenler

```javascript
let db = new sqlite3.Database(path.join(__dirname, 'raporlar.db'));
let currentTab = 0;
const tabs = ['genel', 'arsa', 'yapi'];
const samsunIlceleri = ['Atakum', 'Canik', 'İlkadım', ...];
```

---

### Veri Yapıları

#### `yipranmaPayiTablosu`

Resmi Gazete'ye göre yıpranma payı hesaplama tablosu.

```javascript
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
    'Yığma Kagir': [...],
    'Çelik Konstrüksiyon': [...],
    'Ahşap': [...]
};
```

---

### Fonksiyonlar

#### `populateIlceler()`

İlçe seçim kutusunu Samsun ilçeleriyle doldurur.

**Parametreler**: Yok

**Dönüş**: `void`

**Kod**:
```javascript
function populateIlceler() {
    const ilceSelect = document.getElementById('ilce');
    ilceSelect.innerHTML = '';
    ilceSelect.disabled = false;

    samsunIlceleri.forEach(ilce => {
        const option = document.createElement('option');
        option.value = ilce;
        option.textContent = ilce;
        ilceSelect.appendChild(option);
    });
}
```

**Çağrılma**: `window.onload` event'inde

---

#### `hesaplaYipranmaPay(yapimTeknigi, yapiYasi)`

Yapım tekniği ve yapı yaşına göre yıpranma payını hesaplar.

**Parametreler**:
- `yapimTeknigi` (string): Yapım tekniği ('Betonarme Karkas', 'Yığma Kagir', vb.)
- `yapiYasi` (string/number): Yapının yaşı (yıl)

**Dönüş**: `number` - Yıpranma payı yüzdesi

**Kod**:
```javascript
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
```

**Örnek Kullanım**:
```javascript
const yipranma = hesaplaYipranmaPay('Betonarme Karkas', 15);
// Dönüş: 20
```

---

#### `updateYipranmaPay()`

Form alanlarından yapım tekniği ve yapı yaşını alarak yıpranma payını otomatik hesaplar ve form alanına yazar.

**Parametreler**: Yok

**Dönüş**: `void`

**Kod**:
```javascript
function updateYipranmaPay() {
    const yapimTeknigi = document.getElementById('yapimTeknigi').value;
    const yapiYasi = document.getElementById('yapiYasi').value;
    
    if (yapimTeknigi && yapiYasi) {
        const yipranmaPay = hesaplaYipranmaPay(yapimTeknigi, yapiYasi);
        document.getElementById('yipranmaPay').value = yipranmaPay;
    }
}
```

---

#### `showTab(tabName)`

Belirtilen tab'ı gösterir, diğerlerini gizler.

**Parametreler**:
- `tabName` (string): Tab adı ('genel', 'arsa', 'yapi')

**Dönüş**: `void`

**Kod**:
```javascript
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
    
    currentTab = tabs.indexOf(tabName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

---

#### `nextTab()`

Bir sonraki tab'a geçer.

**Parametreler**: Yok

**Dönüş**: `void`

**Kod**:
```javascript
function nextTab() {
    if (currentTab < tabs.length - 1) {
        // Mevcut tab'ı tamamlandı olarak işaretle
        document.querySelector(`[data-tab="${tabs[currentTab]}"]`)
            .classList.add('completed');
        
        currentTab++;
        showTab(tabs[currentTab]);
    }
}
```

---

#### `prevTab()`

Bir önceki tab'a döner.

**Parametreler**: Yok

**Dönüş**: `void`

**Kod**:
```javascript
function prevTab() {
    if (currentTab > 0) {
        currentTab--;
        showTab(tabs[currentTab]);
    }
}
```

---

### Event Listeners

#### Form Submit

```javascript
form.addEventListener('submit', (event) => {
    event.preventDefault();
    
    // Veri toplama
    const raporTarihi = document.getElementById('raporTarihi').value;
    const raporNo = document.getElementById('raporNo').value;
    // ... diğer alanlar
    
    // Validasyon
    if (!raporTarihi || !raporNo) {
        alert("Rapor Tarihi ve Rapor No alanları zorunludur.");
        return;
    }
    
    // Yapı bedeli hesaplama
    const yapiBedeli = parseFloat(yapiAlani) * parseFloat(birimFiyat) * 
                       (1 - parseFloat(yipranmaPay) / 100) * 
                       (1 - parseFloat(eksikImalatOrani) / 100);
    
    // Veritabanına kaydetme
    db.run(`INSERT INTO raporlar (...) VALUES (?, ?, ...)`, 
        [...values...], 
        function(err) {
            if (err) {
                alert('Hata: ' + err.message);
                return;
            }
            alert('Rapor başarıyla kaydedildi!');
            form.reset();
        }
    );
});
```

#### Hesapla Butonu

```javascript
hesaplaButton.addEventListener('click', () => {
    const yapiAlani = parseFloat(document.getElementById('yapiAlani').value);
    const birimFiyat = parseFloat(document.getElementById('birimFiyat').value);
    const yipranmaPay = parseFloat(document.getElementById('yipranmaPay').value) || 0;
    const eksikImalatOrani = parseFloat(document.getElementById('eksikImalatOrani').value) || 0;
    
    if (!yapiAlani || !birimFiyat) {
        alert('Lütfen önce Yapı Alanı ve Birim Fiyat alanlarını doldurun!');
        return;
    }
    
    // Yapı bedeli hesaplama
    const yapiBedeli = yapiAlani * birimFiyat * 
                       (1 - yipranmaPay / 100) * 
                       (1 - eksikImalatOrani / 100);
    
    // Levazım bedeli hesaplama
    const levazimBedeli = yapiBedeli * 0.7 * 0.75;
    
    // Sonuçları gösterme
    document.getElementById('yapiBedeliHesaplanan').value = 
        yapiBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL';
    document.getElementById('levazimBedeliHesaplanan').value = 
        levazimBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL';
    
    alert(`Hesaplama Tamamlandı!\n\nYapı Bedeli: ${yapiBedeli.toFixed(2)} TL\nAsgari Levazım Bedeli: ${levazimBedeli.toFixed(2)} TL`);
});
```

---

## 📋 raporlar.js

### Açıklama
Kayıtlı raporlar sayfasının (raporlar.html) mantığını içerir. Raporları listeler, silme ve Word rapor oluşturma işlemlerini yönetir.

### Dependencies

```javascript
const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateReport } = require('./reportGenerator');
const { dialog } = require('electron').remote || require('@electron/remote');
```

---

### Ana Kod Akışı

#### Raporları Listeleme

```javascript
db.all(`SELECT id, raporTarihi, ilce, mahalle, ada, parsel 
        FROM raporlar`, [], (err, rows) => {
    if (err) throw err;
    
    const tableBody = document.querySelector('#raporlarTable tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        
        // ID kolonu
        const tdId = document.createElement('td');
        tdId.textContent = row.id;
        tr.appendChild(tdId);
        
        // Diğer kolonlar...
        
        // İşlem butonları
        const tdIslemler = document.createElement('td');
        
        // Sil butonu
        const btnSil = createSilButton(row);
        
        // Revize butonu
        const btnRevize = createRevizeButton(row);
        
        // Rapor Oluştur butonu
        const btnHesapla = createRaporButton(row);
        
        tdIslemler.appendChild(btnSil);
        tdIslemler.appendChild(btnRevize);
        tdIslemler.appendChild(btnHesapla);
        tr.appendChild(tdIslemler);
        
        tableBody.appendChild(tr);
    });
});
```

---

### Buton İşlemleri

#### Sil Butonu

```javascript
btnSil.onclick = () => {
    if (confirm(`Bu raporu silmek istediğinize emin misiniz? ID: ${row.id}`)) {
        db.run(`DELETE FROM raporlar WHERE id = ?`, row.id, function(err) {
            if (err) {
                return console.log(err.message);
            }
            console.log(`Rapor silindi, ID: ${row.id}`);
            tr.remove(); // Satırı DOM'dan kaldır
        });
    }
};
```

#### Rapor Oluştur Butonu

```javascript
btnHesapla.onclick = () => {
    // Tam rapor verilerini veritabanından al
    db.get(`SELECT * FROM raporlar WHERE id = ?`, row.id, (err, raporData) => {
        if (err) {
            alert('Rapor verileri alınırken hata oluştu: ' + err.message);
            return;
        }
        
        if (!raporData) {
            alert('Rapor bulunamadı!');
            return;
        }
        
        // Rapor dosyasının kaydedileceği yolu belirle
        const tarih = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const dosyaAdi = `Rapor_${raporData.raporNo || row.id}_${tarih}.docx`;
        const outputPath = path.join(__dirname, 'raporlar_cikti', dosyaAdi);
        
        // raporlar_cikti klasörünü oluştur (yoksa)
        const fs = require('fs');
        const outputDir = path.join(__dirname, 'raporlar_cikti');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir);
        }
        
        // Rapor oluştur
        const result = generateReport(raporData, outputPath);
        
        if (result.success) {
            alert(`Rapor başarıyla oluşturuldu!\n\nDosya: ${dosyaAdi}\n\nKonum: ${outputDir}`);
            
            // Dosyayı aç
            const { shell } = require('electron');
            shell.openPath(outputPath);
        } else {
            alert('Rapor oluşturulurken hata oluştu: ' + result.error);
        }
    });
};
```

---

## 📄 reportGenerator.js

### Açıklama
Word formatında rapor oluşturma modülü. `docx` kütüphanesini kullanarak programatik olarak Word belgesi oluşturur.

### Dependencies

```javascript
const { 
    Document, Paragraph, TextRun, Table, TableRow, TableCell, 
    AlignmentType, WidthType, Packer, BorderStyle 
} = require('docx');
const fs = require('fs');
const path = require('path');
```

---

### Fonksiyonlar

#### `sayiyiYaziyaCevir(sayi)`

Sayıyı Türkçe yazıya çevirir.

**Parametreler**:
- `sayi` (number): Çevrilecek sayı

**Dönüş**: `string` - Türkçe yazı karşılığı

**Kod**:
```javascript
function sayiyiYaziyaCevir(sayi) {
    if (!sayi || isNaN(sayi)) return '';
    
    const birler = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const basamaklar = [
        { deger: 1000000000, isim: 'milyar' },
        { deger: 1000000, isim: 'milyon' },
        { deger: 1000, isim: 'bin' }
    ];
    
    let sonuc = '';
    let kalan = Math.floor(sayi);
    
    if (kalan === 0) return 'sıfır';
    
    // Basamakları işle
    for (let basamak of basamaklar) {
        if (kalan >= basamak.deger) {
            let bolum = Math.floor(kalan / basamak.deger);
            
            if (basamak.deger === 1000 && bolum === 1) {
                sonuc += 'bin ';
            } else {
                sonuc += ucBasamakYaziyaCevir(bolum) + ' ' + basamak.isim + ' ';
            }
            
            kalan = kalan % basamak.deger;
        }
    }
    
    if (kalan > 0) {
        sonuc += ucBasamakYaziyaCevir(kalan);
    }
    
    return sonuc.trim();
}
```

**Örnekler**:
```javascript
sayiyiYaziyaCevir(1234567);
// Dönüş: "bir milyon ikiyüz otuz dört bin beşyüz altmış yedi"

sayiyiYaziyaCevir(1000);
// Dönüş: "bin"

sayiyiYaziyaCevir(0);
// Dönüş: "sıfır"
```

---

#### `ucBasamakYaziyaCevir(sayi)`

0-999 arası sayıyı yazıya çevirir (yardımcı fonksiyon).

**Parametreler**:
- `sayi` (number): 0-999 arası sayı

**Dönüş**: `string` - Türkçe yazı

**Kod**:
```javascript
function ucBasamakYaziyaCevir(sayi) {
    const birler = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const yuzler = ['', 'yüz', 'ikiyüz', 'üçyüz', 'dörtyüz', 'beşyüz', 'altıyüz', 'yediyüz', 'sekizyüz', 'dokuzyüz'];
    
    let sonuc = '';
    let yuz = Math.floor(sayi / 100);
    let on = Math.floor((sayi % 100) / 10);
    let bir = sayi % 10;
    
    if (yuz > 0) sonuc += yuzler[yuz] + ' ';
    if (on > 0) sonuc += onlar[on] + ' ';
    if (bir > 0) sonuc += birler[bir] + ' ';
    
    return sonuc.trim();
}
```

---

#### `formatTarih(tarih)`

Tarihi DD.MM.YYYY formatına çevirir.

**Parametreler**:
- `tarih` (string): ISO 8601 tarih string'i (YYYY-MM-DD)

**Dönüş**: `string` - Formatlanmış tarih (DD.MM.YYYY)

**Kod**:
```javascript
function formatTarih(tarih) {
    if (!tarih) return '';
    const d = new Date(tarih);
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const yil = d.getFullYear();
    return `${gun}.${ay}.${yil}`;
}
```

**Örnek**:
```javascript
formatTarih('2024-10-26');
// Dönüş: "26.10.2024"
```

---

#### `generateReport(raporData, outputPath)`

Word formatında rapor oluşturur.

**Parametreler**:
- `raporData` (object): Veritabanından gelen rapor verisi
- `outputPath` (string): Kaydedilecek dosya yolu

**Dönüş**: `Promise<Object>` - `{ success: boolean, path?: string, error?: string }`

**Kod** (özet):
```javascript
function generateReport(raporData, outputPath) {
    try {
        // Hesaplamalar
        const yapiBedeli = parseFloat(raporData.yapiBedeli) || 0;
        const levazimBedeli = yapiBedeli * 0.7 * 0.75;
        
        // Document oluştur
        const doc = new Document({
            sections: [{
                children: [
                    // Başlık
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                            new TextRun({
                                text: "KIYMET TAKDİR RAPORU",
                                bold: true,
                                size: 32
                            })
                        ]
                    }),
                    
                    // Tablolar
                    new Table({...}),
                    
                    // Paragraflar
                    new Paragraph({...})
                ]
            }]
        });
        
        // Dosyayı kaydet
        return Packer.toBuffer(doc).then(buffer => {
            fs.writeFileSync(outputPath, buffer);
            return { success: true, path: outputPath };
        }).catch(error => {
            return { success: false, error: error.message };
        });
        
    } catch (error) {
        return Promise.resolve({ success: false, error: error.message });
    }
}
```

**Export**:
```javascript
module.exports = { generateReport, sayiyiYaziyaCevir, formatTarih };
```

---

## 🛠️ Yardımcı Fonksiyonlar

### Sayı Formatlama

```javascript
// Binlik ayırıcı ekleme
function formatSayi(sayi) {
    return sayi.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Kullanım
formatSayi(1234567.89);
// Dönüş: "1,234,567.89"
```

### Validasyon

```javascript
// Boş alan kontrolü
function validateRequired(value, fieldName) {
    if (!value || value.trim() === '') {
        alert(`${fieldName} alanı zorunludur!`);
        return false;
    }
    return true;
}

// Sayısal değer kontrolü
function validateNumeric(value, fieldName) {
    if (isNaN(parseFloat(value))) {
        alert(`${fieldName} sayısal bir değer olmalıdır!`);
        return false;
    }
    return true;
}
```

---

## 📊 Modül İlişkileri Diyagramı

```
┌─────────────┐
│   main.js   │
│  (Ana Süreç)│
└─────┬───────┘
      │
      ├─────────────────────┬──────────────────┐
      │                     │                  │
      ▼                     ▼                  ▼
┌────────────┐      ┌─────────────┐   ┌──────────────┐
│ index.html │      │raporlar.html│   │ raporlar.db  │
│            │      │             │   │  (SQLite)    │
└─────┬──────┘      └──────┬──────┘   └──────────────┘
      │                    │
      ▼                    ▼
┌────────────┐      ┌─────────────┐
│renderer.js │      │ raporlar.js │
│            │      │             │
└────────────┘      └──────┬──────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │reportGenerator.js│
                    │                  │
                    └──────┬───────────┘
                           │
                           ▼
                    ┌──────────────────┐
                    │  Rapor_X.docx    │
                    │  (Word Dosyası)  │
                    └──────────────────┘
```

---

**Son Güncelleme**: 2024

