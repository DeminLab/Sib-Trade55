import type { CheckoutProvider, CheckoutSession, WebhookResult } from "@/types"

export class PaymentServiceNotConfiguredError extends Error {
  constructor() {
    super("Payment service is not configured")
    this.name = "PaymentServiceNotConfiguredError"
  }
}

export const unconfiguredCheckoutProvider: CheckoutProvider = {
  async createSession(): Promise<CheckoutSession> {
    throw new PaymentServiceNotConfiguredError()
  },
  async getSession(): Promise<CheckoutSession> {
    throw new PaymentServiceNotConfiguredError()
  },
  async handleWebhook(): Promise<WebhookResult> {
    throw new PaymentServiceNotConfiguredError()
  },
}
