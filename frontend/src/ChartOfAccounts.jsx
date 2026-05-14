import { useTheme } from "./App";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8080";

const TYPE_META = {
    ASSET:     { label:"Activ",          color:"#7b9cba", bg:"#7b9cba18" },
    LIABILITY: { label:"Pasiv",          color:"#b07a7a", bg:"#b07a7a18" },
    EQUITY:    { label:"Capital propriu",color:"#9b8fba", bg:"#9b8fba18" },
    REVENUE:   { label:"Venituri",       color:"#7aab8a", bg:"#7aab8a18" },
    EXPENSE:   { label:"Cheltuieli",     color:"#b09a6a", bg:"#b09a6a18" },
};

const TYPES = ["ASSET","LIABILITY","EQUITY","REVENUE","EXPENSE"];

// Romanian OMFP chart of accounts class definitions
const CLASS_META = {
    "1": { label: "Clasa 1 — Capital și rezerve",             color: "#9b8fba", bg: "#9b8fba18" },
    "2": { label: "Clasa 2 — Imobilizări",                    color: "#7b9cba", bg: "#7b9cba18" },
    "3": { label: "Clasa 3 — Stocuri și producție în curs",   color: "#7aab8a", bg: "#7aab8a18" },
    "4": { label: "Clasa 4 — Terți",                          color: "#b09a6a", bg: "#b09a6a18" },
    "5": { label: "Clasa 5 — Trezorerie",                     color: "#7b9cba", bg: "#7b9cba18" },
    "6": { label: "Clasa 6 — Cheltuieli",                     color: "#b07a7a", bg: "#b07a7a18" },
    "7": { label: "Clasa 7 — Venituri",                       color: "#7aab8a", bg: "#7aab8a18" },
    "8": { label: "Clasa 8 — Conturi speciale",               color: "#6b7280", bg: "#6b728018" },
    "9": { label: "Clasa 9 — Conturi de gestiune",            color: "#6b7280", bg: "#6b728018" },
};

// Get the account "level" based on code structure:
// 1 digit  = class header (not a real account)
// 2-3 digits = group/synthetic (e.g. 10, 101, 106)
// 4+ digits = analytic (e.g. 1011, 1012)
function getCodeLevel(code) {
    const stripped = code.replace(/\./g, "").replace(/[^0-9]/g, "");
    return stripped.length;
}

function getClass(code) {
    return code ? code.trim()[0] : null;
}

// Sort accounts hierarchically: parent → children → grandchildren
function sortHierarchical(list) {
    const codeMap = Object.fromEntries(list.map(a => [a.code.trim().replace(/\./g, ""), a]));
    const listIds = new Set(list.map(a => a.id));

    // Găsește parentul efectiv (din parentId sau din prefix cod)
    const getParentId = (acc) => {
        if (acc.parentId && listIds.has(acc.parentId)) return acc.parentId;
        const code = acc.code.trim().replace(/\./g, "");
        for (let len = code.length - 1; len >= 2; len--) {
            const parent = codeMap[code.slice(0, len)];
            if (parent) return parent.id;
        }
        return null;
    };

    const result = [];
    const addWithChildren = (item) => {
        result.push(item);
        list
            .filter(a => getParentId(a) === item.id && a.id !== item.id)
            .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
            .forEach(child => addWithChildren(child));
    };

    list
        .filter(a => getParentId(a) === null)
        .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
        .forEach(root => addWithChildren(root));

    return result;
}
// Compute indentation depth relative to the class
// Accounts with no parent in the list = depth 0 (synthetic)
// Accounts with parent = depth 1 (analytic)
// Accounts with grandparent = depth 2 (sub-analytic)
function buildDepthMap(list) {
    const idMap = Object.fromEntries(list.map(a => [a.id, a]));
    const codeMap = Object.fromEntries(list.map(a => [a.code.trim(), a]));
    const listIds = new Set(list.map(a => a.id));

    const getDepth = (acc) => {
        // 1. Dacă are parentId real → folosim aia
        if (acc.parentId && listIds.has(acc.parentId)) {
            return 1 + getDepth(idMap[acc.parentId]);
        }
        // 2. Fallback: inferăm parentul din cod
        // Tăiem ultima cifră și vedem dacă există un cont cu acel prefix
        const code = acc.code.trim().replace(/\./g, "");
        for (let len = code.length - 1; len >= 2; len--) {
            const prefix = code.slice(0, len);
            if (codeMap[prefix]) {
                return 1 + getDepth(codeMap[prefix]);
            }
        }
        return 0;
    };

    const depthMap = {};
    list.forEach(a => {
        if (depthMap[a.id] === undefined) depthMap[a.id] = getDepth(a);
    });
    return depthMap;
}
function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" };
}

const EMPTY = { code: "", name: "", type: "EXPENSE", subType: "", parentId: "" };

export default function ChartOfAccounts() {
    const T = useTheme();
    const C = T ?? { text:"#d4d8e0", textMid:"#6b7280", textDim:"#374151", bg:"#0f1117", card:"#141820", border:"#1e2330", border2:"#252d3a", blue:"#7b9cba", isDark:true };

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState("ALL");
    const [search, setSearch]     = useState("");
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY);
    const [saving, setSaving]     = useState(false);
    const [err, setErr]           = useState("");

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/accounts`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => { setAccounts(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const active = accounts.filter(a => a.isActive !== false);

    const filtered = active
        .filter(a => filter === "ALL" || a.type === filter)
        .filter(a => !search || (
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.code.toLowerCase().includes(search.toLowerCase())
        ));

    // ── BY-TYPE grouped view (for filter tabs other than ALL) ──────────────────
    const sortedByType = (list) => sortHierarchical(list);
    const grouped = TYPES.reduce((acc, type) => {
        acc[type] = sortedByType(filtered.filter(a => a.type === type));
        return acc;
    }, {});
    const counts = TYPES.reduce((acc, type) => {
        acc[type] = active.filter(a => a.type === type).length;
        return acc;
    }, {});

    // ── BY-CLASS grouped view (for ALL) ────────────────────────────────────────
    const classGroups = Object.keys(CLASS_META).reduce((acc, cls) => {
        const list = filtered.filter(a => getClass(a.code) === cls);
        if (list.length > 0) {
            acc[cls] = sortHierarchical(list);
        }
        return acc;
    }, {});
    // Accounts whose code doesn't start with 1-9 (edge case)
    const unclassified = filtered.filter(a => !CLASS_META[getClass(a.code)]);

    // ── MODALS ─────────────────────────────────────────────────────────────────
    const openCreate   = () => { setForm(EMPTY); setErr(""); setModal("create"); };
    const openEdit     = a  => { setSelected(a); setForm({ code: a.code, name: a.name, type: a.type, subType: a.subType || "", parentId: a.parentId || "" }); setErr(""); setModal("edit"); };
    const openDel      = a  => { setSelected(a); setModal("delete"); };
    const openAnalytic = a  => {
        setForm({ code: a.code + ".", name: "", type: a.type, subType: "Analitic", parentId: String(a.id) });
        setSelected(a);
        setErr("");
        setModal("create");
    };
    const close = () => { setModal(null); setSelected(null); setErr(""); };

    const save = async () => {
        if (!form.code.trim()) { setErr("Codul este obligatoriu."); return; }
        if (!form.name.trim()) { setErr("Denumirea este obligatorie."); return; }
        setSaving(true); setErr("");
        try {
            const url    = modal === "edit" ? `${API_BASE}/api/accounts/${selected.id}` : `${API_BASE}/api/accounts`;
            const method = modal === "edit" ? "PUT" : "POST";
            const body   = { code: form.code, name: form.name, type: form.type, subType: form.subType || null, parentId: form.parentId ? parseInt(form.parentId) : null };
            const res    = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(body) });
            if (!res.ok) { const e = await res.json().catch(() => {}); setErr(e?.message || "Eroare la salvare."); setSaving(false); return; }
            close(); load();
        } catch { setErr("Eroare server."); }
        setSaving(false);
    };

    const del = async () => {
        setSaving(true);
        await fetch(`${API_BASE}/api/accounts/${selected.id}`, { method: "DELETE", headers: authHeaders() }).catch(() => {});
        setSaving(false); close(); load();
    };

    return (
        <div style={{ padding: "36px 40px", fontFamily: "'Outfit',sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}>

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-0.5px", margin: 0 }}>Plan de conturi</h1>
                    <p style={{ fontSize: 13, color: C.textDim, marginTop: 5 }}>{active.length} account{active.length !== 1 ? "s" : ""} · foundation of double-entry bookkeeping</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
                        <SearchIcon color={C.textDim} />
                        <input
                            style={{ border: "none", background: "transparent", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", width: 180, outline: "none" }}
                            placeholder="Caută conturi..." value={search} onChange={e => setSearch(e.target.value)}
                        />
                        {search && <button style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", fontSize: 11, padding: 0 }} onClick={() => setSearch("")}>✕</button>}
                    </div>
                    <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, background: "#7b9cba", border: "none", borderRadius: 10, padding: "9px 18px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                        <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span> Cont nou
                    </button>
                </div>
            </div>

            {/* TYPE FILTER TABS */}
            <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
                <button onClick={() => setFilter("ALL")}
                        style={{ border: `1px solid ${filter === "ALL" ? C.blue : C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: filter === "ALL" ? 600 : 400, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: filter === "ALL" ? `${C.blue}18` : C.card, color: filter === "ALL" ? C.blue : C.textMid, transition: "all 0.15s" }}>
                    All <span style={{ opacity: 0.6 }}>({active.length})</span>
                </button>
                {TYPES.map(type => {
                    const meta = TYPE_META[type];
                    return (
                        <button key={type} onClick={() => setFilter(type)}
                                style={{ border: `1px solid ${filter === type ? meta.color : C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: filter === type ? 600 : 400, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: filter === type ? meta.bg : C.card, color: filter === type ? meta.color : C.textMid, transition: "all 0.15s" }}>
                            {meta.label} <span style={{ opacity: 0.6 }}>({counts[type]})</span>
                        </button>
                    );
                })}
            </div>

            {/* CONTENT */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><Spin C={C} /></div>
            ) : filtered.length === 0 ? (
                <Empty onAdd={openCreate} C={C} />
            ) : filter === "ALL" ? (
                /* ── ALL VIEW: grouped by Romanian accounting class ── */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {Object.entries(classGroups).map(([cls, list]) => {
                        const meta  = CLASS_META[cls];
                        const depthMap = buildDepthMap(list);
                        return (
                            <div key={cls} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                                {/* Class header */}
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, opacity: 0.8 }} />
                                        <span style={{ fontSize: 12, fontWeight: 700, color: meta.color, letterSpacing: "0.4px" }}>{meta.label}</span>
                                        <span style={{ fontSize: 11, color: C.textDim, background: C.border2, borderRadius: 5, padding: "1px 7px" }}>{list.length}</span>
                                    </div>
                                </div>

                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                        {["Cod", "Denumire", "Tip", "Subtip", ""].map((h, i) => (
                                            <th key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 600, padding: "10px 20px", textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {list.map((a, i) => {
                                        const depth     = depthMap[a.id] ?? 0;
                                        const typeMeta  = TYPE_META[a.type] ?? { color: "#6b7280", bg: "#6b728018" };
                                        const isAnalytic = depth > 0;
                                        return (
                                            <ClassAccRow
                                                key={a.id}
                                                acc={a}
                                                i={i}
                                                depth={depth}
                                                isAnalytic={isAnalytic}
                                                typeMeta={typeMeta}
                                                classMeta={meta}
                                                C={C}
                                                onEdit={openEdit}
                                                onDelete={openDel}
                                                onAnalytic={openAnalytic}
                                            />
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                    {/* Unclassified accounts (edge case) */}
                    {unclassified.length > 0 && (
                        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                            <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: C.textDim }}>Neclasificate</span>
                            </div>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <tbody>
                                {unclassified.map((a, i) => (
                                    <ClassAccRow key={a.id} acc={a} i={i} depth={0} isAnalytic={false}
                                                 typeMeta={TYPE_META[a.type] ?? { color: "#6b7280", bg: "#6b728018" }}
                                                 classMeta={{ color: "#6b7280", bg: "#6b728018" }}
                                                 C={C} onEdit={openEdit} onDelete={openDel} onAnalytic={openAnalytic} />
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                /* ── TYPE FILTER VIEW: same as before ── */
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {TYPES.map(type => {
                        const list = grouped[type];
                        if (!list || list.length === 0) return null;
                        const meta = TYPE_META[type];
                        return (
                            <div key={type} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${C.border}`, background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, opacity: 0.8 }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: meta.color, textTransform: "uppercase", letterSpacing: "0.6px" }}>{meta.label}</span>
                                        <span style={{ fontSize: 11, color: C.textDim, background: C.border2, borderRadius: 5, padding: "1px 7px" }}>{list.length}</span>
                                    </div>
                                </div>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                                        {["Cod", "Denumire", "Subtip", "Cont părinte", ""].map((h, i) => (
                                            <th key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 600, padding: "10px 20px", textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {list.map((a, i) => (
                                        <AccRow key={a.id} acc={a} i={i} C={C} meta={meta} onEdit={openEdit} onDelete={openDel} onAnalytic={openAnalytic} />
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* CREATE / EDIT MODAL */}
            {(modal === "create" || modal === "edit") && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 460 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>
                                    {modal === "edit" ? "Editare cont" : form.subType === "Analitic" ? "Cont analitic nou" : "Cont nou"}
                                </h2>
                                <p style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
                                    {form.subType === "Analitic" && selected
                                        ? `Analitic al contului ${selected.code} — ${selected.name}`
                                        : `${form.code || "Cod"} · ${TYPE_META[form.type]?.label}`}
                                </p>
                            </div>
                            <button onClick={close} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <FInput label="Cod *" val={form.code} set={v => setForm(f => ({ ...f, code: v }))} ph="704.1" C={C} />
                                <FInput label="Denumire *" val={form.name} set={v => setForm(f => ({ ...f, name: v }))} ph="Venituri servicii IT" C={C} />
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Type *</label>
                                    {form.subType === "Analitic" ? (
                                        <div style={{ background: C.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textMid, fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                                            <span style={{ color: TYPE_META[form.type]?.color, fontWeight: 600 }}>●</span>
                                            {TYPE_META[form.type]?.label}
                                        </div>
                                    ) : (
                                        <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                                                style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                                            {TYPES.map(t => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                                        </select>
                                    )}
                                </div>
                                {form.subType === "Analitic" ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                        <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Sub Type</label>
                                        <div style={{ background: C.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textMid, fontFamily: "'Outfit',sans-serif" }}>Analitic</div>
                                    </div>
                                ) : (
                                    <FInput label="Subtip" val={form.subType} set={v => setForm(f => ({ ...f, subType: v }))} ph="Sintetic" C={C} />
                                )}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Parent Account</label>
                                {form.subType === "Analitic" ? (
                                    <div style={{ background: C.isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textMid, fontFamily: "'Outfit',sans-serif" }}>
                                        {selected ? `${selected.code} — ${selected.name}` : "—"}
                                    </div>
                                ) : (
                                    <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                                            style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: form.parentId ? C.text : C.textDim, fontFamily: "'Outfit',sans-serif", cursor: "pointer" }}>
                                        <option value="">No parent (root account)</option>
                                        {active.filter(a => a.id !== selected?.id).map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                                    </select>
                                )}
                            </div>
                            {err && <p style={{ fontSize: 13, color: "#b07a7a", margin: 0, padding: "8px 12px", background: "#b07a7a18", borderRadius: 8, border: "1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={save} disabled={saving} style={{ background: "#7b9cba", border: "none", borderRadius: 9, padding: "9px 22px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Se salvează..." : modal === "create" ? "Creare cont" : "Salvează"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* DELETE MODAL */}
            {modal === "delete" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 400 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: `1px solid ${C.border}` }}>
                            <span style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Dezactivare cont</span>
                            <button onClick={close} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding: "20px 24px" }}>
                            <p style={{ fontSize: 14, color: C.textMid, lineHeight: 1.7, margin: 0 }}>
                                Dezactivezi <strong style={{ color: C.text }}>{selected?.code} — {selected?.name}</strong>?
                                Poate afecta rapoartele dacă există note contabile pe acest cont.
                            </p>
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${C.border}` }}>
                            <button onClick={close} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={del} disabled={saving} style={{ background: "#b07a7a", border: "none", borderRadius: 9, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
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
        input:focus,select:focus { outline:none; border-color:#7b9cba !important; }
        button:focus { outline:none; }
        .acc-row:hover { background:${C.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}!important; }
        .acc-row:hover .acc-actions { opacity:1!important; }
      `}</style>
        </div>
    );
}

// ── ALL view row — indented, shows type badge ──────────────────────────────────
function ClassAccRow({ acc, i, depth, isAnalytic, typeMeta, classMeta, C, onEdit, onDelete, onAnalytic }) {
    const indent = depth * 24; // 24px per level

    return (
        <tr className="acc-row" style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.12s", animation: `fadeUp 0.3s ease ${i * 15}ms both` }}>
            {/* CODE */}
            <td style={{ padding: "11px 20px", paddingLeft: 20 + indent }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isAnalytic && (
                        <span style={{ fontSize: 11, color: C.textDim, fontWeight: 300, marginRight: 2 }}>↳</span>
                    )}
                    <span style={{
                        fontSize: isAnalytic ? 11 : 12,
                        fontFamily: "monospace",
                        color: isAnalytic ? C.textMid : classMeta.color,
                        background: isAnalytic ? `${classMeta.color}0d` : classMeta.bg,
                        border: `1px solid ${classMeta.color}${isAnalytic ? "18" : "28"}`,
                        borderRadius: 6,
                        padding: isAnalytic ? "2px 7px" : "3px 9px",
                        fontWeight: isAnalytic ? 500 : 700,
                    }}>{acc.code}</span>
                </div>
            </td>
            {/* NAME */}
            <td style={{ padding: "11px 20px" }}>
                <span style={{
                    fontSize: isAnalytic ? 12 : 13,
                    fontWeight: isAnalytic ? 400 : 500,
                    color: isAnalytic ? C.textMid : C.text,
                }}>{acc.name}</span>
            </td>
            {/* TYPE BADGE */}
            <td style={{ padding: "11px 20px" }}>
                <span style={{
                    fontSize: 10,
                    color: typeMeta.color,
                    background: typeMeta.bg,
                    border: `1px solid ${typeMeta.color}30`,
                    borderRadius: 5,
                    padding: "2px 7px",
                    fontWeight: 500,
                    letterSpacing: "0.3px",
                }}>
                    {TYPE_META[acc.type]?.label ?? acc.type}
                </span>
            </td>
            {/* SUBTYPE */}
            <td style={{ padding: "11px 20px" }}>
                {acc.subType
                    ? <span style={{ fontSize: 11, color: C.textMid, background: C.border2, borderRadius: 5, padding: "2px 8px" }}>{acc.subType}</span>
                    : <span style={{ color: C.textDim, fontSize: 13 }}>—</span>}
            </td>
            {/* ACTIONS */}
            <td style={{ padding: "11px 20px", textAlign: "right" }}>
                <div className="acc-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end", opacity: 0, transition: "opacity 0.15s" }}>
                    {acc.subType === "Sintetic" && (
                        <button onClick={() => onAnalytic(acc)}
                                style={{ background: `${classMeta.color}12`, border: `1px solid ${classMeta.color}30`, borderRadius: 8, padding: "5px 10px", color: classMeta.color, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 300 }}>+</span> Analitic
                        </button>
                    )}
                    <button onClick={() => onEdit(acc)} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 8, padding: "5px 12px", color: C.textMid, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                        <EditIcon /> Editează
                    </button>
                    <button onClick={() => onDelete(acc)} style={{ background: "transparent", border: "1px solid #b07a7a30", borderRadius: 8, padding: "5px 10px", color: "#b07a7a", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <DeleteIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// ── TYPE FILTER view row (unchanged) ──────────────────────────────────────────
function AccRow({ acc, i, C, meta, onEdit, onDelete, onAnalytic }) {
    return (
        <tr className="acc-row" style={{ borderBottom: `1px solid ${C.border}`, transition: "background 0.12s", animation: `fadeUp 0.3s ease ${i * 20}ms both` }}>
            <td style={{ padding: "12px 20px" }}>
                <span style={{ fontSize: 12, fontFamily: "monospace", color: meta.color, background: meta.bg, border: `1px solid ${meta.color}25`, borderRadius: 6, padding: "3px 9px", fontWeight: 600 }}>{acc.code}</span>
            </td>
            <td style={{ padding: "12px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {acc.parentId && <span style={{ fontSize: 12, color: C.textDim }}>↳</span>}
                    <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{acc.name}</span>
                </div>
            </td>
            <td style={{ padding: "12px 20px" }}>
                {acc.subType
                    ? <span style={{ fontSize: 11, color: C.textMid, background: C.border2, borderRadius: 5, padding: "2px 8px" }}>{acc.subType}</span>
                    : <span style={{ color: C.textDim, fontSize: 13 }}>—</span>}
            </td>
            <td style={{ padding: "12px 20px" }}>
                <span style={{ fontSize: 12, color: C.textDim }}>{acc.parentName || "—"}</span>
            </td>
            <td style={{ padding: "12px 20px", textAlign: "right" }}>
                <div className="acc-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end", opacity: 0, transition: "opacity 0.15s" }}>
                    {acc.subType === "Sintetic" && (
                        <button onClick={() => onAnalytic(acc)}
                                style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}30`, borderRadius: 8, padding: "5px 10px", color: meta.color, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 14, lineHeight: 1, fontWeight: 300 }}>+</span> Analitic
                        </button>
                    )}
                    <button onClick={() => onEdit(acc)} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 8, padding: "5px 12px", color: C.textMid, fontSize: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", display: "flex", alignItems: "center", gap: 5 }}>
                        <EditIcon /> Editează
                    </button>
                    <button onClick={() => onDelete(acc)} style={{ background: "transparent", border: "1px solid #b07a7a30", borderRadius: 8, padding: "5px 10px", color: "#b07a7a", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <DeleteIcon />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function FInput({ label, val, set, ph, type = "text", C }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{label}</label>
            <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                   style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", transition: "border-color 0.2s", width: "100%" }} />
        </div>
    );
}

function Empty({ onAdd, C }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#7b9cba18", border: "1px solid #7b9cba25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="1" y="3" width="14" height="10" rx="2" stroke="#7b9cba" strokeWidth="1.3" /><path d="M1 7h14M5 7v6M5 3v4" stroke="#7b9cba" strokeWidth="1.3" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>Niciun cont găsit</p>
                <p style={{ fontSize: 13, color: C.textDim, marginTop: 6 }}>Construiește planul de conturi</p>
            </div>
            <button onClick={onAdd} style={{ background: "#7b9cba", border: "none", borderRadius: 10, padding: "9px 20px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+ Cont nou</button>
        </div>
    );
}

function Overlay({ children, onClose, C }) {
    return (
        <div style={{ position: "fixed", inset: 0, background: `rgba(0,0,0,${C.isDark ? 0.65 : 0.35})`, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", animation: "fadeIn 0.15s ease" }}
             onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            {children}
        </div>
    );
}

function Spin({ C }) { return <div style={{ width: 28, height: 28, border: `2px solid ${C.border2}`, borderTopColor: "#7b9cba", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />; }
function SearchIcon({ color }) { return <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="5" stroke={color} strokeWidth="1.5" /><path d="M10.5 10.5L14 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function EditIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M11 2l3 3-9 9H2v-3l9-9z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>; }
function DeleteIcon() { return <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V2h6v2M6 7v5M10 7v5M3 4l1 10h8l1-10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>; }