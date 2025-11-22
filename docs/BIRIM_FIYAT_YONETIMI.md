# Birim Fiyat Yönetimi Rehberi

## 📋 İçindekiler

- [Genel Bakış](#genel-bakış)
- [Nasıl Çalışır](#nasıl-çalışır)
- [Veri Yapısı](#veri-yapısı)
- [Yeni Yıl Ekleme](#yeni-yıl-ekleme)
- [Fiyat Güncelleme](#fiyat-güncelleme)
- [Sorun Giderme](#sorun-giderme)

---

## 🎯 Genel Bakış

Birim fiyat otomasyonu, **Hesap Yılı** ve **Yapı Sınıfı** seçildiğinde birim fiyatın otomatik olarak forma doldurulmasını sağlar.

### Özellikleri

✅ **Otomatik Doldurma**: Hesap yılı + yapı sınıfı → Birim fiyat
✅ **Resmi Gazete Bilgileri**: Tarih ve sayı otomatik doldurulur
✅ **Kolay Güncelleme**: JSON dosyasıyla basit yönetim
✅ **Yıl Bazlı Yönetim**: Her yıl için ayrı tebliğ
✅ **7 Yapı Sınıfı**: 1. Sınıf'tan 7. Sınıf'a kadar

---

## 🔄 Nasıl Çalışır

### Kullanıcı Akışı

```
1. Kullanıcı "Genel Bilgiler" sekmesinde "Hesap Yılı"nı girer
   ↓
2. Kullanıcı "Yapı Bilgileri" sekmesinde "Yapı Sınıfı"nı seçer
   ↓
3. Sistem otomatik olarak:
   - Birim fiyatı doldurur
   - Resmi Gazete tarihini doldurur
   - Resmi Gazete sayısını doldurur
   ↓
4. Kullanıcı fiyatı değiştirebilir (isteğe bağlı)
```

### Teknik Akış

```
birimFiyatlar.json
        ↓
    fs.readFileSync()
        ↓
   JSON.parse()
        ↓
birimFiyatVerileri (global)
        ↓
getBirimFiyat(yil, sinif)
        ↓
Form alanına doldurulur
```

---

## 📊 Veri Yapısı

### birimFiyatlar.json

```json
{
  "tebligler": [
    {
      "id": 1,
      "yil": 2024,
      "resmiGazeteTarih": "2024-01-15",
      "resmiGazeteSayili": "32768",
      "tebligAdi": "2024 Yılı Yapı Yaklaşık Birim Maliyetleri",
      "fiyatlar": {
        "1. Sınıf": 22500,
        "2. Sınıf": 20000,
        "3. Sınıf": 17500,
        "4. Sınıf": 15000,
        "5. Sınıf": 12500,
        "6. Sınıf": 10000,
        "7. Sınıf": 7500
      }
    }
  ],
  "varsayilan": {
    "yil": 2024,
    "id": 1
  }
}
```

### Alan Açıklamaları

| Alan | Tip | Zorunlu | Açıklama |
|------|-----|---------|----------|
| `id` | number | ✅ | Benzersiz tebliğ ID |
| `yil` | number | ✅ | Hesap yılı (YYYY) |
| `resmiGazeteTarih` | string | ✅ | ISO 8601 formatında (YYYY-MM-DD) |
| `resmiGazeteSayili` | string | ✅ | Resmi Gazete sayısı |
| `tebligAdi` | string | ❌ | Tebliğ açıklaması |
| `fiyatlar` | object | ✅ | Yapı sınıflarına göre fiyatlar (TL/m²) |

---

## ➕ Yeni Yıl Ekleme

### Adım 1: birimFiyatlar.json Dosyasını Açın

Proje kök dizininde `birimFiyatlar.json` dosyasını bir metin editöründe açın.

### Adım 2: Yeni Tebliğ Ekleyin

`tebligler` dizisine yeni bir obje ekleyin:

```json
{
  "tebligler": [
    {
      "id": 3,
      "yil": 2025,
      "resmiGazeteTarih": "2025-01-20",
      "resmiGazeteSayili": "33000",
      "tebligAdi": "2025 Yılı Yapı Yaklaşık Birim Maliyetleri",
      "fiyatlar": {
        "1. Sınıf": 25000,
        "2. Sınıf": 22000,
        "3. Sınıf": 19500,
        "4. Sınıf": 17000,
        "5. Sınıf": 14500,
        "6. Sınıf": 12000,
        "7. Sınıf": 9000
      }
    },
    // Mevcut tebliğler...
  ]
}
```

### Adım 3: Varsayılan Yılı Güncelleyin (İsteğe Bağlı)

```json
"varsayilan": {
  "yil": 2025,
  "id": 3
}
```

### Adım 4: Kaydedin ve Uygulamayı Yeniden Başlatın

```bash
# Uygulamayı kapatın
# Dosyayı kaydedin
# Uygulamayı yeniden başlatın
npm start
```

---

## 🔧 Fiyat Güncelleme

### Mevcut Yıl Fiyatlarını Güncelleme

```json
{
  "id": 1,
  "yil": 2024,
  "resmiGazeteTarih": "2024-01-15",
  "resmiGazeteSayili": "32768",
  "tebligAdi": "2024 Yılı Yapı Yaklaşık Birim Maliyetleri",
  "fiyatlar": {
    "1. Sınıf": 23500,  // 22500 → 23500 güncellendi
    "2. Sınıf": 21000,  // 20000 → 21000 güncellendi
    "3. Sınıf": 18500,  // Vb...
    "4. Sınıf": 16000,
    "5. Sınıf": 13500,
    "6. Sınıf": 11000,
    "7. Sınıf": 8500
  }
}
```

### Tek Bir Sınıf Fiyatını Güncelleme

Sadece değiştirmek istediğiniz sınıfın fiyatını düzenleyin:

```json
"fiyatlar": {
  "1. Sınıf": 22500,
  "2. Sınıf": 20000,
  "3. Sınıf": 18000,  // ← Sadece bu güncellendi
  "4. Sınıf": 15000,
  "5. Sınıf": 12500,
  "6. Sınıf": 10000,
  "7. Sınıf": 7500
}
```

---

## 📝 Örnek Kullanım Senaryoları

### Senaryo 1: 2025 Yılı Tebliği Yayınlandı

**Durum**: Yeni yıl için Resmi Gazete'de tebliğ yayınlandı.

**Çözüm**:
1. Resmi Gazete'den bilgileri alın:
   - Tarih: 20.01.2025
   - Sayı: 33000
   - Birim fiyatlar

2. JSON dosyasına ekleyin:

```json
{
  "id": 3,
  "yil": 2025,
  "resmiGazeteTarih": "2025-01-20",
  "resmiGazeteSayili": "33000",
  "tebligAdi": "2025 Yılı Yapı Yaklaşık Birim Maliyetleri",
  "fiyatlar": {
    "1. Sınıf": 25000,
    "2. Sınıf": 22000,
    "3. Sınıf": 19500,
    "4. Sınıf": 17000,
    "5. Sınıf": 14500,
    "6. Sınıf": 12000,
    "7. Sınıf": 9000
  }
}
```

3. Uygulamayı yeniden başlatın

---

### Senaryo 2: Fiyat Revizyonu

**Durum**: 2024 yılı ortasında fiyatlar revize edildi.

**Çözüm**:
1. Mevcut 2024 tebliğini bulun
2. Sadece fiyatları güncelleyin
3. Uygulamayı yeniden başlatın

---

### Senaryo 3: Geçmiş Yıl Raporları

**Durum**: 2023 yılı için rapor hazırlanacak ama 2023 fiyatları yok.

**Çözüm**:
1. 2023 tebliğini JSON'a ekleyin
2. Formda "Hesap Yılı: 2023" seçin
3. Sistem 2023 fiyatlarını otomatik çeker

---

## 🐛 Sorun Giderme

### Sorun 1: Birim fiyat otomatik doldurulmuyor

**Olası Nedenler**:
- JSON dosyası mevcut değil
- JSON syntax hatası
- Yıl veritabanında yok
- Yapı sınıfı eşleşmedi

**Çözüm**:
```bash
# Console'da kontrol edin
F12 → Console sekmesi

# Şu mesajları arayın:
"✅ Birim fiyat verileri yüklendi: 2 tebliğ"
"✅ Birim fiyat otomatik dolduruldu: 17500 TL/m²"

# Hata varsa:
"❌ Birim fiyat verileri yüklenemedi"
"⚠️ 2025 yılı için birim fiyat bulunamadı"
```

**Debug**:
```javascript
// Console'a yazın:
birimFiyatVerileri
// JSON verisini görürsünüz
```

---

### Sorun 2: JSON syntax hatası

**Hata Mesajı**:
```
❌ Birim fiyat verileri yüklenemedi: Unexpected token
```

**Çözüm**:
1. JSON dosyasını online validator'da kontrol edin: [jsonlint.com](https://jsonlint.com)
2. Yaygın hatalar:
   - Son elemanın sonunda virgül (`,`)
   - Eksik süslü parantez (`{`, `}`)
   - Eksik köşeli parantez (`[`, `]`)
   - Tırnak işareti hatası (`"` yerine `'`)

**Örnek Hatalı**:
```json
{
  "tebligler": [
    {
      "yil": 2024,
      "fiyatlar": {
        "1. Sınıf": 22500,  ← Son satırda virgül olmamalı
      }
    },  ← Son elemanda virgül olmamalı
  ]
}
```

**Doğrusu**:
```json
{
  "tebligler": [
    {
      "yil": 2024,
      "fiyatlar": {
        "1. Sınıf": 22500
      }
    }
  ]
}
```

---

### Sorun 3: Resmi Gazete bilgileri doldurulmuyor

**Çözüm**:
JSON'da `resmiGazeteTarih` ve `resmiGazeteSayili` alanlarının doğru yazıldığından emin olun.

```json
{
  "resmiGazeteTarih": "2024-01-15",  // ISO formatı: YYYY-MM-DD
  "resmiGazeteSayili": "32768"       // String olmalı
}
```

---

### Sorun 4: Yapı sınıfı eşleşmiyor

**Hata**:
```
⚠️ 3.Sınıf için birim fiyat bulunamadı
```

**Neden**: JSON'da "3. Sınıf" (nokta ve boşluklu), formda "3.Sınıf" (boşluksuz)

**Çözüm**: JSON'daki yapı sınıfı adları formla tam eşleşmeli:
```json
"fiyatlar": {
  "1. Sınıf": 22500,  // ✅ Doğru: "1. Sınıf" (nokta + boşluk)
  "2.Sınıf": 20000    // ❌ Yanlış: boşluk yok
}
```

---

## 📊 JSON Şablonu

Yeni yıl eklerken bu şablonu kullanın:

```json
{
  "id": 999,
  "yil": YYYY,
  "resmiGazeteTarih": "YYYY-MM-DD",
  "resmiGazeteSayili": "XXXXX",
  "tebligAdi": "YYYY Yılı Yapı Yaklaşık Birim Maliyetleri",
  "fiyatlar": {
    "1. Sınıf": 0,
    "2. Sınıf": 0,
    "3. Sınıf": 0,
    "4. Sınıf": 0,
    "5. Sınıf": 0,
    "6. Sınıf": 0,
    "7. Sınıf": 0
  }
}
```

**Doldurulacak Alanlar**:
- `id` → Benzersiz sayı (örn: son id + 1)
- `YYYY` → Yıl (örn: 2025)
- `YYYY-MM-DD` → Resmi Gazete tarihi (örn: 2025-01-20)
- `XXXXX` → Resmi Gazete sayısı (örn: 33000)
- `0` → Birim fiyatlar (TL/m²)

---

## 💡 İpuçları

### 1. Yedekleme

Her güncelleme öncesi JSON dosyasını yedekleyin:

```bash
copy birimFiyatlar.json birimFiyatlar_backup_20241026.json
```

### 2. Sürüm Kontrolü

JSON dosyasını Git'e ekleyin:

```bash
git add birimFiyatlar.json
git commit -m "feat: 2025 yılı birim fiyatları eklendi"
```

### 3. Ekip Paylaşımı

JSON dosyasını ekip üyeleriyle paylaşın. Herkes aynı fiyatları kullanır.

### 4. Manuel Değiştirme

Kullanıcı formda birim fiyatı manuel değiştirebilir. Otomatik doldurma sadece ilk değeri koyar.

### 5. Önizleme

Değişiklikleri test etmek için:
1. Uygulamayı açın
2. F12 → Console
3. `birimFiyatVerileri` yazın
4. Tüm veriyi görürsünüz

---

## 🔮 Gelecek İyileştirmeler

### Planlanan Özellikler

- [ ] UI'dan birim fiyat yönetimi (admin panel)
- [ ] SQLite'a taşıma seçeneği
- [ ] Excel import/export
- [ ] Otomatik Resmi Gazete çekme (API)
- [ ] Geçmiş fiyat karşılaştırması
- [ ] Enflasyon hesaplama

---

## 📞 Destek

JSON düzenlemede sorun yaşarsanız:
1. [jsonlint.com](https://jsonlint.com) ile validate edin
2. Console log'larını kontrol edin (F12)
3. Bu dokümantasyonu tekrar okuyun

---

**Son Güncelleme**: 2024-10-26

