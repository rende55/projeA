# Yönetici Paneli Rehberi

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Panele Erişim](#panele-erişim)
- [Birim Fiyat Dönemleri](#birim-fiyat-dönemleri)
- [Raportörler](#raportörler)
- [Kurumlar](#kurumlar)
- [İl / İlçe](#i̇l--i̇lçe)
- [PID Oranları](#pid-oranları)
- [Sorun Giderme](#sorun-giderme)
- [İyi Pratikler](#i̇yi-pratikler)

---

## Genel Bakış

Yönetici Paneli, uygulamanın hesaplamalarını besleyen tanım verilerini yönetir. Formlarda seçilen her liste ve otomatik gelen her katsayı bu panelden yönetilir.

### Sekmeler

| Sekme | Yönetilen veri | Etkilediği yer |
|-------|----------------|----------------|
| **Birim Fiyat Dönemleri** | Tebliğ dönemleri ve sınıf/grup fiyatları | Yapı Bedeli hesabı, dönem kopyalama |
| **Raportörler** | Raportör ad, soyad ve ünvanları | Rapor imza bölümü |
| **Kurumlar** | Kurum ve alt kurum tanımları | Genel Bilgiler sekmesindeki "İlgili Kurum" |
| **İl / İlçe** | İl ve ilçe listeleri | Arsa Bilgileri sekmesi |
| **PID Oranları** | Alan aralığı × hizmet sınıfı oranları | Proje Bedeli hesabı |

### Özellikler

- Ekleme, düzenleme ve pasife alma (soft delete) işlemleri
- Değişiklikler anında geçerli olur; uygulamayı yeniden başlatmaya gerek yoktur
- Pasife alınan kayıtlar listelerde görünmez ama veritabanında korunur; eski raporlarla bağ kopmaz

---

## Panele Erişim

Dashboard'daki **Yönetici Paneli** kartına tıklayın. Panel, diğer sayfalar gibi aynı pencerede açılır; üst çubuktaki geri oku veya `ESC` ile çıkabilirsiniz.

```
┌──────────────────────────────────────────────────────────────┐
│  Yönetim Paneli                                              │
├──────────────────────────────────────────────────────────────┤
│ [Birim Fiyat Dönemleri] [Raportörler] [Kurumlar]             │
│ [İl / İlçe] [PID Oranları]                                   │
├──────────────────────────────────────────────────────────────┤
│  (seçili sekmenin formu ve listesi)                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Birim Fiyat Dönemleri

Yapı yaklaşık birim maliyetleri tebliğlerinin yönetildiği sekmedir. İki katmanlıdır: önce **dönem** kaydı açılır, sonra o döneme **sınıf/grup fiyatları** girilir.

### Yeni Dönem Ekleme

| Alan | Zorunlu | Açıklama |
|------|---------|----------|
| Yıl | ✓ | Tebliğ yılı (örn. 2026) |
| Dönem | ✓ | Yıl içindeki sıra; ilk tebliğ için 1 |
| R.G. Tarihi | — | Resmi Gazete yayın tarihi |
| R.G. Sayılı | — | Resmi Gazete sayısı (örn. 33157) |
| Tebliğ Adı | — | Tebliğin tam adı |

**Dönem Ekle** butonuyla kayıt oluşturulur.

> **Dönem alanı neden var?** Bir yıl içinde birden fazla tebliğ yayınlanabilir. Örneğin 2022'de üç tebliğ çıkmıştır. Bu durumda dönemler `2022/1`, `2022/2`, `2022/3` olarak ayrılır ve listelerde bu biçimde görünür. Bir yılda tek dönem varsa sadece yıl gösterilir.

> **Resmi Gazete sayısını mutlaka girin.** Bu değer yalnızca rapor künyesinde kullanılmaz; raporların hangi döneme ait olduğunu kesin olarak belirlemekte de kullanılır. Sayı girilmemişse ve o yılda birden fazla dönem varsa raporlar listesinde dönem `Belirsiz` görünebilir.

### Sınıf ve Grup Fiyatları

Dönem listesinden bir kaydın fiyat düzenleme işlemine girildiğinde sınıf/grup fiyat tablosu açılır. Her yapı sınıfı (1-5) ve grubu (A, B, C, D) için metrekare birim fiyatı girilir.

**Tüm Grupları Kaydet** ile değişiklikler tek seferde yazılır.

> Bir sınıf/grup için fiyat girilmemişse, o sınıfa sahip yapılarda birim fiyat otomatik gelmez. Dönem kopyalama sırasında da "fiyat tanımlı değil" uyarısı alırsınız.

Birim fiyat verisinin ayrıntılı yönetimi ve toplu giriş için [BIRIM_FIYAT_YONETIMI.md](./BIRIM_FIYAT_YONETIMI.md) rehberine bakın.

### Dönem Listesi

| Sütun | Açıklama |
|-------|----------|
| ID | Kayıt numarası |
| Yıl/Dönem | Dönem etiketi |
| R.G. Tarihi / Sayılı | Resmi Gazete künyesi |
| Tebliğ Adı | Tebliğin adı |
| Durum | Aktif / pasif |
| İşlemler | Fiyat düzenleme, düzenleme, pasife alma |

---

## Raportörler

Raporları imzalayan kişilerin tanımlandığı sekmedir.

| Alan | Açıklama |
|------|----------|
| Adı | Raportörün adı |
| Soyadı | Raportörün soyadı |
| Ünvanı | Listeden seçilir veya elle yazılır |

### Ünvan Listesi

Ünvanlar kategorilere ayrılmıştır:

| Kategori | Örnekler |
|----------|----------|
| Mühendislik | İnşaat Mühendisi, Makine Mühendisi, Elektrik-Elektronik Mühendisi, Çevre Mühendisi, Jeofizik Mühendisi |
| İdari | Müdür, Şef, Memur |
| Teknik | Tekniker, Teknisyen, Teknik Ressam |
| Diğer | Mimar, Şehir Plancısı |

Listede olmayan bir ünvan için **Elle Giriş** seçeneği kullanılır. Mevcut bir kaydı düzenlerken ünvanı listede yoksa form otomatik olarak elle giriş moduna geçer.

Rapor formunda raportör sayısı 1-3 arasında seçilebilir; her raportör için ayrı ad ve ünvan alanı açılır.

---

## Kurumlar

Rapor talep eden kurumların tanımlandığı sekmedir.

| Alan | Açıklama |
|------|----------|
| Kurum Adı | Ana kurum (örn. Milli Emlak Genel Müdürlüğü) |
| Alt Kurum | Bağlı birim (örn. Samsun Emlak Müdürlüğü) |

Bu ikili, rapor formundaki **İlgili Kurum** alanını besler ve Word çıktısında rapor künyesinde yer alır.

---

## İl / İlçe

Arsa Bilgileri sekmesindeki il ve ilçe listelerini yönetir.

### İl ve İlçelerini Yükle

**İl Seçin** listesinden bir il seçip **İli ve İlçelerini Yükle** butonuna basıldığında, il ve ona bağlı tüm ilçeler paket veriden (`sehirler.json` / `ilceler.json`) veritabanına aktarılır.

### Elle Düzenleme

Yüklenen il ve ilçeler üzerinde ekleme, düzenleme ve pasife alma yapılabilir. Yeni kurulan veya adı değişen ilçeler bu şekilde eklenir.

### Varsayılan İl

Bir il varsayılan olarak işaretlendiğinde, rapor formlarında önceden seçili gelir.

> İlçe listesi rapor formunda seçili ile göre filtrelenir. Bir ilçe görünmüyorsa önce bağlı olduğu ilin yüklü ve aktif olduğunu kontrol edin.

---

## PID Oranları

Proje Bedeli modülünün hizmet bedeli hesabında kullanılan oran tablosudur.

### Tablo Yapısı

Satırlar yapı yaklaşık maliyeti aralıklarını (m² veya tutar bandı), sütunlar hizmet sınıflarını (1-5) temsil eder:

```
   m²        | 1. Sınıf | 2. Sınıf | 3. Sınıf | 4. Sınıf | 5. Sınıf
─────────────┼──────────┼──────────┼──────────┼──────────┼──────────
   ...       |   ...    |   ...    |   ...    |   ...    |   ...
```

Hücrelere doğrudan yazılarak düzenlenir; **Tüm Değişiklikleri Kaydet** ile toplu kaydedilir. **Yenile** butonu tabloyu veritabanından yeniden yükler.

> Proje Bedeli hesabında alan ve hizmet sınıfı verildiğinde bu tablodan ilgili oran bulunur. Bir aralık için oran tanımlı değilse o branşın hesabı yapılamaz.

---

## Sorun Giderme

### Formda birim fiyat otomatik gelmiyor

1. Rapor formunda hesap dönemi seçili mi?
2. Yapı sınıfı **ve** grubu birlikte seçili mi?
3. Panelde o dönemin fiyat tablosunda ilgili sınıf/grup dolu mu?

### Yeni eklediğim kurum/raportör listede görünmüyor

Sayfayı terk edip tekrar girin. Listeler sayfa açılışında yüklenir.

### İlçe listesi boş

İl / İlçe sekmesinden ilgili ili yükleyin. Yükleme yapılmamış illerin ilçeleri veritabanında bulunmaz.

### Dönemi sildim, eski raporlar ne olacak?

Dönemler kalıcı olarak silinmez, pasife alınır. Eski raporlar dönem bilgilerini kendi kayıtlarında da tuttuğu için etkilenmez; ancak pasif dönem yeni raporlarda ve dönem kopyalama listesinde görünmez.

### Fiyat girdim ama eski raporlar değişmedi

Bu beklenen davranıştır. Raporlar kaydedildikleri andaki değerleri saklar. Bir raporu güncel fiyatlarla yeniden değerlemek için **Farklı Döneme Kopyala** özelliğini kullanın.

---

## İyi Pratikler

### Yeni Tebliğ Yayınlandığında

1. Önce dönem kaydını açın (yıl, dönem, R.G. tarihi ve sayısı, tebliğ adı)
2. Sınıf/grup fiyatlarını eksiksiz girin
3. Bir test raporu oluşturup birim fiyatın doğru geldiğini kontrol edin

### Resmi Gazete Künyesi

R.G. sayısını her dönemde doldurun. Bu alan raporların dönemle eşleştirilmesinde birincil anahtardır.

### Silme Yerine Pasife Alma

Hatalı bir kaydı silmek yerine pasife almak, eski raporlarla bağı korur. Bu nedenle panel varsayılan olarak pasife alma kullanır.

### Yedekleme

Tanım verilerini güncellemeden önce `raporlar.db` dosyasının bir kopyasını alın:

```powershell
Copy-Item raporlar.db "yedek/raporlar_$(Get-Date -Format 'yyyyMMdd').db"
```

---

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
