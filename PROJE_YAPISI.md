# 🏗️ Proje A - Modüler Yapı Dokümantasyonu

## 📋 Genel Bakış

**Proje A**, modüler mimari ile tasarlanmış bir proje geliştirme platformudur. Her modül bağımsız çalışabilir ve kolayca genişletilebilir.

---

## 📦 Modül Yapısı

### Aktif Modüller

#### 1. 🏗️ Yapı Bedeli Modülü
**Konum**: `modules/yapi-bedeli/`

**Amaç**: Yapı değerleme raporlarının Resmi Gazete tebliğlerine uygun şekilde oluşturulması

**Dosya Yapısı**:
```
modules/yapi-bedeli/
├── views/                      # Kullanıcı arayüzü
│   ├── index.html             # Ana form
│   ├── raporlar.html          # Rapor listesi
│   └── admin.html             # Yönetim paneli
├── scripts/                    # İş mantığı
│   ├── renderer.js            # Ana form mantığı
│   ├── raporlar.js            # Rapor yönetimi
│   ├── admin.js               # Admin işlemleri
│   └── reportGenerator.js     # Word rapor oluşturma
├── styles/                     # Stiller
│   └── style.css              # (şu an kullanılmıyor, inline CSS var)
├── KT_Sablon_1.docx           # Rapor şablonu
└── birimFiyatlar.json         # Birim fiyat verileri
```

**Özellikler**:
- ✅ 3 adımlı form sistemi
- ✅ Otomatik hesaplama (yıpranma payı, yapı bedeli, levazım bedeli)
- ✅ Birim fiyat yönetimi (yıl + dönem bazlı)
- ✅ Raportör yönetimi
- ✅ Kurum yönetimi
- ✅ Word rapor çıktısı
- ✅ SQLite veritabanı entegrasyonu

---

### Planlanan Modüller

#### 2. 💼 Proje Bedeli Modülü
**Konum**: `modules/proje-bedeli/` (henüz oluşturulmadı)

**Amaç**: Türkiye mevzuatına göre proje bedeli hesaplama

**Planlanan Özellikler**:
- Yapı sınıfı bazlı hesaplama
- m² bazlı maliyet
- Vergi durumu hesaplamaları
- Ek imalat yönetimi

#### 3. 📚 Mevzuat Modülü
**Konum**: `modules/mevzuat/` (henüz oluşturulmadı)

**Amaç**: Cari mevzuat yönetimi ve görüntüleme

**Planlanan Özellikler**:
- Mevzuat arşivi
- Arama ve filtreleme
- Kategori yönetimi
- Güncel mevzuat takibi

#### 4. 🧮 Hesaplama Modülü
**Konum**: `modules/hesaplama/` (henüz oluşturulmadı)

**Amaç**: Gelişmiş hesap makinesi

**Planlanan Özellikler**:
- Bilimsel hesaplama
- Birim dönüşümleri
- Formül kaydetme
- Geçmiş hesaplamalar

---

## 🔗 Paylaşılan Kaynaklar

### shared/ Klasörü

**Amaç**: Tüm modüller tarafından kullanılabilecek ortak kaynaklar

```
shared/
├── database/                   # Veritabanı yönetimi
│   └── (gelecekte eklenecek)
└── utils/                      # Yardımcı fonksiyonlar
    └── (gelecekte eklenecek)
```

**Planlanan İçerik**:
- Veritabanı bağlantı yönetimi
- Ortak utility fonksiyonlar
- Tarih/saat işlemleri
- Sayı formatlamaları
- Türkçe yazıya çevirme
- Dosya işlemleri

---

## 🗄️ Veritabanı Yapısı

**Dosya**: `raporlar.db` (SQLite3)

### Tablolar

#### 1. raporlar
Yapı bedeli raporlarını saklar

#### 2. birimFiyatlar
Yıl ve dönem bazlı birim fiyat ana kayıtları

#### 3. birimFiyatDetay
Yapı sınıfı ve grup bazlı detay fiyatlar

#### 4. raportorleri
Raportör bilgileri

#### 5. kurumlar
Kurum ve alt kurum bilgileri

---

## 🚀 Yeni Modül Ekleme Rehberi

### 1. Klasör Yapısı Oluşturma

```bash
mkdir modules/yeni-modul
mkdir modules/yeni-modul/views
mkdir modules/yeni-modul/scripts
mkdir modules/yeni-modul/styles
```

### 2. Temel Dosyalar

**views/index.html**:
```html
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Proje A - Yeni Modül</title>
</head>
<body>
    <!-- Modül içeriği -->
    <script src="../scripts/main.js"></script>
</body>
</html>
```

**scripts/main.js**:
```javascript
// Modül mantığı
```

### 3. main.js'e IPC Handler Ekleme

```javascript
ipcMain.on('show-yeni-modul', (event) => {
    const modulWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Proje A - Yeni Modül',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    remoteMain.enable(modulWindow.webContents);
    modulWindow.loadFile('modules/yeni-modul/views/index.html');
});
```

### 4. Ana Menüden Erişim

Ana modül seçim ekranı oluşturulduğunda, yeni modül buraya eklenecek.

---

## 🛠️ Geliştirme Ortamı

### Gereksinimler
- Node.js v14+
- npm v6+
- Windows (şu an için)

### Kurulum
```bash
npm install
npx electron-rebuild  # Native modüller için
npm start
```

### Bağımlılıklar

**Ana Bağımlılıklar**:
- electron: 34.0.1
- sqlite3: 5.1.7
- docx: 9.5.1
- docxtemplater: 3.67.0

**Dev Bağımlılıklar**:
- electron-rebuild: 3.2.9

---

## 📝 Kodlama Standartları

### Dosya Adlandırma
- HTML: `kebab-case.html`
- JavaScript: `camelCase.js`
- CSS: `kebab-case.css`

### Klasör Yapısı
- Her modül kendi klasöründe
- `views/`, `scripts/`, `styles/` alt klasörleri
- Modül özel dosyalar modül kökünde

### JavaScript
- ES6+ syntax kullanımı
- Türkçe değişken isimleri (iş mantığı için)
- İngilizce teknik terimler
- Yorum satırları Türkçe

### HTML
- Semantic HTML5
- Türkçe içerik
- Responsive tasarım

---

## 🔄 Versiyon Geçmişi

### v2.0.0 (22.11.2025)
- ✅ Modüler yapıya geçiş
- ✅ Proje A olarak yeniden adlandırma
- ✅ Yapı Bedeli modülü ayrıştırıldı
- ✅ Build dosyaları temizlendi

### v1.0.0 (20.11.2025)
- ✅ İlk stabil sürüm (KİTAR)
- ✅ Standalone build desteği
- ✅ Uygulama ikonu

---

## 🎯 Sonraki Adımlar

### Kısa Vadeli
1. ⏳ Ana modül seçim ekranı oluşturma
2. ⏳ Shared utilities geliştirme
3. ⏳ Veritabanı yönetim katmanı

### Orta Vadeli
1. ⏳ Proje Bedeli modülü geliştirme
2. ⏳ Mevzuat modülü geliştirme
3. ⏳ Hesaplama modülü geliştirme

### Uzun Vadeli
1. ⏳ Standalone exe build sistemi
2. ⏳ Auto-update mekanizması
3. ⏳ Yedekleme sistemi
4. ⏳ Kullanıcı ayarları

---

## 📞 Destek

Sorularınız için:
- CHANGELOG.md dosyasını kontrol edin
- README.md dosyasını okuyun
- docs/ klasöründeki dokümantasyonu inceleyin

---

**Son Güncelleme**: 22.11.2025 - 14:35
**Versiyon**: 2.0.0
**Durum**: Aktif Geliştirme
