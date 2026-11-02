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
      {/* Desktop Floating Telemetry Bar (Centered Bottom) */}
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
            <Compass className="w-4 h-4 transform transition-transform duration-500" style={{ transform: `rotate(${myLocation.heading || 0}deg)` }} />
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

      {/* Mobile Telemetry Pill / Bar (Bottom Right, compact and touch friendly) */}
      <div className="md:hidden absolute bottom-6 right-3 z-20">
        <button
          onClick={() => setMobileHudOpen(!mobileHudOpen)}
          className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-2xl bg-slate-900/95 text-cyan-400 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-mono font-bold active:scale-95 transition"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{formatSpeed(myLocation.speed)}</span>
          {mobileHudOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {mobileHudOpen && (
          <div className="absolute bottom-12 right-0 w-60 glass-dropdown rounded-2xl p-3 border border-slate-700/90 shadow-2xl space-y-2 animate-fadeIn z-30">
            <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">{t.speed}:</span>
              <span className="font-bold text-white font-mono">{formatSpeed(myLocation.speed)}</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">{t.heading}:</span>
              <span className="font-bold text-white font-mono">{Math.round(myLocation.heading || 0)}&deg;</span>
            </div>
            <div className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-800">
              <span className="text-slate-400 font-semibold">GPS:</span>
              <span className="font-bold text-cyan-300 font-mono text-[11px]">
                {myLocation.lat ? `${myLocation.lat.toFixed(4)}, ${myLocation.lng.toFixed(4)}` : '--'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold">{t.accuracy}:</span>
              <span className="font-bold text-emerald-400 font-mono">&plusmn;{myLocation.accuracy || 10} m</span>
            </div>
          </div>
        )}
      </div>

      {/* Selected Friend Tracking Card - Positioned Cleanly above bottom bar on Mobile, never blocking map view */}
      {selectedUser && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 p-3 sm:px-4 rounded-2xl glass-panel border border-cyan-400/60 shadow-2xl backdrop-blur-2xl animate-slideUp w-[90vw] max-w-sm">
          <div className="relative shrink-0">
            <img
              src={selectedUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.uid}`}
              alt={selectedUser.displayName}
              className="w-10 h-10 rounded-xl border border-cyan-400 object-cover"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white truncate max-w-[130px] sm:max-w-[180px]">
                {selectedUser.displayName}
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-xs mt-0.5">
              <span className="text-cyan-300 font-bold flex items-center gap-1">
                <Navigation className="w-3 h-3 text-cyan-400" />
                {formatDistance(selectedUser.distanceKm)}
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                {formatSpeed(selectedUser.location?.speed)}
              </span>
            </div>
          </div>

          <button
            onClick={onClearSelected}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
