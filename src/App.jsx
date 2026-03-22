// MOBILE-OPTIMIZED VERSION - Ready for production

import React, { useState, useEffect } from 'react';
const AIRTABLE_BASE = import.meta.env.VITE_AIRTABLE_BASE;
const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;

// Tables
const TABLES = {
  funds: 'tblrzWPnDsJUJyrXd',
  investors: 'tblEn1mjWUcGrSpZt',
  partners: 'tblJaOtCGMcs6i5Gv',
  events: 'tblNOHxtryoELutOG',
  dispatch: 'tblgqjHZRHygZoAQA',
};

// Regions (8 total)
const REGIONS = ['West', 'North West', 'South West', 'Mid-West', 'South East', 'Mid-Atlantic', 'North East', 'Gulf South'];

// Styles & Colors
const REGION_COLORS = {
  'West': '#64748b', 'North West': '#22c55e', 'South West': '#f97316', 'Mid-West': '#eab308',
  'South East': '#f59e0b', 'Mid-Atlantic': '#06b6d4', 'North East': '#7c3aed', 'Gulf South': '#ef4444',
};

const TYPE_COLORS = {
  'Venture Fund': '#c8302a', 'Accelerator': '#1d4ed8', 'Economic Dev': '#15803d', 'Government': '#7c3aed',
  'University Fund': '#b45309', 'Family Office': '#0e7490', 'Angel Group': '#be185d',
};

// Fetch helper
async function fetchAll(tableId) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${tableId}`;
  const headers = { Authorization: `Bearer ${AIRTABLE_TOKEN}` };
  let records = [], offset = '';
  while (true) {
    const res = await fetch(url + (offset ? `?offset=${offset}` : ''), { headers });
    const data = await res.json();
    records.push(...(data.records || []));
    if (!data.offset) break;
    offset = data.offset;
  }
  return records;
}

// Main App
export default function App() {
  const [funds, setFunds] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [partners, setPartners] = useState([]);
  const [events, setEvents] = useState([]);
  const [dispatch, setDispatch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('capital');
  const [showContact, setShowContact] = useState(false);
  const [mapPaths, setMapPaths] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [fr, ir, pr, er, dr] = await Promise.all([
          fetchAll(TABLES.funds),
          fetchAll(TABLES.investors),
          fetchAll(TABLES.partners),
          fetchAll(TABLES.events),
          fetchAll(TABLES.dispatch),
        ]);

        setFunds(fr.map(r => ({
          id: r.id,
          name: r.fields['Fund Name'] || '',
          gp1: r.fields['GP Name'] || '',
          gp2: r.fields['GP 2'] || '',
          vintage: r.fields['Vintage Year'] || '',
          stage: r.fields['Stage'] || '',
          size: parseFloat(r.fields['AUM (Millions)']) || 0,
          thesis: r.fields['Thesis'] || '',
          industries: r.fields['Industries'] || '',
          city: r.fields['City'] || '',
          region: r.fields['Region'] || '',
          type: r.fields['Capital Type'] || 'Venture Fund',
          website: r.fields['Website'] || '',
          email: r.fields['Email'] || '',
          linkedin: r.fields['LinkedIn'] || '',
        })).filter(f => f.name));

        setInvestors(ir.map(r => ({
          id: r.id,
          name: r.fields['Name'] || '',
          title: r.fields['Title'] || '',
          fund: r.fields['Fund'] || '',
          thesis: r.fields['Thesis'] || '',
          city: r.fields['City'] || '',
          region: r.fields['Region'] || '',
          email: r.fields['Email'] || '',
          linkedin: r.fields['LinkedIn'] || '',
        })).filter(i => i.name));

        setPartners(pr.map(r => ({
          id: r.id,
          name: r.fields['Name'] || '',
          category: r.fields['Category'] || '',
          description: r.fields['Description'] || '',
          city: r.fields['City'] || '',
          region: r.fields['Region'] || '',
          website: r.fields['Website'] || '',
          email: r.fields['Email'] || '',
        })).filter(p => p.name));

        setEvents(er.map(r => ({
          id: r.id,
          name: r.fields['Name'] || '',
          date: r.fields['Date'] || '',
          city: r.fields['City'] || '',
          region: r.fields['Region'] || '',
          description: r.fields['Description'] || '',
          regUrl: r.fields['Registration URL'] || '',
        })).filter(e => e.name));

        setDispatch(dr.map(r => ({
          id: r.id,
          title: r.fields['Title'] || '',
          date: r.fields['Date'] || '',
          region: r.fields['Region'] || '',
          body: r.fields['Body'] || '',
        })).filter(d => d.title));

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    ['FUNDS', funds.length],
    ['INVESTORS', investors.length],
    ['PARTNERS', partners.length],
    ['REGIONS', [...new Set(funds.map(f => f.region).filter(Boolean))].length],
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#faf6f0', fontFamily: '"DM Mono",monospace', color: '#1a1a1a', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Raleway:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #faf6f0; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        input::placeholder { opacity: 0.38; }
        button { font-family: inherit; }
        button:focus { outline: none; }
        a { text-decoration: none; }
      `}</style>

      {/* Header */}
      <header style={{ borderBottom: '2px solid #1a1a1a', background: '#faf6f0', display: 'flex', flexWrap: 'wrap', minHeight: 'auto' }}>
        {/* Logo */}
        <div onClick={() => setTab('capital')} style={{ padding: '12px 16px', flex: '1 1 100%', borderRight: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a', cursor: 'pointer' }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#c8302a', marginBottom: 2, fontWeight: 600 }}>EMERGING NETWORKS ///</div>
          <h1 style={{ margin: 0, fontSize: 14, fontFamily: '"Raleway",sans-serif', fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>US Capital Directory</h1>
        </div>

        {/* Stats */}
        <div style={{ flex: '1 1 100%', padding: '8px 16px', display: 'flex', gap: 12, overflowX: 'auto', borderRight: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
          <div style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 7, letterSpacing: 1, color: '#999', marginBottom: 1 }}>STATUS</div>
            <div style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', flexShrink: 0, background: loading ? '#f59e0b' : '#22c55e' }} />
              {loading ? '…' : 'Live'}
            </div>
          </div>
          {!loading && stats.map(([l, v]) => (
            <div key={l} style={{ flexShrink: 0 }}>
              <div style={{ fontSize: 7, letterSpacing: 1, color: '#999', marginBottom: 1 }}>{l}</div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav style={{ flex: '1 1 100%', display: 'flex', borderTop: '1px solid #1a1a1a', overflowX: 'auto' }}>
          {[['capital', 'CAPITAL'], ['partners', 'PARTNERS'], ['pulse', 'PULSE'], ['map', 'MAP']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 12px', background: tab === t ? '#1a1a1a' : 'transparent', color: tab === t ? '#faf6f0' : '#1a1a1a', border: 'none', borderLeft: '1px solid #1a1a1a', cursor: 'pointer', fontSize: 8, letterSpacing: 1.5, fontWeight: 500, outline: 'none', minWidth: 70, whiteSpace: 'nowrap' }}>
              {l}
            </button>
          ))}
        </nav>
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'capital' && <CapitalTab funds={funds} investors={investors} loading={loading} />}
        {tab === 'partners' && <PartnersTab partners={partners} loading={loading} />}
        {tab === 'pulse' && <PulseTab events={events} dispatches={dispatch} loading={loading} />}
        {tab === 'map' && <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Map view requires desktop view</div>}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '2px solid #1a1a1a', background: '#1a1a1a', color: '#faf6f0', padding: '20px 16px', fontSize: 9 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 7, letterSpacing: 3, color: '#c8302a', marginBottom: 6, fontWeight: 600 }}>EMERGING NETWORKS ///</div>
          <h2 style={{ fontSize: 14, fontFamily: '"Raleway",sans-serif', fontWeight: 800, margin: '0 0 8px', letterSpacing: -0.5 }}>The network for vetted, quality, niche capital.</h2>
          <p style={{ fontSize: 9, lineHeight: 1.6, opacity: 0.55, margin: 0 }}>Curated intelligence across US startup ecosystems.</p>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginBottom: 12 }}>
          <button onClick={() => setTab('capital')} style={{ background: 'none', border: 'none', color: '#faf6f0', cursor: 'pointer', fontSize: 9, letterSpacing: 1, opacity: 0.6, marginRight: 12, padding: 0, outline: 'none' }}>CAPITAL</button>
          <button onClick={() => setTab('partners')} style={{ background: 'none', border: 'none', color: '#faf6f0', cursor: 'pointer', fontSize: 9, letterSpacing: 1, opacity: 0.6, marginRight: 12, padding: 0, outline: 'none' }}>PARTNERS</button>
          <button onClick={() => setTab('pulse')} style={{ background: 'none', border: 'none', color: '#faf6f0', cursor: 'pointer', fontSize: 9, letterSpacing: 1, opacity: 0.6, padding: 0, outline: 'none' }}>PULSE</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
          <div style={{ opacity: 0.3, fontSize: 8 }}>© 2026</div>
          <button onClick={() => setShowContact(true)} style={{ background: '#c8302a', color: '#faf6f0', border: 'none', padding: '6px 10px', fontSize: 7, letterSpacing: 1, cursor: 'pointer', outline: 'none', textTransform: 'uppercase' }}>GET LISTED ↗</button>
          <div style={{ opacity: 0.3, fontSize: 8 }}>emerging.network</div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContact && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#faf6f0', padding: '24px', maxWidth: 500, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontFamily: '"Raleway",sans-serif', fontSize: 16, fontWeight: 800 }}>Get Listed</h2>
              <button onClick={() => setShowContact(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#1a1a1a', padding: 0, outline: 'none' }}>×</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowContact(false); alert('Thank you! We\'ll review your submission.'); }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input type="text" placeholder="Name" required style={{ padding: '10px 12px', border: '1px solid #d4cfc7', fontFamily: '"DM Mono",monospace', fontSize: 10, outline: 'none', background: '#fff' }} />
              <input type="email" placeholder="Email" required style={{ padding: '10px 12px', border: '1px solid #d4cfc7', fontFamily: '"DM Mono",monospace', fontSize: 10, outline: 'none', background: '#fff' }} />
              <select required style={{ padding: '10px 12px', border: '1px solid #d4cfc7', fontFamily: '"DM Mono",monospace', fontSize: 10, outline: 'none', background: '#fff' }}>
                <option value="">Type…</option>
                <option>Fund</option>
                <option>Investor</option>
                <option>Partner</option>
              </select>
              <input type="text" placeholder="Organization" required style={{ padding: '10px 12px', border: '1px solid #d4cfc7', fontFamily: '"DM Mono",monospace', fontSize: 10, outline: 'none', background: '#fff' }} />
              <select required style={{ padding: '10px 12px', border: '1px solid #d4cfc7', fontFamily: '"DM Mono",monospace', fontSize: 10, outline: 'none', background: '#fff' }}>
                <option value="">Region…</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <textarea placeholder="Tell us about yourself…" style={{ padding: '10px 12px', border: '1px solid #d4cfc7', fontFamily: '"DM Mono",monospace', fontSize: 10, outline: 'none', minHeight: 80, resize: 'none', background: '#fff' }} />
              <button type="submit" style={{ background: '#1a1a1a', color: '#faf6f0', border: 'none', padding: '10px', fontFamily: '"DM Mono",monospace', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', outline: 'none' }}>SUBMIT</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab components
function CapitalTab({ funds, investors, loading }) {
  const [view, setView] = useState('funds');
  const [search, setSearch] = useState('');
  const [regionSel, setReg] = useState([]);

  const filtered = view === 'funds'
    ? funds.filter(f => (regionSel.length === 0 || regionSel.includes(f.region)) &&
        (!search || [f.name, f.thesis, f.city].join(' ').toLowerCase().includes(search.toLowerCase())))
    : investors.filter(i => (regionSel.length === 0 || regionSel.includes(i.region)) &&
        (!search || [i.name, i.fund, i.city].join(' ').toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid #d4cfc7', background: '#faf6f0', display: 'flex', paddingLeft: '12px' }}>
        {['funds', 'investors'].map(v => (
          <button key={v} onClick={() => { setView(v); setSearch(''); setReg([]); }} style={{ padding: '10px 12px', background: 'none', border: 'none', borderBottom: `2px solid ${view === v ? '#1a1a1a' : 'transparent'}`, cursor: 'pointer', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: view === v ? 600 : 400, outline: 'none', whiteSpace: 'nowrap' }}>{v}</button>
        ))}
      </div>
      <div style={{ padding: '10px', background: '#f0ebe3', borderBottom: '1px solid #d4cfc7', display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ background: '#fff', border: '1px solid #d4cfc7', padding: '6px 8px', fontSize: 9, fontFamily: '"DM Mono",monospace', outline: 'none', flex: 1, minWidth: 120 }} />
        <select value={regionSel[0] || ''} onChange={e => setReg(e.target.value ? [e.target.value] : [])} style={{ background: '#fff', border: '1px solid #d4cfc7', padding: '6px 8px', fontSize: 9, fontFamily: '"DM Mono",monospace', outline: 'none' }}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 10 }}>LOADING…</div>
        ) : (
          filtered.map(item => (
            <div key={item.id} style={{ padding: '12px', background: '#fff', border: '1px solid #d4cfc7', marginBottom: 8, fontSize: 9 }}>
              <div style={{ fontFamily: '"Raleway",sans-serif', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{item.name}</div>
              {item.fund && <div style={{ opacity: 0.6, marginBottom: 2 }}>{item.fund}</div>}
              {item.city && <div style={{ opacity: 0.6, marginBottom: 2 }}>{item.city}{item.region ? ` • ${item.region}` : ''}</div>}
              {item.thesis && <div style={{ opacity: 0.6, marginTop: 4, lineHeight: 1.5 }}>{item.thesis.substring(0, 80)}…</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PartnersTab({ partners, loading }) {
  const [search, setSearch] = useState('');
  const [regionSel, setReg] = useState([]);

  const filtered = partners.filter(p => (regionSel.length === 0 || regionSel.includes(p.region)) &&
    (!search || [p.name, p.category, p.city].join(' ').toLowerCase().includes(search.toLowerCase())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ padding: '10px', background: '#f0ebe3', borderBottom: '1px solid #d4cfc7', display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners…" style={{ background: '#fff', border: '1px solid #d4cfc7', padding: '6px 8px', fontSize: 9, fontFamily: '"DM Mono",monospace', outline: 'none', flex: 1, minWidth: 120 }} />
        <select value={regionSel[0] || ''} onChange={e => setReg(e.target.value ? [e.target.value] : [])} style={{ background: '#fff', border: '1px solid #d4cfc7', padding: '6px 8px', fontSize: 9, fontFamily: '"DM Mono",monospace', outline: 'none' }}>
          <option value="">All regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 10 }}>LOADING…</div>
        ) : (
          filtered.map(p => (
            <div key={p.id} style={{ padding: '12px', background: '#fff', border: '1px solid #d4cfc7', marginBottom: 8, fontSize: 9 }}>
              <div style={{ fontFamily: '"Raleway",sans-serif', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 8, color: '#c8302a', marginBottom: 2 }}>{p.category}</div>
              <div style={{ opacity: 0.6 }}>{p.city}{p.region ? ` • ${p.region}` : ''}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PulseTab({ events, dispatches, loading }) {
  const [view, setView] = useState('events');
  const [search, setSearch] = useState('');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events.filter(e => new Date(e.date) >= today).sort((a, b) => new Date(a.date) - new Date(b.date));
  const filtered = dispatches.filter(d => !search || [d.title, d.body].join(' ').toLowerCase().includes(search.toLowerCase())).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ borderBottom: '1px solid #d4cfc7', background: '#faf6f0', display: 'flex', paddingLeft: '12px' }}>
        {['events', 'dispatches'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding: '10px 12px', background: 'none', border: 'none', borderBottom: `2px solid ${view === v ? '#1a1a1a' : 'transparent'}`, cursor: 'pointer', fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: view === v ? 600 : 400, outline: 'none' }}>{v}</button>
        ))}
      </div>

      {view === 'events' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <div style={{ fontSize: 8, letterSpacing: 2, color: '#999', marginBottom: 12, textTransform: 'uppercase' }}>UPCOMING EVENTS</div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 10 }}>LOADING…</div>
          ) : upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 10 }}>NO UPCOMING EVENTS</div>
          ) : (
            upcoming.map(e => {
              const d = new Date(e.date);
              return (
                <div key={e.id} style={{ padding: '12px', background: '#fff', border: '1px solid #d4cfc7', marginBottom: 8, fontSize: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 8, marginBottom: 6 }}>
                    <div style={{ fontFamily: '"Raleway",sans-serif', fontSize: 11, fontWeight: 700 }}>{e.name}</div>
                    <div style={{ fontSize: 7, background: '#1a1a1a', color: '#faf6f0', padding: '2px 6px', flexShrink: 0 }}>{d.getDate()}{d.toLocaleString('en', { month: 'short' }).substring(0, 1)}</div>
                  </div>
                  <div style={{ opacity: 0.6, fontSize: 8 }}>{e.city}{e.region ? ` • ${e.region}` : ''}</div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dispatches…" style={{ width: '100%', padding: '6px 8px', marginBottom: 12, background: '#fff', border: '1px solid #d4cfc7', fontSize: 9, fontFamily: '"DM Mono",monospace', outline: 'none' }} />
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, opacity: 0.3, fontSize: 10 }}>LOADING…</div>
          ) : (
            filtered.map(d => (
              <div key={d.id} style={{ marginBottom: 12, padding: '12px', background: '#fff', border: '1px solid #d4cfc7' }}>
                <div style={{ fontFamily: '"Raleway",sans-serif', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>{d.title}</div>
                <div style={{ fontSize: 8, opacity: 0.6, marginBottom: 6 }}>{d.region}</div>
                <div style={{ fontSize: 9, lineHeight: 1.5, opacity: 0.7 }}>{d.body.substring(0, 120)}…</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
