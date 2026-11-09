import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

interface FormAlertProps {
  message: string;
  variant?: 'error' | 'info';
}

export function FormAlert({ message, variant = 'error' }: FormAlertProps) {
  const isError = variant === 'error';
  const color = isError ? colors.dangerText : colors.info;

  return (
    <View style={[styles.box, isError ? styles.error : styles.info]}>
      <Ionicons name={isError ? 'alert-circle-outline' : 'information-circle-outline'} size={18} color={color} />
      <Text style={[styles.text, { color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 8, padding: 12 },
  error: { backgroundColor: colors.dangerLight },
  info: { backgroundColor: colors.primaryLight },
  text: { flex: 1, fontSize: 14 },
});