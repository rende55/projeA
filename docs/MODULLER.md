# Modül ve Fonksiyon Referansı

## İçindekiler

- [Modül Listesi](#modül-listesi)
- [Sayfa Modülü Sözleşmesi](#sayfa-modülü-sözleşmesi)
- [main.js](#mainjs)
- [shared/](#shared)
- [Yapı Bedeli Modülü](#yapı-bedeli-modülü)
- [Proje Bedeli Modülü](#proje-bedeli-modülü)
- [Hesaplamalar Modülü](#hesaplamalar-modülü)
- [SPA Öncesi Dosyalar](#spa-öncesi-dosyalar)
- [Ortak Yardımcı Fonksiyonlar](#ortak-yardımcı-fonksiyonlar)

---

## Modül Listesi

### Uygulama Çekirdeği

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `main.js` | ~1300 | Ana süreç: pencere, veritabanı şeması, migration, IPC |
| `dashboard.html` | ~1000 | SPA kabuğu, dashboard, versiyon modalı |
| `dashboard.js` | ~200 | Modül kartları, versiyon modalı, navigasyon başlatma |
| `build.js` | ~340 | Obfuscation ve build hazırlığı |

### Paylaşılan

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `shared/scripts/navigation.js` | ~470 | NavigationManager - SPA çekirdeği |
| `shared/scripts/db-helper.js` | ~35 | Veritabanı yolu çözümleme |

### Yapı Bedeli Modülü

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `yapi-bedeli-hub-page.js` | 131 | Modül giriş ekranı |
| `yapi-bedeli-page.js` | 1904 | Rapor formu (3 sekme, çoklu yapı, çoklu parsel) |
| `raporlar-page.js` | 297 | Kayıtlı rapor listesi |
| `editor-page.js` | 1534 | Rapor editörü |
| `admin-page.js` | 1547 | Yönetim paneli |
| `donem-servisi.js` | 273 | Dönem sorguları ve uyarlama (saf) |
| `donem-kopyala.js` | 522 | Farklı döneme kopyalama modalı |
| `reportGenerator.js` | 1044 | Word raporu üretimi |

### Proje Bedeli Modülü

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `proje-bedeli-hub-page.js` | 128 | Modül giriş ekranı |
| `proje-bedeli-page.js` | 1301 | Proje bedeli formu (4 branş) |
| `pb-raporlar-page.js` | 184 | Kayıtlı rapor listesi |
| `pb-editor-page.js` | 574 | Rapor editörü |
| `pb-reportGenerator.js` | 412 | Word raporu üretimi |

### Hesaplamalar Modülü

| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `hesaplama-hub-page.js` | 145 | Modül giriş ekranı |
| `metraj-hesap.js` | 244 | Metraj hesabı (saf fonksiyonlar) |
| `cephe-metraj-page.js` | 790 | Cephe metrajı ekranı |
| `metraj-raporlar-page.js` | 146 | Kayıtlı metraj listesi |

---

## Sayfa Modülü Sözleşmesi

Tüm SPA sayfaları aynı arayüzü dışa açar:

```javascript
module.exports = { onLoad, onUnload, hasUnsavedChanges };
```

### `onLoad(container, data, navigation)`

Sayfa açıldığında çağrılır.

| Parametre | Tip | Açıklama |
|-----------|-----|----------|
| `container` | HTMLElement | Sayfa içeriğinin basıldığı DOM düğümü |
| `data` | Object \| null | `navigateTo()` ile geçirilen veri (örn. `{ raporId: 87 }`) |
| `navigation` | NavigationManager | Navigasyon örneği |

Tipik gövde:

```javascript
async function onLoad(container, data, navigation) {
    nav = navigation;
    db = new sqlite3.Database(getDbPath());
    window.cmPage = { boslukEkle, boslukSil };   // template onclick köprüsü
    if (data && data.metrajId) await metrajYukle(data.metrajId);
    setupEventListeners();
    renderAll();
}
```

### `onUnload()`

Sayfadan ayrılırken çağrılır. Veritabanı bağlantısı kapatılır ve IPC dinleyicileri kaldırılır:

```javascript
async function onUnload() {
    if (db) { db.close(); db = null; }
    ipcRenderer.removeListener('word-export-success', wordBasarili);
    ipcRenderer.removeListener('word-export-error', wordHatali);
}
```

### `hasUnsavedChanges()`

Geri dönüşte uyarı gösterilip gösterilmeyeceğini belirler; `true` dönerse kullanıcıya onay sorulur.

### `saveState()`

İsteğe bağlıdır; navigasyondan önce form durumunu döndürür (`proje-bedeli-page.js` kullanır).

---

## main.js

Ana süreç. Uygulama açılışında sırasıyla: tohum veritabanını yerleştirir, şemayı oluşturur, migration'ları çalıştırır ve pencereyi açar.

### `getAppRootPath()`

Uygulama kök dizinini döndürür. Paketlenmiş portable çalışmada `PORTABLE_EXECUTABLE_DIR`, geliştirmede proje dizini.

### `getBundledSeedDbPath()`

Build içine gömülen tohum veritabanının yolunu döndürür (ASAR dışındaki `extraResources`).

### `seedDatabaseIfMissing()`

Kalıcı klasörde `raporlar.db` yoksa gömülü tohum veritabanını oraya kopyalar. Mevcut veritabanının üzerine yazmaz.

### `createDatabase()`

Tüm tabloları `CREATE TABLE IF NOT EXISTS` ile oluşturur ve varsayılan verileri (yıpranma cetveli, hizmet dalı katsayıları, il/ilçe tohumu) yükler.

### `migrateDatabase()`

Şema evrimini yönetir. Her açılışta çalışır, idempotenttir. İçindeki başlıca adımlar:

| Adım | Yaptığı |
|------|---------|
| Çoklu yapı | `raporlar.yapilarJSON`, `toplamYapiBedeli` kolonları |
| Çoklu parsel | `raporlar.cokluParsel`, `parsellerJSON` kolonları |
| Proje Bedeli imzacıları | `projeBedeliRaporlari.raportorSayisi`, `raportorAdi`, `raportorUnvani` |
| `birimFiyatId` | Kolonu ekler, ardından `birimFiyatIdDoldur()` çağrılır |
| Sınıf/grup onarımı | `tamirEtSinifGrup()` çağrılır |

#### `birimFiyatIdDoldur()`

Eski raporları kendi birim fiyat dönemine bağlar:

1. Raporun `resmiGazeteSayili` değeri bir dönemin künyesiyle birebir tutuyorsa o dönem atanır (kesin eşleşme)
2. Tutmazsa ve raporun yılında **tek** dönem tanımlıysa yıl üzerinden eşleştirilir
3. Yılda birden fazla dönem varsa kolon `NULL` bırakılır; kullanıcı kopyalama ekranında hedefi kendisi seçer

#### `tamirEtSinifGrup()`

Editörün eski bir sürümü yapı sınıfı ile grubunu tek alanda birleştiriyordu (`"2 C"`, `"2C"`) ve grup alanını boş bırakıyordu. Bu, birim fiyat sorgusunun anahtarını bozar. Fonksiyon `yapilarJSON` ve `parsellerJSON` içindeki bu kayıtları ayrıştırır:

```javascript
const m = sinif.match(/^(\d+)\s*([A-Za-zÇĞİÖŞÜçğıöşü]+)$/);
if (!m) return false;              // beklenmedik biçim - dokunma
yapi.yapiSinifi = m[1];
yapi.yapiGrubu = m[2].toUpperCase();
```

Yalnızca sınıf dolu **ve** grup boş olan kayıtlara dokunur; bu yüzden ikinci kez çalıştığında bir şey değiştirmez.

### `createWindow()`

Ana pencereyi oluşturur (`nodeIntegration: true`, `contextIsolation: false`) ve `dashboard.html` dosyasını yükler.

### IPC Handler'ları

| Kanal | Yön | Açıklama |
|-------|-----|----------|
| `export-word` | Renderer → Main | Word raporu üretir, `raporlar/` klasörüne yazar, açar |
| `export-word-with-photos` | Renderer → Main | Fotoğraflı Word raporu |
| `export-word-from-preview` | Renderer → Main | Önizleme ekranından çıktı |
| `open-editor` | Renderer → Main | Ayrı editör penceresi (SPA öncesi akış) |
| `open-preview` | Renderer → Main | Önizleme penceresi |
| `word-export-success` | Main → Renderer | Üretim başarılı, dosya yolu döner |
| `word-export-error` | Main → Renderer | Üretim hatası |

---

## shared/

### `navigation.js` - NavigationManager

SPA çekirdeği. Ayrıntılı anlatım için [MIMARI.md](./MIMARI.md#spa-navigasyon-sistemi).

| Fonksiyon | Açıklama |
|-----------|----------|
| `init(container, navBar, breadcrumb)` | Sistemi başlatır, klavye kısayollarını bağlar |
| `navigateTo(pageName, data)` | Yeni sayfaya geçer; state kaydeder, unload eder, template+script yükler |
| `goBack()` | Yığından bir önceki sayfaya döner; kaydedilmemiş değişiklik varsa onay sorar |
| `goHome()` | Dashboard'a döner |
| `loadPage(pageName, data)` | Template'i okur, script'i `require()` eder, `onLoad` çağırır |
| `unloadCurrentPage()` | Aktif sayfanın `onUnload` fonksiyonunu çağırır |
| `navigateToStackIndex(index)` | Breadcrumb'dan geçmişte bir noktaya döner |

### `db-helper.js`

| Fonksiyon | Dönüş | Açıklama |
|-----------|-------|----------|
| `getAppRootDir()` | string | Geliştirmede proje kökü, portable'da exe klasörü |
| `getDbPath()` | string | `raporlar.db` tam yolu |

Veritabanı yolu asla elle yazılmaz:

```javascript
const { getDbPath } = require('../../../shared/scripts/db-helper');
const db = new sqlite3.Database(getDbPath());
```

---

## Yapı Bedeli Modülü

### `yapi-bedeli-page.js` - Rapor Formu

Üç sekmeli form: Genel Bilgiler, Arsa Bilgileri, Yapı Bilgileri.

**Sekme yönetimi**

| Fonksiyon | Açıklama |
|-----------|----------|
| `showTab(tabName)` | Sekme değiştirir |
| `nextTab()` / `prevTab()` | İleri/geri gezinme |

**Veri doldurma**

| Fonksiyon | Açıklama |
|-----------|----------|
| `populateIlceler()` | İlçe listesini veritabanından doldurur |
| `populateHesapDonemleri()` | Birim fiyat dönemlerini listeler |
| `loadYipranmaPaylari()` | Yıpranma cetvelini önbelleğe alır |
| `kurumlariDoldur()` | Kurum/alt kurum listesini doldurur |
| `loadRaportorler(index)` | Raportör seçim kutusunu doldurur |
| `updateRaportorAlanlari()` | Raportör sayısına göre alanları çoğaltır |

**Çoklu yapı**

| Fonksiyon | Açıklama |
|-----------|----------|
| `yeniYapiEkle()` | Forma yeni yapı satırı ekler |
| `yapiSil(index)` | Yapı satırını siler |
| `yapiSinifiDegisti(index)` | Sınıf/grup değişince birim fiyatı tetikler |
| `birimFiyatGuncelle(index)` | Seçili dönemden birim fiyatı çeker |
| `yipranmaPayiGuncelle(index)` | Yapım tekniği + yaşa göre oranı çeker |

**Çoklu parsel**

| Fonksiyon | Açıklama |
|-----------|----------|
| `cokluParselModuDegistir()` | Çoklu parsel modunu açar/kapatır |
| `yeniParselEkle()` | Yeni parsel bloğu ekler |
| `parselSil(parselId)` | Parseli ve yapılarını siler |
| `parselYapiEkle(parselId)` | Parsele yapı ekler (numaralandırma her parselde 1'den başlar) |
| `parselYapiSil(yapiId)` | Parselden yapı siler |

**Hesap ve kayıt**

| Fonksiyon | Açıklama |
|-----------|----------|
| `hesapla()` | Tüm yapıların bedelini ve toplamı hesaplar |
| `collectFormData()` | Form verisini tek nesnede toplar |
| `kaydet()` | `raporlar` tablosuna yazar |
| `wordRaporOlustur()` | IPC ile Word çıktısı ister |
| `temizle()` | Formu sıfırlar |

**Fotoğraflar**

`fotograflarDegisti()`, `fotografOnizlemeGuncelle()`, `fotografSil(index)`, `fotografAciklamaGuncelle(index, aciklama)` fonksiyonları fotoğrafları base64 olarak toplar ve önizler.

---

### `raporlar-page.js` - Rapor Listesi

| Fonksiyon | Açıklama |
|-----------|----------|
| `loadRaporlar()` | Raporları listeler (Dönem sütunu dahil) |
| `donemHucresi(row)` | Dönem sütununun içeriğini üretir |
| `duzenle(id)` | Raporu editörde açar |
| `wordIndir(id)` | Rapor açılmadan doğrudan Word çıktısı üretir |
| `donemeKopyala(id)` | Döneme kopyalama modalını açar |
| `sil(id)` | Raporu siler (geri alınamaz) |

`donemHucresi()` üç durumu ayırır:

1. `birimFiyatId` doluysa dönem tablosundan kesin etiket (`2022/2` + Resmi Gazete sayısı)
2. Değilse raporda yazan `hesapYili`
3. O da yoksa `Belirsiz`

---

### `editor-page.js` - Rapor Editörü

Kaydedilmiş raporu canlı hesaplamayla düzenler. Tekli ve çoklu parsel raporlarını ayrı render eder.

| Fonksiyon | Açıklama |
|-----------|----------|
| `loadRapor(id)` | Raporu veritabanından yükler |
| `renderRaporIcerigi(rapor)` | Rapor tipine göre uygun render'ı seçer |
| `renderTekliParselIcerigi(rapor, container)` | Tekli parsel görünümü |
| `renderCokluParselIcerigi(rapor, container)` | Çoklu parsel görünümü (ara toplam + genel toplam) |
| `hesaplaSatir(row)` | Tek yapının bedelini hesaplar |
| `yenidenHesapla()` | Tüm satırları ve toplamları günceller |
| `collectEditorData()` | Düzenlenen veriyi toplar |
| `kaydet()` | Değişiklikleri veritabanına yazar |
| `wordOlarakIndir()` | Word çıktısı üretir |
| `donemKopyalaAc()` | Döneme kopyalama modalını açar |

**Dönem farkındalığı**

| Fonksiyon | Açıklama |
|-----------|----------|
| `donemVerileriniYukle(rapor)` | Raporun dönemine ait fiyat tablosu ve yıpranma cetvelini yükler |
| `donemSeridiGuncelle(rapor)` | Başlıktaki dönem şeridini günceller |
| `birimFiyatOtoGuncelle(row)` | Sınıf/grup değişince birim fiyatı dönemden çeker |
| `yipranmaOtoGuncelle(row)` | Yaş veya yapım tekniği değişince oranı cetvelden çeker |
| `vurgula(cell)` | Otomatik değişen hücreyi kısa süre vurgular |

Bedel formülü:

```javascript
bedel = birimFiyat × alan × (1 - yipranmaPay / 100) × (1 - eksikImalatOrani / 100)
```

---

### `donem-servisi.js` - Dönem Sorguları ve Uyarlama

DOM'a dokunmayan saf katman. Hem modal hem rapor listesi kullanır.

#### Sorgular

| Fonksiyon | Dönüş | Açıklama |
|-----------|-------|----------|
| `listeDonemler(db)` | Promise\<Array\> | Aktif dönemler, yeniden eskiye |
| `donemGetir(db, birimFiyatId)` | Promise\<Object\> | Tek dönem kaydı |
| `fiyatTablosuGetir(db, birimFiyatId)` | Promise\<Map\> | `"sinif\|grup"` → birim fiyat |
| `yipranmaPaylariGetir(db)` | Promise\<Array\> | Yıpranma cetvelinin tamamı |

#### Yardımcılar

| Fonksiyon | Açıklama |
|-----------|----------|
| `fiyatAnahtari(sinif, grup)` | Tek biçimli arama anahtarı üretir; sınıfı trim eder, grubu büyük harfe çevirir |
| `yipranmaBul(cache, yapimTeknigi, yas)` | Tekniğe ve yaşa uyan oranı bulur; bulunamazsa `null` |
| `bedelHesapla(birimFiyat, alan, yipranma, eksikImalat)` | Editördeki formülün birebir aynısı |
| `donemEtiketi(donem, tumDonemler)` | Yılda tek dönem varsa `2026`, birden fazlaysa `2022/2` |
| `onizlemeTemizle(yapilar)` | Kaydetmeden önce `_onizleme` alanlarını temizler |

#### Uyarlama

**`raporuDonemeUyarla(yapilar, opts)`**

| `opts` alanı | Tip | Açıklama |
|--------------|-----|----------|
| `fiyatlar` | Map | `fiyatTablosuGetir()` sonucu |
| `yipranmaCache` | Array | `yipranmaPaylariGetir()` sonucu |
| `yilFarki` | number | hedefYıl − kaynakYıl |
| `yaslariKaydir` | boolean | Yaşlar yıl farkı kadar kaydırılsın mı |

Dönüş: `{ yapilar, uyarilar, toplam }`

Her yapı için sırasıyla: yaş kaydırılır → yıpranma cetvelden okunur → birim fiyat hedef dönemden çekilir → bedel yeniden hesaplanır. Girdi dizisi değiştirilmez, kopya üzerinde çalışılır. Her yapıya önizleme için `_onizleme` alanı eklenir (eski/yeni değerler); bu alan kaydetmeden önce temizlenir.

**Uyarı türleri**

| Tip | Ne zaman |
|-----|----------|
| `fiyat-bulunamadi` | Sınıf/grup hedef dönemde tanımlı değil - eski fiyat korunur |
| `sinif-grup-eksik` | Yapıda sınıf veya grup boş - otomatik çekim yapılamaz |
| `yipranma-bulunamadi` | Teknik + yeni yaş için cetvelde karşılık yok - mevcut oran korunur |

**`parselleriDonemeUyarla(parseller, opts)`**

Çoklu parsel raporları için her parselin yapılarını uyarlar; aynı dönüş yapısını kullanır.

---

### `donem-kopyala.js` - Kopyalama Modalı

```javascript
const donemKopyala = require('./donem-kopyala');
donemKopyala.ac(db, nav, raporId);
```

| Fonksiyon | Açıklama |
|-----------|----------|
| `ac(db, nav, raporId)` | Tek dışa açılan fonksiyon; modalı kurar ve gösterir |

Modal kendi stilini (`dk-` önekli) bir kez `<style>` olarak ekler, DOM'unu `document.body`'ye basar. İçeride:

- Hedef dönem seçimi (kaynağın kendi dönemi listede yer almaz)
- Yaş kaydırma onay kutusu ve yıl farkı etiketi
- Eski → yeni karşılaştırmalı önizleme tablosu, uyarı kutusu ve toplam karşılaştırması
- Onaylandığında `kopyalaVeKaydet()` yeni satırı ekler ve editörü yeni id ile açar

`kopyalaVeKaydet()` sütun listesini `PRAGMA table_info(raporlar)` ile okur; şemaya yeni sütun eklendiğinde kopyalama kodu değişmeden çalışmaya devam eder. Kaynak rapor hiçbir durumda değiştirilmez.

---

### `admin-page.js` - Yönetim Paneli

Sekmeli panel: Birim Fiyat Dönemleri, Raportörler, Kurumlar, PID Oranları, İl/İlçe. Her sekme için listeleme, ekleme, düzenleme ve pasife alma işlemleri içerir. Ayrıntılı kullanım için [ADMIN_PANEL_REHBERI.md](./ADMIN_PANEL_REHBERI.md).

---

### `reportGenerator.js` - Word Raporu

```javascript
module.exports = { generateReport, generateCokluParselReport, sayiyiYaziyaCevir, formatTarih };
```

| Fonksiyon | Açıklama |
|-----------|----------|
| `generateReport(raporData, outputPath)` | Tekli parsel raporu üretir |
| `generateCokluParselReport(raporData, outputPath)` | Çoklu parsel raporu üretir |
| `sayiyiYaziyaCevir(sayi)` | Sayıyı Türkçe yazıya çevirir |
| `formatTarih(tarih)` | Tarihi rapor biçimine getirir |

**Çoklu parsel çıktısı**: 10 sütunlu tablo (Ada / Parsel / Y.No / Yapı Adı / Sınıfı / B.Fiyat / Alan / Yıpr. / Eks.İm. / Yapı Bedeli), 10 punto yazı, her parselin sonunda **Ara Toplam**, en altta **GENEL TOPLAM** satırı.

---

## Proje Bedeli Modülü

### `proje-bedeli-page.js` - Proje Bedeli Formu

Dört branş için hizmet bedeli hesaplar: mimarlık (`mim`), inşaat/statik (`ins`), mekanik (`mek`), elektrik (`elk`).

| Fonksiyon | Açıklama |
|-----------|----------|
| `populateHesapDonemleri()` | Hesap yılı listesini doldurur |
| `yapiSinifiDegisti()` | Sınıf/grup değişince birim maliyeti tetikler |
| `birimMaliyetGuncelle()` | Seçili dönemden birim maliyeti çeker |
| `hesaplaYapiMaliyeti()` | `alan × birimMaliyet` ile yaklaşık maliyeti bulur |
| `getPidOrani(alan, sinif)` | Maliyet aralığı ve hizmet sınıfına göre PID oranını bulur |
| `pidOraniGuncelle(brans)` | Branşın PID oranını günceller |
| `bransHesapla(brans)` | Branşın proje ve hizmet bedelini hesaplar |
| `hizmetBolumToggle(element, brans)` | Hizmet bölümü seçimini değiştirir |
| `hizmetBolumToplamGuncelle(brans)` | Seçili bölümlerin oran toplamını günceller |
| `projeTipiToggle(element, brans)` | Proje tipi seçimini değiştirir |
| `bransMaliyetGuncelle()` | Tüm branşları yeniden hesaplar |
| `raporKaydet()` | `projeBedeliRaporlari` tablosuna yazar (imzacı bilgileri dahil) |

Hesap zinciri:

```
Toplam Maliyet = İnşaat Alanı × Birim Maliyet
Proje Bedeli   = Toplam Maliyet × PID Oranı
Hizmet Bedeli  = Proje Bedeli × Hizmet Dalı Katsayısı × Seçili Bölüm Oranı
Genel Toplam   = Dört branşın hizmet bedeli toplamı
```

### `pb-editor-page.js` - Proje Bedeli Editörü

Kayıtlı raporu açar; alan, birim maliyet, branş bedelleri, hizmet bölümleri ve imzacılar üzerinde canlı hesaplamayla düzenleme yapar. `Ctrl+S` ile hızlı kayıt, `ESC` ile kaydedilmemiş değişiklik uyarısı verir.

### `pb-raporlar-page.js` - Rapor Listesi

Kayıtlı proje bedeli raporlarını listeler; **Düzenle**, **Word** ve **Sil** aksiyonlarını sunar. Word aksiyonu raporu açmadan doğrudan `.docx` üretir.

### `pb-reportGenerator.js`

```javascript
module.exports = { generateReport, sayiyiYaziyaCevir, formatPara, formatOran };
```

---

## Hesaplamalar Modülü

### `metraj-hesap.js` - Saf Hesap Katmanı

DOM'a dokunmaz; veri alır, hesaplanmış veri döndürür. Tüm ölçüler metre, alanlar metrekaredir.

#### Sabitler

**`YUZEY_TIPLERI`** - özet tablosunun satırları ve varsayılan boya/yalıtım durumu:

| Kod | Ad | Boya | Yalıtım |
|-----|-----|------|---------|
| `cepheOn` | Cephe ön yüzeyi | ✓ | ✓ |
| `cikma` | Çıkma yüzeyleri | ✓ | ✓ |
| `sacak` | Saçak yüzeyleri (alın + altı) | ✓ | - |
| `safak` | Kapı/pencere yan yüzeyleri (şafak) | ✓ | - |
| `denizlik` | Mermer denizlik (düşülen) | ✓ | - |

**`CIKMA_YUZEYLERI`** - `alt`, `solYan`, `sagYan` (varsayılan işaretli), `ust`, `on`.

#### Fonksiyonlar

**`hesaplaBosluk(bosluk)`**

Girdi: `{ tip, en, boy, adet, gommeDerinligi, denizlikVar, denizlikDerinligi }`

Dönüş: `{ boslukAlani, safakAlani, denizlikUzunlugu, denizlikAlani }`

Şafak çevresi, alt yüzeyin boyanıp boyanmadığına göre değişir:

| Durum | Çevre |
|-------|-------|
| Kapı (alt yüzey zemindir) | `2 × boy + en` |
| Pencere + mermer denizlik (alt yüzey kaplı) | `2 × boy + en` |
| Pencere, denizliksiz (dört yüzey boyanır) | `2 × (en + boy)` |

**`hesaplaCikma(cikma)`**

Girdi: `{ en, derinlik, yukseklik, adet, yuzeyler }`

Yalnızca işaretli yüzeyler toplanır:

```
alt / üst      = en × derinlik
solYan / sagYan = derinlik × yükseklik
on             = en × yükseklik
```

Dönüş: `{ birimAlan, cikmaAlani, yuzeyAlanlari, seciliYuzeyler }`

**`hesaplaSacak(sacak, cepheEni)`**

```
saçak altı = cepheEni × genislik
saçak alın = cepheEni × alinYuksekligi
```

**`hesaplaCephe(cephe)`**

Bir cephenin tüm satırlarını hesaplar. Cephe ön yüzeyi brüt alandan boşluklar düşülerek bulunur ve negatife inmez:

```javascript
const cepheOnAlani = Math.max(0, brutAlan - bosluklarAlani);
```

Dönüş: `{ brutAlan, bosluklarAlani, denizlikUzunlugu, bosluklar, cikmalar, sacak, yuzeyler }`

`yuzeyler.denizlik` **eksi değerdir** (özet tablosunda düşülür).

**`toplaOzet(yuzeyler, ayarlar)`**

Yüzey alanlarından boya / yalıtım / toplam alan çıkarır. Ayarlarda ilgili kutu işaretli değilse o yüzey toplama katılmaz.

**`varsayilanAyarlar()`**

Her yüzey için varsayılan boya/yalıtım durumunu içeren nesne döndürür.

**`hesaplaMetraj(state)`**

Girdi: `{ ayarlar, cepheler }` — Dönüş: `{ cepheler, toplam }`

Her cepheyi hesaplar, cephe bazlı özet ekler ve tüm cephelerin yüzey bazlı toplamını çıkarır.

**`sayi(deger)`**

Güvenli sayı dönüşümü: boş, geçersiz ve negatif değerler `0` kabul edilir.

---

### `cephe-metraj-page.js` - Cephe Metrajı Ekranı

Tüm veri tek bir `metrajState` nesnesinde tutulur; DOM'dan okuma yapılmaz.

**Durum yönetimi**

| Fonksiyon | Açıklama |
|-----------|----------|
| `bosState()` | Boş metraj durumu üretir |
| `yeniCephe(index)` | Yeni cephe nesnesi (varsayılan adlar: Kuzey, Güney, Doğu, Batı) |
| `yeniBosluk()` / `yeniCikma()` | Yeni satır nesneleri |
| `isaretle()` | Kaydedilmemiş değişiklik bayrağını kaldırır |

**Düzenleme**

| Fonksiyon | Açıklama |
|-----------|----------|
| `cepheSayisiUygula()` | Cephe sayısını değiştirir |
| `cepheSec(index)` | Aktif cepheyi değiştirir |
| `boslukEkle(cepheIdx)` / `boslukSil(cepheIdx, satirIdx)` | Boşluk satırı işlemleri |
| `cikmaEkle(cepheIdx)` / `cikmaSil(cepheIdx, satirIdx)` | Çıkma satırı işlemleri |
| `alanDegisti(e)` | Girdi değişiminde durumu günceller ve yeniden hesaplar |

**Render**

`renderAll()`, `renderAyarlar()`, `renderTabs()`, `renderCephePanel()`, `renderBoslukSatirlari()`, `renderCikmaSatirlari()`, `renderOzet()` fonksiyonları arayüzü durumdan yeniden çizer.

**Kayıt**

| Fonksiyon | Açıklama |
|-----------|----------|
| `guncelleHesaplar()` | `metraj-hesap.js` ile hesaplayıp özeti günceller |
| `metrajYukle(id)` | Kayıtlı metrajı açar |
| `kaydet()` | Yeni kayıt ekler veya mevcut kaydı günceller |
| `temizle()` | Formu sıfırlar |

Template'teki `onclick` işleyicileri için köprü:

```javascript
window.cmPage = { boslukEkle, boslukSil, cikmaEkle, cikmaSil, cepheSec };
```

### `metraj-raporlar-page.js`

Kayıtlı metrajları listeler; kayıt açma ve silme işlemlerini sağlar.

### `hesaplama-hub-page.js`

Modül giriş ekranı: Cephe Metrajı ve Kayıtlı Metrajlar kartları, son metrajlar tablosu. "Birim Dönüşüm" kartı şimdilik devre dışı yer tutucudur.

---

## SPA Öncesi Dosyalar

Aşağıdaki dosyalar tek pencere navigasyonuna geçilmeden önceki, ayrı pencere açan akışa aittir. Halen depoda ve build listesinde bulunurlar; bazıları `open-editor` / `open-preview` IPC kanalları üzerinden ayrı pencere olarak açılabilir.

| Dosya | Satır | SPA karşılığı |
|-------|-------|---------------|
| `renderer.js` | 1302 | `yapi-bedeli-page.js` |
| `raporlar.js` | 172 | `raporlar-page.js` |
| `admin.js` | 1291 | `admin-page.js` |
| `editor.js` | 526 | `editor-page.js` |
| `preview.js` | 95 | (SPA karşılığı yok; önizleme penceresi) |

> **Yeni geliştirme yaparken SPA dosyaları (`*-page.js`) kullanılmalıdır.** Bu dosyalar geriye dönük uyumluluk için korunmaktadır; bir düzeltme yapılırken SPA karşılığının da güncellenmesi gerekip gerekmediği kontrol edilmelidir.

---

## Ortak Yardımcı Fonksiyonlar

Aşağıdaki yardımcılar birden fazla dosyada benzer biçimde yer alır. `shared/utils/` altında toplanmaları planlanmaktadır.

| Fonksiyon | Bulunduğu yerler | Açıklama |
|-----------|------------------|----------|
| `sayiyiYaziyaCevir(sayi)` | `reportGenerator.js`, `pb-reportGenerator.js` | Sayıyı Türkçe yazıya çevirir |
| `formatPara(deger)` | Editör, modal, rapor üreticileri | Binlik ayraçlı para biçimi |
| `formatTarih(tarih)` | Listeler, rapor üreticileri | `YYYY-MM-DD` → `GG.AA.YYYY` |
| `sayi(deger)` | `metraj-hesap.js`, `donem-servisi.js` | Güvenli sayı dönüşümü (virgül/nokta normalizasyonu) |
| `kacir(metin)` | `donem-kopyala.js` | HTML kaçışı |
| `guvenliParse(json, varsayilan)` | `donem-kopyala.js` | Bozuk JSON'da varsayılana düşer |

---

*Son Güncelleme: 25.08.2026 | Versiyon 2.2.0*
