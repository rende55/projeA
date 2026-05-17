/**
 * Tek Pencere Navigasyon Yöneticisi
 * Tüm sayfa geçişlerini yönetir
 */

const path = require('path');
const fs = require('fs');
const remote = require('@electron/remote');

// Uygulama kök dizini - Electron'da doğru yolu almak için
const appPath = remote.app.getAppPath();
console.log('📁 Uygulama dizini:', appPath);

class NavigationManager {
    constructor() {
        this.stack = []; // Sayfa geçmişi
        this.currentPage = null;
        this.pageModules = {}; // Yüklenen sayfa modülleri
        this.pageData = {}; // Sayfa verileri (form state vb.)
        this.container = null;
        this.navBar = null;
        this.breadcrumb = null;
        
        // Base path - uygulama kök dizini
        this.basePath = appPath;
        
        // Sayfa tanımları
        this.pages = {
            'dashboard': {
                title: 'Ana Sayfa',
                icon: '🏠',
                template: null, // Dashboard özel, template yok
                script: null
            },
            'yapi-bedeli': {
                title: 'Yapı Bedeli',
                icon: '🏗️',
                template: 'modules/yapi-bedeli/views/yapi-bedeli-content.html',
                script: 'modules/yapi-bedeli/scripts/yapi-bedeli-page.js'
            },
            'raporlar': {
                title: 'Kayıtlı Raporlar',
                icon: '📋',
                template: 'modules/yapi-bedeli/views/raporlar-content.html',
                script: 'modules/yapi-bedeli/scripts/raporlar-page.js'
            },
            'editor': {
                title: 'Rapor Editörü',
                icon: '📝',
                template: 'modules/yapi-bedeli/views/editor-content.html',
                script: 'modules/yapi-bedeli/scripts/editor-page.js'
            },
            'admin': {
                title: 'Yönetim Paneli',
                icon: '⚙️',
                template: 'modules/yapi-bedeli/views/admin-content.html',
                script: 'modules/yapi-bedeli/scripts/admin-page.js'
            },
            'proje-bedeli': {
                title: 'Proje Bedeli',
                icon: '📐',
                template: 'modules/proje-bedeli/views/proje-bedeli-content.html',
                script: 'modules/proje-bedeli/scripts/proje-bedeli-page.js'
            },
            'pb-raporlar': {
                title: 'Proje Bedeli Raporları',
                icon: '📋',
                template: 'modules/proje-bedeli/views/pb-raporlar-content.html',
                script: 'modules/proje-bedeli/scripts/pb-raporlar-page.js'
            },
            'pb-editor': {
                title: 'Proje Bedeli Editörü',
                icon: '📝',
                template: 'modules/proje-bedeli/views/pb-editor-content.html',
                script: 'modules/proje-bedeli/scripts/pb-editor-page.js'
            }
        };
    }
    
    /**
     * Navigasyon sistemini başlat
     */
    init(containerElement, navBarElement, breadcrumbElement) {
        this.container = containerElement;
        this.navBar = navBarElement;
        this.breadcrumb = breadcrumbElement;
        
        // Klavye kısayolları
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Başlangıç sayfası
        this.stack.push({ page: 'dashboard', data: null });
        this.currentPage = 'dashboard';
        
        console.log('🧭 Navigasyon sistemi başlatıldı');
    }
    
    /**
     * Yeni sayfaya git
     */
    async navigateTo(pageName, data = null) {
        console.log(`🚀 navigateTo çağrıldı: ${pageName}`);
        
        const pageConfig = this.pages[pageName];
        if (!pageConfig) {
            console.error(`❌ Sayfa bulunamadı: ${pageName}`);
            return false;
        }
        
        console.log(`🔄 Navigasyon: ${this.currentPage} → ${pageName}`, pageConfig);
        
        // Mevcut sayfayı kaydet (form verileri vb.)
        await this.saveCurrentPageState();
        
        // Mevcut sayfayı unload et
        await this.unloadCurrentPage();
        
        // Stack'e ekle
        this.stack.push({ page: pageName, data: data });
        this.currentPage = pageName;
        
        // Yeni sayfayı yükle
        await this.loadPage(pageName, data);
        
        // UI güncelle
        this.updateNavBar();
        this.updateBreadcrumb();
        
        return true;
    }
    
    /**
     * Önceki sayfaya dön
     */
    async goBack() {
        if (this.stack.length <= 1) {
            console.log('📍 Zaten ana sayfadasınız');
            return false;
        }
        
        // Kaydedilmemiş değişiklik kontrolü
        if (this.hasUnsavedChanges()) {
            const confirmed = await this.confirmLeave();
            if (!confirmed) return false;
        }
        
        // Mevcut sayfayı unload et
        await this.unloadCurrentPage();
        
        // Stack'ten çıkar
        this.stack.pop();
        
        // Önceki sayfayı al
        const previousEntry = this.stack[this.stack.length - 1];
        this.currentPage = previousEntry.page;
        
        console.log(`⬅️ Geri: ${previousEntry.page}`);
        
        // Sayfayı yükle
        await this.loadPage(previousEntry.page, previousEntry.data);
        
        // UI güncelle
        this.updateNavBar();
        this.updateBreadcrumb();
        
        return true;
    }
    
    /**
     * Ana sayfaya dön
     */
    async goHome() {
        if (this.currentPage === 'dashboard') {
            return true;
        }
        
        // Kaydedilmemiş değişiklik kontrolü
        if (this.hasUnsavedChanges()) {
            const confirmed = await this.confirmLeave();
            if (!confirmed) return false;
        }
        
        // Tüm sayfaları unload et
        await this.unloadCurrentPage();
        
        // Stack'i temizle
        this.stack = [{ page: 'dashboard', data: null }];
        this.currentPage = 'dashboard';
        
        console.log('🏠 Ana sayfaya dönüldü');
        
        // Dashboard'u göster
        await this.loadPage('dashboard', null);
        
        // UI güncelle
        this.updateNavBar();
        this.updateBreadcrumb();
        
        return true;
    }
    
    /**
     * Sayfayı yükle
     */
    async loadPage(pageName, data) {
        const pageConfig = this.pages[pageName];
        
        if (pageName === 'dashboard') {
            // Dashboard özel durum - container'ı gizle, dashboard'u göster
            this.container.style.display = 'none';
            document.querySelector('.dashboard-wrapper').style.display = 'block';
            this.navBar.style.display = 'none';
            document.body.classList.remove('page-mode');
            return;
        }
        
        // Dashboard'u gizle, container'ı göster
        document.querySelector('.dashboard-wrapper').style.display = 'none';
        this.container.style.display = 'block';
        this.navBar.style.display = 'flex';
        document.body.classList.add('page-mode');
        
        try {
            // Template'i yükle - Electron'da fs kullanıyoruz
            const templatePath = path.join(appPath, pageConfig.template);
            console.log('📄 Template yükleniyor:', templatePath);
            
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template dosyası bulunamadı: ${templatePath}`);
            }
            
            const html = fs.readFileSync(templatePath, 'utf8');
            this.container.innerHTML = html;
            
            // Script'i yükle ve başlat
            if (pageConfig.script) {
                // Script zaten yüklüyse cache'den al
                if (!this.pageModules[pageName]) {
                    const scriptPath = path.join(appPath, pageConfig.script);
                    console.log('📂 Script yükleniyor:', scriptPath);
                    this.pageModules[pageName] = require(scriptPath);
                }
                
                const module = this.pageModules[pageName];
                if (module && typeof module.onLoad === 'function') {
                    await module.onLoad(this.container, data, this);
                }
            }
            
            console.log(`✅ Sayfa yüklendi: ${pageName}`);
            
        } catch (error) {
            console.error(`❌ Sayfa yükleme hatası (${pageName}):`, error);
            this.container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #E53935;">
                    <h2>Sayfa Yüklenemedi</h2>
                    <p>${error.message}</p>
                    <button onclick="window.navigation.goBack()" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
                        ← Geri Dön
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Mevcut sayfayı kaldır
     */
    async unloadCurrentPage() {
        if (!this.currentPage || this.currentPage === 'dashboard') return;
        
        const module = this.pageModules[this.currentPage];
        if (module && typeof module.onUnload === 'function') {
            await module.onUnload();
        }
    }
    
    /**
     * Mevcut sayfa state'ini kaydet
     */
    async saveCurrentPageState() {
        if (!this.currentPage || this.currentPage === 'dashboard') return;
        
        const module = this.pageModules[this.currentPage];
        if (module && typeof module.saveState === 'function') {
            this.pageData[this.currentPage] = await module.saveState();
        }
    }
    
    /**
     * Kaydedilmemiş değişiklik var mı?
     */
    hasUnsavedChanges() {
        if (!this.currentPage || this.currentPage === 'dashboard') return false;
        
        const module = this.pageModules[this.currentPage];
        if (module && typeof module.hasUnsavedChanges === 'function') {
            return module.hasUnsavedChanges();
        }
        return false;
    }
    
    /**
     * Sayfadan ayrılma onayı
     */
    async confirmLeave() {
        return new Promise((resolve) => {
            const result = confirm('Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istediğinize emin misiniz?');
            resolve(result);
        });
    }
    
    /**
     * Klavye kısayolları
     */
    handleKeyboard(e) {
        // ESC - Geri git
        if (e.key === 'Escape' && this.currentPage !== 'dashboard') {
            e.preventDefault();
            this.goBack();
        }
        
        // Alt + Left Arrow - Geri git
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            this.goBack();
        }
        
        // Alt + Home - Ana sayfaya git
        if (e.altKey && e.key === 'Home') {
            e.preventDefault();
            this.goHome();
        }
    }
    
    /**
     * Navigasyon bar'ı güncelle
     */
    updateNavBar() {
        if (!this.navBar) return;
        
        const canGoBack = this.stack.length > 1;
        const backBtn = this.navBar.querySelector('.nav-back-btn');
        const homeBtn = this.navBar.querySelector('.nav-home-btn');
        
        if (backBtn) {
            backBtn.disabled = !canGoBack;
            backBtn.style.opacity = canGoBack ? '1' : '0.5';
        }
        
        if (homeBtn) {
            homeBtn.disabled = this.currentPage === 'dashboard';
            homeBtn.style.opacity = this.currentPage === 'dashboard' ? '0.5' : '1';
        }
    }
    
    /**
     * Breadcrumb güncelle
     */
    updateBreadcrumb() {
        if (!this.breadcrumb) return;
        
        const items = this.stack.map((entry, index) => {
            const pageConfig = this.pages[entry.page];
            const isLast = index === this.stack.length - 1;
            
            if (isLast) {
                return `<span class="breadcrumb-current">${pageConfig.icon} ${pageConfig.title}</span>`;
            } else {
                return `<span class="breadcrumb-item" data-index="${index}">${pageConfig.icon} ${pageConfig.title}</span>`;
            }
        });
        
        this.breadcrumb.innerHTML = items.join(' <span class="breadcrumb-separator">›</span> ');
        
        // Breadcrumb tıklama olayları
        this.breadcrumb.querySelectorAll('.breadcrumb-item').forEach(item => {
            item.addEventListener('click', async () => {
                const targetIndex = parseInt(item.dataset.index);
                await this.navigateToStackIndex(targetIndex);
            });
        });
    }
    
    /**
     * Stack'teki belirli bir indexe git
     */
    async navigateToStackIndex(targetIndex) {
        if (targetIndex < 0 || targetIndex >= this.stack.length - 1) return;
        
        // Kaydedilmemiş değişiklik kontrolü
        if (this.hasUnsavedChanges()) {
            const confirmed = await this.confirmLeave();
            if (!confirmed) return;
        }
        
        // Mevcut sayfayı unload et
        await this.unloadCurrentPage();
        
        // Stack'i kırp
        this.stack = this.stack.slice(0, targetIndex + 1);
        
        // Hedef sayfayı al
        const targetEntry = this.stack[this.stack.length - 1];
        this.currentPage = targetEntry.page;
        
        // Sayfayı yükle
        await this.loadPage(targetEntry.page, targetEntry.data);
        
        // UI güncelle
        this.updateNavBar();
        this.updateBreadcrumb();
    }
    
    /**
     * Mevcut sayfa adını al
     */
    getCurrentPage() {
        return this.currentPage;
    }
    
    /**
     * Stack derinliğini al
     */
    getStackDepth() {
        return this.stack.length;
    }
}

// Global instance
const navigation = new NavigationManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NavigationManager, navigation };
}

// Global erişim için
window.navigation = navigation;
