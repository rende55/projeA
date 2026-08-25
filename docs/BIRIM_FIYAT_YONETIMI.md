# Birim Fiyat Yönetimi

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Dönem Kavramı](#dönem-kavramı)
- [Nasıl Çalışır](#nasıl-çalışır)
- [Veri Yapısı](#veri-yapısı)
- [Yeni Dönem Ekleme](#yeni-dönem-ekleme)
- [Fiyat Güncelleme](#fiyat-güncelleme)
- [Dönem ve Rapor İlişkisi](#dönem-ve-rapor-i̇lişkisi)
- [Örnek Senaryolar](#örnek-senaryolar)
- [Sorun Giderme](#sorun-giderme)
- [İpuçları](#i̇puçları)

---

## Genel Bakış

Birim fiyat otomasyonu, **hesap dönemi** ve **yapı sınıfı/grubu** seçildiğinde metrekare birim fiyatının forma otomatik dolmasını sağlar.

### Özellikler

- **Otomatik doldurma**: Dönem + sınıf/grup → birim fiyat
- **Resmi Gazete künyesi**: Dönemin tarih ve sayısı raporla birlikte saklanır
- **Yıl ve dönem bazlı yönetim**: Aynı yıl içinde birden fazla tebliğ desteklenir
- **Veritabanı üzerinden yönetim**: Tüm veriler yönetim panelinden düzenlenir

> **Not**: Birim fiyatlar eskiden `modules/yapi-bedeli/birimFiyatlar.json` dosyasından okunuyordu. Bu yapı terk edilmiş, veriler veritabanına taşınmıştır. JSON dosyası depoda duruyor olabilir ancak uygulama tarafından **kullanılmamaktadır**; değişiklikleri yönetim panelinden yapın.

---

## Dönem Kavramı

Yapı yaklaşık birim maliyetleri tebliği normalde yılda bir yayınlanır; ancak ekonomik koşullara bağlı olarak bir yıl içinde birden fazla tebliğ çıkabilir. Sistem bu yüzden fiyatları **yıl** değil **dönem** bazında tutar.

| Yıl | Dönem sayısı | Etiket |
|-----|--------------|--------|
| 2021 | 1 | `2021` |
| 2022 | 3 | `2022/1`, `2022/2`, `2022/3` |
| 2023 | 2 | `2023/1`, `2023/2` |
| 2024 | 1 | `2024` |
| 2026 | 1 | `2026` |

**Etiketleme kuralı**: Bir yılda tek dönem varsa yalnızca yıl gösterilir; birden fazla dönem varsa `yıl/dönem` biçimi kullanılır.

---

## Nasıl Çalışır

### Kullanıcı Akışı

```
1. Genel Bilgiler sekmesinde "Hesap Yılı / Dönem" seçilir
   ↓
2. Yapı Bilgileri sekmesinde yapı sınıfı ve grubu seçilir
   ↓
3. Sistem otomatik olarak:
   • Birim fiyatı doldurur
   • Dönemin Resmi Gazete tarih ve sayısını rapora yazar
   ↓
4. Gerekirse kullanıcı fiyatı elle değiştirebilir
```

### Teknik Akış

```
birimFiyatlar (dönem kaydı)
        ↓
birimFiyatDetay (sınıf/grup fiyatları)
        ↓
   SQL sorgusu (birimFiyatId + sınıf + grup)
        ↓
   Form alanına doldurulur
```

Dönem uyarlaması ve editördeki otomatik güncelleme için fiyatlar bir `Map` olarak yüklenir:

```javascript
const fiyatlar = await donemServisi.fiyatTablosuGetir(db, birimFiyatId);
const fiyat = fiyatlar.get(donemServisi.fiyatAnahtari('4', 'B'));   // "4|B"
```

`fiyatAnahtari()` sınıfı trim eder, grubu büyük harfe çevirir; böylece `"4 "` ve `"4"`, `"b"` ve `"B"` aynı kayda düşer.

---

## Veri Yapısı

Birim fiyatlar iki tabloda tutulur.

### `birimFiyatlar` - Dönem Kaydı

| Sütun | Açıklama |
|-------|----------|
| `id` | Dönem kimliği; raporlar bu değere bağlanır |
| `yil` | Tebliğ yılı |
| `donem` | Yıl içindeki sıra (1, 2, 3...) |
| `resmiGazeteTarih` | R.G. yayın tarihi |
| `resmiGazeteSayili` | R.G. sayısı |
| `tebligAdi` | Tebliğin adı |
| `aktif` | Pasife alınan dönemler listelerde görünmez |

### `birimFiyatDetay` - Sınıf/Grup Fiyatları

| Sütun | Açıklama |
|-------|----------|
| `id` | Kayıt kimliği |
| `birimFiyatId` | Bağlı olduğu dönem |
| `yapiSinifi` | Yapı sınıfı (1-5) |
| `yapiGrubu` | Yapı grubu (A, B, C, D, E) |
| `birimFiyat` | Metrekare birim fiyatı (TL) |
| `aktif` | Pasif kayıtlar sorgulara girmez |

### Sınıf ve Grup Kombinasyonları

Tanımlı kombinasyonlar tebliğe göre değişir. Tipik olarak:

```
1. Sınıf: A, B, C, D
2. Sınıf: A, B, C
3. Sınıf: A, B, C
4. Sınıf: A, B, C
5. Sınıf: A, B, C, D, E
```

> **Sınıf ve grup ayrı alanlardır.** Birim fiyat sorgusu ikisinin birleşimiyle yapılır; yalnızca sınıf seçmek yeterli değildir.

---

## Yeni Dönem Ekleme

Yeni bir tebliğ yayınlandığında:

### Adım 1: Dönem Kaydını Açın

**Dashboard → Yönetici Paneli → Birim Fiyat Dönemleri**

| Alan | Örnek |
|------|-------|
| Yıl | 2026 |
| Dönem | 1 |
| R.G. Tarihi | 2026-03-15 |
| R.G. Sayılı | 33157 |
| Tebliğ Adı | Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ |

**Dönem Ekle** butonuna basın.

> **R.G. sayısını mutlaka girin.** Bu değer, raporların hangi döneme ait olduğunu kesin olarak belirlemekte kullanılır. Boş bırakılırsa ve o yılda birden fazla dönem varsa raporlarda dönem `Belirsiz` görünebilir.

### Adım 2: Sınıf/Grup Fiyatlarını Girin

Dönem listesinden yeni kaydın fiyat düzenleme işlemine girin. Açılan tabloda her sınıf/grup için tebliğdeki metrekare fiyatını yazın ve **Tüm Grupları Kaydet** ile kaydedin.

### Adım 3: Doğrulayın

Yeni bir rapor açıp:

1. Genel Bilgiler'de yeni dönemi seçin
2. Yapı Bilgileri'nde bir sınıf/grup seçin
3. Birim fiyatın doğru geldiğini kontrol edin

---

## Fiyat Güncelleme

### Mevcut Bir Dönemin Fiyatını Düzeltme

Yönetici panelinde ilgili dönemin fiyat tablosunu açın, değeri düzeltin ve kaydedin.

> **Düzeltme geçmiş raporları etkilemez.** Raporlar kaydedildikleri andaki birim fiyatı kendi kayıtlarında saklar. Bu kasıtlıdır: geçmiş bir rapor sonradan yapılan bir veri düzeltmesiyle kendiliğinden değişmez.

### Geçmiş Bir Raporu Güncel Fiyatlarla Yeniden Değerleme

Fiyat düzeltmesi yapmak yerine **Farklı Döneme Kopyala** özelliğini kullanın: rapor, seçilen dönemin fiyatlarıyla yeniden hesaplanıp yeni bir rapor olarak kaydedilir, kaynak rapor korunur. Ayrıntı için [KULLANIM.md](./KULLANIM.md#farklı-döneme-kopyalama).

---

## Dönem ve Rapor İlişkisi

Her rapor, kullanıldığı dönemi `birimFiyatId` sütununda tutar. Bu bağ üç yerde işe yarar:

| Yer | Kullanımı |
|-----|-----------|
| Kayıtlı Raporlar listesi | Dönem sütununda etiket ve R.G. sayısı gösterilir |
| Rapor editörü | Otomatik birim fiyat ve yıpranma güncellemesinin kaynağıdır |
| Döneme kopyalama | Kaynak dönemin ne olduğu, yıl farkının hesabında kullanılır |

### Eski Raporlar

`birimFiyatId` sütunu sonradan eklenmiştir. Mevcut raporlar şu sırayla geriye dönük eşleştirilmiştir:

1. Raporun R.G. sayısı bir dönemin künyesiyle birebir tutuyorsa o dönem atanır
2. Tutmazsa ve raporun yılında tek dönem varsa yıl üzerinden eşleştirilir
3. Yılda birden fazla dönem varsa ve künye yoksa boş bırakılır (`Belirsiz`)

Dönemi belirsiz kalan bir raporu düzeltmek için raporu editörde açıp doğru dönemle yeniden kaydedin.

---

## Örnek Senaryolar

### Senaryo 1: Yıl İçinde İkinci Tebliğ Yayınlandı

2026 yılında ikinci bir tebliğ çıktı.

1. Yönetici panelinde **Yıl: 2026, Dönem: 2** ile yeni kayıt açın
2. Yeni tebliğin R.G. tarih ve sayısını girin
3. Sınıf/grup fiyatlarını yeni tebliğe göre doldurun

Artık listelerde `2026/1` ve `2026/2` ayrı ayrı görünür. Eski raporlar `2026/1` ile ilişkili kalır.

### Senaryo 2: Bir Sınıf/Grup Tebliğde Yok

Tebliğde tanımlı olmayan bir kombinasyon için fiyat girmeyin. O sınıfa sahip bir yapı girildiğinde birim fiyat otomatik gelmez; değer elle yazılır.

Dönem kopyalamada bu durum "fiyat tanımlı değil" uyarısıyla bildirilir ve eski fiyat korunur.

### Senaryo 3: Geçmiş Yılların Fiyatlarını Sisteme Girme

Eski raporları yeniden üretmek veya karşılaştırma yapmak için geçmiş tebliğler de girilebilir. Her yıl için dönem kaydı açıp fiyatlarını doldurmanız yeterlidir; sistem tüm dönemleri eşit şekilde kullanır.

---

## Sorun Giderme

### Birim fiyat otomatik gelmiyor

Sırayla kontrol edin:

1. **Dönem seçili mi?** Genel Bilgiler sekmesindeki hesap yılı/dönem alanı boş olabilir
2. **Sınıf ve grup birlikte seçili mi?** Yalnızca sınıf yeterli değildir
3. **O kombinasyon tanımlı mı?** Yönetim panelinde dönemin fiyat tablosunu açıp kontrol edin
4. **Dönem aktif mi?** Pasife alınmış dönemler listelerde görünmez

### Yanlış fiyat geliyor

Seçili dönemi kontrol edin. Aynı yılda birden fazla dönem varsa yanlış dönem seçilmiş olabilir; etiketteki R.G. sayısı hangi tebliğ olduğunu gösterir.

### Editörde fiyat kendiliğinden değişti

Bu beklenen davranıştır: editörde yapı sınıfı veya grubu değiştirildiğinde birim fiyat, raporun dönemine göre yeniden çekilir ve hücre kısa süre vurgulanır. Değeri elle yazarsanız girdiğiniz değer korunur.

### Dönem kopyalamada fiyat değişmedi

Uyarı listesine bakın. Sınıf/grup bilgisi eksik olan veya hedef dönemde karşılığı bulunmayan yapılarda eski fiyat korunur.

### Fiyat tablosunda sınıf/grup satırı göremiyorum

Fiyat tablosu tebliğdeki kombinasyonlara göre düzenlenir. Eksik bir kombinasyon varsa dönem kaydının fiyat düzenleme ekranından ekleyebilirsiniz.

---

## İpuçları

### Tebliğ Girişini Tek Seferde Tamamlayın

Dönem kaydını açıp fiyatları girmeden bırakmayın. Yarım kalan dönem, formda seçilebilir ancak fiyat getirmez ve karışıklığa yol açar.

### R.G. Künyesini Eksiksiz Girin

Tarih ve sayı hem rapor çıktısında görünür hem de raporların dönemle eşleştirilmesinde kullanılır.

### Fiyatları Tebliğden Doğrudan Kontrol Edin

Girişten sonra bir test raporu oluşturup birkaç sınıf/grup için gelen fiyatı tebliğle karşılaştırın.

### Yedek Alın

Toplu fiyat girişi öncesi veritabanının bir kopyasını alın:

```powershell
Copy-Item raporlar.db "yedek/raporlar_$(Get-Date -Format 'yyyyMMdd').db"
```

### Veritabanını Elle Güncellemeyin

Fiyatları PowerShell üzerinden `sqlite3` komutuyla güncellemeyin; Türkçe karakterler yanlış kodlamayla (Windows-1254) yazılabilir. Panel üzerinden veya Node.js script'i ile güncelleyin.

---

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
