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
import { isMapPoint, type MapPoint } from '../maps/types';

export interface RoomFormValues {
  address: string;
  price: string; // typed as text, converted on submit
  area: string;
  latitud?: number;
  longitud?: number;
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
  const [location, setLocation] = useState<MapPoint | null>(() => {
    const point = { lat: initialValues.latitud, lng: initialValues.longitud };
    return isMapPoint(point) ? point : null;
  });

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;
    if (!location) {
      setFormError('Selecciona una dirección o confirma su ubicación en el mapa antes de continuar.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        direccion: values.address.trim(),
        precio: Number(values.price),
        area: Number(values.area),
        latitud: location.lat,
        longitud: location.lng,
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
        coordinates={location}
        onChange={(text, point) => { setValue('address', text); setLocation(point); }}
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
