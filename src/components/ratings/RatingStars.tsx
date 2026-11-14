import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface RatingStarsProps {
  value: number;
  max?: number;
  size?: number;
}

// Read-only stars, rounded to the nearest whole star
export function RatingStars({ value, max = 5, size = 16 }: RatingStarsProps) {
  const filled = Math.round(value);
  return (
    <View style={styles.row} accessible accessibilityLabel={`${value} de ${max} estrellas`}>
      {Array.from({ length: max }, (_, index) => (
        <Ionicons
          key={index}
          name={index < filled ? 'star' : 'star-outline'}
          size={size}
          color={index < filled ? colors.star : colors.borderStrong}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});