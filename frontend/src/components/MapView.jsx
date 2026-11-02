import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, Navigation, Plus, Minus, Check } from 'lucide-react';
import { useTracking } from '../context/TrackingContext';
import { useAuth } from '../context/AuthContext';
import { formatDistance, formatSpeed, timeAgo } from '../utils/geoUtils';

// 100% Free, NO API KEY REQUIRED, Zero Watermark Tile Layers
const MAP_PROVIDERS = {
  satellite: {
    name: 'ផ្កាយរណប (Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  },
  streets: {
    name: 'ផ្លូវ (Streets)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  },
  dark: {
    name: 'រាត្រី (Dark Cyber)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 16,
    attribution: 'Tiles &copy; Esri'
  },
  topo: {
    name: 'ដីធម្មជាតិ (Terrain/Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    attribution: 'Tiles &copy; Esri'
  }
};

export default function MapView({ selectedUserId, onSelectUser, lang = 'km' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersGroupRef = useRef(null);
  const linesGroupRef = useRef(null);
  const accuracyCircleRef = useRef(null);

  const { myLocation, otherActiveUsers, mapStyle, setMapStyle, isSharing } = useTracking();
  const { currentUser } = useAuth();
  const [showLayerSelector, setShowLayerSelector] = useState(false);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = myLocation?.lat || 11.5564;
      const initialLng = myLocation?.lng || 104.9282;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: false, // NO default ugly zoom control to avoid mobile overlaps!
        attributionControl: false
      });

      // Add Tile Layer
      const initialCfg = MAP_PROVIDERS[mapStyle] || MAP_PROVIDERS.satellite;
      tileLayerRef.current = L.tileLayer(initialCfg.url, {
        maxZoom: initialCfg.maxZoom,
        attribution: initialCfg.attribution
      }).addTo(map);

      markersGroupRef.current = L.layerGroup().addTo(map);
      linesGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {};
  }, []);

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const cfg = MAP_PROVIDERS[mapStyle] || MAP_PROVIDERS.satellite;
    tileLayerRef.current.setUrl(cfg.url);
  }, [mapStyle]);

  // Center on user position
  const centerOnMe = () => {
    if (mapInstanceRef.current && myLocation?.lat) {
      mapInstanceRef.current.flyTo([myLocation.lat, myLocation.lng], 16, {
        animate: true,
        duration: 1.2
      });
    }
  };

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // Update Markers & Connections
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;

    const markersGroup = markersGroupRef.current;
    const linesGroup = linesGroupRef.current;
    markersGroup.clearLayers();
    linesGroup.clearLayers();

    // 1. Current User Marker
    if (myLocation?.lat) {
      const userAvatar = currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid || 'guest'}`;
      const userName = currentUser?.displayName || (lang === 'km' ? 'អ្នក (You)' : 'You');

      const myIcon = L.divIcon({
        className: 'custom-user-marker',
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        html: `
          <div class="relative flex items-center justify-center w-13 h-13 cursor-pointer group">
            <span class="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping"></span>
            <span class="absolute inline-flex h-11 w-11 rounded-full bg-cyan-500/30 border-2 border-cyan-400"></span>
            <div class="relative w-10 h-10 rounded-full border-2 border-cyan-400 bg-slate-900 overflow-hidden shadow-lg shadow-cyan-500/50 flex items-center justify-center">
              <img src="${userAvatar}" alt="${userName}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow border border-white/30 whitespace-nowrap">
              ${lang === 'km' ? 'ទីតាំងអ្នក' : 'YOU'}
            </div>
          </div>
        `
      });

      const userMarker = L.marker([myLocation.lat, myLocation.lng], { icon: myIcon });
      
      const popupHtml = `
        <div class="p-3 text-slate-800 font-sans min-w-[200px]">
          <div class="flex items-center space-x-2.5 mb-2">
            <img src="${userAvatar}" class="w-8 h-8 rounded-full border border-cyan-500" />
            <div>
              <p class="font-bold text-sm text-slate-900">${userName}</p>
              <span class="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                ● ${isSharing ? (lang === 'km' ? 'កំពុងបើក GPS' : 'GPS Active') : (lang === 'km' ? 'បិទការចែករំលែក' : 'Hidden')}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-1 text-xs bg-slate-100 p-2 rounded-lg">
            <div><span class="text-slate-500">${lang === 'km' ? 'ល្បឿន' : 'Speed'}:</span> <b>${formatSpeed(myLocation.speed)}</b></div>
            <div><span class="text-slate-500">${lang === 'km' ? 'កម្ពស់' : 'Alt'}:</span> <b>${Math.round(myLocation.altitude || 0)}m</b></div>
          </div>
        </div>
      `;
      userMarker.bindPopup(popupHtml);
      markersGroup.addLayer(userMarker);

      // Accuracy circle
      if (accuracyCircleRef.current) {
        markersGroup.removeLayer(accuracyCircleRef.current);
      }
      accuracyCircleRef.current = L.circle([myLocation.lat, myLocation.lng], {
        radius: myLocation.accuracy || 20,
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.12,
        weight: 1.5
      });
      markersGroup.addLayer(accuracyCircleRef.current);
    }

    // 2. Render Other Connected REAL Users
    otherActiveUsers.forEach((friend) => {
      if (!friend.location?.lat) return;

      const isSelected = selectedUserId === friend.uid;
      const friendAvatar = friend.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.uid}`;
      const distanceStr = formatDistance(friend.distanceKm);

      const friendIcon = L.divIcon({
        className: 'custom-friend-marker',
        iconSize: [52, 52],
        iconAnchor: [26, 26],
        html: `
          <div class="relative flex items-center justify-center w-13 h-13 cursor-pointer group">
            <span class="absolute inline-flex h-full w-full rounded-full ${isSelected ? 'bg-amber-400' : 'bg-emerald-400'} opacity-50 animate-ping"></span>
            <div class="relative w-10 h-10 rounded-full border-2 ${isSelected ? 'border-amber-400 ring-4 ring-amber-400/40' : 'border-emerald-400'} bg-slate-900 overflow-hidden shadow-lg flex items-center justify-center">
              <img src="${friendAvatar}" alt="${friend.displayName}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-2.5 bg-slate-900/95 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow border border-emerald-500/50 whitespace-nowrap flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ${distanceStr}
            </div>
          </div>
        `
      });

      const friendMarker = L.marker([friend.location.lat, friend.location.lng], { icon: friendIcon });
      
      const popupContent = `
        <div class="p-3 text-slate-800 min-w-[210px] font-sans">
          <div class="flex items-center space-x-2.5 mb-2">
            <img src="${friendAvatar}" class="w-8 h-8 rounded-full border-2 border-emerald-500" />
            <div>
              <p class="font-bold text-sm text-slate-900">${friend.displayName}</p>
              <p class="text-[11px] text-slate-500 truncate">${friend.email}</p>
            </div>
          </div>
          <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
            <div class="flex justify-between items-center text-emerald-900 font-semibold">
              <span>${lang === 'km' ? 'ចម្ងាយ' : 'Distance'}:</span>
              <span class="bg-emerald-200 px-2 py-0.5 rounded">${distanceStr}</span>
            </div>
            <div class="text-[11px] text-slate-600 mt-1 flex justify-between">
              <span>${formatSpeed(friend.location.speed)}</span>
              <span>${timeAgo(friend.location.updatedAt, lang)}</span>
            </div>
          </div>
        </div>
      `;

      friendMarker.bindPopup(popupContent);
      friendMarker.on('click', () => {
        if (onSelectUser) onSelectUser(friend);
      });

      markersGroup.addLayer(friendMarker);

      // Polyline to selected friend
      if (isSelected && myLocation?.lat) {
        const polyline = L.polyline(
          [
            [myLocation.lat, myLocation.lng],
            [friend.location.lat, friend.location.lng]
          ],
          {
            color: '#38bdf8',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.85
          }
        );
        linesGroup.addLayer(polyline);
      }
    });

  }, [myLocation, otherActiveUsers, selectedUserId, lang, currentUser, isSharing]);

  // Center on selected user
  useEffect(() => {
    if (selectedUserId && mapInstanceRef.current) {
      const selected = otherActiveUsers.find(u => u.uid === selectedUserId);
      if (selected?.location?.lat) {
        mapInstanceRef.current.flyTo(
          [selected.location.lat, selected.location.lng],
          16,
          { animate: true, duration: 1 }
        );
      }
    }
  }, [selectedUserId, otherActiveUsers]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Center On Me Button (Bottom Left) */}
      <button
        onClick={centerOnMe}
        title={lang === 'km' ? 'កំណត់ទីតាំងខ្ញុំ' : 'My Location'}
        className="absolute bottom-6 left-4 z-20 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 text-cyan-400 border border-cyan-500/40 shadow-2xl backdrop-blur-md hover:bg-slate-800 transition active:scale-95 group font-bold text-xs"
      >
        <Navigation className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
        <span className="hidden sm:inline">{lang === 'km' ? 'ទីតាំងខ្ញុំ' : 'My Location'}</span>
      </button>

      {/* Custom Sleek Zoom Controls (Right Middle - NEVER overlaps bottom bar!) */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-10 h-10 rounded-xl bg-slate-900/90 text-slate-200 hover:text-cyan-400 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center justify-center transition active:scale-95 hover:border-cyan-500/50"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-10 h-10 rounded-xl bg-slate-900/90 text-slate-200 hover:text-cyan-400 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center justify-center transition active:scale-95 hover:border-cyan-500/50"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Map Layer Selector Button & Dropdown (Top Left) */}
      <div className="absolute top-4 left-4 z-20">
        <div className="relative">
          <button
            onClick={() => setShowLayerSelector(!showLayerSelector)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-slate-900/90 text-slate-200 border border-slate-700/80 shadow-xl backdrop-blur-md hover:border-cyan-500/50 hover:text-white transition active:scale-95 text-xs font-bold"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">{MAP_PROVIDERS[mapStyle]?.name || 'Map Layer'}</span>
          </button>

          {showLayerSelector && (
            <div className="absolute top-12 left-0 w-52 glass-dropdown rounded-2xl p-2 shadow-2xl border border-slate-700/80 space-y-1 animate-fadeIn z-30">
              <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {lang === 'km' ? 'ជ្រើសរើសប្រភេទផែនទី' : 'Select Map Style'}
              </div>
              {Object.entries(MAP_PROVIDERS).map(([key, provider]) => (
                <button
                  key={key}
                  onClick={() => {
                    setMapStyle(key);
                    setShowLayerSelector(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    mapStyle === key
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <span>{provider.name}</span>
                  {mapStyle === key && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
