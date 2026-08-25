# Kullanım Kılavuzu

## İçindekiler

- [Uygulamayı Başlatma](#uygulamayı-başlatma)
- [Dashboard ve Modül Hub'ları](#dashboard-ve-modül-hubları)
- [Yapı Bedeli: Rapor Oluşturma](#yapı-bedeli-rapor-oluşturma)
- [Çoklu Parsel Raporu](#çoklu-parsel-raporu)
- [Kayıtlı Raporlar](#kayıtlı-raporlar)
- [Rapor Editörü](#rapor-editörü)
- [Farklı Döneme Kopyalama](#farklı-döneme-kopyalama)
- [Word Raporu](#word-raporu)
- [Proje Bedeli Modülü](#proje-bedeli-modülü)
- [Cephe Metrajı](#cephe-metrajı)
- [İpuçları](#i̇puçları)
- [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## Uygulamayı Başlatma

### İlk Çalıştırma

```bash
npm start
```

İlk açılışta veritabanı (`raporlar.db`) otomatik oluşturulur ve varsayılan veriler (yıpranma cetveli, il/ilçe listesi, hizmet dalı katsayıları) yüklenir.

### Portable Sürüm

Portable exe çalıştırıldığında veritabanı, exe'nin bulunduğu klasörde oluşur. Uygulamayı taşırken `raporlar.db` dosyasını da yanında taşıyın; aksi halde kayıtlarınıza erişemezsiniz.

---

## Dashboard ve Modül Hub'ları

Uygulama açıldığında **Dashboard** karşılar. Her modül bir kartla temsil edilir:

| Kart | Durum |
|------|-------|
| Yapı Bedeli | Aktif |
| Proje Bedeli | Aktif |
| Hesaplamalar | Aktif |
| Mevzuat | Yakında |
| Yönetici Paneli | Aktif |

### Modül Hub Sayfası

Bir modül kartına tıkladığınızda doğrudan forma değil, modülün **giriş ekranına (hub)** gidersiniz. Hub üç şey sunar:

1. **Yeni Hesaplama** - boş formu açar
2. **Kayıtlı Raporlar / Metrajlar** - tam listeye gider
3. **Son kayıtlar tablosu** - en son kayıtlar; bir satıra tıklayınca kayıt doğrudan editörde açılır

### Gezinme

| Yol | İşlev |
|-----|-------|
| Üst çubuktaki geri oku | Bir önceki sayfa |
| Üst çubuktaki ev simgesi | Dashboard |
| Breadcrumb (konum yolu) | Tıklanan noktaya döner |
| `ESC` veya `Alt` + `←` | Geri |
| `Alt` + `Home` | Dashboard |
| Form içindeki "Modül Ana Sayfası" | Modülün hub sayfası |

Kaydedilmemiş değişiklik varken sayfadan ayrılmaya çalışırsanız uyarı alırsınız.

---

## Yapı Bedeli: Rapor Oluşturma

**Yapı Bedeli → Yeni Hesaplama** ile üç sekmeli forma girilir.

### Adım 1: Genel Bilgiler

| Alan | Açıklama |
|------|----------|
| Rapor No | Rapor numarası |
| Rapor Tarihi | Raporun düzenlendiği tarih |
| Resmi Yazı Tarihi / Sayısı | Talep yazısının künyesi |
| İlgili Kurum | Kurum ve alt kurum (yönetim panelinden tanımlanır) |
| Hesap Yılı / Dönem | Kullanılacak birim fiyat dönemi |
| Raportör Sayısı | 1-3 arası; her raportör için ad ve ünvan alanı açılır |
| Çoklu Parsel Raporu | İşaretlenirse çoklu parsel moduna geçilir |

> **Hesap dönemi seçimi kritiktir**: Birim fiyatlar bu seçime göre çekilir. Bir yılda birden fazla tebliğ yayınlanmışsa dönemler `2022/1`, `2022/2` biçiminde listelenir.

### Adım 2: Arsa Bilgileri

| Alan | Açıklama |
|------|----------|
| İl / İlçe | İl seçimi ilçe listesini filtreler |
| Mahalle | Mahalle adı |
| Ada / Parsel | Tapu bilgileri |
| Yüzölçümü | Arsa alanı (m²) |
| Malik | Arsa maliki |

### Adım 3: Yapı Bilgileri

Bir raporda birden fazla yapı olabilir. **Yeni Yapı Ekle** ile satır eklenir.

| Alan | Açıklama |
|------|----------|
| Yapı Adı | Örn. "İdari Bina", "Depo" |
| Yapı Sınıfı / Grubu | Örn. 4. Sınıf B Grubu |
| Yapım Tekniği | Betonarme Karkas, Çelik, Yığma Kagir, Ahşap, ... |
| Yapı Yaşı | Yıl |
| Yapı Alanı | m² |
| Birim Fiyat | Sınıf/grup seçilince dönemden **otomatik** gelir |
| Yıpranma Payı | Teknik ve yaş girilince cetvelden **otomatik** gelir |
| Eksik İmalat Oranı | Varsa yüzde olarak |

### Hesaplama

**Hesapla** butonu tüm yapıların bedelini ve toplamı çıkarır:

```
Yapı Bedeli = Birim Fiyat × Alan × (1 - Yıpranma/100) × (1 - Eksik İmalat/100)
```

Asgari levazım bedeli isteniyorsa:

```
Levazım Bedeli = Yapı Bedeli × 0,70 × 0,75
```

### Fotoğraf Ekleme

Yapı fotoğrafları eklenebilir; her fotoğrafa açıklama yazılabilir. Fotoğraflar Word çıktısının sonuna eklenir.

> Fotoğraflar veritabanına gömülü olarak saklanır. Çok sayıda ve yüksek çözünürlüklü fotoğraf veritabanı dosyasını hızla büyütür.

### Kaydetme

**Raporu Kaydet** ile kayıt veritabanına yazılır. Kayıttan sonra rapor, Kayıtlı Raporlar listesinden veya hub'daki son raporlar tablosundan açılabilir.

---

## Çoklu Parsel Raporu

Tek raporda birden fazla ada/parsel değerlemek için Genel Bilgiler sekmesindeki **Çoklu Parsel Raporu** kutusu işaretlenir.

### Çalışma Biçimi

1. **Yeni Parsel Ekle** ile her parsel için ayrı blok açılır
2. Her parsele kendi ilçe, mahalle, ada, parsel, yüzölçümü ve malik bilgisi girilir
3. Her parsele bağımsız olarak yapı eklenir; **yapı numaraları her parselde 1'den başlar**
4. Hesaplama tüm parselleri kapsar

### Word Çıktısı

Çoklu parsel raporunda tablo 10 sütunludur:

```
Ada | Parsel | Y.No | Yapı Adı | Sınıfı | B.Fiyat | Alan | Yıpr. | Eks.İm. | Yapı Bedeli
```

- Yazı boyutu 10 punto, sütun başlıkları kısaltılmıştır
- Her parselin yapıları bittiğinde **Ara Toplam** satırı gelir
- En altta **GENEL TOPLAM** satırı yer alır
- Gerekçe, açıklama, imza ve fotoğraf bölümleri tekli raporla aynıdır

---

## Kayıtlı Raporlar

**Yapı Bedeli → Kayıtlı Raporlar** listesi kayıtları yeniden eskiye sıralar.

### Liste Sütunları

| Sütun | Açıklama |
|-------|----------|
| ID | Kayıt numarası |
| Tarih | Rapor tarihi |
| **Dönem** | Raporun dayandığı birim fiyat dönemi |
| İlçe / Mahalle / Ada / Parsel | Taşınmaz bilgileri |
| İşlemler | Aksiyon butonları |

**Dönem sütunu** üç şekilde görünebilir:

| Görünüm | Anlamı |
|---------|--------|
| `2026` + Resmi Gazete sayısı | Dönem kesin olarak biliniyor |
| `2024` (sayısız) | Rapor dönemle eşleşmedi, yalnızca hesap yılı biliniyor |
| `Belirsiz` | Ne dönem ne yıl bilgisi var |

> Eski raporlar, uygulama güncellendiğinde Resmi Gazete sayısı veya yıl üzerinden kendi dönemine otomatik bağlanmıştır. Bir yılda birden fazla dönem varsa ve künye kayıtlı değilse dönem `Belirsiz` kalır.

### İşlem Butonları

| Buton | İşlev |
|-------|-------|
| **Düzenle** | Raporu editörde açar |
| **Word İndir** | Raporu açmadan doğrudan `.docx` üretir, `raporlar/` klasörüne kaydeder ve açar |
| **Döneme Kopyala** | Raporu başka bir birim fiyat dönemine uyarlar |
| **Sil** | Raporu siler |

> **Silme geri alınamaz.** Silmeden önce yedek almanız önerilir.

---

## Rapor Editörü

Editör, kaydedilmiş raporu canlı hesaplamayla düzenler. Tekli ve çoklu parsel raporları farklı düzende gösterilir.

### Dönem Şeridi

Başlıkta raporun hangi döneme ait olduğunu gösteren bir şerit bulunur. Bu dönem, otomatik güncellemelerin kaynağıdır.

### Otomatik Güncelleme

| Değiştirdiğiniz alan | Otomatik güncellenen |
|----------------------|----------------------|
| Yapı sınıfı / grubu | Birim fiyat (dönemin fiyat tablosundan) |
| Yapı yaşı veya yapım tekniği | Yıpranma payı (cetvelden) |

Otomatik değişen hücre kısa süre vurgulanır. Değeri elle de yazabilirsiniz; elle girilen değer korunur.

### Düzenlenebilir Alanlar

Yapı satırlarındaki tüm hesap alanları, gerekçe ve açıklama metinleri, imzacı bilgileri ve fotoğraflar düzenlenebilir. Bir alan değiştiğinde satır bedeli, ara toplamlar ve genel toplam anında yeniden hesaplanır.

### Kısayollar

| Kısayol | İşlev |
|---------|-------|
| `Ctrl` + `S` | Kaydet |
| `ESC` | Çıkış (kaydedilmemiş değişiklik varsa uyarır) |

---

## Farklı Döneme Kopyalama

Bir raporu başka bir birim fiyat dönemine göre yeniden değerlemek için kullanılır. **Kaynak rapor değiştirilmez**; sonuç yeni bir rapor olarak kaydedilir.

### Nereden Açılır

- Kayıtlı Raporlar listesinde **Döneme Kopyala** butonu
- Rapor editöründe aynı isimli buton

### Ekran

```
┌──────────────────────────────────────────────────────┐
│  Farklı Döneme Kopyala                          [×]  │
├──────────────────────────────────────────────────────┤
│  Kaynak: Rapor #86 · 2026 yılı · 33157 R.G.          │
│                                                      │
│  Hedef Dönem: [2024 — 32466 sayılı R.G.  ▼]          │
│  [✓] Yapı yaşlarını kaydır (-2)                      │
│                                                      │
│  NO  YAPI          S/G   YAŞ      YIPR.   B.FİYAT    │
│  1   Düğün Salonu  4 B   20→18    %20     33.900→17.400 │
│  ...                                                 │
│                                                      │
│  TOPLAM        48.734.097,80 → 24.734.174,55 TL      │
├──────────────────────────────────────────────────────┤
│                        [Vazgeç]  [Kopyala ve Aç]     │
└──────────────────────────────────────────────────────┘
```

### Ne Yapar

1. **Birim fiyat**: Her yapının sınıf/grubuna karşılık gelen fiyat hedef dönemden çekilir
2. **Yaş kaydırma** (isteğe bağlı): Yapı yaşları iki dönem arasındaki yıl farkı kadar kaydırılır. 2026 raporu 2024'e kopyalanırken 20 yaşındaki yapı 18 olur
3. **Yıpranma payı**: Yeni yaşa göre cetvelden yeniden okunur. Yaş aynı cetvel aralığında kalıyorsa oran değişmez
4. **Bedel**: Formül yeniden uygulanır, toplam güncellenir

Onaylanınca yeni rapor oluşturulur ve editörde açılır.

### Uyarılar

Modal, dönüştürülemeyen kalemler için uyarı listesi gösterir:

| Uyarı | Anlamı | Sonuç |
|-------|--------|-------|
| Fiyat tanımlı değil | Sınıf/grup hedef dönemde yok | Eski fiyat korunur |
| Sınıf/grup eksik | Yapıda bu bilgi boş | Otomatik çekim yapılamaz, eski fiyat korunur |
| Yıpranma bulunamadı | Teknik + yeni yaş cetvelde yok | Mevcut oran korunur |

Uyarı alan satırlar tabloda işaretlenir. Kopyalama yine de yapılabilir; ilgili değerleri editörde elle düzeltmeniz gerekir.

> **Yaş kaydırma ne zaman kapatılmalı?** Yapının gerçek yaşı rapor yılından bağımsızsa (örneğin yapım yılı kesin biliniyorsa ve raporda o yıla göre yazılmışsa) kutuyu işaretlemeden kopyalayın; yaşlar olduğu gibi kalır.

---

## Word Raporu

### Üretme

Word çıktısı üç yerden alınabilir:

1. Form ekranında hesaplama sonrası **Word Raporu Oluştur**
2. Kayıtlı Raporlar listesinde **Word İndir**
3. Editörde **Word Olarak İndir**

Dosya `raporlar/` klasörüne kaydedilir ve otomatik açılır.

### Rapor İçeriği

| Bölüm | Açıklama |
|-------|----------|
| Başlık ve künye | Rapor no, tarih, ilgili kurum, talep yazısı |
| Taşınmaz bilgileri | İl, ilçe, mahalle, ada, parsel, yüzölçümü, malik |
| Yapı tablosu | Yapı bilgileri ve hesap sütunları |
| Toplam bedel | Rakam ve Türkçe yazı ile |
| Gerekçe ve açıklama | Serbest metin bölümleri |
| İmza | Raportör ad ve ünvanları |
| Fotoğraflar | Eklenmişse açıklamalarıyla |

---

## Proje Bedeli Modülü

Mimarlık ve mühendislik hizmet bedellerini dört branş için hesaplar: **mimarlık**, **inşaat (statik)**, **mekanik**, **elektrik**.

### Kullanım

1. **Proje Bedeli → Yeni Hesaplama**
2. Genel bilgiler: iş adı, hesap yılı, yapı sınıfı/grubu, toplam inşaat alanı
3. Birim maliyet sınıf/gruba göre otomatik gelir; yapı yaklaşık maliyeti hesaplanır
4. Her branş sekmesinde hizmet bölümleri seçilir
5. PID oranı, maliyet ve hizmet sınıfına göre otomatik bulunur
6. Branş bedelleri ve genel toplam hesaplanır
7. İmzacı bilgileri girilip rapor kaydedilir

### Hesap Zinciri

```
Toplam Maliyet = İnşaat Alanı × Birim Maliyet
Proje Bedeli   = Toplam Maliyet × PID Oranı
Hizmet Bedeli  = Proje Bedeli × Hizmet Dalı Katsayısı × Seçili Bölüm Oranı
Genel Toplam   = Dört branşın hizmet bedeli toplamı
```

### Kayıtlı Raporlar

**Düzenle**, **Word** ve **Sil** aksiyonları vardır. Editörde alan, birim maliyet, branş bedelleri, hizmet bölümleri ve imzacılar canlı hesaplamayla düzenlenir.

> Sürüm 2.1.0'dan önce kaydedilen proje bedeli raporlarında imzacı bilgisi bulunmaz. Word çıktısında görünmesi için editörden imzacıları doldurup yeniden kaydedin.

---

## Cephe Metrajı

**Hesaplamalar → Cephe Metrajı** ile açılır. Boya ve yalıtım alanlarını cephe cephe hesaplar.

### Adım 1: Ayarlar

Üstteki ayar bölümünde her yüzey tipinin boyaya ve yalıtıma dahil olup olmadığı belirlenir:

| Yüzey | Varsayılan Boya | Varsayılan Yalıtım |
|-------|-----------------|--------------------|
| Cephe ön yüzeyi | ✓ | ✓ |
| Çıkma yüzeyleri | ✓ | ✓ |
| Saçak yüzeyleri (alın + altı) | ✓ | — |
| Kapı/pencere yan yüzeyleri (şafak) | ✓ | — |
| Mermer denizlik (düşülen) | ✓ | — |

### Adım 2: Cepheler

Cephe sayısı belirlenir (varsayılan adlar: Kuzey, Güney, Doğu, Batı). Her cephe kendi sekmesinde düzenlenir.

Cephe için **en** ve **yükseklik** girilir; brüt alan buradan hesaplanır.

### Adım 3: Boşluklar (Kapı / Pencere)

Her boşluk satırı için:

| Alan | Açıklama |
|------|----------|
| Tip | Kapı veya pencere |
| En / Boy | Boşluk ölçüleri (m) |
| Adet | Aynı ölçüdeki boşluk sayısı |
| Gömme Derinliği | Duvar içine gömme miktarı (şafak alanını belirler) |
| Denizlik | Pencerede mermer denizlik var mı |
| Denizlik Derinliği | Denizliğin derinliği (m) |

**Şafak hesabı** boşluk tipine göre değişir:

| Durum | Çevre |
|-------|-------|
| Kapı (altta zemin var) | `2 × boy + en` |
| Pencere + mermer denizlik | `2 × boy + en` |
| Pencere, denizliksiz | `2 × (en + boy)` |

```
Şafak Alanı = Çevre × Gömme Derinliği × Adet
```

### Adım 4: Çıkmalar

Her çıkma için en, derinlik, yükseklik ve adet girilir; hangi yüzeylerin hesaba katılacağı seçilir:

| Yüzey | Alan | Varsayılan |
|-------|------|------------|
| Alt | en × derinlik | ✓ |
| Sol Yan | derinlik × yükseklik | ✓ |
| Sağ Yan | derinlik × yükseklik | ✓ |
| Üst | en × derinlik | — |
| Ön | en × yükseklik | — |

### Adım 5: Saçak

Saçak varsa genişlik (duvardan çıkıntı) ve alın yüksekliği girilir:

```
Saçak Altı = Cephe Eni × Genişlik
Saçak Alın = Cephe Eni × Alın Yüksekliği
```

### Özet

Özet tablosu tüm cephelerin toplamını yüzey bazında gösterir:

```
Cephe Ön Alanı = (En × Yükseklik) - Boşluk Alanları
Toplam Boya    = Cephe Ön + Çıkma + Saçak + Şafak - Mermer Denizlik
Toplam Yalıtım = Ayarlarda yalıtıma dahil edilen yüzeyler
```

Özet, tüm cepheler veya yalnızca seçili cephe için görüntülenebilir.

### Kaydetme

İş adı girilerek metraj kaydedilir. **Hesaplamalar → Kayıtlı Metrajlar** listesinden açılıp düzenlenebilir.

---

## İpuçları

### Hızlı Form Doldurma

- Alanlar arasında `Tab` ile ilerleyin
- Sınıf/grup ve yapım tekniği seçimlerini önce yapın; birim fiyat ve yıpranma payı otomatik dolsun
- Benzer raporlar için mevcut bir raporu döneme kopyalayıp editörde düzenlemek sıfırdan doldurmaktan hızlıdır

### Veri Girişi

- Ondalık ayracı olarak hem virgül hem nokta kabul edilir
- Yüzde alanlarına yalnızca sayı yazın (`%` işareti gerekmez)
- Boş bırakılan sayısal alanlar 0 kabul edilir

### Yıpranma Payı Kontrolü

Otomatik gelen oranı Resmi Gazete cetveliyle karşılaştırın. Yaş aralıkları sınırında (örneğin 15/16 yaş) oran belirgin değişir; yapı yaşının doğru girildiğinden emin olun.

### Yedekleme

Veritabanı tek dosyadır:

```powershell
Copy-Item raporlar.db "yedek/raporlar_$(Get-Date -Format 'yyyyMMdd').db"
```

Uygulama kapalıyken yedek alın. Silinen raporlar geri alınamadığı için düzenli yedekleme önemlidir.

---

## Sık Sorulan Sorular

### Uygulama açılmıyor

1. `npm install` çalıştırdınız mı?
2. SQLite3 native modülü Electron sürümüyle uyumsuz olabilir: `npx electron-rebuild`
3. `Ctrl` + `Shift` + `I` ile DevTools açıp Console'daki hatayı kontrol edin

### Birim fiyat otomatik gelmiyor

- Hesap dönemi seçili mi?
- Yapı sınıfı **ve** grubu birlikte seçili mi? İkisi de gerekir
- Seçilen dönemde o sınıf/grup için fiyat tanımlı mı? Yönetim panelinden kontrol edin

### Yıpranma payı gelmiyor

- Yapım tekniği seçili mi?
- Yapı yaşı girili mi?
- Yaş, cetveldeki aralıkların dışında olabilir (örneğin çok yüksek bir değer)

### Dönem sütununda "Belirsiz" yazıyor

Rapor kaydedilirken dönem bilgisi tutulmamış ve geriye dönük eşleştirme de yapılamamış demektir. Bu genellikle o yılda birden fazla tebliğ olduğunda görülür. Raporu editörde açıp doğru dönemle yeniden kaydedebilirsiniz.

### Kopyalanan raporda fiyat değişmedi

Uyarı listesini kontrol edin. Sınıf/grup bilgisi eksik olan veya hedef dönemde karşılığı bulunmayan yapılarda eski fiyat korunur; bu değerleri editörde elle düzeltmeniz gerekir.

### Word raporu oluşmuyor

- `raporlar/` klasörü yazılabilir durumda mı?
- Aynı adlı dosya Word'de açık olabilir; kapatıp tekrar deneyin
- Çok sayıda yüksek çözünürlüklü fotoğraf işlemi uzatabilir; birkaç saniye bekleyin

### Rapor listesi boş görünüyor

- Uygulamanın doğru `raporlar.db` dosyasını kullandığından emin olun. Portable sürümde veritabanı exe'nin yanındadır; exe'yi taşıdıysanız veritabanını da taşımanız gerekir

### Silinen rapor geri gelmedi

Rapor silme kalıcıdır. Yalnızca yedekten geri yükleme mümkündür.

### Metraj kaydedilmiyor

İş adı alanı boş olamaz. Kaydetmeden önce bir iş adı girin.

---

## İyi Pratikler

### Rapor Numaralandırma

Yıl bazlı sıralı bir düzen (örn. `2026/001`) raporların takibini kolaylaştırır.

### Dönem Seçimi

Raporu hangi tebliğe göre düzenlediğinizi Genel Bilgiler sekmesinde doğru seçin. Bu seçim yalnızca birim fiyatı değil, raporun künyesindeki Resmi Gazete referansını ve sonradan yapılacak dönem kopyalamalarını da belirler.

### Çoklu Parsel mi, Ayrı Raporlar mı?

Aynı talep yazısına dayanan ve birlikte değerlendirilen parseller için çoklu parsel raporu kullanın. Farklı taleplere ait taşınmazları ayrı raporlarda tutmak takibi kolaylaştırır.

### Fotoğraf Boyutu

Fotoğrafları eklemeden önce makul bir çözünürlüğe küçültmek veritabanı boyutunu ve rapor üretim süresini belirgin şekilde azaltır.

---

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
