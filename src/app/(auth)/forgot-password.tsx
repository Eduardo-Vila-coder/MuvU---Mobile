import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { forgotPassword } from '../../api/auth';
import { getErrorMessage, mapFieldErrors } from '../../api/errors';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { FormAlert } from '../../components/ui/FormAlert';
import { TextField } from '../../components/ui/TextField';
import { sharedStyles } from '../../constants/theme';
import { useForm, type FormErrors } from '../../hooks/useForm';
import { validateEmail } from '../../utils/validators';

interface ForgotValues {
  email: string;
}

const INITIAL_VALUES: ForgotValues = { email: '' };

function validateForgot(values: ForgotValues): FormErrors<ForgotValues> {
  return { email: validateEmail(values.email) };
}

// EP 006 - POST /auth/forgot-password (always 204).
// The email link opens the web, where the new password is set (EP 007).
export default function ForgotPasswordScreen() {
  const { values, setValue, getError, validateAll, setServerErrors } = useForm(INITIAL_VALUES, validateForgot);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await forgotPassword({ correo: values.email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setServerErrors(mapFieldErrors(err, { correo: 'email' }));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <View style={sharedStyles.centered}>
        <EmptyState
          icon="mail-outline"
          title="Revisa tu correo"
          description="Si el correo está registrado, te enviamos un enlace para crear una nueva contraseña. Vence en 15 minutos."
          action={<Button title="Volver a iniciar sesión" onPress={() => router.back()} />}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={sharedStyles.card}>
        <Text style={styles.text}>
          Escribe el correo de tu cuenta y te enviaremos un enlace para crear una nueva contraseña.
        </Text>
        {formError && <FormAlert message={formError} />}
        <TextField
          label="Correo"
          value={values.email}
          onChangeText={(text) => setValue('email', text)}
          error={getError('email')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Button title={submitting ? 'Enviando...' : 'Enviar enlace'} onPress={handleSubmit} loading={submitting} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 15, color: '#374151' },
});