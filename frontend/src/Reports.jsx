import { useTheme } from "./App";
import { useState, useEffect, useCallback, useMemo } from "react";

const API_BASE = "http://localhost:8080";

function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmt(n)  { return new Intl.NumberFormat("ro-RO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n??0); }
function fmtD(s) { return s ? new Date(s).toLocaleDateString("ro-RO",{day:"2-digit",month:"2-digit",year:"numeric"}) : "—"; }
function today() { return new Date().toISOString().split("T")[0]; }
function fy()    { return `${new Date().getFullYear()}-01-01`; }

function getPeriod(key) {
    const now=new Date(), y=now.getFullYear(), m=now.getMonth();
    if (key==="month")   { const l=new Date(y,m+1,0); return { from:`${y}-${String(m+1).padStart(2,"0")}-01`, to:`${y}-${String(m+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}` }; }
    if (key==="quarter") { const q=Math.floor(m/3), qm=q*3, l=new Date(y,qm+3,0); return { from:`${y}-${String(qm+1).padStart(2,"0")}-01`, to:`${l.getFullYear()}-${String(l.getMonth()+1).padStart(2,"0")}-${String(l.getDate()).padStart(2,"0")}` }; }
    if (key==="year")    return { from:`${y}-01-01`, to:`${y}-12-31` };
    return { from:fy(), to:today() };
}

const REPORT_GROUPS = [
    { group:"Rapoarte principale", items:[
            { key:"pl",       label:"Profit & Pierdere"  },
            { key:"bs",       label:"Bilant contabil"    },
        ]},
    { group:"Registre contabile", items:[
            { key:"trial",    label:"Balanta contabila"  },
            { key:"ledger",   label:"Fisa de cont"       },
            { key:"journal",  label:"Registru jurnal"    },
        ]},
    { group:"Jurnale TVA", items:[
            { key:"sales",    label:"Jurnal vanzari"     },
            { key:"purchase", label:"Jurnal cumparari"   },
        ]},
    { group:"Situatii parteneri", items:[
            { key:"clients",   label:"Situatie clienti"  },
            { key:"suppliers", label:"Situatie furnizori"},
        ]},
];

const PERIODS = [
    { key:"month",   label:"Luna curenta"   },
    { key:"quarter", label:"Trim. curent"   },
    { key:"year",    label:"Anul curent"    },
    { key:"custom",  label:"Personalizat"   },
];

const inputStyle = (C) => ({ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"9px 12px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", outline:"none", transition:"border-color 0.2s" });

export default function Reports() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", cardAlt:"#0f1117", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", accent:"#a78bfa", isDark:true };

    const [active, setActive]   = useState(null);
    const [period, setPeriod]   = useState("year");
    const [from, setFrom]       = useState(fy());
    const [to, setTo]           = useState(today());
    const [asOf, setAsOf]       = useState(today());
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState("");
    const [accounts, setAccounts] = useState([]);
    const [selAccount, setSelAcc] = useState("");

    useEffect(() => {
        fetch(`${API_BASE}/api/accounts`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>setAccounts(Array.isArray(d)?d:[])).catch(()=>{});
    }, []);

    const applyPeriod = (key) => {
        setPeriod(key);
        if (key!=="custom") { const p=getPeriod(key); setFrom(p.from); setTo(p.to); }
    };

    const generate = useCallback(async () => {
        if (!active) return;
        setLoading(true); setErr(""); setData(null);
        const urls = {
            pl:       `/api/reports/profit-and-loss?from=${from}&to=${to}`,
            bs:       `/api/reports/balance-sheet?asOf=${asOf}`,
            cf:       `/api/reports/cash-flow?from=${from}&to=${to}`,
            trial:    `/api/reports/trial-balance?from=${from}&to=${to}`,
            ledger:   selAccount ? `/api/reports/account-ledger/${selAccount}?from=${from}&to=${to}` : null,
            journal:  `/api/reports/general-journal?from=${from}&to=${to}`,
            sales:    `/api/reports/sales-journal?from=${from}&to=${to}`,
            purchase: `/api/reports/purchase-journal?from=${from}&to=${to}`,
            clients:  `/api/reports/client-statement?from=${from}&to=${to}`,
            suppliers:`/api/reports/supplier-statement?from=${from}&to=${to}`,
        };
        const url = urls[active];
        if (!url) { setErr("Selecteaza un cont pentru fisa de cont."); setLoading(false); return; }
        try {
            const res = await fetch(`${API_BASE}${url}`, { headers:authHeaders() });
            if (!res.ok) { setErr("Eroare la incarcarea raportului."); setLoading(false); return; }
            setData(await res.json());
        } catch { setErr("Eroare server."); }
        setLoading(false);
    }, [active, from, to, asOf, selAccount]);

    const selectReport = (key) => { setActive(key); setData(null); setErr(""); };

    const needsAsOf    = active === "bs";
    const needsAccount = active === "ledger";
    const activeLabel  = REPORT_GROUPS.flatMap(g=>g.items).find(r=>r.key===active)?.label ?? "";

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* REPORT TYPE TABS — grouped */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
                {REPORT_GROUPS.map(group=>(
                    <div key={group.group} style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                        <span style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:600, minWidth:148, flexShrink:0 }}>{group.group}</span>
                        {group.items.map(item=>{
                            const on = active===item.key;
                            return (
                                <button key={item.key} onClick={()=>selectReport(item.key)}
                                        style={{ border:`1px solid ${on?C.blue:C.border}`, borderRadius:8, padding:"6px 16px", fontSize:12, fontWeight:on?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:on?`${C.blue}18`:C.card, color:on?C.blue:C.textMid, transition:"all 0.15s" }}>
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* CONTROLS BAR */}
            {active && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24, padding:"14px 18px", background:C.card, border:`1px solid ${C.border}`, borderRadius:14, flexWrap:"wrap" }}>

                    {!needsAsOf && (
                        <>
                            <div style={{ display:"flex", gap:4 }}>
                                {PERIODS.map(p=>(
                                    <button key={p.key} onClick={()=>applyPeriod(p.key)}
                                            style={{ border:`1px solid ${period===p.key?C.blue:C.border2}`, borderRadius:7, padding:"6px 12px", fontSize:11, fontWeight:period===p.key?600:400, color:period===p.key?C.blue:C.textMid, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:period===p.key?`${C.blue}18`:C.bg, transition:"all 0.15s" }}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            {period==="custom" && (
                                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                    <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{...inputStyle(C), width:148}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                    <span style={{ color:C.textDim, fontSize:12 }}>—</span>
                                    <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{...inputStyle(C), width:148}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                </div>
                            )}
                            {period!=="custom" && (
                                <span style={{ fontSize:12, color:C.textDim }}>{fmtD(from)} — {fmtD(to)}</span>
                            )}
                        </>
                    )}

                    {needsAsOf && (
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <span style={{ fontSize:12, color:C.textMid }}>La data de</span>
                            <input type="date" value={asOf} onChange={e=>setAsOf(e.target.value)} style={{...inputStyle(C), width:160}} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border2}/>
                        </div>
                    )}

                    {needsAccount && (
                        <select value={selAccount} onChange={e=>setSelAcc(e.target.value)}
                                style={{...inputStyle(C), minWidth:280, color:selAccount?C.text:C.textDim}}>
                            <option value="">Selecteaza contul...</option>
                            {accounts.filter(a=>a.isActive!==false&&a.subType!=="Clasa"&&a.subType!=="Grupa").sort((a,b)=>a.code.localeCompare(b.code)).map(a=>(
                                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                            ))}
                        </select>
                    )}

                    <div style={{ flex:1 }}/>

                    <button onClick={generate} disabled={loading}
                            style={{ background:C.blue, border:"none", borderRadius:9, padding:"9px 22px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:"'Outfit',sans-serif", opacity:loading?0.7:1, whiteSpace:"nowrap" }}>
                        {loading ? "Se incarca..." : "Genereaza"}
                    </button>
                </div>
            )}

            {/* CONTENT AREA */}
            {!active && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:360, background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
                    <div style={{ textAlign:"center" }}>
                        <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>Selecteaza un tip de raport</p>
                        <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Alege din grupele de mai sus si apasa Genereaza.</p>
                    </div>
                </div>
            )}

            {active && !loading && !data && !err && (
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:280, background:C.card, border:`1px solid ${C.border}`, borderRadius:16 }}>
                    <div style={{ textAlign:"center" }}>
                        <p style={{ fontSize:14, fontWeight:600, color:C.text, margin:0 }}>{activeLabel}</p>
                        <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Configureaza perioada si apasa Genereaza.</p>
                    </div>
                </div>
            )}

            {loading && (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}>
                    <Spin C={C}/>
                </div>
            )}

            {err && <div style={{ background:"#b07a7a12", border:"1px solid #b07a7a30", borderRadius:10, padding:"12px 16px", color:"#b07a7a", fontSize:13 }}>⚠ {err}</div>}

            {!loading && !err && data && (
                <div style={{ animation:"fadeUp 0.25s ease" }}>
                    {active==="pl"       && <ViewPL       data={data} C={C} from={from} to={to}/>}
                    {active==="bs"       && <ViewBS       data={data} C={C} asOf={asOf}/>}
                    {active==="trial"    && <ViewTrial    data={data} C={C} from={from} to={to}/>}
                    {active==="ledger"   && <ViewLedger   data={data} C={C}/>}
                    {active==="journal"  && <ViewJournal  data={data} C={C} from={from} to={to}/>}
                    {active==="sales"    && <ViewSales    data={data} C={C} from={from} to={to}/>}
                    {active==="purchase" && <ViewPurchase data={data} C={C} from={from} to={to}/>}
                    {active==="clients"  && <ViewClients  data={data} C={C} from={from} to={to}/>}
                    {active==="suppliers"&& <ViewSuppliers data={data} C={C} from={from} to={to}/>}
                </div>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark?"invert(1)":"none"}; opacity:0.5; }
        .rpt-tr:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
      `}</style>
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════
   SHARED LAYOUT HELPERS
   ════════════════════════════════════════════════════════════════════ */

function RHeader({ title, subtitle, C }) {
    return (
        <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:18, fontWeight:700, color:C.text, letterSpacing:"-0.4px", margin:0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize:13, color:C.textDim, marginTop:4 }}>{subtitle}</p>}
        </div>
    );
}

function CompanyBanner({ C, period }) {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const companyName = user.companyName || "—";
    const companyCode = user.companyCode || "—";

    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 18px", marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:10 }}>
            <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.text, letterSpacing:"0.2px" }}>{companyName}</div>
                <div style={{ fontSize:10, color:C.textDim, marginTop:2 }}>Cod: {companyCode}</div>
            </div>
            {period && <div style={{ fontSize:11, color:C.textMid }}>{period}</div>}
        </div>
    );
}

function SummaryCards({ cards, C }) {
    return (
        <div style={{ display:"grid", gridTemplateColumns:`repeat(${cards.length},1fr)`, gap:12, marginBottom:20 }}>
            {cards.map((card,i)=>(
                <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"14px 18px" }}>
                    <div style={{ width:24, height:3, background:card.color, borderRadius:99, marginBottom:10 }}/>
                    <div style={{ fontSize:18, fontWeight:700, color:C.text, letterSpacing:"-0.3px" }}>{card.value}</div>
                    <div style={{ fontSize:10, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.6px", marginTop:4 }}>{card.label}</div>
                </div>
            ))}
        </div>
    );
}

function RTable({ headers, children, C }) {
    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {headers.map((h,i)=>(
                        <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 16px", textAlign:h.right?"right":"left", whiteSpace:"nowrap" }}>{h.label}</th>
                    ))}
                </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </div>
    );
}

function RTableFoot({ cols, C }) {
    return (
        <tfoot>
        <tr style={{ borderTop:`2px solid ${C.border2}`, background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)" }}>
            {cols.map((col,i)=>(
                <td key={i} style={{ padding:"12px 16px", fontSize:12, fontWeight:700, color:col.color||C.text, textAlign:col.right?"right":"left" }}>{col.value}</td>
            ))}
        </tr>
        </tfoot>
    );
}

function Td({ children, right, mono, style: extra={} }) {
    return (
        <td style={{ padding:"10px 16px", fontSize:12, textAlign:right?"right":"left", fontFamily:mono?"monospace":"inherit", ...extra }}>
            {children}
        </td>
    );
}

function StatusPill({ status }) {
    const map = {
        SENT:["Trimisa","#7b9cba"], PAID:["Achitata","#7aab8a"], OVERDUE:["Restanta","#b07a7a"],
        PENDING:["Neachitata","#b09a6a"], VOID:["Anulata","#6b7280"], DRAFT:["Ciorna","#6b7280"],
    };
    const [label, color] = map[status]||[status,"#6b7280"];
    return <span style={{ fontSize:10, fontWeight:600, color, background:`${color}18`, border:`1px solid ${color}30`, borderRadius:6, padding:"3px 8px" }}>{label}</span>;
}

function PnLSection({ title, lines, total, color, C }) {
    if (!lines?.length) return null;
    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:12 }}>
            <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:`${color}0a` }}>
                <span style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.7px" }}>{title}</span>
            </div>
            {lines.map((l,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color, width:56, flexShrink:0 }}>{l.accountCode}</span>
                    <span style={{ fontSize:13, color:C.textMid, flex:1 }}>{l.accountName}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.text }}>RON {fmt(l.amount)}</span>
                </div>
            ))}
            <div style={{ display:"flex", padding:"12px 20px", background:`${color}08` }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text, flex:1 }}>Total {title}</span>
                <span style={{ fontSize:15, fontWeight:800, color, letterSpacing:"-0.3px" }}>RON {fmt(total)}</span>
            </div>
        </div>
    );
}

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:C.blue, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>; }

/* ════════════════════════════════════════════════════════════════════
   REPORT VIEWS
   ════════════════════════════════════════════════════════════════════ */

/* ── Profit & Pierdere ── */
function ViewPL({ data, C, from, to }) {
    const net = parseFloat(data.netProfit);
    return (
        <div style={{ maxWidth:720 }}>
            <CompanyBanner C={C} period={`Perioada: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Cont de Profit si Pierdere" subtitle={`Perioada: ${fmtD(from)} — ${fmtD(to)}`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Total Venituri",  value:`RON ${fmt(data.totalRevenue)}`,  color:"#7aab8a" },
                { label:"Total Cheltuieli",value:`RON ${fmt(data.totalExpenses)}`, color:"#b07a7a" },
                { label:"Profit Net",      value:`RON ${fmt(data.netProfit)}`,     color:net>=0?"#7aab8a":"#b07a7a" },
            ]}/>
            <PnLSection title="Venituri"    lines={data.revenueLines} total={data.totalRevenue}  color="#7aab8a" C={C}/>
            <PnLSection title="Cheltuieli"  lines={data.expenseLines} total={data.totalExpenses} color="#b07a7a" C={C}/>
            <div style={{ background:net>=0?"#7aab8a12":"#b07a7a12", border:`1.5px solid ${net>=0?"#7aab8a40":"#b07a7a40"}`, borderRadius:14, padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Profit net al perioadei</span>
                <span style={{ fontSize:22, fontWeight:800, color:net>=0?"#7aab8a":"#b07a7a", letterSpacing:"-0.5px" }}>RON {fmt(data.netProfit)}</span>
            </div>
        </div>
    );
}

/* ── Bilant ── */
function ViewBS({ data, C, asOf }) {
    const bal = Math.abs(parseFloat(data.totalAssets)-parseFloat(data.totalLiabilitiesAndEquity))<0.01;
    const BSSection = ({title, lines, total, color}) => (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden", marginBottom:12 }}>
            <div style={{ padding:"10px 20px", borderBottom:`1px solid ${C.border}`, background:`${color}0a` }}>
                <span style={{ fontSize:11, fontWeight:700, color, textTransform:"uppercase", letterSpacing:"0.7px" }}>{title}</span>
            </div>
            {lines?.map((l,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", padding:"10px 20px", borderBottom:`1px solid ${C.border}` }}>
                    <span style={{ fontFamily:"monospace", fontSize:12, fontWeight:700, color, width:56, flexShrink:0 }}>{l.accountCode}</span>
                    <span style={{ fontSize:13, color:C.textMid, flex:1 }}>{l.accountName}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:C.text }}>RON {fmt(l.amount)}</span>
                </div>
            ))}
            <div style={{ display:"flex", padding:"12px 20px", background:`${color}08` }}>
                <span style={{ fontSize:13, fontWeight:700, color:C.text, flex:1 }}>Total {title}</span>
                <span style={{ fontSize:15, fontWeight:800, color, letterSpacing:"-0.3px" }}>RON {fmt(total)}</span>
            </div>
        </div>
    );
    return (
        <div>
            <CompanyBanner C={C} period={`La data de ${fmtD(asOf)}`}/>
            <RHeader title="Bilant Contabil" subtitle={`La data de ${fmtD(asOf)}`} C={C}/>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
                <div>
                    <BSSection title="Active" lines={data.assetLines} total={data.totalAssets} color="#7b9cba"/>
                </div>
                <div>
                    <BSSection title="Datorii" lines={data.liabilityLines} total={data.totalLiabilities} color="#b07a7a"/>
                    <BSSection title="Capitaluri proprii" lines={data.equityLines} total={data.totalEquity} color="#9b7ab0"/>
                </div>
            </div>
            <div style={{ marginTop:4, background:bal?"#7aab8a12":"#b07a7a12", border:`1.5px solid ${bal?"#7aab8a40":"#b07a7a40"}`, borderRadius:14, padding:"14px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, fontWeight:600, color:bal?"#7aab8a":"#b07a7a" }}>{bal?"Bilant echilibrat — Active = Datorii + Capital":"Dezechilibru detectat"}</span>
                <div style={{ display:"flex", gap:24 }}>
                    <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:C.textDim, textTransform:"uppercase" }}>Total Active</div><div style={{ fontSize:14, fontWeight:700, color:"#7b9cba" }}>RON {fmt(data.totalAssets)}</div></div>
                    <div style={{ textAlign:"right" }}><div style={{ fontSize:10, color:C.textDim, textTransform:"uppercase" }}>Datorii + Capital</div><div style={{ fontSize:14, fontWeight:700, color:"#9b7ab0" }}>RON {fmt(data.totalLiabilitiesAndEquity)}</div></div>
                </div>
            </div>
        </div>
    );
}

/* ── Flux numerar ── */
function ViewCF({ data, C }) {
    const net = parseFloat(data.netCashFlow);
    return (
        <div style={{ maxWidth:560 }}>
            <CompanyBanner C={C} period={`${fmtD(data.from)} — ${fmtD(data.to)}`}/>
            <RHeader title="Flux de Numerar" subtitle={`${fmtD(data.from)} — ${fmtD(data.to)}`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Intrari numerar",  value:`RON ${fmt(data.totalInflows)}`,  color:"#7aab8a" },
                { label:"Iesiri numerar",   value:`RON ${fmt(data.totalOutflows)}`,  color:"#b07a7a" },
                { label:"Flux net",         value:`RON ${fmt(data.netCashFlow)}`,    color:net>=0?"#7aab8a":"#b07a7a" },
            ]}/>
            <div style={{ background:net>=0?"#7aab8a12":"#b07a7a12", border:`1.5px solid ${net>=0?"#7aab8a40":"#b07a7a40"}`, borderRadius:14, padding:"18px 24px", display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.text }}>Flux net de numerar</span>
                <span style={{ fontSize:20, fontWeight:800, color:net>=0?"#7aab8a":"#b07a7a" }}>{net>=0?"+":""}RON {fmt(data.netCashFlow)}</span>
            </div>
        </div>
    );
}

/* ── Balanta de verificare (format SAGA: SI an / Rulaje perioada / Total rulaje / SF) ── */
function ViewTrial({ data, C, from, to }) {
    const TYPE_COLOR = { ASSET:"#7b9cba", LIABILITY:"#b07a7a", EQUITY:"#9b7ab0", REVENUE:"#7aab8a", EXPENSE:"#b09a6a" };
    const TYPE_LABEL = { ASSET:"A", LIABILITY:"P", EQUITY:"P", REVENUE:"V", EXPENSE:"Ch" };
    const totals = data.reduce((acc, l) => {
        ["siDebit","siCredit","rdDebit","rdCredit","trDebit","trCredit","sfDebit","sfCredit"].forEach(k => {
            // fallback: daca backendul nu trimite trDebit/trCredit, le calculam din SI + Rd
            let v = parseFloat(l[k]||0);
            if ((k==="trDebit" || k==="trCredit") && !l[k]) {
                const siKey = k==="trDebit" ? "siDebit" : "siCredit";
                const rdKey = k==="trDebit" ? "rdDebit" : "rdCredit";
                v = parseFloat(l[siKey]||0) + parseFloat(l[rdKey]||0);
            }
            acc[k]=(acc[k]||0)+v;
        });
        return acc;
    }, {});
    return (
        <div>
            <CompanyBanner C={C} period={`Balanta de verificare: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Balanta de Verificare" subtitle={`${fmtD(from)} — ${fmtD(to)} · ${data.length} conturi cu activitate`} C={C}/>

            {/* Header pe doua randuri pt grupare coloane (ca in SAGA) */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1100 }}>
                    <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                        <th rowSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"10px 12px", textAlign:"left", borderRight:`1px solid ${C.border}` }}>Cont</th>
                        <th rowSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"10px 12px", textAlign:"left", borderRight:`1px solid ${C.border}` }}>Denumire</th>
                        <th rowSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"10px 8px", textAlign:"center", borderRight:`1px solid ${C.border}` }}>Tip</th>
                        <th colSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"8px 12px", textAlign:"center", borderRight:`1px solid ${C.border}`, background:`${C.blue}06` }}>Solduri initiale an</th>
                        <th colSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"8px 12px", textAlign:"center", borderRight:`1px solid ${C.border}`, background:`${C.blue}06` }}>Rulaje perioada</th>
                        <th colSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"8px 12px", textAlign:"center", borderRight:`1px solid ${C.border}`, background:`${C.blue}06` }}>Total rulaje</th>
                        <th colSpan={2} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"8px 12px", textAlign:"center", background:`${C.blue}06` }}>Solduri finale</th>
                    </tr>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right" }}>Debit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right", borderRight:`1px solid ${C.border}` }}>Credit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right" }}>Debit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right", borderRight:`1px solid ${C.border}` }}>Credit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right" }}>Debit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right", borderRight:`1px solid ${C.border}` }}>Credit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right" }}>Debit</th>
                        <th style={{ fontSize:9, color:C.textDim, fontWeight:500, padding:"6px 10px", textAlign:"right" }}>Credit</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((l,i)=>{
                        const tc = TYPE_COLOR[l.accountType]||"#6b7280";
                        const trD = l.trDebit  != null ? parseFloat(l.trDebit)  : parseFloat(l.siDebit||0)+parseFloat(l.rdDebit||0);
                        const trC = l.trCredit != null ? parseFloat(l.trCredit) : parseFloat(l.siCredit||0)+parseFloat(l.rdCredit||0);
                        return (
                            <tr key={i} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.2s ease ${Math.min(i,30)*8}ms both` }}>
                                <td style={{ padding:"9px 12px", fontSize:12, fontFamily:"monospace", color:tc, fontWeight:700, borderRight:`1px solid ${C.border}` }}>{l.accountCode}</td>
                                <td style={{ padding:"9px 12px", fontSize:12, color:C.text, maxWidth:240, borderRight:`1px solid ${C.border}` }}>{l.accountName}</td>
                                <td style={{ padding:"9px 8px", fontSize:11, textAlign:"center", color:tc, fontWeight:700, borderRight:`1px solid ${C.border}` }}>{TYPE_LABEL[l.accountType]||"—"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:parseFloat(l.siDebit)>0?"#7b9cba":C.textDim, fontWeight:parseFloat(l.siDebit)>0?500:300 }}>{parseFloat(l.siDebit)>0?fmt(l.siDebit):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:parseFloat(l.siCredit)>0?"#7aab8a":C.textDim, fontWeight:parseFloat(l.siCredit)>0?500:300, borderRight:`1px solid ${C.border}` }}>{parseFloat(l.siCredit)>0?fmt(l.siCredit):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:parseFloat(l.rdDebit)>0?"#7b9cba":C.textDim, fontWeight:parseFloat(l.rdDebit)>0?500:300 }}>{parseFloat(l.rdDebit)>0?fmt(l.rdDebit):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:parseFloat(l.rdCredit)>0?"#7aab8a":C.textDim, fontWeight:parseFloat(l.rdCredit)>0?500:300, borderRight:`1px solid ${C.border}` }}>{parseFloat(l.rdCredit)>0?fmt(l.rdCredit):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:trD>0?"#7b9cba":C.textDim, fontWeight:trD>0?500:300 }}>{trD>0?fmt(trD):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:trC>0?"#7aab8a":C.textDim, fontWeight:trC>0?500:300, borderRight:`1px solid ${C.border}` }}>{trC>0?fmt(trC):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:parseFloat(l.sfDebit)>0?"#7b9cba":C.textDim, fontWeight:700 }}>{parseFloat(l.sfDebit)>0?fmt(l.sfDebit):"0.00"}</td>
                                <td style={{ padding:"9px 10px", fontSize:11, textAlign:"right", color:parseFloat(l.sfCredit)>0?"#7aab8a":C.textDim, fontWeight:700 }}>{parseFloat(l.sfCredit)>0?fmt(l.sfCredit):"0.00"}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                    <tfoot>
                    <tr style={{ borderTop:`2px solid ${C.border2}`, background:C.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)" }}>
                        <td colSpan={3} style={{ padding:"12px 12px", fontSize:11, fontWeight:800, color:C.text, textTransform:"uppercase", letterSpacing:"0.6px", borderRight:`1px solid ${C.border}` }}>Totaluri</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7b9cba", fontWeight:800 }}>{fmt(totals.siDebit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7aab8a", fontWeight:800, borderRight:`1px solid ${C.border}` }}>{fmt(totals.siCredit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7b9cba", fontWeight:800 }}>{fmt(totals.rdDebit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7aab8a", fontWeight:800, borderRight:`1px solid ${C.border}` }}>{fmt(totals.rdCredit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7b9cba", fontWeight:800 }}>{fmt(totals.trDebit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7aab8a", fontWeight:800, borderRight:`1px solid ${C.border}` }}>{fmt(totals.trCredit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7b9cba", fontWeight:800 }}>{fmt(totals.sfDebit)}</td>
                        <td style={{ padding:"12px 10px", fontSize:11, textAlign:"right", color:"#7aab8a", fontWeight:800 }}>{fmt(totals.sfCredit)}</td>
                    </tr>
                    </tfoot>
                </table>
            </div>
            <p style={{ fontSize:11, color:C.textDim, marginTop:10 }}>Legenda tip: A = Activ · P = Pasiv · V = Venit · Ch = Cheltuiala. Totalurile pe Debit si Credit trebuie sa fie egale (principiul partidei duble).</p>
        </div>
    );
}

/* ── Fisa cont (format SAGA: data, nr.doc, explicatie, cont, cont coresp, debit, credit, sold, D/C) ── */
function ViewLedger({ data, C }) {
    const isClosing = (desc) => /inchidere|închidere/i.test(desc||"");
    return (
        <div>
            <CompanyBanner C={C} period={`${fmtD(data.from)} — ${fmtD(data.to)}`}/>
            <RHeader title={`Fisa Cont — ${data.accountCode} ${data.accountName}`} subtitle={`Perioada: ${fmtD(data.from)} — ${fmtD(data.to)}`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Sold initial",  value:`RON ${fmt(data.soldInitial)}`, color:"#7b9cba" },
                { label:"Total Debit",   value:`RON ${fmt(data.totalDebit)}`,  color:"#7b9cba" },
                { label:"Total Credit",  value:`RON ${fmt(data.totalCredit)}`, color:"#7aab8a" },
                { label:"Sold final",    value:`RON ${fmt(data.soldFinal)}`,   color:parseFloat(data.soldFinal)>=0?"#7aab8a":"#b07a7a" },
            ]}/>

            {/* Banner "Sold initial la inceputul perioadei" — ca in SAGA */}
            <div style={{ background:`${C.blue}08`, border:`1px solid ${C.blue}30`, borderRadius:10, padding:"10px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600 }}>Sold initial la inceputul perioadei</span>
                <span style={{ fontSize:14, fontWeight:700, color:parseFloat(data.soldInitial)>=0?"#7b9cba":"#b07a7a" }}>RON {fmt(data.soldInitial)} {parseFloat(data.soldInitial)>=0?"D":"C"}</span>
            </div>

            <RTable C={C} headers={[
                {label:"Data"},{label:"Nr. doc"},{label:"Explicatie"},
                {label:"Debit",right:true},{label:"Credit",right:true},
                {label:"Sold",right:true},{label:"D/C"},
            ]}>
                {data.lines?.length===0 && (
                    <tr><td colSpan={9} style={{ padding:"40px", textAlign:"center", color:C.textDim, fontSize:13 }}>Nicio miscare in aceasta perioada.</td></tr>
                )}
                {data.lines?.map((l,i)=>{
                    const closing = isClosing(l.description);
                    const balNum = parseFloat(l.balance);
                    return (
                        <tr key={i} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.2s ease ${Math.min(i,30)*8}ms both`, background:closing?(C.isDark?"rgba(155,122,176,0.06)":"rgba(155,122,176,0.04)"):"transparent", fontStyle:closing?"italic":"normal" }}>
                            <Td style={{ color:C.textMid, whiteSpace:"nowrap" }}>{fmtD(l.date)}</Td>
                            <Td mono style={{ color:closing?"#9b7ab0":C.accent, fontSize:11 }}>{l.reference || "—"}</Td>
                            <Td style={{ color:C.text, maxWidth:280 }}><span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.description}</span></Td>
                            <Td right style={{ color:"#7b9cba", fontWeight:500 }}>{parseFloat(l.debit)>0?fmt(l.debit):"0.00"}</Td>
                            <Td right style={{ color:"#7aab8a", fontWeight:500 }}>{parseFloat(l.credit)>0?fmt(l.credit):"0.00"}</Td>
                            <Td right style={{ color:balNum>=0?"#7aab8a":"#b07a7a", fontWeight:700 }}>{fmt(Math.abs(balNum))}</Td>
                            <Td style={{ color:balNum>=0?"#7aab8a":"#b07a7a", fontWeight:700, fontSize:11, textAlign:"center" }}>{balNum>=0?"D":"C"}</Td>
                        </tr>
                    );
                })}
                <RTableFoot C={C} cols={[
                    {value:"RULAJ TOTAL"},{value:""},{value:""},{value:""},{value:""},
                    {value:fmt(data.totalDebit), color:"#7b9cba", right:true},
                    {value:fmt(data.totalCredit), color:"#7aab8a", right:true},
                    {value:fmt(Math.abs(parseFloat(data.soldFinal||0))), color:parseFloat(data.soldFinal)>=0?"#7aab8a":"#b07a7a", right:true},
                    {value:parseFloat(data.soldFinal)>=0?"D":"C", color:parseFloat(data.soldFinal)>=0?"#7aab8a":"#b07a7a"},
                ]}/>
            </RTable>

            <div style={{ marginTop:14, background:`${C.accent}08`, border:`1px solid ${C.accent}25`, borderRadius:10, padding:"10px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600 }}>Sold final la sfarsitul perioadei</span>
                <span style={{ fontSize:14, fontWeight:700, color:parseFloat(data.soldFinal)>=0?"#7aab8a":"#b07a7a" }}>RON {fmt(Math.abs(parseFloat(data.soldFinal||0)))} {parseFloat(data.soldFinal)>=0?"debitor":"creditor"}</span>
            </div>
        </div>
    );
}

/* ── Registru jurnal (grupare pe zi cu subtotaluri, ca in SAGA) ── */
function ViewJournal({ data, C, from, to }) {
    // Grupam pe data
    const grouped = useMemo(() => {
        const m = new Map();
        for (const l of data) {
            const k = l.date;
            if (!m.has(k)) m.set(k, []);
            m.get(k).push(l);
        }
        return Array.from(m.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
    }, [data]);

    const grandD = data.reduce((s,l)=>s+parseFloat(l.debit||0),0);
    const grandC = data.reduce((s,l)=>s+parseFloat(l.credit||0),0);

    // Tipul tranzactiei (badge color)
    const TYPE_STYLE = {
        "Banca":     "#7b9cba",
        "Casa":      "#b09a6a",
        "Intrari":   "#b07a7a",
        "Iesiri":    "#7aab8a",
        "Salarii":   "#9b7ab0",
        "Inchidere": "#6b7280",
        "Amortizare":"#9b7ab0",
        "TVA - plata":"#b09a6a",
        "TVA - incasare":"#b09a6a",
    };

    return (
        <div>
            <CompanyBanner C={C} period={`Registru jurnal: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Registru Jurnal" subtitle={`${data.length} linii contabile, ${grouped.length} zile cu activitate`} C={C}/>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left", width:50 }}>Nr.</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left" }}>Data</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left" }}>Explicatie</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left" }}>Nr. doc.</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left" }}>Cont D</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left" }}>Cont C</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"right" }}>Debit</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"right" }}>Credit</th>
                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 14px", textAlign:"left" }}>Tip</th>
                    </tr>
                    </thead>
                    <tbody>
                    {grouped.map(([day, lines], gi)=>{
                        const dayD = lines.reduce((s,l)=>s+parseFloat(l.debit||0),0);
                        const dayC = lines.reduce((s,l)=>s+parseFloat(l.credit||0),0);
                        return (
                            <Fragment key={day}>
                                {lines.map((l,i)=>{
                                    const tipColor = TYPE_STYLE[l.type] || "#6b7280";
                                    return (
                                        <tr key={`${day}-${i}`} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.15s ease ${Math.min(i+gi*5,40)*4}ms both` }}>
                                            <Td style={{ color:C.textDim, fontSize:10 }}>{l.lineNumber || ""}</Td>
                                            <Td style={{ color:C.textMid, whiteSpace:"nowrap", fontSize:11 }}>{fmtD(l.date)}</Td>
                                            <Td style={{ color:C.text, maxWidth:240 }}><span style={{ display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.description}</span></Td>
                                            <Td mono style={{ color:C.accent, fontSize:10 }}>{l.reference || "—"}</Td>
                                            <Td mono style={{ color:parseFloat(l.debit||0)>0?"#7b9cba":C.textDim, fontWeight:parseFloat(l.debit||0)>0?700:400, fontSize:11 }}>{l.debitAccountCode || (parseFloat(l.debit||0)>0?l.accountCode:"—")}</Td>
                                            <Td mono style={{ color:parseFloat(l.credit||0)>0?"#7aab8a":C.textDim, fontWeight:parseFloat(l.credit||0)>0?700:400, fontSize:11 }}>{l.creditAccountCode || (parseFloat(l.credit||0)>0?l.accountCode:"—")}</Td>
                                            <Td right style={{ color:"#7b9cba", fontWeight:500 }}>{parseFloat(l.debit)>0?fmt(l.debit):"—"}</Td>
                                            <Td right style={{ color:"#7aab8a", fontWeight:500 }}>{parseFloat(l.credit)>0?fmt(l.credit):"—"}</Td>
                                            <Td>{l.type ? <span style={{ fontSize:10, fontWeight:600, color:tipColor, background:`${tipColor}18`, border:`1px solid ${tipColor}30`, borderRadius:5, padding:"2px 7px" }}>{l.type}</span> : "—"}</Td>
                                        </tr>
                                    );
                                })}
                                {/* Subtotal pe zi - ca in SAGA "Total pe DD.MM.YYYY" */}
                                <tr style={{ borderBottom:`2px solid ${C.border2}`, background:C.isDark?"rgba(123,156,186,0.05)":"rgba(123,156,186,0.04)" }}>
                                    <td colSpan={6} style={{ padding:"8px 14px", fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.5px" }}>Total pe {fmtD(day)}</td>
                                    <td style={{ padding:"8px 14px", fontSize:11, fontWeight:700, color:"#7b9cba", textAlign:"right" }}>{fmt(dayD)}</td>
                                    <td style={{ padding:"8px 14px", fontSize:11, fontWeight:700, color:"#7aab8a", textAlign:"right" }}>{fmt(dayC)}</td>
                                    <td/>
                                </tr>
                            </Fragment>
                        );
                    })}
                    </tbody>
                    <tfoot>
                    <tr style={{ borderTop:`2px solid ${C.border2}`, background:C.isDark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)" }}>
                        <td colSpan={6} style={{ padding:"14px", fontSize:12, fontWeight:800, color:C.text, textTransform:"uppercase", letterSpacing:"0.6px" }}>Total perioada</td>
                        <td style={{ padding:"14px", fontSize:12, fontWeight:800, color:"#7b9cba", textAlign:"right" }}>{fmt(grandD)}</td>
                        <td style={{ padding:"14px", fontSize:12, fontWeight:800, color:"#7aab8a", textAlign:"right" }}>{fmt(grandC)}</td>
                        <td/>
                    </tr>
                    </tfoot>
                </table>
            </div>
            <p style={{ fontSize:11, color:C.textDim, marginTop:10 }}>Total Debit = Total Credit (principiul partidei duble). {data.length} inregistrari afisate, grupate pe zi.</p>
        </div>
    );
}

// React Fragment shorthand pt mapare grupata
const Fragment = ({ children }) => <>{children}</>;

/* ── Jurnal de vanzari — cu summary pe coduri TVA, ca in SAGA ── */
function ViewSales({ data, C, from, to }) {
    const tSub = data.reduce((s,l)=>s+parseFloat(l.subtotal||0),0);
    const tVat = data.reduce((s,l)=>s+parseFloat(l.vatAmount||0),0);
    const tTot = data.reduce((s,l)=>s+parseFloat(l.total||0),0);

    // Summary pe cota TVA / cod referinta — ca tabelul de sus in SAGA
    const byVat = useMemo(() => {
        const m = new Map();
        for (const l of data) {
            const rate = l.vatRate || (parseFloat(l.vatAmount||0)===0 ? "0" : "—");
            const code = l.vatRefCode || labelForVatRate(rate, "sales");
            const k = `${rate}|${code}`;
            if (!m.has(k)) m.set(k, { rate, code, sub:0, vat:0, tot:0, count:0 });
            const r = m.get(k);
            r.sub += parseFloat(l.subtotal||0);
            r.vat += parseFloat(l.vatAmount||0);
            r.tot += parseFloat(l.total||0);
            r.count += 1;
        }
        return Array.from(m.values()).sort((a,b)=>a.code.localeCompare(b.code));
    }, [data]);

    return (
        <div>
            <CompanyBanner C={C} period={`Jurnal de vanzari: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Jurnal de Vanzari" subtitle={`${data.length} facturi emise · ${byVat.length} categorii TVA`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Baza impozabila", value:`RON ${fmt(tSub)}`, color:"#7b9cba" },
                { label:"TVA colectata",   value:`RON ${fmt(tVat)}`, color:"#b09a6a" },
                { label:"Total facturi",   value:`RON ${fmt(tTot)}`, color:"#7aab8a" },
            ]}/>

            {/* Summary pe categorii TVA */}
            <div style={{ marginBottom:18, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:`${C.blue}06` }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.blue, textTransform:"uppercase", letterSpacing:"0.7px" }}>Sumar pe cote TVA (referinte D300)</span>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"left", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Referinta</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"left", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Denumire</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Nr. doc.</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Total (cu TVA)</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Baza TVA</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Valoare TVA</th>
                    </tr>
                    </thead>
                    <tbody>
                    {byVat.map((r,i)=>(
                        <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                            <td style={{ padding:"8px 14px", fontSize:11, fontFamily:"monospace", color:C.accent, fontWeight:700 }}>{r.code}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:C.textMid }}>{labelForVatRate(r.rate, "sales")}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:C.textMid, textAlign:"right" }}>{r.count}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:C.text, fontWeight:700, textAlign:"right" }}>{fmt(r.tot)}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:"#7b9cba", textAlign:"right" }}>{fmt(r.sub)}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:"#b09a6a", textAlign:"right" }}>{fmt(r.vat)}</td>
                        </tr>
                    ))}
                    <tr style={{ background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)" }}>
                        <td colSpan={2} style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:C.text, textTransform:"uppercase" }}>Toate referintele</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:C.text, textAlign:"right" }}>{data.length}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:C.text, textAlign:"right" }}>{fmt(tTot)}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:"#7b9cba", textAlign:"right" }}>{fmt(tSub)}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:"#b09a6a", textAlign:"right" }}>{fmt(tVat)}</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* Detaliu facturi */}
            <RTable C={C} headers={[
                {label:"Cod ref."},{label:"Data"},{label:"Nr. doc."},{label:"Client"},{label:"CIF"},{label:"%"},
                {label:"Total",right:true},{label:"Baza",right:true},{label:"TVA",right:true},{label:"Status"},
            ]}>
                {data.map((l,i)=>(
                    <tr key={i} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.15s ease ${Math.min(i,40)*5}ms both` }}>
                        <Td mono style={{ color:C.accent, fontSize:10 }}>{l.vatRefCode || labelForVatRate(l.vatRate, "sales")}</Td>
                        <Td style={{ color:C.textMid, whiteSpace:"nowrap", fontSize:11 }}>{fmtD(l.date)}</Td>
                        <Td mono style={{ color:C.text, fontSize:11, fontWeight:700 }}>{l.invoiceNumber}</Td>
                        <Td style={{ color:C.text, fontWeight:500 }}>{l.clientName}</Td>
                        <Td style={{ color:C.textDim, fontSize:11 }}>{l.clientTaxId||"—"}</Td>
                        <Td style={{ color:"#b09a6a", fontSize:11, fontWeight:600 }}>{vatRatePct(l.vatRate)}</Td>
                        <Td right style={{ color:C.text, fontWeight:700 }}>{fmt(l.total)}</Td>
                        <Td right style={{ color:"#7b9cba" }}>{fmt(l.subtotal)}</Td>
                        <Td right style={{ color:"#b09a6a" }}>{fmt(l.vatAmount)}</Td>
                        <Td><StatusPill status={l.status}/></Td>
                    </tr>
                ))}
                <RTableFoot C={C} cols={[
                    {value:"TOTAL"},{value:""},{value:""},{value:""},{value:""},{value:""},
                    {value:`RON ${fmt(tTot)}`, color:"#7aab8a", right:true},
                    {value:`RON ${fmt(tSub)}`, color:"#7b9cba", right:true},
                    {value:`RON ${fmt(tVat)}`, color:"#b09a6a", right:true},
                    {value:""},
                ]}/>
            </RTable>
        </div>
    );
}

/* ── Jurnal de cumparari — cu summary pe coduri TVA ── */
function ViewPurchase({ data, C, from, to }) {
    const tSub = data.reduce((s,l)=>s+parseFloat(l.subtotal||0),0);
    const tVat = data.reduce((s,l)=>s+parseFloat(l.vatAmount||0),0);
    const tTot = data.reduce((s,l)=>s+parseFloat(l.total||0),0);

    const byVat = useMemo(() => {
        const m = new Map();
        for (const l of data) {
            const rate = l.vatRate || (parseFloat(l.vatAmount||0)===0 ? "0" : "—");
            const code = l.vatRefCode || labelForVatRate(rate, "purchase");
            const k = `${rate}|${code}`;
            if (!m.has(k)) m.set(k, { rate, code, sub:0, vat:0, tot:0, count:0 });
            const r = m.get(k);
            r.sub += parseFloat(l.subtotal||0);
            r.vat += parseFloat(l.vatAmount||0);
            r.tot += parseFloat(l.total||0);
            r.count += 1;
        }
        return Array.from(m.values()).sort((a,b)=>a.code.localeCompare(b.code));
    }, [data]);

    return (
        <div>
            <CompanyBanner C={C} period={`Jurnal de cumparari: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Jurnal de Cumparari" subtitle={`${data.length} facturi primite · ${byVat.length} categorii TVA`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Baza impozabila",  value:`RON ${fmt(tSub)}`, color:"#b07a7a" },
                { label:"TVA deductibila",  value:`RON ${fmt(tVat)}`, color:"#b09a6a" },
                { label:"Total facturi",    value:`RON ${fmt(tTot)}`, color:"#7b9cba" },
            ]}/>

            <div style={{ marginBottom:18, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"10px 16px", borderBottom:`1px solid ${C.border}`, background:`${C.red}06` }}>
                    <span style={{ fontSize:11, fontWeight:700, color:C.red, textTransform:"uppercase", letterSpacing:"0.7px" }}>Sumar pe cote TVA (referinte D300)</span>
                </div>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead>
                    <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"left", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Referinta</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"left", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Denumire</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Nr. doc.</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Total (cu TVA)</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Baza TVA</th>
                        <th style={{ fontSize:9, color:C.textDim, padding:"8px 14px", textAlign:"right", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>Valoare TVA</th>
                    </tr>
                    </thead>
                    <tbody>
                    {byVat.map((r,i)=>(
                        <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                            <td style={{ padding:"8px 14px", fontSize:11, fontFamily:"monospace", color:C.accent, fontWeight:700 }}>{r.code}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:C.textMid }}>{labelForVatRate(r.rate, "purchase")}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:C.textMid, textAlign:"right" }}>{r.count}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:C.text, fontWeight:700, textAlign:"right" }}>{fmt(r.tot)}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:"#b07a7a", textAlign:"right" }}>{fmt(r.sub)}</td>
                            <td style={{ padding:"8px 14px", fontSize:11, color:"#b09a6a", textAlign:"right" }}>{fmt(r.vat)}</td>
                        </tr>
                    ))}
                    <tr style={{ background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)" }}>
                        <td colSpan={2} style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:C.text, textTransform:"uppercase" }}>Toate referintele</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:C.text, textAlign:"right" }}>{data.length}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:C.text, textAlign:"right" }}>{fmt(tTot)}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:"#b07a7a", textAlign:"right" }}>{fmt(tSub)}</td>
                        <td style={{ padding:"10px 14px", fontSize:11, fontWeight:800, color:"#b09a6a", textAlign:"right" }}>{fmt(tVat)}</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <RTable C={C} headers={[
                {label:"Cod ref."},{label:"Data"},{label:"Nr. doc."},{label:"Furnizor"},{label:"CIF"},
                {label:"Cont chelt."},{label:"%"},{label:"Total",right:true},{label:"Baza",right:true},{label:"TVA",right:true},{label:"Status"},
            ]}>
                {data.map((l,i)=>(
                    <tr key={i} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.15s ease ${Math.min(i,40)*5}ms both` }}>
                        <Td mono style={{ color:C.accent, fontSize:10 }}>{l.vatRefCode || labelForVatRate(l.vatRate, "purchase")}</Td>
                        <Td style={{ color:C.textMid, whiteSpace:"nowrap", fontSize:11 }}>{fmtD(l.date)}</Td>
                        <Td mono style={{ color:C.text, fontSize:11, fontWeight:700 }}>{l.invoiceNumber}</Td>
                        <Td style={{ color:C.text, fontWeight:500 }}>{l.supplierName}</Td>
                        <Td style={{ color:C.textDim, fontSize:11 }}>{l.supplierTaxId||"—"}</Td>
                        <Td>
                            <span style={{ fontFamily:"monospace", fontWeight:700, color:"#b07a7a", fontSize:11 }}>{l.expenseAccountCode}</span>
                            {l.expenseAccountName && <span style={{ color:C.textDim, fontSize:10, marginLeft:5 }}>{l.expenseAccountName}</span>}
                        </Td>
                        <Td style={{ color:"#b09a6a", fontSize:11, fontWeight:600 }}>{vatRatePct(l.vatRate)}</Td>
                        <Td right style={{ color:C.text, fontWeight:700 }}>{fmt(l.total)}</Td>
                        <Td right style={{ color:"#b07a7a" }}>{fmt(l.subtotal)}</Td>
                        <Td right style={{ color:"#b09a6a" }}>{fmt(l.vatAmount)}</Td>
                        <Td><StatusPill status={l.status}/></Td>
                    </tr>
                ))}
                <RTableFoot C={C} cols={[
                    {value:"TOTAL"},{value:""},{value:""},{value:""},{value:""},{value:""},{value:""},
                    {value:`RON ${fmt(tTot)}`, color:"#7b9cba", right:true},
                    {value:`RON ${fmt(tSub)}`, color:"#b07a7a", right:true},
                    {value:`RON ${fmt(tVat)}`, color:"#b09a6a", right:true},
                    {value:""},
                ]}/>
            </RTable>
        </div>
    );
}

/* helpers TVA — pentru codurile de referinta SAGA */
function vatRatePct(rate) {
    if (rate==null || rate==="") return "—";
    const n = parseFloat(rate);
    if (Number.isNaN(n)) return rate;
    return `${n.toFixed(0)}%`;
}
function labelForVatRate(rate, kind) {
    const n = parseFloat(rate);
    if (kind==="sales") {
        if (n===19) return "Bunuri/servicii taxabile cu TVA la incasare cota 19%";
        if (n===21) return "Bunuri/servicii taxabile cu TVA la incasare cota 21%";
        if (n===9)  return "Bunuri/servicii taxabile cu TVA la incasare cota 9%";
        if (n===11) return "Bunuri/servicii taxabile cu TVA la incasare cota 11%";
        if (n===5)  return "Bunuri/servicii taxabile cota 5%";
        if (n===0)  return "Operatiuni scutite/taxare inversa";
        return "Alte operatiuni";
    } else {
        if (n===19) return "Achizitii din tara cu TVA la plata cota 19%";
        if (n===21) return "Achizitii din tara cu TVA la plata cota 21%";
        if (n===9)  return "Achizitii din tara cu TVA la plata cota 9%";
        if (n===11) return "Achizitii din tara cu TVA la plata cota 11%";
        if (n===5)  return "Achizitii cota 5%";
        if (n===0)  return "Achizitii scutite/neimpozabile";
        return "Alte achizitii";
    }
}

/* ── Situatie clienti (format SAGA: cod, denumire, neachitat initial, intrari, incasari, neachitat final, neachitat la zi) ── */
function ViewClients({ data, C, from, to }) {
    const tSI = data.reduce((s,l)=>s+parseFloat(l.soldInitial||0),0);
    const tIn = data.reduce((s,l)=>s+parseFloat(l.intrari||0),0);
    const tIc = data.reduce((s,l)=>s+parseFloat(l.incasari||0),0);
    const tSF = data.reduce((s,l)=>s+parseFloat(l.soldFinal||0),0);
    const tAZ = data.reduce((s,l)=>s+parseFloat(l.neachitatLaZi ?? l.soldFinal ??0),0);
    return (
        <div>
            <CompanyBanner C={C} period={`Situatie clienti: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Situatie Clienti" subtitle={`${data.length} clienti cu activitate in perioada`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Neachitat initial",   value:`RON ${fmt(tSI)}`, color:"#7b9cba" },
                { label:"Total intrari",       value:`RON ${fmt(tIn)}`, color:"#7aab8a" },
                { label:"Total incasari",      value:`RON ${fmt(tIc)}`, color:"#7aab8a" },
                { label:"Neachitat final",     value:`RON ${fmt(tSF)}`, color:tSF>0?"#b09a6a":"#7aab8a" },
            ]}/>
            <RTable C={C} headers={[
                {label:"Cod"},{label:"Denumire"},{label:"CIF"},
                {label:"Neachitat init.",right:true},{label:"Total intrari",right:true},
                {label:"Total incasari",right:true},{label:"Neachitat final",right:true},
                {label:"Neachitat la zi",right:true},
            ]}>
                {data.map((l,i)=>{
                    const azNum = parseFloat(l.neachitatLaZi ?? l.soldFinal ?? 0);
                    return (
                        <tr key={i} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.2s ease ${Math.min(i,30)*10}ms both` }}>
                            <Td mono style={{ color:"#7b9cba", fontWeight:700, fontSize:11 }}>{l.clientCode || String(i+1).padStart(5,"0")}</Td>
                            <Td style={{ color:C.text, fontWeight:600 }}>{l.clientName}</Td>
                            <Td mono style={{ color:C.textDim, fontSize:11 }}>{l.clientTaxId||"—"}</Td>
                            <Td right style={{ color:C.textMid }}>{fmt(l.soldInitial)}</Td>
                            <Td right style={{ color:"#7aab8a", fontWeight:500 }}>{fmt(l.intrari)}</Td>
                            <Td right style={{ color:"#7b9cba", fontWeight:500 }}>{fmt(l.incasari)}</Td>
                            <Td right style={{ color:parseFloat(l.soldFinal)>0?"#b09a6a":"#7aab8a", fontWeight:700 }}>{fmt(l.soldFinal)}</Td>
                            <Td right style={{ color:azNum>0?"#b09a6a":"#7aab8a", fontWeight:700 }}>{fmt(azNum)}</Td>
                        </tr>
                    );
                })}
                <RTableFoot C={C} cols={[
                    {value:"TOTAL"},{value:""},{value:""},
                    {value:fmt(tSI), color:C.textMid,  right:true},
                    {value:fmt(tIn), color:"#7aab8a",  right:true},
                    {value:fmt(tIc), color:"#7b9cba",  right:true},
                    {value:fmt(tSF), color:"#b09a6a",  right:true},
                    {value:fmt(tAZ), color:"#b09a6a",  right:true},
                ]}/>
            </RTable>
            <p style={{ fontSize:11, color:C.textDim, marginTop:10 }}>"Neachitat" reprezinta soldul restant al creantelor (cont 4111). "Neachitat la zi" reflecta soldul actual, indiferent de perioada selectata.</p>
        </div>
    );
}

/* ── Situatie furnizori (format SAGA: cod, denumire, neachitat initial, intrari, plati, neachitat final, neachitat la zi) ── */
function ViewSuppliers({ data, C, from, to }) {
    const tSI = data.reduce((s,l)=>s+parseFloat(l.soldInitial||0),0);
    const tIn = data.reduce((s,l)=>s+parseFloat(l.intrari||0),0);
    const tPl = data.reduce((s,l)=>s+parseFloat(l.plati||0),0);
    const tSF = data.reduce((s,l)=>s+parseFloat(l.soldFinal||0),0);
    const tAZ = data.reduce((s,l)=>s+parseFloat(l.neachitatLaZi ?? l.soldFinal ?? 0),0);
    return (
        <div>
            <CompanyBanner C={C} period={`Situatie furnizori: ${fmtD(from)} — ${fmtD(to)}`}/>
            <RHeader title="Situatie Furnizori" subtitle={`${data.length} furnizori cu activitate in perioada`} C={C}/>
            <SummaryCards C={C} cards={[
                { label:"Neachitat initial",   value:`RON ${fmt(tSI)}`, color:"#b07a7a" },
                { label:"Total intrari",       value:`RON ${fmt(tIn)}`, color:"#b07a7a" },
                { label:"Total plati",         value:`RON ${fmt(tPl)}`, color:"#7aab8a" },
                { label:"Neachitat final",     value:`RON ${fmt(tSF)}`, color:tSF>0?"#b09a6a":"#7aab8a" },
            ]}/>
            <RTable C={C} headers={[
                {label:"Cod"},{label:"Denumire"},{label:"CIF"},
                {label:"Neachitat init.",right:true},{label:"Total intrari",right:true},
                {label:"Total plati",right:true},{label:"Neachitat final",right:true},
                {label:"Neachitat la zi",right:true},
            ]}>
                {data.map((l,i)=>{
                    const azNum = parseFloat(l.neachitatLaZi ?? l.soldFinal ?? 0);
                    return (
                        <tr key={i} className="rpt-tr" style={{ borderBottom:`1px solid ${C.border}`, animation:`fadeUp 0.2s ease ${Math.min(i,30)*10}ms both` }}>
                            <Td mono style={{ color:"#b07a7a", fontWeight:700, fontSize:11 }}>{l.supplierCode || String(i+1).padStart(5,"0")}</Td>
                            <Td style={{ color:C.text, fontWeight:600 }}>{l.supplierName}</Td>
                            <Td mono style={{ color:C.textDim, fontSize:11 }}>{l.supplierTaxId||"—"}</Td>
                            <Td right style={{ color:C.textMid }}>{fmt(l.soldInitial)}</Td>
                            <Td right style={{ color:"#b07a7a", fontWeight:500 }}>{fmt(l.intrari)}</Td>
                            <Td right style={{ color:"#7aab8a", fontWeight:500 }}>{fmt(l.plati)}</Td>
                            <Td right style={{ color:parseFloat(l.soldFinal)>0?"#b09a6a":"#7aab8a", fontWeight:700 }}>{fmt(l.soldFinal)}</Td>
                            <Td right style={{ color:azNum>0?"#b09a6a":"#7aab8a", fontWeight:700 }}>{fmt(azNum)}</Td>
                        </tr>
                    );
                })}
                <RTableFoot C={C} cols={[
                    {value:"TOTAL"},{value:""},{value:""},
                    {value:fmt(tSI), color:C.textMid,  right:true},
                    {value:fmt(tIn), color:"#b07a7a",  right:true},
                    {value:fmt(tPl), color:"#7aab8a",  right:true},
                    {value:fmt(tSF), color:"#b09a6a",  right:true},
                    {value:fmt(tAZ), color:"#b09a6a",  right:true},
                ]}/>
            </RTable>
            <p style={{ fontSize:11, color:C.textDim, marginTop:10 }}>"Neachitat" reprezinta soldul restant al datoriilor catre furnizori (cont 401). "Neachitat la zi" reflecta soldul actual, indiferent de perioada selectata.</p>
        </div>
    );
}