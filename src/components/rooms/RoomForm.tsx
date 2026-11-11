import { useState } from 'react';
import { View } from 'react-native';
import { getErrorMessage, getErrorStatus, mapFieldErrors } from '../../api/errors';
import { sharedStyles } from '../../constants/theme';
import { useForm, type FormErrors } from '../../hooks/useForm';
import type { RoomRequest } from '../../types/room';
import { validatePositiveNumber, validateRequiredText } from '../../utils/validators';
import { Button } from '../ui/Button';
import { FormAlert } from '../ui/FormAlert';
import { TextField } from '../ui/TextField';
import { AddressInput } from './AddressInput';

export interface RoomFormValues {
  address: string;
  price: string; // typed as text, converted on submit
  area: string;
}

function validateRoom(values: RoomFormValues): FormErrors<RoomFormValues> {
  return {
    address: validateRequiredText(values.address, 'La dirección es obligatoria', 255),
    price: validatePositiveNumber(values.price, 'El precio es obligatorio'),
    area: validatePositiveNumber(values.area, 'El área es obligatoria', { integer: true }),
  };
}

function getRoomErrorMessage(err: unknown): string {
  if (getErrorStatus(err) === 502) {
    return 'No pudimos ubicar la dirección con Google Maps. Inténtalo de nuevo en unos minutos.';
  }
  return getErrorMessage(err);
}

interface RoomFormProps {
  initialValues: RoomFormValues;
  submitLabel: string;
  onSubmit: (body: RoomRequest) => Promise<void>; // the screen calls the API and navigates
}

// Used by "Publicar" (EP 016) and "Editar" (EP 019)
export function RoomForm({ initialValues, submitLabel, onSubmit }: RoomFormProps) {
  const { values, setValue, getError, validateAll, setServerErrors } = useForm(initialValues, validateRoom);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        direccion: values.address.trim(),
        precio: Number(values.price),
        area: Number(values.area),
      });
    } catch (err) {
      setServerErrors(
        mapFieldErrors<RoomFormValues>(err, { direccion: 'address', precio: 'price', area: 'area' }),
      );
      setFormError(getRoomErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={sharedStyles.card}>
      {formError && <FormAlert message={formError} />}
      <AddressInput
        value={values.address}
        onChange={(text) => setValue('address', text)}
        error={getError('address')}
      />
      <TextField
        label="Precio (S/)"
        value={values.price}
        onChangeText={(text) => setValue('price', text)}
        error={getError('price')}
        placeholder="850"
        keyboardType="decimal-pad"
      />
      <TextField
        label="Área (m²)"
        value={values.area}
        onChangeText={(text) => setValue('area', text)}
        error={getError('area')}
        placeholder="12"
        keyboardType="number-pad"
      />
      <Button title={submitting ? 'Guardando...' : submitLabel} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}