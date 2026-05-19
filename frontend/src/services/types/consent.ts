export interface ConsentRequest {
  id: number;
  userId?: number;
  userName?: string;
  documentTypeTitle?: string;
  documentTypeCode?: string;
  status: string;
  renderedContent?: string;
  signatureData?: string;
  signerName?: string;
  createdAt?: string;
  signedAt?: string;
  place?: string;
  psychologistName?: string;
}

export interface ConsentDocumentType {
  id: number;
  code: string;
  title: string;
  active: boolean;
}
