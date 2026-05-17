/**
 * Proje A - Production Build Script
 * 1. Kaynak dosyaları build-temp klasörüne kopyalar
 * 2. JS dosyalarını javascript-obfuscator ile karartır
 * 3. electron-builder ile portable exe oluşturur
 */

const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const { execSync } = require('child_process');

const ROOT = __dirname;
const BUILD_TEMP = path.join(ROOT, 'build-temp');

// Obfuscation ayarları - MAIN PROCESS (main.js)
const MAIN_OBFUSCATION_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.4,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    target: 'node',
    transformObjectKeys: false,
    unicodeEscapeSequence: false
};

// Obfuscation ayarları - RENDERER PROCESS (dashboard.js, navigation.js, modül script'leri)
const RENDERER_OBFUSCATION_OPTIONS = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.4,
    deadCodeInjection: false,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: false,
    simplify: true,
    splitStrings: false,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    target: 'browser-no-eval',
    transformObjectKeys: false,
    unicodeEscapeSequence: false
};

// Kopyalanacak dosya ve klasörler
const COPY_LIST = [
    'main.js',
    'dashboard.html',
    'dashboard.js',
    'package.json',
    'modules',
    'shared',
    'assets',
];

// Build'e dahil edilecek tohum (seed) veritabanı.
// Öncelik sırası:
//   1) raporlar_build.db varsa onu kullan (kasıtlı temizlenmiş sürüm)
//   2) yoksa mevcut raporlar.db'yi kullan (geliştirme verileri)
// Build sırasında --use-dev-db verilirse her durumda raporlar.db kullanılır.
const FORCE_DEV_DB = process.argv.includes('--use-dev-db');
const BUILD_DB_PREFERRED = 'raporlar_build.db';
const BUILD_DB_FALLBACK = 'raporlar.db';

// Main process dosyaları (target: node)
const MAIN_JS_FILES = [
    'main.js',
];

// Renderer process dosyaları (target: browser-no-eval)
const RENDERER_JS_FILES = [
    'dashboard.js',
    'shared/scripts/db-helper.js',
    'shared/scripts/navigation.js',
    'modules/yapi-bedeli/scripts/yapi-bedeli-page.js',
    'modules/yapi-bedeli/scripts/raporlar-page.js',
    'modules/yapi-bedeli/scripts/admin-page.js',
    'modules/yapi-bedeli/scripts/editor-page.js',
    'modules/yapi-bedeli/scripts/renderer.js',
    'modules/yapi-bedeli/scripts/raporlar.js',
    'modules/yapi-bedeli/scripts/admin.js',
    'modules/yapi-bedeli/scripts/editor.js',
    'modules/yapi-bedeli/scripts/preview.js',
    'modules/yapi-bedeli/scripts/reportGenerator.js',
    'modules/proje-bedeli/scripts/proje-bedeli-page.js',
    'modules/proje-bedeli/scripts/pb-raporlar-page.js',
    'modules/proje-bedeli/scripts/pb-reportGenerator.js',
];

// Klasörü temizle. build-temp/node_modules junction olabilir; junction içine
// inip silmemek için önce algılayıp sadece bağlantıyı kaldırıyoruz.
function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        for (const item of fs.readdirSync(dir)) {
            const itemPath = path.join(dir, item);
            try {
                const lst = fs.lstatSync(itemPath);
                if (lst.isSymbolicLink()) {
                    fs.unlinkSync(itemPath);
                    continue;
                }
            } catch (_) { /* yoksa zaten silinmiş */ }
            fs.rmSync(itemPath, { recursive: true, force: true });
        }
    } else {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// build-temp/node_modules için ana projedeki node_modules'a Windows junction kur.
// Amaç: electron-builder'ın build-temp altında baştan `npm install` + native rebuild
// yapmasını engellemek (sqlite3 zaten doğru electron sürümü için derlenmiş durumda).
function linkNodeModules() {
    const target = path.join(ROOT, 'node_modules');
    const linkPath = path.join(BUILD_TEMP, 'node_modules');
    if (!fs.existsSync(target)) {
        console.error('  ⚠️ Ana projede node_modules bulunamadı, junction kurulamadı');
        return false;
    }
    if (fs.existsSync(linkPath)) return true;
    try {
        fs.symlinkSync(target, linkPath, 'junction');
        console.log('  node_modules junction oluşturuldu →', target);
        return true;
    } catch (err) {
        console.error('  ⚠️ node_modules junction hatası:', err.message);
        return false;
    }
}

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const items = fs.readdirSync(src);
        items.forEach(item => {
            // node_modules, .git, build-temp, dist atla
            if (['node_modules', '.git', 'build-temp', 'dist', 'raporlar'].includes(item)) return;
            copyRecursive(path.join(src, item), path.join(dest, item));
        });
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

function obfuscateFile(filePath, options) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        if (!code.trim()) return false;
        
        const result = JavaScriptObfuscator.obfuscate(code, options);
        fs.writeFileSync(filePath, result.getObfuscatedCode());
        return true;
    } catch (err) {
        console.error(`  HATA: ${filePath} - ${err.message}`);
        return false;
    }
}

// ===== ANA İŞLEM =====
const SKIP_OBFUSCATION = process.argv.includes('--no-obfuscate');

console.log('='.repeat(60));
console.log('  PROJE A - PRODUCTION BUILD');
if (SKIP_OBFUSCATION) console.log('  ⚠️  OBFUSCATION DEVRE DIŞI');
console.log('='.repeat(60));
console.log('');

// 1. Temiz build-temp klasörü oluştur
console.log('[1/4] Build klasörü hazırlanıyor...');
cleanDir(BUILD_TEMP);

// 2. Dosyaları kopyala
console.log('[2/4] Dosyalar kopyalanıyor...');
COPY_LIST.forEach(item => {
    const src = path.join(ROOT, item);
    const dest = path.join(BUILD_TEMP, item);
    console.log(`  Kopyalanıyor: ${item}`);
    copyRecursive(src, dest);
});

// package.json'dan devDependencies ve scripts temizle
const pkgPath = path.join(BUILD_TEMP, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
delete pkg.devDependencies;
pkg.scripts = { start: 'electron .' };

// electron-builder build-temp altında çalışacağı için electron sürümünü
// build config'e elle yazıyoruz (devDeps silindiği ve build-temp/node_modules
// olmadığı için aksi takdirde sürümü çıkaramıyor).
let electronVersion;
try {
    const electronPkgPath = path.join(ROOT, 'node_modules', 'electron', 'package.json');
    electronVersion = JSON.parse(fs.readFileSync(electronPkgPath, 'utf8')).version;
} catch (err) {
    console.error('  ⚠️ node_modules/electron bulunamadı, electronVersion sabitlenemedi:', err.message);
}

// extraResources: DB dosyasını ASAR dışında exe yanına kopyala
if (pkg.build) {
    if (electronVersion) {
        pkg.build.electronVersion = electronVersion;
    }
    // node_modules junction üzerinden ana projedeki derlenmiş bağımlılıkları kullanıyoruz.
    // Bu yüzden electron-builder'ın yeniden derleme/install adımını kapatıyoruz.
    pkg.build.npmRebuild = false;
    pkg.build.buildDependenciesFromSource = false;
    pkg.build.extraResources = [
        {
            from: 'extra/raporlar.db',
            to: '../raporlar.db'
        }
    ];
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`  package.json temizlendi (devDeps kaldırıldı, extraResources eklendi${electronVersion ? `, electronVersion=${electronVersion}` : ''}, npmRebuild=false)`);

// Ana projedeki derlenmiş node_modules'ı junction ile bağla
linkNodeModules();

// 2b. Tohum (seed) veritabanını ASAR dışına kopyalanmak üzere hazırla.
// Kaynak seçimi: --use-dev-db verildiyse her zaman dev DB; yoksa raporlar_build.db varsa o, değilse raporlar.db.
let buildDbSrc;
let buildDbLabel;
const preferredPath = path.join(ROOT, BUILD_DB_PREFERRED);
const fallbackPath = path.join(ROOT, BUILD_DB_FALLBACK);

if (FORCE_DEV_DB && fs.existsSync(fallbackPath)) {
    buildDbSrc = fallbackPath;
    buildDbLabel = `${BUILD_DB_FALLBACK} (--use-dev-db)`;
} else if (fs.existsSync(preferredPath)) {
    buildDbSrc = preferredPath;
    buildDbLabel = BUILD_DB_PREFERRED;
} else if (fs.existsSync(fallbackPath)) {
    buildDbSrc = fallbackPath;
    buildDbLabel = `${BUILD_DB_FALLBACK} (raporlar_build.db bulunamadı, geliştirme DB'si kullanılıyor)`;
}

if (buildDbSrc) {
    const extraDir = path.join(BUILD_TEMP, 'extra');
    fs.mkdirSync(extraDir, { recursive: true });
    fs.copyFileSync(buildDbSrc, path.join(extraDir, 'raporlar.db'));
    const sizeKB = (fs.statSync(buildDbSrc).size / 1024).toFixed(1);
    console.log(`  Seed DB: ${buildDbLabel} → extra/raporlar.db (${sizeKB} KB)`);
} else {
    console.log('  ⚠️ Ne raporlar_build.db ne de raporlar.db bulundu — build içine DB gömülmeyecek (uygulama ilk açılışta boş DB oluşturur)');
}

// 3. JS dosyalarını obfuscate et
if (SKIP_OBFUSCATION) {
    console.log('[3/4] Obfuscation atlanıyor (--no-obfuscate)');
} else {
    console.log('[3/4] JavaScript dosyaları karartılıyor...');
    let obfuscated = 0;
    let failed = 0;

    console.log('  --- Main Process ---');
    MAIN_JS_FILES.forEach(file => {
        const filePath = path.join(BUILD_TEMP, file);
        if (fs.existsSync(filePath)) {
            process.stdout.write(`  Karartılıyor: ${file}... `);
            if (obfuscateFile(filePath, MAIN_OBFUSCATION_OPTIONS)) {
                console.log('OK');
                obfuscated++;
            } else {
                console.log('ATLA');
                failed++;
            }
        } else {
            console.log(`  Atlanıyor (dosya yok): ${file}`);
        }
    });

    console.log('  --- Renderer Process ---');
    RENDERER_JS_FILES.forEach(file => {
        const filePath = path.join(BUILD_TEMP, file);
        if (fs.existsSync(filePath)) {
            process.stdout.write(`  Karartılıyor: ${file}... `);
            if (obfuscateFile(filePath, RENDERER_OBFUSCATION_OPTIONS)) {
                console.log('OK');
                obfuscated++;
            } else {
                console.log('ATLA');
                failed++;
            }
        } else {
            console.log(`  Atlanıyor (dosya yok): ${file}`);
        }
    });
    console.log(`  Toplam: ${obfuscated} karartıldı, ${failed} hata`);
}

// 4. Build bilgisi
console.log('[4/4] Build hazır!');
console.log('');
console.log('Sonraki adım: electron-builder ile paketleme');
console.log('  npx electron-builder --win portable --project build-temp');
console.log('');
console.log('='.repeat(60));
