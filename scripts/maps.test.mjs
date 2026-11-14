import assert from 'node:assert/strict';
import { test } from 'node:test';
import vm from 'node:vm';
import { createMapDocument, scriptJson } from '../src/components/maps/document.ts';
import { parseMapEvent } from '../src/components/maps/types.ts';

const origin = { lat: -12.06, lng: -77.04 };
const destination = { lat: -12.08, lng: -77.06 };
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

async function harness({ compute, geocode, autocomplete } = {}) {
  class Element {
    style = {};
    children = [];
    listeners = {};
    value = '';
    disabled = false;
    textContent = '';
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    async fire(name, event) { await this.listeners[name]?.(event); }
  }
  const elements = Object.fromEntries(['picker', 'map', 'status', 'search', 'suggestions', 'confirm'].map((id) => [id, new Element()]));
  const events = [], markers = [], polylines = [], requests = [], infos = [], timers = new Map(), listeners = {};
  let timerId = 0;
  const map = { setCenter() {}, setZoom() {}, fitBounds() {}, panTo() {}, addListener(name, callback) { listeners[name] = callback; } };
  class Marker {
    listeners = {};
    constructor(options) { this.options = options; markers.push(this); }
    setMap(value) { this.options.map = value; }
    setPosition(value) { this.options.position = value; }
    setIcon(value) { this.options.icon = value; }
    addListener(name, callback) { this.listeners[name] = callback; }
  }
  const route = () => ({ localizedValues: { duration: '12 min' }, createPolylines() {
    const line = { setMap(value) { this.map = value; } }; polylines.push(line); return [line];
  } });
  const maps = {
    Map: class { constructor() { return map; } }, Marker,
    LatLngBounds: class { extend() {} },
    SymbolPath: { CIRCLE: 'circle' },
    Circle: class { setMap() {} getBounds() { return {}; } },
    Geocoder: class { geocode(request) {
      return geocode ? geocode(request) : Promise.resolve({ results: [{ formatted_address: 'Av. Grau 123, Lima, Perú' }] });
    } },
    InfoWindow: class { constructor() { infos.push(this); } setContent(value) { this.content = value; } open() {} close() {} },
    async importLibrary(name) {
      if (name === 'routes') return { Route: { computeRoutes(request) {
        requests.push(request);
        return compute ? compute(request, route) : Promise.resolve({ routes: [route()] });
      } } };
      if (name === 'places') return {
        AutocompleteSessionToken: class {},
        AutocompleteSuggestion: { fetchAutocompleteSuggestions: autocomplete || (() => Promise.resolve({ suggestions: [] })) },
      };
      return {};
    },
  };
  const document = { getElementById: (id) => elements[id], createElement: () => new Element(), head: new Element() };
  const window = {
    google: { maps }, ReactNativeWebView: { postMessage: (raw) => events.push(JSON.parse(raw)) },
    addEventListener() {},
  };
  const context = vm.createContext({ window, document, console,
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
  });
  const html = createMapDocument('test-client-key');
  const source = html.match(/<script>([\s\S]*)<\/script>/)[1];
  new vm.Script(source).runInContext(context);
  await window.__muvuReady();
  return {
    window, events, elements, markers, listeners, requests, polylines, infos,
    update(state) { window.__muvuUpdate(state); },
    route,
    async search(input) {
      elements.search.value = input;
      await elements.search.fire('input');
      for (const [id, timer] of timers) if (timer.delay === 350) { timers.delete(id); void timer.callback(); }
      await tick();
    },
  };
}

test('bridge rejects malformed messages, invalid coordinates and unrelated events', () => {
  for (const value of ['null', '{}', 'invalid', '{"type":"room","id":-1}', '{"type":"address","address":"x","point":{"lat":91,"lng":0}}']) {
    assert.equal(parseMapEvent(value), null);
  }
  assert.equal(parseMapEvent(JSON.stringify({ type: 'address', address: 'Lima', point: origin })).type, 'address');
  const injected = '</script><script>window.injected=true</script>\u2028';
  assert.ok(!scriptJson(injected).includes('<'));
  assert.ok(!createMapDocument(injected).includes(injected));
});

test('moving the pin never saves until reverse geocoding is confirmed', async () => {
  const h = await harness();
  h.update({ picker: true });
  h.listeners.click({ latLng: { lat: () => origin.lat, lng: () => origin.lng } });
  assert.equal(h.events.filter((e) => e.type === 'address').length, 0);
  await h.elements.confirm.fire('click');
  const saved = h.events.find((e) => e.type === 'address');
  assert.deepEqual(saved.point, origin);
  assert.equal(saved.address, 'Av. Grau 123, Lima, Perú');
});

test('moving a pin while reverse geocoding is pending discards the old address', async () => {
  const pending = deferred();
  const h = await harness({ geocode: () => pending.promise });
  h.update({ picker: true, locationRequest: { ...origin, id: 1 } });
  const confirmation = h.elements.confirm.fire('click');
  h.update({ picker: true, locationRequest: { ...destination, id: 2 } });
  pending.resolve({ results: [{ formatted_address: 'Old address' }] });
  await confirmation;
  assert.equal(h.events.filter((e) => e.type === 'address').length, 0);
  assert.equal(h.elements.confirm.disabled, false);
});

test('failed reverse geocoding can be retried without saving a partial address', async () => {
  const h = await harness({ geocode: () => Promise.reject(new Error('offline')) });
  h.update({ picker: true, locationRequest: { ...origin, id: 1 } });
  await h.elements.confirm.fire('click');
  assert.equal(h.events.filter((e) => e.type === 'address').length, 0);
  assert.equal(h.elements.confirm.disabled, false);
});

test('route mode switches reuse results and keep individual mode failures isolated', async () => {
  const h = await harness({ compute: (request, route) => request.travelMode === 'TRANSIT'
    ? Promise.reject(new Error('No transit')) : Promise.resolve({ routes: [route()] }) });
  h.update({ origin, destination, travelMode: 'DRIVING' });
  await tick();
  assert.equal(h.requests.length, 3);
  h.update({ origin, destination, travelMode: 'WALKING' });
  await tick();
  assert.equal(h.requests.length, 3);
  assert.equal(h.events.find((e) => e.type === 'route' && e.mode === 'TRANSIT').duration, null);
  assert.equal(h.polylines.at(-1).map != null, true);
});

test('changing universities ignores routes that complete for the previous destination', async () => {
  const pending = [];
  const h = await harness({ compute: () => { const p = deferred(); pending.push(p); return p.promise; } });
  h.update({ origin, destination });
  await tick();
  const next = { lat: -12.1, lng: -77.1 };
  h.update({ origin, destination: next });
  await tick();
  pending.slice(3).forEach((p) => p.resolve({ routes: [h.route()] }));
  await tick();
  pending.slice(0, 3).forEach((p) => p.resolve({ routes: [h.route()] }));
  await tick();
  const routes = h.events.filter((e) => e.type === 'route');
  assert.equal(routes.length, 3);
  assert.ok(routes.every((e) => e.key === JSON.stringify([origin, next])));
});

test('older autocomplete responses cannot replace a newer query', async () => {
  const pending = [];
  const h = await harness({ autocomplete: () => { const p = deferred(); pending.push(p); return p.promise; } });
  h.update({ picker: true });
  await tick();
  await h.search('Grau');
  await h.search('Universitaria');
  const suggestion = (text) => ({ placePrediction: { text: { toString: () => text } } });
  pending[1].resolve({ suggestions: [suggestion('Universitaria')] });
  await tick();
  pending[0].resolve({ suggestions: [suggestion('Grau')] });
  await tick();
  assert.equal(h.elements.suggestions.children[0].textContent, 'Universitaria');
});

test('marker selection and detail navigation carry the room id', async () => {
  const h = await harness();
  h.update({ rooms: [{ ...origin, id: 7, address: '<script>bad()</script>', price: 'S/ 850' }] });
  const roomMarker = h.markers[0];
  roomMarker.listeners.click();
  assert.deepEqual(h.events.at(-1), { type: 'selectRoom', id: 7 });
  assert.equal(h.infos[0].content.children[0].textContent, '<script>bad()</script>');
  await h.infos[0].content.children[2].fire('click');
  assert.deepEqual(h.events.at(-1), { type: 'room', id: 7 });
  assert.equal(h.requests.length, 0);
  h.update({ rooms: [{ ...origin, id: 7, address: 'Lima', price: 'S/ 850' }], origin, destination });
  await tick();
  const markerCount = h.markers.length;
  h.update({ rooms: [{ ...origin, id: 7, address: 'Lima', price: 'S/ 850' }], origin, destination, travelMode: 'WALKING' });
  assert.equal(h.markers.length, markerCount);
});
