/**
 * Veritabanı Yol Yardımcısı
 * ASAR paketleme uyumlu veritabanı yolu hesaplama
 * 
 * Production (ASAR): exe'nin bulunduğu klasörde raporlar.db
 * Development: proje kök dizininde raporlar.db
 */

const path = require('path');
const remote = require('@electron/remote');

function getDbPath() {
    const app = remote.app;
    let rootDir;
    
    if (app.isPackaged) {
        // Production: exe'nin bulunduğu klasör
        rootDir = path.dirname(app.getPath('exe'));
    } else {
        // Development: uygulama kök dizini
        rootDir = app.getAppPath();
    }
    
    return path.join(rootDir, 'raporlar.db');
}

function getAppRootDir() {
    const app = remote.app;
    if (app.isPackaged) {
        return path.dirname(app.getPath('exe'));
    }
    return app.getAppPath();
}

module.exports = { getDbPath, getAppRootDir };
