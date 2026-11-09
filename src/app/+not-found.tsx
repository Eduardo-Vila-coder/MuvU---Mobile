import { router } from 'expo-router';
import { View } from 'react-native';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { sharedStyles } from '../constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={sharedStyles.centered}>
      <EmptyState
        icon="help-circle-outline"
        title="Esta pantalla no existe"
        description="Puede que el enlace esté mal escrito o que la página ya no exista."
        action={<Button title="Volver al inicio" onPress={() => router.replace('/')} />}
      />
    </View>
  );
}