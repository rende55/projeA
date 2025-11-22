const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize();

let mainWindow;
let db;

// VERİTABANI MİGRATION SİSTEMİ
function migrateDatabase() {
    console.log('🔄 Veritabanı migration kontrolü başlatılıyor...');
    
    // 1. raporlar tablosuna yapiGrubu kolonu var mı kontrol et
    db.all(`PRAGMA table_info(raporlar)`, [], (err, columns) => {
        if (!err && columns && columns.length > 0) {
            const yapiGrubuVar = columns.some(col => col.name === 'yapiGrubu');
            const asgariLevazimHesaplaVar = columns.some(col => col.name === 'asgariLevazimHesapla');
            
            if (!yapiGrubuVar) {
                console.log('⚠️ raporlar tablosuna yapiGrubu kolonu ekleniyor...');
                db.run(`ALTER TABLE raporlar ADD COLUMN yapiGrubu TEXT`, (err) => {
                    if (err) {
                        console.error('yapiGrubu kolonu eklenirken hata:', err);
                    } else {
                        console.log('✅ raporlar tablosuna yapiGrubu kolonu eklendi.');
                    }
                });
            }
            
            if (!asgariLevazimHesaplaVar) {
                console.log('⚠️ raporlar tablosuna asgariLevazimHesapla kolonu ekleniyor...');
                db.run(`ALTER TABLE raporlar ADD COLUMN asgariLevazimHesapla INTEGER DEFAULT 1`, (err) => {
                    if (err) {
                        console.error('asgariLevazimHesapla kolonu eklenirken hata:', err);
                    } else {
                        console.log('✅ raporlar tablosuna asgariLevazimHesapla kolonu eklendi.');
                    }
                });
            }
        }
    });
    
    // 2. birimFiyatlar tablosuna donem kolonu var mı kontrol et
    db.all(`PRAGMA table_info(birimFiyatlar)`, [], (err, columns) => {
        if (err) {
            console.log('⚠️ birimFiyatlar tablosu henüz yok, yeni oluşturulacak.');
            return;
        }
        
        if (columns && columns.length > 0) {
            const donemKolonuVar = columns.some(col => col.name === 'donem');
            
            if (!donemKolonuVar) {
                console.log('⚠️ Eski veritabanı yapısı tespit edildi. Güncelleniyor...');
                
                // 1. Yeni tablo yapısını oluştur
                db.run(`CREATE TABLE IF NOT EXISTS birimFiyatlar_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    yil INTEGER NOT NULL,
                    donem INTEGER DEFAULT 1,
                    resmiGazeteTarih TEXT,
                    resmiGazeteSayili TEXT,
                    tebligAdi TEXT,
                    olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
                    guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
                    aktif INTEGER DEFAULT 1,
                    UNIQUE(yil, donem)
                )`, (err) => {
                    if (err) {
                        console.error('Yeni tablo oluşturma hatası:', err);
                        return;
                    }
                    
                    // 2. Eski verileri yeni tabloya kopyala (her yıl için dönem=1 olarak)
                    db.run(`INSERT INTO birimFiyatlar_new (id, yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi, aktif)
                            SELECT id, yil, 1, resmiGazeteTarih, resmiGazeteSayili, 
                                   COALESCE(tebligAdi, ''), COALESCE(aktif, 1)
                            FROM birimFiyatlar`, (err) => {
                        if (err) {
                            console.error('Veri kopyalama hatası:', err);
                            return;
                        }
                        
                        // 3. Eski tabloyu sil
                        db.run(`DROP TABLE birimFiyatlar`, (err) => {
                            if (err) {
                                console.error('Eski tablo silme hatası:', err);
                                return;
                            }
                            
                            // 4. Yeni tabloyu eski isimle değiştir
                            db.run(`ALTER TABLE birimFiyatlar_new RENAME TO birimFiyatlar`, (err) => {
                                if (err) {
                                    console.error('Tablo yeniden adlandırma hatası:', err);
                                    return;
                                }
                                
                                console.log('✅ Veritabanı başarıyla güncellendi! Tüm yıllar dönem=1 olarak ayarlandı.');
                            });
                        });
                    });
                });
            } else {
                console.log('✅ Veritabanı yapısı güncel.');
            }
        }
    });
}

function createDatabase() {
    db = new sqlite3.Database(path.join(__dirname, 'raporlar.db'), (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Veritabanı oluşturuldu.');
        
        // Migration kontrolü yap
        setTimeout(() => migrateDatabase(), 500);
    });

    db.run(`CREATE TABLE IF NOT EXISTS raporlar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raporTarihi TEXT,
        raporNo TEXT,
        resmiYaziTarihi TEXT,
        resmiYaziSayisi TEXT,
        ilgiliKurum TEXT,
        hesapYili TEXT,
        ili TEXT DEFAULT 'Samsun',
        ilce TEXT,
        mahalle TEXT,
        ada TEXT,
        parsel TEXT,
        yuzolcumu TEXT,
        malik TEXT,
        yapiNo TEXT,
        yapiAdi TEXT,
        yapiMaliki TEXT,
        yapiYasi TEXT,
        yapiSinifi TEXT,
        yapiGrubu TEXT,
        yapimTeknigi TEXT,
        yapiAlani TEXT,
        birimFiyat TEXT,
        eksikImalatOrani TEXT,
        yipranmaPay TEXT,
        yapiBedeli TEXT,
        resmiGazeteTarih TEXT,
        resmiGazeteSayili TEXT,
        raportorAdi TEXT,
        raportorUnvani TEXT,
        asgariLevazimHesapla INTEGER DEFAULT 1
    )`, (err) => {
        if (err) {
            console.error(err.message);
        }
    });

    // Birim fiyat ana tablo (yıl + dönem bazında)
    db.run(`CREATE TABLE IF NOT EXISTS birimFiyatlar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        yil INTEGER NOT NULL,
        donem INTEGER DEFAULT 1,
        resmiGazeteTarih TEXT,
        resmiGazeteSayili TEXT,
        tebligAdi TEXT,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
        aktif INTEGER DEFAULT 1,
        UNIQUE(yil, donem)
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Birim fiyat ana tablosu oluşturuldu.');
        }
    });

    // Birim fiyat detay tablo (sınıf + grup bazında)
    db.run(`CREATE TABLE IF NOT EXISTS birimFiyatDetay (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        birimFiyatId INTEGER NOT NULL,
        yapiSinifi INTEGER NOT NULL,
        yapiGrubu TEXT NOT NULL,
        birimFiyat REAL NOT NULL,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (birimFiyatId) REFERENCES birimFiyatlar(id),
        UNIQUE(birimFiyatId, yapiSinifi, yapiGrubu)
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Birim fiyat detay tablosu oluşturuldu.');
            
            // Örnek veri ekle (eğer tablo boşsa)
            db.get('SELECT COUNT(*) as count FROM birimFiyatlar', [], (err, row) => {
                if (!err && row.count === 0) {
                    console.log('Örnek birim fiyat verileri ekleniyor...');
                    
                    // 2024 Yılı (Dönem 1)
                    db.run(`INSERT INTO birimFiyatlar (yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi) 
                            VALUES (?, ?, ?, ?, ?)`,
                        [2024, 1, '2024-01-15', '32768', '2024 Yılı Yapı Yaklaşık Birim Maliyetleri'],
                        function(err) {
                            if (!err) {
                                const yil2024Id = this.lastID;
                                // 1. Sınıf (A, B, C)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 1, 'A', 25000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 1, 'B', 22500)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 1, 'C', 20000)`, [yil2024Id]);
                                
                                // 2. Sınıf (A, B, C, D, E)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'A', 20000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'B', 18000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'C', 16000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'D', 14000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'E', 12000)`, [yil2024Id]);
                                
                                // 3. Sınıf (A, B, C, D)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 3, 'A', 17500)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 3, 'B', 16000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 3, 'C', 14500)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 3, 'D', 13000)`, [yil2024Id]);
                                
                                // 4. Sınıf (A, B, C)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 4, 'A', 15000)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 4, 'B', 13500)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 4, 'C', 12000)`, [yil2024Id]);
                                
                                // 5. Sınıf (A, B)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 5, 'A', 12500)`, [yil2024Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 5, 'B', 11000)`, [yil2024Id]);
                                
                                console.log('✅ 2024 yılı örnek verileri eklendi');
                            }
                        }
                    );
                    
                    // 2023 Yılı (Dönem 1)
                    db.run(`INSERT INTO birimFiyatlar (yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi) 
                            VALUES (?, ?, ?, ?, ?)`,
                        [2023, 1, '2023-01-12', '32068', '2023 Yılı Yapı Yaklaşık Birim Maliyetleri'],
                        function(err) {
                            if (!err) {
                                const yil2023Id = this.lastID;
                                // 1. Sınıf (A, B, C)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 1, 'A', 21000)`, [yil2023Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 1, 'B', 19000)`, [yil2023Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 1, 'C', 17000)`, [yil2023Id]);
                                
                                // 2. Sınıf (A, B, C, D, E)
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'A', 17000)`, [yil2023Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'B', 15500)`, [yil2023Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'C', 14000)`, [yil2023Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'D', 12500)`, [yil2023Id]);
                                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat) VALUES (?, 2, 'E', 11000)`, [yil2023Id]);
                                
                                console.log('✅ 2023 yılı örnek verileri eklendi');
                            }
                        }
                    );
                }
            });
        }
    });

    // Raportörler tablosu
    db.run(`CREATE TABLE IF NOT EXISTS raportorleri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        adi TEXT NOT NULL,
        soyadi TEXT NOT NULL,
        unvani TEXT NOT NULL,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Raportörler tablosu oluşturuldu.');
            
            // Örnek raportör verisi ekle (eğer tablo boşsa)
            db.get('SELECT COUNT(*) as count FROM raportorleri', [], (err, row) => {
                if (!err && row.count === 0) {
                    console.log('Örnek raportör verileri ekleniyor...');
                    
                    const ornekRaportorleri = [
                        ['Ahmet', 'Yılmaz', 'Mimar'],
                        ['Mehmet', 'Kaya', 'İnşaat Mühendisi'],
                        ['Fatma', 'Demir', 'Harita Mühendisi'],
                        ['Ali', 'Çelik', 'Mimar'],
                        ['Ayşe', 'Özkan', 'Şube Müdürü'],
                        ['Mustafa', 'Aydın', 'İl Müdür Yardımcısı'],
                        ['Zeynep', 'Şahin', 'Uzman'],
                        ['Hasan', 'Koç', 'Kontrolör']
                    ];
                    
                    ornekRaportorleri.forEach(([adi, soyadi, unvani]) => {
                        db.run(`INSERT INTO raportorleri (adi, soyadi, unvani) VALUES (?, ?, ?)`,
                            [adi, soyadi, unvani], (err) => {
                                if (err) {
                                    console.error('Örnek raportör ekleme hatası:', err);
                                }
                            });
                    });
                    
                    console.log('✅ Örnek raportör verileri eklendi');
                }
            });
        }
    });

    // Kurumlar tablosu
    db.run(`CREATE TABLE IF NOT EXISTS kurumlar (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kurumAdi TEXT NOT NULL,
        altKurum TEXT,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Kurumlar tablosu oluşturuldu.');
            
            // Örnek kurum verisi ekle (eğer tablo boşsa)
            db.get('SELECT COUNT(*) as count FROM kurumlar', [], (err, row) => {
                if (!err && row.count === 0) {
                    console.log('Örnek kurum verileri ekleniyor...');
                    
                    const ornekKurumlar = [
                        ['Samsun Büyükşehir Belediyesi', 'İmar ve Şehircilik Dairesi'],
                        ['Samsun Büyükşehir Belediyesi', 'Fen İşleri Dairesi'],
                        ['Samsun Büyükşehir Belediyesi', 'Park ve Bahçeler Müdürlüğü'],
                        ['Çevre, Şehircilik ve İklim Değişikliği Bakanlığı', 'Samsun İl Müdürlüğü'],
                        ['Çevre, Şehircilik ve İklim Değişikliği Bakanlığı', 'Milli Emlak Müdürlüğü'],
                        ['Tarım ve Orman Bakanlığı', 'Samsun İl Müdürlüğü'],
                        ['Adalet Bakanlığı', 'Samsun Adli Tıp Kurumu'],
                        ['Samsun Valiliği', 'İl Özel İdaresi'],
                        ['Atakum Belediyesi', null],
                        ['Canik Belediyesi', null],
                        ['İlkadım Belediyesi', null],
                        ['Tekkeköy Belediyesi', null]
                    ];
                    
                    ornekKurumlar.forEach(([kurumAdi, altKurum]) => {
                        db.run(`INSERT INTO kurumlar (kurumAdi, altKurum) VALUES (?, ?)`,
                            [kurumAdi, altKurum], (err) => {
                                if (err) {
                                    console.error('Örnek kurum ekleme hatası:', err);
                                }
                            });
                    });
                    
                    console.log('✅ Örnek kurum verileri eklendi');
                }
            });
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'Proje A - Proje Geliştirme Platformu',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        minWidth: 800,
        minHeight: 600
    });

    remoteMain.enable(mainWindow.webContents);
    // Ana modül seçim ekranı (Dashboard)
    mainWindow.loadFile('dashboard.html');
}

app.whenReady().then(() => {
    createDatabase();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Yapı Bedeli Modülü - Ana Pencere
ipcMain.on('open-yapi-bedeli', (event) => {
    const yapiBedeliWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Proje A - Yapı Bedeli Modülü',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    remoteMain.enable(yapiBedeliWindow.webContents);
    yapiBedeliWindow.loadFile('modules/yapi-bedeli/views/index.html');
});

// Yapı Bedeli - Raporlar Penceresi
ipcMain.on('show-reports', (event) => {
    const reportsWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        title: 'Yapı Bedeli - Raporlar',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    remoteMain.enable(reportsWindow.webContents);
    reportsWindow.loadFile('modules/yapi-bedeli/views/raporlar.html');
});

// Yapı Bedeli - Yönetim Paneli
ipcMain.on('show-admin', (event) => {
    const adminWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        title: 'Yapı Bedeli - Yönetim Paneli',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });

    remoteMain.enable(adminWindow.webContents);
    adminWindow.loadFile('modules/yapi-bedeli/views/admin.html');
});

// Proje Bedeli Modülü (Henüz geliştirilmedi)
ipcMain.on('open-proje-bedeli', (event) => {
    console.log('Proje Bedeli modülü henüz geliştirilmedi');
});

// Mevzuat Modülü (Henüz geliştirilmedi)
ipcMain.on('open-mevzuat', (event) => {
    console.log('Mevzuat modülü henüz geliştirilmedi');
});

// Hesaplama Modülü (Henüz geliştirilmedi)
ipcMain.on('open-hesaplama', (event) => {
    console.log('Hesaplama modülü henüz geliştirilmedi');
});
