import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

const PALETTE = ["#7b9cba","#7aab8a","#b07a7a","#9b8fba","#6b7a8d","#b07a7a","#7abaa8"];
function avatarColor(name) { return PALETTE[(name?.charCodeAt(0)||0) % PALETTE.length]; }
function initials(name)    { return (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }
function fmtDate(s)        { return s ? new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : "—"; }
function authHeaders()     { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }

const EMPTY = { name:"", email:"", phone:"", address:"", taxId:"" };

export default function Suppliers() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", isDark:true };

    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [search, setSearch]       = useState("");
    const [modal, setModal]         = useState(null);
    const [selected, setSelected]   = useState(null);
    const [form, setForm]           = useState(EMPTY);
    const [saving, setSaving]       = useState(false);
    const [err, setErr]             = useState("");
    const [preview, setPreview]     = useState({ name:"", color:"#7b9cba" });

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/suppliers`, { headers:authHeaders() })
            .then(r=>r.json()).then(d=>{ setSuppliers(Array.isArray(d)?d:[]); setLoading(false); })
            .catch(()=>setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const active   = suppliers.filter(s=>s.isActive!==false);
    const filtered = active.filter(s=>!search || s.name.toLowerCase().includes(search.toLowerCase()) || (s.taxId||"").toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm(EMPTY); setPreview({ name:"", color:"#7b9cba" }); setErr(""); setModal("create"); };
    const openEdit   = s  => { setSelected(s); setForm({ name:s.name, email:s.email||"", phone:s.phone||"", address:s.address||"", taxId:s.taxId||"" }); setPreview({ name:s.name, color:avatarColor(s.name) }); setErr(""); setModal("edit"); };
    const openDel    = s  => { setSelected(s); setModal("delete"); };
    const close      = () => { setModal(null); setSelected(null); setErr(""); };

    const save = async () => {
        if (!form.name.trim()) { setErr("Name is required."); return; }
        setSaving(true); setErr("");
        try {
            const url    = modal==="edit" ? `${API_BASE}/api/suppliers/${selected.id}` : `${API_BASE}/api/suppliers`;
            const method = modal==="edit" ? "PUT" : "POST";
            const res    = await fetch(url, { method, headers:authHeaders(), body:JSON.stringify(form) });
            if (!res.ok) { const e=await res.json().catch(()=>{}); setErr(e?.message||"Failed to save."); setSaving(false); return; }
            close(); load();
        } catch { setErr("Server error."); }
        setSaving(false);
    };

    const del = async () => {
        setSaving(true);
        await fetch(`${API_BASE}/api/suppliers/${selected.id}`, { method:"DELETE", headers:authHeaders() }).catch(()=>{});
        setSaving(false); close(); load();
    };

    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* HEADER */}
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24 }}>
                <div>
                    <h1 style={{ fontSize:24, fontWeight:700, color:C.text, letterSpacing:"-0.5px", margin:0 }}>Suppliers</h1>
                    <p style={{ fontSize:13, color:C.textDim, marginTop:5 }}>{active.length} supplier{active.length!==1?"s":""} active</p>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
                        <SearchIcon color={C.textDim} />
                        <input style={{ border:"none", background:"transparent", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", width:180, outline:"none" }}
                               placeholder="Search suppliers..." value={search} onChange={e=>setSearch(e.target.value)} />
                        {search && <button style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:11, padding:0 }} onClick={()=>setSearch("")}>✕</button>}
                    </div>
                    <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:7, background:"#b07a7a", border:"none", borderRadius:10, padding:"9px 18px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                        <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> New Supplier
                    </button>
                </div>
            </div>

            {/* TABLE */}
            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C} /></div>
            ) : filtered.length===0 ? (
                <Empty onAdd={openCreate} C={C} />
            ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                            {["Supplier","Contact","Tax ID","Added",""].map((h,i)=>(
                                <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===4?"right":"left" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((s,i)=>(
                            <tr key={s.id} className="sup-row" style={{ borderBottom:`1px solid ${C.border}`, transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*25}ms both` }}>
                                <td style={{ padding:"14px 20px" }}>
                                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                        <div style={{ width:36, height:36, borderRadius:10, background:`${avatarColor(s.name)}20`, border:`1px solid ${avatarColor(s.name)}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:avatarColor(s.name), flexShrink:0 }}>
                                            {initials(s.name)}
                                        </div>
                                        <div>
                                            <p style={{ fontSize:13, fontWeight:600, color:C.text, margin:0 }}>{s.name}</p>
                                            {s.address && <p style={{ fontSize:11, color:C.textDim, margin:"2px 0 0" }}>{s.address}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding:"14px 20px" }}>
                                    <div>
                                        {s.email && <p style={{ fontSize:13, color:C.textMid, margin:0 }}>{s.email}</p>}
                                        {s.phone && <p style={{ fontSize:11, color:C.textDim, margin:"2px 0 0" }}>{s.phone}</p>}
                                        {!s.email && !s.phone && <span style={{ color:C.textDim, fontSize:13 }}>—</span>}
                                    </div>
                                </td>
                                <td style={{ padding:"14px 20px" }}>
                                    {s.taxId
                                        ? <span style={{ fontSize:12, fontFamily:"monospace", color:"#b07a7a", background:"#b07a7a15", border:"1px solid #b07a7a25", borderRadius:6, padding:"3px 9px" }}>{s.taxId}</span>
                                        : <span style={{ color:C.textDim, fontSize:13 }}>—</span>}
                                </td>
                                <td style={{ padding:"14px 20px", fontSize:12, color:C.textDim }}>{fmtDate(s.createdAt)}</td>
                                <td style={{ padding:"14px 20px", textAlign:"right" }}>
                                    <div className="sup-actions" style={{ display:"flex", gap:6, justifyContent:"flex-end", opacity:0, transition:"opacity 0.15s" }}>
                                        <button onClick={()=>openEdit(s)} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8, padding:"5px 12px", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:5 }}>
                                            <EditIcon /> Edit
                                        </button>
                                        <button onClick={()=>openDel(s)} style={{ background:"transparent", border:"1px solid #b07a7a30", borderRadius:8, padding:"5px 10px", color:"#b07a7a", fontSize:12, cursor:"pointer" }}>
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {(modal==="create"||modal==="edit") && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:500 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                <div style={{ width:40, height:40, borderRadius:12, background:`${preview.color}20`, border:`1px solid ${preview.color}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, fontWeight:700, color:preview.color }}>
                                    {initials(preview.name)||"?"}
                                </div>
                                <div>
                                    <h2 style={{ fontSize:16, fontWeight:600, color:C.text, margin:0 }}>{modal==="create"?"New Supplier":"Edit Supplier"}</h2>
                                    <p style={{ fontSize:12, color:C.textDim, marginTop:2 }}>{preview.name||"Enter supplier name"}</p>
                                </div>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                            <div style={{ display:"flex", gap:12 }}>
                                <FInput label="Name *" val={form.name} set={v=>{ setForm(f=>({...f,name:v})); setPreview({ name:v, color:avatarColor(v) }); }} ph="Firma ABC SRL" C={C} />
                                <FInput label="Tax ID (CIF)" val={form.taxId} set={v=>setForm(f=>({...f,taxId:v}))} ph="RO12345678" C={C} />
                            </div>
                            <div style={{ display:"flex", gap:12 }}>
                                <FInput label="Email" val={form.email} set={v=>setForm(f=>({...f,email:v}))} ph="contact@firma.ro" C={C} />
                                <FInput label="Phone" val={form.phone} set={v=>setForm(f=>({...f,phone:v}))} ph="+40 721 000 000" C={C} />
                            </div>
                            <FInput label="Address" val={form.address} set={v=>setForm(f=>({...f,address:v}))} ph="Str. Exemplu nr. 1, București" C={C} />
                            {err && <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>

                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
                            <button onClick={save} disabled={saving} style={{ background:"#b07a7a", border:"none", borderRadius:9, padding:"9px 22px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving?"Saving...":modal==="create"?"Add Supplier":"Save Changes"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* DELETE MODAL */}
            {modal==="delete" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:400 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:16, fontWeight:600, color:C.text }}>Deactivate Supplier</span>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px" }}>
                            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.7, margin:0 }}>
                                Deactivate <strong style={{ color:C.text }}>{selected?.name}</strong>? This will hide them from new invoice forms.
                            </p>
                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Cancel</button>
                            <button onClick={del} disabled={saving} style={{ background:"#b07a7a", border:"none", borderRadius:9, padding:"9px 20px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving?"Deactivating...":"Deactivate"}
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
        input:focus,select:focus { outline:none; border-color:#b07a7a !important; }
        button:focus { outline:none; }
        .sup-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
        .sup-row:hover .sup-actions { opacity:1!important; }
      `}</style>
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

function Empty({ onAdd, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#b07a7a18", border:"1px solid #b07a7a25", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="1" y="4" width="14" height="9" rx="2" stroke="#b07a7a" strokeWidth="1.3"/><path d="M5 4V3a3 3 0 0 1 6 0v1" stroke="#b07a7a" strokeWidth="1.3"/></svg>
            </div>
            <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>No suppliers yet</p>
                <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Add your first supplier to start recording purchase invoices</p>
            </div>
            <button onClick={onAdd} style={{ background:"#b07a7a", border:"none", borderRadius:10, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>+ New Supplier</button>
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

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#b07a7a", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />; }
function SearchIcon({ color }) { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={color} strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function EditIcon()   { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function DeleteIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>; }