class HomeController {
  constructor() {
    this.shops = [];
    this.flavors = [];
    
    this.initializeElements();
    this.loadData();
  }

  initializeElements() {
    this.elements = {
      // 統計要素
      totalShops: document.getElementById('total-shops'),
      totalFlavors: document.getElementById('total-flavors'),
      averageRating: document.getElementById('average-rating'),
      highRatedCount: document.getElementById('high-rated-count'),
      
      // 最新データ要素
      recentShops: document.getElementById('recent-shops'),
      recentFlavors: document.getElementById('recent-flavors'),
      highRatedFlavors: document.getElementById('high-rated-flavors'),
      
      // 空状態
      emptyState: document.getElementById('empty-state')
    };
  }

  async loadData() {
    try {
      // データを読み込み
      this.shops = getShops();
      this.flavors = getFlavors();
      
      // 統計情報を更新
      this.updateStatistics();
      
      // 最新データを表示
      this.renderRecentData();
      
      // 高評価フレーバーを表示
      this.renderHighRatedFlavors();
      
      // 空状態をチェック
      this.checkEmptyState();
      
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    }
  }

  updateStatistics() {
    // 店舗数
    this.elements.totalShops.textContent = this.shops.length;
    
    // フレーバー数
    this.elements.totalFlavors.textContent = this.flavors.length;
    
    // 平均評価
    if (this.flavors.length > 0) {
      const totalRating = this.flavors.reduce((sum, flavor) => sum + flavor.score, 0);
      const averageRating = (totalRating / this.flavors.length).toFixed(1);
      this.elements.averageRating.textContent = averageRating;
    } else {
      this.elements.averageRating.textContent = '-';
    }
    
    // 高評価フレーバー数（4点以上）
    const highRatedCount = this.flavors.filter(flavor => flavor.score >= 4).length;
    this.elements.highRatedCount.textContent = highRatedCount;
  }

  renderRecentData() {
    this.renderRecentShops();
    this.renderRecentFlavors();
  }

  renderRecentShops() {
    const recentShops = this.shops
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recentShops.length === 0) {
      this.elements.recentShops.innerHTML = `
        <div class="recent-empty">
          まだ店舗が登録されていません
        </div>
      `;
      return;
    }

    this.elements.recentShops.innerHTML = recentShops
      .map(shop => this.createRecentShopItem(shop))
      .join('');
  }

  renderRecentFlavors() {
    const recentFlavors = this.flavors
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    if (recentFlavors.length === 0) {
      this.elements.recentFlavors.innerHTML = `
        <div class="recent-empty">
          まだフレーバーが登録されていません
        </div>
      `;
      return;
    }

    this.elements.recentFlavors.innerHTML = recentFlavors
      .map(flavor => this.createRecentFlavorItem(flavor))
      .join('');
  }

  renderHighRatedFlavors() {
    const highRatedFlavors = this.flavors
      .filter(flavor => flavor.score >= 4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    if (highRatedFlavors.length === 0) {
      this.elements.highRatedFlavors.innerHTML = `
        <div class="featured-empty">
          まだ高評価フレーバーがありません<br>
          <small>4点以上のフレーバーを登録してみましょう</small>
        </div>
      `;
      return;
    }

    this.elements.highRatedFlavors.innerHTML = highRatedFlavors
      .map(flavor => this.createFeaturedFlavorItem(flavor))
      .join('');
  }

  createRecentShopItem(shop) {
    const createdDate = new Date(shop.createdAt).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="recent-item">
        <div class="recent-item-title">${this.escapeHtml(shop.name)}</div>
        <div class="recent-item-meta">
          <span>${createdDate}</span>
          ${shop.address ? `<span>${this.escapeHtml(shop.address.slice(0, 20))}${shop.address.length > 20 ? '...' : ''}</span>` : ''}
        </div>
      </div>
    `;
  }

  createRecentFlavorItem(flavor) {
    const createdDate = new Date(flavor.createdAt).toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });

    const relatedShop = flavor.shopId ? this.shops.find(shop => shop.id === flavor.shopId) : null;
    const stars = '★'.repeat(flavor.score) + '☆'.repeat(5 - flavor.score);

    return `
      <div class="recent-item">
        <div class="recent-item-title">${this.escapeHtml(flavor.name)}</div>
        <div class="recent-item-meta">
          <span>${createdDate}</span>
          <span class="recent-item-rating">${stars}</span>
        </div>
        ${relatedShop ? `
          <div style="font-size: 0.8rem; color: #6c757d; margin-top: 0.25rem;">
            📍 ${this.escapeHtml(relatedShop.name)}
          </div>
        ` : ''}
      </div>
    `;
  }

  createFeaturedFlavorItem(flavor) {
    const relatedShop = flavor.shopId ? this.shops.find(shop => shop.id === flavor.shopId) : null;
    const stars = '★'.repeat(flavor.score) + '☆'.repeat(5 - flavor.score);

    return `
      <a href="../flavor-edit.html?id=${flavor.id}" class="featured-item">
        <div class="featured-item-title">${this.escapeHtml(flavor.name)}</div>
        <div class="featured-item-rating">${stars}</div>
        ${relatedShop ? `
          <div class="featured-item-shop">📍 ${this.escapeHtml(relatedShop.name)}</div>
        ` : ''}
        <div class="featured-item-ingredients">
          ${flavor.flavors.slice(0, 3).map(ingredient => `
            <span class="featured-ingredient-tag">${this.escapeHtml(ingredient)}</span>
          `).join('')}
          ${flavor.flavors.length > 3 ? `
            <span class="featured-ingredient-tag">+${flavor.flavors.length - 3}</span>
          ` : ''}
        </div>
      </a>
    `;
  }

  checkEmptyState() {
    const hasData = this.shops.length > 0 || this.flavors.length > 0;
    
    if (!hasData) {
      this.elements.emptyState.classList.remove('d-none');
      // 他のセクションを非表示にする
      document.querySelector('.recent-data-container').style.display = 'none';
      document.querySelector('.featured-section').style.display = 'none';
    } else {
      this.elements.emptyState.classList.add('d-none');
      document.querySelector('.recent-data-container').style.display = 'grid';
      document.querySelector('.featured-section').style.display = 'block';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// アニメーション効果を追加
class AnimationController {
  constructor() {
    this.initializeAnimations();
  }

  initializeAnimations() {
    // カウントアップアニメーション
    this.animateCounters();
    
    // 要素の順次表示
    this.staggerAnimations();
  }

  animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
      const target = parseInt(counter.textContent) || 0;
      if (target === 0 || counter.textContent === '-') return;
      
      let current = 0;
      const increment = Math.max(1, Math.ceil(target / 30));
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        counter.textContent = current;
      }, 50);
    });
  }

  staggerAnimations() {
    // 統計カードの順次表示
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });

    // アクションカードの順次表示
    const actionCards = document.querySelectorAll('.action-card');
    actionCards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateX(-20px)';
      
      setTimeout(() => {
        card.style.transition = 'all 0.6s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateX(0)';
      }, 500 + index * 100);
    });
  }
}

// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
  const homeController = new HomeController();
  
  // データ読み込み完了後にアニメーションを開始
  setTimeout(() => {
    new AnimationController();
  }, 100);
});