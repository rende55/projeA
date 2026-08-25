# Proje A - Dokümantasyon İndeksi

## Hoş Geldiniz

**Proje A** dokümantasyonuna hoş geldiniz. Bu rehberler uygulamayı anlamanıza, kullanmanıza ve geliştirmenize yardımcı olur.

---

## Dokümantasyon Haritası

### Hızlı Başlangıç

Uygulamayı ilk kez kullanıyorsanız şu sırayla okuyun:

```
1. README.md          → Genel bakış ve modüller
2. KURULUM.md         → Kurulum
3. KULLANIM.md        → Kullanım rehberi
```

### Geliştiriciler İçin

Kod geliştirme yapacaksanız:

```
1. MIMARI.md          → Sistem mimarisi ve SPA navigasyon
2. VERITABANI.md      → Veritabanı yapısı
3. MODULLER.md        → Kod ve fonksiyon referansı
4. GELISTIRICI.md     → Geliştirme rehberi
```

Yeni modül eklemek için proje kökündeki [PROJE_YAPISI.md](../PROJE_YAPISI.md) dosyasındaki adım adım rehbere bakın.

---

## Dokümantasyon Listesi

### [README.md](./README.md) - Genel Bakış
**İçerik**: Proje hakkında, modüller, temel özellikler, teknoloji stack, hızlı başlangıç

**Hedef Kitle**: Herkes | **Okuma Süresi**: 5-10 dakika

---

### [KURULUM.md](./KURULUM.md) - Kurulum Rehberi
**İçerik**: Sistem gereksinimleri, kurulum adımları, yapılandırma, sorun giderme, güncelleme

**Hedef Kitle**: Son kullanıcılar, sistem yöneticileri | **Okuma Süresi**: 15-20 dakika

**Önemli Bölümler**: Node.js kurulumu, bağımlılık yönetimi, SQLite3 native modül problemi

---

### [KULLANIM.md](./KULLANIM.md) - Kullanım Kılavuzu
**İçerik**: Dashboard ve modül hub'ları, rapor oluşturma (adım adım), çoklu parsel raporu, rapor editörü, cephe metrajı, kayıtlı kayıtları yönetme, SSS

**Hedef Kitle**: Son kullanıcılar | **Okuma Süresi**: 35-45 dakika

---

### [BIRIM_FIYAT_YONETIMI.md](./BIRIM_FIYAT_YONETIMI.md) - Birim Fiyat Otomasyonu
**İçerik**: Birim fiyat dönemleri, yıl/dönem kavramı, Resmi Gazete kayıtları, sınıf/grup bazlı fiyat girişi

**Hedef Kitle**: Yöneticiler, veri sorumluları | **Okuma Süresi**: 15-20 dakika

---

### [ADMIN_PANEL_REHBERI.md](./ADMIN_PANEL_REHBERI.md) - Yönetici Paneli
**İçerik**: Dönemler, raportörler, kurumlar, PID oranları ve il/ilçe yönetimi; CRUD işlemleri

**Hedef Kitle**: Yöneticiler | **Okuma Süresi**: 20-25 dakika

---

### [MIMARI.md](./MIMARI.md) - Uygulama Mimarisi
**İçerik**: Mimari genel bakış, katmanlı yapı, SPA navigasyon sistemi, dosya yapısı, veri akışı, design patterns

**Hedef Kitle**: Geliştiriciler, sistem mimarları | **Okuma Süresi**: 20-30 dakika

**Öne Çıkan Konular**: Electron process modeli, NavigationManager, IPC iletişimi, saf hesap katmanları

---

### [VERITABANI.md](./VERITABANI.md) - Veritabanı Yapısı
**İçerik**: Veritabanı genel bakış, 12 tablonun şeması, veri tipleri, CRUD işlemleri, migration sistemi, yedekleme

**Hedef Kitle**: Geliştiriciler, veritabanı yöneticileri | **Okuma Süresi**: 25-35 dakika

**Kritik Bilgiler**: `raporlar` tablosu ve JSON sütunları (`yapilarJSON`, `parsellerJSON`), `birimFiyatId` ilişkisi, migration davranışı

---

### [MODULLER.md](./MODULLER.md) - Modül ve Fonksiyon Referansı
**İçerik**: Modül listesi, `main.js` (ana süreç), sayfa script'leri, saf hesap katmanları (`donem-servisi.js`, `metraj-hesap.js`), rapor üreticileri

**Hedef Kitle**: Geliştiriciler | **Okuma Süresi**: 30-40 dakika

**Detaylar**: Fonksiyon parametreleri, dönüş değerleri, kullanım örnekleri

---

### [GELISTIRICI.md](./GELISTIRICI.md) - Geliştirici Rehberi
**İçerik**: Geliştirme ortamı, kod standartları, yeni özellik ekleme, debugging, build ve deployment

**Hedef Kitle**: Geliştiriciler | **Okuma Süresi**: 40-50 dakika

**İleri Seviye**: Obfuscation'lı build, portable exe, DB yolu çözümleme (`db-helper.js`)

---

## Kullanım Senaryolarına Göre Rehber

### Senaryo 1: İlk Kez Kullanıcı

**Amaç**: Uygulamayı çalıştırmak ve ilk raporu oluşturmak

1. [README.md](./README.md) - Modülleri tanıyın
2. [KURULUM.md](./KURULUM.md) - Uygulamayı kurun
3. [KULLANIM.md](./KULLANIM.md) - İlk raporu oluşturun

**Toplam Süre**: ~1 saat

---

### Senaryo 2: Yönetici / Veri Sorumlusu

**Amaç**: Birim fiyatları ve tanımları güncel tutmak

1. [ADMIN_PANEL_REHBERI.md](./ADMIN_PANEL_REHBERI.md) - Panel işlemleri
2. [BIRIM_FIYAT_YONETIMI.md](./BIRIM_FIYAT_YONETIMI.md) - Yeni dönem girişi
3. [VERITABANI.md](./VERITABANI.md) - Yedekleme stratejisi

**Toplam Süre**: ~1 saat

---

### Senaryo 3: Yeni Geliştirici

**Amaç**: Kodda değişiklik yapmak

1. [README.md](./README.md) - Projeyi tanıyın
2. [KURULUM.md](./KURULUM.md) - Dev ortamını kurun
3. [MIMARI.md](./MIMARI.md) - SPA navigasyonu ve katmanları öğrenin
4. [MODULLER.md](./MODULLER.md) - Kod yapısını inceleyin
5. [VERITABANI.md](./VERITABANI.md) - Şemayı ve migration'ları anlayın
6. [GELISTIRICI.md](./GELISTIRICI.md) - Geliştirme sürecini öğrenin

**Toplam Süre**: ~3 saat

---

### Senaryo 4: Yeni Modül Ekleme

**Amaç**: Uygulamaya yeni bir modül eklemek

1. [MIMARI.md](./MIMARI.md) - NavigationManager'ı anlayın
2. [PROJE_YAPISI.md](../PROJE_YAPISI.md) - "Yeni Modül Ekleme Rehberi" bölümünü izleyin
3. [MODULLER.md](./MODULLER.md) - Mevcut modüllerin yapısını örnek alın
4. [GELISTIRICI.md](./GELISTIRICI.md) - Build listesine eklemeyi unutmayın

**Toplam Süre**: ~1.5 saat

---

## Hızlı Arama

### Konu Bazlı İndeks

#### Kurulum ve Çalıştırma
- Node.js kurulumu → [KURULUM.md](./KURULUM.md)
- npm install sorunları → [KURULUM.md](./KURULUM.md)
- SQLite3 rebuild → [KURULUM.md](./KURULUM.md)

#### Kullanıcı Rehberi
- Modül hub sayfaları → [KULLANIM.md](./KULLANIM.md)
- Çoklu parsel raporu → [KULLANIM.md](./KULLANIM.md)
- Rapor editörü → [KULLANIM.md](./KULLANIM.md)
- Farklı döneme kopyalama → [KULLANIM.md](./KULLANIM.md)
- Cephe metrajı → [KULLANIM.md](./KULLANIM.md)

#### Yönetim
- Yeni birim fiyat dönemi → [BIRIM_FIYAT_YONETIMI.md](./BIRIM_FIYAT_YONETIMI.md)
- Raportör / kurum tanımları → [ADMIN_PANEL_REHBERI.md](./ADMIN_PANEL_REHBERI.md)
- İl / ilçe yönetimi → [ADMIN_PANEL_REHBERI.md](./ADMIN_PANEL_REHBERI.md)

#### Teknik Bilgiler
- SPA navigasyon → [MIMARI.md](./MIMARI.md)
- Veritabanı şeması → [VERITABANI.md](./VERITABANI.md)
- Migration sistemi → [VERITABANI.md](./VERITABANI.md)
- Electron IPC → [MIMARI.md](./MIMARI.md)

#### Geliştirme
- Yeni sayfa (route) ekleme → [MIMARI.md](./MIMARI.md)
- Yeni modül ekleme → [PROJE_YAPISI.md](../PROJE_YAPISI.md)
- Debugging → [GELISTIRICI.md](./GELISTIRICI.md)
- Build oluşturma → [GELISTIRICI.md](./GELISTIRICI.md)

---

## Dokümantasyon İstatistikleri

```
Toplam Rehber: 9 (+ INDEX)
Kapsanan Modül: 3 aktif, 1 planlı
Veritabanı Tablosu: 12
SPA Route: 13

Kapsanan Konular:
├─ Kurulum ve Yapılandırma
├─ Kullanım Rehberi
├─ Yönetim Paneli ve Birim Fiyatlar
├─ Mimari Dokümantasyon
├─ Veritabanı Şeması
├─ Fonksiyon Referansı
└─ Geliştirici Rehberi
```

---

## Başlangıç Kontrol Listesi

Uygulamayı kullanmaya başlamadan önce:

- [ ] Node.js kurulu mu? (`node --version`)
- [ ] npm kurulu mu? (`npm --version`)
- [ ] Proje dizinine gidildi mi?
- [ ] `npm install` çalıştırıldı mı?
- [ ] `npm start` ile uygulama açıldı mı?
- [ ] Veritabanı oluşturuldu mu? (`raporlar.db`)
- [ ] Yönetim panelinde güncel birim fiyat dönemi tanımlı mı?
- [ ] İlk rapor kaydedildi mi?
- [ ] Word raporu oluşturuldu mu?

Tüm maddeler tamamsa hazırsınız.

---

## Dokümantasyon Güncellemeleri

### Son Güncelleme: 25.08.2026 (v2.2.0)

**Değişiklikler**:
- Tüm rehberler modüler yapıya (Proje A) göre elden geçirildi; KİTAR dönemine ait tekil form anlatımı güncellendi
- Hesaplamalar modülü (Cephe Metrajı) dokümantasyona eklendi
- Farklı döneme kopyalama, modül hub sayfaları ve çoklu parsel raporu işlendi
- Veritabanı bölümü 12 tabloya göre güncellendi

### Gelecek Güncellemeler

- [ ] Mevzuat modülü dokümantasyonu (modül geliştirildiğinde)
- [ ] Ekran görüntülü kullanım rehberi
- [ ] Yedekleme ve geri yükleme prosedürü

---

## Ek Kaynaklar

### Harici Dokümantasyon

- [Electron Docs](https://www.electronjs.org/docs)
- [SQLite Tutorial](https://www.sqlitetutorial.net/)
- [docx Library](https://docx.js.org/)
- [Node.js Documentation](https://nodejs.org/docs/)

### İlgili Standartlar

- Resmi Gazete - Yıpranma Payı Cetveli (02.12.1982, Sayı: 17.886)
- Mimarlık ve Mühendislik Hizmet Bedelleri Tebliği
- 2015/1 Sayılı Milli Emlak Genelgesi
- Yapı Yaklaşık Birim Maliyetleri Tebliği (yıllık, Resmi Gazete)

---

**İyi Okumalar!**

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
