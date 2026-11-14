import { useEffect, useMemo, useRef } from 'react';
import { createMapDocument } from './document';
import { parseMapEvent } from './types';
import type { MapSurfaceProps } from './MapSurface';

export function MapSurface({ apiKey, state, onEvent }: MapSurfaceProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const ready = useRef(false);
  const latest = useRef({ state, onEvent });
  const html = useMemo(() => createMapDocument(apiKey), [apiKey]);

  useEffect(() => { latest.current = { state, onEvent }; }, [state, onEvent]);

  useEffect(() => {
    ready.current = false;
    function receive(event: MessageEvent) {
      if (event.source !== frame.current?.contentWindow || event.data?.channel !== 'muvu-map') return;
      const message = parseMapEvent(event.data.payload);
      if (!message) return;
      if (message.type === 'ready') {
        ready.current = true;
        frame.current?.contentWindow?.postMessage({ channel: 'muvu-map', state: latest.current.state }, '*');
      }
      latest.current.onEvent(message);
    }
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [html]);

  useEffect(() => {
    if (ready.current) frame.current?.contentWindow?.postMessage({ channel: 'muvu-map', state }, '*');
  }, [state]);

  return <iframe ref={frame} title="Mapa interactivo de Google" srcDoc={html}
    allow="fullscreen" referrerPolicy="strict-origin-when-cross-origin"
    style={{ border: 0, width: '100%', height: '100%' }} />;
}
