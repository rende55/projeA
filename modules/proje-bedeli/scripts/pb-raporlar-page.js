/**
 * Proje Bedeli Raporlar Sayfa Modülü
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', '..', 'raporlar.db');
let db = null;
let nav = null;
let pbrContainer = null;

async function onLoad(container, data, navigation) {
    console.log('📋 Proje Bedeli Raporlar sayfası yükleniyor...');
    nav = navigation;
    pbrContainer = container;
    db = new sqlite3.Database(dbPath);
    setupEventListeners();
    await loadRaporlar();
    console.log('✅ Proje Bedeli Raporlar sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
}

function hasUnsavedChanges() { return false; }

function setupEventListeners() {
    const backButton = pbrContainer.querySelector('#pbr-backButton');
    if (backButton) {
        backButton.addEventListener('click', () => nav.goBack());
    }
}

function loadRaporlar() {
    return new Promise((resolve, reject) => {
        const tbody = pbrContainer.querySelector('#pbr-tableBody');
        const emptyMessage = pbrContainer.querySelector('#pbr-emptyMessage');
        const table = pbrContainer.querySelector('#pbr-table');
        
        if (!tbody) { resolve(); return; }
        
        db.all(`SELECT * FROM projeBedeliRaporlari WHERE aktif = 1 ORDER BY id DESC`, [], (err, rows) => {
            if (err) { console.error('Raporlar yüklenemedi:', err); reject(err); return; }
            
            tbody.innerHTML = '';
            
            if (!rows || rows.length === 0) {
                if (table) table.style.display = 'none';
                if (emptyMessage) emptyMessage.style.display = 'block';
                resolve(); return;
            }
            
            if (table) table.style.display = 'table';
            if (emptyMessage) emptyMessage.style.display = 'none';
            
            rows.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="rapor-no">${row.raporNo || '-'}</td>
                    <td>${row.isAdi || '-'}</td>
                    <td>${row.hesapYili || '-'}</td>
                    <td>${formatPara(row.toplamMaliyet)}</td>
                    <td class="bedel">${formatPara(row.genelToplamBedel)}</td>
                    <td>${formatTarih(row.olusturmaTarihi)}</td>
                    <td class="pb-raporlar-actions">
                        <button class="pb-raporlar-btn view" onclick="window.pbrPage.goruntule(${row.id})">👁️</button>
                        <button class="pb-raporlar-btn delete" onclick="window.pbrPage.sil(${row.id})">🗑️</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            resolve();
        });
    });
}

function formatPara(deger) {
    if (!deger && deger !== 0) return '-';
    return parseFloat(deger).toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' TL';
}

function formatTarih(tarih) {
    if (!tarih) return '-';
    return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function goruntule(id) {
    db.get(`SELECT * FROM projeBedeliRaporlari WHERE id = ?`, [id], (err, row) => {
        if (err || !row) { window.showNotification?.('Rapor bulunamadı!', 'error'); return; }
        alert(`Rapor: ${row.raporNo}\nİşin Adı: ${row.isAdi}\nToplam Maliyet: ${formatPara(row.toplamMaliyet)}\nToplam Hizmet Bedeli: ${formatPara(row.genelToplamBedel)}`);
    });
}

function sil(id) {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    db.run(`UPDATE projeBedeliRaporlari SET aktif = 0 WHERE id = ?`, [id], (err) => {
        if (err) { window.showNotification?.('Silme hatası!', 'error'); return; }
        window.showNotification?.('Rapor silindi', 'success');
        loadRaporlar();
    });
}

window.pbrPage = { goruntule, sil };

module.exports = { onLoad, onUnload, hasUnsavedChanges };
