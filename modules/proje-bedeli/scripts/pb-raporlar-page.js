/**
 * Proje Bedeli Raporlar Sayfa Modülü
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { shell } = require('electron');
const { getDbPath, getAppRootDir } = require('../../../shared/scripts/db-helper');
const { generateReport } = require('./pb-reportGenerator');

const dbPath = getDbPath();
let db = null;
let nav = null;
let pbrContainer = null;

// Branş sabitleri (Word export için)
const BRANSLAR = [
    { kod: 'mim', adi: 'Mimarlık', katsayi: 100 },
    { kod: 'ins', adi: 'İnşaat',   katsayi: 75 },
    { kod: 'mek', adi: 'Mekanik',  katsayi: 50 },
    { kod: 'elk', adi: 'Elektrik', katsayi: 38.50 }
];

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
                        <button class="pb-raporlar-btn view" title="Düzenle" onclick="window.pbrPage.duzenle(${row.id})">📝 Düzenle</button>
                        <button class="pb-raporlar-btn export" title="Word'e Aktar" onclick="window.pbrPage.wordeAktar(${row.id})">📥 Word</button>
                        <button class="pb-raporlar-btn delete" title="Sil" onclick="window.pbrPage.sil(${row.id})">🗑️ Sil</button>
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

function duzenle(id) {
    console.log('📝 Rapor düzenleniyor:', id);
    nav.navigateTo('pb-editor', { raporId: id });
}

function wordeAktar(id) {
    db.get(`SELECT * FROM projeBedeliRaporlari WHERE id = ?`, [id], (err, row) => {
        if (err || !row) {
            window.showNotification?.('Rapor bulunamadı!', 'error');
            return;
        }

        // Word generator için veriyi hazırla
        const branslarArr = BRANSLAR.map(b => ({
            bransAdi: b.adi,
            hizmetDaliKatsayisi: b.katsayi,
            hizmetSinifi: row[`${b.kod}Sinif`] ? `${row[`${b.kod}Sinif`]}. Sınıf` : '-',
            pidOrani: parseFloat(row[`${b.kod}PidOrani`]) || 0,
            hizmetBolumuOrani: parseFloat(row[`${b.kod}HizmetOrani`]) || 0,
            seciliHizmetBedeli: parseFloat(row[`${b.kod}HizmetBedeli`]) || 0
        }));

        const raportorAdlari = (row.raportorAdi || '').split(',').map(s => s.trim()).filter(Boolean);
        const raportorUnvanlari = (row.raportorUnvani || '').split(',').map(s => s.trim());

        const raporData = {
            isAdi: row.isAdi,
            yapiSinifi: row.yapiSinifi,
            yapiGrubu: row.yapiGrubu,
            birimMaliyet: row.birimMaliyet,
            toplamInsaatAlani: row.toplamInsaatAlani,
            toplamMaliyet: row.toplamMaliyet,
            branslar: branslarArr,
            raportorAdlari,
            raportorUnvanlari
        };

        // Dosya yolu
        const fs = require('fs');
        const tarih = new Date().toISOString().slice(0, 10);
        const saat = new Date().toTimeString().slice(0, 5).replace(':', '-');
        const safeIsAdi = (row.isAdi || 'Rapor').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '_').substring(0, 50);
        const dosyaAdi = `ProjeBedeli_${safeIsAdi}_${tarih}_${saat}.docx`;
        const raporlarDir = path.join(getAppRootDir(), 'raporlar');

        try {
            if (!fs.existsSync(raporlarDir)) fs.mkdirSync(raporlarDir, { recursive: true });
        } catch (e) {
            window.showNotification?.('Klasör oluşturulamadı: ' + e.message, 'error');
            return;
        }

        const outputPath = path.join(raporlarDir, dosyaAdi);

        window.showNotification?.('Word raporu oluşturuluyor...', 'info');

        generateReport(raporData, outputPath).then(result => {
            if (result.success) {
                window.showNotification?.('Word raporu oluşturuldu!', 'success');
                shell.openPath(result.path).then(err => {
                    if (err) console.error('Dosya açma hatası:', err);
                });
            } else {
                window.showNotification?.('Word hatası: ' + result.error, 'error');
            }
        }).catch(err => {
            console.error('Word exception:', err);
            window.showNotification?.('Word hatası: ' + err.message, 'error');
        });
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

window.pbrPage = { duzenle, wordeAktar, sil };

module.exports = { onLoad, onUnload, hasUnsavedChanges };
