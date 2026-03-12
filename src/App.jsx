import { useState, useEffect } from 'react';

const BASE_URL = `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE}/${import.meta.env.VITE_AIRTABLE_TABLE}`;
const AT_KEY = import.meta.env.VITE_AIRTABLE_TOKEN;

// Approximate Albers USA coordinates (960x600 SVG viewport)
const CITY_COORDS = {
  'New Orleans':    [719, 447],
  'Baton Rouge':    [706, 443],
  'Tampa':          [786, 471],
  'Miami':          [814, 500],
  'Nashville':      [731, 365],
  'Austin':         [554, 448],
  'Salt Lake City': [295, 300],
};

const TYPE_COLORS = {
  'Venture Fund':    '#c8302a',
  'Accelerator':     '#1d4ed8',
  'Economic Dev':    '#15803d',
  'Government':      '#7c3aed',
  'University Fund': '#b45309',
  'Family Office':   '#0e7490',
  'Angel Group':     '#be185d',
};

// Minimal TopoJSON decoder — no d3 required
function decodeTopojson(topology) {
  try {
    const { arcs, transform: { scale: [sx, sy], translate: [tx, ty] } } = topology;
    const decoded = arcs.map(arc => {
      let x = 0, y = 0;
      return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
    });
    const getArc = i => i < 0 ? [...decoded[~i]].reverse() : decoded[i];
    const ringToPath = ring => {
      const pts = ring.flatMap((i, j) => j === 0 ? getArc(i) : getArc(i).slice(1));
      return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
    };
    return topology.objects.states.geometries.map(g => {
      const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
      return { id: g.id, d: polys.map(poly => poly.map(ringToPath).join('')).join('') };
    });
  } catch { return []; }
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: 'transparent', border: '1px solid #1a1a1a', padding: '6px 28px 6px 10px',
      fontSize: 10, letterSpacing: 1.5, fontFamily: '"DM Mono", monospace', cursor: 'pointer',
      appearance: 'none', color: '#1a1a1a', minWidth: 130,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%231a1a1a'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
    }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function FundCard({ fund, onClick }) {
  const [hov, setHov] = useState(false);
  const color = TYPE_COLORS[fund.type] || '#888';
  return (
    <div onClick={() => onClick(fund)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '20px 22px', cursor: 'pointer', background: hov ? '#1a1a1a' : '#faf6f0',
        color: hov ? '#faf6f0' : '#1a1a1a', transition: 'all 0.12s', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: hov ? '#ccc' : color }}>{fund.type}</span>
        <span style={{ fontSize: 9, letterSpacing: 1, opacity: 0.5 }}>{fund.city}, {fund.state}</span>
      </div>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>
        {fund.name}
      </div>
      {fund.thesis && (
        <div style={{ fontSize: 11, lineHeight: 1.6, opacity: 0.65, marginBottom: 12,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {fund.thesis}
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, fontSize: 10, letterSpacing: 1, opacity: 0.55 }}>
        {fund.stage && <span>▸ {fund.stage}</span>}
        {fund.size && fund.size.startsWith('$') && <span>{fund.size}</span>}
        {fund.vintage && <span>Est. {fund.vintage}</span>}
      </div>
    </div>
  );
}

function DetailPanel({ fund, onClose }) {
  if (!fund) return null;
  const color = TYPE_COLORS[fund.type] || '#888';
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
        background: '#faf6f0', borderLeft: '2px solid #1a1a1a', zIndex: 100,
        display: 'flex', flexDirection: 'column', fontFamily: '"DM Mono", monospace',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '18px 28px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color }}>{fund.type}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#1a1a1a', padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 28, overflowY: 'auto', flex: 1 }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.2 }}>{fund.name}</h2>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 24, letterSpacing: 1 }}>{fund.city}, {fund.state}</div>
          {fund.thesis && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>THESIS</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{fund.thesis}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 24 }}>
            {[['Stage', fund.stage], ['Fund Size', fund.size], ['Vintage', fund.vintage ? `Est. ${fund.vintage}` : ''], ['GP', fund.gp]]
              .filter(([, v]) => v).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#888', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13 }}>{val}</div>
                </div>
              ))}
          </div>
          {fund.industries && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#888', marginBottom: 8 }}>SECTORS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fund.industries.split(',').map(i => (
                  <span key={i} style={{ border: `1px solid ${color}`, color, fontSize: 9, padding: '3px 8px', letterSpacing: 1 }}>{i.trim()}</span>
                ))}
              </div>
            </div>
          )}
          {fund.website && (
            <a href={fund.website} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', marginTop: 8, padding: '10px 20px', background: '#1a1a1a',
                color: '#faf6f0', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none' }}>
              VISIT WEBSITE →
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function DirectoryTab({ funds, loading, error, search, setSearch, cityFilter, setCityFilter,
  typeFilter, setTypeFilter, stageFilter, setStageFilter, cities, types, stages, selected, setSelected }) {
  return (
    <div>
      <div style={{ padding: '14px 48px', borderBottom: '1px solid #d4cfc7', display: 'flex', gap: 10,
        alignItems: 'center', flexWrap: 'wrap', background: '#f0ebe3' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH FUNDS, THESIS, SECTORS…"
          style={{ background: 'transparent', border: '1px solid #1a1a1a', padding: '6px 12px',
            fontSize: 10, letterSpacing: 1.5, fontFamily: '"DM Mono", monospace', outline: 'none',
            minWidth: 260, color: '#1a1a1a' }} />
        <Select value={cityFilter} onChange={setCityFilter} options={cities} />
        <Select value={typeFilter} onChange={setTypeFilter} options={types} />
        <Select value={stageFilter} onChange={setStageFilter} options={stages} />
        <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: 2, opacity: 0.45 }}>
          {!loading && `${funds.length} RESULTS`}
        </span>
      </div>
      <div style={{ padding: '32px 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 10, letterSpacing: 3, opacity: 0.4 }}>FETCHING LIVE DATA…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 10, letterSpacing: 3, color: '#c8302a' }}>CONNECTION ERROR</div>
        ) : funds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 10, letterSpacing: 3, opacity: 0.4 }}>NO RESULTS</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 0, border: '1px solid #1a1a1a', borderBottom: 'none', borderRight: 'none' }}>
            {funds.map(f => (
              <div key={f.id} style={{ borderBottom: '1px solid #1a1a1a', borderRight: '1px solid #1a1a1a' }}>
                <FundCard fund={f} onClick={setSelected} />
              </div>
            ))}
          </div>
        )}
      </div>
      {selected && <DetailPanel fund={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function NetworkTab({ funds, mapPaths, cityClusters, mapCity, setMapCity }) {
  const [hovered, setHovered] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, label: '' });
  const [selectedFund, setSelectedFund] = useState(null);
  const mapFunds = mapCity ? (cityClusters[mapCity] || []) : [];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 118px)', overflow: 'hidden' }}>
      {/* Map area */}
      <div style={{ flex: 1, padding: '24px 28px 16px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: '#888', marginBottom: 12 }}>
          CAPITAL NETWORK — UNITED STATES
        </div>
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <svg viewBox="0 0 960 600" style={{ width: '100%', height: '100%', display: 'block' }} preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}>

            {/* State fills */}
            {mapPaths.length > 0
              ? mapPaths.map(({ id, d }) => <path key={id} d={d} fill="#ece6dc" stroke="#bfb8ae" strokeWidth="0.5" strokeLinejoin="round" />)
              : <rect x="60" y="50" width="840" height="490" fill="#ece6dc" stroke="#bfb8ae" strokeWidth="1" rx="6" />
            }

            {/* City clusters */}
            {Object.entries(cityClusters).map(([city, cityFunds]) => {
              const coords = CITY_COORDS[city];
              if (!coords) return null;
              const [cx, cy] = coords;
              const count = cityFunds.length;
              const r = Math.min(7 + count * 2.8, 26);
              const sel = mapCity === city;
              const hov = hovered === city;
              const typeCounts = {};
              cityFunds.forEach(f => { typeCounts[f.type] = (typeCounts[f.type] || 0) + 1; });
              const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
              const dotColor = TYPE_COLORS[topType] || '#888';
              return (
                <g key={city} transform={`translate(${cx},${cy})`} style={{ cursor: 'pointer' }}
                  onClick={() => setMapCity(sel ? null : city)}
                  onMouseEnter={e => {
                    setHovered(city);
                    const svgRect = e.currentTarget.closest('svg').getBoundingClientRect();
                    const scaleX = 960 / svgRect.width;
                    const scaleY = 600 / svgRect.height;
                    setTooltip({ visible: true, x: cx, y: cy - r - 10, label: `${city} · ${count} fund${count !== 1 ? 's' : ''}` });
                  }}
                  onMouseLeave={() => { setHovered(null); setTooltip(t => ({ ...t, visible: false })); }}
                >
                  {sel && <circle r={r + 10} fill="none" stroke={dotColor} strokeWidth="1" opacity="0.35" />}
                  <circle r={r} fill={dotColor} opacity={sel ? 1 : hov ? 0.88 : 0.72}
                    stroke="#faf6f0" strokeWidth={sel ? 2.5 : 1.5} style={{ transition: 'all 0.15s' }} />
                  <text textAnchor="middle" dy="0.35em" fontSize={r < 12 ? 9 : 11}
                    fontFamily='"DM Mono", monospace' fontWeight="700" fill="#faf6f0" style={{ pointerEvents: 'none' }}>
                    {count}
                  </text>
                  <text textAnchor="middle" dy={r + 13} fontSize="8" fontFamily='"DM Mono", monospace'
                    letterSpacing="1.5" fill="#1a1a1a" opacity={sel || hov ? 0.9 : 0.55} style={{ pointerEvents: 'none' }}>
                    {city.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {tooltip.visible && (
              <g transform={`translate(${tooltip.x},${tooltip.y})`} style={{ pointerEvents: 'none' }}>
                <rect x={-6} y={-17} width={tooltip.label.length * 6.4 + 12} height={22} fill="#1a1a1a" rx="2" />
                <text fontSize="10" fontFamily='"DM Mono", monospace' fill="#faf6f0" letterSpacing="1" dy="-1">{tooltip.label}</text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12, paddingTop: 12, borderTop: '1px solid #d4cfc7' }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8.5, letterSpacing: 1.5, textTransform: 'uppercase', opacity: 0.65 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {type}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 340, borderLeft: '2px solid #1a1a1a', display: 'flex', flexDirection: 'column', background: '#f0ebe3', flexShrink: 0 }}>
        {mapCity ? (
          <>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #d4cfc7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 17, fontWeight: 700 }}>{mapCity}</div>
                <div style={{ fontSize: 8, letterSpacing: 2.5, opacity: 0.45, marginTop: 3 }}>{mapFunds.length} FUND{mapFunds.length !== 1 ? 'S' : ''} INDEXED</div>
              </div>
              <button onClick={() => setMapCity(null)} style={{ background: 'none', border: '1px solid #aaa', cursor: 'pointer',
                width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontFamily: '"DM Mono", monospace', color: '#1a1a1a', flexShrink: 0 }}>
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mapFunds.map(f => {
                const color = TYPE_COLORS[f.type] || '#888';
                return (
                  <div key={f.id} onClick={() => setSelectedFund(f)}
                    style={{ padding: '14px 22px', borderBottom: '1px solid #d4cfc7', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5dfd6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 8, letterSpacing: 2.5, textTransform: 'uppercase', color, marginBottom: 5 }}>{f.type}</div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{f.name}</div>
                    <div style={{ fontSize: 9.5, opacity: 0.5, display: 'flex', gap: 12 }}>
                      {f.stage && <span>{f.stage}</span>}
                      {f.size && f.size.startsWith('$') && <span>{f.size}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', opacity: 0.4 }}>
            <div style={{ fontSize: 36, marginBottom: 16, fontFamily: 'serif' }}>◎</div>
            <div style={{ fontSize: 9.5, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 2 }}>
              SELECT A CITY DOT<br />TO EXPLORE<br />CAPITAL FLOWS
            </div>
          </div>
        )}
      </div>

      {selectedFund && <DetailPanel fund={selectedFund} onClose={() => setSelectedFund(null)} />}
    </div>
  );
}

export default function App() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('directory');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All Cities');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [selected, setSelected] = useState(null);
  const [mapPaths, setMapPaths] = useState([]);
  const [mapCity, setMapCity] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      try {
        let all = [], offset = null;
        do {
          const url = BASE_URL + (offset ? `?offset=${offset}` : '');
          const res = await fetch(url, { headers: { Authorization: `Bearer ${AT_KEY}` } });
          const data = await res.json();
          all = all.concat(data.records || []);
          offset = data.offset || null;
        } while (offset);
        setFunds(all.map(r => ({
          id: r.id,
          name: r.fields['Fund Name'] || '',
          gp: r.fields['GP Name'] || '',
          size: r.fields['Fund Size'] || '',
          vintage: r.fields['Vintage Year'] || '',
          stage: r.fields['Stage'] || '',
          thesis: r.fields['Thesis'] || '',
          industries: r.fields['Industries'] || '',
          city: r.fields['City'] || '',
          state: r.fields['State'] || '',
          website: r.fields['Website'] || '',
          type: r.fields['Capital Type'] || '',
        })).filter(f => f.name));
        setLoading(false);
      } catch { setError(true); setLoading(false); }
    };
    loadAll();
  }, []);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json()).then(t => setMapPaths(decodeTopojson(t))).catch(() => {});
  }, []);

  const cities = ['All Cities', ...[...new Set(funds.map(f => f.city).filter(Boolean))].sort()];
  const types = ['All Types', ...Object.keys(TYPE_COLORS)];
  const stages = ['All Stages', 'Pre-Seed', 'Seed', 'Series A', 'Multi-Stage'];

  const filtered = funds.filter(f =>
    (cityFilter === 'All Cities' || f.city === cityFilter) &&
    (typeFilter === 'All Types' || f.type === typeFilter) &&
    (stageFilter === 'All Stages' || f.stage === stageFilter) &&
    (!search || [f.name, f.thesis, f.industries].join(' ').toLowerCase().includes(search.toLowerCase()))
  );

  const cityClusters = {};
  funds.forEach(f => {
    if (!f.city || !CITY_COORDS[f.city]) return;
    (cityClusters[f.city] = cityClusters[f.city] || []).push(f);
  });

  return (
    <div style={{ minHeight: '100vh', background: '#faf6f0', fontFamily: '"DM Mono", monospace', color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #faf6f0; } ::-webkit-scrollbar-thumb { background: #1a1a1a; }
        input::placeholder { opacity: 0.4; }
      `}</style>

      <header style={{ borderBottom: '2px solid #1a1a1a', padding: '18px 48px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: 5, textTransform: 'uppercase', color: '#c8302a', marginBottom: 4 }}>EMERGING CAPITAL NETWORK ///</div>
          <h1 style={{ margin: 0, fontSize: 24, fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
            US Capital Directory
          </h1>
        </div>
        <nav style={{ marginLeft: 'auto', display: 'flex', borderLeft: '1px solid #1a1a1a' }}>
          {['directory', 'network'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '9px 28px', background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? '#faf6f0' : '#1a1a1a', border: 'none', borderRight: '1px solid #1a1a1a',
              cursor: 'pointer', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
              fontFamily: '"DM Mono", monospace', transition: 'all 0.12s',
            }}>{t}</button>
          ))}
        </nav>
      </header>

      <div style={{ padding: '6px 48px', background: '#1a1a1a', color: '#666', fontSize: 8.5, letterSpacing: 2, display: 'flex', gap: 28 }}>
        <span style={{ color: loading ? '#888' : error ? '#c8302a' : '#4ade80' }}>
          {loading ? '● FETCHING…' : error ? '● ERROR' : `● ${funds.length} FUNDS`}
        </span>
        {!loading && !error && (
          <span>{[...new Set(funds.map(f => f.city))].filter(Boolean).length} CITIES · {[...new Set(funds.map(f => f.state))].filter(Boolean).length} STATES</span>
        )}
      </div>

      {tab === 'directory'
        ? <DirectoryTab funds={filtered} loading={loading} error={error}
            search={search} setSearch={setSearch} cityFilter={cityFilter} setCityFilter={setCityFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter} stageFilter={stageFilter} setStageFilter={setStageFilter}
            cities={cities} types={types} stages={stages} selected={selected} setSelected={setSelected} />
        : <NetworkTab funds={funds} mapPaths={mapPaths} cityClusters={cityClusters} mapCity={mapCity} setMapCity={setMapCity} />
      }
    </div>
  );
}
