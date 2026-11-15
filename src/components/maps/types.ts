export interface MapPoint { lat: number; lng: number }
export type TravelMode = 'DRIVING' | 'TRANSIT' | 'WALKING';
export interface MapRoom extends MapPoint {
  id: number;
  address: string;
  price: string;
}
export interface MapState {
  rooms?: MapRoom[];
  center?: MapPoint;
  centerTitle?: string;
  radiusKm?: number;
  origin?: MapPoint;
  destination?: MapPoint;
  travelMode?: TravelMode;
  picker?: boolean;
  address?: string;
  // A new request moves the draft pin; it still needs explicit confirmation.
  locationRequest?: MapPoint & { id: number };
}
export type MapEvent =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'address'; address: string; point: MapPoint }
  | { type: 'room'; id: number }
  | { type: 'selectRoom'; id: number }
  | { type: 'route'; key: string; mode: TravelMode; duration: string | null };

export function isMapPoint(value: unknown): value is MapPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as MapPoint;
  return Number.isFinite(point.lat) && Math.abs(point.lat) <= 90
    && Number.isFinite(point.lng) && Math.abs(point.lng) <= 180;
}

// Both bridges receive untrusted strings. Ignore unrelated or malformed messages.
export function parseMapEvent(raw: string): MapEvent | null {
  try {
    const event = JSON.parse(raw);
    if (!event || typeof event !== 'object') return null;
    switch (event.type) {
      case 'ready': return { type: 'ready' };
      case 'error': return typeof event.message === 'string' ? event : null;
      case 'address': return typeof event.address === 'string' && event.address.trim()
        && event.address.length <= 255 && isMapPoint(event.point) ? event : null;
      case 'room':
      case 'selectRoom': return Number.isInteger(event.id) && event.id > 0 ? event : null;
      case 'route': return ['DRIVING', 'TRANSIT', 'WALKING'].includes(event.mode)
        && typeof event.key === 'string' && (event.duration === null || typeof event.duration === 'string') ? event : null;
      default: return null;
    }
  } catch { return null; }
}
