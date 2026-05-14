import { useState, useEffect, useRef, createContext, useContext } from "react";
import Dashboard        from "./Dashboard";
import Clients          from "./Clients";
import Invoices         from "./Invoices";
import Bank             from "./Bank";
import Reports          from "./Reports";
import ChartOfAccounts  from "./ChartOfAccounts";
import Suppliers        from "./Suppliers";
import SupplierInvoices from "./SupplierInvoices";
import LoginPage        from "./Login";
import Settings from "./Settings";
import { LogoMark, LogoFull } from "./Logo";
import OAuth2Callback   from "./OAuth2Callback";
import AnimatedLogo from "./animations/AnimatedLogo.jsx";
import AnimatedLogoOutline, {ParticleButton} from "./animations/AnimatedLogoOutline";
import JurnalContabil from "./Journal.jsx";

export const ThemeContext = createContext(null);
export function useTheme() { return useContext(ThemeContext); }

export const THEMES = {
  dark: {
    bg:"#0b0e14", navbar:"#0d1018", card:"#131720", cardAlt:"#0f1320",
    border:"#1a2035", border2:"#222a3d", text:"#cdd5e0", textMid:"#5a6480",
    textDim:"#2e3855", accent:"#a78bfa", blue:"#7b9cba", green:"#7aab8a",
    red:"#b07a7a", amber:"#b09a6a", navActive:"#161c2e", navText:"#44506e",
    inputBg:"#0b0e14", isDark:true,
  },
  light: {
    bg:"#f0f3fa", navbar:"#ffffff", card:"#ffffff", cardAlt:"#f5f7fd",
    border:"#e1e7f5", border2:"#c8d3ec", text:"#0d1426", textMid:"#526080",
    textDim:"#96a3be", accent:"#7c3aed", blue:"#3b7cb5", green:"#2d7a56",
    red:"#a03030", amber:"#92600a", navActive:"#f0ecff", navText:"#8a99b8",
    inputBg:"#f8fafc", isDark:false,
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function NavSvgIcon({ src, s = 22 }) {
  const T = useTheme();
  const filter = T?.isDark ? "invert(1)" : "none";
  return <img src={src} width={s} height={s} style={{ opacity:0.65, filter }}/>;
}
const BuildingIcon = ({ s=22 }) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4" stroke="currentColor" strokeWidth="1.2"/><path d="M6 9h4M6 12h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>;
const DataIcon        = ({ s = 22 }) => <NavSvgIcon src="/NavBarIcons/data.svg"         s={s}/>;
const PeopleIcon      = ({ s = 22 }) => <NavSvgIcon src="/NavBarIcons/people.svg"       s={s}/>;
const TransactionIcon = ({ s = 22 }) => <NavSvgIcon src="/NavBarIcons/transactions.svg" s={s}/>;
const DashboardIcon   = ({ s = 22 }) => <NavSvgIcon src="/NavBarIcons/dashboard.svg"    s={s}/>;
const ClientsIcon  = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="8" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 17c0-3.314 3.134-5 7-5s7 1.686 7 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M15 8c1.657 0 3 1.343 3 3s-1.343 1.5-3 1.5M17 17c0-2-.9-3.5-2-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const InvoicesIcon = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const BankIcon     = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M2 8l8-5 8 5H2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M5 8v7M8 8v7M12 8v7M15 8v7" stroke="currentColor" strokeWidth="1.4"/><path d="M2 15h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const ReportsIcon  = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 16V11M7 16V7M10 16V9M13 16V4M16 16V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const AccountsIcon = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 9h16" stroke="currentColor" strokeWidth="1.4"/><path d="M7 9v7M7 4v5" stroke="currentColor" strokeWidth="1.4"/></svg>;
const UsersIcon    = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M1 16c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M14 11c2.2.5 4 2.2 4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const TaxIcon      = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 16L16 4M6.5 6a2 2 0 100-4 2 2 0 000 4zM13.5 18a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const JurnalIcon   = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 6h6M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M13 11.5l1.5 1.5 2-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ChevronIcon  = ({ open }) => <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ transition:"transform 0.2s", transform:open?"rotate(180deg)":"rotate(0deg)", flexShrink:0 }}><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const MoonIcon     = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13 10.5A5.5 5.5 0 016.5 4a5.5 5.5 0 106.5 6.5z" fill="currentColor"/></svg>;
const SunIcon      = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M11 3.5l-1.5 1.5M4.5 11L3 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const LogoutIcon   = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ArrowIcon    = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_MAIN = [
  { key:"dashboard", label:"Dashboard", Icon: DashboardIcon },
  { key:"reports", label:"Rapoarte",Icon: DataIcon},
  {
    group:"parteneri", label:"Fisiere", Icon: PeopleIcon,
    items:[
      { key:"clients",   label:"Clienți" },
      { key:"suppliers", label:"Furnizori"  },
      { key:"accounts",  label:"Plan de conturi" },
    ],
  },
  {
    group:"tranzactii", label:"Tranzacții", Icon: TransactionIcon,
    items:[
      { key:"invoices", label:"Facturi emise"},
      { key:"supinv",   label:"Facturi primite" },
      { key:"bank",     label:"Bancă"    },
      { key:"jurnal-contabil", label:"Articole contabile" },

    ],
  },

];

const NAV_ADMIN = [
  { key:"settings", label:"Societăți", Icon: BuildingIcon },
  { key:"users",    label:"Utilizatori", Icon: UsersIcon },
  { key:"taxrates", label:"Cote TVA",    Icon: TaxIcon   },
];

// ─── Typed text animation ─────────────────────────────────────────────────────
function TypedText({ words, color, speed = 90, pause = 1600 }) {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const word = words[wordIdx]; let timeout;
    if (!deleting && charIdx < word.length)        timeout = setTimeout(() => setCharIdx(c=>c+1), speed);
    else if (!deleting && charIdx === word.length) timeout = setTimeout(() => setDeleting(true), pause);
    else if (deleting && charIdx > 0)              timeout = setTimeout(() => setCharIdx(c=>c-1), speed/2);
    else if (deleting && charIdx === 0)            { setDeleting(false); setWordIdx(i=>(i+1)%words.length); }
    setDisplayed(word.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return <span style={{ color, borderRight:`2px solid ${color}`, paddingRight:3, animation:"blink 0.9s step-end infinite" }}>{displayed}</span>;
}

function SectionLabel({ mini, title, accentColor, visible=true }) {
  return (
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:10, opacity:visible?1:0, transform:visible?"none":"translateY(16px)", transition:"all 0.5s ease" }}>{mini}</p>
        <div style={{ position:"relative", display:"inline-block", marginBottom:32 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", paddingBottom:10, opacity:visible?1:0, transform:visible?"none":"translateY(20px)", transition:"all 0.6s ease 0.1s" }}>{title}</h2>
          <span style={{ position:"absolute", left:0, bottom:0, height:4, borderRadius:99, background:accentColor, width:visible?100:0, transition:"width 0.8s ease 0.4s", display:"block" }}/>
        </div>
      </div>
  );
}

function useScrollReveal(threshold=0.18) {
  const ref = useRef(null); const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e])=>setVis(e.isIntersecting),{threshold});
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

function AbstractShapes({ T }) {
  const d=T.isDark;
  const sq1=d?"rgba(167,139,250,0.09)":"rgba(109,68,220,0.14)"; const sq2=d?"rgba(123,156,186,0.07)":"rgba(59,124,181,0.13)"; const sq3=d?"rgba(167,139,250,0.06)":"rgba(109,68,220,0.10)"; const fill=d?"rgba(167,139,250,0.05)":"rgba(109,68,220,0.08)"; const cr1=d?"rgba(122,171,138,0.07)":"rgba(45,122,86,0.12)"; const cr2=d?"rgba(176,154,106,0.07)":"rgba(146,96,10,0.11)"; const dot=d?"rgba(167,139,250,0.20)":"rgba(109,68,220,0.22)"; const bw=d?1.5:2;
  return (
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-12%", right:"-8%", width:520, height:520, border:`${bw}px solid ${sq1}`, borderRadius:60, transform:"rotate(18deg)", animation:"shapeFloat1 18s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", top:"3%", right:"2%", width:300, height:300, border:`${bw}px solid ${sq2}`, borderRadius:36, transform:"rotate(35deg)", animation:"shapeFloat2 22s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", top:"18%", right:"12%", width:80, height:80, background:fill, border:`${bw}px solid ${sq3}`, borderRadius:16, transform:"rotate(22deg)", animation:"shapeFloat3 14s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", bottom:"-15%", left:"-10%", width:560, height:560, border:`${bw}px solid ${cr1}`, borderRadius:"50%", animation:"shapeFloat2 20s ease-in-out infinite reverse" }}/>
        <div style={{ position:"absolute", bottom:"5%", left:"5%", width:220, height:220, border:`${bw}px solid ${cr2}`, borderRadius:"50%", animation:"shapeFloat1 16s ease-in-out infinite reverse" }}/>
        <div style={{ position:"absolute", top:"42%", left:"48%", width:180, height:180, border:`${bw}px solid ${sq3}`, borderRadius:24, transform:"rotate(45deg)", animation:"shapeFloat3 25s ease-in-out infinite" }}/>
        {[...Array(16)].map((_,i)=>(<div key={i} style={{ position:"absolute", top:`${8+Math.floor(i/4)*3.8}%`, left:`${3+(i%4)*2.4}%`, width:d?3:4, height:d?3:4, borderRadius:"50%", background:dot }}/>))}
      </div>
  );
}

function MiniPreview({ f, T }) {
  const row=(l,v)=>(<div key={l} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}><span style={{ fontSize:11, color:T.textDim }}>{l}</span><span style={{ fontSize:12, fontWeight:500, color:T.text }}>{v}</span></div>);
  const pill=(l,c)=>(<span key={l} style={{ fontSize:10, fontWeight:600, color:c, background:`${c}18`, padding:"3px 8px", borderRadius:99 }}>{l}</span>);
  const sf=(items)=>(<div style={{ display:"flex", flexDirection:"column", gap:2 }}>{items.map(({label,sub,color,active},i,arr)=>(<div key={label}><div style={{ display:"flex", alignItems:"flex-start", gap:10 }}><div style={{ marginTop:4, width:7, height:7, borderRadius:"50%", background:color, flexShrink:0, boxShadow:active?`0 0 0 3px ${color}22`:"none" }}/><div><span style={{ fontSize:12, fontWeight:active?600:400, color:active?T.text:T.textMid }}>{label}</span>{sub&&<span style={{ fontSize:10, color:T.textDim, display:"block" }}>{sub}</span>}</div></div>{i<arr.length-1&&<div style={{ width:1, height:10, background:T.border, marginLeft:3, marginTop:1, marginBottom:1 }}/>}</div>))}</div>);
  const lbl=(t)=>(<p style={{ fontSize:10, fontWeight:700, color:T.textDim, textTransform:"uppercase", letterSpacing:"1.5px", margin:"0 0 10px" }}>{t}</p>);
  const previews={
    "Facturare inteligentă":(<div style={{ display:"flex", flexDirection:"column", gap:12 }}>{lbl("Flux status")}{sf([{label:"Ciornă",sub:"Netrimisă",color:"#6b7280"},{label:"Trimisă",sub:"DR 4111 / CR 701 + 4427",color:"#7b9cba",active:true},{label:"Achitată",sub:"Plată primită",color:"#7aab8a"},{label:"Restantă",sub:"Depășit scadența",color:"#b07a7a"},{label:"Anulată",sub:"Anulată, fără efect contabil",color:"#9ca3af"}])}</div>),
    "Reconciliere bancară":(<div style={{ display:"flex", flexDirection:"column", gap:8 }}>{lbl("Tipuri operațiuni")}{[{label:"Client Receipt",formula:"5121 = 4111",color:"#7aab8a"},{label:"Supplier Payment",formula:"401 = 5121",color:"#b07a7a"},{label:"Bank Commission",formula:"627 = 5121",color:"#7b9cba"},{label:"Interest Income",formula:"5121 = 766",color:"#7aab8a"}].map(({label:l,formula,color})=>(<div key={l} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:7, background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}` }}><span style={{ fontSize:11, color:T.text }}>{l}</span><span style={{ fontSize:10, fontFamily:"monospace", color }}>{formula}</span></div>))}</div>),
    "Rapoarte financiare":(<div style={{ display:"flex", flexDirection:"column", gap:8 }}>{lbl("Tipuri rapoarte")}{[{name:"Profit și Pierdere",detail:"Venituri − Cheltuieli",sym:"↗"},{name:"Bilanț contabil",detail:"Active = Datorii + Capital propriu",sym:"⊟"},{name:"Flux de numerar",detail:"Mișcări active curente",sym:"⇄"}].map(({name,detail,sym})=>(<div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:7, background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}` }}><span style={{ fontSize:14, color:T.textMid, width:18, textAlign:"center", flexShrink:0 }}>{sym}</span><div><p style={{ fontSize:12, fontWeight:600, color:T.text, margin:0 }}>{name}</p><p style={{ fontSize:10, color:T.textDim, margin:0 }}>{detail}</p></div></div>))}<p style={{ fontSize:10, color:T.textDim, marginTop:4 }}>All derived from journal lines. No separate logic.</p></div>),
    "Plan de conturi":(<div style={{ display:"flex", flexDirection:"column", gap:5 }}>{lbl("Account Types (Romanian Plan)")}{[{code:"1xxx",name:"Activ",color:"#7b9cba"},{code:"2xxx",name:"Pasiv",color:"#b07a7a"},{code:"3xxx",name:"Capital propriu",color:"#9b8fba"},{code:"7xx",name:"Venituri",color:"#7aab8a"},{code:"6xx",name:"Cheltuieli",color:"#b09a6a"}].map(({code,name,color})=>(<div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px", borderRadius:6, background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}` }}><span style={{ fontSize:10, fontFamily:"monospace", color:T.textDim, width:32, flexShrink:0 }}>{code}</span><span style={{ fontSize:12, color:T.text, flex:1 }}>{name}</span><div style={{ width:7, height:7, borderRadius:"50%", background:color }}/></div>))}<p style={{ fontSize:10, color:T.textDim, marginTop:4 }}>Self-referencing parent/child hierarchy.</p></div>),
    "Client Management":(<div style={{ display:"flex", flexDirection:"column", gap:0 }}>{lbl("Fișă client")}{[{field:"Nume",val:"Acme SRL"},{field:"CIF",val:"RO12345678"},{field:"Email",val:"office@acme.ro"},{field:"Telefon",val:"+40 721 000 001"},{field:"Adresă",val:"București, Sector 1"}].map(({field,val})=>row(field,val))}<div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:10 }}>{[["Active","#7aab8a"],["Soft Delete","#6b7280"],["Debounced Search","#7b9cba"]].map(([t,c])=>pill(t,c))}</div></div>),
  };
  return previews[f.title]||null;
}

function FeaturesSection({ featRef, featVis, slide, T, features }) {
  const [active, setActive] = useState(0); const f=features[active];
  return (
      <section id="features" ref={featRef} style={{ maxWidth:1100, margin:"0 auto 120px", padding:"0 48px", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}><SectionLabel mini="Everything You Need" title="Choose a module" accentColor={T.accent} visible={featVis}/></div>
          <p style={{ ...slide(featVis,"translateY(16px)"), transitionDelay:"0.2s", fontSize:15, color:T.textMid, maxWidth:480, margin:"0 auto" }}>Every module runs on the same double-entry engine — journal lines power every number you see.</p>
        </div>
        <div style={{ ...slide(featVis,"translateY(16px)"), transitionDelay:"0.1s", display:"flex", justifyContent:"center", gap:0, marginBottom:40, borderBottom:`1px solid ${T.border}` }}>
          {features.map(({title},i)=>{ const ia=active===i; return(<button key={title} onClick={()=>setActive(i)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:ia?600:400, color:ia?T.text:T.textMid, padding:"12px 20px", borderBottom:`2px solid ${ia?T.text:"transparent"}`, marginBottom:"-1px", transition:"all 0.2s", whiteSpace:"nowrap" }}>{title.split(" ")[0]}</button>); })}
        </div>
        <div style={{ ...slide(featVis,"translateY(32px)"), transitionDelay:"0.12s", display:"grid", gridTemplateColumns:"2fr 1fr", gap:0, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ background:T.isDark?T.card:"#fff", padding:"52px 48px", borderRight:`1px solid ${T.border}` }}>
            <h3 style={{ fontSize:32, fontWeight:800, color:T.text, letterSpacing:"-1px", marginBottom:24, lineHeight:1.1 }}>{f.title}</h3>
            <p style={{ fontSize:15, color:T.textMid, lineHeight:1.85, marginBottom:36, maxWidth:460 }}>{f.desc}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12, borderTop:`1px solid ${T.border}`, paddingTop:28 }}>{f.bullets.map((b,i)=>(<p key={i} style={{ fontSize:14, color:T.textMid, margin:0, lineHeight:1.5 }}>{b}</p>))}</div>
          </div>
          <div style={{ background:T.isDark?T.card:"#fff", padding:"52px 32px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
            <MiniPreview f={f} T={T}/>
            <div style={{ display:"flex", gap:6, paddingTop:24 }}>{features.map((_,i)=>(<button key={i} onClick={()=>setActive(i)} style={{ width:active===i?20:6, height:6, borderRadius:3, background:active===i?T.text:T.border2, border:"none", cursor:"pointer", padding:0, transition:"all 0.3s ease" }}/>))}</div>
          </div>
        </div>
      </section>
  );
}

function Landing({ onEnter, T, themeName, onToggleTheme }) {
  const [visible, setVisible] = useState(false); const [sticky, setSticky] = useState(false);
  const [featRef,featVis]=useScrollReveal(0.12); const [previewRef,previewVis]=useScrollReveal(0.12);
  const [contactRef,contactVis]=useScrollReveal(0.15); const [ctaRef,ctaVis]=useScrollReveal(0.2);
  useEffect(()=>{const t=setTimeout(()=>setVisible(true),80);return()=>clearTimeout(t);},[]);
  useEffect(()=>{const s=()=>setSticky(window.scrollY>50);window.addEventListener("scroll",s,{passive:true});return()=>window.removeEventListener("scroll",s);},[]);
  const features=[
    {Icon:InvoicesIcon,title:"Facturare inteligentă",desc:"Generate professional invoices with auto-incremented reference numbers. The moment you mark an invoice as Sent, the system posts the journal entry automatically — no manual bookkeeping required.",bullets:["Auto-incremented references (INV-2026-00001)","VAT calculated with configurable tax rates","On SENT: posts DR 4111 / CR 701 + 4427","Statuses: Draft → Sent → Paid / Overdue / Void"]},
    {Icon:BankIcon,title:"Reconciliere bancară",desc:"Import your bank CSV and let the engine auto-match transactions against existing journal lines by amount and date. Manual matching for anything left over.",bullets:["CSV import from any Romanian bank format","Auto-match by amount + date proximity","Six operation types with predefined formulas","Goal: zero unmatched transactions at month-end"]},
    {Icon:ReportsIcon,title:"Rapoarte financiare",desc:"Profit & Loss, Balance Sheet, and Cash Flow — generated in real time from journal line aggregation. Every figure traces back to a journal entry.",bullets:["P&L for any custom date range","Balance Sheet cumulative to any date","Cash Flow from current asset movements","Dashboard KPIs refreshed on every page load"]},
    {Icon:AccountsIcon,title:"Plan de conturi",desc:"A hierarchical account structure built on the Romanian accounting plan. Every transaction must map to an account — this is what keeps all reports consistent.",bullets:["Self-referencing parent/child hierarchy","Types: Asset, Liability, Equity, Revenue, Expense","Codes following the Romanian plan (6xx, 7xx…)","Single source of truth for all reports"]},
    {Icon:ClientsIcon,title:"Client Management",desc:"A lightweight CRM purpose-built for accounting. Every invoice is tied to a client, so you always have a full financial picture per customer.",bullets:["Soft delete — data is never lost, only deactivated","Debounced real-time search by name or CIF","Fields: name, email, phone, address, tax ID","One-click access to all invoices for a client"]},
  ];
  const slide=(vis,from)=>({opacity:vis?1:0,transform:vis?"none":from,transition:"opacity 0.65s ease, transform 0.65s ease"});
  return (
      <div id="top" style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Outfit',sans-serif", color:T.text, overflowX:"hidden", position:"relative" }}>
        <AbstractShapes T={T}/>
        <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:sticky?"0 48px":"20px 48px 32px", height:sticky?64:"auto", background:sticky?(T.isDark?"rgba(11,14,20,0.96)":"rgba(255,255,255,0.97)"):"transparent", backdropFilter:sticky?"blur(18px)":"none", borderBottom:sticky?`1px solid ${T.border}`:"none", boxShadow:sticky?"0 2px 20px rgba(0,0,0,0.12)":"none", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"all 0.45s ease" }}>
          <LogoFull size={30}/>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>{[{label:"Home",href:"#top"},{label:"Funcționalități",href:"#features"},{label:"Contact",href:"#contact"}].map(({label,href})=>(<a key={label} href={href} onClick={e=>{e.preventDefault();document.querySelector(href==="#top"?"#top":href)?.scrollIntoView({behavior:"smooth"});}} style={{ padding:"8px 16px", fontSize:14, fontWeight:500, color:T.textMid, textDecoration:"none", borderRadius:8, transition:"color 0.2s", fontFamily:"'Outfit',sans-serif" }} onMouseEnter={e=>e.target.style.color=T.text} onMouseLeave={e=>e.target.style.color=T.textMid}>{label}</a>))}</div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onToggleTheme} style={{ background:"none", border:`1px solid ${sticky?T.border:T.border2}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", color:T.textMid, display:"flex", alignItems:"center", gap:6, fontSize:12, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.3s" }}>{T.isDark?<SunIcon/>:<MoonIcon/>}<span>{T.isDark?"Luminos":"Întunecat"}</span></button>
            <button onClick={onEnter} style={{ background:T.accent, border:"none", borderRadius:10, padding:"9px 22px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Sign In →</button>
          </div>
        </nav>
        <section style={{ maxWidth:1100, margin:"0 auto", padding:"140px 48px 80px", textAlign:"center", position:"relative", zIndex:1 }}>
          <h1 key={themeName} style={{ opacity:visible?1:0, transform:visible?"none":"translateY(28px)", transition:"all 0.65s ease 0.1s", fontSize:"clamp(38px,6vw,70px)", fontWeight:800, letterSpacing:"-2.5px", lineHeight:1.1, maxWidth:820, margin:"0 auto 22px" }}>Manage your{" "}<TypedText words={["Facturi","Cheltuieli","Rapoarte","Bilanțuri","Flux numerar"]} color={T.accent}/><br/><span style={{ fontSize:"clamp(26px,4vw,46px)", fontWeight:600, color:T.textMid }}>with intelligence.</span></h1>
          <p style={{ opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:"all 0.65s ease 0.2s", fontSize:17, color:T.textMid, maxWidth:560, margin:"0 auto 44px", lineHeight:1.75 }}>A full double-entry accounting platform built for Romanian businesses — with real-time reports, automated journal entries, and an AI layer that learns your transactions.</p>
          <div style={{ opacity:visible?1:0, transform:visible?"none":"translateY(20px)", transition:"all 0.65s ease 0.3s", display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={onEnter} style={{ display:"flex", alignItems:"center", gap:8, background:T.accent, border:"none", borderRadius:12, padding:"14px 32px", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Get Started <ArrowIcon/></button>
            <button onClick={()=>document.getElementById("features")?.scrollIntoView({behavior:"smooth"})} style={{ background:"none", border:`1px solid ${T.border2}`, borderRadius:12, padding:"14px 28px", color:T.textMid, fontSize:15, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Explore Features</button>
          </div>
          <div style={{ opacity:visible?1:0, transition:"all 0.8s ease 0.5s", display:"flex", gap:56, justifyContent:"center", marginTop:68, flexWrap:"wrap" }}>
            {[["100%","Double-Entry Accurate"],["În timp real","Rapoarte financiare"],["AI-Powered","Transaction Analysis"]].map(([n,l])=>(<div key={l} style={{ textAlign:"center" }}><div style={{ fontSize:22, fontWeight:700, color:T.text }}>{n}</div><div style={{ fontSize:12, color:T.textMid, marginTop:4 }}>{l}</div></div>))}
          </div>
        </section>
        <section ref={previewRef} style={{ maxWidth:1100, margin:"0 auto 110px", padding:"0 48px", position:"relative", zIndex:1 }}>
          <div style={{ ...slide(previewVis,"translateY(60px)"), background:T.isDark?"#131720":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:24, boxShadow:T.isDark?"0 32px 72px rgba(0,0,0,0.55)":"0 32px 72px rgba(0,0,0,0.09)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${T.border}` }}><div style={{ width:10, height:10, borderRadius:"50%", background:"#b07a7a" }}/><div style={{ width:10, height:10, borderRadius:"50%", background:"#b09a6a" }}/><div style={{ width:10, height:10, borderRadius:"50%", background:"#7aab8a" }}/><div style={{ flex:1, background:T.isDark?"#0b0e14":"#f0f3fa", borderRadius:6, height:24, marginLeft:8, display:"flex", alignItems:"center", paddingLeft:12 }}><span style={{ fontSize:11, color:T.textMid }}>accountbud.app/dashboard</span></div></div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>{[{label:"VENITURI TOTALE",val:"RON 10,900",color:"#7b9cba"},{label:"CHELTUIELI TOTALE",val:"RON 4,684",color:"#b07a7a"},{label:"PROFIT NET",val:"RON 6,216",color:"#7aab8a"},{label:"NEÎNCASAT",val:"RON 605",color:"#b09a6a"}].map(({label,val,color})=>(<div key={label} style={{ background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 18px" }}><div style={{ width:24, height:3, background:color, borderRadius:99, marginBottom:12 }}/><div style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:4 }}>{val}</div><div style={{ fontSize:10, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.8px" }}>{label}</div></div>))}</div>
            <div style={{ background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 20px" }}><div style={{ display:"flex", alignItems:"flex-end", gap:4, height:80, marginTop:12, paddingTop:8 }}>{[[0,0],[0,0],[0,0],[0,0],[100,43],[0,0],[0,0],[0,0],[0,0],[5,0],[0,0],[0,0]].map(([r,e],i)=>(<div key={i} style={{ flex:1, display:"flex", gap:2, alignItems:"flex-end", height:"100%" }}><div style={{ flex:1, height:`${r}%`, background:"#7b9cba", borderRadius:"2px 2px 0 0", minHeight:r>0?4:0 }}/><div style={{ flex:1, height:`${e}%`, background:"#b07a7a", borderRadius:"2px 2px 0 0", minHeight:e>0?4:0 }}/></div>))}</div></div>
          </div>
        </section>
        <FeaturesSection featRef={featRef} featVis={featVis} slide={slide} T={T} features={features}/>
        <section id="contact" ref={contactRef} style={{ maxWidth:1100, margin:"0 auto 120px", padding:"0 48px", position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
            <div style={{ ...slide(contactVis,"translateX(-60px)") }}>
              <SectionLabel mini="Ia legătura" title="Contactează-ne" accentColor={T.accent} visible={contactVis}/>
              <p style={{ fontSize:14, color:T.textMid, marginBottom:32, lineHeight:1.7 }}>Have a question about AccountBud? Fill in the form and we'll get back to you.</p>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>{["Your Name","Your Email"].map(ph=>(<input key={ph} placeholder={ph} style={{ background:T.inputBg, border:`1px solid ${T.border2}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none" }}/>))}</div>
                <input placeholder="Subiect" style={{ background:T.inputBg, border:`1px solid ${T.border2}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none" }}/>
                <textarea placeholder="Mesajul tău..." rows={5} style={{ background:T.inputBg, border:`1px solid ${T.border2}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical" }}/>
                <button style={{ alignSelf:"flex-start", background:T.accent, border:"none", borderRadius:10, padding:"12px 28px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Send Message</button>
              </div>
            </div>
            <div style={{ ...slide(contactVis,"translateX(60px)"), display:"flex", alignItems:"center", justifyContent:"center" }}><img src="/about.svg" alt="Team illustration" style={{ width:"100%", maxWidth:480, height:"auto", opacity:T.isDark?0.88:1 }}/></div>
          </div>
        </section>
        <section ref={ctaRef} style={{ maxWidth:700, margin:"0 auto 120px", padding:"0 48px", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ ...slide(ctaVis,"translateY(40px)"), background:T.isDark?"linear-gradient(135deg,rgba(124,92,252,0.12),rgba(123,156,186,0.08))":"linear-gradient(135deg,rgba(124,92,252,0.07),rgba(123,156,186,0.05))", border:`1px solid ${T.border}`, borderRadius:24, padding:"60px 40px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, border:`1px solid ${T.border}`, borderRadius:30, transform:"rotate(15deg)", opacity:0.5 }}/><div style={{ position:"absolute", bottom:-30, left:-30, width:100, height:100, border:`1px solid ${T.border}`, borderRadius:20, transform:"rotate(-10deg)", opacity:0.4 }}/>
            <h2 style={{ fontSize:32, fontWeight:800, letterSpacing:"-1px", marginBottom:16, position:"relative" }}>Ready to get started?</h2>
            <ParticleButton color={T.accent} particleSize={44} onClick={onEnter} textColor={T.text}>Open <ArrowIcon/></ParticleButton>
          </div>
        </section>
        <footer style={{ borderTop:`1px solid ${T.border}`, padding:"24px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
          <div style={{ opacity:0.60 }}><LogoFull size={22} color={T.textDim} textColor={T.textDim}/></div>
        </footer>
      </div>
  );
}

// ─── Dropdown Nav Item ────────────────────────────────────────────────────────
function NavDropdown({ item, page, setPage, T }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top:0, left:0 });
  const btnRef  = useRef(null);
  const menuRef = useRef(null);

  const recalc = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.round(r.left + r.width / 2 - 95) });
    }
  };

  useEffect(() => {
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => { window.removeEventListener("resize", recalc); window.removeEventListener("scroll", recalc, true); };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target) && menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isGroupActive = item.items.some(i => i.key === page);
  const Icon = item.Icon;

  // Culoarea activa — albastru-gri, nu violet
  const activeColor = T.navText;

  return (
      <>
        <button
            ref={btnRef}
            onClick={() => setOpen(o => !o)}
            style={{
              display:"flex", flexDirection:"column", alignItems:"center", gap:4,
              padding:"10px 14px", background:"none", border:"none",
              borderBottom:`2px solid ${isGroupActive ? activeColor : "transparent"}`,
              cursor:"pointer", fontFamily:"'Outfit',sans-serif",
              color: isGroupActive ? activeColor : T.textMid,
              transition:"all 0.15s", whiteSpace:"nowrap", minWidth:72,
            }}
        >
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {Icon && <Icon s={18}/>}
            <ChevronIcon open={open}/>
          </div>
          <span style={{ fontSize:10, fontWeight:isGroupActive?600:400, letterSpacing:"0.3px" }}>{item.label}</span>
        </button>

        {open && (
            <div ref={menuRef} style={{
              position:"fixed", top:pos.top, left:pos.left,
              background:T.card, border:`1px solid ${T.border2}`, borderRadius:12,
              padding:"6px", minWidth:190, zIndex:9000,
              boxShadow: T.isDark ? "0 16px 48px rgba(0,0,0,0.6)" : "0 16px 48px rgba(0,0,0,0.15)",
              animation:"fadeUp 0.15s ease",
            }}>
              {item.items.map((sub,idx) => {
                const SubIcon = sub.Icon;
                const active  = page === sub.key;
                return (
                    <button
                        key={sub.key}
                        onClick={() => { setPage(sub.key); setOpen(false); }}
                        style={{
                          display:"flex", alignItems:"center", gap:10,
                          width:"100%", padding:"9px 12px",
                          background: active ? `${activeColor}14` : "none",
                          border:"none", borderLeft: active ? `2px solid ${activeColor}` : "2px solid transparent",
                          borderRadius:8, cursor:"pointer",
                          fontFamily:"'Outfit',sans-serif", textAlign:"left",
                          color: active ? activeColor : T.textMid,
                          fontWeight: active ? 600 : 400,
                          transition:"all 0.12s",
                          borderBottom: idx < item.items.length - 1 ? `1px solid ${T.border}` : "none",

                        }}
                        onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = active ? `${activeColor}14` : "none"; }}
                    >
                      {SubIcon && <SubIcon s={15}/>}
                      <span style={{ fontSize:13 }}>{sub.label}</span>
                    </button>
                );
              })}
            </div>
        )}
      </>
  );
}

// ─── Top Navbar ───────────────────────────────────────────────────────────────

function TopNav({ page, setPage, user, company, T, onToggle, onLogout, isAdmin }) {
  const allItems = isAdmin ? [...NAV_MAIN, ...NAV_ADMIN] : NAV_MAIN;
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Culoarea activa — albastru-gri, nu violet
  const activeColor = T.navText;

  return (
      <>
        {showLogoutModal && (
            <div style={{ position:"fixed", inset:0, zIndex:9999, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center" }} onClick={()=>setShowLogoutModal(false)}>
              <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:20, padding:"36px 40px", maxWidth:380, width:"90%", boxShadow:"0 24px 64px rgba(0,0,0,0.4)", animation:"fadeUp 0.2s ease both" }} onClick={e=>e.stopPropagation()}>
                <h3 style={{ fontSize:18, fontWeight:700, color:T.text, marginBottom:8, letterSpacing:"-0.4px" }}>Ieșire din cont?</h3>
                <p style={{ fontSize:14, color:T.textMid, lineHeight:1.6, marginBottom:28 }}>Vei fi redirecționat la pagina principală. Datele tale sunt salvate și te poți autentifica oricând.</p>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={()=>setShowLogoutModal(false)} style={{ flex:1, padding:"11px", borderRadius:10, border:`1px solid ${T.border2}`, background:"none", color:T.textMid, fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                  <button onClick={()=>{setShowLogoutModal(false);onLogout();}} style={{ flex:1, padding:"11px", borderRadius:10, border:"none", background:T.isDark?"#1e2535":"#e8edf8", color:T.text, fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Deconectare</button>
                </div>
              </div>
            </div>
        )}

        <header style={{ position:"sticky", top:0, zIndex:100, background:T.isDark?"rgba(13,16,24,0.92)":"rgba(255,255,255,0.92)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.border}`, display:"flex", flexDirection:"column" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 28px 0", borderBottom:`1px solid ${T.border}` }}>
            <LogoFull size={28}/>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <button onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", color:T.textMid, fontSize:12, fontFamily:"'Outfit',sans-serif" }}>{T.isDark?<SunIcon/>:<MoonIcon/>}<span>{T.isDark?"Luminos":"Întunecat"}</span></button>
              {company && <div style={{ display:"flex", alignItems:"center", gap:6, background:`${T.blue}10`, border:`1px solid ${T.blue}30`, borderRadius:8, padding:"5px 10px", color:T.blue }}><BuildingIcon/><span style={{ fontSize:11, fontWeight:600, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{company.companyCode} · {company.companyName}</span></div>}
              <div style={{ display:"flex", alignItems:"center", gap:8, background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:"5px 12px 5px 6px" }}>
                <div style={{ width:26, height:26, borderRadius:"50%", background:`${T.blue}20`, border:`1px solid ${T.blue}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.blue }}>{user.name?.charAt(0).toUpperCase()||"U"}</div>
                <div><div style={{ fontSize:12, fontWeight:500, color:T.text, lineHeight:1.2 }}>{user.name||user.email}</div><div style={{ fontSize:10, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.5px" }}>{user.role}</div></div>
                <button onClick={()=>setShowLogoutModal(true)} style={{ background:"none", border:"none", cursor:"pointer", color:T.textMid, display:"flex", padding:"2px 4px", marginLeft:4, borderRadius:5 }} title="Deconectare"><LogoutIcon/></button>
              </div>
            </div>
          </div>

          {/* ── NAV TABS ── */}
          <div style={{ display:"flex", alignItems:"flex-end", padding:"0 20px", overflow:"visible", gap:2 }}>
            {allItems.map(item => {
              if (item.group) {
                return <NavDropdown key={item.group} item={item} page={page} setPage={setPage} T={T}/>;
              }
              const active = page === item.key;
              const Icon   = item.Icon;
              return (
                  <button key={item.key} onClick={()=>setPage(item.key)}
                          style={{
                            display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                            padding:"10px 16px", background:"none", border:"none",
                            borderBottom:`2px solid ${active ? activeColor : "transparent"}`,
                            cursor:"pointer", fontFamily:"'Outfit',sans-serif",
                            color: active ? activeColor : T.textMid,
                            transition:"all 0.15s", whiteSpace:"nowrap", minWidth:72,
                          }}>
                    <Icon s={20}/>
                    <span style={{ fontSize:10, fontWeight:active?600:400, letterSpacing:"0.3px" }}>{item.label}</span>
                  </button>
              );
            })}
          </div>
        </header>
      </>
  );
}

function Placeholder({ title, T }) {
  return (
      <div style={{ padding:"40px", minHeight:"calc(100vh - 120px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", border:`1px dashed ${T.border2}`, borderRadius:16, padding:"60px 80px" }}>
          <strong style={{ color:T.textMid, fontSize:18 }}>{title}</strong>
          <p style={{ fontSize:12, color:T.textDim, marginTop:8 }}>În curând.</p>
        </div>
      </div>
  );
}

export default function App() {
  const [themeName, setThemeName] = useState("dark");
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [page, setPage] = useState("dashboard");
  const T = THEMES[themeName];

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved==="light"||saved==="dark") setThemeName(saved);
    if (window.location.pathname==="/select-company") { setView("oauth2"); return; }
    const token=localStorage.getItem("token"); const u=localStorage.getItem("user");
    if (token&&u) { const parsed=JSON.parse(u); setUser(parsed); setCompany(parsed.companyId?{companyId:parsed.companyId,companyName:parsed.companyName,companyCode:parsed.companyCode}:null); setView("app"); }
  }, []);

  const toggleTheme  = () => { const next=themeName==="dark"?"light":"dark"; setThemeName(next); localStorage.setItem("theme",next); };
  const [isTransitioning, setIsTransitioning] = useState(false);
  const handleLogin = (d) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setUser({ email:d.email, name:d.name, role:d.role });
      setCompany({ companyId:d.companyId, companyName:d.companyName, companyCode:d.companyCode });
      setView("app");
      setIsTransitioning(false);
    }, 3200);
  };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); setUser(null); setCompany(null); setView("landing"); window.history.replaceState({},"","/"); };

  const renderPage = () => {
    switch (page) {
      case "dashboard":       return <Dashboard/>;
      case "clients":         return <Clients/>;
      case "invoices":        return <Invoices/>;
      case "suppliers":       return <Suppliers/>;
      case "supinv":          return <SupplierInvoices/>;
      case "bank":            return <Bank/>;
      case "reports":         return <Reports/>;
      case "accounts":        return <ChartOfAccounts/>;
      case "users":           return <Placeholder title="Utilizatori" T={T}/>;
      case "taxrates":        return <Placeholder title="Cote TVA" T={T}/>;
      case "jurnal-contabil": return <JurnalContabil/>;
      case "settings": return <Settings/>;
      default:                return <Placeholder title={page} T={T}/>;
    }
  };

  return (
      <ThemeContext.Provider value={T}>
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { background:${T.bg}; font-family:'Outfit',sans-serif; }
        ::-webkit-scrollbar { width:4px; height:4px; }
        ::-webkit-scrollbar-track { background:${T.bg}; }
        ::-webkit-scrollbar-thumb { background:${T.border2}; border-radius:4px; }
        button:focus { outline:none; }
        input::placeholder { color:${T.textDim}; }
        textarea::placeholder { color:${T.textDim}; }
        input:focus, textarea:focus { border-color:${T.blue} !important; }
        @keyframes blink { 0%,100%{border-color:currentColor} 50%{border-color:transparent} }
        @keyframes shapeFloat1 { 0%,100%{transform:rotate(18deg) translateY(0)} 50%{transform:rotate(18deg) translateY(-18px)} }
        @keyframes shapeFloat2 { 0%,100%{transform:rotate(35deg) translateY(0)} 50%{transform:rotate(35deg) translateY(14px)} }
        @keyframes shapeFloat3 { 0%,100%{transform:rotate(22deg) scale(1)} 50%{transform:rotate(22deg) scale(1.08)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
        {isTransitioning && (
            <div style={{ position:"fixed", inset:0, background:T.bg, zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <AnimatedLogo/>
            </div>
        )}
        {view==="landing" && <Landing T={T} themeName={themeName} onToggleTheme={toggleTheme} onEnter={()=>setView("login")}/>}
        {view==="login"   && <LoginPage onLogin={handleLogin} onBack={()=>setView("landing")}/>}
        {view==="oauth2"  && <OAuth2Callback onLogin={handleLogin}/>}
        {view==="app" && user && (
            <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column" }}>
              <TopNav page={page} setPage={setPage} user={user} company={company} T={T} onToggle={toggleTheme} onLogout={handleLogout} isAdmin={user.role==="ADMIN"}/>
              <main style={{ flex:1, overflowY:"auto" }}>{renderPage()}</main>
            </div>
        )}
      </ThemeContext.Provider>
  );
}