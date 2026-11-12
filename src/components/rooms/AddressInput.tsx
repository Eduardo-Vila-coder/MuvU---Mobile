import { TextField } from '../ui/TextField';

interface AddressInputProps {
  value: string;
  onChange: (address: string) => void;
  error?: string;
}

// Plain text field for now. The Google Maps teammate replaces the inside of
// this component (autocomplete) and keeps the same props
export function AddressInput({ value, onChange, error }: AddressInputProps) {
  return (
    <TextField
      label="Dirección"
      value={value}
      onChangeText={onChange}
      error={error}
      placeholder="Av. Grau 123, Barranco"
      hint="Usaremos esta dirección para ubicar tu habitación en el mapa."
      maxLength={255}
    />
  );
}