/**
 * Hesaplamalar - Modül Başlangıç Sayfası (Hub)
 *
 * Rapor üretmeyen pratik araçların kataloğu.
 * İlk araç: Cephe Metrajı.
 */

const sqlite3 = require('sqlite3').verbose();
const { getDbPath } = require('../../../shared/scripts/db-helper');

const dbPath = getDbPath();
let db = null;
let nav = null;
let hhContainer = null;

async function onLoad(container, data, navigation) {
    console.log('🧮 Hesaplamalar hub sayfası yükleniyor...');
    nav = navigation;
    hhContainer = container;
    db = new sqlite3.Database(dbPath);

    setupEventListeners();
    await loadOzet();

    console.log('✅ Hesaplamalar hub sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
    delete window.hhPage;
}

function hasUnsavedChanges() { return false; }

function setupEventListeners() {
    hhContainer.querySelectorAll('.hub-action-card').forEach(card => {
        card.addEventListener('click', () => {
            if (card.classList.contains('disabled')) {
                const ad = card.getAttribute('data-yakinda') || 'Bu araç';
                if (window.showNotification) {
                    window.showNotification(`${ad} aracı henüz geliştirilme aşamasında.`, 'warning');
                }
                return;
            }
            const hedef = card.getAttribute('data-action');
            if (hedef) nav.navigateTo(hedef);
        });
    });

    const homeButton = hhContainer.querySelector('#hh-homeButton');
    if (homeButton) homeButton.addEventListener('click', () => nav.goHome());

    const tumunuGor = hhContainer.querySelector('#hh-tumunuGor');
    if (tumunuGor) tumunuGor.addEventListener('click', () => nav.navigateTo('metraj-raporlar'));

    window.hhPage = { ac };
}

function ac(id) {
    nav.navigateTo('cephe-metraj', { metrajId: id });
}

/**
 * Metraj sayısı rozetini ve son 5 metrajı doldurur.
 */
function loadOzet() {
    return new Promise((resolve) => {
        const badge  = hhContainer.querySelector('#hh-metrajSayisi');
        const tbody  = hhContainer.querySelector('#hh-tableBody');
        const bosMsg = hhContainer.querySelector('#hh-emptyMessage');
        const tablo  = hhContainer.querySelector('#hh-tableContainer');

        db.get(`SELECT COUNT(*) AS adet FROM metrajlar WHERE aktif = 1`, [], (err, row) => {
            if (badge) {
                badge.textContent = (err || !row) ? '—' : `${row.adet} kayıt`;
            }
        });

        db.all(
            `SELECT id, isAdi, cepheSayisi, toplamBoyaAlani, toplamYalitimAlani,
                    olusturmaTarihi, guncellemeTarihi
             FROM metrajlar
             WHERE aktif = 1
             ORDER BY id DESC
             LIMIT 5`,
            [],
            (err, rows) => {
                if (err) {
                    // Tablo henüz oluşmamış olabilir; sayfa yine de açılmalı
                    console.error('Son metrajlar yüklenemedi:', err);
                    if (tablo) tablo.style.display = 'none';
                    if (bosMsg) bosMsg.style.display = 'block';
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
                        <td>${formatTarih(row.guncellemeTarihi || row.olusturmaTarihi)}</td>
                        <td>${row.isAdi || 'İsimsiz metraj'}</td>
                        <td>${row.cepheSayisi || 0}</td>
                        <td class="numeric">${formatAlan(row.toplamBoyaAlani)}</td>
                        <td class="numeric">${formatAlan(row.toplamYalitimAlani)}</td>
                        <td><button class="hub-btn" onclick="window.hhPage.ac(${row.id})">Aç</button></td>
                    `;
                    tbody.appendChild(tr);
                });

                resolve();
            }
        );
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
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

module.exports = { onLoad, onUnload, hasUnsavedChanges };
