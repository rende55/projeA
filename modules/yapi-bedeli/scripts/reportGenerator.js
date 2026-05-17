const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, Packer, BorderStyle, VerticalAlign, ImageRun, PageBreak } = require('docx');
const fs = require('fs');
const path = require('path');

// Fotoğraf boyutlarını hesapla (piksel cinsinden, en-boy oranını koruyarak)
// Landscape: max genişlik 280 piksel (yaklaşık 7.5 cm @ 96 DPI)
// Portrait: max yükseklik 380 piksel (yaklaşık 10 cm @ 96 DPI)
function hesaplaFotografBoyutu(width, height, isLandscape) {
    // docx kütüphanesi piksel değerleri bekliyor
    // 96 DPI'da: 1 cm ≈ 37.8 piksel
    const maxGenislikPx = 280; // ~7.5 cm
    const maxYukseklikPx = 380; // ~10 cm
    
    let yeniGenislik, yeniYukseklik;
    const oran = width / height;
    
    if (isLandscape) {
        // Yatay fotoğraf: max genişlik 280px
        yeniGenislik = maxGenislikPx;
        yeniYukseklik = maxGenislikPx / oran;
        
        // Yükseklik max'ı geçerse, yüksekliğe göre ayarla
        if (yeniYukseklik > maxYukseklikPx) {
            yeniYukseklik = maxYukseklikPx;
            yeniGenislik = maxYukseklikPx * oran;
        }
    } else {
        // Dikey fotoğraf: max yükseklik 380px
        yeniYukseklik = maxYukseklikPx;
        yeniGenislik = maxYukseklikPx * oran;
        
        // Genişlik max'ı geçerse, genişliğe göre ayarla
        if (yeniGenislik > maxGenislikPx) {
            yeniGenislik = maxGenislikPx;
            yeniYukseklik = maxGenislikPx / oran;
        }
    }
    
    return {
        width: Math.round(yeniGenislik),
        height: Math.round(yeniYukseklik)
    };
}

// Base64 data URL'den buffer'a çevir
function base64ToBuffer(dataUrl) {
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
}

// Sayıyı yazıya çevirme fonksiyonu (Türkçe)
function sayiyiYaziyaCevir(sayi) {
    if (!sayi || isNaN(sayi)) return '';
    
    const birler = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const basamaklar = [
        { deger: 1000000000, isim: 'milyar' },
        { deger: 1000000, isim: 'milyon' },
        { deger: 1000, isim: 'bin' }
    ];
    
    let sonuc = '';
    let kalan = Math.floor(sayi);
    
    if (kalan === 0) return 'sıfır';
    
    // Basamakları işle
    for (let basamak of basamaklar) {
        if (kalan >= basamak.deger) {
            let bolum = Math.floor(kalan / basamak.deger);
            
            if (basamak.deger === 1000 && bolum === 1) {
                sonuc += 'bin ';
            } else {
                sonuc += ucBasamakYaziyaCevir(bolum) + ' ' + basamak.isim + ' ';
            }
            
            kalan = kalan % basamak.deger;
        }
    }
    
    // Kalanları ekle (0-999 arası)
    if (kalan > 0) {
        sonuc += ucBasamakYaziyaCevir(kalan);
    }
    
    return sonuc.trim();
}

function ucBasamakYaziyaCevir(sayi) {
    const birler = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    const yuzler = ['', 'yüz', 'iki yüz', 'üç yüz', 'dört yüz', 'beş yüz', 'altı yüz', 'yedi yüz', 'sekiz yüz', 'dokuz yüz'];
    
    let sonuc = '';
    let yuz = Math.floor(sayi / 100);
    let on = Math.floor((sayi % 100) / 10);
    let bir = sayi % 10;
    
    if (yuz > 0) {
        sonuc += yuzler[yuz] + ' ';
    }
    if (on > 0) {
        sonuc += onlar[on] + ' ';
    }
    if (bir > 0) {
        sonuc += birler[bir] + ' ';
    }
    
    return sonuc.trim();
}

// Tarihi formatla (DD.MM.YYYY)
function formatTarih(tarih) {
    if (!tarih) return '';
    const d = new Date(tarih);
    const gun = String(d.getDate()).padStart(2, '0');
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const yil = d.getFullYear();
    return `${gun}.${ay}.${yil}`;
}

// Para formatla - Türkçe format (nokta basamak ayracı, virgül kuruş ayracı)
function formatParaTR(deger) {
    const sayi = parseFloat(deger) || 0;
    // Önce sayıyı 2 ondalık basamakla formatla
    const parts = sayi.toFixed(2).split('.');
    // Tam kısmı nokta ile ayır
    const tamKisim = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    // Kuruş kısmını virgül ile ekle
    return tamKisim + ',' + parts[1];
}

// Para formatla - Türkçe format KURUŞSUZ (sadece tam sayı)
function formatParaTRKurusuz(deger) {
    const sayi = parseFloat(deger) || 0;
    const tamKisim = Math.round(sayi).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return tamKisim;
}

// Yapı alanını formatla (Ondalık yoksa .00 gösterme, binlik ayır)
function formatYapiAlani(deger) {
    const sayi = parseFloat(deger) || 0;
    return sayi.toLocaleString('tr-TR', { maximumFractionDigits: 2 });
}

// Oran formatla (% 25 gibi boşluklu)
function formatOran(deger) {
    const oran = parseFloat(deger) || 0;
    return '% ' + oran;
}

// Yapım tekniği kısaltmaları
function kisaltYapimTeknigi(teknik) {
    if (!teknik) return '';
    const map = {
        'Betonarme Karkas': 'B.Arme',
        'Yığma Kagir': 'Yığma',
        'Yığma Yarı Kagir': 'Yarı Kagir',
        'Ahşap': 'Ahşap',
        'Taş Duvarlı (Çamur Harçlı)': 'Taş Duv.',
        'Kerpiç': 'Kerpiç',
        'Diğer Basit Binalar': 'Basit B.',
        'Çelik': 'Çelik'
    };
    return map[teknik] || teknik;
}

// Yapı yaşı aralığı hesapla
function getYapiYasiAraligi(yasDegheri) {
    if (!yasDegheri && yasDegheri !== 0) return '';
    const yas = parseInt(yasDegheri, 10);
    if (isNaN(yas)) return yasDegheri; // Zaten string formatındaysa (örn. 0-3 yaş) olduğu gibi döndür
    
    if (yas >= 0 && yas <= 3) return '0-3';
    if (yas >= 4 && yas <= 5) return '4-5';
    if (yas >= 6 && yas <= 10) return '6-10';
    if (yas >= 11 && yas <= 15) return '11-15';
    if (yas >= 16 && yas <= 20) return '16-20';
    if (yas >= 21 && yas <= 30) return '21-30';
    if (yas >= 31 && yas <= 40) return '31-40';
    if (yas >= 41 && yas <= 50) return '41-50';
    if (yas >= 51 && yas <= 75) return '51-75';
    if (yas > 75) return '75 üstü';
    return String(yas);
}

// Fotoğraf sayfaları oluştur (2x2 tablo formatında)
function olusturFotografSayfalari(fotograflar) {
    console.log('📷 olusturFotografSayfalari çağrıldı, fotoğraf sayısı:', fotograflar?.length || 0);
    
    if (!fotograflar || fotograflar.length === 0) {
        console.log('⚠️ Fotoğraf yok, boş dizi döndürülüyor');
        return [];
    }
    
    const sections = [];
    const fotografPerSayfa = 4; // Her sayfada 4 fotoğraf (2x2)
    
    // Fotoğrafları 4'erli gruplara böl
    for (let i = 0; i < fotograflar.length; i += fotografPerSayfa) {
        const sayfaFotograflari = fotograflar.slice(i, i + fotografPerSayfa);
        
        // 2x2 tablo için satırları oluştur
        const tableRows = [];
        
        for (let row = 0; row < 2; row++) {
            const cellsForRow = [];
            
            for (let col = 0; col < 2; col++) {
                const fotoIndex = row * 2 + col;
                const foto = sayfaFotograflari[fotoIndex];
                
                if (foto && foto.data) {
                    try {
                        const boyut = hesaplaFotografBoyutu(foto.width, foto.height, foto.isLandscape);
                        const imageBuffer = base64ToBuffer(foto.data);
                        
                        console.log(`📷 Fotoğraf işleniyor: ${foto.name}, boyut: ${boyut.width}x${boyut.height}, buffer: ${imageBuffer.length} bytes`);
                        
                        const cellChildren = [
                            new Paragraph({
                                alignment: AlignmentType.CENTER,
                                children: [
                                    new ImageRun({
                                        data: imageBuffer,
                                        transformation: {
                                            width: boyut.width,
                                            height: boyut.height
                                        }
                                    })
                                ]
                            })
                        ];
                        
                        // Açıklama varsa ekle
                        if (foto.aciklama) {
                            cellChildren.push(
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    spacing: { before: 60 },
                                    children: [
                                        new TextRun({ 
                                            text: foto.aciklama, 
                                            size: 20,
                                            italics: true
                                        })
                                    ]
                                })
                            );
                        }
                        
                        cellsForRow.push(
                            new TableCell({
                                children: cellChildren,
                                verticalAlign: VerticalAlign.CENTER,
                                width: { size: 50, type: WidthType.PERCENTAGE }
                            })
                        );
                    } catch (imgError) {
                        console.error('Fotoğraf işleme hatası:', imgError);
                        // Hata durumunda boş hücre
                        cellsForRow.push(
                            new TableCell({
                                children: [new Paragraph({ text: '' })],
                                width: { size: 50, type: WidthType.PERCENTAGE }
                            })
                        );
                    }
                } else {
                    // Boş hücre
                    cellsForRow.push(
                        new TableCell({
                            children: [new Paragraph({ text: '' })],
                            width: { size: 50, type: WidthType.PERCENTAGE }
                        })
                    );
                }
            }
            
            tableRows.push(new TableRow({ children: cellsForRow }));
        }
        
        // Sayfa numarası hesapla
        const sayfaNo = Math.floor(i / fotografPerSayfa) + 1;
        const toplamSayfa = Math.ceil(fotograflar.length / fotografPerSayfa);
        
        sections.push({
            children: [
                // Sayfa başlığı
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 },
                    children: [
                        new TextRun({ 
                            text: `FOTOĞRAFLAR (${sayfaNo}/${toplamSayfa})`, 
                            bold: true, 
                            size: 28 
                        })
                    ]
                }),
                
                // 2x2 Fotoğraf tablosu
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: tableRows
                })
            ]
        });
    }
    
    return sections;
}

// Rapor oluştur - KT_Sablon_1.docx formatında
function generateReport(raporData, outputPath, fotograflar = []) {
    // Çoklu parsel modunda farklı rapor oluştur
    if (raporData.cokluParsel || raporData.cokluParsel === 1 || raporData.cokluParsel === '1') {
        return generateCokluParselReport(raporData, outputPath, fotograflar);
    }
    
    try {
        // Yapı verilerini parse et
        let yapilarData = [];
        if (raporData.yapilarJSON) {
            try {
                yapilarData = JSON.parse(raporData.yapilarJSON);
            } catch (e) {
                console.error('Yapılar JSON parse hatası:', e);
                // Eski format için fallback
                yapilarData = [{
                    yapiNo: raporData.yapiNo || '1',
                    yapiAdi: raporData.yapiAdi || '',
                    yapiYasi: raporData.yapiYasi || '',
                    yapiSinifi: raporData.yapiSinifi || '',
                    yapiGrubu: raporData.yapiGrubu || '',
                    yapimTeknigi: raporData.yapimTeknigi || '',
                    yapiAlani: raporData.yapiAlani || '',
                    birimFiyat: raporData.birimFiyat || '',
                    eksikImalatOrani: raporData.eksikImalatOrani || '',
                    yipranmaPay: raporData.yipranmaPay || '',
                    yapiBedeli: raporData.yapiBedeli || '0'
                }];
            }
        }
        
        // Hesaplamalar
        const toplamYapiBedeli = parseFloat(raporData.yapiBedeli) || 0;
        const levazimBedeli = toplamYapiBedeli * 0.7 * 0.75;
        const asgariLevazimHesapla = raporData.asgariLevazimHesapla === 1 || raporData.asgariLevazimHesapla === '1' || raporData.asgariLevazimHesapla === true;
        
        // Raportör bilgilerini parse et
        const raportorAdlari = (raporData.raportorAdi || '').split(',').map(s => s.trim()).filter(s => s);
        const raportorUnvanlari = (raporData.raportorUnvani || '').split(',').map(s => s.trim()).filter(s => s);
        const raportorSayisi = Math.min(raportorAdlari.length, raportorUnvanlari.length, 4); // Max 4 raportör
        
        // Fotoğraf sayfalarını oluştur
        console.log('📷 generateReport - Gelen fotoğraf sayısı:', fotograflar?.length || 0);
        const fotografSayfalari = olusturFotografSayfalari(fotograflar);
        console.log('📷 Oluşturulan fotoğraf sayfası sayısı:', fotografSayfalari.length);
        
        const doc = new Document({
            sections: [{
                children: [
                    // Başlık - Ortalanmış, Bold, 14pt (28 half-points)
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: "KIYMET TAKDİR RAPORU",
                                bold: true,
                                size: 28
                            })
                        ]
                    }),
                    
                    // Gerekçe Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "Gerekçe:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Gerekçe paragrafı - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: `Bu rapor, ${raporData.ilgiliKurum || ''} ${formatTarih(raporData.resmiYaziTarihi)} tarih ${raporData.resmiYaziSayisi || ''} sayılı yazısına istinaden hazırlanmıştır.`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Açıklama paragrafı - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: asgariLevazimHesapla 
                                    ? `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile ${raporData.hesapYili || ''} yılı fiyatlarına göre yapı bedeli ve Asgari Levazım Bedeli aşağıdaki şekilde hesaplanmıştır:`
                                    : `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile ${raporData.hesapYili || ''} yılı fiyatlarına göre yapı bedeli aşağıdaki şekilde hesaplanmıştır:`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Taşınmaz Bilgileri Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "Taşınmaz Bilgileri:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Taşınmaz Bilgileri Tablosu
                    (function() {
                        const basliklar = ["İL", "İLÇE", "MAHALLE", "ADA", "PARSEL"];
                        const degerler = [
                            raporData.ili || 'Samsun',
                            raporData.ilce || '',
                            raporData.mahalle || '',
                            raporData.ada || '',
                            raporData.parsel || ''
                        ];
                        
                        if (raporData.yuzolcumu) {
                            basliklar.push("YÜZÖLÇÜMÜ");
                            degerler.push(raporData.yuzolcumu);
                        }
                        if (raporData.malik) {
                            basliklar.push("MALİK");
                            degerler.push(raporData.malik);
                        }
                        
                        return new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: basliklar.map(baslik => 
                                        new TableCell({ 
                                            children: [new Paragraph({ 
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ text: baslik, bold: true, size: 22 })]
                                            })] 
                                        })
                                    )
                                }),
                                new TableRow({
                                    children: degerler.map(deger => 
                                        new TableCell({ 
                                            children: [new Paragraph({ 
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ text: String(deger), size: 22 })]
                                            })] 
                                        })
                                    )
                                })
                            ]
                        });
                    })(),
                    
                    // Yapı Bilgileri Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "Yapı Bilgileri ve Hesaplamalar:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Yapı Bilgileri Tablosu - Çoklu yapı desteği
                    (function() {
                        const isSingleYapi = yapilarData.length === 1;
                        const showEksikImalat = yapilarData.some(y => parseFloat(y.eksikImalatOrani) > 0);
                        
                        const baslikSatiri = [];
                        if (!isSingleYapi) baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Y. NO", bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI ADI", bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI SINIFI", bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${raporData.hesapYili || ''} YILI BİRİM FİYATI`, bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI ALANI", bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI YAŞI", bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPIM TEKNİĞİ", bold: true, size: 22 })] })] }));
                        baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YIPR PAYI", bold: true, size: 22 })] })] }));
                        if (showEksikImalat) baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EKS. İM.", bold: true, size: 22 })] })] }));
                        if (!isSingleYapi) baslikSatiri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI BEDELİ", bold: true, size: 22 })] })] }));

                        const yapiSatirlari = yapilarData.map(yapi => {
                            const yapiSinifiGrup = [yapi.yapiSinifi, yapi.yapiGrubu].filter(s => s).join(' ');
                            const yapiBedeli = parseFloat(yapi.yapiBedeli) || 0;
                            
                            const satirHucreleri = [];
                            if (!isSingleYapi) satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(yapi.yapiNo || ''), size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(yapi.yapiAdi || ''), size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(yapiSinifiGrup), size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(formatParaTRKurusuz(yapi.birimFiyat)) + ' TL', size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(formatYapiAlani(yapi.yapiAlani)) + ' m²', size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(getYapiYasiAraligi(yapi.yapiYasi)), size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(kisaltYapimTeknigi(yapi.yapimTeknigi)), size: 22 })] })] }));
                            satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(formatOran(yapi.yipranmaPay)), size: 22 })] })] }));
                            if (showEksikImalat) satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(formatOran(yapi.eksikImalatOrani)), size: 22 })] })] }));
                            if (!isSingleYapi) satirHucreleri.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(formatParaTRKurusuz(yapiBedeli)) + ' TL', size: 22 })] })] }));
                            
                            return new TableRow({ children: satirHucreleri });
                        });

                        return new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({ children: baslikSatiri }),
                                ...yapiSatirlari
                            ]
                        });
                    })(),
                    
                    // Toplam Yapı Bedeli - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "TOPLAM YAPI BEDELİ: ", bold: true, size: 24 }),
                            new TextRun({ text: formatParaTR(toplamYapiBedeli) + ' TL', size: 24 })
                        ]
                    }),
                    
                    // Yapı Bedeli Yazıyla - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: `Yalnız ${sayiyiYaziyaCevir(toplamYapiBedeli).toLocaleUpperCase('tr-TR')} Türk Lirasıdır.`,
                                size: 24,
                                bold: true
                            })
                        ]
                    }),
                    
                    // Boş satırlar (eğer levazım hesaplanacaksa)
                    ...(asgariLevazimHesapla ? [
                        // Levazım Bedeli - Bold, 12pt (24 half-points)
                        new Paragraph({
                            spacing: { before: 120, after: 120 },
                            children: [
                                new TextRun({ text: "TOPLAM ASGARİ LEVAZIM BEDELİ (Toplam Bedel x 0,7 x 0,75) : ", bold: true, size: 24 }),
                                new TextRun({ text: formatParaTR(levazimBedeli) + ' TL', size: 24 })
                            ]
                        }),
                        
                        // Levazım Bedeli Yazıyla - 12pt (24 half-points) - İki yana yasla
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: [
                                new TextRun({
                                    text: `Yalnız ${sayiyiYaziyaCevir(levazimBedeli).toLocaleUpperCase('tr-TR')} Türk Lirasıdır.`,
                                    size: 24,
                                    bold: true
                                })
                            ]
                        })
                    ] : []),
                    
                    // Son Paragraf ve Rapor Tarihi - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({
                                text: asgariLevazimHesapla
                                    ? `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(raporData.resmiGazeteTarih)} tarih ve ${raporData.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${raporData.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ ve 2015/1 sayılı Milli Emlak Genelgesi esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir. ${formatTarih(raporData.raporTarihi)}`
                                    : `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(raporData.resmiGazeteTarih)} tarih ve ${raporData.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${raporData.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir. ${formatTarih(raporData.raporTarihi)}`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Boş satır
                    new Paragraph({ text: "" }),
                    
                    // Raportör Tablosu - Dinamik (max 4 raportör) - 11pt (22 half-points)
                    ...(raportorSayisi > 0 ? [
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                // 1. Satır: İsim Soyisim
                                new TableRow({
                                    children: Array.from({ length: raportorSayisi }, (_, i) => 
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ text: raportorAdlari[i] || '', size: 22 })]
                                            })]
                                        })
                                    )
                                }),
                                // 2. Satır: Ünvan
                                new TableRow({
                                    children: Array.from({ length: raportorSayisi }, (_, i) => 
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ text: raportorUnvanlari[i] || '', size: 22 })]
                                            })]
                                        })
                                    )
                                })
                            ]
                        })
                    ] : [
                        // Eğer raportör yoksa eski sistemi kullan
                        new Paragraph({
                            spacing: { after: 120 },
                            children: [
                                new TextRun({ text: raporData.raportorAdi || '', size: 22 })
                            ]
                        }),
                        new Paragraph({
                            spacing: { after: 120 },
                            children: [
                                new TextRun({ text: raporData.raportorUnvani || '', size: 22 })
                            ]
                        })
                    ])
                ]
            },
            // Fotoğraf sayfalarını ekle (varsa)
            ...fotografSayfalari
            ]
        });
        
        // Dosyayı oluştur ve kaydet
        return Packer.toBuffer(doc).then(buffer => {
            // Dosya zaten varsa ve açıksa, farklı bir isim kullan
            let finalPath = outputPath;
            let counter = 1;
            const MAX_ATTEMPTS = 10; // Maksimum 10 deneme
            
            while (fs.existsSync(finalPath) && counter <= MAX_ATTEMPTS) {
                try {
                    // Dosyanın açık olup olmadığını test et
                    const fd = fs.openSync(finalPath, 'r+');
                    fs.closeSync(fd);
                    // Dosya açık değil, üzerine yazabiliriz
                    break;
                } catch (err) {
                    if (err.code === 'EBUSY' || err.code === 'EPERM') {
                        // Dosya açık, farklı bir isim dene
                        const ext = path.extname(outputPath);
                        const base = outputPath.replace(ext, '');
                        finalPath = `${base}_${counter}${ext}`;
                        counter++;
                        console.log(`⚠️ Dosya açık, yeni isim deneniyor: ${finalPath} (Deneme ${counter}/${MAX_ATTEMPTS})`);
                    } else {
                        break;
                    }
                }
            }
            
            // Maksimum deneme sayısına ulaşıldıysa hata döndür
            if (counter > MAX_ATTEMPTS) {
                const errorMsg = `Maksimum ${MAX_ATTEMPTS} deneme yapıldı, tüm dosyalar açık veya kilitli. Lütfen açık Word dosyalarını kapatın.`;
                console.error('❌ ' + errorMsg);
                return { success: false, error: errorMsg };
            }
            
            try {
                fs.writeFileSync(finalPath, buffer);
                console.log('✅ Rapor oluşturuldu:', finalPath);
                return { success: true, path: finalPath };
            } catch (writeError) {
                console.error('Rapor kaydetme hatası:', writeError);
                return { success: false, error: writeError.message };
            }
        }).catch(error => {
            console.error('Rapor oluşturma hatası:', error);
            return { success: false, error: error.message };
        });
        
    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        return Promise.resolve({ success: false, error: error.message });
    }
}

// Çoklu Parsel Raporu Oluştur
function generateCokluParselReport(raporData, outputPath, fotograflar = []) {
    try {
        // Parsel verilerini parse et
        let parsellerData = [];
        if (raporData.parsellerJSON) {
            try {
                parsellerData = JSON.parse(raporData.parsellerJSON);
            } catch (e) {
                console.error('Parseller JSON parse hatası:', e);
            }
        }
        
        // Hesaplamalar
        const toplamYapiBedeli = parseFloat(raporData.yapiBedeli) || 0;
        const levazimBedeli = toplamYapiBedeli * 0.7 * 0.75;
        const asgariLevazimHesapla = raporData.asgariLevazimHesapla === 1 || raporData.asgariLevazimHesapla === '1' || raporData.asgariLevazimHesapla === true;
        
        // Raportör bilgilerini parse et
        const raportorAdlari = (raporData.raportorAdi || '').split(',').map(s => s.trim()).filter(s => s);
        const raportorUnvanlari = (raporData.raportorUnvani || '').split(',').map(s => s.trim()).filter(s => s);
        const raportorSayisi = Math.min(raportorAdlari.length, raportorUnvanlari.length, 4);
        
        // Fotoğraf sayfalarını oluştur
        const fotografSayfalari = olusturFotografSayfalari(fotograflar);
        
        // Yazı Tipi Boyutu: 11 punto = 22 half-points
        const fontSize = 22;
        const fontSizeBold = 22;
        
        // Çoklu parsel tablosunda genel çapta eksik imalat sütunu gösterme kontrolü
        let hasEksikImalat = false;
        parsellerData.forEach(parsel => {
            if (parsel.yapilar) {
                if (parsel.yapilar.some(y => parseFloat(y.eksikImalatOrani) > 0)) {
                    hasEksikImalat = true;
                }
            }
        });
        
        const tableRows = [];
        
        const mainBaslikRowChildren = [
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ADA", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PARSEL", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Y.NO", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI ADI", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SINIFI", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "B.FİYAT", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ALAN", bold: true, size: fontSizeBold })] })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YIPR.", bold: true, size: fontSizeBold })] })] })
        ];
        
        if (hasEksikImalat) {
            mainBaslikRowChildren.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EKS.İM.", bold: true, size: fontSizeBold })] })] }));
        }
        mainBaslikRowChildren.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI BEDELİ", bold: true, size: fontSizeBold })] })] }));
        
        tableRows.push(new TableRow({ children: mainBaslikRowChildren }));
        
        let genelToplam = 0;
        
        // Her parsel için satırlar ekle
        parsellerData.forEach(parsel => {
            let araToplam = 0;
            const yapilar = parsel.yapilar || [];
            
            yapilar.forEach((yapi, yapiIndex) => {
                const yapiSinifiGrup = [yapi.yapiSinifi, yapi.yapiGrubu].filter(s => s).join(' ');
                const yapiBedeli = parseFloat(yapi.yapiBedeli) || 0;
                araToplam += yapiBedeli;
                
                const satirChildren = [
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapiIndex === 0 ? String(parsel.ada || '') : '', size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapiIndex === 0 ? String(parsel.parsel || '') : '', size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(yapi.yapiNo || ''), size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(yapi.yapiAdi || ''), size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapiSinifiGrup, size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatParaTRKurusuz(yapi.birimFiyat), size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatYapiAlani(yapi.yapiAlani), size: fontSize })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatOran(yapi.yipranmaPay), size: fontSize })] })] })
                ];
                
                if (hasEksikImalat) {
                    satirChildren.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatOran(yapi.eksikImalatOrani), size: fontSize })] })] }));
                }
                satirChildren.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatParaTRKurusuz(yapiBedeli) + ' TL', size: fontSize })] })] }));
                
                tableRows.push(new TableRow({ children: satirChildren }));
            });
            
            genelToplam += araToplam;
            
            // Ara toplam satırı
            const araToplamChildren = [
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ text: '' })] }),
                new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Ara Toplam", bold: true, size: fontSize })] })] })
            ];
            
            if (hasEksikImalat) { 
                araToplamChildren.splice(7, 0, new TableCell({ children: [new Paragraph({ text: '' })] })); 
            }
            
            araToplamChildren.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatParaTRKurusuz(araToplam) + ' TL', bold: true, size: fontSize })] })] }));
            
            tableRows.push(new TableRow({ children: araToplamChildren }));
        });
        
        // Genel toplam satırı
        const genelToplamChildren = [
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ text: '' })] }),
            new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "GENEL TOPLAM", bold: true, size: fontSizeBold })] })] })
        ];
        
        if (hasEksikImalat) {
            genelToplamChildren.splice(7, 0, new TableCell({ children: [new Paragraph({ text: '' })] })); 
        }
        
        genelToplamChildren.push(new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: formatParaTRKurusuz(genelToplam) + ' TL', bold: true, size: fontSizeBold })] })] }));
        
        tableRows.push(new TableRow({ children: genelToplamChildren }));
        
        const doc = new Document({
            sections: [{
                children: [
                    // Başlık - Ortalanmış, Bold, 14pt (28 half-points)
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: "KIYMET TAKDİR RAPORU",
                                bold: true,
                                size: 28
                            })
                        ]
                    }),
                    
                    // Gerekçe Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "Gerekçe:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Gerekçe paragrafı
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: `Bu rapor, ${raporData.ilgiliKurum || ''} ${formatTarih(raporData.resmiYaziTarihi)} tarih ${raporData.resmiYaziSayisi || ''} sayılı yazısına istinaden hazırlanmıştır.`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Açıklama paragrafı
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: asgariLevazimHesapla 
                                    ? `Bahse konu taşınmazlar ile ilgili yerinde ve edinilen bilgiler ile ${raporData.hesapYili || ''} yılı fiyatlarına göre yapı bedeli ve Asgari Levazım Bedeli aşağıdaki şekilde hesaplanmıştır:`
                                    : `Bahse konu taşınmazlar ile ilgili yerinde ve edinilen bilgiler ile ${raporData.hesapYili || ''} yılı fiyatlarına göre yapı bedeli aşağıdaki şekilde hesaplanmıştır:`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Yapı Bilgileri Başlık
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "Yapı Bilgileri ve Hesaplamalar:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Çoklu Parsel Yapı Tablosu (10 punto)
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: tableRows
                    }),
                    
                    // Toplam Yapı Bedeli
                    new Paragraph({
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({ text: "TOPLAM YAPI BEDELİ: ", bold: true, size: 24 }),
                            new TextRun({ text: formatParaTR(toplamYapiBedeli) + ' TL', size: 24 })
                        ]
                    }),
                    
                    // Yapı Bedeli Yazıyla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: `Yalnız ${sayiyiYaziyaCevir(toplamYapiBedeli).toLocaleUpperCase('tr-TR')} Türk Lirasıdır.`,
                                size: 24,
                                bold: true
                            })
                        ]
                    }),
                    
                    // Asgari Levazım (varsa)
                    ...(asgariLevazimHesapla ? [
                        new Paragraph({
                            spacing: { before: 120, after: 120 },
                            children: [
                                new TextRun({ text: "TOPLAM ASGARİ LEVAZIM BEDELİ (Toplam Bedel x 0,7 x 0,75) : ", bold: true, size: 24 }),
                                new TextRun({ text: formatParaTR(levazimBedeli) + ' TL', size: 24 })
                            ]
                        }),
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 120 },
                            children: [
                                new TextRun({
                                    text: `Yalnız ${sayiyiYaziyaCevir(levazimBedeli).toLocaleUpperCase('tr-TR')} Türk Lirasıdır.`,
                                    size: 24,
                                    bold: true
                                })
                            ]
                        })
                    ] : []),
                    
                    // Son Paragraf
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { before: 120, after: 120 },
                        children: [
                            new TextRun({
                                text: asgariLevazimHesapla
                                    ? `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(raporData.resmiGazeteTarih)} tarih ve ${raporData.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${raporData.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ ve 2015/1 sayılı Milli Emlak Genelgesi esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir. ${formatTarih(raporData.raporTarihi)}`
                                    : `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(raporData.resmiGazeteTarih)} tarih ve ${raporData.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${raporData.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir. ${formatTarih(raporData.raporTarihi)}`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Boş satır
                    new Paragraph({ text: "" }),
                    
                    // Raportör Tablosu
                    ...(raportorSayisi > 0 ? [
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                new TableRow({
                                    children: Array.from({ length: raportorSayisi }, (_, i) => 
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ text: raportorAdlari[i] || '', size: 22 })]
                                            })]
                                        })
                                    )
                                }),
                                new TableRow({
                                    children: Array.from({ length: raportorSayisi }, (_, i) => 
                                        new TableCell({
                                            children: [new Paragraph({
                                                alignment: AlignmentType.CENTER,
                                                children: [new TextRun({ text: raportorUnvanlari[i] || '', size: 22 })]
                                            })]
                                        })
                                    )
                                })
                            ]
                        })
                    ] : [
                        new Paragraph({
                            spacing: { after: 120 },
                            children: [
                                new TextRun({ text: raporData.raportorAdi || '', size: 22 })
                            ]
                        }),
                        new Paragraph({
                            spacing: { after: 120 },
                            children: [
                                new TextRun({ text: raporData.raportorUnvani || '', size: 22 })
                            ]
                        })
                    ])
                ]
            },
            // Fotoğraf sayfalarını ekle (varsa)
            ...fotografSayfalari
            ]
        });
        
        // Dosyayı oluştur ve kaydet
        return Packer.toBuffer(doc).then(buffer => {
            let finalPath = outputPath;
            let counter = 1;
            const MAX_ATTEMPTS = 10;
            
            while (fs.existsSync(finalPath) && counter <= MAX_ATTEMPTS) {
                try {
                    const fd = fs.openSync(finalPath, 'r+');
                    fs.closeSync(fd);
                    break;
                } catch (err) {
                    if (err.code === 'EBUSY' || err.code === 'EPERM') {
                        const ext = path.extname(outputPath);
                        const base = outputPath.replace(ext, '');
                        finalPath = `${base}_${counter}${ext}`;
                        counter++;
                    } else {
                        break;
                    }
                }
            }
            
            if (counter > MAX_ATTEMPTS) {
                const errorMsg = `Maksimum ${MAX_ATTEMPTS} deneme yapıldı, tüm dosyalar açık veya kilitli.`;
                return { success: false, error: errorMsg };
            }
            
            try {
                fs.writeFileSync(finalPath, buffer);
                console.log('✅ Çoklu parsel raporu oluşturuldu:', finalPath);
                return { success: true, path: finalPath };
            } catch (writeError) {
                console.error('Rapor kaydetme hatası:', writeError);
                return { success: false, error: writeError.message };
            }
        }).catch(error => {
            console.error('Rapor oluşturma hatası:', error);
            return { success: false, error: error.message };
        });
        
    } catch (error) {
        console.error('Çoklu parsel rapor oluşturma hatası:', error);
        return Promise.resolve({ success: false, error: error.message });
    }
}

module.exports = { generateReport, generateCokluParselReport, sayiyiYaziyaCevir, formatTarih };
