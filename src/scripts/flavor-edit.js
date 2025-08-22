document.addEventListener('DOMContentLoaded', function() {
  // URL パラメータから ID を取得
  const urlParams = new URLSearchParams(window.location.search);
  const flavorId = urlParams.get('id');
  const isEdit = !!flavorId;

  // DOM 要素の取得
  const form = document.getElementById('flavor-form');
  const pageTitle = document.getElementById('page-title');
  const breadcrumbCurrent = document.getElementById('breadcrumb-current');
  const submitText = document.getElementById('submit-text');
  const cancelBtn = document.getElementById('cancel-btn');
  const saveBtn = document.getElementById('save-btn');
  const submitLoading = document.getElementById('submit-loading');

  // フォーム要素
  const nameInput = document.getElementById('flavor-name');
  const ingredientsInput = document.getElementById('flavor-ingredients');
  const addIngredientBtn = document.getElementById('add-ingredient-btn');
  const ingredientsTags = document.getElementById('ingredients-tags');
  const ratingStars = document.querySelectorAll('.rating-star');
  const ratingText = document.getElementById('rating-text');
  const scoreInput = document.getElementById('score-input');
  const shopSelect = document.getElementById('shop-select');
  const smokedAtInput = document.getElementById('smoked-at');
  const memoInput = document.getElementById('flavor-memo');
  const tagsInput = document.getElementById('flavor-tags');
  const addTagBtn = document.getElementById('add-tag-btn');
  const tagsContainer = document.getElementById('tags-container');

  // エラー表示要素
  const validationSummary = document.getElementById('validation-summary');
  const validationList = document.getElementById('validation-list');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');

  // プレビュー要素
  const previewName = document.getElementById('preview-name');
  const previewRating = document.getElementById('preview-rating');
  const previewStars = previewRating.querySelector('.preview-stars');
  const previewScore = previewRating.querySelector('.preview-score');
  const previewIngredients = document.getElementById('preview-ingredients');
  const previewIngredientsTagsContainer = document.getElementById('preview-ingredients-tags');
  const previewShop = document.getElementById('preview-shop');
  const previewShopText = document.getElementById('preview-shop-text');
  const previewSmokedAt = document.getElementById('preview-smoked-at');
  const previewSmokedAtText = document.getElementById('preview-smoked-at-text');
  const previewMemo = document.getElementById('preview-memo');
  const previewMemoText = document.getElementById('preview-memo-text');
  const previewTags = document.getElementById('preview-tags');
  const previewTagsContainer = document.getElementById('preview-tags-container');

  // 文字数カウント要素
  const nameCount = document.getElementById('name-count');
  const memoCount = document.getElementById('memo-count');

  // データ格納用変数
  let currentFlavor = null;
  let flavorIngredients = [];
  let flavorTags = [];
  let currentScore = 0;
  let shops = [];

  // 初期化
  init();

  function init() {
    loadShops();
    
    if (isEdit) {
      loadFlavor();
      pageTitle.textContent = 'フレーバーの編集';
      breadcrumbCurrent.textContent = 'フレーバー編集';
      submitText.textContent = '更新';
    }

    setupEventListeners();
    updatePreview();
  }

  function loadShops() {
    shops = getShops();
    shopSelect.innerHTML = '<option value="">店舗を選択してください</option>';
    
    shops.forEach(shop => {
      const option = document.createElement('option');
      option.value = shop.id;
      option.textContent = shop.name;
      shopSelect.appendChild(option);
    });
  }

  function loadFlavor() {
    currentFlavor = getFlavor(flavorId);
    if (!currentFlavor) {
      showError('指定されたフレーバーが見つかりません。');
      return;
    }

    // フォームに値を設定
    nameInput.value = currentFlavor.name || '';
    flavorIngredients = [...(currentFlavor.flavors || [])];
    currentScore = currentFlavor.score || 0;
    scoreInput.value = currentScore;
    shopSelect.value = currentFlavor.shopId || '';
    memoInput.value = currentFlavor.memo || '';
    flavorTags = [...(currentFlavor.tags || [])];
    
    if (currentFlavor.smokedAt) {
      const smokedAtDate = new Date(currentFlavor.smokedAt);
      if (!isNaN(smokedAtDate.getTime())) {
        const year = smokedAtDate.getFullYear();
        const month = String(smokedAtDate.getMonth() + 1).padStart(2, '0');
        const day = String(smokedAtDate.getDate()).padStart(2, '0');
        const hours = String(smokedAtDate.getHours()).padStart(2, '0');
        const minutes = String(smokedAtDate.getMinutes()).padStart(2, '0');
        smokedAtInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }

    // UI を更新
    renderIngredients();
    renderTags();
    updateRating();
    updateCharacterCounts();
  }

  function setupEventListeners() {
    // フォーム送信
    form.addEventListener('submit', handleSubmit);

    // キャンセル
    cancelBtn.addEventListener('click', () => {
      window.location.href = '../pages/flavor-list.html';
    });

    // フレーバー組み合わせの追加
    addIngredientBtn.addEventListener('click', addIngredient);
    ingredientsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addIngredient();
      }
    });

    // タグの追加
    addTagBtn.addEventListener('click', addTag);
    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTag();
      }
    });

    // 星評価
    ratingStars.forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        setRating(value);
      });
      
      star.addEventListener('mouseenter', () => {
        const value = parseInt(star.dataset.value);
        highlightStars(value);
      });
    });

    document.getElementById('rating-container').addEventListener('mouseleave', () => {
      highlightStars(currentScore);
    });

    // リアルタイムプレビュー更新
    nameInput.addEventListener('input', updatePreview);
    shopSelect.addEventListener('change', updatePreview);
    smokedAtInput.addEventListener('change', updatePreview);
    memoInput.addEventListener('input', updatePreview);

    // 文字数カウント
    nameInput.addEventListener('input', updateCharacterCounts);
    memoInput.addEventListener('input', updateCharacterCounts);

    // バリデーション
    nameInput.addEventListener('blur', validateName);
    memoInput.addEventListener('blur', validateMemo);
  }

  function addIngredient() {
    const value = ingredientsInput.value.trim();
    if (value && !flavorIngredients.includes(value)) {
      flavorIngredients.push(value);
      ingredientsInput.value = '';
      renderIngredients();
      updatePreview();
      clearFieldError('flavors-error');
    }
  }

  function removeIngredient(ingredient) {
    const index = flavorIngredients.indexOf(ingredient);
    if (index > -1) {
      flavorIngredients.splice(index, 1);
      renderIngredients();
      updatePreview();
    }
  }

  function renderIngredients() {
    ingredientsTags.innerHTML = '';
    flavorIngredients.forEach(ingredient => {
      const tag = createTagElement(ingredient, () => removeIngredient(ingredient));
      ingredientsTags.appendChild(tag);
    });
  }

  function addTag() {
    const value = tagsInput.value.trim();
    if (value && !flavorTags.includes(value)) {
      flavorTags.push(value);
      tagsInput.value = '';
      renderTags();
      updatePreview();
      clearFieldError('tags-error');
    }
  }

  function removeTag(tag) {
    const index = flavorTags.indexOf(tag);
    if (index > -1) {
      flavorTags.splice(index, 1);
      renderTags();
      updatePreview();
    }
  }

  function renderTags() {
    tagsContainer.innerHTML = '';
    flavorTags.forEach(tag => {
      const tagElement = createTagElement(tag, () => removeTag(tag));
      tagsContainer.appendChild(tagElement);
    });
  }

  function createTagElement(text, onRemove) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.innerHTML = `
      <span>${escapeHtml(text)}</span>
      <button type="button" class="tag-remove" title="削除">×</button>
    `;
    
    tag.querySelector('.tag-remove').addEventListener('click', onRemove);
    return tag;
  }

  function setRating(value) {
    currentScore = value;
    scoreInput.value = value;
    updateRating();
    updatePreview();
    clearFieldError('score-error');
  }

  function updateRating() {
    highlightStars(currentScore);
    if (currentScore > 0) {
      ratingText.textContent = `${currentScore}点`;
    } else {
      ratingText.textContent = '評価を選択してください';
    }
  }

  function highlightStars(count) {
    ratingStars.forEach((star, index) => {
      star.classList.toggle('active', index < count);
    });
  }

  function updateCharacterCounts() {
    nameCount.textContent = nameInput.value.length;
    memoCount.textContent = memoInput.value.length;
  }

  function updatePreview() {
    // フレーバー名
    const name = nameInput.value.trim();
    previewName.textContent = name || 'フレーバー名が入力されていません';

    // 評価
    if (currentScore > 0) {
      previewStars.textContent = '★'.repeat(currentScore) + '☆'.repeat(5 - currentScore);
      previewScore.textContent = `${currentScore}点`;
    } else {
      previewStars.textContent = '☆☆☆☆☆';
      previewScore.textContent = '未評価';
    }

    // フレーバー組み合わせ
    if (flavorIngredients.length > 0) {
      previewIngredients.style.display = 'block';
      previewIngredientsTagsContainer.innerHTML = '';
      flavorIngredients.forEach(ingredient => {
        const tag = document.createElement('div');
        tag.className = 'preview-tag';
        tag.textContent = ingredient;
        previewIngredientsTagsContainer.appendChild(tag);
      });
    } else {
      previewIngredients.style.display = 'none';
    }

    // 関連店舗
    const selectedShop = shops.find(shop => shop.id === shopSelect.value);
    if (selectedShop) {
      previewShop.style.display = 'block';
      previewShopText.textContent = selectedShop.name;
    } else {
      previewShop.style.display = 'none';
    }

    // 喫煙日時
    if (smokedAtInput.value) {
      previewSmokedAt.style.display = 'block';
      const date = new Date(smokedAtInput.value);
      previewSmokedAtText.textContent = date.toLocaleString('ja-JP');
    } else {
      previewSmokedAt.style.display = 'none';
    }

    // メモ
    const memo = memoInput.value.trim();
    if (memo) {
      previewMemo.style.display = 'block';
      previewMemoText.textContent = memo;
    } else {
      previewMemo.style.display = 'none';
    }

    // タグ
    if (flavorTags.length > 0) {
      previewTags.style.display = 'block';
      previewTagsContainer.innerHTML = '';
      flavorTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'preview-tag';
        tagElement.textContent = tag;
        previewTagsContainer.appendChild(tagElement);
      });
    } else {
      previewTags.style.display = 'none';
    }
  }

  function validateName() {
    const name = nameInput.value.trim();
    if (!name) {
      showFieldError('name-error', 'フレーバー名は必須です');
      return false;
    }
    if (name.length > 100) {
      showFieldError('name-error', 'フレーバー名は100文字以内で入力してください');
      return false;
    }
    clearFieldError('name-error');
    return true;
  }

  function validateMemo() {
    const memo = memoInput.value.trim();
    if (memo.length > 1000) {
      showFieldError('memo-error', 'メモは1000文字以内で入力してください');
      return false;
    }
    clearFieldError('memo-error');
    return true;
  }

  function validateForm() {
    let isValid = true;
    const errors = [];

    // 名前
    if (!validateName()) {
      isValid = false;
      errors.push('フレーバー名を正しく入力してください');
    }

    // フレーバー組み合わせ
    if (flavorIngredients.length === 0) {
      isValid = false;
      errors.push('フレーバーの組み合わせを1つ以上追加してください');
      showFieldError('flavors-error', 'フレーバーの組み合わせは必須です');
    } else {
      clearFieldError('flavors-error');
    }

    // 評価
    if (currentScore === 0) {
      isValid = false;
      errors.push('評価を選択してください');
      showFieldError('score-error', '評価は必須です');
    } else {
      clearFieldError('score-error');
    }

    // メモ
    if (!validateMemo()) {
      isValid = false;
      errors.push('メモを正しく入力してください');
    }

    // バリデーションサマリー表示
    if (errors.length > 0) {
      showValidationSummary(errors);
    } else {
      hideValidationSummary();
    }

    return isValid;
  }

  function showFieldError(errorId, message) {
    const errorElement = document.getElementById(errorId);
    const inputElement = errorElement.parentElement.querySelector('.form-control');
    
    errorElement.textContent = message;
    inputElement.classList.add('is-invalid');
  }

  function clearFieldError(errorId) {
    const errorElement = document.getElementById(errorId);
    const inputElement = errorElement.parentElement.querySelector('.form-control');
    
    errorElement.textContent = '';
    if (inputElement) {
      inputElement.classList.remove('is-invalid');
    }
  }

  function showValidationSummary(errors) {
    validationList.innerHTML = '';
    errors.forEach(error => {
      const li = document.createElement('li');
      li.textContent = error;
      validationList.appendChild(li);
    });
    validationSummary.classList.remove('d-none');
    validationSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideValidationSummary() {
    validationSummary.classList.add('d-none');
  }

  function showSuccess(message) {
    const messageText = successMessage.querySelector('span') || successMessage;
    messageText.textContent = message;
    successMessage.classList.remove('d-none');
    errorMessage.classList.add('d-none');
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('d-none');
    successMessage.classList.add('d-none');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function hideMessages() {
    successMessage.classList.add('d-none');
    errorMessage.classList.add('d-none');
    hideValidationSummary();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    hideMessages();

    if (!validateForm()) {
      return;
    }

    // ローディング状態
    saveBtn.disabled = true;
    submitLoading.classList.remove('d-none');

    try {
      const formData = {
        name: nameInput.value.trim(),
        flavors: [...flavorIngredients],
        score: currentScore,
        shopId: shopSelect.value || undefined,
        memo: memoInput.value.trim() || undefined,
        tags: flavorTags.length > 0 ? [...flavorTags] : undefined,
        smokedAt: smokedAtInput.value ? new Date(smokedAtInput.value) : undefined
      };

      // バリデーション
      const validation = validateFlavorData(formData);
      if (!validation.isValid) {
        showValidationSummary(validation.errors);
        return;
      }

      let savedFlavor;
      if (isEdit) {
        savedFlavor = updateFlavor(flavorId, formData);
        if (!savedFlavor) {
          showError('フレーバーの更新に失敗しました。');
          return;
        }
      } else {
        savedFlavor = addFlavor(formData);
      }

      showSuccess(`フレーバー「${savedFlavor.name}」を${isEdit ? '更新' : '保存'}しました。`);

      // 3秒後にフレーバー詳細画面に遷移
      setTimeout(() => {
        window.location.href = `../pages/flavor-detail.html?id=${savedFlavor.id}`;
      }, 2000);

    } catch (error) {
      console.error('保存エラー:', error);
      showError('保存中にエラーが発生しました。');
    } finally {
      saveBtn.disabled = false;
      submitLoading.classList.add('d-none');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});