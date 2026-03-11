import { useState, useMemo } from "react";

const funds = [
  {
    id: 1, initials: "EY", name: "Elizabeth Yin", fund: "Hustle Fund", size: "$50M", vintage: 2022,
    stage: "Pre-Seed", focus: ["B2B SaaS", "Consumer"], geo: "Global", checkSize: "$25K–$150K",
    status: "Deploying", lpStatus: "Closed",
    thesis: "Bet on speed and hustle. Back founders who can get to revenue in 90 days. Capital efficient businesses only.",
    portfolio: ["Openly", "Lunchclub", "Kivo", "Synder"],
    coInvest: true, leadDeals: false,
    connections: [2, 4, 7, 9],
    twitter: "@elizabethyin", web: "hustlefund.vc",
    notes: "Will syndicate. Very founder-friendly terms. Loves repeat founders."
  },
  {
    id: 2, initials: "KK", name: "Kevin Kwok", fund: "Asymmetric Capital", size: "$120M", vintage: 2021,
    stage: "Seed", focus: ["Enterprise", "AI Infra", "Dev Tools"], geo: "US",checkSize: "$500K–$2M",
    status: "Active", lpStatus: "Closed",
    thesis: "Invest in compounding loops — businesses where usage creates structural advantages that compounds over time.",
    portfolio: ["Linear", "Retool", "Causal", "Hex"],
    coInvest: true, leadDeals: true,
    connections: [1, 3, 5],
    twitter: "@kevinkwok", web: "asymmetric.vc",
    notes: "Ex-Greylock. Writes the best memos in the business. Will co-lead with right partner."
  },
  {
    id: 3, initials: "KS", name: "Katie Stanton", fund: "Moxxie Ventures", size: "$55M", vintage: 2020,
    stage: "Seed", focus: ["Consumer Media", "Creator Economy", "Health"], geo: "San Francisco", checkSize: "$250K–$1M",
    status: "Active", lpStatus: "Raising",
    thesis: "Back category-defining founders at the intersection of culture and technology. Operator-first perspective.",
    portfolio: ["Substack", "Cameo", "Mighty Networks"],
    coInvest: true, leadDeals: false,
    connections: [1, 6, 8],
    twitter: "@KatieS", web: "moxxie.vc",
    notes: "Fund III currently in market. Warm LP intros welcome. Former Twitter VP."
  },
  {
    id: 4, initials: "CH", name: "Charles Hudson", fund: "Precursor Ventures", size: "$85M", vintage: 2023,
    stage: "Pre-Seed", focus: ["Underrepresented Founders", "B2B", "Consumer"], geo: "US", checkSize: "$100K–$500K",
    status: "Active", lpStatus: "Closed",
    thesis: "First institutional check for founders the traditional VC system overlooks. Pattern-breaking, not pattern-matching.",
    portfolio: ["Blavity", "Walker & Co", "Sote"],
    coInvest: false, leadDeals: true,
    connections: [1, 7, 10],
    twitter: "@chudson", web: "precursorvc.com",
    notes: "Fund V. Does not co-invest — prefers to lead. Strong community network."
  },
  {
    id: 5, initials: "JP", name: "Pejman Nozad", fund: "Pear VC", size: "$175M", vintage: 2022,
    stage: "Pre-Seed/Seed", focus: ["Deep Tech", "SaaS", "Marketplaces"], geo: "Silicon Valley", checkSize: "$500K–$3M",
    status: "Deploying", lpStatus: "Closed",
    thesis: "Invest at the earliest moment of formation. Co-found with technical outliers before the market sees them.",
    portfolio: ["DoorDash", "Guardant Health", "Branch", "Gusto"],
    coInvest: true, leadDeals: true,
    connections: [2, 6, 9],
    twitter: "@pejmannozad", web: "pear.vc",
    notes: "Known for deep founder relationships. Hands-on at formation stage."
  },
  {
    id: 6, initials: "JF", name: "Jenny Fielding", fund: "Everywhere Ventures", size: "$30M", vintage: 2022,
    stage: "Pre-Seed", focus: ["Climate", "Future of Work", "Health"], geo: "Global", checkSize: "$50K–$200K",
    status: "Active", lpStatus: "Raising",
    thesis: "Geography is not destiny. Back exceptional founders building real businesses wherever they are.",
    portfolio: ["Nate", "Benepass", "Archera"],
    coInvest: true, leadDeals: false,
    connections: [3, 7, 8],
    twitter: "@jefielding", web: "everywhere.vc",
    notes: "Fund II in market. Community of 500+ operator LPs. Great for intros into NYC/London ecosystem."
  },
  {
    id: 7, initials: "AL", name: "Alex Lines", fund: "Notation Capital", size: "$60M", vintage: 2021,
    stage: "Pre-Seed", focus: ["NYC Ecosystem", "B2B", "Infrastructure"], geo: "New York", checkSize: "$100K–$500K",
    status: "Active", lpStatus: "Closed",
    thesis: "NYC pre-seed specialists. We are the first call for technical founders building in New York.",
    portfolio: ["Blockdaemon", "Nylas", "Tempo"],
    coInvest: true, leadDeals: true,
    connections: [1, 4, 6, 10],
    twitter: "@alexlines", web: "notation.vc",
    notes: "Very NYC focused. Great co-invest partner for anyone doing NY deals."
  },
  {
    id: 8, initials: "EP", name: "Eric Paley", fund: "Compound VC", size: "$90M", vintage: 2023,
    stage: "Seed", focus: ["Hard Tech", "B2B SaaS", "Vertical AI"], geo: "US", checkSize: "$500K–$2M",
    status: "Deploying", lpStatus: "Closed",
    thesis: "Capital efficiency is a feature. Back founders who treat every dollar as precious and build to profitability.",
    portfolio: ["Recorded Future", "EverTrue", "Logically"],
    coInvest: false, leadDeals: true,
    connections: [2, 5, 9],
    twitter: "@ericpaley", web: "compound.vc",
    notes: "Strong opinions on unit economics. Will pass on strong teams with weak metrics."
  },
  {
    id: 9, initials: "BL", name: "Bill Liao", fund: "Cantos VC", size: "$100M", vintage: 2021,
    stage: "Seed/Series A", focus: ["Climate", "Biotech", "Deep Science"], geo: "Europe", checkSize: "$500K–$3M",
    status: "Active", lpStatus: "Closed",
    thesis: "Science-first investing. Only back companies with genuine IP moats and teams who have published.",
    portfolio: ["SolarisKit", "Biome Makers", "Invert Robotics"],
    coInvest: true, leadDeals: true,
    connections: [3, 6, 10],
    twitter: "@billliao", web: "cantos.vc",
    notes: "Best climate/deep science network in Europe. Frequent co-invest with Pale Blue Dot."
  },
  {
    id: 10, initials: "JS", name: "Jason Strauss", fund: "Bison Ventures", size: "$45M", vintage: 2022,
    stage: "Pre-Seed", focus: ["Midwest", "B2B SaaS", "Fintech"], geo: "Chicago", checkSize: "$100K–$400K",
    status: "Active", lpStatus: "Raising",
    thesis: "The Midwest is underserved and underpriced. Back capital-efficient B2B founders with real distribution.",
    portfolio: ["Telnyx", "G2", "Campminder"],
    coInvest: true, leadDeals: false,
    connections: [4, 7, 9],
    twitter: "@bisonventures", web: "bisonventures.com",
    notes: "Fund III in market. Best Chicago dealflow of anyone. Good intro network into midwest corporates."
  },
];

const VIEWS = ["DIRECTORY", "NETWORK", "RAISING"];
const statusColor = { Active: "#16a34a", Deploying: "#d97706", Closed: "#6b7280", Raising: "#dc2626" };
const lpColors = { Closed: "#6b7280", Raising: "#dc2626" };

function Avatar({ initials, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: "#1a1a1a",
      color: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Mono', monospace", fontSize: size * 0.32, fontWeight: 500,
      flexShrink: 0, border: "1px solid #333", letterSpacing: "0.05em"
    }}>{initials}</div>
  );
}

function ConnectionLine({ x1, y1, x2, y2, active }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2}
    stroke={active ? "#c8302a" : "#2a2a2a"} strokeWidth={active ? 1.5 : 0.8}
    opacity={active ? 0.9 : 0.4} strokeDasharray={active ? "none" : "4,3"} />;
}

export default function EmergingManagerNetwork() {
  const [view, setView] = useState("DIRECTORY");
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [filterStage, setFilterStage] = useState("All");
  const [filterCoInvest, setFilterCoInvest] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => funds.filter(f => {
    const q = search.toLowerCase();
    const matchQ = !q || f.name.toLowerCase().includes(q) || f.fund.toLowerCase().includes(q) || f.focus.some(x => x.toLowerCase().includes(q)) || f.geo.toLowerCase().includes(q);
    const matchStage = filterStage === "All" || f.stage.includes(filterStage);
    const matchCo = !filterCoInvest || f.coInvest;
    return matchQ && matchStage && matchCo;
  }), [search, filterStage, filterCoInvest]);

  const raising = funds.filter(f => f.lpStatus === "Raising");

  // Network node positions (circle layout)
  const nodePositions = funds.map((f, i) => {
    const angle = (i / funds.length) * 2 * Math.PI - Math.PI / 2;
    const r = 150;
    return { x: 200 + r * Math.cos(angle), y: 210 + r * Math.sin(angle) };
  });

  const activeId = hovered || selected?.id;

  return (
    <div style={{ fontFamily: "'DM Mono', 'Courier New', monospace", background: "#f5f0e8", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@400;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .header { background: #1a1a1a; padding: 18px 32px; display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #c8302a; }
        .logo { font-family: 'Playfair Display', serif; font-size: 1.3rem; font-weight: 900; color: #f5f0e8; letter-spacing: -0.01em; }
        .logo span { color: #c8302a; }
        .header-meta { font-size: 0.6rem; color: #666; letter-spacing: 0.15em; text-align: right; line-height: 1.8; }
        .header-meta b { color: #c8302a; }
        
        .nav { background: #f5f0e8; border-bottom: 1px solid #d4cfc5; padding: 0 32px; display: flex; gap: 0; align-items: center; }
        .nav-btn { background: none; border: none; font-family: 'DM Mono', monospace; font-size: 0.65rem; letter-spacing: 0.15em; padding: 14px 20px; cursor: pointer; color: #999; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .nav-btn:hover { color: #1a1a1a; }
        .nav-btn.active { color: #c8302a; border-bottom-color: #c8302a; }
        .nav-divider { height: 14px; width: 1px; background: #d4cfc5; margin: 0 8px; }
        .nav-badge { background: #c8302a; color: white; font-size: 0.5rem; padding: 1px 5px; margin-left: 6px; border-radius: 2px; }
        .nav-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
        .request-btn { background: #1a1a1a; color: #f5f0e8; border: none; font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.12em; padding: 8px 16px; cursor: pointer; }
        .request-btn:hover { background: #c8302a; }
        
        .controls { padding: 14px 32px; background: #ede8de; border-bottom: 1px solid #d4cfc5; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        input.search { background: #f5f0e8; border: 1px solid #c8c2b6; padding: 7px 12px; font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #1a1a1a; outline: none; min-width: 220px; }
        input.search::placeholder { color: #a0998e; }
        input.search:focus { border-color: #c8302a; }
        select.filter { background: #f5f0e8; border: 1px solid #c8c2b6; padding: 7px 10px; font-family: 'DM Mono', monospace; font-size: 0.66rem; color: #1a1a1a; outline: none; cursor: pointer; }
        select.filter:focus { border-color: #c8302a; }
        .toggle-btn { background: none; border: 1px solid #c8c2b6; padding: 7px 12px; font-family: 'DM Mono', monospace; font-size: 0.62rem; letter-spacing: 0.1em; cursor: pointer; color: #777; transition: all 0.15s; white-space: nowrap; }
        .toggle-btn.on { background: #c8302a; border-color: #c8302a; color: white; }
        .count { margin-left: auto; font-size: 0.62rem; color: #999; letter-spacing: 0.1em; }
        .count b { color: #1a1a1a; }
        
        /* DIRECTORY */
        .dir-grid { padding: 24px 32px; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1px; background: #d4cfc5; }
        .fund-card { background: #f5f0e8; padding: 20px; cursor: pointer; transition: background 0.1s; position: relative; }
        .fund-card:hover { background: #ede8de; }
        .fund-card.active { background: #1a1a1a; color: #f5f0e8; }
        .card-row1 { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .card-name { font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; line-height: 1.2; }
        .card-fund { font-size: 0.62rem; color: #888; letter-spacing: 0.08em; margin-top: 2px; }
        .fund-card.active .card-fund { color: #aaa; }
        .card-size { font-size: 0.75rem; font-weight: 500; color: #c8302a; margin-left: auto; white-space: nowrap; }
        .fund-card.active .card-size { color: #ff6b5b; }
        .tags { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 10px; }
        .tag { font-size: 0.56rem; letter-spacing: 0.1em; padding: 2px 7px; border: 1px solid #c8c2b6; color: #777; text-transform: uppercase; }
        .fund-card.active .tag { border-color: #444; color: #bbb; }
        .card-thesis { font-size: 0.65rem; line-height: 1.6; color: #555; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .fund-card.active .card-thesis { color: #bbb; }
        .card-footer { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid #d4cfc5; }
        .fund-card.active .card-footer { border-top-color: #333; }
        .status-pill { font-size: 0.56rem; letter-spacing: 0.1em; padding: 2px 8px; border: 1px solid; text-transform: uppercase; }
        .co-tag { font-size: 0.56rem; letter-spacing: 0.08em; color: #16a34a; border: 1px solid #16a34a; padding: 2px 7px; }
        .lead-tag { font-size: 0.56rem; letter-spacing: 0.08em; color: #7c3aed; border: 1px solid #7c3aed; padding: 2px 7px; }
        .check-size { margin-left: auto; font-size: 0.58rem; color: #999; }
        .fund-card.active .check-size { color: #888; }
        
        /* DETAIL PANEL */
        .detail-panel { position: fixed; right: 0; top: 0; bottom: 0; width: 380px; background: #1a1a1a; color: #f5f0e8; z-index: 50; overflow-y: auto; border-left: 2px solid #c8302a; padding: 28px; }
        .detail-close { background: none; border: 1px solid #333; color: #888; padding: 6px 12px; font-family: 'DM Mono', monospace; font-size: 0.6rem; cursor: pointer; letter-spacing: 0.1em; margin-bottom: 24px; }
        .detail-close:hover { border-color: #c8302a; color: #c8302a; }
        .detail-name { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 900; line-height: 1.1; margin-bottom: 4px; }
        .detail-fund { font-size: 0.65rem; color: #c8302a; letter-spacing: 0.12em; margin-bottom: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #222; font-size: 0.65rem; }
        .detail-label { color: #555; text-transform: uppercase; letter-spacing: 0.1em; font-size: 0.58rem; }
        .detail-val { color: #f5f0e8; text-align: right; }
        .detail-section { margin-top: 20px; margin-bottom: 8px; font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: #555; }
        .thesis-block { background: #111; padding: 14px; font-size: 0.67rem; line-height: 1.7; color: #ccc; border-left: 2px solid #c8302a; margin-bottom: 16px; font-style: italic; }
        .portfolio-tags { display: flex; flex-wrap: wrap; gap: 5px; }
        .ptag { font-size: 0.6rem; background: #222; padding: 4px 10px; color: #aaa; border: 1px solid #333; }
        .notes-block { font-size: 0.64rem; line-height: 1.7; color: #888; margin-top: 8px; }
        .connection-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .conn-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: #111; cursor: pointer; }
        .conn-item:hover { background: #222; }
        .conn-name { font-size: 0.66rem; color: #ddd; }
        .conn-fund { font-size: 0.58rem; color: #666; }
        
        /* NETWORK VIEW */
        .network-wrap { padding: 24px 32px; display: grid; grid-template-columns: 400px 1fr; gap: 24px; }
        .network-svg { background: #1a1a1a; border: 1px solid #2a2a2a; }
        .network-legend { padding: 20px; background: #ede8de; border: 1px solid #d4cfc5; }
        .legend-title { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin-bottom: 12px; }
        .legend-item { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.64rem; color: #555; }
        
        /* RAISING VIEW */
        .raising-wrap { padding: 24px 32px; }
        .raising-header { font-family: 'Playfair Display', serif; font-size: 1.5rem; font-weight: 700; margin-bottom: 6px; }
        .raising-sub { font-size: 0.65rem; color: #888; letter-spacing: 0.08em; margin-bottom: 24px; }
        .raising-card { background: white; border: 1px solid #d4cfc5; padding: 22px; margin-bottom: 1px; display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: start; cursor: pointer; transition: background 0.1s; }
        .raising-card:hover { background: #ede8de; }
        .raising-name { font-family: 'Playfair Display', serif; font-size: 1.05rem; font-weight: 700; }
        .raising-fund { font-size: 0.6rem; color: #c8302a; letter-spacing: 0.1em; margin-top: 2px; }
        .raising-thesis { font-size: 0.65rem; color: #666; line-height: 1.6; margin-top: 8px; }
        .raising-meta { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .raising-chip { font-size: 0.58rem; padding: 3px 8px; border: 1px solid #c8c2b6; color: #777; text-transform: uppercase; letter-spacing: 0.08em; }
        .raising-size { font-size: 1.1rem; font-weight: 500; color: #c8302a; font-family: 'Playfair Display', serif; white-space: nowrap; text-align: right; }
        .raising-vintage { font-size: 0.6rem; color: #999; margin-top: 4px; text-align: right; }
        .intro-btn { display: block; margin-top: 10px; background: #1a1a1a; color: #f5f0e8; border: none; font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.1em; padding: 7px 14px; cursor: pointer; text-align: center; }
        .intro-btn:hover { background: #c8302a; }
        
        /* SYSTEM BAR */
        .sys-bar { background: #1a1a1a; padding: 6px 32px; display: flex; gap: 20px; align-items: center; }
        .sys-item { font-size: 0.56rem; color: #555; letter-spacing: 0.12em; }
        .sys-item b { color: #c8302a; }
        .sys-dot { width: 5px; height: 5px; border-radius: 50%; background: #16a34a; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <div className="logo">emerging<span>.</span>network</div>
          <div style={{ fontSize: "0.58rem", color: "#555", marginTop: 3, letterSpacing: "0.1em" }}>EMERGING MANAGER DIRECTORY · TRUST-GATED</div>
        </div>
        <div className="header-meta">
          <div>MEMBERS <b>{funds.length}</b> · VERIFIED</div>
          <div>RAISING <b>{raising.length}</b> · IN MARKET</div>
          <div>LAST SYNC <b>TODAY</b></div>
        </div>
      </div>

      {/* System bar */}
      <div className="sys-bar">
        <div className="sys-dot" />
        <div className="sys-item">SYSTEM <b>ONLINE</b></div>
        <div className="sys-item">FUNDS ≤ <b>$200M</b></div>
        <div className="sys-item">CO-INVEST OPEN <b>{funds.filter(f=>f.coInvest).length}</b></div>
        <div className="sys-item">CURRENTLY RAISING <b>{raising.length}</b></div>
      </div>

      {/* Nav */}
      <div className="nav">
        {VIEWS.map(v => (
          <button key={v} className={`nav-btn${view === v ? " active" : ""}`} onClick={() => setView(v)}>
            {v}{v === "RAISING" && <span className="nav-badge">{raising.length}</span>}
          </button>
        ))}
        <div className="nav-divider" />
        <div className="nav-right">
          <button className="request-btn">REQUEST ACCESS ↗</button>
        </div>
      </div>

      {/* Controls */}
      {view !== "NETWORK" && (
        <div className="controls">
          <input className="search" placeholder="Search fund, GP, thesis, geo…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="filter" value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option>All</option>
            <option>Pre-Seed</option>
            <option>Seed</option>
            <option>Series A</option>
          </select>
          <button className={`toggle-btn${filterCoInvest ? " on" : ""}`} onClick={() => setFilterCoInvest(!filterCoInvest)}>
            CO-INVEST OPEN {filterCoInvest ? "✓" : "○"}
          </button>
          <div className="count">Showing <b>{view === "RAISING" ? raising.length : filtered.length}</b> of <b>{funds.length}</b></div>
        </div>
      )}

      {/* DIRECTORY VIEW */}
      {view === "DIRECTORY" && (
        <div style={{ marginRight: selected ? 380 : 0, transition: "margin 0.2s" }}>
          <div className="dir-grid">
            {filtered.map(f => (
              <div key={f.id}
                className={`fund-card${selected?.id === f.id ? " active" : ""}`}
                onClick={() => setSelected(selected?.id === f.id ? null : f)}
              >
                <div className="card-row1">
                  <Avatar initials={f.initials} size={38} />
                  <div style={{ flex: 1 }}>
                    <div className="card-name">{f.name}</div>
                    <div className="card-fund">{f.fund}</div>
                  </div>
                  <div className="card-size">{f.size}</div>
                </div>
                <div className="tags">
                  {f.focus.map(t => <span key={t} className="tag">{t}</span>)}
                  <span className="tag" style={{ borderStyle: "dashed" }}>{f.geo}</span>
                </div>
                <div className="card-thesis">{f.thesis}</div>
                <div className="card-footer">
                  <span className="status-pill" style={{ color: statusColor[f.status], borderColor: statusColor[f.status] }}>{f.status}</span>
                  {f.coInvest && <span className="co-tag">CO-INVEST</span>}
                  {f.leadDeals && <span className="lead-tag">LEADS</span>}
                  <div className="check-size">{f.checkSize}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NETWORK VIEW */}
      {view === "NETWORK" && (
        <div className="network-wrap">
          <div>
            <svg width="400" height="420" className="network-svg">
              {/* Connection lines */}
              {funds.map(f =>
                f.connections.map(cid => {
                  const fi = funds.findIndex(x => x.id === f.id);
                  const ci = funds.findIndex(x => x.id === cid);
                  if (fi >= ci) return null;
                  const from = nodePositions[fi], to = nodePositions[ci];
                  const isActive = activeId && (f.id === activeId || cid === activeId);
                  return <ConnectionLine key={`${f.id}-${cid}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} active={isActive} />;
                })
              )}
              {/* Nodes */}
              {funds.map((f, i) => {
                const { x, y } = nodePositions[i];
                const isActive = activeId === f.id;
                const isConnected = activeId && funds.find(x => x.id === activeId)?.connections.includes(f.id);
                return (
                  <g key={f.id} onClick={() => setSelected(selected?.id === f.id ? null : f)}
                    onMouseEnter={() => setHovered(f.id)} onMouseLeave={() => setHovered(null)}
                    style={{ cursor: "pointer" }}>
                    <circle cx={x} cy={y} r={isActive ? 22 : 16}
                      fill={isActive ? "#c8302a" : isConnected ? "#2d2020" : "#1a1a1a"}
                      stroke={isActive ? "#c8302a" : isConnected ? "#c8302a" : "#333"}
                      strokeWidth={isActive ? 2 : 1}
                    />
                    <text x={x} y={y + 4} textAnchor="middle"
                      fill={isActive ? "white" : isConnected ? "#ff6b5b" : "#888"}
                      fontSize={isActive ? 8 : 7} fontFamily="DM Mono, monospace" fontWeight="500">
                      {f.initials}
                    </text>
                    {isActive && (
                      <text x={x} y={y + 34} textAnchor="middle" fill="#c8302a" fontSize={7} fontFamily="DM Mono, monospace">
                        {f.fund.split(" ")[0]}
                      </text>
                    )}
                  </g>
                );
              })}
              <text x={200} y={20} textAnchor="middle" fill="#333" fontSize={8} fontFamily="DM Mono, monospace" letterSpacing="2">
                WARM INTRO GRAPH · {funds.length} MEMBERS
              </text>
            </svg>
            <div style={{ background: "#ede8de", border: "1px solid #d4cfc5", borderTop: "none", padding: "12px 16px" }}>
              <div style={{ fontSize: "0.6rem", color: "#999", letterSpacing: "0.12em", marginBottom: 8 }}>CLICK ANY NODE TO EXPLORE CONNECTIONS</div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6rem", color: "#555" }}>
                  <div style={{ width: 20, height: 1.5, background: "#c8302a" }} /> Active connection
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.6rem", color: "#555" }}>
                  <div style={{ width: 20, height: 1, background: "#2a2a2a", borderTop: "1px dashed #2a2a2a" }} /> Weak tie
                </div>
              </div>
            </div>
          </div>
          {/* Network right panel */}
          <div>
            {selected ? (
              <div style={{ background: "#1a1a1a", padding: 24, color: "#f5f0e8" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <Avatar initials={selected.initials} size={44} />
                  <div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700 }}>{selected.name}</div>
                    <div style={{ fontSize: "0.62rem", color: "#c8302a", letterSpacing: "0.1em" }}>{selected.fund} · {selected.size}</div>
                  </div>
                </div>
                <div style={{ fontSize: "0.6rem", color: "#555", letterSpacing: "0.12em", marginBottom: 10 }}>DIRECT CONNECTIONS ({selected.connections.length})</div>
                <div className="connection-list">
                  {selected.connections.map(cid => {
                    const conn = funds.find(f => f.id === cid);
                    return (
                      <div key={cid} className="conn-item" onClick={() => setSelected(conn)}>
                        <Avatar initials={conn.initials} size={28} />
                        <div>
                          <div className="conn-name">{conn.name}</div>
                          <div className="conn-fund">{conn.fund} · {conn.stage}</div>
                        </div>
                        {conn.coInvest && <span style={{ marginLeft: "auto", fontSize: "0.56rem", color: "#16a34a", border: "1px solid #16a34a", padding: "1px 6px" }}>CO-INV</span>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 16, padding: "12px", background: "#111", borderLeft: "2px solid #c8302a" }}>
                  <div style={{ fontSize: "0.58rem", color: "#555", letterSpacing: "0.1em", marginBottom: 6 }}>INTRO OVERLAP</div>
                  <div style={{ fontSize: "0.64rem", color: "#888", lineHeight: 1.6 }}>
                    {selected.connections.length} warm paths into this fund's network. Request intro via any connected member.
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: "#ede8de", border: "1px solid #d4cfc5", padding: 24, height: "100%" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, marginBottom: 8 }}>Warm Intro Graph</div>
                <div style={{ fontSize: "0.65rem", color: "#777", lineHeight: 1.7 }}>
                  Click any node in the network to explore that manager's connections, co-invest relationships, and warm intro paths.<br /><br />
                  Solid lines = confirmed working relationships. Dashed = single-touch connections.
                </div>
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[["Total Nodes", funds.length], ["Co-Invest Open", funds.filter(f=>f.coInvest).length], ["Lead Deals", funds.filter(f=>f.leadDeals).length], ["In Market", raising.length]].map(([label, val]) => (
                    <div key={label} style={{ background: "#f5f0e8", padding: "12px", border: "1px solid #d4cfc5" }}>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#c8302a" }}>{val}</div>
                      <div style={{ fontSize: "0.58rem", color: "#999", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RAISING VIEW */}
      {view === "RAISING" && (
        <div className="raising-wrap">
          <div className="raising-header">Funds Currently Raising</div>
          <div className="raising-sub">LP OPPORTUNITIES · MANUALLY VERIFIED · {raising.length} IN MARKET</div>
          {raising.map(f => (
            <div key={f.id} className="raising-card" onClick={() => setSelected(selected?.id === f.id ? null : f)}>
              <Avatar initials={f.initials} size={42} />
              <div>
                <div className="raising-name">{f.name}</div>
                <div className="raising-fund">{f.fund}</div>
                <div className="raising-thesis">{f.thesis}</div>
                <div className="raising-meta">
                  <span className="raising-chip">{f.stage}</span>
                  <span className="raising-chip">{f.geo}</span>
                  <span className="raising-chip">{f.checkSize}</span>
                  {f.coInvest && <span className="raising-chip" style={{ borderColor: "#16a34a", color: "#16a34a" }}>CO-INVEST</span>}
                </div>
                {f.notes && <div style={{ fontSize: "0.63rem", color: "#888", marginTop: 8, fontStyle: "italic" }}>"{f.notes}"</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="raising-size">{f.size}</div>
                <div className="raising-vintage">Vintage {f.vintage}</div>
                <button className="intro-btn" onClick={e => { e.stopPropagation(); setSelected(f); setView("DIRECTORY"); }}>
                  VIEW PROFILE ↗
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 24, padding: "16px 20px", background: "#ede8de", border: "1px solid #d4cfc5", fontSize: "0.65rem", color: "#888", lineHeight: 1.7 }}>
            ◆ All funds listed here have opted into LP discovery. Warm intros only. Request access to unlock full contact details and intro paths.
          </div>
        </div>
      )}

      {/* DETAIL PANEL */}
      {selected && view === "DIRECTORY" && (
        <div className="detail-panel">
          <button className="detail-close" onClick={() => setSelected(null)}>← CLOSE</button>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <Avatar initials={selected.initials} size={48} />
            <div>
              <div className="detail-name">{selected.name}</div>
              <div className="detail-fund">{selected.fund}</div>
            </div>
          </div>
          <div className="thesis-block">{selected.thesis}</div>
          {[
            ["Fund Size", selected.size],
            ["Vintage", selected.vintage],
            ["Stage", selected.stage],
            ["Geography", selected.geo],
            ["Check Size", selected.checkSize],
            ["Status", selected.status],
            ["LP Status", selected.lpStatus],
            ["Website", selected.web],
            ["Twitter", selected.twitter],
          ].map(([label, val]) => (
            <div key={label} className="detail-row">
              <span className="detail-label">{label}</span>
              <span className="detail-val" style={label === "LP Status" && val === "Raising" ? { color: "#c8302a" } : {}}>{val}</span>
            </div>
          ))}
          <div className="detail-section">Portfolio (Sample)</div>
          <div className="portfolio-tags">
            {selected.portfolio.map(p => <span key={p} className="ptag">{p}</span>)}
          </div>
          <div className="detail-section">Network ({selected.connections.length} direct)</div>
          <div className="connection-list">
            {selected.connections.map(cid => {
              const conn = funds.find(f => f.id === cid);
              return (
                <div key={cid} className="conn-item" onClick={() => setSelected(conn)}>
                  <Avatar initials={conn.initials} size={26} />
                  <div>
                    <div className="conn-name">{conn.name}</div>
                    <div className="conn-fund">{conn.fund}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="detail-section">Notes</div>
          <div className="notes-block">{selected.notes}</div>
        </div>
      )}
    </div>
  );
}
