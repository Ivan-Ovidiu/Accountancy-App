import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmt(n)        { return new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n??0); }
function today()       { return new Date().toISOString().split("T")[0]; }
function firstOfMonth(){ const d=new Date(); d.setDate(1); return d.toISOString().split("T")[0]; }
function firstOfYear() { return `${new Date().getFullYear()}-01-01`; }
function endOfMonth()  { const d=new Date(); return new Date(d.getFullYear(),d.getMonth()+1,0).toISOString().split("T")[0]; }

const TABS = [
    { key:"pl",      label:"Profit & Loss"  },
    { key:"balance", label:"Balance Sheet"  },
    { key:"cashflow",label:"Cash Flow"      },
];

export default function Reports() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", amber:"#b09a6a", isDark:true };

    const [tab, setTab]       = useState("pl");
    const [from, setFrom]     = useState(firstOfMonth());
    const [to, setTo]         = useState(endOfMonth());
    const [asOf, setAsOf]     = useState(today());
    const [pl, setPl]         = useState(null);
    const [bs, setBs]         = useState(null);
    const [cf, setCf]         = useState(null);
    const [loading, setLoading] = useState(false);

    const load = () => {
        setLoading(true);
        const h = authHeaders();

        if (tab === "pl") {
            fetch(`${API_BASE}/api/reports/profit-and-loss?from=${from}&to=${to}`, { headers:h })
                .then(r=>r.json()).then(d=>{ setPl(d); setLoading(false); }).catch(()=>setLoading(false));
        } else if (tab === "balance") {
            fetch(`${API_BASE}/api/reports/balance-sheet?asOf=${asOf}`, { headers:h })
                .then(r=>r.json()).then(d=>{ setBs(d); setLoading(false); }).catch(()=>setLoading(false));
        } else if (tab === "cashflow") {
            fetch(`${API_BASE}/api/reports/cash-flow?from=${from}&to=${to}`, { headers:h })
                .then(r=>r.json()).then(d=>{ setCf(d); setLoading(false); }).catch(()=>setLoading(false));
        }
    };

    useEffect(() => { load(); }, [tab, from, to, asOf]);

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* HEADER */}
            <div style={{ marginBottom:28 }}>
                <h1 style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:"-0.5px", margin:0 }}>Financial Reports</h1>
                <p style={{ fontSize:13, color:C.textDim, marginTop:5 }}>Generated from journal entries in real time</p>
            </div>

            {/* TABS + DATE CONTROLS */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                {/* Tab switcher */}
                <div style={{ display:"flex", gap:4, background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:4 }}>
                    {TABS.map(t=>(
                        <button key={t.key} onClick={()=>setTab(t.key)}
                                style={{ border:"none", borderRadius:9, padding:"8px 18px", fontSize:13, fontWeight:tab===t.key?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:tab===t.key?(C.isDark?"#252d3a":"#e8ecf6"):C.card, color:tab===t.key?C.text:C.textMid, transition:"all 0.15s" }}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Date controls */}
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    {tab==="balance" ? (
                        <DateField label="As of" val={asOf} set={setAsOf} C={C} />
                    ) : (
                        <>
                            <DateField label="From" val={from} set={setFrom} C={C} />
                            <span style={{ color:C.textDim, fontSize:13 }}>—</span>
                            <DateField label="To"   val={to}   set={setTo}   C={C} />
                        </>
                    )}

                    {/* Quick presets */}
                    <div style={{ display:"flex", gap:4 }}>
                        {[
                            ["This Month", ()=>{ setFrom(firstOfMonth()); setTo(endOfMonth()); }],
                            ["This Year",  ()=>{ setFrom(firstOfYear()); setTo(today()); }],
                        ].map(([label,fn])=>(
                            <button key={label} onClick={fn}
                                    style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8, padding:"6px 12px", color:C.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* REPORT CONTENT */}
            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C} /></div>
            ) : (
                <>
                    {tab==="pl"       && pl && <PLReport data={pl}    C={C} />}
                    {tab==="balance"  && bs && <BSReport data={bs}    C={C} />}
                    {tab==="cashflow" && cf && <CFReport data={cf}    C={C} />}
                </>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark?"invert(1)":"none"}; opacity:0.5; }
        input:focus { outline:none; border-color:#7b9cba !important; }
        button:focus { outline:none; }
      `}</style>
        </div>
    );
}

// ── P&L Report ──
function PLReport({ data, C }) {
    const isProfit = (data.netProfit??0) >= 0;
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp 0.3s ease both" }}>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                <SummCard label="Total Revenue"  value={`RON ${fmt(data.totalRevenue)}`}  color="#7b9cba" C={C} />
                <SummCard label="Total Expenses" value={`RON ${fmt(data.totalExpenses)}`} color="#b07a7a" C={C} />
                <SummCard label="Net Profit"     value={`RON ${fmt(data.netProfit)}`}     color={isProfit?"#7aab8a":"#b07a7a"} C={C} large />
            </div>

            {/* Period */}
            <p style={{ fontSize:12, color:C.textDim, margin:0 }}>
                Period: <strong style={{ color:C.textMid }}>{data.periodFrom}</strong> — <strong style={{ color:C.textMid }}>{data.periodTo}</strong>
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {/* Revenue */}
                <ReportSection title="Revenue" total={data.totalRevenue} lines={data.revenueLines} color="#7b9cba" C={C} />
                {/* Expenses */}
                <ReportSection title="Expenses" total={data.totalExpenses} lines={data.expenseLines} color="#b07a7a" C={C} />
            </div>

            {/* Net profit footer */}
            <div style={{ background:C.card, border:`1px solid ${isProfit?"#7aab8a40":"#b07a7a40"}`, borderRadius:14, padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:15, fontWeight:600, color:C.text }}>Net Profit</span>
                <span style={{ fontSize:22, fontWeight:800, color:isProfit?"#7aab8a":"#b07a7a", letterSpacing:"-0.5px" }}>RON {fmt(data.netProfit)}</span>
            </div>
        </div>
    );
}

// ── Balance Sheet ──
function BSReport({ data, C }) {
    const balanced = Math.abs((data.totalAssets??0) - (data.totalLiabilitiesAndEquity??0)) < 0.01;
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp 0.3s ease both" }}>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                <SummCard label="Total Assets"      value={`RON ${fmt(data.totalAssets)}`}             color="#7b9cba" C={C} />
                <SummCard label="Total Liabilities" value={`RON ${fmt(data.totalLiabilities)}`}        color="#b07a7a" C={C} />
                <SummCard label="Total Equity"      value={`RON ${fmt(data.totalEquity)}`}             color="#7aab8a" C={C} />
            </div>

            <p style={{ fontSize:12, color:C.textDim, margin:0 }}>
                As of: <strong style={{ color:C.textMid }}>{data.asOfDate}</strong>
                {balanced
                    ? <span style={{ marginLeft:12, color:"#7aab8a", fontSize:11 }}>✓ Balanced</span>
                    : <span style={{ marginLeft:12, color:"#b07a7a", fontSize:11 }}>⚠ Not balanced</span>}
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <ReportSection title="Assets"      total={data.totalAssets}      lines={data.assetLines}     color="#7b9cba" C={C} />
                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    <ReportSection title="Liabilities" total={data.totalLiabilities} lines={data.liabilityLines} color="#b07a7a" C={C} />
                    <ReportSection title="Equity"      total={data.totalEquity}      lines={data.equityLines}    color="#7aab8a" C={C} />
                </div>
            </div>

            <div style={{ background:C.card, border:`1px solid ${balanced?"#7aab8a40":C.border}`, borderRadius:14, padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:14, fontWeight:600, color:C.text }}>Liabilities + Equity</span>
                <span style={{ fontSize:20, fontWeight:800, color:balanced?"#7aab8a":C.text, letterSpacing:"-0.5px" }}>RON {fmt(data.totalLiabilitiesAndEquity)}</span>
            </div>
        </div>
    );
}

// ── Cash Flow ──
function CFReport({ data, C }) {
    const isPositive = (data.netCashFlow??0) >= 0;
    const total = (data.totalInflows??0) + (data.totalOutflows??0) || 1;
    const inflowPct  = Math.min(((data.totalInflows??0)/total)*100, 100);
    const outflowPct = Math.min(((data.totalOutflows??0)/total)*100, 100);

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:16, animation:"fadeUp 0.3s ease both" }}>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                <SummCard label="Total Inflows"  value={`RON ${fmt(data.totalInflows)}`}  color="#7aab8a" C={C} />
                <SummCard label="Total Outflows" value={`RON ${fmt(data.totalOutflows)}`} color="#b07a7a" C={C} />
                <SummCard label="Net Cash Flow"  value={`RON ${fmt(data.netCashFlow)}`}   color={isPositive?"#7aab8a":"#b07a7a"} C={C} large />
            </div>

            <p style={{ fontSize:12, color:C.textDim, margin:0 }}>
                Period: <strong style={{ color:C.textMid }}>{data.periodFrom}</strong> — <strong style={{ color:C.textMid }}>{data.periodTo}</strong>
            </p>

            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"24px" }}>
                <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, margin:"0 0 20px" }}>Cash Flow Overview</p>

                <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                    {/* Inflows bar */}
                    <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:13, color:C.textMid }}>Inflows</span>
                            <span style={{ fontSize:13, fontWeight:600, color:"#7aab8a" }}>RON {fmt(data.totalInflows)}</span>
                        </div>
                        <div style={{ height:8, background:C.border2, borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${inflowPct}%`, background:"#7aab8a", borderRadius:99, opacity:0.8 }} />
                        </div>
                    </div>

                    {/* Outflows bar */}
                    <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                            <span style={{ fontSize:13, color:C.textMid }}>Outflows</span>
                            <span style={{ fontSize:13, fontWeight:600, color:"#b07a7a" }}>RON {fmt(data.totalOutflows)}</span>
                        </div>
                        <div style={{ height:8, background:C.border2, borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${outflowPct}%`, background:"#b07a7a", borderRadius:99, opacity:0.8 }} />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:14, fontWeight:600, color:C.text }}>Net Cash Flow</span>
                    <span style={{ fontSize:22, fontWeight:800, color:isPositive?"#7aab8a":"#b07a7a", letterSpacing:"-0.5px" }}>
            {isPositive?"+":""}RON {fmt(data.netCashFlow)}
          </span>
                </div>
            </div>

            {(data.totalInflows===0 && data.totalOutflows===0) && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"24px", textAlign:"center" }}>
                    <p style={{ fontSize:13, color:C.textDim, margin:0 }}>
                        No cash account movements found for this period.<br/>
                        Cash Flow tracks accounts with sub_type = CURRENT_ASSET.
                    </p>
                </div>
            )}
        </div>
    );
}

// ── Shared components ──
function ReportSection({ title, total, lines, color, C }) {
    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:`1px solid ${C.border}`, background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{title}</span>
                <span style={{ fontSize:14, fontWeight:700, color }}> RON {fmt(total)}</span>
            </div>

            {lines?.length===0 ? (
                <div style={{ padding:"20px", textAlign:"center" }}>
                    <p style={{ fontSize:12, color:C.textDim, margin:0 }}>No entries for this period</p>
                </div>
            ) : (
                <div>
                    {lines?.map((line,i)=>(
                        <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 20px", borderBottom:i<lines.length-1?`1px solid ${C.border}`:"none" }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:11, color, background:`${color}15`, border:`1px solid ${color}25`, borderRadius:5, padding:"2px 7px", fontFamily:"monospace", fontWeight:500 }}>{line.accountCode}</span>
                                <span style={{ fontSize:13, color:C.textMid }}>{line.accountName}</span>
                            </div>
                            <span style={{ fontSize:13, fontWeight:500, color:C.text }}>RON {fmt(line.amount)}</span>
                        </div>
                    ))}
                    <div style={{ display:"flex", justifyContent:"space-between", padding:"10px 20px", borderTop:`1px solid ${C.border}`, background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                        <span style={{ fontSize:12, color:C.textDim, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>Total</span>
                        <span style={{ fontSize:13, fontWeight:700, color }}>RON {fmt(total)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummCard({ label, value, color, C, large }) {
    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px" }}>
            <div style={{ width:20, height:2, background:color, borderRadius:99, marginBottom:12, opacity:0.7 }} />
            <p style={{ fontSize:large?22:18, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.5px" }}>{value}</p>
            <p style={{ fontSize:11, color:C.textDim, margin:"5px 0 0", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:500 }}>{label}</p>
        </div>
    );
}

function DateField({ label, val, set, C }) {
    return (
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", whiteSpace:"nowrap" }}>{label}</span>
            <input type="date" value={val} onChange={e=>set(e.target.value)}
                   style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:9, padding:"7px 12px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }} />
        </div>
    );
}

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#7b9cba", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />; }