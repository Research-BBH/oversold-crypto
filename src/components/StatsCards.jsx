const COLOR_CLASSES = {
  red: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    borderActive: 'border-red-500 shadow-lg shadow-red-500/20',
    borderInactive: 'border-red-500/20 hover:border-red-500/50',
  },
  orange: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    borderActive: 'border-orange-500 shadow-lg shadow-orange-500/20',
    borderInactive: 'border-orange-500/20 hover:border-orange-500/50',
  },
  gray: {
    bg: 'bg-gray-500/10',
    text: 'text-gray-500',
    borderActive: 'border-gray-500 shadow-lg shadow-gray-500/20',
    borderInactive: 'border-gray-500/20 hover:border-gray-500/50',
  },
  green: {
    bg: 'bg-green-500/10',
    text: 'text-green-500',
    borderActive: 'border-green-500 shadow-lg shadow-green-500/20',
    borderInactive: 'border-green-500/20 hover:border-green-500/50',
  },
};

const CARDS = [
  { k: 'extreme',   color: 'red',    label: 'EXTREME',    sub: 'RSI < 20' },
  { k: 'oversold',  color: 'orange', label: 'OVERSOLD',   sub: 'RSI < 30' },
  { k: 'neutral',   color: 'gray',   label: 'NEUTRAL',    sub: 'RSI 30-70' },
  { k: 'overbought',color: 'green',  label: 'OVERBOUGHT', sub: 'RSI > 70' },
];

export function StatsCards({ stats, rsiFilter, setRsiFilter, setPreset, darkMode }) {
  const handleClick = (key) => {
    setRsiFilter(rsiFilter === key ? null : key);
    setPreset(null);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-5">
      {CARDS.map((card) => {
        const colors = COLOR_CLASSES[card.color];
        const isActive = rsiFilter === card.k;
        return (
          <div
            key={card.k}
            onClick={() => handleClick(card.k)}
            className={`${colors.bg} border-2 rounded-xl p-4 text-center transition-all cursor-pointer hover:scale-[1.02] ${
              isActive ? colors.borderActive : colors.borderInactive
            }`}
          >
            <p className={`text-3xl font-bold ${colors.text}`}>{stats[card.k]}</p>
            <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {card.label}
            </p>
            <p className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              {card.sub}
            </p>
          </div>
        );
      })}
    </div>
  );
}
