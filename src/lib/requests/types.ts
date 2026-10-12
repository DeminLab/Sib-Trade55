import type { ContactRequest, QuoteRequest } from "@/types"

export type RequestKind = "contact" | "quote" | "custom"
export type RequestStatus = "submitted" | "processing" | "completed" | "cancelled"
export type NotificationStatus = "not_configured" | "pending" | "sent" | "failed"

export interface CustomRequestData {
  name: string
  phone: string
  email: string
  productType: string
  dimensions: string
  material: string
  finish: string
  quantity: string
  comment: string
}

export interface RequestAttachment {
  id: string
  name: string
  size: number
}

interface RequestRecordBase {
  id: string
  requestNumber: string
  status: RequestStatus
  createdAt: string
  updatedAt: string
  notificationStatus: NotificationStatus
  attachments: RequestAttachment[]
}

export type RequestRecord = RequestRecordBase & (
  | { kind: "contact"; data: ContactRequest }
  | { kind: "quote"; data: QuoteRequest }
  | { kind: "custom"; data: CustomRequestData }
)

export interface RequestReceipt {
  success: boolean
  requestId: string
  requestNumber: string
  message: string
}
