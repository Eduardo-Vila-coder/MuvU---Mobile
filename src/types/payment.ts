export type PaymentMethod = 'TARJETA' | 'APPLE_PAY' | 'GOOGLE_PAY';

// EP 034 - body (PagoPublicidadRequestDTO)
export interface CreateAdPaymentIntentRequest {
  habitacionId: number;
  monto: number;
}

export interface CreateAdPaymentIntentResponse {
  paymentIntentId: string;
  clientSecret: string;
}

// EP 034 / EP 035 - PagoPublicidadResponseDTO
export interface AdPayment {
  id: number;
  habitacionId: number;
  monto: number;
  metodoPago: PaymentMethod;
  fechaInicio: string; // yyyy-MM-dd
  fechaFin: string; // yyyy-MM-dd
}

// The 2 plans the backend accepts (the amount decides the duration)
export interface AdPlan {
  amount: number;
  days: number;
  label: string;
}

export const AD_PLANS: AdPlan[] = [
  { amount: 30, days: 30, label: '30 días' },
  { amount: 54, days: 60, label: '60 días' },
];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  TARJETA: 'Tarjeta',
  APPLE_PAY: 'Apple Pay',
  GOOGLE_PAY: 'Google Pay',
};
