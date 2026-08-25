# Geliştirici Rehberi

## İçindekiler

- [Geliştirme Ortamı](#geliştirme-ortamı)
- [Kod Standartları](#kod-standartları)
- [Yeni Özellik Ekleme](#yeni-özellik-ekleme)
- [Debugging](#debugging)
- [Test](#test)
- [Build ve Deployment](#build-ve-deployment)
- [Katkıda Bulunma](#katkıda-bulunma)

---

## Geliştirme Ortamı

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

## Kod Standartları

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

## Yeni Özellik Ekleme

### Geliştirme Süreci

```
1. Planlama
   ├─ Gereksinim analizi
   ├─ Hangi modüle ait? (yeni modül mü, mevcut modüle sayfa mı)
   └─ Veritabanı değişikliği gerekiyor mu

2. Geliştirme
   ├─ Veritabanı: main.js (şema + migration)
   ├─ Görünüm: modules/<modul>/views/*.html (fragment)
   ├─ Mantık:  modules/<modul>/scripts/*-page.js
   ├─ Saf hesap: ayrı dosyaya (DOM'suz)
   └─ Route: shared/scripts/navigation.js

3. Build listesi
   └─ build.js → RENDERER_JS_FILES

4. Test
   ├─ Sayfayı açıp konsol hatası kontrolü
   ├─ Saf hesap fonksiyonlarını node ile doğrulama
   └─ Migration'ı mevcut veritabanında deneme

5. Dokümantasyon
   ├─ CHANGELOG.md
   ├─ docs/ ilgili rehberler
   └─ package.json sürüm
```

---

### Örnek: Yeni SPA Sayfası Ekleme

#### 1. Görünüm Dosyası

`modules/hesaplama/views/yeni-arac-content.html` — tam HTML belgesi değil, **fragment**:

```html
<style>
    /* Modül öneki kullanın; stiller global'e sızar */
    .ya-container { padding: 24px; }
    .ya-baslik { font-size: 20px; font-weight: 600; }
</style>

<div class="ya-container">
    <h1 class="ya-baslik">Yeni Araç</h1>
    <button id="ya-hesaplaBtn">Hesapla</button>
</div>
```

#### 2. Sayfa Script'i

`modules/hesaplama/scripts/yeni-arac-page.js`:

```javascript
const sqlite3 = require('sqlite3').verbose();
const { getDbPath } = require('../../../shared/scripts/db-helper');

let db = null;
let nav = null;

async function onLoad(container, data, navigation) {
    nav = navigation;
    db = new sqlite3.Database(getDbPath());

    // Template'teki onclick'ler için köprü (gerekiyorsa)
    window.yaPage = { satirSil };

    document.getElementById('ya-hesaplaBtn').addEventListener('click', hesapla);
}

async function onUnload() {
    if (db) { db.close(); db = null; }
}

function hasUnsavedChanges() { return false; }

module.exports = { onLoad, onUnload, hasUnsavedChanges };
```

> **Dikkat**: Sayfa script'leri `require()` önbelleğinde kalır. Modül seviyesi değişkenler sayfa kapanınca sıfırlanmaz; durumu `onLoad` içinde kurun, `onUnload` içinde temizleyin. IPC dinleyicileri `onUnload`'da `removeListener` ile kaldırılmazsa her açılışta birikir.

#### 3. Route Kaydı

`shared/scripts/navigation.js` içindeki `pages` nesnesine ekleyin:

```javascript
'yeni-arac': {
    title: 'Yeni Araç',
    icon: '🔧',
    template: 'modules/hesaplama/views/yeni-arac-content.html',
    script: 'modules/hesaplama/scripts/yeni-arac-page.js'
}
```

Sayfaya geçiş:

```javascript
nav.navigateTo('yeni-arac', { kayitId: 5 });   // data, onLoad'a geçer
```

#### 4. Build Listesi

`build.js` içindeki `RENDERER_JS_FILES` dizisine yeni script'i ekleyin. **Bu adım atlanırsa dosya karartılmadan paketlenir.**

```javascript
const RENDERER_JS_FILES = [
    // ...
    'modules/hesaplama/scripts/yeni-arac-page.js',
];
```

---

### Örnek: Veritabanı Değişikliği

#### Yeni Tablo

`main.js` → `createDatabase()` içine:

```javascript
db.run(`CREATE TABLE IF NOT EXISTS yeniTablo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adi TEXT,
    verilerJSON TEXT,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (err) console.error('yeniTablo oluşturulamadı:', err);
});
```

`CREATE TABLE IF NOT EXISTS` kullanıldığı için mevcut veritabanlarında bir sonraki açılışta otomatik oluşur.

#### Yeni Kolon

Koşulsuz `ALTER TABLE` **kullanmayın**; her açılışta hata verir. Önce kolonun varlığını kontrol edin:

```javascript
db.all(`PRAGMA table_info(raporlar)`, [], (err, columns) => {
    if (err || !columns || columns.length === 0) return;
    if (columns.some(col => col.name === 'yeniKolon')) return;   // zaten var

    db.run(`ALTER TABLE raporlar ADD COLUMN yeniKolon TEXT`, (e) => {
        if (e) { console.error('yeniKolon eklenemedi:', e); return; }
        console.log('raporlar tablosuna yeniKolon eklendi.');
    });
});
```

**Migration kuralları**:

| Kural | Neden |
|-------|-------|
| Idempotent olmalı | Her açılışta çalışır; ikinci kez bir şey değiştirmemeli |
| Veri silmemeli | Kullanıcının mevcut kayıtları korunmalı |
| Hata durumunda sessizce geçmeli | Migration hatası uygulamanın açılmasını engellememeli |
| Veri dönüştürüyorsa dar kapsamlı olmalı | Yalnızca bozuk kayda dokunun; `tamirEtSinifGrup()` örneğine bakın |

---

### Saf Hesap Katmanı

Hesap mantığını DOM'dan ayırın. Bu, mantığın arayüz açmadan doğrulanabilmesini ve birden fazla ekrandan kullanılabilmesini sağlar.

```javascript
// metraj-hesap.js - DOM'a dokunmaz
function hesaplaCephe(cephe) {
    const brutAlan = sayi(cephe.en) * sayi(cephe.yukseklik);
    return { brutAlan, yuzeyler: { /* ... */ } };
}
module.exports = { hesaplaCephe };
```

Doğrulama:

```bash
node -e "const h=require('./modules/hesaplama/scripts/metraj-hesap'); console.log(h.hesaplaCephe({en:10,yukseklik:3}));"
```

**Girdi verisini değiştirmeyin**; kopya üzerinde çalışın:

```javascript
const y = Object.assign({}, yapi);
```

---

## Debugging

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

**Sayfa script (`*-page.js`)**:
```javascript
console.log('[IPC] show-reports mesajı gönderiliyor');
ipcRenderer.send('show-reports');
```

---

## Test

Projede otomatik test altyapısı kurulu değildir. Hesap mantığı saf fonksiyonlara ayrıldığı için bu katman Node ile doğrudan doğrulanabilir; arayüz akışları elle test edilir.

### Saf Fonksiyonları Doğrulama

`metraj-hesap.js` ve `donem-servisi.js` DOM gerektirmez; doğrudan çalıştırılabilir:

```javascript
// dogrula.js
const h = require('./modules/hesaplama/scripts/metraj-hesap');

const cephe = h.hesaplaCephe({
    en: 10, yukseklik: 3,
    bosluklar: [{ tip: 'pencere', en: 1.5, boy: 1.2, adet: 2, gommeDerinligi: 0.05 }]
});

console.log('brüt:', cephe.brutAlan);              // 30
console.log('cephe ön:', cephe.yuzeyler.cepheOn);  // 30 - 3.6 = 26.4
```

`donem-servisi.js` veritabanı gerektirir; **veritabanının bir kopyası üzerinde** çalışın:

```bash
cp raporlar.db test.db
node -e "
const ds = require('./modules/yapi-bedeli/scripts/donem-servisi');
const db = new (require('sqlite3').verbose().Database)('test.db');
ds.listeDonemler(db).then(d => console.log(d.length + ' dönem'));
"
```

### Elle Test Kontrol Listesi

#### Navigasyon
- [ ] Her modül kartı kendi hub sayfasını açıyor
- [ ] Hub'dan form, liste ve editöre geçişler çalışıyor
- [ ] Geri / ana sayfa butonları ve breadcrumb doğru çalışıyor
- [ ] Kaydedilmemiş değişiklikle çıkışta uyarı geliyor

#### Yapı Bedeli
- [ ] Sınıf/grup seçilince birim fiyat otomatik geliyor
- [ ] Yapım tekniği + yaş girilince yıpranma payı geliyor
- [ ] Çoklu yapı ekleme/silme çalışıyor
- [ ] Çoklu parsel modunda her parselde yapı numaraları 1'den başlıyor
- [ ] Toplam bedel ve Türkçe yazı doğru

#### Dönem Kopyalama
- [ ] Önizlemedeki eski→yeni değerler doğru
- [ ] Yaş kaydırma yıl farkı kadar uygulanıyor
- [ ] Tanımsız fiyat için uyarı çıkıyor ve eski fiyat korunuyor
- [ ] Kopyalama sonrası **kaynak rapor değişmemiş** olmalı

#### Cephe Metrajı
- [ ] Boşluk, çıkma ve saçak satırları toplamları etkiliyor
- [ ] Kapı ve denizlikli pencerede şafak çevresi `2*boy+en`
- [ ] Boya ve yalıtım toplamları ayarlara göre değişiyor
- [ ] Kayıt açılıp düzenlenebiliyor

#### Veritabanı
- [ ] Yeni kayıt ekleniyor, listeleniyor, siliniyor
- [ ] Migration mevcut veritabanında hatasız çalışıyor
- [ ] Uygulama silinmiş veritabanıyla açıldığında şema yeniden oluşuyor

### Uçtan Uca Sayfa Testi

Tüm sayfaların hatasız yüklendiğini toplu kontrol etmek için proje köküne geçici bir Electron giriş dosyası koyup `navigateTo` ile sayfaları sırayla gezebilirsiniz. Giriş dosyası **proje kökünde** olmalıdır; `getAppPath()` o klasörü döndürdüğü için template yolları ancak böyle çözülür.

---

## Build ve Deployment

Build sistemi kuruludur. `build.js` obfuscation ve hazırlık yapar, `electron-builder` portable exe üretir.

### Komutlar

```bash
# Yalnızca obfuscation - build-temp/ hazırlanır
npm run obfuscate

# Portable exe (obfuscation + electron-builder)
npm run build

# Paketlenmemiş klasör çıktısı (hata ayıklama)
npm run build:dir

# Obfuscation'ı atlayarak hazırlık (sorun ayıklama)
node build.js --no-obfuscate
```

Çıktı: `dist/ProjeA-<sürüm>-Portable.exe`

### build.js Adımları

| Adım | Yaptığı |
|------|---------|
| 1 | `build-temp/` temizlenir (node_modules junction'ı korunarak) |
| 2 | Kaynak dosyalar kopyalanır (node_modules, .git, dist, raporlar hariç) |
| 3 | `package.json`'dan devDependencies silinir, electronVersion sabitlenir, `npmRebuild: false` yapılır |
| 4 | Ana projedeki `node_modules` için junction kurulur |
| 5 | Tohum veritabanı `build-temp/extra/raporlar.db` olarak hazırlanır |
| 6 | JS dosyaları obfuscate edilir |

### Obfuscation Ayarları

İki ayrı profil vardır:

| Profil | Hedef | Kullanıldığı dosyalar |
|--------|-------|------------------------|
| `MAIN_OBFUSCATION_OPTIONS` | `target: 'node'` | `main.js` |
| `RENDERER_OBFUSCATION_OPTIONS` | `target: 'browser-no-eval'` | `dashboard.js`, `navigation.js`, modül script'leri |

> **Yeni bir renderer script'i eklediğinizde `RENDERER_JS_FILES` listesine eklemeyi unutmayın.** Liste dışındaki dosyalar karartılmadan paketlenir; hata vermez, sessizce açık kalır.

### node_modules Junction

`electron-builder`, `build-temp` altında baştan `npm install` ve native rebuild yapmasın diye ana projedeki `node_modules` klasörüne Windows junction kurulur. `sqlite3` zaten doğru Electron sürümü için derlenmiş olduğundan yeniden derleme hem gereksiz hem uzundur.

### Tohum Veritabanı

| Kaynak | Ne zaman kullanılır |
|--------|---------------------|
| `raporlar_build.db` | Varsa tercih edilir (kasıtlı temizlenmiş sürüm) |
| `raporlar.db` | Tohum yoksa veya `--use-dev-db` verildiyse |

Seçilen dosya `extraResources` ile ASAR dışında, exe'nin yanına konur. Uygulama ilk açılışta kalıcı klasörde veritabanı yoksa bu dosyayı oraya kopyalar (`seedDatabaseIfMissing()`).

> **Encoding uyarısı**: Tohum veritabanını PowerShell'den `sqlite3` komutuyla güncellemeyin. Türkçe karakterler Windows-1254 olarak yazılabilir (`İ` = `DD` olur, UTF-8'de `C4B0` olmalı). Güncellemeleri Node.js script'i ile yapın.

### Portable Sürüm ve Veritabanı Konumu

Portable exe kendini geçici klasöre açar; oraya yazılan veri her çıkışta silinir. Bu yüzden veritabanı yolu `PORTABLE_EXECUTABLE_DIR` (kullanıcının exe'yi çalıştırdığı kalıcı klasör) üzerinden çözülür. Kod içinde veritabanı yolu asla elle yazılmamalı, daima `getDbPath()` kullanılmalıdır.

### Sürüm Yükseltme

Sürüm birden fazla yerde geçer; hepsini birlikte güncelleyin:

| Yer | Ne |
|-----|-----|
| `package.json` | `version` alanı |
| `dashboard.html` | Footer'daki sürüm yazısı, versiyon modalı rozeti ve yayın tarihi, modal içeriği |
| `dashboard.js` | Konsol banner'ındaki sürüm |
| `CHANGELOG.md` | Yeni sürüm girişi |
| `README.md` | Sürüm rozeti ve alt bilgi |

Versiyon modalı, kullanıcıya o sürümün yeniliklerini gösterir; yeni sürümde içeriğini güncellemeyi unutmayın.

---

## Katkıda Bulunma

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

## Öğrenme Kaynakları

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

## Gelişmiş Konular

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

