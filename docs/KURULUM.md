# Kurulum ve Yapılandırma Rehberi

## İçindekiler

- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Kurulum Adımları](#kurulum-adımları)
- [Yapılandırma](#yapılandırma)
- [Sorun Giderme](#sorun-giderme)
- [Güncelleme](#güncelleme)

---

## Sistem Gereksinimleri

### Minimum Gereksinimler

#### Donanım
- **İşlemci**: Intel Core i3 veya eşdeğeri
- **RAM**: 4 GB
- **Disk Alanı**: 500 MB boş alan
- **Ekran Çözünürlüğü**: 1280x720

#### Yazılım
- **İşletim Sistemi**: 
  - Windows 7 veya üzeri
  - macOS 10.10 (Yosemite) veya üzeri
  - Linux (Ubuntu 14.04+, Fedora 24+, Debian 8+)
- **Node.js**: v14.0.0 veya üzeri
- **npm**: v6.0.0 veya üzeri

### Önerilen Gereksinimler

#### Donanım
- **İşlemci**: Intel Core i5 veya üzeri
- **RAM**: 8 GB
- **Disk Alanı**: 2 GB boş alan
- **Ekran Çözünürlüğü**: 1920x1080

#### Yazılım
- **Node.js**: v18.0.0 LTS
- **npm**: v9.0.0 veya üzeri

---

## Kurulum Adımları

### 1. Node.js Kurulumu

#### Windows
```bash
# Node.js web sitesinden Windows installer indirin
# https://nodejs.org/

# İndirilen .msi dosyasını çalıştırın
# Kurulum sihirbazını takip edin
```

#### macOS
```bash
# Homebrew ile kurulum
brew install node

# Veya Node.js web sitesinden macOS installer indirin
```

#### Linux (Ubuntu/Debian)
```bash
# NodeSource repository ekleyin
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Node.js kurulumu
sudo apt-get install -y nodejs
```

### 2. Node.js Kurulumunu Doğrulama

```bash
# Node.js versiyonunu kontrol edin
node --version
# Çıktı: v18.x.x veya üzeri

# npm versiyonunu kontrol edin
npm --version
# Çıktı: 9.x.x veya üzeri
```

### 3. Projeyi İndirme

#### Git ile
```bash
# Projeyi klonlayın
git clone [repository-url]

# Proje dizinine gidin
cd projeA
```

#### ZIP ile
```bash
# Projeyi ZIP olarak indirip açın
# Terminal/CMD ile proje dizinine gidin
cd path/to/projeA
```

### 4. Bağımlılıkları Yükleme

```bash
# Tüm npm paketlerini yükleyin
npm install

# Kurulum logunu görüntüleyin
# Hata olmadığından emin olun
```

#### Beklenen Çıktı
```
added 150 packages, and audited 151 packages in 30s
found 0 vulnerabilities
```

### 5. SQLite3 Native Modülü

Bazı durumlarda SQLite3 için native modül yeniden derlenmesi gerekebilir:

```bash
# Electron için rebuild
npm install --save-dev electron-rebuild

# Rebuild işlemi
npx electron-rebuild

# Veya
./node_modules/.bin/electron-rebuild
```

### 6. Uygulamayı Çalıştırma

```bash
# Geliştirme modunda çalıştırın
npm start

# Veya
electron .
```

---

## Yapılandırma

### Package.json

`package.json` dosyasında temel ayarlar:

```json
{
  "name": "Kitar",
  "version": "2.2.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

#### Özelleştirme Seçenekleri

**Uygulama Adı**
```json
"name": "proje-a"
```

**Versiyon**
```json
"version": "2.2.0"
```

**Ek Scriptler Ekleme**
```json
"scripts": {
  "start": "electron .",
  "dev": "electron . --inspect",
  "build": "electron-builder"
}
```

### Veritabanı Yapılandırması

Veritabanı dosyası (`raporlar.db`) otomatik olarak proje dizininde oluşturulur.

**Özel Konum Belirtme** (main.js içinde):

```javascript
const dbPath = path.join(__dirname, 'custom_folder', 'raporlar.db');
db = new sqlite3.Database(dbPath);
```

### Rapor Çıktı Dizini

Raporlar varsayılan olarak `raporlar_cikti` klasörüne kaydedilir.

**Özel Konum Belirtme** (raporlar.js içinde):

```javascript
const outputDir = path.join(__dirname, 'custom_output_folder');
```

---

## Sorun Giderme

### 1. "Cannot find module" Hatası

**Sorun**: Bir npm paketi bulunamıyor.

**Çözüm**:
```bash
# node_modules silip yeniden yükleyin
rm -rf node_modules
npm install

# Veya Windows'ta
rmdir /s /q node_modules
npm install
```

### 2. SQLite3 Native Binding Hatası

**Sorun**: SQLite3 modülü Electron ile uyumsuz.

**Çözüm**:
```bash
# Electron için rebuild
npm install --save-dev electron-rebuild
npx electron-rebuild

# Alternatif: Manuel rebuild
npm rebuild sqlite3 --build-from-source --runtime=electron --target=34.0.1 --dist-url=https://electronjs.org/headers
```

### 3. Electron Çalışmıyor

**Sorun**: Uygulama açılmıyor veya beyaz ekran görünüyor.

**Çözüm**:
```bash
# Electron'u yeniden yükleyin
npm uninstall electron
npm install electron --save-dev

# Cache temizleyin
npm cache clean --force
```

### 4. Veritabanı Oluşturulamıyor

**Sorun**: `raporlar.db` dosyası oluşturulmuyor.

**Çözüm**:
- Proje dizinine yazma izni olduğundan emin olun
- Antivirüs yazılımını geçici olarak devre dışı bırakın
- Farklı bir dizin belirtin

### 5. Rapor Oluşturulmuyor

**Sorun**: Word dosyası oluşturulmuyor.

**Çözüm**:
```bash
# docx paketini kontrol edin
npm list docx

# Yeniden yükleyin
npm uninstall docx
npm install docx@9.5.1
```

### 6. Port Çakışması

**Sorun**: Electron uygulaması açılmıyor (nadir).

**Çözüm**:
```bash
# Tüm Electron süreçlerini kapatın
# Windows:
taskkill /F /IM electron.exe

# macOS/Linux:
killall electron
```

---

## Güncelleme

### Uygulama Güncellemeleri

```bash
# Proje klasöründe git pull
git pull origin main

# Bağımlılıkları güncelleyin
npm install
```

### Paket Güncellemeleri

```bash
# Güncel olmayan paketleri kontrol edin
npm outdated

# Tüm paketleri güncelle (DİKKATLİ!)
npm update

# Güvenlik güncellemeleri
npm audit fix
```

### Electron Versiyonu Güncelleme

```bash
# Mevcut versiyonu kontrol edin
npm list electron

# Yeni versiyona güncelleyin
npm install electron@latest --save-dev

# Native modülleri rebuild edin
npx electron-rebuild
```

---

## Production Build

Uygulama portable Windows exe olarak paketlenir. Build sistemi kurulu ve çalışır durumdadır.

### Build Komutları

```bash
# Yalnızca obfuscation - build-temp/ klasörü hazırlanır
npm run obfuscate

# Portable exe üretimi (obfuscation + electron-builder)
npm run build

# Paketlenmemiş klasör çıktısı (hata ayıklama için)
npm run build:dir
```

Çıktı `dist/` klasörüne `ProjeA-<sürüm>-Portable.exe` adıyla yazılır.

### Build Süreci

`build.js` sırasıyla şunları yapar:

1. `build-temp/` klasörünü temizler
2. Kaynak dosyaları kopyalar (node_modules, .git, dist hariç)
3. `package.json`'dan devDependencies'i siler, electron sürümünü sabitler
4. Ana projedeki `node_modules` için junction oluşturur (yeniden derleme yapılmaz)
5. Tohum veritabanını `build-temp/extra/raporlar.db` olarak hazırlar
6. JS dosyalarını obfuscate eder:
   - Main process (`main.js`) - `target: node`
   - Renderer dosyaları - `target: browser-no-eval`

> **Önemli**: Yeni bir renderer script'i eklediğinizde `build.js` içindeki `RENDERER_JS_FILES` listesine de eklemelisiniz. Aksi halde dosya karartılmadan paketlenir.

### Tohum Veritabanı

Build'e gömülecek veritabanı şu sırayla seçilir:

| Kaynak | Ne zaman |
|--------|----------|
| `raporlar_build.db` | Varsa tercih edilir (kasıtlı temizlenmiş sürüm) |
| `raporlar.db` | Tohum DB yoksa veya `--use-dev-db` verildiyse |

Seçilen dosya `extraResources` ile ASAR dışında, exe'nin yanına yerleştirilir. Uygulama ilk açılışta kalıcı klasörde veritabanı yoksa bu dosyayı oraya kopyalar.

> **Encoding uyarısı**: Tohum veritabanını PowerShell üzerinden `sqlite3` komutuyla güncellemeyin; Türkçe karakterler Windows-1254 olarak yazılabilir. Güncellemeleri Node.js script'i ile yapın.

### Portable Sürüm ve Veritabanı Konumu

Portable exe çalışırken kendini geçici bir klasöre açar. Veritabanı oraya değil, kullanıcının exe'yi çalıştırdığı kalıcı klasöre yazılır (`PORTABLE_EXECUTABLE_DIR`). Uygulamayı başka bir yere taşırken `raporlar.db` dosyasını da yanında taşıyın.

---

## Test

Projede otomatik test altyapısı henüz kurulmamıştır. Hesap mantığı saf fonksiyonlar hâlinde ayrıldığı için (`metraj-hesap.js`, `donem-servisi.js`) bu dosyalar arayüz açmadan Node ile doğrudan çalıştırılıp doğrulanabilir:

```bash
node -e "const h=require('./modules/hesaplama/scripts/metraj-hesap'); console.log(h.hesaplaBosluk({tip:'pencere',en:1.5,boy:1.2,adet:2,gommeDerinligi:0.05}));"
```

---

## Kurulum Sonrası Kontrol Listesi

- [ ] Node.js ve npm kurulu mu?
- [ ] `npm install` başarılı mı?
- [ ] Uygulama `npm start` ile açılıyor mu?
- [ ] `raporlar.db` dosyası oluştu mu?
- [ ] Form doldurulup kaydediliyor mu?
- [ ] Rapor Word dosyası oluşturuluyor mu?
- [ ] Tüm sekmeler çalışıyor mu?
- [ ] Hesaplama fonksiyonları doğru mu?

---

## Destek

Kurulum sırasında sorun yaşarsanız:

1. Hata mesajını tam olarak kopyalayın
2. `npm --version` ve `node --version` çıktılarını alın
3. İşletim sisteminizi belirtin
4. Destek ekibiyle iletişime geçin

---

**Son Güncelleme**: 2024

