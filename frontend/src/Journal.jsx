import { useTheme } from "./App";
import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8080";

const TEMPLATES = [
    { key:"amortizare",  label:"Amortizare",  description:"Cheltuieli cu amortizarea imobilizărilor", lines:[{debit:true,note:"Cheltuieli privind amortizarea"},{debit:false,note:"Amortizarea imobilizărilor corporale"}] },
    { key:"salarii",     label:"Salarii",      description:"Înregistrare cheltuieli salariale",         lines:[{debit:true,note:"Cheltuieli cu salariile personalului"},{debit:false,note:"Personal — salarii datorate"}] },
    { key:"cas_cass",    label:"CAS / CASS",   description:"Contribuții sociale angajator",             lines:[{debit:true,note:"Cheltuieli CAS angajator"},{debit:true,note:"Cheltuieli CASS angajator"},{debit:false,note:"Contribuția la asigurări sociale"},{debit:false,note:"Contribuția la asig. soc. de sănătate"}] },
    { key:"provizioane", label:"Provizioane",  description:"Constituire provizioane",                   lines:[{debit:true,note:"Cheltuieli privind provizioanele"},{debit:false,note:"Provizioane pentru litigii"}] },
    { key:"divers",      label:"Divers",       description:"",                                          lines:[{debit:null,note:""},{debit:null,note:""}] },
];

const SOURCE_META = {
    "JE-INV": { label:"Factură emisă",       color:"#7b9cba", bg:"#7b9cba15" },
    "SINV":   { label:"Factură primită",      color:"#b07a7a", bg:"#b07a7a15" },
    "PAY":    { label:"Plată furnizor",       color:"#b09a6a", bg:"#b09a6a15" },
    "EXP":    { label:"Cheltuială",           color:"#9b7ab0", bg:"#9b7ab015" },
    "BANK":   { label:"Operațiune bancară",   color:"#7aab8a", bg:"#7aab8a15" },
    "NOTE":   { label:"Notă manuală",         color:"#a78bfa", bg:"#a78bfa15" },
    "CLOSE":  { label:"Închidere lună",       color:"#9b7ab0", bg:"#9b7ab015" },
};

function getSourceMeta(ref) {
    if (!ref) return { label:"Altele", color:"#6b7280", bg:"#6b728015" };
    if (ref.startsWith("CLOSE-")) return SOURCE_META["CLOSE"];
    for (const [prefix, meta] of Object.entries(SOURCE_META)) {
        if (ref.startsWith(prefix)) return meta;
    }
    return { label:"Altele", color:"#6b7280", bg:"#6b728015" };
}

function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmt(n)        { return new Intl.NumberFormat("ro-RO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n??0); }
function fmtDate(s)    { return s ? new Date(s).toLocaleDateString("ro-RO",{month:"short",day:"numeric",year:"numeric"}) : "—"; }
function today()       { return new Date().toISOString().split("T")[0]; }
function mm(m)         { return m < 10 ? "0"+m : String(m); }

const SOURCE_FILTERS = [
    { key:"ALL",    label:"Toate" },
    { key:"NOTE",   label:"Note manuale" },
    { key:"JE-INV", label:"Facturi emise" },
    { key:"SINV",   label:"Facturi primite" },
    { key:"PAY",    label:"Plăți furnizori" },
    { key:"EXP",    label:"Cheltuieli" },
    { key:"BANK",   label:"Operațiuni bancă" },
    { key:"CLOSE",  label:"Închidere lună" },
];

const EMPTY_LINE = { accountId:"", debitAmount:"", creditAmount:"", description:"" };

export default function JurnalContabil() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", accent:"#a78bfa", isDark:true };

    const [entries, setEntries]   = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState("ALL");
    const [search, setSearch]     = useState("");
    const [sortDir, setSortDir]   = useState("desc");
    const [selected, setSelected] = useState(null);
    const [modal, setModal]       = useState(false);

    const [template, setTemplate] = useState(null);
    const [description, setDesc]  = useState("");
    const [entryDate, setDate]    = useState(today());
    const [lines, setLines]       = useState([{...EMPTY_LINE},{...EMPTY_LINE}]);
    const [saving, setSaving]     = useState(false);
    const [err, setErr]           = useState("");

    const load = useCallback(() => {
        setLoading(true);
        fetch(`${API_BASE}/api/journal-entries`, { headers:authHeaders() })
            .then(r=>r.json())
            .then(d=>{ setEntries(Array.isArray(d)?d:[]); setLoading(false); })
            .catch(()=>setLoading(false));
    }, []);

    useEffect(() => {
        load();
        fetch(`${API_BASE}/api/accounts`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>setAccounts(Array.isArray(d)?d:[])).catch(()=>{});
    }, [load]);

    const visible = entries
        .filter(e => {
            if (filter === "ALL")   return true;
            if (filter === "CLOSE") return e.referenceNumber?.startsWith("CLOSE-");
            return e.referenceNumber?.startsWith(filter);
        })
        .filter(e => {
            if (!search.trim()) return true;
            const q = search.toLowerCase();
            return e.referenceNumber?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q);
        })
        .sort((a,b) => {
            const da=new Date(a.entryDate), db=new Date(b.entryDate);
            return sortDir==="desc" ? db-da : da-db;
        });

    const totalDebit  = selected?.lines?.reduce((s,l)=>s+(l.debitAmount||0),0)  ?? 0;
    const totalCredit = selected?.lines?.reduce((s,l)=>s+(l.creditAmount||0),0) ?? 0;
    const isBalanced  = Math.abs(totalDebit-totalCredit)<0.01;

    const applyTemplate = (tpl) => {
        setTemplate(tpl.key);
        if (tpl.description) setDesc(tpl.description);
        setLines(tpl.lines.map(l => ({
            accountId:    "",
            debitAmount:  l.debit === true  ? "" : "0",
            creditAmount: l.debit === false ? "" : "0",
            description:  l.note,
        })));
        setErr("");
    };

    const setLine = (i,field,val) => setLines(ls => { const n=[...ls]; n[i]={...n[i],[field]:val}; return n; });
    const addLine = () => setLines(ls=>[...ls,{...EMPTY_LINE}]);
    const delLine = (i) => setLines(ls=>ls.filter((_,j)=>j!==i));

    const formDebit  = lines.reduce((s,l)=>s+(parseFloat(l.debitAmount)||0),0);
    const formCredit = lines.reduce((s,l)=>s+(parseFloat(l.creditAmount)||0),0);
    const formOk     = formDebit>0 && Math.abs(formDebit-formCredit)<0.01;

    const openCreate = () => { setTemplate(null); setDesc(""); setDate(today()); setLines([{...EMPTY_LINE},{...EMPTY_LINE}]); setErr(""); setModal(true); };
    const closeModal = () => { setModal(false); setErr(""); };

    const save = async () => {
        if (!description.trim())         { setErr("Descrierea este obligatorie."); return; }
        if (!entryDate)                  { setErr("Data este obligatorie."); return; }
        if (lines.some(l=>!l.accountId)) { setErr("Toate liniile trebuie să aibă un cont selectat."); return; }
        if (!formOk)                     { setErr(`Nota nu este echilibrată: Debit ${fmt(formDebit)} ≠ Credit ${fmt(formCredit)}`); return; }
        setSaving(true); setErr("");
        try {
            const body = {
                description,
                entryDate,
                lines: lines.map(l => ({
                    accountId:    parseInt(l.accountId),
                    debitAmount:  parseFloat(l.debitAmount)  > 0 ? parseFloat(l.debitAmount)  : 0,
                    creditAmount: parseFloat(l.creditAmount) > 0 ? parseFloat(l.creditAmount) : 0,
                    description:  l.description || description,
                })),
            };
            const res = await fetch(`${API_BASE}/api/journal-entries`, { method:"POST", headers:authHeaders(), body:JSON.stringify(body) });
            if (!res.ok) { const txt=await res.text().catch(()=>"Eroare server."); setErr(txt); setSaving(false); return; }
            closeModal(); load();
        } catch { setErr("Eroare server."); }
        setSaving(false);
    };

    const iS = () => ({ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s", width:"100%", outline:"none" });

    const showClosePanel = filter === "CLOSE";

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* HEADER */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", marginBottom:24 }}>
                <div style={{ display:"flex", gap:8 }}>
                    {!showClosePanel && (
                        <button onClick={()=>setSortDir(d=>d==="desc"?"asc":"desc")}
                                style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:10, padding:"9px 14px", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            {sortDir==="desc"?"↓ Recente":"↑ Vechi"}
                        </button>
                    )}
                    <button onClick={openCreate}
                            style={{ display:"flex", alignItems:"center", gap:7, background:C.accent, border:"none", borderRadius:10, padding:"9px 18px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> Notă nouă
                    </button>
                </div>
            </div>

            {/* FILTER + SEARCH */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {SOURCE_FILTERS.map(sf => {
                        const meta   = sf.key==="ALL" ? null : sf.key==="CLOSE" ? { color:"#9b7ab0", bg:"#9b7ab015" } : SOURCE_META[sf.key];
                        const active = filter===sf.key;
                        const count  = sf.key==="ALL"   ? entries.length
                            : sf.key==="CLOSE" ? entries.filter(e=>e.referenceNumber?.startsWith("CLOSE-")).length
                                : entries.filter(e=>e.referenceNumber?.startsWith(sf.key)).length;
                        return (
                            <button key={sf.key} onClick={()=>setFilter(sf.key)}
                                    style={{ border:`1px solid ${active?(meta?.color||C.accent):C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:active?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:active?(meta?.bg||`${C.accent}18`):C.card, color:active?(meta?.color||C.accent):C.textMid, transition:"all 0.15s" }}>
                                {sf.label} <span style={{ opacity:0.6, marginLeft:5 }}>({count})</span>
                            </button>
                        );
                    })}
                </div>
                {!showClosePanel && (
                    <div style={{ position:"relative", minWidth:240 }}>
                        <span style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:C.textDim, fontSize:13, pointerEvents:"none" }}>⌕</span>
                        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Caută referință sau descriere..."
                               style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:10, padding:"8px 12px 8px 30px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", width:"100%", outline:"none" }}
                               onFocus={e=>e.target.style.borderColor="#a78bfa"} onBlur={e=>e.target.style.borderColor=C.border2} />
                    </div>
                )}
            </div>

            {/* CLOSE PANEL */}
            {showClosePanel && <ClosePanel C={C} onDone={load} />}

            {/* TABLE */}
            {!showClosePanel && (
                loading ? (
                    <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C}/></div>
                ) : visible.length===0 ? (
                    <EmptyState C={C} onAdd={openCreate}/>
                ) : (
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                            <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                                {["Referință","Data","Descriere","Sursă","Formulă","Status",""].map((h,i)=>(
                                    <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===6?"right":"left" }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {visible.map((entry,i)=>(
                                <EntryRow key={entry.id} entry={entry} i={i} C={C} onClick={()=>setSelected(entry)}/>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            {/* CREATE MODAL */}
            {modal && (
                <Overlay onClose={closeModal} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:700, maxHeight:"92vh", overflowY:"auto", display:"flex", flexDirection:"column" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.card, zIndex:2 }}>
                            <div>
                                <h2 style={{ fontSize:17, fontWeight:600, color:C.text, margin:0 }}>Notă contabilă nouă</h2>
                                <p style={{ fontSize:12, color:C.textDim, marginTop:3 }}>Referința se generează automat: NOTE-{new Date().getFullYear()}-NNNNN</p>
                            </div>
                            <button onClick={closeModal} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>
                            <div>
                                <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, margin:"0 0 10px" }}>Tip notă</p>
                                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                                    {TEMPLATES.map(tpl=>(
                                        <button key={tpl.key} onClick={()=>applyTemplate(tpl)}
                                                style={{ background:template===tpl.key?`${C.accent}18`:C.bg, border:`1px solid ${template===tpl.key?C.accent:C.border2}`, borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:template===tpl.key?600:400, color:template===tpl.key?C.accent:C.textMid, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                            {tpl.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display:"flex", gap:12 }}>
                                <div style={{ flex:2, display:"flex", flexDirection:"column", gap:6 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Descriere *</label>
                                    <input value={description} onChange={e=>setDesc(e.target.value)} placeholder="Ex: Amortizare lunară, Salarii noiembrie..."
                                           style={iS()} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                </div>
                                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Data *</label>
                                    <input type="date" value={entryDate} onChange={e=>setDate(e.target.value)}
                                           style={iS()} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                </div>
                            </div>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                                    <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, margin:0 }}>Linii contabile</p>
                                    <button onClick={addLine} style={{ background:`${C.accent}15`, border:`1px solid ${C.accent}30`, borderRadius:7, padding:"4px 10px", color:C.accent, fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ Adaugă linie</button>
                                </div>
                                <div style={{ display:"grid", gridTemplateColumns:"2fr 90px 90px 1.2fr 24px", gap:6, marginBottom:6 }}>
                                    {["Cont","Debit (RON)","Credit (RON)","Descriere linie",""].map((h,i)=>(
                                        <span key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", padding:"0 2px" }}>{h}</span>
                                    ))}
                                </div>
                                {lines.map((line,i)=>(
                                    <div key={i} style={{ display:"grid", gridTemplateColumns:"2fr 90px 90px 1.2fr 24px", gap:6, marginBottom:8, alignItems:"center" }}>
                                        <select value={line.accountId} onChange={e=>setLine(i,"accountId",e.target.value)}
                                                style={{ ...iS(), fontSize:12, color:line.accountId?C.text:C.textDim }}>
                                            <option value="">Selectează contul...</option>
                                            {accounts.filter(a=>a.isActive!==false&&a.subType!=="Clasa"&&a.subType!=="Grupa")
                                                .sort((a,b)=>a.code.localeCompare(b.code))
                                                .map(a=>(<option key={a.id} value={a.id}>{a.code} — {a.name}</option>))}
                                        </select>
                                        <input type="number" min="0" step="0.01" value={line.debitAmount}
                                               onChange={e=>{ setLine(i,"debitAmount",e.target.value); if(parseFloat(e.target.value)>0) setLine(i,"creditAmount","0"); }}
                                               placeholder="0.00" style={{ ...iS(), color:"#7b9cba" }}
                                               onFocus={e=>e.target.style.borderColor="#7b9cba"} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                        <input type="number" min="0" step="0.01" value={line.creditAmount}
                                               onChange={e=>{ setLine(i,"creditAmount",e.target.value); if(parseFloat(e.target.value)>0) setLine(i,"debitAmount","0"); }}
                                               placeholder="0.00" style={{ ...iS(), color:"#7aab8a" }}
                                               onFocus={e=>e.target.style.borderColor="#7aab8a"} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                        <input value={line.description} onChange={e=>setLine(i,"description",e.target.value)} placeholder="Descriere opțională..."
                                               style={iS()} onFocus={e=>e.target.style.borderColor=C.accent} onBlur={e=>e.target.style.borderColor=C.border2}/>
                                        {lines.length>2
                                            ? <button onClick={()=>delLine(i)} style={{ background:"none", border:"none", color:"#b07a7a", cursor:"pointer", fontSize:16, lineHeight:1, padding:0 }}>×</button>
                                            : <div/>}
                                    </div>
                                ))}
                                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:formOk?"#7aab8a0a":formDebit===0?C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)":"#b07a7a0a", border:`1px solid ${formOk?"#7aab8a30":formDebit===0?C.border:"#b07a7a30"}`, borderRadius:10, padding:"10px 14px", marginTop:4 }}>
                                    <span style={{ fontSize:13, fontWeight:600, color:formOk?"#7aab8a":formDebit===0?C.textDim:"#b07a7a" }}>
                                        {formOk ? "✓ Notă echilibrată" : formDebit===0 ? "Introdu sumele pentru a verifica echilibrul" : `⚠ Diferență: ${fmt(Math.abs(formDebit-formCredit))} RON`}
                                    </span>
                                    <div style={{ display:"flex", gap:16 }}>
                                        <span style={{ fontSize:12, color:"#7b9cba", fontWeight:600 }}>D: RON {fmt(formDebit)}</span>
                                        <span style={{ fontSize:12, color:"#7aab8a", fontWeight:600 }}>C: RON {fmt(formCredit)}</span>
                                    </div>
                                </div>
                            </div>
                            {err && <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}`, position:"sticky", bottom:0, background:C.card }}>
                            <button onClick={closeModal} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={save} disabled={saving||!formOk}
                                    style={{ background:C.accent, border:"none", borderRadius:9, padding:"9px 22px", color:"#fff", fontSize:13, fontWeight:600, cursor:saving||!formOk?"not-allowed":"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving||!formOk?0.6:1 }}>
                                {saving?"Se înregistrează...":"Înregistrează nota"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* DETAIL MODAL */}
            {selected && (
                <Overlay onClose={()=>setSelected(null)} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"22px 24px 18px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.card, zIndex:2 }}>
                            <div>
                                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                                    <span style={{ fontSize:15, fontFamily:"monospace", fontWeight:700, color:C.text }}>{selected.referenceNumber}</span>
                                    <SourceBadge ref_={selected.referenceNumber}/>
                                    <StatusBadge status={selected.status} C={C}/>
                                </div>
                                <p style={{ fontSize:13, color:C.textMid, margin:0 }}>{selected.description}</p>
                            </div>
                            <button onClick={()=>setSelected(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px", flexShrink:0 }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:18 }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                                <InfoBlock label="Data"      val={fmtDate(selected.entryDate)} C={C}/>
                                <InfoBlock label="Referință" val={selected.referenceNumber}     C={C}/>
                                <InfoBlock label="Status"    val={selected.status}              C={C}/>
                            </div>
                            <div style={{ background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 16px" }}>
                                <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px", fontWeight:600 }}>Formulă simplificată</p>
                                <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                        {selected.lines?.filter(l=>(l.debitAmount||0)>0).map((l,i)=>(
                                            <span key={i} style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:6, padding:"3px 9px" }}>{l.accountCode}</span>
                                        ))}
                                    </div>
                                    <span style={{ fontSize:16, color:C.textDim, fontWeight:300 }}>=</span>
                                    <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                        {selected.lines?.filter(l=>(l.creditAmount||0)>0).map((l,i)=>(
                                            <span key={i} style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:6, padding:"3px 9px" }}>{l.accountCode}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ border:`1px solid ${C.border}`, borderRadius:12, overflow:"hidden" }}>
                                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                    <thead>
                                    <tr style={{ background:C.isDark?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)", borderBottom:`1px solid ${C.border}` }}>
                                        {["Tip","Cont","Denumire cont","Sumă (RON)"].map((h,i)=>(
                                            <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, padding:"10px 16px", textAlign:i===3?"right":"left" }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selected.lines?.map((line,i)=>{
                                        const isDebit = (line.debitAmount||0)>0;
                                        const amount  = isDebit ? line.debitAmount : line.creditAmount;
                                        const color   = isDebit ? "#7b9cba" : "#7aab8a";
                                        return (
                                            <tr key={i} style={{ borderBottom:i<selected.lines.length-1?`1px solid ${C.border}`:"none" }}>
                                                <td style={{ padding:"12px 16px" }}>
                                                        <span style={{ fontSize:11, fontWeight:600, color, background:`${color}15`, border:`1px solid ${color}25`, borderRadius:5, padding:"3px 8px" }}>
                                                            {isDebit?"Debit":"Credit"}
                                                        </span>
                                                </td>
                                                <td style={{ padding:"12px 16px" }}>
                                                    <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color }}>{line.accountCode}</span>
                                                </td>
                                                <td style={{ padding:"12px 16px" }}>
                                                    <p style={{ fontSize:13, color:C.text, margin:0, fontWeight:500 }}>{line.accountName}</p>
                                                    {line.description && <p style={{ fontSize:11, color:C.textDim, margin:"2px 0 0" }}>{line.description}</p>}
                                                </td>
                                                <td style={{ padding:"12px 16px", textAlign:"right" }}>
                                                    <span style={{ fontSize:14, fontWeight:600, color:C.text }}>{fmt(amount)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:isBalanced?(C.isDark?"#7aab8a10":"#f0faf4"):(C.isDark?"#b07a7a10":"#fff0f0"), border:`1px solid ${isBalanced?"#7aab8a30":"#b07a7a30"}`, borderRadius:10, padding:"12px 16px" }}>
                                <span style={{ fontSize:13, color:isBalanced?"#7aab8a":"#b07a7a", fontWeight:600 }}>
                                    {isBalanced?"✓ Înregistrare echilibrată — Debit = Credit":"⚠ Dezechilibru detectat"}
                                </span>
                                <div style={{ display:"flex", gap:20 }}>
                                    <div style={{ textAlign:"right" }}>
                                        <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.4px", margin:0 }}>Total Debit</p>
                                        <p style={{ fontSize:14, fontWeight:700, color:"#7b9cba", margin:"2px 0 0" }}>RON {fmt(totalDebit)}</p>
                                    </div>
                                    <div style={{ textAlign:"right" }}>
                                        <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.4px", margin:0 }}>Total Credit</p>
                                        <p style={{ fontSize:14, fontWeight:700, color:"#7aab8a", margin:"2px 0 0" }}>RON {fmt(totalCredit)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Overlay>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
                @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
                @keyframes spin    { to{transform:rotate(360deg)} }
                input::placeholder { color:${C.textDim}; }
                input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark?"invert(1)":"none"}; opacity:0.5; }
                .je-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
            `}</style>
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   CLOSE PANEL — model SAGA
   Validare / Devalidare inchidere luna
══════════════════════════════════════════════════════ */
function ClosePanel({ C, onDone }) {
    const [year, setYear]       = useState(new Date().getFullYear());
    const [month, setMonth]     = useState(new Date().getMonth() + 1);
    const [status, setStatus]   = useState(null);
    const [result, setResult]   = useState(null);   // nota generata
    const [loading, setLoading] = useState(false);
    const [err, setErr]         = useState("");

    const checkStatus = useCallback(async () => {
        try {
            const res = await fetch(
                `${API_BASE}/api/journal-entries/close-period/status?year=${year}&month=${month}`,
                { headers: authHeaders() }
            );
            setStatus(await res.json());
        } catch {}
        setResult(null);
        setErr("");
    }, [year, month]);

    useEffect(() => { checkStatus(); }, [checkStatus]);

    const doClose = async () => {
        setLoading(true); setErr(""); setResult(null);
        try {
            const res = await fetch(
                `${API_BASE}/api/journal-entries/close-period?year=${year}&month=${month}`,
                { method:"POST", headers: authHeaders() }
            );
            if (!res.ok) {
                const e = await res.json().catch(()=>({}));
                setErr(e?.message || "Eroare la generarea închiderii.");
                setLoading(false); return;
            }
            setResult(await res.json());  // obiect singular, nu lista
            onDone();
            checkStatus();
        } catch { setErr("Eroare server."); }
        setLoading(false);
    };

    const doCancel = async () => {
        setLoading(true); setErr("");
        try {
            const res = await fetch(
                `${API_BASE}/api/journal-entries/close-period?year=${year}&month=${month}`,
                { method:"DELETE", headers: authHeaders() }
            );
            if (!res.ok) { setErr("Eroare la devalidarea închiderii."); setLoading(false); return; }
            setResult(null);
            onDone();
            checkStatus();
        } catch { setErr("Eroare server."); }
        setLoading(false);
    };

    const periodLabel = `${mm(month)}.${year}`;

    return (
        <div style={{ maxWidth:720 }}>

            {/* Card principal */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"22px 24px", marginBottom:16 }}>
                <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, margin:"0 0 18px" }}>
                    Validare / Devalidare închidere lună
                </p>

                {/* Selectoare an + luna + status */}
                <div style={{ display:"flex", alignItems:"flex-end", gap:12, marginBottom:18, flexWrap:"wrap" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>An</label>
                        <select value={year} onChange={e=>setYear(parseInt(e.target.value))}
                                style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", cursor:"pointer", appearance:"none" }}>
                            {[2023,2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                        <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Lună</label>
                        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))}
                                style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", cursor:"pointer", appearance:"none" }}>
                            {["Ianuarie","Februarie","Martie","Aprilie","Mai","Iunie","Iulie","August","Septembrie","Octombrie","Noiembrie","Decembrie"].map((m,i)=>(
                                <option key={i+1} value={i+1}>{m}</option>
                            ))}
                        </select>
                    </div>
                    {status && (
                        <div style={{ padding:"9px 16px", borderRadius:9, fontSize:12, fontWeight:600,
                            background: status.closed ? "#7aab8a15" : "#b09a6a15",
                            border: `1px solid ${status.closed ? "#7aab8a40" : "#b09a6a40"}`,
                            color: status.closed ? "#7aab8a" : "#b09a6a" }}>
                            {status.closed
                                ? `✓ Luna ${periodLabel} este închisă`
                                : `⚠ Luna ${periodLabel} nu este închisă`}
                        </div>
                    )}
                </div>

                {/* Info box */}
                <div style={{ background:C.isDark?"rgba(155,122,176,0.06)":"rgba(155,122,176,0.04)", border:"1px solid #9b7ab025", borderRadius:10, padding:"14px 16px", marginBottom:18 }}>
                    <p style={{ fontSize:11, color:"#9b7ab0", textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:700, margin:"0 0 10px" }}>
                        Structura notei de închidere (model SAGA)
                    </p>
                    <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"4px 12px", fontSize:12, lineHeight:1.8 }}>
                        <span style={{ fontFamily:"monospace", fontWeight:700, color:"#7b9cba" }}>DEBIT</span>
                        <span style={{ color:C.textMid }}>Cont <strong style={{color:C.text}}>121</strong> — total cheltuieli (6xx)</span>
                        <span style={{ fontFamily:"monospace", fontWeight:700, color:"#7aab8a" }}>CREDIT</span>
                        <span style={{ color:C.textMid }}>Fiecare cont <strong style={{color:C.text}}>6xx</strong> în parte</span>
                        <span style={{ fontFamily:"monospace", fontWeight:700, color:"#7b9cba" }}>DEBIT</span>
                        <span style={{ color:C.textMid }}>Fiecare cont <strong style={{color:C.text}}>7xx</strong> în parte</span>
                        <span style={{ fontFamily:"monospace", fontWeight:700, color:"#7aab8a" }}>CREDIT</span>
                        <span style={{ color:C.textMid }}>Cont <strong style={{color:C.text}}>121</strong> — total venituri (7xx)</span>
                    </div>
                    <p style={{ fontSize:11, color:C.textDim, margin:"10px 0 0" }}>
                        Referință generată: <span style={{ fontFamily:"monospace", color:"#9b7ab0", fontWeight:700 }}>CLOSE-{year}-{mm(month)}</span>.
                        Devalidarea șterge nota din DB — dispare imediat din toate rapoartele.
                    </p>
                </div>

                {/* Butoane Validez / Devalidez */}
                <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
                    {!status?.closed ? (
                        <button onClick={doClose} disabled={loading}
                                style={{ background:"#9b7ab0", border:"none", borderRadius:9, padding:"10px 28px", color:"#fff", fontSize:13, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:"'Outfit',sans-serif", opacity:loading?0.7:1, transition:"opacity 0.15s" }}>
                            {loading ? "Se validează..." : `✓ Validez închiderea ${periodLabel}`}
                        </button>
                    ) : (
                        <button onClick={doCancel} disabled={loading}
                                style={{ background:"#b07a7a15", border:"1px solid #b07a7a40", borderRadius:9, padding:"10px 28px", color:"#b07a7a", fontSize:13, fontWeight:600, cursor:loading?"wait":"pointer", fontFamily:"'Outfit',sans-serif", opacity:loading?0.7:1 }}>
                            {loading ? "Se devalidează..." : `✗ Devalidez închiderea ${periodLabel}`}
                        </button>
                    )}
                </div>

                {err && (
                    <p style={{ fontSize:13, color:"#b07a7a", marginTop:14, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>
                        ⚠ {err}
                    </p>
                )}
            </div>

            {/* Preview nota generata */}
            {result && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", fontWeight:600, margin:0 }}>
                        Notă generată
                    </p>
                    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden" }}>
                        <div style={{ padding:"12px 18px", borderBottom:`1px solid ${C.border}`, display:"flex", alignItems:"center", gap:12, background:"#9b7ab008" }}>
                            <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:"#9b7ab0" }}>{result.referenceNumber}</span>
                            <span style={{ fontSize:12, color:C.textMid }}>{result.description}</span>
                            <span style={{ marginLeft:"auto", fontSize:11, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:5, padding:"2px 8px", fontWeight:600 }}>
                                {result.lines?.length} linii
                            </span>
                        </div>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                            <thead>
                            <tr style={{ borderBottom:`1px solid ${C.border}`, background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                                {["Tip","Cont","Denumire","Sumă (RON)"].map((h,j)=>(
                                    <th key={j} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:600, padding:"8px 16px", textAlign:j===3?"right":"left" }}>{h}</th>
                                ))}
                            </tr>
                            </thead>
                            <tbody>
                            {result.lines?.map((line, j) => {
                                const isDebit = (line.debitAmount||0) > 0;
                                const amount  = isDebit ? line.debitAmount : line.creditAmount;
                                const color   = isDebit ? "#7b9cba" : "#7aab8a";
                                return (
                                    <tr key={j} style={{ borderBottom: j < result.lines.length-1 ? `1px solid ${C.border}` : "none" }}>
                                        <td style={{ padding:"9px 16px" }}>
                                                <span style={{ fontSize:11, fontWeight:600, color, background:`${color}15`, border:`1px solid ${color}25`, borderRadius:5, padding:"2px 7px" }}>
                                                    {isDebit?"Debit":"Credit"}
                                                </span>
                                        </td>
                                        <td style={{ padding:"9px 16px", fontFamily:"monospace", fontSize:12, fontWeight:700, color }}>{line.accountCode}</td>
                                        <td style={{ padding:"9px 16px", fontSize:12, color:C.text }}>{line.accountName}</td>
                                        <td style={{ padding:"9px 16px", fontSize:13, fontWeight:600, color:C.text, textAlign:"right" }}>RON {fmt(amount)}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══════════════════════════════════════════════════════
   SUB-COMPONENTE
══════════════════════════════════════════════════════ */
function EntryRow({ entry, i, C, onClick }) {
    const meta    = getSourceMeta(entry.referenceNumber);
    const debits  = entry.lines?.filter(l=>(l.debitAmount||0)>0).map(l=>l.accountCode) ?? [];
    const credits = entry.lines?.filter(l=>(l.creditAmount||0)>0).map(l=>l.accountCode) ?? [];
    return (
        <tr className="je-row" onClick={onClick} style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*15}ms both` }}>
            <td style={{ padding:"13px 20px" }}><span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:C.text }}>{entry.referenceNumber}</span></td>
            <td style={{ padding:"13px 20px", fontSize:13, color:C.textMid, whiteSpace:"nowrap" }}>{fmtDate(entry.entryDate)}</td>
            <td style={{ padding:"13px 20px", maxWidth:240 }}><span style={{ fontSize:13, color:C.text, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{entry.description||"—"}</span></td>
            <td style={{ padding:"13px 20px" }}><span style={{ fontSize:11, fontWeight:600, color:meta.color, background:meta.bg, border:`1px solid ${meta.color}30`, borderRadius:6, padding:"3px 9px", whiteSpace:"nowrap" }}>{meta.label}</span></td>
            <td style={{ padding:"13px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
                    {debits.slice(0,3).map((code,i)=>(<span key={i} style={{ fontSize:11, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:5, padding:"2px 6px" }}>{code}</span>))}
                    {debits.length>3 && <span style={{ fontSize:10, color:C.textDim }}>+{debits.length-3}</span>}
                    {debits.length>0&&credits.length>0&&<span style={{ fontSize:12, color:C.textDim }}>=</span>}
                    {credits.slice(0,3).map((code,i)=>(<span key={i} style={{ fontSize:11, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:5, padding:"2px 6px" }}>{code}</span>))}
                    {credits.length>3 && <span style={{ fontSize:10, color:C.textDim }}>+{credits.length-3}</span>}
                </div>
            </td>
            <td style={{ padding:"13px 20px" }}><StatusBadge status={entry.status} C={C}/></td>
            <td style={{ padding:"13px 20px", textAlign:"right" }}><span style={{ fontSize:11, color:C.textDim }}>Detalii ›</span></td>
        </tr>
    );
}

function SourceBadge({ ref_ }) {
    const meta = getSourceMeta(ref_);
    return <span style={{ fontSize:11, fontWeight:600, color:meta.color, background:meta.bg, border:`1px solid ${meta.color}30`, borderRadius:6, padding:"3px 9px" }}>{meta.label}</span>;
}

function StatusBadge({ status, C }) {
    const color = status==="POSTED"?"#7aab8a":status==="VOID"?"#b07a7a":"#6b7280";
    const label = status==="POSTED"?"Înregistrată":status==="VOID"?"Anulată":"Ciornă";
    return <span style={{ fontSize:11, fontWeight:500, color, background:`${color}15`, border:`1px solid ${color}30`, borderRadius:6, padding:"3px 9px" }}>{label}</span>;
}

function InfoBlock({ label, val, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <span style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</span>
            <span style={{ fontSize:13, color:C.text, fontWeight:500 }}>{val}</span>
        </div>
    );
}

function EmptyState({ C, onAdd }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, gap:14 }}>
            <div style={{ width:52, height:52, borderRadius:16, background:"#a78bfa18", border:"1px solid #a78bfa25", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>📒</div>
            <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>Nicio notă contabilă</p>
                <p style={{ fontSize:13, color:C.textDim, marginTop:6, maxWidth:340 }}>Notele se generează automat din facturi, cheltuieli și operațiuni bancare. Poți adăuga și manual note diverse.</p>
            </div>
            <button onClick={onAdd} style={{ background:"#a78bfa", border:"none", borderRadius:10, padding:"9px 20px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ Notă manuală</button>
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

function Spin({ C }) {
    return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#a78bfa", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>;
}