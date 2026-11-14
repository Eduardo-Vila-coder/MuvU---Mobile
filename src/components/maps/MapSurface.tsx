import { useEffect, useMemo, useRef } from 'react';
import { Linking, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { createMapDocument, scriptJson } from './document';
import { parseMapEvent, type MapEvent, type MapState } from './types';

export interface MapSurfaceProps {
  apiKey: string;
  state: MapState;
  onEvent: (event: MapEvent) => void;
}

export function MapSurface({ apiKey, state, onEvent }: MapSurfaceProps) {
  const ref = useRef<WebView<unknown>>(null);
  const ready = useRef(false);
  const latestState = useRef(state);
  const source = useMemo(() => ({
    html: createMapDocument(apiKey),
    baseUrl: process.env.EXPO_PUBLIC_GOOGLE_MAPS_BASE_URL || 'https://localhost/',
  }), [apiKey]);

  function update(next: MapState) {
    ref.current?.injectJavaScript(`window.__muvuUpdate && window.__muvuUpdate(${scriptJson(next)});true;`);
  }

  useEffect(() => {
    latestState.current = state;
    if (ready.current) update(state);
  }, [state]);

  return (
    <WebView<unknown>
      ref={ref}
      source={source}
      style={styles.map}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      onShouldStartLoadWithRequest={(request) => {
        if (request.isTopFrame === false || request.url === 'about:blank' || request.url === source.baseUrl) return true;
        if (request.url.startsWith('https://')) void Linking.openURL(request.url).catch(() => undefined);
        return false;
      }}
      onOpenWindow={({ nativeEvent }) => {
        if (nativeEvent.targetUrl.startsWith('https://')) void Linking.openURL(nativeEvent.targetUrl).catch(() => undefined);
      }}
      onLoadStart={() => { ready.current = false; }}
      onError={() => onEvent({ type: 'error', message: 'No se pudo cargar el mapa. Revisa tu conexión.' })}
      onMessage={({ nativeEvent }) => {
        const event = parseMapEvent(nativeEvent.data);
        if (!event) return;
        if (event.type === 'ready') {
          ready.current = true;
          update(latestState.current);
        }
        onEvent(event);
      }}
    />
  );
}

const styles = StyleSheet.create({ map: { flex: 1, backgroundColor: '#fff' } });
