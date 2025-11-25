# CHANGELOG

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
