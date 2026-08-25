/**
 * Dönem Servisi - Birim fiyat dönemleri ve rapor uyarlama
 *
 * Bir raporu farklı bir birim fiyat dönemine (yıl/dönem) uyarlamak için gereken
 * sorgular ve saf hesaplama fonksiyonları. DOM'a dokunmaz.
 *
 * Bedel formülü, editördeki hesaplaSatir() ile birebir aynıdır:
 *   bedel = birimFiyat * alan * (1 - yipranma/100) * (1 - eksikImalat/100)
 */

// ===== SORGULAR =====

/**
 * Aktif birim fiyat dönemlerini getir (yeniden eskiye).
 */
function listeDonemler(db) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM birimFiyatlar WHERE aktif = 1 ORDER BY yil DESC, donem DESC`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows || [])
        );
    });
}

/**
 * Tek bir dönemi getir.
 */
function donemGetir(db, birimFiyatId) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT * FROM birimFiyatlar WHERE id = ?`,
            [birimFiyatId],
            (err, row) => err ? reject(err) : resolve(row || null)
        );
    });
}

/**
 * Bir dönemin tüm sınıf/grup fiyatlarını Map olarak getir.
 * Anahtar: "sinif|grup" (örn. "4|B") - ikisi de normalize edilmiş.
 */
function fiyatTablosuGetir(db, birimFiyatId) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT yapiSinifi, yapiGrubu, birimFiyat FROM birimFiyatDetay
             WHERE birimFiyatId = ? AND aktif = 1`,
            [birimFiyatId],
            (err, rows) => {
                if (err) { reject(err); return; }
                const map = new Map();
                (rows || []).forEach(r => {
                    map.set(fiyatAnahtari(r.yapiSinifi, r.yapiGrubu), r.birimFiyat);
                });
                resolve(map);
            }
        );
    });
}

/**
 * Yıpranma paylarını getir (tek seferlik önbellek için).
 */
function yipranmaPaylariGetir(db) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM yipranmaPaylari WHERE aktif = 1`,
            [],
            (err, rows) => err ? reject(err) : resolve(rows || [])
        );
    });
}

// ===== YARDIMCILAR =====

/**
 * Sınıf/grup için tek biçimli arama anahtarı.
 * Sınıf sayıya, grup büyük harfe normalize edilir; böylece "4"/"4 " / "b"/"B" aynı yere düşer.
 */
function fiyatAnahtari(sinif, grup) {
    const s = String(sinif == null ? '' : sinif).trim();
    const g = String(grup == null ? '' : grup).trim().toUpperCase();
    return `${s}|${g}`;
}

/**
 * Yapım tekniği ve yaşa göre yıpranma oranını bul.
 * Bulunamazsa null döner (çağıran eski oranı korur).
 */
function yipranmaBul(yipranmaCache, yapimTeknigi, yas) {
    if (!yapimTeknigi) return null;
    const teknik = String(yapimTeknigi).trim();
    const y = parseInt(yas, 10);
    if (isNaN(y)) return null;

    const kayit = (yipranmaCache || []).find(k =>
        String(k.yapimTeknigi).trim() === teknik && y >= k.minYas && y <= k.maxYas
    );
    return kayit ? kayit.yipranmaOrani : null;
}

function sayi(deger) {
    const n = parseFloat(String(deger == null ? '' : deger).replace(',', '.'));
    return isFinite(n) ? n : 0;
}

/**
 * Tek yapının bedelini hesapla (editördeki hesaplaSatir ile aynı formül).
 */
function bedelHesapla(birimFiyat, alan, yipranmaPay, eksikImalatOrani) {
    let bedel = sayi(birimFiyat) * sayi(alan);
    bedel = bedel * (1 - sayi(yipranmaPay) / 100);
    bedel = bedel * (1 - sayi(eksikImalatOrani) / 100);
    return bedel;
}

// ===== UYARLAMA =====

/**
 * Yapı listesini hedef döneme uyarla.
 *
 * @param {Array}  yapilar - yapilarJSON dizisi (değiştirilmez, kopyalanır)
 * @param {Object} opts
 *   @param {Map}     opts.fiyatlar       - fiyatTablosuGetir() sonucu
 *   @param {Array}   opts.yipranmaCache  - yipranmaPaylariGetir() sonucu
 *   @param {number}  opts.yilFarki       - hedefYil - kaynakYil (2026->2025 ise -1)
 *   @param {boolean} opts.yaslariKaydir  - yaşlar yıl farkı kadar kaydırılsın mı
 *
 * @returns {{ yapilar: Array, uyarilar: Array, toplam: number }}
 */
function raporuDonemeUyarla(yapilar, opts) {
    const fiyatlar = opts.fiyatlar || new Map();
    const yipranmaCache = opts.yipranmaCache || [];
    const yilFarki = opts.yilFarki || 0;
    const yaslariKaydir = Boolean(opts.yaslariKaydir);

    const uyarilar = [];
    let toplam = 0;

    const yeniYapilar = (yapilar || []).map((yapi, index) => {
        const y = Object.assign({}, yapi);
        const etiket = y.yapiAdi || `Yapı ${y.yapiNo || index + 1}`;

        // --- Yaş ve yıpranma ---
        const eskiYas = parseInt(y.yapiYasi, 10);
        let yeniYas = eskiYas;
        let yeniYipranma = sayi(y.yipranmaPay);

        if (yaslariKaydir && !isNaN(eskiYas)) {
            yeniYas = Math.max(0, eskiYas + yilFarki);
            const bulunan = yipranmaBul(yipranmaCache, y.yapimTeknigi, yeniYas);
            if (bulunan === null) {
                if (y.yapimTeknigi) {
                    uyarilar.push({
                        tip: 'yipranma-bulunamadi',
                        yapi: etiket,
                        mesaj: `${etiket}: "${y.yapimTeknigi}" için ${yeniYas} yaşına uygun yıpranma oranı bulunamadı, mevcut oran (%${yeniYipranma}) korundu.`
                    });
                }
            } else {
                yeniYipranma = bulunan;
            }
        }

        // --- Birim fiyat ---
        const eskiBirimFiyat = sayi(y.birimFiyat);
        let yeniBirimFiyat = eskiBirimFiyat;

        const sinif = String(y.yapiSinifi == null ? '' : y.yapiSinifi).trim();
        const grup = String(y.yapiGrubu == null ? '' : y.yapiGrubu).trim();

        if (!sinif || !grup) {
            uyarilar.push({
                tip: 'sinif-grup-eksik',
                yapi: etiket,
                mesaj: `${etiket}: sınıf/grup bilgisi eksik, birim fiyat otomatik çekilemedi. Eski fiyat korundu.`
            });
        } else {
            const bulunan = fiyatlar.get(fiyatAnahtari(sinif, grup));
            if (bulunan === undefined) {
                uyarilar.push({
                    tip: 'fiyat-bulunamadi',
                    yapi: etiket,
                    mesaj: `${etiket}: ${sinif} ${grup.toUpperCase()} için seçilen dönemde fiyat tanımlı değil. Eski fiyat korundu.`
                });
            } else {
                yeniBirimFiyat = bulunan;
            }
        }

        // --- Bedel ---
        const eskiBedel = sayi(y.yapiBedeli);
        const yeniBedel = bedelHesapla(yeniBirimFiyat, y.yapiAlani, yeniYipranma, y.eksikImalatOrani);

        y.yapiYasi = isNaN(yeniYas) ? (y.yapiYasi || '') : String(yeniYas);
        y.yipranmaPay = yeniYipranma;
        y.birimFiyat = yeniBirimFiyat;
        y.yapiBedeli = yeniBedel;

        // Önizleme için eski/yeni karşılaştırma (kaydedilmez, ayrı alanda tutulur)
        y._onizleme = {
            eskiYas: isNaN(eskiYas) ? null : eskiYas,
            yeniYas: isNaN(yeniYas) ? null : yeniYas,
            eskiYipranma: sayi(yapi.yipranmaPay),
            yeniYipranma: yeniYipranma,
            eskiBirimFiyat: eskiBirimFiyat,
            yeniBirimFiyat: yeniBirimFiyat,
            eskiBedel: eskiBedel,
            yeniBedel: yeniBedel,
            fiyatBulundu: Boolean(sinif && grup && fiyatlar.has(fiyatAnahtari(sinif, grup)))
        };

        toplam += yeniBedel;
        return y;
    });

    return { yapilar: yeniYapilar, uyarilar: uyarilar, toplam: toplam };
}

/**
 * Çoklu parsel raporu için: her parselin yapılarını uyarla.
 *
 * @returns {{ parseller: Array, uyarilar: Array, toplam: number }}
 */
function parselleriDonemeUyarla(parseller, opts) {
    const uyarilar = [];
    let toplam = 0;

    const yeniParseller = (parseller || []).map(parsel => {
        const p = Object.assign({}, parsel);
        const sonuc = raporuDonemeUyarla(p.yapilar || [], opts);
        p.yapilar = sonuc.yapilar;
        sonuc.uyarilar.forEach(u => uyarilar.push(u));
        toplam += sonuc.toplam;
        return p;
    });

    return { parseller: yeniParseller, uyarilar: uyarilar, toplam: toplam };
}

/**
 * Kaydetmeden önce önizleme alanlarını temizle.
 */
function onizlemeTemizle(yapilar) {
    return (yapilar || []).map(y => {
        const kopya = Object.assign({}, y);
        delete kopya._onizleme;
        return kopya;
    });
}

/**
 * Dönem etiketi: yılda birden fazla dönem varsa "2022/2", yoksa "2022".
 */
function donemEtiketi(donem, tumDonemler) {
    if (!donem) return '';
    const ayniYil = (tumDonemler || []).filter(d => d.yil === donem.yil).length;
    return ayniYil > 1 ? `${donem.yil}/${donem.donem}` : `${donem.yil}`;
}

module.exports = {
    listeDonemler,
    donemGetir,
    fiyatTablosuGetir,
    yipranmaPaylariGetir,
    fiyatAnahtari,
    yipranmaBul,
    bedelHesapla,
    raporuDonemeUyarla,
    parselleriDonemeUyarla,
    onizlemeTemizle,
    donemEtiketi
};
