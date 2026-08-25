/**
 * Cephe Metrajı - Saf Hesaplama Fonksiyonları
 *
 * Bu dosya DOM'a dokunmaz. Sadece veri alır, hesaplanmış veri döndürür.
 * Böylece hesap mantığı arayüzden bağımsız olarak test edilebilir.
 *
 * Tüm ölçüler metre (m), tüm alanlar metrekare (m²) cinsindendir.
 */

// ===== YÜZEY TİPLERİ =====
// Özet tablosundaki satırların sırası ve varsayılan boya/yalıtım durumu.
const YUZEY_TIPLERI = [
    { kod: 'cepheOn',  adi: 'Cephe ön yüzeyi',                    boya: true, yalitim: true  },
    { kod: 'cikma',    adi: 'Çıkma yüzeyleri',                    boya: true, yalitim: true  },
    { kod: 'sacak',    adi: 'Saçak yüzeyleri (alın + altı)',      boya: true, yalitim: false },
    { kod: 'safak',    adi: 'Kapı/pencere yan yüzeyleri (şafak)', boya: true, yalitim: false },
    { kod: 'denizlik', adi: 'Mermer denizlik (düşülen)',          boya: true, yalitim: false }
];

// Çıkma yüzeyleri: hangi yüzeyin alanı hangi ölçülerden hesaplanır
const CIKMA_YUZEYLERI = [
    { kod: 'alt',    adi: 'Alt',     varsayilan: true  },
    { kod: 'solYan', adi: 'Sol Yan', varsayilan: true  },
    { kod: 'sagYan', adi: 'Sağ Yan', varsayilan: true  },
    { kod: 'ust',    adi: 'Üst',     varsayilan: false },
    { kod: 'on',     adi: 'Ön',      varsayilan: false }
];

/**
 * Güvenli sayı dönüşümü. Boş / geçersiz / negatif değerler 0 kabul edilir.
 */
function sayi(deger) {
    const n = parseFloat(deger);
    if (!isFinite(n) || n < 0) return 0;
    return n;
}

// ===== BOŞLUK (PENCERE / KAPI) =====

/**
 * Bir boşluk satırını hesaplar.
 *
 * Şafak (iç yan yüzey) çevresi, alt yüzeyin boyanıp boyanmadığına göre değişir:
 *   - Kapı                      -> alt yüzey yoktur (zemin)     -> 2*boy + en
 *   - Pencere + mermer denizlik -> alt yüzey mermerle kaplıdır  -> 2*boy + en
 *   - Pencere, denizliksiz      -> dört yüzey de boyanır        -> 2*(en + boy)
 */
function hesaplaBosluk(bosluk) {
    const en    = sayi(bosluk.en);
    const boy   = sayi(bosluk.boy);
    const adet  = Math.max(0, Math.round(sayi(bosluk.adet)));
    const gomme = sayi(bosluk.gommeDerinligi);

    const kapiMi      = bosluk.tip === 'kapi';
    const denizlikVar = !kapiMi && Boolean(bosluk.denizlikVar);
    const denizlikDer = denizlikVar ? sayi(bosluk.denizlikDerinligi) : 0;

    const altYuzeyBoyanir = !kapiMi && !denizlikVar;
    const cevre = altYuzeyBoyanir ? 2 * (en + boy) : (2 * boy + en);

    return {
        boslukAlani:      en * boy * adet,
        safakAlani:       cevre * gomme * adet,
        denizlikUzunlugu: denizlikVar ? en * adet : 0,
        denizlikAlani:    denizlikVar ? en * denizlikDer * adet : 0
    };
}

// ===== ÇIKMA =====

/**
 * Bir çıkma satırını hesaplar. Sadece işaretli yüzeyler toplanır.
 */
function hesaplaCikma(cikma) {
    const en        = sayi(cikma.en);
    const derinlik  = sayi(cikma.derinlik);
    const yukseklik = sayi(cikma.yukseklik);
    const adet      = Math.max(0, Math.round(sayi(cikma.adet)));
    const yuzeyler  = cikma.yuzeyler || {};

    const yuzeyAlanlari = {
        alt:    en * derinlik,
        ust:    en * derinlik,
        solYan: derinlik * yukseklik,
        sagYan: derinlik * yukseklik,
        on:     en * yukseklik
    };

    let birimAlan = 0;
    const secili = [];
    CIKMA_YUZEYLERI.forEach(function (y) {
        if (yuzeyler[y.kod]) {
            birimAlan += yuzeyAlanlari[y.kod];
            secili.push(y.kod);
        }
    });

    return {
        birimAlan:      birimAlan,
        cikmaAlani:     birimAlan * adet,
        yuzeyAlanlari:  yuzeyAlanlari,
        seciliYuzeyler: secili
    };
}

// ===== SAÇAK =====

/**
 * Saçak altı (soffit) ve saçak alın (fascia) alanları.
 *   genislik       = saçağın duvardan çıkıntısı
 *   alinYuksekligi = saçak alnının (kalınlığının) yüksekliği
 */
function hesaplaSacak(sacak, cepheEni) {
    if (!sacak || !sacak.var) {
        return { sacakAltiAlani: 0, sacakAlinAlani: 0, toplam: 0 };
    }
    const en   = sayi(cepheEni);
    const alti = en * sayi(sacak.genislik);
    const alin = en * sayi(sacak.alinYuksekligi);
    return { sacakAltiAlani: alti, sacakAlinAlani: alin, toplam: alti + alin };
}

// ===== CEPHE =====

/**
 * Tek bir cepheyi hesaplar; 5 yüzey satırını ve satır bazlı ara sonuçları döndürür.
 */
function hesaplaCephe(cephe) {
    const en        = sayi(cephe.en);
    const yukseklik = sayi(cephe.yukseklik);
    const brutAlan  = en * yukseklik;

    // Boşluklar
    const bosluklar = (cephe.bosluklar || []).map(function (b) {
        return Object.assign({}, b, { hesap: hesaplaBosluk(b) });
    });
    let bosluklarAlani = 0, safakAlani = 0, denizlikAlani = 0, denizlikUzunlugu = 0;
    bosluklar.forEach(function (b) {
        bosluklarAlani   += b.hesap.boslukAlani;
        safakAlani       += b.hesap.safakAlani;
        denizlikAlani    += b.hesap.denizlikAlani;
        denizlikUzunlugu += b.hesap.denizlikUzunlugu;
    });

    // Çıkmalar
    const cikmalar = (cephe.cikmalar || []).map(function (c) {
        return Object.assign({}, c, { hesap: hesaplaCikma(c) });
    });
    let cikmaAlani = 0;
    cikmalar.forEach(function (c) { cikmaAlani += c.hesap.cikmaAlani; });

    // Saçak
    const sacak = hesaplaSacak(cephe.sacak, en);

    // Cephe ön yüzeyi: brüt alandan boşluklar düşülür (negatife inmesin)
    const cepheOnAlani = Math.max(0, brutAlan - bosluklarAlani);

    return {
        brutAlan:         brutAlan,
        bosluklarAlani:   bosluklarAlani,
        denizlikUzunlugu: denizlikUzunlugu,
        bosluklar:        bosluklar,
        cikmalar:         cikmalar,
        sacak:            sacak,
        // Özet tablosunun 5 satırı (denizlik eksi değerdir)
        yuzeyler: {
            cepheOn:  cepheOnAlani,
            cikma:    cikmaAlani,
            sacak:    sacak.toplam,
            safak:    safakAlani,
            denizlik: -denizlikAlani
        }
    };
}

// ===== TÜM METRAJ =====

/**
 * Bir yüzey alanı seti için boya / yalıtım / net alan toplamlarını çıkarır.
 * Ayarlarda o yüzey için ilgili kutu işaretli değilse, o yüzey toplama katılmaz.
 */
function toplaOzet(yuzeyler, ayarlar) {
    let alan = 0, boya = 0, yalitim = 0;
    YUZEY_TIPLERI.forEach(function (y) {
        const deger = yuzeyler[y.kod] || 0;
        const ayar  = (ayarlar && ayarlar[y.kod]) || y;
        alan += deger;
        if (ayar.boya)    boya    += deger;
        if (ayar.yalitim) yalitim += deger;
    });
    return { alan: alan, boya: boya, yalitim: yalitim };
}

/**
 * Varsayılan ayar nesnesi (her yüzey için boya/yalıtım durumu).
 */
function varsayilanAyarlar() {
    const ayarlar = {};
    YUZEY_TIPLERI.forEach(function (y) {
        ayarlar[y.kod] = { boya: y.boya, yalitim: y.yalitim };
    });
    return ayarlar;
}

/**
 * Tüm metrajı hesaplar.
 *
 * @param {Object} state - { ayarlar: { <yuzeyKod>: { boya, yalitim } }, cepheler: [...] }
 * @returns {Object} { cepheler: [...], toplam: {...} }
 */
function hesaplaMetraj(state) {
    const ayarlar  = (state && state.ayarlar) ? state.ayarlar : varsayilanAyarlar();
    const cepheler = ((state && state.cepheler) ? state.cepheler : []).map(hesaplaCephe);

    // Her cephenin kendi özeti
    cepheler.forEach(function (c) {
        c.ozet = toplaOzet(c.yuzeyler, ayarlar);
    });

    // Yüzey bazında tüm cephelerin toplamı
    const toplamYuzeyler = {};
    YUZEY_TIPLERI.forEach(function (y) { toplamYuzeyler[y.kod] = 0; });
    cepheler.forEach(function (c) {
        YUZEY_TIPLERI.forEach(function (y) { toplamYuzeyler[y.kod] += c.yuzeyler[y.kod]; });
    });

    return {
        cepheler: cepheler,
        toplam: Object.assign({ yuzeyler: toplamYuzeyler }, toplaOzet(toplamYuzeyler, ayarlar))
    };
}

module.exports = {
    YUZEY_TIPLERI,
    CIKMA_YUZEYLERI,
    sayi,
    hesaplaBosluk,
    hesaplaCikma,
    hesaplaSacak,
    hesaplaCephe,
    hesaplaMetraj,
    toplaOzet,
    varsayilanAyarlar
};
