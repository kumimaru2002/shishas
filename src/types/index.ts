export interface Shop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  openingHours?: string;
  website?: string;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Flavor {
  id: string;
  name: string;
  flavors: string[];
  shopId?: string;
  score: number;
  memo?: string;
  tags?: string[];
  smokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  theme: 'light' | 'dark';
  sortBy: 'createdAt' | 'updatedAt' | 'score' | 'name';
  sortOrder: 'asc' | 'desc';
  itemsPerPage: number;
  lastBackup?: Date;
}

export interface DataError {
  code: string;
  message: string;
  details?: any;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  STORAGE_FULL: 'STORAGE_FULL',
  INVALID_DATA: 'INVALID_DATA',
  MIGRATION_FAILED: 'MIGRATION_FAILED'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FormField {
  name: string;
  value: string;
  required: boolean;
  maxLength?: number;
  pattern?: RegExp;
  errorMessage?: string;
}