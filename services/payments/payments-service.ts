import type { PlanId } from "@/types";

/**
 * Payments abstraction prepared for Stripe (STRIPE_SECRET_KEY, server-side only).
 * The mock never charges — it returns a confirmation URL inside the app.
 */
export interface CheckoutSession {
  id: string;
  url: string;
}

export interface PaymentsService {
  createSubscriptionCheckout(input: { providerId: string; plan: Exclude<PlanId, "free">; returnUrl: string }): Promise<CheckoutSession>;
  createBookingFeeCheckout(input: { bookingId: string; amount: number; returnUrl: string }): Promise<CheckoutSession>;
}

class MockPaymentsService implements PaymentsService {
  async createSubscriptionCheckout(input: { providerId: string; plan: Exclude<PlanId, "free">; returnUrl: string }) {
    return { id: `cs_demo_${input.plan}`, url: `${input.returnUrl}?demo_checkout=${input.plan}` };
  }
  async createBookingFeeCheckout(input: { bookingId: string; amount: number; returnUrl: string }) {
    return { id: `cs_demo_${input.bookingId}`, url: `${input.returnUrl}?demo_checkout=booking` };
  }
}

let instance: PaymentsService | null = null;
export function getPaymentsService(): PaymentsService {
  // Integration point: return a StripePaymentsService when STRIPE_SECRET_KEY is set.
  instance ??= new MockPaymentsService();
  return instance;
}
