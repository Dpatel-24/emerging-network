import { useState, useEffect } from 'react';

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

// Albers USA projection (standard parallels 29.5, 45.5)
function albersUSA(lon, lat) {
  const D2R = Math.PI / 180;
  // Continental US
  const φ1 = 29.5 * D2R, φ2 = 45.5 * D2R;
  const φ0 = 37.5 * D2R, λ0 = -96 * D2R;
  const n = (Math.sin(φ1) + Math.sin(φ2)) / 2;
  const c = Math.cos(φ1) * Math.cos(φ1) + 2 * n * Math.sin(φ1);
  const ρ0 = Math.sqrt(c - 2 * n * Math.sin(φ0)) / n;
  const λ = lon * D2R, φ = lat * D2R;
  const ρ = Math.sqrt(c - 2 * n * Math.sin(φ)) / n;
  const θ = n * (λ - λ0);
  const x = ρ * Math.sin(θ);
  const y = ρ0 - ρ * Math.cos(θ);
  // Scale to 860x520 viewport with padding
  const scale = 1070;
  const tx = 430, ty = 310;
  return [x * scale + tx, -y * scale + ty];
}

// Hawaii offset
function albersHawaii(lon, lat) {
  const [x, y] = albersUSA(lon + 58, lat + 5.8);
  return [x, y];
}

// Alaska offset  
function albersAlaska(lon, lat) {
  const D2R = Math.PI / 180;
  const φ1 = 55 * D2R, φ2 = 65 * D2R;
  const φ0 = 50 * D2R, λ0 = -154 * D2R;
  const n = (Math.sin(φ1) + Math.sin(φ2)) / 2;
  const c = Math.cos(φ1) * Math.cos(φ1) + 2 * n * Math.sin(φ1);
  const ρ0 = Math.sqrt(c - 2 * n * Math.sin(φ0)) / n;
  const λ = lon * D2R, φ = lat * D2R;
  const ρ = Math.sqrt(Math.max(0, c - 2 * n * Math.sin(φ))) / n;
  const θ = n * (λ - λ0);
  const x = ρ * Math.sin(θ);
  const y = ρ0 - ρ * Math.cos(θ);
  const scale = 290;
  return [x * scale + 115, -y * scale + 530];
}

function projectCoord(lon, lat) {
  if (lat > 49.5 && lon < -125) return albersAlaska(lon, lat);
  if (lat < 25 && lon < -150) return albersHawaii(lon, lat);
  return albersUSA(lon, lat);
}

function decodeTopojson(topo) {
  try {
    const { arcs, transform: { scale: [sx, sy], translate: [tx, ty] } } = topo;
    const decoded = arcs.map(arc => {
      let x = 0, y = 0;
      return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
    });
    const getArc = i => i < 0 ? [...decoded[~i]].reverse() : decoded[i];
    const ringToPath = ring => {
      const pts = ring.flatMap((i, j) => {
        const pts = j === 0 ? getArc(i) : getArc(i).slice(1);
        return pts.map(([lon, lat]) => projectCoord(lon, lat));
      });
      return 'M' + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join('L') + 'Z';
    };
    return topo.objects.states.geometries.map(g => {
      const polys = g.type === 'Polygon' ? [g.arcs] : g.arcs;
      return { id: g.id, d: polys.map(poly => poly.map(ringToPath).join('')).join('') };
    });
  } catch (e) { console.error(e); return []; }
}

// City lat/lon for projection
const CITY_LATLON = {
  'New Orleans':    [-90.07, 29.95],
  'Baton Rouge':    [-91.14, 30.45],
  'Tampa':          [-82.46, 27.95],
  'Miami':          [-80.19, 25.77],
  'Nashville':      [-86.78, 36.17],
  'Austin':         [-97.74, 30.27],
  'Salt Lake City': [-111.89, 40.76],
};

function Sel({ value, onChange, options }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      background: 'transparent', border: '1px solid #1a1a1a', padding: '6px 26px 6px 10px',
      fontSize: 10, letterSpacing: 1.5, fontFamily: '"DM Mono", monospace', cursor: 'pointer',
      appearance: 'none', color: '#1a1a1a', minWidth: 130,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5 4.5-5z' fill='%231a1a1a'/%3E%3C/svg%3E")`,
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
      style={{ padding: '18px 20px', cursor: 'pointer', background: hov ? '#1a1a1a' : '#faf6f0',
        color: hov ? '#faf6f0' : '#1a1a1a', transition: 'all 0.12s', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 8.5, letterSpacing: 2.5, textTransform: 'uppercase', color: hov ? '#aaa' : color }}>{fund.type}</span>
        <span style={{ fontSize: 8.5, letterSpacing: 1, opacity: 0.45 }}>{fund.city}, {fund.state}</span>
      </div>
      <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 15, fontWeight: 700, marginBottom: 7, lineHeight: 1.3 }}>
        {fund.name}
      </div>
      {fund.thesis && (
        <div style={{ fontSize: 11, lineHeight: 1.6, opacity: 0.6, marginBottom: 10,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {fund.thesis}
        </div>
      )}
      <div style={{ display: 'flex', gap: 14, fontSize: 9.5, letterSpacing: 1, opacity: 0.5 }}>
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99, background: 'rgba(0,0,0,0.32)' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, width: 420, height: '100vh',
        background: '#faf6f0', borderLeft: '2px solid #1a1a1a', zIndex: 100,
        display: 'flex', flexDirection: 'column', fontFamily: '"DM Mono", monospace',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '16px 26px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 8.5, letterSpacing: 3, textTransform: 'uppercase', color }}>{fund.type}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, lineHeight: 1, color: '#1a1a1a', padding: 0 }}>×</button>
        </div>
        <div style={{ padding: 26, overflowY: 'auto', flex: 1 }}>
          <h2 style={{ fontFamily: '"Playfair Display", serif', fontSize: 22, fontWeight: 700, margin: '0 0 5px', lineHeight: 1.2 }}>{fund.name}</h2>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 22, letterSpacing: 1 }}>{fund.city}, {fund.state}</div>

          {fund.thesis && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 7 }}>THESIS</div>
              <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0 }}>{fund.thesis}</p>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 18px', marginBottom: 22 }}>
            {[['Stage', fund.stage], ['Fund Size', fund.size], ['Vintage', fund.vintage ? `Est. ${fund.vintage}` : ''], ['GP', fund.gp]]
              .filter(([, v]) => v).map(([label, val]) => (
                <div key={label}>
                  <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 13 }}>{val}</div>
                </div>
              ))}
          </div>

          {fund.industries && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: 'uppercase', color: '#999', marginBottom: 7 }}>SECTORS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {fund.industries.split(',').map(i => (
                  <span key={i} style={{ border: `1px solid ${color}`, color, fontSize: 9, padding: '3px 8px', letterSpacing: 1 }}>{i.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {fund.website && (
              <a href={fund.website} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                  background: '#1a1a1a', color: '#faf6f0', fontSize: 9, letterSpacing: 2.5,
                  textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content' }}>
                ↗ WEBSITE
              </a>
            )}
            {fund.linkedin && (
              <a href={fund.linkedin} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                  border: '1px solid #1a1a1a', color: '#1a1a1a', fontSize: 9, letterSpacing: 2.5,
                  textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content' }}>
                in LINKEDIN
              </a>
            )}
            {fund.email && (
              <a href={`mailto:${fund.email}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                  border: '1px solid #ccc', color: '#555', fontSize: 9, letterSpacing: 2.5,
                  textTransform: 'uppercase', textDecoration: 'none', width: 'fit-content' }}>
                ✉ {fund.email}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function DirectoryTab({ funds, loading, error, search, setSearch, cityFilter, setCityFilter,
  typeFilter, setTypeFilter, stageFilter, setStageFilter, sectorFilter, setSectorFilter,
  cities, types, stages, sectors, selected, setSelected }) {
  return (
    <div>
      <div style={{ padding: '12px 48px', borderBottom: '1px solid #d4cfc7', display: 'flex', gap: 8,
        alignItems: 'center', flexWrap: 'wrap', background: '#f0ebe3' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="SEARCH FUNDS, THESIS, SECTORS…"
          style={{ background: 'transparent', border: '1px solid #1a1a1a', padding: '6px 12px',
            fontSize: 10, letterSpacing: 1.5, fontFamily: '"DM Mono", monospace', outline: 'none',
            minWidth: 240, color: '#1a1a1a' }} />
        <Sel value={cityFilter} onChange={setCityFilter} options={cities} />
        <Sel value={typeFilter} onChange={setTypeFilter} options={types} />
        <Sel value={stageFilter} onChange={setStageFilter} options={stages} />
        <Sel value={sectorFilter} onChange={setSectorFilter} options={sectors} />
        <span style={{ marginLeft: 'auto', fontSize: 9, letterSpacing: 2, opacity: 0.4 }}>
          {!loading && `${funds.length} RESULTS`}
        </span>
      </div>
      <div style={{ padding: '28px 48px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 10, letterSpacing: 3, opacity: 0.35 }}>FETCHING LIVE DATA…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 10, letterSpacing: 3, color: '#c8302a' }}>CONNECTION ERROR</div>
        ) : funds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 80, fontSize: 10, letterSpacing: 3, opacity: 0.35 }}>NO RESULTS</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
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

function NetworkTab({ funds, mapPaths }) {
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedFund, setSelectedFund] = useState(null);
  const [mapCity, setMapCity] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All Types');

  const cityClusters = {};
  funds.forEach(f => {
    if (!f.city || !CITY_LATLON[f.city]) return;
    if (typeFilter !== 'All Types' && f.type !== typeFilter) return;
    (cityClusters[f.city] = cityClusters[f.city] || []).push(f);
  });

  const mapFunds = mapCity ? (cityClusters[mapCity] || []) : [];

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 110px)', overflow: 'hidden' }}>
      <div style={{ flex: 1, padding: '20px 24px 14px', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Network filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span style={{ fontSize: 8, letterSpacing: 4, textTransform: 'uppercase', color: '#888' }}>CAPITAL NETWORK</span>
          <div style={{ marginLeft: 'auto' }}>
            <Sel value={typeFilter} onChange={setTypeFilter} options={['All Types', ...Object.keys(TYPE_COLORS)]} />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, position: 'relative', border: '1px solid #e0dbd2' }}>
          <svg viewBox="0 0 860 520" style={{ width: '100%', height: '100%', display: 'block', background: '#f7f2ea' }}
            preserveAspectRatio="xMidYMid meet">

            {mapPaths.length > 0
              ? mapPaths.map(({ id, d }) => (
                  <path key={id} d={d} fill="#ece6dc" stroke="#c8c0b2" strokeWidth="0.5" strokeLinejoin="round" />
                ))
              : <rect x="10" y="10" width="840" height="500" fill="#ece6dc" stroke="#c8c0b2" strokeWidth="1" rx="4" />
            }

            {Object.entries(cityClusters).map(([city, cityFunds]) => {
              const ll = CITY_LATLON[city];
              if (!ll) return null;
              const [cx, cy] = projectCoord(ll[0], ll[1]);
              const count = cityFunds.length;
              const r = Math.min(8 + count * 2.6, 24);
              const sel = mapCity === city;
              const hov = hovered === city;
              const topType = Object.entries(
                cityFunds.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc; }, {})
              ).sort((a, b) => b[1] - a[1])[0]?.[0];
              const dotColor = TYPE_COLORS[topType] || '#888';
              return (
                <g key={city} transform={`translate(${cx.toFixed(1)},${cy.toFixed(1)})`} style={{ cursor: 'pointer' }}
                  onClick={() => setMapCity(sel ? null : city)}
                  onMouseEnter={e => { setHovered(city); const r = e.currentTarget.closest('svg').getBoundingClientRect(); setTooltipPos({ x: cx, y: cy }); }}
                  onMouseLeave={() => setHovered(null)}>
                  {sel && <circle r={r + 9} fill="none" stroke={dotColor} strokeWidth="1" opacity="0.3" />}
                  <circle r={r} fill={dotColor} opacity={sel ? 1 : hov ? 0.88 : 0.72}
                    stroke="#faf6f0" strokeWidth={sel ? 2.5 : 1.5} style={{ transition: 'all 0.15s' }} />
                  <text textAnchor="middle" dy="0.35em" fontSize={count > 9 ? 9 : 10.5}
                    fontFamily='"DM Mono", monospace' fontWeight="700" fill="#faf6f0" style={{ pointerEvents: 'none' }}>
                    {count}
                  </text>
                  <text textAnchor="middle" dy={r + 13} fontSize="7.5" fontFamily='"DM Mono", monospace'
                    letterSpacing="1.5" fill="#1a1a1a" opacity={sel || hov ? 0.9 : 0.5} style={{ pointerEvents: 'none' }}>
                    {city.toUpperCase()}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {hovered && CITY_LATLON[hovered] && (() => {
              const [cx, cy] = projectCoord(CITY_LATLON[hovered][0], CITY_LATLON[hovered][1]);
              const label = `${hovered} · ${(cityClusters[hovered] || []).length} fund${(cityClusters[hovered] || []).length !== 1 ? 's' : ''}`;
              const w = label.length * 6.2 + 14;
              return (
                <g transform={`translate(${(cx - w / 2).toFixed(1)},${(cy - (Math.min(8 + (cityClusters[hovered] || []).length * 2.6, 24)) - 22).toFixed(1)})`} style={{ pointerEvents: 'none' }}>
                  <rect width={w} height={18} fill="#1a1a1a" rx="2" />
                  <text x={w / 2} textAnchor="middle" fontSize="9.5" fontFamily='"DM Mono", monospace' fill="#faf6f0" dy="12" letterSpacing="0.5">{label}</text>
                </g>
              );
            })()}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 8.5,
              letterSpacing: 1.5, textTransform: 'uppercase', opacity: typeFilter === 'All Types' || typeFilter === type ? 0.7 : 0.25 }}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: color }} />{type}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{ width: 330, borderLeft: '2px solid #1a1a1a', display: 'flex', flexDirection: 'column', background: '#f0ebe3', flexShrink: 0 }}>
        {mapCity ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #d4cfc7', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 16, fontWeight: 700 }}>{mapCity}</div>
                <div style={{ fontSize: 8, letterSpacing: 2.5, opacity: 0.4, marginTop: 3 }}>
                  {mapFunds.length} FUND{mapFunds.length !== 1 ? 'S' : ''}
                </div>
              </div>
              <button onClick={() => setMapCity(null)} style={{ background: 'none', border: '1px solid #bbb', cursor: 'pointer',
                width: 24, height: 24, fontSize: 12, fontFamily: '"DM Mono", monospace', color: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {mapFunds.map(f => {
                const color = TYPE_COLORS[f.type] || '#888';
                return (
                  <div key={f.id} onClick={() => setSelectedFund(f)}
                    style={{ padding: '13px 20px', borderBottom: '1px solid #d4cfc7', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#e5dfd6'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ fontSize: 8, letterSpacing: 2.5, textTransform: 'uppercase', color, marginBottom: 4 }}>{f.type}</div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                    <div style={{ fontSize: 9.5, opacity: 0.45, display: 'flex', gap: 10 }}>
                      {f.stage && <span>{f.stage}</span>}
                      {f.size && f.size.startsWith('$') && <span>{f.size}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', opacity: 0.35 }}>
            <div style={{ fontSize: 34, marginBottom: 14, fontFamily: 'serif' }}>◎</div>
            <div style={{ fontSize: 9, letterSpacing: 3.5, textTransform: 'uppercase', lineHeight: 2.2 }}>
              SELECT A CITY<br />TO EXPLORE<br />CAPITAL FLOWS
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
  const [sectorFilter, setSectorFilter] = useState('All Sectors');
  const [selected, setSelected] = useState(null);
  const [mapPaths, setMapPaths] = useState([]);

  useEffect(() => {
    const load = async () => {
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
          email: r.fields['Email'] || '',
          linkedin: r.fields['LinkedIn'] || '',
        })).filter(f => f.name));
        setLoading(false);
      } catch { setError(true); setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r => r.json()).then(t => setMapPaths(decodeTopojson(t))).catch(() => {});
  }, []);

  const cities = ['All Cities', ...[...new Set(funds.map(f => f.city).filter(Boolean))].sort()];
  const types = ['All Types', ...Object.keys(TYPE_COLORS)];
  const stages = ['All Stages', 'Pre-Seed', 'Seed', 'Series A', 'Multi-Stage'];
  const sectors = ['All Sectors', ...[...new Set(
    funds.flatMap(f => f.industries.split(',').map(s => s.trim())).filter(Boolean)
  )].sort()];

  const filtered = funds.filter(f =>
    (cityFilter === 'All Cities' || f.city === cityFilter) &&
    (typeFilter === 'All Types' || f.type === typeFilter) &&
    (stageFilter === 'All Stages' || f.stage === stageFilter) &&
    (sectorFilter === 'All Sectors' || f.industries.toLowerCase().includes(sectorFilter.toLowerCase())) &&
    (!search || [f.name, f.thesis, f.industries, f.city].join(' ').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: '#faf6f0', fontFamily: '"DM Mono", monospace', color: '#1a1a1a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Playfair+Display:wght@600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-track { background: #faf6f0; } ::-webkit-scrollbar-thumb { background: #1a1a1a; }
        input::placeholder { opacity: 0.38; letter-spacing: 1.5px; }
        select option { text-transform: none; letter-spacing: 0; }
      `}</style>

      <header style={{ borderBottom: '2px solid #1a1a1a', padding: '16px 48px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div>
          <div style={{ fontSize: 7.5, letterSpacing: 5, textTransform: 'uppercase', color: '#c8302a', marginBottom: 4 }}>
            EMERGING CAPITAL NETWORK ///
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontFamily: '"Playfair Display", serif', fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>
            US Capital Directory
          </h1>
        </div>
        <nav style={{ marginLeft: 'auto', display: 'flex', borderLeft: '1px solid #1a1a1a' }}>
          {['directory', 'network'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '8px 26px', background: tab === t ? '#1a1a1a' : 'transparent',
              color: tab === t ? '#faf6f0' : '#1a1a1a', border: 'none', borderRight: '1px solid #1a1a1a',
              cursor: 'pointer', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase',
              fontFamily: '"DM Mono", monospace', transition: 'all 0.12s',
            }}>{t}</button>
          ))}
        </nav>
      </header>

      <div style={{ padding: '5px 48px', background: '#1a1a1a', color: '#555', fontSize: 8.5, letterSpacing: 2, display: 'flex', gap: 24 }}>
        <span style={{ color: loading ? '#666' : error ? '#c8302a' : '#4ade80' }}>
          {loading ? '● FETCHING…' : error ? '● CONNECTION ERROR' : `● ${funds.length} FUNDS INDEXED`}
        </span>
        {!loading && !error && (
          <span>{[...new Set(funds.map(f => f.city))].filter(Boolean).length} CITIES · {[...new Set(funds.map(f => f.state))].filter(Boolean).length} STATES</span>
        )}
      </div>

      {tab === 'directory'
        ? <DirectoryTab funds={filtered} loading={loading} error={error}
            search={search} setSearch={setSearch}
            cityFilter={cityFilter} setCityFilter={setCityFilter}
            typeFilter={typeFilter} setTypeFilter={setTypeFilter}
            stageFilter={stageFilter} setStageFilter={setStageFilter}
            sectorFilter={sectorFilter} setSectorFilter={setSectorFilter}
            cities={cities} types={types} stages={stages} sectors={sectors}
            selected={selected} setSelected={setSelected} />
        : <NetworkTab funds={funds} mapPaths={mapPaths} />
      }
    </div>
  );
}
