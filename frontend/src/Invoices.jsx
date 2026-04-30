import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

const STATUS = {
    DRAFT:   { label:"Draft",   color:"#6b7280", bg:"#6b728018" },
    SENT:    { label:"Sent",    color:"#7b9cba", bg:"#7b9cba18" },
    PAID:    { label:"Paid",    color:"#7aab8a", bg:"#7aab8a18" },
    OVERDUE: { label:"Overdue", color:"#b07a7a", bg:"#b07a7a18" },
    VOID:    { label:"Void",    color:"#9ca3af", bg:"#9ca3af18" },
};

function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmt(n)        { return new Intl.NumberFormat("ro-RO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n??0); }
function fmtDate(s)    { return s ? new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"; }
function today()       { return new Date().toISOString().split("T")[0]; }
function plusDays(n)   { const d=new Date(); d.setDate(d.getDate()+n); return d.toISOString().split("T")[0]; }

const EMPTY_ITEM = { description:"", quantity:"1", unitPrice:"", accountId:null };
const EMPTY_FORM = { clientId:"", taxRateId:"", issueDate:today(), dueDate:plusDays(30), notes:"", items:[{ ...EMPTY_ITEM }] };

// Statuses that have a journal entry posted
const HAS_JOURNAL = ["SENT","PAID","OVERDUE"];

export default function Invoices() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", cardAlt:"#0f1117", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", accent:"#a78bfa", isDark:true };

    const [invoices, setInvoices]       = useState([]);
    const [clients, setClients]         = useState([]);
    const [taxRates, setTaxRates]       = useState([]);
    const [revenueAccounts, setRevAccs] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [filter, setFilter]           = useState("ALL");
    const [modal, setModal]             = useState(null); // "create" | "view"
    const [selected, setSelected]       = useState(null);
    const [activeTab, setActiveTab]     = useState("invoice"); // "invoice" | "nota"
    const [journalEntry, setJournal]    = useState(null);
    const [journalLoading, setJLoad]    = useState(false);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [saving, setSaving]           = useState(false);
    const [err, setErr]                 = useState("");

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/invoices`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ setInvoices(Array.isArray(d)?d:[]); setLoading(false); })
            .catch(()=>setLoading(false));
    };

    useEffect(() => {
        load();
        fetch(`${API_BASE}/api/clients`,             { headers:authHeaders() }).then(r=>r.json()).then(d=>setClients(Array.isArray(d)?d:[])).catch(()=>{});
        fetch(`${API_BASE}/api/tax-rates`,           { headers:authHeaders() }).then(r=>r.json()).then(d=>setTaxRates(Array.isArray(d)?d:[])).catch(()=>{});
        fetch(`${API_BASE}/api/accounts/type/REVENUE`, { headers:authHeaders() }).then(r=>r.json()).then(d=>setRevAccs(Array.isArray(d)?d:[])).catch(()=>{});
    }, []);

    // Fetch journal entry when switching to nota tab
    const loadJournal = async (inv) => {
        if (!HAS_JOURNAL.includes(inv.status)) return;
        setJLoad(true);
        const refNumber = `JE-${inv.invoiceNumber}`;
        try {
            const res = await fetch(`${API_BASE}/api/journal-entries/reference/${encodeURIComponent(refNumber)}`, { headers:authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setJournal(data);
            } else {
                setJournal(null);
            }
        } catch {
            setJournal(null);
        }
        setJLoad(false);
    };

    const filtered = filter === "ALL" ? invoices : invoices.filter(i=>i.status===filter);

    const openCreate = () => {
        const defaultTax = taxRates.find(t=>t.isDefault) || taxRates[0];
        setForm({ ...EMPTY_FORM, taxRateId: defaultTax?.id||"", issueDate:today(), dueDate:plusDays(30), items:[{...EMPTY_ITEM}] });
        setErr(""); setModal("create");
    };

    const openView = inv => {
        setSelected(inv);
        setActiveTab("invoice");
        setJournal(null);
        setModal("view");
    };

    const close = () => { setModal(null); setSelected(null); setErr(""); setJournal(null); setActiveTab("invoice"); };

    const switchTab = (tab) => {
        setActiveTab(tab);
        if (tab === "nota" && selected && !journalEntry) {
            loadJournal(selected);
        }
    };

    const [customRate, setCustomRate] = useState("");

    // Item helpers
    const setItem  = (i, field, val) => setForm(f => { const items=[...f.items]; items[i]={...items[i],[field]:val}; return {...f,items}; });
    const addItem  = () => setForm(f => ({...f, items:[...f.items,{...EMPTY_ITEM}]}));
    const delItem  = i  => setForm(f => ({...f, items:f.items.filter((_,j)=>j!==i)}));

    // Computed totals — suporta si custom rate
    const isCustomRate = form.taxRateId === "custom";
    const subtotal = form.items.reduce((s,item) => s + (parseFloat(item.quantity)||0)*(parseFloat(item.unitPrice)||0), 0);
    const taxRate  = isCustomRate ? null : taxRates.find(t=>t.id===parseInt(form.taxRateId));
    const effectiveRate = isCustomRate ? (parseFloat(customRate)||0) : (taxRate?.rate||0);
    const taxAmt   = subtotal * (effectiveRate/100);
    const total    = subtotal + taxAmt;

    const save = async () => {
        if (!form.clientId)  { setErr("Please select a client."); return; }
        if (!form.taxRateId) { setErr("Please select a tax rate."); return; }
        if (isCustomRate && (!customRate || parseFloat(customRate) < 0)) { setErr("Enter a valid custom tax rate (0 or more)."); return; }
        if (form.items.some(it=>!it.description||!it.unitPrice)) { setErr("All items need a description and price."); return; }
        setSaving(true); setErr("");
        try {
            let taxRateId = parseInt(form.taxRateId);

            // Daca e custom, cream o taxa noua temporara in DB
            if (isCustomRate) {
                const customRes = await fetch(`${API_BASE}/api/tax-rates`, {
                    method:"POST", headers:authHeaders(),
                    body: JSON.stringify({ name:`Custom ${customRate}%`, rate: parseFloat(customRate), type:"VAT", isDefault: false })
                });
                if (!customRes.ok) { setErr("Failed to create custom tax rate."); setSaving(false); return; }
                const customTax = await customRes.json();
                taxRateId = customTax.id;
            }

            const body = {
                clientId:  parseInt(form.clientId),
                taxRateId,
                issueDate: form.issueDate,
                dueDate:   form.dueDate,
                notes:     form.notes||null,
                items: form.items.map(it => ({
                    description: it.description,
                    quantity:    parseFloat(it.quantity)||1,
                    unitPrice:   parseFloat(it.unitPrice)||0,
                    accountId:   it.accountId||null,
                })),
            };
            const res = await fetch(`${API_BASE}/api/invoices`, { method:"POST", headers:authHeaders(), body:JSON.stringify(body) });
            if (!res.ok) { const e=await res.json().catch(()=>{}); setErr(e?.message||"Failed to create invoice."); setSaving(false); return; }
            close(); load();
        } catch { setErr("Server error."); }
        setSaving(false);
    };

    const action = async (id, endpoint) => {
        await fetch(`${API_BASE}/api/invoices/${id}/${endpoint}`, { method:"POST", headers:authHeaders() }).catch(()=>{});
        load();
        if (selected?.id===id) {
            const updated = await fetch(`${API_BASE}/api/invoices/${id}`, { headers:authHeaders() }).then(r=>r.json()).catch(()=>null);
            if (updated) {
                setSelected(updated);
                // Reload journal if on nota tab
                if (activeTab === "nota") {
                    setJournal(null);
                    loadJournal(updated);
                }
            }
        }
    };

    // Summary counts
    const counts = { ALL:invoices.length, DRAFT:0, SENT:0, PAID:0, OVERDUE:0 };
    invoices.forEach(i => { if (counts[i.status]!==undefined) counts[i.status]++; });

    // Compute debit/credit totals for balance check
    const totalDebit  = journalEntry?.lines?.reduce((s,l) => s + (l.debitAmount||0),  0) ?? 0;
    const totalCredit = journalEntry?.lines?.reduce((s,l) => s + (l.creditAmount||0), 0) ?? 0;
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* ── HEADER ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:"-0.5px", margin:0 }}>Invoices</h1>
                    <p style={{ fontSize:13, color:C.textDim, marginTop:5 }}>{invoices.length} invoice{invoices.length!==1?"s":""} total</p>
                </div>
                <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:7, background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 18px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> New Invoice
                </button>
            </div>

            {/* ── STATUS FILTER TABS ── */}
            <div style={{ display:"flex", gap:6, marginBottom:20 }}>
                {[["ALL","All"],["DRAFT","Draft"],["SENT","Sent"],["PAID","Paid"],["OVERDUE","Overdue"]].map(([key,label]) => (
                    <button key={key} onClick={()=>setFilter(key)}
                            style={{ border:`1px solid ${filter===key?(STATUS[key]||{color:C.border2}).color:C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:filter===key?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:filter===key?`${(STATUS[key]||{bg:C.border}).bg||C.border}`:C.card, color:filter===key?(STATUS[key]||{color:C.text}).color:C.textMid, transition:"all 0.15s" }}>
                        {label} <span style={{ opacity:0.6 }}>({counts[key]??invoices.length})</span>
                    </button>
                ))}
            </div>

            {/* ── TABLE ── */}
            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C} /></div>
            ) : filtered.length===0 ? (
                <Empty label={filter==="ALL"?"No invoices yet.":``} onAdd={openCreate} C={C} />
            ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                            {["Invoice","Client","Issue Date","Due Date","Amount","Status",""].map((h,i) => (
                                <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===6?"right":"left" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((inv,i) => (
                            <InvRow key={inv.id} inv={inv} i={i} C={C} onClick={()=>openView(inv)} onAction={action} />
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {modal==="create" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:640, maxHeight:"90vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>

                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.card, zIndex:2 }}>
                            <div>
                                <h2 style={{ fontSize:17, fontWeight:600, color:C.text, margin:0 }}>New Invoice</h2>
                                <p style={{ fontSize:12, color:C.textDim, marginTop:3 }}>Creates as DRAFT — send when ready</p>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>

                            <div style={{ display:"flex", gap:12 }}>
                                <Sel label="Client *" val={form.clientId} set={v=>setForm(f=>({...f,clientId:v}))} C={C}>
                                    <option value="">Select client...</option>
                                    {clients.filter(c=>c.isActive!==false).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                </Sel>
                                <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Tax Rate *</label>
                                    <select value={form.taxRateId} onChange={e=>setForm(f=>({...f,taxRateId:e.target.value}))}
                                            style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:form.taxRateId?C.text:C.textDim, fontFamily:"'Outfit',sans-serif", cursor:"pointer", appearance:"none" }}>
                                        <option value="">Select rate...</option>
                                        {taxRates.filter(t=>t.isActive!==false).map(t=>(
                                            <option key={t.id} value={t.id}>{t.name} ({t.rate}%){t.isDefault?" ":""}</option>
                                        ))}
                                        <option value="custom">✏ Custom rate...</option>
                                    </select>
                                    {isCustomRate && (
                                        <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:4 }}>
                                            <input
                                                type="number" min="0" max="100" step="0.1"
                                                value={customRate}
                                                onChange={e=>setCustomRate(e.target.value)}
                                                placeholder="Ex: 21"
                                                style={{ ...inputStyle(C), flex:1 }}
                                            />
                                            <span style={{ fontSize:13, color:C.textMid, whiteSpace:"nowrap" }}>%</span>
                                            {customRate && (
                                                <span style={{ fontSize:12, color:"#7aab8a", whiteSpace:"nowrap" }}>
                                                    = RON {fmt(subtotal * (parseFloat(customRate)/100))} TVA
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display:"flex", gap:12 }}>
                                <FInput label="Issue Date *" val={form.issueDate} set={v=>setForm(f=>({...f,issueDate:v}))} type="date" C={C} />
                                <FInput label="Due Date *"   val={form.dueDate}   set={v=>setForm(f=>({...f,dueDate:v}))}   type="date" C={C} />
                            </div>

                            <div>
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Line Items</label>
                                    <button onClick={addItem} style={{ background:"#7b9cba18", border:"1px solid #7b9cba30", borderRadius:7, padding:"4px 10px", color:"#7b9cba", fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ Add item</button>
                                </div>

                                {/* Header */}
                                <div style={{ display:"grid", gridTemplateColumns:"1.4fr 60px 90px 1fr 80px 28px", gap:6, marginBottom:6 }}>
                                    {["Description","Qty","Unit Price","Revenue Account","Total",""].map((h,i)=>(
                                        <span key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", padding:"0 2px" }}>{h}</span>
                                    ))}
                                </div>

                                {form.items.map((item,i) => {
                                    const lineTotal = (parseFloat(item.quantity)||0)*(parseFloat(item.unitPrice)||0);
                                    // Find selected account for display
                                    const selectedAcc = revenueAccounts.find(a=>a.id===parseInt(item.accountId));
                                    return (
                                        <div key={i} style={{ display:"grid", gridTemplateColumns:"1.4fr 60px 90px 1fr 80px 28px", gap:6, marginBottom:8, alignItems:"center" }}>
                                            <input value={item.description} onChange={e=>setItem(i,"description",e.target.value)} placeholder="Service description" style={inputStyle(C)} />
                                            <input value={item.quantity}    onChange={e=>setItem(i,"quantity",e.target.value)}    type="number" min="0" style={inputStyle(C)} />
                                            <input value={item.unitPrice}   onChange={e=>setItem(i,"unitPrice",e.target.value)}   type="number" min="0" placeholder="0.00" style={inputStyle(C)} />
                                            {/* Account dropdown */}
                                            <select
                                                value={item.accountId||""}
                                                onChange={e=>setItem(i,"accountId",e.target.value?parseInt(e.target.value):null)}
                                                style={{ ...inputStyle(C), fontSize:12, color: item.accountId ? C.text : C.textDim }}
                                                title={selectedAcc ? `${selectedAcc.code} — ${selectedAcc.name}` : "Default: 704"}
                                            >
                                                <option value="">704 (default)</option>
                                                {revenueAccounts
                                                    .filter(a => a.subType === "Sintetic" || a.subType === "Analitic")
                                                    .map(a => (
                                                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                                                    ))
                                                }
                                            </select>
                                            <div style={{ fontSize:13, color:C.textMid, padding:"0 4px", textAlign:"right", whiteSpace:"nowrap" }}>RON {fmt(lineTotal)}</div>
                                            {form.items.length>1
                                                ? <button onClick={()=>delItem(i)} style={{ background:"none", border:"none", color:"#b07a7a", cursor:"pointer", fontSize:16, lineHeight:1, padding:0 }}>×</button>
                                                : <div />}
                                        </div>
                                    );
                                })}

                                <div style={{ marginTop:12, borderTop:`1px solid ${C.border}`, paddingTop:12, display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                                    <TotalRow label="Subtotal" val={`RON ${fmt(subtotal)}`} C={C} />
                                    <TotalRow label={`Tax (${effectiveRate}%)`} val={`RON ${fmt(taxAmt)}`} C={C} />
                                    <TotalRow label="Total" val={`RON ${fmt(total)}`} C={C} bold />
                                </div>
                            </div>

                            <FInput label="Notes" val={form.notes} set={v=>setForm(f=>({...f,notes:v}))} ph="Optional notes..." C={C} multiline />

                            {err && <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>

                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}`, position:"sticky", bottom:0, background:C.card }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
                            <button onClick={save} disabled={saving} style={{ background:"#7b9cba", border:"none", borderRadius:9, padding:"9px 22px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving?"Creating...":"Create Invoice"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── VIEW MODAL ── */}
            {modal==="view" && selected && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:580, maxHeight:"90vh", overflowY:"auto" }}>

                        {/* Header */}
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"22px 24px 18px", borderBottom:`1px solid ${C.border}` }}>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                                    <h2 style={{ fontSize:18, fontWeight:700, color:C.text, margin:0, letterSpacing:"-0.3px" }}>{selected.invoiceNumber}</h2>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <p style={{ fontSize:13, color:C.textMid, margin:0 }}>{selected.clientName} {selected.clientTaxId&&`· ${selected.clientTaxId}`}</p>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        {/* ── TABS ── */}
                        <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${C.border}`, padding:"0 24px" }}>
                            <TabBtn label="Invoice" active={activeTab==="invoice"} onClick={()=>switchTab("invoice")} C={C} />
                            {HAS_JOURNAL.includes(selected.status) && (
                                <TabBtn label="Notă Contabilă" active={activeTab==="nota"} onClick={()=>switchTab("nota")} C={C} accent />
                            )}
                        </div>

                        {/* ── TAB: INVOICE ── */}
                        {activeTab==="invoice" && (
                            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>

                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                                    <InfoBlock label="Issue Date" val={fmtDate(selected.issueDate)} C={C} />
                                    <InfoBlock label="Due Date"   val={fmtDate(selected.dueDate)}   C={C} />
                                    <InfoBlock label="Tax Rate"   val={`${selected.taxRateName} (${selected.taxRate}%)`} C={C} />
                                </div>

                                <div>
                                    <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, margin:"0 0 10px" }}>Line Items</p>
                                    <div style={{ border:`1px solid ${C.border}`, borderRadius:10, overflow:"hidden" }}>
                                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                            <thead>
                                            <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                                                {["Description","Qty","Unit Price","Total"].map(h=>(
                                                    <th key={h} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:600, padding:"8px 14px", textAlign:"left" }}>{h}</th>
                                                ))}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selected.items?.map((item,i)=>(
                                                <tr key={i} style={{ borderBottom:i<selected.items.length-1?`1px solid ${C.border}`:"none" }}>
                                                    <td style={{ padding:"10px 14px", fontSize:13, color:C.text }}>{item.description}</td>
                                                    <td style={{ padding:"10px 14px", fontSize:13, color:C.textMid }}>{item.quantity}</td>
                                                    <td style={{ padding:"10px 14px", fontSize:13, color:C.textMid }}>RON {fmt(item.unitPrice)}</td>
                                                    <td style={{ padding:"10px 14px", fontSize:13, color:C.text, fontWeight:500 }}>RON {fmt(item.total)}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5, paddingTop:4 }}>
                                    <TotalRow label="Subtotal" val={`RON ${fmt(selected.subtotal)}`} C={C} />
                                    <TotalRow label={`Tax (${selected.taxRate}%)`} val={`RON ${fmt(selected.taxAmount)}`} C={C} />
                                    <TotalRow label="Total" val={`RON ${fmt(selected.total)}`} C={C} bold />
                                </div>

                                {selected.notes && (
                                    <div style={{ background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)", borderRadius:10, padding:"12px 14px", border:`1px solid ${C.border}` }}>
                                        <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 6px" }}>Notes</p>
                                        <p style={{ fontSize:13, color:C.textMid, margin:0, lineHeight:1.6 }}>{selected.notes}</p>
                                    </div>
                                )}

                                <div style={{ display:"flex", gap:8, paddingTop:4, flexWrap:"wrap" }}>
                                    {selected.status==="DRAFT"   && <ActionBtn label="Send Invoice"  color="#7b9cba" onClick={()=>action(selected.id,"send")} C={C} />}
                                    {selected.status==="SENT"    && <ActionBtn label="Mark as Paid"  color="#7aab8a" onClick={()=>action(selected.id,"pay")}  C={C} />}
                                    {selected.status==="OVERDUE" && <ActionBtn label="Mark as Paid"  color="#7aab8a" onClick={()=>action(selected.id,"pay")}  C={C} />}
                                    {(selected.status==="DRAFT"||selected.status==="SENT") && <ActionBtn label="Void Invoice" color="#b07a7a" onClick={()=>action(selected.id,"void")} C={C} outline />}
                                </div>
                            </div>
                        )}

                        {/* ── TAB: NOTĂ CONTABILĂ ── */}
                        {activeTab==="nota" && (
                            <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>

                                {journalLoading ? (
                                    <div style={{ display:"flex", justifyContent:"center", padding:40 }}><Spin C={C} /></div>
                                ) : !journalEntry ? (
                                    <div style={{ textAlign:"center", padding:40 }}>
                                        <p style={{ fontSize:14, color:C.textMid }}>Nota contabilă nu a putut fi încărcată.</p>
                                        <p style={{ fontSize:12, color:C.textDim, marginTop:6 }}>Verifică că migrarea planului de conturi a rulat corect.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Entry header info */}
                                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                            <InfoBlock label="Număr notă" val={journalEntry.referenceNumber} C={C} />
                                            <InfoBlock label="Data"       val={fmtDate(journalEntry.entryDate)} C={C} />
                                        </div>
                                        <div>
                                            <InfoBlock label="Descriere" val={journalEntry.description} C={C} />
                                        </div>

                                        {/* Formula contabila — DR/CR table */}
                                        <div>
                                            <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, margin:"0 0 10px" }}>
                                                Formulă contabilă
                                            </p>
                                            <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                                                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                                    <thead>
                                                    <tr style={{ background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)", borderBottom:`1px solid ${C.border}` }}>
                                                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, padding:"10px 16px", textAlign:"left", width:80 }}>Tip</th>
                                                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, padding:"10px 16px", textAlign:"left", width:70 }}>Cont</th>
                                                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, padding:"10px 16px", textAlign:"left" }}>Denumire cont</th>
                                                        <th style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, padding:"10px 16px", textAlign:"right" }}>Sumă (RON)</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {journalEntry.lines?.map((line, i) => {
                                                        const isDebit  = (line.debitAmount||0)  > 0;
                                                        const isCredit = (line.creditAmount||0) > 0;
                                                        const amount   = isDebit ? line.debitAmount : line.creditAmount;
                                                        const tipColor = isDebit ? "#7b9cba" : "#7aab8a";
                                                        const tipLabel = isDebit ? "Debit" : "Credit";
                                                        const tipBg    = isDebit ? "#7b9cba15" : "#7aab8a15";
                                                        return (
                                                            <tr key={i} style={{ borderBottom: i < journalEntry.lines.length-1 ? `1px solid ${C.border}` : "none", transition:"background 0.1s" }}>
                                                                <td style={{ padding:"12px 16px" }}>
                                                                    <span style={{ fontSize:11, fontWeight:600, color:tipColor, background:tipBg, border:`1px solid ${tipColor}25`, borderRadius:5, padding:"3px 8px" }}>
                                                                        {tipLabel}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding:"12px 16px" }}>
                                                                    <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:tipColor }}>
                                                                        {line.accountCode}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding:"12px 16px" }}>
                                                                    <div>
                                                                        <p style={{ fontSize:13, color:C.text, margin:0, fontWeight:500 }}>{line.accountName}</p>
                                                                        {line.description && <p style={{ fontSize:11, color:C.textDim, margin:"2px 0 0" }}>{line.description}</p>}
                                                                    </div>
                                                                </td>
                                                                <td style={{ padding:"12px 16px", textAlign:"right" }}>
                                                                    <span style={{ fontSize:14, fontWeight:600, color:C.text }}>
                                                                        {fmt(amount)}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Balance check */}
                                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:isBalanced?(C.isDark?"#7aab8a10":"#f0faf4"):(C.isDark?"#b07a7a10":"#fff0f0"), border:`1px solid ${isBalanced?"#7aab8a30":"#b07a7a30"}`, borderRadius:10, padding:"12px 16px" }}>
                                            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                                                <span style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px" }}>Verificare echilibru</span>
                                                <span style={{ fontSize:13, color:isBalanced?"#7aab8a":"#b07a7a", fontWeight:600 }}>
                                                    {isBalanced ? "✓ Înregistrare echilibrată — Debit = Credit" : "⚠ Dezechilibru detectat"}
                                                </span>
                                            </div>
                                            <div style={{ display:"flex", gap:24, textAlign:"right" }}>
                                                <div>
                                                    <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:0 }}>Total Debit</p>
                                                    <p style={{ fontSize:14, fontWeight:700, color:"#7b9cba", margin:"2px 0 0" }}>RON {fmt(totalDebit)}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:0 }}>Total Credit</p>
                                                    <p style={{ fontSize:14, fontWeight:700, color:"#7aab8a", margin:"2px 0 0" }}>RON {fmt(totalCredit)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Formula shorthand */}
                                        <div style={{ background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)", border:`1px solid ${C.border}`, borderRadius:10, padding:"14px 16px" }}>
                                            <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px", fontWeight:600 }}>Formulă simplificată</p>
                                            <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                                                {/* Debit accounts */}
                                                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                                    {journalEntry.lines?.filter(l=>(l.debitAmount||0)>0).map((l,i)=>(
                                                        <span key={i} style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:6, padding:"3px 8px" }}>{l.accountCode}</span>
                                                    ))}
                                                </div>
                                                <span style={{ fontSize:16, color:C.textDim, fontWeight:300 }}>=</span>
                                                {/* Credit accounts */}
                                                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                                    {journalEntry.lines?.filter(l=>(l.creditAmount||0)>0).map((l,i)=>(
                                                        <span key={i} style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:6, padding:"3px 8px" }}>{l.accountCode}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                    </div>
                </Overlay>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark?"invert(1)":"none"}; opacity:0.5; }
        input::placeholder { color:${C.textDim}; }
        input:focus,select:focus { outline:none; border-color:#7b9cba !important; }
        button:focus { outline:none; }
        .inv-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
        .inv-row:hover .inv-actions { opacity:1!important; }
      `}</style>
        </div>
    );
}

function TabBtn({ label, active, onClick, C, accent }) {
    const color = accent ? "#9b8fba" : C.blue;
    return (
        <button onClick={onClick} style={{
            background:"none", border:"none", borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
            padding:"12px 16px", fontSize:13, fontWeight: active ? 600 : 400,
            color: active ? color : C.textMid, cursor:"pointer", fontFamily:"'Outfit',sans-serif",
            transition:"all 0.15s", marginBottom:-1
        }}>
            {label}
        </button>
    );
}

function InvRow({ inv, i, C, onClick, onAction }) {
    const s = STATUS[inv.status] || STATUS.DRAFT;
    const isOverdue = inv.status==="SENT" && new Date(inv.dueDate) < new Date();
    return (
        <tr className="inv-row" onClick={onClick} style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*25}ms both` }}>
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{inv.invoiceNumber}</span>
            </td>
            <td style={{ padding:"14px 20px" }}>
                <div>
                    <p style={{ fontSize:13, color:C.text, margin:0, fontWeight:500 }}>{inv.clientName}</p>
                    {inv.clientTaxId && <p style={{ fontSize:11, color:C.textDim, margin:"2px 0 0" }}>{inv.clientTaxId}</p>}
                </div>
            </td>
            <td style={{ padding:"14px 20px", fontSize:13, color:C.textMid }}>{fmtDate(inv.issueDate)}</td>
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:13, color:isOverdue&&inv.status==="SENT"?"#b07a7a":C.textMid }}>{fmtDate(inv.dueDate)}</span>
            </td>
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:14, fontWeight:600, color:C.text }}>RON {fmt(inv.total)}</span>
            </td>
            <td style={{ padding:"14px 20px" }}>
                <StatusBadge status={inv.status} />
            </td>
            <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <div className="inv-actions" style={{ display:"flex", gap:6, justifyContent:"flex-end", opacity:0, transition:"opacity 0.15s" }} onClick={e=>e.stopPropagation()}>
                    {inv.status==="DRAFT"  && <QuickBtn label="Send" color="#7b9cba" onClick={()=>onAction(inv.id,"send")} />}
                    {(inv.status==="SENT"||inv.status==="OVERDUE") && <QuickBtn label="Pay"  color="#7aab8a" onClick={()=>onAction(inv.id,"pay")} />}
                </div>
            </td>
        </tr>
    );
}

function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.DRAFT;
    return <span style={{ fontSize:11, color:s.color, background:s.bg, border:`1px solid ${s.color}30`, borderRadius:6, padding:"3px 9px", fontWeight:500 }}>{s.label}</span>;
}

function QuickBtn({ label, color, onClick }) {
    return <button onClick={onClick} style={{ background:`${color}15`, border:`1px solid ${color}30`, borderRadius:7, padding:"5px 10px", color, fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>{label}</button>;
}

function ActionBtn({ label, color, onClick, C, outline }) {
    return (
        <button onClick={onClick} style={{ background:outline?`${color}12`:color, border:`1px solid ${outline?color+"40":color}`, borderRadius:9, padding:"9px 18px", color:outline?color:(C.isDark?"#0a0f17":"#fff"), fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
            {label}
        </button>
    );
}

function TotalRow({ label, val, C, bold }) {
    return (
        <div style={{ display:"flex", gap:32, alignItems:"center" }}>
            <span style={{ fontSize:13, color:C.textMid }}>{label}</span>
            <span style={{ fontSize: bold?16:13, fontWeight:bold?700:500, color:bold?C.text:C.textMid, minWidth:120, textAlign:"right" }}>{val}</span>
        </div>
    );
}

function InfoBlock({ label, val, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</span>
            <span style={{ fontSize:13, color:C.text, fontWeight:500 }}>{val}</span>
        </div>
    );
}

function FInput({ label, val, set, ph, type="text", C, multiline }) {
    const style = { background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s", width:"100%", resize:"none" };
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            {multiline
                ? <textarea value={val} onChange={e=>set(e.target.value)} placeholder={ph} rows={3} style={style} />
                : <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph} style={style} />}
        </div>
    );
}

function Sel({ label, val, set, C, children }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            <select value={val} onChange={e=>set(e.target.value)} style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:val?C.text:C.textDim, fontFamily:"'Outfit',sans-serif", cursor:"pointer", appearance:"none" }}>
                {children}
            </select>
        </div>
    );
}

function inputStyle(C) {
    return { background:C.bg, border:`1px solid ${C.border2}`, borderRadius:8, padding:"8px 10px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", width:"100%", transition:"border-color 0.2s" };
}

function Empty({ label, onAdd, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#7b9cba18", border:"1px solid #7b9cba25", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="#7b9cba" strokeWidth="1.3"/><path d="M5 5h6M5 8h6M5 11h4" stroke="#7b9cba" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </div>
            <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>No invoices found</p>
                <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>{label||"Create your first invoice"}</p>
            </div>
            <button onClick={onAdd} style={{ background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ New Invoice</button>
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