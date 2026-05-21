export interface ConsentRequest {
  id: number;
  userId?: number;
  userName?: string;
  documentTypeId?: number;
  documentTypeTitle?: string;
  documentTypeCode?: string;
  formSchema?: string;
  formData?: string;
  status: string;
  renderedContent?: string;
  signatureData?: string;
  signerName?: string;
  createdAt?: string;
  sentAt?: string;
  signedAt?: string;
  place?: string;
  psychologistName?: string;
}

export interface ConsentDocumentType {
  id: number;
  code: string;
  title: string;
  formSchema?: string;
  active: boolean;
}

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required?: boolean;
  options?: string[];
  showIf?: string;
}
