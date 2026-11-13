import { useCallback, useRef } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getMyAdPayments } from '@/api/payments';
import { AdPaymentCard } from '@/components/payments/AdPaymentCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormAlert } from '@/components/ui/FormAlert';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import type { AdPayment } from '@/types/payment';
import { todayIso } from '@/utils/dates';

// EP 035 - payment history of the landlord (not paginated)
export default function PaymentsScreen() {
  const { data, loading, error, reload } = useFetch<AdPayment[]>((signal) => getMyAdPayments(signal), []);

  // A new payment may have been made from "Mis habitaciones"
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

  if (loading && !data) return <ScreenLoader message="Cargando tus pagos..." />;
  if (!data) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No se pudo cargar tu historial'} onRetry={reload} />
      </View>
    );
  }

  const today = todayIso();
  // Newest first (the backend does not sort them)
  const payments = [...data].sort((a, b) => b.id - a.id);

  return (
    <FlatList
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      data={payments}
      keyExtractor={(payment) => String(payment.id)}
      renderItem={({ item }) => (
        <AdPaymentCard
          payment={item}
          active={item.fechaFin >= today}
          onAdvertiseAgain={() => router.push(`/landlord/rooms/${item.habitacionId}/advertise`)}
        />
      )}
      // Data is still shown if a reload fails
      ListHeaderComponent={error ? <FormAlert message={error} /> : undefined}
      ListEmptyComponent={
        <EmptyState
          icon="receipt-outline"
          title="Aún no tienes pagos"
          description='Usa "Destacar" en Mis habitaciones para que tu habitación aparezca primero.'
        />
      }
      ListFooterComponent={
        payments.length > 0 ? (
          <Text style={[sharedStyles.muted, styles.summary]}>
            {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
          </Text>
        ) : undefined
      }
      refreshing={loading}
      onRefresh={reload}
    />
  );
}

const styles = StyleSheet.create({
  summary: { textAlign: 'center' },
});