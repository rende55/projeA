# Veritabanı Yapısı ve Yönetimi

## İçindekiler

- [Veritabanı Genel Bakış](#veritabanı-genel-bakış)
- [Tablo Listesi](#tablo-listesi)
- [Yapı Bedeli Tabloları](#yapı-bedeli-tabloları)
- [Proje Bedeli Tabloları](#proje-bedeli-tabloları)
- [Hesaplamalar Tabloları](#hesaplamalar-tabloları)
- [Ortak Tablolar](#ortak-tablolar)
- [JSON Sütunları](#json-sütunları)
- [Migration Sistemi](#migration-sistemi)
- [CRUD İşlemleri](#crud-i̇şlemleri)
- [Sorgular](#sorgular)
- [Yedekleme ve Geri Yükleme](#yedekleme-ve-geri-yükleme)

---

## Veritabanı Genel Bakış

### Temel Bilgiler

| Özellik | Değer |
|---------|-------|
| **Sistem** | SQLite 3 |
| **Dosya** | `raporlar.db` |
| **Sürücü** | `sqlite3` npm paketi (native modül) |
| **Konum** | Uygulama kök dizini (geliştirme) / exe klasörü (portable) |
| **Tablo Sayısı** | 12 |
| **Oluşturma** | Uygulama ilk çalıştırıldığında otomatik |

### Veritabanı Yolu Çözümleme

Veritabanı yolu doğrudan yazılmaz; `shared/scripts/db-helper.js` üzerinden çözülür:

```javascript
const { getDbPath } = require('../../../shared/scripts/db-helper');
const dbPath = getDbPath();
const db = new sqlite3.Database(dbPath);
```

`getDbPath()` üç durumu ayırır:

| Durum | Kullanılan Yol |
|-------|----------------|
| Geliştirme (`npm start`) | `app.getAppPath()` - proje kök dizini |
| Portable exe | `process.env.PORTABLE_EXECUTABLE_DIR` - exe'nin bulunduğu kalıcı klasör |
| Diğer paketlemeler | `path.dirname(app.getPath('exe'))` |

> **Neden önemli**: Portable exe çalışırken kendini `%TEMP%` altına açar. Oraya yazılan veriler her çıkışta silinir. `PORTABLE_EXECUTABLE_DIR` ise kullanıcının exe'yi çalıştırdığı kalıcı klasörü gösterir; veritabanı oraya yazılır.

### SQLite Seçilme Nedenleri

1. **Sunucu gerektirmez**: Tek dosya, kurulum yok
2. **Taşınabilir**: `raporlar.db` kopyalanarak yedeklenir/taşınır
3. **Yeterli**: Tek kullanıcılı masaüstü uygulaması için uygun
4. **Electron uyumlu**: Native modül olarak sorunsuz paketlenir
5. **SQL desteği**: Standart sorgular, indeksler, transaction

### Veritabanı Boyutu

Boyut, kayıt sayısından çok gömülü fotoğraflardan etkilenir. Rapor fotoğrafları `fotograflarJSON` sütununda base64 olarak saklandığı için fotoğraflı raporlar dosyayı hızla büyütür.

---

## Tablo Listesi

| # | Tablo | Sütun | Açıklama | Modül |
|---|-------|-------|----------|-------|
| 1 | `raporlar` | 38 | Yapı bedeli raporları | Yapı Bedeli |
| 2 | `birimFiyatlar` | 9 | Yıl/dönem bazlı birim fiyat ana kayıtları | Yapı Bedeli |
| 3 | `birimFiyatDetay` | 6 | Yapı sınıfı/grubu bazlı detay fiyatlar | Yapı Bedeli |
| 4 | `yipranmaPaylari` | 9 | Yıpranma payı cetvelleri | Yapı Bedeli |
| 5 | `raportorleri` | 7 | Raportör bilgileri | Ortak |
| 6 | `kurumlar` | 6 | Kurum ve alt kurum bilgileri | Ortak |
| 7 | `pidOranlari` | 8 | PID oranları | Proje Bedeli |
| 8 | `hizmetDaliKatsayilari` | 8 | Hizmet dalı (branş) katsayıları | Proje Bedeli |
| 9 | `projeBedeliRaporlari` | 41 | Proje bedeli raporları | Proje Bedeli |
| 10 | `metrajlar` | 11 | Cephe metrajı kayıtları | Hesaplamalar |
| 11 | `iller` | 7 | İl tanımları | Ortak |
| 12 | `ilceler` | 7 | İlçe tanımları | Ortak |

> **Dikkat**: Raportör tablosunun adı `raportorleri` şeklindedir (`raportorler` değil). Sorgu yazarken bu isim kullanılmalıdır.

---

## Yapı Bedeli Tabloları

### `raporlar` Tablosu

Yapı bedeli raporlarının ana tablosu. Hem tekli hem çoklu parsel raporlarını tutar.

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
    raportorUnvani TEXT,
    yapiGrubu TEXT,
    asgariLevazimHesapla INTEGER DEFAULT 1,
    yapilarJSON TEXT,
    fotograflarJSON TEXT,
    toplamYapiBedeli REAL DEFAULT 0,
    modul TEXT DEFAULT 'yapi-bedeli',
    cokluParsel INTEGER DEFAULT 0,
    parsellerJSON TEXT,
    birimFiyatId INTEGER
);
```

#### Sütun Grupları

**Rapor künyesi**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | INTEGER | Birincil anahtar (otomatik artan) |
| `raporTarihi` | TEXT | Rapor tarihi (YYYY-MM-DD) |
| `raporNo` | TEXT | Rapor numarası |
| `resmiYaziTarihi` | TEXT | Talep yazısının tarihi |
| `resmiYaziSayisi` | TEXT | Talep yazısının sayısı |
| `ilgiliKurum` | TEXT | Raporu talep eden kurum |
| `hesapYili` | TEXT | Hesabın dayandığı yıl (YYYY) |

**Taşınmaz bilgileri**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `ili` | TEXT | İl adı (varsayılan: Samsun) |
| `ilce` | TEXT | İlçe adı |
| `mahalle` | TEXT | Mahalle adı |
| `ada` | TEXT | Ada numarası |
| `parsel` | TEXT | Parsel numarası |
| `yuzolcumu` | TEXT | Arsa yüzölçümü (m²) |
| `malik` | TEXT | Arsa maliki |

> Çoklu parsel raporlarında bu sütunlar ilk parselin bilgilerini taşır; parsellerin tamamı `parsellerJSON` içindedir.

**Yapı bilgileri (tekli/eski kayıtlar)**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `yapiNo` | TEXT | Yapı numarası |
| `yapiAdi` | TEXT | Yapı adı |
| `yapiMaliki` | TEXT | Yapı maliki |
| `yapiYasi` | TEXT | Yapı yaşı (yıl) |
| `yapiSinifi` | TEXT | Yapı sınıfı (1-5) |
| `yapiGrubu` | TEXT | Yapı grubu (A, B, C, D) |
| `yapimTeknigi` | TEXT | Yapım tekniği (Betonarme Karkas, Çelik, Yığma Kagir, ...) |
| `yapiAlani` | TEXT | Yapı alanı (m²) |
| `birimFiyat` | TEXT | Birim fiyat (TL/m²) |
| `eksikImalatOrani` | TEXT | Eksik imalat oranı (%) |
| `yipranmaPay` | TEXT | Yıpranma payı (%) |
| `yapiBedeli` | TEXT | Hesaplanan yapı bedeli |

> Çoklu yapı desteğiyle birlikte yapı bilgileri `yapilarJSON` sütununa taşınmıştır. Bu sütunlar geriye dönük uyumluluk ve tekil özet için korunur.

**Dönem ve hesap bilgileri**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `birimFiyatId` | INTEGER | Kullanılan birim fiyat dönemi (`birimFiyatlar.id`) |
| `resmiGazeteTarih` | TEXT | Dönemin Resmi Gazete tarihi |
| `resmiGazeteSayili` | TEXT | Dönemin Resmi Gazete sayısı |
| `asgariLevazimHesapla` | INTEGER | Asgari levazım bedeli hesaplansın mı (1/0) |
| `toplamYapiBedeli` | REAL | Tüm yapıların toplam bedeli |

**Yapı/parsel verileri ve ekler**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `yapilarJSON` | TEXT | Yapı listesi (JSON dizi) |
| `cokluParsel` | INTEGER | Çoklu parsel raporu mu (1/0) |
| `parsellerJSON` | TEXT | Parsel listesi ve her parselin yapıları (JSON dizi) |
| `fotograflarJSON` | TEXT | Rapor fotoğrafları (JSON dizi, base64) |

**İmza ve diğer**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `raportorAdi` | TEXT | Raportör ad(lar)ı |
| `raportorUnvani` | TEXT | Raportör ünvan(lar)ı |
| `modul` | TEXT | Kaydı üreten modül (varsayılan: `yapi-bedeli`) |

---

### `birimFiyatlar` Tablosu

Yapı yaklaşık birim maliyetleri tebliğinin yıl/dönem bazlı ana kaydı.

```sql
CREATE TABLE IF NOT EXISTS birimFiyatlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    yil INTEGER,
    donem INTEGER DEFAULT 1,
    resmiGazeteTarih TEXT,
    resmiGazeteSayili TEXT,
    tebligAdi TEXT,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
    aktif INTEGER DEFAULT 1
);
```

| Sütun | Açıklama |
|-------|----------|
| `yil` | Tebliğ yılı |
| `donem` | Yıl içindeki dönem sırası (aynı yılda birden fazla tebliğ yayınlanabilir) |
| `resmiGazeteTarih` / `resmiGazeteSayili` | Tebliğin Resmi Gazete künyesi |
| `tebligAdi` | Tebliğin adı |
| `aktif` | Pasife alınan dönemler listelerde görünmez |

> **Dönem etiketi**: Bir yılda tek dönem varsa `2026`, birden fazla varsa `2022/2` biçiminde gösterilir. Bu mantık `donem-servisi.js` içindeki `donemEtiketi()` fonksiyonundadır.

---

### `birimFiyatDetay` Tablosu

Bir dönemin yapı sınıfı/grubu bazlı metrekare fiyatları.

```sql
CREATE TABLE IF NOT EXISTS birimFiyatDetay (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    birimFiyatId INTEGER,
    yapiSinifi INTEGER,
    yapiGrubu TEXT,
    birimFiyat REAL,
    aktif INTEGER DEFAULT 1
);
```

Arama anahtarı sınıf ve grubun birleşimidir. `donem-servisi.js` bu tabloyu `"sinif|grup"` anahtarlı bir `Map` olarak yükler:

```javascript
const fiyatlar = await donemServisi.fiyatTablosuGetir(db, birimFiyatId);
const fiyat = fiyatlar.get(donemServisi.fiyatAnahtari('4', 'B'));  // "4|B"
```

`fiyatAnahtari()` sınıfı trim eder, grubu büyük harfe çevirir; böylece `"4 "` / `"4"` ve `"b"` / `"B"` aynı kayda düşer.

---

### `yipranmaPaylari` Tablosu

Resmi Gazete yıpranma payı cetveli (02.12.1982, Sayı: 17.886).

```sql
CREATE TABLE IF NOT EXISTS yipranmaPaylari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    yapimTeknigi TEXT,
    yasAraligi TEXT,
    minYas INTEGER,
    maxYas INTEGER,
    yipranmaOrani REAL,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);
```

Yapım tekniği ve yaş aralığı birlikte arandığında oran bulunur:

```sql
SELECT yipranmaOrani FROM yipranmaPaylari
WHERE yapimTeknigi = 'Çelik' AND ? BETWEEN minYas AND maxYas AND aktif = 1;
```

Tanımlı yapım teknikleri: Çelik, Betonarme Karkas, Yığma Kagir, Yığma Yarı Kagir, Ahşap, Taş Duvarlı (Çamur Harçlı), Kerpiç, Diğer Basit Binalar.

---

## Proje Bedeli Tabloları

### `projeBedeliRaporlari` Tablosu

Proje bedeli raporları. Dört branş (mimarlık, statik/inşaat, mekanik, elektrik) için ayrı sütun grupları içerir.

**Ortak alanlar**

| Sütun | Tip | Açıklama |
|-------|-----|----------|
| `id` | INTEGER | Birincil anahtar |
| `raporNo` | TEXT | Rapor numarası |
| `isAdi` | TEXT | İşin adı |
| `toplamInsaatAlani` | REAL | Toplam inşaat alanı (m²) |
| `hesapYili` | TEXT | Hesap yılı |
| `yapiSinifi` / `yapiGrubu` | TEXT | Yapı sınıfı ve grubu |
| `birimMaliyet` | REAL | Birim maliyet (TL/m²) |
| `toplamMaliyet` | REAL | Yapı yaklaşık maliyeti |
| `genelToplamBedel` | REAL | Dört branşın toplam hizmet bedeli |
| `aciklama` | TEXT | Serbest açıklama |
| `raportorSayisi` | INTEGER | İmzacı sayısı (varsayılan 1) |
| `raportorAdi` / `raportorUnvani` | TEXT | İmzacı bilgileri |
| `aktif` | INTEGER | Silinen kayıtlar için |
| `olusturmaTarihi` / `guncellemeTarihi` | TEXT | Zaman damgaları |

**Branş sütunları**

Her branş için aynı beş sütun tekrarlanır (`mim`, `ins`, `mek`, `elk` önekleriyle):

| Sütun kalıbı | Açıklama |
|--------------|----------|
| `<branş>Sinif` | Hizmet sınıfı |
| `<branş>PidOrani` | PID oranı |
| `<branş>ProjeBedeli` | Proje bedeli |
| `<branş>HizmetOrani` | Hizmet dalı katsayısı |
| `<branş>HizmetBedeli` | Hizmet bedeli |
| `<branş>HizmetBolumleri` | Seçili hizmet bölümleri (JSON) |

Örnek: `mimSinif`, `mimPidOrani`, `mimProjeBedeli`, `mimHizmetOrani`, `mimHizmetBedeli`, `mimHizmetBolumleri`.

---

### `pidOranlari` Tablosu

Yapı yaklaşık maliyetine ve hizmet sınıfına göre PID oranları.

```sql
CREATE TABLE IF NOT EXISTS pidOranlari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    minAlan REAL,
    maxAlan REAL,
    hizmetSinifi INTEGER,
    pidOrani REAL,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);
```

---

### `hizmetDaliKatsayilari` Tablosu

Branş bazlı hizmet dalı katsayıları.

```sql
CREATE TABLE IF NOT EXISTS hizmetDaliKatsayilari (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bransAdi TEXT,
    bransKodu TEXT,
    katsayi REAL,
    aciklama TEXT,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);
```

`bransKodu` değerleri `projeBedeliRaporlari` tablosundaki sütun önekleriyle eşleşir (`mim`, `ins`, `mek`, `elk`).

---

## Hesaplamalar Tabloları

### `metrajlar` Tablosu

Cephe metrajı kayıtları.

```sql
CREATE TABLE IF NOT EXISTS metrajlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metrajTipi TEXT DEFAULT 'cephe',
    isAdi TEXT,
    aciklama TEXT,
    cepheSayisi INTEGER,
    verilerJSON TEXT,
    toplamBoyaAlani REAL,
    toplamYalitimAlani REAL,
    olusturmaTarihi TEXT DEFAULT CURRENT_TIMESTAMP,
    guncellemeTarihi TEXT,
    aktif INTEGER DEFAULT 1
);
```

| Sütun | Açıklama |
|-------|----------|
| `metrajTipi` | Metraj türü; şimdilik yalnızca `cephe` |
| `isAdi` | İşin adı (liste ve kayıt başlığı) |
| `cepheSayisi` | Kayıttaki cephe sayısı (liste için özet) |
| `verilerJSON` | Tüm metraj durumu (cepheler, boşluklar, çıkmalar, saçak, ayarlar) |
| `toplamBoyaAlani` / `toplamYalitimAlani` | Liste ekranında gösterilen özet toplamlar (m²) |

> Yeni metraj türleri eklenirse `metrajTipi` ayrımı kullanılır; tablo yapısı değişmeden genişletilebilir.

---

## Ortak Tablolar

### `raportorleri` Tablosu

```sql
CREATE TABLE IF NOT EXISTS raportorleri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    adi TEXT,
    soyadi TEXT,
    unvani TEXT,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);
```

Ünvan listesi yönetim panelinde kategorilere ayrılmıştır (Mühendislik, İdari, Teknik, Diğer) ve listede olmayan ünvanlar için elle giriş desteklenir.

---

### `kurumlar` Tablosu

```sql
CREATE TABLE IF NOT EXISTS kurumlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kurumAdi TEXT,
    altKurum TEXT,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);
```

Kurum ve alt kurum ikilisi rapor formundaki "İlgili Kurum" alanını besler.

---

### `iller` ve `ilceler` Tabloları

```sql
CREATE TABLE IF NOT EXISTS iller (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sehir_id TEXT,
    sehir_adi TEXT,
    aktif INTEGER DEFAULT 1,
    varsayilan INTEGER DEFAULT 0,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS ilceler (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ilce_id TEXT,
    ilce_adi TEXT,
    il_id INTEGER,
    aktif INTEGER DEFAULT 1,
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
);
```

- `iller.varsayilan = 1` olan il, formlarda önceden seçili gelir
- `ilceler.il_id`, `iller.id` değerine karşılık gelir
- İlk kurulumda `sehirler.json` ve `ilceler.json` dosyalarından tohumlanır; sonrasında yönetim panelinden düzenlenir

---

## JSON Sütunları

İlişkisel tablolara bölmek yerine JSON olarak saklanan alanlar vardır. Bunlar tek raporla birlikte okunup yazılan, dışarıdan sorgulanmayan verilerdir.

### `yapilarJSON` (raporlar)

Bir raporun yapı listesi:

```json
[
  {
    "yapiNo": "1",
    "yapiAdi": "Düğün Salonu",
    "yapiSinifi": "4",
    "yapiGrubu": "B",
    "yapimTeknigi": "Çelik",
    "yapiYasi": "20",
    "yapiAlani": "1334.5",
    "birimFiyat": 33900,
    "eksikImalatOrani": "0",
    "yipranmaPay": 20,
    "yapiBedeli": 36171300
  }
]
```

> **Sınıf ve grup ayrı sütunlardır.** Editörün eski bir sürümü bunları `"2 C"` gibi tek alanda birleştiriyordu; bu durum birim fiyat sorgusunun anahtarını bozar. `main.js` içindeki tek seferlik onarım bu kayıtları ayrıştırır.

### `parsellerJSON` (raporlar)

Çoklu parsel raporlarında her parselin bilgileri ve yapıları:

```json
[
  {
    "ilce": "Atakum",
    "mahalle": "Denizevleri",
    "ada": "1234",
    "parsel": "5",
    "yuzolcumu": "850",
    "malik": "...",
    "yapilar": [ { "yapiNo": "1", "yapiAdi": "..." } ]
  }
]
```

Çoklu parsel kaydedilirken aynı JSON hem `parsellerJSON` hem `yapilarJSON` sütununa yazılır (mevcut kaydetme davranışı korunmuştur). Ayrım `cokluParsel` bayrağıyla yapılır.

### `fotograflarJSON` (raporlar)

Word çıktısına eklenecek fotoğraflar base64 olarak tutulur. Veritabanı boyutunu en çok bu sütun etkiler.

### `verilerJSON` (metrajlar)

Cephe metrajının tüm durumu: ayarlar (hangi yüzey boyaya/yalıtıma dahil), cepheler ve her cephenin boşluk / çıkma / saçak satırları.

### `<branş>HizmetBolumleri` (projeBedeliRaporlari)

Her branş için seçili hizmet bölümleri ve oranları JSON olarak saklanır.

---

## Migration Sistemi

Migration mantığı `main.js` içindeki `migrateDatabase()` fonksiyonundadır ve uygulama her açılışta çalışır. Tasarım ilkeleri:

1. **Idempotent**: Aynı migration ikinci kez çalıştığında bir şey değiştirmez
2. **Veri korur**: Mevcut kayıtlar silinmez, sütunlar `ALTER TABLE ADD COLUMN` ile eklenir
3. **Sessiz**: Kolon zaten varsa işlem atlanır

### Kolon Ekleme Kalıbı

```javascript
db.all(`PRAGMA table_info(raporlar)`, [], (err, columns) => {
    if (err || !columns || columns.length === 0) return;
    const varMi = columns.some(col => col.name === 'birimFiyatId');
    if (varMi) return;

    db.run(`ALTER TABLE raporlar ADD COLUMN birimFiyatId INTEGER`, (e) => {
        if (e) { console.error('birimFiyatId eklenemedi:', e); return; }
        console.log('raporlar tablosuna birimFiyatId kolonu eklendi.');
    });
});
```

### Uygulanmış Migration'lar

| Migration | Yaptığı |
|-----------|---------|
| Çoklu yapı | `raporlar.yapilarJSON`, `toplamYapiBedeli` |
| Çoklu parsel | `raporlar.cokluParsel`, `parsellerJSON` |
| Proje Bedeli imzacıları | `projeBedeliRaporlari.raportorSayisi`, `raportorAdi`, `raportorUnvani` |
| Dönem ilişkisi | `raporlar.birimFiyatId` + geriye dönük doldurma |
| Sınıf/grup onarımı | `yapilarJSON` / `parsellerJSON` içindeki birleşmiş sınıf-grup değerlerinin ayrıştırılması |

### Geriye Dönük Dönem Eşleştirme

`birimFiyatId` kolonu eklendiğinde eski raporlar şu sırayla kendi dönemine bağlanır:

1. **Resmi Gazete sayısı ile** (kesin eşleşme): raporun `resmiGazeteSayili` değeri bir dönemin künyesiyle birebir tutuyorsa o dönem atanır
2. **Yıl ile** (yalnızca güvenliyse): o yılda tek bir dönem tanımlıysa yıl üzerinden eşleştirilir
3. **Eşleşmezse boş bırakılır**: yılda birden fazla dönem varsa ve künye yoksa kolon `NULL` kalır; listede dönem `Belirsiz` görünür ve kullanıcı kopyalama ekranında hedefi kendisi seçer

### Yeni Tablo Ekleme

Yeni tablolar `createDatabase()` içinde `CREATE TABLE IF NOT EXISTS` ile tanımlanır; mevcut veritabanlarında bir sonraki açılışta otomatik oluşur.

---

## CRUD İşlemleri

### Create (Ekleme)

```javascript
db.run(
    `INSERT INTO metrajlar
     (metrajTipi, isAdi, aciklama, cepheSayisi, verilerJSON,
      toplamBoyaAlani, toplamYalitimAlani, olusturmaTarihi, guncellemeTarihi, aktif)
     VALUES ('cephe', ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [isAdi, aciklama, cepheSayisi, veri, boya, yalitim, simdi, simdi],
    function (err) {
        if (err) { console.error(err); return; }
        console.log('Yeni kayıt id:', this.lastID);
    }
);
```

> `function (err)` kullanılır; `this.lastID` ve `this.changes` yalnızca normal fonksiyonda erişilebilir (arrow function'da `this` bağlanmaz).

### Şemadan Bağımsız Kopyalama

Rapor kopyalarken sütunları elle saymak yerine şema okunur; böylece yeni sütun eklendiğinde kopyalama bozulmaz:

```javascript
const kolonlar = (await kolonlariGetir(db)).filter(k => k !== 'id');
const degerler = kolonlar.map(k => (yeni[k] === undefined ? null : yeni[k]));
const yerTutucu = kolonlar.map(() => '?').join(', ');
db.run(`INSERT INTO raporlar (${kolonlar.join(', ')}) VALUES (${yerTutucu})`, degerler, ...);
```

### Read (Okuma)

```javascript
// Liste
db.all(`SELECT * FROM raporlar ORDER BY id DESC`, [], (err, rows) => { ... });

// Tek kayıt
db.get(`SELECT * FROM raporlar WHERE id = ?`, [id], (err, row) => { ... });

// Aktif dönemler (yeniden eskiye)
db.all(`SELECT * FROM birimFiyatlar WHERE aktif = 1 ORDER BY yil DESC, donem DESC`, [], ...);
```

### Update (Güncelleme)

```javascript
db.run(
    `UPDATE metrajlar
     SET isAdi = ?, aciklama = ?, cepheSayisi = ?, verilerJSON = ?,
         toplamBoyaAlani = ?, toplamYalitimAlani = ?, guncellemeTarihi = ?
     WHERE id = ?`,
    [...], function (err) { console.log('Etkilenen satır:', this.changes); }
);
```

### Delete (Silme)

İki yaklaşım kullanılır:

```javascript
// Kalıcı silme (raporlar)
db.run(`DELETE FROM raporlar WHERE id = ?`, [id], ...);

// Pasife alma (tanım tabloları) - kayıt korunur, listelerde görünmez
db.run(`UPDATE birimFiyatlar SET aktif = 0 WHERE id = ?`, [id], ...);
```

> Rapor silme geri alınamaz. Tanım tabloları (dönemler, raportörler, kurumlar) pasife alınarak korunur.

---

## Sorgular

### Temel Sorgular

```sql
-- Tüm raporlar (yeniden eskiye)
SELECT * FROM raporlar ORDER BY id DESC;

-- Belirli ilçedeki raporlar
SELECT * FROM raporlar WHERE ilce = 'Atakum';

-- Tarih aralığı
SELECT * FROM raporlar WHERE raporTarihi BETWEEN '2026-01-01' AND '2026-12-31';

-- Çoklu parsel raporları
SELECT id, raporTarihi, hesapYili FROM raporlar WHERE cokluParsel = 1;
```

### Dönem Sorguları

```sql
-- Bir dönemin tüm sınıf/grup fiyatları
SELECT yapiSinifi, yapiGrubu, birimFiyat
FROM birimFiyatDetay
WHERE birimFiyatId = ? AND aktif = 1;

-- Raporların dönemlere dağılımı
SELECT b.yil, b.donem, COUNT(r.id) AS raporSayisi
FROM birimFiyatlar b
LEFT JOIN raporlar r ON r.birimFiyatId = b.id
GROUP BY b.id
ORDER BY b.yil DESC, b.donem DESC;

-- Dönemi belirsiz kalan raporlar
SELECT id, hesapYili, resmiGazeteSayili
FROM raporlar WHERE birimFiyatId IS NULL;
```

### İstatistikler

```sql
SELECT
    COUNT(*)                  AS toplamRapor,
    SUM(toplamYapiBedeli)     AS toplamBedel,
    AVG(toplamYapiBedeli)     AS ortalamaBedel,
    SUM(cokluParsel)          AS cokluParselRaporu
FROM raporlar;
```

### Arama

```sql
SELECT * FROM raporlar
WHERE ada LIKE '%' || ? || '%'
   OR parsel LIKE '%' || ? || '%'
   OR mahalle LIKE '%' || ? || '%'
   OR malik LIKE '%' || ? || '%'
ORDER BY id DESC;
```

---

## Veri Bütünlüğü

### Kısıtlamalar

- Her tabloda `id INTEGER PRIMARY KEY AUTOINCREMENT`
- Varsayılan değerler: `ili = 'Samsun'`, `aktif = 1`, `modul = 'yapi-bedeli'`, zaman damgaları `datetime('now','localtime')`
- Foreign key kısıtı tanımlı değildir; ilişkiler uygulama katmanında yönetilir (`birimFiyatDetay.birimFiyatId`, `ilceler.il_id`, `raporlar.birimFiyatId`)

### Validasyon

Doğrulama uygulama tarafında yapılır:

- Zorunlu alan kontrolü form kaydetmeden önce
- Sayısal alanlarda `parseFloat` ve virgül/nokta normalizasyonu
- Metraj hesabında negatif ve geçersiz değerler 0 kabul edilir
- Dönem uyarlamasında bulunamayan fiyat/oran için eski değer korunur ve kullanıcıya uyarı gösterilir

### Önerilen İyileştirmeler

- [ ] Sık sorgulanan sütunlara indeks (`raporlar.raporTarihi`, `raporlar.birimFiyatId`, `birimFiyatDetay.birimFiyatId`)
- [ ] Fotoğrafların base64 yerine dosya sisteminde saklanması (DB boyutu için)
- [ ] Foreign key kısıtlarının etkinleştirilmesi (`PRAGMA foreign_keys = ON`)

---

## Yedekleme ve Geri Yükleme

### Yedekleme

Veritabanı tek dosya olduğu için kopyalamak yeterlidir:

```powershell
# Tarihli yedek
Copy-Item raporlar.db "yedek/raporlar_$(Get-Date -Format 'yyyyMMdd').db"
```

Uygulama kapalıyken yedek almak en güvenlisidir.

### Geri Yükleme

```powershell
Copy-Item "yedek/raporlar_20260825.db" raporlar.db
```

Uygulama açılışta migration'ları çalıştırır; eski bir yedek geri yüklendiğinde eksik sütunlar otomatik eklenir.

### Build'e Gömülen Veritabanı

Portable build, uygulamayla birlikte bir tohum veritabanı taşır:

| Kaynak | Ne zaman kullanılır |
|--------|---------------------|
| `raporlar_build.db` | Varsa tercih edilir (kasıtlı temizlenmiş sürüm) |
| `raporlar.db` | Tohum DB yoksa veya `--use-dev-db` verildiyse |

Seçilen dosya `build-temp/extra/raporlar.db` olarak kopyalanır ve `extraResources` ile ASAR dışında, exe'nin yanına yerleştirilir.

> **Encoding uyarısı**: Veritabanını PowerShell üzerinden `sqlite3` komutuyla güncellerken Türkçe karakterler Windows-1254 olarak yazılabilir. Güncellemeleri Node.js script'i ile yapın; UTF-8 garanti edilir.

---

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
