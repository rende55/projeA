# ÖNEMLİ NOTLAR

## Proje Geçmişi

| Tarih | Değişiklik |
|-------|-----------|
| 20.11.2025 | İlk stabil sürüm: KİTAR (Kıymet Takdir Raporu) v1.0.0 |
| 22.11.2025 | Proje adı değişikliği: KİTAR → Proje A, klasör: `kitar` → `projeA` |
| 22.11.2025 | Modüler yapıya geçiş (v2.0.0) |
| 2025-2026 | Dashboard, SPA navigasyon, Proje Bedeli modülü, Admin paneli |
| 07.02.2026 | UI modernizasyonu (SVG ikonlar, modern design system) |
| 03.03.2026 | Çoklu parsel rapor sistemi |
| 18.05.2026 | Proje Bedeli rapor editörü + versiyon modalı (v2.1.0) |
| 25.08.2026 | Hesaplamalar modülü, Farklı Döneme Kopyala, modül hub sayfaları (v2.2.0) |

---

## Proje Durumu

### Modüller

| Modül | Durum | Konum |
|-------|-------|-------|
| **Yapı Bedeli** | Aktif | `modules/yapi-bedeli/` |
| **Proje Bedeli** | Aktif | `modules/proje-bedeli/` |
| **Hesaplamalar** | Aktif | `modules/hesaplama/` |
| **Mevzuat** | Planlı | `modules/mevzuat/` |

### Tamamlanan Özellikler
- Proje adı: KİTAR → Proje A (v2.0.0)
- Modüler yapıya geçiş
- Dashboard (ana sayfa) ve SPA navigasyon sistemi (`NavigationManager`)
- Yapı Bedeli modülü (form, hesaplama, rapor, admin paneli)
- Proje Bedeli modülü (4 branş, PID oranları, hizmet bedeli hesaplama)
- Admin paneli (4 sekmeli: Dönemler, Raportörler, Kurumlar, PID Oranları)
- Modern UI tasarımı (SVG ikonlar, Inter font, Slate renk paleti)
- Çoklu parsel raporu (tek raporda birden fazla ada/parsel ve yapı)
- Modül hub sayfaları (her modül kendi giriş ekranına açılıyor)
- Hesaplamalar modülü - Cephe Metrajı (boya/yalıtım alanı hesabı)
- Farklı Döneme Kopyala (raporu başka birim fiyat dönemine uyarlama)
- 12 veritabanı tablosu (raporlar, birimFiyatlar, raportorler, kurumlar, metrajlar, vb.)

---

## Çalıştırma

```bash
npm start
```

Uygulama Electron masaüstü uygulaması olarak çalışır (localhost üzerinden değil).

---

## Proje Yapısı

```
projeA/
├── main.js                          # Electron ana süreç + DB + IPC
├── dashboard.html                   # Ana sayfa (SPA shell)
├── dashboard.js                     # Dashboard mantığı
├── modules/
│   ├── yapi-bedeli/                 # Yapı Bedeli (views, scripts, styles)
│   ├── proje-bedeli/                # Proje Bedeli (views, scripts, assets)
│   └── hesaplama/                   # Hesaplamalar - Cephe Metrajı (views, scripts)
├── shared/
│   └── scripts/navigation.js        # SPA navigasyon yöneticisi
├── assets/                          # Uygulama görselleri
├── docs/                            # Dokümantasyon (10 rehber)
├── raporlar/                        # Oluşturulan Word raporları
└── raporlar.db                      # SQLite veritabanı (otomatik oluşur)
```

---

## Sorun Giderme

### Uygulama Açılmıyorsa

1. **SQLite3 Rebuild**:
   ```bash
   npx electron-rebuild
   ```

2. **Node Modules Yeniden Yükle**:
   ```bash
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

3. **Veritabanı Sorunu**:
   - `raporlar.db` dosyası silinebilir, uygulama yeniden başlatıldığında otomatik oluşur
   - Mevcut veriler kaybolur, yedekleme yapın

### Beyaz Ekran / Hata

1. DevTools açın: `Ctrl + Shift + I`
2. Console sekmesinde hata mesajını kontrol edin
3. Genellikle `require()` veya veritabanı bağlantı hatalarıdır

---

## Önemli Uyarılar

- **Güvenlik**: `contextIsolation: false` kullanılıyor. Production için iyileştirme gerekli.
- **Yedekleme**: `raporlar.db` dosyasını düzenli yedekleyin.
- **Silme**: Rapor silme işlemi geri alınamaz.
- **Veritabanı**: Migration sistemi `main.js` içindedir. Yeni tablo/sütun eklemeleri otomatik yapılır.

---

## Referans Dosyalar

| Dosya | İçerik |
|-------|--------|
| `CHANGELOG.md` | Tüm değişiklik kayıtları (tarih/saat ile) |
| `README.md` | Genel proje dokümantasyonu |
| `PROJE_YAPISI.md` | Detaylı yapı bilgisi ve modül rehberi |
| `docs/` | 10 kapsamlı dokümantasyon rehberi |

---

**Son Güncelleme**: 25.08.2026
**Versiyon**: 2.2.0
**Durum**: Aktif Geliştirme
**Konum**: `d:\02. yazilimisleri\projeA\`
