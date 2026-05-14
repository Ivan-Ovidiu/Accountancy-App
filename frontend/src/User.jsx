import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PALETTE = ["#7b9cba","#7aab8a","#b09a6a","#9b8fba","#6b7a8d","#b07a7a","#7abaa8"];
function avatarColor(name) { return PALETTE[(name?.charCodeAt(0)||0) % PALETTE.length]; }
function initials(name)     { return (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase(); }
function fmtDate(s)         { return s ? new Date(s).toLocaleDateString("ro-RO",{month:"short",day:"numeric",year:"numeric"}) : "—"; }
function authHeaders()      { return { Authorization:`Bearer ${localStorage.getItem("token")}`, "Content-Type":"application/json" }; }

// Role config — colors match app palette
const ROLE_CFG = {
    ADMIN:       { label:"Admin",       color:"#a78bfa", bg:"#a78bfa18", border:"#a78bfa30" },
    ACCOUNTANT:  { label:"Contabil",    color:"#7b9cba", bg:"#7b9cba18", border:"#7b9cba30" },
    VIEWER:      { label:"Vizualizator",color:"#6b7280", bg:"#6b728018", border:"#6b728030" },
};

const EMPTY_CREATE = { name:"", email:"", password:"", confirmPassword:"", role:"VIEWER" };
const EMPTY_EDIT   = { name:"", email:"", role:"VIEWER" };

export default function Users() {
    const T = useTheme();
    const C = T ?? {
        text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151",
        bg:"#0f1117", card:"#141820", cardAlt:"#0f1117",
        border:"#1e2330", border2:"#252d3a",
        blue:"#7b9cba", green:"#7aab8a", red:"#b07a7a", accent:"#a78bfa",
        isDark:true,
    };

    const [users,   setUsers]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState("");
    const [modal,   setModal]   = useState(null); // "create" | "edit" | "deactivate"
    const [selected,setSelected]= useState(null);
    const [form,    setForm]    = useState(EMPTY_CREATE);
    const [saving,  setSaving]  = useState(false);
    const [err,     setErr]     = useState("");
    const [showPass,setShowPass]= useState(false);
    const [showConfirm,setShowConfirm]=useState(false);

    // Current user email — to prevent self-deactivation UI feedback
    const currentEmail = (() => {
        try { return JSON.parse(localStorage.getItem("user"))?.email; } catch { return null; }
    })();

    // ── Load ──────────────────────────────────────────────────────────────────
    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/users`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // ── Debounced local search ─────────────────────────────────────────────────
    const displayed = search.trim()
        ? users.filter(u =>
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase())
        )
        : users;

    // ── Modal helpers ──────────────────────────────────────────────────────────
    const openCreate = () => { setForm(EMPTY_CREATE); setErr(""); setShowPass(false); setShowConfirm(false); setModal("create"); };
    const openEdit   = u  => { setSelected(u); setForm({ name:u.name, email:u.email, role:u.role }); setErr(""); setModal("edit"); };
    const openDeact  = u  => { setSelected(u); setModal("deactivate"); };
    const close      = () => { setModal(null); setSelected(null); setErr(""); };

    // ── Validate create ────────────────────────────────────────────────────────
    const validateCreate = () => {
        if (!form.name.trim())   return "Numele este obligatoriu.";
        if (!form.email.trim())  return "Email-ul este obligatoriu.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Format email invalid.";
        if (!form.password)      return "Parola este obligatorie.";
        if (form.password.length < 6) return "Parola trebuie să aibă cel puțin 6 caractere.";
        if (form.password !== form.confirmPassword) return "Parolele nu coincid.";
        return null;
    };

    const validateEdit = () => {
        if (!form.name.trim())  return "Numele este obligatoriu.";
        if (!form.email.trim()) return "Email-ul este obligatoriu.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Format email invalid.";
        return null;
    };

    // ── Save (create / edit) ───────────────────────────────────────────────────
    const save = async () => {
        const errMsg = modal === "create" ? validateCreate() : validateEdit();
        if (errMsg) { setErr(errMsg); return; }
        setSaving(true); setErr("");
        try {
            const url    = modal === "edit" ? `${API_BASE}/api/users/${selected.id}` : `${API_BASE}/api/users`;
            const method = modal === "edit" ? "PUT" : "POST";
            const body   = modal === "edit"
                ? { name: form.name, email: form.email, role: form.role }
                : { name: form.name, email: form.email, password: form.password, role: form.role };

            const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setErr(data.message || "Eroare la salvare.");
                setSaving(false);
                return;
            }
            close(); load();
        } catch {
            setErr("Eroare server.");
        }
        setSaving(false);
    };

    // ── Deactivate ─────────────────────────────────────────────────────────────
    const deactivate = async () => {
        setSaving(true);
        await fetch(`${API_BASE}/api/users/${selected.id}`, { method:"DELETE", headers: authHeaders() }).catch(() => {});
        setSaving(false); close(); load();
    };

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={{ padding:"36px 40px", fontFamily:"'Outfit',sans-serif", color:C.text, background:C.bg, minHeight:"100vh" }}>

            {/* ── HEADER ── */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32 }}>
                {/* Search */}
                <div style={{ display:"flex", alignItems:"center", gap:8, background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
                    <SearchIcon color={C.textDim}/>
                    <input
                        style={{ border:"none", background:"transparent", fontSize:13, color:C.text, fontFamily:"'Outfit',sans-serif", width:220, outline:"none" }}
                        placeholder="Caută utilizatori..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    {search && (
                        <button style={{ background:"none", border:"none", color:C.textDim, cursor:"pointer", fontSize:11, padding:0, lineHeight:1 }} onClick={() => setSearch("")}>✕</button>
                    )}
                </div>

                <button onClick={openCreate} style={{ display:"flex", alignItems:"center", gap:7, background:"#a78bfa", border:"none", borderRadius:10, padding:"9px 18px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                    <span style={{ fontSize:18, lineHeight:1, fontWeight:300 }}>+</span> Utilizator nou
                </button>
            </div>

            {/* ── TABLE ── */}
            {loading ? (
                <div style={{ display:"flex", justifyContent:"center", paddingTop:80 }}><Spin C={C}/></div>
            ) : displayed.length === 0 ? (
                <EmptyState onAdd={openCreate} C={C}/>
            ) : (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                        <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                            {["Utilizator","Email","Rol","Status","Creat la",""].map((h,i) => (
                                <th key={i} style={{ fontSize:10, color:C.textDim, textTransform:"uppercase", letterSpacing:"0.7px", fontWeight:600, padding:"12px 20px", textAlign:i===5?"right":"left" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {displayed.map((u,i) => (
                            <TableRow key={u.id} user={u} i={i} onEdit={openEdit} onDeact={openDeact} currentEmail={currentEmail} C={C}/>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── CREATE MODAL ── */}
            {modal === "create" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:500, overflow:"hidden" }}>
                        {/* Header */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                <div style={{ width:40, height:40, borderRadius:12, background:`${avatarColor(form.name||"?")}18`, color:avatarColor(form.name||"?"), border:`1.5px solid ${avatarColor(form.name||"?")}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, transition:"background 0.2s" }}>
                                    {initials(form.name||"?")}
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>{form.name||"Utilizator nou"}</p>
                                    <p style={{ fontSize:11, color:C.textMid, margin:"2px 0 0" }}>Cont nou</p>
                                </div>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px", lineHeight:1 }}>✕</button>
                        </div>

                        {/* Fields */}
                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                            <Field label="Nume complet *" val={form.name} set={v=>setForm(f=>({...f,name:v}))} ph="Ion Popescu" C={C}/>
                            <Field label="Email *" val={form.email} set={v=>setForm(f=>({...f,email:v}))} ph="ion.popescu@firma.ro" type="email" C={C}/>

                            {/* Password row */}
                            <div style={{ display:"flex", gap:12 }}>
                                <PasswordField label="Parolă *" val={form.password} set={v=>setForm(f=>({...f,password:v}))} ph="Min. 6 caractere" show={showPass} onToggle={()=>setShowPass(p=>!p)} C={C}/>
                                <PasswordField label="Confirmă parola *" val={form.confirmPassword} set={v=>setForm(f=>({...f,confirmPassword:v}))} ph="Repetă parola" show={showConfirm} onToggle={()=>setShowConfirm(p=>!p)} C={C}/>
                            </div>

                            {/* Role select */}
                            <RoleSelect val={form.role} set={v=>setForm(f=>({...f,role:v}))} C={C}/>

                            {/* Password strength hint */}
                            {form.password && <PasswordStrength password={form.password} C={C}/>}

                            {err && <ErrBox msg={err}/>}
                        </div>

                        {/* Footer */}
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={save} disabled={saving} style={{ background:"#a78bfa", border:"none", borderRadius:9, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving ? "Se creează..." : "Creare cont"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── EDIT MODAL ── */}
            {modal === "edit" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:460, overflow:"hidden" }}>
                        {/* Header */}
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                                <div style={{ width:40, height:40, borderRadius:12, background:`${avatarColor(selected?.name||"?")}18`, color:avatarColor(selected?.name||"?"), border:`1.5px solid ${avatarColor(selected?.name||"?")}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700 }}>
                                    {initials(selected?.name||"?")}
                                </div>
                                <div>
                                    <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>{selected?.name}</p>
                                    <p style={{ fontSize:11, color:C.textMid, margin:"2px 0 0" }}>Editare detalii</p>
                                </div>
                            </div>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px", lineHeight:1 }}>✕</button>
                        </div>

                        <div style={{ padding:"20px 24px", display:"flex", flexDirection:"column", gap:14 }}>
                            <Field label="Nume complet *" val={form.name} set={v=>setForm(f=>({...f,name:v}))} ph="Ion Popescu" C={C}/>
                            <Field label="Email *" val={form.email} set={v=>setForm(f=>({...f,email:v}))} ph="ion.popescu@firma.ro" type="email" C={C}/>
                            <RoleSelect val={form.role} set={v=>setForm(f=>({...f,role:v}))} C={C}/>
                            {err && <ErrBox msg={err}/>}
                        </div>

                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={save} disabled={saving} style={{ background:"#7b9cba", border:"none", borderRadius:9, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving ? "Se salvează..." : "Salvează"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── DEACTIVATE MODAL ── */}
            {modal === "deactivate" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background:C.card, border:`1px solid ${C.border2}`, borderRadius:18, width:"100%", maxWidth:400 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"20px 24px", borderBottom:`1px solid ${C.border}` }}>
                            <span style={{ fontSize:16, fontWeight:600, color:C.text }}>Dezactivare utilizator</span>
                            <button onClick={close} style={{ background:"none", border:`1px solid ${C.border}`, borderRadius:8, color:C.textMid, fontSize:14, cursor:"pointer", padding:"4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding:"20px 24px" }}>
                            <p style={{ fontSize:14, color:C.textMid, lineHeight:1.7, margin:0 }}>
                                Ești sigur că vrei să dezactivezi contul lui <strong style={{ color:C.text }}>{selected?.name}</strong>?
                                Utilizatorul nu va mai putea accesa aplicația.
                            </p>
                        </div>
                        <div style={{ display:"flex", justifyContent:"flex-end", gap:10, padding:"16px 24px", borderTop:`1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:9, padding:"9px 18px", color:C.textMid, fontSize:13, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={deactivate} disabled={saving} style={{ background:"#b07a7a", border:"none", borderRadius:9, padding:"9px 20px", color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif", opacity:saving?0.7:1 }}>
                                {saving ? "Se dezactivează..." : "Dezactivează"}
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
                input:focus { outline:none; border-color:#7b9cba !important; }
                select:focus { outline:none; border-color:#7b9cba !important; }
                button:focus { outline:none; }
                .tr-row:hover { background:${C.isDark?"rgba(255,255,255,0.025)":"rgba(0,0,0,0.025)"}!important; }
                .tr-row:hover .row-actions { opacity:1!important; }
            `}</style>
        </div>
    );
}

// ─── Table Row ────────────────────────────────────────────────────────────────
function TableRow({ user:u, i, onEdit, onDeact, currentEmail, C }) {
    const color = avatarColor(u.name);
    const role  = ROLE_CFG[u.role] || ROLE_CFG.VIEWER;
    const isSelf = u.email === currentEmail;

    return (
        <tr className="tr-row" style={{ borderBottom:`1px solid ${C.border}`, transition:"background 0.12s", animation:`fadeUp 0.3s ease ${i*30}ms both` }}>
            {/* Avatar + Name */}
            <td style={{ padding:"14px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ position:"relative", flexShrink:0 }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:`${color}18`, color, border:`1px solid ${color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>
                            {initials(u.name)}
                        </div>
                        {/* Online dot for self */}
                        {isSelf && <div style={{ position:"absolute", bottom:-1, right:-1, width:9, height:9, borderRadius:"50%", background:"#7aab8a", border:`2px solid ${C.card}` }}/>}
                    </div>
                    <div>
                        <span style={{ fontSize:13, fontWeight:500, color:C.text, display:"block" }}>{u.name}</span>
                        {isSelf && <span style={{ fontSize:10, color:"#7aab8a", fontWeight:500 }}>Tu</span>}
                    </div>
                </div>
            </td>
            {/* Email */}
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:12, color:C.textMid }}>{u.email}</span>
            </td>
            {/* Role badge */}
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:11, fontWeight:600, color:role.color, background:role.bg, border:`1px solid ${role.border}`, borderRadius:6, padding:"3px 10px" }}>
                    {role.label}
                </span>
            </td>
            {/* Status */}
            <td style={{ padding:"14px 20px" }}>
                {u.isActive !== false
                    ? <span style={{ fontSize:11, fontWeight:500, color:"#7aab8a", background:"#7aab8a18", border:"1px solid #7aab8a30", borderRadius:6, padding:"3px 10px" }}>Activ</span>
                    : <span style={{ fontSize:11, fontWeight:500, color:"#b07a7a", background:"#b07a7a18", border:"1px solid #b07a7a30", borderRadius:6, padding:"3px 10px" }}>Inactiv</span>
                }
            </td>
            {/* Created at */}
            <td style={{ padding:"14px 20px" }}>
                <span style={{ fontSize:12, color:C.textDim }}>{fmtDate(u.createdAt)}</span>
            </td>
            {/* Actions */}
            <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <div className="row-actions" style={{ display:"flex", gap:6, justifyContent:"flex-end", opacity:0, transition:"opacity 0.15s" }}>
                    <button onClick={() => onEdit(u)}
                            style={{ background:"transparent", border:`1px solid ${C.border2}`, borderRadius:8, padding:"6px 12px", color:C.textMid, fontSize:12, cursor:"pointer", fontFamily:"'Outfit',sans-serif", display:"flex", alignItems:"center", gap:5, transition:"all 0.15s" }}>
                        <EditIcon/> Editează
                    </button>
                    {!isSelf && (
                        <button onClick={() => onDeact(u)}
                                style={{ background:"transparent", border:"1px solid #b07a7a30", borderRadius:8, padding:"6px 10px", color:"#b07a7a", fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", transition:"all 0.15s" }}
                                title="Dezactivează">
                            <DeactIcon/>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

// ─── Role Select ──────────────────────────────────────────────────────────────
function RoleSelect({ val, set, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>Rol *</label>
            <div style={{ position:"relative" }}>
                <select value={val} onChange={e=>set(e.target.value)}
                        style={{ width:"100%", background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:14, color:C.text, fontFamily:"'Outfit',sans-serif", appearance:"none", cursor:"pointer", transition:"border-color 0.2s" }}>
                    <option value="VIEWER">Vizualizator — doar citire</option>
                    <option value="ACCOUNTANT">Contabil — poate posta articole</option>
                    <option value="ADMIN">Admin — acces complet</option>
                </select>
                {/* Custom arrow */}
                <svg style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 4l4 4 4-4" stroke={C.textMid} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </div>
            {/* Role description pill */}
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:ROLE_CFG[val]?.color||"#6b7280" }}/>
                <span style={{ fontSize:11, color:C.textDim }}>
                    {val==="ADMIN"    && "Poate gestiona utilizatori, societăți și toate modulele."}
                    {val==="ACCOUNTANT" && "Poate posta articole contabile și gestiona facturi."}
                    {val==="VIEWER"   && "Poate vizualiza rapoarte și date, fără modificări."}
                </span>
            </div>
        </div>
    );
}

// ─── Password Field with toggle ───────────────────────────────────────────────
function PasswordField({ label, val, set, ph, show, onToggle, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            <div style={{ position:"relative" }}>
                <input type={show?"text":"password"} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                       style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 36px 10px 14px", fontSize:14, color:C.text, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s", width:"100%" }}/>
                <button type="button" onClick={onToggle} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:C.textDim, display:"flex", alignItems:"center", padding:2 }}>
                    {show ? <EyeOffIcon/> : <EyeIcon/>}
                </button>
            </div>
        </div>
    );
}

// ─── Password Strength Indicator ──────────────────────────────────────────────
function PasswordStrength({ password, C }) {
    const score = [
        password.length >= 6,
        password.length >= 10,
        /[A-Z]/.test(password),
        /[0-9]/.test(password),
        /[^A-Za-z0-9]/.test(password),
    ].filter(Boolean).length;

    const levels = [
        { label:"Slabă",     color:"#b07a7a" },
        { label:"Slabă",     color:"#b07a7a" },
        { label:"Medie",     color:"#b09a6a" },
        { label:"Bună",      color:"#7b9cba" },
        { label:"Puternică", color:"#7aab8a" },
    ];
    const lv = levels[Math.max(0,score-1)];

    return (
        <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <div style={{ display:"flex", gap:4 }}>
                {[1,2,3,4,5].map(s => (
                    <div key={s} style={{ flex:1, height:3, borderRadius:99, background:s<=score?lv.color:C.border2, transition:"background 0.3s" }}/>
                ))}
            </div>
            <span style={{ fontSize:10, color:lv.color, fontWeight:500 }}>Putere parolă: {lv.label}</span>
        </div>
    );
}

// ─── Shared sub-components ────────────────────────────────────────────────────
function Field({ label, val, set, ph, type="text", C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", gap:6, flex:1 }}>
            <label style={{ fontSize:11, color:C.textMid, textTransform:"uppercase", letterSpacing:"0.5px", fontWeight:500 }}>{label}</label>
            <input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph}
                   style={{ background:C.bg, border:`1px solid ${C.border2}`, borderRadius:10, padding:"10px 14px", fontSize:14, color:C.text, fontFamily:"'Outfit',sans-serif", transition:"border-color 0.2s", width:"100%" }}/>
        </div>
    );
}

function ErrBox({ msg }) {
    return <p style={{ fontSize:13, color:"#b07a7a", margin:0, padding:"8px 12px", background:"#b07a7a18", borderRadius:8, border:"1px solid #b07a7a30" }}>⚠ {msg}</p>;
}

function Overlay({ children, onClose, C }) {
    return (
        <div style={{ position:"fixed", inset:0, background:`rgba(0,0,0,${C.isDark?0.65:0.35})`, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(6px)", animation:"fadeIn 0.15s ease" }}
             onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
            {children}
        </div>
    );
}

function EmptyState({ onAdd, C }) {
    return (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:320, background:C.card, border:`1px solid ${C.border}`, borderRadius:16, gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:"#a78bfa18", border:"1px solid #a78bfa25", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <UsersPlaceholderIcon/>
            </div>
            <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:15, fontWeight:600, color:C.text, margin:0 }}>Niciun utilizator</p>
                <p style={{ fontSize:13, color:C.textDim, marginTop:6 }}>Creează primul utilizator pentru a continua</p>
            </div>
            <button onClick={onAdd} style={{ background:"#a78bfa", border:"none", borderRadius:10, padding:"9px 20px", color:C.isDark?"#0a0f17":"#fff", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Outfit',sans-serif" }}>
                + Utilizator nou
            </button>
        </div>
    );
}

function Spin({ C }) { return <div style={{ width:28, height:28, border:`2px solid ${C.border2}`, borderTopColor:"#a78bfa", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />; }
function SearchIcon({ color })      { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={color} strokeWidth="1.5"/><path d="M10.5 10.5L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></svg>; }
function EditIcon()                 { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>; }
function DeactIcon()                { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>; }
function EyeIcon()                  { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="8" rx="6" ry="4" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1.8" fill="currentColor"/></svg>; }
function EyeOffIcon()               { return <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12M6.5 6.6A3 3 0 0010 10M3 5.5C4.2 4.2 6 3 8 3c3 0 5.5 2.5 5.5 5M1 8s1-3 7-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>; }
function UsersPlaceholderIcon()     { return <svg width="22" height="22" viewBox="0 0 20 20" fill="none"><circle cx="7" cy="6" r="3" stroke="#a78bfa" strokeWidth="1.3"/><circle cx="13" cy="6" r="3" stroke="#a78bfa" strokeWidth="1.3"/><path d="M1 16c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round"/><path d="M14 11c2.2.5 4 2.2 4 5" stroke="#a78bfa" strokeWidth="1.3" strokeLinecap="round"/></svg>; }