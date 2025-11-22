# CHANGELOG

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
