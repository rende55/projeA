/**
 * Yapı Bedeli - Modül Başlangıç Sayfası (Hub)
 *
 * Ana sayfadan gelindiğinde açılan karşılama ekranı.
 * Buradan yeni hesaplama / kayıtlı raporlar / yönetim paneline geçilir.
 */

const sqlite3 = require('sqlite3').verbose();
const { getDbPath } = require('../../../shared/scripts/db-helper');

const dbPath = getDbPath();
let db = null;
let nav = null;
let ybhContainer = null;

async function onLoad(container, data, navigation) {
    console.log('🏗️ Yapı Bedeli hub sayfası yükleniyor...');
    nav = navigation;
    ybhContainer = container;
    db = new sqlite3.Database(dbPath);

    setupEventListeners();
    await loadOzet();

    console.log('✅ Yapı Bedeli hub sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
    delete window.ybhPage;
}

function hasUnsavedChanges() { return false; }

function setupEventListeners() {
    // Eylem kartları
    ybhContainer.querySelectorAll('.hub-action-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) return;
            const hedef = card.getAttribute('data-action');
            if (hedef) nav.navigateTo(hedef);
        });
    });

    const homeButton = ybhContainer.querySelector('#ybh-homeButton');
    if (homeButton) homeButton.addEventListener('click', () => nav.goHome());

    const tumunuGor = ybhContainer.querySelector('#ybh-tumunuGor');
    if (tumunuGor) tumunuGor.addEventListener('click', () => nav.navigateTo('raporlar'));

    // Tablo içi "Düzenle" butonları innerHTML ile üretildiği için global erişim gerekiyor
    window.ybhPage = { duzenle };
}

function duzenle(id) {
    nav.navigateTo('editor', { raporId: id });
}

/**
 * Rapor sayısı rozetini ve son 5 kaydı doldurur.
 */
function loadOzet() {
    return new Promise((resolve) => {
        const badge  = ybhContainer.querySelector('#ybh-raporSayisi');
        const tbody  = ybhContainer.querySelector('#ybh-tableBody');
        const bosMsg = ybhContainer.querySelector('#ybh-emptyMessage');
        const tablo  = ybhContainer.querySelector('#ybh-tableContainer');

        // Bu modüle ait raporlar (modul kolonu eski kayıtlarda boş olabilir)
        const kosul = `(modul = 'yapi-bedeli' OR modul IS NULL)`;

        db.get(`SELECT COUNT(*) AS adet FROM raporlar WHERE ${kosul}`, [], (err, row) => {
            if (badge) {
                badge.textContent = (err || !row) ? '—' : `${row.adet} kayıt`;
            }
        });

        db.all(
            `SELECT id, raporTarihi, ilce, mahalle, ada, parsel
             FROM raporlar
             WHERE ${kosul}
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
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${row.id}</td>
                        <td>${formatTarih(row.raporTarihi)}</td>
                        <td>${row.ilce || '-'}</td>
                        <td>${row.mahalle || '-'}</td>
                        <td>${(row.ada || '-')} / ${(row.parsel || '-')}</td>
                        <td><button class="hub-btn" onclick="window.ybhPage.duzenle(${row.id})">Düzenle</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                resolve();
            }
        );
    });
}

function formatTarih(tarih) {
    if (!tarih) return '-';
    const d = new Date(tarih);
    if (isNaN(d.getTime())) return tarih;
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

module.exports = { onLoad, onUnload, hasUnsavedChanges };
