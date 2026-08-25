# Proje A - Genel Bakış

![Version](https://img.shields.io/badge/version-2.2.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Electron-brightgreen.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Modüller](#modüller)
- [Temel Özellikler](#temel-özellikler)
- [Teknoloji Stack](#teknoloji-stack)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Dokümantasyon](#dokümantasyon)

---

## Proje Hakkında

**Proje A**, kamu kurumları ve yerel yönetimler için geliştirilmiş modüler bir masaüstü uygulamasıdır. Tek pencere (SPA) navigasyon sistemiyle çalışır; her modül bağımsız geliştirilir ve dashboard üzerinden erişilir.

Uygulama, Resmi Gazete tebliğlerine göre yapı bedeli ve proje bedeli hesaplar, profesyonel Word formatında rapor üretir; ayrıca cephe metrajı gibi yardımcı hesaplama araçları sunar.

> **Tarihçe**: Uygulama 20.11.2025'te KİTAR (Kıymet Takdir Raporu) adıyla tek modüllü olarak yayınlandı. 22.11.2025'te modüler yapıya geçilip **Proje A** adını aldı.

### Hedef Kitle

- İnşaat Mühendisleri ve Mimarlar
- Belediyeler ve İl Özel İdareleri
- Kamu Kurumları (Milli Emlak, vb.)
- Ekspertiz Şirketleri

---

## Modüller

| # | Modül | Durum | Açıklama |
|---|-------|-------|----------|
| 1 | **Yapı Bedeli** | Aktif | Yapı değerleme raporları; çoklu parsel desteği, rapor editörü, Word çıktısı |
| 2 | **Proje Bedeli** | Aktif | Mimarlık/mühendislik proje bedeli; 4 branş, PID oranları, rapor editörü |
| 3 | **Hesaplamalar** | Aktif | Cephe metrajı - boya ve yalıtım alanı hesaplama |
| 4 | **Mevzuat** | Planlı | Cari mevzuat yönetimi ve görüntüleme |

Her modül kendi **hub sayfasına** (modül giriş ekranı) açılır: yeni hesaplama, kayıtlı kayıtlar ve son kayıtlar listesi bir aradadır.

---

## Temel Özellikler

### 1. Yapı Bedeli Modülü

- **Üç adımlı form**: Genel Bilgiler → Arsa Bilgileri → Yapı Bilgileri
- **Çoklu parsel raporu**: Tek raporda birden fazla ada/parsel ve her parselde ayrı yapılar; ara toplam ve genel toplam satırlarıyla
- **Otomatik hesaplama**: Yıpranma payı Resmi Gazete cetvellerinden, birim fiyat seçili dönemden çekilir
- **Rapor editörü**: Kaydedilmiş rapor sonradan açılıp canlı hesaplamayla düzenlenebilir
- **Farklı döneme kopyalama**: Rapor, başka bir birim fiyat dönemine uyarlanarak yeni rapor olarak kopyalanır

### 2. Proje Bedeli Modülü

- 4 branş (mimarlık, statik, mekanik, elektrik) için hizmet bedeli hesabı
- PID oranları ve hizmet dalı katsayıları veritabanından
- Rapor editörü ve doğrudan Word çıktısı
- İmzacı (raportör) bilgileri raporla birlikte saklanır

### 3. Hesaplamalar Modülü

- **Cephe metrajı**: Çok cepheli boya ve yalıtım alanı hesabı
- Her cepheye kapı/pencere boşlukları, çıkmalar ve saçak tanımlanır
- Şafak (boşluk yan yüzeyi) çevresi boşluk tipine göre hesaplanır
- Boya ve yalıtım alanları ayrı toplanır, mermer denizlik düşülür
- Metrajlar kaydedilip sonradan açılabilir

### 4. Ortak Özellikler

- **Yönetim paneli**: Birim fiyat dönemleri, raportörler, kurumlar, PID oranları, il/ilçe yönetimi
- **Türkçe yazıya çevirme**: Bedeller otomatik olarak yazıya dönüştürülür
- **Word çıktısı**: Tablolu, standart, Resmi Gazete referanslı raporlar; fotoğraf ekleme desteği
- **Yerel veri**: Tüm veriler lokal SQLite veritabanında tutulur
- **SPA navigasyon**: Tek pencere, geri/ileri yönetimi, breadcrumb, klavye kısayolları

---

## Teknoloji Stack

### Masaüstü
- **Electron 34**: Masaüstü uygulama framework'ü
- **@electron/remote**: Renderer'dan ana süreç API'lerine erişim
- **Node.js**: Runtime

### Frontend
- **HTML5 / CSS3**: Modül bazlı prefixli stiller (`yb-`, `pb-`, `cm-`, `dk-`)
- **Vanilla JavaScript**: Framework bağımlılığı yok
- **Inter font, SVG ikonlar**: Modern design system (Slate renk paleti)

### Veri
- **SQLite3**: 12 tablolu yerel veritabanı
- Migration sistemi `main.js` içinde; yeni tablo ve sütunlar otomatik eklenir

### Doküman İşleme
- **docx**: Word dökümanı oluşturma
- **docxtemplater + pizzip**: Şablon doldurma
- **mammoth**: HTML dönüşüm

### Build
- **electron-builder**: Portable exe üretimi
- **javascript-obfuscator**: Renderer ve main süreç kodunun karartılması

---

## Hızlı Başlangıç

### Gereksinimler

```
Node.js v14+
npm v6+
```

### Kurulum

```bash
# Proje dizinine gidin
cd projeA

# Bağımlılıkları yükleyin
npm install

# Uygulamayı çalıştırın
npm start
```

### İlk Kullanım

1. Uygulama açıldığında **Dashboard** karşılar
2. Bir modül kartına tıklayın; modülün **hub sayfası** açılır
3. **Yeni Hesaplama** ile forma girin veya **Kayıtlı Raporlar**'dan mevcut bir kaydı açın
4. Formu doldurup hesaplayın, raporu kaydedin
5. Editörden veya listeden **Word** çıktısı alın

### Build Alma

```bash
# Sadece obfuscation (build-temp klasörüne)
npm run obfuscate

# Portable exe üretimi
npm run build
```

---

## Dokümantasyon

| Döküman | Açıklama |
|---------|----------|
| [INDEX.md](./INDEX.md) | Dokümantasyon rehberi ve okuma yolları |
| [KURULUM.md](./KURULUM.md) | Kurulum ve yapılandırma rehberi |
| [KULLANIM.md](./KULLANIM.md) | Detaylı kullanım kılavuzu |
| [BIRIM_FIYAT_YONETIMI.md](./BIRIM_FIYAT_YONETIMI.md) | Birim fiyat otomasyonu |
| [ADMIN_PANEL_REHBERI.md](./ADMIN_PANEL_REHBERI.md) | Yönetici paneli rehberi |
| [MIMARI.md](./MIMARI.md) | Uygulama mimarisi ve yapısı |
| [VERITABANI.md](./VERITABANI.md) | Veritabanı şeması ve yapısı |
| [MODULLER.md](./MODULLER.md) | Modüller ve fonksiyon referansları |
| [GELISTIRICI.md](./GELISTIRICI.md) | Geliştirici rehberi |

Proje kökündeki [CHANGELOG.md](../CHANGELOG.md) tüm sürüm değişikliklerini, [PROJE_YAPISI.md](../PROJE_YAPISI.md) ise modül yapısını ve yeni modül ekleme rehberini içerir.

---

## Proje İstatistikleri

- **Aktif modül**: 3 (Yapı Bedeli, Proje Bedeli, Hesaplamalar)
- **SPA sayfası**: 13 route
- **Veritabanı tablosu**: 12
- **Bağımlılık**: 10 npm paketi
- **Platform**: Windows (portable exe); Electron sayesinde macOS/Linux'ta da çalışır

---

## Lisans

Bu proje özel mülkiyettedir. Tüm hakları saklıdır.

---

## Gelecek Planları

- [x] Proje Bedeli modülü
- [x] Çoklu parsel raporu
- [x] Rapor editörleri (Yapı Bedeli + Proje Bedeli)
- [x] Hesaplamalar modülü (Cephe Metrajı)
- [x] Farklı döneme kopyalama
- [x] Portable exe build
- [ ] Mevzuat modülü
- [ ] Birim dönüşüm aracı
- [ ] Excel çıktısı desteği
- [ ] Toplu rapor oluşturma
- [ ] Yedekleme sistemi

---

**Proje A** © 2025-2026 | Versiyon 2.2.0
