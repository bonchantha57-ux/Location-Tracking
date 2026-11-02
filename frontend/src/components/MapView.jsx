import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  
  // Persistent layers & markers to eliminate DOM thrashing and jittering ("ប្រកាច់ៗ")
  const markersGroupRef = useRef(null);
  const linesGroupRef = useRef(null);
  const friendMarkersMapRef = useRef(new Map());
  const myMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const polylineRef = useRef(null);

  const prevSelectedUserRef = useRef(null);

  const { myLocation, otherActiveUsers, mapStyle, setMapStyle, isSharing } = useTracking();
  const { currentUser } = useAuth();
  const [showLayerSelector, setShowLayerSelector] = useState(false);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = myLocation?.lat || 11.5564;
      const initialLng = myLocation?.lng || 104.9282;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        inertia: true,
        inertiaDeceleration: 3000
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

  // Center on user position smoothly
  const centerOnMe = useCallback(() => {
    if (mapInstanceRef.current && myLocation?.lat) {
      const currentZoom = mapInstanceRef.current.getZoom();
      const targetZoom = Math.max(currentZoom, 16);
      mapInstanceRef.current.flyTo([myLocation.lat, myLocation.lng], targetZoom, {
        animate: true,
        duration: 0.8
      });
    }
  }, [myLocation]);

  // Zoom helpers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  // 1. Smoothly update My Marker (without tearing down DOM)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    if (!myLocation?.lat) return;

    const userAvatar = currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid || 'guest'}`;
    const userName = currentUser?.displayName || (lang === 'km' ? 'អ្នក (You)' : 'You');

    if (!myMarkerRef.current) {
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

      const marker = L.marker([myLocation.lat, myLocation.lng], { icon: myIcon, zIndexOffset: 1000 });
      markersGroupRef.current.addLayer(marker);
      myMarkerRef.current = marker;
    } else {
      // Smooth position update
      myMarkerRef.current.setLatLng([myLocation.lat, myLocation.lng]);
    }

    // Accuracy Circle
    if (!accuracyCircleRef.current) {
      const circle = L.circle([myLocation.lat, myLocation.lng], {
        radius: myLocation.accuracy || 15,
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.12,
        weight: 1.5
      });
      markersGroupRef.current.addLayer(circle);
      accuracyCircleRef.current = circle;
    } else {
      accuracyCircleRef.current.setLatLng([myLocation.lat, myLocation.lng]);
      if (myLocation.accuracy) accuracyCircleRef.current.setRadius(myLocation.accuracy);
    }
  }, [myLocation?.lat, myLocation?.lng, myLocation?.accuracy, currentUser?.avatar, currentUser?.displayName, lang]);

  // 2. Smoothly update Friends' Markers (Preserve DOM instances so clicks & high zoom NEVER jitter)
  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const markersGroup = markersGroupRef.current;
    const friendMap = friendMarkersMapRef.current;
    const activeUids = new Set();

    otherActiveUsers.forEach((friend) => {
      if (!friend.location?.lat) return;
      activeUids.add(friend.uid);

      const isSelected = selectedUserId === friend.uid;
      const friendAvatar = friend.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.uid}`;
      const distanceStr = formatDistance(friend.distanceKm);

      if (friendMap.has(friend.uid)) {
        // Marker already exists: smoothly move coordinates (Zero flicker!)
        const existing = friendMap.get(friend.uid);
        existing.marker.setLatLng([friend.location.lat, friend.location.lng]);

        // Update popup content if open
        const popup = existing.marker.getPopup();
        if (popup && popup.isOpen()) {
          popup.setContent(`
            <div class="p-3 text-slate-800 min-w-[200px] font-sans">
              <div class="flex items-center space-x-2.5 mb-2">
                <img src="${friendAvatar}" class="w-8 h-8 rounded-full border-2 border-emerald-500 object-cover" />
                <div>
                  <p class="font-bold text-sm text-slate-900">${friend.displayName}</p>
                  <p class="text-[10px] text-slate-500 truncate">${friend.email}</p>
                </div>
              </div>
              <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
                <div class="flex justify-between items-center text-emerald-900 font-semibold">
                  <span>${lang === 'km' ? 'ចម្ងាយ' : 'Distance'}:</span>
                  <span class="bg-emerald-200 px-2 py-0.5 rounded">${distanceStr}</span>
                </div>
                <div class="text-[10px] text-slate-600 mt-1 flex justify-between">
                  <span>${formatSpeed(friend.location.speed)}</span>
                  <span>${timeAgo(friend.location.updatedAt, lang)}</span>
                </div>
              </div>
            </div>
          `);
        }
      } else {
        // Create new marker instance
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

        const marker = L.marker([friend.location.lat, friend.location.lng], { icon: friendIcon });
        
        marker.bindPopup(`
          <div class="p-3 text-slate-800 min-w-[200px] font-sans">
            <div class="flex items-center space-x-2.5 mb-2">
              <img src="${friendAvatar}" class="w-8 h-8 rounded-full border-2 border-emerald-500 object-cover" />
              <div>
                <p class="font-bold text-sm text-slate-900">${friend.displayName}</p>
                <p class="text-[10px] text-slate-500 truncate">${friend.email}</p>
              </div>
            </div>
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs">
              <div class="flex justify-between items-center text-emerald-900 font-semibold">
                <span>${lang === 'km' ? 'ចម្ងាយ' : 'Distance'}:</span>
                <span class="bg-emerald-200 px-2 py-0.5 rounded">${distanceStr}</span>
              </div>
              <div class="text-[10px] text-slate-600 mt-1 flex justify-between">
                <span>${formatSpeed(friend.location.speed)}</span>
                <span>${timeAgo(friend.location.updatedAt, lang)}</span>
              </div>
            </div>
          </div>
        `);

        marker.on('click', () => {
          if (onSelectUser) onSelectUser(friend);
        });

        markersGroup.addLayer(marker);
        friendMap.set(friend.uid, { marker, friend });
      }
    });

    // Remove friends who disconnected
    friendMap.forEach((val, uid) => {
      if (!activeUids.has(uid)) {
        markersGroup.removeLayer(val.marker);
        friendMap.delete(uid);
      }
    });

    // Update connection polyline to selected user
    if (linesGroupRef.current) {
      linesGroupRef.current.clearLayers();
      if (selectedUserId && myLocation?.lat) {
        const selected = otherActiveUsers.find(u => u.uid === selectedUserId);
        if (selected?.location?.lat) {
          const line = L.polyline(
            [
              [myLocation.lat, myLocation.lng],
              [selected.location.lat, selected.location.lng]
            ],
            {
              color: '#38bdf8',
              weight: 3,
              dashArray: '8, 8',
              opacity: 0.85
            }
          );
          linesGroupRef.current.addLayer(line);
        }
      }
    }

  }, [otherActiveUsers, selectedUserId, lang, myLocation?.lat, myLocation?.lng, onSelectUser]);

  // 3. Center on Selected User: ONLY when selectedUserId changes (NEVER spasm or fight max zoom!)
  useEffect(() => {
    if (selectedUserId && selectedUserId !== prevSelectedUserRef.current && mapInstanceRef.current) {
      prevSelectedUserRef.current = selectedUserId;
      const selected = otherActiveUsers.find(u => u.uid === selectedUserId);
      if (selected?.location?.lat) {
        const currentZoom = mapInstanceRef.current.getZoom();
        // PRESERVE user's max zoom if they are zoomed in close!
        const targetZoom = Math.max(currentZoom, 16);
        mapInstanceRef.current.flyTo(
          [selected.location.lat, selected.location.lng],
          targetZoom,
          { animate: true, duration: 0.8 }
        );
      }
    } else if (!selectedUserId) {
      prevSelectedUserRef.current = null;
    }
  }, [selectedUserId, otherActiveUsers]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Leaflet map container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Center On Me Button (Bottom Left, safely padded above mobile home bar) */}
      <button
        onClick={centerOnMe}
        title={lang === 'km' ? 'កំណត់ទីតាំងខ្ញុំ' : 'My Location'}
        className="absolute bottom-6 left-3 sm:left-4 z-20 flex items-center justify-center w-11 h-11 sm:w-auto sm:h-auto sm:px-3.5 sm:py-2.5 rounded-2xl bg-slate-900/95 text-cyan-400 border border-cyan-500/40 shadow-2xl backdrop-blur-md hover:bg-slate-800 transition active:scale-95 group font-bold text-xs"
      >
        <Navigation className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition" />
        <span className="hidden sm:inline sm:ml-2">{lang === 'km' ? 'ទីតាំងខ្ញុំ' : 'My Location'}</span>
      </button>

      {/* Sleek Touch-Friendly Zoom Controls (Right Middle - High touch targets) */}
      <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900/95 text-slate-100 hover:text-cyan-400 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-center transition active:scale-90 hover:border-cyan-500/50"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-900/95 text-slate-100 hover:text-cyan-400 border border-slate-700/80 shadow-2xl backdrop-blur-md flex items-center justify-center transition active:scale-90 hover:border-cyan-500/50"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Map Layer Selector Button & Dropdown (Top Left) */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20">
        <div className="relative">
          <button
            onClick={() => setShowLayerSelector(!showLayerSelector)}
            className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-3 sm:py-2 rounded-2xl bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md hover:border-cyan-500/50 hover:text-white transition active:scale-95 text-xs font-bold"
          >
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline sm:ml-2">{MAP_PROVIDERS[mapStyle]?.name || 'Map Layer'}</span>
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
