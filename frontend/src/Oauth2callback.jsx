// OAuth2Callback.jsx
// This component handles the redirect from the backend after Google OAuth2 login.
// Route it in App.jsx for the path /oauth2/callback
// The backend redirects here with: ?token=...&email=...&name=...&role=...

import { useEffect } from "react";

export default function OAuth2Callback({ onLogin }) {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");
        const email = params.get("email");
        const name  = params.get("name");
        const role  = params.get("role");

        if (token && email) {
            // Store exactly like normal login does
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify({ email, name, role }));

            // Clear the URL params so token isn't visible
            window.history.replaceState({}, document.title, "/");

            // Notify App.jsx
            if (onLogin) onLogin({ token, email, name, role });
        } else {
            // Nu suntem pe callback — nu face nimic
            if (onLogin) onLogin(null);
        }
    }, []);

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#16161e",
            fontFamily: "'Outfit', sans-serif",
            color: "#f0f0f8",
            flexDirection: "column",
            gap: 16,
        }}>
            <div style={{
                width: 40, height: 40,
                border: "3px solid rgba(167,139,250,0.2)",
                borderTopColor: "#a78bfa",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
            }}/>
            <p style={{ fontSize: 14, color: "#6b6b8a" }}>Signing you in with Google...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}