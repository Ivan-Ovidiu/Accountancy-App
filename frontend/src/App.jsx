import { useState, useEffect, useRef, createContext, useContext } from "react";
import Dashboard        from "./Dashboard";
import Clients          from "./Clients";
import Invoices         from "./Invoices";
import Expenses         from "./Expenses";
import Bank             from "./Bank";
import Reports          from "./Reports";
import ChartOfAccounts  from "./ChartOfAccounts";
import Suppliers        from "./Suppliers";
import SupplierInvoices from "./SupplierInvoices";
import LoginPage        from "./Login";
import { LogoMark, LogoFull } from "./Logo";
import OAuth2Callback   from "./OAuth2Callback";

// ─── Theme Context ────────────────────────────────────────────────────────────
export const ThemeContext = createContext(null);
export function useTheme() { return useContext(ThemeContext); }

export const THEMES = {
  dark: {
    bg:        "#0b0e14",
    navbar:    "#0d1018",
    card:      "#131720",
    cardAlt:   "#0f1320",
    border:    "#1a2035",
    border2:   "#222a3d",
    text:      "#cdd5e0",
    textMid:   "#5a6480",
    textDim:   "#2e3855",
    accent:    "#a78bfa",
    blue:      "#7b9cba",
    green:     "#7aab8a",
    red:       "#b07a7a",
    amber:     "#b09a6a",
    navActive: "#161c2e",
    navText:   "#44506e",
    inputBg:   "#0b0e14",
    isDark:    true,
  },
  light: {
    bg:        "#f0f3fa",
    navbar:    "#ffffff",
    card:      "#ffffff",
    cardAlt:   "#f5f7fd",
    border:    "#e1e7f5",
    border2:   "#c8d3ec",
    text:      "#0d1426",
    textMid:   "#526080",
    textDim:   "#96a3be",
    accent:    "#7c3aed",
    blue:      "#3b7cb5",
    green:     "#2d7a56",
    red:       "#a03030",
    amber:     "#92600a",
    navActive: "#f0ecff",
    navText:   "#8a99b8",
    inputBg:   "#f8fafc",
    isDark:    false,
  },
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const DashboardIcon = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="2" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="2" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/><rect x="11" y="11" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.4"/></svg>;
const ClientsIcon   = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="8" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.4"/><path d="M1 17c0-3.314 3.134-5 7-5s7 1.686 7 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M15 8c1.657 0 3 1.343 3 3s-1.343 1.5-3 1.5M17 17c0-2-.9-3.5-2-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const InvoicesIcon  = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="3" y="2" width="14" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 7h6M7 10h6M7 13h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const ExpensesIcon  = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4"/><path d="M10 6v4l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const BankIcon      = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M2 8l8-5 8 5H2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M5 8v7M8 8v7M12 8v7M15 8v7" stroke="currentColor" strokeWidth="1.4"/><path d="M2 15h16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const ReportsIcon   = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 16V11M7 16V7M10 16V9M13 16V4M16 16V8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const AccountsIcon  = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><rect x="2" y="4" width="16" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 9h16" stroke="currentColor" strokeWidth="1.4"/><path d="M7 9v7M7 4v5" stroke="currentColor" strokeWidth="1.4"/></svg>;
const UsersIcon     = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><circle cx="13" cy="6" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M1 16c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M14 11c2.2.5 4 2.2 4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const TaxIcon       = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 20 20" fill="none"><path d="M4 16L16 4M6.5 6a2 2 0 100-4 2 2 0 000 4zM13.5 18a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>;
const MoonIcon      = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M13 10.5A5.5 5.5 0 016.5 4a5.5 5.5 0 106.5 6.5z" fill="currentColor"/></svg>;
const SunIcon       = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M11 3.5l-1.5 1.5M4.5 11L3 12.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
const LogoutIcon    = () => <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const ArrowIcon     = () => <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── Typed text animation ─────────────────────────────────────────────────────
function TypedText({ words, color, speed = 90, pause = 1600 }) {
  const [displayed, setDisplayed] = useState("");
  const [wordIdx,   setWordIdx]   = useState(0);
  const [charIdx,   setCharIdx]   = useState(0);
  const [deleting,  setDeleting]  = useState(false);

  useEffect(() => {
    const word = words[wordIdx];
    let timeout;
    if (!deleting && charIdx < word.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === word.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setWordIdx(i => (i + 1) % words.length);
    }
    setDisplayed(word.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return (
      <span style={{ color, borderRight: `2px solid ${color}`, paddingRight: 3, animation: "blink 0.9s step-end infinite" }}>
      {displayed}
    </span>
  );
}

// ─── Section label + animated underline ──────────────────────────────────────
function SectionLabel({ mini, title, accentColor, visible = true }) {
  return (
      <div>
        <p style={{ fontSize:13, fontWeight:600, color:"#888", textTransform:"uppercase", letterSpacing:"1.5px", marginBottom:10, opacity:visible?1:0, transform:visible?"none":"translateY(16px)", transition:"all 0.5s ease" }}>
          {mini}
        </p>
        <div style={{ position:"relative", display:"inline-block", marginBottom:32 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,44px)", fontWeight:800, letterSpacing:"-1.5px", paddingBottom:10, opacity:visible?1:0, transform:visible?"none":"translateY(20px)", transition:"all 0.6s ease 0.1s" }}>
            {title}
          </h2>
          <span style={{ position:"absolute", left:0, bottom:0, height:4, borderRadius:99, background:accentColor, width:visible?100:0, transition:"width 0.8s ease 0.4s", display:"block" }}/>
        </div>
      </div>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_MAIN = [
  { key:"dashboard",  label:"Dashboard",        Icon: DashboardIcon },
  { key:"clients",    label:"Clients",           Icon: ClientsIcon   },
  { key:"invoices",   label:"Invoices",          Icon: InvoicesIcon  },
  { key:"expenses",   label:"Expenses",          Icon: ExpensesIcon  },
  { key:"suppliers",  label:"Suppliers",         Icon: UsersIcon     },
  { key:"supinv",     label:"Supplier Invoices", Icon: InvoicesIcon  },
  { key:"bank",       label:"Bank",              Icon: BankIcon      },
  { key:"reports",    label:"Reports",           Icon: ReportsIcon   },
  { key:"accounts",   label:"Chart of Accounts", Icon: AccountsIcon  },
];
const NAV_ADMIN = [
  { key:"users",    label:"Users",     Icon: UsersIcon },
  { key:"taxrates", label:"Tax Rates", Icon: TaxIcon   },
];

// ─── Logo — imported from Logo.jsx (uses public/ff.svg) ──────────────────────

// ─── Scroll reveal — bidirectional ───────────────────────────────────────────
function useScrollReveal(threshold = 0.18) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

// ─── Abstract background shapes ───────────────────────────────────────────────
function AbstractShapes({ T }) {
  const d = T.isDark;
  const sq1 = d?"rgba(167,139,250,0.09)":"rgba(109,68,220,0.14)";
  const sq2 = d?"rgba(123,156,186,0.07)":"rgba(59,124,181,0.13)";
  const sq3 = d?"rgba(167,139,250,0.06)":"rgba(109,68,220,0.10)";
  const fill= d?"rgba(167,139,250,0.05)":"rgba(109,68,220,0.08)";
  const cr1 = d?"rgba(122,171,138,0.07)":"rgba(45,122,86,0.12)";
  const cr2 = d?"rgba(176,154,106,0.07)":"rgba(146,96,10,0.11)";
  const dot = d?"rgba(167,139,250,0.20)":"rgba(109,68,220,0.22)";
  const bw  = d?1.5:2;
  return (
      <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
        <div style={{ position:"absolute", top:"-12%", right:"-8%", width:520, height:520, border:`${bw}px solid ${sq1}`, borderRadius:60, transform:"rotate(18deg)", animation:"shapeFloat1 18s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", top:"3%", right:"2%", width:300, height:300, border:`${bw}px solid ${sq2}`, borderRadius:36, transform:"rotate(35deg)", animation:"shapeFloat2 22s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", top:"18%", right:"12%", width:80, height:80, background:fill, border:`${bw}px solid ${sq3}`, borderRadius:16, transform:"rotate(22deg)", animation:"shapeFloat3 14s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", bottom:"-15%", left:"-10%", width:560, height:560, border:`${bw}px solid ${cr1}`, borderRadius:"50%", animation:"shapeFloat2 20s ease-in-out infinite reverse" }}/>
        <div style={{ position:"absolute", bottom:"5%", left:"5%", width:220, height:220, border:`${bw}px solid ${cr2}`, borderRadius:"50%", animation:"shapeFloat1 16s ease-in-out infinite reverse" }}/>
        <div style={{ position:"absolute", top:"42%", left:"48%", width:180, height:180, border:`${bw}px solid ${sq3}`, borderRadius:24, transform:"rotate(45deg)", animation:"shapeFloat3 25s ease-in-out infinite" }}/>
        {[...Array(16)].map((_,i) => (
            <div key={i} style={{ position:"absolute", top:`${8+Math.floor(i/4)*3.8}%`, left:`${3+(i%4)*2.4}%`, width:d?3:4, height:d?3:4, borderRadius:"50%", background:dot }}/>
        ))}
      </div>
  );
}

// ─── Mini Preview ─────────────────────────────────────────────────────────────
function MiniPreview({ f, T }) {
  const row = (label, val) => (
      <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${T.border}` }}>
        <span style={{ fontSize:11, color:T.textDim }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:500, color:T.text }}>{val}</span>
      </div>
  );
  const pill = (label, color) => (
      <span key={label} style={{ fontSize:10, fontWeight:600, color, background:`${color}18`, padding:"3px 8px", borderRadius:99 }}>{label}</span>
  );
  const statusFlow = (items) => (
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {items.map(({ label, sub, color, active }, i, arr) => (
            <div key={label}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <div style={{ marginTop:4, width:7, height:7, borderRadius:"50%", background:color, flexShrink:0, boxShadow:active?`0 0 0 3px ${color}22`:"none" }}/>
                <div>
                  <span style={{ fontSize:12, fontWeight:active?600:400, color:active?T.text:T.textMid }}>{label}</span>
                  {sub && <span style={{ fontSize:10, color:T.textDim, display:"block" }}>{sub}</span>}
                </div>
              </div>
              {i < arr.length-1 && <div style={{ width:1, height:10, background:T.border, marginLeft:3, marginTop:1, marginBottom:1 }}/>}
            </div>
        ))}
      </div>
  );
  const miniCard = (children) => (
      <div style={{ padding:"10px 12px", background:T.isDark?"#0f1320":"#f8faff", borderRadius:8, border:`1px solid ${T.border}` }}>{children}</div>
  );
  const lbl = (txt) => (
      <p style={{ fontSize:10, fontWeight:700, color:T.textDim, textTransform:"uppercase", letterSpacing:"1.5px", margin:"0 0 10px" }}>{txt}</p>
  );

  const previews = {
    "Smart Invoicing": (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {lbl("Status Flow")}
          {statusFlow([
            { label:"Draft",   sub:"Not sent yet",                color:"#6b7280" },
            { label:"Sent",    sub:"DR 4111 / CR 701 + 4427",     color:"#7b9cba", active:true },
            { label:"Paid",    sub:"Payment received",             color:"#7aab8a" },
            { label:"Overdue", sub:"Past due date",                color:"#b07a7a" },
            { label:"Void",    sub:"Cancelled, no journal effect", color:"#9ca3af" },
          ])}
        </div>
    ),
    "Expense Control": (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {lbl("Approval Flow")}
          {statusFlow([
            { label:"Pending",  sub:"Awaiting approval",  color:"#b09a6a" },
            { label:"Approved", sub:"Posts journal entry", color:"#7aab8a", active:true },
            { label:"Rejected", sub:"No journal entry",    color:"#b07a7a" },
          ])}
          {miniCard(<>
            <p style={{ fontSize:10, color:T.textDim, margin:"0 0 5px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.8px" }}>On Approved</p>
            <p style={{ fontSize:11, fontFamily:"monospace", color:T.textMid, margin:"2px 0" }}>DR  Expense Account</p>
            <p style={{ fontSize:11, fontFamily:"monospace", color:T.textMid, margin:"2px 0" }}>CR  5121 Bank</p>
          </>)}
        </div>
    ),
    "Bank Reconciliation": (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {lbl("Operation Types")}
          {[
            { label:"Client Receipt",   formula:"5121 = 4111", color:"#7aab8a" },
            { label:"Supplier Payment", formula:"401 = 5121",  color:"#b07a7a" },
            { label:"Bank Commission",  formula:"627 = 5121",  color:"#7b9cba" },
            { label:"Interest Income",  formula:"5121 = 766",  color:"#7aab8a" },
          ].map(({ label: l, formula, color }) => (
              <div key={l} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"7px 10px", borderRadius:7, background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.text }}>{l}</span>
                <span style={{ fontSize:10, fontFamily:"monospace", color }}>{formula}</span>
              </div>
          ))}
        </div>
    ),
    "Financial Reports": (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {lbl("Report Types")}
          {[
            { name:"Profit & Loss",  detail:"Revenue − Expenses",           sym:"↗" },
            { name:"Balance Sheet",  detail:"Assets = Liabilities + Equity", sym:"⊟" },
            { name:"Cash Flow",      detail:"Current asset movements",       sym:"⇄" },
          ].map(({ name, detail, sym }) => (
              <div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:7, background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:14, color:T.textMid, width:18, textAlign:"center", flexShrink:0 }}>{sym}</span>
                <div>
                  <p style={{ fontSize:12, fontWeight:600, color:T.text, margin:0 }}>{name}</p>
                  <p style={{ fontSize:10, color:T.textDim, margin:0 }}>{detail}</p>
                </div>
              </div>
          ))}
          <p style={{ fontSize:10, color:T.textDim, marginTop:4 }}>All derived from journal lines. No separate logic.</p>
        </div>
    ),
    "Chart of Accounts": (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
          {lbl("Account Types (Romanian Plan)")}
          {[
            { code:"1xxx", name:"Asset",     color:"#7b9cba" },
            { code:"2xxx", name:"Liability", color:"#b07a7a" },
            { code:"3xxx", name:"Equity",    color:"#9b8fba" },
            { code:"7xx",  name:"Revenue",   color:"#7aab8a" },
            { code:"6xx",  name:"Expense",   color:"#b09a6a" },
          ].map(({ code, name, color }) => (
              <div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 10px", borderRadius:6, background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:10, fontFamily:"monospace", color:T.textDim, width:32, flexShrink:0 }}>{code}</span>
                <span style={{ fontSize:12, color:T.text, flex:1 }}>{name}</span>
                <div style={{ width:7, height:7, borderRadius:"50%", background:color }}/>
              </div>
          ))}
          <p style={{ fontSize:10, color:T.textDim, marginTop:4 }}>Self-referencing parent/child hierarchy.</p>
        </div>
    ),
    "Client Management": (
        <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
          {lbl("Client Record")}
          {[
            { field:"Name",    val:"Acme SRL"           },
            { field:"CIF",     val:"RO12345678"          },
            { field:"Email",   val:"office@acme.ro"      },
            { field:"Phone",   val:"+40 721 000 001"     },
            { field:"Address", val:"București, Sector 1" },
          ].map(({ field, val }) => row(field, val))}
          <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:10 }}>
            {[["Active","#7aab8a"],["Soft Delete","#6b7280"],["Debounced Search","#7b9cba"]].map(([t,c])=>pill(t,c))}
          </div>
        </div>
    ),
  };
  return previews[f.title] || null;
}

// ─── Features Section ─────────────────────────────────────────────────────────
function FeaturesSection({ featRef, featVis, slide, T, features }) {
  const [active, setActive] = useState(0);
  const f = features[active];
  return (
      <section id="features" ref={featRef} style={{ maxWidth:1100, margin:"0 auto 120px", padding:"0 48px", position:"relative", zIndex:1 }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
            <SectionLabel mini="Everything You Need" title="Choose a module" accentColor={T.accent} visible={featVis}/>
          </div>
          <p style={{ ...slide(featVis,"translateY(16px)"), transitionDelay:"0.2s", fontSize:15, color:T.textMid, maxWidth:480, margin:"0 auto" }}>
            Every module runs on the same double-entry engine — journal lines power every number you see.
          </p>
        </div>
        <div style={{ ...slide(featVis,"translateY(16px)"), transitionDelay:"0.1s", display:"flex", justifyContent:"center", gap:0, marginBottom:40, borderBottom:`1px solid ${T.border}` }}>
          {features.map(({ title }, i) => {
            const isActive = active === i;
            return (
                <button key={title} onClick={() => setActive(i)} style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:isActive?600:400, color:isActive?T.text:T.textMid, padding:"12px 20px", borderBottom:`2px solid ${isActive?T.text:"transparent"}`, marginBottom:"-1px", transition:"all 0.2s", whiteSpace:"nowrap" }}>
                  {title.split(" ")[0]}
                </button>
            );
          })}
        </div>
        <div style={{ ...slide(featVis,"translateY(32px)"), transitionDelay:"0.12s", display:"grid", gridTemplateColumns:"2fr 1fr", gap:0, border:`1px solid ${T.border}`, borderRadius:16, overflow:"hidden" }}>
          <div style={{ background:T.isDark?T.card:"#fff", padding:"52px 48px", borderRight:`1px solid ${T.border}` }}>
            <h3 style={{ fontSize:32, fontWeight:800, color:T.text, letterSpacing:"-1px", marginBottom:24, lineHeight:1.1 }}>{f.title}</h3>
            <p style={{ fontSize:15, color:T.textMid, lineHeight:1.85, marginBottom:36, maxWidth:460 }}>{f.desc}</p>
            <div style={{ display:"flex", flexDirection:"column", gap:12, borderTop:`1px solid ${T.border}`, paddingTop:28 }}>
              {f.bullets.map((b, i) => (
                  <p key={i} style={{ fontSize:14, color:T.textMid, margin:0, lineHeight:1.5 }}>{b}</p>
              ))}
            </div>
          </div>
          <div style={{ background:T.isDark?T.card:"#fff", padding:"52px 32px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
            <MiniPreview f={f} T={T} />
            <div style={{ display:"flex", gap:6, paddingTop:24 }}>
              {features.map((_, i) => (
                  <button key={i} onClick={() => setActive(i)} style={{ width:active===i?20:6, height:6, borderRadius:3, background:active===i?T.text:T.border2, border:"none", cursor:"pointer", padding:0, transition:"all 0.3s ease" }}/>
              ))}
            </div>
          </div>
        </div>
      </section>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function Landing({ onEnter, T, themeName, onToggleTheme }) {
  const [visible, setVisible] = useState(false);
  const [sticky,  setSticky]  = useState(false);
  const [featRef,    featVis]    = useScrollReveal(0.12);
  const [previewRef, previewVis] = useScrollReveal(0.12);
  const [contactRef, contactVis] = useScrollReveal(0.15);
  const [ctaRef,     ctaVis]     = useScrollReveal(0.2);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const features = [
    {
      Icon: InvoicesIcon, title: "Smart Invoicing",
      desc: "Generate professional invoices with auto-incremented reference numbers. The moment you mark an invoice as Sent, the system posts the journal entry automatically — no manual bookkeeping required.",
      bullets: ["Auto-incremented references (INV-2026-00001)", "VAT calculated with configurable tax rates", "On SENT: posts DR 4111 / CR 701 + 4427", "Statuses: Draft → Sent → Paid / Overdue / Void"],
    },
    {
      Icon: ExpensesIcon, title: "Expense Control",
      desc: "Every expense goes through an approval workflow before touching the books. This separation between entry and approval is a core principle of internal control.",
      bullets: ["Three-stage flow: Pending → Approved → Rejected", "On APPROVED: posts DR Expense / CR 5121 Bank", "Each expense linked to a Chart of Accounts entry", "Full audit trail — who approved, when, and for what"],
    },
    {
      Icon: BankIcon, title: "Bank Reconciliation",
      desc: "Import your bank CSV and let the engine auto-match transactions against existing journal lines by amount and date. Manual matching for anything left over.",
      bullets: ["CSV import from any Romanian bank format", "Auto-match by amount + date proximity", "Six operation types with predefined formulas", "Goal: zero unmatched transactions at month-end"],
    },
    {
      Icon: ReportsIcon, title: "Financial Reports",
      desc: "Profit & Loss, Balance Sheet, and Cash Flow — generated in real time from journal line aggregation. Every figure traces back to a journal entry.",
      bullets: ["P&L for any custom date range", "Balance Sheet cumulative to any date", "Cash Flow from current asset movements", "Dashboard KPIs refreshed on every page load"],
    },
    {
      Icon: AccountsIcon, title: "Chart of Accounts",
      desc: "A hierarchical account structure built on the Romanian accounting plan. Every transaction must map to an account — this is what keeps all reports consistent.",
      bullets: ["Self-referencing parent/child hierarchy", "Types: Asset, Liability, Equity, Revenue, Expense", "Codes following the Romanian plan (6xx, 7xx…)", "Single source of truth for all reports"],
    },
    {
      Icon: ClientsIcon, title: "Client Management",
      desc: "A lightweight CRM purpose-built for accounting. Every invoice is tied to a client, so you always have a full financial picture per customer.",
      bullets: ["Soft delete — data is never lost, only deactivated", "Debounced real-time search by name or CIF", "Fields: name, email, phone, address, tax ID", "One-click access to all invoices for a client"],
    },
  ];

  const slide = (vis, from) => ({
    opacity: vis ? 1 : 0,
    transform: vis ? "none" : from,
    transition: "opacity 0.65s ease, transform 0.65s ease",
  });

  return (
      <div id="top" style={{ minHeight:"100vh", background:T.bg, fontFamily:"'Outfit',sans-serif", color:T.text, overflowX:"hidden", position:"relative" }}>
        <AbstractShapes T={T} />

        {/* Navbar */}
        <nav style={{
          position:"fixed", top:0, left:0, right:0, zIndex:100,
          padding:    sticky?"0 48px":"20px 48px 32px",
          height:     sticky?64:"auto",
          background: sticky?(T.isDark?"rgba(11,14,20,0.96)":"rgba(255,255,255,0.97)"):"transparent",
          backdropFilter: sticky?"blur(18px)":"none",
          borderBottom: sticky?`1px solid ${T.border}`:"none",
          boxShadow:  sticky?"0 2px 20px rgba(0,0,0,0.12)":"none",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          transition:"all 0.45s ease",
        }}>
          <LogoFull size={30} />
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            {[{label:"Home",href:"#top"},{label:"Features",href:"#features"},{label:"Contact",href:"#contact"}].map(({ label, href }) => (
                <a key={label} href={href}
                   onClick={e => { e.preventDefault(); document.querySelector(href==="#top"?"#top":href)?.scrollIntoView({behavior:"smooth"}); }}
                   style={{ padding:"8px 16px", fontSize:14, fontWeight:500, color:T.textMid, textDecoration:"none", borderRadius:8, transition:"color 0.2s", fontFamily:"'Outfit',sans-serif" }}
                   onMouseEnter={e => e.target.style.color=T.text}
                   onMouseLeave={e => e.target.style.color=T.textMid}
                >{label}</a>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onToggleTheme} style={{ background:"none", border:`1px solid ${sticky?T.border:T.border2}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", color:T.textMid, display:"flex", alignItems:"center", gap:6, fontSize:12, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.3s" }}>
              {T.isDark?<SunIcon/>:<MoonIcon/>}
              <span>{T.isDark?"Light":"Dark"}</span>
            </button>
            <button onClick={onEnter} style={{ background:T.accent, border:"none", borderRadius:10, padding:"9px 22px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", boxShadow:sticky?`0 4px 16px ${T.accent}40`:"none", transition:"box-shadow 0.3s" }}>
              Sign In →
            </button>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ maxWidth:1100, margin:"0 auto", padding:"140px 48px 80px", textAlign:"center", position:"relative", zIndex:1 }}>
          <h1 key={themeName} style={{ opacity:visible?1:0, transform:visible?"none":"translateY(28px)", transition:"all 0.65s ease 0.1s", fontSize:"clamp(38px,6vw,70px)", fontWeight:800, letterSpacing:"-2.5px", lineHeight:1.1, maxWidth:820, margin:"0 auto 22px" }}>
            Manage your{" "}
            <TypedText words={["Invoices","Expenses","Reports","Balance Sheets","Cash Flow"]} color={T.accent}/>
            <br/>
            <span style={{ fontSize:"clamp(26px,4vw,46px)", fontWeight:600, color:T.textMid }}>with intelligence.</span>
          </h1>
          <p style={{ opacity:visible?1:0, transform:visible?"none":"translateY(24px)", transition:"all 0.65s ease 0.2s", fontSize:17, color:T.textMid, maxWidth:560, margin:"0 auto 44px", lineHeight:1.75 }}>
            A full double-entry accounting platform built for Romanian businesses — with real-time reports, automated journal entries, and an AI layer that learns your transactions.
          </p>
          <div style={{ opacity:visible?1:0, transform:visible?"none":"translateY(20px)", transition:"all 0.65s ease 0.3s", display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={onEnter} style={{ display:"flex", alignItems:"center", gap:8, background:T.accent, border:"none", borderRadius:12, padding:"14px 32px", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              Get Started <ArrowIcon/>
            </button>
            <button onClick={() => document.getElementById("features")?.scrollIntoView({behavior:"smooth"})} style={{ background:"none", border:`1px solid ${T.border2}`, borderRadius:12, padding:"14px 28px", color:T.textMid, fontSize:15, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
              Explore Features
            </button>
          </div>
          <div style={{ opacity:visible?1:0, transition:"all 0.8s ease 0.5s", display:"flex", gap:56, justifyContent:"center", marginTop:68, flexWrap:"wrap" }}>
            {[["100%","Double-Entry Accurate"],["Real-time","Financial Reports"],["AI-Powered","Transaction Analysis"]].map(([n,l]) => (
                <div key={l} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:22, fontWeight:700, color:T.text }}>{n}</div>
                  <div style={{ fontSize:12, color:T.textMid, marginTop:4 }}>{l}</div>
                </div>
            ))}
          </div>
        </section>

        {/* Dashboard Preview */}
        <section ref={previewRef} style={{ maxWidth:1100, margin:"0 auto 110px", padding:"0 48px", position:"relative", zIndex:1 }}>
          <div style={{ ...slide(previewVis,"translateY(60px)"), background:T.isDark?"#131720":"#fff", border:`1px solid ${T.border}`, borderRadius:20, padding:24, boxShadow:T.isDark?"0 32px 72px rgba(0,0,0,0.55)":"0 32px 72px rgba(0,0,0,0.09)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20, paddingBottom:16, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:"#b07a7a" }}/>
              <div style={{ width:10, height:10, borderRadius:"50%", background:"#b09a6a" }}/>
              <div style={{ width:10, height:10, borderRadius:"50%", background:"#7aab8a" }}/>
              <div style={{ flex:1, background:T.isDark?"#0b0e14":"#f0f3fa", borderRadius:6, height:24, marginLeft:8, display:"flex", alignItems:"center", paddingLeft:12 }}>
                <span style={{ fontSize:11, color:T.textMid }}>accountbud.app/dashboard</span>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
              {[{l:"Revenue",v:"RON 48,200",c:"#7b9cba",d:"+12%"},{l:"Expenses",v:"RON 19,850",c:"#b07a7a",d:"+5%"},{l:"Net Profit",v:"RON 28,350",c:"#7aab8a",d:"+18%"},{l:"Unpaid",v:"RON 8,400",c:"#b09a6a",d:"3 inv."}].map(({l,v,c,d})=>(
                  <div key={l} style={{ background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}`, borderRadius:12, padding:"14px 16px" }}>
                    <div style={{ fontSize:10, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.6px", marginBottom:8 }}>{l}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:c, marginBottom:4 }}>{v}</div>
                    <div style={{ fontSize:11, color:T.textDim }}>{d}</div>
                  </div>
              ))}
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
              <div style={{ background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 20px" }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMid, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.6px" }}>Monthly Overview</div>
                <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:80 }}>
                  {[55,70,45,90,60,80,48,95,65,75,88,62].map((h,i)=>(
                      <div key={i} style={{ flex:1, height:`${h}%`, background:`#7b9cba${i===7?"ff":"55"}`, borderRadius:"3px 3px 0 0" }}/>
                  ))}
                </div>
              </div>
              <div style={{ background:T.isDark?"#0f1320":"#f8faff", border:`1px solid ${T.border}`, borderRadius:12, padding:"16px 20px" }}>
                <div style={{ fontSize:11, fontWeight:600, color:T.textMid, marginBottom:16, textTransform:"uppercase", letterSpacing:"0.6px" }}>Invoice Status</div>
                {[["Paid","#7aab8a",60],["Sent","#7b9cba",25],["Overdue","#b07a7a",10],["Draft","#6b7280",5]].map(([label,color,pct])=>(
                    <div key={label} style={{ marginBottom:10 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                        <span style={{ fontSize:11, color:T.textMid }}>{label}</span>
                        <span style={{ fontSize:11, color }}>{pct}%</span>
                      </div>
                      <div style={{ height:4, background:T.border, borderRadius:2 }}>
                        <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:2 }}/>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <FeaturesSection featRef={featRef} featVis={featVis} slide={slide} T={T} features={features} />

        {/* Contact */}
        <section id="contact" ref={contactRef} style={{ maxWidth:1100, margin:"0 auto 120px", padding:"0 48px", position:"relative", zIndex:1 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"center" }}>
            <div style={{ ...slide(contactVis,"translateX(-60px)") }}>
              <SectionLabel mini="Get In Touch" title="Contact Us" accentColor={T.accent} visible={contactVis}/>
              <p style={{ fontSize:14, color:T.textMid, marginBottom:32, lineHeight:1.7 }}>
                Have a question about AccountBud, or want to know more about the thesis project? Fill in the form and we'll get back to you.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {["Your Name","Your Email"].map(ph=>(
                      <input key={ph} placeholder={ph} style={{ background:T.inputBg, border:`1px solid ${T.border2}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none" }}/>
                  ))}
                </div>
                <input placeholder="Subject" style={{ background:T.inputBg, border:`1px solid ${T.border2}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none" }}/>
                <textarea placeholder="Your message..." rows={5} style={{ background:T.inputBg, border:`1px solid ${T.border2}`, borderRadius:10, padding:"12px 14px", fontSize:13, color:T.text, fontFamily:"'Outfit',sans-serif", outline:"none", resize:"vertical" }}/>
                <button style={{ alignSelf:"flex-start", background:T.accent, border:"none", borderRadius:10, padding:"12px 28px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                  Send Message
                </button>
              </div>
            </div>
            <div style={{ ...slide(contactVis,"translateX(60px)"), display:"flex", alignItems:"center", justifyContent:"center" }}>
              <img src="/about.svg" alt="Team illustration" style={{ width:"100%", maxWidth:480, height:"auto", opacity:T.isDark?0.88:1 }}/>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section ref={ctaRef} style={{ maxWidth:700, margin:"0 auto 120px", padding:"0 48px", textAlign:"center", position:"relative", zIndex:1 }}>
          <div style={{ ...slide(ctaVis,"translateY(40px)"), background:T.isDark?"linear-gradient(135deg,rgba(124,92,252,0.12),rgba(123,156,186,0.08))":"linear-gradient(135deg,rgba(124,92,252,0.07),rgba(123,156,186,0.05))", border:`1px solid ${T.border}`, borderRadius:24, padding:"60px 40px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-40, right:-40, width:160, height:160, border:`1px solid ${T.border}`, borderRadius:30, transform:"rotate(15deg)", opacity:0.5 }}/>
            <div style={{ position:"absolute", bottom:-30, left:-30, width:100, height:100, border:`1px solid ${T.border}`, borderRadius:20, transform:"rotate(-10deg)", opacity:0.4 }}/>
            <h2 style={{ fontSize:32, fontWeight:800, letterSpacing:"-1px", marginBottom:16, position:"relative" }}>Ready to get started?</h2>
            <p style={{ fontSize:15, color:T.textMid, marginBottom:32, position:"relative" }}>
              Sign in and start managing your finances with a system that actually understands accounting.
            </p>
            <button onClick={onEnter} style={{ display:"inline-flex", alignItems:"center", gap:8, background:T.accent, border:"none", borderRadius:12, padding:"14px 36px", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", position:"relative" }}>
              Open AccountBud <ArrowIcon/>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ borderTop:`1px solid ${T.border}`, padding:"24px 48px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"relative", zIndex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <LogoFull size={22} />
            <span style={{ fontSize:13, color:T.textDim }}>— Bachelor's Thesis 2026</span>
          </div>
          <span style={{ fontSize:12, color:T.textDim }}>Spring Boot · React · SQL Server · Claude AI</span>
        </footer>
      </div>
  );
}

// ─── Top Navbar ───────────────────────────────────────────────────────────────
function TopNav({ page, setPage, user, T, onToggle, onLogout, isAdmin }) {
  const allItems = isAdmin ? [...NAV_MAIN, ...NAV_ADMIN] : NAV_MAIN;
  return (
      <header style={{ position:"sticky", top:0, zIndex:100, background:T.isDark?"rgba(13,16,24,0.92)":"rgba(255,255,255,0.92)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.border}`, display:"flex", flexDirection:"column" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 28px 0", borderBottom:`1px solid ${T.border}` }}>
          <LogoFull size={28} />
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onToggle} style={{ display:"flex", alignItems:"center", gap:6, background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", color:T.textMid, fontSize:12, fontFamily:"'Outfit',sans-serif" }}>
              {T.isDark?<SunIcon/>:<MoonIcon/>}
              <span>{T.isDark?"Light":"Dark"}</span>
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:8, background:T.cardAlt, border:`1px solid ${T.border}`, borderRadius:10, padding:"5px 12px 5px 6px" }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:`${T.accent}20`, border:`1px solid ${T.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:T.accent }}>
                {user.name?.charAt(0).toUpperCase()||"U"}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:500, color:T.text, lineHeight:1.2 }}>{user.name||user.email}</div>
                <div style={{ fontSize:10, color:T.textMid, textTransform:"uppercase", letterSpacing:"0.5px" }}>{user.role}</div>
              </div>
              <button onClick={onLogout} style={{ background:"none", border:"none", cursor:"pointer", color:T.textMid, display:"flex", padding:"2px 4px", marginLeft:4, borderRadius:5 }} title="Sign out">
                <LogoutIcon/>
              </button>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"flex-end", padding:"0 20px", overflowX:"auto", gap:2 }}>
          {allItems.map(({ key, label, Icon }) => {
            const active = page === key;
            return (
                <button key={key} onClick={() => setPage(key)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"10px 16px", background:"none", border:"none", borderBottom:`2px solid ${active?T.accent:"transparent"}`, cursor:"pointer", fontFamily:"'Outfit',sans-serif", color:active?T.accent:T.textMid, transition:"all 0.15s", whiteSpace:"nowrap", minWidth:72 }}>
                  <Icon s={20}/>
                  <span style={{ fontSize:10, fontWeight:active?600:400, letterSpacing:"0.3px" }}>{label}</span>
                </button>
            );
          })}
        </div>
      </header>
  );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
function Placeholder({ title, T }) {
  return (
      <div style={{ padding:"40px", minHeight:"calc(100vh - 120px)", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", border:`1px dashed ${T.border2}`, borderRadius:16, padding:"60px 80px" }}>
          <strong style={{ color:T.textMid, fontSize:18 }}>{title}</strong>
          <p style={{ fontSize:12, color:T.textDim, marginTop:8 }}>Coming soon.</p>
        </div>
      </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function App() {
  const [themeName, setThemeName] = useState("dark");
  const [view,      setView]      = useState("landing");
  const [user,      setUser]      = useState(null);
  const [page,      setPage]      = useState("dashboard");

  const T = THEMES[themeName];

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") setThemeName(saved);

    // Check OAuth2 callback FIRST before anything else
    if (window.location.pathname === "/oauth2/callback") {
      setView("oauth2");
      return;
    }

    const token = localStorage.getItem("token");
    const u     = localStorage.getItem("user");
    if (token && u) { setUser(JSON.parse(u)); setView("app"); }
  }, []);

  const toggleTheme = () => {
    const next = themeName === "dark" ? "light" : "dark";
    setThemeName(next);
    localStorage.setItem("theme", next);
  };

  const handleLogin = (d) => {
    if (!d) return;  // ← adaugă asta
    setUser({ email: d.email, name: d.name, role: d.role });
    setView("app");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setView("landing");
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":  return <Dashboard />;
      case "clients":    return <Clients />;
      case "invoices":   return <Invoices />;
      case "expenses":   return <Expenses />;
      case "suppliers":  return <Suppliers />;
      case "supinv":     return <SupplierInvoices />;
      case "bank":       return <Bank />;
      case "reports":    return <Reports />;
      case "accounts":   return <ChartOfAccounts />;
      case "users":      return <Placeholder title="Users" T={T}/>;
      case "taxrates":   return <Placeholder title="Tax Rates" T={T}/>;
      default:           return <Placeholder title={page} T={T}/>;
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
        input:focus, textarea:focus { border-color:${T.accent} !important; }
        @keyframes blink { 0%,100%{border-color:currentColor} 50%{border-color:transparent} }
        @keyframes shapeFloat1 { 0%,100%{transform:rotate(18deg) translateY(0)} 50%{transform:rotate(18deg) translateY(-18px)} }
        @keyframes shapeFloat2 { 0%,100%{transform:rotate(35deg) translateY(0)} 50%{transform:rotate(35deg) translateY(14px)} }
        @keyframes shapeFloat3 { 0%,100%{transform:rotate(22deg) scale(1)} 50%{transform:rotate(22deg) scale(1.08)} }
      `}</style>

        {view === "landing" && (
            <Landing T={T} themeName={themeName} onToggleTheme={toggleTheme} onEnter={() => setView("login")} />
        )}

        {view === "login" && (
            (() => {
              try {
                return <LoginPage onLogin={handleLogin} onBack={() => setView("landing")} />;
              } catch(e) {
                return <div style={{color:"red"}}>{e.message}</div>;
              }
            })()
        )}

        {view === "oauth2" && (
            <OAuth2Callback onLogin={handleLogin} />
        )}

        {view === "app" && user && (
            <div style={{ minHeight:"100vh", background:T.bg, display:"flex", flexDirection:"column" }}>
              <TopNav page={page} setPage={setPage} user={user} T={T} onToggle={toggleTheme} onLogout={handleLogout} isAdmin={user.role==="ADMIN"} />
              <main style={{ flex:1, overflowY:"auto" }}>
                {renderPage()}
              </main>
            </div>
        )}
      </ThemeContext.Provider>
  );
}