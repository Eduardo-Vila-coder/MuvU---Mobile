import { useEffect } from 'react';
import { Linking } from 'react-native';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export default function RootLayout() {
  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar style="dark" />
        {stripePublishableKey ? (
          <StripeProvider
            publishableKey={stripePublishableKey}
            urlScheme="muvumobile"
          >
            <StripeDeepLinkHandler />
            <Stack screenOptions={{ headerShown: false }} />
          </StripeProvider>
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
      </ToastProvider>
    </AuthProvider>
  );
}

function StripeDeepLinkHandler() {
  const { handleURLCallback } = useStripe();

  useEffect(() => {
    const handleUrl = (url: string | null | undefined) => {
      if (url) void handleURLCallback(url);
    };

    void Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [handleURLCallback]);

  return null;
}
