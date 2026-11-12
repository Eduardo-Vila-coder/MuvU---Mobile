import { api } from './client';
import type {
  AdPayment,
  CreateAdPaymentIntentRequest,
  CreateAdPaymentIntentResponse,
} from '@/types/payment';

// POST /pagos-publicidad/intenciones (ARRENDADOR, owner of the room).
export async function createAdPaymentIntent(
  body: CreateAdPaymentIntentRequest,
): Promise<CreateAdPaymentIntentResponse> {
  const { data } = await api.post<CreateAdPaymentIntentResponse>('/pagos-publicidad/intenciones', body);
  return data;
}

// Confirm only after the native payment flow reports success.
export async function confirmAdPayment(paymentIntentId: string): Promise<AdPayment> {
  const { data } = await api.post<AdPayment>(
    `/pagos-publicidad/${encodeURIComponent(paymentIntentId)}/confirmar`,
  );
  return data;
}

// EP 035 - GET /pagos-publicidad (ARRENDADOR). Only the payments of HIS rooms, not paginated.
export async function getMyAdPayments(signal?: AbortSignal): Promise<AdPayment[]> {
  const { data } = await api.get<AdPayment[]>('/pagos-publicidad', { signal });
  return data;
}
