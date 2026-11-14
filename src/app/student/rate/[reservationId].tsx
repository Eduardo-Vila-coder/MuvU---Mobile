import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getErrorMessage, mapFieldErrors } from '@/api/errors';
import { createRating } from '@/api/ratings';
import { getReservationById } from '@/api/reservations';
import { StarRatingInput } from '@/components/ratings/StarRatingInput';
import { RoomAddress } from '@/components/rooms/RoomAddress';
import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/ui/ErrorState';
import { FormAlert } from '@/components/ui/FormAlert';
import { ScreenLoader } from '@/components/ui/ScreenLoader';
import { TextField } from '@/components/ui/TextField';
import { colors, sharedStyles } from '@/constants/theme';
import { useFetch } from '@/hooks/useFetch';
import { useForm, type FormErrors } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import type { Reservation } from '@/types/reservation';

const MAX_DESCRIPTION = 255;

interface RatingValues {
  score: number;
  description: string;
}

const INITIAL_VALUES: RatingValues = { score: 0, description: '' };

const SERVER_FIELDS: Record<string, keyof RatingValues> = {
  puntuacion: 'score',
  descripcion: 'description',
};

function validateRating(values: RatingValues): FormErrors<RatingValues> {
  return {
    score: values.score < 1 || values.score > 5 ? 'Elige de 1 a 5 estrellas' : undefined,
    description:
      values.description.length > MAX_DESCRIPTION ? `Máximo ${MAX_DESCRIPTION} caracteres` : undefined,
  };
}

// EP 023 (reservation) + EP 027 (rate a CONFIRMADO reservation, only once)
export default function RateScreen() {
  const { reservationId: reservationIdParam } = useLocalSearchParams<{ reservationId: string }>();
  const reservationId = Number(reservationIdParam);
  const { data: reservation, loading, error, reload } = useFetch(
    (signal) => getReservationById(reservationId, signal),
    [reservationId],
  );

  if (loading) return <ScreenLoader message="Cargando reserva..." />;
  if (error || !reservation) {
    return (
      <View style={sharedStyles.centered}>
        <ErrorState message={error ?? 'No encontramos la reserva'} onRetry={reload} />
      </View>
    );
  }

  return <RatingForm reservation={reservation} />;
}

function RatingForm({ reservation }: { reservation: Reservation }) {
  const { showToast } = useToast();
  const { values, setValue, getError, validateAll, setServerErrors } = useForm(INITIAL_VALUES, validateRating);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const canRate = reservation.estado === 'CONFIRMADO';

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await createRating({
        puntuacion: values.score,
        descripcion: values.description.trim() || null,
        reservaId: reservation.id,
      });
      showToast('¡Gracias! Tu calificación fue publicada');
      router.back(); // "Mis reservas" reloads on focus and shows "Calificada"
    } catch (err) {
      // 409: not confirmed or already rated -> the backend message explains it
      setServerErrors(mapFieldErrors(err, SERVER_FIELDS));
      setFormError(getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={sharedStyles.card}>
        <Text style={sharedStyles.sectionTitle}>Califica tu estadía</Text>
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <View style={styles.rowContent}>
            <RoomAddress roomId={reservation.habitacionId} />
          </View>
        </View>
        <Text style={sharedStyles.muted}>
          Tu opinión ayuda a otros estudiantes y se suma al puntaje del arrendador.
        </Text>
      </View>

      <View style={sharedStyles.card}>
        {!canRate && <FormAlert variant="info" message="Solo puedes calificar reservas confirmadas." />}
        {formError && <FormAlert message={formError} />}
        <StarRatingInput
          value={values.score}
          onChange={(score) => setValue('score', score)}
          error={getError('score')}
        />
        <TextField
          label="Comentario (opcional)"
          value={values.description}
          onChangeText={(text) => setValue('description', text)}
          error={getError('description')}
          hint={`${values.description.length}/${MAX_DESCRIPTION}`}
          placeholder="¿Qué tal la habitación, el arrendador y la zona?"
          multiline
          textAlignVertical="top"
          style={styles.textArea}
        />
        <Button
          title={submitting ? 'Publicando...' : 'Publicar calificación'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={!canRate}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowContent: { flex: 1 },
  textArea: { minHeight: 110 },
});