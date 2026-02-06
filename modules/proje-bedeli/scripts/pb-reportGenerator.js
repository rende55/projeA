/**
 * Proje Bedeli Rapor Oluşturucu
 * Word belgesi oluşturma için docx kütüphanesi kullanılır
 */

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
    
    if (kalan > 0) {
        sonuc += ucBasamakYaziyaCevir(kalan);
    }
    
    return sonuc.trim();
}

function ucBasamakYaziyaCevir(sayi) {
    const birler = ['', 'bir', 'iki', 'üç', 'dört', 'beş', 'altı', 'yedi', 'sekiz', 'dokuz'];
    const onlar = ['', 'on', 'yirmi', 'otuz', 'kırk', 'elli', 'altmış', 'yetmiş', 'seksen', 'doksan'];
    
    let sonuc = '';
    let yuz = Math.floor(sayi / 100);
    let on = Math.floor((sayi % 100) / 10);
    let bir = sayi % 10;
    
    if (yuz === 1) {
        sonuc += 'yüz';
    } else if (yuz > 1) {
        sonuc += birler[yuz] + 'yüz';
    }
    
    if (on > 0) {
        sonuc += onlar[on];
    }
    
    if (bir > 0) {
        sonuc += birler[bir];
    }
    
    return sonuc;
}

// Para formatla
function formatPara(deger) {
    if (!deger && deger !== 0) return '0,00 TL';
    const sayi = parseFloat(deger) || 0;
    return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

// Oran formatla
function formatOran(deger) {
    if (!deger && deger !== 0) return '%0,00';
    const sayi = parseFloat(deger) || 0;
    return '%' + sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Tablo hücresi oluştur (kenarlıklı)
function createCell(text, options = {}) {
    const { bold = false, alignment = AlignmentType.LEFT, width = null } = options;
    
    const cellOptions = {
        children: [
            new Paragraph({
                alignment: alignment,
                children: [
                    new TextRun({
                        text: text || '',
                        bold: bold,
                        size: 24, // 12pt
                        font: 'Times New Roman'
                    })
                ]
            })
        ],
        verticalAlign: VerticalAlign.CENTER,
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 }
        }
    };
    
    if (width) {
        cellOptions.width = { size: width, type: WidthType.PERCENTAGE };
    }
    
    return new TableCell(cellOptions);
}

// Kenarlıksız hücre oluştur (imzacılar için)
function createBorderlessCell(text, options = {}) {
    const { bold = false, alignment = AlignmentType.CENTER } = options;
    
    return new TableCell({
        children: [
            new Paragraph({
                alignment: alignment,
                children: [
                    new TextRun({
                        text: text || '',
                        bold: bold,
                        size: 24,
                        font: 'Times New Roman'
                    })
                ]
            })
        ],
        verticalAlign: VerticalAlign.CENTER,
        borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
        }
    });
}

/**
 * Proje Bedeli Raporu Oluştur - Sayfa 1 (Genel Bilgiler)
 */
function generateReport(raporData, outputPath) {
    try {
        const {
            isAdi,
            yapiSinifi,
            yapiGrubu,
            birimMaliyet,
            toplamInsaatAlani,
            toplamMaliyet,
            branslar,
            raportorAdlari,
            raportorUnvanlari
        } = raporData;
        
        // Raportör sayısı
        const raportorSayisi = Math.min(raportorAdlari?.length || 0, raportorUnvanlari?.length || 0, 4);
        
        // Genel Bilgiler Tablosu satırları
        const genelBilgilerRows = [
            new TableRow({
                children: [
                    createCell('İşin Adı:', { bold: true, width: 35 }),
                    createCell(isAdi || '', { width: 65 })
                ]
            }),
            new TableRow({
                children: [
                    createCell('Yapı Sınıfı/Grubu:', { bold: true, width: 35 }),
                    createCell(`${yapiSinifi || ''} / ${yapiGrubu || ''}`, { width: 65 })
                ]
            }),
            new TableRow({
                children: [
                    createCell('İnşaat Birim Maliyeti:', { bold: true, width: 35 }),
                    createCell(formatPara(birimMaliyet), { width: 65 })
                ]
            }),
            new TableRow({
                children: [
                    createCell('Toplam İnşaat Alanı:', { bold: true, width: 35 }),
                    createCell(`${toplamInsaatAlani || '0'} m²`, { width: 65 })
                ]
            }),
            new TableRow({
                children: [
                    createCell('Toplam Maliyet:', { bold: true, width: 35 }),
                    createCell(formatPara(toplamMaliyet), { width: 65 })
                ]
            })
        ];
        
        // Proje Bedel İcmali Tablosu
        // Başlık satırı
        const icmalBaslikRow = new TableRow({
            children: [
                createCell('Branş', { bold: true, alignment: AlignmentType.CENTER }),
                createCell('Hizmet Dalı Katsayısı', { bold: true, alignment: AlignmentType.CENTER }),
                createCell('Hizmet Sınıfı', { bold: true, alignment: AlignmentType.CENTER }),
                createCell('PID Oranı', { bold: true, alignment: AlignmentType.CENTER }),
                createCell('Hizmet Bölümü Oranı', { bold: true, alignment: AlignmentType.CENTER }),
                createCell('Seçili Hizmet Bedeli', { bold: true, alignment: AlignmentType.CENTER })
            ]
        });
        
        // Branş satırları
        const bransIsimleri = ['Mimarlık', 'İnşaat', 'Mekanik', 'Elektrik'];
        const bransRows = branslar?.map((brans, index) => {
            return new TableRow({
                children: [
                    createCell(bransIsimleri[index] || brans.bransAdi || '', { bold: true }),
                    createCell(formatOran(brans.hizmetDaliKatsayisi), { alignment: AlignmentType.CENTER }),
                    createCell(brans.hizmetSinifi || '-', { alignment: AlignmentType.CENTER }),
                    createCell(formatOran(brans.pidOrani), { alignment: AlignmentType.CENTER }),
                    createCell(formatOran(brans.hizmetBolumuOrani), { alignment: AlignmentType.CENTER }),
                    createCell(formatPara(brans.seciliHizmetBedeli), { alignment: AlignmentType.RIGHT })
                ]
            });
        }) || [];
        
        // Toplam satırı
        const toplamHizmetBedeli = branslar?.reduce((sum, b) => sum + (parseFloat(b.seciliHizmetBedeli) || 0), 0) || 0;
        const toplamRow = new TableRow({
            children: [
                createCell('TOPLAM', { bold: true, alignment: AlignmentType.CENTER }),
                createCell('', { alignment: AlignmentType.CENTER }),
                createCell('', { alignment: AlignmentType.CENTER }),
                createCell('', { alignment: AlignmentType.CENTER }),
                createCell('', { alignment: AlignmentType.CENTER }),
                createCell(formatPara(toplamHizmetBedeli), { bold: true, alignment: AlignmentType.RIGHT })
            ]
        });
        
        // Document oluştur
        const doc = new Document({
            styles: {
                default: {
                    document: {
                        run: {
                            font: 'Times New Roman',
                            size: 24
                        }
                    }
                }
            },
            sections: [{
                children: [
                    // Başlık - İşin Adı (CAPITAL, Bold, Ortalı)
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                            new TextRun({
                                text: (isAdi || 'PROJE').toUpperCase(),
                                bold: true,
                                size: 24,
                                font: 'Times New Roman'
                            })
                        ]
                    }),
                    
                    // Alt Başlık - Proje Bedel Hesabı (CAPITAL, Bold, Ortalı)
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                        children: [
                            new TextRun({
                                text: 'PROJE BEDEL HESABI',
                                bold: true,
                                size: 24,
                                font: 'Times New Roman'
                            })
                        ]
                    }),
                    
                    // 1. Alt Başlık - Genel Bilgiler
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({
                                text: '1. Genel Bilgiler',
                                bold: true,
                                size: 24,
                                font: 'Times New Roman'
                            })
                        ]
                    }),
                    
                    // Genel Bilgiler Tablosu
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: genelBilgilerRows
                    }),
                    
                    // Boşluk
                    new Paragraph({ text: '', spacing: { after: 200 } }),
                    
                    // 2. Alt Başlık - Proje Bedel İcmali
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({
                                text: '2. Proje Bedel İcmali',
                                bold: true,
                                size: 24,
                                font: 'Times New Roman'
                            })
                        ]
                    }),
                    
                    // Proje Bedel İcmali Tablosu
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [icmalBaslikRow, ...bransRows, toplamRow]
                    }),
                    
                    // Boşluk
                    new Paragraph({ text: '', spacing: { after: 400 } }),
                    
                    // 3. İmzacılar
                    new Paragraph({
                        spacing: { before: 200, after: 200 },
                        children: [
                            new TextRun({
                                text: '3. İmzacılar',
                                bold: true,
                                size: 24,
                                font: 'Times New Roman'
                            })
                        ]
                    }),
                    
                    // İmzacılar Tablosu (kenarlıksız)
                    ...(raportorSayisi > 0 ? [
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            rows: [
                                // 1. Satır: İsim Soyisim
                                new TableRow({
                                    children: Array.from({ length: raportorSayisi }, (_, i) => 
                                        createBorderlessCell(raportorAdlari[i] || '', { bold: false })
                                    )
                                }),
                                // 2. Satır: Ünvan
                                new TableRow({
                                    children: Array.from({ length: raportorSayisi }, (_, i) => 
                                        createBorderlessCell(raportorUnvanlari[i] || '', { bold: false })
                                    )
                                })
                            ]
                        })
                    ] : [])
                ]
            }]
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
                return { success: false, error: 'Tüm dosyalar açık veya kilitli.' };
            }
            
            try {
                fs.writeFileSync(finalPath, buffer);
                console.log('✅ Proje Bedeli Raporu oluşturuldu:', finalPath);
                return { success: true, path: finalPath };
            } catch (writeError) {
                return { success: false, error: writeError.message };
            }
        }).catch(error => {
            return { success: false, error: error.message };
        });
        
    } catch (error) {
        console.error('Rapor oluşturma hatası:', error);
        return Promise.resolve({ success: false, error: error.message });
    }
}

module.exports = { generateReport, sayiyiYaziyaCevir, formatPara, formatOran };
