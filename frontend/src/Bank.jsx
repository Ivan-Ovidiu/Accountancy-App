import { useTheme } from "./App";
import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8080";

const RECON_STATUS = {
    UNMATCHED:        { label:"Unmatched",    color:"#b07a7a", bg:"#b07a7a18" },
    MATCHED:          { label:"Matched",      color:"#7aab8a", bg:"#7aab8a18" },
    MANUALLY_MATCHED: { label:"Manual Match", color:"#7b9cba", bg:"#7b9cba18" },
    IGNORED:          { label:"Ignored",      color:"#6b7280", bg:"#6b728018" },
};

const OP_TYPES = [
    { value:"COMMISSION",       label:"Comision bancar",  formula:"627 = 5121",  color:"#7b9cba",  hasCustomAccounts: false },
    { value:"SUPPLIER_PAYMENT", label:"Plată furnizor",   formula:"401 = 5121",  color:"#b07a7a",  hasCustomAccounts: false },
    { value:"CLIENT_RECEIPT",   label:"Încasare client",  formula:"5121 = 4111", color:"#7aab8a",  hasCustomAccounts: false },
    { value:"INTEREST_EXP",     label:"Dobândă plătită",  formula:"666 = 5121",  color:"#b07a7a",  hasCustomAccounts: false },
    { value:"INTEREST_INC",     label:"Dobândă încasată", formula:"5121 = 766",  color:"#7aab8a",  hasCustomAccounts: false },
    { value:"OTHER",            label:"Altă operațiune",  formula:"DR ales = CR ales", color:"#6b7280", hasCustomAccounts: true  },
];

function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmt(n)        { return new Intl.NumberFormat("ro-RO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n??0); }
function fmtDate(s)    { return s ? new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"; }
function today()       { return new Date().toISOString().split("T")[0]; }

const EMPTY_OP = { operationType:"COMMISSION", debitAccountId:"", creditAccountId:"", bankSide:"credit", description:"", amount:"", operationDate:today() };

export default function Bank() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", isDark:true };

    const [accounts, setAccounts]               = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions]       = useState([]);
    const [loading, setLoading]                 = useState(false);
    const [filter, setFilter]                   = useState("ALL");
    const [importing, setImporting]             = useState(false);
    const [importResult, setImportResult]       = useState(null);
    const [autoMatching, setAutoMatching]       = useState(false);
    const [newAccModal, setNewAccModal]         = useState(false);
    const [accForm, setAccForm]                 = useState({ bankName:"", accountNumber:"", accountName:"", currentBalance:"", currency:"RON" });
    const [savingAcc, setSavingAcc]             = useState(false);
    const fileRef = useRef(null);

    const [activeTab, setActiveTab]     = useState("reconciliation");
    const [operations, setOperations]   = useState([]);
    const [opsLoading, setOpsLoading]   = useState(false);
    const [opModal, setOpModal]         = useState(false);
    const [opForm, setOpForm]           = useState(EMPTY_OP);
    const [savingOp, setSavingOp]       = useState(false);
    const [opErr, setOpErr]             = useState("");
    const [allAccounts, setAllAccounts] = useState([]);
    const [viewOp, setViewOp]           = useState(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/bank/accounts`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ const list=Array.isArray(d)?d:[]; setAccounts(list); if(list.length>0) setSelectedAccount(list[0]); })
            .catch(()=>{});
        fetch(`${API_BASE}/api/accounts`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>setAllAccounts(Array.isArray(d)?d:[])).catch(()=>{});
    }, []);

    useEffect(() => {
        if (!selectedAccount) return;
        loadTransactions(selectedAccount.id);
        if (activeTab==="jurnal") loadOperations(selectedAccount.id);
    }, [selectedAccount]);

    const loadTransactions = (id) => {
        setLoading(true);
        fetch(`${API_BASE}/api/bank/accounts/${id}/transactions`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ setTransactions(Array.isArray(d)?d:[]); setLoading(false); })
            .catch(()=>setLoading(false));
    };

    const loadOperations = (id) => {
        setOpsLoading(true);
        fetch(`${API_BASE}/api/bank-operations/bank-account/${id}`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ setOperations(Array.isArray(d)?d:[]); setOpsLoading(false); })
            .catch(()=>setOpsLoading(false));
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        if (tab==="jurnal" && selectedAccount) loadOperations(selectedAccount.id);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file || !selectedAccount) return;
        setImporting(true); setImportResult(null);
        const fd = new FormData(); fd.append("file", file);
        try {
            const res = await fetch(`${API_BASE}/api/bank/accounts/${selectedAccount.id}/import`, {
                method:"POST", headers:{ Authorization:`Bearer ${localStorage.getItem("token")}` }, body: fd,
            });
            const data = await res.json();
            setImportResult(data);
            loadTransactions(selectedAccount.id);
        } catch { setImportResult({ totalRows:0, imported:0, skipped:0, errors:["Import failed."] }); }
        setImporting(false);
        e.target.value = "";
    };

    const autoMatch = async () => {
        if (!selectedAccount) return;
        setAutoMatching(true);
        await fetch(`${API_BASE}/api/bank/accounts/${selectedAccount.id}/auto-match`, { method:"POST", headers:authHeaders() }).catch(()=>{});
        loadTransactions(selectedAccount.id);
        setAutoMatching(false);
    };

    const unmatch = async (id) => {
        await fetch(`${API_BASE}/api/bank/transactions/${id}/unmatch`, { method:"POST", headers:authHeaders() }).catch(()=>{});
        loadTransactions(selectedAccount.id);
    };

    const saveAccount = async () => {
        if (!accForm.bankName||!accForm.accountNumber||!accForm.accountName) return;
        setSavingAcc(true);
        const body = { bankName:accForm.bankName, accountNumber:accForm.accountNumber, accountName:accForm.accountName, currentBalance:parseFloat(accForm.currentBalance)||0, currency:accForm.currency||"RON" };
        const res = await fetch(`${API_BASE}/api/bank/accounts`, { method:"POST", headers:authHeaders(), body:JSON.stringify(body) }).catch(()=>null);
        if (res?.ok) {
            const newAcc = await res.json();
            setAccounts(a=>[...a, newAcc]);
            setSelectedAccount(newAcc);
            setNewAccModal(false);
            setAccForm({ bankName:"", accountNumber:"", accountName:"", currentBalance:"", currency:"RON" });
        }
        setSavingAcc(false);
    };

    const saveOperation = async () => {
        if (!selectedAccount)    { setOpErr("Selectează un cont bancar."); return; }
        if (!opForm.description) { setOpErr("Descrierea este obligatorie."); return; }
        if (!opForm.amount || parseFloat(opForm.amount)<=0) { setOpErr("Introdu o sumă validă."); return; }
        if (opForm.operationType==="OTHER") {
            const otherAccId = opForm.bankSide==="debit" ? opForm.creditAccountId : opForm.debitAccountId;
            if (!otherAccId) { setOpErr("Selectează contul " + (opForm.bankSide==="debit"?"credit":"debit") + "."); return; }
        }
        setSavingOp(true); setOpErr("");
        try {
            // Pentru OTHER: gasim ID-ul contului 5121 din lista de conturi
            let debitId  = opForm.debitAccountId  ? parseInt(opForm.debitAccountId)  : null;
            let creditId = opForm.creditAccountId ? parseInt(opForm.creditAccountId) : null;

            if (opForm.operationType === "OTHER") {
                const banca5121 = allAccounts.find(a => a.code === "5121");
                if (!banca5121) { setOpErr("Contul 5121 nu exista in planul de conturi."); setSavingOp(false); return; }
                if (opForm.bankSide === "debit") {
                    debitId  = banca5121.id;
                    creditId = parseInt(opForm.creditAccountId);
                } else {
                    debitId  = parseInt(opForm.debitAccountId);
                    creditId = banca5121.id;
                }
            }

            const body = {
                bankAccountId:   selectedAccount.id,
                operationType:   opForm.operationType,
                debitAccountId:  debitId,
                creditAccountId: creditId,
                description:     opForm.description,
                amount:          parseFloat(opForm.amount),
                operationDate:   opForm.operationDate,
            };
            const res = await fetch(`${API_BASE}/api/bank-operations`, { method:"POST", headers:authHeaders(), body:JSON.stringify(body) });
            if (!res.ok) { const e=await res.json().catch(()=>{}); setOpErr(e?.message||"Eroare la salvare."); setSavingOp(false); return; }
            setOpModal(false); setOpForm(EMPTY_OP);
            loadOperations(selectedAccount.id);
        } catch { setOpErr("Server error."); }
        setSavingOp(false);
    };

    const filtered = filter==="ALL" ? transactions : transactions.filter(t=>t.reconciliationStatus===filter);
    const counts = { ALL:transactions.length, UNMATCHED:0, MATCHED:0, MANUALLY_MATCHED:0 };
    transactions.forEach(t=>{ if(counts[t.reconciliationStatus]!==undefined) counts[t.reconciliationStatus]++; });

    const selectedOpType = OP_TYPES.find(o=>o.value===opForm.operationType) || OP_TYPES[0];
    const isOther = opForm.operationType === "OTHER";

    // Counts per operation type for summary cards
    const opCounts = OP_TYPES.reduce((acc, op) => {
        acc[op.value] = {
            count: operations.filter(o=>o.operationType===op.value).length,
            total: operations.filter(o=>o.operationType===op.value).reduce((s,o)=>s+(parseFloat(o.amount)||0),0)
        };
        return acc;
    }, {});

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* HEADER */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:"-0.5px", margin:0 }}>Bancă</h1>
                    <p style={{ fontSize:13, color:C.textDim, marginTop:5 }}>Reconciliere bancară și jurnal de bancă</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                    {activeTab==="jurnal" && selectedAccount && (
                        <button onClick={()=>{ setOpForm(EMPTY_OP); setOpErr(""); setOpModal(true); }}
                                style={{ display:"flex", alignItems:"center", gap:7, background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 18px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                            <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> Operațiune nouă
                        </button>
                    )}
                    <button onClick={()=>setNewAccModal(true)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:10, padding:"9px 16px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        + Cont bancar
                    </button>
                </div>
            </div>

            {/* BANK ACCOUNTS */}
            {accounts.length>0 && (
                <div style={{ display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" }}>
                    {accounts.map(acc=>(
                        <button key={acc.id} onClick={()=>setSelectedAccount(acc)}
                                style={{ background:selectedAccount?.id===acc.id?C.isDark?"#1a2030":"#f0f4ff":C.card, border:`1px solid ${selectedAccount?.id===acc.id?"#7b9cba":C.border}`, borderRadius:14, padding:"14px 20px", cursor:"pointer", textAlign:"left", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s", minWidth:200 }}>
                            <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{acc.accountName}</p>
                            <p style={{ fontSize:11, color:C.textMid, margin:"3px 0 0" }}>{acc.bankName} · {acc.accountNumber}</p>
                            <p style={{ fontSize:16, fontWeight:700, color:"#7b9cba", margin:"8px 0 0", letterSpacing:"-0.5px" }}>RON {fmt(acc.currentBalance)}</p>
                        </button>
                    ))}
                </div>
            )}

            {accounts.length===0 && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"40px", textAlign:"center", marginBottom:24 }}>
                    <p style={{ fontSize:14, color:C.textMid, margin:0 }}>Niciun cont bancar. Adaugă unul pentru a începe.</p>
                </div>
            )}

            {/* PAGE TABS */}
            {selectedAccount && (
                <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, marginBottom:24 }}>
                    <TabBtn label="Reconciliere bancară" active={activeTab==="reconciliation"} onClick={()=>switchTab("reconciliation")} C={C} />
                    <TabBtn label="Jurnal de bancă" active={activeTab==="jurnal"} onClick={()=>switchTab("jurnal")} C={C} accent />
                </div>
            )}

            {/* ── TAB: RECONCILIATION ── */}
            {activeTab==="reconciliation" && selectedAccount && (
                <>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:12, marginBottom:24, alignItems:"stretch" }}>
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px" }}>
                            <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 8px" }}>Nepotrivite</p>
                            <p style={{ fontSize:24, fontWeight:700, color:"#b07a7a", margin:0 }}>{counts.UNMATCHED}</p>
                            <p style={{ fontSize:11, color:C.textDim, margin:"4px 0 0" }}>tranzacții necesită verificare</p>
                        </div>
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px" }}>
                            <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", margin:"0 0 8px" }}>Potrivite</p>
                            <p style={{ fontSize:24, fontWeight:700, color:"#7aab8a", margin:0 }}>{counts.MATCHED + counts.MANUALLY_MATCHED}</p>
                            <p style={{ fontSize:11, color:C.textDim, margin:"4px 0 0" }}>tranzacții reconciliate</p>
                        </div>
                        <div style={{ background:C.card, border:`1px dashed ${C.border2}`, borderRadius:14, padding:"16px 20px", display:"flex", flexDirection:"column", justifyContent:"center", gap:8 }}>
                            <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", margin:0 }}>Import CSV</p>
                            <p style={{ fontSize:11, color:C.textDim, margin:0 }}>Format: date, amount, description, reference</p>
                            <button onClick={()=>fileRef.current?.click()} disabled={importing}
                                    style={{ background:"#7b9cba18", border:"1px solid #7b9cba30", borderRadius:8, padding:"7px 14px", color:"#7b9cba", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:importing?0.7:1, alignSelf:"flex-start" }}>
                                {importing?"Se importă...":"Alege fișier CSV"}
                            </button>
                            <input ref={fileRef} type="file" accept=".csv" style={{ display:"none" }} onChange={handleImport} />
                        </div>
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 20px", display:"flex", flexDirection:"column", justifyContent:"center", gap:8, minWidth:160 }}>
                            <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.6px", margin:0 }}>Auto Match</p>
                            <p style={{ fontSize:11, color:C.textDim, margin:0 }}>Potrivire după sumă + dată</p>
                            <button onClick={autoMatch} disabled={autoMatching}
                                    style={{ background:"#7aab8a18", border:"1px solid #7aab8a30", borderRadius:8, padding:"7px 14px", color:"#7aab8a", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:autoMatching?0.7:1, alignSelf:"flex-start" }}>
                                {autoMatching?"Se procesează...":"Rulează Auto Match"}
                            </button>
                        </div>
                    </div>

                    {importResult && (
                        <div style={{ background:importResult.errors?.length?"#b07a7a12":"#7aab8a12", border:`1px solid ${importResult.errors?.length?"#b07a7a30":"#7aab8a30"}`, borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                            <p style={{ fontSize:13, color:importResult.errors?.length?"#b07a7a":"#7aab8a", margin:0 }}>
                                Importate {importResult.imported} din {importResult.totalRows} rânduri · {importResult.skipped} omise
                            </p>
                            <button onClick={()=>setImportResult(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.textMid, fontSize:16 }}>✕</button>
                        </div>
                    )}

                    <div style={{ display:"flex", gap:6, marginBottom:16 }}>
                        {[["ALL","All"],["UNMATCHED","Unmatched"],["MATCHED","Matched"],["MANUALLY_MATCHED","Manual"]].map(([key,label])=>{
                            const s = RECON_STATUS[key];
                            return (
                                <button key={key} onClick={()=>setFilter(key)}
                                        style={{ border:`1px solid ${filter===key?(s?.color||C.border2):C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:filter===key?600:400, cursor:"pointer", fontFamily:"'Outfit',sans-serif", background:filter===key?(s?.bg||C.border):C.card, color:filter===key?(s?.color||C.text):C.textMid, transition:"all 0.15s" }}>
                                    {label} <span style={{ opacity:0.6 }}>({counts[key]??transactions.length})</span>
                                </button>
                            );
                        })}
                    </div>

                    {loading ? (
                        <div style={{ display:"flex", justifyContent:"center", paddingTop:60 }}><Spin C={C} /></div>
                    ) : filtered.length===0 ? (
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"60px", textAlign:"center" }}>
                            <p style={{ fontSize:14, color:C.textMid, margin:0 }}>Nicio tranzacție. Importă un fișier CSV.</p>
                        </div>
                    ) : (
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                            <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                <thead>
                                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                                    {["Dată","Descriere","Referință","Sumă","Tip","Status",""].map((h,i)=>(
                                        <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===6?"right":"left" }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {filtered.map((t,i)=>(
                                    <TxRow key={t.id} tx={t} i={i} C={C} onUnmatch={unmatch} />
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── TAB: JURNAL DE BANCĂ ── */}
            {activeTab==="jurnal" && selectedAccount && (
                <>
                    {/* Summary cards — 3 per row */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                        {OP_TYPES.map(op=>{
                            const { count, total } = opCounts[op.value]||{ count:0, total:0 };
                            return (
                                <div key={op.value} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"14px 18px" }}>
                                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                                        <p style={{ fontSize:11, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:0, fontWeight:600 }}>{op.label}</p>
                                        <span style={{ fontSize:11, color:op.color, background:`${op.color}15`, border:`1px solid ${op.color}30`, borderRadius:6, padding:"2px 8px", fontWeight:600 }}>{count}</span>
                                    </div>
                                    <p style={{ fontSize:11, fontFamily:"monospace", color:C.textDim, margin:"0 0 4px" }}>{op.formula}</p>
                                    {count>0 && <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>RON {fmt(total)}</p>}
                                </div>
                            );
                        })}
                    </div>

                    {opsLoading ? (
                        <div style={{ display:"flex", justifyContent:"center", paddingTop:60 }}><Spin C={C} /></div>
                    ) : operations.length===0 ? (
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"60px", textAlign:"center" }}>
                            <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:"0 0 8px" }}>Nicio operațiune înregistrată</p>
                            <p style={{ fontSize:13, color:C.textDim, margin:"0 0 20px" }}>Înregistrează comisioane, plăți furnizori, încasări sau dobânzi</p>
                            <button onClick={()=>{ setOpForm(EMPTY_OP); setOpErr(""); setOpModal(true); }}
                                    style={{ background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                + Operațiune nouă
                            </button>
                        </div>
                    ) : (
                        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                            <table style={{ width:"100%", borderCollapse:"collapse" }}>
                                <thead>
                                <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                                    {["Dată","Descriere","Tip","Formulă","Sumă","Referință notă",""].map((h,i)=>(
                                        <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===6?"right":"left" }}>{h}</th>
                                    ))}
                                </tr>
                                </thead>
                                <tbody>
                                {operations.map((op,i)=>{
                                    const opMeta = OP_TYPES.find(o=>o.value===op.operationType)||OP_TYPES[5];
                                    return (
                                        <tr key={op.id} className="op-row" onClick={()=>setViewOp(op)}
                                            style={{ borderBottom:`1px solid ${C.border}`, cursor:"pointer", transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*20}ms both` }}>
                                            <td style={{ padding:"13px 20px", fontSize:13, color:C.textMid }}>{fmtDate(op.operationDate)}</td>
                                            <td style={{ padding:"13px 20px", fontSize:13, color:C.text }}>{op.description}</td>
                                            <td style={{ padding:"13px 20px" }}>
                                                <span style={{ fontSize:11, fontWeight:600, color:opMeta.color, background:`${opMeta.color}15`, border:`1px solid ${opMeta.color}30`, borderRadius:6, padding:"3px 9px" }}>{opMeta.label}</span>
                                            </td>
                                            <td style={{ padding:"13px 20px" }}>
                                                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                                                    <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:5, padding:"2px 6px" }}>{op.debitAccountCode}</span>
                                                    <span style={{ fontSize:12, color:C.textDim }}>=</span>
                                                    <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:5, padding:"2px 6px" }}>{op.creditAccountCode}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding:"13px 20px" }}>
                                                <span style={{ fontSize:14, fontWeight:600, color:C.text }}>RON {fmt(op.amount)}</span>
                                            </td>
                                            <td style={{ padding:"13px 20px" }}>
                                                <span style={{ fontSize:12, fontFamily:"monospace", color:C.textDim }}>{op.journalEntryReference||"—"}</span>
                                            </td>
                                            <td style={{ padding:"13px 20px", textAlign:"right" }}>
                                                <div className="op-actions" style={{ opacity:0, transition:"opacity 0.15s" }}>
                                                    <span style={{ fontSize:11, color:C.textDim }}>View ›</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* ── NEW OPERATION MODAL ── */}
            {opModal && (
                <Overlay onClose={()=>setOpModal(false)} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"calc(100% - 48px)", maxWidth:560, maxHeight:"90vh", overflowY:"auto" }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, background:C.card, zIndex:2 }}>
                            <div>
                                <h2 style={{ fontSize:17, fontWeight:600, color:C.text, margin:0 }}>Operațiune de bancă nouă</h2>
                                <p style={{ fontSize:12, color:C.textDim, marginTop:3 }}>
                                    Formula: <span style={{ fontFamily:"monospace", color:selectedOpType?.color }}>{selectedOpType?.formula}</span>
                                </p>
                            </div>
                            <button onClick={()=>setOpModal(false)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>

                            {/* Tip operatiune — grid 3x2 */}
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Tip Operațiune *</label>
                                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                                    {OP_TYPES.map(op=>(
                                        <button key={op.value} onClick={()=>setOpForm(f=>({...f,operationType:op.value,debitAccountId:"",creditAccountId:"",bankSide:"credit"}))}
                                                style={{ background:opForm.operationType===op.value?`${op.color}15`:C.bg, border:`1px solid ${opForm.operationType===op.value?op.color:C.border2}`, borderRadius:10, padding:"10px 12px", textAlign:"left", cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                            <p style={{ fontSize:12, fontWeight:600, color:opForm.operationType===op.value?op.color:C.text, margin:0 }}>{op.label}</p>
                                            <p style={{ fontSize:10, fontFamily:"monospace", color:C.textDim, margin:"3px 0 0" }}>{op.formula}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Conturi pentru OTHER — cu toggle banca DR/CR */}
                            {isOther && (
                                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                                    {/* Toggle banca debit/credit */}
                                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                        <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Banca (5121) este pe *</label>
                                        <div style={{ display:"flex", gap:8 }}>
                                            <button onClick={()=>setOpForm(f=>({...f,bankSide:"debit",debitAccountId:"BANK",creditAccountId:""}))}
                                                    style={{ flex:1, background:opForm.bankSide==="debit"?"#7b9cba15":C.bg, border:`1px solid ${opForm.bankSide==="debit"?"#7b9cba":C.border2}`, borderRadius:10, padding:"10px", cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                                <p style={{ fontSize:13, fontWeight:600, color:opForm.bankSide==="debit"?"#7b9cba":C.text, margin:0 }}>Debit</p>
                                                <p style={{ fontSize:11, fontFamily:"monospace", color:C.textDim, margin:"2px 0 0" }}>5121 = cont ales</p>
                                            </button>
                                            <button onClick={()=>setOpForm(f=>({...f,bankSide:"credit",debitAccountId:"",creditAccountId:"BANK"}))}
                                                    style={{ flex:1, background:opForm.bankSide==="credit"?"#7aab8a15":C.bg, border:`1px solid ${opForm.bankSide==="credit"?"#7aab8a":C.border2}`, borderRadius:10, padding:"10px", cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                                <p style={{ fontSize:13, fontWeight:600, color:opForm.bankSide==="credit"?"#7aab8a":C.text, margin:0 }}>Credit</p>
                                                <p style={{ fontSize:11, fontFamily:"monospace", color:C.textDim, margin:"2px 0 0" }}>cont ales = 5121</p>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Contul celalalt */}
                                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                        <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>
                                            {opForm.bankSide==="debit" ? "Cont Credit *" : "Cont Debit *"}
                                        </label>
                                        <select
                                            value={opForm.bankSide==="debit" ? opForm.creditAccountId : opForm.debitAccountId}
                                            onChange={e=>{
                                                if (opForm.bankSide==="debit") setOpForm(f=>({...f,creditAccountId:e.target.value}));
                                                else setOpForm(f=>({...f,debitAccountId:e.target.value}));
                                            }}
                                            style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
                                            <option value="">Selectează contul...</option>
                                            {allAccounts.filter(a=>a.isActive!==false && a.subType!=="Clasa" && a.subType!=="Grupa").map(a=>(
                                                <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {/* Preview formula */}
                                    {(opForm.debitAccountId || opForm.creditAccountId) && (
                                        <div style={{ background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px" }}>
                                            <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 6px" }}>Preview formulă</p>
                                            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                                                {opForm.bankSide==="debit" ? (
                                                    <>
                                                        <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:5, padding:"2px 6px" }}>5121</span>
                                                        <span style={{ color:C.textDim }}>=</span>
                                                        <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:5, padding:"2px 6px" }}>
                                                            {allAccounts.find(a=>a.id===parseInt(opForm.creditAccountId))?.code || "???"}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:5, padding:"2px 6px" }}>
                                                            {allAccounts.find(a=>a.id===parseInt(opForm.debitAccountId))?.code || "???"}
                                                        </span>
                                                        <span style={{ color:C.textDim }}>=</span>
                                                        <span style={{ fontSize:12, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:5, padding:"2px 6px" }}>5121</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <FInput label="Descriere *" val={opForm.description} set={v=>setOpForm(f=>({...f,description:v}))} ph="Ex: Comision lunar, Plată furnizor ABC..." C={C} />

                            <div style={{ display:"flex", gap:12 }}>
                                <FInput label="Sumă (RON) *" val={opForm.amount} set={v=>setOpForm(f=>({...f,amount:v}))} type="number" ph="0.00" C={C} />
                                <FInput label="Data *" val={opForm.operationDate} set={v=>setOpForm(f=>({...f,operationDate:v}))} type="date" C={C} />
                            </div>

                            {opErr && <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {opErr}</p>}
                        </div>

                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={()=>setOpModal(false)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={saveOperation} disabled={savingOp} style={{ background:"#7b9cba", border:"none", borderRadius:9, padding:"9px 22px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:savingOp?0.7:1 }}>
                                {savingOp?"Se înregistrează...":"Înregistrează"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── VIEW OPERATION MODAL ── */}
            {viewOp && (
                <Overlay onClose={()=>setViewOp(null)} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:440 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <div>
                                <h2 style={{ fontSize:16, fontWeight:600, color:C.text, margin:0 }}>{viewOp.description}</h2>
                                <p style={{ fontSize:12, color:C.textDim, marginTop:3 }}>{fmtDate(viewOp.operationDate)}</p>
                            </div>
                            <button onClick={()=>setViewOp(null)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                                <IBlock label="Sumă" val={`RON ${fmt(viewOp.amount)}`} C={C} />
                                <IBlock label="Data" val={fmtDate(viewOp.operationDate)} C={C} />
                                <IBlock label="Tip" val={OP_TYPES.find(o=>o.value===viewOp.operationType)?.label||viewOp.operationType} C={C} />
                                <IBlock label="Referință notă" val={viewOp.journalEntryReference||"—"} C={C} />
                            </div>
                            <div style={{ background:C.isDark?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)", border:`1px solid ${C.border}`, borderRadius:10, padding:"12px 14px" }}>
                                <p style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.5px", margin:"0 0 8px", fontWeight:600 }}>Formulă contabilă</p>
                                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                                    <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#7b9cba", background:"#7b9cba12", border:"1px solid #7b9cba25", borderRadius:6, padding:"3px 8px" }}>{viewOp.debitAccountCode}</span>
                                    <span style={{ fontSize:11, color:C.textDim }}>{viewOp.debitAccountName}</span>
                                    <span style={{ fontSize:16, color:C.textDim, margin:"0 4px" }}>=</span>
                                    <span style={{ fontSize:13, fontFamily:"monospace", fontWeight:700, color:"#7aab8a", background:"#7aab8a12", border:"1px solid #7aab8a25", borderRadius:6, padding:"3px 8px" }}>{viewOp.creditAccountCode}</span>
                                    <span style={{ fontSize:11, color:C.textDim }}>{viewOp.creditAccountName}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* NEW BANK ACCOUNT MODAL */}
            {newAccModal && (
                <Overlay onClose={()=>setNewAccModal(false)} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:460 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <h2 style={{ fontSize:17, fontWeight:600, color:C.text, margin:0 }}>Adaugă Cont Bancar</h2>
                            <button onClick={()=>setNewAccModal(false)} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                            <FInput label="Bancă *"           val={accForm.bankName}      set={v=>setAccForm(f=>({...f,bankName:v}))}      ph="BCR, BRD, ING..." C={C} />
                            <FInput label="Număr cont IBAN *" val={accForm.accountNumber} set={v=>setAccForm(f=>({...f,accountNumber:v}))} ph="RO49AAAA1B31007593840000" C={C} />
                            <FInput label="Denumire cont *"   val={accForm.accountName}   set={v=>setAccForm(f=>({...f,accountName:v}))}   ph="Cont principal operațional" C={C} />
                            <div style={{ display:"flex", gap:12 }}>
                                <FInput label="Sold inițial" val={accForm.currentBalance} set={v=>setAccForm(f=>({...f,currentBalance:v}))} ph="0.00" type="number" C={C} />
                                <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Valută</label>
                                    <select value={accForm.currency} onChange={e=>setAccForm(f=>({...f,currency:e.target.value}))}
                                            style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", cursor:"pointer" }}>
                                        <option>RON</option><option>EUR</option><option>USD</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={()=>setNewAccModal(false)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={saveAccount} disabled={savingAcc} style={{ background:"#7b9cba", border:"none", borderRadius:9, padding:"9px 22px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:savingAcc?0.7:1 }}>
                                {savingAcc?"Se salvează...":"Adaugă cont"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        input::placeholder { color:${C.textDim}; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark?"invert(1)":"none"}; opacity:0.5; }
        input:focus,select:focus { outline:none; border-color:#7b9cba !important; }
        button:focus { outline:none; }
        .tx-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
        .op-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
        .op-row:hover .op-actions { opacity:1!important; }
      `}</style>
        </div>
    );
}

function TabBtn({ label, active, onClick, C, accent }) {
    const color = accent ? "#9b8fba" : C.blue;
    return <button onClick={onClick} style={{ background:"none", border:"none", borderBottom:active?`2px solid ${color}`:"2px solid transparent", padding:"12px 16px", fontSize:13, fontWeight:active?600:400, color:active?color:C.textMid, cursor:"pointer", fontFamily:"'Outfit',sans-serif", transition:"all 0.15s", marginBottom:-1 }}>{label}</button>;
}

function TxRow({ tx, i, C, onUnmatch }) {
    const s = RECON_STATUS[tx.reconciliationStatus]||RECON_STATUS.UNMATCHED;
    const isCredit = tx.type==="CREDIT";
    return (
        <tr className="tx-row" style={{ borderBottom:`1px solid ${C.border}`, transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*20}ms both` }}>
            <td style={{ padding:"13px 20px", fontSize:13, color:C.textMid }}>{fmtDate(tx.transactionDate)}</td>
            <td style={{ padding:"13px 20px", fontSize:13, color:C.text }}>{tx.description||"—"}</td>
            <td style={{ padding:"13px 20px", fontSize:12, color:C.textDim, fontFamily:"monospace" }}>{tx.reference||"—"}</td>
            <td style={{ padding:"13px 20px" }}>
                <span style={{ fontSize:13, fontWeight:600, color:isCredit?"#7aab8a":"#b07a7a" }}>{isCredit?"+":"-"}RON {fmt(Math.abs(tx.amount))}</span>
            </td>
            <td style={{ padding:"13px 20px" }}>
                <span style={{ fontSize:11, color:isCredit?"#7aab8a":"#b07a7a", background:isCredit?"#7aab8a18":"#b07a7a18", border:`1px solid ${isCredit?"#7aab8a30":"#b07a7a30"}`, borderRadius:6, padding:"2px 8px", fontWeight:500 }}>{tx.type}</span>
            </td>
            <td style={{ padding:"13px 20px" }}>
                <span style={{ fontSize:11, color:s.color, background:s.bg, border:`1px solid ${s.color}30`, borderRadius:6, padding:"3px 9px", fontWeight:500 }}>{s.label}</span>
            </td>
            <td style={{ padding:"13px 20px", textAlign:"right" }}>
                <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    {(tx.reconciliationStatus==="MATCHED"||tx.reconciliationStatus==="MANUALLY_MATCHED") && (
                        <button onClick={()=>onUnmatch(tx.id)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:7, padding:"5px 10px", color:C.textMid, fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Unmatch</button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function IBlock({ label, val, C }) {
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

function Overlay({ children, onClose, C }) {
    return (
        <div style={{ position:"fixed", inset:0, background:`rgba(0,0,0,${C.isDark?0.65:0.35})`, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", animation:"fadeIn 0.15s ease" }}
             onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
            {children}
        </div>
    );
}

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#7b9cba", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />; }