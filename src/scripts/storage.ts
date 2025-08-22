import { Shop, Flavor, Settings, ERROR_CODES, ValidationResult } from '../types/index.js';

const STORAGE_KEYS = {
  SHOPS: 'shisha_shops',
  FLAVORS: 'shisha_flavors',
  SETTINGS: 'shisha_settings'
} as const;

function generateId(): string {
  return crypto.randomUUID();
}

function parseDate(dateStr: string): Date {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
}

function parseStoredData<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored);
  } catch (error) {
    console.error(`Error parsing stored data for key ${key}:`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): boolean {
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

export function getShops(): Shop[] {
  const shops = parseStoredData<Shop[]>(STORAGE_KEYS.SHOPS, []);
  return shops.map(shop => ({
    ...shop,
    createdAt: parseDate(shop.createdAt as unknown as string),
    updatedAt: parseDate(shop.updatedAt as unknown as string)
  }));
}

export function getShop(id: string): Shop | null {
  const shops = getShops();
  return shops.find(shop => shop.id === id) || null;
}

export function addShop(shopData: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Shop {
  const now = new Date();
  const newShop: Shop = {
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

export function updateShop(id: string, updates: Partial<Shop>): Shop | null {
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

export function deleteShop(id: string): boolean {
  const shops = getShops();
  const index = shops.findIndex(shop => shop.id === id);
  
  if (index === -1) return false;
  
  shops.splice(index, 1);
  saveToStorage(STORAGE_KEYS.SHOPS, shops);
  return true;
}

export function getFlavors(): Flavor[] {
  const flavors = parseStoredData<Flavor[]>(STORAGE_KEYS.FLAVORS, []);
  return flavors.map(flavor => ({
    ...flavor,
    createdAt: parseDate(flavor.createdAt as unknown as string),
    updatedAt: parseDate(flavor.updatedAt as unknown as string),
    smokedAt: flavor.smokedAt ? parseDate(flavor.smokedAt as unknown as string) : undefined
  })) as Flavor[];
}

export function getFlavor(id: string): Flavor | null {
  const flavors = getFlavors();
  return flavors.find(flavor => flavor.id === id) || null;
}

export function addFlavor(flavorData: Omit<Flavor, 'id' | 'createdAt' | 'updatedAt'>): Flavor {
  const now = new Date();
  const newFlavor: Flavor = {
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

export function updateFlavor(id: string, updates: Partial<Flavor>): Flavor | null {
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

export function deleteFlavor(id: string): boolean {
  const flavors = getFlavors();
  const index = flavors.findIndex(flavor => flavor.id === id);
  
  if (index === -1) return false;
  
  flavors.splice(index, 1);
  saveToStorage(STORAGE_KEYS.FLAVORS, flavors);
  return true;
}

export function getSettings(): Settings {
  return parseStoredData<Settings>(STORAGE_KEYS.SETTINGS, {
    theme: 'light',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    itemsPerPage: 10
  });
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const currentSettings = getSettings();
  const newSettings = { ...currentSettings, ...updates };
  saveToStorage(STORAGE_KEYS.SETTINGS, newSettings);
  return newSettings;
}

export function searchShops(query: string): Shop[] {
  if (!query.trim()) return getShops();
  
  const shops = getShops();
  const lowerQuery = query.toLowerCase();
  
  return shops.filter(shop =>
    shop.name.toLowerCase().includes(lowerQuery) ||
    (shop.address && shop.address.toLowerCase().includes(lowerQuery)) ||
    (shop.memo && shop.memo.toLowerCase().includes(lowerQuery))
  );
}

export function searchFlavors(query: string): Flavor[] {
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

export function filterFlavorsByScore(minScore: number, maxScore: number = 5): Flavor[] {
  const flavors = getFlavors();
  return flavors.filter(flavor => flavor.score >= minScore && flavor.score <= maxScore);
}

export function filterFlavorsByShop(shopId: string): Flavor[] {
  const flavors = getFlavors();
  return flavors.filter(flavor => flavor.shopId === shopId);
}

export function sortFlavors(flavors: Flavor[], sortBy: keyof Flavor, order: 'asc' | 'desc'): Flavor[] {
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

export function validateShopData(data: Partial<Shop>): ValidationResult {
  const errors: string[] = [];
  
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

export function backupData(): string {
  const data = {
    shops: getShops(),
    flavors: getFlavors(),
    settings: getSettings(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return JSON.stringify(data, null, 2);
}

export function restoreData(backup: string): boolean {
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