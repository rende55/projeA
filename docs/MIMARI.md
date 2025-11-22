# Uygulama Mimarisi ve Yapısı

## 📋 İçindekiler

- [Mimari Genel Bakış](#mimari-genel-bakış)
- [Katmanlı Mimari](#katmanlı-mimari)
- [Dosya Yapısı](#dosya-yapısı)
- [Veri Akışı](#veri-akışı)
- [Teknoloji Stack](#teknoloji-stack)
- [Design Patterns](#design-patterns)

---

## 🏗️ Mimari Genel Bakış

KİTAR uygulaması, Electron framework'ü üzerinde çalışan, **üç katmanlı (3-tier)** mimari yapısına sahip bir masaüstü uygulamasıdır.

```
┌─────────────────────────────────────────┐
│         PRESENTATION LAYER              │
│    (HTML, CSS, UI Components)           │
├─────────────────────────────────────────┤
│         APPLICATION LAYER               │
│    (Business Logic, Calculations)       │
├─────────────────────────────────────────┤
│         DATA LAYER                      │
│    (SQLite Database, File System)       │
└─────────────────────────────────────────┘
```

### Electron Process Modeli

```
┌──────────────────────────────────────────────┐
│           MAIN PROCESS (Node.js)             │
│  - Uygulama yaşam döngüsü                    │
│  - Pencere yönetimi                          │
│  - Veritabanı bağlantısı                     │
│  - IPC iletişim                              │
└──────────────────────────────────────────────┘
                    │
                    │ IPC
                    │
┌──────────────────────────────────────────────┐
│        RENDERER PROCESSES (Chromium)         │
│  ┌──────────────┐      ┌──────────────┐     │
│  │  Ana Pencere │      │ Rapor Pencere│     │
│  │  (index.html)│      │(raporlar.html)│    │
│  └──────────────┘      └──────────────┘     │
└──────────────────────────────────────────────┘
```

---

## 📚 Katmanlı Mimari

### 1. Presentation Layer (Sunum Katmanı)

#### Dosyalar
- `index.html` - Ana form arayüzü
- `raporlar.html` - Rapor listeleme arayüzü
- `style.css` - Genel stil dosyası

#### Sorumluluklar
- Kullanıcı arayüzü render'ı
- Form validasyonu
- Kullanıcı etkileşimleri
- UI/UX yönetimi

#### Teknolojiler
- HTML5
- CSS3 (Gradient, Flexbox, Grid)
- Vanilla JavaScript

### 2. Application Layer (Uygulama Katmanı)

#### Dosyalar
- `renderer.js` - Ana form iş mantığı
- `raporlar.js` - Rapor yönetim mantığı
- `reportGenerator.js` - Rapor oluşturma mantığı

#### Sorumluluklar
- İş kuralları (business rules)
- Hesaplamalar
- Veri validasyonu
- Rapor oluşturma
- Yıpranma payı hesaplama
- Sayıyı yazıya çevirme

#### Teknolojiler
- JavaScript (ES6+)
- Node.js API'leri
- Electron IPC

### 3. Data Layer (Veri Katmanı)

#### Dosyalar
- `main.js` - Veritabanı yönetimi
- `raporlar.db` - SQLite veritabanı

#### Sorumluluklar
- Veritabanı bağlantısı
- CRUD işlemleri
- Veri kalıcılığı
- Dosya sistemi erişimi

#### Teknolojiler
- SQLite3
- Node.js File System (fs)
- Path modülü

---

## 📁 Dosya Yapısı

```
kitar/
│
├── main.js                     # Electron ana süreç
├── index.html                  # Ana form UI
├── renderer.js                 # Ana form mantığı
├── raporlar.html               # Rapor listesi UI
├── raporlar.js                 # Rapor listesi mantığı
├── reportGenerator.js          # Rapor oluşturma modülü
├── style.css                   # Genel stiller (kullanılmıyor)
│
├── package.json                # Proje yapılandırması
├── package-lock.json           # Bağımlılık kilidi
│
├── raporlar.db                 # SQLite veritabanı
│
├── raporlar_cikti/             # Oluşturulan raporlar
│   └── Rapor_X_YYYYMMDD.docx
│
├── KT_Sablon_1.docx           # Word şablonu (kullanılmıyor)
├── KT_Sablon_1_backup.docx    # Yedek şablon
├── KT_Sablon_1_Clean.docx     # Temiz şablon
│
├── Screenshot_1.jpg            # Uygulama ekran görüntüsü
│
├── node_modules/               # NPM bağımlılıkları
│   ├── electron/
│   ├── sqlite3/
│   ├── docx/
│   └── ...
│
└── docs/                       # Dokümantasyon
    ├── README.md
    ├── KURULUM.md
    ├── MIMARI.md
    ├── VERITABANI.md
    ├── MODULLER.md
    ├── KULLANIM.md
    └── GELISTIRICI.md
```

### Dosya Detayları

| Dosya | Satır Sayısı | Amaç |
|-------|--------------|------|
| `main.js` | ~126 | Electron main process |
| `index.html` | ~510 | Ana form HTML |
| `renderer.js` | ~292 | Form JavaScript mantığı |
| `raporlar.html` | ~131 | Rapor listesi HTML |
| `raporlar.js` | ~123 | Rapor listesi JavaScript |
| `reportGenerator.js` | ~295 | Word rapor oluşturma |
| `style.css` | ~82 | Genel CSS (eski) |

---

## 🔄 Veri Akışı

### 1. Rapor Oluşturma Akışı

```
┌──────────────┐
│  Kullanıcı   │
│  Form Doldur │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│  renderer.js     │
│  - Validasyon    │
│  - Hesaplama     │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  SQLite Insert   │
│  (main.js)       │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  raporlar.db     │
│  Kayıt ID: X     │
└──────────────────┘
```

### 2. Rapor Word Oluşturma Akışı

```
┌──────────────────┐
│ Kullanıcı        │
│ "Rapor Oluştur"  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  raporlar.js     │
│  db.get(id)      │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ reportGenerator  │
│ .generateReport()│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  docx Library    │
│  Create Document │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ raporlar_cikti/  │
│ Rapor_X.docx     │
└──────────────────┘
```

### 3. IPC İletişim Akışı

```
┌──────────────────────┐
│  renderer.js         │
│  (Ana Pencere)       │
└──────┬───────────────┘
       │
       │ ipcRenderer.send('show-reports')
       │
       ▼
┌──────────────────────┐
│  main.js             │
│  (Main Process)      │
└──────┬───────────────┘
       │
       │ BrowserWindow.create()
       │
       ▼
┌──────────────────────┐
│  raporlar.html       │
│  (Yeni Pencere)      │
└──────────────────────┘
```

---

## 🛠️ Teknoloji Stack

### Frontend Stack

```
┌─────────────────────────────────┐
│  HTML5                          │
│  ├─ Semantic Markup             │
│  ├─ Form Elements               │
│  └─ Data Attributes             │
├─────────────────────────────────┤
│  CSS3                           │
│  ├─ Flexbox Layout              │
│  ├─ Grid Layout                 │
│  ├─ Gradient Backgrounds        │
│  ├─ Animations                  │
│  └─ Responsive Design           │
├─────────────────────────────────┤
│  JavaScript (ES6+)              │
│  ├─ Arrow Functions             │
│  ├─ Template Literals           │
│  ├─ Destructuring               │
│  ├─ Async/Await (Promise)       │
│  └─ Event Handling              │
└─────────────────────────────────┘
```

### Backend Stack

```
┌─────────────────────────────────┐
│  Electron 34.0.1                │
│  ├─ Main Process                │
│  ├─ Renderer Process            │
│  ├─ IPC Communication           │
│  └─ Remote Module               │
├─────────────────────────────────┤
│  Node.js Runtime                │
│  ├─ File System (fs)            │
│  ├─ Path Module                 │
│  └─ Buffer                      │
├─────────────────────────────────┤
│  SQLite3 5.1.7                  │
│  ├─ CRUD Operations             │
│  ├─ Prepared Statements         │
│  └─ Error Handling              │
└─────────────────────────────────┘
```

### Document Processing Stack

```
┌─────────────────────────────────┐
│  docx 9.5.1                     │
│  ├─ Document Creation           │
│  ├─ Paragraph                   │
│  ├─ Table                       │
│  ├─ TextRun                     │
│  └─ Packer                      │
├─────────────────────────────────┤
│  docxtemplater 3.67.0 (Hazır)  │
│  ├─ Template Processing         │
│  └─ Variable Replacement        │
├─────────────────────────────────┤
│  pizzip 3.2.0                   │
│  └─ ZIP Operations              │
└─────────────────────────────────┘
```

---

## 🎨 Design Patterns

### 1. Module Pattern

Her JavaScript dosyası kendi scope'unda çalışır:

```javascript
// reportGenerator.js
function sayiyiYaziyaCevir(sayi) { ... }
function formatTarih(tarih) { ... }
function generateReport(data, path) { ... }

module.exports = { generateReport, sayiyiYaziyaCevir, formatTarih };
```

### 2. Event-Driven Pattern

UI etkileşimleri event listener'larla yönetilir:

```javascript
// renderer.js
document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', nextTab);
});

form.addEventListener('submit', (event) => { ... });
```

### 3. Singleton Pattern

Veritabanı bağlantısı singleton pattern kullanır:

```javascript
// main.js
let db; // Global tek instance

function createDatabase() {
    db = new sqlite3.Database(path.join(__dirname, 'raporlar.db'));
}
```

### 4. Factory Pattern

Rapor oluşturma factory pattern benzeri yapıdadır:

```javascript
// reportGenerator.js
function generateReport(raporData, outputPath) {
    const doc = new Document({ ... });
    return Packer.toBuffer(doc);
}
```

### 5. Observer Pattern

Electron IPC observer pattern kullanır:

```javascript
// main.js (Observer)
ipcMain.on('show-reports', (event) => {
    // Yeni pencere oluştur
});

// renderer.js (Subject)
ipcRenderer.send('show-reports');
```

---

## 🔐 Güvenlik Mimarisi

### Context Isolation: Disabled ⚠️

```javascript
// main.js
webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,  // GÜVENLİK RİSKİ!
    enableRemoteModule: true
}
```

**Not**: Bu yapılandırma geliştirme kolaylığı için kullanılmış ancak production için güvenli değildir.

### Önerilen İyileştirme

```javascript
webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
}
```

---

## 📊 Performans Karakteristikleri

### Bellek Kullanımı
- **Başlangıç**: ~150 MB
- **Çalışma**: ~200-250 MB
- **Veritabanı**: <10 MB (1000 kayıt için)

### İşlem Süreleri
- **Uygulama başlatma**: 2-3 saniye
- **Form kaydetme**: <100 ms
- **Word rapor oluşturma**: 500-1000 ms
- **Veritabanı sorgusu**: <50 ms

### Ölçeklenebilirlik
- **Maksimum kayıt**: 10,000+ (teorik)
- **Eşzamanlı pencere**: 5-10
- **Dosya boyutu**: Word rapor ~50 KB

---

## 🔮 Gelecek Mimari İyileştirmeleri

### 1. Modüler Yapı
```
src/
├── main/
│   ├── database.js
│   ├── window-manager.js
│   └── ipc-handlers.js
├── renderer/
│   ├── components/
│   ├── utils/
│   └── services/
└── shared/
    ├── constants.js
    └── validators.js
```

### 2. State Management
- Redux veya Zustand entegrasyonu
- Merkezi state yönetimi

### 3. TypeScript Dönüşümü
- Tip güvenliği
- Better IDE support
- Refactoring kolaylığı

### 4. Testing Infrastructure
- Unit tests (Jest)
- Integration tests (Spectron)
- E2E tests

### 5. CI/CD Pipeline
- Automated builds
- Automated testing
- Version management

---

**Son Güncelleme**: 2024

