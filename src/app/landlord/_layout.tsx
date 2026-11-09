import { Stack } from 'expo-router';
import { RequireRole } from '../../components/auth/RequireRole';
import { stackScreenOptions } from '../../constants/theme';

// Only landlords. Part 3 adds the tabs and the screens of this folder.
export default function LandlordLayout() {
  return (
    <RequireRole allowedRoles={['ARRENDADOR']}>
      <Stack screenOptions={stackScreenOptions} />
    </RequireRole>
  );
}