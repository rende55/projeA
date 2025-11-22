const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { generateReport } = require('./reportGenerator');
const { dialog } = require('electron').remote || require('@electron/remote');

let db = new sqlite3.Database(path.join(__dirname, 'raporlar.db'));

db.all(`SELECT id, raporTarihi, ilce, mahalle, ada, parsel FROM raporlar`, [], (err, rows) => {
    if (err) {
        throw err;
    }
    const tableBody = document.querySelector('#raporlarTable tbody');
    rows.forEach(row => {
        const tr = document.createElement('tr');
        const tdId = document.createElement('td');
        tdId.textContent = row.id;
        tr.appendChild(tdId);

        const tdRaporTarihi = document.createElement('td');
        tdRaporTarihi.textContent = row.raporTarihi;
        tr.appendChild(tdRaporTarihi);

        const tdIlce = document.createElement('td');
        tdIlce.textContent = row.ilce;
        tr.appendChild(tdIlce);

        const tdMahalle = document.createElement('td');
        tdMahalle.textContent = row.mahalle;
        tr.appendChild(tdMahalle);

        const tdAda = document.createElement('td');
        tdAda.textContent = row.ada;
        tr.appendChild(tdAda);

        const tdParsel = document.createElement('td');
        tdParsel.textContent = row.parsel;
        tr.appendChild(tdParsel);

        const tdIslemler = document.createElement('td');
        
        // Sil butonu
        const btnSil = document.createElement('button');
        btnSil.textContent = 'Sil';
        btnSil.className = 'btn sil-button';
        btnSil.onclick = () => {
            if (confirm(`Bu raporu silmek istediğinize emin misiniz? ID: ${row.id}`)) {
                db.run(`DELETE FROM raporlar WHERE id = ?`, row.id, function(err) {
                    if (err) {
                        return console.log(err.message);
                    }
                    console.log(`Rapor silindi, ID: ${row.id}`);
                    tr.remove(); // Satırı kaldır
                });
            }
        };

        // Revize et butonu
        const btnRevize = document.createElement('button');
        btnRevize.textContent = 'Revize Et';
        btnRevize.className = 'btn revize-button';
        btnRevize.onclick = () => {
            console.log(`Revize Et: ${row.id}`);
        };

        // Hesapla butonu (Rapor Oluştur)
        const btnHesapla = document.createElement('button');
        btnHesapla.textContent = 'Rapor Oluştur';
        btnHesapla.className = 'btn hesapla-button';
        btnHesapla.onclick = () => {
            // Tam rapor verilerini veritabanından al
            db.get(`SELECT * FROM raporlar WHERE id = ?`, row.id, (err, raporData) => {
                if (err) {
                    alert('Rapor verileri alınırken hata oluştu: ' + err.message);
                    return;
                }
                
                if (!raporData) {
                    alert('Rapor bulunamadı!');
                    return;
                }
                
                // Rapor dosyasının kaydedileceği yolu belirle
                const tarih = new Date().toISOString().slice(0, 10).replace(/-/g, '');
                const dosyaAdi = `Rapor_${raporData.raporNo || row.id}_${tarih}.docx`;
                const outputPath = path.join(__dirname, 'raporlar_cikti', dosyaAdi);
                
                // raporlar_cikti klasörünü oluştur (yoksa)
                const fs = require('fs');
                const outputDir = path.join(__dirname, 'raporlar_cikti');
                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }
                
                // Rapor oluştur (async)
                console.log('Rapor oluşturuluyor...');
                generateReport(raporData, outputPath)
                    .then(result => {
                        console.log('Rapor oluşturma sonucu:', result);
                        
                        if (result.success) {
                            alert(`✅ Rapor başarıyla oluşturuldu!\n\nDosya: ${dosyaAdi}\n\nKonum: ${outputDir}`);
                            
                            // Dosyayı aç
                            const { shell } = require('electron');
                            shell.openPath(result.path || outputPath);
                        } else {
                            alert('❌ Rapor oluşturulurken hata oluştu: ' + result.error);
                        }
                    })
                    .catch(error => {
                        console.error('Rapor oluşturma hatası:', error);
                        alert('❌ Rapor oluşturulurken beklenmeyen hata: ' + error.message);
                    });
            });
        };

        tdIslemler.appendChild(btnSil);
        tdIslemler.appendChild(btnRevize);
        tdIslemler.appendChild(btnHesapla);
        tr.appendChild(tdIslemler);

        tableBody.appendChild(tr);
    });
});

// Sayfayı kapatma butonuna tıklama olayı
const closeButton = document.getElementById('closeButton');
closeButton.addEventListener('click', () => {
    window.close(); // Pencereyi kapat
});