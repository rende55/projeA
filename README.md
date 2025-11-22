# 🚀 Proje A - Proje Geliştirme Platformu

> Modüler yapıda proje geliştirme ve yönetim platformu

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![Electron](https://img.shields.io/badge/electron-34.0.1-brightgreen.svg)](https://electronjs.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)

---

## 🎯 Proje Hakkında

**Proje A**, kamu kurumları ve yerel yönetimler için modüler yapıda geliştirilmiş profesyonel bir proje geliştirme platformudur. Her modül bağımsız çalışabilir ve kolayca genişletilebilir.

### 📦 Modüller

#### 1. 🏗️ Yapı Bedeli Modülü (Aktif)
Yapı değerleme raporlarının Resmi Gazete tebliğlerine uygun şekilde oluşturulması
- 📝 3 Adımlı form sistemi
- 🧮 Otomatik hesaplama (yıpranma payı, yapı bedeli, levazım bedeli)
- 💰 Akıllı birim fiyat yönetimi
- 📄 Word rapor çıktısı
- 💾 SQLite veritabanı

#### 2. 💼 Proje Bedeli Modülü (Planlı)
Türkiye mevzuatına göre proje bedeli hesaplama

#### 3. 📚 Mevzuat Modülü (Planlı)
Cari mevzuat yönetimi ve görüntüleme

#### 4. 🧮 Hesaplama Modülü (Planlı)
Gelişmiş hesap makinesi

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js v14 veya üzeri
- npm v6 veya üzeri

### Kurulum

```bash
# Bağımlılıkları yükleyin
npm install

# Uygulamayı çalıştırın
npm start
```

### İlk Kullanım

1. Uygulama açıldığında **Genel Bilgiler** sekmesinden başlayın
2. Tüm zorunlu alanları doldurun
3. **İleri** butonuyla diğer sekmelere geçin
4. **Yapı Bilgileri** sekmesinde **Hesapla** butonuna basın
5. **Raporu Kaydet** ile veritabanına kaydedin
6. **Kayıtlı Raporlar** ile Word raporu oluşturun

---

## 📚 Dokümantasyon

Detaylı dokümantasyon için `docs/` klasörüne bakın:

| Dokümantasyon | Açıklama |
|---------------|----------|
| **[docs/INDEX.md](docs/INDEX.md)** | 📑 Dokümantasyon rehberi ve indeks |
| **[docs/README.md](docs/README.md)** | 📖 Genel bakış ve özellikler |
| **[docs/KURULUM.md](docs/KURULUM.md)** | ⚙️ Kurulum ve yapılandırma |
| **[docs/KULLANIM.md](docs/KULLANIM.md)** | 📝 Kullanıcı kılavuzu |
| **[docs/BIRIM_FIYAT_YONETIMI.md](docs/BIRIM_FIYAT_YONETIMI.md)** | 💰 Birim fiyat otomasyonu rehberi |
| **[docs/MIMARI.md](docs/MIMARI.md)** | 🏗️ Uygulama mimarisi |
| **[docs/VERITABANI.md](docs/VERITABANI.md)** | 🗄️ Veritabanı yapısı |
| **[docs/MODULLER.md](docs/MODULLER.md)** | 📦 Modül ve fonksiyon referansları |
| **[docs/GELISTIRICI.md](docs/GELISTIRICI.md)** | 👨‍💻 Geliştirici rehberi |

> **💡 İpucu**: Dokümantasyonu keşfetmeye [docs/INDEX.md](docs/INDEX.md) dosyasından başlayın!

---

## 🛠️ Teknoloji Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- Modern gradient UI
- Responsive design

### Backend
- Electron 34.0.1
- Node.js
- SQLite3 5.1.7

### Doküman İşleme
- docx 9.5.1
- docxtemplater 3.67.0
- pizzip 3.2.0

---

## 📊 Proje Yapısı

```
proje-a/
├── main.js                      # Electron ana süreç
├── package.json                 # Proje yapılandırması
├── raporlar.db                  # SQLite veritabanı
├── modules/                     # 📦 Modüller
│   └── yapi-bedeli/            # Yapı Bedeli Modülü
│       ├── views/              # HTML dosyaları
│       │   ├── index.html
│       │   ├── raporlar.html
│       │   └── admin.html
│       ├── scripts/            # JavaScript dosyaları
│       │   ├── renderer.js
│       │   ├── raporlar.js
│       │   ├── admin.js
│       │   └── reportGenerator.js
│       ├── styles/             # CSS dosyaları
│       │   └── style.css
│       ├── KT_Sablon_1.docx    # Rapor şablonu
│       └── birimFiyatlar.json  # Birim fiyat verileri
├── shared/                      # 🔗 Paylaşılan kaynaklar
│   ├── database/               # Veritabanı yönetimi
│   └── utils/                  # Yardımcı fonksiyonlar
├── docs/                        # 📚 Dokümantasyon
└── raporlar_cikti/             # Oluşturulan raporlar
```

---

## 🎓 Kullanıcı Tiplerine Göre Rehber

### 👤 Son Kullanıcı
Uygulamayı kullanarak rapor oluşturmak istiyorsanız:
1. [docs/KURULUM.md](docs/KURULUM.md) - Uygulamayı kurun
2. [docs/KULLANIM.md](docs/KULLANIM.md) - Nasıl kullanılır öğrenin

### 🔧 Sistem Yöneticisi
Uygulamayı kurum genelinde yaygınlaştırmak istiyorsanız:
1. [docs/KURULUM.md](docs/KURULUM.md) - Sistem gereksinimleri
2. [docs/MIMARI.md](docs/MIMARI.md) - Teknik mimari
3. [docs/VERITABANI.md](docs/VERITABANI.md) - Veri yönetimi

### 👨‍💻 Geliştirici
Kod geliştirme ve katkıda bulunmak istiyorsanız:
1. [docs/MIMARI.md](docs/MIMARI.md) - Uygulama mimarisi
2. [docs/MODULLER.md](docs/MODULLER.md) - Kod yapısı
3. [docs/GELISTIRICI.md](docs/GELISTIRICI.md) - Geliştirme rehberi

---

## 🧮 Hesaplama Formülleri

### Yıpranma Payı
Resmi Gazete (02.12.1982, Sayı: 17.886) cetvellerine göre otomatik hesaplanır.

### Yapı Bedeli
```
Yapı Bedeli = Yapı Alanı × Birim Fiyat × (1 - Yıpranma Payı/100) × (1 - Eksik İmalat/100)
```

### Asgari Levazım Bedeli
```
Levazım Bedeli = Yapı Bedeli × 0.70 × 0.75
```

---

## 📸 Ekran Görüntüleri

Ana form ekranı ve rapor listesi için `Screenshot_1.jpg` dosyasına bakın.

---

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak için:
1. [docs/GELISTIRICI.md](docs/GELISTIRICI.md) → Katkıda Bulunma bölümünü okuyun
2. Fork yapın
3. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
4. Commit edin (`git commit -m 'feat: Add some AmazingFeature'`)
5. Push edin (`git push origin feature/AmazingFeature`)
6. Pull Request açın

---

## 🐛 Sorun Bildirme

Bir hata bulduysanız veya öneriniz varsa:
- Issue açın (GitHub/GitLab)
- [docs/KURULUM.md](docs/KURULUM.md) → Sorun Giderme bölümünü kontrol edin

---

## 📝 Lisans

Bu proje özel mülkiyettedir. Tüm hakları saklıdır.

---

## 👥 İletişim

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
- [ ] Multi-language support

---

## 📊 İstatistikler

```
📁 Toplam Dosya: 15+
📝 Kod Satırı: ~2000+
📦 Bağımlılık: 9 npm paketi
🖥️ Platform: Windows, macOS, Linux
📚 Dokümantasyon: 8 kapsamlı rehber
```

---

## ⭐ Öne Çıkan Özellikler

### 1. Resmi Gazete Uyumluluğu
Yıpranma payları 02.12.1982 tarih ve 17.886 sayılı Resmi Gazete'de yayınlanan cetvellere göre otomatik hesaplanır.

### 2. Türkçe Yazıya Çevirme
Hesaplanan bedeller otomatik olarak Türkçe yazıya çevrilir:
```
1,234,567 TL → "bir milyon ikiyüz otuz dört bin beşyüz altmış yedi Türk Lirasıdır"
```

### 3. Profesyonel Rapor Formatı
Word formatında, tablolu ve standart yapıda profesyonel raporlar.

### 4. Veri Güvenliği
Tüm veriler lokal SQLite veritabanında güvenle saklanır.

---

## 🚨 Önemli Notlar

⚠️ **Güvenlik**: Uygulama `contextIsolation: false` kullanıyor. Production kullanımı için güvenlik iyileştirmeleri yapılmalı.

⚠️ **Yedekleme**: `raporlar.db` dosyasını düzenli olarak yedekleyin!

⚠️ **Silme İşlemleri**: Rapor silme işlemi geri alınamaz!

---

## 📞 Destek ve Yardım

### Dokümantasyon
Tüm sorularınız için detaylı dokümantasyona göz atın:
- [Kurulum Sorunları](docs/KURULUM.md#sorun-giderme)
- [Kullanım Soruları](docs/KULLANIM.md#sık-sorulan-sorular)
- [Geliştirme](docs/GELISTIRICI.md)

### Topluluk
- GitHub Issues
- E-posta desteği
- Teknik dokümantasyon

---

<div align="center">

**KİTAR (Kıymet Takdir Raporu)** 

*Yapı Değerleme Raporlarını Profesyonelce Yönetin*

**Versiyon 1.0.0** | 2024

---

**[Dokümantasyon](docs/INDEX.md)** • 
**[Kurulum](docs/KURULUM.md)** • 
**[Kullanım](docs/KULLANIM.md)** • 
**[Geliştirici](docs/GELISTIRICI.md)**

</div>

