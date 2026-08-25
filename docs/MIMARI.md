# Uygulama Mimarisi ve Yapısı

## İçindekiler

- [Mimari Genel Bakış](#mimari-genel-bakış)
- [SPA Navigasyon Sistemi](#spa-navigasyon-sistemi)
- [Katmanlı Mimari](#katmanlı-mimari)
- [Dosya Yapısı](#dosya-yapısı)
- [Veri Akışı](#veri-akışı)
- [Teknoloji Stack](#teknoloji-stack)
- [Tasarım Kalıpları](#tasarım-kalıpları)
- [Güvenlik Mimarisi](#güvenlik-mimarisi)
- [Performans Karakteristikleri](#performans-karakteristikleri)
- [Gelecek İyileştirmeler](#gelecek-i̇yileştirmeler)

---

## Mimari Genel Bakış

Proje A, **tek pencerede çalışan modüler bir Electron uygulamasıdır**. Tüm sayfalar aynı `BrowserWindow` içinde, sayfa yenilenmeden değiştirilir (SPA). Her modül kendi klasöründe, kendi görünüm ve script dosyalarıyla bağımsız durur.

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Uygulaması                  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Main Process (main.js)               │  │
│  │  • Pencere yönetimi                               │  │
│  │  • SQLite bağlantısı ve migration                 │  │
│  │  • IPC handler'ları (Word export, dosya diyalog)  │  │
│  └───────────────────────────────────────────────────┘  │
│                          ▲                              │
│                          │ IPC                          │
│                          ▼                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │       Renderer Process (tek BrowserWindow)        │  │
│  │                                                   │  │
│  │  dashboard.html  (SPA kabuğu)                     │  │
│  │  └── NavigationManager                            │  │
│  │      └── #page-container                          │  │
│  │          └── aktif modül sayfası (template+script)│  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Electron Process Modeli

| Process | Dosya | Sorumluluk |
|---------|-------|------------|
| **Main** | `main.js` | Uygulama yaşam döngüsü, pencere oluşturma, veritabanı şeması ve migration, Word export IPC handler'ları |
| **Renderer** | `dashboard.html` + modül script'leri | Tüm kullanıcı arayüzü, form mantığı, hesaplamalar, veritabanı sorguları |

> **Not**: `nodeIntegration: true` ve `contextIsolation: false` kullanıldığı için renderer süreci doğrudan `require('sqlite3')` yapabilir; veritabanı sorgularının çoğu renderer tarafında çalışır. Ayrıntı için [Güvenlik Mimarisi](#güvenlik-mimarisi) bölümüne bakın.

---

## SPA Navigasyon Sistemi

Uygulamanın omurgası `shared/scripts/navigation.js` içindeki **NavigationManager** sınıfıdır.

### Sayfa Kaydı

Her sayfa (route) bir template ve bir script ile tanımlanır:

```javascript
'cephe-metraj': {
    title: 'Cephe Metrajı',
    icon: '📐',
    template: 'modules/hesaplama/views/cephe-metraj-content.html',
    script: 'modules/hesaplama/scripts/cephe-metraj-page.js'
}
```

### Kayıtlı Route'lar

| Route | Başlık | Modül |
|-------|--------|-------|
| `dashboard` | Ana Sayfa | - |
| `yapi-bedeli` | Yapı Bedeli (hub) | Yapı Bedeli |
| `yapi-bedeli-form` | Yeni Hesaplama | Yapı Bedeli |
| `raporlar` | Kayıtlı Raporlar | Yapı Bedeli |
| `editor` | Rapor Editörü | Yapı Bedeli |
| `admin` | Yönetim Paneli | Yapı Bedeli |
| `proje-bedeli` | Proje Bedeli (hub) | Proje Bedeli |
| `proje-bedeli-form` | Yeni Hesaplama | Proje Bedeli |
| `pb-raporlar` | PB Raporları | Proje Bedeli |
| `pb-editor` | PB Rapor Editörü | Proje Bedeli |
| `hesaplama` | Hesaplamalar (hub) | Hesaplamalar |
| `cephe-metraj` | Cephe Metrajı | Hesaplamalar |
| `metraj-raporlar` | Kayıtlı Metrajlar | Hesaplamalar |

### Navigasyon Akışı

```
Dashboard
├── Yapı Bedeli (hub) → Yeni Hesaplama
│                     → Raporlar → Editör → Döneme Kopyala
├── Proje Bedeli (hub) → Yeni Hesaplama
│                      → PB Raporlar → PB Editör
├── Hesaplamalar (hub) → Cephe Metrajı
│                      → Kayıtlı Metrajlar
└── Admin Paneli
```

**Hub deseni**: Modül kartına tıklanınca doğrudan forma değil, modülün giriş ekranına gidilir. Hub'da yeni kayıt, kayıtlı kayıtlar listesi ve son kayıtlar bir aradadır.

### Sayfa Yükleme Süreci

`navigateTo(pageName, data)` çağrıldığında sırayla:

1. **State kaydı** – mevcut sayfanın `saveState()` fonksiyonu varsa çağrılır
2. **Unload** – mevcut sayfanın `onUnload()` fonksiyonu çağrılır (DB bağlantısı kapatma, IPC listener temizliği)
3. **Stack** – yeni sayfa geçmiş yığınına eklenir
4. **Template** – HTML dosyası `fs.readFileSync()` ile okunup `container.innerHTML`'e yazılır
5. **Script** – modül `require()` ile yüklenir (bir kez; sonraki ziyaretlerde önbellekten) ve `onLoad(container, data, navigation)` çağrılır
6. **UI** – navigasyon çubuğu ve breadcrumb güncellenir

Hata durumunda container'a "Sayfa Yüklenemedi" ekranı basılır ve geri dönüş butonu gösterilir.

### Sayfa Modülü Sözleşmesi

Her sayfa script'i şu arayüzü sağlar:

```javascript
async function onLoad(container, data, navigation) { }   // Zorunlu
async function onUnload() { }                            // Önerilir
async function saveState() { return {...}; }             // İsteğe bağlı
function hasUnsavedChanges() { return false; }           // İsteğe bağlı

module.exports = { onLoad, onUnload, saveState, hasUnsavedChanges };
```

| Fonksiyon | Ne zaman çağrılır | Tipik kullanım |
|-----------|-------------------|----------------|
| `onLoad` | Sayfa açıldığında | DB bağlantısı açma, veri yükleme, event listener kurma, `window.<prefix>Page` global'ini tanımlama |
| `onUnload` | Sayfadan ayrılırken | DB bağlantısını kapatma, `ipcRenderer.removeListener()` ile dinleyicileri kaldırma |
| `saveState` | Navigasyondan önce | Form verisini saklama |
| `hasUnsavedChanges` | Geri dönerken | Kaydedilmemiş değişiklik uyarısı |

> **Önemli**: Sayfa script'leri `require()` önbelleğinde kaldığı için modül seviyesindeki değişkenler sayfa kapanınca sıfırlanmaz. `onLoad` içinde durumu yeniden kurmak, `onUnload` içinde temizlemek gerekir. IPC dinleyicileri `onUnload`'da kaldırılmazsa her açılışta birikir.

### Geçmiş Yönetimi

- `stack` dizisi ziyaret edilen sayfaları tutar; `goBack()` yığından çıkarır
- `goHome()` dashboard'a döner ve yığını sıfırlar
- Breadcrumb yığından üretilir; bir öğeye tıklanınca `navigateToStackIndex()` ile o noktaya dönülür
- Klavye: `ESC` / `Alt+←` geri, `Alt+Home` ana sayfa

---

## Katmanlı Mimari

### 1. Sunum Katmanı

**Dosyalar**: `dashboard.html`, `modules/*/views/*.html`

- Modül içerik dosyaları tam HTML belgesi değil, **parça (fragment)** olarak yazılır; `<style>` blokları içerir ve container'a enjekte edilir
- Stil çakışmasını önlemek için her modül kendi CSS öneki kullanır: `yb-` (yapı bedeli), `pb-` (proje bedeli), `cm-` (cephe metraj), `hub-` (hub sayfaları), `dk-` (döneme kopyala), `ed-` (editör)
- SVG ikonlar satır içi kullanılır; Inter font ve Slate renk paleti ortak tasarım dilini oluşturur

### 2. Uygulama Katmanı

**Dosyalar**: `shared/scripts/navigation.js`, `modules/*/scripts/*-page.js`

- Sayfa script'leri form mantığını, olay yönetimini ve DOM güncellemesini üstlenir
- `NavigationManager` sayfalar arası geçişi ve yaşam döngüsünü yönetir
- Modal bileşenleri (`donem-kopyala.js`) kendi DOM'unu ve stilini oluşturup `document.body`'ye ekler; sayfa script'lerinden bağımsız kullanılabilir

### 3. Saf Hesap Katmanı

**Dosyalar**: `modules/yapi-bedeli/scripts/donem-servisi.js`, `modules/hesaplama/scripts/metraj-hesap.js`

DOM'a dokunmayan, yalnızca veri alıp veri döndüren fonksiyonlar bu katmanda toplanır:

```javascript
// metraj-hesap.js - arayüzden bağımsız
function hesaplaCephe(cephe) { /* ... */ return { brutAlan, yuzeyler, ... }; }

// donem-servisi.js - DB sorguları + saf uyarlama
function raporuDonemeUyarla(yapilar, opts) { /* ... */ return { yapilar, uyarilar, toplam }; }
```

**Faydası**: Hesap mantığı arayüz açmadan çalıştırılabilir ve doğrulanabilir; aynı mantık birden fazla ekrandan kullanılabilir (dönem uyarlaması hem listeden hem editörden çağrılır).

### 4. Veri Katmanı

**Dosyalar**: `main.js` (şema + migration), `shared/scripts/db-helper.js` (yol çözümleme), sayfa script'lerindeki sorgular

- Şema oluşturma ve migration ana süreçte, uygulama açılışında çalışır
- Sorgular çoğunlukla renderer tarafında, sayfa script'lerinde yürütülür
- Veritabanı yolu her zaman `getDbPath()` üzerinden alınır (portable build uyumu için)

---

## Dosya Yapısı

```
projeA/
├── main.js                      # Ana süreç: pencere, DB şeması, migration, IPC
├── dashboard.html               # SPA kabuğu: dashboard + nav bar + #page-container
├── dashboard.js                 # Modül kartları, versiyon modalı, navigasyon başlatma
├── build.js                     # Obfuscation + build hazırlığı
├── package.json
│
├── shared/
│   └── scripts/
│       ├── navigation.js        # NavigationManager (SPA çekirdeği)
│       └── db-helper.js         # Veritabanı yolu çözümleme
│
├── modules/
│   ├── yapi-bedeli/
│   │   ├── views/               # hub, form, raporlar, editör, admin (HTML fragment)
│   │   ├── scripts/
│   │   │   ├── *-page.js        # Sayfa modülleri (SPA)
│   │   │   ├── donem-servisi.js # Dönem sorguları + uyarlama (saf)
│   │   │   ├── donem-kopyala.js # Döneme kopyalama modalı
│   │   │   └── reportGenerator.js
│   │   ├── styles/
│   │   └── KT_Sablon_1.docx
│   │
│   ├── proje-bedeli/
│   │   ├── views/               # hub, form, raporlar, editör
│   │   └── scripts/             # *-page.js + pb-reportGenerator.js
│   │
│   └── hesaplama/
│       ├── views/               # hub, cephe metrajı, kayıtlı metrajlar
│       └── scripts/
│           ├── metraj-hesap.js  # Metraj hesabı (saf)
│           └── *-page.js
│
├── assets/                      # İkonlar ve görseller
├── docs/                        # Dokümantasyon
├── raporlar/                    # Üretilen Word raporları
├── sehirler.json / ilceler.json # İl/ilçe tohum verisi
└── raporlar.db                  # SQLite veritabanı
```

### Kritik Dosyalar

| Dosya | Rol |
|-------|-----|
| `main.js` | Şema, migration ve Word export'un tek kaynağı |
| `shared/scripts/navigation.js` | Yeni sayfa eklemek için değiştirilmesi gereken tek ortak dosya |
| `shared/scripts/db-helper.js` | DB yolunu doğrudan yazmamak için daima kullanılmalı |
| `build.js` | Yeni script dosyası eklendiğinde `RENDERER_JS_FILES` listesine eklenmelidir |

---

## Veri Akışı

### 1. Rapor Oluşturma

```
Kullanıcı formu doldurur (yapi-bedeli-form)
   ↓
Sınıf/grup seçilir → birimFiyatDetay'dan birim fiyat çekilir
   ↓
Yapım tekniği + yaş girilir → yipranmaPaylari'ndan oran çekilir
   ↓
Bedel hesaplanır:
   bedel = birimFiyat × alan × (1 - yipranma/100) × (1 - eksikImalat/100)
   ↓
Yapılar yapilarJSON'a serileştirilir (çoklu parselde parsellerJSON)
   ↓
INSERT INTO raporlar
```

### 2. Word Raporu Üretimi

```
Editör / rapor listesi → veri toplanır
   ↓
ipcRenderer.send('export-word', data)
   ↓
main.js: dosya yolu belirlenir (raporlar/ klasörü)
   ↓
reportGenerator.js: docx ile belge kurulur (tablolar, imza, fotoğraflar)
   ↓
Dosya yazılır → shell.openPath() ile açılır
   ↓
ipcRenderer → 'word-export-success' / 'word-export-error'
```

Çoklu parsel raporları için ayrı bir üretici kullanılır (`generateCokluParselReport`): 10 sütunlu tablo, her parsel sonunda ara toplam, en altta genel toplam.

### 3. Farklı Döneme Kopyalama

```
Rapor listesi / editör → donem-kopyala.ac(db, nav, raporId)
   ↓
donem-servisi: hedef dönemin fiyat tablosu (Map) + yıpranma cetveli yüklenir
   ↓
raporuDonemeUyarla(): her yapı için
   • yaş yıl farkı kadar kaydırılır (isteğe bağlı)
   • yıpranma oranı cetvelden yeniden okunur
   • birim fiyat sınıf/grup anahtarıyla hedef dönemden çekilir
   • bedel yeniden hesaplanır
   ↓
Önizleme: eski → yeni karşılaştırma + uyarılar
   ↓
Onay → şemadan okunan kolonlarla YENİ satır INSERT edilir (kaynak korunur)
   ↓
Editör yeni rapor id'si ile açılır
```

### 4. IPC İletişimi

Renderer'dan ana sürece gönderilen başlıca kanallar:

| Kanal | Amaç |
|-------|------|
| `export-word` | Word raporu üretimi |
| `export-word-with-photos` | Fotoğraflı Word raporu |
| `export-word-from-preview` | Önizleme ekranından çıktı |
| `open-editor` | Ayrı editör penceresi (eski akış) |
| `open-preview` | Önizleme penceresi |

Ana süreçten renderer'a dönen bildirimler: `word-export-success`, `word-export-error`.

> Bu dinleyiciler sayfa `onUnload`'ında `ipcRenderer.removeListener()` ile kaldırılmalıdır; aksi halde sayfa her açıldığında yeni dinleyici eklenir ve tek işlem için birden fazla bildirim gösterilir.

---

## Teknoloji Stack

### Frontend

| Teknoloji | Kullanım |
|-----------|----------|
| HTML5 | Modül içerik fragment'ları |
| CSS3 | Modül önekli stiller, flexbox/grid, glassmorphism |
| Vanilla JS (ES6+) | async/await, template literal, destructuring, Map |
| Inter (@fontsource) | Tipografi |
| Satır içi SVG | İkonlar |

### Backend / Runtime

| Teknoloji | Kullanım |
|-----------|----------|
| Electron 34 | Masaüstü çerçevesi |
| @electron/remote | Renderer'dan `app` API'sine erişim (DB yolu için) |
| Node.js `fs` / `path` | Template okuma, dosya işlemleri |
| sqlite3 | Veritabanı (native modül) |

### Doküman İşleme

| Kütüphane | Kullanım |
|-----------|----------|
| docx | Word belgesi oluşturma (tablo, paragraf, görsel) |
| docxtemplater + pizzip | Şablon doldurma |
| mammoth | HTML dönüşümü |

### Build

| Araç | Kullanım |
|------|----------|
| electron-builder | Portable exe |
| javascript-obfuscator | Main (`target: node`) ve renderer (`target: browser-no-eval`) kodunun karartılması |

---

## Tasarım Kalıpları

### 1. Modül Kalıbı

Her sayfa script'i `module.exports` ile yaşam döngüsü fonksiyonlarını dışa açar; iç durum modül kapsamında kalır.

### 2. Saf Fonksiyon Katmanı

Hesap mantığı (`metraj-hesap.js`, `donem-servisi.js`) DOM'dan ayrılır. Girdi verisi alır, yeni veri döndürür; mevcut nesneleri değiştirmez:

```javascript
const y = Object.assign({}, yapi);   // kopya üzerinde çalışılır
```

### 3. Singleton

`NavigationManager` tek örnek olarak oluşturulup `window.navigation` üzerinden paylaşılır.

### 4. Şemadan Sürülen İşlem

Rapor kopyalamada sütun listesi `PRAGMA table_info()` ile okunur; şema değiştiğinde kod güncellenmeden çalışmaya devam eder.

### 5. Global Köprü

Template içindeki `onclick` işleyicileri için sayfa script'i sınırlı bir global tanımlar:

```javascript
window.cmPage = { boslukEkle, boslukSil, cikmaEkle, cikmaSil, cepheSec };
```

### 6. Tek Yönlü Durum

Cephe metrajı gibi karmaşık ekranlarda veri DOM'dan okunmaz; tek bir `metrajState` nesnesinde tutulur, değişiklikte arayüz yeniden çizilir.

---

## Güvenlik Mimarisi

### Mevcut Durum

```javascript
webPreferences: {
    nodeIntegration: true,
    contextIsolation: false
}
```

Bu yapılandırma renderer sürecine tam Node.js erişimi verir. Uygulama tamamen yerel çalıştığı, uzak içerik yüklemediği ve tek kullanıcılı olduğu için mevcut kullanım senaryosunda risk sınırlıdır. Yine de:

| Risk | Durum |
|------|-------|
| Uzak içerik yükleme | Yok - tüm içerik yerel dosyalardan |
| Kullanıcı girdisinin DOM'a basılması | Rapor/metraj adları gibi alanlar HTML'e yazılıyor |
| SQL enjeksiyonu | Sorgular parametreli (`?`) kullanıyor |

### Önerilen İyileştirmeler

1. `contextIsolation: true` + `preload` script ile sınırlı API yüzeyi
2. DB erişiminin tamamen ana sürece taşınması (IPC üzerinden)
3. Content Security Policy tanımlanması
4. Kullanıcı girdisi DOM'a basılırken kaçış uygulanması (bazı ekranlarda mevcut: `kacir()`)

---

## Performans Karakteristikleri

### Sayfa Geçişleri

Template dosyaları her geçişte diskten okunur; script'ler yalnızca ilk yüklemede `require()` edilir, sonrasında önbellekten gelir. Bu nedenle bir sayfaya ikinci gidiş belirgin şekilde hızlıdır.

### Veritabanı

- Kayıt sayısı tipik kullanımda küçüktür (yüzler mertebesi); sorgular indekssiz de hızlı çalışır
- Asıl maliyet fotoğraflardan gelir: `fotograflarJSON` base64 veri taşıdığı için hem dosya boyutunu hem okuma süresini artırır
- Rapor listesi tüm sütunları çektiği için (`SELECT *`) fotoğraflı kayıtlarda gereğinden fazla veri okunur

### Word Üretimi

Belge oluşturma ana süreçte yapılır; fotoğraf sayısı arttıkça süre uzar. İşlem sırasında arayüz bloke olmaz, sonuç IPC bildirimi ile döner.

### Ölçeklenebilirlik Notları

| Konu | Öneri |
|------|-------|
| Rapor listesi | Liste sorgusunda yalnızca gerekli sütunları seçmek |
| Fotoğraflar | Dosya sisteminde saklayıp DB'de yol tutmak |
| Büyük tablolar | `birimFiyatDetay.birimFiyatId` ve `raporlar.birimFiyatId` için indeks |

---

## Gelecek İyileştirmeler

### Kısa Vadeli

1. **Mevzuat modülü** - dördüncü modül
2. **Birim dönüşüm aracı** - Hesaplamalar modülü içinde (hub'da yer tutucu kart mevcut)
3. **Shared utilities** - para/tarih biçimleme, sayıyı yazıya çevirme gibi tekrar eden yardımcıların `shared/utils/` altında toplanması

### Orta Vadeli

1. **Güvenlik sıkılaştırması** - `contextIsolation: true` ve preload API
2. **DB erişiminin ana sürece taşınması** - renderer'dan doğrudan SQL yerine IPC servis katmanı
3. **Yedekleme sistemi** - uygulama içinden tarihli yedek alma

### Uzun Vadeli

1. **Test altyapısı** - saf hesap katmanları (`metraj-hesap.js`, `donem-servisi.js`) hâlihazırda test edilebilir durumda; birim test koşumu eklenmesi
2. **TypeScript'e geçiş** - özellikle veri modelleri için
3. **Auto-update mekanizması**

---

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
