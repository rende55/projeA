# Geliştirici Rehberi

## 📋 İçindekiler

- [Geliştirme Ortamı](#geliştirme-ortamı)
- [Kod Standartları](#kod-standartları)
- [Yeni Özellik Ekleme](#yeni-özellik-ekleme)
- [Debugging](#debugging)
- [Testing](#testing)
- [Build ve Deployment](#build-ve-deployment)
- [Katkıda Bulunma](#katkıda-bulunma)

---

## 💻 Geliştirme Ortamı

### Önerilen IDE

#### Visual Studio Code

**Önerilen Eklentiler**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "csstools.postcss",
    "ritwickdey.liveserver"
  ]
}
```

**VS Code Ayarları** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 4,
  "files.encoding": "utf8",
  "files.eol": "\n"
}
```

---

### Debugging Yapılandırması

**launch.json** (VS Code):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Electron: Main",
      "type": "node",
      "request": "launch",
      "protocol": "inspector",
      "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron",
      "runtimeArgs": [
        "${workspaceRoot}/main.js",
        "--remote-debugging-port=9223"
      ],
      "windows": {
        "runtimeExecutable": "${workspaceRoot}/node_modules/.bin/electron.cmd"
      }
    },
    {
      "name": "Electron: Renderer",
      "type": "chrome",
      "request": "attach",
      "port": 9223,
      "webRoot": "${workspaceFolder}",
      "timeout": 30000
    }
  ]
}
```

---

### Git Yapılandırması

**.gitignore**:
```
# Dependencies
node_modules/

# Database
*.db
*.db-journal

# Output
raporlar_cikti/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
npm-debug.log*
*.log

# Build
dist/
out/

# Temp
*.tmp
```

---

## 📝 Kod Standartları

### JavaScript Style Guide

#### Değişken İsimlendirme

```javascript
// ✅ Doğru: camelCase
let raporTarihi = '2024-10-26';
let yapiBedeli = 1000000;

// ❌ Yanlış: snake_case, PascalCase
let rapor_tarihi = '2024-10-26';  // Yanlış
let YapiBedeli = 1000000;         // Yanlış
```

#### Fonksiyon İsimlendirme

```javascript
// ✅ Doğru: Eylem belirten fiil + nesne
function hesaplaYipranmaPay() { }
function formatTarih() { }
function createDatabase() { }

// ❌ Yanlış: Belirsiz isimler
function process() { }  // Ne işliyor?
function doIt() { }     // Neyi yapıyor?
```

#### Sabitler

```javascript
// ✅ Doğru: UPPER_CASE
const MAX_YAPI_YASI = 200;
const DEFAULT_IL = 'Samsun';

// ❌ Yanlış: camelCase
const maxYapiYasi = 200;  // Değişken gibi görünüyor
```

---

### Kod Organizasyonu

#### Dosya Yapısı

```javascript
// 1. Dependencies
const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();

// 2. Global değişkenler
let db;
let currentTab = 0;

// 3. Sabitler
const SAMSUN_ILCELERI = [...];

// 4. Yardımcı fonksiyonlar
function formatTarih(tarih) { }

// 5. Ana fonksiyonlar
function createDatabase() { }

// 6. Event listeners
window.onload = () => { };

// 7. Exports (varsa)
module.exports = { ... };
```

---

### Yorum Standartları

#### Fonksiyon Yorumları

```javascript
/**
 * Sayıyı Türkçe yazıya çevirir
 * @param {number} sayi - Çevrilecek sayı
 * @returns {string} Türkçe yazı karşılığı
 * @example
 * sayiyiYaziyaCevir(1234);
 * // Returns: "bin ikiyüz otuz dört"
 */
function sayiyiYaziyaCevir(sayi) {
    // Implementation
}
```

#### Satır Yorumları

```javascript
// ✅ Doğru: Neden açıklayan
// Yıpranma payını Resmi Gazete cetvellerine göre hesapla
const yipranmaPay = hesaplaYipranmaPay(yapimTeknigi, yapiYasi);

// ❌ Gereksiz: Ne yaptığını açıklayan
// Yıpranma payı değişkenine fonksiyon sonucu atanıyor
const yipranmaPay = hesaplaYipranmaPay(yapimTeknigi, yapiYasi);
```

---

### Error Handling

```javascript
// ✅ Doğru: Try-catch ile hata yakalama
function generateReport(data, path) {
    try {
        const doc = createDocument(data);
        saveDocument(doc, path);
        return { success: true };
    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        return { success: false, error: error.message };
    }
}

// ✅ Doğru: Callback hata kontrolü
db.run(query, params, function(err) {
    if (err) {
        console.error('Veritabanı hatası:', err.message);
        return;
    }
    console.log('İşlem başarılı');
});
```

---

## 🚀 Yeni Özellik Ekleme

### Özellik Geliştirme Süreci

```
1. Planlama
   ├─ Gereksinim analizi
   ├─ Tasarım
   └─ Veritabanı değişiklikleri

2. Geliştirme
   ├─ Backend (main.js)
   ├─ Frontend (HTML/CSS)
   └─ Logic (renderer.js)

3. Test
   ├─ Manuel test
   ├─ Edge case test
   └─ Integration test

4. Dokümantasyon
   ├─ Kod yorumları
   ├─ README güncelleme
   └─ KULLANIM.md güncelleme

5. Deployment
   └─ Version bump
```

---

### Örnek: Yeni Form Alanı Ekleme

#### 1. HTML Güncelleme

**index.html**:
```html
<div class="form-group">
    <label for="yeniAlan">Yeni Alan *</label>
    <input type="text" id="yeniAlan" placeholder="Değer girin" required>
</div>
```

#### 2. Veritabanı Güncelleme

**main.js**:
```javascript
db.run(`ALTER TABLE raporlar ADD COLUMN yeniAlan TEXT`);
```

**Veya yeni tablo oluşturma**:
```javascript
db.run(`CREATE TABLE IF NOT EXISTS raporlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    // ... mevcut kolonlar
    yeniAlan TEXT
)`);
```

#### 3. Form Logic Güncelleme

**renderer.js**:
```javascript
// Form submit event'inde
form.addEventListener('submit', (event) => {
    event.preventDefault();
    
    // Mevcut alanlar...
    const yeniAlan = document.getElementById('yeniAlan').value;
    
    // INSERT query güncelleme
    db.run(`INSERT INTO raporlar (..., yeniAlan) VALUES (..., ?)`, 
        [...values..., yeniAlan], 
        function(err) { ... }
    );
});
```

#### 4. Rapor Oluşturma Güncelleme

**reportGenerator.js**:
```javascript
function generateReport(raporData, outputPath) {
    // Yeni alan kullanımı
    new Paragraph({
        children: [
            new TextRun({
                text: `Yeni Alan: ${raporData.yeniAlan || ''}`
            })
        ]
    })
}
```

---

### Örnek: Yeni Hesaplama Fonksiyonu

```javascript
/**
 * Arsa değeri hesaplar
 * @param {number} yuzolcumu - Arsa yüzölçümü (m²)
 * @param {number} m2Fiyat - m² başına fiyat (TL)
 * @returns {number} Toplam arsa değeri
 */
function hesaplaArsaDegeri(yuzolcumu, m2Fiyat) {
    if (!yuzolcumu || !m2Fiyat) {
        throw new Error('Geçersiz parametreler');
    }
    
    const yuzolcum = parseFloat(yuzolcumu);
    const fiyat = parseFloat(m2Fiyat);
    
    if (isNaN(yuzolcum) || isNaN(fiyat)) {
        throw new Error('Sayısal değer bekleniyor');
    }
    
    return yuzolcum * fiyat;
}

// Kullanım
try {
    const arsaDegeri = hesaplaArsaDegeri('150.50', '5000');
    console.log('Arsa Değeri:', arsaDegeri.toFixed(2));
} catch (error) {
    console.error('Hesaplama hatası:', error.message);
}
```

---

## 🐛 Debugging

### Chrome DevTools

Electron uygulamasında DevTools açmak:

**Otomatik açılma** (main.js):
```javascript
function createWindow() {
    mainWindow = new BrowserWindow({ ... });
    
    // DevTools'u aç
    mainWindow.webContents.openDevTools();
}
```

**Klavye kısayolu**:
- Windows/Linux: `Ctrl + Shift + I`
- macOS: `Cmd + Option + I`

---

### Console Logging

```javascript
// Basit log
console.log('Değer:', value);

// Hata log
console.error('Hata oluştu:', error);

// Uyarı log
console.warn('Dikkat:', warning);

// Tablo görünümü
console.table(data);

// Süre ölçümü
console.time('İşlem');
// ... kod
console.timeEnd('İşlem');
```

---

### Veritabanı Debugging

```javascript
// SQL query'yi logla
const query = `SELECT * FROM raporlar WHERE id = ?`;
console.log('SQL:', query, 'Params:', [id]);

db.get(query, [id], (err, row) => {
    if (err) {
        console.error('DB Error:', err);
        return;
    }
    console.log('Result:', row);
});
```

**SQLite CLI ile debug**:
```bash
sqlite3 raporlar.db

# SQL komutları
.tables
.schema raporlar
SELECT * FROM raporlar;
.quit
```

---

### Network Debugging

IPC mesajlarını logla:

**main.js**:
```javascript
ipcMain.on('show-reports', (event) => {
    console.log('[IPC] show-reports event alındı');
    console.log('Sender:', event.sender.id);
    // ...
});
```

**renderer.js**:
```javascript
console.log('[IPC] show-reports mesajı gönderiliyor');
ipcRenderer.send('show-reports');
```

---

## 🧪 Testing

### Manuel Test Checklist

#### Form Testi
- [ ] Tüm zorunlu alanlar dolu olmadan kayıt yapılamıyor
- [ ] Tarih alanları geçerli tarih kabul ediyor
- [ ] Sayısal alanlar sadece sayı kabul ediyor
- [ ] Tab navigasyonu çalışıyor
- [ ] İleri/Geri butonları doğru çalışıyor

#### Hesaplama Testi
- [ ] Yıpranma payı otomatik hesaplanıyor
- [ ] Yapı bedeli doğru hesaplanıyor
- [ ] Levazım bedeli doğru hesaplanıyor
- [ ] Sayıyı yazıya çevirme doğru çalışıyor

#### Veritabanı Testi
- [ ] Kayıt ekleniyor
- [ ] Kayıtlar listeleniyor
- [ ] Kayıt siliniyor
- [ ] Veritabanı dosyası oluşuyor

#### Rapor Testi
- [ ] Word dosyası oluşuyor
- [ ] Rapor içeriği doğru
- [ ] Dosya adı doğru formatlanıyor
- [ ] Dosya otomatik açılıyor

---

### Unit Test Örneği (Jest)

**Kurulum**:
```bash
npm install --save-dev jest
```

**package.json**:
```json
{
  "scripts": {
    "test": "jest"
  }
}
```

**reportGenerator.test.js**:
```javascript
const { sayiyiYaziyaCevir, formatTarih } = require('./reportGenerator');

describe('sayiyiYaziyaCevir', () => {
    test('0 sayısını sıfır olarak döndürmeli', () => {
        expect(sayiyiYaziyaCevir(0)).toBe('sıfır');
    });
    
    test('1234 sayısını doğru çevirmeli', () => {
        expect(sayiyiYaziyaCevir(1234)).toBe('bin ikiyüz otuz dört');
    });
    
    test('Geçersiz input için boş string döndürmeli', () => {
        expect(sayiyiYaziyaCevir(null)).toBe('');
        expect(sayiyiYaziyaCevir(undefined)).toBe('');
        expect(sayiyiYaziyaCevir('abc')).toBe('');
    });
});

describe('formatTarih', () => {
    test('Tarih doğru formatlanmalı', () => {
        expect(formatTarih('2024-10-26')).toBe('26.10.2024');
    });
    
    test('Geçersiz input için boş string döndürmeli', () => {
        expect(formatTarih(null)).toBe('');
        expect(formatTarih(undefined)).toBe('');
    });
});
```

**Test çalıştırma**:
```bash
npm test
```

---

## 📦 Build ve Deployment

### Electron Builder Kurulumu

```bash
npm install --save-dev electron-builder
```

### Build Konfigürasyonu

**package.json**:
```json
{
  "name": "Kitar",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win",
    "build:mac": "electron-builder --mac",
    "build:linux": "electron-builder --linux"
  },
  "build": {
    "appId": "com.kitar.app",
    "productName": "Kıymet Takdir Raporu",
    "copyright": "Copyright © 2024",
    "directories": {
      "output": "dist",
      "buildResources": "assets"
    },
    "files": [
      "**/*",
      "!**/*.md",
      "!docs/**/*",
      "!.vscode/**/*",
      "!.git/**/*"
    ],
    "win": {
      "target": ["nsis", "portable"],
      "icon": "assets/icon.ico"
    },
    "mac": {
      "target": "dmg",
      "icon": "assets/icon.icns",
      "category": "public.app-category.business"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "icon": "assets/icon.png",
      "category": "Office"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

---

### İkonlar

Gerekli ikon formatları:

```
assets/
├── icon.ico      # Windows (256x256)
├── icon.icns     # macOS
└── icon.png      # Linux (512x512)
```

**İkon oluşturma aracı**:
```bash
npm install --global electron-icon-maker

electron-icon-maker --input=./icon.png --output=./assets
```

---

### Build Komutları

```bash
# Tüm platformlar için build
npm run build

# Sadece Windows
npm run build:win

# Sadece macOS
npm run build:mac

# Sadece Linux
npm run build:linux
```

**Çıktı**:
```
dist/
├── Kitar Setup 1.0.0.exe        # Windows installer
├── Kitar 1.0.0.exe              # Windows portable
├── Kitar-1.0.0.dmg              # macOS
├── Kitar-1.0.0.AppImage         # Linux AppImage
└── kitar_1.0.0_amd64.deb        # Linux Debian
```

---

### Version Management

**package.json version güncelleme**:
```bash
# Minor version bump (1.0.0 -> 1.0.1)
npm version patch

# Minor version bump (1.0.0 -> 1.1.0)
npm version minor

# Major version bump (1.0.0 -> 2.0.0)
npm version major
```

---

## 🤝 Katkıda Bulunma

### Git Workflow

#### Branch Strategy

```
main (production)
├── develop (development)
│   ├── feature/yeni-ozellik
│   ├── bugfix/hata-duzeltme
│   └── hotfix/acil-duzeltme
```

#### Commit Mesajları

**Format**:
```
<tip>: <kısa açıklama>

<detaylı açıklama (opsiyonel)>

<footer (opsiyonel)>
```

**Tipler**:
- `feat`: Yeni özellik
- `fix`: Hata düzeltme
- `docs`: Dokümantasyon
- `style`: Kod formatı (işlevsellik değişmez)
- `refactor`: Kod iyileştirme
- `test`: Test ekleme/düzeltme
- `chore`: Build, dependency güncellemeleri

**Örnekler**:
```bash
feat: Arsa değeri hesaplama özelliği eklendi

Yeni hesaplama fonksiyonu ile arsa m² değerine göre
toplam arsa değeri hesaplanıyor.

Closes #45

---

fix: Yıpranma payı hesaplama hatası düzeltildi

50 yaş üstü yapılar için yıpranma payı yanlış 
hesaplanıyordu. Infinity değeri kontrolü eklendi.

---

docs: Kullanım kılavuzu güncellendi

Yeni özellikler dokümantasyona eklendi.
```

---

### Pull Request Süreci

1. **Branch oluştur**:
```bash
git checkout -b feature/yeni-ozellik
```

2. **Değişiklikleri yap ve commit et**:
```bash
git add .
git commit -m "feat: Yeni özellik eklendi"
```

3. **Push et**:
```bash
git push origin feature/yeni-ozellik
```

4. **Pull Request aç** (GitHub/GitLab'da)

5. **Review bekle**

6. **Merge** (onaylandıktan sonra)

---

### Code Review Checklist

Reviewer için kontrol listesi:

- [ ] Kod standartlarına uygun mu?
- [ ] Değişiklikler test edildi mi?
- [ ] Dokümantasyon güncellendi mi?
- [ ] Geriye dönük uyumluluk korundu mu?
- [ ] Performans etkileri değerlendirildi mi?
- [ ] Güvenlik açıkları var mı?
- [ ] Console log'lar temizlendi mi?

---

## 📚 Öğrenme Kaynakları

### Electron
- [Electron Docs](https://www.electronjs.org/docs)
- [Electron API Demos](https://github.com/electron/electron-api-demos)

### SQLite
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [node-sqlite3 Docs](https://github.com/TryGhost/node-sqlite3/wiki)

### docx Library
- [docx Docs](https://docx.js.org/)
- [docx GitHub](https://github.com/dolanmiu/docx)

---

## 🔧 Gelişmiş Konular

### Performance Optimization

```javascript
// Lazy loading
const heavyModule = require('./heavy-module');

button.addEventListener('click', async () => {
    const result = await heavyModule.process();
});

// Debouncing
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const searchInput = document.getElementById('search');
searchInput.addEventListener('input', debounce((e) => {
    search(e.target.value);
}, 300));
```

### Memory Management

```javascript
// Event listener temizleme
class ReportManager {
    constructor() {
        this.handleClick = this.handleClick.bind(this);
    }
    
    init() {
        this.button.addEventListener('click', this.handleClick);
    }
    
    destroy() {
        this.button.removeEventListener('click', this.handleClick);
        this.button = null;
    }
}
```

---

**Happy Coding!** 🚀

**Son Güncelleme**: 2024

