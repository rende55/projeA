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

// Build'e dahil edilecek veritabanı (temizlenmiş versiyon)
const BUILD_DB = 'raporlar_build.db';

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

function cleanDir(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
    fs.mkdirSync(dir, { recursive: true });
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
// extraResources: DB dosyasını ASAR dışında exe yanına kopyala
if (pkg.build) {
    pkg.build.extraResources = [
        {
            from: 'extra/raporlar.db',
            to: '../raporlar.db'
        }
    ];
}
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('  package.json temizlendi (devDeps kaldırıldı, extraResources eklendi)');

// 2b. Temizlenmiş veritabanını ASAR dışına kopyalanmak üzere hazırla
const buildDbSrc = path.join(ROOT, BUILD_DB);
if (fs.existsSync(buildDbSrc)) {
    // DB'yi ASAR dışında olacak şekilde extraResources'a kopyala
    // electron-builder extraResources ile exe yanına kopyalayacak
    const extraDir = path.join(BUILD_TEMP, 'extra');
    fs.mkdirSync(extraDir, { recursive: true });
    fs.copyFileSync(buildDbSrc, path.join(extraDir, 'raporlar.db'));
    console.log('  raporlar_build.db → extra/raporlar.db kopyalandı');
} else {
    console.log('  ⚠️ raporlar_build.db bulunamadı, DB dahil edilmeyecek');
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
