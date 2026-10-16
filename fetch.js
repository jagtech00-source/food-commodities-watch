// Food commodities dashboard - live prices from Stooq
// Tickers: Stooq symbol .US for US futures-style ETFs / .F for futures
const COMMODITIES = [
  // Grains
  { sym: 'CORN', name: 'Corn',       stooq: 'corn.us',   unit: 'USD/bu' },
  { sym: 'WEAT', name: 'Wheat',      stooq: 'weat.us',   unit: 'USD/bu' },
  { sym: 'SOYB', name: 'Soybeans',   stooq: 'soyb.us',   unit: 'USD/bu' },
  { sym: 'ZW',   name: 'Wheat Fut.', stooq: 'zw.f',     unit: 'USD/bu' },
  { sym: 'ZC',   name: 'Corn Fut.',  stooq: 'zc.f',     unit: 'USD/bu' },
  { sym: 'ZS',   name: 'Soybean Fut.', stooq: 'zs.f',   unit: 'USD/bu' },
  // Softs
  { sym: 'KC',   name: 'Coffee',     stooq: 'kc.f',     unit: 'USD/lb' },
  { sym: 'SB',   name: 'Sugar',      stooq: 'sb.f',     unit: 'USD/lb' },
  { sym: 'CT',   name: 'Cotton',     stooq: 'ct.f',     unit: 'USD/lb' },
  { sym: 'JO',   name: 'Orange Juice', stooq: 'jo.f',   unit: 'USD/lb' },
  { sym: 'CC',   name: 'Cocoa',      stooq: 'cc.f',     unit: 'USD/MT' },
  // Livestock
  { sym: 'HE',   name: 'Lean Hogs',  stooq: 'he.f',     unit: 'USD/lb' },
  { sym: 'LE',   name: 'Live Cattle',stooq: 'le.f',     unit: 'USD/lb' },
  // ETFs (broad exposure)
  { sym: 'DBA',  name: 'Agriculture ETF', stooq: 'dba.us', unit: 'USD' },
  { sym: 'MOO',  name: 'Agribusiness ETF', stooq: 'moo.us', unit: 'USD' },
];

const CORS = 'https://api.allorigins.win/raw?url=';

function fmt(n, dec) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

async function fetchOne(c) {
  const url = CORS + encodeURIComponent('https://stooq.com/q/l/?s=' + c.stooq + '&f=sd2t2ohlcv&h&e=csv');
  try {
    const res = await fetch(url);
    const text = await res.text();
    const lines = text.trim().split('\n').filter(l => l && !l.startsWith('Symbol'));
    if (!lines.length) return { ...c, err: 'no data' };
    const cols = lines[lines.length - 1].split(',);
    // Symbol,Date,Time,Open,High,Low,Close,Volume
    const close = parseFloat(cols[6]);
    const open = parseFloat(cols[3]);
    const vol = cols[7];
    if (isNaN(close)) return { ...c, err: 'bad row' };
    const chg = close - open;
    const pct = open ? (chg / open) * 100 : 0;
    return { ...c, close, chg, pct, vol };
  } catch (e) {
    return { ...c, err: e.message };
  }
}

async function loadAll() {
  const grid = document.getElementById('grid);
  grid.innerHTML = '<div class="loading">Pulling live prices from Stooq...</div>';
  const results = await Promise.all(COMMODITIES.map(fetchOne));
  const ts = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
  document.getElementById('ts').textContent = 'Last updated: ' + ts + ' ET';
  grid.innerHTML = '';
  results.forEach(r => {
    const card = document.createElement('div);
    card.className = 'card';
    if (r.err) {
      card.innerHTML = `<div class="sym">${r.sym}</div><div class="name">${r.name}</div><div class="err">${r.err}</div>`;
    } else {
      const cls = r.chg >= 0 ? 'up' : 'down';
      const arrow = r.chg >= 0 ? '&#9650;' : '&#9660;';
      card.innerHTML = `
        <div class="sym">${r.sym} &middot; ${r.unit}</div>
        <div class="name">${r.name}</div>
        <div class="price">${fmt(r.close, 2)}</div>
        <div class="chg ${cls}">${arrow} ${fmt(r.chg, 2)} (${fmt(r.pct, 2)}%) day</div>`;
    }
    grid.appendChild(card);
  });
}

loadAll();