export enum Role {
  ADMIN = 'ADMIN',
  PROCUREMENT_OFFICER = 'PROCUREMENT_OFFICER',
  MANAGER = 'MANAGER',
  VENDOR = 'VENDOR',
}

export enum RFQStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  AWARDED = 'AWARDED',
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum POStatus {
  GENERATED = 'GENERATED',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  COMPLETED = 'COMPLETED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}
