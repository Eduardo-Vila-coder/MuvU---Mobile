import { useCallback, useRef, useState } from 'react';
import { Alert, Text } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getErrorMessage } from '@/api/errors';
import { cancelReservation, getReservations } from '@/api/reservations';
import { ReservationCard } from '@/components/reservations/ReservationCard';
import { ActionLink } from '@/components/ui/ActionLink';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PagedList } from '@/components/ui/PagedList';
import { sharedStyles } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { usePagedList } from '@/hooks/usePagedList';
import { useRatedReservations } from '@/hooks/useRatedReservations';
import { useToast } from '@/hooks/useToast';
import type { Reservation } from '@/types/reservation';

// EP 022 (my reservations) + EP 024 (cancel) + link to rate the confirmed ones
export default function MyReservationsScreen() {
  const { user } = useAuth();
  const studentId = user?.id ?? 0;
  const { showToast } = useToast();
  const list = usePagedList<Reservation>((params, signal) => getReservations(params, signal));
  const { reload } = list;
  const { ratedIds, reload: reloadRated } = useRatedReservations(studentId);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Tabs stay mounted: reload when coming back (e.g. after reserving or rating)
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      reload();
      reloadRated();
    }, [reload, reloadRated]),
  );

  function askCancel(reservation: Reservation) {
    Alert.alert(
      'Cancelar reserva',
      'Le avisaremos al arrendador por correo. Esta acción no se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Cancelar reserva', style: 'destructive', onPress: () => handleCancel(reservation.id) },
      ],
    );
  }

  async function handleCancel(reservationId: number) {
    setCancellingId(reservationId);
    try {
      await cancelReservation(reservationId);
      showToast('Reserva cancelada');
    } catch (err) {
      // 409: it was already confirmed or cancelled -> the backend message explains it
      showToast(getErrorMessage(err), 'error');
    } finally {
      setCancellingId(null);
      reload();
    }
  }

  return (
    <PagedList
      list={list}
      keyExtractor={(reservation) => String(reservation.id)}
      itemLabel="reservas"
      header={
        <Text style={sharedStyles.muted}>
          Puedes cancelar una solicitud mientras esté pendiente y calificar las reservas confirmadas.
        </Text>
      }
      emptyState={
        <EmptyState
          icon="calendar-outline"
          title="Aún no tienes reservas"
          description="Busca una habitación y envía tu primera solicitud."
          action={<Button title="Buscar habitaciones" onPress={() => router.navigate('/student')} />}
        />
      }
      renderItem={(reservation) => {
        const isConfirmed = reservation.estado === 'CONFIRMADO';
        const isRated = ratedIds.has(reservation.id);
        return (
          <ReservationCard
            reservation={reservation}
            actions={
              <>
                <ActionLink
                  icon="eye-outline"
                  label="Ver habitación"
                  onPress={() => router.push(`/rooms/${reservation.habitacionId}`)}
                />
                {reservation.estado === 'PENDIENTE' && (
                  <ActionLink
                    icon="close-circle-outline"
                    label={cancellingId === reservation.id ? 'Cancelando...' : 'Cancelar'}
                    danger
                    disabled={cancellingId !== null}
                    onPress={() => askCancel(reservation)}
                  />
                )}
                {isConfirmed && !isRated && (
                  <ActionLink
                    icon="star-outline"
                    label="Calificar"
                    onPress={() => router.push(`/student/rate/${reservation.id}`)}
                  />
                )}
                {isConfirmed && isRated && (
                  <ActionLink icon="checkmark-circle-outline" label="Calificada" disabled onPress={() => {}} />
                )}
              </>
            }
          />
        );
      }}
    />
  );
}