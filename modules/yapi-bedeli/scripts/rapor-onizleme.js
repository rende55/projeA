/**
 * Rapor Ön İzleme HTML Üreteci
 *
 * Ön izleme penceresi eskiden editör DOM'unu olduğu gibi gösteriyordu; editör bir
 * veri giriş ekranı olduğu için (sınıf/grup ayrı sütun, ham sayılar, buton satırları)
 * Word çıktısına benzemiyordu. Bu modül aynı rapor verisinden Word çıktısının birebir
 * karşılığı olan HTML'i üretir.
 *
 * Biçimlendirme yardımcıları reportGenerator.js'ten alınır; böylece ön izleme ile
 * Word çıktısı birbirinden ayrışamaz.
 */

const rg = require('./reportGenerator');

// Word'deki half-point/twip değerlerinin punto karşılıkları
const PT_BASLIK = 14;   // size: 28
const PT_METIN = 12;    // size: 24
const PT_TABLO = 11;    // size: 22
const PT_TABLO_TASINMAZ = 12;

// Word'de spacing: { before: 120, after: 120 } => 6pt
const BOSLUK_PT = 6;

function html(metin) {
    return String(metin ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Word tablo hücresi karşılığı - dikey hizalama daima ortada
function hucre(icerik, { baslik = false, hizala = 'center', genislik = null, punto = PT_TABLO } = {}) {
    const etiket = baslik ? 'th' : 'td';
    const stil = [
        'border:1px solid #000',
        'padding:2px 6px',
        'vertical-align:middle',
        `text-align:${hizala}`,
        `font-size:${punto}pt`,
        baslik ? 'font-weight:bold' : 'font-weight:normal',
        genislik !== null ? `width:${genislik}%` : ''
    ].filter(Boolean).join(';');
    return `<${etiket} style="${stil}">${icerik}</${etiket}>`;
}

function tablo(satirlar) {
    return `<table style="width:100%;border-collapse:collapse;table-layout:fixed;margin:${BOSLUK_PT}pt 0;">${satirlar.join('')}</table>`;
}

function paragraf(icerik, { hizala = 'left', punto = PT_METIN, ust = BOSLUK_PT, alt = BOSLUK_PT, kalin = false } = {}) {
    const stil = [
        `text-align:${hizala}`,
        `font-size:${punto}pt`,
        `margin:${ust}pt 0 ${alt}pt 0`,
        kalin ? 'font-weight:bold' : ''
    ].filter(Boolean).join(';');
    return `<p style="${stil}">${icerik}</p>`;
}

// "Yalnız ... Türk Lirasıdır." - sağa hizalı, sayının okunuşu kalın
function yaziylaTutar(tutar) {
    const okunus = rg.sayiyiYaziyaCevir(tutar).toLocaleUpperCase('tr-TR');
    return paragraf(`Yalnız <b>${html(okunus)}</b> Türk Lirasıdır.`, { hizala: 'right', ust: 0 });
}

function toplamSatiri(etiket, tutar) {
    return paragraf(`<b>${html(etiket)}</b>${html(rg.formatParaTR(tutar))} TL`, { hizala: 'right' });
}

// Yapı bilgileri tablosu - Word'deki sütun seti ve genişlik oranlarıyla aynı
function yapiTablosu(yapilar, tekYapi) {
    const eksikImalatVar = yapilar.some(y => parseFloat(y.eksikImalatOrani) > 0);

    const sutunlar = [];
    if (!tekYapi) sutunlar.push({ anahtar: 'yapiNo', baslik: 'Y. NO', hizala: 'center', deger: y => html(y.yapiNo || '') });
    sutunlar.push({ anahtar: 'yapiAdi', baslik: 'YAPI ADI', hizala: 'center', deger: y => html(y.yapiAdi || '') });
    sutunlar.push({ anahtar: 'yapiSinifi', baslik: 'Y. SINF.', hizala: 'center', deger: y => html([y.yapiSinifi, y.yapiGrubu].filter(s => s).join(' ')) });
    sutunlar.push({ anahtar: 'birimFiyat', baslik: 'BİRİM FİYATI', hizala: 'right', deger: y => html(rg.formatParaTRKurusuz(y.birimFiyat) + ' TL') });
    sutunlar.push({ anahtar: 'yapiAlani', baslik: 'YAPI ALANI', hizala: 'center', deger: y => html(rg.formatYapiAlani(y.yapiAlani) + ' m²') });
    sutunlar.push({ anahtar: 'yapiYasi', baslik: 'YAPI YAŞI', hizala: 'center', deger: y => html(rg.getYapiYasiAraligi(y.yapiYasi)) });
    sutunlar.push({ anahtar: 'yapimTeknigi', baslik: 'Y. TEK.', hizala: 'center', deger: y => html(rg.kisaltYapimTeknigi(y.yapimTeknigi)) });
    sutunlar.push({ anahtar: 'yipranmaPay', baslik: 'YIPR PAYI', hizala: 'center', deger: y => html(rg.formatOran(y.yipranmaPay)) });
    if (eksikImalatVar) sutunlar.push({ anahtar: 'eksikImalat', baslik: 'EKS. İM.', hizala: 'center', deger: y => html(rg.formatOran(y.eksikImalatOrani)) });
    if (!tekYapi) sutunlar.push({ anahtar: 'yapiBedeli', baslik: 'YAPI BEDELİ', hizala: 'right', deger: y => html(rg.formatParaTRKurusuz(parseFloat(y.yapiBedeli) || 0) + ' TL') });

    const oranlar = rg.sutunOranlari(sutunlar.map(s => s.anahtar));

    const baslikSatiri = '<tr>' + sutunlar.map((s, i) =>
        hucre(html(s.baslik), { baslik: true, genislik: oranlar[i] })).join('') + '</tr>';

    const satirlar = yapilar.map(yapi => '<tr>' + sutunlar.map((s, i) =>
        hucre(s.deger(yapi), { hizala: s.hizala, genislik: oranlar[i] })).join('') + '</tr>');

    return tablo([baslikSatiri, ...satirlar]);
}

// Çoklu parsel tablosu - generateCokluParselReport ile aynı sütunlar
function cokluParselTablosu(parseller) {
    const eksikImalatVar = parseller.some(p => (p.yapilar || []).some(y => parseFloat(y.eksikImalatOrani) > 0));

    const basliklar = ['ADA', 'PARSEL', 'Y.NO', 'YAPI ADI', 'SINIFI', 'B.FİYAT', 'ALAN', 'YIPR.'];
    if (eksikImalatVar) basliklar.push('EKS.İM.');
    basliklar.push('YAPI BEDELİ');

    const satirlar = ['<tr>' + basliklar.map(b => hucre(html(b), { baslik: true })).join('') + '</tr>'];
    let genelToplam = 0;

    parseller.forEach(parsel => {
        let araToplam = 0;
        (parsel.yapilar || []).forEach((yapi, index) => {
            const yapiBedeli = parseFloat(yapi.yapiBedeli) || 0;
            araToplam += yapiBedeli;

            const hucreler = [
                hucre(html(index === 0 ? (parsel.ada || '') : '')),
                hucre(html(index === 0 ? (parsel.parsel || '') : '')),
                hucre(html(yapi.yapiNo || '')),
                hucre(html(yapi.yapiAdi || '')),
                hucre(html([yapi.yapiSinifi, yapi.yapiGrubu].filter(s => s).join(' '))),
                hucre(html(rg.formatParaTRKurusuz(yapi.birimFiyat)), { hizala: 'right' }),
                hucre(html(rg.formatYapiAlani(yapi.yapiAlani))),
                hucre(html(rg.formatOran(yapi.yipranmaPay)))
            ];
            if (eksikImalatVar) hucreler.push(hucre(html(rg.formatOran(yapi.eksikImalatOrani))));
            hucreler.push(hucre(html(rg.formatParaTRKurusuz(yapiBedeli) + ' TL'), { hizala: 'right' }));

            satirlar.push('<tr>' + hucreler.join('') + '</tr>');
        });

        genelToplam += araToplam;

        const araToplamHucreleri = [hucre(''), hucre(''), hucre(''), hucre(''), hucre(''), hucre(''), hucre('')];
        if (eksikImalatVar) araToplamHucreleri.push(hucre(''));
        araToplamHucreleri.push(hucre('<b>Ara Toplam</b>'));
        araToplamHucreleri.push(hucre(`<b>${html(rg.formatParaTRKurusuz(araToplam))} TL</b>`, { hizala: 'right' }));
        satirlar.push('<tr>' + araToplamHucreleri.join('') + '</tr>');
    });

    const genelHucreler = [hucre(''), hucre(''), hucre(''), hucre(''), hucre(''), hucre(''), hucre('')];
    if (eksikImalatVar) genelHucreler.push(hucre(''));
    genelHucreler.push(hucre('<b>GENEL TOPLAM</b>'));
    genelHucreler.push(hucre(`<b>${html(rg.formatParaTRKurusuz(genelToplam))} TL</b>`, { hizala: 'right' }));
    satirlar.push('<tr>' + genelHucreler.join('') + '</tr>');

    return tablo(satirlar);
}

// Taşınmaz bilgileri tablosu - 12 punto, eşit sütun genişlikleri
function tasinmazTablosu(rapor) {
    const basliklar = ['İL', 'İLÇE', 'MAHALLE', 'ADA', 'PARSEL'];
    const degerler = [
        rapor.ili || 'Samsun',
        rg.bashariBuyukTR(rapor.ilce || ''),
        rapor.mahalle || '',
        rapor.ada || '',
        rapor.parsel || ''
    ];
    if (rapor.yuzolcumu) {
        basliklar.push('YÜZÖLÇÜMÜ');
        degerler.push(rapor.yuzolcumu);
    }
    if (rapor.malik) {
        basliklar.push('MALİK');
        degerler.push(rapor.malik);
    }

    const genislik = Math.round(10000 / basliklar.length) / 100;
    const ayar = { genislik, punto: PT_TABLO_TASINMAZ };

    return tablo([
        '<tr>' + basliklar.map(b => hucre(html(b), Object.assign({ baslik: true }, ayar))).join('') + '</tr>',
        '<tr>' + degerler.map(d => hucre(html(d), ayar)).join('') + '</tr>'
    ]);
}

function imzaTablosu(raportorAdlari, raportorUnvanlari) {
    const sayi = Math.min(raportorAdlari.length, raportorUnvanlari.length, 4);
    if (sayi === 0) return '';
    const genislik = Math.round(10000 / sayi) / 100;
    return tablo([
        '<tr>' + Array.from({ length: sayi }, (_, i) => hucre(html(raportorAdlari[i] || ''), { genislik })).join('') + '</tr>',
        '<tr>' + Array.from({ length: sayi }, (_, i) => hucre(html(raportorUnvanlari[i] || ''), { genislik })).join('') + '</tr>'
    ]);
}

// Fotoğraf sayfaları - Word'deki gibi 4'erli (2x2) ve her grup yeni sayfada
function fotografSayfalari(fotograflar) {
    if (!fotograflar || fotograflar.length === 0) return '';

    const parcalar = [];
    const toplamSayfa = Math.ceil(fotograflar.length / 4);

    for (let i = 0; i < fotograflar.length; i += 4) {
        const sayfa = fotograflar.slice(i, i + 4);
        const satirlar = [];

        for (let satir = 0; satir < 2; satir++) {
            const hucreler = [];
            for (let sutun = 0; sutun < 2; sutun++) {
                const foto = sayfa[satir * 2 + sutun];
                let icerik = '';
                if (foto && foto.data) {
                    const boyut = rg.hesaplaFotografBoyutu(foto.width, foto.height, foto.isLandscape);
                    icerik = `<img src="${html(foto.data)}" style="width:${boyut.width}px;height:${boyut.height}px;display:block;margin:0 auto;">`;
                    if (foto.aciklama) {
                        icerik += `<div style="text-align:center;font-size:10pt;font-style:italic;margin-top:3pt;">${html(foto.aciklama)}</div>`;
                    }
                }
                hucreler.push(hucre(icerik, { genislik: 50 }));
            }
            satirlar.push('<tr>' + hucreler.join('') + '</tr>');
        }

        parcalar.push(
            `<div style="page-break-before:always;border-top:2px dashed #bbb;margin-top:20pt;padding-top:20pt;">` +
            paragraf(`FOTOĞRAFLAR (${Math.floor(i / 4) + 1}/${toplamSayfa})`, { hizala: 'center', punto: PT_BASLIK, kalin: true, ust: 0, alt: 10 }) +
            tablo(satirlar) +
            `</div>`
        );
    }

    return parcalar.join('');
}

/**
 * Rapor verisinden Word çıktısının HTML karşılığını üretir.
 *
 * Rapor nesnesi hem veritabanı satırı (yapilarJSON / parsellerJSON / yapiBedeli)
 * hem de editörden toplanmış canlı veri (yapilar / parseller / toplamYapiBedeli)
 * biçiminde gelebilir.
 */
function raporOnizlemeHTML(rapor) {
    if (!rapor) return '';

    const cokluParsel = rapor.cokluParsel === true || rapor.cokluParsel === 1 || rapor.cokluParsel === '1';

    const diziAl = (dizi, json) => {
        if (Array.isArray(dizi)) return dizi;
        if (typeof json === 'string' && json) {
            try { return JSON.parse(json); } catch (e) { return []; }
        }
        return Array.isArray(json) ? json : [];
    };

    const yapilar = diziAl(rapor.yapilar, rapor.yapilarJSON);
    const parseller = diziAl(rapor.parseller, rapor.parsellerJSON);
    const fotograflar = diziAl(rapor.fotograflar, rapor.fotograflarJSON);

    const toplamYapiBedeli = parseFloat(rapor.yapiBedeli ?? rapor.toplamYapiBedeli) || 0;
    const levazimBedeli = toplamYapiBedeli * 0.7 * 0.75;
    const asgariLevazim = rapor.asgariLevazimHesapla === 1 || rapor.asgariLevazimHesapla === '1' || rapor.asgariLevazimHesapla === true;

    const raportorAdlari = (rapor.raportorAdi || '').split(',').map(s => s.trim()).filter(s => s);
    const raportorUnvanlari = (rapor.raportorUnvani || '').split(',').map(s => s.trim()).filter(s => s);

    const ozne = cokluParsel ? 'taşınmazlar' : 'taşınmaz';
    const bedelMetni = asgariLevazim
        ? ' yılı fiyatlarına göre yapı bedeli ve Asgari Levazım Bedeli aşağıdaki şekilde hesaplanmıştır:'
        : ' yılı fiyatlarına göre yapı bedeli aşağıdaki şekilde hesaplanmıştır:';

    const sonParagraf = asgariLevazim
        ? `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${rg.formatTarih(rapor.resmiGazeteTarih)} tarih ve ${rapor.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${rapor.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ ve 2015/1 sayılı Milli Emlak Genelgesi esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir. ${rg.formatTarih(rapor.raporTarihi)}`
        : `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${rg.formatTarih(rapor.resmiGazeteTarih)} tarih ve ${rapor.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${rapor.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir. ${rg.formatTarih(rapor.raporTarihi)}`;

    const parcalar = [];

    parcalar.push(paragraf('KIYMET TAKDİR RAPORU', { hizala: 'center', punto: PT_BASLIK, kalin: true, ust: 0 }));
    parcalar.push(paragraf('Gerekçe:', { kalin: true }));
    parcalar.push(paragraf(
        html(`Bu rapor, ${rapor.ilgiliKurum || ''} ${rg.formatTarih(rapor.resmiYaziTarihi)} tarih ${rapor.resmiYaziSayisi || ''} sayılı yazısına istinaden hazırlanmıştır.`),
        { hizala: 'justify', ust: 0 }
    ));
    parcalar.push(paragraf(
        `${html(`Bahse konu ${ozne} ile ilgili yerinde ve edinilen bilgiler ile `)}<b>${html(rapor.hesapYili || '')}</b>${html(bedelMetni)}`,
        { hizala: 'justify', ust: 0 }
    ));

    if (!cokluParsel) {
        parcalar.push(paragraf('Taşınmaz Bilgileri:', { kalin: true }));
        parcalar.push(tasinmazTablosu(rapor));
    }

    parcalar.push(paragraf('Yapı Bilgileri ve Hesaplamalar:', { kalin: true }));
    parcalar.push(cokluParsel ? cokluParselTablosu(parseller) : yapiTablosu(yapilar, yapilar.length === 1));

    parcalar.push(toplamSatiri('TOPLAM YAPI BEDELİ: ', toplamYapiBedeli));
    parcalar.push(yaziylaTutar(toplamYapiBedeli));

    if (asgariLevazim) {
        parcalar.push(toplamSatiri('TOPLAM ASGARİ LEVAZIM BEDELİ (Toplam Bedel x 0,7 x 0,75) : ', levazimBedeli));
        parcalar.push(yaziylaTutar(levazimBedeli));
    }

    parcalar.push(paragraf(html(sonParagraf), { hizala: 'justify' }));
    parcalar.push('<p style="margin:0;">&nbsp;</p>');
    parcalar.push(imzaTablosu(raportorAdlari, raportorUnvanlari));

    if (fotograflar.length > 0) {
        parcalar.push(paragraf('Ek: Fotoğraflar', { ust: 12, alt: 0 }));
        parcalar.push(fotografSayfalari(fotograflar));
    }

    return `<div class="wd-onizleme" style="line-height:1.2;">${parcalar.join('')}</div>`;
}

module.exports = { raporOnizlemeHTML };
