import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getRoomById, updateRoom } from '../../../../api/rooms';
import { RoomForm } from '../../../../components/rooms/RoomForm';
import { ErrorState } from '../../../../components/ui/ErrorState';
import { ScreenLoader } from '../../../../components/ui/ScreenLoader';
import { sharedStyles } from '../../../../constants/theme';
import { useFetch } from '../../../../hooks/useFetch';
import { useToast } from '../../../../hooks/useToast';
import type { RoomRequest } from '../../../../types/room';

// EP 009 (prefill) + EP 019 - PUT /habitaciones/{id}
export default function EditRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const roomId = Number(id);
  const { showToast } = useToast();
  const { data: room, loading, error, reload } = useFetch(
    (signal) => getRoomById(roomId, signal),
    [roomId],
  );

  async function handleSubmit(body: RoomRequest) {
    await updateRoom(roomId, body); // all fields are sent
    showToast('Cambios guardados');
    router.back();
  }

  if (loading) return <ScreenLoader message="Cargando habitación..." />;
  if (error || !room) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No encontramos la habitación'} onRetry={reload} />
      </View>
    );
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <RoomForm
        initialValues={{
          address: room.direccion,
          price: String(room.precio),
          area: room.area === null ? '' : String(room.area),
        }}
        submitLabel="Guardar cambios"
        onSubmit={handleSubmit}
      />
    </ScrollView>
  );
}