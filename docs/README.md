# Kıymet Takdir Raporu (KİTAR) - Genel Bakış

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Electron-brightgreen.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## 📋 İçindekiler

- [Proje Hakkında](#proje-hakkında)
- [Temel Özellikler](#temel-özellikler)
- [Teknoloji Stack](#teknoloji-stack)
- [Hızlı Başlangıç](#hızlı-başlangıç)
- [Ekran Görüntüleri](#ekran-görüntüleri)
- [Dokümantasyon](#dokümantasyon)

---

## 🎯 Proje Hakkında

**KİTAR (Kıymet Takdir Raporu)**, kamu kurumları ve yerel yönetimler için yapı değerleme raporlarının hızlı ve standart bir şekilde oluşturulmasını sağlayan modern bir masaüstü uygulamasıdır.

Uygulama, İnşaat Mühendisleri ve Mimarların Resmi Gazete tebliğlerine göre yapı bedeli ve asgari levazım bedelini hesaplayarak, profesyonel Word formatında rapor çıktısı almasını sağlar.

### 📍 Hedef Kitle

- İnşaat Mühendisleri
- Mimarlar
- Belediyeler ve İl Özel İdareleri
- Kamu Kurumları (Milli Emlak, vb.)
- Ekspertiz Şirketleri

---

## ✨ Temel Özellikler

### 1. 📝 Üç Adımlı Form Sistemi
- **Genel Bilgiler**: Rapor detayları ve kurum bilgileri
- **Arsa Bilgileri**: Taşınmaz konum ve malik bilgileri
- **Yapı Bilgileri**: Yapı özellikleri ve hesaplama parametreleri

### 2. 🧮 Otomatik Hesaplama
- **Yıpranma Payı**: Resmi Gazete cetvellerine göre otomatik hesaplama
- **Yapı Bedeli**: Birim fiyat × Alan × Katsayılar
- **Asgari Levazım Bedeli**: %70 × %75 formülü
- **Yazıya Çevirme**: Bedellerin Türkçe yazı karşılığı

### 3. 💾 Veritabanı Yönetimi
- SQLite tabanlı veri saklama
- Tüm raporların kaydedilmesi
- Kayıtlı raporları görüntüleme ve yönetme
- Rapor silme ve revize etme özellikleri

### 4. 📄 Rapor Oluşturma
- Profesyonel Word (.docx) formatında rapor
- Standart rapor şablonu
- Tablolu veri sunumu
- Resmi Gazete referansları

### 5. 🎨 Modern Kullanıcı Arayüzü
- Gradient renkler ve modern tasarım
- Responsive form yapısı
- Tab navigasyonu ile kolay gezinme
- Form validasyonu

---

## 🛠️ Teknoloji Stack

### Frontend
- **HTML5 / CSS3**: Modern web standartları
- **Vanilla JavaScript**: Framework bağımlılığı yok
- **Gradient UI**: Modern görsel tasarım

### Backend
- **Electron**: Masaüstü uygulama framework'ü
- **Node.js**: Runtime environment
- **SQLite3**: Hafif veritabanı sistemi

### Döküman İşleme
- **docx**: Word dökümanı oluşturma
- **docxtemplater**: Şablon doldurma (hazırda)
- **pizzip**: ZIP işlemleri
- **mammoth**: HTML dönüşüm

### Yardımcı Kütüphaneler
- **@electron/remote**: IPC iletişim
- **lodash**: Utility fonksiyonları
- **angular-expressions**: İfade değerlendirme

---

## 🚀 Hızlı Başlangıç

### Gereksinimler
```
Node.js v14+ 
npm veya yarn paket yöneticisi
```

### Kurulum

```bash
# Depoyu klonlayın
git clone [repo-url]

# Proje dizinine gidin
cd kitar

# Bağımlılıkları yükleyin
npm install

# Uygulamayı çalıştırın
npm start
```

### İlk Kullanım

1. Uygulama açıldığında form ekranı gelir
2. **Genel Bilgiler** sekmesinden başlayarak bilgileri doldurun
3. **İleri** butonuyla diğer sekmelere geçin
4. **Yapı Bilgileri** sekmesinde **Hesapla** butonuna basın
5. **Raporu Kaydet** ile veritabanına kaydedin
6. **Kayıtlı Raporlar** ile raporları görüntüleyin
7. **Rapor Oluştur** ile Word dosyası alın

---

## 📸 Ekran Görüntüleri

> **Not**: Ekran görüntüleri proje dizininde mevcuttur (Screenshot_1.jpg)

---

## 📚 Dokümantasyon

Detaylı dokümantasyon için aşağıdaki dosyaları inceleyebilirsiniz:

| Döküman | Açıklama |
|---------|----------|
| [KURULUM.md](./KURULUM.md) | Kurulum ve yapılandırma rehberi |
| [MIMARI.md](./MIMARI.md) | Uygulama mimarisi ve yapısı |
| [VERITABANI.md](./VERITABANI.md) | Veritabanı şeması ve yapısı |
| [MODULLER.md](./MODULLER.md) | Modüller ve fonksiyon referansları |
| [KULLANIM.md](./KULLANIM.md) | Detaylı kullanım kılavuzu |
| [GELISTIRICI.md](./GELISTIRICI.md) | Geliştirici rehberi |

---

## 📊 Proje İstatistikleri

- **Toplam Dosya**: 15+ dosya
- **Kod Satırı**: ~2000+ satır
- **Bağımlılık**: 9 npm paketi
- **Platform**: Windows, macOS, Linux

---

## 🔐 Lisans

Bu proje özel mülkiyettedir. Tüm hakları saklıdır.

---

## 👥 Katkıda Bulunanlar

- **Geliştirici**: [İsim]
- **Versiyon**: 1.0.0
- **Son Güncelleme**: 2024

---

## 📞 İletişim

Sorularınız için lütfen iletişime geçin.

---

## 🎯 Gelecek Planları

- [ ] Rapor revize etme özelliği
- [ ] Excel çıktısı desteği
- [ ] Toplu rapor oluşturma
- [ ] Harita entegrasyonu (Leaflet)
- [ ] Şablon yönetimi
- [ ] Yedekleme sistemi
- [ ] Kullanıcı ayarları

---

**Kıymet Takdir Raporu (KİTAR)** © 2024

