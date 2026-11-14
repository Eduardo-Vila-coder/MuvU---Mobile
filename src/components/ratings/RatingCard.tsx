import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, sharedStyles } from '@/constants/theme';
import type { Rating } from '@/types/rating';
import { RatingStars } from './RatingStars';

interface RatingCardProps {
  rating: Rating;
  header?: ReactNode; // e.g. the room address in "Mis reseñas"
  actions?: ReactNode; // e.g. the delete action in "Mis reseñas"
}

export function RatingCard({ rating, header, actions }: RatingCardProps) {
  const initial = rating.autorNombre.trim().charAt(0).toUpperCase() || '?';

  return (
    <View style={sharedStyles.card}>
      {header}
      <View style={styles.top}>
        <View style={styles.author}>
          <View style={styles.avatar}>
            <Text style={styles.initial}>{initial}</Text>
          </View>
          <View style={styles.authorText}>
            <Text style={styles.name}>{rating.autorNombre}</Text>
            <RatingStars value={rating.puntuacion} />
          </View>
        </View>
        {actions}
      </View>
      {rating.descripcion ? <Text style={styles.description}>{rating.descripcion}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  author: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe', // blue-100
  },
  initial: { fontSize: 16, fontWeight: '700', color: '#1d4ed8' }, // blue-700
  authorText: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  description: { fontSize: 14, lineHeight: 20, color: colors.textSecondary },
});