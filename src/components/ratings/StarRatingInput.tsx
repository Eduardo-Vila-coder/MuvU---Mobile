import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sharedStyles } from '@/constants/theme';

const LABELS = ['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

interface StarRatingInputProps {
  value: number; // 0 = nothing selected
  onChange: (value: number) => void;
  error?: string;
}

// Tappable 1-5 stars
export function StarRatingInput({ value, onChange, error }: StarRatingInputProps) {
  return (
    <View style={styles.container}>
      <Text style={sharedStyles.label}>Puntuación</Text>
      <View style={styles.row}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onChange(star)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${star} ${star === 1 ? 'estrella' : 'estrellas'}`}
            accessibilityState={{ selected: value === star }}
          >
            <Ionicons
              name={star <= value ? 'star' : 'star-outline'}
              size={36}
              color={star <= value ? colors.star : colors.borderStrong}
            />
          </TouchableOpacity>
        ))}
        <Text style={styles.label}>{LABELS[value]}</Text>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  error: { fontSize: 13, color: colors.danger },
});