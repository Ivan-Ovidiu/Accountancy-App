import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

const STATUS = {
    PENDING:  { label:"Pending",  color:"#b09a6a", bg:"#b09a6a18" },
    APPROVED: { label:"Approved", color:"#7aab8a", bg:"#7aab8a18" },
    REJECTED: { label:"Rejected", color:"#b07a7a", bg:"#b07a7a18" },
};

function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmt(n)        { return new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n??0); }
function fmtDate(s)    { return s ? new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"; }
function today()       { return new Date().toISOString().split("T")[0]; }

const EMPTY_FORM = { accountId:"", taxRateId:"", description:"", amount:"", expenseDate:today(), receiptUrl:"" };

export default function Expenses() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", accent:"#a78bfa", isDark:true };

    const [expenses, setExpenses] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [taxRates, setTaxRates] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState("ALL");
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const [saving, setSaving]     = useState(false);
    const [err, setErr]           = useState("");

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/expenses`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ setExpenses(Array.isArray(d)?d:[]); setLoading(false); })
            .catch(()=>setLoading(false));
    };

    useEffect(() => {
        load();
        fetch(`${API_BASE}/api/accounts`,  { headers:authHeaders() }).then(r=>r.json()).then(d=>setAccounts(Array.isArray(d)?d:[])).catch(()=>{});
        fetch(`${API_BASE}/api/tax-rates`, { headers:authHeaders() }).then(r=>r.json()).then(d=>setTaxRates(Array.isArray(d)?d:[])).catch(()=>{});
    }, []);

    const filtered = filter==="ALL" ? expenses : expenses.filter(e=>e.status===filter);

    const openCreate = () => { setForm(EMPTY_FORM); setErr(""); setModal("create"); };
    const openView   = e  => { setSelected(e); setModal("view"); };
    const close      = () => { setModal(null); setSelected(null); setErr(""); };

    const save = async () => {
        if (!form.accountId) { setErr("Please select an account."); return; }
        if (!form.amount || parseFloat(form.amount)<=0) { setErr("Please enter a valid amount."); return; }
        setSaving(true); setErr("");
        try {
            const body = {
                accountId:   parseInt(form.accountId),
                taxRateId:   form.taxRateId ? parseInt(form.taxRateId) : null,
                description: form.description||null,
                amount:      parseFloat(form.amount),
                expenseDate: form.expenseDate,
                receiptUrl:  form.receiptUrl||null,
            };
            const res = await fetch(`${API_BASE}/api/expenses`, { method:"POST", headers:authHeaders(), body:JSON.stringify(body) });
            if (!res.ok) { const e=await res.json().catch(()=>{}); setErr(e?.message||"Failed to create expense."); setSaving(false); return; }
            close(); load();
        } catch { setErr("Server error."); }
        setSaving(false);
    };

    const action = async (id, endpoint) => {
        await fetch(`${API_BASE}/api/expenses/${id}/${endpoint}`, { method:"POST", headers:authHeaders() }).catch(()=>{});
        load();
        if (selected?.id===id) {
            const updated = await fetch(`${API_BASE}/api/expenses/${id}`, { headers:authHeaders() }).then(r=>r.json()).catch(()=>null);
            if (updated) setSelected(updated);
        }
    };

    // Summary
    const counts    = { ALL:expenses.length, PENDING:0, APPROVED:0, REJECTED:0 };
    expenses.forEach(e=>{ if(counts[e.status]!==undefined) counts[e.status]++; });
    const pendingTotal  = expenses.filter(e=>e.status==="PENDING").reduce((s,e)=>s+(parseFloat(e.amount)||0),0);
    const approvedTotal = expenses.filter(e=>e.status==="APPROVED").reduce((s,e)=>s+(parseFloat(e.amount)||0),0);

    // Expense accounts only
    const expenseAccounts = accounts.filter(a=>a.type==="EXPENSE" && a.isActive!==false);

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* ── HEADER ── */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:"-0.5px", margin:0 }}>Expenses</h1>
                    <p style={{ fontSize:13, color:C.textDim, marginTop:5 }}>{expenses.length} expense{expenses.length!==1?"s":""} total</p>
                </div>
                <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:7, background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 18px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> New Expense
                </button>
            </div>

            {/* ── SUMMARY CARDS ── */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                <SummaryCard label="Pending Approval" value={`RON ${fmt(pendingTotal)}`} count={counts.PENDING} color="#b09a6a" C={C} />
                <SummaryCard label="Approved"         value={`RON ${fmt(approvedTotal)}`} count={counts.APPROVED} color="#7aab8a" C={C} />
                <SummaryCard label="Rejected"         value={`${counts.REJECTED} item${counts.REJECTED!==1?"s":""}`} count={counts.REJECTED} color="#b07a7a" C={C} />
            </div>

            {/* ── FILTER TABS ── */}
            <div style={{ display:"flex", gap:6, marginBottom:20 }}>
                {[["ALL","All"],["PENDING","Pending"],["APPROVED","Approved"],["REJECTED","Rejected"]].map(([key,label])=>(
                    <button key={key} onClick={()=>setFilter(key)}
                            style={{ border:`1px solid ${filter===key?(STATUS[key]||{color:C.border2}).color:C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:filter===key?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:filter===key?`${(STATUS[key]||{bg:C.border}).bg||C.border}`:C.card, color:filter===key?(STATUS[key]||{color:C.text}).color:C.textMid, transition:"all 0.15s" }}>
                        {label} <span style={{ opacity:0.6 }}>({counts[key]??expenses.length})</span>
                    </button>
                ))}
            </div>

            {/* ── TABLE ── */}
            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C} /></div>
            ) : filtered.length===0 ? (
                <Empty onAdd={openCreate} C={C} />
            ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                            {["Description","Account","Date","Amount","Status",""].map((h,i)=>(
                                <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===5?"right":"left" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((e,i)=>(
                            <ExpRow key={e.id} exp={e} i={i} C={C} onClick={()=>openView(e)} onAction={action} />
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {modal==="create" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:480 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <div>
                                <h2 style={{ fontSize:17, fontWeight:600, color:C.text, margin:0 }}>New Expense</h2>
                                <p style={{ fontSize:12, color:C.textDim, marginTop:3 }}>Submitted as Pending — requires approval</p>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>

                            {/* Account */}
                            <Sel label="Expense Account *" val={form.accountId} set={v=>setForm(f=>({...f,accountId:v}))} C={C}>
                                <option value="">Select account...</option>
                                {expenseAccounts.map(a=><option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                            </Sel>

                            {/* Amount + Date */}
                            <div style={{ display:"flex", gap:12 }}>
                                <FInput label="Amount (RON) *" val={form.amount} set={v=>setForm(f=>({...f,amount:v}))} type="number" ph="0.00" C={C} />
                                <FInput label="Date *" val={form.expenseDate} set={v=>setForm(f=>({...f,expenseDate:v}))} type="date" C={C} />
                            </div>

                            {/* Tax Rate */}
                            <Sel label="Tax Rate" val={form.taxRateId} set={v=>setForm(f=>({...f,taxRateId:v}))} C={C}>
                                <option value="">No tax rate</option>
                                {taxRates.filter(t=>t.isActive!==false).map(t=><option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                            </Sel>

                            {/* Description */}
                            <FInput label="Description" val={form.description} set={v=>setForm(f=>({...f,description:v}))} ph="What was this expense for?" C={C} />

                            {/* Receipt URL */}
                            <FInput label="Receipt URL" val={form.receiptUrl} set={v=>setForm(f=>({...f,receiptUrl:v}))} ph="https://..." C={C} />

                            {err && <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>

                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
                            <button onClick={save} disabled={saving} style={{ background:"#7b9cba", border:"none", borderRadius:9, padding:"9px 22px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving?"Submitting...":"Submit Expense"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── VIEW MODAL ── */}
            {modal==="view" && selected && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:460 }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"22px 24px 18px", borderBottom:`1px solid ${C.border}` }}>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                                    <h2 style={{ fontSize:18, fontWeight:700, color:C.text, margin:0 }}>RON {fmt(selected.amount)}</h2>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <p style={{ fontSize:13, color:C.textMid, margin:0 }}>{selected.description||"No description"}</p>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                <InfoBlock label="Account"    val={`${selected.accountCode} — ${selected.accountName}`} C={C} />
                                <InfoBlock label="Date"       val={fmtDate(selected.expenseDate)} C={C} />
                                <InfoBlock label="Tax Rate"   val={selected.taxRateName||"—"} C={C} />
                                <InfoBlock label="Submitted"  val={fmtDate(selected.createdAt)} C={C} />
                            </div>

                            {selected.receiptUrl && (
                                <div style={{ background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)", borderRadius:10, padding:"10px 14px", border:`1px solid ${C.border}` }}>
                                    <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 4px" }}>Receipt</p>
                                    <a href={selected.receiptUrl} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#7b9cba", textDecoration:"none" }}>{selected.receiptUrl}</a>
                                </div>
                            )}

                            {/* Approval actions */}
                            {selected.status==="PENDING" && (
                                <div style={{ display:"flex", gap:8, paddingTop:4 }}>
                                    <button onClick={()=>action(selected.id,"approve")}
                                            style={{ flex:1, background:"#7aab8a", border:"none", borderRadius:9, padding:"10px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                        ✓ Approve
                                    </button>
                                    <button onClick={()=>action(selected.id,"reject")}
                                            style={{ flex:1, background:"#b07a7a18", border:"1px solid #b07a7a40", borderRadius:9, padding:"10px", color:"#b07a7a", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                        ✕ Reject
                                    </button>
                                </div>
                            )}

                            {selected.status==="APPROVED" && (
                                <div style={{ background:"#7aab8a12", border:"1px solid #7aab8a30", borderRadius:10, padding:"12px 14px", display:"flex", alignItems:"center", gap:8 }}>
                                    <span style={{ color:"#7aab8a", fontSize:16 }}>✓</span>
                                    <p style={{ fontSize:13, color:"#7aab8a", margin:0 }}>Approved — journal entry posted automatically.</p>
                                </div>
                            )}

                            {selected.status==="REJECTED" && (
                                <div style={{ background:"#b07a7a12", border:"1px solid #b07a7a30", borderRadius:10, padding:"12px 14px" }}>
                                    <p style={{ fontSize:13, color:"#b07a7a", margin:0 }}>This expense was rejected.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Overlay>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark?"invert(1)":"none"}; opacity:0.5; }
        input::placeholder,textarea::placeholder { color:${C.textDim}; }
        input:focus,select:focus { outline:none; border-color:#7b9cba !important; }
        button:focus { outline:none; }
        .exp-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
        .exp-row:hover .exp-actions { opacity:1!important; }
      `}</style>
        </div>
    );
}

function ExpRow({ exp, i, C, onClick, onAction }) {
    return (
        <tr className="exp-row" onClick={onClick} style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*25}ms both` }}>
            <td style={{ padding:"14px 20px" }}>
                <p style={{ fontSize:13, fontWeight:500, color:C.text, margin:0 }}>{exp.description||"—"}</p>
            </td>
            <td style={{ padding:"14px 20px" }}>
                <div>
                    <p style={{ fontSize:13, color:C.text, margin:0 }}>{exp.accountName}</p>
                    <p style={{ fontSize:11, color:C.textDim, margin:"2px 0 0" }}>{exp.accountCode}</p>
                </div>
            </td>
            <td style={{ padding:"14px 20px", fontSize:13, color:C.textMid }}>{fmtDate(exp.expenseDate)}</td>
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:14, fontWeight:600, color:C.text }}>RON {fmt(exp.amount)}</span>
            </td>
            <td style={{ padding:"14px 20px" }}>
                <StatusBadge status={exp.status} />
            </td>
            <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <div className="exp-actions" style={{ display:"flex", gap:6, justifyContent:"flex-end", opacity:0, transition:"opacity 0.15s" }} onClick={e=>e.stopPropagation()}>
                    {exp.status==="PENDING" && (
                        <>
                            <QuickBtn label="Approve" color="#7aab8a" onClick={()=>onAction(exp.id,"approve")} />
                            <QuickBtn label="Reject"  color="#b07a7a" onClick={()=>onAction(exp.id,"reject")} />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
}

function SummaryCard({ label, value, count, color, C }) {
    return (
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600 }}>{label}</span>
                <span style={{ fontSize:11, color, background:`${color}18`, border:`1px solid ${color}30`, borderRadius:6, padding:"2px 8px", fontWeight:500 }}>{count}</span>
            </div>
            <p style={{ fontSize:20, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.5px" }}>{value}</p>
            <div style={{ height:2, background:`${color}20`, borderRadius:99, marginTop:12 }}>
                <div style={{ height:"100%", width:`${Math.min(count*20,100)}%`, background:color, borderRadius:99, opacity:0.7 }} />
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const s = STATUS[status]||STATUS.PENDING;
    return <span style={{ fontSize:11, color:s.color, background:s.bg, border:`1px solid ${s.color}30`, borderRadius:6, padding:"3px 9px", fontWeight:500 }}>{s.label}</span>;
}

function QuickBtn({ label, color, onClick }) {
    return <button onClick={onClick} style={{ background:`${color}15`, border:`1px solid ${color}30`, borderRadius:7, padding:"5px 10px", color, fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{label}</button>;
}

function InfoBlock({ label, val, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</span>
            <span style={{ fontSize:13, color:C.text, fontWeight:500 }}>{val}</span>
        </div>
    );
}

function FInput({ label, val, set, ph, type="text", C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                   style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s", width:"100%" }} />
        </div>
    );
}

function Sel({ label, val, set, C, children }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            <select value={val} onChange={e=>set(e.target.value)} style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:val?C.text:C.textDim, fontFamily:"'Outfit',sans-serif", cursor:"pointer", appearance:"none", width:"100%" }}>
                {children}
            </select>
        </div>
    );
}

function Empty({ onAdd, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#b09a6a18", border:"1px solid #b09a6a25", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6.5" stroke="#b09a6a" strokeWidth="1.3"/><path d="M8 4.5V8l2 2" stroke="#b09a6a" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>No expenses found</p>
                <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Track and manage company expenses</p>
            </div>
            <button onClick={onAdd} style={{ background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ New Expense</button>
        </div>
    );
}

function Overlay({ children, onClose, C }) {
    return (
        <div style={{ position:"fixed", inset:0, background:`rgba(0,0,0,${C.isDark?0.65:0.35})`, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", animation:"fadeIn 0.15s ease" }}
             onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
            {children}
        </div>
    );
}

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#7b9cba", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />; }