# データモデル設計書

## 1. データストレージ概要

### ストレージ方式
- **localStorage**: ブラウザのローカルストレージ
- **形式**: JSON文字列
- **キー命名規則**: `shisha_` プレフィックスを使用

## 2. localStorageキー設計

| キー名 | 説明 | データ型 |
|--------|------|----------|
| `shisha_shops` | 店舗データの配列 | Array&lt;Shop&gt; |
| `shisha_flavors` | フレーバーデータの配列 | Array&lt;Flavor&gt; |
| `shisha_settings` | アプリケーション設定 | Settings |

## 3. データ型定義

### 3.1 Shop（店舗）型

```typescript
interface Shop {
  id: string;              // ユニークID（UUID v4）
  name: string;            // 店舗名（必須）
  address?: string;        // 住所（任意）
  phone?: string;          // 電話番号（任意）
  openingHours?: string;   // 営業時間（任意）
  website?: string;        // ウェブサイトURL（任意）
  memo?: string;           // メモ（任意）
  createdAt: Date;         // 作成日時
  updatedAt: Date;         // 更新日時
}
```

#### Shopデータ例
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "シーシャカフェ 渋谷店",
  "address": "東京都渋谷区渋谷1-1-1",
  "phone": "03-1234-5678",
  "openingHours": "12:00-24:00",
  "website": "https://example.com",
  "memo": "おしゃれな内装で落ち着く雰囲気",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### 3.2 Flavor（フレーバー）型

```typescript
interface Flavor {
  id: string;                    // ユニークID（UUID v4）
  name: string;                  // フレーバー名（必須）
  flavors: string[];             // フレーバーの組み合わせ（配列）
  shopId?: string;               // 関連店舗ID（任意）
  score: number;                 // 評価（1-5の整数）
  memo?: string;                 // メモ（任意）
  tags?: string[];               // タグ（任意、検索用）
  smokedAt?: Date;               // 喫煙日時（任意）
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
}
```

#### Flavorデータ例
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "ダブルアップル×ミント",
  "flavors": ["ダブルアップル", "ミント"],
  "shopId": "550e8400-e29b-41d4-a716-446655440000",
  "score": 4,
  "memo": "爽やかで吸いやすい。リラックスできる味",
  "tags": ["フルーツ", "爽やか", "初心者向け"],
  "smokedAt": "2024-01-15T19:00:00.000Z",
  "createdAt": "2024-01-15T20:00:00.000Z",
  "updatedAt": "2024-01-15T20:00:00.000Z"
}
```

### 3.3 Settings（設定）型

```typescript
interface Settings {
  theme: 'light' | 'dark';       // テーマ設定
  sortBy: 'createdAt' | 'updatedAt' | 'score' | 'name'; // デフォルトソート
  sortOrder: 'asc' | 'desc';     // ソート順
  itemsPerPage: number;          // ページあたりの表示件数
  lastBackup?: Date;             // 最後のバックアップ日時
}
```

#### Settingsデータ例
```json
{
  "theme": "light",
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "itemsPerPage": 10,
  "lastBackup": "2024-01-10T12:00:00.000Z"
}
```

## 4. データ操作関数設計

### 4.1 基本CRUD操作

```typescript
// 店舗操作
function getShops(): Shop[]
function getShop(id: string): Shop | null
function addShop(shop: Omit<Shop, 'id' | 'createdAt' | 'updatedAt'>): Shop
function updateShop(id: string, updates: Partial<Shop>): Shop | null
function deleteShop(id: string): boolean

// フレーバー操作
function getFlavors(): Flavor[]
function getFlavor(id: string): Flavor | null
function addFlavor(flavor: Omit<Flavor, 'id' | 'createdAt' | 'updatedAt'>): Flavor
function updateFlavor(id: string, updates: Partial<Flavor>): Flavor | null
function deleteFlavor(id: string): boolean

// 設定操作
function getSettings(): Settings
function updateSettings(updates: Partial<Settings>): Settings
```

### 4.2 検索・フィルタリング関数

```typescript
// 店舗検索
function searchShops(query: string): Shop[]
function filterShopsByName(name: string): Shop[]

// フレーバー検索・フィルタリング
function searchFlavors(query: string): Flavor[]
function filterFlavorsByScore(minScore: number, maxScore?: number): Flavor[]
function filterFlavorsByShop(shopId: string): Flavor[]
function filterFlavorsByTag(tag: string): Flavor[]
function sortFlavors(flavors: Flavor[], sortBy: keyof Flavor, order: 'asc' | 'desc'): Flavor[]
```

## 5. データバリデーション

### 5.1 店舗データバリデーション
- **name**: 必須、1文字以上100文字以下
- **phone**: 任意、電話番号形式
- **website**: 任意、URL形式
- **address**: 任意、500文字以下
- **memo**: 任意、1000文字以下

### 5.2 フレーバーデータバリデーション
- **name**: 必須、1文字以上100文字以下
- **flavors**: 必須、1つ以上の要素を持つ配列
- **score**: 必須、1-5の整数
- **memo**: 任意、1000文字以下
- **tags**: 任意、各タグは50文字以下

## 6. データマイグレーション

### バージョン管理
```typescript
interface DataVersion {
  version: string;           // データスキーマバージョン
  migrationDate: Date;       // マイグレーション実行日
}
```

### マイグレーション関数
```typescript
function migrateData(currentVersion: string, targetVersion: string): boolean
function backupData(): string  // JSON文字列でデータをエクスポート
function restoreData(backup: string): boolean  // バックアップデータから復元
```

## 7. エラーハンドリング

### エラー型定義
```typescript
interface DataError {
  code: string;
  message: string;
  details?: any;
}

// エラーコード一覧
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  STORAGE_FULL: 'STORAGE_FULL',
  INVALID_DATA: 'INVALID_DATA',
  MIGRATION_FAILED: 'MIGRATION_FAILED'
} as const;
```

## 8. パフォーマンス考慮事項

### データサイズ制限
- localStorage上限: 約5-10MB（ブラウザ依存）
- 店舗データ推奨上限: 500件
- フレーバーデータ推奨上限: 1000件

### 最適化戦略
- 必要時のみデータロード
- 検索時のインデックス活用
- 大量データ時のページネーション実装