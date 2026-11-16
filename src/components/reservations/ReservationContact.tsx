import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { colors } from '@/constants/theme';
import { useToast } from '@/hooks/useToast';
import type { ReservationContact as Contact } from '@/types/reservation';
import {
  buildContactMessage,
  buildMailtoLink,
  buildPhoneLink,
  buildWhatsAppLink,
  formatPhone,
} from '@/utils/contact';

interface ReservationContactProps {
  contact: Contact;
  contactRole: 'arrendador' | 'estudiante';
  reservationId: number;
}

interface ContactButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  contactName: string;
  onPress: () => void;
  primary?: boolean;
}

function ContactButton({ icon, label, contactName, onPress, primary = false }: ContactButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={`${label} a ${contactName}`}
      style={({ pressed }) => [styles.button, primary && styles.buttonPrimary, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={16} color={primary ? '#ffffff' : colors.textSecondary} />
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>{label}</Text>
    </Pressable>
  );
}

// Shown only when the reservation is CONFIRMADO: both parties can now talk to each other
export function ReservationContact({ contact, contactRole, reservationId }: ReservationContactProps) {
  const { showToast } = useToast();
  const message = buildContactMessage(contact.nombre, reservationId);
  const phone = contact.telefono || null;

  async function open(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      showToast('No se pudo abrir la aplicación en este celular', 'error');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contacto del {contactRole}</Text>
      <View style={styles.person}>
        <Avatar name={contact.nombre} src={contact.fotoPerfil} size="md" />
        <View style={styles.personText}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.nombre}
          </Text>
          <Text style={styles.detail} numberOfLines={1}>
            {contact.correo}
          </Text>
          <Text style={styles.detail}>
            {phone ? formatPhone(phone) : 'Sin celular registrado'}
          </Text>
        </View>
      </View>

      <View style={styles.buttons}>
        {phone ? (
          <ContactButton
            icon="logo-whatsapp"
            label="WhatsApp"
            contactName={contact.nombre}
            onPress={() => open(buildWhatsAppLink(phone, message))}
            primary
          />
        ) : null}
        {phone ? (
          <ContactButton
            icon="call-outline"
            label="Llamar"
            contactName={contact.nombre}
            onPress={() => open(buildPhoneLink(phone))}
          />
        ) : null}
        <ContactButton
          icon="mail-outline"
          label="Correo"
          contactName={contact.nombre}
          onPress={() => open(buildMailtoLink(contact.correo, `MuvU - Reserva #${reservationId}`, message))}
        />
      </View>
    </View>
  );
}

const WHATSAPP_GREEN = '#16a34a'; // green-600

const styles = StyleSheet.create({
  container: {
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0', // green-200
    backgroundColor: '#f0fdf4', // green-50
    padding: 12,
  },
  title: { fontSize: 13, fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }, // green-700
  person: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  personText: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  detail: { fontSize: 13, color: colors.textSecondary },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonPrimary: { backgroundColor: WHATSAPP_GREEN, borderColor: WHATSAPP_GREEN },
  pressed: { opacity: 0.7 },
  buttonText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  buttonTextPrimary: { color: '#ffffff' },
});
