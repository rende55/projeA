/**
 * Cephe Metrajı - Sayfa Modülü
 *
 * Cephe boya / yalıtım metrajı hesaplama aracı.
 * Tüm veri tek bir `metrajState` nesnesinde tutulur; DOM'dan okuma yapılmaz.
 * Hesap mantığı metraj-hesap.js içindedir (saf fonksiyonlar).
 */

const sqlite3 = require('sqlite3').verbose();
const { getDbPath } = require('../../../shared/scripts/db-helper');
const hesap = require('./metraj-hesap');

const dbPath = getDbPath();
let db = null;
let nav = null;
let cmContainer = null;

// ===== DURUM =====
let metrajState = null;
let aktifCephe = 0;
let ozetKapsami = 'tum';      // 'tum' | 'cephe'
let degisiklikVar = false;
let kayitliId = null;

const VARSAYILAN_CEPHE_ADLARI = ['Kuzey', 'Güney', 'Doğu', 'Batı'];

// ===== YAŞAM DÖNGÜSÜ =====

async function onLoad(container, data, navigation) {
    console.log('📐 Cephe Metrajı sayfası yükleniyor...');
    nav = navigation;
    cmContainer = container;
    db = new sqlite3.Database(dbPath);

    window.cmPage = {
        boslukEkle, boslukSil,
        cikmaEkle, cikmaSil,
        cepheSec
    };

    metrajState = bosState();

    if (data && data.metrajId) {
        await metrajYukle(data.metrajId);
    }

    renderAyarlar();
    setupEventListeners();
    renderAll();

    degisiklikVar = false;
    console.log('✅ Cephe Metrajı sayfası yüklendi');
}

async function onUnload() {
    if (db) { db.close(); db = null; }
    delete window.cmPage;
    metrajState = null;
}

function hasUnsavedChanges() {
    return degisiklikVar;
}

// ===== DURUM YARDIMCILARI =====

function bosState() {
    return {
        isAdi: '',
        aciklama: '',
        ayarlar: hesap.varsayilanAyarlar(),
        cepheler: [yeniCephe(0)]
    };
}

function yeniCephe(index) {
    return {
        ad: VARSAYILAN_CEPHE_ADLARI[index] || `Cephe ${index + 1}`,
        en: '',
        yukseklik: '',
        bosluklar: [],
        cikmalar: [],
        sacak: { var: false, genislik: '', alinYuksekligi: '' }
    };
}

function yeniBosluk() {
    return {
        tip: 'pencere',
        en: '',
        boy: '',
        adet: 1,
        gommeDerinligi: '',
        denizlikVar: false,
        denizlikDerinligi: ''
    };
}

function yeniCikma() {
    const yuzeyler = {};
    hesap.CIKMA_YUZEYLERI.forEach(y => { yuzeyler[y.kod] = y.varsayilan; });
    return { ad: '', en: '', derinlik: '', yukseklik: '', adet: 1, yuzeyler: yuzeyler };
}

function isaretle() {
    degisiklikVar = true;
}

// ===== OLAY DİNLEYİCİLERİ =====

function setupEventListeners() {
    const backButton = cmContainer.querySelector('#cm-backButton');
    if (backButton) backButton.addEventListener('click', () => nav.goBack());

    const raporlarButton = cmContainer.querySelector('#cm-raporlarButton');
    if (raporlarButton) raporlarButton.addEventListener('click', () => nav.navigateTo('metraj-raporlar'));

    const isAdi = cmContainer.querySelector('#cm-isAdi');
    if (isAdi) isAdi.addEventListener('input', (e) => { metrajState.isAdi = e.target.value; isaretle(); });

    const aciklama = cmContainer.querySelector('#cm-aciklama');
    if (aciklama) aciklama.addEventListener('input', (e) => { metrajState.aciklama = e.target.value; isaretle(); });

    const uygulaBtn = cmContainer.querySelector('#cm-cepheUygula');
    if (uygulaBtn) uygulaBtn.addEventListener('click', cepheSayisiUygula);

    const ayarlarToggle = cmContainer.querySelector('#cm-ayarlarToggle');
    if (ayarlarToggle) {
        ayarlarToggle.addEventListener('click', () => {
            const panel = cmContainer.querySelector('#cm-ayarlarPanel');
            if (panel) panel.style.display = (panel.style.display === 'none') ? 'block' : 'none';
        });
    }

    cmContainer.querySelectorAll('.cm-scope-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            ozetKapsami = btn.getAttribute('data-scope');
            cmContainer.querySelectorAll('.cm-scope-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderOzet();
        });
    });

    const temizleBtn = cmContainer.querySelector('#cm-temizleButton');
    if (temizleBtn) temizleBtn.addEventListener('click', temizle);

    const kaydetBtn = cmContainer.querySelector('#cm-kaydetButton');
    if (kaydetBtn) kaydetBtn.addEventListener('click', kaydet);

    // Cephe paneli her yeniden çizildiği için olaylar konteynere delege edilir
    const tabBody = cmContainer.querySelector('#cm-tabBody');
    if (tabBody) {
        tabBody.addEventListener('input', alanDegisti);
        tabBody.addEventListener('change', alanDegisti);
    }
}

/**
 * Cephe panelindeki herhangi bir girdi değiştiğinde çalışır.
 * Hedefin data-* nitelikleri hangi state alanının güncelleneceğini söyler.
 */
function alanDegisti(e) {
    const el = e.target;
    const alan = el.getAttribute('data-alan');
    if (!alan) return;

    const cepheIdx = parseInt(el.getAttribute('data-cephe'), 10);
    const satirIdx = el.hasAttribute('data-satir') ? parseInt(el.getAttribute('data-satir'), 10) : null;
    const cephe = metrajState.cepheler[cepheIdx];
    if (!cephe) return;

    const deger = (el.type === 'checkbox') ? el.checked : el.value;

    if (alan.indexOf('bosluk.') === 0) {
        const bosluk = cephe.bosluklar[satirIdx];
        if (!bosluk) return;
        const key = alan.slice('bosluk.'.length);
        bosluk[key] = deger;

        // Tip veya denizlik değişince denizlik derinliği alanı aktif/pasif olur
        if (key === 'tip' || key === 'denizlikVar') {
            if (key === 'tip' && deger === 'kapi') bosluk.denizlikVar = false;
            renderCephePanel();
            guncelleHesaplar();
            isaretle();
            return;
        }
    } else if (alan.indexOf('cikma.') === 0) {
        const cikma = cephe.cikmalar[satirIdx];
        if (!cikma) return;
        const key = alan.slice('cikma.'.length);
        if (key.indexOf('yuzey.') === 0) {
            cikma.yuzeyler[key.slice('yuzey.'.length)] = deger;
        } else {
            cikma[key] = deger;
        }
    } else if (alan.indexOf('sacak.') === 0) {
        const key = alan.slice('sacak.'.length);
        cephe.sacak[key] = deger;
        if (key === 'var') {
            renderCephePanel();
            guncelleHesaplar();
            isaretle();
            return;
        }
    } else {
        // Cephe seviyesi alanı (ad / en / yukseklik)
        cephe[alan] = deger;
    }

    guncelleHesaplar();
    isaretle();
}

// ===== CEPHE SAYISI =====

function cepheSayisiUygula() {
    const input = cmContainer.querySelector('#cm-cepheSayisi');
    let hedef = parseInt(input.value, 10);
    if (!hedef || hedef < 1) hedef = 1;
    if (hedef > 20) hedef = 20;
    input.value = hedef;

    const mevcut = metrajState.cepheler.length;
    if (hedef === mevcut) return;

    if (hedef > mevcut) {
        for (let i = mevcut; i < hedef; i++) {
            metrajState.cepheler.push(yeniCephe(i));
        }
    } else {
        const silinecek = mevcut - hedef;
        const onay = confirm(
            `Cephe sayısı ${mevcut} → ${hedef} olarak değiştirilecek.\n` +
            `Son ${silinecek} cephenin girilen verileri silinecek. Devam edilsin mi?`
        );
        if (!onay) {
            input.value = mevcut;
            return;
        }
        metrajState.cepheler.length = hedef;
        if (aktifCephe >= hedef) aktifCephe = hedef - 1;
    }

    isaretle();
    renderAll();
}

function cepheSec(index) {
    if (index < 0 || index >= metrajState.cepheler.length) return;
    aktifCephe = index;
    renderTabs();
    renderCephePanel();
    renderOzet();
}

// ===== SATIR EKLE / SİL =====

function boslukEkle(cepheIdx) {
    const cephe = metrajState.cepheler[cepheIdx];
    if (!cephe) return;
    cephe.bosluklar.push(yeniBosluk());
    isaretle();
    renderCephePanel();
    guncelleHesaplar();
}

function boslukSil(cepheIdx, satirIdx) {
    const cephe = metrajState.cepheler[cepheIdx];
    if (!cephe) return;
    cephe.bosluklar.splice(satirIdx, 1);
    isaretle();
    renderCephePanel();
    guncelleHesaplar();
}

function cikmaEkle(cepheIdx) {
    const cephe = metrajState.cepheler[cepheIdx];
    if (!cephe) return;
    cephe.cikmalar.push(yeniCikma());
    isaretle();
    renderCephePanel();
    guncelleHesaplar();
}

function cikmaSil(cepheIdx, satirIdx) {
    const cephe = metrajState.cepheler[cepheIdx];
    if (!cephe) return;
    cephe.cikmalar.splice(satirIdx, 1);
    isaretle();
    renderCephePanel();
    guncelleHesaplar();
}

// ===== ÇİZİM =====

function renderAll() {
    const isAdi = cmContainer.querySelector('#cm-isAdi');
    if (isAdi) isAdi.value = metrajState.isAdi || '';

    const aciklama = cmContainer.querySelector('#cm-aciklama');
    if (aciklama) aciklama.value = metrajState.aciklama || '';

    const sayi = cmContainer.querySelector('#cm-cepheSayisi');
    if (sayi) sayi.value = metrajState.cepheler.length;

    renderTabs();
    renderCephePanel();
    guncelleHesaplar();
}

/**
 * Metraj ayarları paneli - her yüzey için boya / yalıtım onay kutuları.
 */
function renderAyarlar() {
    const grid = cmContainer.querySelector('#cm-ayarlarGrid');
    if (!grid) return;

    grid.innerHTML = hesap.YUZEY_TIPLERI.map(y => `
        <div class="cm-settings-row">
            <span class="cm-settings-name">${y.adi}</span>
            <span style="display:flex; gap:10px;">
                <label class="cm-check">
                    <input type="checkbox" data-ayar="boya" data-yuzey="${y.kod}"
                           ${metrajState.ayarlar[y.kod].boya ? 'checked' : ''}>
                    Boya
                </label>
                <label class="cm-check">
                    <input type="checkbox" data-ayar="yalitim" data-yuzey="${y.kod}"
                           ${metrajState.ayarlar[y.kod].yalitim ? 'checked' : ''}>
                    Yalıtım
                </label>
            </span>
        </div>
    `).join('');

    grid.querySelectorAll('input[data-ayar]').forEach(input => {
        input.addEventListener('change', () => {
            const yuzey = input.getAttribute('data-yuzey');
            const tur   = input.getAttribute('data-ayar');
            metrajState.ayarlar[yuzey][tur] = input.checked;
            isaretle();
            guncelleHesaplar();
        });
    });
}

function renderTabs() {
    const nav_ = cmContainer.querySelector('#cm-tabNav');
    if (!nav_) return;

    nav_.innerHTML = metrajState.cepheler.map((cephe, i) => `
        <button type="button"
                class="cm-tab-button ${i === aktifCephe ? 'active' : ''}"
                onclick="window.cmPage.cepheSec(${i})">
            ${escapeHtml(cephe.ad || `Cephe ${i + 1}`)}
            <span class="cm-tab-alan" data-tab-alan="${i}">0,00 m²</span>
        </button>
    `).join('');
}

function renderCephePanel() {
    const body = cmContainer.querySelector('#cm-tabBody');
    if (!body) return;

    const i = aktifCephe;
    const cephe = metrajState.cepheler[i];
    if (!cephe) { body.innerHTML = ''; return; }

    body.innerHTML = `
        <div class="cm-tab-panel">
            <!-- Cephe ölçüleri -->
            <div class="cm-cephe-basli">
                <div class="cm-field">
                    <label>Cephe Adı</label>
                    <input type="text" data-cephe="${i}" data-alan="ad"
                           value="${escapeHtml(cephe.ad || '')}" placeholder="Örn: Kuzey">
                </div>
                <div class="cm-field">
                    <label>En (m)</label>
                    <input type="number" step="0.01" min="0" data-cephe="${i}" data-alan="en"
                           value="${cephe.en}" placeholder="0,00">
                </div>
                <div class="cm-field">
                    <label>Yükseklik (m)</label>
                    <input type="number" step="0.01" min="0" data-cephe="${i}" data-alan="yukseklik"
                           value="${cephe.yukseklik}" placeholder="0,00">
                </div>
                <div class="cm-brut">
                    <span>Brüt Cephe Alanı</span>
                    <strong data-sonuc="brut">0,00 m²</strong>
                </div>
            </div>

            <!-- Boşluklar -->
            <div class="cm-section">
                <div class="cm-section-head">
                    <h3>🪟 Boşluklar <span class="cm-section-hint">(pencere / kapı)</span></h3>
                    <button type="button" class="cm-btn cm-btn-add"
                            onclick="window.cmPage.boslukEkle(${i})">➕ Satır Ekle</button>
                </div>
                <div class="cm-table-container">
                    <table class="cm-table">
                        <thead>
                            <tr>
                                <th style="width:110px">Tip</th>
                                <th style="width:90px">En (m)</th>
                                <th style="width:90px">Boy (m)</th>
                                <th style="width:70px">Adet</th>
                                <th style="width:100px">Gömme (m)</th>
                                <th style="width:70px" class="cm-center">Denizlik</th>
                                <th style="width:100px">D. Der. (m)</th>
                                <th style="width:95px; text-align:right">Boşluk (m²)</th>
                                <th style="width:95px; text-align:right">Şafak (m²)</th>
                                <th style="width:50px"></th>
                            </tr>
                        </thead>
                        <tbody>${renderBoslukSatirlari(i, cephe)}</tbody>
                    </table>
                </div>
            </div>

            <!-- Çıkmalar -->
            <div class="cm-section">
                <div class="cm-section-head">
                    <h3>🏗️ Çıkmalar <span class="cm-section-hint">(balkon, konsol vb.)</span></h3>
                    <button type="button" class="cm-btn cm-btn-add"
                            onclick="window.cmPage.cikmaEkle(${i})">➕ Satır Ekle</button>
                </div>
                <div class="cm-table-container">
                    <table class="cm-table">
                        <thead>
                            <tr>
                                <th style="width:130px">Ad</th>
                                <th style="width:90px">En (m)</th>
                                <th style="width:100px">Derinlik (m)</th>
                                <th style="width:100px">Yükseklik (m)</th>
                                <th style="width:70px">Adet</th>
                                <th>Yüzeyler</th>
                                <th style="width:95px; text-align:right">Alan (m²)</th>
                                <th style="width:50px"></th>
                            </tr>
                        </thead>
                        <tbody>${renderCikmaSatirlari(i, cephe)}</tbody>
                    </table>
                </div>
            </div>

            <!-- Saçak -->
            <div class="cm-section">
                <div class="cm-section-head">
                    <h3>🏠 Saçak</h3>
                </div>
                <div class="cm-sacak">
                    <label class="cm-check" style="padding-bottom:10px">
                        <input type="checkbox" data-cephe="${i}" data-alan="sacak.var"
                               ${cephe.sacak.var ? 'checked' : ''}>
                        Saçak var
                    </label>
                    <div class="cm-field">
                        <label>Saçak Genişliği / Çıkıntı (m)</label>
                        <input type="number" step="0.01" min="0" data-cephe="${i}" data-alan="sacak.genislik"
                               value="${cephe.sacak.genislik}" placeholder="0,00"
                               ${cephe.sacak.var ? '' : 'disabled'}>
                    </div>
                    <div class="cm-field">
                        <label>Saçak Alın Yüksekliği (m)</label>
                        <input type="number" step="0.01" min="0" data-cephe="${i}" data-alan="sacak.alinYuksekligi"
                               value="${cephe.sacak.alinYuksekligi}" placeholder="0,00"
                               ${cephe.sacak.var ? '' : 'disabled'}>
                    </div>
                    <div class="cm-sacak-sonuc">
                        Saçak altı: <strong data-sonuc="sacakAlti">0,00</strong> m²<br>
                        Saçak alın: <strong data-sonuc="sacakAlin">0,00</strong> m²
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderBoslukSatirlari(cepheIdx, cephe) {
    if (!cephe.bosluklar.length) {
        return `<tr><td colspan="10" class="cm-empty-row">
                    Henüz boşluk eklenmedi. "➕ Satır Ekle" ile pencere veya kapı ekleyin.
                </td></tr>`;
    }

    return cephe.bosluklar.map((b, j) => {
        const kapiMi = b.tip === 'kapi';
        return `
        <tr>
            <td>
                <select data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.tip">
                    <option value="pencere" ${b.tip === 'pencere' ? 'selected' : ''}>Pencere</option>
                    <option value="kapi"    ${kapiMi ? 'selected' : ''}>Kapı</option>
                    <option value="diger"   ${b.tip === 'diger' ? 'selected' : ''}>Diğer</option>
                </select>
            </td>
            <td><input type="number" step="0.01" min="0" value="${b.en}" placeholder="0,00"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.en"></td>
            <td><input type="number" step="0.01" min="0" value="${b.boy}" placeholder="0,00"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.boy"></td>
            <td><input type="number" step="1" min="0" value="${b.adet}"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.adet"></td>
            <td><input type="number" step="0.01" min="0" value="${b.gommeDerinligi}" placeholder="0,00"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.gommeDerinligi"></td>
            <td class="cm-center">
                <input type="checkbox" ${b.denizlikVar ? 'checked' : ''} ${kapiMi ? 'disabled' : ''}
                       title="${kapiMi ? 'Kapılarda denizlik olmaz' : 'Mermer denizlik'}"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.denizlikVar"
                       style="margin: 0 auto;">
            </td>
            <td><input type="number" step="0.01" min="0" value="${b.denizlikDerinligi}" placeholder="0,00"
                       ${b.denizlikVar && !kapiMi ? '' : 'disabled'}
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="bosluk.denizlikDerinligi"></td>
            <td class="cm-calculated" data-sonuc="boslukAlani" data-satir="${j}">0,00</td>
            <td class="cm-calculated" data-sonuc="safakAlani" data-satir="${j}">0,00</td>
            <td>
                <button type="button" class="cm-btn cm-btn-danger" title="Satırı sil"
                        onclick="window.cmPage.boslukSil(${cepheIdx}, ${j})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

function renderCikmaSatirlari(cepheIdx, cephe) {
    if (!cephe.cikmalar.length) {
        return `<tr><td colspan="8" class="cm-empty-row">
                    Bu cephede çıkma yoksa boş bırakın.
                </td></tr>`;
    }

    return cephe.cikmalar.map((c, j) => {
        const yuzeyKutulari = hesap.CIKMA_YUZEYLERI.map(y => `
            <label class="cm-check">
                <input type="checkbox" ${c.yuzeyler[y.kod] ? 'checked' : ''}
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="cikma.yuzey.${y.kod}">
                ${y.adi}
            </label>
        `).join('');

        return `
        <tr>
            <td><input type="text" value="${escapeHtml(c.ad || '')}" placeholder="Balkon"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="cikma.ad"></td>
            <td><input type="number" step="0.01" min="0" value="${c.en}" placeholder="0,00"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="cikma.en"></td>
            <td><input type="number" step="0.01" min="0" value="${c.derinlik}" placeholder="0,00"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="cikma.derinlik"></td>
            <td><input type="number" step="0.01" min="0" value="${c.yukseklik}" placeholder="0,00"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="cikma.yukseklik"></td>
            <td><input type="number" step="1" min="0" value="${c.adet}"
                       data-cephe="${cepheIdx}" data-satir="${j}" data-alan="cikma.adet"></td>
            <td><div class="cm-yuzey-group">${yuzeyKutulari}</div></td>
            <td class="cm-calculated" data-sonuc="cikmaAlani" data-satir="${j}">0,00</td>
            <td>
                <button type="button" class="cm-btn cm-btn-danger" title="Satırı sil"
                        onclick="window.cmPage.cikmaSil(${cepheIdx}, ${j})">🗑️</button>
            </td>
        </tr>`;
    }).join('');
}

/**
 * Yeniden çizim yapmadan sadece hesaplanan hücreleri ve özeti günceller.
 * Böylece kullanıcı yazarken imleç kaybolmaz.
 */
function guncelleHesaplar() {
    const sonuc = hesap.hesaplaMetraj(metrajState);
    const body = cmContainer.querySelector('#cm-tabBody');
    const cepheSonuc = sonuc.cepheler[aktifCephe];

    if (body && cepheSonuc) {
        const brut = body.querySelector('[data-sonuc="brut"]');
        if (brut) brut.textContent = formatAlan(cepheSonuc.brutAlan) + ' m²';

        const sAlti = body.querySelector('[data-sonuc="sacakAlti"]');
        if (sAlti) sAlti.textContent = formatAlan(cepheSonuc.sacak.sacakAltiAlani);

        const sAlin = body.querySelector('[data-sonuc="sacakAlin"]');
        if (sAlin) sAlin.textContent = formatAlan(cepheSonuc.sacak.sacakAlinAlani);

        cepheSonuc.bosluklar.forEach((b, j) => {
            const alanCell  = body.querySelector(`[data-sonuc="boslukAlani"][data-satir="${j}"]`);
            const safakCell = body.querySelector(`[data-sonuc="safakAlani"][data-satir="${j}"]`);
            if (alanCell)  alanCell.textContent  = formatAlan(b.hesap.boslukAlani);
            if (safakCell) safakCell.textContent = formatAlan(b.hesap.safakAlani);
        });

        cepheSonuc.cikmalar.forEach((c, j) => {
            const cell = body.querySelector(`[data-sonuc="cikmaAlani"][data-satir="${j}"]`);
            if (cell) cell.textContent = formatAlan(c.hesap.cikmaAlani);
        });
    }

    // Sekme başlıklarındaki cephe alanı bilgisi
    sonuc.cepheler.forEach((c, i) => {
        const etiket = cmContainer.querySelector(`[data-tab-alan="${i}"]`);
        if (etiket) etiket.textContent = formatAlan(c.ozet.boya) + ' m²';
    });

    renderOzet(sonuc);
}

function renderOzet(sonuc) {
    if (!sonuc) sonuc = hesap.hesaplaMetraj(metrajState);

    const tbody = cmContainer.querySelector('#cm-summaryBody');
    if (!tbody) return;

    const cepheKapsam = (ozetKapsami === 'cephe');
    const kaynak = cepheKapsam ? sonuc.cepheler[aktifCephe] : sonuc.toplam;
    if (!kaynak) return;

    const yuzeyler = kaynak.yuzeyler;
    const ozet = cepheKapsam ? kaynak.ozet : kaynak;

    tbody.innerHTML = hesap.YUZEY_TIPLERI.map(y => {
        const deger = yuzeyler[y.kod] || 0;
        const ayar = metrajState.ayarlar[y.kod];
        return `
            <tr>
                <td>${y.adi}</td>
                <td class="numeric">${formatAlan(deger)}</td>
                <td class="numeric ${ayar.boya ? '' : 'pasif'}">${ayar.boya ? formatAlan(deger) : '—'}</td>
                <td class="numeric ${ayar.yalitim ? '' : 'pasif'}">${ayar.yalitim ? formatAlan(deger) : '—'}</td>
            </tr>
        `;
    }).join('');

    const etiket = cmContainer.querySelector('#cm-summaryFootLabel');
    if (etiket) {
        const cephe = metrajState.cepheler[aktifCephe];
        etiket.textContent = cepheKapsam
            ? `TOPLAM — ${(cephe && cephe.ad) || 'Cephe ' + (aktifCephe + 1)}`
            : 'TOPLAM — TÜM CEPHELER';
    }

    setText('#cm-toplamAlan',    formatAlan(ozet.alan));
    setText('#cm-toplamBoya',    formatAlan(ozet.boya));
    setText('#cm-toplamYalitim', formatAlan(ozet.yalitim));
}

function setText(selector, value) {
    const el = cmContainer.querySelector(selector);
    if (el) el.textContent = value;
}

// ===== KAYIT / YÜKLEME =====

function metrajYukle(id) {
    return new Promise((resolve) => {
        db.get(`SELECT * FROM metrajlar WHERE id = ?`, [id], (err, row) => {
            if (err || !row) {
                console.error('Metraj yüklenemedi:', err);
                if (window.showNotification) {
                    window.showNotification('Metraj kaydı bulunamadı.', 'error');
                }
                resolve();
                return;
            }

            try {
                const veri = JSON.parse(row.verilerJSON || '{}');
                metrajState = {
                    isAdi:    row.isAdi || '',
                    aciklama: row.aciklama || '',
                    ayarlar:  Object.assign(hesap.varsayilanAyarlar(), veri.ayarlar || {}),
                    cepheler: (veri.cepheler && veri.cepheler.length) ? veri.cepheler : [yeniCephe(0)]
                };
                kayitliId = row.id;
                aktifCephe = 0;
                console.log(`📂 Metraj #${row.id} yüklendi`);
            } catch (e) {
                console.error('Metraj verisi çözümlenemedi:', e);
                if (window.showNotification) {
                    window.showNotification('Metraj verisi okunamadı.', 'error');
                }
            }
            resolve();
        });
    });
}

function kaydet() {
    if (!metrajState.isAdi || !metrajState.isAdi.trim()) {
        if (window.showNotification) {
            window.showNotification('Lütfen önce bir "İş Adı" girin.', 'warning');
        }
        const isAdi = cmContainer.querySelector('#cm-isAdi');
        if (isAdi) isAdi.focus();
        return;
    }

    const sonuc = hesap.hesaplaMetraj(metrajState);
    const veri = JSON.stringify({
        ayarlar:  metrajState.ayarlar,
        cepheler: metrajState.cepheler
    });
    const simdi = new Date().toISOString();

    if (kayitliId) {
        db.run(
            `UPDATE metrajlar
             SET isAdi = ?, aciklama = ?, cepheSayisi = ?, verilerJSON = ?,
                 toplamBoyaAlani = ?, toplamYalitimAlani = ?, guncellemeTarihi = ?
             WHERE id = ?`,
            [
                metrajState.isAdi.trim(), metrajState.aciklama || '',
                metrajState.cepheler.length, veri,
                sonuc.toplam.boya, sonuc.toplam.yalitim, simdi, kayitliId
            ],
            (err) => kayitSonucu(err, kayitliId, true)
        );
    } else {
        db.run(
            `INSERT INTO metrajlar
             (metrajTipi, isAdi, aciklama, cepheSayisi, verilerJSON,
              toplamBoyaAlani, toplamYalitimAlani, olusturmaTarihi, guncellemeTarihi, aktif)
             VALUES ('cephe', ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
                metrajState.isAdi.trim(), metrajState.aciklama || '',
                metrajState.cepheler.length, veri,
                sonuc.toplam.boya, sonuc.toplam.yalitim, simdi, simdi
            ],
            function (err) {
                if (!err) kayitliId = this.lastID;
                kayitSonucu(err, kayitliId, false);
            }
        );
    }
}

function kayitSonucu(err, id, guncelleme) {
    if (err) {
        console.error('Metraj kaydedilemedi:', err);
        if (window.showNotification) {
            window.showNotification('Metraj kaydedilemedi: ' + err.message, 'error');
        }
        return;
    }
    degisiklikVar = false;
    console.log(`💾 Metraj #${id} ${guncelleme ? 'güncellendi' : 'kaydedildi'}`);
    if (window.showNotification) {
        window.showNotification(
            guncelleme ? `Metraj güncellendi (#${id}).` : `Metraj kaydedildi (#${id}).`,
            'success'
        );
    }
}

function temizle() {
    const onay = confirm('Tüm cephe verileri silinecek ve form sıfırlanacak. Devam edilsin mi?');
    if (!onay) return;

    metrajState = bosState();
    kayitliId = null;
    aktifCephe = 0;
    degisiklikVar = false;

    renderAyarlar();
    renderAll();

    if (window.showNotification) {
        window.showNotification('Form temizlendi.', 'info');
    }
}

// ===== BİÇİMLENDİRME =====

function formatAlan(deger) {
    if (deger === null || deger === undefined || isNaN(deger)) return '0,00';
    return Number(deger).toLocaleString('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function escapeHtml(metin) {
    if (metin === null || metin === undefined) return '';
    return String(metin)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = { onLoad, onUnload, hasUnsavedChanges };
