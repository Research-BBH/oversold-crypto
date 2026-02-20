import { useMemo } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const GAUGE_CX = 130;
const GAUGE_CY = 118;
const GAUGE_R_OUTER = 98;
const GAUGE_R_INNER = 68;
const GAUGE_R_NEEDLE = 86;
const NEEDLE_BASE = 8;

const ZONES = [
  { id: 'extreme_fear',  label: 'Extreme Fear',  startDeg: 180, endDeg: 144, color: '#ef4444', trackColor: '#ef444422' },
  { id: 'fear',          label: 'Fear',           startDeg: 144, endDeg: 108, color: '#f97316', trackColor: '#f9731622' },
  { id: 'neutral',       label: 'Neutral',        startDeg: 108, endDeg:  72, color: '#a3a3a3', trackColor: '#a3a3a322' },
  { id: 'greed',         label: 'Greed',          startDeg:  72, endDeg:  36, color: '#84cc16', trackColor: '#84cc1622' },
  { id: 'extreme_greed', label: 'Extreme Greed',  startDeg:  36, endDeg:   0, color: '#22c55e', trackColor: '#22c55e22' },
];

const SENTIMENT_BANDS = [
  { max: 20,  label: 'Extreme Fear',  color: '#ef4444' },
  { max: 35,  label: 'Fear',          color: '#f97316' },
  { max: 50,  label: 'Mild Fear',     color: '#eab308' },
  { max: 65,  label: 'Neutral',       color: '#a3a3a3' },
  { max: 80,  label: 'Greed',         color: '#84cc16' },
  { max: 101, label: 'Extreme Greed', color: '#22c55e' },
];

const BREAKDOWN_CARDS = [
  {
    filterKey: 'extreme',
    label: 'Extreme',
    sub: 'RSI < 20',
    statKey: 'extreme',
    bgDark: 'bg-red-500/10',
    bgLight: 'bg-red-50',
    textClass: 'text-red-500',
    borderActive: 'border-red-500 shadow-red-500/20',
    borderInactive: 'border-red-500/20 hover:border-red-500/50',
  },
  {
    filterKey: 'oversold',
    label: 'Oversold',
    sub: 'RSI < 30',
    statKey: 'oversold',
    bgDark: 'bg-orange-500/10',
    bgLight: 'bg-orange-50',
    textClass: 'text-orange-500',
    borderActive: 'border-orange-500 shadow-orange-500/20',
    borderInactive: 'border-orange-500/20 hover:border-orange-500/50',
  },
  {
    filterKey: 'neutral',
    label: 'Neutral',
    sub: 'RSI 30–70',
    statKey: 'neutral',
    bgDark: 'bg-gray-500/10',
    bgLight: 'bg-gray-100',
    textClass: 'text-gray-400',
    borderActive: 'border-gray-500 shadow-gray-500/20',
    borderInactive: 'border-gray-500/20 hover:border-gray-500/50',
  },
  {
    filterKey: 'overbought',
    label: 'Overbought',
    sub: 'RSI > 70',
    statKey: 'overbought',
    bgDark: 'bg-green-500/10',
    bgLight: 'bg-green-50',
    textClass: 'text-green-500',
    borderActive: 'border-green-500 shadow-green-500/20',
    borderInactive: 'border-green-500/20 hover:border-green-500/50',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function degToRad(deg) { return (deg * Math.PI) / 180; }

function arcPoint(cx, cy, r, deg) {
  const rad = degToRad(deg);
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

function ringSegmentPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const [ox1, oy1] = arcPoint(cx, cy, rOuter, startDeg);
  const [ox2, oy2] = arcPoint(cx, cy, rOuter, endDeg);
  const [ix1, iy1] = arcPoint(cx, cy, rInner, startDeg);
  const [ix2, iy2] = arcPoint(cx, cy, rInner, endDeg);
  return [
    `M ${ox1} ${oy1}`,
    `A ${rOuter} ${rOuter} 0 0 0 ${ox2} ${oy2}`,
    `L ${ix2} ${iy2}`,
    `A ${rInner} ${rInner} 0 0 1 ${ix1} ${iy1}`,
    'Z',
  ].join(' ');
}

function getSentiment(score) {
  return SENTIMENT_BANDS.find((b) => score < b.max) ?? SENTIMENT_BANDS[SENTIMENT_BANDS.length - 1];
}

function rsiToScore(avgRsi) {
  return Math.max(0, Math.min(100, avgRsi));
}

// ─── SVG Gauge ────────────────────────────────────────────────────────────────

function Gauge({ score, accentColor }) {
  const needleDeg = 180 - (score / 100) * 180;
  const [nx, ny] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_NEEDLE, needleDeg);
  const perpRad = degToRad(needleDeg + 90);
  const bx1 = GAUGE_CX + NEEDLE_BASE * Math.cos(perpRad);
  const by1 = GAUGE_CY - NEEDLE_BASE * Math.sin(perpRad);
  const bx2 = GAUGE_CX - NEEDLE_BASE * Math.cos(perpRad);
  const by2 = GAUGE_CY + NEEDLE_BASE * Math.sin(perpRad);

  return (
    <svg viewBox="0 0 260 130" className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <filter id="needle-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {ZONES.map((z) => (
        <path key={`track-${z.id}`}
          d={ringSegmentPath(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 5, GAUGE_R_INNER - 5, z.startDeg, z.endDeg)}
          fill={z.trackColor}
        />
      ))}

      {ZONES.map((z) => {
        const zoneScore = ((180 - z.startDeg) / 180) * 100;
        const zoneEndScore = ((180 - z.endDeg) / 180) * 100;
        const isActive = score >= zoneScore;
        const isPartial = score > zoneScore && score < zoneEndScore;
        if (!isActive && !isPartial) return null;
        const endDeg = isPartial ? 180 - (score / 100) * 180 : z.endDeg;
        return (
          <path key={`seg-${z.id}`}
            d={ringSegmentPath(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER, GAUGE_R_INNER, z.startDeg, endDeg)}
            fill={z.color} opacity={0.9}
          />
        );
      })}

      {[180, 144, 108, 72, 36, 0].map((deg) => {
        const [x1, y1] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_INNER - 6, deg);
        const [x2, y2] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 6, deg);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.55)" strokeWidth="2.5" />;
      })}

      {(() => {
        const [fx, fy] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 16, 180);
        const [gx, gy] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 16, 0);
        return (
          <>
            <text x={fx - 2} y={fy + 4} textAnchor="end"   fontSize="10" fill="#ef4444" fontWeight="700" fontFamily="monospace" opacity="0.9">FEAR</text>
            <text x={gx + 2} y={gy + 4} textAnchor="start" fontSize="10" fill="#22c55e" fontWeight="700" fontFamily="monospace" opacity="0.9">GREED</text>
          </>
        );
      })()}

      <polygon points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`} fill="rgba(0,0,0,0.35)" transform="translate(2,2)" />
      <polygon points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`} fill={accentColor} filter="url(#needle-glow)" />
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r="7.5" fill="#1a1a24" stroke={accentColor} strokeWidth="2.5" />
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r="3"   fill={accentColor} />
    </svg>
  );
}

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistributionBar({ stats, total, darkMode }) {
  const segments = [
    { key: 'extreme',    label: 'Extreme',    color: '#ef4444', count: stats.extreme },
    { key: 'oversold',   label: 'Oversold',   color: '#f97316', count: stats.oversold },
    { key: 'neutral',    label: 'Neutral',    color: '#6b7280', count: stats.neutral },
    { key: 'overbought', label: 'Overbought', color: '#22c55e', count: stats.overbought },
  ];

  return (
    <div className="w-full">
      <div className="flex h-3 rounded-full overflow-hidden gap-px">
        {segments.map((s) => {
          const pct = total > 0 ? (s.count / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              style={{ width: `${pct}%`, backgroundColor: s.color }}
              title={`${s.label}: ${s.count} tokens (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex justify-between mt-2.5">
        {segments.map((s) => {
          const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : '0';
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-xs font-semibold tabular-nums" style={{ color: s.color }}>
                {pct}%
              </span>
              <span className={`text-xs hidden sm:inline ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function MarketSentimentWidget({ stats, darkMode, rsiFilter, setRsiFilter, setPreset }) {
  const score = useMemo(() => rsiToScore(stats.avgRsi), [stats.avgRsi]);
  const sentiment = useMemo(() => getSentiment(score), [score]);
  const total = stats.withRSI;

  const dominantZone = useMemo(() => {
    const zones = [
      { label: 'extreme oversold', count: stats.extreme },
      { label: 'oversold',         count: stats.oversold },
      { label: 'neutral',          count: stats.neutral },
      { label: 'overbought',       count: stats.overbought },
    ];
    return zones.reduce((max, z) => (z.count > max.count ? z : max), zones[0]);
  }, [stats]);

  const handleCardClick = (filterKey) => {
    setRsiFilter(rsiFilter === filterKey ? null : filterKey);
    setPreset(null);
  };

  return (
    <div className={`rounded-2xl border mb-4 sm:mb-5 overflow-hidden ${darkMode ? 'bg-white/[0.03] border-white/10' : 'bg-white border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row">

        {/* ── Left: Gauge ── */}
        <div
          className="flex flex-col items-center justify-center px-5 pt-5 pb-4 sm:px-8 sm:py-6 sm:border-r sm:w-[320px] sm:shrink-0 border-b sm:border-b-0"
          style={{ borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)' }}
        >
          <div className="w-full max-w-[230px] sm:max-w-[260px]">
            <Gauge score={score} accentColor={sentiment.color} />
          </div>
          <div className="text-center -mt-3">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-black tabular-nums tracking-tight" style={{ color: sentiment.color }}>
                {score.toFixed(0)}
              </span>
              <span className={`text-sm font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>/ 100</span>
            </div>
            <div className="mt-1 text-sm font-bold uppercase tracking-widest" style={{ color: sentiment.color }}>
              {sentiment.label}
            </div>
          </div>
        </div>

        {/* ── Right: Details ── */}
        <div className="flex flex-col justify-between flex-1 px-4 py-4 sm:px-6 sm:py-5 gap-4">

          {/* Title + avg RSI */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Market Sentiment
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Based on RSI across {total} tokens
              </p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold tabular-nums ${darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`font-normal ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>avg RSI</span>
              <span style={{ color: sentiment.color }}>{stats.avgRsi.toFixed(1)}</span>
            </div>
          </div>

          {/* Clickable filter cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BREAKDOWN_CARDS.map((card) => {
              const isActive = rsiFilter === card.filterKey;
              return (
                <div
                  key={card.filterKey}
                  onClick={() => handleCardClick(card.filterKey)}
                  className={`
                    ${darkMode ? card.bgDark : card.bgLight}
                    border-2 rounded-xl px-3 py-2.5 flex flex-col
                    cursor-pointer transition-all hover:scale-[1.02]
                    ${isActive ? `${card.borderActive} shadow-lg` : card.borderInactive}
                  `}
                >
                  <span className={`text-2xl font-bold tabular-nums ${card.textClass}`}>
                    {stats[card.statKey]}
                  </span>
                  <span className={`text-[11px] font-semibold leading-tight mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {card.label}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    {card.sub}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Distribution bar */}
          <DistributionBar stats={stats} total={total} darkMode={darkMode} />

          {/* Summary */}
          <p className={`text-[11px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Majority of tracked tokens are{' '}
            <span className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {dominantZone.label}
            </span>
            {' · '}{dominantZone.count} of {total} tokens
          </p>
        </div>
      </div>
    </div>
  );
}
