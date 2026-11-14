import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { getRoomRatings } from '@/api/ratings';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { colors, sharedStyles } from '@/constants/theme';
import { usePagedList } from '@/hooks/usePagedList';
import type { Rating } from '@/types/rating';
import { RatingCard } from './RatingCard';

// EP 011 - reviews of a room. Inside a ScrollView, so "Ver más" instead of infinite scroll
export function RoomRatings({ roomId }: { roomId: number }) {
  const { items, totalElements, isFirstLoad, isLoadingMore, error, hasMore, loadMore, retry } =
    usePagedList<Rating>((params, signal) => getRoomRatings(roomId, params, signal), 5);

  function renderContent() {
    if (isFirstLoad) return <ActivityIndicator color={colors.primary} />;
    if (error && items.length === 0) return <ErrorState message={error} onRetry={retry} />;
    if (items.length === 0) {
      return (
        <EmptyState
          icon="chatbubbles-outline"
          title="Aún no hay calificaciones"
          description="Cuando un estudiante se hospede aquí, podrá dejar su opinión."
        />
      );
    }
    return (
      <>
        {items.map((rating) => (
          <RatingCard key={rating.id} rating={rating} />
        ))}
        {error && <ErrorState message={error} onRetry={retry} />}
        {hasMore && !error && (
          <Button
            title={isLoadingMore ? 'Cargando...' : 'Ver más calificaciones'}
            variant="secondary"
            onPress={loadMore}
            loading={isLoadingMore}
          />
        )}
      </>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={sharedStyles.sectionTitle}>
        Calificaciones{totalElements > 0 ? ` (${totalElements})` : ''}
      </Text>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
});