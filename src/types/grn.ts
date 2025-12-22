export interface GRN {
  grnId: number
  grnNumber: string
  supplierId: number
  stockKeeperId: number
  receivedDate: string
  totalAmount: number
  remarks: string | null
  createdDate?: string;  
  updatedDate?: string;
}

export interface CreateGRNRequest {
  grnNumber: string
  supplierId: number
  stockKeeperId: number
  receivedDate: string
  totalAmount: number
  remarks?: string
}

export interface UpdateGRNRequest {
  grnNumber?: string
  supplierId?: number
  stockKeeperId?: number
  receivedDate?: string
  totalAmount?: number
  remarks?: string
}