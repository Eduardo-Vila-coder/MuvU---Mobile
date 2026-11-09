import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, sharedStyles } from '../../constants/theme';

export function ScreenLoader({ message }: { message?: string }) {
  return (
    <View style={[sharedStyles.centered, styles.container]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={sharedStyles.muted}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
});