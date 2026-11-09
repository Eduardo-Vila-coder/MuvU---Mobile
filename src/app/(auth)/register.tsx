import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { registerLandlord, registerStudent } from '../../api/auth';
import { getErrorMessage, getErrorStatus, mapFieldErrors } from '../../api/errors';
import { RoleSelector } from '../../components/auth/RoleSelector';
import { UniversityPicker } from '../../components/UniversityPicker';
import { Button } from '../../components/ui/Button';
import { FormAlert } from '../../components/ui/FormAlert';
import { TextField } from '../../components/ui/TextField';
import { colors, sharedStyles } from '../../constants/theme';
import { useAuth } from '../../hooks/useAuth';
import { useForm, type FormErrors } from '../../hooks/useForm';
import { useToast } from '../../hooks/useToast';
import { useUniversities } from '../../hooks/useUniversities';
import type { AuthResponse, RegisterRole } from '../../types/auth';
import { validateEmail, validateName, validatePassword } from '../../utils/validators';

interface RegisterValues {
  role: RegisterRole;
  name: string;
  email: string;
  password: string;
  universityId: number | null;
}

const INITIAL_VALUES: RegisterValues = {
  role: 'ESTUDIANTE',
  name: '',
  email: '',
  password: '',
  universityId: null,
};

const SERVER_FIELDS: Record<string, keyof RegisterValues> = {
  nombre: 'name',
  correo: 'email',
  contrasena: 'password',
  universidadId: 'universityId',
};

// Same rules as the web: students need a .edu.pe email and a university
function validateRegister(values: RegisterValues): FormErrors<RegisterValues> {
  const isStudent = values.role === 'ESTUDIANTE';
  return {
    name: validateName(values.name),
    email: validateEmail(values.email, { requireEduPe: isStudent }),
    password: validatePassword(values.password),
    universityId: isStudent && values.universityId === null ? 'Elige tu universidad' : undefined,
  };
}

// EP 002 (student) and EP 003 (landlord)
export default function RegisterScreen() {
  const { signIn } = useAuth();
  const { showToast } = useToast();
  const { universities, loading: loadingUniversities, error: universitiesError } = useUniversities();
  const { values, setValue, getError, validateAll, setServerErrors } = useForm(INITIAL_VALUES, validateRegister);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const isStudent = values.role === 'ESTUDIANTE';

  function sendRegister(): Promise<AuthResponse> {
    const body = {
      nombre: values.name.trim(),
      correo: values.email.trim().toLowerCase(),
      contrasena: values.password,
    };
    if (!isStudent) return registerLandlord(body);
    return registerStudent({ ...body, universidadId: values.universityId! }); // validated before
  }

  async function handleSubmit() {
    setFormError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      const response = await sendRegister();
      await signIn(response);
      showToast('¡Cuenta creada! Bienvenido a MuvU');
    } catch (err) {
      setServerErrors(mapFieldErrors(err, SERVER_FIELDS));
      setFormError(getErrorStatus(err) === 409 ? 'Ya existe una cuenta con ese correo' : getErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={sharedStyles.screen}
      contentContainerStyle={sharedStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <RoleSelector value={values.role} onChange={(role) => setValue('role', role)} />

      <View style={sharedStyles.card}>
        {formError && <FormAlert message={formError} />}
        <TextField
          label="Nombre completo"
          value={values.name}
          onChangeText={(text) => setValue('name', text)}
          error={getError('name')}
          placeholder="Ana Pérez"
        />
        <TextField
          label={isStudent ? 'Correo universitario' : 'Correo'}
          value={values.email}
          onChangeText={(text) => setValue('email', text)}
          error={getError('email')}
          hint={isStudent ? 'Debe terminar en .edu.pe' : undefined}
          placeholder={isStudent ? 'ana.perez@utec.edu.pe' : 'ana@ejemplo.com'}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextField
          label="Contraseña"
          value={values.password}
          onChangeText={(text) => setValue('password', text)}
          error={getError('password')}
          hint="8 a 64 caracteres, con mayúscula, minúscula, número y símbolo"
          secureTextEntry
        />

        {isStudent && (
          <View style={styles.field}>
            <Text style={sharedStyles.label}>Universidad</Text>
            {loadingUniversities ? (
              <ActivityIndicator color={colors.primary} />
            ) : universitiesError ? (
              <FormAlert message={universitiesError} />
            ) : (
              <UniversityPicker
                universities={universities}
                selectedId={values.universityId}
                onSelect={(id) => setValue('universityId', id)}
              />
            )}
            {getError('universityId') && <Text style={styles.error}>{getError('universityId')}</Text>}
          </View>
        )}

        {!isStudent && (
          <FormAlert
            variant="info"
            message="Después podrás tomar la foto de tu DNI desde tu perfil para que verifiquemos tu cuenta."
          />
        )}

        <Button title={submitting ? 'Creando cuenta...' : 'Crear cuenta'} onPress={handleSubmit} loading={submitting} />
      </View>

      <Text style={styles.footer}>
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" style={styles.link}>
          Inicia sesión
        </Link>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  error: { fontSize: 13, color: colors.danger },
  link: { color: colors.primary, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.textMuted },
});