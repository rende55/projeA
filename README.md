# Proje A - Proje Geliştirme Platformu

> Modüler yapıda proje geliştirme ve yönetim platformu

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![Electron](https://img.shields.io/badge/electron-34.0.1-brightgreen.svg)](https://electronjs.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

---

## Proje Hakkında

**Proje A**, kamu kurumları ve yerel yönetimler için modüler yapıda geliştirilmiş profesyonel bir masaüstü uygulamasıdır. Tek pencere (SPA) navigasyon sistemiyle çalışır; her modül bağımsız geliştirilebilir ve kolayca genişletilebilir.

### Modüller

| # | Modül | Durum | Açıklama |
|---|-------|-------|----------|
| 1 | **Yapı Bedeli** | Aktif | Yapı değerleme raporları - 3 adımlı form, otomatik hesaplama, Word çıktısı |
| 2 | **Proje Bedeli** | Aktif | Mimarlık/mühendislik proje bedeli hesaplama - 4 branş, PID oranları |
| 3 | **Mevzuat** | Planlı | Cari mevzuat yönetimi ve görüntüleme |
| 4 | **Hesaplama** | Planlı | Gelişmiş hesap makinesi |

---

## Hızlı Başlangıç

### Gereksinimler

- Node.js v14 veya üzeri
- npm v6 veya üzeri

### Kurulum

```bash
# Bağımlılıkları yükleyin
npm install

# Uygulamayı çalıştırın
npm start
```

### İlk Kullanım

1. Uygulama açıldığında **Dashboard** (ana sayfa) karşılar
2. İstediğiniz modül kartına tıklayarak ilgili modüle geçin
3. Üst navigasyon çubuğundaki butonlarla geri dönün veya ana sayfaya gidin
4. Her modülde form doldurup hesaplama yapabilir, rapor oluşturabilirsiniz

---

## Dokümantasyon

Detaylı dokümantasyon için `docs/` klasörüne bakın:

| Dokümantasyon | Açıklama |
|---------------|----------|
| [docs/INDEX.md](docs/INDEX.md) | Dokümantasyon rehberi ve indeks |
| [docs/README.md](docs/README.md) | Genel bakış ve özellikler |
| [docs/KURULUM.md](docs/KURULUM.md) | Kurulum ve yapılandırma |
| [docs/KULLANIM.md](docs/KULLANIM.md) | Kullanıcı kılavuzu |
| [docs/BIRIM_FIYAT_YONETIMI.md](docs/BIRIM_FIYAT_YONETIMI.md) | Birim fiyat otomasyonu rehberi |
| [docs/ADMIN_PANEL_REHBERI.md](docs/ADMIN_PANEL_REHBERI.md) | Yönetici paneli rehberi |
| [docs/MIMARI.md](docs/MIMARI.md) | Uygulama mimarisi |
| [docs/VERITABANI.md](docs/VERITABANI.md) | Veritabanı yapısı |
| [docs/MODULLER.md](docs/MODULLER.md) | Modül ve fonksiyon referansları |
| [docs/GELISTIRICI.md](docs/GELISTIRICI.md) | Geliştirici rehberi |

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Masaüstü** | Electron 34.0.1, @electron/remote |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript, Inter font |
| **Veritabanı** | SQLite3 5.1.7 |
| **Doküman** | docx 9.5.1, docxtemplater 3.67.0, pizzip 3.2.0 |
| **UI** | Modern design system (Slate renk paleti, SVG ikonlar, glassmorphism) |

---

## Proje Yapısı

```
proje-a/
├── main.js                          # Electron ana süreç + veritabanı + IPC
├── dashboard.html                   # Ana sayfa (SPA shell + navigasyon)
├── dashboard.js                     # Dashboard mantığı
├── package.json                     # Proje yapılandırması (v2.0.0)
│
├── modules/                         # Modüller
│   ├── yapi-bedeli/                 # Yapı Bedeli Modülü
│   │   ├── views/
│   │   │   ├── yapi-bedeli-content.html   # Ana form (3 sekmeli)
│   │   │   ├── raporlar-content.html      # Kayıtlı raporlar
│   │   │   ├── admin-content.html         # Yönetim paneli (4 sekmeli)
│   │   │   └── editor-content.html        # Rapor editörü
│   │   ├── scripts/
│   │   │   ├── yapi-bedeli-page.js        # Form mantığı (SPA)
│   │   │   ├── raporlar-page.js           # Rapor listesi (SPA)
│   │   │   ├── admin-page.js              # Admin mantığı (SPA)
│   │   │   ├── editor-page.js             # Editör mantığı (SPA)
│   │   │   ├── renderer.js                # Eski form mantığı
│   │   │   ├── raporlar.js                # Eski rapor mantığı
│   │   │   ├── admin.js                   # Eski admin mantığı
│   │   │   └── reportGenerator.js         # Word rapor oluşturma
│   │   ├── styles/
│   │   ├── KT_Sablon_1.docx              # Rapor şablonu
│   │   └── birimFiyatlar.json             # Birim fiyat verileri
│   │
│   └── proje-bedeli/                # Proje Bedeli Modülü
│       ├── views/
│       │   ├── proje-bedeli-content.html  # Ana form (3 sekmeli)
│       │   └── pb-raporlar-content.html   # Kayıtlı raporlar
│       ├── scripts/
│       │   ├── proje-bedeli-page.js       # Form mantığı (SPA)
│       │   ├── pb-raporlar-page.js        # Rapor listesi (SPA)
│       │   └── pb-reportGenerator.js      # Word rapor oluşturma
│       └── assets/
│
├── shared/                          # Paylaşılan kaynaklar
│   ├── scripts/
│   │   └── navigation.js           # Tek pencere navigasyon yöneticisi
│   ├── database/                    # (gelecekte)
│   └── utils/                       # (gelecekte)
│
├── assets/                          # Uygulama ikonları ve görseller
├── docs/                            # Dokümantasyon (10 rehber)
├── raporlar/                        # Oluşturulan Word raporları
└── raporlar.db                      # SQLite veritabanı (otomatik oluşur)
```

---

## Uygulama Mimarisi

### Tek Pencere Navigasyon (SPA)

Uygulama tek bir `BrowserWindow` içinde çalışır. `NavigationManager` sınıfı sayfa geçişlerini yönetir:

```
Dashboard → Yapı Bedeli → Raporlar → Editör
         → Proje Bedeli → PB Raporlar
         → Admin Paneli
```

- **Geri/İleri**: Sayfa stack'i ile geçmiş yönetimi
- **Breadcrumb**: Anlık konum göstergesi
- **Klavye kısayolları**: Alt+Sol (geri), Alt+Home (ana sayfa)

### Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `raporlar` | Yapı bedeli raporları |
| `birimFiyatlar` | Yıl bazlı birim fiyat dönemleri |
| `birimFiyatDetay` | Yapı sınıfı/grup bazlı detay fiyatlar |
| `raportorler` | Raportör bilgileri |
| `kurumlar` | Kurum ve alt kurum bilgileri |
| `yipranmaPaylari` | Yıpranma payı cetvelleri |
| `pidOranlari` | PID oranları (Proje Bedeli) |
| `hizmetDaliKatsayilari` | Hizmet dalı katsayıları (Proje Bedeli) |
| `projeBedeliRaporlari` | Proje bedeli raporları |

---

## Hesaplama Formülleri

### Yapı Bedeli Modülü

**Yapı Bedeli:**
```
Yapı Bedeli = Yapı Alanı × Birim Fiyat × (1 - Yıpranma Payı/100) × (1 - Eksik İmalat/100)
```

**Asgari Levazım Bedeli:**
```
Levazım Bedeli = Yapı Bedeli × 0.70 × 0.75
```

### Proje Bedeli Modülü

**Yapı Yaklaşık Maliyeti:**
```
Maliyet = Yapı İnşaat Alanı × Birim Maliyet × Yapı Sınıfı Katsayısı
```

**Hizmet Bedeli:**
```
Hizmet Bedeli = Maliyet × PID Oranı × Hizmet Dalı Katsayısı
```

---

## Öne Çıkan Özellikler

- **Resmi Gazete Uyumluluğu** - Yıpranma payları ve birim fiyatlar tebliğlere göre
- **Türkçe Yazıya Çevirme** - Bedeller otomatik Türkçe yazıya çevrilir
- **Profesyonel Rapor** - Word formatında tablolu ve standart raporlar
- **Veri Güvenliği** - Tüm veriler lokal SQLite veritabanında
- **Modern UI** - SVG ikonlar, Inter font, Slate renk paleti, modern tasarım
- **Tek Pencere** - SPA navigasyon ile hızlı sayfa geçişleri

---

## Önemli Notlar

- **Güvenlik**: Uygulama `contextIsolation: false` kullanıyor. Production için güvenlik iyileştirmesi gerekli.
- **Yedekleme**: `raporlar.db` dosyasını düzenli olarak yedekleyin.
- **Silme**: Rapor silme işlemi geri alınamaz.

---

## Gelecek Planları

- [ ] Mevzuat modülü
- [ ] Hesaplama modülü
- [ ] Excel çıktısı desteği
- [ ] Toplu rapor oluşturma
- [ ] Şablon yönetimi
- [ ] Yedekleme sistemi
- [ ] Kullanıcı ayarları
- [ ] Standalone exe build

---

## Lisans

Bu proje özel mülkiyettedir. Tüm hakları saklıdır.

---

<div align="center">

**Proje A - Proje Geliştirme Platformu**

*Modüler Yapıda Profesyonel Proje Yönetimi*

**Versiyon 2.0.0** | 2025-2026

---

**[Dokümantasyon](docs/INDEX.md)** | 
**[Kurulum](docs/KURULUM.md)** | 
**[Kullanım](docs/KULLANIM.md)** | 
**[Geliştirici](docs/GELISTIRICI.md)**

</div>

