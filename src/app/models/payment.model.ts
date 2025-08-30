export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface Payment {
  id: string;
  invoiceId: string;
  projectId: string;
  amount: number;
  date: Date;
  currency: string;
  status: PaymentStatus;
  method: string;
  reference: string;
  notes?: string;
  isVisible: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentWithDetails extends Payment {
  invoice?: {
    invoiceNumber: string;
    projectName: string;
  };
  project?: {
    name: string;
    clientName: string;
  };
}
