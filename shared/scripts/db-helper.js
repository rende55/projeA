/**
 * Veritabanı Yol Yardımcısı
 * ASAR + portable paketleme uyumlu kalıcı veritabanı yolu hesaplama.
 *
 * - Development: app.getAppPath() (proje kök dizini)
 * - Portable build: process.env.PORTABLE_EXECUTABLE_DIR
 *   Portable .exe çalışırken kendini %TEMP%\<rastgele>\ altına açar; oraya
 *   yazılan veriler her çıkışta silinir. PORTABLE_EXECUTABLE_DIR ise
 *   kullanıcının çalıştırdığı .exe'nin kalıcı klasörünü gösterir.
 * - Diğer paketleme türleri: exe klasörü.
 */

const path = require('path');
const remote = require('@electron/remote');

function getAppRootDir() {
    const app = remote.app;
    if (app.isPackaged) {
        if (process.env.PORTABLE_EXECUTABLE_DIR) {
            return process.env.PORTABLE_EXECUTABLE_DIR;
        }
        return path.dirname(app.getPath('exe'));
    }
    return app.getAppPath();
}

function getDbPath() {
    return path.join(getAppRootDir(), 'raporlar.db');
}

module.exports = { getDbPath, getAppRootDir };
