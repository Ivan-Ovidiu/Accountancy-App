import { useState, useEffect, useRef } from "react";

const API_BASE = "http://localhost:8080";

const SLIDES = [
    {
        image: "/Login_photo.jpg",
        quote: "Smart accounting\nfor your business.",
        sub: "Automate your books, focus on growth.",
    },
    {
        image: "/Login_photo_2.jpg",
        quote: "Real-time reports,\nzero manual work.",
        sub: "P&L, Balance Sheet and Cash Flow — always up to date.",
    },
    {
        image: "/Login_photo_3.jpg",
        quote: "AI-powered insights\nat your fingertips.",
        sub: "Anomaly detection, forecasting and natural language queries.",
    },
];

export default function Login({ onLogin, onBack }) {
    const [mode, setMode] = useState("login");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regConfirm, setRegConfirm] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const [current, setCurrent] = useState(0);
    const [next, setNext] = useState(null);
    const [nextOpacity, setNextOpacity] = useState(0);
    const timerRef = useRef(null);

    const goTo = (idx) => {
        if (idx === current || next !== null) return;
        setNext(idx);
        requestAnimationFrame(() => requestAnimationFrame(() => setNextOpacity(1)));
        setTimeout(() => { setCurrent(idx); setNext(null); setNextOpacity(0); }, 900);
    };

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCurrent(c => { goTo((c + 1) % SLIDES.length); return c; });
        }, 5000);
        return () => clearInterval(timerRef.current);
    }, [current]);

    const switchMode = (m) => { setMode(m); setError(""); setSuccess(""); };

    const handleLogin = async () => {
        if (!email || !password) { setError("Please fill in all fields."); return; }
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) { setError("Invalid email or password."); setLoading(false); return; }
            const data = await res.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({ email: data.email, name: data.name, role: data.role }));
            if (onLogin) onLogin(data);
        } catch { setError("Could not connect to server."); }
        setLoading(false);
    };

    const handleRegister = async () => {
        if (!regName || !regEmail || !regPassword || !regConfirm) { setError("Please fill in all fields."); return; }
        if (regPassword !== regConfirm) { setError("Passwords do not match."); return; }
        if (regPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
        setError(""); setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
            });
            if (res.status === 409) { setError("Email already in use."); setLoading(false); return; }
            if (!res.ok) { setError("Registration failed. Try again."); setLoading(false); return; }
            const data = await res.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({ email: data.email, name: data.name, role: data.role }));
            if (onLogin) onLogin(data);
        } catch { setError("Could not connect to server."); }
        setLoading(false);
    };

    return (
        <div style={s.root}>
            {/* LEFT: sliding artwork */}
            <div style={s.artPanel}>
                <div style={{ ...s.artBg, backgroundImage: `url(${SLIDES[current].image})`, opacity: 1, zIndex: 1 }} />
                {next !== null && (
                    <div style={{ ...s.artBg, backgroundImage: `url(${SLIDES[next].image})`, opacity: nextOpacity, zIndex: 2, transition: "opacity 0.9s ease" }} />
                )}
                <div style={{ ...s.artOverlay, zIndex: 3 }} />
                <div style={{ ...s.artContent, zIndex: 4 }}>
                    {/* ── Logo using ab-mark.svg ── */}
                    <div style={s.logoRow}>
                        <img
                            src="/Logo.svg"
                            alt="AccountBud"
                            style={{
                                height: 32,
                                width: "auto",
                                filter: "brightness(0) invert(1)",
                            }}
                        />
                    </div>

                    <div style={{ ...s.quoteBlock, opacity: next !== null ? 0 : 1, transition: "opacity 0.4s ease" }}>
                        <p style={s.quote}>
                            {SLIDES[current].quote.split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
                        </p>
                        <p style={s.quoteSub}>{SLIDES[current].sub}</p>
                    </div>

                    <div style={s.dots}>
                        {SLIDES.map((_, i) => (
                            <button key={i} onClick={() => goTo(i)} style={{ ...s.dot, width: i === current ? 24 : 6, background: i === current ? "#fff" : "rgba(255,255,255,0.35)" }} />
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: form panel */}
            <div style={s.formPanel}>
                <div style={s.formInner}>

                    {/* ── Back to Home ── */}
                    <button onClick={onBack} style={s.backBtn}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Back to Home
                    </button>

                    {/* Tab switcher */}
                    <div style={s.tabs}>
                        <button style={{ ...s.tab, ...(mode === "login" ? s.tabActive : {}) }} onClick={() => switchMode("login")}>Sign In</button>
                        <button style={{ ...s.tab, ...(mode === "register" ? s.tabActive : {}) }} onClick={() => switchMode("register")}>Sign Up</button>
                    </div>

                    {/* ── LOGIN FORM ── */}
                    {mode === "login" && (
                        <>
                            <div style={s.formTop}>
                                <h2 style={s.title}>Welcome back</h2>
                                <p style={s.subtitle}>Sign in to your account to continue</p>
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>Email</label>
                                <input style={s.input} type="email" placeholder="you@example.com" value={email}
                                       onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input style={s.input} type={showPassword ? "text" : "password"} placeholder="••••••••"
                                           value={password} onChange={(e) => setPassword(e.target.value)}
                                           onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                                    <button style={s.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            {error && <ErrorBox message={error} />}

                            <button style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }} onClick={handleLogin} disabled={loading}>
                                {loading ? <Spinner text="Signing in..." /> : "Sign In"}
                            </button>

                            <div style={s.divider}>
                                <span style={s.divLine} />
                                <span style={s.divText}>or continue with</span>
                                <span style={s.divLine} />
                            </div>

                            <button style={s.googleBtn} onClick={() => { window.location.href = "http://localhost:8080/oauth2/authorization/google"; }}>
                                <GoogleIcon />
                                Sign in with Google
                            </button>
                        </>
                    )}

                    {/* ── REGISTER FORM ── */}
                    {mode === "register" && (
                        <>
                            <div style={s.formTop}>
                                <h2 style={s.title}>Create account</h2>
                                <p style={s.subtitle}>Get started with AccountBud today</p>
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>Full name</label>
                                <input style={s.input} type="text" placeholder="John Doe" value={regName}
                                       onChange={(e) => setRegName(e.target.value)} />
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>Email</label>
                                <input style={s.input} type="email" placeholder="you@example.com" value={regEmail}
                                       onChange={(e) => setRegEmail(e.target.value)} />
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>Password</label>
                                <div style={{ position: "relative" }}>
                                    <input style={s.input} type={showPassword ? "text" : "password"} placeholder="Min. 6 characters"
                                           value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                                    <button style={s.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>Confirm password</label>
                                <input style={s.input} type="password" placeholder="••••••••" value={regConfirm}
                                       onChange={(e) => setRegConfirm(e.target.value)}
                                       onKeyDown={(e) => e.key === "Enter" && handleRegister()} />
                            </div>

                            {error && <ErrorBox message={error} />}
                            {success && <SuccessBox message={success} />}

                            <button style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }} onClick={handleRegister} disabled={loading}>
                                {loading ? <Spinner text="Creating account..." /> : "Create Account"}
                            </button>

                            <div style={s.divider}>
                                <span style={s.divLine} />
                                <span style={s.divText}>or continue with</span>
                                <span style={s.divLine} />
                            </div>

                            <button style={s.googleBtn} onClick={() => { window.location.href = "http://localhost:8080/oauth2/authorization/google"; }}>
                                <GoogleIcon />
                                Sign up with Google
                            </button>
                        </>
                    )}

                </div>
            </div>

            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        input { font-family: 'Outfit', sans-serif; }
        input::placeholder { color: #4a4a6a; }
        input:focus { outline: none; border-color: #a78bfa !important; box-shadow: 0 0 0 3px rgba(167,139,250,0.12) !important; }
        button:focus { outline: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
        </div>
    );
}

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
    );
}

function ErrorBox({ message }) {
    return (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#2a1520", border:"1.5px solid #6b2030", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#f87171" }}>
            <span>⚠</span> {message}
        </div>
    );
}

function SuccessBox({ message }) {
    return (
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0d2a1a", border:"1.5px solid #1a6b3a", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#4ade80" }}>
            <span>✓</span> {message}
        </div>
    );
}

function EyeIcon() {
    return <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3"/></svg>;
}
function EyeOffIcon() {
    return <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M2 8s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.3"/><circle cx="8" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.3"/><path d="M3 3l10 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>;
}
function Spinner({ text }) {
    return (
        <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
      <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.3)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin .8s linear infinite", display:"inline-block" }} />
            {text}
    </span>
    );
}

const s = {
    root: { display:"flex", minHeight:"100vh", fontFamily:"'Outfit', sans-serif", background:"#16161e" },
    artPanel: { flex:"0 0 46%", position:"relative", overflow:"hidden" },
    artBg: { position:"absolute", inset:0, backgroundSize:"cover", backgroundPosition:"center" },
    artOverlay: { position:"absolute", inset:0, background:"linear-gradient(170deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0.75) 100%)" },
    artContent: { position:"relative", height:"100%", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:"36px 40px 40px" },
    logoRow: { display:"flex", alignItems:"center", gap:12 },
    quoteBlock: { display:"flex", flexDirection:"column", gap:14 },
    quote: { fontSize:36, fontWeight:800, color:"#fff", lineHeight:1.15, letterSpacing:"-1px", textShadow:"0 2px 24px rgba(0,0,0,0.5)" },
    quoteSub: { fontSize:14, color:"rgba(255,255,255,0.65)", lineHeight:1.6, maxWidth:300 },
    dots: { display:"flex", alignItems:"center", gap:8 },
    dot: { height:6, borderRadius:99, border:"none", cursor:"pointer", padding:0, transition:"width 0.3s ease, background 0.3s ease" },
    formPanel: { flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#16161e", padding:"48px 40px", overflowY:"auto" },
    formInner: { width:"100%", maxWidth:400, display:"flex", flexDirection:"column", gap:20, animation:"fadeUp 0.4s ease both" },
    backBtn: { display:"flex", alignItems:"center", gap:6, background:"none", border:"none", cursor:"pointer", color:"#5a5a7a", fontSize:13, fontFamily:"'Outfit', sans-serif", padding:"4px 0", width:"fit-content", transition:"color 0.2s" },
    tabs: { display:"flex", background:"#1f1f2e", borderRadius:12, padding:4, gap:4 },
    tab: { flex:1, padding:"10px", fontSize:14, fontWeight:500, border:"none", borderRadius:9, cursor:"pointer", background:"transparent", color:"#5a5a7a", fontFamily:"'Outfit', sans-serif", transition:"all 0.2s" },
    tabActive: { background:"#2e2e45", color:"#f0f0f8" },
    formTop: { display:"flex", flexDirection:"column", gap:6 },
    title: { fontSize:28, fontWeight:700, color:"#f0f0f8", letterSpacing:"-0.8px", lineHeight:1.1 },
    subtitle: { fontSize:13, color:"#6b6b8a" },
    field: { display:"flex", flexDirection:"column", gap:7 },
    label: { fontSize:13, fontWeight:500, color:"#9090b0", letterSpacing:"0.2px" },
    input: { width:"100%", background:"#1f1f2e", border:"1.5px solid #2a2a40", borderRadius:12, padding:"12px 16px", fontSize:15, color:"#f0f0f8", transition:"border-color .2s, box-shadow .2s" },
    eyeBtn: { position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#5a5a7a", display:"flex", alignItems:"center", padding:0 },
    submitBtn: { width:"100%", background:"linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", color:"#fff", border:"none", borderRadius:12, padding:"14px 20px", fontSize:15, fontWeight:600, fontFamily:"'Outfit', sans-serif", cursor:"pointer", transition:"opacity .2s" },
    divider: { display:"flex", alignItems:"center", gap:12 },
    divLine: { flex:1, height:1, background:"#2a2a40" },
    divText: { fontSize:12, color:"#4a4a6a", whiteSpace:"nowrap" },
    googleBtn: { width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"#1f1f2e", border:"1.5px solid #2a2a40", borderRadius:12, padding:"12px 16px", color:"#d0d0e8", fontSize:14, fontWeight:500, fontFamily:"'Outfit', sans-serif", cursor:"pointer", transition:"border-color .2s, background .2s" },
};