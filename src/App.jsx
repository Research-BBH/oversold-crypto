// ==================================================
// FILE: src/App.jsx
// ==================================================
// Put this file inside the "src" folder

import { useState, useEffect, useMemo, useCallback } from 'react';

const CAT_MAP = {
  bitcoin:'layer-1',ethereum:'layer-1',solana:'layer-1',cardano:'layer-1','avalanche-2':'layer-1',
  polkadot:'layer-1',tron:'layer-1',litecoin:'layer-1',monero:'layer-1',stellar:'layer-1',
  cosmos:'layer-1','near-protocol':'layer-1',algorand:'layer-1',fantom:'layer-1',sui:'layer-1',
  aptos:'layer-1',kaspa:'layer-1',hedera:'layer-1',arbitrum:'layer-1',optimism:'layer-1',
  sei:'layer-1',celestia:'layer-1',injective:'layer-1',mantle:'layer-1',stacks:'layer-1',
  dogecoin:'meme','shiba-inu':'meme',pepe:'meme',floki:'meme',bonk:'meme','dogwifhat':'meme',
  'book-of-meme':'meme',brett:'meme',popcat:'meme',turbo:'meme','mog-coin':'meme',
  chainlink:'defi',uniswap:'defi',aave:'defi',maker:'defi','lido-dao':'defi','curve-dao-token':'defi',
  jupiter:'defi',raydium:'defi',pendle:'defi',thorchain:'defi','the-graph':'defi',
  'render-token':'ai','fetch-ai':'ai',bittensor:'ai',worldcoin:'ai',akash:'ai',
  'ocean-protocol':'ai',singularitynet:'ai',arkham:'ai',
  'the-sandbox':'gaming',decentraland:'gaming','axie-infinity':'gaming',gala:'gaming',
  'immutable-x':'gaming',enjincoin:'gaming',beam:'gaming','super-token':'gaming',
  'bnb':'exchange',cronos:'exchange',okb:'exchange','kucoin-token':'exchange','gate-token':'exchange',
  tether:'stable','usd-coin':'stable',dai:'stable','first-digital-usd':'stable',
};
const getCat = id => CAT_MAP[id] || 'other';

const CATS = [
  {id:'all',name:'All',icon:'🌐'},
  {id:'layer-1',name:'L1/L2',icon:'⛓️'},
  {id:'defi',name:'DeFi',icon:'🏦'},
  {id:'meme',name:'Meme',icon:'🐸'},
  {id:'gaming',name:'Gaming',icon:'🎮'},
  {id:'ai',name:'AI',icon:'🤖'},
];

const PRESETS = [
  {id:'oversold',name:'🔴 Oversold <30',filter:t=>t.rsi!==null&&t.rsi<30,sort:'rsi_asc'},
  {id:'extreme',name:'🚨 Extreme <20',filter:t=>t.rsi!==null&&t.rsi<20,sort:'rsi_asc'},
  {id:'overbought',name:'🟢 Overbought >70',filter:t=>t.rsi!==null&&t.rsi>70,sort:'rsi_desc'},
  {id:'losers24h',name:'📉 24h Losers',filter:()=>true,sort:'change24h_asc'},
  {id:'losers7d',name:'📉 7d Losers',filter:()=>true,sort:'change7d_asc'},
  {id:'gainers',name:'📈 24h Gainers',filter:()=>true,sort:'change24h_desc'},
  {id:'volume',name:'🔥 High Volume',filter:()=>true,sort:'volMcap_desc'},
];

const Spark = ({ data, color, h = 24 }) => {
  if (!data?.length || data.length < 2) return <div className="w-20 h-6 bg-gray-800/30 rounded animate-pulse"/>;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*80},${h-((v-min)/range)*h}`).join(' ');
  return <svg width={80} height={h}><polyline fill="none" stroke={color} strokeWidth="1.5" points={pts}/></svg>;
};

// Enhanced chart for modal with price axis, time labels, grid, and more context
const DetailChart = ({ data, basePrice, symbol, change7d }) => {
  if (!data?.length || data.length < 2) {
    return <div className="w-full h-48 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">No chart data</div>;
  }
  
  const W = 360, H = 180;
  const PAD = { top: 20, right: 58, bottom: 35, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  
  // Calculate actual prices from percentage data
  const endPrice = basePrice;
  const startPrice = endPrice / (1 + (change7d || 0) / 100);
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  // Scale to actual price range
  const priceMin = startPrice * (min / 100);
  const priceMax = startPrice * (max / 100);
  const priceRange = priceMax - priceMin || priceMin * 0.01;
  
  // Add 10% padding to price range
  const paddedMin = priceMin - priceRange * 0.1;
  const paddedMax = priceMax + priceRange * 0.1;
  const paddedRange = paddedMax - paddedMin;
  
  // Generate price levels (4 levels)
  const priceLevels = [0, 0.33, 0.66, 1].map(t => paddedMax - paddedRange * t);
  
  // Time labels for 7-day period
  const timeLabels = ['7d ago', '5d', '3d', '1d', 'Now'];
  
  // Build path
  const pts = data.map((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const actualPrice = startPrice * (v / 100);
    const y = PAD.top + chartH - ((actualPrice - paddedMin) / paddedRange) * chartH;
    return `${x},${y}`;
  });
  
  // Gradient area path
  const areaPath = `M${PAD.left},${PAD.top + chartH} ` + 
    pts.map((p, i) => (i === 0 ? `L${p}` : `L${p}`)).join(' ') + 
    ` L${PAD.left + chartW},${PAD.top + chartH} Z`;
  
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#22c55e' : '#ef4444';
  
  // Format price for axis
  const fmtAxis = (p) => {
    if (p >= 1000) return '$' + (p/1000).toFixed(1) + 'k';
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    if (p >= 0.0001) return '$' + p.toFixed(6);
    return '$' + p.toExponential(2);
  };
  
  // Current price Y position
  const currentY = PAD.top + chartH - ((endPrice - paddedMin) / paddedRange) * chartH;
  
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: '200px' }}>
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {priceLevels.map((price, i) => {
          const y = PAD.top + (i / 3) * chartH;
          return (
            <g key={i}>
              <line 
                x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y}
                stroke="rgba(255,255,255,0.07)" strokeDasharray="3,3"
              />
              <text x={W - 5} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.4)" fontSize="9">
                {fmtAxis(price)}
              </text>
            </g>
          );
        })}
        
        {/* Vertical time grid */}
        {timeLabels.map((label, i) => {
          const x = PAD.left + (i / (timeLabels.length - 1)) * chartW;
          return (
            <g key={i}>
              <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.04)"/>
              <text x={x} y={H - 10} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
                {label}
              </text>
            </g>
          );
        })}
        
        {/* Area fill */}
        <path d={areaPath} fill="url(#chartGrad)"/>
        
        {/* Main line */}
        <polyline 
          fill="none" stroke={color} strokeWidth="2" 
          strokeLinecap="round" strokeLinejoin="round"
          points={pts.join(' ')}
        />
        
        {/* Current price dashed line */}
        <line 
          x1={PAD.left} y1={currentY} x2={PAD.left + chartW} y2={currentY}
          stroke={color} strokeWidth="1" strokeDasharray="4,2" opacity="0.5"
        />
      </svg>
      
      {/* Chart stats bar */}
      <div className="flex justify-between items-center mt-3 px-1">
        <div className="flex gap-4 text-xs">
          <span className="text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            High: <span className="text-white font-medium">{fmtAxis(startPrice * (max / 100))}</span>
          </span>
          <span className="text-gray-400">
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
            Low: <span className="text-white font-medium">{fmtAxis(startPrice * (min / 100))}</span>
          </span>
        </div>
        <span className="text-xs text-gray-400">
          Spread: <span className={`font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            {((max - min) / min * 100).toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
};

const fmt = n => {
  if (n == null) return '--';
  if (n >= 1e12) return (n/1e12).toFixed(2)+'T';
  if (n >= 1e9) return (n/1e9).toFixed(2)+'B';
  if (n >= 1e6) return (n/1e6).toFixed(2)+'M';
  if (n >= 1e3) return (n/1e3).toFixed(1)+'K';
  return Number(n).toFixed(2);
};

const fmtP = p => {
  if (p == null) return '--';
  if (p >= 1000) return '$'+Number(p).toLocaleString('en-US',{maximumFractionDigits:0});
  if (p >= 1) return '$'+Number(p).toFixed(2);
  if (p >= 0.0001) return '$'+Number(p).toFixed(6);
  return '$'+Number(p).toFixed(10);
};

const rsiStyle = r => {
  if (r === null) return {bg:'bg-gray-700/30 border-gray-600/30',text:'text-gray-500',label:'...',dot:'bg-gray-500'};
  if (r < 20) return {bg:'bg-red-500/20 border-red-500/40',text:'text-red-400',label:'EXTREME',dot:'bg-red-500'};
  if (r < 30) return {bg:'bg-orange-500/20 border-orange-500/40',text:'text-orange-400',label:'OVERSOLD',dot:'bg-orange-500'};
  if (r < 40) return {bg:'bg-yellow-500/20 border-yellow-500/40',text:'text-yellow-400',label:'WEAK',dot:'bg-yellow-500'};
  if (r < 60) return {bg:'bg-gray-500/20 border-gray-500/30',text:'text-gray-300',label:'NEUTRAL',dot:'bg-gray-400'};
  if (r < 70) return {bg:'bg-emerald-500/20 border-emerald-500/40',text:'text-emerald-400',label:'STRONG',dot:'bg-emerald-500'};
  return {bg:'bg-green-500/20 border-green-500/40',text:'text-green-400',label:'OVERBOUGHT',dot:'bg-green-500'};
};

const RSIMeter = ({value}) => {
  if (value === null) return <div className="h-3 bg-gray-800 rounded-full"/>;
  return (
    <div className="w-full">
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
        <div className="absolute inset-0 flex">
          <div className="w-[20%] bg-red-500/40"/><div className="w-[10%] bg-orange-500/40"/>
          <div className="w-[30%] bg-gray-600/40"/><div className="w-[10%] bg-emerald-500/40"/>
          <div className="w-[30%] bg-green-500/40"/>
        </div>
        <div className="absolute top-0 h-full w-1.5 bg-white rounded-full shadow-lg shadow-white/50 transition-all duration-500" style={{left:`calc(${Math.min(98,Math.max(1,value))}% - 3px)`}}/>
      </div>
      <div className="flex justify-between text-[9px] mt-1 text-gray-600">
        <span>0</span><span className="text-red-400/70">20</span><span className="text-orange-400/70">30</span>
        <span>50</span><span className="text-emerald-400/70">70</span><span>100</span>
      </div>
    </div>
  );
};

// Large chart for full page view
const FullPageChart = ({ data, basePrice, symbol, change7d }) => {
  if (!data?.length || data.length < 2) {
    return <div className="w-full h-80 bg-gray-800/30 rounded-xl animate-pulse flex items-center justify-center text-gray-500">No chart data</div>;
  }
  
  const W = 800, H = 400;
  const PAD = { top: 30, right: 80, bottom: 50, left: 20 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  
  const endPrice = basePrice;
  const startPrice = endPrice / (1 + (change7d || 0) / 100);
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  const priceMin = startPrice * (min / 100);
  const priceMax = startPrice * (max / 100);
  const priceRange = priceMax - priceMin || priceMin * 0.01;
  
  const paddedMin = priceMin - priceRange * 0.1;
  const paddedMax = priceMax + priceRange * 0.1;
  const paddedRange = paddedMax - paddedMin;
  
  const priceLevels = [0, 0.2, 0.4, 0.6, 0.8, 1].map(t => paddedMax - paddedRange * t);
  const timeLabels = ['7d ago', '6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
  
  const pts = data.map((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * chartW;
    const actualPrice = startPrice * (v / 100);
    const y = PAD.top + chartH - ((actualPrice - paddedMin) / paddedRange) * chartH;
    return `${x},${y}`;
  });
  
  const areaPath = `M${PAD.left},${PAD.top + chartH} ` + 
    pts.map((p) => `L${p}`).join(' ') + 
    ` L${PAD.left + chartW},${PAD.top + chartH} Z`;
  
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#22c55e' : '#ef4444';
  
  const fmtAxis = (p) => {
    if (p >= 1000) return '$' + (p/1000).toFixed(1) + 'k';
    if (p >= 1) return '$' + p.toFixed(2);
    if (p >= 0.01) return '$' + p.toFixed(4);
    if (p >= 0.0001) return '$' + p.toFixed(6);
    return '$' + p.toExponential(2);
  };
  
  const currentY = PAD.top + chartH - ((endPrice - paddedMin) / paddedRange) * chartH;
  
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <linearGradient id="fullChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {priceLevels.map((price, i) => {
          const y = PAD.top + (i / 5) * chartH;
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4,4"/>
              <text x={W - 10} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="12">{fmtAxis(price)}</text>
            </g>
          );
        })}
        
        {/* Vertical time grid */}
        {timeLabels.map((label, i) => {
          const x = PAD.left + (i / (timeLabels.length - 1)) * chartW;
          return (
            <g key={i}>
              <line x1={x} y1={PAD.top} x2={x} y2={PAD.top + chartH} stroke="rgba(255,255,255,0.05)"/>
              <text x={x} y={H - 15} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="12">{label}</text>
            </g>
          );
        })}
        
        <path d={areaPath} fill="url(#fullChartGrad)"/>
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={pts.join(' ')}/>
        
        {/* Current price line */}
        <line x1={PAD.left} y1={currentY} x2={PAD.left + chartW} y2={currentY} stroke={color} strokeWidth="1" strokeDasharray="6,3" opacity="0.6"/>
      </svg>
      
      {/* Stats bar */}
      <div className="flex justify-between items-center mt-4 px-2">
        <div className="flex gap-6 text-sm">
          <span className="text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-2"></span>
            High: <span className="text-white font-semibold">{fmtAxis(startPrice * (max / 100))}</span>
          </span>
          <span className="text-gray-400">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 mr-2"></span>
            Low: <span className="text-white font-semibold">{fmtAxis(startPrice * (min / 100))}</span>
          </span>
        </div>
        <span className="text-sm text-gray-400">
          Spread: <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>{((max - min) / min * 100).toFixed(2)}%</span>
        </span>
      </div>
    </div>
  );
};

// Full page token detail view
const TokenDetailPage = ({ token, onBack }) => {
  if (!token) return null;
  
  const rs = rsiStyle(token.rsi);
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <img 
            src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${token.cmcId}.png`}
            alt={token.symbol}
            className="w-16 h-16 rounded-2xl bg-gray-800"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{token.name}</h1>
              <span className="text-xl text-gray-400">{token.symbol}</span>
              <span className="px-2 py-1 rounded bg-white/10 text-sm text-gray-400">Rank #{token.rank}</span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-2xl font-bold">{fmtP(token.price)}</span>
              <span className={`text-lg font-semibold ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h?.toFixed(2)}% (24h)
              </span>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart section - 2 cols */}
          <div className="lg:col-span-2 bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">7-Day Price Chart</h2>
              <span className={`px-3 py-1 rounded-lg text-sm font-medium ${token.change7d >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {token.change7d >= 0 ? '+' : ''}{token.change7d?.toFixed(2)}%
              </span>
            </div>
            <FullPageChart data={token.sparkline} basePrice={token.price} symbol={token.symbol} change7d={token.change7d}/>
            <p className="text-xs text-gray-500 mt-4 text-center">* Chart shows estimated trend based on % changes. For accurate data, visit CoinMarketCap or TradingView.</p>
          </div>

          {/* RSI & Stats - 1 col */}
          <div className="space-y-6">
            {/* RSI Card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Momentum Score (RSI-like)</h2>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${rs.dot}`}/>
                  <span className={`text-2xl font-bold ${rs.text}`}>{token.rsi !== null ? token.rsi.toFixed(1) : 'N/A'}</span>
                </div>
              </div>
              <RSIMeter value={token.rsi}/>
              <div className={`mt-4 p-3 rounded-xl ${rs.bg} border ${rs.text}`}>
                <span className="font-semibold">{rs.label}</span>
                <p className="text-sm opacity-80 mt-1">
                  {token.rsi < 30 ? 'This token may be oversold. Consider researching for potential opportunities.' :
                   token.rsi > 70 ? 'This token may be overbought. Consider taking profits or waiting for a pullback.' :
                   'This token is in neutral territory.'}
                </p>
              </div>
            </div>

            {/* Price Changes */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-lg font-semibold mb-4">Price Changes</h2>
              <div className="grid grid-cols-2 gap-3">
                {[{l:'1 Hour', v:token.change1h},{l:'24 Hours', v:token.change24h},{l:'7 Days', v:token.change7d},{l:'30 Days', v:token.change30d}].map(x => (
                  <div key={x.l} className="bg-white/5 rounded-xl p-4 text-center">
                    <p className="text-xs text-gray-500 mb-1">{x.l}</p>
                    <p className={`text-lg font-bold ${(x.v||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {x.v != null ? `${x.v >= 0 ? '+' : ''}${x.v.toFixed(2)}%` : '--'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Market Data */}
        <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
          <h2 className="text-lg font-semibold mb-4">Market Data</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {icon:'💰', label:'Price', value:fmtP(token.price)},
              {icon:'📊', label:'Market Cap', value:'$'+fmt(token.mcap)},
              {icon:'📈', label:'24h Volume', value:'$'+fmt(token.volume)},
              {icon:'🔄', label:'Vol/MCap', value:token.volMcap?.toFixed(2)+'%'},
              {icon:'💎', label:'Circulating Supply', value:fmt(token.supply) + ' ' + token.symbol},
              {icon:'🏆', label:'Dominance', value:(token.dominance||0).toFixed(3)+'%'},
            ].map(x => (
              <div key={x.label} className="bg-white/5 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-2">{x.icon} {x.label}</p>
                <p className="text-lg font-bold truncate" title={x.value}>{x.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* External Links */}
        <div className="mt-6 flex gap-4">
          <a href={`https://coinmarketcap.com/currencies/${token.id}/`} target="_blank" rel="noreferrer" 
            className="flex-1 py-4 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-center text-blue-400 font-medium transition-colors text-lg">
            View on CoinMarketCap ↗
          </a>
          <a href={`https://www.tradingview.com/symbols/${token.symbol}USD`} target="_blank" rel="noreferrer" 
            className="flex-1 py-4 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl text-center text-emerald-400 font-medium transition-colors text-lg">
            View on TradingView ↗
          </a>
        </div>
      </div>
    </div>
  );
};

const API_URL = '/api/crypto';

export default function App() {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('all');
  const [sortBy, setSortBy] = useState('rsi_asc');
  const [sel, setSel] = useState(null);
  const [watchlist, setWatchlist] = useState(new Set());
  const [showWL, setShowWL] = useState(false);
  const [preset, setPreset] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [apiStats, setApiStats] = useState(null);
  const [rsiFilter, setRsiFilter] = useState(null);
  
  // Hash routing for full page token view
  const [pageTokenId, setPageTokenId] = useState(null);
  
  // Parse hash on load and hash change
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/token/')) {
        setPageTokenId(hash.replace('#/token/', ''));
      } else {
        setPageTokenId(null);
      }
    };
    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Open token in new tab
  const openTokenPage = (tokenId, e) => {
    e.stopPropagation();
    window.open(`${window.location.pathname}#/token/${tokenId}`, '_blank');
  };

  // Go back to main list
  const goBack = () => {
    window.location.hash = '';
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const processed = data.tokens.map(t => ({
        ...t,
        category: getCat(t.id),
        volMcap: t.mcap ? (t.volume / t.mcap) * 100 : 0,
      }));

      setTokens(processed);
      setLastUpdate(new Date(data.timestamp));
      setApiStats(data.stats);
      setLoading(false);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 180000); return () => clearInterval(i); }, [fetchData]);

  const resetFilters = () => {
    setSearch('');
    setCat('all');
    setPreset(null);
    setShowWL(false);
    setRsiFilter(null);
    setSortBy('rsi_asc');
  };

  const toggleWatch = useCallback((id, e) => {
    e?.stopPropagation();
    setWatchlist(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const filtered = useMemo(() => {
    let r = [...tokens];
    if (search) { const s = search.toLowerCase(); r = r.filter(t => t.name?.toLowerCase().includes(s) || t.symbol?.toLowerCase().includes(s)); }
    if (cat !== 'all') r = r.filter(t => t.category === cat);
    if (showWL) r = r.filter(t => watchlist.has(t.id));
    if (preset) { const p = PRESETS.find(x => x.id === preset); if (p) r = r.filter(p.filter); }
    
    // RSI category filter
    if (rsiFilter === 'extreme') r = r.filter(t => t.rsi !== null && t.rsi < 20);
    else if (rsiFilter === 'oversold') r = r.filter(t => t.rsi !== null && t.rsi >= 20 && t.rsi < 30);
    else if (rsiFilter === 'neutral') r = r.filter(t => t.rsi !== null && t.rsi >= 30 && t.rsi < 70);
    else if (rsiFilter === 'overbought') r = r.filter(t => t.rsi !== null && t.rsi >= 70);

    const activeSort = preset ? PRESETS.find(x => x.id === preset)?.sort || sortBy : sortBy;
    const [field, dir] = activeSort.split('_');
    r.sort((a, b) => {
      let va = a[field], vb = b[field];
      if (va === null || va === undefined) va = dir === 'asc' ? Infinity : -Infinity;
      if (vb === null || vb === undefined) vb = dir === 'asc' ? Infinity : -Infinity;
      return dir === 'asc' ? va - vb : vb - va;
    });
    return r;
  }, [tokens, search, cat, sortBy, showWL, watchlist, preset, rsiFilter]);

  const stats = useMemo(() => {
    const withRSI = tokens.filter(t => t.rsi !== null);
    return {
      extreme: withRSI.filter(t => t.rsi < 20).length,
      oversold: withRSI.filter(t => t.rsi >= 20 && t.rsi < 30).length,
      neutral: withRSI.filter(t => t.rsi >= 30 && t.rsi < 70).length,
      overbought: withRSI.filter(t => t.rsi >= 70).length,
      totalMcap: tokens.reduce((s, t) => s + (t.mcap || 0), 0),
      avgRsi: withRSI.length ? withRSI.reduce((s, t) => s + t.rsi, 0) / withRSI.length : 50,
      withRSI: withRSI.length,
    };
  }, [tokens]);

  const exportCSV = useCallback(() => {
    const h = ['Rank','Symbol','Name','Price','1h%','24h%','7d%','30d%','RSI','MCap','Volume','Category'];
    const rows = filtered.map(t => [t.rank,t.symbol,t.name,t.price,t.change1h?.toFixed(2),t.change24h?.toFixed(2),t.change7d?.toFixed(2),t.change30d?.toFixed(2),t.rsi?.toFixed(1),t.mcap,t.volume,t.category]);
    const blob = new Blob([[h,...rows].map(r=>r.join(',')).join('\n')],{type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `oversold_${Date.now()}.csv`; a.click();
  }, [filtered]);

  // If we're on a token detail page, render that instead
  const pageToken = pageTokenId ? tokens.find(t => t.id === pageTokenId) : null;
  
  if (pageTokenId) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
            <p className="text-gray-400">Loading token data...</p>
          </div>
        </div>
      );
    }
    if (!pageToken) {
      return (
        <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-4xl mb-4">😕</p>
            <p className="text-xl mb-2">Token not found</p>
            <p className="text-gray-400 mb-4">"{pageTokenId}" is not in the top 150 tokens</p>
            <button onClick={goBack} className="px-6 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">
              Back to list
            </button>
          </div>
        </div>
      );
    }
    return <TokenDetailPage token={pageToken} onBack={goBack} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-orange-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px]"/>
        <div className="absolute bottom-0 right-1/3 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[120px]"/>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 onClick={resetFilters} className="text-4xl font-black tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">OVERSOLD</span>
              <span className="text-gray-600">.crypto</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                <span className="text-gray-400 text-sm">Live</span>
              </div>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500 text-sm">{lastUpdate?.toLocaleTimeString() || 'Loading...'}</span>
              {apiStats && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-500 text-sm">{apiStats.withRSI}/{apiStats.total} RSI loaded</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl text-sm flex items-center gap-3">
              <div><span className="text-gray-500">MCap</span> <span className="font-mono font-semibold">${fmt(stats.totalMcap)}</span></div>
              <div className="w-px h-4 bg-white/10"/>
              <div>
                <span className="text-gray-500">Avg RSI</span>
                <span className={`font-mono font-semibold ml-1 ${stats.avgRsi<30?'text-red-400':stats.avgRsi>70?'text-green-400':'text-gray-300'}`}>
                  {stats.avgRsi.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            {k:'extreme',color:'red',label:'EXTREME',sub:'RSI < 20'},
            {k:'oversold',color:'orange',label:'OVERSOLD',sub:'RSI < 30'},
            {k:'neutral',color:'gray',label:'NEUTRAL',sub:'RSI 30-70'},
            {k:'overbought',color:'green',label:'OVERBOUGHT',sub:'RSI > 70'},
          ].map(s => (
            <div 
              key={s.k} 
              onClick={() => { setRsiFilter(rsiFilter === s.k ? null : s.k); setPreset(null); }}
              className={`bg-${s.color}-500/10 border-2 rounded-xl p-4 text-center transition-all cursor-pointer hover:scale-[1.03] ${
                rsiFilter === s.k 
                  ? `border-${s.color}-500 shadow-lg shadow-${s.color}-500/20` 
                  : `border-${s.color}-500/20 hover:border-${s.color}-500/50`
              }`}
            >
              <p className={`text-3xl font-bold text-${s.color}-400`}>{stats[s.k]}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{s.label}</p>
              <p className="text-[10px] text-gray-600">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Active filter indicator */}
        {rsiFilter && (
          <div className="flex items-center gap-2 mb-4 px-4 py-2 bg-white/5 rounded-xl w-fit">
            <span className="text-sm text-gray-400">
              Showing: <span className="text-white font-medium capitalize">{rsiFilter}</span> tokens
            </span>
            <button 
              onClick={() => setRsiFilter(null)}
              className="text-gray-400 hover:text-white ml-2 text-lg"
              title="Clear filter"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => { setPreset(preset === p.id ? null : p.id); setRsiFilter(null); }}
              className={`px-4 py-2 rounded-xl text-sm whitespace-nowrap transition-all font-medium ${
                preset === p.id ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20' 
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}>
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <input type="text" placeholder="Search tokens..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.07] transition-all"/>
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {CATS.map(c => (
              <button key={c.id} onClick={() => setCat(c.id)}
                className={`px-4 py-2.5 rounded-xl text-sm whitespace-nowrap transition-all font-medium ${
                  cat === c.id ? 'bg-white text-gray-900' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setPreset(null); }}
              className="bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none cursor-pointer text-white appearance-none min-w-[180px]"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px', paddingRight: '40px' }}>
              <option value="rsi_asc" className="bg-gray-900 py-2">RSI ↑ (Oversold first)</option>
              <option value="rsi_desc" className="bg-gray-900 py-2">RSI ↓ (Overbought first)</option>
              <option value="change24h_asc" className="bg-gray-900 py-2">24h % ↑ (Losers)</option>
              <option value="change24h_desc" className="bg-gray-900 py-2">24h % ↓ (Gainers)</option>
              <option value="change7d_asc" className="bg-gray-900 py-2">7d % ↑ (Losers)</option>
              <option value="change7d_desc" className="bg-gray-900 py-2">7d % ↓ (Gainers)</option>
              <option value="mcap_desc" className="bg-gray-900 py-2">Market Cap ↓</option>
              <option value="volume_desc" className="bg-gray-900 py-2">Volume ↓</option>
              <option value="rank_asc" className="bg-gray-900 py-2">Rank ↑</option>
            </select>
            <button onClick={() => setShowWL(w => !w)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showWL ? 'bg-yellow-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}>
              ⭐ {watchlist.size}
            </button>
            <button onClick={exportCSV} className="px-4 py-2.5 rounded-xl text-sm bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5" title="Export CSV">📥</button>
            <button onClick={fetchData} className="px-4 py-2.5 rounded-xl text-sm bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5" title="Refresh">🔄</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto"/>
            <p className="text-gray-400 mt-5">Loading market data...</p>
            <p className="text-gray-600 text-sm mt-1">Fetching from CoinMarketCap...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-xl mb-2">⚠️ {error}</p>
            <p className="text-gray-500 text-sm mb-5">Make sure your API is deployed and CMC_API_KEY is configured</p>
            <button onClick={fetchData} className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 rounded-xl font-medium transition-colors">Retry</button>
          </div>
        ) : (
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
            <div className="hidden lg:grid grid-cols-12 gap-3 px-5 py-3 border-b border-white/10 text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <div className="col-span-3">Token</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-1 text-right">24H</div>
              <div className="col-span-1 text-right">7D</div>
              <div className="col-span-2 text-center">RSI (14)</div>
              <div className="col-span-2 text-right">Chart</div>
              <div className="col-span-1 text-center">Watch</div>
            </div>

            <div className="max-h-[58vh] overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="text-center py-16"><p className="text-4xl mb-3">🔍</p><p className="text-gray-400">No tokens match your filters</p></div>
              ) : filtered.map((t) => {
                const rs = rsiStyle(t.rsi);
                const watched = watchlist.has(t.id);
                const sparkColor = t.sparkline?.length > 1 ? (t.sparkline[t.sparkline.length-1] >= t.sparkline[0] ? '#22c55e' : '#ef4444') : '#6b7280';
                return (
                  <div key={t.id} onClick={() => setSel(t)}
                    className={`grid grid-cols-8 lg:grid-cols-12 gap-3 px-5 py-3.5 border-b border-white/5 hover:bg-white/[0.04] cursor-pointer transition-colors ${watched ? 'bg-yellow-500/[0.04]' : ''}`}>
                    <div className="col-span-3 flex items-center gap-3">
                      <span className="text-xs text-gray-600 w-5 text-right">{t.rank}</span>
                      <img 
                        src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${t.cmcId}.png`} 
                        alt={t.symbol}
                        className="w-9 h-9 rounded-full shrink-0 bg-gray-800"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 items-center justify-center text-sm font-bold shrink-0 hidden">{t.symbol?.charAt(0)}</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <a 
                            href={`#/token/${t.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold hover:text-orange-400 transition-colors"
                          >
                            {t.symbol}
                          </a>
                          {t.rsi !== null && t.rsi < 25 && <span className="text-xs" title="Oversold">🔴</span>}
                          {t.rsi !== null && t.rsi > 75 && <span className="text-xs" title="Overbought">🟢</span>}
                        </div>
                        <a 
                          href={`#/token/${t.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-gray-500 truncate block hover:text-gray-300 transition-colors"
                        >
                          {t.name}
                        </a>
                      </div>
                    </div>
                    <div className="col-span-2 text-right self-center font-mono text-sm">{fmtP(t.price)}</div>
                    <div className="col-span-1 text-right self-center text-sm hidden lg:block">
                      <span className={t.change24h >= 0 ? 'text-green-400' : 'text-red-400'}>{t.change24h >= 0 ? '+' : ''}{t.change24h?.toFixed(1)}%</span>
                    </div>
                    <div className="col-span-1 text-right self-center text-sm">
                      <span className={t.change7d >= 0 ? 'text-green-400' : 'text-red-400'}>{t.change7d >= 0 ? '+' : ''}{t.change7d?.toFixed(1)}%</span>
                    </div>
                    <div className="col-span-2 self-center flex justify-center">
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${rs.bg} ${rs.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rs.dot}`}/>
                        <span className="font-bold text-sm">{t.rsi !== null ? t.rsi.toFixed(0) : '--'}</span>
                        <span className="text-[10px] opacity-70 hidden sm:inline">{rs.label}</span>
                      </div>
                    </div>
                    <div className="col-span-2 self-center hidden lg:flex justify-end">
                      <Spark data={t.sparkline} color={sparkColor} h={24}/>
                    </div>
                    <div className="col-span-1 self-center flex justify-center">
                      <button 
                        onClick={e => toggleWatch(t.id, e)} 
                        className={`text-xl hover:scale-110 transition-transform ${watched ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-400'}`}
                        title={watched ? 'Remove from watchlist' : 'Add to watchlist'}
                      >
                        {watched ? '★' : '☆'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row justify-between gap-2 text-xs text-gray-500">
              <span>{filtered.length} tokens • {stats.withRSI} with RSI data</span>
              <span>Data: CoinMarketCap • Auto-refresh 3min</span>
            </div>
          </div>
        )}

        {sel && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSel(null)}>
            <div className="bg-[#12121a] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-4 mb-5">
                <img 
                  src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${sel.cmcId}.png`}
                  alt={sel.symbol}
                  className="w-16 h-16 rounded-2xl bg-gray-800"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-800 items-center justify-center text-2xl font-bold hidden">{sel.symbol?.charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">{sel.name}</h2>
                    <button onClick={e => toggleWatch(sel.id, e)} className={`text-xl ${watchlist.has(sel.id) ? 'text-yellow-400' : 'text-gray-600'}`}>{watchlist.has(sel.id) ? '★' : '☆'}</button>
                  </div>
                  <p className="text-gray-400">{sel.symbol} • Rank #{sel.rank}</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-5">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-400">RSI (14)</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${rsiStyle(sel.rsi).dot}`}/>
                    <span className={`text-2xl font-bold ${rsiStyle(sel.rsi).text}`}>{sel.rsi !== null ? sel.rsi.toFixed(1) : 'N/A'}</span>
                    <span className={`text-sm ${rsiStyle(sel.rsi).text} opacity-70`}>{rsiStyle(sel.rsi).label}</span>
                  </div>
                </div>
                <RSIMeter value={sel.rsi}/>
                {sel.rsi === null && <p className="text-xs text-gray-500 mt-2 text-center">RSI data not available for this token</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {icon:'💰', label:'Price', value:fmtP(sel.price)},
                  {icon:'📊', label:'Market Cap', value:'$'+fmt(sel.mcap)},
                  {icon:'📈', label:'24h Volume', value:'$'+fmt(sel.volume)},
                  {icon:'🔄', label:'Vol/MCap', value:sel.volMcap?.toFixed(2)+'%'},
                  {icon:'💎', label:'Circulating', value:fmt(sel.supply)},
                  {icon:'🏆', label:'Dominance', value:(sel.dominance||0).toFixed(2)+'%'},
                ].map(x => (
                  <div key={x.label} className="bg-white/5 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{x.icon} {x.label}</p>
                    <p className="text-lg font-bold">{x.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2 mb-5">
                {[{l:'1H', v:sel.change1h},{l:'24H', v:sel.change24h},{l:'7D', v:sel.change7d},{l:'30D', v:sel.change30d}].map(x => (
                  <div key={x.l} className="bg-white/5 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-gray-500 mb-1">{x.l}</p>
                    <p className={`font-bold ${(x.v||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{x.v != null ? `${x.v >= 0 ? '+' : ''}${x.v.toFixed(1)}%` : '--'}</p>
                  </div>
                ))}
              </div>

              {sel.sparkline && sel.sparkline.length > 1 && (
                <div className="bg-white/5 rounded-xl p-4 mb-5">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm text-gray-400 font-medium">7-Day Price Chart</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${sel.change7d >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {sel.change7d >= 0 ? '+' : ''}{sel.change7d?.toFixed(2)}%
                    </span>
                  </div>
                  <DetailChart 
                    data={sel.sparkline} 
                    basePrice={sel.price} 
                    symbol={sel.symbol}
                    change7d={sel.change7d}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <a href={`https://coinmarketcap.com/currencies/${sel.id}/`} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-blue-500/20 hover:bg-blue-500/30 rounded-xl text-center text-blue-400 font-medium transition-colors">CoinMarketCap ↗</a>
                <a href={`https://www.tradingview.com/symbols/${sel.symbol}USD`} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl text-center text-emerald-400 font-medium transition-colors">TradingView ↗</a>
              </div>
              <button 
                onClick={(e) => { openTokenPage(sel.id, e); setSel(null); }} 
                className="w-full mt-3 py-3 bg-orange-500/20 hover:bg-orange-500/30 rounded-xl text-orange-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Full Page in New Tab
              </button>
              <button onClick={() => setSel(null)} className="w-full mt-2 py-3 bg-white/10 hover:bg-white/15 rounded-xl font-medium transition-colors">Close</button>
            </div>
          </div>
        )}

        <footer className="text-center text-gray-600 text-xs mt-8 pb-4">
          <p>Data from CoinMarketCap • Momentum score based on price changes</p>
          <p className="mt-1">Momentum score calculated from 1h/24h/7d/30d price changes • Not financial advice</p>
        </footer>
      </div>
    </div>
  );
}
