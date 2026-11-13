import { useCallback, useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/api/errors';
import { confirmReservation, getReservations } from '@/api/reservations';
import { ReservationCard } from '@/components/reservations/ReservationCard';
import { ActionLink } from '@/components/ui/ActionLink';
import { EmptyState } from '@/components/ui/EmptyState';
import { PagedList } from '@/components/ui/PagedList';
import { sharedStyles } from '@/constants/theme';
import { usePagedList } from '@/hooks/usePagedList';
import { useToast } from '@/hooks/useToast';
import type { Reservation } from '@/types/reservation';

// EP 022 (reservations of my rooms) + EP 026 (confirm)
export default function RequestsScreen() {
  const { showToast } = useToast();
  const list = usePagedList<Reservation>((params, signal) => getReservations(params, signal));
  const { reload } = list;
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  // Tabs stay mounted: reload when coming back (the first focus is skipped)
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

  function askConfirm(reservation: Reservation) {
    Alert.alert(
      'Confirmar reserva',
      'Le avisaremos al estudiante por correo y esas fechas quedarán ocupadas.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Confirmar', onPress: () => handleConfirm(reservation.id) },
      ],
    );
  }

  async function handleConfirm(reservationId: number) {
    setConfirmingId(reservationId);
    try {
      await confirmReservation(reservationId);
      showToast('Reserva confirmada');
    } catch (err) {
      // 409: it was already confirmed or cancelled -> the backend message explains it
      showToast(getErrorMessage(err), 'error');
    } finally {
      setConfirmingId(null);
      reload(); // the status may have changed either way
    }
  }

  return (
    <PagedList
      list={list}
      keyExtractor={(reservation) => String(reservation.id)}
      itemLabel="solicitudes"
      header={<Text style={sharedStyles.muted}>Revisa el perfil del estudiante antes de confirmar.</Text>}
      emptyState={
        <EmptyState
          icon="mail-open-outline"
          title="No tienes solicitudes"
          description="Cuando un estudiante reserve una de tus habitaciones, aparecerá aquí."
        />
      }
      renderItem={(reservation) => (
        <ReservationCard
          reservation={reservation}
          showStudent
          actions={
            <>
              <ActionLink
                icon="person-outline"
                label="Ver estudiante"
                onPress={() => router.push(`/landlord/students/${reservation.estudianteId}`)}
              />
              {reservation.estado === 'PENDIENTE' && (
                <ActionLink
                  icon="checkmark-circle-outline"
                  label={confirmingId === reservation.id ? 'Confirmando...' : 'Confirmar'}
                  disabled={confirmingId !== null}
                  onPress={() => askConfirm(reservation)}
                />
              )}
            </>
          }
        />
      )}
    />
  );
}