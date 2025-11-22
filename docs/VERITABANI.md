# Veritabanı Yapısı ve Yönetimi

## 📋 İçindekiler

- [Veritabanı Genel Bakış](#veritabanı-genel-bakış)
- [Tablo Şeması](#tablo-şeması)
- [Veri Tipleri](#veri-tipleri)
- [CRUD İşlemleri](#crud-i̇şlemleri)
- [Sorgular](#sorgular)
- [Veri Bütünlüğü](#veri-bütünlüğü)
- [Yedekleme](#yedekleme)

---

## 🗄️ Veritabanı Genel Bakış

### Temel Bilgiler

- **Veritabanı Tipi**: SQLite3
- **Dosya Adı**: `raporlar.db`
- **Konum**: Proje kök dizini
- **Kodlama**: UTF-8
- **Versiyon**: SQLite 3.x

### SQLite Seçilme Nedenleri

✅ **Avantajlar**:
- Dosya tabanlı (kurulum gerektirmez)
- Hafif ve hızlı
- ACID uyumlu
- Cross-platform
- Bağımlılık yok
- Embedded çözüm

❌ **Dezavantajlar**:
- Eşzamanlı yazma sınırlı
- Network erişimi yok
- Kullanıcı yönetimi yok
- Büyük veri setleri için uygun değil

### Veritabanı Boyutu

```
Boş veritabanı: ~4 KB
100 kayıt: ~50 KB
1000 kayıt: ~500 KB
10,000 kayıt: ~5 MB
```

---

## 📊 Tablo Şeması

### `raporlar` Tablosu

```sql
CREATE TABLE IF NOT EXISTS raporlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    raporTarihi TEXT,
    raporNo TEXT,
    resmiYaziTarihi TEXT,
    resmiYaziSayisi TEXT,
    ilgiliKurum TEXT,
    hesapYili TEXT,
    ili TEXT DEFAULT 'Samsun',
    ilce TEXT,
    mahalle TEXT,
    ada TEXT,
    parsel TEXT,
    yuzolcumu TEXT,
    malik TEXT,
    yapiNo TEXT,
    yapiAdi TEXT,
    yapiMaliki TEXT,
    yapiYasi TEXT,
    yapiSinifi TEXT,
    yapimTeknigi TEXT,
    yapiAlani TEXT,
    birimFiyat TEXT,
    eksikImalatOrani TEXT,
    yipranmaPay TEXT,
    yapiBedeli TEXT,
    resmiGazeteTarih TEXT,
    resmiGazeteSayili TEXT,
    raportorAdi TEXT,
    raportorUnvani TEXT
);
```

---

## 📝 Sütun Detayları

### Tablo Yapısı

| Sütun Adı | Veri Tipi | Null | Default | Açıklama |
|-----------|-----------|------|---------|----------|
| `id` | INTEGER | NO | AUTO | Benzersiz kayıt ID (Primary Key) |
| `raporTarihi` | TEXT | YES | NULL | Rapor tarihi (YYYY-MM-DD) |
| `raporNo` | TEXT | YES | NULL | Rapor numarası |
| `resmiYaziTarihi` | TEXT | YES | NULL | Resmi yazı tarihi (YYYY-MM-DD) |
| `resmiYaziSayisi` | TEXT | YES | NULL | Resmi yazı sayı numarası |
| `ilgiliKurum` | TEXT | YES | NULL | İlgili kurum adı |
| `hesapYili` | TEXT | YES | NULL | Hesap yılı (YYYY) |
| `ili` | TEXT | YES | 'Samsun' | İl adı |
| `ilce` | TEXT | YES | NULL | İlçe adı |
| `mahalle` | TEXT | YES | NULL | Mahalle adı |
| `ada` | TEXT | YES | NULL | Ada numarası |
| `parsel` | TEXT | YES | NULL | Parsel numarası |
| `yuzolcumu` | TEXT | YES | NULL | Arsa yüzölçümü (m²) |
| `malik` | TEXT | YES | NULL | Arsa maliki adı |
| `yapiNo` | TEXT | YES | NULL | Yapı numarası |
| `yapiAdi` | TEXT | YES | NULL | Yapı adı |
| `yapiMaliki` | TEXT | YES | NULL | Yapı maliki adı |
| `yapiYasi` | TEXT | YES | NULL | Yapı yaşı (yıl) |
| `yapiSinifi` | TEXT | YES | NULL | Yapı sınıfı (1-7. Sınıf) |
| `yapimTeknigi` | TEXT | YES | NULL | Yapım tekniği |
| `yapiAlani` | TEXT | YES | NULL | Yapı alanı (m²) |
| `birimFiyat` | TEXT | YES | NULL | Birim fiyat (TL/m²) |
| `eksikImalatOrani` | TEXT | YES | NULL | Eksik imalat oranı (%) |
| `yipranmaPay` | TEXT | YES | NULL | Yıpranma payı (%) |
| `yapiBedeli` | TEXT | YES | NULL | Hesaplanan yapı bedeli (TL) |
| `resmiGazeteTarih` | TEXT | YES | NULL | Resmi Gazete tarihi |
| `resmiGazeteSayili` | TEXT | YES | NULL | Resmi Gazete sayısı |
| `raportorAdi` | TEXT | YES | NULL | Raportor adı soyadı |
| `raportorUnvani` | TEXT | YES | NULL | Raportor ünvanı |

---

## 🔤 Veri Tipleri

### SQLite TEXT Kullanımı

SQLite'da tüm sütunlar `TEXT` olarak tanımlanmış. Bunun nedenleri:

1. **Esneklik**: Sayısal değerlerde format değişiklikleri
2. **Ondalık Sayılar**: Virgüllü sayılar için
3. **Tarih Formatları**: ISO 8601 string formatı
4. **Validasyon**: Uygulama katmanında yapılır

### Tarih Formatı

```javascript
// Veritabanında: "2024-10-26"
// Gösterim: "26.10.2024"

// Kayıt
const tarih = "2024-10-26"; // ISO 8601

// Okuma ve formatlama
function formatTarih(tarih) {
    const d = new Date(tarih);
    return `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
}
```

### Sayısal Değerler

```javascript
// Veritabanında string olarak saklanır
yapiAlani: "120.50"
birimFiyat: "15000.00"
yapiBedeli: "1275000.00"

// İşlem sırasında parse edilir
const alan = parseFloat(yapiAlani);
const fiyat = parseFloat(birimFiyat);
const bedel = alan * fiyat;
```

---

## 🔧 CRUD İşlemleri

### Create (Ekleme)

#### Kod: `renderer.js`

```javascript
db.run(`INSERT INTO raporlar (
    raporTarihi, raporNo, resmiYaziTarihi, resmiYaziSayisi, 
    ilgiliKurum, hesapYili, ili, ilce, mahalle, ada, parsel, 
    yuzolcumu, malik, yapiNo, yapiAdi, yapiMaliki, yapiYasi, 
    yapiSinifi, yapimTeknigi, yapiAlani, birimFiyat, 
    eksikImalatOrani, yipranmaPay, yapiBedeli, 
    resmiGazeteTarih, resmiGazeteSayili, raportorAdi, raportorUnvani
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
[...values...], 
function(err) {
    if (err) {
        console.error('Hata:', err.message);
        return;
    }
    console.log(`Kayıt ID: ${this.lastID}`);
});
```

#### Prepared Statement Kullanımı

✅ **SQL Injection Koruması**: Placeholder (`?`) kullanımı
✅ **Performans**: Query önbellekleme
✅ **Tip Güvenliği**: Otomatik escape

### Read (Okuma)

#### Tüm Kayıtları Listeleme

```javascript
// Kod: raporlar.js
db.all(`SELECT id, raporTarihi, ilce, mahalle, ada, parsel 
        FROM raporlar`, 
[], (err, rows) => {
    if (err) throw err;
    rows.forEach(row => {
        console.log(row.id, row.raporTarihi);
    });
});
```

#### Tek Kayıt Getirme

```javascript
// Kod: raporlar.js
db.get(`SELECT * FROM raporlar WHERE id = ?`, 
[id], (err, raporData) => {
    if (err) {
        console.error('Hata:', err.message);
        return;
    }
    console.log(raporData);
});
```

### Update (Güncelleme)

⚠️ **Şu anda uygulanmamış** (Gelecek özellik)

```javascript
// Örnek implementasyon
db.run(`UPDATE raporlar 
        SET raporTarihi = ?, raporNo = ?, ...
        WHERE id = ?`, 
[...values..., id], 
function(err) {
    if (err) {
        console.error('Güncelleme hatası:', err.message);
        return;
    }
    console.log(`Güncellenen satır sayısı: ${this.changes}`);
});
```

### Delete (Silme)

```javascript
// Kod: raporlar.js
db.run(`DELETE FROM raporlar WHERE id = ?`, 
[id], function(err) {
    if (err) {
        console.error('Silme hatası:', err.message);
        return;
    }
    console.log(`Silindi, ID: ${id}`);
});
```

---

## 🔍 Sorgular

### Temel Sorgular

#### 1. Tüm Raporları Getir

```sql
SELECT * FROM raporlar ORDER BY id DESC;
```

#### 2. Belirli İlçedeki Raporlar

```sql
SELECT * FROM raporlar 
WHERE ilce = 'Atakum' 
ORDER BY raporTarihi DESC;
```

#### 3. Tarih Aralığına Göre Filtre

```sql
SELECT * FROM raporlar 
WHERE raporTarihi BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY raporTarihi;
```

#### 4. Yapı Yaşına Göre Filtre

```sql
SELECT yapiAdi, yapiYasi, yapiBedeli 
FROM raporlar 
WHERE CAST(yapiYasi AS INTEGER) > 20;
```

### İleri Sorgular

#### 1. İstatistikler

```sql
-- Toplam kayıt sayısı
SELECT COUNT(*) as toplam FROM raporlar;

-- İlçelere göre rapor sayısı
SELECT ilce, COUNT(*) as sayi 
FROM raporlar 
GROUP BY ilce 
ORDER BY sayi DESC;

-- Ortalama yapı bedeli
SELECT AVG(CAST(yapiBedeli AS REAL)) as ortalama 
FROM raporlar;

-- Toplam yapı bedeli
SELECT SUM(CAST(yapiBedeli AS REAL)) as toplam 
FROM raporlar;
```

#### 2. Arama

```sql
-- Malik ismine göre arama
SELECT * FROM raporlar 
WHERE malik LIKE '%Ahmet%' OR yapiMaliki LIKE '%Ahmet%';

-- Ada-Parsel arama
SELECT * FROM raporlar 
WHERE ada = '123' AND parsel = '45';

-- Rapor no arama
SELECT * FROM raporlar 
WHERE raporNo LIKE 'R-2024-%';
```

#### 3. Join Sorguları (Gelecek)

```sql
-- Şablon tablosu eklendikten sonra
SELECT r.*, s.sablonAdi 
FROM raporlar r 
LEFT JOIN sablonlar s ON r.sablonId = s.id;
```

---

## 🛡️ Veri Bütünlüğü

### Constraints (Kısıtlamalar)

#### Primary Key

```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
```

- Benzersizlik garantisi
- Otomatik artan değer
- NULL olamaz

#### Default Values

```sql
ili TEXT DEFAULT 'Samsun'
```

- Boş bırakılırsa varsayılan değer

### Validasyon

Validasyon uygulama katmanında yapılır (renderer.js):

```javascript
// HTML5 Required Attribute
<input type="date" id="raporTarihi" required>

// JavaScript Validasyonu
if (!raporTarihi || !raporNo) {
    alert("Rapor Tarihi ve Rapor No alanları zorunludur.");
    return;
}
```

### Önerilen İyileştirmeler

```sql
-- NOT NULL kısıtlamaları
raporTarihi TEXT NOT NULL,
raporNo TEXT NOT NULL,

-- UNIQUE kısıtlaması
raporNo TEXT UNIQUE NOT NULL,

-- CHECK kısıtlaması
yapiYasi INTEGER CHECK(yapiYasi >= 0 AND yapiYasi <= 200),
eksikImalatOrani REAL CHECK(eksikImalatOrani >= 0 AND eksikImalatOrani <= 100)
```

---

## 💾 Yedekleme ve Geri Yükleme

### Manuel Yedekleme

```bash
# Basit dosya kopyalama
cp raporlar.db raporlar_backup_20241026.db

# Windows
copy raporlar.db raporlar_backup_20241026.db
```

### SQLite Dump

```bash
# Terminal/CMD'de
sqlite3 raporlar.db .dump > backup.sql

# Geri yükleme
sqlite3 new_raporlar.db < backup.sql
```

### Programatik Yedekleme (Gelecek Özellik)

```javascript
const fs = require('fs');
const path = require('path');

function backupDatabase() {
    const tarih = new Date().toISOString().slice(0, 10);
    const backupPath = path.join(__dirname, 'backups', `raporlar_${tarih}.db`);
    
    fs.copyFile('raporlar.db', backupPath, (err) => {
        if (err) {
            console.error('Yedekleme hatası:', err);
            return;
        }
        console.log('Yedekleme başarılı:', backupPath);
    });
}
```

---

## 🔧 Veritabanı Bakımı

### Optimize Etme

```sql
-- Vakum (fragmentasyonu temizle)
VACUUM;

-- İndeks optimizasyonu
ANALYZE;

-- Veritabanı tutarlılığı kontrolü
PRAGMA integrity_check;
```

### İstatistikler

```sql
-- Veritabanı boyutu
PRAGMA page_count;
PRAGMA page_size;

-- Tablo bilgileri
PRAGMA table_info(raporlar);

-- İndeksler (varsa)
PRAGMA index_list(raporlar);
```

### Veritabanı Sıfırlama

```javascript
// Tüm kayıtları sil
db.run(`DELETE FROM raporlar`, (err) => {
    if (err) {
        console.error('Hata:', err);
        return;
    }
    // Auto-increment sıfırla
    db.run(`DELETE FROM sqlite_sequence WHERE name='raporlar'`);
});
```

---

## 📊 Örnek Veri

### Test Verisi Ekleme

```javascript
const testData = {
    raporTarihi: '2024-10-26',
    raporNo: 'R-2024-001',
    resmiYaziTarihi: '2024-10-20',
    resmiYaziSayisi: 'E.12345',
    ilgiliKurum: 'Samsun Büyükşehir Belediyesi',
    hesapYili: '2024',
    ili: 'Samsun',
    ilce: 'Atakum',
    mahalle: 'Kurupelit',
    ada: '123',
    parsel: '45',
    yuzolcumu: '150.00',
    malik: 'Ahmet Yılmaz',
    yapiNo: '1',
    yapiAdi: 'Müstakil Ev',
    yapiMaliki: 'Ahmet Yılmaz',
    yapiYasi: '15',
    yapiSinifi: '3. Sınıf',
    yapimTeknigi: 'Betonarme Karkas',
    yapiAlani: '120.00',
    birimFiyat: '15000.00',
    eksikImalatOrani: '10',
    yipranmaPay: '20',
    yapiBedeli: '1296000.00',
    resmiGazeteTarih: '2024-01-15',
    resmiGazeteSayili: '32768',
    raportorAdi: 'Mehmet Demir',
    raportorUnvani: 'İnşaat Mühendisi'
};
```

---

## 🔮 Gelecek İyileştirmeleri

### 1. İkinci Tablo: Şablonlar

```sql
CREATE TABLE sablonlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sablonAdi TEXT NOT NULL,
    sablonDosyasi TEXT NOT NULL,
    olusturmaTarihi TEXT,
    aktif INTEGER DEFAULT 1
);
```

### 2. İlişkili Tablolar

```sql
CREATE TABLE kullanicilar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adi TEXT NOT NULL,
    unvani TEXT,
    email TEXT UNIQUE
);

-- raporlar tablosuna foreign key ekle
ALTER TABLE raporlar ADD COLUMN raportorId INTEGER 
REFERENCES kullanicilar(id);
```

### 3. Audit/Log Tablosu

```sql
CREATE TABLE loglar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    islemTipi TEXT, -- INSERT, UPDATE, DELETE
    tabloAdi TEXT,
    kayitId INTEGER,
    kullaniciId INTEGER,
    tarih TEXT,
    detay TEXT
);
```

---

**Son Güncelleme**: 2024

