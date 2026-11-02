/**
 * Geographic calculation utilities for MAP TRACKING
 */

// Calculate distance between two points in kilometers using Haversine formula
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance nicely: e.g. "450 m" or "3.8 km"
export function formatDistance(distanceKm) {
  if (distanceKm === undefined || distanceKm === null) return '--';
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(2)} km`;
}

// Calculate compass bearing from point 1 to point 2
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = Math.atan2(y, x);
  return (toDeg(brng) + 360) % 360;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

// Format speed from meters/sec to km/h
export function formatSpeed(speedMps) {
  if (!speedMps || speedMps < 0) return '0.0 km/h';
  const kmh = speedMps * 3.6;
  return `${kmh.toFixed(1)} km/h`;
}

// Relative time formatting
export function timeAgo(timestamp, lang = 'km') {
  if (!timestamp) return lang === 'km' ? 'ទើបតែឥឡូវ' : 'Just now';
  const now = Date.now();
  const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 10) return lang === 'km' ? 'ទើបតែឥឡូវ' : 'Just now';
  if (diffSec < 60) return lang === 'km' ? `${diffSec} វិនាទីមុន` : `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return lang === 'km' ? `${diffMin} នាទីមុន` : `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return lang === 'km' ? `${diffHour} ម៉ោងមុន` : `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return lang === 'km' ? `${diffDay} ថ្ងៃមុន` : `${diffDay}d ago`;
}

