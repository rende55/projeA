# KİTAR Dokümantasyon İndeksi

## 📚 Hoş Geldiniz!

Kıymet Takdir Raporu (KİTAR) uygulamasının kapsamlı dokümantasyonuna hoş geldiniz. Bu rehberler, uygulamayı anlamanıza, kullanmanıza ve geliştirmenize yardımcı olacaktır.

---

## 📖 Dokümantasyon Haritası

### 🎯 Hızlı Başlangıç

Uygulamayı ilk kez kullanıyorsanız şu sırayla okuyun:

```
1. README.md          → Genel bakış
2. KURULUM.md         → Kurulum
3. KULLANIM.md        → Kullanım rehberi
```

### 👨‍💻 Geliştiriciler İçin

Kod geliştirme yapacaksanız:

```
1. MIMARI.md          → Sistem mimarisi
2. VERITABANI.md      → Veritabanı yapısı
3. MODULLER.md        → Kod referansı
4. GELISTIRICI.md     → Geliştirme rehberi
```

---

## 📋 Dokümantasyon Listesi

### [README.md](./README.md) - Genel Bakış
**İçerik**:
- 📌 Proje hakkında
- ✨ Temel özellikler
- 🛠️ Teknoloji stack
- 🚀 Hızlı başlangıç
- 📊 Proje istatistikleri

**Hedef Kitle**: Herkes

**Tahmini Okuma Süresi**: 5-10 dakika

---

### [KURULUM.md](./KURULUM.md) - Kurulum Rehberi
**İçerik**:
- 💻 Sistem gereksinimleri
- 🚀 Kurulum adımları
- ⚙️ Yapılandırma
- 🐛 Sorun giderme
- 🔄 Güncelleme

**Hedef Kitle**: Son kullanıcılar, sistem yöneticileri

**Tahmini Okuma Süresi**: 15-20 dakika

**Önemli Bölümler**:
- Node.js kurulumu
- Bağımlılık yönetimi
- SQLite3 native modül problemi çözümü

---

### [MIMARI.md](./MIMARI.md) - Uygulama Mimarisi
**İçerik**:
- 🏗️ Mimari genel bakış
- 📚 Katmanlı mimari (3-tier)
- 📁 Dosya yapısı
- 🔄 Veri akışı
- 🛠️ Teknoloji detayları
- 🎨 Design patterns

**Hedef Kitle**: Geliştiriciler, sistem mimarları

**Tahmini Okuma Süresi**: 20-30 dakika

**Öne Çıkan Konular**:
- Electron process modeli
- IPC iletişimi
- Katmanlar arası veri akışı

---

### [VERITABANI.md](./VERITABANI.md) - Veritabanı Yapısı
**İçerik**:
- 🗄️ Veritabanı genel bakış
- 📊 Tablo şeması
- 🔤 Veri tipleri
- 🔧 CRUD işlemleri
- 🔍 SQL sorguları
- 🛡️ Veri bütünlüğü
- 💾 Yedekleme stratejileri

**Hedef Kitle**: Geliştiriciler, veritabanı yöneticileri

**Tahmini Okuma Süresi**: 25-35 dakika

**Kritik Bilgiler**:
- 29 sütunlu raporlar tablosu
- SQLite seçim nedenleri
- Optimizasyon teknikleri

---

### [MODULLER.md](./MODULLER.md) - Modül ve Fonksiyon Referansı
**İçerik**:
- 📦 Modül listesi
- 🚀 main.js (Electron ana süreç)
- 🖥️ renderer.js (Form mantığı)
- 📋 raporlar.js (Rapor yönetimi)
- 📄 reportGenerator.js (Rapor oluşturma)
- 🛠️ Yardımcı fonksiyonlar

**Hedef Kitle**: Geliştiriciler

**Tahmini Okuma Süresi**: 30-40 dakika

**Detaylar**:
- Her fonksiyonun parametreleri
- Dönüş değerleri
- Kullanım örnekleri
- Kod snippets

---

### [KULLANIM.md](./KULLANIM.md) - Kullanım Kılavuzu
**İçerik**:
- 🚀 Uygulamayı başlatma
- 🖥️ Ana arayüz
- 📝 Rapor oluşturma (adım adım)
- 📊 Kayıtlı raporları yönetme
- 💡 İpuçları ve püf noktaları
- ❓ Sık sorulan sorular

**Hedef Kitle**: Son kullanıcılar

**Tahmini Okuma Süresi**: 35-45 dakika

**Pratik Bilgiler**:
- Ekran görüntüleri (metin tabanlı)
- Hesaplama formülleri
- İyi pratikler
- Hata senaryoları

---

### [GELISTIRICI.md](./GELISTIRICI.md) - Geliştirici Rehberi
**İçerik**:
- 💻 Geliştirme ortamı kurulumu
- 📝 Kod standartları
- 🚀 Yeni özellik ekleme
- 🐛 Debugging teknikleri
- 🧪 Testing stratejileri
- 📦 Build ve deployment
- 🤝 Katkıda bulunma rehberi

**Hedef Kitle**: Geliştiriciler, katkıda bulunanlar

**Tahmini Okuma Süresi**: 40-50 dakika

**İleri Seviye Konular**:
- VS Code yapılandırması
- Git workflow
- Electron builder
- Performance optimization

---

## 🗺️ Kullanım Senaryolarına Göre Rehber

### Senaryo 1: İlk Kez Kullanıcı

**Amacınız**: Uygulamayı çalıştırmak ve ilk raporumu oluşturmak

**Okuma Sırası**:
1. ✅ [README.md](./README.md) - Uygulamanın ne yaptığını anlayın
2. ✅ [KURULUM.md](./KURULUM.md) - Uygulamayı kurun
3. ✅ [KULLANIM.md](./KULLANIM.md) - İlk raporu oluşturun

**Toplam Süre**: ~1 saat

---

### Senaryo 2: Sistem Yöneticisi

**Amacınız**: Uygulamayı kurumda yaygınlaştırmak

**Okuma Sırası**:
1. ✅ [README.md](./README.md) - Özellikleri değerlendirin
2. ✅ [KURULUM.md](./KURULUM.md) - Kurulum gereksinimlerini inceleyin
3. ✅ [MIMARI.md](./MIMARI.md) - Sistem altyapısını anlayın
4. ✅ [VERITABANI.md](./VERITABANI.md) - Veri yönetimini planlayın

**Toplam Süre**: ~1.5 saat

---

### Senaryo 3: Yeni Geliştirici

**Amacınız**: Kodda değişiklik yapmak

**Okuma Sırası**:
1. ✅ [README.md](./README.md) - Projeyi tanıyın
2. ✅ [KURULUM.md](./KURULUM.md) - Dev ortamını kurun
3. ✅ [MIMARI.md](./MIMARI.md) - Mimariyi öğrenin
4. ✅ [MODULLER.md](./MODULLER.md) - Kod yapısını inceleyin
5. ✅ [VERITABANI.md](./VERITABANI.md) - Veritabanını anlayın
6. ✅ [GELISTIRICI.md](./GELISTIRICI.md) - Geliştirme sürecini öğrenin

**Toplam Süre**: ~3 saat

---

### Senaryo 4: Kod İncelemesi (Code Review)

**Amacınız**: Pull request değerlendirmek

**Okuma Sırası**:
1. ✅ [MIMARI.md](./MIMARI.md) - Mimari standartları
2. ✅ [MODULLER.md](./MODULLER.md) - Fonksiyon referansları
3. ✅ [GELISTIRICI.md](./GELISTIRICI.md) - Kod standartları, review checklist

**Toplam Süre**: ~45 dakika

---

## 🔍 Hızlı Arama

### Konu Bazlı İndeks

#### Kurulum ve Çalıştırma
- Node.js kurulumu → [KURULUM.md](./KURULUM.md#nodejs-kurulumu)
- npm install sorunları → [KURULUM.md](./KURULUM.md#sorun-giderme)
- Uygulamayı başlatma → [KULLANIM.md](./KULLANIM.md#uygulamayı-başlatma)

#### Kullanıcı Rehberi
- Form doldurma → [KULLANIM.md](./KULLANIM.md#rapor-oluşturma)
- Hesaplama formülleri → [KULLANIM.md](./KULLANIM.md#otomatik-hesaplamalar)
- Rapor oluşturma → [KULLANIM.md](./KULLANIM.md#kayıtlı-raporlar)

#### Teknik Bilgiler
- Mimari yapı → [MIMARI.md](./MIMARI.md#mimari-genel-bakış)
- Veritabanı şeması → [VERITABANI.md](./VERITABANI.md#tablo-şeması)
- Electron IPC → [MIMARI.md](./MIMARI.md#veri-akışı)

#### Geliştirme
- Yeni özellik → [GELISTIRICI.md](./GELISTIRICI.md#yeni-özellik-ekleme)
- Debugging → [GELISTIRICI.md](./GELISTIRICI.md#debugging)
- Build oluşturma → [GELISTIRICI.md](./GELISTIRICI.md#build-ve-deployment)

#### Fonksiyon Referansları
- sayiyiYaziyaCevir() → [MODULLER.md](./MODULLER.md#sayiyiyaziyacevirsakyi)
- hesaplaYipranmaPay() → [MODULLER.md](./MODULLER.md#hesaplayipranmapayyapimteknigi-yapiyasi)
- generateReport() → [MODULLER.md](./MODULLER.md#generatereportrapordata-outputpath)

---

## 📊 Dokümantasyon İstatistikleri

```
Toplam Dosya Sayısı: 7
Toplam Sayfa: ~100 (A4 sayfa karşılığı)
Toplam Kelime: ~25,000 kelime
Kod Örneği: 100+ snippet
Diyagram: 10+ metin tabanlı diyagram

Kapsanan Konular:
├─ Kurulum ve Yapılandırma: ✅
├─ Kullanım Rehberi: ✅
├─ Mimari Dokümantasyon: ✅
├─ API Referansı: ✅
├─ Veritabanı Şeması: ✅
├─ Geliştirici Rehberi: ✅
└─ Troubleshooting: ✅
```

---

## 🎓 Öğrenme Yolları

### Başlangıç Seviyesi
**Hedef**: Uygulamayı kullanmak

```
1. README.md (Genel Bakış)
   ↓
2. KURULUM.md (İlk 2 bölüm)
   ↓
3. KULLANIM.md (Rapor Oluşturma)
   ↓
✅ İlk raporu oluşturabilirsiniz!
```

### Orta Seviye
**Hedef**: Uygulamayı anlamak

```
1. Başlangıç Seviyesi
   ↓
2. MIMARI.md (Genel Bakış)
   ↓
3. VERITABANI.md (Tablo Şeması)
   ↓
4. MODULLER.md (Ana Fonksiyonlar)
   ↓
✅ Uygulamanın nasıl çalıştığını anlarsınız!
```

### İleri Seviye
**Hedef**: Geliştirme yapmak

```
1. Orta Seviye
   ↓
2. GELISTIRICI.md (Tümü)
   ↓
3. MODULLER.md (Detaylı)
   ↓
4. Kod inceleme (GitHub)
   ↓
✅ Katkıda bulunabilirsiniz!
```

---

## 💡 Dokümantasyon İpuçları

### Verimli Okuma

1. **📑 İçindekiler kullanın**: Her dokümanda detaylı içindekiler var
2. **🔍 Ctrl+F ile arayın**: Anahtar kelime araması yapın
3. **🔗 Çapraz referansları takip edin**: Linkler arası geçiş yapın
4. **💾 Yer imi ekleyin**: Sık başvurduğunuz bölümleri işaretleyin

### Pratik Yapma

1. **🧪 Örnekleri deneyin**: Kod örneklerini kopyalayıp çalıştırın
2. **✏️ Not alın**: Kendi kullanım senaryolarınızı ekleyin
3. **🎯 Adım adım ilerleyin**: Aceleniz yoksa her bölümü sırayla okuyun

---

## 🔄 Dokümantasyon Güncellemeleri

### Son Güncelleme: 2024-10-26

**Değişiklikler**:
- ✨ İlk dokümantasyon seti oluşturuldu
- 📝 7 kapsamlı rehber hazırlandı
- 🎯 Kullanıcı senaryolarına göre organize edildi

### Gelecek Güncellemeler

Planlanıyor:
- [ ] Video tutoriallar
- [ ] API dokümantasyonu (Swagger/OpenAPI)
- [ ] Troubleshooting veritabanı
- [ ] Community contributions guide

---

## 📞 Yardım ve Destek

### Dokümantasyon Hakkında

Dokümantasyonda:
- ❓ Eksiklik bulduysanız
- 🐛 Hata tespit ettiyseniz
- 💡 İyileştirme öneriniz varsa

**İletişim**: Destek ekibiyle iletişime geçin

### Katkıda Bulunma

Dokümantasyonu geliştirmek için:
1. [GELISTIRICI.md](./GELISTIRICI.md) → Katkıda Bulunma bölümünü okuyun
2. Pull request açın
3. Review bekleyin

---

## 🎯 Başlangıç Kontrol Listesi

Uygulamayı kullanmaya başlamadan önce:

- [ ] Node.js kurulu mu? (`node --version`)
- [ ] npm kurulu mu? (`npm --version`)
- [ ] Proje dizinine gidildi mi?
- [ ] `npm install` çalıştırıldı mı?
- [ ] `npm start` ile uygulama açıldı mı?
- [ ] Veritabanı oluşturuldu mu? (`raporlar.db`)
- [ ] İlk form dolduruldu mu?
- [ ] İlk rapor kaydedildi mi?
- [ ] Word raporu oluşturuldu mu?

Tüm maddeler tamamsa, hazırsınız! 🎉

---

## 📚 Ek Kaynaklar

### Harici Dokümantasyon

- [Electron Docs](https://www.electronjs.org/docs)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [docx Library](https://docx.js.org/)
- [Node.js Documentation](https://nodejs.org/docs/)

### İlgili Standartlar

- Resmi Gazete - Yıpranma Payı Cetveli (02.12.1982, Sayı: 17.886)
- Mimarlık ve Mühendislik Hizmet Bedelleri Tebliği
- 2015/1 Sayılı Milli Emlak Genelgesi

---

**İyi Okumalar!** 📖

**KİTAR Dokümantasyon Ekibi**

*Son Güncelleme: 26 Ekim 2024*

