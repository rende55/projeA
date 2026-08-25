/**
 * Proje Bedeli - Modül Başlangıç Sayfası (Hub)
 *
 * Ana sayfadan gelindiğinde açılan karşılama ekranı.
 * Buradan yeni hesaplama / kayıtlı raporlar / yönetim paneline geçilir.
 */

const sqlite3 = require('sqlite3').verbose();
const { getDbPath } = require('../../../shared/scripts/db-helper');

const dbPath = getDbPath();
let db = null;
let nav = null;
let pbhContainer = null;

async function onLoad(container, data, navigation) {
    console.log('📐 Proje Bedeli hub sayfası yükleniyor...');
    nav = navigation;
    pbhContainer = container;
    db = new sqlite3.Database(dbPath);

    setupEventListeners();
    await loadOzet();

    console.log('✅ Proje Bedeli hub sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
    delete window.pbhPage;
}

function hasUnsavedChanges() { return false; }

function setupEventListeners() {
    pbhContainer.querySelectorAll('.hub-action-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) return;
            const hedef = card.getAttribute('data-action');
            if (hedef) nav.navigateTo(hedef);
        });
    });

    const homeButton = pbhContainer.querySelector('#pbh-homeButton');
    if (homeButton) homeButton.addEventListener('click', () => nav.goHome());

    const tumunuGor = pbhContainer.querySelector('#pbh-tumunuGor');
    if (tumunuGor) tumunuGor.addEventListener('click', () => nav.navigateTo('pb-raporlar'));

    window.pbhPage = { duzenle };
}

function duzenle(id) {
    nav.navigateTo('pb-editor', { raporId: id });
}

/**
 * Rapor sayısı rozetini ve son 5 kaydı doldurur.
 */
function loadOzet() {
    return new Promise((resolve) => {
        const badge  = pbhContainer.querySelector('#pbh-raporSayisi');
        const tbody  = pbhContainer.querySelector('#pbh-tableBody');
        const bosMsg = pbhContainer.querySelector('#pbh-emptyMessage');
        const tablo  = pbhContainer.querySelector('#pbh-tableContainer');

        db.get(`SELECT COUNT(*) AS adet FROM projeBedeliRaporlari WHERE aktif = 1`, [], (err, row) => {
            if (badge) {
                badge.textContent = (err || !row) ? '—' : `${row.adet} kayıt`;
            }
        });

        db.all(
            `SELECT id, raporNo, isAdi, yapiSinifi, yapiGrubu, toplamMaliyet
             FROM projeBedeliRaporlari
             WHERE aktif = 1
             ORDER BY id DESC
             LIMIT 5`,
            [],
            (err, rows) => {
                if (err) {
                    console.error('Son kayıtlar yüklenemedi:', err);
                    resolve();
                    return;
                }

                if (!tbody) { resolve(); return; }
                tbody.innerHTML = '';

                if (!rows || rows.length === 0) {
                    if (tablo) tablo.style.display = 'none';
                    if (bosMsg) bosMsg.style.display = 'block';
                    resolve();
                    return;
                }

                if (tablo) tablo.style.display = 'block';
                if (bosMsg) bosMsg.style.display = 'none';

                rows.forEach(row => {
                    const sinif = [row.yapiSinifi, row.yapiGrubu].filter(Boolean).join('-') || '-';
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row.id}</td>
                        <td>${row.raporNo || '-'}</td>
                        <td>${row.isAdi || '-'}</td>
                        <td>${sinif}</td>
                        <td class="numeric">${formatPara(row.toplamMaliyet)}</td>
                        <td><button class="hub-btn" onclick="window.pbhPage.duzenle(${row.id})">Düzenle</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                resolve();
            }
        );
    });
}

function formatPara(deger) {
    if (deger === null || deger === undefined || isNaN(deger)) return '0,00 TL';
    return Number(deger).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' TL';
}

module.exports = { onLoad, onUnload, hasUnsavedChanges };
