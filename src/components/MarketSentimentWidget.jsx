import { useMemo } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const GAUGE_CX = 110;
const GAUGE_CY = 100;
const GAUGE_R_OUTER = 82;
const GAUGE_R_INNER = 58;
const GAUGE_R_NEEDLE = 72;
const NEEDLE_BASE = 7;

// Each zone spans 36° of the 180° semicircle (left = fear, right = greed)
const ZONES = [
  { id: 'extreme_fear',  label: 'Extreme Fear',  startDeg: 180, endDeg: 144, color: '#ef4444', trackColor: '#ef444426' },
  { id: 'fear',          label: 'Fear',           startDeg: 144, endDeg: 108, color: '#f97316', trackColor: '#f9731626' },
  { id: 'neutral',       label: 'Neutral',        startDeg: 108, endDeg:  72, color: '#a3a3a3', trackColor: '#a3a3a326' },
  { id: 'greed',         label: 'Greed',          startDeg:  72, endDeg:  36, color: '#84cc16', trackColor: '#84cc1626' },
  { id: 'extreme_greed', label: 'Extreme Greed',  startDeg:  36, endDeg:   0, color: '#22c55e', trackColor: '#22c55e26' },
];

const SENTIMENT_BANDS = [
  { max: 20,  label: 'Extreme Fear',  color: '#ef4444', glow: 'rgba(239,68,68,0.25)' },
  { max: 35,  label: 'Fear',          color: '#f97316', glow: 'rgba(249,115,22,0.25)' },
  { max: 50,  label: 'Mild Fear',     color: '#eab308', glow: 'rgba(234,179,8,0.25)'  },
  { max: 65,  label: 'Neutral',       color: '#a3a3a3', glow: 'rgba(163,163,163,0.2)' },
  { max: 80,  label: 'Greed',         color: '#84cc16', glow: 'rgba(132,204,22,0.25)' },
  { max: 101, label: 'Extreme Greed', color: '#22c55e', glow: 'rgba(34,197,94,0.25)'  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

function arcPoint(cx, cy, r, deg) {
  const rad = degToRad(deg);
  return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)];
}

// Build an SVG arc path for a ring segment (outer arc + inner arc back)
function ringSegmentPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const [ox1, oy1] = arcPoint(cx, cy, rOuter, startDeg);
  const [ox2, oy2] = arcPoint(cx, cy, rOuter, endDeg);
  const [ix1, iy1] = arcPoint(cx, cy, rInner, startDeg);
  const [ix2, iy2] = arcPoint(cx, cy, rInner, endDeg);
  // sweep=0 → counterclockwise in SVG (goes through top for our angles)
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

// avgRSI (0–100) → sentiment score (0–100), clamped
function rsiToScore(avgRsi) {
  return Math.max(0, Math.min(100, avgRsi));
}

// ─── SVG Gauge ────────────────────────────────────────────────────────────────

function Gauge({ score, accentColor }) {
  // Needle angle: score 0 → 180° (left/fear), score 100 → 0° (right/greed)
  const needleDeg = 180 - (score / 100) * 180;
  const [nx, ny] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_NEEDLE, needleDeg);

  // Needle base perpendicular points
  const perpRad = degToRad(needleDeg + 90);
  const bx1 = GAUGE_CX + NEEDLE_BASE * Math.cos(perpRad);
  const by1 = GAUGE_CY - NEEDLE_BASE * Math.sin(perpRad);
  const bx2 = GAUGE_CX - NEEDLE_BASE * Math.cos(perpRad);
  const by2 = GAUGE_CY + NEEDLE_BASE * Math.sin(perpRad);

  return (
    <svg
      viewBox="0 0 220 110"
      className="w-full"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Glow filter for needle */}
        <filter id="needle-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track (background segments, faint) */}
      {ZONES.map((z) => (
        <path
          key={`track-${z.id}`}
          d={ringSegmentPath(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 4, GAUGE_R_INNER - 4, z.startDeg, z.endDeg)}
          fill={z.trackColor}
        />
      ))}

      {/* Colored ring segments */}
      {ZONES.map((z, i) => {
        // Determine if this zone is "active" based on score
        const zoneScore = ((180 - z.startDeg) / 180) * 100; // score at start of zone
        const zoneEndScore = ((180 - z.endDeg) / 180) * 100;
        const isActive = score >= zoneScore;
        const isPartial = score > zoneScore && score < zoneEndScore;

        let endDeg = z.endDeg;
        if (isPartial) {
          // Draw only up to the needle position
          endDeg = 180 - (score / 100) * 180;
        }

        if (!isActive && !isPartial) return null;

        return (
          <path
            key={`seg-${z.id}`}
            d={ringSegmentPath(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER, GAUGE_R_INNER, z.startDeg, endDeg)}
            fill={z.color}
            opacity={0.9}
          />
        );
      })}

      {/* Segment divider ticks */}
      {[180, 144, 108, 72, 36, 0].map((deg) => {
        const [x1, y1] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_INNER - 5, deg);
        const [x2, y2] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 5, deg);
        return (
          <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,0,0,0.6)" strokeWidth="2" />
        );
      })}

      {/* Zone labels at edges */}
      {(() => {
        const [fx, fy] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 14, 180);
        const [gx, gy] = arcPoint(GAUGE_CX, GAUGE_CY, GAUGE_R_OUTER + 14, 0);
        return (
          <>
            <text x={fx - 2} y={fy + 4} textAnchor="end" fontSize="8.5" fill="#ef4444" fontWeight="600" fontFamily="monospace" opacity="0.85">FEAR</text>
            <text x={gx + 2} y={gy + 4} textAnchor="start" fontSize="8.5" fill="#22c55e" fontWeight="600" fontFamily="monospace" opacity="0.85">GREED</text>
          </>
        );
      })()}

      {/* Needle shadow */}
      <polygon
        points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`}
        fill="rgba(0,0,0,0.3)"
        transform="translate(1.5, 1.5)"
      />

      {/* Needle */}
      <polygon
        points={`${nx},${ny} ${bx1},${by1} ${bx2},${by2}`}
        fill={accentColor}
        filter="url(#needle-glow)"
      />

      {/* Needle pivot */}
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r="6" fill="#1a1a24" stroke={accentColor} strokeWidth="2" />
      <circle cx={GAUGE_CX} cy={GAUGE_CY} r="2.5" fill={accentColor} />
    </svg>
  );
}

// ─── Distribution bar ─────────────────────────────────────────────────────────

function DistributionBar({ stats, total, darkMode }) {
  const segments = [
    { key: 'extreme',   label: 'Extreme',   color: '#ef4444', count: stats.extreme },
    { key: 'oversold',  label: 'Oversold',  color: '#f97316', count: stats.oversold },
    { key: 'neutral',   label: 'Neutral',   color: '#6b7280', count: stats.neutral },
    { key: 'overbought',label: 'Overbought',color: '#22c55e', count: stats.overbought },
  ];

  return (
    <div className="w-full">
      {/* Bar */}
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
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
      {/* Legend */}
      <div className="flex justify-between mt-2">
        {segments.map((s) => {
          const pct = total > 0 ? ((s.count / total) * 100).toFixed(0) : '0';
          return (
            <div key={s.key} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className={`text-[10px] tabular-nums ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main widget ──────────────────────────────────────────────────────────────

export function MarketSentimentWidget({ stats, darkMode }) {
  const score = useMemo(() => rsiToScore(stats.avgRsi), [stats.avgRsi]);
  const sentiment = useMemo(() => getSentiment(score), [score]);
  const total = stats.withRSI;

  // Dominant zone for tooltip
  const dominantZone = useMemo(() => {
    const zones = [
      { label: 'extreme oversold', count: stats.extreme },
      { label: 'oversold',         count: stats.oversold },
      { label: 'neutral',          count: stats.neutral },
      { label: 'overbought',       count: stats.overbought },
    ];
    return zones.reduce((max, z) => (z.count > max.count ? z : max), zones[0]);
  }, [stats]);

  return (
    <div
      className={`rounded-2xl border mb-4 sm:mb-5 overflow-hidden ${
        darkMode
          ? 'bg-white/[0.03] border-white/10'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row">

        {/* ── Left: Gauge ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center justify-center px-4 pt-4 pb-3 sm:px-6 sm:py-5 sm:border-r sm:w-[280px] sm:shrink-0 border-b sm:border-b-0"
          style={{
            borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
          }}
        >
          {/* Gauge SVG */}
          <div className="w-full max-w-[200px] sm:max-w-[220px]">
            <Gauge score={score} accentColor={sentiment.color} />
          </div>

          {/* Score + label */}
          <div className="text-center -mt-2">
            <div className="flex items-baseline justify-center gap-2">
              <span
                className="text-4xl font-black tabular-nums tracking-tight"
                style={{ color: sentiment.color }}
              >
                {score.toFixed(0)}
              </span>
              <span className={`text-xs font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                / 100
              </span>
            </div>
            <div
              className="mt-0.5 text-xs font-bold uppercase tracking-widest"
              style={{ color: sentiment.color }}
            >
              {sentiment.label}
            </div>
          </div>
        </div>

        {/* ── Right: Details ────────────────────────────────────────────────── */}
        <div className="flex flex-col justify-between flex-1 px-4 py-3 sm:px-5 sm:py-4 gap-3">
          {/* Title row */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Market Sentiment
              </h3>
              <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                Based on RSI across {total} tokens
              </p>
            </div>
            {/* Avg RSI pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold tabular-nums ${
                darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <span className={`${darkMode ? 'text-gray-500' : 'text-gray-400'} font-normal`}>avg RSI</span>
              <span style={{ color: sentiment.color }}>{stats.avgRsi.toFixed(1)}</span>
            </div>
          </div>

          {/* Token breakdown grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Extreme',    count: stats.extreme,   color: '#ef4444', bg: darkMode ? 'bg-red-500/10'    : 'bg-red-50',    text: 'text-red-500',   sub: 'RSI < 20' },
              { label: 'Oversold',   count: stats.oversold,  color: '#f97316', bg: darkMode ? 'bg-orange-500/10' : 'bg-orange-50', text: 'text-orange-500', sub: 'RSI < 30' },
              { label: 'Neutral',    count: stats.neutral,   color: '#6b7280', bg: darkMode ? 'bg-gray-500/10'   : 'bg-gray-100',  text: darkMode ? 'text-gray-400' : 'text-gray-500', sub: '30–70' },
              { label: 'Overbought', count: stats.overbought,color: '#22c55e', bg: darkMode ? 'bg-green-500/10'  : 'bg-green-50',  text: 'text-green-500',  sub: 'RSI > 70' },
            ].map((z) => (
              <div
                key={z.label}
                className={`${z.bg} rounded-xl px-3 py-2 flex flex-col`}
              >
                <span className={`text-xl font-bold tabular-nums ${z.text}`}>{z.count}</span>
                <span className={`text-[10px] font-medium leading-tight ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{z.label}</span>
                <span className={`text-[9px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>{z.sub}</span>
              </div>
            ))}
          </div>

          {/* Distribution bar */}
          <div>
            <DistributionBar stats={stats} total={total} darkMode={darkMode} />
          </div>

          {/* Dominant signal note */}
          <p className={`text-[11px] ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            Majority of tracked tokens are{' '}
            <span className={`font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {dominantZone.label}
            </span>{' '}
            · {dominantZone.count} of {total} tokens
          </p>
        </div>
      </div>
    </div>
  );
}
