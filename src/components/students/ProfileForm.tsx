import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getErrorMessage, mapFieldErrors } from '@/api/errors';
import { updateStudent } from '@/api/students';
import { UniversityPicker } from '@/components/UniversityPicker';
import { Button } from '@/components/ui/Button';
import { FormAlert } from '@/components/ui/FormAlert';
import { TextField } from '@/components/ui/TextField';
import { colors, sharedStyles } from '@/constants/theme';
import { useForm, type FormErrors } from '@/hooks/useForm';
import { useToast } from '@/hooks/useToast';
import type { Student } from '@/types/student';
import type { University } from '@/types/university';
import { validateName } from '@/utils/validators';

interface ProfileValues {
  name: string;
  universityId: number | null;
}

const SERVER_FIELDS: Record<string, keyof ProfileValues> = {
  nombre: 'name',
  universidadId: 'universityId',
};

function validateProfile(values: ProfileValues): FormErrors<ProfileValues> {
  return {
    name: validateName(values.name),
    universityId: values.universityId === null ? 'Elige tu universidad' : undefined,
  };
}

interface ProfileFormProps {
  student: Student;
  universities: University[];
  initialUniversityId: number | null;
  onSaved: () => void;
}

// EP 032 - name and university (email and password can't change here)
export function ProfileForm({ student, universities, initialUniversityId, onSaved }: ProfileFormProps) {
  const { showToast } = useToast();
  const { values, setValue, getError, validateAll, setServerErrors } = useForm<ProfileValues>(
    { name: student.nombre, universityId: initialUniversityId },
    validateProfile,
  );
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSave() {
    setFormError(null);
    if (!validateAll() || values.universityId === null) return;

    setSaving(true);
    try {
      await updateStudent(student.id, { nombre: values.name.trim(), universidadId: values.universityId });
      showToast('Perfil actualizado');
      onSaved();
    } catch (err) {
      setServerErrors(mapFieldErrors(err, SERVER_FIELDS));
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={sharedStyles.card}>
      <Text style={sharedStyles.sectionTitle}>Editar perfil</Text>
      {formError && <FormAlert message={formError} />}
      <TextField
        label="Nombre completo"
        value={values.name}
        onChangeText={(text) => setValue('name', text)}
        error={getError('name')}
        autoComplete="name"
      />
      <View style={styles.field}>
        <Text style={sharedStyles.label}>Universidad</Text>
        <UniversityPicker
          universities={universities}
          selectedId={values.universityId}
          onSelect={(id) => setValue('universityId', id)}
        />
        {getError('universityId') && <Text style={styles.error}>{getError('universityId')}</Text>}
      </View>
      <Text style={sharedStyles.muted}>El correo y la contraseña no se pueden cambiar desde aquí.</Text>
      <Button title={saving ? 'Guardando...' : 'Guardar cambios'} onPress={handleSave} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 8 },
  error: { fontSize: 13, color: colors.danger },
});