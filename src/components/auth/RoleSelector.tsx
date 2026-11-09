import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import type { RegisterRole } from '../../types/auth';

interface RoleOption {
  role: RegisterRole;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const OPTIONS: RoleOption[] = [
  { role: 'ESTUDIANTE', title: 'Soy estudiante', description: 'Busco habitación', icon: 'school-outline' },
  { role: 'ARRENDADOR', title: 'Soy arrendador', description: 'Publico habitaciones', icon: 'key-outline' },
];

interface RoleSelectorProps {
  value: RegisterRole;
  onChange: (role: RegisterRole) => void;
}

export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = option.role === value;
        return (
          <TouchableOpacity
            key={option.role}
            onPress={() => onChange(option.role)}
            activeOpacity={0.8}
            style={[styles.option, selected && styles.selected]}
          >
            <Ionicons name={option.icon} size={28} color={selected ? colors.primary : colors.textMuted} />
            <Text style={[styles.title, selected && styles.selectedTitle]}>{option.title}</Text>
            <Text style={styles.description}>{option.description}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  title: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  selectedTitle: { color: colors.primary },
  description: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});