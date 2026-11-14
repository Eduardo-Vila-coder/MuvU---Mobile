import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaymentSheetError, usePaymentSheet } from '@stripe/stripe-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { confirmAdPayment, createAdPaymentIntent, getMyAdPayments } from '@/api/payments';
import { getRoomById } from '@/api/rooms';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormAlert } from '@/components/ui/FormAlert';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { colors, sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import { AD_PLANS, type AdPayment } from '@/types/payment';
import { formatDate, todayIso } from '@/utils/dates';
import { formatPrice } from '@/utils/format';
import type { RoomDetail } from '@/types/room';

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripeTestMode = process.env.EXPO_PUBLIC_STRIPE_TEST_MODE !== 'false';

// Payment of this room that is running today ("yyyy-MM-dd" strings compare in date order)
function findActivePayment(payments: AdPayment[], roomId: number): AdPayment | undefined {
  const today = todayIso();
  return payments.find(
    (item) => item.habitacionId === roomId && item.fechaInicio <= today && today <= item.fechaFin,
  );
}

export function AdvertiseRoomRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);

  if (!Number.isInteger(roomId) || roomId <= 0) {
    return <ErrorState message="El identificador de la habitación no es válido." />;
  }

  if (!stripePublishableKey) {
    return (
      <View style={[sharedStyles.centered, styles.page]}>
        <FormAlert message="Configura EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY para habilitar los pagos." />
      </View>
    );
  }

  return (
    <AdvertiseRoomScreen roomId={roomId} />
  );
}

function AdvertiseRoomScreen({ roomId }: { roomId: number }) {
  const { data: room, loading, error, reload } = useFetch<RoomDetail>(
    (signal) => getRoomById(roomId, signal),
    [roomId],
  );
  // Payment history, to block rooms that are already featured
  const {
    data: payments,
    loading: paymentsLoading,
    error: paymentsError,
    reload: reloadPayments,
  } = useFetch<AdPayment[]>((signal) => getMyAdPayments(signal), []);
  const { initPaymentSheet, presentPaymentSheet } = usePaymentSheet();
  const [selectedAmount, setSelectedAmount] = useState(AD_PLANS[0].amount);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingConfirmationId, setPendingConfirmationId] = useState<string | null>(null);
  const [payment, setPayment] = useState<AdPayment | null>(null);

  async function activatePayment(paymentIntentId: string) {
    setConfirming(true);
    setErrorMessage(null);
    try {
      const confirmedPayment = await confirmAdPayment(paymentIntentId);
      setPayment(confirmedPayment);
      setPendingConfirmationId(null);
    } catch {
      // Keep the intent ID so a successful Stripe charge can be reconciled safely.
      setPendingConfirmationId(paymentIntentId);
      setErrorMessage('Stripe procesó el pago, pero no pudimos activar la promoción. Reintenta la confirmación.');
    } finally {
      setConfirming(false);
    }
  }

  async function startPayment() {
    if (!room) return;
    setProcessing(true);
    setErrorMessage(null);
    try {
      const intent = await createAdPaymentIntent({ habitacionId: room.id, monto: selectedAmount });
      const { error: setupError } = await initPaymentSheet({
        merchantDisplayName: 'MuvU',
        paymentIntentClientSecret: intent.clientSecret,
        returnURL: 'muvumobile://stripe-redirect',
        ...(Platform.OS === 'android'
          ? {
              googlePay: {
                merchantCountryCode: 'PE',
                testEnv: stripeTestMode,
                label: 'MuvU',
              },
            }
          : {}),
      });

      if (setupError) throw new Error(setupError.message);

      const { error: paymentError } = await presentPaymentSheet();
      if (paymentError) {
        if (paymentError.code === PaymentSheetError.Canceled) return;
        throw new Error(paymentError.message);
      }

      await activatePayment(intent.paymentIntentId);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo iniciar el pago con Stripe.');
    } finally {
      setProcessing(false);
    }
  }

  if (loading || paymentsLoading) return <ScreenLoader message="Cargando habitación..." />;
  if (error || !room) return <ErrorState message={error ?? 'No encontramos esta habitación.'} onRetry={reload} />;
  // Without the history we cannot know if it is featured, so we do not let the user pay
  if (paymentsError || !payments) {
    return (
      <ErrorState
        message={paymentsError ?? 'No pudimos revisar si la habitación ya está destacada.'}
        onRetry={reloadPayments}
      />
    );
  }

  // Only before paying here: after a successful payment the confirmation is shown instead
  const activePayment = payment ? undefined : findActivePayment(payments, roomId);

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={[sharedStyles.content, styles.page]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>Destacar habitación</Text>
        <Text style={sharedStyles.muted}>{room.direccion}</Text>
        <Text style={styles.description}>Tu anuncio aparecerá primero en las búsquedas cuando la promoción esté activa.</Text>
      </View>

      {errorMessage && <FormAlert message={errorMessage} />}

      {activePayment ? (
        <View style={sharedStyles.card}>
          <FormAlert
            variant="info"
            message={`Esta habitación ya está destacada hasta el ${formatDate(activePayment.fechaFin)}. Podrás destacarla otra vez cuando termine la promoción.`}
          />
          <Button title="Volver a mis habitaciones" onPress={() => router.back()} />
        </View>
      ) : payment ? (
        <View style={sharedStyles.card}>
          <FormAlert variant="info" message="Pago confirmado. Tu habitación ya quedó destacada." />
          <Text style={styles.paymentDetail}>Monto: {formatPrice(payment.monto)}</Text>
          <Text style={styles.paymentDetail}>Vigencia hasta: {payment.fechaFin}</Text>
          <Button title="Volver a mis habitaciones" onPress={() => router.back()} />
        </View>
      ) : pendingConfirmationId ? (
        <View style={sharedStyles.card}>
          <Button
            title={confirming ? 'Activando promoción...' : 'Reintentar confirmación'}
            onPress={() => activatePayment(pendingConfirmationId)}
            loading={confirming}
          />
        </View>
      ) : (
        <View style={sharedStyles.card}>
          <Text style={sharedStyles.sectionTitle}>Elige la duración</Text>
          {AD_PLANS.map((plan) => {
            const selected = selectedAmount === plan.amount;
            return (
              <Pressable
                key={plan.amount}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => setSelectedAmount(plan.amount)}
                style={[styles.plan, selected && styles.planSelected]}
              >
                <View>
                  <Text style={styles.planTitle}>{plan.label}</Text>
                  <Text style={sharedStyles.muted}>{plan.days} días de promoción</Text>
                </View>
                <Text style={styles.planPrice}>{formatPrice(plan.amount)}</Text>
              </Pressable>
            );
          })}
          <Text style={styles.description}>Pago seguro con Stripe. Acepta tarjetas y Google Pay en Android.</Text>
          <Button
            title={processing ? 'Preparando pago...' : `Continuar · ${formatPrice(selectedAmount)}`}
            onPress={startPayment}
            loading={processing}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { paddingBottom: 32 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  plan: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  planSelected: { backgroundColor: colors.primaryLight, borderColor: colors.primary, borderWidth: 2 },
  planTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  planPrice: { color: colors.text, fontSize: 17, fontWeight: '800' },
  paymentDetail: { color: colors.textSecondary, fontSize: 15 },
});