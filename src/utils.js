// ==================================================
// FILE: src/utils.js - Shared Utility Functions
// ==================================================

// Format large numbers with K, M, B, T suffixes
export const formatNumber = (n) => {
  if (n == null) return '--';
  if (n >= 1e12) return (n / 1e12).toFixed(2) + 'T';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Number(n).toFixed(2);
};

// Format price with appropriate decimal places
export const formatPrice = (p) => {
  if (p == null) return '--';
  if (p >= 1000) return '$' + Number(p).toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1) return '$' + Number(p).toFixed(2);
  if (p >= 0.0001) return '$' + Number(p).toFixed(6);
  return '$' + Number(p).toFixed(10);
};

// Get RSI styling information based on value
export const getRsiStyle = (rsi) => {
  if (rsi === null) {
    return {
      bg: 'bg-gray-700/30 border-gray-600/30',
      text: 'text-gray-500',
      label: '...',
      dot: 'bg-gray-500'
    };
  }
  if (rsi < 20) {
    return {
      bg: 'bg-red-500/20 border-red-500/40',
      text: 'text-red-400',
      label: 'EXTREME',
      dot: 'bg-red-500'
    };
  }
  if (rsi < 30) {
    return {
      bg: 'bg-orange-500/20 border-orange-500/40',
      text: 'text-orange-400',
      label: 'OVERSOLD',
      dot: 'bg-orange-500'
    };
  }
  if (rsi < 40) {
    return {
      bg: 'bg-yellow-500/20 border-yellow-500/40',
      text: 'text-yellow-400',
      label: 'WEAK',
      dot: 'bg-yellow-500'
    };
  }
  if (rsi < 60) {
    return {
      bg: 'bg-gray-500/20 border-gray-500/30',
      text: 'text-gray-300',
      label: 'NEUTRAL',
      dot: 'bg-gray-400'
    };
  }
  if (rsi < 70) {
    return {
      bg: 'bg-emerald-500/20 border-emerald-500/40',
      text: 'text-emerald-400',
      label: 'STRONG',
      dot: 'bg-emerald-500'
    };
  }
  return {
    bg: 'bg-green-500/20 border-green-500/40',
    text: 'text-green-400',
    label: 'OVERBOUGHT',
    dot: 'bg-green-500'
  };
};

// Constants
export const CATEGORIES = [
  { id: 'all', name: 'All', icon: '🌍' },
  { id: 'layer-1', name: 'L1/L2', icon: '⛓️' },
  { id: 'defi', name: 'DeFi', icon: '🦄' },
  { id: 'meme', name: 'Meme', icon: '🐸' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'ai', name: 'AI', icon: '🤖' },
];

export const PRESETS = [
  { id: 'oversold', name: '🔴 Oversold <30', filter: t => t.rsi !== null && t.rsi < 30, sort: 'rsi_asc' },
  { id: 'extreme', name: '🚨 Extreme <20', filter: t => t.rsi !== null && t.rsi < 20, sort: 'rsi_asc' },
  { id: 'overbought', name: '🟢 Overbought >70', filter: t => t.rsi !== null && t.rsi > 70, sort: 'rsi_desc' },
  { id: 'losers24h', name: '📉 24h Losers', filter: () => true, sort: 'change24h_asc' },
  { id: 'losers7d', name: '📉 7d Losers', filter: () => true, sort: 'change7d_asc' },
  { id: 'gainers', name: '📈 24h Gainers', filter: () => true, sort: 'change24h_desc' },
  { id: 'volume', name: '🔥 High Volume', filter: () => true, sort: 'volMcap_desc' },
];

// Application constants
export const REFRESH_INTERVAL = 60000; // 60 seconds
export const RSI_PERIOD = 14;
export const GOOGLE_CLIENT_ID = '889475479271-64c68ua41no083lq5g82v8pp2cvf9r9k.apps.googleusercontent.com';
export const API_URL = '/api/crypto';
