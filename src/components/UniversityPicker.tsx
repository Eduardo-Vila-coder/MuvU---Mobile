import { StyleSheet, Text, View } from 'react-native';
import { sharedStyles } from '../constants/theme';
import type { University } from '../types/university';
import { Chip } from './ui/Chip';

interface UniversityPickerProps {
  universities: University[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

// React Native has no <select>, so universities are shown as chips
export function UniversityPicker({ universities, selectedId, onSelect }: UniversityPickerProps) {
  if (universities.length === 0) {
    return <Text style={sharedStyles.muted}>Aún no hay universidades registradas.</Text>;
  }

  return (
    <View style={styles.wrap}>
      {universities.map((university) => (
        <Chip
          key={university.id}
          label={university.nombre}
          selected={university.id === selectedId}
          onPress={() => onSelect(university.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});