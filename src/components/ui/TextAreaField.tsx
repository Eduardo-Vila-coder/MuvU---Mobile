import { StyleSheet, type TextInputProps } from 'react-native';
import { TextField } from './TextField';

interface TextAreaFieldProps extends Omit<TextInputProps, 'value' | 'maxLength'> {
  label: string;
  value: string;
  maxLength: number;
  error?: string;
  hint?: string;
  minHeight?: number;
}

// Multiline text with a character counter (descriptions and messages)
export function TextAreaField({ hint, value, maxLength, minHeight = 96, style, ...props }: TextAreaFieldProps) {
  const counter = `${value.length}/${maxLength}`;
  return (
    <TextField
      {...props}
      value={value}
      maxLength={maxLength}
      multiline
      textAlignVertical="top"
      hint={hint ? `${hint} · ${counter}` : counter}
      style={[styles.area, { minHeight }, style]}
    />
  );
}

const styles = StyleSheet.create({
  area: { paddingTop: 10 },
});
