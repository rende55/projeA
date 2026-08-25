/**
 * Farklı Döneme Kopyala - Modal
 *
 * Kaydedilmiş bir yapı bedeli raporunu başka bir birim fiyat dönemine (yıl/dönem)
 * uyarlayarak YENİ bir rapor oluşturur. Kaynak rapor değiştirilmez.
 *
 * Hem editör hem de Kayıtlı Raporlar listesi tarafından kullanılır:
 *   const donemKopyala = require('./donem-kopyala');
 *   donemKopyala.ac(db, nav, raporId);
 */

const donemServisi = require('./donem-servisi');

const STIL_ID = 'dk-stiller';

// ===== GENEL API =====

/**
 * Modalı aç.
 * @param {Object} db     - açık sqlite3 bağlantısı
 * @param {Object} nav    - NavigationManager
 * @param {number} raporId
 */
async function ac(db, nav, raporId) {
    try {
        const rapor = await raporGetir(db, raporId);
        if (!rapor) {
            bildir('Rapor bulunamadı.', 'error');
            return;
        }

        const [donemler, yipranmaCache] = await Promise.all([
            donemServisi.listeDonemler(db),
            donemServisi.yipranmaPaylariGetir(db)
        ]);

        if (!donemler.length) {
            bildir('Tanımlı birim fiyat dönemi yok. Önce Yönetim Paneli\'nden dönem ekleyin.', 'warning');
            return;
        }

        stilleriEkle();
        modalGoster(db, nav, rapor, donemler, yipranmaCache);
    } catch (e) {
        console.error('Dönem kopyalama açılamadı:', e);
        bildir('Dönem kopyalama açılamadı: ' + e.message, 'error');
    }
}

// ===== VERİ =====

function raporGetir(db, raporId) {
    return new Promise((resolve, reject) => {
        db.get(`SELECT * FROM raporlar WHERE id = ?`, [raporId],
            (err, row) => err ? reject(err) : resolve(row || null));
    });
}

function kolonlariGetir(db) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(raporlar)`, [],
            (err, rows) => err ? reject(err) : resolve((rows || []).map(r => r.name)));
    });
}

// ===== MODAL =====

function modalGoster(db, nav, rapor, donemler, yipranmaCache) {
    const cokluParsel = rapor.cokluParsel === 1 || rapor.cokluParsel === '1';
    const kaynakYil = parseInt(rapor.hesapYili, 10);
    const kaynakDonem = donemler.find(d => d.id === rapor.birimFiyatId) || null;

    // Kaynağın kendi dönemi dışındaki ilk dönem varsayılan seçim olsun
    const secilebilir = donemler.filter(d => d.id !== rapor.birimFiyatId);
    if (!secilebilir.length) {
        bildir('Kopyalanabilecek başka bir dönem yok.', 'warning');
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'dk-overlay';
    overlay.innerHTML = `
        <div class="dk-modal" role="dialog" aria-modal="true" aria-labelledby="dk-baslik">
            <div class="dk-header">
                <h2 id="dk-baslik">📅 Farklı Döneme Kopyala</h2>
                <button type="button" class="dk-close" id="dk-kapat" title="Kapat">×</button>
            </div>

            <div class="dk-body">
                <div class="dk-kaynak">
                    <strong>Kaynak:</strong> Rapor #${rapor.id}
                    · ${rapor.hesapYili || '—'} yılı
                    ${kaynakDonem && kaynakDonem.resmiGazeteSayili
                        ? `· ${formatTarih(kaynakDonem.resmiGazeteTarih)} / ${kaynakDonem.resmiGazeteSayili} R.G.`
                        : (rapor.resmiGazeteSayili ? `· ${formatTarih(rapor.resmiGazeteTarih)} / ${rapor.resmiGazeteSayili} R.G.` : '')}
                    ${cokluParsel ? '· <span class="dk-rozet">Çoklu parsel</span>' : ''}
                </div>

                ${!kaynakDonem ? `
                    <div class="dk-uyari-kutu dk-bilgi">
                        Bu raporun hangi döneme ait olduğu kesin belirlenemedi
                        (${rapor.hesapYili || '—'} yılında birden fazla dönem olabilir).
                        Yaş kaydırma, raporda yazan <strong>${rapor.hesapYili || '—'}</strong> yılına göre hesaplanır.
                    </div>` : ''}

                <div class="dk-secim">
                    <div class="dk-field">
                        <label for="dk-donem">Hedef Dönem</label>
                        <select id="dk-donem">
                            ${secilebilir.map(d => `
                                <option value="${d.id}">
                                    ${donemServisi.donemEtiketi(d, donemler)}${d.resmiGazeteSayili ? ` — ${d.resmiGazeteSayili} sayılı R.G.` : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <label class="dk-check">
                        <input type="checkbox" id="dk-yasKaydir" checked>
                        <span>Yapı yaşlarını kaydır <span id="dk-yasFarki" class="dk-fark"></span></span>
                    </label>
                </div>

                <div id="dk-uyarilar"></div>

                <div class="dk-table-wrap">
                    <table class="dk-table">
                        <thead>
                            <tr>
                                <th>NO</th>
                                <th>YAPI</th>
                                <th>S/G</th>
                                <th>YAŞ</th>
                                <th>YIPR.</th>
                                <th>BİRİM FİYAT</th>
                                <th>BEDEL</th>
                            </tr>
                        </thead>
                        <tbody id="dk-onizleme"></tbody>
                    </table>
                </div>

                <div class="dk-toplam">
                    <span>TOPLAM</span>
                    <span class="dk-toplam-degerler">
                        <span class="dk-eski" id="dk-eskiToplam">0,00</span>
                        <span class="dk-ok">→</span>
                        <strong id="dk-yeniToplam">0,00</strong> TL
                    </span>
                </div>
            </div>

            <div class="dk-footer">
                <button type="button" class="dk-btn dk-btn-ghost" id="dk-vazgec">Vazgeç</button>
                <button type="button" class="dk-btn dk-btn-primary" id="dk-onayla">Kopyala ve Aç</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('acik'));

    const donemSelect = overlay.querySelector('#dk-donem');
    const yasKaydirCb = overlay.querySelector('#dk-yasKaydir');

    let sonSonuc = null;   // { yapilar | parseller, uyarilar, toplam, hedefDonem }

    const kapat = () => {
        overlay.classList.remove('acik');
        document.removeEventListener('keydown', escDinle);
        setTimeout(() => overlay.remove(), 180);
    };

    const escDinle = (e) => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); kapat(); }
    };
    document.addEventListener('keydown', escDinle);

    overlay.querySelector('#dk-kapat').addEventListener('click', kapat);
    overlay.querySelector('#dk-vazgec').addEventListener('click', kapat);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) kapat(); });

    async function yenile() {
        const hedefId = parseInt(donemSelect.value, 10);
        const hedefDonem = donemler.find(d => d.id === hedefId);
        if (!hedefDonem) return;

        const yilFarki = isNaN(kaynakYil) ? 0 : (hedefDonem.yil - kaynakYil);
        const yaslariKaydir = yasKaydirCb.checked && yilFarki !== 0;

        // Yaş farkı etiketi
        const farkEl = overlay.querySelector('#dk-yasFarki');
        if (isNaN(kaynakYil)) {
            farkEl.textContent = '(kaynak yıl okunamadı)';
        } else if (yilFarki === 0) {
            farkEl.textContent = '(aynı yıl)';
        } else {
            farkEl.textContent = `(${yilFarki > 0 ? '+' : ''}${yilFarki})`;
        }
        yasKaydirCb.disabled = (yilFarki === 0 || isNaN(kaynakYil));

        const fiyatlar = await donemServisi.fiyatTablosuGetir(db, hedefId);
        const opts = { fiyatlar, yipranmaCache, yilFarki, yaslariKaydir };

        let onizlemeYapilar = [];
        let sonuc;

        if (cokluParsel) {
            const parseller = guvenliParse(rapor.parsellerJSON, []);
            sonuc = donemServisi.parselleriDonemeUyarla(parseller, opts);
            sonuc.parseller.forEach(p => (p.yapilar || []).forEach(y => onizlemeYapilar.push(y)));
        } else {
            const yapilar = guvenliParse(rapor.yapilarJSON, []);
            sonuc = donemServisi.raporuDonemeUyarla(yapilar, opts);
            onizlemeYapilar = sonuc.yapilar;
        }

        sonSonuc = Object.assign({}, sonuc, { hedefDonem });
        onizlemeCiz(overlay, onizlemeYapilar, sonuc.uyarilar, sonuc.toplam);
    }

    donemSelect.addEventListener('change', yenile);
    yasKaydirCb.addEventListener('change', yenile);

    overlay.querySelector('#dk-onayla').addEventListener('click', async () => {
        if (!sonSonuc) return;
        const btn = overlay.querySelector('#dk-onayla');
        btn.disabled = true;
        btn.textContent = 'Kopyalanıyor...';
        try {
            const yeniId = await kopyalaVeKaydet(db, rapor, sonSonuc, cokluParsel);
            kapat();
            bildir(`Rapor #${yeniId} oluşturuldu (${donemServisi.donemEtiketi(sonSonuc.hedefDonem, donemler)}).`, 'success');
            if (nav) nav.navigateTo('editor', { raporId: yeniId });
        } catch (e) {
            console.error('Kopyalama hatası:', e);
            bildir('Kopyalanamadı: ' + e.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Kopyala ve Aç';
        }
    });

    yenile();
}

/**
 * Önizleme tablosunu ve uyarıları çiz.
 */
function onizlemeCiz(overlay, yapilar, uyarilar, toplam) {
    const tbody = overlay.querySelector('#dk-onizleme');
    let eskiToplam = 0;

    tbody.innerHTML = yapilar.map((y, i) => {
        const o = y._onizleme || {};
        eskiToplam += o.eskiBedel || 0;

        const sinifGrup = [y.yapiSinifi, y.yapiGrubu].filter(Boolean).join(' ') || '—';
        const yasHucre = (o.eskiYas === null || o.eskiYas === undefined)
            ? '—'
            : (o.eskiYas === o.yeniYas ? String(o.eskiYas) : degisim(o.eskiYas, o.yeniYas));
        const yiprHucre = (o.eskiYipranma === o.yeniYipranma)
            ? `%${o.eskiYipranma}`
            : degisim('%' + o.eskiYipranma, '%' + o.yeniYipranma);
        const fiyatHucre = (o.eskiBirimFiyat === o.yeniBirimFiyat)
            ? formatPara(o.eskiBirimFiyat)
            : degisim(formatPara(o.eskiBirimFiyat), formatPara(o.yeniBirimFiyat));

        return `
            <tr class="${o.fiyatBulundu ? '' : 'dk-satir-uyari'}">
                <td>${y.yapiNo || (i + 1)}</td>
                <td>${kacir(y.yapiAdi) || '—'}</td>
                <td>${kacir(sinifGrup)}</td>
                <td class="dk-num">${yasHucre}</td>
                <td class="dk-num">${yiprHucre}</td>
                <td class="dk-num">${fiyatHucre}</td>
                <td class="dk-num">${degisim(formatPara(o.eskiBedel), formatPara(o.yeniBedel))}</td>
            </tr>
        `;
    }).join('') || `<tr><td colspan="7" class="dk-bos">Bu raporda yapı kaydı yok.</td></tr>`;

    overlay.querySelector('#dk-eskiToplam').textContent = formatPara(eskiToplam);
    overlay.querySelector('#dk-yeniToplam').textContent = formatPara(toplam);

    const uyariKutu = overlay.querySelector('#dk-uyarilar');
    if (!uyarilar.length) {
        uyariKutu.innerHTML = '';
    } else {
        uyariKutu.innerHTML = `
            <div class="dk-uyari-kutu">
                <strong>⚠ ${uyarilar.length} uyarı</strong>
                <ul>${uyarilar.map(u => `<li>${kacir(u.mesaj)}</li>`).join('')}</ul>
            </div>
        `;
    }
}

function degisim(eski, yeni) {
    return `<span class="dk-eski">${eski}</span><span class="dk-ok">→</span><strong>${yeni}</strong>`;
}

// ===== KAYDETME =====

/**
 * Yeni rapor satırı oluştur (kaynak satır değiştirilmez).
 * Kolonlar PRAGMA'dan okunur; şema değişse de kopyalama bozulmaz.
 */
async function kopyalaVeKaydet(db, rapor, sonuc, cokluParsel) {
    const kolonlar = (await kolonlariGetir(db)).filter(k => k !== 'id');
    const hedef = sonuc.hedefDonem;

    const yeni = Object.assign({}, rapor);

    // Dönem bilgileri
    yeni.hesapYili = String(hedef.yil);
    yeni.birimFiyatId = hedef.id;
    yeni.resmiGazeteTarih = hedef.resmiGazeteTarih || '';
    yeni.resmiGazeteSayili = hedef.resmiGazeteSayili || '';

    // Yapı verileri (önizleme alanları temizlenir)
    if (cokluParsel) {
        const parseller = sonuc.parseller.map(p =>
            Object.assign({}, p, { yapilar: donemServisi.onizlemeTemizle(p.yapilar) })
        );
        const json = JSON.stringify(parseller);
        yeni.parsellerJSON = json;
        yeni.yapilarJSON = json;   // mevcut kaydetme davranışıyla aynı
    } else {
        yeni.yapilarJSON = JSON.stringify(donemServisi.onizlemeTemizle(sonuc.yapilar));
    }

    yeni.toplamYapiBedeli = sonuc.toplam;
    yeni.yapiBedeli = String(sonuc.toplam);
    yeni.raporTarihi = bugun();

    const degerler = kolonlar.map(k => (yeni[k] === undefined ? null : yeni[k]));
    const yerTutucu = kolonlar.map(() => '?').join(', ');
    const sql = `INSERT INTO raporlar (${kolonlar.join(', ')}) VALUES (${yerTutucu})`;

    return new Promise((resolve, reject) => {
        db.run(sql, degerler, function (err) {
            if (err) { reject(err); return; }
            console.log(`📋 Rapor #${rapor.id} → #${this.lastID} olarak ${hedef.yil} dönemine kopyalandı`);
            resolve(this.lastID);
        });
    });
}

// ===== YARDIMCILAR =====

function guvenliParse(json, varsayilan) {
    if (!json) return varsayilan;
    try {
        const v = JSON.parse(json);
        return Array.isArray(v) ? v : varsayilan;
    } catch (e) {
        console.error('JSON çözümlenemedi:', e);
        return varsayilan;
    }
}

function bugun() {
    const d = new Date();
    const ay = String(d.getMonth() + 1).padStart(2, '0');
    const gun = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${ay}-${gun}`;
}

function formatPara(deger) {
    const n = parseFloat(deger);
    if (!isFinite(n)) return '0,00';
    return n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatTarih(tarih) {
    if (!tarih) return '—';
    const d = new Date(tarih);
    if (isNaN(d.getTime())) return tarih;
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function kacir(metin) {
    if (metin === null || metin === undefined) return '';
    return String(metin)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function bildir(mesaj, tip) {
    if (window.showNotification) window.showNotification(mesaj, tip);
    else console.log(`[${tip}] ${mesaj}`);
}

// ===== STİLLER =====
// Modal iki ayrı sayfadan açıldığı için stiller <head>'e bir kez enjekte edilir.
function stilleriEkle() {
    if (document.getElementById(STIL_ID)) return;

    const style = document.createElement('style');
    style.id = STIL_ID;
    style.textContent = `
        .dk-overlay {
            position: fixed; inset: 0; background: rgba(15,23,42,0.55);
            backdrop-filter: blur(4px); display: flex; align-items: center;
            justify-content: center; z-index: 10000; padding: 20px;
            opacity: 0; transition: opacity 0.2s ease;
        }
        .dk-overlay.acik { opacity: 1; }

        .dk-modal {
            background: #FFFFFF; border-radius: 16px; width: 100%; max-width: 900px;
            max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
            box-shadow: 0 20px 50px -12px rgba(0,0,0,0.35);
            transform: translateY(12px); transition: transform 0.2s ease;
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        }
        .dk-overlay.acik .dk-modal { transform: translateY(0); }

        .dk-header {
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
            color: white; padding: 18px 24px; display: flex;
            align-items: center; justify-content: space-between; gap: 12px;
        }
        .dk-header h2 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.2px; }
        .dk-close {
            background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
            color: white; width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
            font-size: 20px; line-height: 1; font-family: inherit; transition: background 0.2s;
        }
        .dk-close:hover { background: rgba(255,255,255,0.22); }

        .dk-body { padding: 20px 24px; overflow-y: auto; flex: 1; }

        .dk-kaynak {
            font-size: 13px; color: #334155; background: #F8FAFC;
            border: 1px solid #E2E8F0; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px;
        }
        .dk-rozet {
            display: inline-block; padding: 2px 8px; border-radius: 100px; font-size: 11px;
            font-weight: 600; background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE;
        }

        .dk-secim {
            display: flex; align-items: flex-end; gap: 20px;
            flex-wrap: wrap; margin-bottom: 16px;
        }
        .dk-field { display: flex; flex-direction: column; min-width: 260px; }
        .dk-field label {
            margin-bottom: 6px; font-weight: 600; color: #334155; font-size: 13px;
        }
        .dk-field select {
            padding: 10px 14px; border: 1px solid #CBD5E1; border-radius: 8px;
            font-size: 14px; background: #FFFFFF; color: #0F172A; font-family: inherit;
        }
        .dk-field select:focus {
            outline: none; border-color: #3B82F6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        .dk-check {
            display: inline-flex; align-items: center; gap: 8px; font-size: 13px;
            color: #334155; cursor: pointer; user-select: none; padding-bottom: 10px;
        }
        .dk-check input { width: 16px; height: 16px; accent-color: #3B82F6; cursor: pointer; margin: 0; }
        .dk-check input:disabled { cursor: not-allowed; }
        .dk-fark { color: #64748B; font-weight: 600; font-family: 'Consolas', monospace; }

        .dk-uyari-kutu {
            background: #FFFBEB; border: 1px solid #FDE68A; color: #92400E;
            border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; line-height: 1.5;
        }
        .dk-uyari-kutu.dk-bilgi { background: #EFF6FF; border-color: #BFDBFE; color: #1D4ED8; }
        .dk-uyari-kutu ul { margin: 8px 0 0 0; padding-left: 20px; }
        .dk-uyari-kutu li { margin-bottom: 4px; }

        .dk-table-wrap { overflow-x: auto; border: 1px solid #E2E8F0; border-radius: 10px; }
        .dk-table { width: 100%; border-collapse: collapse; background: white; min-width: 700px; }
        .dk-table th, .dk-table td {
            padding: 10px 12px; text-align: left; border-bottom: 1px solid #E2E8F0; font-size: 13px;
        }
        .dk-table th {
            background: #F8FAFC; color: #334155; font-weight: 600; font-size: 11px;
            text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #E2E8F0;
            white-space: nowrap;
        }
        .dk-table tbody tr:last-child td { border-bottom: none; }
        .dk-table td.dk-num { text-align: right; font-family: 'Consolas', monospace; white-space: nowrap; }
        .dk-table tr.dk-satir-uyari { background: #FFFBEB; }
        .dk-bos { text-align: center; color: #94A3B8; padding: 24px !important; }

        .dk-eski { color: #94A3B8; text-decoration: line-through; }
        .dk-ok { color: #94A3B8; margin: 0 5px; }

        .dk-toplam {
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            margin-top: 16px; padding: 14px 18px; border-radius: 10px;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); color: white;
            font-weight: 700; font-size: 14px; flex-wrap: wrap;
        }
        .dk-toplam-degerler { font-family: 'Consolas', monospace; font-size: 15px; }
        .dk-toplam .dk-eski { color: #94A3B8; }
        .dk-toplam .dk-ok { color: #CBD5E1; }

        .dk-footer {
            padding: 16px 24px; border-top: 1px solid #E2E8F0; background: #F8FAFC;
            display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;
        }
        .dk-btn {
            padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer;
            font-size: 13px; font-weight: 600; font-family: inherit; transition: all 0.2s;
        }
        .dk-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .dk-btn-primary { background: #3B82F6; color: #FFFFFF; }
        .dk-btn-primary:hover:not(:disabled) { background: #2563EB; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .dk-btn-ghost { background: #F1F5F9; color: #475569; border: 1px solid #CBD5E1; }
        .dk-btn-ghost:hover:not(:disabled) { background: #E2E8F0; border-color: #94A3B8; }

        @media (max-width: 768px) {
            .dk-secim { flex-direction: column; align-items: stretch; }
            .dk-field { min-width: 0; }
        }
    `;
    document.head.appendChild(style);
}

module.exports = { ac };
