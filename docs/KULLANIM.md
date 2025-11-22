# Kullanım Kılavuzu

## 📋 İçindekiler

- [Uygulamayı Başlatma](#uygulamayı-başlatma)
- [Ana Arayüz](#ana-arayüz)
- [Rapor Oluşturma](#rapor-oluşturma)
- [Kayıtlı Raporlar](#kayıtlı-raporlar)
- [İpuçları ve Püf Noktaları](#i̇puçları-ve-püf-noktaları)
- [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## 🚀 Uygulamayı Başlatma

### İlk Çalıştırma

1. Proje dizininde terminal/command prompt açın
2. Aşağıdaki komutu çalıştırın:

```bash
npm start
```

3. Uygulama penceresi açılacaktır

### Başlatma Süresi

- **Normal**: 2-3 saniye
- **İlk çalıştırma**: 5-10 saniye (veritabanı oluşturma)

---

## 🖥️ Ana Arayüz

### Pencere Düzeni

```
┌────────────────────────────────────────────┐
│   📊 Kıymet Takdir Raporu                  │  ← Başlık
├────────────────────────────────────────────┤
│ [Genel Bilgiler] [Arsa Bilg.] [Yapı Bilg.]│  ← Tab Menüsü
├────────────────────────────────────────────┤
│                                            │
│        Form Alanları                       │  ← İçerik Alanı
│                                            │
│                                            │
├────────────────────────────────────────────┤
│        [◀ Geri]  [İleri ▶]                │  ← Navigasyon
└────────────────────────────────────────────┘
```

### Tab Sistemi

Uygulama üç tab'dan oluşur:

1. **📋 Genel Bilgiler**: Rapor ve kurum bilgileri
2. **🏘️ Arsa Bilgileri**: Taşınmaz konum bilgileri
3. **🏗️ Yapı Bilgileri**: Yapı detayları ve hesaplamalar

---

## 📝 Rapor Oluşturma

### Adım 1: Genel Bilgiler

#### Doldurulması Gereken Alanlar

| Alan | Tip | Zorunlu | Örnek |
|------|-----|---------|-------|
| Rapor Tarihi | Tarih | ✅ | 26.10.2024 |
| Rapor No | Metin | ✅ | R-2024-001 |
| Resmi Yazı Tarihi | Tarih | ✅ | 20.10.2024 |
| Resmi Yazı Sayısı | Metin | ✅ | E.12345 |
| İlgili Kurum | Metin | ✅ | Samsun Büyükşehir Belediyesi |
| Hesap Yılı | Metin | ✅ | 2024 |
| Resmi Gazete Tarihi | Tarih | ✅ | 15.01.2024 |
| Resmi Gazete Sayısı | Metin | ✅ | 32768 |
| Raportor Adı Soyadı | Metin | ✅ | Mehmet Yılmaz |
| Raportor Ünvanı | Metin | ✅ | İnşaat Mühendisi |

#### İpuçları

💡 **Rapor No**: Kurumunuzun numaralandırma sistemine uygun bir format kullanın.
  - Örnek: `R-2024-001`, `KT/2024/10/001`

💡 **Resmi Gazete**: Yıl başında yayınlanan güncel tebliği kullanın.
  - 2024 yılı için: 15.01.2024 tarih, 32768 sayılı

#### Ekran Görüntüsü İçeriği

```
┌──────────────────────────────────────────┐
│ Genel Bilgiler                           │
├──────────────────────────────────────────┤
│ Rapor Tarihi *     │ Rapor No *          │
│ [2024-10-26]      │ [R-2024-001]        │
├──────────────────────────────────────────┤
│ Resmi Yazı Tarihi* │ Resmi Yazı Sayısı * │
│ [2024-10-20]      │ [E.12345]           │
├──────────────────────────────────────────┤
│ İlgili Kurum *     │ Hesap Yılı *        │
│ [Samsun Büyük...] │ [2024]              │
└──────────────────────────────────────────┘
```

#### Sonraki Adıma Geçiş

✅ Tüm zorunlu alanları doldurduktan sonra sağ alttaki **[İleri ▶]** butonuna tıklayın.

---

### Adım 2: Arsa Bilgileri

#### Doldurulması Gereken Alanlar

| Alan | Tip | Zorunlu | Örnek |
|------|-----|---------|-------|
| İlçe | Seçim | ✅ | Atakum |
| Mahalle | Metin | ✅ | Kurupelit |
| Ada | Metin | ✅ | 123 |
| Parsel | Metin | ✅ | 45 |
| Yüzölçümü (m²) | Sayı | ✅ | 150.50 |
| Malik İsmi | Metin | ✅ | Ahmet Yılmaz |

#### İlçe Seçimi

İlçe dropdown menüsünden Samsun'un 17 ilçesinden birini seçin:

```
Samsun İlçeleri:
├─ Atakum
├─ Canik
├─ İlkadım
├─ Bafra
├─ Tekkeköy
├─ Vezirköprü
├─ Havza
├─ Çarşamba
├─ Terme
├─ Salıpazarı
├─ Kavak
├─ Ladik
├─ 19 Mayıs
├─ Asarcık
├─ Yakakent
├─ Ayvacık
└─ Alacam
```

#### İpuçları

💡 **Ada-Parsel**: Tapu kaydındaki bilgileri doğru girin.

💡 **Yüzölçümü**: Ondalık ayırıcı olarak nokta (.) kullanın.
  - Doğru: `150.50`
  - Yanlış: `150,50`

💡 **Malik**: Tam ad soyad yazın.

---

### Adım 3: Yapı Bilgileri ve Hesaplama

#### Doldurulması Gereken Alanlar

| Alan | Tip | Zorunlu | Örnek |
|------|-----|---------|-------|
| Yapı No | Metin | ✅ | 1 |
| Yapı Adı | Metin | ✅ | Müstakil Ev |
| Yapı Maliki | Metin | ✅ | Ahmet Yılmaz |
| Yapı Yaşı | Sayı | ✅ | 15 |
| Yapı Sınıfı | Seçim | ✅ | 3. Sınıf |
| Yapım Tekniği | Seçim | ✅ | Betonarme Karkas |
| Yapı Alanı (m²) | Sayı | ✅ | 120.50 |
| Birim Fiyat (TL/m²) | Sayı | ✅ | 15000 |
| Eksik İmalat Oranı (%) | Sayı | ✅ | 10 |
| Yıpranma Payı (%) | Sayı | 🔒 Otomatik | 20 |

#### Yapı Sınıfı Seçenekleri

```
1. Sınıf  - Lüks yapılar
2. Sınıf  - Çok iyi kalite
3. Sınıf  - İyi kalite
4. Sınıf  - Orta kalite
5. Sınıf  - Orta-düşük kalite
6. Sınıf  - Düşük kalite
7. Sınıf  - Basit yapılar
```

#### Yapım Tekniği Seçenekleri

```
Betonarme Karkas
Yığma Kagir
Çelik Konstrüksiyon
Ahşap
```

#### Otomatik Hesaplamalar

##### Yıpranma Payı

Yapı yaşı ve yapım tekniği seçildiğinde **otomatik** hesaplanır.

**Betonarme Karkas için:**
- 0-5 yıl: %5
- 6-10 yıl: %10
- 11-20 yıl: %20
- 21-30 yıl: %30
- 31-40 yıl: %40
- 41-50 yıl: %50
- 50+ yıl: %60

**Örnek**: 
- Yapı Yaşı: 15 yıl
- Yapım Tekniği: Betonarme Karkas
- **Yıpranma Payı: %20** (otomatik)

##### Yapı Bedeli Hesaplama

**[🧮 Hesapla]** butonuna tıkladığınızda:

**Formül**:
```
Yapı Bedeli = Yapı Alanı × Birim Fiyat × (1 - Yıpranma Payı/100) × (1 - Eksik İmalat Oranı/100)
```

**Örnek Hesaplama**:
```
Yapı Alanı: 120.50 m²
Birim Fiyat: 15,000 TL/m²
Yıpranma Payı: 20%
Eksik İmalat Oranı: 10%

Hesaplama:
= 120.50 × 15,000 × (1 - 0.20) × (1 - 0.10)
= 120.50 × 15,000 × 0.80 × 0.90
= 1,806,750 × 0.80 × 0.90
= 1,300,860 TL
```

##### Asgari Levazım Bedeli

**Formül**:
```
Levazım Bedeli = Yapı Bedeli × 0.70 × 0.75
```

**Örnek**:
```
Yapı Bedeli: 1,300,860 TL
Levazım Bedeli = 1,300,860 × 0.70 × 0.75
               = 682,951.50 TL
```

#### İşlem Butonları

```
┌──────────────────────────────────────┐
│ [🧮 Hesapla]                         │
│ [💾 Raporu Kaydet]                   │
│ [🗑️ Formu Temizle]                  │
│ [📁 Kayıtlı Raporlar]                │
└──────────────────────────────────────┘
```

##### 🧮 Hesapla
- Yapı bedeli ve levazım bedelini hesaplar
- Sonuçları form alanlarına yazar
- Pop-up ile özet gösterir

##### 💾 Raporu Kaydet
- Formu submit eder
- Veritabanına kaydeder
- Başarı mesajı gösterir
- Formu temizler

##### 🗑️ Formu Temizle
- Tüm form alanlarını sıfırlar
- Onay ister
- Hesaplanan değerleri temizler

##### 📁 Kayıtlı Raporlar
- Yeni pencere açar
- Kayıtlı raporları listeler

---

### Adım 4: Raporu Kaydetme

1. **[💾 Raporu Kaydet]** butonuna tıklayın
2. Validasyon kontrolü yapılır
3. Başarılı ise:
   ```
   ✅ Rapor başarıyla kaydedildi!
   ```
4. Form otomatik temizlenir
5. Yeni rapor girişi yapabilirsiniz

---

## 📊 Kayıtlı Raporlar

### Raporlar Penceresini Açma

Ana formda **[📁 Kayıtlı Raporlar]** butonuna tıklayın.

### Rapor Listesi

```
┌────┬──────────────┬─────────┬──────────┬─────┬────────┬────────────┐
│ ID │ Rapor Tarihi │ İlçe    │ Mahalle  │ Ada │ Parsel │ İşlemler   │
├────┼──────────────┼─────────┼──────────┼─────┼────────┼────────────┤
│ 1  │ 2024-10-26   │ Atakum  │ Kurupelit│ 123 │ 45     │ [S][R][H]  │
│ 2  │ 2024-10-25   │ Canik   │ Kale     │ 456 │ 78     │ [S][R][H]  │
└────┴──────────────┴─────────┴──────────┴─────┴────────┴────────────┘
```

### İşlem Butonları

#### [Sil] - Kırmızı Buton

- Raporu veritabanından siler
- Onay ister
- Geri alınamaz!

**Kullanım**:
```
Tıkla → Onay ver → Silindi
```

#### [Revize Et] - Sarı Buton

⚠️ **Şu anda aktif değil** (Gelecek özellik)

Planlanan işlev:
- Raporu ana forma yükler
- Düzenleme yapılabilir
- Güncelleme kaydedilir

#### [Rapor Oluştur] - Mavi Buton

- Seçili rapor için Word dosyası oluşturur
- `raporlar_cikti/` klasörüne kaydeder
- Dosyayı otomatik açar

**Dosya Adı Formatı**:
```
Rapor_[RaporNo]_[Tarih].docx
```

**Örnek**:
```
Rapor_R-2024-001_20241026.docx
```

---

## 📄 Word Raporu

### Rapor İçeriği

```
╔══════════════════════════════════════╗
║   KIYMET TAKDİR RAPORU               ║
╚══════════════════════════════════════╝

Gerekçe:
Bu rapor, [İlgili Kurum] [Resmi Yazı Tarihi] 
tarih [Resmi Yazı Sayısı] sayılı yazısına 
istinaden hazırlanmıştır.

───────────────────────────────────────
Taşınmaz Bilgileri:
───────────────────────────────────────
┌────┬──────┬──────────┬─────┬────────┐
│ İL │ İLÇE │ MAHALLE  │ ADA │ PARSEL │
├────┼──────┼──────────┼─────┼────────┤
│...│ ... │ ...      │ ... │ ...    │
└────┴──────┴──────────┴─────┴────────┘

───────────────────────────────────────
Yapı Bilgileri:
───────────────────────────────────────
[Detaylı tablo...]

───────────────────────────────────────
Hesaplamalar:
───────────────────────────────────────
TOPLAM YAPI BEDELİ: 1,300,860.00 TL
Yalnız bir milyon üçyüz bin sekizyüz 
altmış Türk Lirasıdır.

TOPLAM ASGARİ LEVAZIM BEDELİ: 682,951.50 TL
Yalnız altıyüz seksen iki bin dokuzyüz 
elli bir Türk Lirasıdır.

───────────────────────────────────────
[Resmi Gazete referansı paragraf]
───────────────────────────────────────

[Rapor Tarihi]

[Raportor Adı]
[Raportor Ünvanı]
```

### Raporu Açma

Rapor oluşturulduktan sonra:
1. Otomatik olarak varsayılan Word uygulamasında açılır
2. Manuel açma: `raporlar_cikti/` klasöründen dosyayı bulun
3. Yazdırın veya PDF olarak kaydedin

---

## 💡 İpuçları ve Püf Noktaları

### Hızlı Form Doldurma

1. **Tab Tuşu**: Alanlar arasında hızlı geçiş
2. **Enter**: Sonraki alana geçiş (bazı alanlarda)
3. **Shift + Tab**: Önceki alana dön

### Veri Girişi

✅ **Doğru Pratikler**:
- Ondalık sayılarda nokta (.) kullanın: `120.50`
- Tarihleri takvimden seçin
- Dropdownları kullanın (yazım hatası olmaz)
- İleri-Geri butonlarıyla adım adım ilerleyin

❌ **Yaygın Hatalar**:
- Virgül kullanmak: `120,50` ❌
- Tarihleri manuel yazmak: `26/10/2024` ❌
- Zorunlu alanları boş bırakmak ❌
- Hesapla butonuna basmadan kaydetmek ⚠️

### Yıpranma Payı Kontrolü

Otomatik hesaplanan yıpranma payını kontrol edin:
- Yapı yaşını doğru girin
- Yapım tekniğini doğru seçin
- Gerekirse manuel düzeltin (sadece gerekli durumlarda)

### Veritabanı Yedekleme

Önemli: Periyodik olarak `raporlar.db` dosyasını yedekleyin!

```bash
# Manuel yedekleme
copy raporlar.db raporlar_backup_20241026.db
```

---

## ❓ Sık Sorulan Sorular

### Uygulama açılmıyor

**Çözüm**:
```bash
# Bağımlılıkları kontrol edin
npm install

# Uygulamayı yeniden başlatın
npm start
```

### Rapor kaydedilmiyor

**Kontrol Listesi**:
- [ ] Tüm zorunlu alanlar dolu mu?
- [ ] Rapor tarihi geçerli mi?
- [ ] Rapor no benzersiz mi?
- [ ] Veritabanı dosyası var mı?

### Word raporu oluşturulmuyor

**Kontrol Listesi**:
- [ ] `raporlar_cikti` klasörü var mı?
- [ ] Klasöre yazma izni var mı?
- [ ] Disk alanı yeterli mi?
- [ ] docx paketi kurulu mu?

### Yıpranma payı yanlış

**Kontrol**:
- Yapı yaşını kontrol edin
- Yapım tekniğini kontrol edin
- Resmi Gazete tablosunu doğrulayın
- Manuel düzeltme yapın (gerekirse)

### Hesaplama yanlış

**Formülü Kontrol Edin**:
```
Yapı Bedeli = 
    Yapı Alanı 
    × Birim Fiyat 
    × (1 - Yıpranma Payı / 100) 
    × (1 - Eksik İmalat Oranı / 100)
```

**Örnek Doğrulama**:
- Excel'de manuel hesaplama yapın
- Sonuçları karşılaştırın

### Raporlar listesi boş görünüyor

**Çözüm**:
1. Ana formdan rapor kaydedin
2. Raporlar penceresini kapatıp yeniden açın
3. Veritabanını kontrol edin:
   ```bash
   sqlite3 raporlar.db "SELECT * FROM raporlar;"
   ```

### Silinen rapor geri gelmedi

⚠️ **Uyarı**: Silme işlemi geri alınamaz!

**Önlem**: Düzenli yedekleme yapın.

### Form temizlenmiyor

**Çözüm**:
1. **[🗑️ Formu Temizle]** butonunu kullanın
2. Sayfa yenilemesi yapmayın (veri kaybolur)
3. Uygulamayı yeniden başlatın (son çare)

---

## 🎯 İyi Pratikler

### Rapor Numaralandırma

Sistematik bir yapı kullanın:
```
Format: [Kod]-[Yıl]-[Sıra]

Örnekler:
R-2024-001
R-2024-002
KT/2024/10/001
```

### Veri Tutarlılığı

- Malik ve Yapı Maliki aynı ise aynı yazımı kullanın
- İlçe adlarını dropdown'dan seçin (yazım hatası olmasın)
- Ada-Parsel bilgilerini tapu kaydından kopyalayın

### Düzenli Yedekleme

**Önerilen Yedekleme Sıklığı**:
- Günlük: 10+ rapor girişi varsa
- Haftalık: Düzenli kullanımda
- Aylık: Minimum

### Rapor Arşivleme

`raporlar_cikti` klasöründeki dosyaları:
- Klasörlere ayırın (yıl, ay, kurum)
- Bulut yedekleme kullanın
- Düzenli temizlik yapın (eski dosyaları arşivleyin)

---

## 📞 Destek

Sorun yaşarsanız:
1. Bu dokümantasyonu kontrol edin
2. [SORUN_GIDERME.md](./KURULUM.md#sorun-giderme) bölümüne bakın
3. Destek ekibiyle iletişime geçin

---

**Kolay Kullanımlar!** 🎉

**Son Güncelleme**: 2024

