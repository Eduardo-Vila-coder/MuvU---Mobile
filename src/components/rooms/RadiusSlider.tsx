import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, sharedStyles } from '@/constants/theme';
import { Slider } from '../ui/Slider';

interface RadiusSliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  onChange: (value: number) => void;
}

// Keeps the draft radius local: dragging re-renders only this block, never the list or the map.
export function RadiusSlider({ value, minimumValue, maximumValue, onChange }: RadiusSliderProps) {
  const [draft, setDraft] = useState(value);

  return (
    <View style={styles.block}>
      <View style={styles.header}>
        <Text style={sharedStyles.label}>Radio de búsqueda</Text>
        <Text style={styles.value}>{draft} km</Text>
      </View>
      <Slider
        value={draft}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={1}
        onChange={setDraft}
        onSlidingComplete={onChange}
        accessibilityLabel="Radio de búsqueda"
        valueText={`${draft} kilómetros`}
      />
      <View style={styles.scale}>
        <Text style={sharedStyles.muted}>{minimumValue} km</Text>
        <Text style={sharedStyles.muted}>{maximumValue} km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: 15, fontWeight: '600', color: colors.primary },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
});
