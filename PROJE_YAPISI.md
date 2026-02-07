# Proje A - Modüler Yapı Dokümantasyonu

## Genel Bakış

**Proje A**, modüler mimari ile tasarlanmış bir proje geliştirme platformudur. Tek pencere (SPA) navigasyon sistemiyle çalışır. Her modül bağımsız geliştirilebilir ve kolayca genişletilebilir.

---

## Uygulama Giriş Noktası

| Dosya | Açıklama |
|-------|----------|
| `main.js` | Electron ana süreç - pencere oluşturma, veritabanı, IPC handler'lar |
| `dashboard.html` | Ana sayfa HTML - SPA shell, navigasyon bar, sayfa container |
| `dashboard.js` | Dashboard mantığı - modül kartları, animasyonlar, navigasyon başlatma |

Uygulama başlatıldığında `main.js` → `dashboard.html` yüklenir. Dashboard içindeki `NavigationManager` (`shared/scripts/navigation.js`) tüm sayfa geçişlerini yönetir.

---

## Modül Yapısı

### Aktif Modüller

#### 1. Yapı Bedeli Modülü
**Konum**: `modules/yapi-bedeli/`

**Amaç**: Yapı değerleme raporlarının Resmi Gazete tebliğlerine uygun şekilde oluşturulması

**Dosya Yapısı**:
```
modules/yapi-bedeli/
├── views/
│   ├── yapi-bedeli-content.html   # Ana form (3 sekmeli: Genel, Arsa, Yapı)
│   ├── raporlar-content.html      # Kayıtlı raporlar tablosu
│   ├── admin-content.html         # Yönetim paneli (4 sekmeli)
│   ├── editor-content.html        # Rapor editörü
│   ├── index.html                 # Eski standalone form (legacy)
│   ├── raporlar.html              # Eski standalone raporlar (legacy)
│   └── admin.html                 # Eski standalone admin (legacy)
├── scripts/
│   ├── yapi-bedeli-page.js        # SPA form mantığı
│   ├── raporlar-page.js           # SPA rapor listesi mantığı
│   ├── admin-page.js              # SPA admin mantığı
│   ├── editor-page.js             # SPA editör mantığı
│   ├── renderer.js                # Eski form mantığı (legacy)
│   ├── raporlar.js                # Eski rapor mantığı (legacy)
│   ├── admin.js                   # Eski admin mantığı (legacy)
│   ├── reportGenerator.js         # Word rapor oluşturma
│   └── preview.js                 # Önizleme mantığı
├── styles/
│   └── style.css                  # Ek stiller
├── assets/
│   └── yapi-bedeli-icon.png       # Modül ikonu
├── KT_Sablon_1.docx               # Rapor şablonu
└── birimFiyatlar.json              # Birim fiyat verileri (JSON)
```

**Özellikler**:
- 3 adımlı form sistemi (Genel Bilgiler, Arsa Bilgileri, Yapı Bilgileri)
- Otomatik hesaplama (yıpranma payı, yapı bedeli, levazım bedeli)
- Birim fiyat yönetimi (yıl + dönem + yapı sınıfı bazlı)
- Raportör yönetimi (admin panelinden)
- Kurum yönetimi (admin panelinden)
- PID oranları yönetimi (admin panelinden)
- Word rapor çıktısı (.docx)
- Rapor editörü
- SQLite veritabanı entegrasyonu

---

#### 2. Proje Bedeli Modülü
**Konum**: `modules/proje-bedeli/`

**Amaç**: Türkiye mevzuatına göre mimarlık ve mühendislik proje bedeli hesaplama

**Dosya Yapısı**:
```
modules/proje-bedeli/
├── views/
│   ├── proje-bedeli-content.html  # Ana form (3 sekmeli: Genel, Branş, Hesaplama)
│   └── pb-raporlar-content.html   # Kayıtlı raporlar tablosu
├── scripts/
│   ├── proje-bedeli-page.js       # SPA form mantığı
│   ├── pb-raporlar-page.js        # SPA rapor listesi mantığı
│   └── pb-reportGenerator.js      # Word rapor oluşturma
└── assets/
    └── proje-bedeli-icon.png      # Modül ikonu
```

**Özellikler**:
- 3 sekmeli form (Genel Bilgiler, Branş Bilgileri, Hesaplama)
- 4 branş desteği (Mimarlık, İnşaat, Mekanik, Elektrik)
- Yapı yaklaşık maliyeti hesaplama
- PID oranlarına göre hizmet bedeli hesaplama
- Hizmet dalı katsayıları
- İmzacı yönetimi (branş bazlı)
- Word rapor çıktısı (.docx)
- SQLite veritabanı entegrasyonu

---

### Planlanan Modüller

#### 3. Mevzuat Modülü
**Konum**: `modules/mevzuat/` (henüz oluşturulmadı)

**Amaç**: Cari mevzuat yönetimi ve görüntüleme

#### 4. Hesaplama Modülü
**Konum**: `modules/hesaplama/` (henüz oluşturulmadı)

**Amaç**: Gelişmiş hesap makinesi ve birim dönüşümleri

---

## Navigasyon Sistemi

### NavigationManager (`shared/scripts/navigation.js`)

Tek pencere SPA navigasyonunu yöneten sınıf. Tüm sayfa geçişleri bu sınıf üzerinden yapılır.

**Kayıtlı Sayfalar**:

| Sayfa ID | Başlık | Template | Script |
|----------|--------|----------|--------|
| `dashboard` | Ana Sayfa | (özel) | - |
| `yapi-bedeli` | Yapı Bedeli | `yapi-bedeli-content.html` | `yapi-bedeli-page.js` |
| `raporlar` | Kayıtlı Raporlar | `raporlar-content.html` | `raporlar-page.js` |
| `editor` | Rapor Editörü | `editor-content.html` | `editor-page.js` |
| `admin` | Yönetim Paneli | `admin-content.html` | `admin-page.js` |
| `proje-bedeli` | Proje Bedeli | `proje-bedeli-content.html` | `proje-bedeli-page.js` |
| `pb-raporlar` | PB Raporları | `pb-raporlar-content.html` | `pb-raporlar-page.js` |

**Navigasyon Akışı**:
```
Dashboard
├── Yapı Bedeli → Raporlar → Editör
│                         → Admin Paneli
└── Proje Bedeli → PB Raporlar
```

**Çalışma Prensibi**:
1. `navigateTo(pageName)` çağrılır
2. Template HTML dosyası `fs.readFileSync()` ile okunur
3. `container.innerHTML`'e yüklenir
4. Script dosyası `require()` ile dinamik yüklenir
5. Sayfa stack'e eklenir (geri dönüş için)

---

## Paylaşılan Kaynaklar

### shared/ Klasörü

```
shared/
├── scripts/
│   └── navigation.js           # NavigationManager sınıfı
├── database/                    # (gelecekte: ortak DB yönetimi)
└── utils/                       # (gelecekte: ortak utility fonksiyonlar)
```

---

## Veritabanı Yapısı

**Dosya**: `raporlar.db` (SQLite3) - Uygulama ilk çalıştırıldığında otomatik oluşur.

### Tablolar

| # | Tablo | Açıklama | Modül |
|---|-------|----------|-------|
| 1 | `raporlar` | Yapı bedeli raporları (29+ sütun) | Yapı Bedeli |
| 2 | `birimFiyatlar` | Yıl/dönem bazlı birim fiyat ana kayıtları | Yapı Bedeli |
| 3 | `birimFiyatDetay` | Yapı sınıfı ve grup bazlı detay fiyatlar | Yapı Bedeli |
| 4 | `raportorler` | Raportör bilgileri (ad, unvan, sicil no) | Yapı Bedeli |
| 5 | `kurumlar` | Kurum ve alt kurum bilgileri | Yapı Bedeli |
| 6 | `yipranmaPaylari` | Yıpranma payı cetvelleri (yapı tipi + yaş) | Yapı Bedeli |
| 7 | `pidOranlari` | PID oranları (maliyet aralığı + oran) | Proje Bedeli |
| 8 | `hizmetDaliKatsayilari` | Hizmet dalı katsayıları (branş bazlı) | Proje Bedeli |
| 9 | `projeBedeliRaporlari` | Proje bedeli raporları | Proje Bedeli |

Migration sistemi `main.js` içinde tanımlıdır. Yeni tablolar ve sütunlar otomatik eklenir.

---

## Yeni Modül Ekleme Rehberi

### 1. Klasör Yapısı Oluşturma

```
modules/yeni-modul/
├── views/
│   └── yeni-modul-content.html    # Modül HTML içeriği (sadece content)
├── scripts/
│   └── yeni-modul-page.js         # SPA sayfa mantığı
├── styles/                         # (opsiyonel)
└── assets/                         # (opsiyonel)
```

### 2. Content HTML Dosyası

`-content.html` dosyaları tam HTML sayfası DEĞİLDİR. Sadece `<style>` ve `<div>` içerirler. Dashboard'un `page-container` elementine yüklenirler.

```html
<!-- yeni-modul-content.html -->
<style>
    .ym-container { /* modül prefix'i kullanın */ }
</style>

<div class="ym-container">
    <header class="ym-header">
        <h1>Yeni Modül</h1>
    </header>
    <!-- İçerik -->
</div>
```

### 3. Page Script Dosyası

```javascript
// yeni-modul-page.js
(function() {
    console.log('Yeni Modül sayfası yüklendi');
    
    // DOM elementlerine erişim
    // Event listener'lar
    // Veritabanı işlemleri
})();
```

### 4. NavigationManager'a Kayıt

`shared/scripts/navigation.js` dosyasındaki `pages` objesine ekleyin:

```javascript
'yeni-modul': {
    title: 'Yeni Modül',
    icon: '📦',
    template: 'modules/yeni-modul/views/yeni-modul-content.html',
    script: 'modules/yeni-modul/scripts/yeni-modul-page.js'
}
```

### 5. Dashboard'a Kart Ekleme

`dashboard.html` dosyasındaki modül kartları bölümüne yeni kart ekleyin:

```html
<div class="module-card" data-module="yeni-modul">
    <!-- Kart içeriği -->
</div>
```

### 6. Veritabanı Tabloları (Gerekirse)

`main.js` dosyasındaki `createDatabase()` fonksiyonuna yeni tablo tanımları ekleyin.

---

## Geliştirme Ortamı

### Gereksinimler
- Node.js v14+
- npm v6+

### Kurulum
```bash
npm install
npx electron-rebuild  # Native modüller için (SQLite3)
npm start
```

### Bağımlılıklar

| Paket | Versiyon | Açıklama |
|-------|----------|----------|
| electron | 34.0.1 | Masaüstü uygulama framework'ü |
| @electron/remote | 2.1.3 | Renderer'dan main process erişimi |
| sqlite3 | 5.1.7 | Veritabanı |
| docx | 9.5.1 | Word dokümanı oluşturma |
| docxtemplater | 3.67.0 | Şablon doldurma |
| pizzip | 3.2.0 | ZIP işlemleri |
| mammoth | 1.11.0 | HTML dönüşüm |
| lodash | 4.17.21 | Utility fonksiyonlar |
| angular-expressions | 1.5.1 | İfade değerlendirme |
| officegen | 0.6.5 | Office doküman oluşturma |

---

## Kodlama Standartları

### Dosya Adlandırma
- HTML content: `modul-adi-content.html`
- SPA script: `modul-adi-page.js`
- Legacy script: `modul-adi.js`
- CSS prefix: modül kısaltması (`yb-`, `pb-`, `ad-`, `rp-`)

### CSS Sınıf Prefix'leri

| Modül | Prefix | Örnek |
|-------|--------|-------|
| Yapı Bedeli | `yb-` | `yb-container`, `yb-header` |
| Proje Bedeli | `pb-` | `pb-container`, `pb-tab-button` |
| Admin Paneli | `ad-` | `ad-container`, `ad-table` |
| Raporlar | `rp-` | `rp-container`, `rp-table` |

### JavaScript
- ES6+ syntax
- Türkçe değişken isimleri (iş mantığı)
- İngilizce teknik terimler
- Yorum satırları Türkçe
- IIFE pattern (SPA page script'leri)

---

## Versiyon Geçmişi

### v2.0.0 (22.11.2025)
- Modüler yapıya geçiş
- Proje A olarak yeniden adlandırma (KİTAR → Proje A)
- Yapı Bedeli modülü ayrıştırıldı
- Dashboard ve SPA navigasyon sistemi
- Proje Bedeli modülü eklendi
- Admin paneli (4 sekmeli: Dönemler, Raportörler, Kurumlar, PID Oranları)
- Modern UI tasarımı (SVG ikonlar, Inter font, Slate renk paleti)

### v1.0.0 (20.11.2025)
- İlk stabil sürüm (KİTAR)
- Standalone build desteği
- Uygulama ikonu

---

## Sonraki Adımlar

### Kısa Vadeli
1. Mevzuat modülü geliştirme
2. Hesaplama modülü geliştirme
3. Shared utilities geliştirme

### Uzun Vadeli
1. Standalone exe build sistemi
2. Auto-update mekanizması
3. Yedekleme sistemi
4. Kullanıcı ayarları

---

**Son Güncelleme**: 07.02.2026
**Versiyon**: 2.0.0
**Durum**: Aktif Geliştirme
