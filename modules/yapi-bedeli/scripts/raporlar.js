console.log('=== RAPORLAR.JS BAŞLADI ===');

const { ipcRenderer } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Modüller yüklendi');

// Veritabanı yolu - basit ve direkt
const dbPath = path.join(process.cwd(), 'raporlar.db');
console.log('Veritabanı yolu:', dbPath);

let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Veritabanı bağlantı hatası:', err);
        alert('Veritabanı hatası: ' + err.message);
    } else {
        console.log('✅ Veritabanına bağlanıldı');
    }
});

// reportGenerator'ı sadece ihtiyaç olduğunda yükle
let generateReport = null;

// Sayfa yüklendiğinde çalışacak
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM yüklendi, raporlar yükleniyor...');
    
    // Navigasyon butonları
    const homeButton = document.getElementById('homeButton');
    const formButton = document.getElementById('formButton');
    
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            console.log('Pencere kapatılıyor...');
            ipcRenderer.send('navigate-home');
        });
    }
    
    if (formButton) {
        formButton.addEventListener('click', () => {
            console.log('Form açılıyor...');
            ipcRenderer.send('open-yapi-bedeli');
        });
    }
    
    // Raporları yükle
    loadRaporlar();
});

function loadRaporlar() {
    console.log('Raporlar yükleniyor...');
    db.all(`SELECT id, raporTarihi, ilce, mahalle, ada, parsel FROM raporlar ORDER BY id DESC`, [], (err, rows) => {
    if (err) {
        console.error('Raporlar yüklenirken hata:', err);
        alert('❌ Veritabanı hatası: ' + err.message);
        throw err;
    }
    console.log(`✅ ${rows.length} adet rapor bulundu`);
    const tableBody = document.querySelector('#raporlarTable tbody');
    
    if (!tableBody) {
        console.error('tbody elementi bulunamadı!');
        alert('❌ Tablo elementi bulunamadı!');
        return;
    }
    
    if (rows.length === 0) {
        console.log('Hiç rapor yok');
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7;
        td.textContent = 'Henüz kayıtlı rapor bulunmamaktadır.';
        td.style.textAlign = 'center';
        td.style.padding = '20px';
        tr.appendChild(td);
        tableBody.appendChild(tr);
        return;
    }
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

        // Hesapla butonu (Rapor Oluştur) - ŞİMDİLİK DEVRE DIŞI
        const btnHesapla = document.createElement('button');
        btnHesapla.textContent = 'Rapor Oluştur';
        btnHesapla.className = 'btn hesapla-button';
        btnHesapla.onclick = () => {
            alert('Rapor oluşturma özelliği yakında eklenecek');
        };

        tdIslemler.appendChild(btnSil);
        tdIslemler.appendChild(btnRevize);
        tdIslemler.appendChild(btnHesapla);
        tr.appendChild(tdIslemler);

        tableBody.appendChild(tr);
    });
    });
}

// Sayfayı kapatma butonuna tıklama olayı
document.addEventListener('DOMContentLoaded', () => {
    const closeButton = document.getElementById('closeButton');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            window.close(); // Pencereyi kapat
        });
    }
});