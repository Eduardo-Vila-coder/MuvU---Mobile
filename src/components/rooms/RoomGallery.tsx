import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, sharedStyles } from '@/constants/theme';
import type { RoomImage } from '@/types/room';

// Big selected photo + thumbnails (same idea as the web gallery)
export function RoomGallery({ images }: { images: RoomImage[] }) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (images.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="image-outline" size={40} color={colors.textMuted} />
        <Text style={sharedStyles.muted}>Esta habitación aún no tiene fotos</Text>
      </View>
    );
  }

  const selected = images[Math.min(selectedIndex, images.length - 1)];

  return (
    <View style={styles.container}>
      <Image source={{ uri: selected.url }} style={styles.main} resizeMode="cover" />
      {images.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={image.id}
              activeOpacity={0.8}
              onPress={() => setSelectedIndex(index)}
              style={[styles.thumb, index === selectedIndex && styles.thumbSelected]}
            >
              <Image source={{ uri: image.url }} style={styles.thumbImage} resizeMode="cover" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  main: { width: '100%', aspectRatio: 16 / 10, borderRadius: 16, backgroundColor: colors.border },
  empty: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6', // gray-100
  },
  thumbs: { gap: 8 },
  thumb: {
    width: 96,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.7,
  },
  thumbSelected: { borderColor: colors.primary, opacity: 1 },
  thumbImage: { width: '100%', height: '100%' },
});