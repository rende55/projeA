const { Document, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, Packer, BorderStyle, VerticalAlign } = require('docx');
const fs = require('fs');
const path = require('path');

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
    const yuzler = ['', 'yüz', 'ikiyüz', 'üçyüz', 'dörtyüz', 'beşyüz', 'altıyüz', 'yediyüz', 'sekizyüz', 'dokuzyüz'];
    
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

// Rapor oluştur - KT_Sablon_1.docx formatında
function generateReport(raporData, outputPath) {
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
        
        const doc = new Document({
            sections: [{
                children: [
                    // Başlık - Ortalanmış, Bold, 14pt (28 half-points)
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: "KIYMET TAKDİR RAPORU",
                                bold: true,
                                size: 28
                            })
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Gerekçe Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({ text: "Gerekçe:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Gerekçe paragrafı - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: `Bu rapor, ${raporData.ilgiliKurum || ''} ${formatTarih(raporData.resmiYaziTarihi)} tarih ${raporData.resmiYaziSayisi || ''} sayılı yazısına istinaden hazırlanmıştır.`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Açıklama paragrafı - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: asgariLevazimHesapla 
                                    ? `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile ${raporData.hesapYili || ''} yılı fiyatlarına göre yapı bedeli ve Asgari Levazım Bedeli aşağıdaki şekilde hesaplanmıştır:`
                                    : `Bahse konu taşınmaz ile ilgili yerinde ve edinilen bilgiler ile ${raporData.hesapYili || ''} yılı fiyatlarına göre yapı bedeli aşağıdaki şekilde hesaplanmıştır:`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Taşınmaz Bilgileri Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({ text: "Taşınmaz Bilgileri:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Taşınmaz Bilgileri Tablosu
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            new TableRow({
                                children: [
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: "İL", bold: true, size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: "İLÇE", bold: true, size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: "MAHALLE", bold: true, size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: "ADA", bold: true, size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: "PARSEL", bold: true, size: 18 })]
                                        })] 
                                    })
                                ]
                            }),
                            new TableRow({
                                children: [
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: raporData.ili || 'Samsun', size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: raporData.ilce || '', size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: raporData.mahalle || '', size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: raporData.ada || '', size: 18 })]
                                        })] 
                                    }),
                                    new TableCell({ 
                                        children: [new Paragraph({ 
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: raporData.parsel || '', size: 18 })]
                                        })] 
                                    })
                                ]
                            })
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Yapı Bilgileri Başlık - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({ text: "Yapı Bilgileri ve Hesaplamalar:", bold: true, size: 24 })
                        ]
                    }),
                    
                    // Yapı Bilgileri Tablosu - Çoklu yapı desteği
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [
                            // Başlık satırı
                            new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Y. NO", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI ADI", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI SINIFI", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${raporData.hesapYili || ''} YILI BİRİM FİYATI`, bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI ALANI", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI YAŞI", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPIM TEKNİĞİ", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YIPR PAYI", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EKS. İM.", bold: true, size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "YAPI BEDELİ", bold: true, size: 18 })] })] })
                                ]
                            }),
                            // Her yapı için satır
                            ...yapilarData.map(yapi => new TableRow({
                                children: [
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapi.yapiNo || '', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapi.yapiAdi || '', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapi.yapiSinifi || '', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: parseFloat(yapi.birimFiyat || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: parseFloat(yapi.yapiAlani || 0).toFixed(2), size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (yapi.yapiYasi || '') + '', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: yapi.yapimTeknigi || '', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (yapi.yipranmaPay || '0') + '%', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: (yapi.eksikImalatOrani || '0') + '%', size: 18 })] })] }),
                                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: parseFloat(yapi.yapiBedeli || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","), size: 18 })] })] })
                                ]
                            }))
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    
                    // Toplam Yapı Bedeli - Bold, 12pt (24 half-points)
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: "TOPLAM YAPI BEDELİ: ", bold: true, size: 24 }),
                            new TextRun({ text: toplamYapiBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL', size: 24 })
                        ]
                    }),
                    
                    // Yapı Bedeli Yazıyla - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: `Yalnız ${sayiyiYaziyaCevir(toplamYapiBedeli)} Türk Lirasıdır.`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Boş satırlar (eğer levazım hesaplanacaksa)
                    ...(asgariLevazimHesapla ? [
                        new Paragraph({ text: "" }),
                        new Paragraph({ text: "" }),
                        
                        // Levazım Bedeli - Bold, 12pt (24 half-points)
                        new Paragraph({
                            spacing: { after: 200 },
                            children: [
                                new TextRun({ text: "TOPLAM ASGARİ LEVAZIM BEDELİ (Toplam Bedel x 0,7 x 0,75) : ", bold: true, size: 24 }),
                                new TextRun({ text: levazimBedeli.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' TL', size: 24 })
                            ]
                        }),
                        
                        // Levazım Bedeli Yazıyla - 12pt (24 half-points) - İki yana yasla
                        new Paragraph({
                            alignment: AlignmentType.JUSTIFIED,
                            spacing: { after: 400 },
                            children: [
                                new TextRun({
                                    text: `Yalnız ${sayiyiYaziyaCevir(levazimBedeli)} Türk Lirasıdır.`,
                                    size: 24
                                })
                            ]
                        })
                    ] : []),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Son Paragraf - 12pt (24 half-points) - İki yana yasla
                    new Paragraph({
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: asgariLevazimHesapla
                                    ? `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(raporData.resmiGazeteTarih)} tarih ve ${raporData.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${raporData.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ ve 2015/1 sayılı Milli Emlak Genelgesi esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir.`
                                    : `Söz konusu yapıların yapım tekniği, kullanım durumu, yaşı ve 02.12.1982 gün ve 17.886 sayılı Resmi Gazete'de yayınlanarak yürürlüğe giren "Yıpranma Paylarına İlişkin Oranları Gösterir Cetvel'e göre takdir edilen yıpranma payları dahil, arsa değeri hariç, ${formatTarih(raporData.resmiGazeteTarih)} tarih ve ${raporData.resmiGazeteSayili || ''} sayılı Resmi Gazete 'de yayımlanan Mimarlık Ve Mühendislik Hizmet Bedellerinin Hesabında Kullanılacak ${raporData.hesapYili || ''} Yılı Yapı Yaklaşık Birim Maliyetleri Hakkında Tebliğ esas alınarak hazırlanan iş bu rapor tarafımızdan bir nüsha olarak tanzim ve imza edilmiştir.`,
                                size: 24
                            })
                        ]
                    }),
                    
                    // Rapor Tarihi - 12pt (24 half-points)
                    new Paragraph({
                        spacing: { after: 200 },
                        children: [
                            new TextRun({ text: formatTarih(raporData.raporTarihi), size: 24 })
                        ]
                    }),
                    
                    // Boş satırlar
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    new Paragraph({ text: "" }),
                    
                    // Raportör Tablosu - Dinamik (max 4 raportör)
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
                                                children: [new TextRun({ text: raportorAdlari[i] || '', size: 18 })]
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
                                                children: [new TextRun({ text: raportorUnvanlari[i] || '', size: 18 })]
                                            })]
                                        })
                                    )
                                })
                            ]
                        })
                    ] : [
                        // Eğer raportör yoksa eski sistemi kullan
                        new Paragraph({
                            spacing: { after: 200 },
                            children: [
                                new TextRun({ text: raporData.raportorAdi || '', size: 24 })
                            ]
                        }),
                        new Paragraph({ text: "" }),
                        new Paragraph({
                            spacing: { after: 400 },
                            children: [
                                new TextRun({ text: raporData.raportorUnvani || '', size: 24 })
                            ]
                        })
                    ])
                ]
            }]
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

module.exports = { generateReport, sayiyiYaziyaCevir, formatTarih };
