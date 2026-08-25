/**
 * Kayıtlı Metrajlar - Sayfa Modülü
 *
 * metrajlar tablosundaki aktif kayıtları listeler.
 */

const sqlite3 = require('sqlite3').verbose();
const { getDbPath } = require('../../../shared/scripts/db-helper');

const dbPath = getDbPath();
let db = null;
let nav = null;
let mrContainer = null;

async function onLoad(container, data, navigation) {
    console.log('📋 Kayıtlı Metrajlar sayfası yükleniyor...');
    nav = navigation;
    mrContainer = container;
    db = new sqlite3.Database(dbPath);

    window.mrPage = { ac, sil };

    setupEventListeners();
    await loadMetrajlar();

    console.log('✅ Kayıtlı Metrajlar sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
    delete window.mrPage;
}

function hasUnsavedChanges() { return false; }

function setupEventListeners() {
    const backButton = mrContainer.querySelector('#mr-backButton');
    if (backButton) backButton.addEventListener('click', () => nav.goBack());

    const yeniButton = mrContainer.querySelector('#mr-yeniButton');
    if (yeniButton) yeniButton.addEventListener('click', () => nav.navigateTo('cephe-metraj'));
}

function loadMetrajlar() {
    return new Promise((resolve) => {
        const tbody     = mrContainer.querySelector('#mr-tableBody');
        const bosMesaj  = mrContainer.querySelector('#mr-emptyMessage');
        const tablo     = mrContainer.querySelector('#mr-tableContainer');

        if (!tbody) { resolve(); return; }

        db.all(
            `SELECT id, isAdi, aciklama, cepheSayisi, toplamBoyaAlani, toplamYalitimAlani,
                    olusturmaTarihi, guncellemeTarihi
             FROM metrajlar
             WHERE aktif = 1
             ORDER BY id DESC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error('Metrajlar yüklenemedi:', err);
                    if (tablo) tablo.style.display = 'none';
                    if (bosMesaj) bosMesaj.style.display = 'block';
                    resolve();
                    return;
                }

                tbody.innerHTML = '';

                if (!rows || rows.length === 0) {
                    if (tablo) tablo.style.display = 'none';
                    if (bosMesaj) bosMesaj.style.display = 'block';
                    resolve();
                    return;
                }

                if (tablo) tablo.style.display = 'block';
                if (bosMesaj) bosMesaj.style.display = 'none';

                rows.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row.id}</td>
                        <td>${formatTarih(row.guncellemeTarihi || row.olusturmaTarihi)}</td>
                        <td>${row.isAdi || 'İsimsiz metraj'}</td>
                        <td>${row.aciklama || '-'}</td>
                        <td>${row.cepheSayisi || 0}</td>
                        <td class="numeric">${formatAlan(row.toplamBoyaAlani)}</td>
                        <td class="numeric">${formatAlan(row.toplamYalitimAlani)}</td>
                        <td class="actions">
                            <button class="mr-btn mr-ac-button" onclick="window.mrPage.ac(${row.id})">Aç</button>
                            <button class="mr-btn mr-sil-button" onclick="window.mrPage.sil(${row.id})">Sil</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                resolve();
            }
        );
    });
}

function ac(id) {
    nav.navigateTo('cephe-metraj', { metrajId: id });
}

function sil(id) {
    const onay = confirm(`#${id} numaralı metraj kaydı silinecek. Emin misiniz?`);
    if (!onay) return;

    // Diğer modüllerdeki gibi yumuşak silme (kayıt korunur, listeden düşer)
    db.run(`UPDATE metrajlar SET aktif = 0 WHERE id = ?`, [id], (err) => {
        if (err) {
            console.error('Metraj silinemedi:', err);
            if (window.showNotification) {
                window.showNotification('Metraj silinemedi: ' + err.message, 'error');
            }
            return;
        }
        if (window.showNotification) {
            window.showNotification(`Metraj #${id} silindi.`, 'success');
        }
        loadMetrajlar();
    });
}

function formatAlan(deger) {
    if (deger === null || deger === undefined || isNaN(deger)) return '0,00';
    return Number(deger).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatTarih(tarih) {
    if (!tarih) return '-';
    const d = new Date(tarih);
    if (isNaN(d.getTime())) return tarih;
    return d.toLocaleDateString('tr-TR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

module.exports = { onLoad, onUnload, hasUnsavedChanges };
