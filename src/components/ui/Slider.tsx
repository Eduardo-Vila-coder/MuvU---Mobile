import { useRef, useState } from 'react';
import { StyleSheet, View, type AccessibilityActionEvent } from 'react-native';
import { colors } from '../../constants/theme';
import { sliderValueAtPosition } from '../../utils/slider';

const THUMB_SIZE = 22;
const TRACK_HEIGHT = 4;
const TOUCH_HEIGHT = 44;

interface SliderProps {
  value: number;
  minimumValue: number;
  maximumValue: number;
  step?: number;
  onChange?: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  disabled?: boolean;
  accessibilityLabel: string;
  // Spoken value, e.g. "5 kilómetros" (the UI text is Spanish).
  valueText?: string;
}

export function Slider({
  value, minimumValue, maximumValue, step = 1, onChange, onSlidingComplete,
  disabled = false, accessibilityLabel, valueText,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  // Touch start (x inside the slider and page x) so moves keep following the finger.
  const start = useRef({ x: 0, pageX: 0 });

  function emit(position: number, complete: boolean) {
    if (disabled || width <= 0) return;
    const next = sliderValueAtPosition(position, width, minimumValue, maximumValue, step);
    if (next !== value) onChange?.(next);
    if (complete) onSlidingComplete?.(next);
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const direction = event.nativeEvent.actionName === 'increment' ? 1
      : event.nativeEvent.actionName === 'decrement' ? -1 : 0;
    if (!direction || disabled) return;
    const next = Math.min(maximumValue, Math.max(minimumValue, value + direction * step));
    if (next === value) return;
    onChange?.(next);
    onSlidingComplete?.(next);
  }

  const ratio = maximumValue > minimumValue
    ? (Math.min(maximumValue, Math.max(minimumValue, value)) - minimumValue) / (maximumValue - minimumValue)
    : 0;

  return (
    <View style={[styles.container, disabled && styles.disabled]} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <View style={styles.track} />
      <View style={[styles.fill, { width: width * ratio }]} />
      <View style={[styles.thumb, { left: width * ratio - THUMB_SIZE / 2 }]} />
      {/* Transparent overlay on top: always the touch target and the accessible element. */}
      <View
        style={StyleSheet.absoluteFill}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        // Keep the drag on the slider instead of letting the parent list scroll.
        onResponderTerminationRequest={() => false}
        onResponderGrant={(event) => {
          start.current = { x: event.nativeEvent.locationX, pageX: event.nativeEvent.pageX };
          emit(start.current.x, false);
        }}
        onResponderMove={(event) => emit(start.current.x + event.nativeEvent.pageX - start.current.pageX, false)}
        onResponderRelease={(event) => emit(start.current.x + event.nativeEvent.pageX - start.current.pageX, true)}
        onResponderTerminate={(event) => emit(start.current.x + event.nativeEvent.pageX - start.current.pageX, true)}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: minimumValue, max: maximumValue, now: value, text: valueText }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        accessibilityState={{ disabled }}
        onAccessibilityAction={handleAccessibilityAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: TOUCH_HEIGHT, justifyContent: 'center' },
  disabled: { opacity: 0.5 },
  track: {
    position: 'absolute', top: (TOUCH_HEIGHT - TRACK_HEIGHT) / 2, left: 0, right: 0,
    height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: colors.border,
  },
  fill: {
    position: 'absolute', top: (TOUCH_HEIGHT - TRACK_HEIGHT) / 2, left: 0,
    height: TRACK_HEIGHT, borderRadius: TRACK_HEIGHT / 2, backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    top: (TOUCH_HEIGHT - THUMB_SIZE) / 2,
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
});
