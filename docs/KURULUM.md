# Kurulum ve Yapılandırma Rehberi

## 📋 İçindekiler

- [Sistem Gereksinimleri](#sistem-gereksinimleri)
- [Kurulum Adımları](#kurulum-adımları)
- [Yapılandırma](#yapılandırma)
- [Sorun Giderme](#sorun-giderme)
- [Güncelleme](#güncelleme)

---

## 💻 Sistem Gereksinimleri

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

## 🚀 Kurulum Adımları

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
cd kitar
```

#### ZIP ile
```bash
# Projeyi ZIP olarak indirip açın
# Terminal/CMD ile proje dizinine gidin
cd path/to/kitar
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

## ⚙️ Yapılandırma

### Package.json

`package.json` dosyasında temel ayarlar:

```json
{
  "name": "Kitar",
  "version": "1.0.0",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
```

#### Özelleştirme Seçenekleri

**Uygulama Adı**
```json
"name": "KitarYeniAd"
```

**Versiyon**
```json
"version": "2.0.0"
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

## 🐛 Sorun Giderme

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

## 🔄 Güncelleme

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

## 📦 Production Build (Gelecek Özellik)

### Electron Builder Kurulumu

```bash
npm install --save-dev electron-builder
```

### Build Konfigürasyonu

`package.json` içine ekleyin:

```json
"build": {
  "appId": "com.kitar.app",
  "productName": "Kıymet Takdir Raporu",
  "directories": {
    "output": "dist"
  },
  "win": {
    "target": "nsis",
    "icon": "assets/icon.ico"
  },
  "mac": {
    "target": "dmg",
    "icon": "assets/icon.icns"
  },
  "linux": {
    "target": "AppImage",
    "icon": "assets/icon.png"
  }
}
```

### Build Komutları

```bash
# Windows için
npm run build:win

# macOS için
npm run build:mac

# Linux için
npm run build:linux

# Tüm platformlar
npm run build
```

---

## 🧪 Test Kurulumu (Gelecek Özellik)

```bash
# Jest test framework
npm install --save-dev jest

# Spectron (Electron test framework)
npm install --save-dev spectron
```

---

## 📝 Kurulum Sonrası Kontrol Listesi

- [ ] Node.js ve npm kurulu mu?
- [ ] `npm install` başarılı mı?
- [ ] Uygulama `npm start` ile açılıyor mu?
- [ ] `raporlar.db` dosyası oluştu mu?
- [ ] Form doldurulup kaydediliyor mu?
- [ ] Rapor Word dosyası oluşturuluyor mu?
- [ ] Tüm sekmeler çalışıyor mu?
- [ ] Hesaplama fonksiyonları doğru mu?

---

## 🆘 Destek

Kurulum sırasında sorun yaşarsanız:

1. Hata mesajını tam olarak kopyalayın
2. `npm --version` ve `node --version` çıktılarını alın
3. İşletim sisteminizi belirtin
4. Destek ekibiyle iletişime geçin

---

**Son Güncelleme**: 2024

