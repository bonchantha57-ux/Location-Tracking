import React, { useState } from 'react';
import { 
  Compass, 
  Gauge, 
  MapPin, 
  Radio, 
  Navigation,
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useTracking } from '../context/TrackingContext';
import { formatDistance, formatSpeed } from '../utils/geoUtils';

export default function HUDControls({ selectedUser, onClearSelected, lang = 'km', t }) {
  const { myLocation } = useTracking();
  const [mobileHudOpen, setMobileHudOpen] = useState(false);

  return (
    <>
      {/* Desktop Floating Telemetry Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-4 px-5 py-2.5 rounded-2xl glass-panel shadow-2xl border border-slate-700/60 backdrop-blur-xl">
        {/* Speed */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/60">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {t.speed}
            </div>
            <div className="text-xs font-bold text-white font-mono">
              {formatSpeed(myLocation.speed)}
            </div>
          </div>
        </div>

        {/* Heading */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/60">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Compass className="w-4 h-4 transform" style={{ transform: `rotate(${myLocation.heading || 0}deg)` }} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {t.heading}
            </div>
            <div className="text-xs font-bold text-white font-mono">
              {Math.round(myLocation.heading || 0)}&deg;
            </div>
          </div>
        </div>

        {/* Coordinates */}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/60">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              GPS Position
            </div>
            <div className="text-xs font-bold text-cyan-300 font-mono">
              {myLocation.lat ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}` : 'Detecting...'}
            </div>
          </div>
        </div>

        {/* Accuracy */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              {t.accuracy}
            </div>
            <div className="text-xs font-bold text-white font-mono">
              &plusmn;{myLocation.accuracy || 10} m
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Telemetry Pill / Bar */}
      <div className="md:hidden absolute bottom-6 right-4 z-20">
        <button
          onClick={() => setMobileHudOpen(!mobileHudOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/90 text-cyan-400 border border-slate-700 shadow-xl backdrop-blur-md text-xs font-mono font-bold"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{formatSpeed(myLocation.speed)}</span>
          {mobileHudOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {mobileHudOpen && (
          <div className="absolute bottom-12 right-0 w-64 glass-dropdown rounded-2xl p-3 border border-slate-700 shadow-2xl space-y-2 animate-fadeIn">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{t.speed}:</span>
              <span className="font-bold text-white font-mono">{formatSpeed(myLocation.speed)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{t.heading}:</span>
              <span className="font-bold text-white font-mono">{Math.round(myLocation.heading || 0)}&deg;</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">GPS:</span>
              <span className="font-bold text-cyan-300 font-mono text-[11px]">
                {myLocation.lat ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">{t.accuracy}:</span>
              <span className="font-bold text-emerald-400 font-mono">&plusmn;{myLocation.accuracy || 10} m</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Friend Tracking Banner HUD */}
      {selectedUser && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 p-2.5 sm:px-4 rounded-2xl glass-panel border border-cyan-500/40 shadow-2xl backdrop-blur-xl animate-fadeIn max-w-[92vw]">
          <div className="relative shrink-0">
            <img
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.uid}`}
              alt={selectedUser.displayName}
              className="w-9 h-9 rounded-xl border border-cyan-400 object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-900 animate-ping" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate max-w-[120px] sm:max-w-[200px]">
                {selectedUser.displayName}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                <Navigation className="w-3 h-3 text-cyan-400" />
                {formatDistance(selectedUser.distanceKm)}
              </span>
              <span className="text-slate-400 text-[10px]">
                {formatSpeed(selectedUser.location?.speed)}
              </span>
            </div>
          </div>

          <button
            onClick={onClearSelected}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
