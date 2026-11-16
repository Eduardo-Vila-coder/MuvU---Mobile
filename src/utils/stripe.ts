// Stripe for Android/iOS. The web build uses stripe.web.tsx instead (the native SDK can't be bundled for web,
// and Expo Router also bundles the app for web when it exports the server manifest during `eas build`)
export { PaymentSheetError, StripeProvider, usePaymentSheet, useStripe } from '@stripe/stripe-react-native';
