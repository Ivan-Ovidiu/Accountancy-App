import { useTheme } from "./App";
import { useState, useEffect, useRef } from "react";
const API_BASE = "http://localhost:8080";

// ── Status map — aliniat cu enum-ul backend: ISSUED, VALIDATED, PAID, OVERDUE, VOID
const STATUS = {
    ISSUED:    { label: "Nevalidată",  color: "#b09a6a", bg: "#b09a6a18" },
    VALIDATED: { label: "Validată",    color: "#7b9cba", bg: "#7b9cba18" },
    PAID:      { label: "Încasată",    color: "#7aab8a", bg: "#7aab8a18" },
    OVERDUE:   { label: "Restantă",    color: "#b07a7a", bg: "#b07a7a18" },
    VOID:      { label: "Anulată",     color: "#4b5563", bg: "#4b556318" },
};

// Statusuri care au journal entry postat (apar în nota contabilă)
const HAS_JOURNAL = ["VALIDATED", "PAID", "OVERDUE"];

function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" };
}
function fmt(n)     { return new Intl.NumberFormat("ro-RO", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0); }
function fmtDate(s) { return s ? new Date(s).toLocaleDateString("ro-RO", { month: "short", day: "numeric", year: "numeric" }) : "—"; }
function today()    { return new Date().toISOString().split("T")[0]; }
function plusDays(n){ const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split("T")[0]; }

const EMPTY_ITEM = { description: "", quantity: "1", unitPrice: "", accountId: null };
const EMPTY_FORM = { clientId: "", taxRateId: "", issueDate: today(), dueDate: plusDays(30), notes: "", items: [{ ...EMPTY_ITEM }] };

export default function Invoices() {
    const T = useTheme();
    const C = T ?? {
        text: "#d4d8e0", textMid: "#6b7280", textDim: "#374151",
        bg: "#0f1117", card: "#141820", cardAlt: "#0f1117",
        border: "#1e2330", border2: "#252d3a",
        blue: "#7b9cba", green: "#7aab8a", red: "#b07a7a", accent: "#a78bfa",
        isDark: true,
    };

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
    const [customRate, setCustomRate]   = useState("");
    const [err, setErr]                 = useState("");
    const [accSearch, setAccSearch]         = useState("");
    const [editAccSearch, setEditAccSearch] = useState("");

    const load = () => {
        setLoading(true);
        fetch(`${API_BASE}/api/invoices`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => { setInvoices(Array.isArray(d) ? d : []); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        load();
        fetch(`${API_BASE}/api/clients`,              { headers: authHeaders() }).then(r => r.json()).then(d => setClients(Array.isArray(d) ? d : [])).catch(() => {});
        fetch(`${API_BASE}/api/tax-rates`,            { headers: authHeaders() }).then(r => r.json()).then(d => setTaxRates(Array.isArray(d) ? d : [])).catch(() => {});
        fetch(`${API_BASE}/api/accounts`, { headers: authHeaders() })
            .then(r => r.json())
            .then(d => {
                const all = Array.isArray(d) ? d : [];
                setRevAccs(all.filter(a => /^[234567]/.test(String(a.code))));
            }).catch(() => {});
        }, []);
    // ── Journal entry loader (doar pentru facturi validate)
    const loadJournal = async (inv) => {
        if (!HAS_JOURNAL.includes(inv.status)) return;
        setJLoad(true);
        try {
            const res = await fetch(
                `${API_BASE}/api/journal-entries/reference/${encodeURIComponent("JE-" + inv.invoiceNumber)}`,
                { headers: authHeaders() }
            );
            setJournal(res.ok ? await res.json() : null);
        } catch { setJournal(null); }
        setJLoad(false);
    };

    // ── Filtrare tabel
    const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);

    // ── Contoare pentru tab-urile de filtru
    const counts = { ALL: invoices.length, ISSUED: 0, VALIDATED: 0, PAID: 0, OVERDUE: 0 };
    invoices.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++; });

    // ── Modal helpers
    const openCreate = () => {
        // Prioritate: rata marcată default → rata de 19% → prima din listă
        const defaultTax = taxRates.find(t => t.isDefault) || taxRates.find(t => t.rate === 19) || taxRates[0];
        setForm({ ...EMPTY_FORM, taxRateId: defaultTax?.id || "", items: [{ ...EMPTY_ITEM }] });
        setCustomRate(""); setErr(""); setModal("create");
    };

    const openView = inv => {
        setSelected(inv); setActiveTab("invoice");
        setJournal(null); setModal("view");
    };

    const close = () => {
        setModal(null); setSelected(null);
        setErr(""); setJournal(null); setActiveTab("invoice");
    };

    const switchTab = (tab) => {
        setActiveTab(tab);
        if (tab === "nota" && selected && !journalEntry) loadJournal(selected);
    };

    // ── Item helpers
    const setItem = (i, field, val) => setForm(f => {
        const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items };
    });
    const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
    const delItem = i  => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));

    // ── Totaluri live
    const isCustomRate  = form.taxRateId === "custom";
    const subtotal      = form.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
    const taxRate       = isCustomRate ? null : taxRates.find(t => t.id === parseInt(form.taxRateId));
    const effectiveRate = isCustomRate ? (parseFloat(customRate) || 0) : (taxRate?.rate || 0);
    const taxAmt        = subtotal * (effectiveRate / 100);
    const total         = subtotal + taxAmt;

    // ── Salvare factură nouă
    const save = async () => {
        if (!form.clientId)  { setErr("Selectează un client."); return; }
        if (!form.taxRateId) { setErr("Selectează o cotă TVA."); return; }
        if (isCustomRate && (!customRate || parseFloat(customRate) < 0)) { setErr("Introdu o cotă TVA validă (0 sau mai mare)."); return; }
        if (form.items.some(it => !it.description || !it.unitPrice)) { setErr("Toate liniile trebuie să aibă descriere și preț."); return; }

        setSaving(true); setErr("");
        try {
            let taxRateId = parseInt(form.taxRateId);

            if (isCustomRate) {
                const rateVal = parseFloat(customRate);
                // Cauta daca exista deja o rata cu acelasi procent — nu crea duplicat
                const existing = taxRates.find(t => Math.abs(t.rate - rateVal) < 0.001);
                if (existing) {
                    taxRateId = existing.id;
                } else {
                    const cRes = await fetch(`${API_BASE}/api/tax-rates`, {
                        method: "POST", headers: authHeaders(),
                        body: JSON.stringify({ name: `Custom ${customRate}%`, rate: rateVal, type: "VAT", isDefault: false }),
                    });
                    if (!cRes.ok) { setErr("Eroare la crearea cotei personalizate."); setSaving(false); return; }
                    const newRate = await cRes.json();
                    taxRateId = newRate.id;
                    // Adauga in lista locala ca sa apara in dropdown si sa evite duplicate la urmatoarea factура
                    setTaxRates(prev => [...prev, newRate]);
                }
            }

            const body = {
                clientId:  parseInt(form.clientId),
                taxRateId,
                issueDate: form.issueDate,
                dueDate:   form.dueDate,
                notes:     form.notes || null,
                items: form.items.map(it => ({
                    description: it.description,
                    quantity:    parseFloat(it.quantity) || 1,
                    unitPrice:   parseFloat(it.unitPrice) || 0,
                    accountId:   it.accountId || null,
                })),
            };

            const res = await fetch(`${API_BASE}/api/invoices`, {
                method: "POST", headers: authHeaders(), body: JSON.stringify(body),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => {});
                setErr(e?.message || "Eroare la crearea facturii.");
                setSaving(false); return;
            }
            close(); load();
        } catch { setErr("Eroare server."); }
        setSaving(false);
    };

    // ── Acțiuni pe factură (validate / pay / void / check-overdue)
    const action = async (id, endpoint) => {
        await fetch(`${API_BASE}/api/invoices/${id}/${endpoint}`, {
            method: "POST", headers: authHeaders(),
        }).catch(() => {});
        load();
        if (selected?.id === id) {
            const updated = await fetch(`${API_BASE}/api/invoices/${id}`, { headers: authHeaders() })
                .then(r => r.json()).catch(() => null);
            if (updated) {
                setSelected(updated);
                if (activeTab === "nota") { setJournal(null); loadJournal(updated); }
            }
        }
    };

    const [showConfirm, setShowConfirm] = useState(false);
    const [deleting, setDeleting]       = useState(false);
    const [editModal, setEditModal]     = useState(false);
    const [editForm, setEditForm]       = useState(null);
    const [saving, setSaving]           = useState(false);
    const [editErr, setEditErr]         = useState("");

    const confirmDelete = async () => {
        if (!selected) return;
        setDeleting(true);
        await fetch(`${API_BASE}/api/invoices/${selected.id}`, {
            method: "DELETE", headers: authHeaders(),
        }).catch(() => {});
        setDeleting(false);
        close();
        load();
    };

    // ── Journal balance check
    const totalDebit  = journalEntry?.lines?.reduce((s, l) => s + (l.debitAmount  || 0), 0) ?? 0;
    const totalCredit = journalEntry?.lines?.reduce((s, l) => s + (l.creditAmount || 0), 0) ?? 0;
    const isBalanced  = Math.abs(totalDebit - totalCredit) < 0.01;

    // ── Filter tabs config
    const FILTER_TABS = [
        ["ALL",       "Toate"],
        ["ISSUED",    "Nevalidate"],
        ["VALIDATED", "Validate"],
        ["PAID",      "Încasate"],
        ["OVERDUE",   "Restante"],
    ];

    const openEdit = () => {
        if (!selected) return;
        setEditForm({
            clientId:  String(selected.clientId),
            taxRateId: String(selected.taxRateId),
            issueDate: selected.issueDate,
            dueDate:   selected.dueDate,
            notes:     selected.notes || "",
            items: selected.items?.map(it => ({
                description: it.description,
                quantity:    String(it.quantity),
                unitPrice:   String(it.unitPrice),
                accountId:   it.accountId || null,
            })) || [{ description: "", quantity: "1", unitPrice: "", accountId: null }],
        });
        setEditErr("");
        setEditModal(true);
    };

    const saveEdit = async () => {
        if (!selected || !editForm) return;
        if (!editForm.clientId)  { setEditErr("Selectează un client."); return; }
        if (!editForm.taxRateId) { setEditErr("Selectează o cotă TVA."); return; }
        if (editForm.items.some(it => !it.description || !it.unitPrice)) { setEditErr("Toate liniile trebuie să aibă descriere și preț."); return; }
        setSaving(true); setEditErr("");
        try {
            const body = {
                clientId:  parseInt(editForm.clientId),
                taxRateId: parseInt(editForm.taxRateId),
                issueDate: editForm.issueDate,
                dueDate:   editForm.dueDate,
                notes:     editForm.notes || null,
                items: editForm.items.map(it => ({
                    description: it.description,
                    quantity:    parseFloat(it.quantity) || 1,
                    unitPrice:   parseFloat(it.unitPrice) || 0,
                    accountId:   it.accountId || null,
                })),
            };
            const res = await fetch(`${API_BASE}/api/invoices/${selected.id}`, {
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

    const unvalidate = async () => {
        if (!selected) return;
        await fetch(`${API_BASE}/api/invoices/${selected.id}/unvalidate`, {
            method: "POST", headers: authHeaders(),
        }).catch(() => {});
        const updated = await fetch(`${API_BASE}/api/invoices/${selected.id}`, { headers: authHeaders() }).then(r => r.json()).catch(() => null);
        if (updated) setSelected(updated);
        load();
    };

    const setEditItem = (i, field, val) => setEditForm(f => {
        const items = [...f.items]; items[i] = { ...items[i], [field]: val }; return { ...f, items };
    });
    const addEditItem = () => setEditForm(f => ({ ...f, items: [...f.items, { description: "", quantity: "1", unitPrice: "", accountId: null }] }));
    const delEditItem = i  => setEditForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }));

    return (
        <div style={{ padding: "36px 40px", fontFamily: "'Outfit',sans-serif", color: C.text, background: C.bg, minHeight: "100vh" }}>

            {/* ── HEADER ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <button onClick={openCreate} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    background: "#7b9cba", border: "none", borderRadius: 10,
                    padding: "9px 18px", color: C.isDark ? "#0a0f17" : "#fff",
                    fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                }}>
                    <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>+</span> Factură nouă
                </button>
            </div>

            {/* ── FILTER TABS ── */}
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

            {/* ── TABLE ── */}
            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}><Spin C={C} /></div>
            ) : filtered.length === 0 ? (
                <Empty label={filter === "ALL" ? "Creează prima factură" : `Nicio factură cu status „${STATUS[filter]?.label || filter}"`} onAdd={openCreate} C={C} />
            ) : (
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                        <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                            {["Nr. Factură", "Client", "Dată emitere", "Scadență", "Valoare", "Status", ""].map((h, i) => (
                                <th key={i} style={{
                                    fontSize: 10, color: C.textDim, textTransform: "uppercase",
                                    letterSpacing: "0.7px", fontWeight: 600,
                                    padding: "12px 20px", textAlign: i === 6 ? "right" : "left",
                                }}>{h}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map((inv, i) => (
                            <InvRow key={inv.id} inv={inv} i={i} C={C}
                                    onClick={() => openView(inv)}
                                    onAction={action} />
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                MODAL: CREARE FACTURĂ
            ══════════════════════════════════════════════════════ */}
            {modal === "create" && (
                <Overlay onClose={close} C={C}>
                    <div style={{
                        background: C.card, border: `1px solid ${C.border2}`,
                        borderRadius: 18, width: "100%", maxWidth: 640,
                        maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column",
                    }}>
                        {/* Header modal */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "20px 24px", borderBottom: `1px solid ${C.border}`,
                            position: "sticky", top: 0, background: C.card, zIndex: 2,
                        }}>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>Factură nouă</h2>
                                <p style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>
                                    Se creează ca <strong style={{ color: STATUS.ISSUED.color }}>Nevalidată</strong> — validează când ești pregătit
                                </p>
                            </div>
                            <button onClick={close} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

                            {/* Client + TVA */}
                            <div style={{ display: "flex", gap: 12 }}>
                                <Sel label="Client *" val={form.clientId} set={v => setForm(f => ({ ...f, clientId: v }))} C={C}>
                                    <option value="">Selectează client...</option>
                                    {clients.filter(c => c.isActive !== false).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </Sel>

                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Cotă TVA *</label>
                                    <select value={form.taxRateId} onChange={e => setForm(f => ({ ...f, taxRateId: e.target.value }))}
                                            style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: form.taxRateId ? C.text : C.textDim, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                        <option value="">Selectează cota...</option>
                                        {taxRates.filter(t => t.isActive !== false && !t.name?.startsWith("Custom ")).map(t => (
                                            <option key={t.id} value={t.id}>{t.name} ({t.rate}%){t.isDefault ? "" : ""}</option>
                                        ))}
                                        <option value="custom">✏ Cotă personalizată...</option>
                                    </select>
                                    {isCustomRate && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                                            <input type="number" min="0" max="100" step="0.1"
                                                   value={customRate} onChange={e => setCustomRate(e.target.value)}
                                                   placeholder="Ex: 21" style={{ ...inputStyle(C), flex: 1 }} />
                                            <span style={{ fontSize: 13, color: C.textMid }}>%</span>
                                            {customRate && (
                                                <span style={{ fontSize: 12, color: "#7aab8a", whiteSpace: "nowrap" }}>
                                                    = RON {fmt(subtotal * (parseFloat(customRate) / 100))} TVA
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Date */}
                            <div style={{ display: "flex", gap: 12 }}>
                                <FInput label="Dată emitere *" val={form.issueDate} set={v => setForm(f => ({ ...f, issueDate: v }))} type="date" C={C} />
                                <FInput label="Scadență *"     val={form.dueDate}   set={v => setForm(f => ({ ...f, dueDate: v }))}   type="date" C={C} />
                            </div>

                            {/* Linii factură */}
                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Linii factură</label>
                                    <button onClick={addItem} style={{ background: "#7b9cba18", border: "1px solid #7b9cba30", borderRadius: 7, padding: "4px 10px", color: "#7b9cba", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                        + Adaugă linie
                                    </button>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 60px 90px 1fr 80px 28px", gap: 6, marginBottom: 6 }}>
                                    {["Descriere", "Cant.", "Preț unit.", "Cont venituri", "Total", ""].map((h, i) => (
                                        <span key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", padding: "0 2px" }}>{h}</span>
                                    ))}
                                </div>

                                {form.items.map((item, i) => {
                                    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                                    return (
                                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 60px 90px 1fr 80px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                                            <input value={item.description} onChange={e => setItem(i, "description", e.target.value)} placeholder="Descriere serviciu/produs" style={inputStyle(C)} />
                                            <input value={item.quantity}    onChange={e => setItem(i, "quantity", e.target.value)}    type="number" min="0" style={inputStyle(C)} />
                                            <input value={item.unitPrice}   onChange={e => setItem(i, "unitPrice", e.target.value)}   type="number" min="0" placeholder="0.00" style={inputStyle(C)} />
                                            <InlineAccSearch
                                                val={item.accountId}
                                                set={v => setItem(i, "accountId", v)}
                                                options={revenueAccounts}
                                                search={accSearch}
                                                setSearch={setAccSearch}
                                                C={C}
                                            />
                                            <div style={{ fontSize: 13, color: C.textMid, padding: "0 4px", textAlign: "right", whiteSpace: "nowrap" }}>RON {fmt(lineTotal)}</div>
                                            {form.items.length > 1
                                                ? <button onClick={() => delItem(i)} style={{ background: "none", border: "none", color: "#b07a7a", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
                                                : <div />}
                                        </div>
                                    );
                                })}

                                <div style={{ marginTop: 12, borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                    <TotalRow label="Subtotal"             val={`RON ${fmt(subtotal)}`} C={C} />
                                    <TotalRow label={`TVA (${effectiveRate}%)`} val={`RON ${fmt(taxAmt)}`}  C={C} />
                                    <TotalRow label="Total"                val={`RON ${fmt(total)}`}    C={C} bold />
                                </div>
                            </div>

                            <FInput label="Observații" val={form.notes} set={v => setForm(f => ({ ...f, notes: v }))} ph="Observații opționale..." C={C} multiline />

                            {err && (
                                <p style={{ fontSize: 13, color: "#b07a7a", margin: 0, padding: "8px 12px", background: "#b07a7a18", borderRadius: 8, border: "1px solid #b07a7a30" }}>
                                    ⚠ {err}
                                </p>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0, background: C.card }}>
                            <button onClick={close} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Anulează
                            </button>
                            <button onClick={save} disabled={saving} style={{ background: "#7b9cba", border: "none", borderRadius: 9, padding: "9px 22px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Se creează..." : "Creare factură"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ══════════════════════════════════════════════════════
                MODAL: VIZUALIZARE FACTURĂ
            ══════════════════════════════════════════════════════ */}
            {modal === "view" && selected && (
                <Overlay onClose={close} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>

                        {/* Header modal */}
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "22px 24px 18px", borderBottom: `1px solid ${C.border}` }}>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                    <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.3px" }}>{selected.invoiceNumber}</h2>
                                    <StatusBadge status={selected.status} />
                                </div>
                                <p style={{ fontSize: 13, color: C.textMid, margin: 0 }}>
                                    {selected.clientName}{selected.clientTaxId && ` · ${selected.clientTaxId}`}
                                </p>
                            </div>
                            <button onClick={close} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
                            <TabBtn label="Factură" active={activeTab === "invoice"} onClick={() => switchTab("invoice")} C={C} />
                            {HAS_JOURNAL.includes(selected.status) && (
                                <TabBtn label="Notă Contabilă" active={activeTab === "nota"} onClick={() => switchTab("nota")} C={C} accent />
                            )}
                        </div>

                        {/* ── TAB: FACTURĂ ── */}
                        {activeTab === "invoice" && (
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

                                {/* Info grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                    <InfoBlock label="Dată emitere" val={fmtDate(selected.issueDate)} C={C} />
                                    <InfoBlock label="Scadență"     val={fmtDate(selected.dueDate)}   C={C} />
                                    <InfoBlock label="Cotă TVA"     val={selected.taxRateName ? `${selected.taxRateName} (${selected.taxRate}%)` : "—"} C={C} />
                                    <InfoBlock label="Client CIF"   val={selected.clientTaxId || "—"} C={C} />
                                </div>

                                {/* Linii */}
                                {selected.items?.length > 0 && (
                                    <div>
                                        <p style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600, margin: "0 0 10px" }}>Linii factură</p>
                                        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                <thead>
                                                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}>
                                                    {["Descriere", "Cant.", "Preț unit.", "Total"].map((h, i) => (
                                                        <th key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600, padding: "10px 14px", textAlign: i === 0 ? "left" : "right" }}>{h}</th>
                                                    ))}
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {selected.items.map((it, i) => (
                                                    <tr key={i} style={{ borderBottom: i < selected.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                                        <td style={{ padding: "10px 14px", fontSize: 13, color: C.text }}>
                                                            <div>{it.description}</div>
                                                            {it.accountName && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{it.accountName}</div>}
                                                        </td>
                                                        <td style={{ padding: "10px 14px", fontSize: 13, color: C.textMid, textAlign: "right" }}>{fmt(it.quantity)}</td>
                                                        <td style={{ padding: "10px 14px", fontSize: 13, color: C.textMid, textAlign: "right" }}>RON {fmt(it.unitPrice)}</td>
                                                        <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600, color: C.text, textAlign: "right" }}>RON {fmt(it.total)}</td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Totaluri */}
                                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, paddingTop: 4 }}>
                                    <TotalRow label="Subtotal"                         val={`RON ${fmt(selected.subtotal)}`}  C={C} />
                                    <TotalRow label={`TVA (${selected.taxRate ?? 0}%)`} val={`RON ${fmt(selected.taxAmount)}`} C={C} />
                                    <TotalRow label="Total"                            val={`RON ${fmt(selected.total)}`}     C={C} bold />
                                </div>

                                {selected.notes && (
                                    <div style={{ background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                                        <p style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 6px" }}>Observații</p>
                                        <p style={{ fontSize: 13, color: C.textMid, margin: 0 }}>{selected.notes}</p>
                                    </div>
                                )}

                                {/* ── INFO BANNERS — sus, cu informatii despre stadiu ── */}
                                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>

                                    {selected.status === "ISSUED" && (
                                        <div style={{ background: "#b09a6a10", border: "1px solid #b09a6a25", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#b09a6a", fontSize: 15 }}>⚠</span>
                                            <p style={{ fontSize: 12, color: "#b09a6a", margin: 0 }}>
                                                Factură nevalidată — nu apare în rapoarte. Validează pentru a înregistra în contabilitate.
                                            </p>
                                        </div>
                                    )}

                                    {(selected.status === "VALIDATED" || selected.status === "OVERDUE") && (
                                        <div style={{ background: "#7b9cba10", border: "1px solid #7b9cba25", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#7b9cba", fontSize: 15 }}>ℹ</span>
                                            <p style={{ fontSize: 12, color: "#7b9cba", margin: 0 }}>
                                                Factură înregistrată contabil. Plata se înregistrează din modulul <strong>Bancă</strong>.
                                            </p>
                                        </div>
                                    )}

                                    {selected.status === "PAID" && (
                                        <div style={{ background: "#7aab8a10", border: "1px solid #7aab8a25", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#7aab8a", fontSize: 15 }}>✓</span>
                                            <p style={{ fontSize: 12, color: "#7aab8a", margin: 0 }}>Factură încasată integral. Pentru a o șterge, anulează mai întâi plata din modulul <strong>Bancă</strong>.</p>
                                        </div>
                                    )}

                                    {selected.status === "VOID" && (
                                        <div style={{ background: "#4b556318", border: "1px solid #4b556330", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ color: "#6b7280", fontSize: 15 }}>⊘</span>
                                            <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>Factură anulată — nu are efect contabil.</p>
                                        </div>
                                    )}
                                </div>

                                {/* ── BUTOANE — jos, pe aceeași linie ── */}
                                {selected.status !== "PAID" && selected.status !== "VOID" && (
                                    <div style={{ display: "flex", gap: 8, alignItems: "center", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>

                                        {selected.status === "ISSUED" && (
                                            <>
                                                <ActionBtn label="✓ Validează factura" color="#7aab8a" onClick={() => action(selected.id, "validate")} C={C} />
                                                <button onClick={openEdit} style={{ background: C.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "8px 16px", color: C.textMid, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                                    ✎ Editează
                                                </button>
                                            </>
                                        )}

                                        {selected.status === "VALIDATED" && (
                                            <button onClick={unvalidate} style={{ background: "#b09a6a10", border: "1px solid #b09a6a30", borderRadius: 9, padding: "8px 16px", color: "#b09a6a", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                                Devalidează
                                            </button>
                                        )}

                                        <div style={{ marginLeft: "auto" }}>
                                            <button onClick={() => setShowConfirm(true)} style={{ background: "transparent", border: "1px solid #b07a7a40", borderRadius: 9, padding: "8px 16px", color: "#b07a7a", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                                Șterge factura
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}



                        {/* ── TAB: NOTĂ CONTABILĂ ── */}
                        {activeTab === "nota" && (
                            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                                {journalLoading ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}><Spin C={C} /></div>
                                ) : !journalEntry ? (
                                    <div style={{ textAlign: "center", padding: 40 }}>
                                        <p style={{ fontSize: 14, color: C.textMid }}>Nota contabilă nu a putut fi încărcată.</p>
                                        <p style={{ fontSize: 12, color: C.textDim, marginTop: 6 }}>Verifică că planul de conturi a fost configurat corect.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Entry header */}
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            <InfoBlock label="Număr notă" val={journalEntry.referenceNumber} C={C} />
                                            <InfoBlock label="Data"        val={fmtDate(journalEntry.entryDate)} C={C} />
                                        </div>
                                        <InfoBlock label="Descriere" val={journalEntry.description} C={C} />

                                        {/* Tabel DR/CR */}
                                        <div>
                                            <p style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600, margin: "0 0 10px" }}>Formulă contabilă</p>
                                            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
                                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                                    <thead>
                                                    <tr style={{ background: C.isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)", borderBottom: `1px solid ${C.border}` }}>
                                                        {["Tip", "Cont", "Denumire cont", "Sumă (RON)"].map((h, i) => (
                                                            <th key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.6px", fontWeight: 600, padding: "10px 16px", textAlign: i === 3 ? "right" : "left", width: i === 0 ? 70 : i === 1 ? 70 : "auto" }}>{h}</th>
                                                        ))}
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {journalEntry.lines?.map((line, i) => {
                                                        const isDebit  = (line.debitAmount  || 0) > 0;
                                                        const amount   = isDebit ? line.debitAmount : line.creditAmount;
                                                        const tipColor = isDebit ? "#7b9cba" : "#7aab8a";
                                                        const tipLabel = isDebit ? "Debit" : "Credit";
                                                        return (
                                                            <tr key={i} style={{ borderBottom: i < journalEntry.lines.length - 1 ? `1px solid ${C.border}` : "none" }}>
                                                                <td style={{ padding: "12px 16px" }}>
                                                                    <span style={{ fontSize: 11, fontWeight: 600, color: tipColor, background: `${tipColor}15`, border: `1px solid ${tipColor}25`, borderRadius: 5, padding: "3px 8px" }}>{tipLabel}</span>
                                                                </td>
                                                                <td style={{ padding: "12px 16px" }}>
                                                                    <span style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: tipColor }}>{line.accountCode}</span>
                                                                </td>
                                                                <td style={{ padding: "12px 16px" }}>
                                                                    <p style={{ fontSize: 13, color: C.text, margin: 0, fontWeight: 500 }}>{line.accountName}</p>
                                                                    {line.description && <p style={{ fontSize: 11, color: C.textDim, margin: "2px 0 0" }}>{line.description}</p>}
                                                                </td>
                                                                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                                                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmt(amount)}</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Verificare echilibru */}
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isBalanced ? (C.isDark ? "#7aab8a10" : "#f0faf4") : (C.isDark ? "#b07a7a10" : "#fff0f0"), border: `1px solid ${isBalanced ? "#7aab8a30" : "#b07a7a30"}`, borderRadius: 10, padding: "12px 16px" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                                                <span style={{ fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px" }}>Verificare echilibru</span>
                                                <span style={{ fontSize: 13, color: isBalanced ? "#7aab8a" : "#b07a7a", fontWeight: 600 }}>
                                                    {isBalanced ? "✓ Înregistrare echilibrată — Debit = Credit" : "⚠ Dezechilibru detectat"}
                                                </span>
                                            </div>
                                            <div style={{ display: "flex", gap: 24, textAlign: "right" }}>
                                                <div>
                                                    <p style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Total Debit</p>
                                                    <p style={{ fontSize: 14, fontWeight: 700, color: "#7b9cba", margin: "2px 0 0" }}>RON {fmt(totalDebit)}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0 }}>Total Credit</p>
                                                    <p style={{ fontSize: 14, fontWeight: 700, color: "#7aab8a", margin: "2px 0 0" }}>RON {fmt(totalCredit)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Formulă simplificată */}
                                        <div style={{ background: C.isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 16px" }}>
                                            <p style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px", fontWeight: 600 }}>Formulă simplificată</p>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                    {journalEntry.lines?.filter(l => (l.debitAmount || 0) > 0).map((l, i) => (
                                                        <span key={i} style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "#7b9cba", background: "#7b9cba12", border: "1px solid #7b9cba25", borderRadius: 6, padding: "3px 8px" }}>{l.accountCode}</span>
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: 16, color: C.textDim, fontWeight: 300 }}>=</span>
                                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                                                    {journalEntry.lines?.filter(l => (l.creditAmount || 0) > 0).map((l, i) => (
                                                        <span key={i} style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: "#7aab8a", background: "#7aab8a12", border: "1px solid #7aab8a25", borderRadius: 6, padding: "3px 8px" }}>{l.accountCode}</span>
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

            {/* EDIT MODAL */}
            {editModal && editForm && (
                <Overlay onClose={() => setEditModal(false)} C={C}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, background: C.card, zIndex: 2 }}>
                            <div>
                                <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: 0 }}>Editează factura</h2>
                                <p style={{ fontSize: 12, color: C.textDim, marginTop: 3 }}>{selected?.invoiceNumber} — doar facturile nevalidate pot fi editate</p>
                            </div>
                            <button onClick={() => setEditModal(false)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, color: C.textMid, fontSize: 14, cursor: "pointer", padding: "4px 10px" }}>✕</button>
                        </div>

                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Client *</label>
                                    <select value={editForm.clientId} onChange={e => setEditForm(f => ({ ...f, clientId: e.target.value }))}
                                            style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                        {clients.filter(c => c.isActive !== false).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Cotă TVA *</label>
                                    <select value={editForm.taxRateId} onChange={e => setEditForm(f => ({ ...f, taxRateId: e.target.value }))}
                                            style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", cursor: "pointer", appearance: "none" }}>
                                        {taxRates.filter(t => t.isActive !== false).map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: 12 }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Dată emitere *</label>
                                    <input type="date" value={editForm.issueDate} onChange={e => setEditForm(f => ({ ...f, issueDate: e.target.value }))} style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }} />
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Scadență *</label>
                                    <input type="date" value={editForm.dueDate} onChange={e => setEditForm(f => ({ ...f, dueDate: e.target.value }))} style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif" }} />
                                </div>
                            </div>

                            <div>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                    <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Linii factură</label>
                                    <button onClick={addEditItem} style={{ background: "#7b9cba18", border: "1px solid #7b9cba30", borderRadius: 7, padding: "4px 10px", color: "#7b9cba", fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>+ Adaugă linie</button>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 60px 90px 1fr 80px 28px", gap: 6, marginBottom: 6 }}>
                                    {["Descriere", "Cant.", "Preț unit.", "Cont venituri", "Total", ""].map((h, i) => (
                                        <span key={i} style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                                    ))}
                                </div>
                                {editForm.items.map((item, i) => {
                                    const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                                    return (
                                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 60px 90px 1fr 80px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
                                            <input value={item.description} onChange={e => setEditItem(i, "description", e.target.value)} placeholder="Descriere" style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", width: "100%" }} />
                                            <input value={item.quantity} onChange={e => setEditItem(i, "quantity", e.target.value)} type="number" min="0" style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", width: "100%" }} />
                                            <input value={item.unitPrice} onChange={e => setEditItem(i, "unitPrice", e.target.value)} type="number" min="0" placeholder="0.00" style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", width: "100%" }} />
                                            <InlineAccSearch
                                                val={item.accountId}
                                                set={v => setEditItem(i, "accountId", v)}
                                                options={revenueAccounts}
                                                search={editAccSearch}
                                                setSearch={setEditAccSearch}
                                                C={C}
                                            />
                                            <div style={{ fontSize: 13, color: C.textMid, textAlign: "right" }}>RON {fmt(lineTotal)}</div>
                                            {editForm.items.length > 1
                                                ? <button onClick={() => delEditItem(i)} style={{ background: "none", border: "none", color: "#b07a7a", cursor: "pointer", fontSize: 16 }}>×</button>
                                                : <div />}
                                        </div>
                                    );
                                })}
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>Observații</label>
                                <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Observații opționale..." style={{ background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", resize: "none" }} />
                            </div>

                            {editErr && <p style={{ fontSize: 13, color: "#b07a7a", margin: 0, padding: "8px 12px", background: "#b07a7a18", borderRadius: 8, border: "1px solid #b07a7a30" }}>⚠ {editErr}</p>}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 24px", borderTop: `1px solid ${C.border}`, position: "sticky", bottom: 0, background: C.card }}>
                            <button onClick={() => setEditModal(false)} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Anulează</button>
                            <button onClick={saveEdit} disabled={saving} style={{ background: "#7b9cba", border: "none", borderRadius: 9, padding: "9px 22px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
                                {saving ? "Se salvează..." : "Salvează modificările"}
                            </button>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* CONFIRM DELETE */}
            {showConfirm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
                    <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: 18, padding: "32px", maxWidth: 380, width: "calc(100% - 48px)" }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: "0 0 10px" }}>Ștergi factura?</h3>
                        <p style={{ fontSize: 13, color: C.textMid, margin: "0 0 6px" }}>
                            <strong>{selected?.invoiceNumber}</strong> — {selected?.clientName}
                        </p>
                        <p style={{ fontSize: 13, color: C.textDim, margin: "0 0 24px", lineHeight: 1.6 }}>
                            Această acțiune este ireversibilă și va șterge factura împreună cu nota contabilă asociată.
                        </p>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                            <button onClick={() => setShowConfirm(false)} style={{ background: "transparent", border: `1px solid ${C.border2}`, borderRadius: 9, padding: "9px 18px", color: C.textMid, fontSize: 13, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                                Anulează
                            </button>
                            <button onClick={confirmDelete} disabled={deleting} style={{ background: "#b07a7a", border: "none", borderRadius: 9, padding: "9px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", opacity: deleting ? 0.7 : 1 }}>
                                {deleting ? "Se șterge..." : "Da, șterge"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
                @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                @keyframes fadeIn { from{opacity:0} to{opacity:1} }
                @keyframes spin   { to{transform:rotate(360deg)} }
                input[type="date"]::-webkit-calendar-picker-indicator { filter:${C.isDark ? "invert(1)" : "none"}; opacity:0.5; }
                input::placeholder { color:${C.textDim}; }
                input:focus, select:focus { outline:none; border-color:#7b9cba !important; }
                button:focus { outline:none; }
                .inv-row:hover { background:${C.isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"}!important; }
                .inv-row:hover .inv-actions { opacity:1!important; }
            `}</style>
        </div>
    );
}

// ── Sub-componente ────────────────────────────────────────────────────────────

function TabBtn({ label, active, onClick, C, accent }) {
    const color = accent ? "#9b8fba" : C.blue;
    return (
        <button onClick={onClick} style={{
            background: "none", border: "none",
            borderBottom: active ? `2px solid ${color}` : "2px solid transparent",
            padding: "12px 16px", fontSize: 13, fontWeight: active ? 600 : 400,
            color: active ? color : C.textMid, cursor: "pointer",
            fontFamily: "'Outfit',sans-serif", transition: "all 0.15s", marginBottom: -1,
        }}>
            {label}
        </button>
    );
}

function InvRow({ inv, i, C, onClick, onAction }) {
    const s = STATUS[inv.status] || STATUS.ISSUED;
    const isOverdue = inv.status === "VALIDATED" && new Date(inv.dueDate) < new Date();
    return (
        <tr className="inv-row" onClick={onClick} style={{ borderBottom: `1px solid ${C.border}`, cursor: "pointer", transition: "background 0.12s", animation: `fadeUp 0.3s ease ${i * 25}ms both` }}>
            <td style={{ padding: "14px 20px" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{inv.invoiceNumber}</span>
            </td>
            <td style={{ padding: "14px 20px" }}>
                <p style={{ fontSize: 13, color: C.text, margin: 0, fontWeight: 500 }}>{inv.clientName}</p>
                {inv.clientTaxId && <p style={{ fontSize: 11, color: C.textDim, margin: "2px 0 0" }}>{inv.clientTaxId}</p>}
            </td>
            <td style={{ padding: "14px 20px", fontSize: 13, color: C.textMid }}>{fmtDate(inv.issueDate)}</td>
            <td style={{ padding: "14px 20px" }}>
                {/* Scadența apare roșie dacă factura e VALIDATED și a expirat */}
                <span style={{ fontSize: 13, color: isOverdue ? "#b07a7a" : C.textMid }}>{fmtDate(inv.dueDate)}</span>
            </td>
            <td style={{ padding: "14px 20px" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>RON {fmt(inv.total)}</span>
            </td>
            <td style={{ padding: "14px 20px" }}>
                <StatusBadge status={inv.status} />
            </td>
            <td style={{ padding: "14px 20px", textAlign: "right" }}>
                <div className="inv-actions" style={{ display: "flex", gap: 6, justifyContent: "flex-end", opacity: 0, transition: "opacity 0.15s" }} onClick={e => e.stopPropagation()}>
                    {/* Buton rapid validare — doar pentru ISSUED */}
                    {inv.status === "ISSUED" && (
                        <QuickBtn label="Validează" color="#7aab8a" onClick={() => onAction(inv.id, "validate")} />
                    )}

                </div>
            </td>
        </tr>
    );
}

function StatusBadge({ status }) {
    const s = STATUS[status] || STATUS.ISSUED;
    return (
        <span style={{ fontSize: 11, color: s.color, background: s.bg, border: `1px solid ${s.color}30`, borderRadius: 6, padding: "3px 9px", fontWeight: 500 }}>
            {s.label}
        </span>
    );
}

function QuickBtn({ label, color, onClick }) {
    return (
        <button onClick={onClick} style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 7, padding: "5px 10px", color, fontSize: 11, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
            {label}
        </button>
    );
}

function ActionBtn({ label, color, onClick, C, outline }) {
    return (
        <button onClick={onClick} style={{
            background: outline ? `${color}12` : color,
            border: `1px solid ${outline ? color + "40" : color}`,
            borderRadius: 9, padding: "9px 18px",
            color: outline ? color : (C.isDark ? "#0a0f17" : "#fff"),
            fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'Outfit',sans-serif",
        }}>
            {label}
        </button>
    );
}

function TotalRow({ label, val, C, bold }) {
    return (
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: C.textMid }}>{label}</span>
            <span style={{ fontSize: bold ? 16 : 13, fontWeight: bold ? 700 : 500, color: bold ? C.text : C.textMid, minWidth: 120, textAlign: "right" }}>{val}</span>
        </div>
    );
}

function InfoBlock({ label, val, C }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 10, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{label}</span>
            <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{val}</span>
        </div>
    );
}

function FInput({ label, val, set, ph, type = "text", C, multiline }) {
    const style = { background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", transition: "border-color 0.2s", width: "100%", resize: "none" };
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            <label style={{ fontSize: 11, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{label}</label>
            {multiline
                ? <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={3} style={style} />
                : <input type={type} value={val} onChange={e => set(e.target.value)} placeholder={ph} style={style} />}
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

function inputStyle(C) {
    return { background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: C.text, fontFamily: "'Outfit',sans-serif", width: "100%", transition: "border-color 0.2s" };
}

function Empty({ label, onAdd, C }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320, background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#7b9cba18", border: "1px solid #7b9cba25", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="1" width="12" height="14" rx="2" stroke="#7b9cba" strokeWidth="1.3" />
                    <path d="M5 5h6M5 8h6M5 11h4" stroke="#7b9cba" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
            </div>
            <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.text, margin: 0 }}>Nicio factură găsită</p>
                <p style={{ fontSize: 13, color: C.textDim, marginTop: 6 }}>{label}</p>
            </div>
            <button onClick={onAdd} style={{ background: "#7b9cba", border: "none", borderRadius: 10, padding: "9px 20px", color: C.isDark ? "#0a0f17" : "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>
                + Factură nouă
            </button>
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

function Spin({ C }) {
    return <div style={{ width: 28, height: 28, border: `2px solid ${C.border2}`, borderTopColor: "#7b9cba", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />;
}
function InlineAccSearch({ val, set, options, search, setSearch, C }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const filtered = options.filter(a =>
        !search ||
        String(a.code).includes(search) ||
        a.name.toLowerCase().includes(search.toLowerCase())
    );
    const selected = options.find(a => a.id === val);

    useEffect(() => {
        const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} style={{ position: "relative", width: "100%" }}>
            <div onClick={() => setOpen(o => !o)}
                 style={{ background: C.bg, border: `1px solid ${open ? "#7b9cba" : C.border2}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, color: val ? C.text : C.textDim, fontFamily: "'Outfit',sans-serif", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.2s", gap: 4 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {selected ? `${selected.code} — ${selected.name}` : "Selectează cont..."}
        </span>
                <span style={{ fontSize: 9, color: C.textDim, flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
            </div>

            {open && (
                <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 99, background: C.card, border: `1px solid ${C.border2}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", overflow: "hidden", minWidth: 260 }}>
                    <div style={{ padding: "7px 8px", borderBottom: `1px solid ${C.border}` }}>
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Caută cod sau denumire..."
                            onClick={e => e.stopPropagation()}
                            style={{ width: "100%", background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 7, padding: "6px 10px", fontSize: 12, color: C.text, fontFamily: "'Outfit',sans-serif", boxSizing: "border-box" }}
                        />
                    </div>
                    <div style={{ maxHeight: 200, overflowY: "auto" }}>
                        <div
                            onClick={() => { set(null); setSearch(""); setOpen(false); }}
                            style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, color: C.textDim, borderBottom: `1px solid ${C.border}` }}
                            onMouseEnter={e => e.currentTarget.style.background = "#7b9cba12"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            — Fără cont specific
                        </div>
                        {filtered.length === 0 ? (
                            <p style={{ fontSize: 12, color: C.textDim, padding: "10px 12px", margin: 0 }}>Niciun rezultat.</p>
                        ) : filtered.map(a => (
                            <div key={a.id}
                                 onClick={() => { set(a.id); setSearch(""); setOpen(false); }}
                                 style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, background: val === a.id ? "#7b9cba18" : "transparent", transition: "background 0.1s" }}
                                 onMouseEnter={e => e.currentTarget.style.background = "#7b9cba12"}
                                 onMouseLeave={e => e.currentTarget.style.background = val === a.id ? "#7b9cba18" : "transparent"}>
                                <span style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 700, color: "#7b9cba", background: "#7b9cba12", border: "1px solid #7b9cba25", borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>{a.code}</span>
                                <span style={{ fontSize: 12, color: C.text }}>{a.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}