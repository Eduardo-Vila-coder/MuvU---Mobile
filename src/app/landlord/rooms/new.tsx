import { ScrollView } from 'react-native';
import { router } from 'expo-router';
import { createRoom } from '../../../api/rooms';
import { RoomForm, type RoomFormValues } from '../../../components/rooms/RoomForm';
import { sharedStyles } from '../../../constants/theme';
import { useToast } from '../../../hooks/useToast';
import type { RoomRequest } from '../../../types/room';

const EMPTY_VALUES: RoomFormValues = { address: '', price: '', area: '' };

// EP 016 - POST /habitaciones
export default function NewRoomScreen() {
  const { showToast } = useToast();
  
  async function handleSubmit(body: RoomRequest) {
    const room = await createRoom(body); // RoomForm shows the errors
    showToast('Habitación publicada. Ahora agrega fotos.');
    router.replace(`/landlord/rooms/${room.id}/images`);
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <RoomForm initialValues={EMPTY_VALUES} submitLabel="Publicar" onSubmit={handleSubmit} />
    </ScrollView>
  );
}