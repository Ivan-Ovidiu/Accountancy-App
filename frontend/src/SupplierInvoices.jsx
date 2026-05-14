import { useTheme } from "./App";
import { useState, useEffect,useRef } from "react";

const API_BASE = "http://localhost:8080";

const STATUS = {
    PENDING:    { label: "Neînregistrată", color: "#b09a6a", bg: "#b09a6a18" },
    REGISTERED: { label: "Înregistrată",   color: "#7b9cba", bg: "#7b9cba18" },
    PAID:       { label: "Achitată",       color: "#7aab8a", bg: "#7aab8a18" },
    OVERDUE:    { label: "Restantă",       color: "#b07a7a", bg: "#b07a7a18" },
    VOID:       { label: "Anulată",        color: "#6b7280", bg: "#6b728018" },
};

const HAS_JOURNAL = ["REGISTERED", "PAID", "OVERDUE"];

const FILTER_TABS = [
    ["ALL",        "Toate"],
    ["PENDING",    "Neînregistrate"],
    ["REGISTERED", "Înregistrate"],
    ["PAID",       "Achitate"],
    ["OVERDUE",    "Restante"],
];

function authHeaders() { return { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" }; }
function fmt(n)        { return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0); }
function fmtDate(s)    { return s ? new Date(s).toLocaleDateString("ro-RO", { month: "short", day: "numeric", year: "numeric" }) : "—"; }
function today()       { return new Date().toISOString().split("T")[0]; }
function plusDays(n)   { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }

const EMPTY_FORM = { supplierId: "", expenseAccountId: "", taxRateId: "", customRate: "", invoiceNumber: "", issueDate: today(), dueDate: plusDays(30), subtotal: "", notes: "" };

export default function SupplierInvoices() {
    const T = useTheme();
    const C = T ?? { text: "#d4d8e0", textMid: "#6b7280", textDim: "#374151", bg: "#0f1117", card: "#141820", border: "#1e2330", border2: "#252d3a", blue: "#7b9cba", green: "#7aab8a", red: "#b07a7a", isDark: true };

    const [invoices, setInvoices]       = useState([]);
    const [suppliers, setSuppliers]     = useState([]);
    const [expAccounts, setExpAccounts] = useState([]);
    const [taxRates, setTaxRates]       = useState([]);
    const [loading, setLoading]         = useState(true);
    const [filter, setFilter]           = useState("ALL");
    const [modal, setModal]             = useState(null);
    const [selected, setSelected]       = useState(null);
    const [activeTab, setActiveTab]     = useState("invoice");
    const [journalReg, setJournalReg]   = useState(null);
    const [journalLoading, setJLoad]    = useState(false);
    const [form, setForm]               = useState(EMPTY_FORM);
    const [err, setErr]                 = useState("");
    const [accSearch, setAccSearch] = useState("");

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/supplier-invoices`, { headers: authHeaders() })
            .then(r => r.json()).then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        load();
        fetch(`${API_BASE}/api/suppliers`,             { headers: authHeaders() }).then(r => r.json()).then(d => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
        fetch(`${API_BASE}/api/accounts`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => {
                const all = Array.isArray(d) ? d : [];
                // Clase 2-7: coduri care încep cu 2,3,4,5,6,7
                setExpAccounts(all.filter(a => /^[234567]/.test(String(a.code))));
            })
            .catch(() => {});
        fetch(`${API_BASE}/api/tax-rates`,             { headers: authHeaders() }).then(r => r.json()).then(d => setTaxRates(Array.isArray(d) ? d : [])).catch(() => {});
    }, []);

    const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);
    const counts   = { ALL: invoices.length, PENDING: 0, REGISTERED: 0, PAID: 0, OVERDUE: 0 };
    invoices.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

    const totalPending    = invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + (parseFloat(i.total) || 0), 0);
    const totalRegistered = invoices.filter(i => i.status === "REGISTERED" || i.status === "OVERDUE").reduce((s, i) => s + (parseFloat(i.total) || 0), 0);

    // ── TVA live calc
    const isCustomRate  = form.taxRateId === "custom";
    const taxRate       = isCustomRate ? null : taxRates.find(t => t.id === parseInt(form.taxRateId));
    const effectiveRate = isCustomRate ? (parseFloat(form.customRate) || 0) : (taxRate?.rate || 0);
    const subtotalN     = parseFloat(form.subtotal) || 0;
    const vatAmount     = subtotalN * (effectiveRate / 100);
    const totalN        = subtotalN + vatAmount;

    const openCreate = () => {
        const defaultTax = taxRates.find(t => t.isDefault) || taxRates.find(t => t.rate === 21) || taxRates[0];
        setForm({ ...EMPTY_FORM, taxRateId: defaultTax?.id || "" });
        setErr(""); setModal("create");
    };
    const openView   = inv => { setSelected(inv); setActiveTab("invoice"); setJournalReg(null); setModal("view"); };
    const close      = ()  => { setModal(null); setSelected(null); setErr(""); setJournalReg(null); setActiveTab("invoice"); };

    const loadJournal = async (inv) => {
        setJLoad(true);
        try {
            const refReg = `SINV-${inv.id}-${inv.issueDate}`;
            const res = await fetch(`${API_BASE}/api/journal-entries/reference/${encodeURIComponent(refReg)}`, { headers: authHeaders() });
            if (res.ok) setJournalReg(await res.json());
        } catch {}
        setJLoad(false);
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        if (tab === "nota" && selected && !journalReg) loadJournal(selected);
    };

    const save = async () => {
        if (!form.supplierId)       { setErr("Selectează un furnizor."); return; }
        if (!form.expenseAccountId) { setErr("Selectează un cont de cheltuială."); return; }
        if (!form.invoiceNumber)    { setErr("Numărul facturii este obligatoriu."); return; }
        if (!form.subtotal || parseFloat(form.subtotal) <= 0) { setErr("Introdu o sumă validă."); return; }
        if (isCustomRate && (!form.customRate || parseFloat(form.customRate) < 0)) { setErr("Introdu o cotă TVA validă."); return; }

        setSaving(true); setErr("");
        try {
            let taxRateId = form.taxRateId ? parseInt(form.taxRateId) : null;

            if (isCustomRate) {
                const rateVal = parseFloat(form.customRate);
                const existing = taxRates.find(t => Math.abs(t.rate - rateVal) < 0.001);
                if (existing) {
                    taxRateId = existing.id;
                } else {
                    const cRes = await fetch(`${API_BASE}/api/tax-rates`, {
                        method: "POST", headers: authHeaders(),
                        body: JSON.stringify({ name: `Custom ${form.customRate}%`, rate: rateVal, type: "VAT", isDefault: false }),
                    });
                    if (!cRes.ok) { setErr("Eroare la crearea cotei personalizate."); setSaving(false); return; }
                    const newRate = await cRes.json();
                    taxRateId = newRate.id;
                    setTaxRates(prev => [...prev, newRate]);
                }
            }

            const body = {
                supplierId:       parseInt(form.supplierId),
                expenseAccountId: parseInt(form.expenseAccountId),
                taxRateId,
                invoiceNumber:    form.invoiceNumber,
                issueDate:        form.issueDate,
                dueDate:          form.dueDate,
                subtotal:         parseFloat(form.subtotal),
                notes:            form.notes || null,
            };

            const res = await fetch(`${API_BASE}/api/supplier-invoices`, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
            if (!res.ok) { const e = await res.json().catch(() => {}); setErr(e?.message || "Eroare la înregistrare."); setSaving(false); return; }
            close(); load();
        } catch { setErr("Eroare server."); }
        setSaving(false);
    };

    const action = async (id, endpoint) => {
        await fetch(`${API_BASE}/api/supplier-invoices/${id}/${endpoint}`, { method: "POST", headers: authHeaders() }).catch(() => {});
        load();
        if (selected?.id === id) {
            const updated = await fetch(`${API_BASE}/api/supplier-invoices/${id}`, { headers: authHeaders() }).then(r => r.json()).catch(() => null);
            if (updated) {
                setSelected(updated);
                if (activeTab === "nota") { setJournalReg(null); loadJournal(updated); }
            }
        }
    };

    // ── Delete factură furnizor
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting]       = useState(false);

    const confirmDelete = async () => {
        if (!selected) return;
        const id = selected.id;
        setDeleting(true);
        await fetch(`${API_BASE}/api/supplier-invoices/${id}`, {
            method: "DELETE", headers: authHeaders(),
        }).catch(() => {});
        setDeleting(false);
        setShowConfirm(false);
        close();
        load();
    };

    const [editModal, setEditModal] = useState(false);
    const [editForm, setEditForm]   = useState(null);
    const [saving, setSaving]       = useState(false);
    const [editErr, setEditErr]     = useState("");

    const openEdit = () => {
        if (!selected) return;
        setEditForm({
            supplierId:       String(selected.supplierId),
            expenseAccountId: String(selected.expenseAccountId),
            taxRateId:        selected.taxRateId ? String(selected.taxRateId) : "",
            invoiceNumber:    selected.invoiceNumber,
            issueDate:        selected.issueDate,
            dueDate:          selected.dueDate,
            subtotal:         String(selected.subtotal),
            notes:            selected.notes || "",
        });
        setEditErr("");
        setEditModal(true);
    };

    const saveEdit = async () => {
        if (!selected || !editForm) return;
        if (!editForm.supplierId)       { setEditErr("Selectează un furnizor."); return; }
        if (!editForm.expenseAccountId) { setEditErr("Selectează un cont de cheltuială."); return; }
        if (!editForm.invoiceNumber)    { setEditErr("Numărul facturii este obligatoriu."); return; }
        if (!editForm.subtotal || parseFloat(editForm.subtotal) <= 0) { setEditErr("Introdu o sumă validă."); return; }
        setSaving(true); setEditErr("");
        try {
            const body = {
                supplierId:       parseInt(editForm.supplierId),
                expenseAccountId: parseInt(editForm.expenseAccountId),
                taxRateId:        editForm.taxRateId ? parseInt(editForm.taxRateId) : null,
                invoiceNumber:    editForm.invoiceNumber,
                issueDate:        editForm.issueDate,
                dueDate:          editForm.dueDate,
                subtotal:         parseFloat(editForm.subtotal),
                notes:            editForm.notes || null,
            };
            const res = await fetch(`${API_BASE}/api/supplier-invoices/${selected.id}`, {
                method: "PUT", headers: authHeaders(), body: JSON.stringify(body),
            });
            if (!res.ok) { const e = await res.json().catch(() => {}); setEditErr(e?.message || "Eroare la salvare."); setSaving(false); return; }
            const updated = await res.json();
            setSelected(updated);
            setEditModal(false);
            load();
        } catch { setEditErr("Eroare server."); }
        setSaving(false);
    };

    return (
        <div style={{ padding: "36px 40px", fontFamily: "'Outfit',sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}>

            {/* HEADER */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: 7, background: "#b07a7a", border: "none", borderRadius: 10, padding: "9px 18px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                    <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span> Înregistrează Factură
                </button>
            </div>

            {/* SUMMARY CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12, marginBottom: 24 }}>
                <SCard label="Neînregistrate" value={`RON ${fmt(totalPending)}`} C={C} color="#b09a6a" />
                <SCard label="Neachitate (înregistrate)" value={`RON ${fmt(totalRegistered)}`} C={C} color="#7b9cba" />
            </div>

            {/* FILTER TABS */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                {FILTER_TABS.map(([key, label]) => {
                    const s = STATUS[key];
                    const active = filter === key;
                    return (
                        <button key={key} onClick={() => setFilter(key)} style={{
                            border: `1px solid ${active ? (s?.color || C.border2) : C.border}`,
                            borderRadius: 8, padding: "6px 14px", fontSize: 12,
                            fontWeight: active ? 600 : 400, cursor: "pointer",
                            fontFamily: "'Outfit',sans-serif",
                            background: active ? (s?.bg || C.border) : C.card,
                            color: active ? (s?.color || C.text) : C.textMid,
                            transition: "all 0.15s",
                        }}>
                            {label} <span style={{ opacity: 0.6 }}>({counts[key] ?? invoices.length})</span>
                        </button>
                    );
                })}
            </div>

            {/* TABLE */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><Spin C={C} /></div>
            ) : filtered.length === 0 ? (
                <Empty onAdd={openCreate} C={C} />
            ) : (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {["Nr. Factură", "Furnizor", "Cont Cheltuială", "Dată", "Scadență", "Total", "Status", ""].map((h, i) => (
                                <th key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 600, padding: "12px 20px", textAlign: i === 7 ? "right" : "left" }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((inv, i) => (
                            <tr key={inv.id} className="sinv-row" onClick={() => openView(inv)}
                                style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.12s", animation: `fadeUp 0.3s ease ${i * 25}ms both` }}>
                                <td style={{ padding: "14px 20px" }}>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{inv.invoiceNumber}</span>
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text, margin: 0 }}>{inv.supplierName}</p>
                                    {inv.supplierTaxId && <p style={{ fontSize: 11, color: C.textDim, margin: "2px 0 0" }}>{inv.supplierTaxId}</p>}
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#b07a7a", background: "#b07a7a12", border: "1px solid #b07a7a25", borderRadius: 6, padding: "2px 7px" }}>{inv.expenseAccountCode}</span>
                                    <span style={{ fontSize: 12, color: C.textDim, marginLeft: 6 }}>{inv.expenseAccountName}</span>
                                </td>
                                <td style={{ padding: "14px 20px", fontSize: 13, color: C.textMid }}>{fmtDate(inv.issueDate)}</td>
                                <td style={{ padding: "14px 20px" }}>
                                    <span style={{ fontSize: 13, color: inv.status === "REGISTERED" && new Date(inv.dueDate) < new Date() ? "#b07a7a" : C.textMid }}>{fmtDate(inv.dueDate)}</span>
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>RON {fmt(inv.total)}</span>
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <StatusBadge status={inv.status} />
                                </td>
                                <td style={{ padding: "14px 20px", textAlign: "right" }}>
                                    <div className="sinv-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end", opacity: 0, transition: "opacity 0.15s" }} onClick={e => e.stopPropagation()}>
                                        {inv.status === "PENDING" && (
                                            <QuickBtn label="Înregistrează" color="#7b9cba" onClick={() => action(inv.id, "register")} />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ══ CREATE MODAL ══ */}
            {modal === "create" && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 2 }}>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>Factură Furnizor Nouă</h2>
                                <p style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
                                    Se creează ca <strong style={{ color: STATUS.PENDING.color }}>Neînregistrată</strong> — înregistrează pentru a posta în contabilitate
                                </p>
                            </div>
                            <button onClick={close} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <Sel label="Furnizor *" val={form.supplierId} set={v => setForm(f => ({ ...f, supplierId: v }))} C={C}>
                                    <option value="">Selectează furnizor...</option>
                                    {suppliers.filter(s => s.isActive !== false).map(s => (
                                        <option key={s.id} value={s.id}>{s.name}{s.taxId ? ` (${s.taxId})` : ""}</option>
                                    ))}
                                </Sel>
                                <FInput label="Nr. Factură *" val={form.invoiceNumber} set={v => setForm(f => ({ ...f, invoiceNumber: v }))} ph="FA-2026-001" C={C} />
                            </div>

                            <SearchableSel
                                label="Cont (clasele 2–7) *"
                                val={form.expenseAccountId}
                                set={v => setForm(f => ({ ...f, expenseAccountId: v }))}
                                options={expAccounts}
                                search={accSearch}
                                setSearch={setAccSearch}
                                C={C}
                            />

                            {/* TVA cu optiune custom */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Cotă TVA</label>
                                <select value={form.taxRateId} onChange={e => setForm(f => ({ ...f, taxRateId: e.target.value, customRate: "" }))}
                                        style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: form.taxRateId ? C.text : C.textDim, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                    <option value="">Fără TVA</option>
                                    {taxRates.filter(t => t.isActive !== false && !t.name?.startsWith("Custom ")).map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>
                                    ))}
                                    <option value="custom">✏ Cotă personalizată...</option>
                                </select>
                                {isCustomRate && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                        <input type="number" min="0" max="100" step="0.1"
                                               value={form.customRate} onChange={e => setForm(f => ({ ...f, customRate: e.target.value }))}
                                               placeholder="Ex: 21" style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", flex: 1 }} />
                                        <span style={{ fontSize: 13, color: C.textMid }}>%</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <FInput label="Subtotal (fără TVA) *" val={form.subtotal} set={v => setForm(f => ({ ...f, subtotal: v }))} type="number" ph="0.00" C={C} />
                                <FInput label="Data facturii *" val={form.issueDate} set={v => setForm(f => ({ ...f, issueDate: v }))} type="date" C={C} />
                                <FInput label="Scadență *" val={form.dueDate} set={v => setForm(f => ({ ...f, dueDate: v }))} type="date" C={C} />
                            </div>

                            {form.subtotal && (
                                <div style={{ background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                    <TRow label="Subtotal" val={`RON ${fmt(subtotalN)}`} C={C} />
                                    <TRow label={`TVA (${effectiveRate}%)`} val={`RON ${fmt(vatAmount)}`} C={C} />
                                    <TRow label="Total factură" val={`RON ${fmt(totalN)}`} C={C} bold />
                                </div>
                            )}

                            <div style={{ background: C.isDark ? "rgba(123,156,186,0.06)" : "rgba(123,156,186,0.08)", border: "1px solid #7b9cba25", borderRadius: 10, padding: "10px 14px" }}>
                                <p style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px", fontWeight: 600 }}>Formula contabilă (la înregistrare)</p>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "#7b9cba", background: "#7b9cba12", border: "1px solid #7b9cba25", borderRadius: 6, padding: "3px 8px" }}>
                                        {form.expenseAccountId ? (expAccounts.find(a => a.id === parseInt(form.expenseAccountId))?.code || "6xx") : "6xx"}
                                    </span>
                                    {(form.taxRateId && form.taxRateId !== "custom") || (isCustomRate && form.customRate) ? (
                                        <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "#7b9cba", background: "#7b9cba12", border: "1px solid #7b9cba25", borderRadius: 6, padding: "3px 8px" }}>4426</span>
                                    ) : null}
                                    <span style={{ fontSize: 16, color: C.textDim }}>= </span>
                                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "#7aab8a", background: "#7aab8a12", border: "1px solid #7aab8a25", borderRadius: 6, padding: "3px 8px" }}>401</span>
                                </div>
                            </div>

                            <FInput label="Observații" val={form.notes} set={v => setForm(f => ({ ...f, notes: v }))} ph="Note opționale..." C={C} />

                            {err && <p style={{ fontSize: 13, color: "#b07a7a", margin: 0, padding: "8px 12px", background: "#b07a7a18", borderRadius: 8, border: "1px solid #b07a7a30" }}>⚠ {err}</p>}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0, background: C.card }}>
                            <button onClick={close} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={save} disabled={saving} style={{ background: "#b07a7a", border: "none", borderRadius: 9, padding: "9px 22px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Se salvează..." : "Salvează Factura"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ══ VIEW MODAL ══ */}
            {modal === "view" && selected && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 580, maxHeight: "90vh", overflowY: "auto" }}>

                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 24px 18px", borderBottom: `1px solid ${C.border}` }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>{selected.invoiceNumber}</h2>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <p style={{ fontSize: 13, color: C.textMid, margin: 0 }}>{selected.supplierName} {selected.supplierTaxId && `· ${selected.supplierTaxId}`}</p>
                            </div>
                            <button onClick={close} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>

                        {/* TABS */}
                        <div style={{ display: "flex", borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
                            <TabBtn label="Factură" active={activeTab === "invoice"} onClick={() => switchTab("invoice")} C={C} />
                            {HAS_JOURNAL.includes(selected.status) && (
                                <TabBtn label="Notă Contabilă" active={activeTab === "nota"} onClick={() => switchTab("nota")} C={C} accent />
                            )}
                        </div>

                        {/* TAB: FACTURA */}
                        {activeTab === "invoice" && (
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                                    <IBlock label="Data facturii" val={fmtDate(selected.issueDate)} C={C} />
                                    <IBlock label="Scadență"      val={fmtDate(selected.dueDate)}   C={C} />
                                    <IBlock label="TVA"           val={selected.taxRateName ? `${selected.taxRateName} (${selected.taxRate}%)` : "Fără TVA"} C={C} />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <IBlock label="Cont cheltuială" val={`${selected.expenseAccountCode} — ${selected.expenseAccountName}`} C={C} />
                                    <IBlock label="Furnizor"        val={selected.supplierName} C={C} />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                                    <TRow label="Subtotal (fără TVA)" val={`RON ${fmt(selected.subtotal)}`} C={C} />
                                    <TRow label={`TVA (${selected.taxRate || 0}%)`} val={`RON ${fmt(selected.vatAmount)}`} C={C} />
                                    <TRow label="Total factură" val={`RON ${fmt(selected.total)}`} C={C} bold />
                                </div>

                                {selected.notes && (
                                    <div style={{ background: C.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderRadius: 10, padding: "12px 14px", border: `1px solid ${C.border}` }}>
                                        <p style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.6px", margin: "0 0 6px" }}>Note</p>
                                        <p style={{ fontSize: 13, color: C.textMid, margin: 0 }}>{selected.notes}</p>
                                    </div>
                                )}

                                {/* ACTIUNI */}
                                <div style={{ display: "flex", gap: 8, paddingTop: 4, flexWrap: "wrap" }}>

                                    {/* PENDING → REGISTERED + EDIT */}
                                    {selected.status === "PENDING" && (
                                        <>
                                            <button onClick={() => action(selected.id, "register")}
                                                    style={{ background: "#7b9cba", border: "none", borderRadius: 9, padding: "9px 18px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                                ✓ Înregistrează în contabilitate
                                            </button>
                                            <button onClick={openEdit}
                                                    style={{ background: C.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 16px", color: C.textMid, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                                ✎ Editează
                                            </button>
                                        </>
                                    )}

                                    {selected.status === "PENDING" && (
                                        <div style={{ flex: 1, minWidth: 200, background: "#b09a6a10", border: "1px solid #b09a6a25", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#b09a6a" }}>⚠</span>
                                            <p style={{ fontSize: 12, color: "#b09a6a", margin: 0 }}>Factură neînregistrată — nu apare în rapoarte.</p>
                                        </div>
                                    )}

                                    {/* Banner REGISTERED/OVERDUE */}
                                    {(selected.status === "REGISTERED" || selected.status === "OVERDUE") && (
                                        <div style={{ flex: 1, background: "#7b9cba10", border: "1px solid #7b9cba25", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#7b9cba" }}>ℹ</span>
                                            <p style={{ fontSize: 12, color: "#7b9cba", margin: 0 }}>Înregistrată contabil. Plata se înregistrează din modulul <strong>Bancă</strong>.</p>
                                        </div>
                                    )}

                                    {/* Banner PAID */}
                                    {selected.status === "PAID" && (
                                        <div style={{ flex: 1, background: "#7aab8a10", border: "1px solid #7aab8a25", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#7aab8a" }}>✓</span>
                                            <p style={{ fontSize: 12, color: "#7aab8a", margin: 0 }}>Factură achitată integral.</p>
                                        </div>
                                    )}

                                    {/* Banner VOID */}
                                    {selected.status === "VOID" && (
                                        <div style={{ flex: 1, background: "#4b556318", border: "1px solid #4b556330", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#6b7280" }}>⊘</span>
                                            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Factură anulată.</p>
                                        </div>
                                    )}


                                    {/* Buton sterge — nu apare pentru PAID */}
                                    {selected.status !== "PAID" && (
                                        <div style={{ width: "100%", borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 4, display: "flex", justifyContent: "flex-end" }}>
                                            <button onClick={() => setShowConfirm(true)} style={{
                                                background: "#b07a7a0d", border: "1px solid #b07a7a30",
                                                borderRadius: 9, padding: "8px 16px", color: "#b07a7a",
                                                fontSize: 12, fontWeight: 500, cursor: "pointer",
                                                fontFamily: "'Outfit',sans-serif",
                                            }}>
                                                Sterge factura
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* CONFIRM DELETE */}
                        {showConfirm && (
                            <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                                <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, padding: "32px", maxWidth: 380, width: "calc(100% - 48px)" }}>
                                    <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>Stergi factura?</h3>
                                    <p style={{ fontSize: 13, color: C.textMid, margin: "0 0 6px" }}><strong>{selected?.invoiceNumber}</strong> — {selected?.supplierName}</p>
                                    <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 24px", lineHeight: 1.6 }}>Aceasta actiune este ireversibila si va sterge factura impreuna cu nota contabila asociata.</p>
                                    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                                        <button onClick={() => setShowConfirm(false)} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Anuleaza</button>
                                        <button onClick={confirmDelete} disabled={deleting} style={{ background: "#b07a7a", border: "none", borderRadius: 9, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: deleting ? 0.7 : 1 }}>
                                            {deleting ? "Se sterge..." : "Da, sterge"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB: NOTA CONTABILA */}
                        {activeTab === "nota" && (
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                                {journalLoading ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin C={C} /></div>
                                ) : !journalReg ? (
                                    <p style={{ fontSize: 13, color: C.textDim, padding: "12px 0" }}>Nota contabilă nu a putut fi încărcată.</p>
                                ) : (
                                    <JournalTable entry={journalReg} C={C} fmt={fmt} fmtDate={fmtDate} />
                                )}


                            </div>
                        )}
                    </div>
                </Overlay>
            )}

            {/* EDIT MODAL */}
            {editModal && editForm && (
                <Overlay onClose={() => setEditModal(false)} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 2 }}>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>Editează factura</h2>
                                <p style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>{selected?.invoiceNumber} — doar facturile neînregistrate pot fi editate</p>
                            </div>
                            <button onClick={() => setEditModal(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Furnizor *</label>
                                    <select value={editForm.supplierId} onChange={e => setEditForm(f => ({ ...f, supplierId: e.target.value }))}
                                            style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                        {suppliers.filter(s => s.isActive !== false).map(s => <option key={s.id} value={s.id}>{s.name}{s.taxId ? ` (${s.taxId})` : ""}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Nr. Factură *</label>
                                    <input value={editForm.invoiceNumber} onChange={e => setEditForm(f => ({ ...f, invoiceNumber: e.target.value }))} placeholder="FA-2026-001" style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Cont Cheltuială (6xx) *</label>
                                <select value={editForm.expenseAccountId} onChange={e => setEditForm(f => ({ ...f, expenseAccountId: e.target.value }))}
                                        style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                    {expAccounts.filter(a => a.subType === "Sintetic" || a.subType === "Analitic").map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                                </select>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Cotă TVA</label>
                                <select value={editForm.taxRateId} onChange={e => setEditForm(f => ({ ...f, taxRateId: e.target.value }))}
                                        style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                    <option value="">Fără TVA</option>
                                    {taxRates.filter(t => t.isActive !== false && !t.name?.startsWith("Custom ")).map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                </select>
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Subtotal (fără TVA) *</label>
                                    <input type="number" value={editForm.subtotal} onChange={e => setEditForm(f => ({ ...f, subtotal: e.target.value }))} placeholder="0.00" style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Data facturii *</label>
                                    <input type="date" value={editForm.issueDate} onChange={e => setEditForm(f => ({ ...f, issueDate: e.target.value }))} style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Scadență *</label>
                                    <input type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Observații</label>
                                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Note opționale..." style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", resize: "none" }} />
                            </div>
                            {editErr && <p style={{ fontSize: 13, color: "#b07a7a", margin: 0, padding: "8px 12px", background: "#b07a7a18", borderRadius: 8, border: "1px solid #b07a7a30" }}>⚠ {editErr}</p>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0, background: C.card }}>
                            <button onClick={() => setEditModal(false)} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={saveEdit} disabled={saving} style={{ background: "#b07a7a", border: "none", borderRadius: 9, padding: "9px 22px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Se salvează..." : "Salvează modificările"}
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
                input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark ? "invert(1)" : "none"}; opacity:0.5; }
                input::placeholder { color:${C.textDim}; }
                input:focus,select:focus { outline:none; border-color:#b07a7a !important; }
                button:focus { outline:none; }
                .sinv-row:hover { background:${C.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}!important; }
                .sinv-row:hover .sinv-actions { opacity:1!important; }
            `}</style>
        </div>
    );
}

function JournalTable({ entry, C, fmt, fmtDate }) {
    const totalDebit  = entry.lines?.reduce((s, l) => s + (l.debitAmount || 0), 0) ?? 0;
    const totalCredit = entry.lines?.reduce((s, l) => s + (l.creditAmount || 0), 0) ?? 0;
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <IBlock label="Referință" val={entry.referenceNumber} C={C} />
                <IBlock label="Data" val={fmtDate(entry.entryDate)} C={C} />
            </div>
            <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                    <tr style={{ background: C.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderBottom: `1px solid ${C.border}` }}>
                        {["Tip", "Cont", "Denumire", "Sumă (RON)"].map((h, i) => (
                            <th key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, padding: "8px 14px", textAlign: i === 3 ? "right" : "left" }}>{h}</th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {entry.lines?.map((line, i) => {
                        const isDebit = (line.debitAmount || 0) > 0;
                        const amount  = isDebit ? line.debitAmount : line.creditAmount;
                        const color   = isDebit ? "#7b9cba" : "#7aab8a";
                        return (
                            <tr key={i} style={{ borderBottom: i < entry.lines.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                <td style={{ padding: "10px 14px" }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 5, padding: "2px 7px" }}>{isDebit ? "Debit" : "Credit"}</span>
                                </td>
                                <td style={{ padding: "10px 14px" }}>
                                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color }}>{line.accountCode}</span>
                                </td>
                                <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>{line.accountName}</td>
                                <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 13, fontWeight: 600, color: C.text }}>{fmt(amount)}</td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isBalanced ? (C.isDark ? "#7aab8a10" : "#f0faf4") : "#b07a7a10", border: `1px solid ${isBalanced ? "#7aab8a30" : "#b07a7a30"}`, borderRadius: 8, padding: "8px 14px" }}>
                <span style={{ fontSize: 12, color: isBalanced ? "#7aab8a" : "#b07a7a", fontWeight: 600 }}>
                    {isBalanced ? "✓ Echilibrat" : "⚠ Dezechilibru"}
                </span>
                <div style={{ display: "flex", gap: 16 }}>
                    <span style={{ fontSize: 12, color: "#7b9cba" }}>D: RON {fmt(totalDebit)}</span>
                    <span style={{ fontSize: 12, color: "#7aab8a" }}>C: RON {fmt(totalCredit)}</span>
                </div>
            </div>
        </div>
    );
}

function TabBtn({ label, active, onClick, C, accent }) {
    const color = accent ? "#9b8fba" : C.blue;
    return <button onClick={onClick} style={{ background: "none", border: "none", borderBottom: active ? `2px solid ${color}` : "2px solid transparent", padding: "12px 16px", fontSize: 13, fontWeight: active ? 600 : 400, color: active ? color : C.textMid, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", marginBottom: -1 }}>{label}</button>;
}
function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.PENDING;
    return <span style={{ fontSize: 11, color: s.color, background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 6, padding: "3px 9px", fontWeight: 500 }}>{s.label}</span>;
}
function QuickBtn({ label, color, onClick }) {
    return <button onClick={onClick} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 7, padding: "5px 10px", color, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>{label}</button>;
}
function SCard({ label, value, C, color }) {
    return (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600, margin: "0 0 10px" }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: color || C.text, margin: 0, letterSpacing: "-0.5px" }}>{value}</p>
        </div>
    );
}
function TRow({ label, val, C, bold }) {
    return (
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.textMid }}>{label}</span>
            <span style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 400, color: bold ? C.text : C.textMid, minWidth: 120, textAlign: "right" }}>{val}</span>
        </div>
    );
}
function IBlock({ label, val, C }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{val}</span>
        </div>
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
function Sel({ label, val, set, C, children }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{label}</label>
            <select value={val} onChange={e => set(e.target.value)} style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: val ? C.text : C.textDim, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                {children}
            </select>
        </div>
    );
}
function Empty({ onAdd, C }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#b07a7a18", border: "1px solid #b07a7a25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="#b07a7a" strokeWidth="1.3" /><path d="M5 5h6M5 8h6M5 11h4" stroke="#b07a7a" strokeWidth="1.3" strokeLinecap="round" /></svg>
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>Nicio factură înregistrată</p>
                <p style={{ fontSize: 13, color: C.textDim, marginTop: 6 }}>Înregistrează prima factură primită de la furnizori</p>
            </div>
            <button onClick={onAdd} style={{ background: "#b07a7a", border: "none", borderRadius: 10, padding: "9px 20px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+ Înregistrează Factură</button>
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
function Spin({ C }) { return <div style={{ width: 28, height: 28, border: `2px solid ${C.border2}`, borderTopColor: "#b07a7a", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />; }

function SearchableSel({ label, val, set, options, search, setSearch, C }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const filtered = options.filter(a =>
        !search ||
        String(a.code).includes(search) ||
        a.name.toLowerCase().includes(search.toLowerCase())
    );
    const selected = options.find(a => a.id === parseInt(val));

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, position: "relative" }}>
            <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{label}</label>
            <div onClick={() => setOpen(o => !o)}
                 style={{ background: C.bg, border: `1px solid ${open ? "#b07a7a" : C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: val ? C.text : C.textDim, fontFamily: "'Outfit',sans-serif", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? `${selected.code} — ${selected.name}` : "Selectează contul..."}
        </span>
                <span style={{ fontSize: 10, color: C.textDim, marginLeft: 8 }}>{open ? "▲" : "▼"}</span>
            </div>

            {open && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 99, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.25)", overflow: "hidden" }}>
                    <div style={{ padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Caută după cod sau denumire..."
                            onClick={e => e.stopPropagation()}
                            style={{ width: "100%", background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.text, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        {filtered.length === 0 ? (
                            <p style={{ fontSize: 12, color: C.textDim, padding: "12px 14px", margin: 0 }}>Niciun cont găsit.</p>
                        ) : filtered.map(a => (
                            <div key={a.id}
                                 onClick={() => { set(String(a.id)); setSearch(""); setOpen(false); }}
                                 style={{ padding: "9px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: val === String(a.id) ? "#b07a7a18" : "transparent", transition: "background 0.1s" }}
                                 onMouseEnter={e => e.currentTarget.style.background = "#b07a7a12"}
                                 onMouseLeave={e => e.currentTarget.style.background = val === String(a.id) ? "#b07a7a18" : "transparent"}>
                                <span style={{ fontSize: 12, fontFamily: "monospace", fontWeight: 700, color: "#b07a7a", background: "#b07a7a12", border: "1px solid #b07a7a25", borderRadius: 5, padding: "2px 7px", flexShrink: 0 }}>{a.code}</span>
                                <span style={{ fontSize: 13, color: C.text }}>{a.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}