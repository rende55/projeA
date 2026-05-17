const { app, BrowserWindow, ipcMain } = require('electron');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const remoteMain = require('@electron/remote/main');

remoteMain.initialize();

let mainWindow;
let db;

// ASAR + portable uyumlu yol hesaplama
// - Development: __dirname (proje kök dizini)
// - Portable build (electron-builder): PORTABLE_EXECUTABLE_DIR
//   (kullanıcının çalıştırdığı .exe'nin kalıcı klasörü).
//   app.getPath('exe') portable modda %TEMP%\<rastgele>\ altındaki
//   geçici klasörü gösterir ve her çıkışta silinir; oraya yazılan veri kaybolur.
// - Diğer paketleme türleri (dir/installer): exe klasörü.
function getAppRootPath() {
    if (app.isPackaged) {
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
            return process.env.PORTABLE_EXECUTABLE_DIR;
        }
        return path.dirname(app.getPath('exe'));
    }
    return __dirname;
}

// Paketlenmiş build içine gömülen tohum (seed) veritabanı,
// extraResources `to: '../raporlar.db'` ile exe'nin (geçici) klasörüne çıkarılır.
function getBundledSeedDbPath() {
    if (!app.isPackaged) return null;
    return path.join(path.dirname(app.getPath('exe')), 'raporlar.db');
}

const APP_ROOT = getAppRootPath();

// İlk çalıştırmada gömülü tohum DB'yi kalıcı klasöre kopyala.
// Mevcut bir raporlar.db varsa asla üstüne yazma — kullanıcının verisini kaybetmemek esastır.
function seedDatabaseIfMissing() {
    const targetDb = path.join(APP_ROOT, 'raporlar.db');
    if (fs.existsSync(targetDb)) return; // kullanıcı verisi var, dokunma

    const seed = getBundledSeedDbPath();
    if (!seed || !fs.existsSync(seed)) return; // gömülü tohum yok, normal akış (boş DB oluşacak)

    try {
        fs.mkdirSync(path.dirname(targetDb), { recursive: true });
        fs.copyFileSync(seed, targetDb);
        console.log('🌱 İlk çalıştırma: gömülü raporlar.db kalıcı klasöre kopyalandı →', targetDb);
    } catch (err) {
        console.error('Seed DB kopyalama hatası:', err);
    }
}

// VERİTABANI MİGRATION SİSTEMİ
function migrateDatabase() {
    console.log('🔄 Veritabanı migration kontrolü başlatılıyor...');
    
    // 1. raporlar tablosuna yapiGrubu kolonu var mı kontrol et
    db.all(`PRAGMA table_info(raporlar)`, [], (err, columns) => {
        if (!err && columns && columns.length > 0) {
            const yapiGrubuVar = columns.some(col => col.name === 'yapiGrubu');
            const asgariLevazimHesaplaVar = columns.some(col => col.name === 'asgariLevazimHesapla');
            const yapilarJSONVar = columns.some(col => col.name === 'yapilarJSON');
            
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
            
            if (!yapilarJSONVar) {
                console.log('⚠️ raporlar tablosuna yapilarJSON kolonu ekleniyor...');
                db.run(`ALTER TABLE raporlar ADD COLUMN yapilarJSON TEXT`, (err) => {
                    if (err) {
                        console.error('yapilarJSON kolonu eklenirken hata:', err);
                    } else {
                        console.log('✅ raporlar tablosuna yapilarJSON kolonu eklendi.');
                    }
                });
            }
            
            // fotograflarJSON kolonu var mı kontrol et
            const fotograflarJSONVar = columns.some(col => col.name === 'fotograflarJSON');
            if (!fotograflarJSONVar) {
                console.log('⚠️ raporlar tablosuna fotograflarJSON kolonu ekleniyor...');
                db.run(`ALTER TABLE raporlar ADD COLUMN fotograflarJSON TEXT`, (err) => {
                    if (err) {
                        console.error('fotograflarJSON kolonu eklenirken hata:', err);
                    } else {
                        console.log('✅ raporlar tablosuna fotograflarJSON kolonu eklendi.');
                    }
                });
            }
            
            // toplamYapiBedeli kolonu var mı kontrol et
            const toplamYapiBedeliVar = columns.some(col => col.name === 'toplamYapiBedeli');
            if (!toplamYapiBedeliVar) {
                console.log('⚠️ raporlar tablosuna toplamYapiBedeli kolonu ekleniyor...');
                db.run(`ALTER TABLE raporlar ADD COLUMN toplamYapiBedeli REAL`, (err) => {
                    if (err) {
                        console.error('Kolon ekleme hatası:', err);
                    } else {
                        console.log('✅ raporlar tablosuna toplamYapiBedeli kolonu eklendi.');
                    }
                });
            }
            
            // modul kolonu var mı kontrol et
            const modulKolonuVar = columns.some(col => col.name === 'modul');
            if (!modulKolonuVar) {
                console.log('⚠️ raporlar tablosuna modul kolonu ekleniyor...');
                db.run(`ALTER TABLE raporlar ADD COLUMN modul TEXT DEFAULT 'yapi-bedeli'`, (err) => {
                    if (err) {
                        console.error('Kolon ekleme hatası:', err);
                    } else {
                        console.log('✅ raporlar tablosuna modul kolonu eklendi.');
                        // Mevcut kayıtları yapi-bedeli olarak işaretle
                        db.run(`UPDATE raporlar SET modul = 'yapi-bedeli' WHERE modul IS NULL`, (err) => {
                            if (!err) console.log('✅ Mevcut raporlar yapi-bedeli olarak işaretlendi.');
                        });
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

    // 3. projeBedeliRaporlari tablosuna imzacı kolonları var mı kontrol et
    db.all(`PRAGMA table_info(projeBedeliRaporlari)`, [], (err, columns) => {
        if (err || !columns || columns.length === 0) return;

        const yeniKolonlar = [
            { name: 'raportorSayisi', sql: 'INTEGER DEFAULT 1' },
            { name: 'raportorAdi', sql: 'TEXT' },
            { name: 'raportorUnvani', sql: 'TEXT' }
        ];

        yeniKolonlar.forEach(({ name, sql }) => {
            const varMi = columns.some(col => col.name === name);
            if (!varMi) {
                db.run(`ALTER TABLE projeBedeliRaporlari ADD COLUMN ${name} ${sql}`, (e) => {
                    if (e) console.error(`projeBedeliRaporlari.${name} eklenemedi:`, e);
                    else console.log(`✅ projeBedeliRaporlari tablosuna ${name} kolonu eklendi.`);
                });
            }
        });
    });
}

function createDatabase() {
    seedDatabaseIfMissing();
    const dbPath = path.join(APP_ROOT, 'raporlar.db');
    console.log('📂 Veritabanı yolu:', dbPath);
    db = new sqlite3.Database(dbPath, (err) => {
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
        asgariLevazimHesapla INTEGER DEFAULT 1,
        yapilarJSON TEXT,
        modul TEXT DEFAULT 'yapi-bedeli'
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

    // İller tablosu
    db.run(`CREATE TABLE IF NOT EXISTS iller (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sehir_id TEXT,
        sehir_adi TEXT NOT NULL,
        aktif INTEGER DEFAULT 1,
        varsayilan INTEGER DEFAULT 0,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(sehir_adi)
    )`, (err) => {
        if (err) {
            console.error('İller tablosu hatası:', err.message);
            return;
        }
        console.log('İller tablosu oluşturuldu.');

        // İlçeler tablosu (iller'e referans verir)
        db.run(`CREATE TABLE IF NOT EXISTS ilceler (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ilce_id TEXT,
            ilce_adi TEXT NOT NULL,
            il_id INTEGER NOT NULL,
            aktif INTEGER DEFAULT 1,
            olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
            guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE(il_id, ilce_adi),
            FOREIGN KEY(il_id) REFERENCES iller(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                console.error('İlçeler tablosu hatası:', err.message);
                return;
            }
            console.log('İlçeler tablosu oluşturuldu.');

            // Seed: Tablo boşsa varsayılan ili (Samsun) JSON'dan oku ve yükle (Alaçam dahil)
            db.get('SELECT COUNT(*) as count FROM iller', [], (err, row) => {
                if (err || row.count > 0) return;

                const VARSAYILAN_SEHIR_ID = '55'; // SAMSUN
                let sehirler = [];
                let tumIlceler = [];
                try {
                    const sehirlerJsonPath = path.join(APP_ROOT, 'sehirler.json');
                    const ilcelerJsonPath = path.join(APP_ROOT, 'ilceler.json');
                    if (fs.existsSync(sehirlerJsonPath) && fs.existsSync(ilcelerJsonPath)) {
                        sehirler = JSON.parse(fs.readFileSync(sehirlerJsonPath, 'utf8'));
                        tumIlceler = JSON.parse(fs.readFileSync(ilcelerJsonPath, 'utf8'));
                    }
                } catch (e) {
                    console.error('Sehirler/Ilceler JSON okuma hatası:', e.message);
                }

                const samsun = sehirler.find(s => s.sehir_id === VARSAYILAN_SEHIR_ID);
                if (!samsun) {
                    console.warn('⚠️ Varsayılan il (Samsun) JSON\'da bulunamadı, seed atlandı.');
                    return;
                }

                console.log('Varsayılan il (Samsun) ve ilçeleri ekleniyor...');
                db.run(`INSERT INTO iller (sehir_id, sehir_adi, varsayilan) VALUES (?, ?, 1)`,
                    [samsun.sehir_id, samsun.sehir_adi], function(err) {
                        if (err) {
                            console.error('Samsun ekleme hatası:', err);
                            return;
                        }
                        const samsunId = this.lastID;
                        const samsunIlceleri = tumIlceler.filter(i => i.sehir_id === VARSAYILAN_SEHIR_ID);
                        const stmt = db.prepare(`INSERT INTO ilceler (ilce_id, ilce_adi, il_id) VALUES (?, ?, ?)`);
                        samsunIlceleri.forEach(i => {
                            stmt.run([i.ilce_id, i.ilce_adi, samsunId], (err) => {
                                if (err) console.error('İlçe ekleme hatası:', err);
                            });
                        });
                        stmt.finalize(() => {
                            console.log(`✅ Samsun + ${samsunIlceleri.length} ilçe (Alaçam dahil) eklendi`);
                        });
                    });
            });
        });
    });

    // Yıpranma Payları tablosu
    db.run(`CREATE TABLE IF NOT EXISTS yipranmaPaylari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        yapimTeknigi TEXT NOT NULL,
        yasAraligi TEXT NOT NULL,
        minYas INTEGER NOT NULL,
        maxYas INTEGER NOT NULL,
        yipranmaOrani REAL NOT NULL,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(yapimTeknigi, minYas, maxYas)
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Yıpranma payları tablosu oluşturuldu.');
            
            // Örnek yıpranma payı verisi ekle (eğer tablo boşsa)
            db.get('SELECT COUNT(*) as count FROM yipranmaPaylari', [], (err, row) => {
                if (!err && row.count === 0) {
                    console.log('Örnek yıpranma payı verileri ekleniyor...');
                    
                    // Yapım teknikleri ve yıpranma oranları
                    const yipranmaVerileri = [
                        // Çelik
                        ['Çelik', '0-5', 0, 5, 4],
                        ['Çelik', '6-10', 6, 10, 8],
                        ['Çelik', '11-15', 11, 15, 12],
                        ['Çelik', '16-20', 16, 20, 16],
                        ['Çelik', '21-30', 21, 30, 22],
                        ['Çelik', '31-40', 31, 40, 28],
                        ['Çelik', '41-50', 41, 50, 35],
                        ['Çelik', '51+', 51, 999, 40],
                        
                        // Betonarme Karkas
                        ['Betonarme Karkas', '0-5', 0, 5, 5],
                        ['Betonarme Karkas', '6-10', 6, 10, 10],
                        ['Betonarme Karkas', '11-15', 11, 15, 15],
                        ['Betonarme Karkas', '16-20', 16, 20, 20],
                        ['Betonarme Karkas', '21-30', 21, 30, 28],
                        ['Betonarme Karkas', '31-40', 31, 40, 36],
                        ['Betonarme Karkas', '41-50', 41, 50, 45],
                        ['Betonarme Karkas', '51+', 51, 999, 55],
                        
                        // Yığma Kagir
                        ['Yığma Kagir', '0-5', 0, 5, 8],
                        ['Yığma Kagir', '6-10', 6, 10, 15],
                        ['Yığma Kagir', '11-15', 11, 15, 22],
                        ['Yığma Kagir', '16-20', 16, 20, 28],
                        ['Yığma Kagir', '21-30', 21, 30, 38],
                        ['Yığma Kagir', '31-40', 31, 40, 48],
                        ['Yığma Kagir', '41-50', 41, 50, 58],
                        ['Yığma Kagir', '51+', 51, 999, 68],
                        
                        // Yığma Yarı Kagir
                        ['Yığma Yarı Kagir', '0-5', 0, 5, 10],
                        ['Yığma Yarı Kagir', '6-10', 6, 10, 18],
                        ['Yığma Yarı Kagir', '11-15', 11, 15, 26],
                        ['Yığma Yarı Kagir', '16-20', 16, 20, 34],
                        ['Yığma Yarı Kagir', '21-30', 21, 30, 45],
                        ['Yığma Yarı Kagir', '31-40', 31, 40, 55],
                        ['Yığma Yarı Kagir', '41-50', 41, 50, 65],
                        ['Yığma Yarı Kagir', '51+', 51, 999, 75],
                        
                        // Ahşap
                        ['Ahşap', '0-5', 0, 5, 12],
                        ['Ahşap', '6-10', 6, 10, 22],
                        ['Ahşap', '11-15', 11, 15, 32],
                        ['Ahşap', '16-20', 16, 20, 42],
                        ['Ahşap', '21-30', 21, 30, 55],
                        ['Ahşap', '31-40', 31, 40, 68],
                        ['Ahşap', '41-50', 41, 50, 78],
                        ['Ahşap', '51+', 51, 999, 85],
                        
                        // Taş Duvarlı (Çamur Harçlı)
                        ['Taş Duvarlı (Çamur Harçlı)', '0-5', 0, 5, 15],
                        ['Taş Duvarlı (Çamur Harçlı)', '6-10', 6, 10, 25],
                        ['Taş Duvarlı (Çamur Harçlı)', '11-15', 11, 15, 35],
                        ['Taş Duvarlı (Çamur Harçlı)', '16-20', 16, 20, 45],
                        ['Taş Duvarlı (Çamur Harçlı)', '21-30', 21, 30, 58],
                        ['Taş Duvarlı (Çamur Harçlı)', '31-40', 31, 40, 70],
                        ['Taş Duvarlı (Çamur Harçlı)', '41-50', 41, 50, 80],
                        ['Taş Duvarlı (Çamur Harçlı)', '51+', 51, 999, 88],
                        
                        // Kerpiç
                        ['Kerpiç', '0-5', 0, 5, 18],
                        ['Kerpiç', '6-10', 6, 10, 30],
                        ['Kerpiç', '11-15', 11, 15, 42],
                        ['Kerpiç', '16-20', 16, 20, 52],
                        ['Kerpiç', '21-30', 21, 30, 65],
                        ['Kerpiç', '31-40', 31, 40, 78],
                        ['Kerpiç', '41-50', 41, 50, 88],
                        ['Kerpiç', '51+', 51, 999, 95],
                        
                        // Diğer Basit Binalar
                        ['Diğer Basit Binalar', '0-5', 0, 5, 20],
                        ['Diğer Basit Binalar', '6-10', 6, 10, 35],
                        ['Diğer Basit Binalar', '11-15', 11, 15, 48],
                        ['Diğer Basit Binalar', '16-20', 16, 20, 60],
                        ['Diğer Basit Binalar', '21-30', 21, 30, 72],
                        ['Diğer Basit Binalar', '31-40', 31, 40, 82],
                        ['Diğer Basit Binalar', '41-50', 41, 50, 90],
                        ['Diğer Basit Binalar', '51+', 51, 999, 95]
                    ];
                    
                    yipranmaVerileri.forEach(([yapimTeknigi, yasAraligi, minYas, maxYas, yipranmaOrani]) => {
                        db.run(`INSERT INTO yipranmaPaylari (yapimTeknigi, yasAraligi, minYas, maxYas, yipranmaOrani) VALUES (?, ?, ?, ?, ?)`,
                            [yapimTeknigi, yasAraligi, minYas, maxYas, yipranmaOrani], (err) => {
                                if (err) {
                                    console.error('Örnek yıpranma payı ekleme hatası:', err);
                                }
                            });
                    });
                    
                    console.log('✅ Örnek yıpranma payı verileri eklendi');
                }
            });
        }
    });

    // PID Oranları tablosu (Proje Bedeli için)
    // Alan aralıkları ve hizmet sınıflarına göre katsayılar
    db.run(`CREATE TABLE IF NOT EXISTS pidOranlari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        minAlan REAL NOT NULL,
        maxAlan REAL NOT NULL,
        hizmetSinifi INTEGER NOT NULL,
        pidOrani REAL NOT NULL,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(minAlan, maxAlan, hizmetSinifi)
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('PID oranları tablosu oluşturuldu.');
            
            // PID oranları tablosu oluşturuldu - veriler yönetici panelinden manuel girilecek
            console.log('✅ PID oranları tablosu hazır (veriler yönetici panelinden girilecek)');
        }
    });

    // Hizmet Dalı Katsayıları tablosu (Proje Bedeli için)
    // Her branş için farklı katsayılar
    db.run(`CREATE TABLE IF NOT EXISTS hizmetDaliKatsayilari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bransAdi TEXT NOT NULL,
        bransKodu TEXT NOT NULL,
        katsayi REAL NOT NULL,
        aciklama TEXT,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime')),
        UNIQUE(bransKodu)
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Hizmet dalı katsayıları tablosu oluşturuldu.');
            
            // Örnek hizmet dalı katsayısı verisi ekle (eğer tablo boşsa)
            db.get('SELECT COUNT(*) as count FROM hizmetDaliKatsayilari', [], (err, row) => {
                if (!err && row.count === 0) {
                    console.log('Örnek hizmet dalı katsayısı verileri ekleniyor...');
                    
                    // Branşlar ve katsayıları
                    const hizmetDaliVerileri = [
                        ['Mimarlık', 'MIM', 1.00, 'Mimari proje hizmetleri'],
                        ['İnşaat', 'INS', 0.75, 'Statik proje hizmetleri'],
                        ['Mekanik', 'MEK', 0.50, 'Mekanik tesisat proje hizmetleri'],
                        ['Elektrik', 'ELK', 0.385, 'Elektrik tesisat proje hizmetleri']
                    ];
                    
                    hizmetDaliVerileri.forEach(([bransAdi, bransKodu, katsayi, aciklama]) => {
                        db.run(`INSERT INTO hizmetDaliKatsayilari (bransAdi, bransKodu, katsayi, aciklama) VALUES (?, ?, ?, ?)`,
                            [bransAdi, bransKodu, katsayi, aciklama], (err) => {
                                if (err) {
                                    console.error('Örnek hizmet dalı katsayısı ekleme hatası:', err);
                                }
                            });
                    });
                    
                    console.log('✅ Örnek hizmet dalı katsayısı verileri eklendi');
                }
            });
        }
    });

    // Proje Bedeli Raporları tablosu
    db.run(`CREATE TABLE IF NOT EXISTS projeBedeliRaporlari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        raporNo TEXT,
        isAdi TEXT NOT NULL,
        toplamInsaatAlani REAL,
        hesapYili TEXT,
        yapiSinifi TEXT,
        yapiGrubu TEXT,
        birimMaliyet REAL,
        toplamMaliyet REAL,
        
        -- Mimarlık Branşı
        mimSinif INTEGER,
        mimPidOrani REAL,
        mimProjeBedeli REAL,
        mimHizmetOrani REAL,
        mimHizmetBedeli REAL,
        mimHizmetBolumleri TEXT,
        
        -- İnşaat Branşı
        insSinif INTEGER,
        insPidOrani REAL,
        insProjeBedeli REAL,
        insHizmetOrani REAL,
        insHizmetBedeli REAL,
        insHizmetBolumleri TEXT,
        
        -- Mekanik Branşı
        mekSinif INTEGER,
        mekPidOrani REAL,
        mekProjeBedeli REAL,
        mekHizmetOrani REAL,
        mekHizmetBedeli REAL,
        mekHizmetBolumleri TEXT,
        
        -- Elektrik Branşı
        elkSinif INTEGER,
        elkPidOrani REAL,
        elkProjeBedeli REAL,
        elkHizmetOrani REAL,
        elkHizmetBedeli REAL,
        elkHizmetBolumleri TEXT,
        
        -- Toplam
        genelToplamBedel REAL,

        -- İmzacılar
        raportorSayisi INTEGER DEFAULT 1,
        raportorAdi TEXT,
        raportorUnvani TEXT,

        -- Meta
        aciklama TEXT,
        aktif INTEGER DEFAULT 1,
        olusturmaTarihi TEXT DEFAULT (datetime('now','localtime')),
        guncellemeTarihi TEXT DEFAULT (datetime('now','localtime'))
    )`, (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log('Proje Bedeli raporları tablosu oluşturuldu.');
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        title: 'Proje A - Proje Geliştirme Platformu',
        icon: path.join(__dirname, 'assets', 'icons', 'icons', 'win', 'icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        },
        minWidth: 800,
        minHeight: 600
    });

    remoteMain.enable(mainWindow.webContents);
    
    // Renderer process hatalarını ve loglarını yakala
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        const levels = ['LOG', 'WARN', 'ERROR'];
        const logLine = `[Renderer ${levels[level] || level}] ${message} (${sourceId}:${line})`;
        console.log(logLine);
        // Hataları log dosyasına yaz
        if (level >= 2) {
            const logPath = path.join(app.getPath('userData'), 'error.log');
            const fs = require('fs');
            fs.appendFileSync(logPath, `${new Date().toISOString()} ${logLine}\n`);
        }
    });
    
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`❌ Sayfa yükleme hatası: ${errorCode} - ${errorDescription}`);
    });
    
    // Ana modül seçim ekranı (Dashboard)
    mainWindow.loadFile('dashboard.html');
    
    // Production: DevTools erişimini engelle
    mainWindow.webContents.on('before-input-event', (event, input) => {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U engelle
        if (input.key === 'F12' || 
            (input.control && input.shift && (input.key === 'I' || input.key === 'i' || input.key === 'J' || input.key === 'j')) ||
            (input.control && (input.key === 'U' || input.key === 'u'))) {
            event.preventDefault();
        }
    });
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

// TEK PENCERE NAVİGASYON SİSTEMİ
// Artık tüm sayfalar ana pencerede açılıyor, yeni pencere açılmıyor
// Navigasyon dashboard.js ve navigation.js tarafından yönetiliyor

// Eski IPC handler'ları kaldırıldı - artık navigasyon client-side yapılıyor
// open-yapi-bedeli, show-reports, show-admin, navigate-home artık kullanılmıyor

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

// ======================
// RAPOR EDİTÖRÜ
// ======================

let previewWindow = null;

// Rapor Editörü Aç
ipcMain.on('open-editor', (event, data) => {
    console.log('📝 Rapor editörü açılıyor, ID:', data.raporId);
    
    const editorWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        title: 'Rapor Editörü',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    
    remoteMain.enable(editorWindow.webContents);
    
    const editorPath = path.join(__dirname, 'modules', 'yapi-bedeli', 'views', 'editor.html');
    console.log('📂 Editör dosya yolu:', editorPath);
    
    editorWindow.loadFile(editorPath, {
        query: { id: String(data.raporId) }
    }).then(() => {
        console.log('✅ Editör penceresi yüklendi');
    }).catch((err) => {
        console.error('❌ Editör yükleme hatası:', err);
    });
    
    // Production: DevTools erişimini engelle
    editorWindow.webContents.on('before-input-event', (event, input) => {
        if (input.key === 'F12' || 
            (input.control && input.shift && (input.key === 'I' || input.key === 'i' || input.key === 'J' || input.key === 'j')) ||
            (input.control && (input.key === 'U' || input.key === 'u'))) {
            event.preventDefault();
        }
    });
});

// Ön İzleme Penceresi Aç
ipcMain.on('open-preview', (event, data) => {
    console.log('👁️ Ön izleme penceresi açılıyor');
    
    // Eğer zaten açık bir ön izleme varsa, onu güncelle
    if (previewWindow && !previewWindow.isDestroyed()) {
        previewWindow.webContents.send('preview-content', data);
        previewWindow.focus();
        return;
    }
    
    previewWindow = new BrowserWindow({
        width: 900,
        height: 1000,
        title: 'Ön İzleme',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    
    remoteMain.enable(previewWindow.webContents);
    previewWindow.loadFile('modules/yapi-bedeli/views/preview.html', {
        query: { id: data.raporId }
    });
    
    // Sayfa yüklendikten sonra içeriği gönder
    previewWindow.webContents.on('did-finish-load', () => {
        previewWindow.webContents.send('preview-content', data);
    });
    
    previewWindow.on('closed', () => {
        previewWindow = null;
    });
});

// Word Export - Editörden (kayıtlı raporlardan)
ipcMain.on('export-word', (event, data) => {
    console.log('📥 Word export başlatılıyor');
    console.log('📷 Gelen raporData anahtarları:', Object.keys(data.raporData || {}));
    
    const { dialog } = require('electron');
    const reportGenerator = require('./modules/yapi-bedeli/scripts/reportGenerator');
    
    // Fotoğrafları veritabanından çek
    let fotograflar = [];
    if (data.raporData && data.raporData.fotograflarJSON) {
        try {
            // fotograflarJSON string ise parse et, değilse direkt kullan
            if (typeof data.raporData.fotograflarJSON === 'string') {
                fotograflar = JSON.parse(data.raporData.fotograflarJSON);
            } else if (Array.isArray(data.raporData.fotograflarJSON)) {
                fotograflar = data.raporData.fotograflarJSON;
            }
            console.log(`📷 Veritabanından ${fotograflar.length} fotoğraf yüklendi`);
            if (fotograflar.length > 0) {
                console.log('📷 İlk fotoğraf bilgisi:', {
                    name: fotograflar[0].name,
                    hasData: !!fotograflar[0].data,
                    dataLength: fotograflar[0].data?.length || 0,
                    width: fotograflar[0].width,
                    height: fotograflar[0].height
                });
            }
        } catch (e) {
            console.error('Fotoğraf JSON parse hatası:', e);
        }
    } else {
        console.log('⚠️ fotograflarJSON bulunamadı veya boş');
    }
    
    // yapiBedeli kontrolü - toplamYapiBedeli varsa onu kullan
    if (data.raporData && !data.raporData.yapiBedeli && data.raporData.toplamYapiBedeli) {
        data.raporData.yapiBedeli = data.raporData.toplamYapiBedeli;
    }
    
    dialog.showSaveDialog({
        title: 'Word Dosyası Kaydet',
        defaultPath: `Rapor_${data.raporId}.docx`,
        filters: [
            { name: 'Word Dosyası', extensions: ['docx'] }
        ]
    }).then(async result => {
        if (!result.canceled && result.filePath) {
            try {
                const sonuc = await reportGenerator.generateReport(data.raporData, result.filePath, fotograflar);
                if (sonuc.success) {
                    event.sender.send('word-export-success', sonuc.path);
                } else {
                    event.sender.send('word-export-error', sonuc.error);
                }
            } catch (error) {
                console.error('Word export hatası:', error);
                event.sender.send('word-export-error', error.message);
            }
        }
    });
});

// Word Export - Fotoğraflarla birlikte (yapi-bedeli-page.js'den)
ipcMain.on('export-word-with-photos', (event, data) => {
    console.log('📥 Fotoğraflı Word export başlatılıyor');
    console.log(`📷 ${data.fotograflar?.length || 0} fotoğraf ekleniyor`);
    
    const { dialog } = require('electron');
    const reportGenerator = require('./modules/yapi-bedeli/scripts/reportGenerator');
    
    // Dosya adı için tarih ve konum bilgisi
    const tarih = data.raporData.raporTarihi || new Date().toISOString().split('T')[0];
    const konum = `${data.raporData.ilce || ''}_${data.raporData.mahalle || ''}_${data.raporData.ada || ''}_${data.raporData.parsel || ''}`.replace(/\s+/g, '_');
    const defaultFileName = `KT_Raporu_${konum}_${tarih}.docx`;
    
    dialog.showSaveDialog({
        title: 'Word Dosyası Kaydet',
        defaultPath: defaultFileName,
        filters: [
            { name: 'Word Dosyası', extensions: ['docx'] }
        ]
    }).then(async result => {
        if (!result.canceled && result.filePath) {
            try {
                const sonuc = await reportGenerator.generateReport(
                    data.raporData, 
                    result.filePath, 
                    data.fotograflar || []
                );
                
                if (sonuc.success) {
                    event.sender.send('word-export-success', sonuc.path);
                    console.log('✅ Word raporu oluşturuldu:', sonuc.path);
                } else {
                    event.sender.send('word-export-error', sonuc.error);
                    console.error('❌ Word export hatası:', sonuc.error);
                }
            } catch (error) {
                console.error('Word export hatası:', error);
                event.sender.send('word-export-error', error.message);
            }
        }
    });
});

// Word Export - Ön İzlemeden
ipcMain.on('export-word-from-preview', (event, data) => {
    console.log('📥 Ön izlemeden Word export başlatılıyor');
    
    const { dialog } = require('electron');
    const sqlite3 = require('sqlite3').verbose();
    const reportGenerator = require('./modules/yapi-bedeli/scripts/reportGenerator');
    
    // Veritabanından rapor verisini çek
    const dbPath = path.join(APP_ROOT, 'raporlar.db');
    const tempDb = new sqlite3.Database(dbPath);
    
    tempDb.get(`SELECT * FROM raporlar WHERE id = ?`, [data.raporId], (err, row) => {
        if (err || !row) {
            event.sender.send('word-export-error', 'Rapor bulunamadı');
            tempDb.close();
            return;
        }
        
        dialog.showSaveDialog({
            title: 'Word Dosyası Kaydet',
            defaultPath: `Rapor_${data.raporId}.docx`,
            filters: [
                { name: 'Word Dosyası', extensions: ['docx'] }
            ]
        }).then(result => {
            if (!result.canceled && result.filePath) {
                try {
                    reportGenerator.generateReport(row, result.filePath);
                    event.sender.send('word-export-success', result.filePath);
                } catch (error) {
                    console.error('Word export hatası:', error);
                    event.sender.send('word-export-error', error.message);
                }
            }
            tempDb.close();
        });
    });
});
