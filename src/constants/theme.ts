import { StyleSheet } from 'react-native';

// Same Tailwind palette as the web app
export const colors = {
  primary: '#2563eb', // blue-600
  primaryLight: '#eff6ff', // blue-50
  background: '#f9fafb', // gray-50
  surface: '#ffffff',
  border: '#e5e7eb', // gray-200
  borderStrong: '#d1d5db', // gray-300
  text: '#111827', // gray-900
  textSecondary: '#374151', // gray-700
  textMuted: '#6b7280', // gray-500
  danger: '#dc2626', // red-600
  dangerText: '#b91c1c', // red-700
  dangerLight: '#fef2f2', // red-50
  success: '#16a34a', // green-600
  info: '#1e40af', // blue-800
  star: '#f59e0b', // amber-500
  featured: '#fbbf24', // amber-400
  featuredText: '#451a03', // amber-950
};

// Brand colors for every Stack header (same palette as the web)
export const stackScreenOptions = {
  headerTintColor: colors.primary,
  headerStyle: { backgroundColor: colors.surface },
  headerTitleStyle: { fontWeight: '700' as const, color: colors.text },
  contentStyle: { backgroundColor: colors.background },
};

export const sharedStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 16 },
  centered: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  label: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  muted: { fontSize: 14, color: colors.textMuted },
});