import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getErrorMessage } from '@/api/errors';
import { deleteRating, getStudentRatings } from '@/api/ratings';
import { RatingCard } from '@/components/ratings/RatingCard';
import { RoomAddress } from '@/components/rooms/RoomAddress';
import { EmptyState } from '@/components/ui/EmptyState';
import { PagedList } from '@/components/ui/PagedList';
import { colors, sharedStyles } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { usePagedList } from '@/hooks/usePagedList';
import { useToast } from '@/hooks/useToast';
import type { Rating } from '@/types/rating';

// EP 029 (my ratings, paginated) + EP 030 (delete one)
export default function MyReviewsScreen() {
  const { user } = useAuth();
  const studentId = user?.id ?? 0;
  const { showToast } = useToast();
  const list = usePagedList<Rating>((params, signal) => getStudentRatings(studentId, params, signal));
  const { reload } = list;
  const [deletingId, setDeletingId] = useState<number | null>(null);

  function confirmDelete(rating: Rating) {
    Alert.alert(
      'Eliminar reseña',
      'Se quitará de la habitación y se recalculará el puntaje del arrendador. No se puede deshacer.',
      [
        { text: 'Volver', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => handleDelete(rating.id) },
      ],
    );
  }

  async function handleDelete(ratingId: number) {
    setDeletingId(ratingId);
    try {
      await deleteRating(ratingId);
      showToast('Reseña eliminada');
      reload();
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <PagedList
      list={list}
      keyExtractor={(rating) => String(rating.id)}
      itemLabel="reseñas"
      header={
        <Text style={sharedStyles.muted}>Las calificaciones que dejaste en las habitaciones donde te hospedaste.</Text>
      }
      emptyState={
        <EmptyState
          icon="chatbubble-ellipses-outline"
          title="Aún no escribiste reseñas"
          description="Cuando tengas una reserva confirmada, podrás calificarla desde Mis reservas."
        />
      }
      renderItem={(rating) => (
        <RatingCard
          rating={rating}
          header={
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={16} color={colors.textMuted} />
              <View style={styles.addressText}>
                <RoomAddress roomId={rating.habitacionId} />
              </View>
            </View>
          }
          actions={
            <TouchableOpacity
              onPress={() => confirmDelete(rating)}
              disabled={deletingId !== null}
              accessibilityLabel="Eliminar reseña"
              style={styles.deleteButton}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={deletingId === rating.id ? colors.textMuted : colors.danger}
              />
            </TouchableOpacity>
          }
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  addressText: { flex: 1 },
  deleteButton: { padding: 6 },
});