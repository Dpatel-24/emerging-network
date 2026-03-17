import { useState, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_AIRTABLE_BASE;
const KEY  = import.meta.env.VITE_AIRTABLE_TOKEN;
const url  = t => `https://api.airtable.com/v0/${BASE}/${t}`;

const TABLES = {
  funds:     'tblrzWPnDsJUJyrXd',
  investors: 'tblEn1mjWUcGrSpZt',
  partners:  'tblJaOtCGMcs6i5Gv',
  events:    'tblNOHxtryoELutOG',
  dispatch:  'tblgqjHZRHygZoAQA',
};

// ─── Constants ────────────────────────────────────────────────────────────────
const REGIONS = ['Gulf South','Southeast','Texas','Mountain West','Midwest','Mid-Atlantic','Northeast','Southwest'];

const REGION_COLORS = {
  'Gulf South':    '#c8302a',
  'Southeast':     '#1d4ed8',
  'Texas':         '#15803d',
  'Mountain West': '#b45309',
  'Midwest':       '#7c3aed',
  'Mid-Atlantic':  '#0e7490',
  'Northeast':     '#be185d',
  'Southwest':     '#d97706',
};

// FIPS state code → Region
const FIPS_REGION = {
  '22':'Gulf South','28':'Gulf South','01':'Gulf South','05':'Gulf South',
  '47':'Southeast','13':'Southeast','12':'Southeast','37':'Southeast','45':'Southeast',
  '48':'Texas','40':'Texas',
  '49':'Mountain West','08':'Mountain West','32':'Mountain West','16':'Mountain West','56':'Mountain West','30':'Mountain West',
  '17':'Midwest','39':'Midwest','18':'Midwest','26':'Midwest','27':'Midwest','55':'Midwest','29':'Midwest','20':'Midwest',
  '36':'Mid-Atlantic','34':'Mid-Atlantic','42':'Mid-Atlantic','11':'Mid-Atlantic','24':'Mid-Atlantic','51':'Mid-Atlantic',
  '25':'Northeast','09':'Northeast','44':'Northeast','50':'Northeast','33':'Northeast','23':'Northeast',
  '04':'Southwest','35':'Southwest',
};

// Approximate label centroids in Albers 960×600 space
const REGION_LABEL = {
  'Gulf South':    [700, 455],
  'Southeast':     [780, 398],
  'Texas':         [510, 458],
  'Mountain West': [268, 312],
  'Midwest':       [610, 295],
  'Mid-Atlantic':  [822, 270],
  'Northeast':     [872, 192],
  'Southwest':     [372, 435],
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

const PARTNER_COLORS = {
  'Legal':              '#c8302a',
  'Finance & CFO':      '#15803d',
  'Brand & Creative':   '#1d4ed8',
  'PR & Comms':         '#b45309',
  'Recruiting':         '#7c3aed',
  'Accounting':         '#0e7490',
  'Coworking':          '#be185d',
  'Events & Community': '#d97706',
  'Other':              '#888',
};

const SIZE_BUCKETS = ['Micro (<$10M)','Small ($10–50M)','Mid ($50–150M)','Large ($150M+)'];

// ─── Utilities ────────────────────────────────────────────────────────────────
async function fetchAll(tableId) {
  let all = [], offset = null;
  do {
    const r = await fetch(url(tableId) + (offset ? `?offset=${offset}` : ''),
      { headers: { Authorization: `Bearer ${KEY}` } });
    const d = await r.json();
    all = all.concat(d.records || []);
    offset = d.offset || null;
  } while (offset);
  return all;
}

function parseFundSize(s) {
  if (!s) return null;
  const c = s.replace(/[$,+\s]/g,'').toUpperCase();
  if (c.includes('B')) return parseFloat(c)*1000;
  if (c.includes('M')) return parseFloat(c);
  const n = parseFloat(c); return isNaN(n)?null:n;
}
function fundSizeBucket(s) {
  const n = parseFundSize(s);
  if (!n) return 'N/A';
  if (n<10)  return 'Micro (<$10M)';
  if (n<50)  return 'Small ($10–50M)';
  if (n<150) return 'Mid ($50–150M)';
  return 'Large ($150M+)';
}

function decodeTopojson(topo) {
  try {
    const { arcs, transform:{ scale:[sx,sy], translate:[tx,ty] } } = topo;
    const decoded = arcs.map(arc => {
      let x=0,y=0;
      return arc.map(([dx,dy])=>{ x+=dx; y+=dy; return [x*sx+tx, y*sy+ty]; });
    });
    const getArc = i => i<0 ? [...decoded[~i]].reverse() : decoded[i];
    const ringPath = ring => {
      const pts = ring.flatMap((i,j) => j===0?getArc(i):getArc(i).slice(1));
      return 'M'+pts.map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join('L')+'Z';
    };
    return topo.objects.states.geometries.map(g => {
      const fips = String(g.id).padStart(2,'0');
      const polys = g.type==='Polygon'?[g.arcs]:g.arcs;
      return { fips, d: polys.map(p=>p.map(ringPath).join('')).join('') };
    });
  } catch(e) { console.error(e); return []; }
}

// ─── MultiSelect ──────────────────────────────────────────────────────────────
function MultiSelect({ label, options, selected, onChange }) {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown',h);
    return () => document.removeEventListener('mousedown',h);
  },[]);
  const toggle = v => onChange(selected.includes(v)?selected.filter(x=>x!==v):[...selected,v]);
  const count = selected.length;
  const active = count>0;
  const lbl = count===0?label:count===1?selected[0]:`${label} (${count})`;
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button onMouseDown={e=>{e.preventDefault();setOpen(o=>!o)}} style={{
        background:active?'#1a1a1a':'transparent',color:active?'#faf6f0':'#1a1a1a',
        border:'1px solid #1a1a1a',padding:'7px 11px',
        fontSize:11,fontFamily:'"DM Mono",monospace',cursor:'pointer',
        minWidth:118,outline:'none',WebkitAppearance:'none',appearance:'none',
        userSelect:'none',WebkitUserSelect:'none',MozUserSelect:'none',
        display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,
      }}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:100,flex:1}}>{lbl}</span>
        <span style={{fontSize:9,flexShrink:0,lineHeight:1}}>▾</span>
      </button>
      {open && (
        <div style={{position:'absolute',top:'100%',left:0,zIndex:300,
          background:'#faf6f0',border:'1px solid #1a1a1a',borderTop:'none',
          minWidth:200,maxHeight:280,overflowY:'auto',
          boxShadow:'0 4px 20px rgba(0,0,0,0.12)'}}>
          {count>0 && (
            <div onMouseDown={e=>{e.preventDefault();onChange([]);setOpen(false)}}
              style={{padding:'8px 12px',fontSize:10,letterSpacing:2,color:'#c8302a',
                cursor:'pointer',borderBottom:'1px solid #e8e3db',textTransform:'uppercase'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f5f0e8'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              CLEAR SELECTION
            </div>
          )}
          {options.map(opt=>{
            const sel=selected.includes(opt);
            return (
              <div key={opt} onMouseDown={e=>{e.preventDefault();toggle(opt)}}
                style={{padding:'8px 12px',fontSize:11,fontFamily:'"DM Mono",monospace',
                  cursor:'pointer',display:'flex',alignItems:'center',gap:8,
                  background:sel?'#1a1a1a':'transparent',color:sel?'#faf6f0':'#1a1a1a',userSelect:'none'}}
                onMouseEnter={e=>{if(!sel)e.currentTarget.style.background='#f0ebe3'}}
                onMouseLeave={e=>{if(!sel)e.currentTarget.style.background='transparent'}}>
                <span style={{width:12,height:12,flexShrink:0,display:'inline-flex',alignItems:'center',
                  justifyContent:'center',fontSize:9,border:`1px solid ${sel?'#faf6f0':'#1a1a1a'}`}}>
                  {sel?'✓':''}
                </span>
                {opt}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Shared slide panel shell ─────────────────────────────────────────────────
function SlidePanel({ onClose, children }) {
  return (
    <>
      <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:99,background:'rgba(0,0,0,0.32)'}} />
      <div style={{position:'fixed',top:0,right:0,width:440,height:'100vh',
        background:'#faf6f0',borderLeft:'2px solid #1a1a1a',zIndex:100,
        display:'flex',flexDirection:'column',fontFamily:'"DM Mono",monospace',
        boxShadow:'-8px 0 40px rgba(0,0,0,0.15)'}}>
        {children}
      </div>
    </>
  );
}

// ─── Fund detail panel ────────────────────────────────────────────────────────
function FundPanel({ fund, onClose, investors=[], onSelectInvestor }) {
  const color = TYPE_COLORS[fund.type]||'#888';
  const bucket = fundSizeBucket(fund.size);
  const gps = [
    fund.gp1?{name:fund.gp1,li:fund.gp1li}:null,
    fund.gp2?{name:fund.gp2,li:fund.gp2li}:null,
    fund.gp3?{name:fund.gp3,li:fund.gp3li}:null,
  ].filter(Boolean);
  const linkedInvestors = investors.filter(inv =>
    inv.fund && fund.name && inv.fund.toLowerCase().trim() === fund.name.toLowerCase().trim()
  );
  return (
    <SlidePanel onClose={onClose}>
      <div style={{padding:'16px 28px',borderBottom:'1px solid #1a1a1a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:10,letterSpacing:2.5,textTransform:'uppercase',color,fontWeight:500}}>{fund.type}</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,lineHeight:1,color:'#1a1a1a',padding:0,outline:'none'}}>×</button>
      </div>
      <div style={{padding:'26px 28px',overflowY:'auto',flex:1}}>
        <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:REGION_COLORS[fund.region]||'#999',marginBottom:4,fontWeight:500}}>{fund.region}</div>
        <h2 style={{fontFamily:'"Raleway",sans-serif',fontSize:22,fontWeight:800,margin:'0 0 4px',lineHeight:1.2}}>{fund.name}</h2>
        <div style={{fontSize:12,color:'#888',marginBottom:22}}>{fund.city}{fund.state?`, ${fund.state}`:''}</div>
        {fund.thesis && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:8}}>THESIS</div>
            <p style={{fontSize:13.5,lineHeight:1.75,margin:0}}>{fund.thesis}</p>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 20px',marginBottom:20}}>
          {[['Stage',fund.stage],['Fund Size',fund.size?`${fund.size} · ${bucket}`:''],['Vintage',fund.vintage?`Est. ${fund.vintage}`:'']].filter(([,v])=>v).map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:4}}>{l}</div>
              <div style={{fontSize:13.5}}>{v}</div>
            </div>
          ))}
        </div>
        {gps.length>0 && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:10}}>GENERAL PARTNER{gps.length>1?'S':''}</div>
            {gps.map((gp,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                <span style={{fontSize:13.5}}>{gp.name}</span>
                {gp.li && <a href={gp.li} target="_blank" rel="noopener noreferrer" style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color,borderBottom:`1px solid ${color}`,textDecoration:'none',paddingBottom:1}}>LinkedIn</a>}
              </div>
            ))}
          </div>
        )}
        {linkedInvestors.length>0 && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:10}}>TEAM ON FILE</div>
            {linkedInvestors.map(inv=>(
              <div key={inv.id} onClick={()=>onSelectInvestor&&onSelectInvestor(inv)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',
                  marginBottom:6,border:'1px solid #e8e3db',cursor:'pointer',background:'#faf6f0'}}
                onMouseEnter={e=>e.currentTarget.style.background='#f0ebe3'}
                onMouseLeave={e=>e.currentTarget.style.background='#faf6f0'}>
                <div style={{width:32,height:32,borderRadius:'50%',background:'#1a1a1a',display:'flex',
                  alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{color:'#faf6f0',fontFamily:'"Raleway",sans-serif',fontWeight:800,fontSize:13}}>{(inv.name||'?')[0]}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,fontFamily:'"Raleway",sans-serif'}}>{inv.name}</div>
                  <div style={{fontSize:10,opacity:0.5}}>{inv.title}</div>
                </div>
                <span style={{fontSize:10,opacity:0.35}}>→</span>
              </div>
            ))}
          </div>
        )}
        {fund.industries && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:8}}>SECTORS</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {fund.industries.split(',').map(i=>i.trim()).filter(Boolean).map(i=>(
                <span key={i} style={{border:`1px solid ${color}`,color,fontSize:10,padding:'3px 9px'}}>{i}</span>
              ))}
            </div>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:20}}>
          {fund.website && <a href={fund.website} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',background:'#1a1a1a',color:'#faf6f0',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>↗ WEBSITE</a>}
          {fund.linkedin && <a href={fund.linkedin} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',border:'1px solid #1a1a1a',color:'#1a1a1a',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>LinkedIn</a>}
          {fund.email && <a href={`mailto:${fund.email}`} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',border:'1px solid #ccc',color:'#555',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>✉ {fund.email}</a>}
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Investor detail panel ────────────────────────────────────────────────────
function InvestorPanel({ inv, onClose, funds=[], onSelectFund }) {
  const linkedFund = funds.find(f =>
    f.name && inv.fund && f.name.toLowerCase().trim() === inv.fund.toLowerCase().trim()
  );
  return (
    <SlidePanel onClose={onClose}>
      <div style={{padding:'16px 28px',borderBottom:'1px solid #1a1a1a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:10,letterSpacing:2.5,textTransform:'uppercase',color:'#888',fontWeight:500}}>INVESTOR</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,lineHeight:1,color:'#1a1a1a',padding:0,outline:'none'}}>×</button>
      </div>
      <div style={{padding:'26px 28px',overflowY:'auto',flex:1}}>
        <div style={{width:56,height:56,borderRadius:'50%',background:'#1a1a1a',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}>
          <span style={{color:'#faf6f0',fontFamily:'"Raleway",sans-serif',fontWeight:800,fontSize:20}}>{(inv.name||'?')[0]}</span>
        </div>
        <h2 style={{fontFamily:'"Raleway",sans-serif',fontSize:22,fontWeight:800,margin:'0 0 3px',lineHeight:1.2}}>{inv.name}</h2>
        <div style={{fontSize:12,color:'#888',marginBottom:3}}>{inv.title}</div>
        <div style={{fontSize:12,color:'#c8302a',marginBottom:22,fontWeight:500,letterSpacing:0.5}}>{inv.fund}</div>
        {inv.thesis && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:8}}>INVESTMENT THESIS</div>
            <p style={{fontSize:13.5,lineHeight:1.75,margin:0}}>{inv.thesis}</p>
          </div>
        )}
        {inv.portfolio && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:8}}>NOTABLE PORTFOLIO</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {inv.portfolio.split(',').map(c=>c.trim()).filter(Boolean).map(c=>(
                <span key={c} style={{border:'1px solid #1a1a1a',fontSize:10,padding:'3px 9px'}}>{c}</span>
              ))}
            </div>
          </div>
        )}
        {linkedFund && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:10}}>ABOUT THEIR FUND</div>
            <div onClick={()=>onSelectFund&&onSelectFund(linkedFund)}
              style={{padding:'14px 16px',border:'1px solid #e8e3db',cursor:'pointer',background:'#faf6f0'}}
              onMouseEnter={e=>e.currentTarget.style.background='#f0ebe3'}
              onMouseLeave={e=>e.currentTarget.style.background='#faf6f0'}>
              <div style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',
                color:TYPE_COLORS[linkedFund.type]||'#888',fontWeight:500,marginBottom:4}}>{linkedFund.type}</div>
              <div style={{fontFamily:'"Raleway",sans-serif',fontSize:15,fontWeight:700,marginBottom:6}}>{linkedFund.name}</div>
              {linkedFund.thesis && (
                <div style={{fontSize:12,lineHeight:1.65,opacity:0.65,marginBottom:8,
                  display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
                  {linkedFund.thesis}
                </div>
              )}
              <div style={{display:'flex',gap:12,fontSize:11,opacity:0.45}}>
                {linkedFund.stage && <span>{linkedFund.stage}</span>}
                {linkedFund.size && linkedFund.size.startsWith('$') && <span>{linkedFund.size}</span>}
                {linkedFund.region && <span>{linkedFund.region}</span>}
              </div>
              <div style={{fontSize:10,opacity:0.3,marginTop:8,textAlign:'right'}}>View Fund →</div>
            </div>
          </div>
        )}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 20px',marginBottom:20}}>
          {[['Region',inv.region],['City',inv.city]].filter(([,v])=>v).map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:4}}>{l}</div>
              <div style={{fontSize:13.5}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:20}}>
          {inv.linkedin && <a href={inv.linkedin} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',background:'#1a1a1a',color:'#faf6f0',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>LinkedIn</a>}
          {inv.email && <a href={`mailto:${inv.email}`} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',border:'1px solid #ccc',color:'#555',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>✉ {inv.email}</a>}
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Partner detail panel ─────────────────────────────────────────────────────
function PartnerPanel({ partner, onClose }) {
  const color = PARTNER_COLORS[partner.category]||'#888';
  const ensureHttp = s => s ? (s.startsWith('http')?s:`https://${s}`) : '';
  return (
    <SlidePanel onClose={onClose}>
      <div style={{padding:'16px 28px',borderBottom:'1px solid #1a1a1a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <span style={{fontSize:10,letterSpacing:2.5,textTransform:'uppercase',color,fontWeight:500}}>{partner.category}</span>
        <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',fontSize:22,lineHeight:1,color:'#1a1a1a',padding:0,outline:'none'}}>×</button>
      </div>
      <div style={{padding:'26px 28px',overflowY:'auto',flex:1}}>
        <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:REGION_COLORS[partner.region]||'#999',marginBottom:4,fontWeight:500}}>{partner.region}</div>
        <h2 style={{fontFamily:'"Raleway",sans-serif',fontSize:22,fontWeight:800,margin:'0 0 4px',lineHeight:1.2}}>{partner.name}</h2>
        {partner.city && <div style={{fontSize:12,color:'#888',marginBottom:22}}>{partner.city}</div>}
        {partner.description && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:8}}>ABOUT</div>
            <p style={{fontSize:13.5,lineHeight:1.75,margin:0}}>{partner.description}</p>
          </div>
        )}
        {partner.contact && (
          <div style={{marginBottom:20}}>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#999',marginBottom:8}}>KEY CONTACT</div>
            <div style={{fontSize:13.5}}>{partner.contact}</div>
          </div>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:8,marginTop:20}}>
          {partner.website && <a href={ensureHttp(partner.website)} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',background:'#1a1a1a',color:'#faf6f0',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>↗ WEBSITE</a>}
          {partner.linkedin && <a href={ensureHttp(partner.linkedin)} target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',border:'1px solid #1a1a1a',color:'#1a1a1a',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>LinkedIn</a>}
          {partner.email && <a href={`mailto:${partner.email}`} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',border:'1px solid #ccc',color:'#555',fontSize:10,letterSpacing:2,textTransform:'uppercase',textDecoration:'none',width:'fit-content'}}>✉ {partner.email}</a>}
        </div>
      </div>
    </SlidePanel>
  );
}

// ─── Fund card ──────────────────────────────────────────────────────────��─────
function FundCard({ fund, onClick }) {
  const [hov,setHov] = useState(false);
  const color = TYPE_COLORS[fund.type]||'#888';
  const bucket = fundSizeBucket(fund.size);
  return (
    <div onClick={()=>onClick(fund)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:'20px 22px',cursor:'pointer',background:hov?'#1a1a1a':'#faf6f0',
        color:hov?'#faf6f0':'#1a1a1a',transition:'all 0.12s',height:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:9}}>
        <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:hov?'#aaa':color,fontWeight:500}}>{fund.type}</span>
        <span style={{fontSize:10,opacity:0.5}}>{fund.region}</span>
      </div>
      <div style={{fontFamily:'"Raleway",sans-serif',fontSize:16,fontWeight:700,marginBottom:8,lineHeight:1.3}}>{fund.name}</div>
      {fund.thesis && (
        <div style={{fontSize:12,lineHeight:1.65,opacity:0.65,marginBottom:11,
          display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {fund.thesis}
        </div>
      )}
      <div style={{display:'flex',gap:14,fontSize:11,opacity:0.5,flexWrap:'wrap'}}>
        {fund.stage && <span>▸ {fund.stage}</span>}
        {bucket!=='N/A' && <span>{bucket}</span>}
        {fund.vintage && <span>Est. {fund.vintage}</span>}
      </div>
    </div>
  );
}

// ─── Investor card ────────────────────────────────────────────────────────────
function InvestorCard({ inv, onClick }) {
  const [hov,setHov] = useState(false);
  return (
    <div onClick={()=>onClick(inv)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:'20px 22px',cursor:'pointer',background:hov?'#1a1a1a':'#faf6f0',
        color:hov?'#faf6f0':'#1a1a1a',transition:'all 0.12s',height:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:12}}>
        <div style={{width:42,height:42,borderRadius:'50%',background:hov?'#faf6f0':'#1a1a1a',
          display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.12s'}}>
          <span style={{color:hov?'#1a1a1a':'#faf6f0',fontFamily:'"Raleway",sans-serif',fontWeight:800,fontSize:17,transition:'all 0.12s'}}>{(inv.name||'?')[0]}</span>
        </div>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:'"Raleway",sans-serif',fontSize:15,fontWeight:700,lineHeight:1.2}}>{inv.name}</div>
          <div style={{fontSize:11,opacity:0.5,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{inv.title}</div>
        </div>
      </div>
      <div style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',
        color:hov?'#aaa':'#c8302a',fontWeight:500,marginBottom:8}}>{inv.fund}</div>
      {inv.thesis && (
        <div style={{fontSize:11,lineHeight:1.6,opacity:0.6,
          display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {inv.thesis}
        </div>
      )}
    </div>
  );
}

// ─── Partner card ─────────────────────────────────────────────────────────────
function PartnerCard({ partner, onClick }) {
  const [hov,setHov] = useState(false);
  const color = PARTNER_COLORS[partner.category]||'#888';
  return (
    <div onClick={()=>onClick(partner)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:'20px 22px',cursor:'pointer',background:hov?'#1a1a1a':'#faf6f0',
        color:hov?'#faf6f0':'#1a1a1a',transition:'all 0.12s',height:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:9}}>
        <span style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:hov?'#aaa':color,fontWeight:500}}>{partner.category}</span>
        <span style={{fontSize:10,opacity:0.5}}>{partner.region}</span>
      </div>
      <div style={{fontFamily:'"Raleway",sans-serif',fontSize:16,fontWeight:700,marginBottom:8,lineHeight:1.3}}>{partner.name}</div>
      {partner.description && (
        <div style={{fontSize:12,lineHeight:1.65,opacity:0.65,marginBottom:11,
          display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
          {partner.description}
        </div>
      )}
      {partner.contact && <div style={{fontSize:11,opacity:0.45}}>Contact: {partner.contact}</div>}
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({ search, setSearch, filters, hasFilters, onClearAll, resultCount, loading }) {
  return (
    <div style={{padding:'12px 48px',borderBottom:'1px solid #d4cfc7',display:'flex',
      gap:8,alignItems:'center',flexWrap:'wrap',background:'#f0ebe3'}}>
      <div style={{position:'relative',display:'flex',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
          style={{background:'transparent',border:'1px solid #1a1a1a',padding:'7px 32px 7px 12px',
            fontSize:11,fontFamily:'"DM Mono",monospace',outline:'none',minWidth:220,color:'#1a1a1a'}} />
        {search && (
          <button onClick={()=>setSearch('')} style={{position:'absolute',right:8,background:'none',
            border:'none',cursor:'pointer',fontSize:17,lineHeight:1,color:'#999',padding:0,outline:'none',
            display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
        )}
      </div>
      {filters}
      {hasFilters && (
        <button onClick={onClearAll} style={{background:'none',border:'1px solid #c8302a',color:'#c8302a',
          padding:'7px 14px',fontSize:10,letterSpacing:2,textTransform:'uppercase',
          fontFamily:'"DM Mono",monospace',cursor:'pointer',outline:'none'}}>
          CLEAR ALL
        </button>
      )}
      <span style={{marginLeft:'auto',fontSize:11,opacity:0.4}}>
        {!loading && `${resultCount} results`}
      </span>
    </div>
  );
}

// ─── Card grid ────────────────────────────────────────────────────────────────
function CardGrid({ items, renderCard, loading, emptyMsg='NO RESULTS' }) {
  if (loading) return <div style={{textAlign:'center',padding:80,fontSize:11,letterSpacing:2,opacity:0.35}}>FETCHING LIVE DATA…</div>;
  if (!items.length) return <div style={{textAlign:'center',padding:80,fontSize:11,letterSpacing:2,opacity:0.35}}>{emptyMsg}</div>;
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
      border:'1px solid #1a1a1a',borderBottom:'none',borderRight:'none'}}>
      {items.map((item,i) => (
        <div key={item.id||i} style={{borderBottom:'1px solid #1a1a1a',borderRight:'1px solid #1a1a1a'}}>
          {renderCard(item)}
        </div>
      ))}
    </div>
  );
}

// ─── CAPITAL TAB ──────────────────────────────────────────────────────────────
function CapitalTab({ funds, investors, loading }) {
  const [view,setView]         = useState('funds');
  const [search,setSearch]     = useState('');
  const [regionSel,setReg]     = useState([]);
  const [typeSel,setType]      = useState([]);
  const [stageSel,setStage]    = useState([]);
  const [sizeSel,setSize]      = useState([]);
  const [sectorSel,setSector]  = useState([]);
  const [selected,setSelected] = useState(null);

  const sectors = [...new Set(funds.flatMap(f=>f.industries.split(',').map(s=>s.trim()).filter(Boolean)))].sort();
  const hasFilters = !!(search||regionSel.length||typeSel.length||stageSel.length||sizeSel.length||sectorSel.length);
  const clearAll = ()=>{ setSearch(''); setReg([]); setType([]); setStage([]); setSize([]); setSector([]); };

  const filteredFunds = funds.filter(f => {
    const b = fundSizeBucket(f.size);
    return (
      (regionSel.length===0 || regionSel.includes(f.region)) &&
      (typeSel.length===0   || typeSel.includes(f.type)) &&
      (stageSel.length===0  || stageSel.includes(f.stage)) &&
      (sizeSel.length===0   || sizeSel.includes(b)) &&
      (sectorSel.length===0 || sectorSel.some(s=>f.industries.toLowerCase().includes(s.toLowerCase()))) &&
      (!search || [f.name,f.thesis,f.industries,f.city,f.gp1,f.gp2].join(' ').toLowerCase().includes(search.toLowerCase()))
    );
  });

  const filteredInv = investors.filter(inv =>
    (regionSel.length===0 || regionSel.includes(inv.region)) &&
    (!search || [inv.name,inv.fund,inv.thesis,inv.city].join(' ').toLowerCase().includes(search.toLowerCase()))
  );

  const resultCount = view==='funds' ? filteredFunds.length : filteredInv.length;

  return (
    <div>
      {/* Sub-nav */}
      <div style={{borderBottom:'1px solid #d4cfc7',background:'#faf6f0',display:'flex',alignItems:'center',paddingLeft:48}}>
        {['funds','investors'].map(v=>(
          <button key={v} onClick={()=>{setView(v);setSelected(null);}} style={{
            padding:'10px 24px',background:'none',border:'none',
            borderBottom:`2px solid ${view===v?'#1a1a1a':'transparent'}`,
            cursor:'pointer',fontSize:10,letterSpacing:3,textTransform:'uppercase',
            fontFamily:'"DM Mono",monospace',color:view===v?'#1a1a1a':'#888',outline:'none',
          }}>{v}</button>
        ))}
      </div>
      {/* Filters */}
      <FilterBar
        search={search} setSearch={setSearch}
        filters={<>
          <MultiSelect label="Region" options={REGIONS} selected={regionSel} onChange={setReg} />
          {view==='funds' && <>
            <MultiSelect label="Type"   options={Object.keys(TYPE_COLORS)} selected={typeSel}   onChange={setType} />
            <MultiSelect label="Stage"  options={['Pre-Seed','Seed','Series A','Multi-Stage']} selected={stageSel} onChange={setStage} />
            <MultiSelect label="Size"   options={SIZE_BUCKETS} selected={sizeSel} onChange={setSize} />
            <MultiSelect label="Sector" options={sectors}      selected={sectorSel} onChange={setSector} />
          </>}
        </>}
        hasFilters={hasFilters} onClearAll={clearAll}
        resultCount={resultCount} loading={loading}
      />
      {/* Grid */}
      <div style={{padding:'28px 48px'}}>
        {view==='funds'
          ? <CardGrid items={filteredFunds} loading={loading}
              renderCard={f=><FundCard fund={f} onClick={setSelected} />} />
          : <CardGrid items={filteredInv} loading={loading}
              renderCard={inv=><InvestorCard inv={inv} onClick={setSelected} />}
              emptyMsg="NO INVESTORS" />
        }
      </div>
      {selected && view==='funds'     && <FundPanel     fund={selected}    onClose={()=>setSelected(null)}
        investors={investors}
        onSelectInvestor={inv=>{ setView('investors'); setSelected(inv); }} />}
      {selected && view==='investors' && <InvestorPanel inv={selected}     onClose={()=>setSelected(null)}
        funds={funds}
        onSelectFund={f=>{ setView('funds'); setSelected(f); }} />}
    </div>
  );
}

// ─── PARTNERS TAB ─────────────────────────────────────────────────────────────
function PartnersTab({ partners, loading }) {
  const [catSel,setCat]        = useState([]);
  const [regionSel,setReg]     = useState([]);
  const [search,setSearch]     = useState('');
  const [selected,setSelected] = useState(null);

  const categories = [...new Set(partners.map(p=>p.category).filter(Boolean))].sort();
  const hasFilters = !!(search||catSel.length||regionSel.length);
  const clearAll = ()=>{ setSearch(''); setCat([]); setReg([]); };

  const filtered = partners.filter(p =>
    (catSel.length===0    || catSel.includes(p.category)) &&
    (regionSel.length===0 || regionSel.includes(p.region)) &&
    (!search || [p.name,p.description,p.category,p.city,p.contact].join(' ').toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div>
      <FilterBar
        search={search} setSearch={setSearch}
        filters={<>
          <MultiSelect label="Category" options={categories} selected={catSel}    onChange={setCat} />
          <MultiSelect label="Region"   options={REGIONS}    selected={regionSel} onChange={setReg} />
        </>}
        hasFilters={hasFilters} onClearAll={clearAll}
        resultCount={filtered.length} loading={loading}
      />
      <div style={{padding:'28px 48px'}}>
        <CardGrid items={filtered} loading={loading}
          renderCard={p=><PartnerCard partner={p} onClick={setSelected} />}
          emptyMsg="NO PARTNERS" />
      </div>
      {selected && <PartnerPanel partner={selected} onClose={()=>setSelected(null)} />}
    </div>
  );
}

// ─── PULSE TAB ────────────────────────────────────────────────────────────────
function PulseTab({ events, dispatches, loading }) {
  const [regionSel,setReg]       = useState([]);
  const [expandedId,setExpanded] = useState(null);
  const today = new Date();
  today.setHours(0,0,0,0);

  const filteredEvents = events
    .filter(e => regionSel.length===0 || regionSel.includes(e.region))
    .sort((a,b) => new Date(a.date)-new Date(b.date));

  const upcoming = filteredEvents.filter(e => e.date && new Date(e.date)>=today);
  const past     = filteredEvents.filter(e => e.date && new Date(e.date)<today);

  const filteredDisp = dispatches
    .filter(d => regionSel.length===0 || regionSel.includes(d.region))
    .sort((a,b) => new Date(b.date)-new Date(a.date));

  const ensureHttp = s => s?(s.startsWith('http')?s:`https://${s}`):'';

  return (
    <div style={{display:'flex',height:'calc(100vh - 74px)',overflow:'hidden'}}>
      {/* Left: Events */}
      <div style={{width:380,flexShrink:0,borderRight:'1px solid #d4cfc7',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'14px 24px',borderBottom:'1px solid #d4cfc7',background:'#f0ebe3',
          display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:9,letterSpacing:4,textTransform:'uppercase',color:'#888'}}>EVENTS</span>
          <MultiSelect label="Region" options={REGIONS} selected={regionSel} onChange={setReg} />
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {loading ? (
            <div style={{padding:40,textAlign:'center',fontSize:11,opacity:0.35,letterSpacing:2}}>LOADING…</div>
          ) : upcoming.length===0 ? (
            <div style={{padding:40,textAlign:'center',fontSize:11,opacity:0.35,letterSpacing:2}}>NO UPCOMING EVENTS</div>
          ) : upcoming.map(e => {
            const d = new Date(e.date);
            return (
              <div key={e.id} style={{padding:'16px 24px',borderBottom:'1px solid #e8e3db'}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                  <div style={{flexShrink:0,width:44,background:'#1a1a1a',color:'#faf6f0',padding:'6px 0',textAlign:'center'}}>
                    <div style={{fontSize:18,fontFamily:'"Raleway",sans-serif',fontWeight:800,lineHeight:1}}>{d.getUTCDate()}</div>
                    <div style={{fontSize:8,letterSpacing:2,opacity:0.6}}>
                      {d.toLocaleString('en',{month:'short',timeZone:'UTC'}).toUpperCase()}
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',
                      color:REGION_COLORS[e.region]||'#888',marginBottom:3,fontWeight:500}}>{e.region}</div>
                    <div style={{fontFamily:'"Raleway",sans-serif',fontSize:14,fontWeight:700,marginBottom:3,lineHeight:1.3}}>{e.name}</div>
                    <div style={{fontSize:11,opacity:0.45,marginBottom:8}}>{e.city}</div>
                    {e.description && <div style={{fontSize:11,lineHeight:1.6,opacity:0.6,marginBottom:8}}>{e.description}</div>}
                    {e.regUrl && (
                      <a href={ensureHttp(e.regUrl)} target="_blank" rel="noopener noreferrer"
                        style={{fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#c8302a',
                          textDecoration:'none',borderBottom:'1px solid #c8302a',paddingBottom:1}}>
                        REGISTER ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Dispatches */}
      <div style={{flex:1,display:'flex',flexDirection:'column',minWidth:0}}>
        <div style={{padding:'14px 32px',borderBottom:'1px solid #d4cfc7',background:'#f0ebe3'}}>
          <span style={{fontSize:9,letterSpacing:4,textTransform:'uppercase',color:'#888'}}>DISPATCHES</span>
        </div>
        <div style={{flex:1,overflowY:'auto'}}>
          {loading ? (
            <div style={{padding:40,textAlign:'center',fontSize:11,opacity:0.35,letterSpacing:2}}>LOADING…</div>
          ) : filteredDisp.length===0 ? (
            <div style={{padding:40,textAlign:'center',fontSize:11,opacity:0.35,letterSpacing:2}}>NO DISPATCHES</div>
          ) : filteredDisp.map(d => {
            const isExp = expandedId===d.id;
            return (
              <div key={d.id} style={{borderBottom:'1px solid #e8e3db',padding:'24px 32px'}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                  <span style={{fontSize:9,letterSpacing:2,textTransform:'uppercase',
                    color:REGION_COLORS[d.region]||'#888',fontWeight:500}}>{d.region}</span>
                  {d.date && <span style={{fontSize:9,opacity:0.35}}>
                    {new Date(d.date).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'})}
                  </span>}
                </div>
                <h3 onClick={()=>setExpanded(isExp?null:d.id)}
                  style={{fontFamily:'"Raleway",sans-serif',fontSize:20,fontWeight:800,
                    margin:'0 0 12px',lineHeight:1.2,cursor:'pointer'}}>
                  {d.title}
                </h3>
                {d.body && (
                  <div style={{fontSize:13.5,lineHeight:1.8,color:'#333',
                    display:isExp?'block':'-webkit-box',
                    WebkitLineClamp:isExp?undefined:4,
                    WebkitBoxOrient:isExp?undefined:'vertical',
                    overflow:isExp?'visible':'hidden'}}>
                    {d.body}
                  </div>
                )}
                <button onClick={()=>setExpanded(isExp?null:d.id)}
                  style={{marginTop:12,background:'none',border:'none',padding:0,cursor:'pointer',
                    fontSize:10,letterSpacing:2,textTransform:'uppercase',color:'#888',outline:'none'}}>
                  {isExp?'COLLAPSE ↑':'READ MORE →'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── MAP TAB ──────────────────────────────────────────────────────────────────
function MapTab({ funds, mapPaths }) {
  const [activeRegion,setActive]   = useState(null);
  const [hovRegion,setHov]         = useState(null);
  const [selectedFund,setSelected] = useState(null);

  const regionFunds = activeRegion ? funds.filter(f=>f.region===activeRegion) : [];

  // Group state paths by region
  const regionPaths = {};
  const otherPaths  = [];
  mapPaths.forEach(({fips,d}) => {
    const r = FIPS_REGION[fips];
    if (r) { regionPaths[r] = regionPaths[r] ? regionPaths[r]+' '+d : d; }
    else   { otherPaths.push({fips,d}); }
  });

  return (
    <div style={{display:'flex',height:'calc(100vh - 74px)',overflow:'hidden'}}>
      {/* Map column */}
      <div style={{flex:1,padding:'16px 20px 12px',minWidth:0,overflow:'hidden'}}>
        <div style={{fontSize:9,letterSpacing:4,textTransform:'uppercase',color:'#888',marginBottom:10}}>
          EMERGING CAPITAL REGIONS — UNITED STATES
        </div>

        {/* SVG gets explicit calc height — bypasses all flex-chain zero-height bugs */}
        <div style={{
          height:'calc(100vh - 74px - 115px)',
          border:'1px solid #ddd8d0',
          overflow:'hidden',
          background:'#f5f0e8',
        }}>
          <svg viewBox="0 0 960 600" preserveAspectRatio="xMidYMid meet"
            style={{width:'100%',height:'100%',display:'block'}}>

            {/* Non-region states (grayed out) */}
            {otherPaths.map(({fips,d})=>(
              <path key={fips} d={d} fill="#ddd8ce" stroke="#c8c2b8" strokeWidth="0.5" strokeLinejoin="round" />
            ))}

            {/* Region fills */}
            {Object.entries(regionPaths).map(([region,d])=>{
              const color   = REGION_COLORS[region]||'#888';
              const isActive= activeRegion===region;
              const isHov   = hovRegion===region;
              return (
                <path key={region} d={d}
                  fill={color}
                  opacity={isActive?0.9:isHov?0.55:0.22}
                  stroke={isActive||isHov?color:'#c8c2b8'}
                  strokeWidth={isActive?1.2:0.5}
                  strokeLinejoin="round"
                  style={{cursor:'pointer',transition:'opacity 0.18s'}}
                  onClick={()=>setActive(isActive?null:region)}
                  onMouseEnter={()=>setHov(region)}
                  onMouseLeave={()=>setHov(null)}
                />
              );
            })}

            {/* State borders within regions */}
            {mapPaths.filter(({fips})=>FIPS_REGION[fips]).map(({fips,d})=>(
              <path key={`b-${fips}`} d={d} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.7" strokeLinejoin="round" />
            ))}

            {/* Region count bubbles + labels */}
            {Object.entries(REGION_LABEL).map(([region,[cx,cy]])=>{
              const count   = funds.filter(f=>f.region===region).length;
              const isActive= activeRegion===region;
              const isHov   = hovRegion===region;
              const color   = REGION_COLORS[region]||'#888';
              const visible = isActive||isHov||!activeRegion;
              return (
                <g key={`lbl-${region}`} style={{pointerEvents:'none',opacity:visible?1:0.25,transition:'opacity 0.18s'}}>
                  <text x={cx} y={cy-8} textAnchor="middle" fontSize="8"
                    fontFamily='"DM Mono",monospace' fontWeight="500" letterSpacing="1.5"
                    fill={isActive?'#fff':'#1a1a1a'} opacity={isActive?0.9:0.7}>
                    {region.toUpperCase()}
                  </text>
                  <circle cx={cx} cy={cy+10} r={14} fill={isActive?'#fff':color} opacity={isActive?0.95:0.9} />
                  <text x={cx} y={cy+10} textAnchor="middle" dy="0.35em" fontSize="12"
                    fontFamily='"Raleway",sans-serif' fontWeight="800"
                    fill={isActive?color:'#fff'}>
                    {count}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div style={{display:'flex',gap:14,flexWrap:'wrap',marginTop:10,flexShrink:0}}>
          {REGIONS.map(r=>(
            <div key={r} onClick={()=>setActive(activeRegion===r?null:r)}
              style={{display:'flex',alignItems:'center',gap:5,fontSize:10,cursor:'pointer',
                opacity:!activeRegion||activeRegion===r?0.75:0.25,transition:'opacity 0.15s'}}>
              <div style={{width:10,height:10,background:REGION_COLORS[r],flexShrink:0}} />
              {r}
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div style={{width:320,borderLeft:'2px solid #1a1a1a',display:'flex',
        flexDirection:'column',background:'#f0ebe3',flexShrink:0}}>
        {activeRegion ? (
          <>
            <div style={{padding:'16px 20px',borderBottom:'1px solid #d4cfc7',
              display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{width:10,height:10,background:REGION_COLORS[activeRegion],flexShrink:0}} />
                  <div style={{fontFamily:'"Raleway",sans-serif',fontSize:17,fontWeight:800}}>{activeRegion}</div>
                </div>
                <div style={{fontSize:10,opacity:0.4}}>{regionFunds.length} fund{regionFunds.length!==1?'s':''}</div>
              </div>
              <button onClick={()=>setActive(null)} style={{background:'none',border:'1px solid #bbb',
                cursor:'pointer',width:26,height:26,fontSize:14,color:'#1a1a1a',outline:'none',
                display:'flex',alignItems:'center',justifyContent:'center'}}>×</button>
            </div>
            <div style={{flex:1,overflowY:'auto'}}>
              {regionFunds.map(f=>{
                const c = TYPE_COLORS[f.type]||'#888';
                return (
                  <div key={f.id} onClick={()=>setSelected(f)}
                    style={{padding:'14px 20px',borderBottom:'1px solid #d4cfc7',cursor:'pointer'}}
                    onMouseEnter={e=>e.currentTarget.style.background='#e5dfd6'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <div style={{fontSize:9.5,letterSpacing:2,textTransform:'uppercase',color:c,marginBottom:3,fontWeight:500}}>{f.type}</div>
                    <div style={{fontFamily:'"Raleway",sans-serif',fontSize:14,fontWeight:700,marginBottom:3}}>{f.name}</div>
                    <div style={{fontSize:11,opacity:0.45,display:'flex',gap:10}}>
                      {f.city && <span>{f.city}</span>}
                      {f.stage && <span>{f.stage}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',
            justifyContent:'center',padding:40,textAlign:'center',opacity:0.35}}>
            <div style={{fontSize:36,marginBottom:14}}>◎</div>
            <div style={{fontSize:10,letterSpacing:3,textTransform:'uppercase',lineHeight:2.2}}>
              SELECT A REGION<br/>TO EXPLORE<br/>CAPITAL FLOWS
            </div>
          </div>
        )}
      </div>

      {selectedFund && <FundPanel fund={selectedFund} onClose={()=>setSelected(null)} />}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [funds,     setFunds]     = useState([]);
  const [investors, setInvestors] = useState([]);
  const [partners,  setPartners]  = useState([]);
  const [events,    setEvents]    = useState([]);
  const [dispatch,  setDispatch]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('capital');
  const [mapPaths,  setMapPaths]  = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [fr,ir,pr,er,dr] = await Promise.all([
          fetchAll(TABLES.funds),
          fetchAll(TABLES.investors),
          fetchAll(TABLES.partners),
          fetchAll(TABLES.events),
          fetchAll(TABLES.dispatch),
        ]);

        setFunds(fr.map(r=>({
          id:        r.id,
          name:      r.fields['Fund Name']||'',
          size:      r.fields['Fund Size']||'',
          vintage:   r.fields['Vintage Year']||'',
          stage:     r.fields['Stage']||'',
          thesis:    r.fields['Thesis']||'',
          industries:Array.isArray(r.fields['Industries'])?r.fields['Industries'].join(', '):(r.fields['Industries']||''),
          city:      r.fields['City']||'',
          state:     r.fields['State']||'',
          region:    r.fields['Region']||'',
          website:   r.fields['Website']||'',
          type:      r.fields['Capital Type']||'',
          email:     r.fields['Email']||'',
          linkedin:  r.fields['LinkedIn']||'',
          gp1:       r.fields['General Partner 1']||'',
          gp1li:     r.fields['General Partner 1 LinkedIn']||'',
          gp2:       r.fields['General Partner 2']||'',
          gp2li:     r.fields['General Partner 2 LinkedIn']||'',
          gp3:       r.fields['General Partner 3']||'',
          gp3li:     r.fields['General Partner 3 LinkedIn']||'',
        })).filter(f=>f.name));

        setInvestors(ir.map(r=>({
          id:        r.id,
          name:      r.fields['Name']||'',
          fund:      r.fields['Fund']||'',
          title:     r.fields['Title']||'',
          thesis:    r.fields['Personal Thesis']||'',
          portfolio: r.fields['Notable Portfolio']||'',
          linkedin:  r.fields['LinkedIn']||'',
          email:     r.fields['Email']||'',
          region:    r.fields['Region']||'',
          city:      r.fields['City']||'',
        })).filter(i=>i.name));

        setPartners(pr.map(r=>({
          id:          r.id,
          name:        r.fields['Name']||'',
          category:    r.fields['Category']||'',
          region:      r.fields['Region']||'',
          city:        r.fields['City']||'',
          description: r.fields['Description']||'',
          contact:     r.fields['Key Contact']||'',
          website:     r.fields['Website']||'',
          linkedin:    r.fields['LinkedIn']||'',
          email:       r.fields['Email']||'',
        })).filter(p=>p.name));

        setEvents(er.map(r=>({
          id:          r.id,
          name:        r.fields['Name']||'',
          date:        r.fields['Date']||'',
          city:        r.fields['City']||'',
          region:      r.fields['Region']||'',
          description: r.fields['Description']||'',
          regUrl:      r.fields['Registration URL']||'',
        })).filter(e=>e.name));

        setDispatch(dr.map(r=>({
          id:     r.id,
          title:  r.fields['Title']||'',
          date:   r.fields['Date']||'',
          region: r.fields['Region']||'',
          slug:   r.fields['Slug']||'',
          body:   r.fields['Body']||'',
        })).filter(d=>d.title));

        setLoading(false);
      } catch(e) { console.error(e); setLoading(false); }
    };
    load();
  },[]);

  useEffect(()=>{
    fetch('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
      .then(r=>r.json()).then(t=>setMapPaths(decodeTopojson(t))).catch(console.error);
  },[]);

  const stats = [
    ['FUNDS',     funds.length],
    ['INVESTORS', investors.length],
    ['PARTNERS',  partners.length],
    ['REGIONS',   [...new Set(funds.map(f=>f.region).filter(Boolean))].length],
  ];

  return (
    <div style={{minHeight:'100vh',background:'#faf6f0',fontFamily:'"DM Mono",monospace',color:'#1a1a1a'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Raleway:wght@600;700;800&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:#faf6f0; }
        ::-webkit-scrollbar-thumb { background:#1a1a1a; }
        input::placeholder { opacity:0.38; }
        button:focus { outline:none; }
        button:active { -webkit-tap-highlight-color: transparent; }
        a { text-decoration:none; }
      `}</style>

      {/* ── Header ── */}
      <header style={{borderBottom:'2px solid #1a1a1a',background:'#faf6f0',
        display:'flex',alignItems:'stretch',height:74}}>

        {/* Logo */}
        <div onClick={()=>setTab('capital')}
          style={{padding:'0 40px',display:'flex',flexDirection:'column',justifyContent:'center',
            borderRight:'1px solid #1a1a1a',minWidth:260,cursor:'pointer',userSelect:'none'}}>
          <div style={{fontSize:10,letterSpacing:4,textTransform:'uppercase',color:'#c8302a',marginBottom:5,fontWeight:600}}>
            EMERGING CAPITAL ///
          </div>
          <h1 style={{margin:0,fontSize:22,fontFamily:'"Raleway",sans-serif',fontWeight:800,letterSpacing:-0.5,lineHeight:1}}>
            US Capital Directory
          </h1>
        </div>

        {/* Stats ticker */}
        <div style={{flex:1,padding:'0 32px',display:'flex',alignItems:'center',gap:32,borderRight:'1px solid #1a1a1a'}}>
          <div>
            <div style={{fontSize:8.5,letterSpacing:2,color:'#999',marginBottom:3}}>STATUS</div>
            <div style={{fontSize:11,display:'flex',alignItems:'center',gap:7}}>
              <span style={{width:7,height:7,borderRadius:'50%',flexShrink:0,
                background:loading?'#f59e0b':'#22c55e',
                boxShadow:loading?'none':'0 0 6px #22c55e'}} />
              {loading?'Fetching…':'Live'}
            </div>
          </div>
          {!loading && stats.map(([l,v])=>(
            <div key={l}>
              <div style={{fontSize:8.5,letterSpacing:2,color:'#999',marginBottom:3}}>{l}</div>
              <div style={{fontSize:20,fontFamily:'"Raleway",sans-serif',fontWeight:800,lineHeight:1}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Nav tabs */}
        <nav style={{display:'flex',alignItems:'stretch'}}>
          {[['capital','CAPITAL'],['partners','PARTNERS'],['pulse','PULSE'],['map','MAP']].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'0 26px',
              background:tab===t?'#1a1a1a':'transparent',
              color:tab===t?'#faf6f0':'#1a1a1a',
              border:'none',borderLeft:'1px solid #1a1a1a',
              cursor:'pointer',fontSize:10,letterSpacing:3,
              fontFamily:'"DM Mono",monospace',transition:'all 0.12s',fontWeight:500,outline:'none',
            }}>{l}</button>
          ))}
        </nav>
      </header>

      {tab==='capital'  && <CapitalTab  funds={funds} investors={investors} loading={loading} />}
      {tab==='partners' && <PartnersTab partners={partners} loading={loading} />}
      {tab==='pulse'    && <PulseTab    events={events} dispatches={dispatch} loading={loading} />}
      {tab==='map'      && <MapTab      funds={funds} mapPaths={mapPaths} />}

      {/* ── Footer ── */}
      <footer style={{borderTop:'2px solid #1a1a1a',background:'#1a1a1a',color:'#faf6f0',fontFamily:'"DM Mono",monospace'}}>
        {/* About strip */}
        <div style={{borderBottom:'1px solid rgba(255,255,255,0.1)',padding:'48px 64px',
          display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:48}}>

          {/* Mission */}
          <div>
            <div style={{fontSize:8,letterSpacing:5,textTransform:'uppercase',color:'#c8302a',marginBottom:12,fontWeight:600}}>
              EMERGING CAPITAL ///
            </div>
            <h2 style={{fontFamily:'"Raleway",sans-serif',fontSize:22,fontWeight:800,
              margin:'0 0 16px',lineHeight:1.15,letterSpacing:-0.5}}>
              The directory for capital outside the coasts.
            </h2>
            <p style={{fontSize:12,lineHeight:1.85,opacity:0.55,margin:0}}>
              Emerging Capital is a curated intelligence layer for the startup ecosystems that don't make TechCrunch. We track the funds, investors, and ecosystem partners building the next generation of companies in the Gulf South, Southeast, Texas, Mountain West, and beyond.
            </p>
          </div>

          {/* What we are */}
          <div>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#888',marginBottom:16}}>WHAT WE ARE</div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {[
                ['CAPITAL','A curated directory of venture funds, accelerators, family offices, and economic development organizations across emerging US markets.'],
                ['INVESTORS','Individual GP and partner profiles linking people to funds — because capital flows through relationships, not spreadsheets.'],
                ['PARTNERS','Vetted ecosystem services for founders: the lawyers, CFOs, brand studios, and community builders who actually understand startups.'],
                ['PULSE','Upcoming events and editorial dispatches on what\'s happening across the regions we cover.'],
              ].map(([label,desc])=>(
                <div key={label}>
                  <div style={{fontSize:9,letterSpacing:2,fontWeight:600,color:'#c8302a',marginBottom:4}}>{label}</div>
                  <div style={{fontSize:11,lineHeight:1.7,opacity:0.5}}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links + stats */}
          <div>
            <div style={{fontSize:9,letterSpacing:3,textTransform:'uppercase',color:'#888',marginBottom:16}}>NAVIGATE</div>
            <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:32}}>
              {[['CAPITAL',()=>setTab('capital')],['PARTNERS',()=>setTab('partners')],['PULSE',()=>setTab('pulse')],['MAP',()=>setTab('map')]].map(([l,fn])=>(
                <button key={l} onClick={fn} style={{background:'none',border:'none',padding:0,
                  cursor:'pointer',fontSize:11,letterSpacing:2,textTransform:'uppercase',
                  color:'#faf6f0',opacity:0.6,textAlign:'left',fontFamily:'"DM Mono",monospace',
                  outline:'none'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='1'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='0.6'}>
                  → {l}
                </button>
              ))}
            </div>
            {!loading && (
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {[['FUNDS',funds.length],['INVESTORS',investors.length],['PARTNERS',partners.length],['REGIONS',[...new Set(funds.map(f=>f.region).filter(Boolean))].length]].map(([l,v])=>(
                  <div key={l}>
                    <div style={{fontSize:8,letterSpacing:2,color:'#666',marginBottom:3}}>{l}</div>
                    <div style={{fontSize:24,fontFamily:'"Raleway",sans-serif',fontWeight:800,lineHeight:1}}>{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{padding:'16px 64px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:10,opacity:0.3}}>
            © {new Date().getFullYear()} Emerging Capital. Curated, not scraped.
          </div>
          <div style={{fontSize:10,opacity:0.3,letterSpacing:1}}>
            emerging.network
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}
