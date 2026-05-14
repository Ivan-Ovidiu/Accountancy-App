import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";
function authHeaders() { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }
function fmtDate(s) { return s ? new Date(s).toLocaleDateString("ro-RO",{month:"short",day:"numeric",year:"numeric"}) : "—"; }

const VAT_PERIODS    = ["MONTHLY","QUARTERLY","NONE"];
const VAT_LABELS     = { MONTHLY:"Lunar", QUARTERLY:"Trimestrial", NONE:"Neplătitor" };
const PROFIT_TYPES   = ["PROFIT","MICRO"];
const PROFIT_LABELS  = { PROFIT:"Impozit pe profit", MICRO:"Microîntreprindere" };

const EMPTY_CO = {
    code:"", name:"", taxId:"", tradeRegisterNo:"", caenCode:"", shareCapital:"",
    addressCounty:"", addressCity:"", addressStreet:"", addressNumber:"",
    addressBlock:"", addressEntrance:"", addressFloor:"", addressApartment:"", addressSector:"", addressPostalCode:"",
    phone:"", email:"", primaryBankIban:"", primaryBankName:"",
    vatPayer:true, vatPeriod:"MONTHLY", vatOnCollection:false, profitTaxType:"PROFIT",
};

// ── tabs pentru modal ─────────────────────────────────────────────────────────
const TABS = [
    { key:"general",  label:"Informații generale" },
    { key:"address",  label:"Sediu social" },
    { key:"bank",     label:"Bancă" },
    { key:"fiscal",   label:"Regim fiscal" },
];

export default function Settings() {
    const T = useTheme();
    const C = T ?? {
        text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151",
        bg:"#0f1117", card:"#141820", cardAlt:"#0f1117",
        border:"#1e2330", border2:"#252d3a",
        blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", accent:"#a78bfa",
        isDark:true,
    };

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [modal, setModal]         = useState(null); // "create"|"edit"|"delete"|"access"
    const [selected, setSelected]   = useState(null);
    const [form, setForm]           = useState(EMPTY_CO);
    const [saving, setSaving]       = useState(false);
    const [err, setErr]             = useState("");
    const [tab, setTab]             = useState("general");

    // For access management
    const [users, setUsers]         = useState([]);
    const [accessList, setAccessList] = useState([]);
    const [selUserId, setSelUserId] = useState("");
    const [accessSaving, setAccessSaving] = useState(false);

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/companies`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ setCompanies(Array.isArray(d)?d:[]); setLoading(false); })
            .catch(()=>setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setForm(EMPTY_CO); setErr(""); setTab("general"); setModal("create"); };
    const openEdit   = c  => { setSelected(c); setErr(""); setTab("general"); setForm({
        code:c.code||"", name:c.name||"", taxId:c.taxId||"", tradeRegisterNo:c.tradeRegisterNo||"",
        caenCode:c.caenCode||"", shareCapital:c.shareCapital||"",
        addressCounty:c.addressCounty||"", addressCity:c.addressCity||"",
        addressStreet:c.addressStreet||"", addressNumber:c.addressNumber||"",
        addressBlock:c.addressBlock||"", addressEntrance:c.addressEntrance||"",
        addressFloor:c.addressFloor||"", addressApartment:c.addressApartment||"",
        addressSector:c.addressSector||"", addressPostalCode:c.addressPostalCode||"",
        phone:c.phone||"", email:c.email||"",
        primaryBankIban:c.primaryBankIban||"", primaryBankName:c.primaryBankName||"",
        vatPayer:c.vatPayer??true, vatPeriod:c.vatPeriod||"MONTHLY",
        vatOnCollection:c.vatOnCollection??false, profitTaxType:c.profitTaxType||"PROFIT",
    }); setModal("edit"); };
    const openDel    = c  => { setSelected(c); setModal("delete"); };
    const openAccess = c  => {
        setSelected(c);
        // Load users and current access
        fetch(`${API_BASE}/api/users`, { headers:authHeaders() }).then(r=>r.json()).then(d=>setUsers(Array.isArray(d)?d:[])).catch(()=>{});
        fetch(`${API_BASE}/api/companies/${c.id}/access`, { headers:authHeaders() }).then(r=>r.json()).then(d=>setAccessList(Array.isArray(d)?d:[])).catch(()=>setAccessList([]));
        setSelUserId(""); setModal("access");
    };
    const close = () => { setModal(null); setSelected(null); setErr(""); };

    const f = (k,v) => setForm(p=>({...p,[k]:v}));

    const save = async () => {
        if (!form.code.trim()) { setErr("Codul este obligatoriu."); return; }
        if (!form.name.trim()) { setErr("Denumirea este obligatorie."); return; }
        if (!form.taxId.trim()) { setErr("CIF-ul este obligatoriu."); return; }
        setSaving(true); setErr("");
        try {
            const url    = modal==="edit" ? `${API_BASE}/api/companies/${selected.id}` : `${API_BASE}/api/companies`;
            const method = modal==="edit" ? "PUT" : "POST";
            const body   = { ...form, shareCapital: form.shareCapital ? parseFloat(form.shareCapital) : 0 };
            const res    = await fetch(url,{method,headers:authHeaders(),body:JSON.stringify(body)});
            if (!res.ok) { const d=await res.json().catch(()=>{}); setErr(d?.message||"Eroare la salvare."); setSaving(false); return; }
            close(); load();
        } catch { setErr("Eroare server."); }
        setSaving(false);
    };

    const del = async () => {
        setSaving(true);
        await fetch(`${API_BASE}/api/companies/${selected.id}`,{method:"DELETE",headers:authHeaders()}).catch(()=>{});
        setSaving(false); close(); load();
    };

    const grantAccess = async () => {
        if (!selUserId) return;
        setAccessSaving(true);
        await fetch(`${API_BASE}/api/companies/access`,{method:"POST",headers:authHeaders(),body:JSON.stringify({userId:parseInt(selUserId),companyId:selected.id,isDefault:false})}).catch(()=>{});
        // Refresh access list
        fetch(`${API_BASE}/api/companies/${selected.id}/access`,{headers:authHeaders()}).then(r=>r.json()).then(d=>setAccessList(Array.isArray(d)?d:[])).catch(()=>{});
        setSelUserId(""); setAccessSaving(false);
    };

    const revokeAccess = async (userId) => {
        await fetch(`${API_BASE}/api/companies/${selected.id}/access/${userId}`,{method:"DELETE",headers:authHeaders()}).catch(()=>{});
        setAccessList(p=>p.filter(a=>a.userId!==userId));
    };

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* ── HEADER ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
                <div>
                    <h1 style={{ fontSize:22, fontWeight:700, color:C.text, letterSpacing:"-0.5px", margin:0 }}>Configurare societăți</h1>
                    <p style={{ fontSize:13, color:C.textMid, marginTop:4 }}>Gestionează societățile și accesul utilizatorilor</p>
                </div>
                <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:7, background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 18px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> Societate nouă
                </button>
            </div>

            {/* ── TABLE ── */}
            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C}/></div>
            ) : companies.length === 0 ? (
                <EmptyState onAdd={openCreate} C={C}/>
            ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                            {["Cod","Societate","CIF","Reg. Com.","Regim fiscal",""].map((h,i)=>(
                                <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===5?"right":"left" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {companies.map((c,i)=>(
                            <tr key={c.id} className="tr-row" style={{ borderBottom:`1px solid ${C.border}`, transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*30}ms both` }}>
                                <td style={{ padding:"14px 20px" }}>
                                    <span style={{ fontFamily:"monospace", fontSize:13, fontWeight:700, color:C.blue }}>{c.code}</span>
                                </td>
                                <td style={{ padding:"14px 20px" }}>
                                    <div>
                                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{c.name}</div>
                                        {c.email && <div style={{ fontSize:11, color:C.textMid, marginTop:2 }}>{c.email}</div>}
                                    </div>
                                </td>
                                <td style={{ padding:"14px 20px" }}>
                                    <span style={{ fontSize:11, background:"#7b9cba18", color:"#7b9cba", border:"1px solid #7b9cba25", borderRadius:6, padding:"3px 8px", fontWeight:500 }}>{c.taxId}</span>
                                </td>
                                <td style={{ padding:"14px 20px" }}>
                                    <span style={{ fontSize:12, color:C.textMid }}>{c.tradeRegisterNo||"—"}</span>
                                </td>
                                <td style={{ padding:"14px 20px" }}>
                                    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                                        <span style={{ fontSize:11, color:C.textMid }}>{VAT_LABELS[c.vatPeriod]||c.vatPeriod}</span>
                                        {c.vatOnCollection && <span style={{ fontSize:10, color:"#b09a6a", background:"#b09a6a18", border:"1px solid #b09a6a30", borderRadius:5, padding:"1px 6px", width:"fit-content" }}>TVA la încasare</span>}
                                    </div>
                                </td>
                                <td style={{ padding:"14px 20px", textAlign:"right" }}>
                                    <div className="row-actions" style={{ display:"flex", gap:6, justifyContent:"flex-end", opacity:0, transition:"opacity 0.15s" }}>
                                        <button onClick={()=>openAccess(c)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8, padding:"6px 10px", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                                            <UsersIcon/> Acces
                                        </button>
                                        <button onClick={()=>openEdit(c)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8, padding:"6px 12px", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                                            <EditIcon/> Editează
                                        </button>
                                        <button onClick={()=>openDel(c)} style={{ background:"transparent", border:"1px solid #b07a7a30", borderRadius:8, padding:"6px 10px", color:"#b07a7a", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center" }}>
                                            <DeleteIcon/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── CREATE / EDIT MODAL ── */}
            {(modal==="create"||modal==="edit") && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:560, overflow:"hidden", maxHeight:"90vh", display:"flex", flexDirection:"column" }}>

                        {/* Header */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                            <div>
                                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>{modal==="create"?"Societate nouă":"Editare societate"}</p>
                                <p style={{ fontSize:11, color:C.textMid, margin:"2px 0 0" }}>{form.name||"Completează datele societății"}</p>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px", lineHeight:1 }}>✕</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display:"flex", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
                            {TABS.map(t=>(
                                <button key={t.key} onClick={()=>setTab(t.key)}
                                        style={{ flex:1, padding:"10px", fontSize:12, fontWeight:tab===t.key?600:400, background:"none", border:"none", borderBottom:`2px solid ${tab===t.key?C.blue:"transparent"}`, cursor:"pointer", color:tab===t.key?C.blue:C.textMid, fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Fields */}
                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14, overflowY:"auto", flex:1 }}>
                            {tab==="general" && <>
                                <Row2>
                                    <Field label="Cod *"        val={form.code}            set={v=>f("code",v)}            ph="0001" C={C}/>
                                    <Field label="Cod CAEN"     val={form.caenCode}         set={v=>f("caenCode",v)}         ph="7111" C={C}/>
                                </Row2>
                                <Field label="Denumire *"       val={form.name}             set={v=>f("name",v)}             ph="S.C. EXEMPLU SRL" C={C}/>
                                <Row2>
                                    <Field label="CIF / CUI *"  val={form.taxId}            set={v=>f("taxId",v)}            ph="RO12345678" C={C}/>
                                    <Field label="Nr. Reg. Com." val={form.tradeRegisterNo}  set={v=>f("tradeRegisterNo",v)}  ph="J40/1234/2024" C={C}/>
                                </Row2>
                                <Row2>
                                    <Field label="Capital social (RON)" val={form.shareCapital} set={v=>f("shareCapital",v)} ph="200" type="number" C={C}/>
                                    <Field label="Email"        val={form.email}            set={v=>f("email",v)}            ph="office@firma.ro" type="email" C={C}/>
                                </Row2>
                                <Field label="Telefon"          val={form.phone}            set={v=>f("phone",v)}            ph="+40 7xx xxx xxx" C={C}/>
                            </>}

                            {tab==="address" && <>
                                <Row2>
                                    <Field label="Județ"        val={form.addressCounty}    set={v=>f("addressCounty",v)}    ph="BUCURESTI" C={C}/>
                                    <Field label="Localitate"   val={form.addressCity}      set={v=>f("addressCity",v)}      ph="BUCURESTI" C={C}/>
                                </Row2>
                                <Row2>
                                    <Field label="Stradă"       val={form.addressStreet}    set={v=>f("addressStreet",v)}    ph="Str. Exemplu" C={C}/>
                                    <Field label="Nr."          val={form.addressNumber}    set={v=>f("addressNumber",v)}    ph="1" C={C}/>
                                </Row2>
                                <Row2>
                                    <Field label="Bloc"         val={form.addressBlock}     set={v=>f("addressBlock",v)}     ph="A1" C={C}/>
                                    <Field label="Scară"        val={form.addressEntrance}  set={v=>f("addressEntrance",v)}  ph="A" C={C}/>
                                </Row2>
                                <Row2>
                                    <Field label="Etaj"         val={form.addressFloor}     set={v=>f("addressFloor",v)}     ph="3" C={C}/>
                                    <Field label="Apartament"   val={form.addressApartment} set={v=>f("addressApartment",v)} ph="9" C={C}/>
                                </Row2>
                                <Row2>
                                    <Field label="Sector"       val={form.addressSector}    set={v=>f("addressSector",v)}    ph="2" C={C}/>
                                    <Field label="Cod poștal"   val={form.addressPostalCode} set={v=>f("addressPostalCode",v)} ph="020000" C={C}/>
                                </Row2>
                            </>}

                            {tab==="bank" && <>
                                <Field label="IBAN" val={form.primaryBankIban} set={v=>f("primaryBankIban",v)} ph="RO49AAAA1B31007593840000" C={C}/>
                                <Field label="Bancă" val={form.primaryBankName} set={v=>f("primaryBankName",v)} ph="RAIFFEISEN BANK" C={C}/>
                            </>}

                            {tab==="fiscal" && <>
                                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Mod de plată TVA</label>
                                    <div style={{ display:"flex", gap:8 }}>
                                        {VAT_PERIODS.map(p=>(
                                            <button key={p} onClick={()=>f("vatPeriod",p)}
                                                    style={{ flex:1, padding:"10px", fontSize:12, fontWeight:form.vatPeriod===p?600:400, background:form.vatPeriod===p?`${C.blue}18`:C.bg, border:`1.5px solid ${form.vatPeriod===p?C.blue:C.border2}`, borderRadius:10, cursor:"pointer", color:form.vatPeriod===p?C.blue:C.textMid, fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                                {VAT_LABELS[p]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                    <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Tip impozit pe profit</label>
                                    <div style={{ display:"flex", gap:8 }}>
                                        {PROFIT_TYPES.map(p=>(
                                            <button key={p} onClick={()=>f("profitTaxType",p)}
                                                    style={{ flex:1, padding:"10px", fontSize:12, fontWeight:form.profitTaxType===p?600:400, background:form.profitTaxType===p?`${C.blue}18`:C.bg, border:`1.5px solid ${form.profitTaxType===p?C.blue:C.border2}`, borderRadius:10, cursor:"pointer", color:form.profitTaxType===p?C.blue:C.textMid, fontFamily:"'Outfit',sans-serif", transition:"all 0.15s" }}>
                                                {PROFIT_LABELS[p]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <Toggle label="Plătitor TVA"    val={form.vatPayer}         set={v=>f("vatPayer",v)}         C={C}/>
                                <Toggle label="TVA la încasare" val={form.vatOnCollection}  set={v=>f("vatOnCollection",v)}  C={C}/>
                            </>}

                            {err && <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>

                        {/* Footer */}
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={save} disabled={saving} style={{ background:"#7b9cba", border:"none", borderRadius:9, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving?"Se salvează...":modal==="create"?"Creare":"Salvează"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── DELETE MODAL ── */}
            {modal==="delete" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:400 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:16, fontWeight:600, color:C.text }}>Stergere societate</span>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px" }}>
                            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.7, margin:0 }}>
                                Ești sigur că vrei să ștergi <strong style={{ color:C.text }}>{selected?.name}</strong>? Toate datele asociate (clienți, facturi, conturi, etc.) vor fi șterse permanent.
                            </p>
                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={del} disabled={saving} style={{ background:"#b07a7a", border:"none", borderRadius:9, padding:"9px 20px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving?"Se șterge...":"Sterge"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── ACCESS MODAL ── */}
            {modal==="access" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:480, overflow:"hidden" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <div>
                                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>Acces utilizatori</p>
                                <p style={{ fontSize:11, color:C.textMid, margin:"2px 0 0" }}>{selected?.name}</p>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
                            {/* Grant access */}
                            <div style={{ display:"flex", gap:8 }}>
                                <select value={selUserId} onChange={e=>setSelUserId(e.target.value)}
                                        style={{ flex:1, background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:13, color:selUserId?C.text:C.textDim, fontFamily:"'Outfit',sans-serif", outline:"none" }}>
                                    <option value="">Selectează utilizator...</option>
                                    {users.filter(u=>!accessList.find(a=>a.userId===u.id)).map(u=>(
                                        <option key={u.id} value={u.id}>{u.name} — {u.email}</option>
                                    ))}
                                </select>
                                <button onClick={grantAccess} disabled={!selUserId||accessSaving}
                                        style={{ background:"#7b9cba", border:"none", borderRadius:10, padding:"10px 16px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:selUserId?"pointer":"not-allowed", fontFamily:"'Outfit',sans-serif", opacity:!selUserId||accessSaving?0.5:1 }}>
                                    Acordă
                                </button>
                            </div>

                            {/* Access list */}
                            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                                <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Utilizatori cu acces</label>
                                {accessList.length === 0 ? (
                                    <p style={{ fontSize:13, color:C.textDim, margin:0 }}>Niciun utilizator.</p>
                                ) : accessList.map(a=>(
                                    <div key={a.userId} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:10 }}>
                                        <div>
                                            <div style={{ fontSize:13, fontWeight:500, color:C.text }}>{a.userName||`User #${a.userId}`}</div>
                                            <div style={{ fontSize:11, color:C.textMid }}>{a.userEmail||""}</div>
                                        </div>
                                        <button onClick={()=>revokeAccess(a.userId)}
                                                style={{ background:"transparent", border:"1px solid #b07a7a30", borderRadius:7, padding:"5px 10px", color:"#b07a7a", fontSize:11, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                                            Revocă
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display:"flex", justifyContent:"flex-end", padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Închide</button>
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
        select option { background:${C.card}; }
        input:focus { outline:none; border-color:#7b9cba !important; }
        button:focus { outline:none; }
        .tr-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
        .tr-row:hover .row-actions { opacity:1!important; }
      `}</style>
        </div>
    );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function Row2({ children }) { return <div style={{ display:"flex", gap:12 }}>{children}</div>; }

function Field({ label, val, set, ph, type="text", C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                   style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:14, color:C.text, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s", width:"100%" }}/>
        </div>
    );
}

function Toggle({ label, val, set, C }) {
    return (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10 }}>
            <span style={{ fontSize:13, color:C.text }}>{label}</span>
            <button onClick={()=>set(!val)}
                    style={{ width:40, height:22, borderRadius:11, background:val?"#7b9cba":"#374151", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s", flexShrink:0 }}>
                <span style={{ position:"absolute", top:3, left:val?20:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
            </button>
        </div>
    );
}

function EmptyState({ onAdd, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#7b9cba18", border:"1px solid #7b9cba25", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <BuildingIcon size={22} color="#7b9cba"/>
            </div>
            <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>Nicio societate</p>
                <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Adaugă prima societate pentru a începe</p>
            </div>
            <button onClick={onAdd} style={{ background:"#7b9cba", border:"none", borderRadius:10, padding:"9px 20px", color:"#0a0f17", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                + Societate nouă
            </button>
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

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#7b9cba", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>; }
function EditIcon()    { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function DeleteIcon()  { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
function UsersIcon()   { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 9c1.7.4 3 1.8 3 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function BuildingIcon({ size=16, color="currentColor" }) { return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="10" rx="1.5" stroke={color} strokeWidth="1.2"/><path d="M5 4V2.5A.5.5 0 015.5 2h5a.5.5 0 01.5.5V4" stroke={color} strokeWidth="1.2"/><path d="M6 9h4M6 12h2" stroke={color} strokeWidth="1.2" strokeLinecap="round"/></svg>; }