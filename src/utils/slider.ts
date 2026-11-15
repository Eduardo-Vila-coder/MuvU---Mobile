// Maps a touch position on a slider track to the nearest allowed value.
export function sliderValueAtPosition(
  position: number,
  width: number,
  minimumValue: number,
  maximumValue: number,
  step: number,
): number {
  if (width <= 0 || maximumValue <= minimumValue || step <= 0) return minimumValue;
  const ratio = Math.min(1, Math.max(0, position / width));
  const steps = Math.round((ratio * (maximumValue - minimumValue)) / step);
  return Math.min(maximumValue, Math.max(minimumValue, minimumValue + steps * step));
}
