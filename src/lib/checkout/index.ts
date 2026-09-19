// Provider contract is ready for a real payment adapter. No demo provider is
// exported: until configured, checkout fails explicitly instead of claiming payment.
export { PaymentServiceNotConfiguredError, unconfiguredCheckoutProvider as checkoutProvider } from "./unconfigured-provider"
