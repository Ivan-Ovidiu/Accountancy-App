import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "./App";
import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8080";

// Fixed semantic colors (same in both themes)
const SEM = {
    revenue: "#7b9cba",
    expenses:"#b07a7a",
    profit:  "#7aab8a",
    warning: "#b09a6a",
};

const STATUS_META = {
    PAID:    { label:"Paid",    color:"#7aab8a" },
    SENT:    { label:"Sent",    color:"#7b9cba" },
    OVERDUE: { label:"Overdue", color:"#b07a7a" },
    DRAFT:   { label:"Draft",   color:"#6b7280" },
};

const PERIODS = [
    { key:"this_month",   label:"This Month"   },
    { key:"last_month",   label:"Last Month"   },
    { key:"this_quarter", label:"This Quarter" },
    { key:"this_year",    label:"This Year"    },
    { key:"custom",       label:"Custom Range" },
];

function getPeriodDates(key, custom) {
    const now=new Date(), y=now.getFullYear(), m=now.getMonth();
    switch(key) {
        case "this_month":   return { from:new Date(y,m,1), to:new Date(y,m+1,0), label:now.toLocaleString("en-US",{month:"long",year:"numeric"}) };
        case "last_month":   return { from:new Date(y,m-1,1), to:new Date(y,m,0), label:new Date(y,m-1).toLocaleString("en-US",{month:"long",year:"numeric"}) };
        case "this_quarter": { const q=Math.floor(m/3); return { from:new Date(y,q*3,1), to:new Date(y,q*3+3,0), label:`Q${q+1} ${y}` }; }
        case "this_year":    return { from:new Date(y,0,1), to:new Date(y,11,31), label:`Full Year ${y}` };
        case "custom":       return custom?.from&&custom?.to ? { ...custom, label:`${fmtDisplay(custom.from)} – ${fmtDisplay(custom.to)}` } : getPeriodDates("this_month");
        default:             return getPeriodDates("this_month");
    }
}

function fmtDate(d)    { return d.toISOString().split("T")[0]; }
function fmtDisplay(d) { return d.toLocaleDateString("en-US",{day:"numeric",month:"short",year:"numeric"}); }
function sameDay(a,b)  { return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function between(d,a,b){ return d>=a&&d<=b; }
function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }

function useCountUp(target, duration=800, delay=0, trigger=0) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        setValue(0);
        if (!target) return;
        const timeout = setTimeout(() => {
            const start = performance.now();
            const tick = (now) => {
                const progress = Math.min((now-start)/duration, 1);
                setValue(Math.round((1-Math.pow(1-progress,3))*Math.abs(target)));
                if (progress<1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        }, delay);
        return () => clearTimeout(timeout);
    }, [target, trigger]);
    return value;
}

function useBarWidth(targetPct, delay=200, trigger=0) {
    const [width, setWidth] = useState(0);
    useEffect(() => {
        setWidth(0);
        const t = setTimeout(() => setWidth(targetPct), delay+50);
        return () => clearTimeout(t);
    }, [targetPct, trigger]);
    return width;
}

function MiniCalendar({ onRangeSelect, initialFrom, initialTo, C }) {
    const now=new Date();
    const [viewYear,setViewYear]   = useState(now.getFullYear());
    const [viewMonth,setViewMonth] = useState(now.getMonth());
    const [start,setStart]         = useState(initialFrom||null);
    const [end,setEnd]             = useState(initialTo||null);
    const [hovering,setHovering]   = useState(null);

    const daysInMonth = new Date(viewYear,viewMonth+1,0).getDate();
    const firstDay    = new Date(viewYear,viewMonth,1).getDay();
    const monthName   = new Date(viewYear,viewMonth).toLocaleString("en-US",{month:"long",year:"numeric"});

    const prevMonth = () => { if(viewMonth===0){setViewYear(y=>y-1);setViewMonth(11);}else setViewMonth(m=>m-1); };
    const nextMonth = () => { if(viewMonth===11){setViewYear(y=>y+1);setViewMonth(0);}else setViewMonth(m=>m+1); };

    const handleDay = (day) => {
        const d=new Date(viewYear,viewMonth,day);
        if(!start||(start&&end)){setStart(d);setEnd(null);}
        else {
            const [from,to]=d<start?[d,start]:[start,d];
            setStart(from);setEnd(to);
            onRangeSelect&&onRangeSelect(from,to);
        }
    };

    const cells=[];
    for(let i=0;i<firstDay;i++) cells.push(null);
    for(let i=1;i<=daysInMonth;i++) cells.push(i);

    return (
        <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:14, padding:16, width:260, boxShadow:`0 16px 40px rgba(0,0,0,${C.isDark?0.5:0.15})` }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <button onClick={prevMonth} style={{ background:"none", border:"none", color:C.textMid, fontSize:18, cursor:"pointer", padding:"0 6px" }}>‹</button>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{monthName}</span>
                <button onClick={nextMonth} style={{ background:"none", border:"none", color:C.textMid, fontSize:18, cursor:"pointer", padding:"0 6px" }}>›</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => <div key={d} style={{ fontSize:10, color:C.textDim, textAlign:"center", padding:"4px 0", fontWeight:500 }}>{d}</div>)}
                {cells.map((day,i) => {
                    if(!day) return <div key={`e${i}`}/>;
                    const d=new Date(viewYear,viewMonth,day);
                    const isStart=sameDay(d,start), isEnd=sameDay(d,end);
                    const isInRange=start&&end&&between(d,start,end);
                    const isHover=start&&!end&&hovering&&d>start&&d<=hovering;
                    const isToday=sameDay(d,now);
                    return (
                        <button key={day}
                                style={{ border:"none", cursor:"pointer", fontSize:12, padding:"5px 0", textAlign:"center", fontFamily:"'Outfit',sans-serif", transition:"all 0.12s", background:isStart||isEnd?C.accent:isInRange||isHover?`${C.accent}22`:"transparent", color:isStart||isEnd?(C.isDark?"#0f1117":"#fff"):isInRange||isHover?C.text:isToday?C.accent:C.textMid, borderRadius:isStart?"6px 2px 2px 6px":isEnd?"2px 6px 6px 2px":isInRange||isHover?"2px":"6px", fontWeight:isStart||isEnd||isToday?600:400 }}
                                onClick={()=>handleDay(day)} onMouseEnter={()=>setHovering(d)} onMouseLeave={()=>setHovering(null)}>
                            {day}
                        </button>
                    );
                })}
            </div>
            {start && (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}` }}>
          <span style={{ color:C.textMid, fontSize:11 }}>
            {start&&!end?`From ${fmtDisplay(start)} — pick end`:end?`${fmtDisplay(start)} → ${fmtDisplay(end)}`:""}
          </span>
                    {start&&end&&<button onClick={()=>onRangeSelect&&onRangeSelect(start,end)} style={{ background:C.accent, border:"none", borderRadius:6, padding:"5px 12px", color:C.isDark?"#0f1117":"#fff", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Apply →</button>}
                </div>
            )}
        </div>
    );
}

export default function Dashboard() {
    const T = useTheme();
    const C = T ? { ...SEM, text:T.text, textMid:T.textMid, textDim:T.textDim, bg:T.bg, card:T.card, border:T.border, border2:T.border2, accent:T.accent, isDark:T.isDark } : { ...SEM, text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", accent:"#a78bfa", isDark:true };

    const [period, setPeriod]           = useState("this_month");
    const [customRange, setCustomRange] = useState(null);
    const [showCal, setShowCal]         = useState(false);
    const [data, setData]               = useState(null);
    const [invoiceStats, setInvoiceStats] = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState("");
    const [tick, setTick]               = useState(0);
    const calRef = useRef(null);
    const user = JSON.parse(localStorage.getItem("user")||"{}");

    useEffect(() => {
        const handler = e => { if(calRef.current&&!calRef.current.contains(e.target)) setShowCal(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        setLoading(true);
        const headers = authHeaders();
        const {from,to} = getPeriodDates(period, customRange);
        const fromStr=fmtDate(from), toStr=fmtDate(to);

        const plFetch   = fetch(`${API_BASE}/api/reports/profit-and-loss?from=${fromStr}&to=${toStr}`, {headers}).then(r=>r.json());
        const dashFetch = fetch(`${API_BASE}/api/reports/dashboard`, {headers}).then(r=>r.json());
        const statusFetches = ["PAID","SENT","OVERDUE","DRAFT"].map(status =>
            fetch(`${API_BASE}/api/invoices/status/${status}`, {headers})
                .then(r=>r.json())
                .then(invoices=>({ status, count:invoices.length, total:invoices.reduce((s,inv)=>s+(inv.total||0),0) }))
                .catch(()=>({ status, count:0, total:0 }))
        );

        Promise.all([plFetch, dashFetch, Promise.all(statusFetches)])
            .then(([pl, dash, stats]) => {
                setData({ totalRevenue:pl.totalRevenue, totalExpenses:pl.totalExpenses, netProfit:pl.netProfit, outstandingInvoices:dash.outstandingInvoices, totalPaidInvoices:dash.totalPaidInvoices, pendingExpensesCount:dash.pendingExpensesCount });
                setInvoiceStats(stats);
                setTick(t=>t+1);
                setLoading(false);
            })
            .catch(()=>{ setError("Failed to load."); setLoading(false); });
    }, [period, customRange]);

    if (error) return <ErrorBox message={error} C={C} />;

    const fmt = n => new Intl.NumberFormat("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}).format(n??0);
    const periodInfo = getPeriodDates(period, customRange);
    const isProfit   = (data?.netProfit??0) >= 0;
    const margin     = data?.totalRevenue ? Math.round((data.netProfit/data.totalRevenue)*100) : 0;
    const hour       = new Date().getHours();
    const greeting   = hour<12?"Good morning":hour<18?"Good afternoon":"Good evening";
    const totalInvValue = invoiceStats?.reduce((s,i)=>s+i.total,0)||1;

    return (
        <div style={{ padding:"28px 36px", fontFamily:"'Outfit',sans-serif", color:C.text, display:"flex", flexDirection:"column", gap:16, background:C.bg, minHeight:"100vh" }}>

            {/* HERO */}
            <div style={{ position:"relative", borderRadius:20, overflow:"visible", height:210, display:"flex", alignItems:"flex-end" }}>
                <div style={{ position:"absolute", inset:0, background:C.card, borderRadius:20, overflow:"hidden" }} />
                <img src="/Dashboard_photo.jpg" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 60%", opacity: C.isDark ? 0.22 : 0.15, borderRadius:20 }} />
                <div style={{ position:"absolute", inset:0, background: C.isDark ? "linear-gradient(90deg,rgba(15,17,23,0.98) 0%,rgba(15,17,23,0.75) 55%,rgba(15,17,23,0.15) 100%)" : "linear-gradient(90deg,rgba(240,242,248,0.98) 0%,rgba(240,242,248,0.8) 55%,rgba(240,242,248,0.1) 100%)", borderRadius:20 }} />
                <div style={{ position:"relative", zIndex:2, padding:"0 36px 28px", flex:1 }}>
                    <p style={{ fontSize:12, color:C.textDim, marginBottom:8, textTransform:"uppercase", letterSpacing:"0.8px" }}>{greeting}, {user.name?.split(" ")[0]||"there"}</p>
                    {loading ? <MiniSpinner C={C} /> : (
                        <h1 style={{ fontSize:28, fontWeight:700, color:C.text, lineHeight:1.25, letterSpacing:"-0.5px", margin:"0 0 8px" }}>
                            {isProfit?"You're profitable":"Watch your expenses"}<br />
                            <span style={{ color:isProfit?SEM.profit:SEM.expenses }}>RON <CountUp value={data.netProfit} duration={900} delay={100} trigger={tick} /> net</span>
                        </h1>
                    )}
                    <p style={{ fontSize:12, color:C.textMid }}>{periodInfo.label}</p>
                </div>
                <div style={{ position:"relative", zIndex:10, padding:"20px 28px 20px 0", display:"flex", flexDirection:"column", gap:0, alignSelf:"stretch", justifyContent:"center" }}>
                    {PERIODS.map(p => (
                        <button key={p.key} onClick={() => { setPeriod(p.key); if(p.key==="custom") setShowCal(true); else setShowCal(false); }}
                                style={{ border:"none", borderRadius:0, cursor:"pointer", fontFamily:"'Outfit',sans-serif", fontSize:12, fontWeight:500, padding:"7px 16px 7px 14px", transition:"all 0.15s", textAlign:"left", width:"100%", color:period===p.key?C.text:C.textMid, background:period===p.key?`${C.accent}18`:"transparent", borderLeft:`2px solid ${period===p.key?C.accent:"transparent"}` }}>
                            {p.label}
                        </button>
                    ))}
                    {showCal && (
                        <div ref={calRef} style={{ position:"fixed", right:36, top:240, zIndex:1000 }}>
                            <MiniCalendar initialFrom={customRange?.from} initialTo={customRange?.to} C={C}
                                          onRangeSelect={(from,to) => { setCustomRange({from,to}); setPeriod("custom"); setShowCal(false); }} />
                        </div>
                    )}
                </div>
            </div>

            {/* KPI ROW */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
                <KpiCard label="Total Revenue"  target={data?.totalRevenue??0}        color={SEM.revenue}  delay={0}   trigger={tick} loading={loading} C={C} />
                <KpiCard label="Total Expenses" target={data?.totalExpenses??0}       color={SEM.expenses} delay={60}  trigger={tick} loading={loading} C={C} />
                <KpiCard label="Net Profit"     target={data?.netProfit??0}           color={isProfit?SEM.profit:SEM.expenses} delay={120} trigger={tick} loading={loading} C={C} />
                <KpiCard label="Outstanding"    target={data?.outstandingInvoices??0} color={SEM.warning}  delay={180} trigger={tick} loading={loading} C={C} />
            </div>

            {/* BOTTOM ROW */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr 1fr", gap:12 }}>

                {/* Pending */}
                <div style={{ position:"relative", borderRadius:16, overflow:"hidden", minHeight:250, display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                    <div style={{ position:"absolute", inset:0, background:C.card }} />
                    <img src="/Dashboard_photo.jpg" alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity:C.isDark?0.25:0.12 }} />
                    <div style={{ position:"absolute", inset:0, background: C.isDark ? "linear-gradient(0deg,rgba(15,17,23,0.98) 0%,rgba(15,17,23,0.6) 55%,rgba(15,17,23,0.05) 100%)" : "linear-gradient(0deg,rgba(240,242,248,0.98) 0%,rgba(240,242,248,0.7) 55%,rgba(240,242,248,0.05) 100%)" }} />
                    <div style={{ position:"relative", zIndex:2, padding:22, display:"flex", flexDirection:"column", gap:5 }}>
                        <span style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"1px" }}>Pending Approvals</span>
                        <span style={{ fontSize:48, fontWeight:700, color:C.text, lineHeight:1, letterSpacing:"-2px" }}>
              {loading?"—":<CountUp value={data?.pendingExpensesCount??0} duration={600} delay={200} trigger={tick} />}
            </span>
                        <span style={{ fontSize:12, color:C.textMid }}>expenses awaiting review</span>
                        <button style={{ marginTop:14, background:`${C.accent}15`, border:`1px solid ${C.accent}30`, borderRadius:8, padding:"7px 14px", color:C.accent, fontSize:12, fontWeight:500, fontFamily:"'Outfit',sans-serif", cursor:"pointer", alignSelf:"flex-start" }}>Review now →</button>
                    </div>
                </div>

                {/* Invoice Status */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", display:"flex", flexDirection:"column", gap:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:600, margin:0 }}>Invoice Status</p>
                        <span style={{ fontSize:11, color:C.textDim }}>{invoiceStats?.reduce((s,i)=>s+i.count,0)??0} total</span>
                    </div>
                    <StackedBar stats={invoiceStats} total={totalInvValue} trigger={tick} C={C} />
                    <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                        {invoiceStats?.map((stat,i) => {
                            const meta=STATUS_META[stat.status];
                            const pct=totalInvValue>0?(stat.total/totalInvValue)*100:0;
                            return <StatusRow key={stat.status} label={meta.label} count={stat.count} total={stat.total} color={meta.color} pct={pct} delay={300+i*100} trigger={tick} C={C} />;
                        })}
                    </div>
                </div>

                {/* Quick Stats */}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", display:"flex", flexDirection:"column", gap:14 }}>
                    <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:600, margin:0 }}>Quick Stats</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                        <StatItem label="Paid Invoices"    target={data?.totalPaidInvoices??0}      prefix="RON " delay={200} trigger={tick} loading={loading} C={C} />
                        <StatItem label="Pending Expenses" target={data?.pendingExpensesCount??0}   suffix=" items" delay={300} trigger={tick} loading={loading} C={C} />
                        <StatItem label="Outstanding"      target={data?.outstandingInvoices??0}    prefix="RON " delay={400} trigger={tick} loading={loading} C={C} />
                        <StatItem label="Net This Period"  target={data?.netProfit??0}              prefix="RON " delay={500} trigger={tick} loading={loading} C={C} />
                    </div>
                </div>
            </div>

            {/* Analytics */}
            <AnalyticsCard period={period} customRange={customRange} tick={tick} C={C} />

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>
        </div>
    );
}

function CountUp({ value, duration=800, delay=0, trigger=0 }) {
    const count = useCountUp(Math.abs(value??0), duration, delay, trigger);
    const fmt = n => new Intl.NumberFormat("en-US").format(n);
    return <>{(value??0)<0?`-${fmt(count)}`:fmt(count)}</>;
}

function StackedBar({ stats, total, trigger, C }) {
    const [vis, setVis] = useState(false);
    useEffect(() => { setVis(false); const t=setTimeout(()=>setVis(true),300); return ()=>clearTimeout(t); }, [trigger]);
    return (
        <div style={{ height:5, borderRadius:99, overflow:"hidden", display:"flex", background:C.border2 }}>
            {stats?.map(stat => {
                const meta=STATUS_META[stat.status];
                const pct=total>0?(stat.total/total)*100:0;
                return <div key={stat.status} style={{ height:"100%", width:vis?`${pct}%`:"0%", background:meta.color, transition:"width 1s cubic-bezier(0.16,1,0.3,1)", opacity:0.8 }} />;
            })}
        </div>
    );
}

function StatusRow({ label, count, total, color, pct, delay, trigger, C }) {
    const w = useBarWidth(pct, delay, trigger);
    const fmt = n => new Intl.NumberFormat("en-US",{minimumFractionDigits:0,maximumFractionDigits:0}).format(n??0);
    return (
        <div style={{ padding:"8px 0", borderBottom:`1px solid ${C.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:color, opacity:0.8 }} />
                    <span style={{ fontSize:12, color:C.textMid }}>{label}</span>
                    <span style={{ fontSize:11, color:C.textDim, background:C.border2, borderRadius:4, padding:"1px 6px" }}>{count}</span>
                </div>
                <span style={{ fontSize:12, color:C.text, fontWeight:500 }}>RON {fmt(total)}</span>
            </div>
            <div style={{ height:2, background:C.border2, borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${w}%`, background:color, borderRadius:99, transition:"width 1s cubic-bezier(0.16,1,0.3,1)", opacity:0.7 }} />
            </div>
        </div>
    );
}

function KpiCard({ label, target, color, delay, trigger, loading, C }) {
    const count = useCountUp(Math.abs(target??0), 800, delay, trigger);
    const fmt = n => new Intl.NumberFormat("en-US").format(n);
    const display = (target??0)<0?`-${fmt(count)}`:fmt(count);
    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", display:"flex", flexDirection:"column" }}>
            <div style={{ width:20, height:2, background:color, borderRadius:99, marginBottom:14, opacity:0.7 }} />
            <div style={{ fontSize:20, fontWeight:700, color:loading?C.textDim:C.text, letterSpacing:"-0.5px", marginBottom:4, transition:"color 0.3s" }}>
                {loading?"—":`RON ${display}`}
            </div>
            <div style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:500 }}>{label}</div>
        </div>
    );
}

function StatItem({ label, target, prefix="", suffix="", delay, trigger, loading, C }) {
    const count = useCountUp(Math.abs(target??0), 700, delay, trigger);
    const fmt = n => new Intl.NumberFormat("en-US").format(n);
    const display = (target??0)<0?`-${fmt(count)}`:fmt(count);
    return (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:C.bg, borderRadius:10, border:`1px solid ${C.border}` }}>
            <span style={{ fontSize:12, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</span>
            <span style={{ fontSize:13, fontWeight:600, color:loading?C.textDim:C.text }}>{loading?"—":`${prefix}${display}${suffix}`}</span>
        </div>
    );
}

function AnalyticsCard({ period, customRange, tick, C }) {
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(true);

    useEffect(() => {
        setChartLoading(true);
        const headers = authHeaders();
        const {from,to} = getPeriodDates(period, customRange);
        const points=[];
        const cursor=new Date(from); cursor.setDate(1);
        while(cursor<=to) {
            const y=cursor.getFullYear(), m=cursor.getMonth();
            points.push({ label:cursor.toLocaleString("en-US",{month:"short",year:"2-digit"}), from:new Date(y,m,1), to:new Date(y,m+1,0) });
            cursor.setMonth(cursor.getMonth()+1);
        }
        Promise.all(
            points.map(p =>
                fetch(`${API_BASE}/api/reports/profit-and-loss?from=${fmtDate(p.from)}&to=${fmtDate(p.to)}`, {headers})
                    .then(r=>r.json())
                    .then(d=>({ name:p.label, Revenue:d.totalRevenue||0, Expenses:d.totalExpenses||0 }))
                    .catch(()=>({ name:p.label, Revenue:0, Expenses:0 }))
            )
        ).then(data=>{ setChartData(data); setChartLoading(false); });
    }, [tick]);

    const CustomTooltip = ({ active, payload, label }) => {
        if(!active||!payload?.length) return null;
        return (
            <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:12 }}>
                <p style={{ color:C.textMid, marginBottom:6, fontWeight:600 }}>{label}</p>
                {payload.map(p => <p key={p.name} style={{ color:p.color, margin:"2px 0" }}>{p.name}: RON {new Intl.NumberFormat("en-US").format(p.value)}</p>)}
            </div>
        );
    };

    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", display:"flex", flexDirection:"column", gap:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                    <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.8px", fontWeight:600, margin:0 }}>Analytics</p>
                    <p style={{ fontSize:11, color:C.textDim, marginTop:3 }}>Revenue vs Expenses per month</p>
                </div>
                <div style={{ display:"flex", gap:16, alignItems:"center" }}>
          <span style={{ fontSize:11, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:SEM.revenue, display:"inline-block" }} />Revenue
          </span>
                    <span style={{ fontSize:11, color:C.textMid, display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:SEM.expenses, display:"inline-block" }} />Expenses
          </span>
                </div>
            </div>
            {chartLoading ? (
                <div style={{ height:200, display:"flex", alignItems:"center", justifyContent:"center" }}><MiniSpinner C={C} /></div>
            ) : (
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData} barGap={4} barCategoryGap="30%">
                        <CartesianGrid vertical={false} stroke={C.border} strokeDasharray="4 4" />
                        <XAxis dataKey="name" tick={{ fill:C.textDim, fontSize:11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill:C.textDim, fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill:`${C.accent}08` }} />
                        <Bar dataKey="Revenue"  fill={SEM.revenue}  radius={[4,4,0,0]} maxBarSize={32} opacity={0.85} />
                        <Bar dataKey="Expenses" fill={SEM.expenses} radius={[4,4,0,0]} maxBarSize={32} opacity={0.85} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}

function MiniSpinner({ C }) {
    return <div style={{ width:16, height:16, border:`2px solid ${C.border2}`, borderTopColor:C.accent, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />;
}

function ErrorBox({ message, C }) {
    return (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"80vh" }}>
            <div style={{ background: C.isDark?"#1a1218":"#fff0f0", border:`1px solid ${SEM.expenses}40`, borderRadius:12, padding:"18px 24px", color:SEM.expenses, fontSize:14 }}>⚠ {message}</div>
        </div>
    );
}