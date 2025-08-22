class FlavorDetailController {
  constructor() {
    this.flavorId = null;
    this.flavor = null;
    this.shops = [];
    this.deleteTargetId = null;
    
    this.initializeElements();
    this.initializeEventListeners();
    this.loadFlavorId();
    this.loadData();
  }

  initializeElements() {
    this.elements = {
      // ローディング・エラー関連
      loadingContainer: document.getElementById('loading-container'),
      errorState: document.getElementById('error-state'),
      errorMessage: document.getElementById('error-message'),
      retryBtn: document.getElementById('retry-btn'),
      
      // フレーバー詳細表示
      flavorDetail: document.getElementById('flavor-detail'),
      flavorNameBreadcrumb: document.getElementById('flavor-name-breadcrumb'),
      flavorName: document.getElementById('flavor-name'),
      flavorStars: document.getElementById('flavor-stars'),
      flavorScore: document.getElementById('flavor-score'),
      editFlavorBtn: document.getElementById('edit-flavor-btn'),
      deleteFlavorBtn: document.getElementById('delete-flavor-btn'),
      
      // 詳細情報
      flavorIngredients: document.getElementById('flavor-ingredients'),
      shopRow: document.getElementById('shop-row'),
      shopName: document.getElementById('shop-name'),
      shopLink: document.getElementById('shop-link'),
      smokedAtRow: document.getElementById('smoked-at-row'),
      smokedAt: document.getElementById('smoked-at'),
      tagsRow: document.getElementById('tags-row'),
      flavorTags: document.getElementById('flavor-tags'),
      memoCard: document.getElementById('memo-card'),
      flavorMemo: document.getElementById('flavor-memo'),
      createdAt: document.getElementById('created-at'),
      updatedAtRow: document.getElementById('updated-at-row'),
      updatedAt: document.getElementById('updated-at'),
      
      // モーダル関連
      deleteModal: document.getElementById('delete-modal'),
      deleteFlavorName: document.getElementById('delete-flavor-name'),
      cancelDeleteBtn: document.getElementById('cancel-delete'),
      confirmDeleteBtn: document.getElementById('confirm-delete')
    };
  }

  initializeEventListeners() {
    // 再試行ボタン
    this.elements.retryBtn.addEventListener('click', () => {
      this.loadData();
    });

    // 削除ボタン
    this.elements.deleteFlavorBtn.addEventListener('click', () => {
      if (this.flavor) {
        this.showDeleteModal(this.flavor.id, this.flavor.name);
      }
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

  loadFlavorId() {
    const urlParams = new URLSearchParams(window.location.search);
    this.flavorId = urlParams.get('id');
    
    if (!this.flavorId) {
      this.showError('フレーバーIDが指定されていません。');
      return;
    }
  }

  async loadData() {
    this.showLoading();
    
    try {
      // 少し遅延を入れてローディング表示を見せる
      await new Promise(resolve => setTimeout(resolve, 300));
      
      this.shops = getShops();
      this.flavor = getFlavor(this.flavorId);
      
      if (!this.flavor) {
        this.showError('指定されたフレーバーが見つかりません。');
        return;
      }
      
      this.renderFlavorDetail();
      this.showFlavorDetail();
      
    } catch (error) {
      console.error('データの読み込みエラー:', error);
      this.showError('データの読み込みに失敗しました。');
    }
  }

  renderFlavorDetail() {
    if (!this.flavor) return;
    
    // ページタイトルとパンくず更新
    document.title = `${this.flavor.name} | フレーバー詳細 | シーシャ管理`;
    this.elements.flavorNameBreadcrumb.textContent = this.flavor.name;
    this.elements.flavorName.textContent = this.flavor.name;
    
    // 評価表示
    const stars = '★'.repeat(this.flavor.score) + '☆'.repeat(5 - this.flavor.score);
    this.elements.flavorStars.textContent = stars;
    this.elements.flavorScore.textContent = `${this.flavor.score}点`;
    
    // 編集リンク更新
    this.elements.editFlavorBtn.href = `./flavor-edit.html?id=${this.flavor.id}`;
    
    // フレーバー組み合わせ
    this.renderFlavorIngredients();
    
    // 店舗情報
    this.renderShopInfo();
    
    // 喫煙日時
    this.renderSmokedAt();
    
    // タグ
    this.renderTags();
    
    // メモ
    this.renderMemo();
    
    // 履歴情報
    this.renderHistory();
  }

  renderFlavorIngredients() {
    if (!this.flavor.flavors || this.flavor.flavors.length === 0) {
      this.elements.flavorIngredients.innerHTML = '<span class="text-muted">なし</span>';
      return;
    }
    
    this.elements.flavorIngredients.innerHTML = this.flavor.flavors
      .map(ingredient => `<span class="flavor-ingredient-tag">${this.escapeHtml(ingredient)}</span>`)
      .join('');
  }

  renderShopInfo() {
    if (!this.flavor.shopId) {
      this.elements.shopRow.style.display = 'none';
      return;
    }
    
    const shop = this.shops.find(shop => shop.id === this.flavor.shopId);
    if (!shop) {
      this.elements.shopRow.style.display = 'none';
      return;
    }
    
    this.elements.shopRow.style.display = 'flex';
    this.elements.shopName.textContent = shop.name;
    this.elements.shopLink.href = `./shop-detail.html?id=${shop.id}`;
  }

  renderSmokedAt() {
    if (!this.flavor.smokedAt) {
      this.elements.smokedAtRow.style.display = 'none';
      return;
    }
    
    this.elements.smokedAtRow.style.display = 'flex';
    this.elements.smokedAt.textContent = new Date(this.flavor.smokedAt).toLocaleString('ja-JP');
  }

  renderTags() {
    if (!this.flavor.tags || this.flavor.tags.length === 0) {
      this.elements.tagsRow.style.display = 'none';
      return;
    }
    
    this.elements.tagsRow.style.display = 'flex';
    this.elements.flavorTags.innerHTML = this.flavor.tags
      .map(tag => `<span class="flavor-tag">${this.escapeHtml(tag)}</span>`)
      .join('');
  }

  renderMemo() {
    if (!this.flavor.memo || this.flavor.memo.trim() === '') {
      this.elements.memoCard.classList.add('empty');
      this.elements.flavorMemo.textContent = 'メモは記録されていません。';
      return;
    }
    
    this.elements.memoCard.classList.remove('empty');
    this.elements.flavorMemo.textContent = this.flavor.memo;
  }

  renderHistory() {
    // 作成日時
    this.elements.createdAt.textContent = new Date(this.flavor.createdAt).toLocaleString('ja-JP');
    
    // 更新日時（作成日時と異なる場合のみ表示）
    if (this.flavor.createdAt !== this.flavor.updatedAt) {
      this.elements.updatedAtRow.style.display = 'flex';
      this.elements.updatedAt.textContent = new Date(this.flavor.updatedAt).toLocaleString('ja-JP');
    } else {
      this.elements.updatedAtRow.style.display = 'none';
    }
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
        this.showSuccessAndRedirect('フレーバーを削除しました。', './flavor-list.html');
      } else {
        this.showAlert('フレーバーの削除に失敗しました。', 'danger');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      this.showAlert('削除中にエラーが発生しました。', 'danger');
    }
  }

  showLoading() {
    this.elements.loadingContainer.classList.remove('d-none');
    this.elements.errorState.classList.add('d-none');
    this.elements.flavorDetail.classList.add('d-none');
  }

  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.loadingContainer.classList.add('d-none');
    this.elements.errorState.classList.remove('d-none');
    this.elements.flavorDetail.classList.add('d-none');
  }

  showFlavorDetail() {
    this.elements.loadingContainer.classList.add('d-none');
    this.elements.errorState.classList.add('d-none');
    this.elements.flavorDetail.classList.remove('d-none');
  }

  showAlert(message, type) {
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
    if (pageHeader) {
      pageHeader.insertAdjacentElement('afterend', alert);
    } else {
      // ページヘッダーがない場合はメインの最初に挿入
      const main = document.querySelector('.main .container');
      if (main) {
        main.insertAdjacentElement('afterbegin', alert);
      }
    }

    // 3秒後に自動削除
    setTimeout(() => {
      if (alert && alert.parentNode) {
        alert.remove();
      }
    }, 3000);

    // メッセージまでスクロール
    alert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  showSuccessAndRedirect(message, url) {
    this.showAlert(message, 'success');
    
    // 2秒後にリダイレクト
    setTimeout(() => {
      window.location.href = url;
    }, 2000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  new FlavorDetailController();
});