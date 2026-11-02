import React, { useState } from 'react';
import { Users, ChevronRight, ChevronLeft, Navigation, X } from 'lucide-react';
import { useTracking } from '../context/TrackingContext';
import { formatDistance, formatSpeed } from '../utils/geoUtils';

export default function ActiveTrackersPanel({ selectedUserId, onSelectUser, onOpenShare, lang = 'km', t }) {
  const { otherActiveUsers } = useTracking();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Floating Pill Button (Bottom Right) */}
      <div className="md:hidden absolute top-20 right-4 z-20">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/95 text-emerald-400 border border-emerald-500/40 shadow-xl backdrop-blur-md active:scale-95 text-xs font-bold"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Users className="w-3.5 h-3.5" />
          <span>{otherActiveUsers.length}</span>
        </button>
      </div>

      {/* Desktop Side Panel */}
      <div className={`hidden md:block absolute top-20 right-4 z-20 transition-all duration-300 ${
        !isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-42px)]'
      }`}>
        <div className="flex items-start">
          {/* Toggle Tab */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="mt-3 p-2 rounded-l-xl bg-slate-900/90 text-cyan-400 border-l border-t border-b border-cyan-500/30 backdrop-blur-md shadow-xl hover:bg-slate-800 transition"
            title={isOpen ? "Open Panel" : "Collapse Panel"}
          >
            {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>

          {/* Panel Card */}
          <div className="w-72 sm:w-80 glass-panel rounded-2xl rounded-tl-none border border-slate-700/70 shadow-2xl p-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  {t.activeFriends}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                {otherActiveUsers.length} {lang === 'km' ? 'នាក់' : 'live'}
              </span>
            </div>

            {/* List */}
            <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
              {otherActiveUsers.length === 0 ? (
                <div className="py-6 text-center text-slate-400 space-y-2.5">
                  <p className="text-xs">{t.noFriendsYet}</p>
                  <button
                    onClick={onOpenShare}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow transition"
                  >
                    {t.shareLocation}
                  </button>
                </div>
              ) : (
                otherActiveUsers.map((friend) => {
                  const isSelected = selectedUserId === friend.uid;
                  const distanceStr = formatDistance(friend.distanceKm);

                  return (
                    <div
                      key={friend.uid}
                      onClick={() => onSelectUser(friend)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 shadow-lg shadow-cyan-950'
                          : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={friend.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.uid}`}
                            alt={friend.displayName}
                            className="w-9 h-9 rounded-xl border border-emerald-400/50 object-cover"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-white truncate">
                            {friend.displayName}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5 text-cyan-300 font-semibold">
                              <Navigation className="w-2.5 h-2.5" />
                              {distanceStr}
                            </span>
                            <span>•</span>
                            <span>{formatSpeed(friend.location?.speed)}</span>
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isSelected ? (lang === 'km' ? 'កំពុងមើល' : 'Tracking') : (lang === 'km' ? 'មើល' : 'View')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet Modal when clicking mobile pill */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-900 border-t border-slate-700 rounded-t-3xl p-4 safe-pb max-h-[70vh] overflow-y-auto animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">{t.activeFriends}</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  {otherActiveUsers.length}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {otherActiveUsers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-3">
                  <p className="text-xs">{t.noFriendsYet}</p>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onOpenShare();
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-xs font-bold shadow"
                  >
                    {t.shareLocation}
                  </button>
                </div>
              ) : (
                otherActiveUsers.map((friend) => (
                  <div
                    key={friend.uid}
                    onClick={() => {
                      onSelectUser(friend);
                      setIsOpen(false);
                    }}
                    className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${friend.uid}`}
                        alt={friend.displayName}
                        className="w-10 h-10 rounded-xl border border-emerald-400 object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-white">{friend.displayName}</p>
                        <p className="text-[11px] text-cyan-300 font-semibold">
                          {formatDistance(friend.distanceKm)} {lang === 'km' ? 'ពីអ្នក' : 'away'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-cyan-600 text-white">
                      {lang === 'km' ? 'មើល' : 'View'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
