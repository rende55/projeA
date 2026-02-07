# CHANGELOG

## [07.02.2026 - 19:00] - Portable Build Türkçe Karakter Düzeltmesi

### Düzeltilen Sorun
- **Portable build'de Türkçe karakterler bozuk görünüyordu**: Ş, İ, Ö, Ç, Ğ, Ü gibi karakterler yanlış gösteriliyordu

### Kök Neden
- PowerShell üzerinden `sqlite3` komutu ile yapılan DB güncellemelerinde encoding Windows-1254 (Latin-5) olarak kaydediliyordu
- UTF-8'de `İ` = `C4B0` olması gerekirken `DD` (Latin-1) olarak yazılmıştı

### Çözüm
- DB güncellemeleri Node.js script'i ile yapıldı (UTF-8 garanti)
- `raporlar_build.db` yeniden oluşturuldu, tüm Türkçe karakterler doğru encoding'de
- Portable exe yeniden build alındı

---

## [07.02.2026 - 18:48] - Raportör Ünvan Listesi Genişletildi ve Elle Giriş Eklendi

### Yapılan İşlemler
- **Ünvan listesi genişletildi**: Elektrik-Elektronik Mühendisi, Çevre Mühendisi, Jeofizik Mühendisi, Tekniker, Teknisyen, Teknik Ressam eklendi
- **Kategorilere ayrıldı**: Mühendislik, İdari, Teknik ve Diğer grupları
- **Elle giriş desteği**: "Elle Giriş..." seçeneği ile listede olmayan ünvanlar yazılabiliyor
- **Düzenleme formunda akıllı algılama**: Mevcut ünvan listede yoksa otomatik olarak elle giriş moduna geçiyor

### Etkilenen Dosyalar
- `modules/yapi-bedeli/views/admin-content.html` (tek pencere admin formu)
- `modules/yapi-bedeli/views/admin.html` (ekleme + düzenleme formları)
- `modules/yapi-bedeli/scripts/admin-page.js` (yeniRaportorEkle)
- `modules/yapi-bedeli/scripts/admin.js` (yeniRaportorEkle, raportorDuzenle, raportorGuncelle)

---

## [07.02.2026 - 18:33] - Veritabanı Build'e Dahil Edilmesi

### Yapılan İşlemler
- **Temizlenmiş veritabanı** (`raporlar_build.db`) oluşturuldu
  - Birim fiyatlar ve PID oranları korundu (değişmez veriler)
  - Raportör isimleri rastgele Türkçe isimlerle değiştirildi (gizlilik)
  - Kurumlar temizlendi, tek default kurum eklendi: *Samsun Çevre, Şehircilik ve İklim Değişikliği İl Müdürlüğü / Proje Şube Müdürlüğü*
  - Tüm raporlar ve proje bedeli raporları silindi (kişisel veri)
- **`build.js`** güncellendi: `raporlar_build.db` → `extra/raporlar.db` olarak build-temp'e kopyalanıyor
- **`package.json` build config**: `extraResources` ile DB dosyası ASAR dışında exe'nin yanına kopyalanıyor
- Portable exe yeniden oluşturuldu: `dist/ProjeA-2.0.0-Portable.exe`

---

## [07.02.2026 - 14:47] - ASAR Paketleme Uyumluluğu Düzeltmesi

### Düzeltilen Sorun
- **Modül sayfaları portable build'de boş açılıyordu**: Dashboard yükleniyor ama modüllere tıklayınca boş ekran geliyordu (obfuscation'sız build'de de aynı sorun)

### Kök Neden
- **ASAR içinde `__dirname` yazılamaz bir yolu gösteriyor**: Tüm renderer modül script'leri `path.join(__dirname, '..', '..', '..', 'raporlar.db')` ile veritabanı yolunu hesaplıyordu. ASAR paketlemede bu yol `app.asar` arşivinin içini gösteriyor ve veritabanı dosyası oluşturulamıyor/açılamıyordu (`SQLITE_CANTOPEN` hatası)
- `main.js`'te de aynı sorun: `path.join(__dirname, 'raporlar.db')` ASAR içine yazma denemesi

### Yapılan Düzeltmeler
- **`shared/scripts/db-helper.js`** oluşturuldu: ASAR uyumlu veritabanı yolu hesaplama modülü
  - `app.isPackaged` kontrolü ile production/development ayrımı
  - Production: `path.dirname(app.getPath('exe'))` (exe'nin yanı)
  - Development: `app.getAppPath()` (proje kök dizini)
- **10 renderer dosyasında** `__dirname` ile DB yolu → `getDbPath()` ile değiştirildi
- **`main.js`'te** `APP_ROOT` değişkeni ile veritabanı yolu düzeltildi
- **`main.js`'e** renderer hata loglama mekanizması eklendi (`console-message` event)
- **`proje-bedeli-page.js`'te** raporlar klasörü yolu da `getAppRootDir()` ile düzeltildi
- **`build.js`'e** `--no-obfuscate` flag desteği eklendi (debug build için)

### Etkilenen Dosyalar
- `shared/scripts/db-helper.js` (yeni)
- `main.js`
- `build.js`
- `modules/yapi-bedeli/scripts/`: yapi-bedeli-page.js, renderer.js, raporlar-page.js, editor-page.js, editor.js, admin.js, admin-page.js
- `modules/proje-bedeli/scripts/`: proje-bedeli-page.js, pb-raporlar-page.js

---

## [07.02.2026 - 03:15] - Obfuscation Düzeltmesi ve Yeniden Build

### Düzeltilen Sorun
- **Modül sayfaları yüklenmiyor**: Portable build'de dashboard açılıyor ama modül sayfalarına tıklayınca boş sayfa geliyordu

### Kök Neden
- Obfuscation ayarlarında `selfDefending: true` ASAR içinde kodu kırıyordu
- `debugProtection: true` renderer process'te sonsuz debugger döngüsü başlatıyordu
- `target: 'node'` renderer dosyaları için yanlıştı
- `splitStrings` ve `transformObjectKeys` dosya yollarını ve `module.exports` yapısını bozuyordu

### Yapılan Düzeltmeler
- **Main process** ve **renderer process** için ayrı obfuscation ayarları oluşturuldu
- `selfDefending`, `debugProtection`, `deadCodeInjection` kapatıldı
- `splitStrings` ve `transformObjectKeys` kapatıldı
- Renderer target `'browser-no-eval'` olarak ayarlandı
- `disableConsoleOutput` kapatıldı (hata ayıklama için)
- Portable exe yeniden oluşturuldu: `dist/ProjeA-2.0.0-Portable.exe`

---

## [07.02.2026 - 01:35] - Production Build ve Güvenlik Önlemleri

### Güvenlik Kontrolleri ve Düzeltmeler
- **Debug Koruması**: `openDevTools()` çağrıları kaldırıldı (main window + editor window). F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U kısayolları tüm pencerelerde engellendi
- **Ağ Kısıtlamaları**: Google Fonts CDN (`fonts.googleapis.com`) kaldırıldı. Inter fontu lokal woff2 dosyalarıyla (`assets/fonts/`) yükleniyor. Uygulama tamamen offline çalışıyor
- **Bağımlılık Güvenliği**: `npm audit fix` çalıştırıldı. Kalan açıklar build-time bağımlılıklarda (tar, node-gyp) — runtime riski yok
- **Dosya Erişim**: Veritabanı `__dirname` ile relative path kullanıyor, Program Files'a yazmıyor
- **Geçici Dosya**: Word export doğrudan kullanıcı seçtiği yere yazıyor, temp dosya üretilmiyor
- **Hassas Veri**: Kod taraması yapıldı — API key, şifre, gerçek kişi bilgisi bulunamadı

### Kod Gizliliği (Obfuscation)
- **`javascript-obfuscator`** paketi eklendi (devDependency)
- **16 JS dosyası** karartıldı: `main.js`, `dashboard.js`, `navigation.js`, tüm modül script'leri
- Obfuscation ayarları: control flow flattening, dead code injection, debug protection, string array encoding (base64), self defending

### Portable Build
- **`electron-builder`** paketi eklendi (devDependency)
- **`build.js`** build script'i oluşturuldu (kopyala → obfuscate → paketle)
- **`ProjeA-2.0.0-Portable.exe`** (~98 MB) oluşturuldu — `dist/` klasöründe
- ASAR paketleme aktif, maximum sıkıştırma
- Build script'leri: `npm run obfuscate`, `npm run build`, `npm run build:dir`

### Diğer
- **`package.json`** — build yapılandırması ve script'ler eklendi
- **`.gitignore`** — `build-temp/`, `dist/`, `mainS.png` eklendi
- **`assets/fonts/`** — Inter font woff2 dosyaları (300-800 weight, latin-ext)

### Context Isolation Notu
- `contextIsolation: false` şimdilik korundu. `true` yapılması tüm renderer kodlarının preload + IPC bridge pattern'e çevrilmesini gerektirir (gelecek sürüm planında)

---

## [07.02.2026 - 01:00] - Uygulama İkonu Eklendi

### Yapılan Değişiklikler
- **Yeni uygulama ikonu** oluşturuldu (`mainS.png` kaynak dosyasından)
- **`electron-icon-builder`** paketi ile tüm platformlara uygun formatlar üretildi:
  - Windows: `assets/icons/icons/win/icon.ico`
  - macOS: `assets/icons/icons/mac/icon.icns`
  - PNG: 16x16, 24x24, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512, 1024x1024
- **`main.js`** - Pencere ikonu yeni `.ico` dosyasına yönlendirildi
- **`dashboard.html`** - Hero logosu yeni ikon ile değiştirildi (256x256 PNG)

---

## [07.02.2026 - 00:44] - Dashboard UI Düzeltmesi

### Düzeltilen Sorunlar
- **`dashboard.html`** - Modül kartlarının hero section arkaplanına taşması düzeltildi (negatif margin kaldırıldı, üst padding eklendi)
- **`dashboard.html`** - Tüm modül kartları artık ekran boyutu fark etmeksizin eşit boyutta görünüyor (grid: `auto-fill minmax` yerine sabit `repeat(2, 1fr)` kullanıldı)

---

## [07.02.2026 - 00:38] - Dokümantasyon Güncellemesi

### Güncellenen Dosyalar
- **`README.md`** - Proje Bedeli modülü "Aktif" olarak güncellendi, SPA navigasyon sistemi eklendi, veritabanı tabloları (9 tablo) eklendi, proje yapısı güncel dosya ağacıyla yeniden yazıldı, Proje Bedeli hesaplama formülleri eklendi, modern UI bilgileri eklendi, alt bilgi KİTAR v1.0.0 → Proje A v2.0.0 olarak düzeltildi
- **`PROJE_YAPISI.md`** - Proje Bedeli modülü tam dosya yapısıyla eklendi, NavigationManager ve kayıtlı sayfalar tablosu eklendi, yeni modül ekleme rehberi SPA yapısına göre güncellendi (IPC yerine NavigationManager), CSS prefix standartları eklendi, bağımlılıklar tablosu güncellendi, versiyon geçmişine güncel bilgiler eklendi
- **`ONEMLI_NOTLAR.md`** - Proje geçmişi kronolojik tablo olarak düzenlendi, modül durumları güncellendi (Proje Bedeli: Aktif), proje yapısı güncel dosya ağacıyla yeniden yazıldı, PowerShell uyumlu komutlar eklendi, beyaz ekran/hata sorun giderme eklendi

---

## [07.02.2026 - 00:27] - UI Modernizasyonu - Tüm Sayfalar

### ✨ Yapılan Değişiklikler
- **Dashboard tamamen yeniden tasarlandı**
  - Dark hero section, Inter font ailesi, CSS custom properties (design tokens)
  - Emoji ikonlar yerine SVG ikonlar (Lucide tarzı) kullanıldı
  - Modül kartlarına renkli ikon wrapper ve ok (arrow) göstergesi eklendi
  - Modern renk paleti: Slate tonları, subtle shadow'lar, ince border'lar
  - Navigasyon bar: beyaz arka plan, SVG ikonlu butonlar, temiz breadcrumb
  - Custom scrollbar stilleri eklendi
- **Yapı Bedeli modül sayfası modernize edildi**
  - Header: dark gradient, SVG ikon badge
  - Tab navigasyon: ince alt çizgi, modern renk geçişleri
  - Form elemanları: 1px border, 8px radius, mavi focus ring
  - Butonlar: modern renkler, hover glow efektleri
  - Sağ panel: açık gri arka plan, uppercase başlık
- **Proje Bedeli modül sayfası modernize edildi**
  - Aynı design system uygulandı (indigo accent rengi)
  - Alt tab navigasyon: rounded container, dark active state
  - Form ve buton stilleri tutarlı hale getirildi
- **Raporlar sayfaları modernize edildi** (yapi-bedeli + proje-bedeli)
  - Tablo: açık header, uppercase sütun başlıkları, ince border'lar
  - Aksiyon butonları: pastel renkli arka plan + koyu metin (daha okunabilir)
  - Header: SVG ikonlu badge, dark gradient
- **Admin paneli modernize edildi**
  - Tablo stilleri, tab navigasyon, butonlar ve badge'ler güncellendi
  - Info box: açık mavi arka plan, modern border radius

### 🎨 Design System
- **Renkler**: Slate (#0F172A, #1E293B, #334155), Blue (#3B82F6), Emerald (#10B981)
- **Tipografi**: Inter font, -0.3px letter-spacing başlıklar
- **Gölgeler**: 3 kademe (sm, md, xl) - çok hafif ve modern
- **Border**: 1px solid #E2E8F0, 8-16px radius
- **İkonlar**: Inline SVG (Lucide icon seti tarzı)

### 🔄 Güncellenen Dosyalar
- `dashboard.html` - Ana sayfa tamamen yeniden tasarlandı
- `modules/yapi-bedeli/views/yapi-bedeli-content.html` - CSS ve header modernizasyonu
- `modules/proje-bedeli/views/proje-bedeli-content.html` - CSS ve header modernizasyonu
- `modules/yapi-bedeli/views/raporlar-content.html` - Tablo ve header modernizasyonu
- `modules/yapi-bedeli/views/admin-content.html` - Tüm CSS ve header modernizasyonu
- `modules/proje-bedeli/views/pb-raporlar-content.html` - Tablo ve header modernizasyonu

### ⚠️ Notlar
- Hiçbir JavaScript dosyası değiştirilmedi (backend/UX bağımlılıkları korundu)
- Tüm class isimleri, ID'ler ve data attribute'ları korundu
- Mevcut fonksiyonellik bozulmadan sadece görsel iyileştirme yapıldı

---

## [07.02.2026 - 00:07] - Yapı Bedeli - Resmi Yazı Sayısı 4 Parçalı Giriş

### ✨ Yeni Özellikler
- **Resmi Yazı Sayısı alanı 4 parçalı yapıya dönüştürüldü**
  - 1. Kutu: Belge türü seçimi (E: Elektronik, Z: Zorunlu Hal, O: Olağanüstü Durum) - Default: E
  - 2. Kutu: T.C. Devlet Teşkilat Numarası (max 9 hane)
  - 3. Kutu: Standart Dosya Planı Kodu (max 9 hane, Örn: 755.99)
  - 4. Kutu: Belge Kayıt Numarası (max 9 hane)
  - Rapora dökülürken kutucuklar tire (-) ile birleştirilerek tek değer olarak gösterilir
  - Boş kutucuklar yok sayılır (Örn: E-681103562-823.01-13589)

### 🔄 Güncellenen Dosyalar
- `modules/yapi-bedeli/views/yapi-bedeli-content.html` - 4 parçalı input yapısı
- `modules/yapi-bedeli/views/index.html` - 4 parçalı input yapısı (eski form)
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - collectFormData birleştirme mantığı
- `modules/yapi-bedeli/scripts/renderer.js` - handleFormSubmit, saveFormData, loadFormData güncellendi

---

## [04.02.2026 - 23:31] - Yönetici Paneli - Birim Fiyat Grupları Düzenleme Özelliği

### 🐛 Hata Düzeltmesi
- **Birim fiyat dönemi eklendikten sonra içeriğine erişilememe sorunu giderildi**
  - Dönem listesinde "Grupları Düzenle" butonu eksikti
  - Grup düzenleme bölümü HTML'de tanımlı değildi
  - İlgili fonksiyonlar `admin-page.js`'e eklenmemişti

### ✨ Eklenen Özellikler
- **Grupları Düzenle butonu** dönem listesine eklendi
- **Grup düzenleme bölümü** eklendi (5 sınıf için A-E grupları)
- **Grup ekleme/silme/kaydetme** fonksiyonları eklendi

### 🔄 Güncellenen Dosyalar
- `modules/yapi-bedeli/views/admin-content.html` - Grup düzenleme bölümü eklendi
- `modules/yapi-bedeli/scripts/admin-page.js` - gruplariDuzenle, grupEkle, grupSil, gruplariKaydet, grupDuzenlemeyiKapat fonksiyonları eklendi

---

## [20.01.2026 - 16:55] - Proje Bedeli Modülü - Proje Tipi Seçimi (Asıl/Rölöve)

### ✨ Yeni Özellikler
- **Her branşa Proje Tipi seçimi eklendi**
  - Asıl Proje: %100 çarpan
  - Rölöve Projesi: %10 çarpan
  - Her ikisi de seçilebilir (%110 toplam çarpan)
  - En az biri seçili olmalı

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Proje tipi checkbox'ları ve CSS
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - projeTipiToggle fonksiyonu, bransHesapla güncellendi

---

## [20.01.2026 - 15:50] - Proje Bedeli Modülü - Hizmet Bölümleri Oranları Güncellendi

### 🔄 Güncellenen Özellikler
- **Branşlara göre Hizmet Bölümleri Oranları revize edildi**

  **Mimarlık:** Ön Proje %15, Kesin Proje %20, Uygulama Projesi %30, Detaylar %20, Orjinal Teslimi %5, İhale Dosyası %10

  **İnşaat:** Öneri Raporu %10, Ön Proje %20, Uygulama Projesi %35, Detaylar %20, Orjinal Teslimi %5, İhale Dosyası %10

  **Mekanik:** Öneri Raporu %7, Ön Proje %18, Uygulama Projesi %50, Detaylar %10, Orjinal Teslimi %5, İhale Dosyası %10

  **Elektrik:** Öneri Raporu %7, Ön Proje %20, Uygulama Projesi %50, Detaylar %8, Orjinal Teslimi %5, İhale Dosyası %10

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Tüm branşların hizmet bölümleri oranları

---

## [19.01.2026 - 03:30] - Proje Bedeli Modülü - İmzacı Seçimi (DB Entegrasyonu)

### ✨ Yeni Özellikler
- **Genel Bilgiler sekmesine İmzacı bölümü eklendi**
  - 1-4 arası imzacı seçilebilir
  - İmzacılar `raportorleri` tablosundan dropdown ile seçilir (Yapı Bedeli ile aynı kaynak)
  - Seçim yapıldığında ünvan otomatik doldurulur
  - İmzacı sayısı değiştiğinde branşlardaki seçenekler otomatik güncellenir

- **Her branş için imzacı seçimi eklendi**
  - Mimarlık, İnşaat, Mekanik, Elektrik branşlarında checkbox'lar
  - Hangi imzacıların o branşın raporuna ekleneceği seçilebilir
  - İmzacı seçimi değiştiğinde tüm branşlardaki label'lar güncellenir

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - İmzacı dropdown ve CSS
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - loadRaportorleri, loadRaportorSelect, imzaciSayisiDegisti, imzaciSecimGuncelle fonksiyonları

---

## [19.01.2026 - 03:15] - Proje Bedeli Modülü - Word Rapor Oluşturma (Sayfa 1)

### ✨ Yeni Özellikler
- **Word Raporu Oluştur butonu eklendi**
  - Mor renkli "📄 Word Raporu Oluştur" butonu
  - Tıklandığında Word belgesi oluşturur ve açar

- **Rapor formatı (1. Sayfa - Genel Bilgiler):**
  - Başlık: İşin Adı (CAPITAL, Bold, Ortalı)
  - Alt Başlık: PROJE BEDEL HESABI
  - 1. Genel Bilgiler tablosu (İşin Adı, Yapı Sınıfı/Grubu, Birim Maliyet, Alan, Toplam Maliyet)
  - 2. Proje Bedel İcmali tablosu (4 branş + toplam)
  - 3. İmzacılar tablosu (kenarlıksız)

- **Yazı stili:** Times New Roman, 12pt

### 🔄 Eklenen/Güncellenen Dosyalar
- `modules/proje-bedeli/scripts/pb-reportGenerator.js` (yeni)
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - raporOlustur fonksiyonu
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Rapor Oluştur butonu

---

## [19.01.2026 - 01:30] - Raporlar Tablosu Modül Ayrımı

### 🐛 Hata Düzeltmesi
- **Raporlar tablosuna `modul` alanı eklendi**
  - Her rapor artık hangi modüle ait olduğunu belirtiyor
  - Yapı Bedeli raporları: `modul = 'yapi-bedeli'`
  - Proje Bedeli raporları: `projeBedeliRaporlari` tablosunda (ayrı tablo)
  - Mevcut raporlar otomatik olarak `yapi-bedeli` olarak işaretleniyor

- **Yapı Bedeli raporlar sayfası düzeltildi**
  - Artık sadece `yapi-bedeli` modülüne ait raporları gösteriyor
  - Kıymet Takdiri raporları artık karışmıyor

### 🔄 Güncellenen Dosyalar
- `main.js` - Migration ve CREATE TABLE güncellendi
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - INSERT sorgusuna modul eklendi
- `modules/yapi-bedeli/scripts/raporlar-page.js` - SELECT sorgusuna modul filtresi eklendi

---

## [18.01.2026 - 19:15] - Proje Bedeli Modülü - Kayıtlı Raporlar Sayfası

### ✨ Yeni Özellikler
- **Kayıtlı Raporlar sayfası eklendi**
  - Kaydedilen tüm Proje Bedeli raporlarını listeler
  - Rapor No, İşin Adı, Hesap Yılı, Toplam Maliyet, Toplam Hizmet Bedeli, Kayıt Tarihi sütunları
  - Görüntüle ve Sil butonları
  - "Forma Dön" butonu ile geri dönüş

- **Navigation entegrasyonu yapıldı**
  - "Kayıtlı Raporlar" butonu artık çalışıyor
  - Header'daki "Raporlar" butonu da çalışıyor

### 🔄 Güncellenen/Eklenen Dosyalar
- `modules/proje-bedeli/views/pb-raporlar-content.html` (yeni)
- `modules/proje-bedeli/scripts/pb-raporlar-page.js` (yeni)
- `shared/scripts/navigation.js` - pb-raporlar sayfası eklendi
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - Raporlar butonları güncellendi

---

## [18.01.2026 - 19:10] - Proje Bedeli Modülü - Hesaplama Sekmesi Özet Tablosu

### ✨ Yeni Özellikler
- **Hesaplama sekmesine branş özet tablosu eklendi**
  - 4 branş satır halinde listeleniyor (Mimarlık, İnşaat, Mekanik, Elektrik)
  - Sütunlar: Branş, Hizmet Dalı Katsayısı, Hizmet Sınıfı, PID Oranı, Hizmet Bölümü Oranı, Seçili Hizmet Bedeli
  - En altta Toplam Hizmet Bedeli gösteriliyor
  - Toplam Yapı Maliyeti kartı eklendi

- **"Tüm Branşları Hesapla" butonu eklendi**
  - Tek tıkla tüm branşların hesaplamasını yapar
  - Özet tablosunu otomatik günceller

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Hesaplama sekmesi HTML/CSS
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - tumBranslariHesapla fonksiyonu

---

## [11.01.2026 - 02:35] - Proje Bedeli Modülü - Türkçe Sayı Formatı Düzeltmesi

### 🐛 Hata Düzeltmesi
- **Toplam maliyet branşlara taşınırken sıfırların kaybolması sorunu düzeltildi**
  - Türkçe sayı formatı (6.000.000,00 TL) düzgün parse edilmiyor, 6.000 olarak algılanıyordu
  - Çözüm: Önce binlik ayracı noktalar kaldırılıyor, sonra ondalık virgül noktaya çevriliyor
  - `bransHesapla()` ve `raporKaydet()` fonksiyonları güncellendi

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - Türkçe sayı formatı parse düzeltmesi

---

## [11.01.2026 - 02:20] - Proje Bedeli Modülü - Rapor Kaydetme

### ✨ Yeni Özellikler
- **Rapor kaydetme özelliği aktif edildi**
  - Tüm genel bilgiler ve branş verileri kaydedilir
  - Otomatik rapor numarası oluşturulur (PB-YYYYMMDD-HHMMSS formatında)
  - Her branş için: sınıf, PID oranı, proje bedeli, hizmet oranı, hizmet bedeli, seçili hizmet bölümleri
  - Genel toplam bedel hesaplanır

### 🔄 Güncellenen Dosyalar
- `main.js` - projeBedeliRaporlari tablosu eklendi
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - raporKaydet fonksiyonu eklendi

---

## [11.01.2026 - 02:15] - Proje Bedeli Modülü - Branş Kartları

### ✨ Yeni Özellikler
- **Her branş için renkli kart sistemi eklendi**
  - Mimarlık (Mor), İnşaat (Turuncu), Mekanik (Yeşil), Elektrik (Mavi)
  
- **Kart içerikleri:**
  - Toplam Maliyet: Genel Bilgiler'den otomatik aktarılır
  - Hizmet Dalı Katsayısı: MIM %100, INS %75, MEK %50, ELK %38,5
  - Hizmet Sınıfı: 1-5 arası seçilebilir listbox
  - PID Oranı: m² ve sınıfa göre veritabanından otomatik getirilir (enterpolasyon destekli)
  
- **Hizmet Bölümleri sistemi:**
  - 6 bölüm: Ön Proje (%20), Kesin Proje (%40), Uygulama Projesi (%10), Detay Projesi (%10), Mahal Listesi (%10), Metraj (%10)
  - Checkbox ile seçim, toplam %100
  - Seçili oranlar dinamik olarak güncellenir

- **Hesaplama:**
  - Proje Bedeli = Toplam Maliyet × Hizmet Dalı Katsayısı × PID Oranı
  - Seçili Hizmet Bedeli = Proje Bedeli × Seçili Hizmet Oranı

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Branş kartları HTML/CSS
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - Hesaplama fonksiyonları

---

## [10.01.2026 - 23:56] - Yönetici Paneli - PID Oranları Tablosu

### ✨ Yeni Özellikler
- **Yönetici paneline PID Oranları tabı eklendi**
  - m² satırları: 500, 1000, 2500, 5000, 7500, 10000... 80000, +80000
  - Sütunlar: 1-5 Hizmet Sınıfları
  - Manuel veri girişi için input alanları
  - Kaydet ve Yenile butonları

### 🔄 Güncellenen Dosyalar
- `modules/yapi-bedeli/views/admin-content.html` - PID Oranları tabı eklendi
- `modules/yapi-bedeli/scripts/admin-page.js` - PID yükleme/kaydetme fonksiyonları

---

## [10.01.2026 - 23:37] - Proje Bedeli Modülü - Veritabanı Yapısı

### ✨ Yeni Özellikler
- **PID Oranları tablosu oluşturuldu** (`pidOranlari`)
  - Alan aralıkları (m²) ve hizmet sınıflarına (1-5) göre katsayılar
  - Enterpolasyon için min/max alan değerleri

- **Hizmet Dalı Katsayıları tablosu oluşturuldu** (`hizmetDaliKatsayilari`)
  - Mimarlık (MIM): 1.00
  - İnşaat (INS): 0.75
  - Mekanik (MEK): 0.50
  - Elektrik (ELK): 0.385

### 📊 Proje Bedeli Hesaplama Formülü
```
Proje Bedeli = Toplam Maliyet × Hizmet Dalı Katsayısı × PID Oranı
```
- PID oranı: Alan iki hücre arasındaysa enterpolasyon yapılır

### 🔄 Güncellenen Dosyalar
- `main.js` - PID oranları ve hizmet dalı katsayıları tabloları eklendi

---

## [10.01.2026 - 20:58] - Proje Bedeli Modülü - Genel Bilgiler Tabı

### ✨ Yeni Özellikler
- **Genel Bilgiler tabı form alanları eklendi**
  - İşin Adı
  - Toplam İnşaat Alanı (m²)
  - Hesap Yılı (Yapı Bedeli modülüyle ortak veritabanı)
  - Yapı Sınıfı ve Grubu seçimi
  - Birim Maliyet (otomatik)
  - Toplam Yapı Maliyeti (hesaplanan)

- **Yapı maliyeti hesaplama özelliği**
  - Formül: Toplam Maliyet = Birim Maliyet × Toplam İnşaat Alanı
  - Sıfır yapı olarak hesaplanır (eskime payı ve eksik imalat yok)
  - Yapı Bedeli modülündeki birim fiyat verileri kullanılır

### 🔄 Güncellenen Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Genel Bilgiler form alanları
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - Veritabanı entegrasyonu ve hesaplama mantığı

---

## [07.01.2026 - 12:46] - Proje Bedeli Modülü Tab Yapısı

### ✨ Yeni Özellikler
- **Proje Bedeli modülü temel yapısı oluşturuldu**
  - 3 ana tab: Genel Bilgiler, Branş, Hesaplama
  - Branş tabında 4 alt sekme: Mimarlık, İnşaat, Mekanik, Elektrik
  - Tab ve alt tab navigasyonu çalışır durumda
  - Placeholder içerikler (daha sonra doldurulacak)

### 📁 Yeni Dosyalar
- `modules/proje-bedeli/views/proje-bedeli-content.html` - Modül HTML şablonu
- `modules/proje-bedeli/scripts/proje-bedeli-page.js` - Modül script dosyası

### 🔄 Güncellenen Dosyalar
- `shared/scripts/navigation.js` - Proje Bedeli sayfası navigasyona eklendi
- `dashboard.html` - Proje Bedeli kartı aktif hale getirildi
- `dashboard.js` - Proje Bedeli navigasyon case'i eklendi

---

## [07.01.2026 - 12:32] - Yönetici Paneli Erişim Düzenlemesi

### 🔄 Değişiklik
- **Yönetici Paneli kartı ana sayfaya eklendi**
  - Diğer modül kartlarıyla uyumlu tasarım
  - Aktif durum göstergesi ile

### 🗑️ Kaldırılan Özellikler
- Yapı Bedeli modülü buton panelinden "Yönetici Paneli" butonu kaldırıldı
- `index.html` ve `yapi-bedeli-content.html` dosyalarından yönetici paneli butonları ve CSS stilleri temizlendi

### 📁 Güncellenen Dosyalar
- `dashboard.html` - Yönetici Paneli kartı eklendi
- `dashboard.js` - Admin modülü için navigasyon case'i eklendi
- `modules/yapi-bedeli/views/index.html` - Yönetici paneli butonu ve CSS kaldırıldı
- `modules/yapi-bedeli/views/yapi-bedeli-content.html` - Yönetici paneli butonu ve CSS kaldırıldı

---

## [15.12.2025 - 21:30] - Word Export Fotoğraf Sorunu Düzeltmesi

### 🐛 Hata Düzeltmesi
- **Fotoğraflar Word raporuna eklenmiyor sorunu**
  - `ImageRun` için `type` parametresi eklendi (docx v9+ gereksinimi)
  - Resim tipi (jpg, png, gif, bmp) otomatik algılanıyor
  - Debug logları eklendi (fotoğraf sayısı, boyut, tip bilgisi)

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/reportGenerator.js` - ImageRun type parametresi
- `modules/yapi-bedeli/scripts/editor-page.js` - Debug logları
- `main.js` - export-word handler debug logları

---

## [15.12.2025 - 21:15] - Rapor Sistemi Yeniden Tasarımı (Tek Elden Yönetim)

### 🚀 Büyük Değişiklik
- **Tek Elden Rapor Yönetimi**: Rapor editörü artık tüm rapor işlemlerinin merkezi

### ✨ Yeni Özellikler
1. **Editörde Tam Düzenleme Desteği**
   - Taşınmaz bilgileri (il, ilçe, mahalle, ada, parsel) düzenlenebilir
   - Yapı bilgileri (alan, birim fiyat, yıpranma, eksik imalat) düzenlenebilir
   - Yeni yapı ekleme butonu
   - "Yeniden Hesapla" butonu ile anlık hesaplama
   - Hesaplanan değerler yeşil arka planla vurgulanıyor

2. **Editörde Fotoğraf Yönetimi**
   - Veritabanından fotoğraflar otomatik yükleniyor
   - Yeni fotoğraf ekleme
   - Fotoğraf silme
   - Fotoğraf açıklaması düzenleme
   - Fotoğraf sayısı göstergesi

3. **Gerçek Kaydetme İşlevi**
   - Editördeki tüm değişiklikler veritabanına kaydediliyor
   - Yapı bilgileri, fotoğraflar ve hesaplanan değerler senkronize

4. **Word Export Sadece Editörden**
   - Form sayfasından "Word Rapor Oluştur" butonu kaldırıldı
   - Word indirme sadece editör üzerinden yapılıyor
   - Kaydetme sonrası güncel verilerle export

### 🗑️ Kaldırılan Özellikler
- Form sayfasındaki "Word Rapor Oluştur" butonu kaldırıldı
- `export-word-with-photos` IPC handler artık kullanılmıyor (form sayfasından)

### 🔧 Teknik Değişiklikler
- **editor-page.js**: Tamamen yeniden yazıldı
  - `collectEditorData()`: Editörden veri toplama
  - `kaydet()`: Veritabanına gerçek kaydetme
  - `fotografEkle()`, `fotografSil()`, `fotografAciklamaGuncelle()`: Fotoğraf yönetimi
  - `yeniYapiEkle()`: Yeni yapı satırı ekleme
  - `hesaplaSatir()`, `yenidenHesapla()`: Yapı bedeli hesaplama
  - `guncelleToplamlar()`: Toplam ve levazım bedeli güncelleme
  - `sayiyiYaziyaCevir()`: Tam sayıyı yazıya çevirme

- **editor-content.html**: Yeni CSS stilleri
  - `.ed-inline-edit`: Satır içi düzenlenebilir alanlar
  - `.ed-numeric`: Sayısal hücreler (sağa hizalı)
  - `.ed-calculated`: Hesaplanan hücreler (yeşil arka plan)
  - `.ed-photos-section`: Fotoğraf bölümü
  - `.ed-photo-card`: Fotoğraf kartları
  - `.ed-add-btn`, `.ed-calc-btn`: Aksiyon butonları

- **yapi-bedeli-content.html**: Word Rapor Oluştur butonu kaldırıldı
- **yapi-bedeli-page.js**: Word export event listener kaldırıldı

### 📋 Yeni İş Akışı
```
Form Doldur → Kaydet → Raporlar → Düzenle (Editör) → Word İndir
                                      ↓
                              Fotoğraf Ekle/Sil
                              Yapı Bilgisi Düzenle
                              Yeniden Hesapla
                              Kaydet
```

### 🎯 Kullanıcı Deneyimi
- Tüm rapor düzenleme işlemleri tek yerden yapılıyor
- Fotoğraflar form ve editör arasında senkronize
- Hesaplanan alanlar düzenlenebilir ve yeniden hesaplanabilir
- Word export her zaman güncel verilerle yapılıyor

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/editor-page.js` - Tamamen yeniden yazıldı
- `modules/yapi-bedeli/views/editor-content.html` - Yeni CSS stilleri
- `modules/yapi-bedeli/views/yapi-bedeli-content.html` - Word butonu kaldırıldı
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - Word export listener kaldırıldı

---

## [15.12.2025 - 01:10] - Fotoğraf ve Yapı Bedeli Kaydetme Düzeltmeleri

### 🐛 Hata Düzeltmeleri
- **Fotoğraflar artık veritabanına kaydediliyor**
  - `raporlar` tablosuna `fotograflarJSON` sütunu eklendi (migration)
  - `kaydet()` fonksiyonu fotoğrafları JSON olarak kaydediyor
  - Kayıtlı raporlardan Word export yaparken fotoğraflar da ekleniyor

- **Toplam yapı bedeli artık doğru kaydediliyor**
  - `raporlar` tablosuna `toplamYapiBedeli` sütunu eklendi (migration)
  - `kaydet()` fonksiyonu hesaplama sonrası yapı bedelini kaydediyor
  - Word export'ta yapı bedeli doğru gösteriliyor

- **Kayıtlı raporlardan Word export düzeltildi**
  - `export-word` handler'ı artık fotoğrafları ve yapı bedelini destekliyor
  - Veritabanından fotoğraflar çekilip rapora ekleniyor

### 📁 Güncellenen Dosyalar
- `main.js` - Migration ve export-word handler güncellemesi
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - kaydet() fonksiyonu güncellendi
- `modules/yapi-bedeli/scripts/reportGenerator.js` - Debug logları eklendi

---

## [14.12.2025 - 21:25] - Yönetici Paneli Tam İşlevsellik

### ✨ Yeni Özellikler
- **Birim Fiyat Dönemleri Yönetimi**
  - Yeni dönem ekleme formu
  - Dönem aktif/pasif yapma
  - Dönem silme (detaylarıyla birlikte)

- **Raportör Yönetimi**
  - Yeni raportör ekleme formu (Ad, Soyad, Unvan)
  - Raportör silme (soft delete)
  - Pasif raportörü aktif yapma

- **Kurum Yönetimi**
  - Yeni kurum ekleme formu (Kurum Adı, Alt Birim)
  - Kurum silme (soft delete)
  - Pasif kurumu aktif yapma
  - Alt birim sütunu tabloya eklendi

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/admin-page.js` - Tam CRUD fonksiyonları
- `modules/yapi-bedeli/views/admin-content.html` - Ekleme formları ve tablo güncellemeleri

---

## [14.12.2025 - 21:05] - İlgili Kurum Alt Birim Gösterimi

### 🐛 Hata Düzeltmesi
- **İlgili Kurum dropdown'ında alt birimler artık görünüyor**
  - Kurumlar "Kurum Adı (Alt Birim)" formatında gösteriliyor
  - Örnek: "Samsun Valiliği (Defterdarlık)"

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - `kurumlariDoldur` fonksiyonu

---

## [14.12.2025 - 20:55] - Fotoğraf Ekleme ve Word Rapor Oluşturma

### ✨ Yeni Özellikler
- **Fotoğraf Ekleme Sistemi**
  - Yapı Bilgileri sekmesinde fotoğraf seçme ve önizleme
  - Yatay/Dikey fotoğraf otomatik algılama
  - Her fotoğrafa açıklama ekleme imkanı
  - Fotoğraf silme ve düzenleme

- **Word Rapor Oluşturma (Fotoğraflı)**
  - "📄 Word Rapor Oluştur" butonu eklendi
  - Fotoğraflar 2x2 tablo formatında rapora ekleniyor
  - Her sayfada 4 fotoğraf (rapor sayfasından sonra)
  - Fotoğraf boyutlandırma:
    - Yatay (landscape): max genişlik 7.5 cm
    - Dikey (portrait): max yükseklik 10 cm
  - En-boy oranı korunuyor
  - Fotoğraf açıklamaları italik olarak altına ekleniyor

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - Fotoğraf işleme fonksiyonları
- `modules/yapi-bedeli/scripts/reportGenerator.js` - Fotoğraf sayfaları oluşturma
- `modules/yapi-bedeli/views/yapi-bedeli-content.html` - Word Rapor Oluştur butonu
- `main.js` - `export-word-with-photos` IPC handler

---

## [14.12.2025 - 20:25] - Raportörler Tablosu Hata Düzeltmesi

### 🐛 Hata Düzeltmesi
- **Raportörler tablosu bulunamadı hatası düzeltildi**
  - `yapi-bedeli-page.js` ve `admin-page.js` dosyalarında yanlış tablo adı (`raportorler`) kullanılıyordu
  - Doğru tablo adı `raportorleri` olarak düzeltildi
  - Sütun adları da düzeltildi: `ad` → `adi`, `soyad` → `soyadi`, `unvan` → `unvani`

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/yapi-bedeli-page.js`
- `modules/yapi-bedeli/scripts/admin-page.js`

---

## [10.12.2025 - 16:10] - Tek Pencere Navigasyon Sistemi (Tam Refaktör)

### 🚀 Büyük Değişiklik
- **Tek Pencere Sistemi**: Artık tüm sayfalar tek pencerede açılıyor
- **Navigasyon Stack**: Geri/İleri navigasyon desteği
- **Breadcrumb**: Sayfa geçmişi görsel olarak gösteriliyor

### ✨ Yeni Özellikler
1. **Navigasyon Bar**: Her sayfada üstte görünen navigasyon çubuğu
   - Geri butonu (ESC ile de çalışır)
   - Ana Sayfa butonu (Alt+Home)
   - Breadcrumb (sayfa geçmişi)

2. **Sayfa Modülleri**: Her sayfa bağımsız modül olarak çalışıyor
   - `onLoad()` - Sayfa yüklendiğinde
   - `onUnload()` - Sayfa kapatılırken
   - `hasUnsavedChanges()` - Kaydedilmemiş değişiklik kontrolü

3. **Klavye Kısayolları**:
   - `ESC` - Geri git
   - `Alt+←` - Geri git
   - `Alt+Home` - Ana sayfaya git

### 🔧 Teknik Değişiklikler
- **Yeni Dosyalar**:
  - `shared/scripts/navigation.js` - Navigasyon yöneticisi
  - `modules/yapi-bedeli/views/yapi-bedeli-content.html` - Yapı Bedeli içerik
  - `modules/yapi-bedeli/views/raporlar-content.html` - Raporlar içerik
  - `modules/yapi-bedeli/views/editor-content.html` - Editör içerik
  - `modules/yapi-bedeli/views/admin-content.html` - Admin içerik
  - `modules/yapi-bedeli/scripts/yapi-bedeli-page.js` - Yapı Bedeli modülü
  - `modules/yapi-bedeli/scripts/raporlar-page.js` - Raporlar modülü
  - `modules/yapi-bedeli/scripts/editor-page.js` - Editör modülü
  - `modules/yapi-bedeli/scripts/admin-page.js` - Admin modülü

- **Güncellenen Dosyalar**:
  - `dashboard.html` - Navigasyon bar ve page container eklendi
  - `dashboard.js` - Navigasyon sistemi entegrasyonu
  - `main.js` - Eski IPC handler'ları kaldırıldı

### 📋 Navigasyon Akışı
```
Dashboard → Yapı Bedeli → Kayıtlı Raporlar → Editör
     ↑           ↑              ↑              ↑
     └───────────┴──────────────┴──────────────┘
                    Geri Tuşu / ESC
```

### 🎯 Kullanıcı Deneyimi
- Artık pencereler üst üste açılmıyor
- Tek pencerede tüm işlemler yapılabiliyor
- Geri tuşu ile önceki sayfaya dönülebiliyor
- Breadcrumb ile sayfa geçmişi görülebiliyor
- Kaydedilmemiş değişiklik uyarısı

### ⚠️ Notlar
- Ön izleme penceresi hâlâ ayrı pencere olarak açılıyor (modal)
- Word export işlemi aynı şekilde çalışıyor
- Eski bağımsız HTML dosyaları (index.html, raporlar.html vb.) hâlâ mevcut (geriye dönük uyumluluk)

---

## [10.12.2025 - 13:38] - Rapor Editörü ve Word Export Senkronizasyonu

### 🔄 Senkronizasyon
- **Editör ve Word Generator Uyumu**: Rapor editörü ile Word export çıktısı artık tamamen senkron

### ✨ İyileştirmeler
1. **Paragraf Boşlukları Azaltıldı**: Word çıktısında gereksiz boşluklar kaldırıldı
   - `spacing.after`: 400 → 200
   - `spacing.before/after`: 200 → 120
   - Boş paragraflar minimize edildi

2. **Yapı Sınıfı + Grup Birleştirildi**: 
   - YAPI SINIFI sütununda artık sınıf ve grup birlikte gösteriliyor
   - Örnek: "5" yerine "5 A" formatında

3. **İmzacılar Font Boyutu**: 9pt → 11pt (size: 18 → 22 half-points)

4. **Para Formatı Türkçe Standartına Uyarlandı**:
   - Basamak ayracı: Nokta (.)
   - Kuruş ayracı: Virgül (,)
   - Örnek: `24,221,400.00` → `24.221.400,00 TL`
   - Birim fiyat ve yapı bedeli alanlarına "TL" eklendi

### 🔧 Teknik Değişiklikler
- **reportGenerator.js**:
  - `formatParaTR()` fonksiyonu eklendi
  - Yapı sınıfı + grup birleştirme mantığı eklendi
  - Tüm para değerleri Türkçe formata çevrildi
  - İmzacı tablosu font boyutu güncellendi

- **editor.js**:
  - `formatPara()` fonksiyonu Türkçe formata güncellendi
  - Gerekçe metni Word formatına uyarlandı
  - Taşınmaz bilgileri tablosu yatay formata çevrildi
  - Yapı tablosu sütun sırası Word ile senkronize edildi
  - Son paragraf Word formatına uyarlandı

### 📋 Editör-Word Uyumu
| Bölüm | Durum |
|-------|-------|
| Gerekçe Metni | ✅ Senkron |
| Taşınmaz Bilgileri | ✅ Senkron (Yatay tablo) |
| Yapı Bilgileri | ✅ Senkron (Sınıf+Grup birleşik) |
| Toplam Bedel | ✅ Senkron (Türkçe format) |
| Levazım Bedeli | ✅ Senkron |
| Son Paragraf | ✅ Senkron |
| İmzacılar | ✅ Senkron (11pt) |

---

## [05.12.2025 - 00:05] - Rapor Editörü Eklendi

### ✨ Yeni Özellikler
1. **Rapor Editörü**: Kayıtlı raporları düzenleyebileceğiniz yeni bir editör penceresi eklendi
   - Metin ekleme, silme, değiştirme
   - Geri Al / Yinele (Ctrl+Z / Ctrl+Y)
   - Kes / Kopyala / Yapıştır
   - Tümünü Seç
   - Değişiklik takibi (kaydedilmemiş değişiklik uyarısı)

2. **Ön İzleme Penceresi**: Raporu A4 formatında ön izleyebileceğiniz bağımsız pencere
   - Gerçek zamanlı A4 görünümü
   - Zoom kontrolü (büyüt/küçült/sıfırla)
   - Yazdırma desteği
   - Word export desteği

3. **Word Export**: Raporları Word (.docx) formatında indirebilme
   - Editörden direkt export
   - Ön izlemeden export
   - Dosya kaydetme dialogu

### 🔧 Teknik Değişiklikler
- **Yeni Dosyalar**:
  - `modules/yapi-bedeli/views/editor.html` - Editör arayüzü
  - `modules/yapi-bedeli/scripts/editor.js` - Editör mantığı
  - `modules/yapi-bedeli/views/preview.html` - Ön izleme arayüzü
  - `modules/yapi-bedeli/scripts/preview.js` - Ön izleme mantığı

- `main.js`:
  - `open-editor` IPC handler eklendi
  - `open-preview` IPC handler eklendi
  - `export-word` IPC handler eklendi
  - `export-word-from-preview` IPC handler eklendi

- `raporlar.js`:
  - "Düzenle" butonu eklendi (mavi renk, 📝 ikonu)

### 📋 Kullanım
1. **Kayıtlı Raporlar** sayfasına gidin
2. Düzenlemek istediğiniz raporun yanındaki **"📝 Düzenle"** butonuna tıklayın
3. Editör penceresinde raporu düzenleyin
4. **"👁️ Ön İzleme"** butonu ile ayrı pencerede ön izleme yapın
5. **"📥 Word İndir"** butonu ile Word dosyası olarak kaydedin
6. **"💾 Kaydet"** butonu ile değişiklikleri veritabanına kaydedin

### ⌨️ Klavye Kısayolları
- `Ctrl+S` - Kaydet
- `Ctrl+Z` - Geri Al
- `Ctrl+Y` - Yinele
- `Ctrl+P` - Ön İzleme

---

## [04.12.2025 - 23:25] - Yıpranma Payları Yönetim Sistemi Eklendi

### ✨ Yeni Özellikler
1. **Yıpranma Payları Tablosu**: Yönetim panelinde yıpranma paylarını düzenleyebileceğiniz yeni bir tablo eklendi
   - 8 farklı yapım tekniği destekleniyor:
     - Çelik
     - Betonarme Karkas
     - Yığma Kagir
     - Yığma Yarı Kagir
     - Ahşap
     - Taş Duvarlı (Çamur Harçlı)
     - Kerpiç
     - Diğer Basit Binalar
   - Her yapım tekniği için yaş aralıklarına göre yıpranma oranları tanımlanabilir
   - Tablo düzenlenebilir ve değişiklikler veritabanına kaydedilebilir

2. **Veritabanı Desteği**: `yipranmaPaylari` tablosu eklendi
   - Yapım tekniği, yaş aralığı ve yıpranma oranı bilgilerini saklar
   - Varsayılan değerler otomatik olarak yüklenir

3. **Yönetim Paneli Fonksiyonları**:
   - Yıpranma paylarını görüntüleme ve düzenleme
   - Değişiklikleri kaydetme
   - Varsayılana sıfırlama
   - Yeni yaş aralığı ekleme
   - Yaş aralığı silme

### 🔧 Teknik Değişiklikler
- `main.js`:
  - `yipranmaPaylari` tablosu oluşturma kodu eklendi
  - Varsayılan yıpranma payı verileri eklendi (8 yapım tekniği x 8 yaş aralığı = 64 kayıt)

- `admin.html`:
  - Yıpranma Payı Yönetimi sekmesi güncellendi
  - Düzenlenebilir tablo arayüzü eklendi
  - Yeni yaş aralığı ekleme formu eklendi

- `admin.js`:
  - `yipranmaPaylariniYukle()` fonksiyonu eklendi
  - `yipranmaPaylariniKaydet()` fonksiyonu eklendi
  - `varsayilanYipranmaPaylariniYukle()` fonksiyonu eklendi
  - `yeniYasAraligiEkle()` fonksiyonu eklendi
  - `yasAraligiSil()` fonksiyonu eklendi

- `renderer.js`:
  - Yapım teknikleri listesi 8 adede güncellendi
  - `loadYipranmaPaylari()` fonksiyonu eklendi (veritabanından yükleme)
  - `hesaplaYipranmaPay()` fonksiyonu veritabanından çalışacak şekilde güncellendi
  - Yapı formundaki yapım tekniği seçenekleri güncellendi

### 📋 Kullanım
1. Yönetim Paneli'ni açın
2. "Yıpranma Payı Yönetimi" sekmesine tıklayın
3. Tablodaki değerleri düzenleyin
4. "Değişiklikleri Kaydet" butonuna tıklayın

---

## [25.11.2025 - 00:50] - Raporlar Görünmeme Sorunu Düzeltildi

### 🐛 Düzeltilen Sorunlar
1. **Kayıtlı Raporlar Görünmüyordu**: Raporlar kaydediliyordu ama listede görünmüyordu
   - Sorun 1: İki farklı veritabanı dosyası vardı
     - Ana dizin: `raporlar.db` (doğru)
     - Yanlış konum: `modules/yapi-bedeli/views/raporlar.db` (silinmiş)
   - Sorun 2: Veritabanı sorgusu DOM yüklenmeden önce çalışıyordu
   - Sorun 3: `reportGenerator` modülü import hatası (Cannot find module './reportGenerator')
   - Sorun 4: **@electron/remote is disabled** - Her yeni pencere için enable edilmesi gerekiyordu

### ✅ Uygulanan Çözümler
- Yanlış konumdaki veritabanı dosyası silindi
- Tüm scriptler artık aynı veritabanını kullanıyor
- **Veritabanı sorgusu DOMContentLoaded içine alındı**
- `loadRaporlar()` fonksiyonu oluşturuldu
- **reportGenerator import yolu düzeltildi** (path.join ile tam yol)
- **Her yeni pencere için remoteMain.enable() çağrısı eklendi** (main.js)
- Gereksiz @electron/remote import'u kaldırıldı (raporlar.js)
- Boş rapor listesi için mesaj eklendi
- Debug için console.log'lar eklendi
- Raporlar artık ID'ye göre azalan sırada gösteriliyor (ORDER BY id DESC)

### 🔧 Teknik Değişiklikler
- `main.js`:
  - Her yeni pencere için `remoteMain.enable()` eklendi
- `raporlar.js`: 
  - Veritabanı bağlantı kontrolü eklendi
  - Kayıt sayısı console'a yazdırılıyor
  - Raporlar ters sırada (en yeni üstte)
  - **Script yolu çözümü**: `module.filename` kullanılarak doğru yol bulunuyor
  - reportGenerator ve veritabanı yolları scriptPath'e göre hesaplanıyor

### 📋 Test Adımları
1. Uygulamayı yeniden başlatın
2. Yeni bir rapor kaydedin
3. "Kayıtlı Raporlar" butonuna tıklayın
4. Rapor listede görünmeli (en üstte)

---

## [24.11.2025 - 23:55] - Yeni Pencere Sistemine Geri Dönüş

### 🔄 Önemli Değişiklik
- **iframe Sorunu Çözüldü**: iframe içinde Node.js modülleri çalışmadığı için yeni pencere sistemine geri döndük
- Her modül artık ayrı bir BrowserWindow'da açılıyor
- Butonlar ve tab geçişleri artık düzgün çalışıyor

### 🐛 Düzeltilen Sorunlar
- ✅ Butonlar çalışmıyor sorunu çözüldü
- ✅ Tab geçişleri aktif
- ✅ Form işlemleri çalışıyor
- ✅ Veritabanı bağlantısı sorunsuz

### 🔧 Teknik Değişiklikler
- **main.js**: IPC handler'ları yeni BrowserWindow açacak şekilde güncellendi
- **dashboard.js**: iframe yerine IPC ile yeni pencere açma
- **dashboard.html**: iframe container'ları kaldırıldı
- **renderer.js**: Navigasyon butonları pencere kapatma için güncellendi
- **raporlar.js**: Navigasyon butonları güncellendi

### 📋 Yeni Davranış
- **Anasayfa Butonu**: Mevcut pencereyi kapatır
- **Modül Kartları**: Yeni pencere açar
- **Raporlar/Admin**: Yeni pencere açar
- **Form Verisi**: Her pencere bağımsız çalışır

### ⚠️ Not
- Tek pencere sistemi Electron'da iframe ile Node.js modüllerini desteklemiyor
- Bu nedenle klasik çoklu pencere sistemine geri döndük
- Her modül kendi BrowserWindow'unda çalışıyor
- Form verileri artık sessionStorage yerine her pencerede bağımsız

---

## [24.11.2025 - 23:50] - Rapor No Alanı Kaldırıldı

### 🗑️ Kaldırılan Özellik
- **Rapor No Alanı**: Genel Bilgiler formundan "Rapor No" alanı kaldırıldı
- Artık raporlar sadece otomatik ID ile tanımlanıyor
- Kullanıcıdan manuel rapor numarası girişi istenmiyor

### 🔧 Teknik Değişiklikler
- `index.html`: Rapor No input alanı kaldırıldı
- `renderer.js`: 
  - raporNo değişkeni ve kontrolleri kaldırıldı
  - Veritabanı INSERT sorgusu güncellendi
  - Form verisi kaydetme/yükleme fonksiyonlarından raporNo kaldırıldı
  - Başarı mesajından "Rapor No" bilgisi çıkarıldı
- `main.js`: Veritabanı şemasından raporNo kolonu kaldırıldı (yeni tablolar için)

### 📋 Etkilenen Dosyalar
- `modules/yapi-bedeli/views/index.html`
- `modules/yapi-bedeli/scripts/renderer.js`
- `main.js`

### ⚠️ Not
- Mevcut veritabanlarında raporNo kolonu kalacak (geriye dönük uyumluluk)
- Yeni kayıtlarda bu alan kullanılmayacak
- Raporlar artık sadece otomatik ID ile tanımlanıyor

---

## [24.11.2025 - 23:32] - Modern Renk Paleti Uygulaması

### 🎨 Yeni Renk Paleti (#2A4C6E Ana Renk)
Uygulamanın tüm UI bileşenleri modern ve profesyonel bir renk paletine dönüştürüldü.

**Ana Renkler:**
- **Primary**: #2A4C6E (Ana marka rengi)
- **Primary Light**: #3C6B99 (Hover durumları)
- **Primary Dark**: #1D364E (Dark mode)
- **Secondary**: #4B7FA3 (İkincil vurgu)
- **Accent**: #E7B34C (Önemli çağrı alanları)

**Arka Plan Renkleri:**
- **Ana Arka Plan**: #F5F7FA (Açık gri-mavi)
- **İkincil Arka Plan**: #E8ECF2 (Kartlar, kutucuklar)
- **Kart Arka Plan**: #FFFFFF
- **Kart Border**: #D3DAE3

**Durum Renkleri:**
- **Success**: #4CAF50 (Başarılı işlemler)
- **Warning**: #FFC107 (Uyarı mesajları)
- **Danger**: #E53935 (Hatalar, kritik işlemler)
- **Info**: #2196F3 (Bilgilendirme)

**Yazı Renkleri:**
- **Başlık**: #1A1A1A
- **Gövde**: #333333
- **Açıklama/Pasif**: #6F7A86

**Input/Field Renkleri:**
- **Input Border**: #C9D1DB
- **Input Focus**: #2A4C6E
- **Placeholder**: #9AA4B2

### 🎯 Güncellenen Sayfalar
1. **dashboard.html**: Ana sayfa renk paleti
   - Arka plan gradient: #2A4C6E → #1D364E
   - Kart renkleri ve border'lar
   - Aktif/Yakında badge'leri
   - Hover efektleri

2. **index.html (Yapı Bedeli)**: Form sayfası
   - Header gradient: #2A4C6E → #3C6B99
   - Tab navigasyon renkleri
   - Input ve select stilleri
   - Buton renkleri (Primary, Secondary, Success, Warning, Info)
   - Navigation butonları

3. **raporlar.html**: Raporlar listesi
   - Header ve tablo renkleri
   - Buton renkleri (Sil, Revize, Hesapla)
   - Hover efektleri

4. **admin.html**: Yönetim paneli
   - Tab navigasyon
   - Form elementleri
   - Tablo başlıkları
   - Durum badge'leri
   - Alert mesajları

### 🔧 Teknik Detaylar
- Tüm gradient renkler düz renklerle değiştirildi (performans)
- Box shadow değerleri normalize edildi: `rgba(0, 0, 0, 0.08)` ve `rgba(0, 0, 0, 0.12)`
- Border renkleri tutarlı hale getirildi: #D3DAE3, #D8DFE6
- Focus state'leri için ring efekti: `box-shadow: 0 0 0 3px rgba(42, 76, 110, 0.1)`
- Hover efektleri için transform ve renk değişimleri optimize edildi

### 🎨 Tasarım Prensipleri
- **Tutarlılık**: Tüm sayfalarda aynı renk paleti
- **Erişilebilirlik**: Yeterli kontrast oranları
- **Modern Görünüm**: Düz renkler ve minimal gölgeler
- **Profesyonellik**: Kurumsal renk tonu (#2A4C6E)
- **Kullanıcı Deneyimi**: Görsel hiyerarşi ve net ayrımlar

### 📁 Güncellenen Dosyalar
- `dashboard.html`: Ana sayfa renk paleti
- `modules/yapi-bedeli/views/index.html`: Form sayfası renkleri
- `modules/yapi-bedeli/views/raporlar.html`: Raporlar sayfası renkleri
- `modules/yapi-bedeli/views/admin.html`: Admin paneli renkleri
- `CHANGELOG.md`: Bu güncelleme kaydı

### 🎯 Kullanıcı Deneyimi
- Daha profesyonel ve modern görünüm
- Göz yormayan renk tonları
- Net ve anlaşılır durum göstergeleri
- Tutarlı görsel kimlik
- Geliştirilmiş okunabilirlik

### 📊 Renk Kartelası Özeti
```
Ana: #2A4C6E, #3C6B99, #1D364E
İkincil: #4B7FA3, #E7B34C, #F3C870
Arka Plan: #F5F7FA, #E8ECF2, #FFFFFF
Durum: #4CAF50, #FFC107, #E53935, #2196F3
Yazı: #1A1A1A, #333333, #6F7A86
Border: #D3DAE3, #C9D1DB, #D8DFE6
```

---

## [24.11.2025 - 23:45] - Tek Pencere Navigasyon Sistemi

### 🎯 Yeni Navigasyon Sistemi
- **Tek Pencere Uygulaması**: Artık tüm modüller ve sayfalar aynı pencerede açılıyor
- **Anasayfa Navigasyonu**: Her sayfadan anasayfaya dönüş butonu
- **Form Verisi Koruma**: Sayfa geçişlerinde form verileri kaybedilmiyor
- **Raporlar Sayfası Entegrasyonu**: Forma dön butonu ile veriler korunarak geri dönüş

### ✨ Yeni Özellikler
- **Navigasyon Butonları**: 
  - 🏠 Anasayfa butonu (her modülde)
  - 📊 Raporlar butonu (form sayfasında)
  - 📝 Forma Dön butonu (raporlar sayfasında)
- **Form Verisi Yönetimi**:
  - Otomatik form verisi kaydetme (sessionStorage)
  - Sayfa geçişlerinde veri geri yükleme
  - Çoklu yapı desteği ile tam uyumlu
- **ESC Tuşu Desteği**: ESC ile anasayfaya dönüş

### 🎨 UI İyileştirmeleri
- **Mobil Uyumlu Butonlar**: Minimum 44x44px dokunma alanı
- **Responsive Header**: Mobilde wrap olan navigasyon butonları
- **Modern Tasarım**: Gradient renkler ve hover efektleri
- **Tutarlı Görünüm**: Tüm sayfalarda aynı header stili

### 🔧 Teknik Değişiklikler
- **IPC Sistemi**: Yeni pencere açmak yerine event tabanlı navigasyon
- **iframe Container**: Modül içerikleri iframe'lerde gösteriliyor
- **Content Switching**: JavaScript ile dinamik içerik değiştirme
- **State Management**: currentView ile navigasyon durumu takibi

### 📁 Güncellenen Dosyalar
- `main.js`: IPC handler'ları tek pencere sistemi için güncellendi
- `dashboard.html`: iframe container'ları eklendi
- `dashboard.js`: Navigasyon fonksiyonları ve event listener'lar
- `modules/yapi-bedeli/views/index.html`: Header'a navigasyon butonları
- `modules/yapi-bedeli/scripts/renderer.js`: Form verisi kaydetme/yükleme
- `modules/yapi-bedeli/views/raporlar.html`: Navigasyon butonları
- `modules/yapi-bedeli/scripts/raporlar.js`: Navigasyon event listener'ları

### 🎯 Kullanıcı Deneyimi
- Tek pencerede tüm işlemler yapılabiliyor
- Form verileri kaybolmuyor
- Hızlı ve akıcı sayfa geçişleri
- Mobil cihazlarda kullanım kolaylığı
- Tutarlı navigasyon deneyimi

### 📱 Mobil Optimizasyonlar
- Touch-friendly butonlar (min 44x44px)
- Responsive header tasarımı
- Flex-wrap ile mobilde düzgün görünüm
- Viewport meta tag desteği

---

## [24.11.2025 - 23:20] - Çoklu Yapı Sistemi Hata Düzeltmeleri

### 🐛 Hata Düzeltmeleri
- **populateYapiGruplari Hatası**: Eski tek yapı sistemi için event listener'lar kaldırıldı
- **Veritabanı Kolonu Eksikliği**: `yapilarJSON` kolonu `raporlar` tablosuna eklendi
- **Migration Sistemi**: Mevcut veritabanlarına otomatik kolon ekleme desteği

### 🔧 Teknik Düzeltmeler
- Eski yapı alanları için event listener'lar temizlendi
- `yapilarJSON` kolonu için migration kodu eklendi
- Veritabanı şeması güncellendi

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/renderer.js`: Event listener temizliği
- `main.js`: Veritabanı şeması ve migration güncellemesi

---

## [24.11.2025 - 23:15] - Yapı Bedeli Modülü Çoklu Yapı Desteği

### ✨ Yeni Özellikler
- **Çoklu Yapı Ekleme**: Bir raporda birden fazla yapı eklenebiliyor
- **Yapı No Default Değer**: Yapı numarası otomatik olarak 1'den başlayarak artıyor
- **Dinamik Yapı Yönetimi**: Yapı ekleme/silme butonları ile esnek yapı yönetimi
- **Yapı Maliki Kaldırıldı**: Yapı Maliki alanı formdan kaldırıldı

### 📝 Form Güncellemeleri
- **Genel Bilgiler**: Rapor No artık isteğe bağlı (zorunlu değil)
- **Arsa Bilgileri**: Malik İsmi ve Yüzölçümü isteğe bağlı yapıldı
- **Yapı Bilgileri**: 
  - Yapı No default olarak 1 ile başlıyor
  - Yapı Maliki alanı kaldırıldı
  - "Yeni Yapı Ekle" butonu eklendi
  - Her yapı için ayrı form kartı
  - Yapı silme özelliği (en az 1 yapı zorunlu)

### 🔧 Teknik İyileştirmeler
- **Veritabanı**: Yapılar JSON formatında `yapilarJSON` alanında saklanıyor
- **Hesaplama**: Tüm yapıların bedelleri toplanarak toplam yapı bedeli hesaplanıyor
- **Rapor Formatı**: Çoklu yapı desteği ile her yapı tabloda ayrı satırda görünüyor
- **Backward Compatibility**: Eski tek yapı formatı ile uyumluluk korundu

### 📊 Rapor Formatı Değişiklikleri
- Yapı Bilgileri tablosunda her yapı için ayrı satır
- Toplam yapı bedeli tüm yapıların toplamı olarak hesaplanıyor
- Levazım bedeli toplam yapı bedelinin %52.5'i olarak hesaplanıyor

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/views/index.html`: Çoklu yapı formu ve UI
- `modules/yapi-bedeli/scripts/renderer.js`: Yapı yönetimi fonksiyonları
- `modules/yapi-bedeli/scripts/reportGenerator.js`: Çoklu yapı rapor formatı

### 🎯 Kullanıcı Deneyimi
- Birden fazla yapı tek raporda yönetilebiliyor
- Her yapı için ayrı hesaplama ve görüntüleme
- Yapı ekleme/silme işlemleri kullanıcı dostu
- Yapı numaraları otomatik düzenleniyor

---

## [23.11.2025 - 16:10] - Ana Logo Güncellendi

### 🎨 Logo Revizyonu
- **Yeni Logo**: Daha detaylı ve profesyonel logo tasarımı (`image (1).jpg`)
- **Görsel İyileştirme**: 
  - Merkezi "A" harfi vurgusu
  - Yapı/bina görseli (üstte)
  - Grafik/analiz görseli (sol altta)
  - Artı işareti/ekleme görseli (sağ altta)
  - Doküman/rapor görseli (orta altta)
- **Renk Uyumu**: Mavi tonları proje renk paletiyle tam uyumlu
- **Bağlantı Şeması**: Tüm modüllerin merkezi "A" ile bağlantısı görsel olarak temsil ediliyor

### 📁 Güncellenen Dosyalar
- `assets/proje-a-logo.jpg`: Yeni logo ile değiştirildi
- `assets/icon.png`: Electron ikonu güncellendi

### 🎯 Tasarım Anlayışı
- Proje A'nın tüm modüllerini merkezi bir yapıda temsil ediyor
- Daha profesyonel ve kurumsal görünüm
- Modüler yapıyı görsel olarak vurguluyor

---

## [23.11.2025 - 14:26] - Proje A Ana Logo Eklendi

### 🎨 Logo Entegrasyonu
- **Ana Logo**: Proje A'nın resmi logosu eklendi (`5.jpg` → `proje-a-logo.jpg`)
- **Dashboard Header**: Logo header'da görüntüleniyor (120x120px, yuvarlatılmış köşeler)
- **Electron İkon**: Uygulama pencere ikonu olarak ayarlandı
- **Hover Efekti**: Logo üzerine gelindiğinde hafif büyüme animasyonu

### 📁 Yeni Dosyalar
- `assets/proje-a-logo.jpg`: Dashboard header logosu
- `assets/icon.png`: Electron pencere ikonu

### 🔧 Teknik Detaylar
- Logo boyutu: 120x120px
- Border radius: 24px
- Box shadow: `rgba(42, 76, 110, 0.4)`
- Hover scale: 1.05
- Header yapısı: Flexbox (logo + content)

### 📁 Güncellenen Dosyalar
- `dashboard.html`: Header'a logo ve yeni stil eklendi
- `main.js`: Electron pencere ikonu eklendi

### 🎯 Görsel İyileştirme
- Profesyonel logo görünümü
- Tüm modülleri temsil eden görsel
- Marka kimliği güçlendirildi
- Roket emoji kaldırıldı, logo ile değiştirildi

---

## [23.11.2025 - 13:41] - Proje Renk Paleti Revizyonu

### 🎨 Yeni Renk Paleti
Modül ikonlarındaki renklerle uyumlu yeni renk şeması uygulandı:

**Ana Renkler:**
- **Arka Plan Gradient**: `#2A4C6E` → `#496A24` (Lacivert/Koyu Mavi → Yeşilimsi-Mavi)
- **Açık Mavi/Vurgu**: `#88AACC` (Detaylar ve hover efektleri için)
- **Beyaz/Açık Gri**: `#F5F6F6` (Kartlar, yazılar ve detaylar)

**Uygulanan Alanlar:**
- Body arka planı: Mor-pembe gradientten → Lacivert-yeşil gradient
- Kartlar: Beyaz → `#F5F6F6` (ikon renklerine uyumlu)
- Kart border: `#88AACC` tonu ile ince çerçeve
- Header metinleri: `#F5F6F6`
- Footer metinleri: `#F5F6F6`
- Aktif badge: `#2A4C6E` → `#496A24` gradient
- Yakında badge: `#88AACC` → `#2A4C6E` gradient
- Coming Soon overlay: `#2A4C6E` arka plan
- Hover efektleri: `#88AACC` vurgu rengi
- Gölgeler: `rgba(42, 76, 110, 0.3-0.4)` tonları

### 🎯 Tasarım Tutarlılığı
- Modül ikonlarının renk paleti ile tam uyum
- Profesyonel ve kurumsal görünüm
- Daha yumuşak ve göze hoş gelen tonlar
- Tüm UI elementlerinde renk tutarlılığı

### 📁 Güncellenen Dosyalar
- `dashboard.html`: Tüm CSS renk değerleri güncellendi

---

## [23.11.2025 - 13:17] - Proje Bedeli Modülü İkonu ve Açıklaması Güncellendi

### 🎨 Görsel Güncelleme
- **Proje Bedeli İkonu**: Özel tasarım PNG ikon eklendi (`proje-bedeli-icon.png`)
- **Modül Klasör Yapısı**: `modules/proje-bedeli/assets/` klasörü oluşturuldu
- Emoji yerine profesyonel PNG ikon kullanımı

### 📝 İçerik Güncellemesi
- **Proje Bedeli Açıklaması**: "Güncel mevzuata uygun şekilde proje bedeli hesabı ve rapor oluşturma."
- Yapı Bedeli ile tutarlı açıklama formatı

### 📁 Yeni Dosyalar
- `modules/proje-bedeli/assets/proje-bedeli-icon.png`: Proje Bedeli modül ikonu

### 📁 Güncellenen Dosyalar
- `dashboard.html`: Proje Bedeli kartı güncellendi

---

## [23.11.2025 - 13:10] - Anasayfa Kartları Yeniden Tasarlandı

### 🎨 Yeni Tasarım
- **Yatay Düzen**: İkon, başlık ve badge artık yan yana görünüyor
- **Yapı Bedeli İkonu**: Özel tasarım PNG ikon eklendi (`yapi-bedeli-icon.png`)
- **Modül Klasör Yapısı**: `modules/yapi-bedeli/assets/` klasörü oluşturuldu
- **Flexbox Layout**: Modern flex düzeni ile daha düzenli görünüm
- **İkon Boyutları**: 
  - PNG ikonlar: 56x56px
  - Emoji ikonlar: 56px font-size

### 📝 İçerik Güncellemeleri
- **Yapı Bedeli Açıklaması**: "Güncel mevzuata uygun şekilde yapı bedel hesabı ve rapor oluşturma."
- Daha kısa ve öz açıklamalar

### 🔧 Teknik Detaylar
- `.module-header`: İkon + başlık + badge container
- `.module-title-container`: Başlık ve badge yan yana
- `.module-icon`: Hem `<img>` hem emoji desteği
- Responsive tasarım korundu

### 📁 Yeni Dosyalar
- `modules/yapi-bedeli/assets/yapi-bedeli-icon.png`: Yapı Bedeli modül ikonu

### 📁 Güncellenen Dosyalar
- `dashboard.html`: Kart yapısı ve stiller yeniden tasarlandı

---

## [23.11.2025 - 12:45] - Anasayfa Kartları Kompakt Hale Getirildi

### 🎨 UI İyileştirmesi
- **Daha Kompakt Kartlar**: Anasayfadaki modül kartları daha az yer kaplayacak şekilde optimize edildi
- **Özellik Listesi Kaldırıldı**: Tik işaretiyle başlayan modül özellik listeleri kaldırıldı
- **Boyut Optimizasyonu**: 
  - Kart padding: 35px → 25px
  - İkon boyutu: 64px → 48px
  - Başlık boyutu: 26px → 22px
  - Açıklama boyutu: 15px → 14px
  - Durum badge boyutu: 13px → 12px
- **Temiz Görünüm**: Kartlar artık sadece ikon, durum, başlık ve kısa açıklama içeriyor

### 📁 Güncellenen Dosyalar
- `dashboard.html`: Kart stilleri ve HTML içeriği güncellendi

### 🎯 Kullanıcı Deneyimi
- Daha minimal ve modern görünüm
- Ekranda daha fazla içerik görünüyor
- Daha hızlı tarama ve modül seçimi

---

## [22.11.2025 - 16:21] - Veritabanı Bağlantı Yolu Düzeltildi

### 🐛 Hata Düzeltme
- **Veritabanı Erişim Sorunu**: Klasör ismi değişikliği sonrası modül scriptleri veritabanına erişemiyordu
- Tüm modül scriptlerinde veritabanı yolu ana dizine yönlendirildi
- `__dirname` yerine `path.join(__dirname, '..', '..', '..', 'raporlar.db')` kullanılarak 3 seviye yukarı çıkıldı
- İlgili Kurum, Hesap Dönemi, Raportör seçimleri artık veritabanından düzgün yükleniyor

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/renderer.js`: Veritabanı yolu düzeltildi
- `modules/yapi-bedeli/scripts/admin.js`: Veritabanı yolu düzeltildi
- `modules/yapi-bedeli/scripts/raporlar.js`: Veritabanı yolu düzeltildi

### 🔧 Teknik Detay
- Yol yapısı: `scripts -> yapi-bedeli -> modules -> projeA/raporlar.db`
- Tüm modül scriptleri artık ana dizindeki `raporlar.db` dosyasına erişebiliyor

---

## [22.11.2025 - 16:16] - Rapor Tarihi Otomatik Doldurma

### ✨ Yeni Özellik
- **Rapor Tarihi**: Genel Bilgiler tabındaki "Rapor Tarihi" alanı artık sayfa yüklendiğinde otomatik olarak bugünün tarihi ile dolduruluyor
- Sistem tarihinden çekilerek YYYY-MM-DD formatında atanıyor

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/scripts/renderer.js`: `window.onload` fonksiyonuna tarih atama kodu eklendi

---

## [22.11.2025 - 16:12] - Yapı Bedeli Modülü Başlık Güncellendi

### 🎨 UI Güncellemesi
- **Başlık Değişikliği**: `index.html` sayfasındaki başlık "Kıymet Takdir Raporu" yerine "Yapı Bedeli Modülü" olarak güncellendi
- Modül adı artık daha açık ve net bir şekilde gösteriliyor

### 📁 Güncellenen Dosyalar
- `modules/yapi-bedeli/views/index.html`: Header başlığı güncellendi

---

## [22.11.2025 - 14:53] - Ana Sayfa (Dashboard) Eklendi

### 🎨 Yeni Özellikler
- **Modern Dashboard**: Modül seçim ekranı oluşturuldu
  - Kart tabanlı modern tasarım
  - Gradient renkler ve animasyonlar
  - Hover efektleri ve geçişler
  - Responsive tasarım
- **Modül Kartları**: 4 modül kartı ile görsel sunum
  - ✅ Yapı Bedeli (Aktif)
  - 🚧 Proje Bedeli (Yakında)
  - 🚧 Mevzuat (Yakında)
  - 🚧 Hesaplama (Yakında)
- **İnteraktif Özellikler**:
  - Aktif modüllere tıklayınca modül açılıyor
  - Pasif modüllerde "Çok Yakında" bildirimi
  - Sallama animasyonu ve toast notification
  - Klavye desteği (ESC ile kapat)

### 📁 Yeni Dosyalar
- `dashboard.html`: Ana sayfa UI
- `dashboard.js`: Dashboard mantığı ve IPC iletişimi

### 🔄 Güncellemeler
- **main.js**: 
  - Ana pencere artık dashboard'u yüklüyor
  - `open-yapi-bedeli` IPC handler'ı eklendi
  - Diğer modüller için placeholder handler'lar
  - Pencere boyutu 1400x900 olarak güncellendi
- **IPC Events**:
  - `open-yapi-bedeli`: Yapı Bedeli modülünü aç
  - `open-proje-bedeli`: Proje Bedeli (placeholder)
  - `open-mevzuat`: Mevzuat (placeholder)
  - `open-hesaplama`: Hesaplama (placeholder)

### 🎯 Kullanıcı Deneyimi
- Uygulama açıldığında tüm modüller görüntüleniyor
- Her modülün durumu (Aktif/Yakında) açıkça belirtiliyor
- Modül özellikleri kart üzerinde listeleniyor
- Smooth animasyonlar ve geçişler
- Modern ve profesyonel görünüm

---

## [22.11.2025 - 14:46] - Ana Klasör İsmi Değiştirildi

### 📁 Klasör Yeniden Adlandırma
- **kitar/** → **projeA/**
- Tüm "kitar" referansları projeden kaldırıldı
- Workspace yolu güncellendi: `d:/02. yazilimisleri/projeA`

---

## [22.11.2025 - 14:35] - Proje A'ya Dönüşüm ve Modüler Yapı

### 🚀 Büyük Değişiklikler
- **Proje Yeniden Adlandırma**: KİTAR → Proje A (Proje Geliştirme Platformu)
- **Modüler Mimari**: Tüm proje modüler yapıya dönüştürüldü
- **Yapı Bedeli Modülü**: İlk modül olarak ayrıştırıldı

### 📦 Modüler Yapı
- **modules/yapi-bedeli/**: Yapı Bedeli modülü oluşturuldu
  - `views/`: HTML dosyaları (index.html, raporlar.html, admin.html)
  - `scripts/`: JavaScript dosyaları (renderer.js, raporlar.js, admin.js, reportGenerator.js)
  - `styles/`: CSS dosyaları
- **shared/**: Paylaşılan kaynaklar için klasör yapısı
  - `database/`: Veritabanı yönetimi
  - `utils/`: Yardımcı fonksiyonlar

### 🗑️ Temizlik
- **Build dosyaları silindi**: build/ klasörü ve tüm ikon dosyaları kaldırıldı
- **Dist klasörü silindi**: Gereksiz build çıktıları temizlendi
- **Eski dosyalar**: admin_old.html kaldırıldı
- **package.json**: Build scriptleri ve gereksiz devDependencies temizlendi
  - electron-builder kaldırıldı
  - canvas kaldırıldı
  - electron-icon-builder kaldırıldı

### 🔄 Güncellemeler
- **package.json**: 
  - name: "proje-a"
  - productName: "Proje A - Proje Geliştirme Platformu"
  - version: "2.0.0"
  - description: Modüler yapı açıklaması eklendi
- **main.js**: Modüler dosya yollarına göre güncellendi
- **HTML dosyaları**: Script ve CSS yolları modüler yapıya göre düzenlendi
- **README.md**: Proje A için yeniden yazıldı, modül listesi eklendi

### 🎯 Gelecek Modüller (Planlı)
1. ✅ Yapı Bedeli Modülü (Aktif)
2. 💼 Proje Bedeli Modülü
3. 📚 Mevzuat Modülü
4. 🧮 Hesaplama Modülü

### 📝 Notlar
- Build ve standalone exe oluşturma işlemleri sonraya ertelendi
- İkon ve branding çalışmaları sonraki aşamada yapılacak
- Her modül bağımsız çalışabilir yapıda tasarlandı

---

## [20.11.2025 - 03:25] - Standalone Build ve Uygulama İkonu Eklendi

### 🎨 Yeni Özellikler
- **Profesyonel Uygulama İkonu**: Yapı değerleme temalı gradient renkli ikon tasarlandı
  - Bina, pencereler, çatı ve rapor belgesi görselleri
  - Gradient mor-pembe tonları (#667eea, #764ba2, #f093fb, #f5576c)
  - TL sembolü ile değerleme vurgusu
  - 512x512 yüksek çözünürlük
- **Çoklu İkon Formatları**: Windows (.ico), macOS (.icns) ve Linux (.png) için otomatik ikon oluşturma
- **NSIS Installer**: Kullanıcı dostu kurulum sihirbazı
  - Kurulum dizini seçimi
  - Masaüstü kısayolu oluşturma
  - Başlat menüsü kısayolu
  - Kaldırma programı
- **Portable Sürüm**: Kurulum gerektirmeyen taşınabilir .exe dosyası

### 🔧 Teknik İyileştirmeler
- **electron-builder Entegrasyonu**: Profesyonel build sistemi kuruldu
- **Canvas ile İkon Oluşturma**: Node.js canvas modülü ile programatik ikon üretimi
- **electron-icon-builder**: Otomatik çoklu format ikon dönüştürme
- **Build Scriptleri**: 
  - `npm run build` - Tüm platformlar
  - `npm run build:win` - Windows (NSIS + Portable)
  - `npm run build:mac` - macOS (DMG + ZIP)
  - `npm run build:linux` - Linux (AppImage + DEB)
  - `npm run dist` - Hızlı Windows build
- **npmRebuild: false**: Native modül rebuild sorunları önlendi

### 📦 Build Çıktıları
- **KİTAR-1.0.0-x64.exe**: NSIS installer (~89 MB)
- **KİTAR-1.0.0-Portable.exe**: Portable sürüm (~89 MB)
- **win-unpacked/**: Paketlenmemiş uygulama dosyaları

### 📁 Yeni Dosyalar
- `build/icon.svg`: Kaynak vektörel ikon
- `build/icon.png`: 512x512 PNG ikon
- `build/icons/icon.ico`: Windows ikonu (çoklu boyut)
- `build/icons/icon.icns`: macOS ikonu
- `build/icons/*.png`: Farklı boyutlarda PNG ikonlar (16x16 - 1024x1024)
- `build/generate-icon.js`: İkon oluşturma scripti
- `build/icon-generator.html`: Tarayıcı tabanlı ikon üretici
- `build/icon-readme.txt`: İkon dokümantasyonu

### 🔄 Güncellenen Dosyalar
- `package.json`: 
  - electron devDependencies'e taşındı
  - electron-builder yapılandırması eklendi
  - Build scriptleri eklendi
  - Uygulama metadata'sı güncellendi (productName, description, author)
- `dist/`: Build çıktı klasörü oluşturuldu

### 🎯 Kullanıcı Deneyimi
- Profesyonel görünümlü uygulama ikonu
- Windows görev çubuğu ve masaüstünde görsel kimlik
- Kolay kurulum ve kaldırma
- Portable sürüm ile USB'den çalıştırma imkanı
- Kurulum sihirbazı ile kullanıcı dostu kurulum

### 📊 Teknik Detaylar
- **Uygulama ID**: com.kitar.app
- **Ürün Adı**: KİTAR
- **Sürüm**: 1.0.0
- **Platform**: Windows x64
- **Electron**: 34.0.1
- **electron-builder**: 24.13.3

---

## [20.11.2025 - 03:15] - Standalone (Portable) Sürüm Hazırlığı

### 🚀 Yeni Özellikler
- **Standalone Uygulama**: Uygulamanın kurulum gerektirmeden (portable) çalışabilmesi için altyapı hazırlandı
- **Portable Veritabanı**: Veritabanı yolu, uygulamanın çalıştığı klasöre göre dinamik olarak ayarlandı
- **Build Konfigürasyonu**: `electron-builder` ayarları eklendi

### 🔧 Teknik Detaylar
- **Veritabanı Yolu**: `main.js` içinde `process.env.PORTABLE_EXECUTABLE_DIR` kontrolü eklendi
- **Paketleme**: `.exe` oluşturmak için `npm run dist` scripti eklendi
- **Dosya Yapısı**: Gereksiz dosyaların pakete dahil edilmesi engellendi

### 📁 Etkilenen Dosyalar
- `main.js`: Veritabanı oluşturma fonksiyonu güncellendi
- `package.json`: Build scriptleri ve konfigürasyon eklendi

---

## [31.10.2024 - 03:54] - Async Rapor Oluşturma Hatası Düzeltildi

### 🐛 Hata Düzeltmeleri
- **Yanlış Hata Mesajı**: Rapor başarıyla oluşturulurken "hata oluştu" mesajı gösteriliyordu
- **Async/Await Sorunu**: `generateReport` fonksiyonu Promise döndürüyor ama senkron çağrılıyordu
- **Promise Handling**: `.then()` ve `.catch()` ile düzgün hata yönetimi eklendi

### 🔧 Teknik Detaylar
- **Eski Kod**: `const result = generateReport(...)` (senkron)
- **Yeni Kod**: `generateReport(...).then(result => {...})` (async)
- Konsol logları eklendi
- Hata durumları için `.catch()` bloğu eklendi
- Başarı durumunda `result.path` kullanılıyor

### 📊 Artık Nasıl Çalışıyor
1. Rapor Oluştur butonuna tıklanır
2. Promise başlatılır
3. Rapor arka planda oluşturulur
4. Başarılı olursa: ✅ mesajı ve dosya açılır
5. Hata varsa: ❌ mesajı ve detaylı hata gösterilir

### 📁 Etkilenen Dosyalar
- `raporlar.js`: Async rapor oluşturma (satır 95-114)

---

## [31.10.2024 - 03:48] - Dosya Oluşturma Limiti Eklendi

### 🔒 Güvenlik İyileştirmesi
- **Sonsuz Döngü Önleme**: Dosya oluşturma için maksimum 10 deneme limiti eklendi
- **Kullanıcı Bildirimi**: Limit aşılırsa açıklayıcı hata mesajı gösteriliyor
- **Deneme Sayacı**: Her denemede konsola ilerleme yazdırılıyor

### 🔧 Teknik Detaylar
- `MAX_ATTEMPTS = 10` sabiti eklendi
- While döngüsüne counter kontrolü eklendi
- Limit aşılırsa: "Lütfen açık Word dosyalarını kapatın" mesajı

### 📁 Etkilenen Dosyalar
- `reportGenerator.js`: Maksimum deneme limiti (satır 425, 427, 449-453)

---

## [31.10.2024 - 03:45] - Beyaz Sayfa ve EBUSY Hataları Düzeltildi

### 🐛 Kritik Hata Düzeltmeleri
- **Beyaz Sayfa Sorunu**: Rapor kaydedildikten sonra sayfa beyaz kalma sorunu düzeltildi
- **EBUSY Hatası**: "resource busy or locked" hatası çözüldü
- **Dosya Kilidi**: Açık Word dosyası varsa otomatik olarak farklı isimle kaydediliyor (max 10 deneme)

### 🔧 Teknik Çözümler

**Sorun 1 - Beyaz Sayfa:**
- ❌ Eski: `showTab('genel')` fonksiyonu tanımsızdı
- ✅ Yeni: `window.location.reload()` ile sayfa yenileniyor
- Form otomatik temizleniyor ve kullanıcı ana sayfaya dönüyor

**Sorun 2 - EBUSY Hatası:**
- ❌ Eski: Açık dosyaya yazmaya çalışıyordu
- ✅ Yeni: Dosya açıksa `Rapor_1_20251031_1.docx` gibi farklı isimle kaydediyor
- Dosya kilidi kontrolü eklendi
- Otomatik counter sistemi ile çakışma önleniyor

### 🎯 Kullanıcı Deneyimi İyileştirmeleri
- Rapor kaydedilince başarı mesajı gösteriliyor
- Sayfa otomatik yenileniyor
- Açık Word dosyaları sorun çıkarmıyor
- Kullanıcı birden fazla rapor oluşturabilir

### 📁 Etkilenen Dosyalar
- `renderer.js`: Form submit sonrası sayfa yenileme (satır 746-750)
- `reportGenerator.js`: EBUSY hatası önleme mekanizması (satır 422-454)

---

## [31.10.2024 - 03:36] - Rapor Kaydetme Hatası Düzeltildi

### 🐛 Hata Düzeltmeleri
- **Raportör Kaydetme Hatası**: "Cannot read properties of null" hatası düzeltildi
- **Element Referans Sorunu**: Eski `raportorAdi` yerine yeni `raportorSecimi` dropdown'ı kullanılıyor
- **Fallback Mekanizması**: Hem yeni hem eski sistem için uyumluluk sağlandı

### 🔧 Teknik Detaylar
- Raportör bilgileri artık dropdown'dan doğru şekilde alınıyor
- Seçilen raportörün adı `selectedOption.textContent` ile çekiliyor
- Ünvan bilgisi readonly input'tan alınıyor
- Null check'ler eklendi

### 📁 Etkilenen Dosyalar
- `renderer.js`: handleFormSubmit fonksiyonu güncellendi (satır 648-678)

---

## [31.10.2024 - 03:30] - Dropdown Yükleme Sorunları Düzeltildi

### 🐛 Kritik Hata Düzeltmeleri
- **Fonksiyon İsim Hatası**: `hesapYillariDoldur()` yerine doğru fonksiyon `populateHesapDonemleri()` çağrılıyor
- **Tüm Dropdown'lar Boş**: Hesap dönemleri, kurumlar ve raportör dropdown'ları şimdi düzgün yükleniyor
- **Raportör Dropdown Eksikliği**: Raportör seçim alanları artık görünüyor ve çalışıyor

### 🔧 Teknik İyileştirmeler
- **Detaylı Loglama**: Her dropdown fonksiyonuna konsol logları eklendi
- **Hata Kontrolü**: Element varlık kontrolü ve null check'ler eklendi
- **Async/Await**: Raportör yükleme işlemi için düzgün async handling
- **Fallback Mekanizması**: Hata durumunda alternatif input alanları

### 📊 Konsol Logları
Artık konsolda şu mesajları göreceksiniz:
- 🚀 Sayfa yükleniyor...
- 📅 Hesap dönemleri yükleniyor...
- 👨‍💼 Raportör alanları oluşturuluyor...
- 🏢 Kurumlar yükleniyor...
- ✅ Başarı mesajları

### 📁 Etkilenen Dosyalar
- `renderer.js`: Fonksiyon isimleri düzeltildi ve loglama eklendi

---

## [31.10.2024 - 03:26] - JavaScript Çakışma Hatası Düzeltildi

### 🐛 Hata Düzeltmeleri
- **Window.onload Çakışması**: İki farklı `window.onload` tanımı çakışması düzeltildi
- **Event Listener Eksikliği**: Eksik event listener'lar eklendi
- **Syntax Hatası**: "populateIlceler is not defined" hatası çözüldü
- **Kurum Dropdown Sorunu**: Ana formdaki kurum listesi yükleme problemi düzeltildi

### 🔧 Teknik İyileştirmeler
- Tüm event listener'lar tek `window.onload` fonksiyonunda birleştirildi
- Element varlık kontrolü eklendi (null check)
- Kurum yükleme işlemi için 1.5 saniye gecikme eklendi
- Detaylı konsol logları eklendi

### 📁 Etkilenen Dosyalar
- `renderer.js`: Window.onload birleştirme ve event listener düzeltmeleri

---

## [31.10.2024 - 03:14] - Kurum Yönetimi Sistemi Eklendi

### 🆕 Yeni Özellikler
- **Kurum Yönetimi**: Yönetici paneline kurum ve alt kurum ekleme, düzenleme ve silme özelliği eklendi
- **Veritabanı Tablosu**: `kurumlar` tablosu oluşturuldu (kurumAdi, altKurum, aktif durum)
- **Dropdown Seçimi**: Ana formda "İlgili Kurum" alanı dropdown'a çevrildi
- **Tam Görünüm Formatı**: Kurumlar "Kurum (Alt Kurum)" formatında görüntülenir
- **Örnek Veriler**: Sistem Samsun'daki kurumlarla örnek verilerle gelir

### 🏢 Eklenen Örnek Kurumlar
- **Belediyeler**: Samsun Büyükşehir, Atakum, Canik, İlkadım, Tekkeköy
- **Bakanlık Birimleri**: Çevre Şehircilik ve İklim Değişikliği, Tarım ve Orman
- **Alt Birimler**: İmar ve Şehircilik Dairesi, Fen İşleri Dairesi, Milli Emlak vb.

### 🔧 Teknik Detaylar
- **Veritabanı**: SQLite tablosu `kurumlar` (id, kurumAdi, altKurum, aktif, olusturmaTarihi, guncellemeTarihi)
- **CRUD İşlemleri**: Tam CRUD (Create, Read, Update, Delete) desteği
- **Soft Delete**: Kurumlar silindiğinde aktif durumu 0 yapılır (veri kaybı önlenir)
- **Null Handling**: Alt kurum isteğe bağlı (NULL değer desteklenir)
- **Güvenli Başlatma**: Tablo varlık kontrolü ve otomatik yeniden deneme

### 📁 Etkilenen Dosyalar
- `main.js`: Kurumlar tablosu ve örnek veriler eklendi (satır 315-362)
- `admin.html`: Kurum Yönetimi tab'ı eklendi (satır 349, 558-624)
- `admin.js`: Kurum CRUD fonksiyonları eklendi (satır 656-906)
- `index.html`: İlgili Kurum alanı dropdown'a çevrildi (satır 420-423)
- `renderer.js`: Kurum dropdown doldurma fonksiyonu (satır 99-144)

### 🎯 Kullanıcı Deneyimi
- Kurumlar merkezi olarak yönetilir
- Ana formda hızlı seçim yapılabilir
- "Kurum (Alt Kurum)" formatında net görünüm
- Kullanıcı dostu arayüz ve bildirimler
- Duplicate kontrol sistemi

---

## [31.10.2024 - 03:08] - İdari Ünvanlar Eklendi

### 🆕 Yeni Özellikler
- **Genişletilmiş Ünvan Listesi**: Yönetici paneline idari ünvanlar eklendi
- **Gruplandırılmış Seçenekler**: Ünvanlar "Mühendislik Ünvanları" ve "İdari Ünvanlar" olarak gruplandırıldı
- **Yeni İdari Ünvanlar**: İl Müdürü, Şube Müdürü, Müdür Yardımcısı, Başkan, Uzman, Kontrolör vb.
- **Güncellenmiş Örnek Veriler**: Sistem idari ünvanlı örnek raportörlerle gelir

### 📋 Eklenen İdari Ünvanlar
- İl Müdürü
- İl Müdür Yardımcısı  
- Şube Müdürü
- Müdür Yardımcısı
- Başkan
- Başkan Yardımcısı
- Daire Başkanı
- Şef
- Uzman
- Kontrolör

### 🔧 Teknik Detaylar
- HTML `<optgroup>` kullanarak ünvanlar kategorize edildi
- Hem ekleme hem düzenleme formlarında aynı ünvan listesi
- Örnek verilere 4 yeni idari ünvanlı raportör eklendi

### 📁 Etkilenen Dosyalar
- `admin.html`: Ünvan seçenekleri genişletildi ve gruplandırıldı (satır 450-476, 520-546)
- `main.js`: Örnek verilere idari ünvanlı raportörler eklendi (satır 289-298)

---

## [31.10.2024 - 02:59] - Veritabanı Senkronizasyon Hatası Düzeltildi

### 🐛 Hata Düzeltmeleri
- **SQLite Hata**: "no such table: raportorleri" hatası düzeltildi
- **Güvenli Başlatma**: Admin paneli ve ana form için veritabanı hazır olma kontrolü eklendi
- **Tablo Varlık Kontrolü**: Fonksiyonlar çalışmadan önce tablo varlığını kontrol eder
- **Otomatik Yeniden Deneme**: Tablo yoksa 2 saniye bekleyip tekrar dener

### 🔧 Teknik İyileştirmeler
- `raportorleriListele()`: Tablo varlık kontrolü eklendi
- `raportorleriGetir()`: Güvenli tablo kontrolü eklendi
- Zamanlama problemleri için setTimeout kullanımı
- Kullanıcı dostu bekleme mesajları

### 📁 Etkilenen Dosyalar
- `admin.js`: Güvenli başlatma ve tablo kontrolü (satır 423-427, 474-490)
- `renderer.js`: Tablo varlık kontrolü (satır 97-110)

---

## [31.10.2024 - 02:53] - Raportör Yönetimi Sistemi Eklendi

### 🆕 Yeni Özellikler
- **Raportör Yönetimi**: Yönetici paneline raportör ekleme, düzenleme ve silme özelliği eklendi
- **Veritabanı Tablosu**: `raportorleri` tablosu oluşturuldu (ad, soyad, ünvan, aktif durum)
- **Dropdown Seçimi**: Ana formda raportör seçimi için dropdown menü eklendi
- **Otomatik Ünvan**: Raportör seçildiğinde ünvan otomatik olarak doldurulur
- **Örnek Veriler**: Sistem ilk açılışta örnek raportör verileri ile gelir

### 🔧 Teknik Detaylar
- **Veritabanı**: SQLite tablosu `raportorleri` (id, adi, soyadi, unvani, aktif, olusturmaTarihi, guncellemeTarihi)
- **CRUD İşlemleri**: Tam CRUD (Create, Read, Update, Delete) desteği
- **Soft Delete**: Raportörler silindiğinde aktif durumu 0 yapılır (veri kaybı önlenir)
- **Async/Await**: Modern JavaScript ile veritabanı işlemleri

### 📁 Etkilenen Dosyalar
- `main.js`: Raportörler tablosu ve örnek veriler eklendi (satır 269-309)
- `admin.html`: Raportör Yönetimi tab'ı eklendi (satır 348, 430-523)
- `admin.js`: Raportör CRUD fonksiyonları eklendi (satır 415-630)
- `renderer.js`: Dropdown seçimi ve otomatik ünvan doldurma (satır 94-174)

### 🎯 Kullanıcı Deneyimi
- Raportörler merkezi olarak yönetilir
- Ana formda hızlı seçim yapılabilir
- Ünvanlar otomatik doldurulur (hata riski azalır)
- Kullanıcı dostu arayüz ve bildirimler

---

## [31.10.2024 - 02:37] - Yönetici Paneli Güncelleme

### Değişiklikler
- **index.html**: "Birim Fiyat Yönetimi" butonu "Yönetici Paneli" olarak değiştirildi
- **admin.html**: Sayfa başlığı ve header "Yönetici Paneli" olarak güncellendi
- Kullanıcı arayüzü terminolojisi daha genel ve anlaşılır hale getirildi

### Teknik Detaylar
- Buton metni değişikliği: `⚙️ Birim Fiyat Yönetimi` → `⚙️ Yönetici Paneli`
- Sayfa başlığı güncellendi: `Admin Panel` → `Yönetici Paneli`
- Header başlığı güncellendi: `⚙️ Admin Panel - Yönetim Sistemi` → `⚙️ Yönetici Paneli - Yönetim Sistemi`

### Etkilenen Dosyalar
- `index.html` (satır 626)
- `admin.html` (satır 6, 342)
