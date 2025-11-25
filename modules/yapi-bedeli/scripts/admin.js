const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı ana dizinde (3 seviye yukarı: scripts -> yapi-bedeli -> modules -> projeA)
const dbPath = path.join(__dirname, '..', '..', '..', 'raporlar.db');
let db = new sqlite3.Database(dbPath);

// Global değişkenler
let seciliDonemId = null;
const GRUP_HARFLERI = ['A', 'B', 'C', 'D', 'E'];

// Sayfa yüklendiğinde
window.onload = () => {
    donemleriListele();
    console.log('✅ Admin panel yüklendi');
};

// Tab Değiştirme
function showTab(tabName, event) {
    // Tüm tab içeriklerini gizle
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Tüm tab butonlarını pasif yap
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Seçili tab'ı göster
    document.getElementById(tabName).classList.add('active');
    
    // İlgili butonu aktif yap (eğer event varsa)
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // Event yoksa tabName'e göre butonu bul
        const buttons = document.querySelectorAll('.tab-button');
        buttons.forEach(btn => {
            if (btn.getAttribute('onclick').includes(tabName)) {
                btn.classList.add('active');
            }
        });
    }
}

// ======================
// BİRİM FİYAT YÖNETİMİ
// ======================

// Yeni dönem ekle
function yeniDonemEkle() {
    const yil = document.getElementById('yil').value;
    const donem = document.getElementById('donem').value;
    const resmiGazeteTarih = document.getElementById('resmiGazeteTarih').value;
    const resmiGazeteSayili = document.getElementById('resmiGazeteSayili').value;
    const tebligAdi = document.getElementById('tebligAdi').value;

    if (!yil || !donem) {
        alert('⚠️ Yıl ve Dönem alanları zorunludur!');
        return;
    }

    // Aynı yıl/dönem var mı kontrol et
    db.get(`SELECT id FROM birimFiyatlar WHERE yil = ? AND donem = ?`, [yil, donem], (err, row) => {
        if (err) {
            alert('❌ Veritabanı hatası: ' + err.message);
            return;
        }

        if (row) {
            alert('⚠️ Bu yıl ve dönem zaten mevcut! Lütfen farklı bir dönem numarası girin.');
            return;
        }

        // Ekle
        db.run(`INSERT INTO birimFiyatlar (yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi) 
                VALUES (?, ?, ?, ?, ?)`,
            [yil, donem, resmiGazeteTarih, resmiGazeteSayili, tebligAdi],
            function(err) {
                if (err) {
                    alert('❌ Ekleme hatası: ' + err.message);
                    return;
                }
                
                alert(`✅ ${yil}/${donem} dönemi başarıyla eklendi!`);
                
                // Formu temizle
                document.getElementById('yil').value = '';
                document.getElementById('donem').value = '1';
                document.getElementById('resmiGazeteTarih').value = '';
                document.getElementById('resmiGazeteSayili').value = '';
                document.getElementById('tebligAdi').value = '';
                
                donemleriListele();
            }
        );
    });
}

// Dönemleri listele
function donemleriListele() {
    db.all(`SELECT * FROM birimFiyatlar ORDER BY yil DESC, donem DESC`, [], (err, rows) => {
        if (err) {
            console.error('Dönem listesi hatası:', err);
            return;
        }

        const tbody = document.querySelector('#donemListesi tbody');
        tbody.innerHTML = '';

        if (!rows || rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #6c757d;">Henüz dönem eklenmemiş.</td></tr>';
            return;
        }

        rows.forEach(row => {
            const tr = document.createElement('tr');
            
            // Yıl/dönem gösterimi
            const ayniYilDonemler = rows.filter(r => r.yil === row.yil);
            let donemGosterim = row.yil;
            if (ayniYilDonemler.length > 1) {
                donemGosterim = `${row.yil}/${row.donem}`;
            }
            
            const durum = row.aktif === 1 ? 
                '<span class="status-badge status-active">Aktif</span>' : 
                '<span class="status-badge status-inactive">Pasif</span>';

            tr.innerHTML = `
                <td>${row.id}</td>
                <td><strong>${donemGosterim}</strong></td>
                <td>${row.resmiGazeteTarih || '-'}</td>
                <td>${row.resmiGazeteSayili || '-'}</td>
                <td>${row.tebligAdi || '-'}</td>
                <td>${durum}</td>
                <td>
                    <button type="button" class="btn btn-primary" style="padding: 6px 12px; font-size: 13px;" onclick="gruplariDuzenle(${row.id}, '${donemGosterim}')">
                        ✏️ Grupları Düzenle
                    </button>
                    ${row.aktif === 1 ? 
                        `<button type="button" class="btn btn-warning" style="padding: 6px 12px; font-size: 13px;" onclick="donemiPasifYap(${row.id})">🚫 Pasif Yap</button>` :
                        `<button type="button" class="btn btn-success" style="padding: 6px 12px; font-size: 13px;" onclick="donemiAktifYap(${row.id})">✅ Aktif Yap</button>`
                    }
                    <button type="button" class="btn btn-danger" style="padding: 6px 12px; font-size: 13px;" onclick="donemiSil(${row.id})">🗑️ Sil</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

// Grupları düzenle
function gruplariDuzenle(donemId, donemAdi) {
    seciliDonemId = donemId;
    document.getElementById('seciliDonemBaslik').textContent = donemAdi;
    document.getElementById('grupDuzenlemeBolumu').style.display = 'block';
    
    // 5 sınıf için kart oluştur
    const container = document.getElementById('sinifGrupContainer');
    container.innerHTML = '';

    for (let sinif = 1; sinif <= 5; sinif++) {
        const card = document.createElement('div');
        card.className = 'class-card';
        card.innerHTML = `
            <h3>${sinif}. Sınıf Yapılar</h3>
            <div id="sinif${sinif}Gruplar">
                <!-- Grup inputları buraya eklenecek -->
            </div>
            <button type="button" class="btn btn-primary" style="margin-top: 10px; padding: 8px 16px; font-size: 13px;" 
                    onclick="grupEkle(${sinif})">
                ➕ Grup Ekle
            </button>
        `;
        container.appendChild(card);

        // Mevcut grupları yükle
        mevcutGruplariYukle(sinif);
    }

    // Sayfayı aşağı kaydır
    document.getElementById('grupDuzenlemeBolumu').scrollIntoView({ behavior: 'smooth' });
}

// Mevcut grupları yükle
function mevcutGruplariYukle(sinif) {
    db.all(`SELECT yapiGrubu, birimFiyat, id FROM birimFiyatDetay 
            WHERE birimFiyatId = ? AND yapiSinifi = ? AND aktif = 1 
            ORDER BY yapiGrubu`,
        [seciliDonemId, sinif],
        (err, rows) => {
            if (err) {
                console.error('Grup yükleme hatası:', err);
                return;
            }

            const container = document.getElementById(`sinif${sinif}Gruplar`);
            
            if (!rows || rows.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Henüz grup eklenmemiş.</p>';
                return;
            }

            container.innerHTML = '';
            rows.forEach(row => {
                grupInputEkle(sinif, row.yapiGrubu, row.birimFiyat, row.id);
            });
        }
    );
}

// Grup ekle (UI)
function grupEkle(sinif) {
    // Daha önce hangi gruplar eklenmiş kontrol et
    const mevcutGruplar = [];
    document.querySelectorAll(`#sinif${sinif}Gruplar .grup-select`).forEach(select => {
        if (select.value) mevcutGruplar.push(select.value);
    });

    // İlk boş grubu bul
    const bosGrup = GRUP_HARFLERI.find(g => !mevcutGruplar.includes(g));
    
    if (!bosGrup) {
        alert('⚠️ Tüm gruplar (A-E) zaten eklenmiş!');
        return;
    }

    grupInputEkle(sinif, bosGrup, '');
}

// Grup input ekle (yardımcı fonksiyon)
function grupInputEkle(sinif, grup, fiyat = '', detayId = null) {
    const container = document.getElementById(`sinif${sinif}Gruplar`);
    
    // "Henüz grup eklenmemiş" yazısı varsa kaldır
    const emptyMsg = container.querySelector('p');
    if (emptyMsg) emptyMsg.remove();

    const row = document.createElement('div');
    row.className = 'group-input-row';
    row.dataset.detayId = detayId || '';
    
    row.innerHTML = `
        <select class="grup-select" data-sinif="${sinif}">
            ${GRUP_HARFLERI.map(g => `<option value="${g}" ${g === grup ? 'selected' : ''}>${g} Grubu</option>`).join('')}
        </select>
        <input type="number" step="0.01" class="grup-fiyat" placeholder="Birim Fiyat (TL/m²)" 
               value="${fiyat}" data-sinif="${sinif}" data-grup="${grup}">
        <span class="delete-icon" onclick="grupSil(this, ${sinif}, ${detayId})">🗑️</span>
    `;
    
    container.appendChild(row);
}

// Grup sil
function grupSil(element, sinif, detayId) {
    if (!confirm('Bu grubu silmek istediğinizden emin misiniz?')) return;

    // Eğer veritabanında varsa soft delete yap
    if (detayId) {
        db.run(`UPDATE birimFiyatDetay SET aktif = 0 WHERE id = ?`, [detayId], (err) => {
            if (err) {
                alert('❌ Silme hatası: ' + err.message);
                return;
            }
            element.parentElement.remove();
            
            // Grup yoksa "Henüz grup eklenmemiş" yazısı göster
            const container = document.getElementById(`sinif${sinif}Gruplar`);
            if (container.children.length === 0) {
                container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Henüz grup eklenmemiş.</p>';
            }
        });
    } else {
        // Sadece UI'dan kaldır
        element.parentElement.remove();
        
        const container = document.getElementById(`sinif${sinif}Gruplar`);
        if (container.children.length === 0) {
            container.innerHTML = '<p style="color: #6c757d; font-size: 14px;">Henüz grup eklenmemiş.</p>';
        }
    }
}

// Grupları kaydet
function gruplariKaydet() {
    if (!seciliDonemId) {
        alert('⚠️ Lütfen önce bir dönem seçin!');
        return;
    }

    let basariliSayac = 0;
    let toplamIslem = 0;

    // Her sınıf için grupları topla
    for (let sinif = 1; sinif <= 5; sinif++) {
        const container = document.getElementById(`sinif${sinif}Gruplar`);
        const rows = container.querySelectorAll('.group-input-row');

        rows.forEach(row => {
            const grupSelect = row.querySelector('.grup-select');
            const fiyatInput = row.querySelector('.grup-fiyat');
            const detayId = row.dataset.detayId;

            const grup = grupSelect.value;
            const fiyat = parseFloat(fiyatInput.value);

            if (!grup || !fiyat || fiyat <= 0) {
                console.warn(`Geçersiz veri: Sınıf ${sinif}, Grup ${grup}, Fiyat ${fiyat}`);
                return;
            }

            toplamIslem++;

            if (detayId) {
                // Güncelle
                db.run(`UPDATE birimFiyatDetay SET birimFiyat = ? WHERE id = ?`,
                    [fiyat, detayId],
                    (err) => {
                        if (err) {
                            console.error('Güncelleme hatası:', err);
                        } else {
                            basariliSayac++;
                            console.log(`✅ Güncellendi: ${sinif}. Sınıf ${grup} Grubu`);
                        }
                    }
                );
            } else {
                // Ekle (veya güncelle - UPSERT)
                db.run(`INSERT INTO birimFiyatDetay (birimFiyatId, yapiSinifi, yapiGrubu, birimFiyat, aktif) 
                        VALUES (?, ?, ?, ?, 1)
                        ON CONFLICT(birimFiyatId, yapiSinifi, yapiGrubu) 
                        DO UPDATE SET birimFiyat = ?, aktif = 1`,
                    [seciliDonemId, sinif, grup, fiyat, fiyat],
                    (err) => {
                        if (err) {
                            console.error('Ekleme hatası:', err);
                        } else {
                            basariliSayac++;
                            console.log(`✅ Eklendi: ${sinif}. Sınıf ${grup} Grubu`);
                        }
                    }
                );
            }
        });
    }

    // İşlem tamamlandı mesajı
    setTimeout(() => {
        if (toplamIslem === 0) {
            alert('⚠️ Kaydedilecek veri bulunamadı!');
        } else {
            alert(`✅ ${basariliSayac} / ${toplamIslem} grup başarıyla kaydedildi!`);
            gruplariDuzenle(seciliDonemId, document.getElementById('seciliDonemBaslik').textContent);
        }
    }, 500);
}

// Grup düzenlemeyi kapat
function grupDuzenlemeyiKapat() {
    document.getElementById('grupDuzenlemeBolumu').style.display = 'none';
    seciliDonemId = null;
}

// Dönemi pasif yap
function donemiPasifYap(donemId) {
    if (!confirm('Bu dönemi pasif yapmak istediğinizden emin misiniz?')) return;

    db.run(`UPDATE birimFiyatlar SET aktif = 0 WHERE id = ?`, [donemId], (err) => {
        if (err) {
            alert('❌ Hata: ' + err.message);
            return;
        }
        alert('✅ Dönem pasif yapıldı.');
        donemleriListele();
    });
}

// Dönemi aktif yap
function donemiAktifYap(donemId) {
    db.run(`UPDATE birimFiyatlar SET aktif = 1 WHERE id = ?`, [donemId], (err) => {
        if (err) {
            alert('❌ Hata: ' + err.message);
            return;
        }
        alert('✅ Dönem aktif yapıldı.');
        donemleriListele();
    });
}

// Dönemi sil
function donemiSil(donemId) {
    if (!confirm('⚠️ DİKKAT! Bu dönemi ve ona ait tüm grup/fiyat bilgilerini silmek istediğinizden emin misiniz?\n\nBu işlem GERİ ALINAMAZ!')) return;

    // Önce detayları sil
    db.run(`DELETE FROM birimFiyatDetay WHERE birimFiyatId = ?`, [donemId], (err) => {
        if (err) {
            alert('❌ Detay silme hatası: ' + err.message);
            return;
        }

        // Sonra ana kaydı sil
        db.run(`DELETE FROM birimFiyatlar WHERE id = ?`, [donemId], (err) => {
            if (err) {
                alert('❌ Silme hatası: ' + err.message);
                return;
            }
            alert('✅ Dönem ve tüm grup bilgileri silindi.');
            donemleriListele();
            grupDuzenlemeyiKapat();
        });
    });
}

// ======================
// RAPORTÖR YÖNETİMİ
// ======================

// Global değişkenler
let duzenlenecekRaportorId = null;

// Sayfa yüklendiğinde raportörleri ve kurumları listele (güvenli başlatma)
window.addEventListener('load', () => {
    // Veritabanının hazır olmasını bekle
    setTimeout(() => {
        raportorleriListele();
        kurumlariListele();
    }, 1000);
});

// Yeni raportör ekle
function yeniRaportorEkle() {
    const adi = document.getElementById('raportorAdi').value.trim();
    const soyadi = document.getElementById('raportorSoyadi').value.trim();
    const unvani = document.getElementById('raportorUnvani').value;

    if (!adi || !soyadi || !unvani) {
        alert('⚠️ Lütfen tüm alanları doldurun!');
        return;
    }

    // Aynı isimde raportör var mı kontrol et
    db.get(`SELECT COUNT(*) as count FROM raportorleri WHERE adi = ? AND soyadi = ? AND aktif = 1`, 
        [adi, soyadi], (err, row) => {
        if (err) {
            alert('❌ Kontrol hatası: ' + err.message);
            return;
        }

        if (row.count > 0) {
            alert('⚠️ Bu isimde bir raportör zaten mevcut!');
            return;
        }

        // Yeni raportör ekle
        db.run(`INSERT INTO raportorleri (adi, soyadi, unvani) VALUES (?, ?, ?)`,
            [adi, soyadi, unvani], function(err) {
            if (err) {
                alert('❌ Ekleme hatası: ' + err.message);
                return;
            }
            
            alert('✅ Raportör başarıyla eklendi!');
            raportorFormuTemizle();
            raportorleriListele();
        });
    });
}

// Raportörleri listele
function raportorleriListele() {
    const tbody = document.querySelector('#raportorListesi tbody');
    if (!tbody) return;

    // Önce tablo var mı kontrol et
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='raportorleri'`, [], (err, row) => {
        if (err) {
            console.error('Tablo kontrol hatası:', err);
            tbody.innerHTML = '<tr><td colspan="6">❌ Veritabanı kontrol hatası</td></tr>';
            return;
        }

        if (!row) {
            // Tablo henüz yok
            tbody.innerHTML = '<tr><td colspan="6">⏳ Veritabanı hazırlanıyor... Lütfen birkaç saniye bekleyin.</td></tr>';
            // 2 saniye sonra tekrar dene
            setTimeout(() => {
                raportorleriListele();
            }, 2000);
            return;
        }

        // Tablo var, verileri çek
        db.all(`SELECT * FROM raportorleri ORDER BY adi, soyadi`, [], (err, rows) => {
            if (err) {
                console.error('Raportör listeleme hatası:', err);
                tbody.innerHTML = '<tr><td colspan="6">❌ Veri yüklenirken hata oluştu</td></tr>';
                return;
            }

            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6">📭 Henüz raportör eklenmemiş</td></tr>';
                return;
            }

            tbody.innerHTML = rows.map(row => `
                <tr>
                    <td>${row.id}</td>
                    <td><strong>${row.adi} ${row.soyadi}</strong></td>
                    <td>${row.unvani}</td>
                    <td>
                        <span class="status-badge ${row.aktif ? 'status-active' : 'status-inactive'}">
                            ${row.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                    </td>
                    <td>${new Date(row.olusturmaTarihi).toLocaleDateString('tr-TR')}</td>
                    <td>
                        <button class="btn btn-warning" onclick="raportorDuzenle(${row.id})" style="margin-right: 5px; padding: 6px 12px; font-size: 12px;">
                            ✏️ Düzenle
                        </button>
                        <button class="btn btn-danger" onclick="raportorSil(${row.id})" style="padding: 6px 12px; font-size: 12px;">
                            🗑️ Sil
                        </button>
                    </td>
                </tr>
            `).join('');
        });
    });
}

// Raportör düzenle
function raportorDuzenle(raportorId) {
    db.get(`SELECT * FROM raportorleri WHERE id = ?`, [raportorId], (err, row) => {
        if (err) {
            alert('❌ Veri yükleme hatası: ' + err.message);
            return;
        }

        if (!row) {
            alert('❌ Raportör bulunamadı!');
            return;
        }

        // Düzenleme formunu doldur
        document.getElementById('duzenleRaportorAdi').value = row.adi;
        document.getElementById('duzenleRaportorSoyadi').value = row.soyadi;
        document.getElementById('duzenleRaportorUnvani').value = row.unvani;
        document.getElementById('duzenlenecekRaportorBaslik').textContent = `${row.adi} ${row.soyadi}`;
        
        duzenlenecekRaportorId = raportorId;
        
        // Düzenleme bölümünü göster
        document.getElementById('raportorDuzenlemeBolumu').style.display = 'block';
        
        // Forma scroll et
        document.getElementById('raportorDuzenlemeBolumu').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    });
}

// Raportör güncelle
function raportorGuncelle() {
    if (!duzenlenecekRaportorId) {
        alert('❌ Güncellenecek raportör seçilmemiş!');
        return;
    }

    const adi = document.getElementById('duzenleRaportorAdi').value.trim();
    const soyadi = document.getElementById('duzenleRaportorSoyadi').value.trim();
    const unvani = document.getElementById('duzenleRaportorUnvani').value;

    if (!adi || !soyadi || !unvani) {
        alert('⚠️ Lütfen tüm alanları doldurun!');
        return;
    }

    // Aynı isimde başka raportör var mı kontrol et (kendisi hariç)
    db.get(`SELECT COUNT(*) as count FROM raportorleri WHERE adi = ? AND soyadi = ? AND aktif = 1 AND id != ?`, 
        [adi, soyadi, duzenlenecekRaportorId], (err, row) => {
        if (err) {
            alert('❌ Kontrol hatası: ' + err.message);
            return;
        }

        if (row.count > 0) {
            alert('⚠️ Bu isimde başka bir raportör zaten mevcut!');
            return;
        }

        // Raportörü güncelle
        db.run(`UPDATE raportorleri SET adi = ?, soyadi = ?, unvani = ?, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`,
            [adi, soyadi, unvani, duzenlenecekRaportorId], function(err) {
            if (err) {
                alert('❌ Güncelleme hatası: ' + err.message);
                return;
            }
            
            alert('✅ Raportör başarıyla güncellendi!');
            raportorDuzenlemeyiKapat();
            raportorleriListele();
        });
    });
}

// Raportör sil
function raportorSil(raportorId) {
    db.get(`SELECT adi, soyadi FROM raportorleri WHERE id = ?`, [raportorId], (err, row) => {
        if (err) {
            alert('❌ Veri yükleme hatası: ' + err.message);
            return;
        }

        if (!row) {
            alert('❌ Raportör bulunamadı!');
            return;
        }

        const onay = confirm(`"${row.adi} ${row.soyadi}" isimli raportörü silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`);
        
        if (!onay) return;

        // Soft delete - aktif durumunu 0 yap
        db.run(`UPDATE raportorleri SET aktif = 0, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`, 
            [raportorId], function(err) {
            if (err) {
                alert('❌ Silme hatası: ' + err.message);
                return;
            }
            
            alert('✅ Raportör başarıyla silindi!');
            raportorleriListele();
        });
    });
}

// Raportör formu temizle
function raportorFormuTemizle() {
    document.getElementById('raportorAdi').value = '';
    document.getElementById('raportorSoyadi').value = '';
    document.getElementById('raportorUnvani').value = '';
}

// Raportör düzenlemeyi kapat
function raportorDuzenlemeyiKapat() {
    document.getElementById('raportorDuzenlemeBolumu').style.display = 'none';
    duzenlenecekRaportorId = null;
    
    // Düzenleme formunu temizle
    document.getElementById('duzenleRaportorAdi').value = '';
    document.getElementById('duzenleRaportorSoyadi').value = '';
    document.getElementById('duzenleRaportorUnvani').value = '';
}

// ======================
// KURUM YÖNETİMİ
// ======================

// Global değişkenler
let duzenlenecekKurumId = null;

// Yeni kurum ekle
function yeniKurumEkle() {
    const kurumAdi = document.getElementById('kurumAdi').value.trim();
    const altKurum = document.getElementById('altKurum').value.trim() || null;

    if (!kurumAdi) {
        alert('⚠️ Lütfen kurum adını girin!');
        return;
    }

    // Aynı kurum var mı kontrol et
    const kontrolSorgusu = altKurum 
        ? `SELECT COUNT(*) as count FROM kurumlar WHERE kurumAdi = ? AND altKurum = ? AND aktif = 1`
        : `SELECT COUNT(*) as count FROM kurumlar WHERE kurumAdi = ? AND altKurum IS NULL AND aktif = 1`;
    
    const parametreler = altKurum ? [kurumAdi, altKurum] : [kurumAdi];

    db.get(kontrolSorgusu, parametreler, (err, row) => {
        if (err) {
            alert('❌ Kontrol hatası: ' + err.message);
            return;
        }

        if (row.count > 0) {
            alert('⚠️ Bu kurum zaten mevcut!');
            return;
        }

        // Yeni kurum ekle
        db.run(`INSERT INTO kurumlar (kurumAdi, altKurum) VALUES (?, ?)`,
            [kurumAdi, altKurum], function(err) {
            if (err) {
                alert('❌ Ekleme hatası: ' + err.message);
                return;
            }
            
            alert('✅ Kurum başarıyla eklendi!');
            kurumFormuTemizle();
            kurumlariListele();
        });
    });
}

// Kurumları listele
function kurumlariListele() {
    const tbody = document.querySelector('#kurumListesi tbody');
    if (!tbody) return;

    // Önce tablo var mı kontrol et
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='kurumlar'`, [], (err, row) => {
        if (err) {
            console.error('Tablo kontrol hatası:', err);
            tbody.innerHTML = '<tr><td colspan="7">❌ Veritabanı kontrol hatası</td></tr>';
            return;
        }

        if (!row) {
            // Tablo henüz yok
            tbody.innerHTML = '<tr><td colspan="7">⏳ Veritabanı hazırlanıyor... Lütfen birkaç saniye bekleyin.</td></tr>';
            // 2 saniye sonra tekrar dene
            setTimeout(() => {
                kurumlariListele();
            }, 2000);
            return;
        }

        // Tablo var, verileri çek
        db.all(`SELECT * FROM kurumlar ORDER BY kurumAdi, altKurum`, [], (err, rows) => {
            if (err) {
                console.error('Kurum listeleme hatası:', err);
                tbody.innerHTML = '<tr><td colspan="7">❌ Veri yüklenirken hata oluştu</td></tr>';
                return;
            }

            if (rows.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7">📭 Henüz kurum eklenmemiş</td></tr>';
                return;
            }

            tbody.innerHTML = rows.map(row => {
                const tamGorunum = row.altKurum 
                    ? `${row.kurumAdi} (${row.altKurum})`
                    : row.kurumAdi;
                
                return `
                    <tr>
                        <td>${row.id}</td>
                        <td><strong>${row.kurumAdi}</strong></td>
                        <td>${row.altKurum || '-'}</td>
                        <td><em>${tamGorunum}</em></td>
                        <td>
                            <span class="status-badge ${row.aktif ? 'status-active' : 'status-inactive'}">
                                ${row.aktif ? 'Aktif' : 'Pasif'}
                            </span>
                        </td>
                        <td>${new Date(row.olusturmaTarihi).toLocaleDateString('tr-TR')}</td>
                        <td>
                            <button class="btn btn-warning" onclick="kurumDuzenle(${row.id})" style="margin-right: 5px; padding: 6px 12px; font-size: 12px;">
                                ✏️ Düzenle
                            </button>
                            <button class="btn btn-danger" onclick="kurumSil(${row.id})" style="padding: 6px 12px; font-size: 12px;">
                                🗑️ Sil
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        });
    });
}

// Kurum düzenle
function kurumDuzenle(kurumId) {
    db.get(`SELECT * FROM kurumlar WHERE id = ?`, [kurumId], (err, row) => {
        if (err) {
            alert('❌ Veri yükleme hatası: ' + err.message);
            return;
        }

        if (!row) {
            alert('❌ Kurum bulunamadı!');
            return;
        }

        // Düzenleme formunu doldur
        document.getElementById('duzenleKurumAdi').value = row.kurumAdi;
        document.getElementById('duzenleAltKurum').value = row.altKurum || '';
        
        const tamGorunum = row.altKurum 
            ? `${row.kurumAdi} (${row.altKurum})`
            : row.kurumAdi;
        document.getElementById('duzenlenecekKurumBaslik').textContent = tamGorunum;
        
        duzenlenecekKurumId = kurumId;
        
        // Düzenleme bölümünü göster
        document.getElementById('kurumDuzenlemeBolumu').style.display = 'block';
        
        // Forma scroll et
        document.getElementById('kurumDuzenlemeBolumu').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    });
}

// Kurum güncelle
function kurumGuncelle() {
    if (!duzenlenecekKurumId) {
        alert('❌ Güncellenecek kurum seçilmemiş!');
        return;
    }

    const kurumAdi = document.getElementById('duzenleKurumAdi').value.trim();
    const altKurum = document.getElementById('duzenleAltKurum').value.trim() || null;

    if (!kurumAdi) {
        alert('⚠️ Lütfen kurum adını girin!');
        return;
    }

    // Aynı kurum var mı kontrol et (kendisi hariç)
    const kontrolSorgusu = altKurum 
        ? `SELECT COUNT(*) as count FROM kurumlar WHERE kurumAdi = ? AND altKurum = ? AND aktif = 1 AND id != ?`
        : `SELECT COUNT(*) as count FROM kurumlar WHERE kurumAdi = ? AND altKurum IS NULL AND aktif = 1 AND id != ?`;
    
    const parametreler = altKurum ? [kurumAdi, altKurum, duzenlenecekKurumId] : [kurumAdi, duzenlenecekKurumId];

    db.get(kontrolSorgusu, parametreler, (err, row) => {
        if (err) {
            alert('❌ Kontrol hatası: ' + err.message);
            return;
        }

        if (row.count > 0) {
            alert('⚠️ Bu kurum zaten mevcut!');
            return;
        }

        // Kurumu güncelle
        db.run(`UPDATE kurumlar SET kurumAdi = ?, altKurum = ?, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`,
            [kurumAdi, altKurum, duzenlenecekKurumId], function(err) {
            if (err) {
                alert('❌ Güncelleme hatası: ' + err.message);
                return;
            }
            
            alert('✅ Kurum başarıyla güncellendi!');
            kurumDuzenlemeyiKapat();
            kurumlariListele();
        });
    });
}

// Kurum sil
function kurumSil(kurumId) {
    db.get(`SELECT kurumAdi, altKurum FROM kurumlar WHERE id = ?`, [kurumId], (err, row) => {
        if (err) {
            alert('❌ Veri yükleme hatası: ' + err.message);
            return;
        }

        if (!row) {
            alert('❌ Kurum bulunamadı!');
            return;
        }

        const tamGorunum = row.altKurum 
            ? `${row.kurumAdi} (${row.altKurum})`
            : row.kurumAdi;

        const onay = confirm(`"${tamGorunum}" kurumunu silmek istediğinizden emin misiniz?\n\nBu işlem geri alınamaz!`);
        
        if (!onay) return;

        // Soft delete - aktif durumunu 0 yap
        db.run(`UPDATE kurumlar SET aktif = 0, guncellemeTarihi = datetime('now','localtime') WHERE id = ?`, 
            [kurumId], function(err) {
            if (err) {
                alert('❌ Silme hatası: ' + err.message);
                return;
            }
            
            alert('✅ Kurum başarıyla silindi!');
            kurumlariListele();
        });
    });
}

// Kurum formu temizle
function kurumFormuTemizle() {
    document.getElementById('kurumAdi').value = '';
    document.getElementById('altKurum').value = '';
}

// Kurum düzenlemeyi kapat
function kurumDuzenlemeyiKapat() {
    document.getElementById('kurumDuzenlemeBolumu').style.display = 'none';
    duzenlenecekKurumId = null;
    
    // Düzenleme formunu temizle
    document.getElementById('duzenleKurumAdi').value = '';
    document.getElementById('duzenleAltKurum').value = '';
}

// ======================
// YIPRANMA PAYI YÖNETİMİ
// ======================

// TODO: Yıpranma payı fonksiyonları buraya eklenecek

// ======================
// EKSİK İMALAT YÖNETİMİ
// ======================

// TODO: Eksik imalat fonksiyonları buraya eklenecek
