import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';

interface ActionLinkProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
}

// Small icon + text action, used inside cards
export function ActionLink({ icon, label, onPress, danger = false, disabled = false }: ActionLinkProps) {
  const color = disabled ? colors.textMuted : danger ? colors.danger : colors.primary;
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.7} style={styles.action}>
      <Ionicons name={icon} size={18} color={color} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  text: { fontSize: 14, fontWeight: '600' },
});