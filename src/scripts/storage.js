const STORAGE_KEYS = {
  SHOPS: 'shisha_shops',
  FLAVORS: 'shisha_flavors',
  SETTINGS: 'shisha_settings'
};

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  STORAGE_FULL: 'STORAGE_FULL',
  INVALID_DATA: 'INVALID_DATA',
  MIGRATION_FAILED: 'MIGRATION_FAILED'
};

function generateId() {
  return crypto.randomUUID();
}

function parseDate(dateStr) {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
}

function parseStoredData(key, defaultValue) {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Error parsing stored data for key ${key}:`, error);
    return defaultValue;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error(ERROR_CODES.STORAGE_FULL);
    }
    throw new Error(ERROR_CODES.INVALID_DATA);
  }
}

function getShops() {
  const shops = parseStoredData(STORAGE_KEYS.SHOPS, []);
  return shops.map(shop => ({
    ...shop,
    createdAt: parseDate(shop.createdAt),
    updatedAt: parseDate(shop.updatedAt)
  }));
}

function getShop(id) {
  const shops = getShops();
  return shops.find(shop => shop.id === id) || null;
}

function addShop(shopData) {
  const now = new Date();
  const newShop = {
    id: generateId(),
    ...shopData,
    createdAt: now,
    updatedAt: now
  };

  const shops = getShops();
  shops.push(newShop);
  saveToStorage(STORAGE_KEYS.SHOPS, shops);
  return newShop;
}

function updateShop(id, updates) {
  const shops = getShops();
  const index = shops.findIndex(shop => shop.id === id);
  
  if (index === -1) return null;
  
  const updatedShop = {
    ...shops[index],
    ...updates,
    updatedAt: new Date()
  };
  
  shops[index] = updatedShop;
  saveToStorage(STORAGE_KEYS.SHOPS, shops);
  return updatedShop;
}

function deleteShop(id) {
  const shops = getShops();
  const index = shops.findIndex(shop => shop.id === id);
  
  if (index === -1) return false;
  
  shops.splice(index, 1);
  saveToStorage(STORAGE_KEYS.SHOPS, shops);
  return true;
}

function getFlavors() {
  const flavors = parseStoredData(STORAGE_KEYS.FLAVORS, []);
  return flavors.map(flavor => ({
    ...flavor,
    createdAt: parseDate(flavor.createdAt),
    updatedAt: parseDate(flavor.updatedAt),
    smokedAt: flavor.smokedAt ? parseDate(flavor.smokedAt) : undefined
  }));
}

function getFlavor(id) {
  const flavors = getFlavors();
  return flavors.find(flavor => flavor.id === id) || null;
}

function addFlavor(flavorData) {
  const now = new Date();
  const newFlavor = {
    id: generateId(),
    ...flavorData,
    createdAt: now,
    updatedAt: now
  };

  const flavors = getFlavors();
  flavors.push(newFlavor);
  saveToStorage(STORAGE_KEYS.FLAVORS, flavors);
  return newFlavor;
}

function updateFlavor(id, updates) {
  const flavors = getFlavors();
  const index = flavors.findIndex(flavor => flavor.id === id);
  
  if (index === -1) return null;
  
  const updatedFlavor = {
    ...flavors[index],
    ...updates,
    updatedAt: new Date()
  };
  
  flavors[index] = updatedFlavor;
  saveToStorage(STORAGE_KEYS.FLAVORS, flavors);
  return updatedFlavor;
}

function deleteFlavor(id) {
  const flavors = getFlavors();
  const index = flavors.findIndex(flavor => flavor.id === id);
  
  if (index === -1) return false;
  
  flavors.splice(index, 1);
  saveToStorage(STORAGE_KEYS.FLAVORS, flavors);
  return true;
}

function getSettings() {
  return parseStoredData(STORAGE_KEYS.SETTINGS, {
    theme: 'light',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    itemsPerPage: 10
  });
}

function updateSettings(updates) {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...updates };
  saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

function searchShops(query) {
  if (!query.trim()) return getShops();
  
  const shops = getShops();
  const lowerQuery = query.toLowerCase();
  
  return shops.filter(shop =>
    shop.name.toLowerCase().includes(lowerQuery) ||
    (shop.address && shop.address.toLowerCase().includes(lowerQuery)) ||
    (shop.memo && shop.memo.toLowerCase().includes(lowerQuery))
  );
}

function searchFlavors(query) {
  if (!query.trim()) return getFlavors();
  
  const flavors = getFlavors();
  const lowerQuery = query.toLowerCase();
  
  return flavors.filter(flavor =>
    flavor.name.toLowerCase().includes(lowerQuery) ||
    flavor.flavors.some(f => f.toLowerCase().includes(lowerQuery)) ||
    (flavor.memo && flavor.memo.toLowerCase().includes(lowerQuery)) ||
    (flavor.tags && flavor.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
  );
}

function filterFlavorsByScore(minScore, maxScore = 5) {
  const flavors = getFlavors();
  return flavors.filter(flavor => flavor.score >= minScore && flavor.score <= maxScore);
}

function filterFlavorsByShop(shopId) {
  const flavors = getFlavors();
  return flavors.filter(flavor => flavor.shopId === shopId);
}

function sortFlavors(flavors, sortBy, order) {
  return [...flavors].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (aValue === bValue) return 0;
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1;
    if (bValue == null) return -1;
    
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    
    return order === 'desc' ? -comparison : comparison;
  });
}

function validateShopData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('店舗名は必須です');
  } else if (data.name.length > 100) {
    errors.push('店舗名は100文字以内で入力してください');
  }
  
  if (data.phone && !/^[\d-+().\s]+$/.test(data.phone)) {
    errors.push('電話番号の形式が正しくありません');
  }
  
  if (data.website && !/^https?:\/\/.+/.test(data.website)) {
    errors.push('ウェブサイトは有効なURLを入力してください');
  }
  
  if (data.address && data.address.length > 500) {
    errors.push('住所は500文字以内で入力してください');
  }
  
  if (data.memo && data.memo.length > 1000) {
    errors.push('メモは1000文字以内で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function validateFlavorData(data) {
  const errors = [];
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('フレーバー名は必須です');
  } else if (data.name.length > 100) {
    errors.push('フレーバー名は100文字以内で入力してください');
  }
  
  if (!data.flavors || !Array.isArray(data.flavors) || data.flavors.length === 0) {
    errors.push('フレーバーの組み合わせは1つ以上入力してください');
  } else if (data.flavors.some(flavor => !flavor || flavor.trim().length === 0)) {
    errors.push('フレーバーの組み合わせに空の項目があります');
  }
  
  if (!data.score || ![1, 2, 3, 4, 5].includes(Number(data.score))) {
    errors.push('評価は1-5の値を選択してください');
  }
  
  if (data.shopId && typeof data.shopId !== 'string') {
    errors.push('関連店舗の形式が正しくありません');
  }
  
  if (data.memo && data.memo.length > 1000) {
    errors.push('メモは1000文字以内で入力してください');
  }
  
  if (data.tags && Array.isArray(data.tags)) {
    if (data.tags.some(tag => !tag || tag.trim().length === 0)) {
      errors.push('タグに空の項目があります');
    }
    if (data.tags.some(tag => tag.length > 50)) {
      errors.push('各タグは50文字以内で入力してください');
    }
  }
  
  if (data.smokedAt && !(data.smokedAt instanceof Date) && isNaN(Date.parse(data.smokedAt))) {
    errors.push('喫煙日時の形式が正しくありません');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

function backupData() {
  const data = {
    shops: getShops(),
    flavors: getFlavors(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return JSON.stringify(data, null, 2);
}

function restoreData(backup) {
  try {
    const data = JSON.parse(backup);
    
    if (data.shops) saveToStorage(STORAGE_KEYS.SHOPS, data.shops);
    if (data.flavors) saveToStorage(STORAGE_KEYS.FLAVORS, data.flavors);
    if (data.settings) saveToStorage(STORAGE_KEYS.SETTINGS, data.settings);
    
    return true;
  } catch (error) {
    console.error('Failed to restore backup:', error);
    return false;
  }
}