import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

const BACKGROUNDS: Record<ToastVariant, string> = {
  success: colors.success,
  error: colors.danger,
  info: colors.primary,
};

const ICONS: Record<ToastVariant, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
};

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        <View style={styles.container}>
          {toasts.map((toast) => (
            <TouchableOpacity
              key={toast.id}
              activeOpacity={0.9}
              onPress={() => dismiss(toast.id)}
              style={[styles.toast, { backgroundColor: BACKGROUNDS[toast.variant] }]}
            >
              <Ionicons name={ICONS[toast.variant]} size={20} color="#fff" />
              <Text style={styles.text}>{toast.message}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { position: 'absolute', left: 16, right: 16, bottom: 100, gap: 8, pointerEvents: 'box-none' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: { flex: 1, color: '#fff', fontWeight: '500' },
});