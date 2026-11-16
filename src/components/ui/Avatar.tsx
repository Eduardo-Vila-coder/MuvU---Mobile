import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<AvatarSize, number> = { xs: 22, sm: 32, md: 40, lg: 56, xl: 96 };

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: AvatarSize;
}

// Profile photo; with no photo (or a broken link) it shows the first letter of the name
export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const dimension = SIZES[size];
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <View style={[styles.circle, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}>
      {showImage ? (
        <Image
          source={{ uri: src! }}
          style={{ width: dimension, height: dimension }}
          accessibilityLabel={`Foto de ${name}`}
          onError={() => setFailedSrc(src!)}
        />
      ) : (
        <Text style={[styles.initial, { fontSize: dimension * 0.4 }]}>{initial}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dbeafe', // blue-100
  },
  initial: { fontWeight: '700', color: '#1d4ed8' }, // blue-700
});
