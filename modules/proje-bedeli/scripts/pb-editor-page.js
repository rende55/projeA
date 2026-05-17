/**
 * Proje Bedeli Rapor Editörü Sayfa Modülü
 * Kayıtlı raporu yükler, düzenler, kaydeder ve Word olarak dışa aktarır.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { shell } = require('electron');
const { getDbPath, getAppRootDir } = require('../../../shared/scripts/db-helper');
const { generateReport } = require('./pb-reportGenerator');

const dbPath = getDbPath();
let db = null;
let nav = null;
let pbedContainer = null;

let currentRaporId = null;
let currentRaporData = null;
let isModified = false;

// Branş sabit bilgileri — Hizmet Dalı Katsayıları & Hizmet Bölümü tanımları
const BRANSLAR = [
    { kod: 'mim', adi: 'Mimarlık', icon: '🏛️', katsayi: 100,   bolumler: [
        { ad: 'Ön Proje',           oran: 15 },
        { ad: 'Kesin Proje',        oran: 20 },
        { ad: 'Uygulama Projesi',   oran: 30 },
        { ad: 'Detaylar',           oran: 20 },
        { ad: 'Orjinal Teslimi',    oran: 5  },
        { ad: 'İhale Dosyası',      oran: 10 }
    ]},
    { kod: 'ins', adi: 'İnşaat',   icon: '🏗️', katsayi: 75,    bolumler: [
        { ad: 'Ön Proje',           oran: 15 },
        { ad: 'Kesin Proje',        oran: 25 },
        { ad: 'Uygulama Projesi',   oran: 30 },
        { ad: 'Detaylar',           oran: 15 },
        { ad: 'Orjinal Teslimi',    oran: 5  },
        { ad: 'İhale Dosyası',      oran: 10 }
    ]},
    { kod: 'mek', adi: 'Mekanik',  icon: '⚙️', katsayi: 50,    bolumler: [
        { ad: 'Öneri Raporu',       oran: 7  },
        { ad: 'Ön Proje',           oran: 20 },
        { ad: 'Uygulama Projesi',   oran: 50 },
        { ad: 'Detaylar',           oran: 8  },
        { ad: 'Orjinal Teslimi',    oran: 5  },
        { ad: 'İhale Dosyası',      oran: 10 }
    ]},
    { kod: 'elk', adi: 'Elektrik', icon: '⚡', katsayi: 38.50, bolumler: [
        { ad: 'Öneri Raporu',       oran: 7  },
        { ad: 'Ön Proje',           oran: 20 },
        { ad: 'Uygulama Projesi',   oran: 50 },
        { ad: 'Detaylar',           oran: 8  },
        { ad: 'Orjinal Teslimi',    oran: 5  },
        { ad: 'İhale Dosyası',      oran: 10 }
    ]}
];

async function onLoad(container, data, navigation) {
    console.log('📝 PB Editör sayfası yükleniyor...', data);
    nav = navigation;
    pbedContainer = container;
    db = new sqlite3.Database(dbPath);

    if (data && data.raporId) {
        currentRaporId = data.raporId;
        await loadRapor(currentRaporId);
    } else {
        showNotification('Rapor ID belirtilmemiş!', 'error');
    }

    setupEventListeners();
    hideLoading();
    console.log('✅ PB Editör sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
    document.removeEventListener('keydown', handleKeyboard);
}

function hasUnsavedChanges() { return isModified; }

function hideLoading() {
    const loading = pbedContainer.querySelector('#pbed-loadingOverlay');
    if (loading) loading.classList.add('hidden');
}

function showNotification(msg, type = 'info') {
    if (window.showNotification) window.showNotification(msg, type);
    else console.log(`[${type}] ${msg}`);
}

function setupEventListeners() {
    pbedContainer.querySelector('#pbed-kaydetBtn')?.addEventListener('click', kaydet);
    pbedContainer.querySelector('#pbed-recalcBtn')?.addEventListener('click', () => { recalcAll(); markModified(); });
    pbedContainer.querySelector('#pbed-wordBtn')?.addEventListener('click', wordOlarakIndir);
    pbedContainer.querySelector('#pbed-kapatBtn')?.addEventListener('click', kapat);

    document.addEventListener('keydown', handleKeyboard);
}

function handleKeyboard(e) {
    if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        kaydet();
    }
}

// ---- Rapor yükleme ----
function loadRapor(id) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM projeBedeliRaporlari WHERE id = ?`, [id], (err, row) => {
            if (err || !row) {
                showNotification('Rapor bulunamadı!', 'error');
                reject(err || new Error('Rapor bulunamadı'));
                return;
            }
            currentRaporData = row;
            renderRapor(row);
            resolve();
        });
    });
}

function renderRapor(rapor) {
    // Header
    const raporNoEl = pbedContainer.querySelector('#pbed-raporNo');
    if (raporNoEl) raporNoEl.textContent = rapor.raporNo || `#${rapor.id}`;

    // Genel Bilgiler
    pbedContainer.querySelector('#pbed-isAdi').value = rapor.isAdi || '';
    pbedContainer.querySelector('#pbed-toplamInsaatAlani').value = rapor.toplamInsaatAlani || 0;
    pbedContainer.querySelector('#pbed-hesapYili').value = rapor.hesapYili || '';
    const sinifGrup = [rapor.yapiSinifi, rapor.yapiGrubu].filter(Boolean).join(' / ');
    pbedContainer.querySelector('#pbed-yapiSinifGrup').value = sinifGrup;
    pbedContainer.querySelector('#pbed-birimMaliyet').value = parseFloat(rapor.birimMaliyet || 0);
    pbedContainer.querySelector('#pbed-toplamMaliyet').value = parseFloat(rapor.toplamMaliyet || 0).toFixed(2);

    // Branş satırlarını oluştur
    renderBransRows(rapor);

    // Hizmet bölümleri editörü
    renderHizmetBolumleri(rapor);

    // İmzacılar
    renderImzacilar(rapor);

    // Form change listener (top-level)
    pbedContainer.querySelectorAll('#pbed-isAdi, #pbed-hesapYili, #pbed-yapiSinifGrup').forEach(el => {
        el.addEventListener('input', markModified);
    });
    ['#pbed-toplamInsaatAlani', '#pbed-birimMaliyet'].forEach(sel => {
        const el = pbedContainer.querySelector(sel);
        if (el) el.addEventListener('input', () => { recalcToplamMaliyet(); recalcAll(); markModified(); });
    });

    // İlk yüklemede tüm hesaplamaları yap (dataset.bedel set olsun, toplam doğru göstersin)
    recalcAll();
    clearModified(); // İlk render kullanıcı değişikliği değil
}

function renderBransRows(rapor) {
    const tbody = pbedContainer.querySelector('#pbed-bransTbody');
    tbody.innerHTML = '';

    BRANSLAR.forEach(brans => {
        const sinif = rapor[`${brans.kod}Sinif`];
        const pidOrani = parseFloat(rapor[`${brans.kod}PidOrani`] || 0);
        const hizmetOrani = parseFloat(rapor[`${brans.kod}HizmetOrani`] || 0);
        const hizmetBedeli = parseFloat(rapor[`${brans.kod}HizmetBedeli`] || 0);

        const tr = document.createElement('tr');
        tr.dataset.brans = brans.kod;
        tr.innerHTML = `
            <td class="brans-name">${brans.icon} ${brans.adi}</td>
            <td>
                <input type="number" step="0.01" min="0" class="pbed-katsayi" value="${brans.katsayi}">
            </td>
            <td>
                <select class="pbed-sinif">
                    <option value="">-</option>
                    ${[1,2,3,4,5].map(s => `<option value="${s}" ${String(sinif) === String(s) ? 'selected' : ''}>${s}. Sınıf</option>`).join('')}
                </select>
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="pbed-pid" value="${pidOrani.toFixed(2)}">
            </td>
            <td>
                <input type="number" step="0.01" min="0" class="pbed-hizmetOran" value="${hizmetOrani.toFixed(2)}">
            </td>
            <td class="bedel" data-bedel>${formatPara(hizmetBedeli)}</td>
        `;
        tbody.appendChild(tr);

        // Listeners
        tr.querySelectorAll('input, select').forEach(inp => {
            inp.addEventListener('input', () => { recalcBrans(brans.kod); markModified(); });
            inp.addEventListener('change', () => { recalcBrans(brans.kod); markModified(); });
        });
    });

    // Genel toplamı güncelle
    updateGenelToplam();
}

function renderHizmetBolumleri(rapor) {
    const container = pbedContainer.querySelector('#pbed-hizmetBolumleriContainer');
    container.innerHTML = '';

    BRANSLAR.forEach(brans => {
        // Mevcut seçili bölümleri parse et (örn: "Ön Proje:%15, Kesin Proje:%20")
        const kayitliStr = rapor[`${brans.kod}HizmetBolumleri`] || '';
        const seciliAdlar = new Set(
            kayitliStr.split(',').map(s => s.trim().split(':')[0].trim()).filter(Boolean)
        );

        const block = document.createElement('div');
        block.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="color: #1E3A5F; font-size: 13px;">${brans.icon} ${brans.adi}</strong>
                <span style="font-size: 12px; color: #475569;">Seçili: <span id="pbed-${brans.kod}-toplamOran" style="font-weight: 700; color: #2C5282;">%0</span></span>
            </div>
            <div class="pbed-hizmet-bolumleri-grid" data-brans="${brans.kod}">
                ${brans.bolumler.map((b, i) => {
                    const isSelected = seciliAdlar.has(b.ad);
                    return `
                        <label class="pbed-hizmet-bolum-card ${isSelected ? 'selected' : ''}" data-oran="${b.oran}" data-ad="${b.ad}">
                            <input type="checkbox" ${isSelected ? 'checked' : ''}>
                            <span class="ad">${b.ad}</span>
                            <span class="oran">%${b.oran}</span>
                        </label>
                    `;
                }).join('')}
            </div>
        `;
        container.appendChild(block);

        // Click listener
        block.querySelectorAll('.pbed-hizmet-bolum-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const cb = card.querySelector('input[type="checkbox"]');
                cb.checked = !cb.checked;
                card.classList.toggle('selected', cb.checked);
                hizmetBolumleriToplamGuncelle(brans.kod, true);
                markModified();
            });
        });

        // İlk yüklemede sadece badge'i güncelle (input'a dokunma — kayıtlı hizmetOrani değeri korunsun)
        hizmetBolumleriToplamGuncelle(brans.kod, false);
    });
}

function hizmetBolumleriToplamGuncelle(bransKod, updateInput) {
    let toplam = 0;
    pbedContainer.querySelectorAll(`.pbed-hizmet-bolumleri-grid[data-brans="${bransKod}"] .pbed-hizmet-bolum-card.selected`).forEach(card => {
        toplam += parseFloat(card.dataset.oran) || 0;
    });
    const span = pbedContainer.querySelector(`#pbed-${bransKod}-toplamOran`);
    if (span) span.textContent = `%${toplam}`;

    if (updateInput) {
        // Sadece kullanıcı tıklamasında: Branş satırındaki Hizmet Bölümü Oranı inputunu güncelle
        const tr = pbedContainer.querySelector(`#pbed-bransTbody tr[data-brans="${bransKod}"]`);
        if (tr) {
            const input = tr.querySelector('.pbed-hizmetOran');
            if (input) {
                input.value = toplam.toFixed(2);
                recalcBrans(bransKod);
            }
        }
    }
}

function renderImzacilar(rapor) {
    const grid = pbedContainer.querySelector('#pbed-imzacilarGrid');
    grid.innerHTML = '';

    const adlar = (rapor.raportorAdi || '').split(',').map(s => s.trim());
    const unvanlar = (rapor.raportorUnvani || '').split(',').map(s => s.trim());
    const sayi = parseInt(rapor.raportorSayisi) || Math.max(adlar.filter(Boolean).length, 1);

    for (let i = 0; i < 4; i++) {
        const card = document.createElement('div');
        card.className = 'pbed-imzaci-card';
        card.style.display = i < sayi ? 'block' : 'none';
        card.dataset.index = i;
        card.innerHTML = `
            <h5>İmzacı ${i + 1}</h5>
            <div class="pbed-form-grid">
                <div class="pbed-form-group">
                    <label>Ad Soyad</label>
                    <input type="text" class="pbed-imzaci-ad" value="${adlar[i] || ''}">
                </div>
                <div class="pbed-form-group">
                    <label>Ünvan</label>
                    <input type="text" class="pbed-imzaci-unvan" value="${unvanlar[i] || ''}">
                </div>
            </div>
        `;
        grid.appendChild(card);
        card.querySelectorAll('input').forEach(inp => inp.addEventListener('input', markModified));
    }

    // İmzacı sayısı kontrolü
    const sayiBlock = document.createElement('div');
    sayiBlock.style.cssText = 'grid-column: 1 / -1; padding: 10px 14px; background: #EFF6FF; border-radius: 6px; display: flex; align-items: center; gap: 10px;';
    sayiBlock.innerHTML = `
        <label style="font-size: 12px; font-weight: 600; color: #1E3A5F;">İmzacı Sayısı:</label>
        <select id="pbed-imzaciSayisi" style="padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 5px; font-size: 13px;">
            ${[1,2,3,4].map(n => `<option value="${n}" ${n === sayi ? 'selected' : ''}>${n}</option>`).join('')}
        </select>
    `;
    grid.insertBefore(sayiBlock, grid.firstChild);
    sayiBlock.querySelector('#pbed-imzaciSayisi').addEventListener('change', (e) => {
        const yeniSayi = parseInt(e.target.value);
        grid.querySelectorAll('.pbed-imzaci-card').forEach((card, idx) => {
            card.style.display = idx < yeniSayi ? 'block' : 'none';
        });
        markModified();
    });
}

// ---- Hesaplama ----
function recalcToplamMaliyet() {
    const alan = parseFloat(pbedContainer.querySelector('#pbed-toplamInsaatAlani').value) || 0;
    const birim = parseFloat(pbedContainer.querySelector('#pbed-birimMaliyet').value) || 0;
    const toplam = alan * birim;
    pbedContainer.querySelector('#pbed-toplamMaliyet').value = toplam.toFixed(2);
}

function recalcBrans(bransKod) {
    const tr = pbedContainer.querySelector(`#pbed-bransTbody tr[data-brans="${bransKod}"]`);
    if (!tr) return;

    const toplamMaliyet = parseFloat(pbedContainer.querySelector('#pbed-toplamMaliyet').value) || 0;
    const katsayi = parseFloat(tr.querySelector('.pbed-katsayi').value) || 0;
    const pidOrani = parseFloat(tr.querySelector('.pbed-pid').value) || 0;
    const hizmetOrani = parseFloat(tr.querySelector('.pbed-hizmetOran').value) || 0;

    // Proje Bedeli = Toplam Maliyet × (Katsayı/100) × (PID Oranı/100)
    // Hizmet Bedeli = Proje Bedeli × (Hizmet Oranı/100)
    const projeBedeli = toplamMaliyet * (katsayi / 100) * (pidOrani / 100);
    const hizmetBedeli = projeBedeli * (hizmetOrani / 100);

    const bedelTd = tr.querySelector('[data-bedel]');
    if (bedelTd) bedelTd.textContent = formatPara(hizmetBedeli);
    tr.dataset.bedel = hizmetBedeli;

    updateGenelToplam();
}

function recalcAll() {
    recalcToplamMaliyet();
    BRANSLAR.forEach(b => recalcBrans(b.kod));
}

function updateGenelToplam() {
    let toplam = 0;
    pbedContainer.querySelectorAll('#pbed-bransTbody tr').forEach(tr => {
        toplam += parseFloat(tr.dataset.bedel) || 0;
    });
    const el = pbedContainer.querySelector('#pbed-genelToplam');
    if (el) el.textContent = formatPara(toplam);
}

// ---- Veri Toplama ----
function collectData() {
    const isAdi = pbedContainer.querySelector('#pbed-isAdi').value.trim();
    const toplamInsaatAlani = parseFloat(pbedContainer.querySelector('#pbed-toplamInsaatAlani').value) || 0;
    const hesapYili = pbedContainer.querySelector('#pbed-hesapYili').value.trim();
    const sinifGrupStr = pbedContainer.querySelector('#pbed-yapiSinifGrup').value.trim();
    const [yapiSinifi = '', yapiGrubu = ''] = sinifGrupStr.split('/').map(s => s.trim());
    const birimMaliyet = parseFloat(pbedContainer.querySelector('#pbed-birimMaliyet').value) || 0;
    const toplamMaliyet = parseFloat(pbedContainer.querySelector('#pbed-toplamMaliyet').value) || 0;

    // Branş verileri
    const bransVerileri = {};
    let genelToplamBedel = 0;

    BRANSLAR.forEach(brans => {
        const tr = pbedContainer.querySelector(`#pbed-bransTbody tr[data-brans="${brans.kod}"]`);
        const katsayi = parseFloat(tr.querySelector('.pbed-katsayi').value) || 0;
        const sinif = tr.querySelector('.pbed-sinif').value || null;
        const pidOrani = parseFloat(tr.querySelector('.pbed-pid').value) || 0;
        const hizmetOrani = parseFloat(tr.querySelector('.pbed-hizmetOran').value) || 0;
        const projeBedeli = toplamMaliyet * (katsayi / 100) * (pidOrani / 100);
        const hizmetBedeli = projeBedeli * (hizmetOrani / 100);

        // Seçili hizmet bölümleri stringi
        const seciliBolumler = [];
        pbedContainer.querySelectorAll(`.pbed-hizmet-bolumleri-grid[data-brans="${brans.kod}"] .pbed-hizmet-bolum-card.selected`).forEach(card => {
            seciliBolumler.push(`${card.dataset.ad}:%${card.dataset.oran}`);
        });

        bransVerileri[brans.kod] = {
            katsayi, sinif, pidOrani, hizmetOrani, projeBedeli, hizmetBedeli,
            hizmetBolumleri: seciliBolumler.join(', ')
        };
        genelToplamBedel += hizmetBedeli;
    });

    // İmzacılar
    const imzaciSayisi = parseInt(pbedContainer.querySelector('#pbed-imzaciSayisi')?.value) || 1;
    const adlar = [];
    const unvanlar = [];
    pbedContainer.querySelectorAll('#pbed-imzacilarGrid .pbed-imzaci-card').forEach((card, idx) => {
        if (idx >= imzaciSayisi) return;
        const ad = card.querySelector('.pbed-imzaci-ad').value.trim();
        const unvan = card.querySelector('.pbed-imzaci-unvan').value.trim();
        if (ad) {
            adlar.push(ad);
            unvanlar.push(unvan);
        }
    });

    return {
        isAdi, toplamInsaatAlani, hesapYili, yapiSinifi, yapiGrubu,
        birimMaliyet, toplamMaliyet, bransVerileri, genelToplamBedel,
        raportorSayisi: imzaciSayisi,
        raportorAdlari: adlar,
        raportorUnvanlari: unvanlar
    };
}

// ---- Kaydet ----
function kaydet() {
    if (!currentRaporId || !db) {
        showNotification('Kaydetme hatası: Rapor ID yok', 'error');
        return;
    }

    const v = collectData();
    if (!v.isAdi) {
        showNotification('İşin Adı boş olamaz!', 'warning');
        return;
    }

    const sql = `UPDATE projeBedeliRaporlari SET
        isAdi = ?, toplamInsaatAlani = ?, hesapYili = ?, yapiSinifi = ?, yapiGrubu = ?,
        birimMaliyet = ?, toplamMaliyet = ?,
        mimSinif = ?, mimPidOrani = ?, mimProjeBedeli = ?, mimHizmetOrani = ?, mimHizmetBedeli = ?, mimHizmetBolumleri = ?,
        insSinif = ?, insPidOrani = ?, insProjeBedeli = ?, insHizmetOrani = ?, insHizmetBedeli = ?, insHizmetBolumleri = ?,
        mekSinif = ?, mekPidOrani = ?, mekProjeBedeli = ?, mekHizmetOrani = ?, mekHizmetBedeli = ?, mekHizmetBolumleri = ?,
        elkSinif = ?, elkPidOrani = ?, elkProjeBedeli = ?, elkHizmetOrani = ?, elkHizmetBedeli = ?, elkHizmetBolumleri = ?,
        genelToplamBedel = ?, raportorSayisi = ?, raportorAdi = ?, raportorUnvani = ?,
        guncellemeTarihi = datetime('now','localtime')
        WHERE id = ?`;

    const params = [
        v.isAdi, v.toplamInsaatAlani, v.hesapYili, v.yapiSinifi, v.yapiGrubu,
        v.birimMaliyet, v.toplamMaliyet,
        v.bransVerileri.mim.sinif, v.bransVerileri.mim.pidOrani, v.bransVerileri.mim.projeBedeli, v.bransVerileri.mim.hizmetOrani, v.bransVerileri.mim.hizmetBedeli, v.bransVerileri.mim.hizmetBolumleri,
        v.bransVerileri.ins.sinif, v.bransVerileri.ins.pidOrani, v.bransVerileri.ins.projeBedeli, v.bransVerileri.ins.hizmetOrani, v.bransVerileri.ins.hizmetBedeli, v.bransVerileri.ins.hizmetBolumleri,
        v.bransVerileri.mek.sinif, v.bransVerileri.mek.pidOrani, v.bransVerileri.mek.projeBedeli, v.bransVerileri.mek.hizmetOrani, v.bransVerileri.mek.hizmetBedeli, v.bransVerileri.mek.hizmetBolumleri,
        v.bransVerileri.elk.sinif, v.bransVerileri.elk.pidOrani, v.bransVerileri.elk.projeBedeli, v.bransVerileri.elk.hizmetOrani, v.bransVerileri.elk.hizmetBedeli, v.bransVerileri.elk.hizmetBolumleri,
        v.genelToplamBedel, v.raportorSayisi, v.raportorAdlari.join(', '), v.raportorUnvanlari.join(', '),
        currentRaporId
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error('Kaydetme hatası:', err);
            showNotification('Kaydetme hatası: ' + err.message, 'error');
            return;
        }
        currentRaporData = { ...currentRaporData, ...v };
        clearModified();
        showNotification('Değişiklikler kaydedildi', 'success');
    });
}

// ---- Word Export ----
function wordOlarakIndir() {
    if (!currentRaporId) {
        showNotification('Rapor verisi yok', 'error');
        return;
    }

    const v = collectData();
    if (!v.isAdi) {
        showNotification('İşin Adı boş! Önce raporu kaydedin.', 'warning');
        return;
    }

    // Word generator için veriyi hazırla
    const branslarArr = BRANSLAR.map(b => ({
        bransAdi: b.adi,
        hizmetDaliKatsayisi: v.bransVerileri[b.kod].katsayi,
        hizmetSinifi: v.bransVerileri[b.kod].sinif ? `${v.bransVerileri[b.kod].sinif}. Sınıf` : '-',
        pidOrani: v.bransVerileri[b.kod].pidOrani,
        hizmetBolumuOrani: v.bransVerileri[b.kod].hizmetOrani,
        seciliHizmetBedeli: v.bransVerileri[b.kod].hizmetBedeli
    }));

    const raporData = {
        isAdi: v.isAdi,
        yapiSinifi: v.yapiSinifi,
        yapiGrubu: v.yapiGrubu,
        birimMaliyet: v.birimMaliyet,
        toplamInsaatAlani: v.toplamInsaatAlani,
        toplamMaliyet: v.toplamMaliyet,
        branslar: branslarArr,
        raportorAdlari: v.raportorAdlari,
        raportorUnvanlari: v.raportorUnvanlari
    };

    // Dosya yolunu oluştur
    const fs = require('fs');
    const tarih = new Date().toISOString().slice(0, 10);
    const saat = new Date().toTimeString().slice(0, 5).replace(':', '-');
    const safeIsAdi = (v.isAdi || 'Rapor').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '_').substring(0, 50);
    const dosyaAdi = `ProjeBedeli_${safeIsAdi}_${tarih}_${saat}.docx`;
    const raporlarDir = path.join(getAppRootDir(), 'raporlar');

    try {
        if (!fs.existsSync(raporlarDir)) fs.mkdirSync(raporlarDir, { recursive: true });
    } catch (e) {
        showNotification('Klasör oluşturulamadı: ' + e.message, 'error');
        return;
    }

    const outputPath = path.join(raporlarDir, dosyaAdi);

    showNotification('Word raporu oluşturuluyor...', 'info');

    generateReport(raporData, outputPath).then(result => {
        if (result.success) {
            showNotification('Word raporu oluşturuldu!', 'success');
            shell.openPath(result.path).then(err => {
                if (err) console.error('Dosya açma hatası:', err);
            });
        } else {
            showNotification('Word hatası: ' + result.error, 'error');
        }
    }).catch(err => {
        console.error('Word exception:', err);
        showNotification('Word hatası: ' + err.message, 'error');
    });
}

function kapat() {
    if (isModified) {
        if (!confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
    }
    nav.goBack();
}

// ---- Durum ----
function markModified() {
    isModified = true;
    const status = pbedContainer.querySelector('#pbed-status');
    if (status) {
        status.textContent = '● Değişiklikler kaydedilmedi';
        status.className = 'pbed-editor-status modified';
    }
}

function clearModified() {
    isModified = false;
    const status = pbedContainer.querySelector('#pbed-status');
    if (status) {
        status.textContent = '✓ Kaydedildi';
        status.className = 'pbed-editor-status saved';
    }
}

// ---- Helpers ----
function formatPara(deger) {
    const sayi = parseFloat(deger) || 0;
    return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

module.exports = { onLoad, onUnload, hasUnsavedChanges };
