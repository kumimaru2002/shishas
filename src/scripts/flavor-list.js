class FlavorListController {
  constructor() {
    this.flavors = [];
    this.shops = [];
    this.filteredFlavors = [];
    this.currentSearchQuery = '';
    this.currentScoreFilter = '';
    this.currentShopFilter = '';
    this.currentSort = 'createdAt:desc';
    this.deleteTargetId = null;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.loadData();
  }

  initializeElements() {
    this.elements = {
      // 検索・フィルター関連
      searchInput: document.getElementById('search-input'),
      clearSearchBtn: document.getElementById('clear-search'),
      scoreFilter: document.getElementById('score-filter'),
      shopFilter: document.getElementById('shop-filter'),
      sortSelect: document.getElementById('sort-select'),
      
      // 表示関連
      flavorCount: document.getElementById('flavor-count'),
      flavorsGrid: document.getElementById('flavors-grid'),
      loadingContainer: document.getElementById('loading-container'),
      emptyState: document.getElementById('empty-state'),
      noResults: document.getElementById('no-results'),
      
      // モーダル関連
      deleteModal: document.getElementById('delete-modal'),
      deleteFlavorName: document.getElementById('delete-flavor-name'),
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
      this.clearFilters();
    });

    // フィルター機能
    this.elements.scoreFilter.addEventListener('change', (e) => {
      this.currentScoreFilter = e.target.value;
      this.applyFiltersAndSort();
    });

    this.elements.shopFilter.addEventListener('change', (e) => {
      this.currentShopFilter = e.target.value;
      this.applyFiltersAndSort();
    });

    this.elements.sortSelect.addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.applyFiltersAndSort();
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

  async loadData() {
    this.showLoading();
    
    try {
      // 少し遅延を入れてローディング表示を見せる
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.shops = getShops();
      this.flavors = getFlavors();
      this.loadShopFilter();
      this.applyFiltersAndSort();
    } catch (error) {
      console.error('データの読み込みエラー:', error);
      this.showError('データの読み込みに失敗しました。');
    } finally {
      this.hideLoading();
    }
  }

  loadShopFilter() {
    // 店舗フィルターのオプションを生成
    this.elements.shopFilter.innerHTML = '<option value="">店舗すべて</option>';
    
    this.shops.forEach(shop => {
      const option = document.createElement('option');
      option.value = shop.id;
      option.textContent = shop.name;
      this.elements.shopFilter.appendChild(option);
    });
  }

  handleSearch(query) {
    this.currentSearchQuery = query.trim();
    this.applyFiltersAndSort();
  }

  clearFilters() {
    this.elements.searchInput.value = '';
    this.elements.scoreFilter.value = '';
    this.elements.shopFilter.value = '';
    this.elements.sortSelect.value = 'createdAt:desc';
    
    this.currentSearchQuery = '';
    this.currentScoreFilter = '';
    this.currentShopFilter = '';
    this.currentSort = 'createdAt:desc';
    
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort() {
    let filtered = [...this.flavors];

    // 検索フィルター
    if (this.currentSearchQuery) {
      filtered = searchFlavors(this.currentSearchQuery);
    }

    // 評価フィルター
    if (this.currentScoreFilter) {
      const minScore = parseInt(this.currentScoreFilter);
      filtered = filtered.filter(flavor => flavor.score >= minScore);
    }

    // 店舗フィルター
    if (this.currentShopFilter) {
      filtered = filtered.filter(flavor => flavor.shopId === this.currentShopFilter);
    }

    // ソート
    const [sortBy, sortOrder] = this.currentSort.split(':');
    filtered = sortFlavors(filtered, sortBy, sortOrder);

    this.filteredFlavors = filtered;
    this.renderFlavors();
    this.updateFlavorCount();
  }

  renderFlavors() {
    const grid = this.elements.flavorsGrid;
    
    if (this.filteredFlavors.length === 0) {
      grid.innerHTML = '';
      if (this.flavors.length === 0) {
        this.showEmptyState();
      } else {
        this.showNoResults();
      }
      return;
    }

    this.hideEmptyState();
    this.hideNoResults();

    grid.innerHTML = this.filteredFlavors.map(flavor => this.createFlavorCard(flavor)).join('');
    
    // 削除ボタンのイベントリスナーを追加
    grid.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const flavorId = btn.dataset.flavorId;
        const flavorName = btn.dataset.flavorName;
        this.showDeleteModal(flavorId, flavorName);
      });
    });
  }

  createFlavorCard(flavor) {
    const createdDate = new Date(flavor.createdAt).toLocaleDateString('ja-JP');
    const updatedDate = new Date(flavor.updatedAt).toLocaleDateString('ja-JP');
    const smokedAtDate = flavor.smokedAt ? new Date(flavor.smokedAt).toLocaleString('ja-JP') : null;
    
    // 関連店舗を取得
    const relatedShop = flavor.shopId ? this.shops.find(shop => shop.id === flavor.shopId) : null;
    
    // 星評価の表示
    const stars = '★'.repeat(flavor.score) + '☆'.repeat(5 - flavor.score);
    
    return `
      <div class="flavor-card">
        <div class="flavor-card-header">
          <div class="flavor-card-title-row">
            <h3 class="flavor-card-title">${this.escapeHtml(flavor.name)}</h3>
            <div class="flavor-card-actions">
              <a href="../pages/flavor-edit.html?id=${flavor.id}" class="btn btn-sm btn-secondary">
                編集
              </a>
              <button 
                type="button" 
                class="btn btn-sm btn-danger delete-btn"
                data-flavor-id="${flavor.id}"
                data-flavor-name="${this.escapeHtml(flavor.name)}"
              >
                削除
              </button>
            </div>
          </div>
          <div class="flavor-rating">
            <span class="flavor-stars">${stars}</span>
            <span class="flavor-score">${flavor.score}点</span>
          </div>
        </div>
        
        <div class="flavor-card-body">
          <div class="flavor-ingredients">
            <div class="flavor-ingredients-label">フレーバー組み合わせ</div>
            <div class="flavor-ingredients-tags">
              ${flavor.flavors.map(ingredient => 
                `<span class="flavor-ingredient-tag">${this.escapeHtml(ingredient)}</span>`
              ).join('')}
            </div>
          </div>
          
          ${relatedShop ? `
            <div class="flavor-shop">
              <span class="flavor-shop-icon">🏪</span>
              <a href="../pages/shop-detail.html?id=${relatedShop.id}" class="flavor-shop-link">
                ${this.escapeHtml(relatedShop.name)}
              </a>
            </div>
          ` : ''}
          
          ${flavor.memo ? `
            <div class="flavor-memo">
              ${this.escapeHtml(flavor.memo)}
            </div>
          ` : ''}
          
          ${flavor.tags && flavor.tags.length > 0 ? `
            <div class="flavor-tags">
              <div class="flavor-tags-label">タグ</div>
              <div class="flavor-tags-container">
                ${flavor.tags.map(tag => 
                  `<span class="flavor-tag">${this.escapeHtml(tag)}</span>`
                ).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="flavor-card-footer">
          <div class="flavor-meta">
            <div class="flavor-dates">
              <div>作成: ${createdDate}</div>
              ${flavor.createdAt !== flavor.updatedAt ? `
                <div>更新: ${updatedDate}</div>
              ` : ''}
            </div>
            ${smokedAtDate ? `
              <div class="flavor-smoked-at">
                喫煙: ${smokedAtDate}
              </div>
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

  updateFlavorCount() {
    const count = this.currentSearchQuery || this.currentScoreFilter || this.currentShopFilter 
      ? this.filteredFlavors.length 
      : this.flavors.length;
    this.elements.flavorCount.textContent = count;
  }

  showDeleteModal(flavorId, flavorName) {
    this.deleteTargetId = flavorId;
    this.elements.deleteFlavorName.textContent = flavorName;
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
      const success = deleteFlavor(this.deleteTargetId);
      
      if (success) {
        this.hideDeleteModal();
        await this.loadData();
        this.showSuccess('フレーバーを削除しました。');
      } else {
        this.showError('フレーバーの削除に失敗しました。');
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
  new FlavorListController();
});