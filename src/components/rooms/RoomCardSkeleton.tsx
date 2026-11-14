import { StyleSheet, View } from 'react-native';
import { colors, sharedStyles } from '@/constants/theme';

// Gray placeholder with the shape of a RoomCard while the first page loads
export function RoomCardSkeleton() {
  return (
    <View style={sharedStyles.card}>
      <View style={[styles.block, styles.price]} />
      <View style={[styles.block, styles.address]} />
      <View style={[styles.block, styles.area]} />
    </View>
  );
}

export function RoomListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }, (_, index) => (
        <RoomCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 16 },
  block: { backgroundColor: colors.border, borderRadius: 6 },
  price: { width: '35%', height: 22 },
  address: { width: '85%', height: 16 },
  area: { width: '40%', height: 16 },
});