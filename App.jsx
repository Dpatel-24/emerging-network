const AIRTABLE_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN;
const AIRTABLE_BASE = import.meta.env.VITE_AIRTABLE_BASE;
const AIRTABLE_TABLE = import.meta.env.VITE_AIRTABLE_TABLE;

function getInitials(name = "") {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function mapRecord(rec) {
  const f = rec.fields;
  const name = f["Fund Name"] || "Unknown";
  return {
    id: rec.id,
    initials: getInitials(name),
    fund: name,
    name: f["GP Name"] || "",
    size: f["Fund Size"] || "—",
    vintage: f["Vintage Year"] || null,
    stage: f["Stage"] || "—",
    thesis: f["Thesis"] || "",
    focus: f["Industries"] ? f["Industries"].split(",").map(s => s.trim()) : [],
    geo: f["City"] && f["State"] ? `${f["City"]}, ${f["State"]}` : f["City"] || f["State"] || "—",
    city: f["City"] || "",
    state: f["State"] || "",
    capitalType: f["Capital Type"] || "—",
    web: f["Website"] || "",
  };
}

const capitalTypeColors = {
  "Venture Fund": "#7c3aed",
  "Accelerator": "#c8302a",
  "Economic Dev": "#0369a1",
  "Government": "#1d4ed8",
  "University Fund": "#065f46",
  "Family Office": "#92400e",
  "Angel Group": "#9d174d",
};

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

export default function EmergingManagerNetwork() {
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState("DIRECTORY");
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchFunds() {
      try {
        const res = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_TABLE}`,
          { headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` } }
        );
        if (!res.ok) throw new Error(`Airtable responded with status ${res.status}`);
        const data = await res.json();
        setFunds(data.records.map(mapRecord));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFunds();
  }, []);

  const capitalTypes = useMemo(() => ["All", ...new Set(funds.map(f => f.capitalType).filter(t => t !== "—"))], [funds]);
  const stages = useMemo(() => ["All", ...new Set(funds.map(f => f.stage).filter(t => t !== "—"))], [funds]);

  const filtered = useMemo(() => funds.filter(f => {
    const q = search.toLowerCase();
    const matchQ = !q || f.fund.toLowerCase().includes(q) || f.name.toLowerCase().includes(q)
      || f.focus.some(x => x.toLowerCase().includes(q)) || f.geo.toLowerCase().includes(q)
      || f.thesis.toLowerCase().includes(q);
    const matchType = filterType === "All" || f.capitalType === filterType;
    const matchStage = filterStage === "All" || f.stage === filterStage;
    return matchQ && matchType && matchStage;
  }), [funds, search, filterType, filterStage]);

  const nodePositions = funds.map((_, i) => {
    const angle = (i / Math.max(funds.length, 1)) * 2 * Math.PI - Math.PI / 2;
    return { x: 200 + 150 * Math.cos(angle), y: 210 + 150 * Math.sin(angle) };
  });

  const activeId = hovered || selected?.id;

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#f5f0e8", minHeight: "100vh", color: "#1a1a1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@400;700;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .header{background:#1a1a1a;padding:18px 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #c8302a;}
        .logo{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:900;color:#f5f0e8;}
        .logo span{color:#c8302a;}
        .hm{font-size:0.6rem;color:#666;letter-spacing:0.15em;text-align:right;line-height:1.8;}
        .hm b{color:#c8302a;}
        .sys-bar{background:#1a1a1a;padding:6px 32px;display:flex;gap:20px;align-items:center;}
        .si{font-size:0.56rem;color:#555;letter-spacing:0.12em;}
        .si b{color:#c8302a;}
        .dot{width:5px;height:5px;border-radius:50%;background:#16a34a;animation:pulse 2s infinite;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .nav{background:#f5f0e8;border-bottom:1px solid #d4cfc5;padding:0 32px;display:flex;align-items:center;}
        .nb{background:none;border:none;font-family:'DM Mono',monospace;font-size:0.65rem;letter-spacing:0.15em;padding:14px 20px;cursor:pointer;color:#999;border-bottom:2px solid transparent;transition:all 0.15s;}
        .nb:hover{color:#1a1a1a;}
        .nb.active{color:#c8302a;border-bottom-color:#c8302a;}
        .nr{margin-left:auto;}
        .rb{background:#1a1a1a;color:#f5f0e8;border:none;font-family:'DM Mono',monospace;font-size:0.6rem;letter-spacing:0.12em;padding:8px 16px;cursor:pointer;}
        .rb:hover{background:#c8302a;}
        .ctrl{padding:14px 32px;background:#ede8de;border-bottom:1px solid #d4cfc5;display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
        .srch{background:#f5f0e8;border:1px solid #c8c2b6;padding:7px 12px;font-family:'DM Mono',monospace;font-size:0.7rem;color:#1a1a1a;outline:none;min-width:220px;}
        .srch::placeholder{color:#a0998e;}
        .srch:focus{border-color:#c8302a;}
        .flt{background:#f5f0e8;border:1px solid #c8c2b6;padding:7px 10px;font-family:'DM Mono',monospace;font-size:0.66rem;color:#1a1a1a;outline:none;cursor:pointer;}
        .cnt{margin-left:auto;font-size:0.62rem;color:#999;letter-spacing:0.1em;}
        .cnt b{color:#1a1a1a;}
        .grid{padding:24px 32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1px;background:#d4cfc5;}
        .card{background:#f5f0e8;padding:20px;cursor:pointer;transition:background 0.1s;}
        .card:hover{background:#ede8de;}
        .card.sel{background:#1a1a1a;color:#f5f0e8;}
        .cr1{display:flex;align-items:flex-start;gap:12px;margin-bottom:10px;}
        .cn{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;line-height:1.2;}
        .cgp{font-size:0.6rem;color:#888;margin-top:2px;}
        .card.sel .cgp{color:#aaa;}
        .csz{font-size:0.72rem;font-weight:500;color:#c8302a;margin-left:auto;white-space:nowrap;}
        .card.sel .csz{color:#ff6b5b;}
        .tags{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;}
        .tag{font-size:0.54rem;letter-spacing:0.08em;padding:2px 6px;border:1px solid #c8c2b6;color:#777;text-transform:uppercase;}
        .card.sel .tag{border-color:#444;color:#bbb;}
        .cth{font-size:0.63rem;line-height:1.6;color:#555;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
        .card.sel .cth{color:#bbb;}
        .cft{display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid #d4cfc5;}
        .card.sel .cft{border-top-color:#333;}
        .tp{font-size:0.54rem;letter-spacing:0.08em;padding:2px 7px;border:1px solid;text-transform:uppercase;}
        .gl{margin-left:auto;font-size:0.56rem;color:#999;}
        .card.sel .gl{color:#666;}
        .dp{position:fixed;right:0;top:0;bottom:0;width:360px;background:#1a1a1a;color:#f5f0e8;z-index:50;overflow-y:auto;border-left:2px solid #c8302a;padding:28px;}
        .dc{background:none;border:1px solid #333;color:#888;padding:6px 12px;font-family:'DM Mono',monospace;font-size:0.6rem;cursor:pointer;letter-spacing:0.1em;margin-bottom:24px;}
        .dc:hover{border-color:#c8302a;color:#c8302a;}
        .dn{font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:900;line-height:1.1;margin-bottom:4px;}
        .ds{font-size:0.62rem;color:#c8302a;letter-spacing:0.1em;margin-bottom:20px;}
        .dr{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #222;font-size:0.65rem;}
        .dl{color:#555;text-transform:uppercase;letter-spacing:0.1em;font-size:0.58rem;}
        .dv{color:#f5f0e8;text-align:right;max-width:200px;word-break:break-word;}
        .tb{background:#111;padding:14px;font-size:0.65rem;line-height:1.7;color:#ccc;border-left:2px solid #c8302a;margin-bottom:16px;font-style:italic;}
        .ft{display:flex;flex-wrap:wrap;gap:5px;margin-top:8px;}
        .ftag{font-size:0.58rem;background:#222;padding:3px 9px;color:#aaa;border:1px solid #333;}
        .nw{padding:24px 32px;display:grid;grid-template-columns:420px 1fr;gap:24px;}
        .svg{background:#1a1a1a;border:1px solid #2a2a2a;display:block;}
        .state{padding:60px 32px;text-align:center;}
        .state-title{font-size:0.65rem;letter-spacing:0.2em;margin-bottom:10px;}
      `}</style>

      {/* Header */}
      <div className="header">
        <div>
          <div className="logo">emerging<span>.</span>network</div>
          <div style={{fontSize:"0.57rem",color:"#555",marginTop:3,letterSpacing:"0.1em"}}>GULF SOUTH CAPITAL DIRECTORY · CURATED</div>
        </div>
        <div className="hm">
          <div>FUNDS <b>{funds.length}</b></div>
          <div>REGION <b>GULF SOUTH</b></div>
          <div>STATUS <b>BETA</b></div>
        </div>
      </div>

      {/* System bar */}
      <div className="sys-bar">
        <div className="dot"/>
        <div className="si">SYSTEM <b>ONLINE</b></div>
        <div className="si">DATA <b>LIVE · AIRTABLE</b></div>
        <div className="si">TYPES <b>{capitalTypes.length - 1}</b></div>
        <div className="si">VERIFIED <b>MANUALLY</b></div>
      </div>

      {/* Nav */}
      <div className="nav">
        {["DIRECTORY","NETWORK"].map(v => (
          <button key={v} className={`nb${view===v?" active":""}`} onClick={()=>{setView(v);setSelected(null);}}>{v}</button>
        ))}
        <div className="nr"><button className="rb">REQUEST ACCESS ↗</button></div>
      </div>

      {/* Controls */}
      {view === "DIRECTORY" && !loading && !error && (
        <div className="ctrl">
          <input className="srch" placeholder="Search fund, GP, industry, city…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select className="flt" value={filterType} onChange={e=>setFilterType(e.target.value)}>
            {capitalTypes.map(t=><option key={t}>{t}</option>)}
          </select>
          <select className="flt" value={filterStage} onChange={e=>setFilterStage(e.target.value)}>
            {stages.map(s=><option key={s}>{s}</option>)}
          </select>
          <div className="cnt">Showing <b>{filtered.length}</b> of <b>{funds.length}</b></div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="state">
          <div className="state-title" style={{color:"#999"}}>FETCHING LIVE DATA…</div>
          <div style={{fontSize:"0.58rem",color:"#555",letterSpacing:"0.1em"}}>CONNECTING TO AIRTABLE</div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="state">
          <div className="state-title" style={{color:"#c8302a"}}>CONNECTION ERROR</div>
          <div style={{fontSize:"0.6rem",color:"#777"}}>{error}</div>
        </div>
      )}

      {/* Directory */}
      {!loading && !error && view === "DIRECTORY" && (
        <div style={{marginRight: selected ? 360 : 0, transition:"margin 0.2s"}}>
          <div className="grid">
            {filtered.map(f => {
              const tc = capitalTypeColors[f.capitalType] || "#555";
              return (
                <div key={f.id} className={`card${selected?.id===f.id?" sel":""}`}
                  onClick={()=>setSelected(selected?.id===f.id ? null : f)}>
                  <div className="cr1">
                    <Avatar initials={f.initials} size={38}/>
                    <div style={{flex:1}}>
                      <div className="cn">{f.fund}</div>
                      {f.name && <div className="cgp">{f.name}</div>}
                    </div>
                    <div className="csz">{f.size}</div>
                  </div>
                  {f.focus.length > 0 && (
                    <div className="tags">
                      {f.focus.slice(0,3).map(t=><span key={t} className="tag">{t}</span>)}
                    </div>
                  )}
                  {f.thesis && <div className="cth">{f.thesis}</div>}
                  <div className="cft">
                    <span className="tp" style={{color:tc,borderColor:tc}}>{f.capitalType}</span>
                    <span style={{fontSize:"0.56rem",color:selected?.id===f.id?"#888":"#bbb"}}>{f.stage}</span>
                    <div className="gl">{f.city||f.geo}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Network */}
      {!loading && !error && view === "NETWORK" && (
        <div className="nw">
          <div>
            <svg width="400" height="420" className="svg">
              <text x={200} y={20} textAnchor="middle" fill="#333" fontSize={8} fontFamily="DM Mono,monospace" letterSpacing="2">
                GULF SOUTH · {funds.length} ENTITIES
              </text>
              {funds.map((f,i)=>{
                const {x,y}=nodePositions[i];
                const isActive=activeId===f.id;
                const tc=capitalTypeColors[f.capitalType]||"#555";
                return (
                  <g key={f.id} onClick={()=>setSelected(selected?.id===f.id?null:f)}
                    onMouseEnter={()=>setHovered(f.id)} onMouseLeave={()=>setHovered(null)}
                    style={{cursor:"pointer"}}>
                    <circle cx={x} cy={y} r={isActive?22:15} fill={isActive?tc:"#1a1a1a"} stroke={isActive?tc:"#333"} strokeWidth={isActive?2:1}/>
                    <text x={x} y={y+4} textAnchor="middle" fill={isActive?"white":"#888"} fontSize={7} fontFamily="DM Mono,monospace" fontWeight="500">{f.initials}</text>
                    {isActive && <text x={x} y={y+34} textAnchor="middle" fill={tc} fontSize={6} fontFamily="DM Mono,monospace">{f.fund.split(" ")[0]}</text>}
                  </g>
                );
              })}
            </svg>
            <div style={{background:"#ede8de",border:"1px solid #d4cfc5",borderTop:"none",padding:"12px 16px"}}>
              <div style={{fontSize:"0.58rem",color:"#999",letterSpacing:"0.12em",marginBottom:8}}>CAPITAL TYPE</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                {Object.entries(capitalTypeColors).map(([type,color])=>(
                  <div key={type} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:color}}/>
                    <span style={{fontSize:"0.56rem",color:"#666",fontFamily:"'DM Mono',monospace"}}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            {selected ? (
              <div style={{background:"#1a1a1a",padding:24,color:"#f5f0e8"}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <Avatar initials={selected.initials} size={44}/>
                  <div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700}}>{selected.fund}</div>
                    <div style={{fontSize:"0.62rem",color:"#c8302a",letterSpacing:"0.1em"}}>{selected.capitalType} · {selected.stage}</div>
                  </div>
                </div>
                {selected.thesis && <div style={{background:"#111",padding:12,borderLeft:"2px solid #c8302a",fontSize:"0.65rem",lineHeight:1.7,color:"#ccc",fontStyle:"italic",marginBottom:16}}>{selected.thesis}</div>}
                {[["GP",selected.name],["Size",selected.size],["Location",selected.geo],["Website",selected.web]].filter(([,v])=>v&&v!=="—").map(([l,v])=>(
                  <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #222",fontSize:"0.65rem"}}>
                    <span style={{color:"#555",textTransform:"uppercase",letterSpacing:"0.1em",fontSize:"0.58rem"}}>{l}</span>
                    <span style={{color:"#f5f0e8"}}>{v}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{background:"#ede8de",border:"1px solid #d4cfc5",padding:24}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:700,marginBottom:8}}>Gulf South Capital Map</div>
                <div style={{fontSize:"0.65rem",color:"#777",lineHeight:1.7}}>Click any node to explore a fund's profile. Color = capital type.<br/><br/>This map covers all capital vehicles active in the Gulf South — funds, accelerators, government programs, and university vehicles.</div>
                <div style={{marginTop:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["Mapped",funds.length],["Cities",new Set(funds.map(f=>f.city)).size],["Types",capitalTypes.length-1],["Filtered",filtered.length]].map(([l,v])=>(
                    <div key={l} style={{background:"#f5f0e8",padding:12,border:"1px solid #d4cfc5"}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",fontWeight:700,color:"#c8302a"}}>{v}</div>
                      <div style={{fontSize:"0.58rem",color:"#999",letterSpacing:"0.1em",textTransform:"uppercase"}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && view === "DIRECTORY" && (
        <div className="dp">
          <button className="dc" onClick={()=>setSelected(null)}>← CLOSE</button>
          <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
            <Avatar initials={selected.initials} size={46}/>
            <div>
              <div className="dn">{selected.fund}</div>
              <div className="ds">{selected.capitalType}</div>
            </div>
          </div>
          {selected.thesis && <div className="tb">{selected.thesis}</div>}
          {[["GP",selected.name],["Fund Size",selected.size],["Vintage",selected.vintage],["Stage",selected.stage],["Location",selected.geo],["Website",selected.web]].filter(([,v])=>v&&v!=="—").map(([l,v])=>(
            <div key={l} className="dr">
              <span className="dl">{l}</span>
              <span className="dv">{v}</span>
            </div>
          ))}
          {selected.focus.length > 0 && (
            <>
              <div style={{fontSize:"0.58rem",color:"#555",letterSpacing:"0.15em",textTransform:"uppercase",marginTop:20,marginBottom:8}}>Industries</div>
              <div className="ft">{selected.focus.map(t=><span key={t} className="ftag">{t}</span>)}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
