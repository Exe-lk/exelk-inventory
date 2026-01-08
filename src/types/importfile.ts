export interface CreateImportFileRequest {
  file: File;
  remarks?: string;
  StockKeeperID?: number;
}

export interface ImportFile {
  ImportID: number
  StockKeeperID: number
  FileName: string
  FileType: string
  ImportDate: string
  Status: string
  ErrorCount: number | null
  Remarks: string | null
  FilePath: string
}

// For creating a new import file
export interface CreateImportRequest {
  StockKeeperID: number
  FileName: string
  FileType: string
  Status?: string
  ErrorCount?: number
  Remarks?: string | null
  FilePath: string
}

// For updating an existing import file
export interface UpdateImportRequest {
  FileName?: string
  FileType?: string
  Status?: string
  ErrorCount?: number
  Remarks?: string
  FilePath?: string
}

// For API responses
export interface ImportFileResponse {
  ImportID: number
  StockKeeperID: number
  FileName: string
  FileType: string
  ImportDate: string
  Status: string
  ErrorCount: number | null
  Remarks: string | null
  FilePath: string
}

// For single import file detailed response
export interface ImportFileDetail {
  importId: number
  fileName: string
  fileType: string
  uploadedBy: number
  uploadedDate: string
  status: string
  totalRecords: number | null
  processedRecords: number | null
  failedRecords: number | null
  remarks: string | null
}

// In your types file, update the FormField interface:
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'file' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  validation?: (value: any) => string | null; // Change from specific types to any
  min?: number;
  max?: number;
  rows?: number;
  accept?: string; // For file inputs
  readOnly?: boolean;
}