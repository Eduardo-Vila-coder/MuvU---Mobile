import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { getErrorMessage, getErrorStatus, mapFieldErrors } from '@/api/errors';
import { createReservation } from '@/api/reservations';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { colors, sharedStyles } from '@/constants/theme';
import { useForm, type FormErrors } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import { addDays, countNights, isValidIsoDate, todayIso } from '@/utils/dates';
import { View } from 'react-native';

interface ReservationValues {
  startDate: string;
  endDate: string;
}

const INITIAL_VALUES: ReservationValues = { startDate: '', endDate: '' };

const SERVER_FIELDS: Record<string, keyof ReservationValues> = {
  fecha_inicio: 'startDate',
  fecha_fin: 'endDate',
};

// Same rules as ReservaRequestDTO: start today or later, end after start
function validateReservation(values: ReservationValues): FormErrors<ReservationValues> {
  const today = todayIso();
  const start = values.startDate.trim();
  const end = values.endDate.trim();
  const errors: FormErrors<ReservationValues> = {};

  if (!start) errors.startDate = 'Escribe la fecha de ingreso';
  else if (!isValidIsoDate(start)) errors.startDate = 'Usa el formato AAAA-MM-DD';
  else if (start < today) errors.startDate = 'La fecha de ingreso no puede ser pasada';

  if (!end) errors.endDate = 'Escribe la fecha de salida';
  else if (!isValidIsoDate(end)) errors.endDate = 'Usa el formato AAAA-MM-DD';
  else if (!errors.startDate && end <= start) errors.endDate = 'La salida debe ser posterior al ingreso';

  return errors;
}

// EP 021 - reservation request (students only)
export function ReservationForm({ roomId }: { roomId: number }) {
  const { showToast } = useToast();
  const { values, setValue, getError, validateAll, setServerErrors, isValid } = useForm(
    INITIAL_VALUES,
    validateReservation,
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const today = todayIso();
  const nights = isValid ? countNights(values.startDate.trim(), values.endDate.trim()) : 0;

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await createReservation({
        fecha_inicio: values.startDate.trim(),
        fecha_fin: values.endDate.trim(),
        habitacionId: roomId,
      });
      showToast('Solicitud enviada. Te avisaremos por correo cuando el arrendador la confirme.');
      router.replace('/student/reservations');
    } catch (err) {
      setServerErrors(mapFieldErrors(err, SERVER_FIELDS));
      setFormError(
        getErrorStatus(err) === 409
          ? 'La habitación ya está reservada en esas fechas. Prueba con otras.'
          : getErrorMessage(err),
      );
      setSubmitting(false);
    }
  }

  return (
    <View style={sharedStyles.card}>
      <Text style={sharedStyles.sectionTitle}>Elige tus fechas</Text>
      {formError && <FormAlert message={formError} />}
      <TextField
        label="Fecha de ingreso"
        value={values.startDate}
        onChangeText={(text) => setValue('startDate', text)}
        error={getError('startDate')}
        hint="Formato AAAA-MM-DD"
        placeholder={addDays(today, 7)}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        maxLength={10}
      />
      <TextField
        label="Fecha de salida"
        value={values.endDate}
        onChangeText={(text) => setValue('endDate', text)}
        error={getError('endDate')}
        hint="Formato AAAA-MM-DD"
        placeholder={addDays(today, 37)}
        keyboardType="numbers-and-punctuation"
        autoCorrect={false}
        maxLength={10}
      />
      {nights > 0 && (
        <FormAlert
          variant="info"
          message={`${nights} ${nights === 1 ? 'noche' : 'noches'} · el arrendador debe confirmar tu solicitud`}
        />
      )}
      <Button title={submitting ? 'Enviando...' : 'Solicitar reserva'} onPress={handleSubmit} loading={submitting} />
      <Text style={styles.note}>No se te cobrará nada al enviar la solicitud.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
});