// This document is shared by the native WebView and the web iframe. All Google
// requests originate here, so Places sessions and Maps key restrictions agree.
export function scriptJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

export function createMapDocument(apiKey: string): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="strict-origin-when-cross-origin">
<style>
*{box-sizing:border-box}html,body{height:100%;margin:0;font:15px system-ui;color:#111827}
body{display:flex;flex-direction:column;background:#fff}#map{flex:1;min-height:140px}
#picker{display:none;padding:10px;position:relative}input,button{font:inherit}
input{width:100%;padding:12px;border:1px solid #9ca3af;border-radius:8px}
button{min-height:44px;border:0;border-radius:8px;padding:10px;background:#2563eb;color:#fff;cursor:pointer}
button:disabled{opacity:.5}#suggestions{position:absolute;top:58px;left:10px;right:10px;z-index:5;background:#fff;max-height:230px;overflow:auto;box-shadow:0 4px 12px #0003}
#suggestions button{display:block;width:100%;background:#fff;color:#111827;text-align:left;border-bottom:1px solid #e5e7eb;border-radius:0}
#status{margin:0;padding:8px 10px;color:#374151;font-size:13px}#confirm{display:none;margin:0 10px 10px}
.info{max-width:230px}.info p{margin:8px 0}
</style></head><body>
<div id="picker"><input id="search" aria-label="Buscar dirección" placeholder="Calle, número, distrito y ciudad" autocomplete="off" maxlength="255"><div id="suggestions" role="group" aria-label="Sugerencias de Google Maps"></div></div>
<div id="map" aria-label="Mapa de Google"></div><p id="status" role="status">Cargando Google Maps…</p>
<button id="confirm" disabled>Confirmar este punto</button>
<script>
(function(){
  'use strict';
  const key = ${scriptJson(apiKey)};
  const channel = 'muvu-map';
  const send = function(event) {
    const payload = JSON.stringify(event);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(payload);
    else window.parent.postMessage({channel:channel, payload:payload}, '*');
  };
  const status = document.getElementById('status');
  const search = document.getElementById('search');
  const suggestions = document.getElementById('suggestions');
  const confirm = document.getElementById('confirm');
  let state = {}, maps, map, places, geocoder, info, pin, draft;
  let overlays = [], routeMarkers = [], polylines = [], routeCache = {}, routeKey = '', markersKey = '', activeMarker;
  let routeVersion = 0, searchVersion = 0, selectionVersion = 0, searchTimer, sessionToken;
  let lastLocationId, pickerInitialized = false, placesLoading = false;
  async function loadPlaces() {
    if(places || placesLoading) return;
    placesLoading=true;
    try {places=await maps.importLibrary('places');}
    catch {error('No se pudo cargar Places. Puedes seleccionar y confirmar un punto en el mapa.');}
    finally {placesLoading=false;}
  }
  function error(message) { status.textContent = message; }
  function clearRoute() { polylines.forEach(function(line){line.setMap(null)}); polylines = []; }
  function point(location) { return {lat:location.lat(), lng:location.lng()}; }
  function valid(p) { return p && Number.isFinite(p.lat) && Math.abs(p.lat)<=90 && Number.isFinite(p.lng) && Math.abs(p.lng)<=180; }
  function fit(points) {
    const bounds = new maps.LatLngBounds();
    points.forEach(function(p){bounds.extend(p)});
    if (points.length > 1) map.fitBounds(bounds, 40);
    else if (points.length) { map.setCenter(points[0]); map.setZoom(16); }
  }
  function marker(position, title, label, color, collection) {
    const item = new maps.Marker({map:map,position:position,title:title,label:{text:label,color:'#fff',fontWeight:'700'},
      icon:{path:maps.SymbolPath.CIRCLE,scale:12,fillColor:color,fillOpacity:1,strokeColor:'#fff',strokeWeight:3}});
    (collection || overlays).push(item); return item;
  }
  function setDraft(p) {
    if (!valid(p)) return;
    selectionVersion++; searchVersion++; clearTimeout(searchTimer); suggestions.replaceChildren();
    draft = p; confirm.disabled = false;
    if (!pin) {
      pin = new maps.Marker({map:map,position:p,draggable:true,title:'Ubicación de la habitación'});
      pin.addListener('dragend',function(event){setDraft(point(event.latLng))});
    } else pin.setPosition(p);
    map.panTo(p); error('Ajusta el marcador o toca el mapa y confirma el punto.');
  }
  async function commitAddress(address, p, version) {
    if (version !== selectionVersion) return;
    if (!address || address.length > 255 || !valid(p)) { error('Elige una dirección válida de hasta 255 caracteres.'); return; }
    draft = p; search.value = address; confirm.disabled = true;
    error('Ubicación confirmada.');
    send({type:'address', address:address, point:p});
  }
  confirm.addEventListener('click',async function(){
    if (!draft) return;
    const p = draft, version = ++selectionVersion;
    confirm.disabled = true; error('Buscando la dirección del punto…');
    try {
      const result = await geocoder.geocode({location:p});
      const address = result.results[0] && result.results[0].formatted_address;
      if (!address) throw new Error('No address');
      await commitAddress(address,p,version);
    } catch { if(version===selectionVersion){confirm.disabled=false;error('No se pudo obtener la dirección. Prueba otro punto o vuelve a confirmar.');} }
  });
  search.addEventListener('input',function(){
    clearTimeout(searchTimer); const version = ++searchVersion; selectionVersion++;
    suggestions.replaceChildren();
    const input = search.value.trim();
    if (input.length < 3 || !places) return;
    searchTimer = setTimeout(async function(){
      error('Buscando direcciones…');
      try {
        if (!sessionToken) sessionToken = new places.AutocompleteSessionToken();
        const result = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({input:input,sessionToken:sessionToken,includedRegionCodes:['pe'],language:'es',region:'pe'});
        if (version !== searchVersion) return;
        suggestions.replaceChildren();
        result.suggestions.forEach(function(suggestion){
          const prediction = suggestion.placePrediction; if(!prediction) return;
          const button = document.createElement('button'); button.type = 'button'; button.textContent = prediction.text.toString();
          button.addEventListener('click',async function(){
            const selection = ++selectionVersion; ++searchVersion;
            suggestions.replaceChildren(); error('Obteniendo dirección…');
            try {
              const place = prediction.toPlace();
              await place.fetchFields({fields:['formattedAddress','location']});
              if (selection !== selectionVersion) return;
              if (!place.location || !place.formattedAddress) throw new Error('No location');
              const p = point(place.location);
              setDraft(p); map.setZoom(17);
              await commitAddress(place.formattedAddress,p,selectionVersion);
            } catch { if(selection===selectionVersion) error('No se pudo seleccionar la dirección. Inténtalo otra vez.'); }
            finally {sessionToken = null;}
          }); suggestions.append(button);
        });
        error(result.suggestions.length ? 'Selecciona una dirección. Resultados de Google Maps.' : 'Sin resultados. Incluye calle, distrito y ciudad.');
      } catch { if(version===searchVersion) error('No se pudieron buscar direcciones. Revisa la conexión y la configuración de Places API (New).'); }
    },350);
  });
  async function routes() {
    const mode = state.travelMode || 'DRIVING';
    const nextKey = JSON.stringify([state.origin,state.destination]);
    if (nextKey === routeKey) {
      clearRoute();
      const cached = routeCache[mode];
      if(cached) { polylines=cached.createPolylines();polylines.forEach(function(line){line.setMap(map)}); }
      return;
    }
    routeKey = nextKey; const version = ++routeVersion;
    clearRoute(); routeCache = {};
    routeMarkers.forEach(function(item){item.setMap(null)});routeMarkers=[];
    if(valid(state.origin) && !(state.rooms||[]).some(function(room){return room.lat===state.origin.lat && room.lng===state.origin.lng})) {
      marker(state.origin,'Habitación','H','#2563eb',routeMarkers);
    }
    if(valid(state.origin) && !valid(state.destination)) fit([state.origin]);
    if (!valid(state.origin) || !valid(state.destination)) return;
    const origin=state.origin, destination=state.destination;
    if(!state.center || state.center.lat!==destination.lat || state.center.lng!==destination.lng) {
      marker(destination,state.centerTitle||'Universidad','U','#7c3aed',routeMarkers);
    }
    fit([origin,destination]); error('Calculando rutas…');
    try {
      const library = await maps.importLibrary('routes');
      if(version!==routeVersion) return;
      await Promise.all(['DRIVING','TRANSIT','WALKING'].map(async function(travelMode){
        try {
          const result = await library.Route.computeRoutes({origin:origin,destination:destination,travelMode:travelMode,fields:['path','localizedValues']});
          if(version!==routeVersion) return;
          const route = result.routes && result.routes[0];
          if(route) routeCache[travelMode] = route;
          send({type:'route',key:nextKey,mode:travelMode,duration:route ? (route.localizedValues && route.localizedValues.duration || 'Disponible') : null});
        } catch { if(version===routeVersion) send({type:'route',key:nextKey,mode:travelMode,duration:null}); }
      }));
      if(version!==routeVersion) return;
      const selected = routeCache[state.travelMode || 'DRIVING'];
      if(selected) {polylines=selected.createPolylines();polylines.forEach(function(line){line.setMap(map)});}
      error(Object.keys(routeCache).length ? 'Selecciona un medio de transporte para ver su ruta.' : 'No hay rutas disponibles. Puedes abrir el trayecto en Google Maps.');
    } catch {
      if(version!==routeVersion) return;
      ['DRIVING','TRANSIT','WALKING'].forEach(function(mode){send({type:'route',key:nextKey,mode:mode,duration:null})});
      error('No se pudieron calcular rutas. Revisa la conexión y Routes API.');
    }
  }
  function render() {
    if (!map) return;
    document.getElementById('picker').style.display = state.picker ? 'block' : 'none';
    confirm.style.display = state.picker ? 'block' : 'none';
    if(state.picker) {
      void loadPlaces();
      if(!pickerInitialized) {
        pickerInitialized = true; search.value = state.address || '';
        if(valid(state.center)) {setDraft(state.center);confirm.disabled=true;error('Ubicación guardada. Puedes elegir otra dirección o mover el punto.');}
      }
      if(state.locationRequest && state.locationRequest.id!==lastLocationId) {
        lastLocationId=state.locationRequest.id; setDraft(state.locationRequest); map.setZoom(17);
      }
      return;
    }
    const nextMarkersKey=JSON.stringify([state.rooms,state.center,state.radiusKm,state.centerTitle]);
    if(nextMarkersKey!==markersKey) {
      markersKey=nextMarkersKey; overlays.forEach(function(item){item.setMap(null)}); overlays=[]; activeMarker=null;info.close();
      const positions=[];
      (state.rooms||[]).forEach(function(room,index){
        if(!valid(room)) return; positions.push(room);
        const item=marker(room,room.address,String(index+1),'#2563eb');
        item.addListener('click',function(){
          if(activeMarker) activeMarker.setIcon({path:maps.SymbolPath.CIRCLE,scale:12,fillColor:'#2563eb',fillOpacity:1,strokeColor:'#fff',strokeWeight:3});
          activeMarker=item;item.setIcon({path:maps.SymbolPath.CIRCLE,scale:14,fillColor:'#f59e0b',fillOpacity:1,strokeColor:'#fff',strokeWeight:3});
          const content=document.createElement('div');content.className='info';
          const address=document.createElement('p');address.textContent=room.address;
          const price=document.createElement('p');price.textContent=room.price+' / mes';
          const button=document.createElement('button');button.textContent='Ver habitación';
          button.addEventListener('click',function(){send({type:'room',id:room.id})});
          content.append(address,price,button); info.setContent(content);info.open({map:map,anchor:item});
          send({type:'selectRoom',id:room.id});
        });
      });
      if(valid(state.center)) {
        positions.push(state.center);marker(state.center,state.centerTitle||'Universidad','U','#7c3aed');
        if(state.radiusKm>0) {
          const circle=new maps.Circle({map:map,center:state.center,radius:state.radiusKm*1000,fillColor:'#2563eb',fillOpacity:.12,strokeColor:'#2563eb',strokeWeight:2,clickable:false});
          overlays.push(circle);map.fitBounds(circle.getBounds(),16);
        } else fit(positions);
      } else fit(positions);
    }
    void routes();
  }
  window.__muvuUpdate=function(next){state=next;render()};
  window.addEventListener('message',function(event){
    if(event.source!==window.parent || !event.data || event.data.channel!==channel) return;
    window.__muvuUpdate(event.data.state);
  });
  window.gm_authFailure=function(){
    clearTimeout(timeout);send({type:'error',message:'Google rechazó la clave. Revisa Maps JavaScript API, facturación y el origen autorizado.'});
  };
  const timeout=setTimeout(function(){send({type:'error',message:'Google Maps tardó demasiado. Comprueba tu conexión y vuelve a intentar.'})},20000);
  window.__muvuReady=async function(){
    clearTimeout(timeout);
    try {
      maps=window.google.maps;
      await maps.importLibrary('maps');
      map=new maps.Map(document.getElementById('map'),{center:{lat:-12.0464,lng:-77.0428},zoom:12,mapTypeControl:false,streetViewControl:false,fullscreenControl:false,gestureHandling:'greedy'});
      geocoder=new maps.Geocoder();info=new maps.InfoWindow();
      map.addListener('click',function(event){if(state.picker) setDraft(point(event.latLng))});
      error('');render();send({type:'ready'});
    } catch {send({type:'error',message:'No se pudo iniciar Google Maps. Comprueba las APIs habilitadas.'});}
  };
  const script=document.createElement('script');
  script.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&loading=async&callback=__muvuReady&v=weekly&language=es&region=PE';
  script.async=true;
  script.onerror=function(){clearTimeout(timeout);send({type:'error',message:'No se pudo conectar con Google Maps.'})};
  document.head.append(script);
})();
</script></body></html>`;
}
