import type { ReactNode } from 'react';

// Web stand-in for @stripe/stripe-react-native: the app is used on Android/iOS (the web version of MuvU is the
// React site on Vercel), so on web payments simply report that they are not available
const NOT_AVAILABLE = {
  code: 'Failed',
  message: 'Los pagos con Stripe solo están disponibles en la app de Android o iOS.',
} as const;

export const PaymentSheetError = { Canceled: 'Canceled', Failed: 'Failed', Timeout: 'Timeout' } as const;

export function StripeProvider({ children }: { children: ReactNode; publishableKey?: string; urlScheme?: string }) {
  return <>{children}</>;
}

export function useStripe() {
  return { handleURLCallback: async () => false };
}

export function usePaymentSheet() {
  return {
    initPaymentSheet: async () => ({ error: NOT_AVAILABLE }),
    presentPaymentSheet: async () => ({ error: NOT_AVAILABLE }),
  };
}
