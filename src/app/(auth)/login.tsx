import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { login } from '../../api/auth';
import { getErrorMessage } from '../../api/errors';
import { Button } from '../../components/ui/Button';
import { FormAlert } from '../../components/ui/FormAlert';
import { TextField } from '../../components/ui/TextField';
import { colors, sharedStyles } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useForm, type FormErrors } from '../../hooks/useForm';
import { useToast } from '../../hooks/useToast';
import { validateEmail } from '../../utils/validators';

interface LoginValues {
  email: string;
  password: string;
}

const INITIAL_VALUES: LoginValues = { email: '', password: '' };

function validateLogin(values: LoginValues): FormErrors<LoginValues> {
  return {
    email: validateEmail(values.email),
    password: values.password ? undefined : 'La contraseña es obligatoria',
  };
}

// EP 004 - POST /auth/login
export default function LoginScreen() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const { values, setValue, getError, validateAll } = useForm(INITIAL_VALUES, validateLogin);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      const response = await login({
        correo: values.email.trim().toLowerCase(),
        contrasena: values.password,
      });
      if (response.rol === 'ADMIN') {
        setFormError('La cuenta de administrador solo se usa desde la web.');
        setSubmitting(false);
        return;
      }
      await signIn(response); // (auth)/_layout redirects to the right home
      showToast('¡Bienvenido de vuelta!');
    } catch (err) {
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
      <View style={styles.brand}>
        <Text style={styles.logo}>MuvU</Text>
        <Text style={sharedStyles.muted}>Tu habitación cerca de tu universidad</Text>
      </View>

      <View style={sharedStyles.card}>
        {formError && <FormAlert message={formError} />}
        <TextField
          label="Correo"
          value={values.email}
          onChangeText={(text) => setValue('email', text)}
          error={getError('email')}
          placeholder="tu.correo@ejemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Contraseña"
          value={values.password}
          onChangeText={(text) => setValue('password', text)}
          error={getError('password')}
          placeholder="Tu contraseña"
          secureTextEntry
        />
        <Link href="/forgot-password" style={styles.link}>
          ¿Olvidaste tu contraseña?
        </Link>
        <Button title={submitting ? 'Ingresando...' : 'Ingresar'} onPress={handleSubmit} loading={submitting} />
      </View>

      <Text style={styles.footer}>
        ¿No tienes cuenta?{' '}
        <Link href="/register" style={styles.link}>
          Regístrate
        </Link>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brand: { alignItems: 'center', gap: 4, marginTop: 24, marginBottom: 8 },
  logo: { fontSize: 36, fontWeight: '800', color: colors.primary },
  link: { color: colors.primary, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.textMuted },
});