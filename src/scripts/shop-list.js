class ShopListController {
  constructor() {
    this.shops = [];
    this.filteredShops = [];
    this.currentSearchQuery = '';
    this.deleteTargetId = null;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.loadShops();
  }

  initializeElements() {
    this.elements = {
      // 検索関連
      searchInput: document.getElementById('search-input'),
      clearSearchBtn: document.getElementById('clear-search'),
      
      // 表示関連
      shopCount: document.getElementById('shop-count'),
      shopsGrid: document.getElementById('shops-grid'),
      loadingContainer: document.getElementById('loading-container'),
      emptyState: document.getElementById('empty-state'),
      noResults: document.getElementById('no-results'),
      
      // モーダル関連
      deleteModal: document.getElementById('delete-modal'),
      deleteShopName: document.getElementById('delete-shop-name'),
      cancelDeleteBtn: document.getElementById('cancel-delete'),
      confirmDeleteBtn: document.getElementById('confirm-delete')
    };
  }

  initializeEventListeners() {
    // 検索機能
    this.elements.searchInput.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    this.elements.clearSearchBtn.addEventListener('click', () => {
      this.clearSearch();
    });

    // モーダル関連
    this.elements.cancelDeleteBtn.addEventListener('click', () => {
      this.hideDeleteModal();
    });

    this.elements.confirmDeleteBtn.addEventListener('click', () => {
      this.executeDelete();
    });

    this.elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === this.elements.deleteModal) {
        this.hideDeleteModal();
      }
    });

    // ESCキーでモーダルを閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideDeleteModal();
      }
    });
  }

  async loadShops() {
    this.showLoading();
    
    try {
      // 少し遅延を入れてローディング表示を見せる
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.shops = getShops();
      this.filteredShops = [...this.shops];
      this.renderShops();
      this.updateShopCount();
    } catch (error) {
      console.error('店舗データの読み込みエラー:', error);
      this.showError('店舗データの読み込みに失敗しました。');
    } finally {
      this.hideLoading();
    }
  }

  handleSearch(query) {
    this.currentSearchQuery = query.trim();
    
    if (this.currentSearchQuery) {
      this.filteredShops = searchShops(this.currentSearchQuery);
    } else {
      this.filteredShops = [...this.shops];
    }
    
    this.renderShops();
    this.updateShopCount();
  }

  clearSearch() {
    this.elements.searchInput.value = '';
    this.currentSearchQuery = '';
    this.filteredShops = [...this.shops];
    this.renderShops();
    this.updateShopCount();
  }

  renderShops() {
    const grid = this.elements.shopsGrid;
    
    if (this.filteredShops.length === 0) {
      grid.innerHTML = '';
      if (this.shops.length === 0) {
        this.showEmptyState();
      } else {
        this.showNoResults();
      }
      return;
    }

    this.hideEmptyState();
    this.hideNoResults();

    grid.innerHTML = this.filteredShops.map(shop => this.createShopCard(shop)).join('');
    
    // 削除ボタンのイベントリスナーを追加
    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const shopId = btn.dataset.shopId;
        const shopName = btn.dataset.shopName;
        this.showDeleteModal(shopId, shopName);
      });
    });
  }

  createShopCard(shop) {
    const createdDate = new Date(shop.createdAt).toLocaleDateString('ja-JP');
    const updatedDate = new Date(shop.updatedAt).toLocaleDateString('ja-JP');
    
    return `
      <div class="shop-card">
        <div class="shop-card-header">
          <h3 class="shop-card-title">${this.escapeHtml(shop.name)}</h3>
          <div class="shop-card-actions">
            <a href="../pages/shop-edit.html?id=${shop.id}" class="btn btn-sm btn-secondary">
              編集
            </a>
            <button 
              type="button" 
              class="btn btn-sm btn-danger delete-btn"
              data-shop-id="${shop.id}"
              data-shop-name="${this.escapeHtml(shop.name)}"
            >
              削除
            </button>
          </div>
        </div>
        <div class="shop-card-body">
          ${shop.address ? `
            <div class="shop-info-item">
              <span class="shop-info-icon">📍</span>
              <span class="shop-info-text">${this.escapeHtml(shop.address)}</span>
            </div>
          ` : ''}
          
          ${shop.phone ? `
            <div class="shop-info-item">
              <span class="shop-info-icon">📞</span>
              <span class="shop-info-text">${this.escapeHtml(shop.phone)}</span>
            </div>
          ` : ''}
          
          ${shop.openingHours ? `
            <div class="shop-info-item">
              <span class="shop-info-icon">🕒</span>
              <span class="shop-info-text">${this.escapeHtml(shop.openingHours)}</span>
            </div>
          ` : ''}
          
          ${shop.website ? `
            <div class="shop-info-item">
              <span class="shop-info-icon">🌐</span>
              <a href="${this.escapeHtml(shop.website)}" target="_blank" rel="noopener noreferrer" class="shop-info-link">
                ${this.escapeHtml(shop.website)}
              </a>
            </div>
          ` : ''}
          
          ${shop.memo ? `
            <div class="shop-memo">
              ${this.escapeHtml(shop.memo)}
            </div>
          ` : ''}
        </div>
        <div class="shop-card-footer">
          <div class="shop-meta">
            <small class="shop-date">作成: ${createdDate}</small>
            ${shop.createdAt !== shop.updatedAt ? `
              <small class="shop-date">更新: ${updatedDate}</small>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  updateShopCount() {
    const count = this.currentSearchQuery ? this.filteredShops.length : this.shops.length;
    this.elements.shopCount.textContent = count;
  }

  showDeleteModal(shopId, shopName) {
    this.deleteTargetId = shopId;
    this.elements.deleteShopName.textContent = shopName;
    this.elements.deleteModal.classList.remove('d-none');
    document.body.style.overflow = 'hidden';
  }

  hideDeleteModal() {
    this.deleteTargetId = null;
    this.elements.deleteModal.classList.add('d-none');
    document.body.style.overflow = '';
  }

  async executeDelete() {
    if (!this.deleteTargetId) return;

    try {
      const success = deleteShop(this.deleteTargetId);
      
      if (success) {
        this.hideDeleteModal();
        await this.loadShops();
        this.showSuccess('店舗を削除しました。');
      } else {
        this.showError('店舗の削除に失敗しました。');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      this.showError('削除中にエラーが発生しました。');
    }
  }

  showLoading() {
    this.elements.loadingContainer.classList.remove('d-none');
    this.hideEmptyState();
    this.hideNoResults();
  }

  hideLoading() {
    this.elements.loadingContainer.classList.add('d-none');
  }

  showEmptyState() {
    this.elements.emptyState.classList.remove('d-none');
    this.hideNoResults();
  }

  hideEmptyState() {
    this.elements.emptyState.classList.add('d-none');
  }

  showNoResults() {
    this.elements.noResults.classList.remove('d-none');
    this.hideEmptyState();
  }

  hideNoResults() {
    this.elements.noResults.classList.add('d-none');
  }

  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  showError(message) {
    this.showMessage(message, 'danger');
  }

  showMessage(message, type) {
    // 既存のメッセージを削除
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
      existingAlert.remove();
    }

    // 新しいメッセージを作成
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // ページヘッダーの後に挿入
    const pageHeader = document.querySelector('.page-header');
    pageHeader.insertAdjacentElement('afterend', alert);

    // 3秒後に自動削除
    setTimeout(() => {
      if (alert && alert.parentNode) {
        alert.remove();
      }
    }, 3000);

    // メッセージまでスクロール
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  new ShopListController();
});