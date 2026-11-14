import { useCallback, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { ActionLink } from '@/components/ui/ActionLink';
import { router, useFocusEffect } from 'expo-router';
import { getErrorMessage, getErrorStatus } from '@/api/errors';
import { getLandlord, getLandlordRooms } from '@/api/landlords';
import { deleteRoom } from '@/api/rooms';
import { RoomCard } from '@/components/rooms/RoomCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormAlert } from '@/components/ui/FormAlert';
import { PagedList } from '@/components/ui/PagedList';
import { colors } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import { useLandlordId } from '@/hooks/useLandlordId';
import { usePagedList } from '@/hooks/usePagedList';
import { useToast } from '@/hooks/useToast';
import type { Room } from '@/types/room';

// EP 014 (verified?) + landlord's rooms + EP 020 (delete)
export default function MyRoomsScreen() {
  const landlordId = useLandlordId();
  const { showToast } = useToast();

  const list = usePagedList<Room>((params, signal) => getLandlordRooms(landlordId, params, signal));
  const { reload: reloadList } = list;
  const { data: landlord, reload: reloadLandlord } = useFetch(
    (signal) => getLandlord(landlordId, signal),
    [landlordId],
  );

  // Tabs stay mounted, so reload when the user comes back from a form.
  // The first focus is skipped: the hooks above already fetched.
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      reloadList();
      reloadLandlord();
    }, [reloadList, reloadLandlord]),
  );

  function confirmDelete(room: Room) {
    Alert.alert(
      'Eliminar habitación',
      `¿Seguro que quieres eliminar "${room.direccion}"? También se borrarán sus imágenes.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(room.id) },
      ],
    );
  }

  async function handleDelete(roomId: number) {
    try {
      await deleteRoom(roomId);
      showToast('Habitación eliminada');
      reloadList();
    } catch (err) {
      const message =
        getErrorStatus(err) === 409
          ? 'No se puede eliminar: la habitación tiene reservas, calificaciones o pagos asociados.'
          : getErrorMessage(err);
      showToast(message, 'error');
    }
  }

  const isUnverified = landlord?.verificado === false;

  const header = (
    <View style={styles.header}>
      {isUnverified && (
        <FormAlert
          variant="info"
          message="Tu cuenta aún no está verificada. Sube la foto de tu DNI en tu perfil; podrás publicar habitaciones cuando un administrador la verifique."
        />
      )}
      <Button
        title="Publicar habitación"
        onPress={() => router.push('/landlord/rooms/new')}
        disabled={isUnverified}
      />
    </View>
  );

  return (
    <PagedList
      list={list}
      keyExtractor={(room) => String(room.id)}
      itemLabel="habitaciones"
      header={header}
      emptyState={
        <EmptyState
          icon="home-outline"
          title="Aún no publicaste habitaciones"
          description="Usa el botón Publicar habitación para agregar la primera."
        />
      }
      renderItem={(room) => (
        <RoomCard
          room={room}
          onPress={() => router.push(`/rooms/${room.id}`)}
          actions={
            <View style={styles.actions}>

              <ActionLink
                icon="create-outline"
                label="Editar"
                onPress={() => router.push(`/landlord/rooms/${room.id}/edit`)}
              />
              <ActionLink
                icon="images-outline"
                label="Imágenes"
                onPress={() => router.push(`/landlord/rooms/${room.id}/images`)}
              />
              <ActionLink
                icon={room.esDestacada ? 'star' : 'sparkles-outline'}
                label={room.esDestacada ? 'Ya destacada' : 'Destacar'}
                disabled={room.esDestacada}
                onPress={() => router.push(`/landlord/rooms/${room.id}/advertise`)}
              />
              <ActionLink icon="trash-outline" label="Eliminar" danger onPress={() => confirmDelete(room)} />

            </View>
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: { gap: 12 },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  }
});
