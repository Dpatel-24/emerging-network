import { useState, useEffect, useRef } from 'react';

const BASE_URL = `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE}/${import.meta.env.VITE_AIRTABLE_TABLE}`;
const AT_KEY = import.meta.env.VITE_AIRTABLE_TOKEN;

const TYPE_COLORS = {
  'Venture Fund':    '#c8302a',
  'Accelerator':     '#1d4ed8',
  'Economic Dev':    '#15803d',
  'Government':      '#7c3aed',
  'University Fund': '#b45309',
  'Family Office':   '#0e7490',
  'Angel Group':     '#be185d',
};

// Albers USA 960x600 projected coordinates
const CITY_COORDS = {
  'New Orleans':    [719, 438],
  'Baton Rouge':    [701, 432],
  'Tampa':          [787, 466],
  'Miami':          [812, 496],
  'Nashville':      [728, 356],
  'Austin':         [549, 460],
  'Salt Lake City': [295, 295],
};

function decodeTopojson(topo) {
  try {
    const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;
    const decoded = topo.arcs.map(arc => {
      let x = 0, y = 0;
      return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
    });
    const getArc = i => i < 0 ? [...decoded[~i]].reverse() : decoded[i];
    const ringToPath = ring => {
      const pts = ring.flatMap((idx, j) => j === 0 ? getArc(idx) : getArc(idx).slice(1));
      return 'M' + pts.map(([px, py]) => `${px.toFixed(1)},${py.toFixed(1)}`).join('L') + 'Z';
    };
    return topo.objects.states.geometries.map(g => {
      const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
      return { id: g.id, d: polys.map(poly => poly.map(ringToPath).join('')).join('') };
    });
  } catch (e) { console.error('[map] decode:', e); return []; }
}

function parseFundSize(s) {
  if (!s) return null;
  const c = s.replace(/[$,+\s]/g, '').toUpperCase();
  if (c.includes('B')) return parseFloat(c) * 1000;
  if (c.includes('M')) return parseFloat(c);
  const n = parseFloat(c); return isNaN(n) ? null : n;
}
function fundSizeBucket(s) {
  const n = parseFundSize(s); if (n === null) return null;
  if (n < 10) return 'Micro (<$10M)'; if (n < 50) return 'Small ($10–50M)';
  if (n < 150) return 'Mid ($50–150M)'; return 'Large ($150M+)';
}
const SIZE_OPTIONS = ['Micro (<$10M)', 'Small ($10–50M)', 'Mid ($50–150M)', 'Large ($150M+)'];

// ─── Multi-select dropdown ────────────────────────────────────────────────────
function MultiFilter({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const count = selected.length;
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const toggle = val => onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: count > 0 ? '#1a1a1a' : 'transparent',
        color: count > 0 ? '#faf6f0' : '#1a1a1a',
        border: '1px solid #1a1a1a', padding: '7px 28px 7px 11px',
        fontSize: 11, fontFamily: '"DM Mono", monospace', cursor: 'pointer',
        minWidth: 110, textAlign: 'left', position: 'relative', whiteSpace: 'nowrap',
        backgroundImage: count > 0 ? 'none' :
          `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%231a1a1a'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
      }}>
        {count > 0 ? `${label} (${count})` : label}
        {count > 0 && (
          <span onClick={e => { e.stopPropagation(); onChange([]); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 15, lineHeight: 1, opacity: 0.65 }}>×</span>
        )}
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#faf6f0',
          border: '1px solid #1a1a1a', zIndex: 200, minWidth: 190, maxHeight: 260, overflowY: 'auto',
          boxShadow: '4px 4px 0 rgba(0,0,0,0.08)' }}>
          {options.map(opt => (
            <div key={opt} onClick={() => toggle(opt)}
              style={{ padding: '9px 14px', fontSize: 11, fontFamily: '"DM Mono", monospace', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                background: selected.includes(opt) ? '#1a1a1a' : 'transparent',
                color: selected.includes(opt) ? '#faf6f0' : '#1a1a1a' }}
              onMouseEnter={e => { if (!selected.includes(opt)) e.currentTarget.style.background = '#f0ebe3'; }}
              onMouseLeave={e => { if (!selected.includes(opt)) e.currentTarget.style.background = 'transparent'; }}>
              <span style={{ width: 12, height: 12, border: `1px solid ${selected.includes(opt) ? '#faf6f0' : '#999'}`,
                flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>
                {selected.includes(opt) ? '✓' : ''}
              </span>
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fund card ────────────────────────────────────────────────────────────────
function FundCard({ fund, onClick }) {
  const [hov, setHov] = useState(false);
  const color = TYPE_COLORS[fund.type] || '#888';
  const bucket = fundSizeBucket(fund.size);
  return (
    <div onClick={() => onClick(fund)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '20px 22px', cursor: 'pointer', background: hov ? '#1a1a1a' : '#faf6f0',
        color: hov ? '#faf6f0' : '#1a1a1a', transition: 'all 0.12s', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
        <span style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: hov ? '#aaa' : color, fontWeight: 500 }}>{fund.type}</span>
        <span style={{ fontSize: 10, opacity: 0.5 }}>{fund.city}, {fund.state}</span>
      </div>
      <div style={{ fontFamily: '"Raleway", sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{fund.name}</div>
      {fund.thesis && (
        <div style={{ fontSize: 12, lineHeight: 1.65, opacity: 0.65, marginBottom: 11,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {fund.thesis}
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, fontSize: 11, opacity: 0.5, flexWrap: 'wrap' }}>
        {fund.stage && <span>▸ {fund.stage}</span>}
        {bucket && <span>{bucket}</span>}
        {fund.vintage && <span>Est. {fund.vintage}</span>}
      </div>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ fund, onClose }) {
  if (!fund) return null;
  const color = TYPE_COLORS[fund.type] || '#888';
  const bucket = fundSizeBucket(fund.size);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.32)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: 430, height: '100vh', background: '#faf6f0',
        borderLeft: '2px solid #1a1a1a', zIndex: 100, display: 'flex', flexDirection: 'column',
        fontFamily: '"DM Mono", monospace', boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color, fontWeight: 500 }}>{fund.type}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, lineHeight: 1, color: '#1a1a1a', padding: 0 }}>×</button>
        </div>
        <div style={{ padding: '26px 28px', overflowY: 'auto', flex: 1 }}>
          <h2 style={{ fontFamily: '"Raleway", sans-serif', fontSize: 24, fontWeight: 700, margin: '0 0 5px', lineHeight: 1.2 }}>{fund.name}</h2>
          <div style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>{fund.city}, {fund.state}</div>
          {fund.thesis && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>THESIS</div>
              <p style={{ fontSize: 13.5, lineHeight: 1.75, margin: 0 }}>{fund.thesis}</p>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px', marginBottom: 22 }}>
            {[
              ['Stage', fund.stage],
              ['Fund Size', fund.size ? `${fund.size}${bucket ? '  ·  ' + bucket : ''}` : ''],
              ['Vintage', fund.vintage ? `Est. ${fund.vintage}` : ''],
              ['GP / Manager', fund.gp],
            ].filter(([, v]) => v).map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 13.5 }}>{val}</div>
              </div>
            ))}
          </div>
          {fund.industries && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 8 }}>SECTORS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {fund.industries.split(',').map(i => i.trim()).filter(Boolean).map(i => (
                  <span key={i} style={{ border: `1px solid ${color}`, color, fontSize: 10, padding: '3px 9px' }}>{i}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
            {fund.website && (
              <a href={fund.website} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                  background: '#1a1a1a', color: '#faf6f0', fontSize: 10, letterSpacing: 2,
                  textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content' }}>↗ WEBSITE</a>
            )}
            {fund.linkedin && (
              <a href={fund.linkedin} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                  border: '1px solid #1a1a1a', color: '#1a1a1a', fontSize: 10, letterSpacing: 2,
                  textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content' }}>in LINKEDIN</a>
            )}
            {fund.email && (
              <a href={`mailto:${fund.email}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                  border: '1px solid #ccc', color: '#555', fontSize: 10, letterSpacing: 2,
                  textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content' }}>✉ {fund.email}</a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Directory tab ────────────────────────────────────────────────────────────
function DirectoryTab({ funds, loading, error, search, setSearch,
  cities, types, stages, sizes, sectors,
  selCities, setSelCities, selTypes, setSelTypes, selStages, setSelStages,
  selSizes, setSelSizes, selSectors, setSelSectors,
  selected, setSelected, onClearAll, hasActiveFilters }) {
  return (
    <div>
      <div style={{ padding: '12px 48px', borderBottom: '1px solid #d4cfc7', display: 'flex',
        gap: 8, alignItems: 'center', flexWrap: 'wrap', background: '#f0ebe3' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search funds, thesis, sectors…"
            style={{ background: 'transparent', border: '1px solid #1a1a1a', padding: '7px 34px 7px 12px',
              fontSize: 11, fontFamily: '"DM Mono", monospace', outline: 'none', minWidth: 240, color: '#1a1a1a' }} />
          {search && (
            <button onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 8, background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 17, lineHeight: 1, color: '#999', padding: 0 }}>×</button>
          )}
        </div>
        <MultiFilter label="City"   options={cities}   selected={selCities}   onChange={setSelCities} />
        <MultiFilter label="Type"   options={types}    selected={selTypes}    onChange={setSelTypes} />
        <MultiFilter label="Stage"  options={stages}   selected={selStages}   onChange={setSelStages} />
        <MultiFilter label="Size"   options={sizes}    selected={selSizes}    onChange={setSelSizes} />
        <MultiFilter label="Sector" options={sectors}  selected={selSectors}  onChange={setSelSectors} />
        {hasActiveFilters && (
          <button onClick={onClearAll} style={{ background: 'none', border: '1px solid #c8302a',
            color: '#c8302a', padding: '7px 14px', fontSize: 10, letterSpacing: 2,
            textTransform: 'uppercase', fontFamily: '"DM Mono", monospace', cursor: 'pointer' }}>
            CLEAR ALL
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.4 }}>
          {!loading && `${funds.length} results`}
        </span>
      </div>
      <div style={{ padding: '28px 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 11, letterSpacing: 2, opacity: 0.35 }}>FETCHING LIVE DATA…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 11, letterSpacing: 2, color: '#c8302a' }}>CONNECTION ERROR</div>
        ) : funds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 11, letterSpacing: 2, opacity: 0.35 }}>NO RESULTS</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            border: '1px solid #1a1a1a', borderBottom: 'none', borderRight: 'none' }}>
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

// ─── Network tab ──────────────────────────────────────────────────────────────
function NetworkTab({ funds, mapPaths, mapError }) {
  const [hovered, setHovered] = useState(null);
  const [selectedFund, setSelectedFund] = useState(null);
  const [mapCity, setMapCity] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All Types');

  const cityClusters = {};
  funds.forEach(f => {
    if (!f.city || !CITY_COORDS[f.city]) return;
    if (typeFilter !== 'All Types' && f.type !== typeFilter) return;
    (cityClusters[f.city] = cityClusters[f.city] || []).push(f);
  });
  const mapFunds = mapCity ? (cityClusters[mapCity] || []) : [];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '16px 20px 12px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <span style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: '#888' }}>CAPITAL NETWORK — UNITED STATES</span>
          <div style={{ marginLeft: 'auto' }}>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
              background: 'transparent', border: '1px solid #1a1a1a', padding: '7px 26px 7px 11px',
              fontSize: 11, fontFamily: '"DM Mono", monospace', cursor: 'pointer',
              appearance: 'none', color: '#1a1a1a',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%231a1a1a'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
            }}>
              {['All Types', ...Object.keys(TYPE_COLORS)].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, border: '1px solid #ddd8d0', overflow: 'hidden', background: '#f5f0e8' }}>
          {mapError ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
              fontSize: 11, letterSpacing: 2, color: '#c8302a', fontFamily: '"DM Mono", monospace' }}>
              MAP LOAD ERROR
            </div>
          ) : (
            <svg viewBox="0 0 960 600" style={{ width: '100%', height: '100%', display: 'block' }}
              preserveAspectRatio="xMidYMid meet">
              {mapPaths.length > 0 ? (
                mapPaths.map(({ id, d }) => (
                  <path key={id} d={d} fill="#e8e1d5" stroke="#c4bdb0" strokeWidth="0.6" strokeLinejoin="round" />
                ))
              ) : (
                <text x="480" y="300" textAnchor="middle" fontSize="12" fill="#bbb"
                  fontFamily='"DM Mono", monospace' letterSpacing="3">LOADING MAP…</text>
              )}
              {Object.entries(cityClusters).map(([city, cityFunds]) => {
                const coords = CITY_COORDS[city];
                if (!coords) return null;
                const [cx, cy] = coords;
                const count = cityFunds.length;
                const r = Math.min(8 + count * 2.4, 24);
                const sel = mapCity === city;
                const hov = hovered === city;
                const topType = Object.entries(
                  cityFunds.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc; }, {})
                ).sort((a, b) => b[1] - a[1])[0]?.[0];
                const dotColor = TYPE_COLORS[topType] || '#888';
                return (
                  <g key={city} transform={`translate(${cx},${cy})`} style={{ cursor: 'pointer' }}
                    onClick={() => setMapCity(sel ? null : city)}
                    onMouseEnter={() => setHovered(city)} onMouseLeave={() => setHovered(null)}>
                    {sel && <circle r={r + 9} fill="none" stroke={dotColor} strokeWidth="1.2" opacity="0.35" />}
                    <circle r={r} fill={dotColor} opacity={sel ? 1 : hov ? 0.9 : 0.75}
                      stroke="#faf6f0" strokeWidth={sel ? 2.5 : 1.5} style={{ transition: 'all 0.15s' }} />
                    <text textAnchor="middle" dy="0.35em" fontSize={count > 9 ? 9 : 11}
                      fontFamily='"DM Mono", monospace' fontWeight="700" fill="#faf6f0" style={{ pointerEvents: 'none' }}>
                      {count}
                    </text>
                    <text textAnchor="middle" dy={r + 14} fontSize="8.5"
                      fontFamily='"DM Mono", monospace' letterSpacing="1"
                      fill="#1a1a1a" opacity={sel || hov ? 0.9 : 0.55} style={{ pointerEvents: 'none' }}>
                      {city.toUpperCase()}
                    </text>
                    {hov && (
                      <g transform={`translate(0,${-r - 22})`} style={{ pointerEvents: 'none' }}>
                        <rect x={-72} y={-10} width={144} height={20} rx="2" fill="#1a1a1a" />
                        <text textAnchor="middle" fontSize="10" fontFamily='"DM Mono", monospace' fill="#faf6f0" dy="4">
                          {city} · {count} fund{count !== 1 ? 's' : ''}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10 }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10,
              opacity: typeFilter === 'All Types' || typeFilter === type ? 0.75 : 0.2 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color, flexShrink: 0 }} />
              {type}
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 320, borderLeft: '2px solid #1a1a1a', display: 'flex', flexDirection: 'column', background: '#f0ebe3', flexShrink: 0 }}>
        {mapCity ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #d4cfc7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: '"Raleway", sans-serif', fontSize: 17, fontWeight: 700 }}>{mapCity}</div>
                <div style={{ fontSize: 10, opacity: 0.4, marginTop: 3 }}>{mapFunds.length} fund{mapFunds.length !== 1 ? 's' : ''}</div>
              </div>
              <button onClick={() => setMapCity(null)} style={{ background: 'none', border: '1px solid #bbb',
                cursor: 'pointer', width: 26, height: 26, fontSize: 14, color: '#1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mapFunds.map(f => {
                const color = TYPE_COLORS[f.type] || '#888';
                return (
                  <div key={f.id} onClick={() => setSelectedFund(f)}
                    style={{ padding: '14px 20px', borderBottom: '1px solid #d4cfc7', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5dfd6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color, marginBottom: 4, fontWeight: 500 }}>{f.type}</div>
                    <div style={{ fontFamily: '"Raleway", sans-serif', fontSize: 14.5, fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.45, display: 'flex', gap: 10 }}>
                      {f.stage && <span>{f.stage}</span>}
                      {f.size && f.size.startsWith('$') && <span>{f.size}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: 40, textAlign: 'center', opacity: 0.35 }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>◎</div>
            <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 2.2 }}>
              SELECT A CITY<br />TO EXPLORE<br />CAPITAL FLOWS
            </div>
          </div>
        )}
      </div>
      {selectedFund && <DetailPanel fund={selectedFund} onClose={() => setSelectedFund(null)} />}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('directory');
  const [search, setSearch] = useState('');
  const [selCities,  setSelCities]  = useState([]);
  const [selTypes,   setSelTypes]   = useState([]);
  const [selStages,  setSelStages]  = useState([]);
  const [selSizes,   setSelSizes]   = useState([]);
  const [selSectors, setSelSectors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mapPaths, setMapPaths] = useState([]);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    (async () => {
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
          industries: Array.isArray(r.fields['Industries'])
            ? r.fields['Industries'].join(', ')
            : (r.fields['Industries'] || ''),
          city: r.fields['City'] || '',
          state: r.fields['State'] || '',
          website: r.fields['Website'] || '',
          type: r.fields['Capital Type'] || '',
          email: r.fields['Email'] || '',
          linkedin: r.fields['LinkedIn'] || '',
        })).filter(f => f.name));
        setLoading(false);
      } catch (e) { console.error('[airtable]', e); setError(true); setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    const urls = [
      'https://unpkg.com/us-atlas@3/states-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
    ];
    const tryNext = async i => {
      if (i >= urls.length) { setMapError(true); return; }
      try {
        const res = await fetch(urls[i]);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const topo = await res.json();
        const paths = decodeTopojson(topo);
        if (!paths.length) throw new Error('empty decode');
        setMapPaths(paths);
        console.log(`[map] ${paths.length} states from ${urls[i]}`);
      } catch (e) { console.warn(`[map] ${urls[i]} failed:`, e.message); tryNext(i + 1); }
    };
    tryNext(0);
  }, []);

  const cities  = [...new Set(funds.map(f => f.city).filter(Boolean))].sort();
  const types   = Object.keys(TYPE_COLORS);
  const stages  = ['Pre-Seed', 'Seed', 'Series A', 'Multi-Stage'];
  const sectors = [...new Set(funds.flatMap(f => f.industries.split(',').map(s => s.trim()).filter(Boolean)))].sort();
  const hasActiveFilters = !!(search || selCities.length || selTypes.length || selStages.length || selSizes.length || selSectors.length);
  const clearAll = () => { setSearch(''); setSelCities([]); setSelTypes([]); setSelStages([]); setSelSizes([]); setSelSectors([]); };

  const filtered = funds.filter(f => {
    const bucket = fundSizeBucket(f.size);
    return (
      (!selCities.length  || selCities.includes(f.city)) &&
      (!selTypes.length   || selTypes.includes(f.type)) &&
      (!selStages.length  || selStages.includes(f.stage)) &&
      (!selSizes.length   || selSizes.includes(bucket)) &&
      (!selSectors.length || selSectors.some(s => f.industries.toLowerCase().includes(s.toLowerCase()))) &&
      (!search || [f.name, f.thesis, f.industries, f.city, f.gp].join(' ').toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div style={{ minHeight: '100vh', background: '#faf6f0', fontFamily: '"DM Mono", monospace', color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Raleway:wght@600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: #faf6f0; }
        ::-webkit-scrollbar-thumb { background: #1a1a1a; }
        input::placeholder { opacity: 0.38; }
        select option { text-transform: none; letter-spacing: 0; }
        a { text-decoration: none; }
      `}</style>
      <header style={{ borderBottom: '2px solid #1a1a1a', background: '#faf6f0', display: 'flex', alignItems: 'stretch', minHeight: 72 }}>
        <div onClick={() => { setTab('directory'); clearAll(); }}
          style={{ padding: '0 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
            borderRight: '1px solid #1a1a1a', minWidth: 260, cursor: 'pointer', userSelect: 'none' }}>
          <div style={{ fontSize: 8, letterSpacing: 5, textTransform: 'uppercase', color: '#c8302a', marginBottom: 5, fontWeight: 500, fontFamily: '"DM Mono", monospace' }}>
            EMERGING CAPITAL ///
          </div>
          <h1 style={{ margin: 0, fontSize: 21, fontFamily: '"Raleway", sans-serif', fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
            US Capital Directory
          </h1>
        </div>
        <div style={{ flex: 1, padding: '0 32px', display: 'flex', alignItems: 'center', gap: 32, borderRight: '1px solid #1a1a1a' }}>
          <div>
            <div style={{ fontSize: 8.5, letterSpacing: 2, color: '#999', marginBottom: 3, fontFamily: '"DM Mono", monospace' }}>STATUS</div>
            <div style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 7, fontFamily: '"DM Mono", monospace' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: loading ? '#f59e0b' : error ? '#c8302a' : '#22c55e',
                boxShadow: !loading && !error ? '0 0 6px #22c55e' : 'none' }} />
              {loading ? 'Fetching…' : error ? 'Error' : 'Live'}
            </div>
          </div>
          {!loading && !error && [['FUNDS', funds.length], ['CITIES', [...new Set(funds.map(f => f.city))].filter(Boolean).length], ['STATES', [...new Set(funds.map(f => f.state))].filter(Boolean).length]].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 8.5, letterSpacing: 2, color: '#999', marginBottom: 3, fontFamily: '"DM Mono", monospace' }}>{label}</div>
              <div style={{ fontSize: 20, fontFamily: '"Raleway", sans-serif', fontWeight: 800, lineHeight: 1 }}>{val}</div>
            </div>
          ))}
        </div>
        <nav style={{ display: 'flex', alignItems: 'stretch' }}>
          {['directory', 'network'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '0 32px', background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? '#faf6f0' : '#1a1a1a', border: 'none', borderLeft: '1px solid #1a1a1a',
              cursor: 'pointer', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
              fontFamily: '"DM Mono", monospace', transition: 'all 0.12s', fontWeight: 500,
            }}>{t}</button>
          ))}
        </nav>
      </header>
      {tab === 'directory' ? (
        <DirectoryTab funds={filtered} loading={loading} error={error}
          search={search} setSearch={setSearch}
          cities={cities} types={types} stages={stages} sizes={SIZE_OPTIONS} sectors={sectors}
          selCities={selCities} setSelCities={setSelCities} selTypes={selTypes} setSelTypes={setSelTypes}
          selStages={selStages} setSelStages={setSelStages} selSizes={selSizes} setSelSizes={setSelSizes}
          selSectors={selSectors} setSelSectors={setSelSectors}
          selected={selected} setSelected={setSelected} onClearAll={clearAll} hasActiveFilters={hasActiveFilters} />
      ) : (
        <NetworkTab funds={funds} mapPaths={mapPaths} mapError={mapError} />
      )}
    </div>
  );
}
