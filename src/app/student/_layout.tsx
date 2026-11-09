import { Stack } from 'expo-router';
import { RequireRole } from '../../components/auth/RequireRole';
import { stackScreenOptions } from '../../constants/theme';

// Only students. Part 2 adds the tabs and the screens of this folder.
export default function StudentLayout() {
  return (
    <RequireRole allowedRoles={['ESTUDIANTE']}>
      <Stack screenOptions={stackScreenOptions} />
    </RequireRole>
  );
}