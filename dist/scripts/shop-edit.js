import { getShop, addShop, updateShop, validateShopData } from './storage.js';
class ShopEditController {
    constructor() {
        this.shopId = null;
        this.isEditing = false;
        this.isDirty = false;
        this.autoSaveTimeout = null;
        this.initializeElements();
        this.parseUrlParams();
        this.initializeEventListeners();
        this.loadShopData();
        this.updateUI();
    }
    initializeElements() {
        this.form = document.getElementById('shop-form');
        this.elements = {
            // フォーム入力
            nameInput: document.getElementById('shop-name'),
            addressInput: document.getElementById('shop-address'),
            phoneInput: document.getElementById('shop-phone'),
            hoursInput: document.getElementById('shop-hours'),
            websiteInput: document.getElementById('shop-website'),
            memoInput: document.getElementById('shop-memo'),
            // エラー表示
            nameError: document.getElementById('name-error'),
            addressError: document.getElementById('address-error'),
            phoneError: document.getElementById('phone-error'),
            hoursError: document.getElementById('hours-error'),
            websiteError: document.getElementById('website-error'),
            memoError: document.getElementById('memo-error'),
            // 文字数カウント
            nameCount: document.getElementById('name-count'),
            addressCount: document.getElementById('address-count'),
            memoCount: document.getElementById('memo-count'),
            // プレビュー要素
            previewName: document.getElementById('preview-name'),
            previewAddress: document.getElementById('preview-address'),
            previewAddressText: document.getElementById('preview-address-text'),
            previewPhone: document.getElementById('preview-phone'),
            previewPhoneText: document.getElementById('preview-phone-text'),
            previewHours: document.getElementById('preview-hours'),
            previewHoursText: document.getElementById('preview-hours-text'),
            previewWebsite: document.getElementById('preview-website'),
            previewWebsiteText: document.getElementById('preview-website-text'),
            previewMemo: document.getElementById('preview-memo'),
            previewMemoText: document.getElementById('preview-memo-text'),
            // UI要素
            pageTitle: document.getElementById('page-title'),
            breadcrumbCurrent: document.getElementById('breadcrumb-current'),
            saveBtn: document.getElementById('save-btn'),
            cancelBtn: document.getElementById('cancel-btn'),
            submitText: document.getElementById('submit-text'),
            submitLoading: document.getElementById('submit-loading'),
            // メッセージ
            validationSummary: document.getElementById('validation-summary'),
            validationList: document.getElementById('validation-list'),
            successMessage: document.getElementById('success-message'),
            errorMessage: document.getElementById('error-message'),
            errorText: document.getElementById('error-text'),
            // 保存ステータス
            saveIndicator: document.getElementById('save-indicator'),
            saveStatus: document.getElementById('save-status'),
            saveLoading: document.getElementById('save-loading')
        };
    }
    parseUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        this.shopId = urlParams.get('id');
        this.isEditing = this.shopId !== null;
    }
    initializeEventListeners() {
        // フォーム送信
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        // 入力変更の監視
        const inputs = [
            this.elements.nameInput,
            this.elements.addressInput,
            this.elements.phoneInput,
            this.elements.hoursInput,
            this.elements.websiteInput,
            this.elements.memoInput
        ];
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.isDirty = true;
                this.updateCharacterCounts();
                this.updatePreview();
                this.clearFieldError(input);
                this.scheduleAutoSave();
            });
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
        });
        // ボタンイベント
        this.elements.cancelBtn.addEventListener('click', () => {
            this.handleCancel();
        });
        // ページ離脱時の確認
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '入力内容が保存されていません。ページを離れますか？';
            }
        });
    }
    loadShopData() {
        if (this.isEditing && this.shopId) {
            const shop = getShop(this.shopId);
            if (shop) {
                this.populateForm(shop);
                this.isDirty = false;
            }
            else {
                this.showError('指定された店舗が見つかりません。');
                setTimeout(() => {
                    window.location.href = '../pages/shop-list.html';
                }, 2000);
            }
        }
    }
    populateForm(shop) {
        this.elements.nameInput.value = shop.name;
        this.elements.addressInput.value = shop.address || '';
        this.elements.phoneInput.value = shop.phone || '';
        this.elements.hoursInput.value = shop.openingHours || '';
        this.elements.websiteInput.value = shop.website || '';
        this.elements.memoInput.value = shop.memo || '';
        this.updateCharacterCounts();
        this.updatePreview();
    }
    updateUI() {
        if (this.isEditing) {
            this.elements.pageTitle.textContent = '店舗情報の編集';
            this.elements.breadcrumbCurrent.textContent = '編集';
            this.elements.submitText.textContent = '更新';
        }
        else {
            this.elements.pageTitle.textContent = '新規店舗の追加';
            this.elements.breadcrumbCurrent.textContent = '新規店舗';
            this.elements.submitText.textContent = '保存';
        }
    }
    updateCharacterCounts() {
        this.updateCharacterCount('nameInput', 'nameCount', 100);
        this.updateCharacterCount('addressInput', 'addressCount', 500);
        this.updateCharacterCount('memoInput', 'memoCount', 1000);
    }
    updateCharacterCount(inputKey, countKey, maxLength) {
        const input = this.elements[inputKey];
        const counter = this.elements[countKey];
        if (input && counter) {
            const length = input.value.length;
            counter.textContent = length.toString();
            // 文字数による色分け
            const parent = counter.parentElement;
            if (parent) {
                parent.classList.remove('warning', 'danger');
                if (length >= maxLength * 0.9) {
                    parent.classList.add('danger');
                }
                else if (length >= maxLength * 0.8) {
                    parent.classList.add('warning');
                }
            }
        }
    }
    updatePreview() {
        const nameInput = this.elements.nameInput;
        const addressInput = this.elements.addressInput;
        const phoneInput = this.elements.phoneInput;
        const hoursInput = this.elements.hoursInput;
        const websiteInput = this.elements.websiteInput;
        const memoInput = this.elements.memoInput;
        // 店舗名
        const name = nameInput.value.trim();
        this.elements.previewName.textContent = name || '店舗名が入力されていません';
        // 住所
        this.togglePreviewItem('previewAddress', 'previewAddressText', addressInput.value.trim());
        // 電話番号
        this.togglePreviewItem('previewPhone', 'previewPhoneText', phoneInput.value.trim());
        // 営業時間
        this.togglePreviewItem('previewHours', 'previewHoursText', hoursInput.value.trim());
        // ウェブサイト
        const website = websiteInput.value.trim();
        if (website) {
            this.elements.previewWebsite.style.display = 'flex';
            const link = this.elements.previewWebsiteText;
            link.href = website;
            link.textContent = website;
        }
        else {
            this.elements.previewWebsite.style.display = 'none';
        }
        // メモ
        this.togglePreviewItem('previewMemo', 'previewMemoText', memoInput.value.trim());
    }
    togglePreviewItem(containerKey, textKey, value) {
        const container = this.elements[containerKey];
        const text = this.elements[textKey];
        if (value) {
            container.style.display = 'flex';
            text.textContent = value;
        }
        else {
            container.style.display = 'none';
        }
    }
    validateField(input) {
        const fieldName = input.name;
        const value = input.value.trim();
        // 個別フィールドのバリデーション
        const shopData = { [fieldName]: value };
        const validation = validateShopData(shopData);
        const errorElement = this.elements[`${fieldName}Error`];
        if (errorElement) {
            const fieldErrors = validation.errors.filter(error => error.includes(this.getFieldDisplayName(fieldName)));
            if (fieldErrors.length > 0) {
                this.showFieldError(input, fieldErrors[0]);
                return false;
            }
            else {
                this.clearFieldError(input);
                return true;
            }
        }
        return true;
    }
    getFieldDisplayName(fieldName) {
        const displayNames = {
            name: '店舗名',
            address: '住所',
            phone: '電話番号',
            openingHours: '営業時間',
            website: 'ウェブサイト',
            memo: 'メモ'
        };
        return displayNames[fieldName] || fieldName;
    }
    showFieldError(input, message) {
        input.classList.add('is-invalid');
        const errorElement = this.elements[`${input.name}Error`];
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
    clearFieldError(input) {
        input.classList.remove('is-invalid');
        const errorElement = this.elements[`${input.name}Error`];
        if (errorElement) {
            errorElement.textContent = '';
        }
    }
    validateForm() {
        const formData = this.getFormData();
        return validateShopData(formData);
    }
    getFormData() {
        const nameValue = this.elements.nameInput.value.trim();
        const addressValue = this.elements.addressInput.value.trim();
        const phoneValue = this.elements.phoneInput.value.trim();
        const hoursValue = this.elements.hoursInput.value.trim();
        const websiteValue = this.elements.websiteInput.value.trim();
        const memoValue = this.elements.memoInput.value.trim();
        const data = {
            name: nameValue
        };
        if (addressValue)
            data.address = addressValue;
        if (phoneValue)
            data.phone = phoneValue;
        if (hoursValue)
            data.openingHours = hoursValue;
        if (websiteValue)
            data.website = websiteValue;
        if (memoValue)
            data.memo = memoValue;
        return data;
    }
    async handleSubmit() {
        this.hideMessages();
        this.setSubmitLoading(true);
        try {
            const validation = this.validateForm();
            if (!validation.isValid) {
                this.showValidationErrors(validation.errors);
                return;
            }
            const formData = this.getFormData();
            if (this.isEditing && this.shopId) {
                const updatedShop = updateShop(this.shopId, formData);
                if (updatedShop) {
                    this.showSuccess('店舗情報を更新しました。');
                    this.isDirty = false;
                    setTimeout(() => {
                        window.location.href = `../pages/shop-detail.html?id=${this.shopId}`;
                    }, 1500);
                }
                else {
                    this.showError('店舗の更新に失敗しました。');
                }
            }
            else {
                const newShop = addShop(formData);
                this.showSuccess('新しい店舗を追加しました。');
                this.isDirty = false;
                setTimeout(() => {
                    window.location.href = `../pages/shop-detail.html?id=${newShop.id}`;
                }, 1500);
            }
        }
        catch (error) {
            console.error('保存エラー:', error);
            this.showError('保存中にエラーが発生しました。');
        }
        finally {
            this.setSubmitLoading(false);
        }
    }
    handleCancel() {
        if (this.isDirty) {
            const confirmed = confirm('入力内容が保存されていません。キャンセルしますか？');
            if (!confirmed)
                return;
        }
        if (this.isEditing && this.shopId) {
            window.location.href = `../pages/shop-detail.html?id=${this.shopId}`;
        }
        else {
            window.location.href = '../pages/shop-list.html';
        }
    }
    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        this.autoSaveTimeout = window.setTimeout(() => {
            this.performAutoSave();
        }, 3000); // 3秒後に自動保存
    }
    performAutoSave() {
        if (!this.isDirty)
            return;
        const validation = this.validateForm();
        if (validation.isValid) {
            this.setSaveStatus('saving', '自動保存中...');
            setTimeout(() => {
                this.setSaveStatus('saved', '自動保存済み');
                setTimeout(() => {
                    this.setSaveStatus('', '');
                }, 2000);
            }, 500);
        }
    }
    setSaveStatus(type, message) {
        const indicator = this.elements.saveIndicator;
        const status = this.elements.saveStatus;
        const loading = this.elements.saveLoading;
        if (indicator && status && loading) {
            // クラスをリセット
            indicator.classList.remove('saving', 'saved', 'error');
            if (type) {
                indicator.classList.add(type);
                status.textContent = message;
                if (type === 'saving') {
                    loading.classList.remove('d-none');
                }
                else {
                    loading.classList.add('d-none');
                }
            }
            else {
                status.textContent = '';
                loading.classList.add('d-none');
            }
        }
    }
    setSubmitLoading(loading) {
        this.elements.saveBtn.disabled = loading;
        if (loading) {
            this.elements.submitLoading?.classList.remove('d-none');
        }
        else {
            this.elements.submitLoading?.classList.add('d-none');
        }
    }
    hideMessages() {
        this.elements.validationSummary?.classList.add('d-none');
        this.elements.successMessage?.classList.add('d-none');
        this.elements.errorMessage?.classList.add('d-none');
    }
    showValidationErrors(errors) {
        const summary = this.elements.validationSummary;
        const list = this.elements.validationList;
        if (summary && list) {
            list.innerHTML = '';
            errors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                list.appendChild(li);
            });
            summary.classList.remove('d-none');
        }
    }
    showSuccess(message) {
        const successElement = this.elements.successMessage;
        if (successElement) {
            successElement.textContent = message;
            successElement.classList.remove('d-none');
            successElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    showError(message) {
        const errorElement = this.elements.errorMessage;
        const errorText = this.elements.errorText;
        if (errorElement && errorText) {
            errorText.textContent = message;
            errorElement.classList.remove('d-none');
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
}
// ページ読み込み時に初期化
document.addEventListener('DOMContentLoaded', () => {
    new ShopEditController();
});
//# sourceMappingURL=shop-edit.js.map