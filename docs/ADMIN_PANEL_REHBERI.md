# Admin Panel Rehberi - Birim Fiyat Yönetimi

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Admin Paneline Erişim](#admin-paneline-erişim)
- [Yeni Yıl Ekleme](#yeni-yıl-ekleme)
- [Fiyat Güncelleme](#fiyat-güncelleme)
- [Kayıt Silme](#kayıt-silme)
- [Veritabanı Yapısı](#veritabanı-yapısı)
- [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

Admin Paneli, birim fiyatları veritabanı üzerinden yönetmenizi sağlayan kullanıcı dostu bir arayüzdür.

### Özellikler

✅ **Kullanıcı Dostu UI**: Modern ve anlaşılır arayüz
✅ **CRUD İşlemleri**: Ekle, Düzenle, Sil
✅ **Otomatik Doldurma**: Resmi Gazete bilgileri
✅ **Doğrulama**: Form validasyonu ve hata kontrolü
✅ **Anında Yansıma**: Değişiklikler hemen aktif olur
✅ **Güvenli Silme**: Soft delete (veri kaybolmaz)

---

## 🔐 Admin Paneline Erişim

### Adım 1: Uygulamayı Açın

```bash
npm start
```

### Adım 2: Admin Paneline Gidin

Ana formda, **Yapı Bilgileri** sekmesinin alt kısmında:

```
[⚙️ Birim Fiyat Yönetimi] butonuna tıklayın
```

### Adım 3: Admin Penceresi Açılır

Yeni bir pencerede admin paneli görünür.

```
┌──────────────────────────────────────────┐
│ ⚙️ Admin Panel - Birim Fiyat Yönetimi   │
│                                  [✕ Kapat]│
├──────────────────────────────────────────┤
│                                          │
│  📝 Yeni Yıl / Fiyat Güncelleme         │
│  [Form alanları...]                      │
│                                          │
│  📊 Kayıtlı Birim Fiyatlar              │
│  [Tablo...]                              │
└──────────────────────────────────────────┘
```

---

## ➕ Yeni Yıl Ekleme

### Form Alanları

| Alan | Zorunlu | Açıklama | Örnek |
|------|---------|----------|-------|
| **Hesap Yılı** | ✅ | Tebliğ yılı (UNIQUE) | 2024 |
| **Tebliğ Adı** | ❌ | Açıklayıcı isim | 2024 Yılı Yapı Yaklaşık Birim Maliyetleri |
| **R.G. Tarihi** | ✅ | Resmi Gazete yayın tarihi | 15.01.2024 |
| **R.G. Sayısı** | ✅ | Resmi Gazete sayı numarası | 32768 |
| **1-7. Sınıf** | ✅ | Birim fiyatlar (TL/m²) | 22500, 20000, ... |

### Adım Adım Ekleme

#### 1. Hesap Yılını Girin

```
Hesap Yılı: [2025]
```

**Not**: Yıl benzersiz olmalı. Eğer 2025 zaten varsa, güncelleme yapılır.

#### 2. Resmi Gazete Bilgilerini Girin

```
Resmi Gazete Tarihi: [20.01.2025]
Resmi Gazete Sayısı: [33000]
Tebliğ Adı: [2025 Yılı Yapı Yaklaşık Birim Maliyetleri]  (opsiyonel)
```

#### 3. Yapı Sınıfı Fiyatlarını Girin

```
1. Sınıf: [25000]
2. Sınıf: [22000]
3. Sınıf: [19500]
4. Sınıf: [17000]
5. Sınıf: [14500]
6. Sınıf: [12000]
7. Sınıf: [9000]
```

**İpucu**: Resmi Gazete'de yayınlanan fiyatları doğrudan kopyalayın.

#### 4. Kaydet Butonuna Basın

```
[💾 Kaydet / Güncelle]
```

#### 5. Başarı Mesajı

```
✅ 2025 yılı başarıyla eklendi!
```

Form otomatik temizlenir ve tablo güncellenir.

---

## 🔄 Fiyat Güncelleme

### Mevcut Yılı Düzenleme

#### Yöntem 1: Düzenle Butonu

1. Kayıtlı fiyatlar tablosunda düzenlemek istediğiniz yılı bulun
2. **[✏️ Düzenle]** butonuna tıklayın
3. Form otomatik doldurulur
4. Değiştirmek istediğiniz alanları düzenleyin
5. **[💾 Kaydet / Güncelle]** butonuna basın

```
📋 Tabloda:
2024  |  15.01.2024  |  32768  |  22,500₺  |  ...  |  [✏️ Düzenle] [🗑️ Sil]
                                                          ↑
                                                    Tıklayın
↓
📝 Form doldurulur:
Hesap Yılı: [2024] (readonly - değiştirilemez)
R.G. Tarihi: [15.01.2024]
1. Sınıf: [22500]  ← Düzenleyin
2. Sınıf: [20000]
...
[💾 Kaydet / Güncelle]  ← Tıklayın
```

#### Yöntem 2: Aynı Yılı Yeniden Girme

Eğer formda mevcut bir yılı yazarsanız:
- Sistem otomatik güncelleme yapar
- "Zaten kayıtlı!" uyarısı verir
- Düzenle butonunu kullanmanızı önerir

---

## 🗑️ Kayıt Silme

### Soft Delete (Güvenli Silme)

Uygulama **soft delete** kullanır. Veri fiziksel olarak silinmez, sadece pasif hale getirilir.

#### Silme Adımları

1. Tabloda silmek istediğiniz yılı bulun
2. **[🗑️ Sil]** butonuna tıklayın
3. Onay mesajı görünür:

```
⚠️ 2023 yılına ait birim fiyatları silmek istediğinize emin misiniz?

Bu işlem geri alınamaz!

[İptal] [Evet, Sil]
```

4. **[Evet, Sil]** butonuna basın
5. Başarı mesajı:

```
✅ 2023 yılı başarıyla silindi!
```

### Silinen Veriler Nerede?

Veriler `birimFiyatlar` tablosunda kalır ama `aktif = 0` olur.

```sql
-- Silinen kayıtları görmek için:
SELECT * FROM birimFiyatlar WHERE aktif = 0;

-- Geri getirmek için (SQL ile):
UPDATE birimFiyatlar SET aktif = 1 WHERE yil = 2023;
```

---

## 🗄️ Veritabanı Yapısı

### birimFiyatlar Tablosu

```sql
CREATE TABLE birimFiyatlar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    yil INTEGER NOT NULL UNIQUE,           -- Hesap yılı
    resmiGazeteTarih TEXT,                 -- R.G. tarihi (YYYY-MM-DD)
    resmiGazeteSayili TEXT,                -- R.G. sayısı
    tebligAdi TEXT,                        -- Açıklama
    sinif1 REAL,                           -- 1. Sınıf fiyat (TL/m²)
    sinif2 REAL,                           -- 2. Sınıf fiyat
    sinif3 REAL,                           -- 3. Sınıf fiyat
    sinif4 REAL,                           -- 4. Sınıf fiyat
    sinif5 REAL,                           -- 5. Sınıf fiyat
    sinif6 REAL,                           -- 6. Sınıf fiyat
    sinif7 REAL,                           -- 7. Sınıf fiyat
    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
    aktif INTEGER DEFAULT 1                 -- 1: Aktif, 0: Silinmiş
);
```

### Örnek Kayıt

```sql
INSERT INTO birimFiyatlar (
    yil, resmiGazeteTarih, resmiGazeteSayili, tebligAdi,
    sinif1, sinif2, sinif3, sinif4, sinif5, sinif6, sinif7
) VALUES (
    2024, '2024-01-15', '32768', '2024 Yılı Yapı Yaklaşık Birim Maliyetleri',
    22500, 20000, 17500, 15000, 12500, 10000, 7500
);
```

---

## 🔄 Otomatik Doldurma Sistemi

### Ana Formda Kullanım

```
Kullanıcı Akışı:
1. Genel Bilgiler → Hesap Yılı: [2024]
2. Yapı Bilgileri → Yapı Sınıfı: [3. Sınıf]
   ↓
   ⚡ Sistem veritabanından çeker:
   ├─ Birim Fiyat: 17,500 TL/m²
   ├─ R.G. Tarihi: 15.01.2024
   └─ R.G. Sayısı: 32768
```

### Teknik Akış

```javascript
// 1. Kullanıcı hesap yılı ve yapı sınıfı seçer
onChange() → updateBirimFiyat()

// 2. Veritabanından sorgu
loadBirimFiyatFromDB(yil) → db.get(SELECT * FROM birimFiyatlar WHERE yil = ? AND aktif = 1)

// 3. Cache'e kaydet (hızlı erişim)
birimFiyatCache[yil] = data

// 4. Forma doldur
document.getElementById('birimFiyat').value = data.sinif3
document.getElementById('resmiGazeteTarih').value = data.resmiGazeteTarih
```

---

## 🐛 Sorun Giderme

### Sorun 1: Admin paneli açılmıyor

**Çözüm**:
1. Uygulamayı yeniden başlatın
2. Console'da hata kontrolü: `F12` → Console
3. `show-admin` IPC event'inin tanımlı olduğundan emin olun

### Sorun 2: Kayıt eklenmiyor

**Hata**: "UNIQUE constraint failed: birimFiyatlar.yil"

**Neden**: Bu yıl zaten kayıtlı

**Çözüm**: 
- Düzenle butonunu kullanın
- Veya farklı bir yıl girin

### Sorun 3: Tablo görünmüyor

**Çözüm**:
1. Veritabanında kayıt var mı kontrol edin:
```bash
sqlite3 raporlar.db "SELECT * FROM birimFiyatlar WHERE aktif = 1;"
```

2. Eğer boşsa, örnek veri ekleyin:
   - Admin panelinden yeni kayıt ekleyin
   - Veya uygulamayı ilk başlatın (otomatik 2024 ve 2023 eklenir)

### Sorun 4: Birim fiyat formda otomatik doldurulmuyor

**Debug Adımları**:

1. Console kontrolü (`F12`):
```javascript
// Veritabanında kayıt var mı?
db.all("SELECT * FROM birimFiyatlar WHERE aktif = 1", [], (e, r) => console.log(r))

// Cache'de var mı?
birimFiyatCache
```

2. Yıl doğru girildi mi?
   - "Hesap Yılı" alanına tam sayı girin (2024)
   - "Yapı Sınıfı" seçimi yapıldı mı?

3. Veritabanı bağlantısı var mı?
```javascript
db.get("SELECT COUNT(*) as count FROM birimFiyatlar", [], (e, r) => console.log('Kayıt sayısı:', r.count))
```

### Sorun 5: Güncelleme çalışmıyor

**Çözüm**:
1. Düzenleme modundan emin olun (form başlığında bilgi görünür)
2. Yıl alanı `readonly` olmalı (düzenle modunda)
3. Formu temizleyip tekrar düzenle butonuna basın

---

## 💡 İpuçları ve Best Practices

### 1. Resmi Gazete Kontrolü

Fiyatları eklerken mutlaka Resmi Gazete'den doğrulayın:
- Tarih doğru mu?
- Sayı numarası doğru mu?
- Fiyatlar tutarlı mı?

### 2. Fiyat Tutarlılığı

Yapı sınıfı fiyatları mantıklı sırada olmalı:
```
1. Sınıf (En yüksek) > 2. Sınıf > ... > 7. Sınıf (En düşük)

Örnek:
25000 > 22000 > 19500 > 17000 > 14500 > 12000 > 9000  ✅
25000 > 30000 > 15000 (Mantıksız sıralama)           ❌
```

### 3. Yedekleme

Önemli değişiklikler öncesi yedekleme yapın:
```bash
copy raporlar.db raporlar_backup_20241026.db
```

### 4. Test Edin

Yeni yıl ekledikten sonra:
1. Ana forma gidin
2. Hesap yılını seçin
3. Yapı sınıfı seçin
4. Birim fiyatın doğru geldiğini kontrol edin

### 5. Toplu Güncelleme

Birden fazla yılı güncelleyecekseniz:
- Her yıl için tek tek düzenle
- Veya SQL ile toplu güncelleme:
```sql
UPDATE birimFiyatlar 
SET sinif1 = sinif1 * 1.10  -- %10 artış
WHERE yil IN (2022, 2023, 2024);
```

---

## 📊 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Yıl Tebliği Yayınlandı

**Durum**: 2025 yılı için yeni tebliğ yayınlandı

**Adımlar**:
1. Admin panelini açın
2. Hesap Yılı: `2025`
3. R.G. Tarihi: `20.01.2025`
4. R.G. Sayısı: `33000`
5. Tüm sınıf fiyatlarını girin
6. Kaydet

**Sonuç**: Artık formda 2025 seçildiğinde fiyatlar otomatik gelir.

---

### Senaryo 2: Fiyat Revizyonu

**Durum**: 2024 yılı ortasında fiyatlar güncellendi

**Adımlar**:
1. Admin panelinde 2024'ü bulun
2. Düzenle butonuna basın
3. Sadece değişen fiyatları güncelleyin
4. Kaydet

**Sonuç**: Mevcut raporlar eskisi gibi, yeni raporlar güncel fiyatla.

---

### Senaryo 3: Yanlış Veri Girildi

**Durum**: 2024 fiyatlarında hata var

**Adımlar**:
1. Düzenle butonuna basın
2. Yanlış alanı düzeltin
3. Kaydet

**Not**: Geçmiş raporlar etkilenmez (onlar kendi fiyatlarını saklar).

---

## 📞 Destek

Admin paneli ile ilgili sorunlar için:
1. Console log'larını kontrol edin (`F12`)
2. Veritabanını kontrol edin (`sqlite3 raporlar.db`)
3. Bu dokümantasyonu tekrar okuyun
4. Destek ekibiyle iletişime geçin

---

## 🔮 Gelecek Özellikler

Planlanan iyileştirmeler:
- [ ] Toplu veri import (Excel/CSV)
- [ ] Fiyat geçmişi grafiği
- [ ] Otomatik yedekleme
- [ ] Kullanıcı rolleri (admin/user)
- [ ] Değişiklik log'u
- [ ] Export fonksiyonu

---

**Son Güncelleme**: 2024-10-26

